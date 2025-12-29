# 🔄 Guía de Migración: QL Front → Web (con shared/)

## Objetivo
Migrar el frontend actual a la nueva estructura de monorepo, usando Redux Toolkit moderno desde `shared/` mientras **mantienes el diseño UI intacto**.

## 📋 Pasos de Migración

### 1️⃣ Preparación (NO rompe nada)

```bash
# Desde la raíz del proyecto
cd shared
npm install

# Construir shared por primera vez
npm run build
```

### 2️⃣ Renombrar carpeta

```bash
# Desde raíz
mv "QL Front" web

# O en Windows:
# Cambiar nombre manualmente en el explorador
```

### 3️⃣ Actualizar package.json de web

```json
{
  "name": "inno-web",
  "dependencies": {
    "@inno/shared": "file:../shared",  // ✨ NUEVO - Link al código compartido
    
    // Mantener todas las dependencias actuales de UI:
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "@tinymce/tinymce-react": "^6.3.0",
    "sweetalert2": "^11.15.3",
    "react-toastify": "^11.0.5",
    // ... todas las demás
    
    // ❌ REMOVER (ahora vienen de shared):
    // "@reduxjs/toolkit": "^2.2.7",  
    // "react-redux": "^9.1.2",
    // "axios": "^1.7.7"
  }
}
```

### 4️⃣ Migrar Redux (Paso a Paso)

#### A. Crear nuevo store en web que use shared

Crear: `web/src/store/index.ts` (NUEVO archivo)

```typescript
// ✨ NUEVO - Store que importa desde shared
import { store } from '@inno/shared';

export { store };
export type { RootState, AppDispatch } from '@inno/shared';
export { useAppDispatch, useAppSelector } from '@inno/shared';
```

#### B. Actualizar main.jsx

```jsx
// ANTES (web/src/main.jsx)
import { store } from './redux/Store/store';

// DESPUÉS
import { store } from './store'; // ✅ Ahora importa desde shared
```

#### C. Actualizar componentes (GRADUALMENTE)

**Antes (viejo Redux):**
```jsx
// web/src/Components/Clientes/Clientes.jsx
import { useDispatch, useSelector } from 'react-redux';
import { getAllClients } from '../../redux/Actions/actions';

function Clientes() {
  const dispatch = useDispatch();
  const clients = useSelector((state) => state.allClients);
  
  useEffect(() => {
    dispatch(getAllClients());
  }, []);
  
  return <div>{/* UI intacta */}</div>;
}
```

**Después (Redux Toolkit desde shared):**
```jsx
// web/src/Components/Clientes/Clientes.jsx
import { useAppDispatch, useAppSelector, fetchAllClients } from '@inno/shared';

function Clientes() {
  const dispatch = useAppDispatch();
  const { clients, isLoading } = useAppSelector((state) => state.clients);
  
  useEffect(() => {
    dispatch(fetchAllClients());
  }, []);
  
  // ✅ UI permanece EXACTAMENTE IGUAL
  return <div>{/* UI intacta */}</div>;
}
```

### 5️⃣ Mapeo de Estado (Viejo → Nuevo)

| Viejo Redux (reducer.js) | Nuevo Redux Toolkit (shared) |
|---------------------------|-------------------------------|
| `state.allClients` | `state.clients.clients` |
| `state.allProperties` | `state.properties.properties` |
| `state.currentClient` | `state.clients.currentClient` |
| `state.currentProperty` | `state.properties.currentProperty` |
| `state.user` (auth) | `state.auth.user` |
| `state.token` | `state.auth.token` |
| `state.isLoading` | `state.clients.isLoading` (por slice) |

### 6️⃣ Implementar Toast en web

```typescript
// web/src/utils/toastHelper.ts
import { toast } from 'react-toastify';

export const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
  toast[type](message, {
    position: 'top-right',
    autoClose: 3000,
  });
};
```

Luego sobrescribir en shared:
```typescript
// shared/src/utils/toastHelper.ts
// Esta es la implementación por defecto (console.log)
// En web se sobrescribe importando desde web/src/utils
```

### 7️⃣ Migración Gradual por Componente

**Estrategia: Migra UN componente a la vez**

1. ✅ **Empieza con Login** (más simple)
2. ✅ Luego **Clientes** (CRUD básico)
3. ✅ Luego **Propiedades** (con imágenes)
4. ✅ Finalmente **Contratos, Pagos, etc.**

Para cada componente:
- Cambia imports de Redux
- Cambia nombres de estado (`state.allClients` → `state.clients.clients`)
- Cambia actions (`getAllClients()` → `fetchAllClients()`)
- **NO TOQUES el JSX/UI** (mantén diseño actual)

### 8️⃣ Limpiar código viejo (SOLO al final)

Una vez que TODO funcione con shared:
```bash
# Borrar Redux viejo (CUIDADO, hacer backup antes)
rm -rf web/src/redux
```

## 🎨 Mantener el Diseño Actual

**✅ LO QUE MANTIENES INTACTO:**
- Todo el JSX de tus componentes
- Tailwind CSS y estilos
- Componentes de UI (Admin, Clientes, Propiedades, etc.)
- Lógica de negocio en componentes
- React Router rutas
- TinyMCE, SweetAlert2, Toastify, etc.

**🔄 LO QUE CAMBIAS:**
- Imports de Redux (`from './redux/...'` → `from '@inno/shared'`)
- Nombres de acciones (actions → thunks tipados)
- Acceso al estado (cambia la estructura)

## 🧪 Testing de Migración

```bash
# 1. Instalar dependencias en shared
cd shared && npm install && cd ..

# 2. Instalar dependencias en web (con link a shared)
cd web && npm install && cd ..

# 3. Levantar backend
cd back && npm run dev

# 4. Levantar frontend web
cd web && npm run dev

# 5. Probar funcionalidades:
# - Login ✅
# - Crear cliente ✅
# - Crear propiedad ✅
# - Ver listados ✅
```

## 🚨 Troubleshooting

### Error: Cannot find module '@inno/shared'
```bash
cd web
npm install  # Reinstala dependencias con el link
```

### Tipos TypeScript no funcionan
```bash
cd shared
npm run build  # Recompila tipos
```

### Estado undefined
Revisa el mapeo de estado viejo → nuevo. Ejemplo:
```javascript
// ❌ Viejo
const clients = useSelector(state => state.allClients);

// ✅ Nuevo
const { clients } = useAppSelector(state => state.clients);
```

## 📅 Timeline Estimado

- **Día 1**: Setup shared/, renombrar a web/, actualizar package.json
- **Día 2**: Migrar Login y Auth
- **Día 3**: Migrar Clientes
- **Día 4**: Migrar Propiedades
- **Día 5**: Migrar Contratos y Pagos
- **Día 6**: Testing completo
- **Día 7**: Limpiar código viejo

## ✅ Checklist de Migración

- [ ] Crear carpeta shared/ con código
- [ ] Renombrar "QL Front" → "web"
- [ ] Actualizar web/package.json con link a shared
- [ ] npm install en shared y web
- [ ] Migrar Login component
- [ ] Migrar Clientes component
- [ ] Migrar Propiedades component
- [ ] Migrar Contratos component
- [ ] Migrar Pagos component
- [ ] Migrar Garantores component
- [ ] Testing completo de funcionalidades
- [ ] Borrar web/src/redux viejo
- [ ] Commit en Git

---

**Última actualización:** Diciembre 29, 2025
