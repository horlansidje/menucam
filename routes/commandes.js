const express = require('express');
const router  = express.Router();
const db      = require('../models/db');
const { requireAuth } = require('../middleware/auth');

// GET liste commandes (dashboard)
router.get('/', requireAuth, async (req, res) => {
  const { statut, date } = req.query;
  let query = { restaurant_id: req.session.restaurantId };
  if (statut && statut !== 'toutes') query.statut = statut;

  let commandes = await db.commandes.findAsync(query);

  // Filtre par date
  if (date) {
    const d = new Date(date); d.setHours(0,0,0,0);
    const dEnd = new Date(date); dEnd.setHours(23,59,59,999);
    commandes = commandes.filter(c => {
      const cd = new Date(c.createdAt);
      return cd >= d && cd <= dEnd;
    });
  }

  commandes.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Stats rapides
  const today = new Date(); today.setHours(0,0,0,0);
  const all   = await db.commandes.findAsync({ restaurant_id: req.session.restaurantId });
  const todayCommandes = all.filter(c => new Date(c.createdAt) >= today);

  res.render('restaurateur/commandes', {
    commandes,
    filtreStatut: statut || 'toutes',
    filtreDate: date || '',
    stats: {
      total: all.length,
      enAttente: all.filter(c => c.statut === 'en_attente').length,
      enPreparation: all.filter(c => c.statut === 'en_preparation').length,
      servies: all.filter(c => c.statut === 'servie').length,
      caTodal: todayCommandes.filter(c=>c.statut!=='annulee').reduce((s,c)=>s+(c.total||0),0)
    },
    error: req.flash('error'), success: req.flash('success')
  });
});

// POST nouvelle commande (depuis page menu client — appelé via fetch)
router.post('/nouvelle', async (req, res) => {
  try {
    const { restaurant_id, items, client_nom, client_table, note } = req.body;
    if (!restaurant_id || !items || !items.length) {
      return res.status(400).json({ ok: false, message: 'Données invalides' });
    }
    const restaurant = await db.restaurants.findOneAsync({ _id: restaurant_id });
    if (!restaurant) return res.status(404).json({ ok: false, message: 'Restaurant introuvable' });

    const total = items.reduce((s, item) => s + (item.prix * item.quantite), 0);
    const commande = await db.commandes.insertAsync({
      restaurant_id,
      items,
      client_nom: client_nom || 'Client',
      client_table: client_table || '',
      note: note || '',
      total,
      statut: 'en_attente',
      createdAt: new Date()
    });

    // Émettre via Socket.io
    if (req.app.get('io')) {
      req.app.get('io').to(`restaurant_${restaurant_id}`).emit('nouvelle_commande', {
        commande: { ...commande, restaurant_nom: restaurant.nom }
      });
    }

    res.json({ ok: true, commande_id: commande._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Erreur serveur' });
  }
});

// POST changer statut
router.post('/:id/statut', requireAuth, async (req, res) => {
  try {
    const { statut } = req.body;
    const valides = ['en_attente','en_preparation','servie','annulee'];
    if (!valides.includes(statut)) return res.status(400).json({ ok: false });

    await db.commandes.updateAsync(
      { _id: req.params.id, restaurant_id: req.session.restaurantId },
      { $set: { statut, updatedAt: new Date() } }
    );

    if (req.app.get('io')) {
      req.app.get('io').to(`restaurant_${req.session.restaurantId}`).emit('statut_commande', {
        commande_id: req.params.id, statut
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

// POST supprimer commande
router.post('/:id/supprimer', requireAuth, async (req, res) => {
  await db.commandes.removeAsync({ _id: req.params.id, restaurant_id: req.session.restaurantId });
  req.flash('success', 'Commande supprimée.');
  res.redirect('/commandes');
});

module.exports = router;
