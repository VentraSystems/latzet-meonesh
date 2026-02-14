import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { UserRole } from '../types';

// Enable RTL for Hebrew
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

interface Props {
  onRoleSelect: (role: UserRole) => void;
}

export default function RoleSelection({ onRoleSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>לצאת מעונש</Text>
      <Text style={styles.subtitle}>בחר את סוג המשתמש</Text>

      <TouchableOpacity
        style={[styles.button, styles.parentButton]}
        onPress={() => onRoleSelect('parent')}
      >
        <Text style={styles.buttonText}>👨‍👩‍👧‍👦 הורה</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.childButton]}
        onPress={() => onRoleSelect('child')}
      >
        <Text style={styles.buttonText}>👶 ילד</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#7F8C8D',
    marginBottom: 50,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  parentButton: {
    backgroundColor: '#3498DB',
  },
  childButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
