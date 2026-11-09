# less-lazy: prefetched loading for React.lazy

Keep your main bundle small with `React.lazy`, but download and run the code for likely next pages in the background, so they render instantly with no `Suspense` flash.

- No dependencies besides a logger, ~60 lines, works with any bundler that supports `import()` (Vite, webpack, Rollup, esbuild)
- Tested end to end against Vite dev **and** production builds in real Chrome

**Contents:** [Install](#install) · [Usage](#usage) · [Options](#options) · [How it works](#how-it-works) · [When to use it](#when-to-use-it) · [Development](#development)

## Install

```bash
npm i less-lazy
```

## Usage

```jsx
import { Suspense, lazy } from 'react'
import { prefetch } from 'less-lazy'

// Plain lazy: loads on first render, flashes the fallback
const Profile = lazy( () => import( './pages/Profile' ) )

// less-lazy: loads when the browser is idle, renders instantly later
const Details = lazy( prefetch( () => import( './pages/Details' ) ) )

export const App = () => <Suspense fallback={ <Spinner /> }>
    <Details />
</Suspense>
```

Call `prefetch` at module scope, same as `React.lazy`.

## Options

`prefetch( load, { when } )`

| Option | Default | Meaning |
| --- | --- | --- |
| `when` | `when_idle` | Scheduler that gets the prefetch callback. `false` = manual |

`when_idle` waits for the `load` event, then `requestIdleCallback` (or a 200ms timeout in Safari).

Custom triggers:

```jsx
import { prefetch, when_idle } from 'less-lazy'

// Start right away
const Now = lazy( prefetch( () => import( './Now' ), { when: run => run() } ) )

// Manual, e.g. on hover intent. .prefetch() never rejects, safe for handlers
const load_settings = prefetch( () => import( './Settings' ), { when: false } )
const Settings = lazy( load_settings )
<Link to="/settings" onMouseEnter={ load_settings.prefetch }>Settings</Link>
```

### Debugging

Logs go through [`mentie`](https://www.npmjs.com/package/mentie). Shown on `localhost`, add `?loglevel=info` elsewhere. Prefix: `[less-lazy]`.

## How it works

1. `prefetch` wraps your import function and memoizes it, so the background load and `React.lazy` share one request
2. When idle, it calls the import. The bundler resolves the real chunk URL (hashes, `base`, CDN), and the module is downloaded **and** evaluated
3. Once loaded, the wrapper hands `React.lazy` a synchronous thenable, so React resolves the component without suspending: zero fallback frames
4. A failed prefetch is forgotten, so the render tries again

## When to use it

- Pages most users will see, but not first (e.g. product details): use `prefetch`
- Pages few users open that pull in heavy code (e.g. image editor): plain `React.lazy`
- Small pages or common landing pages: no lazy loading

Router-level alternatives: React Router / TanStack Router intent preloading, Next.js `<Link>`. less-lazy fits plain `React.lazy` setups.

## Development

```bash
npm test   # node:test unit tests + Puppeteer e2e against Vite dev and prod builds
```

Set `PUPPETEER_EXECUTABLE_PATH` to use a system Chrome. The fixture app lives in `test/fixture`.
