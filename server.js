const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'data/db.json'));
const middlewares = jsonServer.defaults({
  noCors: false
});

// Configurar CORS manualmente
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

// Usar solo el router, sin prefijos duplicados
server.use(router);

// Puerto dinámico de Railway
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JSON Server is running on port ${PORT}`);
  console.log(`📂 Database: data/db.json`);
  console.log(`🌐 Endpoints available at:`);
  console.log(`   GET /categories`);
  console.log(`   GET /products`);
  console.log(`   GET /metadata`);
});