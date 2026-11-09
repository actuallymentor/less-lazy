import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Type-check the documented usage as a TypeScript consumer would
test( `types: lazy( prefetch( ... ) ) compiles`, () => {
    const project = fileURLToPath( new URL( `./types/tsconfig.json`, import.meta.url ) )
    execFileSync( `npx`, [ `tsc`, `-p`, project ], { stdio: `inherit` } )
} )
