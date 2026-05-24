const express = require('express');
const router  = express.Router();
const db      = require('../models/db');
const { requireAuth } = require('../middleware/auth');
const QRCode  = require('qrcode');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

// Multer config for logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo_${req.session.restaurantId}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Fichier image requis'));
  }
});

// GET dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const restaurant = await db.restaurants.findOneAsync({ _id: req.session.restaurantId });
    const plats      = await db.plats.findAsync({ restaurant_id: req.session.restaurantId });
    const commandes  = await db.commandes.findAsync({ restaurant_id: req.session.restaurantId });

    // Stats
    const today = new Date(); today.setHours(0,0,0,0);
    const commandesAujourdhui = commandes.filter(c => new Date(c.createdAt) >= today);
    const caAujourdhui = commandesAujourdhui
      .filter(c => c.statut !== 'annulee')
      .reduce((sum, c) => sum + (c.total || 0), 0);

    // QR code URL
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const menuUrl = `${baseUrl}/menu/${restaurant._id}`;
    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 300, margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    // Commandes récentes (10 dernières)
    const commandesRecentes = commandes
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.render('restaurateur/dashboard', {
      restaurant, plats, qrDataUrl, menuUrl,
      stats: {
        totalPlats: plats.length,
        commandesAujourdhui: commandesAujourdhui.length,
        caAujourdhui,
        commandesEnAttente: commandes.filter(c => c.statut === 'en_attente').length
      },
      commandesRecentes,
      error:   req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    res.redirect('/auth/connexion');
  }
});

// GET profil
router.get('/profil', requireAuth, async (req, res) => {
  const restaurant = await db.restaurants.findOneAsync({ _id: req.session.restaurantId });
  res.render('restaurateur/profil', { restaurant, error: req.flash('error'), success: req.flash('success') });
});

// POST update profil
router.post('/profil', requireAuth, upload.single('logo'), async (req, res) => {
  try {
    const { nom, telephone, adresse, ville, description } = req.body;
    const update = { nom, telephone, adresse, ville, description };
    if (req.file) update.logo = '/uploads/' + req.file.filename;
    await db.restaurants.updateAsync({ _id: req.session.restaurantId }, { $set: update });
    req.session.restaurantNom = nom;
    req.flash('success', 'Profil mis à jour avec succès !');
    res.redirect('/dashboard/profil');
  } catch (err) {
    req.flash('error', 'Erreur lors de la mise à jour.');
    res.redirect('/dashboard/profil');
  }
});

module.exports = router;
