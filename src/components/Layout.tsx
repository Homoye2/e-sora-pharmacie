import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  LogOut,
  Menu,
  X,
  Pill,
  User as UserIcon
} from 'lucide-react'
import { Button } from './ui/button'
import { authService, pharmacieService, type User, type Pharmacie } from '../services/api'
import logo from "../assets/e_sora.png"
const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    title: 'Gestion des Stocks',
    icon: Package,
    path: '/stocks'
  },
  {
    title: 'Commandes',
    icon: ShoppingCart,
    path: '/commandes'
  },
  {
    title: 'Revenus',
    icon: TrendingUp,
    path: '/revenus'
  },
  {
    title: 'Paramètres',
    icon: Settings,
    path: '/parametres'
  }
]

export const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    if (currentUser.role !== 'pharmacien') {
      authService.logout()
      navigate('/login')
      return
    }

    setUser(currentUser)
    loadPharmacie()
  }, [navigate])

  const loadPharmacie = async () => {
    try {
      const pharmacieData = await pharmacieService.getMyPharmacie()
      setPharmacie(pharmacieData)
    } catch (error) {
      console.error('Erreur lors du chargement de la pharmacie:', error)
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg md:w-[180px] w-[80px]">
             <img src={logo} alt="logo-e-sora" />
            </div>
           
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Pharmacie Info */}
        {pharmacie && (
          <div className="px-6 py-4 bg-green-50 border-b flex-shrink-0">
            <h2 className="font-medium text-green-900 truncate">{pharmacie.nom}</h2>
            <p className="text-sm text-green-700 truncate">{pharmacie.ville}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.path)
              
              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.title}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-gray-100 p-2 rounded-full">
              <UserIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.path === location.pathname)?.title || 'Dashboard'}
              </h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full">
            <div className="max-h-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}