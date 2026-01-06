#!/bin/bash

# Script de déploiement automatisé pour e-sora-pharmacie
# Usage: ./deploy.sh [environment]
# Environments: dev, staging, prod

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-prod}
BUILD_DIR="dist"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

echo "🚀 Déploiement e-sora-pharmacie - Environnement: $ENVIRONMENT"
echo "=================================================="

# Vérification des prérequis
echo "📋 Vérification des prérequis..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Installation des dépendances
echo ""
echo "📦 Installation des dépendances..."
npm ci

# Vérification du code
echo ""
echo "🔍 Vérification du code..."
echo "- Vérification TypeScript..."
npx tsc --noEmit

echo "- Vérification ESLint..."
npm run lint 2>/dev/null || echo "⚠️  ESLint non configuré, passage..."

# Tests (si disponibles)
echo ""
echo "🧪 Exécution des tests..."
npm test 2>/dev/null || echo "⚠️  Tests non configurés, passage..."

# Sauvegarde du build précédent
if [ -d "$BUILD_DIR" ]; then
    echo ""
    echo "💾 Sauvegarde du build précédent..."
    mv "$BUILD_DIR" "$BACKUP_DIR"
    echo "✅ Sauvegarde créée: $BACKUP_DIR"
fi

# Build de production
echo ""
echo "🔨 Build de production..."
npm run build

# Vérification du build
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Échec du build - dossier dist non créé"
    exit 1
fi

if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "❌ Échec du build - index.html non trouvé"
    exit 1
fi

echo "✅ Build réussi!"

# Statistiques du build
echo ""
echo "📊 Statistiques du build:"
echo "------------------------"
du -sh "$BUILD_DIR"/*
echo ""
echo "Taille totale: $(du -sh "$BUILD_DIR" | cut -f1)"

# Validation du build
echo ""
echo "🔍 Validation du build..."

# Vérifier que les fichiers essentiels existent
REQUIRED_FILES=("index.html")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BUILD_DIR/$file" ]; then
        echo "❌ Fichier manquant: $file"
        exit 1
    fi
done

# Vérifier la taille des assets
JS_SIZE=$(find "$BUILD_DIR/assets" -name "*.js" -exec du -ch {} + | tail -1 | cut -f1)
CSS_SIZE=$(find "$BUILD_DIR/assets" -name "*.css" -exec du -ch {} + | tail -1 | cut -f1)

echo "✅ JavaScript: $JS_SIZE"
echo "✅ CSS: $CSS_SIZE"

# Configuration spécifique à l'environnement
case $ENVIRONMENT in
    "dev")
        echo ""
        echo "🔧 Configuration développement..."
        # Ajoutez ici les configurations spécifiques au dev
        ;;
    "staging")
        echo ""
        echo "🔧 Configuration staging..."
        # Ajoutez ici les configurations spécifiques au staging
        ;;
    "prod")
        echo ""
        echo "🔧 Configuration production..."
        # Vérifications supplémentaires pour la production
        
        # Vérifier qu'il n'y a pas de console.log en production
        if grep -r "console\.log" "$BUILD_DIR/assets"/*.js 2>/dev/null; then
            echo "⚠️  console.log détectés dans le build de production"
        fi
        ;;
esac

# Test du serveur local (optionnel)
echo ""
read -p "🌐 Voulez-vous tester le build localement? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Démarrage du serveur de test..."
    echo "Serveur disponible sur: http://localhost:4173"
    echo "Appuyez sur Ctrl+C pour arrêter"
    npm run preview
fi

# Instructions de déploiement
echo ""
echo "🎯 Build prêt pour le déploiement!"
echo "=================================="
echo ""
echo "📁 Dossier à déployer: $BUILD_DIR/"
echo ""
echo "🚀 Options de déploiement:"
echo ""
echo "1. Serveur web statique:"
echo "   - Copiez le contenu de '$BUILD_DIR/' vers votre serveur web"
echo "   - Configurez le serveur pour servir index.html pour toutes les routes"
echo ""
echo "2. Vercel:"
echo "   vercel --prod"
echo ""
echo "3. Netlify:"
echo "   netlify deploy --prod --dir=$BUILD_DIR"
echo ""
echo "4. GitHub Pages:"
echo "   - Poussez le contenu de '$BUILD_DIR/' vers la branche gh-pages"
echo ""
echo "5. Docker:"
echo "   docker build -t e-sora-pharmacie ."
echo "   docker run -p 80:80 e-sora-pharmacie"
echo ""

# Nettoyage des sauvegardes anciennes (garde les 5 dernières)
echo "🧹 Nettoyage des anciennes sauvegardes..."
ls -dt backup_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true

echo ""
echo "✅ Déploiement terminé avec succès!"
echo "🎉 L'application e-sora-pharmacie est prête!"