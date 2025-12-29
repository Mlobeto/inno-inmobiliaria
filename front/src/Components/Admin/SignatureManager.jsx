/* eslint-disable react/no-unescaped-entities */
import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { IoCreateOutline, IoTrashOutline, IoSaveOutline, IoImageOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

const SignatureManager = () => {
  const sigCanvas = useRef(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar firma existente al montar
  useEffect(() => {
    fetchCurrentSignature();
  }, []);

  const fetchCurrentSignature = async () => {
    try {
      const response = await fetch('https://qlinmobiliaria.onrender.com/api/admin/signature');
      const data = await response.json();
      if (data.signatureUrl) {
        setSignatureUrl(data.signatureUrl);
      }
    } catch (error) {
      console.error('Error al cargar firma:', error);
    }
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const saveSignature = async () => {
    if (sigCanvas.current.isEmpty()) {
      setMessage({ type: 'error', text: 'Por favor dibuja tu firma primero' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Convertir canvas a blob
      const canvas = sigCanvas.current.getTrimmedCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

      // Crear FormData para Cloudinary
      const formData = new FormData();
      formData.append('file', blob, 'firma.png');
      formData.append('upload_preset', 'propiedades'); // Usar preset existente

      // Subir a Cloudinary
      const cloudinaryResponse = await fetch(
        'https://api.cloudinary.com/v1_1/dachr5i8f/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

            // Guardar la URL en el backend
      const response = await fetch('https://qlinmobiliaria.onrender.com/admin/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatureUrl: cloudinaryData.secure_url,
        }),
      });

      if (response.ok) {
        setSignatureUrl(cloudinaryData.secure_url);
        setMessage({ type: 'success', text: 'Firma guardada exitosamente' });
        sigCanvas.current.clear();
      } else {
        throw new Error('Error al guardar firma');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al guardar la firma' });
    } finally {
      setLoading(false);
    }
  };

  const deleteSignature = async () => {
    if (!window.confirm('¿Estás segura de que quieres eliminar la firma?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://qlinmobiliaria.onrender.com/admin/signature', {
        method: 'DELETE',
      });

      if (response.ok) {
        setSignatureUrl(null);
        setMessage({ type: 'success', text: 'Firma eliminada exitosamente' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al eliminar la firma' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
          <IoCreateOutline className="w-8 h-8 mr-3 text-blue-400" />
          Gestión de Firma Digital
        </h1>

        {/* Mensajes */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' 
              : 'bg-red-500/20 text-red-400 border border-red-400/30'
          }`}>
            <div className="flex items-center">
              <IoCheckmarkCircleOutline className="w-5 h-5 mr-2" />
              {message.text}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de dibujo */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Crear Nueva Firma</h2>
            
            <div className="bg-white rounded-xl p-4 mb-4">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  className: 'w-full h-48 border-2 border-dashed border-slate-300 rounded-lg',
                }}
                backgroundColor="white"
              />
            </div>

            <p className="text-slate-400 text-sm mb-4">
              Dibuja tu firma usando el mouse o pantalla táctil
            </p>

            <div className="flex space-x-3">
              <button
                onClick={clearSignature}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-400/30"
              >
                <IoTrashOutline className="w-5 h-5 mr-2" />
                Limpiar
              </button>
              
              <button
                onClick={saveSignature}
                disabled={loading}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors border border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoSaveOutline className="w-5 h-5 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Firma'}
              </button>
            </div>
          </div>

          {/* Firma actual */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Firma Actual</h2>
            
            {signatureUrl ? (
              <div>
                <div className="bg-white rounded-xl p-4 mb-4">
                  <img 
                    src={signatureUrl} 
                    alt="Firma actual" 
                    className="w-full h-48 object-contain"
                  />
                </div>
                
                <p className="text-slate-400 text-sm mb-4">
                  Esta firma se incluirá automáticamente en todos los recibos generados
                </p>

                <button
                  onClick={deleteSignature}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-400/30 disabled:opacity-50"
                >
                  <IoTrashOutline className="w-5 h-5 mr-2" />
                  {loading ? 'Eliminando...' : 'Eliminar Firma'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <IoImageOutline className="w-16 h-16 text-slate-500 mb-4" />
                <p className="text-slate-400 text-lg">No hay firma guardada</p>
                <p className="text-slate-500 text-sm mt-2">
                  Dibuja y guarda tu firma para que aparezca en los recibos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-8 bg-blue-500/10 backdrop-blur-xl rounded-2xl border border-blue-400/20 p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Instrucciones</h3>
          <ul className="text-slate-300 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">1.</span>
              Dibuja tu firma en el panel blanco usando el mouse o tu dedo (en pantalla táctil)
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">2.</span>
              Si no te gusta el resultado, usa el botón "Limpiar" para empezar de nuevo
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">3.</span>
              Cuando estés satisfecha con tu firma, presiona "Guardar Firma"
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">4.</span>
              La firma se guardará automáticamente y aparecerá en todos los recibos PDF
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignatureManager;
