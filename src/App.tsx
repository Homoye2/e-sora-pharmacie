import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Stocks } from './pages/Stocks'
import { Ventes } from './pages/Ventes'
import { Commandes } from './pages/Commandes'
import { Employes } from './pages/Employes'
import { Revenus } from './pages/Revenus'
import { Parametres } from './pages/Parametres'
import { Notifications } from './pages/Notifications'
import { authService, employesService } from './services/api'
import { useEffect, useState } from 'react'
import './index.css'

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated()
  const user = authService.getCurrentUser()
  
  if (!isAuthenticated || !user || !['pharmacien', 'employe_pharmacie'].includes(user.role)) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Composant pour protéger les routes avec permissions
const PermissionProtectedRoute = ({ 
  children, 
  requiredRole, 
  requiredPermissions = [] 
}: { 
  children: React.ReactNode
  requiredRole?: string[]
  requiredPermissions?: string[]
}) => {
  const user = authService.getCurrentUser()
  const [employeProfile, setEmployeProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadEmployeProfile = async () => {
      if (user?.role === 'employe_pharmacie') {
        try {
          const profile = await employesService.getMonProfil()
          setEmployeProfile(profile)
        } catch (error) {
          console.error('Erreur lors du chargement du profil employé:', error)
        }
      }
      setLoading(false)
    }
    
    loadEmployeProfile()
  }, [user])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Vérifier le rôle requis
  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  // Si c'est un pharmacien, accès autorisé
  if (user.role === 'pharmacien') {
    return <>{children}</>
  }
  
  // Si c'est un employé, vérifier les permissions
  if (user.role === 'employe_pharmacie' && employeProfile) {
    if (requiredPermissions.length === 0) {
      return <>{children}</>
    }
    
    const hasPermission = requiredPermissions.some(permission => {
      switch (permission) {
        case 'peut_vendre':
          return employeProfile.peut_vendre
        case 'peut_gerer_stock':
          return employeProfile.peut_gerer_stock
        case 'peut_voir_commandes':
          return employeProfile.peut_voir_commandes
        case 'peut_traiter_commandes':
          return employeProfile.peut_traiter_commandes
        default:
          return false
      }
    })
    
    if (hasPermission) {
      return <>{children}</>
    }
  }
  
  // Accès refusé
  return <Navigate to="/dashboard" replace />
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
          <Route path="notifications" element={<Notifications />} />
          <Route path="stocks" element={
            <PermissionProtectedRoute requiredPermissions={['peut_gerer_stock']}>
              <Stocks />
            </PermissionProtectedRoute>
          } />
          <Route path="ventes" element={
            <PermissionProtectedRoute requiredPermissions={['peut_vendre']}>
              <Ventes />
            </PermissionProtectedRoute>
          } />
          <Route path="commandes" element={
            <PermissionProtectedRoute requiredPermissions={['peut_voir_commandes']}>
              <Commandes />
            </PermissionProtectedRoute>
          } />
          <Route path="employes" element={
            <PermissionProtectedRoute requiredRole={['pharmacien']}>
              <Employes />
            </PermissionProtectedRoute>
          } />
          <Route path="revenus" element={
            <PermissionProtectedRoute requiredRole={['pharmacien']}>
              <Revenus />
            </PermissionProtectedRoute>
          } />
          <Route path="parametres" element={<Parametres />} />
        </Route>
        
        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
