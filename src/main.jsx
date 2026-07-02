import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

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
