import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import VisualPdfEditor from './VisualPdfEditor';

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
  const getExampleTemplate = (templateType) => {
    const examples = {
      CONTRATO_ALQUILER: {
        html: `<div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
  <h1 style="text-align: center; color: #2c3e50;">CONTRATO DE LOCACIÓN DE INMUEBLE</h1>
  
  <p style="text-align: right; margin-top: 20px;">
    En {{ciudad}}, a los {{dia}} días del mes de {{mes}} de {{anio}}
  </p>
  
  <h3>PARTES:</h3>
  <p><strong>LOCADOR:</strong> {{propietario.nombre}}, DNI {{propietario.dni}}, con domicilio en {{propietario.domicilio}}</p>
  <p><strong>LOCATARIO:</strong> {{inquilino.nombre}}, DNI {{inquilino.dni}}, con domicilio en {{inquilino.domicilio}}</p>
  
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
      }
    };
    
    return examples[templateType] || { html: '', styles: '', header: '', footer: '' };
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    onChange={(e) =>
                      setFormData({ ...formData, templateType: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Variables disponibles */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Variables Disponibles
              </h2>
              
              {formData.templateType && (
                <div className="space-y-2">
                  {types
                    .find((t) => t.value === formData.templateType)
                    ?.variables.map((variable) => (
                      <div
                        key={variable}
                        className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-mono"
                      >
                        {`{{${variable}}}`}
                      </div>
                    ))}
                </div>
              )}

              {!formData.templateType && (
                <p className="text-slate-400 text-sm">
                  Selecciona un tipo de plantilla para ver las variables disponibles
                </p>
              )}
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
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <IoAddOutline className="w-5 h-5" />
                <span>Nueva Plantilla</span>
              </button>
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
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-blue-500/50 transition-all"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {template.templateName}
                      </h3>
                      {template.isDefault && (
                        <IoStar className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {getTypeLabel(template.templateType)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {template.isActive ? (
                      <IoCheckmarkCircleOutline className="w-5 h-5 text-green-400" />
                    ) : (
                      <IoCloseCircleOutline className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    title="Editar"
                  >
                    <IoCreateOutline className="w-4 h-4" />
                    <span className="text-sm">Editar</span>
                  </button>

                  <button
                    onClick={() => handleDuplicate(template.id, template.templateName)}
                    className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                    title="Duplicar"
                  >
                    <IoCopyOutline className="w-4 h-4" />
                  </button>

                  {!template.isDefault && (
                    <button
                      onClick={() => handleSetDefault(template.id)}
                      className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
                      title="Marcar como predeterminada"
                    >
                      <IoStarOutline className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      template.isActive
                        ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
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
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                  </button>
                </div>

                {/* Info adicional */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Creado: {new Date(template.createdAt).toLocaleDateString()}</span>
                    {template.Creator && (
                      <span>Por: {template.Creator.fullName}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

PdfTemplateManager.propTypes = {
  embedded: PropTypes.bool,
};

export default PdfTemplateManager;
