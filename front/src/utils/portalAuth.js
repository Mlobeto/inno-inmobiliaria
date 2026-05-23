const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function portalTokenKey(subdomain) {
  return `portal_token_${subdomain}`;
}

export function portalClientKey(subdomain) {
  return `portal_client_${subdomain}`;
}

export function getPortalToken(subdomain) {
  return localStorage.getItem(portalTokenKey(subdomain));
}

export function getPortalClient(subdomain) {
  try {
    const raw = localStorage.getItem(portalClientKey(subdomain));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePortalSession(subdomain, token, client) {
  localStorage.setItem(portalTokenKey(subdomain), token);
  localStorage.setItem(portalClientKey(subdomain), JSON.stringify(client));
}

export function clearPortalSession(subdomain) {
  localStorage.removeItem(portalTokenKey(subdomain));
  localStorage.removeItem(portalClientKey(subdomain));
}

export async function lookupPortalTenant(subdomain) {
  const res = await fetch(
    `${API_URL}/portal/tenant?code=${encodeURIComponent(subdomain.toLowerCase())}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Inmobiliaria no encontrada');
  return data;
}

export async function portalLogin(subdomain, { email, cuil, tenantId }) {
  const res = await fetch(`${API_URL}/portal/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': String(tenantId),
    },
    body: JSON.stringify({ email, cuil, tenantId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Credenciales inválidas');
  return data;
}

export async function fetchPortalMisPagos(subdomain, token) {
  const res = await fetch(`${API_URL}/portal/mis-pagos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Error al cargar pagos');
  return data.data;
}

export async function informarPagoPortal(subdomain, token, formData) {
  const res = await fetch(`${API_URL}/portal/informar-pago`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Error al enviar comprobante');
  return data.data;
}
