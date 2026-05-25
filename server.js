require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const flash      = require('connect-flash');
const path       = require('path');
const http       = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
const PORT   = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || 'menucam_secret_2024', resave: false, saveUninitialized: false, cookie: { maxAge: 7*24*60*60*1000 } }));
app.use(flash());
app.use((req, res, next) => {
  res.locals.session       = req.session;
  res.locals.restaurantNom = req.session.restaurantNom || null;
  res.locals.restaurantId  = req.session.restaurantId  || null;
  next();
});
app.set('io', io);
io.on('connection', socket => {
  socket.on('rejoindre_restaurant', id => socket.join(`restaurant_${id}`));
  socket.on('rejoindre_livreur', id => socket.join(`livreur_${id}`));
});

app.use('/auth',       require('./routes/auth'));
app.use('/dashboard',  require('./routes/dashboard'));
app.use('/plats',      require('./routes/plats'));
app.use('/commandes',  require('./routes/commandes'));
app.use('/menu',       require('./routes/menu'));
app.use('/livreurs',   require('./routes/livreurs'));
app.use('/promos',     require('./routes/promos'));
app.use('/avis',       require('./routes/avis'));
app.use('/analytics',  require('./routes/analytics'));

app.get('/', (req, res) => { if (req.session.restaurantId) return res.redirect('/dashboard'); res.render('index'); });
app.use((req, res) => res.status(404).render('404'));
app.use((err, req, res, next) => { console.error(err); res.status(500).send('Erreur serveur'); });


// Auto-seed si base vide
const db = require('./models/db');
setTimeout(async () => {
  const count = await db.restaurants.countAsync({});
  if (count === 0) {
    console.log('Base vide — lancement du seed...');
    require('./seed');
  }
}, 1000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  MenuCam V2 démarré sur http://localhost:${PORT}\n`);
});
