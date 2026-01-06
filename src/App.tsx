import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Stocks } from './pages/Stocks'
import { Commandes } from './pages/Commandes'
import { Revenus } from './pages/Revenus'
import { Parametres } from './pages/Parametres'
import { authService } from './services/api'
import './index.css'

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated()
  const user = authService.getCurrentUser()
  
  if (!isAuthenticated || !user || user.role !== 'pharmacien') {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<Login />} />
        
        {/* Routes protégées */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stocks" element={<Stocks />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="revenus" element={<Revenus />} />
          <Route path="parametres" element={<Parametres />} />
        </Route>
        
        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
