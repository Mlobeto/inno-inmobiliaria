import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { IoSaveOutline, IoRefreshOutline, IoLockClosedOutline } from 'react-icons/io5';
import {
  useListPlansQuery,
  useUpdatePlanMutation,
  useListCatalogModulesQuery,
  useUpdateCatalogModuleMutation,
} from '@shared/redux';

const formatArs = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

function PricingManagement() {
  const { data: plansData, isLoading: loadingPlans, refetch: refetchPlans } = useListPlansQuery();
  const { data: modulesData, isLoading: loadingModules, refetch: refetchModules } = useListCatalogModulesQuery();
  const [updatePlan, { isLoading: savingPlan }] = useUpdatePlanMutation();
  const [updateModule, { isLoading: savingModule }] = useUpdateCatalogModuleMutation();

  const basePlan = (plansData?.plans || []).find((p) => p.planId === 'base');
  const lifetimePlan = (plansData?.plans || []).find((p) => p.planId === 'lifetime');
  const modules = modulesData?.modules || [];

  const [baseForm, setBaseForm] = useState({
    priceMonthly: '',
    trialDays: '',
    name: '',
    description: '',
  });
  const [moduleEdits, setModuleEdits] = useState({});

  useEffect(() => {
    if (basePlan) {
      setBaseForm({
        priceMonthly: String(basePlan.priceMonthly ?? ''),
        trialDays: String(basePlan.trialDays ?? 7),
        name: basePlan.name || 'Plan Base',
        description: basePlan.description || '',
      });
    }
  }, [basePlan]);

  useEffect(() => {
    const initial = {};
    modules.forEach((m) => {
      initial[m.moduleId] = {
        price: String(m.price ?? ''),
        name: m.name || '',
        isActive: m.isActive !== false,
      };
    });
    setModuleEdits(initial);
  }, [modules]);

  const handleSaveBase = async (e) => {
    e.preventDefault();
    if (!basePlan) return;
    try {
      await updatePlan({
        planId: 'base',
        name: baseForm.name,
        description: baseForm.description,
        priceMonthly: parseFloat(baseForm.priceMonthly),
        trialDays: parseInt(baseForm.trialDays, 10),
      }).unwrap();
      toast.success('Plan base actualizado');
      refetchPlans();
    } catch (err) {
      toast.error(err?.data?.message || 'Error al guardar plan base');
    }
  };

  const handleSaveModule = async (moduleId) => {
    const edit = moduleEdits[moduleId];
    if (!edit) return;
    try {
      await updateModule({
        moduleId,
        name: edit.name,
        price: parseFloat(edit.price),
        isActive: edit.isActive,
      }).unwrap();
      toast.success(`Módulo "${edit.name}" actualizado`);
      refetchModules();
      refetchPlans();
    } catch (err) {
      toast.error(err?.data?.message || 'Error al guardar módulo');
    }
  };

  const modulesTotal = modules
    .filter((m) => moduleEdits[m.moduleId]?.isActive !== false && m.isActive !== false)
    .reduce((sum, m) => sum + parseFloat(moduleEdits[m.moduleId]?.price ?? m.price ?? 0), 0);

  const basePrice = parseFloat(baseForm.priceMonthly || basePlan?.priceMonthly || 0);

  if (loadingPlans || loadingModules) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Cargando precios...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Precios y módulos</h2>
          <p className="text-gray-600 mt-1 text-sm">
            Los cambios se reflejan en la landing, el registro y las suscripciones nuevas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { refetchPlans(); refetchModules(); }}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <IoRefreshOutline className="w-4 h-4" />
          Recargar
        </button>
      </div>

      {/* Plan base */}
      <form onSubmit={handleSaveBase} className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan base</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={baseForm.name}
              onChange={(e) => setBaseForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio mensual (ARS)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={baseForm.priceMonthly}
              onChange={(e) => setBaseForm((f) => ({ ...f, priceMonthly: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Días de prueba</label>
            <input
              type="number"
              min="0"
              value={baseForm.trialDays}
              onChange={(e) => setBaseForm((f) => ({ ...f, trialDays: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              rows={2}
              value={baseForm.description}
              onChange={(e) => setBaseForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingPlan}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <IoSaveOutline className="w-4 h-4" />
          {savingPlan ? 'Guardando...' : 'Guardar plan base'}
        </button>
      </form>

      {/* Lifetime (solo lectura) */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg shadow p-6 text-white">
        <div className="flex items-start gap-3">
          <IoLockClosedOutline className="w-6 h-6 mt-0.5 shrink-0 text-amber-300" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Plan Lifetime — uso interno</h3>
            <p className="text-slate-300 text-sm mt-1">
              No aparece en la landing ni en el registro público. Asignalo al crear un tenant manual
              o desde el detalle del tenant. Incluye <strong className="text-white">todos los módulos</strong> sin costo.
            </p>
            <p className="text-slate-400 text-xs mt-3">
              {lifetimePlan?.description || 'Acceso completo permanente para pruebas y clientes especiales.'}
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-200 text-xs font-medium rounded-full border border-amber-400/30">
            Solo Platform Admin
          </span>
        </div>
      </div>

      {/* Módulos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Módulos add-on</h3>
            <p className="text-sm text-gray-500 mt-1">
              Máximo posible: {formatArs(basePrice + modulesTotal)}/mes (base + todos los módulos activos)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Módulo</th>
                <th className="text-left px-4 py-3 font-medium">Precio/mes</th>
                <th className="text-center px-4 py-3 font-medium">Activo</th>
                <th className="text-right px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {modules.map((mod) => {
                const edit = moduleEdits[mod.moduleId] || {};
                return (
                  <tr key={mod.moduleId} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={edit.name ?? mod.name}
                        onChange={(e) =>
                          setModuleEdits((prev) => ({
                            ...prev,
                            [mod.moduleId]: { ...prev[mod.moduleId], name: e.target.value },
                          }))
                        }
                        className="w-full max-w-xs border border-gray-200 rounded px-2 py-1.5 text-gray-900"
                      />
                      <p className="text-xs text-gray-400 mt-1 font-mono">{mod.moduleId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">$</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={edit.price ?? mod.price}
                          onChange={(e) =>
                            setModuleEdits((prev) => ({
                              ...prev,
                              [mod.moduleId]: { ...prev[mod.moduleId], price: e.target.value },
                            }))
                          }
                          className="w-28 border border-gray-200 rounded px-2 py-1.5"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={edit.isActive ?? mod.isActive}
                        onChange={(e) =>
                          setModuleEdits((prev) => ({
                            ...prev,
                            [mod.moduleId]: { ...prev[mod.moduleId], isActive: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSaveModule(mod.moduleId)}
                        disabled={savingModule}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium"
                      >
                        <IoSaveOutline className="w-4 h-4" />
                        Guardar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {modules.length === 0 && (
          <p className="p-8 text-center text-gray-500">
            No hay módulos en el catálogo. Ejecutá{' '}
            <code className="bg-gray-100 px-1 rounded">node back/scripts/seed-modules.js</code>
          </p>
        )}
      </div>
    </div>
  );
}

export default PricingManagement;
