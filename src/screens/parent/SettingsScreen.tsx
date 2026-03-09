import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { showAlert } from '../../utils/alert';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout, linkedUserId } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Get parent data
      const parentDoc = await getDoc(doc(db, 'users', user.uid));
      if (parentDoc.exists()) {
        const parentData = parentDoc.data();
        setParentName(parentData.name || '');
        setParentEmail(parentData.email || '');
      }

      // Get child data if linked
      if (linkedUserId) {
        const childDoc = await getDoc(doc(db, 'users', linkedUserId));
        if (childDoc.exists()) {
          const childData = childDoc.data();
          setChildName(childData.name || '');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showAlert(
      t.settings.logoutConfirmTitle,
      t.settings.logoutConfirmMsg,
      [
        { text: t.settings.cancelBtn, style: 'cancel' },
        {
          text: t.settings.logoutBtn,
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              showAlert(t.common.error, t.settings.errorLogout);
            }
          },
        },
      ]
    );
  };

  const handleUnlinkChild = () => {
    showAlert(
      t.settings.unlinkConfirmTitle,
      t.settings.unlinkConfirmMsg.replace('{name}', childName),
      [
        { text: t.settings.cancelBtn, style: 'cancel' },
        {
          text: t.settings.unlinkBtn,
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', user!.uid), { linkedUserId: null });
              if (linkedUserId) {
                await updateDoc(doc(db, 'users', linkedUserId), { linkedUserId: null });
              }
              showAlert(t.common.success, t.settings.unlinkSuccess, [
                { text: t.common.ok, onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              showAlert(t.common.error, t.settings.errorUnlink);
            }
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    showAlert(t.settings.aboutTitle, t.settings.aboutMsg, [{ text: t.settings.closeBtn }]);
  };

  const handleHelp = () => {
    showAlert(t.settings.helpTitle, t.settings.helpMsg, [{ text: t.settings.understoodBtn }]);
  };

  const handlePrivacy = () => {
    showAlert(t.settings.privacyTitle, t.settings.privacyMsg, [{ text: t.settings.closeBtn }]);
  };

  const handleDeleteAccount = () => {
    showAlert(
      t.settings.deleteConfirmTitle,
      t.settings.deleteConfirmMsg,
      [
        { text: t.settings.cancelBtn, style: 'cancel' },
        {
          text: t.settings.deleteForever,
          style: 'destructive',
          onPress: () => {
            showAlert(
              t.settings.deleteFinalTitle,
              t.settings.deleteFinalMsg,
              [
                { text: t.settings.cancelBtn, style: 'cancel' },
                {
                  text: t.settings.deleteAll,
                  style: 'destructive',
                  onPress: async () => {
                    showAlert(t.settings.deleteSoonTitle, t.settings.deleteSoonMsg);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.profile}</Text>

        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {parentName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{parentName}</Text>
              <Text style={styles.profileEmail}>{parentEmail}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.settings.parentBadge}</Text>
              </View>
            </View>
          </View>

          {linkedUserId && childName && (
            <View style={styles.childInfo}>
              <Text style={styles.childLabel}>{t.settings.connectedChild}</Text>
              <Text style={styles.childName}>{childName}</Text>
              <TouchableOpacity
                style={styles.unlinkButton}
                onPress={handleUnlinkChild}
              >
                <Text style={styles.unlinkButtonText}>{t.settings.unlinkChild}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!linkedUserId && (
            <View style={styles.noChildInfo}>
              <Text style={styles.noChildText}>{t.settings.noChild}</Text>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('LinkChild')}
              >
                <Text style={styles.linkButtonText}>{t.settings.linkChild}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.language}</Text>
        <View style={styles.card}>
          <Text style={styles.settingTitle}>{t.settings.languageTitle}</Text>
          <View style={[styles.settingRow, { marginTop: 12 }]}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>🇺🇸 English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === 'he' && styles.langBtnActive]}
              onPress={() => setLanguage('he')}
            >
              <Text style={[styles.langBtnText, language === 'he' && styles.langBtnTextActive]}>🇮🇱 עברית</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.notifications}</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t.settings.pushNotifications}</Text>
              <Text style={styles.settingDescription}>{t.settings.pushDesc}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#3498DB' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <Text style={styles.notificationNote}>{t.settings.notificationNote}</Text>
        </View>
      </View>

      {/* App Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.appSettings}</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>{t.settings.help}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>{t.settings.about}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>{t.settings.privacy}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>⭐</Text>
            <Text style={styles.menuText}>{t.settings.rateUs}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.dangerZone}</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.dangerButtonText}>{t.settings.deleteAccount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t.settings.logout}</Text>
      </TouchableOpacity>

      {/* App Version & Branding */}
      <View style={styles.brandingContainer}>
        <Text style={styles.version}>{t.settings.version}</Text>
        <Text style={styles.madeWith}>{t.settings.madeWith}</Text>

        <View style={styles.logoContainer}>
          <Text style={styles.ventraText}>VENTRA</Text>
          <Text style={styles.softwareText}>SOFTWARE SYSTEMS LTD</Text>
        </View>
      </View>

      <View style={styles.bottomSpacing} />
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
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'right',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-end',
    backgroundColor: '#3498DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childInfo: {
    backgroundColor: '#E8F8F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  childLabel: {
    fontSize: 14,
    color: '#16A085',
    marginBottom: 6,
    textAlign: 'right',
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    textAlign: 'right',
    marginBottom: 12,
  },
  unlinkButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  unlinkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noChildInfo: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  noChildText: {
    fontSize: 16,
    color: '#856404',
    marginBottom: 12,
  },
  linkButton: {
    backgroundColor: '#3498DB',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'right',
  },
  notificationNote: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'right',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuIcon: {
    fontSize: 24,
    marginLeft: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'right',
  },
  menuArrow: {
    fontSize: 24,
    color: '#BDC3C7',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECF0F1',
  },
  dangerButton: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E74C3C',
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 15,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  version: {
    fontSize: 12,
    color: '#BDC3C7',
    textAlign: 'center',
    marginBottom: 8,
  },
  madeWith: {
    fontSize: 11,
    color: '#95A5A6',
    textAlign: 'center',
    marginBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  ventraText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498DB',
    letterSpacing: 2,
  },
  softwareText: {
    fontSize: 10,
    color: '#7F8C8D',
    letterSpacing: 1,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 40,
  },
  langBtn: {
    flex: 1,
    backgroundColor: '#ECF0F1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langBtnActive: {
    backgroundColor: '#3498DB20',
    borderColor: '#3498DB',
  },
  langBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  langBtnTextActive: {
    color: '#3498DB',
  },
});
