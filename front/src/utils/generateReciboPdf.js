import jsPDF from 'jspdf';
import numeroALetras from './numeroALetras';
import './tahoma-normal';
import './nunito-normal';

function parseReceiptDate(dateString) {
  const date = new Date(String(dateString).split('T')[0] + 'T12:00:00');
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

/**
 * Genera un recibo con el mismo diseño que ReciboPdf (cuotas de alquiler).
 * @returns {Promise<jsPDF>}
 */
export async function generateReciboPdf({
  companySettings,
  signatureUrl,
  payer = {},
  amount,
  paymentDate,
  receiptNumber,
  concepto,
  fileName,
  download = true,
}) {
  const doc = new jsPDF();
  doc.setFont('Nunito-VariableFont_wght', 'normal');

  const { day, month, year } = parseReceiptDate(paymentDate);
  const numRecibo = String(receiptNumber ?? '0').padStart(8, '0');
  const monto = Number(amount);

  doc.setFontSize(18);
  doc.text(companySettings.company_name || 'INMOBILIARIA', 20, 25);

  if (companySettings.professional_title) {
    doc.setFontSize(7);
    doc.setCharSpace(2);
    doc.text(companySettings.professional_title, 20, 30);
    doc.setCharSpace(0);
  }

  if (companySettings.company_registration) {
    doc.setFontSize(9);
    doc.text(companySettings.company_registration, 20, 36);
  }

  doc.setFontSize(10);
  const yPos = companySettings.company_registration ? 44 : 36;
  doc.text(`${companySettings.company_address || 'Dirección no configurada'}`, 20, yPos);
  doc.text(`${companySettings.company_city || ''}, ${companySettings.company_province || ''}`, 20, yPos + 4);
  doc.text(`Tel: ${companySettings.company_phone || 'N/A'}`, 20, yPos + 8);
  doc.text(companySettings.company_email || 'email@ejemplo.com', 20, yPos + 12);

  doc.setFontSize(11);
  doc.text(companySettings.company_condicion_iva || 'IVA RESPONSABLE MONOTRIBUTO', 20, yPos + 20);

  doc.setLineWidth(0.8);
  doc.rect(130, 15, 60, 35);
  doc.setFontSize(40);
  doc.text(companySettings.receipt_prefix || 'X', 100, 40);
  doc.setFontSize(12);
  doc.text(`Nº ${numRecibo}`, 138, 25);
  doc.setFontSize(20);
  doc.setCharSpace(2);
  doc.text('RECIBO', 142, 37);
  doc.setCharSpace(0);
  doc.setFontSize(7);
  doc.text('DOCUMENTO NO VALIDO COMO FACTURA', 135, 46);

  doc.setLineWidth(0.3);
  doc.rect(130, 52, 60, 20);
  doc.setFontSize(8);
  doc.text(`C.U.I.T.: ${companySettings.company_cuit || 'N/A'}`, 132, 58);
  doc.setFontSize(7);
  doc.text(`Ing. Brutos: ${companySettings.company_ingresos_brutos || companySettings.company_cuit || 'N/A'}`, 132, 62);
  doc.setFontSize(8);
  doc.text(`Inicio Activ.: ${companySettings.company_inicio_actividad || 'N/A'}`, 132, 66);
  doc.setFontSize(7);
  doc.text('DIA', 167, 58);
  doc.text('MES', 173, 58);
  doc.text('AÑO', 181, 58);
  doc.setFontSize(10);
  doc.text(String(day), 167, 66);
  doc.text(String(month), 173, 66);
  doc.text(String(year).slice(-2), 181, 66);

  doc.setFontSize(10);
  doc.text('Señor(es):', 20, 95);
  doc.line(45, 95, 140, 95);
  doc.text(payer.name || 'N/A', 46, 94);
  doc.text('Tel.:', 145, 95);
  doc.line(155, 95, 190, 95);
  if (payer.telefono) doc.text(payer.telefono, 156, 94);

  doc.text('Domicilio:', 20, 105);
  doc.line(45, 105, 110, 105);
  doc.text(payer.direccion || '', 46, 104);
  doc.text('Localidad:', 115, 105);
  doc.line(140, 105, 190, 105);
  const loc = [payer.ciudad, payer.provincia].filter(Boolean).join(', ');
  if (loc) doc.text(loc, 141, 104);

  doc.setFontSize(8);
  doc.rect(20, 110, 60, 20);
  doc.rect(22, 112, 3, 3);
  doc.text('R. Insc.', 26, 114);
  doc.rect(22, 117, 3, 3);
  doc.text('Exento', 26, 119);
  doc.rect(22, 122, 3, 3);
  doc.text('No Resp.', 26, 124);
  doc.rect(22, 127, 3, 3);
  doc.text('C. Final', 26, 129);
  doc.rect(45, 112, 3, 3);
  doc.text('Monotributo', 49, 114);
  doc.rect(45, 117, 3, 3);
  doc.text('Monotributo Social', 49, 119);
  doc.rect(45, 122, 3, 3);
  doc.text('Monotributo Eventual', 49, 124);
  doc.rect(45, 127, 3, 3);
  doc.text('Peq. Cont. Event. Social', 49, 129);

  doc.rect(85, 110, 105, 20);
  doc.text('CONDICIONES DE VENTA', 90, 115);
  doc.text('C.U.I.T.:', 90, 120);
  doc.text('Cont.', 90, 125);
  doc.rect(100, 122, 3, 3);
  doc.text('Cta. Cte.', 105, 125);
  doc.rect(118, 122, 3, 3);
  doc.text('Tarj.', 122, 125);
  doc.rect(132, 122, 3, 3);
  doc.text('Ing. Brutos:', 137, 125);
  doc.text('Cupón Nº', 90, 129);
  doc.line(105, 129, 140, 129);
  doc.text('Factura Nº:', 145, 129);

  doc.setFontSize(10);
  doc.text('Recibí la suma de Pesos:', 20, 145);
  doc.line(70, 145, 190, 145);
  doc.text(numeroALetras(monto).toUpperCase(), 70, 144);

  doc.text('En concepto de:', 20, 160);
  doc.line(55, 160, 190, 160);
  const conceptLines = doc.splitTextToSize(concepto || '', 135);
  doc.text(conceptLines, 55, 159);

  doc.line(20, 170, 190, 170);
  doc.line(20, 180, 190, 180);

  doc.text('Cheque Nº:', 20, 195);
  doc.line(45, 195, 100, 195);
  doc.text('Banco:', 110, 195);
  doc.line(130, 195, 190, 195);

  doc.setLineWidth(0.5);
  doc.rect(20, 200, 85, 35);
  doc.rect(110, 200, 80, 35);
  doc.setFontSize(12);
  doc.text('Son $:', 25, 220);
  doc.setFontSize(16);
  doc.text(new Intl.NumberFormat('es-AR').format(monto), 50, 220);

  doc.setFontSize(9);
  doc.line(120, 220, 180, 220);

  if (signatureUrl) {
    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = signatureUrl;
      });
      doc.addImage(img, 'PNG', 125, 210, 50, 15);
    } catch {
      doc.text('Firma', 145, 218);
    }
  } else {
    doc.text('Firma', 145, 218);
  }

  doc.line(120, 230, 180, 230);
  doc.text('Aclaración de la Firma', 135, 233);
  doc.setFontSize(10);
  doc.text('ORIGINAL', 165, 260);

  if (companySettings.receipt_footer_text) {
    doc.setFontSize(8);
    doc.text(companySettings.receipt_footer_text, 20, 270);
  }

  if (download && fileName) {
    doc.save(fileName);
  }

  return doc;
}
