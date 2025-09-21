"use client";

import { alpha, useTheme } from "@mui/material";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { depthVisualisationAtom } from "../selectors/DepthVisualisationSelector";
import useColumnDefs, { OrderEntry, Side } from "./hooks/useColumnDefs";
import useGridTheme from "./hooks/useGridTheme";
import useBucketBrices from "./useBucketBrices";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export interface OrderBookGridProps {
  asks: Map<string, string>;
  bids: Map<string, string>;
  isLoading?: boolean;
}

export const depth = 15;

export default function OrderBookGrid({
  asks,
  bids,
  isLoading = false,
}: OrderBookGridProps) {
  const bucketPrices = useBucketBrices();
  const depthVisualisation = useAtomValue(depthVisualisationAtom);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { rows } = useMemo(() => {
    const askEntries = bucketPrices(asks, "ask")
      .toArray()
      .sort((a, b) => a.price - b.price)
      .slice(0, depth);

    const bidEntries = bucketPrices(bids, "bid")
      .toArray()
      .sort((a, b) => b.price - a.price)
      .slice(0, depth);

    const topVolume: Record<Side, number> = {
      ask: Math.max(...askEntries.map((e) => e.amount), 0),
      bid: Math.max(...bidEntries.map((e) => e.amount), 0),
    };
    const largestVolume = Math.max(topVolume.ask, topVolume.bid);

    let askVolume = 0;
    const askRows: OrderEntry[] = askEntries.map((entry) => {
      askVolume += entry.amount;
      return {
        ...entry,
        fillRatio:
          depthVisualisation === "amount"
            ? entry.amount / largestVolume
            : askVolume / largestVolume,
      };
    });

    let bidVolume = 0;
    const bidRows: OrderEntry[] = bidEntries.map((entry) => {
      bidVolume += entry.amount;
      return {
        ...entry,
        fillRatio:
          depthVisualisation === "amount"
            ? entry.amount / largestVolume
            : bidVolume / largestVolume,
      };
    });

    return {
      rows: [...askRows.toReversed(), ...bidRows],
    };
  }, [asks, bids, bucketPrices, depthVisualisation]);

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

          let showHover = false;
          if (hoverIndex != null) {
            if (
              rows[hoverIndex].type === "ask" &&
              params.rowIndex >= hoverIndex &&
              params.data.type === "ask"
            ) {
              showHover = true;
            } else if (
              rows[hoverIndex].type === "bid" &&
              params.rowIndex <= hoverIndex &&
              params.data.type === "bid"
            ) {
              showHover = true;
            }
          }

          const percent = Math.round(params.data.fillRatio * 100);

          const baseColor =
            params.data.type === "ask"
              ? theme.palette.error.main
              : theme.palette.success.main;

          const color = alpha(baseColor, 0.3);
          return {
            background: `linear-gradient(to left, ${color} ${percent}%, transparent ${percent}%)`,
            boxShadow: showHover
              ? "inset 0 0 0 999px rgba(255, 255, 255, 0.04)"
              : "",
          };
        }}
        onCellMouseOver={(event) => {
          setHoverIndex(event.rowIndex);
        }}
        onCellMouseOut={() => {
          setHoverIndex(null);
        }}
      />
    </div>
  );
}
