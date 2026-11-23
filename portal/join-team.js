/* ========================================
   PAWS IN STRIDE: JOIN THE TEAM
   ========================================
   An employee the owner added (More → Team) makes their login here:
   email + 6-digit setup code + a password.

   1. check_staff_invite: email and code match an invite (works signed out)
   2. sign up (or sign in, if that email already has a login)
   3. claim_staff_invite: the login becomes an employee account
   4. open the staff app (admin.html)
   ======================================== */
(function () {
    'use strict';

    const SUPABASE_URL = 'https://xyhndwopvlmnxjkthtkl.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_U3OIYatZuBUe8Y6Vq0DS2w_IMacau2j';

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage: window.localStorage }
    });

    const form = document.getElementById('join-team-form');
    const message = document.getElementById('join-team-message');
    const submit = document.getElementById('join-team-submit');
    if (!form) return;

    // ?email=… fills the email (handy if the link is shared that way)
    try {
        const email = new URLSearchParams(location.search).get('email');
        if (email) form.email.value = email;
    } catch (error) { /* ignore */ }

    const REASONS = {
        no_match: "That code doesn't match this email. Check the code Paws in Stride sent you, and use the same email they added.",
        locked: 'Too many wrong codes. Ask Paws in Stride to add you again for a new code.',
        owner: 'This email is the owner account. Sign in normally instead.',
        client_account: 'This email already has a client account with visits. Ask Paws in Stride to add you with a different email.',
        signed_out: 'Something went wrong signing you in. Try again.'
    };

    function show(text, ok = false) {
        message.dataset.pisToneFixed = ok ? 'success' : 'error';
        message.textContent = text;
        message.classList.toggle('is-success', ok);
        message.style.color = ok ? '#23784a' : '';
    }

    // Problems with one box: red outline + message under that box
    function fieldError(field, text) {
        if (window.PisFormErrors) { show(''); window.PisFormErrors.show(field, text); }
        else { show(text); field.focus(); }
    }

    // Success: swap the form for a check mark, like an app's "done" screen
    function showDone(name) {
        const box = form.closest('.login-container') || form.parentNode;
        const done = document.createElement('div');
        done.className = 'join-team-done';
        done.setAttribute('role', 'status');
        done.innerHTML = `
            <svg class="join-team-check" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24"></circle>
                <path d="M15 27.5l7.5 7.5L38 19"></path>
            </svg>
            <h2></h2>
            <p>Opening your schedule…</p>
            <span class="join-team-spinner" aria-hidden="true"></span>`;
        done.querySelector('h2').textContent = `You're all set${name ? `, ${name}` : ''}!`;
        [form, message, ...box.querySelectorAll('.login-form-heading, .login-forgot-password-row, .join-team-signin-prompt')]
            .forEach(el => { if (el) { el.hidden = true; el.style.display = 'none'; } });
        form.insertAdjacentElement('beforebegin', done);
    }

    const style = document.createElement('style');
    style.textContent = `
        #join-team-message { margin: 16px 0 0; color: #b23a2b; text-align: center; font-size: 14px; font-weight: 600; line-height: 1.5; }
        #join-team-message:empty { display: none; }
        .join-team-done { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 18px 0 28px; animation: join-team-in .35s ease-out both; }
        .join-team-done h2 { margin: 18px 0 6px; font-size: 26px; color: #17283a; }
        .join-team-done p { margin: 0 0 22px; color: #5d6e7e; font-size: 16px; }
        .join-team-check { width: 84px; height: 84px; }
        .join-team-check circle { fill: #e6f6ec; stroke: #2f9a5b; stroke-width: 3; stroke-dasharray: 151; stroke-dashoffset: 151; animation: join-team-draw .5s ease-out forwards; }
        .join-team-check path { fill: none; stroke: #2f9a5b; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 36; stroke-dashoffset: 36; animation: join-team-draw .35s .4s ease-out forwards; }
        .join-team-spinner { width: 26px; height: 26px; border: 3px solid #d9e6f1; border-top-color: #2890df; border-radius: 50%; animation: join-team-spin .8s linear infinite; }
        @keyframes join-team-draw { to { stroke-dashoffset: 0; } }
        @keyframes join-team-spin { to { transform: rotate(360deg); } }
        @keyframes join-team-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .join-team-done, .join-team-check circle, .join-team-check path { animation: none; stroke-dashoffset: 0; } }
    `;
    document.head.appendChild(style);

    async function signIn(email, password) {
        const { data, error } = await client.auth.signUp({
            email, password,
            options: { data: { staff_signup: true } }
        });
        if (!error && data?.session) return data.session;
        // That email may already have a login (for example an old account): try it as a sign-in.
        if (!error || /already|registered|exists/i.test(error.message || '')) {
            const attempt = await client.auth.signInWithPassword({ email, password });
            if (!attempt.error && attempt.data?.session) return attempt.data.session;
            throw new Error('This email already has a login with a different password. Use Forgot Password on the sign-in page first, then come back here.');
        }
        if (/password/i.test(error.message || '')) throw new Error(error.message);
        throw error;
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const email = form.email.value.trim().toLowerCase();
        const code = form.code.value.replace(/\D/g, '');
        const password = form.password.value;
        const password2 = form.password2.value;

        window.PisFormErrors?.clearAll(form);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fieldError(form.email, email ? 'Enter a full email address, like name@example.com.' : 'Enter the email Paws in Stride added you with.');
        if (code.length !== 6) return fieldError(form.code, 'Enter the 6-digit setup code.');
        if (password.length < 8) return fieldError(form.password, 'Use at least 8 characters.');
        if (password !== password2) return fieldError(form.password2, "The two passwords don't match.");
        if (!navigator.onLine) return show("You're offline. Connect to the internet and try again.");

        submit.disabled = true;
        const label = submit.textContent;
        submit.textContent = 'Setting Up…';
        show('');
        try {
            const check = await client.rpc('check_staff_invite', { p_email: email, p_code: code });
            if (check.error) throw check.error;
            if (!check.data?.ok) return fieldError(form.code, REASONS[check.data?.reason] || REASONS.no_match);

            try {
                await signIn(email, password);
            } catch (error) {
                if (/different password|password/i.test(error?.message || '')) return fieldError(form.password, error.message);
                throw error;
            }

            const claim = await client.rpc('claim_staff_invite', { p_code: code });
            if (claim.error) throw claim.error;
            if (!claim.data?.ok) {
                await client.auth.signOut();
                return claim.data?.reason === 'no_match' || claim.data?.reason === 'locked'
                    ? fieldError(form.code, REASONS[claim.data.reason])
                    : show(REASONS[claim.data?.reason] || REASONS.no_match);
            }

            // Let the staff app open even if it later starts without internet (same as signing in)
            try {
                localStorage.setItem('paws-in-stride-admin-device', 'true');
                localStorage.setItem('paws-in-stride-staff-role', 'employee');
            } catch (error) { /* ignore */ }

            const name = String(check.data.full_name || '').trim().split(/\s+/)[0];
            showDone(name);
            window.PisHaptics?.success?.();
            setTimeout(() => location.replace('./admin.html'), 1400);
        } catch (error) {
            console.error('Join team error:', error);
            show(error?.message || "Your login couldn't be made. Try again.");
        } finally {
            submit.disabled = false;
            submit.textContent = label;
        }
    });
})();
