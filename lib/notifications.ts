import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D9E75',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({
  projectId: process.env.EXPO_PUBLIC_APP_VARIANT === 'dev'
    ? '0936013b-5797-45ac-b1cb-6f6e3134d385'
    : 'e7709b1f-aabd-49a4-86c9-f6c7ae3b16db',
});

  return token.data;
}

export async function savePushToken(token: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('profiles').upsert({
    id: session.user.id,
    push_token: token,
  });
}

// Испраќа една нотификација
export async function sendPushNotification(token: string, title: string, body: string) {
  // Не чека одговор — fire and forget
  fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title,
      body,
      sound: 'default',
      channelId: 'default',
    }),
  }).catch(() => {}); // Игнорирај грешки — нотификациите не се критични
}

// Испраќа повеќе нотификации одеднаш (batch)
export async function sendPushNotificationsBatch(
  tokens: string[],
  title: string,
  body: string
) {
  if (tokens.length === 0) return;

  // Expo дозволува максимум 100 нотификации по барање
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 100) {
    chunks.push(tokens.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const messages = chunk.map(token => ({
      to: token,
      title,
      body,
      sound: 'default',
      channelId: 'default',
    }));

    // Fire and forget — не чека одговор
    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    }).catch(() => {});
  }
}