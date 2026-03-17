import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import LinkChildScreen from '../screens/parent/LinkChildScreen';
import SetPunishmentScreen from '../screens/parent/SetPunishmentScreen';
import TaskApprovalScreen from '../screens/parent/TaskApprovalScreen';
import SettingsScreen from '../screens/parent/SettingsScreen';
import ParentAnalyticsScreen from '../screens/parent/ParentAnalyticsScreen';
import ParentWalletScreen from '../screens/parent/ParentWalletScreen';
import PunishmentHistoryScreen from '../screens/parent/PunishmentHistoryScreen';
import { useLanguage } from '../contexts/LanguageContext';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#1E2140' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const, color: '#FFFFFF' },
  headerBackTitleVisible: false,
};

export default function ParentNavigator() {
  const { t } = useLanguage();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ParentHome" component={ParentHomeScreen} options={{ title: t.appName, headerTitleAlign: 'center' }} />
      <Stack.Screen name="LinkChild" component={LinkChildScreen} options={{ title: t.linkChild.title, headerTitleAlign: 'center' }} />
      <Stack.Screen
        name="SetPunishment"
        component={SetPunishmentScreen}
        options={({ route }: any) => ({
          title: route.params?.punishmentId ? t.setPunishment.addTasksTitle : t.setPunishment.title,
          headerTitleAlign: 'center',
        })}
      />
      <Stack.Screen name="TaskApproval" component={TaskApprovalScreen} options={{ title: t.taskApproval.title, headerTitleAlign: 'center' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t.parentHome.settings, headerTitleAlign: 'center' }} />
      <Stack.Screen name="Analytics" component={ParentAnalyticsScreen} options={{ title: t.parentHome.reports, headerTitleAlign: 'center' }} />
      <Stack.Screen name="ParentWallet" component={ParentWalletScreen} options={{ title: '💰 Wallet & Rewards', headerTitleAlign: 'center' }} />
      <Stack.Screen name="PunishmentHistory" component={PunishmentHistoryScreen} options={{ title: '📋 Task History', headerTitleAlign: 'center' }} />
    </Stack.Navigator>
  );
}
