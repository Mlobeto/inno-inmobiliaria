const crypto = require('crypto');
const logger = require('./logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Generar clave de encriptación desde password
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encriptar texto
 * @param {string} text - Texto a encriptar
 * @returns {Object} - { encrypted, iv, authTag, salt } en formato hex
 */
function encrypt(text) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY no está definida en las variables de entorno');
  }
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(process.env.ENCRYPTION_KEY, salt);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: salt.toString('hex'),
    };
  } catch (error) {
    logger.error('Encryption failed', {
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Error encriptando datos');
  }
}

/**
 * Desencriptar texto
 * @param {Object} encryptedData - { encrypted, iv, authTag, salt }
 * @returns {string} - Texto desencriptado
 */
function decrypt(encryptedData) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY no está definida en las variables de entorno');
  }
  
  try {
    const { encrypted, iv, authTag, salt } = encryptedData;
    
    const key = deriveKey(
      process.env.ENCRYPTION_KEY,
      Buffer.from(salt, 'hex')
    );
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', {
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Error desencriptando datos');
  }
}

/**
 * Generar clave de encriptación aleatoria (para .env)
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash de password con bcrypt (para passwords de usuarios)
 */
async function hashPassword(password) {
  const bcrypt = require('bcrypt');
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Comparar password con hash
 */
async function comparePassword(password, hash) {
  const bcrypt = require('bcrypt');
  return bcrypt.compare(password, hash);
}

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
  hashPassword,
  comparePassword,
};
