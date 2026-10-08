import type { Category } from './types';

export type Exercise = {
  id: string;
  name: string;
  category: Category;
  /** 自重種目の難易度 (1〜5)。Phase 2 のポイント計算で使用 */
  difficulty?: number;
};

export const EXERCISES: Exercise[] = [
  // ジム
  { id: 'bench_press', name: 'ベンチプレス', category: 'gym' },
  { id: 'squat', name: 'スクワット', category: 'gym' },
  { id: 'deadlift', name: 'デッドリフト', category: 'gym' },
  { id: 'overhead_press', name: 'ショルダープレス', category: 'gym' },
  { id: 'barbell_row', name: 'ベントオーバーロウ', category: 'gym' },
  { id: 'lat_pulldown', name: 'ラットプルダウン', category: 'gym' },
  { id: 'leg_press', name: 'レッグプレス', category: 'gym' },
  { id: 'dumbbell_curl', name: 'ダンベルカール', category: 'gym' },
  // 自重 (難易度順)
  { id: 'push_up', name: '腕立て伏せ', category: 'bodyweight', difficulty: 1 },
  { id: 'decline_push_up', name: '足上げ腕立て', category: 'bodyweight', difficulty: 2 },
  { id: 'diamond_push_up', name: 'ダイヤモンド腕立て', category: 'bodyweight', difficulty: 3 },
  { id: 'one_arm_push_up', name: '片手腕立て', category: 'bodyweight', difficulty: 5 },
  { id: 'pull_up', name: '懸垂', category: 'bodyweight', difficulty: 3 },
  { id: 'dips', name: 'ディップス', category: 'bodyweight', difficulty: 3 },
  { id: 'bodyweight_squat', name: '自重スクワット', category: 'bodyweight', difficulty: 1 },
  { id: 'pistol_squat', name: 'ピストルスクワット', category: 'bodyweight', difficulty: 4 },
];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}

export function exerciseName(id: string): string {
  return byId.get(id)?.name ?? id;
}

export function exercisesOf(category: Category): Exercise[] {
  return EXERCISES.filter((e) => e.category === category);
}

export const CATEGORY_LABEL: Record<Category, string> = {
  gym: 'ジム',
  bodyweight: '自重',
};
