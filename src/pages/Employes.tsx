import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { 
  Users, 
  Plus, 
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Key,
  Search,
  TrendingUp,
  Shield,
  Package,
  ShoppingCart,
  Eye,
  Settings
} from 'lucide-react'
import { 
  employesService,
  pharmacieService,
  type EmployePharmacie,
  type EmployePharmacieCreate,
  type Pharmacie,
  type StatistiquesEmployes
} from '../services/api'
import { formatDate } from '../lib/utils'

export const Employes = () => {
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [employes, setEmployes] = useState<EmployePharmacie[]>([])
  const [statistiques, setStatistiques] = useState<StatistiquesEmployes | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // États pour les modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [selectedEmploye, setSelectedEmploye] = useState<EmployePharmacie | null>(null)
  
  // États pour les formulaires
  const [createForm, setCreateForm] = useState<EmployePharmacieCreate>({
    nom: '',
    email: '',
    password: '',
    pharmacie: 0,
    poste: 'Employé',
    date_embauche: new Date().toISOString().split('T')[0],
    salaire: undefined,
    peut_vendre: true,
    peut_gerer_stock: false,
    peut_voir_commandes: true,
    peut_traiter_commandes: false,
    peut_annuler_vente: false,
    peut_enregistrer_facture: false,
    notes: ''
  })
  
  const [editForm, setEditForm] = useState<Partial<EmployePharmacie>>({})
  const [newPassword, setNewPassword] = useState('')

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
        // Charger les données en parallèle
        const [employesResponse, statsResponse] = await Promise.all([
          employesService.getMesEmployes(),
          employesService.getStatistiques()
        ])
        
        setEmployes(employesResponse)
        setStatistiques(statsResponse)
        
        // Mettre à jour le formulaire de création avec l'ID de la pharmacie
        setCreateForm(prev => ({ ...prev, pharmacie: pharmacieData.id }))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEmploye = async () => {
    try {
      setLoading(true)
      await employesService.create(createForm)
      
      // Réinitialiser le formulaire
      setCreateForm({
        nom: '',
        email: '',
        password: '',
        pharmacie: pharmacie?.id || 0,
        poste: 'Employé',
        date_embauche: new Date().toISOString().split('T')[0],
        salaire: undefined,
        peut_vendre: true,
        peut_gerer_stock: false,
        peut_voir_commandes: true,
        peut_traiter_commandes: false,
        peut_annuler_vente: false,
        peut_enregistrer_facture: false,
        notes: ''
      })
      
      setIsCreateModalOpen(false)
      await loadData()
      
      alert('Employé créé avec succès!')
    } catch (error) {
      console.error('Erreur lors de la création de l\'employé:', error)
      alert('Erreur lors de la création de l\'employé')
    } finally {
      setLoading(false)
    }
  }

  const handleEditEmploye = async () => {
    if (!selectedEmploye) return
    
    try {
      setLoading(true)
      await employesService.update(selectedEmploye.id, editForm)
      
      setIsEditModalOpen(false)
      setSelectedEmploye(null)
      setEditForm({})
      await loadData()
      
      alert('Employé modifié avec succès!')
    } catch (error) {
      console.error('Erreur lors de la modification de l\'employé:', error)
      alert('Erreur lors de la modification de l\'employé')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmploye = async () => {
    if (!selectedEmploye) return
    
    try {
      setLoading(true)
      await employesService.delete(selectedEmploye.id)
      
      setIsDeleteModalOpen(false)
      setSelectedEmploye(null)
      await loadData()
      
      alert('Employé supprimé avec succès!')
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'employé:', error)
      alert('Erreur lors de la suppression de l\'employé')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (employe: EmployePharmacie) => {
    try {
      setLoading(true)
      
      if (employe.actif) {
        await employesService.desactiver(employe.id)
      } else {
        await employesService.activer(employe.id)
      }
      
      await loadData()
      
      alert(`Employé ${employe.actif ? 'désactivé' : 'activé'} avec succès!`)
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
      alert('Erreur lors du changement de statut')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!selectedEmploye || !newPassword) return
    
    try {
      setLoading(true)
      await employesService.changerMotDePasse(selectedEmploye.id, newPassword)
      
      setIsPasswordModalOpen(false)
      setSelectedEmploye(null)
      setNewPassword('')
      
      alert('Mot de passe changé avec succès!')
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
      alert('Erreur lors du changement de mot de passe')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (employe: EmployePharmacie) => {
    setSelectedEmploye(employe)
    setEditForm({
      user_nom: employe.user_nom,
      user_email: employe.user_email,
      poste: employe.poste,
      date_embauche: employe.date_embauche,
      salaire: employe.salaire,
      peut_vendre: employe.peut_vendre,
      peut_gerer_stock: employe.peut_gerer_stock,
      peut_voir_commandes: employe.peut_voir_commandes,
      peut_traiter_commandes: employe.peut_traiter_commandes,
      peut_annuler_vente: employe.peut_annuler_vente,
      peut_enregistrer_facture: employe.peut_enregistrer_facture,
      notes: employe.notes
    })
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (employe: EmployePharmacie) => {
    setSelectedEmploye(employe)
    setIsDeleteModalOpen(true)
  }

  const openPasswordModal = (employe: EmployePharmacie) => {
    setSelectedEmploye(employe)
    setIsPasswordModalOpen(true)
  }

  const filteredEmployes = employes.filter(employe =>
    employe.user_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employe.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employe.poste.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPermissionIcon = (permission: boolean) => {
    return permission ? (
      <UserCheck className="h-4 w-4 text-green-600" />
    ) : (
      <UserX className="h-4 w-4 text-gray-400" />
    )
  }

  if (loading && !pharmacie) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Employés</h1>
          <p className="text-gray-600">
            Gérez les employés de votre pharmacie {pharmacie?.nom}
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Employé
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouvel employé</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel employé à votre pharmacie
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nom complet</Label>
                <Input
                  value={createForm.nom}
                  onChange={(e) => setCreateForm({...createForm, nom: e.target.value})}
                  placeholder="Nom de l'employé"
                />
              </div>
              
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  placeholder="email@exemple.com"
                />
              </div>
              
              <div>
                <Label>Mot de passe</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  placeholder="Mot de passe"
                />
              </div>
              
              <div>
                <Label>Poste</Label>
                <Select
                  value={createForm.poste}
                  onValueChange={(value) => setCreateForm({...createForm, poste: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employesService.getPostesOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Date d'embauche</Label>
                <Input
                  type="date"
                  value={createForm.date_embauche}
                  onChange={(e) => setCreateForm({...createForm, date_embauche: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Salaire (optionnel)</Label>
                <Input
                  type="number"
                  value={createForm.salaire || ''}
                  onChange={(e) => setCreateForm({...createForm, salaire: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="Salaire en F CFA"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.peut_vendre}
                    onChange={(e) => setCreateForm({...createForm, peut_vendre: e.target.checked})}
                  />
                  <span className="text-sm">Peut effectuer des ventes</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.peut_gerer_stock}
                    onChange={(e) => setCreateForm({...createForm, peut_gerer_stock: e.target.checked})}
                  />
                  <span className="text-sm">Peut gérer le stock</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.peut_voir_commandes}
                    onChange={(e) => setCreateForm({...createForm, peut_voir_commandes: e.target.checked})}
                  />
                  <span className="text-sm">Peut voir les commandes</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.peut_traiter_commandes}
                    onChange={(e) => setCreateForm({...createForm, peut_traiter_commandes: e.target.checked})}
                  />
                  <span className="text-sm">Peut traiter les commandes</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.peut_annuler_vente}
                    onChange={(e) => setCreateForm({...createForm, peut_annuler_vente: e.target.checked})}
                  />
                  <span className="text-sm">Peut annuler une vente</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createForm.peut_enregistrer_facture}
                    onChange={(e) => setCreateForm({...createForm, peut_enregistrer_facture: e.target.checked})}
                  />
                  <span className="text-sm">Peut enregistrer des factures</span>
                </label>
              </div>
            </div>
            
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                placeholder="Notes sur l'employé..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateEmploye} disabled={loading}>
                {loading ? 'Création...' : 'Créer l\'employé'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      {statistiques && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistiques.total_employes}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistiques.employes_actifs}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peuvent Vendre</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statistiques.permissions.peuvent_vendre}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peuvent Gérer Stock</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistiques.permissions.peuvent_gerer_stock}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Employés</CardTitle>
          <CardDescription>
            Gérez vos employés et leurs permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Date d'embauche</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'Aucun employé trouvé' : 'Aucun employé enregistré'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployes.map((employe) => (
                    <TableRow key={employe.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employe.user_nom}</div>
                          <div className="text-sm text-gray-500">{employe.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employe.poste}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(employe.date_embauche)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <div title="Peut vendre">
                            {getPermissionIcon(employe.peut_vendre)}
                          </div>
                          <div title="Peut gérer stock">
                            {getPermissionIcon(employe.peut_gerer_stock)}
                          </div>
                          <div title="Peut voir commandes">
                            {getPermissionIcon(employe.peut_voir_commandes)}
                          </div>
                          <div title="Peut traiter commandes">
                            {getPermissionIcon(employe.peut_traiter_commandes)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={employe.actif ? 'default' : 'secondary'}>
                          {employe.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(employe)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(employe)}
                            className={employe.actif ? 'text-red-600' : 'text-green-600'}
                          >
                            {employe.actif ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPasswordModal(employe)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(employe)}
                            className="text-red-600"
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

      {/* Modal de modification */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'employé</DialogTitle>
            <DialogDescription>
              Modifiez les informations de {selectedEmploye?.user_nom}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nom complet</Label>
              <Input
                value={editForm.user_nom || ''}
                onChange={(e) => setEditForm({...editForm, user_nom: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.user_email || ''}
                onChange={(e) => setEditForm({...editForm, user_email: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Poste</Label>
              <Select
                value={editForm.poste || ''}
                onValueChange={(value) => setEditForm({...editForm, poste: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employesService.getPostesOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Date d'embauche</Label>
              <Input
                type="date"
                value={editForm.date_embauche || ''}
                onChange={(e) => setEditForm({...editForm, date_embauche: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label>Salaire</Label>
              <Input
                type="number"
                value={editForm.salaire || ''}
                onChange={(e) => setEditForm({...editForm, salaire: e.target.value ? parseFloat(e.target.value) : undefined})}
                placeholder="Salaire en F CFA"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editForm.peut_vendre || false}
                  onChange={(e) => setEditForm({...editForm, peut_vendre: e.target.checked})}
                />
                <span className="text-sm">Peut effectuer des ventes</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editForm.peut_gerer_stock || false}
                  onChange={(e) => setEditForm({...editForm, peut_gerer_stock: e.target.checked})}
                />
                <span className="text-sm">Peut gérer le stock</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editForm.peut_voir_commandes || false}
                  onChange={(e) => setEditForm({...editForm, peut_voir_commandes: e.target.checked})}
                />
                <span className="text-sm">Peut voir les commandes</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editForm.peut_traiter_commandes || false}
                  onChange={(e) => setEditForm({...editForm, peut_traiter_commandes: e.target.checked})}
                />
                <span className="text-sm">Peut traiter les commandes</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editForm.peut_annuler_vente || false}
                  onChange={(e) => setEditForm({...editForm, peut_annuler_vente: e.target.checked})}
                />
                <span className="text-sm">Peut annuler une vente</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editForm.peut_enregistrer_facture || false}
                  onChange={(e) => setEditForm({...editForm, peut_enregistrer_facture: e.target.checked})}
                />
                <span className="text-sm">Peut enregistrer des factures</span>
              </label>
            </div>
          </div>
          
          <div>
            <Label>Notes</Label>
            <Textarea
              value={editForm.notes || ''}
              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditEmploye} disabled={loading}>
              {loading ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'employé</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedEmploye?.user_nom} ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteEmploye} disabled={loading}>
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de changement de mot de passe */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Définir un nouveau mot de passe pour {selectedEmploye?.user_nom}
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <Label>Nouveau mot de passe</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleChangePassword} disabled={loading || !newPassword}>
              {loading ? 'Changement...' : 'Changer le mot de passe'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}