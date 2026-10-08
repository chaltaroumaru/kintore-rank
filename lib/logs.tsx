import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import { deleteLog, fetchLogs, insertLog } from './db';
import { buildInsights, compareChrono, personalBests, type LogInsight } from './progress';
import type { NewWorkoutLog, WorkoutLog } from './types';

type LogsState = {
  /** 新しい順 */
  logs: WorkoutLog[];
  insights: Map<string, LogInsight>;
  bests: Map<string, WorkoutLog>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** 保存して、その記録の前回比較・自己ベスト判定を返す */
  add: (log: NewWorkoutLog) => Promise<LogInsight>;
  remove: (id: string) => Promise<void>;
};

const LogsContext = createContext<LogsState | null>(null);

export function LogsProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setLogs(await fetchLogs());
    } catch (e) {
      setError(e instanceof Error ? e.message : '記録の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const insights = useMemo(() => buildInsights(logs), [logs]);
  const bests = useMemo(() => personalBests(logs), [logs]);

  const add = useCallback(
    async (log: NewWorkoutLog) => {
      if (!userId) throw new Error('ログインが必要です');
      const saved = await insertLog(userId, log, profile?.weight_kg ?? null);
      // 過去日付で記録しても新しい順を保つ
      const next = [saved, ...logs].sort((a, b) => compareChrono(b, a));
      setLogs(next);
      return buildInsights(next).get(saved.id)!;
    },
    [userId, profile?.weight_kg, logs]
  );

  const remove = useCallback(async (id: string) => {
    await deleteLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const value = useMemo<LogsState>(
    () => ({ logs, insights, bests, loading, error, reload, add, remove }),
    [logs, insights, bests, loading, error, reload, add, remove]
  );

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>;
}

export function useLogs(): LogsState {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error('useLogs must be used inside LogsProvider');
  return ctx;
}
