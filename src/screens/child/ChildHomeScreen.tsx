import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { C, R, R_LG, shadow, shadowSm } from '../../theme';

export default function ChildHomeScreen({ navigation }: any) {
  const { user, linkedUserId, logout } = useAuth();
  const [childName, setChildName] = useState('');
  const [activePunishment, setActivePunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownFreedom, setHasShownFreedom] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const { t, isRTL, language } = useLanguage();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChildName(data.name);
        setTotalPoints(data.totalPoints || 0);
        setBadgeCount((data.badges || []).length);
      }
    });

    // Single-field query (no composite index needed) — filter status client-side
    const q = query(
      collection(db, 'punishments'),
      where('childId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const active = snapshot.docs
        .filter((d) => d.data().status === 'active')
        .sort((a, b) => {
          const aTime = a.data().createdAt?.toMillis?.() || 0;
          const bTime = b.data().createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      if (active.length > 0) {
        // Merge tasks from ALL active punishments so the child sees everything
        const mergedTasks = active.flatMap((d) =>
          (d.data().tasks || []).map((t: any) => ({ ...t, _punishmentId: d.id }))
        );
        setActivePunishment({
          id: active[0].id,
          ...active[0].data(),
          tasks: mergedTasks,
          parentId: active[0].data().parentId,
        });
      } else {
        setActivePunishment(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Punishment query error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activePunishment || hasShownFreedom) return;
    const tasks = activePunishment.tasks || [];
    const allApproved = tasks.length > 0 && tasks.every((t: any) => t.status === 'approved');
    if (allApproved) {
      setTimeout(() => {
        setHasShownFreedom(true);
        navigation.navigate('Freedom', { punishmentId: activePunishment.id });
      }, 500);
    }
  }, [activePunishment, hasShownFreedom, navigation]);

  // Helper: is a task available today?
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = activePunishment?.tasks?.filter((t: any) =>
    !t.unlockDate || t.unlockDate <= today
  ) || [];
  const todayPendingOrSubmitted = todayTasks.filter((t: any) =>
    t.status === 'pending' || t.status === 'submitted'
  );
  // Child is effectively "free" today if all today's tasks are approved (even if future recurring tasks remain)
  const effectivelyFree = todayTasks.length > 0 && todayPendingOrSubmitted.length === 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  const isInPunishment = activePunishment !== null;
  const tasks = activePunishment?.tasks || [];
  const completedTasks = tasks.filter((t: any) => t.status === 'approved').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const remaining = totalTasks - completedTasks;
  const hasRecurringFutureTasks = tasks.some((t: any) => t.unlockDate && t.unlockDate > today);

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
      case 'approved': return t.tasksList.statusApproved;
      case 'submitted': return t.tasksList.statusSubmitted;
      case 'rejected': return t.tasksList.statusRejected;
      default: return t.tasksList.statusPending;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return C.success;
      case 'submitted': return C.warning;
      case 'rejected': return C.danger;
      default: return C.textLow;
    }
  };

  if (!linkedUserId) {
    return (
      <View style={styles.fullScreen}>
        <ScrollView contentContainerStyle={styles.freedomContainer}>
          <Text style={styles.freedomEmoji}>🔗</Text>
          <Text style={styles.freedomTitle}>{t.childHome.noParentTitle}</Text>
          <Text style={styles.freedomSubtitle}>{t.childHome.noParentDesc}</Text>
          <TouchableOpacity
            style={styles.primaryButtonWrapper}
            onPress={() => navigation.navigate('EnterLinkingCode')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={C.gradSuccess} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.primaryButtonText}>{t.childHome.connectParentBtn}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>{t.childHome.logoutBtn}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Show "great job today" screen when recurring tasks exist but today's are all done
  if (isInPunishment && effectivelyFree && hasRecurringFutureTasks) {
    return (
      <View style={styles.fullScreen}>
        <ScrollView contentContainerStyle={styles.freedomContainer}>
          <Text style={styles.freedomEmoji}>🌟</Text>
          <Text style={styles.freedomTitle}>{t.childHome.freeTitle.replace('{name}', childName)}</Text>
          <Text style={styles.freedomSubtitle}>{t.childHome.freeSubtitle}</Text>
          <View style={styles.freedomCard}>
            <Text style={styles.freedomCardEmoji}>🔁</Text>
            <Text style={styles.freedomCardText}>
              {language === 'en'
                ? "Great job today! Your next task will be available tomorrow. Keep it up!"
                : "כל הכבוד על היום! המשימה הבאה תהיה זמינה מחר. המשך כך!"}
            </Text>
          </View>
          <TouchableOpacity style={styles.primaryButtonWrapper} onPress={() => navigation.navigate('Badges')} activeOpacity={0.85}>
            <LinearGradient colors={C.gradAmber} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.primaryButtonText, { color: C.bg }]}>{t.childHome.badgesBtn}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButtonWrapper} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.85}>
            <LinearGradient colors={C.gradAmber} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.primaryButtonText, { color: C.bg }]}>💰 My Wallet</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>{t.childHome.logoutBtn}</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>{t.childHome.footer}</Text>
        </ScrollView>
      </View>
    );
  }

  if (!isInPunishment) {
    return (
      <View style={styles.fullScreen}>
        <ScrollView contentContainerStyle={styles.freedomContainer}>
          <Text style={styles.freedomEmoji}>🎉</Text>
          <Text style={styles.freedomTitle}>{t.childHome.freeTitle.replace('{name}', childName)}</Text>
          <Text style={styles.freedomSubtitle}>{t.childHome.freeSubtitle}</Text>
          <Text style={styles.freedomSubtitle}>{t.childHome.freeSub2}</Text>

          <View style={styles.freedomCard}>
            <Text style={styles.freedomCardEmoji}>💡</Text>
            <Text style={styles.freedomCardText}>{t.childHome.freeCard}</Text>
          </View>

          <TouchableOpacity style={styles.primaryButtonWrapper} onPress={() => navigation.navigate('Badges')} activeOpacity={0.85}>
            <LinearGradient colors={C.gradAmber} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.primaryButtonText, { color: C.bg }]}>{t.childHome.badgesBtn}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButtonWrapper} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.85}>
            <LinearGradient colors={C.gradAmber} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.primaryButtonText, { color: C.bg }]}>💰 My Wallet</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>{t.childHome.logoutBtn}</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>{t.childHome.footer}</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#13152A', '#1E2140']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        {/* Points & Badges Row */}
        <View style={styles.statsTopRow}>
          <TouchableOpacity style={styles.pointsPill} onPress={() => navigation.navigate('Badges')} activeOpacity={0.8}>
            <Text style={styles.pointsPillText}>⭐ {totalPoints}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.badgesPill} onPress={() => navigation.navigate('Badges')} activeOpacity={0.8}>
            <Text style={styles.badgesPillText}>🏆 {badgeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletPill} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.8}>
            <Text style={styles.walletPillText}>💰</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutPill} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutPillText}>{t.childHome.logoutPill}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerEmoji}>😔</Text>
        <Text style={styles.headerTitle}>{t.childHome.freeTitle.replace('{name}', childName)}</Text>
        <Text style={styles.headerSubtitle}>{t.childHome.inPunishment}</Text>
        <View style={styles.punishmentNameBadge}>
          <Text style={styles.punishmentName}>{activePunishment.name}</Text>
        </View>
      </LinearGradient>

      {/* Motivation Banner */}
      {remaining > 0 && (
        <View style={styles.motivationBanner}>
          <Text style={[styles.motivationText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {remaining === 1
              ? t.childHome.motivationBanner1.replace('{n}', String(remaining))
              : t.childHome.motivationBannerN.replace('{n}', String(remaining))}
          </Text>
        </View>
      )}

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>{t.childHome.progressTitle}</Text>
        <View style={styles.progressNumbers}>
          <Text style={styles.progressBig}>{completedTasks}</Text>
          <Text style={styles.progressSlash}> / </Text>
          <Text style={styles.progressTotal}>{totalTasks}</Text>
        </View>
        <Text style={styles.progressLabel}>{t.badges.tasksCompleted}</Text>

        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={C.gradSuccess}
            style={[styles.progressBarFill, { width: `${progress}%` as any }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        <View style={styles.progressPctRow}>
          <Text style={styles.progressPctText}>{Math.round(progress)}%</Text>
          {progress === 100 && <Text style={styles.allDoneText}>{t.common.success} 🎉</Text>}
        </View>
      </View>

      {/* Tasks */}
      <View style={styles.tasksSection}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.tasksList.yourTasks}</Text>
        {tasks.map((task: any) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            onPress={() => navigation.navigate('TasksList', { punishmentId: activePunishment.id })}
            activeOpacity={0.8}
          >
            <View style={styles.taskLeft}>
              <Text style={styles.taskEmoji}>{getStatusEmoji(task.status)}</Text>
            </View>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{task.title}</Text>
              <Text style={[styles.taskStatus, { color: getStatusColor(task.status), textAlign: isRTL ? 'right' : 'left' }]}>
                {getStatusText(task.status)}
              </Text>
            </View>
            <Text style={styles.taskArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.ctaWrapper}
          onPress={() => navigation.navigate('TasksList', { punishmentId: activePunishment.id })}
          activeOpacity={0.85}
        >
          <LinearGradient colors={C.grad} style={styles.ctaButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.ctaButtonText}>{t.childHome.tasksBtn}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t.childHome.footer}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  fullScreen: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  freedomContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingTop: 80,
    paddingBottom: 60,
  },
  freedomEmoji: { fontSize: 80, marginBottom: 20 },
  freedomTitle: { fontSize: 30, fontWeight: '700', color: C.text, marginBottom: 10, textAlign: 'center', letterSpacing: 0.2 },
  freedomSubtitle: { fontSize: 16, color: C.textMed, textAlign: 'center', marginBottom: 6 },
  freedomCard: {
    backgroundColor: C.surface,
    borderRadius: R_LG,
    padding: 24,
    alignItems: 'center',
    marginTop: 28,
    borderWidth: 1,
    borderColor: C.border,
    width: '100%',
    ...shadow,
  },
  freedomCardEmoji: { fontSize: 40, marginBottom: 10 },
  freedomCardText: { fontSize: 16, color: C.textMed, textAlign: 'center', lineHeight: 24 },

  primaryButtonWrapper: { width: '100%', borderRadius: R, overflow: 'hidden', marginTop: 16, ...shadowSm },
  primaryButton: { padding: 17, alignItems: 'center' },
  primaryButtonText: { color: C.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  logoutBtn: { marginTop: 28, padding: 12 },
  logoutBtnText: { color: C.danger, fontSize: 15, fontWeight: '600' },

  header: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  statsTopRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  pointsPill: { backgroundColor: C.accentDim, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.accent },
  pointsPillText: { color: C.accent, fontWeight: '700', fontSize: 13 },
  badgesPill: { backgroundColor: C.warningDim, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.warning },
  badgesPillText: { color: C.warning, fontWeight: '700', fontSize: 13 },
  walletPill: { backgroundColor: C.warningDim, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.warning },
  walletPillText: { color: C.warning, fontWeight: '700', fontSize: 13 },
  logoutPill: { backgroundColor: C.surface2, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  logoutPillText: { color: C.textLow, fontSize: 12 },

  headerEmoji: { fontSize: 56, marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 4, letterSpacing: 0.2 },
  headerSubtitle: { fontSize: 17, color: C.textMed, marginBottom: 14 },
  punishmentNameBadge: { backgroundColor: C.dangerDim, paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.danger },
  punishmentName: { fontSize: 14, fontWeight: '600', color: C.danger },

  motivationBanner: {
    backgroundColor: C.warningDim,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: R,
    borderLeftWidth: 3,
    borderLeftColor: C.warning,
  },
  motivationText: { fontSize: 15, color: C.warning, fontWeight: '600' },

  progressCard: {
    backgroundColor: C.surface,
    margin: 16,
    borderRadius: R_LG,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    ...shadow,
  },
  progressTitle: { fontSize: 15, fontWeight: '600', color: C.textMed, marginBottom: 12, letterSpacing: 0.3 },
  progressNumbers: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  progressBig: { fontSize: 52, fontWeight: '700', color: C.accent },
  progressSlash: { fontSize: 28, color: C.textLow, fontWeight: '300' },
  progressTotal: { fontSize: 28, fontWeight: '700', color: C.textLow },
  progressLabel: { fontSize: 13, color: C.textLow, marginBottom: 16 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: C.surface2, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressPctRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressPctText: { fontSize: 14, fontWeight: '600', color: C.success },
  allDoneText: { fontSize: 14, fontWeight: '600', color: C.success },

  tasksSection: { paddingHorizontal: 16, paddingTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.2 },
  taskCard: {
    backgroundColor: C.surface,
    borderRadius: R,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    ...shadowSm,
  },
  taskLeft: { marginRight: 14 },
  taskEmoji: { fontSize: 24 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  taskStatus: { fontSize: 12, fontWeight: '600' },
  taskArrow: { color: C.textLow, fontSize: 20, marginLeft: 8 },

  ctaSection: { padding: 16, paddingTop: 8 },
  ctaWrapper: { borderRadius: R, overflow: 'hidden', ...shadowSm },
  ctaButton: { padding: 18, alignItems: 'center' },
  ctaButtonText: { color: C.text, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  footer: { alignItems: 'center', padding: 24, paddingTop: 12, marginBottom: 20 },
  footerText: { fontSize: 11, color: C.textLow },
});
