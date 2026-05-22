import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TrainerTabs from './TrainerTabs';
import { TrainerStackParamList } from './types';

import TrainerClientDetailScreen from '../screens/trainer/TrainerClientDetailScreen';
import TrainerPlanDetailScreen from '../screens/trainer/TrainerPlanDetailScreen';
import TrainerSettingsScreen from '../screens/trainer/TrainerSettingsScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import HelpScreen from '../screens/common/HelpScreen';

const Stack = createStackNavigator<TrainerStackParamList>();

export default function TrainerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerTabs" component={TrainerTabs} />
      <Stack.Screen name="TrainerClientDetail" component={TrainerClientDetailScreen} />
      <Stack.Screen name="TrainerPlanDetail" component={TrainerPlanDetailScreen} />
      <Stack.Screen
        name="TrainerSettings"
        component={TrainerSettingsScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
