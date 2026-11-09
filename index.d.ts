/** Runs a callback once the page has loaded and the browser is idle */
export function when_idle( callback: () => void ): void

export interface PrefetchOptions {
    /** Scheduler that receives the prefetch callback, or false for manual prefetching. Default: when_idle */
    when?: ( ( prefetch: () => void ) => void ) | false
}

/** Memoized import function, pass it to React.lazy */
export interface PrefetchedLoader<T> {
    (): Promise<T>
    /** Starts the load in the background, never rejects. Safe for event handlers */
    prefetch(): Promise<void>
}

/** Wraps a dynamic import so it loads in the background */
export function prefetch<T>( load: () => Promise<T>, options?: PrefetchOptions ): PrefetchedLoader<T>
