/**
 * API para Agentes - Endpoints usando RTK Query
 * Gestión de usuarios/agentes dentro del tenant
 */

import { baseApi } from './baseApi';

export const agentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Listar todos los agentes del tenant
    getAgents: builder.query({
      query: () => '/agents',
      providesTags: ['Agent'],
      transformResponse: (response) => response.agents || [],
    }),

    // Detalle de un agente con sus comisiones
    getAgentById: builder.query({
      query: (agentId) => `/agents/${agentId}`,
      providesTags: (result, error, agentId) => [{ type: 'Agent', id: agentId }],
      transformResponse: (response) => response,
    }),

    // Crear agente
    createAgent: builder.mutation({
      query: (data) => ({
        url: '/agents',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Agent'],
    }),

    // Actualizar agente
    updateAgent: builder.mutation({
      query: ({ agentId, ...data }) => ({
        url: `/agents/${agentId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { agentId }) => [
        { type: 'Agent', id: agentId },
        'Agent',
      ],
    }),

    // Desactivar agente (soft delete)
    deactivateAgent: builder.mutation({
      query: (agentId) => ({
        url: `/agents/${agentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Agent'],
    }),

    // Reactivar agente
    reactivateAgent: builder.mutation({
      query: (agentId) => ({
        url: `/agents/${agentId}/reactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['Agent'],
    }),
  }),
});

export const {
  useGetAgentsQuery,
  useGetAgentByIdQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeactivateAgentMutation,
  useReactivateAgentMutation,
} = agentApi;
