# less-lazy: prefetched loading for React.lazy

This module is a utility function designed to be used with React.js's `lazy` function and a bundler like [Vite](https://vitejs.dev/) that supports code splitting. Using this module will allow your main app bundle to be small, while also telling the browser to (in the background) load the code for pages that a user is likely to visit soon.

**Contents**

- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Why this module?](#why-this-module)


This module works by:

1. Adding the import to the `<head>` section of the DOM as a `<link rel="prefetch">`
    - This tells the browser "we don't need this yet but we will need it soon, load is when you have a moment"
2. Adding a listener to that `<link>` so the app loads the page into memory once it is loaded
    - This prevents a quick flashing of a loading spinner that occurs during the evaluation of the module usually

## Installation

```bash
npm i -S less-lazy
```

## Usage

This module is designed to be used with React's `lazy` function. It is a higher order function that takes in a function that returns a promise (e.g. `() => import('./module')`) and returns a function that can be used with `React.lazy`.


Example usage with `react-router`:

```javascript
// Dependencies
import { Suspense, lazy } from 'react'
import { prefetch } from 'less-lazy'
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom"

// Normal import
// import HomePage from './components/HomePage'

// Regular lazy loading
// const HomePage = lazy( () => import( './components/HomePage ) )

// Lazy loading with less-lazy wrapping
const HomePage = lazy( prefetch( () => import( './components/HomePage' ) ) )

// React router example that uses suspense with lazy loaded component
export default function Router() {

    return <Suspense>
        <BrowserRouter>
            <Routes>
                <Route exact path='/' element={ <Homepage /> } />
            </Routes>
        </BrowserRouter>
    </Suspense>

}
```

## Options

The `prefetch` function takes in two parameters:

1. A loading function
2. An options object

The options object has two properties:

1. `rel` - The rel attribute of the `<link>` element (default: "prefetch").
    - [prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch) *"provides a hint to browsers that the user is likely to need the target resource for future navigations, and therefore the browser can likely improve the user experience by preemptively fetching and caching the resource"*
    - [preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload) is for *"specifying resources that your page will need very soon, which you want to start loading early in the page lifecycle, before browsers' main rendering machinery kicks in"*
2. `force_in_memory` - Whether to load the module into memory (default: true).
    - If you set this to false, the module will be downloaded according to your `rel` policy, but when a user navigates to a page there will still be a brief moment where your code needs to evaluate the module on disk into memory.

### Debugging

This module logs out what is does when run in a `localhost` server. In production you can enable logging by appending `?loglevel=info` to your URL. All logs are prefixed with `[less-lazy]`.

## Why this module?

Using `React.lazy` is a great way to allow bundlers like [Vite](https://vitejs.dev/) to split your code into multiple files that are loaded as needed. This makes it so that users on a slow connection do not need to load your whole app bundle, but only the page they are at.

The "problem" you run in to is that when a user navigates to such an unloaded page, the device still needs to load the remote file that contains the code that Vite split into a different file. If your user spent 20 seconds reading your homepage (after it loaded super fast of course), those 20 seconds were "wasted" because the browser just sat there idle. The browser had no way of knowing that your user might need an extra file (the page they are navigating to) soon.

Browsers actually **have** a super cool way to load things that you tell them they will need soon. You can add a [resource hint](https://caniuse.com/?search=resource%20hint). In our case we can add a  `<link>` element to the header specifying a `rel` type that tells the browser you think the user will need something soon. When that file is loaded is left up to the browser, but the prefetch hint has [good browser support](https://caniuse.com/link-rel-prefetch).

The final issue is that if a browser downloaded a file in the background, that file is not yet "hot" in the memory of the device. Our code within a `React.lazy` declaration has not been triggered yet (if the user hasn't opened the page yet). That means that if the user navigates to the page, they will still see a momentary loading spinner (or blank page, depending on how you configuted `Suspense`).

This module adds a listener to the `<link>` element that runs the import function in the background when the file has been loaded. This loads the module into memory, ready to use.

The cool thing about the `() => import()` function passed to `React.lazy` is that is is an async function we can simply call without rendering anything, and since any Javascript module that is imported while our app is cached in memory, calling `import` (without actually rendering it) will make the browser put it into memory. The same thing that optimises identical `import` and `require` statements in multiple files (or even withinn functions) makes it so that our prefetched moldule is not ready to render!

Whether you use this module on a component depends entirely on how you want your app to behave, and that will depend on your users and the experience you want them to have. Some heuristics I personally use:

- Do not lazy load small pages, or pages you expect every user to see (e.g. a product page that people will link to directly)
- Use this module for pages that a user will probably see, but will probably not see first (e.g. the details page of en ecommerce app)
- Use `React.lazy` without this module for pages that a user might not open and that import heavy modules (e.g. a profile page that loads an in-browser image compression module)
