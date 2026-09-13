import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { App } from './App'
import { AppBootstrap } from './components/AppBootstrap'
import './i18n/config' // initialise i18next before first render (no language flash)
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppBootstrap>
        <App />
      </AppBootstrap>
    </BrowserRouter>
  </StrictMode>,
)
