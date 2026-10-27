# Web app

SvelteKit shell around [`complexity-automata-svelte`](../../packages/complexity-automata-svelte).
Everything on screen is the `AutomataApp` component; this app only supplies the
page, the metadata and the URL handling.

```bash
bun run dev        # localhost:5173
bun run build      # static bundle in build/
bun run preview
bun run deploy     # wrangler deploy
```

## URL parameters

| | |
| --- | --- |
| `?demo=fractal` | open straight into a demo |
| `?intro=0` | skip the intro screen |
| `?cell=6` | CSS pixels per cell — bigger cells, smaller universe |
| `?u=…` | open a shared universe |

## How it is built

`adapter-static` with an `index.html` fallback, rendered entirely on the client
(`ssr = false` — the app is a canvas, so there is nothing useful to render on a
server). That single `build/` directory is what Cloudflare serves *and* what
Capacitor copies into the Android app, so the two can never drift apart.

Because rendering is client-side, the page title and social metadata live in
`src/app.html` rather than in a `<svelte:head>`.
