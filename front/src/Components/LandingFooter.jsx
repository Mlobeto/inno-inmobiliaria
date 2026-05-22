import { IoLogoWhatsapp, IoLocationSharp, IoPhonePortraitOutline, IoMailOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';

function LandingFooter() {
  return (
    <footer className="bg-bgSurface border-t border-borderBase text-textSecondary font-Montserrat">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/LOGO.png" alt="GestProp" className="h-7 object-contain brightness-0 invert" />
            </div>
            <p className="text-sm mb-4 leading-relaxed">
              La plataforma completa para gestionar tu inmobiliaria de forma profesional y eficiente.
            </p>
            <div className="flex gap-3">
              <a
                href="https://wa.me/5492355517802"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-muted hover:bg-brand border border-borderBase p-2.5 rounded-lg transition text-brand-light"
                aria-label="WhatsApp"
              >
                <IoLogoWhatsapp className="text-xl" />
              </a>
              <Link
                to="/contacto"
                className="bg-brand-muted hover:bg-brand border border-borderBase p-2.5 rounded-lg transition text-brand-light"
                aria-label="Formulario de contacto"
              >
                <IoMailOutline className="text-xl" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-textPrimary font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/plans" className="hover:text-brand-light transition-colors">
                  Planes y precios
                </Link>
              </li>
              <li>
                <Link to="/registro" className="hover:text-brand-light transition-colors">
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-light transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-brand-light transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-textPrimary font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <IoPhonePortraitOutline className="flex-shrink-0 text-brand-light" />
                <a
                  href="https://wa.me/5492355517802"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-light transition-colors"
                >
                  2355517802
                </a>
              </li>
              <li className="flex items-center gap-2">
                <IoLocationSharp className="flex-shrink-0 text-brand-light" />
                <span>Buenos Aires, Argentina</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-borderBase mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs sm:text-sm text-textMuted">
            © {new Date().getFullYear()} Innoweb. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-xs sm:text-sm">
            <Link to="/terminos" className="hover:text-brand-light transition-colors">
              Términos de servicio
            </Link>
            <Link to="/privacidad" className="hover:text-brand-light transition-colors">
              Política de privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
