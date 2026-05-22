import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { colors, radius, spacing } from '../../theme';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';
import { AdminStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AdminStackParamList, 'AdminSettings'>;

export default function AdminSettingsScreen({ navigation }: Props) {
  const { data, setSetting, reload } = useApp();
  const settings = data?.settings ?? [];

  const update = async (key: string, value: boolean, label: string, note: string) => {
    await setSetting(key, value, label, note);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Система</Text>
        <Text style={styles.sub}>Служебные настройки клуба и интеграций.</Text>

        <View style={styles.card}>
          {settings.map(item => (
            <View key={item.key} style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowNote}>{item.note}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={value => update(item.key, value, item.label, item.note)}
                trackColor={{ false: colors.surface3, true: colors.accentSoft }}
                thumbColor={item.value ? colors.accent : '#fff'}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Резервные сценарии</Text>
          <Text style={styles.info}>Кнопка ниже обновляет состояние настроек из локальной базы и закрывает экран после синхронизации.</Text>
        </View>

        <Button
          title="Обновить"
          onPress={async () => {
            await reload();
            navigation.goBack();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, paddingTop: spacing.lg, letterSpacing: 0 },
  sub: { fontSize: 13, color: colors.ink3, marginTop: 3, marginBottom: spacing.lg },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowBody: { flex: 1, paddingRight: spacing.sm },
  rowLabel: { fontSize: 14, color: colors.dark, fontWeight: '600' },
  rowNote: { fontSize: 12, color: colors.ink3, marginTop: 3, lineHeight: 17 },
  sectionTitle: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700', marginBottom: 8 },
  info: { fontSize: 13, color: colors.ink2, lineHeight: 19 },
});
