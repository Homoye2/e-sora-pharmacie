import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  FileText, 
  Plus, 
  Check, 
  X, 
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { 
  factureFournisseurService, 
  fournisseurService,
  produitService,
  pharmacieService,
  type FactureFournisseur,
  type Fournisseur,
  type Produit,
  type LigneFactureFournisseur,
  type Pharmacie
} from '../services/api'
import { formatCurrency, formatDate } from '../lib/utils'

export const Factures = () => {
  const [factures, setFactures] = useState<FactureFournisseur[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFournisseurModal, setShowFournisseurModal] = useState(false)
  const [showProduitModal, setShowProduitModal] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState<FactureFournisseur | null>(null)
  
  // États pour le formulaire
  const [formData, setFormData] = useState({
    numero_facture: '',
    fournisseur: 0,
    date_facture: new Date().toISOString().split('T')[0],
    date_echeance: '',
    mode_paiement: 'credit' as const,
    montant_paye: 0,
    notes: '',
  })
  
  // États pour le formulaire fournisseur
  const [fournisseurData, setFournisseurData] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    ville: '',
    pays: 'Sénégal',
    numero_registre_commerce: '',
    numero_identification_fiscale: '',
    delai_paiement_jours: 30,
    remise_habituelle: 0,
    notes: ''
  })
  
  // États pour le formulaire produit
  const [produitData, setProduitData] = useState({
    nom: '',
    code_barre: '',
    categorie: '',
    description: '',
    prix_unitaire: 0,
    unite: 'comprimé',
    prescription_requise: false
  })
  
  const [lignes, setLignes] = useState<LigneFactureFournisseur[]>([{
    produit: 0,
    quantite: 0,
    prix_unitaire_ht: 0,
    taux_tva: 18,
    remise_ligne: 0,
    numero_lot: '',
    date_peremption: ''
  }])
  
  // États pour les statistiques
  const [stats, setStats] = useState({
    total_factures: 0,
    montant_total: 0,
    montant_paye: 0,
    montant_restant: 0,
    factures_en_attente: 0,
    factures_validees: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [facturesData, fournisseursData, produitsData, statsData, pharmacieData] = await Promise.all([
        factureFournisseurService.getAll(),
        fournisseurService.getAll(),
        produitService.getAll(),
        factureFournisseurService.getStatistiques(),
        pharmacieService.getMyPharmacie()
      ])
      
      // Gérer la pagination Django REST Framework et les différents formats de réponse
      // factureFournisseurService et fournisseurService retournent {data: ...}
      // produitService retourne directement les données
      const facturesArray = facturesData.data 
        ? (Array.isArray(facturesData.data) ? facturesData.data : (facturesData.data?.results || []))
        : (Array.isArray(facturesData) ? facturesData : (facturesData?.results || []))
      
      const fournisseursArray = fournisseursData.data
        ? (Array.isArray(fournisseursData.data) ? fournisseursData.data : (fournisseursData.data?.results || []))
        : (Array.isArray(fournisseursData) ? fournisseursData : (fournisseursData?.results || []))
      
      const produitsArray = Array.isArray(produitsData) ? produitsData : (produitsData?.results || [])
      
      setFactures(facturesArray)
      setFournisseurs(fournisseursArray)
      setProduits(produitsArray)
      setStats(statsData.data || statsData || {
        total_factures: 0,
        montant_total: 0,
        montant_paye: 0,
        montant_restant: 0,
        factures_en_attente: 0,
        factures_validees: 0
      })
      setPharmacie(pharmacieData)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      alert('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleValider = async (id: number) => {
    if (!confirm('Voulez-vous valider cette facture et incrémenter le stock ?')) return
    
    try {
      await factureFournisseurService.valider(id)
      loadData()
      alert('Facture validée et stock incrémenté avec succès !')
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error)
      alert(error.response?.data?.error || 'Erreur lors de la validation de la facture')
    }
  }

  const handleAnnuler = async (id: number) => {
    if (!confirm('Voulez-vous annuler cette facture ?')) return
    
    try {
      await factureFournisseurService.annuler(id)
      loadData()
      alert('Facture annulée avec succès')
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation:', error)
      alert(error.response?.data?.error || 'Erreur lors de l\'annulation de la facture')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pharmacie) {
      alert('Pharmacie non trouvée')
      return
    }
    
    // Validation
    if (!formData.numero_facture || !formData.fournisseur) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    if (lignes.length === 0 || lignes.some(l => !l.produit || l.quantite <= 0)) {
      alert('Veuillez ajouter au moins une ligne de produit valide')
      return
    }
    
    // Calculer les montants
    let montant_ht = 0
    let montant_tva = 0
    let montant_remise = 0
    
    lignes.forEach(ligne => {
      const ht = (ligne.quantite * ligne.prix_unitaire_ht) - ligne.remise_ligne
      const tva = ht * (ligne.taux_tva / 100)
      montant_ht += ht
      montant_tva += tva
      montant_remise += ligne.remise_ligne
    })
    
    const montant_total = montant_ht + montant_tva
    
    try {
      await factureFournisseurService.create({
        ...formData,
        pharmacie: pharmacie.id,
        montant_ht,
        montant_tva,
        montant_remise,
        montant_total,
        lignes
      })
      
      alert('Facture créée avec succès !')
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Erreur lors de la création:', error)
      alert(error.response?.data?.error || 'Erreur lors de la création de la facture')
    }
  }

  const resetForm = () => {
    setFormData({
      numero_facture: '',
      fournisseur: 0,
      date_facture: new Date().toISOString().split('T')[0],
      date_echeance: '',
      mode_paiement: 'credit',
      montant_paye: 0,
      notes: '',
    })
    setLignes([{
      produit: 0,
      quantite: 0,
      prix_unitaire_ht: 0,
      taux_tva: 18,
      remise_ligne: 0,
      numero_lot: '',
      date_peremption: ''
    }])
  }

  const addLigne = () => {
    setLignes([...lignes, {
      produit: 0,
      quantite: 0,
      prix_unitaire_ht: 0,
      taux_tva: 18,
      remise_ligne: 0,
      numero_lot: '',
      date_peremption: ''
    }])
  }

  const removeLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index))
  }

  const updateLigne = (index: number, field: keyof LigneFactureFournisseur, value: any) => {
    const newLignes = [...lignes]
    newLignes[index] = { ...newLignes[index], [field]: value }
    setLignes(newLignes)
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'validee':
        return <Badge className="bg-green-500">Validée</Badge>
      case 'en_attente':
        return <Badge className="bg-yellow-500">En attente</Badge>
      case 'annulee':
        return <Badge className="bg-red-500">Annulée</Badge>
      default:
        return <Badge>{statut}</Badge>
    }
  }

  const viewDetails = (facture: FactureFournisseur) => {
    setSelectedFacture(facture)
    setShowDetailModal(true)
  }

  const handleCreateFournisseur = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fournisseurData.nom || !fournisseurData.telephone || !fournisseurData.adresse) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    try {
      const response = await fournisseurService.create(fournisseurData)
      const newFournisseur = response.data || response
      setFournisseurs([...fournisseurs, newFournisseur])
      setFormData({...formData, fournisseur: newFournisseur.id})
      setShowFournisseurModal(false)
      alert('Fournisseur créé avec succès !')
      
      // Réinitialiser le formulaire
      setFournisseurData({
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
        ville: '',
        pays: 'Sénégal',
        numero_registre_commerce: '',
        numero_identification_fiscale: '',
        delai_paiement_jours: 30,
        remise_habituelle: 0,
        notes: ''
      })
    } catch (error: any) {
      console.error('Erreur lors de la création du fournisseur:', error)
      alert(error.response?.data?.error || 'Erreur lors de la création du fournisseur')
    }
  }

  const handleCreateProduit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!produitData.nom || !produitData.prix_unitaire) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    try {
      const newProduit = await produitService.create(produitData)
      setProduits([...produits, newProduit])
      setShowProduitModal(false)
      alert('Produit créé avec succès !')
      
      // Réinitialiser le formulaire
      setProduitData({
        nom: '',
        code_barre: '',
        categorie: '',
        description: '',
        prix_unitaire: 0,
        unite: 'comprimé',
        prescription_requise: false
      })
    } catch (error: any) {
      console.error('Erreur lors de la création du produit:', error)
      alert(error.response?.data?.error || 'Erreur lors de la création du produit')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Factures Fournisseurs</h1>
          <p className="text-sm sm:text-base text-gray-600">Gestion des factures et approvisionnements</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={loadData} variant="outline" className="flex items-center gap-2 flex-1 sm:flex-initial">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Plus className="h-4 w-4" />
            <span className="sm:inline">Nouvelle</span>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Factures</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.total_factures}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {formatCurrency(stats.montant_total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {stats.factures_en_attente}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Validées</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {stats.factures_validees}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des factures */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Factures</CardTitle>
          <CardDescription>
            {factures.length} facture(s) enregistrée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {factures.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              Aucune facture enregistrée
            </div>
          ) : (
            <>
              {/* Vue Desktop - Tableau */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">N° Facture</th>
                      <th className="text-left p-2">Fournisseur</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Montant</th>
                      <th className="text-center p-2">Statut</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factures.map((facture) => (
                      <tr key={facture.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{facture.numero_facture}</td>
                        <td className="p-2">{facture.fournisseur_nom}</td>
                        <td className="p-2">{formatDate(facture.date_facture)}</td>
                        <td className="p-2 text-right font-bold">
                          {formatCurrency(facture.montant_total)}
                        </td>
                        <td className="p-2 text-center">
                          {getStatutBadge(facture.statut)}
                        </td>
                        <td className="p-2">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewDetails(facture)}
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {facture.statut === 'en_attente' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleValider(facture.id)}
                                  title="Valider et incrémenter le stock"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleAnnuler(facture.id)}
                                  title="Annuler la facture"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vue Mobile - Cartes */}
              <div className="md:hidden space-y-4">
                {factures.map((facture) => (
                  <div key={facture.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
                    {/* En-tête de la carte */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-lg">{facture.numero_facture}</div>
                        <div className="text-sm text-gray-600">{facture.fournisseur_nom}</div>
                      </div>
                      {getStatutBadge(facture.statut)}
                    </div>

                    {/* Informations */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(facture.date_facture)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(facture.montant_total)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDetails(facture)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      
                      {facture.statut === 'en_attente' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-1"
                            onClick={() => handleValider(facture.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAnnuler(facture.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nouvelle Facture Fournisseur</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_facture">Numéro de facture *</Label>
                  <Input
                    id="numero_facture"
                    value={formData.numero_facture}
                    onChange={(e) => setFormData({...formData, numero_facture: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="fournisseur">Fournisseur *</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="link"
                      onClick={() => setShowFournisseurModal(true)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Nouveau fournisseur
                    </Button>
                  </div>
                  <select
                    id="fournisseur"
                    className="w-full border rounded-md p-2"
                    value={formData.fournisseur}
                    onChange={(e) => setFormData({...formData, fournisseur: Number(e.target.value)})}
                    required
                  >
                    <option value={0}>Sélectionner un fournisseur</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="date_facture">Date de facture *</Label>
                  <Input
                    id="date_facture"
                    type="date"
                    value={formData.date_facture}
                    onChange={(e) => setFormData({...formData, date_facture: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="date_echeance">Date d'échéance</Label>
                  <Input
                    id="date_echeance"
                    type="date"
                    value={formData.date_echeance}
                    onChange={(e) => setFormData({...formData, date_echeance: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="mode_paiement">Mode de paiement</Label>
                  <select
                    id="mode_paiement"
                    className="w-full border rounded-md p-2"
                    value={formData.mode_paiement}
                    onChange={(e) => setFormData({...formData, mode_paiement: e.target.value as any})}
                  >
                    <option value="credit">À crédit</option>
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="montant_paye">Montant payé</Label>
                  <Input
                    id="montant_paye"
                    type="number"
                    value={formData.montant_paye}
                    onChange={(e) => setFormData({...formData, montant_paye: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full border rounded-md p-2"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              
              {/* Lignes de produits */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Produits</h3>
                  <Button type="button" onClick={addLigne} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une ligne
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {lignes.map((ligne, index) => (
                    <div key={index} className="border p-4 rounded-md space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Ligne {index + 1}</span>
                        {lignes.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeLigne(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label>Produit *</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="link"
                              onClick={() => setShowProduitModal(true)}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Nouveau
                            </Button>
                          </div>
                          <select
                            className="w-full border rounded-md p-2"
                            value={ligne.produit}
                            onChange={(e) => updateLigne(index, 'produit', Number(e.target.value))}
                            required
                          >
                            <option value={0}>Sélectionner</option>
                            {produits.map(p => (
                              <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <Label>Quantité *</Label>
                          <Input
                            type="number"
                            value={ligne.quantite}
                            onChange={(e) => updateLigne(index, 'quantite', Number(e.target.value))}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>Prix unitaire HT *</Label>
                          <Input
                            type="number"
                            value={ligne.prix_unitaire_ht}
                            onChange={(e) => updateLigne(index, 'prix_unitaire_ht', Number(e.target.value))}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>TVA (%)</Label>
                          <Input
                            type="number"
                            value={ligne.taux_tva}
                            onChange={(e) => updateLigne(index, 'taux_tva', Number(e.target.value))}
                          />
                        </div>
                        
                        <div>
                          <Label>Remise</Label>
                          <Input
                            type="number"
                            value={ligne.remise_ligne}
                            onChange={(e) => updateLigne(index, 'remise_ligne', Number(e.target.value))}
                          />
                        </div>
                        
                        <div>
                          <Label>N° Lot</Label>
                          <Input
                            value={ligne.numero_lot}
                            onChange={(e) => updateLigne(index, 'numero_lot', e.target.value)}
                          />
                        </div>
                        
                        <div className="md:col-span-3">
                          <Label>Date de péremption</Label>
                          <Input
                            type="date"
                            value={ligne.date_peremption}
                            onChange={(e) => updateLigne(index, 'date_peremption', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Boutons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                  Annuler
                </Button>
                <Button type="submit">
                  Enregistrer la facture
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedFacture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Facture {selectedFacture.numero_facture}</h2>
                <p className="text-gray-600">{selectedFacture.fournisseur_nom}</p>
              </div>
              {getStatutBadge(selectedFacture.statut)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Date de facture</p>
                <p className="font-medium">{formatDate(selectedFacture.date_facture)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date d'échéance</p>
                <p className="font-medium">{formatDate(selectedFacture.date_echeance)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mode de paiement</p>
                <p className="font-medium capitalize">{selectedFacture.mode_paiement.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Enregistré par</p>
                <p className="font-medium">{selectedFacture.enregistre_par_nom || 'N/A'}</p>
              </div>
            </div>
            
            {/* Lignes de produits */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Produits</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">Produit</th>
                    <th className="text-right p-2">Qté</th>
                    <th className="text-right p-2">Prix HT</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFacture.lignes?.map((ligne, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{ligne.nom_produit || ligne.produit_nom}</td>
                      <td className="text-right p-2">{ligne.quantite}</td>
                      <td className="text-right p-2">{formatCurrency(ligne.prix_unitaire_ht)}</td>
                      <td className="text-right p-2">{formatCurrency(ligne.montant_ttc || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Totaux */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Montant HT</span>
                <span className="font-medium">{formatCurrency(selectedFacture.montant_ht)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA</span>
                <span className="font-medium">{formatCurrency(selectedFacture.montant_tva)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remise</span>
                <span className="font-medium text-red-600">-{formatCurrency(selectedFacture.montant_remise)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total TTC</span>
                <span className="text-green-600">{formatCurrency(selectedFacture.montant_total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant payé</span>
                <span className="font-medium">{formatCurrency(selectedFacture.montant_paye)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Reste à payer</span>
                <span className="text-orange-600">{formatCurrency(selectedFacture.montant_restant || 0)}</span>
              </div>
            </div>
            
            {selectedFacture.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Notes</p>
                <p>{selectedFacture.notes}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de fournisseur */}
      {showFournisseurModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nouveau Fournisseur</h2>
            
            <form onSubmit={handleCreateFournisseur} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="f_nom">Nom *</Label>
                  <Input
                    id="f_nom"
                    value={fournisseurData.nom}
                    onChange={(e) => setFournisseurData({...fournisseurData, nom: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="f_telephone">Téléphone *</Label>
                  <Input
                    id="f_telephone"
                    value={fournisseurData.telephone}
                    onChange={(e) => setFournisseurData({...fournisseurData, telephone: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="f_email">Email</Label>
                  <Input
                    id="f_email"
                    type="email"
                    value={fournisseurData.email}
                    onChange={(e) => setFournisseurData({...fournisseurData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="f_ville">Ville</Label>
                  <Input
                    id="f_ville"
                    value={fournisseurData.ville}
                    onChange={(e) => setFournisseurData({...fournisseurData, ville: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="f_adresse">Adresse *</Label>
                <Input
                  id="f_adresse"
                  value={fournisseurData.adresse}
                  onChange={(e) => setFournisseurData({...fournisseurData, adresse: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="f_rc">N° Registre Commerce</Label>
                  <Input
                    id="f_rc"
                    value={fournisseurData.numero_registre_commerce}
                    onChange={(e) => setFournisseurData({...fournisseurData, numero_registre_commerce: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="f_nif">NIF</Label>
                  <Input
                    id="f_nif"
                    value={fournisseurData.numero_identification_fiscale}
                    onChange={(e) => setFournisseurData({...fournisseurData, numero_identification_fiscale: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="f_delai">Délai de paiement (jours)</Label>
                  <Input
                    id="f_delai"
                    type="number"
                    value={fournisseurData.delai_paiement_jours}
                    onChange={(e) => setFournisseurData({...fournisseurData, delai_paiement_jours: Number(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="f_remise">Remise habituelle (%)</Label>
                  <Input
                    id="f_remise"
                    type="number"
                    value={fournisseurData.remise_habituelle}
                    onChange={(e) => setFournisseurData({...fournisseurData, remise_habituelle: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="f_notes">Notes</Label>
                <textarea
                  id="f_notes"
                  className="w-full border rounded-md p-2"
                  rows={2}
                  value={fournisseurData.notes}
                  onChange={(e) => setFournisseurData({...fournisseurData, notes: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowFournisseurModal(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Créer le fournisseur
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de création de produit */}
      {showProduitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nouveau Produit</h2>
            
            <form onSubmit={handleCreateProduit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="p_nom">Nom du produit *</Label>
                  <Input
                    id="p_nom"
                    value={produitData.nom}
                    onChange={(e) => setProduitData({...produitData, nom: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="p_code">Code-barres</Label>
                  <Input
                    id="p_code"
                    value={produitData.code_barre}
                    onChange={(e) => setProduitData({...produitData, code_barre: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="p_categorie">Catégorie</Label>
                  <Input
                    id="p_categorie"
                    value={produitData.categorie}
                    onChange={(e) => setProduitData({...produitData, categorie: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="p_prix">Prix unitaire *</Label>
                  <Input
                    id="p_prix"
                    type="number"
                    value={produitData.prix_unitaire}
                    onChange={(e) => setProduitData({...produitData, prix_unitaire: Number(e.target.value)})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="p_unite">Unité</Label>
                  <select
                    id="p_unite"
                    className="w-full border rounded-md p-2"
                    value={produitData.unite}
                    onChange={(e) => setProduitData({...produitData, unite: e.target.value})}
                  >
                    <option value="comprimé">Comprimé</option>
                    <option value="gélule">Gélule</option>
                    <option value="flacon">Flacon</option>
                    <option value="tube">Tube</option>
                    <option value="boîte">Boîte</option>
                    <option value="sachet">Sachet</option>
                    <option value="ampoule">Ampoule</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    id="p_prescription"
                    type="checkbox"
                    checked={produitData.prescription_requise}
                    onChange={(e) => setProduitData({...produitData, prescription_requise: e.target.checked})}
                  />
                  <Label htmlFor="p_prescription">Prescription requise</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="p_description">Description</Label>
                <textarea
                  id="p_description"
                  className="w-full border rounded-md p-2"
                  rows={3}
                  value={produitData.description}
                  onChange={(e) => setProduitData({...produitData, description: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowProduitModal(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Créer le produit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
