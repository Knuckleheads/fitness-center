import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { colors, radius, spacing } from '../../theme';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';
import { ClientStackParamList } from '../../navigation/types';

type Props = StackScreenProps<ClientStackParamList, 'ClientSettings'>;

export default function ClientSettingsScreen({ navigation }: Props) {
  const { data } = useApp();
  const user = data?.user;
  const membership = data?.membership;
  const [push, setPush] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');

  const save = () => {
    Alert.alert('Настройки', 'Параметры обновлены на этом устройстве.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} activeOpacity={0.7}>
          <Text style={styles.backText}>← Профиль</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Настройки</Text>
        <Text style={styles.sub}>Уведомления, язык и приватность без перегруза интерфейса.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Профиль</Text>
          <Text style={styles.name}>{user?.name ?? 'Клиент'}</Text>
          <Text style={styles.meta}>Карта {user?.cardNumber ?? 'не назначена'} · {membership?.title ?? 'абонемент не выбран'}</Text>
        </View>

        <View style={styles.card}>
          <SettingRow label="Push-уведомления" value={push} onChange={setPush} />
          <SettingRow label="Напоминания о тренировках" value={reminders} onChange={setReminders} />
          <SettingRow label="Биометрический вход" value={biometric} onChange={setBiometric} />
          <SettingRow label="Делиться прогрессом" value={sharing} onChange={setSharing} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Язык</Text>
          <View style={styles.segment}>
            {(['ru', 'en'] as const).map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.segmentItem, language === item && styles.segmentItemActive]}
                onPress={() => setLanguage(item)}
                activeOpacity={0.75}
              >
                <Text style={[styles.segmentText, language === item && styles.segmentTextActive]}>
                  {item === 'ru' ? 'Русский' : 'English'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button title="Сохранить" onPress={save} />
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
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  sub: { fontSize: 13, color: colors.ink3, marginTop: 3, marginBottom: spacing.lg },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700', marginBottom: 10 },
  name: { fontSize: 18, fontWeight: '800', color: colors.dark },
  meta: { fontSize: 13, color: colors.ink3, marginTop: 4, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 },
  rowLabel: { flex: 1, fontSize: 14, color: colors.dark, fontWeight: '600' },
  segment: { flexDirection: 'row', backgroundColor: colors.surface3, borderRadius: radius.lg, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md },
  segmentItemActive: { backgroundColor: colors.paperCard },
  segmentText: { fontSize: 13, color: colors.ink3, fontWeight: '600' },
  segmentTextActive: { color: colors.dark },
});
