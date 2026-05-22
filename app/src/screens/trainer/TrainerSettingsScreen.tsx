import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { colors, radius, spacing } from '../../theme';
import { useApp } from '../../state/AppContext';
import { TrainerStackParamList } from '../../navigation/types';

type Props = StackScreenProps<TrainerStackParamList, 'TrainerSettings'>;

export default function TrainerSettingsScreen({ navigation }: Props) {
  const { data } = useApp();
  const trainer = data?.trainers[0];
  const [push, setPush] = useState(true);
  const [autoReply, setAutoReply] = useState(false);
  const [reminders, setReminders] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} activeOpacity={0.7}>
          <Text style={styles.backText}>← Профиль</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Avatar initials={trainer?.initials ?? 'ТР'} size="lg" variant="dark" />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{trainer?.name ?? 'Тренер'}</Text>
            <Text style={styles.meta}>{trainer?.spec ?? 'Специализация не указана'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <SettingRow label="Push-уведомления" value={push} onChange={setPush} />
          <SettingRow label="Автоответ в чатах" value={autoReply} onChange={setAutoReply} />
          <SettingRow label="Напоминания о клиентах" value={reminders} onChange={setReminders} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Рабочие параметры</Text>
          <Text style={styles.info}>Оповещения о новых сообщениях и переносах можно централизовать здесь, не перегружая профиль.</Text>
        </View>

        <Button title="Сохранить" onPress={() => Alert.alert('Настройки', 'Параметры тренера обновлены на этом устройстве.')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.surface3, true: colors.accentSoft }} thumbColor={value ? colors.accent : '#fff'} />
    </View>
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
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 },
  rowLabel: { flex: 1, fontSize: 14, color: colors.dark, fontWeight: '600' },
  sectionTitle: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700', marginBottom: 10 },
  info: { fontSize: 13, color: colors.ink2, lineHeight: 19 },
});
