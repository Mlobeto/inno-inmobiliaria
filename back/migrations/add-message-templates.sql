-- Migración: Agregar plantillas de mensajes a admin_settings
-- Fecha: 2026-01-05
-- Descripción: Agrega campos para plantillas de WhatsApp y Requisitos de alquiler

-- Agregar nuevos campos para plantillas de mensajes
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS whatsapp_template TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS requisitos_template TEXT DEFAULT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN admin_settings.whatsapp_template IS 'Plantilla de mensaje de WhatsApp para propiedades. Variables: {precio}, {direccion}, {ciudad}, {barrio}, {tipo}, {habitaciones}, {baños}, {superficieTotal}, {descripcion}';
COMMENT ON COLUMN admin_settings.requisitos_template IS 'Plantilla de requisitos para alquilar. Variables: {address}, {price}';

-- Insertar plantillas por defecto
UPDATE admin_settings 
SET 
  whatsapp_template = 'Gracias por ponerte en contacto con nosotros! Estamos encantados de poder ayudar. 

{descripcion}

Te comento que estamos en lanzamiento de ofertas y este es el primero!

Precio: {precio}
Ubicación: {direccion}

Estamos a tu entera disposición por dudas, precio o consultas.',
  
  requisitos_template = 'REQUISITOS PARA ALQUILAR

Propiedad con domicilio en: {address}

1. Fotocopia D.N.I./ CUIL/CUIT, solicitante/s y garante/s, domicilio y teléfono de los mismos, sino es del dominio del documento electrónico.

2. Fotocopia de los últimos tres recibos de sueldo, y certificado de trabajo, si es autónomo justificación de ingresos, esta puede hacer por un Contador y debe pasar por el Colegio Profesional de Ciencias Económicas, para ser certificada.

3. Tipos de garantías: Cantidad 2 –con recibo de sueldo-
   • Garantía de caución o/
   • Recibo de sueldo no inferior al tercio del monto del alquiler

Garante:
DNI:
Domicilio:
Correo electrónico:

4. Los garantes firman el contrato ante escribano para que les certifique la firma, y cuando firme ante escribano deberá ser legalizado por el colegio de Escribanos.

5. Monto del alquiler mensual: 1º Cuatrimestre {price} - Para los cuatrimestres siguientes de locación el precio será actualizado conforme el índice de precio al consumidor (IPC) que confecciona y publica el Instituto Nacional de Estadísticas y Censos (INDEC).

6. Honorarios de contratos ante escribano y favor de firma inmobiliaria: Igual al monto del alquiler

7. Período de locación: 2 años

8. Certificado de firma ante escribano público.

9. Sellado en rentas provincial

10. No se pide mes de depósito.

11. Reserva con seña 50% del monto del alquiler, validez 7 días hábiles.'

WHERE whatsapp_template IS NULL OR requisitos_template IS NULL;
