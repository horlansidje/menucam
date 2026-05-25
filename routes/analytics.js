const express = require('express');
const router  = express.Router();
const db      = require('../models/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const rid = req.session.restaurantId;
  const commandes = await db.commandes.findAsync({ restaurant_id: rid });
  const plats     = await db.plats.findAsync({ restaurant_id: rid });
  const avis      = await db.avis.findAsync({ restaurant_id: rid });

  // CA 7 derniers jours
  const ca7j = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const fin = new Date(d); fin.setHours(23,59,59,999);
    const cmds = commandes.filter(c => { const cd = new Date(c.createdAt); return cd >= d && cd <= fin && c.statut !== 'annulee'; });
    ca7j.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), ca: cmds.reduce((s,c)=>s+(c.total||0),0), nb: cmds.length });
  }

  // Top plats
  const platCount = {};
  commandes.filter(c=>c.statut!=='annulee').forEach(cmd => {
    (cmd.items||[]).forEach(item => {
      platCount[item.nom] = (platCount[item.nom]||0) + (item.quantite||1);
    });
  });
  const topPlats = Object.entries(platCount).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([nom,count])=>({ nom, count }));

  // Heures de pointe
  const heures = Array(24).fill(0);
  commandes.forEach(c => { heures[new Date(c.createdAt).getHours()]++; });

  // Stats globales
  const caTotal     = commandes.filter(c=>c.statut!=='annulee').reduce((s,c)=>s+(c.total||0),0);
  const today       = new Date(); today.setHours(0,0,0,0);
  const caAuj       = commandes.filter(c=>new Date(c.createdAt)>=today && c.statut!=='annulee').reduce((s,c)=>s+(c.total||0),0);
  const noteMoyenne = avis.length ? (avis.reduce((s,a)=>s+a.note,0)/avis.length).toFixed(1) : 0;

  res.render('restaurateur/analytics', {
    ca7j, topPlats, heures,
    stats: { caTotal, caAuj, totalCommandes: commandes.length, noteMoyenne, nbAvis: avis.length, nbPlats: plats.length },
    error: req.flash('error')
  });
});

// API pour graphiques
router.get('/api/ca', requireAuth, async (req, res) => {
  const { periode } = req.query;
  const commandes = await db.commandes.findAsync({ restaurant_id: req.session.restaurantId });
  const jours = parseInt(periode)||7;
  const data  = [];
  for (let i = jours-1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
    const fin = new Date(d); fin.setHours(23,59,59,999);
    const cmds = commandes.filter(c => { const cd = new Date(c.createdAt); return cd>=d && cd<=fin && c.statut!=='annulee'; });
    data.push({ label: d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'}), ca: cmds.reduce((s,c)=>s+(c.total||0),0), nb: cmds.length });
  }
  res.json(data);
});

module.exports = router;
