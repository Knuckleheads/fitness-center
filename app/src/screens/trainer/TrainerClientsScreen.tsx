import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../theme';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';
import { TrainerClient } from '../../api/types';
import { TrainerTabParamList } from '../../navigation/types';

const FILTERS = ['Все', 'Активные', 'Заверш.'];

function statusLabel(s: TrainerClient['status']) {
  if (s === 'warn') return 'заверш.';
  if (s === 'new') return 'новый';
  if (s === 'done') return 'завершен';
  return 'активен';
}

function telHref(phone?: string) {
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (!digits) return null;
  return `tel:${digits.startsWith('7') ? digits : `7${digits}`}`;
}

export default function TrainerClientsScreen() {
  const navigation = useNavigation<any>();
  const { data, loading, error, reload, setTrainerChatId } = useApp();
  const clients = data?.trainerClients ?? [];
  const [filter, setFilter] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => clients.filter(c => {
    const bySearch = c.name.toLowerCase().includes(search.toLowerCase());
    if (!bySearch) return false;
    if (filter === 1) return c.status === 'active' || c.status === 'new';
    if (filter === 2) return c.status === 'warn' || c.packageDone >= c.packageTotal;
    return true;
  }), [clients, filter, search]);

  const selected = clients.find(item => item.id === selectedId) ?? null;
  const selectedChat = selected ? data?.chats.find(chat => chat.clientId === selected.id) ?? null : null;

  const openChat = async (client: TrainerClient) => {
    const chat = data?.chats.find(item => item.clientId === client.id);
    if (!chat) {
      Alert.alert('Чат', 'Для этого клиента чат пока не создан.');
      return;
    }
    setTrainerChatId(chat.id);
    navigation.navigate('Chat');
  };

  const callClient = async (client: TrainerClient) => {
    const href = telHref(client.phone);
    if (!href) {
      Alert.alert('Звонок', 'Номер телефона клиента не указан.');
      return;
    }
    try {
      setBusyId(client.id);
      const supported = await Linking.canOpenURL(href);
      if (!supported) {
        throw new Error('Телефонные ссылки на этом устройстве недоступны');
      }
      await Linking.openURL(href);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось открыть звонок';
      Alert.alert('Звонок', message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Загружаем клиентов</Text>
          <Text style={styles.centerText}>Подтягиваем данные из локальной базы.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Не удалось открыть клиентов</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Button title="Повторить" onPress={reload} style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  if (selected) {
    const done = selected.packageDone;
    const total = selected.packageTotal;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const history = (data?.visits ?? []).filter(item => item.clientId === selected.id).slice(0, 4);

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setSelectedId(null)} style={styles.back}>
            <Text style={styles.backText}>← Клиенты</Text>
          </TouchableOpacity>
          <View style={styles.clientHeader}>
            <Avatar initials={selected.initials} size="lg" variant="dark" />
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{selected.name}</Text>
              <Text style={styles.clientMeta}>{selected.age} лет · {selected.weight} кг · цель: {selected.goal}</Text>
              <Text style={styles.clientMeta}>{selected.phone ?? 'Телефон не указан'}</Text>
              <View style={styles.actionChips}>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => openChat(selected)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.chipText}>Чат</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, !telHref(selected.phone) && styles.chipDisabled]}
                  onPress={() => callClient(selected)}
                  activeOpacity={0.75}
                  disabled={!telHref(selected.phone)}
                >
                  <Text style={styles.chipText}>Позвонить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.packageCard}>
            <Text style={styles.packageLabel}>Пакет тренировок</Text>
            <View style={styles.packageRow}>
              <Text style={styles.packageVal}>{done} из {total} тренировок</Text>
              <Text style={styles.packagePct}>{pct}%</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
          </View>
          <Text style={styles.sectionTitle}>Последние посещения</Text>
          {history.map(item => (
            <View key={item.id} style={styles.histRow}>
              <Text style={styles.histText}>{item.time} · {item.zone}</Text>
              <Text style={styles.histMark}>{item.status}</Text>
            </View>
          ))}
          {history.length === 0 && <Text style={styles.empty}>Посещений пока нет</Text>}
          <Text style={styles.sectionTitle}>Следующее занятие</Text>
          <View style={styles.nextCard}>
            <Text style={styles.nextTime}>{selected.nextSession}</Text>
            <Text style={styles.nextName}>
              {selectedChat ? `Чат: ${selectedChat.last}` : 'Личная тренировка'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Мои клиенты</Text>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск клиента..."
          placeholderTextColor={colors.ink4}
        />
        <View style={styles.filterRow}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, i === filter && styles.filterActive]}
              onPress={() => setFilter(i)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, i === filter && styles.filterActiveText]}>
                {i === 0 ? `${f} ${clients.length}` : f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: c }) => {
          const tel = telHref(c.phone);
          return (
            <TouchableOpacity style={styles.clientCard} onPress={() => setSelectedId(c.id)} activeOpacity={0.75}>
              <Avatar initials={c.initials} size="md" variant={c.status === 'warn' ? 'default' : c.status === 'new' ? 'accent' : 'dark'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName2}>{c.name}</Text>
                <Text style={styles.clientPackage}>пакет {c.packageDone} из {c.packageTotal}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardIcon}
                  onPress={() => openChat(c)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.cardIconText}>Чат</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardIcon, !tel && styles.cardIconDisabled]}
                  onPress={() => callClient(c)}
                  activeOpacity={0.75}
                  disabled={!tel || busyId === c.id}
                >
                  <Text style={styles.cardIconText}>{busyId === c.id ? '...' : 'Тел'}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.statusPill, {
                backgroundColor: c.status === 'warn' ? '#fde8e6' : c.status === 'new' ? colors.accentSoft : colors.surface3,
              }]}>
                <Text style={[styles.statusText, {
                  color: c.status === 'warn' ? colors.danger : c.status === 'new' ? colors.accentInk : colors.ink3,
                }]}>{statusLabel(c.status)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={(
          <View style={styles.centerState}>
            <Text style={styles.centerTitle}>Клиентов не найдено</Text>
            <Text style={styles.centerText}>Попробуйте другой фильтр или запрос.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  headerBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, marginBottom: spacing.md, letterSpacing: 0 },
  search: { backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark, marginBottom: spacing.sm },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperCard },
  filterActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  filterText: { fontSize: 13, color: colors.ink2 },
  filterActiveText: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.line, gap: spacing.md, flexWrap: 'wrap' },
  clientName2: { fontSize: 15, fontWeight: '700', color: colors.dark },
  clientPackage: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, marginLeft: 'auto' },
  statusText: { fontSize: 11, fontWeight: '600' },
  back: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  backText: { color: colors.ink3, fontSize: 14 },
  clientHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg, gap: spacing.md },
  clientName: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  clientMeta: { fontSize: 13, color: colors.ink3, marginTop: 3, marginBottom: 4 },
  actionChips: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperCard },
  chipDisabled: { opacity: 0.45 },
  chipText: { fontSize: 12, color: colors.dark, fontWeight: '500' },
  packageCard: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  packageLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, marginBottom: 8 },
  packageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  packageVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  packagePct: { fontSize: 14, fontWeight: '700', color: colors.accent },
  bar: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2 },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.ink3, marginBottom: 10, marginTop: spacing.md, letterSpacing: 0.5 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  histText: { fontSize: 14, color: colors.dark },
  histMark: { color: colors.ok, fontWeight: '700' },
  nextCard: { backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1.5, borderColor: colors.accent },
  nextTime: { fontSize: 13, color: colors.accentInk, fontWeight: '700' },
  nextName: { fontSize: 16, fontWeight: '700', color: colors.dark, marginTop: 2 },
  empty: { fontSize: 13, color: colors.ink3 },
  cardActions: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  cardIcon: { minWidth: 48, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surface3, alignItems: 'center' },
  cardIconDisabled: { opacity: 0.45 },
  cardIconText: { fontSize: 11, color: colors.dark, fontWeight: '600' },
  centerState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  centerTitle: { fontSize: 17, fontWeight: '800', color: colors.dark, textAlign: 'center' },
  centerText: { fontSize: 13, color: colors.ink3, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
