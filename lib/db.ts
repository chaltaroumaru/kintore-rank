import { supabase } from './supabase';
import type { NewWorkoutLog, Profile, WorkoutLog } from './types';

function num<T extends Record<string, unknown>>(row: T, keys: (keyof T)[]): T {
  // numeric 型は文字列で返ることがあるので数値に揃える
  const out = { ...row };
  for (const k of keys) {
    const v = out[k];
    if (typeof v === 'string') (out as Record<keyof T, unknown>)[k] = Number(v);
  }
  return out;
}

function toProfile(row: Record<string, unknown>): Profile {
  return num(row, ['height_cm', 'weight_kg']) as unknown as Profile;
}

function toLog(row: Record<string, unknown>): WorkoutLog {
  return num(row, ['weight_kg', 'body_weight_kg']) as unknown as WorkoutLog;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? toProfile(data) : null;
}

export async function upsertProfile(profile: Profile): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return toProfile(data);
}

/** 自分の全記録 (新しい順)。Phase 1 の想定件数ならページングなしで十分 */
export async function fetchLogs(): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .order('performed_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map(toLog);
}

export async function insertLog(userId: string, log: NewWorkoutLog, bodyWeightKg: number | null): Promise<WorkoutLog> {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({ ...log, user_id: userId, body_weight_kg: bodyWeightKg })
    .select()
    .single();
  if (error) throw error;
  return toLog(data);
}

export async function deleteLog(id: string): Promise<void> {
  const { error } = await supabase.from('workout_logs').delete().eq('id', id);
  if (error) throw error;
}
