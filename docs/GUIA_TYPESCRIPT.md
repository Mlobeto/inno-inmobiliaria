# 📘 Guía de Migración a TypeScript (Gradual)

## ¿Por qué TypeScript?

**Beneficios:**
- ✅ Detección de errores antes de ejecutar
- ✅ Autocompletado inteligente en VS Code
- ✅ Refactoring más seguro
- ✅ Documentación automática (tipos como docs)
- ✅ Menos bugs en producción

**NO es necesario reescribir todo de una vez** - Puedes migrar archivo por archivo.

---

## 🎯 Estrategia de Migración Gradual

### Fase 1: Configurar TypeScript (Sin cambiar nada)

```bash
cd "QL Front"  # o web/ si ya renombraste

# Instalar TypeScript
npm install --save-dev typescript @types/react @types/react-dom

# Crear tsconfig.json
npx tsc --init
```

**tsconfig.json recomendado:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    
    "allowJs": true,           // ✅ Permite .js y .jsx (importante!)
    "checkJs": false,          // ❌ No chequea archivos JS (por ahora)
    
    "strict": true,            // Modo estricto (recomendado)
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]       // Alias para imports
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Fase 2: Migrar UN archivo a la vez

**Orden recomendado:**
1. ✅ Utilidades simples (`src/utils/`)
2. ✅ Tipos y constantes
3. ✅ Redux actions/reducers (ya hecho en shared/)
4. ✅ Componentes simples sin lógica
5. ✅ Componentes complejos

**Ejemplo: Migrar un componente simple**

**ANTES (JavaScript):**
```jsx
// src/Components/Clientes/ClientCard.jsx
import React from 'react';

const ClientCard = ({ client, onEdit, onDelete }) => {
  return (
    <div className="border rounded p-4">
      <h3>{client.name}</h3>
      <p>{client.email}</p>
      <button onClick={() => onEdit(client.idClient)}>Editar</button>
      <button onClick={() => onDelete(client.idClient)}>Eliminar</button>
    </div>
  );
};

export default ClientCard;
```

**DESPUÉS (TypeScript):**
```tsx
// src/Components/Clientes/ClientCard.tsx
import React from 'react';

// 1. Definir tipos
interface Client {
  idClient: number;
  name: string;
  email: string;
  phone?: string; // Opcional con ?
}

// 2. Tipear props
interface ClientCardProps {
  client: Client;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

// 3. Usar tipos en el componente
const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete }) => {
  return (
    <div className="border rounded p-4">
      <h3>{client.name}</h3>
      <p>{client.email}</p>
      <button onClick={() => onEdit(client.idClient)}>Editar</button>
      <button onClick={() => onDelete(client.idClient)}>Eliminar</button>
    </div>
  );
};

export default ClientCard;
```

### Fase 3: Compartir tipos entre archivos

```typescript
// src/types/client.ts
export interface Client {
  idClient: number;
  name: string;
  email: string;
  phone: string;
  dni: string;
  address?: string;
  city?: string;
  // ... más campos
}

export interface CreateClientDto {
  name: string;
  email: string;
  phone: string;
  dni: string;
}

// Luego usar en componentes:
import { Client } from '@/types/client';
```

---

## 🔧 Casos Comunes de Migración

### 1. useState con tipos

```typescript
// ❌ JavaScript (infiere tipo)
const [clients, setClients] = useState([]);

// ✅ TypeScript (tipo explícito)
const [clients, setClients] = useState<Client[]>([]);

// Para estado que puede ser null
const [currentClient, setCurrentClient] = useState<Client | null>(null);
```

### 2. Event handlers

```typescript
// ❌ JavaScript
const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};

// ✅ TypeScript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};

// Para textarea:
const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  // ...
};

// Para select:
const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  // ...
};
```

### 3. axios y API calls

```typescript
// ❌ JavaScript
const loadClients = async () => {
  const response = await axios.get('/client');
  setClients(response.data);
};

// ✅ TypeScript
const loadClients = async (): Promise<void> => {
  const response = await axios.get<Client[]>('/client');
  setClients(response.data); // Autocompletado de Client!
};
```

### 4. Props con children

```typescript
interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode; // Para cualquier contenido JSX
}

const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children }) => {
  // ...
};
```

### 5. Enum para constantes

```typescript
// ❌ JavaScript
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};

// ✅ TypeScript (con enum)
enum PropertyStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RENTED = 'rented',
  RESERVED = 'reserved',
}

// Usar:
const property: Property = {
  status: PropertyStatus.AVAILABLE,
  // ...
};
```

---

## 🎨 Vite + TypeScript

**Vite ya soporta TypeScript sin configuración adicional!**

Solo cambia extensiones:
- `.jsx` → `.tsx`
- `.js` → `.ts`

**Variables de entorno:**
```typescript
// ❌ Mal
const API_URL = process.env.REACT_APP_API_URL;

// ✅ Bien (Vite)
const API_URL = import.meta.env.VITE_API_URL;

// Con tipo
const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

**Tipos para import.meta.env:**
```typescript
// src/vite-env.d.ts (crear este archivo)
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
  // Agregar más según necesites
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 🚀 Workflow Recomendado

### Día 1: Setup
1. Instalar TypeScript
2. Crear `tsconfig.json`
3. Crear carpeta `src/types/`
4. Crear tipos básicos (Client, Property, Lease)

### Día 2-3: Migrar utilidades
1. `src/utils/*.js` → `*.ts`
2. Funciones puras (formatters, validators)
3. Constantes y configuración

### Día 4-7: Migrar componentes
1. Empezar por componentes sin estado
2. Luego componentes con useState simple
3. Finalmente componentes con Redux

### Día 8+: Migrar Redux
Si no usas shared/, migrar actions y reducers a Redux Toolkit con TypeScript.

---

## ✅ Checklist de Migración por Archivo

Para cada archivo `.jsx` → `.tsx`:

- [ ] Renombrar extensión
- [ ] Importar tipos necesarios
- [ ] Definir interface para Props
- [ ] Tipar todos los `useState`
- [ ] Tipar event handlers (`onChange`, `onClick`)
- [ ] Tipar funciones async (`:Promise<void>`)
- [ ] Verificar que compile sin errores (`npm run dev`)
- [ ] Probar funcionalidad en navegador

---

## 🐛 Errores Comunes y Soluciones

### Error: "Property 'X' does not exist on type 'never'"
```typescript
// ❌ Mal
const [data, setData] = useState([]);
data.push(newItem); // Error!

// ✅ Bien
const [data, setData] = useState<Item[]>([]);
data.push(newItem); // OK
```

### Error: "Argument of type 'X' is not assignable to 'Y'"
Significa que estás pasando un tipo incorrecto. Revisa el tipo esperado.

### Error: "Cannot find module '@/types/client'"
Verifica que el path en `tsconfig.json` esté configurado:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 📚 Recursos de Aprendizaje

**Documentación oficial:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React + TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

**Aprende haciendo:**
1. Migra UN componente simple
2. Observa el autocompletado en VS Code
3. Intenta pasar un tipo incorrecto (verás el error antes de ejecutar)
4. Aprecia la ventaja 😊

---

## 💡 Consejos Finales

1. **No tengas miedo de usar `any` temporalmente** mientras aprendes
2. **El autocompletado es tu mejor amigo** - aprende los tipos usándolo
3. **Migra gradualmente** - No necesitas hacer todo de una vez
4. **Los errores de TypeScript te salvan de bugs** - No los ignores con `@ts-ignore`
5. **Comparte tipos entre archivos** - DRY (Don't Repeat Yourself)

**¡Empieza hoy con UN solo archivo!** 🚀

---

**Última actualización:** Diciembre 29, 2025
