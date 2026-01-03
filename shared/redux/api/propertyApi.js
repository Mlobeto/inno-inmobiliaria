/**
 * API para Propiedades - Endpoints usando RTK Query
 * Para gestionar propiedades del tenant
 */

import { baseApi } from './baseApi';

export const propertyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Obtener todas las propiedades del tenant
    getAllProperties: builder.query({
      query: () => '/property',
      providesTags: ['Property'],
    }),
    
    // Obtener propiedad por ID
    getPropertyById: builder.query({
      query: (propertyId) => `/property/${propertyId}`,
      providesTags: (result, error, propertyId) => [{ type: 'Property', id: propertyId }],
    }),
    
    // Obtener propiedades por cliente
    getPropertiesByClient: builder.query({
      query: (clientId) => `/property/client/${clientId}`,
      providesTags: (result, error, clientId) => [
        { type: 'Property', clientId },
        'Property',
      ],
    }),
    
    // Obtener propiedades por tipo
    getPropertiesByType: builder.query({
      query: (type) => `/property/type/${type}`,
      providesTags: ['Property'],
    }),
    
    // Crear nueva propiedad
    createProperty: builder.mutation({
      query: (propertyData) => ({
        url: '/property',
        method: 'POST',
        body: propertyData,
      }),
      invalidatesTags: ['Property', 'Client'],
    }),
    
    // Actualizar propiedad
    updateProperty: builder.mutation({
      query: ({ propertyId, ...propertyData }) => ({
        url: `/property/${propertyId}`,
        method: 'PUT',
        body: propertyData,
      }),
      invalidatesTags: (result, error, { propertyId }) => [
        { type: 'Property', id: propertyId },
        'Property',
        'Client',
      ],
    }),
    
    // Eliminar propiedad
    deleteProperty: builder.mutation({
      query: (propertyId) => ({
        url: `/property/${propertyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Property', 'Client'],
    }),
    
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetAllPropertiesQuery,
  useGetPropertyByIdQuery,
  useLazyGetPropertyByIdQuery,
  useGetPropertiesByClientQuery,
  useLazyGetPropertiesByClientQuery,
  useGetPropertiesByTypeQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
} = propertyApi;

export default propertyApi;
