import { useColorScheme } from "@mui/material";
import { colorSchemeDark, themeBalham } from "ag-grid-community";

const baseTheme = themeBalham;
const darkTheme = baseTheme.withPart(colorSchemeDark);

export default function useGridTheme() {
  const { mode, systemMode } = useColorScheme();
  const isDark =
    mode === "dark" || (mode === "system" && systemMode === "dark");

  return isDark ? darkTheme : baseTheme;
}
