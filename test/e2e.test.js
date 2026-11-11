import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { build, createServer, preview } from 'vite'
import puppeteer from 'puppeteer'

const root = fileURLToPath( new URL( `./fixture`, import.meta.url ) )

// Each mode boots a server and returns { url, close }
const modes = {

    dev: async () => {
        const server = await createServer( { root, server: { port: 0 } } )
        await server.listen()
        return { url: server.resolvedUrls.local[0], close: () => server.close() }
    },

    prod: async () => {
        await build( { root } )
        const server = await preview( { root, preview: { port: 0 } } )
        return { url: server.resolvedUrls.local[0], close: () => server.close() }
    },

}

// Use a system Chrome when present (container), else puppeteer's bundled one (CI)
const browser = await puppeteer.launch( { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } )
after( () => browser.close() )

Object.entries( modes ).forEach( ( [ mode, start ] ) => describe( `${ mode } build`, () => {

    let server, page
    before( async () => {
        server = await start()
        page = await browser.newPage()
        await page.goto( server.url )
    } )
    after( async () => {
        await page?.close()
        await server?.close()
    } )

    test( `evaluates the prefetched module in the background`, async () => {
        await page.waitForFunction( () => window.evaluated.includes( `prefetched` ), { timeout: 5_000 } )
        const evaluated = await page.evaluate( () => window.evaluated )
        assert.deepEqual( evaluated, [ `prefetched` ], `plain React.lazy page must not load early` )
    } )

    test( `renders the prefetched page without a fallback`, async () => {
        await page.click( `#open-prefetched` )
        await page.waitForSelector( `#prefetched-page` )
        assert.deepEqual( await page.evaluate( () => window.fallback_commits ), [] )
    } )

    test( `control: plain React.lazy still flashes its fallback`, async () => {
        await page.click( `#open-plain` )
        await page.waitForSelector( `#plain-page` )
        assert.deepEqual( await page.evaluate( () => window.fallback_commits ), [ `plain` ] )
    } )

    test( `recovers from a failed load when the error boundary resets`, async () => {

        // First load fails and lands in the error boundary
        await page.evaluate( () => window.fail_next_load = true )
        await page.click( `#open-flaky` )
        await page.waitForSelector( `#retry` )

        // Network is back, "try again" must render the page instead of the cached error
        await page.evaluate( () => window.fail_next_load = false )
        await page.click( `#retry` )
        await page.waitForSelector( `#flaky-page`, { timeout: 5_000 } )

    } )

} ) )
