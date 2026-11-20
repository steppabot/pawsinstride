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
        if (!header || document.querySelector('.pis-bunting')) return;
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
        header.insertAdjacentElement('beforebegin', strip);
    }

    async function addCard(pets, today) {
        const header = document.querySelector('.client-dashboard-header');
        if (!header || document.getElementById('pis-bday-card')) return;
        const names = pets.map(p => p.name);
        const credited = pets.filter(p => p.credited);
        const total = credited.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const ages = pets.filter(p => Number(p.age) > 0)
            .map(p => `${esc(p.name)} turns ${Number(p.age)} today!`).join(' ');
        const photos = await Promise.all(pets.slice(0, 3).map(photoFor));

        const card = document.createElement('section');
        card.id = 'pis-bday-card';
        card.className = 'pis-bday';
        card.setAttribute('aria-label', 'Birthday');
        card.innerHTML = `
            <button type="button" class="pis-bday-close" aria-label="Close birthday message">×</button>
            <div class="pis-bday-photos">${photos.map((src, i) => `<img src="${esc(src)}" alt="${esc(pets[i].name)}">`).join('')}<span class="pis-bday-cake" aria-hidden="true">🎂</span></div>
            <div class="pis-bday-copy">
                <span class="pis-bday-eyebrow">🎉 IT'S A BIRTHDAY!</span>
                <h3>Happy birthday, ${esc(listNames(names))}!</h3>
                ${ages ? `<p>${ages}</p>` : ''}
                ${total > 0 ? `<p class="pis-bday-credit">🎁 We added <strong>$${total % 1 ? total.toFixed(2) : total}</strong> to your account to celebrate.</p>` : ''}
                <button type="button" class="pis-bday-book">Book a Birthday Walk</button>
            </div>`;
        header.insertAdjacentElement('afterend', card);
        card.querySelector('.pis-bday-close').addEventListener('click', () => {
            store.set(`pis-bday-closed-${today}`, 'true');
            card.remove();
        });
        card.querySelector('.pis-bday-book').addEventListener('click', () => {
            document.getElementById('request-walk-button')?.click();
        });
    }

    function confetti() {
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
        const bits = Array.from({ length: 140 }, () => ({
            x: innerWidth / 2 + (Math.random() - .5) * innerWidth * .3,
            y: innerHeight * .25,
            vx: (Math.random() - .5) * 9,
            vy: -Math.random() * 9 - 3,
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
        .client-portal-page .pis-bday,.pis-bday{position:relative;display:flex;align-items:center;gap:16px;margin:12px 0 16px;padding:18px 18px 18px 16px;border-radius:20px;
            background:linear-gradient(135deg,#fff4e2 0%,#ffe2ec 55%,#e6f0ff 100%) !important;border:1px solid #f6d3a6 !important;box-shadow:0 8px 24px rgba(31,63,98,.10);color:#183447}
        .pis-bday-photos{position:relative;flex:none;display:flex}
        .pis-bday-photos img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.12);background:#fff}
        .pis-bday-photos img+img{margin-left:-22px}
        .pis-bday-cake{position:absolute;right:-6px;bottom:-4px;font-size:28px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.2))}
        .pis-bday-copy{min-width:0;display:flex;flex-direction:column;gap:4px}
        .pis-bday-eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#c2410c}
        .pis-bday h3{margin:0;font-size:22px;line-height:1.2;font-weight:800}
        .pis-bday p{margin:0;font-size:15px;font-weight:600;line-height:1.4;color:#46617d}
        .pis-bday p.pis-bday-credit{color:#166534}
        .pis-bday-book{align-self:flex-start;margin-top:8px;padding:10px 16px;border:0;border-radius:12px;background:#f5ab40;color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer}
        .pis-bday-close{position:absolute;top:8px;right:8px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.75);color:#46617d;font-size:20px;line-height:1;cursor:pointer}
        @media (max-width:520px){.pis-bday{flex-direction:column;align-items:flex-start;text-align:left}.pis-bday h3{font-size:20px;padding-right:28px}}
        .pis-confetti{position:fixed;inset:0;width:100vw;height:100vh;z-index:100000;pointer-events:none}`;
    document.head.appendChild(style);

    // Start after portal.js has had a moment to sign in.
    const start = () => setTimeout(() => { void run().catch(e => console.warn('Pet birthdays:', e)); }, 800);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
