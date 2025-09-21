import { Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { Subject, take, withLatestFrom } from "rxjs";
import { showBuySellRatioAtom } from "../switches/ShowBuySellRatioSwitch";
import BuySellRatioProgressBar from "./BuySellRatioProgressBar";
import OrderBookGrid from "./OrderBookGrid";

export type LocalBookState = {
  lastUpdateId: number;
  bids: Map<string, string>;
  asks: Map<string, string>;
};

type OrderBookState = {
  lastUpdateId: number;
  bids: PriceQtyPair[];
  asks: PriceQtyPair[];
};

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

const levels = "@1000ms"; // @5@10@100ms
const speedSuffix = ""; // @100ms

export interface OrderBookProps {
  symbol: string;
}

export default function OrderBook({ symbol }: OrderBookProps) {
  const [displayState, setDisplayState] = useState<LocalBookState>({
    lastUpdateId: -1,
    bids: new Map(),
    asks: new Map(),
  });
  const [hasInitial, setHasInitial] = useState(false);
  const [firstUpdateId, setFirstUpdateId] = useState<number | null>(null);
  const eventStream$ = useMemo(() => new Subject<OrderBookUpdate>(), []);
  const stateStream$ = useMemo(() => new Subject<LocalBookState>(), []);

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

  const snapshotQuery = useQuery({
    queryFn: () =>
      fetch(
        `https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=5000`,
        { mode: "cors" },
      ).then(async (res) => {
        return (await res.json()) as OrderBookState;
      }),
    queryKey: ["snapshot", symbol],
  });

  useEffect(() => {
    const subscription = eventStream$.pipe(take(1)).subscribe((event) => {
      setFirstUpdateId(event.U);
    });
    return () => subscription.unsubscribe();
  }, [eventStream$]);

  useEffect(() => {
    const subscription = eventStream$
      .pipe(withLatestFrom(stateStream$))
      .subscribe(([event, state]) => {
        if (event.u < state.lastUpdateId) {
          return;
        }
        if (event.U > state.lastUpdateId + 1) {
          console.error("Gap in updates", {
            gap: event.U - state.lastUpdateId,
          });
          // TODO: trigger refetch and buffer
        }

        const bids = new Map(state.bids);
        const asks = new Map(state.asks);

        for (const [price, amount] of event.b) {
          if (bids.has(price) && parseFloat(amount) === 0) {
            bids.delete(price);
          } else if (parseFloat(amount) !== 0) {
            bids.set(price, amount);
          }
        }

        for (const [price, amount] of event.a) {
          if (asks.has(price) && parseFloat(amount) === 0) {
            asks.delete(price);
          } else if (parseFloat(amount) !== 0) {
            asks.set(price, amount);
          }
        }

        stateStream$.next({ lastUpdateId: event.u, bids, asks });
      });
    return () => subscription.unsubscribe();
  }, [eventStream$, stateStream$]);

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

    const state = {
      lastUpdateId: snapshot.lastUpdateId,
      bids: new Map(snapshot.bids),
      asks: new Map(snapshot.asks),
    };
    stateStream$.next(state);
    setHasInitial(true);
  }, [firstUpdateId, symbol, snapshotQuery, hasInitial, stateStream$]);

  useEffect(() => {
    const subscription = stateStream$
      // .pipe(throttleTime(1000))
      .subscribe((state) => {
        console.log("Display update", state);
        setDisplayState(state);
      });
    return () => subscription.unsubscribe();
  }, [stateStream$]);

  const showProgressBar = useAtomValue(showBuySellRatioAtom);

  return (
    <Stack width="100%" flex={1} gap={2} p={2}>
      <OrderBookGrid
        asks={displayState.asks}
        bids={displayState.bids}
        isLoading={displayState.lastUpdateId === -1}
      />
      {showProgressBar ? <BuySellRatioProgressBar book={displayState} /> : null}
    </Stack>
  );
}
