const crypto = require('crypto');

/**
 * Middleware que verifica la firma HMAC-SHA256 de los webhooks de MercadoPago.
 *
 * MP envía el header x-signature con el formato: ts=<timestamp>,v1=<hash>
 * El contenido firmado es: id:{data.id};request-id:{x-request-id};ts:{timestamp};
 *
 * Si MP_WEBHOOK_SECRET no está configurado (entorno de desarrollo),
 * el middleware deja pasar la request con un warning. En producción
 * SIEMPRE deberías configurar esta variable.
 *
 * Configuración en MercadoPago:
 * Developers → Tu aplicación → Webhooks → Activar firma secreta → copiar el secreto.
 */
function verifyMpSignature(req, res, next) {
  const secret = process.env.MP_WEBHOOK_SECRET;

  if (!secret) {
    // Sin secreto configurado: pass-through pero advertimos
    if (process.env.NODE_ENV === 'production') {
      console.warn('[verifyMpSignature] ⚠️  MP_WEBHOOK_SECRET no configurado en producción. Verifica tu .env.');
    }
    return next();
  }

  try {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'] || '';

    if (!xSignature) {
      return res.status(401).json({ error: 'Webhook sin firma (x-signature ausente)' });
    }

    // Parsear ts y v1 del header x-signature
    const parts = {};
    xSignature.split(',').forEach((part) => {
      const [key, value] = part.trim().split('=');
      if (key && value) parts[key.trim()] = value.trim();
    });

    const ts = parts['ts'];
    const receivedHash = parts['v1'];

    if (!ts || !receivedHash) {
      return res.status(401).json({ error: 'Formato de firma inválido' });
    }

    // Rechazar webhooks con timestamp muy antiguo (5 minutos) para prevenir replay attacks
    const MAX_AGE_MS = 5 * 60 * 1000;
    if (Date.now() - parseInt(ts, 10) > MAX_AGE_MS) {
      return res.status(401).json({ error: 'Webhook expirado (timestamp demasiado antiguo)' });
    }

    // Construir el manifest que MP firmó
    const dataId = req.body?.data?.id ?? '';
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    // Comparación en tiempo constante para evitar timing attacks
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const receivedBuf = Buffer.from(receivedHash, 'hex');

    if (
      expectedBuf.length !== receivedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      console.warn('[verifyMpSignature] ❌ Firma inválida para webhook MP', {
        xRequestId,
        dataId,
      });
      return res.status(401).json({ error: 'Firma de webhook inválida' });
    }

    next();
  } catch (err) {
    console.error('[verifyMpSignature] Error verificando firma:', err.message);
    return res.status(500).json({ error: 'Error verificando firma del webhook' });
  }
}

module.exports = verifyMpSignature;
