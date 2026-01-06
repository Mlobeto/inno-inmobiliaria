

const cloudinaryConfig = {
  cloudName: 'dachr5i8f',
  uploadPreset: 'propiedades'
};

export const openCloudinaryWidget = (callback, folder = 'packs') => {
  if (!window.cloudinary) {
    console.error("Cloudinary no está disponible. Asegúrate de que el script se haya cargado.");
    return;
  }

  const cloudinaryWidget = window.cloudinary.createUploadWidget(
    {
      cloudName: 'dachr5i8f',
      uploadPreset: 'propiedades',
      multiple: true,
      folder: folder,
    },
    (error, result) => {
      if (result.event === 'success') {
        callback(result.info.secure_url);
      }
    }
  );
  cloudinaryWidget.open();
};

// Nueva función específica para logos de empresa (una sola imagen)
export const openCloudinaryWidgetForLogo = (callback, tenantFolder) => {
  if (!window.cloudinary) {
    console.error("Cloudinary no está disponible. Asegúrate de que el script se haya cargado.");
    return;
  }

  const cloudinaryWidget = window.cloudinary.createUploadWidget(
    {
      cloudName: 'dachr5i8f',
      uploadPreset: 'propiedades',
      multiple: false, // Solo una imagen para el logo
      folder: `${tenantFolder}/logo`, // Carpeta específica por tenant (el preset ya tiene inno-saas/tenants/)
      cropping: true, // Permitir recortar el logo
      croppingAspectRatio: 1, // Logo cuadrado (opcional, puedes cambiarlo)
      croppingShowDimensions: true,
      maxImageFileSize: 5000000, // Máximo 5MB
      clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp', 'svg'], // Solo imágenes
      sources: ['local', 'url', 'camera'], // Fuentes permitidas
      showAdvancedOptions: false,
      showPoweredBy: false,
      tags: ['logo', tenantFolder], // Tags para identificar
      context: { tenant: tenantFolder }, // Metadata adicional
    },
    (error, result) => {
      if (error) {
        console.error("Error en Cloudinary:", error);
        return;
      }
      if (result.event === 'success') {
        console.log(`✅ Logo subido a: ${result.info.folder}/${result.info.public_id}`);
        callback(result.info.secure_url);
      }
    }
  );
  cloudinaryWidget.open();
};

export const loadCloudinaryScript = () => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://widget.cloudinary.com/v2.0/global/all.js"]')) {
      resolve(); // Script ya está cargado
      return;
    }
    const script = document.createElement('script');
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};




