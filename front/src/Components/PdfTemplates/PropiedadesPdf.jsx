/* eslint-disable react/prop-types */

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import html2pdf from "html2pdf.js";

const PropiedadesPDF = ({ property }) => {
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState(null);
  const [settings, setSettings] = useState(null);

  const token = useSelector((state) => state.token);

  const getDefaultTemplate = () => {
    return `
      <div style="font-family: 'Courier New', monospace; padding: 20px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <div>
            {{empresa_logo}}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: bold;">{{empresa_nombre}}</div>
            <div style="font-size: 11px;">{{empresa_direccion}}</div>
            <div style="font-size: 11px;">Tel: {{empresa_telefono}}</div>
          </div>
          <div style="background: ${property.type === 'venta' ? '#ff0000' : '#008000'}; color: white; padding: 10px 20px; border-radius: 5px; font-size: 16px; font-weight: bold;">
            {{propiedad_tipo}}
          </div>
        </div>

        <!-- Imágenes -->
        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 30px;">
          {{propiedad_imagenes}}
        </div>

        <!-- Información Principal -->
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #008000; margin-top: 0;">Información de la Propiedad</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 40%;">📍 Dirección:</td>
              <td style="padding: 8px;">{{propiedad_direccion}}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">🏘️ Barrio:</td>
              <td style="padding: 8px;">{{propiedad_barrio}}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">🌆 Ciudad:</td>
              <td style="padding: 8px;">{{propiedad_ciudad}}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">💰 Precio:</td>
              <td style="padding: 8px; font-size: 18px; color: #008000; font-weight: bold;">{{propiedad_precio}}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">🏠 Tipo de Propiedad:</td>
              <td style="padding: 8px;">{{propiedad_tipo_propiedad}}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">🛏️ Habitaciones:</td>
              <td style="padding: 8px;">{{propiedad_habitaciones}}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">🚿 Baños:</td>
              <td style="padding: 8px;">{{propiedad_banos}}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">📐 Superficie Cubierta:</td>
              <td style="padding: 8px;">{{propiedad_superficie_cubierta}} m²</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">📏 Superficie Total:</td>
              <td style="padding: 8px;">{{propiedad_superficie_total}} m²</td>
            </tr>
          </table>
        </div>

        <!-- Descripción -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 2px solid #008000; padding-bottom: 5px;">Descripción</h3>
          <p style="line-height: 1.6; text-align: justify;">{{propiedad_descripcion}}</p>
        </div>

        <!-- Destacados -->
        <div style="background: linear-gradient(135deg, #008000 0%, #005500 100%); color: white; padding: 20px; border-radius: 10px;">
          <h3 style="margin-top: 0; font-size: 18px;">✨ Destacados</h3>
          <p style="line-height: 1.6;">{{propiedad_destacados}}</p>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    const loadTemplateAndSettings = async () => {
      if (!token) return;
      try {
        // Cargar template de tipo FICHA_PROPIEDAD
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
        const templateRes = await fetch(
          `${apiUrl}/pdf-templates?templateType=FICHA_PROPIEDAD&isActive=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const templateData = await templateRes.json();
        if (templateData.success && templateData.data.length > 0) {
          setTemplate(templateData.data[0]);
        } else {
          // Si no hay template, usar el por defecto
          setTemplate({ htmlTemplate: getDefaultTemplate() });
        }

        // Cargar configuraciones de la inmobiliaria (tenant-aware por JWT)
        const settingsRes = await fetch(`${apiUrl}/admin/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!settingsRes.ok) {
          throw new Error(`Error ${settingsRes.status}: ${settingsRes.statusText}`);
        }
        
        const settingsData = await settingsRes.json();
        setSettings(settingsData || {});
        
      } catch (error) {
        console.error("Error al cargar template o configuraciones:", error);
        // En caso de error, usar valores por defecto
        setTemplate({ htmlTemplate: getDefaultTemplate() });
        // IMPORTANTE: Establecer settings vacío para que el botón no se quede bloqueado
        setSettings({
          company_name: "Inmobiliaria",
          company_address: "",
          company_phone: "",
          company_email: "",
          company_logo_url: null
        });
      }
    };

    loadTemplateAndSettings();
  }, [token]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const replaceVariables = (html) => {
    if (!html) return "";

    const logoUrl = settings?.company_logo_url || "";

    const variables = {
      "{{empresa_nombre}}": settings?.company_name || "",
      "{{empresa_direccion}}": settings?.company_address || "",
      "{{empresa_telefono}}": settings?.company_phone || "",
      "{{empresa_email}}": settings?.company_email || "",
      "{{empresa_logo}}": logoUrl
        ? `<img src="${logoUrl}" alt="Logo" style="height: 60px; width: auto;" />`
        : "",
      "{{propiedad_direccion}}": property.address || "",
      "{{propiedad_barrio}}": property.neighborhood || "",
      "{{propiedad_ciudad}}": property.city || "",
      "{{propiedad_precio}}": formatPrice(property.price),
      "{{propiedad_tipo}}": property.type === "venta" ? "Venta" : "Alquiler",
      "{{propiedad_tipo_propiedad}}": property.typeProperty || "",
      "{{propiedad_habitaciones}}": property.rooms || "N/A",
      "{{propiedad_banos}}": property.bathrooms || "N/A",
      "{{propiedad_superficie_cubierta}}": property.superficieCubierta || "N/A",
      "{{propiedad_superficie_total}}": property.superficieTotal || "N/A",
      "{{propiedad_descripcion}}": property.description || "",
      "{{propiedad_destacados}}": property.highlights || "",
    };

    let result = html;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.split(key).join(value);
    });

    // Reemplazar imágenes si existen
    if (property.images && property.images.length > 0) {
      const imagesHtml = property.images
        .slice(0, 4)
        .map((img) => `<img src="${img}" style="width: 45%; margin: 5px; border-radius: 8px;" />`)
        .join("");
      result = result.replace("{{propiedad_imagenes}}", imagesHtml);
    } else {
      result = result.replace("{{propiedad_imagenes}}", "<p>No hay imágenes disponibles</p>");
    }

    return result;
  };

  const generatePdf = async () => {
    setLoading(true);

    try {
      // Reemplazar variables en el template HTML
      const htmlContent = replaceVariables(template.htmlTemplate);

      // Crear un elemento temporal para el PDF
      const element = document.createElement("div");
      element.innerHTML = htmlContent;
      element.style.padding = "20px";
      element.style.backgroundColor = "white";

      // Configuración de html2pdf
      const options = {
        margin: 10,
        filename: `Propiedad-${property.propertyId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      // Generar el PDF
      await html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePdf}
      className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={loading || !settings || !template}
      title={!settings || !template ? "Cargando configuración..." : ""}
    >
      {loading ? "Generando..." : (!settings || !template) ? "Cargando..." : "Descargar PDF"}
    </button>
  );
};

export default PropiedadesPDF;
