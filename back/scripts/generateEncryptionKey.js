#!/usr/bin/env node

/**
 * Script para generar clave de encriptación
 * Ejecutar: node scripts/generateEncryptionKey.js
 */

const crypto = require('crypto');

function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  
  console.log('\n🔐 Clave de encriptación generada:\n');
  console.log(key);
  console.log('\n📋 Copia esta clave y agrégala a tu archivo .env:');
  console.log(`ENCRYPTION_KEY=${key}`);
  console.log('\n⚠️  IMPORTANTE:');
  console.log('- Guarda esta clave de forma segura');
  console.log('- NO la compartas en repositorios públicos');
  console.log('- NO cambies esta clave una vez en producción (no podrás desencriptar datos existentes)');
  console.log('- Usa la misma clave en todos tus servidores/workers\n');
}

generateEncryptionKey();
