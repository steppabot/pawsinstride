/* Paws in Stride — Outside Income.
   Load AFTER admin.js and BEFORE admin-financial-more.js / admin-lifetime-stats.js.

   Clients you're paid for outside the app (for example 3 one-hour visits a day
   at $85 each). They're saved in the admin_outside_income table
   (sql/admin_outside_income.sql) and each one becomes an entry per visit per day,
   so they count in the Financial Snapshot, Full Financials and Lifetime Stats:
     - days before today count as earned
     - today through the end of this month (or the end of this week, if the week
       runs into next month) count as scheduled
   The entries only feed the money and time numbers. They never show up on the
   schedule, routes, client lists or anywhere else.

   window.PisOutsideIncome.visitsBetween(start, end) -> entries ('YYYY-MM-DD', null = open)
   window.PisOutsideIncome.cardHtml()                 -> the card for Full Financials
   window.PisOutsideIncome.load(force)                -> (re)load from Supabase
   Fires 'pis:outside-income' on document whenever the numbers change. */
(function () {
    'use strict';

    const TABLE = 'admin_outside_income';
    const COLUMNS = 'id, label, visits_per_day, price_per_visit, minutes_per_visit, days_of_week, start_date, end_date, skipped_dates';
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

    let rows = [];
    let state = 'idle'; // idle (never loaded) | ready | missing (table not set up) | error
    let loadedFor = '';
    let request = null;
    let version = 0;
    let memo = { key: '', list: [] };

    /* ---------- small helpers ---------- */
    const me = () => (typeof currentUser !== 'undefined' && currentUser?.id) || null;
    const isEmployee = () => window.PIS_STAFF_ROLE === 'employee';
    const today = () => getLocalDateString();
    const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
    const dateOf = d => makeDateString(d.getFullYear(), d.getMonth(), d.getDate());
    const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const money = (n, cents) => {
        const v = Number(n || 0);
        const show = cents && !Number.isInteger(Math.round(v * 100) / 100);
        return v.toLocaleString('en-US', {
            style: 'currency', currency: 'USD',
            minimumFractionDigits: show ? 2 : 0, maximumFractionDigits: show ? 2 : 0
        });
    };
    const int = (v, min, max, fallback) => {
        const n = Math.round(Number(v));
        return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
    };
    function addDays(date, n) {
        const d = parseLocalDate(date);
        d.setDate(d.getDate() + n);
        return dateOf(d);
    }
    function niceDate(date, withYear) {
        if (!isDate(date)) return '';
        const d = parseLocalDate(date);
        const showYear = withYear || d.getFullYear() !== parseLocalDate(today()).getFullYear();
        return `${MONTHS[d.getMonth()]} ${d.getDate()}${showYear ? ', ' + d.getFullYear() : ''}`;
    }
    // Entries run through the end of this month, or this Sunday if later
    // (so "This Week" on Home is complete at the end of a month).
    function horizon() {
        const t = parseLocalDate(today());
        const monthEnd = dateOf(new Date(t.getFullYear(), t.getMonth() + 1, 0));
        const sunday = addDays(today(), (7 - t.getDay()) % 7);
        return sunday > monthEnd ? sunday : monthEnd;
    }

    function clean(r) {
        const days = Array.isArray(r.days_of_week)
            ? [...new Set(r.days_of_week.map(Number).filter(n => ALL_DAYS.includes(n)))].sort()
            : [];
        return {
            id: r.id,
            label: String(r.label || '').trim() || 'Outside client',
            visits_per_day: int(r.visits_per_day, 1, 20, 1),
            price_per_visit: Math.max(0, Number(r.price_per_visit) || 0),
            minutes_per_visit: int(r.minutes_per_visit, 1, 1440, 60),
            days_of_week: days.length ? days : ALL_DAYS.slice(),
            start_date: String(r.start_date || '').slice(0, 10),
            end_date: isDate(String(r.end_date || '').slice(0, 10)) ? String(r.end_date).slice(0, 10) : null,
            skipped_dates: (Array.isArray(r.skipped_dates) ? r.skipped_dates : [])
                .map(d => String(d).slice(0, 10)).filter(isDate).sort()
        };
    }

    // Every date this arrangement covers between from and to (inclusive).
    function datesFor(r, from, to) {
        let start = r.start_date;
        if (!isDate(start)) return [];
        if (from && from > start) start = from;
        let end = to;
        if (r.end_date && r.end_date < end) end = r.end_date;
        if (!end || start > end) return [];
        const days = new Set(r.days_of_week);
        const skip = new Set(r.skipped_dates);
        const out = [];
        const d = parseLocalDate(start);
        for (let guard = 0; guard < 20000; guard++) {
            const date = dateOf(d);
            if (date > end) break;
            if (days.has(d.getDay()) && !skip.has(date)) out.push(date);
            d.setDate(d.getDate() + 1);
        }
        return out;
    }

    /* ---------- the entries the financial screens use ---------- */
    function allEntries() {
        const t = today();
        const key = `${version}:${t}`;
        if (memo.key === key) return memo.list;
        const last = horizon();
        const list = [];
        for (const r of rows) {
            for (const date of datesFor(r, null, last)) {
                for (let n = 1; n <= r.visits_per_day; n++) {
                    list.push({
                        id: `outside:${r.id}:${date}:${n}`,
                        visit_date: date,
                        price: r.price_per_visit,
                        status: date < t ? 'completed' : 'scheduled',
                        service_type: 'outside_income',
                        service_name: r.label,
                        is_outside_income: true,
                        outside_income_id: r.id,
                        outside_minutes: r.minutes_per_visit
                    });
                }
            }
        }
        memo = { key, list };
        return list;
    }

    function visitsBetween(start, end) {
        if (!me() || isEmployee()) return [];
        void load(false);
        const list = allEntries();
        if (!start && !end) return list.slice();
        return list.filter(v => (!start || v.visit_date >= start) && (!end || v.visit_date <= end));
    }

    /* ---------- loading + saving ---------- */
    const cacheKey = id => `pis-outside-income-v1:${id}`;
    function readCache(id) {
        try {
            const saved = JSON.parse(localStorage.getItem(cacheKey(id)) || 'null');
            return Array.isArray(saved) ? saved.map(clean) : [];
        } catch (e) { return []; }
    }
    function writeCache() {
        try { localStorage.setItem(cacheKey(loadedFor), JSON.stringify(rows)); } catch (e) { /* storage full or blocked */ }
    }
    function isMissingTable(error) {
        const code = String(error?.code || '');
        const text = String(error?.message || '');
        return code === 'PGRST205' || code === '42P01' ||
            (text.includes(TABLE) && /does not exist|could not find|schema cache/i.test(text));
    }
    function changed() {
        version++;
        try { if (typeof renderAdminFinancialSnapshot === 'function') renderAdminFinancialSnapshot(); }
        catch (e) { console.error('Outside income snapshot:', e); }
        document.dispatchEvent(new CustomEvent('pis:outside-income'));
    }

    function load(force) {
        const id = me();
        if (!id || isEmployee() || typeof supabaseClient === 'undefined') return Promise.resolve();
        if (loadedFor !== id) {
            loadedFor = id;
            rows = readCache(id);
            state = 'idle';
            version++;
        }
        if (request) return request;
        if (!force && state !== 'idle') return Promise.resolve();
        request = (async () => {
            try {
                const { data, error } = await supabaseClient
                    .from(TABLE)
                    .select(COLUMNS)
                    .eq('admin_id', id)
                    .order('start_date', { ascending: true });
                if (error) throw error;
                if (loadedFor !== id) return;
                rows = (data || []).map(clean);
                state = 'ready';
                writeCache();
            } catch (error) {
                if (loadedFor !== id) return;
                if (isMissingTable(error)) {
                    state = 'missing';
                    rows = [];
                } else {
                    state = 'error'; // keep the copy saved on this phone
                    console.error('Outside income:', error);
                }
            } finally {
                request = null;
            }
            changed();
        })();
        return request;
    }

    async function save(id, values) {
        const owner = me();
        if (!owner) throw new Error('Sign in again, then try saving.');
        const payload = {
            label: values.label,
            visits_per_day: values.visits_per_day,
            price_per_visit: values.price_per_visit,
            minutes_per_visit: values.minutes_per_visit,
            days_of_week: values.days_of_week,
            start_date: values.start_date,
            end_date: values.end_date,
            skipped_dates: values.skipped_dates,
            updated_at: new Date().toISOString()
        };
        const query = id
            ? supabaseClient.from(TABLE).update(payload).eq('id', id).eq('admin_id', owner)
            : supabaseClient.from(TABLE).insert({ ...payload, admin_id: owner });
        const { data, error } = await query.select(COLUMNS).single();
        if (error) throw error;
        const row = clean(data);
        const at = rows.findIndex(r => String(r.id) === String(row.id));
        if (at >= 0) rows[at] = row; else rows.push(row);
        rows.sort((a, b) => a.start_date.localeCompare(b.start_date));
        if (state !== 'error') state = 'ready';
        writeCache();
        changed();
    }

    async function remove(id) {
        const owner = me();
        if (!owner) throw new Error('Sign in again, then try deleting.');
        const { error } = await supabaseClient.from(TABLE).delete().eq('id', id).eq('admin_id', owner);
        if (error) throw error;
        rows = rows.filter(r => String(r.id) !== String(id));
        writeCache();
        changed();
    }

    function friendlyError(error) {
        if (isMissingTable(error)) return 'Outside income isn’t set up in the database yet. Run sql/admin_outside_income.sql in Supabase → SQL Editor, then try again.';
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'You’re offline. Connect and try again.';
        return `Couldn’t save: ${error?.message || 'please try again.'}`;
    }

    /* ---------- text ---------- */
    function daysText(days) {
        if (days.length === 7) return 'Every day';
        const key = days.join(',');
        if (key === '1,2,3,4,5') return 'Weekdays';
        if (key === '0,6') return 'Weekends';
        // Monday first reads more naturally for a work week.
        return [1, 2, 3, 4, 5, 6, 0].filter(d => days.includes(d)).map(d => DAY_NAMES[d]).join(', ');
    }
    function scheduleText(r) {
        const days = daysText(r.days_of_week);
        const t = today();
        if (r.end_date && r.end_date < t) return `${days} · ${niceDate(r.start_date)} – ${niceDate(r.end_date)}`;
        const from = r.start_date > t ? `starting ${niceDate(r.start_date)}` : `since ${niceDate(r.start_date)}`;
        return `${days} ${from}${r.end_date ? ` until ${niceDate(r.end_date)}` : ''}`;
    }
    function earnedSoFar(r) {
        return datesFor(r, null, addDays(today(), -1)).length * r.visits_per_day * r.price_per_visit;
    }

    /* ---------- card in Full Financials ---------- */
    function cardHtml() {
        if (!me() || isEmployee()) return '';
        void load(false);
        const t = parseLocalDate(today());
        const mStart = dateOf(new Date(t.getFullYear(), t.getMonth(), 1));
        const mEnd = dateOf(new Date(t.getFullYear(), t.getMonth() + 1, 0));
        const month = allEntries().filter(v => v.visit_date >= mStart && v.visit_date <= mEnd)
            .reduce((sum, v) => sum + v.price, 0);

        let note;
        if (state === 'missing') note = 'Needs a one-time setup: run sql/admin_outside_income.sql in Supabase → SQL Editor, then reopen Financials.';
        else if (!rows.length && state === 'idle') note = 'Loading…';
        else if (!rows.length && state === 'error') note = 'Couldn’t load outside income. Close and reopen Financials to try again.';
        else if (!rows.length) note = 'Paid for visits outside the app? Add them here so they count in your totals.';
        else note = `This month · each day counts as earned once it’s over${state === 'error' ? ' · showing the copy saved on this phone' : ''}`;

        const items = rows.map(r => {
            const perDay = r.visits_per_day * r.price_per_visit;
            const off = r.skipped_dates.length;
            return `<div class="poi-item">
                <div class="poi-item-copy">
                    <strong>${esc(r.label)}</strong>
                    <span>${r.visits_per_day} ${r.visits_per_day === 1 ? 'visit' : 'visits'} × ${money(r.price_per_visit, true)} · ${money(perDay, true)}/day</span>
                    <span>${esc(scheduleText(r))}${off ? ` · ${off} ${off === 1 ? 'day' : 'days'} off` : ''}</span>
                    <em>${money(earnedSoFar(r))} earned so far</em>
                </div>
                <button type="button" class="poi-edit" data-poi-edit="${esc(r.id)}" aria-label="Edit ${esc(r.label)}">Edit</button>
            </div>`;
        }).join('');

        return `<section class="pfin-card poi-card">
            <div class="pfin-row-head">
                <span class="pfin-label">Outside Income</span>
                ${rows.length ? `<strong class="pfin-value">${money(month)}</strong>` : ''}
            </div>
            <span class="pfin-note">${esc(note)}</span>
            ${items ? `<div class="poi-list">${items}</div>` : ''}
            ${state === 'missing' ? '' : '<button type="button" class="poi-add" data-poi-add>+ Add outside income</button>'}
        </section>`;
    }

    /* ---------- editor ---------- */
    let editor = null; // { id, skipped: [], deleteArmed, busy }
    let editorHistory = false;
    let swallowPop = false;

    function openEditor(id) {
        if (document.getElementById('poi-editor')) return;
        const existing = id ? rows.find(r => String(r.id) === String(id)) : null;
        const r = existing || {
            label: '', visits_per_day: 1, price_per_visit: '', minutes_per_visit: 60,
            days_of_week: ALL_DAYS.slice(), start_date: today(), end_date: null, skipped_dates: []
        };
        editor = { id: existing ? existing.id : null, skipped: r.skipped_dates.slice(), deleteArmed: false, busy: false };

        const wrap = document.createElement('div');
        wrap.id = 'poi-editor';
        wrap.className = 'poi';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.setAttribute('aria-labelledby', 'poi-title');
        wrap.innerHTML = `
            <form class="poi-sheet" novalidate>
                <header class="poi-head">
                    <div><span class="poi-eyebrow">FINANCIALS</span><h2 id="poi-title">${existing ? 'Edit Outside Income' : 'Add Outside Income'}</h2></div>
                    <button type="button" class="poi-close" data-poi-cancel aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </header>
                <div class="poi-body">
                    <p class="poi-intro">For a client you’re paid outside the app. It’s added to your totals but never shows on your schedule.</p>
                    <label class="poi-field"><span>Client</span>
                        <input type="text" name="label" maxlength="80" autocomplete="off" placeholder="Client name" value="${esc(existing ? r.label : '')}"></label>
                    <div class="poi-row3">
                        <label class="poi-field"><span>Visits a day</span>
                            <input type="number" name="visits" inputmode="numeric" min="1" max="20" step="1" value="${esc(r.visits_per_day)}"></label>
                        <label class="poi-field"><span>Pay per visit</span>
                            <span class="poi-money"><i>$</i><input type="number" name="price" inputmode="decimal" min="0" step="0.01" placeholder="85" value="${esc(r.price_per_visit)}"></span></label>
                        <label class="poi-field"><span>Minutes each</span>
                            <input type="number" name="minutes" inputmode="numeric" min="1" max="1440" step="1" value="${esc(r.minutes_per_visit)}"></label>
                    </div>
                    <div class="poi-field"><span id="poi-days-label">Days you go</span>
                        <div class="poi-days" role="group" aria-labelledby="poi-days-label">
                            ${ALL_DAYS.map(d => `<button type="button" class="poi-day" data-poi-day="${d}" aria-pressed="${r.days_of_week.includes(d)}" aria-label="${DAY_NAMES[d]}">${DAY_LETTERS[d]}</button>`).join('')}
                        </div></div>
                    <div class="poi-row2">
                        <label class="poi-field"><span>Started</span>
                            <input type="date" name="start" value="${esc(r.start_date)}"></label>
                        <label class="poi-field"><span>Ended <small>(blank if still going)</small></span>
                            <input type="date" name="end" value="${esc(r.end_date || '')}"></label>
                    </div>
                    <div class="poi-field"><span>Days off <small>(days you didn’t go)</small></span>
                        <div class="poi-off-add">
                            <input type="date" name="off" aria-label="Day off">
                            <button type="button" class="poi-off-btn" data-poi-off-add>Add</button>
                        </div>
                        <div class="poi-off-list"></div></div>
                    <div class="poi-preview" aria-live="polite"></div>
                    <div class="poi-error" role="alert" hidden></div>
                </div>
                <footer class="poi-foot">
                    ${existing ? '<button type="button" class="poi-delete" data-poi-delete>Delete</button>' : ''}
                    <button type="button" class="poi-cancel" data-poi-cancel>Cancel</button>
                    <button type="submit" class="poi-save">Save</button>
                </footer>
            </form>`;
        document.body.appendChild(wrap);
        document.body.classList.add('poi-open');

        const formEl = wrap.querySelector('form');
        wrap.addEventListener('click', onEditorClick);
        formEl.addEventListener('input', () => { hideError(); preview(); });
        formEl.addEventListener('submit', e => { e.preventDefault(); void submit(); });
        renderOff();
        preview();
        try { history.pushState({ poi: true }, ''); editorHistory = true; } catch (e) { editorHistory = false; }
    }

    function closeEditor(fromPop) {
        const el = document.getElementById('poi-editor');
        if (!el) return;
        el.remove();
        editor = null;
        document.body.classList.remove('poi-open');
        if (editorHistory && !fromPop) {
            swallowPop = true;
            try { history.back(); } catch (e) { swallowPop = false; }
        }
        editorHistory = false;
    }

    function form() { return document.querySelector('#poi-editor form'); }
    function field(name) { return form().elements.namedItem(name); }

    function read() {
        const f = form();
        const days = [...f.querySelectorAll('[data-poi-day]')]
            .filter(b => b.getAttribute('aria-pressed') === 'true').map(b => Number(b.dataset.poiDay));
        const priceText = String(field('price').value).trim();
        return {
            label: String(field('label').value).trim(),
            visits_per_day: Number(field('visits').value),
            price_per_visit: priceText === '' ? NaN : Math.round(Number(priceText) * 100) / 100,
            minutes_per_visit: Number(field('minutes').value),
            days_of_week: days,
            start_date: String(field('start').value),
            end_date: String(field('end').value) || null,
            skipped_dates: editor.skipped.slice().sort()
        };
    }

    function problem(v) {
        if (!v.label) return 'Add the client’s name.';
        if (v.label.length > 80) return 'Keep the name under 80 characters.';
        if (!Number.isInteger(v.visits_per_day) || v.visits_per_day < 1 || v.visits_per_day > 20) return 'Visits a day should be a whole number from 1 to 20.';
        if (!Number.isFinite(v.price_per_visit) || v.price_per_visit < 0 || v.price_per_visit > 100000) return 'Add how much you’re paid per visit.';
        if (!Number.isInteger(v.minutes_per_visit) || v.minutes_per_visit < 1 || v.minutes_per_visit > 1440) return 'Minutes each should be a whole number from 1 to 1440.';
        if (!v.days_of_week.length) return 'Pick at least one day you go.';
        if (!isDate(v.start_date)) return 'Add the date you started.';
        if (v.end_date && !isDate(v.end_date)) return 'That end date doesn’t look right.';
        if (v.end_date && v.end_date < v.start_date) return 'The end date is before the start date.';
        return '';
    }

    function preview() {
        const box = document.querySelector('#poi-editor .poi-preview');
        if (!box || !editor) return;
        const v = read();
        if (!Number.isFinite(v.price_per_visit) || !Number.isInteger(v.visits_per_day) || v.visits_per_day < 1 || v.visits_per_day > 20 ||
            !isDate(v.start_date) || !v.days_of_week.length) {
            box.textContent = '';
            return;
        }
        const r = clean({ ...v, id: 'preview' });
        const perDay = r.visits_per_day * r.price_per_visit;
        const so = earnedSoFar(r);
        box.innerHTML = `<strong>${money(perDay, true)} a day</strong><span>${so > 0 ? `${money(so)} earned so far` : 'Starts counting after the first day'}</span>`;
    }

    function renderOff() {
        const list = document.querySelector('#poi-editor .poi-off-list');
        if (!list || !editor) return;
        const dates = editor.skipped.slice().sort().reverse();
        list.innerHTML = dates.length
            ? dates.map(d => `<span class="poi-chip">${esc(niceDate(d, true))}<button type="button" data-poi-off-remove="${esc(d)}" aria-label="Remove ${esc(niceDate(d, true))}">×</button></span>`).join('')
            : '<span class="poi-none">None</span>';
    }

    function showError(text) {
        const el = document.querySelector('#poi-editor .poi-error');
        if (!el) return;
        el.textContent = text;
        el.hidden = false;
        el.scrollIntoView?.({ block: 'nearest' });
    }
    function hideError() {
        const el = document.querySelector('#poi-editor .poi-error');
        if (el) el.hidden = true;
    }

    function setBusy(on, label) {
        if (!editor) return;
        editor.busy = on;
        const f = form();
        f.querySelectorAll('button, input').forEach(el => { el.disabled = on; });
        const saveBtn = f.querySelector('.poi-save');
        if (label && saveBtn) saveBtn.textContent = label;
        if (!on && saveBtn) saveBtn.textContent = 'Save';
    }

    async function submit() {
        if (!editor || editor.busy) return;
        const v = read();
        const issue = problem(v);
        if (issue) return showError(issue);
        setBusy(true, 'Saving…');
        try {
            await save(editor.id, v);
            closeEditor();
        } catch (error) {
            console.error('Outside income save:', error);
            setBusy(false);
            showError(friendlyError(error));
        }
    }

    async function onEditorClick(e) {
        if (!editor) return;
        const el = e.target;
        if (el === e.currentTarget || el.closest('[data-poi-cancel]')) {
            if (!editor.busy) closeEditor();
            return;
        }
        if (editor.busy) return;
        const day = el.closest('[data-poi-day]');
        if (day) {
            day.setAttribute('aria-pressed', day.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
            hideError();
            preview();
            return;
        }
        if (el.closest('[data-poi-off-add]')) {
            const input = field('off');
            const d = String(input.value);
            if (!isDate(d)) return showError('Pick the date you didn’t go, then tap Add.');
            if (!editor.skipped.includes(d)) editor.skipped.push(d);
            input.value = '';
            hideError();
            renderOff();
            preview();
            return;
        }
        const off = el.closest('[data-poi-off-remove]');
        if (off) {
            editor.skipped = editor.skipped.filter(d => d !== off.dataset.poiOffRemove);
            renderOff();
            preview();
            return;
        }
        const del = el.closest('[data-poi-delete]');
        if (del) {
            if (!editor.deleteArmed) {
                editor.deleteArmed = true;
                del.textContent = 'Tap again to delete';
                del.classList.add('is-armed');
                setTimeout(() => {
                    if (editor && editor.deleteArmed && del.isConnected && !editor.busy) {
                        editor.deleteArmed = false;
                        del.textContent = 'Delete';
                        del.classList.remove('is-armed');
                    }
                }, 4000);
                return;
            }
            setBusy(true, 'Deleting…');
            try {
                await remove(editor.id);
                closeEditor();
            } catch (error) {
                console.error('Outside income delete:', error);
                setBusy(false);
                showError(friendlyError(error).replace('Couldn’t save', 'Couldn’t delete'));
            }
        }
    }

    // Opened from the card in Full Financials.
    document.addEventListener('click', e => {
        const add = e.target.closest?.('[data-poi-add]');
        const edit = e.target.closest?.('[data-poi-edit]');
        if (!add && !edit) return;
        e.preventDefault();
        openEditor(edit ? edit.dataset.poiEdit : null);
    });

    // Back button closes just the editor (this runs before Full Financials' own
    // handler because this file loads first).
    window.addEventListener('popstate', e => {
        if (swallowPop) { swallowPop = false; e.stopImmediatePropagation(); return; }
        if (document.getElementById('poi-editor')) {
            e.stopImmediatePropagation();
            editorHistory = false;
            closeEditor(true);
        }
    });
    window.addEventListener('keydown', e => {
        if (e.key !== 'Escape' || !document.getElementById('poi-editor')) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!editor?.busy) closeEditor();
    }, true);

    /* ---------- styles ---------- */
    const css = `
    .poi-card .pfin-row-head{align-items:center}
    .poi-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
    .poi-item{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #dbe7f3;border-radius:14px;background:#f7fbfe}
    .poi-item-copy{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}
    .poi-item-copy strong{font-size:16px;font-weight:800;color:#183447;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .poi-item-copy span{font-size:13px;font-weight:600;color:#46617d}
    .poi-item-copy em{font-style:normal;font-size:12px;font-weight:700;color:#1f7bc2;margin-top:2px}
    .poi-edit{all:unset;flex:none;display:flex !important;align-items:center !important;justify-content:center !important;min-width:64px !important;height:40px !important;padding:0 12px !important;margin:0 !important;border-radius:12px !important;border:1px solid #c8dce8 !important;background:#fff !important;color:#1f63b8 !important;font-family:inherit !important;font-size:14px !important;font-weight:800 !important;box-sizing:border-box !important;cursor:pointer}
    .poi-add{all:unset;display:flex !important;align-items:center !important;justify-content:center !important;width:100% !important;height:46px !important;margin:12px 0 0 !important;padding:0 !important;border-radius:14px !important;border:1.5px dashed #9cc3e4 !important;background:#f4f9fd !important;color:#1f63b8 !important;font-family:inherit !important;font-size:15px !important;font-weight:800 !important;box-sizing:border-box !important;cursor:pointer}
    .poi-edit:active,.poi-add:active{background:#e6f1fb !important}
    .pfin-hero .pfin-outside{display:block;margin-top:8px;font-size:12px;font-weight:600;color:rgba(255,255,255,.85)}
    body.poi-open{overflow:hidden}
    .poi{position:fixed;inset:0;z-index:10060;background:rgba(15,35,55,.45);display:flex;align-items:flex-end;justify-content:center}
    .poi-sheet{width:100%;max-width:560px;height:100%;max-height:100%;margin:0;display:flex;flex-direction:column;background:#f4f8fc;color:#183447;font-family:inherit}
    @media (min-width:701px){.poi{align-items:center;padding:24px}.poi-sheet{height:auto;max-height:92vh;border-radius:22px;overflow:hidden}}
    .poi-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:calc(16px + env(safe-area-inset-top,0px)) 18px 14px;background:#fff;border-bottom:1px solid #dbe7f3}
    .poi-eyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:.12em;color:#1f63b8}
    .poi-head h2{margin:2px 0 0;font-size:22px;font-weight:800;color:#183447}
    .poi-close{flex:none !important;width:44px !important;height:44px !important;padding:0 !important;margin:0 !important;border-radius:14px !important;border:1px solid #c9d9ea !important;background:#fff !important;color:#2a5d8f !important;display:flex !important;align-items:center !important;justify-content:center !important;box-shadow:none !important}
    .poi-body{flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;display:flex;flex-direction:column;gap:14px}
    .poi-intro{margin:0;font-size:13px;font-weight:600;line-height:1.45;color:#5b6f82}
    .poi-field{display:flex;flex-direction:column;gap:6px;min-width:0;margin:0}
    .poi-field > span{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#46617d}
    .poi-field small{font-size:11px;font-weight:600;letter-spacing:0;text-transform:none;color:#8293a2}
    .poi input[type=text],.poi input[type=number],.poi input[type=date]{display:block !important;width:100% !important;min-width:0 !important;height:48px !important;margin:0 !important;padding:0 12px !important;box-sizing:border-box !important;border:1px solid #c9d9ea !important;border-radius:12px !important;background:#fff !important;color:#183447 !important;font-family:inherit !important;font-size:16px !important;font-weight:700 !important;box-shadow:none !important;-webkit-appearance:none;appearance:none}
    .poi input:focus{outline:none !important;border-color:#1f7bc2 !important;box-shadow:0 0 0 3px rgba(31,123,194,.15) !important}
    .poi input:disabled{opacity:.6}
    .poi-row3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .poi-row2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .poi-row3 .poi-field > span,.poi-row2 .poi-field > span{min-height:30px;display:flex;align-items:flex-end;line-height:1.2}
    .poi-row2 .poi-field > span{flex-wrap:wrap;gap:0 4px}
    .poi-money{position:relative;display:block}
    .poi-money i{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-style:normal;font-size:16px;font-weight:700;color:#6b7785;pointer-events:none}
    .poi .poi-money input{padding-left:24px !important}
    .poi-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
    .poi-day{all:unset;display:flex !important;align-items:center !important;justify-content:center !important;height:44px !important;margin:0 !important;padding:0 !important;border-radius:12px !important;border:1px solid #c9d9ea !important;background:#fff !important;color:#6b7785 !important;font-family:inherit !important;font-size:15px !important;font-weight:800 !important;box-sizing:border-box !important;cursor:pointer}
    .poi-day[aria-pressed=true]{background:#1f7bc2 !important;border-color:#1f7bc2 !important;color:#fff !important}
    .poi-off-add{display:flex;gap:8px}
    .poi-off-add input{flex:1 1 auto}
    .poi-off-btn{all:unset;flex:none;display:flex !important;align-items:center !important;justify-content:center !important;width:72px !important;height:48px !important;margin:0 !important;padding:0 !important;border-radius:12px !important;border:1px solid #c8dce8 !important;background:#f4f9fd !important;color:#1f63b8 !important;font-family:inherit !important;font-size:15px !important;font-weight:800 !important;box-sizing:border-box !important;cursor:pointer}
    .poi-off-list{display:flex;flex-wrap:wrap;gap:6px}
    .poi-chip{display:inline-flex;align-items:center;gap:2px;padding:0 0 0 12px;height:34px;border-radius:999px;background:#e3edf6;color:#183447;font-size:13px;font-weight:700}
    .poi-chip button{all:unset;display:flex !important;align-items:center !important;justify-content:center !important;width:34px !important;height:34px !important;margin:0 !important;padding:0 !important;font-size:18px !important;font-weight:700 !important;color:#46617d !important;cursor:pointer}
    .poi-none{font-size:13px;font-weight:600;color:#8293a2}
    .poi-preview{display:flex;flex-direction:column;gap:2px;padding:14px;border-radius:14px;background:linear-gradient(135deg,#2890df 0%,#1768aa 100%);color:#fff}
    .poi-preview:empty{display:none}
    .poi-preview strong{font-size:20px;font-weight:800}
    .poi-preview span{font-size:13px;font-weight:600;color:rgba(255,255,255,.85)}
    .poi-error{padding:12px 14px;border-radius:12px;background:#fdecea;border:1px solid #f3c2bc;color:#8b2518;font-size:14px;font-weight:700;line-height:1.4}
    .poi-error[hidden]{display:none}
    .poi-foot{display:flex;gap:8px;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #dbe7f3}
    .poi-foot button{all:unset;display:flex !important;align-items:center !important;justify-content:center !important;height:50px !important;margin:0 !important;padding:0 16px !important;border-radius:14px !important;font-family:inherit !important;font-size:16px !important;font-weight:800 !important;box-sizing:border-box !important;cursor:pointer;text-align:center}
    .poi-foot button:disabled{opacity:.6;cursor:default}
    .poi-foot .poi-save{flex:1 1 auto !important;background:#1f7bc2 !important;color:#fff !important}
    .poi-cancel{flex:none;background:#fff !important;border:1px solid #c9d9ea !important;color:#2a5d8f !important}
    .poi-delete{flex:none;background:#fff !important;border:1px solid #f3c2bc !important;color:#b3261e !important}
    .poi-delete.is-armed{background:#b3261e !important;border-color:#b3261e !important;color:#fff !important;font-size:14px !important}
    @media (max-width:370px){.poi-row3{grid-template-columns:1fr 1fr}.poi-row3 .poi-field:first-child{grid-column:1 / -1}}`;

    function init() {
        if (!document.getElementById('poi-style')) {
            const st = document.createElement('style');
            st.id = 'poi-style';
            st.textContent = css;
            document.head.appendChild(st);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    window.addEventListener('online', () => { if (state === 'error') void load(true); });

    window.PisOutsideIncome = {
        visitsBetween,
        cardHtml,
        load,
        open: openEditor,
        get rows() { return rows.map(r => ({ ...r })); },
        get state() { return state; }
    };
})();
