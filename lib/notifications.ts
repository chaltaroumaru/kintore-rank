import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { authStorage } from './authStorage';

/**
 * 通知設定。Phase 1 では ON/OFF と権限管理のみ。
 * 通知の種類 (リマインダー・サボり防止など) は後からここにフィールドを追加する。
 */
export type NotificationSettings = {
  enabled: boolean;
};

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export const notificationsSupported = true;

const STORAGE_KEY = 'kintore.notificationSettings';
const CHANNEL_ID = 'default';

export const DEFAULT_SETTINGS: NotificationSettings = { enabled: false };

/** アプリ起動時に1回呼ぶ: フォアグラウンド時の表示方法と Android の通知チャンネル */
export async function initNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'トレーニング通知',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

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
    // 保存失敗は致命的ではないので無視 (次回起動時は既定値)
  }
}

function toState(status: Notifications.PermissionStatus): PermissionState {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export async function getPermission(): Promise<PermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  return toState(status);
}

export async function requestPermission(): Promise<PermissionState> {
  const { status } = await Notifications.requestPermissionsAsync();
  return toState(status);
}

/** 予約済みの通知をすべて取り消す (通知 OFF 時) */
export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** 動作確認用: 数秒後にテスト通知を出す */
export async function sendTestNotification(seconds = 5): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: 'キントレランク', body: '通知のテストです。設定は正しく動いています。' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: CHANNEL_ID,
    },
  });
}
