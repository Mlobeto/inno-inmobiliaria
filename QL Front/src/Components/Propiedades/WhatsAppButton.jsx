import { useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { IoLogoWhatsapp, IoCheckmarkCircleOutline, IoPencilOutline, IoSaveOutline, IoCloseOutline } from 'react-icons/io5';
import { copyWhatsAppToClipboard, updateWhatsAppTemplate } from '../../redux/Actions/actions';

const WhatsAppButton = ({ propertyId, property }) => {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [template, setTemplate] = useState(property?.whatsappTemplate || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleCopyWhatsApp = async () => {
    try {
      setIsLoading(true);
      const success = await dispatch(copyWhatsAppToClipboard(propertyId));
      
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (error) {
      console.error('Error al copiar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTemplate = () => {
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = async () => {
    try {
      setIsLoading(true);
      await dispatch(updateWhatsAppTemplate(propertyId, template));
      setShowTemplateEditor(false);
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setTemplate(property?.whatsappTemplate || '');
    setShowTemplateEditor(false);
  };

  return (
    <div className="inline-flex items-center gap-2">
      {/* Botón Copiar WhatsApp */}
      <button
        onClick={handleCopyWhatsApp}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200 transform hover:scale-105
          ${copied 
            ? 'bg-green-500 text-white' 
            : 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-md hover:shadow-lg
        `}
      >
        {copied ? (
          <>
            <IoCheckmarkCircleOutline className="text-xl" />
            <span className="text-sm">¡Copiado!</span>
          </>
        ) : (
          <>
            <IoLogoWhatsapp className="text-xl" />
            <span className="text-sm">Copiar WhatsApp</span>
          </>
        )}
      </button>

      {/* Botón Editar Plantilla */}
      <button
        onClick={handleEditTemplate}
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-blue-500 text-white hover:bg-blue-600
          transition-all duration-200 transform hover:scale-105
          shadow-md hover:shadow-lg
        "
        title="Editar plantilla de WhatsApp"
      >
        <IoPencilOutline className="text-lg" />
      </button>

      {/* Modal para Editar Plantilla */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <IoPencilOutline />
                Editar Plantilla de WhatsApp
              </h2>
              <p className="text-blue-100 mt-2 text-sm">
                Personaliza el mensaje para esta propiedad usando variables
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Info de la propiedad */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="font-semibold text-blue-900">
                  {property?.address || 'Dirección no disponible'}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Precio: AR$ {property?.price?.toLocaleString() || 'N/A'}
                </p>
              </div>

              {/* Variables disponibles */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">📋 Variables Disponibles:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <code className="bg-white px-2 py-1 rounded border">{'{precio}'}</code>
                  <code className="bg-white px-2 py-1 rounded border">{'{direccion}'}</code>
                  <code className="bg-white px-2 py-1 rounded border">{'{ciudad}'}</code>
                  <code className="bg-white px-2 py-1 rounded border">{'{barrio}'}</code>
                  <code className="bg-white px-2 py-1 rounded border">{'{tipo}'}</code>
                  <code className="bg-white px-2 py-1 rounded border">{'{habitaciones}'}</code>
                  <code className="bg-white px-2 py-1 rounded border">{'{baños}'}</code>
                  <code className="bg-white px-2 py-1 rounded border">{'{superficieTotal}'}</code>
                  <code className="bg-white px-2 py-1 rounded border">{'{descripcion}'}</code>
                </div>
              </div>

              {/* Editor de plantilla */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plantilla de Mensaje:
                </label>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Escribe tu plantilla aquí..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Usa las variables para que se reemplacen automáticamente con los datos de la propiedad
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={isLoading}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-gray-200 text-gray-700 hover:bg-gray-300
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <IoCloseOutline className="text-lg" />
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={isLoading}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-blue-500 text-white hover:bg-blue-600
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <IoSaveOutline className="text-lg" />
                {isLoading ? 'Guardando...' : 'Guardar Plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

WhatsAppButton.propTypes = {
  propertyId: PropTypes.number.isRequired,
  property: PropTypes.shape({
    address: PropTypes.string,
    price: PropTypes.number,
    whatsappTemplate: PropTypes.string,
  }),
};

export default WhatsAppButton;
