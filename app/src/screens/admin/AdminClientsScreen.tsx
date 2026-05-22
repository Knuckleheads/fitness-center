import React, { useMemo, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../../components/common/Avatar';
import { useApp } from '../../state/AppContext';
import { TrainerClient } from '../../api/types';
import { formatClientInitials, formatClientShortName } from '../../db/database';
import { colors, radius, spacing } from '../../theme';

const FILTERS = ['Активные', 'Заканч.', 'Новые', 'Все'];

const STATUS_OPTIONS: { label: string; value: TrainerClient['status'] }[] = [
  { label: 'Активный', value: 'active' },
  { label: 'Новый', value: 'new' },
  { label: 'Риск', value: 'warn' },
  { label: 'Завершен', value: 'done' },
];

type ClientForm = {
  id?: string;
  name: string;
  initials: string;
  status: TrainerClient['status'];
  packageDone: string;
  packageTotal: string;
  age: string;
  weight: string;
  goal: string;
  nextSession: string;
};

const emptyForm: ClientForm = {
  name: '',
  initials: '',
  status: 'new',
  packageDone: '0',
  packageTotal: '10',
  age: '',
  weight: '',
  goal: '',
  nextSession: 'нет записи',
};

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

function statusText(client: TrainerClient) {
  const left = client.packageTotal - client.packageDone;
  if (client.status === 'warn') return `заканч. · ${left} ост.`;
  if (client.status === 'new') return 'новый';
  if (client.status === 'done') return 'пакет завершен';
  return `активен · ${left} ост.`;
}

function formFromClient(client: TrainerClient): ClientForm {
  return {
    id: client.id,
    name: client.name,
    initials: formatClientInitials(client.name, client.initials),
    status: client.status,
    packageDone: String(client.packageDone),
    packageTotal: String(client.packageTotal),
    age: String(client.age),
    weight: String(client.weight),
    goal: client.goal,
    nextSession: client.nextSession,
  };
}

export default function AdminClientsScreen() {
  const { data, addClient } = useApp();
  const navigation = useNavigation<any>();
  const clients = data?.trainerClients ?? [];
  const user = data?.user;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const initialsManual = useRef(false);

  const updateForm = <K extends keyof ClientForm>(key: K, value: ClientForm[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !initialsManual.current) {
        next.initials = formatClientInitials(String(value), prev.initials);
      }
      if (key === 'initials') {
        initialsManual.current = true;
      }
      return next;
    });
  };

  const openCreate = () => {
    initialsManual.current = false;
    setErrorText('');
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (client: TrainerClient) => {
    initialsManual.current = false;
    setErrorText('');
    setForm(formFromClient(client));
    setModalOpen(true);
  };

  const closeForm = () => {
    if (!saving) {
      setModalOpen(false);
    }
  };

  const submitClient = async () => {
    const name = form.name.trim();
    const initials = formatClientInitials(name, form.initials);
    const packageDone = /^\d+$/.test(form.packageDone.trim()) ? Number(form.packageDone) : null;
    const packageTotal = /^\d+$/.test(form.packageTotal.trim()) ? Number(form.packageTotal) : null;
    const age = /^\d+$/.test(form.age.trim()) ? Number(form.age) : null;
    const weight = /^\d+$/.test(form.weight.trim()) ? Number(form.weight) : null;
    const goal = form.goal.trim();

    if (!name || !initials) {
      setErrorText('Укажите имя клиента.');
      return;
    }
    if (packageDone === null || packageTotal === null || age === null || weight === null) {
      setErrorText('Возраст, вес и пакет тренировок должны быть целыми числами.');
      return;
    }
    if (packageTotal < packageDone) {
      setErrorText('В пакете не может быть меньше занятий, чем уже пройдено.');
      return;
    }

    try {
      setSaving(true);
      setErrorText('');
      await addClient({
        id: form.id,
        name,
        initials,
        status: form.status,
        packageDone,
        packageTotal,
        age,
        weight,
        goal: goal || 'цель не указана',
        nextSession: form.nextSession.trim() || 'нет записи',
      });
      setFilter(3);
      setModalOpen(false);
      Alert.alert('Клиент сохранен', `${name} обновлен в локальной базе.`);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Не удалось сохранить клиента.');
    } finally {
      setSaving(false);
    }
  };

  const allClients = useMemo(() => {
    const ownClient = user
      ? [{
          id: user.id,
          name: user.name,
          initials: formatClientInitials(user.name, user.initials),
          packageDone: 0,
          packageTotal: 0,
          status: 'active' as const,
          age: 0,
          weight: 0,
          goal: 'клубный клиент',
          nextSession: '',
        }]
      : [];
    return [...ownClient, ...clients.filter(item => item.id !== user?.id)];
  }, [clients, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allClients.filter(client => {
      const matches = !q || client.name.toLowerCase().includes(q) || client.id.toLowerCase().includes(q);
      if (!matches) return false;
      if (filter === 0) return client.status === 'active';
      if (filter === 1) return client.status === 'warn' || client.status === 'done';
      if (filter === 2) return client.status === 'new';
      return true;
    });
  }, [allClients, filter, search]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBlock}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Клиенты</Text>
          <Text style={styles.total}>{allClients.length}</Text>
        </View>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Имя или ID клиента..."
          placeholderTextColor={colors.ink4}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {FILTERS.map((label, index) => (
            <TouchableOpacity
              key={label}
              style={[styles.filterChip, index === filter && styles.filterActive]}
              onPress={() => setFilter(index)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, index === filter && styles.filterActiveText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const warn = item.status === 'warn' || item.status === 'done';
          return (
            <TouchableOpacity style={[styles.clientCard, warn && styles.clientCardWarn]} activeOpacity={0.82} onPress={() => navigation.navigate('AdminClientDetail', { clientId: item.id })}>
              <Avatar initials={formatClientInitials(item.name, item.initials)} size="sm" variant={warn ? 'default' : 'dark'} />
              <View style={styles.clientBody}>
                <View style={styles.clientRowTop}>
                  <Text style={styles.clientName}>{formatClientShortName(item.name) || item.name}</Text>
                  <Text style={styles.clientPackage}>{item.packageDone}/{item.packageTotal}</Text>
                </View>
                <Text style={[styles.clientStatus, warn && styles.clientWarn]}>
                  {item.id} · {statusText(item)}
                </Text>
                <Text style={styles.clientMeta}>
                  {item.goal} · {item.nextSession || 'нет записи'}
                </Text>
              </View>
              <Text style={styles.more}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Клиентов по этому фильтру нет</Text>
          </View>
        )}
        ListFooterComponent={() => (
          <TouchableOpacity style={[styles.addBtn, saving && styles.disabledBtn]} onPress={openCreate} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Новый клиент</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeForm}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{form.id ? 'Редактировать клиента' : 'Новый клиент'}</Text>
              <TouchableOpacity onPress={closeForm} activeOpacity={0.7}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={value => updateForm('name', value.replace(/[0-9]/g, ''))}
                placeholder="ФИО"
                placeholderTextColor={colors.ink4}
              />
              <TextInput
                style={styles.input}
                value={form.initials}
                onChangeText={value => updateForm('initials', value.toUpperCase())}
                placeholder="Инициалы для аватара (авто)"
                placeholderTextColor={colors.ink4}
                maxLength={3}
              />
              {!!form.name.trim() && (
                <Text style={styles.shortNameHint}>
                  В списке: {formatClientShortName(form.name) || form.name}
                </Text>
              )}

              <Text style={styles.fieldLabel}>Статус</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.statusChip, form.status === option.value && styles.statusChipActive]}
                    onPress={() => updateForm('status', option.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.statusChipText, form.status === option.value && styles.statusChipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.twoCols}>
                <TextInput
                  style={[styles.input, styles.colInput]}
                  value={form.packageDone}
                  onChangeText={value => updateForm('packageDone', value)}
                  placeholder="Пройдено"
                  keyboardType="numeric"
                  placeholderTextColor={colors.ink4}
                  maxLength={3}
                />
                <TextInput
                  style={[styles.input, styles.colInput]}
                  value={form.packageTotal}
                  onChangeText={value => updateForm('packageTotal', value)}
                  placeholder="Пакет всего"
                  keyboardType="numeric"
                  placeholderTextColor={colors.ink4}
                  maxLength={3}
                />
              </View>

              <View style={styles.twoCols}>
                <TextInput
                  style={[styles.input, styles.colInput]}
                  value={form.age}
                  onChangeText={value => updateForm('age', value)}
                  placeholder="Возраст"
                  keyboardType="numeric"
                  placeholderTextColor={colors.ink4}
                  maxLength={3}
                />
                <TextInput
                  style={[styles.input, styles.colInput]}
                  value={form.weight}
                  onChangeText={value => updateForm('weight', value)}
                  placeholder="Вес"
                  keyboardType="numeric"
                  placeholderTextColor={colors.ink4}
                  maxLength={3}
                />
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.goal}
                onChangeText={value => updateForm('goal', value)}
                placeholder="Цель"
                placeholderTextColor={colors.ink4}
                multiline
              />
              <TextInput
                style={styles.input}
                value={form.nextSession}
                onChangeText={value => updateForm('nextSession', value)}
                placeholder="Следующая запись"
                placeholderTextColor={colors.ink4}
              />

              {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}

              <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={submitClient} disabled={saving} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>{saving ? 'Сохраняем...' : 'Сохранить клиента'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  headerBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  total: { fontSize: 20, fontWeight: '800', color: colors.ink3 },
  search: { backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark, marginBottom: spacing.sm },
  filtersContent: { gap: 8, paddingBottom: spacing.md },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperCard },
  filterActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  filterText: { fontSize: 13, color: colors.ink2 },
  filterActiveText: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.line, gap: spacing.md },
  clientCardWarn: { borderColor: '#f4c5c0', backgroundColor: '#fdf5f4' },
  clientBody: { flex: 1, gap: 2 },
  clientRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  clientName: { fontSize: 14, fontWeight: '700', color: colors.dark, flex: 1 },
  clientPackage: { fontSize: 12, fontWeight: '700', color: colors.ink3 },
  clientStatus: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  clientWarn: { color: colors.danger },
  clientMeta: { fontSize: 11, color: colors.ink4, marginTop: 2 },
  more: { fontSize: 20, color: colors.ink3 },
  addBtn: { borderRadius: radius.lg, backgroundColor: colors.dark, padding: spacing.md, alignItems: 'center', marginTop: 4 },
  addBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  emptyCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.xl, alignItems: 'center', marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.ink3 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(14,14,12,0.35)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '88%', backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.dark },
  closeText: { fontSize: 28, color: colors.ink3, lineHeight: 30 },
  input: { backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark, marginBottom: spacing.sm },
  fieldLabel: { fontSize: 12, color: colors.ink3, fontWeight: '700', marginBottom: 7, marginTop: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line2, backgroundColor: colors.paperCard },
  statusChipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  statusChipText: { fontSize: 12, color: colors.ink2, fontWeight: '600' },
  statusChipTextActive: { color: '#fff' },
  twoCols: { flexDirection: 'row', gap: 8 },
  colInput: { flex: 1 },
  textArea: { minHeight: 74, textAlignVertical: 'top' },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  shortNameHint: { color: colors.ink3, fontSize: 12, marginTop: -2, marginBottom: spacing.sm },
  saveBtn: { borderRadius: radius.lg, backgroundColor: colors.dark, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  disabledBtn: { opacity: 0.55 },
});
