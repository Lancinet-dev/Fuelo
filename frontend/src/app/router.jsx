// ================================================
// FUELO V2 — Router
// Fichier : frontend/src/app/router.jsx
// ================================================

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../ui/AppLayout'
import PageLoader from '../ui/PageLoader'

const normalizeRole = (value = '') => {
  const role = String(value).trim().toLowerCase()
  return role === 'manager' ? 'gerant' : role
}

// ── Lazy loading pages ────────────────────────────────
const Landing        = lazy(() => import('../features/auth/Landing'))
const Login          = lazy(() => import('../features/auth/Login'))
const Register       = lazy(() => import('../features/auth/Register'))
const Dashboard      = lazy(() => import('../features/dashboard/Dashboard'))
const Stock          = lazy(() => import('../features/stock/Stock'))
const Ventes         = lazy(() => import('../features/ventes/Ventes'))
const Alertes        = lazy(() => import('../features/alertes/Alertes'))
const ServicesPage   = lazy(() => import('../features/services/ServicesPage'))
const TrajetsPage    = lazy(() => import('../features/trajets/TrajetsPage'))
const ChauffeurPage    = lazy(() => import('../features/trajets/ChauffeurPage'))
const LogistiquePage   = lazy(() => import('../features/logistique/LogistiquePage'))
const Employes       = lazy(() => import('../features/employes/Employes'))
const PompistePage   = lazy(() => import('../features/pompiste/PompistePage'))
const Stations       = lazy(() => import('../features/stations/Stations'))
const Parametres     = lazy(() => import('../features/parametres/Parametres'))
const ForgotPassword = lazy(() => import('../features/auth/ForgotPassword'))
const ResetPassword  = lazy(() => import('../features/auth/ResetPassword'))
const GoogleSuccess  = lazy(() => import('../features/auth/GoogleSuccess'))
const Profile        = lazy(() => import('../features/profile/Profile'))
const NotFound           = lazy(() => import('../features/auth/NotFound'))
const AbonnementsPage        = lazy(() => import('../features/abonnements/AbonnementsPage'))
const SuperadminDashboard    = lazy(() => import('../features/dashboard/SuperadminDashboard'))
const PerformancesPage       = lazy(() => import('../features/performances/PerformancesPage'))
const AntiFraudePage         = lazy(() => import('../features/anti-fraude/AntiFraudePage'))

// ── Garde routes protégées ────────────────────────────
function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth()
  const userRole = normalizeRole(role)
  const normalizedAllowedRoles = allowedRoles?.map(normalizeRole)

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) {
    if (userRole === 'pompiste')     return <Navigate to="/pompiste"    replace />
    if (userRole === 'chauffeur')    return <Navigate to="/chauffeur"   replace />
    if (userRole === 'logisticien')  return <Navigate to="/logistique"  replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ── Redirige si déjà connecté ─────────────────────────
// Si connecté → dashboard/pompiste
// Si pas connecté → affiche la page (landing, login, register)
function PublicRoute({ children }) {
  const { isAuthenticated, role } = useAuth()
  const userRole = normalizeRole(role)

  if (!isAuthenticated) return children

  if (userRole === 'pompiste')     return <Navigate to="/pompiste"   replace />
  if (userRole === 'chauffeur')    return <Navigate to="/chauffeur"  replace />
  if (userRole === 'logisticien')  return <Navigate to="/logistique" replace />
  if (userRole === 'superadmin')   return <Navigate to="/admin"      replace />
  return <Navigate to="/dashboard" replace />
}

// ── Router principal ──────────────────────────────────
export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Landing — redirige vers dashboard si déjà connecté */}
          <Route path="/" element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          } />

          {/* Login + Register — redirige si déjà connecté */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Pages publiques sans redirection */}
          <Route path="/forgot-password"     element={<ForgotPassword />} />
          <Route path="/reset-password"      element={<ResetPassword />} />
          <Route path="/auth/google/success" element={<GoogleSuccess />} />

          {/* Page pompiste — layout différent */}
          <Route path="/pompiste" element={
            <PrivateRoute allowedRoles={['pompiste']}>
              <PompistePage />
            </PrivateRoute>
          } />

          {/* Page chauffeur — layout différent */}
          <Route path="/chauffeur" element={
            <PrivateRoute allowedRoles={['chauffeur']}>
              <ChauffeurPage />
            </PrivateRoute>
          } />

          {/* Page logisticien — layout différent */}
          <Route path="/logistique" element={
            <PrivateRoute allowedRoles={['logisticien']}>
              <LogistiquePage />
            </PrivateRoute>
          } />

          {/* Pages gérant + owner — avec sidebar */}
          <Route element={
            <PrivateRoute allowedRoles={['gerant', 'owner', 'superadmin']}>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/stock"      element={<Stock />} />
            <Route path="/ventes"     element={<Ventes />} />
            <Route path="/alertes"    element={<Alertes />} />
            <Route path="/services"   element={<ServicesPage />} />
            <Route path="/trajets"    element={<TrajetsPage />} />
            <Route path="/employes"   element={<Employes />} />
            <Route path="/stations"   element={<Stations />} />
            <Route path="/parametres"  element={<Parametres />} />
            <Route path="/profile"     element={<Profile />} />
            <Route path="/abonnements"   element={<AbonnementsPage />} />
            <Route path="/performances" element={<PerformancesPage />} />
            <Route path="/anti-fraude"  element={<AntiFraudePage />} />
            <Route path="/admin"        element={
              <PrivateRoute allowedRoles={['superadmin']}>
                <SuperadminDashboard />
              </PrivateRoute>
            } />
          </Route>

          {/* Route inconnue — page 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}