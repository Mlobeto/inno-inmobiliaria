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

  useEffect(() => {
    // Si ya tiene contenido personalizado, usarlo; si no, generar uno nuevo
    const htmlInicial = lease.customContent || generarHTMLContrato(lease);
    setContenido(htmlInicial);
  }, [lease]);

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
      text: 'Se perderán todos los cambios personalizados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const htmlOriginal = generarHTMLContrato(lease);
        setContenido(htmlOriginal);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Editor de Contrato #{lease.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-6">
          <Editor
            tinymceScriptSrc="https://cdn.tiny.cloud/1/se2bvqg48curpyywfqprsxuygl0ycppdzaefay32hp988nbi/tinymce/7/tinymce.min.js"
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
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleResetToDefault}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
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
              disabled={loading}
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
