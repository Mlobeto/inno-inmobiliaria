import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import {
  useGetAllPdfTemplatesQuery,
  useGetTemplateTypesQuery,
  useCreatePdfTemplateMutation,
  useUpdatePdfTemplateMutation,
  useDeletePdfTemplateMutation,
  useDuplicatePdfTemplateMutation,
  useSetTemplateAsDefaultMutation,
} from '@shared/redux';
import {
  IoAddOutline,
  IoArrowBackOutline,
  IoCopyOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCreateOutline,
  IoStarOutline,
  IoStar,
  IoSaveOutline,
  IoCloseOutline,
  IoDocumentTextOutline,
  IoRefreshOutline,
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import VisualPdfEditor from './VisualPdfEditor';
import TemplateWizard from './TemplateWizard';
import ClauseLibraryManager from './ClauseLibraryManager';

const PdfTemplateManager = ({ embedded = false }) => {
  const navigate = useNavigate();
  
  // RTK Query hooks
  const { data: templatesData, isLoading: loadingTemplates } = useGetAllPdfTemplatesQuery();
  const { data: typesData } = useGetTemplateTypesQuery();
  const [createTemplate] = useCreatePdfTemplateMutation();
  const [updateTemplate] = useUpdatePdfTemplateMutation();
  const [deleteTemplate] = useDeletePdfTemplateMutation();
  const [duplicateTemplate] = useDuplicatePdfTemplateMutation();
  const [setAsDefault] = useSetTemplateAsDefaultMutation();

  // Local state
  const [showWizard,          setShowWizard]         = useState(false);
  const [showClauseLibrary,   setShowClauseLibrary]  = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    templateType: '',
    templateName: '',
    htmlTemplate: '',
    styles: '',
    headerHtml: '',
    footerHtml: '',
    pageSize: 'A4',
    orientation: 'portrait',
    propertyPurpose: '',
    isActive: true,
    isDefault: false,
  });

  const templates = templatesData?.data || [];
  const types = typesData?.data || [];

  // Filtrar plantillas por tipo si hay un tipo seleccionado
  const filteredTemplates = selectedType
    ? templates.filter((t) => t.templateType === selectedType)
    : templates;

  // Función para obtener plantilla de ejemplo según el tipo
  const getExampleTemplate = (templateType, propertyPurpose = '') => {
    const examples = {
      CONTRATO_ALQUILER: {
        html: `<div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
  <h1 style="text-align: center; color: #2c3e50;">CONTRATO DE LOCACIÓN DE INMUEBLE</h1>
  
  <p style="text-align: right; margin-top: 20px;">
    En {{ciudad}}, a los {{dia}} días del mes de {{mes}} de {{anio}}
  </p>
  
  <h3>PARTES:</h3>
  <p><strong>LOCADOR:</strong> {{propietario.nombre}}, CUIL/CUIT {{propietario.cuil}}, con domicilio en {{propietario.domicilio}}, tel. {{propietario.telefono}}</p>
  <p><strong>LOCATARIO:</strong> {{inquilino.nombre}}, CUIL/CUIT {{inquilino.cuil}}, con domicilio en {{inquilino.domicilio}}, tel. {{inquilino.telefono}}</p>
  
  <h3>PRIMERA - OBJETO:</h3>
  <p>El LOCADOR da en locación al LOCATARIO el inmueble ubicado en {{propiedad.direccion}}, {{propiedad.ciudad}}, Provincia de {{propiedad.provincia}}.</p>
  
  <h3>SEGUNDA - DESTINO:</h3>
  <p>El inmueble se destinará exclusivamente para <strong>vivienda familiar</strong> del locatario.</p>
  
  <h3>TERCERA - PLAZO:</h3>
  <p>El plazo de la locación será de {{contrato.plazoMeses}} meses, comenzando el {{contrato.fechaInicio}} y finalizando el {{contrato.fechaFin}}.</p>
  
  <h3>CUARTA - PRECIO:</h3>
  <p>El precio de la locación es de <strong>{{contrato.montoMensual}}</strong> mensuales, pagaderos por adelantado hasta el día {{contrato.diaVencimiento}} de cada mes.</p>
  
  <h3>QUINTA - AJUSTE:</h3>
  <p>El precio se actualizará cada cuatro (4) meses según el índice IPC publicado por INDEC, conforme al artículo 14 de la Ley 27.551.</p>
  
  <div style="margin-top: 60px;">
    <div style="display: flex; justify-content: space-between;">
      <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">
          <strong>Firma Locador</strong><br/>
          {{propietario.nombre}}
        </div>
      </div>
      <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">
          <strong>Firma Locatario</strong><br/>
          {{inquilino.nombre}}
        </div>
      </div>
    </div>
  </div>
</div>`,
        styles: `body { font-family: Arial, sans-serif; }
h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
h3 { color: #34495e; margin-top: 20px; }
p { margin: 10px 0; text-align: justify; }`,
        header: `<div style="text-align: center; padding: 10px; border-bottom: 1px solid #ccc;">
  <strong>{{empresa.nombre}}</strong> - Tel: {{empresa.telefono}}
</div>`,
        footer: `<div style="text-align: center; font-size: 10px; color: #666; padding: 10px; border-top: 1px solid #ccc;">
  Página {{pageNumber}} de {{totalPages}} - {{empresa.direccion}}
</div>`
      },
      AUTORIZACION_VENTA: {
        html: `<div style="font-family: Arial, sans-serif; padding: 40px;">
  <h1 style="text-align: center; color: #2c3e50;">AUTORIZACIÓN DE VENTA EXCLUSIVA</h1>
  
  <p style="text-align: right; margin-top: 20px;">
    {{ciudad}}, {{fechaActual}}
  </p>
  
  <p style="margin-top: 30px; text-align: justify;">
    Entre el Sr./Sra. <strong>{{propietario.nombre}}</strong>, DNI {{propietario.dni}}, en adelante denominado 
    "EL PROPIETARIO", y <strong>{{inmobiliaria.nombre}}</strong>, CUIT {{inmobiliaria.cuit}}, con domicilio en 
    {{inmobiliaria.direccion}}, en adelante "LA INMOBILIARIA", han convenido la siguiente autorización:
  </p>
  
  <h3>PRIMERA - INMUEBLE:</h3>
  <p>El PROPIETARIO autoriza a LA INMOBILIARIA a gestionar la venta del inmueble ubicado en:</p>
  <p><strong>{{propiedad.direccion}}, {{propiedad.ciudad}}, {{propiedad.provincia}}</strong></p>
  <p>Características: {{propiedad.tipo}} de {{propiedad.superficieTotal}}m², {{propiedad.ambientes}} ambientes, 
     {{propiedad.habitaciones}} dormitorios, {{propiedad.banos}} baños.</p>
  
  <h3>SEGUNDA - PRECIO:</h3>
  <p>El precio de venta establecido es de: <strong style="font-size: 18px;">{{propiedad.precio}}</strong></p>
  
  <h3>TERCERA - COMISIÓN:</h3>
  <p>LA INMOBILIARIA percibirá una comisión del <strong>{{comision}}%</strong> sobre el precio de venta, 
     a cargo exclusivamente del vendedor.</p>
  
  <h3>CUARTA - PLAZO:</h3>
  <p>Esta autorización tendrá una vigencia de <strong>{{plazo}} días</strong> a partir de la fecha.</p>
  
  <h3>QUINTA - FACULTADES:</h3>
  <p>EL PROPIETARIO autoriza a LA INMOBILIARIA a:</p>
  <ul>
    <li>Publicar en redes sociales y portales inmobiliarios</li>
    <li>Realizar visitas con clientes potenciales</li>
    <li>Colocar cartel de venta en la propiedad</li>
    <li>Gestionar documentación necesaria para la operación</li>
  </ul>
  
  <div style="margin-top: 80px;">
    <div style="display: flex; justify-content: space-between;">
      <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">
          <strong>Firma Propietario</strong><br/>
          {{propietario.nombre}}
        </div>
      </div>
      <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">
          <strong>{{inmobiliaria.nombre}}</strong><br/>
          Matrícula: {{inmobiliaria.matricula}}
        </div>
      </div>
    </div>
  </div>
</div>`,
        styles: `h1 { color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
h3 { color: #c0392b; margin-top: 20px; }
ul { margin-left: 30px; }
li { margin: 5px 0; }`,
        header: `<div style="text-align: center; padding: 10px;">
  <img src="{{empresa.logo}}" style="height: 50px;" />
</div>`,
        footer: `<div style="text-align: center; font-size: 10px; padding: 10px;">
  Página {{pageNumber}} - {{empresa.email}} - {{empresa.telefono}}
</div>`
      },
      RECIBO_PAGO: {
        html: `<div style="font-family: Arial, sans-serif; padding: 30px;">
  <div style="border: 2px solid #2c3e50; padding: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 15px;">
      <div>
        <h1 style="margin: 0; color: #2c3e50;">RECIBO</h1>
        <p style="margin: 5px 0; font-size: 12px;">Original</p>
      </div>
      <div style="text-align: right;">
        <h2 style="margin: 0;">Nº {{recibo.numero}}</h2>
        <p style="margin: 5px 0;">Fecha: {{recibo.fecha}}</p>
      </div>
    </div>
    
    <div style="margin-top: 20px;">
      <p><strong>{{inmobiliaria.nombre}}</strong></p>
      <p>{{inmobiliaria.direccion}}</p>
      <p>CUIT: {{inmobiliaria.cuit}}</p>
      <p>Tel: {{inmobiliaria.telefono}}</p>
      <p>{{inmobiliaria.email}}</p>
    </div>
    
    <div style="margin-top: 30px; background: #f8f9fa; padding: 15px;">
      <h3 style="margin: 0 0 10px 0;">Recibimos de:</h3>
      <p style="margin: 5px 0;"><strong>{{cliente.nombre}}</strong></p>
      <p style="margin: 5px 0;">DNI/CUIT: {{cliente.documento}}</p>
      <p style="margin: 5px 0;">Domicilio: {{cliente.domicilio}}</p>
    </div>
    
    <div style="margin-top: 20px;">
      <h3>Concepto:</h3>
      <p>{{pago.concepto}}</p>
      <p>Propiedad: {{propiedad.direccion}}</p>
      <p>Período: {{pago.periodo}}</p>
    </div>
    
    <div style="margin-top: 30px; background: #e8f4f8; padding: 20px; text-align: center;">
      <p style="margin: 0; font-size: 14px;">Importe:</p>
      <h2 style="margin: 10px 0; color: #2c3e50; font-size: 32px;">{{pago.monto}}</h2>
      <p style="margin: 0; font-style: italic; color: #666;">Son {{pago.montoLetras}}</p>
    </div>
    
    <div style="margin-top: 20px;">
      <p><strong>Forma de pago:</strong> {{pago.formaPago}}</p>
      <p><strong>Banco:</strong> {{pago.banco}}</p>
      <p><strong>Nº Operación:</strong> {{pago.numeroOperacion}}</p>
    </div>
    
    <div style="margin-top: 60px; text-align: right;">
      <div style="border-top: 1px solid #000; width: 200px; display: inline-block; padding-top: 5px;">
        Firma y Sello
      </div>
    </div>
  </div>
  
  <p style="text-align: center; margin-top: 20px; font-size: 10px; color: #666;">
    DOCUMENTO NO VÁLIDO COMO FACTURA
  </p>
</div>`,
        styles: `.recibo { border: 2px solid #2c3e50; }
.monto { font-size: 28px; font-weight: bold; color: #27ae60; }
p { margin: 8px 0; }`,
        header: ``,
        footer: ``
      },
      FICHA_PROPIEDAD: {
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 32px;">{{propiedad.tipo}} en {{propiedad.operacion}}</h1>
    <h2 style="margin: 10px 0 0 0; font-weight: normal;">{{propiedad.direccion}}</h2>
  </div>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
      <h3 style="color: #667eea; margin-top: 0;">💰 Precio</h3>
      <p style="font-size: 28px; font-weight: bold; margin: 10px 0; color: #2c3e50;">{{propiedad.precio}}</p>
      <p style="color: #666; margin: 0;">{{propiedad.moneda}}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
      <h3 style="color: #667eea; margin-top: 0;">📍 Ubicación</h3>
      <p style="margin: 5px 0;"><strong>Ciudad:</strong> {{propiedad.ciudad}}</p>
      <p style="margin: 5px 0;"><strong>Barrio:</strong> {{propiedad.barrio}}</p>
      <p style="margin: 5px 0;"><strong>Zona:</strong> {{propiedad.zona}}</p>
    </div>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #2c3e50; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🏠 Características</h3>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px;">
      <div style="text-align: center; padding: 15px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;">
        <p style="font-size: 24px; margin: 0;">🛏️</p>
        <p style="margin: 10px 0 5px 0; font-weight: bold;">{{propiedad.habitaciones}}</p>
        <p style="margin: 0; color: #666; font-size: 14px;">Habitaciones</p>
      </div>
      <div style="text-align: center; padding: 15px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;">
        <p style="font-size: 24px; margin: 0;">🚿</p>
        <p style="margin: 10px 0 5px 0; font-weight: bold;">{{propiedad.banos}}</p>
        <p style="margin: 0; color: #666; font-size: 14px;">Baños</p>
      </div>
      <div style="text-align: center; padding: 15px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;">
        <p style="font-size: 24px; margin: 0;">📐</p>
        <p style="margin: 10px 0 5px 0; font-weight: bold;">{{propiedad.superficieTotal}}m²</p>
        <p style="margin: 0; color: #666; font-size: 14px;">Superficie Total</p>
      </div>
    </div>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #2c3e50; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📝 Descripción</h3>
    <p style="text-align: justify; line-height: 1.6; margin-top: 15px;">{{propiedad.descripcion}}</p>
  </div>
  
  <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 30px;">
    <h4 style="margin: 0 0 10px 0; color: #856404;">✨ Características Destacadas</h4>
    <ul style="margin: 0; padding-left: 20px;">
      {{#each propiedad.caracteristicas}}
      <li style="margin: 5px 0;">{{this}}</li>
      {{/each}}
    </ul>
  </div>
  
  <div style="background: #667eea; color: white; padding: 25px; border-radius: 10px; text-align: center;">
    <h3 style="margin: 0 0 15px 0;">¿Interesado en esta propiedad?</h3>
    <p style="margin: 0; font-size: 18px;"><strong>{{inmobiliaria.nombre}}</strong></p>
    <p style="margin: 10px 0;">📞 {{inmobiliaria.telefono}} | 📧 {{inmobiliaria.email}}</p>
    <p style="margin: 0;">📍 {{inmobiliaria.direccion}}</p>
  </div>
</div>`,
        styles: `* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; }
.grid { display: flex; flex-wrap: wrap; gap: 20px; }
.card { background: #f8f9fa; padding: 20px; border-radius: 8px; }`,
        header: ``,
        footer: `<div style="text-align: center; padding: 15px; background: #f8f9fa; border-top: 2px solid #667eea;">
  <p style="margin: 0; font-size: 12px; color: #666;">Código: {{propiedad.codigo}} | www.{{empresa.sitio}}</p>
</div>`
      },
      ACTUALIZACION_RENTA: {
        html: `<div style="font-family: Arial, sans-serif; padding: 40px;">
  <h1 style="text-align: center; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 15px;">
    NOTIFICACIÓN DE ACTUALIZACIÓN DE ALQUILER
  </h1>
  
  <p style="text-align: right; margin-top: 20px; color: #666;">
    {{ciudad}}, {{fechaNotificacion}}
  </p>
  
  <div style="background: #f8f9fa; padding: 20px; margin: 30px 0; border-left: 4px solid #3498db;">
    <p style="margin: 0;"><strong>Señor/a:</strong> {{inquilino.nombre}}</p>
    <p style="margin: 5px 0;"><strong>Domicilio:</strong> {{propiedad.direccion}}</p>
    <p style="margin: 5px 0;"><strong>DNI:</strong> {{inquilino.dni}}</p>
  </div>
  
  <p style="text-align: justify; line-height: 1.8; margin: 30px 0;">
    De nuestra consideración:
  </p>
  
  <p style="text-align: justify; line-height: 1.8;">
    Por medio de la presente, y en cumplimiento de lo establecido en el contrato de locación 
    suscrito el día <strong>{{contrato.fechaInicio}}</strong>, procedemos a notificarle la 
    actualización del canon locativo correspondiente al período <strong>{{actualizacion.periodo}}</strong>.
  </p>
  
  <div style="background: #e8f4f8; border: 2px solid #3498db; padding: 25px; margin: 30px 0; border-radius: 8px;">
    <h3 style="margin: 0 0 20px 0; color: #2c3e50; text-align: center;">Detalle de Actualización</h3>
    
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #ccc;"><strong>Período Anterior:</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #ccc; text-align: right;">{{actualizacion.periodoAnterior}}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #ccc;"><strong>Monto Anterior:</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #ccc; text-align: right; font-size: 18px;">{{actualizacion.montoAnterior}}</td>
      </tr>
      <tr style="background: #fff;">
        <td style="padding: 12px; border-bottom: 1px solid #ccc;"><strong>Índice IPC Aplicado:</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #ccc; text-align: right;">{{actualizacion.indiceIPC}}%</td>
      </tr>
      <tr style="background: #d4edda;">
        <td style="padding: 15px; font-size: 18px;"><strong>Nuevo Monto:</strong></td>
        <td style="padding: 15px; text-align: right; font-size: 24px; font-weight: bold; color: #27ae60;">
          {{actualizacion.montoNuevo}}
        </td>
      </tr>
    </table>
  </div>
  
  <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
    <p style="margin: 0;"><strong>📅 Fecha de vigencia:</strong> A partir del {{actualizacion.fechaVigencia}}</p>
    <p style="margin: 10px 0 0 0;"><strong>💳 Vencimiento:</strong> Día {{contrato.diaVencimiento}} de cada mes</p>
  </div>
  
  <p style="text-align: justify; line-height: 1.8; margin-top: 30px;">
    El ajuste del canon locativo se realizó conforme lo establecido en el artículo 14 de la 
    Ley N° 27.551 de Alquileres, utilizando el Índice de Precios al Consumidor (IPC) publicado 
    por el Instituto Nacional de Estadística y Censos (INDEC) correspondiente al período 
    <strong>{{actualizacion.periodoIPC}}</strong>.
  </p>
  
  <p style="text-align: justify; line-height: 1.8;">
    Quedamos a su disposición ante cualquier consulta.
  </p>
  
  <div style="margin-top: 80px;">
    <p style="margin: 0;">Saludamos a Ud. atentamente,</p>
    <div style="margin-top: 60px; text-align: center;">
      <div style="border-top: 1px solid #000; width: 250px; display: inline-block; padding-top: 10px;">
        <strong>{{inmobiliaria.nombre}}</strong><br/>
        Matrícula: {{inmobiliaria.matricula}}<br/>
        {{inmobiliaria.telefono}}
      </div>
    </div>
  </div>
</div>`,
        styles: `body { font-family: Arial, sans-serif; color: #2c3e50; }
h1 { color: #2c3e50; }
table { width: 100%; }
.highlight { background: #d4edda; font-weight: bold; }`,
        header: `<div style="padding: 15px; border-bottom: 1px solid #ccc; text-align: center;">
  <strong style="font-size: 14px;">{{inmobiliaria.nombre}}</strong><br/>
  <span style="font-size: 11px;">{{inmobiliaria.direccion}} - Tel: {{inmobiliaria.telefono}}</span>
</div>`,
        footer: `<div style="text-align: center; padding: 10px; font-size: 10px; color: #666; border-top: 1px solid #ccc;">
  Página {{pageNumber}} de {{totalPages}}
</div>`
      },
      CONTRATO_ALQUILER_TEMPORARIO: {
        html: `<div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
  <h1 style="text-align: center; color: #2c3e50;">CONTRATO DE LOCACIÓN TEMPORARIA</h1>
  
  <p style="text-align: right; margin-top: 20px;">
    En {{ciudad}}, a los {{dia}} días del mes de {{mes}} de {{anio}}
  </p>
  
  <h3>PARTES:</h3>
  <p><strong>LOCADOR:</strong> {{propietario.nombre}}, CUIL/CUIT {{propietario.cuil}}, con domicilio en {{propietario.domicilio}}</p>
  <p><strong>LOCATARIO:</strong> {{inquilino.nombre}}, CUIL/CUIT {{inquilino.cuil}}, proveniente de {{inquilino.ciudadOrigen}}, tel. {{inquilino.telefono}}</p>
  
  <h3>PRIMERA - OBJETO:</h3>
  <p>El LOCADOR da en locación temporaria al LOCATARIO el inmueble ubicado en
  <strong>{{propiedad.direccion}}, {{propiedad.ciudad}}, {{propiedad.provincia}}</strong>,
  con destino exclusivo de turismo y recreación, conforme al Art. 1199 del Código Civil y Comercial.</p>
  
  <h3>SEGUNDA - PLAZO Y FECHAS:</h3>
  <p>El período de locación será de <strong>{{contrato.cantidadDias}} días</strong>, comenzando el
  <strong>{{contrato.fechaInicio}}</strong> a las {{contrato.horaIngreso}} hs. y finalizando el
  <strong>{{contrato.fechaFin}}</strong> a las {{contrato.horaEgreso}} hs.</p>
  
  <h3>TERCERA - PRECIO Y FORMA DE PAGO:</h3>
  <p>El precio total convenido es de <strong>{{contrato.montoTotal}}</strong>
  ({{contrato.montoPorDia}} por día), pagadero en su totalidad al momento del ingreso a la propiedad.</p>
  
  <h3>CUARTA - DEPÓSITO DE GARANTÍA:</h3>
  <p>El LOCATARIO entrega en concepto de depósito de garantía la suma de <strong>{{contrato.deposito}}</strong>,
  el cual será reintegrado al egreso previa verificación del estado del inmueble e inventario.</p>
  
  <h3>QUINTA - CAPACIDAD MÁXIMA:</h3>
  <p>La propiedad será ocupada por un máximo de <strong>{{inquilino.cantPersonas}} personas</strong>.
  Queda expresamente prohibido el ingreso de mayor cantidad de personas sin autorización escrita del LOCADOR.</p>
  
  <h3>SEXTA - SERVICIOS INCLUIDOS:</h3>
  <p>{{contrato.serviciosIncluidos}}</p>
  
  <h3>SÉPTIMA - REGLAS Y CONDICIONES:</h3>
  <p>{{contrato.reglas}}</p>
  
  <h3>OCTAVA - INVENTARIO:</h3>
  <p>El inmueble se entrega con el mobiliario y equipamiento detallado en el inventario adjunto, el cual
  el LOCATARIO declara haber recibido en perfectas condiciones al momento del ingreso.</p>
  
  <div style="margin-top: 60px;">
    <div style="display: flex; justify-content: space-between;">
      <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">
          <strong>Firma Locador</strong><br/>
          {{propietario.nombre}}
        </div>
      </div>
      <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">
          <strong>Firma Locatario</strong><br/>
          {{inquilino.nombre}}
        </div>
      </div>
    </div>
  </div>
</div>`,
        styles: `body { font-family: Arial, sans-serif; }
h1 { color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px; }
h3 { color: #27ae60; margin-top: 20px; }
p { margin: 10px 0; text-align: justify; }`,
        header: `<div style="text-align: center; padding: 10px; border-bottom: 1px solid #ccc;">
  <strong>{{empresa.nombre}}</strong> &mdash; Tel: {{empresa.telefono}} &mdash; {{empresa.email}}
</div>`,
        footer: `<div style="text-align: center; font-size: 10px; color: #666; padding: 10px; border-top: 1px solid #ccc;">
  Página {{pageNumber}} de {{totalPages}} — {{empresa.direccion}}
</div>`
      },
      CONTRATO_ALQUILER_COMERCIAL: {
        html: `<div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.7;">
  <h1 style="text-align: center; color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 15px;">
    CONTRATO DE LOCACIÓN DE LOCAL COMERCIAL
  </h1>

  <p style="text-align: right; margin-top: 20px; color: #666;">
    En {{ciudad}}, a los {{dia}} días del mes de {{mes}} de {{anio}}
  </p>

  <p style="text-align: justify; margin-top: 30px;">
    Entre el Sr./Sra. <strong>{{propietario.nombre}}</strong>, CUIL/CUIT <strong>{{propietario.cuil}}</strong>,
    con domicilio en {{propietario.domicilio}}, de la ciudad de {{propietario.ciudad}},
    correo electrónico {{propietario.email}}, teléfono {{propietario.telefono}},
    en adelante denominado <strong>"EL LOCADOR"</strong>, por una parte, y por la otra el Sr./Sra.
    <strong>{{inquilino.nombre}}</strong>, CUIL/CUIT <strong>{{inquilino.cuil}}</strong>,
    con domicilio en {{inquilino.domicilio}}, {{inquilino.ciudad}}, {{inquilino.provincia}},
    correo electrónico {{inquilino.email}}, teléfono {{inquilino.telefono}},
    en adelante denominado <strong>"EL LOCATARIO"</strong>, convienen en celebrar el presente
    contrato de locación, sujeto a las siguientes cláusulas y condiciones:
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">PRIMERA: OBJETO.</h3>
  <p style="text-align: justify;">
    Por el presente contrato, el LOCADOR cede el uso del inmueble sito en
    <strong>{{propiedad.direccion}}, {{propiedad.ciudad}}, {{propiedad.provincia}}</strong>,
    por lo que, en contraprestación, EL LOCATARIO se obliga a pagar al LOCADOR en calidad de renta
    el monto referido en la cláusula Nº4, en la forma y oportunidad convenidas.
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">SEGUNDA: DESTINO DE LA LOCACIÓN.</h3>
  <p style="text-align: justify;">
    Las partes convienen que el inmueble referido en la cláusula primera será destinado a fines
    comerciales. El inmueble tiene Superficie cubierta: <strong>{{propiedad.superficieCubierta}} m²</strong>,
    Superficie total: <strong>{{propiedad.superficieTotal}} m²</strong>,
    con <strong>{{propiedad.habitaciones}}</strong> local(es) y
    <strong>{{propiedad.banos}}</strong> baño(s).
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">TERCERA: PLAZO DEL CONTRATO.</h3>
  <p style="text-align: justify;">
    Las partes convienen fijar un plazo de duración determinada de
    <strong>{{contrato.plazoMeses}} meses</strong>, computados a partir del
    <strong>{{contrato.fechaInicio}}</strong> y hasta el día <strong>{{contrato.fechaFin}}</strong>.
    Es obligación del LOCATARIO restituir al término de la locación el inmueble desocupado y en buen
    estado conforme a los arts. 1206 y 1207 del CCCN.
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">CUARTA: PRECIO - MORA.</h3>
  <p style="text-align: justify;">
    El precio del alquiler se fija de común acuerdo entre las partes en la suma de
    <strong>{{contrato.montoMensual}}</strong> para el primer cuatrimestre de la locación.<br/><br/>
    Para los cuatrimestres subsiguientes, el precio será actualizado cada cuatro (4) meses aplicando
    el Índice de Precios al Consumidor (IPC) publicado por el INDEC, mediante capitalización compuesta
    de las variaciones mensuales del IPC de los cuatro meses inmediatos anteriores conforme a la Ley
    N° 27.551.<br/><br/>
    EL LOCATARIO abonará el alquiler en efectivo, por adelantado, del 1° al día
    {{contrato.diaVencimiento}} de cada mes.<br/><br/>
    La falta de pago producirá un interés equivalente al uno por ciento (1%) diario. La falta de pago
    de un (1) solo canon mensual constituirá mora automática sin necesidad de interpelación previa.
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">QUINTA: MODIFICACIONES.</h3>
  <p style="text-align: justify;">
    EL LOCATARIO tiene expresamente prohibido efectuar mejoras o modificaciones que alteren la
    estructura del inmueble sin autorización previa y por escrito del LOCADOR. De autorizarse la
    realización de mejoras, estas quedan a beneficio del inmueble sin derecho a indemnización alguna.
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">SEXTA: IMPUESTOS Y SERVICIOS.</h3>
  <p style="text-align: justify;">
    EL LOCATARIO debe pagar los servicios de luz y cualquier otro servicio domiciliario.
    Serán a cargo del LOCADOR las cargas que graven el inmueble (Impuesto Municipal, Impuesto Provincial).
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">SÉPTIMA: INCUMPLIMIENTO.</h3>
  <p style="text-align: justify;">
    En caso de mora o de cualquier otro incumplimiento del LOCATARIO, el LOCADOR podrá pedir el
    cumplimiento del contrato o resolverlo y solicitar el inmediato desalojo (art. 1086 CCCN).
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">OCTAVA: IRRESPONSABILIDAD.</h3>
  <p style="text-align: justify;">
    El LOCADOR no se responsabiliza por daños a personas o cosas en el inmueble como consecuencia de
    inundaciones, filtraciones, incendios, ruinas, desperfectos de cualquier tipo o caso fortuito.
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">NOVENA: RESOLUCIÓN ANTICIPADA.</h3>
  <p style="text-align: justify;">
    El LOCATARIO podrá resolver este contrato sin expresión de causa luego de transcurridos los
    primeros seis (6) meses, notificando con un (1) mes de anticipación. Si la resolución fuere
    durante el primer año, abonará como indemnización un mes y medio (1,5) de alquiler. Transcurrido
    el primer año, podrá rescindir con tres (3) meses de preaviso sin pagar indemnización.
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">DÉCIMA: INTRANSFERIBILIDAD.</h3>
  <p style="text-align: justify;">
    El LOCATARIO no podrá subarrendar, permutar, prestar ni ceder en todo o en parte el inmueble,
    ni transferir los derechos del presente contrato. Su incumplimiento es causal de rescisión.
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">DÉCIMA PRIMERA: RENOVACIÓN.</h3>
  <p style="text-align: justify;">
    Este contrato no puede ser prorrogado ni renovado sin previo acuerdo escrito de las partes
    acerca de las nuevas condiciones del arrendamiento.
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">DÉCIMA SEGUNDA: COMPETENCIA Y JURISDICCIÓN.</h3>
  <p style="text-align: justify;">
    Las partes renuncian al fuero federal y se someten a la jurisdicción de la justicia ordinaria
    de {{ciudad}} para cualquier cuestión derivada del presente.
  </p>

  <h3 style="color: #2c3e50; margin-top: 25px;">DÉCIMA TERCERA: FIRMA Y EJEMPLARES.</h3>
  <p style="text-align: justify;">
    El impuesto de sello provincial será abonado íntegramente por EL LOCATARIO. Leído, las partes
    declaran su conformidad y firman tres (3) ejemplares de un mismo tenor y a un solo efecto,
    en {{ciudad}}, el {{dia}} de {{mes}} de {{anio}}.
  </p>

  <div style="margin-top: 80px;">
    <div style="display: flex; justify-content: space-between;">
      <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">
          <strong>Firma Locador</strong><br/>
          {{propietario.nombre}}
        </div>
      </div>
      <div style="text-align: center;">
        <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px;">
          <strong>Firma Locatario</strong><br/>
          {{inquilino.nombre}}
        </div>
      </div>
    </div>
  </div>
</div>`,
        styles: `body { font-family: Arial, sans-serif; color: #2c3e50; }
h1 { color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
h3 { color: #2c3e50; margin-top: 25px; }
p { margin: 10px 0; text-align: justify; }`,
        header: `<div style="text-align: center; padding: 10px; border-bottom: 1px solid #ccc;">
  <strong>{{empresa.nombre}}</strong> — Tel: {{empresa.telefono}} — {{empresa.email}}
</div>`,
        footer: `<div style="text-align: center; font-size: 10px; color: #666; padding: 10px; border-top: 1px solid #ccc;">
  Página {{pageNumber}} de {{totalPages}} — {{empresa.direccion}}
</div>`
      }
    };

    const key = propertyPurpose ? `${templateType}_${propertyPurpose}` : templateType;
    return examples[key] || examples[templateType] || { html: '', styles: '', header: '', footer: '' };
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    const exampleTemplate = selectedType ? getExampleTemplate(selectedType) : { html: '', styles: '', header: '', footer: '' };
    
    setFormData({
      templateType: selectedType || '',
      templateName: '',
      htmlTemplate: exampleTemplate.html,
      styles: exampleTemplate.styles,
      headerHtml: exampleTemplate.header,
      footerHtml: exampleTemplate.footer,
      pageSize: 'A4',
      orientation: 'portrait',
      propertyPurpose: '',
      isActive: true,
      isDefault: false,
    });
    setShowEditor(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      templateType: template.templateType,
      templateName: template.templateName,
      htmlTemplate: template.htmlTemplate,
      styles: template.styles || '',
      headerHtml: template.headerHtml || '',
      footerHtml: template.footerHtml || '',
      pageSize: template.pageSize,
      orientation: template.orientation,
      propertyPurpose: template.propertyPurpose || '',
      isActive: template.isActive,
      isDefault: template.isDefault,
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.templateType || !formData.templateName || !formData.htmlTemplate) {
        toast.error('Por favor completa los campos requeridos');
        return;
      }

      if (editingTemplate) {
        await updateTemplate({
          id: editingTemplate.id,
          ...formData,
        }).unwrap();
        toast.success('Plantilla actualizada exitosamente');
      } else {
        await createTemplate(formData).unwrap();
        toast.success('Plantilla creada exitosamente');
      }

      setShowEditor(false);
      setEditingTemplate(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Error al guardar plantilla');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta plantilla?')) return;

    try {
      await deleteTemplate(id).unwrap();
      toast.success('Plantilla eliminada exitosamente');
    } catch (error) {
      toast.error(error?.data?.message || 'Error al eliminar plantilla');
    }
  };

  const handleDuplicate = async (id, name) => {
    try {
      await duplicateTemplate({
        id,
        templateName: `${name} (Copia)`,
      }).unwrap();
      toast.success('Plantilla duplicada exitosamente');
    } catch (error) {
      toast.error(error?.data?.message || 'Error al duplicar plantilla');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setAsDefault(id).unwrap();
      toast.success('Plantilla marcada como predeterminada');
    } catch (error) {
      toast.error(error?.data?.message || 'Error al marcar como predeterminada');
    }
  };

  const handleResetDefault = async (templateType) => {
    if (!window.confirm(`¿Restaurar el contenido por defecto de la plantilla "${templateType}"? Se perderán los cambios personalizados.`)) return;
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      await axios.post(
        `${API_URL}/pdf-templates/reset-defaults`,
        { templateType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Plantilla restaurada al contenido por defecto');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error al restaurar plantilla');
    }
  };

  const handleToggleActive = async (template) => {
    try {
      await updateTemplate({
        id: template.id,
        isActive: !template.isActive,
      }).unwrap();
      toast.success(
        template.isActive ? 'Plantilla desactivada' : 'Plantilla activada'
      );
    } catch (error) {
      toast.error(error?.data?.message || 'Error al cambiar estado');
    }
  };

  const getTypeLabel = (typeValue) => {
    const type = types.find((t) => t.value === typeValue);
    return type?.label || typeValue;
  };

  if (showEditor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <IoArrowBackOutline className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-white">
                  {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <IoCloseOutline className="w-5 h-5" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <IoSaveOutline className="w-5 h-5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 gap-6">
            {/* Configuración básica */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Configuración Básica
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Plantilla *
                  </label>
                  <select
                    value={formData.templateType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      if (!editingTemplate) {
                        const example = getExampleTemplate(newType, formData.propertyPurpose);
                        if (example.html) {
                          const shouldReplace = !formData.htmlTemplate || window.confirm('¿Cargar la plantilla de ejemplo para este tipo? Se reemplazará el contenido actual.');
                          if (shouldReplace) {
                            setFormData({ ...formData, templateType: newType, htmlTemplate: example.html, styles: example.styles, headerHtml: example.header, footerHtml: example.footer });
                            return;
                          }
                        }
                      }
                      setFormData({ ...formData, templateType: newType });
                    }}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                    disabled={!!editingTemplate}
                  >
                    <option value="">Selecciona un tipo</option>
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre de la Plantilla *
                  </label>
                  <input
                    type="text"
                    value={formData.templateName}
                    onChange={(e) =>
                      setFormData({ ...formData, templateName: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Contrato Estándar"
                  />
                </div>

                {['CONTRATO_ALQUILER', 'CONTRATO_ALQUILER_TEMPORARIO'].includes(formData.templateType) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Aplica a tipo de propiedad
                    </label>
                    <select
                      value={formData.propertyPurpose}
                      onChange={(e) => {
                        const newPurpose = e.target.value;
                        if (!editingTemplate) {
                          const example = getExampleTemplate(formData.templateType, newPurpose);
                          if (example.html) {
                            if (!formData.htmlTemplate || window.confirm('¿Desea cargar la plantilla de ejemplo para este tipo de propiedad? Se reemplazará el contenido actual.')) {
                              setFormData({ ...formData, propertyPurpose: newPurpose, htmlTemplate: example.html, styles: example.styles, headerHtml: example.header, footerHtml: example.footer });
                              return;
                            }
                          }
                        }
                        setFormData({ ...formData, propertyPurpose: newPurpose });
                      }}
                      className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="">Todos los tipos de propiedad</option>
                      <option value="VIVIENDA">Vivienda (casa, departamento, duplex)</option>
                      <option value="COMERCIAL">Comercial (local, oficina, finca, galpón...)</option>
                      <option value="TERRENO">Terreno (lote, terreno)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      El sistema seleccionará automáticamente esta plantilla cuando el tipo de propiedad coincida.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tamaño de Página
                    </label>
                    <select
                      value={formData.pageSize}
                      onChange={(e) =>
                        setFormData({ ...formData, pageSize: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Orientación
                    </label>
                    <select
                      value={formData.orientation}
                      onChange={(e) =>
                        setFormData({ ...formData, orientation: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="portrait">Vertical</option>
                      <option value="landscape">Horizontal</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Activa</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData({ ...formData, isDefault: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Predeterminada</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Editor de contenido */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mt-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Contenido de la Plantilla *
            </h2>
            <VisualPdfEditor
              value={formData.htmlTemplate}
              onChange={(value) => setFormData({ ...formData, htmlTemplate: value })}
              templateType={formData.templateType}
              pageSize={formData.pageSize}
              orientation={formData.orientation}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6"}>
      <div className="max-w-7xl mx-auto">
        {/* Header - Solo mostrar si no está embebido */}
        {!embedded && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/panel')}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <IoArrowBackOutline className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Gestión de Plantillas PDF
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Administra las plantillas de documentos para tu inmobiliaria
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowClauseLibrary(true)}
                  className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                >
                  <IoDocumentTextOutline className="w-4 h-4" />
                  <span>Biblioteca de cláusulas</span>
                </button>
                <button
                  onClick={() => setShowWizard(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                >
                  <IoAddOutline className="w-4 h-4" />
                  <span>Crear con asistente</span>
                </button>
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                >
                  <IoAddOutline className="w-4 h-4" />
                  <span>HTML manual</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header embebido - Más simple */}
        {embedded && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Plantillas PDF</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Personaliza los documentos que genera tu inmobiliaria
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <IoAddOutline className="w-5 h-5" />
                <span>Nueva Plantilla</span>
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className={`${embedded ? 'bg-white' : 'bg-white/5 backdrop-blur-xl'} rounded-lg shadow-lg border ${embedded ? 'border-gray-200' : 'border-white/10'} p-6 mb-6`}>
          <div className="flex items-center space-x-4">
            <label className={`text-sm font-medium ${embedded ? 'text-gray-700' : 'text-slate-300'}`}>
              Filtrar por tipo:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                embedded 
                  ? 'bg-white border-gray-300 text-gray-900' 
                  : 'bg-white/5 border-white/10 text-white'
              }`}
            >
              <option value="">Todos los tipos</option>
              {types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-400">
              {filteredTemplates.length} plantilla(s)
            </span>
          </div>
        </div>

        {/* Lista de plantillas */}
        {loadingTemplates ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <IoDocumentTextOutline className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No hay plantillas creadas</p>
            <p className="text-slate-500 text-sm">
              Crea tu primera plantilla para comenzar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`rounded-2xl border p-5 transition-all flex flex-col ${
                  embedded
                    ? 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'
                    : 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-blue-500/50'
                }`}
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`text-base font-semibold truncate ${embedded ? 'text-gray-800' : 'text-white'}`}>
                        {template.templateName}
                      </h3>
                      {template.isDefault && (
                        <IoStar className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs ${embedded ? 'text-gray-500' : 'text-slate-400'}`}>
                      {getTypeLabel(template.templateType)}
                    </p>
                    {template.propertyPurpose && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-teal-500/20 text-teal-600 rounded-full">
                        {template.propertyPurpose === 'VIVIENDA' && 'Vivienda'}
                        {template.propertyPurpose === 'COMERCIAL' && 'Comercial'}
                        {template.propertyPurpose === 'TERRENO' && 'Terreno'}
                      </span>
                    )}
                  </div>
                  <span className="flex-shrink-0">
                    {template.isActive ? (
                      <IoCheckmarkCircleOutline className="w-5 h-5 text-green-500" />
                    ) : (
                      <IoCloseCircleOutline className="w-5 h-5 text-red-400" />
                    )}
                  </span>
                </div>

                {/* Info adicional */}
                <div className={`text-xs mb-3 ${embedded ? 'text-gray-400' : 'text-slate-500'}`}>
                  <span>Creado: {new Date(template.createdAt).toLocaleDateString()}</span>
                  {template.Creator && (
                    <span className="ml-2">· {template.Creator.fullName}</span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 mt-auto">
                  {/* Fila 1: Editar (ancho completo) */}
                  <button
                    onClick={() => handleEdit(template)}
                    className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium ${
                      embedded
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                        : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                    }`}
                    title="Editar"
                  >
                    <IoCreateOutline className="w-4 h-4" />
                    <span>Editar</span>
                  </button>

                  {/* Restaurar por defecto */}
                  <button
                    onClick={() => handleResetDefault(template.templateType)}
                    className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium ${
                      embedded
                        ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                        : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300'
                    }`}
                    title="Restaurar contenido por defecto"
                  >
                    <IoRefreshOutline className="w-4 h-4" />
                    <span>Restaurar por defecto</span>
                  </button>

                  {/* Fila 2: acciones secundarias distribuidas */}
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${!template.isDefault ? 4 : 3}, 1fr)` }}>
                    <button
                      onClick={() => handleDuplicate(template.id, template.templateName)}
                      className={`py-2 rounded-lg transition-colors flex items-center justify-center ${
                        embedded
                          ? 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200'
                          : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                      }`}
                      title="Duplicar"
                    >
                      <IoCopyOutline className="w-4 h-4" />
                    </button>

                    {!template.isDefault && (
                      <button
                        onClick={() => handleSetDefault(template.id)}
                        className={`py-2 rounded-lg transition-colors flex items-center justify-center ${
                          embedded
                            ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border border-yellow-200'
                            : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                        }`}
                        title="Marcar como predeterminada"
                      >
                        <IoStarOutline className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleActive(template)}
                      className={`py-2 rounded-lg transition-colors flex items-center justify-center ${
                        template.isActive
                          ? embedded
                            ? 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200'
                            : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                          : embedded
                            ? 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                      }`}
                      title={template.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {template.isActive ? (
                        <IoCloseCircleOutline className="w-4 h-4" />
                      ) : (
                        <IoCheckmarkCircleOutline className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(template.id)}
                      className={`py-2 rounded-lg transition-colors flex items-center justify-center ${
                        embedded
                          ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                      }`}
                      title="Eliminar"
                    >
                      <IoTrashOutline className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wizard de plantilla */}
      {showWizard && (
        <TemplateWizard
          onClose={() => setShowWizard(false)}
          onSaved={() => { setShowWizard(false); toast.success('Plantilla creada con el asistente'); }}
        />
      )}

      {/* Biblioteca de cláusulas */}
      {showClauseLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[94vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
              <span className="text-base font-bold text-gray-900">Biblioteca de cláusulas</span>
              <button onClick={() => setShowClauseLibrary(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ClauseLibraryManager />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

PdfTemplateManager.propTypes = {
  embedded: PropTypes.bool,
};

export default PdfTemplateManager;
