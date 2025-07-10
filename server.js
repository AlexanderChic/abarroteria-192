const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'data/db.json'));
const middlewares = jsonServer.defaults();

// Configurar CORS y middlewares
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Configurar rutas
server.use('/api', router);
server.use(router);

// Puerto dinámico de Railway
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JSON Server is running on port ${PORT}`);
  console.log(`📂 Database: data/db.json`);
  console.log(`🌐 Endpoints available at::`);
  console.log(`   GET    /categories`);
  console.log(`   GET    /products`);
  console.log(`   GET    /metadata`);
});