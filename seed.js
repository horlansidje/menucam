require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./models/db');

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

const RESTAURANT = {
  nom: "Chez Maman Biya",
  email: "demo@menucam.cm",
  password: "demo1234",
  telephone: "699000000",
  adresse: "Quartier Akwa, Rue de la Joie",
  ville: "Douala",
  description: "Spécialités camerounaises authentiques — Ndolé, Poulet DG, Eru et bien plus. Cuisine faite maison.",
  logo: null,
  actif: true
};

const PLATS = [
  {
    nom: "Beignets haricots",
    description: "Beignets croustillants servis avec poivre et piment.",
    prix: 500,
    categorie: "Entrées & Collations",
    disponible: true
  },
  {
    nom: "Ndolé spécial",
    description: "Le plat national camerounais.",
    prix: 4500,
    categorie: "Plats principaux",
    disponible: true
  },
  {
    nom: "Poulet DG",
    description: "Poulet braisé sauté avec plantain mûr.",
    prix: 5500,
    categorie: "Plats principaux",
    disponible: true
  }
];

async function seed() {

  console.log('\n🌱 Seed MenuCam V3...\n');

  try {

    const existing =
      await db.restaurants.findOneAsync({
        email: RESTAURANT.email
      });

    if (existing) {

      await db.restaurants.removeAsync({
        _id: existing._id
      });

      await db.plats.removeAsync(
        { restaurant_id: existing._id },
        { multi: true }
      );

      console.log('🗑️ Ancien restaurant supprimé');
    }

    const hash =
      await bcrypt.hash(RESTAURANT.password, 10);

    const resto =
      await db.restaurants.insertAsync({

        ...RESTAURANT,

        password: hash,

        slug: slugify(RESTAURANT.nom),

        note_moyenne: 0,

        nb_avis: 0,

        createdAt: new Date()

      });

    console.log(`✅ Restaurant : ${resto.nom}`);
    console.log(`🔗 Slug : ${resto.slug}`);

    let n = 0;

    for (const p of PLATS) {

      await db.plats.insertAsync({

        ...p,

        restaurant_id: resto._id,

        photo: null,

        createdAt: new Date()

      });

      process.stdout.write(
        `\r🍽️ Plats : ${++n}/${PLATS.length}`
      );
    }

    console.log(`\n✅ ${n} plats ajoutés\n`);

    console.log('─'.repeat(50));

    console.log('🌐 http://localhost:3000');

    console.log(
      `📧 ${RESTAURANT.email} | 🔑 ${RESTAURANT.password}`
    );

    console.log(
      `📱 /menu/${resto.slug}`
    );

    console.log('─'.repeat(50) + '\n');

  } catch (e) {

    console.error('❌ Erreur:', e);

  }

  setTimeout(() => process.exit(0), 1000);
}

seed();