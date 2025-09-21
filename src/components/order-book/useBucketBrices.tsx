"use client";
import { useCallback } from "react";
import { useDecimalGroupingCallback } from "../selectors/DecimalGroupingSelector";

export default function useBucketBrices() {
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
