import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { UIProvider } from './context/UIContext.jsx'
import 'leaflet/dist/leaflet.css'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <UIProvider>
        <App />
      </UIProvider>
    </AuthProvider>
  </StrictMode>,
)