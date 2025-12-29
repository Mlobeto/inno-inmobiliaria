import PropTypes from 'prop-types';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Configurar las fuentes de pdfMake
if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts.default && pdfFonts.default.pdfMake) {
  pdfMake.vfs = pdfFonts.default.pdfMake.vfs;
} else {
  pdfMake.vfs = pdfFonts;
}

const ContratoAlquiler = ({ lease, autoGenerate = false }) => {
  
  // Función para convertir números a letras
  const numeroALetras = (num) => {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    
    if (num === 0) return 'cero';
    if (num < 10) return unidades[num];
    if (num >= 10 && num < 20) return especiales[num - 10];
    if (num >= 20 && num < 100) {
      const decena = Math.floor(num / 10);
      const unidad = num % 10;
      return unidad === 0 ? decenas[decena] : `${decenas[decena]} y ${unidades[unidad]}`;
    }
    return num.toString();
  };

  // Función para formatear fecha
  const formatearFecha = (date) => {
    const d = typeof date === 'string' ? new Date(date.split('T')[0] + 'T12:00:00') : new Date(date);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // Función para formatear montos
  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(monto);
  };

  // Función para calcular fecha fin
  const calcularFechaFin = (startDate, months) => {
    const fecha = new Date(startDate);
    fecha.setMonth(fecha.getMonth() + months);
    fecha.setDate(fecha.getDate() - 1);
    return fecha;
  };

  const generatePdf = () => {
    if (!lease || !lease.Property || !lease.Tenant || !lease.Landlord) {
      alert('Faltan datos del contrato');
      return;
    }

    const property = lease.Property;
    const tenant = lease.Tenant;
    const landlord = lease.Landlord;
    const guarantors = lease.Garantors || [];

    // Determinar tipo de contrato según typeProperty
    const getTituloContrato = (typeProperty) => {
      const comercial = ["oficina", "local", "finca"];
      const vivienda = ["casa", "departamento", "duplex"];
      
      if (comercial.includes(typeProperty)) {
        return "CONTRATO DE LOCACION DE LOCAL COMERCIAL";
      }
      if (vivienda.includes(typeProperty)) {
        return "CONTRATO DE LOCACION DE INMUEBLE CON DESTINO VIVIENDA";
      }
      return "CONTRATO DE LOCACION DE INMUEBLE";
    };

    // Determinar destino según typeProperty
    const getDestinoLocacion = (typeProperty) => {
      const comercial = ["oficina", "local", "finca"];
      const vivienda = ["casa", "departamento", "duplex"];
      
      if (comercial.includes(typeProperty)) {
        return "a fines comerciales";
      }
      if (vivienda.includes(typeProperty)) {
        return "a vivienda exclusivamente";
      }
      return "al destino acordado";
    };

    // Calcular fechas
    const startDate = new Date(lease.startDate);
    const endDate = calcularFechaFin(startDate, lease.totalMonths);

    // Estilos reutilizables
    const styles = {
      header: {
        fontSize: 11,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      clauseTitle: {
        fontSize: 9,
        bold: true,
        margin: [0, 8, 0, 4]
      },
      body: {
        fontSize: 9,
        alignment: 'justify',
        margin: [0, 0, 0, 6]
      },
      inventoryTitle: {
        fontSize: 9,
        bold: true,
        margin: [0, 8, 0, 4]
      },
      inventory: {
        fontSize: 9,
        margin: [0, 0, 0, 6]
      },
      signature: {
        fontSize: 7,
        alignment: 'center',
        margin: [0, 4, 0, 0]
      }
    };

    // Texto de las partes
    let partesText;
    if (property.socio) {
      partesText = `Entre el Sr/Sra. ${landlord.name || 'N/A'}, CUIL ${landlord.cuil || 'N/A'}, con domicilio en ${landlord.direccion || 'N/A'}, de la ciudad de ${landlord.ciudad || 'N/A'}, correo electronico ${landlord.email || 'N/A'}, telefono ${landlord.mobilePhone || 'N/A'}, en caracter de propietario junto con ${property.socio}, en adelante denominados "LOS LOCADORES", por una parte, y por la otra el Sr/Sra ${tenant.name || 'N/A'}, CUIL ${tenant.cuil || 'N/A'}, con domicilio en ${tenant.direccion || 'N/A'}, ${tenant.ciudad || 'N/A'}, ${tenant.provincia || 'N/A'}, correo electronico ${tenant.email || 'N/A'}, telefono ${tenant.mobilePhone || 'N/A'}, en adelante denominado "LOCATARIO", convienen en celebrar el presente contrato de locacion, sujeto a las siguientes clausulas y condiciones:`;
    } else {
      partesText = `Entre el Sr/Sra. ${landlord.name || 'N/A'}, CUIL ${landlord.cuil || 'N/A'}, con domicilio en ${landlord.direccion || 'N/A'}, de la ciudad de ${landlord.ciudad || 'N/A'}, correo electronico ${landlord.email || 'N/A'}, telefono ${landlord.mobilePhone || 'N/A'}, en adelante denominado "EL LOCADOR", por una parte, y por la otra el Sr/Sra ${tenant.name || 'N/A'}, CUIL ${tenant.cuil || 'N/A'}, con domicilio en ${tenant.direccion || 'N/A'}, ${tenant.ciudad || 'N/A'}, ${tenant.provincia || 'N/A'}, correo electronico ${tenant.email || 'N/A'}, telefono ${tenant.mobilePhone || 'N/A'}, en adelante denominado "EL LOCATARIO", convienen en celebrar el presente contrato de locacion, sujeto a las siguientes clausulas y condiciones:`;
    }

    // Cláusulas del contrato
    const clausulas = [
      {
        title: "PRIMERA: Objeto.",
        text: `Por el Presente contrato, el locador cede el uso del inmueble sito en  ${property.address || 'N/A'}, ${property.city || 'N/A'}, por lo que, en contraprestación, EL LOCATARIO se obliga a pagar a EL LOCADOR en calidad de renta el monto referido en la cláusula Nº4, en la forma y oportunidad convenidas.`
      },
      {
        title: "SEGUNDA: Destino de la locacion.",
        text: `Las partes convienen que el inmueble referido en la clausula primera sera destinado ${getDestinoLocacion(property.typeProperty)}. El Inmueble tiene Superficie cubierta: ${property.superficieCubierta || 'N/A'} m2, Superficie total: ${property.superficieTotal || 'N/A'} m2. ${property.typeProperty !== "lote" && property.typeProperty !== "terreno" && property.rooms ? `El inmueble cuenta con ${property.rooms} ambientes y ${property.bathrooms || 0} banos, ` : ""}y todas las demas especificaciones contenidas en clausula anexa al presente contrato de locacion.`
      },
      {
        title: "TERCERA: Plazo del contrato.",
        text: `Las partes convienen fijar un plazo de duración determinada por el presente contrato. El cual será de  ${numeroALetras(lease.totalMonths)} (${lease.totalMonths}) meses, los mismos se computaran a partir del ${formatearFecha(startDate)}, y hasta el dia ${formatearFecha(endDate)}, recibiendo del locatario la tenencia del inmueble en el dia de la fecha. Es obligacion del locatario restituir al termino de la locacion el inmueble desocupado y en buen estado conforme a los art.1206 y 1207 del CCCN. Si ello no fuere cumplido se cobrara una multa equivalente al 0.4% diario sobre el ultimo alquiler hasta la entrega efectiva del inmueble locado y en las condiciones que le fue entregado.`
      },
      {
        title: "CUARTA: Precio:",
        text: `El precio del alquiler se fija de comun acuerdo entre las partes por la suma de ${formatearMonto(lease.rentAmount)} para el ${lease.updateFrequency === "semestral" ? "primer semestre" : lease.updateFrequency === "anual" ? "primer ano" : "primer cuatrimestre"} de locacion. Para los ${lease.updateFrequency === "semestral" ? "siguientes semestres" : lease.updateFrequency === "anual" ? "siguientes anos" : "siguientes cuatrimestres"} el precio sera actualizado conforme al Indice de precios al consumidor (IPC) que confecciona y publica el Instituto Nacional de Estadisticas y Censos (INDEC). Si por una disposicion legal y futura, los alquileres se vieren grabados con el pago del impuesto al valor agregado (IVA), EL LOCATARIO debera adicionar al monto mensual a pagar en concepto de canon locativo, el porcentual correspondiente al IVA. El LOCATARIO abonara el alquiler en efectivo en moneda de curso legal, y por adelantado del 1° al 10° del mes en el local comercial de Q+L Servicios Inmobiliarios sito en Av. Gobernador Cubas N° 50 de la ciudad de Belen, o bien en el domicilio que en un futuro designe el LOCADOR. Por el presente acto el LOCADOR comunica al LOCATARIO que constituye a Q+L Servicios inmobiliarios, en adelante EL ADMINISTRADOR como su representante, quedando este facultado para actuar en su nombre en cualquier cuestion que emane del presente, percibir los alquileres mensuales y extender los correspondientes recibos de pago, tambien para conservar y archivar los comprobantes de pago de todos los impuestos, y servicios a cargo del LOCATARIO, quien tendra por constancia de pago el asiento de los mismos en los recibos de pago del alquiler. La falta de pago producira un interes equivalente al 1% diario contado a partir del primer dia del mes en mora.`
      },
      {
        title: "QUINTA: Modificaciones:",
        text: `El LOCATARIO tiene expresamente prohibido efectuar mejoras o modificaciones que alteren la estructura del inmueble sin autorizacion previa y por escrito del LOCADOR. De autorizarse la realizacion de mejoras, estas quedan a beneficio del inmueble sin derecho para el Locatario a ninguna indemnizacion reembolso, compensacion y/o retribucion.`
      },
      {
        title: "SEXTA: Impuestos y Servicios:",
        text: `El LOCATARIO debe pagar en tiempo y forma los servicios de luz que debe estar a su nombre dando de baja al termino del presente Contrato como tambien cualquier otro servicio domiciliario y/o tributo que grave el inmueble en el futuro, entregando mensualmente al Locador o a la empresa inmobiliaria las boletas y/o facturas pagadas. Seran a cargo del LOCATARIO el pago del servicio de Agua (Medido o No Medido) durante todo el tiempo de duracion del contrato hasta su efectiva desocupacion. Seran a Cargo del LOCADOR Las Cargas y Contribuciones que graven el Inmueble: Impuestos Municipal - Impuesto Provincial, como asi tambien cualquier sobretasa, derecho adicional o impuestos nacionales, provinciales o municipales que pudieran crearse y afecten a la misma.`
      },
      {
        title: "SEPTIMA: Incumplimiento:",
        text: `En cualquiera de los casos de incumplimiento del LOCATARIO, sin perjuicio de las penalidades que se establecen en las demas clausulas, el LOCADOR podra pedir el cumplimiento de este contrato o resolverlo por culpa del LOCATARIO y solicitar el inmediato desalojo de este o quienes ocupen el inmueble (sanciones ART.1086 CC y C). En ambos casos y para el evento de que el LOCATARIO dejare abandonada la unidad, o depositare judicialmente las llaves debera abonar al LOCADOR una multa igual al alquiler pactado desde la iniciacion del juicio hasta el dia en que el LOCADOR tome libre y efectiva tenencia definitiva de la propiedad, debiendo indemnizarlo tambien por danos y perjuicios sufridos. Sin perjuicio de lo expuesto en caso de abandono, y para evitar los posibles deterioros que pudieran producirse y/o la ocupacion ilegal de terceros, queda facultado el LOCADOR a tomar posesion anticipada de la propiedad con auxilio del cerrajero, labrandose acta en tal sentido por Oficial Publico, y constituyendose en depositario de los bienes propiedad del LOCATARIO, que pudieron hallarse en el lugar, por el termino de tres meses contados desde el dia de practicamente la diligencia. Vencido el plazo del deposito, se entendera que el locatario.`
      },
      {
        title: "OCTAVA: Irresponsabilidad:",
        text: `El LOCADOR no se responsabiliza por danos, perjuicio, lesiones que puedan producirse al LOCATARIO o a las personas que pudieren encontrarse en el inmueble, que resulten como consecuencia de la accion u omision del Locatario y/o terceros por el uso y goce del inmueble, ni como consecuencia de inundaciones, filtraciones, incendios total o parcial, ruinas, desprendimientos roturas, desperfecto de cualquier tipo y/o por caso fortuito o de fuerza mayor y sus consecuencias.`
      },
      {
        title: "NOVENA: Resolución Anticipada:",
        text: `1 El LOCATARIO podra resolver este contrato sin expresion de causa y de forma anticipada luego de transcurridos los primeros seis (6) meses de locacion, notificando su decision al LOCADOR con un (1) mes de anticipacion. 2- si la resolucion fuere durante el primer ano de contrato, el locatario abonara al locador como indemnizacion el monto de un mes y medio (1,5) de alquiler. 3-cuando la resolucion fuese pasado el primer ano, la indemnizacion sera de un (1) mes de alquiler. 4 a todos los efectos los meses seran indivisibles y enteros o completos.`
      },
      {
        title: "DECIMA: Intransferibilidad:",
        text: `EL LOCATARIO no podra subarrendar, permutar, prestar o ceder en todo o en parte el inmueble objeto de este acto, ni transferir los derechos del presente contrato constituyendo su incumplimiento como causal de rescision del presente contrato.`
      },
      {
        title: "DECIMA PRIMERA: Sanciones:",
        text: `Conforme a lo establecido en la clausula septima, la violacion por parte del LOCATARIO de cualquiera de las obligaciones que asume en el presente, dara derecho al LOCADOR para optar entre exigir su cabal cumplimiento o dar por resuelto el presente contrato y exigir el inmediato desalojo del inmueble, con mas el pago de las clausulas penales pactadas y/o danos y perjuicios pertinentes. Pudiendo accionar contra la totalidad del patrimonio del LOCATARIO.`
      }
    ];

    // Agregar cláusulas de garantes
    const garantesClauses = guarantors.map((guarantor, index) => ({
      title: `DECIMA SEGUNDA${index > 0 ? ` (${index + 1})` : ''}: Fianza.Garante:`,
      text: `El Sr/Sra ${guarantor.name}, que acredita su identidad con CUIL ${guarantor.cuil}, nacionalidad Argentina, con domicilio en ${guarantor.address}, telefono ${guarantor.mobilePhone || 'N/A'}, correo electronico: ${guarantor.email || 'N/A'}, quien manifiesta no tener capacidad restringida para este acto, a estos efectos exhibe el recibo de sueldo del Gobierno de la provincia de Catamarca, el que acredita ${guarantor.description}. Quien se constituye a los efectos de este contrato en Fiador/a solidario/a, liso, llano y principal pagador/a de los alquileres, impuestos, servicios adeudados por el LOCATARIO. La parte Fiadora renuncia a los beneficios de division y excusion y declara expresamente que, si al vencimiento del contrato el Locatario permaneciese en el uso y goce del bien locado, su responsabilidad y fianza continuaran en vigencia hasta el momento en que el Locatario entregue en devolucion a la Locadora la propiedad libre de ocupantes y en las demas condiciones establecidas en este contrato. Comprometiendose en este acto que si por alguna circunstancia propia o ajena, cambiara de empleador o bien de domicilio laboral, lo comunicara inmediatamente al Locador, o sus representantes, mediante notificacion fehaciente. Es ademas obligacion del Fiador, vigilar que el Locatario cumpla con todas y cada una de las obligaciones contraidas en este Contrato de Locacion. Asimismo se avienen al pago de los alquileres adeudados por el Locatario, con la sola presentacion de los recibos de alquileres respectivos. REEMPLAZO DE LOS GARANTES: En caso de falencia, insolvencia, fallecimiento, desaparición y responsabilidad manifiesta, etc. del o de los fiadores, el LOCADOR podrá requerir un nuevo garante fiador, en término de cinco (5) días corridos, cuya solvencia no podrá ser inferior a la anterior, quedando ésta, a juicio y satisfacción de la locadora. En caso de incumplimiento de esta obligación por parte del LOCATARIO, quedará resuelto el contrato, como si el convenio fuese a término vencido. Es obligación del LOCATARIO dar aviso al LOCADOR en caso de presentarse alguna de las mencionadas circunstancias.`
    }));

    // Cláusulas finales
    const clausulasFinales = [
      {
        title: "DECIMA TERCERA: Renovación:",
        text: `Este contrato no puede ser prorrogado total o parcialmente ni renovado por identico periodo sin previo acuerdo escrito de las partes acerca de las nuevas condiciones del arrendamiento, especialmente sobre el precio del alquiler.`
      },
      {
        title: "DECIMA CUARTA: Estado del Bien Locado:",
        text: `A los efectos de la restitucion del inmueble, una vez vencido el termino contractual, se aclara que el LOCATARIO debera proceder de la siguiente manera: 1) El inmueble debera restituirse en el mismo buen estado de conservacion higiene en que fue entregado y segun consta en el anexo N°1. El LOCATARIO no podra eludir esta obligacion contraida en el presente, dejando aclarado que el LOCADOR y/o sus representantes no estan obligados a recibir el inmueble si no se diera cumplimiento a lo estipulado anteriormente, haciendose punible el LOCATARIO de la penalidad establecida en el presente o la demora en la entrega del inmueble y a satisfacer el importe de alquiler mensual por todo el tiempo necesario que transcurra hasta que los desperfectos o deterioros sean reparados, o hasta que las deudas por servicios e impuestos sean canceladas.`
      },
      {
        title: "DECIMA QUINTA: COMPETENCIA - Domicilios - Jurisdiccion y Competencia:",
        text: `Las partes que suscriben este contrato renuncian al fuero federal o a cualquier otro que pudiera corresponder y se someten a la jurisdiccion de la justicia ordinaria de la ciudad de Belen para cualquier cuestion que se suscite entre las mismas, constituyendo domicilio para todos los efectos: el LOCADOR fija domicilio en el constituido como domicilio de pago en la clausula sexta del presente, el FIADOR y el COMERCIANTE lo hacen en la propiedad por el presente locada, renunciando expresamente todos ellos al Fuero Federal, en caso de corresponderles, sometiendose para cualquier cuestion derivada del presente a la jurisdiccion de los Tribunales ordinarios de la provincia de Catamarca.`
      },
      {
        title: "DECIMA SEXTA: FIRMA Y EJEMPLARES:",
        text: `Se pacta expresamente que el impuesto de sello provincial sera abonado integramente por el LOCATARIO. Leido, las partes, declaran su conformidad y firman tres (3) ejemplares de un mismo tenor y a un solo efecto, en la Ciudad de Belen ${formatearFecha(new Date())}.`
      }
    ];

    // Preparar inventario
    const inventarioText = (lease.inventory || 'Sin inventario especificado')
      .replace(/\\n/g, '\n')
      .replace(/\n-/g, '\n• ');

    // Contenido del documento
    const content = [
      // Título
      { text: getTituloContrato(property.typeProperty), style: 'header' },
      
      // Partes
      { text: partesText, style: 'body' },
      
      // Cláusulas principales
      ...clausulas.map(c => [
        { text: c.title, style: 'clauseTitle' },
        { text: c.text, style: 'body' }
      ]).flat(),
      
      // Cláusulas de garantes
      ...garantesClauses.map(c => [
        { text: c.title, style: 'clauseTitle' },
        { text: c.text, style: 'body' }
      ]).flat(),
      
      // Cláusulas finales
      ...clausulasFinales.map(c => [
        { text: c.title, style: 'clauseTitle' },
        { text: c.text, style: 'body' }
      ]).flat(),
      
      // Inventario
      { text: 'INVENTARIO:', style: 'inventoryTitle' },
      { text: inventarioText, style: 'inventory' },
      
      // Espacio para firmas
      { text: '', margin: [0, 20, 0, 0] },
      
      // Líneas de firma
      {
        columns: [
          {
            width: '45%',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
              { text: 'Firma del LOCADOR', style: 'signature' }
            ]
          },
          { width: '10%', text: '' },
          {
            width: '45%',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
              { text: 'Firma del LOCATARIO', style: 'signature' }
            ]
          }
        ]
      }
    ];

    // Agregar firmas de garantes si existen
    if (guarantors.length > 0) {
      content.push({ text: '', margin: [0, 15, 0, 0] });
      
      for (let i = 0; i < guarantors.length; i += 2) {
        const cols = [
          {
            width: '45%',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
              { text: `Firma del FIADOR${guarantors.length > 1 ? ` ${i + 1}` : ''}`, style: 'signature' }
            ]
          }
        ];
        
        if (guarantors[i + 1]) {
          cols.push({ width: '10%', text: '' });
          cols.push({
            width: '45%',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
              { text: `Firma del FIADOR ${i + 2}`, style: 'signature' }
            ]
          });
        }
        
        content.push({ columns: cols, margin: [0, 0, 0, 10] });
      }
    }

    // Definición del documento
    const docDefinition = {
      content: content,
      styles: styles,
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60], // [izquierda, superior, derecha, inferior]
      defaultStyle: {
        font: 'Roboto'
      }
    };

    // Generar y descargar el PDF
    const fechaArchivo = formatearFecha(new Date(lease.startDate)).replace(/\//g, '_');
    pdfMake.createPdf(docDefinition).download(`Contrato_${lease.id}_${fechaArchivo}.pdf`);
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
