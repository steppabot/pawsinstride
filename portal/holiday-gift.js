/* Paws in Stride: Christmas present on the client dashboard.
   Load AFTER portal.js. From Dec 25 to 31 (Texas date) the database says
   whether this client has a present (get_my_christmas_gift). Opening it
   (open_my_christmas_gift) adds the credit, once; the rules live in the
   database, so nothing here can add credit by itself.
   The card: "Merry Christmas from Paws in Stride!", a wrapped red present,
   soft falling snow, and twinkling lights across the top. */
(function () {
    'use strict';

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
    const money = n => `$${Number(n).toFixed(2)}`;
    const short = n => (Number(n) % 1 ? money(n) : `$${Number(n)}`);
    const calm = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const wait = ms => new Promise(r => setTimeout(r, ms));

    async function run() {
        if (typeof supabaseClient === 'undefined') return;
        const { data: session } = await supabaseClient.auth.getSession();
        if (!session?.session) return;

        const { data, error } = await supabaseClient.rpc('get_my_christmas_gift');
        if (error) {
            // Not set up yet, or offline: no Christmas card, nothing breaks.
            console.warn('Christmas gift:', error.message || error);
            return;
        }
        const status = data?.status;
        if (!status || status === 'not_season' || status === 'staff') return;

        const today = texasToday();
        addLights();
        if (status !== 'available' && store.get(`pis-xmas-closed-${today}`) === 'true') return;
        await addCard(data, today);
    }

    // ---------- twinkling lights across the top ----------
    function addLights() {
        const header = document.querySelector('.client-dashboard-header');
        if (!header || document.querySelector('.pis-bunting, .pis-lights')) return;
        const W = 1200, TOP = 4, SAG = 12, STEP = 40;
        const colors = ['#ff4d4d', '#2ecc71', '#ffd166', '#4da3ff', '#ff8fd0'];
        const at = (x, x0, x1) => {
            const t = (x - x0) / (x1 - x0);
            return { y: TOP + 4 * SAG * t * (1 - t), slope: 4 * SAG * (1 - 2 * t) / (x1 - x0) };
        };
        let wire = '';
        let bulbs = '';
        let n = 0;
        for (const [x0, x1] of [[0, 300], [300, 600], [600, 900], [900, W]]) {
            wire += `M${x0} ${TOP} Q${(x0 + x1) / 2} ${TOP + 2 * SAG} ${x1} ${TOP} `;
            for (let x = x0 + STEP / 2; x < x1 - 6; x += STEP, n++) {
                const { y, slope } = at(x, x0, x1);
                const angle = Math.atan(slope) * 180 / Math.PI;
                const c = colors[n % colors.length];
                const delay = ((n * 53) % 100) / 100 * -2.4;
                bulbs += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})">` +
                    `<rect x="-3.2" y="0" width="6.4" height="6" rx="1.4" fill="#4b5a66"/>` +
                    `<ellipse class="pis-bulb" cx="0" cy="13.5" rx="5.6" ry="8.4" fill="${c}" style="--glow:${c};animation-delay:${delay.toFixed(2)}s"/>` +
                    `<ellipse cx="-1.8" cy="10.5" rx="1.5" ry="2.6" fill="#fff" opacity=".55"/></g>`;
            }
        }
        const strip = document.createElement('div');
        strip.className = 'pis-lights';
        strip.setAttribute('aria-hidden', 'true');
        strip.innerHTML = `<svg viewBox="0 0 ${W} 48" preserveAspectRatio="xMidYMin slice">
            <path d="${wire}" fill="none" stroke="#2f4a3a" stroke-width="2" stroke-linecap="round"/>${bulbs}</svg>`;
        if (window.matchMedia?.('(max-width: 700px)').matches) {
            header.classList.add('pis-has-lights');
            header.insertAdjacentElement('afterbegin', strip);
        } else {
            header.insertAdjacentElement('beforebegin', strip);
        }
    }

    // ---------- the present ----------
    const PRESENT_SVG = `<svg class="pis-xgift-svg" viewBox="0 0 120 112" aria-hidden="true">
        <defs>
            <linearGradient id="pisXBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5f63"/><stop offset="1" stop-color="#c41d33"/></linearGradient>
            <linearGradient id="pisXLid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6f72"/><stop offset="1" stop-color="#d2263b"/></linearGradient>
            <linearGradient id="pisXRibbon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#e0a400"/></linearGradient>
        </defs>
        <ellipse cx="60" cy="107" rx="40" ry="4" fill="#3a1c22" opacity=".14"/>
        <g class="pis-xgift-box">
            <rect x="18" y="52" width="84" height="52" rx="7" fill="url(#pisXBox)"/>
            <rect x="24" y="56" width="10" height="44" rx="5" fill="#fff" opacity=".2"/>
            <g fill="#fff" opacity=".55">
                <path d="M38 68l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z"/>
                <path d="M84 62l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>
                <path d="M81 88l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z"/>
                <path d="M41 90l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>
            </g>
            <rect x="53" y="52" width="14" height="52" fill="url(#pisXRibbon)"/>
        </g>
        <g class="pis-xgift-lid">
            <rect x="12" y="38" width="96" height="17" rx="6" fill="url(#pisXLid)"/>
            <rect x="53" y="38" width="14" height="17" fill="url(#pisXRibbon)"/>
            <g fill="none" stroke="url(#pisXRibbon)" stroke-width="6.5" stroke-linecap="round">
                <path d="M60 37 C 48 18, 30 20, 36 31 C 40 37, 52 37, 60 37 Z"/>
                <path d="M60 37 C 72 18, 90 20, 84 31 C 80 37, 68 37, 60 37 Z"/>
            </g>
            <circle cx="60" cy="36" r="6.5" fill="#e0a400"/>
            <path d="M88 44 l10 -6 l4 5 l-10 6 z" fill="#2a9d5c"/>
            <path d="M28 44 l-10 -6 l-4 5 l10 6 z" fill="#2a9d5c"/>
        </g>
    </svg>`;

    async function balanceNow() {
        try {
            const { data, error } = await supabaseClient.rpc('get_my_credit_balance');
            if (!error && data !== null && Number.isFinite(Number(data))) return Number(data);
        } catch (e) { /* nice-to-have */ }
        return null;
    }

    function ticketHtml(amount, balance) {
        return `<span class="pis-xticket-icon" aria-hidden="true">🎁</span>
            <span class="pis-xticket-text"><strong>${short(amount)} Christmas Credit Added</strong>
            <small>${balance !== null ? `Your balance is now ${money(balance)}.` : 'It’s in your account balance.'}</small></span>`;
    }

    async function addCard(gift, today) {
        const header = document.querySelector('.client-dashboard-header');
        if (!header || document.getElementById('pis-xmas-card')) return;
        const status = gift.status;
        const opened = status === 'opened';
        const available = status === 'available';
        const balance = opened ? await balanceNow() : null;

        const card = document.createElement('section');
        card.id = 'pis-xmas-card';
        card.className = 'pis-xmas';
        card.setAttribute('aria-label', 'Merry Christmas');
        card.innerHTML = `
            <div class="pis-snow" aria-hidden="true">${Array.from({ length: 16 }, (_, i) =>
                `<i style="left:${(i * 61) % 100}%;--s:${4 + (i * 7) % 5}px;--d:${6 + (i * 13) % 6}s;--w:${(i * 37) % 100 / 100 * -9}s"></i>`).join('')}</div>
            <button type="button" class="pis-xmas-close" aria-label="Close Christmas message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>
            <span class="pis-xmas-eyebrow">🎄 MERRY CHRISTMAS</span>
            <h3>Merry Christmas from Paws in Stride!</h3>
            <p>${available
                ? 'Thank you for letting us care for your pets this year. We left a little something under the tree for you.'
                : opened
                    ? 'Thank you for letting us care for your pets this year.'
                    : 'Thank you for being part of the Paws in Stride pack. Wishing you and your pets a cozy holiday!'}</p>
            ${available ? `<button type="button" class="pis-xpresent" aria-label="Open your Christmas present">${PRESENT_SVG}
                    <span class="pis-xpresent-label">Tap to Open Your Present</span></button>
                <p class="pis-xmas-retry" hidden>We couldn’t open your present just now. Check your connection and tap it again.</p>` : ''}
            <div class="pis-xticket"${opened ? '' : ' hidden'}>${opened ? ticketHtml(gift.amount, balance) : ''}</div>
            <button type="button" class="pis-xmas-book"${opened ? '' : ' hidden'}>Book a Visit</button>`;
        header.insertAdjacentElement('afterend', card);

        card.querySelector('.pis-xmas-close').addEventListener('click', () => {
            store.set(`pis-xmas-closed-${today}`, 'true');
            card.remove();
        });
        card.querySelector('.pis-xmas-book').addEventListener('click', () => {
            document.getElementById('request-walk-button')?.click();
        });
        const present = card.querySelector('.pis-xpresent');
        if (present) present.addEventListener('click', () => openPresent(card, present));
    }

    // Tap: the box shakes while the database adds the credit, the lid pops,
    // confetti bursts out and the credit appears with the new balance.
    let opening = false;
    async function openPresent(card, present) {
        if (opening) return;
        opening = true;
        const retry = card.querySelector('.pis-xmas-retry');
        retry.hidden = true;
        window.PisHaptics?.medium?.();
        const still = calm();
        if (!still) {
            present.classList.remove('is-opening');
            void present.offsetWidth;
            present.classList.add('is-opening');
        }
        present.disabled = true;

        let result = null;
        try {
            const [{ data, error }] = await Promise.all([
                supabaseClient.rpc('open_my_christmas_gift'),
                wait(still ? 0 : 1050)
            ]);
            if (!error) result = data;
        } catch (e) {
            result = null;
        }

        if (!result || !result.status) {
            present.classList.remove('is-opening');
            present.disabled = false;
            retry.hidden = false;
            window.PisHaptics?.error?.();
            opening = false;
            return;
        }

        const box = present.getBoundingClientRect();
        present.remove();
        retry.remove();
        const ticket = card.querySelector('.pis-xticket');
        if (result.status === 'opened') {
            ticket.innerHTML = ticketHtml(result.amount, result.balance ?? null);
            ticket.hidden = false;
            ticket.classList.add('is-revealed');
            card.querySelector('.pis-xmas-book').hidden = false;
            card.querySelector('p').textContent = 'Thank you for letting us care for your pets this year.';
            window.PisHaptics?.success?.();
            if (!still) confetti({ x: box.left + box.width / 2, y: box.top + box.height * 0.45 });
        } else {
            card.querySelector('p').textContent = 'Thank you for being part of the Paws in Stride pack. Wishing you and your pets a cozy holiday!';
        }
        opening = false;
    }

    function confetti(origin) {
        const canvas = document.createElement('canvas');
        canvas.className = 'pis-confetti';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        const colors = ['#e63946', '#2a9d5c', '#ffd166', '#ffffff', '#4da3ff', '#c41d33'];
        const bits = Array.from({ length: 120 }, () => ({
            x: origin.x + (Math.random() - .5) * 50, y: origin.y,
            vx: (Math.random() - .5) * 11, vy: -Math.random() * 10 - 5,
            r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
            w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
            c: colors[(Math.random() * colors.length) | 0], round: Math.random() < .3
        }));
        const start = performance.now();
        (function frame(now) {
            const t = now - start;
            ctx.clearRect(0, 0, innerWidth, innerHeight);
            ctx.globalAlpha = t > 2600 ? Math.max(0, 1 - (t - 2600) / 900) : 1;
            for (const b of bits) {
                b.vy += .22; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
                ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c;
                if (b.round) { ctx.beginPath(); ctx.arc(0, 0, b.h / 1.6, 0, Math.PI * 2); ctx.fill(); }
                else ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
                if (b.c === '#ffffff') { ctx.strokeStyle = '#d9e4ec'; ctx.lineWidth = .8; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h); }
                ctx.restore();
            }
            if (t < 3500) requestAnimationFrame(frame); else canvas.remove();
        })(start);
    }

    const style = document.createElement('style');
    style.textContent = `
        .pis-lights{display:block;width:100%;height:46px;margin:0 0 2px;overflow:hidden;pointer-events:none}
        .pis-lights svg{display:block;width:100%;height:48px}
        .pis-bulb{animation:pis-twinkle 2.4s ease-in-out infinite;filter:drop-shadow(0 0 4px var(--glow))}
        @keyframes pis-twinkle{0%,100%{opacity:1}50%{opacity:.45}}
        @media (max-width:700px){
            .client-portal-page .client-dashboard-header.pis-has-lights{padding-top:calc(max(10px, env(safe-area-inset-top, 0px)) + 36px) !important}
            .client-dashboard-header>.pis-lights{position:absolute;left:0;right:0;top:env(safe-area-inset-top, 0px);height:38px;margin:0;z-index:0}
            .client-dashboard-header>.pis-lights svg{height:44px}
        }
        .client-portal-page .pis-xmas,.pis-xmas{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:8px;margin:12px 0 16px;padding:26px 22px 22px;border-radius:22px;text-align:center;
            background:linear-gradient(160deg,#fff6f3 0%,#ffe9ec 48%,#eaf6ee 100%) !important;border:1px solid #f1c3c3 !important;box-shadow:0 8px 24px rgba(98,31,40,.10);color:#2b1a1f}
        .pis-snow{position:absolute;inset:0;pointer-events:none}
        .pis-snow i{position:absolute;top:-10px;width:var(--s);height:var(--s);border-radius:50%;background:#fff;box-shadow:0 0 3px rgba(150,170,190,.6);opacity:.9;animation:pis-snowfall var(--d) linear var(--w) infinite}
        @keyframes pis-snowfall{to{transform:translate(14px, 460px)}}
        .pis-xmas>*:not(.pis-snow):not(.pis-xmas-close){position:relative}
        .pis-xmas-eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#b51f2e}
        .pis-xmas h3{margin:0;font-size:22px;line-height:1.2;font-weight:800;color:#2b1a1f;text-wrap:balance}
        .pis-xmas p{margin:0;max-width:440px;text-wrap:balance;font-size:15px;font-weight:600;line-height:1.45;color:#5d4a50}
        .pis-xmas p.pis-xmas-retry{color:#b51f2e;font-size:14px}
        .client-portal-page .pis-xmas .pis-xmas-close,.pis-xmas-close{position:absolute;top:12px;right:12px;z-index:2;display:grid;place-items:center;width:38px;height:38px;margin:0;padding:0;border:1px solid rgba(43,26,31,.14);border-radius:50%;background:#fff;color:#5d4a50;box-shadow:0 2px 8px rgba(98,31,40,.14);cursor:pointer;-webkit-tap-highlight-color:transparent}
        .pis-xmas-close svg{display:block;width:16px;height:16px}
        .pis-xpresent{display:flex;flex-direction:column;align-items:center;gap:4px;margin:6px 0 0;padding:4px 10px 0;border:0;background:none;color:#b51f2e;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
        .pis-xgift-svg{display:block;width:120px;height:112px;overflow:visible;transform-origin:50% 92%;animation:pis-xgift-wiggle 3.4s ease-in-out 1.2s infinite}
        .pis-xgift-lid{transform-box:fill-box;transform-origin:50% 100%}
        .pis-xpresent-label{font-size:14px;font-weight:800;letter-spacing:.02em;transition:opacity .2s}
        .pis-xpresent:active .pis-xgift-svg{transform:scale(.95)}
        .pis-xpresent.is-opening .pis-xgift-svg{animation:pis-xgift-shake .26s ease-in-out 2}
        .pis-xpresent.is-opening .pis-xgift-lid{animation:pis-xlid-pop .55s cubic-bezier(.3,1.3,.6,1) .5s forwards}
        .pis-xpresent.is-opening .pis-xpresent-label{opacity:0}
        @keyframes pis-xgift-wiggle{0%,76%,100%{transform:rotate(0)}80%{transform:rotate(-7deg)}84%{transform:rotate(7deg)}88%{transform:rotate(-5deg)}92%{transform:rotate(3deg)}}
        @keyframes pis-xgift-shake{0%,100%{transform:rotate(0) scale(1)}25%{transform:rotate(-9deg) scale(1.04)}75%{transform:rotate(9deg) scale(1.04)}}
        @keyframes pis-xlid-pop{to{transform:translate(22px,-58px) rotate(28deg);opacity:0}}
        .pis-xticket{align-self:stretch;display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:6px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.82);border:1.5px dashed #9bd3ad;text-align:center}
        .pis-xticket[hidden],.pis-xmas-book[hidden],.pis-xmas-retry[hidden]{display:none !important}
        .pis-xticket-icon{font-size:22px;line-height:1}
        .pis-xticket-text{display:flex;flex-direction:column;align-items:center;gap:1px}
        .pis-xticket strong{font-size:15px;font-weight:800;color:#166534}
        .pis-xticket small{font-size:13px;font-weight:600;color:#5d4a50}
        .pis-xticket.is-revealed{animation:pis-xticket-reveal .5s cubic-bezier(.2,1.35,.5,1)}
        @keyframes pis-xticket-reveal{from{transform:scale(.55);opacity:0}to{transform:none;opacity:1}}
        .pis-xmas-book{align-self:stretch;margin-top:8px;padding:13px 18px;border:0;border-radius:12px;background:#c41d33;color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(196,29,51,.3)}
        @media (min-width:521px){.pis-xticket,.pis-xmas-book{align-self:center;min-width:320px}}
        @media (prefers-reduced-motion:reduce){.pis-bulb,.pis-xgift-svg,.pis-xpresent.is-opening .pis-xgift-svg,.pis-xpresent.is-opening .pis-xgift-lid,.pis-xticket.is-revealed{animation:none}.pis-snow{display:none}}
        .pis-confetti{position:fixed;inset:0;width:100vw;height:100vh;z-index:100000;pointer-events:none}`;
    document.head.appendChild(style);

    // Start after portal.js has had a moment to sign in.
    const start = () => setTimeout(() => { void run().catch(e => console.warn('Christmas gift:', e)); }, 900);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
