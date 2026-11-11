// Compile-only check: documented usage must type-check against React's own types
import { Component, createRef } from 'react'
import { lazy } from 'less-lazy'

const Page = ( { title }: { title: string } ) => <h1>{ title }</h1>

const Idle = lazy( async () => ( { default: Page } ) )
const Manual = lazy( async () => ( { default: Page } ), { prefetch: false } )

export const render = () => <Idle title="ok" />
export const hover = (): Promise<void> => Manual.prefetch()

// @ts-expect-error: props are inferred from the loaded component
export const wrong = () => <Idle nope />

// Drop-in parity with React.lazy: class refs and defaultProps
class Native extends Component<{ label: string }> {
    static defaultProps = { label: `default` }
    render() { return <p>{ this.props.label }</p> }
}
const LazyNative = lazy( async () => ( { default: Native } ) )
const native_ref = createRef<Native>()
export const with_ref = () => <LazyNative ref={ native_ref } />
