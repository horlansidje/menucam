const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../models/db');

// GET inscription
router.get('/inscription', (req, res) => {
  res.render('auth/inscription', { error: req.flash('error'), success: req.flash('success') });
});

// POST inscription
router.post('/inscription', async (req, res) => {
  try {
    const { nom, email, telephone, adresse, ville, password, password2 } = req.body;
    if (!nom || !email || !telephone || !password) {
      req.flash('error', 'Tous les champs obligatoires doivent être remplis.');
      return res.redirect('/auth/inscription');
    }
    if (password !== password2) {
      req.flash('error', 'Les mots de passe ne correspondent pas.');
      return res.redirect('/auth/inscription');
    }
    if (password.length < 6) {
      req.flash('error', 'Le mot de passe doit contenir au moins 6 caractères.');
      return res.redirect('/auth/inscription');
    }
    const existing = await db.restaurants.findOneAsync({ email: email.toLowerCase() });
    if (existing) {
      req.flash('error', 'Un compte existe déjà avec cet email.');
      return res.redirect('/auth/inscription');
    }
    const hash = await bcrypt.hash(password, 10);
    const restaurant = await db.restaurants.insertAsync({
      nom, email: email.toLowerCase(), telephone,
      adresse: adresse || '', ville: ville || 'Douala',
      password: hash,
      logo: null,
      description: '',
      actif: true,
      createdAt: new Date()
    });
    req.session.restaurantId  = restaurant._id;
    req.session.restaurantNom = restaurant.nom;
    res.redirect('/dashboard');
  } catch (err) {
    if (err.errorType === 'uniqueViolated') {
      req.flash('error', 'Un compte existe déjà avec cet email.');
    } else {
      req.flash('error', 'Erreur serveur. Réessayez.');
      console.error(err);
    }
    res.redirect('/auth/inscription');
  }
});

// GET connexion
router.get('/connexion', (req, res) => {
  res.render('auth/connexion', { error: req.flash('error') });
});

// POST connexion
router.post('/connexion', async (req, res) => {
  try {
    const { email, password } = req.body;
    const restaurant = await db.restaurants.findOneAsync({ email: email.toLowerCase() });
    if (!restaurant) {
      req.flash('error', 'Email ou mot de passe incorrect.');
      return res.redirect('/auth/connexion');
    }
    const ok = await bcrypt.compare(password, restaurant.password);
    if (!ok) {
      req.flash('error', 'Email ou mot de passe incorrect.');
      return res.redirect('/auth/connexion');
    }
    req.session.restaurantId  = restaurant._id;
    req.session.restaurantNom = restaurant.nom;
    res.redirect('/dashboard');
  } catch (err) {
    req.flash('error', 'Erreur serveur. Réessayez.');
    console.error(err);
    res.redirect('/auth/connexion');
  }
});

// GET déconnexion
router.get('/deconnexion', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
