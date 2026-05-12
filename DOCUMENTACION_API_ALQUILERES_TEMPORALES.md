# API de Alquileres Temporales (Temporary Rentals)

## Descripción General

Sistema completo de gestión de alquileres temporales con:
- Gestión de propiedades disponibles para alquiler
- Calendario de disponibilidad con precios dinámicos
- Sistema de reservas con cálculo automático de precios
- Gestión de pagos y comisiones

## Base URL

```
/api/temporary-rental
```

---

## 📋 GESTIÓN DE ALQUILERES TEMPORALES

### 1. Crear Nuevo Alquiler Temporal

**POST** `/`

Requiere autenticación.

```json
{
  "propertyId": 123,
  "tenantId": 1,
  "title": "Casa frente al mar - Mar del Plata",
  "description": "Hermosa casa con vista al mar, 3 dormitorios, cocina moderna",
  "pricePerNight": 150.00,
  "pricePerWeek": 900.00,
  "pricePerMonth": 3000.00,
  "minimumStay": 3,
  "maximumStay": 30,
  "checkInTime": "15:00",
  "checkOutTime": "11:00",
  "cleaningFee": 50.00,
  "commissionPercentage": 15.0,
  "rules": "No fumar, sin mascotas, cuidar las plantas",
  "amenities": ["WiFi", "Aire acondicionado", "TV", "Cocina completa"]
}
```

**Response:**
```json
{
  "id": 1,
  "propertyId": 123,
  "tenantId": 1,
  "title": "Casa frente al mar - Mar del Plata",
  "description": "...",
  "pricePerNight": 150.00,
  "pricePerWeek": 900.00,
  "pricePerMonth": 3000.00,
  "minimumStay": 3,
  "maximumStay": 30,
  "checkInTime": "15:00",
  "checkOutTime": "11:00",
  "cleaningFee": 50.00,
  "commissionPercentage": 15.0,
  "rules": "...",
  "amenities": "[\"WiFi\", \"Aire acondicionado\", ...]",
  "isActive": true,
  "isPublished": false,
  "createdAt": "2026-05-12T10:30:00Z",
  "updatedAt": "2026-05-12T10:30:00Z"
}
```

---

### 2. Obtener Alquileres Temporales del Tenant

**GET** `/tenant/:tenantId`

No requiere autenticación (pero puede filtrar resultados con parámetros opcionales).

**Query Parameters:**
- `isActive` (boolean) - Filtrar por estado activo
- `isPublished` (boolean) - Filtrar por estado publicado

```bash
curl "http://localhost:3000/api/temporary-rental/tenant/1?isActive=true&isPublished=true"
```

**Response:**
```json
[
  {
    "id": 1,
    "propertyId": 123,
    "tenantId": 1,
    "title": "Casa frente al mar",
    "description": "...",
    "pricePerNight": 150.00,
    "property": {
      "propertyId": 123,
      "address": "Av. Alem 500, Mar del Plata",
      "city": "Mar del Plata"
    },
    "availabilities": [
      {
        "id": 1,
        "date": "2026-05-15",
        "isAvailable": true,
        "priceOverride": null
      }
    ],
    "bookings": [
      {
        "id": 1,
        "guestName": "Juan Pérez",
        "checkInDate": "2026-05-20",
        "checkOutDate": "2026-05-25"
      }
    ]
  }
]
```

---

### 3. Obtener Detalle de Alquiler Temporal

**GET** `/:id`

```bash
curl "http://localhost:3000/api/temporary-rental/1"
```

**Response:** (objeto completo con relaciones)

---

### 4. Actualizar Alquiler Temporal

**PUT** `/:id`

Requiere autenticación.

```json
{
  "title": "Casa frente al mar actualizada",
  "pricePerNight": 160.00,
  "isPublished": true,
  "commissionPercentage": 16.5
}
```

---

### 5. Eliminar Alquiler Temporal

**DELETE** `/:id`

Requiere autenticación.

```bash
curl -X DELETE "http://localhost:3000/api/temporary-rental/1"
```

---

## 📅 GESTIÓN DE DISPONIBILIDAD

### 1. Crear Disponibilidades en Rango de Fechas

**POST** `/:temporaryRentalId/availability`

Requiere autenticación.

Crea una entrada de disponibilidad para cada día en el rango especificado.

```json
{
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "isAvailable": true,
  "priceOverride": null,
  "notes": "Verano 2026"
}
```

**Response:**
```json
{
  "message": "30 disponibilidades creadas",
  "count": 30
}
```

---

### 2. Obtener Disponibilidades

**GET** `/:temporaryRentalId/availability`

**Query Parameters:**
- `startDate` (YYYY-MM-DD) - Fecha de inicio
- `endDate` (YYYY-MM-DD) - Fecha de fin

```bash
curl "http://localhost:3000/api/temporary-rental/1/availability?startDate=2026-06-01&endDate=2026-06-30"
```

**Response:**
```json
[
  {
    "id": 1,
    "temporaryRentalId": 1,
    "date": "2026-06-01",
    "isAvailable": true,
    "priceOverride": null,
    "notes": "Verano 2026",
    "createdAt": "2026-05-12T10:30:00Z",
    "updatedAt": "2026-05-12T10:30:00Z"
  }
]
```

---

### 3. Actualizar Disponibilidad Específica

**PUT** `/availability/:id`

Requiere autenticación.

```json
{
  "isAvailable": false,
  "priceOverride": 200.00,
  "notes": "Precio especial por feriado"
}
```

---

### 4. Bloquear Fechas (Mantenimiento, Reservado, etc.)

**POST** `/:temporaryRentalId/block-dates`

Requiere autenticación.

```json
{
  "startDate": "2026-08-01",
  "endDate": "2026-08-05",
  "reason": "Mantenimiento de la propiedad"
}
```

**Response:**
```json
{
  "message": "5 fechas bloqueadas",
  "count": 5
}
```

---

## 💰 CÁLCULO DE PRECIOS

### Calcular Precio Total de Reserva

**POST** `/:temporaryRentalId/calculate-price`

No requiere autenticación.

```json
{
  "checkInDate": "2026-06-10",
  "checkOutDate": "2026-06-15"
}
```

**Response:**
```json
{
  "nights": 5,
  "basePrice": 750.00,
  "cleaningFee": 50.00,
  "totalPrice": 800.00,
  "commissionPercentage": 15.0,
  "commissionAmount": 120.00,
  "totalWithCommission": 920.00
}
```

---

## 🏨 GESTIÓN DE RESERVAS

### 1. Crear Nueva Reserva

**POST** `/:temporaryRentalId/booking`

No requiere autenticación (permite reservas desde landing).

```json
{
  "tenantId": 1,
  "guestId": null,
  "guestName": "Ana García",
  "guestEmail": "ana@example.com",
  "guestPhone": "+5491123456789",
  "checkInDate": "2026-06-10",
  "checkOutDate": "2026-06-15",
  "numberOfGuests": 4,
  "specialRequests": "Necesitamos cuna para bebé",
  "bookingSource": "LANDING"
}
```

**Response:**
```json
{
  "id": 1,
  "temporaryRentalId": 1,
  "tenantId": 1,
  "guestId": null,
  "guestName": "Ana García",
  "guestEmail": "ana@example.com",
  "guestPhone": "+5491123456789",
  "checkInDate": "2026-06-10",
  "checkOutDate": "2026-06-15",
  "numberOfGuests": 4,
  "totalNights": 5,
  "basePrice": 750.00,
  "cleaningFee": 50.00,
  "totalPrice": 800.00,
  "commissionAmount": 120.00,
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "specialRequests": "Necesitamos cuna para bebé",
  "bookingSource": "LANDING",
  "createdAt": "2026-05-12T10:30:00Z",
  "updatedAt": "2026-05-12T10:30:00Z"
}
```

**Estados de Reserva:**
- `PENDING` - Pendiente de confirmación
- `CONFIRMED` - Confirmada
- `CANCELLED` - Cancelada
- `COMPLETED` - Completada
- `NO_SHOW` - No se presentó

**Estados de Pago:**
- `PENDING` - Pago pendiente
- `PARTIAL` - Pago parcial
- `PAID` - Pagado completamente
- `REFUNDED` - Reembolsado
- `CANCELLED` - Cancelado

---

### 2. Obtener Reservas de un Alquiler

**GET** `/:temporaryRentalId/booking`

Requiere autenticación.

**Query Parameters:**
- `status` - Filtrar por estado (PENDING, CONFIRMED, etc.)
- `paymentStatus` - Filtrar por estado de pago (PENDING, PAID, etc.)

```bash
curl -H "Authorization: Bearer token" "http://localhost:3000/api/temporary-rental/1/booking?status=CONFIRMED"
```

**Response:** (array de reservas)

---

### 3. Obtener Detalle de Reserva

**GET** `/booking/:id`

Requiere autenticación.

```bash
curl -H "Authorization: Bearer token" "http://localhost:3000/api/temporary-rental/booking/1"
```

**Response:**
```json
{
  "id": 1,
  "temporaryRentalId": 1,
  "guestName": "Ana García",
  "checkInDate": "2026-06-10",
  "checkOutDate": "2026-06-15",
  "totalPrice": 800.00,
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "temporaryRental": {
    "id": 1,
    "title": "Casa frente al mar",
    "property": {
      "address": "Av. Alem 500"
    }
  },
  "guest": null
}
```

---

### 4. Actualizar Estado de Reserva

**PUT** `/booking/:id/status`

Requiere autenticación.

```json
{
  "status": "CONFIRMED"
}
```

**Estados válidos:** PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW

---

### 5. Actualizar Estado de Pago

**PUT** `/booking/:id/payment-status`

Requiere autenticación.

```json
{
  "paymentStatus": "PAID"
}
```

**Estados válidos:** PENDING, PARTIAL, PAID, REFUNDED, CANCELLED

---

### 6. Cancelar Reserva

**DELETE** `/booking/:id`

Requiere autenticación.

```json
{
  "reason": "Cliente solicitó cancelación"
}
```

---

## 🔍 VERIFICAR DISPONIBILIDAD (Para Landing)

### Verificar si Fechas Están Disponibles

**GET** `/:temporaryRentalId/availability-status`

No requiere autenticación (útil para landing pages).

**Query Parameters:**
- `startDate` (requerido) - YYYY-MM-DD
- `endDate` (requerido) - YYYY-MM-DD

```bash
curl "http://localhost:3000/api/temporary-rental/1/availability-status?startDate=2026-06-10&endDate=2026-06-15"
```

**Response (disponible):**
```json
{
  "available": true
}
```

**Response (no disponible):**
```json
{
  "available": false,
  "reason": "Fechas no disponibles"
}
```

---

## 📝 NOTAS IMPORTANTES

### Validaciones Automáticas

1. **Duración mínima:** Se valida contra `minimumStay`
2. **Duración máxima:** Se valida contra `maximumStay`
3. **Conflicto de reservas:** Se verifica solapamiento con reservas PENDING o CONFIRMED
4. **Disponibilidad por fecha:** Se verifica contra el calendario de disponibilidades

### Cálculo de Precios

- **Base Price**: Suma de precios por noche (o precio especial si existe)
- **Cleaning Fee**: Tarifa fija de limpieza
- **Total Price**: Base Price + Cleaning Fee
- **Commission**: Total Price × Commission Percentage
- **Total with Commission**: Total Price + Commission

### Autenticación

Endpoints que requieren autenticación esperan:
```
Authorization: Bearer <jwt-token>
```

### Estructura de Datos Especiales

**Amenities:** Se almacena como JSON string. Ejemplo:
```javascript
amenities: ["WiFi", "Aire acondicionado", "TV", "Cocina completa"]
// Almacenado en DB como: "[\"WiFi\", \"Aire acondicionado\", ...]"
```

---

## 🔄 Flujo Típico de Uso

1. **Admin crea alquiler temporal**
   - POST `/` con datos de la propiedad

2. **Admin establece disponibilidades**
   - POST `/:id/availability` para crear calendario

3. **Admin puede bloquear fechas específicas**
   - POST `/:id/block-dates` para mantenimiento, etc.

4. **Usuario (landing o app) verifica disponibilidad**
   - GET `/:id/availability-status` antes de reservar

5. **Usuario crea reserva**
   - POST `/:id/booking` con datos del huésped

6. **Admin confirma o rechaza reserva**
   - PUT `/booking/:id/status` para cambiar a CONFIRMED o CANCELLED

7. **Admin marca como pagada**
   - PUT `/booking/:id/payment-status` para actualizar estado de pago

8. **Admin marca como completada después del check-out**
   - PUT `/booking/:id/status` para cambiar a COMPLETED

---

## 🚀 Próximos Pasos

- [ ] Integración con MercadoPago para pagos en línea
- [ ] Sistema de notificaciones (email a huéspedes)
- [ ] Panel de admin en React
- [ ] Landing page con calendario interactivo
- [ ] Sistema de reviews de huéspedes
- [ ] Automatización de estado (COMPLETED después de check-out)
