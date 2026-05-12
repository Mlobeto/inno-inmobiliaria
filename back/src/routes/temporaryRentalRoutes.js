const express = require('express');
const router = express.Router();
const TemporaryRentalController = require('../controllers/TemporaryRentalController');
const authenticate = require('../middlewares/authMiddleware');

// ============================================
// RUTAS DE ALQUILERES TEMPORALES
// ============================================

// Crear nuevo alquiler temporal
router.post('/', authenticate, TemporaryRentalController.createTemporaryRental);

// Obtener todos los alquileres temporales del tenant
router.get('/tenant/:tenantId', TemporaryRentalController.getTemporaryRentalsByTenant);

// Obtener detalle de un alquiler temporal
router.get('/:id', TemporaryRentalController.getTemporaryRentalById);

// Actualizar alquiler temporal
router.put('/:id', authenticate, TemporaryRentalController.updateTemporaryRental);

// Eliminar alquiler temporal
router.delete('/:id', authenticate, TemporaryRentalController.deleteTemporaryRental);

// ============================================
// RUTAS DE DISPONIBILIDAD
// ============================================

// Crear disponibilidades en rango de fechas
router.post('/:temporaryRentalId/availability', authenticate, TemporaryRentalController.createAvailabilities);

// Obtener disponibilidades
router.get('/:temporaryRentalId/availability', TemporaryRentalController.getAvailabilities);

// Actualizar disponibilidad específica
router.put('/availability/:id', authenticate, TemporaryRentalController.updateAvailability);

// Bloquear fechas
router.post('/:temporaryRentalId/block-dates', authenticate, TemporaryRentalController.blockDates);

// ============================================
// RUTAS DE PRECIOS
// ============================================

// Calcular precio total
router.post('/:temporaryRentalId/calculate-price', TemporaryRentalController.calculatePrice);

// ============================================
// RUTAS DE RESERVAS
// ============================================

// Crear nueva reserva
router.post('/:temporaryRentalId/booking', TemporaryRentalController.createBooking);

// Obtener reservas de un alquiler
router.get('/:temporaryRentalId/booking', authenticate, TemporaryRentalController.getBookings);

// Obtener detalle de una reserva
router.get('/booking/:id', authenticate, TemporaryRentalController.getBookingById);

// Actualizar estado de reserva
router.put('/booking/:id/status', authenticate, TemporaryRentalController.updateBookingStatus);

// Actualizar estado de pago
router.put('/booking/:id/payment-status', authenticate, TemporaryRentalController.updateBookingPaymentStatus);

// Cancelar reserva
router.delete('/booking/:id', authenticate, TemporaryRentalController.cancelBooking);

// Verificar disponibilidad (para landing)
router.get('/:temporaryRentalId/availability-status', TemporaryRentalController.getAvailabilityStatus);

module.exports = router;
