import {
  capitalize,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { atom, useAtom } from "jotai";

const depthVisualisationOptions = ["amount", "cumulative"] as const;
export type DepthVisualisation = (typeof depthVisualisationOptions)[number];

export const depthVisualisationAtom = atom<DepthVisualisation>("amount");

export default function DepthVisualisationSelector() {
  const [depthVisualisation, setDepthVisualisation] = useAtom(
    depthVisualisationAtom,
  );

  return (
    <FormControl sx={{ minWidth: 150 }} size="small">
      <InputLabel id="depth-visualisation-label">
        Depth Visualisation
      </InputLabel>
      <Select
        labelId="depth-visualisation-label"
        id="depth-visualisation"
        label="Depth Visualisation"
        value={depthVisualisation}
        onChange={(event) =>
          setDepthVisualisation(event.target.value as DepthVisualisation)
        }
      >
        {depthVisualisationOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {capitalize(option)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
