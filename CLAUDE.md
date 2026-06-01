# CLAUDE.md — Contexte du projet Fuelo

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il contient tout le contexte du projet pour ne jamais avoir à le réexpliquer.

---

## 🎯 C'EST QUOI FUELO

SaaS de gestion de stations-service pour l'Afrique de l'Ouest (Guinée d'abord).
Permet aux propriétaires/gérants de gérer stock, ventes, alertes, employés et rapports
depuis leur téléphone, en temps réel.

**Statut : EN PRODUCTION.**

- Frontend (Vercel) : https://fuelo-kappa.vercel.app
- Backend (Render)  : https://fuelo.onrender.com
- GitHub : repo `Fuelo` (compte Lancinet-dev), branche `main`, auto-deploy à chaque push

---

## 🏗️ ARCHITECTURE & STACK

**Backend** — Node.js + Express, architecture MVC + service layer
- `routes/` → définition des endpoints
- `controllers/` → reçoivent req/res, appellent les services
- `services/` → logique métier (ex: venteService.js avec transactions ACID)
- `middleware/` → auth (JWT), rateLimit, checkRole, errorHandler, upload (multer+Cloudinary)
- `config/` → database.js (pool pg), passport.js (Google OAuth), cloudinary.js
- `utils/` → logger (Winston), checkEnv, socketNotify (ventes/alertes/GPS), cronJobs
- Base de données : PostgreSQL sur **Neon** (migré le 2026-06-01, ex-Render)
- Temps réel : Socket.IO (rooms par station : `station_${id}`) — events : `nouvelle_vente`, `alerte_stock`, `gps_update`
- Sécurité : JWT, bcrypt, helmet, CORS, rate limiting, validation Zod, RBAC
- Stockage photos : Cloudinary (anti-fraude pompistes, dossier `fuelo/services/`)
- Monitoring : Sentry

**Frontend** — React + Vite + React Query
- `features/` → auth, dashboard, ventes, stock, alertes, employes, parametres, profile, stations, **services**, **trajets**, pompiste
- `ui/` → Sidebar, AppLayout, StatCard, SplashScreen, etc.
- `hooks/` → useAuth, useAlertes, useNotifications, useSocket, useService, useServices, useTrajet, useTrajets
- `context/` → AuthContext, ThemeContext (dark/light)
- `components/` → FueloLogo
- `config/` → theme.js
- `services/` → api.js (axios)
- Carte GPS : Leaflet + OpenStreetMap (gratuit, pas de clé API)

---

## 🎨 DESIGN

- Couleur principale : bleu `#2563EB`
- Accent : orange `#F59E0B`
- Logo : goutte carburant bleue + éclair orange sur carré bleu nuit `#0D1B2A`
- Wordmark : "fuel" (couleur thème) + "o" (orange)
- Dark mode + Light mode via ThemeContext
- Responsive mobile complet
- Police : DM Sans

---

## 👥 RÔLES UTILISATEURS

- `owner` (propriétaire) → accès complet, voit tout
- `gerant` (alias `manager`, normalisé en `gerant`) → gère sa station
- `pompiste` → interface dédiée, enregistre les ventes
- `chauffeur` → interface dédiée `/chauffeur`, gère ses trajets GPS
- `superadmin` → (prévu, pas encore implémenté)

Comptes test :
- Owner : main@gmail.com, sadio@gmail.com
- Gérant : thiernon@gmail.com
- Pompiste : saliou@gmail.com (station 12)

---

## ✅ FONCTIONNALITÉS DÉJÀ FAITES

- Auth email/password + Google OAuth + reset password
- Dashboard (stats temps réel, graphique 7 jours, ventes récentes)
- Ventes (CRUD, pagination, filtres, export PDF + Excel)
- Stock (niveaux, livraisons, seuils)
- Alertes (liste, marquer lu, tout marquer lu) — types : STOCK_FAIBLE, FRAUDE, FRAUDE_CITERNE, ARRET_SUSPECT
- Employés (CRUD, soft delete, rôles dont `chauffeur`)
- Multi-stations (switch station)
- Paramètres (infos station, prix carburants, seuils stock + seuil fraude citerne, gestion citernes)
- Profil
- Interface pompiste dédiée (`/pompiste`)
- Notifications temps réel Socket.IO (ventes, alertes stock, GPS)
- PWA installable
- **Anti-fraude pompistes** — photos compteur début/fin (Cloudinary), calcul écart théorique/réel, alerte si > 10L
  - Backend : `services` table, `POST /api/services`, `POST /api/services/:id/terminer`
  - Frontend : `/services` (owner/gérant) avec carte détail + photos, modal bottom-sheet pompiste
- **GPS citernes** — suivi temps réel trajet chauffeur, détection arrêt suspect, comparaison quantités
  - Backend : tables `citernes`, `trajets`, `gps_points` ; Haversine stop detection (300m/10min) ; alerte fraude citerne si écart > seuil
  - Frontend : `/chauffeur` (interface mobile GPS watchPosition), `/trajets` (carte Leaflet + OpenStreetMap, historique)

---

## 🔴 PROBLÈMES CRITIQUES À RÉGLER (PRIORITÉ ABSOLUE)

1. ~~**DB Render expire le 22 juin 2026**~~ ✅ **RÉGLÉ le 2026-06-01** — Migré vers Neon
   (neon.tech, projet `fuelo-prod`, région EU Central). DATABASE_URL mis à jour sur Render.

2. **Crons + Socket.IO cassés sur tier gratuit** — le backend Render gratuit s'endort après
   15 min d'inactivité. Donc le cron des rapports mensuels et la vérif stock horaire ne
   tournent pas de façon fiable. → nécessite plan payant (~7$/mois) pour fonctionner vraiment.

3. ~~**Secrets à régénérer**~~ ✅ **RÉGLÉ le 2026-06-01** — JWT_SECRET régénéré (64 bytes hex,
   mis à jour sur Render). Reste à faire : EMAIL_PASS et GOOGLE_CLIENT_SECRET.

---

## ⏳ FONCTIONNALITÉS À CODER (les grosses, demandées par le client)

### ✅ Anti-fraude pompistes → LIVRÉ (2026-06-01)
### ✅ GPS citernes → LIVRÉ (2026-06-01)

## 📋 AUTRES TÂCHES (moins prioritaires)

- Refresh tokens (éviter déconnexion après 7j) — confort, pas urgent
- Page 404 personnalisée Fuelo
- Onboarding première connexion
- Dashboard superadmin (voir tous les clients)
- Paiements Mobile Money (Orange Money, MTN)
- Domaine personnalisé (fuelo.africa)
- SEO Google
- Tests automatisés
- Backup auto quotidien

---

## 📝 CONVENTIONS DE CODE

- Français pour les commentaires, messages utilisateur, et noms métier (vente, stock, alerte)
- Formatage nombres : NE PAS utiliser toLocaleString dans les PDF/exports (cause des bugs `&&&`).
  Utiliser une fonction numFmt manuelle : `n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')`
- Soft delete : utiliser `deleted_at IS NULL` dans les requêtes
- Routes spécifiques AVANT routes paramétrées (ex: `/toutes/lire` avant `/:id/lire`)
- Styles inline React (pas de CSS séparé), avec objet `theme` et `palette` du ThemeContext
- Logo : `<FueloLogo size={36} forceTextColor="#fff" />` sur fond sombre

---

## 🔧 COMMANDES UTILES

```bash
# Backend (local)
cd backend
npm run dev          # démarre nodemon

# Frontend (local)
cd frontend
npm run dev          # démarre Vite (localhost:5173)

# Migration DB (créer les tables)
cd backend
node migrate.js      # avec DATABASE_URL en variable d'env

# Déploiement = git push (auto-deploy Render + Vercel)
git add .
git commit -m "..."
git push
```

---

## ⚠️ RAPPELS IMPORTANTS

- Toujours faire un commit git AVANT les grosses modifications
- En local : variables DB séparées (DB_HOST, DB_PORT...). En prod : DATABASE_URL.
- database.js et checkEnv.js supportent les deux modes.
- Tester en mode "Ask" au début avant de donner trop d'autonomie.