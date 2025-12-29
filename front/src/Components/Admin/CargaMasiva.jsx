import React, { useState } from 'react';
import { 
  IoCloudUploadOutline, 
  IoDownloadOutline, 
  IoCheckmarkCircleOutline, 
  IoAlertCircleOutline,
  IoDocumentTextOutline,
  IoPersonOutline,
  IoHomeOutline 
} from 'react-icons/io5';

const CargaMasiva = () => {
  const [uploadType, setUploadType] = useState('clients');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/import/${uploadType}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error('Error:', error);
      setResults({
        success: false,
        message: 'Error al procesar el archivo',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templates = {
      clients: '/plantilla_clientes.csv',
      properties: '/plantilla_propiedades.csv'
    };
    
    const link = document.createElement('a');
    link.href = templates[uploadType];
    link.download = `plantilla_${uploadType}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <IoCloudUploadOutline className="text-indigo-600" />
            Carga Masiva
          </h1>
          <p className="text-gray-600">Importa clientes y propiedades desde archivos Excel</p>
        </div>

        {/* Tipo de carga */}
        <div className="backdrop-blur-md bg-white/30 rounded-2xl border border-white/20 shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <IoDocumentTextOutline className="text-indigo-600" />
            Tipo de Importación
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setUploadType('clients')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                uploadType === 'clients'
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                  : 'border-gray-200 bg-white/50 text-gray-600 hover:border-indigo-300'
              }`}
            >
              <IoPersonOutline className="text-3xl" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">Clientes</h3>
                <p className="text-sm opacity-75">Importar información de clientes</p>
              </div>
            </button>

            <button
              onClick={() => setUploadType('properties')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                uploadType === 'properties'
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                  : 'border-gray-200 bg-white/50 text-gray-600 hover:border-indigo-300'
              }`}
            >
              <IoHomeOutline className="text-3xl" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">Propiedades</h3>
                <p className="text-sm opacity-75">Importar información de propiedades</p>
              </div>
            </button>
          </div>
        </div>

        {/* Descargar plantilla */}
        <div className="backdrop-blur-md bg-white/30 rounded-2xl border border-white/20 shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            1. Descargar Plantilla
          </h2>
          <p className="text-gray-600 mb-4">
            Descarga la plantilla de {uploadType === 'clients' ? 'clientes' : 'propiedades'} para conocer el formato requerido.
          </p>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            <IoDownloadOutline />
            Descargar Plantilla {uploadType === 'clients' ? 'Clientes' : 'Propiedades'}
          </button>
        </div>

        {/* Subir archivo */}
        <div className="backdrop-blur-md bg-white/30 rounded-2xl border border-white/20 shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            2. Subir Archivo
          </h2>
          
          <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center">
            <IoCloudUploadOutline className="text-6xl text-indigo-400 mx-auto mb-4" />
            
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            
            <label 
              htmlFor="fileInput"
              className="cursor-pointer inline-block px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors duration-200"
            >
              Seleccionar Archivo
            </label>
            
            {file && (
              <div className="mt-4 text-gray-600">
                <strong>Archivo seleccionado:</strong> {file.name}
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-2">
              Formatos permitidos: .xlsx, .csv (máximo 10MB)
            </p>
          </div>

          {file && (
            <div className="mt-6 text-center">
              <button
                onClick={handleUpload}
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  loading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
              >
                {loading ? 'Procesando...' : 'Importar Datos'}
              </button>
            </div>
          )}
        </div>

        {/* Resultados */}
        {results && (
          <div className="backdrop-blur-md bg-white/30 rounded-2xl border border-white/20 shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {results.success ? (
                <IoCheckmarkCircleOutline className="text-green-600" />
              ) : (
                <IoAlertCircleOutline className="text-red-600" />
              )}
              Resultados de la Importación
            </h2>

            <div className={`p-4 rounded-lg border ${
              results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <p className="font-semibold mb-2">{results.message}</p>
              
              {results.results && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.results.summary.total}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.results.summary.processed}
                    </div>
                    <div className="text-sm text-gray-600">Procesados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {results.results.summary.failed}
                    </div>
                    <div className="text-sm text-gray-600">Errores</div>
                  </div>
                </div>
              )}

              {results.results?.errors && results.results.errors.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-red-700">
                    Ver errores ({results.results.errors.length})
                  </summary>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {results.results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 mb-1">
                        <strong>Fila {error.row}:</strong> {error.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CargaMasiva;