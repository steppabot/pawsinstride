// ========================================
// PAWS IN STRIDE SERVICE WORKER
// ========================================
//
// Initial PWA service worker.
//
// IMPORTANT:
// We are intentionally NOT aggressively
// caching portal.js, portal.css, Supabase
// data, bookings, messages, capacity,
// reports, or payment information.
//
// This gives us the PWA/service-worker
// foundation without making deployments
// harder during active development.
// ========================================

const SERVICE_WORKER_VERSION =
    "paws-in-stride-pwa-v1";


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


        // Activate the newest worker without
        // waiting behind an older version.

        self.skipWaiting();

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
            self.clients.claim()
        );

    }
);


// ========================================
// FETCH
// ========================================
//
// For now:
// let the browser/network handle everything.
//
// We will add carefully controlled static
// caching later if we decide it benefits
// the portal.
//
// Live portal data should always remain fresh.
// ========================================

self.addEventListener(
    "fetch",
    event => {

        return;

    }
);


// ========================================
// PUSH
// ========================================
//
// Placeholder for Phase 3.
//
// Once push subscriptions are wired,
// notifications will be handled here.
// ========================================

self.addEventListener(
    "push",
    event => {

        console.log(
            "Push received:",
            event
        );

    }
);
