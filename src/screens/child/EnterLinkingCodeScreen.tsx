import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { verifyAndUseLinkingCode } from '../../utils/linkingCode';

export default function EnterLinkingCodeScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user || !code || code.length !== 6) {
      Alert.alert('שגיאה', 'נא להזין קוד בן 6 ספרות');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyAndUseLinkingCode(code, user.uid);

      if (!result.success) {
        Alert.alert('שגיאה', result.error || 'קוד לא תקין');
        setLoading(false);
        return;
      }

      // Link child to parent
      await updateDoc(doc(db, 'users', user.uid), {
        linkedUserId: result.parentId,
      });

      // Link parent to child
      await updateDoc(doc(db, 'users', result.parentId!), {
        linkedUserId: user.uid,
      });

      Alert.alert(
        'הצלחה! 🎉',
        'חוברת בהצלחה להורה שלך!',
        [{ text: 'אישור', onPress: () => navigation.replace('ChildFlow') }]
      );
    } catch (error: any) {
      Alert.alert('שגיאה', 'משהו השתבש. נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>חיבור להורה</Text>
      <Text style={styles.description}>
        הזן את הקוד בן 6 הספרות שקיבלת מההורה שלך
      </Text>

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
          <Text style={styles.submitButtonText}>התחבר</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.replace('ChildFlow')}
      >
        <Text style={styles.skipButtonText}>דלג לעכשיו</Text>
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
