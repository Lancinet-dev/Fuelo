// ================================================
// FUELO V2 — Router
// Fichier : frontend/src/app/router.jsx
// ================================================

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../ui/AppLayout'
import { SkeletonDashboard, SkeletonStyle } from '../ui/Skeleton'

// ── Lazy loading pages ────────────────────────────────
const Landing      = lazy(() => import('../features/auth/Landing'))
const Login        = lazy(() => import('../features/auth/Login'))
const Register     = lazy(() => import('../features/auth/Register'))
const Dashboard    = lazy(() => import('../features/dashboard/Dashboard'))
const Stock        = lazy(() => import('../features/stock/Stock'))
const Ventes       = lazy(() => import('../features/ventes/Ventes'))
const Alertes      = lazy(() => import('../features/alertes/Alertes'))
const Employes     = lazy(() => import('../features/employes/Employes'))
const PompistePage = lazy(() => import('../features/pompiste/PompistePage'))
const Stations   = lazy(() => import('../features/stations/Stations'))
const Parametres = lazy(() => import('../features/parametres/Parametres'))
const ForgotPassword = lazy(() => import('../features/auth/ForgotPassword'))
const ResetPassword  = lazy(() => import('../features/auth/ResetPassword'))
const GoogleSuccess = lazy(() => import('../features/auth/GoogleSuccess'))

// ── Fallback loading ──────────────────────────────────
const PageLoader = () => (
  <>
    <SkeletonStyle />
    <SkeletonDashboard />
  </>
)

// ── Garde routes protégées ────────────────────────────
function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Rediriger pompiste vers sa page
    if (role === 'pompiste') return <Navigate to="/pompiste" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ── Redirige si déjà connecté ─────────────────────────
function PublicRoute({ children }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) return children

  // Rediriger selon le rôle
  if (role === 'pompiste') return <Navigate to="/pompiste" replace />
  return <Navigate to="/dashboard" replace />
}

// ── Router principal ──────────────────────────────────
export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Pages publiques */}
          <Route path="/" element={<Landing />} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
         <Route path="/forgot-password" element={<ForgotPassword />} />
         <Route path="/reset-password"  element={<ResetPassword />} />
         <Route path="/auth/google/success" element={<GoogleSuccess />} />
          {/* Page pompiste — layout différent */}
          <Route path="/pompiste" element={
            <PrivateRoute allowedRoles={['pompiste']}>
              <PompistePage />
            </PrivateRoute>
          } />

          {/* Pages manager + owner — avec sidebar */}
          <Route element={
            <PrivateRoute allowedRoles={['manager', 'owner', 'superadmin']}>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stock"     element={<Stock />} />
            <Route path="/ventes"    element={<Ventes />} />
            <Route path="/alertes"   element={<Alertes />} />
            <Route path="/employes"  element={<Employes />} />
            <Route path="/stations"   element={<Stations />} />
            <Route path="/parametres" element={<Parametres />} />
          </Route>

          {/* Route inconnue */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}