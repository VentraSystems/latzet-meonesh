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
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 60,
    marginBottom: 12,
  },
  appName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  loginButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
  },
  loginButton: {
    padding: 18,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: 'rgba(255,255,255,0.45)',
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
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupLinkText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
  },
  signupLinkBold: {
    fontWeight: 'bold',
    color: '#8E54E9',
  },
  childBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247,151,30,0.3)',
  },
  childBoxIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  childBoxTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd200',
    marginBottom: 4,
  },
  childBoxDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 16,
  },
  childButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  childButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  childButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
