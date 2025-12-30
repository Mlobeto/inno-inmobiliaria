const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const cloudinaryHelper = require("../utils/cloudinaryHelper");
const path = require("path");
const fs = require("fs").promises;

/**
 * Registrar helpers de Handlebars
 */
Handlebars.registerHelper("formatDate", function (date, format) {
  if (!date) return "N/A";
  const d = new Date(date);
  
  // Formato personalizado
  if (format === "DD") return String(d.getDate()).padStart(2, '0');
  if (format === "MM") return String(d.getMonth() + 1).padStart(2, '0');
  if (format === "YY") return String(d.getFullYear()).slice(-2);
  
  // Formato por defecto es-AR
  return d.toLocaleDateString("es-AR");
});

Handlebars.registerHelper("addMonths", function (date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1); // Restar 1 día para obtener el último día del mes anterior
  return d;
});

Handlebars.registerHelper("formatCurrency", function (amount) {
  if (!amount) return "$0.00";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
});

Handlebars.registerHelper("uppercase", function (text) {
  return text ? text.toUpperCase() : "";
});

Handlebars.registerHelper("lowercase", function (text) {
  return text ? text.toLowerCase() : "";
});

Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

Handlebars.registerHelper("ne", function (a, b) {
  return a !== b;
});

Handlebars.registerHelper("gt", function (a, b) {
  return a > b;
});

Handlebars.registerHelper("lt", function (a, b) {
  return a < b;
});

Handlebars.registerHelper("if_eq", function (a, b, opts) {
  if (a === b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

Handlebars.registerHelper("numeroALetras", function (num) {
  const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
  const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
  
  num = Math.floor(num);
  
  if (num === 0) return "cero";
  if (num < 10) return unidades[num];
  if (num >= 10 && num < 20) return especiales[num - 10];
  if (num >= 20 && num < 100) {
    const dec = Math.floor(num / 10);
    const uni = num % 10;
    return decenas[dec] + (uni ? " y " + unidades[uni] : "");
  }
  if (num >= 100 && num < 1000) {
    const cen = Math.floor(num / 100);
    const resto = num % 100;
    let result = num === 100 ? "cien" : centenas[cen];
    if (resto) result += " " + Handlebars.helpers.numeroALetras(resto);
    return result;
  }
  if (num >= 1000 && num < 1000000) {
    const miles = Math.floor(num / 1000);
    const resto = num % 1000;
    let result = miles === 1 ? "mil" : Handlebars.helpers.numeroALetras(miles) + " mil";
    if (resto) result += " " + Handlebars.helpers.numeroALetras(resto);
    return result;
  }
  if (num >= 1000000) {
    const millones = Math.floor(num / 1000000);
    const resto = num % 1000000;
    let result = millones === 1 ? "un millón" : Handlebars.helpers.numeroALetras(millones) + " millones";
    if (resto) result += " " + Handlebars.helpers.numeroALetras(resto);
    return result;
  }
  
  return num.toString();
});

/**
 * Prepara las variables para el template combinando datos del lease, property, client, tenant, etc.
 * @param {Object} data - Datos del modelo (Lease, Property, etc.)
 * @param {Object} tenant - Datos del tenant
 * @param {Object} customVariables - Variables adicionales personalizadas
 * @returns {Object} Objeto con todas las variables disponibles
 */
const prepareTemplateVariables = (data, tenant, customVariables = {}) => {
  const variables = {
    // Datos del tenant (inmobiliaria)
    inmobiliaria: {
      businessName: tenant?.businessName || "",
      cuit: tenant?.cuit || "",
      email: tenant?.email || "",
      phone: tenant?.phone || "",
      address: tenant?.address || "",
      logoUrl: tenant?.logoUrl || "",
      signatureUrl: tenant?.signatureUrl || "",
    },
    // Fecha actual
    fechaActual: new Date().toLocaleDateString("es-AR"),
    fechaActualCompleta: new Date().toLocaleString("es-AR"),
    // Variables personalizadas (para actualización de renta, etc.)
    ...customVariables,
  };

  // Agregar datos según el tipo de data
  if (data) {
    // Si es un Lease (Contrato)
    if (data.startDate && data.rentAmount) {
      variables.lease = {
        id: data.id,
        startDate: data.startDate,
        rentAmount: data.rentAmount,
        updateFrequency: data.updateFrequency,
        commission: data.commission,
        totalMonths: data.totalMonths,
        inventory: data.inventory,
        status: data.status,
        customContent: data.customContent,
      };

      // Tenant (inquilino)
      if (data.Renter) {
        variables.tenant = {
          name: data.Renter.name,
          cuil: data.Renter.cuil,
          email: data.Renter.email,
          phone: data.Renter.phone,
          direccion: data.Renter.direccion,
          ciudad: data.Renter.ciudad,
          provincia: data.Renter.provincia,
        };
      }

      // Landlord (propietario)
      if (data.Landlord) {
        variables.landlord = {
          name: data.Landlord.name,
          cuil: data.Landlord.cuil,
          email: data.Landlord.email,
          phone: data.Landlord.phone,
          direccion: data.Landlord.direccion,
          ciudad: data.Landlord.ciudad,
          provincia: data.Landlord.provincia,
        };
      }

      // Garantors (avalistas)
      if (data.Garantors && data.Garantors.length > 0) {
        variables.guarantors = data.Garantors.map((g) => ({
          name: g.name,
          cuil: g.cuil,
          email: g.email,
          phone: g.phone,
          direccion: g.direccion,
        }));
      }

      // Property
      if (data.Property) {
        variables.property = {
          propertyId: data.Property.propertyId,
          address: data.Property.address,
          neighborhood: data.Property.neighborhood,
          city: data.Property.city,
          province: data.Property.province,
          price: data.Property.price,
          type: data.Property.type,
          typeProperty: data.Property.typeProperty,
          rooms: data.Property.rooms,
          bathrooms: data.Property.bathrooms,
          superficieCubierta: data.Property.superficieCubierta,
          superficieTotal: data.Property.superficieTotal,
          description: data.Property.description,
          highlights: data.Property.highlights,
          images: data.Property.images || [],
        };
      }
    }

    // Si es un Property (Ficha o Autorización)
    if (data.propertyId && !data.startDate) {
      variables.property = {
        propertyId: data.propertyId,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        province: data.province,
        price: data.price,
        type: data.type,
        typeProperty: data.typeProperty,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        superficieCubierta: data.superficieCubierta,
        superficieTotal: data.superficieTotal,
        description: data.description,
        highlights: data.highlights,
        images: data.images || [],
        socio: data.socio,
        comision: data.comision,
      };

      // Owner (propietario de la propiedad)
      if (data.Owner) {
        variables.client = {
          name: data.Owner.name,
          cuil: data.Owner.cuil,
          email: data.Owner.email,
          phone: data.Owner.phone,
          direccion: data.Owner.direccion,
          ciudad: data.Owner.ciudad,
          provincia: data.Owner.provincia,
        };
      }
    }

    // Si es un Payment (Recibo)
    if (data.amount && data.paymentDate) {
      variables.payment = {
        id: data.id,
        amount: data.amount,
        paymentDate: data.paymentDate,
        period: data.period,
        type: data.type,
        installmentNumber: data.installmentNumber,
      };

      // Lease y Tenant asociados
      if (data.Lease) {
        variables.lease = {
          id: data.Lease.id,
          totalMonths: data.Lease.totalMonths,
        };

        if (data.Lease.Renter) {
          variables.tenant = {
            name: data.Lease.Renter.name,
            cuil: data.Lease.Renter.cuil,
            direccion: data.Lease.Renter.direccion,
            ciudad: data.Lease.Renter.ciudad,
            provincia: data.Lease.Renter.provincia,
          };
        }

        if (data.Lease.Property) {
          variables.property = {
            address: data.Lease.Property.address,
          };
        }
      }
    }
  }

  return variables;
};

/**
 * Renderiza el template HTML con las variables usando Handlebars
 * @param {Object} template - Template de la BD (htmlTemplate, headerHtml, footerHtml, styles)
 * @param {Object} variables - Variables preparadas
 * @returns {String} HTML final renderizado
 */
const renderTemplate = (template, variables) => {
  try {
    // Compilar y renderizar header
    const headerTemplate = Handlebars.compile(template.headerHtml || "");
    const headerHtml = headerTemplate(variables);

    // Compilar y renderizar body
    const bodyTemplate = Handlebars.compile(template.htmlTemplate);
    const bodyHtml = bodyTemplate(variables);

    // Compilar y renderizar footer
    const footerTemplate = Handlebars.compile(template.footerHtml || "");
    const footerHtml = footerTemplate(variables);

    // Construir HTML completo
    const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Document</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #000;
    }
    .header {
      margin-bottom: 20px;
    }
    .footer {
      margin-top: 20px;
    }
    .page-break {
      page-break-after: always;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    table td, table th {
      padding: 8px;
      border: 1px solid #ddd;
    }
    ${template.styles || ""}
  </style>
</head>
<body>
  <div class="header">
    ${headerHtml}
  </div>
  
  <div class="content">
    ${bodyHtml}
  </div>
  
  <div class="footer">
    ${footerHtml}
  </div>
</body>
</html>
    `;

    return fullHtml;
  } catch (error) {
    console.error("Error renderizando template:", error);
    throw new Error("Error al renderizar el template HTML");
  }
};

/**
 * Genera un PDF usando Puppeteer desde HTML renderizado
 * @param {String} html - HTML completo renderizado
 * @param {Object} options - Opciones del PDF (pageSize, orientation, margins)
 * @returns {Buffer} Buffer del PDF generado
 */
const generatePdfFromHtml = async (html, options = {}) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfOptions = {
      format: options.pageSize || "A4",
      landscape: options.orientation === "landscape",
      margin: options.margins || {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      printBackground: true,
    };

    const pdfBuffer = await page.pdf(pdfOptions);
    await browser.close();

    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    console.error("Error generando PDF con Puppeteer:", error);
    throw new Error("Error al generar el PDF");
  }
};

/**
 * Sube el PDF a Cloudinary
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @param {Number} tenantId - ID del tenant
 * @param {String} fileName - Nombre del archivo
 * @returns {String} URL del PDF en Cloudinary
 */
const uploadPdfToCloudinary = async (pdfBuffer, tenantId, fileName) => {
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  
  let tempFilePath = null;
  
  try {
    // Crear archivo temporal
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `${fileName}.pdf`);
    
    // Escribir buffer a archivo temporal
    await fs.writeFile(tempFilePath, pdfBuffer);

    // Subir a Cloudinary desde archivo temporal
    const result = await cloudinaryHelper.uploadImage(tempFilePath, tenantId, "pdfs", {
      public_id: fileName,
      resource_type: "raw", // Para PDFs
      format: "pdf",
    });

    // Eliminar archivo temporal
    await fs.unlink(tempFilePath);

    return result.url || result.secure_url;
  } catch (error) {
    // Limpiar archivo temporal en caso de error
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error("Error limpiando archivo temporal:", cleanupError.message);
      }
    }
    
    console.error("Error subiendo PDF a Cloudinary:", error);
    throw new Error("Error al subir el PDF a Cloudinary");
  }
};

/**
 * Función principal para generar un PDF completo
 * @param {Object} params
 * @param {Object} params.template - Template de la BD
 * @param {Object} params.data - Datos del modelo
 * @param {Object} params.tenant - Datos del tenant
 * @param {Object} params.customVariables - Variables personalizadas
 * @param {Boolean} params.isPreview - Si es un preview (no se guarda)
 * @returns {String} URL del PDF generado
 */
const generatePdf = async ({ template, data, tenant, customVariables = {}, isPreview = false }) => {
  try {
    // 1. Preparar variables
    const variables = prepareTemplateVariables(data, tenant, customVariables);

    // 2. Renderizar HTML
    const html = renderTemplate(template, variables);

    // 3. Generar PDF con Puppeteer
    const pdfOptions = {
      pageSize: template.pageSize || "A4",
      orientation: template.orientation || "portrait",
      margins: template.margins,
    };
    const pdfBuffer = await generatePdfFromHtml(html, pdfOptions);

    // 4. Subir a Cloudinary
    const fileName = isPreview
      ? `preview-${Date.now()}`
      : `${template.templateType.toLowerCase()}-${data.id || Date.now()}`;

    const pdfUrl = await uploadPdfToCloudinary(pdfBuffer, tenant.id, fileName);

    return pdfUrl;
  } catch (error) {
    console.error("Error en generatePdf:", error);
    throw error;
  }
};

module.exports = {
  generatePdf,
  prepareTemplateVariables,
  renderTemplate,
  generatePdfFromHtml,
  uploadPdfToCloudinary,
};
