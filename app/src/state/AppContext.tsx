import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import {
  AppData,
  AdminShiftInput,
  HallInput,
  ProgressLiftInput,
  ProgressMeasureInput,
  Role,
  TrainerClientInput,
  TrainerInput,
  Visit,
  WorkoutPlan,
  OneCAction,
} from '../api/types';
import {
  addHallToDb,
  addMessageToDb,
  addProgressLiftToDb,
  addProgressMeasureToDb,
  addTrainerClientToDb,
  addVisitToDb,
  bookClassInDb,
  cancelClassInDb,
  freezeMembershipInDb,
  deleteWorkoutPlanFromDb,
  loadAppData,
  markNotificationReadInDb,
  renewMembershipInDb,
  saveShiftToDb,
  saveWorkoutPlanToDb,
  setAdminSettingInDb,
  upsertTrainerInDb,
} from '../db/database';
import { defaultSyncService, type SyncStatus } from '../services/sync1C';

type AppContextValue = {
  data: AppData | null;
  loading: boolean;
  error: string | null;
  role: Role | null;
  setRole: (role: Role | null) => void;
  reload: () => Promise<void>;
  bookClass: (classId: string) => Promise<void>;
  cancelClass: (classId: string) => Promise<void>;
  checkIn: (clientId?: string, zone?: string) => Promise<boolean>;
  freezeMembership: () => Promise<void>;
  renewMembership: (tariffId: string, title: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  trainerChatId: string | null;
  setTrainerChatId: (chatId: string | null) => void;
  addClient: (client: TrainerClientInput) => Promise<void>;
  saveTrainer: (trainer: TrainerInput) => Promise<void>;
  addHall: (hall: HallInput) => Promise<void>;
  saveShift: (shift: AdminShiftInput) => Promise<void>;
  setSetting: (key: string, value: boolean, label?: string, note?: string) => Promise<void>;
  addProgressMeasure: (measure: ProgressMeasureInput) => Promise<void>;
  addProgressLift: (lift: ProgressLiftInput) => Promise<void>;
  saveWorkoutPlan: (plan: WorkoutPlan) => Promise<void>;
  deleteWorkoutPlan: (planId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  syncStatus: SyncStatus | null;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const nowTime = () =>
  new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

const SYNC_INTERVAL_MS = 30_000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [trainerChatId, setTrainerChatId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Keep the latest data available inside async callbacks.
  const dataRef = useRef<AppData | null>(null);
  dataRef.current = data;

  const refreshData = useCallback(async (): Promise<AppData> => {
    const next = await loadAppData();
    setData(next);
    setError(null);
    return next;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await refreshData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить данные клуба из локальной базы';
      setError(message);
      setData(null);
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  }, [refreshData]);

  useEffect(() => {
    reload();
  }, [reload]);

  const refreshSyncStatus = useCallback(async () => {
    const status = await defaultSyncService.getStatus();
    setSyncStatus(status);
    return status;
  }, []);

  const enqueueSyncAction = useCallback(async (action: OneCAction) => {
    await defaultSyncService.enqueue(action);
    await refreshSyncStatus();
  }, [refreshSyncStatus]);

  const syncNow = useCallback(async () => {
    const status = await defaultSyncService.syncNow();
    setSyncStatus(status);
  }, []);

  useEffect(() => {
    let mounted = true;

    const runSync = async () => {
      try {
        const status = await defaultSyncService.processQueue();
        if (mounted) {
          setSyncStatus(status);
        }
      } catch {
        if (mounted) {
          await refreshSyncStatus();
        }
      }
    };

    void refreshSyncStatus();
    const intervalId = setInterval(runSync, SYNC_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void runSync();
      }
    });

    return () => {
      mounted = false;
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [refreshSyncStatus]);

  const bookClass = useCallback(async (classId: string) => {
    const booked = await bookClassInDb(classId);
    if (!booked) {
      throw new Error('Занятие уже занято, отменено или мест больше нет.');
    }
    await enqueueSyncAction({ type: 'bookClass', classId });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const cancelClass = useCallback(async (classId: string) => {
    const cancelled = await cancelClassInDb(classId);
    if (!cancelled) {
      throw new Error('Запись уже отменена или не найдена.');
    }
    await enqueueSyncAction({ type: 'cancelClass', classId });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const checkIn = useCallback(async (
    clientId = 'client-anna',
    zone = 'Ресепшн',
  ): Promise<boolean> => {
    const current = dataRef.current ?? await loadAppData();

    if (current.membership.status === 'frozen') {
      throw new Error('Абонемент заморожен. Чек-ин недоступен.');
    }
    if (current.membership.status === 'expired') {
      throw new Error('Абонемент истёк. Чек-ин недоступен.');
    }

    const client = current.trainerClients.find(item => item.id === clientId);
    const visit: Visit = {
      id: `visit-${Date.now()}`,
      clientId,
      name: client?.name ?? current.user.name,
      time: nowTime(),
      zone,
      ok: true,
      status: '✓',
    };

    const inserted = await addVisitToDb(visit);
    if (inserted) {
      await enqueueSyncAction({ type: 'checkIn', clientId, zone });
      await refreshData();
    }
    return inserted;
  }, [enqueueSyncAction, refreshData]);

  const freezeMembership = useCallback(async () => {
    const current = dataRef.current ?? await loadAppData();

    if (current.membership.status === 'frozen') {
      throw new Error('Абонемент уже заморожен.');
    }
    if (current.membership.status === 'expired') {
      throw new Error('Истекший абонемент нельзя заморозить.');
    }
    if (current.membership.freezesLeft <= 0) {
      throw new Error('Лимит заморозок уже использован.');
    }

    const frozen = await freezeMembershipInDb();
    if (!frozen) {
      throw new Error('Не удалось заморозить абонемент.');
    }
    await enqueueSyncAction({ type: 'freezeMembership' });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const renewMembership = useCallback(async (tariffId: string, title: string) => {
    await renewMembershipInDb(tariffId, title);
    await enqueueSyncAction({ type: 'renewMembership', tariffId });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const sendMessage = useCallback(async (chatId: string, text: string) => {
    const clean = text.trim();
    if (!clean) return;
    await addMessageToDb({
      id: `msg-${Date.now()}`,
      chatId,
      from: 'trainer',
      text: clean,
      time: nowTime(),
    });
    await enqueueSyncAction({ type: 'sendMessage', chatId, text: clean });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const addClient = useCallback(async (client: TrainerClientInput) => {
    await addTrainerClientToDb(client);
    await enqueueSyncAction({ type: 'addClient', client });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const saveTrainer = useCallback(async (trainer: TrainerInput) => {
    await upsertTrainerInDb(trainer);
    await enqueueSyncAction({ type: 'saveTrainer', trainer });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const addHall = useCallback(async (hall: HallInput) => {
    await addHallToDb(hall);
    await enqueueSyncAction({ type: 'addHall', hall });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const saveShift = useCallback(async (shift: AdminShiftInput) => {
    await saveShiftToDb(shift);
    await enqueueSyncAction({ type: 'saveShift', shift });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const setSetting = useCallback(async (key: string, value: boolean, label = key, note = '') => {
    await setAdminSettingInDb(key, label, value, note);
    await enqueueSyncAction({ type: 'setSetting', key, value });
    await refreshData();
  }, [enqueueSyncAction, refreshData]);

  const addProgressMeasure = useCallback(async (measure: ProgressMeasureInput) => {
    await addProgressMeasureToDb(measure);
    await refreshData();
  }, [refreshData]);

  const addProgressLift = useCallback(async (lift: ProgressLiftInput) => {
    await addProgressLiftToDb(lift);
    await refreshData();
  }, [refreshData]);

  const saveWorkoutPlan = useCallback(async (plan: WorkoutPlan) => {
    await saveWorkoutPlanToDb(plan);
    await refreshData();
  }, [refreshData]);

  const deleteWorkoutPlan = useCallback(async (planId: string) => {
    await deleteWorkoutPlanFromDb(planId);
    await refreshData();
  }, [refreshData]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    await markNotificationReadInDb(notificationId);
    await refreshData();
  }, [refreshData]);

  const value: AppContextValue = {
    data,
    loading,
    error,
    role,
    setRole,
    reload,
    bookClass,
    cancelClass,
    checkIn,
    freezeMembership,
    renewMembership,
    sendMessage,
    trainerChatId,
    setTrainerChatId,
    addClient,
    saveTrainer,
    addHall,
    saveShift,
    setSetting,
    addProgressMeasure,
    addProgressLift,
    saveWorkoutPlan,
    deleteWorkoutPlan,
    markNotificationRead,
    syncStatus,
    pendingSyncCount: syncStatus ? syncStatus.pending + syncStatus.processing + syncStatus.failed : 0,
    syncNow,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return value;
}
