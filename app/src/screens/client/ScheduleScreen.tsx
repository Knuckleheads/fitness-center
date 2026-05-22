import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { Chip } from '../../components/common/Chip';
import { ScreenState } from '../../components/common/ScreenState';
import { useApp } from '../../state/AppContext';
import { SyncStatusBadge } from '../../components/common/SyncStatusBadge';

const dayNames = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

export default function ScheduleScreen() {
  const { data, loading, error, reload, bookClass, cancelClass, syncStatus, syncNow } = useApp();
  const [activeDay, setActiveDay] = useState(0);
  const [activeFilter, setActiveFilter] = useState('Все');
  const [busyClassId, setBusyClassId] = useState<string | null>(null);

  const classes = data?.classes ?? [];
  const days = Array.from(new Set(classes.map(item => item.date)))
    .sort()
    .map(date => {
      const value = new Date(`${date}T00:00:00`);
      return { day: dayNames[value.getDay()], num: value.getDate(), date };
    });
  const filters = ['Все', ...Array.from(new Set(classes.map(item => item.type)))];
  const activeDate = days[activeDay]?.date ?? days[0]?.date ?? '';
  const filtered = classes.filter(item => (
    item.date === activeDate && (activeFilter === 'Все' || item.type === activeFilter)
  ));

  if (loading && !data) {
    return <ScreenState loading title="Загрузка расписания" message="Подтягиваем занятия и ваши записи." />;
  }

  if (error && !data) {
    return <ScreenState title="Расписание недоступно" message={error} onRetry={reload} retryLabel="Повторить" />;
  }

  const handlePress = async (classId: string, booked: boolean) => {
    if (busyClassId) return;
    setBusyClassId(classId);

    try {
      if (booked) {
        await cancelClass(classId);
        Alert.alert('Запись отменена', 'Место вернулось в расписание.');
      } else {
        await bookClass(classId);
        Alert.alert('Вы записаны', 'Тренировка добавлена в ваш график.');
      }
    } catch (err) {
      Alert.alert(
        booked ? 'Не удалось отменить запись' : 'Не удалось записаться',
        err instanceof Error ? err.message : 'Попробуйте еще раз.',
      );
    } finally {
      setBusyClassId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Расписание</Text>
        <Text style={styles.sub}>Апрель 2026</Text>
      </View>

      <View style={styles.syncWrap}>
        <SyncStatusBadge status={syncStatus} onSyncNow={syncNow} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysContent}>
        {days.map((d, i) => (
          <TouchableOpacity
            key={d.date}
            style={[styles.dayBtn, i === activeDay && styles.dayBtnActive]}
            onPress={() => setActiveDay(i)}
            activeOpacity={0.75}
            disabled={loading || !!busyClassId}
          >
            <Text style={[styles.dayLabel, i === activeDay && styles.dayLabelActive]}>{d.day}</Text>
            <Text style={[styles.dayNum, i === activeDay && styles.dayNumActive]}>{d.num}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
        {filters.map(f => (
          <Chip key={f} label={f} active={activeFilter === f} onPress={() => !busyClassId && setActiveFilter(f)} />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map(cls => (
          <View key={cls.id} style={[styles.classCard, cls.booked && styles.classBooked]}>
            <View style={styles.timeCol}>
              <Text style={styles.time}>{cls.time}</Text>
              <Text style={styles.duration}>{cls.duration}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoCol}>
              <Text style={styles.className}>{cls.name}</Text>
              <Text style={styles.trainerText}>{cls.trainer} · {cls.room}</Text>
              <View style={styles.spotsRow}>
                <View style={styles.spotsBar}>
                  <View
                    style={[
                      styles.spotsBarFill,
                      {
                        width: `${((cls.total - cls.spots) / cls.total) * 100}%`,
                        backgroundColor: cls.spots === 0 ? colors.danger : cls.spots < 4 ? '#f4a623' : colors.ok,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.spotsText}>
                  {cls.spots === 0 ? 'нет мест' : `${cls.spots} мест`}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.bookBtn,
                cls.booked && styles.bookBtnBooked,
                cls.spots === 0 && !cls.booked && styles.bookBtnFull,
              ]}
              onPress={() => handlePress(cls.id, cls.booked)}
              disabled={(cls.spots === 0 && !cls.booked) || busyClassId === cls.id || loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.bookBtnText, cls.booked && styles.bookBtnTextBooked]}>
                {busyClassId === cls.id ? '...' : cls.booked ? '✓' : cls.spots === 0 ? '—' : '+'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        {filtered.length === 0 && (
          <Text style={styles.empty}>На выбранный день пока нет занятий этого типа.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.md },
  syncWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  sub: { fontSize: 13, color: colors.ink3, marginTop: 3 },
  daysContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 8 },
  dayBtn: {
    width: 50,
    paddingVertical: 10,
    borderRadius: radius.lg,
    alignItems: 'center',
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayBtnActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  dayLabel: { fontSize: 10, color: colors.ink3, fontWeight: '600', letterSpacing: 0.4 },
  dayLabelActive: { color: 'rgba(255,255,255,0.5)' },
  dayNum: { fontSize: 18, fontWeight: '800', color: colors.dark, marginTop: 2 },
  dayNumActive: { color: '#fff' },
  filtersContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 8 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  classBooked: { borderColor: colors.dark, borderWidth: 2 },
  timeCol: { width: 48, alignItems: 'flex-start' },
  time: { fontSize: 13, fontWeight: '800', color: colors.dark },
  duration: { fontSize: 10, color: colors.ink3, marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: colors.line },
  infoCol: { flex: 1 },
  className: { fontSize: 14, fontWeight: '700', color: colors.dark, marginBottom: 2 },
  trainerText: { fontSize: 11, color: colors.ink3, marginBottom: 6 },
  spotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spotsBar: { flex: 1, height: 3, backgroundColor: colors.surface3, borderRadius: 2 },
  spotsBarFill: { height: '100%', borderRadius: 2 },
  spotsText: { fontSize: 10, color: colors.ink3, minWidth: 44, textAlign: 'right' },
  bookBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnBooked: { backgroundColor: colors.accentSoft, borderWidth: 1.5, borderColor: colors.accent },
  bookBtnFull: { backgroundColor: colors.surface3 },
  bookBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bookBtnTextBooked: { color: colors.accentInk, fontSize: 14 },
  empty: { color: colors.ink3, textAlign: 'center', marginTop: spacing.xl },
});
