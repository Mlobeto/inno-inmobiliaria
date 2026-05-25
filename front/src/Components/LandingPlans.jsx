import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetPublicPlansQuery } from '@shared/redux';
import { IoCheckmarkCircle,  IoRocketSharp } from 'react-icons/io5';

function LandingPlans() {
  const { data: plansData, isLoading } = useGetPublicPlansQuery();
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly | yearly

  const plans = plansData?.plans || [];

  // Filtrar solo planes activos y ordenados (excluir lifetime: solo lo activa el dueño de la plataforma)
  const activePlans = plans
    .filter(plan => plan.isActive && plan.planId !== 'lifetime')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(parseFloat(price));
  };

  // Características a mostrar en la comparación
  // eslint-disable-next-line no-unused-vars
  const featureLabels = {
    maxProperties: 'Propiedades',
    maxClients: 'Clientes',
    maxUsers: 'Usuarios',
    pdfPropiedades: 'PDF de Propiedades',
    editorContratos: 'Editor de Contratos',
    whatsappTemplates: 'Plantillas WhatsApp',
    seguimientoPagos: 'Seguimiento de Pagos',
    actualizacionAlquileres: 'Actualización de Alquileres',
    autorizacionVentas: 'Autorización de Ventas',
    estadisticas: 'Estadísticas Avanzadas',
    exportData: 'Exportación Excel/CSV',
    mercadoLibreIntegration: 'Integración Mercado Libre',
    soportePrioritario: 'Soporte Prioritario'
  };

  if (isLoading) {
    return (
      <section id="planes" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando planes...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="planes" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Planes y Precios
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Elige el plan que mejor se adapte al tamaño de tu inmobiliaria
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                billingCycle === 'yearly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Ahorra 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {activePlans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const priceLabel = billingCycle === 'monthly' ? '/mes' : '/año';
            const isTrial = plan.planId === 'trial' || plan.trialDays > 0 && parseFloat(price) === 0;

            return (
              <div
                key={plan.planId}
                className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                  plan.isPopular
                    ? 'border-indigo-600 transform scale-105'
                    : 'border-gray-200'
                }`}
              >
                {/* Popular badge */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <IoRocketSharp />
                      Más Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  )}
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      {formatPrice(price)}
                    </span>
                    {!isTrial && (
                      <span className="text-gray-600 text-lg">{priceLabel}</span>
                    )}
                  </div>
                  {isTrial && (
                    <div className="bg-green-50 text-green-700 py-2 px-4 rounded-lg text-sm font-medium">
                      🎉 {plan.trialDays} días de prueba gratuita
                    </div>
                  )}
                </div>

                {/* Features list */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm">
                    <IoCheckmarkCircle className="text-green-500 flex-shrink-0" />
                    <span>
                      <strong>{plan.features.maxProperties === 999999 ? 'Ilimitadas' : plan.features.maxProperties}</strong> propiedades
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IoCheckmarkCircle className="text-green-500 flex-shrink-0" />
                    <span>
                      <strong>{plan.features.maxClients === 999999 ? 'Ilimitados' : plan.features.maxClients}</strong> clientes
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IoCheckmarkCircle className="text-green-500 flex-shrink-0" />
                    <span>
                      <strong>{plan.features.maxUsers === 999999 ? 'Ilimitados' : plan.features.maxUsers || 1}</strong> usuarios
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IoCheckmarkCircle className="text-green-500 flex-shrink-0" />
                    <span>
                      <strong>{plan.features.maxStorageGB === 999999 ? 'Ilimitado' : plan.features.maxStorageGB}</strong> GB almacenamiento
                    </span>
                  </li>

                  {/* Características base */}
                  {(plan.features.pdfPropiedades || plan.features.pdfTemplates) && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-green-500 flex-shrink-0" />
                      <span>Generación PDF propiedades</span>
                    </li>
                  )}
                  {(plan.features.editorContratos || plan.features.customTemplates) && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-green-500 flex-shrink-0" />
                      <span>Editor de contratos</span>
                    </li>
                  )}
                  {(plan.features.whatsappTemplates || plan.features.whatsappIntegration) && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-green-500 flex-shrink-0" />
                      <span>Plantillas WhatsApp</span>
                    </li>
                  )}

                  {/* Características premium */}
                  {plan.features.estadisticas && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>Estadísticas avanzadas</span>
                    </li>
                  )}
                  {plan.features.exportData && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>Exportación Excel/CSV</span>
                    </li>
                  )}
                  {plan.features.mercadoLibreIntegration && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>Integración Mercado Libre</span>
                    </li>
                  )}
                  {plan.features.leads && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>CRM Leads</span>
                    </li>
                  )}
                  {plan.features.landingPage && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>Página web</span>
                    </li>
                  )}
                  {plan.features.portalInquilino && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>Portal inquilinos (informar transferencias)</span>
                    </li>
                  )}
                  {plan.features.agentRole && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>Agentes y comisiones</span>
                    </li>
                  )}
                  {plan.features.loteos && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>Gestión de loteos</span>
                    </li>
                  )}
                  {plan.features.electronicInvoicing && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>Facturación electrónica AFIP/ARCA</span>
                    </li>
                  )}
                  {(plan.features.soportePrioritario || plan.features.prioritySupport) && (
                    <li className="flex items-center gap-2 text-sm">
                      <IoCheckmarkCircle className="text-indigo-500 flex-shrink-0" />
                      <span>Soporte prioritario</span>
                    </li>
                  )}
                </ul>

                {/* CTA Button */}
                <Link
                  to={`/register?planId=${plan.planId}`}
                  className={`block w-full py-3 px-6 rounded-lg font-semibold transition text-center ${
                    plan.isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {isTrial ? 'Comenzar Prueba Gratuita' : 'Elegir Plan'}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="text-center text-gray-600 text-sm">
          <p>💳 Sin tarjeta de crédito requerida para la prueba gratuita</p>
          <p className="mt-2">✓ Cancela cuando quieras, sin compromisos</p>
        </div>
      </div>
    </section>
  );
}

export default LandingPlans;
