require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const flash        = require('connect-flash');
const path         = require('path');
const http         = require('http');
const { Server }   = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

// ── View engine ────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static files ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body parsers ───────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Session ────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'menucam_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 jours
}));

// ── Flash messages ─────────────────────────────────────────────
app.use(flash());

// ── Global locals ──────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.session        = req.session;
  res.locals.restaurantNom  = req.session.restaurantNom || null;
  res.locals.restaurantId   = req.session.restaurantId  || null;
  next();
});

// ── Socket.io ──────────────────────────────────────────────────
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('rejoindre_restaurant', (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
  });
  socket.on('disconnect', () => {});
});

// ── Routes ─────────────────────────────────────────────────────
app.use('/auth',       require('./routes/auth'));
app.use('/dashboard',  require('./routes/dashboard'));
app.use('/plats',      require('./routes/plats'));
app.use('/commandes',  require('./routes/commandes'));
app.use('/menu',       require('./routes/menu'));

// Page d'accueil
app.get('/', (req, res) => {
  if (req.session.restaurantId) return res.redirect('/dashboard');
  res.render('index');
});

// 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Erreur serveur');
});

// ── Start ──────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  MenuCam démarré sur http://localhost:${PORT}`);
  console.log(`📱  Page de démo : http://localhost:${PORT}\n`);
});
