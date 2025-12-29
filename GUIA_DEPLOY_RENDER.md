# 🚀 Guía de Deploy en Render

## Cambios Realizados para Producción

### 1. ✅ CORS Actualizado
Se actualizó `back/src/app.js` para permitir **todos los subdominios de Vercel**:
- Ahora acepta: `https://ql-inmobiliaria.vercel.app`
- Y cualquier URL que termine en `.vercel.app` (para preview deployments)

### 2. ✅ Health Check Endpoint
Agregado endpoint `/health` para verificar que el servidor esté funcionando:
```bash
GET https://qlinmobiliaria.onrender.com/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2025-10-04T...",
  "uptime": 12345.67,
  "environment": "production"
}
```

---

## 📋 Pasos para Deploy en Render

### Paso 1: Commit y Push de los cambios
```bash
cd c:/Users/merce/Desktop/QLInmobiliaria
git add .
git commit -m "fix: Actualizar configuración CORS para Vercel"
git push origin main
```

### Paso 2: Verificar en el Dashboard de Render
1. Ve a: https://dashboard.render.com/
2. Busca tu servicio: `qlinmobiliaria`
3. El deploy debería iniciar automáticamente
4. Espera a que el estado sea **"Live"** (puede tardar 2-5 minutos)

### Paso 3: Verificar que el servidor funciona
Abre en el navegador:
```
https://qlinmobiliaria.onrender.com/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": ...,
  "environment": "production"
}
```

### Paso 4: Probar el Login
1. Ve a: https://ql-inmobiliaria.vercel.app/login
2. Intenta hacer login con tus credenciales
3. Abre la consola del navegador (F12) → pestaña "Network"
4. Verifica que la petición a `/auth/login` retorne **200 OK**

---

## 🔧 Variables de Entorno en Render

Asegúrate de que estas variables estén configuradas en Render Dashboard:

```env
DB_DEPLOY=postgres://neondb_owner:TF5BUXksz4cY@ep-withered-sky-a5n8x0ut-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET_KEY=6D3DFC774DA453D28E2C59F8F6E9B
PORT=3001
NODE_ENV=production
```

---

## 🐛 Troubleshooting

### Si sigue apareciendo error CORS:
1. **Verifica los logs en Render**:
   - Dashboard → Tu servicio → "Logs"
   - Busca mensajes tipo: `Origin bloqueado por CORS: https://...`
   
2. **Verifica que el deploy se completó**:
   - El status debe ser **"Live"**
   - La última línea de logs debe decir: `🚀 listening on port: 3001 🚀`

3. **Forzar redeploy**:
   - Dashboard → "Manual Deploy" → "Clear build cache & deploy"

### Si el login retorna 401 (Unauthorized):
- Verifica que el usuario exista en la base de datos de **Neon** (producción)
- Puedes crear un usuario con:
  ```bash
  POST https://qlinmobiliaria.onrender.com/auth/register
  Content-Type: application/json
  
  {
    "username": "admin",
    "password": "tu_password",
    "email": "admin@example.com"
  }
  ```

### Si el servidor no responde (ERR_FAILED):
- Render puede haber puesto el servicio en "sleep" por inactividad
- La primera petición puede tardar 30-60 segundos en despertar el servicio
- Intenta refrescar la página después de 1 minuto

---

## 📝 Configuración de CORS Actual

El backend ahora acepta peticiones desde:
- ✅ `http://localhost:5173` (desarrollo local frontend)
- ✅ `http://localhost:3000` (desarrollo local alternativo)
- ✅ `https://ql-inmobiliaria.vercel.app` (producción)
- ✅ Cualquier subdominio de `.vercel.app` (preview deployments)

---

## ✅ Checklist Post-Deploy

- [ ] Push de cambios a GitHub
- [ ] Deploy automático en Render completado
- [ ] Endpoint `/health` responde correctamente
- [ ] Login funciona desde Vercel
- [ ] No hay errores CORS en la consola
- [ ] Los datos se cargan correctamente

---

## 📞 Soporte

Si continúan los problemas:
1. Copia los logs de Render Dashboard
2. Copia los errores de la consola del navegador (F12)
3. Comparte ambos para diagnóstico
