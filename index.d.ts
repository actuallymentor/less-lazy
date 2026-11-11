import type { ComponentType, LazyExoticComponent } from 'react'

export interface LazyOptions {
    /** When to load: once the browser is idle, immediately, or only on `.prefetch()`. Default: 'idle' */
    prefetch?: 'idle' | 'eager' | false
}

/** Same type as React.lazy's result (refs, defaultProps), plus a background trigger */
export type PrefetchedComponent<T extends ComponentType<any>> = LazyExoticComponent<T> & {
    /** Starts the load in the background, never rejects. Safe for event handlers */
    prefetch(): Promise<void>
}

/** Drop-in for React.lazy that loads the module in the background so it renders without a Suspense flash */
export function lazy<T extends ComponentType<any>>( load: () => Promise<{ default: T }>, options?: LazyOptions ): PrefetchedComponent<T>
