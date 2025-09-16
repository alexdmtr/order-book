import type { Metadata } from "next";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../theme";
import { Roboto } from "next/font/google";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});
export const metadata: Metadata = {
  title: "Order Book",
  description:
    "A simple order book application built with Next.js and Material-UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <AppBar position="sticky">
              <Toolbar variant="dense">
                <Typography variant="h6" color="inherit" component="div">
                  Order Book
                </Typography>
              </Toolbar>
            </AppBar>
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
