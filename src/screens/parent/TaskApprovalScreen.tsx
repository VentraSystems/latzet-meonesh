import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { notifyTaskApproved, notifyTaskRejected } from '../../utils/notifications';
import { showAlert } from '../../utils/alert';
import { awardPointsAndBadges, incrementCompletedPunishments, BADGES, POINTS_PER_TASK } from '../../utils/badges';
import { awardCoins, DEFAULT_WALLET_CONFIG } from '../../utils/wallet';
import RejectTaskModal from '../../components/RejectTaskModal';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TaskApprovalScreen({ route, navigation }: any) {
  const { punishmentId } = route.params;
  const [punishment, setPunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'done'>('pending');
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'punishments', punishmentId), (snap) => {
      if (snap.exists()) {
        setPunishment({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }, () => {
      showAlert(t.common.error, t.taskApproval.errorLoad);
      setLoading(false);
    });
    return unsubscribe;
  }, [punishmentId]);

  const handleApprove = async (taskId: string) => {
    showAlert(
      t.taskApproval.confirmApproveTitle,
      t.taskApproval.confirmApproveMsg,
      [
        { text: t.taskApproval.cancelBtn, style: 'cancel' },
        {
          text: t.taskApproval.approveBtn,
          onPress: async () => {
            try {
              const task = punishment.tasks.find((t: any) => t.id === taskId);
              const updatedTasks = punishment.tasks.map((t: any) =>
                t.id === taskId ? { ...t, status: 'approved', approvedAt: new Date() } : t
              );

              await updateDoc(doc(db, 'punishments', punishmentId), { tasks: updatedTasks });

              // Award points and badges to child
              const result = await awardPointsAndBadges(
                punishment.childId,
                task.type || 'custom',
                task.quizScore
              );

              // Award wallet coins
              try {
                const parentDoc = await getDoc(doc(db, 'users', punishment.parentId));
                const walletConfig = parentDoc.exists()
                  ? (parentDoc.data().walletConfig || DEFAULT_WALLET_CONFIG)
                  : DEFAULT_WALLET_CONFIG;
                if (walletConfig.enabled !== false) {
                  const coins = task.type === 'quiz'
                    ? (walletConfig.coinsPerQuiz || DEFAULT_WALLET_CONFIG.coinsPerQuiz)
                    : task.type === 'minigame'
                    ? (walletConfig.coinsPerGame || DEFAULT_WALLET_CONFIG.coinsPerGame)
                    : (walletConfig.coinsPerTask || DEFAULT_WALLET_CONFIG.coinsPerTask);
                  await awardCoins(punishment.childId, coins, `Task: ${task.title}`);
                }
              } catch (_) {}

              await notifyTaskApproved(punishment.childId, task.title, punishmentId, taskId);

              const allApproved = updatedTasks.every((t: any) => t.status === 'approved');
              if (allApproved) {
                await updateDoc(doc(db, 'punishments', punishmentId), {
                  status: 'completed',
                  completedAt: new Date(),
                });
                await incrementCompletedPunishments(punishment.childId);

                const pointsMsg = result ? `\n${t.taskApproval.pointsEarned.replace('{n}', String(result.pointsEarned))}` : '';
                const badgesMsg = result?.newBadges?.length
                  ? `\n${t.taskApproval.newBadge.replace('{name}', BADGES[result.newBadges[0]]?.name)}`
                  : '';

                showAlert(t.taskApproval.allApprovedTitle, `${t.taskApproval.allApprovedMsg}${pointsMsg}${badgesMsg}`, [
                  { text: t.common.ok, onPress: () => navigation.goBack() },
                ]);
              } else {
                const pointsMsg = result ? `${t.taskApproval.pointsEarned.replace('{n}', String(result.pointsEarned))}` : '';
                const badgesMsg = result?.newBadges?.length
                  ? ` ${t.taskApproval.newBadge.replace('{name}', BADGES[result.newBadges[0]]?.name)}`
                  : '';
                if (pointsMsg || badgesMsg) {
                  showAlert(t.taskApproval.approvedTitle, `${pointsMsg}${badgesMsg}`);
                }
                // onSnapshot listener updates the UI automatically
              }
            } catch (error) {
              showAlert(t.common.error, t.taskApproval.errorApprove);
            }
          },
        },
      ]
    );
  };

  const handleReject = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!selectedTaskId) return;
    try {
      const task = punishment.tasks.find((tk: any) => tk.id === selectedTaskId);
      const rejectionReason = reason || t.rejectModal.defaultReason;
      const updatedTasks = punishment.tasks.map((task: any) =>
        task.id === selectedTaskId ? { ...task, status: 'rejected', rejectedReason: rejectionReason } : task
      );
      await updateDoc(doc(db, 'punishments', punishmentId), { tasks: updatedTasks });
      await notifyTaskRejected(punishment.childId, task.title, rejectionReason, punishmentId, selectedTaskId);
      // onSnapshot listener updates the UI automatically
    } catch (error) {
      showAlert(t.common.error, t.taskApproval.errorReject);
    } finally {
      setShowRejectModal(false);
      setSelectedTaskId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4776E6" />
      </View>
    );
  }

  const pendingTasks = punishment?.tasks?.filter((t: any) => t.status === 'submitted') || [];
  const doneTasks = punishment?.tasks?.filter((t: any) => t.status === 'approved' || t.status === 'rejected') || [];
  const shownTasks = activeTab === 'pending' ? pendingTasks : doneTasks;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.titleSection}>
        <Text style={styles.title}>{t.taskApproval.title}</Text>
        {pendingTasks.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{pendingTasks.length}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            {pendingTasks.length > 0 ? `⏳ ${t.taskApproval.tabPending || 'Needs Approval'} (${pendingTasks.length})` : `⏳ ${t.taskApproval.tabPending || 'Needs Approval'}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'done' && styles.tabActive]}
          onPress={() => setActiveTab('done')}
        >
          <Text style={[styles.tabText, activeTab === 'done' && styles.tabTextActive]}>
            {`✅ ${t.taskApproval.tabDone || 'Completed'} (${doneTasks.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {shownTasks.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{activeTab === 'pending' ? '✨' : '📋'}</Text>
          <Text style={styles.emptyTitle}>{activeTab === 'pending' ? t.taskApproval.empty : (t.taskApproval.noDone || 'No completed tasks yet')}</Text>
          <Text style={styles.emptyText}>{activeTab === 'pending' ? t.taskApproval.emptyDesc : ''}</Text>
        </View>
      )}

      {shownTasks.map((task: any) => {
        const points = POINTS_PER_TASK[task.type as keyof typeof POINTS_PER_TASK] ?? 10;
        return (
          <View key={task.id} style={styles.taskCard}>
            {/* Task Header */}
            <View style={styles.taskHeader}>
              <Text style={styles.taskIcon}>{task.type === 'quiz' ? '🧠' : '📝'}</Text>
              <View style={styles.taskTitleSection}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>+{points} ⭐</Text>
                </View>
              </View>
            </View>

            {task.description ? (
              <Text style={styles.taskDescription}>{task.description}</Text>
            ) : null}

            {/* Child Note */}
            {task.childNote && (
              <View style={styles.noteContainer}>
                <Text style={[styles.noteLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.taskApproval.childNote}</Text>
                <Text style={[styles.noteText, { textAlign: isRTL ? 'right' : 'left' }]}>{task.childNote}</Text>
              </View>
            )}

            {/* Homework reference photo (attached by parent) */}
            {task.homeworkPhotoUrl && (
              <View style={styles.photoContainer}>
                <Text style={[styles.photoLabel, { textAlign: isRTL ? 'right' : 'left' }]}>📄 Homework attachment:</Text>
                <View style={styles.photoWrap}>
                  <Image source={{ uri: task.homeworkPhotoUrl }} style={styles.photo} resizeMode="contain" />
                </View>
              </View>
            )}

            {/* Child proof photo */}
            {task.photoUrl && (
              <View style={styles.photoContainer}>
                <Text style={[styles.photoLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.taskApproval.photoProof}</Text>
                <View style={styles.photoWrap}>
                  <Image
                    source={{ uri: task.photoUrl }}
                    style={styles.photo}
                    resizeMode="cover"
                    onError={(e) => console.warn('Photo load error:', e.nativeEvent)}
                  />
                </View>
              </View>
            )}

            {/* Quiz Score */}
            {task.quizScore !== undefined && (
              <View style={[styles.quizScore, { backgroundColor: task.quizScore >= 60 ? '#E8F8F0' : '#FFF0F0' }]}>
                <Text style={styles.quizScoreLabel}>{t.taskApproval.quizScore}</Text>
                <Text style={[styles.quizScoreText, { color: task.quizScore >= 60 ? '#27AE60' : '#E74C3C' }]}>
                  {task.quizScore}% {task.quizScore >= 60 ? '✅' : '❌'}
                </Text>
              </View>
            )}

            {/* Action Buttons — only for submitted tasks */}
            {task.status === 'submitted' && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.approveWrapper}
                  onPress={() => handleApprove(task.id)}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>{t.taskApproval.approve}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectWrapper}
                  onPress={() => handleReject(task.id)}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#E74C3C', '#C0392B']} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>{t.taskApproval.reject}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Status badge for done tasks */}
            {(task.status === 'approved' || task.status === 'rejected') && (
              <View style={[styles.doneBadge, { backgroundColor: task.status === 'approved' ? '#E8F8F0' : '#FFF0F0' }]}>
                <Text style={[styles.doneBadgeText, { color: task.status === 'approved' ? '#27AE60' : '#E74C3C' }]}>
                  {task.status === 'approved' ? `✅ ${t.taskApproval.approveBtn || 'Approved'}` : `❌ ${t.taskApproval.rejectBtn || 'Rejected'}`}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <RejectTaskModal
        visible={showRejectModal}
        taskTitle={selectedTaskId ? punishment.tasks.find((t: any) => t.id === selectedTaskId)?.title || '' : ''}
        onCancel={() => { setShowRejectModal(false); setSelectedTaskId(null); }}
        onSubmit={handleRejectSubmit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2FF', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2FF' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F0F2FF' },
  emptyEmoji: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12, textAlign: 'center' },
  emptyText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', marginBottom: 30 },
  backButtonWrapper: { borderRadius: 14, overflow: 'hidden' },
  backButton: { padding: 16, paddingHorizontal: 40 },
  backButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 20,
    gap: 10,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2C3E50' },
  countBadge: {
    backgroundColor: '#4776E6',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4776E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  taskIcon: { fontSize: 32, marginLeft: 12 },
  taskTitleSection: { flex: 1, alignItems: 'flex-end' },
  taskTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', textAlign: 'right', marginBottom: 6 },
  pointsBadge: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F39C12',
  },
  pointsBadgeText: { fontSize: 13, color: '#E67E22', fontWeight: 'bold' },
  taskDescription: { fontSize: 14, color: '#7F8C8D', textAlign: 'right', marginBottom: 12 },
  noteContainer: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 12, marginBottom: 12 },
  noteLabel: { fontSize: 13, fontWeight: 'bold', color: '#856404', marginBottom: 4, textAlign: 'right' },
  noteText: { fontSize: 14, color: '#856404', textAlign: 'right' },
  photoContainer: { marginBottom: 12 },
  photoLabel: { fontSize: 13, fontWeight: 'bold', color: '#2C3E50', textAlign: 'right', marginBottom: 8 },
  photoWrap: { width: '100%', minHeight: 200, backgroundColor: '#F0F2FF', borderRadius: 12, overflow: 'hidden' },
  photo: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#F0F2FF' },
  quizScore: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizScoreLabel: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50' },
  quizScoreText: { fontSize: 20, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', gap: 12 },
  approveWrapper: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  rejectWrapper: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  actionBtn: { padding: 16, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  tabRow: { flexDirection: 'row', backgroundColor: '#E8EBFF', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 },
  tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#4776E6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  tabText: { fontSize: 13, color: '#7F8C8D', fontWeight: '600' },
  tabTextActive: { color: '#4776E6' },
  doneBadge: { borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 4 },
  doneBadgeText: { fontSize: 15, fontWeight: 'bold' },
});
