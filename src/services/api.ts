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

export interface HistoriqueConnexion {
  id: number
  user: number
  user_nom: string
  statut: 'succes' | 'echec' | 'deconnexion'
  statut_display: string
  ip_address: string
  user_agent: string
  device_info: string
  location: string
  date_tentative: string
  details: string
}

export interface SessionUtilisateur {
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

export interface LigneCommande {
  id: number
  commande: number
  produit: Produit
  quantite: number
  prix_unitaire: number
  sous_total: number
}

export interface StatistiquesSecurite {
  total_tentatives: number
  connexions_reussies: number
  tentatives_echouees: number
  taux_reussite: number
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
    const response = await api.get('/pharmacies/')
    // Filtrer pour obtenir la pharmacie de l'utilisateur connecté
    const user = authService.getCurrentUser()
    if (user && response.data.results) {
      return response.data.results.find((p: Pharmacie) => p.user === user.id)
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

export default api