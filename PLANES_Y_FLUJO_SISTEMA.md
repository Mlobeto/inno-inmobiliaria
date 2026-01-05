# Sistema InnoInmo - Planes y Flujo de Trabajo

## 📋 Resumen del Sistema

**InnoInmo** es una plataforma SaaS multi-tenant diseñada para inmobiliarias, que permite gestionar propiedades, clientes, contratos de alquiler/venta y seguimiento de pagos.

---

## 🔄 Flujo de Trabajo Actual

### 1. **Recepción de Propiedad**
La inmobiliaria recibe una propiedad para vender o alquilar.

### 2. **Alta de Cliente**
- Se carga el cliente en el sistema sin asignar rol inicialmente
- Datos: nombre, contacto, documentación, etc.

### 3. **Alta de Propiedad**
- Se cargan todos los datos de la propiedad:
  - Tipo (casa, departamento, local, etc.)
  - Ubicación y características
  - Fotos
  - Precio y comisión
- Se relaciona la propiedad con el cliente
- **Se asigna el rol automáticamente:**
  - `Propietario` → si es alquiler
  - `Vendedor` → si es venta

### 4. **Gestión de Interesados**
Desde el listado de propiedades, el tenant puede:

#### 📄 **Descargar PDF**
- Genera un PDF con fotos y características de la propiedad
- Listo para enviar a potenciales interesados

#### 💬 **WhatsApp - Respuesta Automática**
- Copia una respuesta predeterminada con las características
- Incluye: ubicación, precio, características principales
- Listo para enviar por WhatsApp

#### 📝 **Plantilla de Requisitos**
- Copia una plantilla con los requisitos para alquilar/comprar
- Ejemplo: documentación necesaria, garantías, ingresos mínimos

### 5. **Cierre de Operación**

#### 🏷️ **Si es VENTA:**
1. Se completa el formulario de **Autorización de Venta**
2. Se genera un **Recibo de Comisión** con el monto cargado en el alta de la propiedad
3. Se descarga el recibo en PDF

#### 🏠 **Si es ALQUILER:**
1. Se completa el **Formulario de Contrato** con datos:
   - Inquilino (nuevo cliente)
   - Garantes (si aplica)
   - Monto de alquiler, depósito, expensas
   - Duración del contrato
   - Fecha de inicio
2. El sistema genera el **Contrato de Alquiler en PDF**
3. Cada tenant puede **editar su propio template de contrato** (personalización)
4. Se descarga el contrato firmado

### 6. **Gestión Post-Contrato (Alquileres)**

#### 💰 **Seguimiento de Pagos**
- Registro de pagos mensuales
- Estado: pendiente, pagado, atrasado
- Notificaciones automáticas
- Generación de recibos

#### 📊 **Actualización de Contratos**
- Ajustes por inflación/IPC
- Renovaciones automáticas
- Cambios en montos

---

## 🎯 Propuesta de Planes de Suscripción

### Estructura Basada en Cantidad de Propiedades

| Plan          | Propiedades | Clientes | Usuarios | Precio Mensual | Precio Anual | Trial |
|---------------|-------------|----------|----------|----------------|--------------|-------|
| **Trial**     | 10          | 20       | 1        | $0             | $0           | 7 días |
| **Starter**   | 50          | 100      | 2        | $15.000        | $150.000     | ❌     |
| **Basic**     | 100         | 200      | 3        | $25.000        | $250.000     | ❌     |
| **Professional** | 250      | 500      | 5        | $45.000        | $450.000     | ❌     |
| **Business**  | 500         | 1000     | 10       | $75.000        | $750.000     | ❌     |
| **Enterprise** | Ilimitado  | Ilimitado | Ilimitado | $150.000   | $1.500.000   | ❌     |

### 🎁 Plan Trial (Prueba Gratuita)

**Duración:** 7 días  
**Características:**
- 10 propiedades máximo
- 20 clientes máximo
- 1 usuario
- Acceso completo a todas las funcionalidades:
  - ✅ Generación de PDF
  - ✅ WhatsApp templates
  - ✅ Contratos y recibos
  - ✅ Seguimiento de pagos
  - ✅ Editor de templates de contrato
  - ✅ Actualización de alquileres
- Sin tarjeta de crédito requerida
- Al finalizar, se solicita upgrade a plan pago

**Objetivo del Trial:**
Permitir que las inmobiliarias prueben el sistema completo con propiedades reales antes de comprometerse con un plan pago.

---

## ✨ Características por Plan

### Todas las Funcionalidades Base (Incluidas en Todos los Planes)

✅ **Gestión de Propiedades**
- Alta, edición y eliminación de propiedades
- Carga de fotos (múltiples)
- Estados: disponible, reservada, alquilada, vendida

✅ **Gestión de Clientes**
- Alta de clientes con roles dinámicos
- Roles: propietario, vendedor, inquilino, garante

✅ **Generación de PDF Propiedades**
- PDF profesional con fotos de la propiedad
- Características completas para enviar a interesados
- Descarga directa desde el listado

✅ **Plantillas WhatsApp**
- Respuestas automáticas con características
- Plantillas de requisitos para alquilar/comprar
- Copia rápida para enviar

✅ **Editor de Contratos Personalizado**
- Cada tenant puede personalizar su template de contrato
- Variables dinámicas (nombre, monto, fecha, etc.)
- Generación de PDF del contrato

✅ **Autorización de Ventas**
- Formulario de autorización de venta
- Generación de recibo de comisión
- Descarga en PDF

✅ **Seguimiento de Pagos**
- Registro de pagos mensuales (alquileres)
- Estado de cuenta: pendiente, pagado, atrasado
- Generación de recibos de pago
- Notificaciones de vencimiento

✅ **Actualización de Alquileres**
- Ajuste por IPC/inflación
- Cálculos automáticos de nuevos montos
- Historial de actualizaciones

### Características Adicionales por Nivel

#### 🌟 Professional y Superior

✅ **Estadísticas Avanzadas**
- Dashboard con métricas clave
- Propiedades más consultadas
- Tiempo promedio de cierre de operaciones
- Comisiones generadas por período
- Rendimiento por agente

✅ **Exportación de Datos**
- Excel/CSV de propiedades
- Excel/CSV de clientes
- Excel/CSV de contratos y pagos
- Reportes personalizados

#### 💼 Business y Enterprise

✅ **Integración Mercado Libre Inmuebles**
- Publicación automática de propiedades en ML
- Sincronización de estado en tiempo real
- Gestión de consultas desde ML
- Estadísticas de visualizaciones

✅ **Soporte Prioritario**
- Respuesta en 24hs
- Asistencia técnica dedicada
- Capacitación personalizada

#### 🏢 Solo Enterprise

✅ **Sin Límites**
- Propiedades ilimitadas
- Clientes ilimitados
- Usuarios ilimitados
- Almacenamiento ilimitado

---

## 🚀 Funcionalidades Pendientes de Desarrollo

### 🔗 Integración Mercado Libre Inmuebles

**Objetivo:** Publicar automáticamente propiedades en Mercado Libre Inmuebles desde InnoInmo.

**Funcionalidades Planificadas:**
- Sincronización automática de propiedades
- Actualización de estado en tiempo real
- Gestión de consultas desde ML
- Estadísticas de visualizaciones

**Disponibilidad:** Plan Professional y superior

---

## 📊 Modelo de Negocio

### Estrategia de Trial a Conversión

1. **Captación (Trial 7 días)**
   - Landing page con demo en vivo
   - Registro sin tarjeta
   - Onboarding guiado

2. **Activación**
   - Tutorial interactivo
   - Carga de primeras 3 propiedades
   - Generación de primer PDF/contrato

3. **Conversión (Día 5-6)**
   - Email recordatorio: "2 días restantes"
   - Destacar valor: "Ya gestionaste X propiedades"
   - Call to action: "Continúa sin límites"

4. **Retención**
   - Soporte proactivo
   - Actualizaciones constantes
   - Escucha de feedback

### Precios Sugeridos (ARS - Enero 2026)

Los precios están pensados para:
- Pequeñas inmobiliarias: **Starter** ($15.000/mes)
- Inmobiliarias medianas: **Professional** ($45.000/mes)
- Inmobiliarias grandes: **Business/Enterprise** ($75.000-$150.000/mes)

**Descuento Anual:** 17% off (1 mes gratis al pagar el año)

---

## 🎨 Límites por Recurso

### Propiedades
- **Trial:** 10
- **Starter:** 50
- **Basic:** 100
- **Professional:** 250
- **Business:** 500
- **Enterprise:** Ilimitado

### Clientes
- **Ratio:** 2 clientes por cada propiedad (promedio)
- Ejemplo: 100 propiedades = 200 clientes

### Usuarios (Agentes/Admins del Tenant)
- **Trial:** 1 usuario
- **Starter:** 2 usuarios
- **Basic:** 3 usuarios
- **Professional:** 5 usuarios
- **Business:** 10 usuarios
- **Enterprise:** Ilimitado

### Almacenamiento (Fotos de Propiedades)
- **Trial:** 1 GB
- **Starter:** 5 GB
- **Basic:** 10 GB
- **Professional:** 25 GB
- **Business:** 50 GB
- **Enterprise:** Ilimitado

---

## 🔐 Seguridad y Multi-Tenancy

- Cada inmobiliaria es un **tenant independiente**
- Datos completamente aislados
- Roles: `PLATFORM_ADMIN`, `SUPER_ADMIN` (tenant), `AGENT` (tenant)
- JWT authentication
- Middleware de tenancy en todas las rutas

---

## 📱 Acceso

- **Web:** React + Vite + Tailwind CSS
- **Mobile:** React Native (en desarrollo)
- **API:** REST + JWT

---

## 🎯 Propuesta de Implementación de Planes

### Plan Trial - Configuración Sugerida

```json
{
  "planId": "trial",
  "name": "Trial Gratuito",
  "description": "Prueba gratuita por 7 días con acceso completo",
  "priceMonthly": 0,
  "priceYearly": 0,
  "currency": "ARS",
  "features": {
    "maxProperties": 10,
    "maxClients": 20,
    "maxUsers": 1,
    "maxStorageGB": 1,
    "pdfPropiedades": true,
    "editorContratos": true,
    "whatsappTemplates": true,
    "seguimientoPagos": true,
    "actualizacionAlquileres": true,
    "autorizacionVentas": true,
    "estadisticas": false,
    "exportData": false,
    "mercadoLibreIntegration": false,
    "soportePrioritario": false
  },
  "trialDays": 7,
  "isActive": true,
  "isPopular": false,
  "sortOrder": 1
}
```

### Plan Starter - Configuración Sugerida

```json
{
  "planId": "starter",
  "name": "Starter",
  "description": "Ideal para inmobiliarias pequeñas que empiezan",
  "priceMonthly": 15000,
  "priceYearly": 150000,
  "currency": "ARS",
  "features": {
    "maxProperties": 50,
    "maxClients": 100,
    "maxUsers": 2,
    "maxStorageGB": 5,
    "pdfPropiedades": true,
    "editorContratos": true,
    "whatsappTemplates": true,
    "seguimientoPagos": true,
    "actualizacionAlquileres": true,
    "autorizacionVentas": true,
    "estadisticas": false,
    "exportData": false,
    "mercadoLibreIntegration": false,
    "soportePrioritario": false
  },
  "trialDays": 0,
  "isActive": true,
  "isPopular": false,
  "sortOrder": 2
}
```

### Plan Professional - Configuración Sugerida

```json
{
  "planId": "professional",
  "name": "Professional",
  "description": "Para inmobiliarias en crecimiento con múltiples agentes",
  "priceMonthly": 45000,
  "priceYearly": 450000,
  "currency": "ARS",
  "features": {
    "maxProperties": 250,
    "maxClients": 500,
    "maxUsers": 5,
    "maxStorageGB": 25,
    "pdfPropiedades": true,
    "editorContratos": true,
    "whatsappTemplates": true,
    "seguimientoPagos": true,
    "actualizacionAlquileres": true,
    "autorizacionVentas": true,
    "estadisticas": true,
    "exportData": true,
    "mercadoLibreIntegration": false,
    "soportePrioritario": false
  },
  "trialDays": 0,
  "isActive": true,
  "isPopular": true,
  "sortOrder": 3
}
```

### Plan Enterprise - Configuración Sugerida

```json
{
  "planId": "enterprise",
  "name": "Enterprise",
  "description": "Sin límites para grandes inmobiliarias",
  "priceMonthly": 150000,
  "priceYearly": 1500000,
  "currency": "ARS",
  "features": {
    "maxProperties": 999999,
    "maxClients": 999999,
    "maxUsers": 999999,
    "maxStorageGB": 999999,
    "pdfPropiedades": true,
    "editorContratos": true,
    "whatsappTemplates": true,
    "seguimientoPagos": true,
    "actualizacionAlquileres": true,
    "autorizacionVentas": true,
    "estadisticas": true,
    "exportData": true,
    "mercadoLibreIntegration": true,
    "soportePrioritario": true
  },
  "trialDays": 0,
  "isActive": true,
  "isPopular": false,
  "sortOrder": 6
}
```

---

## 📈 Validaciones en el Sistema

El backend debe validar en cada operación:

### Al crear una propiedad:
```javascript
if (tenant.currentProperties >= tenant.plan.features.maxProperties) {
  throw new Error('Has alcanzado el límite de propiedades de tu plan');
}
```

### Al crear un cliente:
```javascript
if (tenant.currentClients >= tenant.plan.features.maxClients) {
  throw new Error('Has alcanzado el límite de clientes de tu plan');
}
```

### Al crear un usuario:
```javascript
if (tenant.currentUsers >= tenant.plan.features.maxUsers) {
  throw new Error('Has alcanzado el límite de usuarios de tu plan');
}
```

### Al subir fotos:
```javascript
if (tenant.currentStorageGB >= tenant.plan.features.maxStorageGB) {
  throw new Error('Has alcanzado el límite de almacenamiento de tu plan');
}
```

---

## 🎉 Ventajas del Modelo por Propiedades

1. **Escalabilidad clara:** El cliente sabe exactamente cuánto pagar según su volumen
2. **Fácil de entender:** "Tengo 80 propiedades → necesito el plan Basic"
3. **Upselling natural:** A medida que crecen, necesitan más propiedades
4. **Trial efectivo:** 10 propiedades es suficiente para probar el sistema realmente
5. **No penaliza pequeñas inmobiliarias:** Starter a $15.000 es accesible

---

## 🚦 Próximos Pasos

1. ✅ Crear los 6 planes en la base de datos usando Platform Admin
2. ✅ Implementar validaciones de límites en el backend
3. ✅ Mostrar plan actual y uso en el dashboard del tenant
4. ✅ Agregar página de "Upgrade Plan" cuando alcanzan límites
5. ✅ Implementar sistema de facturación/suscripción
6. ⏳ Integración con Mercado Pago para pagos recurrentes
7. ⏳ Integración con Mercado Libre Inmuebles (solo Professional+)

---

## 📞 Contacto y Soporte

**Platform Admin Dashboard:** `/platform-admin/dashboard`
- Gestión de tenants
- Gestión de planes
- Métricas globales
- Suscripciones activas

---

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Autor:** InnoInmo Development Team
