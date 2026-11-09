// Top level side effect marks when the module is evaluated
window.evaluated.push( `plain` )

export default function Plain() {
    return <h1 id="plain-page">Plain page</h1>
}
