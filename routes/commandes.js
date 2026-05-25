const express = require('express');
const router  = express.Router();
const db      = require('../models/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const { statut, date, type } = req.query;
  let query = { restaurant_id: req.session.restaurantId };
  if (statut && statut !== 'toutes') query.statut = statut;
  if (type   && type   !== 'tous')   query.type_livraison = type;
  let commandes = await db.commandes.findAsync(query);
  if (date) {
    const d = new Date(date); d.setHours(0,0,0,0);
    const fin = new Date(date); fin.setHours(23,59,59,999);
    commandes = commandes.filter(c => { const cd = new Date(c.createdAt); return cd>=d && cd<=fin; });
  }
  commandes.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const livreurs = await db.livreurs.findAsync({ restaurant_id: req.session.restaurantId, statut: 'disponible' });
  const all      = await db.commandes.findAsync({ restaurant_id: req.session.restaurantId });
  const today    = new Date(); today.setHours(0,0,0,0);
  const todayC   = all.filter(c=>new Date(c.createdAt)>=today);
  res.render('restaurateur/commandes', {
    commandes, livreurs,
    filtreStatut: statut||'toutes', filtreDate: date||'', filtreType: type||'tous',
    stats: {
      enAttente: all.filter(c=>c.statut==='en_attente').length,
      enPreparation: all.filter(c=>c.statut==='en_preparation').length,
      enLivraison: all.filter(c=>c.statut==='en_livraison').length,
      servies: all.filter(c=>c.statut==='servie'||c.statut==='livree').length,
      caTodal: todayC.filter(c=>c.statut!=='annulee').reduce((s,c)=>s+(c.total||0),0)
    },
    error: req.flash('error'), success: req.flash('success')
  });
});

router.post('/nouvelle', async (req, res) => {
  try {
    const { restaurant_id, items, client_nom, client_telephone, client_adresse, client_quartier, client_table, note, type_livraison, paiement, promo_code, total_avant_promo, reduction, total } = req.body;
    if (!restaurant_id || !items?.length) return res.status(400).json({ ok: false, message: 'Données invalides' });
    const restaurant = await db.restaurants.findOneAsync({ _id: restaurant_id });
    if (!restaurant) return res.status(404).json({ ok: false });
    const num = 'CMD-' + Date.now().toString(36).toUpperCase();
    const commande = await db.commandes.insertAsync({
      restaurant_id, num_commande: num,
      items, client_nom: client_nom||'Client',
      client_telephone: client_telephone||'',
      client_adresse: client_adresse||'',
      client_quartier: client_quartier||'',
      client_table: client_table||'',
      note: note||'', type_livraison: type_livraison||'sur_place',
      paiement: paiement||'whatsapp',
      promo_code: promo_code||null,
      total_avant_promo: parseFloat(total_avant_promo)||0,
      reduction: parseFloat(reduction)||0,
      total: parseFloat(total)||0,
      statut: 'en_attente', livreur_id: null,
      createdAt: new Date()
    });
    // Incrémenter utilisation promo
    if (promo_code) await db.promos.updateAsync({ restaurant_id, code: promo_code }, { $inc: { utilisations: 1 } });
    if (req.app.get('io')) req.app.get('io').to(`restaurant_${restaurant_id}`).emit('nouvelle_commande', { commande: { ...commande, restaurant_nom: restaurant.nom } });
    res.json({ ok: true, commande_id: commande._id, num_commande: num });
  } catch (err) { console.error(err); res.status(500).json({ ok: false }); }
});

router.post('/:id/statut', requireAuth, async (req, res) => {
  const { statut, livreur_id } = req.body;
  const valides = ['en_attente','en_preparation','en_livraison','servie','livree','annulee'];
  if (!valides.includes(statut)) return res.status(400).json({ ok: false });
  const update = { statut, updatedAt: new Date() };
  if (livreur_id) { update.livreur_id = livreur_id; await db.livreurs.updateAsync({ _id: livreur_id }, { $set: { statut: 'occupé' } }); }
  if (statut === 'livree' || statut === 'servie') {
    const cmd = await db.commandes.findOneAsync({ _id: req.params.id });
    if (cmd?.livreur_id) await db.livreurs.updateAsync({ _id: cmd.livreur_id }, { $set: { statut: 'disponible' }, $inc: { commandes_livrees: 1 } });
  }
  await db.commandes.updateAsync({ _id: req.params.id, restaurant_id: req.session.restaurantId }, { $set: update });
  if (req.app.get('io')) req.app.get('io').to(`restaurant_${req.session.restaurantId}`).emit('statut_commande', { commande_id: req.params.id, statut });
  res.json({ ok: true });
});

router.post('/:id/supprimer', requireAuth, async (req, res) => {
  await db.commandes.removeAsync({ _id: req.params.id, restaurant_id: req.session.restaurantId });
  req.flash('success', 'Commande supprimée.');
  res.redirect('/commandes');
});

// Suivi commande (public)
router.get('/suivi/:num', async (req, res) => {
  const commande = await db.commandes.findOneAsync({ num_commande: req.params.num });
  if (!commande) return res.render('client/suivi-404');
  const restaurant = await db.restaurants.findOneAsync({ _id: commande.restaurant_id });
  let livreur = null;
  if (commande.livreur_id) livreur = await db.livreurs.findOneAsync({ _id: commande.livreur_id });
  res.render('client/suivi', { commande, restaurant, livreur });
});

module.exports = router;
