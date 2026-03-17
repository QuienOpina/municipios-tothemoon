import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ReportProvider } from './context/ReportContext.tsx'

// Evita error si el script de Google Maps carga antes de abrir el tab Mapa
declare global {
  interface Window {
    initMap?: () => void
  }
}
if (typeof window !== 'undefined') window.initMap = () => {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReportProvider>
      <App />
    </ReportProvider>
  </StrictMode>,
)
