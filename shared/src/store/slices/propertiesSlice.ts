// 🏗️ Redux Toolkit - Properties Slice
// Maneja propiedades: CRUD, filtrado por tipo, búsqueda

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as propertyService from '../../api/services/propertyService';

// Types
export interface Property {
  propertyId: number;
  title: string;
  address: string;
  type: 'venta' | 'alquiler';
  status: 'available' | 'sold' | 'rented' | 'reserved';
  price: number;
  description?: string;
  images: string[];
  surface?: number;
  bedrooms?: number;
  bathrooms?: number;
  garages?: number;
  amenities?: string[];
  location?: {
    lat: number;
    lng: number;
  };
  is_published?: boolean; // Para landing pública
  tenant_id?: string; // Para multi-tenancy
  createdAt: string;
  updatedAt: string;
}

export interface PropertiesState {
  properties: Property[];
  currentProperty: Property | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  filters: {
    type?: 'venta' | 'alquiler';
    status?: string;
    search: string;
    priceMin?: number;
    priceMax?: number;
  };
}

const initialState: PropertiesState = {
  properties: [],
  currentProperty: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  filters: {
    search: '',
  },
};

// Async Thunks
export const fetchAllProperties = createAsyncThunk(
  'properties/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await propertyService.getAllProperties();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar propiedades');
    }
  }
);

export const fetchPropertiesByType = createAsyncThunk(
  'properties/fetchByType',
  async (type: 'venta' | 'alquiler', { rejectWithValue }) => {
    try {
      const response = await propertyService.getPropertiesByType(type);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar propiedades');
    }
  }
);

export const fetchPropertyById = createAsyncThunk(
  'properties/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await propertyService.getPropertyById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar propiedad');
    }
  }
);

export const createProperty = createAsyncThunk(
  'properties/create',
  async (propertyData: Partial<Property>, { rejectWithValue }) => {
    try {
      const response = await propertyService.createProperty(propertyData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear propiedad');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/update',
  async ({ id, data }: { id: number; data: Partial<Property> }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateProperty(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar propiedad');
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'properties/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await propertyService.deleteProperty(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar propiedad');
    }
  }
);

// Slice
const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setTypeFilter: (state, action: PayloadAction<'venta' | 'alquiler' | undefined>) => {
      state.filters.type = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.status = action.payload;
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setPriceRange: (state, action: PayloadAction<{ min?: number; max?: number }>) => {
      state.filters.priceMin = action.payload.min;
      state.filters.priceMax = action.payload.max;
    },
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearFilters: (state) => {
      state.filters = { search: '' };
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchAllProperties.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllProperties.fulfilled, (state, action) => {
        state.isLoading = false;
        state.properties = action.payload;
      })
      .addCase(fetchAllProperties.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch By Type
    builder
      .addCase(fetchPropertiesByType.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertiesByType.fulfilled, (state, action) => {
        state.isLoading = false;
        state.properties = action.payload;
      })
      .addCase(fetchPropertiesByType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch By ID
    builder
      .addCase(fetchPropertyById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProperty = action.payload;
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create
    builder
      .addCase(createProperty.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.isCreating = false;
        state.properties.push(action.payload);
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // Update
    builder
      .addCase(updateProperty.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.properties.findIndex((p) => p.propertyId === action.payload.propertyId);
        if (index !== -1) {
          state.properties[index] = action.payload;
        }
        if (state.currentProperty?.propertyId === action.payload.propertyId) {
          state.currentProperty = action.payload;
        }
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Delete
    builder
      .addCase(deleteProperty.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.properties = state.properties.filter((p) => p.propertyId !== action.payload);
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setTypeFilter,
  setStatusFilter,
  setSearchFilter,
  setPriceRange,
  clearCurrentProperty,
  clearError,
  clearFilters,
} = propertiesSlice.actions;
export default propertiesSlice.reducer;
