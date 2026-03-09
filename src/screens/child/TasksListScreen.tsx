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
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyTaskSubmitted } from '../../utils/notifications';
import { showAlert } from '../../utils/alert';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TasksListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [activePunishment, setActivePunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskNote, setTaskNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { t, isRTL, language } = useLanguage();

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

  const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3] as [number, number],
    quality: 0.3,
    exif: false,
  };

  const pickPhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(t.tasksList.permissionRequired, t.tasksList.errorGallery);
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS);
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') { pickPhoto(); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert(t.tasksList.permissionRequired, t.tasksList.errorCamera);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ ...PICK_OPTIONS, aspect: [4, 3] });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = (uri: string, punishmentId: string, taskId: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `task-photos/${punishmentId}/${taskId}/${Date.now()}.jpg`);
        const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });

        uploadTask.on('state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(pct);
          },
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      } catch (e) {
        reject(e);
      }
    });
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
    // Pre-fill with existing submission data so child can update it
    setPhotoUri(null);
    setTaskNote(task.childNote || '');
  };

  const submitTask = async () => {
    if (!selectedTask) return;
    setUploading(true);
    setUploadProgress(0);

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
              // Use new photo if uploaded, keep existing if not replaced
              photoUrl: photoUrl || t.photoUrl || null,
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

      showAlert(t.tasksList.successSubmitTitle, photoUrl ? t.tasksList.successSubmitPhoto : t.tasksList.successSubmit, [
        {
          text: t.common.ok,
          onPress: () => { setSelectedTask(null); setTaskNote(''); setPhotoUri(null); },
        },
      ]);
    } catch (error: any) {
      showAlert(t.common.error, error?.message || t.tasksList.errorSubmit);
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
      case 'approved': return t.tasksList.statusApproved;
      case 'submitted': return t.tasksList.statusSubmitted;
      case 'rejected': return t.tasksList.statusRejected;
      default: return t.tasksList.statusPending;
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
        <Text style={styles.emptyTitle}>{t.tasksList.noTask}</Text>
        <Text style={styles.emptyText}>{t.tasksList.noTaskSub}</Text>
      </View>
    );
  }

  if (selectedTask) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.submitContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.submitTitle}>{t.tasksList.submitTitle}</Text>

          <View style={styles.taskCard}>
            <Text style={styles.taskTitle}>{selectedTask.title}</Text>
            <Text style={styles.taskDescription}>{selectedTask.description}</Text>
            {selectedTask.parentNote ? (
              <View style={styles.parentNoteBox}>
                <Text style={[styles.parentNoteLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  👨‍👩‍👧 {t.tasksList.parentInstructions || 'Parent instructions:'}
                </Text>
                <Text style={[styles.parentNoteText, { textAlign: isRTL ? 'right' : 'left' }]}>{selectedTask.parentNote}</Text>
              </View>
            ) : null}
            {selectedTask.refPhotoUrls?.length > 0 && (
              <View style={styles.refPhotosBox}>
                <Text style={[styles.parentNoteLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  📸 {t.tasksList.referencePhotos || 'Reference photos:'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedTask.refPhotoUrls.map((url: string, i: number) => (
                    <Image key={i} source={{ uri: url }} style={styles.refPhotoItem} resizeMode="cover" />
                  ))}
                </ScrollView>
              </View>
            )}
            {selectedTask.homeworkPhotoUrl && (
              <View style={styles.hwPhotoContainer}>
                <Text style={[styles.hwPhotoLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t.tasksList.homeworkSheet || '📄 Homework sheet:'}
                </Text>
                <Image source={{ uri: selectedTask.homeworkPhotoUrl }} style={styles.hwPhoto} resizeMode="contain" />
              </View>
            )}
          </View>

          {/* Photo Upload */}
          <View style={styles.photoSection}>
            <Text style={[styles.photoSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.tasksList.addPhoto}</Text>
            {/* Show previously submitted photo if editing */}
            {!photoUri && selectedTask.photoUrl && (
              <View style={styles.existingPhotoWrap}>
                <Text style={styles.existingPhotoLabel}>📎 {t.tasksList.currentPhoto || 'Current photo:'}</Text>
                <Image source={{ uri: selectedTask.photoUrl }} style={styles.photoImg} resizeMode="cover" />
                <Text style={styles.existingPhotoHint}>{t.tasksList.replacePhotoHint || 'Pick a new photo below to replace it'}</Text>
              </View>
            )}
            {photoUri ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.photoImg} resizeMode="cover" />
                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                  <Text style={styles.removePhotoText}>{t.tasksList.removePhoto}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                    <Text style={styles.photoBtnText}>{t.tasksList.takePhoto}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
                  <Text style={styles.photoBtnText}>{t.tasksList.gallery}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={[styles.noteLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.tasksList.addNote}</Text>
          <TextInput
            style={styles.noteInput}
            placeholder={t.tasksList.notePlaceholder}
            value={taskNote}
            onChangeText={setTaskNote}
            multiline
            numberOfLines={4}
            textAlign={isRTL ? 'right' : 'left'}
          />

          <TouchableOpacity
            style={styles.submitWrapper}
            onPress={submitTask}
            disabled={uploading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.submitButton}>
              {uploading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>
                    {photoUri && uploadProgress > 0 ? `${uploadProgress}%` : '...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>{photoUri ? t.tasksList.submitBtnPhoto : t.tasksList.submitBtn}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => { setSelectedTask(null); setTaskNote(''); setPhotoUri(null); }}
          >
            <Text style={styles.cancelButtonText}>{t.tasksList.cancel}</Text>
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
        <Text style={styles.title}>{t.tasksList.yourTasks}</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{approved} / {total}</Text>
        </View>
      </View>

      {activePunishment.tasks.map((task: any) => {
        const today = new Date().toISOString().split('T')[0];
        const isLocked = task.unlockDate && task.unlockDate > today;

        if (isLocked) {
          return (
            <View key={task.id} style={[styles.taskCard, styles.lockedTaskCard]}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskIcon}>🔒</Text>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, { color: '#BDC3C7' }]}>{task.title}</Text>
                  <Text style={styles.taskDescription}>
                    {language === 'en' ? `Available ${task.unlockDate}` : `זמין מ-${task.unlockDate}`}
                  </Text>
                </View>
              </View>
            </View>
          );
        }

        return (
          <View
            key={task.id}
            style={[styles.taskCard, task.status === 'approved' && styles.completedTaskCard]}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskIcon}>{task.type === 'quiz' ? '🧠' : task.homeworkPhotoUrl ? '📚' : '📝'}</Text>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
                {task.parentNote ? (
                  <Text style={styles.taskParentNotePreview} numberOfLines={1}>👨‍👩‍👧 {task.parentNote}</Text>
                ) : null}
              </View>
              {task.homeworkPhotoUrl && (
                <Image source={{ uri: task.homeworkPhotoUrl }} style={styles.hwThumb} resizeMode="cover" />
              )}
            </View>

            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                {getStatusText(task.status)}
              </Text>
            </View>

            {task.status === 'rejected' && task.rejectedReason && (
              <View style={styles.rejectionNote}>
                <Text style={[styles.rejectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.tasksList.rejectionReason}</Text>
                <Text style={[styles.rejectionText, { textAlign: isRTL ? 'right' : 'left' }]}>{task.rejectedReason}</Text>
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
                    {task.type === 'quiz' ? t.tasksList.startQuiz : t.tasksList.markDone}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {task.status === 'submitted' && task.type !== 'quiz' && (
              <TouchableOpacity
                style={styles.startWrapper}
                onPress={() => handleTaskComplete(task)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#F39C12', '#E67E22']} style={styles.startButton}>
                  <Text style={styles.startButtonText}>
                    ✏️ {t.tasksList.editSubmission || 'Edit Submission'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {task.status === 'rejected' && task.type !== 'quiz' && (
              <TouchableOpacity
                style={styles.startWrapper}
                onPress={() => handleTaskComplete(task)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#8E54E9', '#4776E6']} style={styles.startButton}>
                  <Text style={styles.startButtonText}>
                    🔄 {t.tasksList.resubmit || 'Resubmit Task'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
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
  lockedTaskCard: { opacity: 0.5, backgroundColor: '#F8F9FA' },
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
  parentNoteBox: { backgroundColor: '#EBF5FB', borderRadius: 10, padding: 10, marginTop: 10 },
  parentNoteLabel: { fontSize: 12, fontWeight: 'bold', color: '#2980B9', marginBottom: 4 },
  parentNoteText: { fontSize: 14, color: '#2C3E50', lineHeight: 20 },
  refPhotosBox: { marginTop: 10 },
  refPhotoItem: { width: 120, height: 120, borderRadius: 8, marginRight: 8 },
  taskParentNotePreview: { fontSize: 11, color: '#3498DB', marginTop: 3 },
  existingPhotoWrap: { marginBottom: 12, backgroundColor: '#FFF9E6', borderRadius: 10, padding: 10 },
  existingPhotoLabel: { fontSize: 13, fontWeight: 'bold', color: '#856404', marginBottom: 6 },
  existingPhotoHint: { fontSize: 11, color: '#B8860B', marginTop: 6, textAlign: 'center' },
  hwThumb: { width: 52, height: 52, borderRadius: 8, marginLeft: 8 },
  hwPhotoContainer: { marginTop: 12, backgroundColor: '#F0F7FF', borderRadius: 10, padding: 10 },
  hwPhotoLabel: { fontSize: 13, fontWeight: 'bold', color: '#3498DB', marginBottom: 8 },
  hwPhoto: { width: '100%', height: 220, borderRadius: 8, backgroundColor: '#E8F4FD' },
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
