import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { showAlert } from '../../utils/alert';

export default function SignUpScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword || !role) {
      showAlert('שגיאה', 'נא למלא את כל השדות');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('שגיאה', 'הסיסמאות אינן תואמות');
      return;
    }
    if (password.length < 6) {
      showAlert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      showAlert('הצלחה!', 'החשבון נוצר בהצלחה');
    } catch (error: any) {
      showAlert('שגיאת הרשמה', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      showAlert('שגיאת התחברות', error.message || 'התחברות עם Google נכשלה');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.logo}>✨</Text>
            <Text style={styles.appName}>לצאת מעונש</Text>
            <Text style={styles.tagline}>יצירת חשבון חדש</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.roleTitle}>בחר את התפקיד שלך:</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleCard, role === 'parent' && styles.roleCardActive]}
                onPress={() => setRole('parent')}
                activeOpacity={0.85}
              >
                {role === 'parent' ? (
                  <LinearGradient colors={['#4776E6', '#8E54E9']} style={styles.roleCardGradient}>
                    <Text style={styles.roleEmoji}>👨‍👩‍👧‍👦</Text>
                    <Text style={styles.roleLabel}>הורה</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.roleCardInner}>
                    <Text style={styles.roleEmoji}>👨‍👩‍👧‍👦</Text>
                    <Text style={styles.roleLabelDim}>הורה</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, role === 'child' && styles.roleCardActive]}
                onPress={() => setRole('child')}
                activeOpacity={0.85}
              >
                {role === 'child' ? (
                  <LinearGradient colors={['#f7971e', '#ffd200']} style={styles.roleCardGradient}>
                    <Text style={styles.roleEmoji}>⭐</Text>
                    <Text style={styles.roleLabelDark}>ילד</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.roleCardInner}>
                    <Text style={styles.roleEmoji}>⭐</Text>
                    <Text style={styles.roleLabelDim}>ילד</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="שם מלא"
              placeholderTextColor="#9BA5B4"
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
            <TextInput
              style={styles.input}
              placeholder="אימייל"
              placeholderTextColor="#9BA5B4"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
            <TextInput
              style={styles.input}
              placeholder="סיסמה"
              placeholderTextColor="#9BA5B4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textAlign="right"
            />
            <TextInput
              style={styles.input}
              placeholder="אימות סיסמה"
              placeholderTextColor="#9BA5B4"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textAlign="right"
            />

            <TouchableOpacity style={styles.signupButtonWrapper} onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.signupButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.signupButtonText}>הירשם עכשיו</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>או</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={googleLoading} activeOpacity={0.85}>
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  <View style={styles.googleLogo}>
                    <Text style={styles.googleLogoText}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>הירשם עם Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>
                כבר יש לך חשבון? <Text style={styles.loginLinkBold}>התחבר כאן</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: 50,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  roleSection: {
    marginBottom: 20,
  },
  roleTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roleCardActive: {
    borderColor: 'rgba(255,255,255,0.4)',
  },
  roleCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  roleCardInner: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  roleEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  roleLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  roleLabelDark: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 16,
  },
  roleLabelDim: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  signupButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
  },
  signupButton: {
    padding: 18,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 12,
  },
  googleLogo: {
    width: 26,
    height: 26,
    borderRadius: 5,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: '#8E54E9',
  },
});
