import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { StockModal } from '../components/StockModal'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import { ProduitModal } from '../components/ProduitModal'
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Plus,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { 
  stockService, 
  pharmacieService,
  type StockProduit,
  type Pharmacie
} from '../services/api'
import { formatCurrency, formatDate } from '../lib/utils'

export const Stocks = () => {
  const [stocks, setStocks] = useState<StockProduit[]>([])
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'rupture' | 'seuil' | 'expiration'>('all')
  
  // États pour les modales
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isProduitModalOpen, setIsProduitModalOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<StockProduit | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger la pharmacie
      const pharmacieData = await pharmacieService.getMyPharmacie()
      setPharmacie(pharmacieData)
      
      if (pharmacieData) {
        // Charger les stocks
        const stocksResponse = await stockService.getAll(pharmacieData.id)
        const stocksData = Array.isArray(stocksResponse) ? stocksResponse : stocksResponse.results || []
        setStocks(stocksData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  // Gestionnaires pour les modales
  const handleAddStock = () => {
    setSelectedStock(null)
    setModalMode('create')
    setIsStockModalOpen(true)
  }

  const handleEditStock = (stock: StockProduit) => {
    setSelectedStock(stock)
    setModalMode('edit')
    setIsStockModalOpen(true)
  }

  const handleDeleteStock = (stock: StockProduit) => {
    setSelectedStock(stock)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedStock) {
      try {
        await stockService.delete(selectedStock.id)
        await loadData() // Recharger les données
        console.log('Produit supprimé avec succès') // Pour l'instant, on utilise console.log
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        throw error
      }
    }
  }

  const handleStockSaved = () => {
    loadData() // Recharger les données après ajout/modification
    // Afficher une notification de succès
    const message = modalMode === 'create' ? 'Produit ajouté avec succès' : 'Produit modifié avec succès'
    console.log(message) // Pour l'instant, on utilise console.log
  }

  const handleNewProduit = () => {
    setIsProduitModalOpen(true)
  }

  const handleProduitCreated = () => {
    // Pas besoin de recharger les données ici car le nouveau produit sera disponible
    // dans le modal de stock quand l'utilisateur l'ouvrira
    console.log('Nouveau produit créé avec succès')
  }

  const filteredStocks = stocks.filter(stock => {
    // Filtre par recherche - utiliser produit_nom au lieu de stock.produit.nom
    const productName = stock.produit_nom || ''
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (stock.numero_lot || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtre par type
    let matchesFilter = true
    switch (filterType) {
      case 'rupture':
        matchesFilter = stock.est_en_rupture
        break
      case 'seuil':
        matchesFilter = stock.est_sous_seuil && !stock.est_en_rupture
        break
      case 'expiration':
        matchesFilter = stock.est_proche_expiration
        break
      default:
        matchesFilter = true
    }
    
    return matchesSearch && matchesFilter
  })

  const getStockBadge = (stock: StockProduit) => {
    if (stock.est_en_rupture) {
      return <Badge variant="destructive">Rupture</Badge>
    }
    if (stock.est_sous_seuil) {
      return <Badge variant="secondary">Seuil bas</Badge>
    }
    if (stock.est_proche_expiration) {
      return <Badge variant="secondary">Expire bientôt</Badge>
    }
    return <Badge variant="default">Normal</Badge>
  }

  const getStockStatus = (stock: StockProduit) => {
    if (stock.est_en_rupture) return 'danger'
    if (stock.est_sous_seuil || stock.est_proche_expiration) return 'warning'
    return 'success'
  }

  const stats = {
    total: stocks.length,
    rupture: stocks.filter(s => s.est_en_rupture).length,
    seuil: stocks.filter(s => s.est_sous_seuil && !s.est_en_rupture).length,
    expiration: stocks.filter(s => s.est_proche_expiration).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Stocks</h1>
          <p className="text-gray-600">
            Gérez l'inventaire de votre pharmacie {pharmacie?.nom}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddStock}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter au stock
          </Button>
          <Button variant="outline" onClick={handleNewProduit} className="border-green-200 text-green-600 hover:bg-green-50">
            <Package className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Rupture</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rupture}</div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seuil Bas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.seuil}</div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expire Bientôt</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiration}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire</CardTitle>
          <CardDescription>
            Liste complète de vos produits en stock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un produit ou lot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={filterType === 'rupture' ? 'default' : 'outline'}
                onClick={() => setFilterType('rupture')}
                size="sm"
              >
                Rupture
              </Button>
              <Button
                variant={filterType === 'seuil' ? 'default' : 'outline'}
                onClick={() => setFilterType('seuil')}
                size="sm"
              >
                Seuil bas
              </Button>
              <Button
                variant={filterType === 'expiration' ? 'default' : 'outline'}
                onClick={() => setFilterType('expiration')}
                size="sm"
              >
                Expire bientôt
              </Button>
            </div>
          </div>

          {/* Tableau des stocks */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Seuil</TableHead>
                  <TableHead>Prix de vente</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm || filterType !== 'all' 
                        ? 'Aucun produit trouvé avec ces critères'
                        : 'Aucun produit en stock'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStocks.map((stock) => (
                    <TableRow 
                      key={stock.id}
                      className={
                        getStockStatus(stock) === 'danger' ? 'bg-red-50' :
                        getStockStatus(stock) === 'warning' ? 'bg-yellow-50' :
                        ''
                      }
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{stock.produit_nom || 'Produit inconnu'}</p>
                          <p className="text-sm text-gray-500">Catégorie N/A</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {stock.numero_lot || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          stock.est_en_rupture ? 'text-red-600' :
                          stock.est_sous_seuil ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {stock.quantite}
                        </span>
                        <span className="text-gray-500 ml-1">unité</span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {stock.seuil_alerte} unité
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(parseFloat(stock.prix_vente.toString()))}
                      </TableCell>
                      <TableCell>
                        {stock.date_expiration ? (
                          <span className={stock.est_proche_expiration ? 'text-orange-600' : ''}>
                            {formatDate(stock.date_expiration)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStockBadge(stock)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditStock(stock)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteStock(stock)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Modales */}
      {pharmacie && (
        <StockModal
          stock={selectedStock}
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          onSave={handleStockSaved}
          pharmacieId={pharmacie.id}
          mode={modalMode}
        />
      )}

      <DeleteConfirmModal
        stock={selectedStock}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal pour créer un nouveau produit */}
      <ProduitModal
        isOpen={isProduitModalOpen}
        onClose={() => setIsProduitModalOpen(false)}
        onSave={handleProduitCreated}
      />
    </div>
  )
}