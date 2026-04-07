/**
 * useDolarRate.js
 * Hook que obtiene la cotización del dólar desde el backend proxy (/api/dolar).
 * Usa RTK Query si ya existe una slice, pero al ser un endpoint propio lo parseamos directamente.
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * @typedef {Object} DolarRate
 * @property {{ compra: number|null, venta: number|null }} oficial
 * @property {{ compra: number|null, venta: number|null }} blue
 * @property {string|null} lastUpdate
 * @property {string} source
 * @property {boolean} cached
 */

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
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/dolar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setDolar(data);
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
