import { useColorScheme } from "@mui/material";
import { colorSchemeDark, themeBalham } from "ag-grid-community";

const darkTheme = themeBalham.withPart(colorSchemeDark);

export default function useGridTheme() {
  const { mode, systemMode } = useColorScheme();
  const isDark =
    mode === "dark" || (mode === "system" && systemMode === "dark");

  return isDark ? darkTheme : themeBalham;
}
