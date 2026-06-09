```js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');

// ─────────────────────────────
// LOGS SAFE (Railway OK)
// ─────────────────────────────
const log = {
  info: function (...args) {
    console.log(`[${new Date().toISOString()}] ℹ️`, ...args);
  },
  ok: function (...args) {
    console.log(`[${new Date().toISOString()}] ✅`, ...args);
  },
  warn: function (...args) {
    console.warn(`[${new Date().toISOString()}] ⚠️`, ...args);
  },
  error: function (...args) {
    console.error(`[${new Date().toISOString()}] ❌`, ...args);
  }
};

// ─────────────────────────────
// APP + SERVER
// ─────────────────────────────
const app = express();
const server = http.createServer(app);

// ─────────────────────────────
// PORT RAILWAY
// ─────────────────────────────
const PORT = process.env.PORT || 3000;

// ─────────────────────────────
// SOCKET.IO
// ─────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ─────────────────────────────
// UPLOAD DIR
// ─────────────────────────────
const uploadDir = path.join(__dirname, 'public/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─────────────────────────────
// VIEW ENGINE
// ─────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─────────────────────────────
// TRUST PROXY
// ─────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─────────────────────────────
// STATIC
// ─────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────
// BODY PARSERS
// ─────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────
// SESSION
// ─────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'menucam_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  }
}));

app.use(flash());

// ─────────────────────────────
// GLOBALS
// ─────────────────────────────
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
  next();
});

// ─────────────────────────────
// SOCKET EVENTS
// ─────────────────────────────
io.on('connection', (socket) => {
  log.info('Socket connecté:', socket.id);

  socket.on('rejoindre_restaurant', (id) => {
    socket.join(`restaurant_${id}`);
    log.info(`Socket ${socket.id} rejoint restaurant_${id}`);
  });

  socket.on('disconnect', () => {
    log.info('Socket déconnecté:', socket.id);
  });
});

app.set('io', io);

// ─────────────────────────────
// HEALTH CHECK
// ─────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'MenuCam V3',
    uptime: process.uptime(),
    time: new Date().toISOString()
  });
});

// ─────────────────────────────
// ROUTES
// ─────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/plats', require('./routes/plats'));
app.use('/commandes', require('./routes/commandes'));
app.use('/menu', require('./routes/menu'));
app.use('/livreurs', require('./routes/livreurs'));
app.use('/promos', require('./routes/promos'));
app.use('/avis', require('./routes/avis'));
app.use('/analytics', require('./routes/analytics'));
app.use('/maps', require('./routes/maps'));
app.use('/livreur', require('./routes/livreur-app'));
app.use('/categories', require('./routes/categories'));
app.use('/horaires', require('./routes/horaires'));
app.use('/fidelite', require('./routes/fidelite'));
app.use('/restaurants', require('./routes/restaurants'));
app.use('/paiement', require('./routes/paiement'));

// ─────────────────────────────
// HOME
// ─────────────────────────────
app.get('/', (req, res) => {
  if (req.session.restaurantId) {
    return res.redirect('/dashboard');
  }
  res.render('index');
});

// ─────────────────────────────
// 404
// ─────────────────────────────
app.use((req, res) => {
  res.status(404).render('404');
});

// ─────────────────────────────
// ERROR HANDLER
// ─────────────────────────────
app.use((err, req, res, next) => {
  log.error(err.message);
  if (res.headersSent) return next(err);
  res.status(500).send('Erreur serveur');
});

// ─────────────────────────────
// DB + SEED
// ─────────────────────────────
const db = require('./models/db');
const seed = require('./seed');

// SLUGIFY LOCAL (IMPORTANT FIX)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
server.listen(PORT, '0.0.0.0', async () => {
  log.ok(`MenuCam V3 démarré sur le port ${PORT}`);

  try {
    const count = await db.restaurants.countAsync({});

    if (count === 0) {
      log.info('Base vide — seed...');
      await seed();
    }

    const restos = await db.restaurants.findAsync({
      slug: { $exists: false }
    });

    for (const r of restos) {
      let slug = slugify(r.nom);

      let exist = await db.restaurants.findOneAsync({
        slug,
        _id: { $ne: r._id }
      });

      let i = 1;

      while (exist) {
        slug = `${slugify(r.nom)}-${i++}`;
        exist = await db.restaurants.findOneAsync({
          slug,
          _id: { $ne: r._id }
        });
      }

      await db.restaurants.updateAsync(
        { _id: r._id },
        { $set: { slug } }
      );
    }

    log.ok('DB initialisée');
  } catch (e) {
    log.error(e.message);
  }
});

// ─────────────────────────────
// CRASH HANDLERS
// ─────────────────────────────
process.on('uncaughtException', (err) => {
  log.error('uncaughtException', err);
});

process.on('unhandledRejection', (err) => {
  log.error('unhandledRejection', err);
});

process.on('SIGTERM', () => {
  log.info('SIGTERM reçu');
  server.close(() => {
    log.ok('Serveur arrêté');
    process.exit(0);
  });
});
```
