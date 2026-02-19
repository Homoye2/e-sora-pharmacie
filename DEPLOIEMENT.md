# Déploiement E-SORA Pharmacie

## 📦 Build généré avec succès

**Date:** 19 février 2026  
**Taille:** ~732 KB (non compressé)  
**Taille gzippé:** ~150 KB

## 📁 Contenu du build

```
dist/
├── index.html              (773 B)
├── .htaccess              (Configuration Apache)
├── assets/
│   ├── index-1we773GK.js  (548 KB - Code principal)
│   ├── index-BAbTe3oq.css (41 KB - Styles)
│   ├── utils-B9ygI19o.js  (36 KB - Utilitaires)
│   ├── icons-DzTDlydL.js  (13 KB - Icônes)
│   ├── vendor-Cgg2GOmP.js (11 KB - Dépendances)
│   └── e_sora-oTf08641.png (30 KB - Logo)
├── e_sora.png             (29 KB)
├── favicon.ico            (15 KB)
└── vite.svg               (1.5 KB)
```

## 🚀 Déploiement sur cPanel

### Méthode 1: Via File Manager

1. **Connectez-vous à cPanel**
2. **Allez dans File Manager**
3. **Créez un sous-domaine** (optionnel):
   - Allez dans "Domains" → "Subdomains"
   - Créez: `pharmacie.e-sora.onglalumiere.org`
   - Document Root: `/home/onglsmjm/pharmacie.e-sora.onglalumiere.org`

4. **Uploadez les fichiers**:
   - Allez dans le Document Root
   - Cliquez sur "Upload"
   - Uploadez TOUS les fichiers du dossier `dist/`
   - Ou créez une archive ZIP et uploadez-la, puis extrayez

5. **Vérifiez les permissions**:
   ```bash
   chmod 755 /home/onglsmjm/pharmacie.e-sora.onglalumiere.org
   chmod 644 /home/onglsmjm/pharmacie.e-sora.onglalumiere.org/*
   chmod 644 /home/onglsmjm/pharmacie.e-sora.onglalumiere.org/.htaccess
   ```

### Méthode 2: Via SSH/FTP

```bash
# Via SSH
ssh onglsmjm@server305.com

# Créer le répertoire
mkdir -p /home/onglsmjm/pharmacie.e-sora.onglalumiere.org

# Via FTP (depuis votre machine locale)
# Uploadez le contenu du dossier dist/ vers le répertoire créé
```

### Méthode 3: Via rsync (recommandé)

```bash
# Depuis votre machine locale
rsync -avz --progress dist/ onglsmjm@server305.com:/home/onglsmjm/pharmacie.e-sora.onglalumiere.org/
```

## ⚙️ Configuration

### Variables d'environnement

L'application utilise les variables définies dans `.env.production`:

```env
VITE_API_URL=https://e-sora.onglalumiere.org/api
```

**Important:** Si votre API est sur un autre domaine, vous devez:
1. Modifier `.env.production`
2. Régénérer le build: `npm run build`
3. Re-uploader les fichiers

### Configuration .htaccess

Le fichier `.htaccess` est déjà inclus dans le build avec:
- ✅ Routing SPA (toutes les routes vers index.html)
- ✅ Compression gzip
- ✅ Cache des fichiers statiques
- ✅ Headers de sécurité

**Pour activer HTTPS (après installation SSL):**

Décommentez ces lignes dans `.htaccess`:
```apache
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## 🌐 URLs suggérées

### Option 1: Sous-domaine
- **URL:** `https://pharmacie.e-sora.onglalumiere.org`
- **Document Root:** `/home/onglsmjm/pharmacie.e-sora.onglalumiere.org`

### Option 2: Sous-répertoire
- **URL:** `https://e-sora.onglalumiere.org/pharmacie`
- **Document Root:** `/home/onglsmjm/e_sora.onglalumiere.org/pharmacie`

### Option 3: Domaine principal
- **URL:** `https://pharmacie-e-sora.com`
- **Document Root:** `/home/onglsmjm/pharmacie-e-sora.com`

## ✅ Vérification après déploiement

### 1. Tester l'accès

Visitez: `https://pharmacie.e-sora.onglalumiere.org`

Vous devriez voir la page de connexion.

### 2. Tester le routing

Essayez d'accéder à: `https://pharmacie.e-sora.onglalumiere.org/dashboard`

Si vous voyez une erreur 404, vérifiez que `.htaccess` est bien présent.

### 3. Tester la connexion API

1. Ouvrez la console du navigateur (F12)
2. Essayez de vous connecter
3. Vérifiez qu'il n'y a pas d'erreurs CORS

### 4. Vérifier les fichiers statiques

Vérifiez que les images et le CSS se chargent correctement.

## 🔧 Dépannage

### Erreur 404 sur les routes

**Problème:** Les routes comme `/dashboard` donnent une erreur 404.

**Solution:**
1. Vérifiez que `.htaccess` est présent
2. Vérifiez que `mod_rewrite` est activé sur le serveur
3. Vérifiez les permissions du fichier `.htaccess`

```bash
chmod 644 .htaccess
```

### Erreur CORS

**Problème:** Erreurs CORS dans la console.

**Solution:**
1. Vérifiez que l'API backend a configuré CORS correctement
2. Dans Django `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://pharmacie.e-sora.onglalumiere.org",
]
```

### Fichiers statiques ne se chargent pas

**Problème:** Images ou CSS manquants.

**Solution:**
1. Vérifiez que tous les fichiers du dossier `assets/` sont uploadés
2. Vérifiez les permissions:
```bash
chmod -R 644 assets/*
```

### Page blanche

**Problème:** La page est blanche.

**Solution:**
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les erreurs JavaScript
3. Vérifiez que `VITE_API_URL` est correct
4. Vérifiez que l'API backend est accessible

## 🔒 Sécurité

### SSL/HTTPS

**Important:** Activez SSL pour votre domaine:

1. Dans cPanel, allez dans "SSL/TLS Status"
2. Activez AutoSSL pour votre domaine
3. Attendez quelques minutes
4. Décommentez la redirection HTTPS dans `.htaccess`

### Headers de sécurité

Le `.htaccess` inclut déjà:
- ✅ Protection XSS
- ✅ Protection MIME sniffing
- ✅ Protection Clickjacking

## 📊 Performance

### Optimisations incluses

- ✅ Code minifié
- ✅ Tree shaking
- ✅ Code splitting
- ✅ Compression gzip
- ✅ Cache des fichiers statiques

### Taille du build

- **Total:** 732 KB (non compressé)
- **Gzippé:** ~150 KB
- **Temps de chargement:** < 2 secondes (connexion rapide)

## 🔄 Mise à jour

Pour mettre à jour l'application:

1. **Générer un nouveau build:**
```bash
npm run build
```

2. **Uploader les nouveaux fichiers:**
```bash
rsync -avz --delete dist/ onglsmjm@server305.com:/home/onglsmjm/pharmacie.e-sora.onglalumiere.org/
```

3. **Vider le cache du navigateur:**
- Chrome: Ctrl+Shift+R
- Firefox: Ctrl+F5

## 📝 Checklist de déploiement

- [ ] Build généré (`npm run build`)
- [ ] Sous-domaine créé dans cPanel
- [ ] Fichiers uploadés
- [ ] Permissions définies (755 pour dossiers, 644 pour fichiers)
- [ ] `.htaccess` présent et configuré
- [ ] SSL activé
- [ ] Redirection HTTPS activée
- [ ] CORS configuré dans le backend
- [ ] Test de connexion réussi
- [ ] Test de navigation réussi
- [ ] Fichiers statiques chargés

## 🆘 Support

### Logs à vérifier

```bash
# Logs Apache
tail -f ~/logs/pharmacie.e-sora.onglalumiere.org-error_log

# Logs d'accès
tail -f ~/logs/pharmacie.e-sora.onglalumiere.org-access_log
```

### Console du navigateur

Ouvrez la console (F12) et vérifiez:
- Erreurs JavaScript
- Erreurs réseau
- Erreurs CORS

### Tester l'API

```bash
# Depuis le serveur
curl https://e-sora.onglalumiere.org/api/

# Depuis votre machine
curl https://e-sora.onglalumiere.org/api/
```

## 📚 Documentation

- **Guide de déploiement frontend:** `../GUIDE_DEPLOIEMENT_FRONTEND.md`
- **Documentation API:** `../consulting_for_patient_backend/API_DOCUMENTATION_SWAGGER.md`
- **Guide backend:** `../consulting_for_patient_backend/DEPLOIEMENT_CPANEL.md`

---

**Date de build:** 19 février 2026  
**Version:** 1.0.0  
**Status:** ✅ Prêt pour le déploiement
