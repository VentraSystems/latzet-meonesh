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
import { showAlert } from '../../utils/alert';
import { useLanguage } from '../../contexts/LanguageContext';
import { C, R, R_LG, shadow } from '../../theme';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { t, isRTL } = useLanguage();

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert(t.common.error, t.login.errorFill);
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      showAlert(t.login.errorLogin, error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      showAlert(t.common.error, error.message);
    }
  };

  return (
    <View style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.logo}>🚪</Text>
            <Text style={styles.appName}>{t.appName}</Text>
            <Text style={styles.tagline}>{t.login.tagline}</Text>
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder={t.login.email}
              placeholderTextColor="#9BA5B4"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign={isRTL ? 'right' : 'left'}
            />

            <TextInput
              style={styles.input}
              placeholder={t.login.password}
              placeholderTextColor="#9BA5B4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textAlign={isRTL ? 'right' : 'left'}
            />

            <TouchableOpacity
              style={styles.loginButtonWrapper}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#4776E6', '#8E54E9']}
                style={styles.loginButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>{t.login.loginBtn}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t.common.or}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} activeOpacity={0.85}>
              <View style={styles.googleLogo}>
                <Text style={styles.googleLogoText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>{t.login.googleBtn}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signupLinkText}>
                {t.login.noAccount} <Text style={styles.signupLinkBold}>{t.login.signupLink}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.childBox}>
            <Text style={styles.childBoxIcon}>⚡</Text>
            <Text style={styles.childBoxTitle}>{t.login.childTitle}</Text>
            <Text style={styles.childBoxDesc}>{t.login.childDesc}</Text>
            <TouchableOpacity
              style={styles.childButton}
              onPress={() => navigation.navigate('ChildOnboarding')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#f7971e', '#ffd200']}
                style={styles.childButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.childButtonText}>{t.login.childBtn}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: C.bg,
  },
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    fontSize: 56,
    marginBottom: 16,
  },
  appName: {
    fontSize: 30,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: C.textMed,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: R_LG,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    ...shadow,
  },
  input: {
    backgroundColor: C.surface2,
    borderRadius: R,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
  },
  loginButtonWrapper: {
    borderRadius: R,
    overflow: 'hidden',
    marginTop: 8,
  },
  loginButton: {
    padding: 17,
    alignItems: 'center',
  },
  loginButtonText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    marginHorizontal: 14,
    color: C.textLow,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface2,
    borderRadius: R,
    padding: 15,
    borderWidth: 1,
    borderColor: C.borderStrong,
    gap: 12,
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
  },
  googleButtonText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
  },
  signupLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  signupLinkText: {
    fontSize: 14,
    color: C.textMed,
  },
  signupLinkBold: {
    fontWeight: '700',
    color: C.accent,
  },
  childBox: {
    backgroundColor: C.surface,
    borderRadius: R_LG,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    ...shadow,
  },
  childBoxIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  childBoxTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.warning,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  childBoxDesc: {
    fontSize: 13,
    color: C.textMed,
    marginBottom: 16,
    textAlign: 'center',
  },
  childButton: {
    width: '100%',
    borderRadius: R,
    overflow: 'hidden',
  },
  childButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  childButtonText: {
    color: '#0A0C17',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
