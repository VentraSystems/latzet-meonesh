import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChildHomeScreen from '../screens/Child/ChildHomeScreen';
import EnterLinkingCodeScreen from '../screens/Child/EnterLinkingCodeScreen';
import TasksListScreen from '../screens/Child/TasksListScreen';
import QuizScreen from '../screens/Child/QuizScreen';
import FreedomScreen from '../screens/Child/FreedomScreen';
import BadgesScreen from '../screens/Child/BadgesScreen';
import { useLanguage } from '../contexts/LanguageContext';

const Stack = createNativeStackNavigator();

export default function ChildNavigator() {
  const { t } = useLanguage();
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChildHome" component={ChildHomeScreen} options={{ title: t.appName, headerTitleAlign: 'center' }} />
      <Stack.Screen name="EnterLinkingCode" component={EnterLinkingCodeScreen} options={{ title: t.linkChild.title, headerTitleAlign: 'center' }} />
      <Stack.Screen name="TasksList" component={TasksListScreen} options={{ title: t.tasksList.yourTasks, headerTitleAlign: 'center' }} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: t.quiz.results, headerTitleAlign: 'center' }} />
      <Stack.Screen name="Freedom" component={FreedomScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Badges" component={BadgesScreen} options={{ title: t.badges.title, headerTitleAlign: 'center' }} />
    </Stack.Navigator>
  );
}
