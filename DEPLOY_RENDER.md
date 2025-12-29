# 🚀 Guía de Deploy en Render

## Problema CORS Detectado

El backend en Render no está respondiendo correctamente a las peticiones CORS desde Vercel.

## ✅ Cambios Realizados en el Código

### 1. Configuración CORS Mejorada (`back/src/app.js`)

Se agregó:
- ✅ Función callback para validar origins dinámicamente
- ✅ Logs detallados de requests y origins
- ✅ Headers explícitos para CORS
- ✅ Métodos HTTP permitidos claramente definidos
- ✅ Endpoint `/health` para verificar estado del servidor

### 2. Origins Permitidos

```javascript
const allowedOrigins = [
    'http://localhost:5173',           // Desarrollo local
    'https://ql-inmobiliaria.vercel.app' // Producción Vercel
];
```

## 📝 Pasos para Deploy en Render

### 1. **Commit y Push de los Cambios**

```bash
cd c:/Users/merce/Desktop/QLInmobiliaria
git add .
git commit -m "fix: mejorar configuración CORS y agregar health check"
git push origin main
```

### 2. **Verificar Variables de Entorno en Render**

Ve al dashboard de Render → Tu servicio → Environment

Asegúrate de que estén configuradas:

```
DB_DEPLOY=postgres://neondb_owner:TF5BUXksz4cY@ep-withered-sky-a5n8x0ut-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET_KEY=6D3DFC774DA453D28E2C59F8F6E9B
PORT=3001
NODE_ENV=production
```

### 3. **Re-deploy en Render**

Render detectará automáticamente los cambios en GitHub y hará re-deploy.

Si no lo hace automáticamente:
1. Ve a tu dashboard de Render
2. Click en "Manual Deploy" → "Deploy latest commit"

### 4. **Verificar que el Backend Esté Corriendo**

Abre en tu navegador:
```
https://qlinmobiliaria.onrender.com/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2025-10-04T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 5. **Verificar Logs en Render**

En el dashboard de Render → Logs, deberías ver:

```
🚀 listening on port: 3001 🚀
Ruta base del proyecto: /opt/render/project/src
```

Y cuando hagas peticiones desde Vercel:
```
POST /auth/login - Origin: https://ql-inmobiliaria.vercel.app
GET /client - Origin: https://ql-inmobiliaria.vercel.app
```

## 🔍 Troubleshooting

### Si sigue el error CORS:

**Opción A: CORS Temporal Permisivo (Solo para debugging)**

Cambia temporalmente en `app.js`:

```javascript
app.use(cors({
    origin: '*', // ADVERTENCIA: Solo para debugging
    credentials: false
}));
```

Esto permitirá ver si el problema es solo de CORS o hay otro issue.

**Opción B: Verificar que Render esté usando el código actualizado**

1. Revisa en Render → Deploy logs
2. Busca "Building..." y verifica que termine en "Build successful"
3. Verifica el commit hash que se deployó

### Si el endpoint /health no responde:

1. El servicio no está corriendo
2. Revisa los logs de Render para ver errores
3. Verifica que la base de datos Neon esté accesible

### Error 404 en rutas:

Verifica que las rutas en `back/src/routes/auth.js` estén correctamente exportadas:

```javascript
router.post("/login", loginAdmin);
```

## 🎯 Checklist Final

- [ ] Código commiteado y pusheado a GitHub
- [ ] Variables de entorno configuradas en Render
- [ ] Deploy completado exitosamente
- [ ] `/health` responde con status 200
- [ ] Logs de Render muestran "listening on port"
- [ ] Login desde Vercel funciona sin errores CORS

## 📞 Contacto con Soporte de Render

Si nada funciona, puede ser un problema de la configuración de Render:

1. Verifica que el "Start Command" sea: `npm start`
2. Verifica que el "Build Command" sea: `npm install`
3. Verifica que el "Root Directory" sea: `back` (si tu repo tiene esa estructura)

## 🔐 Seguridad Post-Deploy

Una vez que funcione, **NO OLVIDES**:
1. Cambiar `JWT_SECRET_KEY` por un valor más seguro
2. Configurar rate limiting
3. Agregar validación de inputs
4. Configurar logs de seguridad
