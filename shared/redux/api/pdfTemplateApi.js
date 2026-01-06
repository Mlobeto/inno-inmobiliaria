import { baseApi } from './baseApi';

/**
 * API para gestión de plantillas PDF
 * 
 * Endpoints:
 * - getTemplateTypes: Obtener tipos de plantillas disponibles
 * - getAllTemplates: Listar todas las plantillas del tenant
 * - getTemplateById: Obtener plantilla específica
 * - createTemplate: Crear nueva plantilla
 * - updateTemplate: Actualizar plantilla existente
 * - deleteTemplate: Eliminar plantilla (soft delete)
 * - duplicateTemplate: Duplicar plantilla
 * - setTemplateAsDefault: Marcar como predeterminada
 */

export const pdfTemplateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Obtener tipos de plantillas disponibles
    getTemplateTypes: builder.query({
      query: () => '/pdf-templates/types',
      providesTags: ['PdfTemplateTypes'],
    }),

    // Listar todas las plantillas del tenant
    getAllPdfTemplates: builder.query({
      query: ({ templateType, isActive } = {}) => {
        const params = new URLSearchParams();
        if (templateType) params.append('templateType', templateType);
        if (isActive !== undefined) params.append('isActive', isActive);
        
        return `/pdf-templates${params.toString() ? `?${params}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'PdfTemplates', id })),
              { type: 'PdfTemplates', id: 'LIST' },
            ]
          : [{ type: 'PdfTemplates', id: 'LIST' }],
    }),

    // Obtener plantilla específica
    getPdfTemplateById: builder.query({
      query: (id) => `/pdf-templates/${id}`,
      providesTags: (result, error, id) => [{ type: 'PdfTemplates', id }],
    }),

    // Crear nueva plantilla
    createPdfTemplate: builder.mutation({
      query: (templateData) => ({
        url: '/pdf-templates',
        method: 'POST',
        body: templateData,
      }),
      invalidatesTags: [{ type: 'PdfTemplates', id: 'LIST' }],
    }),

    // Actualizar plantilla existente
    updatePdfTemplate: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/pdf-templates/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PdfTemplates', id },
        { type: 'PdfTemplates', id: 'LIST' },
      ],
    }),

    // Eliminar plantilla (soft delete)
    deletePdfTemplate: builder.mutation({
      query: (id) => ({
        url: `/pdf-templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'PdfTemplates', id: 'LIST' }],
    }),

    // Duplicar plantilla
    duplicatePdfTemplate: builder.mutation({
      query: ({ id, templateName }) => ({
        url: `/pdf-templates/${id}/duplicate`,
        method: 'POST',
        body: { templateName },
      }),
      invalidatesTags: [{ type: 'PdfTemplates', id: 'LIST' }],
    }),

    // Marcar como predeterminada
    setTemplateAsDefault: builder.mutation({
      query: (id) => ({
        url: `/pdf-templates/${id}/set-default`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'PdfTemplates', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTemplateTypesQuery,
  useGetAllPdfTemplatesQuery,
  useGetPdfTemplateByIdQuery,
  useCreatePdfTemplateMutation,
  useUpdatePdfTemplateMutation,
  useDeletePdfTemplateMutation,
  useDuplicatePdfTemplateMutation,
  useSetTemplateAsDefaultMutation,
} = pdfTemplateApi;
