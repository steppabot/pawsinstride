/* Paws in Stride — Website Banner editor (admin only).
   Load AFTER admin.js. Adds a "Website Banner" card to More → Business Tools.
   Edits the orange bar at the top of every website page (site-banner.js reads
   it). Saved in the site_banner table; only the admin account can change it. */
(function () {
    'use strict';

    const TABLE = 'site_banner';
    const MAX_MESSAGES = 3;
    const MAX_TEXT = 140;
    const GAME = { link_text: 'Play Now', link_url: '/game.html' };

    let banner = null;      // { active, messages, updated_at }
    let state = 'idle';     // idle | ready | missing | error
    let draft = null;
    let busy = false;
    let pushedHistory = false;
    let swallowPop = false;

    const isOwner = () => typeof currentUser !== 'undefined' && currentUser?.id && window.PIS_STAFF_ROLE !== 'employee';
    const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const bold = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const safeLink = url => {
        const v = String(url || '').trim();
        return /^\/(?!\/)/.test(v) || /^https:\/\//i.test(v) || /^(tel|mailto):/i.test(v) ? v : '';
    };
    const isMissing = e => ['PGRST205', '42P01'].includes(String(e?.code || '')) ||
        (/site_banner/.test(String(e?.message || '')) && /does not exist|could not find|schema cache/i.test(String(e?.message || '')));

    function clean(row) {
        return {
            active: row?.active !== false,
            updated_at: row?.updated_at || null,
            messages: (Array.isArray(row?.messages) ? row.messages : []).slice(0, MAX_MESSAGES).map(m => ({
                text: String(m?.text || ''),
                link_text: String(m?.link_text || ''),
                link_url: String(m?.link_url || '')
            }))
        };
    }

    async function load() {
        try {
            const { data, error } = await supabaseClient.from(TABLE)
                .select('active, messages, updated_at').eq('id', 1).maybeSingle();
            if (error) throw error;
            banner = clean(data || { active: false, messages: [] });
            state = 'ready';
        } catch (error) {
            state = isMissing(error) ? 'missing' : 'error';
            if (state === 'error') console.error('Website banner:', error);
        }
        updateCard();
    }

    /* ---------- card in More → Business Tools ---------- */
    function cardStatus() {
        if (state === 'missing') return 'Needs a one-time setup in Supabase.';
        if (state === 'error') return 'Couldn’t load. Tap to try again.';
        if (!banner) return 'Loading…';
        const n = banner.messages.filter(m => m.text.trim()).length;
        if (!banner.active || !n) return 'Off · edit the orange bar at the top of your website.';
        return `On · ${n} ${n === 1 ? 'message' : 'messages'} showing on your website.`;
    }

    function updateCard() {
        const status = document.getElementById('admin-site-banner-status');
        if (status) status.textContent = cardStatus();
    }

    function mountCard() {
        if (!isOwner() || document.getElementById('admin-open-site-banner')) return;
        const grid = document.querySelector('#admin-screen-more .admin-more-tool-grid');
        if (!grid) return;
        const card = document.createElement('button');
        card.type = 'button';
        card.id = 'admin-open-site-banner';
        card.className = 'admin-more-tool-card';
        card.innerHTML = `
            <span class="admin-more-tool-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"></path><path d="M15 9a4 4 0 0 1 0 6"></path><path d="M18 6a8 8 0 0 1 0 12"></path></svg>
            </span>
            <span class="admin-more-tool-copy">
                <strong>Website Banner</strong>
                <span id="admin-site-banner-status">${esc(cardStatus())}</span>
            </span>
            <span class="admin-more-tool-arrow">›</span>`;
        card.addEventListener('click', () => { void open(); });
        grid.appendChild(card);
        if (state === 'idle') void load();
    }

    /* ---------- editor ---------- */
    async function open() {
        if (document.getElementById('psb-editor')) return;
        if (state !== 'ready') await load();
        if (state === 'missing') {
            (window.pisNotice || window.alert)('The website banner needs a one-time setup: run paws-birthday-and-banner-setup.sql in Supabase → SQL Editor.');
            return;
        }
        if (state !== 'ready') {
            (window.pisNotice || window.alert)('The website banner couldn’t be loaded. Check your connection and try again.');
            return;
        }
        draft = JSON.parse(JSON.stringify(banner));
        if (!draft.messages.length) draft.messages.push({ text: '', link_text: '', link_url: '' });

        const wrap = document.createElement('div');
        wrap.id = 'psb-editor';
        wrap.className = 'psb';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.setAttribute('aria-labelledby', 'psb-title');
        wrap.innerHTML = `
            <div class="psb-sheet">
                <header class="psb-head">
                    <div><span class="psb-eyebrow">WEBSITE</span><h2 id="psb-title">Website Banner</h2></div>
                    <button type="button" class="psb-close" data-psb-close aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </header>
                <div class="psb-body"></div>
                <footer class="psb-foot">
                    <button type="button" class="psb-cancel" data-psb-close>Cancel</button>
                    <button type="button" class="psb-save" data-psb-save>Save</button>
                </footer>
            </div>`;
        document.body.appendChild(wrap);
        document.body.classList.add('psb-open');
        wrap.addEventListener('click', onClick);
        wrap.addEventListener('input', onInput);
        render();
        try { history.pushState({ psb: true }, ''); pushedHistory = true; } catch (e) { pushedHistory = false; }
    }

    function close(fromPop) {
        const el = document.getElementById('psb-editor');
        if (!el) return;
        el.remove();
        document.body.classList.remove('psb-open');
        draft = null;
        if (pushedHistory && !fromPop) {
            swallowPop = true;
            try { history.back(); } catch (e) { swallowPop = false; }
        }
        pushedHistory = false;
    }

    function render(note) {
        const body = document.querySelector('#psb-editor .psb-body');
        if (!body || !draft) return;
        const items = draft.messages.map((m, i) => `
            <div class="psb-msg" data-index="${i}">
                <div class="psb-msg-head">
                    <strong>Message ${i + 1}</strong>
                    ${draft.messages.length > 1 ? `<button type="button" class="psb-link-btn" data-psb-remove="${i}">Remove</button>` : ''}
                </div>
                <label class="psb-field"><span>Text</span>
                    <textarea rows="2" maxlength="${MAX_TEXT}" data-field="text" placeholder="🎖️ Veterans receive **10% OFF** all services!">${esc(m.text)}</textarea>
                    <small>${m.text.length}/${MAX_TEXT} · put **double stars** around words to make them bold</small></label>
                <div class="psb-row">
                    <label class="psb-field"><span>Button text <small>(optional)</small></span>
                        <input type="text" maxlength="24" data-field="link_text" value="${esc(m.link_text)}" placeholder="Play Now"></label>
                    <label class="psb-field"><span>Link <small>(optional)</small></span>
                        <input type="text" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" data-field="link_url" value="${esc(m.link_url)}" placeholder="/game.html"></label>
                </div>
                <div class="psb-chips">
                    <button type="button" class="psb-chip" data-psb-game="${i}">🎮 Link to Leash Run Game</button>
                    ${m.link_url ? `<button type="button" class="psb-chip" data-psb-nolink="${i}">No Link</button>` : ''}
                </div>
            </div>`).join('');
        const shown = draft.messages.filter(m => m.text.trim());
        body.innerHTML = `
            <label class="psb-toggle">
                <input type="checkbox" data-psb-active ${draft.active ? 'checked' : ''}>
                <span><strong>Show Banner on Website</strong><small>Turn off to hide the orange bar on every page.</small></span>
            </label>
            <div class="psb-preview-wrap" ${draft.active && shown.length ? '' : 'hidden'}>
                <span class="psb-label">Preview${shown.length > 1 ? ' · messages take turns every 6 seconds' : ''}</span>
                ${shown.map(m => `<div class="psb-preview">${bold(m.text)}${safeLink(m.link_url) ? ` <u>${esc(m.link_text.trim() || 'Learn More')} ›</u>` : ''}</div>`).join('')}
            </div>
            ${items}
            ${draft.messages.length < MAX_MESSAGES ? '<button type="button" class="psb-add" data-psb-add>+ Add Another Message</button>' : ''}
            <p class="psb-note" role="status">${esc(note || '')}</p>`;
    }

    function onInput(e) {
        if (!draft) return;
        if (e.target.matches('[data-psb-active]')) { draft.active = e.target.checked; render(); return; }
        const box = e.target.closest('.psb-msg');
        const field = e.target.dataset.field;
        if (!box || !field) return;
        draft.messages[Number(box.dataset.index)][field] = e.target.value;
        if (field === 'text') {
            const small = e.target.parentElement.querySelector('small');
            if (small) small.textContent = `${e.target.value.length}/${MAX_TEXT} · put **double stars** around words to make them bold`;
        }
        // Refresh just the preview so typing isn't interrupted.
        const wrap = document.querySelector('#psb-editor .psb-preview-wrap');
        if (wrap) {
            const shown = draft.messages.filter(m => m.text.trim());
            wrap.hidden = !(draft.active && shown.length);
            wrap.innerHTML = `<span class="psb-label">Preview${shown.length > 1 ? ' · messages take turns every 6 seconds' : ''}</span>` +
                shown.map(m => `<div class="psb-preview">${bold(m.text)}${safeLink(m.link_url) ? ` <u>${esc(m.link_text.trim() || 'Learn More')} ›</u>` : ''}</div>`).join('');
        }
    }

    async function onClick(e) {
        const t = e.target;
        if (t === e.currentTarget || t.closest('[data-psb-close]')) { if (!busy) close(); return; }
        if (busy || !draft) return;
        const game = t.closest('[data-psb-game]');
        if (game) { Object.assign(draft.messages[Number(game.dataset.psbGame)], GAME); render(); return; }
        const nolink = t.closest('[data-psb-nolink]');
        if (nolink) { Object.assign(draft.messages[Number(nolink.dataset.psbNolink)], { link_text: '', link_url: '' }); render(); return; }
        const remove = t.closest('[data-psb-remove]');
        if (remove) { draft.messages.splice(Number(remove.dataset.psbRemove), 1); render(); return; }
        if (t.closest('[data-psb-add]')) { draft.messages.push({ text: '', link_text: '', link_url: '' }); render(); return; }
        if (t.closest('[data-psb-save]')) await save();
    }

    function problem() {
        for (const [i, m] of draft.messages.entries()) {
            if (!m.text.trim() && (m.link_url.trim() || m.link_text.trim())) return `Message ${i + 1} has a link but no text.`;
            if (m.link_url.trim() && !safeLink(m.link_url)) return `Message ${i + 1}: links must start with / (a page on your site) or https://`;
        }
        if (draft.active && !draft.messages.some(m => m.text.trim())) return 'Add a message, or turn the banner off.';
        return '';
    }

    async function save() {
        const issue = problem();
        if (issue) { render(issue); return; }
        busy = true;
        const button = document.querySelector('#psb-editor [data-psb-save]');
        if (button) { button.disabled = true; button.textContent = 'Saving…'; }
        const messages = draft.messages.filter(m => m.text.trim()).map(m => {
            const link = safeLink(m.link_url);
            return link
                ? { text: m.text.trim(), link_text: m.link_text.trim() || 'Learn More', link_url: link }
                : { text: m.text.trim() };
        });
        try {
            const { data, error } = await supabaseClient.from(TABLE)
                .update({ active: draft.active, messages, updated_at: new Date().toISOString(), updated_by: currentUser.id })
                .eq('id', 1).select('active, messages, updated_at').maybeSingle();
            if (error) throw error;
            if (!data) throw new Error('Only the admin account can change the website banner.');
            banner = clean(data);
            updateCard();
            busy = false;
            close();
            toast(banner.active ? 'Saved. It’s live on your website now.' : 'Saved. The banner is hidden on your website.');
        } catch (error) {
            console.error('Website banner save:', error);
            busy = false;
            if (button) { button.disabled = false; button.textContent = 'Save'; }
            render(isMissing(error) ? 'Run paws-birthday-and-banner-setup.sql in Supabase first.' :
                navigator.onLine === false ? 'You’re offline. Connect and try again.' : `Couldn’t save: ${error.message || 'please try again.'}`);
        }
    }

    function toast(text) {
        const el = document.createElement('div');
        el.className = 'psb-toast';
        el.setAttribute('role', 'status');
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3500);
    }

    window.addEventListener('popstate', e => {
        if (swallowPop) { swallowPop = false; e.stopImmediatePropagation(); return; }
        if (document.getElementById('psb-editor')) { e.stopImmediatePropagation(); pushedHistory = false; if (!busy) close(true); }
    });
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.getElementById('psb-editor') && !busy) { e.preventDefault(); close(); }
    }, true);

    const css = `
    body.psb-open{overflow:hidden}
    .psb{position:fixed;inset:0;z-index:10060;background:rgba(15,35,55,.45);display:flex;align-items:flex-end;justify-content:center}
    .psb-sheet{width:100%;max-width:560px;height:100%;display:flex;flex-direction:column;background:#f4f8fc;color:#183447;font-family:inherit}
    @media (min-width:701px){.psb{align-items:center;padding:24px}.psb-sheet{height:auto;max-height:92vh;border-radius:22px;overflow:hidden}}
    .psb-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:calc(16px + env(safe-area-inset-top,0px)) 18px 14px;background:#fff;border-bottom:1px solid #dbe7f3}
    .psb-eyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:.12em;color:#1f63b8}
    .psb-head h2{margin:2px 0 0;font-size:22px;font-weight:800}
    .psb-close{all:unset;flex:none;width:44px !important;height:44px !important;border-radius:14px !important;border:1px solid #c9d9ea !important;background:#fff !important;color:#2a5d8f !important;display:flex !important;align-items:center !important;justify-content:center !important;box-sizing:border-box !important;cursor:pointer}
    .psb-body{flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;display:flex;flex-direction:column;gap:14px}
    .psb-toggle{display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;background:#fff;border:1px solid #dbe7f3;cursor:pointer}
    .psb-toggle input{width:22px;height:22px;flex:none;accent-color:#1f7bc2}
    .psb-toggle span{display:flex;flex-direction:column;gap:2px}
    .psb-toggle strong{font-size:15px}.psb-toggle small{font-size:12px;font-weight:600;color:#5b6f82}
    .psb-label{display:block;margin-bottom:6px;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#46617d}
    .psb-preview{margin-top:6px;padding:10px 14px;border-radius:10px;background:#f5ab40;color:#fff;font:700 14px/1.35 Arial,sans-serif;text-align:center}
    .psb-preview-wrap[hidden]{display:none}
    .psb-msg{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:14px;background:#fff;border:1px solid #dbe7f3}
    .psb-msg-head{display:flex;align-items:center;justify-content:space-between}
    .psb-msg-head strong{font-size:15px}
    .psb-field{display:flex;flex-direction:column;gap:6px;min-width:0;margin:0}
    .psb-field>span{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#46617d}
    .psb-field small{font-size:11px;font-weight:600;letter-spacing:0;text-transform:none;color:#8293a2}
    .psb textarea,.psb input[type=text]{display:block !important;width:100% !important;box-sizing:border-box !important;margin:0 !important;padding:10px 12px !important;border:1px solid #c9d9ea !important;border-radius:12px !important;background:#fff !important;color:#183447 !important;font-family:inherit !important;font-size:16px !important;font-weight:600 !important;box-shadow:none !important;resize:vertical}
    .psb input[type=text]{height:46px !important}
    .psb textarea:focus,.psb input[type=text]:focus{outline:none !important;border-color:#1f7bc2 !important;box-shadow:0 0 0 3px rgba(31,123,194,.15) !important}
    .psb-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:8px}
    .psb-row .psb-field>span{min-height:30px;display:flex;flex-wrap:wrap;align-items:flex-end;gap:0 4px;line-height:1.2}
    .psb-chips{display:flex;flex-wrap:wrap;gap:6px}
    .psb-chip,.psb-link-btn,.psb-add{all:unset;cursor:pointer;box-sizing:border-box !important;font-family:inherit !important;font-weight:800 !important}
    .psb-chip{padding:8px 12px !important;border-radius:999px !important;background:#e9f2fb !important;color:#1f63b8 !important;font-size:13px !important}
    .psb-link-btn{color:#b3261e !important;font-size:13px !important;padding:6px !important}
    .psb-add{display:flex !important;align-items:center !important;justify-content:center !important;height:46px !important;border-radius:14px !important;border:1.5px dashed #9cc3e4 !important;background:#f4f9fd !important;color:#1f63b8 !important;font-size:15px !important}
    .psb-note{margin:0;font-size:14px;font-weight:700;color:#8b2518}.psb-note:empty{display:none}
    .psb-foot{display:flex;gap:8px;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #dbe7f3}
    .psb-foot button{all:unset;display:flex !important;align-items:center !important;justify-content:center !important;height:50px !important;padding:0 16px !important;border-radius:14px !important;font-family:inherit !important;font-size:16px !important;font-weight:800 !important;box-sizing:border-box !important;cursor:pointer}
    .psb-foot .psb-save{flex:1 1 auto !important;background:#1f7bc2 !important;color:#fff !important}
    .psb-foot .psb-cancel{background:#fff !important;border:1px solid #c9d9ea !important;color:#2a5d8f !important}
    .psb-foot button:disabled{opacity:.6}
    .psb-toast{position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:10070;max-width:90vw;padding:12px 18px;border-radius:14px;background:#173a4d;color:#fff;font-family:inherit;font-size:15px;font-weight:700;line-height:1.3;box-shadow:0 6px 20px rgba(0,0,0,.25);text-align:center}`;

    function init() {
        const st = document.createElement('style');
        st.textContent = css;
        document.head.appendChild(st);
        // The More screen is built by admin.js; add the card once it exists.
        const observer = new MutationObserver(() => {
            mountCard();
            if (document.getElementById('admin-open-site-banner')) observer.disconnect();
        });
        mountCard();
        if (!document.getElementById('admin-open-site-banner')) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
