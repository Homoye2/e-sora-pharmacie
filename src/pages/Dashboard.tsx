import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react'
import { 
  stockService, 
  commandeService, 
  statistiquesService,
  pharmacieService,
  authService,
  type StockProduit,
  type CommandePharmacie,
  type Pharmacie
} from '../services/api'
import { formatCurrency } from '../lib/utils'

interface DashboardStats {
  totalProduits: number
  produitsEnRupture: number
  produitsSousSeuil: number
  commandesEnAttente: number
  commandesAujourdhui: number
  chiffreAffairesMois: number
  chiffreAffairesJour: number
}

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  color = "default" 
}: {
  title: string
  value: string | number
  description?: string
  icon: any
  trend?: { value: number; positive: boolean }
  color?: "default" | "success" | "warning" | "danger"
}) => {
  const colorClasses = {
    default: "border-gray-200 bg-white",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    danger: "border-red-200 bg-red-50"
  }

  const iconColorClasses = {
    default: "text-gray-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600"
  }

  return (
    <Card className={`${colorClasses[color]} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${iconColorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center mt-2 text-xs ${
            trend.positive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${trend.positive ? '' : 'rotate-180'}`} />
            {trend.value}% vs mois dernier
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProduits: 0,
    produitsEnRupture: 0,
    produitsSousSeuil: 0,
    commandesEnAttente: 0,
    commandesAujourdhui: 0,
    chiffreAffairesMois: 0,
    chiffreAffairesJour: 0
  })
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [stocks, setStocks] = useState<StockProduit[]>([])
  const [commandes, setCommandes] = useState<CommandePharmacie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Charger les données de la pharmacie
      const pharmacieData = await pharmacieService.getMyPharmacie()
      setPharmacie(pharmacieData)
      
      if (!pharmacieData) {
        console.error('Aucune pharmacie trouvée pour cet utilisateur')
        return
      }

      // Charger les stocks
      const stocksResponse = await stockService.getAll(pharmacieData.id)
      const stocksData = Array.isArray(stocksResponse) ? stocksResponse : stocksResponse.results || []
      setStocks(stocksData)

      // Charger les commandes
      const commandesResponse = await commandeService.getAll(pharmacieData.id)
      const commandesData = Array.isArray(commandesResponse) ? commandesResponse : commandesResponse.results || []
      setCommandes(commandesData)

      // Calculer les statistiques
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      const commandesAujourdhui = commandesData.filter((cmd: any) => 
        new Date(cmd.date_commande) >= startOfDay
      ).length

      const commandesEnAttente = commandesData.filter((cmd: any) => 
        cmd.statut === 'en_attente' || cmd.statut === 'confirmee'
      ).length

      const commandesMois = commandesData.filter((cmd: any) => 
        new Date(cmd.date_commande) >= startOfMonth && 
        cmd.statut !== 'annulee'
      )

      const commandesJour = commandesData.filter((cmd: any) => 
        new Date(cmd.date_commande) >= startOfDay && 
        cmd.statut !== 'annulee'
      )

      const chiffreAffairesMois = commandesMois.reduce((sum: number, cmd: any) => sum + parseFloat(cmd.montant_total.toString()), 0)
      const chiffreAffairesJour = commandesJour.reduce((sum: number, cmd: any) => sum + parseFloat(cmd.montant_total.toString()), 0)

      const produitsEnRupture = stocksData.filter((stock: any) => stock.est_en_rupture).length
      const produitsSousSeuil = stocksData.filter((stock: any) => stock.est_sous_seuil).length

      setStats({
        totalProduits: stocksData.length,
        produitsEnRupture,
        produitsSousSeuil,
        commandesEnAttente,
        commandesAujourdhui,
        chiffreAffairesMois,
        chiffreAffairesJour
      })

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatutBadge = (statut: string) => {
    const config = {
      'en_attente': { label: 'En attente', variant: 'secondary' as const },
      'confirmee': { label: 'Confirmée', variant: 'default' as const },
      'preparee': { label: 'Préparée', variant: 'secondary' as const },
      'prete': { label: 'Prête', variant: 'default' as const },
      'recuperee': { label: 'Récupérée', variant: 'secondary' as const },
      'annulee': { label: 'Annulée', variant: 'destructive' as const }
    }
    
    const { label, variant } = config[statut as keyof typeof config] || { label: statut, variant: 'secondary' as const }
    return <Badge variant={variant}>{label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Vue d'ensemble de votre pharmacie {pharmacie?.nom}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Produits"
              value={stats.totalProduits}
              description="Produits en stock"
              icon={Package}
              color="default"
            />
            
            <StatCard
              title="Produits en Rupture"
              value={stats.produitsEnRupture}
              description="Nécessitent réapprovisionnement"
              icon={AlertTriangle}
              color={stats.produitsEnRupture > 0 ? "danger" : "success"}
            />
            
            <StatCard
              title="Commandes en Attente"
              value={stats.commandesEnAttente}
              description="À traiter"
              icon={Clock}
              color={stats.commandesEnAttente > 0 ? "warning" : "success"}
            />
            
            <StatCard
              title="CA du Mois"
              value={formatCurrency(stats.chiffreAffairesMois)}
              description={`Aujourd'hui: ${formatCurrency(stats.chiffreAffairesJour)}`}
              icon={DollarSign}
              color="success"
            />
          </div>

      {/* Alertes et informations importantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertes Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Alertes Stock
            </CardTitle>
            <CardDescription>
              Produits nécessitant votre attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stocks
                .filter(stock => stock.est_en_rupture || stock.est_sous_seuil || stock.est_proche_expiration)
                .slice(0, 5)
                .map(stock => (
                  <div key={stock.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{stock.produit_nom}</p>
                      <p className="text-xs text-gray-500">
                        Stock: {stock.quantite} unité
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {stock.est_en_rupture && (
                        <Badge variant="destructive" className="text-xs">Rupture</Badge>
                      )}
                      {stock.est_sous_seuil && !stock.est_en_rupture && (
                        <Badge variant="secondary" className="text-xs">Seuil bas</Badge>
                      )}
                      {stock.est_proche_expiration && (
                        <Badge variant="secondary" className="text-xs">Expire bientôt</Badge>
                      )}
                    </div>
                  </div>
                ))}
              
              {stocks.filter(stock => stock.est_en_rupture || stock.est_sous_seuil || stock.est_proche_expiration).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">Aucune alerte stock</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Commandes récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Commandes Récentes
            </CardTitle>
            <CardDescription>
              Dernières commandes reçues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {commandes
                .sort((a, b) => new Date(b.date_commande).getTime() - new Date(a.date_commande).getTime())
                .slice(0, 5)
                .map(commande => (
                  <div key={commande.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">#{commande.numero_commande}</p>
                      <p className="text-xs text-gray-500">
                        {commande.patient_prenom} {commande.patient_nom}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatutBadge(commande.statut)}
                      <p className="text-xs text-gray-500">
                        {formatCurrency(commande.montant_total)}
                      </p>
                    </div>
                  </div>
                ))}
              
              {commandes.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Aucune commande</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  )
}