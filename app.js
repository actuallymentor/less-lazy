import { log } from 'mentie'

/**
 * Runs a callback once the page has fully loaded and the browser is idle,
 * so prefetching never competes with the first paint.
 * @param {Function} callback - Work to run when idle
 * @returns {void}
 */
export function when_idle( callback ) {

    // Safari has no requestIdleCallback, a short timeout is a decent stand-in
    const idle = globalThis.requestIdleCallback ?? ( fn => setTimeout( fn, 200 ) )
    const schedule = () => idle( callback )

    // Wait for the load event so critical resources go first
    if( document.readyState == `complete` ) return schedule()
    window.addEventListener( `load`, schedule, { once: true } )

}

/**
 * Wraps a dynamic import so the module is downloaded and evaluated in the background,
 * making a later React.lazy render instant instead of flashing the Suspense fallback.
 *
 * Call it at module scope, like React.lazy itself.
 *
 * @param {Function} load - Import function, e.g. `() => import( './Page' )`
 * @param {Object} [options]
 * @param {Function|false} [options.when=when_idle] - Scheduler that receives the prefetch callback, or false to only prefetch when you call the returned function yourself
 * @returns {Function} Memoized import function, pass it to React.lazy
 */
export function prefetch( load, { when=when_idle } = {} ) {

    // Guard against misuse, return input so React.lazy produces its own error
    if( typeof load != `function` ) {
        log.error( `[less-lazy] expected an import function, got:`, load )
        return load
    }

    // Memoize the import promise so prefetch and React.lazy share one load, reset on failure so a retry is possible
    let loading = null
    let loaded = null
    const memo_load = () => {

        // Once loaded, hand React a synchronous thenable so lazy resolves without suspending at all
        if( loaded ) return { then: resolve => Promise.resolve( resolve?.( loaded ) ) }

        loading ??= load()
            .then( module => loaded = module )
            .catch( error => {
                loading = null
                throw error
            } )

        return loading

    }

    // Nothing to prefetch outside the browser (SSR, tests) or when manual mode is requested
    if( typeof window == `undefined` || !when ) return memo_load

    // Schedule the background load, failures are not fatal since React.lazy will retry on render
    when( () => Promise.resolve( memo_load() )
        .then( () => log.info( `[less-lazy] prefetched:`, load ) )
        .catch( error => log.warn( `[less-lazy] prefetch failed, will retry on render:`, error ) )
    )

    return memo_load

}
