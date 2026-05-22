import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllClientsQuery, useUpdateClientMutation, useDeleteClientMutation } from '@shared/redux';
import { getCountryConfig } from '@shared/constants/countryConfigs';
import { toast } from 'react-toastify';
import {
  IoSearchOutline,
  IoTrashOutline,
  IoSaveOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoCloseOutline,
  IoCreateOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';
import { AdminPanelLayout } from '../Admin/AdminPanelLayout';
import {
  alertError,
  btnGhost,
  btnPrimary,
  btnSecondary,
  card,
  emptyState,
  inputClass,
  spinner,
  tabActive,
  tabInactive,
  tableHeadRow,
  tableRow,
  tableTh,
  tableWrap,
} from '../Admin/adminPanelTheme';

const cellInput = `${inputClass} min-w-[120px]`;

const ListadoDeClientes = () => {
  const navigate = useNavigate();

  const { data: clients = [], isLoading, error } = useGetAllClientsQuery();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();

  const [tenantCountry] = useState('AR');
  const countryConfig = getCountryConfig(tenantCountry);

  const [editingClientId, setEditingClientId] = useState(null);
  const [editedClient, setEditedClient] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const filteredClients = useMemo(
    () => clients.filter((client) => client.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [clients, searchTerm],
  );

  const paginationData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    return { currentClients, totalPages };
  }, [filteredClients, currentPage, itemsPerPage]);

  const { currentClients, totalPages } = paginationData;

  const handleEditClick = (client) => {
    setEditingClientId(client.idClient);
    setEditedClient(client);
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
    setEditedClient({});
  };

  const handleSaveClick = async (idClient) => {
    try {
      await updateClient({ clientId: idClient, ...editedClient }).unwrap();
      setEditingClientId(null);
      setEditedClient({});
      toast.success('Cliente actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
      toast.error(err?.data?.details || 'Error al actualizar el cliente');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = async (idClient) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        await deleteClient(idClient).unwrap();
        toast.success('Cliente eliminado correctamente');
      } catch (err) {
        console.error('Error al eliminar cliente:', err);
        toast.error(err?.data?.details || 'Error al eliminar el cliente');
      }
    }
  };

  return (
    <AdminPanelLayout
      wide
      backTo="/panelClientes"
      backLabel="Clientes"
      title="Listado de Clientes"
      subtitle="Gestiona y edita la información de tus clientes"
      icon={IoPeopleOutline}
    >
      {isLoading && (
        <div className={`${emptyState} flex items-center justify-center gap-3`}>
          <div className={`w-8 h-8 ${spinner}`} />
          Cargando clientes...
        </div>
      )}

      {error && (
        <div className={alertError}>
          Error: {error?.data?.message || 'Error desconocido'}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="mb-5 max-w-md">
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${inputClass} pl-10 py-2.5`}
              />
            </div>
            <p className="text-xs text-textMuted mt-2">
              {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredClients.length > 0 ? (
            <div className={tableWrap}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className={tableHeadRow}>
                    <tr>
                      <th className={tableTh}>ID</th>
                      <th className={tableTh}>{countryConfig.documentTypes.person.tax.label}</th>
                      <th className={tableTh}>Nombre</th>
                      <th className={tableTh}>Email</th>
                      <th className={`${tableTh} hidden md:table-cell`}>Ubicación</th>
                      <th className={`${tableTh} hidden lg:table-cell`}>Dirección</th>
                      <th className={`${tableTh} hidden lg:table-cell`}>Teléfono</th>
                      <th className={tableTh}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentClients.map((client) => (
                      <tr key={client.idClient} className={tableRow}>
                        <td className="px-4 py-3 text-textSecondary">{client.idClient}</td>
                        <td className="px-4 py-3">
                          {editingClientId === client.idClient ? (
                            <input
                              name="cuil"
                              value={editedClient.cuil || ''}
                              onChange={handleInputChange}
                              className={cellInput}
                              placeholder={countryConfig.documentTypes.person.tax.format}
                            />
                          ) : (
                            <span className="text-textPrimary">{client.cuil}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingClientId === client.idClient ? (
                            <input
                              name="name"
                              value={editedClient.name || ''}
                              onChange={handleInputChange}
                              className={cellInput}
                            />
                          ) : (
                            <span className="font-medium text-textPrimary">{client.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingClientId === client.idClient ? (
                            <input
                              name="email"
                              value={editedClient.email || ''}
                              onChange={handleInputChange}
                              type="email"
                              className={cellInput}
                            />
                          ) : (
                            <span className="text-textSecondary">{client.email}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {editingClientId === client.idClient ? (
                            <div className="space-y-1 min-w-[140px]">
                              <input
                                name="provincia"
                                value={editedClient.provincia || ''}
                                onChange={handleInputChange}
                                placeholder="Provincia"
                                className={`${cellInput} text-xs`}
                              />
                              <input
                                name="ciudad"
                                value={editedClient.ciudad || ''}
                                onChange={handleInputChange}
                                placeholder="Ciudad"
                                className={`${cellInput} text-xs`}
                              />
                              <input
                                name="codigo_postal"
                                value={editedClient.codigo_postal || ''}
                                onChange={handleInputChange}
                                placeholder="CP"
                                className={`${cellInput} text-xs`}
                              />
                            </div>
                          ) : (
                            <div className="text-xs text-textSecondary">
                              <div className="flex items-center gap-1 text-textPrimary">
                                <IoLocationOutline className="w-3 h-3 shrink-0" />
                                <span>{client.ciudad || 'N/A'}</span>
                              </div>
                              <div>{client.provincia || 'N/A'}</div>
                              <div>CP: {client.codigo_postal || 'N/A'}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {editingClientId === client.idClient ? (
                            <input
                              name="direccion"
                              value={editedClient.direccion || ''}
                              onChange={handleInputChange}
                              className={cellInput}
                            />
                          ) : (
                            <span className="text-textSecondary">{client.direccion || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {editingClientId === client.idClient ? (
                            <input
                              name="mobilePhone"
                              value={editedClient.mobilePhone || ''}
                              onChange={handleInputChange}
                              className={cellInput}
                            />
                          ) : (
                            <span className="text-textSecondary">{client.mobilePhone || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {editingClientId === client.idClient ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveClick(client.idClient)}
                                  disabled={isUpdating}
                                  className={`${btnPrimary} px-2.5 py-2`}
                                  title="Guardar"
                                >
                                  <IoSaveOutline className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className={`${btnSecondary} px-2.5 py-2`}
                                  title="Cancelar"
                                >
                                  <IoCloseOutline className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditClick(client)}
                                  className={`${btnGhost} px-2.5 py-2`}
                                  title="Editar"
                                >
                                  <IoCreateOutline className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(client.idClient)}
                                  disabled={isDeleting}
                                  className="inline-flex items-center px-2.5 py-2 text-sm text-customRed border border-customRed/30 bg-customRedMuted hover:bg-customRed/20 rounded-lg transition-colors disabled:opacity-50"
                                  title="Eliminar"
                                >
                                  <IoTrashOutline className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-borderBase">
                  <span className="text-sm text-textMuted">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`${btnGhost} p-2 disabled:opacity-30`}
                    >
                      <IoChevronBackOutline className="w-4 h-4" />
                    </button>
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentPage(index + 1)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            currentPage === index + 1 ? tabActive : tabInactive
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`${btnGhost} p-2 disabled:opacity-30`}
                    >
                      <IoChevronForwardOutline className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`${card} text-center py-12 max-w-md mx-auto`}>
              <IoPeopleOutline className="w-14 h-14 text-textMuted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-textPrimary mb-2">No se encontraron clientes</h3>
              <p className="text-textSecondary text-sm mb-4">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Aún no hay clientes registrados'}
              </p>
              {!searchTerm && (
                <button type="button" onClick={() => navigate('/cliente')} className={btnPrimary}>
                  Agregar primer cliente
                </button>
              )}
            </div>
          )}
        </>
      )}
    </AdminPanelLayout>
  );
};

export default ListadoDeClientes;
