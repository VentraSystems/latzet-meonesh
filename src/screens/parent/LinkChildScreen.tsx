import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createLinkingCode } from '../../utils/linkingCode';
import { showAlert } from '../../utils/alert';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LinkChildScreen({ navigation }: any) {
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const generateCode = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const code = await createLinkingCode(user.uid);
      setLinkingCode(code);
    } catch (error: any) {
      showAlert(t.common.error, t.linkChild.errorGenerate);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.linkChild.title}</Text>
      <Text style={styles.description}>{t.linkChild.desc}</Text>

      {!linkingCode ? (
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.generateButtonText}>{t.linkChild.generateBtn}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>{t.linkChild.yourCode}</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{linkingCode}</Text>
          </View>
          <Text style={styles.codeInfo}>{t.linkChild.codeValid}</Text>
          <Text style={styles.instructions}>{t.linkChild.instructions}</Text>

          <TouchableOpacity
            style={styles.newCodeButton}
            onPress={generateCode}
          >
            <Text style={styles.newCodeButtonText}>{t.linkChild.newCode}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>{t.linkChild.back}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  generateButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  codeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  codeLabel: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  codeBox: {
    backgroundColor: '#3498DB10',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  code: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3498DB',
    letterSpacing: 8,
  },
  codeInfo: {
    fontSize: 14,
    color: '#E67E22',
    marginBottom: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 20,
  },
  newCodeButton: {
    backgroundColor: '#ECF0F1',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 30,
  },
  newCodeButtonText: {
    color: '#3498DB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#3498DB',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
