import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { atom, useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";

const decimalGroupingOptions = [0.01, 0.1, 1, 10, 50, 100] as const;
export type DecimalGrouping = (typeof decimalGroupingOptions)[number];

export const decimalGroupingAtom = atom<DecimalGrouping>(0.01);

export function useDecimalGroupingCallback() {
  const grouping = useAtomValue(decimalGroupingAtom);

  // exchange standard: use floor for bids, ceil for asks
  // e.g. 0.1 grouping: bid 99.95 -> 99.9, ask 99.95 -> 100.0
  return useCallback(
    (price: string, side: "ask" | "bid") =>
      (side === "bid" ? Math.floor : Math.ceil)(parseFloat(price) / grouping) *
      grouping,
    [grouping],
  );
}

export default function DecimalGroupingSelector() {
  const [decimalGrouping, setDecimalGrouping] = useAtom(decimalGroupingAtom);

  return (
    <FormControl sx={{ minWidth: 120 }} size="small">
      <InputLabel id="decimal-grouping-label">Decimal Grouping</InputLabel>
      <Select
        labelId="decimal-grouping-label"
        id="decimal-grouping"
        label="Decimal Grouping"
        value={decimalGrouping}
        onChange={(event) =>
          setDecimalGrouping(event.target.value as DecimalGrouping)
        }
      >
        {decimalGroupingOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
