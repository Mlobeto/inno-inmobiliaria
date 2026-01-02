# Redux Platform Admin - Guía de Uso

## 📚 Stack Tecnológico

- **Redux Toolkit** - Forma moderna de usar Redux
- **RTK Query** - Manejo automático de peticiones HTTP, cache y sincronización
- **JavaScript** - Sin TypeScript para mayor familiaridad

## 🎯 ¿Qué es RTK Query?

RTK Query es la solución oficial de Redux para manejo de datos. **Reemplaza completamente**:
- ❌ `fetch` manual
- ❌ `axios` 
- ❌ Manejo manual de `loading`, `error`, `success`
- ❌ Cache manual
- ❌ Refetch manual

### Ventajas:

✅ **Hooks automáticos** - `useGetDashboardQuery()` hace todo por ti
✅ **Cache inteligente** - No repite llamadas innecesarias
✅ **Sincronización automática** - Actualiza datos cuando cambian
✅ **Loading states** - `isLoading`, `isFetching`, `isError` automáticos
✅ **Optimistic updates** - UI se actualiza antes de la respuesta del servidor
✅ **Invalidación de tags** - Actualiza datos relacionados automáticamente

---

## 📁 Estructura de Archivos

```
front/src/redux/
├── api/
│   ├── baseApi.js                 # Configuración base RTK Query
│   └── platformAdminApi.js        # Endpoints de Platform Admin
├── slices/
│   └── platformAdminSlice.js      # Estado local (filtros, UI)
├── platformAdmin.js               # Exports centralizados
└── Store/
    └── store.js                   # Store configurado
```

---

## 🚀 Cómo Usar en Componentes

### 1. Queries (GET) - Obtener datos

```jsx
import { useGetDashboardQuery } from '../../redux/platformAdmin';

function Dashboard() {
  // RTK Query hace el fetch automáticamente
  const { data, isLoading, isError, error, refetch } = useGetDashboardQuery();
  
  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Total Tenants: {data.data.tenants.total}</p>
      <button onClick={refetch}>Actualizar</button>
    </div>
  );
}
```

**Características:**
- ✅ Hace fetch automáticamente al montar el componente
- ✅ Cachea los datos (no repite llamadas)
- ✅ Se actualiza cuando hay cambios
- ✅ Puedes forzar refetch con `refetch()`

### 2. Queries con Parámetros

```jsx
import { useListTenantsQuery } from '../../redux/platformAdmin';
import { useSelector } from 'react-redux';
import { selectTenantsFilters } from '../../redux/platformAdmin';

function TenantsList() {
  // Obtener filtros del estado
  const filters = useSelector(selectTenantsFilters);
  
  // RTK Query construye la URL automáticamente:
  // GET /platform-admin/tenants?page=1&limit=20&search=inmobiliaria
  const { data, isLoading } = useListTenantsQuery(filters);
  
  if (isLoading) return <div>Cargando...</div>;
  
  return (
    <div>
      {data.data.tenants.map(tenant => (
        <div key={tenant.tenantId}>{tenant.businessName}</div>
      ))}
    </div>
  );
}
```

### 3. Mutations (POST/PUT/DELETE) - Modificar datos

```jsx
import { useSuspendTenantMutation } from '../../redux/platformAdmin';

function SuspendButton({ tenantId }) {
  // Mutación devuelve [función, estado]
  const [suspendTenant, { isLoading, isSuccess, isError }] = useSuspendTenantMutation();
  
  const handleSuspend = async () => {
    try {
      // Ejecutar la mutación
      await suspendTenant({
        tenantId,
        reason: 'Falta de pago'
      }).unwrap(); // unwrap() para manejar errores con try/catch
      
      alert('✅ Tenant suspendido!');
    } catch (error) {
      alert('❌ Error: ' + error.data.message);
    }
  };
  
  return (
    <button onClick={handleSuspend} disabled={isLoading}>
      {isLoading ? 'Suspendiendo...' : 'Suspender'}
    </button>
  );
}
```

### 4. Manejo de Estado Local (Filtros, UI)

```jsx
import { useDispatch, useSelector } from 'react-redux';
import { 
  setTenantsSearch, 
  selectTenantsFilters 
} from '../../redux/platformAdmin';

function SearchBar() {
  const dispatch = useDispatch();
  const filters = useSelector(selectTenantsFilters);
  
  const handleSearch = (e) => {
    dispatch(setTenantsSearch(e.target.value));
    // Esto automáticamente triggerea un nuevo fetch con los nuevos filtros
  };
  
  return (
    <input
      type="text"
      value={filters.search}
      onChange={handleSearch}
      placeholder="Buscar tenant..."
    />
  );
}
```

---

## 📋 Endpoints Disponibles

### Dashboard y Métricas

| Hook | Método | URL | Descripción |
|------|--------|-----|-------------|
| `useGetDashboardQuery()` | GET | `/platform-admin/dashboard` | Métricas generales |
| `useGetMetricsQuery()` | GET | `/platform-admin/metrics` | Growth, engagement, retention |
| `useGetRevenueQuery(params)` | GET | `/platform-admin/revenue` | MRR, ARR, ingresos |

**Ejemplo:**
```jsx
const { data } = useGetRevenueQuery({ period: 'month' });
```

### Gestión de Tenants

| Hook | Método | Descripción |
|------|--------|-------------|
| `useListTenantsQuery(filters)` | GET | Lista de tenants con paginación |
| `useGetTenantDetailQuery(id)` | GET | Detalle de un tenant |
| `useUpdateTenantMutation()` | PUT | Actualizar tenant |
| `useSuspendTenantMutation()` | POST | Suspender tenant |
| `useActivateTenantMutation()` | POST | Reactivar tenant |

### Suscripciones

| Hook | Método | Descripción |
|------|--------|-------------|
| `useListSubscriptionsQuery(filters)` | GET | Lista global de suscripciones |

---

## 🔄 Cache e Invalidación

RTK Query usa un sistema de **tags** para saber qué datos actualizar:

```javascript
// Cuando suspendes un tenant:
useSuspendTenantMutation()
  // Invalida estos tags automáticamente:
  ✅ ['Tenants', id: tenantId]  -> Refetch detalle del tenant
  ✅ ['Tenants', id: 'LIST']    -> Refetch lista de tenants
  ✅ ['Dashboard']              -> Refetch dashboard
  ✅ ['Metrics']                -> Refetch métricas
```

**Resultado:** Todos los componentes que usan esos datos se actualizan automáticamente! 🎉

---

## 🎨 Patrones Comunes

### Paginación

```jsx
function TenantsList() {
  const dispatch = useDispatch();
  const filters = useSelector(selectTenantsFilters);
  const { data } = useListTenantsQuery(filters);
  
  const handlePageChange = (newPage) => {
    dispatch(setTenantsPage(newPage));
    // RTK Query automáticamente hace el fetch con la nueva página
  };
  
  return (
    <>
      {/* Lista de tenants */}
      <Pagination 
        currentPage={filters.page}
        totalPages={data.data.pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
}
```

### Búsqueda con Debounce

```jsx
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setTenantsSearch } from '../../redux/platformAdmin';

function SearchBar() {
  const dispatch = useDispatch();
  const [localSearch, setLocalSearch] = useState('');
  
  // Debounce: espera 500ms después de que el usuario deja de escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setTenantsSearch(localSearch));
    }, 500);
    
    return () => clearTimeout(timer);
  }, [localSearch, dispatch]);
  
  return (
    <input
      type="text"
      value={localSearch}
      onChange={(e) => setLocalSearch(e.target.value)}
      placeholder="Buscar..."
    />
  );
}
```

### Refetch Manual

```jsx
function RefreshButton() {
  const { refetch } = useGetDashboardQuery();
  
  return (
    <button onClick={refetch}>
      🔄 Actualizar
    </button>
  );
}
```

### Polling (Actualización Automática)

```jsx
// Actualiza cada 30 segundos automáticamente
const { data } = useGetDashboardQuery(undefined, {
  pollingInterval: 30000, // 30 segundos
});
```

---

## 🎯 Comparación: Antes vs Después

### ❌ Antes (fetch manual)

```jsx
function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/platform-admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;
  
  return <div>{data.tenants.total}</div>;
}
```

### ✅ Después (RTK Query)

```jsx
function Dashboard() {
  const { data, isLoading, isError } = useGetDashboardQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error!</div>;
  
  return <div>{data.data.tenants.total}</div>;
}
```

**Menos código, más potencia!** 🚀

---

## 📖 Recursos

- [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- Ver ejemplos en: `front/src/Admin/PlatformAdmin/`

---

## 🐛 Troubleshooting

### Error: "useGetDashboardQuery is not a function"

Asegúrate de haber configurado el store correctamente en `store.js`:

```javascript
reducer: {
  [baseApi.reducerPath]: baseApi.reducer,
  platformAdmin: platformAdminReducer,
},
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware().concat(baseApi.middleware),
```

### Los datos no se actualizan

Verifica que las mutaciones estén invalidando los tags correctos:

```javascript
invalidatesTags: ['Dashboard', 'Tenants']
```

### Token no se envía

Verifica el `prepareHeaders` en `baseApi.js`:

```javascript
prepareHeaders: (headers, { getState }) => {
  const token = getState().auth?.token; // Ajusta según tu estado
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  return headers;
}
```
