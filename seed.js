require('dotenv').config();

const bcrypt = require('bcryptjs');

const db = require('./models/db');

// =========================
// RESTAURANT DEMO
// =========================

const RESTAURANT = {

  nom: "Chez Maman Biya",

  email: "demo@menucam.cm",

  password: "demo1234",

  telephone: "699000000",

  adresse: "Quartier Akwa, Rue de la Joie",

  ville: "Douala",

  description:
    "Spécialités camerounaises authentiques — Ndolé, Poulet DG, Eru et bien plus.",

  logo: null,

  actif: true

};

// =========================
// PLATS DEMO
// =========================

const PLATS = [

  {
    nom: "Ndolé spécial",
    description: "Plat national camerounais.",
    prix: 4500,
    categorie: "Plats principaux",
    disponible: true
  },

  {
    nom: "Poulet DG",
    description: "Poulet sauté avec plantain mûr.",
    prix: 5500,
    categorie: "Plats principaux",
    disponible: true
  },

  {
    nom: "Eru et Water Fufu",
    description: "Spécialité du Sud-Ouest.",
    prix: 4000,
    categorie: "Plats principaux",
    disponible: true
  },

  {
    nom: "Soya Boeuf",
    description: "Brochettes épicées.",
    prix: 2000,
    categorie: "Grillades",
    disponible: true
  },

  {
    nom: "Jus de Gingembre",
    description: "Boisson naturelle fraîche.",
    prix: 500,
    categorie: "Boissons",
    disponible: true
  }

];

// =========================
// SEED FUNCTION
// =========================

async function seed() {

  try {

    console.log('\n🌱 Initialisation MenuCam V3...\n');

    // =========================
    // VERIFIER SI DEMO EXISTE
    // =========================

    const existingRestaurant =
      await db.restaurants.findOneAsync({
        email: RESTAURANT.email
      });

    if (existingRestaurant) {

      console.log('✅ Compte demo déjà existant');

      return;

    }

    // =========================
    // HASH PASSWORD
    // =========================

    const hash =
      await bcrypt.hash(RESTAURANT.password, 10);

    // =========================
    // CREATE RESTAURANT
    // =========================

    const resto =
      await db.restaurants.insertAsync({

        ...RESTAURANT,

        password: hash,

        note_moyenne: 0,

        nb_avis: 0,

        createdAt: new Date()

      });

    console.log(`✅ Restaurant créé : ${resto.nom}`);

    // =========================
    // INSERT PLATS
    // =========================

    for (const plat of PLATS) {

      await db.plats.insertAsync({

        ...plat,

        restaurant_id: resto._id,

        photo: null,

        createdAt: new Date()

      });

      console.log(`🍽️ Plat ajouté : ${plat.nom}`);

    }

    console.log('\n===================================');

    console.log('✅ Seed terminé avec succès');

    console.log(`📧 Email : ${RESTAURANT.email}`);

    console.log(`🔑 Mot de passe : ${RESTAURANT.password}`);

    console.log('===================================\n');

  } catch (error) {

    console.error('❌ Erreur seed :');

    console.error(error);

  }

}

// =========================
// EXPORT
// =========================

module.exports = seed;