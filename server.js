const express = require('express');
const { createClient } = require('redis');
require('dotenv').config();
const app = express();
const PORT = 3000;

// Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL
});
redisClient.connect().catch(console.error);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API para executar comandos Redis
app.post('/api/exec', async (req, res) => {
  const { command } = req.body;

  try {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const result = await redisClient.sendCommand([cmd, ...args]);
    res.json({ result });
  } catch (err) {
    res.json({ result: `Erro: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
