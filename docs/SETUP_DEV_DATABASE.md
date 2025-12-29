# 🗄️ Configuración de Base de Datos de Desarrollo

## 📌 Problema Actual

Tu código está apuntando a la BD de producción: `InnoInmobiliaria`
- ❌ Riesgoso: Puedes modificar/borrar datos reales
- ❌ No puedes probar multi-tenancy sin afectar producción
- ❌ No puedes hacer migraciones experimentales

## ✅ Solución: BD de Desarrollo Separada

Crear `InnoInmobiliaria_Dev` para desarrollo local.

---

## 🚀 Configuración Automática (Recomendado)

### Opción 1: Ejecutar script completo

```bash
# Desde la raíz del proyecto
bash setup-dev-database.sh
```

El script hace TODO automáticamente:
1. ✅ Crea BD `InnoInmobiliaria_Dev`
2. ✅ Crea todas las tablas
3. ✅ Ejecuta migraciones
4. ✅ Inserta datos iniciales

### Opción 2: Paso a paso manual

```bash
# 1. Crear base de datos
psql -U postgres -f back/migrations/000-create-database-dev.sql

# 2. Crear schema (tablas)
psql -U postgres -d InnoInmobiliaria_Dev -f back/migrations/001-create-schema.sql

# 3. Migración company settings
psql -U postgres -d InnoInmobiliaria_Dev -f back/migrations/add-company-settings.sql
```

---

## ⚙️ Actualizar Configuración

### 1. Editar `back/.env`

```bash
# Cambiar de:
DB_NAME=InnoInmobiliaria
DB_DEPLOY=postgres://postgres:7754@localhost:5432/InnoInmobiliaria

# A:
DB_NAME=InnoInmobiliaria_Dev
DB_DEPLOY=postgres://postgres:7754@localhost:5432/InnoInmobiliaria_Dev
```

**O mejor aún:** Usar archivo separado para desarrollo

```bash
# Renombrar .env actual (producción)
mv back/.env back/.env.production

# Usar .env.development
cp back/.env.development back/.env

# Editar back/.env y verificar:
DB_NAME=InnoInmobiliaria_Dev
```

### 2. Reiniciar Backend

```bash
cd back
npm run dev

# Verificar en consola:
# "Base de datos sincronizada: InnoInmobiliaria_Dev"
```

---

## 🔍 Verificar Instalación

```bash
# Conectarse a la BD
psql -U postgres -d InnoInmobiliaria_Dev

# Ver tablas
\dt

# Debería mostrar:
# admins, clients, properties, leases, garantors,
# payment_receipts, rent_updates, sale_contracts, admin_settings

# Salir
\q
```

---

## 📊 Comparación de BDs

| BD | Uso | Protegida? |
|----|-----|-----------|
| `InnoInmobiliaria` | **PRODUCCIÓN** | ✅ NO TOCAR |
| `InnoInmobiliaria_Dev` | Desarrollo local | ⚙️ Experimentar libremente |

---

## 🎯 Flujo de Trabajo

### Desarrollo Local (ahora)
```
QL Front (puerto 5173) 
    ↓
Back (puerto 3001) 
    ↓
InnoInmobiliaria_Dev ← 🔄 Trabajas aquí
```

### Producción (actual cliente)
```
QL Front (producción) 
    ↓
Back (producción) 
    ↓
InnoInmobiliaria ← 🔒 NO modificar
```

---

## 🗑️ Limpiar y Reiniciar

Si algo sale mal, puedes borrar y recrear:

```bash
# Borrar BD
psql -U postgres -c "DROP DATABASE IF EXISTS \"InnoInmobiliaria_Dev\";"

# Recrear desde cero
bash setup-dev-database.sh
```

---

## 📦 Migrar Datos de Prueba (Opcional)

Si quieres copiar ALGUNOS datos de producción para testing:

```bash
# Exportar solo estructura + primeros 10 clientes
pg_dump -U postgres -d InnoInmobiliaria \
  --data-only \
  --table=clients \
  | head -n 50 \
  > test-data.sql

# Importar a dev
psql -U postgres -d InnoInmobiliaria_Dev -f test-data.sql
```

⚠️ **NO copies todos los datos** - Solo lo necesario para testing.

---

## 🔐 Seguridad

### En .env.development:
- ✅ Password simple para local (7754 está OK)
- ✅ JWT_SECRET diferente a producción
- ✅ Sin datos sensibles de clientes reales

### En .env.production:
- ✅ Mantener con BD real
- ✅ Passwords fuertes
- ✅ JWT_SECRET complejo
- ❌ NO subir a Git (.gitignore)

---

## ✅ Checklist Final

Antes de continuar desarrollando:

- [ ] BD `InnoInmobiliaria_Dev` creada
- [ ] Todas las tablas creadas (verificar con `\dt`)
- [ ] `back/.env` apunta a `InnoInmobiliaria_Dev`
- [ ] Backend arranca sin errores
- [ ] Puedes crear un cliente de prueba
- [ ] `/company-settings` funciona

---

## 🆘 Troubleshooting

### Error: "database already exists"
```bash
# Borrar y recrear
psql -U postgres -c "DROP DATABASE \"InnoInmobiliaria_Dev\";"
bash setup-dev-database.sh
```

### Error: "relation does not exist"
Falta crear las tablas:
```bash
psql -U postgres -d InnoInmobiliaria_Dev -f back/migrations/001-create-schema.sql
```

### Backend sigue conectándose a la BD vieja
Verificar que `.env` está actualizado y reiniciar:
```bash
# Verificar
cat back/.env | grep DB_NAME

# Debería mostrar:
# DB_NAME=InnoInmobiliaria_Dev

# Reiniciar
cd back && npm run dev
```

---

**Estado:** ✅ Scripts listos, ejecutar `setup-dev-database.sh`  
**Última actualización:** Diciembre 29, 2025
