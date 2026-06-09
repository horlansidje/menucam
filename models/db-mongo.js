/**
 * ══════════════════════════════════════════════════════════
 *  MenuCam V3 — Backend MongoDB Atlas
 *  API 100% compatible NeDB : findAsync, findOneAsync,
 *  insertAsync, updateAsync, removeAsync, countAsync
 * ══════════════════════════════════════════════════════════
 */

const { MongoClient, ObjectId } = require('mongodb');

// ── Connexion ────────────────────────────────────────────
const URI    = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'menucam';

let _client = null;
let _db     = null;

async function connect() {
  if (_db) return _db;
  console.log('🔌 Connexion MongoDB Atlas...');
  _client = new MongoClient(URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  await _client.connect();
  _db = _client.db(DB_NAME);
  console.log('✅ MongoDB Atlas connecté →', DB_NAME);

  // Gestion déconnexion propre
  process.on('SIGTERM', async () => {
    await _client.close();
    console.log('🔌 MongoDB fermé proprement');
  });

  return _db;
}

// ── Normalisation ID ─────────────────────────────────────
// NeDB utilise des strings comme _id
// MongoDB utilise ObjectId — on garde les strings pour compatibilité
function toFilter(query) {
  if (!query) return {};
  const f = { ...query };

  // Convertir _id string → ObjectId si possible
  if (f._id && typeof f._id === 'string') {
    try { f._id = new ObjectId(f._id); } catch { /* garder string */ }
  }
  if (f._id && f._id.$ne && typeof f._id.$ne === 'string') {
    try { f._id.$ne = new ObjectId(f._id.$ne); } catch {}
  }

  // Convertir restaurant_id / livreur_id string → ObjectId si possible
  for (const field of ['restaurant_id', 'livreur_id', 'plat_id']) {
    if (f[field] && typeof f[field] === 'string') {
      try { f[field] = new ObjectId(f[field]); } catch {}
    }
  }

  return f;
}

// Normalise un document retourné : convertit _id ObjectId → string
function normalizeDoc(doc) {
  if (!doc) return null;
  const d = { ...doc };
  if (d._id) d._id = d._id.toString();
  if (d.restaurant_id && typeof d.restaurant_id !== 'string') d.restaurant_id = d.restaurant_id.toString();
  if (d.livreur_id    && typeof d.livreur_id    !== 'string') d.livreur_id    = d.livreur_id.toString();
  if (d.plat_id       && typeof d.plat_id       !== 'string') d.plat_id       = d.plat_id.toString();
  return d;
}

// ── Interpréteur de queries NeDB → MongoDB ───────────────
// NeDB supporte : $ne, $in, $nin, $gt, $gte, $lt, $lte, $exists, $regex, $or, $inc
// MongoDB supporte les mêmes — la query passe directement après normalisation IDs

// ── Interpréteur d'updates NeDB → MongoDB ────────────────
// NeDB: { $set: {...}, $inc: {...} }
// MongoDB: idem → compatible directement
function toUpdate(update) {
  // Si l'update ne contient pas d'opérateur, c'est un remplacement (NeDB $set implicite)
  const hasOperator = Object.keys(update).some(k => k.startsWith('$'));
  if (!hasOperator) return { $set: update };
  return update;
}

// ── Collection wrapper — expose l'API NeDB ───────────────
class Collection {
  constructor(name) {
    this.name = name;
    this._col = null;
  }

  async _get() {
    if (this._col) return this._col;
    const db = await connect();
    this._col = db.collection(this.name);
    return this._col;
  }

  // ── findAsync(query) → Array ─────────────────────────
  async findAsync(query = {}) {
    const col = await this._get();
    const docs = await col.find(toFilter(query)).toArray();
    return docs.map(normalizeDoc);
  }

  // ── findOneAsync(query) → doc | null ─────────────────
  async findOneAsync(query = {}) {
    const col = await this._get();
    const doc = await col.findOne(toFilter(query));
    return normalizeDoc(doc);
  }

  // ── insertAsync(doc) → doc avec _id ──────────────────
  async insertAsync(doc) {
    const col  = await this._get();
    const toInsert = { ...doc };
    // Ne pas forcer ObjectId — MongoDB génère son propre _id
    const result = await col.insertOne(toInsert);
    const inserted = { ...toInsert, _id: result.insertedId.toString() };
    return normalizeDoc(inserted);
  }

  // ── updateAsync(query, update, options?) → count ─────
  // NeDB options: { multi: true } pour plusieurs docs
  // Par défaut NeDB met à jour UN seul doc (comme updateOne)
  async updateAsync(query = {}, update = {}, options = {}) {
    const col = await this._get();
    const mongoUpdate = toUpdate(update);
    if (options.multi) {
      const r = await col.updateMany(toFilter(query), mongoUpdate);
      return r.modifiedCount;
    }
    const r = await col.updateOne(toFilter(query), mongoUpdate);
    return r.modifiedCount;
  }

  // ── removeAsync(query, options?) → count ─────────────
  // NeDB options: { multi: true }
  async removeAsync(query = {}, options = {}) {
    const col = await this._get();
    if (options.multi) {
      const r = await col.deleteMany(toFilter(query));
      return r.deletedCount;
    }
    const r = await col.deleteOne(toFilter(query));
    return r.deletedCount;
  }

  // ── countAsync(query) → number ───────────────────────
  async countAsync(query = {}) {
    const col = await this._get();
    return col.countDocuments(toFilter(query));
  }

  // ── ensureIndex (no-op en production, géré par Atlas) ─
  ensureIndex(options) {
    // On crée les index de façon asynchrone sans bloquer
    this._get().then(col => {
      const spec = {};
      spec[options.fieldName] = 1;
      const idxOptions = {};
      if (options.unique) idxOptions.unique = true;
      if (options.sparse) idxOptions.sparse = true;
      col.createIndex(spec, idxOptions).catch(() => {}); // silencieux si déjà existant
    }).catch(() => {});
  }
}

// ── Instanciation des collections ────────────────────────
const db = {
  restaurants: new Collection('restaurants'),
  plats:       new Collection('plats'),
  commandes:   new Collection('commandes'),
  livreurs:    new Collection('livreurs'),
  promos:      new Collection('promos'),
  avis:        new Collection('avis'),
  categories:  new Collection('categories'),
  fidelite:    new Collection('fidelite'),
};

// Index (créés au démarrage)
db.restaurants.ensureIndex({ fieldName: 'email',         unique: true });
db.restaurants.ensureIndex({ fieldName: 'slug' });
db.plats.ensureIndex({ fieldName:       'restaurant_id' });
db.commandes.ensureIndex({ fieldName:   'restaurant_id' });
db.commandes.ensureIndex({ fieldName:   'num_commande'  });
db.categories.ensureIndex({ fieldName:  'restaurant_id' });
db.fidelite.ensureIndex({ fieldName:    'restaurant_id' });

console.log('🍃 Base de données : MongoDB Atlas');
module.exports = db;
