# 🏢 InnoInmobiliaria - SaaS Multi-Tenant

**Plataforma de gestión inmobiliaria multi-tenant con apps nativas iOS/Android y web**

## 🎯 Visión del Proyecto

InnoInmobiliaria es una solución SaaS completa que permite a múltiples inmobiliarias gestionar sus operaciones desde una única plataforma, con presencia en:
- 📱 **iOS** (App Store)
- 🤖 **Android** (Google Play)  
- 🌐 **Web** (Navegadores)

### Estado Actual: v1.0 (Single-Tenant)
- ✅ Gestión de propiedades (alquiler/venta)
- ✅ Gestión de clientes y contratos
- ✅ Sistema de pagos y recibos
- ✅ Generación de contratos PDF
- ✅ Autenticación básica
- ✅ Dashboard de estadísticas

### Roadmap: v2.0 (Multi-Tenant SaaS) 🚀
Transformación en curso a arquitectura multi-tenant con:
- 🏗️ Subdominios por cliente (`cliente.inno.app`)
- 👥 Sistema de roles (Owner, Agent, Super Admin)
- 💰 Planes modulares con add-ons
- 📱 Apps nativas con Expo React Native
- 🏠 Landing pages públicas por tenant
- 🤝 Integración con Mercado Libre Inmuebles
- 📊 Sistema de leads y CRM
- 💳 Suscripciones con MercadoPago

## 📐 Arquitectura Técnica

### Backend
```
Node.js 18+ | Express 4.x | PostgreSQL 14+
├── API REST autenticada (JWT)
├── Multi-tenancy: tenant_id en todas las tablas
├── Middleware de tenant isolation (subdominios)
└── Migraciones con Sequelize
```

### Frontend/Mobile
```
Expo React Native (SDK 51+) | React 18+ | Redux Toolkit
├── iOS (EAS Build)
├── Android (EAS Build)
├── Web (Expo Web)
├── NativeWind (Tailwind CSS)
└── Navegación: React Navigation
```

### Infraestructura
```
Hosting: Render (Backend) | Vercel (Landing Web)
DB: PostgreSQL con conexión pooling
Storage: Cloudinary (imágenes/PDFs)
Emails: Nodemailer + SMTP
Subdominios: Wildcard DNS (*.inno.app)
```

## 🏗️ Estructura del Proyecto

```
inno-inmobiliaria/
├── back/                      # API Backend (Node.js + Express)
│   ├── src/
│   │   ├── models/           # Modelos Sequelize (con tenantId)
│   │   ├── controllers/      # Lógica de negocio
│   │   ├── middlewares/      # Auth, tenant isolation, RBAC
│   │   ├── routes/           # Endpoints API
│   │   └── config/           # Configuración DB, JWT, etc.
│   ├── migrations/           # Migraciones de BD
│   └── index.js              # Entry point
│
├── mobile/                    # App Expo (iOS/Android/Web) - A CREAR
│   ├── app/                  # Expo Router (file-based routing)
│   ├── components/           # Componentes reutilizables
│   ├── screens/              # Pantallas de la app
│   ├── services/             # API calls, auth
│   ├── store/                # Redux store
│   └── app.json              # Configuración Expo
│
├── landing/                   # Landing pública (opcional) - A CREAR
│   ├── src/
│   │   ├── pages/            # Páginas por tenant
│   │   ├── components/       # Componentes landing
│   │   └── api/              # API routes (leads)
│   └── public/
│
└── docs/                      # Documentación del proyecto
    ├── ARCHITECTURE.md        # Decisiones de arquitectura
    ├── API.md                 # Documentación de endpoints
    └── DEPLOYMENT.md          # Guía de deploy
```

## 💼 Modelo de Negocio - Planes

### 🎯 Plan BASE - "Gestión Esencial"
**$XX/mes - Facturación anual: $XX/año (2 meses gratis)**

✅ Incluye:
- Gestión completa de propiedades (alquiler/venta)
- Gestión de clientes y contratos
- Generación de contratos PDF personalizables
- Sistema de pagos y recibos
- Dashboard de estadísticas básicas
- 2 usuarios (1 Owner + 1 Agente)
- Hasta 50 propiedades activas
- Soporte por email (48hs)

❌ No incluye:
- Landing page pública
- Integración Mercado Libre
- Usuarios adicionales

---

### 🌟 ADD-ONS (Módulos Opcionales)

#### 🏠 **Landing Page Pro**
**+$X/mes**
- Sitio web público con tus propiedades
- SEO optimizado para Google
- Formularios de contacto
- Integración con tu dominio personalizado
- Sistema de leads automático
- Estadísticas de visitas

#### 🛒 **Mercado Libre Inmuebles**
**+$X/mes**
- Publicación automática en ML
- Sincronización bidireccional de propiedades
- Importación de leads de ML
- Gestión centralizada de publicaciones
- Respuestas automáticas a consultas

#### 👥 **Agentes Adicionales**
**+$X/usuario/mes**
- Agentes adicionales con acceso limitado
- Asignación de propiedades por agente
- Métricas individuales
- Control de permisos

---

### 🚀 Plan ENTERPRISE
**Precio bajo consulta**

Todo lo anterior +
- Usuarios ilimitados
- Propiedades ilimitadas
- API REST para integraciones custom
- Soporte prioritario 24/7
- Onboarding personalizado
- Capacitación del equipo

## 🔐 Sistema de Roles

| Rol | Permisos |
|-----|----------|
| **SUPER_ADMIN** | Acceso global, gestión de tenants, planes, facturación |
| **OWNER** | Acceso total al tenant, balance financiero, configuración, usuarios |
| **AGENT** | Propiedades, clientes, contratos, leads. **SIN acceso a balance** |

## 🚀 Tecnologías Clave

**Backend:**
- Node.js, Express, Sequelize ORM
- PostgreSQL (multi-tenant con tenant_id)
- JWT para autenticación
- Bcrypt para passwords
- Cloudinary para storage

**Mobile (Expo):**
- React Native con Expo SDK 51+
- Expo Router (file-based navigation)
- Redux Toolkit para estado global
- NativeWind (Tailwind CSS para RN)
- EAS Build para compilación iOS/Android

**DevOps:**
- GitHub Actions (CI/CD)
- EAS Build (apps nativas)
- Render (backend API)
- Vercel (landing web opcional)
- Sentry (monitoreo de errores)

## 📱 Instalación y Desarrollo

### Prerrequisitos
```bash
Node.js >= 18.x
PostgreSQL >= 14.x
npm o yarn
Expo CLI: npm install -g expo-cli
EAS CLI: npm install -g eas-cli
```

### Backend
```bash
cd back
npm install
cp .env.example .env  # Configurar variables
npm run dev           # Desarrollo en puerto 3001
```

### Frontend (Actual - Web)
```bash
cd "QL Front"
npm install
npm run dev           # Vite dev server
```

### Mobile (A desarrollar)
```bash
cd mobile
npm install
npx expo start        # Inicia Metro bundler

# Para desarrollo:
- Presiona 'i' para iOS Simulator
- Presiona 'a' para Android Emulator  
- Escanea QR con Expo Go (físico)
```

## 🗄️ Base de Datos

### Esquema Multi-Tenant
Todas las tablas incluyen:
```sql
tenant_id UUID NOT NULL REFERENCES tenants(id)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
deleted_at TIMESTAMP NULL  -- Soft delete
```

### Modelos Principales
- **Tenant** - Organización/Inmobiliaria
- **User** - Usuarios con roles (Owner/Agent)
- **Property** - Propiedades (con tenant_id)
- **Client** - Clientes (con tenant_id)
- **Lease** - Contratos de alquiler
- **SaleContract** - Contratos de venta
- **PaymentReceipt** - Recibos de pago
- **Lead** - Leads desde landing/ML
- **Subscription** - Suscripciones y add-ons

## 📚 Documentación

- [Arquitectura Multi-Tenant](docs/ARCHITECTURE.md) - Decisiones técnicas
- [API Reference](docs/API.md) - Endpoints documentados
- [Deployment Guide](docs/DEPLOYMENT.md) - Deploy paso a paso
- [Migration Plan](docs/MIGRATION_V1_TO_V2.md) - De single a multi-tenant

## 🤝 Contribución

Este es un proyecto privado. Para contribuir:
1. Crea una rama desde `develop`
2. Nombra tu rama: `feature/nombre`, `fix/bug-name`
3. Haz commits descriptivos
4. Abre PR hacia `develop`
5. Espera code review

## 📄 Licencia

Propietario: [Tu Nombre/Empresa]  
Todos los derechos reservados.

## 🆘 Soporte

- Email: soporte@inno.app
- Documentación: https://docs.inno.app
- Status: https://status.inno.app

---

**Versión:** 2.0.0-alpha  
**Última actualización:** Diciembre 2025  
**Estado:** 🚧 En desarrollo activo (migración a multi-tenant)
