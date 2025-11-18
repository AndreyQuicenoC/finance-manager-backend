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

## Categorías (Categories)

Todos los endpoints de categorías están bajo el prefijo `/api/category` y requieren autenticación.

### 1. Crear Categoría

**POST** `/api/category`

Crea una nueva categoría.

**Headers:**
```
Content-Type: application/json
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "tipo": "Ingresos"
}
```

**Campos requeridos:**
- `tipo`: Tipo o nombre de la categoría (string)

**Respuesta exitosa (201):**
```json
{
  "message": "Categoría creada exitosamente",
  "category": {
    "id": 1,
    "tipo": "Ingresos",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `400`: Falta el campo 'tipo'
- `401`: No autenticado
- `500`: Error al crear categoría

---

### 2. Obtener Todas las Categorías

**GET** `/api/category`

Obtiene todas las categorías con sus cuentas asociadas.

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "tipo": "Ingresos",
    "accounts": [
      {
        "id": 1,
        "name": "Cuenta de Ahorros",
        "money": 1000.50
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Errores:**
- `401`: No autenticado
- `500`: Error al obtener categorías

---

### 3. Obtener Categoría por ID

**GET** `/api/category/:id`

Obtiene una categoría específica por su ID.

**URL Parameters:**
- `id`: ID de la categoría (número)

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "tipo": "Ingresos",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores:**
- `401`: No autenticado
- `404`: Categoría no encontrada
- `500`: Error al obtener categoría

---

### 4. Actualizar Categoría

**PUT** `/api/category/:id`

Actualiza una categoría existente.

**URL Parameters:**
- `id`: ID de la categoría a actualizar (número)

**Headers:**
```
Content-Type: application/json
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "tipo": "Gastos"
}
```

**Campos opcionales:**
- `tipo`: Nuevo tipo de categoría. Si no se proporciona, se mantiene el valor actual.

**Respuesta exitosa (200):**
```json
{
  "message": "Categoría actualizada",
  "category": {
    "id": 1,
    "tipo": "Gastos",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `401`: No autenticado
- `404`: Categoría no encontrada
- `500`: Error al actualizar categoría

---

### 5. Eliminar Categoría

**DELETE** `/api/category/:id`

Elimina una categoría del sistema.

**URL Parameters:**
- `id`: ID de la categoría a eliminar (número)

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "message": "Categoría eliminada correctamente"
}
```

**Errores:**
- `401`: No autenticado
- `500`: Error al eliminar categoría

---

## Transacciones (Transactions)

Todos los endpoints de transacciones están bajo el prefijo `/api/transactions` y requieren autenticación.

### 1. Crear Transacción

**POST** `/api/transactions`

Crea una nueva transacción y actualiza automáticamente el saldo de la cuenta asociada.

**Headers:**
```
Content-Type: application/json
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "amount": 100.50,
  "isIncome": true,
  "transactionDate": "2024-01-01",
  "description": "Pago de salario",
  "tagId": 1
}
```

**Campos requeridos:**
- `amount`: Monto de la transacción (número)
- `isIncome`: Si es ingreso (`true`) o gasto (`false`) (boolean)
- `transactionDate`: Fecha de la transacción (string en formato fecha)
- `tagId`: ID del tag asociado (número)

**Campos opcionales:**
- `description`: Descripción de la transacción (string)

**Respuesta exitosa (201):**
```json
{
  "message": "Transacción creada",
  "transaction": {
    "id": 1,
    "amount": 100.50,
    "isIncome": true,
    "transactionDate": "2024-01-01T00:00:00.000Z",
    "description": "Pago de salario",
    "tagId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `401`: No autenticado
- `404`: Cuenta o tag no encontrada
- `409`: Dinero insuficiente en la cuenta (cuando el saldo quedaría negativo)
- `500`: Error al crear transacción

**Nota:** El saldo de la cuenta asociada se actualiza automáticamente:
- Si `isIncome` es `true`: se suma el monto a la cuenta
- Si `isIncome` es `false`: se resta el monto de la cuenta

---

### 2. Obtener Todas las Transacciones

**GET** `/api/transactions`

Obtiene todas las transacciones del sistema.

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "amount": 100.50,
    "isIncome": true,
    "transactionDate": "2024-01-01T00:00:00.000Z",
    "description": "Pago de salario",
    "tagId": 1,
    "tag": {
      "id": 1,
      "name": "Salario"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Errores:**
- `401`: No autenticado
- `500`: Error al obtener transacciones

---

### 3. Obtener Transacción por ID

**GET** `/api/transactions/:id`

Obtiene una transacción específica por su ID.

**URL Parameters:**
- `id`: ID de la transacción (número)

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "amount": 100.50,
  "isIncome": true,
  "transactionDate": "2024-01-01T00:00:00.000Z",
  "description": "Pago de salario",
  "tagId": 1,
  "tag": {
    "id": 1,
    "name": "Salario"
  }
}
```

**Errores:**
- `401`: No autenticado
- `404`: Transacción no encontrada
- `500`: Error al obtener transacción

---

### 4. Obtener Transacciones por Fecha

**GET** `/api/transactions/byDate?date=2024-01-01`

Obtiene todas las transacciones de una fecha específica.

**Query Parameters:**
- `date`: Fecha en formato YYYY-MM-DD (requerido)

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "amount": 100.50,
    "isIncome": true,
    "transactionDate": "2024-01-01T00:00:00.000Z",
    "tag": {
      "id": 1,
      "name": "Salario"
    }
  }
]
```

**Errores:**
- `400`: Falta el parámetro 'date'
- `401`: No autenticado
- `500`: Error al obtener transacciones

---

### 5. Obtener Transacciones por Tipo y Fecha

**GET** `/api/transactions/byTypeDate?date=2024-01-01&type=income`

Obtiene transacciones filtradas por tipo (ingreso o gasto) y fecha.

**Query Parameters:**
- `date`: Fecha en formato YYYY-MM-DD (requerido)
- `type`: Tipo de transacción: `"income"` o `"expense"` (requerido)

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "amount": 100.50,
    "isIncome": true,
    "transactionDate": "2024-01-01T00:00:00.000Z",
    "tag": {
      "id": 1,
      "name": "Salario"
    }
  }
]
```

**Errores:**
- `400`: 
  - Faltan parámetros 'date' o 'type'
  - El parámetro 'type' debe ser 'income' o 'expense'
- `401`: No autenticado
- `500`: Error al obtener transacciones

---

### 6. Actualizar Transacción

**PUT** `/api/transactions/:id`

Actualiza una transacción existente y ajusta automáticamente el saldo de la cuenta.

**URL Parameters:**
- `id`: ID de la transacción a actualizar (número)

**Headers:**
```
Content-Type: application/json
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "amount": 200.00,
  "isIncome": false,
  "transactionDate": "2024-01-02",
  "description": "Compra actualizada",
  "tagId": 2
}
```

**Campos opcionales (solo se actualizan los enviados):**
- `amount`: Nuevo monto
- `isIncome`: Nuevo tipo (true/false)
- `transactionDate`: Nueva fecha
- `description`: Nueva descripción
- `tagId`: Nuevo tag

**Respuesta exitosa (200):**
```json
{
  "message": "Transacción actualizada correctamente",
  "transaction": {
    "id": 1,
    "amount": 200.00,
    "isIncome": false,
    "transactionDate": "2024-01-02T00:00:00.000Z",
    "description": "Compra actualizada",
    "tagId": 2,
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Errores:**
- `400`: 
  - ID inválido
  - No se enviaron campos para actualizar
- `401`: No autenticado
- `404`: 
  - Transacción no encontrada
  - Transacción anterior no encontrada
  - Cuenta o tag no encontrada
- `409`: Dinero insuficiente en la cuenta
- `500`: Error al actualizar la transacción

**Nota:** Al actualizar, primero se revierte el efecto de la transacción anterior y luego se aplica el nuevo efecto.

---

### 7. Eliminar Transacción

**DELETE** `/api/transactions/:id`

Elimina una transacción y revierte automáticamente su efecto en el saldo de la cuenta.

**URL Parameters:**
- `id`: ID de la transacción a eliminar (número)

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "message": "Transacción eliminada"
}
```

**Errores:**
- `401`: No autenticado
- `404`: 
  - Transacción no encontrada
  - Transacción, tag o cuenta no encontrada
- `409`: La eliminación deja el saldo en negativo
- `500`: Error al eliminar transacción

**Nota:** Al eliminar, se revierte el efecto de la transacción en la cuenta:
- Si era ingreso: se resta el monto
- Si era gasto: se suma el monto

---

## TagPocket (Tags)

Todos los endpoints de tags están bajo el prefijo `/api/tag` y requieren autenticación.

### 1. Crear TagPocket

**POST** `/api/tag`

Crea un nuevo tag asociado a una cuenta.

**Headers:**
```
Content-Type: application/json
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "name": "Comida",
  "description": "Gastos en comida y restaurantes",
  "accountId": 1
}
```

**Campos requeridos:**
- `name`: Nombre del tag (string)
- `accountId`: ID de la cuenta asociada (número)

**Campos opcionales:**
- `description`: Descripción del tag (string)

**Respuesta exitosa (201):**
```json
{
  "message": "TagPocket creado",
  "tag": {
    "id": 1,
    "name": "Comida",
    "description": "Gastos en comida y restaurantes",
    "accountId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `400`: Faltan accountId o name
- `401`: No autenticado
- `500`: Error al crear TagPocket

---

### 2. Obtener Tags por Cuenta

**GET** `/api/tag/:id`

Obtiene todos los tags asociados a una cuenta específica.

**URL Parameters:**
- `id`: ID de la cuenta (número) - **Nota:** Este parámetro representa el `accountId`

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "Comida",
    "description": "Gastos en comida y restaurantes",
    "accountId": 1,
    "transactions": [
      {
        "id": 1,
        "amount": 50.00,
        "isIncome": false
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Errores:**
- `401`: No autenticado
- `500`: Error al obtener TagPockets

---

### 3. Actualizar TagPocket

**PUT** `/api/tag/:id`

Actualiza un tag existente.

**URL Parameters:**
- `id`: ID del tag a actualizar (número)

**Headers:**
```
Content-Type: application/json
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "name": "Comida y Bebidas",
  "description": "Descripción actualizada"
}
```

**Campos opcionales:**
- `name`: Nuevo nombre del tag. Si no se proporciona, se mantiene el valor actual.
- `description`: Nueva descripción. Si no se proporciona, se mantiene el valor actual.

**Respuesta exitosa (200):**
```json
{
  "message": "TagPocket actualizado",
  "tag": {
    "id": 1,
    "name": "Comida y Bebidas",
    "description": "Descripción actualizada",
    "accountId": 1,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errores:**
- `401`: No autenticado
- `404`: TagPocket no encontrado
- `500`: Error al actualizar TagPocket

---

### 4. Eliminar TagPocket

**DELETE** `/api/tag/:id`

Elimina un tag del sistema.

**URL Parameters:**
- `id`: ID del tag a eliminar (número)

**Headers:**
```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta exitosa (200):**
```json
{
  "message": "TagPocket eliminado"
}
```

**Errores:**
- `401`: No autenticado
- `500`: Error al eliminar TagPocket

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
| 409 | Conflict - Conflicto con el estado actual (ej: saldo insuficiente) |
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

### Ejemplo: Crear categoría

```javascript
const categoryResponse = await fetch('http://localhost:3000/api/category', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tipo: 'Ingresos'
  })
});

const categoryData = await categoryResponse.json();
console.log('Categoría creada:', categoryData.category);
```

### Ejemplo: Crear transacción

```javascript
const transactionResponse = await fetch('http://localhost:3000/api/transactions', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 100.50,
    isIncome: true,
    transactionDate: '2024-01-01',
    description: 'Pago de salario',
    tagId: 1
  })
});

const transactionData = await transactionResponse.json();
console.log('Transacción creada:', transactionData.transaction);
```

### Ejemplo: Obtener transacciones por fecha

```javascript
const transactionsResponse = await fetch('http://localhost:3000/api/transactions/byDate?date=2024-01-01', {
  method: 'GET',
  credentials: 'include'
});

const transactionsData = await transactionsResponse.json();
console.log('Transacciones:', transactionsData);
```

### Ejemplo: Crear tag

```javascript
const tagResponse = await fetch('http://localhost:3000/api/tag', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Comida',
    description: 'Gastos en comida',
    accountId: 1
  })
});

const tagData = await tagResponse.json();
console.log('Tag creado:', tagData.tag);
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

