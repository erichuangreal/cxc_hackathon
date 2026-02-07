// src/App.jsx
import { useState } from "react";
import SidePanel from "./components/panel/SidePanel";

export default function App() {
  const [radiusKm, setRadiusKm] = useState(10);

  // TEMP mock result so UI shows something
  const demoResult = {
    status: "healthy",
    survivability: 0.82,
    confidence: 0.74,
    label: "Likely healthy",
    key_factors: ["Low drought risk", "Moderate soil moisture"],
    explanation:
      "Conditions in the selected area suggest strong short-term tree health.",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", height: "100vh" }}>
      {/* Map will go here later */}
      <div style={{ background: "#020503" }} />

      <SidePanel
        radiusKm={radiusKm}
        setRadiusKm={setRadiusKm}
        result={demoResult}
        isLoading={false}
      />
    </div>
  );
}
