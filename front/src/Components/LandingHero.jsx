import { Link } from 'react-router-dom';
import Logo from './Logo';
import {
  IoCheckmarkCircle,
  IoArrowForwardOutline,
  IoHomeOutline,
  IoDocumentTextOutline,
  IoLogoWhatsapp,
  IoStorefrontOutline,
} from 'react-icons/io5';

const TRUST_ITEMS = ['7 días gratis', 'Sin tarjeta', 'Cancelá cuando quieras'];

const PILLARS = [
  { icon: IoHomeOutline, title: 'Propiedades', desc: 'Fotos, estados y publicación' },
  { icon: IoDocumentTextOutline, title: 'Contratos', desc: 'PDF automático y plantillas' },
  { icon: IoLogoWhatsapp, title: 'WhatsApp', desc: 'Respuestas y requisitos' },
  { icon: IoStorefrontOutline, title: 'Mercado Libre', desc: 'Publicar y recibir leads' },
];

function LandingNav() {
  return (
    <nav className="shrink-0 border-b border-borderBase bg-[#0B0E0C]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <Logo color="#5A8C72" size={36} />
          <span className="text-textPrimary font-bold text-base sm:text-lg tracking-tight">GestProp</span>
        </Link>
        <div className="hidden md:flex items-center gap-5 text-sm text-textSecondary">
          <a href="#funcionalidades" className="hover:text-brand-light transition-colors">
            Funcionalidades
          </a>
          <a href="#planes" className="hover:text-brand-light transition-colors">
            Configurá tu plan
          </a>
          <Link to="/contacto" className="hover:text-brand-light transition-colors">
            Contacto
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/login"
            className="hidden sm:inline text-xs sm:text-sm text-textSecondary hover:text-textPrimary px-2 py-1.5 transition-colors"
          >
            Ingresar
          </Link>
          <Link
            to="/registro"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold bg-brand hover:bg-brand-dark text-textWhite px-3 py-2 rounded-lg transition-colors"
          >
            Empezá gratis
            <IoArrowForwardOutline className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function LandingHero() {
  return (
    <header className="relative font-Montserrat text-textPrimary overflow-hidden bg-[#0B0E0C]">
      {/* Glow sage — sin violeta */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(90,140,114,0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 100% 50%, rgba(61,107,88,0.12) 0%, transparent 50%)',
        }}
      />

      <LandingNav />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-borderBase bg-brand-subtle/80 px-3 py-1 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-light animate-pulse" />
            <span className="text-xs sm:text-sm text-textSecondary">
              Software inmobiliario · Argentina
            </span>
          </div>

          <div className="flex justify-center mb-5">
            <Logo color="#7FB99A" size={72} />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-textPrimary">
            Gestioná tu inmobiliaria{' '}
            <span className="text-brand-light">en un solo lugar</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-textSecondary max-w-2xl mx-auto leading-relaxed">
            Propiedades, clientes, contratos, cobros, Mercado Libre y facturación AFIP.
            Todo conectado en una plataforma pensada para inmobiliarias argentinas.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/registro"
              className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-textWhite font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-brandGlow"
            >
              Crear cuenta gratis
              <IoArrowForwardOutline className="w-4 h-4" />
            </Link>
            <a
              href="#planes"
              className="inline-flex items-center justify-center gap-2 border border-borderStrong text-textPrimary hover:bg-brand-subtle hover:border-brand-light font-semibold py-2.5 px-6 rounded-xl transition-colors"
            >
              Configurá tu plan
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-xs sm:text-sm text-textSecondary">
                <IoCheckmarkCircle className="w-4 h-4 text-brand-light shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Pilares — grid compacto */}
        <div className="mt-10 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {PILLARS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-borderBase bg-[#111714] p-3 sm:p-4 text-left hover:border-borderStrong transition-colors"
            >
              <div className="inline-flex rounded-lg bg-brand-muted p-2 mb-2">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-light" />
              </div>
              <p className="text-sm font-semibold text-textPrimary">{title}</p>
              <p className="text-[11px] sm:text-xs text-textMuted mt-0.5 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

export { LandingNav };
export default LandingHero;
