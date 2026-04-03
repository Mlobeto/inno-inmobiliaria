import { useState  } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPublicPlansQuery } from '@shared/redux';
import { 
  IoCheckmarkCircle, 
  IoHome, 
  IoPeople, 
  IoPersonAdd, 
  IoCloudUpload,
  IoRocketSharp,
  IoTimeSharp,
  IoCloseCircle,
  IoGlobeOutline,
  IoStorefrontOutline,
  IoPeopleCircleOutline
} from 'react-icons/io5';

/**
 * Selector de Planes Público
 * Muestra los planes disponibles y redirige a registro para crear cuenta
 */
const PlanSelector = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: plansData, isLoading: loadingPlans } = useGetPublicPlansQuery();
  // Excluir lifetime: solo lo activa el dueño de la plataforma, no es elegible por el usuario
  const plans = (plansData?.plans || []).filter(p => p.planId !== 'lifetime');

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const handleConfirmPlan = () => {
    if (!selectedPlan) return;
    
    // Guardar el plan seleccionado
    localStorage.setItem('selectedPlanId', selectedPlan.planId);
    
    // Redirigir a registro con el plan seleccionado
    navigate(`/register?planId=${selectedPlan.planId}`);
  };

  if (loadingPlans) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Selecciona tu Plan
        </h1>
        <p className="text-xl text-gray-600">
          Elige el plan que mejor se adapte a tu inmobiliaria
        </p>
      </div>

      {/* Grid de planes */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
          const isPopular = plan.isPopular;
          const hasTrial = plan.trialDays > 0;
          const isFree = parseFloat(plan.priceMonthly) === 0;

          return (
            <div
              key={plan.planId}
              className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                isPopular ? 'border-2 border-indigo-600 transform scale-105' : 'border border-gray-200'
              }`}
            >
              {/* Badge de Popular o Trial */}
              {isPopular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                  Más Popular
                </div>
              )}
              {hasTrial && !isPopular && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold flex items-center">
                  <IoTimeSharp className="mr-1" />
                  {plan.trialDays} días gratis
                </div>
              )}

              <div className="p-8">
                {/* Nombre del plan */}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6 min-h-[48px]">
                  {plan.description}
                </p>

                {/* Precio */}
                <div className="mb-6">
                  {isFree ? (
                    <div className="text-4xl font-bold text-green-600">
                      Gratis
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-800">
                          {plan.currency} {parseFloat(plan.priceMonthly).toLocaleString('es-AR')}
                        </span>
                        <span className="text-gray-500 ml-2">/mes</span>
                      </div>
                      {hasTrial && (
                        <div className="text-sm text-green-600 font-semibold mt-1">
                          Primeros {plan.trialDays} días gratis
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Características principales */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-gray-700">
                    <IoPersonAdd className="text-indigo-600 mr-3 flex-shrink-0" />
                    <span>
                      <strong>{plan.features?.maxUsers || plan.maxUsers}</strong> 
                      {plan.features?.maxUsers === 1 ? ' usuario' : ' usuarios'}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <IoHome className="text-indigo-600 mr-3 flex-shrink-0" />
                    <span>
                      <strong>
                        {plan.features?.maxProperties === -1 
                          ? 'Propiedades ilimitadas' 
                          : `${plan.features?.maxProperties || plan.maxProperties} propiedades`}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <IoPeople className="text-indigo-600 mr-3 flex-shrink-0" />
                    <span>
                      <strong>
                        {plan.features?.maxClients === -1 
                          ? 'Clientes ilimitados' 
                          : `${plan.features?.maxClients || plan.maxClients} clientes`}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <IoCloudUpload className="text-indigo-600 mr-3 flex-shrink-0" />
                    <span><strong>{plan.features?.maxStorageGB || plan.maxStorageGB || 5} GB</strong> de almacenamiento</span>
                  </div>
                </div>

                {/* Características adicionales */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Características incluidas:
                  </h4>
                  <div className="space-y-2 text-sm">
                    {/* Características Premium - destacadas */}
                    {plan.features?.landingPage !== undefined && (
                      <div className={`flex items-center ${plan.features.landingPage ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {plan.features.landingPage ? (
                          <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0 text-lg" />
                        ) : (
                          <IoCloseCircle className="text-gray-300 mr-2 flex-shrink-0 text-lg" />
                        )}
                        <IoGlobeOutline className={`mr-1 ${plan.features.landingPage ? 'text-indigo-600' : 'text-gray-300'}`} />
                        <span>Landing Page personalizada</span>
                      </div>
                    )}
                    
                    {plan.features?.mercadoLibreIntegration !== undefined && (
                      <div className={`flex items-center ${plan.features.mercadoLibreIntegration ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {plan.features.mercadoLibreIntegration ? (
                          <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0 text-lg" />
                        ) : (
                          <IoCloseCircle className="text-gray-300 mr-2 flex-shrink-0 text-lg" />
                        )}
                        <IoStorefrontOutline className={`mr-1 ${plan.features.mercadoLibreIntegration ? 'text-yellow-600' : 'text-gray-300'}`} />
                        <span>Integración Mercado Libre</span>
                      </div>
                    )}
                    
                    {plan.features?.agentRole !== undefined && (
                      <div className={`flex items-center ${plan.features.agentRole ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {plan.features.agentRole ? (
                          <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0 text-lg" />
                        ) : (
                          <IoCloseCircle className="text-gray-300 mr-2 flex-shrink-0 text-lg" />
                        )}
                        <IoPeopleCircleOutline className={`mr-1 ${plan.features.agentRole ? 'text-purple-600' : 'text-gray-300'}`} />
                        <span>Rol de Agentes</span>
                      </div>
                    )}

                    {/* Separador si hay características premium */}
                    {(plan.features?.landingPage !== undefined || 
                      plan.features?.mercadoLibreIntegration !== undefined || 
                      plan.features?.agentRole !== undefined) && (
                      <div className="border-t border-gray-100 my-2"></div>
                    )}

                    {/* Resto de características estándar */}
                    {plan.features?.pdfPropiedades && (
                      <div className="flex items-center text-gray-600">
                        <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span>PDF de propiedades</span>
                      </div>
                    )}
                    {plan.features?.editorContratos && (
                      <div className="flex items-center text-gray-600">
                        <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span>Editor de contratos</span>
                      </div>
                    )}
                    {plan.features?.whatsappTemplates && (
                      <div className="flex items-center text-gray-600">
                        <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span>Templates de WhatsApp</span>
                      </div>
                    )}
                    {plan.features?.seguimientoPagos && (
                      <div className="flex items-center text-gray-600">
                        <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span>Seguimiento de pagos</span>
                      </div>
                    )}
                    {plan.features?.actualizacionAlquileres && (
                      <div className="flex items-center text-gray-600">
                        <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span>Actualización de alquileres</span>
                      </div>
                    )}
                    {plan.features?.estadisticas && (
                      <div className="flex items-center text-gray-600">
                        <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span>Estadísticas avanzadas</span>
                      </div>
                    )}
                    {plan.features?.exportData && (
                      <div className="flex items-center text-gray-600">
                        <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span>Exportación de datos</span>
                      </div>
                    )}
                    {plan.features?.customDomain && (
                      <div className="flex items-center text-gray-600">
                        <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span>Dominio personalizado</span>
                      </div>
                    )}
                    {plan.features?.prioritySupport && (
                      <div className="flex items-center text-gray-600">
                        <IoCheckmarkCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span>Soporte prioritario</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de selección */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center ${
                    isPopular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <IoRocketSharp className="mr-2" />
                  {hasTrial ? 'Comenzar Prueba Gratuita' : 'Elegir Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Confirmar Selección
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-lg text-gray-800 mb-2">
                {selectedPlan.name}
              </h4>
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {selectedPlan.currency} {parseFloat(selectedPlan.priceMonthly).toLocaleString('es-AR')}
                <span className="text-base text-gray-500 font-normal">/mes</span>
              </div>
              {selectedPlan.trialDays > 0 && (
                <div className="text-green-600 font-semibold">
                  ✓ Incluye {selectedPlan.trialDays} días de prueba gratuita
                </div>
              )}
            </div>

            <p className="text-gray-600 mb-6">
              Crea tu cuenta para comenzar a usar este plan. 
              {selectedPlan.trialDays > 0 && ` Incluye ${selectedPlan.trialDays} días de prueba gratuita.`}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmPlan}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                Crear Cuenta
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="text-center text-gray-600 mt-12">
        <p className="mb-2">
          ✓ Cancela cuando quieras • ✓ Sin compromisos • ✓ Soporte incluido
        </p>
        <p className="text-sm">
          ¿Tienes dudas? <a href="/contact" className="text-indigo-600 hover:underline">Contáctanos</a>
        </p>
      </div>
    </div>
  );
};

export default PlanSelector;
