// ========================================
// DELETE A CLIENT (owner only)
// ========================================
//
// Clients → tap a client → "Delete Client" at the bottom.
// The server (admin_delete_client, 4-paws-delete-client.sql) runs the
// same delete as the client's own Delete Account button: personal info
// is erased, past visits and payments stay (without their name), and
// their login is locked. Upcoming visits have to be cancelled first.
// Deleted clients are remembered in deleted_clients and left out of
// the Clients list.
// ========================================

(() => {
    'use strict';

    const isOwner = () => window.PIS_STAFF_ROLE !== 'employee';
    const deleted = window.PisDeletedClients = window.PisDeletedClients || new Set();
    const supa = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    const profiles = () => (typeof allProfiles !== 'undefined' && Array.isArray(allProfiles) ? allProfiles : []);
    const visits = () => (typeof allVisits !== 'undefined' && Array.isArray(allVisits) ? allVisits : []);
    const roleOf = p => String(p?.role || '').trim().toLowerCase();
    const nameOf = p => String(p?.full_name || '').trim() || 'This client';
    let busy = false;

    const css = document.createElement('style');
    css.textContent = `
        .pis-client-delete-card { padding: 16px; border-radius: 18px;
            border: 1px solid rgba(220, 38, 38, .25); background: rgba(220, 38, 38, .045); }
        .pis-client-delete-text { margin: 0 0 14px; font-size: 14px; line-height: 1.45; color: #475569; }
        .pis-client-delete-button { display: flex; width: 100%; align-items: center; justify-content: center;
            min-height: 46px; padding: 0 20px; border-radius: 999px; border: 1.5px solid #dc2626;
            background: #fff; color: #dc2626; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
        .pis-client-delete-button:disabled { opacity: .55; cursor: default; }
        .pis-client-delete-button:not(:disabled):active { background: rgba(220, 38, 38, .08); }
        .pis-client-delete [data-pis-status]:empty { display: none; }
        .pis-client-delete [data-pis-status] { margin: 12px 0 0; font-size: .9rem; line-height: 1.4; }
    `;
    document.head.appendChild(css);

    // ---- Leave deleted clients out of the Clients list ----
    async function loadDeleted() {
        const client = supa();
        if (!client || !isOwner()) return;
        try {
            const { data, error } = await client.from('deleted_clients').select('client_id');
            if (error) return;            // not set up yet: nothing to hide
            const before = deleted.size;
            (data || []).forEach(row => row?.client_id && deleted.add(String(row.client_id)));
            if (deleted.size !== before) rerenderDirectory();
        } catch { /* offline: try again next time the list opens */ }
    }
    function rerenderDirectory() {
        try { if (typeof renderAdminClientDirectory === 'function') renderAdminClientDirectory(); } catch (e) { console.warn('Clients list:', e); }
    }

    function upcomingCount(clientId) {
        const today = typeof adminBoardingToday === 'function' ? adminBoardingToday()
            : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
        return visits().filter(v => {
            const status = String(v.status || '').trim().toLowerCase();
            return String(v.client_id) === String(clientId) &&
                String(v.visit_date || '') >= today &&
                !v.cancelled_at && !v.completed_at &&
                status !== 'cancelled' && status !== 'completed';
        }).length;
    }
    const upcomingText = (name, n) =>
        `${name} still has ${n} upcoming visit${n === 1 ? '' : 's'}. Cancel ${n === 1 ? 'it' : 'them'} first, then delete.`;

    // ---- The "Delete Client" box at the bottom of a client's page ----
    function render(clientId) {
        document.querySelector('.pis-client-delete')?.remove();
        if (!isOwner()) return;
        const profile = profiles().find(p => String(p.id) === String(clientId));
        if (!profile || ['admin', 'employee', 'former_employee'].includes(roleOf(profile)) || profile.team_left_at) return;
        const activity = document.getElementById('admin-client-household-activity');
        const after = activity?.closest('.admin-client-household-section');
        if (!after) return;

        const box = document.createElement('div');
        box.className = 'admin-client-household-section pis-client-delete';
        box.dataset.clientId = String(clientId);
        box.innerHTML = `
            <div class="admin-client-household-section-heading">
                <div>
                    <span class="admin-screen-eyebrow">ACCOUNT</span>
                    <h3>Delete Client</h3>
                </div>
            </div>
            <div class="pis-client-delete-card">
                <p class="pis-client-delete-text">Erases their personal info and locks their login. Past visits and payments stay in your records without their name.</p>
                <button type="button" class="pis-client-delete-button" data-pis-delete-client>Delete Client</button>
                <p data-pis-status data-pis-tone-fixed="error" aria-live="polite"></p>
            </div>`;
        after.after(box);
        box.querySelector('[data-pis-delete-client]').addEventListener('click', () => { void remove(String(clientId), box); });
    }

    async function remove(clientId, box) {
        if (busy) return;
        const profile = profiles().find(p => String(p.id) === clientId);
        const name = nameOf(profile);
        const status = box.querySelector('[data-pis-status]');
        const button = box.querySelector('[data-pis-delete-client]');
        status.textContent = '';

        const upcoming = upcomingCount(clientId);
        if (upcoming > 0) { status.textContent = upcomingText(name, upcoming); return; }

        const ask = typeof confirmAdminChoice === 'function' ? confirmAdminChoice : null;
        const yes = ask ? await ask({
            title: `Delete ${name}?`,
            context: profile?.email || '',
            message: "This erases their personal info, removes them from Clients, and locks their login. Past visits and payments stay in your records without their name. This can't be undone.",
            confirmText: 'Delete Client',
            cancelText: 'Keep Client',
            caution: true
        }) : await window.pisConfirm?.({ title: `Delete ${name}?`, message: "This can't be undone.", confirmText: 'Delete Client', cancelText: 'Keep Client' });
        if (!yes) return;

        busy = true;
        button.disabled = true;
        button.textContent = 'Deleting…';
        try {
            if (!navigator.onLine) throw new Error("You're offline. Connect to the internet and try again.");
            const { data, error } = await supa().rpc('admin_delete_client', { p_client_id: clientId });
            if (error) throw error;
            if (data?.deleted !== true) throw new Error('The delete could not be confirmed. Please try again.');

            deleted.add(clientId);
            try { if (typeof closeAdminClientHousehold === 'function') closeAdminClientHousehold(); } catch (e) { console.warn(e); }
            rerenderDirectory();
            window.PisHaptics?.success?.();
            window.PisFormErrors?.notice?.(`${name} was deleted.`, 'success');
        } catch (error) {
            console.error('Delete client error:', error);
            const raw = String(error?.message || error || '');
            status.textContent = /admin_delete_client|PGRST202|could not find the function/i.test(raw + ' ' + (error?.code || ''))
                ? "Client delete isn't set up yet. Run 4-paws-delete-client.sql in Supabase first."
                : (window.PisFormErrors ? PisFormErrors.serverText(error, "The client couldn't be deleted. Please try again.")
                    : "The client couldn't be deleted. Please try again.");
        } finally {
            busy = false;
            if (button.isConnected) { button.disabled = false; button.textContent = 'Delete Client'; }
        }
    }

    // ---- Hook into the page ----
    if (typeof window.openAdminClientHousehold === 'function') {
        const open = window.openAdminClientHousehold;
        window.openAdminClientHousehold = async function (clientId, ...rest) {
            const result = await open.call(this, clientId, ...rest);
            try { render(clientId); } catch (e) { console.warn('Delete client:', e); }
            return result;
        };
    }
    if (typeof window.getAdminClientDirectoryProfiles === 'function') {
        const list = window.getAdminClientDirectoryProfiles;
        window.getAdminClientDirectoryProfiles = function (...args) {
            const result = list.apply(this, args);
            return Array.isArray(result) && deleted.size ? result.filter(p => !deleted.has(String(p.id))) : result;
        };
    }

    // load once signed in, and again whenever the owner opens Clients
    let tries = 0;
    const start = () => {
        if (supa() && typeof currentUser !== 'undefined' && currentUser) { void loadDeleted(); return; }
        if (++tries < 40) setTimeout(start, 500);
    };
    start();
    document.addEventListener('click', event => {
        if (event.target.closest?.('[data-admin-screen="clients"], [data-admin-tab="clients"]')) void loadDeleted();
    }, true);

    window.PisClientDelete = { render, reload: loadDeleted };
})();
