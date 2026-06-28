import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetPublicModulesQuery } from '@shared/redux';
import {
  IoCheckmarkCircle,
  IoAddCircle,
  IoRemoveCircle,
  IoGlobeOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoStorefrontOutline,
  IoMapOutline,
  IoHomeOutline,
  IoCheckmarkSharp,
  IoArrowForwardOutline,
} from 'react-icons/io5';

const MODULE_ICONS = {
  temporary_rentals: IoCalendarOutline,
  landing: IoGlobeOutline,
  leads_team: IoPeopleOutline,
  mercadolibre: IoStorefrontOutline,
  loteos: IoMapOutline,
  portal_inquilino: IoHomeOutline,
};

const BASE_PRICE = 10000;

const formatPrice = (price) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(parseFloat(price));

function LandingPlans() {
  const { data, isLoading } = useGetPublicModulesQuery();
  const [selected, setSelected] = useState(new Set());

  const modules = data?.modules || [];

  const toggle = (moduleId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const modulesTotal = modules
    .filter((m) => selected.has(m.moduleId))
    .reduce((sum, m) => sum + parseFloat(m.price), 0);

  const total = BASE_PRICE + modulesTotal;

  const registerUrl = `/registro?planId=base${
    selected.size > 0 ? `&moduleIds=${[...selected].join(',')}` : ''
  }`;

  if (isLoading) {
    return (
      <section id="planes" className="py-16 sm:py-24 bg-bgSurface font-Montserrat border-t border-borderBase">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand border-t-transparent mx-auto" />
          <p className="mt-4 text-textSecondary">Cargando módulos...</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="planes"
      className="relative py-16 sm:py-24 bg-bgSurface font-Montserrat border-t border-borderBase overflow-hidden"
    >
      {/* Glow de fondo — continuidad con el hero */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(90,140,114,0.14) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-borderStrong bg-brand-subtle/80 px-4 py-1.5 text-sm font-semibold text-brand-light mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-light animate-pulse" />
            Sin planes fijos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-textPrimary mb-4 tracking-tight">
            Armá tu plan según lo que necesitás
          </h2>
          <p className="text-base sm:text-lg text-textSecondary max-w-2xl mx-auto leading-relaxed">
            Empezá con lo esencial y sumá solo los módulos que tu inmobiliaria usa.
            Sin pagar por lo que no necesitás.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Módulos */}
          <div className="lg:col-span-2 space-y-4">
            {/* Plan base */}
            <div className="rounded-2xl border border-borderStrong bg-gradient-to-br from-brand-dark to-brand p-6 sm:p-7 shadow-brandGlow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <IoCheckmarkSharp className="text-brand-light text-xl shrink-0" />
                    <span className="text-brand-light text-xs font-semibold uppercase tracking-wider">
                      Siempre incluido
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-textWhite mb-2">Plan Base</h3>
                  <p className="text-textWhite/80 text-sm leading-relaxed max-w-lg">
                    Gestión completa de alquileres y ventas: propiedades, contratos,
                    cuotas, recibos y balance.
                  </p>
                  <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Alquileres', 'Ventas', 'Contratos', 'Recibos', 'Balance', 'Reportes'].map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-textWhite/90 text-xs sm:text-sm">
                        <IoCheckmarkCircle className="text-brand-light shrink-0 w-4 h-4" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="sm:text-right shrink-0 sm:pl-4">
                  <div className="text-3xl sm:text-4xl font-bold text-textWhite">{formatPrice(BASE_PRICE)}</div>
                  <div className="text-brand-light/90 text-sm">/mes</div>
                  <div className="mt-2 inline-block bg-brand-muted/80 text-brand-light text-xs font-medium px-3 py-1 rounded-full border border-borderStrong">
                    7 días gratis
                  </div>
                </div>
              </div>
            </div>

            <p className="text-textSecondary text-sm font-medium px-1 pt-1">
              ¿Necesitás algo más? Tocá para sumar módulos:
            </p>

            {modules.map((mod) => {
              const Icon = MODULE_ICONS[mod.moduleId] || IoAddCircle;
              const isOn = selected.has(mod.moduleId);

              return (
                <button
                  key={mod.moduleId}
                  type="button"
                  onClick={() => toggle(mod.moduleId)}
                  className={`w-full text-left rounded-xl border-2 p-5 sm:p-6 transition-all duration-200 ${
                    isOn
                      ? 'border-brand-light bg-brand-subtle shadow-brandGlow ring-1 ring-brand-light/30'
                      : 'border-borderBase bg-bgElevated hover:border-borderStrong hover:bg-bgBase hover:shadow-brand'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isOn ? 'bg-brand-muted text-brand-light' : 'bg-brand-subtle text-textMuted'
                        }`}
                      >
                        <Icon className="text-2xl" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium mb-1 ${isOn ? 'text-brand-light' : 'text-textMuted'}`}>
                          {mod.question}
                        </p>
                        <h4 className="font-semibold text-textPrimary text-base sm:text-lg">{mod.name}</h4>
                        <p className="text-textSecondary text-sm mt-1 leading-relaxed">{mod.description}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`text-lg sm:text-xl font-bold ${isOn ? 'text-brand-light' : 'text-textPrimary'}`}>
                        +{formatPrice(mod.price)}
                      </div>
                      <div className="text-textMuted text-xs">/mes</div>
                      <div className={`mt-2 ${isOn ? 'text-brand-light' : 'text-textMuted'}`}>
                        {isOn ? (
                          <IoRemoveCircle className="text-2xl ml-auto" aria-label="Quitar módulo" />
                        ) : (
                          <IoAddCircle className="text-2xl ml-auto" aria-label="Agregar módulo" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Resumen sticky */}
          <div className="lg:sticky lg:top-20">
            <div className="rounded-2xl border-2 border-borderStrong bg-bgElevated p-6 shadow-brandGlow">
              <h3 className="font-bold text-textPrimary mb-1 text-lg">Tu plan</h3>
              <p className="text-textMuted text-xs mb-5">Precio estimado mensual</p>

              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-textSecondary">Plan Base</span>
                  <span className="font-medium text-textPrimary">{formatPrice(BASE_PRICE)}</span>
                </div>
                {modules
                  .filter((m) => selected.has(m.moduleId))
                  .map((m) => (
                    <div key={m.moduleId} className="flex justify-between text-sm gap-2">
                      <span className="text-brand-light truncate">+ {m.name}</span>
                      <span className="font-medium text-brand-light shrink-0">{formatPrice(m.price)}</span>
                    </div>
                  ))}
                {selected.size === 0 && (
                  <p className="text-textMuted text-xs italic py-1">
                    Sumá módulos para ver el total actualizado
                  </p>
                )}
              </div>

              <div className="border-t border-borderBase pt-4 mb-5">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-textPrimary">Total</span>
                  <div className="text-right">
                    <span className="text-3xl sm:text-4xl font-bold text-textPrimary">{formatPrice(total)}</span>
                    <span className="text-textSecondary text-sm ml-1">/mes</span>
                  </div>
                </div>
              </div>

              <div className="bg-brand-subtle border border-borderBase text-brand-light text-sm text-center py-2.5 rounded-lg mb-4 font-medium">
                Primeros 7 días gratis · Sin tarjeta
              </div>

              <Link
                to={registerUrl}
                className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-semibold bg-brand hover:bg-brand-dark text-textWhite transition-colors shadow-brandGlow"
              >
                Comenzar gratis
                <IoArrowForwardOutline className="w-4 h-4" />
              </Link>

              <p className="text-center text-textMuted text-xs mt-3">
                Cancelás cuando quieras · Sin permanencia
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-textSecondary text-sm mt-10">
          ¿Tenés dudas sobre qué módulos necesitás?{' '}
          <Link to="/contacto" className="text-brand-light hover:underline font-medium">
            Consultanos
          </Link>
        </p>
      </div>
    </section>
  );
}

export default LandingPlans;
