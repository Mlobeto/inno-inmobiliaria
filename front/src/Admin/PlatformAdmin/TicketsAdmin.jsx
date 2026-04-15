import { useState } from 'react';
import {
  useGetTicketStatsQuery,
  useGetAllTicketsQuery,
  useGetTicketByIdQuery,
  useAddAdminMessageMutation,
  useUpdateTicketStatusMutation,
} from '@shared/redux';
import {
  IoArrowBack,
  IoSendOutline,
  IoRefreshOutline,
  IoChatbubbleOutline,
  IoTimeOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoLockClosedOutline,
} from 'react-icons/io5';

const STATUS_CONFIG = {
  ABIERTO: { label: 'Abierto', bg: 'bg-blue-100', text: 'text-blue-700', icon: <IoTimeOutline /> },
  EN_PROGRESO: { label: 'En Progreso', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <IoAlertCircleOutline /> },
  RESUELTO: { label: 'Resuelto', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <IoCheckmarkCircleOutline /> },
  CERRADO: { label: 'Cerrado', bg: 'bg-gray-200', text: 'text-gray-600', icon: <IoLockClosedOutline /> },
};

const CATEGORY_LABELS = {
  BUG: 'Bug',
  CONSULTA: 'Consulta',
  FACTURACION: 'Facturación',
  MEJORA: 'Mejora',
  OTRO: 'Otro',
};

const PRIORITY_STYLES = {
  BAJA: 'text-gray-500',
  MEDIA: 'text-blue-600',
  ALTA: 'text-orange-500',
  CRITICA: 'text-red-600 font-bold',
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.ABIERTO;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  );
}

function TicketDetail({ ticketId, onBack }) {
  const { data, isLoading } = useGetTicketByIdQuery(ticketId);
  const [addMessage, { isLoading: sending }] = useAddAdminMessageMutation();
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateTicketStatusMutation();
  const [message, setMessage] = useState('');

  const ticket = data?.data || data;

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || !ticket) return;
    try {
      await addMessage({ ticketId: ticket.id, message: trimmed }).unwrap();
      setMessage('');
    } catch {/* handled */ }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!ticket) return;
    try {
      await updateStatus({ ticketId: ticket.id, status: newStatus }).unwrap();
    } catch {/* handled */ }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando ticket...</div>;
  if (!ticket) return <div className="p-8 text-center text-gray-500">Ticket no encontrado.</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b bg-gray-50">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 mt-0.5">
          <IoArrowBack size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">{ticket.title}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {ticket.tenants?.subdomain ?? 'Tenant'} · {CATEGORY_LABELS[ticket.category]} ·{' '}
            <span className={PRIORITY_STYLES[ticket.priority]}>{ticket.priority}</span>
          </p>
        </div>
        {/* Status change buttons */}
        <div className="flex gap-1.5 flex-wrap">
          {Object.keys(STATUS_CONFIG)
            .filter((s) => s !== ticket.status)
            .map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updatingStatus}
                className={`text-xs px-2 py-1 rounded-lg font-medium border transition hover:opacity-80 disabled:opacity-40 ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text} border-current`}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {/* Descripción original */}
        <div className="flex justify-end">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-sm text-sm shadow-sm">
            <p className="font-medium text-blue-200 text-xs mb-1">Tenant</p>
            {ticket.description}
          </div>
        </div>

        {(ticket.ticket_messages || []).map((msg) => {
          const isAdmin = msg.authorRole === 'PLATFORM_ADMIN';
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 max-w-sm text-sm shadow-sm ${
                  isAdmin
                    ? 'bg-purple-600 text-white rounded-tl-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                }`}
              >
                <p className={`font-medium text-xs mb-1 ${isAdmin ? 'text-purple-200' : 'text-blue-200'}`}>
                  {isAdmin ? 'Soporte Inno' : 'Tenant'}
                </p>
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply */}
      {ticket.status === 'CERRADO' ? (
        <div className="p-4 bg-white border-t text-center text-sm text-gray-400">Ticket cerrado.</div>
      ) : (
        <div className="p-4 bg-white border-t flex gap-2 items-end">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Responder al tenant... (Enter para enviar)"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="bg-purple-600 text-white p-2.5 rounded-xl hover:bg-purple-700 transition disabled:opacity-40"
          >
            <IoSendOutline size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function TicketsAdmin() {
  const { data: statsData } = useGetTicketStatsQuery();
  const { data: ticketsData, isLoading, refetch } = useGetAllTicketsQuery({});
  const [selectedId, setSelectedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const stats = statsData?.data || statsData || {};
  const tickets = ticketsData?.data || ticketsData || [];

  const filtered = filterStatus ? tickets.filter((t) => t.status === filterStatus) : tickets;

  if (selectedId) {
    return (
      <div className="h-[75vh]">
        <TicketDetail ticketId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
            className={`rounded-xl p-4 text-left transition border-2 ${
              filterStatus === key ? 'border-indigo-500 shadow-md' : 'border-transparent'
            } ${cfg.bg}`}
          >
            <p className={`text-2xl font-bold ${cfg.text}`}>{stats[key.toLowerCase()] ?? stats[key] ?? 0}</p>
            <p className={`text-xs font-medium ${cfg.text} mt-0.5`}>{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          {filterStatus ? `${STATUS_CONFIG[filterStatus].label} (${filtered.length})` : `Todos los tickets (${tickets.length})`}
        </h2>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
        >
          <IoRefreshOutline size={14} /> Actualizar
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando tickets...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <IoChatbubbleOutline size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Sin tickets{filterStatus ? ' en este estado' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedId(ticket.id)}
              className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-purple-200 transition"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800 text-sm">{ticket.title}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ticket.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-purple-700">{ticket.tenants?.subdomain ?? '—'}</p>
                  <p className={`text-xs mt-0.5 ${PRIORITY_STYLES[ticket.priority]}`}>{ticket.priority}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                <span>{CATEGORY_LABELS[ticket.category]}</span>
                {ticket.ticket_messages?.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <IoChatbubbleOutline size={11} /> {ticket.ticket_messages.length}
                    </span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
