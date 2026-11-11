# Changelog

## 2.0.0 — 2026-11-11

**Breaking**
- One export: `lazy( () => import(), { prefetch } )` replaces `React.lazy( prefetch( ... ) )`
- `when` option replaced by `prefetch: 'idle' | 'eager' | false`; `when_idle` no longer exported
- Throws a `TypeError` on a non-function loader instead of logging

**Fixed**
- Failed loads are now recoverable: an error boundary reset retries instead of rethrowing the cached error (React 18 and 19)

**Changed**
- Zero dependencies: dropped `mentie`, failed prefetches log via `console.warn`
- Entry file renamed to `index.js`
- CI tests React 18, 19 and canary (weekly), and creates a GitHub release on publish

## 1.0.0 — 2026-11-09

**Breaking**
- Removed `rel` and `force_in_memory` options. Modules are always downloaded and evaluated
- New `when` option: custom scheduler, or `false` for manual prefetching

**Fixed**
- Production builds never prefetched: the import path was regex-parsed from `fn.toString()`, which broke on minified output (backticks) and chunk-relative URLs. The import function is now called directly, so the bundler resolves the URL
- Fallback still flashed after a prefetch. Loaded modules now resolve `React.lazy` synchronously

**Added**
- `when_idle` export: waits for page load, then idle time
- `loader.prefetch()`: never-rejecting background trigger for event handlers (hover intent)
- TypeScript types, `exports` map, React peer dependency
- Unit, TypeScript consumer, and Puppeteer e2e tests against Vite dev and prod builds, CI test gate before publish
- CI publishes whenever `package.json` holds a version not yet on npm

**Changed**
- Dependencies updated: `mentie` 0.5, Node 26 LTS in `.nvmrc`
- Dropped `mentie` `cache`; memoization is a closure

## 0.0.2

- Initial release
