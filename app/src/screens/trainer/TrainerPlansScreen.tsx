import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';
import { WorkoutExercise, WorkoutPlan } from '../../api/types';

type PlanDraft = {
  id: string;
  clientId: string;
  client: string;
  goal: string;
  sessions: string;
  done: string;
  exercises: WorkoutExercise[];
};

type ExerciseDraft = {
  id: string;
  name: string;
  sets: string;
  weight: string;
};

function makePlanId() {
  return `plan-${Date.now()}`;
}

function makeExerciseId() {
  return `ex-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function toDraft(plan: WorkoutPlan): PlanDraft {
  return {
    id: plan.id,
    clientId: plan.clientId,
    client: plan.client,
    goal: plan.goal,
    sessions: String(plan.sessions),
    done: String(plan.done),
    exercises: plan.exercises.map(ex => ({ ...ex })),
  };
}

function blankDraft(): PlanDraft {
  return {
    id: makePlanId(),
    clientId: '',
    client: '',
    goal: '',
    sessions: '8',
    done: '0',
    exercises: [],
  };
}

export default function TrainerPlansScreen() {
  const { data, loading, error, reload, saveWorkoutPlan, deleteWorkoutPlan } = useApp();
  const plans = data?.workoutPlans ?? [];
  const clients = data?.trainerClients ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [exerciseDraft, setExerciseDraft] = useState<ExerciseDraft | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open && plans[0]?.id) {
      setOpen(plans[0].id);
    }
  }, [open, plans]);

  const progressById = useMemo(() => {
    return plans.reduce<Record<string, number>>((acc, plan) => {
      acc[plan.id] = plan.sessions > 0 ? Math.min(100, Math.max(0, Math.round((plan.done / plan.sessions) * 100))) : 0;
      return acc;
    }, {});
  }, [plans]);

  const openNewPlan = () => {
    setDraft(blankDraft());
    setExerciseDraft(null);
    setEditingExerciseId(null);
    setEditorVisible(true);
  };

  const openEditPlan = (plan: WorkoutPlan) => {
    setDraft(toDraft(plan));
    setExerciseDraft(null);
    setEditingExerciseId(null);
    setEditorVisible(true);
  };

  const updateDraft = (patch: Partial<PlanDraft>) => {
    setDraft(current => current ? { ...current, ...patch } : current);
  };

  const applyExercise = () => {
    if (!draft || !exerciseDraft) return;
    if (!exerciseDraft.name.trim()) {
      Alert.alert('Упражнение', 'Введите название упражнения.');
      return;
    }
    const nextExercise: WorkoutExercise = {
      id: editingExerciseId ?? makeExerciseId(),
      planId: draft.id,
      name: exerciseDraft.name.trim(),
      sets: exerciseDraft.sets.trim(),
      weight: exerciseDraft.weight.trim(),
    };
    updateDraft({
      exercises: editingExerciseId
        ? draft.exercises.map(item => item.id === editingExerciseId ? nextExercise : item)
        : [...draft.exercises, nextExercise],
    });
    setExerciseDraft(null);
    setEditingExerciseId(null);
  };

  const editExercise = (exercise: WorkoutExercise) => {
    setEditingExerciseId(exercise.id);
    setExerciseDraft({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets,
      weight: exercise.weight,
    });
  };

  const removeExercise = (exerciseId: string) => {
    if (!draft) return;
    updateDraft({ exercises: draft.exercises.filter(item => item.id !== exerciseId) });
    if (editingExerciseId === exerciseId) {
      setEditingExerciseId(null);
      setExerciseDraft(null);
    }
  };

  const savePlan = async () => {
    if (!draft) return;
    const client = draft.client.trim();
    const goal = draft.goal.trim();
    const sessions = Number(draft.sessions);
    const done = Number(draft.done);

    if (!client || !goal) {
      Alert.alert('План', 'Заполните клиента и цель.');
      return;
    }
    if (!Number.isFinite(sessions) || sessions <= 0) {
      Alert.alert('План', 'Укажите корректное число тренировок.');
      return;
    }
    if (!Number.isFinite(done) || done < 0) {
      Alert.alert('План', 'Показатель выполненных тренировок должен быть не меньше нуля.');
      return;
    }

    setSaving(true);
    try {
      await saveWorkoutPlan({
        id: draft.id,
        clientId: draft.clientId || `client-${draft.id}`,
        client,
        goal,
        sessions,
        done,
        exercises: draft.exercises.map(exercise => ({
          ...exercise,
          planId: draft.id,
        })),
      });
      setEditorVisible(false);
      setDraft(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить план';
      Alert.alert('План', message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!draft) return;
    Alert.alert('Удалить план?', 'Все упражнения этого плана тоже будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await deleteWorkoutPlan(draft.id);
            setEditorVisible(false);
            setDraft(null);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Не удалось удалить план';
            Alert.alert('План', message);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Загружаем планы</Text>
          <Text style={styles.centerText}>Синхронизируем workout plans из локальной базы.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Не удалось открыть планы</Text>
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
            <Text style={styles.title}>Планы тренировок</Text>
            <Text style={styles.sub}>{plans.length} активных плана</Text>
          </View>
          <TouchableOpacity style={styles.addPlanIcon} onPress={openNewPlan} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={colors.accentInk} />
          </TouchableOpacity>
        </View>

        {plans.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Планы пока не созданы</Text>
            <Text style={styles.emptyText}>Нажмите на плюс, чтобы добавить первый план.</Text>
          </View>
        )}

        {plans.map(plan => {
          const progressPct = progressById[plan.id] ?? 0;

          return (
            <View key={plan.id} style={styles.planCard}>
              <TouchableOpacity
                style={styles.planHeader}
                onPress={() => setOpen(open === plan.id ? null : plan.id)}
                activeOpacity={0.7}
              >
                <View style={styles.planContent}>
                  <View style={styles.planTopRow}>
                    <Text style={styles.planClient}>{plan.client}</Text>
                    <View style={styles.planActions}>
                      <TouchableOpacity
                        onPress={() => openEditPlan(plan)}
                        style={styles.iconBtn}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.ink3} />
                      </TouchableOpacity>
                      <Ionicons name={open === plan.id ? 'chevron-up' : 'chevron-down'} size={18} color={colors.ink3} />
                    </View>
                  </View>
                  <Text style={styles.planGoal}>{plan.goal}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.bar}>
                      <View style={[styles.barFill, { width: `${progressPct}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{plan.done}/{plan.sessions}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {open === plan.id && (
                <View style={styles.exercises}>
                  {plan.exercises.map((ex, index) => (
                    <View key={ex.id} style={styles.exRow}>
                      <View style={styles.exNum}>
                        <Text style={styles.exNumText}>{index + 1}</Text>
                      </View>
                      <View style={styles.exInfo}>
                        <Text style={styles.exName}>{ex.name}</Text>
                        <Text style={styles.exDetail}>{ex.sets} · {ex.weight}</Text>
                      </View>
                      <View style={styles.exActions}>
                        <TouchableOpacity onPress={() => editExercise(ex)} style={styles.smallBtn} activeOpacity={0.75}>
                          <Ionicons name="pencil" size={16} color={colors.ink3} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeExercise(ex.id)} style={styles.smallBtn} activeOpacity={0.75}>
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addExBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!draft || draft.id !== plan.id) {
                        setDraft(toDraft(plan));
                      }
                      setEditingExerciseId(null);
                      setExerciseDraft({ id: makeExerciseId(), name: '', sets: '', weight: '' });
                      setEditorVisible(true);
                    }}
                  >
                    <Text style={styles.addExText}>+ Добавить упражнение</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.newPlanBtn}
          activeOpacity={0.8}
          onPress={openNewPlan}
        >
          <Text style={styles.newPlanText}>+ Создать новый план</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditorVisible(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{draft && plans.some(p => p.id === draft.id) ? 'Редактирование плана' : 'Новый план'}</Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)} style={styles.closeBtn} activeOpacity={0.75}>
                <Ionicons name="close" size={22} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Клиент</Text>
            <TextInput
              style={styles.input}
              value={draft?.client ?? ''}
              onChangeText={text => updateDraft({ client: text })}
              placeholder="Имя клиента"
              placeholderTextColor={colors.ink4}
            />
            <View style={styles.clientChips}>
              {clients.map(client => (
                <TouchableOpacity
                  key={client.id}
                  style={[styles.clientChip, draft?.clientId === client.id && styles.clientChipActive]}
                  onPress={() => updateDraft({ clientId: client.id, client: client.name })}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.clientChipText, draft?.clientId === client.id && styles.clientChipTextActive]}>
                    {client.initials}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Цель</Text>
            <TextInput
              style={styles.input}
              value={draft?.goal ?? ''}
              onChangeText={text => updateDraft({ goal: text })}
              placeholder="Снижение веса, сила, тонус..."
              placeholderTextColor={colors.ink4}
            />

            <View style={styles.row2}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>План</Text>
                <TextInput
                  style={styles.input}
                  value={draft?.sessions ?? ''}
                  onChangeText={text => updateDraft({ sessions: text })}
                  placeholder="8"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.ink4}
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Выполнено</Text>
                <TextInput
                  style={styles.input}
                  value={draft?.done ?? ''}
                  onChangeText={text => updateDraft({ done: text })}
                  placeholder="0"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.ink4}
                />
              </View>
            </View>

            <View style={styles.exerciseBox}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.fieldLabel}>Упражнения</Text>
                <TouchableOpacity
                  style={styles.inlineAction}
                  onPress={() => {
                    setEditingExerciseId(null);
                    setExerciseDraft({ id: makeExerciseId(), name: '', sets: '', weight: '' });
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.inlineActionText}>+ Новое</Text>
                </TouchableOpacity>
              </View>

              {(draft?.exercises ?? []).map(exercise => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseMeta}>{exercise.sets} · {exercise.weight}</Text>
                  </View>
                  <TouchableOpacity onPress={() => {
                    setEditingExerciseId(exercise.id);
                    setExerciseDraft({
                      id: exercise.id,
                      name: exercise.name,
                      sets: exercise.sets,
                      weight: exercise.weight,
                    });
                  }} style={styles.smallBtn} activeOpacity={0.75}>
                    <Ionicons name="create-outline" size={16} color={colors.ink3} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeExercise(exercise.id)} style={styles.smallBtn} activeOpacity={0.75}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              {exerciseDraft && (
                <View style={styles.exerciseEditor}>
                  <TextInput
                    style={styles.input}
                    value={exerciseDraft.name}
                    onChangeText={text => setExerciseDraft(prev => prev ? { ...prev, name: text } : prev)}
                    placeholder="Название упражнения"
                    placeholderTextColor={colors.ink4}
                  />
                  <View style={styles.row2}>
                    <View style={styles.half}>
                      <TextInput
                        style={styles.input}
                        value={exerciseDraft.sets}
                        onChangeText={text => setExerciseDraft(prev => prev ? { ...prev, sets: text } : prev)}
                        placeholder="4x12"
                        placeholderTextColor={colors.ink4}
                      />
                    </View>
                    <View style={styles.half}>
                      <TextInput
                        style={styles.input}
                        value={exerciseDraft.weight}
                        onChangeText={text => setExerciseDraft(prev => prev ? { ...prev, weight: text } : prev)}
                        placeholder="60 кг"
                        placeholderTextColor={colors.ink4}
                      />
                    </View>
                  </View>
                  <Button
                    title={editingExerciseId ? 'Сохранить упражнение' : 'Добавить упражнение'}
                    onPress={applyExercise}
                    variant="dark"
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <Button title="Сохранить план" onPress={savePlan} loading={saving} disabled={saving} />
              <Button title="Удалить" onPress={confirmDelete} variant="ghost" disabled={saving || !draft?.id} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: spacing.lg, marginBottom: spacing.lg, gap: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  sub: { fontSize: 13, color: colors.ink3, marginTop: 4 },
  addPlanIcon: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.dark },
  emptyText: { fontSize: 13, color: colors.ink3, marginTop: 6, lineHeight: 19 },
  planCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md, overflow: 'hidden' },
  planHeader: { padding: spacing.lg },
  planContent: { flex: 1 },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: spacing.md },
  planClient: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.dark },
  planActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  planGoal: { fontSize: 13, color: colors.ink3, marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { flex: 1, height: 5, backgroundColor: colors.surface3, borderRadius: 3 },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.ink3, fontWeight: '600', minWidth: 32 },
  exercises: { borderTopWidth: 1, borderTopColor: colors.line, padding: spacing.lg, backgroundColor: colors.surface2 },
  exRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  exNum: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  exNumText: { fontSize: 11, color: colors.ink3, fontWeight: '700' },
  exInfo: { flex: 1 },
  exName: { fontSize: 14, color: colors.dark, fontWeight: '600' },
  exDetail: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  exActions: { flexDirection: 'row', gap: 6 },
  smallBtn: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.paperCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  addExBtn: { marginTop: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.line2, borderStyle: 'dashed', padding: 12, alignItems: 'center' },
  addExText: { fontSize: 13, color: colors.ink3, fontWeight: '600' },
  newPlanBtn: { borderRadius: radius.xl, borderWidth: 2, borderColor: colors.dark, borderStyle: 'dashed', padding: spacing.lg, alignItems: 'center', backgroundColor: colors.paperCard },
  newPlanText: { fontSize: 15, color: colors.dark, fontWeight: '700' },
  centerState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  centerTitle: { fontSize: 17, fontWeight: '800', color: colors.dark, textAlign: 'center' },
  centerText: { fontSize: 13, color: colors.ink3, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  modalSafe: { flex: 1, backgroundColor: colors.paper },
  modalScroll: { paddingHorizontal: spacing.lg, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.lg, marginBottom: spacing.md },
  modalTitle: { fontSize: 24, fontWeight: '800', color: colors.dark },
  closeBtn: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.ink3, marginBottom: 6, marginTop: spacing.sm, letterSpacing: 0.4 },
  input: { backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark },
  clientChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  clientChip: { borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperCard, paddingHorizontal: 12, paddingVertical: 8 },
  clientChipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  clientChipText: { fontSize: 12, color: colors.ink3, fontWeight: '600' },
  clientChipTextActive: { color: '#fff' },
  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  exerciseBox: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.surface2, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inlineAction: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.paperCard, borderWidth: 1, borderColor: colors.line },
  inlineActionText: { fontSize: 12, color: colors.dark, fontWeight: '700' },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  exerciseName: { fontSize: 14, fontWeight: '700', color: colors.dark },
  exerciseMeta: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  exerciseEditor: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  modalActions: { gap: 10, marginTop: spacing.lg },
});
