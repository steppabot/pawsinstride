// ========================================
// OWNER + TEAM APP POLISH (phones)
// ========================================
// A tidier look for seven things, on phone-sized screens (computers only get the pricing colors).
// Nothing here changes what the app does or saves: the old parts keep working exactly
// as before and are restyled, re-ordered or mirrored into a more compact card.
//
// 1. TOP HEADER. Shorter. "Operations Portal" is gone; the screen name is bigger with a
//    useful line under it (the date, services today, clients, unread messages). Log Out
//    moves into a small menu behind your photo/initials (My Profile, Log Out) and to the
//    bottom of More. The ADMIN / TEAM tag stays.
// 2. HOME. One "Today" card (visits done, a progress bar, in progress, visit time, miles)
//    instead of four tiles. Today's Route: stops first, then the route map, drive time /
//    distance / leave-by, and the buttons. Boarding guests staying now get a row. The Financial
//    Snapshot is one compact card.
// 3. SCHEDULE. No intro card; "N services this month" sits under the month name. Compact
//    calendar with highlighted days (green = past days with services, blue = upcoming),
//    and the day's visits as one grouped list.
// 4. MORE. Your profile first; Business Tools as one list with the status on the right;
//    lifetime stats in one card; Log Out at the bottom.
// 5. THE SCREENS BEHIND MORE. Edit Profile opens as its own page (it used to stretch the More
//    screen), like Push Notifications, Services & Pricing and the Website Banner; all four share
//    one header, the same cards and rounded-rectangle buttons (no pill buttons), and switches.
//    Lines that used to wrap mid-phrase (the Effective Rate detail, the Longest Walk record)
//    put each piece on its own line.
// 6. SERVICE COLORS. Each visit row on the Schedule has its colored edge again (walks blue,
//    drop-ins teal, sitting pink, meet and greets purple, boarding orange), and the Services &
//    Pricing cards carry the same colors, on computers too.
// 7. ONE BLUE. Everything filled (the corner photo, the Today card, a default profile photo,
//    Save buttons, switches that are on) uses the same blue; quiet buttons are white with a
//    thin border and blue words.
// ========================================
(() => {
    'use strict';
    if (window.PisPolish || !document.querySelector('.admin-dashboard-header') || !document.querySelector('.admin-app-nav')) return;

    const esc = value => (typeof escapeHtml === 'function' ? escapeHtml(String(value ?? ''))
        : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
    const $ = (sel, root = document) => root.querySelector(sel);
    const text = sel => ($(sel)?.textContent || '').replace(/\s+/g, ' ').trim();
    const isPhone = () => window.matchMedia('(max-width: 700px)').matches;
    const svg = (inner, size = 20, width = 2) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
    const ICON = {
        user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.9-3.6 3.5-5.5 7-5.5s6.100 1.900 7 5.500"/>',
        logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
        moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
        chev: '<path d="M9 6l6 6-6 6"/>'
    };
    document.body.classList.add('pis-polish');

    // ========================================
    // LOOK
    // ========================================
    const css = document.createElement('style');
    css.id = 'pis-polish-css';
    css.textContent = `
    .pis-head-sub, .pis-head-avatar, .pis-head-menu, .pis-head-menu-close, .pis-sec-label, .pis-today, .pis-boarding-now, .pis-month-pill, .pis-tool-status, .pis-more-logout, .pis-more-version, .pis-route-note { display: none; }
    /* >>> always on >>> */
    /* Services & Pricing: a colored edge per service, the same colors as the Schedule
       (walks blue, drop-ins teal, sitting pink, boarding orange). Phones and computers. */
    body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card { position: relative; overflow: hidden; padding-left: 25px; }
    body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: #46617d; }
    body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card[data-pricing-key$="-minute"]::before { background: linear-gradient(180deg, #1f63b8 0 50%, #14c0dc 50% 100%); }
    body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card[data-pricing-key^="pet-sitting"]::before { background: #b8336a; }
    body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card[data-pricing-key="boarding"]::before { background: #c0610c; }
    /* <<< always on <<< */
    @media (max-width: 700px) {
        /* ---------- top header ---------- */
        body.pis-polish .admin-dashboard-header { display: flex !important; align-items: center !important; gap: 10px !important; min-height: 0 !important;
            padding: max(8px, env(safe-area-inset-top, 0px)) 12px 9px 14px !important; border-radius: 0 0 20px 20px !important; }
        body.pis-polish .admin-dashboard-brand { display: flex !important; align-items: center !important; gap: 12px !important; flex: 1 1 auto; min-width: 0; }
        body.pis-polish .admin-dashboard-logo { width: 46px !important; height: 46px !important; flex: 0 0 46px; object-fit: contain; margin: 0 !important; }
        body.pis-polish .admin-dashboard-title { min-width: 0; margin: 0 !important; padding: 0 !important; border: 0 !important; }
        body.pis-polish .admin-portal-label { display: none !important; }
        body.pis-polish .admin-title-row { display: flex !important; align-items: center !important; gap: 8px !important; margin: 0 !important; }
        body.pis-polish #admin-screen-title { margin: 0 !important; font-size: 22px !important; line-height: 26px !important; font-weight: 800 !important; color: #13233a !important; white-space: nowrap; }
        body.pis-polish .admin-role-badge { flex: 0 0 auto; }
        body.pis-polish .pis-head-sub { display: block; margin: 0 !important; font-size: 12.5px; line-height: 16px; font-weight: 600; color: #5b6b80; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        body.pis-polish .admin-dashboard-header-actions { flex: 0 0 auto; margin: 0 !important; }
        body.pis-polish #admin-logout-button { display: none !important; }
        body.pis-polish .pis-head-avatar { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin: 0; padding: 0; overflow: hidden; border-radius: 50%;
            border: 2px solid #fff; box-shadow: 0 0 0 1.5px #cfe3f5; background: linear-gradient(135deg, #1f74be, #17609f); color: #fff; font-family: inherit; font-size: 15px; font-weight: 800;
            cursor: pointer; -webkit-tap-highlight-color: transparent; }
        body.pis-polish .pis-head-avatar[aria-expanded="true"] { box-shadow: 0 0 0 3px #8fc4ee; }
        .pis-head-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
        body.pis-polish .pis-head-menu-close { display: block; position: fixed; inset: 0; z-index: 1290; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; border-radius: 0; background: rgba(19, 35, 58, .08); cursor: default; }
        body.pis-polish .pis-head-menu { display: block; position: fixed; right: 12px; z-index: 1300; margin: 0 !important; padding: 0 !important; width: 252px; max-width: calc(100vw - 24px); background: #fff; border: 1px solid #dce5ef; border-radius: 16px;
            overflow: hidden; box-shadow: 0 14px 34px rgba(19, 35, 58, .18); outline: none; }
        body.pis-polish .pis-head-menu[hidden], body.pis-polish .pis-head-menu-close[hidden] { display: none; }
        .pis-head-menu-who { padding: 12px 14px 11px; }
        .pis-head-menu-who strong { display: block; font-size: 16px; line-height: 20px; font-weight: 800; color: #13233a; overflow-wrap: anywhere; }
        .pis-head-menu-who span { display: block; font-size: 13px; line-height: 17px; font-weight: 600; color: #5b6b80; overflow-wrap: anywhere; }
        .pis-head-menu button.pis-head-menu-item { display: flex; align-items: center; gap: 11px; width: 100%; height: 48px; margin: 0; padding: 0 14px; box-sizing: border-box; border: 0; border-top: 1px solid #e4ebf3;
            border-radius: 0; background: #fff; color: #13233a; font-family: inherit; font-size: 15.5px; font-weight: 800; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .pis-head-menu button.pis-head-menu-item.is-out { color: #b3261e; }

        /* ---------- shared: a small label above a card ---------- */
        body.pis-polish .pis-sec-label { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin: 6px 4px -4px; }
        body.pis-polish .pis-sec-label[hidden] { display: none; }
        .pis-sec-label span { font-size: 11.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #5b6b80; }
        .pis-sec-label em { font-style: normal; font-size: 12.5px; font-weight: 700; color: #5b6b80; }

        /* ---------- HOME ---------- */
        body.pis-polish #admin-screen-home .admin-home-intro { display: none !important; }
        body.pis-polish #admin-screen-home, body.pis-polish #admin-screen-schedule { padding: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important; }
        body.pis-polish #admin-home-dashboard { display: flex !important; flex-direction: column; gap: 12px !important; padding: 0 !important; margin: 0 !important; }
        body.pis-polish #admin-home-dashboard > section { margin: 0 !important; }
        /* Today */
        body.pis-polish .admin-today-summary { padding: 0 !important; border: 0 !important; background: none !important; box-shadow: none !important; }
        body.pis-polish .admin-today-summary > .admin-home-section-heading, body.pis-polish .admin-today-summary > .admin-summary-grid { display: none !important; }
        body.pis-polish .pis-today { display: block; border-radius: 18px; padding: 16px 16px 14px; background: linear-gradient(135deg, #1f74be 0%, #155a96 100%); box-shadow: 0 10px 22px rgba(23, 96, 159, .22); color: #fff; }
        .pis-today-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .pis-today-top strong { font-size: 21px; line-height: 26px; font-weight: 800; color: #fff; }
        .pis-today-live { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; background: rgba(9, 40, 72, .34); border-radius: 999px; padding: 4px 9px; color: #fff; }
        .pis-today-live i { width: 7px; height: 7px; border-radius: 50%; background: #7cf0a9; }
        .pis-today p { margin: 1px 0 0 !important; font-size: 13.5px; line-height: 18px; font-weight: 600; color: #fff; }
        .pis-today-bar { height: 8px; border-radius: 999px; background: rgba(255, 255, 255, .2); margin: 12px 0 13px; overflow: hidden; }
        .pis-today-bar i { display: block; height: 100%; min-width: 8px; border-radius: 999px; background: #fff; transition: width .3s ease; }
        .pis-today-stats { display: flex; align-items: stretch; }
        .pis-today-stats > span { flex: 1 1 0; min-width: 0; text-align: center; font-size: 11.5px; line-height: 15px; font-weight: 700; color: #fff; }
        .pis-today-stats > span + span { border-left: 1px solid rgba(255, 255, 255, .22); }
        .pis-today-stats b { display: block; font-size: 19px; line-height: 24px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        /* Today's Route: stops, map, facts, buttons */
        body.pis-polish:not(.pis-employee) #admin-best-route { display: flex !important; }
        body.pis-polish #admin-best-route { flex-direction: column; gap: 0 !important; padding: 0 !important; overflow: hidden; background: #fff !important; border: 1px solid #dce5ef !important;
            border-radius: 18px !important; box-shadow: 0 6px 18px rgba(19, 35, 58, .05) !important; }
        body.pis-polish:not(.pis-employee) #admin-best-route[hidden] { display: none !important; }
        body.pis-polish #admin-best-route > .admin-home-section-heading { display: none !important; }
        body.pis-polish #admin-best-route > .pis-route-note { order: 0; display: block; margin: 0 !important; padding: 9px 14px; font-size: 12.5px; line-height: 16px; font-weight: 600; color: #5b6b80; background: #f6fafd; border-bottom: 1px solid #e4ebf3; }
        body.pis-polish #admin-best-route > .pis-route-note:empty { display: none; }
        body.pis-polish #admin-best-route:has(.admin-route-empty) > .pis-route-note { display: none; }
        body.pis-polish .admin-route-stop-list > .admin-route-empty { min-height: 0 !important; margin: 0 !important; padding: 14px !important; border: 0 !important; border-radius: 0 !important; background: #fff !important; }
        body.pis-polish #admin-best-route > .admin-route-workspace { order: 1; display: block !important; margin: 0 !important; padding: 0 !important; gap: 0 !important; }
        body.pis-polish #admin-best-route > .admin-route-summary { order: 2; display: flex !important; margin: 0 !important; padding: 0 !important; gap: 0 !important; border-top: 1px solid #e4ebf3; }
        body.pis-polish #admin-best-route > .admin-route-actions { order: 3; display: flex !important; gap: 8px !important; margin: 0 !important; padding: 12px !important; border-top: 1px solid #e4ebf3; }
        body.pis-polish .admin-route-stops-panel { margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
        body.pis-polish .admin-route-panel-heading { display: none !important; }
        body.pis-polish .admin-route-stop-list { display: block !important; margin: 0 !important; padding: 0 !important; gap: 0 !important; }
        /* a stop: name with its time on the same line, what it is, then the street and the city on lines of their own (nothing is cut off) */
        body.pis-polish .admin-route-stop { display: grid !important; grid-template-columns: 32px minmax(0, 1fr) auto !important; column-gap: 11px !important; row-gap: 1px !important; align-items: start !important; align-content: center;
            min-height: 66px; margin: 0 !important; padding: 11px 12px !important; box-sizing: border-box; border: 0 !important; border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; background: #fff !important; box-shadow: none !important; }
        body.pis-polish .admin-route-stop:first-child { border-top: 0 !important; }
        body.pis-polish .admin-route-stop-number { grid-column: 1; grid-row: 1 / span 2; align-self: center; display: inline-flex !important; align-items: center; justify-content: center; width: 32px !important; height: 32px !important; border-radius: 10px !important;
            background: #b85a0a !important; color: #fff !important; font-size: 14px !important; font-weight: 800 !important; box-shadow: none !important; }
        body.pis-polish .admin-route-stop-copy { display: contents !important; }
        body.pis-polish .admin-route-stop-copy > strong { grid-column: 2; grid-row: 1; display: block; min-width: 0; margin: 0 !important; font-size: 16px !important; line-height: 20px !important; font-weight: 800 !important; color: #13233a !important;
            white-space: normal !important; overflow: visible !important; text-overflow: clip !important; overflow-wrap: anywhere; }
        body.pis-polish .admin-route-stop-copy > span { grid-column: 2 / -1; grid-row: 2; display: block; min-width: 0; margin: 0 !important; font-size: 13.5px !important; line-height: 18px !important; font-weight: 600 !important; color: #5b6b80 !important;
            white-space: normal !important; overflow: visible !important; text-overflow: clip !important; overflow-wrap: anywhere; }
        body.pis-polish .admin-route-stop-copy .pis-stop-what, body.pis-polish .admin-route-stop-copy .pis-stop-where, body.pis-polish .admin-route-stop-copy .pis-stop-street, body.pis-polish .admin-route-stop-copy .pis-stop-city { display: block; margin: 0 !important; font-size: inherit !important; line-height: inherit !important;
            font-weight: inherit !important; color: inherit !important; white-space: normal !important; overflow: visible !important; text-overflow: clip !important; }
        body.pis-polish .admin-route-stop-copy .pis-stop-dot { display: none; }
        body.pis-polish .admin-route-stop-time { grid-column: 3; grid-row: 1; align-self: start; max-width: none !important; margin: 0 !important; padding: 0 !important; font-size: 13px !important; line-height: 20px !important; font-weight: 800 !important;
            color: #1f5fbf !important; text-align: right; white-space: nowrap !important; background: none !important; border: 0 !important; }
        body.pis-polish .admin-route-map { margin: 0 !important; border: 0 !important; border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; min-height: 0 !important; height: 200px !important; overflow: hidden; }
        body.pis-polish .admin-route-map:has(> .admin-route-map-placeholder) { height: 104px !important; }
        body.pis-polish .admin-route-map-placeholder { height: 100% !important; min-height: 0 !important; padding: 10px !important; box-sizing: border-box; border: 0 !important; border-radius: 0 !important; gap: 4px !important; background: #f6fafd !important; }
        body.pis-polish .admin-route-map-icon { width: 32px !important; height: 32px !important; }
        body.pis-polish .admin-route-summary-item { flex: 1 1 0; min-width: 0; margin: 0 !important; padding: 9px 4px !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important;
            text-align: center; display: flex !important; flex-direction: column-reverse; justify-content: flex-end; gap: 0 !important; }
        body.pis-polish .admin-route-summary-item + .admin-route-summary-item { border-left: 1px solid #e4ebf3 !important; }
        body.pis-polish .admin-route-summary-item:first-child { display: none !important; }
        body.pis-polish .admin-route-summary-item:nth-child(2) { border-left: 0 !important; }
        body.pis-polish .admin-route-summary-item > span { font-size: 11px !important; line-height: 15px !important; font-weight: 700 !important; letter-spacing: 0 !important; text-transform: none !important; color: #5b6b80 !important; }
        body.pis-polish .admin-route-summary-item > strong { font-size: 15.5px !important; line-height: 20px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish .admin-route-departure > strong { color: #8f4505 !important; }
        body.pis-polish .admin-route-summary-item > small { order: -1; font-size: 10.5px !important; line-height: 13px !important; font-weight: 600 !important; color: #8a4b08 !important; }
        body.pis-polish .admin-route-actions > button { flex: 1 1 0; min-height: 46px !important; margin: 0 !important; border-radius: 12px !important; font-size: 14.5px !important; font-weight: 800 !important; }
        /* Boarding Now */
        body.pis-polish .pis-boarding-now { display: block; padding: 0 !important; overflow: hidden; background: #fff; border: 1px solid #dce5ef; border-radius: 18px; box-shadow: 0 6px 18px rgba(19, 35, 58, .05); }
        body.pis-polish .pis-boarding-now[hidden] { display: none; }
        .pis-boarding-now button { display: flex; align-items: center; gap: 11px; width: 100%; min-height: 66px; margin: 0; padding: 9px 12px; box-sizing: border-box; border: 0; border-top: 1px solid #e4ebf3; border-radius: 0;
            background: #fff; color: #13233a; font-family: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .pis-boarding-now button:first-child { border-top: 0; }
        .pis-bn-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex: 0 0 44px; border-radius: 14px; background: #fff1df; color: #b85a0a; }
        .pis-bn-text { flex: 1 1 auto; min-width: 0; display: block; }
        .pis-bn-text strong, .pis-bn-text span { display: block; overflow-wrap: anywhere; }
        .pis-bn-text strong { font-size: 16px; line-height: 20px; font-weight: 800; }
        .pis-bn-text span { font-size: 13.5px; line-height: 18px; font-weight: 600; color: #5b6b80; }
        .pis-bn-until { flex: 0 0 auto; font-size: 12.5px; font-weight: 800; color: #8f4505; background: #fff1df; border-radius: 999px; padding: 4px 9px; white-space: nowrap; }
        .pis-boarding-now svg.pis-bn-chev { flex: 0 0 auto; color: #9aa9ba; }
        /* Financial Snapshot */
        body.pis-polish #admin-financial-snapshot { padding: 0 !important; overflow: hidden; background: #fff !important; border: 1px solid #dce5ef !important; border-radius: 18px !important; box-shadow: 0 6px 18px rgba(19, 35, 58, .05) !important; }
        body.pis-polish #admin-financial-snapshot > .admin-home-section-heading { display: none !important; }
        body.pis-polish .admin-financial-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 0 !important; margin: 0 !important; padding: 0 !important; }
        body.pis-polish .admin-financial-card { margin: 0 !important; padding: 13px 8px 12px !important; min-height: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important;
            text-align: center; display: block !important; overflow: visible !important; }
        body.pis-polish .admin-financial-card::before, body.pis-polish .admin-financial-card::after { display: none !important; }
        body.pis-polish .admin-financial-card + .admin-financial-card { border-left: 1px solid #e4ebf3 !important; }
        body.pis-polish .admin-financial-card-label { display: block; font-size: 11px !important; font-weight: 800 !important; letter-spacing: .08em !important; text-transform: uppercase; color: #5b6b80 !important; }
        body.pis-polish .admin-financial-card-value { display: block; margin: 2px 0 0 !important; font-size: 21px !important; line-height: 27px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish .admin-financial-card-detail { display: block; margin: 0 !important; font-size: 11.5px !important; line-height: 15px !important; font-weight: 600 !important; color: #627184 !important; }
        body.pis-polish .admin-financial-card-featured { grid-column: 1 / -1; border-left: 0 !important; border-top: 1px solid #e4ebf3 !important; padding: 10px 14px !important; text-align: left;
            display: grid !important; grid-template-columns: 1fr auto; column-gap: 12px; row-gap: 4px; align-items: center; }
        body.pis-polish .admin-financial-card-featured .admin-financial-card-label { grid-column: 1; grid-row: 1; }
        body.pis-polish .admin-financial-card-featured .admin-financial-card-value { grid-column: 2; grid-row: 1; margin: 0 !important; }
        body.pis-polish .admin-financial-card-featured .admin-financial-card-detail { grid-column: 1 / -1; grid-row: 2; }
        body.pis-polish #admin-financial-snapshot > .pfin-open-btn { display: flex !important; align-items: center; justify-content: space-between; width: 100% !important; min-height: 48px !important; margin: 0 !important; padding: 0 14px !important;
            box-sizing: border-box; border: 0 !important; border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; background: #f8fbfe !important; color: #1b6fb3 !important; font-size: 14.5px !important; font-weight: 800 !important; box-shadow: none !important; }

        /* ---------- SCHEDULE ---------- */
        body.pis-polish #admin-screen-schedule .admin-calendar-section { padding: 0 !important; margin: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important; display: flex; flex-direction: column; gap: 12px; }
        body.pis-polish .admin-calendar-section-heading { display: none !important; }
        body.pis-polish .admin-service-calendar { margin: 0 !important; padding: 10px !important; background: #fff !important; border: 1px solid #dce5ef !important; border-radius: 18px !important; box-shadow: 0 6px 18px rgba(19, 35, 58, .05) !important; }
        body.pis-polish .admin-service-calendar .upcoming-calendar-header { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 8px; margin: 0 0 8px !important; padding: 0 2px !important; }
        body.pis-polish .admin-service-calendar .calendar-nav-button { width: 44px !important; height: 44px !important; flex: 0 0 44px; border-radius: 12px !important; }
        body.pis-polish .pis-month { text-align: center; min-width: 0; }
        body.pis-polish #admin-calendar-month-label { display: block; font-size: 17px !important; line-height: 21px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish .pis-month-pill { display: inline-block; margin-top: 3px; font-size: 12.5px; line-height: 16px; font-weight: 800; color: #17609f; background: #eaf4fd; border: 1px solid #bfddf5; border-radius: 999px; padding: 2px 10px; }
        body.pis-polish .admin-service-calendar .upcoming-calendar-weekdays { margin: 0 0 4px !important; gap: 3px !important; }
        body.pis-polish .admin-service-calendar .upcoming-calendar-weekdays span { font-size: 11px !important; font-weight: 800 !important; color: #627184 !important; }
        body.pis-polish #admin-calendar-grid { gap: 3px !important; }
        body.pis-polish #admin-calendar-grid .admin-calendar-day { position: relative; display: flex !important; flex-direction: column; align-items: center !important; justify-content: center !important; gap: 2px !important; height: 50px !important;
            min-height: 0 !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box; border-radius: 12px !important; border: 1px solid #e4ebf3 !important; background: #fff !important; box-shadow: none !important; }
        body.pis-polish #admin-calendar-grid .upcoming-day-number { position: static !important; font-size: 15px !important; line-height: 18px !important; font-weight: 600 !important; color: #5b6b80 !important; }
        body.pis-polish #admin-calendar-grid .upcoming-service-count { position: static !important; display: inline-flex !important; align-items: center; justify-content: center; min-width: 18px !important; width: auto !important; height: 15px !important;
            margin: 0 !important; padding: 0 4px !important; box-sizing: border-box; border: 0 !important; border-radius: 999px !important; font-size: 10.5px !important; line-height: 15px !important; font-weight: 800 !important;
            background: #17609f !important; color: #fff !important; box-shadow: none !important; }
        body.pis-polish #admin-calendar-grid .upcoming-calendar-booked { background: #ddecfb !important; border-color: #a9cdee !important; }
        body.pis-polish #admin-calendar-grid .upcoming-calendar-booked .upcoming-day-number { font-weight: 800 !important; color: #0f3f6b !important; }
        body.pis-polish #admin-calendar-grid .upcoming-calendar-completed { background: #dff3e6 !important; border-color: #a9d9ba !important; }
        body.pis-polish #admin-calendar-grid .upcoming-calendar-completed .upcoming-day-number { color: #0f4d27 !important; }
        body.pis-polish #admin-calendar-grid .upcoming-calendar-completed .upcoming-service-count { background: #17733a !important; }
        body.pis-polish #admin-calendar-grid .upcoming-calendar-today:not(.upcoming-calendar-selected) { box-shadow: 0 0 0 2px #2b8bd6 inset !important; }
        body.pis-polish #admin-calendar-grid .upcoming-calendar-selected { background: linear-gradient(135deg, #1f74be, #17609f) !important; border-color: #17609f !important; box-shadow: 0 4px 10px rgba(23, 96, 159, .28) !important; }
        body.pis-polish #admin-calendar-grid .upcoming-calendar-selected .upcoming-day-number { font-weight: 800 !important; color: #fff !important; }
        body.pis-polish #admin-calendar-grid .upcoming-calendar-selected .upcoming-service-count { background: #fff !important; color: #17609f !important; }
        /* the day */
        body.pis-polish .admin-selected-day { margin: 0 !important; padding: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important; }
        body.pis-polish .admin-selected-day-heading { display: flex !important; flex-direction: row !important; align-items: baseline !important; justify-content: space-between !important; gap: 10px; margin: 6px 4px 8px !important; padding: 0 !important; border: 0 !important; }
        body.pis-polish .admin-selected-day-eyebrow { display: none !important; }
        body.pis-polish #admin-selected-date { margin: 0 !important; font-size: 11.5px !important; line-height: 16px !important; font-weight: 800 !important; letter-spacing: .1em; text-transform: uppercase; color: #5b6b80 !important; }
        body.pis-polish #admin-selected-service-count { padding: 0 !important; border: 0 !important; background: none !important; font-size: 12.5px !important; font-weight: 700 !important; color: #5b6b80 !important; }
        body.pis-polish #admin-day-services > .empty-upcoming-message { margin: 0 !important; padding: 18px 16px !important; text-align: center; font-size: 14.5px !important; line-height: 20px !important; font-weight: 600 !important;
            color: #5b6b80 !important; background: #fff !important; border: 1px dashed #c9d8e8 !important; border-radius: 18px !important; }
        body.pis-polish #admin-day-services:has(> .admin-service-card) { overflow: hidden; background: #fff; border: 1px solid #dce5ef; border-radius: 18px; box-shadow: 0 6px 18px rgba(19, 35, 58, .05); }
        body.pis-polish #admin-day-services > .pis-group { display: flex !important; align-items: center; gap: 7px; margin: 0 !important; padding: 9px 14px 7px !important; background: #f6fafd; border-top: 1px solid #e4ebf3; border-bottom: 1px solid #e4ebf3; }
        body.pis-polish #admin-day-services > .pis-group:first-child { border-top: 0; }
        body.pis-polish #admin-day-services > .admin-service-card.pis-compact { margin: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: #fff !important; }
        body.pis-polish #admin-day-services > .admin-service-card.pis-compact + .admin-service-card.pis-compact { border-top: 1px solid #e4ebf3 !important; }
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row button.pis-row-action { min-height: 44px !important; }
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding: 12px 12px 12px 14px !important; }

        /* ---------- MORE ---------- */
        body.pis-polish #admin-screen-more { display: flex !important; flex-direction: column; gap: 12px; padding: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important; }
        body.pis-polish #admin-screen-more[hidden] { display: none !important; }
        body.pis-polish #admin-screen-more > * { margin: 0 !important; }
        body.pis-polish #admin-screen-more > .admin-more-intro { display: none !important; }
        body.pis-polish #admin-screen-more > .admin-profile-section { order: 1; }
        body.pis-polish #admin-screen-more > .admin-more-tools { order: 2; }
        body.pis-polish #admin-screen-more > #pis-lifetime-stats { order: 4; }
        body.pis-polish #admin-screen-more > .pis-more-logout { order: 9; }
        /* profile */
        body.pis-polish .admin-profile-section { display: flex !important; flex-direction: column; padding: 0 !important; overflow: hidden; background: #fff !important; border: 1px solid #dce5ef !important; border-radius: 18px !important; box-shadow: 0 6px 18px rgba(19, 35, 58, .05) !important; }
        body.pis-polish .admin-profile-section > .household-section-header { order: 3; display: block !important; margin: 0 !important; padding: 0 !important; border: 0 !important; }
        body.pis-polish .admin-profile-section > .household-section-header > div { display: none !important; }
        body.pis-polish #admin-edit-profile-button { display: flex; align-items: center; justify-content: space-between; width: 100% !important; min-height: 48px !important; margin: 0 !important; padding: 0 14px !important; box-sizing: border-box;
            border: 0 !important; border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; background: #f8fbfe !important; color: #1b6fb3 !important; font-size: 14.5px !important; font-weight: 800 !important; box-shadow: none !important; }
        body.pis-polish #admin-edit-profile-button::after { content: "›"; font-size: 22px; line-height: 1; font-weight: 400; color: #9aa9ba; }
        body.pis-polish .admin-profile-section:has(#admin-profile-form-panel:not([style*="none"])) > .household-section-header { display: none !important; }
        body.pis-polish #admin-profile-display { order: 1; }
        body.pis-polish #admin-profile-form-panel { order: 2; margin: 0 !important; border-radius: 0 !important; border-width: 1px 0 0 !important; box-shadow: none !important; }
        body.pis-polish #admin-profile-display .household-profile-top { display: flex !important; align-items: center !important; gap: 13px !important; min-height: 84px; margin: 0 !important; padding: 12px 14px !important; box-sizing: border-box; border: 0 !important; }
        body.pis-polish #admin-profile-display .household-profile-summary { min-width: 0; }
        body.pis-polish #admin-profile-avatar { width: 58px !important; height: 58px !important; flex: 0 0 58px; }
        body.pis-polish #admin-profile-avatar .client-profile-initials { font-size: 20px !important; }
        body.pis-polish #admin-display-name { margin: 0 !important; font-size: 19px !important; line-height: 23px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish #admin-display-email, body.pis-polish #admin-display-phone { margin: 0 !important; font-size: 13.5px !important; line-height: 18px !important; font-weight: 600 !important; color: #5b6b80 !important; overflow-wrap: anywhere; }
        body.pis-polish #admin-profile-display .household-profile-grid { display: block !important; margin: 0 !important; padding: 0 !important; gap: 0 !important; }
        body.pis-polish #admin-profile-display .household-detail-card { display: flex !important; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; margin: 0 !important; padding: 8px 14px !important; box-sizing: border-box;
            border: 0 !important; border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; background: #fff !important; box-shadow: none !important; }
        body.pis-polish #admin-profile-display .household-detail-label { flex: 0 0 auto; margin: 0 !important; font-size: 14px !important; font-weight: 600 !important; letter-spacing: 0 !important; text-transform: none !important; color: #5b6b80 !important; }
        body.pis-polish #admin-profile-display .household-detail-value { min-width: 0; margin: 0 !important; font-size: 14px !important; line-height: 19px !important; font-weight: 700 !important; color: #13233a !important; text-align: right; }
        /* business tools: one list */
        body.pis-polish .admin-more-tools { padding: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important; }
        body.pis-polish .admin-more-section-heading { margin: 6px 4px 8px !important; padding: 0 !important; }
        body.pis-polish .admin-more-section-heading .admin-screen-eyebrow, body.pis-polish .admin-more-section-heading p { display: none !important; }
        body.pis-polish .admin-more-section-heading h2 { margin: 0 !important; font-size: 11.5px !important; line-height: 16px !important; font-weight: 800 !important; letter-spacing: .1em; text-transform: uppercase; color: #5b6b80 !important; }
        body.pis-polish .admin-more-tool-grid { display: flex !important; flex-direction: column; overflow: hidden; margin: 0 !important; padding: 0 !important; gap: 0 !important; background: #fff; border: 1px solid #dce5ef; border-radius: 18px; box-shadow: 0 6px 18px rgba(19, 35, 58, .05); }
        body.pis-polish:not(.pis-employee) .admin-more-tool-grid > .admin-more-tool-card, body.pis-polish.pis-employee .admin-more-tool-grid > #admin-enable-push-notifications { display: flex !important; }
        body.pis-polish:not(.pis-employee) .admin-more-tool-grid > .admin-more-tool-card[hidden] { display: none !important; }
        body.pis-polish .admin-more-tool-grid > .pis-privacy-card { order: 9; }
        body.pis-polish .admin-more-tool-grid > .admin-more-tool-card { align-items: center !important; gap: 12px !important; width: 100% !important; min-height: 58px !important; margin: 0 !important; padding: 8px 12px !important;
            box-sizing: border-box; border: 0 !important; border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; background: #fff !important; box-shadow: none !important; text-align: left; text-decoration: none; }
        body.pis-polish .admin-more-tool-grid > .admin-more-tool-card:first-child { border-top: 0 !important; }
        body.pis-polish .admin-more-tool-icon { width: 38px !important; height: 38px !important; flex: 0 0 38px; border-radius: 11px !important; background: #e6f1fc !important; color: #1b6fb3 !important; box-shadow: none !important; }
        body.pis-polish #admin-open-services-pricing .admin-more-tool-icon { background: #e1f3e7 !important; color: #17733a !important; }
        body.pis-polish #admin-open-site-banner .admin-more-tool-icon { background: #fff1df !important; color: #b85a0a !important; }
        body.pis-polish .pis-privacy-card .admin-more-tool-icon { background: #eef2f6 !important; color: #4a5a6e !important; }
        body.pis-polish .admin-more-tool-icon.pis-appicon-thumb { background: none !important; overflow: hidden; }
        body.pis-polish .admin-more-tool-icon.pis-appicon-thumb img { width: 100% !important; height: 100% !important; object-fit: cover; display: block; }
        body.pis-polish .admin-more-tool-icon svg { width: 20px !important; height: 20px !important; }
        body.pis-polish .admin-more-tool-copy { flex: 1 1 auto; min-width: 0; display: block !important; }
        body.pis-polish .admin-more-tool-copy > strong { display: block; font-size: 16px !important; line-height: 20px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish .admin-more-tool-copy > span, body.pis-polish .admin-more-tool-copy > small { display: none !important; }
        body.pis-polish .admin-more-tool-card.pis-needs-look .admin-more-tool-copy > span, body.pis-polish .admin-more-tool-card.pis-needs-look .admin-more-tool-copy > small { display: block !important; margin: 1px 0 0 !important;
            font-size: 12.5px !important; line-height: 16px !important; font-weight: 600 !important; color: #8a4b08 !important; background: none !important; border: 0 !important; padding: 0 !important; }
        body.pis-polish .pis-tool-status { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; max-width: 132px; font-style: normal; font-size: 13.5px; font-weight: 700; color: #5b6b80; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        body.pis-polish .pis-tool-status:empty { display: none; }
        body.pis-polish .pis-tool-status.is-good { color: #17733a; }
        body.pis-polish .pis-tool-status.is-warn { color: #a8510a; }
        .pis-tool-status.is-good::before, .pis-tool-status.is-warn::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex: 0 0 auto; }
        body.pis-polish .admin-more-tool-arrow { flex: 0 0 auto; color: #9aa9ba !important; font-size: 22px !important; line-height: 1 !important; }
        /* lifetime stats */
        body.pis-polish #pis-lifetime-stats { padding: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important; }
        body.pis-polish #pis-lifetime-stats .pls-head { margin: 6px 4px 8px !important; padding: 0 !important; }
        body.pis-polish #pis-lifetime-stats .pls-eyebrow { display: none !important; }
        body.pis-polish #pis-lifetime-stats .pls-head h3 { margin: 0 !important; font-size: 11.5px !important; line-height: 16px !important; font-weight: 800 !important; letter-spacing: .1em; text-transform: uppercase; color: #5b6b80 !important; }
        body.pis-polish #pis-lifetime-stats .pls-body { overflow: hidden; margin: 0 !important; padding: 0 !important; background: #fff; border: 1px solid #dce5ef; border-radius: 18px; box-shadow: 0 6px 18px rgba(19, 35, 58, .05); }
        body.pis-polish #pis-lifetime-stats .pls-tiles { display: flex !important; gap: 0 !important; margin: 0 !important; padding: 0 !important; }
        body.pis-polish #pis-lifetime-stats .pls-tile { flex: 1 1 0; min-width: 0; margin: 0 !important; padding: 13px 6px 12px !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important;
            text-align: center; display: block !important; }
        body.pis-polish #pis-lifetime-stats .pls-tile + .pls-tile { border-left: 1px solid #e4ebf3 !important; }
        body.pis-polish #pis-lifetime-stats .pls-tile .pls-icon { display: none !important; }
        body.pis-polish #pis-lifetime-stats .pls-tile strong { display: block; font-size: 22px !important; line-height: 27px !important; font-weight: 800 !important; }
        body.pis-polish #pis-lifetime-stats .pls-blue strong { color: #1f5fbf !important; }
        body.pis-polish #pis-lifetime-stats .pls-orange strong { color: #b85a0a !important; }
        body.pis-polish #pis-lifetime-stats .pls-green strong { color: #17733a !important; }
        body.pis-polish #pis-lifetime-stats .pls-tile .pls-name { display: block; font-size: 13px !important; line-height: 17px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish #pis-lifetime-stats .pls-tile .pls-note { display: block; font-size: 11.5px !important; line-height: 15px !important; font-weight: 600 !important; color: #627184 !important; }
        body.pis-polish #pis-lifetime-stats .pls-records { display: block !important; margin: 0 !important; padding: 0 !important; gap: 0 !important; }
        body.pis-polish #pis-lifetime-stats .pls-record { display: flex !important; align-items: center !important; gap: 12px !important; min-height: 56px; margin: 0 !important; padding: 8px 12px !important; box-sizing: border-box; border: 0 !important;
            border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
        body.pis-polish #pis-lifetime-stats .pls-badge { width: 38px !important; height: 38px !important; flex: 0 0 38px; border-radius: 11px !important; }
        body.pis-polish #pis-lifetime-stats .pls-record-copy { flex: 1 1 auto; min-width: 0; display: grid !important; grid-template-columns: auto 1fr; column-gap: 12px; align-items: center; }
        body.pis-polish #pis-lifetime-stats .pls-record-copy .pls-name { grid-column: 1; grid-row: 1 / span 2; font-size: 15px !important; font-weight: 800 !important; color: #13233a !important; white-space: nowrap; text-transform: capitalize; }
        body.pis-polish #pis-lifetime-stats .pls-record-copy strong { grid-column: 2; grid-row: 1; font-size: 14px !important; line-height: 18px !important; font-weight: 800 !important; color: #13233a !important; text-align: right; }
        body.pis-polish #pis-lifetime-stats .pls-record-copy em { grid-column: 2; grid-row: 2; font-style: normal; font-size: 12px !important; line-height: 16px !important; font-weight: 600 !important; color: #5b6b80 !important; text-align: right; white-space: normal !important; }
        /* log out */
        body.pis-polish .pis-more-logout { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; margin: 4px 0 0 !important; padding: 0; border-radius: 14px; border: 1.5px solid #f1c4c0; background: #fff;
            color: #b3261e; font-family: inherit; font-size: 15.5px; font-weight: 800; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .pis-more-logout:disabled { opacity: .6; }
        body.pis-polish #admin-screen-more > .pis-more-version { order: 10; display: block; margin: -2px 0 0 !important; text-align: center; font-size: 12.5px; line-height: 16px; font-weight: 600; color: #627184; }
        body.pis-polish #admin-screen-more > .pis-more-version:empty { display: none; }
        /* >>> more screens >>> */
        /* ========== lines that used to wrap ========== */
        /* Effective Rate: the money, the time and the driving each get a line */
        body.pis-polish #admin-financial-hourly-detail { margin-top: 5px !important; font-size: 12px !important; line-height: 17px !important; }
        body.pis-polish #admin-financial-hourly-detail .pis-rate-part { display: block; }
        body.pis-polish #admin-financial-hourly-detail .pis-rate-dot { display: none; }
        body.pis-polish #admin-financial-hourly-detail .pis-rate-term { white-space: nowrap; }
        /* Lifetime Stats records: the day, who and how long each get a line */
        body.pis-polish #pis-lifetime-stats .pls-record-copy em .pls-piece { display: block; }
        body.pis-polish #pis-lifetime-stats .pls-record-copy em .pls-dot { display: none; }
        body.pis-polish #pis-lifetime-stats .pls-record-copy { row-gap: 1px; }

        /* ========== one blue ==========
           Filled things (the corner photo, the Today card, New Message, a default profile photo, Save
           buttons, switches that are on) all use the same blue. Quiet buttons (Cancel, Choose Profile
           Photo, Edit) are white with a thin border and blue words. */
        body.pis-polish #admin-profile-avatar,
        body.pis-polish #admin-profile-avatar .client-profile-initials,
        body.pis-polish #admin-profile-form .client-photo-preview-wrapper,
        body.pis-polish #admin-profile-form .client-photo-preview-initials { background: linear-gradient(135deg, #1f74be, #17609f) !important; color: #fff !important; }

        /* ========== Edit Profile: its own page (the script below moves it there while it is open) ========== */
        body.pis-profile-open { overflow: hidden !important; }
        body.pis-polish #admin-profile-form-panel.pis-profile-page { position: fixed !important; top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; z-index: 3000 !important; display: flex !important; flex-direction: column;
            width: auto !important; height: auto !important; max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: #f3f6fa !important; box-shadow: none !important; }
        body.pis-polish .pis-profile-page .household-form-header { flex: 0 0 auto; display: flex !important; align-items: center !important; justify-content: space-between; gap: 12px !important; min-height: 0 !important; margin: 0 !important;
            padding: calc(env(safe-area-inset-top, 0px) + 14px) 16px 12px !important; background: #fff !important; border: 0 !important; border-bottom: 1px solid #e4ebf3 !important; }
        body.pis-polish .pis-profile-page .household-form-header > div { flex: 1 1 auto; min-width: 0; }
        body.pis-polish .pis-profile-page .household-form-header > div::before { content: "MY ACCOUNT"; display: block; font-size: 11px; line-height: 14px; font-weight: 800; letter-spacing: .12em; color: #1b6fb3; }
        body.pis-polish .pis-profile-page .household-form-header h4 { margin: 1px 0 0 !important; font-size: 22px !important; line-height: 27px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish .pis-profile-page .household-form-header p { display: none !important; }
        body.pis-polish .pis-profile-page #admin-close-profile-form-button { flex: 0 0 44px; width: 44px !important; height: 44px !important; min-width: 0 !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; display: flex !important;
            align-items: center; justify-content: center; border: 1px solid #c9d9ea !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important; color: #1b6fb3 !important; font-size: 26px !important; line-height: 1 !important;
            font-weight: 400 !important; }
        body.pis-polish .pis-profile-page #admin-profile-form { flex: 1 1 auto; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; display: flex !important; flex-direction: column; gap: 12px;
            margin: 0 !important; padding: 14px 16px 0 !important; box-sizing: border-box; }
        body.pis-polish .pis-profile-page #admin-profile-form > * { flex: 0 0 auto; }
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-editor,
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-section { margin: 0 !important; padding: 14px !important; background: #fff !important; border: 1px solid #dce5ef !important; border-radius: 18px !important;
            box-shadow: 0 6px 18px rgba(19, 35, 58, .05) !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-editor { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 14px !important; text-align: left !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-preview-wrapper { width: 68px !important; height: 68px !important; flex: 0 0 68px; margin: 0 !important; box-shadow: none !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-preview-initials { font-size: 23px !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-controls { flex: 1 1 auto; min-width: 0; display: block !important; text-align: left !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-upload-button { display: inline-flex !important; align-items: center; justify-content: center; width: auto !important; min-height: 42px !important; margin: 0 !important;
            padding: 0 14px !important; box-sizing: border-box; border: 1px solid #c9d9ea !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important; color: #1b6fb3 !important; font-size: 14.5px !important;
            font-weight: 800 !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-help { margin: 6px 0 0 !important; font-size: 12px !important; line-height: 16px !important; font-weight: 600; color: #627184 !important; text-align: left !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-section h5 { margin: 0 0 10px !important; font-size: 11.5px !important; line-height: 16px !important; font-weight: 800 !important; letter-spacing: .1em; text-transform: uppercase;
            color: #5b6b80 !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-grid { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; gap: 0 10px !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field { grid-column: 1 / -1; min-width: 0; margin: 0 0 12px !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-grid > .household-form-field:last-child { margin-bottom: 0 !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field:has(> #admin-state) { grid-column: 1; margin-bottom: 0 !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field:has(> #admin-zip) { grid-column: 2; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field label { display: block; margin: 0 0 5px !important; font-size: 13px !important; line-height: 17px !important; font-weight: 700 !important; color: #46566b !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field input,
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field select { width: 100% !important; height: 46px !important; min-height: 0 !important; margin: 0 !important; padding: 0 12px !important; box-sizing: border-box;
            border: 1px solid #c9d9ea !important; border-radius: 12px !important; background-color: #fff !important; box-shadow: none !important; color: #13233a !important; font-size: 16px !important; font-weight: 600 !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field input:focus,
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field select:focus { outline: none !important; border-color: #1f74be !important; box-shadow: 0 0 0 3px rgba(31, 116, 190, .16) !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field input:disabled { background-color: #f3f6fa !important; color: #627184 !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .field-help { display: block; margin: 5px 0 0 !important; font-size: 12px !important; line-height: 16px !important; font-weight: 600; color: #627184 !important; }
        /* Cancel and Save Profile stay at the bottom of the screen while the form scrolls */
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-actions { order: 9; position: sticky; bottom: 0; z-index: 2; display: flex !important; flex-direction: row !important; gap: 8px !important; margin: auto -16px 0 !important;
            padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px) !important; background: #fff !important; border: 0 !important; border-top: 1px solid #e4ebf3 !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-actions button { order: 0 !important; width: auto !important; min-height: 50px !important; height: 50px !important; margin: 0 !important; padding: 0 12px !important;
            box-sizing: border-box; border-radius: 14px !important; box-shadow: none !important; font-size: 16px !important; font-weight: 800 !important; transform: none !important; }
        body.pis-polish .pis-profile-page #admin-cancel-profile-button { flex: 1 1 0; border: 1px solid #c9d9ea !important; background: #fff !important; color: #1b6fb3 !important; }
        body.pis-polish .pis-profile-page #admin-save-profile-button { flex: 1.9 1 0; border: 0 !important; background: linear-gradient(135deg, #1f74be, #17609f) !important; color: #fff !important; }
        body.pis-polish .pis-profile-page #admin-save-profile-button:disabled { opacity: .55 !important; }
        /* a save that fails: the usual red strip, floating just above the buttons so it is seen wherever the form is scrolled */
        body.pis-polish .pis-profile-page #admin-profile-message { order: 8; position: sticky; bottom: calc(env(safe-area-inset-bottom, 0px) + 83px); z-index: 2; margin: 0 !important; box-shadow: 0 6px 18px rgba(19, 35, 58, .12); }
        body.pis-polish .pis-profile-page #admin-profile-message:empty { display: none !important; }

        /* ========== Push Notifications and Services & Pricing (full-screen pages) ========== */
        body.pis-polish .admin-services-pricing-dialog { width: 100% !important; max-width: none !important; height: 100vh !important; height: 100dvh !important; max-height: none !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; }
        body.pis-polish .admin-services-pricing-header { display: flex !important; align-items: center !important; gap: 12px !important; min-height: 0 !important; margin: 0 !important;
            padding: calc(env(safe-area-inset-top, 0px) + 14px) 16px 12px !important; background: #fff !important; border-bottom: 1px solid #e4ebf3 !important; box-shadow: none !important; }
        body.pis-polish .admin-services-pricing-header > div { flex: 1 1 auto; min-width: 0; }
        body.pis-polish .admin-services-pricing-header .admin-screen-eyebrow { display: block; margin: 0 !important; font-size: 11px !important; line-height: 14px !important; font-weight: 800 !important; letter-spacing: .12em !important; color: #1b6fb3 !important; }
        body.pis-polish .admin-services-pricing-header h2 { margin: 1px 0 0 !important; font-size: 22px !important; line-height: 27px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish .admin-services-pricing-header p { display: none !important; }
        body.pis-polish .admin-services-pricing-close { flex: 0 0 44px; width: 44px !important; height: 44px !important; min-width: 0 !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; display: flex !important; align-items: center;
            justify-content: center; border: 1px solid #c9d9ea !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important; color: #1b6fb3 !important; font-size: 26px !important; line-height: 1 !important; font-weight: 400 !important; }
        body.pis-polish .admin-services-pricing-body { padding: 14px 16px calc(env(safe-area-inset-bottom, 0px) + 24px) !important; background: #f3f6fa !important; }
        /* push: this device */
        body.pis-polish .admin-push-device-card { display: block !important; margin: 0 0 16px !important; padding: 14px !important; background: #fff !important; border: 1px solid #dce5ef !important; border-radius: 18px !important;
            box-shadow: 0 6px 18px rgba(19, 35, 58, .05) !important; }
        body.pis-polish .admin-push-device-copy { display: block !important; margin: 0 !important; }
        body.pis-polish .admin-push-device-copy .admin-screen-eyebrow { display: block; margin: 0 !important; font-size: 11px !important; line-height: 14px !important; font-weight: 800 !important; letter-spacing: .1em !important; color: #5b6b80 !important; }
        body.pis-polish .admin-push-device-copy strong { display: block; margin: 2px 0 0 !important; font-size: 16px !important; line-height: 21px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish .admin-push-modal-status { margin: 3px 0 0 !important; font-size: 13.5px !important; line-height: 18px !important; font-weight: 600 !important; }
        body.pis-polish .admin-push-enable-button { display: flex !important; align-items: center; justify-content: center; width: 100% !important; min-height: 46px !important; height: auto !important; margin: 12px 0 0 !important; padding: 8px 12px !important;
            box-sizing: border-box; border: 0 !important; border-radius: 14px !important; background: linear-gradient(135deg, #1f74be, #17609f) !important; box-shadow: none !important; color: #fff !important; font-size: 15px !important; font-weight: 800 !important;
            transform: none !important; }
        /* In the app this button can never be tapped (it only repeated the line above it), so it is left out
           there; on the website it is the real Enable Notifications button. */
        body.pis-polish .admin-push-enable-button:disabled { display: none !important; }
        body.pis-polish .admin-push-enable-button[hidden] { display: none !important; }
        /* push: what should notify you */
        body.pis-polish .admin-push-preferences { margin: 0 !important; padding: 0 !important; background: none !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        body.pis-polish .admin-push-preferences .admin-more-section-heading { display: block !important; margin: 0 4px 8px !important; padding: 0 !important; border: 0 !important; }
        body.pis-polish .admin-push-preferences .admin-more-section-heading .admin-screen-eyebrow,
        body.pis-polish .admin-push-preferences .admin-more-section-heading p { display: none !important; }
        body.pis-polish .admin-push-preferences h3 { margin: 0 !important; font-size: 11.5px !important; line-height: 16px !important; font-weight: 800 !important; letter-spacing: .1em; text-transform: uppercase; color: #5b6b80 !important; }
        body.pis-polish .admin-push-preference-list { display: block !important; margin: 0 !important; padding: 0 !important; overflow: hidden; background: #fff !important; border: 1px solid #dce5ef !important; border-radius: 18px !important;
            box-shadow: 0 6px 18px rgba(19, 35, 58, .05) !important; }
        body.pis-polish .admin-push-preference-row { display: flex !important; align-items: center !important; gap: 12px !important; min-height: 62px; margin: 0 !important; padding: 10px 12px 10px 14px !important; box-sizing: border-box; border: 0 !important;
            border-top: 1px solid #e4ebf3 !important; border-radius: 0 !important; background: none !important; }
        body.pis-polish .admin-push-preference-row:first-child { border-top: 0 !important; }
        body.pis-polish .admin-push-preference-copy { flex: 1 1 auto; min-width: 0; display: block !important; }
        body.pis-polish .admin-push-preference-copy strong { display: block; margin: 0 !important; font-size: 15px !important; line-height: 20px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish .admin-push-preference-copy > span { display: block; margin: 1px 0 0 !important; font-size: 12.5px !important; line-height: 17px !important; font-weight: 600 !important; color: #627184 !important; }
        body.pis-polish .admin-push-switch { flex: 0 0 auto; }
        body.pis-polish .admin-push-switch input:checked + .admin-push-switch-track { background: linear-gradient(135deg, #1f74be, #17609f) !important; }
        /* services & pricing */
        body.pis-polish .admin-services-pricing-toolbar { display: none !important; }
        body.pis-polish #admin-services-pricing-list { display: block !important; margin: 0 !important; padding: 0 !important; font-size: 14px; font-weight: 600; color: #5b6b80; }
        body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card { display: block !important; margin: 0 0 12px !important; padding: 14px !important; background: #fff !important; border: 1px solid #dce5ef !important; border-radius: 18px !important;
            box-shadow: 0 6px 18px rgba(19, 35, 58, .05) !important; }
        body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card { padding-left: 19px !important; }
        body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card.admin-service-is-editing { border-color: #1f74be !important; box-shadow: 0 0 0 3px rgba(31, 116, 190, .14) !important; }
        body.pis-polish .admin-pricing-v2-heading { display: flex !important; align-items: flex-start !important; justify-content: space-between !important; flex-wrap: nowrap !important; gap: 10px !important; margin: 0 0 12px !important; }
        body.pis-polish .admin-pricing-v2-heading h3 { flex: 1 1 auto; min-width: 0; margin: 0 !important; font-size: 16px !important; line-height: 21px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish .admin-pricing-v2-heading .admin-service-status { flex: 0 0 auto; margin: 1px 0 0 !important; padding: 3px 9px !important; border-radius: 999px !important; font-size: 10.5px !important; line-height: 14px !important; font-weight: 800 !important;
            letter-spacing: .05em !important; white-space: nowrap; }
        body.pis-polish .admin-pricing-v2-card:has([data-pricing-action="toggle"][data-next-active="true"]) .admin-service-status { background: #eef2f6 !important; border-color: #cfd8e3 !important; color: #55657a !important; }
        body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card .admin-service-pricing-rates { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 8px !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
        body.pis-polish #admin-services-pricing-list .admin-service-rate-field { display: block !important; grid-column: auto !important; min-width: 0; width: auto !important; margin: 0 !important; }
        body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card .admin-service-rate-field > span { display: block; margin: 0 0 4px !important; font-size: 10.5px !important; line-height: 14px !important; font-weight: 800 !important; letter-spacing: .06em !important;
            text-transform: uppercase; color: #5b6b80 !important; }
        body.pis-polish #admin-services-pricing-list .admin-service-rate-input { display: flex !important; align-items: center !important; gap: 3px !important; width: 100% !important; height: 44px !important; min-height: 0 !important; margin: 0 !important; padding: 0 10px !important;
            box-sizing: border-box; border: 1px solid #dce5ef !important; border-radius: 12px !important; background: #f6f9fc !important; box-shadow: none !important; }
        body.pis-polish #admin-services-pricing-list .admin-service-is-editing .admin-service-rate-input { border-color: #c9d9ea !important; background: #fff !important; }
        body.pis-polish #admin-services-pricing-list .admin-service-rate-input > span { flex: 0 0 auto; margin: 0 !important; padding: 0 !important; font-size: 14px !important; font-weight: 700 !important; color: #7d8ca0 !important; }
        body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card .admin-service-rate-input input { flex: 1 1 auto; min-width: 0; width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important;
            box-shadow: none !important; outline: none !important; font-size: 16px !important; font-weight: 800 !important; color: #13233a !important; }
        body.pis-polish #admin-services-pricing-list .admin-service-rate-input input::-webkit-outer-spin-button,
        body.pis-polish #admin-services-pricing-list .admin-service-rate-input input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        body.pis-polish #admin-services-pricing-list .admin-service-rate-input input { -moz-appearance: textfield; appearance: textfield; }
        body.pis-polish .admin-pricing-v2-fees { margin: 14px 0 0 !important; padding: 12px 0 0 !important; border-top: 1px solid #e4ebf3 !important; }
        body.pis-polish .admin-pricing-v2-fees > strong { display: block; margin: 0 0 9px !important; font-size: 11.5px !important; line-height: 16px !important; font-weight: 800 !important; letter-spacing: .1em; text-transform: uppercase; color: #5b6b80 !important; }
        body.pis-polish .admin-pricing-v2-fee-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px 8px !important; align-items: end; }
        body.pis-polish .admin-pricing-v2-note { margin: 10px 0 0 !important; font-size: 12px !important; line-height: 17px !important; font-weight: 600; color: #627184 !important; white-space: normal !important; }
        body.pis-polish .admin-pricing-v2-note + .admin-pricing-v2-note { display: none; }
        body.pis-polish .admin-service-is-editing .admin-pricing-v2-note + .admin-pricing-v2-note { display: block; }
        body.pis-polish .admin-pricing-v2-message { margin: 10px 0 0 !important; font-size: 13px !important; line-height: 18px !important; font-weight: 700; }
        body.pis-polish .admin-pricing-v2-actions { display: flex !important; flex-wrap: nowrap !important; justify-content: stretch !important; gap: 8px !important; margin: 12px 0 0 !important; padding: 0 !important; }
        body.pis-polish .admin-pricing-v2-actions button { flex: 1 1 0; min-width: 0; min-height: 46px !important; height: 46px !important; margin: 0 !important; padding: 0 10px !important; box-sizing: border-box; border: 1px solid #c9d9ea !important;
            border-radius: 14px !important; background: #fff !important; box-shadow: none !important; color: #1b6fb3 !important; font-size: 15px !important; font-weight: 800 !important; }
        body.pis-polish .admin-pricing-v2-actions button[data-pricing-action="save"] { flex: 1.9 1 0; border-color: transparent !important; background: linear-gradient(135deg, #1f74be, #17609f) !important; color: #fff !important; }
        body.pis-polish .admin-pricing-v2-actions button:disabled { opacity: .5 !important; }

        /* ========== Website Banner: a switch for on/off, and the same blue as everything else ========== */
        body.pis-polish .psb-toggle { flex-direction: row-reverse; justify-content: space-between; }
        body.pis-polish .psb-toggle > span { flex: 1 1 auto; min-width: 0; }
        body.pis-polish .psb-toggle input { -webkit-appearance: none; appearance: none; position: relative; flex: 0 0 48px; width: 48px; height: 29px; margin: 0; border: 0; border-radius: 999px; background: #cdd7e2; cursor: pointer;
            transition: background-color .15s ease; }
        body.pis-polish .psb-toggle input::after { content: ""; position: absolute; top: 3px; left: 3px; width: 23px; height: 23px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(19, 35, 58, .3); transition: transform .15s ease; }
        body.pis-polish .psb-toggle input:checked { background: linear-gradient(135deg, #1f74be, #17609f); }
        body.pis-polish .psb-toggle input:checked::after { transform: translateX(19px); }
        body.pis-polish .psb-toggle input:focus-visible { outline: 3px solid rgba(31, 116, 190, .35); outline-offset: 2px; }
        body.pis-polish .psb-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
        body.pis-polish .psb-row .psb-field > span { min-height: 0; }
        body.pis-polish .psb .psb-eyebrow { color: #1b6fb3; }
        body.pis-polish .psb .psb-close,
        body.pis-polish .psb .psb-foot .psb-cancel,
        body.pis-polish .psb .psb-chip,
        body.pis-polish .psb .psb-add { color: #1b6fb3 !important; }
        body.pis-polish .psb .psb-foot .psb-save { background: linear-gradient(135deg, #1f74be, #17609f) !important; }
        /* a mistake with the photo: the message goes under the photo row, like every other box in the app */
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-editor { flex-wrap: wrap !important; row-gap: 12px !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-editor > .client-photo-controls { flex: 1 1 0 !important; min-width: 0; }
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-editor > .pis-field-note { flex: 0 0 100%; margin: 0 2px !important; }
        /* mistakes: same flow as the rest of the app, even where a box is too narrow to hold a sentence */
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-grid > .pis-field-note { grid-column: 1 / -1; margin: 8px 2px 0 !important; }
        body.pis-polish #admin-services-pricing-list .admin-service-rate-input:has(input.pis-field-invalid) { border-color: #d94f4f !important; background: #fffafa !important; box-shadow: 0 0 0 3px rgba(217, 79, 79, .14) !important; }
        body.pis-polish #admin-services-pricing-list .admin-pricing-v2-card > .pis-field-note,
        body.pis-polish #admin-services-pricing-list .admin-pricing-v2-fees > .pis-field-note { margin: 10px 2px 0 !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field input.pis-field-invalid,
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field select.pis-field-invalid { border-color: #d94f4f !important; background-color: #fffafa !important; box-shadow: 0 0 0 3px rgba(217, 79, 79, .14) !important; }
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field input.pis-field-invalid:focus,
        body.pis-polish .pis-profile-page #admin-profile-form .household-form-field select.pis-field-invalid:focus { border-color: #d94f4f !important; box-shadow: 0 0 0 3px rgba(217, 79, 79, .22) !important; }
        /* a mistake with the photo: a red line and a soft glow on the button itself (the same look as a wrong box) */
        body.pis-polish .pis-profile-page #admin-profile-form .client-photo-controls.pis-field-invalid .client-photo-upload-button { border-color: #d94f4f !important; background: #fffafa !important;
            box-shadow: 0 0 0 3px rgba(217, 79, 79, .14) !important; }

        /* ========== Schedule: the colored edge per service is back (it tells walks, drop-ins, sitting,
           meet and greets and boarding apart at a glance; the compact look had dropped it) ========== */
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-walk,
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-dropin,
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-sit,
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-meet,
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-boarding { padding-left: 19px !important; }
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-walk { box-shadow: inset 5px 0 0 #1f63b8 !important; }
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-dropin { box-shadow: inset 5px 0 0 #14c0dc !important; }
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-sit { box-shadow: inset 5px 0 0 #b8336a !important; }
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-meet { box-shadow: inset 5px 0 0 #6a45c2 !important; }
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.kind-boarding { box-shadow: inset 5px 0 0 #c0610c !important; }
        body.pis-polish #admin-day-services .pis-row.pis-row.pis-row.is-cancelled { box-shadow: inset 5px 0 0 #e3a19b !important; }
        /* <<< more screens <<< */
    }
    `;
    document.head.appendChild(css);

    // ========================================
    // TOP HEADER
    // ========================================
    const header = $('.admin-dashboard-header');
    const titleBox = $('.admin-dashboard-title', header);
    const actions = $('.admin-dashboard-header-actions', header) || header;
    const logoutButton = document.getElementById('admin-logout-button');

    const sub = document.createElement('p');
    sub.className = 'pis-head-sub';
    sub.setAttribute('aria-live', 'off');
    titleBox?.appendChild(sub);

    const avatar = document.createElement('button');
    avatar.type = 'button';
    avatar.className = 'pis-head-avatar';
    avatar.setAttribute('aria-label', 'Your Account');
    avatar.setAttribute('aria-expanded', 'false');
    actions.appendChild(avatar);

    const menuClose = document.createElement('button');
    menuClose.type = 'button';
    menuClose.className = 'pis-head-menu-close';
    menuClose.hidden = true;
    menuClose.setAttribute('aria-label', 'Close Menu');
    const menu = document.createElement('section');
    menu.className = 'pis-head-menu';
    menu.hidden = true;
    menu.setAttribute('aria-label', 'Your Account');
    menu.tabIndex = -1;
    menu.innerHTML = `<div class="pis-head-menu-who"><strong></strong><span></span></div>
        <button type="button" class="pis-head-menu-item" data-head-menu="profile">${svg(ICON.user, 19, 2.2)}My Profile</button>
        <button type="button" class="pis-head-menu-item is-out" data-head-menu="logout">${svg(ICON.logout, 19, 2.2)}Log Out</button>`;
    document.body.append(menuClose, menu);

    function closeMenu() {
        if (menu.hidden) return false;
        const hadFocus = menu.contains(document.activeElement);
        menu.hidden = true;
        menuClose.hidden = true;
        avatar.setAttribute('aria-expanded', 'false');
        if (hadFocus) { try { avatar.focus({ preventScroll: true }); } catch { /* ignore */ } }
        return true;
    }
    function openMenu() {
        $('.pis-head-menu-who strong', menu).textContent = text('#admin-display-name') || 'Your Account';
        $('.pis-head-menu-who span', menu).textContent = text('#admin-display-email');
        menu.style.top = `${Math.round(header.getBoundingClientRect().bottom + 6)}px`;
        menu.hidden = false;
        menuClose.hidden = false;
        avatar.setAttribute('aria-expanded', 'true');
        try { menu.focus({ preventScroll: true }); } catch { /* ignore */ }      // keyboard users land in the menu; no ring on a tap
    }
    avatar.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
    menuClose.addEventListener('click', closeMenu);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    menu.addEventListener('click', event => {
        const item = event.target.closest?.('[data-head-menu]');
        if (!item) return;
        closeMenu();
        if (item.dataset.headMenu === 'logout') { logoutButton?.click(); return; }
        $('.admin-app-nav [data-admin-screen="more"]')?.click();
        setTimeout(() => { try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { /* ignore */ } }, 0);
    });

    // your photo if you have one, else your initials
    function paintAvatar() {
        const image = document.getElementById('admin-profile-image');
        const src = image && !image.hidden && image.style.display !== 'none' && image.getAttribute('src') ? image.getAttribute('src') : '';
        const initials = text('#admin-profile-initials') || (text('#admin-display-name').split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase()) || '';
        const want = src ? `img:${src}` : `txt:${initials}`;
        if (avatar.dataset.shown === want) return;
        avatar.dataset.shown = want;
        if (src) { avatar.innerHTML = '<img alt="">'; avatar.firstChild.src = src; }
        else avatar.textContent = initials;
    }

    // the line under the screen name
    const screen = () => {
        const shown = text('#admin-screen-title').toLowerCase();      // the name on screen is the truth (Messages is a drawer, not a screen)
        if (['home', 'schedule', 'clients', 'messages', 'more'].includes(shown)) return shown;
        try { return (typeof activeAdminScreen === 'string' && activeAdminScreen) || 'home'; } catch { return 'home'; }
    };
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    function subText() {
        const name = screen();
        if (name === 'home') return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Chicago' });
        if (name === 'schedule') { const n = parseInt(text('#admin-summary-total-visits'), 10); return Number.isFinite(n) ? `${plural(n, 'service', 'services')} today` : 'Your calendar'; }
        if (name === 'clients') {
            try { const n = typeof getAdminClientDirectoryProfiles === 'function' ? getAdminClientDirectoryProfiles().length : NaN; if (Number.isFinite(n)) return plural(n, 'client', 'clients'); } catch { /* ignore */ }
            return 'Your clients';
        }
        if (name === 'messages') {
            const badge = document.getElementById('admin-nav-message-badge');
            const unread = badge && badge.style.display !== 'none' ? parseInt(badge.textContent, 10) : 0;
            return unread > 0 ? `${unread} unread` : 'All caught up';
        }
        if (name === 'more') return 'Settings and your profile';
        return '';
    }
    function paintHeader() {
        const next = subText();
        if (sub.textContent !== next) sub.textContent = next;
        paintAvatar();
    }

    // ========================================
    // HOME
    // ========================================
    const label = (id, words) => {
        const el = document.createElement('div');
        el.className = 'pis-sec-label';
        el.id = id;
        el.innerHTML = `<span>${esc(words)}</span><em></em>`;
        return el;
    };
    const shownEl = el => Boolean(el) && !el.hidden && getComputedStyle(el).display !== 'none';

    let today = null, routeLabel = null, routeNote = null, moneyLabel = null, boardingLabel = null, boardingBox = null;
    function ensureHome() {
        const summary = $('.admin-today-summary');
        if (summary && !today) {
            today = document.createElement('div');
            today.className = 'pis-today';
            today.setAttribute('role', 'group');
            today.setAttribute('aria-label', 'Today');
            today.innerHTML = `<div class="pis-today-top"><strong data-t="done"></strong><span class="pis-today-live" data-t="live" hidden><i></i><span></span></span></div>
                <p data-t="mix"></p>
                <div class="pis-today-bar" role="progressbar" aria-label="Visits done" aria-valuemin="0"><i></i></div>
                <div class="pis-today-stats"><span><b data-t="active"></b>In Progress</span><span><b data-t="time"></b>Visit Time</span><span><b data-t="miles"></b>Walked</span></div>`;
            summary.prepend(today);
        }
        const route = document.getElementById('admin-best-route');
        if (route && !routeLabel) {
            routeLabel = label('pis-label-route', "Today's Route"); route.before(routeLabel);
            routeNote = document.createElement('p'); routeNote.className = 'pis-route-note'; route.prepend(routeNote);
        }
        const money = document.getElementById('admin-financial-snapshot');
        if (money && !moneyLabel) {
            moneyLabel = label('pis-label-money', 'Financial Snapshot');
            boardingLabel = label('pis-label-boarding', 'Boarding Now');
            boardingBox = document.createElement('section');
            boardingBox.className = 'pis-boarding-now';
            boardingBox.setAttribute('aria-label', 'Boarding now');
            boardingBox.hidden = true;
            boardingLabel.hidden = true;
            money.before(boardingLabel, boardingBox, moneyLabel);
        }
    }
    const set = (el, value) => { if (el && el.textContent !== value) el.textContent = value; };
    function paintToday() {
        if (!today) return;
        const [done, total] = (text('#admin-summary-completed-visits').match(/\d+/g) || []).map(Number);
        const have = Number.isFinite(done) && Number.isFinite(total);
        set($('[data-t="done"]', today), have ? `${done} of ${plural(total, 'visit', 'visits')} done` : 'Today');
        set($('[data-t="mix"]', today), text('#admin-summary-service-breakdown').replace(/\s*•\s*/g, ' · ') || text('#admin-today-date'));
        const bar = $('.pis-today-bar', today);
        bar.setAttribute('aria-valuemax', String(have ? total : 0));
        bar.setAttribute('aria-valuenow', String(have ? done : 0));
        bar.firstElementChild.style.width = `${have && total > 0 ? Math.round((done / total) * 100) : 0}%`;
        set($('[data-t="active"]', today), text('#admin-summary-in-progress-visits') || '0');
        set($('[data-t="time"]', today), text('#admin-summary-visit-time') || '0m');
        set($('[data-t="miles"]', today), text('#admin-summary-walk-distance') || '0.00 mi');
        const status = text('#admin-today-status');
        const live = $('[data-t="live"]', today);
        live.hidden = !status;
        set(live.lastElementChild, status);
    }
    // "10:00 AM - 12:00 PM" -> "10 AM – 12 PM";  "3:00 PM - 5:00 PM" -> "3 – 5 PM";  "3:30 PM - 5:00 PM" -> "3:30 – 5 PM".  Anything else is left alone.
    function shortWindow(value) {
        const found = String(value || '').replace(/\s+/g, ' ').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([AP]M)\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*([AP]M)$/i);
        if (!found) return '';
        const clock = (hour, minutes) => (minutes && minutes !== '00' ? `${Number(hour)}:${minutes}` : String(Number(hour)));
        const from = clock(found[1], found[2]), to = clock(found[4], found[5]);
        const fromHalf = found[3].toUpperCase(), toHalf = found[6].toUpperCase();
        return fromHalf === toHalf ? `${from} – ${to} ${toHalf}` : `${from} ${fromHalf} – ${to} ${toHalf}`;
    }
    // An address as two lines: the street (with any apartment), then "City, ST 75034".
    // Uses the client's saved address when that is exactly what the app is showing; otherwise splits what is on screen at the city.
    function addressLines(visitId, shown) {
        try {
            const visit = (typeof allVisits !== 'undefined' && Array.isArray(allVisits) ? allVisits : []).find(item => Number(item.id) === Number(visitId));
            const home = visit && (typeof allHouseholds !== 'undefined' && Array.isArray(allHouseholds) ? allHouseholds : []).find(item => item.client_id === visit.client_id);
            if (home) {
                const street = [home.street_address, home.address_line_2].filter(Boolean).join(', ');
                const city = `${[home.city, home.state].filter(Boolean).join(', ')}${home.zip_code ? ` ${home.zip_code}` : ''}`.trim();
                if (street && city && `${street}, ${city}` === shown) return [street, city];
            }
        } catch { /* fall through */ }
        const parts = shown.split(/\s*,\s*/).filter(Boolean);
        if (parts.length > 1 && /^(usa|united states)$/i.test(parts[parts.length - 1])) parts.pop();
        // "…, City, ST" or "…, City, ST 75034": the last two pieces are the city line
        if (parts.length >= 3 && /^[A-Za-z][A-Za-z .]*(\s+\d{5}(-\d{4})?)?$/.test(parts[parts.length - 1]) && !/\d/.test(parts[parts.length - 2])) {
            return [parts.slice(0, -2).join(', '), parts.slice(-2).join(', ')];
        }
        return [shown, ''];
    }
    function paintRoute() {
        const route = document.getElementById('admin-best-route');
        if (!routeLabel || !route) return;
        routeLabel.hidden = !shownEl(route);
        const left = parseInt(text('#admin-route-stop-count'), 10);
        const status = text('#admin-route-status');
        const words = [Number.isFinite(left) ? `${plural(left, 'stop', 'stops')} left` : '', status && !/^ready$/i.test(status) ? status : ''].filter(Boolean).join(' · ');
        set(routeLabel.lastElementChild, words);
        // the app's own line about the route ("Recalculate to optimize", "Schedule changed; …"), minus the stop count shown above
        const line = text('#admin-route-subtitle');
        set(routeNote, /^\d+\s+(remaining\s+)?stops?\s*•/i.test(line) ? line.replace(/^[^•]*•\s*/, '') : line);
        const money = document.getElementById('admin-financial-snapshot');
        if (moneyLabel) moneyLabel.hidden = !shownEl(money);
        // each stop: a short time window that fits on the name's line ("10 AM – 12 PM", "3 – 5 PM"); then the street, and the city under it
        if (!isPhone()) return;
        route.querySelectorAll('.admin-route-stop').forEach(stop => {
            const time = $('.admin-route-stop-time', stop);
            const brief = time ? shortWindow(time.textContent) : '';
            if (brief && time.textContent.trim() !== brief) time.textContent = brief;
            const detail = $('.admin-route-stop-copy > span', stop);
            if (!detail || detail.children.length) return;
            const whole = detail.textContent.replace(/\s+/g, ' ').trim();
            const cut = whole.indexOf(' • ');
            if (cut < 1) return;
            const [street, city] = addressLines(stop.dataset.routeVisitId, whole.slice(cut + 3));
            const where = city ? `<span class="pis-stop-street">${esc(street)}</span><i class="pis-stop-dot">, </i><span class="pis-stop-city">${esc(city)}</span>` : esc(street);
            // the dot and comma stay in the page for wide screens (where it all sits on one line as before); phones hide them
            detail.innerHTML = `<span class="pis-stop-what">${esc(whole.slice(0, cut))}</span><i class="pis-stop-dot"> • </i><span class="pis-stop-where">${where}</span>`;
        });
    }

    // boarding guests staying with us right now
    const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const shortDay = date => { const d = new Date(`${String(date || '').slice(0, 10)}T12:00:00Z`); return Number.isFinite(d.getTime()) ? d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }) : ''; };
    function boardingRows() {
        let stays = [];
        try { stays = (typeof adminBoardingState !== 'undefined' && Array.isArray(adminBoardingState?.stays) ? adminBoardingState.stays : []).filter(stay => stay.status === 'active'); } catch { stays = []; }
        const visits = typeof allVisits !== 'undefined' && Array.isArray(allVisits) ? allVisits : [];
        const profiles = typeof allProfiles !== 'undefined' && Array.isArray(allProfiles) ? allProfiles : [];
        const links = typeof allVisitPets !== 'undefined' && Array.isArray(allVisitPets) ? allVisitPets : [];
        const pets = typeof allPets !== 'undefined' && Array.isArray(allPets) ? allPets : [];
        const day = todayKey();
        return stays.map(stay => {
            const nights = visits.filter(visit => stay.booking_group_id && visit.booking_group_id === stay.booking_group_id);
            const visit = nights.find(v => v.visit_date === day) || nights.find(v => Number(v.id) === Number(stay.primary_visit_id)) || nights[0] || null;
            if (!visit) return null;
            const petIds = new Set(links.filter(link => nights.some(v => Number(v.id) === Number(link.visit_id))).map(link => Number(link.pet_id)));
            const names = pets.filter(pet => petIds.has(Number(pet.id))).map(pet => pet.name).filter(Boolean);
            const client = profiles.find(profile => String(profile.id) === String(stay.client_id));
            return { visitId: visit.id, pets: names.join(', '), client: client?.full_name || client?.email || 'Client', until: shortDay(stay.pickup_date) };
        }).filter(Boolean);
    }
    let boardingKey = '';
    function paintBoarding() {
        if (!boardingBox) return;
        const rows = boardingRows();
        const key = JSON.stringify(rows);
        if (key !== boardingKey) {
            boardingKey = key;
            boardingBox.innerHTML = rows.map(row => `<button type="button" data-boarding-now="${esc(String(row.visitId))}" aria-label="Open ${esc(row.client)}'s boarding stay">
                <span class="pis-bn-icon" aria-hidden="true">${svg(ICON.moon, 22, 2)}</span>
                <span class="pis-bn-text"><strong>${esc(row.pets || row.client)}</strong><span>${esc(row.pets ? row.client : 'Boarding with us')}</span></span>
                ${row.until ? `<span class="pis-bn-until">Until ${esc(row.until)}</span>` : ''}
                ${svg(ICON.chev, 18, 2.2).replace('<svg', '<svg class="pis-bn-chev"')}
            </button>`).join('');
        }
        boardingBox.hidden = boardingLabel.hidden = rows.length === 0;
    }
    function openVisit(visitId) {
        try { if (typeof openAdminRouteVisitInSchedule === 'function') openAdminRouteVisitInSchedule(visitId); else return; } catch (error) { console.warn('Open visit:', error); return; }
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
    document.addEventListener('click', event => {
        const row = event.target.closest?.('[data-boarding-now]');
        if (row) openVisit(row.dataset.boardingNow);
    });

    // ========================================
    // SCHEDULE: "N services this month" under the month name
    // ========================================
    let monthPill = null;
    function ensureSchedule() {
        const monthLabel = document.getElementById('admin-calendar-month-label');
        if (!monthLabel || monthPill) return;
        const wrap = document.createElement('div');
        wrap.className = 'pis-month';
        monthLabel.before(wrap);
        monthPill = document.createElement('span');
        monthPill.className = 'pis-month-pill';
        wrap.append(monthLabel, monthPill);
    }
    function paintSchedule() {
        if (!monthPill) return;
        const n = parseInt(text('#admin-month-service-count'), 10);
        set(monthPill, Number.isFinite(n) ? `${plural(n, 'service', 'services')} this month` : '');
        monthPill.hidden = !Number.isFinite(n);
    }

    // ========================================
    // MORE: a status on the right of each tool, and Log Out at the bottom
    // ========================================
    function toolStatus(card) {
        const note = ($('.admin-more-tool-copy > span, .admin-more-tool-copy > small', card)?.textContent || '').replace(/\s+/g, ' ').trim();
        const title = ($('.admin-more-tool-copy > strong', card)?.textContent || '').trim().toLowerCase();
        if (/notification/.test(title)) {
            if (/\benabled\b|\bare on\b/i.test(note)) return { text: 'On', tone: 'good' };
            if (/turned off|blocked|not allowed|denied|off for/i.test(note)) return { text: 'Off', tone: 'warn', look: true };
            return { text: '', look: Boolean(note) };      // anything else (tap to turn on, checking…): show the app's own words
        }
        let found = note.match(/^Seasonal:\s*(\w+) icon right now/i);
        if (found) return { text: found[1] };
        if (/^Seasonal:/i.test(note)) return { text: 'Seasonal' };
        if (/^Classic:/i.test(note)) return { text: 'Classic' };
        found = note.match(/^(On|Off)\b/);
        if (found) return { text: found[1], tone: found[1] === 'On' ? 'good' : '' };
        return { text: '' };
    }
    let moreLogout = null;
    function ensureMore() {
        const more = document.getElementById('admin-screen-more');
        if (more && !moreLogout && logoutButton) {
            moreLogout = document.createElement('button');
            moreLogout.type = 'button';
            moreLogout.className = 'pis-more-logout';
            moreLogout.innerHTML = `${svg(ICON.logout, 19, 2.2)}<span>Log Out</span>`;
            moreLogout.addEventListener('click', () => logoutButton.click());
            more.appendChild(moreLogout);
            // the app's version, when this is the installed app (the website has no version to show)
            const version = document.createElement('p');
            version.className = 'pis-more-version';
            more.appendChild(version);
            try {
                const info = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.App?.getInfo?.() : null;
                Promise.resolve(info).then(app => { if (app?.version) version.textContent = `Paws in Stride ${app.version}`; }).catch(() => { /* no version: show nothing */ });
            } catch { /* ignore */ }
        }
    }
    function paintMore() {
        document.querySelectorAll('.admin-more-tool-grid > .admin-more-tool-card').forEach(card => {
            let status = $('.pis-tool-status', card);
            if (!status) {
                status = document.createElement('em');
                status.className = 'pis-tool-status';
                const arrow = $('.admin-more-tool-arrow', card);
                if (arrow) arrow.before(status); else card.appendChild(status);
            }
            const now = toolStatus(card);
            set(status, now.text);
            status.className = `pis-tool-status${now.tone ? ` is-${now.tone}` : ''}`;
            card.classList.toggle('pis-needs-look', Boolean(now.look));
        });
        if (moreLogout && logoutButton) {
            moreLogout.disabled = logoutButton.disabled;
            set(moreLogout.lastElementChild, /logging out/i.test(logoutButton.textContent) ? 'Logging Out…' : 'Log Out');
        }
    }

    // ========================================
    // KEEP IT CURRENT
    // ========================================
    let queued = false;
    function paint() {
        queued = false;
        try { ensureHome(); ensureSchedule(); ensureMore(); } catch (error) { console.warn('Polish (set up):', error); }
        for (const step of [paintHeader, paintToday, paintRoute, paintBoarding, paintSchedule, paintMore, paintTeamWords]) {
            try { step(); } catch (error) { console.warn('Polish:', error); }
        }
        if (!isPhone()) closeMenu();
    }
    const queue = () => { if (queued) return; queued = true; requestAnimationFrame(paint); };
    // the old parts are still what the app updates: repaint the compact ones whenever they change
    const watch = (sel, options = { subtree: true, childList: true, characterData: true }) => { const el = $(sel); if (el) new MutationObserver(queue).observe(el, options); };
    watch('.admin-today-summary');
    // the route card, but not the map inside it (a map redraws itself constantly while you move it)
    watch('#admin-best-route', { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
    watch('#admin-best-route > .admin-home-section-heading');
    watch('#admin-best-route > .admin-route-summary');
    watch('#admin-best-route .admin-route-stops-panel');
    watch('#admin-financial-snapshot', { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
    watch('#admin-month-service-count');
    watch('.admin-more-tool-grid');
    watch('#admin-profile-display');
    watch('#admin-profile-image', { attributes: true, attributeFilter: ['src', 'style', 'hidden'] });
    watch('#admin-nav-message-badge', { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style'] });
    watch('#admin-screen-title');
    if (logoutButton) new MutationObserver(queue).observe(logoutButton, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['disabled'] });
    new MutationObserver(queue).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', queue, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) queue(); });
    setInterval(() => { if (!document.hidden) queue(); }, 30000);       // boarding guests, the date at midnight

    // A team member is not an admin: their Push Notifications page says "My Account", like Edit Profile.
    function paintTeamWords() {
        if (!document.body.classList.contains('pis-employee')) return;
        const eyebrow = $('#admin-push-notifications-modal .admin-services-pricing-header .admin-screen-eyebrow');
        if (eyebrow && eyebrow.textContent.trim() !== 'MY ACCOUNT') eyebrow.textContent = 'MY ACCOUNT';
    }

    // ========================================
    // EDIT PROFILE: ITS OWN PAGE (phones)
    // ========================================
    // The form used to open inside the More screen and push everything under it down the page.
    // On phones it now covers the screen the way Push Notifications and the Website Banner do,
    // with Cancel and Save Profile always in reach. While it is open it sits beside those pages
    // in the document, so nothing about the More screen can move or clip it; closing puts it back
    // exactly where it was. Computers keep the form inside the More screen.
    const profilePanel = document.getElementById('admin-profile-form-panel');
    const profileSpot = profilePanel ? document.createComment('edit profile form') : null;
    function syncProfilePage() {
        if (!profilePanel) return;
        const shown = Boolean(profilePanel.style.display) && profilePanel.style.display !== 'none';
        const wantPage = shown && isPhone();
        const isPage = profilePanel.classList.contains('pis-profile-page');
        if (wantPage === isPage) return;
        if (wantPage) {
            profilePanel.parentNode.insertBefore(profileSpot, profilePanel);
            (document.getElementById('admin-content') || document.body).appendChild(profilePanel);
            profilePanel.classList.add('pis-profile-page');
            document.body.classList.add('pis-profile-open');
            const form = document.getElementById('admin-profile-form');
            if (form) form.scrollTop = 0;
        } else {
            profilePanel.classList.remove('pis-profile-page');
            document.body.classList.remove('pis-profile-open');
            if (profileSpot.parentNode) profileSpot.parentNode.replaceChild(profilePanel, profileSpot);
        }
    }
    if (profilePanel) {
        new MutationObserver(syncProfilePage).observe(profilePanel, { attributes: true, attributeFilter: ['style'] });
        window.addEventListener('resize', syncProfilePage, { passive: true });
        syncProfilePage();
    }

    window.PisPolish = { paint, closeMenu, openMenu };
    paint();
})();
