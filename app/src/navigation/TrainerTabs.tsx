import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { TrainerTabParamList } from './types';

import TrainerTodayScreen from '../screens/trainer/TrainerTodayScreen';
import TrainerClientsScreen from '../screens/trainer/TrainerClientsScreen';
import TrainerPlansScreen from '../screens/trainer/TrainerPlansScreen';
import TrainerChatScreen from '../screens/trainer/TrainerChatScreen';
import TrainerProfileScreen from '../screens/trainer/TrainerProfileScreen';

const Tab = createBottomTabNavigator<TrainerTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<keyof TrainerTabParamList, { on: IconName; off: IconName }> = {
  Today: { on: 'calendar', off: 'calendar-outline' },
  Clients: { on: 'people', off: 'people-outline' },
  Plans: { on: 'clipboard', off: 'clipboard-outline' },
  Chat: { on: 'chatbubble-ellipses', off: 'chatbubble-ellipses-outline' },
  Me: { on: 'person', off: 'person-outline' },
};

const LABELS: Record<keyof TrainerTabParamList, string> = {
  Today: 'Сегодня',
  Clients: 'Клиенты',
  Plans: 'Планы',
  Chat: 'Чат',
  Me: 'Я',
};

function TabIcon({
  routeName,
  focused,
  label,
}: {
  routeName: keyof TrainerTabParamList;
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

export default function TrainerTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon
            routeName={route.name as keyof TrainerTabParamList}
            focused={focused}
            label={LABELS[route.name as keyof TrainerTabParamList]}
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
      <Tab.Screen name="Today" component={TrainerTodayScreen} />
      <Tab.Screen name="Clients" component={TrainerClientsScreen} />
      <Tab.Screen name="Plans" component={TrainerPlansScreen} />
      <Tab.Screen name="Chat" component={TrainerChatScreen} />
      <Tab.Screen name="Me" component={TrainerProfileScreen} />
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
