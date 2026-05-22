import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
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
import { colors, radius, spacing } from '../../theme';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';
import { TrainerInput } from '../../api/types';

const SETTINGS = ['Редактировать профиль', 'Уведомления', 'Поддержка', 'Ставка'];

function toDraft(trainer?: TrainerInput | null): TrainerInput {
  return trainer ? { ...trainer } : {
    name: '',
    initials: '',
    spec: '',
    rate: '',
    rating: '',
    clients: 0,
  };
}

export default function TrainerProfileScreen() {
  const { data, loading, error, reload, saveTrainer } = useApp();
  const navigation = useNavigation<any>();
  const trainer = data?.trainers[0] ?? null;
  const classes = data?.classes ?? [];
  const [editorVisible, setEditorVisible] = useState(false);
  const [draft, setDraft] = useState<TrainerInput | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trainer) {
      setDraft(toDraft(trainer));
    }
  }, [trainer]);

  const weekCount = classes.filter(item => item.trainer === trainer?.name || item.trainer.includes(trainer?.name.split(' ')[0] ?? '')).length;
  const rate = Number(trainer?.rate.replace(/\D/g, '') || 0);
  const earnings = rate * Math.max(weekCount, 1);

  const openEditor = () => {
    setDraft(toDraft(trainer));
    setEditorVisible(true);
  };

  const saveProfile = async () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.initials.trim() || !draft.spec.trim()) {
      Alert.alert('Профиль', 'Заполните имя, инициалы и специализацию.');
      return;
    }
    setSaving(true);
    try {
      await saveTrainer({
        ...draft,
        name: draft.name.trim(),
        initials: draft.initials.trim(),
        spec: draft.spec.trim(),
        rate: draft.rate.trim(),
        rating: draft.rating.trim(),
        clients: Number.isFinite(Number(draft.clients)) ? Number(draft.clients) : 0,
        id: trainer?.id,
      });
      setEditorVisible(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить профиль';
      Alert.alert('Профиль', message);
    } finally {
      setSaving(false);
    }
  };

  const callSupport = async () => {
    try {
      await Linking.openURL('mailto:support@fitnessapp.local');
    } catch {
      Alert.alert('Поддержка', 'Не удалось открыть почтовое приложение.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Загружаем профиль</Text>
          <Text style={styles.centerText}>Подтягиваем данные тренера из локальной базы.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Не удалось открыть профиль</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Button title="Повторить" onPress={reload} style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar initials={trainer?.initials ?? 'ТР'} size="lg" variant="dark" />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{trainer?.name ?? 'Тренер'}</Text>
            <Text style={styles.spec}>{trainer?.spec ?? 'Специализация не указана'}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>{trainer?.rating ?? '0'} · {classes.length} тренировок в базе</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { val: String(trainer?.clients ?? 0), label: 'клиентов' },
            { val: String(weekCount), label: 'занятий/нед' },
            { val: trainer?.rating ?? '0', label: 'рейтинг' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>К ВЫПЛАТЕ · РАСЧЕТ ПО БАЗЕ</Text>
          <Text style={styles.earningsVal}>{earnings.toLocaleString('ru-RU')} ₽</Text>
          <Text style={styles.earningsSub}>{trainer?.rate ?? 'ставка не задана'} · {weekCount} занятий</Text>
        </View>

        <Text style={styles.sectionTitle}>СПЕЦИАЛИЗАЦИИ</Text>
        <View style={styles.tagsRow}>
          {(trainer?.spec.split(' · ') ?? []).map(t => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>НАСТРОЙКИ</Text>
        <View style={styles.settingsCard}>
          {SETTINGS.map((item, i) => (
            <TouchableOpacity
              key={item}
              style={[styles.settingRow, i < SETTINGS.length - 1 && styles.settingBorder]}
              activeOpacity={0.7}
              onPress={() => {
                if (item === 'Редактировать профиль' || item === 'Ставка') {
                  openEditor();
                  return;
                }
                if (item === 'Уведомления') {
                  navigation.navigate('Notifications');
                  return;
                }
                if (item === 'Поддержка') {
                  navigation.navigate('Help');
                  return;
                }
              }}
            >
              <Text style={styles.settingLabel}>{item}</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Выйти из аккаунта" variant="ghost" onPress={() => Alert.alert('Выход', 'Выйти из аккаунта?')} style={{ marginTop: spacing.lg }} />
        <Button title="Настройки" variant="outline" onPress={() => navigation.navigate('TrainerSettings')} style={{ marginTop: spacing.sm }} />
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditorVisible(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Профиль тренера</Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)} style={styles.closeBtn} activeOpacity={0.75}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Имя</Text>
            <TextInput
              style={styles.input}
              value={draft?.name ?? ''}
              onChangeText={text => setDraft(prev => prev ? { ...prev, name: text } : prev)}
              placeholder="Имя тренера"
              placeholderTextColor={colors.ink4}
            />

            <Text style={styles.fieldLabel}>Инициалы</Text>
            <TextInput
              style={styles.input}
              value={draft?.initials ?? ''}
              onChangeText={text => setDraft(prev => prev ? { ...prev, initials: text } : prev)}
              placeholder="ТР"
              placeholderTextColor={colors.ink4}
            />

            <Text style={styles.fieldLabel}>Специализация</Text>
            <TextInput
              style={styles.input}
              value={draft?.spec ?? ''}
              onChangeText={text => setDraft(prev => prev ? { ...prev, spec: text } : prev)}
              placeholder="Functional · КМС"
              placeholderTextColor={colors.ink4}
            />

            <View style={styles.row2}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Ставка</Text>
                <TextInput
                  style={styles.input}
                  value={draft?.rate ?? ''}
                  onChangeText={text => setDraft(prev => prev ? { ...prev, rate: text } : prev)}
                  placeholder="3 200 ₽/ч"
                  placeholderTextColor={colors.ink4}
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Рейтинг</Text>
                <TextInput
                  style={styles.input}
                  value={draft?.rating ?? ''}
                  onChangeText={text => setDraft(prev => prev ? { ...prev, rating: text } : prev)}
                  placeholder="4.9"
                  placeholderTextColor={colors.ink4}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Клиенты</Text>
            <TextInput
              style={styles.input}
              value={String(draft?.clients ?? 0)}
              onChangeText={text => setDraft(prev => prev ? { ...prev, clients: Number(text.replace(/\D/g, '')) || 0 } : prev)}
              placeholder="24"
              keyboardType="number-pad"
              placeholderTextColor={colors.ink4}
            />

            <View style={styles.modalActions}>
              <Button title="Сохранить" onPress={saveProfile} loading={saving} disabled={saving} />
              <Button title="Закрыть" variant="ghost" onPress={() => setEditorVisible(false)} disabled={saving} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg, gap: spacing.md },
  name: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  spec: { fontSize: 13, color: colors.ink3, marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  star: { fontSize: 14, color: colors.accent },
  rating: { fontSize: 13, color: colors.ink2, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  statVal: { fontSize: 22, fontWeight: '800', color: colors.dark },
  statLabel: { fontSize: 10, color: colors.ink3, marginTop: 3, textAlign: 'center', letterSpacing: 0.2 },
  earningsCard: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  earningsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, marginBottom: 6 },
  earningsVal: { fontSize: 30, fontWeight: '800', color: colors.accent, marginBottom: 4, letterSpacing: 0 },
  earningsSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.ink3, marginBottom: 10, marginTop: spacing.md, letterSpacing: 0.8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  tag: { backgroundColor: colors.paperCard, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.line },
  tagText: { fontSize: 13, color: colors.dark, fontWeight: '500' },
  settingsCard: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: spacing.md },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  settingLabel: { fontSize: 15, color: colors.dark },
  settingArrow: { fontSize: 20, color: colors.ink3 },
  centerState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  centerTitle: { fontSize: 17, fontWeight: '800', color: colors.dark, textAlign: 'center' },
  centerText: { fontSize: 13, color: colors.ink3, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  modalSafe: { flex: 1, backgroundColor: colors.paper },
  modalScroll: { paddingHorizontal: spacing.lg, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.lg, marginBottom: spacing.md },
  modalTitle: { fontSize: 24, fontWeight: '800', color: colors.dark },
  closeBtn: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 26, color: colors.dark, lineHeight: 26 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.ink3, marginBottom: 6, marginTop: spacing.sm, letterSpacing: 0.4 },
  input: { backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark },
  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  modalActions: { gap: 10, marginTop: spacing.lg },
});
