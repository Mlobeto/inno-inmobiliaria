import { IoLogoWhatsapp, IoLocationSharp, IoPhonePortraitOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';

function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company info */}
          <div>
            <h3 className="text-white text-2xl font-bold mb-4">GestProp</h3>
            <p className="text-sm mb-4">
              La plataforma completa para gestionar tu inmobiliaria de forma profesional y eficiente.
            </p>
            <div className="flex gap-3">
              <a
                href="https://wa.me/5492355517802"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-green-600/60 p-2 rounded-lg transition"
                aria-label="WhatsApp"
              >
                <IoLogoWhatsapp className="text-xl" />
              </a>
              <Link
                to="/contacto"
                className="bg-white/10 hover:bg-indigo-600/60 p-2 rounded-lg transition"
                aria-label="Formulario de contacto"
              >
                ✉
              </Link>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/plans" className="hover:text-white transition">Planes y Precios</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Iniciar Sesión</Link></li>
              <li><Link to="/contacto" className="hover:text-white transition">Contacto</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <IoPhonePortraitOutline className="flex-shrink-0" />
                <a href="https://wa.me/5492355517802" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  2355517802
                </a>
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
            © {new Date().getFullYear()} GestProp. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/terminos" className="hover:text-white transition">Términos de Servicio</Link>
            <Link to="/privacidad" className="hover:text-white transition">Política de Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
