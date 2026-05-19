const crypto = require('crypto');

function getSigningSecret() {
  return process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || '';
}

/**
 * State firmado para OAuth ML: tenant_{id}.{hmac}
 * Evita que un atacante vincule tokens a otro tenant manipulando ?state=
 */
function signMlOAuthState(tenantId) {
  const id = Number(tenantId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('tenantId inválido para state OAuth ML');
  }
  const payload = `tenant_${id}`;
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error('Falta JWT_SECRET_KEY para firmar state OAuth de Mercado Libre');
  }
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 20);
  return `${payload}.${sig}`;
}

function verifyMlOAuthState(state) {
  if (!state || typeof state !== 'string') return null;

  const secret = getSigningSecret();
  if (!secret) return null;

  const dot = state.lastIndexOf('.');
  if (dot <= 0) return null;

  const payload = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  if (!payload.startsWith('tenant_')) return null;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 20);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }

  const tenantId = parseInt(payload.replace('tenant_', ''), 10);
  return tenantId > 0 && !Number.isNaN(tenantId) ? tenantId : null;
}

/** Compatibilidad: state antiguo sin firma (solo durante transición). */
function parseLegacyMlOAuthState(state) {
  if (!state || typeof state !== 'string') return null;
  if (state.includes('.')) return null;
  if (!state.startsWith('tenant_')) return null;
  const tenantId = parseInt(state.replace('tenant_', ''), 10);
  return tenantId > 0 && !Number.isNaN(tenantId) ? tenantId : null;
}

function resolveMlOAuthTenantId(state) {
  return verifyMlOAuthState(state) ?? parseLegacyMlOAuthState(state);
}

module.exports = {
  signMlOAuthState,
  verifyMlOAuthState,
  resolveMlOAuthTenantId,
};
