/**
 * API para Clientes - Endpoints usando RTK Query
 * Para gestionar clientes del tenant
 */

import { baseApi } from './baseApi';

export const clientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Obtener todos los clientes del tenant
    getAllClients: builder.query({
      query: () => '/client',
      providesTags: ['Client'],
    }),
    
    // Obtener cliente por ID
    getClientById: builder.query({
      query: (clientId) => `/client/${clientId}`,
      providesTags: (result, error, clientId) => [{ type: 'Client', id: clientId }],
    }),
    
    // Crear nuevo cliente
    createClient: builder.mutation({
      query: (clientData) => ({
        url: '/client',
        method: 'POST',
        body: clientData,
      }),
      invalidatesTags: ['Client'],
    }),
    
    // Actualizar cliente
    updateClient: builder.mutation({
      query: ({ clientId, ...clientData }) => ({
        url: `/client/${clientId}`,
        method: 'PUT',
        body: clientData,
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: 'Client', id: clientId },
        'Client',
      ],
    }),
    
    // Eliminar cliente
    deleteClient: builder.mutation({
      query: (clientId) => ({
        url: `/client/${clientId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Client'],
    }),
    
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetAllClientsQuery,
  useGetClientByIdQuery,
  useLazyGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;

export default clientApi;
