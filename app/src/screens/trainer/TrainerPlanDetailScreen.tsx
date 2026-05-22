import React from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { colors, radius, spacing } from '../../theme';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';
import { TrainerStackParamList } from '../../navigation/types';

type Props = StackScreenProps<TrainerStackParamList, 'TrainerPlanDetail'>;

export default function TrainerPlanDetailScreen({ route, navigation }: Props) {
  const { data, saveWorkoutPlan } = useApp();
  const plan = data?.workoutPlans.find(item => item.id === route.params.planId);
  const client = data?.trainerClients.find(item => item.id === plan?.clientId);

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>План не найден</Text>
          <Button title="Назад" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const pct = plan.sessions > 0 ? Math.round((plan.done / plan.sessions) * 100) : 0;
  const addExercise = async () => {
    await saveWorkoutPlan({
      ...plan,
      exercises: [
        ...plan.exercises,
        {
          id: `ex-${Date.now()}`,
          planId: plan.id,
          name: 'Новое упражнение',
          sets: '3 x 12',
          weight: 'собственный вес',
        },
      ],
    });
  };

  const sharePlan = async () => {
    const exercises = plan.exercises.map((ex, index) => `${index + 1}. ${ex.name}: ${ex.sets}, ${ex.weight}`).join('\n');
    await Share.share({
      title: `План тренировок: ${plan.client}`,
      message: `${plan.client}\nЦель: ${plan.goal}\nПрогресс: ${plan.done}/${plan.sessions}\n\n${exercises}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} activeOpacity={0.7}>
          <Text style={styles.backText}>← Планы</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>План клиента</Text>
          <Text style={styles.heroName}>{plan.client}</Text>
          <Text style={styles.heroGoal}>{plan.goal}</Text>
          <View style={styles.progressRow}>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressText}>{plan.done}/{plan.sessions}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.clientCard} activeOpacity={0.8} onPress={() => client && navigation.navigate('TrainerClientDetail', { clientId: client.id })}>
          <Text style={styles.sectionTitle}>Клиент</Text>
          <Text style={styles.clientName}>{client?.name ?? plan.client}</Text>
          <Text style={styles.clientMeta}>{client ? `${client.age} лет · ${client.weight} кг · ${client.nextSession}` : 'Карточка клиента недоступна'}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Упражнения</Text>
          {plan.exercises.map((ex, index) => (
            <View key={ex.id} style={styles.exerciseRow}>
              <View style={styles.exerciseIndex}>
                <Text style={styles.exerciseIndexText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseMeta}>{ex.sets} · {ex.weight}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <Button title="Назначить упражнение" onPress={addExercise} />
          <Button title="Поделиться планом" variant="outline" onPress={sharePlan} />
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
  hero: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  heroLabel: { fontSize: 10, color: colors.accent, letterSpacing: 0.8, fontWeight: '700', marginBottom: 6 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0 },
  heroGoal: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: spacing.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  progressText: { minWidth: 34, color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'right' },
  clientCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700', marginBottom: 10 },
  clientName: { fontSize: 18, fontWeight: '800', color: colors.dark },
  clientMeta: { fontSize: 13, color: colors.ink3, marginTop: 4, lineHeight: 18 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  exerciseIndex: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  exerciseIndexText: { fontSize: 11, color: colors.ink3, fontWeight: '700' },
  exerciseName: { fontSize: 14, fontWeight: '600', color: colors.dark },
  exerciseMeta: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  actionRow: { gap: 10 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.dark, marginBottom: spacing.md },
});
