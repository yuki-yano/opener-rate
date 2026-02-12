import "./index.css";

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import { preventIosInputAutoZoom } from "./lib/mobile-zoom";

preventIosInputAutoZoom();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
