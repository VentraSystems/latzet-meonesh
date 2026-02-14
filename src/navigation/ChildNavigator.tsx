import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChildHomeScreen from '../screens/child/ChildHomeScreen';
import EnterLinkingCodeScreen from '../screens/child/EnterLinkingCodeScreen';
import TasksListScreen from '../screens/child/TasksListScreen';
import QuizScreen from '../screens/child/QuizScreen';
import FreedomScreen from '../screens/child/FreedomScreen';

const Stack = createNativeStackNavigator();

export default function ChildNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChildHome"
        component={ChildHomeScreen}
        options={{
          title: 'לצאת מעונש - ילד',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen
        name="EnterLinkingCode"
        component={EnterLinkingCodeScreen}
        options={{
          title: 'חיבור להורה',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen
        name="TasksList"
        component={TasksListScreen}
        options={{
          title: 'המשימות שלי',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          title: 'חידון',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen
        name="Freedom"
        component={FreedomScreen}
        options={{
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
}
