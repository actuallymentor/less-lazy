import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Resolve the package to the local source so tests exercise the working tree
export default defineConfig( {
    root: fileURLToPath( new URL( `.`, import.meta.url ) ),
    plugins: [ react() ],
    resolve: { alias: { 'less-lazy': fileURLToPath( new URL( `../../index.js`, import.meta.url ) ) } },
    logLevel: `warn`,
} )
