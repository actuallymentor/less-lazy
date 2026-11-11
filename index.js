import { Component, createElement, forwardRef, lazy as react_lazy } from 'react'

/**
 * Runs a callback once the page has fully loaded and the browser is idle,
 * so prefetching never competes with the first paint.
 * @param {Function} callback - Work to run when idle
 * @returns {void}
 */
const when_idle = callback => {

    // Safari has no requestIdleCallback, a short timeout is a decent stand-in
    const idle = globalThis.requestIdleCallback ?? ( fn => setTimeout( fn, 200 ) )
    const schedule = () => idle( callback )

    // Wait for the load event so critical resources go first
    if( document.readyState == `complete` ) return schedule()
    window.addEventListener( `load`, schedule, { once: true } )

}

// Prefetch modes, each receives the background load callback
const schedulers = {
    idle: when_idle,
    eager: callback => callback(),
}

/**
 * Makes a real, already resolved promise whose `then` runs its callback inline.
 * React.lazy reads `.then` synchronously, so it gets the module without ever suspending.
 * @param {*} value - Resolved value
 * @returns {Promise} Promise that behaves normally, just without the microtask delay
 */
const instant_promise = value => {
    const promise = Promise.resolve( value )
    promise.then = ( resolve=v => v ) => new Promise( settle => settle( resolve( value ) ) )
    return promise
}

/**
 * Drop-in for React.lazy that downloads and evaluates the module in the background,
 * so the component renders instantly later instead of flashing the Suspense fallback.
 *
 * Call it at module scope, like React.lazy itself.
 *
 * @param {Function} load - Import function, e.g. `() => import( './Page' )`
 * @param {Object} [options]
 * @param {'idle'|'eager'|false} [options.prefetch='idle'] - When to load: once the browser is idle, immediately, or only when `.prefetch()` is called
 * @returns {Function} Lazy component with a never-rejecting `.prefetch()`, e.g. for hover intent
 */
export function lazy( load, { prefetch='idle' } = {} ) {

    if( typeof load != `function` ) throw new TypeError( `[less-lazy] expected an import function, got: ${ load }` )

    // Memoize the import so the background load and render share one request
    let loading = null
    let loaded = null
    const memo_load = () => {

        // Once loaded, skip the microtask so React.lazy resolves without suspending at all
        if( loaded ) return loaded

        loading ??= load()
            .then( module => {
                loaded = instant_promise( module )
                return module
            } )
            .catch( error => {
                loading = null
                throw error
            } )

        return loading

    }

    // React.lazy caches a failed load forever, so keep a swappable instance
    let Current = react_lazy( memo_load )

    // Once a load error is committed, swap in a fresh instance, then pass the error on to the app's boundary.
    // Its next render (e.g. a "try again" reset) loads anew. The swap must happen in the commit phase:
    // React 18 discards and repeats failed renders, so an earlier swap makes it retry in a loop
    class Retry extends Component {
        state = { error: null, rethrow: false }
        static getDerivedStateFromError( error ) {
            return { error }
        }
        componentDidCatch() {
            if( !loaded ) Current = react_lazy( memo_load )
            this.setState( { rethrow: true } )
        }
        render() {
            const { error, rethrow } = this.state
            if( rethrow ) throw error
            if( error ) return null
            return createElement( Current, this.props.forwarded )
        }
    }

    const Lazy = forwardRef( ( props, ref ) => createElement( Retry, { forwarded: { ...props, ref } } ) )

    // Background load, failures are only logged since rendering will try again
    Lazy.prefetch = () => Promise.resolve()
        .then( memo_load )
        .then( () => undefined )
        .catch( error => console.warn( `[less-lazy] prefetch failed, will retry on render:`, error ) )

    // Nothing to schedule outside the browser (SSR, tests) or in manual mode
    const schedule = schedulers[ prefetch ]
    if( typeof window != `undefined` && schedule ) schedule( Lazy.prefetch )

    return Lazy

}
