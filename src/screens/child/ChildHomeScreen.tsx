import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function ChildHomeScreen({ navigation }: any) {
  const { user, linkedUserId } = useAuth();
  const [childName, setChildName] = useState('');
  const [activePunishment, setActivePunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Get child name
    getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
      if (docSnap.exists()) {
        setChildName(docSnap.data().name);
      }
    });

    // Listen to active punishment
    const q = query(
      collection(db, 'punishments'),
      where('childId', '==', user.uid),
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
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E74C3C" />
      </View>
    );
  }

  const isInPunishment = activePunishment !== null;
  const tasks = activePunishment?.tasks || [];
  const completedTasks = tasks.filter((t: any) => t.status === 'approved').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'submitted': return '⏳';
      case 'rejected': return '❌';
      default: return '📝';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'אושר';
      case 'submitted': return 'ממתין לאישור';
      case 'rejected': return 'נדחה';
      default: return 'ממתין להגשה';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {isInPunishment ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>😔</Text>
            <Text style={styles.headerTitle}>שלום {childName}!</Text>
            <Text style={styles.headerSubtitle}>אתה בעונש</Text>
            <Text style={styles.punishmentName}>{activePunishment.name}</Text>
          </View>

          <View style={styles.motivationCard}>
            <Text style={styles.motivationText}>
              💪 כמעט סיימת! רק עוד {totalTasks - completedTasks} משימות
            </Text>
          </View>

          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>התקדמות שלך</Text>
            <Text style={styles.progressNumbers}>
              {completedTasks} / {totalTasks} משימות הושלמו
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>

          <View style={styles.tasksSection}>
            <Text style={styles.sectionTitle}>המשימות שלך</Text>
            {tasks.map((task: any) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskItem}
                onPress={() => navigation.navigate('TasksList', { punishmentId: activePunishment.id })}
              >
                <View style={styles.taskContent}>
                  <Text style={styles.taskEmoji}>{getStatusEmoji(task.status)}</Text>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskStatus}>{getStatusText(task.status)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.viewTasksButton}
            onPress={() => navigation.navigate('TasksList', { punishmentId: activePunishment.id })}
          >
            <Text style={styles.viewTasksButtonText}>📝 צפה בכל המשימות</Text>
          </TouchableOpacity>

          <View style={styles.encouragement}>
            <Text style={styles.encouragementText}>
              💡 כל משימה שתשלים מקרבת אותך לחופש!
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.freedomScreen}>
          <Text style={styles.freedomEmoji}>🎉</Text>
          <Text style={styles.freedomTitle}>שלום {childName}!</Text>
          <Text style={styles.freedomSubtitle}>אתה חופשי! אין לך עונשים כרגע</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipsEmoji}>💡</Text>
            <Text style={styles.tipsText}>
              זכור: התנהגות טובה עוזרת לך להישאר חופשי!
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#E74C3C',
    padding: 30,
    paddingTop: 20,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 10,
    opacity: 0.9,
  },
  punishmentName: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  motivationCard: {
    backgroundColor: '#FFF3CD',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 18,
    color: '#856404',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 10,
  },
  progressNumbers: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498DB',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressBarContainer: {
    height: 15,
    backgroundColor: '#ECF0F1',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 10,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    textAlign: 'center',
  },
  tasksSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 15,
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskEmoji: {
    fontSize: 30,
    marginLeft: 15,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 5,
  },
  taskStatus: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'right',
  },
  encouragement: {
    margin: 15,
    padding: 15,
    backgroundColor: '#D4EDDA',
    borderRadius: 10,
    marginBottom: 30,
  },
  encouragementText: {
    fontSize: 16,
    color: '#155724',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  viewTasksButton: {
    backgroundColor: '#3498DB',
    margin: 15,
    marginTop: 5,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  viewTasksButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  freedomScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minHeight: 600,
  },
  freedomEmoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  freedomTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 10,
  },
  freedomSubtitle: {
    fontSize: 20,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  tipsEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  tipsText: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 26,
  },
});
