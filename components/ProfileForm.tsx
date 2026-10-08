import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, Chip, ErrorText, Field, Label } from '@/components/ui';
import { PREFECTURES } from '@/constants/prefectures';
import { space } from '@/constants/theme';
import { upsertProfile } from '@/lib/db';
import { CATEGORY_LABEL } from '@/lib/exercises';
import type { Category, Profile } from '@/lib/types';

type Props = {
  userId: string;
  initial: Profile | null;
  submitLabel: string;
  onSaved: (p: Profile) => void;
};

/** 初期設定とプロフィール編集で共用するフォーム */
export default function ProfileForm({ userId, initial, submitLabel, onSaved }: Props) {
  const [nickname, setNickname] = useState(initial?.nickname ?? '');
  const [height, setHeight] = useState(initial?.height_cm != null ? String(initial.height_cm) : '');
  const [weight, setWeight] = useState(initial ? String(initial.weight_kg) : '');
  const [prefecture, setPrefecture] = useState<string | null>(initial?.prefecture ?? null);
  const [category, setCategory] = useState<Category>(initial?.main_category ?? 'gym');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const name = nickname.trim();
    const w = Number(weight);
    const h = height.trim() === '' ? null : Number(height);
    if (name.length < 1 || name.length > 20) return setError('ニックネームは1〜20文字で入力してください');
    if (!Number.isFinite(w) || w < 20 || w > 300) return setError('体重は20〜300kgの範囲で入力してください');
    if (h !== null && (!Number.isFinite(h) || h < 100 || h > 250))
      return setError('身長は100〜250cmの範囲で入力してください');

    setError(null);
    setSaving(true);
    try {
      const saved = await upsertProfile({
        id: userId,
        nickname: name,
        height_cm: h,
        weight_kg: w,
        prefecture,
        main_category: category,
      });
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: space.lg }}>
      <Field label="ニックネーム" value={nickname} onChangeText={setNickname} maxLength={20} placeholder="例: ベンチ太郎" />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Field label="身長 (cm・任意)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="170" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="体重 (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="65" />
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Label>メインカテゴリ</Label>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <Chip key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Label>都道府県 (任意・地域ランキング用)</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {PREFECTURES.map((p) => (
            <Chip key={p} label={p} selected={prefecture === p} onPress={() => setPrefecture(prefecture === p ? null : p)} />
          ))}
        </ScrollView>
      </View>

      <ErrorText>{error}</ErrorText>
      <Button title={submitLabel} onPress={submit} loading={saving} />
    </View>
  );
}
