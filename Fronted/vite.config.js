import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: '.', // La raíz es la carpeta actual (frontend)
  build: {
    outDir: '../backend/web', // ¡MAGIA! Construye el archivo final en la subcarpeta web
    emptyOutDir: false,   // No borres los scripts .gs que pondremos en backend
    target: 'esnext',
    assetsInlineLimit: 100000000, // Fuerza a que todo (imágenes, estilos) se incruste en el HTML
    chunkSizeWarningLimit: 100000000,
    brotliSize: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // Evita que corte el código en pedazos
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});