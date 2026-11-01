import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'

// Em produção o app é servido sob /diretorio-monitor/ (import.meta.env.BASE_URL).
// Removemos a barra final para o basename do React Router.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* App só tem tema escuro. O ThemeProvider existe porque alguns componentes
        (Toaster, MagicCard) leem o tema via next-themes. */}
    <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
