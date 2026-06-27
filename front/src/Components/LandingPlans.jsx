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
} from 'react-icons/io5';

// Mapa de iconos por moduleId
const MODULE_ICONS = {
  temporary_rentals: IoCalendarOutline,
  landing:           IoGlobeOutline,
  leads_team:        IoPeopleOutline,
  mercadolibre:      IoStorefrontOutline,
  loteos:            IoMapOutline,
  portal_inquilino:  IoHomeOutline,
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

  const registerUrl = `/register?planId=base${
    selected.size > 0 ? `&moduleIds=${[...selected].join(',')}` : ''
  }`;

  if (isLoading) {
    return (
      <section id="planes" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando módulos...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="planes" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            Sin planes fijos
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Armá tu plan según lo que necesitás
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Empezá con lo esencial y sumá solo los módulos que tu inmobiliaria usa.
            Sin pagar por lo que no necesitás.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* Columna izquierda: preguntas + módulos */}
          <div className="lg:col-span-2 space-y-4">

            {/* Plan base — siempre incluido */}
            <div className="bg-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <IoCheckmarkSharp className="text-indigo-200 text-xl" />
                    <span className="text-indigo-200 text-sm font-medium uppercase tracking-wide">
                      Siempre incluido
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Plan Base</h3>
                  <p className="text-indigo-200 text-sm leading-relaxed">
                    Gestión completa de alquileres y ventas: propiedades, contratos,
                    cuotas, recibos y balance.
                  </p>
                  <ul className="mt-3 grid grid-cols-2 gap-1">
                    {['Alquileres', 'Ventas', 'Contratos', 'Recibos', 'Balance', 'Reportes'].map((f) => (
                      <li key={f} className="flex items-center gap-1 text-indigo-100 text-xs">
                        <IoCheckmarkCircle className="flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-3xl font-bold">{formatPrice(BASE_PRICE)}</div>
                  <div className="text-indigo-300 text-sm">/mes</div>
                  <div className="mt-2 bg-indigo-500 text-indigo-100 text-xs px-3 py-1 rounded-full">
                    7 días gratis
                  </div>
                </div>
              </div>
            </div>

            {/* Módulos */}
            <p className="text-gray-500 text-sm font-medium px-1">
              ¿Necesitás algo más? Sumá los módulos que uses:
            </p>

            {modules.map((mod) => {
              const Icon = MODULE_ICONS[mod.moduleId] || IoAddCircle;
              const isOn = selected.has(mod.moduleId);

              return (
                <button
                  key={mod.moduleId}
                  onClick={() => toggle(mod.moduleId)}
                  className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
                    isOn
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Icono */}
                      <div
                        className={`p-2 rounded-xl flex-shrink-0 ${
                          isOn ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Icon className="text-2xl" />
                      </div>

                      {/* Texto */}
                      <div>
                        <p className={`text-xs font-medium mb-1 ${isOn ? 'text-indigo-500' : 'text-gray-400'}`}>
                          {mod.question}
                        </p>
                        <h4 className="font-semibold text-gray-900">{mod.name}</h4>
                        <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    {/* Precio + toggle */}
                    <div className="flex-shrink-0 text-right">
                      <div className={`text-lg font-bold ${isOn ? 'text-indigo-600' : 'text-gray-700'}`}>
                        +{formatPrice(mod.price)}
                      </div>
                      <div className="text-gray-400 text-xs">/mes</div>
                      <div className={`mt-2 transition-colors ${isOn ? 'text-indigo-500' : 'text-gray-300'}`}>
                        {isOn
                          ? <IoRemoveCircle className="text-2xl ml-auto" />
                          : <IoAddCircle className="text-2xl ml-auto" />
                        }
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Columna derecha: resumen pegajoso */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Tu plan</h3>

              {/* Desglose */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Plan Base</span>
                  <span className="font-medium">{formatPrice(BASE_PRICE)}</span>
                </div>

                {modules
                  .filter((m) => selected.has(m.moduleId))
                  .map((m) => (
                    <div key={m.moduleId} className="flex justify-between text-sm">
                      <span className="text-indigo-600">+ {m.name}</span>
                      <span className="font-medium text-indigo-600">
                        {formatPrice(m.price)}
                      </span>
                    </div>
                  ))}

                {selected.size === 0 && (
                  <p className="text-gray-400 text-xs italic">
                    Sumá módulos para ver el total
                  </p>
                )}
              </div>

              {/* Separador */}
              <div className="border-t border-gray-100 pt-4 mb-5">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-900">Total</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(total)}
                    </span>
                    <span className="text-gray-500 text-sm">/mes</span>
                  </div>
                </div>
              </div>

              {/* Trial badge */}
              <div className="bg-green-50 text-green-700 text-sm text-center py-2 rounded-lg mb-4 font-medium">
                🎉 Primeros 7 días gratis, sin tarjeta
              </div>

              {/* CTA */}
              <Link
                to={registerUrl}
                className="block w-full py-3 px-6 rounded-xl font-semibold text-center bg-indigo-600 hover:bg-indigo-700 text-white transition"
              >
                Comenzar gratis
              </Link>

              <p className="text-center text-gray-400 text-xs mt-3">
                Cancelás cuando quieras · Sin permanencia
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-500 text-sm mt-10">
          ¿Tenés dudas sobre qué módulos necesitás?{' '}
          <a href="#contacto" className="text-indigo-600 hover:underline">
            Consultanos
          </a>
        </p>
      </div>
    </section>
  );
}

export default LandingPlans;
