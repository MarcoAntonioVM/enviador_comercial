# 📦 Guía de Instalación - Enviador Comercial API

## Paso 1: Crear el archivo .env

Crea un archivo llamado `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=envios_commercial
DB_USER=root
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=mi-super-secreto-jwt-cambiar-en-produccion-2026
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5

# Email Configuration (Brevo)
BREVO_API_KEY=
BREVO_WEBHOOK_SECRET=

# App Configuration
TRACKING_DOMAIN=
DEFAULT_TIMEZONE=America/Mexico_City
EMAIL_DAILY_LIMIT=2000

# CORS
CORS_ORIGIN=http://localhost:3000

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

**⚠️ IMPORTANTE:** 
- Cambia `DB_PASSWORD=` por tu contraseña de MySQL
- En producción, cambia `JWT_SECRET` por un valor más seguro

## Paso 2: Instalar dependencias

```bash
npm install
```

## Paso 3: Crear la base de datos

```bash
# Opción 1: Desde la línea de comandos
mysql -u root -p < envios_commercial.sql

# Opción 2: Desde MySQL Workbench o phpMyAdmin
# Importa el archivo envios_commercial.sql
```

## Paso 4: Crear usuarios de prueba

Ejecuta el script para crear usuarios de prueba:

```bash
node scripts/create-admin.js
```

Esto creará dos usuarios:

**ADMINISTRADOR:**
- Email: `admin@example.com`
- Password: `Admin123!`
- Rol: admin (acceso completo)

**COMERCIAL:**
- Email: `comercial@example.com`
- Password: `Comercial123!`
- Rol: commercial (gestión de campañas y prospectos)

## Paso 5: Iniciar el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

## Paso 6: Verificar instalación

### Health Check
```bash
curl http://localhost:3000/health
```

### Login de prueba
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

### Documentación Swagger
Abre en tu navegador:
```
http://localhost:3000/api-docs
```

## 🎯 Credenciales de Prueba

### Usuario Administrador
```
Email: admin@example.com
Password: Admin123!
Permisos: Acceso completo al sistema
```

### Usuario Comercial
```
Email: comercial@example.com
Password: Comercial123!
Permisos: Gestión de prospectos, campañas y plantillas
```

## 🔧 Solución de Problemas

### Error: Cannot connect to database
- Verifica que MySQL esté corriendo
- Revisa las credenciales en `.env`
- Verifica que la base de datos `envios_commercial` exista

### Error: JWT_SECRET is not defined
- Asegúrate de que el archivo `.env` existe
- Verifica que la variable `JWT_SECRET` esté definida

### Error: Table doesn't exist
- Ejecuta el script SQL: `envios_commercial.sql`
- O ejecuta: `mysql -u root -p envios_commercial < envios_commercial.sql`

### Puerto 3000 ya en uso
- Cambia `PORT=3000` en `.env` a otro puerto (ej: `PORT=3001`)
- O detén el proceso que usa el puerto 3000

## 📝 Siguiente Paso: Probar la API

Una vez iniciado el servidor, puedes:

1. **Usar Swagger UI** (recomendado para principiantes)
   - Ir a: http://localhost:3000/api-docs
   - Click en "Authorize"
   - Login y copiar el token
   - Probar los endpoints

2. **Usar Postman o Insomnia**
   - Importar la colección desde Swagger
   - Hacer login para obtener token
   - Usar el token en el header: `Authorization: Bearer <token>`

3. **Usar cURL**
   ```bash
   # Login
   TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"Admin123!"}' \
     | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
   
   # Listar usuarios
   curl http://localhost:3000/api/v1/users \
     -H "Authorization: Bearer $TOKEN"
   ```

## 🚀 ¡Listo!

Tu API está corriendo y lista para usar. Visita http://localhost:3000/api-docs para ver toda la documentación.
