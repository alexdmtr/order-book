"use client";

import { AllCommunityModule, ColDef, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo } from "react";
import { useDecimalGroupingCallback } from "../selectors/DecimalGroupingSelector";
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
  {
    field: "amount",
    enableCellChangeFlash: true,
    valueFormatter: ({ value }) => value.toFixed(5),
  },
] satisfies ColDef<OrderEntry>[];

export interface OrderBookGridProps {
  asks: Map<string, string>;
  bids: Map<string, string>;
}

const depth = 15;

function useBucketBrices() {
  const groupDecimals = useDecimalGroupingCallback();

  return useCallback(
    (prices: Map<string, string>, side: "ask" | "bid") =>
      Map.groupBy(prices, ([price]) => groupDecimals(price, side))
        .entries()
        .map(
          ([price, entries]) =>
            ({
              price: price,
              amount: entries.reduce(
                (sum, [, amount]) => sum + parseFloat(amount),
                0,
              ),
              type: side,
            }) as const,
        ),
    [groupDecimals],
  );
}

export default function OrderBookGrid({ asks, bids }: OrderBookGridProps) {
  const bucketPrices = useBucketBrices();
  const rows = useMemo<OrderEntry[]>(() => {
    const askEntries = bucketPrices(asks, "ask")
      .toArray()
      .sort((a, b) => a.price - b.price)
      .slice(0, depth);

    const bidEntries = bucketPrices(bids, "bid")
      .toArray()
      .sort((a, b) => b.price - a.price)
      .slice(0, depth);

    return [...askEntries.toReversed(), ...bidEntries];
  }, [asks, bids, bucketPrices]);

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
