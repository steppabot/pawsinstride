// ========================================
// PAWS IN STRIDE SERVICE WORKER
// ========================================
//
// Offline-capable PWA shell.
//
// Static portal files are cached so the
// installed PWA can reopen without data.
//
// Supabase API/data requests are NOT cached.
// Local/offline business data is handled by
// the portal JavaScript itself.
// ========================================

const SERVICE_WORKER_VERSION =
    "paws-in-stride-pwa-v2";


const STATIC_CACHE_NAME =
    `${SERVICE_WORKER_VERSION}-static`;


// ========================================
// APP SHELL FILES
// ========================================

const APP_SHELL_FILES = [

    "/portal/",
    "/portal/dashboard.html",
    "/portal/admin.html",
    "/portal/portal.js",
    "/portal/admin.js",
    "/portal/portal.css",
    "/portal/assets/pwa-icon-192.png"

];


// ========================================
// EXTERNAL STATIC DEPENDENCIES
// ========================================
//
// admin.html and dashboard.html both depend
// on the Supabase browser library.
//
// We cache the SDK itself, but we DO NOT
// cache Supabase API/database responses.
// ========================================

const EXTERNAL_STATIC_FILES = [

    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"

];


// ========================================
// CACHE ONE FILE SAFELY
// ========================================

async function cacheFileSafely(
    cache,
    url
) {

    try {


        const response =
            await fetch(
                url,
                {
                    cache:
                        "reload"
                }
            );


        if (
            !response ||
            (
                !response.ok &&
                response.type !==
                "opaque"
            )
        ) {


            console.warn(
                "Skipping cache for:",
                url
            );


            return;

        }


        await cache.put(
            url,
            response.clone()
        );


        console.log(
            "Cached PWA file:",
            url
        );


    } catch (
        error
    ) {


        console.warn(
            "Unable to cache PWA file:",
            url,
            error
        );

    }

}


// ========================================
// INSTALL
// ========================================

self.addEventListener(
    "install",
    event => {


        console.log(
            "Paws in Stride service worker installing:",
            SERVICE_WORKER_VERSION
        );


        event.waitUntil(

            caches
                .open(
                    STATIC_CACHE_NAME
                )
                .then(
                    async cache => {


                        const filesToCache = [

                            ...APP_SHELL_FILES,
                            ...EXTERNAL_STATIC_FILES

                        ];


                        await Promise.all(

                            filesToCache.map(
                                url =>
                                    cacheFileSafely(
                                        cache,
                                        url
                                    )
                            )

                        );

                    }
                )
                .then(
                    () =>
                        self.skipWaiting()
                )

        );

    }
);


// ========================================
// ACTIVATE
// ========================================

self.addEventListener(
    "activate",
    event => {


        console.log(
            "Paws in Stride service worker activated:",
            SERVICE_WORKER_VERSION
        );


        event.waitUntil(

            Promise.all([


                // ========================================
                // REMOVE OLD PWA CACHES
                // ========================================

                caches
                    .keys()
                    .then(
                        cacheNames =>

                            Promise.all(

                                cacheNames.map(
                                    cacheName => {


                                        if (
                                            cacheName.startsWith(
                                                "paws-in-stride-pwa-"
                                            ) &&
                                            cacheName !==
                                            STATIC_CACHE_NAME
                                        ) {


                                            console.log(
                                                "Deleting old PWA cache:",
                                                cacheName
                                            );


                                            return caches.delete(
                                                cacheName
                                            );

                                        }


                                        return Promise.resolve(
                                            false
                                        );

                                    }
                                )

                            )
                    ),


                // ========================================
                // CONTROL OPEN PORTAL WINDOWS
                // ========================================

                self.clients.claim()

            ])

        );

    }
);


// ========================================
// NETWORK FIRST WITH CACHE FALLBACK
// ========================================

async function networkFirst(
    request
) {

    const cache =
        await caches.open(
            STATIC_CACHE_NAME
        );


    try {


        const response =
            await fetch(
                request
            );


        if (
            response &&
            (
                response.ok ||
                response.type ===
                "opaque"
            )
        ) {


            await cache.put(
                request,
                response.clone()
            );

        }


        return response;


    } catch (
        error
    ) {


        const cachedResponse =
            await caches.match(
                request
            );


        if (
            cachedResponse
        ) {


            console.log(
                "Serving cached PWA file:",
                request.url
            );


            return cachedResponse;

        }


        throw error;

    }

}


// ========================================
// CACHE FIRST
// ========================================

async function cacheFirst(
    request
) {

    const cachedResponse =
        await caches.match(
            request
        );


    if (
        cachedResponse
    ) {

        return cachedResponse;

    }


    const response =
        await fetch(
            request
        );


    if (
        response &&
        (
            response.ok ||
            response.type ===
            "opaque"
        )
    ) {


        const cache =
            await caches.open(
                STATIC_CACHE_NAME
            );


        await cache.put(
            request,
            response.clone()
        );

    }


    return response;

}


// ========================================
// FETCH
// ========================================

self.addEventListener(
    "fetch",
    event => {


        const request =
            event.request;


        if (
            request.method !==
            "GET"
        ) {

            return;

        }


        const requestUrl =
            new URL(
                request.url
            );


        // ========================================
        // NEVER CACHE SUPABASE API REQUESTS
        // ========================================

        if (
            requestUrl.hostname
                .includes(
                    "supabase.co"
                )
        ) {

            return;

        }


        // ========================================
        // SUPABASE BROWSER SDK
        // ========================================
        //
        // This is static JavaScript from jsDelivr,
        // not live customer/business data.
        // ========================================

        if (
            requestUrl.hostname ===
            "cdn.jsdelivr.net" &&
            requestUrl.pathname
                .includes(
                    "@supabase/supabase-js"
                )
        ) {


            event.respondWith(
                cacheFirst(
                    request
                )
            );


            return;

        }


        // ========================================
        // PORTAL NAVIGATION
        // ========================================
        //
        // Try the current deployed page first.
        // If offline, serve the copy on the phone.
        // ========================================

        if (
            request.mode ===
            "navigate" &&
            requestUrl.origin ===
            self.location.origin &&
            requestUrl.pathname
                .startsWith(
                    "/portal/"
                )
        ) {


            event.respondWith(

                networkFirst(
                    request
                )
                    .catch(
                        async () => {


                            // ========================================
                            // EXACT PAGE NOT FOUND IN CACHE
                            // ========================================

                            const exactPage =
                                await caches.match(
                                    requestUrl.pathname
                                );


                            if (
                                exactPage
                            ) {

                                return exactPage;

                            }


                            // ========================================
                            // LAST-RESORT PORTAL SHELL
                            // ========================================

                            return caches.match(
                                "/portal/dashboard.html"
                            );

                        }
                    )

            );


            return;

        }

        // ========================================
        // VIDEO / AUDIO / RANGE REQUESTS
        // ========================================
        // Let the browser handle media directly.
        // Partial video responses cannot be stored
        // using our normal cache.put() handler.
        // ========================================

        if (
            request.headers.has("range") ||
            request.destination === "video" ||
            request.destination === "audio" ||
            /\.(mp4|m4v|mov|webm|mp3|m4a|wav|ogg)$/i.test(
                requestUrl.pathname
            )
        ) {

            return;

        }
        
        
        // ========================================
        // SAME-ORIGIN PORTAL STATIC FILES
        // ========================================

        if (
            requestUrl.origin ===
            self.location.origin &&
            requestUrl.pathname
                .startsWith(
                    "/portal/"
                )
        ) {


            event.respondWith(
                networkFirst(
                    request
                )
            );


            return;

        }


        // ========================================
        // EVERYTHING ELSE
        // ========================================
        //
        // Do not interfere with unrelated
        // requests or external APIs.
        // ========================================

        return;

    }
);


// ========================================
// PUSH
// ========================================

self.addEventListener(
    "push",
    event => {


        let payload = {

            title:
                "Paws in Stride",

            body:
                "You have a new notification.",

            url:
                "/portal/"

        };


        try {


            if (
                event.data
            ) {


                payload =
                    event.data.json();

            }


        } catch (
            error
        ) {


            console.error(
                "Push payload parse error:",
                error
            );

        }


        const title =
            payload.title ||
            "Paws in Stride";


        const options = {

            body:
                payload.body ||
                "You have a new update.",

            icon:
                "/portal/assets/pwa-icon-192.png",

            badge:
                "/portal/assets/pwa-icon-192.png",

            data: {

                url:
                    payload.url ||
                    "/portal/"

            }

        };


        event.waitUntil(

            self.registration
                .showNotification(
                    title,
                    options
                )

        );

    }
);


// ========================================
// NOTIFICATION CLICK
// ========================================

self.addEventListener(
    "notificationclick",
    event => {


        event.notification
            .close();


        const targetUrl =
            event.notification
                ?.data
                ?.url ||
            "/portal/";


        event.waitUntil(

            clients
                .matchAll(
                    {
                        type:
                            "window",

                        includeUncontrolled:
                            true
                    }
                )
                .then(
                    clientList => {


                        for (
                            const client
                            of clientList
                        ) {


                            if (
                                "focus" in client
                            ) {


                                client.navigate(
                                    targetUrl
                                );


                                return client.focus();

                            }

                        }


                        if (
                            clients.openWindow
                        ) {


                            return clients
                                .openWindow(
                                    targetUrl
                                );

                        }


                    }
                )

        );

    }
);
