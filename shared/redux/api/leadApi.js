/**
 * API para Leads/CRM - Endpoints usando RTK Query
 */

import { baseApi } from './baseApi';

const LEAD_STATUSES = ['NUEVO', 'CONTACTADO', 'EN_SEGUIMIENTO', 'CERRADO_GANADO', 'CERRADO_PERDIDO'];

const patchLeadStatusInCache = (draft, id, status) => {
  if (!Array.isArray(draft?.leads)) return;
  const lead = draft.leads.find((l) => String(l.id) === String(id));
  if (lead && status) lead.status = status;
};

export const leadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // adminId en args solo segmenta caché por usuario (no va al servidor)
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
      invalidatesTags: (result, error, { status, ...rest }) => {
        if (error) return [];
        const otherFields = Object.keys(rest).filter((k) => k !== 'id');
        if (status !== undefined && otherFields.length === 0) return [];
        return ['Lead'];
      },
      async onQueryStarted({ id, status, ...rest }, { dispatch, queryFulfilled, getState }) {
        if (status === undefined || Object.keys(rest).length > 0) return;

        const cacheKey = getState().auth?.user?.adminId;
        if (cacheKey == null) return;

        const patchResult = dispatch(
          leadApi.util.updateQueryData('getAllLeads', cacheKey, (draft) => {
            patchLeadStatusInCache(draft, id, status);
          }),
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(
            leadApi.util.updateQueryData('getAllLeads', cacheKey, (draft) => {
              patchLeadStatusInCache(draft, id, data?.lead?.status || status);
            }),
          );
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
