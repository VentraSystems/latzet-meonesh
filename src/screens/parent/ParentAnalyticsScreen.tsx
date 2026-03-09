import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function ParentAnalyticsScreen() {
  const { user, linkedUserId } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !linkedUserId) { setLoading(false); return; }
    loadStats();
  }, [linkedUserId]);

  const loadStats = async () => {
    try {
      if (linkedUserId) {
        const childDoc = await getDoc(doc(db, 'users', linkedUserId));
        if (childDoc.exists()) setChildName(childDoc.data().name || '');
      }

      const q = query(
        collection(db, 'punishments'),
        where('parentId', '==', user!.uid)
      );
      const snap = await getDocs(q);

      let totalPunishments = 0;
      let completedPunishments = 0;
      let totalTasks = 0;
      let approvedTasks = 0;
      let quizTasks = 0;
      let quizPassed = 0;
      let totalQuizScore = 0;
      let choreTasks = 0;
      let homeworkTasks = 0;
      const recentQuizzes: { title: string; score: number; date: any }[] = [];

      snap.forEach((docSnap) => {
        const p = docSnap.data();
        totalPunishments++;
        if (p.status === 'completed') completedPunishments++;

        (p.tasks || []).forEach((t: any) => {
          totalTasks++;
          if (t.status === 'approved') approvedTasks++;
          if (t.type === 'quiz') {
            quizTasks++;
            if (t.quizScore !== undefined) {
              totalQuizScore += t.quizScore;
              if (t.quizScore >= 60) quizPassed++;
              if (recentQuizzes.length < 10) {
                recentQuizzes.push({ title: t.title, score: t.quizScore, date: t.submittedAt });
              }
            }
          }
          if (t.type === 'chore') choreTasks++;
          if (t.type === 'homework') homeworkTasks++;
        });
      });

      const avgQuizScore = quizTasks > 0 ? Math.round(totalQuizScore / quizTasks) : 0;
      const completionRate = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

      setStats({
        totalPunishments,
        completedPunishments,
        totalTasks,
        approvedTasks,
        completionRate,
        quizTasks,
        quizPassed,
        avgQuizScore,
        choreTasks,
        homeworkTasks,
        recentQuizzes: recentQuizzes.reverse(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.loading}>
        <ActivityIndicator color="#8E54E9" size="large" />
      </LinearGradient>
    );
  }

  if (!linkedUserId || !stats) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>חבר ילד כדי לראות נתונים</Text>
        </View>
      </LinearGradient>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#27AE60';
    if (score >= 60) return '#F39C12';
    return '#E74C3C';
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.header}>📊 דוח על {childName}</Text>

        {/* Big Summary Cards */}
        <View style={styles.summaryRow}>
          <LinearGradient colors={['#4776E6', '#8E54E9']} style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{stats.totalPunishments}</Text>
            <Text style={styles.summaryLabel}>עונשים סה"כ</Text>
          </LinearGradient>
          <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{stats.completedPunishments}</Text>
            <Text style={styles.summaryLabel}>עונשים שהסתיימו</Text>
          </LinearGradient>
        </View>

        {/* Completion Rate */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>אחוז השלמת משימות</Text>
          <View style={styles.bigStatRow}>
            <Text style={styles.bigStat}>{stats.completionRate}%</Text>
            <Text style={styles.bigStatSub}>{stats.approvedTasks} / {stats.totalTasks} משימות</Text>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={stats.completionRate >= 70 ? ['#27AE60', '#2ECC71'] : ['#F39C12', '#E67E22']}
              style={[styles.progressFill, { width: `${stats.completionRate}%` as any }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* Quiz Performance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ביצועים בחידונים 🧠</Text>
          <View style={styles.quizStats}>
            <View style={styles.quizStat}>
              <Text style={[styles.quizStatNum, { color: getScoreColor(stats.avgQuizScore) }]}>
                {stats.avgQuizScore}%
              </Text>
              <Text style={styles.quizStatLabel}>ממוצע ציון</Text>
            </View>
            <View style={styles.quizStat}>
              <Text style={styles.quizStatNum}>{stats.quizTasks}</Text>
              <Text style={styles.quizStatLabel}>חידונים</Text>
            </View>
            <View style={styles.quizStat}>
              <Text style={[styles.quizStatNum, { color: '#27AE60' }]}>{stats.quizPassed}</Text>
              <Text style={styles.quizStatLabel}>עברו</Text>
            </View>
          </View>
        </View>

        {/* Task Type Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>פירוט סוגי משימות</Text>
          <View style={styles.typeRow}>
            <View style={styles.typeItem}>
              <Text style={styles.typeEmoji}>🏠</Text>
              <Text style={styles.typeNum}>{stats.choreTasks}</Text>
              <Text style={styles.typeLabel}>ניקיון</Text>
            </View>
            <View style={styles.typeItem}>
              <Text style={styles.typeEmoji}>📚</Text>
              <Text style={styles.typeNum}>{stats.homeworkTasks}</Text>
              <Text style={styles.typeLabel}>שיעורי בית</Text>
            </View>
            <View style={styles.typeItem}>
              <Text style={styles.typeEmoji}>🧠</Text>
              <Text style={styles.typeNum}>{stats.quizTasks}</Text>
              <Text style={styles.typeLabel}>חידונים</Text>
            </View>
          </View>
        </View>

        {/* Recent Quiz Scores */}
        {stats.recentQuizzes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ציוני חידונים אחרונים</Text>
            {stats.recentQuizzes.map((quiz: any, i: number) => (
              <View key={i} style={styles.quizRow}>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(quiz.score) + '22' }]}>
                  <Text style={[styles.scoreBadgeText, { color: getScoreColor(quiz.score) }]}>
                    {quiz.score}%
                  </Text>
                </View>
                <Text style={styles.quizTitle} numberOfLines={1}>{quiz.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Insight */}
        {stats.avgQuizScore > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightEmoji}>💡</Text>
            <Text style={styles.insightText}>
              {stats.avgQuizScore >= 80
                ? `${childName} מצטיין! ממוצע חידונים גבוה מאוד 🌟`
                : stats.avgQuizScore >= 60
                ? `${childName} בדרך הנכונה! המשך לחזק את הלמידה 💪`
                : `${childName} זקוק לחיזוק. נסה חידונים קלים יותר 📖`}
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  scroll: { padding: 20, paddingTop: 30, paddingBottom: 50 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#4776E6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  summaryNum: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF' },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'right', marginBottom: 16 },
  bigStatRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', gap: 10, marginBottom: 12 },
  bigStat: { fontSize: 48, fontWeight: 'bold', color: '#FFFFFF' },
  bigStatSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  progressBg: { height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  quizStats: { flexDirection: 'row', justifyContent: 'space-around' },
  quizStat: { alignItems: 'center' },
  quizStatNum: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  quizStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-around' },
  typeItem: { alignItems: 'center' },
  typeEmoji: { fontSize: 32, marginBottom: 8 },
  typeNum: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  typeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 12,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  scoreBadgeText: { fontSize: 14, fontWeight: 'bold' },
  quizTitle: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  insightCard: {
    backgroundColor: 'rgba(142,84,233,0.15)',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(142,84,233,0.3)',
  },
  insightEmoji: { fontSize: 28 },
  insightText: { flex: 1, fontSize: 15, color: '#FFFFFF', lineHeight: 22, textAlign: 'right' },
});
