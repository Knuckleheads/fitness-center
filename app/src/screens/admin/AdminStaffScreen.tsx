import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import { AdminShift, Hall, Trainer } from '../../api/types';
import { colors, radius, spacing } from '../../theme';

const TABS = ['Тренеры', 'Залы', 'Смены'];

type TrainerForm = {
  id?: string;
  name: string;
  initials: string;
  spec: string;
  rate: string;
  rating: string;
  clients: string;
};

type HallForm = {
  id?: string;
  name: string;
  area: string;
  capacity: string;
  open: boolean;
  loadPct: string;
};

type ShiftForm = {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  staffId: string;
  staffName: string;
  role: AdminShift['role'];
  station: string;
  status: AdminShift['status'];
  payout: string;
  notes: string;
};

const emptyTrainer: TrainerForm = {
  name: '',
  initials: '',
  spec: '',
  rate: '',
  rating: '5.0',
  clients: '0',
};

const emptyHall: HallForm = {
  name: '',
  area: '',
  capacity: '',
  open: true,
  loadPct: '0',
};

const emptyShift: ShiftForm = {
  date: new Date().toISOString().slice(0, 10),
  startTime: '09:00',
  endTime: '17:00',
  staffId: '',
  staffName: '',
  role: 'trainer',
  station: '',
  status: 'planned',
  payout: '0',
  notes: '',
};

const ROLE_OPTIONS: { label: string; value: AdminShift['role'] }[] = [
  { label: 'Тренер', value: 'trainer' },
  { label: 'Ресепшен', value: 'reception' },
  { label: 'Админ', value: 'admin' },
];

const SHIFT_STATUS: { label: string; value: AdminShift['status'] }[] = [
  { label: 'План', value: 'planned' },
  { label: 'Выполнено', value: 'done' },
  { label: 'Опоздание', value: 'late' },
  { label: 'Отмена', value: 'cancelled' },
];

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

function formFromTrainer(trainer: Trainer): TrainerForm {
  return {
    id: trainer.id,
    name: trainer.name,
    initials: trainer.initials,
    spec: trainer.spec,
    rate: trainer.rate,
    rating: trainer.rating,
    clients: String(trainer.clients),
  };
}

function formFromHall(hall: Hall): HallForm {
  return {
    id: hall.id,
    name: hall.name,
    area: hall.area,
    capacity: String(hall.capacity),
    open: hall.open,
    loadPct: String(hall.loadPct),
  };
}

function formFromShift(shift: AdminShift): ShiftForm {
  return {
    id: shift.id,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    staffId: shift.staffId,
    staffName: shift.staffName,
    role: shift.role,
    station: shift.station,
    status: shift.status,
    payout: String(shift.payout),
    notes: shift.notes,
  };
}

export default function AdminStaffScreen() {
  const { data, saveTrainer, addHall, saveShift } = useApp();
  const navigation = useNavigation<any>();
  const trainers = data?.trainers ?? [];
  const halls = data?.halls ?? [];
  const shifts = data?.shifts ?? [];
  const [tab, setTab] = useState(0);
  const [trainerModal, setTrainerModal] = useState(false);
  const [hallModal, setHallModal] = useState(false);
  const [shiftModal, setShiftModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [trainerForm, setTrainerForm] = useState<TrainerForm>(emptyTrainer);
  const [hallForm, setHallForm] = useState<HallForm>(emptyHall);
  const [shiftForm, setShiftForm] = useState<ShiftForm>(emptyShift);
  const initialsManual = useRef(false);

  const payout = useMemo(
    () => shifts.reduce((sum, item) => sum + (item.status === 'cancelled' ? 0 : item.payout), 0),
    [shifts],
  );
  const doneShifts = shifts.filter(item => item.status === 'done').length;
  const plannedShifts = shifts.filter(item => item.status === 'planned').length;

  const updateTrainer = <K extends keyof TrainerForm>(key: K, value: TrainerForm[K]) => {
    setTrainerForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !initialsManual.current) {
        next.initials = buildInitials(String(value));
      }
      if (key === 'initials') {
        initialsManual.current = true;
      }
      return next;
    });
  };

  const updateHall = <K extends keyof HallForm>(key: K, value: HallForm[K]) => {
    setHallForm(prev => ({ ...prev, [key]: value }));
  };

  const updateShift = <K extends keyof ShiftForm>(key: K, value: ShiftForm[K]) => {
    setShiftForm(prev => ({ ...prev, [key]: value }));
  };

  const openTrainer = (trainer?: Trainer) => {
    initialsManual.current = !!trainer;
    setErrorText('');
    setTrainerForm(trainer ? formFromTrainer(trainer) : emptyTrainer);
    setTrainerModal(true);
  };

  const openHall = (hall?: Hall) => {
    setErrorText('');
    setHallForm(hall ? formFromHall(hall) : emptyHall);
    setHallModal(true);
  };

  const openShift = (shift?: AdminShift) => {
    setErrorText('');
    setShiftForm(shift ? formFromShift(shift) : emptyShift);
    setShiftModal(true);
  };

  const submitTrainer = async () => {
    const name = trainerForm.name.trim();
    const initials = (trainerForm.initials.trim() || buildInitials(name)).slice(0, 3);
    if (!name || !initials) {
      setErrorText('Укажите имя тренера.');
      return;
    }

    try {
      setSaving(true);
      setErrorText('');
      await saveTrainer({
        id: trainerForm.id,
        name,
        initials,
        spec: trainerForm.spec.trim() || 'специализация не указана',
        rate: trainerForm.rate.trim() || '0 ₽/ч',
        rating: trainerForm.rating.trim() || '5.0',
        clients: Number(trainerForm.clients) || 0,
      });
      setTrainerModal(false);
      Alert.alert('Тренер сохранен', `${name} обновлен в базе.`);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Не удалось сохранить тренера.');
    } finally {
      setSaving(false);
    }
  };

  const submitHall = async () => {
    const name = hallForm.name.trim();
    if (!name) {
      setErrorText('Укажите название зала.');
      return;
    }

    try {
      setSaving(true);
      setErrorText('');
      await addHall({
        id: hallForm.id,
        name,
        area: hallForm.area.trim() || '-',
        capacity: Number(hallForm.capacity) || 0,
        open: hallForm.open,
        loadPct: Math.max(0, Math.min(100, Number(hallForm.loadPct) || 0)),
      });
      setHallModal(false);
      Alert.alert('Зал сохранен', `${name} обновлен в базе.`);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Не удалось сохранить зал.');
    } finally {
      setSaving(false);
    }
  };

  const submitShift = async () => {
    if (!shiftForm.date || !shiftForm.startTime || !shiftForm.endTime || !shiftForm.staffName.trim()) {
      setErrorText('Заполните дату, время и имя сотрудника.');
      return;
    }

    try {
      setSaving(true);
      setErrorText('');
      await saveShift({
        id: shiftForm.id,
        date: shiftForm.date,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        staffId: shiftForm.staffId.trim() || `staff-${shiftForm.staffName.trim().toLowerCase().replace(/\s+/g, '-')}`,
        staffName: shiftForm.staffName.trim(),
        role: shiftForm.role,
        station: shiftForm.station.trim() || 'Ресепшен',
        status: shiftForm.status,
        payout: Number(shiftForm.payout) || 0,
        notes: shiftForm.notes.trim(),
      });
      setShiftModal(false);
      Alert.alert('Смена сохранена', 'Изменения записаны в локальную базу.');
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Не удалось сохранить смену.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Команда</Text>

        <View style={styles.seg}>
          {TABS.map((label, index) => (
            <TouchableOpacity key={label} style={[styles.segBtn, index === tab && styles.segActive]} onPress={() => setTab(index)} activeOpacity={0.75}>
              <Text style={[styles.segText, index === tab && styles.segActiveText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 0 && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => openTrainer()} activeOpacity={0.75}>
              <Text style={styles.addBtnText}>+ Добавить тренера</Text>
            </TouchableOpacity>

            {trainers.map(trainer => (
              <TouchableOpacity key={trainer.id} style={styles.trainerCard} activeOpacity={0.8} onPress={() => navigation.navigate('AdminStaffDetail', { kind: 'trainer', id: trainer.id })}>
                <Avatar initials={trainer.initials} size="md" variant="dark" />
                <View style={styles.trainerBody}>
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  <Text style={styles.trainerSpec}>{trainer.spec}</Text>
                  <Text style={styles.trainerClients}>{trainer.clients} клиентов · {trainer.rate}</Text>
                </View>
                <View style={styles.rightCol}>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingStar}>★</Text>
                    <Text style={styles.ratingVal}>{trainer.rating}</Text>
                  </View>
                  <Text style={styles.editText}>ред.</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.payoutCard}>
              <View>
                <Text style={styles.payoutLabel}>Payroll по сменам</Text>
                <Text style={styles.payoutVal}>{payout.toLocaleString('ru-RU')} ₽</Text>
                <Text style={styles.payoutMeta}>{doneShifts} закрыто · {plannedShifts} в плане</Text>
              </View>
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => {
                  const body = shifts
                    .map(item => `${item.staffName}: ${item.date} ${item.startTime}-${item.endTime} · ${item.payout.toLocaleString('ru-RU')} ₽`)
                    .join('\n');
                  Alert.alert('Расчет выплат', body || 'Смен пока нет');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.payBtnText}>Открыть</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {tab === 1 && (
          <>
            {halls.map(hall => (
              <TouchableOpacity key={hall.id} style={styles.hallCard} activeOpacity={0.8} onPress={() => navigation.navigate('AdminStaffDetail', { kind: 'hall', id: hall.id })}>
                <View style={styles.trainerBody}>
                  <Text style={styles.hallName}>{hall.name}</Text>
                  <Text style={styles.hallMeta}>{hall.area} · до {hall.capacity} чел. · загрузка {hall.loadPct}%</Text>
                </View>
                <View style={[styles.hallStatus, !hall.open && styles.hallStatusWarn]}>
                  <Text style={[styles.hallStatusText, !hall.open && styles.hallStatusWarnText]}>
                    {hall.open ? 'открыт' : 'тех. работы'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={() => openHall()} activeOpacity={0.75}>
              <Text style={styles.addBtnText}>+ Добавить помещение</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 2 && (
          <>
            <View style={styles.summaryRow}>
              {[
                { label: 'Смены', value: String(shifts.length) },
                { label: 'Закрыто', value: String(doneShifts) },
                { label: 'Payroll', value: `${payout.toLocaleString('ru-RU')} ₽` },
              ].map(item => (
                <View key={item.label} style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={styles.summaryValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => openShift()} activeOpacity={0.75}>
              <Text style={styles.addBtnText}>+ Добавить смену</Text>
            </TouchableOpacity>

            {shifts.map(shift => (
              <TouchableOpacity key={shift.id} style={styles.shiftCard} activeOpacity={0.8} onPress={() => openShift(shift)}>
                <View style={styles.trainerBody}>
                  <View style={styles.shiftTopRow}>
                    <Text style={styles.shiftName}>{shift.staffName}</Text>
                    <Text style={[styles.shiftTag, shift.status === 'done' && styles.shiftTagDone, shift.status === 'cancelled' && styles.shiftTagCancel]}>
                      {shift.status}
                    </Text>
                  </View>
                  <Text style={styles.shiftMeta}>{shift.date} · {shift.startTime}–{shift.endTime} · {shift.station}</Text>
                  <Text style={styles.shiftMeta}>{shift.role} · {shift.notes || 'без комментария'}</Text>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.shiftPayout}>{shift.payout.toLocaleString('ru-RU')} ₽</Text>
                  <Text style={styles.editText}>ред.</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={trainerModal} animationType="slide" transparent onRequestClose={() => !saving && setTrainerModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{trainerForm.id ? 'Редактировать тренера' : 'Новый тренер'}</Text>
              <TouchableOpacity onPress={() => !saving && setTrainerModal(false)} activeOpacity={0.7}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={trainerForm.name} onChangeText={value => updateTrainer('name', value.replace(/[0-9]/g, ''))} placeholder="ФИО" placeholderTextColor={colors.ink4} />
            <TextInput style={styles.input} value={trainerForm.initials} onChangeText={value => updateTrainer('initials', value.toUpperCase())} placeholder="Инициалы (авто)" placeholderTextColor={colors.ink4} maxLength={3} />
            <TextInput style={styles.input} value={trainerForm.spec} onChangeText={value => updateTrainer('spec', value)} placeholder="Специализация" placeholderTextColor={colors.ink4} />
            <TextInput style={styles.input} value={trainerForm.rate} onChangeText={value => updateTrainer('rate', value)} placeholder="Ставка, например 3200 ₽/ч" placeholderTextColor={colors.ink4} />
            <View style={styles.twoCols}>
              <TextInput style={[styles.input, styles.colInput]} value={trainerForm.rating} onChangeText={value => updateTrainer('rating', value)} placeholder="Рейтинг" keyboardType="decimal-pad" placeholderTextColor={colors.ink4} maxLength={3} />
              <TextInput style={[styles.input, styles.colInput]} value={trainerForm.clients} onChangeText={value => updateTrainer('clients', value)} placeholder="Клиентов" keyboardType="numeric" placeholderTextColor={colors.ink4} maxLength={3} />
            </View>
            {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
            <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={submitTrainer} disabled={saving} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{saving ? 'Сохраняем...' : 'Сохранить тренера'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={hallModal} animationType="slide" transparent onRequestClose={() => !saving && setHallModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{hallForm.id ? 'Редактировать помещение' : 'Новое помещение'}</Text>
              <TouchableOpacity onPress={() => !saving && setHallModal(false)} activeOpacity={0.7}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={hallForm.name} onChangeText={value => updateHall('name', value)} placeholder="Название" placeholderTextColor={colors.ink4} />
            <TextInput style={styles.input} value={hallForm.area} onChangeText={value => updateHall('area', value)} placeholder="Площадь, например 120 м2" placeholderTextColor={colors.ink4} />
            <View style={styles.twoCols}>
              <TextInput style={[styles.input, styles.colInput]} value={hallForm.capacity} onChangeText={value => updateHall('capacity', value)} placeholder="Вместимость" keyboardType="numeric" placeholderTextColor={colors.ink4} />
              <TextInput style={[styles.input, styles.colInput]} value={hallForm.loadPct} onChangeText={value => updateHall('loadPct', value)} placeholder="Загрузка %" keyboardType="numeric" placeholderTextColor={colors.ink4} />
            </View>
            <TouchableOpacity style={styles.toggleRow} onPress={() => updateHall('open', !hallForm.open)} activeOpacity={0.75}>
              <Text style={styles.toggleLabel}>Открыто для занятий</Text>
              <View style={[styles.toggle, hallForm.open && styles.toggleActive]}>
                <View style={[styles.toggleDot, hallForm.open && styles.toggleDotActive]} />
              </View>
            </TouchableOpacity>
            {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
            <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={submitHall} disabled={saving} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{saving ? 'Сохраняем...' : 'Сохранить помещение'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={shiftModal} animationType="slide" transparent onRequestClose={() => !saving && setShiftModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalTall]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{shiftForm.id ? 'Редактировать смену' : 'Новая смена'}</Text>
              <TouchableOpacity onPress={() => !saving && setShiftModal(false)} activeOpacity={0.7}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={shiftForm.date} onChangeText={value => updateShift('date', value)} placeholder="Дата YYYY-MM-DD" placeholderTextColor={colors.ink4} />
            <View style={styles.twoCols}>
              <TextInput style={[styles.input, styles.colInput]} value={shiftForm.startTime} onChangeText={value => updateShift('startTime', value)} placeholder="Начало" placeholderTextColor={colors.ink4} />
              <TextInput style={[styles.input, styles.colInput]} value={shiftForm.endTime} onChangeText={value => updateShift('endTime', value)} placeholder="Конец" placeholderTextColor={colors.ink4} />
            </View>
            <TextInput style={styles.input} value={shiftForm.staffName} onChangeText={value => updateShift('staffName', value)} placeholder="Сотрудник" placeholderTextColor={colors.ink4} />
            <TextInput style={styles.input} value={shiftForm.staffId} onChangeText={value => updateShift('staffId', value)} placeholder="ID сотрудника" placeholderTextColor={colors.ink4} />
            <Text style={styles.fieldLabel}>Роль</Text>
            <View style={styles.statusRow}>
              {ROLE_OPTIONS.map(option => (
                <TouchableOpacity key={option.value} style={[styles.statusChip, shiftForm.role === option.value && styles.statusChipActive]} onPress={() => updateShift('role', option.value)} activeOpacity={0.75}>
                  <Text style={[styles.statusChipText, shiftForm.role === option.value && styles.statusChipTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} value={shiftForm.station} onChangeText={value => updateShift('station', value)} placeholder="Площадка / пост" placeholderTextColor={colors.ink4} />
            <Text style={styles.fieldLabel}>Статус</Text>
            <View style={styles.statusRow}>
              {SHIFT_STATUS.map(option => (
                <TouchableOpacity key={option.value} style={[styles.statusChip, shiftForm.status === option.value && styles.statusChipActive]} onPress={() => updateShift('status', option.value)} activeOpacity={0.75}>
                  <Text style={[styles.statusChipText, shiftForm.status === option.value && styles.statusChipTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} value={shiftForm.payout} onChangeText={value => updateShift('payout', value)} placeholder="Выплата" keyboardType="numeric" placeholderTextColor={colors.ink4} />
            <TextInput style={[styles.input, styles.textArea]} value={shiftForm.notes} onChangeText={value => updateShift('notes', value)} placeholder="Комментарий" placeholderTextColor={colors.ink4} multiline />
            {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
            <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={submitShift} disabled={saving} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{saving ? 'Сохраняем...' : 'Сохранить смену'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0, paddingTop: spacing.lg, marginBottom: spacing.md },
  seg: { flexDirection: 'row', backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 4, marginBottom: spacing.md },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.md },
  segActive: { backgroundColor: colors.dark },
  segText: { fontSize: 13, color: colors.ink2, fontWeight: '600' },
  segActiveText: { color: '#fff' },
  addBtn: { borderRadius: radius.lg, backgroundColor: colors.dark, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  addBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  trainerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.line, gap: spacing.md },
  trainerBody: { flex: 1, gap: 2 },
  trainerName: { fontSize: 14, fontWeight: '700', color: colors.dark },
  trainerSpec: { fontSize: 12, color: colors.ink3 },
  trainerClients: { fontSize: 12, color: colors.ink3 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  ratingStar: { color: colors.accentInk, fontSize: 12, fontWeight: '800' },
  ratingVal: { color: colors.accentInk, fontSize: 12, fontWeight: '800' },
  editText: { fontSize: 12, color: colors.ink3, fontWeight: '700' },
  payoutCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  payoutLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, fontWeight: '700' },
  payoutVal: { fontSize: 28, fontWeight: '800', color: colors.accent, marginTop: 4 },
  payoutMeta: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  payBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 10 },
  payBtnText: { color: colors.accentInk, fontWeight: '800', fontSize: 13 },
  hallCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.line, gap: spacing.md },
  hallName: { fontSize: 14, fontWeight: '700', color: colors.dark },
  hallMeta: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  hallStatus: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, backgroundColor: '#edf9f0' },
  hallStatusWarn: { backgroundColor: '#fdf5f4' },
  hallStatusText: { fontSize: 12, color: colors.ok, fontWeight: '700' },
  hallStatusWarnText: { color: colors.danger },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.line },
  summaryLabel: { fontSize: 9, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: colors.dark, marginTop: 4 },
  shiftCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.line, gap: spacing.md },
  shiftTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  shiftName: { fontSize: 14, fontWeight: '700', color: colors.dark, flex: 1 },
  shiftMeta: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  shiftTag: { fontSize: 11, fontWeight: '700', color: colors.ink3, backgroundColor: colors.surface3, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  shiftTagDone: { color: colors.ok, backgroundColor: '#edf9f0' },
  shiftTagCancel: { color: colors.danger, backgroundColor: '#fdf5f4' },
  shiftPayout: { fontSize: 14, fontWeight: '800', color: colors.dark },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(14,14,12,0.35)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '88%' },
  modalTall: { maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.dark },
  closeText: { fontSize: 28, color: colors.ink3, lineHeight: 30 },
  input: { backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark, marginBottom: spacing.sm },
  fieldLabel: { fontSize: 12, color: colors.ink3, fontWeight: '700', marginBottom: 7, marginTop: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperCard },
  statusChipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  statusChipText: { fontSize: 12, color: colors.ink2, fontWeight: '600' },
  statusChipTextActive: { color: '#fff' },
  twoCols: { flexDirection: 'row', gap: 8 },
  colInput: { flex: 1 },
  textArea: { minHeight: 74, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, paddingVertical: 4 },
  toggleLabel: { fontSize: 14, color: colors.dark, fontWeight: '600' },
  toggle: { width: 46, height: 28, borderRadius: radius.full, backgroundColor: colors.surface3, padding: 3 },
  toggleActive: { backgroundColor: colors.ok },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  toggleDotActive: { marginLeft: 18 },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  saveBtn: { borderRadius: radius.lg, backgroundColor: colors.dark, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  disabledBtn: { opacity: 0.55 },
});
