import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getAllClients, updateClient, deleteClient } from "../../redux/Actions/actions";
import { useNavigate } from 'react-router-dom';
import { 
  IoArrowBackOutline, 
  IoSearchOutline, 
  IoPencilOutline, 
  IoTrashOutline, 
  IoSaveOutline,
  IoPeopleOutline,
  IoHomeOutline
} from 'react-icons/io5';
const ListadoDeClientes = () => {
  
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Selectores optimizados con igualdad por referencia
  const clients = useSelector((state) => state.clients, (prev, next) => prev === next);
  const loading = useSelector((state) => state.loading);
  const error = useSelector((state) => state.error);

  // Estados locales
  const [editingClientId, setEditingClientId] = useState(null);
  const [editedClient, setEditedClient] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  // Filtrar clientes según el término de búsqueda (optimizado)
  const filteredClients = useMemo(() => 
    clients.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [clients, searchTerm]
  );

  // Calcular paginación (optimizado)
  const paginationData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    return { currentClients, totalPages };
  }, [filteredClients, currentPage, itemsPerPage]);

  const { currentClients, totalPages } = paginationData;

  // Obtener clientes al montar el componente
  useEffect(() => {
    dispatch(getAllClients());
  }, [dispatch]);

  // Manejar edición de cliente
  const handleEditClick = (client) => {
    setEditingClientId(client.idClient);
    setEditedClient(client);
  };

  // Guardar cambios de cliente
  const handleSaveClick = (idClient) => {
    dispatch(updateClient(idClient, editedClient));
    setEditingClientId(null);
    alert("Cliente actualizado correctamente");
  };

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClient((prev) => ({ ...prev, [name]: value }));
  };

  // Eliminar cliente
  const handleDelete = (idClient) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      dispatch(deleteClient(idClient));
      alert("Cliente eliminado correctamente");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header moderno */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-blue-300 transition-colors duration-300 flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-slate-300">
              <button onClick={() => navigate('/panel')} className="hover:text-white transition-colors">
                <IoHomeOutline className="w-4 h-4" />
              </button>
              <span>/</span>
              <button onClick={() => navigate('/panelClientes')} className="hover:text-white transition-colors">
                Clientes
              </button>
              <span>/</span>
              <span className="text-white font-medium">Listado</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Contenido principal con el diseño original pero mejorado */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Título mejorado */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <IoPeopleOutline className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Listado de Clientes
          </h1>
          <p className="text-slate-300 text-lg">
            Gestiona y edita la información de tus clientes
          </p>
        </div>

        {loading && <p className="text-center text-slate-300">Cargando clientes...</p>}
        {error && <p className="text-center text-red-400">Error: {error}</p>}

        {/* Barra de búsqueda mejorada */}
        <div className="mb-6 flex justify-center">
          <div className="relative max-w-md w-full">
            <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
            />
          </div>
        </div>

      {/* Tabla de clientes moderna */}
      {!loading && !error && filteredClients.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">ID</th>
                  <th className="py-4 px-6 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">CUIL</th>
                  <th className="py-4 px-6 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nombre</th>
                  <th className="py-4 px-6 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
                  <th className="py-4 px-6 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden md:table-cell">Dirección</th>
                  <th className="py-4 px-6 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden lg:table-cell">Teléfono</th>
                  <th className="py-4 px-6 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {currentClients.map((client, index) => (
                  <tr key={client.idClient} className={`hover:bg-white/5 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white/2' : ''}`}>
                    <td className="py-4 px-6 text-sm text-white">{client.idClient}</td>
                    <td className="py-4 px-6 text-sm text-white">
                      {editingClientId === client.idClient ? (
                        <input
                          name="cuil"
                          value={editedClient.cuil || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : (
                        client.cuil
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-white">
                      {editingClientId === client.idClient ? (
                        <input
                          name="name"
                          value={editedClient.name || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : (
                        client.name
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-white">
                      {editingClientId === client.idClient ? (
                        <input
                          name="email"
                          value={editedClient.email || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : (
                        client.email
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-white hidden md:table-cell">
                      {editingClientId === client.idClient ? (
                        <input
                          name="direccion"
                          value={editedClient.direccion || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : (
                        client.direccion
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-white hidden lg:table-cell">
                      {editingClientId === client.idClient ? (
                        <input
                          name="mobilePhone"
                          value={editedClient.mobilePhone || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : (
                        client.mobilePhone
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center space-x-2">
                        {editingClientId === client.idClient ? (
                          <button
                            onClick={() => handleSaveClick(client.idClient)}
                            className="inline-flex items-center px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all duration-200 hover:scale-105"
                          >
                            <IoSaveOutline className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditClick(client)}
                            className="inline-flex items-center px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg border border-amber-500/30 transition-all duration-200 hover:scale-105"
                          >
                            <IoPencilOutline className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(client.idClient)}
                          className="inline-flex items-center px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200 hover:scale-105"
                        >
                          <IoTrashOutline className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje si no hay clientes */}
      {!loading && filteredClients.length === 0 && (
        <div className="text-center py-12">
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 max-w-md mx-auto">
            <IoPeopleOutline className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No se encontraron clientes</h3>
            <p className="text-slate-300 mb-4">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Aún no hay clientes registrados'}
            </p>
            <button
              onClick={() => navigate('/cliente')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            >
              Agregar primer cliente
            </button>
          </div>
        </div>
      )}

      {/* Paginación mejorada */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === index + 1
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ListadoDeClientes;
