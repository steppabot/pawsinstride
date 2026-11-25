/* ========================================
   PAWS IN STRIDE: FORM ERRORS (all portal pages)
   ========================================
   Shows what's wrong right at the box that's wrong:
   red outline + a short message under it, scrolls to the first one,
   and clears as soon as the person starts fixing it.

   Three ways a box gets marked:
   1. The browser's own checks (required, email format, min length…):
      its little pop-up bubble is replaced with our message.
   2. Older page code that marks a box with aria-invalid="true" and puts
      its message somewhere else (sign-up banner, booking message…):
      the message is moved under the box.
   3. New code calls window.PisFormErrors.show(box, "message").
   ======================================== */
(function () {
    'use strict';
    if (window.PisFormErrors) return;

    const BAD = 'pis-field-invalid';
    const NOTE = 'pis-field-note';
    // Where pages put their error text today (moved under the box when a box is marked)
    const MESSAGE_BOXES = '#signup-error, #booking-message, #household-form-message, #pet-form-message, '
        + '#change-password-message, #login-message, #forgot-password-message, #reset-password-message, '
        + '#join-team-message, [data-team-form-error], #admin-profile-message, #admin-client-credit-message, '
        + '.admin-pricing-v2-message, #admin-visit-confirm-message, #client-cancellation-message, #review-credit-message, '
        + '#delete-account-message, #payment-message, #venmo-message, #admin-message-error, #client-message-error, '
        + '.poi-error, .boarding-editor-message, [data-client-boarding-walk-message], [data-client-boarding-feed-message], '
        + '.pis-team-error, [data-sit-feed-message], .booking-success-error';
    // status lines that only get colored by what they say (never moved under a box)
    const STATUS_LINES = '#repeat-last-week-booking-message, #push-notification-status, #delete-account-blocked, [data-pis-status], '
        + '#admin-push-modal-status, #admin-push-notification-status, #admin-client-credit-status, #admin-client-legacy-discount-status, '
        + '#admin-client-minimum-waiver-status, #admin-financial-hourly-detail, .pis-assign-msg, .admin-visit-report-error, .boarding-walk-message';
    const TONE_BOXES = MESSAGE_BOXES + ', ' + STATUS_LINES;
    // status lines the app writes on its own (when a screen opens or refreshes, not because a button beside them was tapped):
    // they get the colour, but the page is never scrolled to them
    const PASSIVE_LINES = '#admin-financial-hourly-detail, #admin-push-notification-status, #push-notification-status';
    const CONTROL = 'input, select, textarea';
    let seq = 0;
    let firstShownAt = 0;         // only the first error in a burst scrolls the page

    const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isControl = el => el?.matches?.(CONTROL);
    const visible = el => !!el && !!(el.offsetParent || el.getClientRects().length);

    function cleanText(node) {
        const copy = node.cloneNode(true);
        copy.querySelectorAll(CONTROL + ', .pis-field-note, button, small, [class*="help"], [class*="hint"]').forEach(n => n.remove());
        return copy.textContent;
    }
    function labelText(field) {
        let text = '';
        const label = field.labels?.[0];
        if (label) text = cleanText(label);
        if (!text.trim()) {
            // no <label for>: use the heading of the box's own field group
            const group = field.closest('[class*="field"], [class*="form-group"], [class*="input-group"]');
            const heading = group && group.querySelector('label, legend, [class*="label"], span:first-child');
            if (heading && !heading.contains(field)) text = cleanText(heading);
        }
        text = text.trim() || field.getAttribute('aria-label') || String(field.name || '').replace(/\d+/g, ' ').replace(/[_-]+/g, ' ');
        text = text.replace(/[*:]/g, '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 40 ? '' : text;
    }
    // boxes in a pet form are about the pet, not the person
    const isPetBox = field => /pet/i.test(field.id + ' ' + field.name) || !!field.closest('[id*="pet" i]:not(body), [class*="pet-card" i], [class*="pet-form" i]');

    // The browser's reasons, in plain words
    function friendlyMessage(field) {
        const v = field.validity || {};
        if (field.dataset?.requiredMessage && v.valueMissing) return field.dataset.requiredMessage;
        let label = labelText(field).toLowerCase();
        const pet = isPetBox(field);
        if (pet) label = label.replace(/^(your |the )?pet('s)?\s*/, '').trim();
        const whose = pet ? "your pet's" : 'your';
        const article = /^[aeiou]/.test(label) ? 'an' : 'a';
        if (v.valueMissing) {
            if (field.type === 'checkbox') return 'Check this box to continue.';
            if (field.type === 'radio') return 'Choose one to continue.';
            if (field.tagName === 'SELECT') return label ? `Choose ${article} ${label}.` : 'Choose one to continue.';
            if (field.type === 'email') return 'Enter your email address.';
            if (field.type === 'password') return /confirm|again/.test(label) ? 'Type your password again.' : 'Enter your password.';
            if (field.type === 'tel') return 'Enter your phone number.';
            if (field.type === 'date') return label ? `Pick ${pet ? whose : article} ${label}.` : 'Pick a date.';
            if (/zip/.test(label)) return 'Enter your 5-digit ZIP code.';
            if (/^(full )?name$/.test(label) && !pet) return 'Enter your first and last name.';
            return label ? `Enter ${whose} ${label}.` : 'Fill this in to continue.';
        }
        if (v.typeMismatch && field.type === 'email') return 'Enter a full email address, like name@example.com.';
        if (v.typeMismatch) return 'Check this — it doesn’t look right.';
        if (v.tooShort) return `Use at least ${field.minLength} characters.`;
        if (v.tooLong) return `Use ${field.maxLength} characters or fewer.`;
        if (v.patternMismatch) return field.title || 'Check the format of this.';
        if ((v.rangeUnderflow || v.rangeOverflow) && field.dataset.rangeMessage) return field.dataset.rangeMessage;
        if (field.type === 'date' && (v.rangeUnderflow || v.rangeOverflow)) {
            const day = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return v.rangeUnderflow ? `Choose ${day(field.min)} or later.` : `Choose ${day(field.max)} or earlier.`;
        }
        if (v.rangeUnderflow) return `Enter ${field.min} or more.`;
        if (v.rangeOverflow) return `Enter ${field.max} or less.`;
        if (v.stepMismatch || v.badInput) return 'Check this — it doesn’t look right.';
        return field.validationMessage || 'Check this to continue.';
    }

    // The box to outline: the field itself, or its group for radio/check cards and hidden inputs
    function anchorFor(el) {
        if (!isControl(el)) return el;
        const group = el.closest('fieldset, [role="radiogroup"], [class*="-options"], [class*="choice-group"], [class*="choices"]');
        if ((el.type === 'radio' || el.type === 'checkbox') && group) return group;
        if (!visible(el)) {
            let up = el.parentElement;
            while (up && !visible(up)) up = up.parentElement;
            return up || el;
        }
        return el;
    }

    // Where the note goes: under the box (after a password show/hide wrapper if there is one)
    function placeNote(anchor, note) {
        if (!isControl(anchor) && anchor.getBoundingClientRect().height > 220) {
            anchor.insertAdjacentElement('beforebegin', note);   // big areas (calendars): message above
            note.style.marginBottom = '14px';                     // clear of the red outline
            return;
        }
        let after = anchor;
        const parent = anchor.parentElement;
        if (parent && isControl(anchor) && /wrap|group|inner|row/i.test(parent.className || '')
            && !parent.matches('form, fieldset, label') && parent.querySelectorAll(CONTROL).length === 1) {
            after = parent;
        }
        after.insertAdjacentElement('afterend', note);
        // boxes with a big gap below them: tuck the message up under the box, keep the gap after it
        const gap = parseFloat(getComputedStyle(after).marginBottom) || 0;
        if (gap > 10) {
            note.style.marginTop = `${8 - gap}px`;
            note.style.marginBottom = `${gap}px`;
        }
    }

    function setInvalid(field, on) {
        if (!field?.setAttribute) return;
        if (on) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
    }

    function noteOf(anchor) {
        const id = anchor.dataset?.pisNote;
        return id ? document.getElementById(id) : null;
    }

    function show(field, message, options = {}) {
        if (!field) return null;
        const anchor = anchorFor(field);
        const text = String(message || (isControl(field) ? friendlyMessage(field) : '') || 'Check this to continue.').trim();
        anchor.classList.add(BAD);
        if (anchor !== field) field.classList?.add(BAD);
        if (isControl(field)) setInvalid(field, true);

        let note = noteOf(anchor);
        if (!note) {
            note = document.createElement('p');
            note.className = NOTE;
            note.id = `pis-note-${++seq}`;
            note.setAttribute('role', 'alert');
            anchor.dataset.pisNote = note.id;
            placeNote(anchor, note);
        }
        note.textContent = text;
        if (isControl(field)) {
            const described = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
            if (!described.includes(note.id)) field.setAttribute('aria-describedby', [...described, note.id].join(' '));
        }

        const now = Date.now();
        const first = now - firstShownAt > 400;
        if (first) firstShownAt = now;
        if (options.scroll !== false && first) {
            requestAnimationFrame(() => {
                const target = note.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING ? note : anchor;
                target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
                if (options.focus !== false && isControl(field) && visible(field) && field.type !== 'radio' && field.type !== 'checkbox') {
                    try { field.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
                }
            });
        }
        return note;
    }

    function clear(field) {
        if (!field) return;
        const anchor = anchorFor(field);
        [anchor, field].forEach(el => el?.classList?.remove(BAD));
        // radio/check groups: clear every input in the group
        if (anchor !== field) anchor.querySelectorAll?.('.' + BAD + ', [aria-invalid="true"]').forEach(el => { el.classList.remove(BAD); setInvalid(el, false); });
        if (isControl(field)) setInvalid(field, false);
        const note = noteOf(anchor);
        if (note) {
            note.remove();
            delete anchor.dataset.pisNote;
            if (isControl(field)) {
                const rest = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== note.id);
                if (rest.length) field.setAttribute('aria-describedby', rest.join(' ')); else field.removeAttribute('aria-describedby');
            }
        }
    }

    function clearAll(root = document) {
        root.querySelectorAll('.' + BAD).forEach(el => clear(el));
        root.querySelectorAll('.' + NOTE).forEach(n => n.remove());
    }

    // Take the text out of the page's own message box and show it at the box instead
    function moveMessage(field) {
        const scope = field.closest('form, section, dialog, main') || document;
        const box = [...scope.querySelectorAll(MESSAGE_BOXES)].find(el => el.textContent.trim())
            || [...document.querySelectorAll(MESSAGE_BOXES)].find(el => el.textContent.trim() && visible(el));
        const text = box ? box.textContent.trim() : '';
        if (box) {
            box.textContent = '';
            if (box.matches('.signup-message, [data-team-form-error]')) box.hidden = true;
        }
        return text;
    }

    /* ---------- whole-form messages (no single box to point at) ----------
       Every page's message spot gets the same look:
       problem → red box with "!", working → plain grey, done → green with a check. */
    const PROGRESS = /(\.\.\.|…)\s*$/;
    const SUCCESS = /✓|successfully|has been created|has been (sent|saved|updated)|\bsaved\b|\bsent\b|you're all set|is booked|we've sent|link has been sent|updated\.?$|\brepeated\b|will be included|are enabled|is enabled|\bresumed\b/i;
    const PROBLEM = /couldn['’]t|could not|can['’]t|cannot|unable|not |invalid|expired|must|please|unavailable|failed|error|match|offline|larger than|required|enter |choose |select |pick |too many|missing|try again|no longer|but no |violat|denied|permission|not allowed|exceed|limit|already|wrong|incorrect|problem|sorry|require|blocked/i;
    function toneOf(text) {
        if (!text) return '';
        if (PROGRESS.test(text)) return 'progress';
        if (SUCCESS.test(text) && !/couldn['’]t|could not|not |failed|error/i.test(text)) return 'success';
        if (PROBLEM.test(text)) return 'error';
        return 'info';
    }
    function setTone(el, tone) {
        // pages can say exactly what kind of message it is (data-pis-tone-fixed); otherwise go by the words
        const text = el.textContent.trim();
        let t = tone ?? (text ? (el.dataset.pisToneFixed || toneOf(text)) : '');
        // a box that only ever shows problems (#signup-error, .poi-error...) is an error even if the words don't say so
        if (t === 'info' && !el.matches(STATUS_LINES) && /(^|[-_\s])error(\s|$)/i.test(`${el.id} ${el.className}`)) t = 'error';
        // everyday status lines keep their normal look; only problems (red) and confirmations (green) change it
        if ((t === 'info' || t === 'progress') && !tone && !el.dataset.pisToneFixed && el.matches(STATUS_LINES)) t = '';
        if (t) el.dataset.pisTone = t; else delete el.dataset.pisTone;
        if (t === 'error') {
            el.setAttribute('role', 'alert');
            // keep it in view when it appears (it sits by the button they just tapped)
            const r = el.getBoundingClientRect();
            if (r.height && !el.matches(PASSIVE_LINES) && (r.bottom > innerHeight - 70 || r.top < 0)) {
                el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
            }
        }
    }
    /* ---------- one sentence per line when a message wraps ----------
       Messages, status lines, hints and notices written by the app often hold two sentences.
       When both don't fit on one line, the second used to start mid-line and spill onto the next.
       Each sentence is now its own block: it stays beside the first if there's room, otherwise it
       starts on a new line. Only plain app text is touched (never notes or messages people typed),
       and the words themselves don't change (textContent reads the same). */
    const HINT_BOXES = ['help', 'hint', 'empty', 'intro', 'muted', 'subtitle', 'problem', 'lead'].map(end => `[class$="-${end}"], [class*="-${end} "]`).join(', ')
        + ', small, [data-pis-tone], [role="status"], [role="alert"], .pis-field-note, .pis-notice p, #pis-confirm-message, .client-cancellation-note, '
        + '.admin-pricing-v2-note, .pis-team-note, .pis-team-confirm > p, .pis-photo-viewer-note, .pis-xmas-retry, .pis-client-delete-text, .psb-note, .remove-pet-note, '
        + '.admin-visit-progress-copy > p, .admin-visit-progress-copy > span, .pis-live-meta, .admin-boarding-walk-panel > p, .admin-calendar-section-heading p, '
        + '.boarding-policy p, .pis-delete-account-body p, .client-cancellation-policy p, .payment-security-note p, .booking-success-note p, .signup-pet-note p, '
        + '.reset-password-success p, .review-strip-copy > strong, .review-strip-copy > span, .pfin-note, [data-boarding-history], [data-pis-lines]';
    const LINE_BOXES = TONE_BOXES + ', ' + HINT_BOXES;
    // a period after one of these is not the end of a sentence ("Dr. Smith", "Country Blvd. Frisco", "J. Smith", "5 p.m. Friday")
    const NOT_AN_END = /(?:^|[\s(“"])(?:[A-Z]|Mr|Mrs|Ms|Dr|Jr|Sr|St|Ave|Blvd|Rd|Ln|Ct|Hwy|Apt|Ste|vs|etc|approx|est|ext|Inc|Co|Ltd|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|a\.m|p\.m|e\.g|i\.e|U\.S)\.$/;
    function sentences(text) {
        const value = String(text ?? '').replace(/\s+/g, ' ').trim();
        const parts = [];
        const ends = /[.!?…✓]+["'”’)\]]*\s+(?=["'“‘(\[]?[A-Z0-9$])/g;
        let start = 0;
        let m;
        while ((m = ends.exec(value))) {
            const end = m.index + m[0].length;
            const head = value.slice(start, end).trimEnd();
            const bare = head.replace(/["'”’)\]]+$/, '');
            if (!/[A-Za-z]/.test(head)) continue;                                            // a leading "✓" or "1." is not a sentence by itself
            if (/\.$/.test(bare) && !/\.\.$/.test(bare) && NOT_AN_END.test(bare)) continue;
            if (/(?:\bNo|\d)\.$/.test(bare) && /^\d/.test(value.slice(end))) continue;      // "No. 5", "1. 2."
            parts.push(head);
            start = end;
        }
        const tail = value.slice(start).trim();
        if (tail) parts.push(tail);
        return parts;
    }
    function tidyLines(el) {
        if (!el || el.nodeType !== 1 || !el.firstChild) return;
        const kids = el.childNodes;
        for (let i = 0; i < kids.length; i++) if (kids[i].nodeType !== 3) return;       // plain text only (ours is already wrapped)
        const raw = el.textContent;
        if (raw.length < 12) return;
        const parts = sentences(raw);
        if (parts.length < 2) return;
        const look = getComputedStyle(el);
        if (/\n/.test(raw.trim()) && /^pre/.test(look.whiteSpace)) return;                    // lines someone laid out by hand stay as written
        if (look.whiteSpace === 'nowrap' || (look.webkitLineClamp && look.webkitLineClamp !== 'none')) return;   // one-line labels that end in "…" stay as they are
        const wrap = document.createElement('span');
        wrap.className = 'pis-lines';
        parts.forEach((part, index) => {
            if (index) wrap.appendChild(document.createTextNode(' '));
            const line = document.createElement('span');
            line.className = part.length > 90 ? 'pis-line is-long' : 'pis-line';
            line.textContent = part;
            wrap.appendChild(line);
        });
        el.replaceChildren(wrap);
    }

    const toneWatcher = new MutationObserver(records => {
        const seen = new Set();
        const visit = box => {
            if (!box || seen.has(box)) return;
            seen.add(box);
            if (box.matches(TONE_BOXES)) setTone(box);
            try { tidyLines(box); } catch { /* the message still shows, just unsplit */ }
        };
        for (const r of records) {
            // our own tidy-up (text swapped for the same words in lines) is not a new message
            if (r.type === 'childList' && r.addedNodes.length === 1 && r.addedNodes[0].nodeType === 1 && r.addedNodes[0].classList.contains('pis-lines')) continue;
            const el = r.target.nodeType === 3 ? r.target.parentElement : r.target;
            if (el?.closest?.('.pis-lines')) continue;
            visit(el?.closest?.(LINE_BOXES));
            // a whole sheet or card added at once (its message already filled in)
            for (const node of r.addedNodes || []) {
                if (node.nodeType !== 1) continue;
                if (node.matches(LINE_BOXES)) visit(node);
                node.querySelectorAll(LINE_BOXES).forEach(visit);
            }
        }
    });
    toneWatcher.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
    // text that's already on the page when it loads
    const tidyPage = () => document.querySelectorAll(LINE_BOXES).forEach(box => { try { tidyLines(box); } catch { /* ignore */ } });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tidyPage, { once: true });
    else tidyPage();

    /* ---------- in-app messages (instead of the phone's grey pop-up) ---------- */
    let noticeWrap = null;
    function notice(text, type = 'error', options = {}) {
        const message = String(text ?? '').trim();
        if (!message) return null;
        if (!noticeWrap || !noticeWrap.isConnected) {
            noticeWrap = document.createElement('div');
            noticeWrap.className = 'pis-notice-wrap';
            noticeWrap.setAttribute('aria-live', 'assertive');
            (document.body || document.documentElement).appendChild(noticeWrap);
        }
        // the open dialog (if any) is on top of the page: show the message inside it so it's visible
        const top = [...document.querySelectorAll('dialog[open]')].pop();
        if (top && noticeWrap.parentElement !== top) top.appendChild(noticeWrap);
        else if (!top && noticeWrap.parentElement !== document.body) document.body.appendChild(noticeWrap);
        const card = document.createElement('div');
        card.className = 'pis-notice';
        card.dataset.pisTone = type === 'success' ? 'success' : type === 'info' ? 'info' : 'error';
        card.setAttribute('role', type === 'error' ? 'alert' : 'status');
        card.innerHTML = '<p></p><button type="button" aria-label="Dismiss">×</button>';
        card.querySelector('p').textContent = message;
        const close = () => { card.classList.add('is-leaving'); setTimeout(() => card.remove(), 200); };
        card.querySelector('button').addEventListener('click', close);
        noticeWrap.appendChild(card);
        const ms = options.duration ?? (type === 'error' ? 8000 : 4500);
        if (ms > 0) setTimeout(close, ms + Math.min(6000, message.length * 25));
        return card;
    }
    window.pisNotice = notice;

    // ---------- yes/no questions in a Paws in Stride sheet (instead of the phone's grey box) ----------
    // pisConfirm({ title, message, details, confirmText, cancelText }) -> Promise<boolean>
    // Uses the same sheet as the client Log Out question (portal.css).
    function confirmSheet({ title, message = '', details = '', confirmText = 'OK', cancelText = 'Cancel' } = {}) {
        document.getElementById('pis-confirm-sheet')?.remove();
        const previousFocus = document.activeElement;
        const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const overlay = document.createElement('div');
        overlay.id = 'pis-confirm-sheet';
        overlay.className = 'client-cancellation-modal client-logout-modal';
        overlay.innerHTML = `
            <div class="client-cancellation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="pis-confirm-title" aria-describedby="pis-confirm-message">
                <div class="client-cancellation-header">
                    <div>
                        <span class="client-cancellation-eyebrow" style="color:#1f7bc2">Paws in Stride</span>
                        <h3 id="pis-confirm-title">${esc(title)}</h3>
                    </div>
                    <button type="button" class="client-cancellation-close" data-pis-confirm-no aria-label="Close">×</button>
                </div>
                ${details ? `<div class="client-cancellation-service"><strong>${esc(details)}</strong></div>` : ''}
                <p id="pis-confirm-message" class="client-cancellation-note">${esc(message)}</p>
                <div class="client-cancellation-actions">
                    <button type="button" class="secondary-button" data-pis-confirm-no>${esc(cancelText)}</button>
                    <button type="button" class="client-cancellation-confirm" data-pis-confirm-yes>${esc(confirmText)}</button>
                </div>
            </div>`;
        return new Promise(resolve => {
            let answered = false;
            function answer(yes) {
                if (answered) return;
                answered = true;
                document.removeEventListener('keydown', onKey, true);
                overlay.remove();
                if (previousFocus?.isConnected) { try { previousFocus.focus({ preventScroll: true }); } catch { /* ignore */ } }
                resolve(yes);
            }
            function onKey(event) {
                if (event.key === 'Escape') { event.preventDefault(); answer(false); }
            }
            overlay.addEventListener('click', event => {
                if (event.target === overlay || event.target.closest('[data-pis-confirm-no]')) answer(false);
                else if (event.target.closest('[data-pis-confirm-yes]')) answer(true);
            });
            document.addEventListener('keydown', onKey, true);
            (document.querySelector('dialog[open]') || document.body).appendChild(overlay);
            overlay.querySelector('.secondary-button')?.focus({ preventScroll: true });
        });
    }
    window.pisConfirm = confirmSheet;

    window.PisFormErrors = {
        notice,
        tone: setTone,
        sentences, tidyLines,
        show, clear, clearAll,
        // mark a box using the message the page already wrote in its usual place
        fromPageMessage(field, options) { return show(field, moveMessage(field), options); },
        // the server's own words only when they read like a sentence meant for people; otherwise our fallback
        serverText(error, fallback) {
            const raw = String((error && error.message) || error || '').trim();
            const readable = /^[A-Z][^_"{}<>]{8,200}[.!?]$/.test(raw) &&
                !/violates|constraint|null value|syntax|column|relation|function|jwt|token|schema|duplicate key|uuid|fetch|PGRST|SQLSTATE/i.test(raw);
            return readable ? raw : fallback;
        }
    };

    /* ---------- 1. replace the browser's bubbles ---------- */
    document.addEventListener('invalid', event => {
        const field = event.target;
        if (!isControl(field)) return;
        event.preventDefault();
        show(field, friendlyMessage(field));
    }, true);

    /* ---------- 2. older code marking boxes with aria-invalid ---------- */
    const watcher = new MutationObserver(records => {
        const marked = new Set();
        const cleared = new Set();
        for (const r of records) {
            const el = r.target;
            if (!isControl(el)) continue;
            (el.getAttribute('aria-invalid') === 'true' ? marked : cleared).add(el);
        }
        cleared.forEach(el => { if (!marked.has(el) && (el.classList.contains(BAD) || noteOf(anchorFor(el)))) clear(el); });
        if (!marked.size) return;
        const list = [...marked];
        const text = moveMessage(list[0]);
        if (!text && list.every(el => el.classList.contains(BAD))) return;   // our own marks, nothing new
        // first box gets the message; any others are outlined too
        show(list[0], text || null);
        list.slice(1).forEach(el => { el.classList.add(BAD); anchorFor(el).classList.add(BAD); });
    });
    watcher.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['aria-invalid'] });

    /* ---------- 3. clear as soon as they fix it ---------- */
    const fixing = event => {
        const el = event.target;
        if (!isControl(el)) return;
        const anchor = anchorFor(el);
        if (el.classList.contains(BAD) || anchor.classList.contains(BAD)) clear(el);
    };
    document.addEventListener('input', fixing, true);
    document.addEventListener('change', fixing, true);
    // outlined areas that aren't text boxes (calendars, choice cards): tapping inside clears them
    document.addEventListener('click', event => {
        const area = event.target.closest?.('.' + BAD);
        if (area && !isControl(area)) clear(area);
    }, true);
    // sending the form again starts fresh (the page re-checks and re-marks anything still wrong)
    document.addEventListener('submit', event => {
        if (event.target?.matches?.('form')) clearAll(event.target);
    }, true);

    /* ---------- styles ---------- */
    const style = document.createElement('style');
    style.textContent = `
        :root input.pis-field-invalid.pis-field-invalid, :root select.pis-field-invalid.pis-field-invalid, :root textarea.pis-field-invalid.pis-field-invalid {
            border-color: #d94f4f !important;
            background-color: #fffafa !important;
            box-shadow: 0 0 0 3px rgba(217, 79, 79, .14) !important;
        }
        :root input.pis-field-invalid.pis-field-invalid:focus, :root select.pis-field-invalid.pis-field-invalid:focus, :root textarea.pis-field-invalid.pis-field-invalid:focus {
            border-color: #d94f4f !important;
            box-shadow: 0 0 0 3px rgba(217, 79, 79, .22) !important;
        }
        .pis-field-invalid:not(input):not(select):not(textarea) {
            outline: 2px solid #d94f4f !important;
            outline-offset: 4px;
            border-radius: 14px;
        }
        .pis-field-note {
            display: flex;
            align-items: flex-start;
            gap: 7px;
            margin: 8px 2px 2px;
            color: #c0392b;
            font-size: 14px;
            font-weight: 600;
            line-height: 1.4;
            text-align: left;
            animation: pis-field-note-in .18s ease-out;
        }
        .pis-field-note::before {
            content: "!";
            flex: 0 0 18px;
            width: 18px;
            height: 18px;
            margin-top: 0;
            border-radius: 50%;
            background: #d94f4f;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            line-height: 18px;
            text-align: center;
        }
        [data-pis-tone]:empty, [data-pis-tone][hidden], [data-pis-tone][style*="display: none"], [data-pis-tone][style*="display:none"] { display: none !important; }
        [data-pis-tone="error"], [data-pis-tone="success"] {
            display: flex !important;
            align-items: flex-start;
            gap: 9px;
            padding: 12px 14px !important;
            border-radius: 12px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            line-height: 1.45 !important;
            text-align: left !important;
            box-shadow: none !important;
        }
        [data-pis-tone="error"] { color: #b23a2b !important; background: #fff6f4 !important; border: 1px solid #f0c7bf !important; }
        [data-pis-tone="success"] { color: #23784a !important; background: #edf8f1 !important; border: 1px solid #c6e8d3 !important; }
        [data-pis-tone="error"]::before, [data-pis-tone="success"]::before {
            flex: 0 0 18px; width: 18px; height: 18px; margin-top: 1px; border-radius: 50%;
            color: #fff; font-size: 12px; font-weight: 800; line-height: 18px; text-align: center;
        }
        [data-pis-tone="error"]::before { content: "!"; background: #d94f4f; }
        [data-pis-tone="success"]::before { content: "✓"; background: #2f9a5b; }
        [data-pis-tone="progress"], [data-pis-tone="info"] { color: #5d6e7e !important; }
        .pis-notice-wrap {
            position: fixed; z-index: 2147483000; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 12px);
            transform: translateX(-50%); width: min(460px, calc(100vw - 24px));
            display: grid; gap: 8px; pointer-events: none;
        }
        .pis-notice {
            pointer-events: auto; display: flex; align-items: flex-start; gap: 10px;
            padding: 13px 12px 13px 14px; border-radius: 14px; box-shadow: 0 12px 34px rgba(16, 46, 75, .22);
            font-size: 14.5px; font-weight: 600; line-height: 1.45; animation: pis-notice-in .22s ease-out;
        }
        .pis-notice[data-pis-tone] { border: 1px solid transparent; }
        .pis-notice::before { flex: 0 0 20px; width: 20px; height: 20px; border-radius: 50%; color: #fff; font-size: 13px; font-weight: 800; line-height: 20px; text-align: center; margin-top: 1px; }
        .pis-notice[data-pis-tone="error"] { background: #fff6f4; color: #b23a2b; border-color: #f0c7bf; }
        .pis-notice[data-pis-tone="error"]::before { content: "!"; background: #d94f4f; }
        .pis-notice[data-pis-tone="success"] { background: #edf8f1; color: #23784a; border-color: #c6e8d3; }
        .pis-notice[data-pis-tone="success"]::before { content: "✓"; background: #2f9a5b; }
        .pis-notice[data-pis-tone="info"] { background: #f4f8fc; color: #33506d; border-color: #d7e7f5; }
        .pis-notice[data-pis-tone="info"]::before { content: "i"; background: #2f7fc1; }
        .pis-notice p { flex: 1 1 auto; margin: 0; white-space: pre-line; }
        .pis-lines { min-width: 0; }
        .pis-line { display: inline-block; max-width: 100%; text-wrap: balance; }
        .pis-line.is-long { text-wrap: pretty; }
        .pis-notice button { appearance: none; -webkit-appearance: none; flex: 0 0 28px; width: 28px; height: 28px; margin: -4px -2px -4px 0; padding: 0; border: 0; border-radius: 8px; background: transparent; color: inherit; font: inherit; font-size: 22px; line-height: 1; cursor: pointer; opacity: .7; }
        .pis-notice.is-leaving { opacity: 0; transform: translateY(-6px); transition: opacity .2s, transform .2s; }
        @keyframes pis-notice-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        @keyframes pis-field-note-in { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .pis-field-note { animation: none; } }
    `;
    (document.head || document.documentElement).appendChild(style);
})();
