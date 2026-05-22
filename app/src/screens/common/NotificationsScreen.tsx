import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../theme';
import { useApp } from '../../state/AppContext';
import type { Notification, NotificationKind } from '../../api/types';

const KIND_ICON: Record<NotificationKind, React.ComponentProps<typeof Ionicons>['name']> = {
  booking: 'calendar-outline',
  payment: 'card-outline',
  system: 'settings-outline',
  chat: 'chatbubble-outline',
  recommendation: 'bulb-outline',
};

const KIND_COLOR: Record<NotificationKind, string> = {
  booking: '#3a7a4a',
  payment: '#2563eb',
  system: colors.ink3,
  chat: '#7c3aed',
  recommendation: '#d97706',
};

function NotifRow({ item, onRead }: { item: Notification; onRead: (id: string) => void }) {
  const isUnread = item.readAt === null;
  return (
    <TouchableOpacity
      style={[styles.row, isUnread && styles.rowUnread]}
      onPress={() => onRead(item.id)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: KIND_COLOR[item.kind] + '18' }]}>
        <Ionicons name={KIND_ICON[item.kind]} size={20} color={KIND_COLOR[item.kind]} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]}>{item.title}</Text>
          {isUnread && <View style={styles.dot} />}
        </View>
        <Text style={styles.rowBody2} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.rowTime}>
          {new Date(item.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { data, markNotificationRead } = useApp();
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  const notifications = (data?.notifications ?? []).map(n =>
    localRead.has(n.id) ? { ...n, readAt: Date.now() } : n
  );

  const handleRead = (id: string) => {
    setLocalRead(prev => new Set([...prev, id]));
    markNotificationRead?.(id);
  };

  const handleReadAll = () => {
    const ids = notifications.filter(n => n.readAt === null).map(n => n.id);
    setLocalRead(prev => new Set([...prev, ...ids]));
    ids.forEach(id => markNotificationRead?.(id));
  };

  const unreadCount = notifications.filter(n => n.readAt === null).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Уведомления</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleReadAll} activeOpacity={0.75}>
            <Text style={styles.readAllBtn}>Все прочитаны</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.ink4} />
            <Text style={styles.emptyTitle}>Нет уведомлений</Text>
            <Text style={styles.emptySub}>Здесь появятся важные события по клубу.</Text>
          </View>
        )}
        renderItem={({ item }) => <NotifRow item={item} onRead={handleRead} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  backBtn: { padding: 4, marginRight: 4 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.dark, letterSpacing: 0 },
  readAllBtn: { fontSize: 13, color: colors.ink3, fontWeight: '500' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 32, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.line },
  rowUnread: { borderColor: colors.accent + '60', backgroundColor: colors.accent + '08' },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 14, fontWeight: '500', color: colors.ink2, flex: 1 },
  rowTitleUnread: { fontWeight: '700', color: colors.dark },
  rowBody2: { fontSize: 13, color: colors.ink3, lineHeight: 18 },
  rowTime: { fontSize: 11, color: colors.ink4, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, flexShrink: 0 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.ink2 },
  emptySub: { fontSize: 13, color: colors.ink3, textAlign: 'center', maxWidth: 240 },
});
