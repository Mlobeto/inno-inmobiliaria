/**
 * azureBlobHelper.js
 * Reemplaza cloudinaryHelper.js — sube archivos a Azure Blob Storage.
 *
 * Organización por tenant (equivale a los "folders" de Cloudinary):
 *   media/tenant-{tenantId}/{resourceType}/{uuid}.{ext}
 *
 * Imágenes: se comprimen y convierten a WebP con sharp antes de subir.
 * Videos:   se suben directamente sin procesamiento (mp4, mov, avi, webm).
 * PDFs/raw: se suben directamente sin procesamiento.
 *
 * Autenticación: usa Managed Identity (DefaultAzureCredential) en producción
 *                y connection string en desarrollo local.
 */

const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ─── Configuración ──────────────────────────────────────────────────────────

const STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'media';
const ENV = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

// Tipos de video aceptados
const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/avi', 'video/webm', 'video/x-msvideo'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm'];

// Tipos de imagen aceptados (se comprimen con sharp)
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp'];

// Configuración de compresión por tipo de recurso
const COMPRESSION_CONFIG = {
  properties: { width: 1920, height: 1440, quality: 82 },  // Fotos de propiedades — alta calidad
  logos:       { width: 800,  height: null, quality: 90 },  // Logo empresa — sin recorte de alto
  signatures:  { width: 600,  height: null, quality: 95 },  // Firmas — máxima calidad
  clients:     { width: 800,  height: 800,  quality: 85 },  // Fotos de clientes
  documents:   null,                                          // PDFs — sin procesamiento
  receipts:    { width: 1200, height: null, quality: 80 },  // Comprobantes de pago
  pdfs:        null,                                          // PDFs — sin procesamiento
  videos:      null,                                          // Videos — sin procesamiento
};

// ─── Cliente Azure ───────────────────────────────────────────────────────────

let _blobServiceClient = null;

const getBlobServiceClient = () => {
  if (_blobServiceClient) return _blobServiceClient;

  if (STORAGE_CONNECTION_STRING) {
    // Desarrollo local: usar connection string
    _blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
  } else if (STORAGE_ACCOUNT_NAME) {
    // Producción: usar Managed Identity (sin credenciales hardcodeadas)
    const credential = new DefaultAzureCredential();
    _blobServiceClient = new BlobServiceClient(
      `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
      credential
    );
  } else {
    throw new Error('Azure Storage no configurado. Definí AZURE_STORAGE_ACCOUNT_NAME o AZURE_STORAGE_CONNECTION_STRING');
  }

  return _blobServiceClient;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getEnvironment = () => ENV;

/**
 * Genera el path del blob dentro del container:
 * tenant-{tenantId}/{resourceType}/{uuid}.{ext}
 */
const getBlobPath = (tenantId, resourceType, filename) => {
  return `tenant-${tenantId}/${resourceType}/${filename}`;
};

const isVideo = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
};

const isImage = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
};

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png',  '.webp': 'image/webp',
    '.gif': 'image/gif',  '.tiff': 'image/tiff',
    '.mp4': 'video/mp4',  '.mov': 'video/quicktime',
    '.avi': 'video/avi',  '.webm': 'video/webm',
    '.pdf': 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
};

/**
 * Comprime una imagen con sharp y devuelve un buffer WebP.
 * Si la imagen es un GIF o el resourceType no requiere compresión → devuelve null (subir original).
 */
const compressImage = async (filePath, resourceType) => {
  const config = COMPRESSION_CONFIG[resourceType];
  if (!config) return null; // Sin compresión para este tipo

  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.gif') return null; // GIFs: mantener original

  try {
    let pipeline = sharp(filePath);

    // Redimensionar si se especificaron dimensiones máximas
    if (config.width || config.height) {
      pipeline = pipeline.resize(config.width || null, config.height || null, {
        fit: 'inside',        // Mantiene proporción sin recortar
        withoutEnlargement: true, // No agrandar imágenes pequeñas
      });
    }

    // Convertir a WebP (40-60% menos peso que JPEG/PNG sin pérdida visual perceptible)
    const buffer = await pipeline
      .webp({ quality: config.quality, effort: 4 })
      .toBuffer();

    return buffer;
  } catch (error) {
    console.error('⚠️ Error comprimiendo imagen, se sube original:', error.message);
    return null;
  }
};

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Subir un archivo a Azure Blob Storage con organización por tenant.
 *
 * @param {string} filePath - Path local del archivo
 * @param {number|string} tenantId - ID del tenant
 * @param {string} resourceType - 'properties' | 'logos' | 'signatures' | 'clients' | 'documents' | 'receipts' | 'pdfs' | 'videos'
 * @param {Object} options - { originalName } nombre original del archivo
 * @returns {Promise<{ success, url, blobPath, contentType, bytes }>}
 */
const uploadFile = async (filePath, tenantId, resourceType = 'properties', options = {}) => {
  try {
    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(CONTAINER_NAME);

    const shouldCompress = isImage(filePath) && COMPRESSION_CONFIG[resourceType] !== null;
    const isVideoFile = isVideo(filePath);

    let uploadBuffer;
    let contentType;
    let extension;

    if (shouldCompress) {
      const compressed = await compressImage(filePath, resourceType);
      if (compressed) {
        uploadBuffer = compressed;
        contentType = 'image/webp';
        extension = '.webp';
      } else {
        // Fallback: subir original
        uploadBuffer = fs.readFileSync(filePath);
        contentType = getMimeType(filePath);
        extension = path.extname(filePath).toLowerCase();
      }
    } else {
      uploadBuffer = fs.readFileSync(filePath);
      contentType = getMimeType(filePath);
      extension = path.extname(filePath).toLowerCase();
    }

    // Nombre único para el blob
    const blobName = `${uuidv4()}${extension}`;
    const blobPath = getBlobPath(tenantId, resourceType, blobName);

    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.upload(uploadBuffer, uploadBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: isVideoFile
          ? 'public, max-age=2592000'   // Videos: 30 días de caché
          : 'public, max-age=31536000', // Imágenes/docs: 1 año de caché
      },
      metadata: {
        tenantId: String(tenantId),
        resourceType,
        environment: getEnvironment(),
        originalName: options.originalName || blobName,
        uploadedAt: new Date().toISOString(),
      },
    });

    const url = blockBlobClient.url;
    console.log(`✅ Archivo subido: ${url}`);

    return {
      success: true,
      url,
      blobPath,
      contentType,
      bytes: uploadBuffer.length,
    };
  } catch (error) {
    console.error('❌ Error subiendo a Azure Blob Storage:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }
};

/**
 * Subir múltiples archivos del mismo tenant y tipo.
 */
const uploadMultipleFiles = async (files, tenantId, resourceType = 'properties') => {
  const promises = files.map(file =>
    uploadFile(file.path || file, tenantId, resourceType, {
      originalName: file.originalname || file.name,
    })
  );
  return Promise.all(promises);
};

// Alias para compatibilidad con código existente que llama uploadImage
const uploadImage = (filePath, tenantId, resourceType = 'properties', options = {}) =>
  uploadFile(filePath, tenantId, resourceType, options);

const uploadMultipleImages = (files, tenantId, resourceType = 'properties') =>
  uploadMultipleFiles(files, tenantId, resourceType);

/**
 * Eliminar un blob por su path.
 * El blobPath es la parte final de la URL después del container:
 *   tenant-1/properties/abc123.webp
 */
const deleteFile = async (blobPath) => {
  try {
    if (!blobPath) return;

    // Aceptar blobPath como path relativo o como URL completa
    let relativePath = blobPath;
    if (blobPath.includes('.blob.core.windows.net')) {
      // Extraer path después del container name
      const url = new URL(blobPath);
      relativePath = url.pathname.replace(`/${CONTAINER_NAME}/`, '');
    }

    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(relativePath);

    await blockBlobClient.deleteIfExists();
    console.log(`🗑️ Archivo eliminado: ${relativePath}`);
  } catch (error) {
    console.error('❌ Error eliminando archivo:', error);
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
};

// Alias para compatibilidad con código que llama deleteImage
const deleteImage = deleteFile;

/**
 * Eliminar múltiples blobs.
 */
const deleteMultipleFiles = async (blobPaths) => {
  const promises = blobPaths.map(p => deleteFile(p));
  await Promise.all(promises);
  console.log(`🗑️ ${blobPaths.length} archivos eliminados`);
};

const deleteMultipleImages = deleteMultipleFiles;

/**
 * Listar todos los archivos de un tenant y tipo de recurso.
 */
const listTenantFiles = async (tenantId, resourceType = 'properties') => {
  const prefix = `tenant-${tenantId}/${resourceType}/`;
  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(CONTAINER_NAME);

  const files = [];
  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    files.push({
      name: blob.name,
      url: `${containerClient.url}/${blob.name}`,
      contentType: blob.properties.contentType,
      size: blob.properties.contentLength,
      createdAt: blob.properties.createdOn,
    });
  }
  return files;
};

// Alias getTenantImages para compatibilidad
const getTenantImages = listTenantFiles;

/**
 * Subir un archivo desde base64 (usado para firmas digitales).
 * @param {string} base64Data - Data URL o base64 puro
 * @param {number|string} tenantId
 * @param {string} resourceType
 * @param {Object} options - { filename } nombre del blob
 */
const uploadFromBase64 = async (base64Data, tenantId, resourceType = 'signatures', options = {}) => {
  try {
    // Soporta tanto "data:image/png;base64,XXXX" como base64 puro
    let base64String = base64Data;
    let contentType = 'image/png';

    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        base64String = matches[2];
      }
    }

    const buffer = Buffer.from(base64String, 'base64');
    const extMap = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };
    const extension = extMap[contentType] || '.png';
    const blobName = options.filename || `${uuidv4()}${extension}`;
    const blobPath = getBlobPath(tenantId, resourceType, blobName);

    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'public, max-age=31536000',
      },
      metadata: {
        tenantId: String(tenantId),
        resourceType,
        environment: getEnvironment(),
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log(`✅ Base64 subido: ${blockBlobClient.url}`);
    return {
      success: true,
      url: blockBlobClient.url,
      secure_url: blockBlobClient.url, // alias compatibilidad
      blobPath,
      contentType,
      bytes: buffer.length,
    };
  } catch (error) {
    console.error('❌ Error subiendo base64 a Azure Blob Storage:', error);
    throw new Error(`Error al subir base64: ${error.message}`);
  }
};

module.exports = {
  uploadFile,
  uploadImage,
  uploadFromBase64,
  uploadMultipleFiles,
  uploadMultipleImages,
  deleteFile,
  deleteImage,
  deleteMultipleFiles,
  deleteMultipleImages,
  listTenantFiles,
  getTenantImages,
  getBlobPath,
  isVideo,
  isImage,
};
