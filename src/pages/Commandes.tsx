import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { CommandeDetails } from '../components/CommandeDetails'
import { CommandeActionModal } from '../components/CommandeActionModal'
import { useToast } from '../components/ui/toast'
import { 
  ShoppingCart, 
  Search, 
  Clock, 
  CheckCircle,
  Package,
  User,
  Phone,
  Calendar,
  Eye,
  FileText,
  MessageSquare,
  XCircle
} from 'lucide-react'
import { 
  commandeService, 
  pharmacieService,
  type CommandePharmacie,
  type Pharmacie
} from '../services/api'
import { formatCurrency, formatDateTime } from '../lib/utils'

export const Commandes = () => {
  const { showToast, ToastContainer } = useToast()
  const [commandes, setCommandes] = useState<CommandePharmacie[]>([])
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [selectedCommande, setSelectedCommande] = useState<CommandePharmacie | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // États pour le modal d'action
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState<'confirmer' | 'refuser' | 'preparer' | 'prete' | 'recuperee' | null>(null)
  const [commandeForAction, setCommandeForAction] = useState<CommandePharmacie | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger la pharmacie
      const pharmacieData = await pharmacieService.getMyPharmacie()
      setPharmacie(pharmacieData)
      
      if (pharmacieData) {
        // Charger les commandes
        const commandesResponse = await commandeService.getAll(pharmacieData.id)
        const commandesData = Array.isArray(commandesResponse) ? commandesResponse : commandesResponse.results || []
        setCommandes(commandesData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatut = async (commandeId: number, newStatut: string) => {
    try {
      await commandeService.updateStatut(commandeId, newStatut)
      // Recharger les données
      loadData()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    }
  }

  const handleActionWithMessage = async (commandeId: number, action: 'confirmer' | 'refuser' | 'preparer' | 'prete' | 'recuperee', message?: string) => {
    try {
      // Mapper l'action vers le statut correspondant
      const statutMap = {
        'confirmer': 'confirmee',
        'refuser': 'annulee',
        'preparer': 'preparee',
        'prete': 'prete',
        'recuperee': 'recuperee'
      }
      
      const newStatut = statutMap[action]
      
      // Utiliser la nouvelle méthode avec notification
      await commandeService.updateStatutWithNotification(commandeId, newStatut, message)
      
      showToast(
        action === 'refuser' 
          ? 'Commande refusée et patient notifié' 
          : 'Commande mise à jour et patient notifié', 
        'success'
      )
      
      // Recharger les données
      loadData()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showToast('Erreur lors de la mise à jour de la commande', 'error')
    }
  }

  const handleOpenActionModal = (commande: CommandePharmacie, action: 'confirmer' | 'refuser' | 'preparer' | 'prete' | 'recuperee') => {
    setCommandeForAction(commande)
    setCurrentAction(action)
    setActionModalOpen(true)
  }

  const handleViewDetails = (commande: CommandePharmacie) => {
    setSelectedCommande(commande)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedCommande(null)
  }

  const filteredCommandes = commandes.filter(commande => {
    // Filtre par recherche
    const matchesSearch = 
      commande.numero_commande.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${commande.patient_prenom} ${commande.patient_nom}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtre par statut
    const matchesStatut = filterStatut === 'all' || commande.statut === filterStatut
    
    return matchesSearch && matchesStatut
  })

  const getStatutBadge = (statut: string) => {
    const config = {
      'en_attente': { label: 'En attente', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      'confirmee': { label: 'Confirmée', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'preparee': { label: 'Préparée', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'prete': { label: 'Prête', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'recuperee': { label: 'Récupérée', variant: 'secondary' as const, color: 'bg-green-100 text-green-800' },
      'annulee': { label: 'Annulée', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    }
    
    const { label, variant } = config[statut as keyof typeof config] || { label: statut, variant: 'secondary' as const }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getNextStatut = (currentStatut: string) => {
    const workflow = {
      'en_attente': 'confirmee',
      'confirmee': 'preparee',
      'preparee': 'prete',
      'prete': 'recuperee'
    }
    return workflow[currentStatut as keyof typeof workflow]
  }

  const getNextStatutLabel = (currentStatut: string) => {
    const labels = {
      'en_attente': 'Confirmer',
      'confirmee': 'Préparer',
      'preparee': 'Marquer prête',
      'prete': 'Marquer récupérée'
    }
    return labels[currentStatut as keyof typeof labels]
  }

  const getActionFromStatut = (currentStatut: string): 'confirmer' | 'preparer' | 'prete' | 'recuperee' | null => {
    const actionMap = {
      'en_attente': 'confirmer' as const,
      'confirmee': 'preparer' as const,
      'preparee': 'prete' as const,
      'prete': 'recuperee' as const
    }
    return actionMap[currentStatut as keyof typeof actionMap] || null
  }

  const canAdvanceStatut = (statut: string) => {
    return ['en_attente', 'confirmee', 'preparee', 'prete'].includes(statut)
  }

  const stats = {
    total: commandes.length,
    en_attente: commandes.filter(c => c.statut === 'en_attente').length,
    confirmee: commandes.filter(c => c.statut === 'confirmee').length,
    preparee: commandes.filter(c => c.statut === 'preparee').length,
    prete: commandes.filter(c => c.statut === 'prete').length,
    recuperee: commandes.filter(c => c.statut === 'recuperee').length,
    annulee: commandes.filter(c => c.statut === 'annulee').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
        <p className="text-gray-600">
          Gérez les commandes de votre pharmacie {pharmacie?.nom}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.en_attente}</div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.confirmee}</div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Préparées</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.preparee}</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prêtes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.prete}</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récupérées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.recuperee}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des commandes</CardTitle>
          <CardDescription>
            Toutes les commandes reçues dans votre pharmacie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par numéro ou patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatut === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatut('all')}
                size="sm"
              >
                Toutes
              </Button>
              <Button
                variant={filterStatut === 'en_attente' ? 'default' : 'outline'}
                onClick={() => setFilterStatut('en_attente')}
                size="sm"
              >
                En attente
              </Button>
              <Button
                variant={filterStatut === 'confirmee' ? 'default' : 'outline'}
                onClick={() => setFilterStatut('confirmee')}
                size="sm"
              >
                Confirmées
              </Button>
              <Button
                variant={filterStatut === 'prete' ? 'default' : 'outline'}
                onClick={() => setFilterStatut('prete')}
                size="sm"
              >
                Prêtes
              </Button>
            </div>
          </div>

          {/* Tableau des commandes */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Prescription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommandes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm || filterStatut !== 'all' 
                        ? 'Aucune commande trouvée avec ces critères'
                        : 'Aucune commande reçue'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCommandes
                    .sort((a, b) => new Date(b.date_commande).getTime() - new Date(a.date_commande).getTime())
                    .map((commande) => (
                    <TableRow key={commande.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">#{commande.numero_commande}</p>
                          <p className="text-sm text-gray-500">ID: {commande.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {commande.patient_prenom} {commande.patient_nom}
                            </p>
                            {commande.patient_telephone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {commande.patient_telephone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDateTime(commande.date_commande)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(commande.montant_total)}
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(commande.statut)}
                      </TableCell>
                      <TableCell>
                        {commande.prescription_image ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600">Oui</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Non</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(commande)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Détails
                          </Button>
                          
                          {/* Boutons d'action avec messages */}
                          {commande.statut === 'en_attente' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleOpenActionModal(commande, 'confirmer')}
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Confirmer
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOpenActionModal(commande, 'refuser')}
                                className="flex items-center gap-1"
                              >
                                <XCircle className="h-3 w-3" />
                                Refuser
                              </Button>
                            </>
                          )}
                          
                          {commande.statut === 'confirmee' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenActionModal(commande, 'preparer')}
                              className="bg-yellow-600 hover:bg-yellow-700 flex items-center gap-1"
                            >
                              <Package className="h-3 w-3" />
                              Préparer
                            </Button>
                          )}
                          
                          {commande.statut === 'preparee' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenActionModal(commande, 'prete')}
                              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Marquer prête
                            </Button>
                          )}
                          
                          {commande.statut === 'prete' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenActionModal(commande, 'recuperee')}
                              className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Récupérée
                            </Button>
                          )}
                          
                          {/* Bouton pour envoyer un message */}
                          {!['annulee', 'recuperee'].includes(commande.statut) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenActionModal(commande, commande.statut as any)}
                              className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Message
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de détails de commande */}
      <CommandeDetails
        commande={selectedCommande}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onUpdateStatut={handleUpdateStatut}
      />

      {/* Modal d'action avec message */}
      <CommandeActionModal
        commande={commandeForAction}
        isOpen={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false)
          setCommandeForAction(null)
          setCurrentAction(null)
        }}
        onConfirm={handleActionWithMessage}
        action={currentAction}
      />
    </div>
  )
}