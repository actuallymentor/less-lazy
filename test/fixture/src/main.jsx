import { Suspense, lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { prefetch } from 'less-lazy'

// Test probes read by the e2e suite
window.evaluated = []
window.fallback_commits = []

// One page with less-lazy, one with plain React.lazy as a control
const Prefetched = lazy( prefetch( () => import( './pages/Prefetched.jsx' ) ) )
const Plain = lazy( () => import( './pages/Plain.jsx' ) )

// Records every time a fallback actually reaches the screen
const Fallback = ( { name } ) => {
    useEffect( () => void window.fallback_commits.push( name ), [ name ] )
    return <p>Loading { name }…</p>
}

function App() {

    const [ page, set_page ] = useState( null )

    return <>
        <button id="open-prefetched" onClick={ () => set_page( `prefetched` ) }>Prefetched</button>
        <button id="open-plain" onClick={ () => set_page( `plain` ) }>Plain</button>

        <Suspense fallback={ <Fallback name="prefetched" /> }>
            { page == `prefetched` && <Prefetched /> }
        </Suspense>

        <Suspense fallback={ <Fallback name="plain" /> }>
            { page == `plain` && <Plain /> }
        </Suspense>
    </>

}

createRoot( document.getElementById( `root` ) ).render( <App /> )
