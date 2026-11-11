import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lazy } from '../index.js'

test( `throws on a non-function loader`, () => {
    assert.throws( () => lazy( `nope` ), TypeError )
} )

test( `does not prefetch outside the browser`, () => {
    let calls = 0
    lazy( async () => calls++, { prefetch: `eager` } )
    assert.equal( calls, 0 )
} )

test( `.prefetch() loads once and shares the request`, async () => {
    let calls = 0
    const Page = lazy( async () => ( calls++, { default: () => null } ), { prefetch: false } )
    await Promise.all( [ Page.prefetch(), Page.prefetch() ] )
    assert.equal( calls, 1 )
} )

test( `.prefetch() never rejects, even when the loader throws synchronously`, async () => {
    const warn = console.warn
    console.warn = () => {}
    try {
        const Page = lazy( () => { throw new Error( `sync fail` ) }, { prefetch: false } )
        assert.equal( await Page.prefetch(), undefined )
    } finally {
        console.warn = warn
    }
} )

test( `.prefetch() retries after a failure`, async () => {
    let attempt = 0
    const warn = console.warn
    console.warn = () => {}
    try {
        const Page = lazy( async () => {
            if( attempt++ == 0 ) throw new Error( `network down` )
            return { default: () => null }
        }, { prefetch: false } )
        await Page.prefetch()
        await Page.prefetch()
        assert.equal( attempt, 2 )
    } finally {
        console.warn = warn
    }
} )
