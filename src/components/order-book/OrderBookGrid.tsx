"use client";

import { AllCommunityModule, ColDef, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import { baseAtom } from "../selectors/BaseSelector";
import {
  decimalGroupingAtom,
  useDecimalGroupingCallback,
} from "../selectors/DecimalGroupingSelector";
import { quoteAtom } from "../selectors/QuoteSelector";
import useGridTheme from "./hooks/useGridTheme";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

type OrderEntry = {
  price: number;
  amount: number;
  type: "ask" | "bid";
};

const totalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 5,
  minimumFractionDigits: 0,
});

function useColumnDefs() {
  const decimalGrouping = useAtomValue(decimalGroupingAtom);
  const decimalPlaces =
    decimalGrouping === 0.01 ? 2 : decimalGrouping === 0.1 ? 1 : 0;
  const base = useAtomValue(baseAtom);
  const quote = useAtomValue(quoteAtom);

  return useMemo(
    () =>
      [
        {
          field: "price",
          headerName: `Price (${quote.toUpperCase()})`,
          enableCellChangeFlash: true,
          cellStyle: (params) => {
            if (params.data?.type === "ask") {
              return { color: "red" };
            } else if (params.data?.type === "bid") {
              return { color: "green" };
            }
          },
          valueFormatter: ({ value }) => value.toFixed(decimalPlaces),
        },
        {
          field: "amount",
          type: "rightAligned",
          headerName: `Amount (${base.toUpperCase()})`,
          enableCellChangeFlash: true,
          valueFormatter: ({ value }) => value.toFixed(5),
        },
        {
          colId: "total",
          type: "rightAligned",
          headerName: "Total",
          valueGetter: (params) => {
            if (!params.data) {
              return NaN;
            }
            return params.data.price * params.data.amount;
          },
          valueFormatter: (params) => totalFormatter.format(params.value),
        },
      ] satisfies ColDef<OrderEntry>[],
    [base, decimalPlaces, quote],
  );
}

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
        columnDefs={useColumnDefs()}
        rowData={rows}
        getRowId={(params) => `${params.data.price}-${params.data.type}`}
      />
    </div>
  );
}
