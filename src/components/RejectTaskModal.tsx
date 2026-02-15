import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface RejectTaskModalProps {
  visible: boolean;
  taskTitle: string;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}

export default function RejectTaskModal({
  visible,
  taskTitle,
  onCancel,
  onSubmit,
}: RejectTaskModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onSubmit(reason || 'המשימה לא בוצעה כראוי');
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modal}>
              <Text style={styles.title}>דחיית משימה</Text>
              <Text style={styles.taskTitle}>"{taskTitle}"</Text>
              <Text style={styles.description}>למה אתה דוחה את המשימה?</Text>
              <Text style={styles.hint}>(הילד יראה את ההודעה הזו)</Text>

              <TextInput
                style={styles.input}
                placeholder="לדוגמה: החדר לא נקי מספיק"
                placeholderTextColor="#BDC3C7"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                textAlign="right"
                autoFocus
              />

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.rejectButtonText}>דחה משימה</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: '#F8F9FA',
    color: '#2C3E50',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#ECF0F1',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7F8C8D',
  },
  rejectButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
