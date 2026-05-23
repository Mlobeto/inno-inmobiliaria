import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { updatePropertyImages } from '../../redux/Actions/actions';
import { uploadMultipleFiles } from '../../utils/azureUpload';
import {
  modalOverlay,
  modalBox,
  modalHeader,
  btnPrimary,
  btnSecondary,
  btnDanger,
  card,
  inputClass,
  labelClass,
  emptyState,
  spinner,
} from './propiedadesTheme';

export default function ImageManager({ property }) {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState(property.images || []);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleAddImage = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsLoading(true);
    try {
      const urls = await uploadMultipleFiles(files, 'properties');
      setImages((prev) => [...prev, ...urls]);
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      alert('Error al subir las imágenes');
    } finally {
      setIsLoading(false);
      e.target.value = null;
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await dispatch(updatePropertyImages(property.propertyId, images));
      alert('Imágenes actualizadas correctamente');
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar imágenes:', error);
      alert('Error al actualizar las imágenes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setImages(property.images || []);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${btnSecondary} text-xs py-1.5 flex-shrink-0`}
        title="Gestionar imágenes"
      >
        🖼️ Imágenes
      </button>

      {isOpen && (
        <div className={modalOverlay}>
          <div className={`${modalBox} max-w-3xl max-h-[90vh] overflow-y-auto`}>
            <div className={`${modalHeader} sticky top-0 bg-bgSurface z-10`}>
              <h3 className="text-lg font-semibold text-textPrimary">
                Gestionar Imágenes - {property.title || property.tipoPropiedad}
              </h3>
              <button
                onClick={handleCancel}
                className="text-textMuted hover:text-textPrimary text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className={`${card} p-4`}>
                <label className={labelClass}>Agregar nuevas imágenes</label>
                <label
                  className={`${btnPrimary} w-full justify-center py-3 cursor-pointer mt-2 ${
                    isLoading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <span className="text-xl">🖼️</span>
                  {isLoading ? 'Subiendo...' : 'Seleccionar Imágenes'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddImage}
                    disabled={isLoading}
                  />
                </label>
                <p className="text-xs text-textMuted mt-2">
                  Seleccioná una o varias imágenes. Se suben y comprimen automáticamente.
                </p>
              </div>

              <div>
                <h4 className={`${labelClass} text-sm font-medium mb-3`}>
                  Imágenes actuales ({images.length})
                </h4>

                {images.length === 0 ? (
                  <div className={emptyState}>No hay imágenes. Agregá una usando el campo de arriba.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((imageUrl, index) => (
                      <div key={index} className={`${card} p-3`}>
                        <div className="aspect-video bg-bgElevated rounded mb-2 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=Error+al+cargar';
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={imageUrl}
                            readOnly
                            className={`${inputClass} flex-1 text-xs truncate py-1`}
                            title={imageUrl}
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className={btnDanger}
                            title="Eliminar imagen"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-bgElevated border-t border-borderBase p-4 flex justify-end gap-3">
              <button onClick={handleCancel} disabled={isLoading} className={btnSecondary}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isLoading} className={btnPrimary}>
                {isLoading ? (
                  <>
                    <span className={spinner + ' w-4 h-4 border-2'} />
                    Guardando...
                  </>
                ) : (
                  '💾 Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

ImageManager.propTypes = {
  property: PropTypes.shape({
    propertyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    title: PropTypes.string,
    tipoPropiedad: PropTypes.string,
  }).isRequired,
};
