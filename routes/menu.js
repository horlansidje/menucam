const express = require('express');
const router  = express.Router();
const db      = require('../models/db');

router.get('/:restaurant_id', async (req, res) => {
  try {
    const restaurant = await db.restaurants.findOneAsync({ _id: req.params.restaurant_id });
    if (!restaurant || !restaurant.actif) return res.render('client/menu-404');
    const plats = await db.plats.findAsync({ restaurant_id: req.params.restaurant_id, disponible: true });
    // Promotions actives
    const promos = await db.promos.findAsync({ restaurant_id: req.params.restaurant_id, actif: true });
    promos.forEach(p => {
      if (p.plat_id) {
        const plat = plats.find(pl => pl._id === p.plat_id);
        if (plat) plat.promo_prix = p.type === 'pourcentage' ? Math.round(plat.prix * (1 - p.valeur/100)) : plat.prix - p.valeur;
      }
    });
    const categories = {};
    plats.forEach(p => { if (!categories[p.categorie]) categories[p.categorie] = []; categories[p.categorie].push(p); });
    const avis = await db.avis.findAsync({ restaurant_id: req.params.restaurant_id });
    avis.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.render('client/menu', { restaurant, categories, plats, avis: avis.slice(0,5) });
  } catch (err) { console.error(err); res.render('client/menu-404'); }
});

module.exports = router;
