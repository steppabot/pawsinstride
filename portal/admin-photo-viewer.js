/* Paws in Stride — photo viewer (admin side).
   Load AFTER admin.js. Tapping a photo in pet sitting updates, boarding updates or a
   visit report preview opens it full screen in the app, the same way clients see
   photos, instead of opening a new window. Swipe or use the arrows to see the other
   photos from the same update. Close with ×, a tap outside the photo, or Escape. */
(function () {
    'use strict';

    // Photo links that should open here instead of a new window.
    const LINKS = '.boarding-photo-grid a[href], .admin-preview-photo a[href]';
    let viewer = null;

    // The other photos shown alongside this one (same update or same report).
    function groupFor(link) {
        const grid = link.closest('.boarding-photo-grid');
        if (grid) return [...grid.querySelectorAll('a[href]')];
        const figure = link.closest('.admin-preview-photo');
        const box = figure?.parentElement;
        return box ? [...box.querySelectorAll('.admin-preview-photo a[href]')] : [link];
    }

    function photoOf(link) {
        const img = link.querySelector('img');
        return { url: link.href, alt: img?.alt || 'Photo' };
    }

    function show(state, index) {
        const count = state.photos.length;
        state.index = (index + count) % count;
        const photo = state.photos[state.index];
        const img = state.dialog.querySelector('.pis-photo-viewer-image');
        const note = state.dialog.querySelector('.pis-photo-viewer-note');
        img.classList.remove('is-ready');
        note.hidden = true;
        img.alt = photo.alt;
        img.onload = () => img.classList.add('is-ready');
        img.onerror = () => { note.hidden = false; };
        img.src = photo.url;
        const counter = state.dialog.querySelector('.pis-photo-viewer-count');
        if (counter) counter.textContent = `${state.index + 1} / ${count}`;
        // Load the neighbours so swiping feels instant.
        if (count > 1) {
            for (const step of [1, -1]) new Image().src = state.photos[(state.index + step + count) % count].url;
        }
    }

    function close() {
        const state = viewer;
        if (!state) return;
        viewer = null;
        if (state.dialog.open) state.dialog.close();
        state.dialog.remove();
        if (state.from?.isConnected) state.from.focus({ preventScroll: true });
    }

    function open(link) {
        if (viewer) close();
        const links = groupFor(link);
        const photos = links.map(photoOf);
        const many = photos.length > 1;

        const dialog = document.createElement('dialog');
        dialog.className = 'pis-photo-viewer';
        dialog.setAttribute('aria-label', 'Photo viewer');
        dialog.innerHTML = `
            <div class="pis-photo-viewer-stage" data-photo-viewer-stage>
                <img class="pis-photo-viewer-image" alt="">
                <p class="pis-photo-viewer-note" hidden>This photo couldn’t load. Check your connection and try again.</p>
            </div>
            <button type="button" class="pis-photo-viewer-close" data-photo-viewer-close aria-label="Close photo">×</button>
            ${many ? `
                <button type="button" class="pis-photo-viewer-nav pis-photo-viewer-prev" data-photo-viewer-step="-1" aria-label="Previous photo">‹</button>
                <button type="button" class="pis-photo-viewer-nav pis-photo-viewer-next" data-photo-viewer-step="1" aria-label="Next photo">›</button>
                <span class="pis-photo-viewer-count" aria-live="polite"></span>` : ''}`;

        const state = { dialog, photos, index: 0, from: link };
        viewer = state;

        dialog.addEventListener('click', e => {
            if (e.target.closest('[data-photo-viewer-close]')) return close();
            const step = e.target.closest('[data-photo-viewer-step]');
            if (step) return show(state, state.index + Number(step.dataset.photoViewerStep));
            // A tap anywhere outside the photo closes it, like the client viewer.
            if (!e.target.closest('.pis-photo-viewer-image')) close();
        });
        dialog.addEventListener('cancel', e => { e.preventDefault(); e.stopPropagation(); close(); });
        dialog.addEventListener('keydown', e => {
            if (!many) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); show(state, state.index + 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); show(state, state.index - 1); }
        });

        // Swipe left or right between photos.
        let startX = null;
        let startY = null;
        dialog.addEventListener('touchstart', e => {
            if (e.touches.length !== 1) { startX = null; return; }
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        dialog.addEventListener('touchend', e => {
            if (startX === null || !many) return;
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            startX = null;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                show(state, state.index + (dx < 0 ? 1 : -1));
                state.swiped = Date.now();
            }
        });
        // A swipe ends with a tap event; don't let it close the viewer.
        dialog.addEventListener('click', e => {
            if (state.swiped && Date.now() - state.swiped < 400) { e.stopImmediatePropagation(); }
        }, true);

        document.body.appendChild(dialog);
        dialog.showModal();
        show(state, Math.max(0, links.indexOf(link)));
        dialog.querySelector('[data-photo-viewer-close]').focus({ preventScroll: true });
    }

    // Catch the tap before the link opens a new window.
    document.addEventListener('click', e => {
        const link = e.target.closest?.(LINKS);
        if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        e.stopPropagation();
        open(link);
    }, true);

    window.openAdminPhotoViewer = open;

    const style = document.createElement('style');
    style.textContent = `
        dialog.pis-photo-viewer{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;border-radius:0;box-sizing:border-box;overflow:hidden;background:rgba(0,0,0,.86);color:#fff;-webkit-tap-highlight-color:transparent}
        dialog.pis-photo-viewer[open]{display:block}
        dialog.pis-photo-viewer::backdrop{background:transparent}
        .pis-photo-viewer-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:calc(64px + env(safe-area-inset-top,0px)) 12px calc(56px + env(safe-area-inset-bottom,0px));box-sizing:border-box}
        .pis-photo-viewer-image{display:block;max-width:min(1100px,100%);max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:12px;background:#111;box-shadow:0 20px 60px rgba(0,0,0,.35);opacity:0;transition:opacity .15s ease;user-select:none;-webkit-user-select:none;-webkit-touch-callout:default}
        .pis-photo-viewer-image.is-ready{opacity:1}
        .pis-photo-viewer-note{position:absolute;left:24px;right:24px;top:50%;transform:translateY(-50%);margin:0;text-align:center;font-family:inherit;font-size:15px;font-weight:600;line-height:1.5;color:rgba(255,255,255,.85)}
        .pis-photo-viewer-note[hidden]{display:none}
        dialog.pis-photo-viewer button{appearance:none;-webkit-appearance:none;position:absolute;z-index:2;display:flex;align-items:center;justify-content:center;margin:0;padding:0;min-width:0;min-height:0;border:1px solid rgba(255,255,255,.25);border-radius:50%;background:rgba(0,0,0,.72);color:#fff;box-shadow:0 3px 12px rgba(0,0,0,.25);font-family:inherit;font-weight:300;line-height:1;cursor:pointer}
        dialog.pis-photo-viewer .pis-photo-viewer-close{top:calc(12px + env(safe-area-inset-top,0px));right:12px;width:44px;height:44px;font-size:30px}
        dialog.pis-photo-viewer .pis-photo-viewer-nav{top:50%;transform:translateY(-50%);width:44px;height:44px;font-size:34px;padding-bottom:4px}
        dialog.pis-photo-viewer .pis-photo-viewer-prev{left:10px}
        dialog.pis-photo-viewer .pis-photo-viewer-next{right:10px}
        dialog.pis-photo-viewer button:focus-visible{outline:2px solid #fff;outline-offset:3px}
        .pis-photo-viewer-count{position:absolute;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.6);font-family:inherit;font-size:13px;font-weight:700;line-height:1;letter-spacing:.04em}
        @media (hover:none){dialog.pis-photo-viewer .pis-photo-viewer-nav{opacity:.8}}`;
    document.head.appendChild(style);
})();
