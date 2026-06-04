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

/* =========================================================
   CONFIG
========================================================= */

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

/* =========================================================
   SESSION
========================================================= */

app.use(session({

  secret:
    process.env.SESSION_SECRET ||
    'menucam_v3_secret',

  resave: false,

  saveUninitialized: false,

  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000
  }

}));

app.use(flash());

/* =========================================================
   VARIABLES GLOBALES
========================================================= */

app.use((req, res, next) => {

  res.locals.session =
    req.session;

  res.locals.restaurantNom =
    req.session.restaurantNom || null;

  res.locals.restaurantId =
    req.session.restaurantId || null;

  next();

});

/* =========================================================
   SOCKET.IO
========================================================= */

app.set('io', io);

io.on('connection', socket => {

  socket.on('rejoindre_restaurant', id => {

    socket.join(`restaurant_${id}`);

  });

});

/* =========================================================
   ROUTES
========================================================= */

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

/* =========================================================
   PAGE ACCUEIL
========================================================= */

app.get('/', (req, res) => {

  if (req.session.restaurantId) {

    return res.redirect('/dashboard');

  }

  res.render('index');

});

/* =========================================================
   404
========================================================= */

app.use((req, res) => {

  res.status(404).render('404');

});

/* =========================================================
   ERREURS
========================================================= */

app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).send('Erreur serveur');

});

/* =========================================================
   SLUGIFY
========================================================= */

function slugify(text) {

  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

}

/* =========================================================
   AUTO SEED + SLUGS
========================================================= */

const db = require('./models/db');

setTimeout(async () => {

  try {

    console.log('🔄 Vérification base de données...');

    const count =
      await db.restaurants.countAsync({});

    /* =====================================
       SI BASE VIDE
    ===================================== */

    if (count === 0) {

      console.log(
        '🌱 Base vide — lancement du seed...'
      );

      require('./seed');

      return;

    }

    console.log('✅ Base déjà initialisée');

    /* =====================================
       AJOUT SLUGS MANQUANTS
    ===================================== */

    const restos =
      await db.restaurants.findAsync({

        $or: [

          { slug: { $exists: false } },

          { slug: null },

          { slug: '' }

        ]

      });

    for (const r of restos) {

      let baseSlug =
        slugify(r.nom);

      let finalSlug =
        baseSlug;

      let i = 1;

      while (

        await db.restaurants.findOneAsync({

          slug: finalSlug,

          _id: { $ne: r._id }

        })

      ) {

        finalSlug =
          `${baseSlug}-${i++}`;

      }

      await db.restaurants.updateAsync(

        { _id: r._id },

        {
          $set: {
            slug: finalSlug
          }
        }

      );

      console.log(
        `✅ Slug ajouté : ${r.nom} → ${finalSlug}`
      );

    }

  } catch (err) {

    console.error(
      '❌ Erreur initialisation DB:',
      err
    );

  }

}, 1500);

/* =========================================================
   START SERVER
========================================================= */

server.listen(

  PORT,

  '0.0.0.0',

  () => {

    console.log(`

===================================
✅ MenuCam V3 démarré
🌐 Port : ${PORT}
===================================

`);

  }

);