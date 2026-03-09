import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ParentHomeScreen({ navigation }: any) {
  const { user, linkedUserId, logout } = useAuth();
  const [childName, setChildName] = useState('');
  const [activePunishment, setActivePunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    if (!linkedUserId) {
      setLoading(false);
      return;
    }

    getDoc(doc(db, 'users', linkedUserId)).then((docSnap) => {
      if (docSnap.exists()) {
        setChildName(docSnap.data().name);
      }
    });

    const q = query(
      collection(db, 'punishments'),
      where('parentId', '==', user!.uid),
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
  }, [linkedUserId]);

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E54E9" />
      </LinearGradient>
    );
  }

  const isInPunishment = activePunishment !== null;
  const completedTasks = activePunishment?.tasks?.filter((t: any) => t.status === 'approved').length || 0;
  const totalTasks = activePunishment?.tasks?.length || 0;
  const pendingTasks = activePunishment?.tasks?.filter((t: any) => t.status === 'submitted').length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (!linkedUserId) {
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
      <LinearGradient colors={['#4776E6', '#8E54E9']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerGreeting}>{t.parentHome.greeting}</Text>
          <Text style={styles.childNameText}>
            {childName ? `${t.parentHome.child}: ${childName}` : t.parentHome.loading}
          </Text>
        </View>
      </LinearGradient>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, isInPunishment ? styles.punishmentBadge : styles.freeBadge]}>
            <Text style={styles.statusBadgeText}>
              {isInPunishment ? t.parentHome.inPunishment : t.parentHome.free}
            </Text>
          </View>
          <Text style={styles.statusLabel}>{t.parentHome.statusLabel}</Text>
        </View>

        {isInPunishment && (
          <>
            <Text style={[styles.punishmentName, { textAlign: isRTL ? 'right' : 'left' }]}>{activePunishment.name}</Text>

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
                <Text style={[styles.statNumber, pendingTasks > 0 && styles.statNumberWarning]}>{pendingTasks}</Text>
                <Text style={styles.statLabel}>{t.parentHome.pending}</Text>
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#27AE60', '#2ECC71']}
                style={[styles.progressBarFill, { width: `${progress}%` as any }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={[styles.progressPct, { textAlign: isRTL ? 'right' : 'left' }]}>{Math.round(progress)}{t.parentHome.percentCompleted}</Text>

            {pendingTasks > 0 && (
              <View style={styles.alertBanner}>
                <Text style={[styles.alertBannerText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {pendingTasks === 1
                    ? t.parentHome.pendingAlert1.replace('{n}', String(pendingTasks))
                    : t.parentHome.pendingAlertN.replace('{n}', String(pendingTasks))}
                </Text>
              </View>
            )}
          </>
        )}

        {!isInPunishment && (
          <View style={styles.freeMsg}>
            <Text style={styles.freeMsgEmoji}>😊</Text>
            <Text style={styles.freeMsgText}>{t.parentHome.freeMsg}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButtonWrapper}
          onPress={() => navigation.navigate('SetPunishment')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#4776E6', '#8E54E9']} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.primaryButtonText}>{t.parentHome.newPunishment}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {isInPunishment && pendingTasks > 0 && (
          <TouchableOpacity
            style={styles.approveButtonWrapper}
            onPress={() => navigation.navigate('TaskApproval', { punishmentId: activePunishment.id })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.primaryButtonText}>{t.parentHome.approveTasks.replace('{n}', String(pendingTasks))}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.analyticsButtonWrapper}
          onPress={() => navigation.navigate('Analytics')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#1a1a2e', '#0f3460']} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.primaryButtonText}>{t.parentHome.reports}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>{t.parentHome.settings}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reconnectButton}
          onPress={() => navigation.navigate('LinkChild')}
          activeOpacity={0.85}
        >
          <Text style={styles.reconnectButtonText}>🔗 {t.parentHome.reconnectChild}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t.parentHome.footer}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2FF',
  },
  fullScreen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChildContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noChildEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  noChildTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  noChildText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  logoutBtn: {
    marginTop: 20,
    padding: 12,
  },
  logoutBtnText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerGreeting: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childNameText: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
    marginRight: 8,
  },
  settingsIcon: {
    fontSize: 26,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#4776E6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2C3E50',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
  },
  punishmentBadge: {
    backgroundColor: '#FF6B6B',
  },
  freeBadge: {
    backgroundColor: '#27AE60',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  punishmentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F9FF',
    borderRadius: 14,
  },
  statBoxMiddle: {
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4776E6',
  },
  statNumberWarning: {
    color: '#F39C12',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#ECF0F1',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPct: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
  alertBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
  },
  alertBannerText: {
    fontSize: 15,
    color: '#E67E22',
    fontWeight: '600',
  },
  freeMsg: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  freeMsgEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  freeMsgText: {
    fontSize: 18,
    color: '#27AE60',
    fontWeight: '600',
  },
  actions: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  primaryButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4776E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  approveButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  analyticsButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButton: {
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8EBFF',
  },
  secondaryButtonText: {
    color: '#4776E6',
    fontSize: 17,
    fontWeight: '600',
  },
  reconnectButton: {
    padding: 12,
    alignItems: 'center',
  },
  reconnectButtonText: {
    color: '#95A5A6',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 12,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#B0B8D4',
  },
});
