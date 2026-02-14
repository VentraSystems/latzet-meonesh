import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import LinkChildScreen from '../screens/parent/LinkChildScreen';
import SetPunishmentScreen from '../screens/parent/SetPunishmentScreen';
import TaskApprovalScreen from '../screens/parent/TaskApprovalScreen';

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
    </Stack.Navigator>
  );
}
