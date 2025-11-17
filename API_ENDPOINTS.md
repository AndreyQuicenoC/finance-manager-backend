# API Endpoints Documentation

Documentación completa de los endpoints del backend para uso en el frontend.

## Base URL

```
http://localhost:3000
```

## Autenticación

Todos los endpoints de autenticación están bajo el prefijo `/api/auth` (nota: asegúrate de que estas rutas estén registradas en `app.ts`).

### 1. Registro de Usuario

**POST** `/api/auth/signup`

Registra un nuevo usuario en el sistema.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "Password123!",
  "nickname": "juan_perez"
}
```

**Validaciones:**
- `email` (requerido): Debe ser un email válido y único
- `password` (requerido): Debe tener al menos 8 caracteres, contener mayúscula, minúscula, número y carácter especial
- `nickname` (opcional): Si se proporciona, debe tener al menos 2 caracteres

**Respuesta exitosa (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "nickname": "juan_perez",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `400`: El correo electrónico ya está registrado
- `500`: Error al registrar usuario

---

### 2. Inicio de Sesión

**POST** `/api/auth/login`

Inicia sesión con credenciales de usuario. El token se guarda automáticamente en una cookie HTTP-only.

**Headers:**
```
Content-Type: application/json
```

**Body (formato 1 - recomendado):**
```json
{
  "email": "juan@example.com",
  "password": "Password123!"
}
```

**Body (formato 2 - compatible):**
```json
{
  "correoElectronico": "juan@example.com",
  "contraseña": "Password123!"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "nickname": "juan_perez",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Cookie establecida:**
- Nombre: `authToken`
- HttpOnly: `true`
- Secure: `true` (en producción)
- SameSite: `none` (en producción) / `lax` (en desarrollo)
- MaxAge: 24 horas

**Errores:**
- `400`: Correo electrónico y contraseña son requeridos
- `401`: Credenciales inválidas
- `500`: Error al iniciar sesión

---

### 3. Cerrar Sesión

**POST** `/api/auth/logout`

Cierra la sesión del usuario eliminando la cookie de autenticación.

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

**Nota:** Requiere autenticación (cookie `authToken`).

---

### 4. Obtener Perfil de Usuario

**GET** `/api/auth/profile`

Obtiene la información del perfil del usuario autenticado.

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "nickname": "juan_perez",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `401`: No autenticado
- `404`: Usuario no encontrado
- `500`: Error al obtener perfil

**Nota:** Requiere autenticación (cookie `authToken`).

---

### 5. Recuperar Contraseña

**POST** `/api/auth/recover`

Envía un email con un enlace para restablecer la contraseña.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "juan@example.com"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Revisa tu correo para continuar"
}
```

**Respuesta si el email no existe (202):**
```json
{
  "message": "Si el correo es válido recibirá instrucciones"
}
```

**Errores:**
- `400`: El email es requerido
- `500`: Inténtalo de nuevo más tarde

**Nota:** Por seguridad, siempre devuelve el mismo mensaje independientemente de si el email existe o no.

---

### 6. Restablecer Contraseña

**POST** `/api/auth/reset/:token`

Restablece la contraseña usando el token recibido por email.

**URL Parameters:**
- `token`: Token JWT recibido por email (válido por 1 hora)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Validaciones:**
- `password` y `confirmPassword` deben coincidir
- `password` debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial

**Respuesta exitosa (200):**
```json
{
  "message": "Contraseña actualizada"
}
```

**Errores:**
- `400`: 
  - La contraseña y confirmación son requeridas
  - Las contraseñas no coinciden
  - La contraseña no cumple los requisitos
  - Token inválido o expirado
- `404`: Usuario no encontrado
- `500`: Inténtalo de nuevo más tarde

---

## Cuentas (Accounts)

Todos los endpoints de cuentas están bajo el prefijo `/api/account` y requieren autenticación.

### 1. Crear Cuenta

**POST** `/api/account`

Crea una nueva cuenta financiera para el usuario.

**Headers:**
```
Content-Type: application/json
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "name": "Cuenta de Ahorros",
  "money": 1000.50,
  "userId": 1,
  "categoryId": 1
}
```

**Campos requeridos:**
- `userId`: ID del usuario (número)
- `categoryId`: ID de la categoría (número)

**Campos opcionales:**
- `name`: Nombre de la cuenta (string)
- `money`: Saldo inicial (número, default: 0)

**Respuesta exitosa (201):**
```json
{
  "message": "Cuenta creada exitosamente",
  "account": {
    "id": 1,
    "name": "Cuenta de Ahorros",
    "money": 1000.50,
    "userId": 1,
    "categoryId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `400`: Faltan userId o categoryId
- `401`: No autenticado
- `500`: Error al crear cuenta

---

### 2. Obtener Cuentas por Usuario

**GET** `/api/account/:userId`

Obtiene todas las cuentas de un usuario específico.

**URL Parameters:**
- `userId`: ID del usuario (número) - se pasa en la URL

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "Cuenta de Ahorros",
    "money": 1000.50,
    "userId": 1,
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "Ahorros"
    },
    "tags": [
      {
        "id": 1,
        "name": "principal"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Errores:**
- `401`: No autenticado
- `500`: Error al obtener cuentas

---

### 3. Actualizar Cuenta

**PUT** `/api/account/:id`

Actualiza los datos de una cuenta existente.

**URL Parameters:**
- `id`: ID de la cuenta a actualizar (número)

**Headers:**
```
Content-Type: application/json
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "name": "Cuenta Actualizada",
  "money": 2000.00,
  "categoryId": 2
}
```

**Campos opcionales:**
- `name`: Nuevo nombre de la cuenta
- `money`: Nuevo saldo
- `categoryId`: Nueva categoría

**Nota:** Si no se proporciona un campo, se mantiene el valor actual.

**Respuesta exitosa (200):**
```json
{
  "message": "Cuenta actualizada",
  "account": {
    "id": 1,
    "name": "Cuenta Actualizada",
    "money": 2000.00,
    "userId": 1,
    "categoryId": 2,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `400`: ID requerido en parámetros de URL
- `401`: No autenticado
- `404`: Cuenta no encontrada
- `500`: Error al actualizar cuenta

---

### 4. Eliminar Cuenta

**DELETE** `/api/account/:id`

Elimina una cuenta del sistema.

**URL Parameters:**
- `id`: ID de la cuenta a eliminar (número) - se pasa en la URL

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "message": "Cuenta eliminada"
}
```

**Errores:**
- `400`: ID requerido en parámetros de URL
- `401`: No autenticado
- `500`: Error al eliminar cuenta

---

## Endpoints Generales

### 1. Health Check

**GET** `/health`

Verifica el estado del servidor.

**Respuesta exitosa (200):**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

### 2. Root Endpoint

**GET** `/`

Información básica de la API.

**Respuesta exitosa (200):**
```json
{
  "message": "Finance Manager Backend API"
}
```

---

## Autenticación con Cookies

El sistema utiliza cookies HTTP-only para la autenticación. Esto significa que:

1. **No necesitas enviar el token manualmente** en los headers después del login
2. **El navegador envía automáticamente** la cookie `authToken` en cada request
3. **La cookie es segura** y no es accesible desde JavaScript (previene XSS)

### Configuración en el Frontend

Para que las cookies funcionen correctamente:

1. **Asegúrate de que las requests incluyan credenciales:**
   ```javascript
   // Con fetch
   fetch('http://localhost:3000/api/auth/login', {
     method: 'POST',
     credentials: 'include', // Importante!
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ email, password })
   });

   // Con axios
   axios.defaults.withCredentials = true;
   ```

2. **CORS debe estar configurado** en el backend para aceptar credenciales:
   ```javascript
   app.use(cors({
     credentials: true,
     origin: 'http://localhost:3000' // URL de tu frontend
   }));
   ```

---

## Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Request exitoso |
| 201 | Created - Recurso creado exitosamente |
| 202 | Accepted - Request aceptado (usado en recover para seguridad) |
| 400 | Bad Request - Datos inválidos o faltantes |
| 401 | Unauthorized - No autenticado o token inválido |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## Ejemplos de Uso

### Ejemplo: Login y obtener perfil

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@example.com',
    password: 'Password123!'
  })
});

const loginData = await loginResponse.json();
console.log('Usuario logueado:', loginData.user);

// 2. Obtener perfil (la cookie se envía automáticamente)
const profileResponse = await fetch('http://localhost:3000/api/auth/profile', {
  method: 'GET',
  credentials: 'include'
});

const profileData = await profileResponse.json();
console.log('Perfil:', profileData.user);
```

### Ejemplo: Crear cuenta

```javascript
const accountResponse = await fetch('http://localhost:3000/api/account', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Cuenta de Ahorros',
    money: 1000,
    userId: 1,
    categoryId: 1
  })
});

const accountData = await accountResponse.json();
console.log('Cuenta creada:', accountData.account);
```

### Ejemplo: Actualizar cuenta

```javascript
const updateResponse = await fetch('http://localhost:3000/api/account/1', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Cuenta Actualizada',
    money: 2000
  })
});

const updateData = await updateResponse.json();
console.log('Cuenta actualizada:', updateData.account);
```

### Ejemplo: Eliminar cuenta

```javascript
const deleteResponse = await fetch('http://localhost:3000/api/account/1', {
  method: 'DELETE',
  credentials: 'include'
});

const deleteData = await deleteResponse.json();
console.log('Resultado:', deleteData.message);
```

---

## Notas Importantes

1. **Rutas de Autenticación:** Las rutas de autenticación (`/api/auth/*`) están registradas y funcionando correctamente.

2. **Orden de Middlewares:** Todas las rutas de cuentas tienen el middleware `verifyToken` antes del controlador para asegurar autenticación.

3. **Validación de Contraseñas:** Las contraseñas deben cumplir:
   - Mínimo 8 caracteres
   - Al menos una mayúscula
   - Al menos una minúscula
   - Al menos un número
   - Al menos un carácter especial: `@$!%*?&#.`

4. **Tokens JWT:** Los tokens expiran después de 7 días (login/signup) o 1 hora (reset password).

---

## Soporte

Para más información sobre el backend, consulta el [README.md](./README.md) principal.

