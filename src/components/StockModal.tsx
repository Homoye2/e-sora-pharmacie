import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { ProduitModal } from './ProduitModal'
import { 
  Package, 
  Calendar,
  DollarSign,
  Hash,
  AlertTriangle,
  Plus
} from 'lucide-react'
import { 
  type StockProduit,
  type Produit,
  produitService,
  stockService
} from '../services/api'

interface StockModalProps {
  stock: StockProduit | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  pharmacieId: number
  mode: 'create' | 'edit'
}

export const StockModal = ({ 
  stock, 
  isOpen, 
  onClose, 
  onSave, 
  pharmacieId,
  mode 
}: StockModalProps) => {
  const [loading, setLoading] = useState(false)
  const [produits, setProduits] = useState<Produit[]>([])
  const [isProduitModalOpen, setIsProduitModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    produit: '',
    quantite: '',
    seuil_alerte: '',
    numero_lot: '',
    date_expiration: '',
    prix_vente: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      loadProduits()
      if (mode === 'edit' && stock) {
        setFormData({
          produit: stock.produit.toString(),
          quantite: stock.quantite.toString(),
          seuil_alerte: stock.seuil_alerte.toString(),
          numero_lot: stock.numero_lot || '',
          date_expiration: stock.date_expiration || '',
          prix_vente: stock.prix_vente.toString()
        })
      } else {
        resetForm()
      }
    }
  }, [isOpen, mode, stock])

  const loadProduits = async () => {
    try {
      const response = await produitService.getAll()
      const produitsData = Array.isArray(response) ? response : response.results || []
      setProduits(produitsData)
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      produit: '',
      quantite: '',
      seuil_alerte: '10',
      numero_lot: '',
      date_expiration: '',
      prix_vente: ''
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.produit) {
      newErrors.produit = 'Veuillez sélectionner un produit'
    }
    if (!formData.quantite || parseInt(formData.quantite) < 0) {
      newErrors.quantite = 'Veuillez saisir une quantité valide'
    }
    if (!formData.seuil_alerte || parseInt(formData.seuil_alerte) < 0) {
      newErrors.seuil_alerte = 'Veuillez saisir un seuil d\'alerte valide'
    }
    if (!formData.prix_vente || parseFloat(formData.prix_vente) <= 0) {
      newErrors.prix_vente = 'Veuillez saisir un prix de vente valide'
    }
    if (formData.date_expiration && new Date(formData.date_expiration) <= new Date()) {
      newErrors.date_expiration = 'La date d\'expiration doit être dans le futur'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const stockData = {
        pharmacie: pharmacieId,
        produit: parseInt(formData.produit),
        quantite: parseInt(formData.quantite),
        seuil_alerte: parseInt(formData.seuil_alerte),
        numero_lot: formData.numero_lot || undefined,
        date_expiration: formData.date_expiration || undefined,
        prix_vente: parseFloat(formData.prix_vente)
      }

      if (mode === 'create') {
        await stockService.create(stockData)
      } else if (mode === 'edit' && stock) {
        await stockService.update(stock.id, stockData)
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      if (error.response?.data) {
        const serverErrors: Record<string, string> = {}
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) {
            serverErrors[key] = error.response.data[key][0]
          } else {
            serverErrors[key] = error.response.data[key]
          }
        })
        setErrors(serverErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleNewProduit = () => {
    setIsProduitModalOpen(true)
  }

  const handleProduitCreated = (nouveauProduit: Produit) => {
    // Ajouter le nouveau produit à la liste
    setProduits(prev => [...prev, nouveauProduit])
    // Sélectionner automatiquement le nouveau produit
    setFormData(prev => ({ ...prev, produit: nouveauProduit.id.toString() }))
    // Pré-remplir le prix de vente avec le prix unitaire du produit
    if (nouveauProduit.prix_unitaire) {
      setFormData(prev => ({ ...prev, prix_vente: nouveauProduit.prix_unitaire.toString() }))
    }
  }

  const selectedProduit = produits.find(p => p.id.toString() === formData.produit)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">
              {mode === 'create' ? 'Ajouter un produit au stock' : 'Modifier le stock'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {mode === 'create' 
              ? 'Ajoutez un nouveau produit à votre inventaire'
              : 'Modifiez les informations du produit en stock'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Sélection du produit */}
              <div className="lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                  <Label htmlFor="produit" className="text-sm sm:text-base">Produit *</Label>
                  {mode === 'create' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNewProduit}
                      className="text-green-600 border-green-200 hover:bg-green-50 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Nouveau produit
                    </Button>
                  )}
                </div>
                <Select 
                  value={formData.produit} 
                  onValueChange={(value) => handleInputChange('produit', value)}
                  disabled={mode === 'edit'}
                >
                  <SelectTrigger className={`${errors.produit ? 'border-red-500' : ''} text-sm sm:text-base`}>
                    <SelectValue placeholder="Sélectionnez un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {produits.map((produit) => (
                      <SelectItem key={produit.id} value={produit.id.toString()}>
                        <div>
                          <div className="font-medium text-sm sm:text-base">{produit.nom}</div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {produit.categorie} • {produit.unite}
                            {produit.prescription_requise && (
                              <span className="ml-2 text-orange-600">⚠ Prescription requise</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.produit && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.produit}</p>
                )}
              </div>

              {/* Informations du produit sélectionné */}
              {selectedProduit && (
                <div className="lg:col-span-2 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Informations du produit</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-gray-600 font-medium">Catégorie:</span>
                      <span className="font-medium">{selectedProduit.categorie}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-gray-600 font-medium">Unité:</span>
                      <span className="font-medium">{selectedProduit.unite}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-gray-600 font-medium">Prix unitaire:</span>
                      <span className="font-medium">{selectedProduit.prix_unitaire} FCFA</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-gray-600 font-medium">Prescription:</span>
                      <span className={`font-medium ${selectedProduit.prescription_requise ? 'text-orange-600' : 'text-green-600'}`}>
                        {selectedProduit.prescription_requise ? 'Requise' : 'Non requise'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantité */}
              <div>
                <Label htmlFor="quantite" className="text-sm sm:text-base">Quantité en stock *</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="quantite"
                    type="number"
                    min="0"
                    value={formData.quantite}
                    onChange={(e) => handleInputChange('quantite', e.target.value)}
                    className={`pl-10 text-sm sm:text-base ${errors.quantite ? 'border-red-500' : ''}`}
                    placeholder="Ex: 100"
                  />
                </div>
                {errors.quantite && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.quantite}</p>
                )}
              </div>

              {/* Seuil d'alerte */}
              <div>
                <Label htmlFor="seuil_alerte" className="text-sm sm:text-base">Seuil d'alerte *</Label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="seuil_alerte"
                    type="number"
                    min="0"
                    value={formData.seuil_alerte}
                    onChange={(e) => handleInputChange('seuil_alerte', e.target.value)}
                    className={`pl-10 text-sm sm:text-base ${errors.seuil_alerte ? 'border-red-500' : ''}`}
                    placeholder="Ex: 10"
                  />
                </div>
                {errors.seuil_alerte && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.seuil_alerte}</p>
                )}
              </div>

              {/* Prix de vente */}
              <div>
                <Label htmlFor="prix_vente" className="text-sm sm:text-base">Prix de vente (FCFA) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="prix_vente"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prix_vente}
                    onChange={(e) => handleInputChange('prix_vente', e.target.value)}
                    className={`pl-10 text-sm sm:text-base ${errors.prix_vente ? 'border-red-500' : ''}`}
                    placeholder="Ex: 1500.00"
                  />
                </div>
                {errors.prix_vente && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.prix_vente}</p>
                )}
              </div>

              {/* Numéro de lot */}
              <div>
                <Label htmlFor="numero_lot" className="text-sm sm:text-base">Numéro de lot</Label>
                <Input
                  id="numero_lot"
                  value={formData.numero_lot}
                  onChange={(e) => handleInputChange('numero_lot', e.target.value)}
                  placeholder="Ex: LOT2024001"
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Date d'expiration */}
              <div className="lg:col-span-2">
                <Label htmlFor="date_expiration" className="text-sm sm:text-base">Date d'expiration</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date_expiration"
                    type="date"
                    value={formData.date_expiration}
                    onChange={(e) => handleInputChange('date_expiration', e.target.value)}
                    className={`pl-10 text-sm sm:text-base ${errors.date_expiration ? 'border-red-500' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {errors.date_expiration && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.date_expiration}</p>
                )}
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-last sm:order-first"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm"
              onClick={handleSubmit}
            >
              {loading ? 'Sauvegarde...' : (mode === 'create' ? 'Ajouter' : 'Modifier')}
            </Button>
          </div>
        </DialogFooter>

        {/* Modal pour créer un nouveau produit */}
        <ProduitModal
          isOpen={isProduitModalOpen}
          onClose={() => setIsProduitModalOpen(false)}
          onSave={handleProduitCreated}
        />
      </DialogContent>
    </Dialog>
  )
}