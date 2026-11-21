// ========================================
// BACK TO SIGN IN (sign-up and forgot-password pages)
// ========================================
// - The "Sign In" back button at the top left goes back to the sign-in page.
// - In the iPhone app, swiping from the left edge does the same, with the
//   page following your finger like iPhone's own back swipe.
// - On the sign-up page, if anything has been typed in, it asks first so
//   nobody loses what they entered by accident.
// ========================================

(() => {
    const LOGIN = "/portal/login.html";
    const NATIVE = Boolean(window.Capacitor?.isNativePlatform?.());
    const SIGNUP = () => document.body.classList.contains("portal-signup-page");

    function hasTypedInfo() {
        if (!SIGNUP()) {
            return false;
        }
        // account already created: nothing to lose
        const done = document.getElementById("signup-step-success");
        if (done && !done.hidden) {
            return false;
        }
        return [...document.querySelectorAll("input, textarea")].some(el => {
            if (["hidden", "checkbox", "radio", "button", "submit"].includes(el.type)) {
                return false;
            }
            const value = String(el.value || "").trim();
            return value !== "" && value !== String(el.defaultValue || "").trim();
        });
    }

    // true = leaving now, false = staying
    function leave() {
        if (hasTypedInfo() && !window.confirm("Leave sign up? What you've entered won't be saved.")) {
            return false;
        }
        window.location.href = LOGIN;
        return true;
    }

    document.addEventListener("click", event => {
        const back = event.target.closest("[data-pis-back]");
        if (!back) {
            return;
        }
        event.preventDefault();
        leave();
    });

    if (!NATIVE) {
        return;
    }

    // ---------- swipe from the left edge ----------
    const EDGE = 26;
    const page = () => document.body;
    let swipe = null;

    function setOffset(x, animate) {
        const body = page();
        body.style.transition = animate ? "transform .28s cubic-bezier(.32,.72,0,1)" : "none";
        body.style.transform = x > 0 ? `translate3d(${x}px,0,0)` : "";
        body.style.boxShadow = x > 0 ? "-12px 0 28px rgba(15,35,55,.18)" : "";
        // grey "behind the page" color only while the page is pulled over
        document.documentElement.style.background = x > 0 ? "#e9eef3" : "";
    }

    document.addEventListener("touchstart", event => {
        const touch = event.touches[0];
        if (event.touches.length !== 1 || touch.clientX > EDGE) {
            swipe = null;
            return;
        }
        swipe = { x: touch.clientX, y: touch.clientY, time: Date.now(), dx: 0, moving: false };
    }, { passive: true });

    document.addEventListener("touchmove", event => {
        if (!swipe) {
            return;
        }
        const touch = event.touches[0];
        const dx = touch.clientX - swipe.x;
        const dy = touch.clientY - swipe.y;
        if (!swipe.moving) {
            if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
                swipe = null;
                return;
            }
            if (dx < 8) {
                return;
            }
            swipe.moving = true;
        }
        event.preventDefault();
        swipe.dx = Math.max(0, dx);
        setOffset(swipe.dx, false);
    }, { passive: false });

    function finish() {
        if (!swipe) {
            return;
        }
        const { dx, time, moving } = swipe;
        swipe = null;
        if (!moving) {
            return;
        }
        const speed = dx / Math.max(1, Date.now() - time);
        const width = window.innerWidth || 390;
        if (dx > width * 0.33 || (speed > 0.55 && dx > 40)) {
            setOffset(width, true);
            setTimeout(() => {
                if (!leave()) {
                    setOffset(0, true);
                }
            }, 230);
        } else {
            setOffset(0, true);
        }
    }

    document.addEventListener("touchend", finish, { passive: true });
    document.addEventListener("touchcancel", finish, { passive: true });
})();
