import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
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
  Membership,
  Notification,
  NotificationKind,
  OneCAction,
  Payment,
  ProgressData,
  ProgressLift,
  ProgressLiftInput,
  ProgressMeasure,
  ProgressMeasureInput,
  Role,
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

// --- Web in-memory store (expo-sqlite не работает в браузере) ---
let webStore: AppData = JSON.parse(JSON.stringify(seedData));

type Db = SQLite.SQLiteDatabase;

let dbPromise: Promise<Db> | null = null;
let initPromise: Promise<Db> | null = null;
const CHECK_IN_DEDUPE_WINDOW_MS = 60_000;
const SYNC_RETRY_LIMIT = 50;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('fitness_app.db');
  }
  return dbPromise;
}

function boolToInt(value: boolean) {
  return value ? 1 : 0;
}

function intToBool(value: number) {
  return value === 1;
}

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

async function createSchema(db: Db) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      phone TEXT NOT NULL,
      card_number TEXT NOT NULL,
      roles_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      days_left INTEGER NOT NULL,
      progress_pct INTEGER NOT NULL,
      freezes_left INTEGER NOT NULL,
      pool_visits_left INTEGER NOT NULL,
      zones_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fitness_classes (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      name TEXT NOT NULL,
      trainer TEXT NOT NULL,
      room TEXT NOT NULL,
      duration TEXT NOT NULL,
      spots INTEGER NOT NULL,
      total INTEGER NOT NULL,
      type TEXT NOT NULL,
      booked INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY NOT NULL,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      time TEXT NOT NULL,
      zone TEXT NOT NULL,
      ok INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trainer_clients (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      package_done INTEGER NOT NULL,
      package_total INTEGER NOT NULL,
      status TEXT NOT NULL,
      age INTEGER NOT NULL,
      weight INTEGER NOT NULL,
      goal TEXT NOT NULL,
      next_session TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trainers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      spec TEXT NOT NULL,
      rate TEXT NOT NULL,
      rating TEXT NOT NULL,
      clients INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS halls (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      area TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      open INTEGER NOT NULL,
      load_pct INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_shifts (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      staff_id TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      role TEXT NOT NULL,
      station TEXT NOT NULL,
      status TEXT NOT NULL,
      payout INTEGER NOT NULL,
      notes TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      value INTEGER NOT NULL,
      note TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      id TEXT PRIMARY KEY NOT NULL,
      client_id TEXT NOT NULL,
      client TEXT NOT NULL,
      goal TEXT NOT NULL,
      sessions INTEGER NOT NULL,
      done INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      plan_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sets TEXT NOT NULL,
      weight TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress_data (
      id TEXT PRIMARY KEY NOT NULL,
      weight_points_json TEXT NOT NULL,
      measures_json TEXT NOT NULL,
      lifts_json TEXT NOT NULL,
      history_json TEXT NOT NULL,
      heatmap_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress_measures (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      val TEXT NOT NULL,
      delta TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress_lifts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      val TEXT NOT NULL,
      delta TEXT NOT NULL,
      sessions INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tariffs (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      price TEXT NOT NULL,
      sub TEXT NOT NULL,
      badge TEXT,
      membership_title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      method TEXT NOT NULL,
      date TEXT NOT NULL,
      tariff TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY NOT NULL,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      last TEXT NOT NULL,
      time TEXT NOT NULL,
      unread INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY NOT NULL,
      chat_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      read_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY NOT NULL,
      action_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

async function ensureColumn(db: Db, table: string, column: string, definition: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some(item => item.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

async function isSeeded(db: Db) {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', 'seeded_v6');
  return row?.value === 'true';
}

async function seedMissingNotifications(db: Db) {
  for (const item of seedData.notifications) {
    await db.runAsync(
      `INSERT OR IGNORE INTO notifications
        (id, user_id, role, kind, title, body, created_at, read_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.userId,
      item.role,
      item.kind,
      item.title,
      item.body,
      item.createdAt,
      item.readAt,
    );
  }
}

async function seedMissingPayments(db: Db) {
  for (const item of seedData.payments) {
    await db.runAsync(
      'INSERT OR IGNORE INTO payments (id, name, amount, method, date, tariff) VALUES (?, ?, ?, ?, ?, ?)',
      item.id, item.name, item.amount, item.method, item.date, item.tariff,
    );
  }
}

async function seed(db: Db) {
  await db.withTransactionAsync(async () => {
    const user = seedData.user;
    await db.runAsync(
      'INSERT OR REPLACE INTO users (id, name, initials, phone, card_number, roles_json) VALUES (?, ?, ?, ?, ?, ?)',
      user.id, user.name, user.initials, user.phone, user.cardNumber, JSON.stringify(user.roles),
    );

    const membership = seedData.membership;
    await db.runAsync(
      `INSERT OR REPLACE INTO memberships
        (id, user_id, title, status, expires_at, days_left, progress_pct, freezes_left, pool_visits_left, zones_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      membership.id,
      user.id,
      membership.title,
      membership.status,
      membership.expiresAt,
      membership.daysLeft,
      membership.progressPct,
      membership.freezesLeft,
      membership.poolVisitsLeft,
      JSON.stringify(membership.zones),
    );

    for (const item of seedData.classes) {
      await db.runAsync(
        `INSERT OR REPLACE INTO fitness_classes
          (id, date, time, name, trainer, room, duration, spots, total, type, booked)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id, item.date, item.time, item.name, item.trainer, item.room, item.duration,
        item.spots, item.total, item.type, boolToInt(item.booked),
      );
    }

    for (const [index, item] of seedData.visits.entries()) {
      await db.runAsync(
        'INSERT OR REPLACE INTO visits (id, client_id, name, time, zone, ok, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        item.id, item.clientId, item.name, item.time, item.zone, boolToInt(item.ok), item.status, Date.now() - index,
      );
    }

    for (const item of seedData.trainerClients) {
      await db.runAsync(
        `INSERT OR REPLACE INTO trainer_clients
          (id, name, initials, phone, package_done, package_total, status, age, weight, goal, next_session)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id, item.name, item.initials, item.phone ?? '', item.packageDone, item.packageTotal, item.status,
        item.age, item.weight, item.goal, item.nextSession,
      );
    }

    for (const item of seedData.trainers) {
      await db.runAsync(
        'INSERT OR REPLACE INTO trainers (id, name, initials, spec, rate, rating, clients) VALUES (?, ?, ?, ?, ?, ?, ?)',
        item.id, item.name, item.initials, item.spec, item.rate, item.rating, item.clients,
      );
    }

    for (const item of seedData.halls) {
      await db.runAsync(
        'INSERT OR REPLACE INTO halls (id, name, area, capacity, open, load_pct) VALUES (?, ?, ?, ?, ?, ?)',
        item.id, item.name, item.area, item.capacity, boolToInt(item.open), item.loadPct,
      );
    }

    for (const item of seedData.shifts) {
      await db.runAsync(
        `INSERT OR REPLACE INTO admin_shifts
          (id, date, start_time, end_time, staff_id, staff_name, role, station, status, payout, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        item.date,
        item.startTime,
        item.endTime,
        item.staffId,
        item.staffName,
        item.role,
        item.station,
        item.status,
        item.payout,
        item.notes,
      );
    }

    for (const item of seedData.settings) {
      await db.runAsync(
        'INSERT OR REPLACE INTO admin_settings (key, label, value, note) VALUES (?, ?, ?, ?)',
        item.key,
        item.label,
        boolToInt(item.value),
        item.note,
      );
    }

    for (const plan of seedData.workoutPlans) {
      await db.runAsync(
        'INSERT OR REPLACE INTO workout_plans (id, client_id, client, goal, sessions, done) VALUES (?, ?, ?, ?, ?, ?)',
        plan.id, plan.clientId, plan.client, plan.goal, plan.sessions, plan.done,
      );
      for (const exercise of plan.exercises) {
        await db.runAsync(
          'INSERT OR REPLACE INTO workout_exercises (id, plan_id, name, sets, weight) VALUES (?, ?, ?, ?, ?)',
          exercise.id, exercise.planId, exercise.name, exercise.sets, exercise.weight,
        );
      }
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO progress_data
        (id, weight_points_json, measures_json, lifts_json, history_json, heatmap_json)
        VALUES (?, ?, ?, ?, ?, ?)`,
      'client-anna',
      JSON.stringify(seedData.progress.weightPoints),
      JSON.stringify(seedData.progress.measures),
      JSON.stringify(seedData.progress.lifts),
      JSON.stringify(seedData.progress.history),
      JSON.stringify(seedData.progress.heatmap),
    );

    for (const item of seedData.tariffs) {
      await db.runAsync(
        'INSERT OR REPLACE INTO tariffs (id, label, price, sub, badge, membership_title) VALUES (?, ?, ?, ?, ?, ?)',
        item.id, item.label, item.price, item.sub, item.badge ?? null, item.membershipTitle,
      );
    }

    for (const item of seedData.payments) {
      await db.runAsync(
        'INSERT OR REPLACE INTO payments (id, name, amount, method, date, tariff) VALUES (?, ?, ?, ?, ?, ?)',
        item.id, item.name, item.amount, item.method, item.date, item.tariff,
      );
    }

    for (const item of seedData.chats) {
      await db.runAsync(
        'INSERT OR REPLACE INTO chats (id, client_id, name, initials, last, time, unread) VALUES (?, ?, ?, ?, ?, ?, ?)',
        item.id, item.clientId, item.name, item.initials, item.last, item.time, item.unread,
      );
    }

    for (const [index, item] of seedData.messages.entries()) {
      await db.runAsync(
        'INSERT OR REPLACE INTO chat_messages (id, chat_id, sender, text, time, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        item.id, item.chatId, item.from, item.text, item.time, Date.now() + index,
      );
    }

    for (const item of seedData.notifications) {
      await db.runAsync(
        `INSERT OR REPLACE INTO notifications
          (id, user_id, role, kind, title, body, created_at, read_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        item.userId,
        item.role,
        item.kind,
        item.title,
        item.body,
        item.createdAt,
        item.readAt,
      );
    }

    await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', 'seeded_v6', 'true');
  });
}

async function initializeNativeDatabase() {
  const db = await getDb();
  await createSchema(db);
  await ensureColumn(db, 'trainer_clients', 'phone', "phone TEXT NOT NULL DEFAULT ''");
  await db.runAsync(
    `UPDATE trainer_clients
      SET phone = CASE id
        WHEN 'client-anna' THEN '+7 (999) 111-22-33'
        WHEN 'client-pavel' THEN '+7 (999) 222-33-44'
        WHEN 'client-marina' THEN '+7 (999) 333-44-55'
        WHEN 'client-diana' THEN '+7 (999) 444-55-66'
        WHEN 'client-ilya' THEN '+7 (999) 555-66-77'
        WHEN 'client-oleg' THEN '+7 (999) 666-77-88'
        WHEN 'client-kate' THEN '+7 (999) 777-88-99'
        ELSE phone
      END
      WHERE phone = ''`,
  );
  if (!(await isSeeded(db))) {
    await seed(db);
  }
  await seedMissingNotifications(db);
  await seedMissingPayments(db);
  return db;
}

export async function initializeDatabase() {
  if (Platform.OS === 'web') {
    // Web не использует SQLite: данные живут в in-memory store.
    return null as unknown as Db;
  }
  if (!initPromise) {
    initPromise = initializeNativeDatabase();
  }
  return initPromise;
}

export async function loadAppData(): Promise<AppData> {
  if (Platform.OS === 'web') {
    return JSON.parse(JSON.stringify(webStore));
  }

  const db = await initializeDatabase();
  const userRow = await db.getFirstAsync<{
    id: string; name: string; initials: string; phone: string; card_number: string; roles_json: string;
  }>('SELECT * FROM users LIMIT 1');
  const membershipRow = await db.getFirstAsync<{
    id: string; title: string; status: Membership['status']; expires_at: string; days_left: number;
    progress_pct: number; freezes_left: number; pool_visits_left: number; zones_json: string;
  }>('SELECT * FROM memberships LIMIT 1');

  if (!userRow || !membershipRow) {
    throw new Error('Database is initialized but required rows are missing');
  }

  const classRows = await db.getAllAsync<{
    id: string; date: string; time: string; name: string; trainer: string; room: string; duration: string;
    spots: number; total: number; type: string; booked: number;
  }>('SELECT * FROM fitness_classes ORDER BY date ASC, time ASC');

  const visitRows = await db.getAllAsync<{
    id: string; client_id: string; name: string; time: string; zone: string; ok: number; status: string;
  }>('SELECT * FROM visits ORDER BY created_at DESC');

  const clientRows = await db.getAllAsync<{
    id: string; name: string; initials: string; phone: string; package_done: number; package_total: number;
    status: TrainerClient['status']; age: number; weight: number; goal: string; next_session: string;
  }>('SELECT * FROM trainer_clients ORDER BY name ASC');

  const chatRows = await db.getAllAsync<{
    id: string; client_id: string; name: string; initials: string; last: string; time: string; unread: number;
  }>('SELECT * FROM chats ORDER BY time DESC');

  const trainerRows = await db.getAllAsync<{
    id: string; name: string; initials: string; spec: string; rate: string; rating: string; clients: number;
  }>('SELECT * FROM trainers ORDER BY name ASC');

  const hallRows = await db.getAllAsync<{
    id: string; name: string; area: string; capacity: number; open: number; load_pct: number;
  }>('SELECT * FROM halls ORDER BY name ASC');

  const shiftRows = await db.getAllAsync<{
    id: string; date: string; start_time: string; end_time: string; staff_id: string;
    staff_name: string; role: AdminShift['role']; station: string; status: AdminShift['status'];
    payout: number; notes: string;
  }>('SELECT * FROM admin_shifts ORDER BY date DESC, start_time ASC');

  const settingRows = await db.getAllAsync<{
    key: string; label: string; value: number; note: string;
  }>('SELECT * FROM admin_settings ORDER BY label ASC');

  const planRows = await db.getAllAsync<{
    id: string; client_id: string; client: string; goal: string; sessions: number; done: number;
  }>('SELECT * FROM workout_plans ORDER BY client ASC');

  const exerciseRows = await db.getAllAsync<{
    id: string; plan_id: string; name: string; sets: string; weight: string;
  }>('SELECT * FROM workout_exercises ORDER BY id ASC');

  const progressRow = await db.getFirstAsync<{
    weight_points_json: string; measures_json: string; lifts_json: string; history_json: string; heatmap_json: string;
  }>('SELECT * FROM progress_data LIMIT 1');

  const progressMeasureRows = await db.getAllAsync<ProgressMeasure>(
    'SELECT * FROM progress_measures ORDER BY created_at DESC',
  );

  const progressLiftRows = await db.getAllAsync<ProgressLift>(
    'SELECT * FROM progress_lifts ORDER BY created_at DESC',
  );

  const tariffRows = await db.getAllAsync<{
    id: string; label: string; price: string; sub: string; badge: string | null; membership_title: string;
  }>('SELECT * FROM tariffs ORDER BY rowid ASC');

  const paymentRows = await db.getAllAsync<Payment>(
    'SELECT * FROM payments ORDER BY rowid ASC',
  );

  const messageRows = await db.getAllAsync<{
    id: string; chat_id: string; sender: ChatMessage['from']; text: string; time: string;
  }>('SELECT * FROM chat_messages ORDER BY created_at ASC');

  const notificationRows = await db.getAllAsync<{
    id: string; user_id: string; role: string; kind: string; title: string; body: string;
    created_at: number; read_at: number | null;
  }>('SELECT * FROM notifications ORDER BY created_at DESC');

  const user: User = {
    id: userRow.id,
    name: userRow.name,
    initials: userRow.initials,
    phone: userRow.phone,
    cardNumber: userRow.card_number,
    roles: JSON.parse(userRow.roles_json),
  };

  return {
    user,
    membership: {
      id: membershipRow.id,
      title: membershipRow.title,
      status: membershipRow.status,
      expiresAt: membershipRow.expires_at,
      daysLeft: membershipRow.days_left,
      progressPct: membershipRow.progress_pct,
      freezesLeft: membershipRow.freezes_left,
      poolVisitsLeft: membershipRow.pool_visits_left,
      zones: JSON.parse(membershipRow.zones_json),
    },
    classes: classRows.map<FitnessClass>(item => ({
      id: item.id,
      date: item.date,
      time: item.time,
      name: item.name,
      trainer: item.trainer,
      room: item.room,
      duration: item.duration,
      spots: item.spots,
      total: item.total,
      type: item.type,
      booked: intToBool(item.booked),
    })),
    visits: visitRows.map<Visit>(item => ({
      id: item.id,
      clientId: item.client_id,
      name: item.name,
      time: item.time,
      zone: item.zone,
      ok: intToBool(item.ok),
      status: item.status,
    })),
    trainerClients: clientRows.map<TrainerClient>(item => ({
      id: item.id,
      name: item.name,
      initials: item.initials,
      phone: item.phone,
      packageDone: item.package_done,
      packageTotal: item.package_total,
      status: item.status,
      age: item.age,
      weight: item.weight,
      goal: item.goal,
      nextSession: item.next_session,
    })),
    trainers: trainerRows.map<Trainer>(item => ({
      id: item.id,
      name: item.name,
      initials: item.initials,
      spec: item.spec,
      rate: item.rate,
      rating: item.rating,
      clients: item.clients,
    })),
    halls: hallRows.map<Hall>(item => ({
      id: item.id,
      name: item.name,
      area: item.area,
      capacity: item.capacity,
      open: intToBool(item.open),
      loadPct: item.load_pct,
    })),
    shifts: shiftRows.map<AdminShift>(item => ({
      id: item.id,
      date: item.date,
      startTime: item.start_time,
      endTime: item.end_time,
      staffId: item.staff_id,
      staffName: item.staff_name,
      role: item.role,
      station: item.station,
      status: item.status,
      payout: item.payout,
      notes: item.notes,
    })),
    settings: settingRows.map<AdminSetting>(item => ({
      key: item.key,
      label: item.label,
      value: intToBool(item.value),
      note: item.note,
    })),
    workoutPlans: planRows.map<WorkoutPlan>(plan => ({
      id: plan.id,
      clientId: plan.client_id,
      client: plan.client,
      goal: plan.goal,
      sessions: plan.sessions,
      done: plan.done,
      exercises: exerciseRows
        .filter(exercise => exercise.plan_id === plan.id)
        .map<WorkoutExercise>(exercise => ({
          id: exercise.id,
          planId: exercise.plan_id,
          name: exercise.name,
          sets: exercise.sets,
          weight: exercise.weight,
        })),
    })),
    progress: progressRow ? {
      weightPoints: JSON.parse(progressRow.weight_points_json),
      measures: [
        ...progressMeasureRows.map(({ label, val, delta }) => ({ label, val, delta })),
        ...JSON.parse(progressRow.measures_json),
      ],
      lifts: [
        ...progressLiftRows.map(({ name, val, delta, sessions }) => ({ name, val, delta, sessions })),
        ...JSON.parse(progressRow.lifts_json),
      ],
      history: JSON.parse(progressRow.history_json),
      heatmap: JSON.parse(progressRow.heatmap_json),
    } satisfies ProgressData : {
      ...seedData.progress,
      measures: [...progressMeasureRows.map(({ label, val, delta }) => ({ label, val, delta })), ...seedData.progress.measures],
      lifts: [...progressLiftRows.map(({ name, val, delta, sessions }) => ({ name, val, delta, sessions })), ...seedData.progress.lifts],
    },
    tariffs: tariffRows.map<Tariff>(item => ({
      id: item.id,
      label: item.label,
      price: item.price,
      sub: item.sub,
      badge: item.badge ?? undefined,
      membershipTitle: item.membership_title,
    })),
    payments: paymentRows,
    chats: chatRows.map<Chat>(item => ({
      id: item.id,
      clientId: item.client_id,
      name: item.name,
      initials: item.initials,
      last: item.last,
      time: item.time,
      unread: item.unread,
    })),
    messages: messageRows.map<ChatMessage>(item => ({
      id: item.id,
      chatId: item.chat_id,
      from: item.sender,
      text: item.text,
      time: item.time,
    })),
    notifications: notificationRows.length > 0
      ? notificationRows.map<Notification>(item => ({
          id: item.id,
          userId: item.user_id,
          role: item.role as Role,
          kind: item.kind as NotificationKind,
          title: item.title,
          body: item.body,
          createdAt: item.created_at,
          readAt: item.read_at ?? null,
        }))
      : seedData.notifications,
  };
}

export async function markNotificationReadInDb(notificationId: string) {
  if (Platform.OS === 'web') {
    const notif = webStore.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.readAt = Date.now();
      return true;
    }
    return false;
  }
  const db = await initializeDatabase();
  const result = await db.runAsync(
    'UPDATE notifications SET read_at = ? WHERE id = ? AND read_at IS NULL',
    Date.now(), notificationId,
  );
  return result.changes > 0;
}

export async function bookClassInDb(classId: string) {
  if (Platform.OS === 'web') {
    const cls = webStore.classes.find(c => c.id === classId);
    if (cls && !cls.booked && cls.spots > 0) {
      cls.booked = true;
      cls.spots -= 1;
      return true;
    }
    return false;
  }
  const db = await initializeDatabase();
  const result = await db.runAsync(
    'UPDATE fitness_classes SET booked = 1, spots = spots - 1 WHERE id = ? AND booked = 0 AND spots > 0',
    classId,
  );
  return result.changes > 0;
}

export async function cancelClassInDb(classId: string) {
  if (Platform.OS === 'web') {
    const cls = webStore.classes.find(c => c.id === classId);
    if (cls && cls.booked) {
      cls.booked = false;
      cls.spots += 1;
      return true;
    }
    return false;
  }
  const db = await initializeDatabase();
  const result = await db.runAsync(
    'UPDATE fitness_classes SET booked = 0, spots = spots + 1 WHERE id = ? AND booked = 1',
    classId,
  );
  return result.changes > 0;
}

export async function addVisitToDb(visit: Visit) {
  if (Platform.OS === 'web') {
    const now = Date.now();
    const duplicate = webStore.visits.find(
      v => v.clientId === visit.clientId && v.zone === visit.zone && v.ok,
    );
    // Use a timestamp-based dedupe: store createdAt on visit objects in webStore
    // We track createdAt in a parallel map since Visit type has no createdAt field
    const key = `${visit.clientId}:${visit.zone}`;
    const lastTime = webVisitTimestamps.get(key) ?? 0;
    if (duplicate && now - lastTime < CHECK_IN_DEDUPE_WINDOW_MS) {
      return false;
    }
    const newVisit: Visit = { ...visit, id: makeEntityId('visit') };
    webStore.visits.unshift(newVisit);
    webVisitTimestamps.set(key, now);
    return true;
  }

  const db = await initializeDatabase();
  const createdAt = Date.now();
  let inserted = false;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const duplicate = await txn.getFirstAsync<{ id: string }>(
      `SELECT id FROM visits
        WHERE client_id = ? AND zone = ? AND ok = 1 AND created_at >= ?
        ORDER BY created_at DESC
        LIMIT 1`,
      visit.clientId,
      visit.zone,
      createdAt - CHECK_IN_DEDUPE_WINDOW_MS,
    );

    if (duplicate) {
      return;
    }

    await txn.runAsync(
      'INSERT INTO visits (id, client_id, name, time, zone, ok, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      visit.id, visit.clientId, visit.name, visit.time, visit.zone, boolToInt(visit.ok), visit.status, createdAt,
    );
    inserted = true;
  });

  return inserted;
}

// Auxiliary map for web dedupe timestamps (clientId:zone -> timestamp)
const webVisitTimestamps = new Map<string, number>();

export async function freezeMembershipInDb() {
  if (Platform.OS === 'web') {
    const m = webStore.membership;
    if (m.status === 'active' && m.freezesLeft > 0) {
      m.status = 'frozen';
      m.freezesLeft -= 1;
      return true;
    }
    return false;
  }
  const db = await initializeDatabase();
  const result = await db.runAsync(
    "UPDATE memberships SET status = 'frozen', freezes_left = freezes_left - 1 WHERE status = 'active' AND freezes_left > 0",
  );
  return result.changes > 0;
}

export async function renewMembershipInDb(tariffId: string, title: string) {
  if (Platform.OS === 'web') {
    const m = webStore.membership;
    const extraDays = tariffId === 'year' ? 365 : tariffId === 'half-year' ? 180 : 30;
    m.status = 'active';
    m.title = title;
    m.daysLeft += extraDays;
    m.progressPct = 100;
    return;
  }
  const db = await initializeDatabase();
  const extraDays = tariffId === 'year' ? 365 : tariffId === 'half-year' ? 180 : 30;
  await db.runAsync(
    "UPDATE memberships SET title = ?, status = 'active', days_left = days_left + ?, progress_pct = 100",
    title, extraDays,
  );
}

export async function addMessageToDb(message: ChatMessage) {
  if (Platform.OS === 'web') {
    webStore.messages.push({ ...message });
    const chat = webStore.chats.find(c => c.id === message.chatId);
    if (chat) {
      chat.last = message.text;
      chat.time = message.time;
      chat.unread = 0;
    }
    return;
  }
  const db = await initializeDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO chat_messages (id, chat_id, sender, text, time, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      message.id, message.chatId, message.from, message.text, message.time, Date.now(),
    );
    await db.runAsync(
      'UPDATE chats SET last = ?, time = ?, unread = 0 WHERE id = ?',
      message.text, message.time, message.chatId,
    );
  });
}

export async function saveWorkoutPlanToDb(plan: WorkoutPlan) {
  if (Platform.OS === 'web') {
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
    return plan.id;
  }

  const db = await initializeDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO workout_plans (id, client_id, client, goal, sessions, done)
        VALUES (?, ?, ?, ?, ?, ?)`,
      plan.id,
      plan.clientId,
      plan.client,
      plan.goal,
      plan.sessions,
      plan.done,
    );
    await db.runAsync('DELETE FROM workout_exercises WHERE plan_id = ?', plan.id);
    for (const exercise of plan.exercises) {
      await db.runAsync(
        'INSERT OR REPLACE INTO workout_exercises (id, plan_id, name, sets, weight) VALUES (?, ?, ?, ?, ?)',
        exercise.id,
        plan.id,
        exercise.name,
        exercise.sets,
        exercise.weight,
      );
    }
  });
  return plan.id;
}

export async function deleteWorkoutPlanFromDb(planId: string) {
  if (Platform.OS === 'web') {
    webStore.workoutPlans = webStore.workoutPlans.filter(item => item.id !== planId);
    return;
  }

  const db = await initializeDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM workout_exercises WHERE plan_id = ?', planId);
    await db.runAsync('DELETE FROM workout_plans WHERE id = ?', planId);
  });
}

export async function addTrainerClientToDb(client: TrainerClientInput) {
  if (Platform.OS === 'web') {
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
    return id;
  }
  const db = await initializeDatabase();
  const id = client.id ?? makeEntityId('client');
  await db.runAsync(
    `INSERT OR REPLACE INTO trainer_clients
      (id, name, initials, phone, package_done, package_total, status, age, weight, goal, next_session)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    client.name,
    formatClientInitials(client.name, client.initials),
    client.phone ?? '',
    client.packageDone,
    client.packageTotal,
    client.status,
    client.age,
    client.weight,
    client.goal,
    client.nextSession,
  );
  return id;
}

export async function upsertTrainerInDb(trainer: TrainerInput) {
  if (Platform.OS === 'web') {
    const id = trainer.id ?? makeEntityId('trainer');
    const existingIndex = trainer.id
      ? webStore.trainers.findIndex(t => t.id === trainer.id)
      : -1;
    if (existingIndex >= 0) {
      webStore.trainers[existingIndex] = { ...trainer, id };
    } else {
      webStore.trainers.push({ ...trainer, id });
    }
    return id;
  }
  const db = await initializeDatabase();
  const id = trainer.id ?? makeEntityId('trainer');
  await db.runAsync(
    `INSERT OR REPLACE INTO trainers (id, name, initials, spec, rate, rating, clients)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    trainer.name,
    trainer.initials,
    trainer.spec,
    trainer.rate,
    trainer.rating,
    trainer.clients,
  );
  return id;
}

export async function addHallToDb(hall: HallInput) {
  if (Platform.OS === 'web') {
    const id = hall.id ?? makeEntityId('hall');
    const existingIndex = hall.id
      ? webStore.halls.findIndex(item => item.id === hall.id)
      : -1;
    const nextHall: Hall = { ...hall, id };
    if (existingIndex >= 0) {
      webStore.halls[existingIndex] = nextHall;
    } else {
      webStore.halls.push(nextHall);
    }
    return id;
  }
  const db = await initializeDatabase();
  const id = hall.id ?? makeEntityId('hall');
  await db.runAsync(
    'INSERT OR REPLACE INTO halls (id, name, area, capacity, open, load_pct) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    hall.name,
    hall.area,
    hall.capacity,
    boolToInt(hall.open),
    hall.loadPct,
  );
  return id;
}

export async function saveShiftToDb(shift: AdminShiftInput) {
  if (Platform.OS === 'web') {
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
    return id;
  }
  const db = await initializeDatabase();
  const id = shift.id ?? makeEntityId('shift');
  await db.runAsync(
    `INSERT OR REPLACE INTO admin_shifts
      (id, date, start_time, end_time, staff_id, staff_name, role, station, status, payout, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    shift.date,
    shift.startTime,
    shift.endTime,
    shift.staffId,
    shift.staffName,
    shift.role,
    shift.station,
    shift.status,
    shift.payout,
    shift.notes,
  );
  return id;
}

export async function setAdminSettingInDb(key: string, label: string, value: boolean, note: string) {
  if (Platform.OS === 'web') {
    const existingIndex = webStore.settings.findIndex(item => item.key === key);
    const nextSetting: AdminSetting = { key, label, value, note };
    if (existingIndex >= 0) {
      webStore.settings[existingIndex] = nextSetting;
    } else {
      webStore.settings.push(nextSetting);
    }
    return;
  }
  const db = await initializeDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO admin_settings (key, label, value, note) VALUES (?, ?, ?, ?)',
    key,
    label,
    boolToInt(value),
    note,
  );
}

export async function addProgressMeasureToDb(measure: ProgressMeasureInput) {
  if (Platform.OS === 'web') {
    webStore.progress.measures.unshift({ ...measure });
    return;
  }

  const db = await initializeDatabase();
  await db.runAsync(
    'INSERT INTO progress_measures (id, label, val, delta, created_at) VALUES (?, ?, ?, ?, ?)',
    makeEntityId('measure'),
    measure.label,
    measure.val,
    measure.delta,
    Date.now(),
  );
}

export async function addProgressLiftToDb(lift: ProgressLiftInput) {
  if (Platform.OS === 'web') {
    webStore.progress.lifts.unshift({ ...lift });
    return;
  }

  const db = await initializeDatabase();
  await db.runAsync(
    'INSERT INTO progress_lifts (id, name, val, delta, sessions, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    makeEntityId('lift'),
    lift.name,
    lift.val,
    lift.delta,
    lift.sessions,
    Date.now(),
  );
}

function mapSyncQueueRow(row: {
  id: string;
  action_type: OneCAction['type'];
  payload_json: string;
  status: SyncQueueStatus;
  attempts: number;
  created_at: number;
  updated_at: number;
  last_error: string | null;
}): SyncQueueItem {
  return {
    id: row.id,
    actionType: row.action_type,
    payloadJson: row.payload_json,
    status: row.status,
    attempts: row.attempts,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastError: row.last_error,
  };
}

async function readSyncStateValue(db: Db, key: string) {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM sync_state WHERE key = ?', key);
  return row?.value ?? null;
}

async function writeSyncStateValue(db: Db, key: string, value: string | number | null) {
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)',
    key,
    value === null ? '' : String(value),
  );
}

export async function enqueueSyncActionToDb(action: OneCAction): Promise<string> {
  if (Platform.OS === 'web') {
    return '';
  }

  const db = await initializeDatabase();
  const id = makeSyncActionId(action);
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO sync_outbox
      (id, action_type, payload_json, status, attempts, created_at, updated_at, last_error)
      VALUES (?, ?, ?, 'pending', 0, ?, ?, NULL)`,
    id,
    action.type,
    JSON.stringify(action),
    now,
    now,
  );
  return id;
}

export async function getPendingSyncItemsFromDb(limit = 20): Promise<SyncQueueItem[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  const db = await initializeDatabase();
  await db.runAsync(
    "UPDATE sync_outbox SET status = 'pending', updated_at = ? WHERE status = 'processing'",
    Date.now(),
  );
  const rows = await db.getAllAsync<Parameters<typeof mapSyncQueueRow>[0]>(
    `SELECT * FROM sync_outbox
      WHERE status IN ('pending', 'failed') AND attempts < ?
      ORDER BY created_at ASC
      LIMIT ?`,
    SYNC_RETRY_LIMIT,
    limit,
  );
  return rows.map(mapSyncQueueRow);
}

export async function markSyncItemProcessingInDb(id: string) {
  if (Platform.OS === 'web') return;
  const db = await initializeDatabase();
  await db.runAsync(
    "UPDATE sync_outbox SET status = 'processing', updated_at = ? WHERE id = ?",
    Date.now(),
    id,
  );
}

export async function markSyncItemSentInDb(id: string) {
  if (Platform.OS === 'web') return;
  const db = await initializeDatabase();
  await db.runAsync(
    "UPDATE sync_outbox SET status = 'sent', updated_at = ?, last_error = NULL WHERE id = ?",
    Date.now(),
    id,
  );
}

export async function markSyncItemFailedInDb(id: string, error: string) {
  if (Platform.OS === 'web') return;
  const db = await initializeDatabase();
  await db.runAsync(
    "UPDATE sync_outbox SET status = 'failed', attempts = attempts + 1, updated_at = ?, last_error = ? WHERE id = ?",
    Date.now(),
    error,
    id,
  );
}

export async function recordSyncAttemptInDb(error: string | null) {
  if (Platform.OS === 'web') return;
  const db = await initializeDatabase();
  const now = Date.now();
  await writeSyncStateValue(db, 'lastAttemptAt', now);
  await writeSyncStateValue(db, 'lastError', error);
  if (!error) {
    await writeSyncStateValue(db, 'lastSyncAt', now);
  }
}

export async function getSyncStatusFromDb(online = true, syncing = false): Promise<SyncStatus> {
  if (Platform.OS === 'web') {
    return {
      pending: 0,
      processing: 0,
      failed: 0,
      sent: 0,
      lastSyncAt: null,
      lastAttemptAt: null,
      lastError: null,
      online,
      syncing,
    };
  }

  const db = await initializeDatabase();
  const rows = await db.getAllAsync<{ status: SyncQueueStatus; total: number }>(
    'SELECT status, COUNT(*) as total FROM sync_outbox GROUP BY status',
  );
  const counts = rows.reduce<Record<SyncQueueStatus, number>>(
    (acc, row) => ({ ...acc, [row.status]: row.total }),
    { pending: 0, processing: 0, failed: 0, sent: 0 },
  );
  const lastSyncAt = await readSyncStateValue(db, 'lastSyncAt');
  const lastAttemptAt = await readSyncStateValue(db, 'lastAttemptAt');
  const lastError = await readSyncStateValue(db, 'lastError');

  return {
    ...counts,
    lastSyncAt: lastSyncAt ? Number(lastSyncAt) : null,
    lastAttemptAt: lastAttemptAt ? Number(lastAttemptAt) : null,
    lastError: lastError || null,
    online,
    syncing,
  };
}

export async function getRecentSyncItemsFromDb(limit = 8): Promise<SyncQueueItem[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  const db = await initializeDatabase();
  const rows = await db.getAllAsync<Parameters<typeof mapSyncQueueRow>[0]>(
    'SELECT * FROM sync_outbox ORDER BY created_at DESC LIMIT ?',
    limit,
  );
  return rows.map(mapSyncQueueRow);
}
