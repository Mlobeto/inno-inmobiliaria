import axios from "axios";
import Swal from "sweetalert2";

import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  CREATE_CLIENT_REQUEST,
  CREATE_CLIENT_SUCCESS,
  CREATE_CLIENT_FAILURE,
  RESET_CREATE_CLIENT_STATE,
  GET_CLIENT_REQUEST,
  GET_CLIENT_SUCCESS,
  GET_CLIENT_FAILURE,
  UPDATE_CLIENT_REQUEST,
  UPDATE_CLIENT_SUCCESS,
  UPDATE_CLIENT_FAILURE,
  DELETE_CLIENT_REQUEST,
  DELETE_CLIENT_SUCCESS,
  DELETE_CLIENT_FAILURE,
  GET_ALL_CLIENT_REQUEST,
  GET_ALL_CLIENT_SUCCESS,
  GET_ALL_CLIENT_FAIL,
  CREATE_PROPERTY_REQUEST,
  CREATE_PROPERTY_SUCCESS,
  CREATE_PROPERTY_FAILURE,
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
  GET_LEASE_REQUEST,
  GET_LEASE_SUCCESS,
  GET_LEASE_FAILURE,
  GET_ALL_PAYMENTS_REQUEST,
  GET_ALL_PAYMENTS_SUCCESS,
  GET_ALL_PAYMENTS_FAILURE,
  CREATE_GUARANTORS_REQUEST,
  CREATE_GUARANTORS_SUCCESS,
  CREATE_GUARANTORS_FAIL,
  GET_GUARANTORS_REQUEST,
  GET_GUARANTORS_SUCCESS,
  GET_GUARANTORS_FAIL,
  UPDATE_LEASE_RENT_REQUEST,
  UPDATE_LEASE_RENT_SUCCESS,
  UPDATE_LEASE_RENT_FAILURE,
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
  ADD_PROPERTY_TO_CLIENT_ERROR,
  ADD_PROPERTY_TO_CLIENT_SUCCESS,
  GET_WHATSAPP_TEXT_REQUEST,
  GET_WHATSAPP_TEXT_SUCCESS,
  GET_WHATSAPP_TEXT_FAILURE,
  UPDATE_WHATSAPP_TEMPLATE_REQUEST,
  UPDATE_WHATSAPP_TEMPLATE_SUCCESS,
  UPDATE_WHATSAPP_TEMPLATE_FAILURE,
  UPDATE_PROPERTY_IMAGES_REQUEST,
  UPDATE_PROPERTY_IMAGES_SUCCESS,
  UPDATE_PROPERTY_IMAGES_FAILURE,
} from "./actions-types";

export const registerAdmin = (adminData) => async (dispatch) => {
  try {
    const response = await axios.post("/auth/register", adminData);
    dispatch({
      type: REGISTER_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: REGISTER_FAIL,
      payload:
        error.response?.data?.message || "Error al registrar administrador",
    });
  }
};

export const loginAdmin = (adminData) => async (dispatch) => {
  try {
    const response = await axios.post("/auth/login", adminData);
    localStorage.setItem("token", response.data.token);
    dispatch({
      type: LOGIN_SUCCESS,
      payload: {
        token: response.data.token,
        admin: response.data.admin,
      },
    });
    return { type: LOGIN_SUCCESS };
  } catch (error) {
    dispatch({
      type: LOGIN_FAIL,
      payload: error.response?.data?.message || "Error al iniciar sesión",
    });
    return { type: LOGIN_FAIL };
  }
};
export const verifyToken = () => async (dispatch) => {
  const token = localStorage.getItem("token");

  if (!token) {
    dispatch({ type: LOGIN_FAIL, payload: "No hay token" });
    return;
  }

  try {
    const response = await axios.get("/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dispatch({
      type: LOGIN_SUCCESS,
      payload: {
        token: token,
        admin: response.data.admin,
      },
    });
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    localStorage.removeItem("token");
    dispatch({
      type: LOGIN_FAIL,
      payload: "Token inválido",
    });
  }
};

export const createClient = (clientData) => async (dispatch) => {
  dispatch({ type: CREATE_CLIENT_REQUEST });

  try {
    const response = await axios.post(`/client`, clientData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    dispatch({ type: CREATE_CLIENT_SUCCESS, payload: response.data });
    return response.data; // Devuelve el cliente creado
  } catch (error) {
    const errorMessage = error.response?.data?.details || error.message;
    dispatch({ type: CREATE_CLIENT_FAILURE, payload: errorMessage });
    throw errorMessage; // Lanza el error para que el componente lo maneje
  }
};

// Acción para limpiar el estado de creación de cliente
export const resetCreateClientState = () => ({
  type: RESET_CREATE_CLIENT_STATE
});

export const getAllClients = () => async (dispatch) => {
  dispatch({ type: GET_ALL_CLIENT_REQUEST });

  try {
    const response = await axios.get("/client");
    dispatch({
      type: GET_ALL_CLIENT_SUCCESS,
      payload: response.data, // Lista de clientes
    });
  } catch (error) {
    dispatch({
      type: GET_ALL_CLIENT_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getClientById = (idClient) => async (dispatch) => {
  dispatch({ type: GET_CLIENT_REQUEST });

  try {
    const response = await axios.get(`/client/${idClient}`);
    dispatch({
      type: GET_CLIENT_SUCCESS,
      payload: response.data, // Información del cliente
    });
  } catch (error) {
    dispatch({
      type: GET_CLIENT_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Acción para actualizar un cliente
export const updateClient = (idClient, clientData) => async (dispatch) => {
  dispatch({ type: UPDATE_CLIENT_REQUEST });

  try {
    await axios.put(`/client/${idClient}`, clientData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    dispatch({
      type: UPDATE_CLIENT_SUCCESS,
      payload: { idClient, ...clientData }, // Se actualiza con los datos del cliente modificado
    });
  } catch (error) {
    dispatch({
      type: UPDATE_CLIENT_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Acción para eliminar un cliente
export const deleteClient = (idClient) => async (dispatch) => {
  dispatch({ type: DELETE_CLIENT_REQUEST });

  try {
    await axios.delete(`/client/${idClient}`);
    dispatch({
      type: DELETE_CLIENT_SUCCESS,
      payload: idClient, // Se elimina por ID
    });
  } catch (error) {
    dispatch({
      type: DELETE_CLIENT_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const createProperty = (propertyData) => async (dispatch) => {
  dispatch({ type: CREATE_PROPERTY_REQUEST });

  try {
    const response = await axios.post(`/property`, propertyData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    dispatch({ type: CREATE_PROPERTY_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({
      type: CREATE_PROPERTY_FAILURE,
      payload: error.response?.data?.message || "Error al crear la propiedad",
    });
  }
};

export const getAllProperties = () => async (dispatch) => {
  dispatch({ type: GET_ALL_PROPERTIES_REQUEST });
  try {
    const response = await axios.get("/property");
    dispatch({ type: GET_ALL_PROPERTIES_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: GET_ALL_PROPERTIES_FAILURE, payload: error.message });
    Swal.fire("Error", "No se pudieron obtener las propiedades", "error");
  }
};

export const addPropertyToClientWithRole = (data) => async (dispatch) => {
  try {
    console.log("Enviando datos para asignar rol:", data);

    const response = await axios.post(`/clientRole/addRole`, data);

    console.log("Respuesta exitosa de addRole:", response.data);

    dispatch({
      type: ADD_PROPERTY_TO_CLIENT_SUCCESS,
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.log("Error al hacer la solicitud:", error);

    let errorPayload;

    if (error.response) {
      console.log("Error response payload:", error.response.data);
      errorPayload = {
        error: error.response.data.error || "Error del servidor",
        details: error.response.data.details || error.message,
        status: error.response.status,
      };
    } else {
      errorPayload = {
        error: "Error de conexión",
        details: error.message,
        status: null,
      };
    }

    dispatch({
      type: ADD_PROPERTY_TO_CLIENT_ERROR,
      payload: errorPayload,
    });

    // IMPORTANTE: Retornar un objeto con success: false para manejar el error
    return {
      success: false,
      error: errorPayload.error,
      details: errorPayload.details,
      status: errorPayload.status,
    };
  }
};

export const getPropertiesByClient = (idClient) => async (dispatch) => {
  dispatch({ type: GET_PROPERTIES_BY_CLIENT_REQUEST });
  try {
    const response = await axios.get(`/property/${idClient}`);
    dispatch({
      type: GET_PROPERTIES_BY_CLIENT_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: GET_PROPERTIES_BY_CLIENT_FAILURE,
      payload: error.message,
    });
    Swal.fire(
      "Error",
      "No se pudieron obtener las propiedades del cliente",
      "error"
    );
  }
};

export const getPropertiesByType = (type) => async (dispatch) => {
  dispatch({ type: GET_PROPERTIES_BY_TYPE_REQUEST });
  try {
    const response = await axios.get(`/property/type/${type}`);
    dispatch({ type: GET_PROPERTIES_BY_TYPE_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: GET_PROPERTIES_BY_TYPE_FAILURE, payload: error.message });
    Swal.fire(
      "Error",
      "No se pudieron obtener las propiedades por tipo",
      "error"
    );
  }
};

export const getPropertiesById = (propertyId) => async (dispatch) => {
  dispatch({ type: GET_PROPERTIES_BY_ID_REQUEST });
  try {
    const response = await axios.get(`/property/${propertyId}`);

    // Verificar si la propiedad está disponible
    if (!response.data.isAvailable) {
      Swal.fire({
        title: "Propiedad No Disponible",
        text: "Esta propiedad ya tiene un contrato activo",
        icon: "warning",
      });
    }

    dispatch({ type: GET_PROPERTIES_BY_ID_SUCCESS, payload: response.data });
    return response.data;
  } catch (error) {
    dispatch({ type: GET_PROPERTIES_BY_ID_FAILURE, payload: error.message });
    Swal.fire({
      title: "Error",
      text: "No se pudo obtener la información de la propiedad",
      icon: "error",
    });
    throw error;
  }
};

export const updateProperty =
  (propertyId, propertyData) => async (dispatch) => {
    dispatch({ type: UPDATE_PROPERTY_REQUEST });
    try {
      const response = await axios.put(`/property/${propertyId}`, propertyData);
      dispatch({ type: UPDATE_PROPERTY_SUCCESS, payload: response.data });
      Swal.fire("Éxito", "Propiedad actualizada correctamente", "success");
    } catch (error) {
      dispatch({ type: UPDATE_PROPERTY_FAILURE, payload: error.message });
      Swal.fire("Error", "No se pudo actualizar la propiedad", "error");
    }
  };

export const deleteProperty = (propertyId) => async (dispatch) => {
  dispatch({ type: DELETE_PROPERTY_REQUEST });
  try {
    const response = await axios.delete(`/property/${propertyId}`);
    dispatch({ type: DELETE_PROPERTY_SUCCESS, payload: response.data });
    Swal.fire("Éxito", "Propiedad eliminada correctamente", "success");
  } catch (error) {
    dispatch({ type: DELETE_PROPERTY_FAILURE, payload: error.message });
    Swal.fire("Error", "No se pudo eliminar la propiedad", "error");
  }
};

export const getFilteredProperties = (filters) => async (dispatch) => {
  dispatch({ type: GET_FILTERED_PROPERTIES_REQUEST });
  try {
    const response = await axios.get(`/property/filter`, { params: filters });
    dispatch({ type: GET_FILTERED_PROPERTIES_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: GET_FILTERED_PROPERTIES_FAILURE, payload: error.message });
    Swal.fire("Error", "No se pudieron filtrar las propiedades", "error");
  }
};

export const createLease = (leaseData) => async (dispatch) => {
  dispatch({ type: CREATE_LEASE_REQUEST });

  try {
    console.log("Enviando datos del contrato:", leaseData);

    const response = await axios.post(`/lease`, leaseData, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("Respuesta del backend:", response.data);

    dispatch({ type: CREATE_LEASE_SUCCESS, payload: response.data });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error completo al crear el contrato:", error);
    console.error("Error response:", error.response);
    console.error("Error request:", error.request);

    // Extraer mensaje de error más específico
    let errorMessage = "Ocurrió un error al crear el contrato.";
    let errorDetails = "";
    let serverError = "";

    if (error.response) {
      // Error del servidor (4xx, 5xx)
      const status = error.response.status;
      const data = error.response.data;

      console.error("Respuesta del servidor:", {
        status,
        statusText: error.response.statusText,
        data,
      });

      if (status === 500) {
        errorMessage = "Error interno del servidor";
        serverError =
          data?.error || data?.message || "Error interno del servidor";
        errorDetails =
          data?.details || "El servidor encontró un error inesperado";
      } else if (status === 400) {
        errorMessage = "Error en los datos enviados";
        serverError = data?.error || data?.message || "Datos inválidos";
        errorDetails =
          data?.details || "Verifica que todos los campos sean correctos";
      } else if (status === 404) {
        errorMessage = "Recurso no encontrado";
        serverError = data?.error || data?.message || "Recurso no encontrado";
        errorDetails =
          data?.details || "El endpoint o recurso solicitado no existe";
      } else {
        errorMessage = `Error ${status}`;
        serverError = data?.error || data?.message || error.response.statusText;
        errorDetails = data?.details || "";
      }
    } else if (error.request) {
      // Error de red
      errorMessage = "Error de conexión";
      serverError = "No se pudo conectar con el servidor";
      errorDetails =
        "Verifica tu conexión a internet o que el servidor esté disponible";
    } else {
      // Error de configuración
      errorMessage = "Error de configuración";
      serverError = error.message;
      errorDetails = "Error en la configuración de la petición";
    }

    const fullErrorMessage = `${errorMessage}: ${serverError}${
      errorDetails ? `\n\nDetalles: ${errorDetails}` : ""
    }`;

    dispatch({
      type: CREATE_LEASE_FAILURE,
      payload: fullErrorMessage,
    });

    return {
      success: false,
      error: errorMessage,
      serverError: serverError,
      details: errorDetails,
      fullError: fullErrorMessage,
      status: error.response?.status || null,
    };
  }
};

export const createPayment = (paymentData) => async (dispatch) => {
  dispatch({ type: CREATE_PAYMENT_REQUEST });
  try {
    const response = await axios.post("/payment", paymentData);
    dispatch({
      type: CREATE_PAYMENT_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: CREATE_PAYMENT_FAILURE,
      payload: error.response?.data?.error || error.message,
    });
  }
};

export const getPaymentsByLeaseId = (leaseId) => async (dispatch) => {
  dispatch({ type: GET_PAYMENTS_BY_LEASE_REQUEST });
  try {
    const response = await axios.get(`/payment/lease/${leaseId}`);
    dispatch({
      type: GET_PAYMENTS_BY_LEASE_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: GET_PAYMENTS_BY_LEASE_FAILURE,
      payload: error.response?.data?.error || error.message,
    });
  }
};

export const getPaymentsByClient = (idClient) => async (dispatch) => {
  dispatch({ type: GET_PAYMENTS_BY_CLIENT_REQUEST });
  try {
    const response = await axios.get(`/payment/client/${idClient}`);
    dispatch({
      type: GET_PAYMENTS_BY_CLIENT_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: GET_PAYMENTS_BY_CLIENT_FAILURE,
      payload: error.response?.data?.error || error.message,
    });
  }
};

export const getAllLeases = () => async (dispatch) => {
  dispatch({ type: GET_ALL_LEASES_REQUEST });
  try {
    const response = await axios.get("/lease/all");
    dispatch({ type: GET_ALL_LEASES_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({
      type: GET_ALL_LEASES_FAILURE,
      payload: error.response?.data?.error || error.message,
    });
    Swal.fire("Error", "No se pudieron obtener los contratos", "error");
  }
};

export const getLeasesByIdClient = (idClient) => async (dispatch) => {
  dispatch({ type: GET_LEASES_BY_CLIENT_REQUEST });
  try {
    const response = await axios.get(`/lease/client/${idClient}`);
    dispatch({
      type: GET_LEASES_BY_CLIENT_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: GET_LEASES_BY_CLIENT_FAILURE,
      payload: error.response?.data?.error || error.message,
    });
  }
};

export const updateLease = (leaseId, updateData) => async (dispatch) => {
  try {
    dispatch({ type: 'UPDATE_LEASE_REQUEST' });
    
    const response = await axios.put(`/lease/${leaseId}`, updateData);
    
    dispatch({
      type: 'UPDATE_LEASE_SUCCESS',
      payload: response.data.data,
    });
    
    // Refrescar la lista de contratos
    dispatch(getAllLeases());
    
    return response.data;
  } catch (error) {
    dispatch({
      type: 'UPDATE_LEASE_FAILURE',
      payload: error.response?.data?.error || error.message,
    });
    throw error;
  }
};

export const getAllPayments = () => async (dispatch) => {
  dispatch({ type: GET_ALL_PAYMENTS_REQUEST });
  try {
    const response = await axios.get("/payment");
    dispatch({
      type: GET_ALL_PAYMENTS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: GET_ALL_PAYMENTS_FAILURE,
      payload: error.response?.data?.error || error.message,
    });
  }
};

export const createGarantorsForLease =
  (leaseId, guarantors) => async (dispatch) => {
    try {
      dispatch({ type: CREATE_GUARANTORS_REQUEST });

      const { data } = await axios.post(`/garantor/${leaseId}`, { guarantors });

      dispatch({
        type: CREATE_GUARANTORS_SUCCESS,
        payload: data,
      });

      return data; // Return the data so it's available in the component
    } catch (error) {
      dispatch({
        type: CREATE_GUARANTORS_FAIL,
        payload:
          error.response && error.response.data.error
            ? error.response.data.error
            : error.message,
      });
      throw error; // Throw the error to handle it in the component
    }
  };

export const getGarantorsByLeaseId = (leaseId) => async (dispatch) => {
  dispatch({ type: GET_GUARANTORS_REQUEST });
  try {
    const { data } = await axios.get(`/lease/${leaseId}/garantors`);
    dispatch({
      type: GET_GUARANTORS_SUCCESS,
      payload: data.guarantors, // suponer que la respuesta tiene { guarantors: [...] }
    });
  } catch (error) {
    dispatch({
      type: GET_GUARANTORS_FAIL,
      payload:
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message,
    });
  }
};

// Acción para obtener un contrato por leaseId
export const getLeaseById = (leaseId) => async (dispatch) => {
  try {
    dispatch({ type: GET_LEASE_REQUEST });
    const { data } = await axios.get(`/lease/${leaseId}`);
    dispatch({ type: GET_LEASE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: GET_LEASE_FAILURE,
      payload: error.response?.data?.message || "Error al obtener el contrato",
    });
  }
};

export const updateLeaseRentAmount =
  (leaseId, newRentAmount, updateDate, pdfData, fileName) =>
  async (dispatch) => {
    try {
      dispatch({ type: UPDATE_LEASE_RENT_REQUEST });

      const response = await axios.put(`/lease/leases/${leaseId}/rent`, {
        newRentAmount,
        updateDate,
        pdfData,
        fileName,
      });

      dispatch({
        type: UPDATE_LEASE_RENT_SUCCESS,
        payload: response.data, // Datos del contrato actualizado
      });

      Swal.fire(
        "Éxito",
        "El monto del alquiler se actualizó correctamente.",
        "success"
      );
    } catch (error) {
      dispatch({
        type: UPDATE_LEASE_RENT_FAILURE,
        payload:
          error.response?.data?.message ||
          "Error al actualizar el monto del alquiler",
      });

      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "No se pudo actualizar el monto del alquiler.",
        "error"
      );
    }
  };

export const getLeasesPendingUpdate = () => async (dispatch) => {
  try {
    dispatch({ type: GET_PENDING_UPDATES_REQUEST });

    const response = await axios.get("/lease/pending-updates", {
      timeout: 5000 // 5 segundos timeout
    });

    // 🔧 Validar que la respuesta sea un array
    const pendingLeases = Array.isArray(response.data) ? response.data : [];

    dispatch({
      type: GET_PENDING_UPDATES_SUCCESS,
      payload: pendingLeases,
    });

    return pendingLeases;
  } catch (error) {
    console.warn('Error obteniendo contratos pendientes:', error.response?.status);
    
    // 🔧 Si el endpoint no existe, devolver array vacío
    if (error.response?.status === 404 || error.response?.status === 500) {
      const emptyArray = [];
      
      dispatch({
        type: GET_PENDING_UPDATES_SUCCESS,
        payload: emptyArray,
      });
      
      return emptyArray;
    }

    dispatch({
      type: GET_PENDING_UPDATES_FAILURE,
      payload: error.response?.data?.message || "Error al obtener contratos pendientes",
    });

    // 🔧 Solo mostrar error si no es problema conocido del backend
    if (error.response?.status !== 404 && error.response?.status !== 500) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudieron obtener los contratos pendientes.",
        "error"
      );
    }
    
    return [];
  }
};

// 🆕 Acción para obtener historial de actualizaciones de un contrato
export const getLeaseUpdateHistory = (leaseId) => async (dispatch) => {
  try {
    dispatch({ type: GET_LEASE_HISTORY_REQUEST });

    const response = await axios.get(`/lease/${leaseId}/update-history`);

    dispatch({
      type: GET_LEASE_HISTORY_SUCCESS,
      payload: { leaseId, history: response.data },
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_LEASE_HISTORY_FAILURE,
      payload:
        error.response?.data?.message ||
        "Error al obtener historial de actualizaciones",
    });

    Swal.fire(
      "Error",
      error.response?.data?.message || "No se pudo obtener el historial.",
      "error"
    );
  }
};

// 🆕 Acción para actualización rápida con porcentaje predeterminado
export const quickUpdateLeaseRent =
  (leaseId, percentage, reason) => async (dispatch) => {
    try {
      dispatch({ type: QUICK_UPDATE_LEASE_REQUEST });

      const response = await axios.put(`/lease/${leaseId}/quick-update`, {
        percentage,
        reason,
        updateDate: new Date().toISOString(),
      });

      dispatch({
        type: QUICK_UPDATE_LEASE_SUCCESS,
        payload: response.data,
      });

      Swal.fire(
        "Éxito",
        `Alquiler actualizado con ${percentage}% de aumento.`,
        "success"
      );

      return response.data;
    } catch (error) {
      dispatch({
        type: QUICK_UPDATE_LEASE_FAILURE,
        payload:
          error.response?.data?.message || "Error en actualización rápida",
      });

      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "No se pudo realizar la actualización rápida.",
        "error"
      );
    }
  };

// 🆕 Acción para actualización masiva de múltiples contratos
export const bulkUpdateLeases = (contractsData) => async (dispatch) => {
  try {
    dispatch({ type: BULK_UPDATE_LEASES_REQUEST });

    const response = await axios.post("/lease/bulk-update", {
      contracts: contractsData,
    });

    dispatch({
      type: BULK_UPDATE_LEASES_SUCCESS,
      payload: response.data,
    });

    const { successful, failed } = response.data;

    if (failed.length === 0) {
      Swal.fire(
        "Éxito",
        `${successful.length} contratos actualizados correctamente.`,
        "success"
      );
    } else {
      Swal.fire({
        title: "Actualización Parcial",
        html: `
          <p><strong>Exitosos:</strong> ${successful.length}</p>
          <p><strong>Fallidos:</strong> ${failed.length}</p>
        `,
        icon: "warning",
      });
    }

    return response.data;
  } catch (error) {
    dispatch({
      type: BULK_UPDATE_LEASES_FAILURE,
      payload: error.response?.data?.message || "Error en actualización masiva",
    });

    Swal.fire(
      "Error",
      error.response?.data?.message ||
        "No se pudo realizar la actualización masiva.",
      "error"
    );
  }
};

// 🆕 Acción para obtener estadísticas de actualizaciones
export const getUpdateStatistics = () => async (dispatch) => {
  try {
    dispatch({ type: GET_UPDATE_STATS_REQUEST });

    // 🔧 Agregar timeout y mejor manejo de errores
    const response = await axios.get("/lease/update-statistics", {
      timeout: 5000 // 5 segundos timeout
    });

    dispatch({
      type: GET_UPDATE_STATS_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    console.warn('Error obteniendo estadísticas:', error.response?.status);
    
    // 🔧 Si el endpoint no existe (404 o 500), devolver datos dummy
    if (error.response?.status === 404 || error.response?.status === 500) {
      const dummyStats = {
        general: {
          totalActiveLeases: 0,
          pendingUpdates: 0,
          totalProperties: 0
        },
        urgency: {
          high: 0,
          medium: 0,
          low: 0
        }
      };
      
      dispatch({
        type: GET_UPDATE_STATS_SUCCESS,
        payload: dummyStats,
      });
      
      return dummyStats;
    }

    dispatch({
      type: GET_UPDATE_STATS_FAILURE,
      payload: error.response?.data?.message || "Error al obtener estadísticas",
    });
    
    // 🔧 No mostrar error visual si es problema de backend
    console.error('Error de estadísticas:', error.message);
    return null;
  }
};

// 🆕 Obtener texto de WhatsApp para una propiedad
export const getWhatsAppText = (propertyId) => async (dispatch) => {
  dispatch({ type: GET_WHATSAPP_TEXT_REQUEST });

  try {
    const response = await axios.get(`/property/${propertyId}/whatsapp`);

    dispatch({
      type: GET_WHATSAPP_TEXT_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Error al generar texto de WhatsApp";
    
    dispatch({
      type: GET_WHATSAPP_TEXT_FAILURE,
      payload: errorMessage,
    });

    Swal.fire({
      icon: "error",
      title: "Error",
      text: errorMessage,
    });

    throw error;
  }
};

// 🆕 Actualizar plantilla de WhatsApp de una propiedad
export const updateWhatsAppTemplate = (propertyId, template) => async (dispatch) => {
  dispatch({ type: UPDATE_WHATSAPP_TEMPLATE_REQUEST });

  try {
    const response = await axios.put(`/property/${propertyId}`, {
      whatsappTemplate: template,
    });

    dispatch({
      type: UPDATE_WHATSAPP_TEMPLATE_SUCCESS,
      payload: response.data,
    });

    Swal.fire({
      icon: "success",
      title: "¡Éxito!",
      text: "Plantilla de WhatsApp actualizada correctamente",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Error al actualizar plantilla de WhatsApp";
    
    dispatch({
      type: UPDATE_WHATSAPP_TEMPLATE_FAILURE,
      payload: errorMessage,
    });

    Swal.fire({
      icon: "error",
      title: "Error",
      text: errorMessage,
    });

    throw error;
  }
};

// 🆕 Actualizar imágenes de una propiedad
export const updatePropertyImages = (propertyId, images) => async (dispatch) => {
  dispatch({ type: UPDATE_PROPERTY_IMAGES_REQUEST });

  try {
    const response = await axios.put(`/property/${propertyId}`, {
      images: images,
    });

    dispatch({
      type: UPDATE_PROPERTY_IMAGES_SUCCESS,
      payload: response.data,
    });

    Swal.fire({
      icon: "success",
      title: "¡Éxito!",
      text: "Imágenes actualizadas correctamente",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Error al actualizar imágenes";
    
    dispatch({
      type: UPDATE_PROPERTY_IMAGES_FAILURE,
      payload: errorMessage,
    });

    Swal.fire({
      icon: "error",
      title: "Error",
      text: errorMessage,
    });

    throw error;
  }
};

// 🆕 Copiar texto de WhatsApp al portapapeles
export const copyWhatsAppToClipboard = (propertyId) => async (dispatch) => {
  try {
    const data = await dispatch(getWhatsAppText(propertyId));

    if (data && data.whatsappText) {
      // Copiar al portapapeles
      await navigator.clipboard.writeText(data.whatsappText);

      Swal.fire({
        icon: "success",
        title: "¡Copiado!",
        text: "Texto de WhatsApp copiado al portapapeles",
        timer: 2000,
        showConfirmButton: false,
      });

      return true;
    }
  } catch (error) {
    console.error("Error al copiar:", error);
    
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo copiar el texto. Intenta nuevamente.",
    });

    return false;
  }
};
