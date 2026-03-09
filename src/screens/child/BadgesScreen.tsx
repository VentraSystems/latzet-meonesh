import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { BADGES } from '../../utils/badges';

export default function BadgesScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) setUserData(snap.data());
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.loading}>
        <ActivityIndicator color="#ffd200" size="large" />
      </LinearGradient>
    );
  }

  const earnedBadges: string[] = userData?.badges || [];
  const totalPoints: number = userData?.totalPoints || 0;
  const completedTasks: number = userData?.completedTasksCount || 0;
  const completedQuizzes: number = userData?.completedQuizzesCount || 0;

  const allBadgeKeys = Object.keys(BADGES);

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Points Header */}
        <LinearGradient colors={['#f7971e', '#ffd200']} style={styles.pointsCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.pointsEmoji}>⭐</Text>
          <Text style={styles.pointsNumber}>{totalPoints}</Text>
          <Text style={styles.pointsLabel}>נקודות</Text>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>משימות הושלמו</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedQuizzes}</Text>
            <Text style={styles.statLabel}>חידונים עברו</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{earnedBadges.length}</Text>
            <Text style={styles.statLabel}>תגים</Text>
          </View>
        </View>

        {/* Badges Grid */}
        <Text style={styles.sectionTitle}>התגים שלך</Text>
        <View style={styles.badgesGrid}>
          {allBadgeKeys.map((key) => {
            const badge = BADGES[key];
            const earned = earnedBadges.includes(key);
            return (
              <View key={key} style={[styles.badgeCard, !earned && styles.badgeCardLocked]}>
                <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>
                  {earned ? badge.emoji : '🔒'}
                </Text>
                <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>
                  {earned ? badge.name : '???'}
                </Text>
                <Text style={[styles.badgeDesc, !earned && styles.badgeDescLocked]}>
                  {earned ? badge.desc : 'עדיין לא הושג'}
                </Text>
              </View>
            );
          })}
        </View>

        {earnedBadges.length === 0 && (
          <View style={styles.emptyMsg}>
            <Text style={styles.emptyMsgText}>
              השלם משימות ועבור חידונים כדי להרוויח תגים! 🚀
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingTop: 30, paddingBottom: 50 },
  pointsCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#f7971e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  pointsEmoji: { fontSize: 50, marginBottom: 8 },
  pointsNumber: { fontSize: 72, fontWeight: 'bold', color: '#1a1a2e' },
  pointsLabel: { fontSize: 20, fontWeight: '600', color: '#1a1a2e', opacity: 0.7 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  badgeCardLocked: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeEmoji: { fontSize: 40, marginBottom: 8 },
  badgeEmojiLocked: { opacity: 0.3 },
  badgeName: { fontSize: 14, fontWeight: 'bold', color: '#ffd200', textAlign: 'center', marginBottom: 4 },
  badgeNameLocked: { color: 'rgba(255,255,255,0.3)' },
  badgeDesc: { fontSize: 11, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 16 },
  badgeDescLocked: { color: 'rgba(255,255,255,0.2)' },
  emptyMsg: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
  },
  emptyMsgText: { color: 'rgba(255,255,255,0.65)', textAlign: 'center', fontSize: 16, lineHeight: 24 },
});
