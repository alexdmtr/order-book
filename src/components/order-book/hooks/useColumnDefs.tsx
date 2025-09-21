"use client";
import { useTheme } from "@mui/material";
import { ColDef } from "ag-grid-community";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { baseAtom } from "../../selectors/BaseSelector";
import { decimalGroupingAtom } from "../../selectors/DecimalGroupingSelector";
import { quoteAtom } from "../../selectors/QuoteSelector";

export type Side = "ask" | "bid";

export type OrderEntry = {
  price: number;
  amount: number;
  type: Side;
  fillRatio: number;
};

export const totalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 5,
  minimumFractionDigits: 0,
});

export default function useColumnDefs() {
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
