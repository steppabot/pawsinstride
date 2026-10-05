/* ========================================
   PAWS IN STRIDE: TEAM ACCOUNTS (admin + employees)
   ========================================
   Load AFTER admin.js and admin-visit-focus.js, on the website
   admin.html and in the app's admin.html.

   Main admin (contact@pawsinstride.com):
   - "Assigned to" picker in the visit popup, with an option to
     assign every visit in the same booking at once
   - small name tag on visits assigned to an employee

   Employee accounts:
   - same app, but only their assigned visits, clients and messages
     (the database enforces this; this file just tidies the screens)
   - no prices, payment badges, Financial Snapshot, route planner,
     Needs Attention, pricing/credits, Services & Pricing or
     Lifetime Stats
   - More shows only their profile and push notifications
   ======================================== */
(function () {
    'use strict';

    const esc = value => (typeof escapeHtml === 'function'
        ? escapeHtml(value)
        : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
    const lower = value => String(value || '').trim().toLowerCase();
    const isEmployee = () => window.PIS_STAFF_ROLE === 'employee';
    const me = () => (typeof currentUser !== 'undefined' ? currentUser?.id : null);
    const profiles = () => (typeof allProfiles !== 'undefined' && Array.isArray(allProfiles) ? allProfiles : []);
    const visits = () => (typeof allVisits !== 'undefined' && Array.isArray(allVisits) ? allVisits : []);
    const findVisit = id => visits().find(v => Number(v.id) === Number(id));
    const isCancelled = v => lower(v?.status) === 'cancelled';
    const isDone = v => Boolean(v?.completed_at) || lower(v?.status) === 'completed';
    const firstName = name => String(name || '').trim().split(/\s+/)[0] || '';

    function employees() {
        return profiles()
            .filter(p => lower(p.role) === 'employee')
            .sort((a, b) => String(a.full_name || a.email || '').localeCompare(String(b.full_name || b.email || '')));
    }

    function assigneeName(visit) {
        if (isEmployee() || !visit?.assigned_to || visit.assigned_to === me()) return '';
        const person = profiles().find(p => p.id === visit.assigned_to);
        return firstName(person?.full_name) || person?.email || 'Team member';
    }

    // Other visits from the same booking that can still be reassigned.
    function bookingSiblings(visit) {
        const group = visit.booking_group_id || visit.checkout_id;
        if (!group) return [visit];
        const key = visit.booking_group_id ? 'booking_group_id' : 'checkout_id';
        const list = visits().filter(v => v[key] === group && v.client_id === visit.client_id &&
            !isCancelled(v) && !isDone(v));
        if (!list.some(v => Number(v.id) === Number(visit.id))) list.push(visit);
        return list;
    }

    /* ---------- the "Assigned to" picker (main admin only) ---------- */

    // The popup re-renders after saving, so remember the confirmation briefly.
    let lastResult = null;

    function buildAssignControl(visit) {
        if (isEmployee() || !visit || isCancelled(visit)) return null;
        const team = employees();
        if (!team.length) return null;

        const siblings = bookingSiblings(visit);
        const wrap = document.createElement('div');
        wrap.className = 'pis-assign';
        const current = visit.assigned_to && visit.assigned_to !== me() ? visit.assigned_to : '';
        wrap.innerHTML = `
            <label class="pis-assign-row">
                <span class="pis-assign-label">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
                    Assigned to
                </span>
                <select class="pis-assign-select" aria-label="Assign this visit">
                    <option value="">Me</option>
                    ${team.map(p => `<option value="${esc(p.id)}"${p.id === current ? ' selected' : ''}>${esc(p.full_name || p.email || 'Employee')}</option>`).join('')}
                </select>
            </label>
            ${siblings.length > 1 ? `
                <label class="pis-assign-all">
                    <input type="checkbox" class="pis-assign-all-input" checked>
                    Apply to all ${siblings.length} upcoming visits in this booking
                </label>` : ''}
            <p class="pis-assign-msg" role="status" aria-live="polite">${
                lastResult && lastResult.ids.includes(Number(visit.id)) && Date.now() - lastResult.at < 10000
                    ? esc(lastResult.text) : ''}</p>`;

        const select = wrap.querySelector('.pis-assign-select');
        const all = wrap.querySelector('.pis-assign-all-input');
        const msg = wrap.querySelector('.pis-assign-msg');

        select.addEventListener('change', async () => {
            const employeeId = select.value || null;
            const ids = (all?.checked ? siblings : [visit]).map(v => Number(v.id));
            const who = employeeId ? (profiles().find(p => p.id === employeeId)?.full_name || 'your employee') : 'you';
            select.disabled = true;
            if (all) all.disabled = true;
            msg.textContent = 'Saving…';
            try {
                if (!navigator.onLine) throw new Error("You're offline. Reconnect and try again.");
                const { data, error } = await supabaseClient.rpc('admin_assign_visits', {
                    p_visit_ids: ids,
                    p_employee_id: employeeId
                });
                if (error) throw error;
                for (const id of ids) {
                    const v = findVisit(id);
                    if (v) v.assigned_to = employeeId;
                }
                const count = ids.length;
                const text = employeeId
                    ? `Assigned ${count === 1 ? 'this visit' : `${count} visits`} to ${firstName(who)} ✓${Number(data) > 0 ? ` ${firstName(who)} was notified.` : ''}`
                    : `${count === 1 ? 'This visit is' : `${count} visits are`} back on your schedule ✓`;
                msg.textContent = text;
                lastResult = { ids, text, at: Date.now() };
                if (typeof renderAdminDayServices === 'function') renderAdminDayServices();
                if (typeof renderAdminCalendar === 'function') renderAdminCalendar();
            } catch (error) {
                console.error('Assign visit error:', error);
                select.value = current;
                msg.textContent = error?.message || 'The visit could not be assigned. Try again.';
            } finally {
                select.disabled = false;
                if (all) all.disabled = false;
            }
        });
        return wrap;
    }

    window.pisTeam = { isEmployee, assigneeName, buildAssignControl, employees };

    /* ---------- employee screen tidy-up ---------- */

    function tidyEmployeeScreens() {
        if (!isEmployee()) return;

        // Prices on visit cards ("Price $132.00") and client activity amounts.
        document.querySelectorAll('.admin-service-detail').forEach(detail => {
            const label = detail.querySelector(':scope > span');
            if (label && lower(label.textContent) === 'price') detail.hidden = true;
        });
        document.querySelectorAll('.admin-client-activity-meta > strong').forEach(el => { el.hidden = true; });

        // Wording
        const badge = document.querySelector('.admin-role-badge');
        if (badge && badge.textContent.trim() !== 'TEAM') badge.textContent = 'TEAM';
        const homeIntro = document.querySelector('.admin-home-intro p');
        if (homeIntro && !homeIntro.dataset.pisTeam) {
            homeIntro.dataset.pisTeam = '1';
            homeIntro.textContent = 'Your assigned visits and live activity in one place.';
        }
        const moreIntro = document.querySelector('.admin-more-intro');
        if (moreIntro && !moreIntro.dataset.pisTeam) {
            moreIntro.dataset.pisTeam = '1';
            const eyebrow = moreIntro.querySelector('.admin-screen-eyebrow');
            const text = moreIntro.querySelector('p');
            if (eyebrow) eyebrow.textContent = 'MY ACCOUNT';
            if (text) text.textContent = 'Your profile and notification settings.';
        }
        const toolsHeading = document.querySelector('.admin-more-tools .admin-more-section-heading');
        if (toolsHeading && !toolsHeading.dataset.pisTeam) {
            toolsHeading.dataset.pisTeam = '1';
            const eyebrow = toolsHeading.querySelector('.admin-screen-eyebrow');
            const title = toolsHeading.querySelector('h2');
            const text = toolsHeading.querySelector('p');
            if (eyebrow) eyebrow.textContent = 'SETTINGS';
            if (title) title.textContent = 'Notifications';
            if (text) text.textContent = 'Get alerts on this device when you are assigned a visit.';
        }
        const pushStatus = document.getElementById('admin-push-notification-status');
        if (pushStatus && /bookings/i.test(pushStatus.textContent)) {
            pushStatus.textContent = 'Get notified when a visit is assigned to you.';
        }

        // Push settings: employees only get assignment alerts.
        const prefs = document.querySelector('#admin-push-notifications-modal .admin-push-preferences');
        if (prefs && !document.querySelector('.pis-team-push-note')) {
            const note = document.createElement('p');
            note.className = 'pis-team-push-note';
            note.textContent = "You'll get a notification on this device whenever a visit is assigned to you.";
            prefs.parentNode.insertBefore(note, prefs);
        }
    }

    /* ---------- styles ---------- */

    const style = document.createElement('style');
    style.textContent = `
        .pis-assign { margin: 14px 0 0; padding: 12px 14px; border: 1px solid #dbe6f1; border-radius: 12px; background: #f7fafd; }
        .pis-assign-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0; }
        .pis-assign-label { white-space: nowrap; display: inline-flex; align-items: center; gap: 7px; color: #46617d; font-size: 13px; font-weight: 800; letter-spacing: .02em; }
        .pis-assign-select { flex: 1 1 auto; max-width: 240px; min-width: 0; min-height: 40px; padding: 0 34px 0 12px; border: 1px solid #c9d9ea; border-radius: 10px; background: #fff; color: #1d2b3a; font: inherit; font-weight: 700; }
        .pis-assign-all { display: flex; align-items: center; gap: 8px; margin: 10px 0 0; color: #46617d; font-size: 13px; font-weight: 600; }
        .pis-assign-all input { width: 18px; height: 18px; accent-color: #1f63b8; }
        .pis-assign-msg { margin: 8px 0 0; color: #2e6b3f; font-size: 13px; font-weight: 700; }
        .pis-assign-msg:empty { display: none; }
        .pis-badge.pis-badge-assignee { background: #ebe5fb !important; color: #5a3aa8 !important; }

        body.pis-employee #admin-financial-snapshot,
        body.pis-employee #admin-best-route,
        body.pis-employee #admin-needs-attention,
        body.pis-employee #admin-open-services-pricing,
        body.pis-employee .admin-more-tool-grid > :not(#admin-enable-push-notifications),
        body.pis-employee #pis-lifetime-stats,
        body.pis-employee .admin-client-billing-grid,
        body.pis-employee .admin-payment-status,
        body.pis-employee .pis-pill-payment,
        body.pis-employee #admin-push-notifications-modal .admin-push-preferences,
        body.pis-employee [data-visit-action="reopen"] { display: none !important; }

        .pis-team-push-note { margin: 16px 0 0; padding: 14px 16px; border: 1px solid #d7e7f5; border-radius: 12px; background: #f4f9fe; color: #33506d; font-size: 14px; line-height: 1.5; }
    `;
    document.head.appendChild(style);

    /* ---------- keep the employee view tidy as screens re-render ---------- */

    let queued = false;
    const observer = new MutationObserver(() => {
        if (queued || !isEmployee()) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; tidyEmployeeScreens(); });
    });
    function start() {
        observer.observe(document.body, { childList: true, subtree: true });
        tidyEmployeeScreens();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
