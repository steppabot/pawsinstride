/* Paws in Stride — dog birthdays on the client dashboard.
   Load AFTER portal.js. On a pet's birthday (Texas date) this asks Supabase
   for today's birthdays (claim_my_pet_birthdays), which also adds the $10
   credit if it hasn't been added yet, then decorates the dashboard:
   bunting across the top, a birthday card and a burst of confetti.
   The credit rules live in the database, so nothing here can add credit. */
(function () {
    'use strict';

    const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const store = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
    };
    function texasToday() {
        try {
            return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
        } catch (e) {
            return new Date().toISOString().slice(0, 10);
        }
    }
    function listNames(names) {
        if (names.length < 2) return names[0] || '';
        return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    }
    const wait = ms => new Promise(r => setTimeout(r, ms));

    async function photoFor(pet) {
        try {
            if (typeof getPetDisplayUrl === 'function') return await getPetDisplayUrl({ photo_path: pet.photo_path });
        } catch (e) { /* fall back below */ }
        return './assets/default-pet-avatar.webp';
    }

    async function run() {
        if (typeof supabaseClient === 'undefined') return;
        const { data: session } = await supabaseClient.auth.getSession();
        if (!session?.session) return;

        const { data, error } = await supabaseClient.rpc('claim_my_pet_birthdays');
        if (error) {
            // Not set up yet, or offline: no celebration, nothing breaks.
            console.warn('Pet birthdays:', error.message || error);
            return;
        }
        const pets = Array.isArray(data) ? data : [];
        if (!pets.length) return;

        const today = texasToday();
        document.body.classList.add('pis-birthday-day');
        addBunting();
        if (store.get(`pis-bday-closed-${today}`) !== 'true') await addCard(pets, today);

        // Confetti once per day, after the intro video has finished.
        if (store.get(`pis-bday-confetti-${today}`) !== 'true') {
            for (let i = 0; i < 70 && document.getElementById('mobile-portal-intro'); i++) await wait(300);
            store.set(`pis-bday-confetti-${today}`, 'true');
            confetti();
        }
    }

    // A draped garland: two swags of shaded pennants (brand orange, blue
    // and cream) with soft shadows, a few paw prints and a gentle sway.
    function addBunting() {
        const header = document.querySelector('.client-dashboard-header');
        if (!header || document.querySelector('.pis-bunting, .pis-lights')) return;
        const W = 1200, SAG = 14, TOP = 6, STEP = 46;
        const palette = [
            ['#ffc56b', '#f08a24'],   // orange
            ['#5aa3f0', '#1f63b8'],   // blue
            ['#fff6e6', '#f1d7ab'],   // cream
            ['#ffb08a', '#e8643c'],   // coral
            ['#6fc1ff', '#2f7fd6']    // sky
        ];
        const defs = palette.map((c, i) =>
            `<linearGradient id="pisFlag${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>`).join('');
        const paw = '<g fill="#fff" opacity=".85"><ellipse cx="0" cy="13" rx="3.6" ry="3"/><circle cx="-3.6" cy="8.2" r="1.35"/><circle cx="-1.2" cy="6.6" r="1.35"/><circle cx="1.2" cy="6.6" r="1.35"/><circle cx="3.6" cy="8.2" r="1.35"/></g>';
        // y and slope on a swag between x0 and x1 (a gentle parabola).
        const at = (x, x0, x1) => {
            const t = (x - x0) / (x1 - x0);
            return { y: TOP + 4 * SAG * t * (1 - t), slope: 4 * SAG * (1 - 2 * t) / (x1 - x0) };
        };
        let flags = '';
        let string = '';
        let n = 0;
        for (const [x0, x1] of [[0, 400], [400, 800], [800, W]]) {
            string += `M${x0} ${TOP} Q${(x0 + x1) / 2} ${TOP + 2 * SAG} ${x1} ${TOP} `;
            for (let x = x0 + STEP / 2; x < x1 - 8; x += STEP, n++) {
                const { y, slope } = at(x, x0, x1);
                const angle = Math.atan(slope) * 180 / Math.PI;
                const color = n % palette.length;
                const delay = ((n * 37) % 100) / 100 * -4;
                flags += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})">` +
                    `<g class="pis-flag" style="animation-delay:${delay.toFixed(2)}s">` +
                    `<path d="M-15 0 Q-8 17 0 31 Q8 17 15 0 Z" fill="url(#pisFlag${color})"/>` +
                    `<path d="M-15 0 Q-8 17 0 31" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>` +
                    (n % 3 === 1 ? paw : '') + '</g></g>';
            }
        }
        const strip = document.createElement('div');
        strip.className = 'pis-bunting';
        strip.setAttribute('aria-hidden', 'true');
        strip.innerHTML = `<svg viewBox="0 0 ${W} 64" preserveAspectRatio="xMidYMin slice">
            <defs>${defs}<filter id="pisFlagShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#1f3f62" flood-opacity=".22"/></filter></defs>
            <g filter="url(#pisFlagShadow)">${flags}</g>
            <path d="${string}" fill="none" stroke="#8a6a3d" stroke-width="1.6" stroke-linecap="round"/>
        </svg>`;
        // On phones the header sits under the status bar (it handles the
        // notch / Dynamic Island itself), so the bunting goes inside it,
        // just below the status bar. On wider screens it hangs above.
        if (window.matchMedia?.('(max-width: 700px)').matches) {
            header.classList.add('pis-has-bunting');
            header.insertAdjacentElement('afterbegin', strip);
        } else {
            header.insertAdjacentElement('beforebegin', strip);
        }
    }

    async function addCard(pets, today) {
        const header = document.querySelector('.client-dashboard-header');
        if (!header || document.getElementById('pis-bday-card')) return;
        const names = pets.map(p => p.name);
        const credited = pets.filter(p => p.credited);
        const total = credited.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const notYet = pets.filter(p => !p.credited && p.reason === 'too_new');
        let balance = null;
        if (total > 0) {
            try {
                const { data: bal, error: balError } = await supabaseClient.rpc('get_my_credit_balance');
                if (!balError && bal !== null && Number.isFinite(Number(bal))) balance = Number(bal);
            } catch (e) { /* balance is a nice-to-have */ }
        }
        const money = n => `$${Number(n).toFixed(2)}`;
        let gift = '';
        const opened = store.get(`pis-bday-gift-opened-${today}`) === 'true';
        if (total > 0) {
            gift = `<div class="pis-bday-gift is-added"${opened ? '' : ' hidden'}>
                    <span class="pis-bday-gift-icon" aria-hidden="true">🎁</span>
                    <span class="pis-bday-gift-text"><strong>${total % 1 ? money(total) : '$' + total} Birthday Credit Added</strong>
                    <small>${balance !== null ? `Your balance is now ${money(balance)}.` : 'It\u2019s in your account balance.'}</small></span>
                </div>`;
            if (!opened) gift = `<button type="button" class="pis-bday-present" aria-label="Open your birthday gift">${PRESENT_SVG}
                    <span class="pis-bday-present-label">Tap to Open Your Gift</span>
                </button>` + gift;
        } else if (notYet.length) {
            gift = `<div class="pis-bday-gift is-later">
                    <span class="pis-bday-gift-icon" aria-hidden="true">🎁</span>
                    <span class="pis-bday-gift-text"><strong>Birthday Credit Starts Next Year</strong>
                    <small>Birthdays earn $10 once they\u2019ve been saved for 30 days.</small></span>
                </div>`;
        }
        const ages = pets.filter(p => Number(p.age) > 0)
            .map(p => `${esc(p.name)} turns ${Number(p.age)} today!`).join(' ');
        const photos = await Promise.all(pets.slice(0, 3).map(photoFor));

        const card = document.createElement('section');
        card.id = 'pis-bday-card';
        card.className = 'pis-bday';
        card.setAttribute('aria-label', 'Birthday');
        card.innerHTML = `
            <button type="button" class="pis-bday-close" aria-label="Close birthday message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>
            <div class="pis-bday-photos">${photos.map((src, i) => `<img src="${esc(src)}" alt="${esc(pets[i].name)}">`).join('')}<span class="pis-bday-cake" aria-hidden="true">🎂</span></div>
            <div class="pis-bday-copy">
                <span class="pis-bday-eyebrow">🎉 IT'S A BIRTHDAY!</span>
                <h3>Happy birthday, ${esc(listNames(names))}!</h3>
                ${ages ? `<p>${ages}</p>` : ''}
                ${gift}
                <button type="button" class="pis-bday-book">Book a Birthday Walk</button>
            </div>`;
        header.insertAdjacentElement('afterend', card);
        card.querySelector('.pis-bday-close').addEventListener('click', () => {
            store.set(`pis-bday-closed-${today}`, 'true');
            card.remove();
        });
        const present = card.querySelector('.pis-bday-present');
        present?.addEventListener('click', () => openPresent(card, present, today), { once: true });
        card.querySelector('.pis-bday-book').addEventListener('click', () => {
            document.getElementById('request-walk-button')?.click();
        });
    }

    // A wrapped present: orange box, blue ribbon, a bow on the lid.
    const PRESENT_SVG = `<svg class="pis-gift-svg" viewBox="0 0 120 112" aria-hidden="true">
        <defs>
            <linearGradient id="pisGiftBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffbe55"/><stop offset="1" stop-color="#f07c22"/></linearGradient>
            <linearGradient id="pisGiftLid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc766"/><stop offset="1" stop-color="#f38a2c"/></linearGradient>
            <linearGradient id="pisGiftRibbon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5aa9f3"/><stop offset="1" stop-color="#1f63b8"/></linearGradient>
        </defs>
        <ellipse cx="60" cy="107" rx="40" ry="4" fill="#1f3f62" opacity=".12"/>
        <g class="pis-gift-box">
            <rect x="18" y="52" width="84" height="52" rx="7" fill="url(#pisGiftBox)"/>
            <rect x="24" y="56" width="10" height="44" rx="5" fill="#fff" opacity=".22"/>
            <g fill="#fff" opacity=".35"><circle cx="38" cy="70" r="3"/><circle cx="84" cy="64" r="2.6"/><circle cx="80" cy="90" r="3.2"/><circle cx="42" cy="94" r="2.4"/></g>
            <rect x="53" y="52" width="14" height="52" fill="url(#pisGiftRibbon)"/>
        </g>
        <g class="pis-gift-lid">
            <rect x="12" y="38" width="96" height="17" rx="6" fill="url(#pisGiftLid)"/>
            <rect x="53" y="38" width="14" height="17" fill="url(#pisGiftRibbon)"/>
            <g fill="none" stroke="url(#pisGiftRibbon)" stroke-width="6.5" stroke-linecap="round">
                <path d="M60 37 C 48 18, 30 20, 36 31 C 40 37, 52 37, 60 37 Z"/>
                <path d="M60 37 C 72 18, 90 20, 84 31 C 80 37, 68 37, 60 37 Z"/>
            </g>
            <circle cx="60" cy="36" r="6.5" fill="#1f63b8"/>
        </g>
    </svg>`;

    // Tap: the box shakes, the lid pops off, confetti bursts out of the
    // box and the credit ticket appears. Opened once per day.
    function openPresent(card, present, today) {
        store.set(`pis-bday-gift-opened-${today}`, 'true');
        const ticket = card.querySelector('.pis-bday-gift.is-added');
        const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const reveal = () => {
            const box = present.getBoundingClientRect();
            present.remove();
            if (ticket) {
                ticket.hidden = false;
                ticket.classList.add('is-revealed');
            }
            window.PisHaptics?.success?.();
            if (!calm) confetti({ x: box.left + box.width / 2, y: box.top + box.height * 0.45 });
        };
        window.PisHaptics?.medium?.();
        if (calm) {
            reveal();
            return;
        }
        present.classList.add('is-opening');
        present.disabled = true;
        setTimeout(reveal, 1050);
    }

    function confetti(origin) {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const canvas = document.createElement('canvas');
        canvas.className = 'pis-confetti';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const size = () => { canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); };
        size();
        const colors = ['#f5ab40', '#2f7fd6', '#e95d64', '#35b86a', '#9b5de5', '#ffd166'];
        const bits = Array.from({ length: origin ? 110 : 140 }, () => ({
            x: origin ? origin.x + (Math.random() - .5) * 50 : innerWidth / 2 + (Math.random() - .5) * innerWidth * .3,
            y: origin ? origin.y : innerHeight * .25,
            vx: (Math.random() - .5) * (origin ? 11 : 9),
            vy: origin ? -Math.random() * 10 - 5 : -Math.random() * 9 - 3,
            r: Math.random() * Math.PI,
            vr: (Math.random() - .5) * .3,
            w: 6 + Math.random() * 6,
            h: 4 + Math.random() * 4,
            c: colors[(Math.random() * colors.length) | 0]
        }));
        const start = performance.now();
        (function frame(now) {
            const t = now - start;
            ctx.clearRect(0, 0, innerWidth, innerHeight);
            ctx.globalAlpha = t > 2600 ? Math.max(0, 1 - (t - 2600) / 900) : 1;
            for (const b of bits) {
                b.vy += .22; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
                ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
                ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
            }
            if (t < 3500) requestAnimationFrame(frame); else canvas.remove();
        })(start);
    }

    const style = document.createElement('style');
    style.textContent = `
        .pis-bunting{display:block;width:100%;height:56px;margin:0 0 2px;overflow:hidden;pointer-events:none}
        .pis-bunting svg{display:block;width:100%;height:64px}
        .pis-flag{transform-box:fill-box;transform-origin:50% 0;animation:pis-sway 4s ease-in-out infinite}
        @keyframes pis-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
        @media (prefers-reduced-motion:reduce){.pis-flag{animation:none}}
        .client-portal-page .pis-bday,.pis-bday{position:relative;display:flex;align-items:center;gap:18px;margin:12px 0 16px;padding:20px 60px 20px 20px;border-radius:22px;text-align:left;
            background:linear-gradient(135deg,#fff4e2 0%,#ffe2ec 55%,#e6f0ff 100%) !important;border:1px solid #f6d3a6 !important;box-shadow:0 8px 24px rgba(31,63,98,.10);color:#183447}
        .pis-bday-photos{position:relative;flex:none;display:flex}
        .pis-bday-photos img{width:76px;height:76px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.12);background:#fff}
        .pis-bday-photos img+img{margin-left:-22px}
        .pis-bday-cake{position:absolute;right:-6px;bottom:-4px;font-size:28px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.2))}
        .pis-bday-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px}
        .pis-bday-eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#c2410c}
        .pis-bday h3{margin:0;font-size:22px;line-height:1.2;font-weight:800}
        .pis-bday p{margin:0;font-size:15px;font-weight:600;line-height:1.4;color:#46617d}
        .pis-bday-gift{display:flex;align-items:center;gap:10px;margin-top:8px;padding:10px 12px;border-radius:14px;text-align:left;background:rgba(255,255,255,.78);border:1.5px dashed #9bd3ad}
        .pis-bday-gift[hidden]{display:none !important}
        .pis-bday-gift.is-later{border-color:#d7c3a6}
        .pis-bday-gift-icon{flex:none;font-size:24px;line-height:1}
        .pis-bday-gift-text{display:flex;flex-direction:column;gap:1px;min-width:0}
        .pis-bday-gift strong{font-size:15px;font-weight:800;color:#166534}
        .pis-bday-gift.is-later strong{color:#8a5a1c}
        .pis-bday-gift small{font-size:13px;font-weight:600;color:#46617d;line-height:1.35}
        .pis-bday-present{align-self:flex-start;display:flex;flex-direction:column;align-items:center;gap:4px;margin:6px 0 0;padding:4px 10px 0;border:0;background:none;color:#8a5a1c;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
        .pis-gift-svg{display:block;width:112px;height:104px;overflow:visible;transform-origin:50% 92%;animation:pis-gift-wiggle 3.4s ease-in-out 1.2s infinite}
        .pis-gift-lid{transform-box:fill-box;transform-origin:50% 100%}
        .pis-bday-present-label{font-size:14px;font-weight:800;letter-spacing:.02em;transition:opacity .2s}
        .pis-bday-present:active .pis-gift-svg{transform:scale(.95)}
        .pis-bday-present.is-opening .pis-gift-svg{animation:pis-gift-shake .26s ease-in-out 2}
        .pis-bday-present.is-opening .pis-gift-lid{animation:pis-lid-pop .55s cubic-bezier(.3,1.3,.6,1) .5s forwards}
        .pis-bday-present.is-opening .pis-bday-present-label{opacity:0}
        @keyframes pis-gift-wiggle{0%,76%,100%{transform:rotate(0)}80%{transform:rotate(-7deg)}84%{transform:rotate(7deg)}88%{transform:rotate(-5deg)}92%{transform:rotate(3deg)}}
        @keyframes pis-gift-shake{0%,100%{transform:rotate(0) scale(1)}25%{transform:rotate(-9deg) scale(1.04)}75%{transform:rotate(9deg) scale(1.04)}}
        @keyframes pis-lid-pop{to{transform:translate(22px,-58px) rotate(28deg);opacity:0}}
        .pis-bday-gift.is-revealed{animation:pis-gift-reveal .5s cubic-bezier(.2,1.35,.5,1)}
        @keyframes pis-gift-reveal{from{transform:scale(.55);opacity:0}to{transform:none;opacity:1}}
        @media (prefers-reduced-motion:reduce){.pis-gift-svg,.pis-bday-present.is-opening .pis-gift-svg,.pis-bday-present.is-opening .pis-gift-lid,.pis-bday-gift.is-revealed{animation:none}}
        .pis-bday-book{align-self:flex-start;margin-top:10px;padding:11px 18px;border:0;border-radius:12px;background:#f5ab40;color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(245,171,64,.35)}
        .client-portal-page .pis-bday .pis-bday-close,.pis-bday-close{position:absolute;top:12px;right:12px;z-index:1;display:grid;place-items:center;width:38px;height:38px;margin:0;padding:0;border:1px solid rgba(24,52,71,.14);border-radius:50%;background:#fff;color:#46617d;box-shadow:0 2px 8px rgba(31,63,98,.14);cursor:pointer;-webkit-tap-highlight-color:transparent}
        .pis-bday-close svg{display:block;width:16px;height:16px}
        .pis-bday-close:active{transform:scale(.92)}
        @media (max-width:520px){
            .client-portal-page .pis-bday,.pis-bday{flex-direction:column;align-items:center;text-align:center;gap:14px;padding:26px 18px 20px}
            .pis-bday-copy{width:100%;align-items:center}
            .pis-bday h3{font-size:22px}
            .pis-bday-present{align-self:center}
            .pis-bday-gift{align-self:stretch;flex-direction:column;justify-content:center;gap:4px;padding:12px 14px;text-align:center}
            .pis-bday-gift-icon{font-size:22px}
            .pis-bday-gift-text{align-items:center}
            .pis-bday-book{align-self:stretch;margin-top:12px;padding:13px 18px}
        }
        @media (max-width:700px){
            .client-portal-page .client-dashboard-header.pis-has-bunting{padding-top:calc(max(10px, env(safe-area-inset-top, 0px)) + 40px) !important}
            .client-dashboard-header>.pis-bunting{position:absolute;left:0;right:0;top:env(safe-area-inset-top, 0px);height:42px;margin:0;z-index:0}
            .client-dashboard-header>.pis-bunting svg{height:58px}
        }
        .pis-confetti{position:fixed;inset:0;width:100vw;height:100vh;z-index:100000;pointer-events:none}`;
    document.head.appendChild(style);

    // Start after portal.js has had a moment to sign in.
    const start = () => setTimeout(() => { void run().catch(e => console.warn('Pet birthdays:', e)); }, 800);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
