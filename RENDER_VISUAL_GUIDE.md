# 🚀 Guía Visual de Despliegue en Render

Esta guía muestra paso a paso con capturas y ejemplos cómo desplegar este backend en Render.

## 📋 Antes de Empezar

### Necesitas tener listo:

1. **Cuenta en Render**
   - Regístrate gratis en: https://dashboard.render.com/register
   - Conecta tu cuenta de GitHub

2. **API Keys**
   - SendGrid: https://app.sendgrid.com/settings/api_keys
   - Google Gemini: https://ai.google.dev/
   
3. **URL del Frontend**
   - Ejemplo: `https://mi-app.vercel.app`

---

## 🎯 Paso 1: Abrir Render Dashboard

1. Ve a: https://dashboard.render.com/
2. Verás tu dashboard principal
3. Click en el botón **"New +"** en la esquina superior derecha

```
┌─────────────────────────────────────────┐
│  Render Dashboard                    👤 │
│                                          │
│  ┌─────────┐                            │
│  │ New + ▼ │  ← Click aquí              │
│  └─────────┘                            │
│                                          │
│  Your Services:                          │
│  ┌──────────────────────────────────┐   │
│  │  No services yet                 │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🎯 Paso 2: Seleccionar Blueprint

Del menú desplegable, selecciona **"Blueprint"**:

```
┌─────────────────────┐
│ New +               │
│                     │
│ • Web Service       │
│ • Static Site       │
│ • PostgreSQL        │
│ • Redis             │
│ ► Blueprint         │ ← Selecciona esto
│ • Cron Job          │
└─────────────────────┘
```

---

## 🎯 Paso 3: Conectar Repositorio

1. Si es tu primera vez, conecta tu cuenta de GitHub
2. Selecciona el repositorio `finance-manager-backend`
3. Render detectará automáticamente el archivo `render.yaml`

```
┌──────────────────────────────────────────────┐
│  Connect a Repository                        │
│                                               │
│  🔍 Search repositories...                   │
│                                               │
│  📁 your-username/finance-manager-backend    │
│     ✓ render.yaml detected                   │
│     [Connect] ← Click aquí                   │
│                                               │
└──────────────────────────────────────────────┘
```

---

## 🎯 Paso 4: Revisar Configuración del Blueprint

Render mostrará la configuración detectada del `render.yaml`:

```
┌──────────────────────────────────────────────┐
│  Blueprint Configuration                     │
│                                               │
│  Services to be created:                     │
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │ 🌐 Web Service                       │    │
│  │    Name: finance-manager-backend     │    │
│  │    Plan: Free                        │    │
│  │    Region: Oregon                    │    │
│  └─────────────────────────────────────┘    │
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │ 🗄️  PostgreSQL Database              │    │
│  │    Name: finance-manager-db          │    │
│  │    Plan: Free                        │    │
│  └─────────────────────────────────────┘    │
│                                               │
│  [Apply Blueprint]                           │
└──────────────────────────────────────────────┘
```

---

## 🎯 Paso 5: Configurar Variables Secretas

Render te pedirá las variables marcadas como `sync: false`:

```
┌──────────────────────────────────────────────┐
│  Required Environment Variables              │
│                                               │
│  SENDGRID_API_KEY                            │
│  ┌────────────────────────────────────┐     │
│  │ SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx    │     │
│  └────────────────────────────────────┘     │
│                                               │
│  SENDGRID_FROM_EMAIL                         │
│  ┌────────────────────────────────────┐     │
│  │ noreply@tudominio.com              │     │
│  └────────────────────────────────────┘     │
│                                               │
│  GEMINI_API_KEY                              │
│  ┌────────────────────────────────────┐     │
│  │ AIzaSyxxxxxxxxxxxxxxxxxxxxxx       │     │
│  └────────────────────────────────────┘     │
│                                               │
│  [Continue]                                  │
└──────────────────────────────────────────────┘
```

**Importante:**
- Copia y pega tus API keys exactamente como están
- NO incluyas espacios o saltos de línea
- Verifica que el email esté verificado en SendGrid

---

## 🎯 Paso 6: Aplicar Blueprint

1. Revisa que todo esté correcto
2. Click en **"Apply"**
3. Render comenzará a crear los servicios

```
┌──────────────────────────────────────────────┐
│  Creating your services...                   │
│                                               │
│  ✓ Creating database: finance-manager-db     │
│  ⏳ Creating web service...                  │
│     └─ Installing dependencies               │
│     └─ Building TypeScript                   │
│     └─ Generating Prisma client              │
│     └─ Running migrations                    │
│     └─ Starting server                       │
│                                               │
│  Estimated time: 5-10 minutes                │
└──────────────────────────────────────────────┘
```

---

## 🎯 Paso 7: Actualizar FRONTEND_URL

Mientras se crea, actualiza la URL del frontend:

1. Ve al servicio `finance-manager-backend`
2. Click en **"Environment"** en el sidebar
3. Busca la variable `FRONTEND_URL`
4. Actualiza con la URL real de tu frontend
5. Click **"Save Changes"**

```
┌──────────────────────────────────────────────┐
│  Environment Variables                       │
│                                               │
│  NODE_ENV            production              │
│  PORT                10000                   │
│  DATABASE_URL        postgresql://...        │
│  JWT_SECRET          auto-generated          │
│                                               │
│  FRONTEND_URL                                │
│  ┌────────────────────────────────────┐     │
│  │ https://mi-app.vercel.app          │ ← Edita│
│  └────────────────────────────────────┘     │
│                                               │
│  [Save Changes]                              │
└──────────────────────────────────────────────┘
```

---

## ✅ Paso 8: Verificar el Despliegue

Una vez completado (el indicador cambiará a verde):

1. Copia la URL del servicio
2. Prueba el health check

```bash
curl https://finance-manager-backend-xxxx.onrender.com/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

```
┌──────────────────────────────────────────────┐
│  finance-manager-backend                     │
│  ● Live                                      │
│                                               │
│  https://finance-manager-backend-xxxx        │
│  .onrender.com                               │
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │ Events  Logs  Metrics  Environment  │    │
│  └─────────────────────────────────────┘    │
│                                               │
│  Health Check: ✓ Passing                    │
│  Last Deploy: Just now                       │
│  Status: 🟢 Live                             │
└──────────────────────────────────────────────┘
```

---

## 🔍 Ver Logs en Tiempo Real

Para monitorear tu aplicación:

1. Ve a tu servicio
2. Click en **"Logs"**
3. Verás los logs en tiempo real

```
┌──────────────────────────────────────────────┐
│  Logs                                        │
│                                               │
│  [2024-12-14 19:45:12] Starting server...   │
│  [2024-12-14 19:45:13] 🚀 Server running    │
│  [2024-12-14 19:45:13] 📦 Environment: prod │
│  [2024-12-14 19:45:14] Health check OK      │
│  [2024-12-14 19:45:20] GET /api/auth/...   │
│                                               │
└──────────────────────────────────────────────┘
```

---

## 🗄️ Acceder a la Base de Datos

Para ver tu base de datos PostgreSQL:

1. Ve al dashboard principal
2. Selecciona `finance-manager-db`
3. Click en **"Connect"** para ver la connection string

```
┌──────────────────────────────────────────────┐
│  finance-manager-db                          │
│  ● Running                                   │
│                                               │
│  Type: PostgreSQL 16                         │
│  Plan: Free (1 GB)                           │
│  Region: Oregon                              │
│                                               │
│  [Connect ▼]                                 │
│                                               │
│  Internal Connection String:                 │
│  postgresql://user:pass@hostname/db          │
│                                               │
│  ⚠️  For security, only Render services      │
│     can connect to this database             │
└──────────────────────────────────────────────┘
```

---

## 🔄 Auto-Deploy

Cada vez que hagas push a `main`, Render desplegará automáticamente:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

Verás en Render:
```
┌──────────────────────────────────────────────┐
│  Deployments                                 │
│                                               │
│  ● Deploying...                              │
│  feat: nueva funcionalidad                   │
│  main • Just now • by your-username          │
│  └─ Build in progress...                     │
│                                               │
│  ✓ Live                                      │
│  feat: add Render configuration              │
│  main • 1 hour ago • by your-username        │
└──────────────────────────────────────────────┘
```

---

## 📊 Métricas y Monitoreo

Click en **"Metrics"** para ver:

```
┌──────────────────────────────────────────────┐
│  Metrics                                     │
│                                               │
│  CPU Usage:                                  │
│  ▂▃▅▄▃▂▁▃▄▅▆▅▄▃▂                           │
│  Average: 12%                                │
│                                               │
│  Memory Usage:                               │
│  ▆▆▆▆▇▇▆▆▆▇▇▇▆▆▆                           │
│  Average: 156 MB                             │
│                                               │
│  Request Count:                              │
│  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                           │
│  Last hour: 234 requests                     │
└──────────────────────────────────────────────┘
```

---

## ⚙️ Configuración Adicional

### Cambiar Plan (Eliminar Sleep)

Si quieres que tu servicio no entre en sleep:

1. Settings → Plan
2. Selecciona **Starter** ($7/mes)
3. Confirma el cambio

```
┌──────────────────────────────────────────────┐
│  Change Plan                                 │
│                                               │
│  Current: Free                               │
│  ⏸️  Spins down after 15 min inactivity      │
│  ✓ 750 hours/month free                     │
│                                               │
│  Upgrade to: Starter ($7/month)              │
│  ✓ Always on (no sleep)                     │
│  ✓ Faster builds                            │
│  ✓ Priority support                         │
│                                               │
│  [Upgrade Plan]                              │
└──────────────────────────────────────────────┘
```

### Conectar Dominio Personalizado

1. Settings → Custom Domain
2. Click **"Add Custom Domain"**
3. Ingresa tu dominio: `api.tudominio.com`
4. Configura el CNAME en tu DNS provider

---

## 🎉 ¡Listo!

Tu backend está desplegado y funcionando en:
```
https://finance-manager-backend-xxxx.onrender.com
```

### Próximos Pasos:

1. ✅ Actualiza la URL del API en tu frontend
2. ✅ Prueba todos los endpoints
3. ✅ Monitorea los logs durante las primeras horas
4. ✅ Configura notificaciones para errores críticos

---

## 📚 Referencias

- [Dashboard de Render](https://dashboard.render.com/)
- [Documentación de Render](https://render.com/docs)
- [Guía Completa](./DEPLOYMENT.md)
- [Checklist](./RENDER_CHECKLIST.md)

## 🆘 Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs en Render
2. Consulta el [Troubleshooting](./DEPLOYMENT.md#-troubleshooting)
3. Verifica el [Checklist](./RENDER_CHECKLIST.md)
