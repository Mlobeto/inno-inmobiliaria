import { Link } from 'react-router-dom';
import { IoRocketSharp, IoCheckmarkCircle } from 'react-icons/io5';

function LandingHero() {
  return (
    <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <IoRocketSharp className="text-yellow-300" />
            <span className="text-sm font-medium">Gestión Inmobiliaria en la Nube</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            SentaProp
          </h1>
          <p className="text-2xl md:text-3xl mb-4 text-indigo-100">
            La Plataforma Completa para tu Inmobiliaria
          </p>
          <p className="text-lg md:text-xl mb-10 text-gray-300 max-w-3xl mx-auto">
            Gestiona propiedades, clientes, contratos y pagos desde una sola aplicación. 
            Genera documentos profesionales, envía WhatsApp automáticamente y lleva el control total de tu negocio.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/plans" className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg shadow-lg transition transform hover:scale-105">
              Ver Planes y Precios
            </Link>
            <Link to="/login" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-indigo-900 font-bold py-4 px-8 rounded-lg transition">
              Iniciar Sesión
            </Link>
          </div>

          {/* Features quick list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <IoCheckmarkCircle className="text-green-400 text-2xl flex-shrink-0" />
              <span className="text-left">Prueba gratuita 7 días</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <IoCheckmarkCircle className="text-green-400 text-2xl flex-shrink-0" />
              <span className="text-left">Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <IoCheckmarkCircle className="text-green-400 text-2xl flex-shrink-0" />
              <span className="text-left">Cancela cuando quieras</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;
