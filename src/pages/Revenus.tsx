import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  ShoppingCart,
  Package,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { 
  commandeService, 
  pharmacieService,
  authService,
  type CommandePharmacie,
  type Pharmacie
} from '../services/api'
import { formatCurrency, formatDate } from '../lib/utils'

interface RevenueStats {
  chiffreAffairesJour: number
  chiffreAffairesSemaine: number
  chiffreAffairesMois: number
  chiffreAffairesAnnee: number
  commandesJour: number
  commandesSemaine: number
  commandesMois: number
  commandesAnnee: number
  panierMoyen: number
  croissanceMois: number
}

interface VentesParJour {
  date: string
  montant: number
  commandes: number
}

export const Revenus = () => {
  const [stats, setStats] = useState<RevenueStats>({
    chiffreAffairesJour: 0,
    chiffreAffairesSemaine: 0,
    chiffreAffairesMois: 0,
    chiffreAffairesAnnee: 0,
    commandesJour: 0,
    commandesSemaine: 0,
    commandesMois: 0,
    commandesAnnee: 0,
    panierMoyen: 0,
    croissanceMois: 0
  })
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [commandes, setCommandes] = useState<CommandePharmacie[]>([])
  const [ventesParJour, setVentesParJour] = useState<VentesParJour[]>([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('mois')
  const [modeTest, setModeTest] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // Recalculer quand le mode change
  useEffect(() => {
    if (commandes.length > 0) {
      if (modeTest) {
        calculateStatsTestMode(commandes)
      } else {
        calculateStats(commandes)
      }
    }
  }, [modeTest])

  // Recharger les données quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
        
        // Filtrer seulement les commandes récupérées (ventes finalisées)
        const commandesValides = commandesData.filter((cmd: any) => cmd.statut === 'recuperee')
       
        setCommandes(commandesValides)
        
        // Calculer les statistiques selon le mode
        if (modeTest) {
          calculateStatsTestMode(commandesValides)
        } else {
          calculateStats(commandesValides)
        }
        calculateVentesParJour(commandesValides)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStatsTestMode = (commandesData: CommandePharmacie[]) => {
    // En mode test, on affiche toutes les commandes récupérées comme si elles étaient du mois actuel
    const totalCommandes = commandesData.length
    const totalCA = commandesData.reduce((sum, cmd) => sum + parseFloat(cmd.montant_total.toString()), 0)
    const panierMoyen = totalCommandes > 0 ? totalCA / totalCommandes : 0


    setStats({
      chiffreAffairesJour: totalCA,
      chiffreAffairesSemaine: totalCA,
      chiffreAffairesMois: totalCA,
      chiffreAffairesAnnee: totalCA,
      commandesJour: totalCommandes,
      commandesSemaine: totalCommandes,
      commandesMois: totalCommandes,
      commandesAnnee: totalCommandes,
      panierMoyen,
      croissanceMois: 0
    })
  }

  const calculateStats = (commandesData: CommandePharmacie[]) => {
    const now = new Date()
    
    // Ajuster les dates de début pour inclure les données de test (2025)
    // En production, on utilisera les vraies dates actuelles
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    
    // Pour les données de test, inclure aussi l'année précédente
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
 
    const commandesJour = commandesData.filter(cmd => {
      // Utiliser date_recuperation si disponible, sinon date_commande pour compatibilité
      const dateRevenu = cmd.date_recuperation ? new Date(cmd.date_recuperation) : new Date(cmd.date_commande)
      return dateRevenu >= startOfDay
    })
    
    const commandesSemaine = commandesData.filter(cmd => {
      const dateRevenu = cmd.date_recuperation ? new Date(cmd.date_recuperation) : new Date(cmd.date_commande)
      return dateRevenu >= startOfWeek
    })
    
    const commandesMois = commandesData.filter(cmd => {
      const dateRevenu = cmd.date_recuperation ? new Date(cmd.date_recuperation) : new Date(cmd.date_commande)
      return dateRevenu >= startOfMonth
    })
    
    // Pour l'année, utiliser la date de récupération
    let commandesAnnee = commandesData.filter(cmd => {
      const dateRevenu = cmd.date_recuperation ? new Date(cmd.date_recuperation) : new Date(cmd.date_commande)
      return dateRevenu >= startOfYear
    })
    
    // Si pas de commandes cette année, prendre l'année précédente
    if (commandesAnnee.length === 0) {
      commandesAnnee = commandesData.filter(cmd => {
        const dateRevenu = cmd.date_recuperation ? new Date(cmd.date_recuperation) : new Date(cmd.date_commande)
        return dateRevenu >= startOfLastYear
      })
    }
    
    const commandesMoisPrecedent = commandesData.filter(cmd => {
      const dateRevenu = cmd.date_recuperation ? new Date(cmd.date_recuperation) : new Date(cmd.date_commande)
      return dateRevenu >= startOfLastMonth && dateRevenu <= endOfLastMonth
    })



    // Chiffre d'affaires par période
    const chiffreAffairesJour = commandesJour.reduce((sum, cmd) => sum + parseFloat(cmd.montant_total.toString()), 0)
    const chiffreAffairesSemaine = commandesSemaine.reduce((sum, cmd) => sum + parseFloat(cmd.montant_total.toString()), 0)
    const chiffreAffairesMois = commandesMois.reduce((sum, cmd) => sum + parseFloat(cmd.montant_total.toString()), 0)
    const chiffreAffairesAnnee = commandesAnnee.reduce((sum, cmd) => sum + parseFloat(cmd.montant_total.toString()), 0)
    const chiffreAffairesMoisPrecedent = commandesMoisPrecedent.reduce((sum, cmd) => sum + parseFloat(cmd.montant_total.toString()), 0)

    // Si pas de données pour le mois actuel, utiliser toutes les commandes pour l'affichage
    const commandesPourCalculs = commandesMois.length > 0 ? commandesMois : commandesData
    const chiffreAffairesPourCalculs = commandesMois.length > 0 ? chiffreAffairesMois : chiffreAffairesAnnee

    // Panier moyen
    const panierMoyen = commandesPourCalculs.length > 0 ? chiffreAffairesPourCalculs / commandesPourCalculs.length : 0

    // Croissance par rapport au mois précédent
    const croissanceMois = chiffreAffairesMoisPrecedent > 0 
      ? ((chiffreAffairesMois - chiffreAffairesMoisPrecedent) / chiffreAffairesMoisPrecedent) * 100 
      : chiffreAffairesMois > 0 ? 100 : 0


    setStats({
      chiffreAffairesJour,
      chiffreAffairesSemaine,
      chiffreAffairesMois,
      chiffreAffairesAnnee,
      commandesJour: commandesJour.length,
      commandesSemaine: commandesSemaine.length,
      commandesMois: commandesMois.length,
      commandesAnnee: commandesAnnee.length,
      panierMoyen,
      croissanceMois
    })
  }

  const calculateVentesParJour = (commandesData: CommandePharmacie[]) => {
    const now = new Date()
    const derniers7Jours: VentesParJour[] = []

    // Si pas de commandes récentes, utiliser les dates des commandes existantes
    const datesCommandes = commandesData.map(cmd => new Date(cmd.date_commande)).sort((a, b) => b.getTime() - a.getTime())
    const dateReference = datesCommandes.length > 0 ? datesCommandes[0] : now

    

    for (let i = 6; i >= 0; i--) {
      const date = new Date(dateReference.getFullYear(), dateReference.getMonth(), dateReference.getDate() - i)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

      const commandesDuJour = commandesData.filter(cmd => {
        // Utiliser date_recuperation si disponible pour les graphiques aussi
        const dateRevenu = cmd.date_recuperation ? new Date(cmd.date_recuperation) : new Date(cmd.date_commande)
        return dateRevenu >= startOfDay && dateRevenu < endOfDay
      })

      const montant = commandesDuJour.reduce((sum, cmd) => sum + parseFloat(cmd.montant_total.toString()), 0)

      derniers7Jours.push({
        date: formatDate(date),
        montant,
        commandes: commandesDuJour.length
      })
    }

    
    setVentesParJour(derniers7Jours)
  }

  const getStatsByPeriode = () => {
    switch (periode) {
      case 'jour':
        return {
          chiffre: stats.chiffreAffairesJour,
          commandes: stats.commandesJour,
          label: "Aujourd'hui"
        }
      case 'semaine':
        return {
          chiffre: stats.chiffreAffairesSemaine,
          commandes: stats.commandesSemaine,
          label: "Cette semaine"
        }
      case 'mois':
        return {
          chiffre: stats.chiffreAffairesMois,
          commandes: stats.commandesMois,
          label: "Ce mois"
        }
      case 'annee':
        return {
          chiffre: stats.chiffreAffairesAnnee,
          commandes: stats.commandesAnnee,
          label: "Cette année"
        }
      default:
        return {
          chiffre: stats.chiffreAffairesMois,
          commandes: stats.commandesMois,
          label: "Ce mois"
        }
    }
  }

  const currentStats = getStatsByPeriode()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Vérifier s'il y a des revenus
  const hasRevenue = stats.chiffreAffairesAnnee > 0

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenus</h1>
          <p className="text-gray-600">
            Analyse des revenus de votre pharmacie {pharmacie?.nom}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            ℹ️ Seules les commandes récupérées sont comptabilisées dans les revenus
          </p>
        
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Bouton mode test */}
         
          
          {/* Bouton actualiser */}
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {/* Sélecteur de période */}
          <div className="flex gap-2">
            {(['jour', 'semaine', 'mois', 'annee'] as const).map((p) => (
              <Button
                key={p}
                variant={periode === p ? 'default' : 'outline'}
                onClick={() => setPeriode(p)}
                size="sm"
                className="capitalize"
              >
                {p === 'annee' ? 'Année' : p}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Message informatif si pas de revenus */}
      {!hasRevenue && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Aucun revenu enregistré
              </h3>
              <p className="text-blue-700 mb-4">
                Les revenus apparaîtront ici une fois que des commandes auront été marquées comme "récupérées".
              </p>
              <p className="text-sm text-blue-600">
                💡 Pour générer des revenus : Commandes → Détails → Marquer comme récupérée
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(currentStats.chiffre)}
            </div>
            <p className="text-xs text-green-700 mt-1">{currentStats.label}</p>
            {periode === 'mois' && (
              <div className={`flex items-center mt-2 text-xs ${
                stats.croissanceMois >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${stats.croissanceMois >= 0 ? '' : 'rotate-180'}`} />
                {Math.abs(stats.croissanceMois).toFixed(1)}% vs mois dernier
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes Finalisées</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentStats.commandes}
            </div>
            <p className="text-xs text-blue-700 mt-1">{currentStats.label}</p>
            <p className="text-xs text-gray-500 mt-1">Commandes récupérées</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.panierMoyen)}
            </div>
            <p className="text-xs text-purple-700 mt-1">Ce mois</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Mensuel</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.chiffreAffairesMois)}
            </div>
            <p className="text-xs text-orange-700 mt-1">Mois en cours</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des ventes par jour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Ventes des 7 derniers jours
          </CardTitle>
          <CardDescription>
            Évolution quotidienne de votre chiffre d'affaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ventesParJour.map((vente, index) => {
              const maxMontant = Math.max(...ventesParJour.map(v => v.montant))
              const widthPercentage = maxMontant > 0 ? (vente.montant / maxMontant) * 100 : 0
              
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600 font-medium">
                    {vente.date}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div 
                          className="bg-green-500 h-6 rounded-full transition-all duration-300"
                          style={{ width: `${widthPercentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-xs font-medium text-gray-700">
                            {formatCurrency(vente.montant)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {vente.commandes} cmd
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Résumé mensuel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Résumé du mois
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chiffre d'affaires</span>
              <span className="font-bold text-green-600">
                {formatCurrency(stats.chiffreAffairesMois)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nombre de commandes</span>
              <span className="font-bold">{stats.commandesMois}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Panier moyen</span>
              <span className="font-bold">{formatCurrency(stats.panierMoyen)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Croissance vs mois dernier</span>
              <span className={`font-bold ${stats.croissanceMois >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.croissanceMois >= 0 ? '+' : ''}{stats.croissanceMois.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance annuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CA total année</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(stats.chiffreAffairesAnnee)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Commandes année</span>
              <span className="font-bold">{stats.commandesAnnee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CA moyen/mois</span>
              <span className="font-bold">
                {formatCurrency(stats.chiffreAffairesAnnee / 12)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Commandes/mois</span>
              <span className="font-bold">
                {Math.round(stats.commandesAnnee / 12)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}