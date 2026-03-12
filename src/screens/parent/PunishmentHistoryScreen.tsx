import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { C, R, R_LG, shadow } from '../../theme';

export default function PunishmentHistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [punishments, setPunishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'punishments'),
      where('parentId', '==', user.uid),
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc')
    );
    getDocs(q)
      .then((snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPunishments(data);
      })
      .catch(() => {
        // fallback: query without orderBy (no composite index needed)
        const q2 = query(
          collection(db, 'punishments'),
          where('parentId', '==', user.uid),
          where('status', '==', 'completed')
        );
        return getDocs(q2).then((snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          data.sort((a: any, b: any) => {
            const aTime = a.completedAt?.toMillis?.() || 0;
            const bTime = b.completedAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          setPunishments(data);
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.loading}>
        <ActivityIndicator size="large" color="#8E54E9" />
      </LinearGradient>
    );
  }

  if (punishments.length === 0) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.loading}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyTitle}>No completed tasks yet</Text>
        <Text style={styles.emptySubtitle}>Completed challenges will appear here</Text>
      </LinearGradient>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageSubtitle}>{punishments.length} completed challenge{punishments.length !== 1 ? 's' : ''}</Text>

      {punishments.map((p: any) => {
        const tasks = p.tasks || [];
        const approved = tasks.filter((t: any) => t.status === 'approved').length;
        const rejected = tasks.filter((t: any) => t.status === 'rejected').length;
        const isExpanded = expandedId === p.id;

        return (
          <View key={p.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setExpandedId(isExpanded ? null : p.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>{p.name}</Text>
                <Text style={styles.cardDate}>✅ Completed {formatDate(p.completedAt)}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipText}>✅ {approved} approved</Text>
                  </View>
                  {rejected > 0 && (
                    <View style={[styles.statChip, styles.statChipRed]}>
                      <Text style={[styles.statChipText, { color: '#E74C3C' }]}>❌ {rejected} rejected</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.taskList}>
                {tasks.map((task: any, idx: number) => (
                  <View key={task.id || idx} style={styles.taskRow}>
                    <Text style={styles.taskIcon}>
                      {task.status === 'approved' ? '✅' : task.status === 'rejected' ? '❌' : '⏳'}
                    </Text>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      {task.type === 'quiz' && task.quizScore !== undefined && (
                        <Text style={[styles.taskMeta, { color: task.quizScore >= 60 ? '#27AE60' : '#E74C3C' }]}>
                          Quiz score: {task.quizScore}%
                        </Text>
                      )}
                      {task.status === 'rejected' && task.rejectedReason && (
                        <Text style={styles.taskRejected}>Reason: {task.rejectedReason}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: C.textMed },
  pageSubtitle: { fontSize: 13, color: C.textLow, marginBottom: 16, marginTop: 4 },

  card: {
    backgroundColor: C.surface,
    borderRadius: R_LG,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardLeft: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 4 },
  cardDate: { fontSize: 12, color: C.success, marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    backgroundColor: '#1a3a2a',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  statChipRed: {
    backgroundColor: '#3a1a1a',
    borderColor: '#E74C3C',
  },
  statChipText: { fontSize: 12, color: '#27AE60', fontWeight: '600' },
  chevron: { fontSize: 14, color: C.textLow, marginLeft: 8 },

  taskList: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 12,
    gap: 10,
  },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  taskIcon: { fontSize: 18, marginTop: 1 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  taskMeta: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  taskRejected: { fontSize: 12, color: '#E74C3C', marginTop: 2 },

  footer: { height: 32 },
});
