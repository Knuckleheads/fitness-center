import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, spacing, radius } from '../../theme';
import { Avatar } from '../../components/common/Avatar';
import { ScreenState } from '../../components/common/ScreenState';
import { ClientTabParamList } from '../../navigation/types';
import { useApp } from '../../state/AppContext';

type Props = {
  navigation: BottomTabNavigationProp<ClientTabParamList, 'Home'>;
};

const QUICK = [
  { label: 'Расписание', abbr: 'РС', target: 'Schedule' as const },
  { label: 'QR-пропуск', abbr: 'QR', target: 'QRPass' as const },
  { label: 'Прогресс', abbr: 'ПР', target: 'Progress' as const },
  { label: 'Профиль', abbr: 'Я', target: 'Profile' as const },
];

function shortName(fullName?: string) {
  return fullName?.split(' ')[0] || 'клиент';
}

function formatClassDate(date: string) {
  const [, month, day] = date.split('-');
  return `${day}.${month}`;
}

export default function HomeScreen({ navigation }: Props) {
  const { data, loading, error, reload } = useApp();
  const user = data?.user;
  const membership = data?.membership;
  const classes = data?.classes ?? [];
  const visits = data?.visits ?? [];

  if (loading && !data) {
    return <ScreenState loading title="Загрузка" message="Подтягиваем расписание, абонемент и статистику." />;
  }

  if (error && !data) {
    return <ScreenState title="Главная недоступна" message={error} onRetry={reload} retryLabel="Повторить" />;
  }

  const bookedClasses = classes
    .filter(item => item.booked)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const nextClass = bookedClasses[0];
  const upcomingClasses = classes
    .filter(item => !item.booked && item.spots > 0)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 2);
  const userVisits = visits.filter(item => item.clientId === user?.id);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoLine}>ВОЛНА</Text>
            <Text style={styles.greeting}>Привет, {shortName(user?.name)}</Text>
          </View>
          <Avatar initials={user?.initials ?? 'КЛ'} size="md" variant="dark" />
        </View>

        <View style={styles.heroCard}>
          {nextClass ? (
            <>
              <Text style={styles.heroMeta}>СЛЕДУЮЩАЯ · {formatClassDate(nextClass.date)} {nextClass.time}</Text>
              <Text style={styles.heroTitle}>{nextClass.name}</Text>
              <Text style={styles.heroSub}>{nextClass.room} · {nextClass.trainer} · {nextClass.duration}</Text>
              <View style={styles.heroBottom}>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{nextClass.total - nextClass.spots} из {nextClass.total} мест</Text>
                </View>
                <TouchableOpacity
                  style={styles.heroBtn}
                  onPress={() => navigation.navigate('QRPass')}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={styles.heroBtnText}>Показать QR →</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.heroMeta}>РАСПИСАНИЕ</Text>
              <Text style={styles.heroTitle}>Нет активных записей</Text>
              <Text style={styles.heroSub}>Выберите ближайшую тренировку в расписании клуба</Text>
              <View style={styles.heroBottom}>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{classes.length} занятий доступно</Text>
                </View>
                <TouchableOpacity
                  style={styles.heroBtn}
                  onPress={() => navigation.navigate('Schedule')}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={styles.heroBtnText}>Записаться →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>АБОНЕМЕНТ</Text>
            <Text style={styles.statVal}>{membership?.title ?? 'Не выбран'}</Text>
            <Text style={styles.statSub}>{membership?.daysLeft ?? 0} дня осталось</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${membership?.progressPct ?? 0}%` }]} />
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ПОСЕЩЕНИЙ</Text>
            <Text style={[styles.statVal, { fontSize: 30 }]}>{userVisits.length}</Text>
            <Text style={styles.statSub}>по данным базы</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>БЫСТРЫЙ ДОСТУП</Text>
        <View style={styles.quickRow}>
          {QUICK.map(q => (
            <TouchableOpacity
              key={q.label}
              style={styles.quickItem}
              onPress={() => navigation.navigate(q.target)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={styles.quickIcon}>
                <Text style={styles.quickAbbr}>{q.abbr}</Text>
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>БЛИЖАЙШИЕ ЗАНЯТИЯ</Text>
        {upcomingClasses.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.newsCard}
            onPress={() => navigation.navigate('Schedule')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.newsDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.newsTitle}>{item.name}</Text>
              <Text style={styles.newsSub}>{formatClassDate(item.date)} · {item.time} · {item.room} · {item.spots} мест</Text>
            </View>
            <Text style={styles.newsArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  logoLine: { fontSize: 11, fontWeight: '800', color: colors.ink3, letterSpacing: 2.5 },
  greeting: { fontSize: 26, fontWeight: '800', color: colors.dark, marginTop: 2, letterSpacing: 0 },
  heroCard: {
    backgroundColor: colors.dark,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroMeta: { fontSize: 10, color: colors.accent, letterSpacing: 1, marginBottom: 8, fontWeight: '700' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4, letterSpacing: 0 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: spacing.lg },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroChipText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  heroBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  heroBtnText: { fontSize: 13, fontWeight: '700', color: colors.accentInk },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.paperCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statLabel: { fontSize: 9, color: colors.ink3, letterSpacing: 0.8, marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: '800', color: colors.dark },
  statSub: { fontSize: 11, color: colors.ink3, marginTop: 2 },
  bar: { height: 3, backgroundColor: colors.surface3, borderRadius: 2, marginTop: 8 },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.ink3, letterSpacing: 0.8, marginBottom: 10, marginTop: spacing.md },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  quickItem: {
    flex: 1,
    backgroundColor: colors.paperCard,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickAbbr: { fontSize: 11, fontWeight: '800', color: colors.ink2 },
  quickLabel: { fontSize: 11, color: colors.ink2, fontWeight: '500', textAlign: 'center' },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.paperCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  newsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  newsTitle: { fontSize: 14, fontWeight: '600', color: colors.dark },
  newsSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  newsArrow: { fontSize: 20, color: colors.ink3 },
});
