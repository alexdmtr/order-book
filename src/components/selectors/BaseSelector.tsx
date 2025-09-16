import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { atom, useAtom } from "jotai";
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
export type BaseAsset = (typeof baseAssets)[number];

export const baseAtom = atom<BaseAsset>("btc");

export default function BaseSelector() {
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
