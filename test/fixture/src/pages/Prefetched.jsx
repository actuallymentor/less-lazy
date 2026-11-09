// Top level side effect marks when the module is evaluated
window.evaluated.push( `prefetched` )

export default function Prefetched() {
    return <h1 id="prefetched-page">Prefetched page</h1>
}
