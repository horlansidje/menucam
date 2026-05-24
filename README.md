# 🍽️ MenuCam — Générateur de Menus QR Code pour Restaurants

Plateforme SaaS locale permettant aux restaurateurs camerounais de créer leur menu digital,
générer un QR Code unique, et recevoir des commandes via WhatsApp en temps réel.

---

## 🚀 Installation rapide (locale)

### Prérequis
- Node.js >= 18
- npm

### 1. Cloner et installer
```bash
git clone <votre-repo>
cd qrcode-restaurant
npm install
```

### 2. Configuration
```bash
cp .env.example .env
# Éditez .env si nécessaire
```

### 3. Lancer
```bash
npm start          # Production
npm run dev        # Développement (auto-reload)
```

### 4. Ouvrir
```
http://localhost:3000
```

---

## 🌐 Déploiement sur Railway (gratuit)

### Étapes
1. Créer un compte sur [railway.app](https://railway.app)
2. Nouveau projet → Deploy from GitHub repo
3. Variables d'environnement à configurer :

```
PORT=3000
SESSION_SECRET=votre_secret_fort_ici
BASE_URL=https://votre-app.up.railway.app
DB_PATH=./data
```

4. Railway détecte automatiquement Node.js et lance `npm start`
5. Votre app est en ligne en 2 minutes ✅

### Alternative : Render.com
1. [render.com](https://render.com) → New Web Service
2. Build Command : `npm install`
3. Start Command : `npm start`
4. Mêmes variables d'environnement

---

## 📁 Structure du projet

```
qrcode-restaurant/
├── server.js              # Point d'entrée + Socket.io
├── models/
│   └── db.js              # Base de données NeDB (fichiers locaux)
├── middleware/
│   └── auth.js            # Protection des routes
├── routes/
│   ├── auth.js            # Inscription / Connexion
│   ├── dashboard.js       # Dashboard restaurateur + QR code
│   ├── plats.js           # CRUD plats du menu
│   ├── commandes.js       # Gestion commandes + Socket.io
│   └── menu.js            # Page menu publique (clients)
├── views/
│   ├── index.ejs          # Landing page
│   ├── 404.ejs
│   ├── partials/          # Navbar, head
│   ├── auth/              # Connexion, Inscription
│   ├── restaurateur/      # Dashboard, Plats, Commandes, Profil
│   └── client/            # Menu public après scan QR
├── public/
│   ├── css/               # Styles par page
│   ├── js/                # Scripts client
│   └── uploads/           # Photos plats (auto-créé)
├── data/                  # Base de données NeDB (auto-créé)
├── .env.example
└── package.json
```

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🏪 Multi-restaurants | Chaque restaurant a son propre compte |
| 📱 QR Code unique | Généré automatiquement, téléchargeable en PNG |
| 🍽️ Menu digital | Plats par catégorie avec photos, prix en FCFA |
| 💬 Commande WhatsApp | Message pré-rempli envoyé automatiquement |
| ⚡ Temps réel | Socket.io : nouvelles commandes sans refresh |
| 👨‍🍳 Gestion statuts | En attente → En préparation → Servie |
| 📊 Dashboard | Stats du jour, CA, commandes en attente |
| 📸 Upload photos | Photos des plats et logo du restaurant |
| 🔐 Auth sécurisée | bcrypt, sessions, middleware de protection |
| 📱 Responsive | Menu client optimisé mobile |

---

## 🎯 Scénario de démo jury

1. Le jury scanne le QR code posé sur la table avec leur téléphone
2. Le menu s'ouvre instantanément (photos, plats, prix en FCFA)
3. Ils sélectionnent un jus de fruit et cliquent "Ajouter"
4. Ils ouvrent le panier → "Commander via WhatsApp"
5. Un message pré-rempli s'ouvre → ils envoient en 1 clic
6. Le dashboard restaurateur affiche la commande en temps réel
7. Un équipier apporte le vrai jus 2 minutes après 🎉

---

## 💰 Modèle économique

- **Gratuit** : 20 plats, 1 QR code
- **Pro** : 15 000 FCFA/mois — plats et commandes illimités
- **Business** : 25 000 FCFA/mois — multi-restaurants, rapports PDF

---

## 🛠️ Stack technique

- **Backend** : Node.js + Express.js
- **Base de données** : NeDB (fichiers locaux, zéro configuration)
- **Templates** : EJS
- **Temps réel** : Socket.io
- **Auth** : bcryptjs + express-session
- **Upload** : Multer
- **QR Code** : qrcode.js
- **Fonts** : Syne + DM Sans (Google Fonts)

---

Fait avec ❤️ à Douala, Cameroun · 2024
