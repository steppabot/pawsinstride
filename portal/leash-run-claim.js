// ========================================
// LEASH RUN REWARD CLAIM
// ========================================
//
// If someone earned a Leash Run reward while
// logged out, the game saves it on this
// device. As soon as they land on the
// dashboard logged in (after logging in OR
// signing up) we claim it here, so they never
// have to go back to the game.
//
// The database function decides the amount
// ($20 once for new clients, $5 once a month
// for current clients) and blocks repeats.
// ========================================

(async function claimPendingLeashRunReward() {

    let pending = null;

    try {
        pending = JSON.parse(localStorage.getItem("leashrun-pending") || "null");
    } catch (_) {}

    if (!pending || !(pending.score >= 150) || Date.now() - pending.at > 3 * 86400e3) {
        return;
    }

    if (typeof supabaseClient === "undefined") {
        return;
    }

    const { data: sessionData } = await supabaseClient.auth.getSession();

    if (!sessionData?.session) {
        return;
    }

    const { data, error } = await supabaseClient.rpc("claim_leash_run_reward", {
        p_score: Math.round(pending.score)
    });

    if (error) {
        console.warn("Leash Run reward claim failed:", error);
        return;
    }

    try {
        localStorage.removeItem("leashrun-pending");
    } catch (_) {}

    if (data?.status !== "credited") {
        return;
    }

    const toast = document.createElement("div");

    toast.textContent =
        `🐕 Leash Run reward: $${Number(data.amount)} account credit added!`;

    toast.style.cssText =
        "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;" +
        "background:#173a4d;color:#fff;font:700 15px/1.3 Nunito,system-ui,sans-serif;" +
        "padding:12px 18px;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:90vw;text-align:center";

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 6000);

})();
