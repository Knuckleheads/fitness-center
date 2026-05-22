import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { useApp } from '../../state/AppContext';
import { defaultSyncService } from '../../services/sync1C';
import type { SyncReport } from '../../services/sync1C';

type SyncState = 'idle' | 'syncing' | 'done' | 'error';

export default function AdminFinanceScreen() {
  const { data } = useApp();
  const tariffs = data?.tariffs ?? [];
  const payments = data?.payments ?? [];
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastReport, setLastReport] = useState<SyncReport | null>(null);
  const lastSyncAt = defaultSyncService.lastSyncAt();

  const handleSync = async () => {
    setSyncState('syncing');
    try {
      const report = await defaultSyncService.pullAll();
      setLastReport(report);
      setSyncState('done');
      const pulled = Object.values(report.counts).reduce((sum, count) => sum + count.pulled, 0);
      Alert.alert('Синхронизация завершена', `Загружено записей: ${pulled}\nОшибок: ${report.errors.length}`);
    } catch {
      setSyncState('error');
      Alert.alert('Ошибка синхронизации', 'Не удалось подключиться к mock 1С.');
    }
  };

  const formatLastSync = () => {
    if (!lastSyncAt) return 'Никогда';
    return new Date(lastSyncAt).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Финансы</Text>
        <Text style={styles.sub}>Поступления из локальной базы и состояние обмена</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{total.toLocaleString('ru-RU')} ₽</Text>
            <Text style={styles.kpiLabel}>Доход за месяц</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{payments.length}</Text>
            <Text style={styles.kpiLabel}>Платежей</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{tariffs.length}</Text>
            <Text style={styles.kpiLabel}>Тарифов</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ТАРИФЫ</Text>
        <View style={styles.card}>
          {tariffs.map((tariff, index) => (
            <View key={tariff.id} style={[styles.tariffRow, index < tariffs.length - 1 && styles.bordered]}>
              <View style={styles.tariffLeft}>
                <Text style={styles.tariffLabel}>{tariff.label}</Text>
                <Text style={styles.tariffSub}>{tariff.sub}</Text>
              </View>
              <Text style={styles.tariffPrice}>{tariff.price}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ПОСЛЕДНИЕ ПЛАТЕЖИ</Text>
        <View style={styles.card}>
          {payments.map((payment, index) => (
            <View key={payment.id} style={[styles.payRow, index < payments.length - 1 && styles.bordered]}>
              <View style={styles.payLeft}>
                <Text style={styles.payName}>{payment.name}</Text>
                <Text style={styles.paySub}>{payment.tariff} · {payment.method} · {payment.date}</Text>
              </View>
              <Text style={styles.payAmount}>+{payment.amount.toLocaleString('ru-RU')} ₽</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>СИНХРОНИЗАЦИЯ</Text>
        <View style={styles.card}>
          <View style={styles.syncRow}>
            <Ionicons name="sync-outline" size={20} color={colors.ink3} />
            <View style={styles.syncBody}>
              <Text style={styles.syncLabel}>Последняя синхронизация</Text>
              <Text style={styles.syncTime}>{formatLastSync()}</Text>
            </View>
          </View>
          {lastReport && lastReport.errors.length > 0 && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Ошибки: {lastReport.errors.map(error => error.entity).join(', ')}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.syncBtn, syncState === 'syncing' && styles.syncBtnDisabled]}
          onPress={handleSync}
          disabled={syncState === 'syncing'}
          activeOpacity={0.8}
        >
          <Ionicons
            name={syncState === 'syncing' ? 'hourglass-outline' : 'cloud-download-outline'}
            size={18}
            color={colors.dark}
          />
          <Text style={styles.syncBtnText}>
            {syncState === 'syncing' ? 'Синхронизация...' : 'Проверить mock 1С'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Демо-режим: тестовые платежи читаются из локальной базы, а отправка действий идет через очередь SQLite.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, paddingTop: spacing.lg, letterSpacing: 0 },
  sub: { fontSize: 13, color: colors.ink3, marginTop: 3, marginBottom: spacing.lg },
  kpiRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.paperCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    alignItems: 'center',
  },
  kpiValue: { fontSize: 18, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  kpiLabel: { fontSize: 10, color: colors.ink3, marginTop: 2, textAlign: 'center' },
  sectionTitle: {
    fontSize: 10,
    color: colors.ink3,
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.paperCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  bordered: { borderBottomWidth: 1, borderBottomColor: colors.line },
  tariffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tariffLeft: { flex: 1 },
  tariffLabel: { fontSize: 14, fontWeight: '600', color: colors.dark },
  tariffSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  tariffPrice: { fontSize: 15, fontWeight: '700', color: colors.dark },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  payLeft: { flex: 1 },
  payName: { fontSize: 14, fontWeight: '600', color: colors.dark },
  paySub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  payAmount: { fontSize: 14, fontWeight: '700', color: colors.ok },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  syncBody: { flex: 1 },
  syncLabel: { fontSize: 13, fontWeight: '600', color: colors.dark },
  syncTime: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  errorBox: { backgroundColor: '#fef2f2', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  errorText: { fontSize: 12, color: colors.danger },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginBottom: spacing.lg,
  },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnText: { fontSize: 15, fontWeight: '700', color: colors.dark },
  footer: { fontSize: 11, color: colors.ink4, textAlign: 'center', lineHeight: 16 },
});
