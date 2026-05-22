import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminTabs from './AdminTabs';
import { AdminStackParamList } from './types';

import AdminClientDetailScreen from '../screens/admin/AdminClientDetailScreen';
import AdminStaffDetailScreen from '../screens/admin/AdminStaffDetailScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import HelpScreen from '../screens/common/HelpScreen';

const Stack = createStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminClientDetail" component={AdminClientDetailScreen} />
      <Stack.Screen name="AdminStaffDetail" component={AdminStaffDetailScreen} />
      <Stack.Screen
        name="AdminSettings"
        component={AdminSettingsScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
