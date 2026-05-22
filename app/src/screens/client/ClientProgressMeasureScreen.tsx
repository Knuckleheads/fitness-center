import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { colors, radius, spacing } from '../../theme';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';
import { ClientStackParamList } from '../../navigation/types';

type Props = StackScreenProps<ClientStackParamList, 'ProgressMeasureForm'>;

const PRESETS = ['Вес', 'Талия', 'Грудь', 'Бедра'];

export default function ClientProgressMeasureScreen({ navigation }: Props) {
  const { data, addProgressMeasure } = useApp();
  const measures = data?.progress.measures ?? [];
  const [label, setLabel] = useState('Вес');
  const [val, setVal] = useState('');
  const [delta, setDelta] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = label.trim().length > 0 && val.trim().length > 0 && !saving;
  const latest = useMemo(() => measures.slice(0, 3), [measures]);

  const handleSave = async () => {
    const cleanLabel = label.trim();
    const cleanVal = val.trim();
    if (!cleanLabel || !cleanVal) {
      Alert.alert('Замер', 'Заполните название и значение.');
      return;
    }

    setSaving(true);
    try {
      await addProgressMeasure({
        label: cleanLabel,
        val: cleanVal,
        delta: delta.trim() || '0',
      });
      Alert.alert('Замер сохранён', `${cleanLabel} добавлен в историю прогресса.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Замер', error instanceof Error ? error.message : 'Не удалось сохранить замер.');
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

        <Text style={styles.title}>Новый замер</Text>
        <Text style={styles.sub}>Запишите значение так, как вы хотите видеть его в динамике.</Text>

        <View style={styles.quickRow}>
          {PRESETS.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.quickChip, label === item && styles.quickChipActive]}
              onPress={() => setLabel(item)}
              activeOpacity={0.75}
            >
              <Text style={[styles.quickText, label === item && styles.quickTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Показатель</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Например, Вес"
            placeholderTextColor={colors.ink4}
          />

          <View style={styles.twoCols}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Значение</Text>
              <TextInput
                style={styles.input}
                value={val}
                onChangeText={setVal}
                placeholder="74 см"
                placeholderTextColor={colors.ink4}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Дельта</Text>
              <TextInput
                style={styles.input}
                value={delta}
                onChangeText={setDelta}
                placeholder="-2"
                placeholderTextColor={colors.ink4}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Последние замеры</Text>
          {latest.map(item => (
            <View key={`${item.label}-${item.val}`} style={styles.row}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowVal}>{item.val}</Text>
              <Text style={styles.rowDelta}>{item.delta}</Text>
            </View>
          ))}
        </View>

        <Button title={saving ? 'Сохраняем...' : 'Сохранить замер'} onPress={handleSave} disabled={!canSave} />
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
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  quickChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperCard },
  quickChipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  quickText: { fontSize: 12, color: colors.ink2, fontWeight: '600' },
  quickTextActive: { color: '#fff' },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  fieldLabel: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, marginBottom: 6, fontWeight: '700' },
  input: { backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark },
  twoCols: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
  col: { flex: 1 },
  sectionTitle: { fontSize: 12, color: colors.ink3, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 8 },
  rowLabel: { flex: 1, fontSize: 14, color: colors.dark, fontWeight: '600' },
  rowVal: { fontSize: 14, color: colors.ink2, fontWeight: '700' },
  rowDelta: { minWidth: 36, textAlign: 'right', fontSize: 12, color: colors.ok, fontWeight: '700' },
});
