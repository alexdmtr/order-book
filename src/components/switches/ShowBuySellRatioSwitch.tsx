import { FormControlLabel, Switch } from "@mui/material";
import { atom, useAtom } from "jotai";

export const showBuySellRatioAtom = atom(true);

export default function ShowBuySellRatioSwitch() {
  const [showBuySellRatio, setShowBuySellRatio] = useAtom(showBuySellRatioAtom);

  return (
    <FormControlLabel
      control={
        <Switch
          checked={showBuySellRatio}
          onChange={(event) => setShowBuySellRatio(event.target.checked)}
        />
      }
      label="Show Buy/Sell Ratio"
    />
  );
}
