import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const LAST_UPDATED = "Enero 2025";
const COMPANY = "SentaProp";
const CONTACT_EMAIL = "contacto@sentaprop.com";
const WHATSAPP = "https://wa.me/5492355517802";

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Términos y condiciones</h1>
          <p className="text-slate-400 text-sm">Última actualización: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed">

          <Section title="1. Aceptación de los términos">
            <p>
              Al acceder y utilizar la plataforma <strong className="text-white">{COMPANY}</strong>, usted
              acepta quedar vinculado por estos Términos y Condiciones de Uso. Si no está de acuerdo con
              alguna parte de estos términos, no deberá utilizar el servicio.
            </p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>
              {COMPANY} es una plataforma de gestión inmobiliaria SaaS (Software como Servicio) que permite
              a inmobiliarias y profesionales del sector administrar propiedades, clientes, contratos,
              pagos y comunicaciones desde un entorno centralizado.
            </p>
            <p className="mt-3">
              El servicio se presta mediante suscripción mensual o anual según el plan elegido. {COMPANY}
              se reserva el derecho de modificar las características incluidas en cada plan con previo
              aviso a los suscriptores.
            </p>
          </Section>

          <Section title="3. Registro y cuentas">
            <ul className="list-disc list-inside space-y-2">
              <li>Debe proporcionar información veraz y actualizada al crear su cuenta.</li>
              <li>Es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>Notifique de inmediato cualquier uso no autorizado de su cuenta.</li>
              <li>Cada suscripción corresponde a una inmobiliaria o persona jurídica/física independiente.</li>
            </ul>
          </Section>

          <Section title="4. Uso aceptable">
            <p>Usted se compromete a no utilizar la plataforma para:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Cargar datos falsos, fraudulentos o que vulneren derechos de terceros.</li>
              <li>Distribuir malware, spam o contenido ilícito.</li>
              <li>Intentar acceder a datos de otros tenants o usuarios de la plataforma.</li>
              <li>Realizar ingeniería inversa o extraer el código fuente del software.</li>
              <li>Revender o sublicenciar el servicio sin autorización expresa de {COMPANY}.</li>
            </ul>
          </Section>

          <Section title="5. Planes y facturación">
            <p>
              El cobro de la suscripción se realiza de forma mensual o anual según la modalidad elegida.
              Los precios se expresan en pesos argentinos (ARS) e incluyen IVA cuando corresponda.
            </p>
            <p className="mt-3">
              El impago de la suscripción puede resultar en la suspensión del acceso a la plataforma.
              {COMPANY} no emite reembolsos por períodos parciales salvo en los casos previstos por la
              legislación argentina aplicable.
            </p>
          </Section>

          <Section title="6. Datos y privacidad">
            <p>
              Los datos cargados en la plataforma (clientes, propiedades, contratos, etc.) son de su
              propiedad exclusiva. {COMPANY} actúa como encargado del tratamiento de datos conforme a la
              <strong className="text-white"> Ley 25.326 de Protección de Datos Personales</strong> de la
              República Argentina.
            </p>
            <p className="mt-3">
              Consulte nuestra{" "}
              <Link to="/privacidad" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                Política de Privacidad
              </Link>{" "}
              para conocer en detalle cómo tratamos sus datos.
            </p>
          </Section>

          <Section title="7. Propiedad intelectual">
            <p>
              Todo el software, diseño, marca, logotipos y contenido de {COMPANY} son propiedad exclusiva
              de sus desarrolladores y están protegidos por las leyes de propiedad intelectual vigentes.
              La suscripción otorga una licencia de uso limitada, no exclusiva e intransferible.
            </p>
          </Section>

          <Section title="8. Disponibilidad del servicio">
            <p>
              {COMPANY} procura mantener una disponibilidad del servicio del 99,5% mensual. Sin embargo,
              pueden producirse interrupciones por mantenimiento programado, actualizaciones o causas de
              fuerza mayor. Estas interrupciones no darán lugar a indemnización alguna.
            </p>
          </Section>

          <Section title="9. Limitación de responsabilidad">
            <p>
              {COMPANY} no será responsable por daños indirectos, incidentales o consecuentes derivados
              del uso o la imposibilidad de uso del servicio. La responsabilidad máxima de {COMPANY}
              ante el usuario no superará el importe abonado en el último mes de suscripción.
            </p>
          </Section>

          <Section title="10. Modificaciones">
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Le notificaremos
              los cambios relevantes con al menos 15 días de anticipación mediante el email registrado.
              El uso continuado del servicio tras la notificación implica la aceptación de los nuevos términos.
            </p>
          </Section>

          <Section title="11. Terminación">
            <p>
              Puede cancelar su suscripción en cualquier momento desde el panel de administración.
              {COMPANY} puede suspender o terminar su acceso ante violaciones graves a estos términos,
              previo aviso cuando las circunstancias lo permitan.
            </p>
          </Section>

          <Section title="12. Ley aplicable y jurisdicción">
            <p>
              Estos términos se rigen por las leyes de la República Argentina. Para cualquier disputa,
              las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Provincia de
              Buenos Aires.
            </p>
          </Section>

          <Section title="13. Contacto">
            <p>
              Para consultas sobre estos términos, puede comunicarse con nosotros por:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                {CONTACT_EMAIL}
              </a>
              {" "}o por{" "}
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                WhatsApp
              </a>.
            </p>
          </Section>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800 text-center text-sm text-slate-500">
        <p>
          <Link to="/" className="hover:text-slate-300 transition-colors">Inicio</Link>
          <span className="mx-2">·</span>
          <Link to="/privacidad" className="hover:text-slate-300 transition-colors">Política de privacidad</Link>
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
