/* ========================================
   PAWS IN STRIDE: ANDROID APP PUSH NOTIFICATIONS
   ========================================
   Android app only (does nothing on the website, so the same file
   can live in both places).

   - Registers this phone for push for whoever is signed in:
     admin, employee or client
   - Tapping a notification opens the right screen in the app
   - Logging out unlinks this phone, so the next person to sign in
     doesn't get the previous person's alerts
   - window.PisNativePush lets the notification settings card show
     the real status and ask for permission
   ======================================== */
(() => {
 if (!window.Capacitor?.isNativePlatform?.()) return;
 const push = window.Capacitor.Plugins.PushNotifications;
 if (!push) { console.error('Native push: PushNotifications plugin is not installed'); return; }

 const TOKEN_KEY = 'pis-native-push-token';
 const OPEN_KEY = 'pis-native-push-open';
 let savedFor = null, pendingFor = null, busy = false;
 const waiters = [];

 function client() {
  return typeof supabaseClient !== 'undefined' && typeof supabaseClient?.rpc === 'function' ? supabaseClient : null;
 }
 function signedInUser() {
  return typeof currentUser !== 'undefined' && currentUser?.id ? currentUser : null;
 }
 function settle(result) {
  while (waiters.length) waiters.shift()(result);
 }

 push.addListener('registration', async ({ value }) => {
  const userId = pendingFor;
  try {
   const sbc = client();
   if (!sbc) throw Error('Supabase client not found');
   const { error } = await sbc.rpc('claim_native_push_token', { p_token: value, p_platform: 'android' });
   if (error) throw error;
   savedFor = userId;
   try { localStorage.setItem(TOKEN_KEY, value); } catch (e) { /* ignore */ }
   console.log('Native push: token saved');
   window.dispatchEvent(new Event('pis-native-push-change'));
   settle(true);
  } catch (e) {
   console.error('Native push: could not save token', e);
   settle(false);
  } finally {
   pendingFor = null;
  }
 });

 push.addListener('registrationError', e => {
  console.error('Native push: registration failed', e);
  pendingFor = null;
  settle(false);
 });

 // ---------- tapping a notification opens the right screen ----------
 function openFromNotification(url) {
  if (!url) return;
  try {
   const target = new URL(url, window.location.href);
   const ours = target.origin === window.location.origin || /(^|\.)pawsinstride\.com$/i.test(target.hostname);
   if (!ours) return;
   const path = target.pathname + target.search + target.hash;
   if (path === window.location.pathname + window.location.search + window.location.hash) return;
   window.location.href = path;
  } catch (e) {
   console.error('Native push: could not open notification link', e);
  }
 }
 push.addListener('pushNotificationActionPerformed', action => {
  const url = action?.notification?.data?.url || '';
  // Open it once the signed-in page is ready (a cold start may still be loading).
  if (signedInUser()) openFromNotification(url);
  else { try { sessionStorage.setItem(OPEN_KEY, url); } catch (e) { openFromNotification(url); } }
 });

 async function ensureRegistered(askNow = false) {
  if (busy || pendingFor) return null;
  const user = signedInUser();
  if (!user) return null;
  if (savedFor === user.id && !askNow) return true;
  busy = true;
  try {
   let perm = await push.checkPermissions();
   if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') perm = await push.requestPermissions();
   if (perm.receive !== 'granted') return false;
   await push.createChannel({
    id: 'paws_alerts',
    name: 'Paws in Stride alerts',
    description: 'Visits, walks, messages and booking updates',
    importance: 5,
    visibility: 1
   });
   pendingFor = user.id;
   const done = new Promise(resolve => {
    waiters.push(resolve);
    setTimeout(() => resolve(false), 15000);
   });
   await push.register();
   return await done;
  } catch (e) {
   pendingFor = null;
   console.error('Native push: setup failed', e);
   return false;
  } finally {
   busy = false;
  }
 }

 // Unlink this phone from the account that is signing out.
 async function release() {
  let token = null;
  try { token = localStorage.getItem(TOKEN_KEY); } catch (e) { /* ignore */ }
  savedFor = null;
  if (!token) return;
  try {
   const sbc = client();
   if (sbc) {
    const { error } = await sbc.rpc('release_native_push_token', { p_token: token });
    if (error) throw error;
   }
   localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
   console.error('Native push: could not unlink this phone', e);
  }
 }

 window.PisNativePush = {
  // 'granted', 'denied' or 'prompt'
  async status() {
   try {
    const perm = await push.checkPermissions();
    return perm.receive === 'prompt-with-rationale' ? 'prompt' : perm.receive;
   } catch (e) { return 'prompt'; }
  },
  async enable() {
   savedFor = null;
   await ensureRegistered(true);
   return this.status();
  },
  release
 };

 setInterval(() => {
  void ensureRegistered();
  if (signedInUser()) {
   let url = null;
   try { url = sessionStorage.getItem(OPEN_KEY); sessionStorage.removeItem(OPEN_KEY); } catch (e) { /* ignore */ }
   if (url) openFromNotification(url);
  }
 }, 3000);
 document.addEventListener('visibilitychange', () => { if (!document.hidden) void ensureRegistered(); });
})();
