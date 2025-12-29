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

const UpdateRentAmount = ({ lease, newRentAmount, updateDate, ipcIndex, autoGenerate = false }) => {
  
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

  // Calcular período
  const calcularPeriodo = () => {
    const startDate = new Date(lease.startDate);
    const updateDateObj = new Date(updateDate);
    let monthsSinceStart =
      (updateDateObj.getFullYear() - startDate.getFullYear()) * 12 +
      (updateDateObj.getMonth() - startDate.getMonth());

    if (lease.updateFrequency === "semestral") {
      return `Semestre ${Math.floor(monthsSinceStart / 6) + 1}`;
    } else if (lease.updateFrequency === "cuatrimestral") {
      return `Cuatrimestre ${Math.floor(monthsSinceStart / 4) + 1}`;
    } else if (lease.updateFrequency === "anual") {
      return `Año ${Math.floor(monthsSinceStart / 12) + 1}`;
    }
    return "Período desconocido";
  };

  // Calcular porcentaje de aumento
  const calcularPorcentaje = () => {
    const anterior = parseFloat(lease.rentAmount || 0);
    const nuevo = parseFloat(newRentAmount || 0);
    if (anterior === 0) return 0;
    return ((nuevo - anterior) / anterior * 100).toFixed(2);
  };

  const generatePdf = () => {
    if (!lease || !newRentAmount) {
      alert('Faltan datos para generar el PDF');
      return;
    }

    const porcentajeAumento = calcularPorcentaje();
    const periodo = calcularPeriodo();

    // Definición del documento
    const docDefinition = {
      content: [
        // Logo/Encabezado
        {
          text: 'QUINTERO+LOBETO PROPIEDADES',
          style: 'header',
          margin: [0, 0, 0, 20]
        },
        
        // Título
        {
          text: 'ACTUALIZACIÓN DE ALQUILER',
          style: 'title',
          margin: [0, 0, 0, 30]
        },

        // Información del contrato
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              [
                { text: 'ID del Contrato:', style: 'label' },
                { text: lease.id || 'N/A', style: 'value' }
              ],
              [
                { text: 'Fecha de Actualización:', style: 'label' },
                { text: formatearFecha(updateDate), style: 'value' }
              ],
              [
                { text: 'Período:', style: 'label' },
                { text: periodo, style: 'value' }
              ],
              [
                { text: 'Frecuencia:', style: 'label' },
                { text: (lease.updateFrequency || 'N/A').toUpperCase(), style: 'value' }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },

        // Propiedad e Inquilino
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              [
                { text: 'Propiedad:', style: 'label' },
                { text: lease.Property?.address || 'N/A', style: 'value' }
              ],
              [
                { text: 'Inquilino:', style: 'label' },
                { text: lease.Tenant?.name || 'N/A', style: 'value' }
              ],
              [
                { text: 'Propietario:', style: 'label' },
                { text: lease.Landlord?.name || 'N/A', style: 'value' }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 30]
        },

        // Detalles financieros destacados
        {
          table: {
            widths: ['*'],
            body: [
              [{ text: 'DETALLES DE LA ACTUALIZACIÓN', style: 'sectionHeader' }]
            ]
          },
          layout: {
            fillColor: '#3B82F6',
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
          margin: [0, 0, 0, 15]
        },

        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Monto Anterior', style: 'amountLabel' },
                { text: formatearMonto(lease.rentAmount || 0), style: 'amountOld' }
              ]
            },
            {
              width: '50%',
              stack: [
                { text: 'Nuevo Monto', style: 'amountLabel' },
                { text: formatearMonto(newRentAmount), style: 'amountNew' }
              ]
            }
          ],
          margin: [0, 0, 0, 20]
        },

        {
          text: `Aumento: ${porcentajeAumento}% ${ipcIndex ? `(IPC: ${ipcIndex})` : ''}`,
          style: 'percentage',
          margin: [0, 0, 0, 30]
        },

        // Información del IPC
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#E5E7EB'
            }
          ],
          margin: [0, 0, 0, 10]
        },

        {
          text: 'Cálculo realizado según índice de alquileres',
          style: 'footer',
          margin: [0, 10, 0, 5]
        },

        {
          text: [
            { text: 'Fuente: ', style: 'footer' },
            {
              text: 'https://arquiler.com/',
              style: 'link',
              link: 'https://arquiler.com/'
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Firma
        {
          columns: [
            {
              width: '50%',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
                { text: 'Firma del Propietario', style: 'signatureLabel', margin: [0, 5, 0, 0] }
              ]
            },
            {
              width: '50%',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
                { text: 'Firma del Inquilino', style: 'signatureLabel', margin: [0, 5, 0, 0] }
              ]
            }
          ],
          margin: [0, 40, 0, 0]
        }
      ],
      
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          color: '#1F2937'
        },
        title: {
          fontSize: 16,
          bold: true,
          alignment: 'center',
          color: '#3B82F6'
        },
        label: {
          fontSize: 10,
          bold: true,
          color: '#6B7280',
          margin: [0, 3, 0, 3]
        },
        value: {
          fontSize: 10,
          color: '#1F2937',
          margin: [0, 3, 0, 3]
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: '#FFFFFF',
          alignment: 'center',
          margin: [10, 10, 10, 10]
        },
        amountLabel: {
          fontSize: 11,
          color: '#6B7280',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        amountOld: {
          fontSize: 18,
          color: '#EF4444',
          alignment: 'center',
          decoration: 'lineThrough'
        },
        amountNew: {
          fontSize: 22,
          bold: true,
          color: '#10B981',
          alignment: 'center'
        },
        percentage: {
          fontSize: 14,
          bold: true,
          color: '#3B82F6',
          alignment: 'center'
        },
        footer: {
          fontSize: 9,
          color: '#6B7280',
          alignment: 'center'
        },
        link: {
          fontSize: 9,
          color: '#3B82F6',
          decoration: 'underline',
          alignment: 'center'
        },
        signatureLabel: {
          fontSize: 9,
          alignment: 'center',
          color: '#6B7280'
        }
      },
      
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: 'Roboto'
      }
    };

    // Generar y descargar el PDF
    const fechaArchivo = formatearFecha(updateDate).replace(/\//g, '_');
    pdfMake.createPdf(docDefinition).download(`Actualizacion_Alquiler_${lease.id}_${fechaArchivo}.pdf`);
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
        Generar PDF de Actualización
      </button>
    </div>
  );
};

UpdateRentAmount.propTypes = {
  lease: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    rentAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    startDate: PropTypes.string.isRequired,
    updateFrequency: PropTypes.string.isRequired,
    Property: PropTypes.object,
    Tenant: PropTypes.object,
    Landlord: PropTypes.object
  }).isRequired,
  newRentAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  updateDate: PropTypes.string.isRequired,
  ipcIndex: PropTypes.string,
  autoGenerate: PropTypes.bool,
};

export default UpdateRentAmount;
