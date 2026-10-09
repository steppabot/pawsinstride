/* Paws in Stride — Pet Sitting: Duration + Start Time booking.
   Load AFTER portal.js on dashboard.html.

   - "Package" becomes "Duration": 4, 6, 8 or 12 hours.
   - "Time Block" becomes a Start Time list (on the hour) plus an End Time
     that fills in automatically, so the length is always exact.
   - Starts no earlier than 7:00 AM and ends no later than 11:00 PM.
   The selected value is still a normal "9:00 AM - 3:00 PM" time window, so the
   rest of the booking flow, drafts, checkout and the admin portal work unchanged. */
(function () {
    'use strict';
    if (typeof SERVICE_CONFIG === 'undefined' || !SERVICE_CONFIG['Pet Sitting']) return;

    const OPEN = 7 * 60;      // 7:00 AM
    const CLOSE = 23 * 60;    // 11:00 PM
    const STEP = 60;          // start times on the hour
    const HOURS = {
        'Basic Sit - 4 Hours': 4,
        'Extended Sit - 6 Hours': 6,
        'Standard Sit - 8 Hours': 8,
        'VIP Sit - 12 Hours': 12
    };

    const config = SERVICE_CONFIG['Pet Sitting'];
    config.optionLabel = 'Duration';
    if (!config.options.some(o => o.value === 'Extended Sit - 6 Hours')) {
        config.options.push({ value: 'Extended Sit - 6 Hours', databaseOption: 'extended_6_hour' });
    }
    config.options.sort((a, b) => (HOURS[a.value] || 99) - (HOURS[b.value] || 99));

    function clock(mins) {
        const h = Math.floor(mins / 60), m = mins % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${String(m).padStart(2, '0')} ${period}`;
    }
    function windowsFor(hours) {
        const out = [];
        for (let start = OPEN; start + hours * 60 <= CLOSE; start += STEP) {
            out.push(`${clock(start)} - ${clock(start + hours * 60)}`);
        }
        return out;
    }
    config.options.forEach(o => {
        if (HOURS[o.value]) { o.hours = HOURS[o.value]; o.timeBlocks = windowsFor(HOURS[o.value]); }
    });

    const isSitting = () => typeof serviceTypeSelect !== 'undefined' && serviceTypeSelect?.value === 'Pet Sitting';
    const selectedHours = () => HOURS[serviceOptionSelect?.value] || null;

    /* ---------- End Time field ---------- */
    function endField() {
        let wrap = document.getElementById('pis-sit-end');
        if (!wrap) {
            const anchor = document.getElementById('booking-time-windows');
            if (!anchor) return null;
            wrap = document.createElement('div');
            wrap.id = 'pis-sit-end';
            wrap.className = 'pis-sit-end';
            wrap.innerHTML = `<label for="pis-sit-end-input">End Time</label>
                <input id="pis-sit-end-input" type="text" readonly tabindex="-1" placeholder="Pick a start time first">
                <p class="booking-help pis-sit-end-help"></p>`;
            anchor.insertAdjacentElement('afterend', wrap);
        }
        return wrap;
    }
    function updateEnd() {
        const wrap = endField();
        if (!wrap) return;
        const hours = selectedHours();
        const show = isSitting() && Boolean(hours);
        wrap.hidden = !show;
        if (!show) return;
        const value = bookingTime?.value || '';
        const end = value.includes(' - ') ? value.split(' - ')[1] : '';
        wrap.querySelector('input').value = end;
        wrap.querySelector('.pis-sit-end-help').textContent = end
            ? `${hours}-hour sit · ${value.replace(' - ', ' – ')}`
            : `Choose a start time and the ${hours}-hour end time fills in automatically.`;
    }

    // Catch programmatic changes too (drafts, Repeat Last Week).
    if (typeof bookingTime !== 'undefined' && bookingTime) {
        const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
        try {
            Object.defineProperty(bookingTime, 'value', {
                configurable: true,
                get() { return proto.get.call(this); },
                set(v) { proto.set.call(this, v); queueMicrotask(updateEnd); }
            });
        } catch (e) { /* older browsers: the change listener below still works */ }
        bookingTime.addEventListener('change', updateEnd);
    }
    serviceTypeSelect?.addEventListener('change', () => setTimeout(updateEnd, 0));
    serviceOptionSelect?.addEventListener('change', () => setTimeout(updateEnd, 0));

    /* ---------- Duration labels ---------- */
    const originalPopulateOptions = window.populateServiceOptions;
    if (typeof originalPopulateOptions === 'function') {
        window.populateServiceOptions = function (serviceType) {
            const result = originalPopulateOptions.apply(this, arguments);
            if (serviceType === 'Pet Sitting') {
                [...serviceOptionSelect.options].forEach(opt => {
                    const h = HOURS[opt.value];
                    if (!h) return;
                    const price = opt.dataset.price ? `$${Number(opt.dataset.price).toFixed(2)}` : '';
                    opt.textContent = `${h} Hours${price ? ' — ' + price : ''}`;
                });
                if (serviceOptionSelect.options[0] && !serviceOptionSelect.options[0].value) {
                    serviceOptionSelect.options[0].textContent = 'Select duration';
                }
            }
            return result;
        };
    }

    /* ---------- Start Time list ---------- */
    const originalPopulateBlocks = window.populatePetSittingTimeBlocks;
    if (typeof originalPopulateBlocks === 'function') {
        window.populatePetSittingTimeBlocks = function () {
            const result = originalPopulateBlocks.apply(this, arguments);
            const label = document.getElementById('time-window-label');
            if (label && selectedHours()) label.textContent = 'Start Time';
            [...bookingTime.options].forEach(opt => {
                if (!opt.value) opt.textContent = 'Select a start time';
                else opt.textContent = opt.value.split(' - ')[0];
            });
            updateEnd();
            return result;
        };
    }

    // Older wording in the submit check.
    const message = document.getElementById('booking-message');
    if (message) {
        new MutationObserver(() => {
            if (message.textContent === 'Please select a time block.') message.textContent = 'Please select a start time.';
        }).observe(message, { childList: true, characterData: true, subtree: true });
    }

    const style = document.createElement('style');
    style.textContent = `
        .pis-sit-end{margin-top:12px}
        .pis-sit-end[hidden]{display:none !important}
        .pis-sit-end input{width:100%;box-sizing:border-box;background:#f3f7fb !important;color:#183447 !important;font-weight:700;cursor:default}
        .pis-sit-end-help{margin-top:6px}`;
    document.head.appendChild(style);
})();

/* ============================================================
   Pet Sitting live updates — client viewer.
   Shows the updates your sitter sends during a sit (notes, photos,
   care checkboxes). Opened from the sit's card, a notification, or
   a push link (?sit_visit=<visit id>).
   ============================================================ */
(function () {
    'use strict';
    let viewer = null;
    let opening = null;
    const lower = v => String(v || '').toLowerCase();
    const isSit = v => /pet[\s_-]*sit/.test(lower(`${v?.service_type || ''} ${v?.service_name || ''}`));
    const time = value => new Date(value).toLocaleString('en-US', {
        timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    const findVisit = id => (typeof currentVisits !== 'undefined' ? currentVisits : []).find(v => Number(v.id) === Number(id));
    const petNames = visit => (typeof getPetsForVisit === 'function' ? getPetsForVisit(visit) : []).map(p => p.name).filter(Boolean).join(' & ') || 'Your pet';

    // Card section used by portal.js inside each pet sitting card.
    window.buildClientSitUpdatesSection = function (visit, progress) {
        if (!isSit(visit) || lower(visit.status) === 'cancelled') return '';
        const state = progress?.state;
        if (state === 'checked_in' || state === 'completed') {
            return `<div class="client-sit-updates${state === 'completed' ? ' is-done' : ''}">
                <p>${state === 'checked_in'
                    ? `Your sitter is with ${escapeHtml(petNames(visit))} now. Photos and updates appear here.`
                    : 'Thanks for booking a sit with us. You can still view the photos and updates.'}</p>
                <button type="button" class="secondary-button client-boarding-view-button" data-client-sit-view="${Number(visit.id)}">View Sit Updates</button>
            </div>`;
        }
        return '<p class="client-sit-updates-hint">Photos and care updates will appear here during the sit.</p>';
    };

    async function loadFeed(state, silent = false) {
        const feed = state.dialog.querySelector('[data-sit-feed]');
        const message = state.dialog.querySelector('[data-sit-feed-message]');
        if (!silent) message.textContent = 'Loading updates…';
        try {
            const { data, error } = await supabaseClient.from('visit_updates')
                .select('id, notes, published_at, visit_update_photos(storage_path, caption, sort_order), visit_update_pet_care(pet_id, fed, fresh_water, pee, poop)')
                .eq('visit_id', state.visitId).not('published_at', 'is', null)
                .order('published_at', { ascending: false }).order('id', { ascending: false });
            if (error) throw error;
            const signature = JSON.stringify(data || []);
            if (silent && state.liveSignature === signature) return;
            const cards = await Promise.all((data || []).map(async row => {
                const photos = await Promise.all((row.visit_update_photos || []).sort((a, b) => a.sort_order - b.sort_order).map(async photo => {
                    const r = await supabaseClient.storage.from(VISIT_MEDIA_BUCKET).createSignedUrl(photo.storage_path, 3600);
                    return { ...photo, url: r.error ? null : r.data?.signedUrl };
                }));
                return `<article class="client-boarding-update">
                    <h3>${escapeHtml(time(row.published_at))}</h3>
                    ${row.notes ? `<p class="client-boarding-note">${escapeHtml(row.notes)}</p>` : ''}
                    ${(row.visit_update_pet_care || []).map(care => {
                        const labels = [['fed', 'Fed'], ['fresh_water', 'Fresh Water'], ['pee', 'Pee'], ['poop', 'Poop']].filter(([k]) => care[k]).map(([, l]) => l);
                        if (!labels.length) return '';
                        const name = (typeof currentPets !== 'undefined' ? currentPets : []).find(p => Number(p.id) === Number(care.pet_id))?.name || 'Pet';
                        return `<div class="client-boarding-care-pet"><strong>${escapeHtml(name)}</strong>
                            <div class="client-visit-report-care-grid">${labels.map(l => `<span class="client-visit-report-care-item"><span class="client-visit-report-care-check" aria-hidden="true">✓</span>${escapeHtml(l)}</span>`).join('')}</div></div>`;
                    }).join('')}
                    <div class="client-boarding-photo-grid">${photos.map(p => p.url
                        ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption || 'Sit photo')}" loading="lazy"></a>`
                        : '<span>Photo temporarily unavailable</span>').join('')}</div>
                </article>`;
            }));
            if (viewer !== state) return;
            feed.innerHTML = cards.join('');
            state.liveSignature = signature;
            message.textContent = cards.length ? 'Tap a photo to view it full size.' : 'Your sitter will share photos and updates here during the sit.';
        } catch (error) {
            console.error('Sit updates error:', error);
            message.textContent = 'Updates could not be loaded. Please try again.';
        }
    }

    window.refreshClientLiveSitFeed = async function () {
        const state = viewer;
        if (!state || state.liveBusy) return;
        state.liveBusy = true;
        const body = state.dialog.querySelector('.client-boarding-dialog-body');
        const top = body?.scrollTop;
        try {
            await loadFeed(state, true);
            const visit = findVisit(state.visitId);
            const status = body?.querySelector(':scope > p');
            if (status && visit) status.textContent = visit.checked_in_at && !visit.completed_at
                ? 'Your sitter is with your pet now' : 'Pet sitting updates';
        } finally {
            state.liveBusy = false;
            if (body?.isConnected) body.scrollTop = top;
        }
    };

    async function openViewer(visitId) {
        visitId = Number(visitId);
        if (!visitId) return;
        if (viewer) viewer.dialog.close();
        const visit = findVisit(visitId);
        const dialog = document.createElement('dialog');
        dialog.className = 'client-boarding-dialog client-sit-dialog';
        dialog.setAttribute('aria-labelledby', 'client-sit-dialog-title');
        const live = visit && (visit.checked_in_at && !visit.completed_at && lower(visit.status) !== 'completed');
        dialog.innerHTML = `<header class="client-boarding-dialog-header">
            ${typeof pisKindIconHtml === 'function' ? pisKindIconHtml({ service_type: 'Pet Sitting' }, 'pis-head-icon') : ''}
            <div><small>PET SITTING UPDATES</small><h2 id="client-sit-dialog-title">${escapeHtml(visit ? petNames(visit) : 'Your pet')}</h2>
            <p>${escapeHtml(visit ? [typeof clientBoardingDate === 'function' ? clientBoardingDate(visit.visit_date) : visit.visit_date, visit.time_window].filter(Boolean).join(' · ') : '')}</p></div>
            <button type="button" data-boarding-view-close data-sit-view-close aria-label="Close sit updates">×</button></header>
            <div class="client-boarding-dialog-body">
            <p>${live ? 'Your sitter is with your pet now' : 'Pet sitting updates'}</p>
            <div data-sit-feed></div><p data-sit-feed-message role="status"></p>
            <button type="button" class="secondary-button" data-sit-refresh>Refresh</button></div>`;
        const state = { dialog, visitId };
        viewer = state;
        document.body.appendChild(dialog);
        dialog.querySelector('[data-sit-view-close]').onclick = () => dialog.close();
        dialog.querySelector('[data-sit-refresh]').onclick = () => void loadFeed(state);
        dialog.addEventListener('close', () => { dialog.remove(); if (viewer === state) viewer = null; });
        dialog.showModal();
        await loadFeed(state);
    }

    window.openClientSitUpdates = async function (visitId) {
        if (opening) return opening;
        opening = openViewer(visitId).catch(error => {
            console.error(error);
            alert('Sit updates could not be loaded. Please try again.');
        }).finally(() => { opening = null; });
        return opening;
    };

    // Push / notification links: /portal/dashboard.html?sit_visit=123
    let linkDone = '';
    window.openClientSitNotificationLink = async function () {
        if (typeof currentUser === 'undefined' || !currentUser?.id) return;
        const url = new URL(window.location.href);
        const id = url.searchParams.get('sit_visit');
        if (!id || !/^\d+$/.test(id) || linkDone === `${currentUser.id}:${id}`) return;
        linkDone = `${currentUser.id}:${id}`;
        try { if (typeof closeClientNotificationCenter === 'function') closeClientNotificationCenter(); } catch (e) {}
        await window.openClientSitUpdates(id);
        const cleaned = new URL(window.location.href);
        cleaned.searchParams.delete('sit_visit');
        window.history.replaceState(window.history.state, '', cleaned.toString());
    };

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-client-sit-view]');
        if (!button || button.disabled) return;
        event.preventDefault();
        void window.openClientSitUpdates(button.dataset.clientSitView);
    });

    const style = document.createElement('style');
    style.textContent = `
        .client-sit-updates{margin-top:12px;padding:12px;border-radius:14px;background:#fff8e8;border:1px solid #ecd28f}
        .client-sit-updates p{margin:0 0 10px;color:#7a5512;font-weight:600;font-size:14px;line-height:1.4}
        .client-sit-updates.is-done{background:#f3faf4;border-color:#cfe7d4}
        .client-sit-updates.is-done p{color:#2e6b3f}
        .client-sit-updates-hint{margin:10px 0 0;color:#6b7785;font-size:13px}
        .client-sit-dialog .client-boarding-dialog-header{background:linear-gradient(135deg,#d6467f,#b8336a) !important}`;
    document.head.appendChild(style);
})();


/* ============================================================
   Service themes — icon + color per service type (client portal).
   Walk = blue paw, Drop-In = cyan house, Pet Sitting = pink heart,
   Boarding = orange moon, Meet & Greet = purple people.
   Card backgrounds keep showing status (yellow live, green done).
   ============================================================ */
(function () {
    'use strict';
    const ICONS = {
        walk: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="7" cy="9" rx="2" ry="2.6"/><ellipse cx="12" cy="6.5" rx="2" ry="2.6"/><ellipse cx="17" cy="9" rx="2" ry="2.6"/><ellipse cx="4.6" cy="13.6" rx="1.7" ry="2.2"/><ellipse cx="19.4" cy="13.6" rx="1.7" ry="2.2"/><path d="M12 11.5c-2.6 0-5.2 3.4-5.2 5.6 0 1.6 1.3 2.4 2.8 2.4 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.5 0 2.8-.8 2.8-2.4 0-2.2-2.6-5.6-5.2-5.6z"/></svg>',
        drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>',
        sit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>',
        board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/><path d="M17 3v3M15.5 4.5h3"/></svg>',
        meet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2"/><circle cx="17" cy="9" r="2.6"/><path d="M15.8 14.4c2.6.2 4.7 2.2 4.7 4.9"/></svg>'
    };
    function kind(visit) {
        const t = `${visit?.service_type || ''} ${visit?.service_name || ''}`.toLowerCase();
        if (/meet\s*(&|and)?\s*greet/.test(t)) return 'meet';
        if (/board/.test(t)) return 'board';
        if (/drop/.test(t)) return 'drop';
        if (/pet[\s_-]*sit/.test(t)) return 'sit';
        if (/walk/.test(t)) return 'walk';
        return '';
    }
    window.pisKind = kind;
    window.pisKindClass = visit => { const k = kind(visit); return k ? `pis-kind pis-kind-${k}` : ''; };
    window.pisKindIconHtml = (visit, extra) => {
        const k = kind(visit);
        return k ? `<span class="pis-kind-icon ${extra || ''}">${ICONS[k]}</span>` : '';
    };
    window.pisShortServiceName = visit => String(visit?.service_name || visit?.service_type || 'Service')
        .replace(/^Pet Sitting\s*-\s*[^-]*?Sit\s*-\s*(\d+)\s*Hours?$/i, 'Pet Sitting · $1 hrs')
        .replace(/\s+-\s+(\d+)\s*Minutes?$/i, ' · $1 min');

    const css = `
    .pis-kind-walk{--pk:#1f63b8;--pkb:#e1edfc;--pkg:linear-gradient(135deg,#2f7fd6,#1f63b8)}
    .pis-kind-drop{--pk:#14c0dc;--pki:#0aa5c2;--pkb:#cdf5fb;--pkg:linear-gradient(135deg,#22c6e0,#0aa5c2)}
    .pis-kind-sit{--pk:#b8336a;--pkb:#fbe4ef;--pkg:linear-gradient(135deg,#d6467f,#b8336a)}
    .pis-kind-board{--pk:#c0610c;--pkb:#fdebd9;--pkg:linear-gradient(135deg,#e07a1f,#c0610c)}
    .pis-kind-meet{--pk:#6a45c2;--pkb:#ebe5fb;--pkg:linear-gradient(135deg,#8160d6,#6a45c2)}

    /* Cards */
    .upcoming-service-card.pis-kind{box-shadow:inset 6px 0 0 var(--pk),0 4px 12px rgba(24,52,71,.05) !important;padding-left:22px !important}
    .upcoming-service-card.pis-kind::before{display:none !important}
    .upcoming-service-card.pis-kind .client-visit-progress-icon{display:none !important}
    .upcoming-service-card.pis-kind .upcoming-service-card-header{display:flex !important;flex-direction:row !important;flex-wrap:nowrap !important;align-items:center !important;justify-content:space-between !important;gap:10px !important;padding-right:0 !important;text-align:left !important}
    .pis-card-head{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 auto;text-align:left}
    .pis-card-head strong{line-height:1.25}
    .upcoming-service-card.pis-kind .service-status{flex:none;white-space:nowrap}
    .pis-kind-icon{flex:none;width:42px;height:42px;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;background:var(--pkb);color:var(--pki,var(--pk))}
    .pis-kind-icon svg{width:22px;height:22px}
    .upcoming-service-card.pis-kind.upcoming-service-card-in-progress{background:#fff8e8 !important;border-color:#ecd28f !important}
    .upcoming-service-card.pis-kind.upcoming-service-card-completed{background:#f3faf4 !important;border-color:#cfe7d4 !important}
    .upcoming-service-card.pis-kind.upcoming-service-card-in-progress .service-status{background:#fbe3b8 !important;color:#8a5200 !important}
    .upcoming-service-card.pis-kind.upcoming-service-card-completed .service-status{background:#e3f3e6 !important;color:#1f7a3a !important}

    /* Report headers */
    .client-visit-report.pis-kind .client-visit-report-header{display:flex;align-items:center;gap:14px;background:var(--pkg) !important;border-bottom:0 !important}
    .client-visit-report.pis-kind .client-visit-report-header h5,
    .client-visit-report.pis-kind .client-visit-report-header p,
    .client-visit-report.pis-kind .client-visit-report-eyebrow{color:#fff !important}
    .client-visit-report.pis-kind .client-visit-report-header p{opacity:.92}
    .pis-head-icon{width:50px;height:50px;border-radius:16px;background:rgba(255,255,255,.2) !important;border:1px solid rgba(255,255,255,.35);color:#fff !important}
    .pis-head-icon svg{width:27px;height:27px}
    .client-boarding-dialog .client-boarding-dialog-header{align-items:center !important}
    .client-boarding-dialog .client-boarding-dialog-header > div{flex:1 1 auto;min-width:0}
    .client-boarding-dialog:not(.client-sit-dialog) .client-boarding-dialog-header{background:linear-gradient(135deg,#e07a1f,#c0610c) !important}
    .upcoming-service-card.pis-kind .client-sit-updates{background:#fff !important}`;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
})();
