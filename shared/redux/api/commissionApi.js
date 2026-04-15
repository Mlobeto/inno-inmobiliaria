/**
 * API para Comisiones - Endpoints usando RTK Query
 * Gestión de comisiones de agentes por operaciones de venta/alquiler
 */

import { baseApi } from './baseApi';

export const commissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Listar comisiones (con filtros opcionales via query params)
    getCommissions: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.agentId) query.append('agentId', params.agentId);
        if (params.status) query.append('status', params.status);
        if (params.transactionType) query.append('transactionType', params.transactionType);
        if (params.year) query.append('year', params.year);
        if (params.month) query.append('month', params.month);
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        const qs = query.toString();
        return `/commissions${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Commission'],
      transformResponse: (response) => ({
        commissions: response.commissions || [],
        total: response.total || 0,
        pages: response.pages || 1,
        page: response.page || 1,
        totals: response.totals || {},
      }),
    }),

    // Resumen de liquidación por período
    getSettlement: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.year) query.append('year', params.year);
        if (params.month) query.append('month', params.month);
        const qs = query.toString();
        return `/commissions/settlement${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Commission'],
      transformResponse: (response) => ({
        settlement: response.settlement || [],
        period: response.period || {},
      }),
    }),

    // Detalle de una comisión
    getCommissionById: builder.query({
      query: (id) => `/commissions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Commission', id }],
      transformResponse: (response) => response.commission,
    }),

    // Crear comisión manual
    createCommission: builder.mutation({
      query: (data) => ({
        url: '/commissions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Commission'],
    }),

    // Actualizar comisión (solo PENDING)
    updateCommission: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/commissions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Commission', id },
        'Commission',
      ],
    }),

    // Aprobar comisión
    approveCommission: builder.mutation({
      query: (id) => ({
        url: `/commissions/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Commission', id },
        'Commission',
      ],
    }),

    // Marcar como pagada
    markCommissionPaid: builder.mutation({
      query: (id) => ({
        url: `/commissions/${id}/pay`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Commission', id },
        'Commission',
      ],
    }),

    // Cancelar comisión
    cancelCommission: builder.mutation({
      query: (id) => ({
        url: `/commissions/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Commission', id },
        'Commission',
      ],
    }),
  }),
});

export const {
  useGetCommissionsQuery,
  useGetSettlementQuery,
  useGetCommissionByIdQuery,
  useCreateCommissionMutation,
  useUpdateCommissionMutation,
  useApproveCommissionMutation,
  useMarkCommissionPaidMutation,
  useCancelCommissionMutation,
} = commissionApi;
