/* ========================================
   PAWS IN STRIDE: HOME CARD PHOTO FRAMING ("Adjust Cover")
   ========================================
   Loaded on admin.html (the team frames photos) and dashboard.html (clients see them).

   The client's Home card is 1 wide by 1.15 tall. A framing ("box") is the part of a
   photo that fills it: x, y, w, h as fractions of the photo, x and y being its top-left
   corner. The photo file itself is never changed, so the full photo still shows
   everywhere else (visit reports, the gallery).

   window.PisCover
     RATIO                 the card's height / width
     imgStyle(box)         inline style for an <img> inside a card-shaped box
                           (no box: the default framing, centered and a little high)
     load(paths)           Map of storage path -> box, for paths that have one
     save(path, box|null)  save a framing (null resets it to the default); team only
     edit({ src, box })    full-screen editor; resolves { box }, { reset: true } or null
     cropFile(file)        profile/pet photos: drag and zoom inside a circle, returns a square
                           JPEG File of just that part (or null if they tap Cancel)
   ======================================== */
(() => {
    const RATIO = 1.15;
    const DEFAULT_Y = 0.35;
    const MAX_ZOOM = 4;
    let tableMissing = false;

    const client = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const validBox = box => box && [box.x, box.y, box.w, box.h].every(Number.isFinite) && box.w > 0 && box.h > 0;

    function imgStyle(box) {
        if (!validBox(box)) {
            return 'position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;object-position:50% 35%;';
        }
        return `position:absolute;left:${(-box.x / box.w * 100).toFixed(3)}%;top:${(-box.y / box.h * 100).toFixed(3)}%;` +
            `width:${(100 / box.w).toFixed(3)}%;height:${(100 / box.h).toFixed(3)}%;max-width:none;max-height:none;object-fit:fill;`;
    }

    async function load(paths) {
        const map = new Map();
        const list = [...new Set((paths || []).filter(Boolean))];
        const sb = client();
        if (!list.length || tableMissing || !sb) return map;
        try {
            const { data, error } = await sb.from('photo_covers').select('storage_path, x, y, w, h').in('storage_path', list);
            if (error) throw error;
            for (const row of data || []) {
                const box = { x: Number(row.x), y: Number(row.y), w: Number(row.w), h: Number(row.h) };
                if (validBox(box)) map.set(row.storage_path, box);
            }
        } catch (error) {
            // Before paws-home-photos.sql is run every photo simply uses the default framing.
            if (/photo_covers|relation|schema cache|does not exist/i.test(error?.message || '')) tableMissing = true;
            console.warn('Photo covers:', error?.message || error);
        }
        return map;
    }

    async function save(path, box) {
        const sb = client();
        if (!sb || !path) throw new Error('Choose a photo first.');
        if (!navigator.onLine) throw new Error("You're offline. Reconnect and try again.");
        const args = validBox(box)
            ? { p_path: path, p_x: box.x, p_y: box.y, p_w: box.w, p_h: box.h }
            : { p_path: path, p_x: null, p_y: null, p_w: null, p_h: null };
        const { error } = await sb.rpc('set_photo_cover', args);
        if (error) {
            if (/set_photo_cover/i.test(error.message || '') && /not find|does not exist|schema cache/i.test(error.message || '')) {
                throw new Error('Adjust Cover needs the new Supabase script (paws-home-photos.sql). Run it, then try again.');
            }
            throw error;
        }
        tableMissing = false;
    }

    const CSS = `
        .pis-cover-dialog { position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0;
            border: 0; background: #0d1b28; color: #fff; font-family: Roboto, Arial, Helvetica, sans-serif; overscroll-behavior: contain; }
        .pis-cover-dialog::backdrop { background: #0d1b28; }
        .pis-cover-dialog[open] { display: flex; flex-direction: column; align-items: center; }
        .pis-cover-wrap { width: 100%; max-width: 460px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 14px;
            padding: calc(env(safe-area-inset-top, 0px) + 18px) 18px calc(env(safe-area-inset-bottom, 0px) + 18px); }
        .pis-cover-head { width: 100%; text-align: center; }
        .pis-cover-head h2 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
        .pis-cover-head p { margin: 4px 0 0; font-size: 13.5px; color: #b9c8d6; }
        .pis-cover-frame { position: relative; flex: none; width: min(100%, 340px, calc((100vh - 290px) / 1.15)); aspect-ratio: 1 / 1.15; border-radius: 26px;
            overflow: hidden; background: #183a57; touch-action: none; cursor: grab; box-shadow: 0 14px 34px rgba(0,0,0,.35); user-select: none; -webkit-user-select: none; }
        .pis-cover-frame:active { cursor: grabbing; }
        .pis-cover-frame img { pointer-events: none; -webkit-user-drag: none; }
        .pis-cover-shade { position: absolute; inset: 0; pointer-events: none;
            background: linear-gradient(180deg, rgba(8,24,40,.28) 0%, rgba(8,24,40,0) 24%, rgba(8,24,40,.05) 40%, rgba(8,24,40,.88) 100%); }
        .pis-cover-text-zone { position: absolute; left: 0; right: 0; bottom: 0; height: 44%; border-top: 2px dashed rgba(255,255,255,.55); pointer-events: none;
            display: flex; flex-direction: column; justify-content: flex-end; gap: 7px; padding: 0 16px 16px; box-sizing: border-box; }
        .pis-cover-text-zone span { display: block; height: 12px; border-radius: 6px; background: rgba(255,255,255,.4); }
        .pis-cover-text-zone span.button { height: 36px; border-radius: 12px; background: rgba(255,255,255,.55); margin-top: 6px; }
        .pis-cover-zone-label { position: absolute; left: 50%; top: 56%; transform: translate(-50%, -150%); padding: 4px 10px; border-radius: 999px;
            background: rgba(13,27,40,.7); font-size: 11.5px; font-weight: 700; white-space: nowrap; pointer-events: none; }
        .pis-cover-zoom { width: min(100%, 340px); display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 700; color: #d4e0ea; }
        .pis-cover-zoom input { flex: 1; accent-color: #f39a2b; height: 28px; }
        .pis-cover-help { margin: -4px 0 0; font-size: 13px; color: #b9c8d6; text-align: center; }
        .pis-cover-error { margin: 0; font-size: 13.5px; color: #ffb4a8; text-align: center; min-height: 0; }
        .pis-cover-error:empty { display: none; }
        .pis-cover-actions { width: min(100%, 340px); display: grid; grid-template-columns: auto 1fr 1fr; gap: 10px; margin-top: auto; }
        .pis-cover-actions button { height: 48px; border-radius: 14px; border: 0; font: 800 15px Roboto, Arial, sans-serif; padding: 0 16px; }
        .pis-cover-reset { background: transparent; color: #b9c8d6; text-decoration: underline; padding: 0 6px !important; }
        .pis-cover-cancel { background: rgba(255,255,255,.12); color: #fff; }
        .pis-cover-save { background: linear-gradient(135deg, #f7a531, #f07c1e); color: #fff; }
        .pis-cover-actions button:disabled { opacity: .55; }
        .pis-cover-actions button:focus-visible, .pis-cover-zoom input:focus-visible { outline: 3px solid #8fd0ff; outline-offset: 2px; }
        @media (prefers-color-scheme: light) { .pis-cover-dialog { color-scheme: dark; } }
        .pis-cover-frame.is-circle { border-radius: 18px; }
        .pis-cover-circle { position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
            box-shadow: 0 0 0 999px rgba(13,27,40,.62); border: 2px solid rgba(255,255,255,.9); }
        .boarding-photo-preview, .admin-visit-media-preview { position: relative; }
        .pis-cover-pill, .boarding-photo-preview .pis-cover-pill, .admin-visit-media-preview .pis-cover-pill {
            position: absolute !important; left: 6px !important; bottom: 6px !important; top: auto !important; right: auto !important; z-index: 2;
            display: inline-flex !important; align-items: center; gap: 4px; width: auto !important; height: 28px !important; min-height: 28px; min-width: 0 !important;
            padding: 0 9px !important; margin: 0 !important; border: 0 !important; border-radius: 999px !important; background: rgba(13,27,40,.82) !important;
            color: #fff !important; font: 800 11.5px/1 Roboto, Arial, sans-serif !important; box-shadow: none !important; cursor: pointer; }
        .pis-cover-pill svg { width: 12px; height: 12px; flex: none; }
        .pis-cover-pill:disabled { opacity: .5; }
        .pis-cover-pill:focus-visible { outline: 3px solid #8fd0ff; outline-offset: 2px; }
        .pis-cover-hint { flex-basis: 100%; grid-column: 1 / -1; width: 100%; margin: 6px 0 0; font-size: 12.5px; line-height: 1.35; color: #5b6b7c; }
        .pis-sortable-item, .pis-sortable-item img { -webkit-touch-callout: none !important; -webkit-user-select: none !important; user-select: none !important; -webkit-user-drag: none; }
        .pis-sort-placeholder { opacity: .3 !important; outline: 2px dashed #1f7bc2; outline-offset: 2px; }
        .pis-sort-ghost { box-shadow: 0 14px 30px rgba(10, 30, 50, .35) !important; transform: scale(1.06); opacity: .95; border-radius: 12px; overflow: hidden; }
        .pis-sort-ghost button { visibility: hidden; }
    `;

    function ensureCss() {
        if (document.getElementById('pis-cover-css')) return;
        const style = document.createElement('style');
        style.id = 'pis-cover-css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function edit({ src, box, ratio = RATIO, shape = 'card', title = 'Adjust Cover',
        subtitle = "This is how it shows on your client's Home screen." } = {}) {
        ensureCss();
        const circle = shape === 'circle';
        document.getElementById('pis-cover-dialog')?.remove();
        const dialog = document.createElement('dialog');
        dialog.id = 'pis-cover-dialog';
        dialog.className = 'pis-cover-dialog';
        dialog.setAttribute('aria-labelledby', 'pis-cover-title');
        dialog.innerHTML = `
            <div class="pis-cover-wrap">
                <div class="pis-cover-head">
                    <h2 id="pis-cover-title">${escapeText(title)}</h2>
                    <p>${escapeText(subtitle)}</p>
                </div>
                <div class="pis-cover-frame${circle ? ' is-circle' : ''}" data-cover-frame aria-label="Photo. Drag to move it."
                    style="aspect-ratio: 1 / ${ratio}; width: min(100%, 340px, calc((100vh - 290px) / ${ratio}));">
                    <img alt="" data-cover-img>
                    ${circle ? '<div class="pis-cover-circle" aria-hidden="true"></div>' : `
                    <div class="pis-cover-shade"></div>
                    <div class="pis-cover-text-zone" aria-hidden="true"><span style="width:72%"></span><span style="width:48%"></span><span class="button"></span></div>
                    <div class="pis-cover-zone-label" aria-hidden="true">Pet's name and buttons go here</div>`}
                </div>
                <label class="pis-cover-zoom" for="pis-cover-zoom">Zoom
                    <input id="pis-cover-zoom" type="range" min="1" max="${MAX_ZOOM}" step="0.01" value="1">
                </label>
                <p class="pis-cover-help">Drag to move. Pinch or slide to zoom.${circle ? '' : ' Keep the face above the dashed line.'}</p>
                <p class="pis-cover-error" data-cover-error role="status"></p>
                <div class="pis-cover-actions">
                    <button type="button" class="pis-cover-reset" data-cover-reset>Reset</button>
                    <button type="button" class="pis-cover-cancel pis-cover-close" data-cover-cancel>Cancel</button>
                    <button type="button" class="pis-cover-save" data-cover-save disabled>Save</button>
                </div>
            </div>`;
        document.body.appendChild(dialog);

        const frame = dialog.querySelector('[data-cover-frame]');
        const img = dialog.querySelector('[data-cover-img]');
        const zoomInput = dialog.querySelector('#pis-cover-zoom');
        const errorEl = dialog.querySelector('[data-cover-error]');
        const saveButton = dialog.querySelector('[data-cover-save]');
        const s = { natW: 0, natH: 0, z: 1, cx: 0.5, cy: 0.5 };

        const widthAtOne = () => Math.min(1, s.natH / (s.natW * ratio));
        function current() {
            const w = widthAtOne() / s.z;
            const h = w * s.natW * ratio / s.natH;
            s.cx = clamp(s.cx, w / 2, 1 - w / 2);
            s.cy = clamp(s.cy, h / 2, 1 - h / 2);
            return { x: s.cx - w / 2, y: s.cy - h / 2, w, h };
        }
        function draw() {
            if (!s.natW) return;
            img.style.cssText = imgStyle(current());
            zoomInput.value = String(s.z);
        }
        function startFrom(start) {
            if (validBox(start)) {
                s.z = clamp(widthAtOne() / start.w, 1, MAX_ZOOM);
                s.cx = start.x + start.w / 2;
                s.cy = start.y + start.h / 2;
            } else {
                s.z = 1;
                const w = widthAtOne();
                const h = w * s.natW * ratio / s.natH;
                s.cx = 0.5;
                s.cy = (1 - h) * DEFAULT_Y + h / 2;
            }
            draw();
        }

        img.addEventListener('load', () => {
            s.natW = img.naturalWidth;
            s.natH = img.naturalHeight;
            if (!s.natW || !s.natH) return;
            startFrom(box);
            saveButton.disabled = false;
        });
        img.addEventListener('error', () => { errorEl.textContent = "This photo couldn't be opened. Close and try again."; });
        img.src = src || '';

        // ---------- drag and pinch ----------
        const pointers = new Map();
        let last = null;
        function snapshot() {
            const pts = [...pointers.values()];
            if (!pts.length) return null;
            const mid = { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length };
            const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
            return { mid, dist, n: pts.length };
        }
        frame.addEventListener('pointerdown', event => {
            if (!s.natW) return;
            frame.setPointerCapture?.(event.pointerId);
            pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            last = snapshot();
        });
        frame.addEventListener('pointermove', event => {
            if (!pointers.has(event.pointerId) || !last) return;
            pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            const now = snapshot();
            const rect = frame.getBoundingClientRect();
            const b = current();
            if (now.n === last.n) {
                s.cx -= (now.mid.x - last.mid.x) / rect.width * b.w;
                s.cy -= (now.mid.y - last.mid.y) / rect.height * b.h;
                if (now.n > 1 && last.dist > 0) s.z = clamp(s.z * now.dist / last.dist, 1, MAX_ZOOM);
            }
            last = now;
            draw();
        });
        const release = event => {
            pointers.delete(event.pointerId);
            last = snapshot();
        };
        frame.addEventListener('pointerup', release);
        frame.addEventListener('pointercancel', release);
        frame.addEventListener('wheel', event => {
            if (!s.natW) return;
            event.preventDefault();
            s.z = clamp(s.z * (event.deltaY < 0 ? 1.06 : 1 / 1.06), 1, MAX_ZOOM);
            draw();
        }, { passive: false });
        zoomInput.addEventListener('input', () => { s.z = clamp(Number(zoomInput.value) || 1, 1, MAX_ZOOM); draw(); });

        return new Promise(resolve => {
            let done = false;
            function finish(result) {
                if (done) return;
                done = true;
                try { dialog.close(); } catch { /* ignore */ }
                dialog.remove();
                resolve(result);
            }
            dialog.querySelector('[data-cover-cancel]').addEventListener('click', () => finish(null));
            dialog.querySelector('[data-cover-reset]').addEventListener('click', () => {
                if (!s.natW) return finish({ reset: true });
                startFrom(null);
                finish({ reset: true });
            });
            saveButton.addEventListener('click', () => {
                if (!s.natW) return;
                const b = current();
                finish({ box: { x: +b.x.toFixed(5), y: +b.y.toFixed(5), w: +b.w.toFixed(5), h: +b.h.toFixed(5) } });
            });
            dialog.addEventListener('cancel', event => { event.preventDefault(); finish(null); });
            try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
            dialog.querySelector('[data-cover-cancel]').focus({ preventScroll: true });
        });
    }

    // Profile and pet photos: frame inside a circle, then keep only that square.
    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("That photo couldn't be opened. Try another one."));
            img.src = url;
        });
    }
    async function cropFile(file, { size = 900, title = 'Adjust Photo', subtitle = 'Drag and zoom so it looks right in the circle.' } = {}) {
        if (!file) return null;
        const url = URL.createObjectURL(file);
        try {
            const result = await edit({ src: url, ratio: 1, shape: 'circle', title, subtitle });
            if (!result) return null;
            const img = await loadImage(url);
            const natW = img.naturalWidth;
            const natH = img.naturalHeight;
            let box = result.box;
            if (!validBox(box)) {   // Reset: the standard square, centered and a little high
                const w = Math.min(1, natH / natW);
                const h = w * natW / natH;
                box = { x: (1 - w) / 2, y: (1 - h) * DEFAULT_Y, w, h };
            }
            const sw = box.w * natW;
            const sh = box.h * natH;
            const out = Math.max(1, Math.min(size, Math.round(sw)));
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = out;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, out, out);
            ctx.drawImage(img, box.x * natW, box.y * natH, sw, sh, 0, 0, out, out);
            const blob = await new Promise((resolve, reject) => canvas.toBlob(
                b => (b ? resolve(b) : reject(new Error("That photo couldn't be prepared. Try another one."))), 'image/jpeg', 0.9));
            const name = `${String(file.name || 'photo').replace(/\.[^.]+$/, '')}.jpg`;
            try { return new File([blob], name, { type: 'image/jpeg' }); } catch { blob.name = name; return blob; }
        } finally {
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }

    // The small "Cover" button on a photo tile (the tile handles the click).
    function pillHtml(attributes, disabled) {
        return `<button type="button" class="pis-cover-pill" ${attributes} aria-label="Adjust Cover" title="Adjust how this photo looks on your client's Home screen"${disabled ? ' disabled' : ''}>` +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>Cover</button>';
    }

    // ---------- hold and drag photos into a new order ----------
    // PisPhotoSort.register({ items, owns(item), disabled(item), onDrop(item, from, to) })
    // items: a selector for the tiles; tiles that share a parent are one list.
    // Touch: hold for a moment, then drag. Mouse: press and drag. Buttons on a tile still work.
    const sorters = [];
    let press = null;
    let drag = null;
    const HOLD_MS = 320;

    function sorterFor(target) {
        for (const sorter of sorters) {
            const item = target.closest?.(sorter.items);
            if (item && (!sorter.owns || sorter.owns(item))) return { sorter, item };
        }
        return null;
    }
    const siblingsOf = (sorter, item) => [...item.parentElement.children].filter(el => el.matches(sorter.items));

    function cancelPress() {
        if (press) clearTimeout(press.timer);
        press = null;
    }
    function startDrag(x, y) {
        const { sorter, item, id } = press;
        cancelPress();
        if (sorter.disabled?.(item)) return;
        const list = siblingsOf(sorter, item);
        const from = list.indexOf(item);
        if (from < 0 || list.length < 2) return;
        const r = item.getBoundingClientRect();
        const ghost = item.cloneNode(true);
        ghost.removeAttribute('id');
        ghost.classList.add('pis-sort-ghost');
        ghost.classList.remove('pis-sort-placeholder');
        ghost.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;z-index:2147483000;pointer-events:none;`;
        (item.closest('dialog[open]') || document.body).appendChild(ghost);
        // inside a moved or zoomed sheet, "fixed" can be measured from the sheet: correct for it
        const at = ghost.getBoundingClientRect();
        const fix = { x: at.left - r.left, y: at.top - r.top };
        item.classList.add('pis-sort-placeholder');
        drag = { sorter, item, ghost, from, id, fix, dx: x - r.left, dy: y - r.top };
        try { window.PisHaptics?.light?.(); } catch { /* ignore */ }
    }
    function moveDrag(x, y) {
        const { sorter, item, ghost, fix } = drag;
        ghost.style.left = `${x - drag.dx - fix.x}px`;
        ghost.style.top = `${y - drag.dy - fix.y}px`;
        const list = siblingsOf(sorter, item);
        const target = list.find(el => {
            if (el === item) return false;
            const b = el.getBoundingClientRect();
            return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
        });
        if (!target) return;
        const ti = list.indexOf(target);
        const di = list.indexOf(item);
        target.parentElement.insertBefore(item, ti > di ? target.nextSibling : target);
        try { window.PisHaptics?.selection?.(); } catch { /* ignore */ }
    }
    function endDrag(event) {
        if (press && event.pointerId === press.id) cancelPress();
        if (!drag || event.pointerId !== drag.id) return;
        const { sorter, item, ghost, from } = drag;
        drag = null;
        ghost.remove();
        item.classList.remove('pis-sort-placeholder');
        const to = siblingsOf(sorter, item).indexOf(item);
        if (to !== from && to >= 0) {
            try { sorter.onDrop(item, from, to); } catch (error) { console.error('Photo order:', error); }
        }
    }

    function listenForSorting() {
        if (listenForSorting.on) return;
        listenForSorting.on = true;
        document.addEventListener('pointerdown', event => {
            if (drag || event.button > 0 || event.target.closest('button, a, input, label')) return;
            const found = sorterFor(event.target);
            if (!found || found.sorter.disabled?.(found.item)) return;
            press = { ...found, id: event.pointerId, x: event.clientX, y: event.clientY, mouse: event.pointerType === 'mouse' };
            if (!press.mouse) press.timer = setTimeout(() => press && startDrag(press.x, press.y), HOLD_MS);
        }, true);
        document.addEventListener('pointermove', event => {
            if (drag && event.pointerId === drag.id) { moveDrag(event.clientX, event.clientY); return; }
            if (!press || event.pointerId !== press.id) return;
            const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
            if (press.mouse) { if (moved > 6) startDrag(event.clientX, event.clientY); }
            else if (moved > 10) cancelPress();   // the finger moved before the hold: it's a scroll
        }, true);
        document.addEventListener('pointerup', endDrag, true);
        document.addEventListener('pointercancel', endDrag, true);
        // while a photo is lifted the page must not scroll under the finger
        document.addEventListener('touchmove', event => { if (drag) event.preventDefault(); }, { passive: false, capture: true });
        // no "Save Image" menu when holding a photo
        document.addEventListener('contextmenu', event => { if (sorterFor(event.target)) event.preventDefault(); }, true);
        // tag tiles so phones don't select or preview them on hold
        const tag = () => sorters.forEach(s => document.querySelectorAll(s.items).forEach(el => el.classList.add('pis-sortable-item')));
        new MutationObserver(tag).observe(document.documentElement, { childList: true, subtree: true });
        tag();
    }

    window.PisPhotoSort = {
        register(options) {
            if (!options?.items || typeof options.onDrop !== 'function') return;
            sorters.push(options);
            if (document.body) listenForSorting(); else document.addEventListener('DOMContentLoaded', listenForSorting);
        },
        move(list, from, to) {
            const copy = [...list];
            const [moved] = copy.splice(from, 1);
            copy.splice(to, 0, moved);
            return copy;
        }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureCss); else ensureCss();
    window.PisCover = { RATIO, imgStyle, load, save, edit, cropFile, pillHtml };
})();
