import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPublicPlansQuery } from '@shared/redux';
import Logo from './Logo';
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoRocketSharp,
  IoTimeSharp,
  IoGlobeOutline,
  IoStorefrontOutline,
  IoPeopleCircleOutline,
  IoMapOutline,
  IoFunnelOutline,
  IoSparkles,
  IoTrophyOutline,
  IoKeyOutline,
} from 'react-icons/io5';

const PLAN_COLORS = {
  basic:        { from: 'from-[#3D4A42]',   to: 'to-[#2A3530]',   accent: 'text-textSecondary', btn: 'bg-brand-muted hover:bg-brand-dark' },
  professional: { from: 'from-brand-dark',  to: 'to-brand',       accent: 'text-brand-light',   btn: 'bg-brand hover:bg-brand-dark' },
  gestpro:      { from: 'from-brand',       to: 'to-brand-light', accent: 'text-brand-light',   btn: 'bg-brand hover:bg-brand-dark' },
  enterprise:   { from: 'from-brand',       to: 'to-brand-light', accent: 'text-brand-light',   btn: 'bg-brand hover:bg-brand-dark' },
  agencia:      { from: 'from-customYellow', to: 'to-brand-dark', accent: 'text-customYellow',  btn: 'bg-brand hover:bg-brand-dark' },
};

// Filas de la tabla comparativa
const COMPARE_ROWS = [
  { label: 'Propiedades',          key: 'maxProperties',          render: v => v === -1 ? 'Ilimitadas' : v },
  { label: 'Clientes',             key: 'maxClients',             render: v => v === -1 ? 'Ilimitados' : v },
  { label: 'Usuarios',             key: 'maxUsers',               render: v => v },
  { label: 'Almacenamiento',       key: 'maxStorageGB',           render: v => `${v} GB` },
  { label: 'Página web',         key: 'landingPage',            render: v => v },
  { label: 'Portal inquilinos',    key: 'portalInquilino',        render: v => v },
  { label: 'MercadoLibre',         key: 'mercadoLibreIntegration',render: v => v },
  { label: 'WhatsApp',             key: 'whatsappIntegration',    render: v => v },
  { label: 'CRM Leads',            key: 'leads',                  render: v => v },
  { label: 'Agentes & Comisiones', key: 'agentRole',              render: v => v },
  { label: 'Facturación ARCA',     key: 'electronicInvoicing',    render: v => v },
  { label: 'Gestión Loteos',       key: 'loteos',                 render: v => v },
  { label: 'Dominio propio',       key: 'customDomain',           render: v => v },
  { label: 'Soporte prioritario',  key: 'prioritySupport',        render: v => v },
];

/**
 * Selector de Planes Público
 * Muestra los planes disponibles y redirige a registro para crear cuenta
 */
const PlanSelector = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTable, setShowTable] = useState(false);

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
      <div className="flex justify-center items-center min-h-screen bg-[#0B0E0C]">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E0C] font-Montserrat text-textPrimary">
      {/* Hero header */}
      <div className="text-center pt-12 pb-8 px-4">
        <div className="flex justify-center mb-5">
          <Logo color="#7FB99A" size={64} />
        </div>
        <div className="inline-flex items-center gap-2 bg-brand-subtle border border-borderBase text-brand-light text-sm font-medium px-4 py-1.5 rounded-full mb-5">
          <IoSparkles className="text-brand-light" />
          Planes para tu inmobiliaria
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-textPrimary mb-3 tracking-tight">
          Elegí tu plan
        </h1>
        <p className="text-base text-textSecondary max-w-xl mx-auto">
          Desde pequeñas inmobiliarias hasta grandes agencias — tenemos el plan ideal para vos.
        </p>

        {/* Toggle cards / tabla */}
        <div className="mt-6 inline-flex items-center bg-bgSurface border border-borderBase rounded-xl p-1 gap-1">
          <button
            onClick={() => setShowTable(false)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              !showTable
                ? 'bg-brand text-textWhite shadow-brandGlow'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            Tarjetas
          </button>
          <button
            onClick={() => setShowTable(true)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              showTable
                ? 'bg-brand text-textWhite shadow-brandGlow'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            Comparar
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">

        {/* ── VISTA CARDS ── */}
        {!showTable && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const colors  = PLAN_COLORS[plan.planId] || PLAN_COLORS.basic;
              const isNew   = plan.planId === 'gestpro';
              const isPopular = plan.isPopular;
              const hasTrial  = plan.trialDays > 0;
              const isFree    = parseFloat(plan.priceMonthly) === 0;
              const features  = plan.features || {};

              return (
                <div
                  key={plan.planId}
                  className={`relative flex flex-col bg-bgSurface backdrop-blur border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-brandGlow ${
                    isPopular
                      ? 'border-brand ring-2 ring-brand/30'
                      : isNew
                      ? 'border-customYellow/60 ring-2 ring-customYellow/20'
                      : 'border-borderBase'
                  }`}
                >
                  {/* Cabecera con gradiente */}
                  <div className={`bg-gradient-to-br ${colors.from} ${colors.to} p-5`}>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <div className="flex flex-col items-end gap-1">
                        {isNew && (
                          <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            <IoSparkles className="text-yellow-300" /> Nuevo
                          </span>
                        )}
                        {isPopular && !isNew && (
                          <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            <IoTrophyOutline /> Popular
                          </span>
                        )}
                        {hasTrial && (
                          <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            <IoTimeSharp /> {plan.trialDays}d gratis
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-white/80 text-sm min-h-[36px]">{plan.description}</p>
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    {/* Precio */}
                    <div className="mb-5">
                      {isFree ? (
                        <span className="text-4xl font-extrabold text-green-400">Gratis</span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-white">
                            {plan.currency} {parseFloat(plan.priceMonthly).toLocaleString('es-AR')}
                          </span>
                          <span className="text-slate-400 text-sm">/mes</span>
                        </div>
                      )}
                    </div>

                    {/* Métricas clave */}
                    <div className="grid grid-cols-2 gap-2 mb-5 text-sm">
                      <div className="bg-slate-700/50 rounded-lg px-3 py-2 text-center">
                        <div className="text-white font-bold text-base">
                          {features.maxProperties === -1 ? '∞' : (features.maxProperties ?? '—')}
                        </div>
                        <div className="text-slate-400 text-xs">Propiedades</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg px-3 py-2 text-center">
                        <div className="text-white font-bold text-base">
                          {features.maxClients === -1 ? '∞' : (features.maxClients ?? '—')}
                        </div>
                        <div className="text-slate-400 text-xs">Clientes</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg px-3 py-2 text-center">
                        <div className="text-white font-bold text-base">{features.maxUsers ?? '—'}</div>
                        <div className="text-slate-400 text-xs">Usuarios</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg px-3 py-2 text-center">
                        <div className="text-white font-bold text-base">{features.maxStorageGB ?? '—'} GB</div>
                        <div className="text-slate-400 text-xs">Storage</div>
                      </div>
                    </div>

                    {/* Features flags */}
                    <div className="space-y-1.5 mb-6 text-sm flex-1">
                      {[
                        { key: 'landingPage',             label: 'Página web',          icon: <IoGlobeOutline /> },
                        { key: 'portalInquilino',         label: 'Portal inquilinos',     icon: <IoKeyOutline /> },
                        { key: 'mercadoLibreIntegration', label: 'MercadoLibre',           icon: <IoStorefrontOutline /> },
                        { key: 'leads',                   label: 'CRM Leads',             icon: <IoFunnelOutline /> },
                        { key: 'agentRole',               label: 'Agentes & Comisiones',  icon: <IoPeopleCircleOutline /> },
                        { key: 'electronicInvoicing',     label: 'Facturación ARCA',      icon: null },
                        { key: 'loteos',                  label: 'Gestión Loteos',        icon: <IoMapOutline /> },
                        { key: 'customDomain',            label: 'Dominio propio',        icon: <IoGlobeOutline /> },
                        { key: 'prioritySupport',         label: 'Soporte prioritario',   icon: null },
                      ].map(({ key, label, icon }) => {
                        const val = features[key];
                        if (val === undefined) return null;
                        return (
                          <div key={key} className={`flex items-center gap-2 ${val ? 'text-slate-200' : 'text-slate-600'}`}>
                            {val
                              ? <IoCheckmarkCircle className="text-green-400 flex-shrink-0 text-base" />
                              : <IoCloseCircle className="text-slate-600 flex-shrink-0 text-base" />
                            }
                            {icon && <span className={val ? colors.accent : 'text-slate-600'}>{icon}</span>}
                            <span className={val ? 'font-medium' : 'line-through opacity-50'}>{label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${colors.btn}`}
                    >
                      <IoRocketSharp />
                      {hasTrial ? `Probar ${plan.trialDays} días gratis` : 'Elegir Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── VISTA TABLA COMPARATIVA ── */}
        {showTable && (
          <div className="overflow-x-auto rounded-2xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800">
                  <th className="text-left text-slate-400 font-semibold px-6 py-4 w-44">Característica</th>
                  {plans.map((plan) => {
                    const colors  = PLAN_COLORS[plan.planId] || PLAN_COLORS.basic;
                    const isNew   = plan.planId === 'gestpro';
                    const isPopular = plan.isPopular;
                    return (
                      <th key={plan.planId} className="text-center px-4 py-4">
                        <div className={`inline-block bg-gradient-to-br ${colors.from} ${colors.to} rounded-xl px-4 py-2`}>
                          <div className="text-white font-bold text-base">{plan.name}</div>
                          {isNew && (
                            <span className="inline-flex items-center gap-0.5 text-yellow-200 text-xs font-bold">
                              <IoSparkles /> Nuevo
                            </span>
                          )}
                          {isPopular && !isNew && (
                            <span className="inline-flex items-center gap-0.5 text-white/80 text-xs font-semibold">
                              <IoTrophyOutline /> Popular
                            </span>
                          )}
                          <div className="text-white/80 text-xs mt-0.5">
                            {parseFloat(plan.priceMonthly) === 0
                              ? 'Gratis'
                              : `${plan.currency} ${parseFloat(plan.priceMonthly).toLocaleString('es-AR')}/mes`}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/30'}
                  >
                    <td className="text-slate-300 font-medium px-6 py-3">{row.label}</td>
                    {plans.map((plan) => {
                      const features = plan.features || {};
                      const raw = features[row.key] ?? plan[row.key];
                      const rendered = raw !== undefined ? row.render(raw) : null;
                      return (
                        <td key={plan.planId} className="text-center px-4 py-3">
                          {rendered === null ? (
                            <span className="text-slate-600">—</span>
                          ) : typeof rendered === 'boolean' ? (
                            rendered
                              ? <IoCheckmarkCircle className="text-green-400 text-lg mx-auto" />
                              : <IoCloseCircle className="text-slate-600 text-lg mx-auto" />
                          ) : (
                            <span className="text-white font-semibold">{rendered}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Fila CTA */}
                <tr className="bg-slate-800/60">
                  <td className="px-6 py-4"></td>
                  {plans.map((plan) => {
                    const colors = PLAN_COLORS[plan.planId] || PLAN_COLORS.basic;
                    const hasTrial = plan.trialDays > 0;
                    return (
                      <td key={plan.planId} className="text-center px-4 py-4">
                        <button
                          onClick={() => handleSelectPlan(plan)}
                          className={`px-5 py-2 rounded-xl text-white text-sm font-bold transition-all ${colors.btn}`}
                        >
                          {hasTrial ? `Probar ${plan.trialDays}d` : 'Elegir'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer con garantías */}
      <div className="text-center text-slate-500 text-sm pb-12 px-4">
        <p className="mb-1">✓ Cancelás cuando querés &nbsp;•&nbsp; ✓ Sin compromisos &nbsp;•&nbsp; ✓ Soporte incluido</p>
        <p>
          ¿Tenés dudas?{' '}
          <a href="/contacto" className="text-brand-light hover:text-brand hover:underline">Contactanos</a>
        </p>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-white mb-1">Confirmar selección</h3>
            <p className="text-slate-400 text-sm mb-6">Estás a un paso de comenzar.</p>

            <div className={`bg-gradient-to-br ${(PLAN_COLORS[selectedPlan.planId] || PLAN_COLORS.basic).from} ${(PLAN_COLORS[selectedPlan.planId] || PLAN_COLORS.basic).to} rounded-xl p-5 mb-6`}>
              <h4 className="font-bold text-xl text-white mb-1">{selectedPlan.name}</h4>
              <div className="text-white/90 text-3xl font-extrabold">
                {parseFloat(selectedPlan.priceMonthly) === 0
                  ? 'Gratis'
                  : `${selectedPlan.currency} ${parseFloat(selectedPlan.priceMonthly).toLocaleString('es-AR')}`}
                {parseFloat(selectedPlan.priceMonthly) > 0 && (
                  <span className="text-white/60 text-base font-normal ml-1">/mes</span>
                )}
              </div>
              {selectedPlan.trialDays > 0 && (
                <div className="text-white/80 text-sm mt-1 font-semibold">
                  ✓ Incluye {selectedPlan.trialDays} días de prueba gratuita
                </div>
              )}
            </div>

            <p className="text-slate-400 text-sm mb-6">
              Creá tu cuenta para comenzar a usar este plan.
              {selectedPlan.trialDays > 0 && ` Tendrás ${selectedPlan.trialDays} días gratis sin cargo.`}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmPlan}
                className="flex-1 bg-brand hover:bg-brand-dark text-textWhite px-6 py-3 rounded-xl transition font-bold"
              >
                Crear Cuenta
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-6 py-3 rounded-xl transition font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanSelector;
