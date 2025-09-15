"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function OrderBookGrid() {
  return (
    <div style={{ height: 400, width: 600 }} className="ag-theme-alpine">
      <AgGridReact columnDefs={[{ field: "DeskName" }]} />
    </div>
  );
}
