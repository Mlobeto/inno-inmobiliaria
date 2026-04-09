/**
 * azureUpload.js — reemplaza cloudinaryConfig.js
 * Sube archivos al backend → Azure Blob Storage.
 * El backend comprime imágenes a WebP con sharp según el resourceType.
 */
import axios from 'axios';

/**
 * Sube un File al backend y devuelve la URL pública en Azure Blob.
 * @param {File} file - Archivo del input[type=file]
 * @param {'properties'|'logos'|'signatures'|'receipts'|'pdfs'} resourceType
 * @returns {Promise<string>} URL pública del archivo subido
 */
export const uploadFile = async (file, resourceType = 'properties') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resourceType', resourceType);

  const response = await axios.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.url;
};

/**
 * Sube múltiples archivos en paralelo.
 * @param {FileList|File[]} files
 * @param {'properties'|'logos'|'receipts'} resourceType
 * @returns {Promise<string[]>} Array de URLs públicas
 */
export const uploadMultipleFiles = async (files, resourceType = 'properties') => {
  const fileArray = Array.from(files);
  const urls = await Promise.all(fileArray.map((f) => uploadFile(f, resourceType)));
  return urls;
};
