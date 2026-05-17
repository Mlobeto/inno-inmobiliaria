-- Migration: Contract Clause Library
-- Tabla de cláusulas reutilizables para plantillas de contratos
-- tenantId NULL = cláusula del sistema (disponible para todos los tenants)

CREATE TABLE IF NOT EXISTS "ContractClauses" (
  "id"            SERIAL PRIMARY KEY,
  "tenantId"      INT REFERENCES tenants("tenantId") ON DELETE CASCADE,  -- NULL = sistema
  "title"         VARCHAR(255) NOT NULL,
  "content"       TEXT NOT NULL,
  "category"      VARCHAR(50)  NOT NULL DEFAULT 'general',
  "contractTypes" TEXT[]       NOT NULL DEFAULT ARRAY['CONTRATO_ALQUILER'],
  "isSystem"      BOOLEAN      NOT NULL DEFAULT FALSE,
  "sortOrder"     INT          NOT NULL DEFAULT 0,
  "isActive"      BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_clauses_tenant"   ON "ContractClauses"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_clauses_category" ON "ContractClauses"("category");
CREATE INDEX IF NOT EXISTS "idx_clauses_system"   ON "ContractClauses"("isSystem");

-- ─────────────────────────────────────────────────────────────────────────────
-- Cláusulas del sistema (Ley 27.551 - Argentina)
-- Usadas como base para contratos de locación residencial
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO "ContractClauses" ("tenantId","title","content","category","contractTypes","isSystem","sortOrder") VALUES

-- OBLIGATORIAS
(NULL, 'Objeto del Contrato',
'<p><strong>PRIMERA: OBJETO.</strong> La parte locadora cede en locación a la parte locataria, y esta acepta en tal carácter, el inmueble sito en <strong>{{propiedad.direccion}}</strong>, de la ciudad de <strong>{{propiedad.ciudad}}</strong>, Provincia de <strong>{{propiedad.provincia}}</strong>. El inmueble cuenta con {{propiedad.habitaciones}} ambientes, superficie cubierta: {{propiedad.superficieCubierta}} mts., superficie total: {{propiedad.superficieTotal}} mts.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER','CONTRATO_ALQUILER_TEMPORARIO'], TRUE, 10),

(NULL, 'Destino del Inmueble',
'<p><strong>SEGUNDA: DESTINO.</strong> El inmueble referido en la cláusula anterior será destinado exclusivamente para uso de vivienda particular del locatario y su grupo familiar, quedando expresamente prohibido darle otro destino sin previa autorización escrita del locador.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER'], TRUE, 20),

(NULL, 'Destino Comercial',
'<p><strong>SEGUNDA: DESTINO.</strong> El inmueble referido en la cláusula anterior será destinado exclusivamente para el desarrollo de actividades comerciales/profesionales, quedando expresamente prohibido darle otro destino sin previa autorización escrita del locador.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER'], TRUE, 21),

(NULL, 'Plazo del Contrato',
'<p><strong>TERCERA: PLAZO.</strong> El plazo del presente contrato es de <strong>{{contrato.plazoMeses}} meses</strong>, comenzando el día <strong>{{contrato.fechaInicio}}</strong> y finalizando el día <strong>{{contrato.fechaFin}}</strong>, fecha en la cual el locatario deberá restituir el inmueble libre de ocupantes y en el mismo estado en que lo recibió, sin necesidad de notificación previa.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER','CONTRATO_ALQUILER_TEMPORARIO'], TRUE, 30),

(NULL, 'Precio y Forma de Pago',
'<p><strong>CUARTA: PRECIO Y FORMA DE PAGO.</strong> El precio mensual de la locación se fija en la suma de <strong>$ {{contrato.montoMensual}}</strong> (pesos). El pago deberá efectuarse del 1 al 5 de cada mes en el domicilio del locador, o mediante transferencia bancaria a la cuenta que indique el locador. El atraso en el pago generará un interés punitorio equivalente al doble de la tasa activa del Banco de la Nación Argentina.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER','CONTRATO_ALQUILER_TEMPORARIO'], TRUE, 40),

(NULL, 'Actualización del Precio (ICL)',
'<p><strong>QUINTA: ACTUALIZACIÓN DEL PRECIO.</strong> Conforme lo establecido por la Ley 27.551, el precio de la locación se actualizará anualmente tomando como base el Índice para Contratos de Locación (ICL) que publica el Banco Central de la República Argentina, el cual pondera partes iguales las variaciones mensuales del Índice de Precios al Consumidor (IPC) y la Remuneración Imponible Promedio de los Trabajadores Estables (RIPTE).</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER'], TRUE, 50),

(NULL, 'Gastos y Expensas',
'<p><strong>SEXTA: GASTOS Y EXPENSAS.</strong> Los servicios de luz, gas, agua, teléfono y demás servicios de consumo, así como las expensas ordinarias del inmueble, estarán a cargo exclusivo del locatario desde la fecha de inicio del contrato. Las expensas extraordinarias que tengan por objeto innovaciones o mejoras necesarias serán a cargo del locador.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER','CONTRATO_ALQUILER_TEMPORARIO'], TRUE, 60),

(NULL, 'Estado del Inmueble e Inventario',
'<p><strong>SÉPTIMA: ESTADO E INVENTARIO.</strong> El locatario declara haber recibido el inmueble en perfecto estado de conservación y con los servicios en funcionamiento, comprometiéndose a devolver en idénticas condiciones al finalizar el contrato. Inventario: {{contrato.inventario}}.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER','CONTRATO_ALQUILER_TEMPORARIO'], TRUE, 70),

(NULL, 'Garantía — Garante Personal',
'<p><strong>OCTAVA: GARANTÍA.</strong> En garantía del cumplimiento de todas las obligaciones emergentes del presente contrato, el locatario presenta como garante/s a {{garante1.nombre}}, CUIL {{garante1.cuil}}, con domicilio en {{garante1.domicilio}}, quien acredita solvencia mediante {{garante1.descripcion}}, y se constituye en fiador solidario, liso y llano pagador, con renuncia a los beneficios de división y excusión, respondiendo con todos sus bienes presentes y futuros.</p>',
'garantia', ARRAY['CONTRATO_ALQUILER'], TRUE, 80),

(NULL, 'Garantía — Seguro de Caución',
'<p><strong>OCTAVA: GARANTÍA.</strong> En garantía del cumplimiento de las obligaciones del presente contrato, el locatario presenta seguro de caución contratado con la compañía <strong>{{contrato.seguroCaucionCompania}}</strong>, póliza N° {{contrato.seguroCaucionPoliza}}, con vigencia {{contrato.seguroCaucionVigencia}}.</p>',
'garantia', ARRAY['CONTRATO_ALQUILER'], TRUE, 81),

(NULL, 'Prohibición de Cesión y Sublocación',
'<p><strong>NOVENA: PROHIBICIONES.</strong> Queda expresamente prohibido al locatario sublocar, ceder o transferir total o parcialmente el contrato o el uso del inmueble sin la previa autorización escrita del locador. La violación de esta cláusula habilitará al locador a resolver el contrato de pleno derecho.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER'], TRUE, 90),

(NULL, 'Conservación y Mejoras',
'<p><strong>DÉCIMA: CONSERVACIÓN Y MEJORAS.</strong> El locatario se obliga a conservar el inmueble en buen estado y a realizar a su exclusivo cargo las reparaciones locativas. Toda mejora o innovación que el locatario desee introducir requerirá autorización escrita previa del locador, quedando las mejoras en beneficio del inmueble sin derecho a indemnización ni compensación alguna.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER'], TRUE, 100),

(NULL, 'Rescisión Anticipada',
'<p><strong>UNDÉCIMA: RESCISIÓN ANTICIPADA.</strong> Conforme al Art. 1221 de la Ley 27.551, el locatario podrá resolver anticipadamente el contrato debiendo notificar en forma fehaciente al locador con una antelación mínima de tres (3) meses. Si la rescisión se produce antes de los seis (6) meses, corresponderá una indemnización equivalente a un mes y medio (1,5) de alquiler. Si es después de los seis (6) meses, la indemnización será de un (1) mes de alquiler.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER'], TRUE, 110),

(NULL, 'Domicilios y Notificaciones',
'<p><strong>DUODÉCIMA: DOMICILIOS.</strong> A todos los efectos legales emergentes del presente contrato, las partes constituyen domicilio especial: <br>LOCADOR: {{propietario.domicilio}}, {{propietario.ciudad}}.<br>LOCATARIO: {{inquilino.domicilio}}, {{inquilino.ciudad}}.<br>INMOBILIARIA: {{empresa.direccion}}. Toda notificación deberá cursarse a los domicilios indicados.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER','CONTRATO_ALQUILER_TEMPORARIO'], TRUE, 120),

-- OPCIONALES
(NULL, 'Mascotas — Permitidas',
'<p><strong>CLÁUSULA ADICIONAL — MASCOTAS.</strong> Las partes acuerdan que el locatario podrá tener mascotas de compañía en el inmueble, siendo responsable de cualquier daño que éstas ocasionen, debiendo restituir el inmueble sin rastros de su presencia al finalizar el contrato.</p>',
'opcional', ARRAY['CONTRATO_ALQUILER'], TRUE, 200),

(NULL, 'Mascotas — Prohibidas',
'<p><strong>CLÁUSULA ADICIONAL — MASCOTAS.</strong> Queda expresamente prohibido al locatario tener mascotas de cualquier tipo en el inmueble. La violación de esta cláusula faculta al locador a resolver el contrato.</p>',
'opcional', ARRAY['CONTRATO_ALQUILER'], TRUE, 201),

(NULL, 'Pintura y Terminaciones',
'<p><strong>CLÁUSULA ADICIONAL — PINTURA.</strong> Al finalizar el contrato, el locatario deberá entregar el inmueble con la pintura interior en buen estado. En caso contrario, el costo de la pintura será descontado del depósito de garantía o deberá ser abonado por el locatario.</p>',
'opcional', ARRAY['CONTRATO_ALQUILER'], TRUE, 210),

(NULL, 'Depósito de Garantía',
'<p><strong>CLÁUSULA ADICIONAL — DEPÓSITO.</strong> El locatario entrega en este acto la suma equivalente a un (1) mes de alquiler en concepto de depósito de garantía, el cual será devuelto al finalizar el contrato y previa verificación del estado del inmueble y servicios al día, dentro de los plazos establecidos por la Ley 27.551.</p>',
'opcional', ARRAY['CONTRATO_ALQUILER'], TRUE, 220),

(NULL, 'Seguro de Incendio',
'<p><strong>CLÁUSULA ADICIONAL — SEGURO.</strong> El locatario se obliga a contratar y mantener vigente durante todo el plazo contractual un seguro contra incendio sobre el contenido del inmueble, debiendo acreditar su vigencia ante el locador cuando éste lo requiera.</p>',
'opcional', ARRAY['CONTRATO_ALQUILER'], TRUE, 230),

(NULL, 'Jurisdicción',
'<p><strong>ÚLTIMA: JURISDICCIÓN.</strong> Para todos los efectos judiciales y extrajudiciales derivados del presente contrato, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la ciudad de <strong>{{ciudad}}</strong>, renunciando expresamente a cualquier otro fuero o jurisdicción que pudiera corresponderles.</p>',
'obligatoria', ARRAY['CONTRATO_ALQUILER','CONTRATO_ALQUILER_TEMPORARIO'], TRUE, 900)

ON CONFLICT DO NOTHING;
