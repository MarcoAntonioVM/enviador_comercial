# ⚡ Inicio Rápido - 5 Minutos

## 🎯 Credenciales de Prueba

Una vez configurado, usa estas credenciales:

### 👨‍💼 Usuario Administrador
```
Email: admin@example.com
Password: Admin123!
```

### 👤 Usuario Comercial
```
Email: comercial@example.com
Password: Comercial123!
```

## 🚀 Instalación Express (3 Pasos)

### 1️⃣ Crear archivo .env
Crea un archivo `.env` en la raíz del proyecto:

```bash
# Windows (PowerShell)
notepad .env

# Linux/Mac
nano .env
```

Pega este contenido (CAMBIA `DB_PASSWORD` por tu contraseña de MySQL):

```env
NODE_ENV=development
PORT=3000
API_VERSION=v1

DB_HOST=localhost
DB_PORT=3306
DB_NAME=envios_commercial
DB_USER=root
DB_PASSWORD=TU_PASSWORD_AQUI

JWT_SECRET=mi-super-secreto-jwt-cambiar-en-produccion-2026
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5

CORS_ORIGIN=http://localhost:3000
```

### 2️⃣ Instalar y configurar

```bash
# Instalar dependencias
npm install

# Crear base de datos
mysql -u root -p < envios_commercial.sql

# Crear usuarios de prueba
node scripts/create-admin.js

# (Opcional) Insertar datos de ejemplo
node scripts/seed-data.js
```

### 3️⃣ Iniciar servidor

```bash
npm run dev
```

## 🎉 ¡Listo! Probar la API

### Opción 1: Swagger (Interfaz Visual)
Abre en tu navegador:
```
http://localhost:3000/api-docs
```

1. Click en `POST /api/v1/auth/login`
2. Click en "Try it out"
3. Usa las credenciales:
   ```json
   {
     "email": "admin@example.com",
     "password": "Admin123!"
   }
   ```
4. Copia el `accessToken`
5. Click en "Authorize" (arriba a la derecha)
6. Pega el token
7. ¡Ahora puedes probar todos los endpoints!

### Opción 2: cURL (Terminal)

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# 2. Copiar el accessToken de la respuesta y usarlo:
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Opción 3: Postman/Insomnia

1. POST `http://localhost:3000/api/v1/auth/login`
2. Body (JSON):
   ```json
   {
     "email": "admin@example.com",
     "password": "Admin123!"
   }
   ```
3. Copiar el `accessToken`
4. En siguientes peticiones, agregar header:
   ```
   Authorization: Bearer TU_TOKEN_AQUI
   ```

## 📋 Endpoints Principales

```
Health Check:  GET    /health
API Docs:      GET    /api-docs

Auth:
  Login:       POST   /api/v1/auth/login
  Logout:      POST   /api/v1/auth/logout
  Me:          GET    /api/v1/auth/me

Users:         GET    /api/v1/users
Prospects:     GET    /api/v1/prospects
Campaigns:     GET    /api/v1/campaigns
Sectors:       GET    /api/v1/sectors
Templates:     GET    /api/v1/templates
Senders:       GET    /api/v1/senders
```

## 🔧 Comandos Útiles

```bash
# Desarrollo (auto-reload)
npm run dev

# Producción
npm start

# Ver logs en desarrollo
npm run dev | grep "INFO"

# Crear más usuarios
node scripts/create-admin.js

# Resetear datos de ejemplo
node scripts/seed-data.js
```

## ❓ Problemas Comunes

### "Cannot connect to database"
→ Revisa que MySQL esté corriendo y que `DB_PASSWORD` en `.env` sea correcto

### "Port 3000 already in use"
→ Cambia `PORT=3001` en `.env` o detén el otro proceso

### "JWT_SECRET is not defined"
→ Verifica que el archivo `.env` exista en la raíz del proyecto

### No puedo hacer login
→ Verifica que ejecutaste `node scripts/create-admin.js`

## 🎓 Siguiente Paso

¡Explora la API en Swagger! Ahí verás todos los endpoints con ejemplos y podrás probarlos directamente:

**http://localhost:3000/api-docs**

---

**¿Dudas?** Revisa el archivo `INSTALL.md` para más detalles.
