import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { colors, radius, spacing } from '../../theme';
import { useApp } from '../../state/AppContext';
import { TrainerStackParamList } from '../../navigation/types';

type Props = StackScreenProps<TrainerStackParamList, 'TrainerClientDetail'>;

export default function TrainerClientDetailScreen({ route, navigation }: Props) {
  const { data, checkIn, setTrainerChatId } = useApp();
  const client = data?.trainerClients.find(item => item.id === route.params.clientId);
  const plan = data?.workoutPlans.find(item => item.clientId === route.params.clientId);
  const chat = data?.chats.find(item => item.clientId === route.params.clientId);
  const visits = useMemo(
    () => (data?.visits ?? []).filter(item => item.clientId === route.params.clientId).slice(0, 6),
    [data?.visits, route.params.clientId],
  );
  const [saving, setSaving] = useState(false);

  if (!client) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Клиент не найден</Text>
          <Button title="Назад" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleCheckIn = async () => {
    setSaving(true);
    try {
      await checkIn(client.id, 'Персональная');
      Alert.alert('Визит отмечен', `${client.name} добавлен в журнал посещений.`);
    } catch (error) {
      Alert.alert('Чек-ин', error instanceof Error ? error.message : 'Не удалось отметить клиента.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChat = () => {
    if (!chat) {
      Alert.alert('Чат', 'Для этого клиента чат пока не создан.');
      return;
    }
    setTrainerChatId(chat.id);
    navigation.navigate('TrainerTabs', { screen: 'Chat' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} activeOpacity={0.7}>
          <Text style={styles.backText}>← Клиенты</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Avatar initials={client.initials} size="lg" variant="dark" />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{client.name}</Text>
            <Text style={styles.meta}>{client.age} лет · {client.weight} кг · цель: {client.goal}</Text>
            <Text style={styles.metaSecondary}>{client.nextSession}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Пакет</Text>
          <View style={styles.progressRow}>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.min(100, Math.round((client.packageDone / Math.max(client.packageTotal, 1)) * 100))}%` }]} />
            </View>
            <Text style={styles.progressText}>{client.packageDone}/{client.packageTotal}</Text>
          </View>
        </View>

        {plan && (
          <TouchableOpacity style={styles.planCard} activeOpacity={0.8} onPress={() => navigation.navigate('TrainerPlanDetail', { planId: plan.id })}>
            <Text style={styles.sectionTitle}>План</Text>
            <Text style={styles.planClient}>{plan.goal}</Text>
            <Text style={styles.planMeta}>{plan.done}/{plan.sessions} тренировок · {plan.exercises.length} упражнений</Text>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Последние посещения</Text>
          {visits.length === 0 ? (
            <Text style={styles.emptyText}>Посещений пока нет</Text>
          ) : (
            visits.map(item => (
              <View key={item.id} style={styles.visitRow}>
                <Text style={styles.visitTime}>{item.time}</Text>
                <Text style={styles.visitZone}>{item.zone}</Text>
                <Text style={styles.visitStatus}>{item.status}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.actionRow}>
          <Button title={saving ? 'Отмечаем...' : 'Отметить визит'} onPress={handleCheckIn} disabled={saving} />
          <Button title="Написать" variant="outline" onPress={handleOpenChat} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  back: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  backText: { fontSize: 14, color: colors.ink3, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, paddingTop: spacing.sm },
  name: { fontSize: 22, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  meta: { fontSize: 13, color: colors.ink3, marginTop: 4, lineHeight: 18 },
  metaSecondary: { fontSize: 12, color: colors.ink2, marginTop: 2, fontWeight: '600' },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700', marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { flex: 1, height: 5, backgroundColor: colors.surface3, borderRadius: 3 },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.ink3, fontWeight: '700', minWidth: 34, textAlign: 'right' },
  planCard: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  planClient: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  planMeta: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  visitTime: { width: 46, fontSize: 12, color: colors.ink2, fontWeight: '700' },
  visitZone: { flex: 1, fontSize: 13, color: colors.dark },
  visitStatus: { fontSize: 11, color: colors.ok, fontWeight: '700' },
  actionRow: { gap: 10 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.dark, marginBottom: spacing.md },
  emptyText: { fontSize: 13, color: colors.ink3 },
});
