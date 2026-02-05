import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// Configuration d'axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, essayer de le rafraîchir
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })
          const { access } = response.data
          localStorage.setItem('access_token', access)
          
          // Retry la requête originale
          error.config.headers.Authorization = `Bearer ${access}`
          return api.request(error.config)
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: number
  email: string
  nom: string
  role: string
  actif: boolean
}

export interface Pharmacie {
  id: number
  nom: string
  adresse: string
  ville: string
  pays: string
  telephone: string
  email?: string
  latitude?: number
  longitude?: number
  logo?: string
  horaires_ouverture: Record<string, any>
  description: string
  user: number
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Produit {
  id: number
  nom: string
  description: string
  prix_unitaire: number
  unite: string
  categorie: string
  code_barre?: string
  prescription_requise: boolean
  actif: boolean
  created_at: string
  updated_at: string
}

export interface StockProduit {
  id: number
  pharmacie: number
  pharmacie_nom: string
  produit: number
  produit_nom: string
  quantite: number
  seuil_alerte: number
  numero_lot: string
  date_expiration?: string
  prix_vente: string | number
  created_at: string
  updated_at: string
  est_en_rupture: boolean
  est_sous_seuil: boolean
  est_proche_expiration: boolean
}

export interface CommandePharmacie {
  id: number
  numero_commande: string
  patient: number
  patient_nom: string
  patient_prenom: string
  patient_telephone?: string
  pharmacie: number
  pharmacie_nom: string
  statut: 'en_attente' | 'confirmee' | 'preparee' | 'prete' | 'recuperee' | 'annulee'
  montant_total: number
  prescription?: number
  prescription_image?: string
  notes_patient: string
  notes_pharmacie: string
  date_commande: string
  date_confirmation?: string
  date_preparation?: string
  date_prete?: string
  date_recuperation?: string
  lignes: LigneCommande[]
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  user: number
  user_nom: string
  type_notification: string
  titre: string
  message: string
  rendez_vous?: number
  commande?: number
  data: Record<string, any>
  lu: boolean
  date_lecture?: string
  created_at: string
}
 
export interface HistoriqueConnexion {
  id: number
  user: number
  user_nom: string
  session_key: string
  ip_address: string
  user_agent: string
  device_info: string
  location: string
  date_creation: string
  derniere_activite: string
  active: boolean
  est_active: boolean
  duree_session: string
}

export interface LigneVente {
  id: number
  vente: number
  produit: Produit
  produit_nom: string
  produit_unite: string
  stock_produit: number
  quantite: number
  prix_unitaire: number
  prix_total: number
  remise_pourcentage: number
  remise_montant: number
  created_at: string
}

export interface VentePharmacie {
  id: number
  numero_vente: string
  pharmacie: number
  pharmacie_nom: string
  nom_client: string
  telephone_client: string
  montant_total: number
  montant_paye: number
  montant_rendu: number
  mode_paiement: 'especes' | 'carte' | 'mobile' | 'cheque' | 'credit'
  mode_paiement_display: string
  reference_paiement: string
  prescription_image?: string
  notes: string
  vendeur: number
  vendeur_nom: string
  date_vente: string
  lignes: LigneVente[]
  created_at: string
  updated_at: string
}

export interface LigneCommande {
  id: number
  commande: number
  produit: Produit
  quantite: number
  prix_unitaire: number
  prix_total: number
}

export interface StatistiquesVentes {
  total_ventes: number
  chiffre_affaires_total: number
  panier_moyen: number
  par_periode: {
    [key: string]: {
      nombre_ventes: number
      chiffre_affaires: number
    }
  }
  top_produits: Array<{
    produit__nom: string
    quantite_totale: number
    chiffre_affaires: number
  }>
  modes_paiement: Array<{
    mode_paiement: string
    nombre: number
    montant: number
  }>
}

export interface RevenusCombines {
  statistiques_par_periode: {
    [key: string]: {
      chiffre_affaires_total: number
      nombre_ventes_manuelles: number
      nombre_commandes: number
      nombre_total: number
      ca_ventes_manuelles: number
      ca_commandes: number
    }
  }
  panier_moyen: number
  croissance_mois: number
  ventes_par_jour: Array<{
    date: string
    montant_total: number
    ventes_manuelles: number
    commandes: number
    total_transactions: number
  }>
}

export interface StatistiquesSecurite {
  total_tentatives: number
  connexions_reussies: number
  tentatives_echouees: number
  taux_reussite: number
}

export interface EmployePharmacie {
  id: number
  user: number
  user_nom: string
  user_email: string
  pharmacie: number
  pharmacie_nom: string
  poste: string
  date_embauche: string
  salaire?: number
  peut_vendre: boolean
  peut_gerer_stock: boolean
  peut_voir_commandes: boolean
  peut_traiter_commandes: boolean
  actif: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface EmployePharmacieCreate {
  nom: string
  email: string
  password: string
  pharmacie: number
  poste: string
  date_embauche: string
  salaire?: number
  peut_vendre: boolean
  peut_gerer_stock: boolean
  peut_voir_commandes: boolean
  peut_traiter_commandes: boolean
  notes?: string
}

export interface StatistiquesEmployes {
  total_employes: number
  employes_actifs: number
  employes_inactifs: number
  par_pharmacie: Record<string, {
    total: number
    actifs: number
  }>
  par_poste: Record<string, number>
  permissions: {
    peuvent_vendre: number
    peuvent_gerer_stock: number
    peuvent_voir_commandes: number
    peuvent_traiter_commandes: number
  }
}

// Services API
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/pharmacy-login/', { email, password })
    return response.data
  },
  
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },
  
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token')
  },

  updateProfile: async (userData: {
    nom?: string
    email?: string
  }) => {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Utilisateur non connecté')
    
    const response = await api.patch(`/users/${user.id}/`, userData)
    
    // Mettre à jour les données utilisateur en local
    const updatedUser = { ...user, ...response.data }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword
    })
    return response.data
  },
}

export const pharmacieService = {
  getAll: async () => {
    const response = await api.get('/pharmacies/')
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/pharmacies/${id}/`)
    return response.data
  },
  
  getMyPharmacie: async () => {
    const user = authService.getCurrentUser()
    if (!user) return null
    
    if (user.role === 'pharmacien') {
      // Pour les pharmaciens, chercher la pharmacie dont ils sont propriétaires
      const response = await api.get('/pharmacies/')
      if (response.data.results) {
        return response.data.results.find((p: Pharmacie) => p.user === user.id)
      }
    } else if (user.role === 'employe_pharmacie') {
      // Pour les employés, récupérer la pharmacie via leur profil employé
      try {
        const employeResponse = await api.get('/employes/mon_profil/')
        if (employeResponse.data) {
          const employe = employeResponse.data
          // Récupérer les détails de la pharmacie
          const pharmacieResponse = await api.get(`/pharmacies/${employe.pharmacie}/`)
          return pharmacieResponse.data
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la pharmacie de l\'employé:', error)
      }
    }
    
    return null
  },

  update: async (id: number, data: Partial<Pharmacie>) => {
    const response = await api.put(`/pharmacies/${id}/`, data)
    return response.data
  },

  updateProfile: async (id: number, profileData: {
    nom?: string
    adresse?: string
    ville?: string
    telephone?: string
    email?: string
    description?: string
    latitude?: number | null
    longitude?: number | null
    horaires_ouverture?: Record<string, string>
  }) => {
    // S'assurer que les horaires sont bien formatés
    if (profileData.horaires_ouverture) {
      // Valider le format des horaires
      const validatedHoraires: Record<string, string> = {}
      const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
      
      jours.forEach(jour => {
        const horaire = profileData.horaires_ouverture![jour]
        if (horaire) {
          // Valider le format HH:MM-HH:MM ou "Fermé"
          if (horaire === 'Fermé' || /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(horaire)) {
            validatedHoraires[jour] = horaire
          } else {
            // Format par défaut si invalide
            validatedHoraires[jour] = '08:00-18:00'
          }
        } else {
          validatedHoraires[jour] = 'Fermé'
        }
      })
      
      profileData.horaires_ouverture = validatedHoraires
    }
    
    const response = await api.patch(`/pharmacies/${id}/`, profileData)
    return response.data
  },
}

export const stockService = {
  getAll: async (pharmacieId?: number) => {
    const params = pharmacieId ? { pharmacie: pharmacieId } : {}
    const response = await api.get('/stocks-produits/', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/stocks-produits/${id}/`)
    return response.data
  },
  
  create: async (data: Partial<StockProduit>) => {
    const response = await api.post('/stocks-produits/', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<StockProduit>) => {
    const response = await api.put(`/stocks-produits/${id}/`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/stocks-produits/${id}/`)
  },
}

export const commandeService = {
  getAll: async (pharmacieId?: number) => {
    const params = pharmacieId ? { pharmacie: pharmacieId } : {}
    const response = await api.get('/commandes/', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/commandes/${id}/`)
    return response.data
  },
  
  updateStatut: async (id: number, statut: string, notes?: string) => {
    const response = await api.patch(`/commandes/${id}/`, { 
      statut,
      ...(notes && { notes_pharmacie: notes })
    })
    return response.data
  },

  updateStatutWithNotification: async (id: number, statut: string, message?: string) => {
    const response = await api.patch(`/commandes/${id}/update-with-notification/`, {
      statut,
      message_patient: message || ''
    })
    return response.data
  },
}

export const produitService = {
  getAll: async () => {
    const response = await api.get('/produits/')
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/produits/${id}/`)
    return response.data
  },

  create: async (data: Partial<Produit>) => {
    const response = await api.post('/produits/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Produit>) => {
    const response = await api.put(`/produits/${id}/`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/produits/${id}/`)
  },
}

export const statistiquesService = {
  getVentes: async (pharmacieId: number, periode?: string) => {
    const params = { pharmacie: pharmacieId, ...(periode && { periode }) }
    const response = await api.get('/statistiques/', { params })
    return response.data
  },
  
  getStocks: async (pharmacieId: number) => {
    const response = await api.get('/statistiques/stocks/', { 
      params: { pharmacie: pharmacieId } 
    })
    return response.data
  },
}

export const preferencesService = {
  getNotificationPreferences: async () => {
    const prefs = localStorage.getItem('notification_preferences')
    return prefs ? JSON.parse(prefs) : {
      stockAlerts: true,
      orderNotifications: true,
      emailNotifications: true,
      smsNotifications: false
    }
  },

  updateNotificationPreferences: async (preferences: {
    stockAlerts: boolean
    orderNotifications: boolean
    emailNotifications: boolean
    smsNotifications: boolean
  }) => {
    localStorage.setItem('notification_preferences', JSON.stringify(preferences))
    return preferences
  },

  getSecuritySettings: async () => {
    return {
      twoFactorEnabled: false,
      activeSessions: 1,
      lastLogin: new Date().toISOString()
    }
  },
}

export const securityService = {
  getSessions: async () => {
    const response = await api.get('/sessions/mes_sessions/')
    return response.data
  },

  getAllSessions: async () => {
    const response = await api.get('/sessions/')
    return response.data
  },

  terminerSession: async (sessionId: number) => {
    const response = await api.post(`/sessions/${sessionId}/terminer/`)
    return response.data
  },

  terminerAutresSessions: async () => {
    const response = await api.post('/sessions/terminer_autres/')
    return response.data
  },

  getHistoriqueConnexion: async () => {
    const response = await api.get('/historique-connexions/')
    return response.data
  },

  getHistoriqueRecent: async () => {
    const response = await api.get('/historique-connexions/recent/')
    return response.data
  },

  getStatistiquesSecurite: async () => {
    const response = await api.get('/historique-connexions/statistiques/')
    return response.data
  },

  parseUserAgent: (userAgent: string) => {
    const browsers = {
      'Chrome': /Chrome\/[\d.]+/,
      'Firefox': /Firefox\/[\d.]+/,
      'Safari': /Safari\/[\d.]+/,
      'Edge': /Edge\/[\d.]+/,
      'Opera': /Opera\/[\d.]+/
    }

    const os = {
      'Windows': /Windows NT/,
      'macOS': /Mac OS X/,
      'Linux': /Linux/,
      'iOS': /iPhone|iPad/,
      'Android': /Android/
    }

    let browser = 'Inconnu'
    let operatingSystem = 'Inconnu'

    for (const [name, regex] of Object.entries(browsers)) {
      if (regex.test(userAgent)) {
        browser = name
        break
      }
    }

    for (const [name, regex] of Object.entries(os)) {
      if (regex.test(userAgent)) {
        operatingSystem = name
        break
      }
    }

    return { browser, operatingSystem }
  },

  getDeviceType: (userAgent: string) => {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'Mobile'
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'Tablette'
    }
    return 'Ordinateur'
  }
}

export const horaireUtils = {
  getDefaultHoraires: () => ({
    lundi: '08:00-18:00',
    mardi: '08:00-18:00',
    mercredi: '08:00-18:00',
    jeudi: '08:00-18:00',
    vendredi: '08:00-18:00',
    samedi: '08:00-13:00',
    dimanche: 'Fermé'
  }),

  validateHoraire: (horaire: string): boolean => {
    return horaire === 'Fermé' || /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(horaire)
  },

  formatHoraire: (horaire: string): string => {
    if (horaire === 'Fermé') return 'Fermé'
    if (horaireUtils.validateHoraire(horaire)) return horaire
    return '08:00-18:00'
  },

  getJoursFrancais: () => [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' }
  ]
}

export const ventesService = {
  getAll: async (pharmacieId?: number, periode?: string) => {
    const params: any = {}
    if (pharmacieId) params.pharmacie = pharmacieId
    if (periode) params.periode = periode
    
    const response = await api.get('/ventes/', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/ventes/${id}/`)
    return response.data
  },
  
  create: async (data: {
    pharmacie: number
    nom_client?: string
    telephone_client?: string
    montant_paye: number
    mode_paiement: string
    reference_paiement?: string
    prescription_image?: File
    notes?: string
    lignes: Array<{
      produit_id: number
      quantite: number
      prix_unitaire: number
      remise_pourcentage?: number
    }>
  }) => {
    // Si une image de prescription est fournie, utiliser FormData
    if (data.prescription_image) {
      const formData = new FormData()
      
      // Ajouter tous les champs sauf les lignes et l'image
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'lignes' && key !== 'prescription_image' && value !== undefined) {
          formData.append(key, value.toString())
        }
      })
      
      // Ajouter l'image
      formData.append('prescription_image', data.prescription_image)
      
      // Ajouter les lignes en JSON
      formData.append('lignes', JSON.stringify(data.lignes))
      
      const response = await api.post('/ventes/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      // Utiliser JSON normal
      const response = await api.post('/ventes/', data)
      return response.data
    }
  },
  
  getStatistiques: async (pharmacieId?: number, periode?: string) => {
    const params: any = {}
    if (pharmacieId) params.pharmacie = pharmacieId
    if (periode) params.periode = periode
    
    const response = await api.get('/ventes/statistiques/', { params })
    return response.data
  },
  
  getRevenusCombines: async () => {
    const response = await api.get('/ventes/revenus_combines/')
    return response.data
  },
  
  getRecu: async (id: number) => {
    const response = await api.get(`/ventes/${id}/recu/`)
    return response.data
  },
  
  // Méthodes utilitaires
  getModePaiementOptions: () => [
    { value: 'especes', label: 'Espèces' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'mobile', label: 'Paiement mobile' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'credit', label: 'Crédit' }
  ],
  
  calculateTotal: (lignes: Array<{ quantite: number; prix_unitaire: number; remise_pourcentage?: number }>) => {
    return lignes.reduce((total, ligne) => {
      const prixBrut = ligne.quantite * ligne.prix_unitaire
      const remise = (ligne.remise_pourcentage || 0) * prixBrut / 100
      return total + (prixBrut - remise)
    }, 0)
  }
}

export const employesService = {
  getAll: async () => {
    const response = await api.get('/employes/')
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/employes/${id}/`)
    return response.data
  },
  
  getMonProfil: async () => {
    const response = await api.get('/employes/mon_profil/')
    return response.data
  },
  
  create: async (data: EmployePharmacieCreate) => {
    const response = await api.post('/employes/', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<EmployePharmacie>) => {
    const response = await api.put(`/employes/${id}/`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/employes/${id}/`)
  },
  
  activer: async (id: number) => {
    const response = await api.post(`/employes/${id}/activer/`)
    return response.data
  },
  
  desactiver: async (id: number) => {
    const response = await api.post(`/employes/${id}/desactiver/`)
    return response.data
  },
  
  changerMotDePasse: async (id: number, nouveauMotDePasse: string) => {
    const response = await api.post(`/employes/${id}/changer_mot_de_passe/`, {
      nouveau_mot_de_passe: nouveauMotDePasse
    })
    return response.data
  },
  
  getMesEmployes: async () => {
    const response = await api.get('/employes/mes_employes/')
    return response.data
  },
  
  getStatistiques: async () => {
    const response = await api.get('/employes/statistiques/')
    return response.data
  },
  
  // Méthodes utilitaires
  getPostesOptions: () => [
    { value: 'Employé', label: 'Employé' },
    { value: 'Vendeur', label: 'Vendeur' },
    { value: 'Préparateur', label: 'Préparateur' },
    { value: 'Assistant', label: 'Assistant' },
    { value: 'Caissier', label: 'Caissier' },
    { value: 'Magasinier', label: 'Magasinier' },
  ]
}

export const notificationsService = {
  getAll: async (filters?: { type_notification?: string; lu?: boolean }) => {
    const params = filters || {}
    const response = await api.get('/notifications/', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/notifications/${id}/`)
    return response.data
  },
  
  markAsRead: async (id: number) => {
    const response = await api.post(`/notifications/${id}/marquer_lu/`)
    return response.data
  },
  
  markAllAsRead: async () => {
    const response = await api.post('/notifications/marquer_toutes_lues/')
    return response.data
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/notifications/non_lues/')
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/notifications/${id}/`)
  },
  
  // Méthodes utilitaires
  getTypeConfig: (type: string) => {
    const config = {
      'rendez_vous_nouveau': { label: 'Nouveau RDV', icon: 'calendar', color: 'blue' },
      'rendez_vous_confirme': { label: 'RDV Confirmé', icon: 'check', color: 'green' },
      'rendez_vous_refuse': { label: 'RDV Refusé', icon: 'x', color: 'red' },
      'rendez_vous_rappel': { label: 'Rappel RDV', icon: 'bell', color: 'orange' },
      'commande_confirmee': { label: 'Commande', icon: 'shopping-cart', color: 'green' },
      'commande_prete': { label: 'Commande Prête', icon: 'package', color: 'green' },
      'consultation_rapport': { label: 'Rapport', icon: 'file-text', color: 'blue' },
      'stock_alerte': { label: 'Stock', icon: 'alert-triangle', color: 'orange' },
      'autre': { label: 'Autre', icon: 'info', color: 'gray' }
    }
    
    return config[type as keyof typeof config] || config.autre
  }
}

export default api