import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { notifyTaskApproved, notifyTaskRejected } from '../../utils/notifications';

export default function TaskApprovalScreen({ route, navigation }: any) {
  const { punishmentId } = route.params;
  const [punishment, setPunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPunishment();
  }, []);

  const loadPunishment = async () => {
    try {
      const punishmentDoc = await getDoc(doc(db, 'punishments', punishmentId));
      if (punishmentDoc.exists()) {
        setPunishment({ id: punishmentDoc.id, ...punishmentDoc.data() });
      }
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את המשימות');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId: string) => {
    Alert.alert(
      'אישור משימה',
      'האם אתה בטוח שברצונך לאשר את המשימה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'אשר',
          onPress: async () => {
            try {
              const task = punishment.tasks.find((t: any) => t.id === taskId);
              const updatedTasks = punishment.tasks.map((t: any) =>
                t.id === taskId ? { ...t, status: 'approved', approvedAt: new Date() } : t
              );

              await updateDoc(doc(db, 'punishments', punishmentId), {
                tasks: updatedTasks,
              });

              // Send notification to child
              await notifyTaskApproved(
                punishment.childId,
                task.title,
                punishmentId,
                taskId
              );

              // Check if all tasks are approved
              const allApproved = updatedTasks.every((t: any) => t.status === 'approved');
              if (allApproved) {
                await updateDoc(doc(db, 'punishments', punishmentId), {
                  status: 'completed',
                  completedAt: new Date(),
                });
                Alert.alert('🎉 כל המשימות אושרו!', 'הילד יצא מהעונש!', [
                  { text: 'אישור', onPress: () => navigation.goBack() },
                ]);
              } else {
                await loadPunishment();
              }
            } catch (error) {
              Alert.alert('שגיאה', 'לא הצלחנו לאשר את המשימה');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (taskId: string) => {
    Alert.prompt(
      'דחיית משימה',
      'למה אתה דוחה את המשימה? (הילד יראה את ההודעה)',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'דחה',
          onPress: async (reason) => {
            try {
              const task = punishment.tasks.find((t: any) => t.id === taskId);
              const rejectionReason = reason || 'המשימה לא בוצעה כראוי';
              const updatedTasks = punishment.tasks.map((t: any) =>
                t.id === taskId
                  ? { ...t, status: 'rejected', rejectedReason }
                  : t
              );

              await updateDoc(doc(db, 'punishments', punishmentId), {
                tasks: updatedTasks,
              });

              // Send notification to child
              await notifyTaskRejected(
                punishment.childId,
                task.title,
                rejectionReason,
                punishmentId,
                taskId
              );

              await loadPunishment();
            } catch (error) {
              Alert.alert('שגיאה', 'לא הצלחנו לדחות את המשימה');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  const pendingTasks = punishment?.tasks?.filter((t: any) => t.status === 'submitted') || [];

  if (pendingTasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={styles.emptyTitle}>אין משימות לאישור</Text>
          <Text style={styles.emptyText}>כל המשימות אושרו או ממתינות להגשה</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>חזור</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>אישור משימות</Text>
      <Text style={styles.subtitle}>{pendingTasks.length} משימות ממתינות לאישור</Text>

      {pendingTasks.map((task: any) => (
        <View key={task.id} style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskIcon}>
              {task.type === 'quiz' ? '🧠' : '📝'}
            </Text>
            <Text style={styles.taskTitle}>{task.title}</Text>
          </View>

          <Text style={styles.taskDescription}>{task.description}</Text>

          {task.childNote && (
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>הערת הילד:</Text>
              <Text style={styles.noteText}>{task.childNote}</Text>
            </View>
          )}

          {task.quizScore !== undefined && (
            <View style={styles.quizScoreContainer}>
              <Text style={styles.quizScoreLabel}>ציון בחידון:</Text>
              <Text style={styles.quizScoreText}>
                {task.quizScore}% {task.quizScore >= 60 ? '✅' : '❌'}
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(task.id)}
            >
              <Text style={styles.actionButtonText}>✅ אשר</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(task.id)}
            >
              <Text style={styles.actionButtonText}>❌ דחה</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 40,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskIcon: {
    fontSize: 30,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'right',
  },
  taskDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'right',
    marginBottom: 16,
  },
  noteContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 6,
    textAlign: 'right',
  },
  noteText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'right',
  },
  quizScoreContainer: {
    backgroundColor: '#E8F8F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizScoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  quizScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#27AE60',
  },
  rejectButton: {
    backgroundColor: '#E74C3C',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
