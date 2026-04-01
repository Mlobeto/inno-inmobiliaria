import { useRef, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import PropTypes from 'prop-types';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { IoHelpCircleOutline } from 'react-icons/io5';

// Dimensiones de página estándar en milímetros
const PAGE_DIMENSIONS = {
  A4:     { width: 210,   height: 297,   label: 'A4' },
  Letter: { width: 215.9, height: 279.4, label: 'Carta (Letter)' },
  Legal:  { width: 215.9, height: 355.6, label: 'Legal' },
};

// 1 mm = 3.7795 px a 96 dpi
const MM_TO_PX = 3.7795;

const VisualPdfEditor = ({ value, onChange, templateType, pageSize = 'A4', orientation = 'portrait' }) => {
  const quillRef = useRef(null);

  // Iniciar tour solo la primera vez
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('pdfEditorTourCompleted');
    if (!hasSeenTour && templateType) {
      // Dar tiempo para que el DOM se renderice
      setTimeout(() => {
        startTour();
      }, 500);
    }
  }, [templateType]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: [
        {
          element: '.pdf-editor-variables',
          popover: {
            title: '📋 Panel de Variables',
            description: 'Aquí encontrarás todas las variables disponibles organizadas por categoría. Haz clic en cualquier variable para insertarla en tu documento.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.pdf-editor-variable-button',
          popover: {
            title: '🖱️ Insertar Variables',
            description: 'Haz clic en cualquiera de estos botones para insertar la variable en la posición del cursor. Por ejemplo, {{empresa.nombre}} se reemplazará con el nombre real de tu inmobiliaria.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '.ql-toolbar',
          popover: {
            title: '🎨 Barra de Herramientas',
            description: 'Usa estas herramientas para dar formato a tu texto: negritas, cursivas, colores, tamaños de fuente, listas, alineación y más. ¡Funciona como Microsoft Word!',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.ql-editor',
          popover: {
            title: '✍️ Área de Edición',
            description: 'Escribe tu documento aquí como lo harías en Word. Puedes escribir texto normal, aplicar formatos, insertar imágenes y agregar variables haciendo clic en los botones de arriba.',
            side: 'top',
            align: 'center'
          }
        },
        {
          popover: {
            title: '✅ ¡Listo para empezar!',
            description: 'Ahora puedes crear tu plantilla personalizada. Recuerda que las variables (como {{empresa.nombre}}) se reemplazarán automáticamente con datos reales al generar el PDF. Si necesitas ver este tutorial nuevamente, haz clic en el botón "?" en la esquina superior derecha.',
          }
        }
      ],
      onDestroyStarted: () => {
        localStorage.setItem('pdfEditorTourCompleted', 'true');
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  const resetTour = () => {
    localStorage.removeItem('pdfEditorTourCompleted');
    startTour();
  };

  // Variables disponibles según tipo de plantilla
  const getAvailableVariables = () => {
    const common = {
      empresa: [
        { label: 'Nombre de la empresa', value: '{{empresa.nombre}}' },
        { label: 'CUIT', value: '{{empresa.cuit}}' },
        { label: 'Dirección', value: '{{empresa.direccion}}' },
        { label: 'Teléfono', value: '{{empresa.telefono}}' },
        { label: 'Email', value: '{{empresa.email}}' },
        { label: 'Matrícula', value: '{{empresa.matricula}}' },
        { label: 'Logo (URL)', value: '{{empresa.logo}}' },
      ],
      fechas: [
        { label: 'Fecha actual', value: '{{fechaActual}}' },
        { label: 'Día', value: '{{dia}}' },
        { label: 'Mes', value: '{{mes}}' },
        { label: 'Año', value: '{{anio}}' },
        { label: 'Ciudad', value: '{{ciudad}}' },
      ],
    };

    const byType = {
      CONTRATO_ALQUILER: {
        contrato: [
          { label: 'Plazo en meses', value: '{{contrato.plazoMeses}}' },
          { label: 'Fecha inicio', value: '{{contrato.fechaInicio}}' },
          { label: 'Fecha fin', value: '{{contrato.fechaFin}}' },
          { label: 'Monto mensual', value: '{{contrato.montoMensual}}' },
          { label: 'Día de vencimiento', value: '{{contrato.diaVencimiento}}' },
        ],
        propietario: [
          { label: 'Nombre propietario', value: '{{propietario.nombre}}' },
          { label: 'DNI propietario', value: '{{propietario.dni}}' },
          { label: 'Domicilio propietario', value: '{{propietario.domicilio}}' },
        ],
        inquilino: [
          { label: 'Nombre inquilino', value: '{{inquilino.nombre}}' },
          { label: 'DNI inquilino', value: '{{inquilino.dni}}' },
          { label: 'Domicilio inquilino', value: '{{inquilino.domicilio}}' },
        ],
        propiedad: [
          { label: 'Dirección', value: '{{propiedad.direccion}}' },
          { label: 'Ciudad', value: '{{propiedad.ciudad}}' },
          { label: 'Provincia', value: '{{propiedad.provincia}}' },
        ],
      },
      AUTORIZACION_VENTA: {
        propietario: [
          { label: 'Nombre propietario', value: '{{propietario.nombre}}' },
          { label: 'DNI propietario', value: '{{propietario.dni}}' },
        ],
        inmobiliaria: [
          { label: 'Nombre inmobiliaria', value: '{{inmobiliaria.nombre}}' },
          { label: 'CUIT inmobiliaria', value: '{{inmobiliaria.cuit}}' },
          { label: 'Dirección inmobiliaria', value: '{{inmobiliaria.direccion}}' },
          { label: 'Matrícula', value: '{{inmobiliaria.matricula}}' },
        ],
        propiedad: [
          { label: 'Dirección', value: '{{propiedad.direccion}}' },
          { label: 'Ciudad', value: '{{propiedad.ciudad}}' },
          { label: 'Provincia', value: '{{propiedad.provincia}}' },
          { label: 'Tipo', value: '{{propiedad.tipo}}' },
          { label: 'Superficie total', value: '{{propiedad.superficieTotal}}' },
          { label: 'Ambientes', value: '{{propiedad.ambientes}}' },
          { label: 'Habitaciones', value: '{{propiedad.habitaciones}}' },
          { label: 'Baños', value: '{{propiedad.banos}}' },
          { label: 'Precio', value: '{{propiedad.precio}}' },
        ],
        otros: [
          { label: 'Comisión %', value: '{{comision}}' },
          { label: 'Plazo días', value: '{{plazo}}' },
        ],
      },
      RECIBO_PAGO: {
        recibo: [
          { label: 'Número de recibo', value: '{{recibo.numero}}' },
          { label: 'Fecha', value: '{{recibo.fecha}}' },
        ],
        cliente: [
          { label: 'Nombre cliente', value: '{{cliente.nombre}}' },
          { label: 'DNI/CUIT', value: '{{cliente.documento}}' },
          { label: 'Domicilio', value: '{{cliente.domicilio}}' },
        ],
        pago: [
          { label: 'Concepto', value: '{{pago.concepto}}' },
          { label: 'Monto', value: '{{pago.monto}}' },
          { label: 'Monto en letras', value: '{{pago.montoLetras}}' },
          { label: 'Período', value: '{{pago.periodo}}' },
          { label: 'Forma de pago', value: '{{pago.formaPago}}' },
          { label: 'Banco', value: '{{pago.banco}}' },
          { label: 'Nº Operación', value: '{{pago.numeroOperacion}}' },
        ],
        propiedad: [
          { label: 'Dirección', value: '{{propiedad.direccion}}' },
        ],
      },
      FICHA_PROPIEDAD: {
        propiedad: [
          { label: 'Tipo', value: '{{propiedad.tipo}}' },
          { label: 'Operación', value: '{{propiedad.operacion}}' },
          { label: 'Dirección', value: '{{propiedad.direccion}}' },
          { label: 'Ciudad', value: '{{propiedad.ciudad}}' },
          { label: 'Barrio', value: '{{propiedad.barrio}}' },
          { label: 'Zona', value: '{{propiedad.zona}}' },
          { label: 'Precio', value: '{{propiedad.precio}}' },
          { label: 'Moneda', value: '{{propiedad.moneda}}' },
          { label: 'Habitaciones', value: '{{propiedad.habitaciones}}' },
          { label: 'Baños', value: '{{propiedad.banos}}' },
          { label: 'Superficie total', value: '{{propiedad.superficieTotal}}' },
          { label: 'Descripción', value: '{{propiedad.descripcion}}' },
          { label: 'Código', value: '{{propiedad.codigo}}' },
        ],
      },
      ACTUALIZACION_RENTA: {
        inquilino: [
          { label: 'Nombre inquilino', value: '{{inquilino.nombre}}' },
          { label: 'DNI inquilino', value: '{{inquilino.dni}}' },
        ],
        propiedad: [
          { label: 'Dirección', value: '{{propiedad.direccion}}' },
        ],
        contrato: [
          { label: 'Fecha inicio', value: '{{contrato.fechaInicio}}' },
          { label: 'Día vencimiento', value: '{{contrato.diaVencimiento}}' },
        ],
        actualizacion: [
          { label: 'Período', value: '{{actualizacion.periodo}}' },
          { label: 'Período anterior', value: '{{actualizacion.periodoAnterior}}' },
          { label: 'Monto anterior', value: '{{actualizacion.montoAnterior}}' },
          { label: 'Índice IPC %', value: '{{actualizacion.indiceIPC}}' },
          { label: 'Monto nuevo', value: '{{actualizacion.montoNuevo}}' },
          { label: 'Fecha vigencia', value: '{{actualizacion.fechaVigencia}}' },
          { label: 'Período IPC', value: '{{actualizacion.periodoIPC}}' },
        ],
        otros: [
          { label: 'Fecha notificación', value: '{{fechaNotificacion}}' },
        ],
      },
      CONTRATO_ALQUILER_TEMPORARIO: {
        contrato: [
          { label: 'Fecha inicio', value: '{{contrato.fechaInicio}}' },
          { label: 'Fecha fin', value: '{{contrato.fechaFin}}' },
          { label: 'Cantidad de días', value: '{{contrato.cantidadDias}}' },
          { label: 'Monto total', value: '{{contrato.montoTotal}}' },
          { label: 'Monto por día', value: '{{contrato.montoPorDia}}' },
          { label: 'Depósito de garantía', value: '{{contrato.deposito}}' },
          { label: 'Hora de ingreso', value: '{{contrato.horaIngreso}}' },
          { label: 'Hora de egreso', value: '{{contrato.horaEgreso}}' },
          { label: 'Servicios incluidos', value: '{{contrato.serviciosIncluidos}}' },
          { label: 'Reglas de la propiedad', value: '{{contrato.reglas}}' },
        ],
        propietario: [
          { label: 'Nombre propietario', value: '{{propietario.nombre}}' },
          { label: 'DNI propietario', value: '{{propietario.dni}}' },
          { label: 'Domicilio propietario', value: '{{propietario.domicilio}}' },
        ],
        inquilino: [
          { label: 'Nombre inquilino', value: '{{inquilino.nombre}}' },
          { label: 'DNI inquilino', value: '{{inquilino.dni}}' },
          { label: 'Ciudad de origen', value: '{{inquilino.ciudadOrigen}}' },
          { label: 'Teléfono', value: '{{inquilino.telefono}}' },
          { label: 'Cant. de personas', value: '{{inquilino.cantPersonas}}' },
        ],
        propiedad: [
          { label: 'Dirección', value: '{{propiedad.direccion}}' },
          { label: 'Ciudad', value: '{{propiedad.ciudad}}' },
          { label: 'Provincia', value: '{{propiedad.provincia}}' },
          { label: 'Descripción', value: '{{propiedad.descripcion}}' },
        ],
      },
    };

    return {
      ...common,
      ...(byType[templateType] || {}),
    };
  };

  const variables = getAvailableVariables();

  // Calcular dimensiones de página para la simulación visual
  const baseSize = PAGE_DIMENSIONS[pageSize] || PAGE_DIMENSIONS.A4;
  const pageDims = orientation === 'landscape'
    ? { ...baseSize, width: baseSize.height, height: baseSize.width }
    : baseSize;
  const pageWidthPx = Math.round(pageDims.width * MM_TO_PX);
  const mTop    = Math.round(20 * MM_TO_PX); // 76px — margen superior
  const mBottom = Math.round(20 * MM_TO_PX); // 76px — margen inferior
  const mLeft   = Math.round(15 * MM_TO_PX); // 57px — margen izquierdo
  const mRight  = Math.round(15 * MM_TO_PX); // 57px — margen derecho
  const editorScopeClass = `pdf-pg-${pageSize.toLowerCase()}-${orientation}`;

  // Configuración del editor Quill
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      ['clean'],
    ],
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'blockquote', 'code-block',
    'indent',
    'link', 'image',
  ];

  const handleInsertVariable = (variable) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const cursorPosition = editor.getSelection()?.index || 0;
      editor.insertText(cursorPosition, variable);
      editor.setSelection(cursorPosition + variable.length);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón de ayuda */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetTour}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg"
          title="Ver tutorial de uso"
        >
          <IoHelpCircleOutline className="w-5 h-5" />
          <span className="text-sm font-medium">¿Cómo usar el editor?</span>
        </button>
      </div>

      {/* Panel de variables */}
      <div className="pdf-editor-variables bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Variables disponibles - Haz clic para insertar
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(variables).map(([category, items], categoryIndex) => (
            <div key={category} className="bg-white rounded-lg p-3 border border-blue-100">
              <h5 className="font-medium text-sm text-blue-800 mb-2 capitalize">
                {category}
              </h5>
              <div className="space-y-1">
                {items.map((item, itemIndex) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleInsertVariable(item.value)}
                    className={`pdf-editor-variable-button w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded transition-colors text-blue-900 font-mono ${
                      categoryIndex === 0 && itemIndex === 0 ? 'pdf-editor-variable-button' : ''
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor visual — simulación de hoja PDF */}
      <style>{`
        .${editorScopeClass} .ql-editor {
          padding: ${mTop}px ${mRight}px ${mBottom}px ${mLeft}px !important;
          min-height: 500px;
          background-image:
            linear-gradient(to bottom, rgba(147,197,253,0.18) ${mTop}px, transparent ${mTop}px),
            linear-gradient(to top,   rgba(147,197,253,0.18) ${mBottom}px, transparent ${mBottom}px),
            linear-gradient(to right, rgba(147,197,253,0.18) ${mLeft}px,  transparent ${mLeft}px),
            linear-gradient(to left,  rgba(147,197,253,0.18) ${mRight}px, transparent ${mRight}px);
          background-color: white;
        }
        .${editorScopeClass} .ql-toolbar.ql-snow {
          background: #f3f4f6;
          border-radius: 0;
        }
        .${editorScopeClass} .ql-container.ql-snow {
          border-top: none;
        }
      `}</style>

      <div style={{ background: '#4b5563', padding: '16px', borderRadius: '8px' }}>
        {/* Barra de información de página */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          color: '#e5e7eb',
          fontSize: '11px',
          fontFamily: 'monospace',
          marginBottom: '12px',
        }}>
          <span>📄 <strong>{pageDims.label}</strong></span>
          <span style={{ color: '#6b7280' }}>—</span>
          <span>{Math.round(pageDims.width)}mm × {Math.round(pageDims.height)}mm</span>
          <span style={{ color: '#6b7280' }}>|</span>
          <span>{orientation === 'portrait' ? '⬜ Vertical' : '🔲 Horizontal'}</span>
          <span style={{ color: '#6b7280' }}>|</span>
          <span style={{ color: '#93c5fd' }}>Márgenes: ↕ 20mm · ↔ 15mm</span>
        </div>

        {/* Hoja de papel */}
        <div style={{
          width: `${pageWidthPx}px`,
          maxWidth: '100%',
          margin: '0 auto',
          boxShadow: '0 4px 30px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.2)',
        }}>
          <div className={editorScopeClass}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={value}
              onChange={onChange}
              modules={modules}
              formats={formats}
              placeholder="Escribe tu plantilla aquí... Usa los botones de arriba para insertar variables."
            />
          </div>
        </div>

        {/* Leyenda */}
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px', color: '#9ca3af' }}>
          Las zonas azules indican los márgenes · El borde de la hoja representa el tamaño {pageDims.label}
        </p>
      </div>

      {/* Ayuda */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <p className="text-yellow-900">
          💡 <strong>Tip:</strong> Las variables (como <code className="bg-yellow-100 px-1 rounded">{'{{empresa.nombre}}'}</code>)
          se reemplazarán automáticamente con los datos reales al generar el PDF.
        </p>
      </div>
    </div>
  );
};

VisualPdfEditor.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  templateType: PropTypes.string,
  pageSize: PropTypes.string,
  orientation: PropTypes.string,
};

export default VisualPdfEditor;
