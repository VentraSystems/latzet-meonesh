import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R, R_LG, shadow, shadowSm } from '../../theme';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ChildInfo {
  id: string;
  name: string;
}

export default function ParentHomeScreen({ navigation }: any) {
  const { user, linkedUserId, linkedUserIds, setSelectedChild, logout } = useAuth();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [allPunishments, setAllPunishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, isRTL } = useLanguage();

  // Load names for all linked children
  useEffect(() => {
    if (!linkedUserIds.length) {
      setChildren([]);
      setLoading(false);
      return;
    }
    Promise.all(
      linkedUserIds.map(async (childId) => {
        const snap = await getDoc(doc(db, 'users', childId));
        return { id: childId, name: snap.exists() ? (snap.data().name || '') : '' };
      })
    ).then(setChildren).catch(console.error);
  }, [linkedUserIds.join(',')]);

  // Real-time listener for all active punishments for this parent
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'punishments'), where('parentId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const active = snapshot.docs
        .filter((d) => d.data().status === 'active')
        .map((d) => ({ id: d.id, ...d.data() }));
      setAllPunishments(active);
      setLoading(false);
    }, (err) => {
      console.error('Parent punishment query error:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const goToChild = async (childId: string, screen: string, params?: any) => {
    await setSelectedChild(childId);
    navigation.navigate(screen, params);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E54E9" />
      </LinearGradient>
    );
  }

  if (!linkedUserIds.length) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.fullScreen}>
        <View style={styles.noChildContainer}>
          <Text style={styles.noChildEmoji}>👶</Text>
          <Text style={styles.noChildTitle}>{t.parentHome.noChild}</Text>
          <Text style={styles.noChildText}>{t.parentHome.noChildDesc}</Text>
          <TouchableOpacity
            style={styles.primaryButtonWrapper}
            onPress={() => navigation.navigate('LinkChild')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#4776E6', '#8E54E9']} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.primaryButtonText}>{t.parentHome.connectChild}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>{t.common.logout}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#13152A', '#1E2140']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerGreeting}>{t.parentHome.greeting}</Text>
          <Text style={styles.headerSub}>{t.parentHome.myChildren} ({linkedUserIds.length})</Text>
        </View>
      </LinearGradient>

      {/* Child Cards */}
      <View style={styles.cardsContainer}>
        {linkedUserIds.map((childId) => {
          const child = children.find(c => c.id === childId) || { id: childId, name: '' };
          const punishment = allPunishments
            .filter((p) => p.childId === child.id)
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))[0] || null;

          const completedTasks = punishment?.tasks?.filter((task: any) => task.status === 'approved').length || 0;
          const totalTasks = punishment?.tasks?.length || 0;
          const pendingTasks = punishment?.tasks?.filter((task: any) => task.status === 'submitted').length || 0;
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          const isComplete = !!punishment && completedTasks === totalTasks && totalTasks > 0;

          return (
            <View key={child.id} style={[styles.childCard, isComplete && styles.childCardComplete]}>
              {/* Card Header Row */}
              <View style={styles.cardHeader}>
                <View style={[styles.avatarCircle, isComplete && styles.avatarCircleComplete]}>
                  <Text style={styles.avatarText}>{child.name ? child.name.charAt(0).toUpperCase() : '?'}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={[styles.childName, { textAlign: isRTL ? 'right' : 'left' }]}>{child.name || '...'}</Text>
                  <View style={[
                    styles.statusPill,
                    isComplete ? styles.statusDone : punishment ? styles.statusActive : styles.statusFree,
                  ]}>
                    <Text style={styles.statusPillText}>
                      {isComplete
                        ? t.parentHome.challengeComplete
                        : punishment
                          ? t.parentHome.inPunishment
                          : t.parentHome.free}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Section */}
              {punishment && (
                <View style={styles.progressSection}>
                  <Text style={[styles.punishmentName, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {punishment.name}
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>{completedTasks}</Text>
                      <Text style={styles.statLabel}>{t.parentHome.completed}</Text>
                    </View>
                    <View style={[styles.statBox, styles.statBoxMiddle]}>
                      <Text style={styles.statNumber}>{totalTasks}</Text>
                      <Text style={styles.statLabel}>{t.parentHome.total}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statNumber, pendingTasks > 0 && styles.statNumberWarning]}>
                        {pendingTasks}
                      </Text>
                      <Text style={styles.statLabel}>{t.parentHome.pending}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBarBg}>
                    <LinearGradient
                      colors={isComplete ? ['#27AE60', '#2ECC71'] : ['#4776E6', '#8E54E9']}
                      style={[styles.progressBarFill, { width: `${progress}%` as any }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <Text style={[styles.progressPct, { textAlign: isRTL ? 'right' : 'left', color: isComplete ? C.success : C.accent }]}>
                    {Math.round(progress)}{t.parentHome.percentCompleted}
                  </Text>
                  {pendingTasks > 0 && !isComplete && (
                    <View style={styles.alertBanner}>
                      <Text style={[styles.alertBannerText, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {pendingTasks === 1
                          ? t.parentHome.pendingAlert1.replace('{n}', String(pendingTasks))
                          : t.parentHome.pendingAlertN.replace('{n}', String(pendingTasks))}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Action Button */}
              <View style={styles.cardAction}>
                {isComplete && (
                  <TouchableOpacity
                    style={styles.actionWrapper}
                    onPress={() => goToChild(child.id, 'TaskApproval', { punishmentId: punishment.id })}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={styles.actionButtonText}>{t.parentHome.unlockPhone}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {!isComplete && pendingTasks > 0 && (
                  <TouchableOpacity
                    style={styles.actionWrapper}
                    onPress={() => goToChild(child.id, 'TaskApproval', { punishmentId: punishment.id })}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#F39C12', '#E67E22']} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={styles.actionButtonText}>
                        {t.parentHome.approveTasks.replace('{n}', String(pendingTasks))}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {!isComplete && punishment && pendingTasks === 0 && (
                  <TouchableOpacity
                    style={styles.actionWrapper}
                    onPress={() => goToChild(child.id, 'TaskApproval', { punishmentId: punishment.id })}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#4776E6', '#8E54E9']} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={styles.actionButtonText}>{t.parentHome.reviewTasks}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {!punishment && (
                  <TouchableOpacity
                    style={styles.actionWrapper}
                    onPress={() => goToChild(child.id, 'SetPunishment')}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#4776E6', '#8E54E9']} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={styles.actionButtonText}>{t.parentHome.assignChallenge}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.primaryButtonWrapper}
          onPress={() => navigation.navigate('LinkChild')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#1a1a2e', '#0f3460']} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.primaryButtonText}>{t.parentHome.addChild}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButtonWrapper}
          onPress={() => navigation.navigate('Analytics')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#2d1b4e', '#4a2080']} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.primaryButtonText}>{t.parentHome.reports}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButtonWrapper}
          onPress={() => navigation.navigate('ParentWallet')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#F39C12', '#F1C40F']} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.primaryButtonText, { color: '#1a1a2e' }]}>💰 {t.parentHome.walletRewards}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Settings')} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>{t.parentHome.settings}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t.parentHome.footer}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  fullScreen: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  noChildContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  noChildEmoji: { fontSize: 64, marginBottom: 20 },
  noChildTitle: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 10, textAlign: 'center', letterSpacing: 0.2 },
  noChildText: { fontSize: 15, color: C.textMed, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  logoutBtn: { marginTop: 20, padding: 12 },
  logoutBtnText: { color: C.danger, fontSize: 15, fontWeight: '600' },

  header: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerContent: { flex: 1, alignItems: 'flex-end' },
  headerGreeting: { fontSize: 26, fontWeight: '700', color: C.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 14, color: C.textMed, marginTop: 4 },
  settingsButton: { padding: 8, marginRight: 4 },
  settingsIcon: { fontSize: 22 },

  cardsContainer: { padding: 16, gap: 14 },

  childCard: {
    backgroundColor: C.surface,
    borderRadius: R_LG,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    ...shadow,
  },
  childCardComplete: {
    borderColor: '#27AE60',
    borderWidth: 2,
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4776E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarCircleComplete: { backgroundColor: '#27AE60' },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  cardHeaderInfo: { flex: 1, alignItems: 'flex-end' },
  childName: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 6 },

  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusActive: { backgroundColor: C.dangerDim, borderWidth: 1, borderColor: C.danger },
  statusFree: { backgroundColor: C.successDim, borderWidth: 1, borderColor: C.success },
  statusDone: { backgroundColor: '#1a3a1a', borderWidth: 1, borderColor: '#2ECC71' },
  statusPillText: { color: C.text, fontWeight: '700', fontSize: 12 },

  progressSection: { marginBottom: 14 },
  punishmentName: { fontSize: 15, fontWeight: '600', color: C.textMed, marginBottom: 12 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: C.surface2, borderRadius: R, borderWidth: 1, borderColor: C.border },
  statBoxMiddle: { marginHorizontal: 8 },
  statNumber: { fontSize: 22, fontWeight: '700', color: C.accent },
  statNumberWarning: { color: C.warning },
  statLabel: { fontSize: 10, color: C.textLow, marginTop: 2, letterSpacing: 0.3 },

  progressBarBg: { height: 6, backgroundColor: C.surface2, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressPct: { fontSize: 12, fontWeight: '600', marginBottom: 4 },

  alertBanner: {
    backgroundColor: C.warningDim,
    borderRadius: R,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.warning,
  },
  alertBannerText: { fontSize: 13, color: C.warning, fontWeight: '600' },

  cardAction: {},
  actionWrapper: { borderRadius: R, overflow: 'hidden', ...shadowSm },
  actionButton: { padding: 14, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  bottomActions: { padding: 16, paddingTop: 4, gap: 10 },
  primaryButtonWrapper: { borderRadius: R, overflow: 'hidden', ...shadowSm },
  primaryButton: { padding: 17, alignItems: 'center' },
  primaryButtonText: { color: C.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: R,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  secondaryButtonText: { color: C.textMed, fontSize: 15, fontWeight: '600' },

  footer: { alignItems: 'center', padding: 24, paddingTop: 12, marginBottom: 20 },
  footerText: { fontSize: 11, color: C.textLow },
});
