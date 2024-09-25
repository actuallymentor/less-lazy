import { cache, log } from 'mentie'

/**
 * Adds a preload/prefetch link element to the head of the document for the given URL.
 * If a preload with the same URL already exists, it will not be added again.
 *
 * @param {string} href - The URL to be preloaded.
 * @param {Function} _memo_import - The memoized import function.
 * @param {Object} options - Options for the preload (default: { rel: "prefetch", force_in_memory: true }).
 * @param {string} options.rel - The rel attribute of the link element (default: "prefetch").
 * @param {boolean} options.force_in_memory - Whether to load the module into memory (default: true).
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload
 * @returns {void}
 */
function idempotent_add_link( href, _memo_import, options ) {

    // Option management
    const { rel="prefetch", force_in_memory=true } = options

    // Check if an element with this URL as src exists
    const _link = document.querySelector( `link[href="${ href }"]` )

    // Check if the link has the right rel attribute, if yes, return
    if( _link && _link.rel == rel ) return log.info( `[less-lazy] preload already exists for [rel=${ rel }][href=${ href }]` )
    
    // If link with wrong rel exists, remove it
    if( _link ) {
        log.info( `[less-lazy] Removing preload for ${ href } (rel=${ _link.rel })` )
        _link.remove()
    }

    // Get the head element
    const [ head ] = document.getElementsByTagName( 'head' )

    // Create the link element and set attributes
    const link = document.createElement( 'link' )
    link.rel = rel
    link.as = 'script'
    link.href = href

    // Attach a listener to the element that marks the element as loaded
    link.addEventListener( 'load', () => {
        log.info( `[less-lazy] preload downloaded for ${ href }` )
        link.setAttribute( 'data-loaded', 'true' )

        // Check if the module should be loaded into memory
        if( !force_in_memory ) return log.info( `[less-lazy] Preloaded module not loaded into memory as force_in_memory is false: ${ href }` )
        
        // Load the module into memory, note this is a promise run outside of the event loop
        _memo_import()
            .then( () => log.info( `[less-lazy] module loaded into memory: ${ href }` ) )
            .catch( error => log.error( `[less-lazy] failed to load module into memory: ${ href }`, error ) )
    
    } )

    // Append the link element
    head.appendChild( link )
    log.info( `[less-lazy] ${ rel } added for ${ href }:`, link )

}

/**
 * A function that lazily imports and caches modules.
 * @param {Function} _import - The import function to be memoized and preloaded.
 * @param {Object} options
 * @param {string} options.rel - The rel attribute of the link element (default: "prefetch").
 * @param {boolean} options.force_in_memory - Whether to load the module into memory (default: true).
 * @returns {Function} - The memoized import function.
 */
export function prefetch( _import, options={ rel: "prefetch", force_in_memory: true } ) {

    // Check if the import function is a function
    if( typeof _import != 'function' ) {
        log.error( `[less-lazy] import function is not a function: ${ _import }` )
        return _import
    }

    /* ///////////////////////////////
    // Import function handling
    // /////////////////////////////*/

    // Get cached import function so prefetch doesn't pass a different function to React.lazy in case the reference but not the value changes
    let _memo_import = cache( _import )

    // Return cached import function
    if( _memo_import ) return _memo_import

    // Cache (memoize) the import function
    log.info( `[less-lazy] caching import function: ${ _import }` )
    _memo_import = cache( _import, _import )

    /* ///////////////////////////////
    // Preloading
    // /////////////////////////////*/

    // Get the cached import path (functions when used as keys are cast as strings)
    let _import_path = cache( `${ _import }_path` )
    if( _import_path ) log.info( `[less-lazy] cache hit for import path: ${ _import }` )

    // Get the import path from the import function
    _import_path ||= _import.toString().match( /(?<=import\(")(.*)(?="\))/ )?.[0]
    if( !_import_path ) log.warn( `[less-lazy] could not extract import path from: ${ _import }` )

    // Cache the import path
    cache( `${ _import }_path`, _import_path )

    // Add the module url to the preload list
    if( _import_path ) idempotent_add_link( _import_path, _memo_import, options )
    
    // Return component import function
    return _memo_import

}