/**
 * usePushNotifications
 *
 * Hook para agentes (admins) de la inmobiliaria.
 * - Solicita permisos de notificaciones push
 * - Obtiene el Expo push token del dispositivo
 * - Lo registra en el backend (PUT /api/auth/push-token)
 * - Configura listeners para notificaciones recibidas en foreground
 *
 * Solo activo cuando hay un token de agente en Redux.
 */

import { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// Configuración de cómo mostrar notificaciones mientras la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // En simulador/emulador no se pueden obtener tokens reales
    return null;
  }

  // Canal Android (debe crearse antes de pedir permisos)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('comprobantes', {
      name: 'Comprobantes de pago',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22c55e',
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // projectId viene de app.json → extra.eas.projectId
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('usePushNotifications: falta extra.eas.projectId en app.json');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

async function sendTokenToBackend(token: string, authToken: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/push-token`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ pushToken: token }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.warn('usePushNotifications: error al registrar token', body);
  }
}

export function usePushNotifications() {
  const agentToken = useSelector((s: RootState) => s.auth.token);
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  useEffect(() => {
    // Solo registrar cuando el agente está logueado
    if (!agentToken) return;

    let mounted = true;

    (async () => {
      try {
        const pushToken = await registerForPushNotifications();
        if (!pushToken || !mounted) return;

        await sendTokenToBackend(pushToken, agentToken);
      } catch (err) {
        // No bloquear la app por este error
        console.warn('usePushNotifications: error en registro', err);
      }
    })();

    // Listener: notificación recibida en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body } = notification.request.content;
        if (title && body) {
          Alert.alert(title, body);
        }
      }
    );

    // Listener: usuario tocó la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // Espacio para navegar a la pantalla de comprobantes si se desea
        // const data = _response.notification.request.content.data;
      }
    );

    return () => {
      mounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [agentToken]);
}
