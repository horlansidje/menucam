/**
 * seed.js — Peupler la base de données avec un restaurant et des plats camerounais
 * Usage : node seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db     = require('./models/db');

const RESTAURANT = {
  nom:         'Chez Maman Biya',
  email:       'demo@menucam.cm',
  password:    'demo1234',
  telephone:   '699000000',
  adresse:     'Quartier Akwa, Rue de la Joie',
  ville:       'Douala',
  description: 'Spécialités camerounaises authentiques — Ndolé, Poulet DG, Eru et bien plus. Cuisine faite maison avec amour.',
  logo:        null,
  actif:       true,
};

const PLATS = [
  // ── Entrées ──────────────────────────────────────────────────
  {
    nom:         'Beignets haricots',
    description: 'Beignets de haricots croustillants servis avec poivre et piment, une spécialité du petit déjeuner camerounais.',
    prix:        500,
    categorie:   'Entrées & Collations',
    disponible:  true,
  },
  {
    nom:         'Accra banane',
    description: 'Beignets de banane plantain mûre, dorés à la perfection. Servis chauds en entrée ou en collation.',
    prix:        500,
    categorie:   'Entrées & Collations',
    disponible:  true,
  },
  {
    nom:         'Miondo (bâton de manioc)',
    description: 'Bâtons de manioc fermenté enveloppés dans des feuilles de bananier. Accompagnement traditionnel.',
    prix:        300,
    categorie:   'Entrées & Collations',
    disponible:  true,
  },

  // ── Plats principaux ─────────────────────────────────────────
  {
    nom:         'Ndolé spécial',
    description: 'Le plat national camerounais ! Feuilles de ndolé cuites avec crevettes, arachides et viande de bœuf. Servi avec miondo ou plantain.',
    prix:        4500,
    categorie:   'Plats principaux',
    disponible:  true,
  },
  {
    nom:         'Poulet DG',
    description: 'Poulet braisé sauté avec plantain mûr, carottes, haricots verts et poivrons. Le plat préféré des directeurs généraux !',
    prix:        5500,
    categorie:   'Plats principaux',
    disponible:  true,
  },
  {
    nom:         'Eru et Water fufu',
    description: 'Feuilles d\'eru (okok) cuisinées avec huile de palme, crayfish et viande fumée. Servi avec water fufu. Spécialité du Sud-Ouest.',
    prix:        4000,
    categorie:   'Plats principaux',
    disponible:  true,
  },
  {
    nom:         'Koki maïs',
    description: 'Gâteau de maïs cuit à la vapeur dans des feuilles de bananier avec huile de palme et épices. Plat traditionnel de l\'Ouest.',
    prix:        2500,
    categorie:   'Plats principaux',
    disponible:  true,
  },
  {
    nom:         'Mbongo tchobi',
    description: 'Poisson ou poulet mijoté dans une sauce noire à base de bâton de njansa. Spécialité Bassa aux arômes uniques.',
    prix:        5000,
    categorie:   'Plats principaux',
    disponible:  true,
  },
  {
    nom:         'Achu soupe jaune',
    description: 'Taro pilé servi avec soupe jaune à base d\'huile de palme, viande et épices. Spécialité des Grassfields.',
    prix:        4500,
    categorie:   'Plats principaux',
    disponible:  true,
  },
  {
    nom:         'Okok (Gnetum)',
    description: 'Feuilles d\'okok finement hachées cuisinées avec huile de palme, arachides et poisson fumé.',
    prix:        3500,
    categorie:   'Plats principaux',
    disponible:  true,
  },

  // ── Grillades ────────────────────────────────────────────────
  {
    nom:         'Soya bœuf (brochettes)',
    description: 'Brochettes de bœuf marinées aux épices camerounaises et grillées au feu de bois. Servi avec du pain.',
    prix:        2000,
    categorie:   'Grillades & Brochettes',
    disponible:  true,
  },
  {
    nom:         'Poulet braisé entier',
    description: 'Poulet entier mariné et grillé lentement sur braise. Servi avec plantain braisé et sauce pimentée.',
    prix:        8000,
    categorie:   'Grillades & Brochettes',
    disponible:  true,
  },
  {
    nom:         'Poisson braisé (capitaine)',
    description: 'Capitaine frais mariné aux épices locales et grillé sur braise. Servi avec manioc et sauce tomate.',
    prix:        6000,
    categorie:   'Grillades & Brochettes',
    disponible:  true,
  },
  {
    nom:         'Soya porc',
    description: 'Brochettes de porc grillées au charbon avec épices pimentées. Spécialité des quartiers de Douala.',
    prix:        2500,
    categorie:   'Grillades & Brochettes',
    disponible:  true,
  },

  // ── Accompagnements ──────────────────────────────────────────
  {
    nom:         'Plantain braisé',
    description: 'Bananes plantain mûres grillées sur braise. Sucrées et fondantes, parfaites avec tout plat.',
    prix:        500,
    categorie:   'Accompagnements',
    disponible:  true,
  },
  {
    nom:         'Plantain frit',
    description: 'Tranches de plantain frites dorées et croustillantes. Accompagnement incontournable.',
    prix:        500,
    categorie:   'Accompagnements',
    disponible:  true,
  },
  {
    nom:         'Riz sauté',
    description: 'Riz blanc sauté avec légumes, oignons et épices locales.',
    prix:        1000,
    categorie:   'Accompagnements',
    disponible:  true,
  },
  {
    nom:         'Igname pilée',
    description: 'Igname écrasée et travaillée jusqu\'à obtenir une consistance lisse et élastique. Accompagnement traditionnel.',
    prix:        800,
    categorie:   'Accompagnements',
    disponible:  true,
  },

  // ── Boissons ─────────────────────────────────────────────────
  {
    nom:         'Jus de bissap (hibiscus)',
    description: 'Boisson naturelle à base de fleurs d\'hibiscus séchées. Rafraîchissante, légèrement acidulée.',
    prix:        500,
    categorie:   'Jus naturels',
    disponible:  true,
  },
  {
    nom:         'Jus de gingembre',
    description: 'Boisson au gingembre frais avec citron et sucre de canne. Tonique et rafraîchissante.',
    prix:        500,
    categorie:   'Jus naturels',
    disponible:  true,
  },
  {
    nom:         'Jus de tamarin',
    description: 'Boisson à base de tamarin naturel, sucrée et acidulée. Très populaire à Douala.',
    prix:        500,
    categorie:   'Jus naturels',
    disponible:  true,
  },
  {
    nom:         'Jus de fruit de la passion',
    description: 'Jus frais de maracuja pressé, non filtré. Saveur tropicale intense.',
    prix:        600,
    categorie:   'Jus naturels',
    disponible:  true,
  },
  {
    nom:         'Eau minérale Supermont',
    description: 'Eau minérale naturelle camerounaise 1,5L.',
    prix:        300,
    categorie:   'Boissons',
    disponible:  true,
  },
  {
    nom:         'Coca-Cola 33cl',
    description: 'Coca-Cola bien frais.',
    prix:        400,
    categorie:   'Boissons',
    disponible:  true,
  },
  {
    nom:         '33 Export (bière)',
    description: 'Bière camerounaise 33 Export, blonde, légère et fraîche. 65cl.',
    prix:        1000,
    categorie:   'Bières',
    disponible:  true,
  },
  {
    nom:         'Castel bière',
    description: 'Castel bière bien fraîche. 65cl.',
    prix:        900,
    categorie:   'Bières',
    disponible:  true,
  },

  // ── Desserts ─────────────────────────────────────────────────
  {
    nom:         'Beignets sucrés au miel',
    description: 'Beignets moelleux nappés de miel local et saupoudrés de noix de coco râpée.',
    prix:        700,
    categorie:   'Desserts',
    disponible:  true,
  },
  {
    nom:         'Ananas frais tranché',
    description: 'Ananas frais du pays tranché et servi avec une pincée de sel et piment (optionnel).',
    prix:        500,
    categorie:   'Desserts',
    disponible:  true,
  },
  {
    nom:         'Salade de fruits tropicaux',
    description: 'Mélange de mangue, papaye, ananas, banane et fruit de la passion. Servi frais.',
    prix:        800,
    categorie:   'Desserts',
    disponible:  true,
  },
];

async function seed() {
  console.log('\n🌱  Démarrage du seed MenuCam...\n');

  try {
    // Vérifier si le restaurant demo existe déjà
    const existing = await db.restaurants.findOneAsync({ email: RESTAURANT.email });
    if (existing) {
      console.log('⚠️  Le restaurant demo existe déjà. Suppression en cours...');
      await db.restaurants.removeAsync({ _id: existing._id });
      await db.plats.removeAsync({ restaurant_id: existing._id }, { multi: true });
      await db.commandes.removeAsync({ restaurant_id: existing._id }, { multi: true });
      console.log('🗑️  Ancien restaurant supprimé.\n');
    }

    // Créer le restaurant
    const hash = await bcrypt.hash(RESTAURANT.password, 10);
    const restaurant = await db.restaurants.insertAsync({
      ...RESTAURANT,
      password: hash,
      createdAt: new Date(),
    });
    console.log(`✅  Restaurant créé : ${restaurant.nom} (ID: ${restaurant._id})`);
    console.log(`📧  Email    : ${RESTAURANT.email}`);
    console.log(`🔑  Password : ${RESTAURANT.password}\n`);

    // Créer les plats
    let count = 0;
    for (const plat of PLATS) {
      await db.plats.insertAsync({
        ...plat,
        restaurant_id: restaurant._id,
        photo: null,
        createdAt: new Date(),
      });
      count++;
      process.stdout.write(`\r🍽️  Plats ajoutés : ${count}/${PLATS.length}`);
    }

    console.log(`\n\n✅  ${count} plats camerounais ajoutés avec succès !\n`);
    console.log('─'.repeat(50));
    console.log('🚀  Lancez le serveur avec : npm start');
    console.log(`🌐  Connectez-vous sur    : http://localhost:3000`);
    console.log(`📧  Email                 : ${RESTAURANT.email}`);
    console.log(`🔑  Mot de passe          : ${RESTAURANT.password}`);
    console.log('─'.repeat(50));
    console.log('\n📱  Le QR code sera disponible dans le dashboard.\n');

  } catch (err) {
    console.error('❌ Erreur lors du seed :', err.message);
  }

  setTimeout(() => process.exit(0), 500);
}

seed();
