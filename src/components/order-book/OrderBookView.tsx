"use client";

import { Stack } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { enableMapSet } from "immer";
import { atom, useAtomValue } from "jotai";
import BaseSelector, { BaseAsset, baseAtom } from "../selectors/BaseSelector";
import DecimalGroupingSelector from "../selectors/DecimalGroupingSelector";
import QuoteSelector, {
  QuoteAsset,
  quoteAtom,
} from "../selectors/QuoteSelector";
import OrderBook from "./OrderBook";
export type Symbol = `${BaseAsset}${QuoteAsset}`;

enableMapSet();
const symbolAtom = atom<Symbol>((get) => {
  const base = get(baseAtom);
  const quote = get(quoteAtom);
  return `${base}${quote}`;
});

const queryClient = new QueryClient();

export default function OrderBookView() {
  const symbol = useAtomValue(symbolAtom);

  return (
    <Stack width="100%" height="100%">
      <Stack width="100%" direction="row" gap={1}>
        <BaseSelector />
        <QuoteSelector />
        <DecimalGroupingSelector />
      </Stack>
      <QueryClientProvider client={queryClient}>
        <OrderBook key={symbol} symbol={symbol} />
      </QueryClientProvider>
    </Stack>
  );
}
