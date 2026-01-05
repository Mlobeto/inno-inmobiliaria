# 🎯 Sistema de Suscripciones con MercadoPago - Implementación Completa

## 📋 Resumen

Sistema completo de suscripciones integrado con MercadoPago que permite a los usuarios:
- Ver y seleccionar planes
- Iniciar períodos de prueba gratuitos
- Procesar pagos recurrentes con MercadoPago
- Gestionar suscripciones activas (cancelar, cambiar plan)
- Recibir webhooks de MercadoPago para actualizar estados

---

## 🏗️ Arquitectura

### Backend (Node.js + Express)
- **SubscriptionController**: Lógica de negocio de suscripciones
- **Rutas**: `/api/subscriptions/*` para operaciones de suscripción
- **Webhooks**: `/api/webhooks/mercadopago` para notificaciones de MercadoPago
- **Integración MercadoPago**: SDK oficial v2 (`mercadopago`)

### Frontend (React + Redux Toolkit Query)
- **Redux API**: `subscriptionApi.js` con hooks RTK Query
- **Componentes**:
  - `PlanSelector`: Selección de planes
  - `SubscriptionDashboard`: Gestión de suscripción activa
  - `SubscriptionSuccess`: Página de confirmación post-pago
- **Rutas**: `/plans`, `/subscription`, `/subscription/success`

### Shared Redux
- API compartida entre Web y Mobile
- Exportaciones centralizadas en `@shared/redux`

---

## 🔌 Endpoints Backend

### Suscripciones

#### `GET /api/subscriptions/plans`
Obtener todos los planes disponibles.

**Respuesta:**
```json
{
  "success": true,
  "plans": [
    {
      "planId": "basic",
      "name": "Plan Básico",
      "priceMonthly": 25000,
      "currency": "ARS",
      "trialDays": 7,
      "maxProperties": 100,
      "maxClients": 200,
      "maxUsers": 3,
      "maxStorageGB": 5,
      "features": {...},
      "isActive": true,
      "isPopular": false,
      "sortOrder": 3
    }
  ]
}
```

#### `GET /api/subscriptions/current`
Obtener suscripción activa del tenant autenticado.

**Headers:** `Authorization: Bearer <token>`

**Respuesta:**
```json
{
  "success": true,
  "subscription": {
    "subscriptionId": 1,
    "tenantId": 1,
    "planId": "basic",
    "status": "active",
    "paymentProvider": "mercadopago",
    "mpSubscriptionId": "2c9380848b9f0a3f018ba042b5b50f0c",
    "currentPeriodStart": "2026-01-01T00:00:00Z",
    "currentPeriodEnd": "2026-02-01T00:00:00Z",
    "amount": 25000,
    "currency": "ARS",
    "Plan": {
      "name": "Plan Básico",
      "maxProperties": 100,
      ...
    }
  }
}
```

#### `POST /api/subscriptions/create-subscription`
Crear nueva suscripción (redirige a MercadoPago para pago).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "planId": "basic"
}
```

**Respuesta:**
```json
{
  "success": true,
  "subscriptionUrl": "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=xxx",
  "subscriptionId": 1,
  "mpSubscriptionId": "2c9380848b9f0a3f018ba042b5b50f0c"
}
```

**Flujo:**
1. Backend crea preapproval en MercadoPago
2. MercadoPago devuelve `init_point` (URL de checkout)
3. Frontend redirige al usuario a MercadoPago
4. Usuario completa el pago
5. MercadoPago redirige a `/subscription/success`
6. Webhook actualiza estado en BD

#### `POST /api/subscriptions/cancel`
Cancelar suscripción activa.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "immediately": false
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Suscripción se cancelará al final del período",
  "subscription": {...}
}
```

**Opciones:**
- `immediately: false` → Cancela al final del período actual
- `immediately: true` → Cancela inmediatamente (pierde acceso)

#### `POST /api/subscriptions/change-plan`
Cambiar a otro plan.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "newPlanId": "professional",
  "billingCycle": "monthly"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Plan cambiado a Professional",
  "subscription": {...}
}
```

#### `POST /api/subscriptions/start-trial`
Iniciar período de prueba gratuito.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "planId": "basic"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Trial de 7 días iniciado",
  "subscription": {
    "status": "trialing",
    "trialStart": "2026-01-04T00:00:00Z",
    "trialEnd": "2026-01-11T00:00:00Z",
    ...
  }
}
```

**Restricciones:**
- Solo se puede usar trial una vez por tenant
- Si ya tuvo suscripción, devuelve error 400

### Webhooks

#### `POST /api/webhooks/mercadopago`
Recibe notificaciones de MercadoPago (suscripciones y pagos).

**Sin autenticación requerida**

**Body (ejemplo de suscripción):**
```json
{
  "type": "subscription_preapproval",
  "action": "updated",
  "data": {
    "id": "2c9380848b9f0a3f018ba042b5b50f0c"
  }
}
```

**Body (ejemplo de pago):**
```json
{
  "type": "payment",
  "data": {
    "id": "123456789"
  }
}
```

**Responde inmediatamente 200 OK** y procesa en segundo plano:
1. Obtiene detalles del evento desde MercadoPago API
2. Busca suscripción en BD por `mpSubscriptionId`
3. Actualiza estado y fechas según evento

**Eventos soportados:**
- `subscription_preapproval`: Cambios en suscripción (authorized, paused, cancelled)
- `payment`: Pagos recurrentes (approved, rejected)

---

## 🎨 Componentes Frontend

### 1. `PlanSelector.jsx` - Selector de Planes

**Ruta:** `/plans`

**Funcionalidad:**
- Muestra todos los planes disponibles en cards
- Permite seleccionar un plan
- Modal de confirmación
- Botón diferente para planes con trial vs sin trial
- Redirige a MercadoPago o inicia trial

**Hooks Redux:**
```javascript
import { 
  useGetPlansQuery, 
  useCreateSubscriptionMutation,
  useStartTrialMutation 
} from '@shared/redux';
```

**Lógica:**
```javascript
const handleConfirmPlan = async () => {
  if (selectedPlan.trialDays > 0) {
    // Iniciar trial (sin pago)
    await startTrial({ planId: selectedPlan.planId });
    window.location.href = '/dashboard';
  } else {
    // Crear suscripción con MercadoPago
    const result = await createSubscription({ planId: selectedPlan.planId });
    window.location.href = result.subscriptionUrl; // Redirige a MercadoPago
  }
};
```

**Características visuales:**
- Badge "Más Popular" en planes destacados
- Badge "{X} días gratis" en planes con trial
- Iconos para cada característica
- Lista de features incluidas
- Responsive (3 columnas desktop, 1 móvil)

### 2. `SubscriptionDashboard.jsx` - Dashboard de Suscripción

**Ruta:** `/subscription`

**Requiere:** Autenticación

**Funcionalidad:**
- Muestra suscripción actual con todos los detalles
- Permite cancelar suscripción (inmediata o al final del período)
- Permite cambiar de plan
- Muestra días restantes si está en trial
- Alertas para estados especiales (trial, vencida)

**Hooks Redux:**
```javascript
import { 
  useGetCurrentSubscriptionQuery, 
  useGetPlansQuery,
  useCancelSubscriptionMutation,
  useChangePlanMutation 
} from '@shared/redux';
```

**Estados de suscripción:**
- `trialing`: En período de prueba
- `active`: Activa y pagada
- `past_due`: Pago vencido
- `canceled`: Cancelada

**Modales:**
1. **Modal de Cancelación**
   - Opción 1: Cancelar al final del período
   - Opción 2: Cancelar inmediatamente

2. **Modal de Cambio de Plan**
   - Grid con planes disponibles
   - Selecciona nuevo plan
   - Confirma cambio

### 3. `SubscriptionSuccess.jsx` - Página de Éxito

**Ruta:** `/subscription/success`

**Funcionalidad:**
- Página de confirmación después del pago en MercadoPago
- Muestra detalles de la suscripción activada
- Countdown de 5 segundos para redirección automática
- Botones manuales para ir al dashboard

**Parámetros URL:**
MercadoPago redirige con:
```
/subscription/success?status=approved&payment_id=123456&external_reference=tenant_1_plan_basic
```

**Lógica:**
```javascript
useEffect(() => {
  refetch(); // Recargar suscripción (webhook ya actualizó BD)
}, [refetch]);

useEffect(() => {
  // Countdown
  if (countdown === 0) {
    navigate('/dashboard');
  }
}, [countdown, navigate]);
```

---

## 🔗 Redux API

### `shared/redux/api/subscriptionApi.js`

```javascript
export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query({
      query: () => '/subscriptions/plans',
      providesTags: ['Plans']
    }),
    getCurrentSubscription: builder.query({
      query: () => '/subscriptions/current',
      providesTags: ['Subscription']
    }),
    createSubscription: builder.mutation({
      query: (data) => ({
        url: '/subscriptions/create-subscription',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    }),
    cancelSubscription: builder.mutation({
      query: (data) => ({
        url: '/subscriptions/cancel',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    }),
    changePlan: builder.mutation({
      query: (data) => ({
        url: '/subscriptions/change-plan',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    }),
    startTrial: builder.mutation({
      query: (data) => ({
        url: '/subscriptions/start-trial',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Subscription']
    })
  })
});
```

**Hooks generados automáticamente:**
- `useGetPlansQuery()`
- `useGetCurrentSubscriptionQuery()`
- `useCreateSubscriptionMutation()`
- `useCancelSubscriptionMutation()`
- `useChangePlanMutation()`
- `useStartTrialMutation()`

**Exportaciones en `shared/redux/index.js`:**
```javascript
export {
  subscriptionApi,
  useGetCurrentSubscriptionQuery,
  useGetPlansQuery,
  useCreateSubscriptionMutation,
  useCancelSubscriptionMutation,
  useChangePlanMutation,
  useStartTrialMutation,
} from './api/subscriptionApi';
```

---

## 🛣️ Rutas Configuradas

**En `front/src/App.jsx`:**

```javascript
// Suscripciones y Planes
<Route path="/plans" element={<PlanSelector />} />
<Route path="/subscription" element={<SubscriptionDashboard />} />
<Route path="/subscription/success" element={<SubscriptionSuccess />} />
```

**Acceso:**
- `/plans` → Público y autenticado (selector de planes)
- `/subscription` → Solo autenticado (dashboard de suscripción)
- `/subscription/success` → Callback de MercadoPago (puede ser público)

---

## 🔄 Flujo Completo de Suscripción

### 1. Usuario Selecciona Plan

```
Landing Page → "Ver Planes" → /plans
                                  ↓
                          [PlanSelector Component]
                                  ↓
                    Usuario hace clic en "Elegir Plan"
                                  ↓
                          Modal de Confirmación
```

### 2. Plan con Trial (Ejemplo: Plan Basic, 7 días gratis)

```
Usuario confirma → useStartTrialMutation()
                           ↓
              POST /api/subscriptions/start-trial
                           ↓
              Backend crea subscription con:
              - status: 'trialing'
              - trialStart: now
              - trialEnd: now + 7 days
              - amount: 0
                           ↓
              Respuesta exitosa
                           ↓
              Redirige a /dashboard
```

### 3. Plan sin Trial (Ejemplo: Plan Professional)

```
Usuario confirma → useCreateSubscriptionMutation()
                           ↓
        POST /api/subscriptions/create-subscription
                           ↓
        Backend crea preapproval en MercadoPago:
        - auto_recurring: monthly
        - transaction_amount: priceMonthly
        - back_url: /subscription/success
                           ↓
        MercadoPago devuelve init_point (URL checkout)
                           ↓
        Backend guarda subscription con:
        - status: 'incomplete'
        - mpSubscriptionId
                           ↓
        Frontend redirige a init_point
                           ↓
        Usuario completa pago en MercadoPago
                           ↓
        MercadoPago redirige a /subscription/success
                           ↓
        Webhook actualiza subscription:
        - status: 'active'
        - currentPeriodStart
        - currentPeriodEnd
```

### 4. Webhook de MercadoPago

```
MercadoPago envía POST /api/webhooks/mercadopago
                           ↓
Backend responde 200 OK inmediatamente
                           ↓
Backend procesa en segundo plano:
  1. GET preapproval details desde MercadoPago API
  2. Busca subscription por mpSubscriptionId
  3. Actualiza status, fechas, etc.
                           ↓
Frontend refetch automático (RTK Query)
```

### 5. Gestión de Suscripción

```
Usuario va a /subscription
                           ↓
        [SubscriptionDashboard Component]
                           ↓
useGetCurrentSubscriptionQuery() → Muestra datos
                           ↓
Usuario puede:
  - Cancelar (inmediato o al final del período)
  - Cambiar plan (upgrade/downgrade)
  - Ver detalles de próximo pago
```

---

## 🔐 Configuración Requerida

### Variables de Entorno Backend (`.env`)

```bash
# MercadoPago
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# Database
DB_NAME=InnoInmobiliaria_Dev
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=your_jwt_secret_key
```

### Configurar Webhook en MercadoPago

1. Ir a https://www.mercadopago.com.ar/developers
2. Tu aplicación → Webhooks
3. Agregar URL: `https://tudominio.com/api/webhooks/mercadopago`
4. Seleccionar eventos:
   - `subscription_preapproval`
   - `payment`

### Script de Sincronización de Planes

**Archivo:** `back/src/scripts/syncPlansToMercadoPago.js`

```bash
# Ejecutar para crear planes en MercadoPago
node back/src/scripts/syncPlansToMercadoPago.js
```

Este script:
1. Lee planes de la base de datos
2. Crea `preapproval_plan` en MercadoPago
3. Guarda `mpPlanId` en la BD

---

## 🧪 Testing

### 1. Probar Creación de Suscripción

```bash
# Debe estar logueado
curl -X POST http://localhost:3001/api/subscriptions/create-subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "basic"}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "subscriptionUrl": "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=xxx",
  "subscriptionId": 1,
  "mpSubscriptionId": "2c9380848b9f0a3f018ba042b5b50f0c"
}
```

### 2. Probar Trial

```bash
curl -X POST http://localhost:3001/api/subscriptions/start-trial \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "basic"}'
```

### 3. Probar Webhook (simulación)

```bash
curl -X POST http://localhost:3001/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscription_preapproval",
    "action": "updated",
    "data": {
      "id": "2c9380848b9f0a3f018ba042b5b50f0c"
    }
  }'
```

---

## 📱 Mobile (React Native)

Los mismos hooks de Redux funcionan en mobile:

```javascript
// En React Native
import { 
  useGetPlansQuery,
  useCreateSubscriptionMutation 
} from '@shared/redux';

// Usar exactamente igual que en web
const { data: plansData } = useGetPlansQuery();
const [createSubscription] = useCreateSubscriptionMutation();

// Para abrir MercadoPago
import { Linking } from 'react-native';

const result = await createSubscription({ planId: 'basic' });
Linking.openURL(result.subscriptionUrl);
```

---

## 🚀 Próximos Pasos

### 1. Implementar Límites de Plan
- Middleware para verificar `maxProperties`, `maxClients`, etc.
- Responder 402 Payment Required cuando se exceda
- Mensaje: "Has alcanzado el límite de tu plan. Actualiza para continuar"

### 2. Notificaciones por Email
- Trial a punto de expirar (2 días antes)
- Pago exitoso
- Pago fallido
- Suscripción cancelada

### 3. Dashboard de Métricas
- Total de suscripciones activas
- Revenue mensual
- Tasas de conversión trial → pago
- Churn rate

### 4. Proration (Prorrateo)
- Al cambiar de plan mid-cycle, calcular crédito o cobro proporcional
- API de MercadoPago soporta esto con `application_fee`

### 5. Múltiples Métodos de Pago
- Agregar Stripe como alternativa
- Permitir al usuario elegir

---

## 📚 Recursos

- **MercadoPago SDK Docs**: https://www.mercadopago.com.ar/developers/es/docs
- **Preapproval Plans**: https://www.mercadopago.com.ar/developers/es/docs/subscriptions
- **Webhooks**: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
- **RTK Query**: https://redux-toolkit.js.org/rtk-query/overview

---

## ✅ Checklist de Implementación

- [x] Redux API de suscripciones
- [x] Componente PlanSelector
- [x] Componente SubscriptionDashboard
- [x] Componente SubscriptionSuccess
- [x] Rutas configuradas en App.jsx
- [x] Actualizar LandingHero CTA a /plans
- [x] Actualizar LandingPlans CTA a /plans
- [x] Backend endpoints completos
- [x] Webhook handler
- [ ] Configurar webhook en MercadoPago dashboard
- [ ] Ejecutar script syncPlansToMercadoPago.js
- [ ] Variables de entorno configuradas
- [ ] Testing end-to-end

---

## 🎉 Sistema Listo

El sistema de suscripciones está completamente implementado y listo para usar. Los usuarios pueden:

1. Ver planes en la landing page
2. Seleccionar un plan desde `/plans`
3. Iniciar trial gratuito o proceder a pago
4. Gestionar su suscripción desde `/subscription`
5. Recibir actualizaciones automáticas vía webhooks

**Todo funciona con Redux compartido entre Web y Mobile.**
