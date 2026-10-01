/* Paws in Stride — Full Financials modal.
   Load AFTER admin.js. Adds a "View Full Financials" button to the bottom of the
   Financial Snapshot card and opens a modal with month / year stats.
   Everything is worked out from the visits already loaded in the portal; the only
   extra request is the saved driving estimates for the current month. */
(function () {
    'use strict';

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];

    let driveRows = [];
    let driveKey = '';
    let driveState = 'idle'; // idle | loading | ready | error
    let selectedMonth = null;
    let period = null; // 'month' | 'year'
    let pushedHistory = false;

    const money = n => Number(n || 0).toLocaleString('en-US', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 0, minimumFractionDigits: 0
    });
    const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const hrs = mins => {
        const m = Math.max(0, Math.round(Number(mins) || 0));
        const h = Math.floor(m / 60);
        return h ? `${h}h ${m % 60}m` : `${m}m`;
    };
    const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
    const key = (y, m, d) => makeDateString(y, m, d);
    const lower = v => String(v || '').toLowerCase();

    function isBoarding(v) {
        return typeof isAdminBoardingService === 'function' ? isAdminBoardingService(v) :
            /board/i.test(`${v.service_type || ''} ${v.service_name || ''}`);
    }
    function isCancelled(v) { return lower(v.status) === 'cancelled'; }
    function isDone(v, today) {
        if (isCancelled(v)) return false;
        if (v.completed_at || lower(v.status) === 'completed') return true;
        // Boarding nights don't get checked in one by one; a night that has passed counts.
        return isBoarding(v) && v.visit_date <= today;
    }
    function price(v) { return Number(v.price || 0); }
    function sum(list) { return list.reduce((t, v) => t + price(v), 0); }
    function minutesOf(v) {
        return typeof getAdminFinancialVisitMinutes === 'function' ? getAdminFinancialVisitMinutes(v) : 15;
    }
    function drives(v) {
        return typeof isAdminDrivingService === 'function' ? isAdminDrivingService(v) : !isBoarding(v);
    }
    /* ---------- driving estimates for the month ---------- */
    async function loadDrive(start, end) {
        if (typeof currentUser === 'undefined' || !currentUser?.id) return;
        const k = `${currentUser.id}:${start}:${end}`;
        if (driveKey === k && (driveState === 'ready' || driveState === 'loading')) return;
        driveKey = k;
        driveState = 'loading';
        try {
            const out = [];
            for (let from = 0; from < 20000; from += 1000) {
                const { data, error } = await supabaseClient
                    .from('admin_route_drive_estimates')
                    .select('visit_id, visit_date, drive_seconds, locked_at')
                    .eq('admin_id', currentUser.id)
                    .gte('visit_date', start)
                    .lte('visit_date', end)
                    .order('visit_date', { ascending: true })
                    .range(from, from + 999);
                if (error) throw error;
                out.push(...(data || []));
                if (!data || data.length < 1000) break;
            }
            driveRows = out;
            driveState = 'ready';
        } catch (e) {
            console.error('Financials drive estimates:', e);
            driveState = 'error';
        }
        if (document.getElementById('pfin-modal')) render();
    }

    /* ---------- the numbers ---------- */
    function compute() {
        const today = getLocalDateString();
        const t = parseLocalDate(today);
        const y = t.getFullYear(), m = t.getMonth(), d = t.getDate();
        const mStart = key(y, m, 1), mEnd = key(y, m, daysIn(y, m));
        const all = Array.isArray(allVisits) ? allVisits : [];
        const live = all.filter(v => !isCancelled(v));

        // This month
        const month = live.filter(v => v.visit_date >= mStart && v.visit_date <= mEnd);
        const monthDone = month.filter(v => isDone(v, today));
        const monthTotal = sum(month);
        const monthEarned = sum(monthDone);

        // Same point last month (1st through today's day number)
        const ly = m === 0 ? y - 1 : y, lm = m === 0 ? 11 : m - 1;
        const lStart = key(ly, lm, 1), lEnd = key(ly, lm, Math.min(d, daysIn(ly, lm)));
        const lastSoFar = sum(live.filter(v => v.visit_date >= lStart && v.visit_date <= lEnd && isDone(v, today)));
        const thisSoFar = sum(monthDone.filter(v => v.visit_date <= today));
        const change = lastSoFar > 0 && thisSoFar > 0 ? (thisSoFar - lastSoFar) / lastSoFar : null;

        // Work time + hourly rate (boarding excluded, same as the Today rate).
        // Month or whole year so far; defaults to the year until this month has a finished visit.
        const yStart = key(y, 0, 1);
        const doneIn = start => live.filter(v => v.visit_date >= start && v.visit_date <= today && isDone(v, today));
        const monthHasWork = doneIn(mStart).some(v => !isBoarding(v));
        const per = period || (monthHasWork ? 'month' : 'year');
        const periodDone = doneIn(per === 'month' ? mStart : yStart);
        const work = periodDone.filter(v => !isBoarding(v));
        const rows = new Map(driveRows.map(r => [String(r.visit_id), r]));
        const locked = v => {
            const r = rows.get(String(v.id));
            return r?.locked_at && Number.isFinite(Number(r.drive_seconds)) ? Number(r.drive_seconds) : null;
        };
        let visitMin = 0, driveMin = 0;
        const byDay = new Map();
        for (const v of work) {
            visitMin += minutesOf(v);
            const s = drives(v) ? locked(v) : 0;
            if (s) driveMin += s / 60;
            if (!byDay.has(v.visit_date)) byDay.set(v.visit_date, []);
            byDay.get(v.visit_date).push(v);
        }
        let rateEarned = 0, rateMin = 0, rateDays = 0;
        for (const list of byDay.values()) {
            const ok = list.every(v => !drives(v) || locked(v) !== null);
            if (!ok) continue;
            rateDays++;
            rateEarned += sum(list);
            rateMin += list.reduce((t, v) => t + minutesOf(v) + ((drives(v) ? locked(v) : 0) || 0) / 60, 0);
        }
        let rate = rateMin > 0 ? rateEarned / (rateMin / 60) : null;
        // No saved driving time at all for this period: fall back to visit time only.
        const visitOnly = rate === null && visitMin > 0 && rateDays === 0;
        if (visitOnly) rate = sum(work) / (visitMin / 60);

        const nights = periodDone.filter(isBoarding).length;
        const avg = work.length ? sum(work) / work.length : null;

        // This year, month by month
        const yearBars = MONTHS.map((_, i) => {
            const s = key(y, i, 1), e = key(y, i, daysIn(y, i));
            const list = live.filter(v => v.visit_date >= s && v.visit_date <= e);
            const earned = sum(list.filter(v => isDone(v, today)));
            return { i, earned, scheduled: sum(list) - earned };
        });
        const yearEarned = yearBars.reduce((t, b) => t + b.earned, 0);
        const yearScheduled = yearBars.reduce((t, b) => t + b.scheduled, 0);

        return {
            thisSoFar, y, m, d, mStart, mEnd, lm, monthTotal, monthEarned, change, lastSoFar,
            visitMin, driveMin, rate, rateDays, workDays: byDay.size, visitOnly, per, yStart,
            work, nights, avg, yearBars, yearEarned, yearScheduled
        };
    }

    /* ---------- markup ---------- */
    function render() {
        const modal = document.getElementById('pfin-modal');
        if (!modal) return;
        const s = compute();
        if (selectedMonth === null) selectedMonth = s.m;
        const body = modal.querySelector('.pfin-body');
        const keepScroll = body.scrollTop;

        let changeHtml = '';
        if (s.change !== null) {
            const up = s.change >= 0;
            changeHtml = `<span class="pfin-change ${up ? 'is-up' : 'is-down'}">${up ? '▲' : '▼'} ${Math.abs(Math.round(s.change * 100))}%</span>
                <span class="pfin-change-note">vs. ${MONTHS[s.lm].slice(0, 3)} 1${s.d > 1 ? '–' + s.d : ''} (${money(s.lastSoFar)})</span>`;
        } else {
            changeHtml = `<span class="pfin-change-note">${s.thisSoFar > 0 ? `Nothing from ${MONTHS[s.lm].slice(0, 3)} 1${s.d > 1 ? '–' + s.d : ''} to compare to` : `Compares to ${MONTHS[s.lm]} after your first finished visit`}</span>`;
        }

        let rateValue = '—', rateNote;
        if (driveState === 'loading' || driveState === 'idle') rateNote = 'Loading saved driving time…';
        else if (s.rate === null) rateNote = s.per === 'month' ? 'Appears after your first finished visit this month.' : 'Appears after your first finished visit.';
        else if (s.visitOnly) {
            rateValue = `${money(s.rate)}/hr`;
            rateNote = driveState === 'error' ? 'Visit time only · couldn’t load driving time (reopen to retry)'
                : 'Visit time only · no saved driving time for these days';
        } else {
            rateValue = `${money(s.rate)}/hr`;
            rateNote = s.rateDays === s.workDays ? `Visit time + driving · ${s.workDays} work ${s.workDays === 1 ? 'day' : 'days'}`
                : `Visit time + driving · ${s.rateDays} of ${s.workDays} work days (the rest are missing driving time)`;
        }

        const max = Math.max(1, ...s.yearBars.map(b => b.earned + b.scheduled));
        const bars = s.yearBars.map(b => {
            const tot = b.earned + b.scheduled;
            return `<button type="button" class="pfin-bar${b.i === selectedMonth ? ' is-selected' : ''}${b.i === s.m ? ' is-current' : ''}" data-pfin-month="${b.i}" aria-label="${MONTHS[b.i]} ${money(tot)}">
                <span class="pfin-bar-track"><span class="pfin-bar-sched" style="height:${(tot / max) * 100}%"></span><span class="pfin-bar-earned" style="height:${(b.earned / max) * 100}%"></span></span>
                <span class="pfin-bar-label">${MONTHS[b.i][0]}</span></button>`;
        }).join('');
        const sel = s.yearBars[selectedMonth];

        body.innerHTML = `
        <section class="pfin-hero">
            <span class="pfin-label">This Month · ${MONTHS[s.m]}</span>
            <strong class="pfin-big">${money(s.monthTotal)}</strong>
            <div class="pfin-split">
                <span><i class="dot dot-earned"></i>${money(s.monthEarned)} earned</span>
                <span><i class="dot dot-sched"></i>${money(s.monthTotal - s.monthEarned)} still on the schedule</span>
            </div>
            <div class="pfin-change-row">${changeHtml}</div>
        </section>

        <div class="pfin-toggle" role="tablist">
            <button type="button" data-pfin-period="month" class="${s.per === 'month' ? 'is-on' : ''}">${MONTHS[s.m]}</button>
            <button type="button" data-pfin-period="year" class="${s.per === 'year' ? 'is-on' : ''}">${s.y} so far</button>
        </div>

        <section class="pfin-card pfin-rate">
            <span class="pfin-label">Effective Hourly Rate</span>
            <strong class="pfin-value">${rateValue}</strong>
            <span class="pfin-note">${esc(rateNote)}</span>
        </section>

        <div class="pfin-pair">
            <section class="pfin-card">
                <span class="pfin-label">Hours Worked</span>
                <strong class="pfin-value">${hrs(s.visitMin + s.driveMin)}</strong>
                <span class="pfin-note">${hrs(s.visitMin)} visits · ${hrs(s.driveMin)} driving</span>
            </section>
            <section class="pfin-card">
                <span class="pfin-label">Avg per Visit</span>
                <strong class="pfin-value">${s.avg === null ? '—' : money(s.avg)}</strong>
                <span class="pfin-note">${s.work.length} ${s.work.length === 1 ? 'visit' : 'visits'} finished${s.nights ? ` · ${s.nights} boarding ${s.nights === 1 ? 'night' : 'nights'}` : ''}</span>
            </section>
        </div>

        <section class="pfin-card pfin-year">
            <div class="pfin-row-head">
                <span class="pfin-label">This Year · ${s.y}</span>
                <strong class="pfin-value">${money(s.yearEarned + s.yearScheduled)}</strong>
            </div>
            <div class="pfin-split">
                <span><i class="dot dot-earned"></i>${money(s.yearEarned)} earned</span>
                <span><i class="dot dot-sched"></i>${money(s.yearScheduled)} scheduled</span>
            </div>
            <div class="pfin-chart">${bars}</div>
            <div class="pfin-chart-detail"><strong>${MONTHS[selectedMonth]}</strong><span>${money(sel.earned + sel.scheduled)}${sel.scheduled ? ` · ${money(sel.earned)} earned` : ''}</span></div>
        </section>`;
        body.scrollTop = keepScroll;
    }

    /* ---------- open / close ---------- */
    function open() {
        if (document.getElementById('pfin-modal')) return;
        selectedMonth = null;
        period = null;
        const wrap = document.createElement('div');
        wrap.id = 'pfin-modal';
        wrap.className = 'pfin';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.innerHTML = `
            <div class="pfin-sheet">
                <header class="pfin-head">
                    <div><span class="pfin-eyebrow">BUSINESS PERFORMANCE</span><h2>Financials</h2></div>
                    <button type="button" class="pfin-close" aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </header>
                <div class="pfin-body"></div>
            </div>`;
        document.body.appendChild(wrap);
        document.body.classList.add('pfin-open');
        wrap.addEventListener('click', e => {
            if (e.target === wrap || e.target.closest('.pfin-close')) return close();
            const tog = e.target.closest('[data-pfin-period]');
            if (tog) { period = tog.dataset.pfinPeriod; render(); return; }
            const bar = e.target.closest('[data-pfin-month]');
            if (bar) { selectedMonth = Number(bar.dataset.pfinMonth); render(); }
        });
        try { history.pushState({ pfin: true }, ''); pushedHistory = true; } catch (e) { pushedHistory = false; }
        render();
        const s = compute();
        void loadDrive(s.yStart, s.mEnd);
    }

    function close(fromPop) {
        const m = document.getElementById('pfin-modal');
        if (!m) return;
        m.remove();
        document.body.classList.remove('pfin-open');
        if (pushedHistory && !fromPop) { pushedHistory = false; try { history.back(); } catch (e) {} }
        pushedHistory = false;
    }

    window.addEventListener('popstate', () => { if (document.getElementById('pfin-modal')) close(true); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    function addButton() {
        const card = document.getElementById('admin-financial-snapshot');
        if (!card || card.querySelector('.pfin-open-btn')) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pfin-open-btn';
        b.innerHTML = 'View Full Financials <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
        b.addEventListener('click', open);
        card.appendChild(b);
    }

    const css = `
    .pfin-open-btn{display:flex !important;align-items:center !important;justify-content:center !important;gap:6px !important;width:100% !important;margin:14px 0 0 !important;padding:0 16px !important;height:48px !important;border-radius:14px !important;border:1px solid #c8dce8 !important;background:#f4f9fd !important;color:#1f63b8 !important;font-family:inherit !important;font-size:15px !important;font-weight:800 !important;line-height:1 !important;box-shadow:none !important;cursor:pointer}
    .pfin-open-btn:active{background:#e6f1fb !important}
    body.pfin-open{overflow:hidden}
    .pfin{position:fixed;inset:0;z-index:10050;background:rgba(15,35,55,.45);display:flex;align-items:flex-end;justify-content:center}
    .pfin-sheet{width:100%;max-width:560px;height:100%;max-height:100%;display:flex;flex-direction:column;background:#f4f8fc;color:#183447;font-family:inherit}
    @media (min-width:701px){.pfin{align-items:center;padding:24px}.pfin-sheet{height:auto;max-height:92vh;border-radius:22px;overflow:hidden}}
    .pfin-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:calc(16px + env(safe-area-inset-top,0px)) 18px 14px;background:#fff;border-bottom:1px solid #dbe7f3}
    .pfin-eyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:.12em;color:#1f63b8}
    .pfin-head h2{margin:2px 0 0;font-size:22px;font-weight:800;color:#183447}
    .pfin-close{flex:none !important;width:44px !important;height:44px !important;padding:0 !important;margin:0 !important;border-radius:14px !important;border:1px solid #c9d9ea !important;background:#fff !important;color:#2a5d8f !important;display:flex !important;align-items:center !important;justify-content:center !important;box-shadow:none !important}
    .pfin-body{flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px 14px calc(24px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:10px}
    .pfin-body > *{flex-shrink:0;margin:0 !important}
    .pfin-label{display:block;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#667784}
    .pfin-note{display:block;margin-top:6px;font-size:12px;font-weight:600;line-height:1.4;color:#6b7785}
    .pfin-card{background:#fff;border:1px solid #d6e4eb;border-radius:16px;padding:16px;box-shadow:0 4px 12px rgba(24,52,71,.05)}
    .pfin-value{display:block;margin-top:6px;font-size:26px;font-weight:800;line-height:1.05;color:#183447}
    .pfin-row-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
    .pfin-row-head .pfin-value{margin-top:0;font-size:22px}
    .pfin-hero{position:relative;overflow:hidden;border-radius:18px;padding:18px;background:linear-gradient(135deg,#2890df 0%,#1f7bc2 58%,#1768aa 100%);color:#fff;box-shadow:0 8px 18px rgba(31,123,194,.2)}
    .pfin-hero::after{content:"";position:absolute;top:-60px;right:-45px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.08);pointer-events:none}
    .pfin-hero .pfin-label{color:rgba(255,255,255,.75)}
    .pfin-big{display:block;margin-top:6px;font-size:40px;font-weight:800;line-height:1}
    .pfin-split{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:10px;font-size:13px;font-weight:600}
    .pfin-split span{display:inline-flex;align-items:center;gap:6px}
    .pfin-card .pfin-split{color:#46617d}
    .dot{display:inline-block;width:9px;height:9px;border-radius:50%}
    .pfin-hero .dot-earned{background:#fff}.pfin-hero .dot-sched{background:rgba(255,255,255,.4)}
    .pfin-card .dot-earned{background:#1f7bc2}.pfin-card .dot-sched{background:#bcd9f2}
    .pfin-change-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.2)}
    .pfin-change{font-size:13px;font-weight:800;border-radius:999px;padding:4px 10px;background:rgba(255,255,255,.95)}
    .pfin-change.is-up{color:#168a3a}.pfin-change.is-down{color:#c0392b}
    .pfin-change-note{font-size:12px;font-weight:600;color:rgba(255,255,255,.85)}
    .pfin-toggle{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:14px;background:#e3edf6}
    .pfin-toggle button{all:unset;display:flex !important;align-items:center !important;justify-content:center !important;height:38px !important;width:auto !important;padding:0 !important;margin:0 !important;border-radius:11px !important;font-family:inherit !important;font-size:14px !important;font-weight:800 !important;color:#46617d !important;background:transparent !important;box-shadow:none !important;cursor:pointer}
    .pfin-toggle button.is-on{background:#fff !important;color:#1f63b8 !important;box-shadow:0 2px 6px rgba(24,52,71,.12) !important}
    .pfin-rate{border-color:#b9d8ef;background:linear-gradient(180deg,#fff 0%,#f2f8fd 100%)}
    .pfin-rate .pfin-value{color:#1768aa;font-size:30px}
    .pfin-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .pfin-pair .pfin-value{font-size:22px}
    .pfin-pair > *{margin:0 !important}
    .pfin-chart{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;align-items:end;height:130px;margin-top:14px}
    .pfin-bar{all:unset;display:flex !important;flex-direction:column !important;align-items:center !important;gap:6px !important;height:100% !important;width:auto !important;padding:0 !important;margin:0 !important;background:none !important;border:0 !important;box-shadow:none !important;cursor:pointer}
    .pfin-bar-track{position:relative;flex:1;width:100%;max-width:22px;border-radius:6px;background:#f0f5fa}
    .pfin-bar-sched,.pfin-bar-earned{position:absolute;left:0;right:0;bottom:0;border-radius:6px}
    .pfin-bar-sched{background:#bcd9f2}.pfin-bar-earned{background:#1f7bc2}
    .pfin-bar-label{font-size:11px;font-weight:700;color:#8a99a6}
    .pfin-bar.is-current .pfin-bar-label{color:#1f63b8}
    .pfin-bar.is-selected .pfin-bar-track{outline:2px solid #1f63b8;outline-offset:2px}
    .pfin-chart-detail{display:flex;justify-content:space-between;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid #e6eef5;font-size:13px;color:#46617d}
    .pfin-chart-detail strong{color:#183447}`;

    function init() {
        if (!document.getElementById('pfin-style')) {
            const st = document.createElement('style');
            st.id = 'pfin-style';
            st.textContent = css;
            document.head.appendChild(st);
        }
        addButton();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.openAdminFullFinancials = open;
})();
