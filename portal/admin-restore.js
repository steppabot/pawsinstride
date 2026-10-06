/* ========================================
   ADMIN VIEW RESTORE
   ========================================
   Phones (Android app and iPhone PWA) often throw
   away a backgrounded page. This remembers where you
   were and puts you back there after a reload:
   tab, schedule date/month, scroll position, an open
   visit report, and an open message conversation.

   Load this AFTER admin.js. Works on the website/PWA
   and inside the Android app.
   ======================================== */
(() => {
 const KEY = 'pis-admin-last-view';
 const RESTORE_WINDOW_MS = 2 * 60 * 60 * 1000;   // restore if used within 2 hours
 const VALID_SCREENS = ['home', 'schedule', 'clients', 'more'];
 let ready = false;      // don't save until the startup restore has run
 let restoring = false;

 function readSaved() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
 }

 function save() {
  if (!ready || restoring) return;
  try {
   if (typeof currentUser === 'undefined' || !currentUser?.id) return;
   const drawer = document.getElementById('admin-message-drawer');
   const messagesOpen = Boolean(drawer?.classList.contains('is-open'));
   localStorage.setItem(KEY, JSON.stringify({
    userId: currentUser.id,
    savedAt: Date.now(),
    screen: typeof activeAdminScreen !== 'undefined' ? activeAdminScreen : 'home',
    date: typeof selectedAdminDate !== 'undefined' ? selectedAdminDate : null,
    year: typeof adminCalendarYear !== 'undefined' ? adminCalendarYear : null,
    month: typeof adminCalendarMonth !== 'undefined' ? adminCalendarMonth : null,
    scrollY: Math.round(window.scrollY || 0),
    reportVisitId: typeof activeVisitReportVisitId !== 'undefined' ? activeVisitReportVisitId : null,
    reportMode: reportMode(),
    messagesOpen,
    conversationId: messagesOpen && typeof activeAdminConversationId !== 'undefined' ? activeAdminConversationId : null
   }));
  } catch (e) { /* storage unavailable: nothing to do */ }
 }

 // "View Client Report" and "Edit Visit Report" share the same spot on the page,
 // so look at what is actually showing there.
 function reportMode() {
  try {
   if (typeof activeVisitReportVisitId === 'undefined' || !activeVisitReportVisitId) return null;
   const mount = document.getElementById(`admin-visit-report-${activeVisitReportVisitId}`);
   if (!mount || !mount.innerHTML.trim()) return null;
   if (mount.querySelector('.admin-client-report-preview') || /client report preview/i.test(mount.textContent || '')) return 'preview';
   return 'edit';
  } catch { return null; }
 }

 function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

 let restoreStarted = false;
 async function restore() {
  if (restoreStarted) return;   // only once per app start
  restoreStarted = true;
  const s = readSaved();
  restoring = true;
  try {
   if (!s || typeof currentUser === 'undefined' || !currentUser?.id) return;
   if (s.userId !== currentUser.id || Date.now() - Number(s.savedAt || 0) > RESTORE_WINDOW_MS) return;

   const screen = VALID_SCREENS.includes(s.screen) ? s.screen : 'home';

   if (screen === 'schedule' && s.date) {
    selectedAdminDate = s.date;
    if (Number.isInteger(s.year)) adminCalendarYear = s.year;
    if (Number.isInteger(s.month)) adminCalendarMonth = s.month;
   }

   if (screen !== 'home') showAdminAppScreen(screen);

   await wait(250);

   if (screen === 'schedule' && s.reportVisitId && s.reportMode) {
    try {
     if (s.reportMode === 'preview') await openAdminClientVisitReportPreview(s.reportVisitId);
     else await openAdminVisitReport(s.reportVisitId);
    } catch (e) { console.error('Restore: visit report', e); }
    await wait(150);
   }

   if (s.scrollY > 0) window.scrollTo({ top: s.scrollY, left: 0, behavior: 'auto' });

   if (s.messagesOpen) {
    try {
     setAdminNavigationState('messages');
     openAdminMessaging();
     if (s.conversationId) await openAdminConversation(s.conversationId);
    } catch (e) { console.error('Restore: messages', e); }
   }
  } catch (e) {
   console.error('Restore failed', e);
  } finally {
   restoring = false;
   ready = true;
   save();
  }
 }

 // Run the restore right after the portal finishes its normal startup.
 if (typeof setupAdminAppNavigation === 'function') {
  const originalSetup = setupAdminAppNavigation;
  setupAdminAppNavigation = function (...args) {
   const result = originalSetup.apply(this, args);
   void restore();
   return result;
  };
 } else {
  ready = true;
 }

 // If the dashboard was already showing before this file loaded
 // (instant start), run the restore now instead of waiting.
 if (!ready && document.getElementById('admin-content')?.style.display === 'block' &&
     typeof currentUser !== 'undefined' && currentUser?.id) {
  void restore();
 }

 // Save whenever you leave the app, and every few seconds while using it.
 document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
 window.addEventListener('pagehide', save);
 document.addEventListener('click', () => setTimeout(save, 400), true);
 setInterval(() => { if (!document.hidden) save(); }, 5000);
})();
