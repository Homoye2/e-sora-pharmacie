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
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  Package, 
  Download,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { 
  type CommandePharmacie
} from '../services/api'
import { formatCurrency, formatDateTime } from '../lib/utils'

interface CommandeDetailsProps {
  commande: CommandePharmacie | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatut: (commandeId: number, statut: string) => void
}

export const CommandeDetails = ({ 
  commande, 
  isOpen, 
  onClose, 
  onUpdateStatut 
}: CommandeDetailsProps) => {
  const [loading, setLoading] = useState(false)

  if (!commande) return null

  const getStatutBadge = (statut: string) => {
    const config = {
      'en_attente': { label: 'En attente', color: 'bg-gray-100 text-gray-800' },
      'confirmee': { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
      'preparee': { label: 'Préparée', color: 'bg-yellow-100 text-yellow-800' },
      'prete': { label: 'Prête', color: 'bg-green-100 text-green-800' },
      'recuperee': { label: 'Récupérée', color: 'bg-green-100 text-green-800' },
      'annulee': { label: 'Annulée', color: 'bg-red-100 text-red-800' }
    }
    
    const { label, color } = config[statut as keyof typeof config] || { label: statut, color: 'bg-gray-100 text-gray-800' }
    return <Badge className={color}>{label}</Badge>
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
      'en_attente': 'Confirmer la commande',
      'confirmee': 'Marquer comme préparée',
      'preparee': 'Marquer comme prête',
      'prete': 'Marquer comme récupérée'
    }
    return labels[currentStatut as keyof typeof labels]
  }

  const canAdvanceStatut = (statut: string) => {
    return ['en_attente', 'confirmee', 'preparee', 'prete'].includes(statut)
  }

  const handleUpdateStatut = async (newStatut: string) => {
    setLoading(true)
    try {
      onUpdateStatut(commande.id, newStatut)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPrescription = () => {
    if (commande.prescription_image) {
      window.open(commande.prescription_image, '_blank')
    }
  }

  const handleDownloadPrescription = () => {
    if (commande.prescription_image) {
      const link = document.createElement('a')
      link.href = commande.prescription_image
      link.download = `prescription_${commande.numero_commande}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Commande #{commande.numero_commande}</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Détails complets de la commande et gestion du statut
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Informations de la commande */}
            <div className="space-y-3 sm:space-y-4">
              {/* Statut et dates */}
              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Statut et Suivi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium">Statut actuel :</span>
                    {getStatutBadge(commande.statut)}
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-gray-600 font-medium">Commande passée :</span>
                      <span className="text-right">{formatDateTime(commande.date_commande)}</span>
                    </div>
                    
                    {commande.date_confirmation && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600 font-medium">Confirmée le :</span>
                        <span className="text-right">{formatDateTime(commande.date_confirmation)}</span>
                      </div>
                    )}
                    
                    {commande.date_preparation && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600 font-medium">Préparée le :</span>
                        <span className="text-right">{formatDateTime(commande.date_preparation)}</span>
                      </div>
                    )}
                    
                    {commande.date_prete && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600 font-medium">Prête le :</span>
                        <span className="text-right">{formatDateTime(commande.date_prete)}</span>
                      </div>
                    )}
                    
                    {commande.date_recuperation && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600 font-medium">Récupérée le :</span>
                        <span className="text-right">{formatDateTime(commande.date_recuperation)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Informations patient */}
              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informations Patient
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base truncate">
                      {commande.patient_prenom} {commande.patient_nom}
                    </span>
                  </div>
                  
                  {commande.patient_telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base">{commande.patient_telephone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm sm:text-base">ID Patient: {commande.patient}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {(commande.notes_patient || commande.notes_pharmacie) && (
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Notes et Commentaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    {commande.notes_patient && (
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes du patient :</p>
                        <p className="text-xs sm:text-sm bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200 break-words">
                          {commande.notes_patient}
                        </p>
                      </div>
                    )}
                    
                    {commande.notes_pharmacie && (
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes de la pharmacie :</p>
                        <p className="text-xs sm:text-sm bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200 break-words whitespace-pre-wrap">
                          {commande.notes_pharmacie}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Prescription et produits */}
            <div className="space-y-3 sm:space-y-4">
              {/* Prescription */}
              {commande.prescription_image && (
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Prescription Médicale
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span>Fichier de prescription joint</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewPrescription}
                          className="flex items-center gap-2 text-xs sm:text-sm"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadPrescription}
                          className="flex items-center gap-2 text-xs sm:text-sm"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          Télécharger
                        </Button>
                      </div>
                      
                      {/* Aperçu de l'image */}
                      <div className="mt-2 sm:mt-3">
                        <img
                          src={commande.prescription_image}
                          alt="Prescription"
                          className="w-full max-w-full sm:max-w-sm h-24 sm:h-32 object-cover rounded-lg border cursor-pointer"
                          onClick={handleViewPrescription}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Produits commandés */}
              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produits Commandés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {commande.lignes && commande.lignes.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {commande.lignes.map((ligne, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-gray-50 rounded-lg gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{ligne.produit.nom}</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Quantité: {ligne.quantite} • Prix unitaire: {formatCurrency(ligne.prix_unitaire)}
                            </p>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="font-medium text-sm sm:text-base">{formatCurrency(ligne.sous_total)}</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
                        <div className="flex justify-between items-center font-bold text-base sm:text-lg">
                          <span>Total :</span>
                          <span className="text-green-600">{formatCurrency(commande.montant_total)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      Aucun produit spécifique listé
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-last sm:order-first"
            >
              Fermer
            </Button>
            
            {canAdvanceStatut(commande.statut) && (
              <Button
                onClick={() => handleUpdateStatut(getNextStatut(commande.statut)!)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="truncate">{getNextStatutLabel(commande.statut)}</span>
              </Button>
            )}
            
            {commande.statut !== 'annulee' && commande.statut !== 'recuperee' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatut('annulee')}
                disabled={loading}
                className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto text-sm"
              >
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="truncate">Annuler</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}