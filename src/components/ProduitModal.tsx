import { useState } from 'react'
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
import { 
  Package, 
  FileText,
  DollarSign,
  Tag,
  AlertTriangle
} from 'lucide-react'
import { 
  produitService,
  type Produit
} from '../services/api'

interface ProduitModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (produit: Produit) => void
}

const CATEGORIES = [
  'Médicaments',
  'Parapharmacie',
  'Cosmétiques',
  'Hygiène',
  'Matériel médical',
  'Compléments alimentaires',
  'Homéopathie',
  'Phytothérapie',
  'Contraception',
  'Autres'
]

const UNITES = [
  'Comprimé',
  'Gélule',
  'Flacon',
  'Tube',
  'Boîte',
  'Ampoule',
  'Sachet',
  'Pièce',
  'ml',
  'g',
  'kg',
  'Unité'
]

export const ProduitModal = ({ 
  isOpen, 
  onClose, 
  onSave
}: ProduitModalProps) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    categorie: '',
    unite: '',
    prix_unitaire: '',
    code_barre: '',
    prescription_requise: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      categorie: '',
      unite: '',
      prix_unitaire: '',
      code_barre: '',
      prescription_requise: false
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du produit est obligatoire'
    }
    if (!formData.categorie) {
      newErrors.categorie = 'Veuillez sélectionner une catégorie'
    }
    if (!formData.unite) {
      newErrors.unite = 'Veuillez sélectionner une unité'
    }
    if (!formData.prix_unitaire || parseFloat(formData.prix_unitaire) <= 0) {
      newErrors.prix_unitaire = 'Veuillez saisir un prix unitaire valide'
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
      const produitData = {
        nom: formData.nom.trim(),
        description: formData.description.trim(),
        categorie: formData.categorie,
        unite: formData.unite,
        prix_unitaire: parseFloat(formData.prix_unitaire),
        code_barre: formData.code_barre.trim() || undefined,
        prescription_requise: formData.prescription_requise,
        actif: true
      }

      const nouveauProduit = await produitService.create(produitData)
      onSave(nouveauProduit)
      resetForm()
      onClose()
    } catch (error: any) {
      console.error('Erreur lors de la création du produit:', error)
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Créer un nouveau produit</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Ajoutez un nouveau produit à votre catalogue pour pouvoir l'ajouter au stock
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Nom du produit */}
              <div className="lg:col-span-2">
                <Label htmlFor="nom" className="text-sm sm:text-base">Nom du produit *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    className={`pl-10 text-sm sm:text-base ${errors.nom ? 'border-red-500' : ''}`}
                    placeholder="Ex: Paracétamol 500mg"
                  />
                </div>
                {errors.nom && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.nom}</p>
                )}
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="flex min-h-[60px] sm:min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Description détaillée du produit, composition, posologie..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Catégorie */}
              <div>
                <Label htmlFor="categorie" className="text-sm sm:text-base">Catégorie *</Label>
                <Select 
                  value={formData.categorie} 
                  onValueChange={(value) => handleInputChange('categorie', value)}
                >
                  <SelectTrigger className={`${errors.categorie ? 'border-red-500' : ''} text-sm sm:text-base`}>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((categorie) => (
                      <SelectItem key={categorie} value={categorie}>
                        {categorie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categorie && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.categorie}</p>
                )}
              </div>

              {/* Unité */}
              <div>
                <Label htmlFor="unite" className="text-sm sm:text-base">Unité *</Label>
                <Select 
                  value={formData.unite} 
                  onValueChange={(value) => handleInputChange('unite', value)}
                >
                  <SelectTrigger className={`${errors.unite ? 'border-red-500' : ''} text-sm sm:text-base`}>
                    <SelectValue placeholder="Sélectionnez une unité" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITES.map((unite) => (
                      <SelectItem key={unite} value={unite}>
                        {unite}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unite && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.unite}</p>
                )}
              </div>

              {/* Prix unitaire */}
              <div>
                <Label htmlFor="prix_unitaire" className="text-sm sm:text-base">Prix unitaire (FCFA) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="prix_unitaire"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prix_unitaire}
                    onChange={(e) => handleInputChange('prix_unitaire', e.target.value)}
                    className={`pl-10 text-sm sm:text-base ${errors.prix_unitaire ? 'border-red-500' : ''}`}
                    placeholder="Ex: 500.00"
                  />
                </div>
                {errors.prix_unitaire && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.prix_unitaire}</p>
                )}
              </div>

              {/* Code-barres */}
              <div>
                <Label htmlFor="code_barre" className="text-sm sm:text-base">Code-barres</Label>
                <Input
                  id="code_barre"
                  value={formData.code_barre}
                  onChange={(e) => handleInputChange('code_barre', e.target.value)}
                  placeholder="Ex: 3401597832123"
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Prescription requise */}
              <div className="lg:col-span-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="prescription_requise"
                    checked={formData.prescription_requise}
                    onChange={(e) => handleInputChange('prescription_requise', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="prescription_requise" className="flex items-center gap-2 text-sm sm:text-base">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Prescription médicale requise
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Cochez cette case si le produit nécessite une ordonnance médicale
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu du produit */}
            {formData.nom && (
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2 text-sm sm:text-base">Aperçu du produit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-gray-600 font-medium">Nom:</span>
                    <span className="font-medium break-words">{formData.nom}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-gray-600 font-medium">Catégorie:</span>
                    <span className="font-medium">{formData.categorie || 'Non définie'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-gray-600 font-medium">Unité:</span>
                    <span className="font-medium">{formData.unite || 'Non définie'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-gray-600 font-medium">Prix:</span>
                    <span className="font-medium">
                      {formData.prix_unitaire ? `${formData.prix_unitaire} FCFA` : 'Non défini'}
                    </span>
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-gray-600 font-medium">Prescription:</span>
                    <span className={`font-medium ${formData.prescription_requise ? 'text-orange-600' : 'text-green-600'}`}>
                      {formData.prescription_requise ? 'Requise' : 'Non requise'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <DialogFooter className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
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
              {loading ? 'Création...' : 'Créer le produit'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}