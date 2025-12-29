// Utilidad para generar el HTML del contrato desde los datos del lease
export const generarHTMLContrato = (lease) => {
  const property = lease.Property || {};
  const tenant = lease.Tenant || {};
  const landlord = lease.Landlord || {};
  const guarantors = lease.Garantors || [];

  // Funciones auxiliares
  const formatearFecha = (fecha) => {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const f = new Date(fecha);
    return `${f.getDate()} de ${meses[f.getMonth()]} de ${f.getFullYear()}`;
  };

  const calcularFechaFin = (fechaInicio, meses) => {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + meses);
    return fecha;
  };

  const getUsoPropiedad = (typeProperty) => {
    const usoComercial = ["oficina", "local", "finca"];
    const usoVivienda = ["casa", "departamento", "duplex"];
    const usoTerreno = ["lote", "terreno"];

    if (usoComercial.includes(typeProperty)) return "comercial";
    if (usoVivienda.includes(typeProperty)) return "vivienda particular";
    if (usoTerreno.includes(typeProperty)) return "terreno";
    return "vivienda particular";
  };

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

  const startDate = new Date(lease.startDate);
  const endDate = calcularFechaFin(startDate, lease.totalMonths);

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

  // Generar HTML
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato de Locación #${lease.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap');
    
    body {
      font-family: 'Nunito', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      font-size: 11pt;
    }
    h1 {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 30px;
    }
    p {
      text-align: justify;
      margin: 10px 0;
    }
    .fecha {
      margin: 20px 0;
    }
    .clausula {
      margin: 15px 0;
    }
    .titulo-clausula {
      font-weight: bold;
    }
    .inventario {
      white-space: pre-wrap;
      margin: 15px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-left: 3px solid #007bff;
      text-align: left;
    }
    .firmas {
      margin-top: 60px;
      display: flex;
      justify-content: space-around;
    }
    .firma {
      text-align: center;
      padding-top: 50px;
      border-top: 2px solid #000;
      width: 250px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <h1>${getTituloContrato(property.typeProperty)}</h1>
  
  <p class="fecha">En Belen, Provincia de Buenos Aires, a los ${formatearFecha(lease.startDate)}</p>
  
  <p>
    ${property.socio 
      ? `Entre el Sr/Sra. <strong>${landlord.name || 'N/A'}</strong>, CUIL ${landlord.cuil || 'N/A'}, con domicilio en ${landlord.direccion || 'N/A'}, de la ciudad de ${landlord.ciudad || 'N/A'}, correo electrónico ${landlord.email || 'N/A'}, teléfono ${landlord.mobilePhone || 'N/A'}, en carácter de propietario junto con ${property.socio}, en adelante denominados "LOS LOCADORES", por una parte, y por la otra el Sr/Sra <strong>${tenant.name || 'N/A'}</strong>, CUIL ${tenant.cuil || 'N/A'}, con domicilio en ${tenant.direccion || 'N/A'}, ${tenant.ciudad || 'N/A'}, ${tenant.provincia || 'N/A'}, correo electrónico ${tenant.email || 'N/A'}, teléfono ${tenant.mobilePhone || 'N/A'}, en adelante denominado "LOCATARIO"`
      : `Entre el Sr/Sra. <strong>${landlord.name || 'N/A'}</strong>, CUIL ${landlord.cuil || 'N/A'}, con domicilio en ${landlord.direccion || 'N/A'}, de la ciudad de ${landlord.ciudad || 'N/A'}, en adelante denominado "EL LOCADOR", por una parte, y por la otra el Sr/Sra <strong>${tenant.name || 'N/A'}</strong>, CUIL ${tenant.cuil || 'N/A'}, con domicilio en ${tenant.direccion || 'N/A'}, ${tenant.ciudad || 'N/A'}, ${tenant.provincia || 'N/A'}, en adelante denominado "EL LOCATARIO"`
    }, convienen en celebrar el presente contrato de locación, sujeto a las siguientes cláusulas y condiciones:
  </p>

  <div class="clausula">
    <p><span class="titulo-clausula">PRIMERA: Objeto.</span> Por el Presente contrato, el locador cede el uso del inmueble sito en ${property.address || 'N/A'}, ${property.city || 'N/A'}, en adelante denominado el "INMUEBLE LOCADO" para ser destinado a ${getUsoPropiedad(property.typeProperty)}; no pudiéndose cambiar el destino de uso. Superficie cubierta: ${property.superficieCubierta || 'N/A'}, Superficie total: ${property.superficieTotal || 'N/A'}. ${property.typeProperty !== "lote" && property.typeProperty !== "terreno" && property.rooms ? `El inmueble cuenta con ${property.rooms} ambientes y ${property.bathrooms || 0} baños.` : ""}</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">SEGUNDA: Destino de la locación.</span> Las partes convienen que el inmueble referido en la cláusula primera será destinado ${getDestinoLocacion(property.typeProperty)}. El Inmueble tiene Superficie cubierta: ${property.superficieCubierta || 'N/A'}, Superficie total: ${property.superficieTotal || 'N/A'}. ${property.typeProperty !== "lote" && property.typeProperty !== "terreno" && property.rooms ? `El inmueble cuenta con ${property.rooms} ambientes y ${property.bathrooms || 0} baños, ` : ""}y todas las demás especificaciones contenidas en cláusula anexa al presente contrato de locación.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">TERCERA: Plazo del contrato.</span> Las partes convienen fijar un plazo de duración determinada por el presente contrato. El cual será de ${numeroALetras(lease.totalMonths)} (${lease.totalMonths}) meses, los mismos se computarán a partir del ${formatearFecha(startDate)}, y hasta el día ${formatearFecha(endDate)}, recibiendo del locatario la tenencia del inmueble en el día de la fecha. Es obligación del locatario restituir al término de la locación el inmueble desocupado y en buen estado conforme a los art.1206 y 1207 del CCCN. Si ello no fuere cumplido se cobrará una multa equivalente al 0.4% diario sobre el último alquiler hasta la entrega efectiva del inmueble locado y en las condiciones que le fue entregado.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">CUARTA: Precio:</span> El precio del alquiler se fija de común acuerdo entre las partes por la suma de ${formatearMonto(lease.rentAmount)} para el ${lease.updateFrequency === "semestral" ? "primer semestre" : lease.updateFrequency === "anual" ? "primer año" : "primer cuatrimestre"} de locación. Para los ${lease.updateFrequency === "semestral" ? "siguientes semestres" : lease.updateFrequency === "anual" ? "siguientes años" : "siguientes cuatrimestres"} el precio será actualizado conforme al Índice de precios al consumidor (IPC) que confecciona y publica el Instituto Nacional de Estadísticas y Censos (INDEC). Si por una disposición legal y futura, los alquileres se vieren grabados con el pago del impuesto al valor agregado (IVA), EL LOCATARIO deberá adicionar al monto mensual a pagar en concepto de canon locativo, el porcentual correspondiente al IVA. El LOCATARIO abonará el alquiler en efectivo en moneda de curso legal, y por adelantado del 1° al 10° del mes en el local comercial de Q+L Servicios Inmobiliarios sito en Av. Gobernador Cubas N° 50 de la ciudad de Belen, o bien en el domicilio que en un futuro designe el LOCADOR. Por el presente acto el LOCADOR comunica al LOCATARIO que constituye a Q+L Servicios inmobiliarios, en adelante EL ADMINISTRADOR como su representante, quedando este facultado para actuar en su nombre en cualquier cuestión que emane del presente, percibir los alquileres mensuales y extender los correspondientes recibos de pago, también para conservar y archivar los comprobantes de pago de todos los impuestos, y servicios a cargo del LOCATARIO, quien tendrá por constancia de pago el asiento de los mismos en los recibos de pago del alquiler. La falta de pago producirá un interés equivalente al 1% diario contado a partir del primer día del mes en mora.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">QUINTA: Modificaciones:</span> El LOCATARIO tiene expresamente prohibido efectuar mejoras o modificaciones que alteren la estructura del inmueble sin autorización previa y por escrito del LOCADOR. De autorizarse la realización de mejoras, estas quedan a beneficio del inmueble sin derecho para el Locatario a ninguna indemnización reembolso, compensación y/o retribución.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">SEXTA: Impuestos y Servicios:</span> El LOCATARIO debe pagar en tiempo y forma los servicios de luz que debe estar a su nombre dando de baja al término del presente Contrato como también cualquier otro servicio domiciliario y/o tributo que grave el inmueble en el futuro, entregando mensualmente al Locador o a la empresa inmobiliaria las boletas y/o facturas pagadas. Serán a cargo del LOCATARIO el pago del servicio de Agua (Medido o No Medido) durante todo el tiempo de duración del contrato hasta su efectiva desocupación. Serán a Cargo del LOCADOR Las Cargas y Contribuciones que graven el Inmueble: Impuestos Municipal - Impuesto Provincial, como así también cualquier sobretasa, derecho adicional o impuestos nacionales, provinciales o municipales que pudieran crearse y afecten a la misma.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">SEPTIMA: Incumplimiento:</span> En cualquiera de los casos de incumplimiento del LOCATARIO, sin perjuicio de las penalidades que se establecen en las demás cláusulas, el LOCADOR podrá pedir el cumplimiento de este contrato o resolverlo por culpa del LOCATARIO y solicitar el inmediato desalojo de este o quienes ocupen el inmueble (sanciones ART.1086 CC y C). En ambos casos y para el evento de que el LOCATARIO dejare abandonada la unidad, o depositare judicialmente las llaves deberá abonar al LOCADOR una multa igual al alquiler pactado desde la iniciación del juicio hasta el día en que el LOCADOR tome libre y efectiva tenencia definitiva de la propiedad, debiendo indemnizarlo también por daños y perjuicios sufridos. Sin perjuicio de lo expuesto en caso de abandono, y para evitar los posibles deterioros que pudieran producirse y/o la ocupación ilegal de terceros, queda facultado el LOCADOR a tomar posesión anticipada de la propiedad con auxilio del cerrajero, labrándose acta en tal sentido por Oficial Público, y constituyéndose en depositario de los bienes propiedad del LOCATARIO, que pudieron hallarse en el lugar, por el término de tres meses contados desde el día de practicamente la diligencia. Vencido el plazo del depósito, se entenderá que el locatario.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">OCTAVA: Irresponsabilidad:</span> El LOCADOR no se responsabiliza por daños, perjuicio, lesiones que puedan producirse al LOCATARIO o a las personas que pudieren encontrarse en el inmueble, que resulten como consecuencia de la acción u omisión del Locatario y/o terceros por el uso y goce del inmueble, ni como consecuencia de inundaciones, filtraciones, incendios total o parcial, ruinas, desprendimientos roturas, desperfecto de cualquier tipo y/o por caso fortuito o de fuerza mayor y sus consecuencias.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">NOVENA: Resolución Anticipada:</span> 1 El LOCATARIO podrá resolver este contrato sin expresión de causa y de forma anticipada luego de transcurridos los primeros seis (6) meses de locación, notificando su decisión al LOCADOR con un (1) mes de anticipación. 2- si la resolución fuere durante el primer año de contrato, el locatario abonará al locador como indemnización el monto de un mes y medio (1,5) de alquiler. 3-cuando la resolución fuese pasado el primer año, la indemnización será de un (1) mes de alquiler. 4 a todos los efectos los meses serán indivisibles y enteros o completos.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">DECIMA: Intransferibilidad:</span> EL LOCATARIO no podrá subarrendar, permutar, prestar o ceder en todo o en parte el inmueble objeto de este acto, ni transferir los derechos del presente contrato constituyendo su incumplimiento como causal de rescisión del presente contrato.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">DECIMA PRIMERA: Sanciones:</span> Conforme a lo establecido en la cláusula séptima, la violación por parte del LOCATARIO de cualquiera de las obligaciones que asume en el presente, dará derecho al LOCADOR para optar entre exigir su cabal cumplimiento o dar por resuelto el presente contrato y exigir el inmediato desalojo del inmueble, con más el pago de las cláusulas penales pactadas y/o daños y perjuicios pertinentes. Pudiendo accionar contra la totalidad del patrimonio del LOCATARIO.</p>
  </div>

  ${guarantors.length > 0 ? guarantors.map((guarantor, index) => `
    <div class="clausula">
      <p><span class="titulo-clausula">DECIMA SEGUNDA${index > 0 ? ` (${index + 1})` : ''}: Fianza. Garante:</span> El Sr/Sra ${guarantor.name}, que acredita su identidad con CUIL ${guarantor.cuil}, nacionalidad Argentina, con domicilio en ${guarantor.address}, teléfono ${guarantor.mobilePhone || 'N/A'}, correo electrónico: ${guarantor.email || 'N/A'}, quien manifiesta no tener capacidad restringida para este acto, a estos efectos exhibe el recibo de sueldo del Gobierno de la provincia de Catamarca, el que acredita ${guarantor.description}. Quien se constituye a los efectos de este contrato en Fiador/a solidario/a, liso, llano y principal pagador/a de los alquileres, impuestos, servicios adeudados por el LOCATARIO. La parte Fiadora renuncia a los beneficios de división y excusión y declara expresamente que, si al vencimiento del contrato el Locatario permaneciese en el uso y goce del bien locado, su responsabilidad y fianza continuarán en vigencia hasta el momento en que el Locatario entregue en devolución a la Locadora la propiedad libre de ocupantes y en las demás condiciones establecidas en este contrato. Comprometiéndose en este acto que si por alguna circunstancia propia o ajena, cambiara de empleador o bien de domicilio laboral, lo comunicará inmediatamente al Locador, o sus representantes, mediante notificación fehaciente. Es además obligación del Fiador, vigilar que el Locatario cumpla con todas y cada una de las obligaciones contraídas en este Contrato de Locación. Asimismo se avienen al pago de los alquileres adeudados por el Locatario, con la sola presentación de los recibos de alquileres respectivos. REEMPLAZO DE LOS GARANTES: En caso de falencia, insolvencia, fallecimiento, desaparición y responsabilidad manifiesta, etc. del o de los fiadores, el LOCADOR podrá requerir un nuevo garante fiador, en término de cinco (5) días corridos, cuya solvencia no podrá ser inferior a la anterior, quedando ésta, a juicio y satisfacción de la locadora. En caso de incumplimiento de esta obligación por parte del LOCATARIO, quedará resuelto el contrato, como si el convenio fuese a término vencido. Es obligación del LOCATARIO dar aviso al LOCADOR en caso de presentarse alguna de las mencionadas circunstancias.</p>
    </div>
  `).join('') : ''}

  <div class="clausula">
    <p><span class="titulo-clausula">DECIMA TERCERA: Renovación:</span> Este contrato no puede ser prorrogado total o parcialmente ni renovado por idéntico periodo sin previo acuerdo escrito de las partes acerca de las nuevas condiciones del arrendamiento, especialmente sobre el precio del alquiler.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">DECIMA CUARTA: Estado del Bien Locado:</span> A los efectos de la restitución del inmueble, una vez vencido el término contractual, se aclara que el LOCATARIO deberá proceder de la siguiente manera: 1) El inmueble deberá restituirse en el mismo buen estado de conservación higiene en que fue entregado y según consta en el anexo N°1. El LOCATARIO no podrá eludir esta obligación contraída en el presente, dejando aclarado que el LOCADOR y/o sus representantes no están obligados a recibir el inmueble si no se diera cumplimiento a lo estipulado anteriormente, haciéndose punible el LOCATARIO de la penalidad establecida en el presente o la demora en la entrega del inmueble y a satisfacer el importe de alquiler mensual por todo el tiempo necesario que transcurra hasta que los desperfectos o deterioros sean reparados, o hasta que las deudas por servicios e impuestos sean canceladas.</p>
  </div>

  <div class="clausula">
    <p class="titulo-clausula">INVENTARIO:</p>
    <div class="inventario">${lease.inventory ? lease.inventory.replace(/\\n/g, '<br>').replace(/\n/g, '<br>') : 'Sin inventario especificado'}</div>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">DECIMA QUINTA: COMPETENCIA - Domicilios - Jurisdicción y Competencia:</span> Las partes que suscriben este contrato renuncian al fuero federal o a cualquier otro que pudiera corresponder y se someten a la jurisdicción de la justicia ordinaria de la ciudad de Belen para cualquier cuestión que se suscite entre las mismas, constituyendo domicilio para todos los efectos: el LOCADOR fija domicilio en el constituido como domicilio de pago en la cláusula sexta del presente, el FIADOR y el COMERCIANTE lo hacen en la propiedad por el presente locada, renunciando expresamente todos ellos al Fuero Federal, en caso de corresponderles, sometiéndose para cualquier cuestión derivada del presente a la jurisdicción de los Tribunales ordinarios de la provincia de Catamarca.</p>
  </div>

  <div class="clausula">
    <p><span class="titulo-clausula">DECIMA SEXTA: FIRMA Y EJEMPLARES:</span> Se pacta expresamente que el impuesto de sello provincial será abonado íntegramente por el LOCATARIO. Leído, las partes, declaran su conformidad y firman tres (3) ejemplares de un mismo tenor y a un solo efecto, en la Ciudad de Belen ${formatearFecha(new Date())}.</p>
  </div>

  <div class="firmas">
    <div class="firma">Firma del LOCADOR</div>
    <div class="firma">Firma del LOCATARIO</div>
  </div>
</body>
</html>
  `;

  return html;
};
