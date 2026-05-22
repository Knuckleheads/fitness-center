import {
  AppData,
  AdminSetting,
  AdminShift,
  AdminShiftInput,
  Chat,
  ChatMessage,
  FitnessClass,
  Hall,
  HallInput,
  OneCAction,
  ProgressData,
  ProgressLift,
  ProgressLiftInput,
  ProgressMeasure,
  ProgressMeasureInput,
  Tariff,
  Trainer,
  TrainerClientInput,
  TrainerInput,
  TrainerClient,
  User,
  Visit,
  WorkoutExercise,
  WorkoutPlan,
} from '../api/types';
import type { SyncQueueItem, SyncQueueStatus, SyncStatus } from '../services/sync1C/types';
import { seedData } from './seed';

const CHECK_IN_DEDUPE_WINDOW_MS = 60_000;
const WEB_STORE_VERSION = 1;
const WEB_STORAGE_KEY = 'fitness_app_web_store_v1';
const webVisitTimestamps = new Map<string, number>();

type WebStoreSnapshot = {
  version: number;
  data: AppData;
  visitTimestamps?: [string, number][];
  syncOutbox?: SyncQueueItem[];
  syncState?: Record<string, string>;
};

function cloneAppData(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data));
}

function getLocalStorage(): Storage | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

function loadWebStore(): AppData {
  const storage = getLocalStorage();
  if (!storage) {
    return cloneAppData(seedData);
  }

  try {
    const raw = storage.getItem(WEB_STORAGE_KEY);
    if (!raw) {
      return cloneAppData(seedData);
    }

    const snapshot = JSON.parse(raw) as WebStoreSnapshot;
    if (snapshot.version !== WEB_STORE_VERSION || !snapshot.data) {
      return cloneAppData(seedData);
    }

    webVisitTimestamps.clear();
    for (const [key, value] of snapshot.visitTimestamps ?? []) {
      webVisitTimestamps.set(key, value);
    }

    return cloneAppData({
      ...snapshot.data,
      payments: snapshot.data.payments ?? seedData.payments,
    });
  } catch {
    return cloneAppData(seedData);
  }
}

function persistWebStore() {
  const storage = getLocalStorage();
  if (!storage) return;

  const snapshot: WebStoreSnapshot = {
    version: WEB_STORE_VERSION,
    data: webStore,
    visitTimestamps: [...webVisitTimestamps.entries()],
    syncOutbox: webSyncOutbox,
    syncState: webSyncState,
  };

  try {
    storage.setItem(WEB_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Browser storage can be disabled or full; keep the in-memory session usable.
  }
}

let webStore: AppData = loadWebStore();
let webSyncOutbox: SyncQueueItem[] = [];
let webSyncState: Record<string, string> = {};

function restoreWebSyncState() {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    const raw = storage.getItem(WEB_STORAGE_KEY);
    if (!raw) return;
    const snapshot = JSON.parse(raw) as WebStoreSnapshot;
    webSyncOutbox = snapshot.syncOutbox ?? [];
    webSyncState = snapshot.syncState ?? {};
  } catch {
    webSyncOutbox = [];
    webSyncState = {};
  }
}

restoreWebSyncState();

function makeEntityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function makeSyncActionId(action: OneCAction) {
  return `sync-${action.type}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function formatClientInitials(name: string, fallback = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const safeFallback = fallback.trim().toUpperCase();

  if (safeFallback && safeFallback.length <= 3) {
    return safeFallback;
  }

  const compact = parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  return compact || safeFallback.slice(0, 3) || 'КЛ';
}

export function formatClientShortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 3) {
    const [surname, givenName, patronymic] = parts;
    const givenInitial = givenName?.[0]?.toUpperCase() ?? '';
    const patronymicInitial = patronymic?.[0]?.toUpperCase() ?? '';
    return `${surname} ${givenInitial}.${patronymicInitial}.`.trim();
  }

  return name.trim();
}

export async function initializeDatabase() {
  persistWebStore();
  return null as any;
}

export async function loadAppData(): Promise<AppData> {
  return cloneAppData(webStore);
}

export async function bookClassInDb(classId: string) {
  const cls = webStore.classes.find(c => c.id === classId);
  if (cls && !cls.booked && cls.spots > 0) {
    cls.booked = true;
    cls.spots -= 1;
    persistWebStore();
    return true;
  }
  return false;
}

export async function cancelClassInDb(classId: string) {
  const cls = webStore.classes.find(c => c.id === classId);
  if (cls && cls.booked) {
    cls.booked = false;
    cls.spots += 1;
    persistWebStore();
    return true;
  }
  return false;
}

export async function addVisitToDb(visit: Visit): Promise<boolean> {
  const now = Date.now();
  const key = `${visit.clientId}:${visit.zone}`;
  const lastTime = webVisitTimestamps.get(key) ?? 0;
  const duplicate = webStore.visits.find(
    v => v.clientId === visit.clientId && v.zone === visit.zone && v.ok,
  );
  if (duplicate && now - lastTime < CHECK_IN_DEDUPE_WINDOW_MS) {
    return false;
  }
  webStore.visits.unshift({ ...visit, id: makeEntityId('visit') });
  webVisitTimestamps.set(key, now);
  persistWebStore();
  return true;
}

export async function freezeMembershipInDb(): Promise<boolean> {
  const m = webStore.membership;
  if (m.status === 'active' && m.freezesLeft > 0) {
    m.status = 'frozen';
    m.freezesLeft -= 1;
    persistWebStore();
    return true;
  }
  return false;
}

export async function renewMembershipInDb(tariffId: string, title: string) {
  const m = webStore.membership;
  const extraDays = tariffId === 'year' ? 365 : tariffId === 'half-year' ? 180 : 30;
  m.status = 'active';
  m.title = title;
  m.daysLeft += extraDays;
  m.progressPct = 100;
  persistWebStore();
}

export async function addMessageToDb(message: ChatMessage) {
  webStore.messages.push({ ...message });
  const chat = webStore.chats.find(c => c.id === message.chatId);
  if (chat) {
    chat.last = message.text;
    chat.time = message.time;
    chat.unread = 0;
  }
  persistWebStore();
}

export async function saveWorkoutPlanToDb(plan: WorkoutPlan): Promise<string> {
  const existingIndex = webStore.workoutPlans.findIndex(item => item.id === plan.id);
  const nextPlan: WorkoutPlan = {
    ...plan,
    exercises: plan.exercises.map(exercise => ({ ...exercise, planId: plan.id })),
  };
  if (existingIndex >= 0) {
    webStore.workoutPlans[existingIndex] = nextPlan;
  } else {
    webStore.workoutPlans.push(nextPlan);
  }
  persistWebStore();
  return plan.id;
}

export async function deleteWorkoutPlanFromDb(planId: string) {
  webStore.workoutPlans = webStore.workoutPlans.filter(item => item.id !== planId);
  persistWebStore();
}

export async function addTrainerClientToDb(client: TrainerClientInput): Promise<string> {
  const id = client.id ?? makeEntityId('client');
  const existingIndex = client.id
    ? webStore.trainerClients.findIndex(item => item.id === client.id)
    : -1;
  const nextClient: TrainerClient = {
    ...client,
    id,
    initials: formatClientInitials(client.name, client.initials),
  };
  if (existingIndex >= 0) {
    webStore.trainerClients[existingIndex] = nextClient;
  } else {
    webStore.trainerClients.push(nextClient);
  }
  persistWebStore();
  return id;
}

export async function upsertTrainerInDb(trainer: TrainerInput): Promise<string> {
  const id = trainer.id ?? makeEntityId('trainer');
  const existingIndex = trainer.id
    ? webStore.trainers.findIndex(t => t.id === trainer.id)
    : -1;
  if (existingIndex >= 0) {
    webStore.trainers[existingIndex] = { ...trainer, id };
  } else {
    webStore.trainers.push({ ...trainer, id });
  }
  persistWebStore();
  return id;
}

export async function addHallToDb(hall: HallInput): Promise<string> {
  const id = hall.id ?? makeEntityId('hall');
  const existingIndex = hall.id
    ? webStore.halls.findIndex(item => item.id === hall.id)
    : -1;
  const nextHall = { ...hall, id };
  if (existingIndex >= 0) {
    webStore.halls[existingIndex] = nextHall;
  } else {
    webStore.halls.push(nextHall);
  }
  persistWebStore();
  return id;
}

export async function saveShiftToDb(shift: AdminShiftInput): Promise<string> {
  const id = shift.id ?? makeEntityId('shift');
  const existingIndex = shift.id
    ? webStore.shifts.findIndex(item => item.id === shift.id)
    : -1;
  const nextShift: AdminShift = { ...shift, id };
  if (existingIndex >= 0) {
    webStore.shifts[existingIndex] = nextShift;
  } else {
    webStore.shifts.unshift(nextShift);
  }
  persistWebStore();
  return id;
}

export async function setAdminSettingInDb(key: string, label: string, value: boolean, note: string) {
  const existingIndex = webStore.settings.findIndex(item => item.key === key);
  const nextSetting: AdminSetting = { key, label, value, note };
  if (existingIndex >= 0) {
    webStore.settings[existingIndex] = nextSetting;
  } else {
    webStore.settings.push(nextSetting);
  }
  persistWebStore();
}

export async function addProgressMeasureToDb(measure: ProgressMeasureInput) {
  webStore.progress.measures.unshift({ ...measure });
  persistWebStore();
}

export async function addProgressLiftToDb(lift: ProgressLiftInput) {
  webStore.progress.lifts.unshift({ ...lift });
  persistWebStore();
}

export async function markNotificationReadInDb(notificationId: string) {
  const notif = webStore.notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.readAt = Date.now();
    persistWebStore();
    return true;
  }
  return false;
}

export async function enqueueSyncActionToDb(action: OneCAction): Promise<string> {
  const id = makeSyncActionId(action);
  const now = Date.now();
  webSyncOutbox.push({
    id,
    actionType: action.type,
    payloadJson: JSON.stringify(action),
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    lastError: null,
  });
  persistWebStore();
  return id;
}

export async function getPendingSyncItemsFromDb(limit = 20): Promise<SyncQueueItem[]> {
  const now = Date.now();
  webSyncOutbox = webSyncOutbox.map(item => (
    item.status === 'processing' ? { ...item, status: 'pending', updatedAt: now } : item
  ));
  persistWebStore();
  return webSyncOutbox
    .filter(item => (item.status === 'pending' || item.status === 'failed') && item.attempts < 50)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, limit)
    .map(item => ({ ...item }));
}

export async function markSyncItemProcessingInDb(id: string) {
  const now = Date.now();
  webSyncOutbox = webSyncOutbox.map(item => (
    item.id === id ? { ...item, status: 'processing', updatedAt: now } : item
  ));
  persistWebStore();
}

export async function markSyncItemSentInDb(id: string) {
  const now = Date.now();
  webSyncOutbox = webSyncOutbox.map(item => (
    item.id === id ? { ...item, status: 'sent', updatedAt: now, lastError: null } : item
  ));
  persistWebStore();
}

export async function markSyncItemFailedInDb(id: string, error: string) {
  const now = Date.now();
  webSyncOutbox = webSyncOutbox.map(item => (
    item.id === id
      ? { ...item, status: 'failed', attempts: item.attempts + 1, updatedAt: now, lastError: error }
      : item
  ));
  persistWebStore();
}

export async function recordSyncAttemptInDb(error: string | null) {
  const now = Date.now();
  webSyncState.lastAttemptAt = String(now);
  webSyncState.lastError = error ?? '';
  if (!error) {
    webSyncState.lastSyncAt = String(now);
  }
  persistWebStore();
}

export async function getSyncStatusFromDb(online = true, syncing = false): Promise<SyncStatus> {
  const counts = webSyncOutbox.reduce<Record<SyncQueueStatus, number>>(
    (acc, item) => ({ ...acc, [item.status]: acc[item.status] + 1 }),
    { pending: 0, processing: 0, failed: 0, sent: 0 },
  );

  return {
    ...counts,
    lastSyncAt: webSyncState.lastSyncAt ? Number(webSyncState.lastSyncAt) : null,
    lastAttemptAt: webSyncState.lastAttemptAt ? Number(webSyncState.lastAttemptAt) : null,
    lastError: webSyncState.lastError || null,
    online,
    syncing,
  };
}

export async function getRecentSyncItemsFromDb(limit = 8): Promise<SyncQueueItem[]> {
  return webSyncOutbox
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map(item => ({ ...item }));
}
