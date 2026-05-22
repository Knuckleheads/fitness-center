import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type SlotStatus = 'done' | 'current' | 'next' | 'free';

type Slot = {
  time: string;
  client: string;
  type: string;
  status: SlotStatus;
};

export default function TrainerTodayScreen() {
  const { data, loading, error, reload, checkIn } = useApp();
  const classes = data?.classes ?? [];
  const clients = data?.trainerClients ?? [];
  const [checkingIn, setCheckingIn] = useState(false);

  const todayIso = useMemo(() => getTodayIso(), []);
  const todaysClasses = useMemo(
    () => classes.filter(item => item.date === todayIso).sort((a, b) => a.time.localeCompare(b.time)),
    [classes, todayIso],
  );
  const currentClass = useMemo(
    () => todaysClasses.find(item => item.booked) ?? todaysClasses[0],
    [todaysClasses],
  );
  const nowHHMM = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, []);

  const slots = useMemo<Slot[]>(() => {
    const times = ['08:00', '10:30', '16:00', '18:30'];
    const personalSlots: Slot[] = clients.slice(0, 4).map((client, index) => {
      const time = times[index] ?? '19:00';
      const isPast = time < nowHHMM;
      return {
        time,
        client: client.name,
        type: `Персоналка · ${client.packageDone}/${client.packageTotal}`,
        status: isPast ? 'done' : 'next',
      };
    });

    const classSlots: Slot[] = todaysClasses.map(item => {
      const isPast = item.time < nowHHMM;
      const isCurrent = item.id === currentClass?.id;
      return {
        time: item.time,
        client: item.name,
        type: `${item.type} · ${item.total - item.spots}/${item.total}`,
        status: isCurrent ? 'current' : isPast ? 'done' : 'next',
      };
    });

    const allSlots = [...personalSlots, ...classSlots];
    const seen = new Set<string>();
    return allSlots.filter(slot => {
      if (seen.has(slot.time)) return false;
      seen.add(slot.time);
      return true;
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [clients, todaysClasses, currentClass, nowHHMM]);

  const weekStats = useMemo(() => {
    return classes.reduce<Record<string, number>>((acc, item) => {
      acc[item.date] = (acc[item.date] ?? 0) + 1;
      return acc;
    }, {});
  }, [classes]);
  const weekEntries = Object.entries(weekStats).sort(([a], [b]) => a.localeCompare(b));
  const totalToday = todaysClasses.length + Math.min(clients.length, 4);

  const markArrival = async () => {
    const client = clients[0];
    if (!client) {
      Alert.alert('Посещаемость', 'Нет клиентов, которых можно отметить.');
      return;
    }
    setCheckingIn(true);
    try {
      await checkIn(client.id, currentClass?.room ?? 'Тренажерный зал');
      Alert.alert('Посещаемость', `Визит ${client.name} сохранён в локальной базе.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить посещение';
      Alert.alert('Посещаемость', message);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Загружаем смену</Text>
          <Text style={styles.centerText}>Собираем расписание и клиентские слоты.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Не удалось открыть смену</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Button title="Повторить" onPress={reload} style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Смена</Text>
            <Text style={styles.sub}>{totalToday} тренировок по данным базы</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>В СМЕНЕ</Text>
          </View>
        </View>

        <View style={styles.weekCard}>
          <Text style={styles.weekLabel}>НЕДЕЛЯ · {classes.length} ЗАНЯТИЙ В РАСПИСАНИИ</Text>
          <View style={styles.weekBars}>
            {weekEntries.map(([date, count]) => (
              <View key={date} style={styles.weekBarWrap}>
                <View style={[styles.weekBar, {
                  height: Math.max(count * 10, 4),
                  backgroundColor: date === todayIso ? colors.accent : 'rgba(255,255,255,0.2)',
                }]} />
                <Text style={styles.weekBarLabel}>{date.slice(8)}</Text>
              </View>
            ))}
          </View>
        </View>

        {currentClass && (
          <View style={styles.currentCard}>
            <View style={styles.currentTop}>
              <Text style={styles.currentMeta}>СЕЙЧАС · {currentClass.time}</Text>
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.currentName}>{currentClass.name}</Text>
            <Text style={styles.currentSub}>
              {currentClass.room} · {currentClass.total - currentClass.spots} из {currentClass.total} клиентов
            </Text>
            <TouchableOpacity
              style={styles.checkinBtn}
              onPress={markArrival}
              activeOpacity={0.85}
              disabled={checkingIn}
            >
              <Text style={styles.checkinBtnText}>{checkingIn ? 'Сохраняем...' : 'Отметить пришедших'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!currentClass && todaysClasses.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>На сегодня занятий в расписании нет</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Расписание дня</Text>
        {slots.map(slot => (
          <View
            key={`${slot.time}-${slot.client}`}
            style={[
              styles.slotRow,
              slot.status === 'current' && styles.slotCurrent,
              slot.status === 'done' && styles.slotDone,
              slot.status === 'free' && styles.slotFree,
            ]}
          >
            <Text style={[styles.slotTime, slot.status === 'done' && styles.textFaded]}>{slot.time}</Text>
            <View style={styles.slotDivider} />
            <View style={styles.slotInfo}>
              <Text style={[styles.slotClient, slot.status === 'done' && styles.textFaded]}>{slot.client}</Text>
              <Text style={[styles.slotType, slot.status === 'done' && styles.textFaded]}>{slot.type}</Text>
            </View>
            <View style={[styles.slotStatus, slot.status === 'current' && styles.slotStatusActive]}>
              <Text style={[styles.slotIcon, slot.status === 'current' && { color: colors.accentInk }]}>
                {slot.status === 'done' ? '✓' : slot.status === 'current' ? '▶' : slot.status === 'free' ? '+' : '→'}
              </Text>
            </View>
          </View>
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
    alignItems: 'flex-start',
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  sub: { fontSize: 13, color: colors.ink3, marginTop: 3 },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  badgeText: { fontSize: 10, color: colors.accentInk, fontWeight: '800', letterSpacing: 0.8 },
  weekCard: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  weekLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, marginBottom: spacing.md },
  weekBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 56 },
  weekBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  weekBar: { width: '100%', borderRadius: 4 },
  weekBarLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 6, letterSpacing: 0.4 },
  currentCard: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  currentTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  currentMeta: { fontSize: 11, color: colors.accent, letterSpacing: 0.8, fontWeight: '700' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  currentName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4, letterSpacing: 0 },
  currentSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: spacing.md },
  checkinBtn: { backgroundColor: colors.accent, borderRadius: radius.lg, padding: 13, alignItems: 'center' },
  checkinBtnText: { fontSize: 14, fontWeight: '700', color: colors.accentInk },
  emptyCard: {
    backgroundColor: colors.paperCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyText: { fontSize: 14, color: colors.ink3 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink3,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    letterSpacing: 0.6,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
  },
  slotCurrent: { borderColor: colors.dark, borderWidth: 2 },
  slotDone: { opacity: 0.45 },
  slotFree: { borderStyle: 'dashed', borderColor: colors.line2 },
  slotTime: { fontSize: 13, fontWeight: '700', color: colors.dark, width: 44, letterSpacing: 0 },
  slotDivider: { width: 1, height: 32, backgroundColor: colors.line },
  slotInfo: { flex: 1 },
  slotClient: { fontSize: 14, fontWeight: '600', color: colors.dark },
  slotType: { fontSize: 11, color: colors.ink3, marginTop: 2 },
  slotStatus: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotStatusActive: { backgroundColor: colors.accent },
  slotIcon: { fontSize: 12, color: colors.ink3, fontWeight: '700' },
  textFaded: { color: colors.ink4 },
  centerState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  centerTitle: { fontSize: 17, fontWeight: '800', color: colors.dark, textAlign: 'center' },
  centerText: { fontSize: 13, color: colors.ink3, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
