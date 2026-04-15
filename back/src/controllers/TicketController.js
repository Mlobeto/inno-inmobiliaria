const prisma = require('../utils/prismaClient');

// ─────────────────────────────────────────────
// TENANT: crea y consulta sus propios tickets
// ─────────────────────────────────────────────

exports.getMyTickets = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const tickets = await prisma.support_tickets.findMany({
      where: { tenantId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error('Error en getMyTickets:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener tickets' });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { title, description, category, priority } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Título y descripción son obligatorios' });
    }

    const ticket = await prisma.support_tickets.create({
      data: {
        tenantId,
        title: title.trim(),
        description: description.trim(),
        category: category || 'CONSULTA',
        priority: priority || 'MEDIA',
        status: 'ABIERTO',
      },
      include: { messages: true },
    });

    return res.status(201).json({ success: true, ticket });
  } catch (error) {
    console.error('Error en createTicket:', error);
    return res.status(500).json({ success: false, message: 'Error al crear ticket' });
  }
};

exports.addTenantMessage = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío' });
    }

    const ticket = await prisma.support_tickets.findFirst({
      where: { id: Number(ticketId), tenantId },
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    if (ticket.status === 'CERRADO') {
      return res.status(400).json({ success: false, message: 'El ticket está cerrado' });
    }

    const msg = await prisma.ticket_messages.create({
      data: { ticketId: Number(ticketId), authorRole: 'TENANT', message: message.trim() },
    });

    // Reabre si estaba RESUELTO
    if (ticket.status === 'RESUELTO') {
      await prisma.support_tickets.update({
        where: { id: Number(ticketId) },
        data: { status: 'ABIERTO' },
      });
    }

    return res.status(201).json({ success: true, message: msg });
  } catch (error) {
    console.error('Error en addTenantMessage:', error);
    return res.status(500).json({ success: false, message: 'Error al enviar mensaje' });
  }
};

// ─────────────────────────────────────────────
// PLATFORM ADMIN: ve todos los tickets
// ─────────────────────────────────────────────

exports.getAllTickets = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(status && { status }),
      ...(category && { category }),
      ...(priority && { priority }),
    };

    const [tickets, total] = await Promise.all([
      prisma.support_tickets.findMany({
        where,
        include: {
          tenants: { select: { tenantId: true, businessName: true, email: true, subdomain: true } },
          messages: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.support_tickets.count({ where }),
    ]);

    return res.status(200).json({ success: true, tickets, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error en getAllTickets:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener tickets' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await prisma.support_tickets.findUnique({
      where: { id: Number(ticketId) },
      include: {
        tenants: { select: { tenantId: true, businessName: true, email: true, subdomain: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error('Error en getTicketById:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener ticket' });
  }
};

exports.addAdminMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío' });
    }

    const ticket = await prisma.support_tickets.findUnique({ where: { id: Number(ticketId) } });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

    const msg = await prisma.ticket_messages.create({
      data: { ticketId: Number(ticketId), authorRole: 'PLATFORM_ADMIN', message: message.trim() },
    });

    // Pasa a EN_PROGRESO si estaba ABIERTO
    if (ticket.status === 'ABIERTO') {
      await prisma.support_tickets.update({
        where: { id: Number(ticketId) },
        data: { status: 'EN_PROGRESO' },
      });
    }

    return res.status(201).json({ success: true, message: msg });
  } catch (error) {
    console.error('Error en addAdminMessage:', error);
    return res.status(500).json({ success: false, message: 'Error al enviar respuesta' });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const validStatuses = ['ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }

    const ticket = await prisma.support_tickets.update({
      where: { id: Number(ticketId) },
      data: { status },
    });

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error('Error en updateTicketStatus:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
};

exports.getTicketStats = async (req, res) => {
  try {
    const [abierto, en_progreso, resuelto, cerrado] = await Promise.all([
      prisma.support_tickets.count({ where: { status: 'ABIERTO' } }),
      prisma.support_tickets.count({ where: { status: 'EN_PROGRESO' } }),
      prisma.support_tickets.count({ where: { status: 'RESUELTO' } }),
      prisma.support_tickets.count({ where: { status: 'CERRADO' } }),
    ]);
    return res.status(200).json({ success: true, stats: { abierto, en_progreso, resuelto, cerrado } });
  } catch (error) {
    console.error('Error en getTicketStats:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};
