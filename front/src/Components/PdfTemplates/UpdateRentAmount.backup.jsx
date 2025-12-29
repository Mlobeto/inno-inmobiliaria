import React from "react";
import PropTypes from "prop-types";
import jsPDF from "jspdf";

const UpdateRentAmount = ({ lease, newRentAmount, updateDate }) => {
  const generatePdf = () => {
    const doc = new jsPDF();
    const maxWidth = 170;
    let currentY = 10;

    // Helper function to add bold text
    const addBoldText = (text, y) => {
      doc.setFont("helvetica", "bold");
      doc.text(text, 20, y);
      doc.setFont("helvetica", "normal");
      return y + 7;
    };

    // Helper function to add text with automatic line breaks
    const addText = (text, y) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, 20, y);
      return y + lines.length * 7;
    };

    // Helper function to format date in Spanish
    const formatDate = (date) => {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(date).toLocaleDateString("es-ES", options);
    };

    // Title
    doc.setFontSize(16);
    doc.text("Actualización de Alquiler", 105, currentY, { align: "center" });
    doc.setFontSize(10);
    currentY += 15;

    // Contract details
    currentY = addBoldText(`ID del Contrato: ${lease.id}`, currentY);
    currentY = addText(`Fecha de Actualización: ${formatDate(updateDate)}`, currentY);
    currentY = addText(`Monto Anterior: ${lease.rentAmount} ARS`, currentY);
    currentY = addText(`Nuevo Monto: ${newRentAmount} ARS`, currentY);

    // Update frequency and period
    const calculatePeriod = () => {
      const startDate = new Date(lease.startDate);
      const updateDateObj = new Date(updateDate);
      let monthsSinceStart =
        (updateDateObj.getFullYear() - startDate.getFullYear()) * 12 +
        (updateDateObj.getMonth() - startDate.getMonth());

      if (lease.updateFrequency === "semestral") {
        return `Semestre ${Math.floor(monthsSinceStart / 6) + 1}`;
      } else if (lease.updateFrequency === "cuatrimestral") {
        return `Cuatrimestre ${Math.floor(monthsSinceStart / 4) + 1}`;
      } else if (lease.updateFrequency === "anual") {
        return `Año ${Math.floor(monthsSinceStart / 12) + 1}`;
      }
      return "Período desconocido";
    };

    currentY = addText(`Frecuencia de Actualización: ${lease.updateFrequency}`, currentY);
    currentY = addText(`Período: ${calculatePeriod()}`, currentY);

    // Footer
    currentY += 10;
    currentY = addText(
      "Cálculo realizado según el índice de alquileres publicado en https://alquiler.com",
      currentY
    );

    // Save the PDF
    doc.save(`Actualizacion_Alquiler_${lease.id}_${updateDate}.pdf`);
  };

  return (
    <div className="mt-4">
      <button
        onClick={generatePdf}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Generar PDF de Actualización
      </button>
    </div>
  );
};

UpdateRentAmount.propTypes = {
  lease: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    rentAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    startDate: PropTypes.string.isRequired,
    updateFrequency: PropTypes.string.isRequired,
  }).isRequired,
  newRentAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  updateDate: PropTypes.string.isRequired,
};

export default UpdateRentAmount;
