const express = require('express');
const router  = express.Router();
const db      = require('../models/db');
const { requireAuth } = require('../middleware/auth');

// POST avis depuis menu client
router.post('/nouveau', async (req, res) => {
  const { restaurant_id, commande_id, note, texte, client_nom } = req.body;
  if (!restaurant_id || !note) return res.json({ ok: false });
  await db.avis.insertAsync({ restaurant_id, commande_id: commande_id||null, note: parseInt(note), texte: texte||'', client_nom: client_nom||'Client anonyme', reponse: null, createdAt: new Date() });
  // Mettre à jour note moyenne du restaurant
  const tousAvis = await db.avis.findAsync({ restaurant_id });
  const moyenne  = tousAvis.reduce((s,a) => s + a.note, 0) / tousAvis.length;
  await db.restaurants.updateAsync({ _id: restaurant_id }, { $set: { note_moyenne: Math.round(moyenne * 10) / 10, nb_avis: tousAvis.length } });
  res.json({ ok: true });
});

// GET liste avis (dashboard)
router.get('/', requireAuth, async (req, res) => {
  const avis = await db.avis.findAsync({ restaurant_id: req.session.restaurantId });
  avis.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const moyenne = avis.length ? (avis.reduce((s,a)=>s+a.note,0)/avis.length).toFixed(1) : 0;
  const distrib = [5,4,3,2,1].map(n => ({ note: n, count: avis.filter(a=>a.note===n).length }));
  res.render('restaurateur/avis', { avis, moyenne, distrib, total: avis.length, error: req.flash('error'), success: req.flash('success') });
});

// POST répondre à un avis
router.post('/:id/repondre', requireAuth, async (req, res) => {
  const { reponse } = req.body;
  await db.avis.updateAsync({ _id: req.params.id, restaurant_id: req.session.restaurantId }, { $set: { reponse, repondu_le: new Date() } });
  req.flash('success', 'Réponse publiée !');
  res.redirect('/avis');
});

module.exports = router;
