import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function TasksListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [activePunishment, setActivePunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskNote, setTaskNote] = useState('');

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

  const handleTaskComplete = async (task: any) => {
    if (task.type === 'quiz') {
      // Navigate to quiz screen
      navigation.navigate('Quiz', {
        quiz: task.quizData,
        punishmentId: activePunishment.id,
        taskId: task.id,
      });
      return;
    }

    setSelectedTask(task);
  };

  const submitTask = async () => {
    if (!selectedTask) return;

    try {
      const updatedTasks = activePunishment.tasks.map((t: any) =>
        t.id === selectedTask.id
          ? { ...t, status: 'submitted', submittedAt: new Date(), childNote: taskNote }
          : t
      );

      await updateDoc(doc(db, 'punishments', activePunishment.id), {
        tasks: updatedTasks,
      });

      Alert.alert('נשלח! 🎉', 'המשימה נשלחה לאישור ההורה', [
        {
          text: 'אישור',
          onPress: () => {
            setSelectedTask(null);
            setTaskNote('');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו לשלוח את המשימה');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#27AE60';
      case 'submitted':
        return '#F39C12';
      case 'rejected':
        return '#E74C3C';
      default:
        return '#7F8C8D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'אושר ✅';
      case 'submitted':
        return 'ממתין לאישור ⏳';
      case 'rejected':
        return 'נדחה ❌';
      default:
        return 'ממתין להגשה 📝';
    }
  };

  if (selectedTask) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.submitContainer}>
          <Text style={styles.submitTitle}>השלמת את המשימה?</Text>

          <View style={styles.taskCard}>
            <Text style={styles.taskTitle}>{selectedTask.title}</Text>
            <Text style={styles.taskDescription}>{selectedTask.description}</Text>
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

          <TouchableOpacity style={styles.submitButton} onPress={submitTask}>
            <Text style={styles.submitButtonText}>שלח לאישור ההורה</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSelectedTask(null);
              setTaskNote('');
            }}
          >
            <Text style={styles.cancelButtonText}>ביטול</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>המשימות שלך</Text>
      <Text style={styles.subtitle}>
        {activePunishment.tasks.filter((t: any) => t.status === 'approved').length} מתוך{' '}
        {activePunishment.tasks.length} הושלמו
      </Text>

      {activePunishment.tasks.map((task: any) => (
        <TouchableOpacity
          key={task.id}
          style={[
            styles.taskCard,
            task.status === 'approved' && styles.completedTaskCard,
          ]}
          onPress={() => task.status === 'pending' && handleTaskComplete(task)}
          disabled={task.status !== 'pending'}
        >
          <View style={styles.taskHeader}>
            <Text style={styles.taskIcon}>
              {task.type === 'quiz' ? '🧠' : '📝'}
            </Text>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDescription}>{task.description}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(task.status)}20` },
            ]}
          >
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
              style={styles.startButton}
              onPress={() => handleTaskComplete(task)}
            >
              <Text style={styles.startButtonText}>
                {task.type === 'quiz' ? 'התחל חידון 🧠' : 'סמן כהושלם ✓'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completedTaskCard: {
    backgroundColor: '#E8F8F5',
    borderWidth: 2,
    borderColor: '#27AE60',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskIcon: {
    fontSize: 30,
    marginLeft: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 6,
  },
  taskDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'right',
  },
  statusBadge: {
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rejectionNote: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 6,
    textAlign: 'right',
  },
  rejectionText: {
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'right',
  },
  startButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitContainer: {
    padding: 20,
  },
  submitTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'right',
  },
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
  submitButton: {
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
});
