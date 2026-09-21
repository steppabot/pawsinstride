/*
 * PAWS IN STRIDE - "INSTALL THE APP" HELPER
 *
 * One small script that:
 *   1. works out what phone / browser someone is using
 *   2. saves Chrome's native install prompt (Android) so we can show our own button
 *   3. shows a dismissible "Install Paws in Stride" banner on the client dashboard
 *
 * Load it in the <head> of the dashboard and the install page:
 *     <script src="/portal/install-app.js"></script>
 * (It goes in the <head> so it can catch Chrome's install event early.)
 */
(function () {
    'use strict';

    var GUIDE_URL = '/portal/install.html';
    var ICON_URL = '/portal/assets/apple-touch-icon.png';
    var KEY_DISMISSED_UNTIL = 'pis_install_banner_dismissed_until';
    var KEY_INSTALLED = 'pis_app_installed';
    var DISMISS_DAYS = 30;

    var deferredPrompt = null;

    /* ---------- small helpers ---------- */

    function storageGet(key) {
        try { return window.localStorage.getItem(key); } catch (e) { return null; }
    }

    function storageSet(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) { /* private mode: ignore */ }
    }

    function emit(name) {
        try { window.dispatchEvent(new CustomEvent('pawsinstall:' + name)); } catch (e) { /* ignore */ }
    }

    function track(name) {
        if (typeof window.gtag === 'function') {
            try { window.gtag('event', name); } catch (e) { /* ignore */ }
        }
    }

    /* ---------- already installed? ---------- */

    function isStandalone() {
        return (
            (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
            window.navigator.standalone === true
        );
    }

    /* ---------- what device / browser is this? ---------- */

    function detect() {
        var ua = navigator.userAgent || '';

        // iPads can pretend to be Macs, so also look for a touch screen
        var iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
        var ios = /iPad|iPhone|iPod/.test(ua) || iPadOS;
        var android = /Android/i.test(ua);

        // Facebook, Instagram, TikTok etc. open links in their own mini browser,
        // and those can't install anything.
        var inApp =
            /FBAN|FBAV|FB_IAB|Instagram|Snapchat|TikTok|musical_ly|BytedanceWebview|Twitter|LinkedInApp|Pinterest|Line\//i.test(ua) ||
            (android && /; wv\)/.test(ua));

        var browser = 'other';

        if (ios) {
            if (/CriOS/.test(ua)) { browser = 'chrome'; }
            else if (/FxiOS/.test(ua)) { browser = 'firefox'; }
            else if (/EdgiOS/.test(ua)) { browser = 'edge'; }
            else if (/OPiOS|OPT\//.test(ua)) { browser = 'opera'; }
            else if (/Safari/.test(ua)) { browser = 'safari'; }
        } else if (android) {
            if (/SamsungBrowser/.test(ua)) { browser = 'samsung'; }
            else if (/Firefox/.test(ua)) { browser = 'firefox'; }
            else if (/EdgA/.test(ua)) { browser = 'edge'; }
            else if (/OPR|Opera/.test(ua)) { browser = 'opera'; }
            else if (/Chrome/.test(ua)) { browser = 'chrome'; }
        }

        var guide = 'other';
        if (ios) { guide = browser === 'safari' ? 'ios-safari' : 'ios-other'; }
        else if (android) { guide = 'android'; }

        return {
            os: ios ? 'ios' : (android ? 'android' : 'other'),
            browser: browser,
            inApp: inApp,
            guide: guide,
            standalone: isStandalone(),
            canPrompt: !!deferredPrompt
        };
    }

    /* ---------- Chrome / Edge / Samsung Internet native install ---------- */

    window.addEventListener('beforeinstallprompt', function (event) {
        event.preventDefault();      // we show our own button instead of the browser's
        deferredPrompt = event;
        emit('promptavailable');
    });

    window.addEventListener('appinstalled', function () {
        deferredPrompt = null;
        storageSet(KEY_INSTALLED, '1');
        track('pwa_installed');
        emit('installed');
    });

    function promptInstall() {
        if (!deferredPrompt) {
            return Promise.resolve({ outcome: 'unavailable' });
        }

        var saved = deferredPrompt;
        deferredPrompt = null;

        var shown = saved.prompt();
        var choice = saved.userChoice || shown;

        return Promise.resolve(choice).then(function (result) {
            var outcome = (result && result.outcome) || 'dismissed';

            if (outcome === 'accepted') {
                storageSet(KEY_INSTALLED, '1');
                track('pwa_install_accepted');
            }

            return { outcome: outcome };
        }).catch(function () {
            return { outcome: 'dismissed' };
        });
    }

    /* ---------- the dashboard banner ---------- */

    function bannerAllowed() {
        var d = detect();

        if (d.standalone || d.inApp) { return false; }              // already installed / can't install
        if (d.os === 'other') { return false; }                     // phones and tablets only
        if (storageGet(KEY_INSTALLED) === '1') { return false; }

        var until = parseInt(storageGet(KEY_DISMISSED_UNTIL) || '0', 10);
        if (until && Date.now() < until) { return false; }

        if (window.location.pathname.indexOf('install') !== -1) { return false; }

        return true;
    }

    function dismissBanner(banner, days) {
        storageSet(KEY_DISMISSED_UNTIL, String(Date.now() + days * 24 * 60 * 60 * 1000));
        if (banner && banner.parentNode) { banner.parentNode.removeChild(banner); }
    }

    function renderBanner(holder) {
        if (!holder || holder.querySelector('.install-banner')) { return; }

        var banner = document.createElement('div');
        banner.className = 'install-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Install the Paws in Stride app');

        banner.innerHTML =
            '<button type="button" class="install-banner-close" aria-label="Dismiss">&times;</button>' +
            '<div class="install-banner-top">' +
                '<img class="install-banner-icon" src="' + ICON_URL + '" alt="" width="46" height="46">' +
                '<div class="install-banner-copy">' +
                    '<strong>Install Paws in Stride</strong>' +
                    '<span>Open your portal in one tap and get visit updates.</span>' +
                '</div>' +
            '</div>' +
            '<div class="install-banner-actions">' +
                '<button type="button" class="install-banner-button"></button>' +
                '<button type="button" class="install-banner-later">Not now</button>' +
            '</div>';

        var mainButton = banner.querySelector('.install-banner-button');
        var laterButton = banner.querySelector('.install-banner-later');
        var closeButton = banner.querySelector('.install-banner-close');

        function refreshLabel() {
            mainButton.textContent = deferredPrompt ? 'Install' : 'Show me how';
        }

        refreshLabel();
        window.addEventListener('pawsinstall:promptavailable', refreshLabel);
        window.addEventListener('pawsinstall:installed', function () {
            if (banner.parentNode) { banner.parentNode.removeChild(banner); }
        });

        mainButton.addEventListener('click', function () {
            if (deferredPrompt) {
                promptInstall().then(function (result) {
                    if (result.outcome === 'accepted' && banner.parentNode) {
                        banner.parentNode.removeChild(banner);
                    }
                });
            } else {
                window.location.href = GUIDE_URL;
            }
        });

        laterButton.addEventListener('click', function () { dismissBanner(banner, DISMISS_DAYS); });
        closeButton.addEventListener('click', function () { dismissBanner(banner, DISMISS_DAYS); });

        holder.appendChild(banner);
        track('install_banner_shown');
    }

    // Finds the spot for the banner. Best: put <div id="install-app-banner"></div>
    // right under the dashboard header. If that div isn't there, the script places
    // its own right after .client-dashboard-header.
    function autoMountBanner() {
        if (!document.body || !document.body.classList.contains('client-portal-page')) { return; }
        if (!bannerAllowed()) { return; }

        var slot = document.getElementById('install-app-banner');
        if (slot) { renderBanner(slot); return; }

        function tryMount() {
            var header = document.querySelector('.client-dashboard-header');
            if (!header || !header.parentNode) { return false; }

            var holder = document.createElement('div');
            holder.id = 'install-app-banner';
            header.parentNode.insertBefore(holder, header.nextSibling);
            renderBanner(holder);
            return true;
        }

        if (tryMount()) { return; }

        // the dashboard is built by JavaScript, so keep watching for a little while
        if (!window.MutationObserver) { return; }

        var observer = new MutationObserver(function () {
            if (tryMount()) { observer.disconnect(); }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.setTimeout(function () { observer.disconnect(); }, 15000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoMountBanner);
    } else {
        autoMountBanner();
    }

    /* ---------- public API ---------- */

    window.PawsInstall = {
        detect: detect,
        isStandalone: isStandalone,
        canPrompt: function () { return !!deferredPrompt; },
        prompt: promptInstall,
        mountBanner: renderBanner,
        guideUrl: GUIDE_URL
    };
})();
