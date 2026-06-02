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

| Rôle | Interface | Peut faire |
|---|---|---|
| `owner` | AppLayout (sidebar) | Voir tout, gérer employés (CRUD), paramètres station/prix/seuils, multi-stations |
| `gerant` | AppLayout (sidebar) | Ventes, stock (livraisons), alertes, voir employés (lecture seule), paramètres |
| `pompiste` | `/pompiste` dédié | Enregistrer ventes, démarrer/terminer son service (photo compteur) |
| `chauffeur` | `/chauffeur` dédié | Démarrer/terminer trajets GPS |
| `logisticien` | `/logistique` dédié | Citernes CRUD, trajets, alertes transport, export Excel |
| `superadmin` | Prévu, pas codé | — |

**Restrictions owner vs gérant :**
- Owner : lecture seule sur ventes (pas d'export PDF/Excel), lecture seule sur stock (pas de livraison), gère les employés
- Gérant : peut exporter PDF/Excel, enregistrer livraisons, mais ne peut PAS créer/supprimer/toggler des employés
- Citernes : gérant exclus, logisticien uniquement (via `/logistique`)

**Normalisation des rôles :** `manager` est toujours normalisé en `gerant` côté backend et frontend.

**checkRole.js** utilise deux fonctions :
- `checkRole(roles)` — vérifie par niveau (owner >= gerant >= pompiste/chauffeur/logisticien)
- `checkExactRole(roles)` — vérifie le rôle exact (utilisé pour `isPompiste`, `isChauffeur`)

Comptes test prod :
- Owner : sadio@gmail.com
- Gérant : thiernon@gmail.com
- Pompiste : saliou@gmail.com (station 12)

---

## ✅ FONCTIONNALITÉS LIVRÉES

- Auth email/password + Google OAuth + reset password
- Dashboard (stats temps réel, graphique 7 jours)
- Ventes (CRUD, pagination, filtres, export PDF + Excel — gérant uniquement)
- Stock (niveaux, livraisons — gérant uniquement)
- Alertes (STOCK_FAIBLE, FRAUDE, FRAUDE_CITERNE, ARRET_SUSPECT)
- Employés (CRUD owner uniquement, lecture gérant, soft delete)
- Multi-stations, switch station
- Paramètres (infos station, prix, seuils — sans citernes, réservé au logisticien)
- Page 404 personnalisée (`/features/auth/NotFound.jsx`)
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

---

## 🔴 PROBLÈMES CONNUS

1. **Crons + Socket.IO peu fiables** — Render tier gratuit s'endort après 15 min. Cron rapports mensuels et vérif stock horaire non fiables → nécessite plan payant (~7$/mois).
2. **EMAIL_PASS et GOOGLE_CLIENT_SECRET** à régénérer sur Render (JWT_SECRET déjà régénéré).

---

## ⏳ FONCTIONNALITÉS À CODER (priorité)

### En cours
- **Système d'abonnements** (3 plans : STARTER 50$/mois, PRO 150$/mois, ENTERPRISE 300$/mois)
  - Table `subscriptions` (owner_id, plan, statut, expires_at, payment_method, payment_phone)
  - Middleware `checkPlan` vérifiant le plan avant les features sensibles
  - Page `/abonnements` : plan actuel, comparatif, modal paiement simulé (Orange Money, MTN, PayCard, Kulu)

### Restant
- Onboarding première connexion owner
- Refresh tokens (éviter déconnexion après 7j)
- Backup auto quotidien DB Neon
- Dashboard superadmin (tous les clients + abonnements)
- Migration Railway (remplacer Render, ~5$/mois)
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
- `multer` : utiliser `memoryStorage()` + upload manuel Cloudinary (pas `multer-storage-cloudinary`)
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
