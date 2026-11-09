# Changelog

## 1.0.0 — 2026-11-09

**Breaking**
- Removed `rel` and `force_in_memory` options. Modules are always downloaded and evaluated
- New `when` option: custom scheduler, or `false` for manual prefetching

**Fixed**
- Production builds never prefetched: the import path was regex-parsed from `fn.toString()`, which broke on minified output (backticks) and chunk-relative URLs. The import function is now called directly, so the bundler resolves the URL
- Fallback still flashed after a prefetch. Loaded modules now resolve `React.lazy` synchronously

**Added**
- `when_idle` export: waits for page load, then idle time
- TypeScript types, `exports` map, React peer dependency
- Unit + Puppeteer e2e tests against Vite dev and prod builds, CI test gate before publish

**Changed**
- Dependencies updated: `mentie` 0.5, Node 26 LTS in `.nvmrc`
- Dropped `mentie` `cache`; memoization is a closure

## 0.0.2

- Initial release
