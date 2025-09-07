import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";

function App() {
  const showTempo = import.meta.env.VITE_TEMPO === "true";
  // Always call hooks; supply an empty route list since tempo routes are optional
  const tempoRoutes = useRoutes([]);
  
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
        {showTempo && tempoRoutes}
      </>
    </Suspense>
  );
}

export default App;
