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
import { AlertTriangle, Trash2 } from 'lucide-react'
import { type StockProduit } from '../services/api'

interface DeleteConfirmModalProps {
  stock: StockProduit | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeleteConfirmModal = ({ 
  stock, 
  isOpen, 
  onClose, 
  onConfirm 
}: DeleteConfirmModalProps) => {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!stock) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md h-auto max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-red-600 text-lg sm:text-xl">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Confirmer la suppression</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Cette action est irréversible. Le produit sera définitivement supprimé de votre stock.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-red-900 mb-2 text-sm sm:text-base">Produit à supprimer :</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="text-gray-600 font-medium">Nom :</span>
                <span className="font-medium break-words">{stock.produit_nom}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="text-gray-600 font-medium">Quantité :</span>
                <span className="font-medium">{stock.quantite} unité(s)</span>
              </div>
              {stock.numero_lot && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-gray-600 font-medium">Lot :</span>
                  <span className="font-medium break-words">{stock.numero_lot}</span>
                </div>
              )}
            </div>
          </div>
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
              onClick={handleConfirm}
              disabled={loading}
              variant="destructive"
              className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">{loading ? 'Suppression...' : 'Supprimer définitivement'}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}