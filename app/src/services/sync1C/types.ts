import type { OneCAction } from '../../api/types';

export type { OneCAction } from '../../api/types';

export type SyncQueueStatus = 'pending' | 'processing' | 'sent' | 'failed';

export type SyncQueueItem = {
  id: string;
  actionType: OneCAction['type'];
  payloadJson: string;
  status: SyncQueueStatus;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  lastError: string | null;
};

export type SyncStatus = {
  pending: number;
  processing: number;
  failed: number;
  sent: number;
  lastSyncAt: number | null;
  lastAttemptAt: number | null;
  lastError: string | null;
  online: boolean;
  syncing: boolean;
};

export type SyncQueueSnapshot = {
  status: SyncStatus;
  recent: SyncQueueItem[];
};

export type OneCConfig = {
  baseUrl: string;
  apiKey: string;
  mock: boolean;
};

export type OneCUserDTO = {
  externalId: string;
  fullName: string;
  phone: string;
  cardNumber: string;
  status: 'active' | 'blocked';
};

export type OneCMembershipDTO = {
  externalId: string;
  userExternalId: string;
  tariffCode: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'frozen' | 'expired';
};

export type OneCPaymentDTO = {
  externalId: string;
  userExternalId: string;
  membershipExternalId: string | null;
  amount: number;
  currency: 'RUB';
  method: 'card' | 'cash' | 'transfer';
  paidAt: string;
};

export type OneCStaffDTO = {
  externalId: string;
  fullName: string;
  role: 'trainer' | 'reception' | 'admin';
  rate: number;
};

export type SyncCounts = Record<'users' | 'memberships' | 'payments' | 'staff', {
  pulled: number;
  pushed: number;
  failed: number;
}>;

export type SyncError = {
  entity: string;
  externalId?: string;
  message: string;
};

export type SyncReport = {
  startedAt: number;
  finishedAt: number;
  counts: SyncCounts;
  errors: SyncError[];
};

export interface OneCClient {
  fetchUsers(since?: string): Promise<OneCUserDTO[]>;
  fetchMemberships(since?: string): Promise<OneCMembershipDTO[]>;
  fetchPayments(since?: string): Promise<OneCPaymentDTO[]>;
  fetchStaff(): Promise<OneCStaffDTO[]>;
  isOnline(): Promise<boolean>;
  pushAction(actionId: string, action: OneCAction): Promise<void>;
}

export interface SyncService {
  pullAll(): Promise<SyncReport>;
  lastSyncAt(): number | null;
  enqueue(action: OneCAction): Promise<string>;
  processQueue(): Promise<SyncStatus>;
  syncNow(): Promise<SyncStatus>;
  getStatus(): Promise<SyncStatus>;
  getQueueSnapshot(): Promise<SyncQueueSnapshot>;
}
