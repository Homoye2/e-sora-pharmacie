import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { 
  Settings, 
  User, 
  Building, 
  Bell, 
  Shield, 
  Save,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Clock,
  Palette
} from 'lucide-react'
import { 
  pharmacieService, 
  authService,
  preferencesService,
  horaireUtils,
  securityService,
  type Pharmacie,
  type User as UserType,
  type SessionUtilisateur,
  type HistoriqueConnexion,
  type StatistiquesSecurite
} from '../services/api'
import { useToast } from '../components/ui/toast'

export const Parametres = () => {
  const { showToast, ToastContainer } = useToast()
  const [user, setUser] = useState<UserType | null>(null)
  const [pharmacie, setPharmacie] = useState<Pharmacie | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('pharmacie')
  const [showPassword, setShowPassword] = useState(false)

  // États pour les formulaires
  const [pharmacieForm, setPharmacieForm] = useState({
    nom: '',
    adresse: '',
    ville: '',
    telephone: '',
    email: '',
    description: '',
    latitude: '',
    longitude: '',
    horaires_ouverture: {
      lundi: '08:00-18:00',
      mardi: '08:00-18:00',
      mercredi: '08:00-18:00',
      jeudi: '08:00-18:00',
      vendredi: '08:00-18:00',
      samedi: '08:00-13:00',
      dimanche: 'Fermé'
    }
  })

  const [userForm, setUserForm] = useState({
    nom: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [notifications, setNotifications] = useState({
    stockAlerts: true,
    orderNotifications: true,
    emailNotifications: true,
    smsNotifications: false
  })

  // États pour la sécurité
  const [sessions, setSessions] = useState<SessionUtilisateur[]>([])
  const [historique, setHistorique] = useState<HistoriqueConnexion[]>([])
  const [statistiquesSecurite, setStatistiquesSecurite] = useState<StatistiquesSecurite | null>(null)
  const [loadingSecurity, setLoadingSecurity] = useState(false)
  
  // États pour la géolocalisation
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les données utilisateur
      const userData = authService.getCurrentUser()
      setUser(userData)
      
      if (userData) {
        setUserForm({
          nom: userData.nom,
          email: userData.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }

      // Charger les données de la pharmacie
      const pharmacieData = await pharmacieService.getMyPharmacie()
      if (pharmacieData) {
        setPharmacie(pharmacieData)
        
        // Horaires par défaut si pas définis dans la base
        const defaultHoraires = horaireUtils.getDefaultHoraires()
      
        setPharmacieForm({
          nom: pharmacieData.nom || '',
          adresse: pharmacieData.adresse || '',
          ville: pharmacieData.ville || '',
          telephone: pharmacieData.telephone || '',
          email: pharmacieData.email || '',
          description: pharmacieData.description || '',
          latitude: pharmacieData.latitude ? pharmacieData.latitude.toString() : '',
          longitude: pharmacieData.longitude ? pharmacieData.longitude.toString() : '',
          horaires_ouverture: pharmacieData.horaires_ouverture && Object.keys(pharmacieData.horaires_ouverture).length > 0 
            ? pharmacieData.horaires_ouverture 
            : defaultHoraires
        })
      }

      // Charger les préférences de notification
      const notificationPrefs = await preferencesService.getNotificationPreferences()
      setNotifications(notificationPrefs)

      // Charger les données de sécurité si on est sur l'onglet sécurité
      if (activeTab === 'securite') {
        await loadSecurityData()
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      showToast('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadSecurityData = async () => {
    try {
      setLoadingSecurity(true)
      
      // Charger les sessions actives
      const sessionsData = await securityService.getSessions()
      setSessions(sessionsData)
      
      // Charger l'historique récent
      const historiqueData = await securityService.getHistoriqueRecent()
      setHistorique(historiqueData)
      
      // Charger les statistiques
      const statsData = await securityService.getStatistiquesSecurite()
      setStatistiquesSecurite(statsData)
    } catch (error) {
      console.error('Erreur lors du chargement des données de sécurité:', error)
      showToast('Erreur lors du chargement des données de sécurité', 'error')
    } finally {
      setLoadingSecurity(false)
    }
  }

  // Fonctions de géolocalisation
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showToast('La géolocalisation n\'est pas supportée par ce navigateur', 'error')
      return
    }

    setGettingLocation(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const { latitude, longitude } = position.coords
      
      setPharmacieForm(prev => ({
        ...prev,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6)
      }))

      showToast('Localisation obtenue avec succès !', 'success')
    } catch (error: any) {
      console.error('Erreur de géolocalisation:', error)
      let message = 'Erreur lors de l\'obtention de la localisation'
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Permission de géolocalisation refusée'
          break
        case error.POSITION_UNAVAILABLE:
          message = 'Position non disponible'
          break
        case error.TIMEOUT:
          message = 'Délai d\'attente dépassé'
          break
      }
      
      showToast(message, 'error')
    } finally {
      setGettingLocation(false)
    }
  }

  const clearLocation = () => {
    setPharmacieForm(prev => ({
      ...prev,
      latitude: '',
      longitude: ''
    }))
    showToast('Localisation supprimée', 'info')
  }

  const handleSavePharmacieInfo = async () => {
    if (!pharmacie) return
    
    try {
      setSaving(true)
      
      // Valider les coordonnées si fournies
      if (pharmacieForm.latitude && (parseFloat(pharmacieForm.latitude) < -90 || parseFloat(pharmacieForm.latitude) > 90)) {
        showToast('La latitude doit être comprise entre -90 et 90', 'error')
        return
      }
      
      if (pharmacieForm.longitude && (parseFloat(pharmacieForm.longitude) < -180 || parseFloat(pharmacieForm.longitude) > 180)) {
        showToast('La longitude doit être comprise entre -180 et 180', 'error')
        return
      }
      
      // Préparer les données avec les coordonnées
      const updateData = {
        ...pharmacieForm,
        latitude: pharmacieForm.latitude ? parseFloat(pharmacieForm.latitude) : null,
        longitude: pharmacieForm.longitude ? parseFloat(pharmacieForm.longitude) : null
      }
      
      await pharmacieService.updateProfile(pharmacie.id, updateData)
      showToast('Informations de la pharmacie sauvegardées avec succès !', 'success')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUserInfo = async () => {
    try {
      setSaving(true)
      
      // Sauvegarder les informations de base
      await authService.updateProfile({
        nom: userForm.nom,
        email: userForm.email
      })

      // Changer le mot de passe si fourni
      if (userForm.currentPassword && userForm.newPassword) {
        if (userForm.newPassword !== userForm.confirmPassword) {
          showToast('Les mots de passe ne correspondent pas', 'error')
          return
        }
        await authService.changePassword(userForm.currentPassword, userForm.newPassword)
        // Réinitialiser les champs de mot de passe
        setUserForm({
          ...userForm,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }

      showToast('Informations utilisateur sauvegardées avec succès !', 'success')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setSaving(true)
      await preferencesService.updateNotificationPreferences(notifications)
      showToast('Préférences de notification sauvegardées avec succès !', 'success')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTerminerSession = async (sessionId: number) => {
    try {
      setSaving(true)
      await securityService.terminerSession(sessionId)
      showToast('Session terminée avec succès', 'success')
      await loadSecurityData() // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la terminaison de la session:', error)
      showToast('Erreur lors de la terminaison de la session', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTerminerAutresSessions = async () => {
    try {
      setSaving(true)
      await securityService.terminerAutresSessions()
      showToast('Toutes les autres sessions ont été terminées', 'success')
      await loadSecurityData() // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la terminaison des sessions:', error)
      showToast('Erreur lors de la terminaison des sessions', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Charger les données de sécurité quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'securite' && !loadingSecurity) {
      loadSecurityData()
    }
  }, [activeTab])

  const tabs = [
    { id: 'pharmacie', label: 'Pharmacie', icon: Building },
    { id: 'compte', label: 'Mon Compte', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'securite', label: 'Sécurité', icon: Shield }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      {/* En-tête */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Gérez les paramètres de votre pharmacie et de votre compte
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="mt-6">
        {/* Onglet Pharmacie */}
        {activeTab === 'pharmacie' && (
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 md:text-[28px] text-[20px]">
                  <Building className="h-5 w-5" />
                  Informations de la Pharmacie
                </CardTitle>
                <CardDescription>
                  Gérez les informations générales de votre pharmacie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom de la pharmacie</Label>
                    <Input
                      id="nom"
                      value={pharmacieForm.nom}
                      onChange={(e) => setPharmacieForm({...pharmacieForm, nom: e.target.value})}
                      placeholder="Nom de votre pharmacie"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ville">Ville</Label>
                    <Input
                      id="ville"
                      value={pharmacieForm.ville}
                      onChange={(e) => setPharmacieForm({...pharmacieForm, ville: e.target.value})}
                      placeholder="Ville"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="adresse">Adresse complète</Label>
                  <Input
                    id="adresse"
                    value={pharmacieForm.adresse}
                    onChange={(e) => setPharmacieForm({...pharmacieForm, adresse: e.target.value})}
                    placeholder="Adresse complète"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="telephone"
                        className="pl-10"
                        value={pharmacieForm.telephone}
                        onChange={(e) => setPharmacieForm({...pharmacieForm, telephone: e.target.value})}
                        placeholder="+221 XX XXX XX XX"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email-pharmacie">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email-pharmacie"
                        type="email"
                        className="pl-10"
                        value={pharmacieForm.email}
                        onChange={(e) => setPharmacieForm({...pharmacieForm, email: e.target.value})}
                        placeholder="contact@pharmacie.sn"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    value={pharmacieForm.description}
                    onChange={(e) => setPharmacieForm({...pharmacieForm, description: e.target.value})}
                    placeholder="Description de votre pharmacie..."
                  />
                </div>

                {/* Section Localisation */}
                <div className="border-t pt-4">
                  <div className="flex flex-wrap space-y-2 items-center justify-between mb-4">
                    <div>
                      <Label className="text-base font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Localisation GPS
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Définissez la position géographique de votre pharmacie
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="flex items-center gap-2"
                      >
                        <MapPin className={`h-4 w-4 ${gettingLocation ? 'animate-pulse' : ''}`} />
                        {gettingLocation ? 'Localisation...' : 'Ma position'}
                      </Button>
                      {(pharmacieForm.latitude || pharmacieForm.longitude) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearLocation}
                          className="text-red-600 hover:text-red-700"
                        >
                          Effacer
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        min="-90"
                        max="90"
                        value={pharmacieForm.latitude}
                        onChange={(e) => setPharmacieForm({...pharmacieForm, latitude: e.target.value})}
                        placeholder="Ex: 14.6928"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Coordonnée Nord-Sud (entre -90 et 90)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        min="-180"
                        max="180"
                        value={pharmacieForm.longitude}
                        onChange={(e) => setPharmacieForm({...pharmacieForm, longitude: e.target.value})}
                        placeholder="Ex: -17.4467"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Coordonnée Est-Ouest (entre -180 et 180)
                      </p>
                    </div>
                  </div>

                  {/* Aperçu de la localisation */}
                  {pharmacieForm.latitude && pharmacieForm.longitude && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Position enregistrée</span>
                      </div>
                      <div className="text-sm text-green-700">
                        <p>Latitude: {pharmacieForm.latitude}</p>
                        <p>Longitude: {pharmacieForm.longitude}</p>
                        <a
                          href={`https://www.google.com/maps?q=${pharmacieForm.latitude},${pharmacieForm.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 underline mt-1 inline-block"
                        >
                          Voir sur Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSavePharmacieInfo}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </CardContent>
            </Card>

            {/* Horaires d'ouverture */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horaires d'ouverture
                </CardTitle>
                <CardDescription>
                  Définissez vos horaires d'ouverture pour chaque jour de la semaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {horaireUtils.getJoursFrancais().map(({ key: jour, label }) => {
                    const horaire = pharmacieForm.horaires_ouverture[jour as keyof typeof pharmacieForm.horaires_ouverture] || 'Fermé'
                    return (
                      <div key={jour} className="flex flex-wrap items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Label className="w-24 font-medium text-gray-700">{label}</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <select
                            value={horaire === 'Fermé' ? 'ferme' : 'ouvert'}
                            onChange={(e) => {
                              const newValue = e.target.value === 'ferme' ? 'Fermé' : '08:00-18:00'
                              setPharmacieForm({
                                ...pharmacieForm,
                                horaires_ouverture: {
                                  ...pharmacieForm.horaires_ouverture,
                                  [jour]: newValue
                                }
                              })
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="ouvert">Ouvert</option>
                            <option value="ferme">Fermé</option>
                          </select>
                          
                          {horaire !== 'Fermé' ? (
                            <Input
                              className="w-36"
                              value={horaire}
                              onChange={(e) => setPharmacieForm({
                                ...pharmacieForm,
                                horaires_ouverture: {
                                  ...pharmacieForm.horaires_ouverture,
                                  [jour]: e.target.value
                                }
                              })}
                              placeholder="08:00-18:00"
                            />
                          ) : (
                            <div className="w-36 px-3 py-2 text-gray-500 bg-gray-100 rounded-md text-center border">
                              Fermé
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Boutons de raccourci pour horaires prédéfinis */}
                  <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Horaires prédéfinis</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const horairesStandard = horaireUtils.getDefaultHoraires()
                          setPharmacieForm({
                            ...pharmacieForm,
                            horaires_ouverture: horairesStandard
                          })
                        }}
                        className="text-xs"
                      >
                        Standard (8h-18h)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const horairesEtendus = {
                            lundi: '07:00-20:00',
                            mardi: '07:00-20:00',
                            mercredi: '07:00-20:00',
                            jeudi: '07:00-20:00',
                            vendredi: '07:00-20:00',
                            samedi: '08:00-18:00',
                            dimanche: '09:00-13:00'
                          }
                          setPharmacieForm({
                            ...pharmacieForm,
                            horaires_ouverture: horairesEtendus
                          })
                        }}
                        className="text-xs"
                      >
                        Étendus (7h-20h)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const horairesReduits = {
                            lundi: '09:00-17:00',
                            mardi: '09:00-17:00',
                            mercredi: '09:00-17:00',
                            jeudi: '09:00-17:00',
                            vendredi: '09:00-17:00',
                            samedi: '09:00-12:00',
                            dimanche: 'Fermé'
                          }
                          setPharmacieForm({
                            ...pharmacieForm,
                            horaires_ouverture: horairesReduits
                          })
                        }}
                        className="text-xs"
                      >
                        Réduits (9h-17h)
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="text-blue-600 mt-0.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-blue-800 font-medium">Format des horaires</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Utilisez le format HH:MM-HH:MM (ex: 08:00-18:00) ou sélectionnez "Fermé" pour les jours de fermeture.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={handleSavePharmacieInfo}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder les horaires'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglet Mon Compte */}
        {activeTab === 'compte' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 md:text-[28px] text-[20px]">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Gérez vos informations de compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nom-user">Nom complet</Label>
                  <Input
                    id="nom-user"
                    value={userForm.nom}
                    onChange={(e) => setUserForm({...userForm, nom: e.target.value})}
                    placeholder="Votre nom complet"
                  />
                </div>

                <div>
                  <Label htmlFor="email-user">Email</Label>
                  <Input
                    id="email-user"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    placeholder="votre@email.com"
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Changer le mot de passe</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? 'text' : 'password'}
                          value={userForm.currentPassword}
                          onChange={(e) => setUserForm({...userForm, currentPassword: e.target.value})}
                          placeholder="Mot de passe actuel"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="new-password">Nouveau mot de passe</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={userForm.newPassword}
                        onChange={(e) => setUserForm({...userForm, newPassword: e.target.value})}
                        placeholder="Nouveau mot de passe"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={userForm.confirmPassword}
                        onChange={(e) => setUserForm({...userForm, confirmPassword: e.target.value})}
                        placeholder="Confirmer le mot de passe"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveUserInfo}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglet Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 md:text-[28px] text-[20px]">
                  <Bell className="h-5 w-5" />
                  Préférences de notification
                </CardTitle>
                <CardDescription>
                  Choisissez comment vous souhaitez être notifié
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Alertes de stock</h4>
                      <p className="text-sm text-gray-500">Recevoir des notifications pour les ruptures de stock</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.stockAlerts}
                      onChange={(e) => setNotifications({...notifications, stockAlerts: e.target.checked})}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications de commandes</h4>
                      <p className="text-sm text-gray-500">Recevoir des notifications pour les nouvelles commandes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.orderNotifications}
                      onChange={(e) => setNotifications({...notifications, orderNotifications: e.target.checked})}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications par email</h4>
                      <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications SMS</h4>
                      <p className="text-sm text-gray-500">Recevoir des notifications par SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={(e) => setNotifications({...notifications, smsNotifications: e.target.checked})}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglet Sécurité */}
        {activeTab === 'securite' && (
          <div className="space-y-6">
            {/* Statistiques de sécurité */}
            {statistiquesSecurite && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 md:text-[28px] text-[20px]">
                    <Shield className="h-5 w-5" />
                    Statistiques de sécurité
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Aperçu de votre activité de connexion des 30 derniers jours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">
                        {statistiquesSecurite.total_tentatives}
                      </div>
                      <div className="text-xs sm:text-sm text-blue-800">Total tentatives</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">
                        {statistiquesSecurite.connexions_reussies}
                      </div>
                      <div className="text-xs sm:text-sm text-green-800">Connexions réussies</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-red-600">
                        {statistiquesSecurite.tentatives_echouees}
                      </div>
                      <div className="text-xs sm:text-sm text-red-800">Tentatives échouées</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-purple-600">
                        {statistiquesSecurite.taux_reussite}%
                      </div>
                      <div className="text-xs sm:text-sm text-purple-800">Taux de réussite</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sessions actives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-5 w-5" />
                  Sessions actives
                </CardTitle>
                <CardDescription className="text-sm">
                  Gérez vos sessions de connexion actives
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSecurity ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session) => {
                      const { browser, operatingSystem } = securityService.parseUserAgent(session.user_agent)
                      const deviceType = securityService.getDeviceType(session.user_agent)
                      
                      return (
                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                            <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                              {deviceType === 'Mobile' ? (
                                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                              ) : (
                                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm sm:text-base truncate">
                                {browser} sur {operatingSystem}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate">
                                {session.ip_address} • {deviceType}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                <div className="sm:inline">Dernière activité: </div>
                                <div className="sm:inline">{new Date(session.derniere_activite).toLocaleString('fr-FR')}</div>
                              </div>
                              <div className="text-xs text-gray-400">
                                Durée: {session.duree_session}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                            {session.est_active ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTerminerSession(session.id)}
                              disabled={saving}
                              className="text-xs px-2 py-1 sm:px-3 sm:py-2"
                            >
                              Terminer
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={handleTerminerAutresSessions}
                        disabled={saving}
                        className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50 text-sm"
                      >
                        Terminer toutes les autres sessions
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Aucune session active trouvée
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historique de connexion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Clock className="h-5 w-5" />
                  Historique de connexion
                </CardTitle>
                <CardDescription className="text-sm">
                  Consultez l'historique de vos connexions récentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSecurity ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : historique.length > 0 ? (
                  <div className="space-y-3">
                    {historique.slice(0, 10).map((entry) => {
                      const { browser, operatingSystem } = securityService.parseUserAgent(entry.user_agent)
                      const deviceType = securityService.getDeviceType(entry.user_agent)
                      
                      return (
                        <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                          <div className="flex items-start sm:items-center space-x-3 flex-1">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              entry.statut === 'succes' ? 'bg-green-100' : 
                              entry.statut === 'echec' ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                              {entry.statut === 'succes' ? (
                                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                              ) : entry.statut === 'echec' ? (
                                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                              ) : (
                                <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm sm:text-base">
                                {entry.statut_display}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate">
                                {browser} sur {operatingSystem}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate">
                                {entry.ip_address}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(entry.date_tentative).toLocaleString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end sm:justify-center">
                            <Badge 
                              variant={entry.statut === 'succes' ? 'default' : 'secondary'}
                              className={`text-xs ${
                                entry.statut === 'succes' ? 'bg-green-100 text-green-800' :
                                entry.statut === 'echec' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {deviceType}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                    
                    {historique.length > 10 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto text-sm">
                          Voir plus d'historique
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Aucun historique de connexion trouvé
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Authentification à deux facteurs (placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Shield className="h-5 w-5" />
                  Authentification à deux facteurs
                </CardTitle>
                <CardDescription className="text-sm">
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm sm:text-base">Authentification à deux facteurs</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Protégez votre compte avec une vérification en deux étapes
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs self-start sm:self-center">
                    Bientôt disponible
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}