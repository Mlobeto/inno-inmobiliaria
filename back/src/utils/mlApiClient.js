const axios = require('axios');

const ML_AUTH_URL = 'https://auth.mercadolibre.com.ar/authorization';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const ML_API_ROOT = 'https://api.mercadolibre.com';

/**
 * URL OAuth correcta (el SDK mercadolibre@0.0.13 mete redirect_uri como access_token si se
 * pasa mal al constructor).
 */
function buildMlAuthUrl(redirectUri, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ML_CLIENT_ID,
    redirect_uri: redirectUri,
  });
  if (state) {
    params.set('state', state);
  }
  return `${ML_AUTH_URL}?${params.toString()}`;
}

async function postTokenForm(bodyParams) {
  const body = new URLSearchParams(bodyParams);
  try {
    const { data } = await axios.post(ML_TOKEN_URL, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    });
    return data;
  } catch (err) {
    const mlPayload = err.response?.data;
    const mlError = mlPayload?.error || mlPayload?.message;
    const detail = new Error(mlError || err.message || 'Error al obtener token de Mercado Libre');
    detail.mlError = mlError;
    detail.mlStatus = err.response?.status;
    detail.mlDescription = mlPayload?.error_description;
    throw detail;
  }
}

async function exchangeMlAuthorizationCode(code, redirectUri) {
  return postTokenForm({
    grant_type: 'authorization_code',
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri,
  });
}

async function refreshMlAccessToken(refreshToken) {
  return postTokenForm({
    grant_type: 'refresh_token',
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    refresh_token: refreshToken,
  });
}

function resolveMlApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${ML_API_ROOT}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function mlApiRequest(method, path, accessToken, body) {
  const { data } = await axios({
    method: method.toLowerCase(),
    url: resolveMlApiUrl(path),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    data: body,
  });
  return data;
}

const mlGet = (path, accessToken) => mlApiRequest('GET', path, accessToken);
const mlPost = (path, accessToken, body) => mlApiRequest('POST', path, accessToken, body);
const mlPut = (path, accessToken, body) => mlApiRequest('PUT', path, accessToken, body);

module.exports = {
  buildMlAuthUrl,
  exchangeMlAuthorizationCode,
  refreshMlAccessToken,
  mlGet,
  mlPost,
  mlPut,
};
