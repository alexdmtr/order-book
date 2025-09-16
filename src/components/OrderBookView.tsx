"use client";

import { Stack, Typography } from "@mui/material";
import { atom, useAtomValue } from "jotai";
import OrderBookGrid from "./OrderBookGrid";
import { useEffect } from "react";
import BaseSelector, { BaseAsset, baseAtom } from "./selectors/BaseSelector";
import QuoteSelector, {
  QuoteAsset,
  quoteAtom,
} from "./selectors/QuoteSelector";
import DepthSelector from "./selectors/DepthSelector";
import DecimalGroupingSelector from "./selectors/DecimalGroupingSelector";

export type Symbol = `${BaseAsset}${QuoteAsset}`;

const symbolAtom = atom<Symbol>((get) => {
  const base = get(baseAtom);
  const quote = get(quoteAtom);
  return `${base}${quote}`;
});

const levels = "@100ms"; // @5@10@100ms
const speedSuffix = ""; // @100ms

type PriceQtyPair = [price: string, amount: string];
type OrderBookResponse = {
  b: PriceQtyPair[]; // Bids to be updated,
  a: PriceQtyPair[]; // Asks to be updated
};

export default function OrderBookView() {
  const base = useAtomValue(baseAtom);
  const quote = useAtomValue(quoteAtom);
  const symbol = useAtomValue(symbolAtom);

  useEffect(() => {
    // Create WebSocket connection.
    const socket = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol}@depth${levels}${speedSuffix}`
    );

    // Connection opened
    // socket.addEventListener("open", (event) => {
    //   socket.send("Hello Server!");
    // });

    // Listen for messages
    socket.addEventListener("message", (event: MessageEvent) => {
      const data: OrderBookResponse = JSON.parse(event.data);
      console.log(data);

      // console.log("Message from server ", event.data);
    });

    return () => socket.close();
  }, [symbol]);

  return (
    <Stack width="100%" height="100%">
      <Typography variant="h6">
        Order Book - {base.toUpperCase()}/{quote.toUpperCase()}
      </Typography>
      <Stack width="100%" direction="row" justifyContent="end" gap={1}>
        <BaseSelector />
        <QuoteSelector />
        <DepthSelector />
        <DecimalGroupingSelector />
      </Stack>
      <Stack width="100%" flex={1} direction="row" gap={2} p={2}>
        <OrderBookGrid />
        <OrderBookGrid />
      </Stack>
    </Stack>
  );
}
