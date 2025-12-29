// 🏗️ Redux Toolkit - Clients Slice
// Maneja clientes: CRUD, filtrado, búsqueda

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as clientService from '../../api/services/clientService';

// Types
export interface Client {
  idClient: number;
  name: string;
  email: string;
  phone: string;
  dni: string;
  address?: string;
  city?: string;
  nationality?: string;
  maritalStatus?: string;
  profession?: string;
  birthDate?: string;
  tenant_id?: string; // Para multi-tenancy
  createdAt: string;
  updatedAt: string;
}

export interface ClientsState {
  clients: Client[];
  currentClient: Client | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  filters: {
    search: string;
    role?: string; // propietario, inquilino, vendedor
  };
}

const initialState: ClientsState = {
  clients: [],
  currentClient: null,
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
export const fetchAllClients = createAsyncThunk(
  'clients/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await clientService.getAllClients();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar clientes');
    }
  }
);

export const fetchClientById = createAsyncThunk(
  'clients/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await clientService.getClientById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar cliente');
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/create',
  async (clientData: Partial<Client>, { rejectWithValue }) => {
    try {
      const response = await clientService.createClient(clientData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear cliente');
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, data }: { id: number; data: Partial<Client> }, { rejectWithValue }) => {
    try {
      const response = await clientService.updateClient(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar cliente');
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await clientService.deleteClient(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar cliente');
    }
  }
);

// Slice
const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setRoleFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.role = action.payload;
    },
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchAllClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload;
      })
      .addCase(fetchAllClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch By ID
    builder
      .addCase(fetchClientById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentClient = action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create
    builder
      .addCase(createClient.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isCreating = false;
        state.clients.push(action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // Update
    builder
      .addCase(updateClient.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.clients.findIndex((c) => c.idClient === action.payload.idClient);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.currentClient?.idClient === action.payload.idClient) {
          state.currentClient = action.payload;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Delete
    builder
      .addCase(deleteClient.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.clients = state.clients.filter((c) => c.idClient !== action.payload);
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearchFilter, setRoleFilter, clearCurrentClient, clearError } = clientsSlice.actions;
export default clientsSlice.reducer;
