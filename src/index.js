import React, { Suspense } from "react"
import { createRoot } from 'react-dom/client';
import "./index.css"
//import "./font.css"
import * as serviceWorker from "./serviceWorker"

const App = React.lazy(() =>
    import(/* webpackChunkName: "APP", webpackPreload: true */ "./App")
)

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <Suspense fallback={<p>Mithi's Bare Minimum Hexapod Robot Simulator...</p>}>
            <App />
        </Suspense>
    </React.StrictMode>
);

serviceWorker.register();
