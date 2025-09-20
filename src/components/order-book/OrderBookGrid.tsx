"use client";

import { useColorScheme } from "@mui/material";
import {
  AllCommunityModule,
  ColDef,
  colorSchemeDark,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import { PriceQtyPair } from "./OrderBook";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

type Side = "Buy" | "Sell";
type OrderEntry = {
  side: string;
  price: number;
  amount: number;
};

const columnDefs = [
  { field: "side" },
  { field: "price", enableCellChangeFlash: true },
  { field: "amount", enableCellChangeFlash: true },
] satisfies ColDef<OrderEntry>[];

export interface OrderBookGridProps {
  prices: PriceQtyPair[];
  side: Side;
}
const darkTheme = themeQuartz.withPart(colorSchemeDark);

export default function OrderBookGrid({ prices, side }: OrderBookGridProps) {
  const orders = useMemo<OrderEntry[]>(
    () =>
      prices
        .toSorted((a, b) =>
          side === "Sell"
            ? parseFloat(b[0]) - parseFloat(a[0])
            : parseFloat(a[0]) - parseFloat(b[0]),
        )
        .map((pair, index) => ({
          side: `${side} ${index + 1}`,
          price: Number.parseFloat(pair[0]),
          amount: Number.parseFloat(pair[1]),
        })),
    [prices, side],
  );

  const { mode, systemMode } = useColorScheme();
  const isDark =
    mode === "dark" || (mode === "system" && systemMode === "dark");

  return (
    <div style={{ height: 800, width: 600 }}>
      <AgGridReact
        theme={isDark ? darkTheme : themeQuartz}
        animateRows={false}
        columnDefs={columnDefs}
        rowData={orders}
        getRowId={(params) => params.data.price.toString()}
      />
    </div>
  );
}
