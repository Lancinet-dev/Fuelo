# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 C'EST QUOI FUELO

SaaS de gestion de stations-service pour l'Afrique de l'Ouest (Guinée d'abord).
Permet aux propriétaires/gérants de gérer stock, ventes, alertes, employés et rapports depuis leur téléphone, en temps réel.

**Statut : EN PRODUCTION.**

- Frontend (Vercel) : https://fuelo-kappa.vercel.app
- Backend (Render)  : https://fuelo.onrender.com
- GitHub : repo `Fuelo` (compte Lancinet-dev), branche `main`, auto-deploy à chaque push

---

## 🏗️ ARCHITECTURE & STACK

**Backend** — Node.js + Express, architecture MVC + service layer
- `routes/` → définition des endpoints
- `controllers/` → reçoivent req/res, appellent les services
- `services/` → logique métier (transactions ACID, calculs)
- `middleware/` → auth (JWT), rateLimit, checkRole, checkPlan, errorHandler, upload (multer memoryStorage)
- `config/` → database.js (pool pg), passport.js (Google OAuth), cloudinary.js
- `utils/` → logger (Winston), checkEnv, socketNotify (ventes/alertes/GPS), cronJobs
- Base de données : PostgreSQL sur **Neon** (migré 2026-06-01, ex-Render). Projet `fuelo-prod`, région EU Central.
- Temps réel : Socket.IO — rooms par station `station_${id}` — events : `nouvelle_vente`, `alerte_stock`, `gps_update`
- Sécurité : JWT, bcrypt, helmet, CORS, rate limiting, validation **Zod v4** (noter : `err.issues` pas `err.errors` en v4), RBAC
- Stockage photos : Cloudinary v2 — upload via `cloudinary.uploader.upload()` avec base64 (PAS `upload_stream`, incompatible). Config : `signature_algorithm: 'sha256'`, `secure: true`.
- Monitoring : Sentry

**Frontend** — React + Vite + React Query
- `features/` → auth (+ NotFound 404), dashboard, ventes, stock, alertes, employes, parametres, profile, stations, services, trajets, logistique, pompiste, abonnements
- `ui/` → Sidebar, AppLayout, StatCard, SplashScreen, Skeleton, EmptyState, StockGauge
- `hooks/` → useAuth, useAlertes, useNotifications, useSocket, useService, useServices, useTrajet, useTrajets, useCiternes, useEmployes, useParametres, useStock, useVentes
- `context/` → AuthContext, ThemeContext (dark/light)
- `utils/` → export.js (PDF via jsPDF + ExcelJS pour Excel), format.js
- Export Excel : **ExcelJS** (pas SheetJS/xlsx — pas de styling). Les fonctions `exportVentesExcel` et `exportStockExcel` sont async.
- Carte GPS : Leaflet + OpenStreetMap (gratuit, pas de clé API)

---

## 🎨 DESIGN

- Couleur principale : bleu `#2563EB`
- Accent : orange `#F59E0B`
- Dark mode + Light mode via ThemeContext → toujours utiliser `palette` (pas de couleurs hardcodées)
- Styles inline React uniquement (pas de CSS séparé), avec objet `theme` importé de `config/theme.js`
- Logo sur fond sombre : `<FueloLogo size={36} forceTextColor="#fff" />`
- Police : DM Sans (web), Calibri dans les exports Excel

---

## 👥 RÔLES ET PERMISSIONS

| Rôle | Interface | Peut faire | Crée |
|---|---|---|---|
| `owner` | AppLayout (sidebar) | Voir tout, paramètres station/prix/seuils, multi-stations | gérant, logisticien |
| `gerant` | AppLayout (sidebar) | Ventes (export PDF/Excel), stock (livraisons), alertes, services | pompiste |
| `logisticien` | `/logistique` dédié | Citernes CRUD, trajets GPS, alertes transport, export Excel | chauffeur |
| `pompiste` | `/pompiste` dédié | Enregistrer ventes, démarrer/terminer son service (photo compteur) | — |
| `chauffeur` | `/chauffeur` dédié | Démarrer/terminer trajets GPS | — |
| `superadmin` | `/superadmin` dédié | Dashboard global : stats, tableau clients, abonnements | tous |

**Hiérarchie stricte (CREATION_RULES dans employeController.js) :**
- Owner → crée gérant + logisticien uniquement (pas de pompiste/chauffeur direct)
- Gérant → crée pompiste uniquement, voit seulement SES pompistes (`created_by`)
- Logisticien → crée chauffeur uniquement, voit seulement SES chauffeurs (`created_by`)
- Toggle/suppression : chaque rôle ne peut agir que sur ses propres créations

**Restrictions owner :**
- Lecture seule sur ventes (pas d'export PDF/Excel)
- Lecture seule sur stock (pas de livraison)
- Ne peut pas gérer les pompistes/chauffeurs directement

**Normalisation des rôles :** `manager` est toujours normalisé en `gerant` côté backend et frontend.

**checkRole.js** utilise deux fonctions :
- `checkRole(roles)` — vérifie par niveau (owner >= gerant >= pompiste/chauffeur/logisticien)
- `checkExactRole(roles)` — vérifie le rôle exact (utilisé pour `isPompiste`, `isChauffeur`)
- `canManageEmployes` — owner + gérant + logisticien (chacun dans son périmètre)

Comptes test prod :
- Owner : sadio@gmail.com
- Gérant : thiernon@gmail.com
- Pompiste : saliou@gmail.com (station 12)

---

## ✅ FONCTIONNALITÉS LIVRÉES

- Auth email/password + Google OAuth + reset password + **refresh tokens** (access 15min, refresh 30j cookie HttpOnly)
- Dashboard (stats temps réel, graphique 7 jours)
- Ventes (CRUD, pagination, filtres, export PDF + Excel — gérant uniquement)
- Stock (niveaux, livraisons — gérant uniquement)
- Alertes (STOCK_FAIBLE, FRAUDE, FRAUDE_CITERNE, ARRET_SUSPECT)
- **Employés — hiérarchie stricte RBAC** : owner→gérant/logisticien, gérant→pompiste, logisticien→chauffeur
  - Chaque rôle ne voit et ne gère que ses propres créations (`created_by`)
  - Soft delete, toggle actif/inactif dans le même périmètre
- Multi-stations, switch station
- Paramètres (infos station, prix, seuils — sans citernes, réservé au logisticien)
- **Logo station uploadable** (owner uniquement, Cloudinary) — visible sidebar + exports + pages employés
  - Colonne `logo_url` sur table `stations` (migration idempotente dans `migrate.js`)
- Page 404 personnalisée (`/features/auth/NotFound.jsx`)
- **Onboarding** première connexion owner
- Interface pompiste dédiée (`/pompiste`) — photo compteur obligatoire, upload Cloudinary
- PWA installable
- **Anti-fraude pompistes** — photos compteur début/fin, écart théorique/réel, alerte si > 10L
  - `POST /api/services`, `POST /api/services/:id/terminer`
- **GPS citernes** — trajet chauffeur temps réel, arrêt suspect (300m/10min), fraude citerne
  - Tables : `citernes`, `trajets`, `gps_points`
  - `station_destination_id` auto depuis `user.station_id` si non fourni
- **Rôle logisticien** — `/logistique` : Trajets, Citernes, Alertes transport, Rapports Excel
  - `isTransport` middleware : logisticien + owner + superadmin
  - Export trajets : **ExcelJS** avec styling pro (feuilles Résumé + Trajets)
- **Page abonnements** refaite (style Notion/Linear, 3 colonnes) — 3 plans : STARTER 50$, PRO 150$, ENTERPRISE 300$
  - Table `subscriptions`, middleware `checkPlan`, modal paiement simulé (Orange Money, MTN, PayCard, Kulu)
- WhatsApp retiré des pages internes (landing + login uniquement)
- Bouton déconnexion visible pour tous les rôles
- **Dashboard superadmin** — stats globales + tableau clients + abonnements (`/superadmin`)
- **Backup auto DB Neon** — GitHub Actions workflow `backup-neon.yml` (cron quotidien)
- **QR code anti-vol transport** — génération et scan QR sur les citernes/trajets
- **Primes et performance employés** — système de calcul et affichage des primes
- **Photos obligatoires chauffeur** — photo compteur départ ET arrivée (comme pompiste)
- **Anti-fraude pompiste renforcé** — overlay lock pendant service actif + résumé détaillé fin de service
- **Icônes SVG professionnelles** — remplacement complet des emojis par des SVG inline
- **Sidebar responsive mobile** — hamburger menu + drawer mobile
- **Skeleton loading** — états de chargement sur toutes les pages principales
- **Landing page V2 "agence internationale"** (2026-06-07) — refonte complète de `features/auth/Landing.jsx` avec **Framer Motion** (déjà en dépendance, `^12.40.0`)
  - 11 sections : Navbar glass au scroll → Hero (grille de points + orbes lumineux + titre "fraude" barré animé + mockup app 3D au survol) → Preuve sociale (marquee infini) → Problème/Solution (2 colonnes animées) → Features (6 cards 3×2) → Démo interactive (tabs Dashboard/Anti-fraude/GPS avec mockups SVG animés) → Pricing (toggle mensuel/annuel -20% + convertisseur USD/EUR/GNF/FCFA) → Témoignages → FAQ accordion → CTA gradient bleu→violet → Footer 4 colonnes
  - Palette : fond `#020817`, texte `#FFFFFF`, sous-texte `#94A3B8`, glassmorphism (`backdropFilter: blur`)
  - Respecte `prefers-reduced-motion` (orbes/particules désactivés, animations CSS raccourcies)
- **Assistant IA Fuelo** — chat flottant powered by Claude, réservé gérant/owner (`isManager`)
  - Frontend : `ui/AssistantFuelo.jsx` (drawer + FAB Framer Motion) + hook `useAssistant.js` (`useAssistantChat`)
  - Backend : route `POST /api/assistant`, `services/assistantService.js` — connaît en temps réel ventes/stock/alertes/performance de la station active
- **Audit sécurité complet** (2026-06-08, commit `8a84f99`) — 7 domaines passés en revue (auth, DB, API, uploads, env vars, RBAC, XSS/CSRF), 5 corrections appliquées :
  - RBAC : `POST /api/stock/livraison` n'avait aucun contrôle de rôle → ajout `checkExactRole(['gerant'])`
  - XSS reflété corrigé dans `sandboxSimulate` (abonnements) — `order_id`/`currency` de `req.query` étaient interpolés bruts dans le HTML
  - Upload logo station (`routes/station.js`) utilisait un multer local sans `fileFilter` → remplacé par `middleware/upload.js` partagé (images uniquement, 8 Mo)
  - CORS : origines `localhost` retirées de la liste blanche en production (seul `FRONTEND_URL` autorisé)
  - Fuite d'infos (CWE-209) : 51 occurrences de `res.status(500).json({ error: err.message })` remplacées par `erreurServeur(err)` (nouvel utilitaire `backend/utils/erreurServeur.js`) qui masque les détails internes (SQL, contraintes Postgres) en production

---

## 🔴 PROBLÈMES CONNUS

1. **Crons + Socket.IO peu fiables** — Render tier gratuit s'endort après 15 min. Cron rapports mensuels et vérif stock horaire non fiables → nécessite plan payant (~7$/mois).
2. ~~**Emails non envoyés en production (`/forgot-password` → 500 ou timeout)**~~ — **RÉSOLU le 2026-06-08** :
   - Étape 1 : `EMAIL_PASS` (mot de passe d'application Gmail) expiré → régénéré par l'utilisateur, mis à jour dans `.env` local ET sur Render. Connexion SMTP vérifiée en local avec succès.
   - Étape 2 : la colonne `reset_token`/`reset_token_expires` manquait sur la table `users` en prod (Neon) → migration idempotente appliquée (`ALTER TABLE users ADD COLUMN IF NOT EXISTS ...`).
   - Étape 3 — **cause racine réelle** : même avec des identifiants valides et les colonnes en place, la requête restait bloquée ~60s puis échouait (`HTTP 000`, connexion réinitialisée). **Render ne peut pas établir de connexions SMTP sortantes fiables** (ports 465/587 vers `smtp.gmail.com`) — limitation connue des plateformes cloud sur tier gratuit/standard.
   - **Fix définitif : migration de Nodemailer/Gmail SMTP vers [Resend](https://resend.com) (API HTTP sur port 443, jamais bloqué)**. Nouveau fichier `backend/utils/mailer.js` (fonction `envoyerEmail`, appel direct via `fetch` natif — pas de nouvelle dépendance npm) utilisé par `forgotPasswordController.js` et `backupService.js`. `reportService.js` (code mort, non monté) garde encore Nodemailer mais n'est jamais exécuté.
   - **Variables d'environnement requises (local `.env` ET Render)** : `RESEND_API_KEY` (obligatoire — créer un compte sur resend.com puis générer une clé API), `RESEND_FROM_EMAIL` (optionnel, défaut `Fuelo <onboarding@resend.dev>` — expéditeur sandbox utilisable sans domaine vérifié ; à remplacer par une adresse `@fuelo.africa` une fois le domaine personnalisé vérifié sur Resend).
   - Anciennes variables `EMAIL_USER`/`EMAIL_PASS`/`EMAIL_SERVICE` conservées (encore utilisées comme adresse `to` de secours dans `backupService.js` et par le code mort `reportService.js`) mais ne servent plus à l'envoi SMTP actif.
3. ~~**GOOGLE_CLIENT_SECRET à régénérer sur Render**~~ — **RÉSOLU le 2026-06-08** : régénéré et mis à jour sur Render par l'utilisateur. `JWT_SECRET`, `EMAIL_PASS` et `GOOGLE_CLIENT_SECRET` sont désormais tous régénérés.
4. ~~**Google OAuth cassé en prod — `BACKEND_URL` mal configuré sur Render**~~ — **RÉSOLU le 2026-06-07** :
   - Diagnostic : `BACKEND_URL` sur Render valait `https://fuelo-backend.onrender.com` (ancien nom de service, 404) au lieu de `https://fuelo.onrender.com` → `passport.js` construisait un `callbackURL`/`redirect_uri` ne correspondant pas à celui enregistré dans Google Cloud Console → **Erreur 400 : redirect_uri_mismatch**.
   - Fix appliqué par l'utilisateur sur Render → Environment (`BACKEND_URL` → `https://fuelo.onrender.com`), redéploiement auto effectué.
   - **Vérifié en reproduction** (`curl -sv https://fuelo.onrender.com/api/auth/google`) : le `redirect_uri` envoyé à Google est désormais `https%3A%2F%2Ffuelo.onrender.com%2Fapi%2Fauth%2Fgoogle%2Fcallback` (correct). `FRONTEND_URL` et `GOOGLE_CLIENT_ID` confirmés corrects également.
   - `GOOGLE_CLIENT_SECRET` régénéré depuis (point 3 ci-dessus) — si `?error=server_error` réapparaît au retour du bouton "Se connecter avec Google", revérifier ce secret en premier (intervient à l'échange du code, après le redirect, non testable par `curl` seul).

---

## ⏳ FONCTIONNALITÉS À CODER (priorité)

### Restant
- Migration Railway (remplacer Render, ~5$/mois) — règle aussi la fiabilité des crons
- Paiements Mobile Money réels (MTN MoMo API, agrégateur CinetPay/Bizao pour Orange Money)
- Domaine personnalisé fuelo.africa

---

## 📝 CONVENTIONS DE CODE

- Français pour les commentaires, messages utilisateur, noms métier
- **NE PAS** utiliser `toLocaleString` dans les PDF/exports → bug `&&&`. Utiliser :
  ```js
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  ```
- Soft delete : toujours `deleted_at IS NULL` dans les requêtes
- Routes spécifiques AVANT routes paramétrées (ex: `/actif` avant `/:id`)
- Zod v4 : utiliser `err.issues ?? err.errors ?? []` dans le middleware `validate`
- Erreurs 500 : toujours utiliser `erreurServeur(err)` (`backend/utils/erreurServeur.js`) dans `res.status(500).json({ error: ... })` — jamais `err.message` brut (fuite de détails internes type requêtes SQL/contraintes Postgres en prod, CWE-209)
- `multer` : utiliser `memoryStorage()` + upload manuel Cloudinary (pas `multer-storage-cloudinary`). Pour les uploads d'images, réutiliser le middleware partagé `middleware/upload.js` (fileFilter images uniquement + limite 8 Mo) plutôt que de créer une instance multer locale
- `.npmrc` dans `backend/` contient `legacy-peer-deps=true` (conflit cloudinary v2 / multer-storage-cloudinary)

---

## 🔧 COMMANDES UTILES

```bash
# Backend (local)
cd backend && npm run dev        # nodemon sur server.js

# Frontend (local)
cd frontend && npm run dev       # Vite sur localhost:5173

# Migration DB (idempotent — CREATE TABLE IF NOT EXISTS)
cd backend && node migrate.js    # nécessite DATABASE_URL en env

# Déploiement
git add . && git commit -m "..." && git push   # auto-deploy Render + Vercel
```

---

## ⚠️ RAPPELS IMPORTANTS

- En local : variables DB séparées (DB_HOST, DB_PORT...). En prod : `DATABASE_URL`. `database.js` + `checkEnv.js` supportent les deux.
- `server.js` importe `reportsRoute` : le fichier `routes/reportsRoute.js` existe mais `services/reportService.js` n'existe plus. La route `/api/reports` a été **retirée** du serveur.
- Toujours commiter avant les grosses modifications.
- Le build Render échouait à cause de `require('./routes/reports')` (fichier inexistant) + conflit peer deps cloudinary. Les deux sont réglés.
