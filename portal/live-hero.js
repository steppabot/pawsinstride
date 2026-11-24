// ========================================
// LIVE VISIT CARD (owner app and client app)
// ========================================
//
// Every visit that's happening gets the same big card the boarding walk has:
// a title, two big tiles (Time + Distance for a walk; Visit Time + one more
// for other visits) and a line or two underneath. The color follows the
// service (walk blue, drop-in teal, sit pink, boarding orange).
//
// Owner app: buildAdminVisitProgressSection (admin.js) still decides what the
//   visit shows and which buttons it gets; this only lays it out as the card.
// Client app: buildClientVisitProgressSection (portal.js) shows the card for
//   visits that are happening; boarding nights show it during a walk.
// Times tick every second here; walk distance updates as GPS points arrive.
// ========================================

(() => {
    'use strict';
    if (window.PisLiveHero) return;

    const kindOf = visit => {
        const t = `${visit?.service_type || ''} ${visit?.service_name || ''}`.toLowerCase();
        if (/meet\s*(&|and)?\s*greet/.test(t)) return 'meet';
        if (/board/.test(t)) return 'board';
        if (/drop/.test(t)) return 'drop';
        if (/pet[\s_-]*sit/.test(t)) return 'sit';
        if (/walk/.test(t)) return 'walk';
        return 'visit';
    };
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const clock = seconds => {
        const s = Math.max(0, Math.floor(Number(seconds) || 0));
        return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':');
    };
    const since = iso => { const t = new Date(iso).getTime(); return Number.isFinite(t) ? clock((Date.now() - t) / 1000) : '00:00:00'; };
    const timeOf = iso => {
        const d = new Date(iso);
        return Number.isFinite(d.getTime()) ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' }) : '';
    };
    const miles = meters => { const m = Number(meters) / 1609.344; return `${(Number.isFinite(m) ? m : 0).toFixed(2)} mi`; };
    const windowEnd = visit => String(visit?.time_window || '').split(/\s*[-–]\s*/)[1]?.trim() || '';

    // ---------- styles ----------
    const css = document.createElement('style');
    css.id = 'pis-live-hero-css';
    css.textContent = `
        .pis-live { --live-bg: #eef5ff; --live-line: #c7dbf7; --live-title: #1f5fbf; --live-label: #3f6595;
            margin: 14px 0 0 !important; padding: 16px !important; border: 1px solid var(--live-line) !important; border-radius: 18px !important;
            background: var(--live-bg) !important; box-shadow: none !important; display: block !important; text-align: left; }
        .pis-live[data-kind="drop"] { --live-bg: #ebfafc; --live-line: #b5e5ee; --live-title: #0b7c8f; --live-label: #2c6a75; }
        .pis-live[data-kind="sit"] { --live-bg: #fdf0f5; --live-line: #f1c3d5; --live-title: #b8336a; --live-label: #8d3e5e; }
        .pis-live[data-kind="board"] { --live-bg: #fff8f1; --live-line: #f2cfae; --live-title: #c0610c; --live-label: #8a5a2b; }
        .pis-live[data-kind="meet"] { --live-bg: #f4f1fd; --live-line: #d9cef5; --live-title: #6b46c1; --live-label: #5b4794; }
        .pis-live h6 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px !important; padding: 0 !important;
            font-size: 12px !important; font-weight: 800 !important; letter-spacing: .08em; text-transform: uppercase; color: var(--live-title) !important; }
        .pis-live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--live-title); flex: 0 0 auto;
            box-shadow: 0 0 0 0 var(--live-title); animation: pisLivePulse 1.8s ease-out infinite; }
        .pis-live.is-paused .pis-live-dot, .pis-live.is-done .pis-live-dot { animation: none; opacity: .5; }
        @keyframes pisLivePulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--live-title) 45%, transparent); }
            70% { box-shadow: 0 0 0 8px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
        @media (prefers-reduced-motion: reduce) { .pis-live-dot { animation: none; } }
        .pis-live-tiles { display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px !important; margin: 8px 0 8px !important; }
        .pis-live-tiles > span { display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
            min-width: 0; padding: 12px 6px !important; background: #ffffff !important; border: 1px solid var(--live-line) !important;
            border-radius: 14px !important; font-size: 12px !important; font-weight: 700 !important; color: var(--live-label) !important; text-align: center; }
        .pis-live-tiles strong { display: block; max-width: 100%; font-size: 30px !important; line-height: 1.1 !important; font-weight: 800 !important;
            color: #183447 !important; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pis-live-tiles strong.is-word { font-size: 22px !important; }
        .pis-live-meta { margin: 2px 0 0 !important; font-size: 14px !important; line-height: 1.4 !important; color: #41556b !important; font-weight: 500 !important; }
        .pis-live-meta.is-note { color: var(--live-label) !important; font-weight: 700 !important; }
        .pis-live > .admin-completed-visit-actions, .pis-live > button { margin-top: 12px !important; }
        .csd-body .pis-live { margin: 0 0 14px !important; }
        .client-inline-heading { margin: 16px 0 8px; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #5b6b80; }
        .client-boarding-inline .client-boarding-walk-section h3 { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #5b6b80; }
    `;
    document.head.appendChild(css);

    // ---------- the card ----------
    function card({ kind, title, tiles, meta = [], tail = '', paused = false }) {
        return `<div class="pis-live${paused ? ' is-paused' : ''}" data-kind="${esc(kind)}">
            <h6><span class="pis-live-dot" aria-hidden="true"></span>${esc(title)}</h6>
            <div class="pis-live-tiles">${tiles.map(t => `<span>${esc(t.label)}<strong${t.id ? ` id="${esc(t.id)}"` : ''}${t.since ? ` data-pis-since="${esc(t.since)}"` : ''}${t.miles ? ` data-pis-miles="${esc(t.miles)}"` : ''}${t.word ? ' class="is-word"' : ''}>${esc(t.value)}</strong></span>`).join('')}</div>
            ${meta.filter(Boolean).map(m => typeof m === 'string' ? `<p class="pis-live-meta">${esc(m)}</p>` : `<p class="pis-live-meta${m.note ? ' is-note' : ''}"${m.id ? ` id="${esc(m.id)}"` : ''}>${esc(m.text)}</p>`).join('')}
            ${tail}
        </div>`;
    }

    // ---------- tick ----------
    function tick() {
        document.querySelectorAll('[data-pis-since]').forEach(el => { el.textContent = since(el.dataset.pisSince); });
        if (typeof currentClientLiveWalks !== 'undefined' && currentClientLiveWalks?.get) {
            document.querySelectorAll('[data-pis-miles]').forEach(el => {
                const walk = currentClientLiveWalks.get(Number(el.dataset.pisMiles));
                if (walk) el.textContent = miles(walk.distance_meters);
            });
        }
    }
    setInterval(() => { if (!document.hidden && document.querySelector('[data-pis-since], [data-pis-miles]')) tick(); }, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

    // ========================================
    // OWNER APP
    // ========================================
    const WALK_NUMBERS = /(\d{1,2}:\d{2}:\d{2})\s*•\s*([\d.]+)\s*mi\b\s*(?:•\s*)?(.*)$/;

    function ownerCard(html, visit, progress) {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const root = tpl.content.querySelector('.admin-visit-progress');
        const copy = root?.querySelector('.admin-visit-progress-copy');
        if (!root || !copy) return html;
        const id = Number(visit.id);
        const kind = kindOf(visit);
        const strong = copy.querySelector(':scope > strong');
        let title = (strong?.textContent || '').replace(/[^\p{L}\p{N}&' -]+/gu, ' ').replace(/\s+/g, ' ').trim() || 'Visit In Progress';
        strong?.remove();
        const lines = [...copy.querySelectorAll(':scope > span')];
        const used = new Set();
        const tiles = [];
        const meta = [];
        const checkedInAt = progress?.checkedInAt || visit.checked_in_at;
        let paused = false;

        const dur = copy.querySelector(`#admin-walk-duration-${id}`);
        const dist = copy.querySelector(`#admin-walk-distance-${id}`);
        if (dur && dist) {
            // walk happening now
            const walk = typeof getVisitWalk === 'function' ? getVisitWalk(id) : null;
            tiles.push({ label: 'Time', id: dur.id, value: dur.textContent.replace(/\s+/g, ' ').trim(), since: walk?.status === 'in_progress' ? walk.started_at : '' });
            tiles.push({ label: 'Distance', id: dist.id, value: dist.textContent.replace(/\s+/g, ' ').trim() });
            lines.forEach(l => { if (l.contains(dur) || l.contains(dist)) used.add(l); });
        } else {
            const numbers = lines.find(l => WALK_NUMBERS.test(l.textContent.replace(/\s+/g, ' ')));
            if (numbers) {
                // walk finished (or saved on this phone): its totals
                const [, time, mi, rest] = numbers.textContent.replace(/\s+/g, ' ').trim().match(WALK_NUMBERS);
                tiles.push({ label: 'Walk Time', value: time }, { label: 'Distance', value: `${mi} mi` });
                                used.add(numbers);
                if (rest?.trim() && !/GPS points?$/i.test(rest.trim())) meta.push(rest.trim());
                paused = true;
            } else if (/complete|saved/i.test(title)) {
                return html;   // a finished visit waiting to sync keeps its own layout
            } else {
                // visit happening, no walk numbers
                tiles.push({ label: 'Visit Time', value: since(checkedInAt), since: checkedInAt });
                if (kind === 'sit') tiles.push({ label: 'Sit Ends', value: windowEnd(visit) || '—', word: true });
                else if (kind === 'walk') tiles.push({ label: 'Walk', value: 'Not Started', word: true });
                else tiles.push({ label: 'Checked In', value: timeOf(checkedInAt) || '—', word: true });
                if (kind === 'sit' && /visit in progress/i.test(title)) title = 'Sit In Progress';
                if (kind === 'drop' || kind === 'visit' || kind === 'meet') {
                    lines.forEach(l => { if (/^checked in/i.test(l.textContent.trim())) used.add(l); });
                }
            }
        }
        lines.forEach(line => {
            if (used.has(line)) return;
                        const text = line.textContent.replace(/\s+/g, ' ').trim();
            if (!text || text === '•') return;
            // like the boarding walk: no GPS point count, and only mention GPS when it isn't recording
            if (line.id === `admin-walk-points-${id}` || /^\d+ GPS points?$/i.test(text) || /^GPS tracking active$/i.test(text)) return;
            if (/GPS tracking paused/i.test(text)) { paused = true; meta.push({ text: 'GPS is not recording on this device.', note: true }); return; }
            meta.push({ text, id: line.id || '', note: /saved on this phone|waiting|still in progress/i.test(text) });
        });
                // "Walk started at 12:12 PM · Checked in at 12:09 PM" on one line
        const textOf = m => (typeof m === 'string' ? m : m.text);
        const started = meta.findIndex(m => /^walk started at /i.test(textOf(m)));
        const checked = meta.findIndex(m => /^visit checked in at /i.test(textOf(m)));
        if (started >= 0 && checked >= 0) {
            meta[started] = `${textOf(meta[started])} · ${textOf(meta[checked]).replace(/^visit /i, '').replace(/^c/, 'C')}`;
            meta.splice(checked, 1);
        }
        
        // everything else (buttons) stays as it was, under the card's text
        const tail = [...root.children].filter(el => el !== copy).map(el => el.outerHTML).join('');
        const out = document.createElement('template');
        out.innerHTML = card({ kind, title, tiles, meta, tail, paused });
        const hero = out.content.firstElementChild;
        hero.classList.add('admin-visit-progress', 'admin-visit-progress-live');
        return hero.outerHTML;
    }

    if (typeof window.buildAdminVisitProgressSection === 'function') {
        const original = window.buildAdminVisitProgressSection;
        window.buildAdminVisitProgressSection = function (visit, progress) {
            const html = original.apply(this, arguments);
            if (progress?.state !== 'checked_in' || /board/i.test(`${visit?.service_type || ''} ${visit?.service_name || ''}`)) return html;
            try { return ownerCard(html, visit, progress); }
            catch (error) { console.warn('Live card (owner):', error); return html; }
        };
    }

    // ========================================
    // CLIENT APP
    // ========================================
    function clientCard(visit, progress, walk) {
        const kind = kindOf(visit);
        const checkedInAt = progress?.checkedInAt || visit.checked_in_at;
        if (walk) {
            return card({
                kind, title: kind === 'board' ? 'Boarding Walk In Progress' : 'Walk In Progress',
                tiles: [
                    { label: 'Time', value: since(walk.started_at), since: walk.started_at },
                    { label: 'Distance', value: miles(walk.distance_meters), miles: visit.id }
                ],
                meta: [`Started at ${timeOf(walk.started_at)} · Updates live`]
            });
        }
        const title = kind === 'sit' ? 'Sit In Progress' : kind === 'meet' ? 'Meet & Greet In Progress' : 'Visit In Progress';
        const second = kind === 'sit' ? { label: 'Sit Ends', value: windowEnd(visit) || '—', word: true }
            : kind === 'walk' ? { label: 'Walk', value: 'Starting Soon', word: true }
            : { label: 'Checked In', value: timeOf(checkedInAt) || '—', word: true };
        return card({
            kind, title,
            tiles: [{ label: 'Visit Time', value: since(checkedInAt), since: checkedInAt }, second],
            meta: [kind === 'drop' || kind === 'visit' ? '' : `Checked in at ${timeOf(checkedInAt)}`]
        });
    }
    window.buildClientLiveHero = clientCard;

    if (typeof window.buildClientVisitProgressSection === 'function') {
        const original = window.buildClientVisitProgressSection;
        window.buildClientVisitProgressSection = function (visit, progress) {
            if (progress?.state === 'checked_in') {
                try {
                    const walk = typeof currentClientLiveWalks !== 'undefined' ? currentClientLiveWalks.get?.(Number(visit.id)) || null : null;
                    return clientCard(visit, progress, walk);
                } catch (error) { console.warn('Live card (client):', error); }
            }
            return original.apply(this, arguments);
        };
    }

    window.PisLiveHero = { kindOf, tick };
})();
