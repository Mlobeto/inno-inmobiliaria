import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPayment, getClientById } from "../../redux/Actions/actions";
import EstadoContratos from "../Contratos/EstadoContratos";
import ReciboPdf from "../PdfTemplates/ReciboPdf";
import {
  IoDocumentTextOutline,
  IoReceiptOutline,
  IoCalendarOutline,
  IoCashOutline,
  IoCloseOutline,
  IoSaveOutline,
  IoCheckmarkCircleOutline,
  IoListOutline,
  IoTimeOutline,
} from "react-icons/io5";

const PaymentForm = () => {
  const dispatch = useDispatch();
  const paymentCreate = useSelector((state) => state.paymentCreate);

  // Estados para el modal y flujo
  const [selectedLease, setSelectedLease] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    idClient: "",
    leaseId: "",
    paymentDate: "",
    amount: "",
    period: "",
    type: "installment",
    totalInstallments: "",
  });

  // Detectar creación exitosa del pago
  useEffect(() => {
    if (paymentCreate && paymentCreate.success) {
      setPaymentCreated(true);
      setIsLoading(false);
    }
  }, [paymentCreate]);

  // Función para seleccionar contrato desde EstadoContratos
  const handleLeaseSelect = (lease) => {
    // El contrato puede venir con 'id' o 'leaseId'
    const leaseId = lease?.id || lease?.leaseId;
    const tenantId = lease?.tenantId || lease?.locatarioId || lease?.idClient;
    
    if (!lease || !leaseId) {
      console.error('Contrato inválido seleccionado:', lease);
      return;
    }

    setSelectedLease(lease);
    setFormData(prev => ({
      ...prev,
      leaseId: leaseId,
      idClient: tenantId,
      amount: lease.rentAmount || "",
    }));
    setShowPaymentForm(true);

    // Cargar datos del cliente si es necesario
    if (tenantId) {
      dispatch(getClientById(tenantId));
    }
  };

  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Para pagos iniciales, generar período automáticamente
      const period = formData.type === 'initial' 
        ? `Pago Inicial - ${new Date(formData.paymentDate.split('T')[0] + 'T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
        : formData.period;

      const paymentData = {
        idClient: formData.idClient,
        leaseId: formData.leaseId,
        paymentDate: formData.paymentDate,
        amount: parseFloat(formData.amount),
        period: period,
        type: formData.type,
        // Solo incluir totalInstallments si el tipo es "installment" y tiene valor
        totalInstallments: formData.type === 'installment' && formData.totalInstallments 
          ? parseInt(formData.totalInstallments) 
          : null,
      };

      await dispatch(createPayment(paymentData));
    } catch (error) {
      console.error('Error al crear el pago:', error);
      setIsLoading(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      idClient: "",
      leaseId: "",
      paymentDate: "",
      amount: "",
      period: "",
      type: "installment",
      totalInstallments: "",
    });
    setSelectedLease(null);
    setShowPaymentForm(false);
    setPaymentCreated(false);
  };

  return (
    <div className="min-h-screen">
      {/* Mostrar EstadoContratos si no hay contrato seleccionado */}
      {!showPaymentForm ? (
        <div>
          <EstadoContratos onLeaseSelect={handleLeaseSelect} />
        </div>
      ) : (
        /* Modal overlay con formulario de pago */
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IoReceiptOutline className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">
                  Crear Pago
                </h2>
              </div>
              <button
                onClick={resetForm}
                className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              {!paymentCreated ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Información del contrato seleccionado */}
                  <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-4 mb-6">
                    <h3 className="text-lg font-semibold text-emerald-300 mb-2 flex items-center">
                      <IoDocumentTextOutline className="w-5 h-5 mr-2" />
                      Contrato Seleccionado
                    </h3>
                    <div className="space-y-1 text-white">
                      <p><span className="text-slate-400">ID:</span> {selectedLease?.id || selectedLease?.leaseId}</p>
                      <p><span className="text-slate-400">Inquilino:</span> {selectedLease?.Tenant?.name || selectedLease?.locatario}</p>
                      <p><span className="text-slate-400">Propiedad:</span> {selectedLease?.Property?.address}</p>
                      <p><span className="text-slate-400">Monto Alquiler:</span> ${Number(selectedLease?.rentAmount || 0).toLocaleString('es-AR')}</p>
                    </div>
                  </div>

                  {/* Información del pago */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">
                      Información del Pago
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Fecha del pago */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCalendarOutline className="w-4 h-4 mr-2 text-blue-400" />
                          Fecha del Pago
                        </label>
                        <input
                          type="date"
                          name="paymentDate"
                          value={formData.paymentDate}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                          required
                        />
                      </div>

                      {/* Monto */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCashOutline className="w-4 h-4 mr-2 text-emerald-400" />
                          Monto
                        </label>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                          placeholder="Monto del pago..."
                          required
                        />
                      </div>

                      {/* Período - Solo para cuotas y comisiones */}
                      {formData.type !== 'initial' && (
                        <div className="space-y-2">
                          <label className="flex items-center text-sm font-medium text-slate-300">
                            <IoTimeOutline className="w-4 h-4 mr-2 text-amber-400" />
                            Período
                          </label>
                          <input
                            type="text"
                            name="period"
                            value={formData.period}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                            placeholder={formData.type === 'installment' ? "Ej: Enero 2024, Cuota 1/12..." : "Ej: Comisión Noviembre 2024..."}
                            required
                          />
                        </div>
                      )}

                      {/* Tipo de pago */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoListOutline className="w-4 h-4 mr-2 text-purple-400" />
                          Tipo de Pago
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                          required
                        >
                          <option value="installment" className="bg-slate-800">Cuota de Alquiler</option>
                          <option value="initial" className="bg-slate-800">Pago Inicial del Contrato</option>
                          <option value="commission" className="bg-slate-800">Comisión</option>
                        </select>
                      </div>
                    </div>

                    {/* Total de cuotas (solo si es installment) */}
                    {formData.type === "installment" && (
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoListOutline className="w-4 h-4 mr-2 text-indigo-400" />
                          Total de Cuotas
                        </label>
                        <input
                          type="number"
                          name="totalInstallments"
                          value={formData.totalInstallments}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                          placeholder="Número total de cuotas..."
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Botón de envío */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                    >
                      <IoSaveOutline className="w-5 h-5 mr-2" />
                      {isLoading ? "Creando Pago..." : "Crear Pago"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Vista del pago creado exitosamente */
                <div className="text-center space-y-6">
                  <div className="mb-6">
                    <IoCheckmarkCircleOutline className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">¡Pago Creado Exitosamente!</h3>
                    <p className="text-slate-400">El pago ha sido registrado correctamente</p>
                  </div>
                  
                  {/* Resumen del pago */}
                  <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-6 text-left">
                    <h4 className="text-lg font-semibold text-emerald-300 mb-4 flex items-center">
                      <IoReceiptOutline className="w-5 h-5 mr-2" />
                      Resumen del Pago
                    </h4>
                    <div className="space-y-2 text-white">
                      <p><span className="text-slate-400">Contrato:</span> {formData.leaseId}</p>
                      <p><span className="text-slate-400">Cliente:</span> {selectedLease?.Tenant?.name || selectedLease?.locatario}</p>
                      <p><span className="text-slate-400">Monto:</span> ${Number(formData.amount || 0).toLocaleString('es-AR')}</p>
                      <p><span className="text-slate-400">Período:</span> {formData.period}</p>
                      <p><span className="text-slate-400">Tipo:</span> {formData.type === 'installment' ? 'Cuota de Alquiler' : formData.type === 'initial' ? 'Pago Inicial del Contrato' : 'Comisión'}</p>
                      <p><span className="text-slate-400">Fecha:</span> {new Date(formData.paymentDate.split('T')[0] + 'T12:00:00').toLocaleDateString('es-AR')}</p>
                    </div>
                  </div>
                  
                  {/* ReciboPdf component con botón de descarga */}
                  <div className="flex justify-center pt-6">
                    <ReciboPdf 
                      payment={paymentCreate.payment}
                      lease={selectedLease}
                      autoGenerate={false}
                    />
                  </div>
                  
                  <div className="flex gap-4 justify-center pt-6">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300"
                    >
                      Crear Otro Pago
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-medium transition-all duration-300"
                    >
                      Volver a Contratos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;