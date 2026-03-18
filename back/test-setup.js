require('dotenv').config();
const logger = require('./src/utils/logger');
const { getRedisClient, closeRedis } = require('./src/utils/redis');
const { encrypt, decrypt, generateEncryptionKey } = require('./src/utils/encryption');

async function testSetup() {
  console.log('\n🧪 Ejecutando tests de configuración...\n');
  
  let allTestsPassed = true;
  
  // ==============================================
  // TEST 1: Logger
  // ==============================================
  console.log('─────────────────────────────────────────');
  console.log('TEST 1: Sistema de Logging');
  console.log('─────────────────────────────────────────');
  
  try {
    logger.info('Logger inicializado correctamente', { test: 'OK' });
    logger.debug('Debug message', { level: 'debug' });
    logger.warn('Warning message', { level: 'warn' });
    
    console.log('✅ Logger funcionando correctamente\n');
  } catch (error) {
    console.error('❌ Error en logger:', error.message);
    allTestsPassed = false;
  }
  
  // ==============================================
  // TEST 2: Redis
  // ==============================================
  console.log('─────────────────────────────────────────');
  console.log('TEST 2: Conexión a Redis');
  console.log('─────────────────────────────────────────');
  
  try {
    const redis = getRedisClient();
    
    // Test básico de set/get
    await redis.set('test:setup', 'Hello from Redis!');
    const value = await redis.get('test:setup');
    
    if (value === 'Hello from Redis!') {
      logger.info('Redis test exitoso', { value });
      console.log('✅ Redis conectado y funcionando\n');
    } else {
      throw new Error('Valor de Redis no coincide');
    }
    
    // Test de TTL
    await redis.setex('test:ttl', 5, 'expires in 5 seconds');
    const ttl = await redis.ttl('test:ttl');
    logger.info('Redis TTL test', { ttl: `${ttl}s` });
    
    // Limpiar
    await redis.del('test:setup', 'test:ttl');
    
  } catch (error) {
    console.error('❌ Error en Redis:', error.message);
    console.error('   Asegúrate de que Redis esté corriendo:');
    console.error('   - Docker: docker run -d -p 6379:6379 --name redis redis:alpine');
    console.error('   - O configura REDIS_URL en .env con tu Redis cloud');
    allTestsPassed = false;
  }
  
  // ==============================================
  // TEST 3: Encriptación
  // ==============================================
  console.log('─────────────────────────────────────────');
  console.log('TEST 3: Sistema de Encriptación');
  console.log('─────────────────────────────────────────');
  
  try {
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('⚠️  ENCRYPTION_KEY no configurada');
      console.warn('   Genera una con: node scripts/generateEncryptionKey.js');
      console.warn('   Generando clave temporal para test...\n');
      
      process.env.ENCRYPTION_KEY = generateEncryptionKey();
    }
    
    const originalText = 'ACCESS_TOKEN_SECRET_12345';
    
    // Encriptar
    const encrypted = encrypt(originalText);
    logger.info('Texto encriptado', {
      original: originalText,
      encrypted: encrypted.encrypted.substring(0, 24) + '...',
      iv: encrypted.iv.substring(0, 16) + '...',
      authTag: encrypted.authTag.substring(0, 16) + '...',
    });
    
    // Desencriptar
    const decrypted = decrypt(encrypted);
    
    if (decrypted === originalText) {
      console.log('✅ Encriptación funcionando correctamente');
      console.log(`   Original:    ${originalText}`);
      console.log(`   Encriptado:  ${encrypted.encrypted.substring(0, 32)}...`);
      console.log(`   Desencriptado: ${decrypted}\n`);
    } else {
      throw new Error('Desencriptación falló - texto no coincide');
    }
    
  } catch (error) {
    console.error('❌ Error en encriptación:', error.message);
    allTestsPassed = false;
  }
  
  // ==============================================
  // TEST 4: Cache de Tenants
  // ==============================================
  console.log('─────────────────────────────────────────');
  console.log('TEST 4: Cache de Tenants');
  console.log('─────────────────────────────────────────');
  
  try {
    const { setJson, getJson, invalidatePattern } = require('./src/utils/redis');
    
    const mockTenant = {
      tenantId: 999,
      businessName: 'Test Inmobiliaria',
      subdomain: 'test',
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
    };
    
    // Set
    await setJson('tenant:subdomain:test', mockTenant, 60);
    
    // Get
    const cached = await getJson('tenant:subdomain:test');
    
    if (cached && cached.tenantId === 999) {
      logger.info('Cache de tenant test exitoso', { cached });
      console.log('✅ Cache de tenants funcionando\n');
    } else {
      throw new Error('Cache de tenant falló');
    }
    
    // Invalidar
    await invalidatePattern('tenant:*');
    
  } catch (error) {
    console.error('❌ Error en cache de tenants:', error.message);
    allTestsPassed = false;
  }
  
  // ==============================================
  // TEST 5: Rate Limiting (verificar que Redis funciona para contadores)
  // ==============================================
  console.log('─────────────────────────────────────────');
  console.log('TEST 5: Rate Limiting (Contadores)');
  console.log('─────────────────────────────────────────');
  
  try {
    const { incrementWithTTL } = require('./src/utils/redis');
    
    const testKey = 'test:ratelimit:192.168.1.1';
    
    // Simular 5 requests
    for (let i = 1; i <= 5; i++) {
      const count = await incrementWithTTL(testKey, 60);
      console.log(`   Request ${i}: Count = ${count}`);
    }
    
    const redis = getRedisClient();
    const finalCount = await redis.get(testKey);
    
    if (parseInt(finalCount) === 5) {
      console.log('✅ Rate limiting contadores funcionando\n');
    } else {
      throw new Error(`Contador incorrecto: ${finalCount} (esperado: 5)`);
    }
    
    // Limpiar
    await redis.del(testKey);
    
  } catch (error) {
    console.error('❌ Error en rate limiting:', error.message);
    allTestsPassed = false;
  }
  
  // ==============================================
  // RESUMEN
  // ==============================================
  console.log('═════════════════════════════════════════');
  console.log('📊 RESUMEN DE TESTS');
  console.log('═════════════════════════════════════════');
  
  if (allTestsPassed) {
    console.log('✅ TODOS LOS TESTS PASARON');
    console.log('\n🎉 Tu configuración está lista para usar!\n');
    console.log('Próximos pasos:');
    console.log('1. Ejecutar el servidor: npm run dev');
    console.log('2. Probar un endpoint: curl http://localhost:3001/api/property');
    console.log('3. Monitorear logs en consola (en desarrollo)');
    console.log('4. Revisar Redis: redis-cli KEYS "*"\n');
  } else {
    console.log('❌ ALGUNOS TESTS FALLARON');
    console.log('\nRevisa los errores arriba y:');
    console.log('1. Verifica que Redis esté corriendo');
    console.log('2. Configura ENCRYPTION_KEY en .env');
    console.log('3. Verifica las variables de entorno en .env\n');
  }
  
  // Cerrar conexiones
  await closeRedis();
  process.exit(allTestsPassed ? 0 : 1);
}

// Ejecutar tests
testSetup().catch((error) => {
  console.error('\n💥 Error fatal:', error);
  process.exit(1);
});
