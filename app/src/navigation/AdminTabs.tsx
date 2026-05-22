import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { AdminTabParamList } from './types';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminClientsScreen from '../screens/admin/AdminClientsScreen';
import AdminStaffScreen from '../screens/admin/AdminStaffScreen';
import AdminFinanceScreen from '../screens/admin/AdminFinanceScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<keyof AdminTabParamList, { on: IconName; off: IconName }> = {
  Dashboard: { on: 'stats-chart', off: 'stats-chart-outline' },
  Clients: { on: 'people', off: 'people-outline' },
  Staff: { on: 'barbell', off: 'barbell-outline' },
  Finance: { on: 'cash', off: 'cash-outline' },
  Me: { on: 'person', off: 'person-outline' },
};

const LABELS: Record<keyof AdminTabParamList, string> = {
  Dashboard: 'Дашборд',
  Clients: 'Клиенты',
  Staff: 'Тренеры',
  Finance: 'Финансы',
  Me: 'Я',
};

function TabIcon({
  routeName,
  focused,
  label,
}: {
  routeName: keyof AdminTabParamList;
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

export default function AdminTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon
            routeName={route.name as keyof AdminTabParamList}
            focused={focused}
            label={LABELS[route.name as keyof AdminTabParamList]}
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
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Clients" component={AdminClientsScreen} />
      <Tab.Screen name="Staff" component={AdminStaffScreen} />
      <Tab.Screen name="Finance" component={AdminFinanceScreen} />
      <Tab.Screen name="Me" component={AdminProfileScreen} />
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
