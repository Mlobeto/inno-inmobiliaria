/**
 * API para Pagos/Recibos - Endpoints usando RTK Query
 * Para gestionar recibos de pago del tenant
 */

import { baseApi } from './baseApi';

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Obtener todos los pagos del tenant
    getAllPayments: builder.query({
      query: () => '/payment',
      providesTags: ['Payment'],
    }),
    
    // Obtener pagos por contrato
    getPaymentsByLease: builder.query({
      query: (leaseId) => `/payment/lease/${leaseId}`,
      providesTags: (result, error, leaseId) => [
        { type: 'Payment', leaseId },
        'Payment',
      ],
    }),
    
    // Obtener pagos por cliente
    getPaymentsByClient: builder.query({
      query: (clientId) => `/payment/client/${clientId}`,
      providesTags: (result, error, clientId) => [
        { type: 'Payment', clientId },
        'Payment',
      ],
    }),
    
    // Crear nuevo pago
    createPayment: builder.mutation({
      query: (paymentData) => ({
        url: '/payment',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['Payment', 'Lease'],
    }),
    
    // Actualizar pago
    updatePayment: builder.mutation({
      query: ({ paymentId, ...paymentData }) => ({
        url: `/payment/${paymentId}`,
        method: 'PUT',
        body: paymentData,
      }),
      invalidatesTags: (result, error, { paymentId }) => [
        { type: 'Payment', id: paymentId },
        'Payment',
        'Lease',
      ],
    }),
    
    // Eliminar pago
    deletePayment: builder.mutation({
      query: (paymentId) => ({
        url: `/payment/${paymentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Payment', 'Lease'],
    }),
    
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetAllPaymentsQuery,
  useGetPaymentsByLeaseQuery,
  useLazyGetPaymentsByLeaseQuery,
  useGetPaymentsByClientQuery,
  useLazyGetPaymentsByClientQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} = paymentApi;

export default paymentApi;
