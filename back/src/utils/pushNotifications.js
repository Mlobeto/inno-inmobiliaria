/**
 * Push Notifications — Expo Push HTTP API
 *
 * Envía notificaciones a admins/agentes de un tenant usando la API HTTP de Expo.
 * No requiere SDK nativo — funciona desde Node con axios.
 *
 * Ref: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const axios = require('axios');
const prisma = require('./prismaClient');
const logger = require('./logger');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envía una notificación push a todos los admins de un tenant que tengan pushToken registrado.
 *
 * @param {number} tenantId
 * @param {string} title
 * @param {string} body
 * @param {object} [data={}]  — datos extras accesibles en la app
 */
async function sendToTenant(tenantId, title, body, data = {}) {
  try {
    // Obtener todos los admins del tenant con pushToken registrado
    const admins = await prisma.admins.findMany({
      where: {
        tenantId,
        deletedAt: null,
        pushToken: { not: null },
      },
      select: { adminId: true, pushToken: true },
    });

    if (!admins.length) return;

    const messages = admins
      .filter((a) => a.pushToken && a.pushToken.startsWith('ExponentPushToken'))
      .map((a) => ({
        to: a.pushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'comprobantes',
      }));

    if (!messages.length) return;

    // La API acepta hasta 100 mensajes por request — chunking simple
    const CHUNK = 100;
    for (let i = 0; i < messages.length; i += CHUNK) {
      const chunk = messages.slice(i, i + CHUNK);
      const response = await axios.post(EXPO_PUSH_URL, chunk, {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      // Log de errores por token individual
      const { data: result } = response;
      if (Array.isArray(result?.data)) {
        result.data.forEach((ticket, idx) => {
          if (ticket.status === 'error') {
            logger.warn('Push notification error', {
              token: chunk[idx]?.to,
              error: ticket.message,
              details: ticket.details,
            });
          }
        });
      }
    }

    logger.info('Push notifications sent', { tenantId, count: messages.length, title });
  } catch (err) {
    // No lanzar — una falla de notificación no debe cortar el flujo principal
    logger.error('pushNotifications.sendToTenant error', { tenantId, error: err.message });
  }
}

module.exports = { sendToTenant };
