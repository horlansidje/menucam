const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs   = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data');
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

const db = {
  restaurants: new Datastore({ filename: path.join(dbPath, 'restaurants.db'), autoload: true }),
  plats:       new Datastore({ filename: path.join(dbPath, 'plats.db'),       autoload: true }),
  commandes:   new Datastore({ filename: path.join(dbPath, 'commandes.db'),   autoload: true }),
};

db.restaurants.ensureIndex({ fieldName: 'email', unique: true });
db.plats.ensureIndex({ fieldName: 'restaurant_id' });
db.commandes.ensureIndex({ fieldName: 'restaurant_id' });

module.exports = db;
