/**
 * API para Leads/CRM - Endpoints usando RTK Query
 */

import { baseApi } from './baseApi';

export const leadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllLeads: builder.query({
      query: () => '/leads',
      providesTags: ['Lead'],
    }),

    createLead: builder.mutation({
      query: (data) => ({
        url: '/leads',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),

    updateLead: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/leads/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),

    deleteLead: builder.mutation({
      query: (id) => ({
        url: `/leads/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lead'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetAllLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
} = leadApi;
