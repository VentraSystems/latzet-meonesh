import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function ParentHomeScreen({ navigation }: any) {
  const { user, linkedUserId, logout } = useAuth();
  const [childName, setChildName] = useState('');
  const [activePunishment, setActivePunishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!linkedUserId) {
      setLoading(false);
      return;
    }

    // Get child name
    getDoc(doc(db, 'users', linkedUserId)).then((docSnap) => {
      if (docSnap.exists()) {
        setChildName(docSnap.data().name);
      }
    });

    // Listen to active punishment
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  const isInPunishment = activePunishment !== null;
  const completedTasks = activePunishment?.tasks?.filter((t: any) => t.status === 'approved').length || 0;
  const totalTasks = activePunishment?.tasks?.length || 0;
  const pendingTasks = activePunishment?.tasks?.filter((t: any) => t.status === 'submitted').length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (!linkedUserId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>שלום הורה! 👋</Text>
        </View>
        <View style={styles.noChildContainer}>
          <Text style={styles.noChildEmoji}>👶</Text>
          <Text style={styles.noChildTitle}>לא מחובר לילד</Text>
          <Text style={styles.noChildText}>
            כדי להתחיל להשתמש באפליקציה, עליך לחבר ילד לחשבון שלך
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('LinkChild')}
          >
            <Text style={styles.primaryButtonText}>חבר ילד</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>התנתק</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>שלום הורה! 👋</Text>
          <Text style={styles.childName}>ילד: {childName || 'טוען...'}</Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusLabel}>סטטוס:</Text>
          <View style={[styles.statusBadge, isInPunishment ? styles.punishmentBadge : styles.freeBadge]}>
            <Text style={styles.statusText}>
              {isInPunishment ? '🔒 בעונש' : '✅ חופשי'}
            </Text>
          </View>
        </View>

        {isInPunishment && (
          <>
            <Text style={styles.punishmentName}>{activePunishment.name}</Text>

            <View style={styles.progressSection}>
              <Text style={styles.progressText}>
                התקדמות: {completedTasks} מתוך {totalTasks} משימות הושלמו
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
            </View>

            {pendingTasks > 0 && (
              <View style={styles.tasksPending}>
                <Text style={styles.tasksPendingText}>
                  ⏳ {pendingTasks} {pendingTasks === 1 ? 'משימה ממתינה' : 'משימות ממתינות'} לאישור
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SetPunishment')}
        >
          <Text style={styles.primaryButtonText}>➕ הגדר עונש חדש</Text>
        </TouchableOpacity>

        {isInPunishment && pendingTasks > 0 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('TaskApproval', { punishmentId: activePunishment.id })}
          >
            <Text style={styles.secondaryButtonText}>✅ אשר משימות ({pendingTasks})</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.settingsButtonSecondary}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.secondaryButtonText}>⚙️ הגדרות</Text>
        </TouchableOpacity>
      </View>

      {/* Ventra Branding Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ by
        </Text>
        <Text style={styles.footerBrand}>
          Ventra Software Systems LTD
        </Text>
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  noChildText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  logoutButton: {
    marginTop: 20,
    padding: 12,
  },
  logoutButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#3498DB',
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  settingsButton: {
    padding: 8,
    marginLeft: 10,
  },
  settingsIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  childName: {
    fontSize: 18,
    color: '#ECF0F1',
    textAlign: 'right',
    marginTop: 5,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  punishmentBadge: {
    backgroundColor: '#E74C3C',
  },
  freeBadge: {
    backgroundColor: '#27AE60',
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  punishmentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 15,
  },
  progressSection: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'right',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#ECF0F1',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 5,
  },
  tasksPending: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
  },
  tasksPendingText: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'right',
  },
  actionsSection: {
    padding: 15,
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
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
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3498DB',
  },
  secondaryButtonText: {
    color: '#3498DB',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButtonSecondary: {
    backgroundColor: '#95A5A6',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 4,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498DB',
  },
});
