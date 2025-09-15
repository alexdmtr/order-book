import OrderBookView from "@/components/OrderBookView";
import { Box, Breadcrumbs } from "@mui/material";

export default function Home() {
  return (
    <main>
      <Breadcrumbs aria-label="breadcrumb" sx={{ p: 2 }}>
        <div>Exchange</div>
        <Box color="text.primary">Order Book</Box>
      </Breadcrumbs>
      <OrderBookView />
    </main>
  );
}
