const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.json({ 
    message: "Bienvenido al Microservicio de ejemplo DevOps",
    version: "1.1.0",
    status: "Operativo",
    author: "Matias Nazal"
  });
});

app.get('/version', (req, res) => {
    res.json({ version: "1.0.0", env: "Development" });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});