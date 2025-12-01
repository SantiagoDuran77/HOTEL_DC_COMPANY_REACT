# Sistema de Reservas Hotel DC Company

## Estructura del Proyecto

\`\`\`
hotel-dc-company/
├── backend/                 # API REST con Node.js + Express
│   ├── config/             # Configuración de base de datos
│   ├── routes/             # Rutas de la API
│   ├── middleware/         # Autenticación, validación
│   ├── utils/              # Utilidades (email, etc.)
│   ├── .env                # Variables de entorno
│   ├── index.js            # Servidor principal
│   └── package.json
│
└── frontend/               # Aplicación React + Vite
    ├── src/
    │   ├── components/     # Componentes React
    │   ├── pages/          # Páginas de la aplicación
    │   ├── services/       # Servicios para llamadas a API
    │   ├── context/        # Context API (Auth, etc.)
    │   ├── lib/            # Utilidades y helpers
    │   ├── App.jsx         # Componente principal
    │   └── main.jsx        # Punto de entrada
    ├── public/             # Assets estáticos
    ├── index.html
    ├── vite.config.js
    └── package.json
\`\`\`

## Comandos para iniciar

### Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Base de datos: hotel_dc_company
- Host: 127.0.0.1
- Port: 3306
- User: root
- Password: (sin contraseña)
