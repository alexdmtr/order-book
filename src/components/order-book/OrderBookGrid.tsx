"use client";

import { AllCommunityModule, ColDef, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import useGridTheme from "./hooks/useGridTheme";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

type OrderEntry = {
  price: number;
  amount: number;
  type: "ask" | "bid";
};

const columnDefs = [
  {
    field: "price",
    enableCellChangeFlash: true,
    cellStyle: (params) => {
      if (params.data?.type === "ask") {
        return { color: "red" };
      } else if (params.data?.type === "bid") {
        return { color: "green" };
      }
    },
  },
  { field: "amount", enableCellChangeFlash: true },
] satisfies ColDef<OrderEntry>[];

export interface OrderBookGridProps {
  asks: Map<string, string>;
  bids: Map<string, string>;
}

const depth = 15;
export default function OrderBookGrid({ asks, bids }: OrderBookGridProps) {
  const rows = useMemo<OrderEntry[]>(() => {
    const askEntries = Array.from(asks.entries())
      .map(
        ([price, amount]) =>
          ({
            price: Number.parseFloat(price),
            amount: Number.parseFloat(amount),
            type: "ask",
          }) as const,
      )
      .sort((a, b) => a.price - b.price)
      .slice(0, depth);

    const bidEntries = Array.from(bids.entries())
      .map(
        ([price, amount]) =>
          ({
            price: Number.parseFloat(price),
            amount: Number.parseFloat(amount),
            type: "bid",
          }) as const,
      )
      .sort((a, b) => b.price - a.price)
      .slice(0, depth);

    return [...askEntries.toReversed(), ...bidEntries];
  }, [asks, bids]);

  return (
    <div style={{ height: 800, width: 600 }}>
      <AgGridReact
        theme={useGridTheme()}
        animateRows={false}
        columnDefs={columnDefs}
        rowData={rows}
        getRowId={(params) => `${params.data.price}-${params.data.type}`}
      />
    </div>
  );
}
