//import 'regenerator-runtime/runtime'
import 'ol/ol.css';
import { Map, View } from 'ol';
import MVT from 'ol/format/MVT';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { fromLonLat } from 'ol/proj';
import AWS from 'aws-sdk';

// Cognito Identity Pool ID
const identityPoolId = "[CognitoIdentityPoolID]";
// Amazon Location Service map name; must be HERE-backed
const mapName = "[MapName]";

// extract the region from the Identity Pool ID; this will be used for both Amazon Cognito and Amazon Location
AWS.config.region = identityPoolId.split(":", 1)[0];

// instantiate a Cognito-backed credential provider
const credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
});

/**
 * Register a service worker that will rewrite and sign requests using Signature Version 4.
 */
async function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        try {
            const reg = await navigator.serviceWorker.register("./sw.js");

            // refresh credentials from Amazon Cognito
            await credentials.refreshPromise();

            await reg.active.ready;

            if (navigator.serviceWorker.controller == null) {
                // trigger a navigate event to active the controller for this page
                window.location.reload();
            }

            // pass credentials to the service worker
            reg.active.postMessage({
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    sessionToken: credentials.sessionToken,
                },
                region: AWS.config.region,
            });
        } catch (error) {
            console.error("Service worker registration failed:", error);
        }
    } else {
        console.warn("Service worker support is required for this example");
    }
}

async function initializeMap() {
    // register the service worker to handle requests to https://amazon.location
    console.log('registering service worker')
    await registerServiceWorker();

    // actually initialize the map
    const map = new Map({
        target: 'map-container',
        view: new View({
            center: fromLonLat([-117.1625, 32.715]),
            zoom: 0
        })
    });

    const layer = new VectorTileLayer({
        source: new VectorTileSource({
            attributions: [
                '<a href="http://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a>',
                '<a href="http://www.openstreetmap.org/about/" target="_blank">&copy; OpenStreetMap contributors</a>'
            ],
            format: new MVT(),
            url: `https://amazon.location/${mapName}/{z}/{x}/{y}`,
            maxZoom: 12
        })
    });
    map.addLayer(layer);
}

/**
 * const layer = new VectorTileLayer({
    source: new VectorTileSource({
        attributions: [
            '<a href="http://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a>',
            '<a href="http://www.openstreetmap.org/about/" target="_blank">&copy; OpenStreetMap contributors</a>'
        ],
        format: new MVT(),
        url: `https://amazon.location/${mapName}/{z}/{x}/{y}`,
        maxZoom: 12
    })
});
map.addLayer(layer);
*/

initializeMap();
