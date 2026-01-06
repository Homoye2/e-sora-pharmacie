#!/bin/bash

# Script d'analyse du bundle e-sora-pharmacie
# Usage: ./analyze-bundle.sh

echo "🔍 Analyse du Bundle e-sora-pharmacie"
echo "====================================="

# Build avec analyse
echo "📦 Génération du build avec analyse..."
npm run build:analyze

echo ""
echo "📊 Statistiques détaillées du build:"
echo "------------------------------------"

# Afficher les tailles des fichiers
echo "📁 Contenu du dossier dist/:"
ls -lh dist/

echo ""
echo "📈 Tailles par type de fichier:"
echo "HTML: $(find dist -name "*.html" -exec du -ch {} + | tail -1 | cut -f1)"
echo "CSS: $(find dist -name "*.css" -exec du -ch {} + | tail -1 | cut -f1)"
echo "JavaScript: $(find dist -name "*.js" -exec du -ch {} + | tail -1 | cut -f1)"
echo "Images: $(find dist -name "*.png" -o -name "*.jpg" -o -name "*.svg" | xargs du -ch 2>/dev/null | tail -1 | cut -f1)"

echo ""
echo "💾 Taille totale du build:"
du -sh dist/

echo ""
echo "🎯 Analyse détaillée disponible dans:"
echo "📄 dist/stats.html - Ouvrez ce fichier dans votre navigateur"

# Ouvrir automatiquement le fichier d'analyse (sur macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    read -p "🌐 Voulez-vous ouvrir l'analyse dans le navigateur? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open dist/stats.html
    fi
fi

echo ""
echo "✅ Analyse terminée!"
echo ""
echo "📋 Recommandations d'optimisation:"
echo "- Vérifiez les gros modules dans stats.html"
echo "- Considérez le lazy loading pour les pages moins utilisées"
echo "- Optimisez les images si nécessaire"
echo "- Utilisez un CDN pour les assets statiques"