"use client";

import { Stack, Typography, useEventCallback } from "@mui/material";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { enableMapSet } from "immer";
import { atom, useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReplaySubject, take } from "rxjs";
import { useImmer } from "use-immer";
import OrderBookGrid from "./OrderBookGrid";
import BaseSelector, { BaseAsset, baseAtom } from "./selectors/BaseSelector";
import QuoteSelector, {
  QuoteAsset,
  quoteAtom,
} from "./selectors/QuoteSelector";
export type Symbol = `${BaseAsset}${QuoteAsset}`;

enableMapSet();
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

export type LocalState = {
  lastUpdateId: number;
  bids: Map<string, string>;
  asks: Map<string, string>;
};

function OrderBook() {
  const symbol = useAtomValue(symbolAtom);
  const [state, setState] = useImmer<LocalState>({
    lastUpdateId: -1,
    bids: new Map(),
    asks: new Map(),
  });
  const [hasInitial, setHasInitial] = useState(false);
  const [firstUpdateId, setFirstUpdateId] = useState<number | null>(null);
  const eventStream$ = useMemo(() => new ReplaySubject<OrderBookUpdate>(), []);
  // const stateStream$ = useMemo(() => new Subject<OrderBookState>(), []);

  const snapshotQuery = useQuery({
    queryFn: () =>
      fetch(
        `https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=5000`,
        { mode: "cors" },
      ).then(async (res) => {
        return (await res.json()) as OrderBookState;
      }),
    queryKey: ["snapshot", symbol],
    enabled: firstUpdateId !== null,
  });

  useEffect(() => {
    const subscription = eventStream$.pipe(take(1)).subscribe((event) => {
      setFirstUpdateId(event.U);
    });
    return () => subscription.unsubscribe();
  }, [eventStream$]);

  const stateRef = useRef(state);
  stateRef.current = state; // Keep it updated

  const handleEvent = useEventCallback((event: OrderBookUpdate) => {
    const currentState = stateRef.current; // Get the latest state

    setState((draft) => {
      console.log({ event, currentState });
      if (event.u < draft.lastUpdateId) {
        return;
      }
      if (event.U > draft.lastUpdateId) {
        throw "Gap in updates";
        // if (!snapshotQuery.isFetching) {
        //   snapshotQuery.refetch();
        //   setHasInitial(false);
        // }
        return;
      }

      for (const [price, amount] of event.b) {
        if (draft.bids.has(price) && amount === "0") {
          draft.bids.delete(price);
        } else {
          draft.bids.set(price, amount);
        }
      }

      for (const [price, amount] of event.a) {
        if (draft.asks.has(price) && amount === "0") {
          draft.asks.delete(price);
        } else {
          draft.asks.set(price, amount);
        }
      }

      draft.lastUpdateId = event.u;
    });
  });

  useEffect(() => {
    if (!hasInitial) {
      return;
    }
    const subscription = eventStream$.subscribe(handleEvent);
    return () => subscription.unsubscribe();
  }, [eventStream$, handleEvent, hasInitial]);

  if (snapshotQuery.isError) {
    throw snapshotQuery.error;
  }
  useEffect(() => {
    if (firstUpdateId === null || !snapshotQuery.isSuccess || hasInitial) {
      return;
    }
    const snapshot = snapshotQuery.data;
    if (snapshot.lastUpdateId < firstUpdateId) {
      console.warn("Snapshot is older than first update, ignoring");
      snapshotQuery.refetch();
      return;
    }

    setState({
      lastUpdateId: snapshot.lastUpdateId,
      bids: new Map(snapshot.bids),
      asks: new Map(snapshot.asks),
    });
    setHasInitial(true);
  }, [firstUpdateId, symbol, snapshotQuery, setState, hasInitial]);

  useEffect(() => {
    // Create WebSocket connection.
    const socket = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol}@depth${levels}${speedSuffix}`,
    );

    // Listen for messages
    socket.addEventListener("message", (event: MessageEvent) => {
      const data: OrderBookUpdate = JSON.parse(event.data);
      eventStream$.next(data);
    });

    return () => socket.close();
  }, [eventStream$, symbol]);

  return (
    <Stack width="100%" flex={1} direction="row" gap={2} p={2}>
      {state && (
        <>
          <OrderBookGrid prices={[...state.asks.entries()]} side="Buy" />
          <OrderBookGrid prices={[...state.bids.entries()]} side="Sell" />
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
