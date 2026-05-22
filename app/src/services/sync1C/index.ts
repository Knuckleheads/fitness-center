import { MockOneCClient } from './MockOneCClient';
import {
  enqueueSyncActionToDb,
  getPendingSyncItemsFromDb,
  getRecentSyncItemsFromDb,
  getSyncStatusFromDb,
  markSyncItemFailedInDb,
  markSyncItemProcessingInDb,
  markSyncItemSentInDb,
  recordSyncAttemptInDb,
} from '../../db/database';
import type { OneCAction, OneCClient, SyncReport, SyncService, SyncStatus } from './types';

export * from './types';
export { MockOneCClient };

let _lastSyncAt: number | null = null;
let _syncing = false;

function emptyCounts() {
  return {
    users: { pulled: 0, pushed: 0, failed: 0 },
    memberships: { pulled: 0, pushed: 0, failed: 0 },
    payments: { pulled: 0, pushed: 0, failed: 0 },
    staff: { pulled: 0, pushed: 0, failed: 0 },
  };
}

export function createSyncService(client: OneCClient): SyncService {
  async function getStatus(): Promise<SyncStatus> {
    let online = true;
    try {
      online = await client.isOnline();
    } catch {
      online = false;
    }
    return getSyncStatusFromDb(online, _syncing);
  }

  async function processQueue(): Promise<SyncStatus> {
    if (_syncing) {
      return getStatus();
    }

    _syncing = true;
    let online = false;
    let lastError: string | null = null;

    try {
      online = await client.isOnline();
      if (!online) {
        lastError = '1C mock service is offline';
        await recordSyncAttemptInDb(lastError);
        return getSyncStatusFromDb(false, false);
      }

      const items = await getPendingSyncItemsFromDb();
      for (const item of items) {
        try {
          await markSyncItemProcessingInDb(item.id);
          const action = JSON.parse(item.payloadJson) as OneCAction;
          await client.pushAction(item.id, action);
          await markSyncItemSentInDb(item.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sync action failed';
          lastError = message;
          await markSyncItemFailedInDb(item.id, message);
        }
      }

      await recordSyncAttemptInDb(lastError);
      _lastSyncAt = lastError ? _lastSyncAt : Date.now();
      return getSyncStatusFromDb(true, false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync queue failed';
      await recordSyncAttemptInDb(message);
      return getSyncStatusFromDb(online, false);
    } finally {
      _syncing = false;
    }
  }

  return {
    async pullAll(): Promise<SyncReport> {
      const startedAt = Date.now();
      const counts = emptyCounts();
      const errors: SyncReport['errors'] = [];

      try {
        const users = await client.fetchUsers();
        counts.users.pulled = users.length;
      } catch (e) {
        errors.push({ entity: 'users', message: e instanceof Error ? e.message : 'Ошибка загрузки пользователей' });
      }

      try {
        const memberships = await client.fetchMemberships();
        counts.memberships.pulled = memberships.length;
      } catch (e) {
        errors.push({ entity: 'memberships', message: e instanceof Error ? e.message : 'Ошибка загрузки абонементов' });
      }

      try {
        const payments = await client.fetchPayments();
        counts.payments.pulled = payments.length;
      } catch (e) {
        errors.push({ entity: 'payments', message: e instanceof Error ? e.message : 'Ошибка загрузки платежей' });
      }

      try {
        const staff = await client.fetchStaff();
        counts.staff.pulled = staff.length;
      } catch (e) {
        errors.push({ entity: 'staff', message: e instanceof Error ? e.message : 'Ошибка загрузки персонала' });
      }

      _lastSyncAt = Date.now();
      return { startedAt, finishedAt: _lastSyncAt, counts, errors };
    },

    lastSyncAt(): number | null {
      return _lastSyncAt;
    },

    async enqueue(action: OneCAction): Promise<string> {
      return enqueueSyncActionToDb(action);
    },

    processQueue,

    syncNow(): Promise<SyncStatus> {
      return processQueue();
    },

    getStatus,

    async getQueueSnapshot() {
      const status = await getStatus();
      const recent = await getRecentSyncItemsFromDb();
      return { status, recent };
    },
  };
}

export const defaultSyncService = createSyncService(new MockOneCClient());
