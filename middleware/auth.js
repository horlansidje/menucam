function requireAuth(req, res, next) {
  if (req.session && req.session.restaurantId) return next();
  req.flash('error', 'Veuillez vous connecter pour accéder à cette page.');
  res.redirect('/auth/connexion');
}

module.exports = { requireAuth };
