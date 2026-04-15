/**
 * API para Loteos - Endpoints usando RTK Query
 * Gestión de loteos y lotes individuales del tenant
 */

import { baseApi } from './baseApi';

export const loteoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ========== LOTEOS ==========

    // Obtener todos los loteos del tenant
    getLoteos: builder.query({
      query: () => '/loteos',
      providesTags: ['Loteo'],
    }),

    // Obtener loteo por ID (incluye lotes)
    getLoteoById: builder.query({
      query: (loteoId) => `/loteos/${loteoId}`,
      providesTags: (result, error, loteoId) => [{ type: 'Loteo', id: loteoId }],
    }),

    // Crear loteo
    createLoteo: builder.mutation({
      query: (data) => ({
        url: '/loteos',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Loteo'],
    }),

    // Actualizar loteo
    updateLoteo: builder.mutation({
      query: ({ loteoId, ...data }) => ({
        url: `/loteos/${loteoId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { loteoId }) => [
        { type: 'Loteo', id: loteoId },
        'Loteo',
      ],
    }),

    // Eliminar loteo
    deleteLoteo: builder.mutation({
      query: (loteoId) => ({
        url: `/loteos/${loteoId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Loteo'],
    }),

    // Publicar / despublicar loteo en landing
    togglePublishLoteo: builder.mutation({
      query: (loteoId) => ({
        url: `/loteos/${loteoId}/publish`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, loteoId) => [
        { type: 'Loteo', id: loteoId },
        'Loteo',
      ],
    }),

    // ========== LOTES ==========

    // Crear lote dentro de un loteo
    createLote: builder.mutation({
      query: ({ loteoId, ...data }) => ({
        url: `/loteos/${loteoId}/lotes`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { loteoId }) => [
        { type: 'Loteo', id: loteoId },
        'Loteo',
      ],
    }),

    // Actualizar lote
    updateLote: builder.mutation({
      query: ({ loteoId, loteId, ...data }) => ({
        url: `/loteos/${loteoId}/lotes/${loteId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { loteoId }) => [
        { type: 'Loteo', id: loteoId },
        'Loteo',
      ],
    }),

    // Eliminar lote
    deleteLote: builder.mutation({
      query: ({ loteoId, loteId }) => ({
        url: `/loteos/${loteoId}/lotes/${loteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { loteoId }) => [
        { type: 'Loteo', id: loteoId },
        'Loteo',
      ],
    }),
  }),
});

export const {
  useGetLoteosQuery,
  useGetLoteoByIdQuery,
  useCreateLoteoMutation,
  useUpdateLoteoMutation,
  useDeleteLoteoMutation,
  useTogglePublishLoteoMutation,
  useCreateLoteMutation,
  useUpdateLoteMutation,
  useDeleteLoteMutation,
} = loteoApi;
