/* eslint-disable react/prop-types */
import { jsPDF } from "jspdf";

const AutorizacionVentaPdf = ({ client, property }) => {
  const generatePdf = () => {
    const doc = new jsPDF();
    const maxWidth = 170; // Ancho máximo para el texto
    let currentY = 15; // Posición inicial vertical
    console.log(client, property)
    // Título
    doc.setFontSize(15);
    doc.text(`Autorización de Venta`, 15, currentY);
    currentY += 10; // Espaciado después del título

    // PRIMERO
    doc.setFontSize(12);
    const firstText = `En la ciudad de Belén, provincia de Catamarca, entre el Sr. ${client.name} CUIL/CUIT ${client.cuil} ${property.socio} ,  denominado el/los PROPIETARIOS, por una parte, y QUINTERO LOBETO PROPIEDADES, Tel celular 3835-503166 con domicilio en Av. Cubas Nº50 de la ciudad de Belén, en adelante denominado LA INMOBILIARIA han llegado a un acuerdo para la autorización de venta del inmueble bajo las siguientes condiciones.`;
    const firstTextLines = doc.splitTextToSize(firstText, maxWidth);
    doc.text(firstTextLines, 20, currentY);
    currentY += firstTextLines.length * 8; // Incremento dinámico según el texto

    // Descripción de la propiedad
    const propertyDescription = `${property.description},${property.superficieCubierta}, ${property.superficieTotal} sito en la localidad de ${property.city}, prov. Catamarca.`;
    const propertyLines = doc.splitTextToSize(propertyDescription, maxWidth);
    doc.text(propertyLines, 20, currentY);
    currentY += propertyLines.length * 8 + 10; // Incremento dinámico + espacio adicional

    // SEGUNDA
    const secondText = `SEGUNDA: El precio pactado es $ ${property.price}.`;
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
    const dateText = `Lugar y fecha. Celebrado en la ciudad de Belén al día ${new Date().toLocaleDateString()}.`;
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
      <button onClick={generatePdf} className="bg-yellow-500 text-white px-3 py-2  rounded">
        Generar Autorización de Venta
      </button>
    </div>
  );
};

export default AutorizacionVentaPdf;



