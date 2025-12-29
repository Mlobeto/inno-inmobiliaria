import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const errorMessages = {
  LOGIN_FAIL: "Usuario o contraseña incorrectos.",
  REGISTER_FAIL: "No se pudo registrar el administrador.",
  CREATE_CLIENT_FAILURE: "No se pudo crear el cliente. Verifica los datos ingresados.",
  UPDATE_CLIENT_FAILURE: "No se pudo actualizar el cliente.",
  DELETE_CLIENT_FAILURE: "No se pudo eliminar el cliente.",
  CREATE_PROPERTY_FAILURE: "No se pudo crear la propiedad.",
  UPDATE_PROPERTY_FAILURE: "No se pudo actualizar la propiedad.",
  DELETE_PROPERTY_FAILURE: "No se pudo eliminar la propiedad.",
  CREATE_LEASE_FAILURE: "No se pudo crear el contrato.",
  CREATE_PAYMENT_FAILURE: "No se pudo registrar el pago.",
  // Agrega más según tus acciones
};

const toastMiddleware = () => (next) => (action) => {
  if (action.type.endsWith("_FAILURE") || action.type.endsWith("_FAIL")) {
    const customMsg = errorMessages[action.type];
    // Si el payload es un array de errores, muestra cada uno
    if (Array.isArray(action.payload)) {
      action.payload.forEach(msg => toast.error(msg));
    } else {
      toast.error(customMsg || action.payload || "Ocurrió un error inesperado");
    }
  }

  if (action.type.endsWith("_SUCCESS")) {
    // Puedes personalizar los mensajes de éxito aquí si lo deseas
    // Ejemplo:
    // if (action.type === "CREATE_CLIENT_SUCCESS") toast.success("Cliente creado correctamente");
  }

  return next(action);
};

export default toastMiddleware;