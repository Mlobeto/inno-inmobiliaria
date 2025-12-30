const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Obtener el ambiente actual (dev o prod)
 */
const getEnvironment = () => {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
};

/**
 * Generar path de carpeta para un tenant
 * Ejemplo: inno-saas/dev/tenant-1/properties
 */
const getTenantFolder = (tenantId, resourceType) => {
  const env = getEnvironment();
  return `inno-saas/${env}/tenant-${tenantId}/${resourceType}`;
};

/**
 * Subir imagen a Cloudinary con organización por tenant
 * 
 * @param {String} filePath - Path del archivo o buffer/stream
 * @param {Number} tenantId - ID del tenant
 * @param {String} resourceType - Tipo: properties, clients, contracts, logos, documents
 * @param {Object} options - Opciones adicionales de cloudinary
 * @returns {Promise<Object>} - Resultado de cloudinary
 */
const uploadImage = async (filePath, tenantId, resourceType = 'properties', options = {}) => {
  try {
    const folder = getTenantFolder(tenantId, resourceType);
    
    const uploadOptions = {
      folder: folder,
      resource_type: options.resource_type || 'auto', // Respetar resource_type de options
      context: `tenant_id=${tenantId}|resource_type=${resourceType}|uploaded_at=${new Date().toISOString()}`,
      tags: [`tenant-${tenantId}`, resourceType, getEnvironment()],
      ...options
    };

    // Optimizaciones según tipo de recurso (solo si no es raw)
    if (uploadOptions.resource_type !== 'raw' && ['properties', 'clients', 'logos', 'signatures'].includes(resourceType)) {
      // Para imágenes: compresión inteligente + formato automático (WebP, AVIF)
      uploadOptions.quality = 'auto:best'; // Máxima calidad con mínimo tamaño
      uploadOptions.fetch_format = 'auto'; // Usa WebP/AVIF si el navegador lo soporta
      
      if (resourceType === 'properties') {
        // Propiedades: imágenes grandes con múltiples tamaños
        uploadOptions.transformation = [
          { quality: 'auto:best', fetch_format: 'auto' },
          { width: 2048, height: 1536, crop: 'limit' } // Max 2K para alta calidad
        ];
        uploadOptions.eager = [
          { width: 300, height: 225, crop: 'fill', gravity: 'auto', quality: 'auto:eco' }, // Thumbnail
          { width: 600, height: 450, crop: 'fill', gravity: 'auto', quality: 'auto:good' }, // Medium
          { width: 1200, height: 900, crop: 'limit', quality: 'auto:best' }, // Large
        ];
      } else if (resourceType === 'logos' || resourceType === 'signatures') {
        // Logos y firmas: alta calidad, sin recorte
        uploadOptions.transformation = [
          { quality: 'auto:best', fetch_format: 'auto' },
          { width: 800, crop: 'limit' } // Max tamaño pero mantiene proporción
        ];
      }
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    console.log(`✅ Archivo subido: ${result.secure_url}`);
    
    return {
      success: true,
      url: result.secure_url,
      secure_url: result.secure_url, // Alias para compatibilidad
      publicId: result.public_id,
      format: result.format,
      width: result.width || null,
      height: result.height || null,
      bytes: result.bytes,
      eager: result.eager || [] // URLs de las transformaciones
    };

  } catch (error) {
    console.error('❌ Error subiendo a Cloudinary:', error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
};

/**
 * Subir múltiples imágenes
 */
const uploadMultipleImages = async (files, tenantId, resourceType = 'properties') => {
  const uploadPromises = files.map(file => 
    uploadImage(file.path || file, tenantId, resourceType)
  );
  
  return Promise.all(uploadPromises);
};

/**
 * Eliminar imagen de Cloudinary
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Imagen eliminada: ${publicId}`);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    throw new Error(`Error al eliminar imagen: ${error.message}`);
  }
};

/**
 * Eliminar múltiples imágenes
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    console.log(`🗑️ Imágenes eliminadas: ${publicIds.length}`);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando imágenes:', error);
    throw new Error(`Error al eliminar imágenes: ${error.message}`);
  }
};

/**
 * Obtener todas las imágenes de un tenant y tipo
 */
const getTenantImages = async (tenantId, resourceType = 'properties', maxResults = 100) => {
  try {
    const folder = getTenantFolder(tenantId, resourceType);
    
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResults,
      context: true,
      tags: true
    });

    return result.resources;
  } catch (error) {
    console.error('❌ Error obteniendo imágenes:', error);
    throw new Error(`Error al obtener imágenes: ${error.message}`);
  }
};

/**
 * Obtener URL optimizada de una imagen
 */
const getOptimizedUrl = (publicId, width = 800, height = 600) => {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width, height, crop: 'fill', gravity: 'auto' }
    ]
  });
};

/**
 * Generar URLs de diferentes tamaños
 */
const getImageVariants = (publicId) => {
  return {
    thumbnail: getOptimizedUrl(publicId, 200, 150),
    small: getOptimizedUrl(publicId, 400, 300),
    medium: getOptimizedUrl(publicId, 800, 600),
    large: getOptimizedUrl(publicId, 1200, 900),
    original: cloudinary.url(publicId)
  };
};

/**
 * Limpiar imágenes antiguas de un tenant (por ejemplo, más de 6 meses sin usar)
 */
const cleanupOldImages = async (tenantId, daysOld = 180) => {
  try {
    const folder = getTenantFolder(tenantId, 'properties');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 500
    });

    const oldImages = result.resources.filter(resource => {
      const uploadDate = new Date(resource.created_at);
      return uploadDate < cutoffDate;
    });

    if (oldImages.length > 0) {
      const publicIds = oldImages.map(img => img.public_id);
      await deleteMultipleImages(publicIds);
      console.log(`🧹 Limpieza completada: ${oldImages.length} imágenes antiguas eliminadas`);
    }

    return oldImages.length;
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    throw new Error(`Error en limpieza: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getTenantImages,
  getOptimizedUrl,
  getImageVariants,
  cleanupOldImages,
  getTenantFolder
};
