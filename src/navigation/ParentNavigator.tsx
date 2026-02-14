import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ParentHomeScreen from '../screens/Parent/ParentHomeScreen';
import LinkChildScreen from '../screens/Parent/LinkChildScreen';
import SetPunishmentScreen from '../screens/Parent/SetPunishmentScreen';
import TaskApprovalScreen from '../screens/Parent/TaskApprovalScreen';
import SettingsScreen from '../screens/Parent/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function ParentNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ParentHome"
        component={ParentHomeScreen}
        options={{
          title: 'לצאת מעונש - הורה',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen
        name="LinkChild"
        component={LinkChildScreen}
        options={{
          title: 'חיבור ילד',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen
        name="SetPunishment"
        component={SetPunishmentScreen}
        options={{
          title: 'הגדר עונש',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen
        name="TaskApproval"
        component={TaskApprovalScreen}
        options={{
          title: 'אישור משימות',
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'הגדרות',
          headerTitleAlign: 'center'
        }}
      />
    </Stack.Navigator>
  );
}
