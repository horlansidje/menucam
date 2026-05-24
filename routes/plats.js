const express = require('express');
const router  = express.Router();
const db      = require('../models/db');
const { requireAuth } = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `plat_${Date.now()}_${Math.random().toString(36).substr(2,6)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Image requise'));
  }
});

// GET liste plats
router.get('/', requireAuth, async (req, res) => {
  const plats = await db.plats.findAsync({ restaurant_id: req.session.restaurantId });
  const categories = [...new Set(plats.map(p => p.categorie))].filter(Boolean);
  res.render('restaurateur/plats', {
    plats: plats.sort((a,b)=> a.categorie?.localeCompare(b.categorie)||0),
    categories,
    error: req.flash('error'), success: req.flash('success')
  });
});

// GET formulaire ajout
router.get('/nouveau', requireAuth, (req, res) => {
  res.render('restaurateur/plat-form', { plat: null, error: req.flash('error') });
});

// POST ajout plat
router.post('/nouveau', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const { nom, description, prix, categorie, disponible } = req.body;
    if (!nom || !prix || !categorie) {
      req.flash('error', 'Nom, prix et catégorie sont obligatoires.');
      return res.redirect('/plats/nouveau');
    }
    await db.plats.insertAsync({
      restaurant_id: req.session.restaurantId,
      nom, description: description || '',
      prix: parseFloat(prix),
      categorie,
      disponible: disponible === 'on',
      photo: req.file ? '/uploads/' + req.file.filename : null,
      createdAt: new Date()
    });
    req.flash('success', `Plat "${nom}" ajouté avec succès !`);
    res.redirect('/plats');
  } catch (err) {
    req.flash('error', 'Erreur lors de l\'ajout du plat.');
    res.redirect('/plats/nouveau');
  }
});

// GET formulaire modification
router.get('/:id/modifier', requireAuth, async (req, res) => {
  const plat = await db.plats.findOneAsync({ _id: req.params.id, restaurant_id: req.session.restaurantId });
  if (!plat) return res.redirect('/plats');
  res.render('restaurateur/plat-form', { plat, error: req.flash('error') });
});

// POST modification plat
router.post('/:id/modifier', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const { nom, description, prix, categorie, disponible } = req.body;
    const update = { nom, description, prix: parseFloat(prix), categorie, disponible: disponible === 'on' };
    if (req.file) update.photo = '/uploads/' + req.file.filename;
    await db.plats.updateAsync(
      { _id: req.params.id, restaurant_id: req.session.restaurantId },
      { $set: update }
    );
    req.flash('success', 'Plat mis à jour !');
    res.redirect('/plats');
  } catch (err) {
    req.flash('error', 'Erreur lors de la modification.');
    res.redirect('/plats');
  }
});

// POST toggle disponibilité
router.post('/:id/toggle', requireAuth, async (req, res) => {
  const plat = await db.plats.findOneAsync({ _id: req.params.id, restaurant_id: req.session.restaurantId });
  if (plat) await db.plats.updateAsync({ _id: plat._id }, { $set: { disponible: !plat.disponible } });
  res.json({ ok: true, disponible: !plat?.disponible });
});

// POST supprimer plat
router.post('/:id/supprimer', requireAuth, async (req, res) => {
  await db.plats.removeAsync({ _id: req.params.id, restaurant_id: req.session.restaurantId });
  req.flash('success', 'Plat supprimé.');
  res.redirect('/plats');
});

module.exports = router;
