import { Component, Suspense, lazy as react_lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { lazy } from 'less-lazy'

// Test probes read by the e2e suite
window.evaluated = []
window.fallback_commits = []
window.fail_next_load = false

// One page with less-lazy, one with plain React.lazy as a control
const Prefetched = lazy( () => import( './pages/Prefetched.jsx' ) )
const Plain = react_lazy( () => import( './pages/Plain.jsx' ) )

// Manual page whose load can be made to fail, to test recovery
const Flaky = lazy( () => window.fail_next_load
    ? Promise.reject( new Error( `simulated network failure` ) )
    : import( './pages/Flaky.jsx' ), { prefetch: false } )

// Records every time a fallback actually reaches the screen
const Fallback = ( { name } ) => {
    useEffect( () => void window.fallback_commits.push( name ), [ name ] )
    return <p>Loading { name }…</p>
}

// Minimal error boundary with a reset action, like a real app's "try again"
class Boundary extends Component {
    state = { error: null }
    static getDerivedStateFromError( error ) {
        return { error }
    }
    render() {
        if( !this.state.error ) return this.props.children
        return <button id="retry" onClick={ () => this.setState( { error: null } ) }>Try again</button>
    }
}

function App() {

    const [ page, set_page ] = useState( null )

    return <>
        <button id="open-prefetched" onClick={ () => set_page( `prefetched` ) }>Prefetched</button>
        <button id="open-plain" onClick={ () => set_page( `plain` ) }>Plain</button>
        <button id="open-flaky" onClick={ () => set_page( `flaky` ) }>Flaky</button>

        <Suspense fallback={ <Fallback name="prefetched" /> }>
            { page == `prefetched` && <Prefetched /> }
        </Suspense>

        <Suspense fallback={ <Fallback name="plain" /> }>
            { page == `plain` && <Plain /> }
        </Suspense>

        <Boundary>
            <Suspense fallback={ <Fallback name="flaky" /> }>
                { page == `flaky` && <Flaky /> }
            </Suspense>
        </Boundary>
    </>

}

createRoot( document.getElementById( `root` ) ).render( <App /> )
