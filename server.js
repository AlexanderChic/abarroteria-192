const jsonServer = require('json-server');
const path = require('path');
const fs = require('fs');

// Verificar que el archivo db.json existe
const dbPath = path.join(__dirname, 'data', 'db.json');
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
      }
    ],
    products: [],
    metadata: {
      version: "1.0",
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  };
  
  // Crear directorio data si no existe
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
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

// CORS headers
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Ruta de prueba
server.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Usar el router
server.use(router);

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JSON Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Categories: http://localhost:${PORT}/categories`);
  console.log(`📦 Products: http://localhost:${PORT}/products`);
});