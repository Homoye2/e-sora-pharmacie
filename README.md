# E-Sora Pharmacie

Application web dédiée à la gestion des pharmacies dans le système E-Sora. Cette application permet aux pharmaciens de gérer leurs stocks, commandes, et revenus de manière efficace.

## 🚀 Fonctionnalités

### 🔐 Authentification
- Connexion sécurisée réservée aux pharmaciens
- Gestion des tokens JWT avec rafraîchissement automatique
- Protection des routes

### 📊 Dashboard
- Vue d'ensemble des statistiques de la pharmacie
- Alertes pour les stocks en rupture ou sous seuil
- Commandes récentes et leur statut
- Indicateurs de performance

### 📦 Gestion des Stocks
- Inventaire complet des produits
- Alertes automatiques (rupture, seuil bas, expiration proche)
- Filtres et recherche avancée
- Gestion des lots et dates d'expiration

### 🛒 Gestion des Commandes
- Suivi complet du cycle de vie des commandes
- Workflow : En attente → Confirmée → Préparée → Prête → Récupérée
- Informations détaillées des patients
- Gestion des annulations

### 💰 Analyse des Revenus
- Chiffre d'affaires par période (jour, semaine, mois, année)
- Graphiques des ventes quotidiennes
- Calcul du panier moyen
- Analyse de croissance

## 🛠 Technologies Utilisées

- **Frontend**: React 19 + TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS + Radix UI
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Build Tool**: Vite

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Backend E-Sora en cours d'exécution sur `http://localhost:8000`

## 🚀 Installation et Démarrage

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Démarrer l'application en mode développement**
   ```bash
   npm run dev
   ```

3. **Accéder à l'application**
   - URL: `http://localhost:5173`
   - La racine `/` redirige automatiquement vers `/login`

## 🔑 Comptes de Test

### Pharmacien
- **Email**: `abdou.diouf@pharma.sn`
- **Mot de passe**: `pharma123`

## 📱 Interface Utilisateur

### Page de Connexion
- Interface moderne avec thème vert
- Validation des champs
- Gestion des erreurs
- Compte de test affiché

### Layout Principal
- Sidebar avec navigation
- Menu responsive pour mobile
- Informations de la pharmacie
- Déconnexion sécurisée

### Pages Fonctionnelles
- **Dashboard**: Vue d'ensemble avec statistiques et alertes
- **Stocks**: Gestion complète de l'inventaire
- **Commandes**: Suivi et traitement des commandes
- **Revenus**: Analyse financière détaillée

## 🔗 Intégration Backend

L'application utilise les APIs suivantes du backend E-Sora :

### Authentification
- `POST /api/auth/login/` - Connexion
- `POST /api/auth/refresh/` - Rafraîchissement du token

### Pharmacies
- `GET /api/pharmacies/` - Liste des pharmacies
- `GET /api/pharmacies/{id}/` - Détails d'une pharmacie

### Stocks
- `GET /api/stocks-produits/` - Liste des stocks
- `POST /api/stocks-produits/` - Créer un stock
- `PUT /api/stocks-produits/{id}/` - Modifier un stock
- `DELETE /api/stocks-produits/{id}/` - Supprimer un stock

### Commandes
- `GET /api/commandes/` - Liste des commandes
- `GET /api/commandes/{id}/` - Détails d'une commande
- `PATCH /api/commandes/{id}/` - Modifier le statut

### Produits
- `GET /api/produits/` - Liste des produits

## 🎨 Thème et Design

- **Couleur principale**: Vert (#22c55e) - cohérent avec le thème médical
- **Design**: Interface moderne et épurée
- **Responsive**: Optimisé pour desktop et mobile
- **Accessibilité**: Composants Radix UI accessibles

## 🔒 Sécurité

- Authentification JWT obligatoire
- Vérification du rôle utilisateur (pharmacien uniquement)
- Gestion automatique de l'expiration des tokens
- Protection contre les accès non autorisés

## 📊 Fonctionnalités Avancées

### Alertes Intelligentes
- Détection automatique des ruptures de stock
- Alertes pour les produits sous seuil
- Notification des produits proches de l'expiration

### Workflow des Commandes
- Processus guidé de traitement des commandes
- Mise à jour en temps réel des statuts
- Historique complet des actions

### Analytics
- Calculs automatiques des KPIs
- Graphiques interactifs
- Comparaisons temporelles

## 🚀 Déploiement

Pour construire l'application pour la production :

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

## 🤝 Contribution

Cette application fait partie du système E-Sora et utilise le même backend que l'application principale de consultation pour patients.

## 📞 Support

Pour toute question ou problème, veuillez contacter l'équipe de développement E-Sora.# e-sora-pharmacie
