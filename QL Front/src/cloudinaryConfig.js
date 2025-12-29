

const cloudinaryConfig = {
  cloudName: 'dachr5i8f',
  uploadPreset: 'propiedades'
};

export const openCloudinaryWidget = (callback) => {
  if (!window.cloudinary) {
    console.error("Cloudinary no está disponible. Asegúrate de que el script se haya cargado.");
    return;
  }

  const cloudinaryWidget = window.cloudinary.createUploadWidget(
    {
      cloudName: 'dachr5i8f',
      uploadPreset: 'propiedades',
      multiple: true,
      folder: 'packs',
    },
    (error, result) => {
      if (result.event === 'success') {
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




