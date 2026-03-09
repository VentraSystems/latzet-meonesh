import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ParentHomeScreen from '../screens/Parent/ParentHomeScreen';
import LinkChildScreen from '../screens/Parent/LinkChildScreen';
import SetPunishmentScreen from '../screens/Parent/SetPunishmentScreen';
import TaskApprovalScreen from '../screens/Parent/TaskApprovalScreen';
import SettingsScreen from '../screens/Parent/SettingsScreen';
import ParentAnalyticsScreen from '../screens/Parent/ParentAnalyticsScreen';
import { useLanguage } from '../contexts/LanguageContext';

const Stack = createNativeStackNavigator();

export default function ParentNavigator() {
  const { t } = useLanguage();
  return (
    <Stack.Navigator>
      <Stack.Screen name="ParentHome" component={ParentHomeScreen} options={{ title: t.appName, headerTitleAlign: 'center' }} />
      <Stack.Screen name="LinkChild" component={LinkChildScreen} options={{ title: t.linkChild.title, headerTitleAlign: 'center' }} />
      <Stack.Screen name="SetPunishment" component={SetPunishmentScreen} options={{ title: t.setPunishment.title, headerTitleAlign: 'center' }} />
      <Stack.Screen name="TaskApproval" component={TaskApprovalScreen} options={{ title: t.taskApproval.title, headerTitleAlign: 'center' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t.parentHome.settings, headerTitleAlign: 'center' }} />
      <Stack.Screen name="Analytics" component={ParentAnalyticsScreen} options={{ title: t.parentHome.reports, headerTitleAlign: 'center' }} />
    </Stack.Navigator>
  );
}
