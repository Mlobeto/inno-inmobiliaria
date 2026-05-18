import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@shared/redux';
import {
  useGetMyTicketsQuery,
  useCreateTicketMutation,
  useAddTenantMessageMutation,
} from '@shared/redux';
import {
  IoArrowBack,
  IoAdd,
  IoCloseOutline,
  IoChatbubbleOutline,
  IoSendOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoLockClosedOutline,
} from 'react-icons/io5';

const STATUS_STYLES = {
  ABIERTO: { label: 'Abierto', bg: 'bg-blue-100', text: 'text-blue-700', icon: <IoTimeOutline /> },
  EN_PROGRESO: { label: 'En Progreso', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <IoAlertCircleOutline /> },
  RESUELTO: { label: 'Resuelto', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <IoCheckmarkCircleOutline /> },
  CERRADO: { label: 'Cerrado', bg: 'bg-gray-200', text: 'text-gray-600', icon: <IoLockClosedOutline /> },
};

const CATEGORY_LABELS = {
  BUG: 'Error / Bug',
  CONSULTA: 'Consulta',
  FACTURACION: 'Facturación',
  MEJORA: 'Solicitud de Mejora',
  OTRO: 'Otro',
};

const PRIORITY_STYLES = {
  BAJA: { label: 'Baja', color: 'text-gray-500' },
  MEDIA: { label: 'Media', color: 'text-blue-600' },
  ALTA: { label: 'Alta', color: 'text-orange-500' },
  CRITICA: { label: 'Crítica', color: 'text-red-600 font-bold' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.ABIERTO;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  );
}

function TicketForm({ onClose, onSaved }) {
  const [createTicket, { isLoading }] = useCreateTicketMutation();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'CONSULTA',
    priority: 'MEDIA',
  });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTicket(form).unwrap();
      onSaved();
    } catch {/* handled by RTK */ }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">Nuevo Ticket de Soporte</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IoCloseOutline size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Ej: No puedo subir imágenes"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {Object.keys(PRIORITY_STYLES).map((k) => (
                  <option key={k} value={k}>{PRIORITY_STYLES[k].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Descríbenos el problema con el mayor detalle posible..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Creando...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TicketThread({ ticket, onBack }) {
  const [addMessage, { isLoading }] = useAddTenantMessageMutation();
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await addMessage({ ticketId: ticket.id, message: trimmed }).unwrap();
      setMessage('');
    } catch {/* handled by RTK */ }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isClosed = ticket.status === 'CERRADO';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 border-b bg-white rounded-t-2xl">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 mt-1">
          <IoArrowBack size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 text-sm">{ticket.title}</h3>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {CATEGORY_LABELS[ticket.category]} ·{' '}
            <span className={PRIORITY_STYLES[ticket.priority]?.color}>
              Prioridad {PRIORITY_STYLES[ticket.priority]?.label}
            </span>
          </p>
        </div>
      </div>

      {/* Mensaje inicial */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <div className="flex justify-end">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs text-sm leading-relaxed shadow-sm">
            <p className="font-medium text-blue-200 text-xs mb-1">Tú</p>
            {ticket.description}
          </div>
        </div>

        {(ticket.messages || []).map((msg) => {
          const isAdmin = msg.authorRole === 'PLATFORM_ADMIN';
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 max-w-xs text-sm leading-relaxed shadow-sm ${
                  isAdmin
                    ? 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                }`}
              >
                <p className={`font-medium text-xs mb-1 ${isAdmin ? 'text-purple-600' : 'text-blue-200'}`}>
                  {isAdmin ? 'Soporte Inno' : 'Tú'}
                </p>
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input respuesta */}
      {isClosed ? (
        <div className="p-4 bg-white border-t text-center text-sm text-gray-500">
          Este ticket está cerrado.
        </div>
      ) : (
        <div className="p-4 bg-white border-t rounded-b-2xl flex gap-2 items-end">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Escribe tu respuesta... (Enter para enviar)"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-40"
          >
            <IoSendOutline size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function SoporteTickets() {
  const currentUser = useSelector(selectCurrentUser);
  const agentBackHref = currentUser?.role === 'AGENT' ? '/panelLeads' : '/panel';

  const { data: tickets = [], isLoading } = useGetMyTicketsQuery();
  // transformResponse ya devuelve el array directamente
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleSaved = () => setShowForm(false);

  if (selectedTicket) {
    // Encontrar el ticket actualizado del cache
    const live = tickets.find((t) => t.id === selectedTicket.id) || selectedTicket;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg flex flex-col" style={{ minHeight: '70vh' }}>
          <TicketThread ticket={live} onBack={() => setSelectedTicket(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={agentBackHref} className="text-gray-400 hover:text-gray-600" title="Volver">
              <IoArrowBack size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Soporte</h1>
              <p className="text-xs text-gray-500">Tus tickets de ayuda</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <IoAdd size={18} /> Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Cargando tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <IoChatbubbleOutline size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Sin tickets de soporte</p>
            <p className="text-sm text-gray-400 mt-1">¿Necesitás ayuda? Creá un ticket y te respondemos a la brevedad.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              Crear primer ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition hover:border-blue-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{ticket.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ticket.description}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{CATEGORY_LABELS[ticket.category]}</span>
                  <span>·</span>
                  <span className={PRIORITY_STYLES[ticket.priority]?.color}>
                    {PRIORITY_STYLES[ticket.priority]?.label}
                  </span>
                  {ticket.messages?.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <IoChatbubbleOutline size={12} /> {ticket.messages.length}
                      </span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showForm && <TicketForm onClose={() => setShowForm(false)} onSaved={handleSaved} />}
    </div>
  );
}
