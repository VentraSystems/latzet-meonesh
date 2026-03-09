import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyTaskSubmitted } from '../../utils/notifications';
import { showAlert } from '../../utils/alert';
import * as ImagePicker from 'expo-image-picker';

export default function TasksListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [activePunishment, setActivePunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskNote, setTaskNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'punishments'),
      where('childId', '==', user!.uid),
      where('status', '==', 'active')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const punishmentData = snapshot.docs[0].data();
        setActivePunishment({ id: snapshot.docs[0].id, ...punishmentData });
      } else {
        setActivePunishment(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const pickPhoto = async () => {
    if (Platform.OS === 'web') {
      // Web: use file input via image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('אין הרשאה', 'נדרשת הרשאת גישה לגלריה');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') { pickPhoto(); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('אין הרשאה', 'נדרשת הרשאת גישה למצלמה');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string, punishmentId: string, taskId: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `task-photos/${punishmentId}/${taskId}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (e) {
      console.error('Photo upload failed:', e);
      return null;
    }
  };

  const handleTaskComplete = async (task: any) => {
    if (task.type === 'quiz') {
      navigation.navigate('Quiz', {
        quiz: task.quizData,
        punishmentId: activePunishment.id,
        taskId: task.id,
      });
      return;
    }
    setSelectedTask(task);
    setPhotoUri(null);
    setTaskNote('');
  };

  const submitTask = async () => {
    if (!selectedTask) return;
    setUploading(true);

    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadPhoto(photoUri, activePunishment.id, selectedTask.id);
      }

      const updatedTasks = activePunishment.tasks.map((t: any) =>
        t.id === selectedTask.id
          ? {
              ...t,
              status: 'submitted',
              submittedAt: new Date(),
              childNote: taskNote,
              ...(photoUrl ? { photoUrl } : {}),
            }
          : t
      );

      await updateDoc(doc(db, 'punishments', activePunishment.id), { tasks: updatedTasks });

      const childDoc = await getDoc(doc(db, 'users', user!.uid));
      const childName = childDoc.exists() ? childDoc.data().name : 'הילד';

      await notifyTaskSubmitted(
        activePunishment.parentId,
        childName,
        selectedTask.title,
        activePunishment.id,
        selectedTask.id
      );

      showAlert('נשלח! 🎉', photoUrl ? 'המשימה נשלחה עם תמונת הוכחה!' : 'המשימה נשלחה לאישור ההורה', [
        {
          text: 'אישור',
          onPress: () => { setSelectedTask(null); setTaskNote(''); setPhotoUri(null); },
        },
      ]);
    } catch (error) {
      showAlert('שגיאה', 'לא הצלחנו לשלוח את המשימה');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#27AE60';
      case 'submitted': return '#F39C12';
      case 'rejected': return '#E74C3C';
      default: return '#7F8C8D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'אושר ✅';
      case 'submitted': return 'ממתין לאישור ⏳';
      case 'rejected': return 'נדחה ❌';
      default: return 'ממתין להגשה 📝';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
      </View>
    );
  }

  if (!activePunishment) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🎉</Text>
        <Text style={styles.emptyTitle}>אין לך עונש כרגע!</Text>
        <Text style={styles.emptyText}>תהנה מהזמן החופשי שלך 😊</Text>
      </View>
    );
  }

  if (selectedTask) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.submitContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.submitTitle}>השלמת את המשימה?</Text>

          <View style={styles.taskCard}>
            <Text style={styles.taskTitle}>{selectedTask.title}</Text>
            <Text style={styles.taskDescription}>{selectedTask.description}</Text>
          </View>

          {/* Photo Upload */}
          <View style={styles.photoSection}>
            <Text style={styles.photoSectionTitle}>📸 הוסף תמונת הוכחה (אופציונלי)</Text>
            {photoUri ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.photoImg} resizeMode="cover" />
                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                  <Text style={styles.removePhotoText}>✕ הסר תמונה</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                    <Text style={styles.photoBtnText}>📷 צלם תמונה</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
                  <Text style={styles.photoBtnText}>🖼️ בחר מהגלריה</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.noteLabel}>הוסף הערה (אופציונלי)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="למשל: 'סידרתי את כל הדברים בארון'"
            value={taskNote}
            onChangeText={setTaskNote}
            multiline
            numberOfLines={4}
            textAlign="right"
          />

          <TouchableOpacity
            style={styles.submitWrapper}
            onPress={submitTask}
            disabled={uploading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.submitButton}>
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>שלח לאישור ההורה {photoUri ? '📸' : ''}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => { setSelectedTask(null); setTaskNote(''); setPhotoUri(null); }}
          >
            <Text style={styles.cancelButtonText}>ביטול</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const approved = activePunishment.tasks.filter((t: any) => t.status === 'approved').length;
  const total = activePunishment.tasks.length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>המשימות שלך</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{approved} / {total}</Text>
        </View>
      </View>

      {activePunishment.tasks.map((task: any) => (
        <View
          key={task.id}
          style={[styles.taskCard, task.status === 'approved' && styles.completedTaskCard]}
        >
          <View style={styles.taskHeader}>
            <Text style={styles.taskIcon}>{task.type === 'quiz' ? '🧠' : '📝'}</Text>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDescription}>{task.description}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
              {getStatusText(task.status)}
            </Text>
          </View>

          {task.status === 'rejected' && task.rejectedReason && (
            <View style={styles.rejectionNote}>
              <Text style={styles.rejectionLabel}>סיבת הדחייה:</Text>
              <Text style={styles.rejectionText}>{task.rejectedReason}</Text>
            </View>
          )}

          {task.status === 'pending' && (
            <TouchableOpacity
              style={styles.startWrapper}
              onPress={() => handleTaskComplete(task)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#c0392b', '#e74c3c']} style={styles.startButton}>
                <Text style={styles.startButtonText}>
                  {task.type === 'quiz' ? 'התחל חידון 🧠' : 'סמן כהושלם ✓'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5', padding: 40 },
  emptyEmoji: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12, textAlign: 'center' },
  emptyText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2C3E50' },
  progressPill: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressPillText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  completedTaskCard: {
    backgroundColor: '#E8F8F0',
    borderWidth: 2,
    borderColor: '#27AE60',
  },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  taskIcon: { fontSize: 28, marginLeft: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 17, fontWeight: 'bold', color: '#2C3E50', textAlign: 'right', marginBottom: 4 },
  taskDescription: { fontSize: 13, color: '#7F8C8D', textAlign: 'right' },
  statusBadge: { padding: 10, borderRadius: 10, marginTop: 8 },
  statusText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  rejectionNote: { backgroundColor: '#FFE5E5', borderRadius: 10, padding: 12, marginTop: 10 },
  rejectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#E74C3C', marginBottom: 4, textAlign: 'right' },
  rejectionText: { fontSize: 13, color: '#E74C3C', textAlign: 'right' },
  startWrapper: { borderRadius: 12, overflow: 'hidden', marginTop: 12 },
  startButton: { padding: 14, alignItems: 'center' },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  submitContainer: { padding: 20 },
  submitTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginTop: 20, marginBottom: 20 },
  photoSection: { marginBottom: 20 },
  photoSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', textAlign: 'right', marginBottom: 12 },
  photoButtons: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    backgroundColor: '#F0F2FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4776E6',
    borderStyle: 'dashed',
  },
  photoBtnText: { color: '#4776E6', fontSize: 15, fontWeight: '600' },
  photoPreview: { borderRadius: 12, overflow: 'hidden' },
  photoImg: { width: '100%', height: 200, borderRadius: 12 },
  removePhoto: { backgroundColor: '#FFE5E5', padding: 10, alignItems: 'center', marginTop: 8, borderRadius: 10 },
  removePhotoText: { color: '#E74C3C', fontWeight: 'bold' },
  noteLabel: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 10, textAlign: 'right' },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitWrapper: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  submitButton: { padding: 18, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { padding: 12, alignItems: 'center' },
  cancelButtonText: { color: '#7F8C8D', fontSize: 16 },
});
