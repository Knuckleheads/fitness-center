import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';
import { useApp } from '../../state/AppContext';
import { TrainerClient } from '../../api/types';
import { formatClientInitials } from '../../db/database';
import { SyncStatusBadge } from '../../components/common/SyncStatusBadge';

const ZONES = ['Ресепшен', 'Тренажерный зал', 'Бассейн', 'Групповые', 'Сауна'];

export default function AdminCheckinScreen() {
  const [scanning, setScanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState(ZONES[0]);
  const [zonePickerOpen, setZonePickerOpen] = useState(false);

  const { data, loading, error, checkIn, syncStatus, syncNow } = useApp();
  const visits = data?.visits ?? [];
  const clients = data?.trainerClients ?? [];
  const membershipStatus = data?.membership.status;
  const checkInBlocked = loading || scanning || checking;

  const filteredClients = useMemo<TrainerClient[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients.slice(0, 20);
    return clients.filter(
      client =>
        client.name.toLowerCase().includes(q) ||
        client.id.toLowerCase().includes(q) ||
        client.goal.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const performCheckIn = async (clientId: string, clientName: string, zone: string) => {
    if (membershipStatus === 'frozen' || membershipStatus === 'expired') {
      Alert.alert('Чек-ин недоступен', 'У клиента нет активного абонемента.');
      return;
    }

    try {
      setChecking(true);
      const inserted = await checkIn(clientId, zone);
      Alert.alert(
        inserted ? 'Чек-ин выполнен' : 'Уже записан',
        inserted
          ? `${clientName} · ${zone} · время записано`
          : `${clientName} · чек-ин уже существует за последнюю минуту`,
      );
    } catch (err) {
      Alert.alert('Чек-ин недоступен', err instanceof Error ? err.message : 'Не удалось записать посещение.');
    } finally {
      setChecking(false);
    }
  };

  const handleScan = () => {
    if (checkInBlocked) return;

    setScanning(true);
    setTimeout(async () => {
      try {
        const clientId = data?.user.id ?? 'client-anna';
        const clientName = data?.user.name ?? 'Клиент';
        await performCheckIn(clientId, clientName, selectedZone);
      } finally {
        setScanning(false);
      }
    }, 900);
  };

  const handleManualCheckIn = async (client: TrainerClient) => {
    setManualOpen(false);
    setSearch('');
    await performCheckIn(client.id, client.name, selectedZone);
  };

  const todayVisits = visits.length;
  const activeVisits = visits.filter(v => v.ok).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ресепшен</Text>
            <Text style={styles.sub}>Сегодня · {todayVisits} визитов</Text>
            {!!error && <Text style={styles.errorBanner}>{error}</Text>}
          </View>
          <View style={styles.shiftBadge}>
            <Text style={styles.shiftText}>{checkInBlocked ? 'ОБРАБОТКА' : 'В СМЕНЕ'}</Text>
          </View>
        </View>

        <View style={styles.syncWrap}>
          <SyncStatusBadge status={syncStatus} onSyncNow={syncNow} />
        </View>

        <TouchableOpacity
          style={styles.zonePicker}
          onPress={() => setZonePickerOpen(true)}
          activeOpacity={0.75}
          disabled={checkInBlocked}
        >
          <Text style={styles.zoneLabel}>ЗОНА ВХОДА</Text>
          <View style={styles.zoneValueRow}>
            <Text style={styles.zoneValue}>{selectedZone}</Text>
            <Text style={styles.zoneChevron}>▾</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewfinder, scanning && styles.viewfinderActive]}
          onPress={handleScan}
          activeOpacity={0.9}
          disabled={checkInBlocked}
        >
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          <View style={styles.scanCenter}>
            <View style={[styles.scanIcon, scanning && styles.scanIconActive]}>
              <Text style={styles.scanIconText}>{scanning ? '⟳' : '▣'}</Text>
            </View>
            <Text style={[styles.scanHint, scanning && styles.scanHintActive]}>
              {scanning ? 'Сканирование...' : 'Нажмите, чтобы сканировать QR'}
            </Text>
          </View>

          {scanning && <View style={styles.scanLine} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.manualBtn, checkInBlocked && styles.disabledBtn]}
          onPress={() => {
            setSearch('');
            setManualOpen(true);
          }}
          activeOpacity={0.75}
          disabled={checkInBlocked}
        >
          <Text style={styles.manualBtnText}>Найти клиента вручную</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.dark }]}>
            <Text style={styles.statLabelDark}>СЕЙЧАС В КЛУБЕ</Text>
            <Text style={styles.statValDark}>{activeVisits}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ВСЕГО ВИЗИТОВ</Text>
            <Text style={styles.statVal}>{todayVisits}</Text>
            <Text style={styles.statSub}>за смену</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ПОСЛЕДНИЕ ЧЕК-ИНЫ</Text>
        {visits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Чек-инов ещё нет</Text>
          </View>
        ) : (
          <View style={styles.recentCard}>
            {visits.slice(0, 8).map((visit, index) => (
              <View key={visit.id} style={[styles.recentRow, index < Math.min(visits.length, 8) - 1 && styles.recentBorder]}>
                <View style={[styles.recentDot, { backgroundColor: visit.ok ? colors.ok : colors.danger }]} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{visit.name}</Text>
                  <Text style={styles.recentZone}>{visit.zone}</Text>
                </View>
                <Text style={styles.recentTime}>{visit.time}</Text>
                <Text style={[styles.recentStatus, { color: visit.ok ? colors.ok : colors.danger }]}>{visit.status}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={zonePickerOpen} animationType="slide" transparent onRequestClose={() => setZonePickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите зону</Text>
              <TouchableOpacity onPress={() => setZonePickerOpen(false)} activeOpacity={0.7}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            {ZONES.map(zone => (
              <TouchableOpacity
                key={zone}
                style={[styles.zoneOption, selectedZone === zone && styles.zoneOptionActive]}
                onPress={() => {
                  setSelectedZone(zone);
                  setZonePickerOpen(false);
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.zoneOptionText, selectedZone === zone && styles.zoneOptionTextActive]}>{zone}</Text>
                {selectedZone === zone && <Text style={styles.zoneCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={manualOpen} animationType="slide" transparent onRequestClose={() => setManualOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalTall]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Найти клиента</Text>
              <TouchableOpacity onPress={() => { setManualOpen(false); setSearch(''); }} activeOpacity={0.7}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Имя или ID клиента..."
              placeholderTextColor={colors.ink4}
              autoFocus
              clearButtonMode="while-editing"
            />

            <Text style={styles.manualZoneNote}>Зона: {selectedZone}</Text>

            <FlatList
              data={filteredClients}
              keyExtractor={item => item.id}
              style={styles.clientList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.clientRow}
                  onPress={() => handleManualCheckIn(item)}
                  activeOpacity={0.75}
                  disabled={checkInBlocked}
                >
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{formatClientInitials(item.name, item.initials)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientRowName}>{item.name}</Text>
                    <Text style={styles.clientRowMeta}>{item.goal} · {item.status}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: item.status === 'warn' ? colors.danger : colors.ok }]} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>{checkInBlocked ? 'Обработка...' : 'Клиентов не найдено'}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: spacing.lg, marginBottom: spacing.md, gap: spacing.md },
  syncWrap: { marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  sub: { fontSize: 13, color: colors.ink3, marginTop: 3 },
  errorBanner: { fontSize: 12, color: colors.danger, marginTop: 4, maxWidth: 250 },
  shiftBadge: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  shiftText: { fontSize: 10, color: colors.accentInk, fontWeight: '800', letterSpacing: 0.8 },
  zonePicker: { backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.md },
  zoneLabel: { fontSize: 9, color: colors.ink3, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 },
  zoneValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zoneValue: { fontSize: 15, fontWeight: '700', color: colors.dark },
  zoneChevron: { fontSize: 14, color: colors.ink3 },
  viewfinder: { height: 220, borderRadius: radius.xl, backgroundColor: colors.paperCard, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginBottom: spacing.md },
  viewfinderActive: { borderColor: colors.accent, backgroundColor: '#f9ffed' },
  corner: { position: 'absolute', width: 22, height: 22, borderColor: colors.dark, borderWidth: 3 },
  cornerTL: { top: 14, left: 14, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 14, right: 14, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 14, left: 14, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 14, right: 14, borderLeftWidth: 0, borderTopWidth: 0 },
  scanCenter: { alignItems: 'center', gap: 12 },
  scanIcon: { width: 64, height: 64, borderRadius: radius.xl, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  scanIconActive: { backgroundColor: colors.accent },
  scanIconText: { fontSize: 28, color: '#fff' },
  scanHint: { fontSize: 13, color: colors.ink3, textAlign: 'center' },
  scanHintActive: { color: colors.accentInk },
  scanLine: { position: 'absolute', left: 14, right: 14, height: 2, backgroundColor: colors.accent, top: '50%' },
  manualBtn: { borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.dark, padding: 14, alignItems: 'center', marginBottom: spacing.md },
  manualBtnText: { fontSize: 14, color: colors.dark, fontWeight: '700' },
  disabledBtn: { opacity: 0.55 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.line },
  statLabel: { fontSize: 9, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700' },
  statVal: { fontSize: 32, fontWeight: '800', color: colors.dark, marginTop: 4, letterSpacing: 0 },
  statSub: { fontSize: 11, color: colors.ink3, marginTop: 2 },
  statLabelDark: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, fontWeight: '700' },
  statValDark: { fontSize: 32, fontWeight: '800', color: colors.accent, marginTop: 4, letterSpacing: 0 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.ink3, letterSpacing: 0.8, marginBottom: 10 },
  emptyCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.ink3 },
  recentCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.md, gap: 10 },
  recentBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, color: colors.dark, fontWeight: '500' },
  recentZone: { fontSize: 11, color: colors.ink3, marginTop: 1 },
  recentTime: { fontSize: 12, color: colors.ink3, width: 44 },
  recentStatus: { fontSize: 13, fontWeight: '700', width: 52, textAlign: 'right' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(14,14,12,0.35)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '55%' },
  modalTall: { maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.dark },
  closeText: { fontSize: 28, color: colors.ink3, lineHeight: 30 },
  zoneOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.lg, marginBottom: 6, backgroundColor: colors.paperCard, borderWidth: 1, borderColor: colors.line },
  zoneOptionActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  zoneOptionText: { fontSize: 15, color: colors.dark, fontWeight: '500' },
  zoneOptionTextActive: { color: '#fff', fontWeight: '700' },
  zoneCheck: { fontSize: 16, color: colors.accent, fontWeight: '800' },
  searchInput: { backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark, marginBottom: spacing.sm },
  manualZoneNote: { fontSize: 12, color: colors.ink3, marginBottom: spacing.sm, fontWeight: '500' },
  clientList: { flex: 1 },
  clientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.line, gap: spacing.md },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  clientAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  clientRowName: { fontSize: 14, fontWeight: '700', color: colors.dark },
  clientRowMeta: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  noResults: { padding: spacing.xl, alignItems: 'center' },
  noResultsText: { fontSize: 14, color: colors.ink3 },
});
