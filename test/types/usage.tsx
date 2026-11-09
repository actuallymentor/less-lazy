// Compile-only check: documented usage must type-check against React's own types
import { lazy } from 'react'
import { prefetch, when_idle } from 'less-lazy'

const Page = () => null

export const Auto = lazy( prefetch( async () => ( { default: Page } ) ) )
export const Idle = lazy( prefetch( async () => ( { default: Page } ), { when: when_idle } ) )

const load_manual = prefetch( async () => ( { default: Page } ), { when: false } )
export const Manual = lazy( load_manual )
export const hover = (): Promise<void> => load_manual.prefetch()
