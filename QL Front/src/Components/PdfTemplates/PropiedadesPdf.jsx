/* eslint-disable react/prop-types */

import jsPDF from "jspdf";

function splitText(text, maxLength = 50) {
  if (!text) return ["N/A"];
  const result = [];
  let current = text;
  while (current.length > maxLength) {
    let idx = current.lastIndexOf(" ", maxLength);
    if (idx === -1) idx = maxLength;
    result.push(current.slice(0, idx));
    current = current.slice(idx).trim();
  }
  if (current.length) result.push(current);
  return result;
}

const PropiedadesPDF = ({ property }) => {
  const generatePdf = async () => {
    const doc = new jsPDF();

    // Minimalista: fuente courier
    doc.setFont("courier");
    doc.setFontSize(11);

    const logoUrl = "/assets/logoNegro.png";
    doc.addImage(logoUrl, "PNG", 10, 10, 40, 20);

    doc.text("Av. Cuba Nº 50", 90, 18);
    doc.setFontSize(9);
    doc.text("Tel:3835 503166", 90, 22);

    // Etiqueta tipo
    if (property.type === "venta") {
      doc.setFillColor(255, 0, 0);
      doc.rect(160, 15, 30, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.text("VENTA", 167, 22);
    } else if (property.type === "alquiler") {
      doc.setFillColor(0, 128, 0);
      doc.rect(160, 15, 30, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("ALQUILER", 167, 22);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.line(10, 27, 200, 27);

    // Imágenes
    let xPosition = 10;
    let yPosition = 30;
    const imageWidth = 60;
    const imageHeight = 40;
    const spaceBetweenImages = 5;
    const pageWidth = 210;
    let rowsOfImages = 1;

    if (property.images.length > 0) {
      for (let i = 0; i < property.images.length; i++) {
        const imageUrl = property.images[i];
        try {
          const img = await fetch(imageUrl)
            .then((res) => res.blob())
            .then((blob) => {
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
            });

          doc.addImage(
            img,
            "JPEG",
            xPosition,
            yPosition,
            imageWidth,
            imageHeight
          );
          xPosition += imageWidth + spaceBetweenImages;
          if (xPosition + imageWidth > pageWidth) {
            xPosition = 10;
            yPosition += imageHeight + spaceBetweenImages;
            rowsOfImages++;
          }
        } catch {
          doc.text(
            `Error al cargar la imagen: ${imageUrl}`,
            xPosition,
            yPosition
          );
          yPosition += 10;
        }
      }
    } else {
      doc.text("No hay imágenes disponibles", 10, 120);
    }

    // Texto principal
    const startYText = 10 + rowsOfImages * (imageHeight + spaceBetweenImages);

    doc.setFont("courier", "normal");
    doc.setFontSize(12);
    doc.text(`Dirección: ${property.address}`, 10, startYText + 20);
    doc.text(`Barrio: ${property.neighborhood}`, 10, startYText + 28);
    doc.text(`Ciudad: ${property.city}`, 10, startYText + 36);
    doc.text(`Precio: $${property.price}`, 10, startYText + 44);
    doc.text(`Tipo: ${property.type}`, 10, startYText + 52);
    doc.text(
      `Tipo de Propiedad: ${property.typeProperty}`,
      10,
      startYText + 60
    );
    doc.text(`Habitaciones: ${property.rooms || "N/A"}`, 10, startYText + 68);
    doc.text(
      `Superficie Cubierta: ${property.superficieCubierta || "N/A"}`,
      10,
      startYText + 76
    );
    doc.text(
      `Superficie Total: ${property.superficieTotal || "N/A"}`,
      10,
      startYText + 84
    );
    doc.text(`Baños: ${property.bathrooms || "N/A"}`, 10, startYText + 92);
    doc.setFont("courier", "normal");
    doc.setFontSize(12);
    const descripcionLines = splitText(property.description, 50);
    doc.text("Descripción:", 10, startYText + 100);
    doc.text(descripcionLines, 10, startYText + 108);

    // Línea separadora después de la descripción
    const descripcionEndY =
      startYText + 108 + (descripcionLines.length - 1) * 8;
    doc.setDrawColor(0, 128, 0);
    doc.line(10, descripcionEndY + 6, 200, descripcionEndY + 6);

    // Highlights en verde y negrita
    doc.setFont("courier", "bold");
    doc.setTextColor(0, 128, 0);
    doc.setFontSize(13);
    doc.text("Destacados:", 10, descripcionEndY + 22);
    doc.setFont("courier", "normal");
    doc.setFontSize(12);
    const highlightsLines = splitText(property.highlights, 50);
    doc.text(highlightsLines, 10, descripcionEndY + 30);

    doc.save(`Propiedad-${property.propertyId}.pdf`);
  };

  return (
    <button
      onClick={generatePdf}
      className="bg-green-500 text-white px-3 py-1 rounded"
    >
      Descargar PDF
    </button>
  );
};

export default PropiedadesPDF;
