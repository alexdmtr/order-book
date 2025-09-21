import { Box, Typography, useTheme } from "@mui/material";
import { useMemo } from "react";
import { LocalBookState } from "./OrderBook";
import { depth } from "./OrderBookGrid";
import useBucketBrices from "./useBucketBrices";

export interface BuySellRatioProgressBarProps {
  book: LocalBookState;
}

export default function BuySellRatioProgressBar({
  book: { asks, bids },
}: BuySellRatioProgressBarProps) {
  const bucketPrices = useBucketBrices();

  const buySellRatio = useMemo(() => {
    const askEntries = bucketPrices(asks, "ask")
      .toArray()
      .sort((a, b) => a.price - b.price)
      .slice(0, depth);

    const bidEntries = bucketPrices(bids, "bid")
      .toArray()
      .sort((a, b) => b.price - a.price)
      .slice(0, depth);

    const buyVolume = bidEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const sellVolume = askEntries.reduce((sum, entry) => sum + entry.amount, 0);

    const totalVolume = buyVolume + sellVolume;
    return totalVolume === 0 ? 0.5 : buyVolume / totalVolume;
  }, [asks, bids, bucketPrices]);

  const buyPercent = Math.round(buySellRatio * 10000) / 100;
  const sellPercent = 100 - buyPercent;
  const theme = useTheme();

  return (
    <Box sx={{ width: 600 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          Buy {buyPercent.toFixed(2)}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sell {sellPercent.toFixed(2)}%
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          height: 10,
          mt: 1,
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${buyPercent}%`,
            backgroundColor: theme.palette.success.main,
          }}
        />
        <Box
          sx={{
            width: `${sellPercent}%`,
            backgroundColor: theme.palette.error.main,
          }}
        />
      </Box>
    </Box>
  );
}
