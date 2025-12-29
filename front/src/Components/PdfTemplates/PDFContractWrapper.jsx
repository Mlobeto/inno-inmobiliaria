import  { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getLeaseById, getPropertiesById, getClientById } from '../../redux/Actions/actions';
import ContratoAlquiler from './ContratoAlquiler';

const PDFContractWrapper = () => {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractData, setContractData] = useState(null);

  // 🔧 Obtener datos del estado Redux
  const { lease, property, clients } = useSelector((state) => ({
    lease: state.lease,
    property: state.property,
    clients: state.clients
  }));

  useEffect(() => {
    const loadContractData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔧 Verificar si los datos vienen del estado de navegación
        const stateData = location.state;
        if (stateData && stateData.lease) {
          console.log('📄 Usando datos del estado de navegación');
          setContractData({
            lease: stateData.lease,
            property: stateData.property,
            tenant: stateData.tenant,
            owner: stateData.owner,
            guarantors: stateData.guarantors
          });
          setLoading(false);
          return;
        }

        // 🔧 Si hay leaseId en la URL, cargar datos desde el backend
        if (leaseId) {
          console.log('📄 Cargando contrato desde backend con ID:', leaseId);
          
          const leaseResponse = await dispatch(getLeaseById(leaseId));
          if (leaseResponse && leaseResponse.id) {
            // Cargar datos relacionados
            await dispatch(getPropertiesById(leaseResponse.propertyId));
            
            // Buscar tenant y landlord
            const tenant = clients.find(client => client.idClient === leaseResponse.tenantId);
            const landlord = clients.find(client => client.idClient === leaseResponse.landlordId);

            setContractData({
              lease: leaseResponse,
              property: property,
              tenant: tenant,
              owner: landlord,
              guarantors: leaseResponse.Garantors || []
            });
          } else {
            throw new Error('Contrato no encontrado');
          }
        } else {
          // 🔧 No hay ID ni datos de estado
          setError('No se especificó un contrato para generar el PDF');
        }

      } catch (err) {
        console.error('Error cargando datos del contrato:', err);
        setError(err.message || 'Error al cargar los datos del contrato');
      } finally {
        setLoading(false);
      }
    };

    loadContractData();
  }, [leaseId, location.state, dispatch, property, clients]);

  // 🔧 Componente de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-700">Cargando datos del contrato...</h2>
          <p className="text-gray-500">Por favor espera mientras preparamos el PDF</p>
        </div>
      </div>
    );
  }

  // 🔧 Componente de error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar el contrato</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/leaseList')}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              📋 Ver Lista de Contratos
            </button>
            <button
              onClick={() => navigate('/panel')}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              🏠 Ir al Panel Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🔧 Verificar que tenemos todos los datos necesarios
  if (!contractData || !contractData.lease) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-yellow-500 text-6xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Datos incompletos</h2>
          <p className="text-gray-600 mb-6">No se encontraron los datos necesarios para generar el PDF del contrato.</p>
          <button
            onClick={() => navigate('/leaseList')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            📋 Ver Lista de Contratos
          </button>
        </div>
      </div>
    );
  }

  // 🔧 Renderizar el componente PDF con todos los datos
  return (
    <div className="min-h-screen bg-gray-100">
      <ContratoAlquiler
        lease={contractData.lease}
        property={contractData.property}
        tenant={contractData.tenant}
        owner={contractData.owner}
        guarantors={contractData.guarantors}
        onDownload={() => {
          console.log('PDF descargado exitosamente');
          // Opcional: redirigir después de la descarga
          // navigate('/leaseList');
        }}
      />
    </div>
  );
};

export default PDFContractWrapper;