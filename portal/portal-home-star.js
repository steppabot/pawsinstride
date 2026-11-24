/* ========================================
   PAWS IN STRIDE: THE PET IS THE STAR OF HOME (client app, phone size)
   ========================================
   Load AFTER portal.js, portal-pet-sitting.js and photo-cover.js.

   A big photo card at the top of Home that follows the day:
     LIVE      a walk, drop-in or sit happening now (timer, miles, who's with them)
     BOARDING  a stay in progress (night x of y, the newest update and photos)
     DONE      a visit finished in the last day and a half (report checks, photos)
     NEXT      otherwise: the next visit, or a nudge to book

   Photo: that moment's first photo (framed the way the team set it with Adjust Cover),
   else the newest visit photo, else the pet's profile photo, else a branded card.
   Only on phone-size screens; the desktop layout is unchanged. If anything fails,
   Home falls back to the cards it had before.
   ======================================== */
(() => {
    'use strict';
    if (!document.getElementById('mobile-home-dashboard')) return;

    const DONE_HOURS = 36;
    const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(String(s ?? ''))
        : String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
    const lower = v => String(v || '').trim().toLowerCase();
        const urlCache = new Map();
    let renderVersion = 0;
    let liveTimer = null;
    let shownKey = '';
    let shownPhoto = '';          // which picture is on screen (path, or link without its token)
    let pendingClick = false;     // tapped the saved card's button before the fresh one was ready
    // The last card is kept on this phone so Home opens with it straight away (no blank, no pop-in).
    const SAVED_CARD = 'pis-star-card';
    const SAVED_PHOTO = 'pis-star-photo';
    const SAVED_URLS = 'pis-star-urls';
    const store = {
        get(name) { try { return JSON.parse(localStorage.getItem(name) || 'null'); } catch { return null; } },
        set(name, value) { try { localStorage.setItem(name, JSON.stringify(value)); return true; } catch { return false; } }
    };
        const me = () => (typeof currentUser !== 'undefined' && currentUser?.id) || '';
    // Buttons go straight into that visit's screen (portal.js), not the calendar or a popup.
    const openVisit = visit => {
        if (typeof window.openClientVisitScreen === 'function' && window.openClientVisitScreen(visit)) return true;
        openClientServiceDate(visit);
        return false;
    };
    // photo links stay valid for an hour: reuse them across app opens so the phone's copy is used
    (() => {
        const saved = store.get(SAVED_URLS);
        if (saved?.uid && Array.isArray(saved.list)) saved.list.forEach(([path, hit]) => urlCache.set(path, { ...hit, uid: saved.uid }));
    })();
    let people = new Map();
    let peopleMissing = false;

    const CSS = `
        .pis-star { display: none; }
        @media (max-width: 700px) {
            .pis-star { display: block; margin: 0 0 18px !important; padding: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important; }
            #mobile-home-dashboard.pis-star-on .mobile-home-greeting { background: none !important; border: 0 !important; box-shadow: none !important;
                padding: 0 !important; margin: 2px 2px 10px !important; overflow: visible !important; }
            #mobile-home-dashboard.pis-star-on .mobile-home-greeting::before, #mobile-home-dashboard.pis-star-on .mobile-home-greeting::after { display: none !important; }
            #mobile-home-dashboard.pis-star-on .mobile-home-greeting h2 { color: #4f6070 !important; font-size: 16px !important; font-weight: 700 !important;
                margin: 0 !important; letter-spacing: 0 !important; text-shadow: none !important; }
            #mobile-home-dashboard.pis-star-on .mobile-home-greeting p { display: none !important; }
            #mobile-home-dashboard.pis-star-on #mobile-home-next-visit-card { display: none !important; }
            #mobile-home-dashboard.pis-star-covers-update .pis-star-latest-section { display: none !important; }
        }
        .pis-star-card { position: relative; border-radius: 26px; overflow: hidden; aspect-ratio: 1 / 1.15; isolation: isolate;
            background: linear-gradient(150deg, #174b68 0%, #1d6f98 55%, #268db2 100%); box-shadow: 0 14px 34px rgba(16, 52, 86, .22); }
                .pis-star-photo { z-index: 0; transition: opacity .25s ease; }
        .pis-star-photo.is-loading { opacity: 0; }
        .pis-star-card::after { content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
            background: linear-gradient(180deg, rgba(8,24,40,.28) 0%, rgba(8,24,40,0) 24%, rgba(8,24,40,.05) 40%, rgba(8,24,40,.88) 100%); }
        .pis-star-card.no-photo::after { background: linear-gradient(180deg, rgba(8,24,40,0) 40%, rgba(8,24,40,.35) 100%); }
        .pis-star-paws { position: absolute; z-index: 0; inset: 0; color: rgba(255,255,255,.12); display: grid; place-items: center; }
        .pis-star-paws svg { width: 62%; height: auto; transform: translateY(-18%) rotate(-14deg); }
        .pis-star-top { position: absolute; z-index: 2; top: 14px; left: 14px; right: 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .pis-star-chip { display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; border-radius: 999px; background: rgba(255,255,255,.94);
            color: #14324d; font: 800 12px/1 Roboto, Arial, sans-serif; letter-spacing: .03em; text-transform: uppercase; white-space: nowrap; }
        .pis-star-dot { width: 8px; height: 8px; border-radius: 50%; background: #1f7bc2; box-shadow: 0 0 0 4px rgba(31,123,194,.2); flex: none; }
        .pis-star-chip.live { color: #c7322b; }
        .pis-star-chip.live .pis-star-dot { background: #e5483f; box-shadow: 0 0 0 4px rgba(229,72,63,.22); animation: pis-star-pulse 1.6s ease-in-out infinite; }
        .pis-star-chip.done .pis-star-dot { background: #2f9e5b; box-shadow: 0 0 0 4px rgba(47,158,91,.2); }
        .pis-star-chip.stay .pis-star-dot { background: #f08a24; box-shadow: 0 0 0 4px rgba(240,138,36,.22); }
        @keyframes pis-star-pulse { 50% { box-shadow: 0 0 0 7px rgba(229,72,63,.08); } }
        @media (prefers-reduced-motion: reduce) { .pis-star-chip.live .pis-star-dot { animation: none; } }
        .pis-star-person { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 4px; border-radius: 999px; background: rgba(12,30,48,.55);
            color: #fff; font: 700 12px Roboto, Arial, sans-serif; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); white-space: nowrap; min-width: 0; }
        .pis-star-person b { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; flex: none;
            background: linear-gradient(135deg, #2b8bd6, #1f6fb2); font-size: 11px; font-weight: 800; }
        .pis-star-bottom { position: absolute; z-index: 2; left: 18px; right: 18px; bottom: 18px; color: #fff; display: grid; gap: 10px; }
        .pis-star-bottom h2 { margin: 0; color: #fff; font: 800 25px/1.18 Roboto, Arial, sans-serif; letter-spacing: -.01em;
            text-shadow: 0 1px 12px rgba(0,0,0,.25); overflow-wrap: anywhere; }
        .pis-star-sub { margin: -4px 0 0; font: 600 14px/1.35 Roboto, Arial, sans-serif; color: rgba(255,255,255,.92); }
        .pis-star-stats { display: flex; gap: 8px; flex-wrap: wrap; }
                .pis-star-stat[hidden] { display: none !important; }
        .pis-star-stat { padding: 7px 11px; border-radius: 12px; background: rgba(255,255,255,.16); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            font: 700 13px Roboto, Arial, sans-serif; color: #fff; display: inline-flex; gap: 6px; align-items: center; font-variant-numeric: tabular-nums; }
        .pis-star-note { margin: 0; padding: 10px 12px; border-radius: 14px; background: rgba(255,255,255,.14); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            font: 500 14px/1.4 Roboto, Arial, sans-serif; color: #fff; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .pis-star-note b { font-weight: 800; }
        .pis-star-thumbs { display: flex; gap: 6px; }
        .pis-star-thumbs span { position: relative; width: 46px; height: 46px; border-radius: 10px; overflow: hidden; border: 2px solid rgba(255,255,255,.85);
            background: rgba(255,255,255,.2); flex: none; }
        .pis-star-thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pis-star-thumbs span.more { display: grid; place-items: center; border-color: rgba(255,255,255,.5); font: 800 13px Roboto, Arial, sans-serif; }
        .pis-star-btn { display: flex; justify-content: center; align-items: center; gap: 8px; width: 100%; min-height: 48px; border-radius: 14px; border: 0;
            background: #fff; color: #14324d; font: 800 15px Roboto, Arial, sans-serif; box-shadow: 0 6px 16px rgba(0,0,0,.18); cursor: pointer; }
        .pis-star-btn.orange { background: linear-gradient(135deg, #f7a531, #f07c1e); color: #fff; }
        .pis-star-btn:focus-visible { outline: 3px solid #8fd0ff; outline-offset: 2px; }
    `;
    const PAW = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="10" r="2.2"/><circle cx="9.5" cy="5.5" r="2.2"/><circle cx="14.5" cy="5.5" r="2.2"/><circle cx="19" cy="10" r="2.2"/><path d="M12 11c-3.2 0-6 3.4-6 6 0 1.8 1.4 2.6 3 2.6 1.3 0 2-.6 3-.6s1.7.6 3 .6c1.6 0 3-.8 3-2.6 0-2.6-2.8-6-6-6z"/></svg>';

    // ---------- small helpers ----------
    function listNames(names) {
        const list = names.filter(Boolean);
        if (list.length < 2) return list[0] || 'Your pet';
        return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
    }
    const verb = (names, one, many) => (names.length > 1 ? many : one);
    const petsOf = visit => (typeof getPetsForVisit === 'function' ? getPetsForVisit(visit) : []);
    const kindOf = visit => (typeof window.pisKind === 'function' ? window.pisKind(visit) : '');
    const today = () => (typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().slice(0, 10));
    const isCancelled = v => lower(v.status) === 'cancelled';
    const isDone = v => lower(v.status) === 'completed' || Boolean(v.completed_at);
    const isBoarding = v => (typeof isClientBoardingService === 'function' ? isClientBoardingService(v) : /board/i.test(v.service_name || ''));
    const clock = value => new Date(value).toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' });
    function dayWord(dateText) {
        const d = parseLocalDate(dateText);
        const t = parseLocalDate(today());
        const diff = Math.round((d - t) / 86400000);
        if (diff === 0) return 'today';
        if (diff === 1) return 'tomorrow';
        if (diff > 1 && diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    function dayLabel(value) {
        const d = new Date(value);
        const key = d.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
        const t = today();
        const y = parseLocalDate(t); y.setDate(y.getDate() - 1);
        const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
        if (key === t) return 'Today';
        if (key === yKey) return 'Yesterday';
        return d.toLocaleDateString('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric' });
    }
    function minutesText(since) {
        const mins = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 60000));
        if (mins < 60) return `${mins} min`;
        return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
    }
        const miles = meters => { const m = Number(meters) / 1609.344; return Number.isFinite(m) ? m : 0; };

        async function signed(path) {
        if (!path) return null;
        const hit = urlCache.get(path);
        if (hit && hit.uid === me() && hit.at > Date.now() - 45 * 60000) return hit.url;
        const url = typeof signedClientBoardingPhoto === 'function' ? await signedClientBoardingPhoto(path) : null;
        if (url) {
            urlCache.set(path, { url, at: Date.now(), uid: me() });
            const fresh = [...urlCache].filter(([, h]) => h.uid === me() && h.at > Date.now() - 45 * 60000).slice(-40)
                .map(([k, h]) => [k, { url: h.url, at: h.at }]);
            store.set(SAVED_URLS, { uid: me(), list: fresh });
        }
        return url;
    }

    async function loadPeople(visitIds) {
        const ids = visitIds.map(Number).filter(id => Number.isFinite(id) && !people.has(id));
        if (!ids.length || peopleMissing) return;
        try {
            const { data, error } = await supabaseClient.rpc('my_visit_people', { p_visit_ids: ids });
            if (error) throw error;
            for (const row of Array.isArray(data) ? data : []) people.set(Number(row.visit_id), row.first_name || '');
        } catch (error) {
            if (/my_visit_people|does not exist|schema cache|not find/i.test(error?.message || '')) peopleMissing = true;
            console.warn('Home card names:', error?.message || error);
        }
    }

    // newest visit photo for this client (any visit), as the fallback background
    async function newestVisitPhoto() {
        const ids = currentVisits.filter(v => isDone(v) && !isBoarding(v))
            .sort((a, b) => String(b.visit_date).localeCompare(String(a.visit_date))).slice(0, 25).map(v => v.id);
        if (!ids.length) return null;
        const { data, error } = await supabaseClient.from('visit_photos').select('storage_path, created_at')
            .in('visit_id', ids).eq('photo_type', 'visit').order('created_at', { ascending: false }).limit(1);
        if (error) throw error;
        return data?.[0]?.storage_path || null;
    }

    async function petPhoto(pets) {
        const pet = pets.find(p => p.photo_path);
        if (!pet || typeof getPetDisplayUrl !== 'function') return null;
        const url = await getPetDisplayUrl(pet);
        return url && url !== (typeof DEFAULT_PET_AVATAR !== 'undefined' ? DEFAULT_PET_AVATAR : '') ? url : null;
    }

    // ---------- pick what the card shows ----------
    async function pickState() {
        const t = today();
        const visits = currentVisits.filter(v => !isCancelled(v));

        // LIVE
        const live = visits.filter(v => !isBoarding(v) && !isDone(v) && v.checked_in_at && ['walk', 'drop', 'sit'].includes(kindOf(v)) &&
            String(v.visit_date || '') >= (() => { const y = parseLocalDate(t); y.setDate(y.getDate() - 1); return `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`; })())
            .sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at))[0];
        if (live) return { kind: 'live', visit: live };

        // BOARDING
        const stay = clientBoardingData?.loaded ? clientBoardingData.stays.find(s => s.status === 'active') : null;
        if (stay) {
            const update = clientBoardingData.latest && clientBoardingData.latest.stay_id === stay.id ? clientBoardingData.latest : null;
            return { kind: 'stay', stay, update };
        }

        // DONE (with a report, finished in the last day and a half)
        const recent = visits.filter(v => !isBoarding(v) && isDone(v) && kindOf(v) !== 'meet' &&
            Date.now() - new Date(v.completed_at || `${v.visit_date}T23:00:00`).getTime() < DONE_HOURS * 3600000)
            .sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0)).slice(0, 4);
        if (recent.length) {
            const { data, error } = await supabaseClient.from('visit_reports')
                .select('id, visit_id, notes, fed, fresh_water, pee, poop, created_at, published_at')
                .in('visit_id', recent.map(v => v.id));
            if (error) throw error;
            const visit = recent.find(v => (data || []).some(r => Number(r.visit_id) === Number(v.id)));
            if (visit) return { kind: 'done', visit, report: data.find(r => Number(r.visit_id) === Number(visit.id)) };
        }

        // NEXT
        const next = visits.filter(v => v.visit_date >= t && !isDone(v) && !(isBoarding(v) && typeof getClientBoardingStay === 'function' && getClientBoardingStay(v)?.started_at))
            .sort((a, b) => String(a.visit_date).localeCompare(String(b.visit_date)) || (typeof compareClientVisits === 'function' ? compareClientVisits(a, b) : 0))[0];
        return { kind: 'next', visit: next || null };
    }

    // ---------- build the card ----------
    async function build(state) {
        let photoPath = null;   // a stored photo (can have a framing)
        let photoUrl = null;    // a ready URL (pet profile photo; default framing)
        let thumbPaths = [];
        let chip = '', chipClass = '', title = '', sub = '', stats = [], note = '', button = null, person = '';
        let key = state.kind;

        if (state.kind === 'live') {
            const v = state.visit;
            const pets = petsOf(v);
            const names = pets.map(p => p.name || 'Your pet');
            await loadPeople([v.id]);
            person = people.get(Number(v.id)) || '';
            const kind = kindOf(v);
            const walk = typeof currentClientLiveWalks !== 'undefined' ? currentClientLiveWalks.get?.(Number(v.id)) : null;
            key += `:${v.id}`;
                        if (kind === 'walk' && walk) {
                chip = 'Live · Walking Now';
                title = `${listNames(names)} ${verb(names, 'is', 'are')} out on a walk`;
                button = { text: 'Follow the Walk', run: () => openVisit(v) };
            } else if (kind === 'walk') {
                // checked in, walk not started yet
                chip = 'Live · Checked In';
                title = person ? `${person} is with ${listNames(names)}` : `${listNames(names)} ${verb(names, 'has', 'have')} company right now`;
                sub = 'The walk starts soon.';
                button = { text: 'View Visit', run: () => openVisit(v) };
            } else if (kind === 'sit') {
                chip = 'Live · Sit in Progress';
                title = person ? `${person} is with ${listNames(names)}` : `${listNames(names)} ${verb(names, 'has', 'have')} company right now`;
                button = { text: 'See Sit Updates', run: () => openVisit(v) };
                const { data } = await supabaseClient.from('visit_updates').select('published_at, visit_update_photos(storage_path, sort_order)')
                    .eq('visit_id', v.id).not('published_at', 'is', null).order('published_at', { ascending: false }).limit(1);
                const photos = [...(data?.[0]?.visit_update_photos || [])].sort((a, b) => a.sort_order - b.sort_order);
                photoPath = photos[0]?.storage_path || null;
            } else {
                chip = 'Live · Visit in Progress';
                title = person ? `${person} is visiting ${listNames(names)}` : `${listNames(names)} ${verb(names, 'has', 'have')} company right now`;
                button = { text: 'View Visit', run: () => openVisit(v) };
            }
            chipClass = 'live';
            const since = walk?.started_at || v.checked_in_at;
            stats.push(`<span class="pis-star-stat" data-star-since="${esc(since)}">⏱ <b>${esc(minutesText(since))}</b></span>`);
                        if (kind === 'walk' && walk) {
                stats.push(`<span class="pis-star-stat" data-star-miles="${esc(v.id)}" ${miles(walk?.distance_meters) >= 0.01 ? '' : 'hidden'}>${PAW.replace('<svg', '<svg width="14" height="14"')} <b>${miles(walk?.distance_meters).toFixed(1)} mi</b></span>`);
            }
            if (!photoPath) photoPath = await newestVisitPhoto();
            if (!photoPath) photoUrl = await petPhoto(pets);
        }

        if (state.kind === 'stay') {
            const { stay, update } = state;
            const names = (typeof getClientBoardingPetNames === 'function' ? getClientBoardingPetNames(stay) : 'Your pet').split(/,\s*|\s+and\s+/);
            const start = parseLocalDate(stay.dropoff_date);
            const total = Math.max(1, Math.round((parseLocalDate(stay.pickup_date) - start) / 86400000));
            const night = Math.min(total, Math.max(1, Math.round((parseLocalDate(today()) - start) / 86400000) + 1));
            chip = total > 1 ? `Boarding · Night ${night} of ${total}` : 'Boarding · 1 Night';
            chipClass = 'stay';
            title = update ? `${listNames(names)} ${verb(names, 'is', 'are')} settled in` : `${listNames(names)} ${verb(names, 'is', 'are')} staying with us`;
            const photos = [...(update?.boarding_update_photos || [])].sort((a, b) => a.sort_order - b.sort_order);
            photoPath = photos[0]?.storage_path || null;
            thumbPaths = photos.slice(1).map(p => p.storage_path);
            note = update
                ? `<b>${esc(clock(update.published_at))}</b> · ${esc((update.notes || '').trim() || 'New photos from the stay.')}`
                : 'We’ll share photos and care updates here during the stay.';
                        button = { text: 'See Boarding Updates', orange: true, run: () => {
                const night = window.findClientBoardingNightVisit?.(stay.id);
                if (!(night && openVisit(night))) openClientBoardingUpdates(stay.id);
            } };
            key += `:${stay.id}:${update?.id || ''}`;
            if (!photoPath) photoPath = await newestVisitPhoto();
            if (!photoPath) photoUrl = await petPhoto(currentPets || []);
        }

        if (state.kind === 'done') {
            const { visit: v, report } = state;
            const pets = petsOf(v);
            const names = pets.map(p => p.name || 'Your pet');
            const kind = kindOf(v);
            await loadPeople([v.id]);
            person = people.get(Number(v.id)) || '';
            chip = 'Visit Complete';
            chipClass = 'done';
            title = `${listNames(names)} had a great ${kind === 'walk' ? 'walk' : 'visit'}`;
            const [walkResult, photoResult] = await Promise.all([
                kind === 'walk' ? supabaseClient.from('visit_walks').select('distance_meters').eq('visit_id', v.id).eq('status', 'completed').maybeSingle() : Promise.resolve({ data: null }),
                supabaseClient.from('visit_photos').select('storage_path').eq('visit_id', v.id).eq('photo_type', 'visit')
                    .order('sort_order', { ascending: true }).order('created_at', { ascending: true }).limit(12)
            ]);
            const times = v.checked_in_at && v.completed_at ? `${clock(v.checked_in_at).replace(/ [AP]M$/, m => (clock(v.completed_at).endsWith(m.trim()) ? '' : m))} – ${clock(v.completed_at)}` : '';
            const dist = miles(walkResult?.data?.distance_meters);
            sub = [dayLabel(v.completed_at || `${v.visit_date}T12:00:00`) + (times ? `, ${times}` : ''), dist >= 0.01 ? `${dist.toFixed(1)} mi` : ''].filter(Boolean).join(' · ');
            const checks = [['fed', 'Fed'], ['fresh_water', 'Fresh Water'], ['pee', 'Pee'], ['poop', 'Poop']].filter(([f]) => report?.[f]).map(([, label]) => label);
            stats = checks.map(label => `<span class="pis-star-stat">✓ ${esc(label)}</span>`);
            if (!checks.length && report?.notes) note = esc(report.notes.trim());
            const photos = (photoResult?.data || []).map(p => p.storage_path);
            photoPath = photos[0] || null;
            thumbPaths = photos.slice(1);
            button = { text: 'See Visit Report', run: () => openClientHomeVisitReport(v) };
            key += `:${v.id}:${report?.id}`;
            if (!photoPath) photoUrl = await petPhoto(pets);
        }

        if (state.kind === 'next') {
            const v = state.visit;
            if (v) {
                const pets = petsOf(v);
                const names = pets.map(p => p.name || 'Your pet');
                chip = 'Next Visit';
                title = `See you ${dayWord(v.visit_date)}, ${listNames(names)}!`;
                const service = typeof window.pisShortServiceName === 'function' ? window.pisShortServiceName(v) : (v.service_name || 'Visit');
                sub = [String(service).replace(/\s+-\s+/, ' · '), v.time_window].filter(Boolean).join(' · ');
                button = { text: 'View Visit', run: () => openVisit(v) };
                key += `:${v.id}`;
                photoPath = await newestVisitPhoto();
                if (!photoPath) photoUrl = await petPhoto(pets);
            } else {
                const names = (currentPets || []).map(p => p.name).filter(Boolean);
                title = names.length ? `${listNames(names)} ${verb(names, 'is', 'are')} ready for the next adventure` : 'Ready for your first visit?';
                button = { text: 'Book Service', run: () => document.getElementById('mobile-home-book-service-button')?.click(), orange: true };
                photoPath = await newestVisitPhoto();
                if (!photoPath) photoUrl = await petPhoto(currentPets || []);
            }
        }

        // photo, its framing, and the small previews
        const [mainUrl, covers, thumbUrls] = await Promise.all([
            photoPath ? signed(photoPath) : Promise.resolve(photoUrl),
            photoPath && window.PisCover ? window.PisCover.load([photoPath]) : Promise.resolve(new Map()),
            Promise.all(thumbPaths.slice(0, 3).map(signed))
        ]);
        const extra = thumbPaths.length - 3;
        const thumbs = thumbUrls.map((url, i) => (i === 2 && extra > 0
            ? `<span class="more">+${extra + 1}</span>`
            : url ? `<span><img src="${esc(url)}" alt="" loading="lazy"></span>` : '')).join('');
                const box = photoPath ? covers.get(photoPath) : null;
        // the same picture keeps the same id even when its link is renewed
        const photoId = photoPath ? `p:${photoPath}` : (mainUrl ? `u:${String(mainUrl).split('?')[0]}` : 'none');
        key += `|${photoId}|${box ? Object.values(box).join(',') : ''}|${title}|${sub}|${note}|${stats.length}|${thumbPaths.length}`;

        const html = `
            <div class="pis-star-card${mainUrl ? '' : ' no-photo'}">
                                ${mainUrl ? `<img class="pis-star-photo" data-full="1" src="${esc(mainUrl)}" alt="" decoding="async" style="${window.PisCover ? window.PisCover.imgStyle(box) : 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'}">`
                    : `<div class="pis-star-paws">${PAW}</div>`}
                <div class="pis-star-top">
                    ${chip ? `<span class="pis-star-chip ${chipClass}"><span class="pis-star-dot"></span>${esc(chip)}</span>` : '<span></span>'}
                    ${person ? `<span class="pis-star-person"><b>${esc(person.charAt(0).toUpperCase())}</b>with ${esc(person)}</span>` : ''}
                </div>
                <div class="pis-star-bottom">
                    <h2>${esc(title)}</h2>
                    ${sub ? `<p class="pis-star-sub">${esc(sub)}</p>` : ''}
                    ${stats.length ? `<div class="pis-star-stats">${stats.join('')}</div>` : ''}
                    ${note ? `<p class="pis-star-note">${note}</p>` : ''}
                    ${thumbs ? `<div class="pis-star-thumbs" aria-hidden="true">${thumbs}</div>` : ''}
                    ${button ? `<button type="button" class="pis-star-btn${button.orange ? ' orange' : ''}" data-star-button>${esc(button.text)} <span aria-hidden="true">→</span></button>` : ''}
                </div>
            </div>`;
                return { html, key, button, photoId, mainUrl, coversUpdate: state.kind === 'done' || state.kind === 'stay', live: state.kind === 'live' ? state.visit : null };
    }

    // ---------- keep the live numbers moving ----------
    function tickLive() {
        const host = document.getElementById('pis-star');
        if (!host) return;
        host.querySelectorAll('[data-star-since]').forEach(el => {
            const b = el.querySelector('b');
            if (b) b.textContent = minutesText(el.dataset.starSince);
        });
        host.querySelectorAll('[data-star-miles]').forEach(el => {
            const walk = typeof currentClientLiveWalks !== 'undefined' ? currentClientLiveWalks.get?.(Number(el.dataset.starMiles)) : null;
            const mi = miles(walk?.distance_meters);
            el.hidden = !(mi >= 0.01);
            const b = el.querySelector('b');
            if (b) b.textContent = `${mi.toFixed(1)} mi`;
        });
    }

    function ensureCss() {
        if (document.getElementById('pis-star-css')) return;
        const style = document.createElement('style');
        style.id = 'pis-star-css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function turnOff() {
        const dash = document.getElementById('mobile-home-dashboard');
        dash?.classList.remove('pis-star-on', 'pis-star-covers-update');
                document.getElementById('pis-star')?.remove();
        shownKey = '';
        shownPhoto = '';
        clearInterval(liveTimer);
        liveTimer = null;
    }

    function hostFor(dash) {
        let host = document.getElementById('pis-star');
        if (!host) {
            host = document.createElement('div');
            host.id = 'pis-star';
            host.className = 'pis-star';
            host.setAttribute('role', 'region');
            host.setAttribute('aria-label', 'Your pet today');
            const anchor = document.getElementById('mobile-home-next-visit-card');
            if (anchor) anchor.before(host); else dash.prepend(host);
        }
        return host;
    }

    // fade a photo in once it has loaded (a photo that can't load leaves the blue card, not a broken image)
    function watchLoading(img) {
        if (!img || (img.complete && img.naturalWidth)) return;
        img.classList.add('is-loading');
        img.addEventListener('load', () => img.classList.remove('is-loading'), { once: true });
    }

    // load and decode a photo off screen; it goes on screen only when it's ready to show
    function preload(url, ms = 4000) {
        return new Promise(resolve => {
            if (!url) return resolve(null);
            const img = new Image();
            img.decoding = 'async';
            let done = false;
            const finish = ok => { if (!done) { done = true; resolve(ok ? img : null); } };
            img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => finish(true));
            img.onerror = () => finish(false);
            setTimeout(() => finish(false), ms);
            img.src = url;
        });
    }

    // Home opens with the last card this phone showed
    function paintSaved(dash) {
        const saved = store.get(SAVED_CARD);
        if (!saved?.html || saved.uid !== me() || Date.now() - (saved.at || 0) > 7 * 86400000) return;
        const host = hostFor(dash);
        host.innerHTML = saved.html;
        const img = host.querySelector('.pis-star-photo');
        if (img) {
            const pic = store.get(SAVED_PHOTO);
            if (pic?.uid === me() && pic.photoId === saved.photoId && pic.data) img.src = pic.data;
            else if (Date.now() - (saved.at || 0) > 50 * 60000) img.removeAttribute('src');  // its link has run out
            img.dataset.full = '0';
            watchLoading(img);
            img.addEventListener('error', () => img.classList.add('is-loading'), { once: true });
        }
        const btn = host.querySelector('[data-star-button]');
        if (btn) btn.onclick = () => { pendingClick = true; };
        shownKey = saved.key || '';
        shownPhoto = saved.photoId || '';
        dash.classList.add('pis-star-on');
        dash.classList.toggle('pis-star-covers-update', Boolean(saved.coversUpdate));
        document.getElementById('mobile-home-latest-update')?.closest('.mobile-home-section')?.classList.add('pis-star-latest-section');
    }

    // remember this card (and a small copy of its photo) for next time
    let savingPhotoFor = '';
    function saveCard(card) {
        if (!me()) return;
        store.set(SAVED_CARD, { uid: me(), key: card.key, html: card.html, photoId: card.photoId, coversUpdate: card.coversUpdate, at: Date.now() });
        const pic = store.get(SAVED_PHOTO);
        if (!card.mainUrl || (pic?.uid === me() && pic.photoId === card.photoId) || savingPhotoFor === card.photoId) return;
        savingPhotoFor = card.photoId;
        (async () => {
            try {
                const response = await fetch(card.mainUrl, { mode: 'cors', credentials: 'omit' });
                if (!response.ok) return;
                const bitmap = await createImageBitmap(await response.blob());
                const scale = Math.min(1, 900 / bitmap.width);
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(bitmap.width * scale);
                canvas.height = Math.round(bitmap.height * scale);
                canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                bitmap.close?.();
                const data = canvas.toDataURL('image/jpeg', 0.75);
                if (data.length < 1200000) store.set(SAVED_PHOTO, { uid: me(), photoId: card.photoId, data });
            } catch { /* the saved copy is a nice-to-have */ }
            finally { savingPhotoFor = ''; }
        })();
    }

    // put a new card on screen without blinking
    async function showCard(host, card, version) {
        const box = document.createElement('div');
        box.innerHTML = card.html;
        const next = box.querySelector('.pis-star-photo');
        const current = host.querySelector('.pis-star-photo');
        if (next && current && card.photoId === shownPhoto) {
            // same picture: keep the one already on screen (only its framing can change)
            current.setAttribute('style', next.getAttribute('style') || '');
            next.replaceWith(current);
        } else if (next) {
            // a different picture: get it ready first, then swap (the old card stays until then)
            const ready = await preload(card.mainUrl);
            if (version !== renderVersion) return false;
            if (ready) {
                ready.className = next.className;
                ready.alt = '';
                ready.dataset.full = '1';
                ready.setAttribute('style', next.getAttribute('style') || '');
                next.replaceWith(ready);
            } else {
                watchLoading(next);
            }
        }
        host.replaceChildren(...box.childNodes);
        shownKey = card.key;
        shownPhoto = card.photoId;
        return true;
    }

    // the saved card's small photo -> the full photo, once it has loaded
    async function sharpen(host, card, version) {
        const img = host.querySelector('.pis-star-photo');
        if (!img || !card.mainUrl || img.dataset.full === '1') return;
        const ready = await preload(card.mainUrl, 15000);
        if (!ready || version !== renderVersion || !img.isConnected) return;
        img.src = card.mainUrl;
        img.dataset.full = '1';
        img.classList.remove('is-loading');
    }

    async function render() {
        const version = ++renderVersion;
        const dash = document.getElementById('mobile-home-dashboard');
        if (!dash || !me() || typeof supabaseClient === 'undefined') return;
        ensureCss();
        if (!document.querySelector('#pis-star .pis-star-card')) paintSaved(dash);
        try {
            const state = await pickState();
            const card = await build(state);
            if (version !== renderVersion) return;

            const host = hostFor(dash);
            if (card.key !== shownKey || !host.querySelector('.pis-star-card')) {
                if (!(await showCard(host, card, version))) return;
            }
            const btn = host.querySelector('[data-star-button]');
            if (btn) btn.onclick = () => card.button?.run();
            if (pendingClick) { pendingClick = false; card.button?.run(); }
            const latest = document.getElementById('mobile-home-latest-update')?.closest('.mobile-home-section');
            latest?.classList.add('pis-star-latest-section');
            dash.classList.add('pis-star-on');
            dash.classList.toggle('pis-star-covers-update', card.coversUpdate);
            clearInterval(liveTimer);
            liveTimer = card.live ? setInterval(tickLive, 20000) : null;
            if (card.live) tickLive();
            saveCard(card);
            void sharpen(host, card, version);
        } catch (error) {
            console.error('Home card:', error);
            // a hiccup (weak signal on resume) keeps the card that's showing; only an empty Home falls back
            if (version === renderVersion && !document.querySelector('#pis-star .pis-star-card')) turnOff();
        }
    }

    // ---------- hook into Home ----------
    const originalRender = window.renderMobileHomeDashboard;
    if (typeof originalRender === 'function') {
                window.renderMobileHomeDashboard = async function (...args) {
            const pending = originalRender.apply(this, args);
            // Home has just been drawn: put the saved card up now, not after the refresh finishes
            try {
                const dash = document.getElementById('mobile-home-dashboard');
                if (dash && me() && !document.querySelector('#pis-star .pis-star-card')) { ensureCss(); paintSaved(dash); }
            } catch (error) { console.warn('Home card (saved copy):', error); }
            const result = await pending;
            void render();
            return result;
        };
    }
    const originalLive = window.refreshClientLiveWalks;
    if (typeof originalLive === 'function') {
        window.refreshClientLiveWalks = async function (...args) {
            const result = await originalLive.apply(this, args);
            tickLive();
            return result;
        };
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tickLive(); });
        window.PisHomeStar = { render, turnOff, forget() { [SAVED_CARD, SAVED_PHOTO, SAVED_URLS].forEach(k => { try { localStorage.removeItem(k); } catch { /* ignore */ } }); } };
    if (typeof currentUser !== 'undefined' && currentUser?.id) void render();
})();
