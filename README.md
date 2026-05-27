# 🍽️ MenuCam V3 — Plateforme SaaS Restaurant Premium

Plateforme complète de gestion restaurant avec menu QR Code, livraison, paiement Mobile Money, reçus PDF, suivi commandes en temps réel et analytics avancés.

## 🚀 Installation rapide

```bash
cd menucam-v3
npm install
npm start
# → http://localhost:3000
```

## 📧 Compte démo (créé automatiquement au premier démarrage)
- **Email** : demo@menucam.cm
- **Mot de passe** : demo1234
- **Restaurant** : Chez Maman Biya — Douala (27 plats camerounais)

## ⚙️ Variables d'environnement (.env)
```
PORT=3000
SESSION_SECRET=votre_secret_fort
BASE_URL=https://votre-domaine.com
DB_PATH=./data
```

## 🌐 Déploiement Railway
1. `git push` sur GitHub
2. Railway détecte Node.js et déploie automatiquement
3. Variables à ajouter dans Railway → Variables :
   - SESSION_SECRET, BASE_URL, DB_PATH=./data, PORT=3000

## ✨ Fonctionnalités V3

| Module | Description |
|--------|-------------|
| 🎨 Design premium | Sidebar moderne, typographie Bricolage Grotesque + Plus Jakarta Sans |
| 📱 Menu QR Code | Page menu responsive avec recherche, filtres, animations |
| 🛵 Livraison | Livreurs, assignation, suivi temps réel Socket.io |
| 💳 Mobile Money | MTN & Orange Money avec instructions USSD |
| 📄 Reçus PDF | PDF professionnel avec QR code de suivi inclus |
| 📦 Suivi commandes | Lien unique par commande, expire 24h après livraison |
| 📊 Analytics | Chart.js — CA hebdo, top plats, heures de pointe |
| ⭐ Avis clients | Notation 5 étoiles, réponses du restaurateur |
| 🎁 Codes promo | Pourcentage, montant fixe, limite usage, expiration |
| 🔒 Sécurité | bcrypt, sessions, expiry des liens de suivi |

## 🛠️ Stack technique
- **Backend** : Node.js + Express.js
- **DB** : NeDB (@seald-io/nedb) — fichiers locaux, zéro config
- **Templates** : EJS
- **Temps réel** : Socket.io
- **PDF** : PDFKit
- **QR Code** : qrcode
- **Auth** : bcryptjs + express-session
- **Upload** : Multer
- **Charts** : Chart.js (CDN)
- **Icons** : Bootstrap Icons (CDN)
