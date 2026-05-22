import { Link } from 'react-router-dom';
import {
  IoRocketSharp,
  IoCheckmarkCircle,
  IoArrowForwardOutline,
  IoHomeOutline,
  IoDocumentTextOutline,
  IoLogoWhatsapp,
} from 'react-icons/io5';

const TRUST_ITEMS = [
  'Prueba gratuita 7 días',
  'Sin tarjeta de crédito',
  'Cancelá cuando quieras',
];

const HIGHLIGHTS = [
  { icon: IoHomeOutline, label: 'Propiedades y publicaciones' },
  { icon: IoDocumentTextOutline, label: 'Contratos y PDF automático' },
  { icon: IoLogoWhatsapp, label: 'WhatsApp y leads integrados' },
];

function LandingHero() {
  return (
    <section className="relative bg-gradient-to-br from-bgBase via-bgSurface to-brand-muted text-textPrimary overflow-hidden font-Montserrat">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-brand-light/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-brand-muted/40 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-borderBase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/LOGO.png" alt="GestProp" className="h-7 sm:h-8 object-contain brightness-0 invert" />
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-textSecondary">
            <a href="#funcionalidades" className="hover:text-textPrimary transition-colors">
              Funcionalidades
            </a>
            <Link to="/plans" className="hover:text-textPrimary transition-colors">
              Planes
            </Link>
            <Link to="/contacto" className="hover:text-textPrimary transition-colors">
              Contacto
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/login"
              className="text-xs sm:text-sm text-textSecondary hover:text-textPrimary transition-colors px-2 sm:px-3 py-2"
            >
              Ingresar
            </Link>
            <Link
              to="/registro"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-brand hover:bg-brand-dark text-textWhite px-3 sm:px-4 py-2 rounded-lg transition-colors shadow-brandGlow"
            >
              Empezá gratis
              <IoArrowForwardOutline className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-brand-muted/60 border border-borderBase backdrop-blur-sm px-3 py-1.5 rounded-full mb-5">
              <IoRocketSharp className="text-customYellow w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium text-textSecondary">
                Gestión inmobiliaria en la nube
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              GestProp
            </h1>
            <p className="mt-3 text-xl sm:text-2xl text-brand-light font-semibold leading-snug">
              La plataforma completa para tu inmobiliaria
            </p>
            <p className="mt-4 text-sm sm:text-base text-textSecondary max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Gestioná propiedades, clientes, contratos y cobros desde una sola app. Generá PDFs
              profesionales, publicá en Mercado Libre y atendé consultas sin salir del CRM.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/registro"
                className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-textWhite font-semibold py-3 px-6 rounded-xl transition-colors shadow-brandGlow"
              >
                Crear cuenta gratis
                <IoArrowForwardOutline className="w-4 h-4" />
              </Link>
              <Link
                to="/plans"
                className="inline-flex items-center justify-center gap-2 border border-borderStrong text-textPrimary hover:bg-brand-subtle font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Ver planes y precios
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2">
              {TRUST_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs sm:text-sm text-textSecondary">
                  <IoCheckmarkCircle className="text-brand-light w-4 h-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Panel visual derecho */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="rounded-2xl border border-borderBase bg-bgSurface/80 backdrop-blur-sm p-5 sm:p-6 shadow-brandGlow">
              <p className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-4">
                Todo en un solo lugar
              </p>
              <div className="space-y-3">
                {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-borderBase bg-bgElevated px-4 py-3"
                  >
                    <div className="rounded-lg bg-brand-muted p-2">
                      <Icon className="w-5 h-5 text-brand-light" />
                    </div>
                    <span className="text-sm text-textPrimary">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-brand/30 bg-brand-subtle px-4 py-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-textWhite text-sm font-bold shrink-0">
                  7
                </span>
                <div>
                  <p className="text-sm font-semibold text-textPrimary">Días de prueba gratis</p>
                  <p className="text-xs text-textMuted">Sin tarjeta · Configuración en minutos</p>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 -bottom-4 -right-4 h-full w-full rounded-2xl border border-brand/20 bg-brand/5" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;
