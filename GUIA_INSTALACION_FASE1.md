# 📝 Guía de Instalación - Fase 1: Seguridad

Esta guía te explica cómo configurar e implementar las mejoras de seguridad críticas.

---

## 📦 **Paso 1: Instalar Dependencias**

```bash
cd back
npm install
```

Las siguientes dependencias fueron agregadas a `package.json`:

- **winston**: Sistema de logging estructurado
- **winston-elasticsearch**: Transporte de logs a Elasticsearch (opcional)
- **ioredis**: Cliente de Redis para Node.js
- **bull**: Sistema de colas para background jobs
- **express-rate-limit**: Rate limiting middleware
- **rate-limit-redis**: Store de Redis para rate limiting
- **helmet**: Headers de seguridad HTTP
- **supertest**: Testing de APIs (devDependency)

---

## 🔐 **Paso 2: Generar Clave de Encriptación**

```bash
node scripts/generateEncryptionKey.js
```

Esto generará una clave aleatoria de 32 bytes. **Copia la clave** y agrégala a tu archivo `.env`:

```bash
ENCRYPTION_KEY=tu-clave-generada-aqui
```

⚠️ **IMPORTANTE:**
- **NO cambies esta clave una vez en producción** (no podrás desencriptar tokens existentes)
- **NO compartas** esta clave en repositorios públicos
- Usa la **misma clave** en todos tus servidores/workers

---

## 🗄️ **Paso 3: Instalar y Configurar Redis**

### Opción A: Redis Local (Desarrollo)

**Windows:**
```bash
# En Windows, usa WSL2 o Docker
docker run -d -p 6379:6379 --name redis redis:alpine
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Opción B: Redis en la Nube (Producción)

**Upstash (Gratis, Recomendado):**
1. Regístrate en https://upstash.com
2. Crea una base de datos Redis
3. Copia la URL de conexión

**Railway:**
1. En tu proyecto de Railway
2. Click en "New" → "Database" → "Add Redis"
3. Copia la variable `REDIS_URL`

**Configuración en `.env`:**
```bash
# Desarrollo (local)
REDIS_URL=redis://localhost:6379

# Producción (Upstash ejemplo)
REDIS_URL=rediss://default:tu-password@us1-redis.upstash.io:6379
```

---

## 🧪 **Paso 4: Verificar Instalación**

Crea un archivo de prueba:

```javascript
// back/test-setup.js
require('dotenv').config();
const logger = require('./src/utils/logger');
const { getRedisClient } = require('./src/utils/redis');
const { generateEncryptionKey, encrypt, decrypt } = require('./src/utils/encryption');

async function testSetup() {
  // 1. Test Logger
  logger.info('Logger test', { test: 'OK' });
  logger.warn('Warning test', { alert: 'This is a warning' });
  logger.error('Error test', { error: 'This is an error' });
  
  // 2. Test Redis
  try {
    const redis = getRedisClient();
    await redis.set('test:key', 'Hello Redis!');
    const value = await redis.get('test:key');
    logger.info('Redis test', { value });
    await redis.del('test:key');
  } catch (error) {
    logger.error('Redis connection failed', { error: error.message });
    process.exit(1);
  }
  
  // 3. Test Encryption
  try {
    const original = 'Secret token 12345';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    
    logger.info('Encryption test', {
      original,
      encrypted: encrypted.encrypted.substring(0, 20) + '...',
      decrypted,
      match: original === decrypted
    });
  } catch (error) {
    logger.error('Encryption failed', { error: error.message });
    process.exit(1);
  }
  
  logger.info('✅ All tests passed!');
  process.exit(0);
}

testSetup();
```

Ejecuta la prueba:
```bash
node back/test-setup.js
```

**Output esperado:**
```
15:30:45 info: Logger test
{
  "test": "OK"
}
15:30:45 warn: Warning test
{
  "alert": "This is a warning"
}
15:30:45 error: Error test
{
  "error": "This is an error"
}
15:30:46 info: Redis connected successfully
{
  "url": "redis://localhost:6379"
}
15:30:46 info: Redis test
{
  "value": "Hello Redis!"
}
15:30:46 info: Encryption test
{
  "original": "Secret token 12345",
  "encrypted": "a3f8c9e2...",
  "decrypted": "Secret token 12345",
  "match": true
}
15:30:46 info: ✅ All tests passed!
```

---

## ⚙️ **Paso 5: Actualizar index.js**

Actualiza tu archivo `back/index.js` para usar el nuevo logger y rate limiting:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./src/utils/logger');
const { globalLimiter, tenantLimiter } = require('./src/middlewares/rateLimiter');
const { tenancyMiddleware } = require('./src/middlewares/tenancyMiddleware');

const app = express();

// Seguridad
app.use(helmet());
app.use(cors());

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de HTTP requests
app.use(logger.httpLogger);

// Rate limiting global
app.use('/api', globalLimiter);

// Tus rutas actuales
app.use('/api/...', ...);

// Rate limiting por tenant (después de autenticación)
app.use('/api', tenancyMiddleware, tenantLimiter);

// ... resto de tu configuración

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV,
  });
});
```

---

## 📊 **Paso 6: Monitorear Logs**

### En Desarrollo:
```bash
npm run dev
```

Verás logs legibles con colores en la consola.

### En Producción:

Los logs se guardan en:
- `back/logs/error.log` - Solo errores
- `back/logs/combined.log` - Todos los niveles

Ver logs en tiempo real:
```bash
tail -f back/logs/combined.log
```

Buscar errores específicos:
```bash
cat back/logs/combined.log | grep '"level":"error"' | jq
```

---

## 🧪 **Paso 7: Testing de Rate Limiting**

Crea un test simple:

```javascript
// back/test-rate-limit.js
const axios = require('axios');

async function testRateLimit() {
  const url = 'http://localhost:3001/api/property';
  const headers = { 'X-Tenant-Id': '1' };
  
  console.log('Enviando 120 requests...');
  
  for (let i = 1; i <= 120; i++) {
    try {
      const res = await axios.get(url, { headers });
      console.log(`Request ${i}: ${res.status}`);
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`Request ${i}: 429 - Rate limit alcanzado! ✅`);
        break;
      }
      console.error(`Request ${i}: Error - ${error.message}`);
    }
  }
}

testRateLimit();
```

Ejecuta:
```bash
node back/test-rate-limit.js
```

Deberías ver que después de 100 requests (plan FREE), obtienes error 429.

---

## 🚀 **Paso 8: Deploy a Producción**

### Variables de Entorno en Railway/Vercel:

```bash
NODE_ENV=production
DATABASE_URL=tu-database-url
REDIS_URL=tu-redis-url
ENCRYPTION_KEY=tu-encryption-key
JWT_SECRET=tu-jwt-secret
LOG_LEVEL=info

# Opcional: Elasticsearch
ELASTICSEARCH_NODE=https://your-cluster.es.io:9243
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=your-password
```

### Crear carpeta de logs:

```bash
mkdir -p back/logs
echo "/logs" >> back/.gitignore
```

---

## ✅ **Checklist Final**

- [ ] Dependencias instaladas (`npm install`)
- [ ] Redis instalado y corriendo
- [ ] ENCRYPTION_KEY generada y en `.env`
- [ ] Test de setup ejecutado exitosamente
- [ ] Logger funcionando en consola
- [ ] Rate limiting testeado
- [ ] Variables de entorno configuradas en producción
- [ ] Logs monitoreados

---

## 📞 **Troubleshooting**

### Error: "Redis connection failed"
```bash
# Verificar que Redis está corriendo
redis-cli ping
# Debe responder: PONG
```

### Error: "ENCRYPTION_KEY no está definida"
```bash
# Generar y agregar a .env
node scripts/generateEncryptionKey.js
```

### Rate limiting no funciona
```bash
# Verificar que Redis tiene datos
redis-cli
> KEYS rl:*
# Deberías ver claves como: rl:global:192.168.1.1
```

---

## 🎉 **¡Listo!**

Ya tienes implementado:
- ✅ Logging estructurado con Winston
- ✅ Cache de tenants con Redis
- ✅ Rate limiting por IP y por tenant
- ✅ Encriptación de tokens
- ✅ Monitoreo de performance

**Siguiente paso:** Implementar Fase 2 - Arquitectura de Integraciones
