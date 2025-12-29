import {
  CREATE_CLIENT_REQUEST,
  CREATE_CLIENT_SUCCESS,
  CREATE_CLIENT_FAILURE,
  RESET_CREATE_CLIENT_STATE,
  GET_ALL_CLIENT_REQUEST,
  GET_ALL_CLIENT_SUCCESS,
  GET_ALL_CLIENT_FAIL,
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  GET_CLIENT_REQUEST,
  GET_CLIENT_SUCCESS,
  GET_CLIENT_FAILURE,
  UPDATE_CLIENT_REQUEST,
  UPDATE_CLIENT_SUCCESS,
  UPDATE_CLIENT_FAILURE,
  DELETE_CLIENT_REQUEST,
  DELETE_CLIENT_SUCCESS,
  DELETE_CLIENT_FAILURE,
  CREATE_PROPERTY_REQUEST,
  CREATE_PROPERTY_SUCCESS,
  CREATE_PROPERTY_FAILURE,
  RESET_CREATE_PROPERTY_STATE,
  ADD_PROPERTY_TO_CLIENT_REQUEST,
  ADD_PROPERTY_TO_CLIENT_SUCCESS,
  ADD_PROPERTY_TO_CLIENT_FAILURE,
  CREATE_LEASE_REQUEST,
  CREATE_LEASE_SUCCESS,
  CREATE_LEASE_FAILURE,
  GET_PROPERTIES_BY_CLIENT_REQUEST,
  GET_PROPERTIES_BY_CLIENT_SUCCESS,
  GET_PROPERTIES_BY_CLIENT_FAILURE,
  GET_PROPERTIES_BY_TYPE_REQUEST,
  GET_PROPERTIES_BY_TYPE_SUCCESS,
  GET_PROPERTIES_BY_TYPE_FAILURE,
  UPDATE_PROPERTY_REQUEST,
  UPDATE_PROPERTY_SUCCESS,
  UPDATE_PROPERTY_FAILURE,
  DELETE_PROPERTY_REQUEST,
  DELETE_PROPERTY_SUCCESS,
  DELETE_PROPERTY_FAILURE,
  GET_FILTERED_PROPERTIES_REQUEST,
  GET_FILTERED_PROPERTIES_SUCCESS,
  GET_FILTERED_PROPERTIES_FAILURE,
  GET_ALL_PROPERTIES_REQUEST,
  GET_ALL_PROPERTIES_SUCCESS,
  GET_ALL_PROPERTIES_FAILURE,
  GET_PROPERTIES_BY_ID_REQUEST,
  GET_PROPERTIES_BY_ID_SUCCESS,
  GET_PROPERTIES_BY_ID_FAILURE,
  CREATE_PAYMENT_REQUEST,
  CREATE_PAYMENT_SUCCESS,
  CREATE_PAYMENT_FAILURE,
  GET_PAYMENTS_BY_LEASE_REQUEST,
  GET_PAYMENTS_BY_LEASE_SUCCESS,
  GET_PAYMENTS_BY_LEASE_FAILURE,
  GET_PAYMENTS_BY_CLIENT_REQUEST,
  GET_PAYMENTS_BY_CLIENT_SUCCESS,
  GET_PAYMENTS_BY_CLIENT_FAILURE,
  GET_ALL_LEASES_REQUEST,
  GET_ALL_LEASES_SUCCESS,
  GET_ALL_LEASES_FAILURE,
  GET_LEASES_BY_CLIENT_REQUEST,
  GET_LEASES_BY_CLIENT_SUCCESS,
  GET_LEASES_BY_CLIENT_FAILURE,
  GET_ALL_PAYMENTS_REQUEST,
  GET_ALL_PAYMENTS_SUCCESS,
  GET_ALL_PAYMENTS_FAILURE,
  CREATE_GUARANTORS_REQUEST,
  CREATE_GUARANTORS_SUCCESS,
  CREATE_GUARANTORS_FAIL,
  GET_GUARANTORS_REQUEST,
  GET_GUARANTORS_SUCCESS,
  GET_GUARANTORS_FAIL,
  GET_LEASE_REQUEST,
  GET_LEASE_SUCCESS,
  GET_LEASE_FAILURE,
  UPDATE_LEASE_RENT_REQUEST,
  UPDATE_LEASE_RENT_SUCCESS,
  UPDATE_LEASE_RENT_FAILURE,
  // 🆕 Nuevas importaciones
  GET_PENDING_UPDATES_REQUEST,
  GET_PENDING_UPDATES_SUCCESS,
  GET_PENDING_UPDATES_FAILURE,
  GET_LEASE_HISTORY_REQUEST,
  GET_LEASE_HISTORY_SUCCESS,
  GET_LEASE_HISTORY_FAILURE,
  QUICK_UPDATE_LEASE_REQUEST,
  QUICK_UPDATE_LEASE_SUCCESS,
  QUICK_UPDATE_LEASE_FAILURE,
  BULK_UPDATE_LEASES_REQUEST,
  BULK_UPDATE_LEASES_SUCCESS,
  BULK_UPDATE_LEASES_FAILURE,
  GET_UPDATE_STATS_REQUEST,
  GET_UPDATE_STATS_SUCCESS,
  GET_UPDATE_STATS_FAILURE,
  GET_WHATSAPP_TEXT_REQUEST,
  GET_WHATSAPP_TEXT_SUCCESS,
  GET_WHATSAPP_TEXT_FAILURE,
  UPDATE_WHATSAPP_TEMPLATE_REQUEST,
  UPDATE_WHATSAPP_TEMPLATE_SUCCESS,
  UPDATE_WHATSAPP_TEMPLATE_FAILURE,
  UPDATE_PROPERTY_IMAGES_REQUEST,
  UPDATE_PROPERTY_IMAGES_SUCCESS,
  UPDATE_PROPERTY_IMAGES_FAILURE,
  VERIFY_TOKEN_REQUEST,
  VERIFY_TOKEN_SUCCESS,
  VERIFY_TOKEN_FAILURE,
  LOGOUT,
  SET_TOKEN
} from "../Actions/actions-types";

const initialState = {
  adminInfo: null,
  propertyClientData: null,
  token: null,
  payments: [],
  clients: [], 
  guarantors: [],
  client: null,
  allPayments: [],
  property: null,
  properties: [],
  allProperties: [],
  lease: null,
  leases: [],
  filteredProperties: [],
  loading: false,
  error: null,
  clientCreate: {
    loading: false,
    success: false,
    error: null,
  },
  propertyCreate: {
    loading: false,
    success: false,
    error: null,
  },
  leaseCreate: {
    loading: false,
    success: false,
    error: null,
  },
  paymentCreate: {
    loading: false,
    success: false,
    error: null,
    payment: null
  },
  // 🆕 Nuevos estados para las funcionalidades de actualización
  pendingUpdates: {
    loading: false,
    data: null,
    error: null,
    count: 0,
    currentDate: null
  },
  leaseHistory: {
    loading: false,
    data: {}, // Object to store history by leaseId
    error: null
  },
  quickUpdate: {
    loading: false,
    success: false,
    error: null,
    lastUpdated: null
  },
  bulkUpdate: {
    loading: false,
    results: null,
    error: null,
    lastOperation: null
  },
  updateStatistics: {
    loading: false,
    data: null,
    error: null,
    lastFetch: null
  },
  // 🆕 Estados para WhatsApp
  whatsappText: null,
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    // ========== AUTENTICACIÓN ==========
    case REGISTER_SUCCESS:
    case LOGIN_SUCCESS:
    case VERIFY_TOKEN_SUCCESS:
      return {
        ...state,
        adminInfo: action.payload.admin,
        token: action.payload.token,
        error: null,
        loading: false,
      };

    case REGISTER_FAIL:
    case LOGIN_FAIL:
    case VERIFY_TOKEN_FAILURE:
      return {
        ...state,
        adminInfo: null,
        token: null,
        error: action.payload,
        loading: false,
      };

    case VERIFY_TOKEN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SET_TOKEN:
      return {
        ...state,
        token: action.payload,
      };

    case LOGOUT:
      return {
        ...state,
        adminInfo: null,
        token: null,
        error: null,
        loading: false,
      };

    // ========== CLIENTES ==========
    case CREATE_CLIENT_REQUEST:
      return {
        ...state,
        clientCreate: {
          loading: true,
          success: false,
          error: null,
        },
      };

    case CREATE_CLIENT_SUCCESS:
      return {
        ...state,
        client: action.payload,
        clientCreate: {
          loading: false,
          success: true,
          error: null,
        },
      };

    case CREATE_CLIENT_FAILURE:
      return {
        ...state,
        clientCreate: {
          loading: false,
          success: false,
          error: action.payload,
        },
      };

    case RESET_CREATE_CLIENT_STATE:
      return {
        ...state,
        clientCreate: {
          loading: false,
          success: false,
          error: null,
        },
      };

    case GET_ALL_CLIENT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_ALL_CLIENT_SUCCESS:
      return {
        ...state,
        clients: action.payload,
        loading: false,
        error: null,
      };

    case GET_ALL_CLIENT_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_CLIENT_REQUEST:
    case UPDATE_CLIENT_REQUEST:
    case DELETE_CLIENT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_CLIENT_SUCCESS:
      return {
        ...state,
        client: action.payload,
        loading: false,
        error: null,
      };

    case UPDATE_CLIENT_SUCCESS:
      return {
        ...state,
        clients: state.clients.map((client) =>
          client.idClient === action.payload.idClient ? action.payload : client
        ),
        loading: false,
        error: null,
      };

    case DELETE_CLIENT_SUCCESS:
      return {
        ...state,
        clients: state.clients.filter(
          (client) => client.idClient !== action.payload
        ),
        loading: false,
        error: null,
      };

    case GET_CLIENT_FAILURE:
    case UPDATE_CLIENT_FAILURE:
    case DELETE_CLIENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ========== PROPIEDADES ==========
    case CREATE_PROPERTY_REQUEST:
      return {
        ...state,
        propertyCreate: {
          loading: true,
          success: false,
          error: null,
        },
      };

    case CREATE_PROPERTY_SUCCESS:
      return {
        ...state,
        properties: [...state.properties, action.payload],
        propertyCreate: {
          loading: false,
          success: true,
          error: null,
        },
      };

    case CREATE_PROPERTY_FAILURE:
      return {
        ...state,
        propertyCreate: {
          loading: false,
          success: false,
          error: action.payload,
        },
      };

    case RESET_CREATE_PROPERTY_STATE:
      return {
        ...state,
        propertyCreate: {
          loading: false,
          success: false,
          error: null,
        },
      };

    case ADD_PROPERTY_TO_CLIENT_REQUEST:
      return {
        ...state,
        loading: true,
      };

    case ADD_PROPERTY_TO_CLIENT_SUCCESS:
      return {
        ...state,
        loading: false,
        propertyClientData: action.payload,
      };

    case ADD_PROPERTY_TO_CLIENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_PROPERTIES_BY_CLIENT_REQUEST:
    case GET_PROPERTIES_BY_TYPE_REQUEST:
    case UPDATE_PROPERTY_REQUEST:
    case DELETE_PROPERTY_REQUEST:
    case GET_FILTERED_PROPERTIES_REQUEST:
      return { 
        ...state, 
        loading: true, 
        error: null 
      };

    case GET_PROPERTIES_BY_CLIENT_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        properties: action.payload 
      };

    case GET_PROPERTIES_BY_TYPE_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        properties: action.payload 
      };

    case UPDATE_PROPERTY_SUCCESS:
      return {
        ...state,
        loading: false,
        properties: state.properties.map((property) =>
          property.propertyId === action.payload.propertyId
            ? { ...property, ...action.payload }
            : property
        ),
      };

    case DELETE_PROPERTY_SUCCESS:
      return {
        ...state,
        loading: false,
        properties: state.properties.filter(
          (property) => property.propertyId !== action.payload.propertyId
        ),
      };

    case GET_FILTERED_PROPERTIES_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        filteredProperties: action.payload 
      };

    case GET_PROPERTIES_BY_CLIENT_FAILURE:
    case GET_PROPERTIES_BY_TYPE_FAILURE:
    case UPDATE_PROPERTY_FAILURE:
    case DELETE_PROPERTY_FAILURE:
    case GET_FILTERED_PROPERTIES_FAILURE:
      return { 
        ...state, 
        loading: false, 
        error: action.payload 
      };

    case GET_ALL_PROPERTIES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_ALL_PROPERTIES_SUCCESS:
      return {
        ...state,
        loading: false,
        allProperties: action.payload,
        error: null,
      };

    case GET_ALL_PROPERTIES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_PROPERTIES_BY_ID_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_PROPERTIES_BY_ID_SUCCESS:
      return {
        ...state,
        loading: false,
        property: action.payload,
        error: null,
      };

    case GET_PROPERTIES_BY_ID_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ========== CONTRATOS ==========
    case CREATE_LEASE_REQUEST:
      return {
        ...state,
        leaseCreate: {
          loading: true,
          success: false,
          error: null,
        },
      };

    case CREATE_LEASE_SUCCESS:
      return {
        ...state,
        leases: [...state.leases, action.payload],
        leaseCreate: {
          loading: false,
          success: true,
          error: null,
        },
      };

    case CREATE_LEASE_FAILURE:
      return {
        ...state,
        leaseCreate: {
          loading: false,
          success: false,
          error: action.payload,
        },
      };

    case GET_ALL_LEASES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_ALL_LEASES_SUCCESS:
      return {
        ...state,
        loading: false,
        leases: action.payload,
        error: null,
      };

    case GET_ALL_LEASES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_LEASES_BY_CLIENT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_LEASES_BY_CLIENT_SUCCESS:
      return {
        ...state,
        loading: false,
        leases: action.payload,
        error: null,
      };

    case GET_LEASES_BY_CLIENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case GET_LEASE_REQUEST:
      return { 
        ...state, 
        loading: true, 
        error: null 
      };

    case GET_LEASE_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        lease: action.payload 
      };

    case GET_LEASE_FAILURE:
      return { 
        ...state, 
        loading: false, 
        error: action.payload 
      };

    case UPDATE_LEASE_RENT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case UPDATE_LEASE_RENT_SUCCESS:
      return {
        ...state,
        loading: false,
        leases: state.leases.map((lease) =>
          lease.id === action.payload.lease.id ? action.payload.lease : lease
        ),
      };

    case UPDATE_LEASE_RENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // 🆕 ========== CONTRATOS PENDIENTES DE ACTUALIZACIÓN ==========
    case GET_PENDING_UPDATES_REQUEST:
      return {
        ...state,
        pendingUpdates: {
          ...state.pendingUpdates,
          loading: true,
          error: null,
        },
      };

    case GET_PENDING_UPDATES_SUCCESS:
      return {
        ...state,
        pendingUpdates: {
          loading: false,
          data: action.payload,
          error: null,
          count: action.payload.count || 0,
          currentDate: action.payload.currentDate || null,
        },
      };

    case GET_PENDING_UPDATES_FAILURE:
      return {
        ...state,
        pendingUpdates: {
          ...state.pendingUpdates,
          loading: false,
          error: action.payload,
        },
      };

    // 🆕 ========== HISTORIAL DE ACTUALIZACIONES ==========
    case GET_LEASE_HISTORY_REQUEST:
      return {
        ...state,
        leaseHistory: {
          ...state.leaseHistory,
          loading: true,
          error: null,
        },
      };

    case GET_LEASE_HISTORY_SUCCESS:
      return {
        ...state,
        leaseHistory: {
          loading: false,
          data: {
            ...state.leaseHistory.data,
            [action.payload.leaseId]: action.payload.history,
          },
          error: null,
        },
      };

    case GET_LEASE_HISTORY_FAILURE:
      return {
        ...state,
        leaseHistory: {
          ...state.leaseHistory,
          loading: false,
          error: action.payload,
        },
      };

    // 🆕 ========== ACTUALIZACIÓN RÁPIDA ==========
    case QUICK_UPDATE_LEASE_REQUEST:
      return {
        ...state,
        quickUpdate: {
          loading: true,
          success: false,
          error: null,
          lastUpdated: null,
        },
      };

    case QUICK_UPDATE_LEASE_SUCCESS:
      return {
        ...state,
        quickUpdate: {
          loading: false,
          success: true,
          error: null,
          lastUpdated: action.payload,
        },
        // 🔄 Actualizar también el contrato en la lista de contratos
        leases: state.leases.map((lease) =>
          lease.id === action.payload.update?.lease?.id 
            ? { ...lease, rentAmount: action.payload.update?.newAmount }
            : lease
        ),
        // 🔄 Actualizar la lista de pendientes si existe
        pendingUpdates: {
          ...state.pendingUpdates,
          data: state.pendingUpdates.data ? {
            ...state.pendingUpdates.data,
            pendingUpdates: state.pendingUpdates.data.pendingUpdates?.filter(
              (pendingLease) => pendingLease.id !== action.payload.update?.lease?.id
            ) || [],
            count: Math.max(0, (state.pendingUpdates.data.count || 0) - 1)
          } : state.pendingUpdates.data
        }
      };

    case QUICK_UPDATE_LEASE_FAILURE:
      return {
        ...state,
        quickUpdate: {
          loading: false,
          success: false,
          error: action.payload,
          lastUpdated: null,
        },
      };

    // 🆕 ========== ACTUALIZACIÓN MASIVA ==========
    case BULK_UPDATE_LEASES_REQUEST:
      return {
        ...state,
        bulkUpdate: {
          loading: true,
          results: null,
          error: null,
          lastOperation: null,
        },
      };

    case BULK_UPDATE_LEASES_SUCCESS:
      return {
        ...state,
        bulkUpdate: {
          loading: false,
          results: action.payload,
          error: null,
          lastOperation: new Date().toISOString(),
        },
        // 🔄 Actualizar múltiples contratos en la lista
        leases: state.leases.map((lease) => {
          const successfulUpdate = action.payload.results?.successful?.find(
            (update) => update.leaseId === lease.id
          );
          return successfulUpdate 
            ? { ...lease, rentAmount: successfulUpdate.newAmount }
            : lease;
        }),
        // 🔄 Remover contratos actualizados exitosamente de pendientes
        pendingUpdates: {
          ...state.pendingUpdates,
          data: state.pendingUpdates.data ? {
            ...state.pendingUpdates.data,
            pendingUpdates: state.pendingUpdates.data.pendingUpdates?.filter(
              (pendingLease) => !action.payload.results?.successful?.some(
                (update) => update.leaseId === pendingLease.id
              )
            ) || [],
            count: Math.max(0, (state.pendingUpdates.data.count || 0) - (action.payload.results?.successful?.length || 0))
          } : state.pendingUpdates.data
        }
      };

    case BULK_UPDATE_LEASES_FAILURE:
      return {
        ...state,
        bulkUpdate: {
          loading: false,
          results: null,
          error: action.payload,
          lastOperation: null,
        },
      };

    // 🆕 ========== ESTADÍSTICAS DE ACTUALIZACIONES ==========
    case GET_UPDATE_STATS_REQUEST:
      return {
        ...state,
        updateStatistics: {
          ...state.updateStatistics,
          loading: true,
          error: null,
        },
      };

    case GET_UPDATE_STATS_SUCCESS:
      return {
        ...state,
        updateStatistics: {
          loading: false,
          data: action.payload,
          error: null,
          lastFetch: new Date().toISOString(),
        },
      };

    case GET_UPDATE_STATS_FAILURE:
      return {
        ...state,
        updateStatistics: {
          ...state.updateStatistics,
          loading: false,
          error: action.payload,
        },
      };

    // ========== PAGOS ==========
    case CREATE_PAYMENT_REQUEST:
      return {
        ...state,
        paymentCreate: {
          ...state.paymentCreate,
          loading: true,
          success: false,
          error: null
        }
      };

    case CREATE_PAYMENT_SUCCESS:
      return {
        ...state,
        paymentCreate: {
          loading: false,
          success: true,
          error: null,
          payment: action.payload
        }
      };

    case CREATE_PAYMENT_FAILURE:
      return {
        ...state,
        paymentCreate: {
          ...state.paymentCreate,
          loading: false,
          success: false,
          error: action.payload
        }
      };

    case GET_PAYMENTS_BY_LEASE_REQUEST:
    case GET_PAYMENTS_BY_CLIENT_REQUEST:
      return { 
        ...state, 
        loading: true, 
        error: null 
      };

    case GET_PAYMENTS_BY_LEASE_SUCCESS:
    case GET_PAYMENTS_BY_CLIENT_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        payments: action.payload 
      };

    case GET_PAYMENTS_BY_LEASE_FAILURE:
    case GET_PAYMENTS_BY_CLIENT_FAILURE:
      return { 
        ...state, 
        loading: false, 
        error: action.payload 
      };

    case GET_ALL_PAYMENTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case GET_ALL_PAYMENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        allPayments: action.payload,
        error: null
      };

    case GET_ALL_PAYMENTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // ========== GARANTES ==========
    case CREATE_GUARANTORS_REQUEST:
    case GET_GUARANTORS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case CREATE_GUARANTORS_SUCCESS:
      return {
        ...state,
        loading: false,
        guarantors: action.payload.guarantors,
      };

    case GET_GUARANTORS_SUCCESS:
      return {
        ...state,
        loading: false,
        guarantors: action.payload,
      };

    case CREATE_GUARANTORS_FAIL:
    case GET_GUARANTORS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ========== WHATSAPP ==========
    case GET_WHATSAPP_TEXT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_WHATSAPP_TEXT_SUCCESS:
      return {
        ...state,
        loading: false,
        whatsappText: action.payload.whatsappText,
        error: null,
      };

    case GET_WHATSAPP_TEXT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case UPDATE_WHATSAPP_TEMPLATE_REQUEST:
    case UPDATE_PROPERTY_IMAGES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case UPDATE_WHATSAPP_TEMPLATE_SUCCESS:
      return {
        ...state,
        loading: false,
        property: action.payload, // Actualiza la propiedad con la nueva plantilla
        error: null,
      };

    case UPDATE_PROPERTY_IMAGES_SUCCESS:
      return {
        ...state,
        loading: false,
        property: action.payload, // Actualiza la propiedad con las nuevas imágenes
        error: null,
      };

    case UPDATE_WHATSAPP_TEMPLATE_FAILURE:
    case UPDATE_PROPERTY_IMAGES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default rootReducer;