import { useState } from 'react';
import PropTypes from 'prop-types';
import {  IoCheckmarkCircleOutline, IoCopyOutline } from 'react-icons/io5';

const RequisitoButton = ({ property }) => {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopyRequisito = async () => {
    try {
      setIsLoading(true);
      
      // Obtener el texto de requisito (plantilla por defecto o personalizado)
      let requisitoText = property.requisito || getDefaultRequisito();
      
      // Reemplazar variables dinámicas
      requisitoText = requisitoText
        .replace(/{address}/g, property.address || '[Dirección no especificada]')
        .replace(/{price}/g, property.price ? `$${parseFloat(property.price).toLocaleString('es-AR')}` : '[Precio no especificado]');
      
      // Copiar al portapapeles
      await navigator.clipboard.writeText(requisitoText);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Error al copiar requisitos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Plantilla por defecto (misma que en el modelo)
  const getDefaultRequisito = () => {
    return `REQUISITOS PARA ALQUILAR

Propiedad con domicilio en: {address}

1. Fotocopia D.N.I./ CUIL/CUIT, solicitante/s y garante/s, domicilio y teléfono de los mismos, sino es del dominio del documento electrónico.

2. Fotocopia de los últimos tres recibos de sueldo, y certificado de trabajo, si es autónomo justificación de ingresos, esta puede hacer por un Contador y debe pasar por el Colegio Profesional de Ciencias Económicas, para ser certificada.

3. ⦁	Tipos de garantías: Cantidad 2 –con recibo de sueldo-
⦁	Garantía de caución o/
⦁	Recibo de sueldo no inferior al tercio del monto del alquiler


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

11. Reserva con seña 50% del monto del alquiler, validez 7 días hábiles.`;
  };

  // Solo mostrar para propiedades de alquiler
  if (property.type !== 'alquiler') {
    return null;
  }

  return (
    <button
      onClick={handleCopyRequisito}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium
        transition-all duration-200 transform hover:scale-105
        ${copied 
          ? 'bg-blue-500 text-white' 
          : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:from-blue-500 hover:to-blue-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-md hover:shadow-lg
      `}
      title="Copiar requisitos para enviar por WhatsApp"
    >
      {copied ? (
        <>
          <IoCheckmarkCircleOutline className="text-xl" />
          <span className="text-sm">¡Copiado!</span>
        </>
      ) : (
        <>
          <IoCopyOutline className="text-xl" />
          <span className="text-sm">Copiar Requisitos</span>
        </>
      )}
    </button>
  );
};

RequisitoButton.propTypes = {
  property: PropTypes.shape({
    type: PropTypes.string.isRequired,
    requisito: PropTypes.string,
    address: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired
};

export default RequisitoButton;
