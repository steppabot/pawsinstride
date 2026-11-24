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
//
// Client walks (and boarding walks) also get a live map under the tiles
// (pis-map.js). When a visit is finished, both apps show the same card in
// green ("Visit Complete" / "Walk Complete" / "Sit Complete" /
// "Boarding Complete"), and the client's visit report opens right under it.
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
    const length = minutes => {
        const m = Math.round(Number(minutes));
        if (!Number.isFinite(m) || m < 0) return '—';
        return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
    };
    const shortDate = date => { const d = new Date(`${String(date || '').slice(0, 10)}T12:00:00Z`); return Number.isFinite(d.getTime()) ? d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }) : ''; };
    const nightsBetween = (a, b) => { const n = Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000); return Number.isFinite(n) && n >= 0 ? n : null; };
    const range = (a, b, minutes) => { const from = timeOf(a), to = timeOf(b); return from && to ? `${from} – ${to}${Number.isFinite(Number(minutes)) && minutes !== null ? ` · ${length(minutes)}` : ''}` : ''; };
    const mapBox = (walkId, live) => walkId ? `<div class="pis-map-box" data-pis-map-walk="${Number(walkId)}" data-pis-map-live="${live ? 1 : 0}" role="img" aria-label="${live ? 'Map of the walk so far' : 'Map of the walk'}"></div>` : '';
    const CHECK = '<span class="pis-live-check" aria-hidden="true"><svg viewBox="0 0 16 16" width="10" height="10"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
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
        .pis-live.is-done, .pis-live.is-done[data-kind] { --live-bg: #eefaf2; --live-line: #bfe6cc; --live-title: #17733a; --live-label: #2e6b45; }
        .pis-live-check { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%;
            background: #1f9d55; flex: 0 0 auto; }
        .pis-live .pis-map-box { margin: 0 0 8px; }
        .pis-live-tiles strong.is-pending { color: #9fb3a7 !important; }
        .pis-done-report-button { margin-top: 12px !important; }
        .csd-overlay .pis-done-report-button { display: none !important; }
        .csd-body .pis-live.is-done { margin: 0 !important; }
        .csd-body .pis-live.is-done ~ .client-visit-report-mount { margin-top: 0 !important; }
        .vfm-body.vfm-report-mode > .pis-live.is-done { display: none !important; }
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
    function card({ kind, title, tiles, meta = [], tail = '', paused = false, done = false, map = '', attrs = '' }) {
        return `<div class="pis-live${paused ? ' is-paused' : ''}${done ? ' is-done' : ''}" data-kind="${esc(kind)}"${attrs}>
            <h6>${done ? CHECK : '<span class="pis-live-dot" aria-hidden="true"></span>'}${esc(title)}</h6>
            <div class="pis-live-tiles">${tiles.map(tileHtml).join('')}</div>
            ${map}
            ${meta.filter(Boolean).map(m => typeof m === 'string' ? `<p class="pis-live-meta">${esc(m)}</p>` : `<p class="pis-live-meta${m.note ? ' is-note' : ''}"${m.id ? ` id="${esc(m.id)}"` : ''}>${esc(m.text)}</p>`).join('')}
            ${tail}
        </div>`;
    }

    function tileHtml(t) {
        const cls = [t.word ? 'is-word' : '', t.pending ? 'is-pending' : ''].filter(Boolean).join(' ');
        return `<span>${esc(t.label)}<strong${t.id ? ` id="${esc(t.id)}"` : ''}${t.since ? ` data-pis-since="${esc(t.since)}"` : ''}${t.miles ? ` data-pis-miles="${esc(t.miles)}"` : ''}${t.count ? ` data-pis-count="${esc(t.count)}"` : ''}${cls ? ` class="${cls}"` : ''}>${esc(t.value)}</strong></span>`;
    }

    // ---------- counts in finished cards (sit updates sent, boarding walks) ----------
    const counts = new Map();   // key -> { value, at }
    async function fetchCount(key) {
        const [type, id] = key.split(':');
        const client = typeof supabaseClient !== 'undefined' ? supabaseClient : null;
        if (!client || !id) return null;
        const query = type === 'sit'
            ? client.from('visit_updates').select('id', { count: 'exact', head: true }).eq('visit_id', Number(id)).not('published_at', 'is', null)
            : client.from('visit_walks').select('id', { count: 'exact', head: true }).eq('boarding_stay_id', id).eq('status', 'completed');
        const { count, error } = await query;
        if (error) throw error;
        return Number(count) || 0;
    }
    function fillCounts() {
        document.querySelectorAll('[data-pis-count]').forEach(el => {
            const key = el.dataset.pisCount;
            const known = counts.get(key);
            if (known && Number.isFinite(known.value) && el.textContent !== String(known.value)) { el.textContent = String(known.value); el.classList.remove('is-pending'); }
            if (known && (known.busy || Date.now() - known.at < 60000)) return;
            counts.set(key, { ...(known || {}), busy: true, at: Date.now() });
            fetchCount(key).then(value => {
                counts.set(key, { value, at: Date.now() });
                document.querySelectorAll(`[data-pis-count="${CSS.escape(key)}"]`).forEach(t => { t.textContent = String(value); t.classList.remove('is-pending'); });
            }).catch(error => { console.warn('Card count:', error); counts.set(key, { ...(counts.get(key) || {}), busy: false, at: Date.now() }); });
        });
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

    // A finished visit: the same card in green, buttons kept under it.
    function ownerDoneCard(html, visit, progress) {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const root = tpl.content.querySelector('.admin-visit-progress');
        if (!root) return html;
        const id = Number(visit.id);
        const kind = kindOf(visit);
        const walking = typeof isWalkingService === 'function' ? isWalkingService(visit) : kind === 'walk';
        const walk = walking && typeof getVisitWalk === 'function' ? getVisitWalk(id) : null;
        const savedVisit = typeof loadPendingVisitFinish === 'function' ? loadPendingVisitFinish(id) : null;
        const savedWalk = walk && typeof loadPendingWalkFinish === 'function' ? loadPendingWalkFinish(walk.id) : null;
        const report = typeof allVisitReports !== 'undefined' ? allVisitReports.find(r => Number(r.visit_id) === id) : null;
        const stats = savedWalk || (walk?.status === 'completed' ? walk : null);
        let title; let tiles; let map = '';
        if (stats) {
            title = savedWalk ? 'Walk Saved' : 'Walk Complete';
            tiles = [{ label: 'Walk Time', value: clock(stats.duration_seconds) }, { label: 'Distance', value: miles(stats.distance_meters) }];
            if (!savedWalk && walk?.id) map = mapBox(walk.id, false);
        } else if (kind === 'sit') {
            title = 'Sit Complete';
            tiles = [{ label: 'Sit Time', value: length(progress.minutes) }, { label: 'Updates Sent', value: '—', count: `sit:${id}`, pending: true }];
        } else {
            title = kind === 'meet' ? 'Meet & Greet Complete' : 'Visit Complete';
            tiles = [{ label: 'Visit Time', value: length(progress.minutes) }, { label: 'Finished', value: timeOf(progress.completedAt) || '—', word: true }];
        }
        const meta = [range(progress.checkedInAt || visit.checked_in_at, progress.completedAt || visit.completed_at, progress.minutes)];
        if (kind !== 'meet') {
            meta.push(report?.published_at ? `Report sent at ${timeOf(report.published_at)}`
                : report ? 'Report saved' : { text: 'No visit report yet', note: true });
        }
        if (savedVisit || savedWalk) meta.push({ text: 'Saved on this phone · Waiting to sync', note: true });
        const tail = [...root.children].filter(el => !el.matches('.admin-visit-progress-copy')).map(el => el.outerHTML).join('');
        const out = document.createElement('template');
        out.innerHTML = card({ kind, title, tiles, meta, tail, done: true, map });
        const hero = out.content.firstElementChild;
        hero.classList.add('admin-visit-progress', 'admin-visit-progress-finished');
        root.replaceWith(hero);
        return tpl.innerHTML;
    }

    if (typeof window.buildAdminVisitProgressSection === 'function') {
        const original = window.buildAdminVisitProgressSection;
        window.buildAdminVisitProgressSection = function (visit, progress) {
            const html = original.apply(this, arguments);
            if (/board/i.test(`${visit?.service_type || ''} ${visit?.service_name || ''}`)) return html;
            try {
                if (progress?.state === 'completed') return ownerDoneCard(html, visit, progress);
                if (progress?.state === 'checked_in') return ownerCard(html, visit, progress);
            } catch (error) { console.warn('Visit card (owner):', error); }
            return html;
        };
    }

    // Boarding stay finished (or tonight's night done): green card too.
    if (typeof window.buildAdminBoardingCard === 'function') {
        const original = window.buildAdminBoardingCard;
        window.buildAdminBoardingCard = function (visit) {
            const html = original.apply(this, arguments);
            try {
                if (String(visit?.status || '').toLowerCase() === 'cancelled' && !visit.boarding_pickup_display_only) return html;
                const stay = typeof getAdminBoardingReservation === 'function' ? getAdminBoardingReservation(visit) : null;
                if (!stay || stay.issue) return html;
                const loaded = typeof adminBoardingState !== 'undefined' && adminBoardingState.loaded;
                const nightDone = loaded && stay.status !== 'completed' && typeof isAdminBoardingNightDone === 'function' && isAdminBoardingNightDone(visit, stay);
                if (stay.status !== 'completed' && !nightDone) return html;
                const tpl = document.createElement('template');
                tpl.innerHTML = html;
                const root = tpl.content.querySelector('.admin-service-card > .admin-visit-progress');
                if (!root) return html;
                const walks = typeof getAdminBoardingWalks === 'function' ? getAdminBoardingWalks(stay.id).filter(w => w.status === 'completed') : [];
                const stamp = value => (typeof formatAdminBoardingTimestamp === 'function' ? formatAdminBoardingTimestamp(value) : timeOf(value));
                let options;
                if (stay.status === 'completed') {
                    const nights = nightsBetween(stay.dropoff_date, stay.pickup_date);
                    options = {
                        title: 'Boarding Complete',
                        tiles: [{ label: 'Nights', value: nights ?? '—' }, { label: 'Walks', value: walks.length }],
                        meta: [stay.dropoff_date && stay.pickup_date ? `${shortDate(stay.dropoff_date)} – ${shortDate(stay.pickup_date)}` : '',
                            stay.started_at ? `Arrived ${stamp(stay.started_at)}` : '',
                            stay.ended_at ? `Picked up ${stamp(stay.ended_at)}` : '']
                    };
                } else {
                    options = {
                        title: 'Night Complete',
                        tiles: [{ label: 'Walks Tonight', value: walks.filter(w => w.boarding_date === visit.visit_date).length },
                            { label: 'Pickup', value: shortDate(stay.pickup_date) || '—', word: true }],
                        meta: ['Boarding continues until pickup.']
                    };
                }
                const tail = [...root.children].filter(el => !el.matches('.admin-visit-progress-copy')).map(el => el.outerHTML).join('');
                const out = document.createElement('template');
                out.innerHTML = card({ kind: 'board', ...options, tail, done: true });
                const hero = out.content.firstElementChild;
                hero.classList.add('admin-visit-progress', 'admin-visit-progress-finished');
                root.replaceWith(hero);
                return tpl.innerHTML;
            } catch (error) { console.warn('Boarding card (owner):', error); return html; }
        };
    }

    // ========================================
    // CLIENT APP
    // ========================================
    // Finished walks the client has seen, so the green card shows the walk's
    // numbers (and map) straight away next time.
    const WALKS_KEY = 'pis-walks-done';
    const readWalks = () => { try { return JSON.parse(localStorage.getItem(WALKS_KEY) || '{}') || {}; } catch { return {}; } };
    function rememberWalk(visitId, walk) {
        if (!walk?.id) return;
        try {
            const all = readWalks();
            all[visitId] = { w: Number(walk.id), s: Number(walk.duration_seconds) || 0, m: Number(walk.distance_meters) || 0, a: Date.now() };
            const keep = Object.entries(all).sort((a, b) => b[1].a - a[1].a).slice(0, 40);
            localStorage.setItem(WALKS_KEY, JSON.stringify(Object.fromEntries(keep)));
        } catch { /* storage full or off: the card fills in when the report loads */ }
    }
    const seenLive = new Map();      // visit id -> last live walk seen (to show "Walk Finished" right away)
    const finishedWalks = new Map(); // visit id -> finished walk, while the visit is still open
    const lookedUp = new Map();      // visit id -> when we last checked for a finished walk

    function clientCard(visit, progress, walk) {
        const kind = kindOf(visit);
        const checkedInAt = progress?.checkedInAt || visit.checked_in_at;
        const attrs = ` data-pis-visit="${Number(visit.id)}"`;
        if (walk) {
            seenLive.set(Number(visit.id), walk);
            return card({
                kind, attrs, title: kind === 'board' ? 'Boarding Walk In Progress' : 'Walk In Progress',
                tiles: [
                    { label: 'Time', value: since(walk.started_at), since: walk.started_at },
                    { label: 'Distance', value: miles(walk.distance_meters), miles: visit.id }
                ],
                map: mapBox(walk.id, true),
                meta: [`Started at ${timeOf(walk.started_at)} · The route draws as they walk`]
            });
        }
        if (kind === 'walk') {
            // the walk is over but the visit isn't finished yet
            const ended = finishedWalks.get(Number(visit.id));
            if (ended) {
                return card({
                    kind, attrs, title: 'Walk Finished', paused: true,
                    tiles: [{ label: 'Walk Time', value: ended.duration_seconds ? clock(ended.duration_seconds) : since(ended.started_at) },
                        { label: 'Distance', value: miles(ended.distance_meters) }],
                    map: mapBox(ended.id, false),
                    meta: [{ text: 'Your walker is wrapping up the visit.', note: true }]
                });
            }
            lookForFinishedWalk(visit);
        }
        const title = kind === 'sit' ? 'Sit In Progress' : kind === 'meet' ? 'Meet & Greet In Progress' : 'Visit In Progress';
        const second = kind === 'sit' ? { label: 'Sit Ends', value: windowEnd(visit) || '—', word: true }
            : kind === 'walk' ? { label: 'Walk', value: 'Starting Soon', word: true }
            : { label: 'Checked In', value: timeOf(checkedInAt) || '—', word: true };
        return card({
            kind, attrs, title,
            tiles: [{ label: 'Visit Time', value: since(checkedInAt), since: checkedInAt }, second],
            meta: [kind === 'drop' || kind === 'visit' ? '' : `Checked in at ${timeOf(checkedInAt)}`]
        });
    }
    window.buildClientLiveHero = clientCard;

    // Checked in, walk service, no walk happening: was there a walk already?
    async function lookForFinishedWalk(visit) {
        const id = Number(visit.id);
        const last = seenLive.get(id);
        if (last && !finishedWalks.has(id)) {
            finishedWalks.set(id, { ...last, duration_seconds: (Date.now() - new Date(last.started_at).getTime()) / 1000 });
            queueMicrotask(() => redrawClientCards(visit));
        }
        if (Date.now() - (lookedUp.get(id) || 0) < 30000 || typeof supabaseClient === 'undefined') return;
        lookedUp.set(id, Date.now());
        try {
            const { data, error } = await supabaseClient.from('visit_walks')
                .select('id, status, started_at, ended_at, duration_seconds, distance_meters')
                .eq('visit_id', id).eq('status', 'completed').order('ended_at', { ascending: false }).limit(1);
            if (error) throw error;
            if (!data?.[0]) return;
            finishedWalks.set(id, data[0]);
            redrawClientCards(visit);
        } catch (error) { console.warn('Finished walk lookup:', error); }
    }
    function redrawClientCards(visit) {
        const progress = { state: 'checked_in', checkedInAt: visit.checked_in_at };
        document.querySelectorAll(`.pis-live[data-pis-visit="${Number(visit.id)}"]:not(.is-done)`).forEach(el => {
            if (String(visit.status || '').toLowerCase() === 'completed') return;
            const tpl = document.createElement('template');
            tpl.innerHTML = clientCard(visit, progress, null);
            const fresh = tpl.content.firstElementChild;
            if (fresh && fresh.outerHTML !== el.outerHTML) el.replaceWith(fresh);
        });
    }

    // Finished visit: green card, the visit report opens right under it.
    function clientDoneCard(visit, progress) {
        const id = Number(visit.id);
        const kind = kindOf(visit);
        const range_ = range(progress.checkedInAt || visit.checked_in_at, progress.completedAt || visit.completed_at, progress.minutes);
        let title; let tiles; let map = '';
        if (kind === 'walk') {
            const known = readWalks()[id];
            title = 'Walk Complete';
            tiles = known
                ? [{ label: 'Walk Time', value: clock(known.s) }, { label: 'Distance', value: miles(known.m) }]
                : [{ label: 'Walk Time', value: '—', pending: true }, { label: 'Distance', value: '—', pending: true }];
            if (known?.w) map = mapBox(known.w, false);
        } else if (kind === 'sit') {
            title = 'Sit Complete';
            tiles = [{ label: 'Sit Time', value: length(progress.minutes) }, { label: 'Updates Sent', value: '—', count: `sit:${id}`, pending: true }];
        } else {
            title = kind === 'meet' ? 'Meet & Greet Complete' : 'Visit Complete';
            tiles = [{ label: 'Visit Time', value: length(progress.minutes) }, { label: 'Finished', value: timeOf(progress.completedAt) || '—', word: true }];
        }
        return `${card({
            kind, title, tiles, map, done: true, meta: [range_],
            attrs: ` data-pis-done-visit="${id}" data-pis-visit="${id}"`,
            tail: `<button type="button" class="client-view-visit-report-button pis-done-report-button" data-client-visit-report-open="${id}">View Visit Report</button>`
        })}<div id="client-visit-report-${id}" class="client-visit-report-mount"></div>`;
    }

    // The report knows the walk: fill in the card, put the map in it, and
    // drop the report's own walk summary (it would say the same thing twice).
    function upgradeWalkCard(cardEl, visitId, walk) {
        const known = readWalks()[visitId];
        const tiles = cardEl.querySelector('.pis-live-tiles');
        if (tiles && known) tiles.innerHTML = [{ label: 'Walk Time', value: clock(known.s) }, { label: 'Distance', value: miles(known.m) }].map(tileHtml).join('');
        if (!cardEl.querySelector('[data-pis-map-walk]') && walk?.id && tiles) tiles.insertAdjacentHTML('afterend', mapBox(walk.id, false));
    }
    if (typeof window.renderClientVisitReport === 'function') {
        const original = window.renderClientVisitReport;
        window.renderClientVisitReport = function (mount, report, petCareRows, media, completedWalk, walkPoints) {
            const result = original.apply(this, arguments);
            try {
                const visitId = Number(report?.visit_id || String(mount?.id || '').replace(/\D+/g, '') || mount?.dataset?.visitId);
                const cardEl = visitId && document.querySelector(`.pis-live.is-done[data-pis-done-visit="${visitId}"]`);
                if (cardEl && completedWalk?.id) {
                    rememberWalk(visitId, completedWalk);
                    window.PisMap?.seed(completedWalk.id, walkPoints);
                    upgradeWalkCard(cardEl, visitId, completedWalk);
                    mount.querySelectorAll('.client-walk-summary-card').forEach(el => (el.closest('.client-visit-report-section') || el).remove());
                }
            } catch (error) { console.warn('Walk card:', error); }
            return result;
        };
    }

    if (typeof window.buildClientVisitProgressSection === 'function') {
        const original = window.buildClientVisitProgressSection;
        window.buildClientVisitProgressSection = function (visit, progress) {
            try {
                if (progress?.state === 'checked_in') {
                    const walk = typeof currentClientLiveWalks !== 'undefined' ? currentClientLiveWalks.get?.(Number(visit.id)) || null : null;
                    return clientCard(visit, progress, walk);
                }
                if (progress?.state === 'completed' && kindOf(visit) !== 'board') {
                    finishedWalks.delete(Number(visit.id));
                    return clientDoneCard(visit, progress);
                }
            } catch (error) { console.warn('Visit card (client):', error); }
            return original.apply(this, arguments);
        };
    }

    // Boarding stay over: green card on top of each night's screen.
    if (typeof window.buildClientBoardingDaySection === 'function') {
        const original = window.buildClientBoardingDaySection;
        window.buildClientBoardingDaySection = function (visit, stay) {
            const html = original.apply(this, arguments);
            try {
                const live = typeof currentClientLiveWalks !== 'undefined' && currentClientLiveWalks.get?.(Number(visit.id));
                if (stay?.status !== 'completed' || live) return html;
                const nights = nightsBetween(stay.dropoff_date, stay.pickup_date);
                const stamp = value => (typeof clientBoardingTimestamp === 'function' ? clientBoardingTimestamp(value) : timeOf(value));
                return card({
                    kind: 'board', title: 'Boarding Complete', done: true,
                    tiles: [{ label: 'Nights', value: nights ?? '—' }, { label: 'Walks', value: '—', count: `board:${stay.id}`, pending: true }],
                    meta: [stay.dropoff_date && stay.pickup_date ? `${shortDate(stay.dropoff_date)} – ${shortDate(stay.pickup_date)}` : '',
                        stay.ended_at ? `Picked up ${stamp(stay.ended_at)}` : '']
                }) + html;
            } catch (error) { console.warn('Boarding card (client):', error); return html; }
        };
    }

    // Open visit screens: show the report under a finished visit's card, with
    // the visit details after it.
    const opening = new Set();
    const shownReports = new Map();   // visit id -> the report box last shown (moved back in after a redraw)
    function openFinishedReports() {
        if (typeof toggleClientVisitReport !== 'function') return;
        document.querySelectorAll('.csd-overlay:not([hidden]) .pis-live.is-done[data-pis-done-visit]').forEach(cardEl => {
            const id = Number(cardEl.dataset.pisDoneVisit);
            let mount = document.getElementById(`client-visit-report-${id}`);
            const already = typeof activeClientVisitReportId !== 'undefined' && Number(activeClientVisitReportId) === id;
            const kept = shownReports.get(id);
            if (mount && !mount.innerHTML.trim() && already && kept && kept !== mount && !kept.isConnected && kept.innerHTML.trim()) {
                mount.replaceWith(kept);   // same report straight away; live updates keep it current
                mount = kept;
            }
            if (mount?.innerHTML.trim()) shownReports.set(id, mount);
            const host = cardEl.parentElement;
            const details = host?.querySelector(':scope > .csd-detail-card');
            if (details && mount?.parentElement === host && mount.nextElementSibling !== details) mount.after(details);
            if (!mount || mount.innerHTML.trim() || opening.has(id)) return;
            const button = cardEl.querySelector(`[data-client-visit-report-open="${id}"]`);
            if (!button) return;
            if (already && typeof closeOpenClientVisitReport === 'function') closeOpenClientVisitReport();
            opening.add(id);
            Promise.resolve(toggleClientVisitReport(id, button))
                .catch(error => console.warn('Visit report:', error))
                .finally(() => setTimeout(() => opening.delete(id), 300));
        });
    }

    let pending = false;
    new MutationObserver(() => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
            pending = false;
            if (document.querySelector('[data-pis-count]')) fillCounts();
            if (document.querySelector('.pis-live.is-done[data-pis-done-visit]')) openFinishedReports();
        });
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });

    window.PisLiveHero = { kindOf, tick, clientCard, clientDoneCard };
})();
