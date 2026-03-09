import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { verifyAndUseLinkingCode } from '../../utils/linkingCode';
import { showAlert } from '../../utils/alert';
import { useLanguage } from '../../contexts/LanguageContext';

export default function EnterLinkingCodeScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async () => {
    if (!user || !code || code.length !== 6) {
      showAlert(t.common.error, t.onboarding.errorCode);
      return;
    }

    setLoading(true);
    try {
      const result = await verifyAndUseLinkingCode(code, user.uid);

      if (!result.success) {
        showAlert(t.common.error, result.error || t.onboarding.errorCode);
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        linkedUserId: result.parentId,
      });

      showAlert(
        t.onboarding.welcomeTitle,
        t.childHome.connectParentBtn,
        [{ text: t.common.ok, onPress: () => navigation.replace('ChildHome') }]
      );
    } catch (error: any) {
      showAlert(t.common.error, t.onboarding.errorGeneral);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.linkChild.title}</Text>
      <Text style={styles.description}>{t.onboarding.step1Hint}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="000000"
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading || code.length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>{t.childHome.connectParentBtn}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.replace('ChildHome')}
      >
        <Text style={styles.skipButtonText}>{t.common.back}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E74C3C',
    letterSpacing: 8,
    padding: 20,
  },
  submitButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
});
