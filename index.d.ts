/** Runs a callback once the page has loaded and the browser is idle */
export function when_idle( callback: () => void ): void

export interface PrefetchOptions {
    /** Scheduler that receives the prefetch callback, or false for manual prefetching. Default: when_idle */
    when?: ( ( prefetch: () => void ) => void ) | false
}

/** Wraps a dynamic import so it loads in the background; pass the result to React.lazy */
export function prefetch<T>( load: () => Promise<T>, options?: PrefetchOptions ): () => PromiseLike<T>
