import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

export default function FreedomScreen({ navigation }: any) {
  // Animation would be added here in Phase 6
  const bounceValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(bounceValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(bounceValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const scale = bounceValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>!יצאת מעונש</Text>
        <Text style={styles.subtitle}>כל הכבוד! השלמת את כל המשימות</Text>

        <View style={styles.achievementCard}>
          <Text style={styles.achievementEmoji}>⭐</Text>
          <Text style={styles.achievementText}>הצלחת לצאת מהעונש!</Text>
          <Text style={styles.achievementSubtext}>
            עשית עבודה מצוינת בהשלמת כל המשימות
          </Text>
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.messageIcon}>💬</Text>
          <Text style={styles.messageText}>
            זכור: התנהגות טובה וביצוע משימות עוזרים לך להישאר חופשי!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.replace('ChildHome')}
        >
          <Text style={styles.continueButtonText}>המשך 🚀</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.9,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  achievementEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  achievementText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 10,
    textAlign: 'center',
  },
  achievementSubtext: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },
  messageCard: {
    backgroundColor: '#FFFFFF30',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  messageIcon: {
    fontSize: 30,
    marginLeft: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    paddingHorizontal: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#27AE60',
  },
});
