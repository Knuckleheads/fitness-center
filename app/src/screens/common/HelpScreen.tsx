import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../theme';

type FaqItem = { q: string; a: string };

const FAQ: FaqItem[] = [
  { q: 'Как забронировать занятие?', a: 'Перейдите на вкладку «Расписание», выберите нужное занятие и нажмите «Записаться». Вы получите уведомление с подтверждением.' },
  { q: 'Как заморозить абонемент?', a: 'Откройте раздел «Профиль» → «Мой абонемент» → «Заморозить». Заморозка доступна не более 2 раз в год. Во время заморозки срок абонемента не расходуется.' },
  { q: 'Что делать, если QR-код не сканируется?', a: 'Убедитесь, что экран настроен на максимальную яркость. Если проблема сохраняется — сообщите на ресепшн, и сотрудник сделает отметку вручную.' },
  { q: 'Как отслеживать прогресс?', a: 'В разделе «Прогресс» добавляйте замеры тела и силовые результаты. Данные отображаются в виде графиков и тепловой карты посещаемости.' },
  { q: 'Как обновить абонемент?', a: 'Перейдите в «Профиль» → «Продлить абонемент». Выберите тариф и подтвердите. Оплата производится на ресепшн или через кассу.' },
  { q: 'Как связаться с тренером?', a: 'В разделе «Тренеры» выберите своего тренера и нажмите «Написать». Сообщение поступит ему в приложение.' },
  { q: 'Мои данные в безопасности?', a: 'Все данные хранятся локально на устройстве и синхронизируются с сервером клуба в зашифрованном виде. Ваши персональные данные не передаются третьим лицам.' },
  { q: 'Как включить тёмную тему?', a: 'Тёмная тема пока недоступна. Приложение использует системные настройки яркости для комфортного отображения.' },
  { q: 'Техническая поддержка', a: 'Если у вас возникли проблемы с приложением — обратитесь на ресепшн клуба или отправьте сообщение через раздел «Чат» своему тренеру.' },
];

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.faqRow} onPress={() => setOpen(v => !v)} activeOpacity={0.75}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.ink3} />
      </View>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Помощь и FAQ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Ionicons name="help-circle-outline" size={40} color={colors.accent} />
          <Text style={styles.heroText}>Ответы на частые вопросы</Text>
        </View>

        <View style={styles.card}>
          {FAQ.map((item, idx) => (
            <React.Fragment key={idx}>
              <FaqRow item={item} />
              {idx < FAQ.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.footer}>Версия приложения: 1.0.0 · Фитнес-клуб</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  backBtn: { padding: 4, marginRight: 4 },
  title: { fontSize: 20, fontWeight: '700', color: colors.dark, letterSpacing: 0 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  heroText: { fontSize: 15, fontWeight: '600', color: colors.ink2 },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginBottom: spacing.xl },
  faqRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.dark, lineHeight: 20 },
  faqA: { fontSize: 13, color: colors.ink2, lineHeight: 20, marginTop: spacing.sm },
  divider: { height: 1, backgroundColor: colors.line, marginHorizontal: spacing.lg },
  footer: { textAlign: 'center', fontSize: 12, color: colors.ink4, marginTop: spacing.md },
});
