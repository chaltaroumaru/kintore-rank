export type Category = 'gym' | 'bodyweight';

export type Profile = {
  id: string;
  nickname: string;
  height_cm: number | null;
  weight_kg: number;
  prefecture: string | null;
  main_category: Category;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  performed_on: string; // YYYY-MM-DD
  exercise_id: string;
  category: Category;
  weight_kg: number;
  reps: number;
  sets: number;
  memo: string | null;
  body_weight_kg: number | null;
  created_at: string;
};

export type NewWorkoutLog = Pick<
  WorkoutLog,
  'performed_on' | 'exercise_id' | 'category' | 'weight_kg' | 'reps' | 'sets' | 'memo'
>;
