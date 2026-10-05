/* Paws in Stride — Lifetime Stats on the More page.
   Load AFTER admin.js. Adds a card right under "My Profile" with total miles walked,
   hours worked, visits completed, longest walk and busiest day.
   Uses the visits and GPS walks the portal already loads, plus saved driving
   estimates (one extra request, cached). */
(function () {
    'use strict';

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let driveRows = [];
    let driveState = 'idle'; // idle | loading | ready | error
    let driveLoadedAt = 0;

    const lower = v => String(v || '').toLowerCase();
    const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const miles = m => (Number(m) || 0) / 1609.344;
    const fmtMiles = m => {
        const n = miles(m);
        return n >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
    };

    function isBoarding(v) {
        return typeof isAdminBoardingService === 'function' ? isAdminBoardingService(v) :
            /board/i.test(`${v.service_type || ''} ${v.service_name || ''}`);
    }
    function isDone(v) {
        return lower(v.status) !== 'cancelled' && (Boolean(v.completed_at) || lower(v.status) === 'completed');
    }
    function minutesOf(v) {
        return typeof getAdminFinancialVisitMinutes === 'function' ? getAdminFinancialVisitMinutes(v) : 15;
    }
    function drives(v) {
        return typeof isAdminDrivingService === 'function' ? isAdminDrivingService(v) : !isBoarding(v);
    }
    function niceDate(dateLike, withDay) {
        const d = /^\d{4}-\d{2}-\d{2}$/.test(String(dateLike)) ? parseLocalDate(dateLike) : new Date(dateLike);
        if (Number.isNaN(d.getTime())) return '';
        return `${withDay ? DAYS[d.getDay()] + ', ' : ''}${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    function petNames(visit) {
        try {
            const pets = typeof getAdminPetsForVisit === 'function' ? getAdminPetsForVisit(visit) : [];
            return (pets || []).map(p => p?.name).filter(Boolean).join(' & ');
        } catch (e) { return ''; }
    }

    async function loadDrive(force) {
        if (typeof currentUser === 'undefined' || !currentUser?.id) return;
        if (driveState === 'loading') return;
        if (!force && driveState === 'ready' && Date.now() - driveLoadedAt < 5 * 60000) return;
        driveState = 'loading';
        try {
            const out = [];
            for (let from = 0; from < 50000; from += 1000) {
                const { data, error } = await supabaseClient
                    .from('admin_route_drive_estimates')
                    .select('visit_id, drive_seconds, locked_at')
                    .eq('admin_id', currentUser.id)
                    .order('visit_date', { ascending: true })
                    .range(from, from + 999);
                if (error) throw error;
                out.push(...(data || []));
                if (!data || data.length < 1000) break;
            }
            driveRows = out;
            driveState = 'ready';
            driveLoadedAt = Date.now();
        } catch (e) {
            console.error('Lifetime stats drive estimates:', e);
            driveState = 'error';
        }
        render();
    }

    function compute() {
        const me = typeof currentUser !== 'undefined' ? currentUser?.id : null;
        // Your own work only (visits assigned to an employee are theirs).
        const visits = ((typeof allVisits !== 'undefined' && Array.isArray(allVisits)) ? allVisits : [])
            .filter(v => !v.assigned_to || v.assigned_to === me);
        const walksAll = (typeof allVisitWalks !== 'undefined' && Array.isArray(allVisitWalks)) ? allVisitWalks : [];

        // Finished GPS walks, one per id (a walk can briefly exist locally and on the server).
        const seen = new Set();
        const walks = walksAll.filter(w => {
            if (lower(w.status) !== 'completed') return false;
            if (w.walker_id && me && w.walker_id !== me) return false;
            const k = String(w.id);
            if (seen.has(k)) return false;
            seen.add(k);
            return Number(w.distance_meters) > 0;
        });
        const meters = walks.reduce((t, w) => t + Number(w.distance_meters || 0), 0);
        const longest = walks.reduce((best, w) => (!best || Number(w.distance_meters) > Number(best.distance_meters)) ? w : best, null);

        const done = visits.filter(v => isDone(v) && !isBoarding(v));

        // Hours: visit time + saved driving time + boarding walks (those aren't visits).
        const rows = new Map(driveRows.map(r => [String(r.visit_id), r]));
        let visitMin = 0, driveMin = 0;
        for (const v of done) {
            visitMin += minutesOf(v);
            if (!drives(v)) continue;
            const r = rows.get(String(v.id));
            if (r?.locked_at && Number.isFinite(Number(r.drive_seconds))) driveMin += Number(r.drive_seconds) / 60;
        }
        const boardingWalkMin = walks.filter(w => !w.visit_id && w.boarding_stay_id)
            .reduce((t, w) => t + (Number(w.duration_seconds) || 0) / 60, 0);
        const totalMin = visitMin + driveMin + boardingWalkMin;

        // Busiest day: most finished visits on one date (latest date wins a tie).
        const perDay = new Map();
        for (const v of done) perDay.set(v.visit_date, (perDay.get(v.visit_date) || 0) + 1);
        let busiest = null;
        for (const [date, count] of perDay) {
            if (!busiest || count > busiest.count || (count === busiest.count && date > busiest.date)) busiest = { date, count };
        }

        let longestInfo = null;
        if (longest) {
            const visit = longest.visit_id ? visits.find(v => String(v.id) === String(longest.visit_id)) : null;
            const who = visit ? petNames(visit) : '';
            const mins = Math.round((Number(longest.duration_seconds) || 0) / 60);
            longestInfo = {
                miles: miles(longest.distance_meters).toFixed(2),
                date: niceDate(longest.started_at || visit?.visit_date),
                detail: [who || (longest.boarding_stay_id ? 'Boarding walk' : ''), mins ? `${mins} min` : ''].filter(Boolean).join(' · ')
            };
        }

        return { meters, walkCount: walks.length, totalMin, visitMin, driveMin, doneCount: done.length, busiest, longestInfo };
    }

    function render() {
        const box = document.getElementById('pis-lifetime-stats');
        if (!box) return;
        const s = compute();
        const h = Math.floor(s.totalMin / 60);
        const hoursText = h >= 1 ? h.toLocaleString('en-US') : Math.round(s.totalMin) + 'm';
        const hourNote = driveState === 'loading' || driveState === 'idle' ? 'Adding driving…'
            : driveState === 'error' ? 'Without driving' : 'Incl. driving';

        box.querySelector('.pls-body').innerHTML = `
            <div class="pls-tiles">
                <div class="pls-tile pls-blue">
                    <span class="pls-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 13.5c-2.6 0-4.8 2.4-4.8 4.4 0 1.3 1 1.9 2.2 1.9 1 0 1.6-.5 2.6-.5s1.6.5 2.6.5c1.2 0 2.2-.6 2.2-1.9 0-2-2.2-4.4-4.8-4.4z"/><ellipse cx="7" cy="10" rx="1.6" ry="2.1"/><ellipse cx="17" cy="10" rx="1.6" ry="2.1"/><ellipse cx="10" cy="6.3" rx="1.6" ry="2.1"/><ellipse cx="14" cy="6.3" rx="1.6" ry="2.1"/></svg></span>
                    <strong>${fmtMiles(s.meters)}</strong>
                    <span class="pls-name">Miles</span>
                    <span class="pls-note">${s.walkCount} ${s.walkCount === 1 ? 'walk' : 'walks'}</span>
                </div>
                <div class="pls-tile pls-orange">
                    <span class="pls-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg></span>
                    <strong>${hoursText}</strong>
                    <span class="pls-name">Hours</span>
                    <span class="pls-note">${esc(hourNote)}</span>
                </div>
                <div class="pls-tile pls-green">
                    <span class="pls-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
                    <strong>${s.doneCount.toLocaleString('en-US')}</strong>
                    <span class="pls-name">Visits</span>
                    <span class="pls-note">Completed</span>
                </div>
            </div>
            <div class="pls-records">
                <div class="pls-record">
                    <span class="pls-badge pls-gold"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6M10 17h4"/></svg></span>
                    <span class="pls-record-copy">
                        <span class="pls-name">Longest walk</span>
                        <strong>${s.longestInfo ? `${s.longestInfo.miles} mi` : '—'}</strong>
                        <em>${s.longestInfo ? esc([s.longestInfo.date, s.longestInfo.detail].filter(Boolean).join(' · ')) : 'Finish a GPS walk to set your record'}</em>
                    </span>
                </div>
                <div class="pls-record">
                    <span class="pls-badge pls-purple"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M16 3v4M8 3v4M3.5 10h17"/><path d="M9.5 15l2 2 3.5-3.5"/></svg></span>
                    <span class="pls-record-copy">
                        <span class="pls-name">Busiest day</span>
                        <strong>${s.busiest ? `${s.busiest.count} ${s.busiest.count === 1 ? 'visit' : 'visits'}` : '—'}</strong>
                        <em>${s.busiest ? esc(niceDate(s.busiest.date, true)) : 'Finish a visit to set your record'}</em>
                    </span>
                </div>
            </div>`;
    }

    function mount() {
        if (document.getElementById('pis-lifetime-stats')) return true;
        const profile = document.querySelector('#admin-screen-more .admin-profile-section');
        if (!profile) return false;
        const box = document.createElement('section');
        box.id = 'pis-lifetime-stats';
        box.className = 'pls';
        box.innerHTML = `
            <div class="pls-head">
                <span class="pls-eyebrow">MY STATS</span>
                <h3>Lifetime Stats</h3>
            </div>
            <div class="pls-body"></div>`;
        profile.insertAdjacentElement('afterend', box);
        return true;
    }

    function refresh() {
        if (!mount()) return;
        render();
        void loadDrive(false);
    }

    const css = `
    .pls{margin:18px 0 0 !important;padding:20px !important;background:#fff;border:1px solid #d6e4eb;border-radius:20px;box-shadow:0 7px 18px rgba(24,52,71,.07);color:#183447}
    .pls-head{margin-bottom:14px}
    .pls-eyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:.12em;color:#1f63b8}
    .pls-head h3{margin:3px 0 0 !important;font-size:20px;font-weight:800;color:#183447}
    .pls-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .pls-tile{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;padding:12px;border-radius:16px;border:1px solid #dbe7f3;background:#f7fbfe}
    .pls-icon{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;margin-bottom:8px}
    .pls-icon svg,.pls-badge svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
    .pls-blue .pls-icon{background:#e1edfc;color:#1f63b8}
    .pls-orange .pls-icon{background:#fdebd9;color:#c0610c}
    .pls-green .pls-icon{background:#e3f3e6;color:#2e8b4a}
    .pls-tile strong{font-size:24px;font-weight:800;line-height:1.05;color:#183447}
    .pls-name{font-size:13px;font-weight:800;color:#46617d}
    .pls-note{font-size:11px;font-weight:600;line-height:1.3;color:#8293a2}
    .pls-records{display:flex;flex-direction:column;gap:8px;margin-top:8px}
    .pls-record{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;border:1px solid #dbe7f3;background:#fff}
    .pls-badge{flex:none;display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:14px}
    .pls-badge svg{width:22px;height:22px}
    .pls-gold{background:#fdf1d6;color:#b07a00}
    .pls-purple{background:#ebe5fb;color:#6a45c2}
    .pls-record-copy{display:flex;flex-direction:column;min-width:0}
    .pls-record-copy strong{font-size:20px;font-weight:800;line-height:1.15;color:#183447}
    .pls-record-copy em{font-style:normal;font-size:12px;font-weight:600;color:#6b7785;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    @media (max-width:700px){.pls{padding:16px !important}.pls-tile{padding:11px 10px}.pls-tile strong{font-size:21px}}`;

    function init() {
        if (!document.getElementById('pls-style')) {
            const st = document.createElement('style');
            st.id = 'pls-style';
            st.textContent = css;
            document.head.appendChild(st);
        }
        refresh();
        // Re-render whenever the More screen is opened, so numbers stay current.
        const more = document.getElementById('admin-screen-more');
        if (more) {
            new MutationObserver(() => { if (!more.hidden) refresh(); })
                .observe(more, { attributes: true, attributeFilter: ['hidden', 'class'] });
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.refreshAdminLifetimeStats = refresh;
})();
