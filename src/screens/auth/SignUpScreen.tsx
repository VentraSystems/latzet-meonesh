import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

export default function SignUpScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword || !role) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return;
    }

    if (password.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, role);
      Alert.alert('הצלחה!', 'החשבון נוצר בהצלחה');
    } catch (error: any) {
      Alert.alert('שגיאת הרשמה', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>לצאת מעונש</Text>
        <Text style={styles.subtitle}>הרשמה</Text>

        <View style={styles.roleSelection}>
          <Text style={styles.roleTitle}>בחר את התפקיד שלך:</Text>

          <TouchableOpacity
            style={[
              styles.roleButton,
              styles.parentRole,
              role === 'parent' && styles.roleSelected,
            ]}
            onPress={() => setRole('parent')}
          >
            <Text style={styles.roleButtonText}>👨‍👩‍👧‍👦 הורה</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              styles.childRole,
              role === 'child' && styles.roleSelected,
            ]}
            onPress={() => setRole('child')}
          >
            <Text style={styles.roleButtonText}>👶 ילד</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="שם מלא"
            value={name}
            onChangeText={setName}
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="אימייל"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="סיסמה (לפחות 6 תווים)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="אימות סיסמה"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>הירשם</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              כבר יש לך חשבון? <Text style={styles.loginLinkBold}>התחבר כאן</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
  },
  roleSelection: {
    marginBottom: 30,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
  },
  roleButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  parentRole: {
    backgroundColor: '#3498DB20',
  },
  childRole: {
    backgroundColor: '#E74C3C20',
  },
  roleSelected: {
    borderColor: '#2C3E50',
    borderWidth: 3,
  },
  roleButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  signUpButton: {
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: '#3498DB',
  },
});
