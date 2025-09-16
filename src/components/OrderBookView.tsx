"use client";

import { Stack, Typography } from "@mui/material";
import { atom, useAtomValue } from "jotai";
import OrderBookGrid from "./OrderBookGrid";
import { useEffect, useMemo, useState } from "react";
import BaseSelector, { BaseAsset, baseAtom } from "./selectors/BaseSelector";
import QuoteSelector, {
  QuoteAsset,
  quoteAtom,
} from "./selectors/QuoteSelector";
import {
  BehaviorSubject,
  buffer,
  bufferWhen,
  concat,
  fromEvent,
  skipUntil,
  Subject,
  switchMap,
  take,
  takeUntil,
  toArray,
} from "rxjs";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

export type Symbol = `${BaseAsset}${QuoteAsset}`;

const symbolAtom = atom<Symbol>((get) => {
  const base = get(baseAtom);
  const quote = get(quoteAtom);
  return `${base}${quote}`;
});

const levels = "@1000ms"; // @5@10@100ms
const speedSuffix = ""; // @100ms

export type PriceQtyPair = [price: string, amount: string];
export type OrderBookUpdate = {
  e: "depthUpdate"; // Event type
  E: number; // Event time (timestamp)
  s: string; // Symbol (e.g., "BNBBTC")
  U: number; // First update ID in event
  u: number; // Final update ID in event
  b: PriceQtyPair[]; // Bids to be updated
  a: PriceQtyPair[]; // Asks to be updated
};

export type OrderBookState = {
  lastUpdateId: number;
  bids: PriceQtyPair[];
  asks: PriceQtyPair[];
};

function OrderBook() {
  const symbol = useAtomValue(symbolAtom);
  const [state, setState] = useState<OrderBookState | undefined>();
  const [firstUpdateId, setFirstUpdateId] = useState<number | null>(null);
  const eventStream$ = useMemo(() => new Subject<OrderBookUpdate>(), []);
  const stateStream = useMemo(() => new Subject<OrderBookState>(), []);

  const snapshotQuery = useQuery({
    queryFn: () =>
      fetch(
        `https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=5000`,
        { mode: "cors" }
      ).then((res) => {
        return res.json();
      }),
    queryKey: ["snapshot", symbol],
    enabled: firstUpdateId !== null,
  });

  useEffect(() => {
    // buffer events until the first response
    const buffered$ = eventStream$.pipe(
      buffer(stateStream),
      takeUntil(stateStream)
    );

    // after the response, pass events live
    const live$ = eventStream$.pipe(skipUntil(stateStream));

    // concat buffered events then live events
    const subscription = concat(buffered$, live$).subscribe((event) => {
      console.log(event);
    });

    return () => subscription.unsubscribe();
  }, [eventStream$, stateStream]);

  if (snapshotQuery.isError) {
    throw snapshotQuery.error;
  }
  useEffect(() => {
    if (firstUpdateId === null || !snapshotQuery.isSuccess) {
      return;
    }
    const snapshot = snapshotQuery.data;
    if (snapshot.lastUpdateId < firstUpdateId) {
      console.warn("Snapshot is older than first update, ignoring");
      snapshotQuery.refetch();
      return;
    }

    setState(snapshot);
    stateStream.next(snapshot);
  }, [firstUpdateId, state, symbol, snapshotQuery, stateStream]);

  useEffect(() => {
    // Create WebSocket connection.
    const socket = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol}@depth${levels}${speedSuffix}`
    );

    // Listen for messages
    socket.addEventListener("message", (event: MessageEvent) => {
      const data: OrderBookUpdate = JSON.parse(event.data);
      eventStream$.next(data);
      setFirstUpdateId((prev) => (prev === null ? data.U : prev));
    });

    return () => socket.close();
  }, [eventStream$, firstUpdateId, symbol]);

  return (
    <Stack width="100%" flex={1} direction="row" gap={2} p={2}>
      {state && (
        <>
          <OrderBookGrid prices={state.asks} side="Buy" />
          <OrderBookGrid prices={state.bids} side="Sell" />
        </>
      )}
    </Stack>
  );
}
const queryClient = new QueryClient();

export default function OrderBookView() {
  const base = useAtomValue(baseAtom);
  const quote = useAtomValue(quoteAtom);
  const symbol = useAtomValue(symbolAtom);

  return (
    <Stack width="100%" height="100%">
      <Typography variant="h6">
        Order Book - {base.toUpperCase()}/{quote.toUpperCase()}
      </Typography>
      <Stack width="100%" direction="row" justifyContent="end" gap={1}>
        <BaseSelector />
        <QuoteSelector />
      </Stack>
      <QueryClientProvider client={queryClient}>
        <OrderBook key={symbol} />
      </QueryClientProvider>
    </Stack>
  );
}
