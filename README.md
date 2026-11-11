# less-lazy: React.lazy, minus the loading flash

Drop-in replacement for `React.lazy`. Keeps your main bundle small, but downloads and runs the code for likely next pages in the background, so they render instantly. No `Suspense` flash.

- Zero dependencies, ~100 lines, any bundler with `import()` (Vite, webpack, Rollup, esbuild)
- Recovers from failed loads: an error boundary "try again" actually retries
- Tested end to end in real Chrome against Vite dev and production builds, on React 18, 19 and canary

**Contents:** [Install](#install) · [Usage](#usage) · [Options](#options) · [How it works](#how-it-works) · [When to use it](#when-to-use-it) · [Development](#development)

## Install

```bash
npm i less-lazy
```

## Usage

```jsx
import { Suspense } from 'react'
import { lazy } from 'less-lazy'

// Same signature as React.lazy, loads in the background once the browser is idle
const Details = lazy( () => import( './pages/Details' ) )

export const App = () => <Suspense fallback={ <Spinner /> }>
    <Details />
</Suspense>
```

Call `lazy` at module scope, same as `React.lazy`.

## Options

`lazy( load, { prefetch } )`

| `prefetch` | Loads |
| --- | --- |
| `'idle'` (default) | After the `load` event, when the browser is idle |
| `'eager'` | Immediately |
| `false` | Only when you call `.prefetch()` |

Every component has `.prefetch()`, which starts the load and never rejects. That makes it safe in event handlers:

```jsx
// Load on hover intent instead of idle time
const Settings = lazy( () => import( './Settings' ), { prefetch: false } )

<Link to="/settings" onMouseEnter={ Settings.prefetch }>Settings</Link>
```

Failed background loads log a `console.warn` prefixed `[less-lazy]`.

## How it works

1. The import is memoized, so the background load and the render share one request
2. Calling the import lets the bundler resolve the real chunk URL (hashes, `base`, CDN). The module is downloaded **and** evaluated
3. Once loaded, `React.lazy` gets a promise that resolves synchronously, so React renders without suspending: zero fallback frames
4. `React.lazy` caches failures forever. less-lazy swaps in a fresh instance after a failure reaches your error boundary, so its reset retries the load

## When to use it

- Pages most users will see, but not first (e.g. product details): `lazy` from less-lazy
- Pages few users open that pull in heavy code (e.g. image editor): `prefetch: false` + `.prefetch()` on intent, or plain `React.lazy`
- Small pages or common landing pages: no lazy loading
- SSR: components already in the server HTML hydrate as usual. The gain is for components rendered after hydration

Router-level alternatives: React Router / TanStack Router intent preloading, Next.js `<Link>`.

## Upgrading from 1.x

```diff
- import { prefetch } from 'less-lazy'
- const Page = lazy( prefetch( () => import( './Page' ) ) )
+ import { lazy } from 'less-lazy'
+ const Page = lazy( () => import( './Page' ) )
```

`when: false` becomes `prefetch: false`. `when_idle` is now the default `'idle'` mode.

## Development

```bash
npm test   # unit + TypeScript consumer + Puppeteer e2e (Vite dev and prod builds)
```

Set `PUPPETEER_EXECUTABLE_PATH` to use a system Chrome. The fixture app lives in `test/fixture`. CI runs React 18, 19 and canary (weekly too). It publishes and creates a GitHub release whenever `main` has a version npm doesn't.
