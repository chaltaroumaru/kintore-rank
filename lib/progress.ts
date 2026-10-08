import type { WorkoutLog } from './types';

/** 記録の並び順: performed_on → created_at の昇順 */
export function compareChrono(a: WorkoutLog, b: WorkoutLog): number {
  if (a.performed_on !== b.performed_on) return a.performed_on < b.performed_on ? -1 : 1;
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  return 0;
}

/**
 * 自己ベストの序列。正なら a が上。
 * Phase 1: 重量(自重は加重) → 回数。Phase 2 で推定1RM比較に差し替える。
 */
export function compareBest(a: WorkoutLog, b: WorkoutLog): number {
  if (a.weight_kg !== b.weight_kg) return a.weight_kg - b.weight_kg;
  return a.reps - b.reps;
}

export type Diff = {
  weight: number;
  reps: number;
  sets: number;
};

export type LogInsight = {
  log: WorkoutLog;
  previous: WorkoutLog | null;
  diff: Diff | null;
  /** 初記録 */
  isFirst: boolean;
  /** それ以前のベストを上回った */
  isPersonalBest: boolean;
};

/**
 * ログ配列(順不同・複数種目混在可)から、各記録の前回比較と自己ベスト更新を計算する。
 * 戻り値は入力と同じ id をキーにした Map。
 */
export function buildInsights(logs: WorkoutLog[]): Map<string, LogInsight> {
  const result = new Map<string, LogInsight>();
  const byExercise = new Map<string, WorkoutLog[]>();
  for (const log of logs) {
    const list = byExercise.get(log.exercise_id) ?? [];
    list.push(log);
    byExercise.set(log.exercise_id, list);
  }

  for (const list of byExercise.values()) {
    list.sort(compareChrono);
    let best: WorkoutLog | null = null;
    let previous: WorkoutLog | null = null;
    for (const log of list) {
      result.set(log.id, {
        log,
        previous,
        diff: previous ? diffOf(log, previous) : null,
        isFirst: previous === null,
        isPersonalBest: best !== null && compareBest(log, best) > 0,
      });
      if (best === null || compareBest(log, best) > 0) best = log;
      previous = log;
    }
  }
  return result;
}

export function diffOf(current: WorkoutLog, previous: WorkoutLog): Diff {
  return {
    weight: round(current.weight_kg - previous.weight_kg),
    reps: current.reps - previous.reps,
    sets: current.sets - previous.sets,
  };
}

/** 種目ごとの自己ベスト */
export function personalBests(logs: WorkoutLog[]): Map<string, WorkoutLog> {
  const bests = new Map<string, WorkoutLog>();
  for (const log of logs) {
    const cur = bests.get(log.exercise_id);
    if (!cur || compareBest(log, cur) > 0 || (compareBest(log, cur) === 0 && compareChrono(log, cur) < 0)) {
      bests.set(log.exercise_id, log);
    }
  }
  return bests;
}

/** 差分を「+1回」「-2.5kg」のような表示用ラベルの配列にする。変化なしの項目は省く */
export function diffLabels(diff: Diff): string[] {
  const labels: string[] = [];
  if (diff.weight !== 0) labels.push(`${signed(diff.weight)}kg`);
  if (diff.reps !== 0) labels.push(`${signed(diff.reps)}回`);
  if (diff.sets !== 0) labels.push(`${signed(diff.sets)}セット`);
  return labels;
}

/** 差分の総合判定: 1=成長 / 0=変化なし / -1=後退 (重量→回数→セットの優先度) */
export function diffTrend(diff: Diff): -1 | 0 | 1 {
  for (const v of [diff.weight, diff.reps, diff.sets]) {
    if (v > 0) return 1;
    if (v < 0) return -1;
  }
  return 0;
}

export function formatSet(log: Pick<WorkoutLog, 'category' | 'weight_kg' | 'reps' | 'sets'>): string {
  const sets = log.sets > 1 ? ` × ${log.sets}セット` : '';
  if (log.category === 'bodyweight') {
    const added = log.weight_kg > 0 ? ` (+${fmt(log.weight_kg)}kg)` : '';
    return `${log.reps}回${added}${sets}`;
  }
  return `${fmt(log.weight_kg)}kg × ${log.reps}回${sets}`;
}

function signed(n: number): string {
  return n > 0 ? `+${fmt(n)}` : fmt(n);
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(round(n));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
