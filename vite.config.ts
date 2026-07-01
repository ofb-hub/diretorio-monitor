import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Em produção (GitHub Pages) a app é servida em /diretorio-monitor/.
// Em dev roda na raiz para não atrapalhar o preview local.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/diretorio-monitor/' : '/',
  plugins: [react(), tailwindcss()],
}))
