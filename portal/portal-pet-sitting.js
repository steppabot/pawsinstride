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
