import React from "react";
import Graph from "./Graph";
import "./Dashboard.css";

function AnalyticsPanel() {
  return (
    <div className="analytics-panel">
      <h2 className="hhh">Site Analytics</h2>
      <Graph />
    </div>
  );
}

export default AnalyticsPanel;
