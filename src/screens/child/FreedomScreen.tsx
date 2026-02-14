import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyPunishmentCompleted } from '../../utils/notifications';

const { width, height } = Dimensions.get('window');

interface Props {
  route: any;
  navigation: any;
}

export default function FreedomScreen({ route, navigation }: Props) {
  const { punishmentId } = route.params || {};
  const { user } = useAuth();
  const [punishment, setPunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const confettiRef = useRef<any>(null);
  const bounceValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPunishmentData();
    startAnimations();

    // Trigger confetti
    setTimeout(() => {
      confettiRef.current?.start();
    }, 300);
  }, []);

  const loadPunishmentData = async () => {
    if (!punishmentId) {
      setLoading(false);
      return;
    }

    try {
      const punishmentDoc = await getDoc(doc(db, 'punishments', punishmentId));
      if (punishmentDoc.exists()) {
        const data = { id: punishmentDoc.id, ...punishmentDoc.data() };
        setPunishment(data);

        // Send notification to parent
        const childDoc = await getDoc(doc(db, 'users', user!.uid));
        const childName = childDoc.exists() ? childDoc.data().name : 'הילד';

        await notifyPunishmentCompleted(
          data.parentId,
          childName,
          data.name,
          punishmentId
        );
      }
    } catch (error) {
      console.error('Error loading punishment:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnimations = () => {
    // Bounce animation for main content
    Animated.spring(bounceValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Fade in animation
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Rotate animation for emoji
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotateValue, {
          toValue: -1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotateValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const scale = bounceValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const rotate = rotateValue.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const completedTasks = punishment?.tasks?.filter((t: any) => t.status === 'approved') || [];
  const totalTasks = punishment?.tasks?.length || 0;

  return (
    <View style={styles.container}>
      {/* Confetti Animation */}
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: width / 2, y: -10 }}
        autoStart={false}
        fadeOut
        fallSpeed={2500}
        explosionSpeed={350}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { transform: [{ scale }], opacity: fadeValue }]}>
          {/* Animated Emoji */}
          <Animated.Text style={[styles.emoji, { transform: [{ rotate }] }]}>
            🎉
          </Animated.Text>

          {/* Main Title */}
          <Text style={styles.title}>!יצאת מעונש</Text>
          <Text style={styles.subtitle}>כל הכבוד! השלמת את כל המשימות</Text>

          {/* Achievement Card */}
          <View style={styles.achievementCard}>
            <Text style={styles.achievementEmoji}>🏆</Text>
            <Text style={styles.achievementTitle}>הישג מרשים!</Text>
            <Text style={styles.achievementText}>
              השלמת {totalTasks} משימות בהצלחה
            </Text>
          </View>

          {/* Tasks Summary */}
          {punishment && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📋 סיכום המשימות שביצעת</Text>

              {completedTasks.map((task: any, index: number) => (
                <View key={task.id} style={styles.taskItem}>
                  <Text style={styles.taskNumber}>{index + 1}</Text>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.quizScore && (
                      <Text style={styles.taskScore}>ציון: {task.quizScore}%</Text>
                    )}
                  </View>
                  <Text style={styles.taskCheck}>✅</Text>
                </View>
              ))}

              <View style={styles.punishmentInfo}>
                <Text style={styles.punishmentName}>עונש: {punishment.name}</Text>
                <Text style={styles.completionTime}>
                  הושלם בהצלחה! 🎊
                </Text>
              </View>
            </View>
          )}

          {/* Motivational Message */}
          <View style={styles.messageCard}>
            <Text style={styles.messageIcon}>💡</Text>
            <Text style={styles.messageText}>
              זכור: התנהגות טובה וביצוע משימות עוזרים לך להישאר חופשי ולהימנע מעונשים בעתיד!
            </Text>
          </View>

          {/* Fun Stats */}
          {punishment && (
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalTasks}</Text>
                <Text style={styles.statLabel}>משימות</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {completedTasks.filter((t: any) => t.type === 'quiz').length}
                </Text>
                <Text style={styles.statLabel}>חידונים</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>100%</Text>
                <Text style={styles.statLabel}>הצלחה</Text>
              </View>
            </View>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              // Navigate to home and reset navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'ChildHome' }],
              });
            }}
          >
            <Text style={styles.continueButtonText}>חזור לבית 🏠</Text>
          </TouchableOpacity>

          {/* Celebration Footer */}
          <Text style={styles.footerText}>
            ההורים שלך מאוד גאים בך! 🌟
          </Text>

          {/* Ventra Branding */}
          <Text style={styles.brandingText}>
            Made with ❤️ by Ventra Software Systems LTD
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#27AE60',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.95,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  achievementEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementText: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'right',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  taskNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
    width: 30,
    textAlign: 'center',
  },
  taskContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  taskTitle: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'right',
    fontWeight: '600',
  },
  taskScore: {
    fontSize: 14,
    color: '#27AE60',
    textAlign: 'right',
    marginTop: 4,
  },
  taskCheck: {
    fontSize: 20,
  },
  punishmentInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  punishmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 6,
  },
  completionTime: {
    fontSize: 14,
    color: '#27AE60',
    textAlign: 'right',
  },
  messageCard: {
    backgroundColor: '#FFFFFF30',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  messageIcon: {
    fontSize: 30,
    marginLeft: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  statBox: {
    backgroundColor: '#FFFFFF30',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    paddingHorizontal: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 20,
  },
  continueButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  footerText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 10,
  },
  brandingText: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 16,
  },
});
