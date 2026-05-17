import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';
import Swal from 'sweetalert2';
import {
  IoAddOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoCopyOutline,
  IoCloseOutline,
  IoSaveOutline,
  IoDocumentTextOutline,
  IoFilterOutline,
  IoSearchOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
} from 'react-icons/io5';

const API = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
  { value: 'obligatoria', label: 'Obligatoria',   color: 'bg-red-100 text-red-700' },
  { value: 'garantia',    label: 'Garantía',       color: 'bg-violet-100 text-violet-700' },
  { value: 'opcional',    label: 'Opcional',       color: 'bg-blue-100 text-blue-700' },
  { value: 'general',     label: 'General',        color: 'bg-gray-100 text-gray-700' },
];

const CONTRACT_TYPES = [
  { value: 'CONTRATO_ALQUILER',            label: 'Alquiler residencial' },
  { value: 'CONTRATO_ALQUILER_TEMPORARIO', label: 'Alquiler temporario' },
];

const CategoryBadge = ({ cat }) => {
  const found = CATEGORIES.find(c => c.value === cat) || CATEGORIES[3];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${found.color}`}>{found.label}</span>;
};

export default function ClauseLibraryManager() {
  const token = useSelector(s => s.token);
  const headers = { Authorization: `Bearer ${token}` };

  const [clauses, setClauses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [catFilter, setCatFilter]     = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [search, setSearch]           = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState(null); // null = new
  const [saving, setSaving]           = useState(false);

  const [form, setForm] = useState({
    title: '', content: '', category: 'general',
    contractTypes: ['CONTRATO_ALQUILER'], sortOrder: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (catFilter)  params.set('category',     catFilter);
      if (typeFilter) params.set('contractType',  typeFilter);
      const res = await axios.get(`${API}/api/clause-library?${params}`, { headers });
      setClauses(res.data.clauses);
    } catch {
      Swal.fire('Error', 'No se pudo cargar la biblioteca', 'error');
    } finally {
      setLoading(false);
    }
  }, [catFilter, typeFilter, token]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', content: '', category: 'general', contractTypes: ['CONTRATO_ALQUILER'], sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (clause) => {
    setEditing(clause);
    setForm({ title: clause.title, content: clause.content, category: clause.category, contractTypes: clause.contractTypes, sortOrder: clause.sortOrder });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      Swal.fire('Atención', 'El título y el contenido son obligatorios', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`${API}/api/clause-library/${editing.id}`, form, { headers });
      } else {
        await axios.post(`${API}/api/clause-library`, form, { headers });
      }
      setShowModal(false);
      load();
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (clause) => {
    try {
      await axios.post(`${API}/api/clause-library/${clause.id}/duplicate`, {}, { headers });
      load();
    } catch {
      Swal.fire('Error', 'No se pudo duplicar la cláusula', 'error');
    }
  };

  const handleDelete = async (clause) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar cláusula?',
      text: `"${clause.title}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      await axios.delete(`${API}/api/clause-library/${clause.id}`, { headers });
      load();
    } catch {
      Swal.fire('Error', 'No se pudo eliminar', 'error');
    }
  };

  const toggleContractType = (val) => {
    setForm(prev => ({
      ...prev,
      contractTypes: prev.contractTypes.includes(val)
        ? prev.contractTypes.filter(t => t !== val)
        : [...prev.contractTypes, val],
    }));
  };

  const visible = clauses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  const systemClauses = visible.filter(c => c.isSystem);
  const customClauses = visible.filter(c => !c.isSystem);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <IoDocumentTextOutline className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Biblioteca de Cláusulas</h1>
              <p className="text-sm text-gray-500">Cláusulas reutilizables para plantillas de contratos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <IoRefreshOutline className="w-5 h-5" />
            </button>
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <IoAddOutline className="w-4 h-4" /> Nueva cláusula
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar por título…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Todas las categorías</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Todos los tipos</option>
            {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <IoRefreshOutline className="w-7 h-7 animate-spin mr-2" /> Cargando…
          </div>
        ) : (
          <>
            {/* Cláusulas del sistema */}
            {systemClauses.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <IoShieldCheckmarkOutline className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cláusulas del sistema</h2>
                  <span className="text-xs text-gray-400">(solo lectura — podés duplicar para personalizar)</span>
                </div>
                <div className="grid gap-3">
                  {systemClauses.map(c => (
                    <ClauseCard key={c.id} clause={c} onDuplicate={() => handleDuplicate(c)} readOnly />
                  ))}
                </div>
              </section>
            )}

            {/* Mis cláusulas */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <IoDocumentTextOutline className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Mis cláusulas personalizadas</h2>
              </div>
              {customClauses.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
                  <IoDocumentTextOutline className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-base font-medium">Sin cláusulas personalizadas</p>
                  <p className="text-sm">Creá una nueva o duplicá una del sistema para empezar.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {customClauses.map(c => (
                    <ClauseCard key={c.id} clause={c} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c)} onDuplicate={() => handleDuplicate(c)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Modal edición */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar cláusula' : 'Nueva cláusula'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Ej: Objeto del Contrato"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                {/* Categoría + Tipos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aplicable a</label>
                    <div className="flex gap-3 pt-1">
                      {CONTRACT_TYPES.map(t => (
                        <label key={t.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.contractTypes.includes(t.value)} onChange={() => toggleContractType(t.value)}
                            className="accent-indigo-600" />
                          {t.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido *
                    <span className="text-xs text-gray-400 ml-2">Usá {'{{'} variable {'}}' } para insertar datos del contrato</span>
                  </label>
                  <Editor
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    value={form.content}
                    onEditorChange={(val) => setForm(p => ({ ...p, content: val }))}
                    init={{
                      height: 280,
                      menubar: false,
                      statusbar: false,
                      plugins: 'lists link code',
                      toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | removeformat | code',
                      content_style: 'body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; }',
                    }}
                  />
                </div>

                {/* Variables rápidas */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">Variables frecuentes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '{{propietario.nombre}}','{{inquilino.nombre}}','{{propiedad.direccion}}',
                      '{{propiedad.ciudad}}','{{contrato.plazoMeses}}','{{contrato.fechaInicio}}',
                      '{{contrato.fechaFin}}','{{contrato.montoMensual}}','{{empresa.nombre}}',
                      '{{garante1.nombre}}','{{ciudad}}',
                    ].map(v => (
                      <button key={v} type="button"
                        onClick={() => setForm(p => ({ ...p, content: p.content + ' ' + v + ' ' }))}
                        className="px-2 py-1 bg-white border border-indigo-200 text-indigo-600 text-xs rounded-lg hover:bg-indigo-100 transition-colors font-mono">
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-gray-200 flex-shrink-0">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm">
                  <IoSaveOutline className="w-4 h-4" />
                  {saving ? 'Guardando…' : 'Guardar cláusula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ClauseCard({ clause, onEdit, onDelete, onDuplicate, readOnly }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-start justify-between p-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button onClick={() => setExpanded(e => !e)} className="mt-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm">{clause.title}</span>
              <CategoryBadge cat={clause.category} />
              {clause.isSystem && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">
                  <IoShieldCheckmarkOutline className="w-3 h-3" /> Sistema
                </span>
              )}
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {clause.contractTypes?.map(t => (
                <span key={t} className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{t === 'CONTRATO_ALQUILER' ? 'Alquiler' : 'Temporario'}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-3 flex-shrink-0">
          <button onClick={onDuplicate} title="Duplicar" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <IoCopyOutline className="w-4 h-4" />
          </button>
          {!readOnly && onEdit && (
            <button onClick={onEdit} title="Editar" className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <IoCreateOutline className="w-4 h-4" />
            </button>
          )}
          {!readOnly && onDelete && (
            <button onClick={onDelete} title="Eliminar" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <IoTrashOutline className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="prose prose-sm max-w-none text-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: clause.content }} />
        </div>
      )}
    </div>
  );
}
