import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../Reducer/reducer"; // Mantienes el rootReducer
import toastMiddleware from "../../utils/toastMiddleware"; // Importa el middleware personalizado/

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(toastMiddleware), // Agrega el middleware de toast
});
