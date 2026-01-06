import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin d'analyse du bundle (activé seulement avec ANALYZE=true)
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimisations pour la production
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les dépendances vendor
          vendor: ['react', 'react-dom'],
          // Séparer les icônes Lucide
          icons: ['lucide-react'],
          // Séparer les utilitaires
          utils: ['axios', 'date-fns']
        }
      }
    },
    // Augmenter la limite d'avertissement pour les gros chunks
    chunkSizeWarningLimit: 1000,
  }
})
