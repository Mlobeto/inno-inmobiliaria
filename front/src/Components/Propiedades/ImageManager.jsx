import React, { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { updatePropertyImages } from "../../redux/Actions/actions";
import { uploadMultipleFiles } from "../../utils/azureUpload";

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
      console.error("Error al subir imágenes:", error);
      alert("Error al subir las imágenes");
    } finally {
      setIsLoading(false);
      e.target.value = null; // reset input
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await dispatch(updatePropertyImages(property.propertyId, images));
      alert("Imágenes actualizadas correctamente");
      setIsOpen(false);
      window.location.reload(); // Recargar para ver los cambios
    } catch (error) {
      console.error("Error al actualizar imágenes:", error);
      alert("Error al actualizar las imágenes");
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
      {/* Botón para abrir el modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
        title="Gestionar imágenes"
      >
        🖼️ Imágenes
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Gestionar Imágenes - {property.title || property.tipoPropiedad}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Agregar nueva imagen */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Agregar nuevas imágenes
                </label>
                <label
                  className={`w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
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
                <p className="text-xs text-gray-500 mt-2">
                  💡 Seleccioná una o varias imágenes. Se suben y comprimen automáticamente.
                </p>
              </div>

              {/* Lista de imágenes actuales */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Imágenes actuales ({images.length})
                </h4>
                
                {images.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No hay imágenes. Agrega una usando el campo de arriba.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Thumbnail */}
                        <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/300x200?text=Error+al+cargar";
                            }}
                          />
                        </div>
                        
                        {/* URL y botón eliminar */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={imageUrl}
                            readOnly
                            className="flex-1 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded truncate"
                            title={imageUrl}
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors flex-shrink-0"
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

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Guardando...
                  </>
                ) : (
                  "💾 Guardar Cambios"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
