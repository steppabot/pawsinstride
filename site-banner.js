/* Paws in Stride — website banner.
   Shows the banner you edit in the admin portal (More → Website Banner)
   in the orange bar at the top of every page. Up to 3 messages rotate.
   If Supabase can't be reached, the page keeps the last banner it saw,
   or the one written in the page itself. Closing the bar hides it until
   you change the banner again. */
(function () {
    'use strict';

    const URL = 'https://xyhndwopvlmnxjkthtkl.supabase.co/rest/v1/site_banner?id=eq.1&select=active,messages,updated_at';
    const KEY = 'sb_publishable_U3OIYatZuBUe8Y6Vq0DS2w_IMacau2j';
    const CACHE = 'pis-site-banner-v1';
    const CLOSED = 'notificationClosed';
    const CLOSED_VERSION = 'notificationClosedVersion';
    const ROTATE_MS = 6000;

    const bar = document.getElementById('notification-bar');
    if (!bar) return;
    const slot = bar.querySelector('p:not(.banner-phone)');
    if (!slot) return;

    let current = null;
    let timer = null;
    let index = 0;

    const store = {
        get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } },
        remove(key) { try { localStorage.removeItem(key); } catch (e) { /* private mode */ } }
    };

    function escapeHtml(text) {
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // **double stars** make text bold.
    function format(text) {
        return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }

    function safeLink(url) {
        const value = String(url || '').trim();
        if (/^\/(?!\/)/.test(value) || /^https:\/\//i.test(value) || /^(tel|mailto):/i.test(value)) return value;
        return '';
    }

    function messagesOf(banner) {
        return (Array.isArray(banner?.messages) ? banner.messages : [])
            .filter(m => m && String(m.text || '').trim())
            .slice(0, 3);
    }

    function show(message) {
        const link = safeLink(message.link_url);
        const label = String(message.link_text || '').trim() || 'Learn More';
        slot.innerHTML = format(message.text) +
            (link ? ` <a class="site-banner-link" href="${escapeHtml(link)}">${escapeHtml(label)} ›</a>` : '');
    }

    function rotate(messages) {
        clearInterval(timer);
        index = 0;
        show(messages[0]);
        if (messages.length < 2) return;
        const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        timer = setInterval(() => {
            if (document.hidden) return;
            index = (index + 1) % messages.length;
            if (calm) { show(messages[index]); return; }
            slot.classList.add('site-banner-fade');
            setTimeout(() => {
                show(messages[index]);
                slot.classList.remove('site-banner-fade');
            }, 250);
        }, ROTATE_MS);
    }

    function apply(banner) {
        if (!banner) return;
        current = banner;
        if (banner.active === false) {
            clearInterval(timer);
            bar.style.display = 'none';
            return;
        }
        // A changed banner shows again even if the visitor closed the old one.
        if (store.get(CLOSED) === 'true' && store.get(CLOSED_VERSION) !== String(banner.updated_at || '')) {
            store.remove(CLOSED);
            bar.style.display = '';
        }
        const messages = messagesOf(banner);
        if (messages.length) rotate(messages);
    }

    window.closeNotificationBar = function () {
        bar.style.display = 'none';
        clearInterval(timer);
        store.set(CLOSED, 'true');
        store.set(CLOSED_VERSION, String(current?.updated_at || ''));
    };

    const style = document.createElement('style');
    style.textContent = `
        #notification-bar .site-banner-link{color:inherit;text-decoration:underline;text-underline-offset:2px;white-space:nowrap}
        #notification-bar p{transition:opacity .25s ease}
        #notification-bar p.site-banner-fade{opacity:0}`;
    document.head.appendChild(style);

    // Last banner seen on this device, so there's no flash of old text.
    try { apply(JSON.parse(store.get(CACHE) || 'null')); } catch (e) { /* ignore */ }

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const stop = setTimeout(() => controller && controller.abort(), 5000);
    fetch(URL, { headers: { apikey: KEY }, signal: controller ? controller.signal : undefined, cache: 'no-store' })
        .then(response => response.ok ? response.json() : null)
        .then(rows => {
            const banner = Array.isArray(rows) ? rows[0] : null;
            if (!banner) return;
            store.set(CACHE, JSON.stringify(banner));
            apply(banner);
        })
        .catch(() => { /* offline: keep what's showing */ })
        .finally(() => clearTimeout(stop));
})();
