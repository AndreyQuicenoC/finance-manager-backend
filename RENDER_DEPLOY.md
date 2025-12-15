# 🚀 Despliegue Rápido en Render

Guía rápida para desplegar este backend en Render en menos de 10 minutos.

## ⚡ Despliegue en 3 Pasos

### 1️⃣ Preparación Previa

Antes de desplegar, necesitas obtener estas API keys:

- **SendGrid API Key**: [app.sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys)
  - Crea una nueva API key con permisos de "Mail Send"
  - Verifica tu dominio/email remitente

- **Google Gemini API Key**: [ai.google.dev](https://ai.google.dev/)
  - Crea un proyecto en Google AI Studio
  - Genera una API key

- **URL de tu Frontend**: Ejemplo `https://mi-app.vercel.app`

### 2️⃣ Desplegar en Render

#### Opción A: Usando Blueprint (Automático) ⭐ Recomendado

1. Ve a [dashboard.render.com](https://dashboard.render.com/)
2. Click en **"New +"** → **"Blueprint"**
3. Conecta tu repositorio de GitHub/GitLab
4. Selecciona este repositorio (`finance-manager-backend`)
5. Render detectará automáticamente el archivo `render.yaml`
6. Configura las variables requeridas:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@tudominio.com
   GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxx
   ```
7. Edita `FRONTEND_URL` con la URL de tu frontend
8. Click en **"Apply"**

¡Listo! Render creará automáticamente:
- ✅ Base de datos PostgreSQL
- ✅ Servicio web del backend
- ✅ Variables de entorno
- ✅ Conexión entre servicios

#### Opción B: Manual

Si prefieres configurar paso a paso, sigue la [guía completa de despliegue](./DEPLOYMENT.md).

### 3️⃣ Verificar el Despliegue

Una vez completado el deploy (toma ~5-10 minutos):

1. Ve a tu servicio en Render
2. Copia la URL del servicio (ejemplo: `https://finance-manager-backend.onrender.com`)
3. Prueba el health check:
   ```bash
   curl https://tu-servicio.onrender.com/health
   ```
   
   Deberías recibir:
   ```json
   {"status":"ok","message":"Server is running"}
   ```

## 📝 Configuración del render.yaml

El archivo `render.yaml` incluido en este repositorio configura:

```yaml
- Web Service (Backend API)
  - Runtime: Node.js
  - Region: Oregon
  - Plan: Free
  - Auto-deploy desde main branch
  - Build: npm install + TypeScript build + Prisma
  - Start: npm start
  - Health check: /health

- PostgreSQL Database
  - Plan: Free
  - Conexión automática al backend
```

## 🔧 Variables de Entorno Configuradas

### Automáticas (no requieren acción)
- ✅ `NODE_ENV=production`
- ✅ `PORT=10000`
- ✅ `DATABASE_URL` (vinculada a la base de datos)
- ✅ `JWT_SECRET` (generada automáticamente)

### Manuales (debes configurar)
- ⚙️ `FRONTEND_URL` - URL de tu frontend
- ⚙️ `SENDGRID_API_KEY` - Para envío de emails
- ⚙️ `SENDGRID_FROM_EMAIL` - Email verificado
- ⚙️ `GEMINI_API_KEY` - Para funciones de AI

## 🔄 Actualizaciones Automáticas

Render despliega automáticamente cuando haces push a `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

Render ejecutará automáticamente:
1. Build de TypeScript
2. Generación de cliente Prisma
3. Migraciones de base de datos
4. Reinicio del servicio

## 🗄️ Migraciones de Base de Datos

Las migraciones se aplican automáticamente en cada deploy:

```bash
npx prisma migrate deploy
```

**Antes de hacer push a producción:**
```bash
# Crea y prueba la migración localmente
npx prisma migrate dev --name nombre_descriptivo
npm run dev
```

## 📊 Monitoreo

### Logs en Tiempo Real
Dashboard → Tu Servicio → **Logs**

### Métricas
Dashboard → Tu Servicio → **Metrics**
- CPU y memoria
- Request count
- Response times

## 🆘 Problemas Comunes

### Build falla
- **Causa**: Error de TypeScript o dependencias faltantes
- **Solución**: Verifica que `npm run build` funcione localmente

### Service Unavailable (503)
- **Causa**: El servidor no pasó el health check
- **Solución**: Revisa los logs para ver por qué no inicia

### CORS Error
- **Causa**: FRONTEND_URL incorrecta o mal formateada
- **Solución**: Verifica que sea exacta (con https:// y sin slash final)

### Database Connection Failed
- **Causa**: DATABASE_URL no está configurada
- **Solución**: Asegúrate de que la base de datos esté vinculada al servicio

## 📚 Documentación Completa

Para más detalles, consulta:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa de despliegue
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Documentación de endpoints
- [README.md](./README.md) - Información general del proyecto

## 💡 Tips de Producción

1. **Plan Free**: Render pone el servicio en sleep después de 15 min de inactividad
   - El primer request después de sleep tarda ~30 segundos
   - Considera actualizar al plan Starter ($7/mes) para eliminar el sleep

2. **Base de datos Free**: Límite de 1GB y 97 horas de uptime/mes
   - Suficiente para demos y proyectos personales
   - Para producción real, considera el plan Starter ($7/mes)

3. **Preview Environments**: Render puede crear environments temporales para PRs
   - Útil para testing antes de merge a main

4. **Custom Domain**: Puedes conectar tu propio dominio
   - Dashboard → Settings → Custom Domain

## 🎉 ¡Listo!

Tu backend debería estar funcionando en:
```
https://tu-servicio.onrender.com
```

Conecta tu frontend actualizando la URL del API en su configuración.
