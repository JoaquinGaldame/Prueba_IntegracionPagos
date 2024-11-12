const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const app = express();
const PORT = 4000;

// Middlewares
app.use(cors()); 
app.use(express.json());
app.use('/api', routes);

// Inicio del servidor
app.listen(PORT, '192.168.1.40', () => {
  // Corremos servidor en la IP de nuestra computadora
  console.log(`Server running at http://192.168.1.40:${PORT}`);
});