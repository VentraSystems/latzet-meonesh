import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ChildHomeScreen({ navigation }: any) {
  const { user, linkedUserId, logout } = useAuth();
  const [childName, setChildName] = useState('');
  const [activePunishment, setActivePunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownFreedom, setHasShownFreedom] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const { t, isRTL } = useLanguage();

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

  if (loading) {
    return (
      <LinearGradient colors={['#c0392b', '#e74c3c', '#f39c12']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </LinearGradient>
    );
  }

  const isInPunishment = activePunishment !== null;
  const tasks = activePunishment?.tasks || [];
  const completedTasks = tasks.filter((t: any) => t.status === 'approved').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const remaining = totalTasks - completedTasks;

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
      case 'approved': return '#27AE60';
      case 'submitted': return '#F39C12';
      case 'rejected': return '#E74C3C';
      default: return '#7F8C8D';
    }
  };

  if (!linkedUserId) {
    return (
      <LinearGradient colors={['#c0392b', '#e74c3c', '#e67e22']} style={styles.fullScreen}>
        <ScrollView contentContainerStyle={styles.freedomContainer}>
          <Text style={styles.freedomEmoji}>🔗</Text>
          <Text style={styles.freedomTitle}>{t.childHome.noParentTitle}</Text>
          <Text style={styles.freedomSubtitle}>{t.childHome.noParentDesc}</Text>
          <TouchableOpacity
            style={styles.badgesButton}
            onPress={() => navigation.navigate('EnterLinkingCode')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.badgesButtonGradient}>
              <Text style={styles.badgesButtonText}>{t.childHome.connectParentBtn}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>{t.childHome.logoutBtn}</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (!isInPunishment) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.fullScreen}>
        <ScrollView contentContainerStyle={styles.freedomContainer}>
          <Text style={styles.freedomEmoji}>🎉</Text>
          <Text style={styles.freedomTitle}>{t.childHome.freeTitle.replace('{name}', childName)}</Text>
          <Text style={styles.freedomSubtitle}>{t.childHome.freeSubtitle}</Text>
          <Text style={styles.freedomSubtitle}>{t.childHome.freeSub2}</Text>

          <View style={styles.freedomCard}>
            <Text style={styles.freedomCardEmoji}>💡</Text>
            <Text style={styles.freedomCardText}>{t.childHome.freeCard}</Text>
          </View>

          <TouchableOpacity
            style={styles.badgesButton}
            onPress={() => navigation.navigate('Badges')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#f7971e', '#ffd200']} style={styles.badgesButtonGradient}>
              <Text style={styles.badgesButtonText}>{t.childHome.badgesBtn}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>{t.childHome.logoutBtn}</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>{t.childHome.footer}</Text>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#c0392b', '#e74c3c', '#e67e22']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Points & Badges Row */}
        <View style={styles.statsTopRow}>
          <TouchableOpacity style={styles.pointsPill} onPress={() => navigation.navigate('Badges')} activeOpacity={0.8}>
            <Text style={styles.pointsPillText}>⭐ {totalPoints} {t.childHome.points}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.badgesPill} onPress={() => navigation.navigate('Badges')} activeOpacity={0.8}>
            <Text style={styles.badgesPillText}>🏆 {badgeCount} {t.childHome.badges}</Text>
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
          <Text style={styles.motivationText}>
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
            colors={['#27AE60', '#2ECC71']}
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
            <Text style={styles.taskArrow}>←</Text>
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
          <LinearGradient
            colors={['#c0392b', '#e74c3c']}
            style={styles.ctaButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
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
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  fullScreen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freedomContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingTop: 80,
    paddingBottom: 60,
  },
  freedomEmoji: {
    fontSize: 90,
    marginBottom: 20,
  },
  freedomTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  freedomSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 6,
  },
  freedomCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  freedomCardEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  freedomCardText: {
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  logoutBtn: {
    marginTop: 32,
    padding: 12,
  },
  logoutBtnText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 28,
    paddingTop: 50,
    paddingBottom: 32,
    alignItems: 'center',
  },
  statsTopRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'center',
  },
  pointsPill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  pointsPillText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  badgesPill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgesPillText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  logoutPill: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  logoutPillText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  badgesButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#f7971e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badgesButtonGradient: { padding: 18, alignItems: 'center' },
  badgesButtonText: { color: '#1a1a2e', fontSize: 18, fontWeight: 'bold' },
  headerEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 14,
  },
  punishmentNameBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },
  punishmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  motivationBanner: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
  },
  motivationText: {
    fontSize: 17,
    color: '#E67E22',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  progressNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  progressBig: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  progressSlash: {
    fontSize: 32,
    color: '#BDC3C7',
    fontWeight: 'bold',
  },
  progressTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#95A5A6',
  },
  progressLabel: {
    fontSize: 14,
    color: '#95A5A6',
    marginBottom: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 14,
    backgroundColor: '#ECF0F1',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  progressPctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressPctText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  allDoneText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  tasksSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  taskLeft: {
    marginLeft: 14,
  },
  taskEmoji: {
    fontSize: 28,
  },
  taskInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 3,
  },
  taskStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  taskArrow: {
    color: '#BDC3C7',
    fontSize: 18,
    marginLeft: 10,
  },
  ctaSection: {
    padding: 16,
    paddingTop: 8,
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButton: {
    padding: 20,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#CDBBBB',
  },
});
