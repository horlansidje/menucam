# MenuCam V3 Enhanced

Plateforme SaaS de gestion restaurant avec menu QR Code et commandes en ligne.

## Démarrage rapide

    npm install
    npm start          # production
    npm run dev        # développement (nodemon)

Accès démo : http://localhost:3000
Email : demo@menucam.cm | Mot de passe : demo1234

## Nouvelles fonctionnalités V3 Enhanced

### 1. Gestion dynamique des catégories (/categories)
- Chaque restaurant crée ses propres catégories (Grillades, Boissons, Desserts...)
- Emoji ou image illustrative par catégorie
- Activation/désactivation sans suppression
- Réordonnage par glisser-déposer
- Validation anti-doublon côté serveur
- Catégories inactives masquées côté client

### 2. Gestion des horaires d'ouverture (/horaires)
- Configuration jour par jour (lundi à dimanche)
- Marquage Fermé pour certains jours
- Statut manuel : Auto / Forcer Ouvert / Forcer Fermé / Temporairement indisponible
- Calcul automatique selon l'heure courante
- Badge statut affiché sur le menu client en temps réel

### 3. Annulation de commande avec délai
- Compte à rebours circulaire de 5 minutes sur la page suivi
- Vérification côté serveur (délai + statut de la commande)
- Impossible si commande déjà acceptée ou en préparation
- Délai configurable via DELAI_ANNULATION_MIN dans .env
- Routes : POST /commandes/:num/annuler-client, GET /commandes/:num/delai-annulation

### 4. Programme de fidélité client (/fidelite)
- Configuration du montant mensuel minimum déclencheur
- Récompenses automatiques après chaque commande
- Types : reduction %, livraison gratuite, dessert offert, code promo
- Tableau des clients fidèles du mois avec barre de progression
- Historique complet des récompenses

### 5. Menu public sans QR Code (/restaurants)
- Moteur de recherche public avec filtre par ville
- URL publique par slug : /restaurants/nom-du-restaurant
- Statut d'ouverture en temps réel sur les cartes
- Compatible SEO
- Le QR Code continue de fonctionner normalement
- Slugs générés automatiquement au démarrage

### 6. Geolocalisation a l'inscription (/auth/inscription)
- Carte interactive Leaflet + OpenStreetMap (gratuit, sans API key)
- Clic sur la carte pour obtenir les coordonnees GPS
- Marqueur deplacable pour affiner la position
- Geocodage inverse automatique via Nominatim
- Latitude et longitude stockees en base de donnees

### 7. Suivi de commande redesigne (/commandes/suivi/:num)
- Design dark theme professionnel
- Timeline animee avec 4 etapes illustrees
- Barre de progression avec pourcentage
- Compte a rebours d'annulation (cercle SVG anime)
- Mise a jour temps reel via Socket.io

## Variables d'environnement (.env)

    PORT=3000
    SESSION_SECRET=votre_secret_unique_ici
    DB_PATH=./data
    DELAI_ANNULATION_MIN=5

## Nouvelles collections NeDB

- data/categories.db  — Categories de plats par restaurant
- data/fidelite.db    — Recompenses fidelite

Les restaurants existants recoivent un slug URL genere automatiquement au demarrage.

## Architecture

    server.js
    models/db.js
    routes/
      auth.js, categories.js, horaires.js, fidelite.js,
      restaurants.js, menu.js, commandes.js, dashboard.js,
      plats.js, livreurs.js, promos.js, analytics.js, avis.js
    views/
      partials/(head, sidebar)
      auth/inscription.ejs
      restaurateur/(dashboard, categories, horaires, fidelite)
      client/(menu, suivi)
      public/restaurants.ejs
    public/css/app.css
    public/js/(app.js, menu-public.js)
