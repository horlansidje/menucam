const express = require('express');
const router  = express.Router();
const db      = require('../models/db');

// GET menu public (page client après scan QR)
router.get('/:restaurant_id', async (req, res) => {
  try {
    const restaurant = await db.restaurants.findOneAsync({ _id: req.params.restaurant_id });
    if (!restaurant || !restaurant.actif) {
      return res.render('client/menu-404');
    }
    const plats = await db.plats.findAsync({
      restaurant_id: req.params.restaurant_id,
      disponible: true
    });

    // Grouper par catégorie
    const categories = {};
    plats.forEach(p => {
      if (!categories[p.categorie]) categories[p.categorie] = [];
      categories[p.categorie].push(p);
    });

    res.render('client/menu', { restaurant, categories, plats });
  } catch (err) {
    console.error(err);
    res.render('client/menu-404');
  }
});

module.exports = router;
