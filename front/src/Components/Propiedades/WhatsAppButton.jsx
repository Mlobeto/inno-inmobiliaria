import { useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { IoLogoWhatsapp, IoCheckmarkCircleOutline, IoPencilOutline, IoSaveOutline, IoCloseOutline } from 'react-icons/io5';
import { copyWhatsAppToClipboard, updateWhatsAppTemplate } from '../../redux/Actions/actions';
import {
  modalOverlay,
  modalBox,
  modalHeader,
  btnPrimary,
  btnSecondary,
  btnWa,
  inputClass,
  labelClass,
  formSectionAccent,
} from './propiedadesTheme';

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
        className={`${btnWa} disabled:opacity-50 disabled:cursor-not-allowed ${copied ? 'ring-2 ring-brand-light' : ''}`}
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
        className={btnSecondary}
        title="Editar plantilla de WhatsApp"
      >
        <IoPencilOutline className="text-lg" />
      </button>

      {/* Modal para Editar Plantilla */}
      {showTemplateEditor && (
        <div className={modalOverlay}>
          <div className={`${modalBox} max-w-3xl max-h-[90vh] overflow-y-auto`}>
            <div className={`${modalHeader} bg-brand-subtle/40`}>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-textPrimary">
                  <IoPencilOutline />
                  Editar Plantilla de WhatsApp
                </h2>
                <p className="text-textSecondary mt-2 text-sm">
                  Personaliza el mensaje para esta propiedad usando variables
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className={`${formSectionAccent} p-4`}>
                <p className="font-semibold text-textPrimary">
                  {property?.address || 'Dirección no disponible'}
                </p>
                <p className="text-sm text-textSecondary mt-1">
                  Precio: AR$ {property?.price?.toLocaleString() || 'N/A'}
                </p>
              </div>

              <div className="bg-bgElevated p-4 rounded-lg border border-borderBase">
                <h3 className="font-semibold text-textPrimary mb-2">Variables disponibles</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <code className="bg-bgSurface px-2 py-1 rounded border border-borderBase text-textSecondary">{'{precio}'}</code>
                  <code className="bg-bgSurface px-2 py-1 rounded border border-borderBase text-textSecondary">{'{direccion}'}</code>
                  <code className="bg-bgSurface px-2 py-1 rounded border border-borderBase text-textSecondary">{'{ciudad}'}</code>
                  <code className="bg-bgSurface px-2 py-1 rounded border border-borderBase text-textSecondary">{'{barrio}'}</code>
                  <code className="bg-bgSurface px-2 py-1 rounded border border-borderBase text-textSecondary">{'{tipo}'}</code>
                  <code className="bg-bgSurface px-2 py-1 rounded border border-borderBase text-textSecondary">{'{habitaciones}'}</code>
                  <code className="bg-bgSurface px-2 py-1 rounded border border-borderBase text-textSecondary">{'{baños}'}</code>
                  <code className="bg-bgSurface px-2 py-1 rounded border border-borderBase text-textSecondary">{'{superficieTotal}'}</code>
                  <code className="bg-bgSurface px-2 py-1 rounded border border-borderBase text-textSecondary">{'{descripcion}'}</code>
                </div>
              </div>

              <div>
                <label className={labelClass}>Plantilla de Mensaje</label>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={12}
                  className={`${inputClass} font-mono`}
                  placeholder="Escribe tu plantilla aquí..."
                />
                <p className="text-xs text-textMuted mt-2">
                  Usa las variables para que se reemplacen automáticamente con los datos de la propiedad
                </p>
              </div>
            </div>

            <div className="bg-bgElevated px-6 py-4 border-t border-borderBase flex justify-end gap-3">
              <button onClick={handleCancelEdit} disabled={isLoading} className={btnSecondary}>
                <IoCloseOutline className="text-lg" />
                Cancelar
              </button>
              <button onClick={handleSaveTemplate} disabled={isLoading} className={btnPrimary}>
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
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    whatsappTemplate: PropTypes.string,
  }),
};

export default WhatsAppButton;
