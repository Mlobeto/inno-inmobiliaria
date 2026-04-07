import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  IoCheckmarkCircleOutline, 
  IoCloseOutline,
  IoCalendarOutline,
  IoCheckmarkOutline 
} from 'react-icons/io5';
import { parseSafeDate } from '../../utils/dateUtils';

const InstallmentSelector = ({ lease, existingPayments, onSelect, onClose }) => {
  const [installments, setInstallments] = useState([]);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  const generateInstallments = useCallback(() => {
    if (!lease?.startDate) return;
    
    // Usar parseSafeDate para evitar desfase UTC (startDate viene como ISO string)
    const startDate = parseSafeDate(lease.startDate);
    const duration = parseInt(lease.totalMonths || lease.duration) || 12; // Duración en meses del contrato

    const generatedInstallments = [];
    
    for (let i = 0; i < duration; i++) {
      // Crear cada fecha de cuota en tiempo local para no sufrir desfase
      const installmentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      
      const monthName = installmentDate.toLocaleDateString('es-AR', { month: 'long' });
      const year = installmentDate.getFullYear();
      const monthYear = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
      
      // Verificar si esta cuota ya está pagada (filtrando por leaseId para evitar falsos positivos)
      const isPaid = existingPayments?.some(payment => 
        payment.type === 'installment' && 
        payment.installmentNumber === (i + 1) &&
        (payment.leaseId === lease.id || payment.leaseId === lease.leaseId)
      );

      generatedInstallments.push({
        number: i + 1,
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        year: year,
        fullPeriod: monthYear,
        date: installmentDate,
        isPaid: isPaid || false,
        totalInstallments: duration
      });
    }

    setInstallments(generatedInstallments);
  }, [lease, existingPayments]);

  useEffect(() => {
    if (lease) {
      generateInstallments();
    }
  }, [lease, generateInstallments]);

  const handleSelectInstallment = (installment) => {
    if (!installment.isPaid) {
      setSelectedInstallment(installment);
    }
  };

  const handleConfirm = () => {
    if (selectedInstallment) {
      onSelect(selectedInstallment);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <IoCalendarOutline className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Seleccionar Cuota</h3>
              <p className="text-slate-400 text-sm">
                Selecciona la cuota que estás pagando
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <IoCloseOutline className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Info del contrato */}
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Contrato</p>
                <p className="text-white font-semibold">#{lease?.id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400">Inquilino</p>
                <p className="text-white font-semibold">{lease?.Tenant?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400">Duración</p>
                <p className="text-white font-semibold">{lease?.totalMonths || lease?.duration || 0} meses</p>
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg border-2 border-green-400/30 bg-green-500/20 flex items-center justify-center">
                <IoCheckmarkOutline className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-slate-300">Pagada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg border-2 border-white/20 bg-white/5"></div>
              <span className="text-slate-300">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg border-2 border-blue-400/50 bg-blue-500/20"></div>
              <span className="text-slate-300">Seleccionada</span>
            </div>
          </div>

          {/* Grid de cuotas */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {installments.map((installment) => (
              <button
                key={installment.number}
                onClick={() => handleSelectInstallment(installment)}
                disabled={installment.isPaid}
                className={`
                  relative aspect-square rounded-lg border-2 transition-all duration-200
                  ${installment.isPaid 
                    ? 'border-green-400/30 bg-green-500/20 cursor-not-allowed' 
                    : selectedInstallment?.number === installment.number
                      ? 'border-blue-400/50 bg-blue-500/20 scale-95'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 cursor-pointer'
                  }
                `}
              >
                {/* Número de cuota */}
                <div className="absolute top-1 left-1 text-[10px] font-semibold text-slate-400">
                  {installment.number}
                </div>

                {/* Check mark si está pagada */}
                {installment.isPaid && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IoCheckmarkOutline className="w-8 h-8 text-green-400" />
                  </div>
                )}

                {/* Mes y año */}
                {!installment.isPaid && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                    <span className="text-white font-semibold text-xs text-center leading-tight">
                      {installment.month.slice(0, 3)}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {installment.year}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Cuota seleccionada */}
          {selectedInstallment && (
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <IoCheckmarkCircleOutline className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-400">Cuota seleccionada</p>
                  <p className="text-white font-semibold">
                    Cuota {selectedInstallment.number}/{installments.length} - {selectedInstallment.fullPeriod}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors border border-white/10"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedInstallment}
              className="flex-1 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 rounded-xl transition-colors border border-blue-400/30 flex items-center justify-center"
            >
              <IoCheckmarkOutline className="w-5 h-5 mr-2" />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

InstallmentSelector.propTypes = {
  lease: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    leaseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    startDate: PropTypes.string,
    duration: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalMonths: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Tenant: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired,
  existingPayments: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      installmentNumber: PropTypes.number
    })
  ),
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

InstallmentSelector.defaultProps = {
  existingPayments: []
};

export default InstallmentSelector;
