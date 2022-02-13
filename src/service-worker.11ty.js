const glob = require("glob")

/**
 * Generates the service worker that browsers use for app-level caching.
 * Only caches images because they are responsible for the majority of the bandwidth usage but rarely change.
 * When an existing image changes, update the `version` below, or else past visitors will only see the old image.
 */
class ServiceWorker {
    data() {
        return {
            version: 1, // <-- !!! Increment the number if any _existing_ image files changed !!!
            files: glob.sync('src/img/**.{jpg,jpeg,png,webp}', {}).map(path => path.replace(/^src/, '')),
            // Options magic to bypass the default `service-worker.js/index.html` path
            permalink: 'service-worker.js',
        }
    }

    render({files, version}) {
        return `
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('v${version}').then(function(cache) {
            return cache.addAll(${JSON.stringify(files, null, 4)});
        })
    );
});

self.addEventListener('fetch', function (e) {
    // Set up "cache falling back to network"
    e.respondWith(
        caches.match(e.request).then(
            function (response) {
                return response || fetch(e.request);
            }
        )
    );
});
        `;
    }
}

module.exports = ServiceWorker;
