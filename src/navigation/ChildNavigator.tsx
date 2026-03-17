import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChildHomeScreen from '../screens/child/ChildHomeScreen';
import EnterLinkingCodeScreen from '../screens/child/EnterLinkingCodeScreen';
import TasksListScreen from '../screens/child/TasksListScreen';
import QuizScreen from '../screens/child/QuizScreen';
import FreedomScreen from '../screens/child/FreedomScreen';
import BadgesScreen from '../screens/child/BadgesScreen';
import MiniGameScreen from '../screens/child/MiniGameScreen';
import ChildWalletScreen from '../screens/child/ChildWalletScreen';
import { useLanguage } from '../contexts/LanguageContext';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#1a1a2e' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const, color: '#FFFFFF' },
  headerBackTitleVisible: false,
};

export default function ChildNavigator() {
  const { t } = useLanguage();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ChildHome" component={ChildHomeScreen} options={{ title: t.appName, headerTitleAlign: 'center' }} />
      <Stack.Screen name="EnterLinkingCode" component={EnterLinkingCodeScreen} options={{ title: t.linkChild.title, headerTitleAlign: 'center' }} />
      <Stack.Screen name="TasksList" component={TasksListScreen} options={{ title: t.tasksList.yourTasks, headerTitleAlign: 'center' }} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: t.quiz.results, headerTitleAlign: 'center' }} />
      <Stack.Screen name="Freedom" component={FreedomScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Badges" component={BadgesScreen} options={{ title: t.badges.title, headerTitleAlign: 'center' }} />
      <Stack.Screen name="MiniGame" component={MiniGameScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Wallet" component={ChildWalletScreen} options={{ title: '💰 My Wallet', headerTitleAlign: 'center' }} />
    </Stack.Navigator>
  );
}
