// ========================================
// FACE ID SIGN-IN (iPhone app only)
// ========================================
// After you sign in with your password, the app offers to use Face ID
// next time. If you say yes, your email and password are saved in the
// iPhone's Keychain, locked so iOS asks for Face ID before handing them
// back. The sign-in page then shows "Sign In with Face ID".
//
//   - Profile > Account Security: turn it on or off (clients)
//   - Sign-in page: "Turn Off Face ID" (everyone)
//   - Changing your password in Profile updates the saved one
//   - If the password changed somewhere else, or Face ID on the phone
//     changed, the saved login is cleared and you sign in once with
//     your password to turn it back on
//
// In a web browser, or before the plugin is installed, nothing shows.
// ========================================

(() => {

    const cap = window.Capacitor;

    const plugin =
        cap?.isNativePlatform?.() && cap?.isPluginAvailable?.("NativeBiometric")
            ? cap.Plugins?.NativeBiometric
            : null;

    const SERVER = "app.pawsinstride.login";
    const STORE_KEY = "paws-in-stride-faceid";
    const ONLY_THIS_FACE = 1;   // AccessControl.BIOMETRY_CURRENT_SET: adding a new face clears the saved login

    const FACE_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2"/><path d="M9 9v1.5M15 9v1.5M12 9v4h-1M9.5 16c1.4 1 3.6 1 5 0"/></svg>`;

    function readState() {
        try {
            return JSON.parse(window.localStorage.getItem(STORE_KEY) || "null");
        } catch {
            return null;
        }
    }

    function writeState(value) {
        try {
            if (value) {
                window.localStorage.setItem(STORE_KEY, JSON.stringify(value));
            } else {
                window.localStorage.removeItem(STORE_KEY);
            }
        } catch {
            /* private mode: Face ID just won't be remembered */
        }
    }

    function escapeText(value) {
        return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }

    function wasCancelled(error) {
        const code = Number(error?.code ?? error?.errorCode);
        return [11, 15, 16, 17].includes(code) ||
            /cancel/i.test(String(error?.message || ""));
    }

    function notBuiltIn(error) {
        return /not implemented|unimplemented/i.test(`${error?.code || ""} ${error?.message || ""}`);
    }

    // ----------------------------------------
    // WHAT THIS PHONE HAS
    // ----------------------------------------
    let support = null;

    async function getSupport() {
        if (!plugin) {
            return { ok: false, label: "Face ID" };
        }
        if (support) {
            return support;
        }
        try {
            const result = await plugin.isAvailable({ useFallback: false });
            support = {
                ok: Boolean(result?.isAvailable),
                label: Number(result?.biometryType) === 1 ? "Touch ID" : "Face ID"
            };
        } catch {
            support = { ok: false, label: "Face ID" };
        }
        return support;
    }

    // ----------------------------------------
    // SAVE / LOAD / FORGET THE LOGIN
    // ----------------------------------------
    async function saveLogin(email, password) {
        await plugin.setCredentials({
            username: email,
            password,
            server: SERVER,
            accessControl: ONLY_THIS_FACE
        });
        writeState({ email, on: true });
    }

    async function loadLogin(label) {
        try {
            // iOS asks for Face ID itself before giving the saved login back
            return await plugin.getSecureCredentials({
                server: SERVER,
                reason: "Sign in to Paws in Stride",
                title: "Sign In"
            });
        } catch (error) {
            if (!notBuiltIn(error)) {
                throw error;
            }
            // older plugin (Capacitor 7): ask for Face ID first, then read it
            await plugin.verifyIdentity({ reason: "Sign in to Paws in Stride", title: `Sign In with ${label}` });
            return await plugin.getCredentials({ server: SERVER });
        }
    }

    async function forgetLogin() {
        writeState(null);
        try {
            await plugin?.deleteCredentials({ server: SERVER });
        } catch {
            /* nothing saved */
        }
    }

    // ----------------------------------------
    // POPUP (same look as the app's other popups)
    // ----------------------------------------
    function ask({ title, detail, note, yesText, noText, withPassword }) {
        document.getElementById("pis-faceid-modal")?.remove();
        const overlay = document.createElement("div");
        overlay.id = "pis-faceid-modal";
        overlay.className = "client-cancellation-modal pis-faceid-modal";
        overlay.innerHTML = `
            <div class="client-cancellation-dialog" role="dialog" aria-modal="true" aria-labelledby="pis-faceid-title">
                <div class="client-cancellation-header">
                    <div>
                        <span class="client-cancellation-eyebrow" style="color:#1f7bc2">Paws in Stride</span>
                        <h3 id="pis-faceid-title">${escapeText(title)}</h3>
                    </div>
                    <button type="button" class="client-cancellation-close" data-faceid-no aria-label="Close">×</button>
                </div>
                ${detail ? `<div class="client-cancellation-service"><strong>${escapeText(detail)}</strong></div>` : ""}
                <p class="client-cancellation-note">${escapeText(note)}</p>
                ${withPassword ? `
                <label class="pis-faceid-password">
                    <span>Password</span>
                    <span class="pis-password-wrap">
                        <input type="password" autocomplete="current-password" data-faceid-password>
                        <button type="button" class="pis-password-toggle" data-faceid-show aria-label="Show password">Show</button>
                    </span>
                    <small data-faceid-error></small>
                </label>` : ""}
                <div class="client-cancellation-actions">
                    <button type="button" class="secondary-button" data-faceid-no>${escapeText(noText)}</button>
                    <button type="button" class="client-cancellation-confirm pis-faceid-yes" data-faceid-yes>${escapeText(yesText)}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const input = overlay.querySelector("[data-faceid-password]");
        const errorEl = overlay.querySelector("[data-faceid-error]");
        overlay.querySelector("[data-faceid-show]")?.addEventListener("click", event => {
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            event.currentTarget.textContent = show ? "Hide" : "Show";
        });
        (input || overlay.querySelector("[data-faceid-yes]")).focus({ preventScroll: true });

        return new Promise(resolve => {
            const done = value => {
                document.removeEventListener("keydown", onKey, true);
                overlay.remove();
                resolve(value);
            };
            const onKey = event => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    done(null);
                }
            };
            document.addEventListener("keydown", onKey, true);
            overlay.addEventListener("click", async event => {
                if (event.target === overlay || event.target.closest("[data-faceid-no]")) {
                    done(null);
                    return;
                }
                const yes = event.target.closest("[data-faceid-yes]");
                if (!yes) {
                    return;
                }
                if (!withPassword) {
                    done(true);
                    return;
                }
                const password = input.value;
                if (!password) {
                    errorEl.textContent = "Enter your password.";
                    input.focus();
                    return;
                }
                yes.disabled = true;
                const before = yes.textContent;
                yes.textContent = "Checking…";
                const problem = await withPassword(password).catch(error => error?.message || "That didn't work. Try again.");
                if (problem) {
                    errorEl.textContent = problem;
                    yes.disabled = false;
                    yes.textContent = before;
                    input.select();
                    return;
                }
                done(password);
            });
        });
    }

    // ----------------------------------------
    // TURN IT ON (after Face ID confirms it's you)
    // ----------------------------------------
    async function turnOn(email, password, label) {
        try {
            await plugin.verifyIdentity({ reason: `Turn on ${label} sign-in for Paws in Stride`, title: `Use ${label}` });
            await saveLogin(email, password);
            window.PisHaptics?.success();
            return true;
        } catch (error) {
            if (!wasCancelled(error)) {
                console.warn("Face ID could not be turned on:", error);
                window.alert(`${label} couldn't be turned on. You can try again from your Profile.`);
            }
            return false;
        }
    }

    // ----------------------------------------
    // HOOKS CALLED BY THE SIGN-IN AND PROFILE CODE
    // ----------------------------------------
    let faceIdAttempt = false;
    let refreshLoginButton = () => {};
    let refreshProfileRow = () => {};

    const PisFaceId = {

        // right after a successful password sign-in (before leaving the page)
        async afterPasswordLogin({ email, password }) {
            const viaFaceId = faceIdAttempt;
            faceIdAttempt = false;
            if (viaFaceId) {
                window.PisHaptics?.success();
                return;
            }
            const { ok, label } = await getSupport();
            if (!ok || !email || !password) {
                return;
            }
            const current = readState();
            if (current?.on && current.email === email) {
                // already on: keep the saved password in step with the one that just worked
                try {
                    await saveLogin(email, password);
                } catch {
                    /* keep the old one */
                }
                return;
            }
            const yes = await ask({
                title: current?.on ? `Use ${label} for this account?` : `Use ${label} next time?`,
                detail: email,
                note: current?.on
                    ? `${label} is set up for ${current.email} on this iPhone. Switch it to this account?`
                    : `Sign in with a glance instead of typing your password. Your password stays locked in this iPhone's Keychain.`,
                yesText: `Use ${label}`,
                noText: "Not Now"
            });
            if (yes) {
                await turnOn(email, password, label);
            }
        },

        // a sign-in attempt was refused
        loginFailed() {
            if (!faceIdAttempt) {
                return;
            }
            faceIdAttempt = false;
            void forgetLogin();
            refreshLoginButton();
            const message = document.getElementById("login-message");
            if (message) {
                message.textContent = "Your password changed. Sign in with your new password to turn Face ID back on.";
            }
            const password = document.getElementById("password");
            if (password) {
                password.value = "";
            }
        },

        // the password was changed in Profile
        async passwordChanged(email, newPassword) {
            const current = readState();
            if (!plugin || !current?.on || !email || current.email !== String(email).toLowerCase()) {
                return;
            }
            try {
                await saveLogin(current.email, newPassword);
            } catch {
                await forgetLogin();
            }
            refreshProfileRow();
        },

        isOn() {
            return Boolean(plugin && readState()?.on);
        }

    };

    window.PisFaceId = PisFaceId;

    if (!plugin) {
        return;
    }

    // ----------------------------------------
    // SIGN-IN PAGE: "Sign In with Face ID"
    // ----------------------------------------
    // (declared at the top)

    async function setUpLoginPage() {
        const form = document.getElementById("login-form");
        if (!form) {
            return;
        }
        const { ok, label } = await getSupport();
        if (!ok) {
            return;
        }
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const message = document.getElementById("login-message");

        refreshLoginButton = () => {
            document.querySelector(".pis-faceid-login")?.remove();
            const current = readState();
            if (!current?.on) {
                return;
            }
            if (emailInput && !emailInput.value) {
                emailInput.value = current.email;
            }
            const block = document.createElement("div");
            block.className = "pis-faceid-login";
            block.innerHTML = `
                <button type="button" class="pis-faceid-button">${FACE_ICON}<span>Sign In with ${escapeText(label)}</span></button>
                <p class="pis-faceid-for">${escapeText(current.email)} · <button type="button" class="pis-faceid-off">Turn Off ${escapeText(label)}</button></p>
                <div class="pis-faceid-or"><span>or use your password</span></div>`;
            form.parentNode.insertBefore(block, form);

            const button = block.querySelector(".pis-faceid-button");
            button.addEventListener("click", async () => {
                button.disabled = true;
                if (message) {
                    message.textContent = "";
                }
                try {
                    const saved = await loadLogin(label);
                    if (!saved?.username || !saved?.password) {
                        throw new Error("nothing saved");
                    }
                    emailInput.value = saved.username;
                    passwordInput.value = saved.password;
                    faceIdAttempt = true;
                    form.requestSubmit();
                } catch (error) {
                    if (!wasCancelled(error)) {
                        await forgetLogin();
                        refreshLoginButton();
                        if (message) {
                            message.textContent = `${label} changed on this iPhone. Sign in with your password to turn it back on.`;
                        }
                    }
                } finally {
                    button.disabled = false;
                }
            });
            block.querySelector(".pis-faceid-off").addEventListener("click", async () => {
                await forgetLogin();
                refreshLoginButton();
                if (message) {
                    message.textContent = `${label} sign-in is off. Sign in with your password.`;
                }
            });
        };

        refreshLoginButton();
    }

    // ----------------------------------------
    // PROFILE > ACCOUNT SECURITY: on / off
    // ----------------------------------------
    // (declared at the top)

    async function setUpProfile() {
        const passwordForm = document.getElementById("change-password-form");
        if (!passwordForm) {
            return;
        }
        const { ok, label } = await getSupport();
        if (!ok) {
            return;
        }
        const row = document.createElement("div");
        row.className = "pis-faceid-setting";
        passwordForm.parentNode.insertBefore(row, passwordForm);

        const myEmail = () => String(
            (typeof currentUser !== "undefined" && currentUser?.email) ||
            (typeof currentProfile !== "undefined" && currentProfile?.email) || ""
        ).trim().toLowerCase();

        refreshProfileRow = () => {
            const current = readState();
            const on = Boolean(current?.on && current.email === myEmail());
            row.innerHTML = `
                <span class="pis-faceid-setting-icon">${FACE_ICON}</span>
                <span class="pis-faceid-setting-text">
                    <strong>Sign In with ${escapeText(label)}</strong>
                    <small>${on ? "On for this iPhone" : "Off"}</small>
                </span>
                <button type="button" class="secondary-button pis-faceid-setting-button">${on ? "Turn Off" : "Turn On"}</button>`;
            row.querySelector("button").addEventListener("click", async () => {
                if (on) {
                    await forgetLogin();
                    window.PisHaptics?.warning();
                    refreshProfileRow();
                    return;
                }
                const email = myEmail();
                if (!email) {
                    return;
                }
                const password = await ask({
                    title: `Turn on ${label}?`,
                    detail: email,
                    note: `Enter your password once. After that, you can sign in with ${label}.`,
                    yesText: "Continue",
                    noText: "Cancel",
                    withPassword: async typed => {
                        // check the password without touching the session you're signed in with
                        const checker = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
                            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "pis-faceid-check" }
                        });
                        const { error } = await checker.auth.signInWithPassword({ email, password: typed });
                        if (error) {
                            window.PisHaptics?.error();
                            return /invalid|credentials/i.test(error.message || "") ? "That password isn't right." : "We couldn't check your password. Try again.";
                        }
                        return "";
                    }
                });
                if (password && await turnOn(email, password, label)) {
                    refreshProfileRow();
                }
            });
        };

        refreshProfileRow();
        // the signed-in email can arrive a moment after the page opens
        window.setTimeout(refreshProfileRow, 2500);
    }

    function start() {
        void setUpLoginPage();
        void setUpProfile();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

})();
