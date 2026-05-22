import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import type { SyncStatus } from '../../services/sync1C';

type Props = {
  status: SyncStatus | null;
  onSyncNow?: () => void;
};

function formatSyncTime(value: number | null) {
  if (!value) return 'not synced yet';
  return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function SyncStatusBadge({ status, onSyncNow }: Props) {
  const queued = status ? status.pending + status.processing + status.failed : 0;
  const label = !status
    ? 'Local mode'
    : status.syncing
      ? 'Syncing...'
      : queued > 0
        ? `Queued: ${queued}`
        : 'Synced';
  const detail = !status
    ? 'SQLite storage is active'
    : status.online
      ? `Last sync: ${formatSyncTime(status.lastSyncAt)}`
      : 'Offline: saved locally';

  return (
    <View style={[styles.wrap, queued > 0 && styles.wrapQueued, status?.online === false && styles.wrapOffline]}>
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      {!!onSyncNow && (
        <TouchableOpacity style={styles.button} onPress={onSyncNow} activeOpacity={0.75}>
          <Text style={styles.buttonText}>Sync</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.paperCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  wrapQueued: { borderColor: colors.accentDark, backgroundColor: colors.accentSoft },
  wrapOffline: { borderColor: colors.danger },
  textCol: { flex: 1 },
  label: { fontSize: 12, fontWeight: '800', color: colors.dark },
  detail: { fontSize: 11, color: colors.ink3, marginTop: 2 },
  button: {
    minWidth: 54,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
