import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const LAST_UPDATED = "Enero 2025";
const COMPANY = "GestProp";
const CONTACT_EMAIL = "contacto@GestProp.com";
const WHATSAPP = "https://wa.me/5492355517802";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-9 h-9">
            <div className="w-7 h-1 bg-indigo-500 rounded mb-1" />
            <div className="w-5 h-1 bg-indigo-400 rounded mb-1" />
            <div className="w-3 h-1 bg-indigo-300 rounded" />
          </div>
          <span className="text-white font-semibold text-lg">{COMPANY}</span>
        </Link>
        <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">
          Iniciar sesión
        </Link>
      </nav>

      {/* Contenido */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Política de privacidad</h1>
          <p className="text-slate-400 text-sm">Última actualización: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed">

          <Section title="1. Introducción">
            <p>
              En <strong className="text-white">{COMPANY}</strong> respetamos su privacidad y nos
              comprometemos a proteger los datos personales que usted nos confía. Esta Política de
              Privacidad describe qué datos recopilamos, cómo los usamos y cuáles son sus derechos,
              de conformidad con la{" "}
              <strong className="text-white">Ley 25.326 de Protección de Datos Personales</strong>{" "}
              de la República Argentina.
            </p>
          </Section>

          <Section title="2. Responsable del tratamiento">
            <p>
              El responsable del tratamiento de sus datos es la plataforma <strong className="text-white">{COMPANY}</strong>,
              con domicilio en la Provincia de Buenos Aires, República Argentina. Para contactarnos puede
              escribirnos a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </Section>

          <Section title="3. Datos que recopilamos">
            <p className="mb-3">Recopilamos los siguientes tipos de datos:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Datos de cuenta:</strong> nombre, email, contraseña (encriptada), nombre de la inmobiliaria.</li>
              <li><strong className="text-white">Datos de uso:</strong> dirección IP, navegador, páginas visitadas dentro de la plataforma, fecha y hora de acceso.</li>
              <li><strong className="text-white">Datos de negocio:</strong> información de propiedades, clientes, contratos y pagos que usted carga voluntariamente.</li>
              <li><strong className="text-white">Datos de pago:</strong> los pagos son procesados por MercadoPago. No almacenamos datos de tarjetas de crédito ni débito.</li>
            </ul>
          </Section>

          <Section title="4. Finalidad del tratamiento">
            <p className="mb-3">Utilizamos sus datos para:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Prestar y mejorar el servicio de gestión inmobiliaria.</li>
              <li>Procesar pagos y gestionar su suscripción.</li>
              <li>Enviar notificaciones transaccionales (confirmaciones, alertas de contratos).</li>
              <li>Responder consultas de soporte técnico.</li>
              <li>Cumplir con obligaciones legales.</li>
              <li>Enviar comunicaciones sobre actualizaciones del servicio (puede darse de baja en cualquier momento).</li>
            </ul>
          </Section>

          <Section title="5. Base legal del tratamiento">
            <p>
              El tratamiento de sus datos se sustenta en: (a) la ejecución del contrato de servicio
              (suscripción), (b) su consentimiento explícito para comunicaciones de marketing, y
              (c) cumplimiento de obligaciones legales.
            </p>
          </Section>

          <Section title="6. Compartición de datos con terceros">
            <p className="mb-3">
              No vendemos ni cedemos sus datos personales a terceros. Únicamente compartimos datos
              con proveedores de servicios estrictamente necesarios:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Microsoft Azure:</strong> infraestructura cloud donde se aloja la plataforma (servidores en la región de Argentina/Brasil).</li>
              <li><strong className="text-white">MercadoPago:</strong> procesamiento de pagos.</li>
              <li><strong className="text-white">Azure Communication Services:</strong> envío de emails transaccionales.</li>
            </ul>
            <p className="mt-3">
              Todos los proveedores están sujetos a contratos de confidencialidad y cumplen con
              estándares internacionales de seguridad.
            </p>
          </Section>

          <Section title="7. Transferencias internacionales">
            <p>
              Algunos de nuestros proveedores de infraestructura pueden procesar datos fuera de
              Argentina. En esos casos, nos aseguramos de que existan garantías adecuadas (como las
              cláusulas contractuales estándar de la Unión Europea o certificaciones equivalentes).
            </p>
          </Section>

          <Section title="8. Seguridad de los datos">
            <p>
              Implementamos medidas técnicas y organizativas para proteger sus datos:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Cifrado en tránsito (HTTPS/TLS).</li>
              <li>Cifrado de contraseñas con algoritmos de hash seguros (bcrypt).</li>
              <li>Acceso restringido por roles y autenticación con JWT.</li>
              <li>Backups regulares de la base de datos.</li>
              <li>Monitoreo continuo de infraestructura en Azure.</li>
            </ul>
          </Section>

          <Section title="9. Retención de datos">
            <p>
              Conservamos sus datos mientras mantenga una suscripción activa. Tras la cancelación,
              los datos se retienen por 30 días para permitir la reactivación. Luego son eliminados
              de forma segura, salvo obligación legal que exija conservarlos por mayor tiempo.
            </p>
          </Section>

          <Section title="10. Sus derechos">
            <p className="mb-3">
              Conforme a la Ley 25.326, usted tiene los siguientes derechos sobre sus datos:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Acceso:</strong> solicitar qué datos tenemos sobre usted.</li>
              <li><strong className="text-white">Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong className="text-white">Supresión:</strong> solicitar la eliminación de sus datos.</li>
              <li><strong className="text-white">Oposición:</strong> oponerse al tratamiento en determinadas circunstancias.</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, contáctenos en{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                {CONTACT_EMAIL}
              </a>. Responderemos en un plazo máximo de 30 días hábiles.
            </p>
          </Section>

          <Section title="11. Cookies">
            <p>
              Utilizamos cookies de sesión estrictamente necesarias para el funcionamiento del panel
              de administración (autenticación). No utilizamos cookies de rastreo de terceros ni
              publicidad comportamental.
            </p>
          </Section>

          <Section title="12. Cambios en esta política">
            <p>
              Podemos actualizar esta política periódicamente. Le notificaremos cambios significativos
              por email con al menos 15 días de anticipación. La versión vigente siempre estará
              disponible en esta página.
            </p>
          </Section>

          <Section title="13. Contacto y reclamos">
            <p>
              Para consultas, solicitudes o reclamos relacionados con el tratamiento de sus datos
              personales, puede contactarnos por{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                {CONTACT_EMAIL}
              </a>{" "}
              o por{" "}
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                WhatsApp
              </a>.
              También puede presentar una denuncia ante la{" "}
              <strong className="text-white">Agencia de Acceso a la Información Pública (AAIP)</strong>,
              organismo de control en Argentina.
            </p>
          </Section>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800 text-center text-sm text-slate-500">
        <p>
          <Link to="/" className="hover:text-slate-300 transition-colors">Inicio</Link>
          <span className="mx-2">·</span>
          <Link to="/terminos" className="hover:text-slate-300 transition-colors">Términos y condiciones</Link>
          <span className="mx-2">·</span>
          <Link to="/contacto" className="hover:text-slate-300 transition-colors">Contacto</Link>
        </p>
      </footer>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      {children}
    </section>
  );
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
