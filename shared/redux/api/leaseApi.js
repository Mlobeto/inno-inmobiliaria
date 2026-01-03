/**
 * API para Contratos - Endpoints usando RTK Query
 * Para gestionar contratos de alquiler del tenant
 */

import { baseApi } from './baseApi';

export const leaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Obtener todos los contratos del tenant
    getAllLeases: builder.query({
      query: () => '/lease/all',
      providesTags: ['Lease'],
    }),
    
    // Obtener contrato por ID
    getLeaseById: builder.query({
      query: (leaseId) => `/lease/${leaseId}`,
      providesTags: (result, error, leaseId) => [{ type: 'Lease', id: leaseId }],
    }),
    
    // Obtener contratos por cliente
    getLeasesByClient: builder.query({
      query: (clientId) => `/lease/client/${clientId}`,
      providesTags: (result, error, clientId) => [
        { type: 'Lease', clientId },
        'Lease',
      ],
    }),
    
    // Crear nuevo contrato
    createLease: builder.mutation({
      query: (leaseData) => ({
        url: '/lease',
        method: 'POST',
        body: leaseData,
      }),
      invalidatesTags: ['Lease', 'Property', 'Client'],
    }),
    
    // Actualizar contrato
    updateLease: builder.mutation({
      query: ({ leaseId, ...leaseData }) => ({
        url: `/lease/${leaseId}`,
        method: 'PUT',
        body: leaseData,
      }),
      invalidatesTags: (result, error, { leaseId }) => [
        { type: 'Lease', id: leaseId },
        'Lease',
        'Property',
      ],
    }),
    
    // Actualizar renta del contrato
    updateLeaseRent: builder.mutation({
      query: ({ leaseId, ...rentData }) => ({
        url: `/lease/${leaseId}/rent`,
        method: 'PATCH',
        body: rentData,
      }),
      invalidatesTags: (result, error, { leaseId }) => [
        { type: 'Lease', id: leaseId },
        'Lease',
      ],
    }),
    
    // Actualización rápida de contrato
    quickUpdateLease: builder.mutation({
      query: ({ leaseId, ...updateData }) => ({
        url: `/lease/${leaseId}/quick-update`,
        method: 'PATCH',
        body: updateData,
      }),
      invalidatesTags: (result, error, { leaseId }) => [
        { type: 'Lease', id: leaseId },
        'Lease',
      ],
    }),
    
    // Actualización masiva de contratos
    bulkUpdateLeases: builder.mutation({
      query: (updateData) => ({
        url: '/lease/bulk-update',
        method: 'POST',
        body: updateData,
      }),
      invalidatesTags: ['Lease'],
    }),
    
    // Obtener actualizaciones pendientes
    getPendingUpdates: builder.query({
      query: () => '/lease/pending-updates',
      providesTags: ['LeaseUpdates'],
    }),
    
    // Obtener historial de actualizaciones
    getLeaseHistory: builder.query({
      query: (leaseId) => `/lease/${leaseId}/history`,
      providesTags: (result, error, leaseId) => [{ type: 'LeaseHistory', id: leaseId }],
    }),
    
    // Obtener estadísticas de actualizaciones
    getUpdateStats: builder.query({
      query: () => '/lease/update-stats',
      providesTags: ['LeaseStats'],
    }),
    
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetAllLeasesQuery,
  useGetLeaseByIdQuery,
  useLazyGetLeaseByIdQuery,
  useGetLeasesByClientQuery,
  useLazyGetLeasesByClientQuery,
  useCreateLeaseMutation,
  useUpdateLeaseMutation,
  useUpdateLeaseRentMutation,
  useQuickUpdateLeaseMutation,
  useBulkUpdateLeasesMutation,
  useGetPendingUpdatesQuery,
  useGetLeaseHistoryQuery,
  useGetUpdateStatsQuery,
} = leaseApi;

export default leaseApi;
