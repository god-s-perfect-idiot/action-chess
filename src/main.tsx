import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Showcase } from './scene/Showcase.tsx'

const params = new URLSearchParams(window.location.search)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.DEV && params.has('showcase') ? <Showcase only={params.get('showcase') || null} /> : <App />}
  </StrictMode>,
)
