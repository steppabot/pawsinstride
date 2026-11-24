// ========================================
// MESSAGES: A REAL INBOX (owner + team app)
// ========================================
// 1. ONLY REAL CONVERSATIONS. Every client has an empty thread waiting for them,
//    and the inbox used to list all of them ("No messages yet"). It now lists only
//    threads that hold at least one message.
// 2. ARCHIVE. Swipe a row to the left (on a computer: the archive button that shows
//    on hover) to move it out of the inbox. It waits under Archived and comes back
//    by itself the moment a newer message arrives. Archiving is per person. It is
//    saved to the account when the message_archives table exists
//    (5-paws-messages.sql), and to this device until then.
// 3. NEW MESSAGE. Pick any client and start the conversation, including clients
//    who have never written.
// 4. SWIPE BACK. On a phone, drag an open conversation to the right to return to
//    the inbox (the New Message list closes the same way). Android's Back does the
//    same before it closes Messages.
// 5. A TAB, NOT A FULL SCREEN (phones). The bottom menu stays while the inbox or the
//    New Message list is showing, so Messages behaves like the other tabs and the X is
//    not needed. Inside a conversation the menu slides away to leave room for the
//    reply box and the keyboard, and returns when you go back.
// Also: going back to the inbox on a phone stops marking that client's new messages
// as read, and the Messages tab shows the unread count.
// Client side: nothing changes (clients only ever see their one conversation).
// ========================================
(() => {
    'use strict';
    const listEl = () => document.getElementById('admin-conversation-list');
    if (window.PisMessages || !listEl()) return;

    // ---------- small helpers ----------
    const esc = value => (typeof escapeHtml === 'function' ? escapeHtml(String(value ?? ''))
        : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
    const svg = (inner, size = 20, width = 2) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
    const ICON = {
        archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
        restore: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M12 17v-5.5"/><path d="m9.5 13.5 2.5-2.5 2.5 2.5"/>',
        compose: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        back: '<path d="m15 18-6-6 6-6"/>'
    };
    const convs = () => (typeof adminConversations !== 'undefined' && Array.isArray(adminConversations) ? adminConversations : []);
    const profiles = () => (typeof allProfiles !== 'undefined' && Array.isArray(allProfiles) ? allProfiles : []);
    const me = () => (typeof currentUser !== 'undefined' && currentUser ? currentUser.id : null);
    const db = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    const activeId = () => (typeof activeAdminConversationId !== 'undefined' ? activeAdminConversationId : null);
    const drawer = () => document.getElementById('admin-message-drawer');
    const isPhone = () => window.matchMedia('(max-width: 700px)').matches;
    const calm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // only the owner can start a thread for a client who has never opened Messages
    const isOwner = () => window.PIS_STAFF_ROLE !== 'employee' && !document.body.classList.contains('pis-employee');
    const stamp = value => { const t = Date.parse(value || ''); return Number.isNaN(t) ? 0 : t; };
    const lastAt = conversation => conversation?.latestMessage?.created_at || '';
    const isReal = conversation => Boolean(conversation?.latestMessage);
    const nameOf = conversation => conversation?.client?.full_name || conversation?.client?.email || 'Client';
    const firstName = name => String(name || '').trim().split(/\s+/)[0] || 'this client';
    const find = id => convs().find(item => Number(item.id) === Number(id));
    const profileOf = clientId => profiles().find(item => String(item.id) === String(clientId)) || null;

    function shortTime(value) {
        const t = stamp(value);
        if (!t) return '';
        const date = new Date(t);
        const now = new Date();
        const dayStart = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const days = Math.round((dayStart(now) - dayStart(date)) / 86400000);
        if (days <= 0) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        if (days === 1) return 'Yesterday';
        if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }

    // ---------- look ----------
    const style = document.createElement('style');
    style.textContent = `
        /* heading: Inbox + count on the left, New Message on the right */
        .pis-msg-on .admin-message-inbox-heading { display: grid !important; grid-template-columns: minmax(0, 1fr) auto; column-gap: 10px; row-gap: 1px; align-items: center; padding: 12px 14px 11px !important; }
        .pis-msg-on .admin-message-inbox-heading > strong { grid-column: 1; font-size: 17px !important; line-height: 21px; font-weight: 800; color: #13233a; }
        .pis-msg-on .admin-message-inbox-heading > #admin-message-inbox-count { grid-column: 1; font-size: 12.5px !important; line-height: 16px; font-weight: 600; color: #5b6b80 !important; }
        .pis-msg-new { grid-column: 2; grid-row: 1 / span 2; display: inline-flex; align-items: center; gap: 7px; min-height: 44px; margin: 0; padding: 0 15px; border: 0; border-radius: 999px;
            background: linear-gradient(135deg, #1f74be, #17609f); color: #fff; font-family: inherit; font-size: 14px; font-weight: 800; white-space: nowrap; cursor: pointer;
            box-shadow: 0 4px 12px rgba(23, 96, 159, .22); -webkit-tap-highlight-color: transparent; }
        .pis-msg-new:active { transform: scale(.97); }
        .pis-msg-new:focus-visible, .pis-msg-tab:focus-visible, .pis-msg-person:focus-visible, .pis-msg-compose-close:focus-visible, .pis-msg-quick:focus-visible { outline: 3px solid #8fd0ff; outline-offset: 2px; }

        /* Inbox / Archived */
        .pis-msg-tabs { display: flex; gap: 6px; flex: 0 0 auto; padding: 9px 14px; border-bottom: 1px solid var(--pis-border, #dce8ef); background: #fff; }
        .pis-msg-tabs[hidden] { display: none; }
        .pis-msg-tab { display: inline-flex; align-items: center; justify-content: center; gap: 7px; flex: 1 1 0; width: auto; min-width: 0; min-height: 38px; margin: 0; padding: 0 12px; border-radius: 999px; border: 1px solid #c9d8e8; background: #fff;
            color: #2c4a6b; font-family: inherit; font-size: 13.5px; font-weight: 800; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .pis-msg-tab b { font-size: 12px; font-weight: 800; border-radius: 999px; padding: 1px 7px; background: #eef3f8; color: #4a5b70; }
        .pis-msg-tab[aria-pressed="true"] { background: linear-gradient(135deg, #1f74be, #17609f); border-color: #17609f; color: #fff; }
        .pis-msg-tab[aria-pressed="true"] b { background: rgba(255, 255, 255, .22); color: #fff; }

        /* rows */
        .pis-msg-on .admin-conversation-list { overscroll-behavior: contain; }
        .pis-msg-row { position: relative; overflow: hidden; border-bottom: 1px solid #e4ebf3; background: #fff; }
        .pis-msg-on .pis-msg-row > .admin-conversation-item { position: relative; z-index: 1; display: flex !important; flex-direction: row !important; align-items: center; gap: 11px; width: 100%;
            min-height: 70px; box-sizing: border-box; margin: 0; padding: 10px 14px !important; border: 0 !important; border-radius: 0; background: #fff; color: #13233a; font-family: inherit;
            text-align: left; touch-action: pan-y; -webkit-tap-highlight-color: transparent; will-change: transform; }
        .pis-msg-on .pis-msg-row > .admin-conversation-item.is-active { background: var(--pis-blue-soft, #eaf6fc); }
        .pis-msg-row .pis-client-avatar { pointer-events: none; }
        .pis-msg-text { flex: 1 1 auto; min-width: 0; display: block; }
        .pis-msg-on .admin-conversation-item-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; width: 100%; }
        .pis-msg-on .admin-conversation-item-top strong { flex: 1 1 auto; min-width: 0; font-size: 16px !important; line-height: 20px; font-weight: 800; color: #13233a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pis-msg-on .admin-conversation-time { flex: 0 0 auto; margin: 0 !important; font-size: 12px !important; line-height: 16px; font-weight: 600; color: #627184 !important; white-space: nowrap; }
        .pis-msg-line { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
        .pis-msg-on .admin-conversation-preview { flex: 1 1 auto; min-width: 0; width: auto; margin: 0 !important; font-size: 13.5px !important; line-height: 18px; font-weight: 500; color: #5b6b80 !important;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pis-msg-on .admin-conversation-preview b { font-weight: 700; color: #4a5b70; }
        .pis-msg-on .has-unread .admin-conversation-preview { color: #13233a !important; font-weight: 700; }
        .pis-msg-on .has-unread .admin-conversation-time { color: #1f5fbf !important; font-weight: 800; }
        .pis-msg-on .admin-conversation-unread { flex: 0 0 auto; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #1f74be !important; color: #fff; font-size: 11.5px !important; font-weight: 800; }

        /* what a swipe uncovers */
        .pis-msg-action { position: absolute; inset: 0; z-index: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; margin: 0;
            padding: 0 0 0 calc(100% - 96px); border: 0; border-radius: 0; background: linear-gradient(135deg, #1f74be, #17609f); color: #fff; font-family: inherit; font-size: 12.5px;
            font-weight: 800; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .pis-msg-action.is-restore { background: linear-gradient(135deg, #1f9a63, #17784c); }
        .pis-msg-row.is-full .pis-msg-action svg { transform: scale(1.18); }
        .pis-msg-action svg { transition: transform .15s ease; }
        .pis-msg-row.is-leaving { transition: height .18s ease, opacity .18s ease; opacity: 0; }

        /* computers: an archive button on hover instead of a swipe */
        .pis-msg-quick { position: absolute; z-index: 2; right: 10px; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: 36px; height: 36px;
            margin: 0; padding: 0; border: 1px solid #cfe0f0; border-radius: 10px; background: #fff; color: #1b6fb3; cursor: pointer; box-shadow: 0 3px 10px rgba(19, 35, 58, .12); }
        @media (hover: hover) and (pointer: fine) {
            .pis-msg-row:hover .pis-msg-quick, .pis-msg-quick:focus-visible { display: inline-flex; }
        }

        /* nothing here yet */
        .pis-msg-on .pis-msg-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 0; padding: 44px 26px; text-align: center; background: none; border: 0; }
        .pis-msg-empty strong { font-size: 17px; font-weight: 800; color: #13233a; }
        .pis-msg-empty span { font-size: 14px; line-height: 20px; font-weight: 500; color: #5b6b80; text-wrap: balance; }

        /* New Message: pick a client */
        .pis-msg-compose { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; min-height: 0; background: var(--pis-app-bg-soft, #f8fbfd); touch-action: pan-y; }
        .pis-msg-compose[hidden] { display: none; }
        .pis-msg-compose-head { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; min-height: 58px; padding: 8px 14px; box-sizing: border-box; background: #fff; border-bottom: 1px solid var(--pis-border, #dce8ef); }
        .pis-msg-compose-head strong { font-size: 17px; font-weight: 800; color: #13233a; }
        .pis-msg-compose-close { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 44px; height: 44px; margin: 0 0 0 -6px; padding: 0; border: 0; border-radius: 50%;
            background: var(--pis-blue-soft, #eaf6fc); color: #1b6fb3; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .pis-msg-search { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; margin: 12px 14px 8px; padding: 0 12px; min-height: 46px; border: 1px solid #c9d8e8; border-radius: 14px; background: #fff; color: #627184; }
        .pis-msg-search:focus-within { border-color: #2890df; box-shadow: 0 0 0 3px rgba(40, 144, 223, .12); }
        .pis-msg-search input { flex: 1 1 auto; min-width: 0; height: 44px; margin: 0; padding: 0; border: 0 !important; outline: 0 !important; background: none !important; box-shadow: none !important;
            font-family: inherit; font-size: 16px; font-weight: 600; color: #13233a; -webkit-appearance: none; appearance: none; }
        .pis-msg-search input::placeholder { color: #627184; font-weight: 400; opacity: 1; }
        .pis-msg-search input::-webkit-search-cancel-button { display: none; }
        .pis-msg-compose-error { flex: 0 0 auto; margin: 0 14px 8px; }
        .pis-msg-compose-error[hidden] { display: none; }
        .pis-msg-people { flex: 1 1 auto; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; background: #fff; border-top: 1px solid #e4ebf3; }
        .pis-msg-person { display: flex; align-items: center; gap: 11px; width: 100%; min-height: 64px; box-sizing: border-box; margin: 0; padding: 9px 14px; border: 0; border-bottom: 1px solid #e4ebf3; border-radius: 0;
            background: #fff; color: #13233a; font-family: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .pis-msg-person[disabled] { opacity: .55; }
        .pis-msg-person > span:last-child { flex: 1 1 auto; min-width: 0; display: block; }
        .pis-msg-person strong, .pis-msg-person small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pis-msg-person strong { font-size: 16px; line-height: 20px; font-weight: 800; }
        .pis-msg-person small { font-size: 13.5px; line-height: 18px; font-weight: 600; color: #5b6b80; }
        .pis-msg-people-empty { margin: 0; padding: 34px 24px; text-align: center; font-size: 14px; font-weight: 600; color: #5b6b80; }

        /* Undo on the "archived" notice */
        .pis-notice .pis-msg-undo { flex: 0 0 auto; align-self: center; width: auto; height: auto; margin: -3px 0; padding: 6px 13px; border: 1px solid currentColor; border-radius: 999px;
            background: none; color: inherit; font-family: inherit; font-size: 13.5px; font-weight: 800; line-height: 1.2; opacity: 1; cursor: pointer; }

        @media (max-width: 700px) {
            /* the conversation follows your finger back to the inbox */
            .admin-message-drawer .admin-message-conversation { touch-action: pan-y; }
            .admin-message-drawer .admin-message-conversation.is-dragging { box-shadow: -14px 0 30px rgba(19, 35, 58, .16); }
            .pis-msg-compose { transform: translateX(100%); transition: transform .2s ease; }
            .pis-msg-compose.is-open { transform: none; }
            .pis-msg-on .admin-message-mobile-back, .admin-message-drawer .admin-message-mobile-back { width: 44px; height: 44px; }
        }
        /* the unread count on the Messages tab keeps its place and white number while that tab is the lit one */
        .admin-app-nav .admin-app-nav-item .admin-app-nav-badge { color: #fff; z-index: 2; }
        @media (max-width: 700px) {
            .admin-app-nav .admin-app-nav-item { position: relative; }
            .admin-app-nav .admin-app-nav-item .admin-app-nav-badge { position: absolute; }
        }
        @media (max-width: 700px) {
            /* Messages is a tab: the bottom menu stays on the inbox, and slides away inside a conversation */
            body.pis-msg-tabbed.admin-messaging-open .admin-app-nav { display: flex; transition: transform .2s ease; }
            body.pis-msg-tabbed.admin-messaging-open.pis-msg-thread .admin-app-nav { transform: translateY(110%); pointer-events: none; }
            body.pis-msg-tabbed .admin-message-drawer { transition: none; }
            body.pis-msg-tabbed .admin-message-inbox { box-sizing: border-box; padding-bottom: var(--pis-msg-nav, 78px); }
            body.pis-msg-tabbed .pis-msg-compose { bottom: var(--pis-msg-nav, 78px); }
            body.pis-msg-tabbed .admin-message-close { display: none; }
        }
        @media (min-width: 701px) {
            .admin-message-body.pis-msg-body { grid-template-columns: 300px minmax(0, 1fr); }
            .admin-message-inbox.pis-msg-on { position: relative; }
            .pis-msg-on .admin-message-inbox-heading > strong { font-size: 15px !important; }
            .pis-msg-new { min-height: 36px; padding: 0 12px; font-size: 13px; }
            .pis-msg-on .pis-msg-row > .admin-conversation-item { min-height: 62px; padding: 8px 12px !important; gap: 10px; }
            .pis-msg-row .pis-client-avatar, .pis-msg-person .pis-client-avatar { width: 38px; height: 38px; flex-basis: 38px; border-radius: 12px; font-size: 13.5px; }
            .pis-msg-on .admin-conversation-item-top strong, .pis-msg-person strong { font-size: 14.5px !important; }
            .pis-msg-on .admin-conversation-preview, .pis-msg-person small { font-size: 12.5px !important; }
            .pis-msg-compose-close { width: 36px; height: 36px; }
        }
        @media (prefers-reduced-motion: reduce) {
            .pis-msg-compose, .pis-msg-row.is-leaving, .pis-msg-action svg, body.pis-msg-tabbed .admin-app-nav { transition: none !important; }
        }
    `;
    document.head.appendChild(style);

    // ---------- archive: who has tucked which conversation away ----------
    // An entry says "hidden as of the newest message at the time" (as_of). A newer message
    // makes the conversation show in the inbox again, on every device, without anyone's clock mattering.
    const store = { map: new Map(), owner: undefined, table: 'unknown', syncedAt: 0, syncing: null };
    const storeKey = () => `pis-msg-archived:${me() || 'nobody'}`;
    function readLocal() {
        store.map = new Map();
        store.owner = me();
        try {
            const saved = JSON.parse(localStorage.getItem(storeKey()) || '{}') || {};
            for (const [id, entry] of Object.entries(saved)) if (entry && entry.at) store.map.set(String(id), entry.pending ? { at: entry.at, pending: entry.pending } : { at: entry.at });
        } catch { /* nothing saved */ }
    }
    function writeLocal() {
        try { localStorage.setItem(storeKey(), JSON.stringify(Object.fromEntries(store.map))); } catch { /* storage unavailable */ }
    }
    const entries = () => { if (store.owner !== me()) readLocal(); return store.map; };
    function isArchived(conversation) {
        const entry = entries().get(String(conversation.id));
        return Boolean(entry && entry.pending !== 'clear' && stamp(lastAt(conversation)) <= stamp(entry.at));
    }
    const noTable = error => /^(42P01|PGRST205)$/.test(String(error?.code || ''))
        || (/message_archives/.test(String(error?.message || '')) && /(does not exist|could not find|schema cache)/i.test(String(error?.message || '')));
    // nothing to sync with: forget "un-archive later" notes, keep archived ones on this device
    function settleOnDevice() {
        for (const [id, entry] of [...store.map]) if (entry.pending === 'clear') store.map.delete(id);
    }
    async function push(id) {
        const entry = entries().get(id);
        const client = db();
        const user = me();
        if (!entry?.pending || !client || !user || store.table === 'missing') return;
        try {
            if (entry.pending === 'set') {
                const { error } = await client.from('message_archives')
                    .upsert({ user_id: user, conversation_id: id, as_of: entry.at }, { onConflict: 'user_id,conversation_id' });
                if (error) throw error;
                if (store.map.get(id) === entry) delete entry.pending;
            } else {
                const { error } = await client.from('message_archives').delete().eq('user_id', user).eq('conversation_id', id);
                if (error) throw error;
                if (store.map.get(id) === entry) store.map.delete(id);
            }
            store.table = 'ok';
        } catch (error) {
            if (noTable(error)) { store.table = 'missing'; settleOnDevice(); }
            // anything else (no service): it stays noted here and is sent the next time Messages opens
        }
        writeLocal();
    }
    function sync(force) {
        const client = db();
        const user = me();
        if (!client || !user) return Promise.resolve();
        entries();
        if (store.syncing) return store.syncing;
        if (!force && Date.now() - store.syncedAt < 30000) return Promise.resolve();
        store.syncedAt = Date.now();
        store.syncing = (async () => {
            try {
                if (store.table === 'missing') store.table = 'unknown';       // the table may have been added since
                for (const id of [...store.map.keys()]) {
                    if (store.table === 'missing') break;
                    if (store.map.get(id)?.pending) await push(id);
                }
                const { data, error } = await client.from('message_archives').select('conversation_id, as_of').eq('user_id', user);
                if (error) throw error;
                if (me() !== user) return;
                store.table = 'ok';
                const next = new Map((data || []).map(row => [String(row.conversation_id), { at: row.as_of }]));
                for (const [id, entry] of store.map) if (entry.pending) next.set(id, entry);       // not saved to the account yet
                store.map = next;
                writeLocal();
                render();
                refreshBadge();
            } catch (error) {
                if (noTable(error)) { store.table = 'missing'; settleOnDevice(); writeLocal(); }
            } finally {
                store.syncing = null;
            }
        })();
        return store.syncing;
    }
    function archive(id) {
        const conversation = find(id);
        if (!conversation || !isReal(conversation)) return;
        entries().set(String(id), { at: lastAt(conversation), pending: 'set' });
        writeLocal();
        render();
        refreshBadge();
        void push(String(id));
    }
    function unarchive(id) {
        const key = String(id);
        const entry = entries().get(key);
        if (!entry) return;
        if (store.table === 'missing') store.map.delete(key);
        else store.map.set(key, { at: entry.at, pending: 'clear' });
        writeLocal();
        render();
        refreshBadge();
        void push(key);
    }
    // a newer message brought it back: the old note is no longer needed
    function dropStale(real) {
        for (const conversation of real) {
            const key = String(conversation.id);
            const entry = store.map.get(key);
            if (!entry || entry.pending || stamp(lastAt(conversation)) <= stamp(entry.at)) continue;
            if (store.table === 'missing') { store.map.delete(key); writeLocal(); continue; }
            store.map.set(key, { at: entry.at, pending: 'clear' });
            writeLocal();
            void push(key);
        }
    }
    function archiveWithUndo(id) {
        archive(id);
        try { window.PisHaptics?.light?.(); } catch { /* ignore */ }
        const card = window.pisNotice?.('Conversation archived.', 'success', { duration: 5000 });
        if (!card) return;
        const undo = document.createElement('button');
        undo.type = 'button';
        undo.className = 'pis-msg-undo';
        undo.textContent = 'Undo';
        undo.addEventListener('click', () => { unarchive(id); card.remove(); });
        card.insertBefore(undo, card.querySelector('button'));
    }

    // ---------- the inbox ----------
    let view = 'inbox';      // inbox | archived
    const photoUrls = new Map();     // profile photo path -> url (so redraws don't flicker)
    function ensureChrome() {
        const inbox = document.querySelector('.admin-message-inbox');
        const heading = inbox?.querySelector('.admin-message-inbox-heading');
        const count = document.getElementById('admin-message-inbox-count');
        if (!inbox || !heading || !count) return null;
        inbox.classList.add('pis-msg-on');
        inbox.parentElement?.classList.add('pis-msg-body');
        let button = heading.querySelector('[data-msg-new]');
        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'pis-msg-new';
            button.dataset.msgNew = '';
            button.innerHTML = `${svg(ICON.compose, 16, 2.2)}New Message`;
            heading.appendChild(button);
        }
        let tabs = inbox.querySelector('.pis-msg-tabs');
        if (!tabs) {
            tabs = document.createElement('div');
            tabs.className = 'pis-msg-tabs';
            tabs.hidden = true;
            tabs.innerHTML = `<button type="button" class="pis-msg-tab" data-msg-view="inbox" aria-pressed="true">Inbox <b>0</b></button>
                <button type="button" class="pis-msg-tab" data-msg-view="archived" aria-pressed="false">Archived <b>0</b></button>`;
            heading.after(tabs);
        }
        return { inbox, heading, count, tabs, title: heading.querySelector('strong') };
    }
    function avatarHtml(clientId, fallbackName) {
        const profile = profileOf(clientId);
        let initials = '';
        try { initials = typeof getAdminClientInitials === 'function' && profile ? getAdminClientInitials(profile) : ''; } catch { initials = ''; }
        if (!initials) initials = String(fallbackName || 'C').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
        const path = profile?.profile_photo_path || '';
        const url = path ? photoUrls.get(path) : null;
        if (url) return `<img src="${esc(url)}" alt="" class="pis-client-avatar" data-initials="${esc(initials)}">`;
        return `<span class="pis-client-avatar" aria-hidden="true"${path ? ` data-msg-photo="${esc(path)}"` : ''}>${esc(initials)}</span>`;
    }
    // swap initials for the client's photo once it has loaded
    function loadPhotos(root) {
        root.querySelectorAll('[data-msg-photo]').forEach(holder => {
            const path = holder.dataset.msgPhoto;
            holder.removeAttribute('data-msg-photo');
            if (typeof getAdminProfilePhotoUrl !== 'function') return;
            Promise.resolve().then(() => getAdminProfilePhotoUrl(path)).then(url => {
                if (!url) return;
                const image = new Image();
                image.onload = () => {
                    photoUrls.set(path, url);
                    if (!holder.isConnected) return;
                    image.className = 'pis-client-avatar';
                    image.alt = '';
                    holder.replaceWith(image);
                };
                image.src = url;
            }).catch(() => { /* initials stay */ });
        });
    }
    function rowHtml(conversation) {
        const id = esc(String(conversation.id));
        const name = nameOf(conversation);
        const unread = Number(conversation.unreadCount || 0);
        const restoring = view === 'archived';
        const latest = conversation.latestMessage;
        const fromTeam = latest.sender_id !== conversation.client_id;
        const who = !fromTeam ? '' : latest.sender_id === me() ? 'You: ' : `${firstName(latest.sender_name || 'Team')}: `;
        const body = String(latest.body || '').replace(/\s+/g, ' ').trim();
        const classes = `admin-conversation-item${Number(activeId()) === Number(conversation.id) ? ' is-active' : ''}${unread > 0 ? ' has-unread' : ''}`;
        const verb = restoring ? 'Unarchive' : 'Archive';
        const label = restoring ? `Move the conversation with ${esc(name)} back to the inbox` : `Archive the conversation with ${esc(name)}`;
        const act = restoring ? 'data-msg-restore' : 'data-msg-archive';
        return `<div class="pis-msg-row" data-msg-row="${id}">
            <button type="button" class="pis-msg-action${restoring ? ' is-restore' : ''}" ${act}="${id}" tabindex="-1" aria-label="${label}">${svg(restoring ? ICON.restore : ICON.archive, 22)}<span>${verb}</span></button>
            <button type="button" class="${classes}" data-admin-conversation="${id}">
                ${avatarHtml(conversation.client_id, name)}
                <span class="pis-msg-text">
                    <span class="admin-conversation-item-top"><strong>${esc(name)}</strong><span class="admin-conversation-time">${esc(shortTime(latest.created_at))}</span></span>
                    <span class="pis-msg-line"><span class="admin-conversation-preview">${who ? `<b>${esc(who)}</b>` : ''}${esc(body)}</span>${unread > 0 ? `<span class="admin-conversation-unread" aria-label="${unread} unread">${unread > 99 ? '99+' : unread}</span>` : ''}</span>
                </span>
            </button>
            <button type="button" class="pis-msg-quick" ${act}="${id}" aria-label="${label}" title="${verb}">${svg(restoring ? ICON.restore : ICON.archive, 18)}</button>
        </div>`;
    }
    const originalRender = window.renderAdminConversationList;
    function render() {
        const list = listEl();
        const ui = ensureChrome();
        if (!list || !ui) return originalRender?.apply(this, arguments);
        try {
            entries();
            const real = convs().filter(isReal);
            dropStale(real);
            const archived = real.filter(isArchived);
            const inbox = real.filter(conversation => !isArchived(conversation));
            if (view === 'archived' && !archived.length) view = 'inbox';
            const shown = view === 'archived' ? archived : inbox;
            if (ui.title) ui.title.textContent = view === 'archived' ? 'Archived' : 'Inbox';
            ui.count.textContent = `${shown.length} ${shown.length === 1 ? 'conversation' : 'conversations'}`;
            ui.tabs.hidden = archived.length === 0;
            ui.tabs.querySelectorAll('[data-msg-view]').forEach(tab => {
                tab.setAttribute('aria-pressed', String(tab.dataset.msgView === view));
                tab.querySelector('b').textContent = String(tab.dataset.msgView === 'archived' ? archived.length : inbox.length);
            });
            openRow = null;
            drag = null;
            if (!shown.length) {
                list.innerHTML = `<div class="admin-message-empty pis-msg-empty"><strong>No messages yet</strong><span>Tap New Message to start a conversation with a client.</span></div>`;
                return;
            }
            list.innerHTML = shown.map(rowHtml).join('');
            loadPhotos(list);
            if (!store.syncedAt) void sync(true);
        } catch (error) {
            console.error('Messages inbox:', error);
            originalRender?.apply(this, arguments);
        }
    }
    window.renderAdminConversationList = render;

    // ---------- unread count: inbox only, and on the Messages tab too ----------
    function refreshBadge() {
        const total = convs().filter(conversation => isReal(conversation) && !isArchived(conversation)).reduce((sum, conversation) => sum + Number(conversation.unreadCount || 0), 0);
        const text = total > 99 ? '99+' : String(total);
        const launcher = document.getElementById('admin-message-unread-badge');
        if (launcher) { launcher.textContent = text; launcher.style.display = total > 0 ? 'block' : 'none'; }
        const tab = document.getElementById('admin-nav-message-badge');
        if (tab) { tab.textContent = text; tab.style.display = total > 0 ? '' : 'none'; }
    }
    const originalBadge = window.updateAdminMessageUnreadBadge;
    window.updateAdminMessageUnreadBadge = function () {
        const result = originalBadge?.apply(this, arguments);
        try { refreshBadge(); } catch (error) { console.error('Messages badge:', error); }
        return result;
    };

    // ---------- swipe a row: Archive (or Unarchive) ----------
    const ACTION = 96;       // how far a row opens to show its button
    let drag = null;
    let openRow = null;
    let quietUntil = 0;      // a swipe is not a tap: ignore the click that follows it
    const front = row => row?.querySelector('.admin-conversation-item');
    function slide(element, x, animate) {
        if (!element) return;
        element.style.transition = animate && !calm() ? 'transform .18s ease' : 'none';
        element.style.transform = x ? `translate3d(${x}px, 0, 0)` : '';
    }
    let closing = { row: null, until: 0 };      // a row sliding shut still shows its button for a moment
    function closeRow(instant) {
        if (!openRow) return;
        slide(front(openRow), 0, !instant);
        if (!instant) closing = { row: openRow, until: performance.now() + 240 };
        openRow = null;
    }
    function finishSwipe(row, id) {
        const done = () => {
            if (view === 'archived') unarchive(id);
            else archiveWithUndo(id);
        };
        if (calm() || !row.isConnected) { done(); return; }
        slide(front(row), -row.offsetWidth, true);
        row.style.height = `${row.offsetHeight}px`;
        setTimeout(() => {
            row.classList.add('is-leaving');
            row.style.height = '0px';
            setTimeout(done, 190);
        }, 150);
    }
    const list = listEl();
    list.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' || (event.button ?? 0) !== 0) return;
        const row = event.target.closest?.('.pis-msg-row');
        if (openRow && openRow !== row) closeRow();
        if (!row || row.classList.contains('is-leaving') || event.target.closest('.pis-msg-action, .pis-msg-quick')) return;
        drag = { row, id: row.dataset.msgRow, pointer: event.pointerId, x0: event.clientX, y0: event.clientY, base: row === openRow ? -ACTION : 0, x: null, width: row.offsetWidth, locked: false };
    });
    list.addEventListener('pointermove', event => {
        if (!drag || event.pointerId !== drag.pointer) return;
        const dx = event.clientX - drag.x0;
        const dy = event.clientY - drag.y0;
        if (!drag.locked) {
            if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { drag = null; return; }     // scrolling the list
            if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
            if (dx > 0 && drag.base === 0) { drag = null; return; }                              // nothing on that side
            drag.locked = true;
            try { front(drag.row)?.setPointerCapture(event.pointerId); } catch { /* ignore */ }
        }
        drag.x = Math.max(-drag.width, Math.min(0, drag.base + dx));
        slide(front(drag.row), drag.x, false);
        const full = drag.x < -drag.width * 0.55;
        if (full !== drag.row.classList.contains('is-full')) {
            drag.row.classList.toggle('is-full', full);
            if (full) { try { window.PisHaptics?.selection?.(); } catch { /* ignore */ } }
        }
    });
    function endDrag(event) {
        if (!drag || event.pointerId !== drag.pointer) return;
        const done = drag;
        drag = null;
        if (!done.locked) return;
        quietUntil = performance.now() + 350;
        done.row.classList.remove('is-full');
        const x = event.type === 'pointercancel' ? done.base : (done.x ?? done.base);
        if (x < -done.width * 0.55) { openRow = null; finishSwipe(done.row, done.id); return; }
        if (x < -ACTION * 0.45) { slide(front(done.row), -ACTION, true); openRow = done.row; return; }
        slide(front(done.row), 0, true);
        if (openRow === done.row) openRow = null;
    }
    list.addEventListener('pointerup', endDrag);
    list.addEventListener('pointercancel', endDrag);
    list.addEventListener('scroll', () => closeRow(), { passive: true });

    // ---------- New Message ----------
    let compose = null;
    function ensureCompose() {
        if (compose) return compose;
        const inbox = document.querySelector('.admin-message-inbox');
        if (!inbox) return null;
        const panel = document.createElement('div');
        panel.className = 'pis-msg-compose';
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'New Message');
        panel.innerHTML = `
            <div class="pis-msg-compose-head">
                <button type="button" class="pis-msg-compose-close" aria-label="Back to conversations">${svg(ICON.back, 22, 2.4)}</button>
                <strong>New Message</strong>
            </div>
            <label class="pis-msg-search">${svg(ICON.search, 18, 2.2)}<input type="search" placeholder="Search Clients" aria-label="Search clients" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search"></label>
            <p class="pis-msg-compose-error" role="alert" hidden></p>
            <div class="pis-msg-people"></div>`;
        inbox.appendChild(panel);
        compose = { panel, search: panel.querySelector('input'), people: panel.querySelector('.pis-msg-people'), error: panel.querySelector('.pis-msg-compose-error') };
        compose.search.addEventListener('input', () => renderPeople());
        swipeBack(panel, () => !panel.hidden, () => closeCompose(true));
        return compose;
    }
    function people() {
        let clients = [];
        try { clients = typeof getAdminClientDirectoryProfiles === 'function' ? getAdminClientDirectoryProfiles() : []; } catch { clients = []; }
        if (isOwner()) return clients;
        const reachable = new Set(convs().map(conversation => String(conversation.client_id)));       // the team: clients whose thread they can already see
        return clients.filter(profile => reachable.has(String(profile.id)));
    }
    function renderPeople() {
        const ui = ensureCompose();
        if (!ui) return;
        const query = String(ui.search.value || '').trim().toLowerCase();
        const text = profile => {
            try { return typeof getAdminClientSearchText === 'function' ? getAdminClientSearchText(profile) : String(profile.full_name || profile.email || '').toLowerCase(); }
            catch { return String(profile.full_name || profile.email || '').toLowerCase(); }
        };
        const shown = people().filter(profile => !query || text(profile).includes(query));
        if (!shown.length) {
            ui.people.innerHTML = `<p class="pis-msg-people-empty">${query ? 'No clients match that search.' : 'No clients to message yet.'}</p>`;
            return;
        }
        ui.people.innerHTML = shown.map(profile => {
            const name = profile.full_name || profile.email || 'Client';
            let pets = [];
            try { pets = typeof getAdminClientPets === 'function' ? getAdminClientPets(profile.id).map(pet => pet.name || 'Pet') : []; } catch { pets = []; }
            return `<button type="button" class="pis-msg-person" data-msg-client="${esc(String(profile.id))}">
                ${avatarHtml(profile.id, name)}
                <span><strong>${esc(name)}</strong><small>${esc(pets.join(', ') || 'No pets added')}</small></span>
            </button>`;
        }).join('');
        loadPhotos(ui.people);
    }
    function openCompose() {
        const ui = ensureCompose();
        if (!ui) return;
        closeRow(true);
        ui.search.value = '';
        ui.error.hidden = true;
        ui.error.textContent = '';
        renderPeople();
        ui.people.scrollTop = 0;
        ui.panel.hidden = false;
        void ui.panel.offsetWidth;      // start the slide from off-screen
        ui.panel.classList.add('is-open');
        if (!isPhone()) { try { ui.search.focus({ preventScroll: true }); } catch { /* ignore */ } }
    }
    function closeCompose(instant) {
        if (!compose || compose.panel.hidden) return;
        const panel = compose.panel;
        panel.classList.remove('is-open');
        const hide = () => { if (!panel.classList.contains('is-open')) panel.hidden = true; };
        if (instant || !isPhone() || calm()) hide();
        else setTimeout(hide, 210);
    }
    async function createConversation(clientId) {
        const client = db();
        if (!client) return null;
        // 1. the owner's helper from 5-paws-messages.sql (works for every client)
        try {
            const made = await client.rpc('admin_start_conversation', { p_client_id: clientId });
            if (!made.error && made.data && made.data.id != null) return made.data;
        } catch { /* try the next way */ }
        // 2. no helper yet: make the thread directly
        try {
            const made = await client.from('conversations').insert({ client_id: clientId }).select().single();
            if (!made.error && made.data) return made.data;
        } catch { /* try the next way */ }
        // 3. it may exist already (the client opened Messages a moment ago)
        try {
            const found = await client.from('conversations').select('*').eq('client_id', clientId).maybeSingle();
            if (!found.error && found.data) return found.data;
        } catch { /* nothing more to try */ }
        return null;
    }
    let starting = false;
    async function start(clientId, button) {
        if (starting) return;
        const ui = ensureCompose();
        const profile = profileOf(clientId);
        const name = profile?.full_name || profile?.email || 'this client';
        const open = async id => {
            closeCompose();
            await openAdminConversation(id);
            if (!isPhone()) { try { document.getElementById('admin-message-input')?.focus({ preventScroll: true }); } catch { /* ignore */ } }
        };
        const existing = convs().find(conversation => String(conversation.client_id) === String(clientId));
        if (existing) { await open(existing.id); return; }
        starting = true;
        if (button) button.disabled = true;
        if (ui) { ui.error.hidden = true; ui.error.textContent = ''; }
        try {
            const row = await createConversation(clientId);
            if (!row || row.id == null) throw new Error('No conversation could be started.');
            if (!find(row.id)) {
                adminConversations.push({
                    ...row,
                    client: profile ? { id: profile.id, full_name: profile.full_name, email: profile.email, phone: profile.phone } : null,
                    latestMessage: null,
                    unreadCount: 0
                });
            }
            await open(row.id);
        } catch (error) {
            console.error('New message:', error);
            if (ui) {
                ui.error.textContent = isOwner()
                    ? `We couldn't start a conversation with ${firstName(name)}. If this keeps happening, run 5-paws-messages.sql in Supabase.`
                    : `We couldn't start a conversation with ${firstName(name)}. Ask the owner to message them first.`;
                ui.error.hidden = false;
            }
        } finally {
            starting = false;
            if (button) button.disabled = false;
        }
    }

    // ---------- taps ----------
    document.addEventListener('click', event => {
        const target = event.target;
        if (!target?.closest) return;
        const inList = target.closest('#admin-conversation-list');
        const act = target.closest('[data-msg-archive], [data-msg-restore]');
        if (act) {
            event.preventDefault();
            event.stopPropagation();
            // a row that is sliding shut: a tap that lands on its button in that instant doesn't count
            if (act.classList.contains('pis-msg-action') && act.closest('.pis-msg-row') === closing.row && performance.now() < closing.until) return;
            openRow = null;
            if (act.dataset.msgRestore != null) unarchive(act.dataset.msgRestore);
            else archiveWithUndo(act.dataset.msgArchive);
            return;
        }
        if (inList && performance.now() < quietUntil) { event.preventDefault(); event.stopPropagation(); return; }
        if (openRow) {                                   // a row is showing its button: any other tap just closes it
            const onOpenRow = target.closest('.pis-msg-row') === openRow;
            closeRow();
            if (inList && onOpenRow) { event.preventDefault(); event.stopPropagation(); return; }
        }
        const tab = target.closest('[data-msg-view]');
        if (tab) { view = tab.dataset.msgView === 'archived' ? 'archived' : 'inbox'; render(); const scroller = listEl(); if (scroller) scroller.scrollTop = 0; return; }
        if (target.closest('[data-msg-new]')) { openCompose(); return; }
        if (target.closest('.pis-msg-compose-close')) { closeCompose(); return; }
        const person = target.closest('[data-msg-client]');
        if (person) { void start(person.dataset.msgClient, person); }
    }, true);

    // ---------- swipe right: back to the inbox ----------
    function swipeBack(panel, isOpen, goBack) {
        let pull = null;
        panel.addEventListener('pointerdown', event => {
            if (!isPhone() || event.pointerType === 'mouse' || !isOpen()) return;
            if (event.target.closest?.('textarea, input, select, .admin-message-form')) return;
            pull = { pointer: event.pointerId, x0: event.clientX, y0: event.clientY, x: 0, at: performance.now(), width: panel.offsetWidth, locked: false };
        });
        panel.addEventListener('pointermove', event => {
            if (!pull || event.pointerId !== pull.pointer) return;
            const dx = event.clientX - pull.x0;
            const dy = event.clientY - pull.y0;
            if (!pull.locked) {
                if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { pull = null; return; }       // scrolling the messages
                if (dx < -12) { pull = null; return; }
                if (dx < 12 || dx < Math.abs(dy) * 1.5) return;
                pull.locked = true;
                try { panel.setPointerCapture(event.pointerId); } catch { /* ignore */ }
                panel.classList.add('is-dragging');
            }
            pull.x = Math.max(0, dx);
            panel.style.transition = 'none';
            panel.style.transform = `translate3d(${pull.x}px, 0, 0)`;
        });
        const end = event => {
            if (!pull || event.pointerId !== pull.pointer) return;
            const done = pull;
            pull = null;
            if (!done.locked) return;
            quietUntil = performance.now() + 350;
            const quick = done.x > 40 && done.x / Math.max(1, performance.now() - done.at) > 0.5;
            const leave = event.type !== 'pointercancel' && (done.x > done.width * 0.33 || quick);
            const settle = () => {
                if (leave) goBack();
                panel.classList.remove('is-dragging');
                panel.style.transition = '';
                panel.style.transform = '';
            };
            if (calm()) { settle(); return; }
            panel.style.transition = 'transform .2s ease';
            panel.style.transform = leave ? 'translate3d(100%, 0, 0)' : 'translate3d(0, 0, 0)';
            setTimeout(settle, 200);
        };
        panel.addEventListener('pointerup', end);
        panel.addEventListener('pointercancel', end);
    }
    const conversationPanel = document.querySelector('.admin-message-conversation');
    if (conversationPanel) {
        swipeBack(conversationPanel, () => Boolean(drawer()?.classList.contains('conversation-open')), () => window.showAdminMessageInbox());
    }
    // Android Back: an open conversation returns to the inbox before Messages closes
    document.getElementById('admin-message-mobile-back')?.classList.add('pis-msg-close-thread');

    // back in the inbox (phone): that conversation is no longer on screen, so stop treating it as open
    // (otherwise the client's next message was marked read without being seen)
    const originalShowInbox = window.showAdminMessageInbox;
    window.showAdminMessageInbox = function () {
        const result = originalShowInbox?.apply(this, arguments);
        if (isPhone()) {
            try {
                activeAdminConversationId = null;       // eslint-disable-line no-undef
                adminConversationMessages = [];         // eslint-disable-line no-undef
            } catch { /* older app: nothing to reset */ }
            render();
        }
        return result;
    };

    // ---------- phones: Messages is a tab, the bottom menu stays ----------
    const menu = () => document.querySelector('.admin-app-nav');
    const isOpen = () => document.body.classList.contains('admin-messaging-open');
    const tabbed = () => isPhone() && Boolean(menu());
    const messagesTab = () => menu()?.querySelector('[data-admin-screen="messages"]');
    function syncTab() {
        const on = tabbed();
        const body = document.body;
        body.classList.toggle('pis-msg-tabbed', on);
        body.classList.toggle('pis-msg-thread', on && isOpen() && Boolean(drawer()?.classList.contains('conversation-open')));
        if (!on) return;
        const height = menu().offsetHeight;      // includes the phone's bottom safe area
        if (height) body.style.setProperty('--pis-msg-nav', `${height}px`);
    }
    if (drawer()) new MutationObserver(syncTab).observe(drawer(), { attributes: true, attributeFilter: ['class'] });
    window.matchMedia('(max-width: 700px)').addEventListener?.('change', syncTab);
    window.addEventListener('resize', syncTab, { passive: true });
    // Back (Android): conversation -> inbox, New Message -> inbox, inbox -> Home. False when it isn't ours to handle.
    function back() {
        if (!isOpen() || !tabbed()) return false;
        if (drawer()?.classList.contains('conversation-open')) { window.showAdminMessageInbox(); return true; }
        if (compose && !compose.panel.hidden) { closeCompose(); return true; }
        const home = menu()?.querySelector('[data-admin-screen="home"]');
        if (!home) return false;
        home.click();
        return true;
    }

    // opening Messages: pick up what was archived on another device
    const originalOpen = window.openAdminMessaging;
    window.openAdminMessaging = function () {
        const already = isOpen();
        const result = originalOpen?.apply(this, arguments);
        syncTab();
        if (tabbed()) {
            if (already) { closeRow(true); closeCompose(); }          // tapping the tab again: back to the list
            try { if (typeof setAdminNavigationState === 'function') setAdminNavigationState('messages'); } catch { /* ignore */ }
        }
        try { void sync(false); } catch { /* ignore */ }
        return result;
    };
    // leaving Messages: tidy up for next time
    const originalClose = window.closeAdminMessaging;
    window.closeAdminMessaging = function () {
        const wasOpen = isOpen();
        const result = originalClose?.apply(this, arguments);
        closeRow(true);
        closeCompose(true);
        syncTab();
        // closed some other way than by picking a tab: don't leave Messages lit in the menu
        if (wasOpen && tabbed() && messagesTab()?.classList.contains('admin-app-nav-item-active')) {
            try { if (typeof setAdminNavigationState === 'function' && typeof activeAdminScreen === 'string') setAdminNavigationState(activeAdminScreen); } catch { /* ignore */ }
        }
        return result;
    };

    window.PisMessages = { render, archive, unarchive, isArchived, sync, openCompose, closeCompose, start, shortTime, store, back, syncTab,
        get view() { return view; }, set view(value) { view = value === 'archived' ? 'archived' : 'inbox'; render(); } };
    syncTab();
    if (convs().length) render();
})();
