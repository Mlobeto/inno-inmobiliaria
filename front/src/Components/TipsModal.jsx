import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  IoCloseOutline,
  IoArrowForwardOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoPersonAddOutline,
  IoHomeOutline,
  IoDocumentTextOutline,
  IoSettingsOutline,
  IoChatboxOutline,
  IoExtensionPuzzleOutline
} from 'react-icons/io5';

const TipsModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tips = [
    {
      icon: IoSettingsOutline,
      title: '1. Configurá tu Empresa',
      description: 'Antes de comenzar, completá los datos de tu inmobiliaria. Esta información aparecerá en todos los contratos y documentos que generes.',
      details: [
        'Ingresá a "Configuración" en el menú principal',
        'Completá nombre de la empresa, CUIT, matrícula, dirección, teléfono y email',
        'Subí el logo de tu inmobiliaria',
        'Guardá los cambios antes de continuar'
      ],
      color: 'from-slate-600 to-slate-700'
    },
    {
      icon: IoChatboxOutline,
      title: '2. Configurá Plantillas y Mensajes',
      description: 'Personalizá las plantillas de contratos y los mensajes automáticos que se enviarán a tus clientes.',
      details: [
        'Accedé a "Configuración" → "Plantillas de Documentos"',
        'Editá las plantillas de contratos de alquiler, compraventa y otros documentos',
        'Configurá los mensajes de WhatsApp para comunicarte con propietarios e inquilinos',
        'Revisá las variables disponibles (nombre, propiedad, fechas, etc.)'
      ],
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: IoExtensionPuzzleOutline,
      title: '3. Configurá las Integraciones',
      description: 'Conectá tu cuenta con MercadoPago para cobrar y con MercadoLibre para publicar propiedades.',
      details: [
        'Accedé a "Configuración" → "Integraciones"',
        'Conectá MercadoPago para gestionar pagos de alquileres',
        'Vinculá tu cuenta de MercadoLibre para publicar propiedades automáticamente',
        'Podés omitir este paso y configurarlo más adelante'
      ],
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: IoPersonAddOutline,
      title: '4. Registra al Cliente Propietario',
      description: 'Comienza registrando al cliente que trae la propiedad. Este será el propietario o vendedor.',
      details: [
        'Ve a "Clientes" → "Alta de Clientes"',
        'Completa los datos del propietario (nombre, CUIL, dirección, etc.)',
        'Guarda la información antes de continuar'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: IoHomeOutline,
      title: '5. Carga la Propiedad',
      description: 'Una vez registrado el propietario, carga los datos de su propiedad.',
      details: [
        'Dirígete a "Propiedades" → "Alta Propiedades"',
        'Selecciona al propietario de la lista',
        'Completa la información de la propiedad (dirección, precio, características)',
        'Sube fotos y documentación necesaria'
      ],
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: IoPersonAddOutline,
      title: '6. Registra al Cliente Comprador/Inquilino',
      description: 'Registra al cliente interesado en comprar o alquilar la propiedad.',
      details: [
        'Ve nuevamente a "Clientes" → "Alta de Clientes"',
        'Registra los datos del comprador o inquilino',
        'Este cliente será quien firma el contrato o la orden'
      ],
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: IoDocumentTextOutline,
      title: '7. Genera el Contrato o Orden',
      description: 'Finalmente, crea el contrato de alquiler o la orden de venta.',
      details: [
        'Para alquiler: "Contratos" → "Contrato de Alquiler"',
        'Para venta: "Contratos" → "Compra Venta"',
        'Selecciona la propiedad y vincula al inquilino/comprador',
        'Completa los términos y genera el documento PDF'
      ],
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: IoCheckmarkCircleOutline,
      title: '¡Todo listo para comenzar!',
      description: 'Ya conoces el flujo completo. Seguí este orden para mantener tu información organizada y aprovechar al máximo el sistema.',
      details: [
        'Podés volver a ver estos tips en cualquier momento',
        'Buscá el ícono de ayuda (?) en el panel principal',
        'Si tenés dudas, consultá la documentación completa'
      ],
      color: 'from-green-500 to-green-600'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleNext = () => {
    if (currentStep < tips.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const currentTip = tips[currentStep];
  const IconComponent = currentTip.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-white/10 overflow-hidden">
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${currentTip.color} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-white/80 text-sm font-medium">
                  Paso {currentStep + 1} de {tips.length}
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {currentTip.title}
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <IoCloseOutline className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <p className="text-slate-300 text-lg mb-6 leading-relaxed">
            {currentTip.description}
          </p>

          {/* Lista de detalles */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <ul className="space-y-3">
              {currentTip.details.map((detail, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-slate-300 flex-1 leading-relaxed">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Progress indicators */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            {tips.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-gradient-to-r from-blue-500 to-blue-600' 
                    : index < currentStep
                    ? 'w-2 bg-green-500'
                    : 'w-2 bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900/50 border-t border-white/10 p-6">
          {/* Botones de navegación */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                currentStep === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span>Anterior</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
            >
              <span>{currentStep === tips.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
              {currentStep === tips.length - 1 ? (
                <IoCheckmarkCircleOutline className="w-5 h-5" />
              ) : (
                <IoArrowForwardOutline className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

TipsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TipsModal;
