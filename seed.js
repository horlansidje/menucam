require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./models/db');

// ===============================
// RESTAURANT DEMO
// ===============================

const RESTAURANT = {

  nom: "Chez Maman Biya",

  email: "demo@menucam.cm",

  password: "demo1234",

  telephone: "699000000",

  adresse: "Quartier Akwa, Rue de la Joie",

  ville: "Douala",

  description:
    "Spécialités camerounaises authentiques — Ndolé, Poulet DG, Eru et bien plus. Cuisine faite maison.",

  logo: null,

  actif: true

};

// ===============================
// LISTE DES PLATS
// ===============================

const PLATS = [

  {
    nom: "Beignets haricots",
    description: "Beignets croustillants servis avec poivre et piment.",
    prix: 500,
    categorie: "Entrées & Collations",
    disponible: true
  },

  {
    nom: "Accra banane",
    description: "Beignets de banane plantain mûre.",
    prix: 500,
    categorie: "Entrées & Collations",
    disponible: true
  },

  {
    nom: "Ndolé spécial",
    description: "Plat national camerounais.",
    prix: 4500,
    categorie: "Plats principaux",
    disponible: true
  },

  {
    nom: "Poulet DG",
    description: "Poulet braisé avec plantain mûr.",
    prix: 5500,
    categorie: "Plats principaux",
    disponible: true
  },

  {
    nom: "Eru et Water fufu",
    description: "Spécialité du Sud-Ouest.",
    prix: 4000,
    categorie: "Plats principaux",
    disponible: true
  },

  {
    nom: "Soya bœuf",
    description: "Brochettes grillées au charbon.",
    prix: 2000,
    categorie: "Grillades & Brochettes",
    disponible: true
  },

  {
    nom: "Plantain frit",
    description: "Plantain doré et croustillant.",
    prix: 500,
    categorie: "Accompagnements",
    disponible: true
  },

  {
    nom: "Jus de bissap",
    description: "Boisson naturelle à l'hibiscus.",
    prix: 500,
    categorie: "Jus naturels",
    disponible: true
  },

  {
    nom: "Coca-Cola 33cl",
    description: "Coca-Cola bien frais.",
    prix: 400,
    categorie: "Boissons",
    disponible: true
  },

  {
    nom: "Ananas frais",
    description: "Ananas frais du pays.",
    prix: 500,
    categorie: "Desserts",
    disponible: true
  }

];

// ===============================
// FONCTION SEED
// ===============================

async function seed() {

  console.log('\n🌱 Seed MenuCam V3...\n');

  try {

    // ===============================
    // VERIFIER SI LE RESTAURANT EXISTE
    // ===============================

    const existing =
      await db.restaurants.findOneAsync({
        email: RESTAURANT.email
      });

    // ===============================
    // SI EXISTE DEJA
    // ===============================

    if (existing) {

      console.log('✅ Restaurant demo déjà existant');

      return;

    }

    // ===============================
    // HASH PASSWORD
    // ===============================

    const hash =
      await bcrypt.hash(RESTAURANT.password, 10);

    // ===============================
    // CREATION RESTAURANT
    // ===============================

    const resto =
      await db.restaurants.insertAsync({

        ...RESTAURANT,

        password: hash,

        note_moyenne: 0,

        nb_avis: 0,

        createdAt: new Date()

      });

    console.log(`✅ Restaurant créé : ${resto.nom}`);

    // ===============================
    // INSERTION DES PLATS
    // ===============================

    let total = 0;

    for (const plat of PLATS) {

      await db.plats.insertAsync({

        ...plat,

        restaurant_id: resto._id,

        photo: null,

        createdAt: new Date()

      });

      total++;

      console.log(`🍽️ Plat ajouté : ${plat.nom}`);

    }

    console.log('\n====================================');

    console.log(`✅ ${total} plats ajoutés`);

    console.log(`📧 Email : ${RESTAURANT.email}`);

    console.log(`🔑 Mot de passe : ${RESTAURANT.password}`);

    console.log('====================================\n');

  } catch (error) {

    console.error('❌ Erreur seed :');

    console.error(error);

  }

}

// ===============================
// EXPORT
// ===============================

module.exports = seed;