import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { 
  ShoppingCart, 
  Plus, 
  Minus,
  Trash2,
  Calculator,
  Receipt,
  Search,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  User,
  Phone,
  Lock,
  Eye,
  Printer,
  X
} from 'lucide-react'
import { 
  ventesService,
  stockService,
  pharmacieService,
  produitService,
  authService,
  employesService,
  type VentePharmacie,
  type StockProduit,
  type Produit,
  type Pharmacie,
  type StatistiquesVentes,
  type EmployePharmacie
} from '../services/api'
import { formatCurrency, formatDate } from '../lib/utils'

interface LigneVenteForm {
  produit_id: number
  produit_nom: string
  quantite: number
  prix_unitaire: number
  remise_pourcentage: number
  stock_disponible: number
  unite: string
}

export const Ventes = () => {
  const navigate = useNavigate()
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [employeProfile, setEmployeProfile] = useState<EmployePharmacie | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [stocks, setStocks] = useState<StockProduit[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [ventes, setVentes] = useState<VentePharmacie[]>([])
  const [statistiques, setStatistiques] = useState<StatistiquesVentes | null>(null)
  const [loading, setLoading] = useState(true)
  
  // État pour la nouvelle vente
  const [isCreatingVente, setIsCreatingVente] = useState(false)
  const [venteForm, setVenteForm] = useState({
    nom_client: '',
    telephone_client: '',
    mode_paiement: 'especes',
    reference_paiement: '',
    notes: '',
    montant_paye: 0
  })
  const [lignesVente, setLignesVente] = useState<LigneVenteForm[]>([])
  const [searchProduit, setSearchProduit] = useState('')
  
  // États pour l'affichage
  const [activeTab, setActiveTab] = useState<'nouvelle' | 'historique' | 'stats'>('nouvelle')
  const [periodeStats, setPeriodeStats] = useState('ce_mois')
  const [selectedVente, setSelectedVente] = useState<VentePharmacie | null>(null)
  const [showVenteDetails, setShowVenteDetails] = useState(false)

  useEffect(() => {
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    const user = authService.getCurrentUser()
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role === 'pharmacien') {
      setHasPermission(true)
      loadData()
    } else if (user.role === 'employe_pharmacie') {
      try {
        const profile = await employesService.getMonProfil()
        setEmployeProfile(profile)
        
        if (profile.peut_vendre) {
          setHasPermission(true)
          loadData()
        } else {
          setHasPermission(false)
          setLoading(false)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des permissions:', error)
        setHasPermission(false)
        setLoading(false)
      }
    } else {
      navigate('/dashboard')
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger la pharmacie
      const pharmacieData = await pharmacieService.getMyPharmacie()
      setPharmacie(pharmacieData)
      
      if (pharmacieData) {
        // Charger les données en parallèle
        const [stocksResponse, produitsResponse, ventesResponse, statsResponse] = await Promise.all([
          stockService.getAll(pharmacieData.id),
          produitService.getAll(),
          ventesService.getAll(pharmacieData.id),
          ventesService.getStatistiques(pharmacieData.id, periodeStats)
        ])
        
        const stocksData = Array.isArray(stocksResponse) ? stocksResponse : stocksResponse.results || []
        const produitsData = Array.isArray(produitsResponse) ? produitsResponse : produitsResponse.results || []
        const ventesData = Array.isArray(ventesResponse) ? ventesResponse : ventesResponse.results || []
        
        setStocks(stocksData)
        setProduits(produitsData)
        setVentes(ventesData)
        setStatistiques(statsResponse)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLigne = (produit: Produit) => {
    const stock = stocks.find(s => s.produit === produit.id)
    if (!stock || stock.quantite <= 0) {
      alert('Produit non disponible en stock')
      return
    }
    
    // Vérifier si le produit n'est pas déjà dans la liste
    if (lignesVente.find(l => l.produit_id === produit.id)) {
      alert('Ce produit est déjà dans la vente')
      return
    }
    
    const nouvelleLigne: LigneVenteForm = {
      produit_id: produit.id,
      produit_nom: produit.nom,
      quantite: 1,
      prix_unitaire: parseFloat(stock.prix_vente.toString()),
      remise_pourcentage: 0,
      stock_disponible: stock.quantite,
      unite: produit.unite
    }
    
    setLignesVente([...lignesVente, nouvelleLigne])
    setSearchProduit('')
  }

  const handleUpdateLigne = (index: number, field: keyof LigneVenteForm, value: number) => {
    const newLignes = [...lignesVente]
    
    if (field === 'quantite' && value > newLignes[index].stock_disponible) {
      alert(`Stock insuffisant. Disponible: ${newLignes[index].stock_disponible}`)
      return
    }
    
    newLignes[index] = { ...newLignes[index], [field]: value }
    setLignesVente(newLignes)
  }

  const handleRemoveLigne = (index: number) => {
    setLignesVente(lignesVente.filter((_, i) => i !== index))
  }

  const calculateMontantTotal = () => {
    return lignesVente.reduce((total, ligne) => {
      const prixBrut = ligne.quantite * ligne.prix_unitaire
      const remise = (ligne.remise_pourcentage * prixBrut) / 100
      return total + (prixBrut - remise)
    }, 0)
  }

  const handleSubmitVente = async () => {
    if (lignesVente.length === 0) {
      alert('Ajoutez au moins un produit à la vente')
      return
    }
    
    if (!pharmacie) {
      alert('Erreur: pharmacie non trouvée')
      return
    }
    
    const montantTotal = calculateMontantTotal()
    
    if (venteForm.montant_paye < montantTotal) {
      alert('Le montant payé est insuffisant')
      return
    }
    
    try {
      setLoading(true)
      
      const venteData = {
        pharmacie: pharmacie.id,
        nom_client: venteForm.nom_client,
        telephone_client: venteForm.telephone_client,
        mode_paiement: venteForm.mode_paiement,
        reference_paiement: venteForm.reference_paiement,
        notes: venteForm.notes,
        montant_paye: venteForm.montant_paye,
        lignes: lignesVente.map(ligne => ({
          produit_id: ligne.produit_id,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          remise_pourcentage: ligne.remise_pourcentage
        }))
      }
      
      await ventesService.create(venteData)
      
      // Réinitialiser le formulaire
      setVenteForm({
        nom_client: '',
        telephone_client: '',
        mode_paiement: 'especes',
        reference_paiement: '',
        notes: '',
        montant_paye: 0
      })
      setLignesVente([])
      
      // Recharger les données
      await loadData()
      
      alert('Vente enregistrée avec succès!')
      
      // Imprimer automatiquement le ticket
      const currentUser = authService.getCurrentUser()
      const venteComplete = {
        ...venteData,
        numero_vente: `VENTE-${Date.now()}`, // Temporaire, sera remplacé par la vraie valeur du backend
        date_vente: new Date().toISOString(),
        vendeur_nom: currentUser?.nom || 'Vendeur',
        montant_rendu: venteForm.montant_paye - montantTotal,
        mode_paiement_display: ventesService.getModePaiementOptions().find(opt => opt.value === venteForm.mode_paiement)?.label || venteForm.mode_paiement,
        lignes: lignesVente.map(ligne => ({
          produit_nom: ligne.produit_nom,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          prix_total: ligne.quantite * ligne.prix_unitaire * (1 - ligne.remise_pourcentage / 100)
        }))
      } as any
      
      // Demander si l'utilisateur veut imprimer le ticket
      if (confirm('Vente enregistrée ! Voulez-vous imprimer le ticket de caisse ?')) {
        handlePrintTicket(venteComplete)
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vente:', error)
      alert('Erreur lors de l\'enregistrement de la vente')
    } finally {
      setLoading(false)
    }
  }

  const filteredProduits = produits.filter(produit => {
    const hasStock = stocks.some(s => s.produit === produit.id && s.quantite > 0)
    const matchesSearch = produit.nom.toLowerCase().includes(searchProduit.toLowerCase())
    return hasStock && matchesSearch
  })

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'especes': return <Banknote className="h-4 w-4" />
      case 'carte': return <CreditCard className="h-4 w-4" />
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'cheque': return <FileText className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const handleViewVenteDetails = (vente: VentePharmacie) => {
    setSelectedVente(vente)
    setShowVenteDetails(true)
  }

  const handlePrintRecu = async (vente: VentePharmacie) => {
    try {
      // Récupérer les données du reçu depuis l'API
      const recuData = await ventesService.getRecu(vente.id)
      
      // Générer le contenu du reçu détaillé
      const recuContent = generateRecuContent(recuData)
      
      // Créer une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(recuContent)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression du reçu:', error)
      alert('Erreur lors de l\'impression du reçu')
    }
  }

  const handlePrintTicket = async (vente: VentePharmacie) => {
    try {
      // Générer le contenu du ticket
      const ticketContent = generateTicketContent(vente)
      
      // Créer une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(ticketContent)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression du ticket:', error)
      alert('Erreur lors de l\'impression du ticket')
    }
  }

  const generateTicketContent = (vente: VentePharmacie) => {
    const date = new Date(vente.date_vente).toLocaleString('fr-FR')
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket de Caisse - ${vente.numero_vente}</title>
        <style>
          @media print {
            body { margin: 0; padding: 10px; font-family: 'Courier New', monospace; font-size: 12px; }
            .ticket { width: 80mm; max-width: 80mm; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
            .double-line { border-top: 2px solid #000; margin: 5px 0; }
          }
          body { margin: 0; padding: 10px; font-family: 'Courier New', monospace; font-size: 12px; }
          .ticket { width: 80mm; max-width: 80mm; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          .double-line { border-top: 2px solid #000; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="center bold">
            ${pharmacie?.nom || 'PHARMACIE'}
          </div>
          <div class="center">
            ${pharmacie?.adresse || ''}
          </div>
          <div class="center">
            ${pharmacie?.telephone || ''}
          </div>
          <div class="line"></div>
          
          <div class="center bold">TICKET DE CAISSE</div>
          <div class="center">N° ${vente.numero_vente}</div>
          <div class="center">${date}</div>
          <div class="line"></div>
          
          ${vente.nom_client ? `<div>Client: ${vente.nom_client}</div>` : ''}
          ${vente.telephone_client ? `<div>Tél: ${vente.telephone_client}</div>` : ''}
          ${(vente.nom_client || vente.telephone_client) ? '<div class="line"></div>' : ''}
          
          ${vente.lignes?.map(ligne => `
            <div>
              <div class="bold">${ligne.produit_nom}</div>
              <div>${ligne.quantite} x ${formatCurrency(ligne.prix_unitaire)} = ${formatCurrency(ligne.prix_total)}</div>
            </div>
          `).join('') || ''}
          
          <div class="line"></div>
          <div class="bold right">TOTAL: ${formatCurrency(vente.montant_total)}</div>
          <div class="right">Payé: ${formatCurrency(vente.montant_paye)}</div>
          ${vente.montant_rendu > 0 ? `<div class="right">Rendu: ${formatCurrency(vente.montant_rendu)}</div>` : ''}
          <div class="double-line"></div>
          
          <div class="center">Mode: ${vente.mode_paiement_display}</div>
          <div class="center">Vendeur: ${vente.vendeur_nom}</div>
          <div class="line"></div>
          <div class="center">Merci de votre visite!</div>
        </div>
      </body>
      </html>
    `
  }

  const generateRecuContent = (recuData: any) => {
    const vente = recuData.vente
    const pharmacieInfo = recuData.pharmacie
    const date = new Date(vente.date_vente).toLocaleString('fr-FR')
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reçu de Vente - ${vente.numero_vente}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; }
            .recu { max-width: 210mm; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .info-section { margin-bottom: 15px; }
            .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; font-weight: bold; }
            .total-section { border-top: 2px solid #000; padding-top: 10px; margin-top: 20px; }
            .signature { margin-top: 40px; display: flex; justify-content: space-between; }
          }
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; }
          .recu { max-width: 210mm; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .info-section { margin-bottom: 15px; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f5f5f5; font-weight: bold; }
          .total-section { border-top: 2px solid #000; padding-top: 10px; margin-top: 20px; }
          .signature { margin-top: 40px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="recu">
          <div class="header">
            <h1>${pharmacieInfo.nom}</h1>
            <p>${pharmacieInfo.adresse}</p>
            <p>Tél: ${pharmacieInfo.telephone} | Email: ${pharmacieInfo.email || ''}</p>
          </div>
          
          <div class="info-section">
            <h2>REÇU DE VENTE</h2>
            <p><strong>N° de vente:</strong> ${vente.numero_vente}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Vendeur:</strong> ${vente.vendeur_nom}</p>
            ${vente.nom_client ? `<p><strong>Client:</strong> ${vente.nom_client}</p>` : ''}
            ${vente.telephone_client ? `<p><strong>Téléphone:</strong> ${vente.telephone_client}</p>` : ''}
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${vente.lignes?.map((ligne: any) => `
                <tr>
                  <td>${ligne.produit_nom}</td>
                  <td>${ligne.quantite}</td>
                  <td>${formatCurrency(ligne.prix_unitaire)}</td>
                  <td>${formatCurrency(ligne.prix_total)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <div class="total-section">
            <p><strong>Montant total: ${formatCurrency(vente.montant_total)}</strong></p>
            <p>Mode de paiement: ${vente.mode_paiement_display}</p>
            <p>Montant payé: ${formatCurrency(vente.montant_paye)}</p>
            ${vente.montant_rendu > 0 ? `<p>Monnaie rendue: ${formatCurrency(vente.montant_rendu)}</p>` : ''}
            ${vente.reference_paiement ? `<p>Référence: ${vente.reference_paiement}</p>` : ''}
          </div>
          
          ${vente.notes ? `
            <div class="info-section">
              <p><strong>Notes:</strong></p>
              <p>${vente.notes}</p>
            </div>
          ` : ''}
          
          <div class="signature">
            <div>
              <p>Signature du client:</p>
              <br><br>
              <p>_____________________</p>
            </div>
            <div>
              <p>Signature du vendeur:</p>
              <br><br>
              <p>_____________________</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #666;">
            <p>Merci de votre confiance !</p>
            <p>Document généré le ${new Date().toLocaleString('fr-FR')}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  if (loading && !pharmacie) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl text-gray-700">Accès Restreint</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder aux ventes manuelles.
              {employeProfile && (
                <div className="mt-2 text-sm">
                  Contactez votre pharmacien pour obtenir la permission "peut_vendre".
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Retour au Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventes Manuelles</h1>
          <p className="text-gray-600">
            Gérez les ventes directes de votre pharmacie {pharmacie?.nom}
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'nouvelle' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('nouvelle')}
          className="rounded-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Vente
        </Button>
        <Button
          variant={activeTab === 'historique' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('historique')}
          className="rounded-md"
        >
          <Receipt className="h-4 w-4 mr-2" />
          Historique
        </Button>
        <Button
          variant={activeTab === 'stats' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('stats')}
          className="rounded-md"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Statistiques
        </Button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'nouvelle' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sélection des produits */}
          <Card>
            <CardHeader>
              <CardTitle>Sélection des Produits</CardTitle>
              <CardDescription>
                Recherchez et ajoutez des produits à la vente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchProduit}
                  onChange={(e) => setSearchProduit(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProduits.map((produit) => {
                  const stock = stocks.find(s => s.produit === produit.id)
                  return (
                    <div
                      key={produit.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddLigne(produit)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{produit.nom}</p>
                        <p className="text-sm text-gray-500">
                          Stock: {stock?.quantite || 0} {produit.unite} - {formatCurrency(parseFloat(stock?.prix_vente.toString() || '0'))}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-green-600" />
                    </div>
                  )
                })}
                {filteredProduits.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    {searchProduit ? 'Aucun produit trouvé' : 'Tapez pour rechercher un produit'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Panier et finalisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Panier ({lignesVente.length} produit{lignesVente.length > 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lignes de vente */}
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {lignesVente.map((ligne, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{ligne.produit_nom}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLigne(index)}
                        className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <Label className="text-xs">Quantité</Label>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateLigne(index, 'quantite', Math.max(1, ligne.quantite - 1))}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="mx-2 min-w-[2rem] text-center">{ligne.quantite}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateLigne(index, 'quantite', ligne.quantite + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Prix unitaire</Label>
                        <Input
                          type="number"
                          value={ligne.prix_unitaire}
                          onChange={(e) => handleUpdateLigne(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                          className="h-6 text-xs"
                          step="0.01"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Remise %</Label>
                        <Input
                          type="number"
                          value={ligne.remise_pourcentage}
                          onChange={(e) => handleUpdateLigne(index, 'remise_pourcentage', parseFloat(e.target.value) || 0)}
                          className="h-6 text-xs"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                    
                    <div className="text-right text-sm font-medium">
                      {formatCurrency(ligne.quantite * ligne.prix_unitaire * (1 - ligne.remise_pourcentage / 100))}
                    </div>
                  </div>
                ))}
                
                {lignesVente.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Aucun produit dans le panier
                  </p>
                )}
              </div>

              {/* Informations client */}
              <div className="border-t pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Nom du client</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Optionnel"
                        value={venteForm.nom_client}
                        onChange={(e) => setVenteForm({...venteForm, nom_client: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Optionnel"
                        value={venteForm.telephone_client}
                        onChange={(e) => setVenteForm({...venteForm, telephone_client: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Mode de paiement</Label>
                  <Select
                    value={venteForm.mode_paiement}
                    onValueChange={(value) => setVenteForm({...venteForm, mode_paiement: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèces</SelectItem>
                      <SelectItem value="carte">Carte bancaire</SelectItem>
                      <SelectItem value="mobile">Paiement mobile</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                      <SelectItem value="credit">Crédit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {venteForm.mode_paiement !== 'especes' && (
                  <div>
                    <Label className="text-sm">Référence de paiement</Label>
                    <Input
                      placeholder="Numéro de transaction, chèque, etc."
                      value={venteForm.reference_paiement}
                      onChange={(e) => setVenteForm({...venteForm, reference_paiement: e.target.value})}
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm">Notes</Label>
                  <Textarea
                    placeholder="Notes sur la vente..."
                    value={venteForm.notes}
                    onChange={(e) => setVenteForm({...venteForm, notes: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>

              {/* Total et paiement */}
              {lignesVente.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateMontantTotal())}</span>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Montant payé</Label>
                    <Input
                      type="number"
                      value={venteForm.montant_paye}
                      onChange={(e) => setVenteForm({...venteForm, montant_paye: parseFloat(e.target.value) || 0})}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  {venteForm.montant_paye > calculateMontantTotal() && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Monnaie à rendre:</span>
                      <span className="font-medium">
                        {formatCurrency(venteForm.montant_paye - calculateMontantTotal())}
                      </span>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleSubmitVente}
                    disabled={loading || venteForm.montant_paye < calculateMontantTotal()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {loading ? 'Enregistrement...' : 'Finaliser la Vente'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historique des ventes */}
      {activeTab === 'historique' && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des Ventes</CardTitle>
            <CardDescription>
              Liste de toutes les ventes effectuées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Vente</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Mode Paiement</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Aucune vente enregistrée
                      </TableCell>
                    </TableRow>
                  ) : (
                    ventes.map((vente) => (
                      <TableRow key={vente.id}>
                        <TableCell className="font-mono">{vente.numero_vente}</TableCell>
                        <TableCell>{formatDate(vente.date_vente)}</TableCell>
                        <TableCell>
                          {vente.nom_client || 'Client anonyme'}
                          {vente.telephone_client && (
                            <div className="text-xs text-gray-500">{vente.telephone_client}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getModeIcon(vente.mode_paiement)}
                            <span className="text-sm">{vente.mode_paiement_display}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(vente.montant_total)}
                        </TableCell>
                        <TableCell>{vente.vendeur_nom}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewVenteDetails(vente)}
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintRecu(vente)}
                              title="Imprimer le reçu"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
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
      )}

      {/* Statistiques */}
      {activeTab === 'stats' && statistiques && (
        <div className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Label>Période:</Label>
                <Select
                  value={periodeStats}
                  onValueChange={async (value) => {
                    setPeriodeStats(value)
                    // Recharger les stats avec la nouvelle période
                    if (pharmacie) {
                      try {
                        const statsResponse = await ventesService.getStatistiques(pharmacie.id, value)
                        setStatistiques(statsResponse)
                      } catch (error) {
                        console.error('Error loading statistics for period', value, ':', error)
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aujourd_hui">Aujourd'hui</SelectItem>
                    <SelectItem value="cette_semaine">Cette semaine</SelectItem>
                    <SelectItem value="ce_mois">Ce mois</SelectItem>
                    <SelectItem value="cette_annee">Cette année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ventes</CardTitle>
                <Receipt className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques?.total_ventes || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(statistiques?.chiffre_affaires_total || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
                <Calculator className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(statistiques?.panier_moyen || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top produits */}
          <Card>
            <CardHeader>
              <CardTitle>Top Produits Vendus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(statistiques?.top_produits || []).slice(0, 5).map((produit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{produit.produit__nom}</p>
                      <p className="text-sm text-gray-500">
                        {produit.quantite_totale} unités vendues
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(produit.chiffre_affaires)}</p>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Modes de paiement */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Mode de Paiement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(statistiques?.modes_paiement || []).map((mode, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getModeIcon(mode.mode_paiement)}
                      <span className="font-medium capitalize">{mode.mode_paiement}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(mode.montant)}</p>
                      <p className="text-sm text-gray-500">{mode.nombre} ventes</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Modal des détails de vente */}
      {showVenteDetails && selectedVente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la Vente #{selectedVente.numero_vente}
                </h2>
                <button
                  onClick={() => setShowVenteDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date de vente</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedVente.date_vente)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendeur</label>
                    <p className="text-sm text-gray-900">{selectedVente.vendeur_nom}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Client</label>
                    <p className="text-sm text-gray-900">{selectedVente.nom_client || 'Client anonyme'}</p>
                    {selectedVente.telephone_client && (
                      <p className="text-xs text-gray-500">{selectedVente.telephone_client}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mode de paiement</label>
                    <div className="flex items-center gap-2">
                      {getModeIcon(selectedVente.mode_paiement)}
                      <span className="text-sm text-gray-900">{selectedVente.mode_paiement_display}</span>
                    </div>
                  </div>
                </div>
                
                {/* Produits vendus */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Produits vendus</h3>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Produit</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Qté</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Prix unit.</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVente.lignes?.map((ligne, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-sm text-gray-900">{ligne.produit_nom}</td>
                            <td className="px-4 py-2 text-center text-sm text-gray-900">{ligne.quantite}</td>
                            <td className="px-4 py-2 text-right text-sm text-gray-900">{formatCurrency(ligne.prix_unitaire)}</td>
                            <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency(ligne.prix_total)}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                              Aucun détail de produit disponible
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Totaux */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Montant total:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedVente.montant_total)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Montant payé:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(selectedVente.montant_paye)}</span>
                  </div>
                  {selectedVente.montant_rendu > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Monnaie rendue:</span>
                      <span className="text-sm text-green-600">{formatCurrency(selectedVente.montant_rendu)}</span>
                    </div>
                  )}
                </div>
                
                {/* Notes */}
                {selectedVente.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg mt-1">{selectedVente.notes}</p>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handlePrintTicket(selectedVente)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer ticket
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePrintRecu(selectedVente)}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Imprimer reçu
                  </Button>
                  <Button onClick={() => setShowVenteDetails(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}