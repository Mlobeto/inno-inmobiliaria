/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";

const AutorizacionVentaPdf = ({ client, property }) => {
  const [companySettings, setCompanySettings] = useState(null);

  // Cargar configuración de la empresa
  useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/admin/settings`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setCompanySettings(data);
        }
      } catch (error) {
        console.error("Error al cargar settings de la empresa:", error);
        setCompanySettings({
          company_name: "Inmobiliaria",
          company_address: "",
          company_phone: "",
          company_email: ""
        });
      }
    };

    loadCompanySettings();
  }, []);

  const generatePdf = () => {
    const doc = new jsPDF();
    const maxWidth = 170; // Ancho máximo para el texto
    let currentY = 15; // Posición inicial vertical
    console.log("Client data:", client);
    console.log("Property data:", property);
    console.log("Company settings:", companySettings);
    
    // Usar company_city directamente de settings, con fallback a extraer de address
    const companyCity = companySettings?.company_city || 
                        (companySettings?.company_address?.includes(',') ? 
                          companySettings.company_address.split(',').pop()?.trim() : 
                          companySettings?.company_address) || 
                        'N/A';
    
    const companyProvince = companySettings?.company_province || 'Buenos Aires';
    
    console.log("Ciudad del tenant:", companyCity);
    console.log("Provincia del tenant:", companyProvince);
    console.log("Dirección completa:", companySettings?.company_address);
    
    // Título
    doc.setFontSize(15);
    doc.text(`Autorización de Venta`, 15, currentY);
    currentY += 10; // Espaciado después del título

    // PRIMERO - Ahora con datos dinámicos corregidos
    doc.setFontSize(12);
    console.log("CUIL del vendedor (client.cuil):", client.cuil);
    console.log("Nombre del vendedor (client.name):", client.name);
    console.log("Provincia del vendedor (client.provincia):", client.provincia);
    
    const firstText = `En la ciudad de ${companyCity}, provincia de ${companyProvince}, entre el Sr./Sra. ${client.name} CUIL/CUIT ${client.cuil || 'N/A'}${property.socio ? `, junto con ${property.socio}` : ''}, denominado el/los PROPIETARIOS, por una parte, y ${companySettings?.company_name || 'LA INMOBILIARIA'}, Tel celular ${companySettings?.company_phone || 'N/A'} con domicilio en ${companySettings?.company_address || 'N/A'}, ciudad de ${companyCity}, en adelante denominado LA INMOBILIARIA han llegado a un acuerdo para la autorización de venta del inmueble bajo las siguientes condiciones.`;
    const firstTextLines = doc.splitTextToSize(firstText, maxWidth);
    doc.text(firstTextLines, 20, currentY);
    currentY += firstTextLines.length * 8; // Incremento dinámico según el texto

    // Descripción de la propiedad
    const propertyDescription = `${property.description || 'Propiedad'}, Superficie cubierta: ${property.superficieCubierta || 'N/A'}, Superficie total: ${property.superficieTotal || 'N/A'}, sito en la localidad de ${property.city || 'N/A'}, provincia de ${property.province || companyProvince}.`;
    const propertyLines = doc.splitTextToSize(propertyDescription, maxWidth);
    doc.text(propertyLines, 20, currentY);
    currentY += propertyLines.length * 8 + 10; // Incremento dinámico + espacio adicional

    // SEGUNDA
    const secondText = `SEGUNDA: El precio pactado es ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(property.price || 0)}.`;
    const secondLines = doc.splitTextToSize(secondText, maxWidth);
    doc.text(secondLines, 20, currentY);
    currentY += secondLines.length * 8 + 10; // Incremento dinámico + espacio adicional

    // TERCERO
    const thirdText = `TERCERO: El PROPIETARIO autoriza a la INMOBILIARIA a la publicación en las redes sociales, a realizar visitas pre pactadas asistidas con personal de la firma, como así también la colocación de cartel publicitario.`;
    const thirdLines = doc.splitTextToSize(thirdText, maxWidth);
    doc.text(thirdLines, 20, currentY);
    currentY += thirdLines.length * 8 + 10;

    // CUARTO
    const fourthText = `CUARTO: Esta autorización es válida por el término de 360 días a contar desde la fecha. A su vencimiento, este plazo quedará automáticamente prorrogado por otro igual, salvo previa cancelación por medio fehaciente. La Inmobiliaria solo podrá recibir la comisión si es que vende la propiedad. Si la venta la realiza el propietario gracias a datos proporcionados por agencia inmobiliaria, tendrá derecho a reclamar la comisión del ${property.comision}%.`;
    const fourthLines = doc.splitTextToSize(fourthText, maxWidth);
    doc.text(fourthLines, 20, currentY);
    currentY += fourthLines.length * 8 + 10;

    // Lugar y fecha
    const dateText = `Lugar y fecha. Celebrado en la ciudad de ${companyCity} al día ${new Date().toLocaleDateString('es-AR')}.`;
    const dateLines = doc.splitTextToSize(dateText, maxWidth);
    doc.text(dateLines, 20, currentY);
    currentY += dateLines.length * 8 + 20;

    // Firmas
    doc.text(`…………………………………..                                                       …………………………………`, 20, currentY);
    currentY += 10;
    doc.text(`“Propietario”`, 20, currentY);

    // Nombre del archivo
    const fileName = `autorizacion_venta_${property.address}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="col-span-full text-center mt-4">
      <button 
        onClick={generatePdf} 
        disabled={!companySettings}
        className="bg-yellow-500 text-white px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600 transition-colors"
      >
        {companySettings ? 'Generar Autorización de Venta' : 'Cargando...'}
      </button>
    </div>
  );
};

export default AutorizacionVentaPdf;



