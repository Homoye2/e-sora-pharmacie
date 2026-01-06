import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog'
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Send,
  AlertCircle,
  Package,
  Clock
} from 'lucide-react'
import { type CommandePharmacie } from '../services/api'
import { formatCurrency, formatDateTime } from '../lib/utils'

interface CommandeActionModalProps {
  commande: CommandePharmacie | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (commandeId: number, action: 'confirmer' | 'refuser' | 'preparer' | 'prete' | 'recuperee', message?: string) => Promise<void>
  action: 'confirmer' | 'refuser' | 'preparer' | 'prete' | 'recuperee' | null
}

export const CommandeActionModal = ({ 
  commande, 
  isOpen, 
  onClose, 
  onConfirm, 
  action 
}: CommandeActionModalProps) => {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!commande || !action) return
    
    try {
      setLoading(true)
      await onConfirm(commande.id, action, message)
      setMessage('')
      onClose()
    } catch (error) {
      console.error('Erreur lors de l\'action:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionConfig = () => {
    switch (action) {
      case 'confirmer':
        return {
          title: 'Confirmer la commande',
          description: 'Confirmez cette commande et envoyez un message au patient',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          buttonText: 'Confirmer la commande',
          buttonClass: 'bg-green-600 hover:bg-green-700',
          placeholder: 'Message de confirmation (optionnel)...',
          defaultMessage: 'Votre commande a été confirmée et est en cours de préparation.'
        }
      case 'refuser':
        return {
          title: 'Refuser la commande',
          description: 'Refusez cette commande et expliquez la raison au patient',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          buttonText: 'Refuser la commande',
          buttonClass: 'bg-red-600 hover:bg-red-700',
          placeholder: 'Raison du refus (obligatoire)...',
          defaultMessage: 'Nous ne pouvons pas traiter votre commande pour le moment.'
        }
      case 'preparer':
        return {
          title: 'Marquer comme préparée',
          description: 'Marquez cette commande comme préparée',
          icon: <Package className="h-5 w-5 text-yellow-600" />,
          buttonText: 'Marquer préparée',
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
          placeholder: 'Message pour le patient (optionnel)...',
          defaultMessage: 'Votre commande est maintenant préparée.'
        }
      case 'prete':
        return {
          title: 'Marquer comme prête',
          description: 'Marquez cette commande comme prête à récupérer',
          icon: <AlertCircle className="h-5 w-5 text-blue-600" />,
          buttonText: 'Marquer prête',
          buttonClass: 'bg-blue-600 hover:bg-blue-700',
          placeholder: 'Message pour le patient (optionnel)...',
          defaultMessage: 'Votre commande est prête ! Vous pouvez venir la récupérer.'
        }
      case 'recuperee':
        return {
          title: 'Marquer comme récupérée',
          description: 'Confirmez que cette commande a été récupérée par le patient',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          buttonText: 'Marquer récupérée',
          buttonClass: 'bg-green-600 hover:bg-green-700',
          placeholder: 'Message de remerciement (optionnel)...',
          defaultMessage: 'Merci pour votre confiance ! Votre commande a été récupérée avec succès.'
        }
      default:
        return {
          title: '',
          description: '',
          icon: null,
          buttonText: '',
          buttonClass: '',
          placeholder: '',
          defaultMessage: ''
        }
    }
  }

  const config = getActionConfig()

  if (!commande || !action) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] h-auto max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {config.icon}
            <span className="truncate">{config.title}</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          {/* Informations de la commande */}
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Commande:</span>
                  <p className="truncate">#{commande.numero_commande}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Patient:</span>
                  <p className="truncate">{commande.patient_prenom} {commande.patient_nom}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Montant:</span>
                  <p className="font-semibold">{formatCurrency(commande.montant_total)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <p className="text-xs sm:text-sm">{formatDateTime(commande.date_commande)}</p>
                </div>
              </div>
            </div>

            {/* Message au patient */}
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2 text-sm sm:text-base">
                <MessageSquare className="h-4 w-4" />
                Message au patient
                {action === 'refuser' && <span className="text-red-500">*</span>}
              </Label>
              <textarea
                id="message"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px] sm:min-h-[100px] resize-none text-sm sm:text-base"
                placeholder={config.placeholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              
              {/* Bouton pour message par défaut */}
              {config.defaultMessage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(config.defaultMessage)}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  Utiliser le message par défaut
                </Button>
              )}
            </div>

            {/* Validation pour refus */}
            {action === 'refuser' && !message.trim() && (
              <div className="flex items-start gap-2 text-red-600 text-xs sm:text-sm p-2 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Un message expliquant la raison du refus est obligatoire</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="w-full sm:w-auto order-last sm:order-first"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || (action === 'refuser' && !message.trim())}
              className={`${config.buttonClass} w-full sm:w-auto text-sm`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                  <span className="truncate">Traitement...</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="truncate">{config.buttonText}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}