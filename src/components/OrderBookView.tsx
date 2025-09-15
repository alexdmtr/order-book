"use client";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { atom, useAtom, useAtomValue } from "jotai";

const baseAssets = [
  "btc",
  "eth",
  "bnb",
  "xrp",
  "ada",
  "sol",
  "dot",
  "doge",
] as const;
type BaseAsset = (typeof baseAssets)[number];
const quoteAssets = ["usdt", "usdc", "busd", "eur", "gbp"] as const;
type QuoteAsset = (typeof quoteAssets)[number];
export type Symbol = `${BaseAsset}${QuoteAsset}`;

function DepthSelector() {
  return (
    <FormControl sx={{ minWidth: 120 }} size="small">
      <InputLabel id="demo-simple-select-label">Age</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        // value={age}
        label="Age"
        // onChange={handleChange}
      >
        <MenuItem value={10}>Ten</MenuItem>
        <MenuItem value={20}>Twenty</MenuItem>
        <MenuItem value={30}>Thirty</MenuItem>
      </Select>
    </FormControl>
  );
}

function DecimalGroupingSelector() {
  return <div>Decimal </div>;
}

const baseAtom = atom<BaseAsset>("btc");
const quoteAtom = atom<QuoteAsset>("usdt");
const symbolAtom = atom<Symbol>((get) => {
  const base = get(baseAtom);
  const quote = get(quoteAtom);
  return `${base}${quote}`;
});

function BaseSelector() {
  const [base, setBase] = useAtom(baseAtom);

  return (
    <FormControl sx={{ minWidth: 120 }} size="small">
      <InputLabel id="base-asset-label">Base</InputLabel>
      <Select
        labelId="base-asset-label"
        id="base-asset"
        label="Base"
        value={base}
        onChange={(event) => setBase(event.target.value as BaseAsset)}
      >
        {baseAssets.map((base) => (
          <MenuItem key={base} value={base}>
            {base.toUpperCase()}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function QuoteSelector() {
  const [quote, setQuote] = useAtom(quoteAtom);

  return (
    <FormControl sx={{ minWidth: 120 }} size="small">
      <InputLabel id="quote-asset-label">Quote</InputLabel>
      <Select
        labelId="quote-asset-label"
        id="quote-asset"
        label="Quote"
        value={quote}
        onChange={(event) => setQuote(event.target.value as QuoteAsset)}
      >
        {quoteAssets.map((quote) => (
          <MenuItem key={quote} value={quote}>
            {quote.toUpperCase()}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

const symbol: Symbol = "btcusdt";
const levels = "@100ms"; // @5@10@100ms
const speedSuffix = ""; // @100ms

// Create WebSocket connection.
const socket = new WebSocket(
  `wss://stream.binance.com:9443/ws/${symbol}@depth${levels}${speedSuffix}`
);

// Connection opened
socket.addEventListener("open", (event) => {
  socket.send("Hello Server!");
});

// Listen for messages
socket.addEventListener("message", (event) => {
  console.log("Message from server ", event.data);
});

export default function OrderBookView() {
  const base = useAtomValue(baseAtom);
  const quote = useAtomValue(quoteAtom);
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
    </Stack>
  );
}
