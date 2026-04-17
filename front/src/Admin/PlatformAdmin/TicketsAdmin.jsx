import { useState, useRef, useEffect } from 'react';
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
  IoSearchOutline,
  IoFilterOutline,
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

const PRIORITY_BADGES = {
  BAJA: 'bg-gray-100 text-gray-500',
  MEDIA: 'bg-blue-100 text-blue-600',
  ALTA: 'bg-orange-100 text-orange-600',
  CRITICA: 'bg-red-100 text-red-700 font-bold',
};

function needsResponse(ticket) {
  if (ticket.status === 'CERRADO' || ticket.status === 'RESUELTO') return false;
  if (!ticket.messages || ticket.messages.length === 0) return true; // nadie respondió aún
  return ticket.messages.at(-1)?.authorRole === 'TENANT';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.ABIERTO;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  );
}

function TicketDetail({ ticketId, onBack }) {
  const { data: ticket, isLoading } = useGetTicketByIdQuery(ticketId, { pollingInterval: 15000 });
  const [addMessage, { isLoading: sending }] = useAddAdminMessageMutation();
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateTicketStatusMutation();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages?.length]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || !ticket) return;
    try {
      await addMessage({ ticketId: ticket.id, message: trimmed }).unwrap();
      setMessage('');
    } catch {/* handled */}
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
    } catch {/* handled */}
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando ticket...</div>;
  if (!ticket) return <div className="p-8 text-center text-gray-500">Ticket no encontrado.</div>;

  const lastActivity = ticket.messages?.at(-1)?.createdAt || ticket.createdAt;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b bg-gray-50">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 mt-0.5 shrink-0">
          <IoArrowBack size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">{ticket.title}</span>
            <StatusBadge status={ticket.status} />
            {needsResponse(ticket) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 animate-pulse">
                ● Responder
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="font-medium text-purple-700">{ticket.tenants?.businessName ?? ticket.tenants?.subdomain ?? 'Tenant'}</span>
            {' · '}{CATEGORY_LABELS[ticket.category]}
            {' · '}<span className={PRIORITY_STYLES[ticket.priority]}>{ticket.priority}</span>
            {' · '}Creado {timeAgo(ticket.createdAt)}
            {' · '}Última actividad {timeAgo(lastActivity)}
          </p>
        </div>
        {/* Status change buttons */}
        <div className="flex gap-1.5 flex-wrap shrink-0">
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
            <p className="font-medium text-blue-200 text-xs mb-1">
              Tenant · {timeAgo(ticket.createdAt)}
            </p>
            {ticket.description}
          </div>
        </div>

        {(ticket.messages || []).map((msg) => {
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
                  {isAdmin ? 'Soporte Inno' : 'Tenant'} · {timeAgo(msg.createdAt)}
                </p>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
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
  const { data: statsData } = useGetTicketStatsQuery(undefined, { pollingInterval: 30000 });
  const { data: ticketsData, isLoading, refetch } = useGetAllTicketsQuery({}, { pollingInterval: 30000 });
  const [selectedId, setSelectedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');

  const stats = statsData || {};
  const tickets = ticketsData || [];

  const filtered = tickets.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchTenant = t.tenants?.businessName?.toLowerCase().includes(q) || t.tenants?.subdomain?.toLowerCase().includes(q);
      if (!matchTitle && !matchTenant) return false;
    }
    return true;
  });

  // Ordenar: primero "necesita respuesta", luego por prioridad, luego por fecha
  const PRIORITY_ORDER = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const aNr = needsResponse(a) ? 0 : 1;
    const bNr = needsResponse(b) ? 0 : 1;
    if (aNr !== bNr) return aNr - bNr;
    const pDiff = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
    if (pDiff !== 0) return pDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const pendingCount = tickets.filter(needsResponse).length;

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
            <p className={`text-2xl font-bold ${cfg.text}`}>{stats[key.toLowerCase()] ?? 0}</p>
            <p className={`text-xs font-medium ${cfg.text} mt-0.5`}>{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* Alerta de tickets sin respuesta */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <span className="text-red-600 font-semibold text-sm">● {pendingCount} ticket{pendingCount > 1 ? 's' : ''} esperando tu respuesta</span>
          <button
            onClick={() => { setFilterStatus(''); setFilterPriority(''); setSearch(''); }}
            className="ml-auto text-xs text-red-400 hover:text-red-600"
          >
            Ver todos
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-48">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o tenant..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        {/* Filtro prioridad */}
        <div className="flex items-center gap-1">
          <IoFilterOutline size={14} className="text-gray-400" />
          {['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
              className={`text-xs px-2 py-1 rounded-lg border font-medium transition ${
                filterPriority === p
                  ? `${PRIORITY_BADGES[p]} border-current`
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">
            {sorted.length} de {tickets.length}
          </span>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
          >
            <IoRefreshOutline size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando tickets...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12">
          <IoChatbubbleOutline size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">
            {search || filterStatus || filterPriority ? 'Sin resultados para los filtros aplicados.' : 'Sin tickets.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((ticket) => {
            const nr = needsResponse(ticket);
            const lastMsg = ticket.messages?.at(-1);
            return (
              <button
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full rounded-xl border p-4 text-left hover:shadow-md transition ${
                  nr
                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                    : 'bg-white border-gray-200 hover:border-purple-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{ticket.title}</span>
                      <StatusBadge status={ticket.status} />
                      {nr && (
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">● Responder</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ticket.description}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs font-semibold text-purple-700">{ticket.tenants?.businessName ?? ticket.tenants?.subdomain ?? '—'}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGES[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                  <span>{CATEGORY_LABELS[ticket.category]}</span>
                  {ticket.messages?.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <IoChatbubbleOutline size={11} /> {ticket.messages.length}
                      </span>
                    </>
                  )}
                  <span className="ml-auto">
                    {lastMsg ? `Último mensaje ${timeAgo(lastMsg.createdAt)}` : `Creado ${timeAgo(ticket.createdAt)}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

