// Web では expo-notifications が使えないため、同じ形の何もしない実装を置く
import { authStorage } from './authStorage';

export type NotificationSettings = {
  enabled: boolean;
};

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export const notificationsSupported = false;

const STORAGE_KEY = 'kintore.notificationSettings';

export const DEFAULT_SETTINGS: NotificationSettings = { enabled: false };

export async function initNotifications(): Promise<void> {}

export function loadSettings(): NotificationSettings {
  try {
    const raw = authStorage?.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: NotificationSettings): void {
  try {
    authStorage?.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 無視
  }
}

export async function getPermission(): Promise<PermissionState> {
  return 'unsupported';
}

export async function requestPermission(): Promise<PermissionState> {
  return 'unsupported';
}

export async function cancelAll(): Promise<void> {}

export async function sendTestNotification(): Promise<void> {}
