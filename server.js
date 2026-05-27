require('dotenv').config();

const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const PORT = process.env.PORT || 3000;

// =========================
// CONFIG EXPRESS
// =========================

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

app.use(express.json({
  limit: '10mb'
}));

// =========================
// SESSION
// =========================

app.use(session({
  secret: process.env.SESSION_SECRET || 'menucam_v3_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(flash());

// =========================
// VARIABLES GLOBALES
// =========================

app.use((req, res, next) => {

  res.locals.session = req.session;

  res.locals.restaurantNom =
    req.session.restaurantNom || null;

  res.locals.restaurantId =
    req.session.restaurantId || null;

  next();

});

// =========================
// SOCKET.IO
// =========================

app.set('io', io);

io.on('connection', socket => {

  console.log('🟢 Client connecté');

  socket.on('rejoindre_restaurant', id => {

    socket.join(`restaurant_${id}`);

    console.log(`📦 Restaurant room : ${id}`);

  });

  socket.on('disconnect', () => {
    console.log('🔴 Client déconnecté');
  });

});

// =========================
// ROUTES
// =========================

app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/plats', require('./routes/plats'));
app.use('/commandes', require('./routes/commandes'));
app.use('/menu', require('./routes/menu'));
app.use('/livreurs', require('./routes/livreurs'));
app.use('/promos', require('./routes/promos'));
app.use('/avis', require('./routes/avis'));
app.use('/analytics', require('./routes/analytics'));

// =========================
// HOME
// =========================

app.get('/', (req, res) => {

  if (req.session.restaurantId) {
    return res.redirect('/dashboard');
  }

  res.render('index');

});

// =========================
// 404
// =========================

app.use((req, res) => {

  res.status(404).render('404');

});

// =========================
// GESTION ERREURS
// =========================

app.use((err, req, res, next) => {

  console.error('❌ Erreur serveur :', err);

  res.status(500).send('Erreur serveur');

});

// =========================
// DB + SEED + START SERVER
// =========================

const db = require('./models/db');
const seed = require('./seed');

const startServer = async () => {

  try {

    console.log('🔄 Vérification base de données...');

    const count =
      await db.restaurants.countAsync({});

    // =========================
    // AUTO SEED
    // =========================

    if (count === 0) {

      console.log('🌱 Base vide → lancement du seed');

      await seed();

      console.log('✅ Seed terminé');

    } else {

      console.log('✅ Base déjà initialisée');

    }

    // =========================
    // START SERVER
    // =========================

    server.listen(PORT, '0.0.0.0', () => {

      console.log('\n===================================');
      console.log(`✅ MenuCam V3 démarré`);
      console.log(`🌐 Port : ${PORT}`);
      console.log('===================================\n');

    });

  } catch (error) {

    console.error('❌ Erreur démarrage serveur :');

    console.error(error);

  }

};

startServer();