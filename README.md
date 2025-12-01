# Hotel DC Company - Sistema de Gestión Hotelera

Proyecto completo con backend Node.js + Express + MySQL y frontend React + Vite

## Estructura del Proyecto

\`\`\`
hotel-dc-company/
├── backend/           # API REST con Node.js + Express
│   ├── config/        # Configuración de base de datos
│   ├── routes/        # Rutas de la API
│   ├── middleware/    # Middlewares de autenticación
│   ├── index.js       # Servidor principal
│   └── package.json
│
└── frontend/          # Aplicación React + Vite
    ├── src/
    │   ├── pages/     # Páginas de la aplicación
    │   ├── components/# Componentes reutilizables
    │   ├── services/  # Servicios de API
    │   └── context/   # Context API
    └── package.json
\`\`\`

## Instalación

### 1. Instalar dependencias

\`\`\`bash
# Opción 1: Instalar todo de una vez
npm run install:all

# Opción 2: Instalar por separado
cd backend && npm install
cd frontend && npm install
\`\`\`

### 2. Configurar base de datos

Edita el archivo `backend/.env` con tus credenciales de MySQL:

\`\`\`env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hotel_dc_company
DB_PORT=3306
PORT=5000
JWT_SECRET=tu_secreto_jwt_aqui
\`\`\`

### 3. Importar base de datos

Importa tu base de datos MySQL en phpMyAdmin o usando el comando:

\`\`\`bash
mysql -u root -p hotel_dc_company < tu_base_de_datos.sql
\`\`\`

## Ejecutar el proyecto

### Opción 1: Ejecutar todo junto

\`\`\`bash
npm run dev
\`\`\`

### Opción 2: Ejecutar por separado

**Terminal 1 - Backend:**
\`\`\`bash
npm run backend
\`\`\`
El backend se ejecutará en http://localhost:5000

**Terminal 2 - Frontend:**
\`\`\`bash
npm run frontend
\`\`\`
El frontend se ejecutará en http://localhost:5173

## URLs de acceso

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

## Funcionalidades

### Cliente
- Búsqueda y reserva de habitaciones
- Gestión de perfil
- Historial de reservas
- Pagos

### Administrador
- Dashboard con estadísticas
- Gestión de habitaciones
- Gestión de reservas
- Gestión de clientes
- Gestión de empleados
- Reportes y facturación

### Recepción
- Check-in/Check-out
- Gestión de reservas
- Asignación de habitaciones
