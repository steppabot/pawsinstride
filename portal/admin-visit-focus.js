/* ========================================
   VISIT FOCUS SCREEN (popup for the current visit)
   ========================================
   Opens the visit you're working on in a full-screen
   popup, so you never lose your place while walking:

   - Check In          -> opens the popup with a running visit timer
   - Start Walk        -> walk runs inside the popup (same walk logic)
   - Finish Walk       -> visit timer keeps going, Finish Visit stays
   - Finish Visit      -> popup closes, schedule card shows the stats
   - Add/Edit Report   -> report form opens in the popup, Save closes it
   - View Client Report-> preview opens in the popup, X closes it
   - Reopen Visit      -> popup opens again and the timer resumes

   The schedule list shows each visit as a compact row
   (time, service, client and pet, status, one button), and
   the popup adds Call / Text / Navigate buttons and pins the
   visit's action buttons to the bottom of the screen.

   The popup holds the real visit card, and every button
   runs the portal's existing code, so behavior matches the
   schedule card exactly.

   IMPORTANT: load this BEFORE admin.js:
     <script src="./admin-visit-focus.js"></script>
     <script src="./admin.js"></script>
   ======================================== */
(() => {
 const STORAGE_KEY = 'pis-focus-visit';
 const REOPEN_WINDOW_MS = 12 * 60 * 60 * 1000;

 // ---------- 1. Remember the schedule list's button handlers ----------
 // admin.js attaches its card button handlers to #admin-day-services.
 // We record them so the popup can use the very same handlers.
 const captured = [];
 const nativeAdd = EventTarget.prototype.addEventListener;
 EventTarget.prototype.addEventListener = function (type, listener, options) {
  try {
   if (this instanceof Element && this.id === 'admin-day-services') captured.push([type, listener, options]);
  } catch { /* ignore */ }
  return nativeAdd.call(this, type, listener, options);
 };

 let focusedVisitId = null;
 let focusedIsPickup = false;
 let timerHandle = null;
 let historyPushed = false;
 let modal, body, timerEl, titleEl;

 const isCancelled = v => String(v?.status || '').trim().toLowerCase() === 'cancelled';
 const findVisit = id => (typeof allVisits !== 'undefined' ? allVisits : []).find(v => Number(v.id) === Number(id));
 const progressOf = v => { try { return getVisitProgressInfo(v); } catch { return { state: 'scheduled' }; } };
 const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s ?? ''));

 const ICONS = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  call: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z"/></svg>',
  text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
  paw: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="7" cy="9" rx="2" ry="2.6"/><ellipse cx="12" cy="6.5" rx="2" ry="2.6"/><ellipse cx="17" cy="9" rx="2" ry="2.6"/><ellipse cx="4.6" cy="13.6" rx="1.7" ry="2.2"/><ellipse cx="19.4" cy="13.6" rx="1.7" ry="2.2"/><path d="M12 11.5c-2.6 0-5.2 3.4-5.2 5.6 0 1.6 1.3 2.4 2.8 2.4 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.5 0 2.8-.8 2.8-2.4 0-2.2-2.6-5.6-5.2-5.6z"/></svg>',
  house: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2"/><circle cx="17" cy="9" r="2.6"/><path d="M15.8 14.4c2.6.2 4.7 2.2 4.7 4.9"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/><path d="M17 3v3M15.5 4.5h3"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="5"/></svg>',
  nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>'
 };

 const isBoarding = v => { try { return typeof isAdminBoardingService === 'function' && isAdminBoardingService(v); } catch { return false; } };

 function clientOf(visit) {
  try { return (typeof allProfiles !== 'undefined' ? allProfiles : []).find(p => String(p.id) === String(visit.client_id)) || null; } catch { return null; }
 }

 function addressOf(visit) {
  try {
   const h = (typeof allHouseholds !== 'undefined' ? allHouseholds : []).find(item => String(item.client_id) === String(visit.client_id));
   if (!h) return '';
   const cityState = [h.city, h.state].filter(Boolean).join(', ');
   const cityStateZip = `${cityState}${h.zip_code ? ` ${h.zip_code}` : ''}`.trim();
   return [h.street_address, h.address_line_2, cityStateZip].filter(Boolean).join(', ');
  } catch { return ''; }
 }

 function petNamesOf(visit) {
  try {
   const pets = typeof getAdminPetsForVisit === 'function' ? getAdminPetsForVisit(visit) : [];
   return pets.map(p => p.name).filter(Boolean);
  } catch { return []; }
 }

 function shortService(visit) {
  return String(visit.service_name || visit.service_type || 'Service')
   .replace(/\s+-\s+/g, ' \u00b7 ')
   .replace(/(\d+)\s*Minutes?/i, '$1 min');
 }

 function serviceKind(visit) {
  const name = `${visit.service_name || ''} ${visit.service_type || ''}`.toLowerCase();
  if (/meet\s*(&|and)?\s*greet/.test(name)) return 'meet';
  if (/drop/.test(name)) return 'dropin';
  if (/walk/.test(name)) return 'walk';
  return 'other';
 }

 function startHour(visit) {
  const text = String(visit.time_window || visit.start_time || '').toUpperCase();
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
  if (!m) return null;
  let hour = Number(m[1]);
  let period = m[3];
  if (!period) { const later = text.match(/(AM|PM)/); period = later ? later[1] : null; }
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  if (!period && hour < 7) hour += 12;
  return hour;
 }

 function dayPart(visit) {
  const h = startHour(visit);
  if (h == null) return 'Anytime';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
 }

 function fmtStatus(value) {
  try { return typeof formatStatus === 'function' ? formatStatus(value) : String(value || ''); } catch { return String(value || ''); }
 }

 function canFocus(visit) {
  return Boolean(visit && !isCancelled(visit));
 }

 const isPickupCard = card => /pickup/i.test(card?.querySelector('.admin-service-top h5')?.textContent || '');

 function findListCard(visitId, pickup) {
  const container = document.getElementById('admin-day-services');
  if (!container) return null;
  const cards = [...container.querySelectorAll(`:scope > .admin-service-card[data-schedule-visit-id="${visitId}"]`)];
  return cards.find(card => isPickupCard(card) === Boolean(pickup)) || cards[0] || null;
 }


 function ensureStyles() {
  if (document.getElementById('pis-visit-focus-styles')) return;
  const style = document.createElement('style');
  style.id = 'pis-visit-focus-styles';
  style.textContent = `
   .vfm { position: fixed; inset: 0; z-index: 100000; display: flex; justify-content: center; }
   .vfm[hidden] { display: none; }
   .vfm-backdrop { position: absolute; inset: 0; background: rgba(15, 35, 60, 0.45); }
   .vfm-sheet {
    position: relative; display: flex; flex-direction: column;
    width: 100%; max-width: 680px; height: 100%;
    background: #f4f8fc;
    box-shadow: 0 10px 40px rgba(0,0,0,0.25);
   }
   @media (min-width: 720px) {
    .vfm { align-items: center; }
    .vfm-sheet { height: auto; max-height: 92vh; border-radius: 22px; overflow: hidden; }
   }
   .vfm-header {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: calc(env(safe-area-inset-top, 0px) + 14px) 18px 14px;
    background: #ffffff; border-bottom: 1px solid #dbe7f3;
   }
   .vfm-eyebrow { display: block; font-size: 12px; font-weight: 800; letter-spacing: .12em; color: #2a7fd4; }
   .vfm-title { display: block; font-size: 17px; font-weight: 700; color: #16324f; margin-top: 2px; }
   .vfm-timer { display: block; font-size: 15px; font-weight: 600; color: #46617d; margin-top: 4px; font-variant-numeric: tabular-nums; }
   .vfm-timer.is-live { color: #1f7a3a; }
   .vfm .vfm-close {
    flex: none; box-sizing: border-box;
    display: inline-flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; min-width: 0; min-height: 0;
    margin: 0; padding: 0; border-radius: 14px;
    border: 1px solid #c9d9ea; background: #ffffff; color: #2a5d8f;
    cursor: pointer; box-shadow: none;
   }
   .vfm .vfm-close svg { display: block; width: 20px; height: 20px; }
   .vfm-hidden { display: none !important; }
   .vfm-body.vfm-report-mode > .admin-service-card {
    padding: 0; border: 0; background: transparent; box-shadow: none;
   }
   .vfm-body {
    flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
    padding: 16px 14px 0;
    display: flex; flex-direction: column; gap: 12px;
   }
   .vfm-body.vfm-report-mode { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px); }
   .vfm-body > * { flex-shrink: 0 !important; }   /* never squash content: let the popup scroll instead */
   .vfm-body > .admin-service-card { margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
   .vfm-body > .admin-service-card > .admin-visit-progress { margin: 0 !important; border-top: 0 !important; padding: 18px !important; }
   .vfm-body > .admin-service-card > .admin-boarding-walk-panel {
    margin: 0 !important; padding: 18px !important; border: 0 !important; border-top: 1px solid #e3ebf3 !important;
    border-radius: 0 !important; box-shadow: none !important; background: #ffffff !important;
   }
   .vfm-body > .admin-service-card .admin-completed-visit-actions:empty { display: none !important; }
   html.vfm-lock, html.vfm-lock body { overflow: hidden; }

   /* ----- popup: summary, quick actions, pinned buttons ----- */
   .vfm-body > .admin-service-card > .admin-service-top,
   .vfm-body > .admin-service-card > .admin-service-main-grid,
   .vfm-body > .admin-service-card > .admin-visit-progress-icon,
   .vfm-body .pis-row { display: none !important; }
   .vfm-body.vfm-report-mode > .pis-summary,
   .vfm-body.vfm-report-mode > .pis-footer { display: none !important; }
   .pis-summary {
    background: #ffffff; border: 1px solid #dbe7f3; border-radius: 18px; padding: 16px;
    display: flex; flex-direction: column; gap: 14px; color: #16324f;
   }
   .pis-sum-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
   .pis-sum-name { display: block; font-size: 20px; font-weight: 700; }
   .pis-sum-time { display: block; font-size: 14px; color: #46617d; margin-top: 3px; }
   .pis-pills { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
   .pis-pill { font-size: 12px; font-weight: 700; border-radius: 999px; padding: 4px 10px; color: #46617d; background: #eef4fb; white-space: nowrap; }
   .pis-pill-checked_in { color: #8a5200; background: #fbe3b8; }
   .pis-pill-completed { color: #1f7a3a; background: #e3f3e6; }
   .pis-pets { display: flex; gap: 8px; flex-wrap: wrap; }
   .pis-pet { font-size: 15px; font-weight: 700; background: #eef4fb; border-radius: 999px; padding: 6px 14px; }
   .pis-quick { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
   .pis-quick a, .pis-quick span {
    height: 64px; border-radius: 14px; background: #eef4fb; color: #1f63b8; text-decoration: none;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    font-size: 13px; font-weight: 700;
   }
   .pis-quick span { color: #9bb0c6; }
   .pis-quick svg { width: 22px; height: 22px; }
   .pis-sum-foot { font-size: 14px; color: #46617d; }
   .pis-footer {
    position: sticky; bottom: 0; z-index: 2; margin: auto -14px 0;
    padding: 12px 14px calc(env(safe-area-inset-bottom, 0px) + 18px);
    background: #ffffff; border-top: 1px solid #dbe7f3;
    display: flex; flex-direction: column; gap: 10px;
   }
   .pis-footer:empty { display: none; }
   .pis-footer > button { width: 100%; margin: 0; }

   /* ----- compact schedule list -----
      Every rule is locked with !important because portal.css styles
      all buttons as full-width blocks (button { width: 100%; padding: 14px }). */
   #admin-day-services > .admin-service-card.pis-compact {
    padding: 0 !important; margin: 0 0 10px !important; border: 0 !important;
    background: transparent !important; box-shadow: none !important;
    overflow: visible !important; min-height: 0 !important; transform: none !important;
   }
   #admin-day-services > .admin-service-card.pis-compact::before,
   #admin-day-services > .admin-service-card.pis-compact::after { display: none !important; }
   #admin-day-services > .admin-service-card.pis-compact > :not(.pis-row) { display: none !important; }
   #admin-day-services .pis-row, #admin-day-services .pis-row * { box-sizing: border-box !important; }
   #admin-day-services .pis-row {
    display: flex !important; flex-direction: row !important; align-items: center !important; gap: 10px !important;
    width: 100% !important; margin: 0 !important; padding: 12px !important;
    border-radius: 16px !important; background: #ffffff !important; border: 1px solid #dbe7f3 !important;
    color: #16324f !important; text-align: left !important; font-family: inherit !important;
   }
   #admin-day-services .pis-row.is-live { background: #fff7ea !important; border-color: #f0cf96 !important; box-shadow: 0 6px 18px rgba(178,106,0,.12) !important; }
   #admin-day-services .pis-row.is-cancelled { background: #fffafa !important; border-color: #f3c4c0 !important; }
   #admin-day-services .pis-row-icon {
    flex: 0 0 32px !important; width: 32px !important; height: 32px !important; margin: 0 !important; padding: 0 !important;
    border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important;
    background: #e8f0f9 !important; color: #46617d !important; font-size: 14px !important; font-weight: 700 !important; line-height: 1 !important;
   }
   #admin-day-services .pis-row-icon { position: relative !important; border-radius: 12px !important; flex-basis: 40px !important; width: 40px !important; height: 40px !important; }
   #admin-day-services .pis-row-icon > svg { width: 20px !important; height: 20px !important; display: block !important; }
   #admin-day-services .pis-row.kind-walk .pis-row-icon { background: #e1edfc !important; color: #1f63b8 !important; }
   #admin-day-services .pis-row.kind-dropin .pis-row-icon { background: #d9f2ef !important; color: #0e7a72 !important; }
   #admin-day-services .pis-row.kind-meet .pis-row-icon { background: #ebe5fb !important; color: #6a45c2 !important; }
   #admin-day-services .pis-row.kind-boarding .pis-row-icon { background: #fdebd9 !important; color: #c0610c !important; }
   #admin-day-services .pis-group-boarding .pis-group-count { color: #c0610c !important; background: #fdebd9 !important; }
   #admin-day-services .pis-row.kind-other .pis-row-icon { background: #e8f0f9 !important; color: #46617d !important; }
   #admin-day-services .pis-row-status {
    position: absolute !important; right: -5px !important; bottom: -5px !important;
    width: 20px !important; height: 20px !important; border-radius: 50% !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    border: 2px solid #ffffff !important; color: #ffffff !important;
   }
   #admin-day-services .pis-row-status svg { width: 11px !important; height: 11px !important; display: block !important; }
   #admin-day-services .pis-row.is-done .pis-row-status { background: #2e8b4a !important; }
   #admin-day-services .pis-row.is-live .pis-row-status { background: #d98a00 !important; border-color: #fff7ea !important; }
   #admin-day-services .pis-row.is-cancelled .pis-row-status { background: #c62828 !important; border-color: #fffafa !important; }
   #admin-day-services .pis-row.is-cancelled .pis-row-icon { background: #f6e3e1 !important; color: #b07a76 !important; }
   #admin-day-services .pis-row.is-done { background: #f0f9f2 !important; border-color: #c9e8d1 !important; }
   #admin-day-services .pis-row.is-done .pis-row-status { border-color: #f0f9f2 !important; }
   #admin-day-services .pis-row.is-done .pis-badge-done { background: #dcf1e2 !important; }
   #admin-day-services .pis-group {
    display: flex !important; align-items: center !important; gap: 8px !important;
    margin: 18px 2px 8px !important; font-size: 12px !important; font-weight: 800 !important;
    letter-spacing: .1em !important; text-transform: uppercase !important; color: #46617d !important;
   }
   #admin-day-services .pis-group:first-child { margin-top: 2px !important; }
   #admin-day-services .pis-group-count {
    font-size: 11px !important; letter-spacing: 0 !important; color: #1f63b8 !important;
    background: #e3effb !important; border-radius: 999px !important; padding: 1px 8px !important;
   }
   #admin-day-services .pis-group-cancelled { color: #a0504b !important; }
   #admin-day-services .pis-group-cancelled .pis-group-count { color: #c62828 !important; background: #fdecea !important; }
   #admin-day-services button.pis-row-main {
    all: unset !important; box-sizing: border-box !important;
    flex: 1 1 auto !important; min-width: 0 !important; width: auto !important;
    display: flex !important; flex-direction: column !important; align-items: flex-start !important; gap: 3px !important;
    margin: 0 !important; padding: 0 !important; text-align: left !important; cursor: pointer !important;
    font-family: inherit !important; color: inherit !important;
   }
   #admin-day-services .pis-row.is-cancelled button.pis-row-main { cursor: default !important; }
   #admin-day-services .pis-row-main > span { display: block !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
   #admin-day-services .pis-row-meta {
    display: flex !important; align-items: center !important; gap: 8px !important; flex-wrap: wrap !important;
    font-size: 13px !important; font-weight: 600 !important; line-height: 1.3 !important; color: #46617d !important;
   }
   #admin-day-services .pis-row.is-live .pis-row-meta, #admin-day-services .pis-row.is-live .pis-row-sub { color: #6b4a14 !important; }
   #admin-day-services .pis-row.is-cancelled .pis-row-meta, #admin-day-services .pis-row.is-cancelled .pis-row-sub { color: #8a5a58 !important; }
   #admin-day-services .pis-badge { display: inline-block !important; font-size: 11px !important; font-weight: 700 !important; line-height: 1.4 !important; border-radius: 999px !important; padding: 1px 8px !important; }
   #admin-day-services .pis-badge-done { color: #1f7a3a !important; background: #e3f3e6 !important; }
   #admin-day-services .pis-badge-cancelled { color: #c62828 !important; background: #fdecea !important; }
   #admin-day-services .pis-row-title {
    font-size: 16px !important; font-weight: 700 !important; line-height: 1.25 !important; color: #16324f !important;
    white-space: normal !important; overflow-wrap: anywhere !important; width: 100% !important;
    display: -webkit-box !important; -webkit-box-orient: vertical !important; -webkit-line-clamp: 2 !important; overflow: hidden !important;
   }
   #admin-day-services .pis-row.is-cancelled .pis-row-title { color: #5e4746 !important; }
   #admin-day-services .pis-row-sub {
    font-size: 14px !important; line-height: 1.3 !important; color: #46617d !important;
    white-space: normal !important; width: 100% !important;
    display: -webkit-box !important; -webkit-box-orient: vertical !important; -webkit-line-clamp: 2 !important; overflow: hidden !important;
   }
      #admin-day-services .pis-live-timer { font-variant-numeric: tabular-nums !important; }
   #admin-day-services button.pis-row-action {
    flex: 0 0 auto !important; width: auto !important; min-width: 0 !important; max-width: none !important;
    height: 40px !important; min-height: 0 !important; margin: 0 !important; padding: 0 12px !important;
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    border-radius: 12px !important; border: 0 !important; background: #1f63b8 !important; color: #ffffff !important;
    box-shadow: none !important; transform: none !important;
    font-family: inherit !important; font-size: 13.5px !important; font-weight: 700 !important; line-height: 1 !important;
    white-space: nowrap !important; cursor: pointer !important;
   }
   #admin-day-services button.pis-row-action.is-secondary { background: #ffffff !important; color: #1f63b8 !important; border: 1px solid #c9d9ea !important; }

   /* Phones: flatten the panels around the day's visits so rows get the full width
      (the list sat inside three padded boxes and was only ~266px wide). */
   @media (max-width: 700px) {
    .admin-page #admin-screen-schedule { padding-left: 0 !important; padding-right: 0 !important; }
    .admin-page #admin-screen-schedule .admin-calendar-section { padding-left: 12px !important; padding-right: 12px !important; }
    .admin-page #admin-screen-schedule .admin-selected-day {
     padding: 4px 0 0 !important; border: 0 !important; background: transparent !important; box-shadow: none !important;
    }
    .admin-page #admin-screen-schedule .admin-selected-day-heading { margin-bottom: 12px !important; }
   }

   /* Popup buttons we create also need to beat the global button rule. */
   .vfm .pis-quick a, .vfm .pis-quick span { box-sizing: border-box; }
  `;
  document.head.appendChild(style);
 }

 // ---------- 2. Build the popup ----------
 function buildModal() {
  if (modal) return;

  ensureStyles();

  modal = document.createElement('div');
  modal.className = 'vfm';
  modal.hidden = true;
  modal.innerHTML = `
   <div class="vfm-backdrop"></div>
   <section class="vfm-sheet" role="dialog" aria-modal="true" aria-labelledby="vfm-title">
    <header class="vfm-header">
     <div>
      <span class="vfm-eyebrow">CURRENT VISIT</span>
      <strong class="vfm-title" id="vfm-title"></strong>
      <span class="vfm-timer"></span>
     </div>
     <button type="button" class="vfm-close" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
     </button>
    </header>
    <div class="vfm-body"></div>
   </section>`;
  document.body.appendChild(modal);

  body = modal.querySelector('.vfm-body');
  timerEl = modal.querySelector('.vfm-timer');
  titleEl = modal.querySelector('.vfm-title');

  // Same handlers as the schedule list -> every card button works identically.
  captured.forEach(([type, listener, options]) => nativeAdd.call(body, type, listener, options));

  modal.querySelector('.vfm-close').addEventListener('click', () => requestClose());

  // Report "Cancel" inside the popup closes the popup for completed visits.
  nativeAdd.call(body, 'click', event => {
   if (!event.target.closest('[data-visit-report-close]')) return;
   setTimeout(() => {
    const visit = findVisit(focusedVisitId);
    if (visit && progressOf(visit).state === 'completed') closeFocus({ scrollToCard: true });
    else applyReportMode();
   }, 0);
  });

  // Android back button / browser back closes the popup.
  window.addEventListener('popstate', () => {
   if (!focusedVisitId) return;
   historyPushed = false;
   requestClose({ fromHistory: true });
  });
 }

 // ---------- 3. Put the real card into the popup ----------
 function mountCard() {
  const visit = findVisit(focusedVisitId);
  if (!visit) return;
  body.replaceChildren();

  const listCard = findListCard(visit.id, focusedIsPickup);

  if (listCard) {
   body.appendChild(listCard);           // move (not copy) -> no duplicate IDs
  } else if (isBoarding(visit) && typeof buildAdminBoardingCard === 'function') {
   body.innerHTML = buildAdminBoardingCard(visit);
   const card = body.querySelector('.admin-service-card');
   if (card) card.dataset.scheduleVisitId = String(visit.id);
  } else if (typeof buildAdminServiceCard === 'function') {
   body.innerHTML = buildAdminServiceCard(visit);
   const card = body.querySelector('.admin-service-card');
   if (card) card.dataset.scheduleVisitId = String(visit.id);
  }

  reportModeActive = null;
  body.classList.remove('vfm-report-mode');
  const card = body.querySelector('.admin-service-card');
  card?.querySelectorAll('.vfm-open-visit-button').forEach(button => button.remove());
  if (card) decoratePopup(visit, card);
  updateHeader();
 }

 function buildSummary(visit, card) {
  const boarding = isBoarding(visit);
  const client = clientOf(visit);
  const name = client?.full_name || client?.email || 'Client';
  const phone = String(client?.phone || '').trim();
  const phoneDigits = phone.replace(/[^\d+]/g, '');
  const address = addressOf(visit);
  const pets = petNamesOf(visit);
  const p = progressOf(visit);
  const price = Number(visit.price || 0);

  const quick = (enabled, href, icon, label, external) => enabled
   ? `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${icon}${label}</a>`
   : `<span aria-disabled="true">${icon}${label}</span>`;

  const section = document.createElement('section');
  section.className = 'pis-summary';
  section.innerHTML = `
   <div class="pis-sum-top">
    <div>
     <strong class="pis-sum-name">${esc(name)}</strong>
     <span class="pis-sum-time">${esc(boarding ? (card?.querySelector('.admin-service-time')?.textContent.trim() || '') : (visit.time_window || 'Time not set'))}</span>
    </div>
    <div class="pis-pills">
     ${boarding
      ? `<span class="pis-pill pis-pill-${esc(boardingState(card))}">${esc(card?.querySelector('.admin-service-statuses .service-status')?.textContent.trim() || 'Boarding')}</span>`
      : `<span class="pis-pill pis-pill-${esc(p.state)}">${esc(fmtStatus(visit.status))}</span>`}
     ${visit.payment_status ? `<span class="pis-pill">${esc(fmtStatus(visit.payment_status))}</span>` : ''}
    </div>
   </div>
   ${pets.length ? `<div class="pis-pets">${pets.map(n => `<span class="pis-pet">${esc(n)}</span>`).join('')}</div>` : ''}
   <div class="pis-quick">
    ${quick(Boolean(phoneDigits), `tel:${phoneDigits}`, ICONS.call, 'Call')}
    ${quick(Boolean(phoneDigits), `sms:${phoneDigits}`, ICONS.text, 'Text')}
    ${quick(Boolean(address), `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, ICONS.nav, 'Navigate', true)}
   </div>
   <span class="pis-sum-foot">${esc(boarding ? (address || 'Address not added') : [address || 'Address not added', `$${price.toFixed(2)}`].join(' \u00b7 '))}</span>`;
  return section;
 }

 function boardingState(card) {
  if (!card) return 'scheduled';
  if (card.classList.contains('admin-service-card-completed')) return 'completed';
  if (card.classList.contains('admin-service-card-in-progress')) return 'checked_in';
  return 'scheduled';
 }

 function decoratePopup(visit, card) {
  body.querySelectorAll(':scope > .pis-summary, :scope > .pis-footer').forEach(el => el.remove());
  body.insertBefore(buildSummary(visit, card), card);

  // Pin the visit's action buttons to the bottom of the popup.
  const footer = document.createElement('div');
  footer.className = 'pis-footer';
  const mount = document.getElementById(`admin-visit-report-${visit.id}`);
  card.querySelectorAll('button[data-visit-action], button[data-visit-report-open], button[data-admin-client-report-view], button[data-boarding-action="start"], button[data-boarding-action="end"], button[data-boarding-walk-action="start"], button[data-boarding-walk-action="finish"], button[data-boarding-walk-action="resume"], button[data-boarding-walk-action="sync"], button[data-boarding-update-visit]')
   .forEach(button => { if (!mount || !mount.contains(button)) footer.appendChild(button); });
  footer.querySelectorAll('button[data-boarding-walk-action]').forEach(button => footer.prepend(button));
  body.appendChild(footer);
 }

 // ---------- 3b. Report view: show only the report inside the popup ----------
 let reportModeActive = null;

 function applyReportMode() {
  if (!body || !focusedVisitId) return;
  const card = body.querySelector('.admin-service-card');
  const reportOpen =
   typeof activeVisitReportVisitId !== 'undefined' &&
   Number(activeVisitReportVisitId) === Number(focusedVisitId);
  const mount = document.getElementById(`admin-visit-report-${focusedVisitId}`);
  const showing = Boolean(reportOpen && mount && card?.contains(mount) && mount.innerHTML.trim());
  const isPreview = showing && Boolean(mount.querySelector('.admin-client-report-preview') || /client report preview/i.test(mount.textContent || ''));
  const mode = showing ? (isPreview ? 'preview' : 'edit') : null;

  const hiddenApplied = Boolean(card?.querySelector('.vfm-hidden'));
  if (mode === reportModeActive && (mode ? hiddenApplied : !hiddenApplied)) return;
  reportModeActive = mode;

  body.querySelectorAll('.vfm-hidden').forEach(el => el.classList.remove('vfm-hidden'));
  body.classList.toggle('vfm-report-mode', Boolean(mode));

  if (mode) {
   // Hide everything in the card except the path down to the report.
   let node = mount;
   while (node && node !== card) {
    const parent = node.parentElement;
    if (!parent) break;
    [...parent.children].forEach(child => { if (child !== node) child.classList.add('vfm-hidden'); });
    node = parent;
   }
   body.scrollTop = 0;
  }
  updateHeader();
 }

 function updateHeader() {
  const visit = findVisit(focusedVisitId);
  if (!visit || !titleEl) return;
  const serviceName = isBoarding(visit)
   ? (focusedIsPickup ? 'Boarding Pickup' : 'Dog Boarding')
   : shortService(visit);
  const eyebrow = modal.querySelector('.vfm-eyebrow');
  eyebrow.textContent =
   reportModeActive === 'edit' ? 'VISIT REPORT' :
   reportModeActive === 'preview' ? 'CLIENT REPORT' :
   isBoarding(visit) ? 'BOARDING STAY' : 'CURRENT VISIT';
  titleEl.textContent = serviceName;
 }

 // ---------- 4. Visit timer ----------
 function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
 }

 function tick() {
  const visit = findVisit(focusedVisitId);
  if (!visit || !timerEl) return;
  applyReportMode();
  const p = progressOf(visit);
  timerEl.classList.remove('is-live');
  if (isBoarding(visit)) {
   const card = body.querySelector('.admin-service-card');
   const walkLive = card?.querySelector('[id^="admin-walk-duration-"]');
   timerEl.textContent = walkLive
    ? `Boarding walk ${walkLive.textContent.trim()}`
    : (card?.querySelector('.admin-service-statuses .service-status')?.textContent.trim() || 'Boarding');
   if (walkLive || boardingState(card) === 'checked_in') timerEl.classList.add('is-live');
   return;
  }
  if (p.state === 'checked_in' && visit.checked_in_at) {
   timerEl.textContent = `Visit time ${formatClock((Date.now() - Date.parse(visit.checked_in_at)) / 1000)}`;
   timerEl.classList.add('is-live');
  } else if (p.state === 'completed') {
   const minutes = p.minutes ?? (typeof getVisitDurationMinutes === 'function' ? getVisitDurationMinutes(visit) : null);
   timerEl.textContent = minutes != null ? `Completed · ${minutes} min` : 'Completed';
  } else {
   timerEl.textContent = 'Not started';
  }
 }

 // ---------- 5. Open / close ----------
 function openFocus(visitId, pickup = null) {
  const visit = findVisit(visitId);
  if (!canFocus(visit)) return false;
  buildModal();

  const samePickup = pickup === null || Boolean(pickup) === focusedIsPickup;
  const alreadyOpen = Number(focusedVisitId) === Number(visitId) && samePickup && !modal.hidden;
  if (pickup !== null) focusedIsPickup = Boolean(pickup);
  else if (Number(focusedVisitId) !== Number(visitId)) focusedIsPickup = false;
  focusedVisitId = Number(visitId);
  if (!alreadyOpen) mountCard();

  modal.hidden = false;
  document.documentElement.classList.add('vfm-lock');

  if (!historyPushed) {
   try { history.pushState({ vfm: focusedVisitId }, ''); historyPushed = true; } catch { /* ignore */ }
  }

  clearInterval(timerHandle);
  tick();
  timerHandle = setInterval(tick, 1000);

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: focusedVisitId, at: Date.now() })); } catch { /* ignore */ }
  return true;
 }

 function closeFocus({ scrollToCard = false, fromHistory = false } = {}) {
  if (!focusedVisitId) return;
  const visitId = focusedVisitId;

  focusedVisitId = null;
  reportModeActive = null;
  body.classList.remove('vfm-report-mode');
  clearInterval(timerHandle);
  modal.hidden = true;
  body.replaceChildren();
  document.documentElement.classList.remove('vfm-lock');
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }

  if (historyPushed && !fromHistory) {
   historyPushed = false;
   try { history.back(); } catch { /* ignore */ }
  }

  // Put the card back in the schedule list.
  try { renderAdminDayServices(); } catch { /* ignore */ }

  if (scrollToCard) {
   requestAnimationFrame(() => {
    document.querySelector(`#admin-day-services [data-schedule-visit-id="${visitId}"]`)
     ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
   });
  }
 }

 function requestClose({ fromHistory = false } = {}) {
  if (!focusedVisitId) return;
  const editingReport =
   typeof activeVisitReportVisitId !== 'undefined' &&
   Number(activeVisitReportVisitId) === Number(focusedVisitId) &&
   body.querySelector('[data-visit-report-form]');

  if (editingReport && !window.confirm('Close without saving this visit report?')) {
   if (fromHistory) { try { history.pushState({ vfm: focusedVisitId }, ''); historyPushed = true; } catch { /* ignore */ } }
   return;
  }

  try {
   if (typeof activeVisitReportVisitId !== 'undefined' && Number(activeVisitReportVisitId) === Number(focusedVisitId)) {
    closeAdminVisitReport();
   }
  } catch { /* ignore */ }

  closeFocus({ scrollToCard: true, fromHistory });
 }

 // ---------- 6. Hook into the portal (after admin.js has loaded) ----------
 function wrapAsync(name, before, after) {
  const original = window[name];
  if (typeof original !== 'function') return;
  window[name] = async function (...args) {
   if (before) before(...args);
   const result = await original.apply(this, args);
   if (after) after(result, ...args);
   return result;
  };
 }

 let liveRowTimer = null;

 function updateLiveTimers() {
  document.querySelectorAll('#admin-day-services .pis-live-timer[data-since]').forEach(el => {
   const since = Date.parse(el.dataset.since);
   if (Number.isFinite(since)) el.textContent = formatClock((Date.now() - since) / 1000);
  });
 }

 function buildBoardingRow(card, visit) {
  const pickup = isPickupCard(card);
  const cancelled = !pickup && isCancelled(visit);
  const state = cancelled ? 'cancelled' : boardingState(card);
  const client = clientOf(visit);
  const clientName = client?.full_name || client?.email || 'Client';
  const pets = petNamesOf(visit);
  const dates = card.querySelector('.admin-service-time')?.textContent.trim() || '';
  const statusText = card.querySelector('.admin-service-statuses .service-status')?.textContent.trim() || '';
  const walkLive = card.querySelector('button[data-boarding-walk-action="finish"]');

  let rowClass = '', meta = esc(dates);
  if (state === 'checked_in') { rowClass = 'is-live'; if (walkLive) meta = `${esc(dates)} \u00b7 walk in progress`; }
  if (state === 'completed') { rowClass = 'is-done'; meta += ' <span class="pis-badge pis-badge-done">Complete</span>'; }
  if (state === 'cancelled') { rowClass = 'is-cancelled'; meta += ' <span class="pis-badge pis-badge-cancelled">Cancelled</span>'; }
  const sub = state === 'cancelled'
   ? 'This reserved night was cancelled.'
   : [clientName, pets.join(', ')].filter(Boolean).join(' \u00b7 ');
  const statusBadge = { completed: ICONS.check, checked_in: ICONS.clock, cancelled: ICONS.x }[state] || '';

  // One button that matches the stay's state.
  let action = null;
  const startBtn = card.querySelector('button[data-boarding-action="start"]');
  const endBtn = card.querySelector('button[data-boarding-action="end"]');
  if (!cancelled) {
   if (startBtn && !startBtn.disabled) action = { label: 'Start Boarding', run: () => startBtn.click() };
   else if (endBtn && !endBtn.disabled) action = { label: 'End Boarding', run: () => endBtn.click() };
   else if (state === 'completed') action = { label: 'View', secondary: true, run: () => openFocus(visit.id, pickup) };
   else action = { label: 'Open', run: () => openFocus(visit.id, pickup) };
  }

  const title = pickup ? 'Boarding Pickup' : 'Dog Boarding';
  const row = document.createElement('div');
  row.className = `pis-row ${rowClass} kind-boarding`;
  row.innerHTML = `
   <div class="pis-row-icon" aria-hidden="true">${ICONS.moon}${statusBadge ? `<span class="pis-row-status">${statusBadge}</span>` : ''}</div>
   <button type="button" class="pis-row-main"${cancelled ? ' disabled' : ''} aria-label="Open ${esc(title)} for ${esc(clientName)}">
    <span class="pis-row-meta">${meta}</span>
    <span class="pis-row-title">${esc(title)}</span>
    <span class="pis-row-sub">${esc(sub)}</span>
   </button>
   ${action ? `<button type="button" class="pis-row-action${action.secondary ? ' is-secondary' : ''}">${esc(action.label)}</button>` : ''}`;

  if (!cancelled) row.querySelector('.pis-row-main').addEventListener('click', () => openFocus(visit.id, pickup));
  if (action) row.querySelector('.pis-row-action').addEventListener('click', event => { event.stopPropagation(); action.run(); });

  card.classList.add('pis-compact');
  card.prepend(row);
 }

 function compactSchedule() {
  const container = document.getElementById('admin-day-services');
  if (!container) return;
  container.querySelectorAll(':scope > .pis-group').forEach(el => el.remove());

  container.querySelectorAll(':scope > .admin-service-card[data-schedule-visit-id]').forEach(card => {
   const visit = findVisit(card.dataset.scheduleVisitId);
   if (!visit) return;

   card.querySelector(':scope > .pis-row')?.remove();
   if (isBoarding(visit)) { buildBoardingRow(card, visit); return; }
   const cancelled = isCancelled(visit);
   const state = cancelled ? 'cancelled' : progressOf(visit).state;

   const client = clientOf(visit);
   const clientName = client?.full_name || client?.email || 'Client';
   const pets = petNamesOf(visit);
   const time = visit.time_window || 'Time not set';

   const kind = serviceKind(visit);
   const kindIcon = { walk: ICONS.paw, dropin: ICONS.house, meet: ICONS.people }[kind] || ICONS.dot;
   const statusBadge = { completed: ICONS.check, checked_in: ICONS.clock, cancelled: ICONS.x }[state] || '';
   let rowClass = '', meta = esc(time), sub = esc([clientName, pets.join(', ')].filter(Boolean).join(' \u00b7 '));
   if (state === 'completed') { rowClass = 'is-done'; meta += ' <span class="pis-badge pis-badge-done">Completed</span>'; }
   if (state === 'checked_in') {
    rowClass = 'is-live';
    meta = visit.checked_in_at
     ? `In progress \u00b7 <span class="pis-live-timer" data-since="${esc(visit.checked_in_at)}"></span>`
     : 'In progress';
   }
   if (state === 'cancelled') {
    rowClass = 'is-cancelled'; meta += ' <span class="pis-badge pis-badge-cancelled">Cancelled</span>';
    sub = esc(String(visit.cancellation_reason || '').trim() || `${clientName} \u00b7 cancelled`);
   }

   // One button that matches the visit's state.
   let action = null;
   if (state === 'scheduled') {
    const checkIn = card.querySelector('button[data-visit-action="check-in"]');
    action = checkIn
     ? { label: 'Check In', run: () => checkIn.click() }
     : { label: 'Open', run: () => openFocus(visit.id) };
   } else if (state === 'checked_in') {
    action = { label: 'Open', run: () => openFocus(visit.id) };
   } else if (state === 'completed') {
    const reportButton = card.querySelector('button[data-visit-report-open]');
    action = reportButton && /add/i.test(reportButton.textContent || '')
     ? { label: 'Add Report', run: () => reportButton.click() }
     : { label: 'View', secondary: true, run: () => openFocus(visit.id) };
   }

   const row = document.createElement('div');
   row.className = `pis-row ${rowClass} kind-${kind}`;
   row.innerHTML = `
    <div class="pis-row-icon" aria-hidden="true">${kindIcon}${statusBadge ? `<span class="pis-row-status">${statusBadge}</span>` : ''}</div>
    <button type="button" class="pis-row-main"${cancelled ? ' disabled' : ''} aria-label="Open ${esc(shortService(visit))} for ${esc(clientName)}">
     <span class="pis-row-meta">${meta}</span>
     <span class="pis-row-title">${esc(shortService(visit))}</span>
     <span class="pis-row-sub">${sub}</span>
    </button>
    ${action ? `<button type="button" class="pis-row-action${action.secondary ? ' is-secondary' : ''}">${esc(action.label)}</button>` : ''}`;

   if (!cancelled) row.querySelector('.pis-row-main').addEventListener('click', () => openFocus(visit.id));
   if (action) row.querySelector('.pis-row-action').addEventListener('click', event => { event.stopPropagation(); action.run(); });

   card.classList.add('pis-compact');
   card.prepend(row);
  });

  // Morning / Afternoon / Evening headers (cancelled visits get their own at the bottom).
  let lastGroup = null;
  const counts = {};
  // All-day boarding goes to the top of the day (cancelled nights stay at the bottom).
  [...container.querySelectorAll(':scope > .admin-service-card.pis-compact')]
   .filter(card => { const v = findVisit(card.dataset.scheduleVisitId); return isBoarding(v) && !(isCancelled(v) && !isPickupCard(card)); })
   .reverse()
   .forEach(card => container.insertBefore(card, container.querySelector(':scope > .admin-service-card.pis-compact')));

  const cards = [...container.querySelectorAll(':scope > .admin-service-card.pis-compact')];
  const groupOf = card => {
   const v = findVisit(card.dataset.scheduleVisitId);
   if (isCancelled(v) && !isPickupCard(card)) return 'Cancelled';
   return isBoarding(v) ? 'Boarding' : dayPart(v);
  };
  cards.forEach(card => { const g = groupOf(card); counts[g] = (counts[g] || 0) + 1; });
  if (cards.length > 1) {
   cards.forEach(card => {
    const g = groupOf(card);
    if (g === lastGroup) return;
    lastGroup = g;
    const header = document.createElement('div');
    header.className = `pis-group pis-group-${g.toLowerCase()}`;
    header.innerHTML = `<span>${esc(g)}</span><span class="pis-group-count">${counts[g]}</span>`;
    container.insertBefore(header, card);
   });
  }

  updateLiveTimers();
  if (!liveRowTimer) liveRowTimer = setInterval(updateLiveTimers, 1000);
 }

 function addOpenButtons() {
  // In-progress visits in the schedule list get an "Open Visit Screen" button,
  // so you can get back to the popup after closing it.
  document.querySelectorAll('#admin-day-services > .admin-service-card[data-schedule-visit-id]').forEach(card => {
   const visit = findVisit(card.dataset.scheduleVisitId);
   if (!canFocus(visit) || progressOf(visit).state !== 'checked_in') return;
   const copy = card.querySelector('.admin-visit-progress-copy');
   if (!copy || card.querySelector('.vfm-open-visit-button')) return;
   const button = document.createElement('button');
   button.type = 'button';
   button.className = 'secondary-button vfm-open-visit-button';
   button.textContent = 'Open Visit Screen';
   button.addEventListener('click', event => { event.stopPropagation(); openFocus(visit.id); });
   copy.parentElement.insertBefore(button, copy.nextSibling);
  });
 }

 function install() {
  // Stop recording listeners; we have what we need.
  EventTarget.prototype.addEventListener = nativeAdd;
  ensureStyles();

  // Re-render: keep the focused card in the popup instead of the list.
  const originalRender = window.renderAdminDayServices;
  if (typeof originalRender === 'function') {
   window.renderAdminDayServices = function (...args) {
    if (focusedVisitId && body) body.replaceChildren();   // avoid duplicate IDs
    const result = originalRender.apply(this, args);
    try {
     if (focusedVisitId) { mountCard(); tick(); }
     compactSchedule();
    } catch (e) { console.error('Visit focus render', e); }
    return result;
   };
  }

  // Check In -> open the popup.
  wrapAsync('checkInVisit', null, (_r, visitId) => {
   const v = findVisit(visitId);
   if (v && progressOf(v).state === 'checked_in') openFocus(visitId);
  });

  // Start Walk from the list -> open the popup too.
  wrapAsync('startVisitWalk', null, (_r, visitId) => { openFocus(visitId); });

  // Finish Visit -> close the popup and show the card with its stats.
  wrapAsync('finishVisit', null, (_r, visitId) => {
   const v = findVisit(visitId);
   if (Number(focusedVisitId) === Number(visitId) && v && progressOf(v).state === 'completed') {
    closeFocus({ scrollToCard: true });
   }
  });

  // Reopen Visit -> popup opens and the timer resumes.
  wrapAsync('reopenVisit', null, (_r, visitId) => { openFocus(visitId); });

  // Reports open inside the popup.
  wrapAsync('openAdminVisitReport', visitId => { openFocus(visitId); }, () => { applyReportMode(); });
  wrapAsync('openAdminClientVisitReportPreview', visitId => { openFocus(visitId); }, () => { applyReportMode(); });

  // Saving the report closes the popup.
  wrapAsync('saveAdminVisitReport', null, () => {
   if (!focusedVisitId) return;
   const reportStillOpen =
    typeof activeVisitReportVisitId !== 'undefined' &&
    Number(activeVisitReportVisitId) === Number(focusedVisitId);
   const v = findVisit(focusedVisitId);
   if (!reportStillOpen && v && progressOf(v).state === 'completed') closeFocus({ scrollToCard: true });
  });

  // After a reload (camera, phone memory), reopen the visit you were in.
  const reopenCheck = setInterval(() => {
   if (typeof currentUser === 'undefined' || !currentUser?.id) return;
   if (typeof allVisits === 'undefined' || !allVisits.length) return;
   clearInterval(reopenCheck);
   if (focusedVisitId) return;
   try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || Date.now() - Number(saved.at || 0) > REOPEN_WINDOW_MS) return;
    const v = findVisit(saved.id);
    if (v && progressOf(v).state === 'checked_in') openFocus(saved.id);
    else localStorage.removeItem(STORAGE_KEY);
   } catch { /* ignore */ }
  }, 500);
  setTimeout(() => clearInterval(reopenCheck), 60000);
 }

 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
 else install();
})();
