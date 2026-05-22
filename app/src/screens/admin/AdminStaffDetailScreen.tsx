import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { colors, radius, spacing } from '../../theme';
import { useApp } from '../../state/AppContext';
import { AdminStackParamList } from '../../navigation/types';
import { Hall, Trainer } from '../../api/types';

type Props = StackScreenProps<AdminStackParamList, 'AdminStaffDetail'>;

const emptyTrainer = {
  name: '',
  initials: '',
  spec: '',
  rate: '',
  rating: '5.0',
  clients: '0',
};

const emptyHall = {
  name: '',
  area: '',
  capacity: '0',
  loadPct: '0',
  open: true,
};

export default function AdminStaffDetailScreen({ route, navigation }: Props) {
  const { data, saveTrainer, addHall } = useApp();
  const isTrainer = route.params.kind === 'trainer';
  const trainer = isTrainer ? data?.trainers.find(item => item.id === route.params.id) : null;
  const hall = !isTrainer ? data?.halls.find(item => item.id === route.params.id) : null;
  const [saving, setSaving] = useState(false);
  const [trainerForm, setTrainerForm] = useState(emptyTrainer);
  const [hallForm, setHallForm] = useState(emptyHall);

  useEffect(() => {
    if (trainer) {
      setTrainerForm({
        name: trainer.name,
        initials: trainer.initials,
        spec: trainer.spec,
        rate: trainer.rate,
        rating: trainer.rating,
        clients: String(trainer.clients),
      });
    }
  }, [trainer]);

  useEffect(() => {
    if (hall) {
      setHallForm({
        name: hall.name,
        area: hall.area,
        capacity: String(hall.capacity),
        loadPct: String(hall.loadPct),
        open: hall.open,
      });
    }
  }, [hall]);

  if (isTrainer && !trainer) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Тренер не найден</Text>
          <Button title="Назад" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isTrainer && !hall) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Зал не найден</Text>
          <Button title="Назад" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const updateTrainer = <K extends keyof typeof trainerForm>(key: K, value: (typeof trainerForm)[K]) => {
    setTrainerForm(prev => ({ ...prev, [key]: value }));
  };

  const updateHall = <K extends keyof typeof hallForm>(key: K, value: (typeof hallForm)[K]) => {
    setHallForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveTrainer = async () => {
    if (!trainer) return;
    const name = trainerForm.name.trim();
    if (!name) {
      Alert.alert('Тренер', 'Укажите имя тренера.');
      return;
    }

    setSaving(true);
    try {
      await saveTrainer({
        id: trainer.id,
        name,
        initials: (trainerForm.initials.trim() || trainer.initials).slice(0, 3),
        spec: trainerForm.spec.trim() || trainer.spec,
        rate: trainerForm.rate.trim() || trainer.rate,
        rating: trainerForm.rating.trim() || trainer.rating,
        clients: Number(trainerForm.clients) || trainer.clients,
      });
      Alert.alert('Тренер сохранён', `${name} обновлён в базе.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Тренер', error instanceof Error ? error.message : 'Не удалось сохранить тренера.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHall = async () => {
    if (!hall) return;
    const name = hallForm.name.trim();
    if (!name) {
      Alert.alert('Зал', 'Укажите название помещения.');
      return;
    }

    setSaving(true);
    try {
      await addHall({
        id: hall.id,
        name,
        area: hallForm.area.trim() || hall.area,
        capacity: Number(hallForm.capacity) || hall.capacity,
        loadPct: Math.max(0, Math.min(100, Number(hallForm.loadPct) || 0)),
        open: hallForm.open,
      });
      Alert.alert('Зал сохранён', `${name} обновлён в базе.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Зал', error instanceof Error ? error.message : 'Не удалось сохранить зал.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} activeOpacity={0.7}>
          <Text style={styles.backText}>← Команда</Text>
        </TouchableOpacity>

        {isTrainer ? (
          <>
            <View style={styles.header}>
              <Avatar initials={trainer?.initials ?? 'ТР'} size="lg" variant="dark" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{trainer?.name}</Text>
                <Text style={styles.meta}>{trainer?.spec}</Text>
                <Text style={styles.metaSecondary}>{trainer?.clients} клиентов · {trainer?.rate}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Карточка тренера</Text>
              <TextInput style={styles.input} value={trainerForm.name} onChangeText={value => updateTrainer('name', value.replace(/[0-9]/g, ''))} placeholder="ФИО" placeholderTextColor={colors.ink4} />
              <TextInput style={styles.input} value={trainerForm.initials} onChangeText={value => updateTrainer('initials', value.toUpperCase())} placeholder="Инициалы" placeholderTextColor={colors.ink4} maxLength={3} />
              <TextInput style={styles.input} value={trainerForm.spec} onChangeText={value => updateTrainer('spec', value)} placeholder="Специализация" placeholderTextColor={colors.ink4} />
              <View style={styles.twoCols}>
                <TextInput style={[styles.input, styles.col]} value={trainerForm.rate} onChangeText={value => updateTrainer('rate', value)} placeholder="Ставка" placeholderTextColor={colors.ink4} />
                <TextInput style={[styles.input, styles.col]} value={trainerForm.rating} onChangeText={value => updateTrainer('rating', value)} placeholder="Рейтинг" placeholderTextColor={colors.ink4} keyboardType="decimal-pad" />
              </View>
              <TextInput style={styles.input} value={trainerForm.clients} onChangeText={value => updateTrainer('clients', value)} placeholder="Клиентов" placeholderTextColor={colors.ink4} keyboardType="numeric" />
            </View>

            <Button title={saving ? 'Сохраняем...' : 'Сохранить тренера'} onPress={handleSaveTrainer} disabled={saving} />
          </>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.hallAvatar}>
                <Text style={styles.hallAvatarText}>{hall?.open ? 'О' : 'З'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{hall?.name}</Text>
                <Text style={styles.meta}>{hall?.area} · до {hall?.capacity} чел.</Text>
                <Text style={styles.metaSecondary}>Загрузка {hall?.loadPct}%</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Параметры зала</Text>
              <TextInput style={styles.input} value={hallForm.name} onChangeText={value => updateHall('name', value)} placeholder="Название" placeholderTextColor={colors.ink4} />
              <TextInput style={styles.input} value={hallForm.area} onChangeText={value => updateHall('area', value)} placeholder="Площадь" placeholderTextColor={colors.ink4} />
              <View style={styles.twoCols}>
                <TextInput style={[styles.input, styles.col]} value={hallForm.capacity} onChangeText={value => updateHall('capacity', value)} placeholder="Вместимость" placeholderTextColor={colors.ink4} keyboardType="numeric" />
                <TextInput style={[styles.input, styles.col]} value={hallForm.loadPct} onChangeText={value => updateHall('loadPct', value)} placeholder="Загрузка %" placeholderTextColor={colors.ink4} keyboardType="numeric" />
              </View>
              <TouchableOpacity style={styles.toggleRow} onPress={() => updateHall('open', !hallForm.open)} activeOpacity={0.75}>
                <Text style={styles.toggleLabel}>Открыт для занятий</Text>
                <View style={[styles.toggle, hallForm.open && styles.toggleActive]}>
                  <View style={[styles.toggleDot, hallForm.open && styles.toggleDotActive]} />
                </View>
              </TouchableOpacity>
            </View>

            <Button title={saving ? 'Сохраняем...' : 'Сохранить зал'} onPress={handleSaveHall} disabled={saving} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  back: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  backText: { fontSize: 14, color: colors.ink3, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, paddingTop: spacing.sm },
  name: { fontSize: 22, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  meta: { fontSize: 13, color: colors.ink3, marginTop: 4 },
  metaSecondary: { fontSize: 12, color: colors.ink2, marginTop: 3, fontWeight: '600' },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700', marginBottom: 10 },
  input: { backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark, marginBottom: spacing.sm },
  twoCols: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.dark, marginBottom: spacing.md },
  hallAvatar: { width: 64, height: 64, borderRadius: radius.xl, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  hallAvatarText: { fontSize: 28, fontWeight: '800', color: colors.ink3 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 4 },
  toggleLabel: { fontSize: 14, color: colors.dark, fontWeight: '600' },
  toggle: { width: 44, height: 26, borderRadius: radius.full, backgroundColor: colors.line2, padding: 3 },
  toggleActive: { backgroundColor: colors.accent },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.paperCard },
  toggleDotActive: { marginLeft: 18, backgroundColor: colors.dark },
});
