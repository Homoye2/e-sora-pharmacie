import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Bell, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Trash2,
  Mail,
  Calendar,
  Package,
  FileText,
  ShoppingCart,
  AlertTriangle,
  Info,
  X,
  Check
} from 'lucide-react'
import { 
  notificationsService,
  commandeService,
  type Notification
} from '../services/api'
import { formatDateTime } from '../lib/utils'

export const Notifications = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'commandes'>('all')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsService.getAll()
      const notificationsData = Array.isArray(response) ? response : response.results || []
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    const iconMap = {
      'rendez_vous_nouveau': <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />,
      'rendez_vous_confirme': <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />,
      'rendez_vous_refuse': <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />,
      'rendez_vous_rappel': <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />,
      'commande_confirmee': <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />,
      'commande_prete': <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />,
      'consultation_rapport': <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />,
      'stock_alerte': <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />,
      'autre': <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
    }
    
    return iconMap[type as keyof typeof iconMap] || iconMap.autre
  }

  const getTypeBadge = (type: string) => {
    const config = notificationsService.getTypeConfig(type)
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      gray: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={`${colorMap[config.color as keyof typeof colorMap]} text-xs`}>
        {config.label}
      </Badge>
    )
  }

  const markAsRead = async (id: number) => {
    try {
      setActionLoading(id)
      await notificationsService.markAsRead(id)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, lu: true, date_lecture: new Date().toISOString() } : notif
        )
      )
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const markAsUnread = async (id: number) => {
    try {
      setActionLoading(id)
      // Note: Il faudrait ajouter cette méthode au backend
      // Pour l'instant, on simule en mettant à jour localement
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, lu: false, date_lecture: undefined } : notif
        )
      )
    } catch (error) {
      console.error('Erreur lors du marquage comme non lu:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteNotification = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) return
    
    try {
      setActionLoading(id)
      await notificationsService.delete(id)
      setNotifications(prev => prev.filter(notif => notif.id !== id))
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      setLoading(true)
      await notificationsService.markAllAsRead()
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, lu: true, date_lecture: new Date().toISOString() }))
      )
    } catch (error) {
      console.error('Erreur lors du marquage de toutes comme lues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewCommande = (commandeId: number) => {
    navigate('/commandes')
    // TODO: Ouvrir directement le modal de la commande
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.lu
    if (filter === 'commandes') return notif.type_notification.includes('commande')
    return true
  })

  const unreadCount = notifications.filter(n => !n.lu).length
  const commandesCount = notifications.filter(n => n.type_notification.includes('commande')).length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gérez vos messages et alertes
            {unreadCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                ({unreadCount} non lue{unreadCount > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        
        {/* Actions rapides */}
        {unreadCount > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={loading}
              className="text-xs sm:text-sm"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Tout marquer lu
            </Button>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-fit">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className="rounded-md text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-1 sm:flex-none"
        >
          Toutes ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          onClick={() => setFilter('unread')}
          className="rounded-md text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-1 sm:flex-none"
        >
          Non lues ({unreadCount})
        </Button>
        <Button
          variant={filter === 'commandes' ? 'default' : 'ghost'}
          onClick={() => setFilter('commandes')}
          className="rounded-md text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-1 sm:flex-none"
        >
          Commandes ({commandesCount})
        </Button>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px] sm:min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 sm:py-12">
              <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">
                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all hover:shadow-md ${
                !notification.lu ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
            >
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    {getTypeIcon(notification.type_notification)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-sm sm:text-base truncate">
                          {notification.titre}
                        </CardTitle>
                        {!notification.lu && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formatDateTime(notification.created_at)}
                        </div>
                        {notification.user_nom && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate">De: {notification.user_nom}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getTypeBadge(notification.type_notification)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 whitespace-pre-wrap break-words">
                  {notification.message}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {notification.commande && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewCommande(notification.commande!)}
                        className="text-xs sm:text-sm"
                      >
                        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Voir commande
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 justify-end">
                    {notification.lu ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsUnread(notification.id)}
                        disabled={actionLoading === notification.id}
                        className="text-xs sm:text-sm"
                      >
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Marquer non lu</span>
                        <span className="sm:hidden">Non lu</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        disabled={actionLoading === notification.id}
                        className="text-xs sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Marquer lu</span>
                        <span className="sm:hidden">Lu</span>
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      disabled={actionLoading === notification.id}
                      className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}