import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ParentNavigator from './ParentNavigator';
import ChildNavigator from './ChildNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ChildOnboardingScreen from '../screens/auth/ChildOnboardingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ChildOnboarding" component={ChildOnboardingScreen} />
          </>
        ) : userRole === 'parent' ? (
          <Stack.Screen name="ParentFlow" component={ParentNavigator} />
        ) : (
          <Stack.Screen name="ChildFlow" component={ChildNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
