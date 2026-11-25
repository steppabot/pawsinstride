/* Paws in Stride — Outside Income.
   Load AFTER admin.js and BEFORE admin-financial-more.js / admin-lifetime-stats.js.

   Clients you're paid for outside the app (for example 3 one-hour visits a day
   at $85 each). They're saved in the admin_outside_income table
   (sql/admin_outside_income.sql) and each one becomes an entry per visit per day,
   with its own number of visits on each weekday if you like (visits_by_day),
   so they count in the Financial Snapshot, Full Financials and Lifetime Stats:
     - days before today count as earned
     - today through the end of this month (or the end of this week, if the week
       runs into next month) count as scheduled
   The entries only feed the money and time numbers. They never show up on the
   schedule, routes, client lists or anywhere else.

   Each arrangement has a type (service_kind): walk, dropin, sitting, boarding or other.
   Boarding is all day, so it has no length; its entries go out as boarding
   (service_type 'dog_boarding') and every screen leaves them out of hours and hourly
   rates exactly as it does for boarding booked in the app. The rest count their
   money and their time, including in today's hourly rate on Home.

   window.PisOutsideIncome.visitsBetween(start, end) -> entries ('YYYY-MM-DD', null = open)
   window.PisOutsideIncome.cardHtml()                 -> the card for Full Financials
   window.PisOutsideIncome.load(force)                -> (re)load from Supabase
   Fires 'pis:outside-income' on document whenever the numbers change. */
(function () {
    'use strict';

    const TABLE = 'admin_outside_income';
    const BASE_COLUMNS = 'id, label, visits_per_day, price_per_visit, minutes_per_visit, days_of_week, start_date, end_date, skipped_dates';
    // visits_by_day (visits on each weekday, Sun..Sat) needs a one-time
    // database update. Until it's run, everything else keeps working.
    let hasByDay = true;
    // service_kind (the type) is the same: optional until 7-paws-outside-income-type.sql is run.
    let hasKind = true;
    const columns = () => BASE_COLUMNS + (hasByDay ? ', visits_by_day' : '') + (hasKind ? ', service_kind' : '');
    const KINDS = ['walk', 'dropin', 'sitting', 'boarding', 'other'];
    const KIND_NAMES = { walk: 'Dog Walking', dropin: 'Drop-In Visits', sitting: 'Pet Sitting', boarding: 'Boarding', other: 'Other' };
    const isBoardingKind = r => r?.kind === 'boarding';
    // the words that change with the type: "3 visits × $85 · $255/day" or "2 pets × $60 · $120/night"
    const words = r => isBoardingKind(r)
        ? { one: 'pet', many: 'pets', per: 'night', pay: 'Pay per pet, per night', count: 'Pets boarding', days: 'Days they stay', off: '(days they weren’t here)' }
        : { one: 'visit', many: 'visits', per: 'day', pay: 'Pay per visit', count: 'Visits a day', days: 'Days you go', off: '(days you didn’t go)' };
    // 90 -> "1h 30m", 240 -> "4h", 45 -> "45m"
    const lengthText = minutes => {
        const m = Math.max(0, Math.round(Number(minutes) || 0)), h = Math.floor(m / 60);
        return h ? (m % 60 ? `${h}h ${m % 60}m` : `${h}h`) : `${m}m`;
    };
    const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
        const listed = Array.isArray(r.days_of_week)
            ? [...new Set(r.days_of_week.map(Number).filter(n => ALL_DAYS.includes(n)))]
            : [];
        const days = listed.length ? listed : ALL_DAYS.slice();
        const perDay = int(r.visits_per_day, 1, 20, 1);
        // Visits on each weekday (Sun..Sat), 0 on days you don't go.
        const saved = Array.isArray(r.visits_by_day) && r.visits_by_day.length === 7
            ? r.visits_by_day.map(n => int(n, 0, 20, 0))
            : null;
        const byDay = ALL_DAYS.map(d => days.includes(d) ? ((saved && saved[d]) || perDay) : 0);
        return {
            id: r.id,
            kind: KINDS.includes(r.service_kind ?? r.kind) ? (r.service_kind ?? r.kind) : 'other',
            label: String(r.label || '').trim() || 'Outside client',
            visits_by_day: byDay,
            visits_per_day: Math.max(...byDay),
            price_per_visit: Math.max(0, Number(r.price_per_visit) || 0),
            minutes_per_visit: int(r.minutes_per_visit, 1, 1440, 60),
            days_of_week: ALL_DAYS.filter(d => byDay[d] > 0),
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

    const weekday = date => parseLocalDate(date).getDay();
    const varies = r => new Set(r.days_of_week.map(d => r.visits_by_day[d])).size > 1;
    const visitsOn = (r, dates) => dates.reduce((sum, date) => sum + r.visits_by_day[weekday(date)], 0);
    // A short stretch (a week or less with an end date) is listed by date.
    function isShort(r) {
        return isDate(r.start_date) && isDate(r.end_date) && r.end_date >= r.start_date &&
            r.end_date <= addDays(r.start_date, 6);
    }
    // The order days are listed in: by date for a short stretch, otherwise Monday first.
    function dayOrder(r, days) {
        if (isShort(r)) {
            const inRange = datesFor({ ...r, skipped_dates: [] }, null, r.end_date).map(weekday);
            return inRange.filter(d => days.includes(d));
        }
        return [1, 2, 3, 4, 5, 6, 0].filter(d => days.includes(d));
    }
    function dayLabel(r, d, full) {
        if (isShort(r)) {
            const date = datesFor({ ...r, days_of_week: [d], skipped_dates: [] }, null, r.end_date)[0];
            if (date) return `${DAY_NAMES[d]}, ${niceDate(date)}`;
        }
        return full ? DAY_FULL[d] : DAY_NAMES[d];
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
                const count = r.visits_by_day[weekday(date)];
                for (let n = 1; n <= count; n++) {
                    list.push({
                        id: `outside:${r.id}:${date}:${n}`,
                        visit_date: date,
                        price: r.price_per_visit,
                        status: date < t ? 'completed' : 'scheduled',
                        // boarding is boarding wherever it was booked: no hours, no hourly rate
                        service_type: isBoardingKind(r) ? 'dog_boarding' : 'outside_income',
                        service_name: r.label,
                        is_outside_income: true,
                        outside_income_id: r.id,
                        outside_kind: r.kind,
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
    function isMissingByDay(error) {
        return /visits_by_day/i.test(`${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`);
    }
    function isMissingKind(error) {
        return /service_kind/i.test(`${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`);
    }
    // An optional column the database doesn't have yet: stop asking for it. True if the request is worth sending again.
    function dropMissingColumn(error) {
        if (hasKind && isMissingKind(error)) { hasKind = false; return true; }
        if (hasByDay && isMissingByDay(error)) { hasByDay = false; return true; }
        return false;
    }
    function isMissingTable(error) {
        if (isMissingByDay(error) || isMissingKind(error)) return false;
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
                const fetchRows = () => supabaseClient
                    .from(TABLE)
                    .select(columns())
                    .eq('admin_id', id)
                    .order('start_date', { ascending: true });
                let { data, error } = await fetchRows();
                for (let attempt = 0; attempt < 2 && error && dropMissingColumn(error); attempt++) {
                    ({ data, error } = await fetchRows());
                }
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
        const differs = varies(clean(values));
        const typed = values.kind && values.kind !== 'other';
        if (!hasByDay && differs) throw new Error('needs-update');
        if (!hasKind && typed) throw new Error('needs-type-update');
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
        const send = () => {
            const body = { ...payload, ...(hasByDay ? { visits_by_day: values.visits_by_day } : {}), ...(hasKind ? { service_kind: values.kind || 'other' } : {}) };
            const query = id
                ? supabaseClient.from(TABLE).update(body).eq('id', id).eq('admin_id', owner)
                : supabaseClient.from(TABLE).insert({ ...body, admin_id: owner });
            return query.select(columns()).single();
        };
        let { data, error } = await send();
        for (let attempt = 0; attempt < 2 && error && dropMissingColumn(error); attempt++) {
            if (!hasByDay && differs) throw new Error('needs-update');
            if (!hasKind && typed) throw new Error('needs-type-update');
            ({ data, error } = await send());
        }
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
        if (error?.message === 'needs-update') return 'A different number of visits on different days needs a quick database update. Run the outside income part of the setup SQL in Supabase → SQL Editor, then try again.';
        if (error?.message === 'needs-type-update') return 'Choosing a type needs a quick database update. Run 7-paws-outside-income-type.sql in Supabase → SQL Editor, then try again.';
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
    // Which days, then when. Short ones stay on one line ("Every day since
    // Oct 18"); longer ones put the dates on their own line, starting with
    // a capital ("Sat 3 · Sun 2 · Mon 1" / "Starting Nov 21 until Nov 23").
    function scheduleLines(r) {
        const days = varies(r)
            ? dayOrder(r, r.days_of_week).map(d => `${DAY_NAMES[d]} ${r.visits_by_day[d]}`).join(' · ')
            : daysText(r.days_of_week);
        const t = today();
        let when, joiner = ' ';
        if (r.end_date && r.end_date < t) {
            when = `${niceDate(r.start_date)} – ${niceDate(r.end_date)}`;
            joiner = ' · ';
        } else {
            when = `${r.start_date > t ? 'starting' : 'since'} ${niceDate(r.start_date)}${r.end_date ? ` until ${niceDate(r.end_date)}` : ''}`;
        }
        const oneLine = `${days}${joiner}${when}`;
        return oneLine.length <= 26 ? [oneLine] : [days, when.charAt(0).toUpperCase() + when.slice(1)];
    }
    function scheduleText(r) {
        return scheduleLines(r).join(' · ');
    }
    function earnedSoFar(r) {
        return visitsOn(r, datesFor(r, null, addDays(today(), -1))) * r.price_per_visit;
    }
    // "$255/day", "$175/week", or the whole total when it has an end date.
    function rate(r) {
        const each = money(r.price_per_visit, true);
        const w = words(r);
        // boarding with an end date: pets × nights, said as nights ("6 nights × $65")
        const total = isBoardingKind(r) ? { one: 'night', many: 'nights' } : w;
        if (r.end_date) {
            const visits = visitsOn(r, datesFor(r, null, r.end_date));
            return { line: `${visits} ${visits === 1 ? total.one : total.many} × ${each} · ${money(visits * r.price_per_visit, true)} total`,
                big: `${money(visits * r.price_per_visit, true)} total`, sub: `${visits} ${visits === 1 ? total.one : total.many}` };
        }
        if (varies(r)) {
            const counts = r.days_of_week.map(d => r.visits_by_day[d]);
            const week = counts.reduce((a, b) => a + b, 0) * r.price_per_visit;
            return { line: `${Math.min(...counts)}–${Math.max(...counts)} ${w.many} a ${w.per} × ${each} · ${money(week, true)}/week`,
                big: `${money(week, true)} a week` };
        }
        const n = r.visits_per_day;
        return { line: `${n} ${n === 1 ? w.one : w.many} × ${each} · ${money(n * r.price_per_visit, true)}/${w.per}`,
            big: `${money(n * r.price_per_visit, true)} a ${w.per}` };
    }
    // "Pet Sitting · 4h each", "Boarding · all day", or just "1h each" when no type was picked
    function kindLine(r) {
        if (isBoardingKind(r)) return 'Boarding · all day';
        const length = `${lengthText(r.minutes_per_visit)} each`;
        return r.kind && r.kind !== 'other' ? `${KIND_NAMES[r.kind]} · ${length}` : length;
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
            const off = r.skipped_dates.length;
            return `<div class="poi-item">
                <div class="poi-item-copy">
                    <strong>${esc(r.label)}</strong>
                    <span data-poi-kind="${esc(r.kind)}">${esc(kindLine(r))}</span>
                    <span>${esc(rate(r).line)}</span>
                    ${scheduleLines(r).map((line, i, all) => `<span>${esc(line)}${i === all.length - 1 && off ? ` · ${off} ${off === 1 ? 'day' : 'days'} off` : ''}</span>`).join('')}
                    <em>${r.start_date > today() ? 'Not started yet' : `${money(earnedSoFar(r))} earned so far`}</em>
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
            ${state === 'missing' ? '' : '<button type="button" class="poi-add" data-poi-add>+ Add Outside Income</button>'}
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
            kind: 'other',
            label: '', visits_per_day: 1, visits_by_day: ALL_DAYS.map(() => 1), price_per_visit: '', minutes_per_visit: 60,
            days_of_week: ALL_DAYS.slice(), start_date: today(), end_date: null, skipped_dates: []
        };
        editor = {
            id: existing ? existing.id : null, skipped: r.skipped_dates.slice(), deleteArmed: false, busy: false,
            perDay: existing ? varies(r) : false,
            minutes: r.minutes_per_visit,          // kept while Boarding hides the time boxes
            uniform: r.visits_per_day,
            counts: r.visits_by_day.map(n => n || r.visits_per_day)
        };

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
                    <label class="poi-field"><span>Type</span>
                        <select name="kind">${KINDS.map(k => `<option value="${k}"${k === r.kind ? ' selected' : ''}>${esc(KIND_NAMES[k])}</option>`).join('')}</select></label>
                    <div class="poi-row2 poi-row-tight">
                        <label class="poi-field"><span data-poi-pay-label>${esc(words(r).pay)}</span>
                            <span class="poi-money"><i>$</i><input type="number" name="price" inputmode="decimal" min="0" step="0.01" placeholder="85" value="${esc(r.price_per_visit)}"></span></label>
                        <div class="poi-field" data-poi-time${isBoardingKind(r) ? ' hidden' : ''}><span id="poi-time-label">Time each visit</span>
                            <div class="poi-time" role="group" aria-labelledby="poi-time-label">
                                <label><input type="number" name="hours" inputmode="numeric" min="0" max="24" step="1" aria-label="Hours" value="${Math.floor(r.minutes_per_visit / 60)}"><i>hr</i></label>
                                <label><input type="number" name="mins" inputmode="numeric" min="0" max="59" step="1" aria-label="Minutes" value="${r.minutes_per_visit % 60}"><i>min</i></label>
                            </div></div>
                        <div class="poi-field poi-allday" data-poi-allday${isBoardingKind(r) ? '' : ' hidden'}><span>Time</span><p>All day. Boarding stays out of your hourly rate.</p></div>
                    </div>
                    <div class="poi-row2">
                        <label class="poi-field"><span>Started</span>
                            <input type="date" name="start" value="${esc(r.start_date)}"></label>
                        <label class="poi-field"><span>Ended <small>(blank if still going)</small></span>
                            <input type="date" name="end" value="${esc(r.end_date || '')}"></label>
                    </div>
                    <div class="poi-field"><span id="poi-days-label">${esc(words(r).days)}</span>
                        <div class="poi-days" role="group" aria-labelledby="poi-days-label">
                            ${ALL_DAYS.map(d => `<button type="button" class="poi-day" data-poi-day="${d}" aria-pressed="${r.days_of_week.includes(d)}" aria-label="${DAY_NAMES[d]}">${DAY_LETTERS[d]}</button>`).join('')}
                        </div></div>
                    <div class="poi-field"><span data-poi-count-label>${esc(words(r).count)}</span>
                        <div class="poi-visits"></div></div>
                    <div class="poi-field"><span>Days off <small data-poi-off-label>${esc(words(r).off)}</small></span>
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
        formEl.addEventListener('input', e => {
            hideError();
            if (e.target.name === 'start' || e.target.name === 'end') renderVisits();
            preview();
        });
        formEl.addEventListener('change', e => {
            if (e.target.name === 'start' || e.target.name === 'end') { renderVisits(); preview(); }
            if (e.target.name === 'kind') { hideError(); applyKind(); renderVisits(); preview(); }
        });
        formEl.addEventListener('submit', e => { e.preventDefault(); void submit(); });
        renderOff();
        renderVisits();
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
    // The type decides the wording, and whether a length is asked for at all (boarding is all day).
    function applyKind() {
        const f = form();
        if (!f) return;
        const r = { kind: String(field('kind').value) };
        const boarding = isBoardingKind(r);
        f.querySelector('[data-poi-time]').hidden = boarding;
        f.querySelector('[data-poi-allday]').hidden = !boarding;
        f.querySelector('[data-poi-pay-label]').textContent = words(r).pay;
        f.querySelector('[data-poi-count-label]').textContent = words(r).count;
        f.querySelector('#poi-days-label').textContent = words(r).days;
        f.querySelector('[data-poi-off-label]').textContent = words(r).off;
    }
    // Hours and minutes as one number of minutes (blank boxes count as 0).
    function typedMinutes() {
        const part = name => { const text = String(field(name).value).trim(); return text === '' ? 0 : Number(text); };
        const hours = part('hours'), mins = part('mins');
        return Number.isInteger(hours) && Number.isInteger(mins) && hours >= 0 && mins >= 0 && mins <= 59 ? hours * 60 + mins : NaN;
    }
    function field(name) { return form().elements.namedItem(name); }

    function selectedDays() {
        return [...form().querySelectorAll('[data-poi-day]')]
            .filter(b => b.getAttribute('aria-pressed') === 'true').map(b => Number(b.dataset.poiDay));
    }

    function read() {
        const days = selectedDays();
        const priceText = String(field('price').value).trim();
        const byDay = ALL_DAYS.map(d => days.includes(d) ? (editor.perDay ? editor.counts[d] : editor.uniform) : 0);
        const kind = KINDS.includes(String(field('kind').value)) ? String(field('kind').value) : 'other';
        return {
            kind,
            label: String(field('label').value).trim(),
            visits_by_day: byDay,
            visits_per_day: days.length ? Math.max(...days.map(d => byDay[d])) : editor.uniform,
            price_per_visit: priceText === '' ? NaN : Math.round(Number(priceText) * 100) / 100,
            // boarding has no length to type: it keeps whatever was there (the database wants a number)
            minutes_per_visit: kind === 'boarding' ? (Number.isInteger(editor.minutes) && editor.minutes >= 1 ? editor.minutes : 60) : typedMinutes(),
            days_of_week: days,
            start_date: String(field('start').value),
            end_date: String(field('end').value) || null,
            skipped_dates: editor.skipped.slice().sort()
        };
    }

    function problem(v) {
        if (!v.label) return 'Add the client’s name.';
        if (v.label.length > 80) return 'Keep the name under 80 characters.';
        if (v.visits_by_day.some(n => !Number.isInteger(n) || n < 0 || n > 20)) return 'Visits a day should be from 1 to 20.';
        if (!Number.isFinite(v.price_per_visit) || v.price_per_visit < 0 || v.price_per_visit > 100000) return v.kind === 'boarding' ? 'Add how much you’re paid per night.' : 'Add how much you’re paid per visit.';
        if (v.kind !== 'boarding' && (!Number.isInteger(v.minutes_per_visit) || v.minutes_per_visit < 1 || v.minutes_per_visit > 1440)) return 'Add how long each visit takes: hours, minutes or both (up to 24 hours, minutes 0 to 59).';
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
        if (!Number.isFinite(v.price_per_visit) || !isDate(v.start_date) || !v.days_of_week.length ||
            (v.end_date && (!isDate(v.end_date) || v.end_date < v.start_date))) {
            box.textContent = '';
            return;
        }
        const r = clean({ ...v, id: 'preview' });
        const so = earnedSoFar(r);
        const sum = rate(r);
        const after = so > 0 ? `${money(so)} earned so far` : 'Starts counting after the first day';
        const length = isBoardingKind(r) ? 'All day' : (Number.isInteger(v.minutes_per_visit) && v.minutes_per_visit >= 1 ? `${lengthText(v.minutes_per_visit)} each` : '');
        box.innerHTML = `<strong>${esc(sum.big)}</strong><span>${esc([length, sum.sub, after].filter(Boolean).join(' · '))}</span>`;
    }

    // "Visits a day": one number for every day, or a number for each day.
    function renderVisits() {
        const box = document.querySelector('#poi-editor .poi-visits');
        if (!box || !editor) return;
        const days = selectedDays();
        if (!days.length) {
            box.innerHTML = '<span class="poi-none">Pick the days you go first.</span>';
            return;
        }
        const unit = words({ kind: String(field('kind')?.value || 'other') });
        const step = (key, label, n, name) => `
            <div class="poi-step-row">
                <span class="poi-step-label">${esc(label)}</span>
                <div class="poi-stepper">
                    <button type="button" class="poi-step-btn" data-poi-step="-1" data-poi-step-day="${key}" aria-label="One fewer ${unit.one} ${esc(name)}"${n <= 1 ? ' disabled' : ''}>−</button>
                    <span class="poi-step-num" aria-live="polite">${n}<small>${n === 1 ? unit.one : unit.many}</small></span>
                    <button type="button" class="poi-step-btn" data-poi-step="1" data-poi-step-day="${key}" aria-label="One more ${unit.one} ${esc(name)}"${n >= 20 ? ' disabled' : ''}>+</button>
                </div>
            </div>`;
        if (!editor.perDay) {
            box.innerHTML = step('all', days.length === 7 ? 'Every day' : 'Each day you go', editor.uniform, 'each day') +
                (days.length > 1 ? '<button type="button" class="poi-mode" data-poi-mode="each">Different Number Some Days</button>' : '');
            return;
        }
        const r = { start_date: String(field('start').value), end_date: String(field('end').value) || null, days_of_week: days, skipped_dates: [] };
        box.innerHTML = dayOrder(r, days).map(d => step(d, dayLabel(r, d, true), editor.counts[d], `on ${DAY_FULL[d]}`)).join('') +
            '<button type="button" class="poi-mode" data-poi-mode="same">Same Number Every Day</button>';
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
        const f = document.getElementById('poi-editor');
        if (f) window.PisFormErrors?.clearAll(f);
    }

    function setBusy(on, label) {
        if (!editor) return;
        editor.busy = on;
        const f = form();
        f.querySelectorAll('button, input, select').forEach(el => { el.disabled = on; });
        const saveBtn = f.querySelector('.poi-save');
        if (label && saveBtn) saveBtn.textContent = label;
        if (!on && saveBtn) saveBtn.textContent = 'Save';
        if (!on) renderVisits();
    }

    async function submit() {
        if (!editor || editor.busy) return;
        const v = read();
        window.PisFormErrors?.clearAll(document.getElementById('poi-editor') || document);
        const issue = problem(v);
        if (issue) {
            // point at the box the problem is about (same red-box flow as every other form)
            const which = /name/i.test(issue) ? 'label' : /paid per (visit|night)/i.test(issue) ? 'price' : /how long/i.test(issue) ? 'hours'
                : /start/i.test(issue) && !/end date/i.test(issue) ? 'start' : /end date/i.test(issue) ? 'end' : '';
            const box = which ? field(which) : (/day you go/i.test(issue) ? document.querySelector('#poi-editor .poi-days, #poi-editor [data-poi-days]') : null);
            if (box && window.PisFormErrors) { hideError(); window.PisFormErrors.show(box, issue); return; }
            return showError(issue);
        }
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
            renderVisits();
            preview();
            return;
        }
        const step = el.closest('[data-poi-step]');
        if (step) {
            const delta = Number(step.dataset.poiStep);
            const key = step.dataset.poiStepDay;
            const clamp = n => Math.min(20, Math.max(1, n));
            if (key === 'all') editor.uniform = clamp(editor.uniform + delta);
            else editor.counts[Number(key)] = clamp(editor.counts[Number(key)] + delta);
            hideError();
            renderVisits();
            preview();
            return;
        }
        const mode = el.closest('[data-poi-mode]');
        if (mode) {
            if (mode.dataset.poiMode === 'each') {
                editor.perDay = true;
                editor.counts = ALL_DAYS.map(() => editor.uniform);
            } else {
                const days = selectedDays();
                editor.perDay = false;
                editor.uniform = days.length ? Math.max(...days.map(d => editor.counts[d])) : editor.uniform;
            }
            renderVisits();
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
                del.textContent = 'Tap Again to Delete';
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
    .poi input[type=date]{line-height:46px !important;text-align:left !important}
    .poi input[type=date]::-webkit-date-and-time-value{min-height:0;margin:0;line-height:46px;text-align:left}
    .poi input[type=date]::-webkit-datetime-edit{padding:0;line-height:46px}
    .poi-row2 .poi-field{justify-content:flex-end}
    .poi-row2 .poi-field > span{min-height:0 !important}
    .poi-visits{display:flex;flex-direction:column;gap:8px}
    .poi-step-row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:56px;padding:6px 6px 6px 14px;border:1px solid #c9d9ea;border-radius:12px;background:#fff;box-sizing:border-box}
    .poi-step-label{flex:1 1 auto;min-width:0;font-size:15px;font-weight:800;color:#183447;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .poi-stepper{flex:none;display:flex;align-items:center;gap:4px}
    .poi-step-btn{all:unset;display:flex !important;align-items:center !important;justify-content:center !important;width:42px !important;height:42px !important;margin:0 !important;padding:0 !important;border-radius:10px !important;background:#eaf3fb !important;color:#1f63b8 !important;font-family:inherit !important;font-size:22px !important;font-weight:800 !important;line-height:1 !important;box-sizing:border-box !important;cursor:pointer}
    .poi-step-btn:disabled{opacity:.35;cursor:default}
    .poi-step-btn:not(:disabled):active{background:#d4e7f7 !important}
    .poi-step-num{display:flex;flex-direction:column;align-items:center;min-width:52px;font-size:18px;font-weight:800;color:#183447;line-height:1.05}
    .poi-step-num small{font-size:11px;font-weight:700;color:#6b7785;letter-spacing:0;text-transform:none}
    .poi-mode{all:unset;align-self:flex-start;display:inline-flex !important;align-items:center !important;height:36px !important;margin:0 !important;padding:0 2px !important;color:#1f63b8 !important;font-family:inherit !important;font-size:14px !important;font-weight:800 !important;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
    .poi input:focus{outline:none !important;border-color:#1f7bc2 !important;box-shadow:0 0 0 3px rgba(31,123,194,.15) !important}
    .poi input:disabled{opacity:.6}
    .poi-row3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .poi-row2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .poi-row3 .poi-field > span,.poi-row2 .poi-field > span{min-height:30px;display:flex;align-items:flex-end;line-height:1.2}
    .poi-row2 .poi-field > span{flex-wrap:wrap;gap:0 4px}
    .poi select{display:block !important;width:100% !important;min-width:0 !important;height:48px !important;margin:0 !important;padding:0 36px 0 12px !important;box-sizing:border-box !important;border:1px solid #c9d9ea !important;border-radius:12px !important;
        background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2346617d' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center !important;
        color:#183447 !important;font-family:inherit !important;font-size:16px !important;font-weight:600 !important;-webkit-appearance:none !important;appearance:none !important}
    .poi select:focus{outline:none !important;border-color:#1f7bc2 !important;box-shadow:0 0 0 3px rgba(31,123,194,.15) !important}
    .poi select:disabled{opacity:.6}
    .poi-field[hidden]{display:none !important}
    .poi-time{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
    .poi-time label{position:relative;display:block;margin:0}
    .poi-time i{position:absolute;right:9px;top:50%;transform:translateY(-50%);font-style:normal;font-size:12.5px;font-weight:700;color:#6b7785;pointer-events:none}
    .poi .poi-time input{padding:0 34px 0 10px !important}
    .poi-allday p{display:flex;align-items:center;min-height:48px;margin:0;font-size:12.5px;font-weight:600;line-height:1.35;color:#5b6f82}
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
