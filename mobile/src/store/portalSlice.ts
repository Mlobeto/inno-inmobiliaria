import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
  return json;
}

export interface PortalClient {
  idClient: number;
  name: string;
  email: string;
}

export interface PaymentMethod {
  id: number;
  type: 'cbu' | 'alias' | 'qr' | 'transferencia';
  label: string;
  value: string;
}

export interface Receipt {
  id: number;
  period: string;
  amount: string;
  originalAmount: string | null;
  originalCurrency: string;
  paymentDate: string;
  status: 'pending' | 'paid';
  voucherUrl: string | null;
  voucherStatus: 'none' | 'pending_review' | 'approved' | 'rejected';
  voucherRejReason: string | null;
  paidAt: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
}

export interface TenantInfo {
  tenantId: number;
  businessName: string;
  logo: string | null;
}

interface PortalState {
  token: string | null;
  client: PortalClient | null;
  tenantId: number | null;
  tenantInfo: TenantInfo | null;
  receipts: Receipt[];
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  tenantLoading: boolean;
  error: string | null;
  tenantError: string | null;
}

const initialState: PortalState = {
  token: null,
  client: null,
  tenantId: null,
  tenantInfo: null,
  receipts: [],
  paymentMethods: [],
  isLoading: false,
  tenantLoading: false,
  error: null,
  tenantError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const lookupTenant = createAsyncThunk(
  'portal/lookupTenant',
  async (code: string, { rejectWithValue }) => {
    try {
      const data = await apiFetch(`${API_URL}/portal/tenant?code=${encodeURIComponent(code.toLowerCase().trim())}`);
      return data as TenantInfo;
    } catch (err: any) {
      return rejectWithValue(err.message || 'No se encontró la inmobiliaria');
    }
  }
);

export const portalLogin = createAsyncThunk(
  'portal/login',
  async (
    { email, cuil, tenantId }: { email: string; cuil: string; tenantId: number },
    { rejectWithValue }
  ) => {
    try {
      const data = await apiFetch(`${API_URL}/portal/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': String(tenantId) },
        body: JSON.stringify({ email, cuil, tenantId }),
      });
      await AsyncStorage.setItem('portal_token', data.token);
      await AsyncStorage.setItem('portal_tenant_id', String(tenantId));
      return { token: data.token, client: data.client, tenantId };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Credenciales inválidas');
    }
  }
);

export const fetchMisPagos = createAsyncThunk(
  'portal/fetchMisPagos',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { portal: PortalState };
      const token = state.portal.token;
      const data = await apiFetch(`${API_URL}/portal/mis-pagos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data as { receipts: Receipt[]; paymentMethods: PaymentMethod[] };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error al cargar pagos');
    }
  }
);

export const subirComprobante = createAsyncThunk(
  'portal/subirComprobante',
  async (
    { receiptId, fileUri, fileName, mimeType }: { receiptId: number; fileUri: string; fileName: string; mimeType: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { portal: PortalState };
      const token = state.portal.token;

      const formData = new FormData();
      formData.append('file', { uri: fileUri, name: fileName, type: mimeType } as any);

      const res = await fetch(`${API_URL}/portal/pago/${receiptId}/comprobante`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
      return { receiptId, ...json.data };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error al subir comprobante');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const portalSlice = createSlice({
  name: 'portal',
  initialState,
  reducers: {
    portalLogout: (state) => {
      state.token = null;
      state.client = null;
      state.tenantId = null;
      state.tenantInfo = null;
      state.receipts = [];
      state.paymentMethods = [];
      AsyncStorage.removeItem('portal_token');
      AsyncStorage.removeItem('portal_tenant_id');
    },
    setPortalToken: (state, action: PayloadAction<{ token: string; client: PortalClient; tenantId: number }>) => {
      state.token = action.payload.token;
      state.client = action.payload.client;
      state.tenantId = action.payload.tenantId;
    },
    clearPortalError: (state) => {
      state.error = null;
    },
    clearTenantInfo: (state) => {
      state.tenantInfo = null;
      state.tenantError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(lookupTenant.pending, (state) => {
        state.tenantLoading = true;
        state.tenantError = null;
        state.tenantInfo = null;
      })
      .addCase(lookupTenant.fulfilled, (state, action) => {
        state.tenantLoading = false;
        state.tenantInfo = action.payload;
      })
      .addCase(lookupTenant.rejected, (state, action) => {
        state.tenantLoading = false;
        state.tenantError = action.payload as string;
      })
      .addCase(portalLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(portalLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.client = action.payload.client;
        state.tenantId = action.payload.tenantId;
      })
      .addCase(portalLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMisPagos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMisPagos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.receipts = action.payload.receipts;
        state.paymentMethods = action.payload.paymentMethods;
      })
      .addCase(fetchMisPagos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(subirComprobante.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(subirComprobante.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.receipts.findIndex((r) => r.id === action.payload.receiptId);
        if (idx !== -1) {
          state.receipts[idx].voucherUrl = action.payload.voucherUrl;
          state.receipts[idx].voucherStatus = action.payload.voucherStatus;
        }
      })
      .addCase(subirComprobante.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { portalLogout, setPortalToken, clearPortalError, clearTenantInfo } = portalSlice.actions;
export default portalSlice.reducer;
