const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Detectar entorno Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.PORT;

// Configurar ruta de base de datos
const dbPath = isRailway 
  ? path.join(__dirname, 'src', 'data', 'db.json')
  : path.join(__dirname, 'data', 'db.json');

console.log('📂 Looking for database at:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found at:', dbPath);
  
  // Crear db.json por defecto si no existe
  const defaultData = {
    categories: [
      {
        id: "1",
        name: "Abarrotes",
        description: "Productos básicos de despensa",
        subcategories: ["Cereales", "Enlatados", "Condimentos", "Pastas"],
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        name: "Bebidas",
        description: "Bebidas refrescantes",
        subcategories: ["Refrescos", "Jugos", "Agua"],
        createdAt: new Date().toISOString()
      },
      {
        id: "3",
        name: "Lácteos",
        description: "Productos lácteos",
        subcategories: ["Leche", "Yogurt", "Quesos"],
        createdAt: new Date().toISOString()
      },
      {
        id: "4",
        name: "Limpieza",
        description: "Productos de limpieza",
        subcategories: ["Detergentes", "Jabones", "Papel"],
        createdAt: new Date().toISOString()
      }
    ],
    products: [
      {
        id: "1",
        name: "Coca Cola 2L",
        category: "2",
        subcategory: "Refrescos",
        buyPrice: 25.00,
        sellPrice: 35.00,
        supplier: "Coca Cola",
        stock: 50,
        description: "Refresco de cola de 2 litros",
        image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&h=300&fit=crop",
        createdAt: new Date().toISOString()
      }
    ],
    users: [
      {
        id: "1",
        username: "admin",
        password: "admin123",
        type: "admin",
        name: "Administrador",
        email: "admin@abarroteria.com",
        createdAt: new Date().toISOString()
      }
    ],
    orders: [],
    settings: {
      storeName: "Abarrotería Jardines del Edén",
      currency: "GTQ",
      lowStockThreshold: 10,
      version: "1.0"
    },
    metadata: {
      version: "1.0",
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  };
  
  // Crear directorio data si no existe
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
  console.log('✅ Created default database file');
} else {
  console.log('✅ Database file found');
}

const server = jsonServer.create();
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults({
  noCors: false
});

// CORS headers mejorado
server.use(cors({
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  credentials: true
}));

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Ruta de prueba
server.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Routing - en Railway usar /api prefix
if (isRailway) {
  server.use('/api', router);
} else {
  server.use(router);
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JSON Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  if (isRailway) {
    console.log(`📋 Categories: http://localhost:${PORT}/api/categories`);
    console.log(`📦 Products: http://localhost:${PORT}/api/products`);
    console.log(`👥 Users: http://localhost:${PORT}/api/users`);
    console.log(`🛒 Orders: http://localhost:${PORT}/api/orders`);
  } else {
    console.log(`📋 Categories: http://localhost:${PORT}/categories`);
    console.log(`📦 Products: http://localhost:${PORT}/products`);
  }
});