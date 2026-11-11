// Compile-only check: documented usage must type-check against React's own types
import { lazy } from 'less-lazy'

const Page = ( { title }: { title: string } ) => <h1>{ title }</h1>

const Idle = lazy( async () => ( { default: Page } ) )
const Manual = lazy( async () => ( { default: Page } ), { prefetch: false } )

export const render = () => <Idle title="ok" />
export const hover = (): Promise<void> => Manual.prefetch()

// @ts-expect-error: props are inferred from the loaded component
export const wrong = () => <Idle nope />
