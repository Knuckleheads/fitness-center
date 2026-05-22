export type Role = 'client' | 'trainer' | 'admin';

export type User = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  cardNumber: string;
  roles: Role[];
};

export type Membership = {
  id: string;
  title: string;
  status: 'active' | 'frozen' | 'expired';
  expiresAt: string;
  daysLeft: number;
  progressPct: number;
  freezesLeft: number;
  poolVisitsLeft: number;
  zones: { label: string; available: boolean }[];
};

export type FitnessClass = {
  id: string;
  date: string;
  time: string;
  name: string;
  trainer: string;
  room: string;
  duration: string;
  spots: number;
  total: number;
  type: string;
  booked: boolean;
};

export type Visit = {
  id: string;
  clientId: string;
  name: string;
  time: string;
  zone: string;
  ok: boolean;
  status: string;
};

export type TrainerClient = {
  id: string;
  name: string;
  initials: string;
  phone?: string;
  packageDone: number;
  packageTotal: number;
  status: 'active' | 'new' | 'warn' | 'done';
  age: number;
  weight: number;
  goal: string;
  nextSession: string;
};

export type TrainerClientInput = Omit<TrainerClient, 'id'> & { id?: string };

export type Trainer = {
  id: string;
  name: string;
  initials: string;
  spec: string;
  rate: string;
  rating: string;
  clients: number;
};

export type TrainerInput = Omit<Trainer, 'id'> & { id?: string };

export type Hall = {
  id: string;
  name: string;
  area: string;
  capacity: number;
  open: boolean;
  loadPct: number;
};

export type HallInput = Omit<Hall, 'id'> & { id?: string };

export type AdminShift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  staffId: string;
  staffName: string;
  role: 'trainer' | 'reception' | 'admin';
  station: string;
  status: 'planned' | 'done' | 'late' | 'cancelled';
  payout: number;
  notes: string;
};

export type AdminShiftInput = Omit<AdminShift, 'id'> & { id?: string };

export type AdminSetting = {
  key: string;
  label: string;
  value: boolean;
  note: string;
};

export type WorkoutExercise = {
  id: string;
  planId: string;
  name: string;
  sets: string;
  weight: string;
};

export type ProgressMeasure = {
  id: string;
  label: string;
  val: string;
  delta: string;
  createdAt: number;
};

export type ProgressLift = {
  id: string;
  name: string;
  val: string;
  delta: string;
  sessions: number;
  createdAt: number;
};

export type ProgressMeasureInput = Omit<ProgressMeasure, 'id' | 'createdAt'>;

export type ProgressLiftInput = Omit<ProgressLift, 'id' | 'createdAt'>;

export type WorkoutPlan = {
  id: string;
  clientId: string;
  client: string;
  goal: string;
  sessions: number;
  done: number;
  exercises: WorkoutExercise[];
};

export type ProgressData = {
  weightPoints: number[];
  measures: { label: string; val: string; delta: string }[];
  lifts: { name: string; val: string; delta: string; sessions: number }[];
  history: { date: string; time: string; name: string }[];
  heatmap: number[];
};

export type Tariff = {
  id: string;
  label: string;
  price: string;
  sub: string;
  badge?: string;
  membershipTitle: string;
};

export type Payment = {
  id: string;
  name: string;
  amount: number;
  method: string;
  date: string;
  tariff: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  from: 'client' | 'trainer';
  text: string;
  time: string;
};

export type Chat = {
  id: string;
  clientId: string;
  name: string;
  initials: string;
  phone?: string;
  last: string;
  time: string;
  unread: number;
};

export type NotificationKind = 'booking' | 'payment' | 'system' | 'chat' | 'recommendation';

export type Notification = {
  id: string;
  userId: string;
  role: Role;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number;
  readAt: number | null;
};

export type AppData = {
  user: User;
  membership: Membership;
  classes: FitnessClass[];
  visits: Visit[];
  trainerClients: TrainerClient[];
  trainers: Trainer[];
  halls: Hall[];
  shifts: AdminShift[];
  settings: AdminSetting[];
  workoutPlans: WorkoutPlan[];
  progress: ProgressData;
  tariffs: Tariff[];
  payments: Payment[];
  chats: Chat[];
  messages: ChatMessage[];
  notifications: Notification[];
};

export type OneCAction =
  | { type: 'bookClass'; classId: string }
  | { type: 'cancelClass'; classId: string }
  | { type: 'checkIn'; clientId: string; zone: string }
  | { type: 'freezeMembership' }
  | { type: 'renewMembership'; tariffId: string }
  | { type: 'sendMessage'; chatId: string; text: string }
  | { type: 'addClient'; client: TrainerClientInput }
  | { type: 'saveTrainer'; trainer: TrainerInput }
  | { type: 'addHall'; hall: HallInput }
  | { type: 'saveShift'; shift: AdminShiftInput }
  | { type: 'setSetting'; key: string; value: boolean };
