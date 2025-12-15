# Guía de Despliegue en Render

Esta guía explica cómo desplegar el backend en Render con configuración automática usando Blueprint (render.yaml).

## 📋 Variables de Entorno Requeridas

### Desarrollo Local

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edita el archivo `.env`** con tus valores:
   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=tu-clave-secreta-super-segura
   SENDGRID_API_KEY=tu-api-key-de-sendgrid
   SENDGRID_FROM_EMAIL=noreply@tudominio.com
   FRONTEND_URL_DEV=http://localhost:3000
   FRONTEND_URL_PROD=https://tu-frontend.com
   ```

3. **Genera un JWT_SECRET seguro:**
   ```bash
   openssl rand -base64 32
   ```

### Producción

En producción, **NO uses archivos `.env`**. En su lugar, configura las variables de entorno directamente en tu plataforma de hosting.

## 🚀 Despliegue en Render con Blueprint

Este repositorio incluye un archivo `render.yaml` que configura automáticamente:
- Web Service (API Backend)
- PostgreSQL Database
- Variables de entorno
- Build y deploy commands

### Opción 1: Despliegue Automático (Recomendado)

1. **Conecta tu repositorio a Render:**
   - Ve a [Render Dashboard](https://dashboard.render.com/)
   - Click en **"New +"** → **"Blueprint"**
   - Conecta tu cuenta de GitHub/GitLab
   - Selecciona este repositorio
   - Render detectará automáticamente el `render.yaml`

2. **Configura las variables secretas:**
   
   Render te pedirá configurar las siguientes variables (marcadas como `sync: false` en render.yaml):
   
   ```
   SENDGRID_API_KEY=tu-api-key-de-sendgrid
   SENDGRID_FROM_EMAIL=noreply@tudominio.com
   GEMINI_API_KEY=tu-api-key-de-gemini
   ```

3. **Actualiza la URL del frontend:**
   
   En el dashboard de Render, edita la variable:
   ```
   FRONTEND_URL=https://tu-frontend-url.com
   ```

4. **Deploy:**
   - Click en **"Apply"**
   - Render creará automáticamente:
     - Base de datos PostgreSQL
     - Servicio web del backend
     - Todas las conexiones necesarias
   - El primer despliegue toma ~5-10 minutos

### Opción 2: Despliegue Manual

Si prefieres configurar manualmente sin Blueprint:

1. **Crear la base de datos:**
   - Dashboard → **"New +"** → **"PostgreSQL"**
   - Name: `finance-manager-db`
   - Plan: Free (o el que prefieras)
   - Region: Oregon (o tu preferencia)
   - Click **"Create Database"**

2. **Crear el servicio web:**
   - Dashboard → **"New +"** → **"Web Service"**
   - Conecta tu repositorio
   - Configuración:
     - **Name:** `finance-manager-backend`
     - **Region:** Oregon (mismo que la DB)
     - **Branch:** `main`
     - **Runtime:** Node
     - **Build Command:** 
       ```bash
       npm install && npm run build && npx prisma generate && npx prisma migrate deploy
       ```
     - **Start Command:** 
       ```bash
       npm start
       ```
     - **Plan:** Free (o el que prefieras)

3. **Configurar variables de entorno:**
   
   En la pestaña **"Environment"** del servicio web, agrega:

   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[Connection String from your database]
   JWT_SECRET=[Generate with: openssl rand -base64 32]
   FRONTEND_URL=https://tu-frontend-url.com
   SENDGRID_API_KEY=tu-api-key
   SENDGRID_FROM_EMAIL=noreply@tudominio.com
   GEMINI_API_KEY=tu-api-key-de-gemini
   ```

4. **Deploy:**
   - Click **"Create Web Service"**
   - Render ejecutará el build automáticamente

## 🔄 Actualizaciones y Redeploy

Render despliega automáticamente cuando haces push a la rama `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

Render detectará el cambio y ejecutará automáticamente:
1. `npm install`
2. `npm run build`
3. `npx prisma generate`
4. `npx prisma migrate deploy`
5. `npm start`

## 🗄️ Migraciones de Base de Datos

Las migraciones se ejecutan automáticamente en cada deploy gracias al comando:
```bash
npx prisma migrate deploy
```

**Importante:** Antes de hacer push a producción, asegúrate de que las migraciones funcionen localmente:

```bash
# Crear una nueva migración
npx prisma migrate dev --name descripcion_del_cambio

# Probar en local
npm run dev
```

## � Health Check

El backend incluye un endpoint de health check en `/health` que Render usa para verificar que el servicio está funcionando correctamente.

## 🔐 Variables de Entorno

### Variables Configuradas Automáticamente (Blueprint)

Estas variables se configuran automáticamente en `render.yaml`:

| Variable | Descripción | Valor |
|----------|-------------|-------|
| `NODE_ENV` | Entorno de ejecución | `production` (automático) |
| `PORT` | Puerto del servidor | `10000` (automático) |
| `DATABASE_URL` | Conexión a PostgreSQL | Automático desde la DB |
| `JWT_SECRET` | Clave secreta para JWT | Generado automáticamente por Render |

### Variables que Debes Configurar Manualmente

Estas variables deben configurarse en el dashboard de Render:

| Variable | Descripción | Ejemplo | Obligatoria |
|----------|-------------|---------|-------------|
| `FRONTEND_URL` | URL del frontend en producción | `https://tu-frontend.com` | ✅ Sí |
| `SENDGRID_API_KEY` | API Key de SendGrid | `SG.xxxxxxxxxxxxx` | ✅ Sí |
| `SENDGRID_FROM_EMAIL` | Email verificado en SendGrid | `noreply@tudominio.com` | ✅ Sí |
| `GEMINI_API_KEY` | API Key de Google Gemini AI | `AIza...` | ✅ Sí |

### Variables Opcionales (Desarrollo)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor (desarrollo) | `5000` |
| `FRONTEND_URL` | URL del frontend (desarrollo) | `http://localhost:3000` |

## ✅ Validación

El servidor valida automáticamente las variables requeridas al iniciar:

- Si falta `JWT_SECRET`, el servidor no iniciará y mostrará un error
- Otras variables se validan en tiempo de ejecución cuando se usan

## 🔒 Seguridad

### ✅ Buenas Prácticas

1. **Nunca commitees archivos `.env`** al repositorio
2. **Usa valores diferentes** para desarrollo y producción
3. **Genera JWT_SECRET** con herramientas seguras:
   ```bash
   openssl rand -base64 32
   ```
4. **Rota las claves** periódicamente en producción
5. **Usa HTTPS** en producción (configurado automáticamente)

### ❌ No Hacer

- ❌ No compartas archivos `.env` en el código
- ❌ No uses la misma `JWT_SECRET` en desarrollo y producción
- ❌ No uses valores de ejemplo en producción
- ❌ No expongas variables de entorno en logs o errores

## 🧪 Verificación

Para verificar que las variables están configuradas correctamente:

```bash
# Desarrollo
npm run dev
# Deberías ver: "🚀 Server is running on port 3000"

# Producción (después del build)
npm run build
npm start
# Deberías ver: "🚀 Server is running on port [PORT]"
# Y: "📦 Environment: production"
```

## 📝 Notas Importantes

1. **dotenv solo se carga en desarrollo**: En producción, las variables deben estar en el sistema
2. **CORS se configura automáticamente** según `NODE_ENV` y las URLs del frontend
3. **Las cookies HTTP-only** funcionan correctamente con la configuración de CORS
4. **SendGrid requiere verificación** del email remitente antes de usar

## 🆘 Troubleshooting

### Error: "Missing required environment variables: JWT_SECRET"

**Causa:** La variable JWT_SECRET no está configurada.

**Solución:** 
- Si usas Blueprint: Render debería generar esto automáticamente. Verifica en Environment variables.
- Si es manual: Genera una con `openssl rand -base64 32` y agrégala.

### Error: "CORS policy blocked"

**Causa:** El frontend no está en la lista de orígenes permitidos.

**Solución:** 
1. Verifica que `FRONTEND_URL` esté configurada correctamente
2. Asegúrate de incluir `https://` o `http://` según corresponda
3. NO incluyas slash al final: ❌ `https://app.com/` → ✅ `https://app.com`

### Error: Build failed - "Cannot find module 'prisma'"

**Causa:** Prisma no se instaló correctamente.

**Solución:** Verifica que el build command incluya:
```bash
npm install && npm run build && npx prisma generate && npx prisma migrate deploy
```

### Error: "Database connection failed"

**Causa:** La variable DATABASE_URL no está configurada o es incorrecta.

**Solución:**
1. Verifica que la base de datos esté creada en Render
2. En el servicio web, asegúrate de que DATABASE_URL esté vinculada a la base de datos
3. Reinicia el servicio después de vincular la base de datos

### El servidor se reinicia constantemente (crash loop)

**Causa:** Algún error en el código o faltan variables requeridas.

**Solución:**
1. Ve a Logs en el dashboard de Render
2. Busca el mensaje de error específico
3. Verifica que todas las variables obligatorias estén configuradas

### Las migraciones no se aplican

**Causa:** El comando de migración falla durante el build.

**Solución:**
1. Verifica que las migraciones funcionen localmente primero
2. Revisa los logs del build en Render
3. Asegúrate de que DATABASE_URL esté disponible durante el build

### Error 503 - Service Unavailable

**Causa:** El servicio no pasó el health check.

**Solución:**
1. Verifica que el endpoint `/health` funcione
2. Revisa los logs para ver por qué el servidor no inicia
3. Asegúrate de que el PORT sea 10000 (default de Render)

## � Monitoreo y Logs

### Ver logs en tiempo real:
1. Ve a tu servicio en Render Dashboard
2. Click en la pestaña **"Logs"**
3. Verás todos los console.log y errores en tiempo real

### Métricas del servicio:
- CPU y memoria usage
- Request count
- Response times
- Disponibles en la pestaña **"Metrics"**

## 📚 Recursos Adicionales

- [Render - Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Render - Environment Variables](https://render.com/docs/environment-variables)
- [Render - Deploy Hooks](https://render.com/docs/deploy-hooks)
- [Prisma - Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [SendGrid - API Keys](https://app.sendgrid.com/settings/api_keys)
- [Google Gemini API - Get Started](https://ai.google.dev/tutorials/get_started_web)

## 💡 Consejos de Producción

1. **Usa conexión pooling:** Render reutiliza conexiones de Prisma automáticamente
2. **Monitorea el uso de base de datos:** Free tier tiene límites de conexiones
3. **Configura alertas:** En Render → Settings → Notifications
4. **Habilita auto-deploy:** Para deployment continuo desde main
5. **Usa Preview Environments:** Para probar PRs antes de merge
6. **Backup de base de datos:** Render hace backups automáticos, pero considera backups adicionales para datos críticos

