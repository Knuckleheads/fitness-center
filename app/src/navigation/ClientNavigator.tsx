import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ClientTabs from './ClientTabs';
import { ClientStackParamList } from './types';

import ClientProgressMeasureScreen from '../screens/client/ClientProgressMeasureScreen';
import ClientProgressLiftScreen from '../screens/client/ClientProgressLiftScreen';
import ClientSettingsScreen from '../screens/client/ClientSettingsScreen';
import ClientRecommendationsScreen from '../screens/client/ClientRecommendationsScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import HelpScreen from '../screens/common/HelpScreen';

const Stack = createStackNavigator<ClientStackParamList>();

export default function ClientNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientTabs" component={ClientTabs} />
      <Stack.Screen
        name="ProgressMeasureForm"
        component={ClientProgressMeasureScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ProgressLiftForm"
        component={ClientProgressLiftScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ClientSettings"
        component={ClientSettingsScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Recommendations" component={ClientRecommendationsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
