import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryProvider } from "./providers/Query";
import { SyncBoundary } from "./providers/SyncBoundary";
import HabitsDemo from "./screens/HabitsDemo";
import { ToastHost } from "./debug/ToastHost";

/* import { TempoDevtools } from 'tempo-devtools'; [deprecated] */
/* TempoDevtools.init() [deprecated] */;

const basename = import.meta.env.BASE_URL;

function Home() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Habituals Dev</h1>
      <p><Link to="/demo">Open Habits Demo</Link></p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <QueryProvider>
        <SyncBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/demo" element={<HabitsDemo />} />
          </Routes>
          <ToastHost />
        </SyncBoundary>
      </QueryProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
