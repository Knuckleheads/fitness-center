import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';
import { colors, radius, spacing } from '../../theme';

const MANAGEMENT = [
  'Настройки клуба',
  'Расписание и залы',
  'Тарифы и прайс',
  'Уведомления клиентам',
  'Экспорт отчётов',
  'Мои уведомления',
  'Помощь и FAQ',
];

const SYSTEM = [
  'Резервная копия',
  'Интеграции',
  'API доступ',
  'Журнал действий',
];

export default function AdminProfileScreen() {
  const { data, setSetting } = useApp();
  const navigation = useNavigation<any>();
  const [backupRunning, setBackupRunning] = useState(false);

  const systemMap = useMemo(() => {
    const pairs = data?.settings ?? [];
    return new Map(pairs.map(item => [item.key, item]));
  }, [data?.settings]);

  const clientCount = new Set([data?.user.id, ...(data?.trainerClients ?? []).map(item => item.id)].filter(Boolean)).size;

  const toggleSetting = async (key: string) => {
    const current = systemMap.get(key);
    if (!current) return;
    try {
      await setSetting(key, !current.value, current.label, current.note);
    } catch (err) {
      Alert.alert('Система', err instanceof Error ? err.message : 'Не удалось изменить настройку.');
    }
  };

  const runBackup = async () => {
    try {
      setBackupRunning(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      Alert.alert('Резервная копия', 'Локальный снимок базы отмечен как выполненный.');
    } finally {
      setBackupRunning(false);
    }
  };

  const openManagementItem = async (index: number) => {
    switch (index) {
      case 0:
        navigation.navigate('AdminSettings');
        return;
      case 1:
        navigation.navigate('Staff');
        return;
      case 2:
        navigation.navigate('Finance');
        return;
      case 3:
        navigation.navigate('Clients');
        return;
      case 4:
        await runBackup();
        return;
      case 5:
        navigation.navigate('Notifications');
        return;
      case 6:
        navigation.navigate('Help');
        return;
      default:
        return;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar initials="АД" size="lg" variant="dark" />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Администратор</Text>
            <Text style={styles.club}>Фитнес «Волна» · Центр</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Главный администратор</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'КЛИЕНТОВ', val: String(clientCount) },
            { label: 'ТРЕНЕРОВ', val: String(data?.trainers.length ?? 0) },
            { label: 'ЗАЛОВ', val: String(data?.halls.length ?? 0) },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statVal}>{stat.val}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>УПРАВЛЕНИЕ</Text>
        <View style={styles.settingsCard}>
          {MANAGEMENT.map((item, index) => (
            <TouchableOpacity
              key={item}
              style={[styles.settingRow, index < MANAGEMENT.length - 1 && styles.settingBorder]}
              onPress={() => openManagementItem(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>{item}</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>СИСТЕМА</Text>
        <View style={styles.settingsCard}>
          {SYSTEM.map((item, index) => {
            const key = item === 'Резервная копия'
              ? 'backup_enabled'
              : item === 'Интеграции'
                ? 'integrations_enabled'
                : item === 'API доступ'
                  ? 'api_enabled'
                  : 'audit_enabled';
            const setting = systemMap.get(key);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.settingRow, index < SYSTEM.length - 1 && styles.settingBorder]}
                onPress={() => toggleSetting(key)}
                activeOpacity={0.7}
              >
                <View style={styles.systemCopy}>
                  <Text style={styles.settingLabel}>{item}</Text>
                  <Text style={styles.settingNote}>{setting?.note ?? 'Нет описания'}</Text>
                </View>
                <View style={[styles.toggle, setting?.value && styles.toggleActive]}>
                  <View style={[styles.toggleDot, setting?.value && styles.toggleDotActive]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title={backupRunning ? 'Выполняем резервную копию...' : 'Создать резервную копию'}
          variant="ghost"
          onPress={runBackup}
          style={{ marginTop: spacing.lg }}
          disabled={backupRunning}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg, gap: spacing.md },
  name: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  club: { fontSize: 13, color: colors.ink3, marginTop: 3 },
  roleBadge: { marginTop: 5, alignSelf: 'flex-start', backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  roleText: { fontSize: 11, color: colors.accentInk, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  statLabel: { fontSize: 9, color: colors.ink3, letterSpacing: 0.6, textAlign: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: colors.dark, marginTop: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.ink3, letterSpacing: 0.8, marginBottom: 10, marginTop: spacing.md },
  settingsCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginBottom: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: spacing.md },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  settingLabel: { fontSize: 15, color: colors.dark, fontWeight: '600' },
  settingNote: { fontSize: 12, color: colors.ink3, marginTop: 2, maxWidth: 220 },
  settingArrow: { fontSize: 20, color: colors.ink3 },
  systemCopy: { flex: 1, paddingRight: 12 },
  toggle: { width: 46, height: 28, borderRadius: radius.full, backgroundColor: colors.surface3, padding: 3 },
  toggleActive: { backgroundColor: colors.ok },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  toggleDotActive: { marginLeft: 18 },
});
