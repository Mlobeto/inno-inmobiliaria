// routes/dolar.js
// Proxy interno para cotización del dólar - usa Bluelytics (fuente: Banco Nación, blue, MEP, CCL)
// Sin API key requerida. Documentación: https://bluelytics.com.ar/#!/api

const { Router } = require('express');
const axios = require('axios');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// Cache simple en memoria para no hammear la API externa
let cache = { data: null, fetchedAt: null };
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = Date.now();

    // Servir desde caché si está vigente
    if (cache.data && cache.fetchedAt && (now - cache.fetchedAt) < CACHE_TTL_MS) {
      return res.json({ ...cache.data, cached: true, cachedAt: new Date(cache.fetchedAt).toISOString() });
    }

    // Fetch a Bluelytics
    const { data: raw } = await axios.get('https://api.bluelytics.com.ar/v2/latest', { timeout: 8000 });

    const data = {
      oficial: {
        compra: raw.oficial?.value_buy ?? null,
        venta: raw.oficial?.value_sell ?? null,
      },
      blue: {
        compra: raw.blue?.value_buy ?? null,
        venta: raw.blue?.value_sell ?? null,
      },
      lastUpdate: raw.last_update ?? null,
      source: 'bluelytics.com.ar',
      cached: false,
      cachedAt: new Date(now).toISOString(),
    };

    cache = { data, fetchedAt: now };

    return res.json(data);
  } catch (error) {
    console.error('[Dolar proxy] Error:', error.message);

    // Si hay caché vencida, mejor devolverla que devolver error
    if (cache.data) {
      return res.json({ ...cache.data, cached: true, stale: true, cachedAt: new Date(cache.fetchedAt).toISOString() });
    }

    return res.status(502).json({ error: 'No se pudo obtener la cotización del dólar', details: error.message });
  }
});

module.exports = router;
