import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  IoAddOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoCloudUploadOutline,
  IoCardOutline,
  IoQrCodeOutline,
  IoToggleOutline,
  IoToggle,
} from 'react-icons/io5';
import { uploadFile } from '../../utils/azureUpload';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TYPE_LABELS = {
  cbu: 'CBU',
  alias: 'Alias',
  qr: 'QR (imagen)',
  transferencia: 'Transferencia bancaria',
};

const TYPE_PLACEHOLDER = {
  cbu: 'Ej: 0000003100012345678901',
  alias: 'Ej: inmobiliaria.pagos',
  qr: 'Sube una imagen QR arriba',
  transferencia: 'Ej: Banco Nación – Cta. Cte. 123456/7',
};

const EMPTY_FORM = { type: 'cbu', label: '', value: '' };

const PaymentMethodsManager = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const qrInputRef = useRef(null);
  const newQrInputRef = useRef(null);

  const fetchMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/tenant/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMethods(data.data || []);
    } catch {
      toast.error('Error al cargar métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMethods(); }, []);

  // Subir QR para el formulario nuevo
  const handleNewQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    try {
      const url = await uploadFile(file, 'qr-codes');
      setForm((f) => ({ ...f, value: url }));
      toast.success('QR subido correctamente');
    } catch {
      toast.error('Error al subir el QR');
    } finally {
      setUploadingQr(false);
    }
  };

  // Subir QR para edición
  const handleEditQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    try {
      const url = await uploadFile(file, 'qr-codes');
      setEditForm((f) => ({ ...f, value: url }));
      toast.success('QR actualizado');
    } catch {
      toast.error('Error al subir el QR');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) return toast.error('El label es requerido');
    if (form.type !== 'qr' && !form.value.trim()) return toast.error('El valor es requerido');
    if (form.type === 'qr' && !form.value) return toast.error('Sube una imagen QR primero');

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_URL}/tenant/payment-methods`,
        { type: form.type, label: form.label, value: form.value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMethods((prev) => [...prev, data.data]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success('Método de pago agregado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (method) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `${API_URL}/tenant/payment-methods/${method.id}`,
        { isActive: !method.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMethods((prev) => prev.map((m) => (m.id === method.id ? data.data : m)));
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este método de pago?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/tenant/payment-methods/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success('Método eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const startEdit = (method) => {
    setEditingId(method.id);
    setEditForm({ label: method.label, value: method.value });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (method) => {
    if (!editForm.label?.trim()) return toast.error('El label es requerido');
    if (method.type !== 'qr' && !editForm.value?.trim()) return toast.error('El valor es requerido');

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `${API_URL}/tenant/payment-methods/${method.id}`,
        { label: editForm.label, value: editForm.value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMethods((prev) => prev.map((m) => (m.id === method.id ? data.data : m)));
      setEditingId(null);
      toast.success('Guardado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Métodos de pago</h2>
          <p className="text-sm text-gray-500 mt-1">
            Los inquilinos verán esta información en el portal de pagos para realizar transferencias.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <IoAddOutline className="w-4 h-4" />
          <span>Agregar</span>
        </button>
      </div>

      {/* Formulario nuevo */}
      {showForm && (
        <form onSubmit={handleCreate} className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-4">
          <h3 className="font-medium text-gray-800">Nuevo método de pago</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, value: '' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder='Ej: "Banco Galicia"'
                maxLength={100}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Value: texto o QR */}
          {form.type === 'qr' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen QR *</label>
              {form.value ? (
                <div className="flex items-center space-x-4">
                  <img src={form.value} alt="QR preview" className="w-24 h-24 object-contain border rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, value: '' }))}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Cambiar imagen
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={newQrInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleNewQrUpload}
                  />
                  <button
                    type="button"
                    onClick={() => newQrInputRef.current?.click()}
                    disabled={uploadingQr}
                    className="flex items-center space-x-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
                  >
                    <IoCloudUploadOutline className="w-5 h-5" />
                    <span>{uploadingQr ? 'Subiendo...' : 'Seleccionar imagen QR'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {TYPE_LABELS[form.type]} *
              </label>
              <input
                type="text"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder={TYPE_PLACEHOLDER[form.type]}
                maxLength={500}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploadingQr}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {methods.length === 0 && !showForm ? (
        <div className="text-center py-10 text-gray-400">
          <IoCardOutline className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay métodos de pago configurados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`border rounded-lg p-4 ${method.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'}`}
            >
              {editingId === method.id ? (
                // Modo edición
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">{TYPE_LABELS[method.type]}</span>
                  </div>
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Descripción"
                    maxLength={100}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                  {method.type === 'qr' ? (
                    <div className="space-y-2">
                      {editForm.value && (
                        <img src={editForm.value} alt="QR" className="w-20 h-20 object-contain border rounded" />
                      )}
                      <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditQrUpload} />
                      <button
                        type="button"
                        onClick={() => qrInputRef.current?.click()}
                        disabled={uploadingQr}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {uploadingQr ? 'Subiendo...' : 'Cambiar imagen QR'}
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editForm.value}
                      onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))}
                      placeholder={TYPE_PLACEHOLDER[method.type]}
                      maxLength={500}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  )}
                  <div className="flex space-x-2 justify-end">
                    <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 text-sm">
                      <IoCloseOutline className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => saveEdit(method)}
                      disabled={saving}
                      className="text-green-600 hover:text-green-800"
                    >
                      <IoCheckmarkOutline className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                // Modo visualización
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="mt-0.5 text-gray-400">
                      {method.type === 'qr' ? <IoQrCodeOutline className="w-5 h-5" /> : <IoCardOutline className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800 text-sm">{method.label}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          {TYPE_LABELS[method.type]}
                        </span>
                      </div>
                      {method.type === 'qr' ? (
                        <img
                          src={method.value}
                          alt="QR"
                          className="mt-2 w-24 h-24 object-contain border rounded-lg"
                        />
                      ) : (
                        <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{method.value}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    {/* Toggle activo/inactivo */}
                    <button
                      onClick={() => handleToggleActive(method)}
                      title={method.isActive ? 'Desactivar' : 'Activar'}
                      className={method.isActive ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-gray-600'}
                    >
                      {method.isActive ? <IoToggle className="w-6 h-6" /> : <IoToggleOutline className="w-6 h-6" />}
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => startEdit(method)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <IoCreateOutline className="w-5 h-5" />
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <IoTrashOutline className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsManager;
