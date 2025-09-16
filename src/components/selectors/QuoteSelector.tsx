import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { atom, useAtom } from "jotai";

const quoteAssets = ["usdt", "usdc", "busd", "eur", "gbp"] as const;
export type QuoteAsset = (typeof quoteAssets)[number];

export const quoteAtom = atom<QuoteAsset>("usdt");

export default function QuoteSelector() {
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
