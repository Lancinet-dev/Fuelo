// ================================================
// FUELO — Page Loader (Suspense fallback)
// Fichier : frontend/src/ui/PageLoader.jsx
// Léger, fond transparent — affiché lors des transitions de route
// (le splash plein écran AppLoader ne doit apparaître qu'au démarrage)
// ================================================

import LoadingDots from './LoadingDots'

export default function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent',
    }}>
      <LoadingDots color="#2563EB" size={9} />
    </div>
  )
}
