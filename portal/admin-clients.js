// ========================================
// CLIENTS (owner app): compact list, rebuilt household page, Call / Text picker
// ========================================
// Load after admin.js and admin-client-delete.js.
//
// 1. CLIENTS LIST. One compact row per client (photo or initials, name, pets and
//    what's next), a slim search bar that stays at the top, and three filters:
//    All (A to Z), Upcoming (soonest first) and Not Booked (most recent visit
//    first). Each row has Call and Text buttons; tapping the row opens the
//    household.
// 2. HOUSEHOLD PAGE. The same information in tidy sections: Call / Text / Email /
//    Navigate in the header, the next visit, pets, home & access (only what's
//    filled in), contact, visits, pricing & billing, and Delete Client last.
//    The working controls (pricing tier, discount, booking minimum, credit,
//    delete) are the app's own elements, moved into the new layout, so admin.js
//    keeps running them.
// 3. CALL / TEXT PICKER (owner only). For the owner, Call and Text open a small
//    picker: the phone itself ("iPhone" / "Phone") or Google Voice, the business
//    line. It is used on the list, the household page and the visit screen.
//    Google Voice opens through its web address (Google documents the one for
//    calls); the number is copied first so it can be pasted if Google Voice
//    opens somewhere else. Team members don't have the business Google Voice
//    number, so for them Call and Text go straight to their phone.
//
// If anything here fails, the app's original list and household still work.
// ========================================

(() => {
    'use strict';
    if (window.PisClients || !document.getElementById('admin-client-directory-list')) return;

    // ---------- small helpers ----------
    const esc = value => (typeof escapeHtml === 'function' ? escapeHtml(String(value ?? ''))
        : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
    const digits = value => String(value || '').replace(/\D+/g, '');
    const lower = value => String(value || '').trim().toLowerCase();
    const today = () => (typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().slice(0, 10));
    const dateOf = text => (typeof parseLocalDate === 'function' ? parseLocalDate(text) : new Date(`${text}T12:00:00`));
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const tomorrow = () => { const d = dateOf(today()); d.setDate(d.getDate() + 1); return iso(d); };
    const shortDate = text => {
        const d = dateOf(text);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== dateOf(today()).getFullYear() ? 'numeric' : undefined });
    };
    const weekdayDate = text => dateOf(text).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const startTime = visit => { const t = String(visit?.time_window || '').split(/\s*[-–]\s*/)[0].trim(); return /^\d/.test(t) ? t : ''; };
    const timeValue = visit => {
        const m = startTime(visit).match(/^(\d{1,2})(?::(\d{2}))?\s*([AP]M)?/i);
        if (!m) return 24 * 60;
        let h = Number(m[1]) % 12; if (/pm/i.test(m[3] || '')) h += 12;
        return h * 60 + Number(m[2] || 0);
    };
    const money = value => { const n = Number(value || 0); return `$${Number.isInteger(n) ? n : n.toFixed(2)}`; };
    const titleCase = text => String(text).replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
    const isBoardingVisit = visit => (typeof isAdminBoardingService === 'function' ? isAdminBoardingService(visit) : /board/i.test(`${visit?.service_type || ''} ${visit?.service_name || ''}`));
    const visitsOf = clientId => (typeof allVisits !== 'undefined' ? allVisits : []).filter(v => String(v.client_id) === String(clientId) && lower(v.status) !== 'cancelled');
    const staysOf = clientId => (typeof adminBoardingState !== 'undefined' ? adminBoardingState.stays || [] : []).filter(s => String(s.client_id) === String(clientId));

    const svg = (d, size = 20, width = 2) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
    const ICON = {
        call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
        text: '<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3V6a1 1 0 0 1 1-1z"/>',
        mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7.5l8 6 8-6"/>',
        nav: '<path d="M21 3L3 10.5l7.5 2.5L13 21z"/>',
        cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
        moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
        clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
        dot: '<circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>',
        chev: '<path d="M9 6l6 6-6 6"/>',
        phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'
    };

    // ---------- what's going on with a client ----------
    function clientStatus(clientId) {
        const t = today();
        const visits = visitsOf(clientId);
        const done = v => lower(v.status) === 'completed' || Boolean(v.completed_at);
        const stay = staysOf(clientId).find(s => s.status === 'active') || null;
        const live = visits.find(v => lower(v.status) === 'checked_in' && !done(v) && !isBoardingVisit(v)) || null;
        const next = visits.filter(v => String(v.visit_date || '') >= t && !done(v) && v !== live)
            .sort((a, b) => String(a.visit_date).localeCompare(String(b.visit_date)) || timeValue(a) - timeValue(b))[0] || null;
        const last = visits.filter(v => done(v) || String(v.visit_date || '') < t)
            .sort((a, b) => String(b.visit_date).localeCompare(String(a.visit_date)))[0] || null;
        return { total: visits.length, stay, live, next, last, upcoming: Boolean(stay || live || next) };
    }
    function whenText(visit) {
        const day = visit.visit_date === today() ? 'Today' : visit.visit_date === tomorrow() ? 'Tomorrow' : weekdayDate(visit.visit_date);
        const time = startTime(visit);
        return time ? `${day}, ${time}` : day;
    }
    function statusLine(s, filter) {
        if (s.live) return { kind: 'live', icon: ICON.dot, text: 'Visit In Progress' };
        if (s.stay) return { kind: 'board', icon: ICON.moon, text: s.stay.pickup_date ? `Boarding Until ${shortDate(s.stay.pickup_date)}` : 'Boarding With Us' };
        if (s.next) return { kind: 'next', icon: ICON.cal, text: `Next: ${whenText(s.next)}` };
        if (filter === 'none') return s.last ? { kind: 'last', icon: ICON.clock, text: `Last visit ${shortDate(s.last.visit_date)}` } : { kind: 'none', icon: '', text: 'No visits yet' };
        return { kind: 'none', icon: '', text: 'No upcoming visit' };
    }

    // ========================================
    // STYLES
    // ========================================
    const css = document.createElement('style');
    css.id = 'pis-clients-css';
    css.textContent = `
        /* ----- clients list ----- */
        #admin-screen-clients.pis-clients-on { background: none !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
        #admin-screen-clients.pis-clients-on .pis-clients-intro { position: absolute !important; width: 1px !important; height: 1px !important; overflow: hidden !important;
            clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; margin: -1px !important; padding: 0 !important; border: 0 !important; }
        #admin-screen-clients.pis-clients-on .admin-client-directory { background: none !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
        .pis-clients-on .admin-client-directory-search-panel { position: sticky; top: var(--pis-clients-top, 0px); z-index: 20; display: flex !important; flex-direction: column; gap: 10px;
            margin: 0 0 4px !important; padding: 12px 0 8px !important; background: rgba(243,247,251,.95) !important; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
            border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        .pis-clients-on .admin-client-directory-search-panel::before, .pis-clients-on .admin-client-directory-search-panel::after { display: none !important; }
        .pis-clients-on .admin-client-directory-search-heading { display: none !important; }
        .pis-clients-on .admin-client-search { position: relative; display: flex !important; align-items: center; gap: 10px; height: 48px; box-sizing: border-box; padding: 0 2px 0 14px !important;
            margin: 0 !important; background: #fff !important; border: 1.5px solid #c9d8e8 !important; border-radius: 14px !important; box-shadow: none !important; }
        .pis-clients-on .admin-client-search:focus-within { border-color: #1b6fb3 !important; box-shadow: 0 0 0 4px rgba(43,139,214,.16) !important; }
        .pis-clients-on .admin-client-search-icon { position: static !important; transform: none !important; display: inline-flex !important; flex: none; color: #5b6b80 !important; margin: 0 !important; }
        .pis-clients-on .admin-client-search-input { flex: 1; min-width: 0; width: auto !important; height: 44px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; outline: 0 !important;
            background: none !important; box-shadow: none !important; font-size: 16px !important; font-weight: 600 !important; color: #13233a !important; -webkit-appearance: none; appearance: none; }
        .pis-clients-on .admin-client-search-input::placeholder { color: #627184 !important; font-weight: 400; opacity: 1; }
        .pis-clients-on .admin-client-search-input::-webkit-search-cancel-button { display: none; }
        .pis-clients-on .admin-client-search-clear { position: static !important; transform: none !important; width: 44px !important; height: 44px !important; flex: none; margin: 0 !important; padding: 0 !important;
            border: 0 !important; background: none !important; box-shadow: none !important; color: #4a5b70 !important; font-size: 24px !important; line-height: 1 !important;
            display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
        .pis-clients-on .admin-client-search-clear[hidden] { display: none !important; }
        .pis-client-filters { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding: 2px; margin: -2px; }
        .pis-client-filters::-webkit-scrollbar { display: none; }
        .pis-clients-on .pis-client-filter { display: inline-flex !important; align-items: center; gap: 7px; flex: 0 0 auto !important; width: auto !important; min-width: 0 !important; min-height: 44px; margin: 0 !important;
            padding: 0 11px !important; border-radius: 999px !important; border: 1px solid #c9d8e8 !important; background: #fff; box-shadow: none !important; color: #2c4a6b; font-family: inherit;
            font-size: 14px !important; font-weight: 800 !important; white-space: nowrap; cursor: pointer; }
        .pis-client-filter b { font-size: 12px; font-weight: 800; border-radius: 999px; padding: 2px 7px; background: #eef3f8; color: #4a5b70; }
        .pis-clients-on .pis-client-filter[aria-pressed="true"] { background: linear-gradient(135deg, #1f74be, #17609f); border-color: #17609f !important; color: #fff; }
        .pis-client-filter[aria-pressed="true"] b { background: rgba(255,255,255,.22); color: #fff; }
        .pis-client-filter:focus-visible, .pis-client-open:focus-visible, .pis-contact-btn:focus-visible, .pis-hh-action:focus-visible, .pis-hh-next:focus-visible,
        .pis-hh-visit-open:focus-visible, .pis-contact-card button:focus-visible { outline: 3px solid #8fd0ff; outline-offset: 2px; }
        .pis-client-list-label { margin: 6px 2px 8px !important; font-size: 11.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #5b6b80; }
        #admin-client-directory-list.pis-client-list { display: block !important; gap: 0 !important; margin: 0 !important; padding: 0 !important; background: #fff; border: 1px solid #dce5ef;
            border-radius: 18px; overflow: hidden; box-shadow: 0 6px 18px rgba(19,35,58,.05); }
        .pis-client-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; min-height: 68px; box-sizing: border-box; border-top: 1px solid #e4ebf3; background: #fff; }
        .pis-client-row:first-child { border-top: 0; }
        .pis-client-open { flex: 1; min-width: 0; min-height: 50px; display: flex; align-items: center; gap: 10px; border: 0; background: none; padding: 0; margin: 0; text-align: left;
            color: inherit; font: inherit; cursor: pointer; border-radius: 12px; }
        .pis-client-avatar { width: 44px; height: 44px; flex: 0 0 44px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, #2e9fd8, #1f74be); color: #fff; font-size: 15px; font-weight: 800; object-fit: cover; box-sizing: border-box; }
        img.pis-client-avatar { border: 2px solid #fff; box-shadow: 0 0 0 1px #cfe3f5; background: #eef3f8; }
        .pis-client-text { flex: 1; min-width: 0; display: block; }
        .pis-client-text > strong, .pis-client-pets { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pis-client-text > strong { font-size: 16px; line-height: 19px; font-weight: 800; color: #13233a; }
        .pis-client-pets { font-size: 13.5px; line-height: 17px; font-weight: 600; color: #5b6b80; }
        .pis-client-status { display: flex; align-items: center; gap: 5px; font-size: 12px; line-height: 16px; font-weight: 600; color: #627184; white-space: nowrap; overflow: hidden; }
        .pis-client-status svg { flex: none; }
        .pis-client-status span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        .pis-client-status[data-kind="next"] { color: #1f5fbf; font-weight: 700; }
        .pis-client-status[data-kind="board"] { color: #b85a0a; font-weight: 700; }
        .pis-client-status[data-kind="live"] { color: #17733a; font-weight: 700; }
        .pis-client-status[data-kind="last"] { color: #5b6b80; }
        .pis-client-row mark { background: #ffe7a3; color: inherit; border-radius: 3px; padding: 0 1px; }
        .pis-client-actions { display: flex; gap: 4px; flex: none; }
        .pis-contact-btn { width: 44px; height: 44px; border: 1px solid #d3e4f4; border-radius: 12px; background: #eef5fc; color: #1b6fb3; display: inline-flex; align-items: center;
            justify-content: center; padding: 0; cursor: pointer; }
        #admin-client-directory-list.pis-client-list .admin-client-directory-empty { margin: 0; border: 0; border-radius: 0; box-shadow: none; }
        @media (max-width: 899px) {
            .pis-clients-on .admin-client-directory-search-panel { margin-left: -12px !important; margin-right: -12px !important; padding-left: 12px !important; padding-right: 12px !important; }
        }
        @media (min-width: 900px) {
            .pis-clients-on .admin-client-directory-search-panel { background: none !important; -webkit-backdrop-filter: none; backdrop-filter: none; position: static; max-width: 560px; }
            #admin-client-directory-list.pis-client-list { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px !important; background: none; border: 0;
                box-shadow: none; overflow: visible; border-radius: 0; }
            .pis-client-row, .pis-client-row:first-child { border: 1px solid #dce5ef; border-radius: 16px; box-shadow: 0 4px 14px rgba(19,35,58,.04); }
            #admin-client-directory-list.pis-client-list .admin-client-directory-empty { grid-column: 1 / -1; border: 1px solid #dce5ef; border-radius: 16px; }
        }

        /* ----- household page ----- */
        #admin-client-household-detail.pis-hh-on .admin-client-household-modal-body > .admin-client-household-grid,
        #admin-client-household-detail.pis-hh-on .admin-client-household-modal-body > .admin-client-household-section { display: none !important; }
        #admin-client-household-detail.pis-hh-on .admin-client-household-header { background: linear-gradient(135deg, #1f74be, #17558f) !important; flex-wrap: wrap !important; row-gap: 14px; }
        #admin-client-household-detail.pis-hh-on .admin-client-household-header .admin-screen-eyebrow { color: #fff !important; }
        #admin-client-household-detail.pis-hh-on .admin-client-household-avatar { overflow: hidden; }
        #admin-client-household-detail.pis-hh-on .admin-client-household-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pis-hh-actions { flex: 0 0 100%; width: 100%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
        .pis-hh-action { height: 60px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border: 1px solid rgba(255,255,255,.38);
            border-radius: 14px; background: rgba(255,255,255,.14); color: #fff !important; font-family: inherit; font-size: 12.5px; font-weight: 800; line-height: 1; text-decoration: none !important;
            padding: 0; margin: 0; cursor: pointer; }
        span.pis-hh-action { opacity: .5; cursor: default; }
        .pis-hh { display: flex; flex-direction: column; gap: 18px; width: 100%; max-width: 720px; margin: 0 auto; padding: 2px 0 10px; box-sizing: border-box; color: #13233a; text-align: left; }
        .pis-hh [hidden] { display: none !important; }
        .pis-hh-section, .pis-hh .pis-hh-section.admin-client-household-section { display: flex !important; flex-direction: column; gap: 8px; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
        .pis-hh-head { display: flex; align-items: center; justify-content: space-between; margin: 0 2px; }
        .pis-hh-head h3 { margin: 0 !important; font-size: 11.5px !important; font-weight: 800 !important; letter-spacing: .1em; text-transform: uppercase; color: #5b6b80 !important; }
        .pis-hh-head span { font-size: 12px; font-weight: 700; color: #5b6b80; }
        .pis-hh-card { background: #fff; border: 1px solid #dce5ef; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(19,35,58,.04); }
        .pis-hh-next { display: flex; align-items: center; gap: 12px; width: 100%; box-sizing: border-box; padding: 12px 12px 12px 14px; background: #eef5ff; border: 1px solid #c7dbf7;
            border-radius: 16px; text-align: left; color: #13233a; font: inherit; margin: 0; }
        button.pis-hh-next { cursor: pointer; }
        .pis-hh-next[data-kind="board"] { background: #fff8f1; border-color: #f2cfae; }
        .pis-hh-next[data-kind="live"] { background: #eefaf2; border-color: #bfe6cc; }
        .pis-hh-next[data-kind="none"] { background: #fff; border-color: #dce5ef; }
        .pis-hh-next-icon { width: 44px; height: 44px; flex: 0 0 44px; border-radius: 13px; background: #fff; border: 1px solid #c7dbf7; display: inline-flex; align-items: center; justify-content: center; color: #1f5fbf; }
        .pis-hh-next[data-kind="board"] .pis-hh-next-icon { border-color: #f2cfae; color: #b85a0a; }
        .pis-hh-next[data-kind="live"] .pis-hh-next-icon { border-color: #bfe6cc; color: #17733a; }
        .pis-hh-next[data-kind="none"] .pis-hh-next-icon { border-color: #dce5ef; color: #5b6b80; background: #f4f8fc; }
        .pis-hh-next-text { flex: 1; min-width: 0; display: block; }
        .pis-hh-next-text > span { display: block; }
        .pis-hh-next-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #1f5fbf; }
        .pis-hh-next[data-kind="board"] .pis-hh-next-eyebrow { color: #b85a0a; }
        .pis-hh-next[data-kind="live"] .pis-hh-next-eyebrow { color: #17733a; }
        .pis-hh-next[data-kind="none"] .pis-hh-next-eyebrow { color: #5b6b80; }
        .pis-hh-next-title { font-size: 16px; line-height: 1.25; font-weight: 800; color: #13233a; }
        .pis-hh-next-sub { font-size: 13.5px; font-weight: 600; color: #5b6b80; }
        .pis-hh-next > svg { flex: none; color: #1f5fbf; }
        .pis-hh-row { display: grid; grid-template-columns: 104px minmax(0, 1fr); gap: 10px; align-items: baseline; padding: 12px 14px; border-top: 1px solid #e4ebf3; }
        .pis-hh-row:first-child { border-top: 0; }
        .pis-hh-row dt { margin: 0; font-size: 13px; font-weight: 700; color: #5b6b80; }
        .pis-hh-row dd { margin: 0; font-size: 15px; line-height: 1.35; font-weight: 700; color: #13233a; overflow-wrap: anywhere; white-space: pre-line; }
        .pis-hh-row.is-code dd { font-size: 17px; font-weight: 800; }
        .pis-hh-rows { margin: 0; }
        .pis-hh-missing { margin: 0 !important; padding: 10px 14px; border-top: 1px solid #e4ebf3; background: #f8fafd; font-size: 12.5px; line-height: 1.4; color: #5b6b80; }
        .pis-hh-missing:first-child { border-top: 0; }
        /* pets */
        .pis-hh #admin-client-household-pets { display: block !important; margin: 0 !important; padding: 0 !important; gap: 0 !important; }
        .pis-hh .pis-hh-pet { display: block !important; margin: 0 !important; padding: 12px 14px !important; border: 0 !important; border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important;
            background: #fff !important; box-shadow: none !important; overflow: visible !important; }
        .pis-hh .pis-hh-pet:first-child { border-top: 0 !important; }
        .pis-hh-pet-top { display: flex; align-items: center; gap: 12px; }
        .pis-hh .pis-hh-pet .admin-client-pet-photo { width: 48px !important; height: 48px !important; flex: 0 0 48px; border-radius: 50% !important; object-fit: cover; background: #eef3f8;
            border: 1px solid #dce5ef !important; box-shadow: none !important; margin: 0 !important; }
        .pis-hh-pet-copy { flex: 1; min-width: 0; }
        .pis-hh-pet-copy strong { display: block; font-size: 16px; line-height: 1.2; font-weight: 800; color: #13233a; }
        .pis-hh-pet-copy span { display: block; font-size: 13.5px; font-weight: 600; color: #5b6b80; }
        .pis-hh-pet-copy span.pis-hh-pet-facts { font-size: 12.5px; color: #627184; }
        .pis-hh-note { margin-top: 8px; padding: 9px 11px; border-radius: 10px; background: #f4f8fc; }
        .pis-hh-note span { display: block; margin-bottom: 1px; font-size: 10.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #5b6b80; }
        .pis-hh-note p { margin: 0 !important; font-size: 13.5px; line-height: 1.4; color: #13233a; white-space: pre-line; overflow-wrap: anywhere; text-align: left; }
        .pis-hh .admin-client-household-empty { margin: 0; padding: 16px 14px; border: 0; border-radius: 0; background: #fff; box-shadow: none; text-align: left; }
        /* visits */
        .pis-hh #admin-client-household-activity { display: block !important; margin: 0 !important; padding: 0 !important; gap: 0 !important; border: 0 !important; background: none !important; }
        .pis-hh .pis-hh-visit { display: block !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important;
            background: #fff !important; box-shadow: none !important; }
        .pis-hh .pis-hh-visit:first-child { border-top: 0 !important; }
        .pis-hh-visit-open { display: flex; align-items: center; gap: 10px; width: 100%; box-sizing: border-box; min-height: 60px; padding: 9px 12px; border: 0; background: none; text-align: left;
            color: inherit; font: inherit; margin: 0; cursor: pointer; }
        .pis-hh-date { width: 40px; height: 42px; flex: 0 0 40px; border-radius: 11px; background: #fff6ec; border: 1px solid #f7ddbf; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; }
        .pis-hh-date span { font-size: 9.5px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #a8530f; }
        .pis-hh-date strong { font-size: 16px; line-height: 1; font-weight: 800; color: #13233a; }
        .pis-hh-visit-text { flex: 1; min-width: 0; display: block; }
        .pis-hh-visit-text strong, .pis-hh-visit-text span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pis-hh-visit-text strong { font-size: 14px; font-weight: 800; color: #13233a; }
        .pis-hh-visit-text span { font-size: 13px; font-weight: 600; color: #5b6b80; }
        .pis-hh .pis-hh-pill { flex: none; font-size: 11px !important; font-weight: 800 !important; letter-spacing: 0 !important; text-transform: none !important; border: 0 !important; border-radius: 999px !important;
            padding: 4px 8px !important; white-space: nowrap; color: #1f5fbf !important; background: #eaf2fe !important; }
        .pis-hh .pis-hh-pill[data-kind="done"] { color: #17733a !important; background: #e6f6ec !important; }
        .pis-hh .pis-hh-pill[data-kind="live"] { color: #8a4b00 !important; background: #fff1dc !important; }
        .pis-hh .admin-client-view-history-button { display: flex !important; align-items: center; justify-content: center; width: 100% !important; min-height: 48px; margin: 0 !important; padding: 0 12px !important;
            border: 0 !important; border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; background: #eef5fc !important; color: #1b6fb3 !important; font-size: 14px !important; font-weight: 800 !important; box-shadow: none !important; }
        /* pricing & billing: the app's own boxes, as rows */
        .pis-hh-card > article.admin-client-household-info-card { display: block !important; margin: 0 !important; padding: 10px 14px !important; min-height: 0 !important; border: 0 !important;
            border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; background: #fff !important; box-shadow: none !important; color: #13233a !important; grid-column: auto !important; }
        .pis-hh-card > article.admin-client-household-info-card:first-child { border-top: 0 !important; }
        .pis-hh-card > article.admin-client-household-info-card::before, .pis-hh-card > article.admin-client-household-info-card::after { display: none !important; }
        .pis-hh-card > article .admin-client-household-info-label { display: block !important; margin: 0 !important; font-size: 13px !important; font-weight: 700 !important; letter-spacing: 0 !important;
            text-transform: none !important; color: #5b6b80 !important; opacity: 1 !important; }
        .pis-hh-card > article .admin-client-pricing-tier-display, .pis-hh-card > article .admin-client-legacy-discount-display, .pis-hh-card > article .admin-client-credit-display {
            display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 10px !important; margin: 0 !important; }
        .pis-hh-card > article .admin-client-pricing-tier-display[hidden] { display: none !important; }
        .pis-hh-card > article strong { font-size: 16px !important; line-height: 1.25 !important; font-weight: 800 !important; color: #13233a !important; margin: 0 !important; text-shadow: none !important; }
        .pis-hh-card > article .admin-client-pricing-tier-edit-button, .pis-hh-card > article .admin-client-credit-add-button { flex: none; width: auto !important; min-width: 0 !important; height: 44px !important;
            margin: 0 !important; padding: 0 14px !important; border: 1px solid #c9d8e8 !important; border-radius: 12px !important; background: #eef5fc !important; color: #1b6fb3 !important;
            font-size: 13.5px !important; font-weight: 800 !important; box-shadow: none !important; white-space: nowrap; }
        .pis-hh-card > article .admin-client-legacy-discount-toggle { position: relative; flex: none; width: auto !important; min-width: 0 !important; height: 44px !important; margin: 0 !important;
            padding: 0 58px 0 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; color: #13233a !important;
            font-size: 13px !important; font-weight: 800 !important; white-space: nowrap; cursor: pointer; }
        .pis-hh-card > article .admin-client-legacy-discount-toggle::after { content: ""; position: absolute; right: 0; top: 7px; width: 50px; height: 30px; border-radius: 999px; background: #8f9cab; transition: background .15s; }
        .pis-hh-card > article .admin-client-legacy-discount-toggle::before { content: ""; position: absolute; z-index: 1; right: 23px; top: 10px; width: 24px; height: 24px; border-radius: 50%; background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: right .15s; }
        .pis-hh-card > article .admin-client-legacy-discount-toggle[aria-checked="true"]::after { background: #1f74be; }
        .pis-hh-card > article .admin-client-legacy-discount-toggle[aria-checked="true"]::before { right: 3px; }
        .pis-hh-card > article .admin-client-legacy-discount-toggle:disabled { opacity: .6; cursor: default; }
        .pis-hh-card > article .admin-client-legacy-discount-toggle:focus-visible { outline: 3px solid #8fd0ff; outline-offset: 2px; border-radius: 10px !important; }
        @media (prefers-reduced-motion: reduce) { .pis-hh-card > article .admin-client-legacy-discount-toggle::before, .pis-hh-card > article .admin-client-legacy-discount-toggle::after { transition: none; } }
        .pis-hh-card > article #admin-client-legacy-discount-status, .pis-hh-card > article #admin-client-minimum-waiver-status, .pis-hh-card > article .admin-client-credit-status {
            display: block !important; margin: 2px 0 0 !important; font-size: 12.5px !important; line-height: 1.4 !important; font-weight: 400 !important; color: #5b6b80 !important; opacity: 1 !important; }
        .pis-hh-card > article .admin-client-pricing-tier-editor { margin: 8px 0 2px !important; display: flex; flex-direction: column; gap: 8px; }
        .pis-hh-card > article .admin-client-pricing-tier-editor[hidden] { display: none !important; }
        .pis-hh-card > article .admin-client-pricing-tier-editor select { width: 100% !important; min-height: 44px; font-size: 16px !important; color: #13233a !important; background-color: #fff !important; border: 1px solid #c9d8e8 !important; border-radius: 12px !important; }
        .pis-hh-card > article .admin-client-pricing-tier-actions { display: flex !important; gap: 8px; }
        .pis-hh-card > article .admin-client-pricing-tier-actions button { flex: 1; min-height: 44px; margin: 0 !important; }
        /* team members don't see pricing & billing (same as before) */
        body.pis-employee .pis-hh [data-hh="billing"] { display: none !important; }
        /* delete client */
        .pis-hh .pis-client-delete { display: block !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
        .pis-hh .pis-client-delete .admin-client-household-section-heading { display: none !important; }
        .pis-hh .pis-client-delete .pis-client-delete-card { margin: 0 !important; }

        /* ----- call / text picker ----- */
        .pis-contact-sheet { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: flex-end; justify-content: center; background: rgba(15,30,48,.5);
            padding: 12px 12px calc(env(safe-area-inset-bottom, 0px) + 12px); box-sizing: border-box; }
        .pis-contact-card { width: 100%; max-width: 420px; background: #fff; border-radius: 22px; padding: 18px 16px 14px; box-shadow: 0 20px 50px rgba(0,0,0,.3); display: flex; flex-direction: column; gap: 10px;
            font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
        .pis-contact-card h2 { margin: 0; font-size: 19px; line-height: 1.2; font-weight: 800; color: #13233a; text-align: center; }
        .pis-contact-number { margin: -6px 0 4px; text-align: center; font-size: 14.5px; font-weight: 600; color: #5b6b80; }
        .pis-contact-card button { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 54px; padding: 0 16px; border-radius: 14px; border: 1px solid #c9d8e8; background: #eef5fc;
            color: #154f85; font-family: inherit; font-size: 16px; font-weight: 800; text-align: left; cursor: pointer; margin: 0; }
        .pis-contact-card button small { display: block; font-size: 12.5px; font-weight: 500; color: #4a5b70; }
        .pis-contact-card button svg { flex: none; }
        .pis-contact-card button.pis-contact-cancel { justify-content: center; border-color: transparent; background: none; color: #4a5b70; min-height: 46px; }
        .pis-contact-voice-mark { width: 22px; height: 22px; flex: none; border-radius: 6px; background: #188038; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
        @media (min-width: 700px) { .pis-contact-sheet { align-items: center; } }
    `;
    document.head.appendChild(css);

    // ========================================
    // CALL / TEXT PICKER
    // ========================================
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const phoneName = isApple ? 'iPhone' : 'Phone';
    function plusNumber(phone) {
        const d = digits(phone);
        if (d.length === 10) return `+1${d}`;
        return `+${d}`;
    }
    const localNumber = phone => { const d = digits(phone); return d.length === 11 && d[0] === '1' ? d.slice(1) : d; };
    const prettyNumber = phone => { const d = localNumber(phone); return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : String(phone || ''); };
    function contactUrl(kind, via, phone) {
        if (via === 'voice') {
            // Calls: the address Google documents for starting a call. Texts: the address Google Voice uses for a conversation with one number.
            const n = encodeURIComponent(plusNumber(phone));
            return kind === 'call' ? `https://voice.google.com/u/0/calls?a=nc,${n}` : `https://voice.google.com/u/0/messages?itemId=t.${n}`;
        }
        return `${kind === 'call' ? 'tel' : 'sms'}:${digits(phone)}`;
    }
    function follow(url, external) {
        if (!external) { window.location.href = url; return; }   // tel: / sms: go to the phone itself
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
    // Runs inside the tap itself (nothing awaited first), so the phone lets the link open.
    function useContact(kind, via, phone) {
        const url = contactUrl(kind, via, phone);
        if (via === 'voice') {
            const say = text => { try { window.pisNotice?.(text, 'info', { duration: 2500 }); } catch { /* ignore */ } };
            let copying = null;
            try { copying = navigator.clipboard?.writeText(localNumber(phone)); } catch { copying = null; }   // a backup: paste it if Google Voice opens somewhere else
            Promise.resolve(copying).then(() => say(copying ? 'Number copied. Opening Google Voice…' : 'Opening Google Voice…'), () => say('Opening Google Voice…'));
        }
        (PisClients.follow || follow)(url, via === 'voice');
    }
    let sheet = null;
    function closePicker() {
        if (!sheet) return;
        const { el, trigger, onKey } = sheet;
        sheet = null;
        document.removeEventListener('keydown', onKey, true);
        el.remove();
        if (trigger?.isConnected) { try { trigger.focus({ preventScroll: true }); } catch { /* ignore */ } }
    }
    function openPicker(kind, phone, name, trigger) {
        if (!digits(phone)) return;
        closePicker();
        const el = document.createElement('div');
        el.className = 'pis-contact-sheet';
        el.innerHTML = `<div class="pis-contact-card" role="dialog" aria-modal="true" aria-labelledby="pis-contact-title">
            <h2 id="pis-contact-title">${kind === 'call' ? 'Call' : 'Text'}${name ? ` ${esc(name)}` : ''}</h2>
            <p class="pis-contact-number">${esc(prettyNumber(phone))}</p>
            <button type="button" data-pis-via="phone">${svg(ICON.phone, 22)}<span>${phoneName}<small>${kind === 'call' ? 'Call from this phone’s number' : 'Text from this phone’s number'}</small></span></button>
            <button type="button" data-pis-via="voice"><span class="pis-contact-voice-mark" aria-hidden="true">${svg(kind === 'call' ? ICON.call : ICON.text, 14, 2.4)}</span><span>Google Voice<small>${kind === 'call' ? 'Call from your Google Voice number' : 'Text from your Google Voice number'}</small></span></button>
            <button type="button" class="pis-contact-cancel" data-pis-via="cancel">Cancel</button>
        </div>`;
        const buttons = () => [...el.querySelectorAll('button')];
        const onKey = event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePicker(); return; }
            if (event.key !== 'Tab') return;
            const list = buttons(); const first = list[0]; const last = list[list.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            else if (!el.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
        };
        el.addEventListener('click', event => {
            if (event.target === el) { closePicker(); return; }
            const via = event.target.closest('[data-pis-via]')?.dataset.pisVia;
            if (!via) return;
            closePicker();
            if (via !== 'cancel') useContact(kind, via, phone);
        });
        document.addEventListener('keydown', onKey, true);
        document.body.appendChild(el);
        sheet = { el, trigger, onKey };
        buttons()[0].focus({ preventScroll: true });
    }
    // Only the owner has the business Google Voice number.
    const isOwner = () => window.PIS_STAFF_ROLE !== 'employee' && !document.body.classList.contains('pis-employee');
    // Call / Text buttons made here, and the visit screen's Call / Text links
    document.addEventListener('click', event => {
        const button = event.target.closest?.('[data-pis-contact]');
        if (button) {
            event.preventDefault(); event.stopPropagation();
            if (!digits(button.dataset.pisPhone)) return;
            if (isOwner()) openPicker(button.dataset.pisContact, button.dataset.pisPhone, button.dataset.pisName || '', button);
            else useContact(button.dataset.pisContact, 'phone', button.dataset.pisPhone);      // team members: straight to their phone
            return;
        }
        const link = isOwner() ? event.target.closest?.('.vfm a[href^="tel:"], .vfm a[href^="sms:"]') : null;
        if (link) {
            const href = link.getAttribute('href') || '';
            const phone = digits(href.replace(/^[a-z]+:/i, '').split(/[?&]/)[0]);
            if (!phone) return;
            event.preventDefault(); event.stopPropagation();
            const name = link.closest('.vfm')?.querySelector('.pis-sum-name')?.textContent.trim() || '';
            openPicker(/^tel:/i.test(href) ? 'call' : 'text', phone, name, link);
        }
    }, true);

    // ========================================
    // CLIENTS LIST
    // ========================================
    const originalRender = typeof window.renderAdminClientDirectory === 'function' ? window.renderAdminClientDirectory : null;
    const FILTERS = [['all', 'All'], ['upcoming', 'Upcoming'], ['none', 'Not Booked']];
    let filter = 'all';
    let renderVersion = 0;
    let chrome = null;

    function ensureChrome() {
        if (chrome) return chrome;
        const screen = document.getElementById('admin-screen-clients');
        const list = document.getElementById('admin-client-directory-list');
        const input = document.getElementById('admin-client-search-input');
        const clear = document.getElementById('admin-client-search-clear');
        const panel = document.querySelector('.admin-client-directory-search-panel');
        if (!screen || !list || !input || !clear || !panel) return null;
        screen.classList.add('pis-clients-on');
        document.getElementById('admin-client-directory-count')?.closest('.admin-screen-intro')?.classList.add('pis-clients-intro');
        input.placeholder = 'Search clients, pets or phone';
        input.setAttribute('aria-label', 'Search Clients');
        clear.setAttribute('aria-label', 'Clear Search');
        const filters = document.createElement('div');
        filters.className = 'pis-client-filters';
        filters.setAttribute('role', 'group');
        filters.setAttribute('aria-label', 'Filter Clients');
        filters.innerHTML = FILTERS.map(([id, label]) => `<button type="button" class="pis-client-filter" data-pis-filter="${id}" aria-pressed="${id === filter}">${label}<b>0</b></button>`).join('');
        filters.addEventListener('click', event => {
            const button = event.target.closest('[data-pis-filter]');
            if (!button || button.dataset.pisFilter === filter) return;
            filter = button.dataset.pisFilter;
            void render();
        });
        panel.appendChild(filters);
        const label = document.createElement('p');
        label.className = 'pis-client-list-label';
        label.setAttribute('role', 'status');
        list.before(label);
        list.classList.add('pis-client-list');
        chrome = { screen, list, input, clear, panel, filters, label };
        setStickyTop();
        window.addEventListener('resize', setStickyTop);
        return chrome;
    }
    function setStickyTop() {
        if (!chrome) return;
        const header = document.querySelector('.admin-dashboard-header');
        const stuck = header && /sticky|fixed/.test(getComputedStyle(header).position) && header.getClientRects().length;
        chrome.panel.style.setProperty('--pis-clients-top', `${stuck ? Math.round(header.getBoundingClientRect().height) - 1 : 0}px`);
    }
    function mark(text, query) {
        const value = String(text ?? '');
        if (!query) return esc(value);
        const at = value.toLowerCase().indexOf(query);
        if (at < 0) return esc(value);
        return `${esc(value.slice(0, at))}<mark>${esc(value.slice(at, at + query.length))}</mark>${mark(value.slice(at + query.length), query)}`;
    }
    async function rowHtml(profile, status, query) {
        const id = esc(String(profile.id));
        const name = profile.full_name || profile.email || 'Client';
        const pets = getAdminClientPets(profile.id).map(pet => pet.name || 'Pet');
        let photo = null;
        if (profile.profile_photo_path) { try { photo = await getAdminProfilePhotoUrl(profile.profile_photo_path); } catch { photo = null; } }
        const initials = esc(getAdminClientInitials(profile));
        const avatar = photo
            ? `<img src="${esc(photo)}" alt="" class="pis-client-avatar" data-admin-client-photo data-initials="${initials}">`
            : `<span class="pis-client-avatar" aria-hidden="true">${initials}</span>`;
        const line = statusLine(status, filter);
        const phone = digits(profile.phone);
        return `<article class="pis-client-row" data-client-id="${id}">
            <button type="button" class="pis-client-open" data-client-view="${id}">
                ${avatar}
                <span class="pis-client-text">
                    <strong>${mark(name, query)}</strong>
                    <span class="pis-client-pets">${mark(pets.join(', ') || 'No pets added', query)}</span>
                    <span class="pis-client-status" data-kind="${line.kind}">${line.icon ? svg(line.icon, 13, 2.2) : ''}<span>${esc(line.text)}</span></span>
                </span>
            </button>
            ${phone ? `<span class="pis-client-actions">
                <button type="button" class="pis-contact-btn" data-pis-contact="call" data-pis-phone="${phone}" data-pis-name="${esc(name)}" aria-label="Call ${esc(name)}">${svg(ICON.call, 19)}</button>
                <button type="button" class="pis-contact-btn" data-pis-contact="text" data-pis-phone="${phone}" data-pis-name="${esc(name)}" aria-label="Text ${esc(name)}">${svg(ICON.text, 19)}</button>
            </span>` : ''}
        </article>`;
    }
    async function render() {
        const ui = ensureChrome();
        if (!ui) return originalRender?.apply(this, arguments);
        const version = ++renderVersion;
        try {
            const clients = getAdminClientDirectoryProfiles();
            const query = String(ui.input.value || '').trim().toLowerCase();
            const info = new Map(clients.map(profile => [String(profile.id), clientStatus(profile.id)]));
            const of = profile => info.get(String(profile.id));
            const nameOf = profile => lower(profile.full_name || profile.email);
            const counts = { all: clients.length, upcoming: clients.filter(p => of(p).upcoming).length };
            counts.none = counts.all - counts.upcoming;
            let shown = clients;
            if (filter === 'upcoming') {
                const rank = s => (s.live ? 0 : s.stay ? 1 : 2);
                const when = s => (s.next ? `${s.next.visit_date} ${String(timeValue(s.next)).padStart(4, '0')}` : '');
                shown = clients.filter(p => of(p).upcoming)
                    .sort((a, b) => rank(of(a)) - rank(of(b)) || when(of(a)).localeCompare(when(of(b))) || nameOf(a).localeCompare(nameOf(b)));
            } else if (filter === 'none') {
                const last = s => (s.last ? String(s.last.visit_date) : '');
                shown = clients.filter(p => !of(p).upcoming).sort((a, b) => last(of(b)).localeCompare(last(of(a))) || nameOf(a).localeCompare(nameOf(b)));
            }
            if (query) shown = shown.filter(profile => getAdminClientSearchText(profile).includes(query));

            const countElement = document.getElementById('admin-client-directory-count');
            if (countElement) countElement.textContent = `${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`;
            ui.clear.hidden = query.length === 0;
            ui.filters.querySelectorAll('[data-pis-filter]').forEach(button => {
                button.setAttribute('aria-pressed', String(button.dataset.pisFilter === filter));
                button.querySelector('b').textContent = String(counts[button.dataset.pisFilter] ?? 0);
            });
            ui.label.textContent = query ? `${shown.length} ${shown.length === 1 ? 'match' : 'matches'} for “${ui.input.value.trim()}”`
                : filter === 'upcoming' ? 'Soonest first' : filter === 'none' ? 'Most recent visit first' : 'All clients · A to Z';
            setStickyTop();

            if (!shown.length) {
                const [title, text] = query ? ['No clients found', 'Try a different name, pet, phone number, email, or address.']
                    : filter === 'upcoming' ? ['Nothing booked yet', 'Clients with a visit coming up will show here.']
                    : filter === 'none' ? ['Everyone has a visit booked', 'Clients with nothing coming up will show here.']
                    : ['No clients yet', 'Client households will appear here once they have been added.'];
                ui.list.innerHTML = `<div class="admin-client-directory-empty"><strong>${title}</strong><span>${text}</span></div>`;
                return;
            }
            const rows = await Promise.all(shown.map(profile => rowHtml(profile, of(profile), query)));
            if (version !== renderVersion) return;
            ui.list.innerHTML = rows.join('');
            ui.list.querySelectorAll('img[data-admin-client-photo]').forEach(image => {
                image.addEventListener('error', () => {
                    const span = document.createElement('span');
                    span.className = 'pis-client-avatar';
                    span.setAttribute('aria-hidden', 'true');
                    span.textContent = image.dataset.initials || '';
                    image.replaceWith(span);
                }, { once: true });
            });
        } catch (error) {
            console.error('Clients list:', error);
            if (version === renderVersion && originalRender) {
                chrome?.list.classList.remove('pis-client-list');
                return originalRender.apply(this, arguments);
            }
        }
    }
    if (originalRender) window.renderAdminClientDirectory = render;

    // ========================================
    // HOUSEHOLD PAGE
    // ========================================
    const SKELETON = `
        <div data-hh-next></div>
        <section class="pis-hh-section" data-hh="pets"><div class="pis-hh-head"><h3>Pets</h3></div><div class="pis-hh-card" data-hh-slot="pets"></div></section>
        <section class="pis-hh-section" data-hh="access"><div class="pis-hh-head"><h3>Home &amp; Access</h3></div><div class="pis-hh-card"><dl class="pis-hh-rows" data-hh-rows="access"></dl><p class="pis-hh-missing" data-hh-missing></p></div></section>
        <section class="pis-hh-section" data-hh="contact"><div class="pis-hh-head"><h3>Contact</h3></div><div class="pis-hh-card"><dl class="pis-hh-rows" data-hh-rows="contact"></dl></div></section>
        <section class="pis-hh-section admin-client-household-section" data-hh="visits"><div class="pis-hh-head"><h3>Visits</h3><span data-hh-visit-count></span></div><div class="pis-hh-card" data-hh-slot="visits"></div></section>
        <section class="pis-hh-section" data-hh="billing"><div class="pis-hh-head"><h3>Pricing &amp; Billing</h3></div><div class="pis-hh-card" data-hh-slot="billing"></div></section>
        <div data-hh-slot="delete"></div>`;
    let openClientId = null;

    function ensureHousehold() {
        const detail = document.getElementById('admin-client-household-detail');
        const body = detail?.querySelector('.admin-client-household-modal-body');
        const header = detail?.querySelector('.admin-client-household-header');
        if (!detail || !body || !header) return null;
        let hh = document.getElementById('pis-hh');
        if (!hh) {
            const pets = document.getElementById('admin-client-household-pets');
            const activity = document.getElementById('admin-client-household-activity');
            if (!pets || !activity) return null;
            hh = document.createElement('div');
            hh.id = 'pis-hh';
            hh.className = 'pis-hh';
            hh.innerHTML = SKELETON;
            // the app's own working boxes move into the new layout (the booking minimum is taken once, even if the page has it twice)
            const billing = [body.querySelector('.admin-client-pricing-tier-card'),
                document.getElementById('admin-client-legacy-discount-toggle')?.closest('article'),
                document.getElementById('admin-client-minimum-waiver-toggle')?.closest('article'),
                body.querySelector('.admin-client-credit-card')].filter(Boolean);
            body.prepend(hh);
            const slot = name => hh.querySelector(`[data-hh-slot="${name}"]`);
            billing.forEach(article => slot('billing').appendChild(article));
            if (!billing.length) hh.querySelector('[data-hh="billing"]').hidden = true;
            slot('pets').appendChild(pets);
            slot('visits').appendChild(activity);
            hh.querySelectorAll('.admin-client-legacy-discount-toggle').forEach(button => button.setAttribute('role', 'switch'));
            const fix = (toggleId, from, text) => {
                const el = document.getElementById(toggleId)?.closest('article')?.querySelector('.admin-client-legacy-discount-display strong');
                if (el && from.test(el.textContent)) el.textContent = text;
            };
            fix('admin-client-legacy-discount-toggle', /^\s*24% weekly\s*$/i, '24% Weekly');
            fix('admin-client-minimum-waiver-toggle', /^\s*waive 3-day minimum\s*$/i, 'Waive 3-Day Minimum');
            const add = document.getElementById('admin-client-credit-add');
            if (add && /add credit/i.test(add.textContent)) add.textContent = '+ Add Credit';
            const actions = document.createElement('div');
            actions.className = 'pis-hh-actions';
            header.appendChild(actions);
            hh.addEventListener('click', event => {
                const open = event.target.closest('[data-hh-visit]');
                if (open) openVisit(open.dataset.hhVisit);
            });
            new MutationObserver(() => tidy()).observe(hh, { childList: true, subtree: true });
            detail.classList.add('pis-hh-on');
        }
        return { detail, body, header, hh };
    }

    function openVisit(visitId) {
        try { closeAdminClientHousehold(); } catch { /* ignore */ }
        try { openAdminRouteVisitInSchedule(visitId); } catch (error) { console.warn('Open visit:', error); return; }
        let tries = 0;
        const tryOpen = () => {
            if (document.querySelector('.vfm:not([hidden])')) return;
            const row = [...document.querySelectorAll('#admin-day-services [data-schedule-visit-id]')].find(el => el.dataset.scheduleVisitId === String(visitId));
            const main = row?.querySelector('.pis-row-main');
            if (main) { main.click(); return; }
            if (++tries < 25) setTimeout(tryOpen, 80);
        };
        setTimeout(tryOpen, 80);
    }

    // small fixes after the app redraws something inside the new layout
    let tidying = false;
    function tidy() {
        if (tidying) return;
        tidying = true;
        try {
            const hh = document.getElementById('pis-hh');
            if (!hh) return;
            const slot = hh.querySelector('[data-hh-slot="delete"]');
            hh.querySelectorAll('.pis-client-delete').forEach(box => { if (box.parentElement !== slot) { slot.replaceChildren(box); } });
            hh.querySelectorAll('.admin-client-view-history-button').forEach(button => {
                const text = titleCase(button.textContent.trim());
                if (button.textContent !== text) button.textContent = text;
            });
        } finally { tidying = false; }
    }

    const rowsHtml = rows => rows.map(([label, value, code]) => `<div class="pis-hh-row${code ? ' is-code' : ''}"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('');

    function nextCard(clientId) {
        const s = clientStatus(clientId);
        const service = visit => String(visit.service_name || visit.service_type || 'Visit');
        const price = visit => (Number(visit.price) > 0 ? ` · ${money(visit.price)}` : '');
        const card = (kind, icon, eyebrow, title, sub, visitId) => {
            const inner = `<span class="pis-hh-next-icon">${svg(icon, 22)}</span>
                <span class="pis-hh-next-text"><span class="pis-hh-next-eyebrow">${esc(eyebrow)}</span><span class="pis-hh-next-title">${esc(title)}</span>${sub ? `<span class="pis-hh-next-sub">${esc(sub)}</span>` : ''}</span>`;
            return visitId
                ? `<button type="button" class="pis-hh-next" data-kind="${kind}" data-hh-visit="${esc(String(visitId))}">${inner}${svg(ICON.chev, 22, 2.4)}</button>`
                : `<div class="pis-hh-next" data-kind="${kind}">${inner}</div>`;
        };
        if (s.live) return card('live', ICON.dot, 'Visit In Progress', service(s.live), s.live.time_window || '', s.live.id);
        if (s.stay) {
            const night = visitsOf(clientId).find(v => isBoardingVisit(v) && v.visit_date === today()) || null;
            return card('board', ICON.moon, 'Boarding With Us', s.stay.pickup_date ? `Until ${weekdayDate(s.stay.pickup_date)}` : 'Stay in progress',
                s.stay.dropoff_date ? `Arrived ${shortDate(s.stay.dropoff_date)}` : '', night?.id || s.stay.primary_visit_id || null);
        }
        if (s.next) {
            const window = String(s.next.time_window || '');
            const day = s.next.visit_date === today() ? 'Today' : s.next.visit_date === tomorrow() ? 'Tomorrow' : weekdayDate(s.next.visit_date);
            return card('next', ICON.cal, 'Next Visit', /^\d/.test(window) ? `${day}, ${window.replace(/\s*-\s*/, ' – ')}` : day, `${service(s.next)}${price(s.next)}`, s.next.id);
        }
        return card('none', ICON.cal, 'Nothing Booked', s.last ? `Last visit ${shortDate(s.last.visit_date)}` : 'No visits yet', '', null);
    }

    function sync(clientId, opening = false) {
        const ui = ensureHousehold();
        if (!ui) return;
        const { detail, header, hh } = ui;
        const profile = (typeof allProfiles !== 'undefined' ? allProfiles : []).find(item => String(item.id) === String(clientId));
        if (!profile) return;
        openClientId = String(clientId);
        const name = profile.full_name || profile.email || 'Client';
        const household = getAdminClientHousehold(clientId) || {};
        const access = (typeof allPropertyAccess !== 'undefined' ? allPropertyAccess : []).find(item => String(item.client_id) === String(clientId)) || {};
        const address = getAdminClientAddress(clientId) || '';
        const pets = getAdminClientPets(clientId);
        const phone = digits(profile.phone);

        // header: pets by name, the client's photo, and the four actions
        const summary = document.getElementById('admin-client-household-pets-summary');
        if (summary) summary.textContent = pets.length ? pets.map(pet => pet.name || 'Pet').join(', ') : 'No pets added';
        const avatar = document.getElementById('admin-client-household-avatar');
        if (avatar && profile.profile_photo_path && typeof getAdminProfilePhotoUrl === 'function') {
            Promise.resolve(getAdminProfilePhotoUrl(profile.profile_photo_path)).then(url => {
                if (!url || openClientId !== String(clientId) || !avatar.isConnected) return;
                const image = new Image();
                image.alt = '';
                image.onload = () => { if (openClientId === String(clientId)) avatar.replaceChildren(image); };
                image.src = url;
            }).catch(() => { /* initials stay */ });
        }
        const action = (enabled, inner, attrs) => (enabled ? `<${attrs.tag} class="pis-hh-action" ${attrs.html}>${inner}</${attrs.tag}>` : `<span class="pis-hh-action" aria-disabled="true">${inner}</span>`);
        header.querySelector('.pis-hh-actions').innerHTML =
            action(Boolean(phone), `${svg(ICON.call)}Call`, { tag: 'button', html: `type="button" data-pis-contact="call" data-pis-phone="${phone}" data-pis-name="${esc(name)}"` }) +
            action(Boolean(phone), `${svg(ICON.text)}Text`, { tag: 'button', html: `type="button" data-pis-contact="text" data-pis-phone="${phone}" data-pis-name="${esc(name)}"` }) +
            action(Boolean(profile.email), `${svg(ICON.mail)}Email`, { tag: 'a', html: `href="mailto:${esc(profile.email || '')}"` }) +
            action(Boolean(address), `${svg(ICON.nav)}Navigate`, { tag: 'a', html: `href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}" target="_blank" rel="noopener noreferrer"` });

        hh.querySelector('[data-hh-next]').innerHTML = nextCard(clientId);

        // home & access: only what's filled in, then one line for the rest
        const fields = [['Address', address], ['Gate Code', access.gate_code, true], ['Door Code', access.door_code, true], ['Key', access.key_instructions],
            ['Alarm', access.alarm_instructions], ['Parking', access.parking_instructions], ['Home Notes', household.home_notes], ['Other Notes', access.other_access_notes]]
            .map(([label, value, code]) => [label, String(value || '').trim(), code]);
        const filled = fields.filter(([, value]) => value);
        const missing = fields.filter(([, value]) => !value).map(([label]) => label.toLowerCase());
        hh.querySelector('[data-hh-rows="access"]').innerHTML = rowsHtml(filled);
        const missingLine = hh.querySelector('[data-hh-missing]');
        missingLine.hidden = !missing.length;
        missingLine.textContent = filled.length ? `Not added yet: ${missing.join(', ')}` : 'Nothing added yet.';

        const emergency = [household.emergency_contact_name, household.emergency_contact_phone].map(v => String(v || '').trim()).filter(Boolean).join('\n');
        const contact = [['Phone', String(profile.phone || '').trim()], ['Email', String(profile.email || '').trim()], ['Prefers', String(household.preferred_contact_method || '').trim()],
            ['Emergency', emergency]].filter(([, value]) => value);
        hh.querySelector('[data-hh-rows="contact"]').innerHTML = contact.length ? rowsHtml(contact) : '';
        hh.querySelector('[data-hh="contact"]').hidden = !contact.length;

        const total = visitsOf(clientId).length;
        hh.querySelector('[data-hh-visit-count]').textContent = total ? `${total} total` : '';
        tidy();
        if (opening) detail.querySelector('.admin-client-household-modal-body')?.scrollTo?.({ top: 0 });
    }

    // pets and visits: the app asks these two functions for each item's markup
    if (typeof window.buildAdminClientPetCard === 'function') {
        const original = window.buildAdminClientPetCard;
        window.buildAdminClientPetCard = async function (pet) {
            if (!document.getElementById('pis-hh')) return original.apply(this, arguments);
            try {
                const name = pet.name || 'Pet';
                const line = [pet.breed, pet.gender].map(v => String(v || '').trim()).filter(Boolean).join(' · ');
                const photo = await getAdminPetDisplayUrl(pet);
                const note = (label, text) => (String(text || '').trim() ? `<div class="pis-hh-note"><span>${label}</span><p>${esc(String(text).trim())}</p></div>` : '');
                return `<article class="admin-client-pet-card pis-hh-pet">
                    <div class="pis-hh-pet-top">
                        <img src="${esc(photo)}" alt="${esc(name)}" class="admin-client-pet-photo" data-admin-pet-photo>
                        <div class="pis-hh-pet-copy"><strong>${esc(name)}</strong>${line ? `<span>${esc(line)}</span>` : ''}${petFacts(pet) ? `<span class="pis-hh-pet-facts">${esc(petFacts(pet))}</span>` : ''}</div>
                    </div>
                    ${note('Feeding Notes', pet.feeding_notes)}${note('Care Notes', pet.care_notes)}
                </article>`;
            } catch (error) { console.warn('Pet card:', error); return original.apply(this, arguments); }
        };
    }
    function petFacts(pet) {
        const text = String(pet.birthday || '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
        const [y, m, d] = text.split('-').map(Number);
        const [ty, tm, td] = today().split('-').map(Number);
        const birthday = new Date(Date.UTC(2000, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
        let months = (ty - y) * 12 + (tm - m) - (td < d ? 1 : 0);
        if (months < 0) return `Birthday ${birthday}`;
        const years = Math.floor(months / 12);
        const age = years >= 1 ? `${years} ${years === 1 ? 'year' : 'years'} old` : months >= 1 ? `${months} ${months === 1 ? 'month' : 'months'} old` : 'Under a month old';
        return `${age} · Birthday ${birthday}`;
    }
    if (typeof window.buildAdminClientVisitItem === 'function') {
        const original = window.buildAdminClientVisitItem;
        window.buildAdminClientVisitItem = function (visit) {
            if (!document.getElementById('pis-hh')) return original.apply(this, arguments);
            try {
                const status = lower(visit.status || 'scheduled');
                const [label, kind, cls] = status === 'completed' ? ['Completed', 'done', 'admin-client-activity-completed']
                    : status === 'checked_in' ? ['In Progress', 'live', 'admin-client-activity-live'] : ['Scheduled', 'scheduled', ''];
                const d = dateOf(visit.visit_date);
                const otherYear = d.getFullYear() !== dateOf(today()).getFullYear();
                const sub = [otherYear ? String(d.getFullYear()) : '', String(visit.time_window || '').replace(/\s*-\s*/, ' – '), money(visit.price)].filter(Boolean).join(' · ');
                return `<article class="admin-client-activity-item pis-hh-visit ${cls}">
                    <button type="button" class="pis-hh-visit-open" data-hh-visit="${esc(String(visit.id))}">
                        <span class="pis-hh-date"><span>${esc(d.toLocaleDateString('en-US', { month: 'short' }))}</span><strong>${d.getDate()}</strong></span>
                        <span class="pis-hh-visit-text"><strong>${esc(visit.service_name || visit.service_type || 'Service')}</strong><span>${esc(sub)}</span></span>
                        <span class="admin-client-activity-status pis-hh-pill" data-kind="${kind}">${label}</span>
                    </button>
                </article>`;
            } catch (error) { console.warn('Visit row:', error); return original.apply(this, arguments); }
        };
    }

    if (typeof window.openAdminClientHousehold === 'function') {
        const original = window.openAdminClientHousehold;
        window.openAdminClientHousehold = async function (clientId) {
            const pending = original.apply(this, arguments);
            try { sync(clientId, true); } catch (error) { console.warn('Household layout:', error); }
            const result = await pending;
            try { sync(clientId); } catch (error) { console.warn('Household layout:', error); }
            return result;
        };
    }
    try { ensureHousehold(); } catch (error) { console.warn('Household layout:', error); }

    const PisClients = window.PisClients = { render, sync, openPicker, closePicker, contactUrl, clientStatus, follow: null, phoneName };
    if (originalRender && typeof allProfiles !== 'undefined' && allProfiles.length) void render();
})();
