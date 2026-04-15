/**
 * API para Tickets de Soporte - RTK Query
 * Rutas de tenant: /tickets/*
 * Rutas de admin: /tickets/admin/*
 */

import { baseApi } from './baseApi';

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── TENANT ──
    getMyTickets: builder.query({
      query: () => '/tickets',
      transformResponse: (res) => res.tickets || [],
      providesTags: ['Ticket'],
    }),

    createTicket: builder.mutation({
      query: (data) => ({ url: '/tickets', method: 'POST', body: data }),
      invalidatesTags: ['Ticket'],
    }),

    addTenantMessage: builder.mutation({
      query: ({ ticketId, message }) => ({
        url: `/tickets/${ticketId}/messages`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Ticket'],
    }),

    // ── PLATFORM ADMIN ──
    getTicketStats: builder.query({
      query: () => '/tickets/admin/stats',
      transformResponse: (res) => res.stats || {},
      providesTags: ['Ticket'],
    }),

    getAllTickets: builder.query({
      query: (params = {}) => ({ url: '/tickets/admin', params }),
      transformResponse: (res) => res.tickets || [],
      providesTags: ['Ticket'],
    }),

    getTicketById: builder.query({
      query: (ticketId) => `/tickets/admin/${ticketId}`,
      transformResponse: (res) => res.ticket || null,
      providesTags: (r, e, id) => [{ type: 'Ticket', id }],
    }),

    addAdminMessage: builder.mutation({
      query: ({ ticketId, message }) => ({
        url: `/tickets/admin/${ticketId}/messages`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Ticket'],
    }),

    updateTicketStatus: builder.mutation({
      query: ({ ticketId, status }) => ({
        url: `/tickets/admin/${ticketId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Ticket'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetMyTicketsQuery,
  useCreateTicketMutation,
  useAddTenantMessageMutation,
  useGetTicketStatsQuery,
  useGetAllTicketsQuery,
  useGetTicketByIdQuery,
  useAddAdminMessageMutation,
  useUpdateTicketStatusMutation,
} = ticketApi;
