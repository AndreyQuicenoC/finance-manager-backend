# ✅ Checklist de Pre-Despliegue en Render

Usa este checklist antes de desplegar a producción para asegurarte de que todo está configurado correctamente.

## 📋 Antes de Desplegar

### 1. Código y Configuración
- [ ] Todas las pruebas pasan localmente (`npm test`)
- [ ] TypeScript compila sin errores (`npm run typecheck`)
- [ ] Lint pasa sin errores (`npm run lint`)
- [ ] Build funciona correctamente (`npm run build`)
- [ ] El archivo `render.yaml` está en la raíz del repositorio
- [ ] El archivo `.gitignore` incluye `.env` (NO subir secrets)

### 2. Base de Datos
- [ ] Las migraciones funcionan localmente
  ```bash
  npx prisma migrate dev
  ```
- [ ] El schema de Prisma está actualizado
- [ ] No hay migraciones pendientes
  ```bash
  npx prisma migrate status
  ```

### 3. Variables de Entorno
- [ ] `.env.example` está actualizado con todas las variables necesarias
- [ ] Tienes todas las API keys necesarias:
  - [ ] SendGrid API Key
  - [ ] SendGrid Email verificado
  - [ ] Google Gemini API Key
  - [ ] URL del frontend (producción)

### 4. Pruebas de Integración
- [ ] El endpoint `/health` responde correctamente
  ```bash
  npm run dev
  # En otra terminal:
  curl http://localhost:5000/health
  ```
- [ ] Los endpoints principales funcionan localmente
- [ ] La conexión a la base de datos funciona
- [ ] La autenticación JWT funciona
- [ ] El envío de emails funciona (si aplica)
- [ ] Las funciones de AI funcionan (si aplica)

## 🚀 Durante el Despliegue

### 1. Configuración en Render
- [ ] Blueprint detectado correctamente
- [ ] Base de datos PostgreSQL creada
- [ ] Web service creado
- [ ] DATABASE_URL vinculada automáticamente
- [ ] JWT_SECRET generada automáticamente

### 2. Variables Manuales Configuradas
- [ ] `FRONTEND_URL` configurada (sin slash al final)
- [ ] `SENDGRID_API_KEY` configurada
- [ ] `SENDGRID_FROM_EMAIL` configurada (email verificado)
- [ ] `GEMINI_API_KEY` configurada

### 3. Build Process
- [ ] `npm install` completado sin errores
- [ ] `npm run build` completado sin errores
- [ ] `npx prisma generate` ejecutado correctamente
- [ ] `npx prisma migrate deploy` ejecutado correctamente

### 4. Deployment
- [ ] Servicio iniciado correctamente (`npm start`)
- [ ] Health check pasando (status 200)
- [ ] Sin errores en los logs

## ✅ Después del Despliegue

### 1. Verificación Básica
- [ ] Servicio está "Live" en Render dashboard
- [ ] Health check responde correctamente
  ```bash
  curl https://tu-servicio.onrender.com/health
  ```
- [ ] Logs no muestran errores críticos

### 2. Pruebas de Endpoints
- [ ] GET `/` responde correctamente
- [ ] POST `/api/auth/register` funciona
- [ ] POST `/api/auth/login` funciona
- [ ] Endpoints protegidos requieren autenticación
- [ ] CORS permite requests desde el frontend

### 3. Base de Datos
- [ ] Tablas creadas correctamente (verifica en Render DB console)
- [ ] Migraciones aplicadas completamente
- [ ] Conexión estable sin timeouts

### 4. Integraciones
- [ ] SendGrid envía emails correctamente
- [ ] Gemini AI responde correctamente
- [ ] Frontend puede conectarse al backend

### 5. Monitoreo
- [ ] Métricas mostrando datos (CPU, memoria, requests)
- [ ] Health check automático funcionando
- [ ] Notificaciones configuradas (opcional)

## 🔄 Configuración de Auto-Deploy

- [ ] Auto-deploy habilitado desde rama `main`
- [ ] Branch protection configurado en GitHub (opcional)
- [ ] Pre-push hooks funcionando (`npm test`)

## 📊 Performance y Optimización

### Plan Free - Limitaciones
- [ ] Consciente del sleep después de 15 min de inactividad
- [ ] Consciente del límite de 750 horas/mes
- [ ] Primer request después de sleep tarda ~30 segundos

### Consideraciones
- [ ] ¿Necesitas plan Starter para eliminar sleep? ($7/mes)
- [ ] ¿Base de datos Free es suficiente? (1GB, 97 hrs/mes)
- [ ] ¿Configurar Preview Environments para PRs?

## 🔐 Seguridad

- [ ] JWT_SECRET es segura y única
- [ ] Variables de entorno no están en el código
- [ ] `.env` está en `.gitignore`
- [ ] Ninguna API key está hardcodeada
- [ ] CORS configurado correctamente
- [ ] HTTPS habilitado automáticamente por Render

## 📱 Actualización del Frontend

- [ ] Variable de entorno en frontend actualizada con la URL del backend Render
  ```javascript
  VITE_API_URL=https://tu-servicio.onrender.com
  // o
  NEXT_PUBLIC_API_URL=https://tu-servicio.onrender.com
  ```
- [ ] Frontend redespleado con la nueva configuración
- [ ] Conexión frontend-backend verificada

## 🆘 Plan de Contingencia

- [ ] Sabes cómo ver los logs en Render
- [ ] Sabes cómo hacer rollback a un deploy anterior
- [ ] Tienes backup de las variables de entorno
- [ ] Tienes backup de la base de datos (manual o automático)

## 📝 Documentación

- [ ] README actualizado con URL de producción
- [ ] API_ENDPOINTS.md actualizado si es necesario
- [ ] Equipo informado sobre el nuevo deploy
- [ ] Credenciales guardadas en gestor de contraseñas

## 🎉 Deploy Exitoso

Una vez completados todos los checks:

✅ **Backend funcionando en:** `https://tu-servicio.onrender.com`  
✅ **Base de datos:** Conectada y operativa  
✅ **Integraciones:** Todas funcionando  
✅ **Frontend:** Conectado correctamente  

### Próximos Pasos
1. Monitorea los logs durante las primeras horas
2. Prueba todos los flujos críticos de usuario
3. Configura alertas para errores críticos
4. Considera configurar un dominio personalizado
5. Documenta cualquier issue encontrado

---

## 📚 Referencias Rápidas

- [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) - Guía rápida de despliegue
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa de despliegue
- [Render Dashboard](https://dashboard.render.com/)
- [Render Docs](https://render.com/docs)
