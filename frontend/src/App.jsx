import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Stock from './pages/Stock'
import Ventes from './pages/Ventes'
import Alertes from './pages/Alertes'

// Protection route — redirige si pas connecté
const Private = ({ children }) => {
  const token = localStorage.getItem('fuelo_token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
        <Route path="/stock" element={<Private><Stock /></Private>} />
        <Route path="/ventes" element={<Private><Ventes /></Private>} />
        <Route path="/alertes" element={<Private><Alertes /></Private>} />
      </Routes>
    </BrowserRouter>
  )
}