import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { ScreenState } from '../../components/common/ScreenState';
import { useApp } from '../../state/AppContext';

function FakeQR() {
  const seed = [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1,
    1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0];
  return (
    <View style={qrStyles.grid}>
      {seed.map((on, i) => (
        <View key={i} style={[qrStyles.cell, { backgroundColor: on ? '#fff' : 'transparent' }]} />
      ))}
    </View>
  );
}

const qrStyles = StyleSheet.create({
  grid: { width: 160, height: 160, flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: 20, height: 20 },
});

export default function QRPassScreen() {
  const [shown, setShown] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const { data, loading, error, reload, checkIn } = useApp();
  const user = data?.user;
  const membership = data?.membership;
  const todayVisits = (data?.visits ?? []).filter(item => item.clientId === user?.id).slice(0, 3);
  const checkInBlocked = loading || checkingIn || !user || membership?.status === 'frozen' || membership?.status === 'expired';
  const membershipStatusLabel = membership?.status === 'frozen'
    ? 'ЗАМОРОЖЕН'
    : membership?.status === 'expired'
      ? 'ИСТЕК'
      : 'АКТИВЕН';

  if (loading && !data) {
    return <ScreenState loading title="Загрузка пропуска" message="Подтягиваем текущий абонемент и визиты." />;
  }

  if (error && !data) {
    return <ScreenState title="Пропуск недоступен" message={error} onRetry={reload} retryLabel="Повторить" />;
  }

  const handleCheckIn = async () => {
    if (checkInBlocked) {
      if (membership?.status === 'frozen' || membership?.status === 'expired') {
        Alert.alert('Чек-ин недоступен', 'Активируйте абонемент перед входом в клуб.');
      }
      return;
    }

    setCheckingIn(true);
    try {
      const inserted = await checkIn(user.id, 'Турникет');
      setShown(true);
      Alert.alert(
        inserted ? 'Пропуск активирован' : 'Пропуск уже активирован',
        inserted
          ? 'Посещение добавлено и будет синхронизировано с 1С.'
          : 'Повторный вход в этой зоне уже записан.',
      );
    } catch (err) {
      Alert.alert('Чек-ин недоступен', err instanceof Error ? err.message : 'Не удалось записать посещение.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Мой пропуск</Text>
        <Text style={styles.sub}>Покажите на входе в клуб</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardName}>{user?.name ?? 'Клиент'}</Text>
              <Text style={styles.cardNum}>Карта №{user?.cardNumber ?? 'не назначена'}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{membershipStatusLabel}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.qrArea, checkInBlocked && styles.qrAreaDisabled]}
            onPress={handleCheckIn}
            activeOpacity={0.9}
            disabled={checkingIn || loading}
          >
            {shown ? (
              <FakeQR />
            ) : (
              <View style={styles.qrPlaceholder}>
                <View style={styles.qrIcon}>
                  <Text style={styles.qrIconText}>QR</Text>
                </View>
                <Text style={styles.qrHint}>{checkingIn ? 'Записываем вход...' : 'Нажмите, чтобы показать'}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.footerLabel}>ТИП АБОНЕМЕНТА</Text>
              <Text style={styles.footerVal}>{membership?.title ?? 'Абонемент'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.footerLabel}>ДЕЙСТВУЕТ ДО</Text>
              <Text style={styles.footerVal}>{membership?.expiresAt ?? '01 июня 2026'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.visitsCard}>
          <Text style={styles.visitsLabel}>СЕГОДНЯ</Text>
          <Text style={styles.visitsVal}>{todayVisits.length} посещения</Text>
          {todayVisits.map(item => (
            <View key={item.id} style={styles.visitItem}>
              <Text style={styles.visitDot}>·</Text>
              <Text style={styles.visitText}>{item.time} — {item.zone}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ДОСТУПНЫЕ ЗОНЫ</Text>
        <View style={styles.zonesRow}>
          {(membership?.zones ?? []).map(z => (
            <View key={z.label} style={[styles.zoneChip, z.available && styles.zoneChipOk]}>
              <Text style={[styles.zoneText, z.available && styles.zoneTextOk]}>{z.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, paddingTop: spacing.lg, letterSpacing: 0 },
  sub: { fontSize: 13, color: colors.ink3, marginTop: 4, marginBottom: spacing.lg },
  card: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  cardName: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0 },
  cardNum: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
  statusBadge: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 10, color: colors.accentInk, fontWeight: '800', letterSpacing: 0.6 },
  qrArea: { backgroundColor: '#fff', borderRadius: radius.lg, height: 210, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  qrAreaDisabled: { opacity: 0.55 },
  qrPlaceholder: { alignItems: 'center', gap: 10 },
  qrIcon: { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  qrIconText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  qrHint: { fontSize: 13, color: colors.ink3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.7, marginBottom: 3 },
  footerVal: { fontSize: 13, color: '#fff', fontWeight: '700' },
  visitsCard: { backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md },
  visitsLabel: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, marginBottom: 4 },
  visitsVal: { fontSize: 20, fontWeight: '800', color: colors.dark, marginBottom: 10 },
  visitItem: { flexDirection: 'row', gap: 6, marginTop: 2 },
  visitDot: { fontSize: 14, color: colors.accent, fontWeight: '700' },
  visitText: { fontSize: 13, color: colors.ink2, lineHeight: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.ink3, letterSpacing: 0.8, marginBottom: 10 },
  zonesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zoneChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperCard },
  zoneChipOk: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  zoneText: { fontSize: 12, color: colors.ink3 },
  zoneTextOk: { color: colors.accentInk, fontWeight: '600' },
});
