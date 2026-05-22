import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { useApp } from '../../state/AppContext';

export default function TrainerChatScreen() {
  const { data, loading, error, reload, sendMessage, trainerChatId, setTrainerChatId } = useApp();
  const insets = useSafeAreaInsets();
  const [openChat, setOpenChat] = useState<string | null>(trainerChatId);
  const [msg, setMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chats = data?.chats ?? [];
  const chat = useMemo(
    () => chats.find(item => item.id === openChat) ?? null,
    [chats, openChat],
  );
  const messages = useMemo(
    () => (data?.messages ?? []).filter(item => item.chatId === openChat),
    [data?.messages, openChat],
  );
  const cleanMsg = msg.trim();
  const sendDisabled = !openChat || cleanMsg.length === 0 || isSending;

  useEffect(() => {
    if (trainerChatId && trainerChatId !== openChat) {
      setOpenChat(trainerChatId);
    }
  }, [trainerChatId, openChat]);

  const send = async () => {
    if (sendDisabled || !openChat) {
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(openChat, cleanMsg);
      setMsg('');
    } catch {
      Alert.alert('Не удалось отправить', 'Проверьте соединение и попробуйте еще раз.');
    } finally {
      setIsSending(false);
    }
  };

  const openThread = (chatId: string) => {
    setTrainerChatId(chatId);
    setOpenChat(chatId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Загружаем чаты</Text>
          <Text style={styles.centerText}>Подтягиваем сообщения из локальной базы.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Не удалось открыть чат</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Button title="Повторить" onPress={reload} style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  if (chat) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={() => {
                setOpenChat(null);
                setTrainerChatId(null);
              }}
              style={styles.backBtn}
              accessibilityLabel="Назад"
            >
              <Ionicons name="arrow-back" size={22} color={colors.dark} />
            </TouchableOpacity>
            <Avatar initials={chat.initials} size="sm" variant="dark" />
            <View style={styles.chatTitleBox}>
              <Text style={styles.chatName}>{chat.name}</Text>
              <Text style={styles.chatStatus}>{chat.unread > 0 ? 'онлайн' : `был(а) в ${chat.time}`}</Text>
            </View>
          </View>
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.messageList, messages.length === 0 && styles.messageListEmpty]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={(
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Пока нет сообщений</Text>
                <Text style={styles.emptyText}>Напишите клиенту, чтобы начать диалог.</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.from === 'trainer' ? styles.bubbleOut : styles.bubbleIn]}>
                <Text style={[styles.bubbleText, item.from === 'trainer' && styles.bubbleTextOut]}>{item.text}</Text>
                <Text style={[styles.bubbleTime, item.from === 'trainer' && styles.bubbleTimeOut]}>{item.time}</Text>
              </View>
            )}
          />
          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <TextInput
              style={styles.msgInput}
              value={msg}
              onChangeText={setMsg}
              placeholder="Сообщение..."
              placeholderTextColor={colors.ink4}
              multiline
              editable={!isSending}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, sendDisabled && styles.sendBtnDisabled]}
              onPress={send}
              activeOpacity={0.85}
              disabled={sendDisabled}
              accessibilityLabel="Отправить сообщение"
            >
              <Ionicons name="arrow-up" size={20} color={sendDisabled ? colors.ink4 : '#fff'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.listHeader}>
        <Text style={styles.title}>Сообщения</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, chats.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={(
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Чатов пока нет</Text>
            <Text style={styles.emptyText}>Когда появятся диалоги с клиентами, они будут здесь.</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatRow} onPress={() => openThread(item.id)} activeOpacity={0.75}>
            <View style={styles.avatarWrap}>
              <Avatar initials={item.initials} size="md" variant="dark" />
              {item.unread > 0 && (
                <View style={styles.unreadDot}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </View>
            <View style={styles.chatRowBody}>
              <Text style={styles.chatRowName}>{item.name}</Text>
              <Text style={styles.chatRowLast} numberOfLines={1}>{item.last}</Text>
            </View>
            <Text style={styles.chatRowTime}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  keyboard: { flex: 1 },
  listHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  listContentEmpty: { flexGrow: 1, justifyContent: 'center' },
  chatRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.line, gap: spacing.md },
  avatarWrap: { position: 'relative' },
  unreadDot: { position: 'absolute', top: -3, right: -3, backgroundColor: colors.accent, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.paper },
  unreadText: { fontSize: 10, color: colors.accentInk, fontWeight: '800' },
  chatRowBody: { flex: 1 },
  chatRowName: { fontSize: 15, fontWeight: '700', color: colors.dark },
  chatRowLast: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  chatRowTime: { fontSize: 11, color: colors.ink4 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.paperCard },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  chatTitleBox: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: '700', color: colors.dark },
  chatStatus: { fontSize: 11, color: colors.ok, marginTop: 1 },
  messageList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: 8 },
  messageListEmpty: { flexGrow: 1, justifyContent: 'center' },
  emptyBox: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.dark, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.ink3, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  bubble: { maxWidth: '78%', borderRadius: radius.xl, padding: spacing.md },
  bubbleIn: { backgroundColor: colors.paperCard, borderWidth: 1, borderColor: colors.line, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleOut: { backgroundColor: colors.dark, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: colors.dark, lineHeight: 21 },
  bubbleTextOut: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: colors.ink4, marginTop: 5, alignSelf: 'flex-end' },
  bubbleTimeOut: { color: 'rgba(255,255,255,0.4)' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: spacing.md, paddingHorizontal: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paperCard },
  msgInput: { flex: 1, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 15, color: colors.dark, maxHeight: 100, backgroundColor: colors.surface2 },
  sendBtn: { width: 42, height: 42, borderRadius: radius.full, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.surface3 },
  centerState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  centerTitle: { fontSize: 17, fontWeight: '800', color: colors.dark, textAlign: 'center' },
  centerText: { fontSize: 13, color: colors.ink3, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
