// ========================================
// HAPTICS (iPhone app only)
// ========================================
// Small taps you can feel, like Apple's own apps:
//   - a light tick when you switch tabs or pick a date
//   - a success tap when a check-in, walk or visit is saved
//   - a firmer tap when a walk starts
//   - a warning tap for undo / reopen, an error tap when something fails
// In a web browser, or before the Haptics plugin is installed,
// every call quietly does nothing.
// ========================================

(() => {

    const cap = window.Capacitor;

    const native = Boolean(
        cap?.isNativePlatform?.() &&
        cap?.isPluginAvailable?.("Haptics")
    );

    const plugin = native
        ? cap.Plugins?.Haptics
        : null;

    let selectionReady = false;
    let lastTap = 0;
    const lastFeel = {};

    // the same kind of tap twice within a moment (finishing a visit also
    // finishes its walk) is felt once
    function once(feel) {
        const now = Date.now();
        if (now - (lastFeel[feel] || 0) < 700) {
            return false;
        }
        lastFeel[feel] = now;
        return true;
    }

    function run(work) {
        if (!plugin) {
            return;
        }
        try {
            Promise.resolve(work()).catch(() => {});
        } catch {
            /* haptics are a nice extra; never let them break anything */
        }
    }

    const PisHaptics = {

        available: Boolean(plugin),

        // a quick tick for picking something (tabs, dates)
        selection() {
            const now = Date.now();
            if (now - lastTap < 60) {
                return;
            }
            lastTap = now;
            run(async () => {
                if (!selectionReady) {
                    await plugin.selectionStart();
                    selectionReady = true;
                }
                await plugin.selectionChanged();
            });
        },

        light() {
            run(() => plugin.impact({ style: "LIGHT" }));
        },

        medium() {
            if (once("medium")) {
                run(() => plugin.impact({ style: "MEDIUM" }));
            }
        },

        success() {
            if (once("success")) {
                run(() => plugin.notification({ type: "SUCCESS" }));
            }
        },

        warning() {
            if (once("warning")) {
                run(() => plugin.notification({ type: "WARNING" }));
            }
        },

        error() {
            if (once("error")) {
                run(() => plugin.notification({ type: "ERROR" }));
            }
        }

    };

    window.PisHaptics = PisHaptics;

    if (!plugin) {
        return;
    }

    // ----------------------------------------
    // TAPS: tabs and calendar days
    // ----------------------------------------
    document.addEventListener(
        "click",
        event => {
            const target = event.target.closest?.(
                "[data-client-app-tab], .admin-app-nav [data-admin-screen], .calendar-day:not(:disabled)"
            );
            if (target && !target.disabled) {
                PisHaptics.selection();
            }
        },
        true
    );

    // ----------------------------------------
    // ADMIN VISIT ACTIONS
    // ----------------------------------------
    // Each action is wrapped once it exists: the tap happens after the
    // action finishes (saved on the phone or the server), and an error
    // tap if it fails. A cancelled confirmation changes nothing.
    const ACTIONS = {
        checkInVisit: "success",
        startVisitWalk: "medium",
        finishVisitWalk: "success",
        finishVisit: "success",
        undoVisitCheckIn: "warning",
        reopenVisit: "warning"
    };

    function wrapActions() {
        for (const [name, feel] of Object.entries(ACTIONS)) {
            const original = window[name];
            if (typeof original !== "function" || original.__pisHaptics) {
                continue;
            }
            const wrapped = async function (...args) {
                try {
                    const result = await original.apply(this, args);
                    if (result !== false) {
                        PisHaptics[feel]();
                    }
                    return result;
                } catch (error) {
                    PisHaptics.error();
                    throw error;
                }
            };
            wrapped.__pisHaptics = true;
            window[name] = wrapped;
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", wrapActions, { once: true });
    } else {
        wrapActions();
    }
    window.addEventListener("load", wrapActions, { once: true });

    // a booking that's paid for lands on the success page
    if (/\/success\.html$/i.test(window.location.pathname)) {
        window.addEventListener("load", () => PisHaptics.success(), { once: true });
    }

})();
