const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// GESTIÓN DE ALQUILERES TEMPORALES
// ============================================

/**
 * Crear nuevo alquiler temporal
 */
exports.createTemporaryRental = async (req, res) => {
  try {
    const { propertyId, tenantId, title, description, pricePerNight, pricePerWeek, pricePerMonth, minimumStay, maximumStay, checkInTime, checkOutTime, cleaningFee, commissionPercentage, rules, amenities } = req.body;

    // Validaciones
    if (!propertyId || !tenantId || !title || !pricePerNight) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Verificar que la propiedad existe y pertenece al tenant
    const property = await prisma.property.findUnique({
      where: { propertyId },
    });

    if (!property || property.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    // Crear alquiler temporal
    const temporaryRental = await prisma.temporaryRental.create({
      data: {
        propertyId,
        tenantId,
        title,
        description,
        pricePerNight: parseFloat(pricePerNight),
        pricePerWeek: pricePerWeek ? parseFloat(pricePerWeek) : null,
        pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : null,
        minimumStay: minimumStay || 1,
        maximumStay: maximumStay || null,
        checkInTime: checkInTime || '15:00',
        checkOutTime: checkOutTime || '11:00',
        cleaningFee: cleaningFee ? parseFloat(cleaningFee) : null,
        commissionPercentage: parseFloat(commissionPercentage) || 15.0,
        rules,
        amenities: amenities ? JSON.stringify(amenities) : null,
      },
      include: {
        property: true,
        tenant: true,
      },
    });

    res.status(201).json(temporaryRental);
  } catch (error) {
    console.error('Error al crear alquiler temporal:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener todos los alquileres temporales de un tenant
 */
exports.getTemporaryRentalsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { isActive, isPublished } = req.query;

    const where = { tenantId: parseInt(tenantId) };
    
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';

    const rentals = await prisma.temporaryRental.findMany({
      where,
      include: {
        property: true,
        availabilities: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          take: 30,
        },
        bookings: {
          where: {
            status: 'CONFIRMED',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rentals);
  } catch (error) {
    console.error('Error al obtener alquileres temporales:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener detalle de un alquiler temporal
 */
exports.getTemporaryRentalById = async (req, res) => {
  try {
    const { id } = req.params;

    const rental = await prisma.temporaryRental.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: true,
        tenant: true,
        availabilities: true,
        bookings: {
          include: {
            guest: true,
          },
        },
      },
    });

    if (!rental) {
      return res.status(404).json({ error: 'Alquiler temporal no encontrado' });
    }

    res.json(rental);
  } catch (error) {
    console.error('Error al obtener alquiler temporal:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar alquiler temporal
 */
exports.updateTemporaryRental = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, pricePerNight, pricePerWeek, pricePerMonth, minimumStay, maximumStay, checkInTime, checkOutTime, cleaningFee, commissionPercentage, rules, amenities, isActive, isPublished } = req.body;

    const rental = await prisma.temporaryRental.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(pricePerNight && { pricePerNight: parseFloat(pricePerNight) }),
        ...(pricePerWeek && { pricePerWeek: parseFloat(pricePerWeek) }),
        ...(pricePerMonth && { pricePerMonth: parseFloat(pricePerMonth) }),
        ...(minimumStay && { minimumStay }),
        ...(maximumStay !== undefined && { maximumStay }),
        ...(checkInTime && { checkInTime }),
        ...(checkOutTime && { checkOutTime }),
        ...(cleaningFee !== undefined && { cleaningFee: cleaningFee ? parseFloat(cleaningFee) : null }),
        ...(commissionPercentage && { commissionPercentage: parseFloat(commissionPercentage) }),
        ...(rules && { rules }),
        ...(amenities && { amenities: JSON.stringify(amenities) }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: {
        property: true,
      },
    });

    res.json(rental);
  } catch (error) {
    console.error('Error al actualizar alquiler temporal:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Eliminar alquiler temporal
 */
exports.deleteTemporaryRental = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.temporaryRental.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Alquiler temporal eliminado' });
  } catch (error) {
    console.error('Error al eliminar alquiler temporal:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// GESTIÓN DE DISPONIBILIDAD
// ============================================

/**
 * Crear disponibilidades en rango de fechas
 */
exports.createAvailabilities = async (req, res) => {
  try {
    const { temporaryRentalId } = req.params;
    const { startDate, endDate, isAvailable, priceOverride, notes } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin son requeridas' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const availabilities = [];

    // Generar disponibilidades para cada día en el rango
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      availabilities.push({
        temporaryRentalId: parseInt(temporaryRentalId),
        date: new Date(date),
        isAvailable: isAvailable !== false,
        priceOverride: priceOverride ? parseFloat(priceOverride) : null,
        notes,
      });
    }

    // Usar createMany con skipDuplicates para evitar duplicados
    const result = await prisma.temporaryRentalAvailability.createMany({
      data: availabilities,
      skipDuplicates: true,
    });

    res.status(201).json({
      message: `${result.count} disponibilidades creadas`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error al crear disponibilidades:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener disponibilidades de un alquiler
 */
exports.getAvailabilities = async (req, res) => {
  try {
    const { temporaryRentalId } = req.params;
    const { startDate, endDate } = req.query;

    const where = {
      temporaryRentalId: parseInt(temporaryRentalId),
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const availabilities = await prisma.temporaryRentalAvailability.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    res.json(availabilities);
  } catch (error) {
    console.error('Error al obtener disponibilidades:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar disponibilidad
 */
exports.updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable, priceOverride, notes } = req.body;

    const availability = await prisma.temporaryRentalAvailability.update({
      where: { id: parseInt(id) },
      data: {
        ...(isAvailable !== undefined && { isAvailable }),
        ...(priceOverride !== undefined && { priceOverride: priceOverride ? parseFloat(priceOverride) : null }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json(availability);
  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Marcar fechas como no disponibles (mantenimiento, reservado, etc)
 */
exports.blockDates = async (req, res) => {
  try {
    const { temporaryRentalId } = req.params;
    const { startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await prisma.temporaryRentalAvailability.updateMany({
      where: {
        temporaryRentalId: parseInt(temporaryRentalId),
        date: {
          gte: start,
          lte: end,
        },
      },
      data: {
        isAvailable: false,
        notes: reason || 'Bloqueado',
      },
    });

    res.json({
      message: `${result.count} fechas bloqueadas`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error al bloquear fechas:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// CÁLCULO DE PRECIOS
// ============================================

/**
 * Calcular precio total de una reserva
 */
exports.calculatePrice = async (req, res) => {
  try {
    const { temporaryRentalId } = req.params;
    const { checkInDate, checkOutDate } = req.body;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'Las fechas de check-in y check-out son requeridas' });
    }

    const rental = await prisma.temporaryRental.findUnique({
      where: { id: parseInt(temporaryRentalId) },
    });

    if (!rental) {
      return res.status(404).json({ error: 'Alquiler temporal no encontrado' });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights < rental.minimumStay) {
      return res.status(400).json({ error: `Mínimo de noches: ${rental.minimumStay}` });
    }

    if (rental.maximumStay && nights > rental.maximumStay) {
      return res.status(400).json({ error: `Máximo de noches: ${rental.maximumStay}` });
    }

    // Obtener disponibilidades y precios especiales para las fechas
    const availabilities = await prisma.temporaryRentalAvailability.findMany({
      where: {
        temporaryRentalId: parseInt(temporaryRentalId),
        date: {
          gte: checkIn,
          lt: checkOut,
        },
      },
    });

    // Calcular precio base
    let basePrice = 0;
    let hasUnavailableDates = false;

    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const availability = availabilities.find(
        (a) => a.date.toDateString() === new Date(d).toDateString()
      );

      if (availability && !availability.isAvailable) {
        hasUnavailableDates = true;
        break;
      }

      // Usar precio especial si existe, sino precio por noche
      const dayPrice = availability?.priceOverride || rental.pricePerNight;
      basePrice += dayPrice;
    }

    if (hasUnavailableDates) {
      return res.status(400).json({ error: 'Algunas fechas no están disponibles' });
    }

    // Calcular comisión
    const commissionAmount = basePrice * (rental.commissionPercentage / 100);
    const cleaningFee = rental.cleaningFee || 0;
    const totalPrice = basePrice + cleaningFee;
    const totalWithCommission = totalPrice + commissionAmount;

    res.json({
      nights,
      basePrice: parseFloat(basePrice.toFixed(2)),
      cleaningFee: parseFloat(cleaningFee.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      commissionPercentage: rental.commissionPercentage,
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      totalWithCommission: parseFloat(totalWithCommission.toFixed(2)),
    });
  } catch (error) {
    console.error('Error al calcular precio:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// GESTIÓN DE RESERVAS
// ============================================

/**
 * Crear nueva reserva
 */
exports.createBooking = async (req, res) => {
  try {
    const { temporaryRentalId } = req.params;
    const {
      tenantId,
      guestId,
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      specialRequests,
      bookingSource,
    } = req.body;

    // Validaciones
    if (!tenantId || !guestName || !guestEmail || !guestPhone || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Obtener el alquiler temporal
    const rental = await prisma.temporaryRental.findUnique({
      where: { id: parseInt(temporaryRentalId) },
    });

    if (!rental) {
      return res.status(404).json({ error: 'Alquiler temporal no encontrado' });
    }

    // Calcular precio
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Validar disponibilidad
    const conflictingBookings = await prisma.temporaryRentalBooking.findMany({
      where: {
        temporaryRentalId: parseInt(temporaryRentalId),
        status: { in: ['PENDING', 'CONFIRMED'] },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });

    if (conflictingBookings.length > 0) {
      return res.status(409).json({ error: 'Las fechas seleccionadas no están disponibles' });
    }

    // Obtener disponibilidades para verificar
    const availabilities = await prisma.temporaryRentalAvailability.findMany({
      where: {
        temporaryRentalId: parseInt(temporaryRentalId),
        date: {
          gte: checkIn,
          lt: checkOut,
        },
      },
    });

    let basePrice = 0;
    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const availability = availabilities.find(
        (a) => a.date.toDateString() === new Date(d).toDateString()
      );

      if (availability && !availability.isAvailable) {
        return res.status(409).json({ error: 'Algunas fechas no están disponibles' });
      }

      const dayPrice = availability?.priceOverride || rental.pricePerNight;
      basePrice += dayPrice;
    }

    const cleaningFee = rental.cleaningFee || 0;
    const totalPrice = basePrice + cleaningFee;
    const commissionAmount = totalPrice * (rental.commissionPercentage / 100);

    // Crear reserva
    const booking = await prisma.temporaryRentalBooking.create({
      data: {
        temporaryRentalId: parseInt(temporaryRentalId),
        tenantId: parseInt(tenantId),
        guestId: guestId ? parseInt(guestId) : null,
        guestName,
        guestEmail,
        guestPhone,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: numberOfGuests || 1,
        totalNights: nights,
        basePrice: parseFloat(basePrice.toFixed(2)),
        cleaningFee: parseFloat(cleaningFee.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        commissionAmount: parseFloat(commissionAmount.toFixed(2)),
        specialRequests,
        bookingSource: bookingSource || 'LANDING',
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
      include: {
        temporaryRental: true,
        guest: true,
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener reservas de un alquiler
 */
exports.getBookings = async (req, res) => {
  try {
    const { temporaryRentalId } = req.params;
    const { status, paymentStatus } = req.query;

    const where = {
      temporaryRentalId: parseInt(temporaryRentalId),
    };

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const bookings = await prisma.temporaryRentalBooking.findMany({
      where,
      include: {
        guest: true,
      },
      orderBy: { checkInDate: 'asc' },
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener detalle de una reserva
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.temporaryRentalBooking.findUnique({
      where: { id: parseInt(id) },
      include: {
        temporaryRental: {
          include: {
            property: true,
          },
        },
        guest: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar estado de reserva
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const booking = await prisma.temporaryRentalBooking.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        temporaryRental: true,
      },
    });

    res.json(booking);
  } catch (error) {
    console.error('Error al actualizar estado de reserva:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar estado de pago de reserva
 */
exports.updateBookingPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validStatuses = ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'CANCELLED'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Estado de pago inválido' });
    }

    const booking = await prisma.temporaryRentalBooking.update({
      where: { id: parseInt(id) },
      data: { paymentStatus },
      include: {
        temporaryRental: true,
      },
    });

    res.json(booking);
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancelar reserva
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.temporaryRentalBooking.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CANCELLED',
        ...(reason && { specialRequests: reason }),
      },
      include: {
        temporaryRental: true,
      },
    });

    res.json(booking);
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener disponibilidad de un alquiler (para landing)
 */
exports.getAvailabilityStatus = async (req, res) => {
  try {
    const { temporaryRentalId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Las fechas son requeridas' });
    }

    const checkIn = new Date(startDate);
    const checkOut = new Date(endDate);

    // Verificar conflictos de reservas
    const conflictingBookings = await prisma.temporaryRentalBooking.findMany({
      where: {
        temporaryRentalId: parseInt(temporaryRentalId),
        status: { in: ['PENDING', 'CONFIRMED'] },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });

    if (conflictingBookings.length > 0) {
      return res.json({ available: false, reason: 'Fechas no disponibles' });
    }

    // Verificar disponibilidades en calendario
    const availabilities = await prisma.temporaryRentalAvailability.findMany({
      where: {
        temporaryRentalId: parseInt(temporaryRentalId),
        date: {
          gte: checkIn,
          lt: checkOut,
        },
        isAvailable: false,
      },
    });

    if (availabilities.length > 0) {
      return res.json({ available: false, reason: 'Algunas fechas no están disponibles' });
    }

    res.json({ available: true });
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({ error: error.message });
  }
};
