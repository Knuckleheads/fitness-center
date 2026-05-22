import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../../theme';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { ScreenState } from '../../components/common/ScreenState';
import { useApp } from '../../state/AppContext';

const SETTINGS: { label: string; screen: string }[] = [
  { label: 'Уведомления', screen: 'Notifications' },
  { label: 'Рекомендации тренировок', screen: 'Recommendations' },
  { label: 'Язык', screen: 'ClientSettings' },
  { label: 'Конфиденциальность', screen: 'ClientSettings' },
  { label: 'Поддержка', screen: 'Help' },
  { label: 'О приложении', screen: 'ClientSettings' },
];

export default function ProfileScreen() {
  const { data, loading, error, reload, freezeMembership, renewMembership, setRole } = useApp();
  const navigation = useNavigation<any>();
  const [selectedTariff, setSelectedTariff] = useState(1);
  const [view, setView] = useState<'profile' | 'membership'>('profile');
  const [freezing, setFreezing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(0);

  const user = data?.user;
  const membership = data?.membership;
  const trainer = data?.trainers[0];
  const plan = data?.workoutPlans.find(item => item.clientId === user?.id) ?? data?.workoutPlans[0];
  const tariffs = data?.tariffs ?? [];
  const selected = tariffs[selectedTariff] ?? tariffs[0];
  const freezeDisabled = freezing || paying || loading || !membership || membership.status !== 'active' || membership.freezesLeft <= 0;
  const payDisabled = paying || freezing || loading || !selected;
  const membershipStatusLabel = membership?.status === 'frozen'
    ? 'ЗАМОРОЖЕН'
    : membership?.status === 'expired'
      ? 'ИСТЕК'
      : 'АКТИВЕН';

  if (loading && !data) {
    return <ScreenState loading title="Загрузка профиля" message="Подтягиваем абонемент, тарифы и данные тренера." />;
  }

  if (error && !data) {
    return <ScreenState title="Профиль недоступен" message={error} onRetry={reload} retryLabel="Повторить" />;
  }

  const handleFreeze = async () => {
    if (freezeDisabled) return;
    if (membership?.status === 'frozen') {
      Alert.alert('Заморозка недоступна', 'Абонемент уже заморожен.');
      return;
    }
    if (membership?.status === 'expired') {
      Alert.alert('Заморозка недоступна', 'Истекший абонемент нельзя заморозить.');
      return;
    }
    if (!membership || membership.freezesLeft <= 0) {
      Alert.alert('Заморозка недоступна', 'Лимит заморозок уже использован.');
      return;
    }

    setFreezing(true);
    try {
      await freezeMembership();
      Alert.alert('Абонемент заморожен', 'Статус обновлён и будет передан в 1С.');
    } catch (err) {
      Alert.alert('Заморозка недоступна', err instanceof Error ? err.message : 'Не удалось заморозить абонемент.');
    } finally {
      setFreezing(false);
    }
  };

  const handlePay = async () => {
    const tariff = selected;
    if (!tariff || payDisabled) return;

    setPaying(true);
    try {
      await renewMembership(tariff.id, tariff.membershipTitle);
      Alert.alert('Оплата принята', `Абонемент продлён: ${tariff.label}.`);
    } catch (err) {
      Alert.alert('Оплата недоступна', err instanceof Error ? err.message : 'Не удалось продлить абонемент.');
    } finally {
      setPaying(false);
    }
  };

  const handleLogout = () => {
    setRole(null);
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const paymentMethods = ['•• 4710', 'СБП', 'Новая карта'];
  const changePaymentMethod = () => {
    if (loading) return;
    setPaymentMethod(value => (value + 1) % paymentMethods.length);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar initials={user?.initials ?? 'АК'} size="lg" variant="dark" />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name ?? 'Клиент'}</Text>
            <Text style={styles.cardNum}>Карта №{user?.cardNumber ?? 'не назначена'}</Text>
            <Text style={styles.phone}>{user?.phone ?? 'телефон не указан'}</Text>
          </View>
        </View>

        <View style={styles.seg}>
          {(['profile', 'membership'] as const).map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.segBtn, view === v && styles.segActive]}
              onPress={() => setView(v)}
              activeOpacity={0.75}
              disabled={loading}
            >
              <Text style={[styles.segText, view === v && styles.segActiveText]}>
                {v === 'profile' ? 'Профиль' : 'Абонемент'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {view === 'profile' && (
          <>
            <Text style={styles.sectionTitle}>МОЙ ТРЕНЕР</Text>
            <View style={styles.trainerCard}>
              <Avatar initials={trainer?.initials ?? 'ТР'} size="md" variant="dark" />
              <View style={{ flex: 1 }}>
                <Text style={styles.trainerName}>{trainer?.name ?? 'Тренер не назначен'}</Text>
                <Text style={styles.trainerSub}>{trainer?.spec ?? 'Специализация не указана'} · пакет {plan?.sessions ?? 0} тренировок</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.trainerLeft}>{Math.max((plan?.sessions ?? 0) - (plan?.done ?? 0), 0)}</Text>
                <Text style={styles.trainerLeftSub}>осталось</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>НАСТРОЙКИ</Text>
            <View style={styles.settingsCard}>
              {SETTINGS.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.settingRow, i < SETTINGS.length - 1 && styles.settingBorder]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(item.screen)}
                  disabled={loading}
                >
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Выйти из аккаунта"
              variant="ghost"
              onPress={handleLogout}
              style={{ marginTop: spacing.lg }}
              disabled={loading}
            />
          </>
        )}

        {view === 'membership' && (
          <>
            <View style={styles.memberCard}>
              <Text style={styles.memberStatus}>{membershipStatusLabel}</Text>
              <Text style={styles.memberType}>{membership?.title ?? 'Абонемент не выбран'}</Text>
              <Text style={styles.memberExp}>до {membership?.expiresAt ?? '01 июня 2026'} · {membership?.daysLeft ?? 42} дня</Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${membership?.progressPct ?? 62}%` }]} />
              </View>
            </View>

            <View style={styles.actionRow}>
              <Button
                title={freezing ? 'Замораживаем...' : 'Заморозить'}
                variant="outline"
                onPress={handleFreeze}
                loading={freezing}
                disabled={freezeDisabled}
                style={{ flex: 1 }}
              />
              <Button
                title="Продлить"
                variant="dark"
                onPress={() => setView('membership')}
                disabled={loading}
                style={{ flex: 1 }}
              />
            </View>

            <Text style={styles.sectionTitle}>ВКЛЮЧЕНО В АБОНЕМЕНТ</Text>
            <View style={styles.includesCard}>
              {(membership?.zones ?? []).map(item => (
                <View key={item.label} style={styles.includeRow}>
                  <View style={[styles.includeDot, !item.available && styles.includeDotNo]} />
                  <Text style={[styles.includeText, !item.available && styles.includeTextNo]}>{item.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>ТАРИФ ПРОДЛЕНИЯ</Text>
            {tariffs.map((t, i) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tariffCard, i === selectedTariff && styles.tariffSelected]}
                onPress={() => setSelectedTariff(i)}
                activeOpacity={0.8}
                disabled={loading}
              >
                {t.badge && (
                  <View style={styles.tariffBadge}>
                    <Text style={styles.tariffBadgeText}>{t.badge}</Text>
                  </View>
                )}
                <View style={styles.tariffRow}>
                  <View>
                    <Text style={styles.tariffLabel}>{t.label}</Text>
                    <Text style={styles.tariffSub}>{t.sub}</Text>
                  </View>
                  <Text style={styles.tariffPrice}>{t.price}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.payMethod}>
              <Text style={styles.payLabel}>СПОСОБ ОПЛАТЫ</Text>
              <View style={styles.payRow}>
                <Text style={styles.payCard}>{paymentMethods[paymentMethod]}</Text>
                <TouchableOpacity onPress={changePaymentMethod} disabled={loading} activeOpacity={0.75}>
                  <Text style={styles.payChange}>Изменить</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title={paying ? 'Оплачиваем...' : `Оплатить ${selected?.price ?? ''}`}
              onPress={handlePay}
              loading={paying}
              disabled={payDisabled}
              style={{ marginTop: spacing.md }}
            />
            <Text style={styles.payHint}>СБП · Карта · Apple Pay · Google Pay</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg, gap: spacing.md },
  name: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  cardNum: { fontSize: 12, color: colors.ink3, marginTop: 3 },
  phone: { fontSize: 12, color: colors.ink3 },
  seg: { flexDirection: 'row', backgroundColor: colors.surface3, borderRadius: radius.lg, padding: 3, marginBottom: spacing.lg },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  segActive: { backgroundColor: colors.paperCard },
  segText: { fontSize: 13, color: colors.ink3, fontWeight: '500' },
  segActiveText: { color: colors.dark, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.ink3, letterSpacing: 0.8, marginBottom: 10, marginTop: spacing.md },
  trainerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.sm, gap: spacing.md },
  trainerName: { fontSize: 15, fontWeight: '700', color: colors.dark },
  trainerSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  trainerLeft: { fontSize: 24, fontWeight: '800', color: colors.dark },
  trainerLeftSub: { fontSize: 10, color: colors.ink3 },
  settingsCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: spacing.md },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  settingLabel: { fontSize: 15, color: colors.dark },
  settingArrow: { fontSize: 20, color: colors.ink3 },
  memberCard: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  memberStatus: { fontSize: 10, color: colors.accent, letterSpacing: 0.8, fontWeight: '700', marginBottom: 6 },
  memberType: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0 },
  memberExp: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  bar: { height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, marginTop: spacing.md },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  includesCard: { backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line, gap: 10, marginBottom: spacing.sm },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  includeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ok },
  includeDotNo: { backgroundColor: colors.ink4 },
  includeText: { fontSize: 14, color: colors.dark },
  includeTextNo: { color: colors.ink3 },
  tariffCard: { backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1.5, borderColor: colors.line, marginBottom: 8, position: 'relative' },
  tariffSelected: { borderColor: colors.dark, borderWidth: 2 },
  tariffBadge: { position: 'absolute', top: -8, right: spacing.md, backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  tariffBadgeText: { fontSize: 9, color: colors.accentInk, fontWeight: '800', letterSpacing: 0.5 },
  tariffRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tariffLabel: { fontSize: 15, fontWeight: '700', color: colors.dark },
  tariffSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  tariffPrice: { fontSize: 18, fontWeight: '800', color: colors.dark },
  payMethod: { backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.line, marginTop: spacing.md },
  payLabel: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, marginBottom: 8 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payCard: { fontSize: 15, fontWeight: '600', color: colors.dark },
  payChange: { fontSize: 13, color: colors.dark, fontWeight: '600', textDecorationLine: 'underline' },
  payHint: { textAlign: 'center', fontSize: 12, color: colors.ink3, marginTop: spacing.sm },
});
