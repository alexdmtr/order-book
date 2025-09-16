import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

export default function DepthSelector() {
  return (
    <FormControl sx={{ minWidth: 120 }} size="small">
      <InputLabel id="depth-select-label">Depth</InputLabel>
      <Select labelId="depth-select-label" id="depth-select" label="Depth">
        <MenuItem value={10}>Ten</MenuItem>
        <MenuItem value={20}>Twenty</MenuItem>
        <MenuItem value={30}>Thirty</MenuItem>
      </Select>
    </FormControl>
  );
}
