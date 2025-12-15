# 🛡️ Panel de Administración – Finance Manager Backend

Este documento explica **cómo consumir los nuevos endpoints de administración** y cómo funciona el flujo de autenticación para **usuarios**, **administradores** y **súper administradores**.

---

## 1. Roles y tipos de token

- **Roles soportados**
  - `user`: usuario normal. id = 3 en la db en la tabla role
  - `admin`: administrador. id = 2 en la db en la tabla role
  - `super_admin`: súper administrador (máximo nivel). id = 4 en la db en la tabla role

- **Tokens y cookies**
  - Login de usuario normal:
    - Endpoint: `POST /api/auth/login`
    - Cookie: **`authToken`** (firmada con `JWT_SECRET`).
    - Protege rutas normales (`/api/accounts`, `/api/transactions`, `/api/tags`, etc.) vía `verifyToken`.
  - Login de administrador:
    - Endpoint: `POST /api/auth/admin/login`
    - Cookie: **`adminAuthToken`** (firmada con `JWT_ADMIN_SECRET` si existe, o `JWT_SECRET`).
    - Protege rutas `/api/admin/**` vía:
      - `verifyAdmin`: requiere rol `admin` o `super_admin`.
      - `verifySuperAdmin`: requiere rol `super_admin`.

- **Base URL local (por defecto)**
  - `http://localhost:3001`

> Para consumir estos endpoints desde el frontend o herramientas como Postman, es importante **enviar cookies** (`withCredentials: true` en axios, `credentials: 'include'` en fetch, etc.).

---

## 2. Login de usuario normal

### 2.1 Endpoint

- **POST** `/api/auth/login`

**Body de ejemplo**

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Respuesta 200 (además setea `authToken` en cookie)**

```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "User",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 3. Login de administrador

### 3.1 Endpoint

- **POST** `/api/auth/admin/login`

**Body de ejemplo**

```json
{
  "email": "admin@example.com",
  "password": "Password123!"
}
```

**Requisitos**

- El usuario debe tener rol `admin` o `super_admin` (tabla `Role`):
  - Si no, responde **403**:

```json
{ "error": "Acceso restringido a administradores" }
```

**Respuesta 200 (además setea `adminAuthToken` en cookie)**

```json
{
  "message": "Inicio de sesión de administrador exitoso",
  "user": {
    "id": 2,
    "email": "admin@example.com",
    "nickname": "Admin",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "role": "admin"
  }
}
```

> A partir de aquí, todas las peticiones al panel admin (`/api/admin/**`) deben incluir la cookie `adminAuthToken`.

---

## 4. Bootstrap del súper administrador

El sistema asume que existe al menos un usuario con rol **`super_admin`** que puede:

- Crear administradores (`POST /api/admin/admins`).
- Eliminar administradores (`DELETE /api/admin/admins/:id`).

Pasos típicos para crear el primer súper admin:

1. Crear un usuario normal (signup / insert en DB).
2. En la tabla `Role`, asegurarse de tener un registro con `name = 'super_admin'`.
3. Asignar el `roleId` de ese rol al usuario creado.
4. Hacer login con `POST /api/auth/admin/login` usando ese usuario → obtendrás `adminAuthToken` con rol `super_admin`.

---

## 5. Endpoints del panel de administración (`/api/admin`)

Todas estas rutas:

- Requieren cookie **`adminAuthToken`** válida.
- Están montadas bajo el prefijo: `/api/admin`.

### 5.1 Historial de logeos / sesiones

- **GET** `/api/admin/logs/login`
- **Rol requerido**: `admin` o `super_admin` (`verifyAdmin`).
- **Query opcional**:
  - `userId`: filtra por id de usuario.

**Ejemplos cURL**

- Todos los logs:

```bash
curl -X GET http://localhost:3001/api/admin/logs/login \
  --cookie "adminAuthToken=TU_TOKEN_AQUI"
```

- Logs de un usuario:

```bash
curl -X GET "http://localhost:3001/api/admin/logs/login?userId=1" \
  --cookie "adminAuthToken=TU_TOKEN_AQUI"
```

**Respuesta 200 (resumida)**

```json
{
  "logs": [
    {
      "id": 1,
      "userId": 1,
      "deviceId": "web-client",
      "userAgent": "Mozilla/5.0...",
      "ip": "127.0.0.1",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastUsedAt": "2025-01-01T01:00:00.000Z",
      "expiresAt": "2025-01-08T00:00:00.000Z",
      "revoke": false
    }
  ]
}
```

> Estos datos provienen de la tabla `UserSession`, que se rellena automáticamente en `login` y `adminLogin`.

---

### 5.2 Gestión de usuarios (admin)

#### 5.2.1 Obtener todos los usuarios

- **GET** `/api/admin/users`
- **Rol requerido**: `admin` o `super_admin`.

```bash
curl -X GET http://localhost:3001/api/admin/users \
  --cookie "adminAuthToken=TU_TOKEN_AQUI"
```

**Respuesta 200**

```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "nickname": "User",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "role": { "name": "user" }
    },
    {
      "id": 2,
      "email": "admin@example.com",
      "nickname": "Admin",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "role": { "name": "admin" }
    }
  ]
}
```

#### 5.2.2 Eliminar (lógicamente) un usuario

- **DELETE** `/api/admin/users/:id`
- **Rol requerido**: `admin` o `super_admin`.
- Realiza un **borrado lógico** (update del usuario marcándolo como eliminado).

```bash
curl -X DELETE http://localhost:3001/api/admin/users/5 \
  --cookie "adminAuthToken=TU_TOKEN_AQUI"
```

**Respuesta 200**

```json
{ "message": "Usuario eliminado correctamente" }
```

---

### 5.3 Estadísticas de reseteo de contraseña

- **GET** `/api/admin/stats/password-resets`
- **Rol requerido**: `admin` o `super_admin`.

```bash
curl -X GET http://localhost:3001/api/admin/stats/password-resets \
  --cookie "adminAuthToken=TU_TOKEN_AQUI"
```

**Respuesta 200**

```json
{
  "totalResets": 5,
  "byUser": [
    { "userId": 1, "resetCount": 3 },
    { "userId": 2, "resetCount": 2 }
  ]
}
```

> Estos datos usan la tabla `PasswordReset`, que se llena en `recoverPass` y se marca como `used` en `resetPass`.

---

### 5.4 Estadísticas generales (transacciones / usuarios / admins)

- **GET** `/api/admin/stats/overview`
- **Rol requerido**: `admin` o `super_admin`.
- **Query obligatoria**:
  - `from`: fecha inicio (`YYYY-MM-DD`)
  - `to`: fecha fin (`YYYY-MM-DD`)

```bash
curl -X GET "http://localhost:3001/api/admin/stats/overview?from=2025-01-01&to=2025-01-31" \
  --cookie "adminAuthToken=TU_TOKEN_AQUI"
```

**Respuesta 200**

```json
{
  "transactionsCount": 123,
  "totalUsers": 50,
  "adminCount": 3,
  "from": "2025-01-01T00:00:00.000Z",
  "to": "2025-01-31T00:00:00.000Z"
}
```

---

## 6. Gestión de administradores (solo súper admin)

Estas rutas requieren rol **`super_admin`** y usan el middleware `verifySuperAdmin`.

### 6.1 Crear un nuevo administrador

- **POST** `/api/admin/admins`
- **Rol requerido**: `super_admin`.

**Body**

```json
{
  "email": "nuevo.admin@example.com",
  "password": "Password123!",
  "nickname": "NuevoAdmin"
}
```

**Ejemplo cURL**

```bash
curl -X POST http://localhost:3001/api/admin/admins \
  -H "Content-Type: application/json" \
  --cookie "adminAuthToken=TOKEN_DE_SUPER_ADMIN" \
  -d '{
    "email": "nuevo.admin@example.com",
    "password": "Password123!",
    "nickname": "NuevoAdmin"
  }'
```

**Respuesta 201**

```json
{
  "message": "Administrador creado exitosamente",
  "user": {
    "id": 10,
    "email": "nuevo.admin@example.com",
    "nickname": "NuevoAdmin",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 6.2 Eliminar un administrador

- **DELETE** `/api/admin/admins/:id`
- **Rol requerido**: `super_admin`.
- Solo permite eliminar usuarios cuyo rol actual sea `admin`.

```bash
curl -X DELETE http://localhost:3001/api/admin/admins/10 \
  --cookie "adminAuthToken=TOKEN_DE_SUPER_ADMIN"
```

**Respuesta 200**

```json
{ "message": "Administrador eliminado correctamente" }
```

---

## 7. Resumen rápido para frontend

1. **Login usuario normal**
   - `POST /api/auth/login` → cookie `authToken`.
   - Consumir endpoints normales con cookies (`credentials: 'include'`).
2. **Login admin/súper admin**
   - `POST /api/auth/admin/login` → cookie `adminAuthToken`.
   - Consumir `/api/admin/**` con cookies (`credentials: 'include'`).
3. **Primer súper admin**
   - Crear usuario + asignar rol `super_admin` en DB.
   - Loguearse con `/api/auth/admin/login`.
   - A partir de ahí, usar `/api/admin/admins` para crear/eliminar otros admins.


