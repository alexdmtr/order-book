# Order Book

Deployed at [https://order-book-phi-peach.vercel.app/](https://order-book-phi-peach.vercel.app/).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technology choices

- Material UI: industry-standard UI components
- AG Grid: high performance grid library
- Jotai: quick and easy local state management
- Bootstrapped and deployed via Next.js for quick deployments on Vercel
- - No critical SSR functions have been used

## TBD

- [ ] Seamless reset when book is out of sync
- [ ] Animations
- [ ] Highlight the elements closest to the center on hover
- [ ] Code cleanup

## References

- MUI/NextJS integration https://mui.com/material-ui/integrations/nextjs/
- Binance API docs https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams#partial-book-depth-streams
