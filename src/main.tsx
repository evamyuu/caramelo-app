import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { PartnerDashboard } from "@/features/insights/PartnerDashboard";
import "@/styles/global.css";

// ``?painel`` opens the partner dashboard instead of the user's app.
const isPartnerView = new URLSearchParams(window.location.search).has("painel");
document.body.classList.toggle("is-partner-view", isPartnerView); // a long page, not a centred phone frame
createRoot(document.getElementById("root")!).render(<StrictMode>{isPartnerView ? <PartnerDashboard /> : <App />}</StrictMode>);
