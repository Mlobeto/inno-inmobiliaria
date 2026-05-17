import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { updateLease } from '../../redux/Actions/actions';
import { generarHTMLContrato } from '../../utils/generarHTMLContrato';

const ContratoEditor = ({ lease, onClose }) => {
  const editorRef = useRef(null);
  const dispatch = useDispatch();
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);
  const [companySettings, setCompanySettings] = useState(null);
  const [templateInfo, setTemplateInfo] = useState(null); // { id, name, type, isFallback }
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);

  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
  const token = localStorage.getItem("token");

  /** Carga o recarga el contenido del editor a partir de una plantilla específica o la por defecto */
  const loadContent = async (templateId = null) => {
    setLoadingContent(true);
    try {
      // Primero cargar settings (necesario como fallback)
      const settingsRes = await fetch(`${apiUrl}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const settings = settingsRes.ok ? await settingsRes.json() : {};
      setCompanySettings(settings);

      // Si el contrato ya tiene contenido personalizado guardado y no se está cambiando plantilla, usarlo
      if (lease.customContent && !templateId) {
        setContenido(lease.customContent);
        setTemplateInfo({ id: null, name: 'Contenido personalizado guardado', type: null, isFallback: false, isCustom: true });
        setLoadingContent(false);
        return;
      }

      // Construir URL: si hay templateId específico, pasarlo como query param
      const url = templateId
        ? `${apiUrl}/pdf-templates/render/lease/${lease.id}?templateId=${templateId}`
        : `${apiUrl}/pdf-templates/render/lease/${lease.id}`;

      const renderRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (renderRes.ok) {
        const data = await renderRes.json();
        setContenido(data.html);
        if (data.templateUsed) {
          setTemplateInfo(data.templateUsed);
        }
      } else {
        // Fallback: generador hardcodeado
        setContenido(generarHTMLContrato(lease, settings));
        setTemplateInfo({ id: null, name: 'Plantilla del sistema (sin configurar)', type: null, isFallback: true, isCustom: false });
      }
    } catch (error) {
      console.error("Error al cargar contenido del contrato:", error);
      setContenido(generarHTMLContrato(lease, companySettings || {}));
      setTemplateInfo({ id: null, name: 'Plantilla del sistema (sin configurar)', type: null, isFallback: true, isCustom: false });
    } finally {
      setLoadingContent(false);
    }
  };

  /** Carga las plantillas disponibles para el tipo de contrato de este lease */
  const loadAvailableTemplates = async () => {
    // Determinar el tipo basado en totalMonths (misma lógica que backend)
    const months = parseInt(lease.totalMonths, 10);
    const templateType = (!isNaN(months) && months <= 3)
      ? 'CONTRATO_ALQUILER_TEMPORARIO'
      : 'CONTRATO_ALQUILER';

    try {
      const res = await fetch(`${apiUrl}/pdf-templates/check?templateType=${templateType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.templates?.length > 1) {
          setAvailableTemplates(data.templates);
        }
      }
    } catch {
      // si falla el check no bloqueamos
    }
  };

  useEffect(() => {
    loadContent();
    loadAvailableTemplates();
  }, [lease]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    loadContent(templateId || null);
  };

  const handleSave = async () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      
      try {
        setLoading(true);
        
        await dispatch(updateLease(lease.id, { customContent: content }));
        
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Contrato personalizado guardado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
        
        onClose();
      } catch (error) {
        console.error('Error al guardar:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el contrato personalizado'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetToDefault = () => {
    Swal.fire({
      title: '¿Restaurar contrato original?',
      text: 'Se perderán todos los cambios personalizados del editor',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await loadContent(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-800">
              Editor de Contrato #{lease.id}
            </h2>

            {/* Badge de plantilla activa */}
            {templateInfo && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                templateInfo.isCustom
                  ? 'bg-purple-100 text-purple-700'
                  : templateInfo.isFallback
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full inline-block bg-current" />
                {templateInfo.name}
                {templateInfo.isFallback && ' · diseño por defecto'}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selector de plantilla (solo si hay varias) */}
        {availableTemplates.length > 1 && (
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Cambiar plantilla:
            </label>
            <select
              className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue=""
              onChange={handleTemplateChange}
            >
              <option value="">— predeterminada —</option>
              {availableTemplates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.templateName}{t.isDefault ? ' ✓' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              El cambio solo afecta esta sesión de edición
            </p>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-auto p-6">
          {loadingContent ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3" />
              <span className="text-gray-500">Cargando plantilla...</span>
            </div>
          ) : (
            <Editor
              tinymceScriptSrc="/tinymce/tinymce.min.js"
              onInit={(evt, editor) => editorRef.current = editor}
              value={contenido}
              onEditorChange={(newContent) => setContenido(newContent)}
              init={{
                height: 500,
                menubar: false,
                statusbar: false,
                plugins: 'lists link code help wordcount',
                toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | removeformat | code | help',
                content_style: `
                  body { 
                    font-family: Helvetica, Arial, sans-serif; 
                    font-size: 11pt; 
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                  }
                  h1 { font-size: 16pt; text-align: center; font-weight: bold; }
                  h2 { font-size: 14pt; font-weight: bold; }
                  p { margin: 10px 0; text-align: justify; }
                `
              }}
            />
          )}
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleResetToDefault}
            disabled={loadingContent}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            Restaurar Original
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading || loadingContent}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ContratoEditor.propTypes = {
  lease: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ContratoEditor;
