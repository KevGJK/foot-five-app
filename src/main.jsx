import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./styles/theme.css";
import "./styles/app.css";

import App from "./App.jsx";
import NotificationListener from "./services/NotificationListener.jsx";

import LanguageProvider
from "./i18n/LanguageProvider";

createRoot(
  document.getElementById("root")
).render(

  <StrictMode>

    <LanguageProvider>

      <NotificationListener />

      <App />

    </LanguageProvider>

  </StrictMode>

);