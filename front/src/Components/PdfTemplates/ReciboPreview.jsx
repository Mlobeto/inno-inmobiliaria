/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import ReciboPdf from "./ReciboPdf";
import jsPDF from "jspdf";
import "../../utils/tahoma-normal";
import "../../utils/nunito-normal";
import numeroALetras from "../../utils/numeroALetras";

const ReciboPreview = () => {
  const [pdfUrl, setPdfUrl] = useState(null);

  const [mockPayment] = useState({
    id: 1,
    amount: 1050000,
    paymentDate: new Date().toISOString(),
    period: "Noviembre 2025",
    type: "initial",
  });

  const [mockLease] = useState({
    id: 9,
    Property: {
      address: "Lavalle 437",
    },
    Tenant: {
      name: "RUBEN FERNANDO OLIVERA",
      cuil: "23-34094621-9",
      direccion: "Lavalle 332",
      ciudad: "Belen",
      provincia: "Catamarca",
    },
  });

  const generatePreviewPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Nunito-VariableFont_wght", "normal");

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };
    };

    const tenant = mockLease?.Tenant || {};
    const amount = Number(mockPayment.amount);
    const { day, month, year } = formatDate(mockPayment.paymentDate);
    const receiptNumber = String(mockPayment.id).padStart(5, "0");

    // === HEADER ===
    doc.setFont("Nunito-VariableFont_wght", "normal");
    doc.setFontSize(18);
    doc.text("QUINTERO + LOBETO", 20, 25);

    doc.setFontSize(7);
    doc.setCharSpace(2);
    doc.text("P R O P I E D A D E S", 20, 30);
    doc.setCharSpace(0);

    // Volver a Tahoma para el resto del documento
    doc.setFont("Nunito-VariableFont_wght", "normal");
    doc.setFontSize(9);
    doc.text("de LOBETO MARIANA", 38, 36);
    doc.text("ARQUITECTA", 44, 40);

    doc.setFont("Nunito-VariableFont_wght", "normal");
    doc.setFontSize(7);
    doc.text("M.P. Nº 275", 48, 44);

    doc.setFontSize(10);
    doc.text("AVDA. CUBA Nº 50 / Tel. 3835 503166", 20, 50);
    doc.text("C.P. 4750 - Belen - Catamarca", 28, 54);
    doc.text("arquitecturalobeto@gmail.com", 28, 58);

    doc.setFont("Nunito-VariableFont_wght", "normal");
    doc.setFontSize(11);
    doc.text("IVA RESPONSABLE MONOTRIBUTO", 20, 66);

    // Recuadro número de recibo
    doc.setLineWidth(0.8);
    doc.rect(130, 15, 60, 35);

    doc.setFontSize(40);
    doc.text("X", 100, 40);

    doc.setFontSize(12);
    doc.text(`Nº ${receiptNumber} - 00000692`, 138, 25);

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
    doc.text("C.U.I.T.:  23-20514549-4", 132, 58);
    doc.setFontSize(7);
    doc.text("Ing. Brutos: 23-20514549-4", 132, 62);
    doc.setFontSize(8);
    doc.text("Inicio Activ.: 01-10-1996", 132, 66);

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
      mockPayment.type === "initial"
        ? `Honorarios  - Contrato ${mockLease.id} - ${
            mockLease.Property?.address || ""
          }`
        : `${mockPayment.period} - Contrato ${mockLease.id} - ${
            mockLease.Property?.address || ""
          }`;
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
    doc.text("Firma", 145, 225);
    doc.line(120, 230, 180, 230);
    doc.text("Aclaración de la Firma", 135, 233);

   

    doc.setFontSize(10);
    doc.text("ORIGINAL", 165, 260);

    // Generar blob URL para preview
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Preview de Recibo PDF
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Datos del Pago
              </h2>
              <div className="space-y-3 text-white">
                <div>
                  <span className="text-slate-400">ID:</span> {mockPayment.id}
                </div>
                <div>
                  <span className="text-slate-400">Monto:</span> $
                  {Number(mockPayment.amount).toLocaleString("es-AR")}
                </div>
                <div>
                  <span className="text-slate-400">Tipo:</span>{" "}
                  {mockPayment.type === "initial" ? "Pago Inicial" : "Cuota"}
                </div>
                <div>
                  <span className="text-slate-400">Fecha:</span>{" "}
                  {new Date(mockPayment.paymentDate).toLocaleDateString(
                    "es-AR"
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Datos del Cliente
              </h2>
              <div className="space-y-3 text-white">
                <div>
                  <span className="text-slate-400">Nombre:</span>{" "}
                  {mockLease.Tenant.name}
                </div>
                <div>
                  <span className="text-slate-400">CUIL:</span>{" "}
                  {mockLease.Tenant.cuil}
                </div>
                <div>
                  <span className="text-slate-400">Dirección:</span>{" "}
                  {mockLease.Tenant.direccion}
                </div>
                <div>
                  <span className="text-slate-400">Localidad:</span>{" "}
                  {mockLease.Tenant.ciudad}, {mockLease.Tenant.provincia}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <button
                onClick={generatePreviewPDF}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Generar Preview del PDF
              </button>
              <p className="text-slate-300 text-sm mt-3">
                Genera el PDF con fuente Tahoma y visualízalo en tiempo real
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <ReciboPdf payment={mockPayment} lease={mockLease} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Vista del PDF
            </h2>
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full bg-white rounded-lg"
                style={{ height: "800px" }}
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-slate-700/50 rounded-lg">
                <p className="text-slate-300 text-center">
                  Haz clic en "Generar Preview del PDF" para ver el recibo
                  <br />
                  con la fuente Tahoma aplicada
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReciboPreview;
