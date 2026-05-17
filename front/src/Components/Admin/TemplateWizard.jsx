import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import PropTypes from 'prop-types';
import {
  IoChevronForwardOutline,
  IoChevronBackOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSaveOutline,
  IoEyeOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

const STEPS = [
  { id: 1, label: 'Tipo',      icon: IoDocumentTextOutline },
  { id: 2, label: 'Nombre',    icon: IoDocumentTextOutline },
  { id: 3, label: 'Cláusulas', icon: IoDocumentTextOutline },
  { id: 4, label: 'Vista previa', icon: IoEyeOutline },
];

const CONTRACT_TYPE_OPTIONS = [
  { value: 'CONTRATO_ALQUILER',            label: 'Alquiler residencial',  desc: 'Contratos de locación con fines habitacionales (Ley 27.551)', icon: '🏠' },
  { value: 'CONTRATO_ALQUILER_TEMPORARIO', label: 'Alquiler temporario',   desc: 'Contratos de hasta 3 meses para uso turístico o transitorio',  icon: '🗓️' },
];

const PROPERTY_PURPOSE_OPTIONS = [
  { value: 'VIVIENDA',  label: 'Vivienda',   desc: 'Casa, departamento, duplex' },
  { value: 'COMERCIAL', label: 'Comercial',  desc: 'Local, oficina, galpón' },
  { value: '',          label: 'General',    desc: 'Aplica a cualquier tipo de propiedad' },
];

const CATEGORY_LABELS = {
  obligatoria: { label: 'Obligatoria', color: 'border-red-300 bg-red-50'    },
  garantia:    { label: 'Garantía',    color: 'border-violet-300 bg-violet-50' },
  opcional:    { label: 'Opcional',    color: 'border-blue-300 bg-blue-50'  },
  general:     { label: 'General',     color: 'border-gray-300 bg-gray-50'  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HTML assembler
// ─────────────────────────────────────────────────────────────────────────────
function assembleHtml(selectedClauses) {
  const clauseBlocks = selectedClauses.map(c => c.content).join('\n\n');
  return `<div class="contrato-body">\n${clauseBlocks}\n</div>`;
}

function buildSignatureFooter() {
  return `<div style="margin-top:60px">
  <p style="text-align:center;font-size:10pt">En prueba de conformidad, las partes firman el presente contrato en <strong>{{ciudad}}</strong>, a los <strong>{{dia}}</strong> días del mes de <strong>{{mes}}</strong> de <strong>{{anio}}</strong>.</p>
  <div style="display:flex;justify-content:space-around;margin-top:50px">
    <div style="text-align:center;width:40%">
      <div style="border-top:1px solid #000;padding-top:6px">
        <p style="margin:0;font-size:10pt"><strong>{{propietario.nombre}}</strong></p>
        <p style="margin:0;font-size:9pt">LOCADOR</p>
      </div>
    </div>
    <div style="text-align:center;width:40%">
      <div style="border-top:1px solid #000;padding-top:6px">
        <p style="margin:0;font-size:10pt"><strong>{{inquilino.nombre}}</strong></p>
        <p style="margin:0;font-size:9pt">LOCATARIO</p>
      </div>
    </div>
  </div>
</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TemplateWizard({ onClose, onSaved }) {
  const token = useSelector(s => s.token);
  const headers = { Authorization: `Bearer ${token}` };

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: type
  const [contractType,    setContractType]    = useState('CONTRATO_ALQUILER');
  const [propertyPurpose, setPropertyPurpose] = useState('');

  // Step 2: name + config
  const [templateName, setTemplateName] = useState('');
  const [pageSize,     setPageSize]     = useState('A4');
  const [orientation,  setOrientation]  = useState('portrait');

  // Step 3: clauses
  const [available,     setAvailable]     = useState([]);
  const [loadingClauses, setLoadingClauses] = useState(false);
  const [selected,      setSelected]      = useState([]);
  const [catFilter,     setCatFilter]     = useState('');

  // Step 4: preview
  const [previewHtml, setPreviewHtml] = useState('');

  const loadClauses = useCallback(async () => {
    setLoadingClauses(true);
    try {
      const params = new URLSearchParams({ contractType });
      if (catFilter) params.set('category', catFilter);
      const res = await axios.get(`${API}/clause-library?${params}`, { headers });
      setAvailable(res.data.clauses);
    } finally {
      setLoadingClauses(false);
    }
  }, [contractType, catFilter, token]);

  useEffect(() => { if (step === 3) loadClauses(); }, [step, loadClauses]);

  useEffect(() => {
    if (step === 4) setPreviewHtml(assembleHtml(selected) + '\n' + buildSignatureFooter());
  }, [step, selected]);

  const isSelected = (id) => selected.some(s => s.id === id);

  const toggleClause = (clause) => {
    if (isSelected(clause.id)) {
      setSelected(prev => prev.filter(s => s.id !== clause.id));
    } else {
      setSelected(prev => [...prev, clause]);
    }
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    setSelected(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx) => {
    setSelected(prev => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const canNext = () => {
    if (step === 1) return !!contractType;
    if (step === 2) return templateName.trim().length >= 3;
    if (step === 3) return selected.length > 0;
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const htmlTemplate = assembleHtml(selected) + '\n' + buildSignatureFooter();
      await axios.post(`${API}/pdf-templates`, {
        templateType:    contractType,
        templateName:    templateName.trim(),
        htmlTemplate,
        pageSize,
        orientation,
        propertyPurpose: propertyPurpose || null,
        isActive:        true,
        isDefault:       false,
      }, { headers });

      onSaved?.();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al guardar la plantilla';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const categoryGroups = ['obligatoria', 'garantia', 'opcional', 'general'];
  const filtered = catFilter ? available.filter(c => c.category === catFilter) : available;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[94vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <IoDocumentTextOutline className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Asistente de Plantilla</h2>
              <p className="text-xs text-gray-500">Creá una plantilla en minutos seleccionando cláusulas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <IoCloseOutline className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-gray-100 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                step === s.id ? 'bg-indigo-100 text-indigo-700' :
                step > s.id  ? 'text-green-600' : 'text-gray-400'
              }`}>
                {step > s.id
                  ? <IoCheckmarkCircleOutline className="w-4 h-4" />
                  : <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === s.id ? 'border-indigo-600 text-indigo-600' : 'border-gray-300'}`}>{s.id}</span>
                }
                {s.label}
              </div>
              {i < STEPS.length - 1 && <IoChevronForwardOutline className="w-4 h-4 text-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: Tipo */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900">¿Qué tipo de contrato es?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONTRACT_TYPE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setContractType(opt.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${contractType === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
                    <div className="text-2xl mb-2">{opt.icon}</div>
                    <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Tipo de propiedad (opcional)</h4>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_PURPOSE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setPropertyPurpose(opt.value)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-all ${propertyPurpose === opt.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-gray-400 ml-1">— {opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Nombre + config */}
          {step === 2 && (
            <div className="space-y-5 max-w-lg">
              <h3 className="text-base font-semibold text-gray-900">Configuración básica</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la plantilla *</label>
                <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)}
                  placeholder="Ej: Contrato vivienda estándar 2024"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de hoja</label>
                  <select value={pageSize} onChange={e => setPageSize(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="A4">A4</option>
                    <option value="Letter">Carta (Letter)</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orientación</label>
                  <select value={orientation} onChange={e => setOrientation(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="portrait">Vertical (Portrait)</option>
                    <option value="landscape">Horizontal (Landscape)</option>
                  </select>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Recordá:</strong> Vas a poder editar el HTML completo desde el gestor de plantillas después de crearlo. El asistente ensambla las cláusulas seleccionadas como punto de partida.
              </div>
            </div>
          )}

          {/* STEP 3: Cláusulas */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-5 h-full">
              {/* Disponibles */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Biblioteca de cláusulas</h3>
                  <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                    <option value="">Todas</option>
                    {categoryGroups.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]?.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '420px' }}>
                  {loadingClauses ? <p className="text-sm text-gray-400 text-center py-8">Cargando…</p> : filtered.map(clause => {
                    const sel = isSelected(clause.id);
                    const cat = CATEGORY_LABELS[clause.category] || CATEGORY_LABELS.general;
                    return (
                      <div key={clause.id}
                        onClick={() => toggleClause(clause)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${sel ? 'border-indigo-500 bg-indigo-50' : `${cat.color} hover:border-indigo-300`}`}>
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${sel ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                            {sel && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="currentColor"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 leading-tight">{clause.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-gray-500">{cat.label}</span>
                              {clause.isSystem && <IoShieldCheckmarkOutline className="w-3 h-3 text-indigo-400" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seleccionadas + ordenamiento */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Orden en el contrato</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{selected.length} cláusulas</span>
                </div>
                {selected.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 p-6">
                    <div>
                      <IoAddOutline className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Hacé click en las cláusulas de la izquierda para agregarlas</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: '420px' }}>
                    {selected.map((clause, idx) => (
                      <div key={clause.id} className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-lg">
                        <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                        <span className="flex-1 text-sm text-gray-800 truncate">{clause.title}</span>
                        <div className="flex items-center gap-0.5">
                          <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors">
                            <IoArrowUpOutline className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => moveDown(idx)} disabled={idx === selected.length - 1}
                            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors">
                            <IoArrowDownOutline className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => toggleClause(clause)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                            <IoRemoveOutline className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Vista previa del contrato</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Las variables se reemplazarán con datos reales al generar el PDF</span>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white" style={{ maxHeight: '460px', overflowY: 'auto' }}>
                <div className="p-8 prose prose-sm max-w-none text-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: '1.7' }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                <IoCheckmarkCircleOutline className="w-5 h-5 flex-shrink-0" />
                <span>La plantilla quedará guardada en el gestor de plantillas. Podés editarla en cualquier momento con el editor HTML completo.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button type="button" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm">
            <IoChevronBackOutline className="w-4 h-4" />
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </button>

          {step < 4 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm">
              Siguiente
              <IoChevronForwardOutline className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm">
              <IoSaveOutline className="w-4 h-4" />
              {saving ? 'Guardando…' : 'Guardar plantilla'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

TemplateWizard.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
};
