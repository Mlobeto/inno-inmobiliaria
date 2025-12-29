import ReactDOM from "react-dom/client";
import App from "./App";
import  {BrowserRouter}  from 'react-router-dom';
import "./index.css";
import axios from "axios";
import { store } from "./redux/Store/store";
import { Provider } from "react-redux";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//axios.defaults.baseURL = "http://localhost:3001";
axios.defaults.baseURL = "https://qlinmobiliaria.onrender.com";

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Error al registrar Service Worker:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
  <ToastContainer
      position="top-right" 
      autoClose={4000} 
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored" 
      style={{ fontSize: "1.1rem", width: "350px" }} 
    />
   <BrowserRouter>
      <App />  
    </BrowserRouter>
  </Provider>
);