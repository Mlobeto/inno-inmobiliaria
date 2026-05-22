import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@shared/redux';
import {
  useGetMyTicketsQuery,
  useCreateTicketMutation,
  useAddTenantMessageMutation,
} from '@shared/redux';
import {
  IoAdd,
  IoCloseOutline,
  IoChatbubbleOutline,
  IoSendOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoLockClosedOutline,
  IoChatbubblesOutline,
} from 'react-icons/io5';
import { AdminPanelLayout } from './AdminPanelLayout';
import {
  btnPrimary,
  btnSecondary,
  card,
  cardInteractive,
  emptyState,
  inputClass,
  labelClass,
  modalBox,
  modalHeader,
  modalOverlay,
  selectClass,
} from './adminPanelTheme';

const STATUS_STYLES = {
  ABIERTO: {
    label: 'Abierto',
    badge: 'bg-customBlueMuted text-customBlue border border-customBlue/30',
    icon: <IoTimeOutline className="w-3 h-3" />,
  },
  EN_PROGRESO: {
    label: 'En Progreso',
    badge: 'bg-customYellowMuted text-customYellow border border-customYellow/30',
    icon: <IoAlertCircleOutline className="w-3 h-3" />,
  },
  RESUELTO: {
    label: 'Resuelto',
    badge: 'bg-brand-muted text-brand-light border border-borderStrong',
    icon: <IoCheckmarkCircleOutline className="w-3 h-3" />,
  },
  CERRADO: {
    label: 'Cerrado',
    badge: 'bg-bgElevated text-textMuted border border-borderBase',
    icon: <IoLockClosedOutline className="w-3 h-3" />,
  },
};

const CATEGORY_LABELS = {
  BUG: 'Error / Bug',
  CONSULTA: 'Consulta',
  FACTURACION: 'Facturación',
  MEJORA: 'Solicitud de Mejora',
  OTRO: 'Otro',
};

const PRIORITY_STYLES = {
  BAJA: { label: 'Baja', color: 'text-textMuted' },
  MEDIA: { label: 'Media', color: 'text-customBlue' },
  ALTA: { label: 'Alta', color: 'text-customYellow' },
  CRITICA: { label: 'Crítica', color: 'text-customRed font-semibold' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.ABIERTO;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
      {s.icon} {s.label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

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
    } catch {
      /* handled by RTK */
    }
  };

  return (
    <div className={modalOverlay}>
      <div className={`${modalBox} max-w-lg`}>
        <div className={modalHeader}>
          <h2 className="text-lg font-bold text-textPrimary">Nuevo Ticket de Soporte</h2>
          <button type="button" onClick={onClose} className="text-textMuted hover:text-textPrimary">
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={labelClass}>Asunto *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Ej: No puedo subir imágenes"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Categoría</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={`${selectClass} w-full`}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Prioridad</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className={`${selectClass} w-full`}
              >
                {Object.keys(PRIORITY_STYLES).map((k) => (
                  <option key={k} value={k}>{PRIORITY_STYLES[k].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Descripción *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Descríbenos el problema con el mayor detalle posible..."
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={`flex-1 justify-center ${btnSecondary}`}>
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className={`flex-1 justify-center ${btnPrimary}`}>
              {isLoading ? 'Creando...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

TicketForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
};

function TicketThread({ ticket, onBack }) {
  const [addMessage, { isLoading }] = useAddTenantMessageMutation();
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await addMessage({ ticketId: ticket.id, message: trimmed }).unwrap();
      setMessage('');
    } catch {
      /* handled by RTK */
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isClosed = ticket.status === 'CERRADO';

  return (
    <div className={`${card} flex flex-col overflow-hidden`} style={{ minHeight: '70vh' }}>
      <div className="flex items-start gap-3 p-4 border-b border-borderBase">
        <button type="button" onClick={onBack} className="text-textMuted hover:text-brand-light mt-1 transition-colors">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-textPrimary text-sm">{ticket.title}</h3>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-xs text-textMuted mt-0.5">
            {CATEGORY_LABELS[ticket.category]} ·{' '}
            <span className={PRIORITY_STYLES[ticket.priority]?.color}>
              Prioridad {PRIORITY_STYLES[ticket.priority]?.label}
            </span>
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-bgElevated/40">
        <div className="flex justify-end">
          <div className="bg-brand text-textWhite rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs text-sm leading-relaxed shadow-brandGlow">
            <p className="font-medium text-brand-light/80 text-xs mb-1">Tú</p>
            {ticket.description}
          </div>
        </div>

        {(ticket.messages || []).map((msg) => {
          const isAdmin = msg.authorRole === 'PLATFORM_ADMIN';
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 max-w-xs text-sm leading-relaxed ${
                  isAdmin
                    ? 'bg-bgSurface text-textPrimary rounded-tl-sm border border-borderBase'
                    : 'bg-brand text-textWhite rounded-tr-sm shadow-brandGlow'
                }`}
              >
                <p className={`font-medium text-xs mb-1 ${isAdmin ? 'text-brand-light' : 'text-brand-light/80'}`}>
                  {isAdmin ? 'Soporte Inno' : 'Tú'}
                </p>
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {isClosed ? (
        <div className="p-4 border-t border-borderBase text-center text-sm text-textMuted">
          Este ticket está cerrado.
        </div>
      ) : (
        <div className="p-4 border-t border-borderBase flex gap-2 items-end">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Escribe tu respuesta... (Enter para enviar)"
            className={`${inputClass} flex-1 resize-none rounded-xl`}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            className={`${btnPrimary} p-2.5 rounded-xl disabled:opacity-40`}
          >
            <IoSendOutline className="w-[18px] h-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}

TicketThread.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    category: PropTypes.string,
    priority: PropTypes.string,
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        message: PropTypes.string,
        authorRole: PropTypes.string,
      }),
    ),
  }).isRequired,
  onBack: PropTypes.func.isRequired,
};

export default function SoporteTickets() {
  const currentUser = useSelector(selectCurrentUser);
  const agentBackHref = currentUser?.role === 'AGENT' ? '/panelLeads' : '/panel';
  const backLabel = currentUser?.role === 'AGENT' ? 'Leads' : 'Panel';

  const { data: tickets = [], isLoading } = useGetMyTicketsQuery();
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleSaved = () => setShowForm(false);

  if (selectedTicket) {
    const live = tickets.find((t) => t.id === selectedTicket.id) || selectedTicket;
    return (
      <AdminPanelLayout
        backOnClick={() => setSelectedTicket(null)}
        backLabel="Tickets"
        title="Conversación"
        subtitle={live.title}
        icon={IoChatbubblesOutline}
      >
        <div className="max-w-2xl mx-auto">
          <TicketThread ticket={live} onBack={() => setSelectedTicket(null)} />
        </div>
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout
      backTo={agentBackHref}
      backLabel={backLabel}
      title="Soporte"
      subtitle="Tus tickets de ayuda"
      icon={IoChatbubblesOutline}
      actions={
        <button type="button" onClick={() => setShowForm(true)} className={btnPrimary}>
          <IoAdd className="w-5 h-5" />
          Nuevo Ticket
        </button>
      }
    >
      {isLoading ? (
        <div className={emptyState}>Cargando tickets...</div>
      ) : tickets.length === 0 ? (
        <div className={`${emptyState} py-16`}>
          <IoChatbubbleOutline className="w-12 h-12 mx-auto text-textMuted mb-3" />
          <p className="text-textSecondary font-medium">Sin tickets de soporte</p>
          <p className="text-sm text-textMuted mt-1">
            ¿Necesitás ayuda? Creá un ticket y te respondemos a la brevedad.
          </p>
          <button type="button" onClick={() => setShowForm(true)} className={`mt-4 ${btnPrimary}`}>
            Crear primer ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setSelectedTicket(ticket)}
              className={`w-full ${cardInteractive} p-4 text-left`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-textPrimary text-sm truncate">{ticket.title}</p>
                  <p className="text-xs text-textMuted mt-0.5 line-clamp-2">{ticket.description}</p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-textMuted">
                <span>{CATEGORY_LABELS[ticket.category]}</span>
                <span>·</span>
                <span className={PRIORITY_STYLES[ticket.priority]?.color}>
                  {PRIORITY_STYLES[ticket.priority]?.label}
                </span>
                {ticket.messages?.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <IoChatbubbleOutline className="w-3 h-3" /> {ticket.messages.length}
                    </span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showForm && <TicketForm onClose={() => setShowForm(false)} onSaved={handleSaved} />}
    </AdminPanelLayout>
  );
}
