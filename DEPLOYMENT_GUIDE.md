# Guide de Déploiement - e-sora-pharmacie

## ✅ BUILD RÉUSSI

Le build de production a été généré avec succès dans le dossier `dist/`.

### 📊 Statistiques du Build
- **HTML** : `index.html` (0.46 kB, gzip: 0.30 kB)
- **CSS** : `index-BjGAZip1.css` (38.52 kB, gzip: 7.20 kB)
- **JavaScript** : `index-Dj9_W3bY.js` (508.08 kB, gzip: 153.96 kB)
- **Assets** : `e_sora-oTf08641.png` (30.14 kB)

### 🎯 Optimisations Appliquées
- Minification du code JavaScript et CSS
- Compression gzip automatique
- Optimisation des images
- Tree-shaking des modules non utilisés
- Hashing des fichiers pour le cache

## 🚀 OPTIONS DE DÉPLOIEMENT

### 1. Serveur Web Statique (Recommandé)

#### Apache
```apache
# .htaccess
RewriteEngine On
RewriteBase /

# Handle Angular and other client-side routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Enable gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 2. Services Cloud

#### Vercel (Recommandé pour React)
```bash
# Installation
npm i -g vercel

# Déploiement
cd e-sora-pharmacie
vercel --prod
```

#### Netlify
```bash
# Via Netlify CLI
npm i -g netlify-cli
cd e-sora-pharmacie
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 3. Docker

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
```

## ⚙️ CONFIGURATION BACKEND

### Variables d'Environnement
L'application se connecte au backend Django. Assurez-vous que :

1. **Backend Django** est déployé et accessible
2. **CORS** est configuré pour accepter le domaine frontend
3. **Base de données** est configurée et migrée
4. **Fichiers statiques** sont servis correctement

#### Configuration CORS Django
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
    "http://localhost:3000",  # Pour le développement
]

CORS_ALLOW_CREDENTIALS = True
```

### API Endpoints
L'application utilise ces endpoints principaux :
- `POST /api/auth/pharmacy-login/` - Connexion pharmacien
- `GET /api/pharmacies/` - Données pharmacie
- `GET /api/commandes/` - Liste des commandes
- `GET /api/stocks-produits/` - Gestion des stocks
- `PATCH /api/commandes/{id}/update-with-notification/` - Actions avec notifications

## 🔧 OPTIMISATIONS POST-DÉPLOIEMENT

### 1. Performance
- **CDN** : Utiliser un CDN pour les assets statiques
- **Compression** : Activer gzip/brotli sur le serveur
- **Cache** : Configurer le cache des assets (1 an)
- **HTTP/2** : Activer HTTP/2 sur le serveur

### 2. Sécurité
```nginx
# Headers de sécurité
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### 3. Monitoring
- **Analytics** : Google Analytics ou alternative
- **Error Tracking** : Sentry ou similaire
- **Performance** : Web Vitals monitoring
- **Uptime** : Monitoring de disponibilité

## 📱 TESTS POST-DÉPLOIEMENT

### Checklist de Validation
- [ ] Page de connexion accessible
- [ ] Authentification fonctionnelle
- [ ] Navigation entre pages
- [ ] Dialogs responsive sur mobile
- [ ] API calls vers le backend
- [ ] Notifications en temps réel
- [ ] Gestion des erreurs
- [ ] Performance acceptable (< 3s)

### Tests Multi-Navigateurs
- [ ] Chrome (Desktop & Mobile)
- [ ] Firefox (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Edge (Desktop)

### Tests Responsive
- [ ] iPhone SE (375px)
- [ ] iPhone 12 (390px)
- [ ] iPad (768px)
- [ ] Desktop (1920px)

## 🚨 DÉPANNAGE

### Problèmes Courants

#### 1. Page blanche après déploiement
```bash
# Vérifier la console du navigateur
# Souvent lié au chemin des assets
```

#### 2. Erreurs CORS
```python
# Ajouter le domaine frontend dans CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS = ["https://your-domain.com"]
```

#### 3. Routes 404
```nginx
# Configurer le fallback vers index.html
try_files $uri $uri/ /index.html;
```

#### 4. Assets non trouvés
```javascript
// Vérifier la configuration base dans vite.config.js
export default defineConfig({
  base: '/your-subdirectory/', // Si déployé dans un sous-dossier
})
```

## 📋 COMMANDES UTILES

```bash
# Build de production
npm run build

# Preview du build
npm run preview

# Analyse du bundle
npm run build -- --analyze

# Nettoyage
rm -rf dist node_modules
npm install
npm run build
```

## 🎯 MÉTRIQUES DE SUCCÈS

### Performance Targets
- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Cumulative Layout Shift** : < 0.1
- **First Input Delay** : < 100ms

### Taille des Assets
- **JavaScript** : ~508 kB (153 kB gzipped) ✅
- **CSS** : ~38 kB (7 kB gzipped) ✅
- **Images** : ~30 kB ✅
- **Total** : ~577 kB (190 kB gzipped) ✅

L'application est prête pour le déploiement en production ! 🚀