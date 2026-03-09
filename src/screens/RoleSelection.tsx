import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

interface Props {
  onRoleSelect: (role: UserRole) => void;
}

export default function RoleSelection({ onRoleSelect }: Props) {
  const { t, isRTL } = useLanguage();

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🚪</Text>
        <Text style={styles.title}>{t.appName}</Text>
        <Text style={styles.subtitle}>{t.roleSelection.subtitle}</Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => onRoleSelect('parent')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#4776E6', '#8E54E9']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cardEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.cardTitle}>{t.roles.parent}</Text>
            <Text style={styles.cardDesc}>{t.roleSelection.parentDesc}</Text>
            <View style={styles.cardArrow}>
              <Text style={styles.arrowText}>{t.roleSelection.login}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => onRoleSelect('child')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#f7971e', '#ffd200']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cardEmoji}>⭐</Text>
            <Text style={styles.cardTitleDark}>{t.roles.child}</Text>
            <Text style={styles.cardDescDark}>{t.roleSelection.childDesc}</Text>
            <View style={styles.cardArrow}>
              <Text style={styles.arrowTextDark}>{t.roleSelection.login}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t.roleSelection.footer}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 70,
    marginBottom: 16,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  roleCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 60,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardTitleDark: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  cardDescDark: {
    fontSize: 16,
    color: 'rgba(26,26,46,0.75)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  cardArrow: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  arrowText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  arrowTextDark: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
  },
});
