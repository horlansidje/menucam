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
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(session({ secret: process.env.SESSION_SECRET || 'menucam_v3_secret', resave: false, saveUninitialized: false, cookie: { maxAge: 7*24*60*60*1000 } }));
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
});

// Routes existantes
app.use('/auth',      require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/plats',     require('./routes/plats'));
app.use('/commandes', require('./routes/commandes'));
app.use('/menu',      require('./routes/menu'));
app.use('/livreurs',  require('./routes/livreurs'));
app.use('/promos',    require('./routes/promos'));
app.use('/avis',      require('./routes/avis'));
app.use('/analytics', require('./routes/analytics'));
app.use('/maps',      require('./routes/maps'));
app.use('/livreur',   require('./routes/livreur-app'));

// Nouvelles routes
app.use('/categories',  require('./routes/categories'));
app.use('/horaires',    require('./routes/horaires'));
app.use('/fidelite',    require('./routes/fidelite'));
app.use('/restaurants', require('./routes/restaurants'));

app.get('/', (req, res) => { if (req.session.restaurantId) return res.redirect('/dashboard'); res.render('index'); });
app.use((req, res) => res.status(404).render('404'));
app.use((err, req, res, next) => { console.error(err); res.status(500).send('Erreur serveur'); });

// Auto-seed + génération slugs manquants
const db = require('./models/db');
const { slugify } = require('./routes/restaurants');
setTimeout(async () => {
  const count = await db.restaurants.countAsync({});
  if (count === 0) { console.log('Base vide — lancement du seed...'); require('./seed'); }
  // Générer les slugs manquants
  const restos = await db.restaurants.findAsync({ slug: { $exists: false } });
  for (const r of restos) {
    let slug = slugify(r.nom);
    // S'assurer de l'unicité
    let existing = await db.restaurants.findOneAsync({ slug, _id: { $ne: r._id } });
    let suffix = 1;
    while (existing) { slug = `${slugify(r.nom)}-${suffix++}`; existing = await db.restaurants.findOneAsync({ slug, _id: { $ne: r._id } }); }
    await db.restaurants.updateAsync({ _id: r._id }, { $set: { slug } });
  }
}, 1500);

server.listen(PORT, '0.0.0.0', () => console.log(`\n✅  MenuCam V3 Enhanced démarré → http://localhost:${PORT}\n`));
