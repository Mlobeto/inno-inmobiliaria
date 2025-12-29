import PropTypes from 'prop-types';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Configurar las fuentes de pdfMake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const ContratoAlquiler = ({ lease, autoGenerate = false }) => {
  const generatePdf = async () => {
    // Si existe customContent (contrato editado), generar PDF desde HTML
    if (lease.customContent) {
      try {
        // Crear un contenedor temporal para el HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = lease.customContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm'; // A4 width
        tempDiv.style.padding = '20mm 25mm'; // Top/Bottom 20mm, Left/Right 25mm
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.boxSizing = 'border-box';
        tempDiv.style.fontFamily = 'Tahoma, Arial, sans-serif';
        document.body.appendChild(tempDiv);

        // Convertir HTML a canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: tempDiv.scrollWidth,
          height: tempDiv.scrollHeight
        });

        // Remover el elemento temporal
        document.body.removeChild(tempDiv);

        // Crear PDF desde el canvas manteniendo márgenes
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calcular dimensiones respetando los márgenes del tempDiv
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Agregar la primera página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        // Agregar páginas adicionales si es necesario
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }

        pdf.save(`Contrato_${lease.Tenant?.name || 'Sin_Nombre'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
        return;
      } catch (error) {
        console.error('Error generando PDF desde HTML:', error);
        alert('Error al generar el PDF del contrato editado. Se generará el PDF estándar.');
        // Continuar con la generación normal si falla
      }
    }

    // Generación estándar del PDF (código original)
    const doc = new jsPDF();
    const maxWidth = 160; // Reducir para mejor formato
    let currentY = 20;
    const lineHeight = 4; // Aumentado para más espaciado
    const bottomMargin = 20;

    // Configurar fuente Tahoma
    doc.setFont("tahoma", "normal");

    // Función helper para agregar texto con salto de línea automático
    const addText = (text, y, fontSize = 9, isBold = false, justify = false) => {
      if (isBold) {
        doc.setFont("tahoma", "bold");
      } else {
        doc.setFont("tahoma", "normal");
      }
      doc.setFontSize(fontSize);
      
      // Limpiar caracteres problemáticos
      const cleanText = text
        .replace(/\\n/g, '\n') // Convertir \\n literal a salto de línea real
        .replace(/[ó]/g, 'o')
        .replace(/[á]/g, 'a')
        .replace(/[é]/g, 'e')
        .replace(/[í]/g, 'i')
        .replace(/[ú]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[Ó]/g, 'O')
        .replace(/[Á]/g, 'A')
        .replace(/[É]/g, 'E')
        .replace(/[Í]/g, 'I')
        .replace(/[Ú]/g, 'U')
        .replace(/[Ñ]/g, 'N');

      const lines = doc.splitTextToSize(cleanText, maxWidth);
      if (justify) {
        doc.text(lines, 25, y, { align: 'justify', maxWidth: maxWidth });
      } else {
        doc.text(lines, 25, y);
      }
      return y + (lines.length * lineHeight);
    };

    // Función mejorada para agregar texto largo con saltos de página automáticos
    const addLongText = (text, y, fontSize = 9, isBold = false, justify = false) => {
      if (isBold) {
        doc.setFont("tahoma", "bold");
      } else {
        doc.setFont("tahoma", "normal");
      }
      doc.setFontSize(fontSize);
      
      // Limpiar caracteres problemáticos
      const cleanText = text
        .replace(/\\n/g, '\n')
        .replace(/[ó]/g, 'o')
        .replace(/[á]/g, 'a')
        .replace(/[é]/g, 'e')
        .replace(/[í]/g, 'i')
        .replace(/[ú]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[Ó]/g, 'O')
        .replace(/[Á]/g, 'A')
        .replace(/[É]/g, 'E')
        .replace(/[Í]/g, 'I')
        .replace(/[Ú]/g, 'U')
        .replace(/[Ñ]/g, 'N');

      const lines = doc.splitTextToSize(cleanText, maxWidth);
      let currentLineY = y;
      
      lines.forEach(line => {
        // Verificar si necesita nueva página antes de cada línea
        if (currentLineY + lineHeight + bottomMargin > doc.internal.pageSize.getHeight()) {
          doc.addPage();
          currentLineY = 20;
        }
        if (justify) {
          doc.text(line, 25, currentLineY, { align: 'justify', maxWidth: maxWidth });
        } else {
          doc.text(line, 25, currentLineY);
        }
        currentLineY += lineHeight;
      });
      
      return currentLineY;
    };

    // Helper function para verificar si necesita nueva página
    const isPageBreakNeeded = (contentHeight) => {
      return currentY + contentHeight + bottomMargin > doc.internal.pageSize.getHeight();
    };

    // Helper function para agregar nueva página si es necesario
    const addPageIfNecessary = (contentHeight) => {
      if (isPageBreakNeeded(contentHeight)) {
        doc.addPage();
        currentY = 20;
      }
    };

    // Helper function para agregar cláusula con título en negrita y texto justificado
    const addClause = (title, text, titleWidth = null) => {
      doc.setFont("tahoma", "bold");
      doc.text(title, 25, currentY);
      
      const width = titleWidth || doc.getTextWidth(title + " ");
      doc.setFont("tahoma", "normal");
      
      const lines = doc.splitTextToSize(text, maxWidth - width);
      doc.text(lines[0], 25 + width, currentY, { align: 'justify', maxWidth: maxWidth - width });
      currentY += lineHeight;
      
      for (let i = 1; i < lines.length; i++) {
        if (currentY + lineHeight + bottomMargin > doc.internal.pageSize.getHeight()) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(lines[i], 25, currentY, { align: 'justify', maxWidth: maxWidth });
        currentY += lineHeight;
      }
      
      // Agregar línea de guiones al final de la última línea de texto
      const lastLine = lines[lines.length - 1];
      const lastLineWidth = doc.getTextWidth(lastLine);
      const remainingWidth = maxWidth - lastLineWidth;
      
      if (remainingWidth > 5) { // Solo si queda espacio significativo
        const guionWidth = doc.getTextWidth('-');
        const numGuiones = Math.floor(remainingWidth / guionWidth);
        const guiones = '-'.repeat(numGuiones);
        doc.text(guiones, 25 + lastLineWidth + 1, currentY - lineHeight);
      }
      
      currentY += 8; // Aumentado de 5 a 8 para más espacio entre cláusulas
    };

    // Helper function para formatear fecha en español
    const formatearFecha = (fecha) => {
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      // Manejar fechas que vienen como string de la BD
      const f = typeof fecha === 'string' 
        ? new Date(fecha.split('T')[0] + 'T12:00:00')
        : new Date(fecha);
      return `${f.getDate()} de ${meses[f.getMonth()]} de ${f.getFullYear()}`;
    };

    // Helper function para calcular fecha fin
    const calcularFechaFin = (fechaInicio, meses) => {
      // Crear fecha sin considerar zona horaria para evitar problemas
      const fecha = typeof fechaInicio === 'string' 
        ? new Date(fechaInicio.split('T')[0] + 'T12:00:00')
        : new Date(fechaInicio);
      fecha.setMonth(fecha.getMonth() + meses);
      return fecha;
    };

    // const getUsoPropiedad = (typeProperty) => {
    //   const usoComercial = ["oficina", "local", "finca"];
    //   const usoVivienda = ["casa", "departamento", "duplex"];
    //   const usoTerreno = ["lote", "terreno"];

    //   if (usoComercial.includes(typeProperty)) return "comercial";
    //   if (usoVivienda.includes(typeProperty)) return "vivienda particular";
    //   if (usoTerreno.includes(typeProperty)) return "terreno";
    //   return "vivienda particular";
    // };

    const numeroALetras = (numero) => {
      const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
      const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
      const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

      if (numero === 0) return "cero";
      if (numero === 100) return "cien";
      if (numero === 1000) return "mil";

      let texto = "";

      if (numero >= 1000) {
        const millar = Math.floor(numero / 1000);
        if (millar === 1) {
          texto += "mil ";
        } else {
          texto += numeroALetras(millar) + " mil ";
        }
        numero %= 1000;
      }

      if (numero >= 100) {
        const centena = Math.floor(numero / 100);
        texto += centenas[centena] + " ";
        numero %= 100;
      }

      if (numero > 0) {
        if (numero < 10) {
          texto += unidades[numero];
        } else {
          const decena = Math.floor(numero / 10);
          const unidad = numero % 10;
          texto += decenas[decena];
          if (unidad > 0) {
            texto += " y " + unidades[unidad];
          }
        }
      }

      return texto.trim();
    };

    const formatearMonto = (monto) => {
      const numero = Number(monto);
      return `${numeroALetras(numero).toUpperCase()} PESOS ($${new Intl.NumberFormat("es-AR").format(numero)},00)`;
    };

    // Extraer datos del lease con valores por defecto
    const property = lease.Property || {};
    const tenant = lease.Tenant || {};
    const landlord = lease.Landlord || {};
    const guarantors = lease.Garantors || [];

    // Determinar el tipo de contrato según typeProperty
    const getTituloContrato = (typeProperty) => {
      const comercial = ["oficina", "local", "finca"];
      const vivienda = ["casa", "departamento", "duplex"];
      
      if (comercial.includes(typeProperty)) {
        return "CONTRATO DE LOCACION DE LOCAL COMERCIAL";
      }
      if (vivienda.includes(typeProperty)) {
        return "CONTRATO DE LOCACION DE INMUEBLE CON DESTINO VIVIENDA";
      }
      // Para lote o terreno
      return "CONTRATO DE LOCACION DE INMUEBLE";
    };

    // Determinar el destino según typeProperty
    const getDestinoLocacion = (typeProperty) => {
      const comercial = ["oficina", "local", "finca"];
      const vivienda = ["casa", "departamento", "duplex"];
      
      if (comercial.includes(typeProperty)) {
        return "a fines comerciales";
      }
      if (vivienda.includes(typeProperty)) {
        return "a vivienda exclusivamente";
      }
      // Para lote o terreno
      return "al destino acordado";
    };

    // === GENERAR PDF ===

   doc.setFont("tahoma", "bold");
    doc.setFontSize(11);
    doc.text(getTituloContrato(property.typeProperty), 105, currentY, { align: "center" });
    currentY += 10;

    // Datos de las partes - con nombres en negrita
    addPageIfNecessary(50);
    doc.setFont("tahoma", "normal");
    doc.setFontSize(9);
    
    let partesY = currentY;
    
    if (property.socio) {
      const textPart1 = `Entre el Sr/Sra. ${landlord.name || 'N/A'}, CUIL ${landlord.cuil || 'N/A'}, con domicilio en ${landlord.direccion || 'N/A'}, de la ciudad de ${landlord.ciudad || 'N/A'}, correo electronico ${landlord.email || 'N/A'}, telefono ${landlord.mobilePhone || 'N/A'}, en caracter de propietario junto con ${property.socio}, en adelante denominados "LOS LOCADORES", por una parte, y por la otra el Sr/Sra ${tenant.name || 'N/A'}, CUIL ${tenant.cuil || 'N/A'}, con domicilio en ${tenant.direccion || 'N/A'}, ${tenant.ciudad || 'N/A'}, ${tenant.provincia || 'N/A'}, correo electronico ${tenant.email || 'N/A'}, telefono ${tenant.mobilePhone || 'N/A'}, en adelante denominado "LOCATARIO", convienen en celebrar el presente contrato de locacion, sujeto a las siguientes clausulas y condiciones:`;
      partesY = addText(textPart1, partesY);
    } else {
      const fullText1 = `Entre el Sr/Sra. ${landlord.name || 'N/A'}, CUIL ${landlord.cuil || 'N/A'}, con domicilio en ${landlord.direccion || 'N/A'}, de la ciudad de ${landlord.ciudad || 'N/A'}, correo electronico ${landlord.email || 'N/A'}, telefono ${landlord.mobilePhone || 'N/A'}, en adelante denominado "EL LOCADOR", por una parte, y por la otra el Sr/Sra ${tenant.name || 'N/A'}, CUIL ${tenant.cuil || 'N/A'}, con domicilio en ${tenant.direccion || 'N/A'}, ${tenant.ciudad || 'N/A'}, ${tenant.provincia || 'N/A'}, correo electronico ${tenant.email || 'N/A'}, telefono ${tenant.mobilePhone || 'N/A'}, en adelante denominado "EL LOCATARIO", convienen en celebrar el presente contrato de locacion, sujeto a las siguientes clausulas y condiciones:`;
      partesY = addText(fullText1, partesY);
    }
    
    currentY = partesY + 8;

    // Primera cláusula - Objeto
    addPageIfNecessary(40);
    const objetoText = `Por el Presente contrato, el locador cede el uso del inmueble sito en  ${property.address || 'N/A'}, ${property.city || 'N/A'}, por lo que, en contraprestación, EL LOCATARIO se obliga a pagar a EL LOCADOR en calidad de renta el monto referido en la cláusula Nº4, en la forma y oportunidad convenidas}`;
    addClause("PRIMERA: Objeto.", objetoText);

    // Segunda cláusula - Manifestación
    addPageIfNecessary(30);
    const manifestacionText = `Las partes convienen que el inmueble referido en la clausula primera sera destinado ${getDestinoLocacion(property.typeProperty)}. El Inmueble tiene Superficie cubierta: ${property.superficieCubierta || 'N/A'} m2, Superficie total: ${property.superficieTotal || 'N/A'} m2. ${property.typeProperty !== "lote" && property.typeProperty !== "terreno" && property.rooms ? `El inmueble cuenta con ${property.rooms} ambientes y ${property.bathrooms || 0} banos, ` : ""}y todas las demas especificaciones contenidas en clausula anexa al presente contrato de locacion.`;
    addClause("SEGUNDA: Destino de la locacion.", manifestacionText);

    // Tercera cláusula - Plazo del contrato
    const startDate = new Date(lease.startDate);
    const endDate = calcularFechaFin(startDate, lease.totalMonths);

    addPageIfNecessary(60);
    const cuartaClausulaText = `Las partes convienen fijar un plazo de duración determinada por el presente contrato. El cual será de  ${numeroALetras(lease.totalMonths)} (${lease.totalMonths}) meses, los mismos se computaran a partir del ${formatearFecha(startDate)}, y hasta el dia ${formatearFecha(endDate)}, recibiendo del locatario la tenencia del inmueble en el dia de la fecha. Es obligacion del locatario restituir al termino de la locacion el inmueble desocupado y en buen estado conforme a los art.1206 y 1207 del CCCN. Si ello no fuere cumplido se cobrara una multa equivalente al 0.4% diario sobre el ultimo alquiler hasta la entrega efectiva del inmueble locado y en las condiciones que le fue entregado.`;
    addClause("TERCERA: Plazo del contrato.", cuartaClausulaText);

    // Cuarta cláusula - Precio
    addPageIfNecessary(45);
    const quintaClausulaText = `El precio del alquiler se fija de comun acuerdo entre las partes por la suma de ${formatearMonto(lease.rentAmount)} para el ${lease.updateFrequency === "semestral" ? "primer semestre" : lease.updateFrequency === "anual" ? "primer ano" : "primer cuatrimestre"} de locacion. Para los ${lease.updateFrequency === "semestral" ? "siguientes semestres" : lease.updateFrequency === "anual" ? "siguientes anos" : "siguientes cuatrimestres"} el precio sera actualizado conforme al Indice de precios al consumidor (IPC) que confecciona y publica el Instituto Nacional de Estadisticas y Censos (INDEC). Si por una disposicion legal y futura, los alquileres se vieren grabados con el pago del impuesto al valor agregado (IVA), EL LOCATARIO debera adicionar al monto mensual a pagar en concepto de canon locativo, el porcentual correspondiente al IVA. El LOCATARIO abonara el alquiler en efectivo en moneda de curso legal, y por adelantado del 1° al 10° del mes en el local comercial de Q+L Servicios Inmobiliarios sito en Av. Gobernador Cubas N° 50 de la ciudad de Belen, o bien en el domicilio que en un futuro designe el LOCADOR. Por el presente acto el LOCADOR comunica al LOCATARIO que constituye a Q+L Servicios inmobiliarios, en adelante EL ADMINISTRADOR como su representante, quedando este facultado para actuar en su nombre en cualquier cuestion que emane del presente, percibir los alquileres mensuales y extender los correspondientes recibos de pago, tambien para conservar y archivar los comprobantes de pago de todos los impuestos, y servicios a cargo del LOCATARIO, quien tendra por constancia de pago el asiento de los mismos en los recibos de pago del alquiler. La falta de pago producira un interes equivalente al 1% diario contado a partir del primer dia del mes en mora.`;
    addClause("CUARTA: Precio:", quintaClausulaText);
    currentY += 1;

    // Quinta cláusula - Modificaciones
    addPageIfNecessary(30);
    const modificacionesText = `El LOCATARIO tiene expresamente prohibido efectuar mejoras o modificaciones que alteren la estructura del inmueble sin autorizacion previa y por escrito del LOCADOR. De autorizarse la realizacion de mejoras, estas quedan a beneficio del inmueble sin derecho para el Locatario a ninguna indemnizacion reembolso, compensacion y/o retribucion.`;
    addClause("QUINTA: Modificaciones:", modificacionesText);

    // Sexta cláusula - Impuestos y Servicios
    addPageIfNecessary(60);
    const impuestosText = `El LOCATARIO debe pagar en tiempo y forma los servicios de luz que debe estar a su nombre dando de baja al termino del presente Contrato como tambien cualquier otro servicio domiciliario y/o tributo que grave el inmueble en el futuro, entregando mensualmente al Locador o a la empresa inmobiliaria las boletas y/o facturas pagadas. Seran a cargo del LOCATARIO el pago del servicio de Agua (Medido o No Medido) durante todo el tiempo de duracion del contrato hasta su efectiva desocupacion. Seran a Cargo del LOCADOR Las Cargas y Contribuciones que graven el Inmueble: Impuestos Municipal - Impuesto Provincial, como asi tambien cualquier sobretasa, derecho adicional o impuestos nacionales, provinciales o municipales que pudieran crearse y afecten a la misma.`;
    addClause("SEXTA: Impuestos y Servicios:", impuestosText);

    // Séptima cláusula - Incumplimiento
    addPageIfNecessary(70);
    const incumplimientoText = `En cualquiera de los casos de incumplimiento del LOCATARIO, sin perjuicio de las penalidades que se establecen en las demas clausulas, el LOCADOR podra pedir el cumplimiento de este contrato o resolverlo por culpa del LOCATARIO y solicitar el inmediato desalojo de este o quienes ocupen el inmueble (sanciones ART.1086 CC y C). En ambos casos y para el evento de que el LOCATARIO dejare abandonada la unidad, o depositare judicialmente las llaves debera abonar al LOCADOR una multa igual al alquiler pactado desde la iniciacion del juicio hasta el dia en que el LOCADOR tome libre y efectiva tenencia definitiva de la propiedad, debiendo indemnizarlo tambien por danos y perjuicios sufridos. Sin perjuicio de lo expuesto en caso de abandono, y para evitar los posibles deterioros que pudieran producirse y/o la ocupacion ilegal de terceros, queda facultado el LOCADOR a tomar posesion anticipada de la propiedad con auxilio del cerrajero, labrandose acta en tal sentido por Oficial Publico, y constituyendose en depositario de los bienes propiedad del LOCATARIO, que pudieron hallarse en el lugar, por el termino de tres meses contados desde el dia de practicamente la diligencia. Vencido el plazo del deposito, se entendera que el locatario.`;
    addClause("SEPTIMA: Incumplimiento:", incumplimientoText);

    // Octava cláusula - Irresponsabilidad
    addPageIfNecessary(50);
    const irresponsabilidadText = `El LOCADOR no se responsabiliza por danos, perjuicio, lesiones que puedan producirse al LOCATARIO o a las personas que pudieren encontrarse en el inmueble, que resulten como consecuencia de la accion u omision del Locatario y/o terceros por el uso y goce del inmueble, ni como consecuencia de inundaciones, filtraciones, incendios total o parcial, ruinas, desprendimientos roturas, desperfecto de cualquier tipo y/o por caso fortuito o de fuerza mayor y sus consecuencias.`;
    addClause("OCTAVA: Irresponsabilidad:", irresponsabilidadText);

    // Novena cláusula - Resolución Anticipada
    addPageIfNecessary(50);
    const resolucionText = `1 El LOCATARIO podra resolver este contrato sin expresion de causa y de forma anticipada luego de transcurridos los primeros seis (6) meses de locacion, notificando su decision al LOCADOR con un (1) mes de anticipacion. 2- si la resolucion fuere durante el primer ano de contrato, el locatario abonara al locador como indemnizacion el monto de un mes y medio (1,5) de alquiler. 3-cuando la resolucion fuese pasado el primer ano, la indemnizacion sera de un (1) mes de alquiler. 4 a todos los efectos los meses seran indivisibles y enteros o completos.`;
    addClause("NOVENA: Resolución Anticipada:", resolucionText);

    // Décima cláusula - Intransferibilidad
    addPageIfNecessary(30);
    const intransferibilidadText = `EL LOCATARIO no podra subarrendar, permutar, prestar o ceder en todo o en parte el inmueble objeto de este acto, ni transferir los derechos del presente contrato constituyendo su incumplimiento como causal de rescision del presente contrato.`;
    addClause("DECIMA: Intransferibilidad:", intransferibilidadText);

    // Décima Primera cláusula - Sanciones
    addPageIfNecessary(40);
    const sancionesText = `Conforme a lo establecido en la clausula septima, la violacion por parte del LOCATARIO de cualquiera de las obligaciones que asume en el presente, dara derecho al LOCADOR para optar entre exigir su cabal cumplimiento o dar por resuelto el presente contrato y exigir el inmediato desalojo del inmueble, con mas el pago de las clausulas penales pactadas y/o danos y perjuicios pertinentes. Pudiendo accionar contra la totalidad del patrimonio del LOCATARIO.`;
    addClause("DECIMA PRIMERA: Sanciones:", sancionesText);
    currentY += 1;

    // Décima Segunda cláusula - Fianza (Garantes)
    if (guarantors.length > 0) {
      guarantors.forEach((guarantor, index) => {
        addPageIfNecessary(80);
        const garanteTitle = `DECIMA SEGUNDA${index > 0 ? ` (${index + 1})` : ''}: Fianza.Garante:`;
        const guarantorText = `El Sr/Sra ${guarantor.name}, que acredita su identidad con CUIL ${guarantor.cuil}, nacionalidad Argentina, con domicilio en ${guarantor.address}, telefono ${guarantor.mobilePhone || 'N/A'}, correo electronico: ${guarantor.email || 'N/A'}, quien manifiesta no tener capacidad restringida para este acto, a estos efectos exhibe el recibo de sueldo del Gobierno de la provincia de Catamarca, el que acredita ${guarantor.description}. Quien se constituye a los efectos de este contrato en Fiador/a solidario/a, liso, llano y principal pagador/a de los alquileres, impuestos, servicios adeudados por el LOCATARIO. La parte Fiadora renuncia a los beneficios de division y excusion y declara expresamente que, si al vencimiento del contrato el Locatario permaneciese en el uso y goce del bien locado, su responsabilidad y fianza continuaran en vigencia hasta el momento en que el Locatario entregue en devolucion a la Locadora la propiedad libre de ocupantes y en las demas condiciones establecidas en este contrato. Comprometiendose en este acto que si por alguna circunstancia propia o ajena, cambiara de empleador o bien de domicilio laboral, lo comunicara inmediatamente al Locador, o sus representantes, mediante notificacion fehaciente. Es ademas obligacion del Fiador, vigilar que el Locatario cumpla con todas y cada una de las obligaciones contraidas en este Contrato de Locacion. Asimismo se avienen al pago de los alquileres adeudados por el Locatario, con la sola presentacion de los recibos de alquileres respectivos. REEMPLAZO DE LOS GARANTES: En caso de falencia, insolvencia, fallecimiento, desaparición y responsabilidad manifiesta, etc. del o de los fiadores, el LOCADOR podrá requerir un nuevo garante fiador, en término de cinco (5) días corridos, cuya solvencia no podrá ser inferior a la anterior, quedando ésta, a juicio y satisfacción de la locadora. En caso de incumplimiento de esta obligación por parte del LOCATARIO, quedará resuelto el contrato, como si el convenio fuese a término vencido. Es obligación del LOCATARIO dar aviso al LOCADOR en caso de presentarse alguna de las mencionadas circunstancias.`;
        addClause(garanteTitle, guarantorText);
      });
    }

    // Décima Tercera cláusula - Renovación
    addPageIfNecessary(30);
    const renovacionText = `Este contrato no puede ser prorrogado total o parcialmente ni renovado por identico periodo sin previo acuerdo escrito de las partes acerca de las nuevas condiciones del arrendamiento, especialmente sobre el precio del alquiler.`;
    addClause("DECIMA TERCERA: Renovación:", renovacionText);

    // Décima Cuarta cláusula - Estado del Bien Locado
    addPageIfNecessary(70);
    const estadoBienText = `A los efectos de la restitucion del inmueble, una vez vencido el termino contractual, se aclara que el LOCATARIO debera proceder de la siguiente manera: 1) El inmueble debera restituirse en el mismo buen estado de conservacion higiene en que fue entregado y segun consta en el anexo N°1. El LOCATARIO no podra eludir esta obligacion contraida en el presente, dejando aclarado que el LOCADOR y/o sus representantes no estan obligados a recibir el inmueble si no se diera cumplimiento a lo estipulado anteriormente, haciendose punible el LOCATARIO de la penalidad establecida en el presente o la demora en la entrega del inmueble y a satisfacer el importe de alquiler mensual por todo el tiempo necesario que transcurra hasta que los desperfectos o deterioros sean reparados, o hasta que las deudas por servicios e impuestos sean canceladas.`;
    addClause("DECIMA CUARTA: Estado del Bien Locado:", estadoBienText);
    currentY += 1;

    // Inventario
    let inventarioLimpio = (lease.inventory || 'Sin inventario especificado')
      .replace(/\\n/g, '\n')
      .replace(/\n-/g, '\n• ');

    // Usar addLongText para manejar inventarios largos con saltos de página automáticos
    doc.setFont("tahoma", "bold");
    doc.text("INVENTARIO:", 25, currentY);
    currentY += lineHeight;
    doc.setFont("tahoma", "normal");
    currentY = addLongText(inventarioLimpio, currentY, 7, false, true);
    currentY += 6;

    // Décima Quinta cláusula - Competencia
    addPageIfNecessary(60);
    doc.setFont("tahoma", "bold");
    doc.text("DECIMA QUINTA: COMPETENCIA - Domicilios - Jurisdiccion y Competencia:", 25, currentY);
    currentY += lineHeight;
    doc.setFont("tahoma", "normal");
    const competenciaText = `Las partes que suscriben este contrato renuncian al fuero federal o a cualquier otro que pudiera corresponder y se someten a la jurisdiccion de la justicia ordinaria de la ciudad de Belen para cualquier cuestion que se suscite entre las mismas, constituyendo domicilio para todos los efectos: el LOCADOR fija domicilio en el constituido como domicilio de pago en la clausula sexta del presente, el FIADOR y el COMERCIANTE lo hacen en la propiedad por el presente locada, renunciando expresamente todos ellos al Fuero Federal, en caso de corresponderles, sometiendose para cualquier cuestion derivada del presente a la jurisdiccion de los Tribunales ordinarios de la provincia de Catamarca.`;
    const linesCompetencia = doc.splitTextToSize(competenciaText, maxWidth);
    linesCompetencia.forEach(line => {
      if (currentY + lineHeight + bottomMargin > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, 25, currentY, { align: 'justify', maxWidth: maxWidth });
      currentY += lineHeight;
    });
    currentY += 5;

    // Décima Sexta cláusula - Firma y Ejemplares
    addPageIfNecessary(40);
    doc.setFont("tahoma", "bold");
    doc.text("DECIMA SEXTA: FIRMA Y EJEMPLARES:", 25, currentY);
    currentY += lineHeight;
    doc.setFont("tahoma", "normal");
    const firmaEjemplaresText = `Se pacta expresamente que el impuesto de sello provincial sera abonado integramente por el LOCATARIO. Leido, las partes, declaran su conformidad y firman tres (3) ejemplares de un mismo tenor y a un solo efecto, en la Ciudad de Belen ${formatearFecha(new Date())}.`;
    const linesFirmaEjemplares = doc.splitTextToSize(firmaEjemplaresText, maxWidth);
    linesFirmaEjemplares.forEach(line => {
      if (currentY + lineHeight + bottomMargin > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, 25, currentY, { align: 'justify', maxWidth: maxWidth });
      currentY += lineHeight;
    });
    currentY += 6;

    // Garantes
    if (guarantors.length > 0) {
      guarantors.forEach((guarantor, index) => {
        addPageIfNecessary(25);
        doc.setFont("tahoma", "bold");
        const garanteTitle = `DECIMO QUINTO${index > 0 ? ` (${index + 1})` : ''}: Fianza.`;
        doc.text(garanteTitle, 25, currentY);
        const garanteWidth = doc.getTextWidth(garanteTitle + " ");
        doc.setFont("tahoma", "normal");
        const guarantorText = `El Sr/Sra ${guarantor.name}, CUIL ${guarantor.cuil}, con domicilio en ${guarantor.address}, se constituye en fiador solidario, liso, llano y principal pagador de todas y cada una de las obligaciones contraidas por el LOCATARIO en el presente contrato.`;
        const linesG = doc.splitTextToSize(guarantorText, maxWidth - garanteWidth);
        doc.text(linesG[0], 25 + garanteWidth, currentY);
        currentY += lineHeight;
        for (let i = 1; i < linesG.length; i++) {
          doc.text(linesG[i], 25, currentY);
          currentY += lineHeight;
        }
        currentY += 5;
      });
    }

    // Firmas
    addPageIfNecessary(50);
    currentY += 20;
    
    // Líneas de firma del locador y locatario
    doc.setFont("tahoma", "normal");
    doc.setFontSize(7);
    doc.line(25, currentY, 85, currentY); // Línea izquierda
    doc.line(110, currentY, 170, currentY); // Línea derecha
    
    currentY += 8;
    doc.text("Firma del LOCADOR", 55, currentY, { align: "center" });
    doc.text("Firma del LOCATARIO", 140, currentY, { align: "center" });
    
    // Agregar líneas de firma para los fiadores si existen
    if (guarantors.length > 0) {
      currentY += 20;
      guarantors.forEach((guarantor, index) => {
        if (index % 2 === 0 && index > 0) {
          // Nueva línea cada 2 garantes
          currentY += 15;
        }
        
        const xPos = index % 2 === 0 ? 25 : 110;
        const labelXPos = index % 2 === 0 ? 55 : 140;
        
        doc.line(xPos, currentY, xPos + 60, currentY);
        doc.text(`Firma del FIADOR${guarantors.length > 1 ? ` ${index + 1}` : ''}`, labelXPos, currentY + 8, { align: "center" });
      });
    }

    // Guardar el PDF
    const fechaArchivo = new Date(lease.startDate).toLocaleDateString("es-AR").replace(/\//g, '_');
    doc.save(`Contrato_${lease.id}_${fechaArchivo}.pdf`);
  };

  // Si autoGenerate es true, generar automáticamente
  if (autoGenerate) {
    setTimeout(() => generatePdf(), 100);
    return null;
  }

  return (
    <div className="mt-4">
      <button
        onClick={generatePdf}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Generar Contrato PDF
      </button>
    </div>
  );
};

ContratoAlquiler.propTypes = {
  lease: PropTypes.object,
  autoGenerate: PropTypes.bool,
};

export default ContratoAlquiler;