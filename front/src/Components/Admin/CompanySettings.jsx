import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  IoBusinessOutline, 
  IoLocationOutline, 
  IoCallOutline, 
  IoMailOutline,
  IoDocumentTextOutline,
  IoSaveOutline,
  IoImageOutline
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CompanySettings = () => {
  const [settings, setSettings] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_registration: '',
    company_cuit: '',
    company_logo_url: '',
    contract_footer_text: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar configuración actual
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSettings(response.data);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!settings.company_name) {
      toast.error('El nombre de la inmobiliaria es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${API_URL}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('✅ Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <IoBusinessOutline className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Configuración de la Inmobiliaria</h1>
              <p className="text-gray-600 mt-1">Completa los datos de tu empresa</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          
          {/* Datos básicos */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <IoBusinessOutline className="mr-2" />
                Nombre de la Inmobiliaria *
              </label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Ej: Inmobiliaria Del Centro"
              />
            </div>

            {/* CUIT */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <IoDocumentTextOutline className="mr-2" />
                CUIT
              </label>
              <input
                type="text"
                name="company_cuit"
                value={settings.company_cuit}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="XX-XXXXXXXX-X"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <IoLocationOutline className="mr-2" />
              Dirección
            </label>
            <input
              type="text"
              name="company_address"
              value={settings.company_address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Calle 123, Ciudad, Provincia"
            />
          </div>

          {/* Contacto */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Teléfono */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <IoCallOutline className="mr-2" />
                Teléfono
              </label>
              <input
                type="tel"
                name="company_phone"
                value={settings.company_phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="+54 9 XXX XXX-XXXX"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <IoMailOutline className="mr-2" />
                Email
              </label>
              <input
                type="email"
                name="company_email"
                value={settings.company_email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="contacto@inmobiliaria.com"
              />
            </div>
          </div>

          {/* Matrícula */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <IoDocumentTextOutline className="mr-2" />
              Matrícula o Número de Registro
            </label>
            <input
              type="text"
              name="company_registration"
              value={settings.company_registration}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Matrícula profesional"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <IoImageOutline className="mr-2" />
              URL del Logo (Cloudinary)
            </label>
            <input
              type="url"
              name="company_logo_url"
              value={settings.company_logo_url}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="https://res.cloudinary.com/..."
            />
            {settings.company_logo_url && (
              <div className="mt-3">
                <img 
                  src={settings.company_logo_url} 
                  alt="Logo preview" 
                  className="h-20 object-contain border rounded p-2"
                />
              </div>
            )}
          </div>

          {/* Texto adicional para contratos */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <IoDocumentTextOutline className="mr-2" />
              Texto adicional para pie de contratos (Opcional)
            </label>
            <textarea
              name="contract_footer_text"
              value={settings.contract_footer_text}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Texto personalizado que aparecerá en los contratos"
            />
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={isSaving}
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg text-white font-semibold
                transition-all duration-200 transform
                ${isSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 shadow-lg'
                }
              `}
            >
              <IoSaveOutline className="w-5 h-5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </form>

        {/* Ayuda */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Esta información se usará en contratos, recibos y documentos generados por el sistema.
            Los campos marcados con * son obligatorios.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
