import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import numeroALetras from '../../utils/numeroALetras';
import '../../utils/tahoma-normal';
import '../../utils/nunito-normal';

const ReciboPdf = ({ payment, lease, autoGenerate = false }) => {
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [signatureLoaded, setSignatureLoaded] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
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

  useEffect(() => {
    // Cargar firma al montar el componente
    const fetchSignature = async () => {
      try {
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/admin/signature`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (data.signatureUrl) {
          setSignatureUrl(data.signatureUrl);
        }
      } catch (error) {
        console.error('Error al cargar firma:', error);
      } finally {
        setSignatureLoaded(true);
      }
    };
    fetchSignature();
  }, []);

  const generatePdf = async () => {
    if (!companySettings) {
      console.error('Company settings not loaded yet');
      return;
    }

    const doc = new jsPDF();
    doc.setFont("Nunito-VariableFont_wght", "normal");

    const formatDate = (dateString) => {
      // Corregir timezone: forzar hora al mediodía para evitar desfase
      const date = new Date(dateString.split('T')[0] + 'T12:00:00');
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };
    };

    const tenant = lease?.Tenant || {};
    const amount = Number(payment.amount);
    const { day, month, year } = formatDate(payment.paymentDate);
    const receiptNumber = String(payment.id || 0).padStart(8, "0");

    // === HEADER ===
    doc.setFont("Nunito-VariableFont_wght", "normal");
    doc.setFontSize(18);
    doc.text(companySettings.company_name || "INMOBILIARIA", 20, 25);

    // Título profesional si existe
    if (companySettings.professional_title) {
      doc.setFontSize(7);
      doc.setCharSpace(2);
      doc.text(companySettings.professional_title, 20, 30);
      doc.setCharSpace(0);
    }

    // Matrícula si existe
    if (companySettings.company_registration) {
      doc.setFont("Nunito-VariableFont_wght", "normal");
      doc.setFontSize(9);
      doc.text(companySettings.company_registration, 20, 36);
    }

    // Dirección y contacto
    doc.setFontSize(10);
    const yPos = companySettings.company_registration ? 44 : 36;
    doc.text(`${companySettings.company_address || 'Dirección no configurada'}`, 20, yPos);
    doc.text(`${companySettings.company_city || ''}, ${companySettings.company_province || ''}`, 20, yPos + 4);
    doc.text(`Tel: ${companySettings.company_phone || 'N/A'}`, 20, yPos + 8);
    doc.text(companySettings.company_email || 'email@ejemplo.com', 20, yPos + 12);

    doc.setFont("Nunito-VariableFont_wght", "normal");
    doc.setFontSize(11);
    doc.text(companySettings.company_condicion_iva || "IVA RESPONSABLE MONOTRIBUTO", 20, yPos + 20);

    // Recuadro número de recibo
    doc.setLineWidth(0.8);
    doc.rect(130, 15, 60, 35);

    doc.setFontSize(40);
    doc.text(companySettings.receipt_prefix || "X", 100, 40);

    doc.setFontSize(12);
    doc.text(`Nº ${receiptNumber}`, 138, 25);

    doc.setFontSize(20);
    doc.setCharSpace(2);
    doc.text("RECIBO", 142, 37);
    doc.setCharSpace(0);

    doc.setFontSize(7);
    doc.text("DOCUMENTO NO VALIDO COMO FACTURA", 135, 46);

    // Fecha
    doc.setLineWidth(0.3);
    doc.rect(130, 52, 60, 20);
    
    doc.setFontSize(8);
    doc.text(`C.U.I.T.: ${companySettings.company_cuit || 'N/A'}`, 132, 58);
    doc.setFontSize(7);
    doc.text(`Ing. Brutos: ${companySettings.company_ingresos_brutos || companySettings.company_cuit || 'N/A'}`, 132, 62);
    doc.setFontSize(8);
    doc.text(`Inicio Activ.: ${companySettings.company_inicio_actividad || 'N/A'}`, 132, 66);

    doc.setFontSize(7);
    doc.text("DIA", 167, 58);
    doc.text("MES", 173, 58);
    doc.text("AÑO", 181, 58);

    doc.setFontSize(10);
    doc.text(String(day), 167, 66);
    doc.text(String(month), 173, 66);
    doc.text(String(year).slice(-2), 181, 66);

    // === DATOS DEL CLIENTE ===
    doc.setFontSize(10);

    doc.text("Señor(es):", 20, 95);
    doc.line(45, 95, 140, 95);
    doc.text(tenant.name || "N/A", 46, 94);
    doc.text("Tel.:", 145, 95);
    doc.line(155, 95, 190, 95);

    doc.text("Domicilio:", 20, 105);
    doc.line(45, 105, 110, 105);
    doc.text(tenant.direccion || "", 46, 104);
    doc.text("Localidad:", 115, 105);
    doc.line(140, 105, 190, 105);
    doc.text(`${tenant.ciudad || ""}, ${tenant.provincia || ""}`, 141, 104);

    // Checkboxes
    doc.setFontSize(8);
    doc.rect(20, 110, 60, 20);
    
    doc.rect(22, 112, 3, 3);
    doc.text("R. Insc.", 26, 114);
    doc.rect(22, 117, 3, 3);
    doc.text("Exento", 26, 119);
    doc.rect(22, 122, 3, 3);
    doc.text("No Resp.", 26, 124);
    doc.rect(22, 127, 3, 3);
    doc.text("C. Final", 26, 129);

    doc.rect(45, 112, 3, 3);
    doc.text("Monotributo", 49, 114);
    doc.rect(45, 117, 3, 3);
    doc.text("Monotributo Social", 49, 119);
    doc.rect(45, 122, 3, 3);
    doc.text("Monotributo Eventual", 49, 124);
    doc.rect(45, 127, 3, 3);
    doc.text("Peq. Cont. Event. Social", 49, 129);

    // CONDICIONES DE VENTA
    doc.rect(85, 110, 105, 20);
    doc.text("CONDICIONES DE VENTA", 90, 115);
    doc.text("C.U.I.T.:", 90, 120);

    doc.text("Cont.", 90, 125);
    doc.rect(100, 122, 3, 3);
    doc.text("Cta. Cte.", 105, 125);
    doc.rect(118, 122, 3, 3);
    doc.text("Tarj.", 122, 125);
    doc.rect(132, 122, 3, 3);
    doc.text("Ing. Brutos:", 137, 125);

    doc.text("Cupón Nº", 90, 129);
    doc.line(105, 129, 140, 129);
    doc.text("Factura Nº:", 145, 129);

    // === MONTO RECIBIDO ===
    doc.setFontSize(10);
    doc.text("Recibí la suma de Pesos:", 20, 145);
    doc.line(70, 145, 190, 145);

    const montoEnLetras = numeroALetras(amount).toUpperCase();
    doc.text(montoEnLetras, 70, 144);

    // === CONCEPTO ===
    doc.text("En concepto de:", 20, 160);
    doc.line(55, 160, 190, 160);

    const concepto =
      payment.type === "initial"
        ? `Honorarios - ${lease.Property?.address || ""}`
        : payment.type === "commission"
        ? `Comision - ${lease.Property?.address || ""}`
        : `Cuota ${payment.installmentNumber}/${lease.totalMonths} ${payment.period} - ${lease.Property?.address || ""}`;
    doc.text(concepto, 55, 159);

    doc.line(20, 170, 190, 170);
    doc.line(20, 180, 190, 180);

    // === CHEQUE ===
    doc.text("Cheque Nº:", 20, 195);
    doc.line(45, 195, 100, 195);
    doc.text("Banco:", 110, 195);
    doc.line(130, 195, 190, 195);

    // === MONTO Y FIRMA ===
    doc.setLineWidth(0.5);
    doc.rect(20, 200, 85, 35);
    doc.rect(110, 200, 80, 35);

    doc.setFontSize(12);
    doc.text("Son $:", 25, 220);
    doc.setFontSize(16);
    doc.text(new Intl.NumberFormat("es-AR").format(amount), 50, 220);

    doc.setFontSize(9);
    doc.line(120, 220, 180, 220);
    
    // Insertar firma si existe
    if (signatureUrl) {
      try {
        // Cargar imagen de firma
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = 'Anonymous';
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = signatureUrl;
        });
        
        // Agregar firma al PDF
        doc.addImage(img, 'PNG', 125, 210, 50, 15);
      } catch (error) {
        console.error('Error al cargar firma:', error);
        // Si hay error, mostrar texto por defecto
        doc.text("Firma", 145, 218);
      }
    } else {
      doc.text("Firma", 145, 218);
    }
    
    doc.line(120, 230, 180, 230);
    doc.text("Aclaración de la Firma", 135, 233);

    doc.setFontSize(10);
    doc.text("ORIGINAL", 165, 260);
    
    // Footer personalizado si existe
    if (companySettings.receipt_footer_text) {
      doc.setFontSize(8);
      doc.text(companySettings.receipt_footer_text, 20, 270);
    }

    doc.save(`Recibo_${receiptNumber}_${tenant.name || "Cliente"}.pdf`);
    setPdfGenerated(true);
  };

  // Efecto para auto-generar cuando la firma y settings estén cargados
  useEffect(() => {
    if (autoGenerate && signatureLoaded && companySettings && !pdfGenerated) {
      generatePdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, signatureLoaded, companySettings, pdfGenerated]);

  if (autoGenerate) {
    return null;
  }

  const handleGenerate = () => {
    console.log('Descargar Recibo PDF', { paymentId: payment?.id, leaseId: lease?.id });
    generatePdf();
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleGenerate}
        disabled={!companySettings}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        title={!companySettings ? "Cargando configuración..." : ""}
      >
        {companySettings ? "Generar Recibo PDF" : "Cargando..."}
      </button>
    </div>
  );
};

ReciboPdf.propTypes = {
  payment: PropTypes.object.isRequired,
  lease: PropTypes.object.isRequired,
  autoGenerate: PropTypes.bool,
};

export default ReciboPdf;
