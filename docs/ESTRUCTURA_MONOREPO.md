# 📁 Estructura de Monorepo - InnoInmobiliaria

## Arquitectura Multi-Proyecto

```
inno-inmobiliaria/
├── 📦 shared/              ✨ NUEVO - Código compartido
│   └── Redux Toolkit + API + Utils
│
├── 🌐 web/                 🔄 (antes "QL Front")
│   └── React + Vite + Tailwind
│       Diseño UI actual (SIN cambios)
│
├── 📱 mobile/              ✨ TODO - Expo React Native
│   └── iOS + Android + Web
│       UI adaptada para mobile
│
└── 🔙 back/               ✅ Actual (sin cambios)
    └── Node.js + Express + PostgreSQL
```

## 🎯 Ventajas de la Estructura

### ✅ shared/
**Código único compartido entre web y mobile:**
- Redux Toolkit (slices modernos)
- API services (axios configurado)
- TypeScript types
- Business logic
- Utilidades (validaciones, formatos)

### 🌐 web/
**Tu aplicación actual funcionando:**
- ✅ Diseño UI respetado al 100%
- ✅ Componentes actuales intactos
- ✅ Solo cambia la capa de Redux
- ✅ Mantiene react-toastify, SweetAlert2, etc.

### 📱 mobile/ (futuro)
**Apps nativas con Expo:**
- Usa el mismo Redux de shared/
- Usa los mismos API services
- UI adaptada con React Native
- Compilación iOS/Android

## 🔄 Migración Gradual

### Fase Actual: Reestructuración
```
1. ✅ Crear shared/ con Redux Toolkit moderno
2. ⏳ Renombrar "QL Front" → "web"
3. ⏳ Actualizar web para usar shared
4. ⏳ Migrar componentes uno por uno
5. ⏳ Limpiar Redux viejo
```

### Próxima Fase: Mobile
```
1. Crear mobile/ con Expo
2. Reutilizar shared/ (Redux + API)
3. Adaptar UI para mobile
4. Compilar para iOS/Android
```

## 📦 Dependencias

### shared/
```json
{
  "@reduxjs/toolkit": "^2.2.7",
  "axios": "^1.7.7",
  "react-redux": "^9.1.2"
}
```

### web/
```json
{
  "@inno/shared": "file:../shared",  // ← Link local
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "tailwindcss": "^3.4.13"
  // ... todas las deps actuales de UI
}
```

### mobile/ (futuro)
```json
{
  "@inno/shared": "file:../shared",  // ← Mismo shared
  "expo": "~51.0.0",
  "react-native": "0.74.0",
  "nativewind": "^4.0.0"
}
```

## 🚀 Comandos de Desarrollo

### Trabajar en shared/
```bash
cd shared
npm run build      # Compilar TypeScript
npm run watch      # Compilar en modo watch
```

### Trabajar en web/
```bash
cd web
npm install        # Instala y linkea shared/
npm run dev        # Vite dev server (puerto 5173)
```

### Trabajar en mobile/ (futuro)
```bash
cd mobile
npm install
npx expo start     # Metro bundler
# Presiona 'i' para iOS
# Presiona 'a' para Android
```

### Trabajar en back/
```bash
cd back
npm run dev        # Nodemon (puerto 3001)
```

## 📊 Comparación: Redux Viejo vs Nuevo

### Antes (Redux clásico en QL Front)
```javascript
// Actions con tipos manuales
export const getAllClients = () => async (dispatch) => {
  dispatch({ type: GET_ALL_CLIENT_REQUEST });
  try {
    const res = await axios.get('/client');
    dispatch({ type: GET_ALL_CLIENT_SUCCESS, payload: res.data });
  } catch (err) {
    dispatch({ type: GET_ALL_CLIENT_FAIL, payload: err.message });
  }
};

// Uso en componente
const clients = useSelector(state => state.allClients);
dispatch(getAllClients());
```

### Después (Redux Toolkit en shared/)
```typescript
// Slice con async thunks automáticos
export const fetchAllClients = createAsyncThunk(
  'clients/fetchAll',
  async () => {
    const response = await clientService.getAllClients();
    return response.data;
  }
);

// Uso en componente (tipado)
const { clients, isLoading } = useAppSelector(state => state.clients);
dispatch(fetchAllClients());
```

## 🎨 UI/UX: Sin Cambios

### Lo que SE MANTIENE exactamente igual:
- ✅ Todo el JSX de componentes
- ✅ Clases de Tailwind CSS
- ✅ Estructura de carpetas Components/
- ✅ React Router rutas
- ✅ TinyMCE editor
- ✅ SweetAlert2 modals
- ✅ React Toastify notificaciones
- ✅ Lógica de negocio en componentes
- ✅ Validaciones de formularios

### Lo ÚNICO que cambia:
- 🔄 Imports de Redux
- 🔄 Nombres de acciones (más semánticos)
- 🔄 Estructura de estado (más organizada)

## 📖 Documentación

- [ARCHITECTURE.md](ARCHITECTURE.md) - Decisiones técnicas completas
- [MIGRATION_PLAN.md](MIGRATION_PLAN.md) - Plan de migración a multi-tenant
- [MIGRACION_WEB_A_SHARED.md](MIGRACION_WEB_A_SHARED.md) - Guía paso a paso

## 🔗 Flujo de Datos

```
┌─────────────────────────────────────────┐
│  WEB (React)           MOBILE (Expo)    │
│    ↓                      ↓              │
│  useAppDispatch()     useAppDispatch()  │
│    ↓                      ↓              │
└────────────┬────────────┬────────────────┘
             │            │
             ↓            ↓
      ┌─────────────────────────┐
      │   shared/store/         │
      │   Redux Toolkit         │
      │   - authSlice           │
      │   - clientsSlice        │
      │   - propertiesSlice     │
      └──────────┬──────────────┘
                 ↓
      ┌─────────────────────────┐
      │   shared/api/           │
      │   Axios + Interceptors  │
      │   - authService         │
      │   - clientService       │
      │   - propertyService     │
      └──────────┬──────────────┘
                 ↓
      ┌─────────────────────────┐
      │   back/                 │
      │   Express API           │
      │   PostgreSQL            │
      └─────────────────────────┘
```

## ⚡ Performance

### Beneficios:
- **DRY**: No duplicar código entre web y mobile
- **Type-safe**: TypeScript en shared previene errores
- **Bundle size**: Web solo importa lo que usa
- **Cacheable**: Redux persiste bien en ambas plataformas
- **Testeable**: Lógica compartida = tests compartidos

### Optimizaciones:
- Redux Toolkit usa Immer (mutaciones seguras)
- API client con interceptors (no repetir auth)
- Middleware de toast (UX consistente)
- Lazy loading de slices (futuro)

## 🛠️ Próximos Pasos

1. ⏳ **Renombrar** "QL Front" → "web"
2. ⏳ **Migrar componentes** de web a usar shared
3. ⏳ **Crear** carpeta mobile/ con Expo
4. ⏳ **Reutilizar** shared en mobile
5. ⏳ **Implementar** multi-tenancy en backend
6. ⏳ **Agregar** sistema de roles (OWNER/AGENT)

---

**Estado actual:** ✅ shared/ creado y funcional  
**Próximo paso:** Renombrar web/ y migrar Login component  
**Última actualización:** Diciembre 29, 2025
