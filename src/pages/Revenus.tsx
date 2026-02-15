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
  RefreshCw,
  CreditCard
} from 'lucide-react'
import { 
  ventesService,
  pharmacieService,
  type Pharmacie,
  type RevenusCombines
} from '../services/api'
import { formatCurrency, formatDate } from '../lib/utils'

interface RevenueStats {
  chiffreAffairesJour: number
  chiffreAffairesSemaine: number
  chiffreAffairesMois: number
  chiffreAffairesAnnee: number
  chiffreAffairesSemainePasse: number
  chiffreAffairesMoisPasse: number
  chiffreAffairesAnneePasse: number
  transactionsJour: number
  transactionsSemaine: number
  transactionsMois: number
  transactionsAnnee: number
  transactionsSemainePasse: number
  transactionsMoisPasse: number
  transactionsAnneePasse: number
  ventesManuellesJour: number
  ventesManuellesSemaine: number
  ventesManuellesMois: number
  ventesManuellesAnnee: number
  ventesManuellesSemainePasse: number
  ventesManuellesMoisPasse: number
  ventesManuellesAnneePasse: number
  commandesJour: number
  commandesSemaine: number
  commandesMois: number
  commandesAnnee: number
  commandesSemainePasse: number
  commandesMoisPasse: number
  commandesAnneePasse: number
  panierMoyen: number
  croissanceMois: number
}

interface VentesParJour {
  date: string
  montant: number
  transactions: number
  ventesManuellesCount: number
  commandesCount: number
}

export const Revenus = () => {
  const [stats, setStats] = useState<RevenueStats>({
    chiffreAffairesJour: 0,
    chiffreAffairesSemaine: 0,
    chiffreAffairesMois: 0,
    chiffreAffairesAnnee: 0,
    chiffreAffairesSemainePasse: 0,
    chiffreAffairesMoisPasse: 0,
    chiffreAffairesAnneePasse: 0,
    transactionsJour: 0,
    transactionsSemaine: 0,
    transactionsMois: 0,
    transactionsAnnee: 0,
    transactionsSemainePasse: 0,
    transactionsMoisPasse: 0,
    transactionsAnneePasse: 0,
    ventesManuellesJour: 0,
    ventesManuellesSemaine: 0,
    ventesManuellesMois: 0,
    ventesManuellesAnnee: 0,
    ventesManuellesSemainePasse: 0,
    ventesManuellesMoisPasse: 0,
    ventesManuellesAnneePasse: 0,
    commandesJour: 0,
    commandesSemaine: 0,
    commandesMois: 0,
    commandesAnnee: 0,
    commandesSemainePasse: 0,
    commandesMoisPasse: 0,
    commandesAnneePasse: 0,
    panierMoyen: 0,
    croissanceMois: 0
  })
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [ventesParJour, setVentesParJour] = useState<VentesParJour[]>([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState<'jour' |'mois' | 'semaine' | 'mois_passe' | 'semaine_passe' | 'annee' | 'annee_passe'>('mois')

  useEffect(() => {
    loadData()
  }, [])

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
        // Charger les revenus combinés (commandes + ventes manuelles)
        const revenusCombines = await ventesService.getRevenusCombines()
        calculateStats(revenusCombines)
        calculateVentesParJour(revenusCombines.ventes_par_jour)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (revenusCombines: RevenusCombines) => {
    const statsData = revenusCombines.statistiques_par_periode
    
    // Debug: afficher les clés disponibles
    console.log('Clés disponibles dans statistiques_par_periode:', Object.keys(statsData))
    console.log('Données complètes:', statsData)

    setStats({
      chiffreAffairesJour: statsData.aujourd_hui.chiffre_affaires_total,
      chiffreAffairesSemaine: statsData.cette_semaine.chiffre_affaires_total,
      chiffreAffairesMois: statsData.ce_mois.chiffre_affaires_total,
      chiffreAffairesAnnee: statsData.cette_annee.chiffre_affaires_total,
      chiffreAffairesSemainePasse: statsData.semaine_passee?.chiffre_affaires_total || 0,
      chiffreAffairesMoisPasse: statsData.mois_passe?.chiffre_affaires_total || 0,
      chiffreAffairesAnneePasse: statsData.annee_passee?.chiffre_affaires_total || 0,
      transactionsJour: statsData.aujourd_hui.nombre_total,
      transactionsSemaine: statsData.cette_semaine.nombre_total,
      transactionsMois: statsData.ce_mois.nombre_total,
      transactionsAnnee: statsData.cette_annee.nombre_total,
      transactionsSemainePasse: statsData.semaine_passee?.nombre_total || 0,
      transactionsMoisPasse: statsData.mois_passe?.nombre_total || 0,
      transactionsAnneePasse: statsData.annee_passee?.nombre_total || 0,
      ventesManuellesJour: statsData.aujourd_hui.nombre_ventes_manuelles,
      ventesManuellesSemaine: statsData.cette_semaine.nombre_ventes_manuelles,
      ventesManuellesMois: statsData.ce_mois.nombre_ventes_manuelles,
      ventesManuellesAnnee: statsData.cette_annee.nombre_ventes_manuelles,
      ventesManuellesSemainePasse: statsData.semaine_passee?.nombre_ventes_manuelles || 0,
      ventesManuellesMoisPasse: statsData.mois_passe?.nombre_ventes_manuelles || 0,
      ventesManuellesAnneePasse: statsData.annee_passee?.nombre_ventes_manuelles || 0,
      commandesJour: statsData.aujourd_hui.nombre_commandes,
      commandesSemaine: statsData.cette_semaine.nombre_commandes,
      commandesMois: statsData.ce_mois.nombre_commandes,
      commandesAnnee: statsData.cette_annee.nombre_commandes,
      commandesSemainePasse: statsData.semaine_passee?.nombre_commandes || 0,
      commandesMoisPasse: statsData.mois_passe?.nombre_commandes || 0,
      commandesAnneePasse: statsData.annee_passee?.nombre_commandes || 0,
      panierMoyen: revenusCombines.panier_moyen,
      croissanceMois: revenusCombines.croissance_mois
    })
  }

  const calculateVentesParJour = (ventesParJourData: RevenusCombines['ventes_par_jour']) => {
    const formattedData: VentesParJour[] = ventesParJourData.map(vente => ({
      date: formatDate(vente.date),
      montant: vente.montant_total,
      transactions: vente.total_transactions,
      ventesManuellesCount: vente.ventes_manuelles,
      commandesCount: vente.commandes
    }))
    
    setVentesParJour(formattedData)
  }

  const getStatsByPeriode = () => {
    switch (periode) {
      case 'jour':
        return {
          chiffre: stats.chiffreAffairesJour,
          transactions: stats.transactionsJour,
          ventesManuellesCount: stats.ventesManuellesJour,
          commandesCount: stats.commandesJour,
          label: "Aujourd'hui"
        }
      case 'semaine':
        return {
          chiffre: stats.chiffreAffairesSemaine,
          transactions: stats.transactionsSemaine,
          ventesManuellesCount: stats.ventesManuellesSemaine,
          commandesCount: stats.commandesSemaine,
          label: "Cette semaine"
        }
      case 'semaine_passe':
        return {
          chiffre: stats.chiffreAffairesSemainePasse,
          transactions: stats.transactionsSemainePasse,
          ventesManuellesCount: stats.ventesManuellesSemainePasse,
          commandesCount: stats.commandesSemainePasse,
          label: "Semaine passée"
        }
      case 'mois':
        return {
          chiffre: stats.chiffreAffairesMois,
          transactions: stats.transactionsMois,
          ventesManuellesCount: stats.ventesManuellesMois,
          commandesCount: stats.commandesMois,
          label: "Ce mois"
        }
      case 'mois_passe':
        return {
          chiffre: stats.chiffreAffairesMoisPasse,
          transactions: stats.transactionsMoisPasse,
          ventesManuellesCount: stats.ventesManuellesMoisPasse,
          commandesCount: stats.commandesMoisPasse,
          label: "Mois passé"
        }
      case 'annee':
        return {
          chiffre: stats.chiffreAffairesAnnee,
          transactions: stats.transactionsAnnee,
          ventesManuellesCount: stats.ventesManuellesAnnee,
          commandesCount: stats.commandesAnnee,
          label: "Cette année"
        }
      case 'annee_passe':
        return {
          chiffre: stats.chiffreAffairesAnneePasse,
          transactions: stats.transactionsAnneePasse,
          ventesManuellesCount: stats.ventesManuellesAnneePasse,
          commandesCount: stats.commandesAnneePasse,
          label: "Année passée"
        }
      default:
        return {
          chiffre: stats.chiffreAffairesMois,
          transactions: stats.transactionsMois,
          ventesManuellesCount: stats.ventesManuellesMois,
          commandesCount: stats.commandesMois,
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
            ℹ️ Inclut les commandes récupérées et les ventes manuelles
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
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
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value as typeof periode)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="jour">Aujourd'hui</option>
            <option value="semaine">Semaine en cours</option>
            <option value="semaine_passe">Semaine passée</option>
            <option value="mois">Mois en cours</option>
            <option value="mois_passe">Mois passé</option>
            <option value="annee">Année en cours</option>
            <option value="annee_passe">Année passée</option>
          </select>
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
                Les revenus apparaîtront ici une fois que des commandes auront été récupérées ou des ventes manuelles effectuées.
              </p>
              <p className="text-sm text-blue-600">
                💡 Pour générer des revenus : Commandes → Marquer comme récupérée ou Ventes Manuelles → Nouvelle vente
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
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentStats.transactions}
            </div>
            <p className="text-xs text-blue-700 mt-1">{currentStats.label}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                {currentStats.ventesManuellesCount} ventes
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                {currentStats.commandesCount} commandes
              </Badge>
            </div>
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
            <p className="text-xs text-purple-700 mt-1">Toutes transactions</p>
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
            Revenus des 7 derniers jours
          </CardTitle>
          <CardDescription>
            Évolution quotidienne de votre chiffre d'affaires (commandes + ventes manuelles)
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
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {vente.ventesManuellesCount}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          {vente.commandesCount}
                        </Badge>
                      </div>
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
              Résumé du mois en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chiffre d'affaires total</span>
              <span className="font-bold text-green-600">
                {formatCurrency(stats.chiffreAffairesMois)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ventes manuelles</span>
              <span className="font-bold">{stats.ventesManuellesMois}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Commandes récupérées</span>
              <span className="font-bold">{stats.commandesMois}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total transactions</span>
              <span className="font-bold">{stats.transactionsMois}</span>
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
              <span className="text-gray-600">Ventes manuelles année</span>
              <span className="font-bold">{stats.ventesManuellesAnnee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Commandes année</span>
              <span className="font-bold">{stats.commandesAnnee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total transactions année</span>
              <span className="font-bold">{stats.transactionsAnnee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CA moyen/mois</span>
              <span className="font-bold">
                {formatCurrency(stats.chiffreAffairesAnnee / 12)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transactions/mois</span>
              <span className="font-bold">
                {Math.round(stats.transactionsAnnee / 12)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparaisons périodes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Comparaison des périodes
          </CardTitle>
          <CardDescription>
            Comparez les performances entre les différentes périodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Comparaison Semaines */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Semaines
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm text-gray-600">Semaine en cours</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(stats.chiffreAffairesSemaine)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Semaine passée</span>
                  <span className="font-bold text-gray-600">
                    {formatCurrency(stats.chiffreAffairesSemainePasse)}
                  </span>
                </div>
                {stats.chiffreAffairesSemainePasse > 0 && (
                  <div className={`text-xs text-center p-2 rounded ${
                    stats.chiffreAffairesSemaine >= stats.chiffreAffairesSemainePasse 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {stats.chiffreAffairesSemaine >= stats.chiffreAffairesSemainePasse ? '↑' : '↓'}
                    {' '}
                    {Math.abs(
                      ((stats.chiffreAffairesSemaine - stats.chiffreAffairesSemainePasse) / 
                      stats.chiffreAffairesSemainePasse) * 100
                    ).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            {/* Comparaison Mois */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Mois
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm text-gray-600">Mois en cours</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(stats.chiffreAffairesMois)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Mois passé</span>
                  <span className="font-bold text-gray-600">
                    {formatCurrency(stats.chiffreAffairesMoisPasse)}
                  </span>
                </div>
                {stats.chiffreAffairesMoisPasse > 0 && (
                  <div className={`text-xs text-center p-2 rounded ${
                    stats.chiffreAffairesMois >= stats.chiffreAffairesMoisPasse 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {stats.chiffreAffairesMois >= stats.chiffreAffairesMoisPasse ? '↑' : '↓'}
                    {' '}
                    {Math.abs(
                      ((stats.chiffreAffairesMois - stats.chiffreAffairesMoisPasse) / 
                      stats.chiffreAffairesMoisPasse) * 100
                    ).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            {/* Comparaison Années */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Années
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm text-gray-600">Année en cours</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(stats.chiffreAffairesAnnee)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Année passée</span>
                  <span className="font-bold text-gray-600">
                    {formatCurrency(stats.chiffreAffairesAnneePasse)}
                  </span>
                </div>
                {stats.chiffreAffairesAnneePasse > 0 && (
                  <div className={`text-xs text-center p-2 rounded ${
                    stats.chiffreAffairesAnnee >= stats.chiffreAffairesAnneePasse 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {stats.chiffreAffairesAnnee >= stats.chiffreAffairesAnneePasse ? '↑' : '↓'}
                    {' '}
                    {Math.abs(
                      ((stats.chiffreAffairesAnnee - stats.chiffreAffairesAnneePasse) / 
                      stats.chiffreAffairesAnneePasse) * 100
                    ).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}