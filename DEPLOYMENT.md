# Guía de Despliegue - Variables de Entorno

Esta guía explica cómo configurar las variables de entorno para el backend en desarrollo y producción.

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

## 🚀 Configuración por Plataforma

### Render.com

1. Ve a tu servicio en el dashboard de Render
2. Navega a la pestaña **"Environment"**
3. Agrega cada variable de entorno:

   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=tu-clave-secreta-generada
   SENDGRID_API_KEY=tu-api-key
   SENDGRID_FROM_EMAIL=noreply@tudominio.com
   FRONTEND_URL_PROD=https://tu-frontend.com
   ```

4. Guarda los cambios (Render reiniciará automáticamente)

### Heroku

```bash
# Instala Heroku CLI si no lo tienes
# Luego ejecuta:

heroku config:set NODE_ENV=production
heroku config:set PORT=10000
heroku config:set JWT_SECRET=tu-clave-secreta
heroku config:set SENDGRID_API_KEY=tu-api-key
heroku config:set SENDGRID_FROM_EMAIL=noreply@tudominio.com
heroku config:set FRONTEND_URL_PROD=https://tu-frontend.com

# Ver todas las variables
heroku config
```

### Railway

1. Ve a tu proyecto en Railway
2. Selecciona tu servicio
3. Ve a la pestaña **"Variables"**
4. Agrega cada variable de entorno
5. Guarda los cambios

### Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable para **Production**
4. Guarda los cambios

### DigitalOcean App Platform

1. Ve a tu app en DigitalOcean
2. Settings → App-Level Environment Variables
3. Agrega cada variable
4. Guarda y redespliega

## 🔐 Variables Requeridas

### Obligatorias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | `production` |
| `JWT_SECRET` | Clave secreta para JWT | Generar con `openssl rand -base64 32` |
| `SENDGRID_API_KEY` | API Key de SendGrid | `SG.xxxxxxxxxxxxx` |
| `SENDGRID_FROM_EMAIL` | Email verificado en SendGrid | `noreply@tudominio.com` |
| `FRONTEND_URL_PROD` | URL del frontend en producción | `https://tu-frontend.com` |

### Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `FRONTEND_URL_DEV` | URL del frontend en desarrollo | `http://localhost:3000` |
| `CORS_ORIGIN` | Origen CORS personalizado | Usa `FRONTEND_URL_PROD` o `FRONTEND_URL_DEV` |

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

### Error: "Missing required environment variables"

**Solución:** Asegúrate de que todas las variables requeridas estén configuradas en tu plataforma de hosting.

### Error: "CORS policy blocked"

**Solución:** Verifica que `FRONTEND_URL_PROD` coincida exactamente con la URL de tu frontend (incluyendo `https://`).

### Error: "SENDGRID_API_KEY no está configurada"

**Solución:** Verifica que la variable esté configurada y que el nombre sea exactamente `SENDGRID_API_KEY`.

### El servidor no inicia en producción

**Solución:** 
1. Verifica los logs de tu plataforma de hosting
2. Asegúrate de que `NODE_ENV=production` esté configurado
3. Verifica que todas las variables requeridas estén presentes

## 📚 Recursos Adicionales

- [SendGrid - API Keys](https://app.sendgrid.com/settings/api_keys)
- [Render - Environment Variables](https://render.com/docs/environment-variables)
- [Heroku - Config Vars](https://devcenter.heroku.com/articles/config-vars)

