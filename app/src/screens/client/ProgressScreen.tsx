import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { ScreenState } from '../../components/common/ScreenState';
import { colors, radius, spacing } from '../../theme';
import { useApp } from '../../state/AppContext';

const TABS = ['Вес', 'Замеры', 'Силовые'];
const MONTHS = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
const HEAT_COLORS = [colors.surface3, '#c4f87a', '#a8d952', colors.accent];

type MeasureFormState = {
  label: string;
  val: string;
  delta: string;
};

type LiftFormState = {
  name: string;
  val: string;
  delta: string;
  sessions: string;
};

const emptyMeasureForm: MeasureFormState = { label: '', val: '', delta: '' };
const emptyLiftForm: LiftFormState = { name: '', val: '', delta: '', sessions: '' };

export default function ProgressScreen() {
  const { data, loading, error, reload, addProgressMeasure, addProgressLift } = useApp();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState(0);
  const [measureModalOpen, setMeasureModalOpen] = useState(false);
  const [liftModalOpen, setLiftModalOpen] = useState(false);
  const [measureForm, setMeasureForm] = useState<MeasureFormState>(emptyMeasureForm);
  const [liftForm, setLiftForm] = useState<LiftFormState>(emptyLiftForm);
  const [savingMeasure, setSavingMeasure] = useState(false);
  const [savingLift, setSavingLift] = useState(false);

  const progress = data?.progress;
  const weightPoints = progress?.weightPoints ?? [];
  const currentWeight = weightPoints[weightPoints.length - 1] ?? 0;
  const firstWeight = weightPoints[0] ?? currentWeight;
  const weightDelta = useMemo(() => Number((currentWeight - firstWeight).toFixed(1)), [currentWeight, firstWeight]);
  const weightRange = useMemo(() => {
    if (weightPoints.length === 0) {
      return { min: 0, max: 1 };
    }

    return {
      min: Math.min(...weightPoints),
      max: Math.max(...weightPoints),
    };
  }, [weightPoints]);
  const heatCellSize = useMemo(() => {
    const screenPadding = spacing.lg * 2;
    const cardPadding = spacing.lg * 2;
    const rowGaps = 13 * 2;

    return Math.max(14, Math.floor((width - screenPadding - cardPadding - rowGaps) / 14));
  }, [width]);

  const addMeasureDisabled = savingMeasure || loading || !measureForm.label.trim() || !measureForm.val.trim() || !measureForm.delta.trim();
  const addLiftDisabled = savingLift || loading || !liftForm.name.trim() || !liftForm.val.trim() || !liftForm.delta.trim() || !liftForm.sessions.trim();

  if (loading && !data) {
    return <ScreenState loading title="Загрузка прогресса" message="Подтягиваем показатели из локальной базы." />;
  }

  if (error && !data) {
    return <ScreenState title="Прогресс недоступен" message={error} onRetry={reload} retryLabel="Повторить загрузку" />;
  }

  const openMeasureModal = () => setMeasureModalOpen(true);
  const openLiftModal = () => setLiftModalOpen(true);

  const closeMeasureModal = () => {
    setMeasureModalOpen(false);
    setMeasureForm(emptyMeasureForm);
  };

  const closeLiftModal = () => {
    setLiftModalOpen(false);
    setLiftForm(emptyLiftForm);
  };

  const submitMeasure = async () => {
    if (addMeasureDisabled) return;

    setSavingMeasure(true);
    try {
      await addProgressMeasure({
        label: measureForm.label.trim(),
        val: measureForm.val.trim(),
        delta: measureForm.delta.trim(),
      });
      closeMeasureModal();
      Alert.alert('Замер добавлен', 'Показатель сохранён в SQLite и появился в списке.');
    } catch (err) {
      Alert.alert('Не удалось добавить замер', err instanceof Error ? err.message : 'Проверьте поля формы и попробуйте снова.');
    } finally {
      setSavingMeasure(false);
    }
  };

  const submitLift = async () => {
    const sessions = Number(liftForm.sessions);
    if (addLiftDisabled || !Number.isFinite(sessions) || sessions <= 0) {
      Alert.alert('Не удалось добавить упражнение', 'Укажите корректное количество тренировок.');
      return;
    }

    setSavingLift(true);
    try {
      await addProgressLift({
        name: liftForm.name.trim(),
        val: liftForm.val.trim(),
        delta: liftForm.delta.trim(),
        sessions: Math.floor(sessions),
      });
      closeLiftModal();
      Alert.alert('Упражнение добавлено', 'Запись сохранена в SQLite и обновила таблицу силовых.');
    } catch (err) {
      Alert.alert('Не удалось добавить упражнение', err instanceof Error ? err.message : 'Проверьте поля формы и попробуйте снова.');
    } finally {
      setSavingLift(false);
    }
  };

  const renderChart = () => (
    <View style={styles.card}>
      <View style={styles.weightHeader}>
        <View>
          <Text style={styles.metaLabel}>ТЕКУЩИЙ ВЕС</Text>
          <Text style={styles.bigVal}>{String(currentWeight).replace('.', ',')} кг</Text>
        </View>
        <View style={styles.weightDeltaBox}>
          <Text style={[styles.delta, weightDelta > 0 && { color: colors.danger }]}>
            {weightDelta > 0 ? '+' : ''}{String(weightDelta).replace('.', ',')} кг
          </Text>
          <Text style={styles.deltaSub}>за период</Text>
        </View>
      </View>
      <View style={styles.chart}>
        {weightPoints.map((w, i) => {
          const range = weightRange.max - weightRange.min;
          const h = range === 0 ? 38 : ((w - weightRange.min) / range) * 56 + 10;
          const isLast = i === weightPoints.length - 1;
          return (
            <View
              key={`${w}-${i}`}
              style={[
                styles.chartBar,
                {
                  height: h,
                  backgroundColor: isLast ? colors.accent : colors.dark,
                  opacity: isLast ? 1 : 0.15 + (i / Math.max(weightPoints.length, 1)) * 0.55,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.chartLabels}>
        {MONTHS.map(m => <Text key={m} style={styles.chartLabel}>{m}</Text>)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Прогресс</Text>

        <View style={styles.seg}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[styles.segBtn, i === tab && styles.segActive]}
              onPress={() => setTab(i)}
              activeOpacity={0.75}
              disabled={loading}
            >
              <Text style={[styles.segText, i === tab && styles.segActiveText]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 0 && (
          <>
            {renderChart()}

            <Text style={styles.sectionTitle}>ИСТОРИЯ ПОСЕЩЕНИЙ</Text>
            <View style={styles.heatmapCard}>
              <View style={styles.heatmap}>
                {(progress?.heatmap ?? []).slice(0, 84).map((lvl, i) => (
                  <View
                    key={i}
                    style={[
                      styles.heatCell,
                      {
                        width: heatCellSize,
                        height: heatCellSize,
                        backgroundColor: HEAT_COLORS[lvl] ?? HEAT_COLORS[0],
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.heatLabel}>{(data?.visits ?? []).length} посещений в базе</Text>
            </View>

            <Text style={styles.sectionTitle}>ПОСЛЕДНИЕ ТРЕНИРОВКИ</Text>
            <View style={styles.histCard}>
              {(progress?.history ?? []).map((item, i, arr) => (
                <View key={`${item.date}-${item.time}-${item.name}`} style={[styles.histRow, i < arr.length - 1 && styles.histBorder]}>
                  <Text style={styles.histDate}>{item.date}</Text>
                  <Text style={styles.histTime}>{item.time}</Text>
                  <Text style={styles.histName}>{item.name}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {tab === 1 && (
          <>
            <View style={styles.measuresGrid}>
              {(progress?.measures ?? []).map(m => (
                <View key={`${m.label}-${m.val}-${m.delta}`} style={styles.measureCard}>
                  <Text style={styles.measureLabel}>{m.label}</Text>
                  <Text style={styles.measureVal}>{m.val}</Text>
                  <Text style={[styles.measureDelta, m.delta === '0' && { color: colors.ink3 }]}>{m.delta} см</Text>
                </View>
              ))}
            </View>
            <Button title="Добавить замер" variant="outline" onPress={openMeasureModal} disabled={loading || savingMeasure} />
          </>
        )}

        {tab === 2 && (
          <>
            {(progress?.lifts ?? []).map(l => (
              <View key={`${l.name}-${l.val}-${l.delta}`} style={styles.liftCard}>
                <View style={styles.liftInfo}>
                  <Text style={styles.liftName}>{l.name}</Text>
                  <Text style={styles.liftSessions}>{l.sessions} тренировок</Text>
                </View>
                <View style={styles.liftStats}>
                  <Text style={styles.liftVal}>{l.val}</Text>
                  <Text style={styles.liftDelta}>{l.delta}</Text>
                </View>
              </View>
            ))}
            <Button title="Добавить упражнение" variant="outline" onPress={openLiftModal} disabled={loading || savingLift} />
          </>
        )}
      </ScrollView>

      <Modal visible={measureModalOpen} transparent animationType="fade" onRequestClose={closeMeasureModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Новый замер</Text>
            <TextInput
              style={styles.input}
              value={measureForm.label}
              onChangeText={value => setMeasureForm(current => ({ ...current, label: value }))}
              placeholder="Например, талия"
              placeholderTextColor={colors.ink4}
            />
            <TextInput
              style={styles.input}
              value={measureForm.val}
              onChangeText={value => setMeasureForm(current => ({ ...current, val: value }))}
              placeholder="74 см"
              placeholderTextColor={colors.ink4}
            />
            <TextInput
              style={styles.input}
              value={measureForm.delta}
              onChangeText={value => setMeasureForm(current => ({ ...current, delta: value }))}
              placeholder="-2"
              placeholderTextColor={colors.ink4}
            />
            <View style={styles.modalActions}>
              <Button title="Отмена" variant="ghost" onPress={closeMeasureModal} />
              <Button title={savingMeasure ? 'Сохраняем...' : 'Сохранить'} onPress={submitMeasure} loading={savingMeasure} disabled={addMeasureDisabled} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={liftModalOpen} transparent animationType="fade" onRequestClose={closeLiftModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Новое упражнение</Text>
            <TextInput
              style={styles.input}
              value={liftForm.name}
              onChangeText={value => setLiftForm(current => ({ ...current, name: value }))}
              placeholder="Жим штанги лёжа"
              placeholderTextColor={colors.ink4}
            />
            <TextInput
              style={styles.input}
              value={liftForm.val}
              onChangeText={value => setLiftForm(current => ({ ...current, val: value }))}
              placeholder="45 кг"
              placeholderTextColor={colors.ink4}
            />
            <TextInput
              style={styles.input}
              value={liftForm.delta}
              onChangeText={value => setLiftForm(current => ({ ...current, delta: value }))}
              placeholder="+5 кг"
              placeholderTextColor={colors.ink4}
            />
            <TextInput
              style={styles.input}
              value={liftForm.sessions}
              onChangeText={value => setLiftForm(current => ({ ...current, sessions: value.replace(/\D/g, '') }))}
              placeholder="18"
              keyboardType="number-pad"
              placeholderTextColor={colors.ink4}
            />
            <View style={styles.modalActions}>
              <Button title="Отмена" variant="ghost" onPress={closeLiftModal} />
              <Button title={savingLift ? 'Сохраняем...' : 'Сохранить'} onPress={submitLift} loading={savingLift} disabled={addLiftDisabled} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.dark,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
    letterSpacing: 0,
  },
  seg: { flexDirection: 'row', backgroundColor: colors.surface3, borderRadius: radius.lg, padding: 3, marginBottom: spacing.lg },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.md, alignItems: 'center' },
  segActive: { backgroundColor: colors.paperCard },
  segText: { fontSize: 13, color: colors.ink3, fontWeight: '500' },
  segActiveText: { color: colors.dark, fontWeight: '700' },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  weightDeltaBox: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, marginBottom: 4 },
  bigVal: { fontSize: 32, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  delta: { fontSize: 20, fontWeight: '800', color: colors.ok },
  deltaSub: { fontSize: 11, color: colors.ink3, marginTop: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 72, marginBottom: spacing.sm },
  chartBar: { flex: 1, borderRadius: 3 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 9, color: colors.ink3, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.ink3, letterSpacing: 0.8, marginBottom: 10, marginTop: spacing.md },
  heatmapCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 10 },
  heatCell: { borderRadius: 2 },
  heatLabel: { fontSize: 11, color: colors.ink3, letterSpacing: 0.4 },
  histCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  histRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: spacing.md, alignItems: 'center' },
  histBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  histDate: { width: 54, fontSize: 11, color: colors.ink3 },
  histTime: { width: 44, fontSize: 11, color: colors.ink2, fontWeight: '600' },
  histName: { flex: 1, fontSize: 13, color: colors.dark },
  measuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.md },
  measureCard: { width: '47.5%', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  measureLabel: { fontSize: 11, color: colors.ink3, letterSpacing: 0.5 },
  measureVal: { fontSize: 22, fontWeight: '800', color: colors.dark, marginVertical: 4 },
  measureDelta: { fontSize: 13, color: colors.ok, fontWeight: '700' },
  liftCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.lg, marginBottom: 8, borderWidth: 1, borderColor: colors.line },
  liftInfo: { flex: 1 },
  liftStats: { alignItems: 'flex-end' },
  liftName: { fontSize: 15, fontWeight: '700', color: colors.dark },
  liftSessions: { fontSize: 12, color: colors.ink3, marginTop: 3 },
  liftVal: { fontSize: 20, fontWeight: '800', color: colors.dark },
  liftDelta: { fontSize: 13, color: colors.ok, fontWeight: '700', marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.paperCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 2,
  },
  input: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.dark,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
