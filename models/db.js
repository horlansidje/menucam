/**
 * ══════════════════════════════════════════════════════════
 *  MenuCam V3 — Couche Base de Données Universelle
 *  ► Si MONGODB_URI est défini → MongoDB Atlas (persistant)
 *  ► Sinon → NeDB local (dev) ou /tmp (Railway sans Mongo)
 * ══════════════════════════════════════════════════════════
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  module.exports = require('./db-mongo');
} else {
  module.exports = require('./db-nedb');
}
