// ========================================
// SEASONAL APP ICON (iPhone app)
// ========================================
// The Home Screen icon follows the same months as the
// seasonal intros, in Texas time:
//   October   -> Halloween
//   November  -> Thanksgiving
//   December  -> Christmas
//   otherwise -> the everyday icon
// Anyone can pick "Classic" in Profile (clients) or More
// (staff) to keep the everyday icon all year.
//
// iPhone shows a short "You have changed the icon" notice
// each time the icon switches (about four times a year).
// Does nothing in a web browser or on an app build without
// the icon plugin.
// ========================================

(function () {
    const cap = window.Capacitor;
    const NATIVE = Boolean(cap?.isNativePlatform?.());
    const plugin = cap?.Plugins?.AppIcon;

    const PREF_KEY = "paws-in-stride-app-icon";
    const SEASONS = { 10: "Halloween", 11: "Thanksgiving", 12: "Christmas" };
    const THUMBS = {
        everyday: "/portal/assets/app-icons/everyday.jpg",
        Halloween: "/portal/assets/app-icons/halloween.jpg",
        Thanksgiving: "/portal/assets/app-icons/thanksgiving.jpg",
        Christmas: "/portal/assets/app-icons/christmas.jpg"
    };

    function texasMonth() {
        try {
            return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "numeric" }).format(new Date()));
        } catch {
            return new Date().getMonth() + 1;
        }
    }

    function readPref() {
        try {
            return localStorage.getItem(PREF_KEY) === "classic" ? "classic" : "seasonal";
        } catch {
            return "seasonal";
        }
    }

    function savePref(value) {
        try {
            localStorage.setItem(PREF_KEY, value);
        } catch {
            /* private mode: still switch now */
        }
    }

    const seasonNow = () => SEASONS[texasMonth()] || null;
    const wantedIcon = () => (readPref() === "classic" ? null : seasonNow());
    const thumbFor = name => THUMBS[name] || THUMBS.everyday;

    function escapeText(value) {
        return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    // ----------------------------------------
    // SWITCH THE ICON
    // ----------------------------------------
    let supportedPromise = null;
    function isSupported() {
        if (!NATIVE || !plugin?.isSupported) {
            return Promise.resolve(false);
        }
        supportedPromise ||= plugin.isSupported().then(result => Boolean(result?.value)).catch(() => false);
        return supportedPromise;
    }

    let working = null;
    function applyIcon() {
        if (working) {
            return working;
        }
        working = (async () => {
            if (!(await isSupported())) {
                return;
            }
            const target = wantedIcon();
            let current = null;
            try {
                current = (await plugin.getName())?.value || null;
            } catch {
                current = null;
            }
            if (current === target) {
                return;
            }
            if (target) {
                await plugin.change({ name: target, suppressNotification: true });
            } else {
                await plugin.reset({ suppressNotification: true });
            }
        })().catch(() => {
            /* this build doesn't have that icon yet: keep the current one */
        }).finally(() => {
            working = null;
        });
        return working;
    }

    // iPhone only switches icons while the app is on screen, and the
    // notice it shows shouldn't land on top of the intro video.
    function introShowing() {
        if (/intro-open/.test(document.body?.className || "")) {
            return true;
        }
        const intro = document.querySelector("#mobile-portal-intro.is-active, #admin-portal-intro.is-active");
        return Boolean(intro && intro.getClientRects().length && getComputedStyle(intro).opacity !== "0");
    }

    function applyWhenSettled(waited = 0) {
        if (document.visibilityState !== "visible") {
            return;
        }
        if (introShowing() && waited < 20000) {
            window.setTimeout(() => applyWhenSettled(waited + 1000), 1000);
            return;
        }
        void applyIcon();
    }

    // ----------------------------------------
    // PICKER POPUP
    // ----------------------------------------
    function openPicker(onSaved) {
        document.getElementById("pis-appicon-modal")?.remove();
        let choice = readPref();
        const overlay = document.createElement("div");
        overlay.id = "pis-appicon-modal";
        overlay.className = "client-cancellation-modal pis-appicon-modal";
        overlay.innerHTML = `
            <div class="client-cancellation-dialog" role="dialog" aria-modal="true" aria-labelledby="pis-appicon-title">
                <div class="client-cancellation-header">
                    <div>
                        <span class="client-cancellation-eyebrow" style="color:#1f7bc2">Paws in Stride</span>
                        <h3 id="pis-appicon-title">App Icon</h3>
                    </div>
                    <button type="button" class="client-cancellation-close" data-appicon-close aria-label="Close">×</button>
                </div>
                <div class="pis-appicon-options" role="radiogroup" aria-label="App Icon">
                    <button type="button" class="pis-appicon-option" role="radio" data-appicon="seasonal">
                        <span class="pis-appicon-fan">
                            <img src="${thumbFor("Halloween")}" alt="">
                            <img src="${thumbFor("Thanksgiving")}" alt="">
                            <img src="${thumbFor("Christmas")}" alt="">
                        </span>
                        <span class="pis-appicon-option-text">
                            <strong>Seasonal</strong>
                            <small>Changes for Halloween, Thanksgiving and Christmas.</small>
                        </span>
                        <span class="pis-appicon-check" aria-hidden="true"></span>
                    </button>
                    <button type="button" class="pis-appicon-option" role="radio" data-appicon="classic">
                        <span class="pis-appicon-fan is-single">
                            <img src="${thumbFor("everyday")}" alt="">
                        </span>
                        <span class="pis-appicon-option-text">
                            <strong>Classic</strong>
                            <small>Always the everyday icon.</small>
                        </span>
                        <span class="pis-appicon-check" aria-hidden="true"></span>
                    </button>
                </div>
                <p class="client-cancellation-note">Your iPhone shows a quick notice when the icon changes.</p>
                <div class="client-cancellation-actions">
                    <button type="button" class="secondary-button" data-appicon-close>Cancel</button>
                    <button type="button" class="client-cancellation-confirm pis-appicon-save" data-appicon-save>Save</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const paint = () => {
            overlay.querySelectorAll("[data-appicon]").forEach(option => {
                const on = option.dataset.appicon === choice;
                option.classList.toggle("is-selected", on);
                option.setAttribute("aria-checked", on ? "true" : "false");
            });
        };
        paint();

        const close = () => {
            overlay.remove();
            document.removeEventListener("keydown", onKey);
        };
        const onKey = event => {
            if (event.key === "Escape") {
                close();
            }
        };
        document.addEventListener("keydown", onKey);

        overlay.addEventListener("click", async event => {
            const option = event.target.closest("[data-appicon]");
            if (option) {
                choice = option.dataset.appicon;
                window.PisHaptics?.selection();
                paint();
                return;
            }
            if (event.target.closest("[data-appicon-save]")) {
                const changed = choice !== readPref();
                savePref(choice);
                close();
                onSaved?.();
                if (changed) {
                    window.PisHaptics?.success();
                    await applyIcon();
                }
                return;
            }
            if (event.target === overlay || event.target.closest("[data-appicon-close]")) {
                close();
            }
        });
    }

    // ----------------------------------------
    // SETTING CARD: Profile (clients) and More (staff)
    // ----------------------------------------
    function cardText() {
        const classic = readPref() === "classic";
        const season = seasonNow();
        return {
            thumb: thumbFor(classic ? "everyday" : season || "everyday"),
            note: classic
                ? "Classic: always the everyday icon."
                : season
                    ? `Seasonal: ${season} icon right now.`
                    : "Seasonal: changes for Halloween, Thanksgiving and Christmas."
        };
    }

    function addClientCard() {
        const pushCard = document.getElementById("client-notifications-toggle");
        if (!pushCard || document.getElementById("pis-appicon-card")) {
            return;
        }
        const card = document.createElement("button");
        card.type = "button";
        card.id = "pis-appicon-card";
        card.className = "client-profile-tool-card pis-appicon-card";
        card.setAttribute("aria-haspopup", "dialog");
        const paint = () => {
            const { thumb, note } = cardText();
            card.innerHTML = `
                <span class="client-profile-tool-icon pis-appicon-thumb" aria-hidden="true"><img src="${thumb}" alt=""></span>
                <span class="client-profile-tool-copy">
                    <strong>App Icon</strong>
                    <small>${escapeText(note)}</small>
                </span>
                <span class="client-profile-tool-action">Change <span aria-hidden="true">›</span></span>`;
        };
        paint();
        card.addEventListener("click", () => openPicker(paint));
        pushCard.insertAdjacentElement("afterend", card);
    }

    function addAdminCard() {
        const pushCard = document.getElementById("admin-enable-push-notifications");
        if (!pushCard || document.getElementById("pis-appicon-card")) {
            return;
        }
        const card = document.createElement("button");
        card.type = "button";
        card.id = "pis-appicon-card";
        card.className = "admin-more-tool-card pis-appicon-card";
        card.setAttribute("aria-haspopup", "dialog");
        const paint = () => {
            const { thumb, note } = cardText();
            card.innerHTML = `
                <span class="admin-more-tool-icon pis-appicon-thumb" aria-hidden="true"><img src="${thumb}" alt=""></span>
                <span class="admin-more-tool-copy">
                    <strong>App Icon</strong>
                    <span>${escapeText(note)}</span>
                </span>
                <span class="admin-more-tool-arrow">›</span>`;
        };
        paint();
        card.addEventListener("click", () => openPicker(paint));
        pushCard.insertAdjacentElement("afterend", card);
    }

    // ----------------------------------------
    // STYLES
    // ----------------------------------------
    function addStyles() {
        if (document.getElementById("pis-appicon-styles")) {
            return;
        }
        const style = document.createElement("style");
        style.id = "pis-appicon-styles";
        style.textContent = `
            .pis-appicon-card .pis-appicon-thumb { background: none !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; overflow: hidden; border-radius: 11px; }
            .pis-appicon-card .pis-appicon-thumb img { display: block; width: 46px; height: 46px; border-radius: 11px; box-shadow: 0 2px 6px rgba(20, 40, 60, .18); }
            .pis-appicon-options { display: grid; gap: 10px; margin: 4px 0 12px; }
            .pis-appicon-option {
                display: flex; align-items: center; gap: 14px; width: 100%; padding: 12px 14px; margin: 0;
                border: 2px solid #dbe7f3; border-radius: 16px; background: #ffffff; color: #183447;
                font: inherit; text-align: left; cursor: pointer; box-sizing: border-box;
                -webkit-tap-highlight-color: transparent;
            }
            .pis-appicon-option.is-selected { border-color: #f7941d; background: #fff8ef; }
            .pis-appicon-fan { flex: 0 0 82px; display: flex; align-items: center; height: 52px; }
            .pis-appicon-fan img { width: 40px; height: 40px; border-radius: 10px; box-shadow: 0 2px 6px rgba(20, 40, 60, .22); border: 2px solid #ffffff; }
            .pis-appicon-fan img + img { margin-left: -19px; }
            .pis-appicon-fan img:nth-child(2) { transform: translateY(-5px); position: relative; z-index: 1; }
            .pis-appicon-fan.is-single { justify-content: center; }
            .pis-appicon-fan.is-single img { width: 48px; height: 48px; border-radius: 12px; }
            .pis-appicon-option-text { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .pis-appicon-option-text strong { font-size: 16px; }
            .pis-appicon-option-text small { color: #5c7286; font-size: 13px; font-weight: 600; line-height: 1.35; }
            .pis-appicon-check { flex: none; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #c6d6e4; box-sizing: border-box; }
            .pis-appicon-option.is-selected .pis-appicon-check {
                border-color: #f7941d; background: #f7941d url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center / 14px no-repeat;
            }
            .pis-appicon-modal .client-cancellation-confirm.pis-appicon-save { background: #f7941d; border-color: #f7941d; }
        `;
        document.head.appendChild(style);
    }

    // ----------------------------------------
    // START
    // ----------------------------------------
    async function start() {
        if (!(await isSupported())) {
            return;
        }
        addStyles();
        addClientCard();
        addAdminCard();
        window.setTimeout(() => applyWhenSettled(), 2500);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                window.setTimeout(() => applyWhenSettled(), 1200);
            }
        });
    }

    window.PisAppIcon = { apply: applyIcon, openPicker, wanted: wantedIcon };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        void start();
    }
})();
