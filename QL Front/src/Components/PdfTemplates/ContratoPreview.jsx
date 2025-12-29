/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import jsPDF from "jspdf";
import "../../utils/nunito-normal";

const ContratoPreview = () => {
  const [pdfUrl, setPdfUrl] = useState(null);

  const [mockLease] = useState({
    id: 9,
    Property: {
      address: "Lavalle 437",
      city: "Belén",
      province: "Catamarca",
    },
    Tenant: {
      name: "RUBEN FERNANDO OLIVERA",
      cuil: "23-34094621-9",
      direccion: "Lavalle 332",
      ciudad: "Belen",
      provincia: "Catamarca",
      nacionalidad: "Argentina",
      estadoCivil: "Soltero",
      ocupacion: "Empleado",
      email: "ruben.olvera@example.com",
      mobilePhone: "+54 9 3834 123456",
    },
    Owner: {
      name: "MARIA JOSE QUINTERO",
      cuil: "27-12345678-9",
    },
    startDate: "2024-01-15",
    endDate: "2026-01-15",
    amount: 350000,
    guarantee: 1050000,
    paymentDay: 10,
  });

  const generatePreviewPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Nunito-VariableFont_wght", "normal");
    
    const maxWidth = 160;
    let currentY = 20;
    const lineHeight = 5;

    // Función helper para agregar texto
    const addText = (text, fontSize = 10, isBold = false, justify = false) => {
      if (isBold) {
        doc.setFont("Nunito-VariableFont_wght", "bold");
      } else {
        doc.setFont("Nunito-VariableFont_wght", "normal");
      }
      doc.setFontSize(fontSize);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      if (justify) {
        doc.text(lines, 25, currentY, { align: 'justify', maxWidth: maxWidth });
      } else {
        doc.text(lines, 25, currentY);
      }
      currentY += lines.length * lineHeight;
    };

    // TÍTULO
    addText("CONTRATO DE LOCACION DE INMUEBLE CON DESTINO VIVIENDA", 14, true);
    currentY += 5;

    // PARTES
    addText("Entre el S./Sra. " + mockLease.Owner.name + " en adelante LA LOCADORA, con CUIL " + mockLease.Owner.cuil + ", representada en este acto por la Arq. MARIANA LOBETO, M.P. 275, en su carácter de Administrador y Mandatario General de la propiedad ubicada en " + mockLease.Property.address + ", " + mockLease.Property.city + ", " + mockLease.Property.province + ", por una parte; y por la otra el/la Sr/a " + mockLease.Tenant.name + ", CUIL " + mockLease.Tenant.cuil + ", con domicilio en " + mockLease.Tenant.direccion + ", " + mockLease.Tenant.ciudad + ", " + mockLease.Tenant.provincia + ", en adelante EL/LA LOCATARIO/A, convienen celebrar el presente CONTRATO DE LOCACION, sujeto a las siguientes cláusulas:", 10, false, true);
    
    currentY += 5;

    // PRIMERA
    addText("PRIMERA: LA LOCADORA da en locacion al/la LOCATARIO/A el inmueble ubicado en " + mockLease.Property.address + ", " + mockLease.Property.city + ", " + mockLease.Property.province + ", para destino de vivienda familiar.", 10, false, true);
    
    currentY += 3;

    // SEGUNDA
    addText("SEGUNDA: El plazo de la locacion sera de VEINTICUATRO (24) MESES, contados a partir del dia " + new Date(mockLease.startDate).toLocaleDateString("es-AR") + " hasta el dia " + new Date(mockLease.endDate).toLocaleDateString("es-AR") + ".", 10, false, true);
    
    currentY += 3;

    // TERCERA
    addText("TERCERA: El precio del alquiler mensual queda establecido en la suma de PESOS " + mockLease.amount.toLocaleString("es-AR") + " ($" + mockLease.amount.toLocaleString("es-AR") + "), pagadero por mes adelantado hasta el dia " + mockLease.paymentDay + " de cada mes.", 10, false, true);

    currentY += 3;

    // CUARTA
    addText("CUARTA: El/la LOCATARIO/A abonara en concepto de garantia la suma de PESOS " + mockLease.guarantee.toLocaleString("es-AR") + " ($" + mockLease.guarantee.toLocaleString("es-AR") + "), equivalente a TRES (3) meses de alquiler.", 10, false, true);

    currentY += 10;

    // FIRMAS
    doc.setFont("Nunito-VariableFont_wght", "normal");
    doc.setFontSize(10);
    
    doc.line(30, currentY, 80, currentY);
    doc.line(120, currentY, 170, currentY);
    currentY += 5;
    
    doc.text("Firma Locadora", 40, currentY);
    doc.text("Firma Locatario/a", 125, currentY);

    // Generar blob URL para preview
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFont("Nunito-VariableFont_wght", "normal");
    
    const maxWidth = 160;
    let currentY = 20;
    const lineHeight = 5;

    const addText = (text, fontSize = 10, isBold = false, justify = false) => {
      if (isBold) {
        doc.setFont("Nunito-VariableFont_wght", "bold");
      } else {
        doc.setFont("Nunito-VariableFont_wght", "normal");
      }
      doc.setFontSize(fontSize);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      if (justify) {
        doc.text(lines, 25, currentY, { align: 'justify', maxWidth: maxWidth });
      } else {
        doc.text(lines, 25, currentY);
      }
      currentY += lines.length * lineHeight;
    };

    addText("CONTRATO DE LOCACION", 14, true);
    currentY += 5;

    addText("Entre la Sra. " + mockLease.Owner.name + " en adelante LA LOCADORA, con CUIL " + mockLease.Owner.cuil + ", representada en este acto por la Arq. MARIANA LOBETO, M.P. 275, en su carácter de Administrador y Mandatario General de la propiedad ubicada en " + mockLease.Property.address + ", " + mockLease.Property.city + ", " + mockLease.Property.province + ", por una parte; y por la otra el/la Sr/a " + mockLease.Tenant.name + ", CUIL " + mockLease.Tenant.cuil + ", con domicilio en " + mockLease.Tenant.direccion + ", " + mockLease.Tenant.ciudad + ", " + mockLease.Tenant.provincia + ", en adelante EL/LA LOCATARIO/A, convienen celebrar el presente CONTRATO DE LOCACION, sujeto a las siguientes cláusulas:", 10, false, true);
    
    currentY += 5;

    addText("PRIMERA: LA LOCADORA da en locacion al/la LOCATARIO/A el inmueble ubicado en " + mockLease.Property.address + ", " + mockLease.Property.city + ", " + mockLease.Property.province + ", para destino de vivienda familiar.", 10, false, true);
    
    currentY += 3;

    addText("SEGUNDA: El plazo de la locacion sera de VEINTICUATRO (24) MESES, contados a partir del dia " + new Date(mockLease.startDate).toLocaleDateString("es-AR") + " hasta el dia " + new Date(mockLease.endDate).toLocaleDateString("es-AR") + ".", 10, false, true);
    
    currentY += 3;

    addText("TERCERA: El precio del alquiler mensual queda establecido en la suma de PESOS " + mockLease.amount.toLocaleString("es-AR") + " ($" + mockLease.amount.toLocaleString("es-AR") + "), pagadero por mes adelantado hasta el dia " + mockLease.paymentDay + " de cada mes.", 10, false, true);

    currentY += 3;

    addText("CUARTA: El/la LOCATARIO/A abonara en concepto de garantia la suma de PESOS " + mockLease.guarantee.toLocaleString("es-AR") + " ($" + mockLease.guarantee.toLocaleString("es-AR") + "), equivalente a TRES (3) meses de alquiler.", 10, false, true);

    currentY += 10;

    doc.setFont("Nunito-VariableFont_wght", "normal");
    doc.setFontSize(10);
    
    doc.line(30, currentY, 80, currentY);
    doc.line(120, currentY, 170, currentY);
    currentY += 5;
    
    doc.text("Firma Locadora", 40, currentY);
    doc.text("Firma Locatario/a", 125, currentY);

    doc.save(`Contrato_${mockLease.Tenant.name}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Preview de Contrato de Alquiler PDF
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Datos del Contrato
              </h2>
              <div className="space-y-3 text-white">
                <div>
                  <span className="text-slate-400">ID:</span> {mockLease.id}
                </div>
                <div>
                  <span className="text-slate-400">Propiedad:</span> {mockLease.Property.address}
                </div>
                <div>
                  <span className="text-slate-400">Monto mensual:</span> $
                  {Number(mockLease.amount).toLocaleString("es-AR")}
                </div>
                <div>
                  <span className="text-slate-400">Garantía:</span> $
                  {Number(mockLease.guarantee).toLocaleString("es-AR")}
                </div>
                <div>
                  <span className="text-slate-400">Inicio:</span>{" "}
                  {new Date(mockLease.startDate).toLocaleDateString("es-AR")}
                </div>
                <div>
                  <span className="text-slate-400">Fin:</span>{" "}
                  {new Date(mockLease.endDate).toLocaleDateString("es-AR")}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Datos del Locatario
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

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 space-y-3">
              <button
                onClick={generatePreviewPDF}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Generar Preview del PDF
              </button>
              
              <button
                onClick={handleDownload}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Descargar Contrato PDF
              </button>
              
              <p className="text-slate-300 text-sm mt-3">
                Genera el PDF con fuente Nunito y visualízalo en tiempo real
              </p>
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
                  Haz clic en "Generar Preview del PDF" para ver el contrato
                  <br />
                  con la fuente Nunito aplicada
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContratoPreview;
