require('dotenv').config();
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 } // 1h
}));

app.use(express.json());
app.use(express.static('public'));

app.post('/api/exec', async (req, res) => {
  const { command } = req.body;

  try {
    if (!req.sessionID) {
      return res.status(403).json({ result: 'Sessão inválida.' });
    }

    const sessionPrefix = `sess:${req.sessionID}`;
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const proibidos = ['flushall', 'config', 'keys', 'script', 'eval'];
    if (proibidos.includes(cmd)) {
      return res.json({ result: 'Comando bloqueado por segurança.' });
    }

    const comandosComChave = ['set', 'get', 'del', 'incr', 'decr', 'exists', 'expire'];
    if (comandosComChave.includes(cmd) && args.length > 0) {
      args[0] = `${sessionPrefix}:${args[0]}`;
    }

    const result = await redisClient.sendCommand([cmd, ...args]);
    res.json({ result });
  } catch (err) {
    res.json({ result: `Erro: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
