import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { installLocalApi } from "./lib/localBackend/router.js";

// No backend anymore — every /api/* call is served entirely in the
// browser (auth, AI, media, TTS). Must run before anything calls fetch.
installLocalApi();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// Fade out and remove the pure-CSS splash from index.html now that React
// has taken over rendering.
const splash = document.getElementById("initial-loader");
if (splash) {
  splash.style.opacity = "0";
  setTimeout(() => splash.remove(), 200);
}
