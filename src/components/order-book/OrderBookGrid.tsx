"use client";

import { alpha, useTheme } from "@mui/material";
import { AllCommunityModule, ColDef, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import { baseAtom } from "../selectors/BaseSelector";
import {
  decimalGroupingAtom,
  useDecimalGroupingCallback,
} from "../selectors/DecimalGroupingSelector";
import { depthVisualisationAtom } from "../selectors/DepthVisualisationSelector";
import { quoteAtom } from "../selectors/QuoteSelector";
import useGridTheme from "./hooks/useGridTheme";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

type OrderEntry = {
  price: number;
  amount: number;
  type: Side;
};

export type Side = "ask" | "bid";

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
  const theme = useTheme();

  return useMemo(
    () =>
      [
        {
          field: "price",
          headerName: `Price (${quote.toUpperCase()})`,
          cellStyle: (params) => {
            if (params.data?.type === "ask") {
              return { color: theme.palette.error.main };
            } else if (params.data?.type === "bid") {
              return { color: theme.palette.success.main };
            }
          },
          valueFormatter: ({ value }) => value.toFixed(decimalPlaces),
        },
        {
          field: "amount",
          type: "rightAligned",
          headerName: `Amount (${base.toUpperCase()})`,
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
    [
      base,
      decimalPlaces,
      quote,
      theme.palette.error.main,
      theme.palette.success.main,
    ],
  );
}

export interface OrderBookGridProps {
  asks: Map<string, string>;
  bids: Map<string, string>;
  isLoading?: boolean;
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

export default function OrderBookGrid({
  asks,
  bids,
  isLoading = false,
}: OrderBookGridProps) {
  const bucketPrices = useBucketBrices();
  const depthVisualisation = useAtomValue(depthVisualisationAtom);
  const { rows, topVolume } = useMemo(() => {
    const askEntries = bucketPrices(asks, "ask")
      .toArray()
      .sort((a, b) => a.price - b.price)
      .slice(0, depth);

    const bidEntries = bucketPrices(bids, "bid")
      .toArray()
      .sort((a, b) => b.price - a.price)
      .slice(0, depth);

    const totalVolume = [...askEntries, ...bidEntries].reduce(
      (sum, e) => sum + e.amount,
      0,
    );

    const topVolume: Record<Side, number> = {
      ask: Math.max(...askEntries.map((e) => e.amount), 0),
      bid: Math.max(...bidEntries.map((e) => e.amount), 0),
    };

    return {
      rows: [...askEntries.toReversed(), ...bidEntries],
      topVolume,
    };
  }, [asks, bids, bucketPrices]);

  const theme = useTheme();

  return (
    <div style={{ height: 900, width: 600 }}>
      <AgGridReact
        theme={useGridTheme()}
        animateRows={false}
        columnDefs={useColumnDefs()}
        rowData={rows}
        loading={isLoading}
        getRowId={(params) => `${params.data.price}-${params.data.type}`}
        getRowStyle={(params) => {
          if (!params.data) {
            return;
          }

          const percent = Math.round(
            (params.data.amount / topVolume[params.data.type]) * 100,
          );
          const baseColor =
            params.data.type === "ask"
              ? theme.palette.error.main
              : theme.palette.success.main;

          const color = alpha(baseColor, 0.3);
          return {
            background: `linear-gradient(to left, ${color} ${percent}%, transparent ${percent}%)`,
          };
        }}
      />
    </div>
  );
}
