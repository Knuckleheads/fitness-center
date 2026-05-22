import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { colors, radius, spacing } from '../../theme';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';
import { ClientStackParamList } from '../../navigation/types';

type Props = StackScreenProps<ClientStackParamList, 'ProgressLiftForm'>;

export default function ClientProgressLiftScreen({ navigation }: Props) {
  const { data, addProgressLift } = useApp();
  const lifts = data?.progress.lifts ?? [];
  const [name, setName] = useState('Приседания');
  const [val, setVal] = useState('');
  const [delta, setDelta] = useState('');
  const [sessions, setSessions] = useState('1');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && val.trim().length > 0 && !saving;
  const suggestions = useMemo(() => lifts.slice(0, 3), [lifts]);

  const handleSave = async () => {
    const cleanName = name.trim();
    const cleanVal = val.trim();
    if (!cleanName || !cleanVal) {
      Alert.alert('Упражнение', 'Заполните название и результат.');
      return;
    }

    setSaving(true);
    try {
      await addProgressLift({
        name: cleanName,
        val: cleanVal,
        delta: delta.trim() || '0 кг',
        sessions: Math.max(1, Number(sessions) || 1),
      });
      Alert.alert('Прогресс силовых', `${cleanName} добавлен в историю.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Упражнение', error instanceof Error ? error.message : 'Не удалось сохранить упражнение.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} activeOpacity={0.7}>
          <Text style={styles.backText}>← Прогресс</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Новый силовой результат</Text>
        <Text style={styles.sub}>Фиксируйте рабочие веса без лишних полей и длинных форм.</Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Упражнение</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Жим лёжа"
            placeholderTextColor={colors.ink4}
          />

          <View style={styles.twoCols}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Вес</Text>
              <TextInput
                style={styles.input}
                value={val}
                onChangeText={setVal}
                placeholder="70 кг"
                placeholderTextColor={colors.ink4}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Сессий</Text>
              <TextInput
                style={styles.input}
                value={sessions}
                onChangeText={setSessions}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor={colors.ink4}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Дельта</Text>
          <TextInput
            style={styles.input}
            value={delta}
            onChangeText={setDelta}
            placeholder="+5 кг"
            placeholderTextColor={colors.ink4}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Последние силовые</Text>
          {suggestions.map(item => (
            <TouchableOpacity
              key={item.name}
              style={styles.row}
              onPress={() => {
                setName(item.name);
                setVal(item.val);
                setDelta(item.delta);
                setSessions(String(item.sessions));
              }}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.sessions} тренировок</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rowVal}>{item.val}</Text>
                <Text style={styles.rowDelta}>{item.delta}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Button title={saving ? 'Сохраняем...' : 'Сохранить результат'} onPress={handleSave} disabled={!canSave} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  back: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  backText: { fontSize: 14, color: colors.ink3, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  sub: { fontSize: 13, color: colors.ink3, marginTop: 3, marginBottom: spacing.lg },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  fieldLabel: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, marginBottom: 6, fontWeight: '700' },
  input: { backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark, marginBottom: spacing.sm },
  twoCols: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  sectionTitle: { fontSize: 12, color: colors.ink3, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 10 },
  rowLabel: { fontSize: 14, color: colors.dark, fontWeight: '600' },
  rowSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  rowVal: { fontSize: 15, color: colors.dark, fontWeight: '700' },
  rowDelta: { fontSize: 12, color: colors.ok, fontWeight: '700', marginTop: 2 },
});
