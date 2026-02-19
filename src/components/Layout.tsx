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
  User as UserIcon,
  Bell,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { authService, pharmacieService, employesService, commandeService, notificationsService, type User, type Pharmacie, type EmployePharmacie } from '../services/api'
import logo from "../assets/e_sora.png"
const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['pharmacien', 'employe_pharmacie'],
    permissions: [] // Accessible à tous
  },
  {
    title: 'Gestion des Stocks',
    icon: Package,
    path: '/stocks',
    roles: ['pharmacien', 'employe_pharmacie'],
    permissions: ['peut_gerer_stock'] // Employés avec permission peut_gerer_stock
  },
  {
    title: 'Ventes',
    icon: ShoppingCart,
    roles: ['pharmacien', 'employe_pharmacie'],
    permissions: [],
    subItems: [
      {
        title: 'Ventes Manuelles',
        icon: ShoppingCart,
        path: '/ventes',
        roles: ['pharmacien', 'employe_pharmacie'],
        permissions: ['peut_vendre']
      },
      {
        title: 'Commandes',
        icon: Package,
        path: '/commandes',
        roles: ['pharmacien', 'employe_pharmacie'],
        permissions: ['peut_voir_commandes'],
        badge: true
      }
    ]
  },
  {
    title: 'Revenus',
    icon: TrendingUp,
    path: '/revenus',
    roles: ['pharmacien'], // Seuls les pharmaciens
    permissions: []
  },
  {
    title: 'Factures Fournisseurs',
    icon: FileText,
    path: '/factures',
    roles: ['pharmacien', 'employe_pharmacie'],
    permissions: ['peut_enregistrer_facture'] // Employés avec permission
  },
  {
    title: 'Employés',
    icon: UserIcon,
    path: '/employes',
    roles: ['pharmacien'], // Seuls les pharmaciens
    permissions: []
  },
  
   {
    title: 'Notifications',
    icon: Bell,
    path: '/notifications',
    roles: ['pharmacien', 'employe_pharmacie'],
    permissions: [], // Accessible à tous
    badge: true // Indique qu'il faut afficher un badge
  },
  {
    title: 'Paramètres',
    icon: Settings,
    path: '/parametres',
    roles: ['pharmacien', 'employe_pharmacie'],
    permissions: [] // Accessible à tous
  }
]

export const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ventesMenuOpen, setVentesMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [employeProfile, setEmployeProfile] = useState<EmployePharmacie | null>(null)
  const [commandesCount, setCommandesCount] = useState(0)
  const [notificationsCount, setNotificationsCount] = useState(0)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    if (!['pharmacien', 'employe_pharmacie'].includes(currentUser.role)) {
      authService.logout()
      navigate('/login')
      return
    }

    setUser(currentUser)
    loadPharmacie()
    loadCounts()
    
    // Charger le profil employé si c'est un employé
    if (currentUser.role === 'employe_pharmacie') {
      loadEmployeProfile()
    }
  }, [navigate])

  const loadPharmacie = async () => {
    try {
      const pharmacieData = await pharmacieService.getMyPharmacie()
      setPharmacie(pharmacieData)
    } catch (error) {
      console.error('Erreur lors du chargement de la pharmacie:', error)
    }
  }

  const loadEmployeProfile = async () => {
    try {
      const employeData = await employesService.getMonProfil()
      setEmployeProfile(employeData)
    } catch (error) {
      console.error('Erreur lors du chargement du profil employé:', error)
    }
  }

  const loadCounts = async () => {
    try {
      // Charger le nombre de commandes en attente
      const commandesData = await commandeService.getAll()
      const commandesArray = Array.isArray(commandesData) ? commandesData : commandesData.results || []
      const commandesEnAttente = commandesArray.filter((cmd: any) => 
        ['en_attente', 'confirmee', 'preparee', 'prete'].includes(cmd.statut)
      )
      setCommandesCount(commandesEnAttente.length)
      
      // Charger le nombre de notifications non lues
      try {
        const notificationsCount = await notificationsService.getUnreadCount()
        setNotificationsCount(notificationsCount.count || 0)
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error)
        setNotificationsCount(0)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des compteurs:', error)
    }
  }

  // Recharger les compteurs périodiquement
  useEffect(() => {
    if (user) {
      const interval = setInterval(loadCounts, 30000) // Toutes les 30 secondes
      return () => clearInterval(interval)
    }
  }, [user])

  const hasPermission = (item: typeof menuItems[0]) => {
    if (!user) return false
    
    // Vérifier le rôle
    if (!item.roles.includes(user.role)) return false
    
    // Si c'est un pharmacien, il a accès à tout
    if (user.role === 'pharmacien') return true
    
    // Si c'est un employé et qu'il n'y a pas de permissions requises, accès autorisé
    if (item.permissions.length === 0) return true
    
    // Vérifier les permissions de l'employé
    if (user.role === 'employe_pharmacie' && employeProfile) {
      return item.permissions.some(permission => {
        switch (permission) {
          case 'peut_vendre':
            return employeProfile.peut_vendre
          case 'peut_gerer_stock':
            return employeProfile.peut_gerer_stock
          case 'peut_voir_commandes':
            return employeProfile.peut_voir_commandes
          case 'peut_traiter_commandes':
            return employeProfile.peut_traiter_commandes
          case 'peut_annuler_vente':
            return employeProfile.peut_annuler_vente
          case 'peut_enregistrer_facture':
            return employeProfile.peut_enregistrer_facture
          default:
            return false
        }
      })
    }
    
    return false
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
            <div className="p-2 rounded-lg md:w-[180px] w-[150px]">
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
            {menuItems
              .filter(item => hasPermission(item))
              .map((item) => {
                const Icon = item.icon
                const isActive = item.path ? isActivePath(item.path) : false
                const hasSubItems = item.subItems && item.subItems.length > 0
                
                // Si l'item a des sous-items
                if (hasSubItems) {
                  const isVentesMenuOpen = item.title === 'Ventes' && ventesMenuOpen
                  const hasActiveSubItem = item.subItems?.some(subItem => isActivePath(subItem.path))
                  
                  return (
                    <li key={item.title}>
                      {/* Menu parent */}
                      <button
                        onClick={() => {
                          if (item.title === 'Ventes') {
                            setVentesMenuOpen(!ventesMenuOpen)
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          hasActiveSubItem
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 mr-3" />
                          {item.title}
                        </div>
                        {isVentesMenuOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      {/* Sous-menu */}
                      {isVentesMenuOpen && (
                        <ul className="ml-8 mt-1 space-y-1">
                          {item.subItems
                            ?.filter(subItem => hasPermission(subItem))
                            .map((subItem) => {
                              const isSubActive = isActivePath(subItem.path)
                              
                              return (
                                <li key={subItem.path}>
                                  <button
                                    onClick={() => {
                                      if (subItem.path) {
                                        navigate(subItem.path)
                                      }
                                      setSidebarOpen(false)
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                                      isSubActive
                                        ? 'bg-green-50 text-green-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>{subItem.title}</span>
                                    {subItem.badge && subItem.path === '/commandes' && commandesCount > 0 && (
                                      <Badge variant="destructive" className="ml-2 px-2 py-1 text-xs">
                                        {commandesCount}
                                      </Badge>
                                    )}
                                  </button>
                                </li>
                              )
                            })}
                        </ul>
                      )}
                    </li>
                  )
                }
                
                // Item normal sans sous-menu
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 mr-3" />
                        {item.title}
                      </div>
                      {item.badge && (
                        <div className="flex items-center">
                          {item.path === '/notifications' && notificationsCount > 0 && (
                            <Badge variant="destructive" className="ml-2 px-2 py-1 text-xs">
                              {notificationsCount}
                            </Badge>
                          )}
                        </div>
                      )}
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
              {user.role === 'employe_pharmacie' && employeProfile && (
                <p className="text-xs text-blue-600 truncate">
                  {employeProfile.poste}
                </p>
              )}
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
            
            {/* Notifications et badges dans le top bar */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-400 hover:text-gray-500"
              >
                <Bell className="h-6 w-6" />
                {notificationsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
                  >
                    {notificationsCount}
                  </Badge>
                )}
              </button>
              
              {/* Badge commandes si on n'est pas sur la page commandes */}
              {location.pathname !== '/commandes' && commandesCount > 0 && (
                <button
                  onClick={() => navigate('/commandes')}
                  className="relative p-2 text-gray-400 hover:text-gray-500"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
                  >
                    {commandesCount}
                  </Badge>
                </button>
              )}
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