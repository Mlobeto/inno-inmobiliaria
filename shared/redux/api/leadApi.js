/**
 * API para Leads/CRM - Endpoints usando RTK Query
 */

import { baseApi } from './baseApi';

const LEAD_STATUSES = ['NUEVO', 'CONTACTADO', 'EN_SEGUIMIENTO', 'CERRADO_GANADO', 'CERRADO_PERDIDO'];

export const leadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllLeads: builder.query({
      query: () => '/leads',
      providesTags: ['Lead'],
      transformResponse: (res) => ({
        ...res,
        leads: (res?.leads || []).map((lead) => ({
          ...lead,
          status: LEAD_STATUSES.includes(lead?.status) ? lead.status : (lead?.status || 'NUEVO'),
        })),
      }),
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
      async onQueryStarted({ id, status, ...rest }, { dispatch, queryFulfilled }) {
        if (status === undefined || Object.keys(rest).length > 0) return;

        const patchResult = dispatch(
          leadApi.util.updateQueryData('getAllLeads', undefined, (draft) => {
            const lead = draft?.leads?.find((l) => String(l.id) === String(id));
            if (lead) lead.status = status;
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    assignLeadAgent: builder.mutation({
      query: ({ leadId, agentId }) => ({
        url: `/leads/${leadId}/assign`,
        method: 'POST',
        body: { agentId },
      }),
      invalidatesTags: ['Lead'],
    }),

    unassignLeadAgent: builder.mutation({
      query: ({ leadId, agentId }) => ({
        url: `/leads/${leadId}/assign/${agentId}`,
        method: 'DELETE',
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
  useAssignLeadAgentMutation,
  useUnassignLeadAgentMutation,
  useDeleteLeadMutation,
} = leadApi;
