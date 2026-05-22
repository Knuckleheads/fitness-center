import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OTP: { phone: string };
  RoleSelect: undefined;
  ClientApp: undefined;
  TrainerApp: undefined;
  AdminApp: undefined;
};

export type ClientStackParamList = {
  ClientTabs: undefined;
  ProgressMeasureForm: undefined;
  ProgressLiftForm: undefined;
  ClientSettings: undefined;
  Notifications: undefined;
  Help: undefined;
  Recommendations: undefined;
};

export type ClientTabParamList = {
  Home: undefined;
  Schedule: undefined;
  QRPass: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type TrainerStackParamList = {
  TrainerTabs: NavigatorScreenParams<TrainerTabParamList> | undefined;
  TrainerClientDetail: { clientId: string };
  TrainerPlanDetail: { planId: string };
  TrainerSettings: undefined;
  Notifications: undefined;
  Help: undefined;
};

export type TrainerTabParamList = {
  Today: undefined;
  Clients: undefined;
  Plans: undefined;
  Chat: undefined;
  Me: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  AdminClientDetail: { clientId: string };
  AdminStaffDetail: { kind: 'trainer' | 'hall'; id: string };
  AdminSettings: undefined;
  Notifications: undefined;
  Help: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Staff: undefined;
  Finance: undefined;
  Me: undefined;
};
