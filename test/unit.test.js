import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prefetch } from '../app.js'

// Counts calls so we can assert memoization
const counting_loader = ( result={ default: `module` } ) => {
    const loader = async () => {
        loader.calls++
        return result
    }
    loader.calls = 0
    return loader
}

test( `memoizes concurrent loads into one import`, async () => {
    const loader = counting_loader()
    const memo = prefetch( loader )
    const [ a, b ] = await Promise.all( [ memo(), memo() ] )
    assert.equal( loader.calls, 1 )
    assert.equal( a, b )
} )

test( `returns a synchronous thenable once loaded so React.lazy never suspends`, async () => {
    const module = { default: `module` }
    const memo = prefetch( counting_loader( module ) )
    await memo()

    // The callback must run before the next line, not on a microtask
    let resolved = null
    memo().then( value => resolved = value )
    assert.equal( resolved, module )

    // Still chainable like a promise
    assert.equal( await memo().then( ( { default: name } ) => name ), `module` )
} )

test( `retries after a failed load`, async () => {
    let attempt = 0
    const memo = prefetch( async () => {
        if( attempt++ == 0 ) throw new Error( `network down` )
        return { default: `ok` }
    } )
    await assert.rejects( memo(), /network down/ )
    assert.deepEqual( await memo(), { default: `ok` } )
} )

test( `does not prefetch outside the browser`, () => {
    let scheduled = false
    prefetch( counting_loader(), { when: () => scheduled = true } )
    assert.equal( scheduled, false )
} )

test( `cached promise forwards values and turns handler errors into rejections`, async () => {
    const memo = prefetch( counting_loader() )
    await memo()
    assert.deepEqual( await memo().then(), { default: `module` } )
    await assert.rejects( memo().then( () => { throw new Error( `boom` ) } ), /boom/ )
} )

test( `.prefetch() never rejects, even when the loader throws synchronously`, async () => {
    const memo = prefetch( () => { throw new Error( `sync fail` ) } )
    await memo.prefetch()
} )

test( `passes non-functions through untouched`, () => {
    assert.equal( prefetch( `nope` ), `nope` )
} )
