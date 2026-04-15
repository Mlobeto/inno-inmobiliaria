import { IoLogoWhatsapp, IoMail, IoLocationSharp } from 'react-icons/io5';
import { Link } from 'react-router-dom';

function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company info */}
          <div>
            <h3 className="text-white text-2xl font-bold mb-4">AdminProp</h3>
            <p className="text-sm mb-4">
              La plataforma completa para gestionar tu inmobiliaria de forma profesional y eficiente.
            </p>
            <div className="flex gap-3">
              <a href="#" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition">
                <IoLogoWhatsapp className="text-xl" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition">
                <IoMail className="text-xl" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#planes" className="hover:text-white transition">Planes y Precios</a></li>
              <li><a href="#caracteristicas" className="hover:text-white transition">Características</a></li>
              <li><Link to="/login" className="hover:text-white transition">Iniciar Sesión</Link></li>
              <li><a href="#" className="hover:text-white transition">Documentación</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-white transition">Tutoriales</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">API Docs</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <IoMail className="flex-shrink-0" />
                <span>contacto@AdminProp.com</span>
              </li>
              <li className="flex items-center gap-2">
                <IoLogoWhatsapp className="flex-shrink-0" />
                <span>+54 9 11 1234-5678</span>
              </li>
              <li className="flex items-center gap-2">
                <IoLocationSharp className="flex-shrink-0" />
                <span>Buenos Aires, Argentina</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © 2026 AdminProp. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition">Términos de Servicio</a>
            <a href="#" className="hover:text-white transition">Política de Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
