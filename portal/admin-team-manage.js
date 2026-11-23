/* ========================================
   PAWS IN STRIDE: TEAM (owner only)
   ========================================
   Load AFTER admin.js and admin-team.js.

   More → Team:
   - list of employees: active, waiting to make their login, deactivated
   - Add Employee (photo, name, phone, email) → 6-digit setup code to text them
   - tap someone: their stats, upcoming visits, check-in / check-out history
   - Edit, Deactivate (upcoming visits come back to you), Reactivate

   Employees make their login on portal/join-team.html with their email and
   the setup code. Database side: paws-team-setup.sql.
   ======================================== */
(function () {
    'use strict';

    const JOIN_URL = 'https://pawsinstride.com/portal/join-team.html';
    const BUCKET = typeof PROFILE_PHOTO_BUCKET !== 'undefined' ? PROFILE_PHOTO_BUCKET : 'profile-photos';

    const esc = value => (typeof escapeHtml === 'function'
        ? escapeHtml(value)
        : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
    const lower = value => String(value || '').trim().toLowerCase();
    const isOwner = () => window.PIS_STAFF_ROLE !== 'employee';
    const db = () => supabaseClient;
    const visits = () => (typeof allVisits !== 'undefined' && Array.isArray(allVisits) ? allVisits : []);
    const profiles = () => (typeof allProfiles !== 'undefined' && Array.isArray(allProfiles) ? allProfiles : []);
    const firstName = name => String(name || '').trim().split(/\s+/)[0] || '';
    const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
    const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || window.Capacitor?.getPlatform?.() === 'ios';
    const digits = phone => String(phone || '').replace(/[^\d+]/g, '');

    let team = null;          // { dialog, data: { members, invites }, view, selectedId, photoUrls }

    /* ---------- small helpers ---------- */

    function friendlyError(error, fallback) {
        const text = String(error?.message || '');
        if (/admin_list_team|admin_add_employee|function .* does not exist|PGRST202/i.test(text)) {
            return 'The Team feature needs its one-time database setup (paws-team-setup.sql) first.';
        }
        if (!navigator.onLine) return "You're offline. Reconnect and try again.";
        return text || fallback;
    }

    function localDate(ymd) {
        const [y, m, d] = String(ymd || '').split('-').map(Number);
        return y ? new Date(y, (m || 1) - 1, d || 1) : null;
    }
    function todayYmd() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    function dayLabel(ymd) {
        const d = localDate(ymd);
        return d ? d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : '';
    }
    function shortDate(value) {
        const d = value ? new Date(value) : null;
        return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }) : '';
    }
    function clock(value) {
        const d = value ? new Date(value) : null;
        return d && !Number.isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
    }
    function minutesBetween(a, b) {
        const ms = new Date(b) - new Date(a);
        return Number.isFinite(ms) && ms > 0 ? Math.round(ms / 60000) : null;
    }
    function duration(min) {
        if (min == null) return '';
        if (min < 60) return `${min} min`;
        return `${Math.floor(min / 60)} hr${min % 60 ? ` ${min % 60} min` : ''}`;
    }
    const isCancelled = v => lower(v?.status) === 'cancelled';
    const isDone = v => Boolean(v?.completed_at) || lower(v?.status) === 'completed';

    function petNames(visit) {
        try {
            const pets = typeof getAdminPetsForVisit === 'function' ? getAdminPetsForVisit(visit) : [];
            const names = (pets || []).map(p => p?.name).filter(Boolean);
            if (names.length) return names.join(' & ');
        } catch (error) { /* fall through */ }
        const client = profiles().find(p => p.id === visit.client_id);
        return client?.full_name || 'Visit';
    }
    const serviceName = v => String(v?.service_name || v?.service_type || 'Visit').replace(/_/g, ' ');

    async function photoUrl(path) {
        if (!path) return '';
        team.photoUrls ||= new Map();
        if (team.photoUrls.has(path)) return team.photoUrls.get(path);
        try {
            const { data } = await db().storage.from(BUCKET).createSignedUrl(path, 3600);
            const url = data?.signedUrl || '';
            team.photoUrls.set(path, url);
            return url;
        } catch (error) {
            return '';
        }
    }

    function avatar(person, size = 48) {
        return `<span class="pis-team-avatar" style="--size:${size}px" data-photo-path="${esc(person.photo_path || '')}">${esc(initials(person.full_name || person.email))}</span>`;
    }
    async function fillAvatars(root) {
        for (const el of root.querySelectorAll('.pis-team-avatar[data-photo-path]:not([data-filled])')) {
            el.dataset.filled = '1';
            const url = await photoUrl(el.dataset.photoPath);
            if (url && url !== 'data:,') {
                const img = new Image();
                img.alt = '';
                img.onload = () => { el.textContent = ''; el.appendChild(img); };
                img.src = url;
            }
        }
    }

    /* ---------- photo: square crop, 600px JPEG ---------- */

    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That photo couldn't be opened. Try a different one.")); };
            img.src = url;
        });
    }
    async function squarePhoto(file) {
        const img = await loadImage(file);
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const out = Math.min(600, side);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = out;
        // portraits: keep the top (faces) rather than the exact middle
        const sx = (img.naturalWidth - side) / 2;
        const sy = img.naturalHeight > img.naturalWidth ? (img.naturalHeight - side) * 0.2 : (img.naturalHeight - side) / 2;
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, out, out);
        return new Promise((resolve, reject) => canvas.toBlob(
            blob => (blob ? resolve(blob) : reject(new Error("That photo couldn't be prepared."))), 'image/jpeg', 0.86));
    }
    async function uploadPhoto(blob) {
        const path = `team/${(crypto.randomUUID?.() || String(Date.now()))}.jpg`;
        const { error } = await db().storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
        if (error) throw error;
        return path;
    }

    /* ---------- data ---------- */

    async function loadTeam() {
        const { data, error } = await db().rpc('admin_list_team');
        if (error) throw error;
        team.data = { members: Array.isArray(data?.members) ? data.members : [], invites: Array.isArray(data?.invites) ? data.invites : [] };
    }

    function memberVisits(id) {
        return visits().filter(v => v.assigned_to === id && !isCancelled(v));
    }

    function statsFor(id) {
        const list = memberVisits(id);
        const done = list.filter(isDone);
        const today = todayYmd();
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        const weekStart = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
        const times = done.map(v => minutesBetween(v.checked_in_at, v.completed_at)).filter(m => m != null && m <= 600);
        return {
            week: done.filter(v => String(v.visit_date) >= weekStart && String(v.visit_date) <= today).length,
            month: done.filter(v => String(v.visit_date) >= monthStart && String(v.visit_date) <= today).length,
            all: done.length,
            upcoming: list.filter(v => !isDone(v) && !v.checked_in_at && String(v.visit_date) >= today)
                .sort((a, b) => String(a.visit_date).localeCompare(String(b.visit_date))),
            history: list.filter(v => v.checked_in_at)
                .sort((a, b) => String(b.checked_in_at).localeCompare(String(a.checked_in_at))),
            avgMinutes: times.length ? Math.round(times.reduce((s, m) => s + m, 0) / times.length) : null
        };
    }

    async function walksFor(id) {
        try {
            const { data, error } = await db().from('visit_walks')
                .select('id, visit_id, walker_id, distance_meters, duration_seconds, started_at, status')
                .eq('walker_id', id);
            if (error) throw error;
            const walks = (data || []).filter(w => lower(w.status) !== 'cancelled');
            const meters = walks.reduce((s, w) => s + (Number(w.distance_meters) || 0), 0);
            return { count: walks.length, miles: meters / 1609.344 };
        } catch (error) {
            console.warn('Team walk stats:', error);
            return null;
        }
    }

    /* ---------- dialog shell ---------- */

    function openTeam() {
        if (!isOwner()) return;
        if (team?.dialog?.open) return;
        const dialog = document.createElement('dialog');
        dialog.className = 'boarding-update-dialog pis-team-dialog';
        dialog.setAttribute('aria-labelledby', 'pis-team-title');
        dialog.innerHTML = `
            <header class="boarding-editor-header">
                <div>
                    <small>PAWS IN STRIDE</small>
                    <h2 id="pis-team-title">Team</h2>
                    <p data-team-subtitle>Your employees, their visits and check-ins.</p>
                </div>
                <button type="button" data-boarding-close data-team-close aria-label="Close team">×</button>
            </header>
            <div class="boarding-editor-body pis-team-body" data-team-body></div>`;
        document.body.appendChild(dialog);
        team = { dialog, data: null, view: 'list', selectedId: null, photoUrls: new Map() };
        dialog.addEventListener('cancel', event => { event.preventDefault(); closeTeam(); });
        dialog.addEventListener('click', onClick);
        dialog.addEventListener('submit', onSubmit);
        dialog.addEventListener('change', onChange);
        dialog.showModal();
        void showList();
    }

    function closeTeam() {
        if (!team) return;
        const { dialog } = team;
        team = null;
        dialog.close();
        dialog.remove();
    }

    function body() { return team.dialog.querySelector('[data-team-body]'); }
    function setSubtitle(text) { team.dialog.querySelector('[data-team-subtitle]').textContent = text; }
    function render(html, subtitle) {
        if (subtitle) setSubtitle(subtitle);
        body().innerHTML = html;
        team.dialog.scrollTop = 0;
        void fillAvatars(body());
    }

    /* ---------- list ---------- */

    function row(person, kind) {
        let sub = '';
        if (kind === 'active') sub = person.last_sign_in_at ? `Last signed in ${shortDate(person.last_sign_in_at)}` : 'Active';
        if (kind === 'invite') sub = person.locked ? 'Locked after too many wrong codes' : `No login yet · Code ${person.setup_code}`;
        if (kind === 'left') sub = person.left_at ? `Deactivated ${shortDate(person.left_at)}` : 'Deactivated';
        const upcoming = kind === 'active' ? statsFor(person.id).upcoming.length : 0;
        return `
            <button type="button" class="pis-team-row pis-team-row-${kind}" data-team-open="${esc(person.id)}" data-team-kind="${kind}">
                ${avatar(person)}
                <span class="pis-team-row-text">
                    <strong>${esc(person.full_name || person.email || 'Employee')}</strong>
                    <span><i class="pis-team-dot"></i>${esc(sub)}</span>
                </span>
                ${upcoming ? `<span class="pis-team-count" title="Upcoming visits">${upcoming}</span>` : ''}
                <span class="pis-team-chevron" aria-hidden="true">›</span>
            </button>`;
    }

    async function showList(options = {}) {
        team.view = 'list';
        team.selectedId = null;
        if (!options.keepData || !team.data) {
            render('<p class="pis-team-note">Loading your team…</p>', 'Your employees, their visits and check-ins.');
            try {
                await loadTeam();
            } catch (error) {
                console.error('Team load error:', error);
                if (!team) return;
                render(`<p class="pis-team-error">${esc(friendlyError(error, "Your team couldn't load."))}</p>
                    <button type="button" class="pis-team-btn" data-team-retry>Try Again</button>`);
                return;
            }
        }
        if (!team) return;
        const { members, invites } = team.data;
        const active = members.filter(m => m.status === 'active');
        const left = members.filter(m => m.status !== 'active');
        const section = (title, items, kind) => items.length ? `
            <h3 class="pis-team-heading">${title} <span>${items.length}</span></h3>
            <div class="pis-team-list">${items.map(p => row(p, kind)).join('')}</div>` : '';
        render(`
            <button type="button" class="pis-team-btn pis-team-btn-primary pis-team-add" data-team-add>+ Add Employee</button>
            ${message()}
            ${!active.length && !invites.length && !left.length ? '<p class="pis-team-note">No team members yet. Tap Add Employee to add your first one.</p>' : ''}
            ${section('Active', active, 'active')}
            ${section('Waiting to Make Their Login', invites, 'invite')}
            ${section('Deactivated', left, 'left')}`, 'Your employees, their visits and check-ins.');
    }

    // one-time confirmation line shown after an action
    let flash = '';
    function message() { const text = flash; flash = ''; return text ? `<p class="pis-team-flash" role="status">${esc(text)}</p>` : ''; }

    /* ---------- member detail ---------- */

    function contactButtons(person) {
        const out = [];
        if (person.phone) {
            out.push(`<a class="pis-team-contact" href="tel:${esc(digits(person.phone))}">Call</a>`);
            out.push(`<a class="pis-team-contact" href="sms:${esc(digits(person.phone))}">Text</a>`);
        }
        if (person.email) out.push(`<a class="pis-team-contact" href="mailto:${esc(person.email)}">Email</a>`);
        return out.length ? `<div class="pis-team-contacts">${out.join('')}</div>` : '';
    }

    function visitLine(v, mode) {
        const where = `${esc(petNames(v))} · ${esc(serviceName(v))}`;
        if (mode === 'upcoming') {
            return `<li><strong>${esc(dayLabel(v.visit_date))}${v.time_window ? ` · ${esc(v.time_window)}` : ''}</strong><span>${where}</span></li>`;
        }
        const minutes = v.completed_at ? minutesBetween(v.checked_in_at, v.completed_at) : null;
        const times = v.completed_at
            ? `In ${esc(clock(v.checked_in_at))} · Out ${esc(clock(v.completed_at))}${minutes != null ? ` · ${esc(duration(minutes))}` : ''}`
            : `In ${esc(clock(v.checked_in_at))} · Still checked in`;
        return `<li><strong>${esc(dayLabel(v.visit_date))}</strong><span>${where}</span><em>${times}</em></li>`;
    }

    async function showMember(id) {
        const person = team.data.members.find(m => m.id === id);
        if (!person) return showList({ keepData: true });
        team.view = 'member';
        team.selectedId = id;
        const s = statsFor(id);
        const active = person.status === 'active';
        const historyShown = s.history.slice(0, 20);
        render(`
            <button type="button" class="pis-team-back" data-team-back>‹ Team</button>
            ${message()}
            <div class="pis-team-profile">
                ${avatar(person, 84)}
                <div>
                    <h3>${esc(person.full_name || person.email)}</h3>
                    <p><span class="pis-team-status pis-team-status-${active ? 'active' : 'left'}">${active ? 'Active' : 'Deactivated'}</span>
                       ${person.joined_at ? `Joined ${esc(shortDate(person.joined_at))}` : ''}</p>
                    <p class="pis-team-muted">${esc([person.phone, person.email].filter(Boolean).join(' · '))}</p>
                </div>
            </div>
            ${contactButtons(person)}
            <div class="pis-team-stats">
                <div><strong>${s.week}</strong><span>Visits Last 7 Days</span></div>
                <div><strong>${s.month}</strong><span>Visits This Month</span></div>
                <div><strong>${s.all}</strong><span>Visits All Time</span></div>
                <div><strong>${s.upcoming.length}</strong><span>Upcoming</span></div>
                <div data-team-walks><strong>…</strong><span>Walks</span></div>
                <div data-team-miles><strong>…</strong><span>Miles Walked</span></div>
                <div><strong>${s.avgMinutes != null ? esc(duration(s.avgMinutes)) : '—'}</strong><span>Avg Time per Visit</span></div>
                <div><strong>${person.last_sign_in_at ? esc(shortDate(person.last_sign_in_at)) : '—'}</strong><span>Last Signed In</span></div>
            </div>
            <h3 class="pis-team-heading">Upcoming Visits <span>${s.upcoming.length}</span></h3>
            ${s.upcoming.length ? `<ul class="pis-team-visits">${s.upcoming.slice(0, 10).map(v => visitLine(v, 'upcoming')).join('')}</ul>
                ${s.upcoming.length > 10 ? `<p class="pis-team-muted">+ ${s.upcoming.length - 10} more</p>` : ''}`
                : `<p class="pis-team-note">${active ? 'Nothing assigned yet. Open a visit and use Assigned To.' : 'None.'}</p>`}
            <h3 class="pis-team-heading">Check-Ins <span>${s.history.length}</span></h3>
            ${historyShown.length ? `<ul class="pis-team-visits">${historyShown.map(v => visitLine(v, 'history')).join('')}</ul>
                ${s.history.length > historyShown.length ? `<p class="pis-team-muted">Showing the latest ${historyShown.length}.</p>` : ''}`
                : '<p class="pis-team-note">No check-ins yet.</p>'}
            <div class="pis-team-actions">
                <button type="button" class="pis-team-btn" data-team-edit="${esc(id)}">Edit Info</button>
                ${active
                    ? `<button type="button" class="pis-team-btn pis-team-btn-danger" data-team-deactivate="${esc(id)}">Deactivate</button>`
                    : `<button type="button" class="pis-team-btn pis-team-btn-primary" data-team-reactivate="${esc(id)}">Reactivate</button>`}
            </div>
            <div data-team-confirm></div>`, firstName(person.full_name) ? `${firstName(person.full_name)}'s visits and check-ins` : 'Team member');

        const walks = await walksFor(id);
        if (!team || team.selectedId !== id) return;
        const w = team.dialog.querySelector('[data-team-walks] strong');
        const m = team.dialog.querySelector('[data-team-miles] strong');
        if (w) w.textContent = walks ? String(walks.count) : '—';
        if (m) m.textContent = walks ? walks.miles.toFixed(walks.miles >= 10 ? 0 : 1) : '—';
    }

    /* ---------- invite detail ---------- */

    function setupMessage(invite) {
        const name = firstName(invite.full_name);
        return `Hi${name ? ` ${name}` : ''}! You're on the Paws in Stride team 🐾 Make your login here: ${JOIN_URL} `
            + `using this email: ${invite.email} and setup code: ${invite.setup_code}. `
            + `(In the Paws in Stride app, tap "Joining the Team?" on the sign-in screen.)`;
    }

    function showInvite(id) {
        const invite = team.data.invites.find(i => i.id === id);
        if (!invite) return showList({ keepData: true });
        team.view = 'invite';
        team.selectedId = id;
        const smsHref = invite.phone ? `sms:${digits(invite.phone)}${isIOS() ? '&' : '?'}body=${encodeURIComponent(setupMessage(invite))}` : '';
        render(`
            <button type="button" class="pis-team-back" data-team-back>‹ Team</button>
            ${message()}
            <div class="pis-team-profile">
                ${avatar(invite, 84)}
                <div>
                    <h3>${esc(invite.full_name)}</h3>
                    <p><span class="pis-team-status pis-team-status-invite">No Login Yet</span> Added ${esc(shortDate(invite.created_at))}</p>
                    <p class="pis-team-muted">${esc([invite.phone, invite.email].filter(Boolean).join(' · '))}</p>
                </div>
            </div>
            <div class="pis-team-code">
                <span>Setup Code</span>
                <strong>${esc(String(invite.setup_code).replace(/(\d{3})(\d{3})/, '$1 $2'))}</strong>
                <p>${invite.locked
                    ? 'Locked after too many wrong tries. Remove this invite and add them again for a new code.'
                    : `${esc(firstName(invite.full_name) || 'They')} goes to <b>Joining the Team?</b> on the sign-in page, enters <b>${esc(invite.email)}</b>, this code, and picks a password.`}</p>
            </div>
            <div class="pis-team-actions pis-team-actions-stack">
                ${smsHref ? `<a class="pis-team-btn pis-team-btn-primary" href="${esc(smsHref)}">Text Them the Setup Info</a>` : ''}
                <button type="button" class="pis-team-btn" data-team-copy="${esc(id)}">Copy Setup Info</button>
                <button type="button" class="pis-team-btn" data-team-edit-invite="${esc(id)}">Edit Info</button>
                <button type="button" class="pis-team-btn pis-team-btn-danger" data-team-remove-invite="${esc(id)}">Remove</button>
            </div>
            <div data-team-confirm></div>`, 'Waiting for them to make their login');
    }

    /* ---------- add / edit form ---------- */

    function showForm(kind, id) {
        // kind: 'add' | 'member' | 'invite'
        const person = kind === 'member' ? team.data.members.find(m => m.id === id)
            : kind === 'invite' ? team.data.invites.find(i => i.id === id) : {};
        team.view = 'form';
        team.form = { kind, id, photoBlob: null };
        render(`
            <button type="button" class="pis-team-back" data-team-back-to="${kind === 'add' ? '' : esc(id)}" data-team-back-kind="${kind}">‹ ${kind === 'add' ? 'Team' : 'Back'}</button>
            <form class="pis-team-form" data-team-form novalidate>
                <div class="pis-team-photo-pick">
                    <span class="pis-team-avatar pis-team-avatar-pick" style="--size:96px" ${person?.photo_path ? `data-photo-path="${esc(person.photo_path)}"` : ''} data-team-preview>${person?.full_name ? esc(initials(person.full_name)) : '+'}</span>
                    <div>
                        <label class="pis-team-btn pis-team-file">
                            ${person?.photo_path ? 'Change Photo' : 'Choose Photo'}
                            <input type="file" accept="image/*" data-team-photo hidden>
                        </label>
                        <p class="pis-team-muted">A clear photo of their face. Clients may see it later.</p>
                    </div>
                </div>
                <label class="pis-team-field">Full Name
                    <input type="text" name="full_name" autocomplete="off" autocapitalize="words" required value="${esc(person?.full_name || '')}" placeholder="Alex Rivera">
                </label>
                <label class="pis-team-field">Phone
                    <input type="tel" name="phone" autocomplete="off" inputmode="tel" value="${esc(person?.phone || '')}" placeholder="(214) 555-0123">
                </label>
                <label class="pis-team-field">Their Email
                    <input type="email" name="email" autocomplete="off" inputmode="email" autocapitalize="none" ${kind === 'member' ? 'disabled' : 'required'} value="${esc(person?.email || '')}" placeholder="alex@email.com">
                </label>
                <p class="pis-team-muted">${kind === 'member'
                    ? "Their email is their login, so it can't be changed here."
                    : "They'll make their login with this email under <b>Joining the Team?</b> on the sign-in page, using a setup code you'll get next."}</p>
                <p class="pis-team-error" data-team-form-error hidden></p>
                <button type="submit" class="pis-team-btn pis-team-btn-primary" data-team-save>${kind === 'add' ? 'Add to Team' : 'Save Changes'}</button>
            </form>`, kind === 'add' ? 'Add an employee' : 'Edit info');
    }

    async function saveForm(form) {
        const f = team.form;
        const error = form.querySelector('[data-team-form-error]');
        const button = form.querySelector('[data-team-save]');
        const name = form.full_name.value.trim();
        const phone = form.phone.value.trim();
        const email = form.email.value.trim().toLowerCase();
        const fail = (text, field) => {
            if (field && window.PisFormErrors) { error.hidden = true; window.PisFormErrors.show(field, text); return; }
            error.textContent = text; error.hidden = false;
        };
        error.hidden = true;
        window.PisFormErrors?.clearAll(form);
        if (!name) return fail('Add their name.', form.full_name);
        if (f.kind !== 'member' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(email ? "That email doesn't look right." : 'Add their email.', form.email);
        if (phone && phone.replace(/\D/g, '').length !== 10) return fail('Enter a 10-digit phone number, or leave it blank.', form.phone);
        if (!navigator.onLine) return fail("You're offline. Reconnect and try again.");

        button.disabled = true;
        const label = button.textContent;
        button.textContent = 'Saving…';
        try {
            const photoPath = f.photoBlob ? await uploadPhoto(f.photoBlob) : null;
            if (f.kind === 'add') {
                const { data, error: err } = await db().rpc('admin_add_employee', {
                    p_email: email, p_full_name: name, p_phone: phone || null, p_photo_path: photoPath });
                if (err) throw err;
                await loadTeam();
                if (!team) return;
                flash = `${firstName(name)} was added. Text them the setup info so they can make their login.`;
                return showInvite(data?.id);
            }
            if (f.kind === 'invite') {
                const { error: err } = await db().from('staff_invites')
                    .update({ full_name: name, phone: phone || null, email, ...(photoPath ? { photo_path: photoPath } : {}) })
                    .eq('id', f.id);
                if (err) throw err;
                await loadTeam();
                if (!team) return;
                flash = 'Saved ✓';
                return showInvite(f.id);
            }
            const { error: err } = await db().rpc('admin_update_employee', {
                p_employee_id: f.id, p_full_name: name, p_phone: phone || null, p_photo_path: photoPath });
            if (err) throw err;
            const local = profiles().find(p => p.id === f.id);
            if (local) Object.assign(local, { full_name: name, phone: phone || null, ...(photoPath ? { profile_photo_path: photoPath } : {}) });
            await loadTeam();
            if (!team) return;
            flash = 'Saved ✓';
            return showMember(f.id);
        } catch (err) {
            console.error('Team save error:', err);
            const text = /duplicate|already|unique/i.test(String(err?.message)) && f.kind === 'invite'
                ? 'You already added that email.' : friendlyError(err, "That couldn't be saved. Try again.");
            fail(text, /email/i.test(text) ? form.email : /name/i.test(text) ? form.full_name : null);
        } finally {
            if (button.isConnected) { button.disabled = false; button.textContent = label; }
        }
    }

    /* ---------- confirm boxes (in the dialog, not browser pop-ups) ---------- */

    function confirmBox(html, yesLabel, onYes, danger = true) {
        const mount = team.dialog.querySelector('[data-team-confirm]');
        if (!mount) return;
        mount.innerHTML = `
            <div class="pis-team-confirm" role="alertdialog">
                ${html}
                <p class="pis-team-error" data-team-confirm-error hidden></p>
                <div class="pis-team-actions">
                    <button type="button" class="pis-team-btn" data-team-confirm-no>Cancel</button>
                    <button type="button" class="pis-team-btn ${danger ? 'pis-team-btn-danger-solid' : 'pis-team-btn-primary'}" data-team-confirm-yes>${esc(yesLabel)}</button>
                </div>
            </div>`;
        mount.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        mount.querySelector('[data-team-confirm-no]').onclick = () => { mount.innerHTML = ''; };
        const yes = mount.querySelector('[data-team-confirm-yes]');
        yes.onclick = async () => {
            yes.disabled = true;
            yes.textContent = 'Working…';
            try {
                await onYes();
            } catch (error) {
                console.error('Team action error:', error);
                const err = mount.querySelector('[data-team-confirm-error]');
                if (err) { err.textContent = friendlyError(error, "That didn't go through. Try again."); err.hidden = false; }
                yes.disabled = false;
                yes.textContent = yesLabel;
            }
        };
    }

    function refreshSchedule() {
        try { if (typeof renderAdminDayServices === 'function') renderAdminDayServices(); } catch (e) { /* ignore */ }
        try { if (typeof renderAdminCalendar === 'function') renderAdminCalendar(); } catch (e) { /* ignore */ }
    }

    function askDeactivate(id) {
        const person = team.data.members.find(m => m.id === id);
        const name = firstName(person?.full_name) || 'They';
        const count = statsFor(id).upcoming.length;
        confirmBox(`
            <strong>Deactivate ${esc(person?.full_name || 'this employee')}?</strong>
            <p>${esc(name)} won't be able to use the staff app anymore.
               ${count ? `Their ${count} upcoming visit${count === 1 ? '' : 's'} will come back to you.` : ''}
               Their past visits, walks and check-ins stay in your records. You can reactivate them any time.</p>`,
            'Deactivate', async () => {
                if (!navigator.onLine) throw new Error("You're offline. Reconnect and try again.");
                const { data, error } = await db().rpc('admin_set_employee_active', { p_employee_id: id, p_active: false });
                if (error) throw error;
                for (const v of visits()) {
                    if (v.assigned_to === id && !isDone(v) && !v.checked_in_at && !isCancelled(v)) v.assigned_to = null;
                }
                const local = profiles().find(p => p.id === id);
                if (local) local.role = 'former_employee';
                refreshSchedule();
                const returned = Number(data?.returned_visits) || 0;
                flash = `${name} was deactivated.${returned ? ` ${returned} visit${returned === 1 ? ' is' : 's are'} back on your schedule.` : ''}`;
                await loadTeam();
                if (team) showMember(id);
            });
    }

    function askReactivate(id) {
        const person = team.data.members.find(m => m.id === id);
        confirmBox(`<strong>Reactivate ${esc(person?.full_name || 'this employee')}?</strong>
            <p>They can sign in to the staff app again with their old login. Assign them visits from any visit's Assigned To menu.</p>`,
            'Reactivate', async () => {
                const { error } = await db().rpc('admin_set_employee_active', { p_employee_id: id, p_active: true });
                if (error) throw error;
                const local = profiles().find(p => p.id === id);
                if (local) local.role = 'employee';
                flash = `${firstName(person?.full_name) || 'They'} can sign in again ✓`;
                await loadTeam();
                if (team) showMember(id);
            }, false);
    }

    function askRemoveInvite(id) {
        const invite = team.data.invites.find(i => i.id === id);
        confirmBox(`<strong>Remove ${esc(invite?.full_name || 'this invite')}?</strong>
            <p>Their setup code stops working. You can add them again later.</p>`,
            'Remove', async () => {
                const { error } = await db().rpc('admin_delete_staff_invite', { p_invite_id: id });
                if (error) throw error;
                flash = `${invite?.full_name || 'The invite'} was removed.`;
                await showList();
            });
    }

    async function copyInvite(id, button) {
        const invite = team.data.invites.find(i => i.id === id);
        if (!invite) return;
        const text = setupMessage(invite);
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            const area = document.createElement('textarea');
            area.value = text;
            team.dialog.appendChild(area);
            area.select();
            try { document.execCommand('copy'); } catch (e) { /* ignore */ }
            area.remove();
        }
        button.textContent = 'Copied ✓';
        setTimeout(() => { if (button.isConnected) button.textContent = 'Copy Setup Info'; }, 2000);
    }

    /* ---------- events ---------- */

    function onClick(event) {
        const t = event.target.closest('button, a');
        if (!t || !team) return;
        if (t.matches('[data-team-close]')) return closeTeam();
        if (t.matches('[data-team-retry]')) return void showList();
        if (t.matches('[data-team-add]')) return showForm('add');
        if (t.matches('[data-team-back]')) return void showList({ keepData: true });
        if (t.matches('[data-team-back-to]')) {
            const id = t.dataset.teamBackTo;
            if (!id) return void showList({ keepData: true });
            return t.dataset.teamBackKind === 'invite' ? showInvite(id) : void showMember(id);
        }
        if (t.matches('[data-team-open]')) {
            return t.dataset.teamKind === 'invite' ? showInvite(t.dataset.teamOpen) : void showMember(t.dataset.teamOpen);
        }
        if (t.matches('[data-team-edit]')) return showForm('member', t.dataset.teamEdit);
        if (t.matches('[data-team-edit-invite]')) return showForm('invite', t.dataset.teamEditInvite);
        if (t.matches('[data-team-deactivate]')) return askDeactivate(t.dataset.teamDeactivate);
        if (t.matches('[data-team-reactivate]')) return askReactivate(t.dataset.teamReactivate);
        if (t.matches('[data-team-remove-invite]')) return askRemoveInvite(t.dataset.teamRemoveInvite);
        if (t.matches('[data-team-copy]')) return void copyInvite(t.dataset.teamCopy, t);
    }

    function onSubmit(event) {
        const form = event.target.closest('[data-team-form]');
        if (!form) return;
        event.preventDefault();
        void saveForm(form);
    }

    async function onChange(event) {
        const input = event.target.closest('[data-team-photo]');
        if (!input || !team?.form) return;
        const file = input.files?.[0];
        if (!file) return;
        const preview = team.dialog.querySelector('[data-team-preview]');
        const error = team.dialog.querySelector('[data-team-form-error]');
        try {
            const blob = await squarePhoto(file);
            if (!team?.form) return;
            team.form.photoBlob = blob;
            const img = new Image();
            img.alt = '';
            img.src = URL.createObjectURL(blob);
            preview.textContent = '';
            preview.appendChild(img);
            if (error) error.hidden = true;
        } catch (err) {
            if (error) { error.textContent = err.message; error.hidden = false; }
        } finally {
            input.value = '';
        }
    }

    /* ---------- More → Team card ---------- */

    function addCard() {
        if (!isOwner() || document.getElementById('pis-open-team')) return;
        const grid = document.querySelector('.admin-more-tool-grid');
        if (!grid) return;
        const card = document.createElement('button');
        card.type = 'button';
        card.id = 'pis-open-team';
        card.className = 'admin-more-tool-card';
        card.innerHTML = `
            <span class="admin-more-tool-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"></path><circle cx="17" cy="9" r="2.6"></circle><path d="M17 14.2c2.6.3 4.5 2.2 4.5 5.3"></path></svg>
            </span>
            <span class="admin-more-tool-copy">
                <strong>Team</strong>
                <span>Add employees, see their visits and check-ins, or deactivate an account.</span>
            </span>
            <span class="admin-more-tool-arrow">›</span>`;
        card.addEventListener('click', openTeam);
        const push = document.getElementById('admin-enable-push-notifications');
        if (push && push.parentNode === grid) push.after(card); else grid.prepend(card);
    }

    window.pisTeamManage = { open: openTeam, close: closeTeam };

    /* ---------- styles ---------- */

    const style = document.createElement('style');
    style.textContent = `
        .pis-team-dialog .pis-team-body { padding: 18px 18px 26px; text-align: left; }
        .pis-team-dialog .pis-team-btn { appearance: none; -webkit-appearance: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 0 18px; border: 1px solid #c9d9ea; border-radius: 12px; background: #fff; color: #1d4f7c; font: inherit; font-size: 15px; font-weight: 800; text-decoration: none; cursor: pointer; }
        .pis-team-dialog .pis-team-btn-primary { border-color: #1f6fb8; background: #1f6fb8; color: #fff; }
        .pis-team-dialog .pis-team-btn-danger { border-color: #e7b4ac; color: #b23a2b; }
        .pis-team-dialog .pis-team-btn-danger-solid { border-color: #c2412f; background: #c2412f; color: #fff; }
        .pis-team-dialog .pis-team-add { width: 100%; margin: 0 0 6px; }
        .pis-team-dialog .pis-team-heading { display: flex; align-items: center; gap: 8px; margin: 22px 0 8px; color: #46617d; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .pis-team-dialog .pis-team-heading span { min-width: 22px; padding: 2px 7px; border-radius: 99px; background: #eef4fa; color: #46617d; font-size: 11px; text-align: center; letter-spacing: 0; }
        .pis-team-dialog .pis-team-list { border: 1px solid #e0eaf1; border-radius: 14px; overflow: hidden; }
        .pis-team-dialog .pis-team-row { appearance: none; -webkit-appearance: none; display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border: 0; border-top: 1px solid #e9f0f5; background: #fff; color: inherit; font: inherit; text-align: left; cursor: pointer; }
        .pis-team-dialog .pis-team-row:first-child { border-top: 0; }
        .pis-team-dialog .pis-team-row:active { background: #f4f8fb; }
        .pis-team-dialog .pis-team-row-text { flex: 1 1 auto; min-width: 0; display: grid; gap: 3px; }
        .pis-team-dialog .pis-team-row-text strong { font-size: 16px; color: #15384d; }
        .pis-team-dialog .pis-team-row-text span { display: flex; align-items: center; gap: 6px; color: #617383; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pis-team-dialog .pis-team-dot { flex: 0 0 8px; width: 8px; height: 8px; border-radius: 50%; background: #2f9a5b; }
        .pis-team-dialog .pis-team-row-invite .pis-team-dot { background: #e79a2c; }
        .pis-team-dialog .pis-team-row-left .pis-team-dot { background: #a5b2bd; }
        .pis-team-dialog .pis-team-row-left .pis-team-row-text strong { color: #6d7e8c; }
        .pis-team-dialog .pis-team-count { min-width: 26px; padding: 3px 8px; border-radius: 99px; background: #e8f1fa; color: #1f6fb8; font-size: 12px; font-weight: 800; text-align: center; }
        .pis-team-dialog .pis-team-chevron { color: #9fb1c1; font-size: 24px; line-height: 1; }
        .pis-team-dialog .pis-team-avatar { flex: 0 0 var(--size); width: var(--size); height: var(--size); display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; overflow: hidden; background: linear-gradient(135deg, #f6b14a, #ef8f24); color: #fff; font-weight: 800; font-size: calc(var(--size) * .36); }
        .pis-team-dialog .pis-team-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pis-team-dialog .pis-team-avatar-pick { background: #f1f5f9; color: #9fb1c1; border: 2px dashed #c9d6e2; }
        .pis-team-dialog .pis-team-back { appearance: none; -webkit-appearance: none; display: block; width: auto !important; min-width: 0 !important; text-align: left !important; margin: 0 auto 12px 0 !important; padding: 6px 0; border: 0; background: none; color: #1f6fb8; font: inherit; font-size: 15px; font-weight: 800; cursor: pointer; }
        .pis-team-dialog .pis-team-profile { display: flex; align-items: center; gap: 16px; }
        .pis-team-dialog .pis-team-profile h3 { margin: 0 0 6px; font-size: 22px; color: #15384d; }
        .pis-team-dialog .pis-team-profile p { margin: 0 0 4px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: #617383; font-size: 13px; }
        .pis-team-dialog .pis-team-status { padding: 3px 9px; border-radius: 99px; font-size: 12px; font-weight: 800; }
        .pis-team-dialog .pis-team-status-active { background: #e3f5ea; color: #23784a; }
        .pis-team-dialog .pis-team-status-left { background: #eef1f4; color: #637482; }
        .pis-team-dialog .pis-team-status-invite { background: #fdf0dd; color: #a2600f; }
        .pis-team-dialog .pis-team-muted { color: #6d7e8c; font-size: 13px; line-height: 1.5; margin: 6px 0 0; }
        .pis-team-dialog .pis-team-contacts { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px; margin: 16px 0 0; }
        .pis-team-dialog .pis-team-contact { display: flex; align-items: center; justify-content: center; min-height: 42px; border: 1px solid #c9d9ea; border-radius: 12px; color: #1d4f7c; font-weight: 800; text-decoration: none; }
        .pis-team-dialog .pis-team-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 18px 0 0; }
        @media (min-width: 560px) { .pis-team-dialog .pis-team-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .pis-team-dialog .pis-team-stats > div { padding: 12px; border: 1px solid #e0eaf1; border-radius: 12px; background: #f8fbfd; }
        .pis-team-dialog .pis-team-stats strong { display: block; font-size: 22px; color: #15384d; font-variant-numeric: tabular-nums; }
        .pis-team-dialog .pis-team-stats span { display: block; margin-top: 2px; color: #617383; font-size: 12px; font-weight: 700; }
        .pis-team-dialog .pis-team-visits { list-style: none; margin: 0; padding: 0; border: 1px solid #e0eaf1; border-radius: 14px; overflow: hidden; }
        .pis-team-dialog .pis-team-visits li { display: grid; gap: 2px; padding: 11px 14px; border-top: 1px solid #e9f0f5; font-size: 14px; }
        .pis-team-dialog .pis-team-visits li:first-child { border-top: 0; }
        .pis-team-dialog .pis-team-visits strong { color: #15384d; }
        .pis-team-dialog .pis-team-visits span { color: #46617d; text-transform: capitalize; }
        .pis-team-dialog .pis-team-visits em { font-style: normal; color: #2e6b3f; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .pis-team-dialog .pis-team-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 22px 0 0; }
        .pis-team-dialog .pis-team-actions > * { flex: 1 1 140px; }
        .pis-team-dialog .pis-team-actions-stack { flex-direction: column; }
        .pis-team-dialog .pis-team-actions-stack > * { flex: 0 0 auto; }
        .pis-team-dialog .pis-team-code { margin: 18px 0 0; padding: 18px; border: 1px solid #f3d6a8; border-radius: 14px; background: #fff8ee; text-align: center; }
        .pis-team-dialog .pis-team-code > span { color: #a2600f; font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .pis-team-dialog .pis-team-code strong { display: block; margin: 6px 0 8px; font-size: 34px; letter-spacing: .12em; color: #15384d; font-variant-numeric: tabular-nums; }
        .pis-team-dialog .pis-team-code p { margin: 0; color: #5e6b75; font-size: 13px; line-height: 1.6; }
        .pis-team-dialog .pis-team-form { display: grid; gap: 14px; }
        .pis-team-dialog .pis-team-photo-pick { display: flex; align-items: center; gap: 16px; }
        .pis-team-dialog .pis-team-file { position: relative; }
        .pis-team-dialog .pis-team-field { display: grid; gap: 6px; color: #46617d; font-size: 13px; font-weight: 800; }
        .pis-team-dialog .pis-team-field input { width: 100%; min-height: 46px; padding: 0 12px; border: 1px solid #c9d9ea; border-radius: 11px; background: #fff; color: #15384d; font: inherit; font-size: 16px; font-weight: 600; }
        .pis-team-dialog .pis-team-field input:disabled { background: #f2f5f8; color: #6d7e8c; }
        .pis-team-dialog .pis-team-note { margin: 10px 0 0; color: #617383; font-size: 14px; line-height: 1.6; }
        .pis-team-dialog .pis-team-error { margin: 0; color: #b23a2b; font-size: 14px; font-weight: 700; line-height: 1.5; }
        .pis-team-dialog .pis-team-flash { margin: 10px 0 0; padding: 11px 13px; border-radius: 11px; background: #e9f6ee; color: #23784a; font-size: 14px; font-weight: 700; line-height: 1.5; }
        .pis-team-dialog .pis-team-confirm { margin: 16px 0 0; padding: 16px; border: 1px solid #f0c7bf; border-radius: 14px; background: #fff6f4; }
        .pis-team-dialog .pis-team-confirm strong { color: #15384d; font-size: 16px; }
        .pis-team-dialog .pis-team-confirm p { margin: 8px 0 0; color: #4f5f6b; font-size: 14px; line-height: 1.6; }
        .pis-team-dialog .pis-team-confirm .pis-team-actions { margin-top: 14px; }
        body.pis-employee #pis-open-team { display: none !important; }
    `;
    document.head.appendChild(style);

    /* ---------- start: add the card when the More screen exists ---------- */

    function start() {
        addCard();
        if (!document.getElementById('pis-open-team')) {
            const observer = new MutationObserver(() => {
                if (!isOwner()) return;
                addCard();
                if (document.getElementById('pis-open-team')) observer.disconnect();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
