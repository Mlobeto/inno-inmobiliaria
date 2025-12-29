import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPropertyToClientWithRole, getAllClients } from '../../redux/Actions/actions';
import Listado from '../Propiedades/Listado';
import Swal from 'sweetalert2';
import {
  IoDocumentTextOutline,
  IoBusinessOutline,
  IoPersonOutline,
  IoCashOutline,
  IoSaveOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5';

const CreateSaleContractForm = () => {
  const dispatch = useDispatch();
  const property = useSelector(state => state.property);
  const clients = useSelector(state => state.clients);

  // Estados locales para filtrar y seleccionar comprador
  const [showClientList, setShowClientList] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);

  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    propertyId: '',
    vendedor: '',
    comprador: '',
    compradorId: '',
    salePrice: '',
    commission: '',
  });

  useEffect(() => {
    dispatch(getAllClients());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));

    // Filtrar compradores al escribir
    if (name === 'comprador') {
      if (value.length > 0) {
        const filtered = clients.filter(client =>
          client.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredClients(filtered);
        setShowClientList(true);
      } else {
        setFilteredClients([]);
        setShowClientList(false);
      }
    }
  };

  // Selección del comprador de la lista filtrada
  const handleClientSelect = (client) => {
    setFormData(prevData => ({
      ...prevData,
      comprador: client.name,
      compradorId: client.idClient,
    }));
    setShowClientList(false);
    setFilteredClients([]);
  };

  // Selección de la propiedad desde el componente Listado
  const handlePropertySelect = (propertySelected) => {
    if (!propertySelected || !propertySelected.propertyId) {
      console.error('Propiedad inválida seleccionada:', propertySelected);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo seleccionar la propiedad. Intente de nuevo.",
      });
      return;
    }

    // Buscar el vendedor de la propiedad
    const seller = propertySelected.Clients?.find(client => 
      client.ClientProperty.role === 'propietario' || client.ClientProperty.role === 'vendedor'
    );

    setFormData(prevData => ({
      ...prevData,
      propertyId: propertySelected.propertyId,
      vendedor: seller?.name || '',
      salePrice: propertySelected.price || '',
      commission: propertySelected.comision || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.compradorId) {
        Swal.fire({
          title: "Error",
          text: "Debe seleccionar un comprador válido",
          icon: "error",
        });
        setIsLoading(false);
        return;
      }

      // Asignar rol de comprador al cliente seleccionado
      await dispatch(addPropertyToClientWithRole({
        propertyId: formData.propertyId,
        clientId: formData.compradorId,
        role: 'comprador'
      }));

      setSaleCompleted(true);

      Swal.fire({
        title: "¡Éxito!",
        text: `Se ha asignado correctamente el rol de comprador a ${formData.comprador}`,
        icon: "success",
        confirmButtonText: "Aceptar"
      });

    } catch (error) {
      console.error('Error en handleSubmit:', error);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "Error al asignar rol",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Mostrar Listado si no hay propiedad seleccionada */}
      {!formData.propertyId ? (
        <Listado mode="sale" onSelectProperty={handlePropertySelect} />
      ) : (
        /* Modal overlay con formulario */
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IoDocumentTextOutline className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">
                  Asignar Rol de Comprador
                </h2>
              </div>
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, propertyId: "" }));
                  setSaleCompleted(false);
                }}
                className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              {!saleCompleted ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Información de la propiedad seleccionada */}
                  <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center">
                      <IoBusinessOutline className="w-5 h-5 mr-2" />
                      Propiedad Seleccionada
                    </h3>
                    <p className="text-white">ID: {formData.propertyId}</p>
                    <p className="text-slate-300">Vendedor: {formData.vendedor}</p>
                    <p className="text-slate-300">Precio: ${formData.salePrice}</p>
                  </div>

                  {/* Información de la venta */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">
                      Información de la Venta
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                      {/* Comprador */}
                      <div className="space-y-2 relative">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoPersonOutline className="w-4 h-4 mr-2 text-green-400" />
                          Comprador
                        </label>
                        <input
                          type="text"
                          name="comprador"
                          value={formData.comprador}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          placeholder="Buscar comprador..."
                          required
                        />
                        {showClientList && filteredClients.length > 0 && (
                          <div className="absolute z-10 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                            {filteredClients.map(client => (
                              <div
                                key={client.idClient}
                                className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                                onClick={() => handleClientSelect(client)}
                              >
                                <p className="text-white font-medium">{client.name}</p>
                                <p className="text-slate-400 text-sm">{client.email}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Precio de venta */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCashOutline className="w-4 h-4 mr-2 text-emerald-400" />
                          Precio de Venta
                        </label>
                        <input
                          type="number"
                          name="salePrice"
                          value={formData.salePrice}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          placeholder="Precio de venta..."
                          required
                        />
                      </div>

                      {/* Comisión */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCashOutline className="w-4 h-4 mr-2 text-orange-400" />
                          Comisión
                        </label>
                        <input
                          type="number"
                          name="commission"
                          value={formData.commission}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          placeholder="Comisión..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botón de envío */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                    >
                      <IoSaveOutline className="w-5 h-5 mr-2" />
                      {isLoading ? "Asignando..." : "Asignar Rol de Comprador"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Vista del rol asignado exitosamente */
                <div className="text-center space-y-6">
                  <div className="mb-6">
                    <IoCheckmarkCircleOutline className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">¡Rol Asignado Exitosamente!</h3>
                    <p className="text-slate-400">El comprador ha sido asignado correctamente a la propiedad</p>
                  </div>
                  
                  {/* Resumen de la operación */}
                  <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-6 text-left">
                    <h4 className="text-lg font-semibold text-green-300 mb-4">Resumen de la Operación</h4>
                    <div className="space-y-2 text-white">
                      <p><span className="text-slate-400">Propiedad:</span> {formData.propertyId}</p>
                      <p><span className="text-slate-400">Vendedor:</span> {formData.vendedor}</p>
                      <p><span className="text-slate-400">Comprador:</span> {formData.comprador}</p>
                      <p><span className="text-slate-400">Precio de Venta:</span> ${formData.salePrice}</p>
                      {formData.commission && (
                        <p><span className="text-slate-400">Comisión:</span> ${formData.commission}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 justify-center pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          propertyId: '',
                          vendedor: '',
                          comprador: '',
                          compradorId: '',
                          salePrice: '',
                          commission: '',
                        });
                        setSaleCompleted(false);
                        setFilteredClients([]);
                        setShowClientList(false);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300"
                    >
                      Asignar Otro Comprador
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, propertyId: "" }));
                        setSaleCompleted(false);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-medium transition-all duration-300"
                    >
                      Volver al Listado
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSaleContractForm;