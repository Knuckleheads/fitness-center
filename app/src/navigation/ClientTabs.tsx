import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { ClientTabParamList } from './types';

import HomeScreen from '../screens/client/HomeScreen';
import ScheduleScreen from '../screens/client/ScheduleScreen';
import QRPassScreen from '../screens/client/QRPassScreen';
import ProgressScreen from '../screens/client/ProgressScreen';
import ProfileScreen from '../screens/client/ProfileScreen';

const Tab = createBottomTabNavigator<ClientTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<keyof ClientTabParamList, { on: IconName; off: IconName }> = {
  Home: { on: 'home', off: 'home-outline' },
  Schedule: { on: 'calendar', off: 'calendar-outline' },
  QRPass: { on: 'qr-code', off: 'qr-code-outline' },
  Progress: { on: 'bar-chart', off: 'bar-chart-outline' },
  Profile: { on: 'person', off: 'person-outline' },
};

const LABELS: Record<keyof ClientTabParamList, string> = {
  Home: 'Главная',
  Schedule: 'Расписание',
  QRPass: 'Пропуск',
  Progress: 'Прогресс',
  Profile: 'Профиль',
};

function TabIcon({
  routeName,
  focused,
  label,
}: {
  routeName: keyof ClientTabParamList;
  focused: boolean;
  label: string;
}) {
  const icon = focused ? ICONS[routeName].on : ICONS[routeName].off;
  return (
    <View style={tabIconStyles.wrap}>
      {focused && <View style={tabIconStyles.dot} />}
      <Ionicons
        name={icon}
        size={22}
        color={focused ? colors.ink : colors.ink3}
      />
      <Text style={[tabIconStyles.label, focused && tabIconStyles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 6,
    minWidth: 52,
  },
  dot: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 10,
    marginTop: 3,
    color: colors.ink3,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.ink,
    fontWeight: '600',
  },
});

export default function ClientTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon
            routeName={route.name as keyof ClientTabParamList}
            focused={focused}
            label={LABELS[route.name as keyof ClientTabParamList]}
          />
        ),
        tabBarLabel: () => null,
        tabBarStyle: [
          styles.tabBar,
          { height: 60 + insets.bottom, paddingBottom: insets.bottom },
        ],
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="QRPass" component={QRPassScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.paperCard,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
});
