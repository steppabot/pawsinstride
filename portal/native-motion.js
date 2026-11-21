// ========================================
// iPHONE-STYLE MOTION
// ========================================
//   1. A visit opens by sliding in from the right and closes by sliding
//      back out (phone-size screens).
//   2. Swipe back: drag from the left edge of an open visit to close it,
//      and it follows your finger (iPhone app).
//   3. Pull to refresh: pull down at the top of the page to reload the
//      schedule (admin) or your visits (clients) (iPhone app).
//   4. Long-press a visit in the schedule for a quick preview with
//      Check In / Open / Call / Text / Navigate (iPhone app).
// Everything respects the iPhone's Reduce Motion setting.
// ========================================

(() => {

    const cap = window.Capacitor;
    const NATIVE = Boolean(cap?.isNativePlatform?.());
    const IOS_EASE = "cubic-bezier(.32,.72,0,1)";
    const SPRING = "cubic-bezier(.34,1.4,.64,1)";

    const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const phoneSize = () => window.innerWidth < 720;
    const isAdmin = () => document.body.classList.contains("admin-page");
    const isClient = () => document.body.classList.contains("client-portal-page");

    // ----------------------------------------
    // STYLES
    // ----------------------------------------
    const style = document.createElement("style");
    style.textContent = `
        #admin-day-services .pis-row-main { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
        .pis-ptr {
            position: fixed; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 10px); z-index: 99990;
            width: 40px; height: 40px; margin-left: -20px; border-radius: 50%;
            background: #ffffff; box-shadow: 0 6px 18px rgba(20, 40, 60, .18);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transform: translateY(-60px); pointer-events: none;
        }
        .pis-ptr span { position: relative; width: 22px; height: 22px; }
        .pis-ptr i { position: absolute; left: 10px; top: 0; width: 2.4px; height: 6px; border-radius: 2px; background: #5c7286; transform-origin: 1.2px 11px; }
        .pis-ptr.is-spinning span { animation: pis-ptr-spin .8s steps(8) infinite; }
        @keyframes pis-ptr-spin { to { transform: rotate(360deg); } }

        .pis-lp { position: fixed; inset: 0; z-index: 99995; }
        .pis-lp-blur { position: absolute; inset: 0; background: rgba(236, 242, 248, .45); -webkit-backdrop-filter: blur(14px) saturate(1.2); backdrop-filter: blur(14px) saturate(1.2); }
        .pis-lp-card {
            position: absolute; left: 14px; right: 14px; padding: 14px; border-radius: 20px; background: #ffffff;
            box-shadow: 0 24px 60px rgba(20, 40, 60, .28); display: flex; gap: 12px; align-items: flex-start; transform-origin: 50% 50%;
        }
        .pis-lp-icon { flex: none; width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; }
        .pis-lp-icon svg { width: 24px; height: 24px; }
        .pis-lp-text { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .pis-lp-meta { font-size: 13px; font-weight: 700; color: #5c7286; }
        .pis-lp-meta .pis-badge { display: none; }
        .pis-lp-title { font-size: 18px; font-weight: 800; color: #183447; }
        .pis-lp-sub { font-size: 14px; color: #46617d; }
        .pis-lp-addr { margin-top: 4px; font-size: 13px; color: #5c7286; line-height: 1.35; }
        .pis-lp-menu {
            position: absolute; left: 14px; width: 260px; border-radius: 16px; overflow: hidden;
            background: rgba(255, 255, 255, .97); box-shadow: 0 18px 50px rgba(20, 40, 60, .25); transform-origin: 20px 0;
        }
        .pis-lp-menu a, .pis-lp-menu button {
            all: unset; box-sizing: border-box; display: flex; width: 100%; justify-content: space-between; align-items: center;
            padding: 13px 16px; font: inherit; font-size: 16px; font-weight: 600; color: #183447; cursor: pointer;
            border-top: 1px solid #edf1f5;
        }
        .pis-lp-menu > :first-child { border-top: 0; }
        .pis-lp .pis-lp-menu :is(a, button):is(:hover, :focus, :visited) { color: #183447; text-decoration: none; }
        .pis-lp-menu .is-main, .pis-lp .pis-lp-menu .is-main:is(:hover, :focus) { color: #1f63b8; font-weight: 700; }
        .pis-lp-menu svg { width: 20px; height: 20px; flex: none; }
        .pis-lp-menu :active { background: #eef3f8; }
    `;
    document.head.appendChild(style);

    const ICON = {
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
        open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
        call: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
        text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>',
        report: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>'
    };

    const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

    // ========================================
    // 1. VISIT SLIDES IN / OUT
    // ========================================
    let skipNextClose = false;

    const PisMotion = {

        visitOpened(modal) {
            if (reduceMotion() || !phoneSize()) {
                return;
            }
            const sheet = modal.querySelector(".vfm-sheet");
            const backdrop = modal.querySelector(".vfm-backdrop");
            sheet?.animate([{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], { duration: 420, easing: IOS_EASE });
            backdrop?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
        },

        // called just before the visit closes: a copy slides away while the
        // real one closes right away, so nothing else has to wait
        visitClosing(modal) {
            if (skipNextClose) {
                skipNextClose = false;
                return;
            }
            if (reduceMotion() || !phoneSize() || modal.hidden) {
                return;
            }
            const ghost = modal.cloneNode(true);
            ghost.removeAttribute("id");
            ghost.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
            ghost.setAttribute("aria-hidden", "true");
            ghost.style.pointerEvents = "none";
            const realBody = modal.querySelector(".vfm-body");
            document.body.appendChild(ghost);
            const ghostBody = ghost.querySelector(".vfm-body");
            if (realBody && ghostBody) {
                ghostBody.scrollTop = realBody.scrollTop;
            }
            const done = Promise.all([
                ghost.querySelector(".vfm-sheet")?.animate([{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], { duration: 320, easing: IOS_EASE, fill: "forwards" }).finished,
                ghost.querySelector(".vfm-backdrop")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: "ease-in", fill: "forwards" }).finished
            ]);
            done.catch(() => {}).finally(() => ghost.remove());
            window.setTimeout(() => ghost.remove(), 900);
        }

    };

    window.PisMotion = PisMotion;

    if (!NATIVE) {
        return;
    }

    // ========================================
    // 2. SWIPE BACK FROM THE LEFT EDGE
    // ========================================
    let swipe = null;

    document.addEventListener("touchstart", event => {
        if (reduceMotion() || !phoneSize() || event.touches.length !== 1) {
            return;
        }
        const touch = event.touches[0];
        const sheet = event.target.closest?.(".vfm:not([hidden]) .vfm-sheet");
        if (!sheet || touch.clientX > 28) {
            return;
        }
        swipe = { sheet, backdrop: sheet.parentElement.querySelector(".vfm-backdrop"), x0: touch.clientX, y0: touch.clientY, t0: performance.now(), dx: 0, active: false, decided: false };
    }, { passive: true });

    document.addEventListener("touchmove", event => {
        if (!swipe) {
            return;
        }
        const touch = event.touches[0];
        const dx = touch.clientX - swipe.x0;
        const dy = touch.clientY - swipe.y0;
        if (!swipe.decided) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
                return;
            }
            swipe.decided = true;
            swipe.active = dx > 0 && Math.abs(dx) > Math.abs(dy);
            if (!swipe.active) {
                swipe = null;
                return;
            }
        }
        event.preventDefault();
        swipe.dx = Math.max(0, dx);
        swipe.sheet.style.transform = `translateX(${swipe.dx}px)`;
        if (swipe.backdrop) {
            swipe.backdrop.style.opacity = String(Math.max(0, 1 - swipe.dx / window.innerWidth));
        }
    }, { passive: false });

    async function endSwipe() {
        if (!swipe?.active) {
            swipe = null;
            return;
        }
        const { sheet, backdrop, dx, t0 } = swipe;
        swipe = null;
        const width = window.innerWidth;
        const speed = dx / Math.max(1, performance.now() - t0);
        const close = dx > width * 0.33 || (speed > 0.55 && dx > 40);
        const settle = (to, ms) => Promise.all([
            sheet.animate([{ transform: `translateX(${dx}px)` }, { transform: `translateX(${to}px)` }], { duration: ms, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).finished,
            backdrop?.animate([{ opacity: backdrop.style.opacity || 1 }, { opacity: to ? 0 : 1 }], { duration: ms, fill: "forwards" }).finished
        ]).catch(() => {});
        const reset = () => {
            sheet.getAnimations().forEach(a => a.cancel());
            backdrop?.getAnimations().forEach(a => a.cancel());
            sheet.style.transform = "";
            if (backdrop) {
                backdrop.style.opacity = "";
            }
        };
        if (!close) {
            await settle(0, 240);
            reset();
            return;
        }
        await settle(width, Math.max(140, 260 * (1 - dx / width)));
        skipNextClose = true;
        window.pisCloseVisit?.();
        skipNextClose = false;
        const stillOpen = !sheet.closest(".vfm")?.hidden;
        if (stillOpen) {
            // closing was cancelled (unsaved report): slide back in
            sheet.getAnimations().forEach(a => a.cancel());
            sheet.animate([{ transform: `translateX(${width}px)` }, { transform: "translateX(0)" }], { duration: 300, easing: IOS_EASE });
            backdrop?.getAnimations().forEach(a => a.cancel());
        }
        reset();
    }

    document.addEventListener("touchend", endSwipe, { passive: true });
    document.addEventListener("touchcancel", endSwipe, { passive: true });

    // ========================================
    // 3. PULL TO REFRESH
    // ========================================
    const ptr = document.createElement("div");
    ptr.className = "pis-ptr";
    ptr.setAttribute("aria-hidden", "true");
    ptr.innerHTML = `<span>${Array.from({ length: 8 }, (_, i) => `<i style="transform:rotate(${i * 45}deg);opacity:${(0.25 + i * 0.1).toFixed(2)}"></i>`).join("")}</span>`;
    document.body.appendChild(ptr);

    const ARM_AT = 70;
    let pull = null;
    let refreshing = false;

    function somethingOpen() {
        return Boolean(
            document.querySelector(".vfm:not([hidden]), dialog[open], .client-cancellation-modal, .pis-lp, #pis-faceid-modal") ||
            document.documentElement.classList.contains("vfm-lock") ||
            getComputedStyle(document.body).overflow === "hidden"
        );
    }

    function showPull(distance) {
        const y = Math.min(distance, 110) - 50;
        ptr.style.opacity = String(Math.min(1, distance / ARM_AT));
        ptr.style.transform = `translateY(${y}px) rotate(${distance * 3}deg)`;
    }

    document.addEventListener("touchstart", event => {
        if (refreshing || event.touches.length !== 1 || (!isAdmin() && !isClient())) {
            return;
        }
        if ((window.scrollY || document.documentElement.scrollTop) > 2 || somethingOpen()) {
            return;
        }
        if (event.target.closest?.("input, textarea, select, canvas, .leaflet-container, [data-no-pull]")) {
            return;
        }
        pull = { y0: event.touches[0].clientY, x0: event.touches[0].clientX, d: 0, armed: false };
    }, { passive: true });

    document.addEventListener("touchmove", event => {
        if (!pull) {
            return;
        }
        const touch = event.touches[0];
        const dy = touch.clientY - pull.y0;
        if (dy <= 0 || Math.abs(touch.clientX - pull.x0) > Math.abs(dy) * 1.5) {
            if (dy < -4) {
                pull = null;
                showPull(0);
            }
            return;
        }
        pull.d = dy * 0.55;
        showPull(pull.d);
        if (!pull.armed && pull.d >= ARM_AT) {
            pull.armed = true;
            window.PisHaptics?.selection();
        } else if (pull.armed && pull.d < ARM_AT - 12) {
            pull.armed = false;
        }
    }, { passive: true });

    async function endPull() {
        if (!pull) {
            return;
        }
        const armed = pull.armed;
        pull = null;
        if (!armed) {
            ptr.animate([{ opacity: ptr.style.opacity, transform: ptr.style.transform }, { opacity: 0, transform: "translateY(-60px)" }], { duration: 200, easing: "ease-in" });
            showPull(0);
            ptr.style.opacity = "0";
            return;
        }
        refreshing = true;
        ptr.style.transform = "translateY(20px)";
        ptr.style.opacity = "1";
        ptr.classList.add("is-spinning");
        const started = Date.now();
        try {
            if (isAdmin()) {
                if (typeof refreshAdminFocusDays === "function") {
                    await Promise.race([refreshAdminFocusDays(), new Promise(r => setTimeout(r, 8000))]);
                }
                window.PawsLiveSync?.queue?.("*");
            } else if (typeof loadDashboard === "function") {
                await Promise.race([loadDashboard({ background: true }), new Promise(r => setTimeout(r, 8000))]);
            }
        } catch (error) {
            console.warn("Pull to refresh:", error);
        }
        const wait = 700 - (Date.now() - started);
        if (wait > 0) {
            await new Promise(r => setTimeout(r, wait));
        }
        ptr.classList.remove("is-spinning");
        await ptr.animate([{ opacity: 1, transform: "translateY(20px) scale(1)" }, { opacity: 0, transform: "translateY(20px) scale(.4)" }], { duration: 220, easing: "ease-in" }).finished.catch(() => {});
        ptr.style.opacity = "0";
        ptr.style.transform = "translateY(-60px)";
        refreshing = false;
    }

    document.addEventListener("touchend", endPull, { passive: true });
    document.addEventListener("touchcancel", endPull, { passive: true });

    // ========================================
    // 4. LONG-PRESS A VISIT FOR A QUICK PREVIEW
    // ========================================
    let press = null;
    let swallowClickUntil = 0;
    let ignoreLayerClicksUntil = 0;

    function visitInfo(row) {
        const card = row.closest(".admin-service-card[data-schedule-visit-id]");
        const id = Number(card?.dataset.scheduleVisitId);
        let phone = "", address = "";
        try {
            const visit = (typeof allVisits !== "undefined" ? allVisits : []).find(v => Number(v.id) === id);
            const client = visit && (typeof allProfiles !== "undefined" ? allProfiles : []).find(p => String(p.id) === String(visit.client_id));
            const home = visit && (typeof allHouseholds !== "undefined" ? allHouseholds : []).find(h => String(h.client_id) === String(visit.client_id));
            phone = String(client?.phone || "").replace(/[^\d+]/g, "");
            if (home) {
                const cityState = [home.city, home.state].filter(Boolean).join(", ");
                address = [home.street_address, home.address_line_2, `${cityState}${home.zip_code ? ` ${home.zip_code}` : ""}`.trim()].filter(Boolean).join(", ");
            }
        } catch {
            /* preview without contact buttons */
        }
        return { card, phone, address };
    }

    function closePreview(layer) {
        if (!layer?.isConnected) {
            return;
        }
        const card = layer.querySelector(".pis-lp-card");
        const menu = layer.querySelector(".pis-lp-menu");
        Promise.all([
            layer.querySelector(".pis-lp-blur").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).finished,
            card.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.96)" }], { duration: 220, easing: IOS_EASE, fill: "forwards" }).finished,
            menu.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.7)" }], { duration: 200, easing: IOS_EASE, fill: "forwards" }).finished
        ]).catch(() => {}).finally(() => layer.remove());
    }

    function openPreview(row) {
        const rowEl = row.closest(".pis-row");
        const { card, phone, address } = visitInfo(row);
        if (!rowEl || !card) {
            return;
        }
        const rect = rowEl.getBoundingClientRect();
        const iconEl = rowEl.querySelector(".pis-row-icon");
        const action = rowEl.querySelector(".pis-row-action");
        const items = [];
        if (action && !/^open$/i.test(action.textContent.trim())) {
            const label = action.textContent.trim();
            items.push({ label, icon: /report/i.test(label) ? ICON.report : ICON.check, main: true, run: () => action.click() });
        }
        items.push({ label: "Open Visit", icon: ICON.open, main: !items.length, run: () => { swallowClickUntil = 0; row.click(); } });
        if (phone) {
            items.push({ label: "Call", icon: ICON.call, href: `tel:${phone}` });
            items.push({ label: "Text", icon: ICON.text, href: `sms:${phone}` });
        }
        if (address) {
            items.push({ label: "Navigate", icon: ICON.nav, href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}` });
        }

        const layer = document.createElement("div");
        layer.className = "pis-lp";
        layer.innerHTML = `
            <div class="pis-lp-blur"></div>
            <div class="pis-lp-card">
                <span class="pis-lp-icon">${iconEl ? iconEl.innerHTML.replace(/<span class="pis-row-status">[\s\S]*?<\/span>/, "") : ""}</span>
                <span class="pis-lp-text">
                    <span class="pis-lp-meta">${row.querySelector(".pis-row-meta")?.innerHTML || ""}</span>
                    <span class="pis-lp-title">${esc(row.querySelector(".pis-row-title")?.textContent)}</span>
                    <span class="pis-lp-sub">${esc(row.querySelector(".pis-row-sub")?.textContent)}</span>
                    ${address ? `<span class="pis-lp-addr">${esc(address)}</span>` : ""}
                </span>
            </div>
            <div class="pis-lp-menu" role="menu">
                ${items.map((item, i) => item.href
                    ? `<a role="menuitem" href="${esc(item.href)}"${item.href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""} data-i="${i}">${esc(item.label)}${item.icon}</a>`
                    : `<button type="button" role="menuitem" class="${item.main ? "is-main" : ""}" data-i="${i}">${esc(item.label)}${item.icon}</button>`).join("")}
            </div>`;
        document.body.appendChild(layer);

        const previewCard = layer.querySelector(".pis-lp-card");
        const menu = layer.querySelector(".pis-lp-menu");
        if (iconEl) {
            const look = getComputedStyle(iconEl);
            previewCard.querySelector(".pis-lp-icon").style.background = look.backgroundImage !== "none" ? look.backgroundImage : look.backgroundColor;
        }
        // keep the card where the row was, but make room for the menu above the tab bar
        const cardHeight = previewCard.offsetHeight;
        const menuHeight = menu.offsetHeight;
        const bottomLimit = window.innerHeight - 96;
        let top = Math.max(60, rect.top - 6);
        if (top + cardHeight + 10 + menuHeight > bottomLimit) {
            top = Math.max(60, bottomLimit - cardHeight - 10 - menuHeight);
        }
        previewCard.style.top = `${top}px`;
        menu.style.top = `${top + cardHeight + 10}px`;

        layer.querySelector(".pis-lp-blur").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
        previewCard.animate([{ transform: `translateY(${rect.top - top}px) scale(.97)` }, { transform: "translateY(0) scale(1)" }], { duration: 460, easing: SPRING });
        menu.animate([{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1)" }], { duration: 460, easing: SPRING });

        layer.addEventListener("click", event => {
            // lifting the finger that opened the preview can send a tap; ignore it
            if (Date.now() < ignoreLayerClicksUntil) {
                event.preventDefault();
                return;
            }
            const pick = event.target.closest("[data-i]");
            if (!pick) {
                closePreview(layer);
                return;
            }
            const item = items[Number(pick.dataset.i)];
            if (!item.href) {
                event.preventDefault();
                closePreview(layer);
                window.setTimeout(() => item.run(), 120);
            } else {
                window.setTimeout(() => closePreview(layer), 50);
            }
        });
    }

    document.addEventListener("touchstart", event => {
        if (!isAdmin() || event.touches.length !== 1) {
            return;
        }
        const row = event.target.closest?.("#admin-day-services .pis-row-main:not(:disabled)");
        if (!row) {
            return;
        }
        const touch = event.touches[0];
        press = {
            row, x: touch.clientX, y: touch.clientY,
            timer: window.setTimeout(() => {
                if (!press) {
                    return;
                }
                press.fired = true;
                swallowClickUntil = Date.now() + 800;
                window.PisHaptics?.medium();
                openPreview(row);
            }, 450)
        };
    }, { passive: true });

    document.addEventListener("touchmove", event => {
        if (!press) {
            return;
        }
        const touch = event.touches[0];
        if (Math.abs(touch.clientX - press.x) > 8 || Math.abs(touch.clientY - press.y) > 8) {
            window.clearTimeout(press.timer);
            press = null;
        }
    }, { passive: true });

    const endPress = () => {
        if (press) {
            if (press.fired) {
                ignoreLayerClicksUntil = Date.now() + 450;
            }
            window.clearTimeout(press.timer);
            press = null;
        }
    };
    document.addEventListener("touchend", endPress, { passive: true });
    document.addEventListener("touchcancel", endPress, { passive: true });

    // the tap that ends a long-press shouldn't also open the visit
    document.addEventListener("click", event => {
        if (Date.now() < swallowClickUntil && event.target.closest?.("#admin-day-services .pis-row-main")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            swallowClickUntil = 0;
        }
    }, true);

    // iOS's own long-press menu (copy / look up) stays out of the way
    document.addEventListener("contextmenu", event => {
        if (event.target.closest?.("#admin-day-services .pis-row-main")) {
            event.preventDefault();
        }
    });

})();
