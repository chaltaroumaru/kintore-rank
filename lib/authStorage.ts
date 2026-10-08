import 'expo-sqlite/localStorage/install';

// ネイティブ: expo-sqlite が提供する localStorage にセッションを保存する
export const authStorage = globalThis.localStorage;
