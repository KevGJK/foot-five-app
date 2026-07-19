import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "./styles/theme.css";
import "./styles/app.css";
import App from './App.jsx'
import { registerDevice } from "./services/registerDevice";

import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
registerSW();