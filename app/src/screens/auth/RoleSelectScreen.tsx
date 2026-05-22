import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { Role } from '../../api/types';
import { useApp } from '../../state/AppContext';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'RoleSelect'> };

const ROLES = [
  { key: 'ClientApp' as const, role: 'client' as Role, label: 'Клиент', sub: 'Расписание, абонемент, прогресс', abbr: 'КЛ' },
  { key: 'TrainerApp' as const, role: 'trainer' as Role, label: 'Тренер', sub: 'Мое расписание и клиенты', abbr: 'ТР' },
  { key: 'AdminApp' as const, role: 'admin' as Role, label: 'Администратор', sub: 'Управление клубом', abbr: 'АД' },
];

export default function RoleSelectScreen({ navigation }: Props) {
  const { setRole } = useApp();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>ВОЛНА</Text>
        <Text style={styles.title}>Выберите режим</Text>
        <Text style={styles.sub}>
          Демо-версия. В рабочем приложении роль будет приходить из 1С после авторизации.
        </Text>

        <View style={styles.cards}>
          {ROLES.map(role => (
            <TouchableOpacity
              key={role.key}
              style={styles.card}
              onPress={() => {
                setRole(role.role);
                navigation.navigate(role.key);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>{role.abbr}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardLabel}>{role.label}</Text>
                <Text style={styles.cardSub}>{role.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.ink3} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  logo: { fontSize: 14, fontWeight: '800', color: colors.dark, letterSpacing: 3, marginBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', color: colors.dark },
  sub: { fontSize: 14, color: colors.ink3, marginTop: 8, marginBottom: 32, lineHeight: 20 },
  cards: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
  },
  cardAvatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  cardAvatarText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: colors.dark },
  cardSub: { fontSize: 12, color: colors.ink3, marginTop: 3 },
});
