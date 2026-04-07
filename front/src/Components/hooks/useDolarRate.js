/**
 * useDolarRate.js
 * Hook que obtiene la cotización del dólar.
 * Intenta primero el proxy del backend (/api/dolar).
 * Si no está disponible (404/error), llama directamente a Bluelytics.
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const BLUELYTICS_URL = 'https://api.bluelytics.com.ar/v2/latest';

/**
 * @typedef {Object} DolarRate
 * @property {{ compra: number|null, venta: number|null }} oficial
 * @property {{ compra: number|null, venta: number|null }} blue
 * @property {string|null} lastUpdate
 * @property {string} source
 * @property {boolean} cached
 */

/** Normaliza la respuesta cruda de Bluelytics al formato interno */
function normalizeBluelytics(raw) {
  return {
    oficial: {
      compra: raw.oficial?.value_buy ?? null,
      venta: raw.oficial?.value_sell ?? null,
    },
    blue: {
      compra: raw.blue?.value_buy ?? null,
      venta: raw.blue?.value_sell ?? null,
    },
    lastUpdate: raw.last_update ?? null,
    source: 'bluelytics.com.ar (directo)',
    cached: false,
  };
}

/**
 * Hook para obtener la cotización del dólar.
 * @returns {{ dolar: DolarRate|null, loading: boolean, error: string|null, refetch: Function }}
 */
export function useDolarRate() {
  const [dolar, setDolar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Intentar el proxy del backend
      const token = localStorage.getItem('token');
      const backendRes = await fetch(`${API_BASE}/dolar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        setDolar(data);
        return;
      }

      // 2) Proxy no disponible (backend no desplegado aún) → llamar directamente
      console.warn(`[useDolarRate] Backend proxy devolvió ${backendRes.status}, usando Bluelytics directo`);
      const directRes = await fetch(BLUELYTICS_URL);
      if (!directRes.ok) throw new Error(`Bluelytics ${directRes.status}`);
      const raw = await directRes.json();
      setDolar(normalizeBluelytics(raw));

    } catch (err) {
      setError('No se pudo obtener la cotización del dólar');
      console.error('[useDolarRate]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return { dolar, loading, error, refetch: fetchRate };
}
