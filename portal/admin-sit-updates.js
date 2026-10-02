/* Paws in Stride — Pet Sitting live updates (admin side).
   Load AFTER admin.js. Adds a "Send Sit Update" button to the visit popup while a
   pet sit is checked in, and an editor just like boarding updates: notes, photos and
   care checkboxes, saved as a draft on this device until sent. Each update notifies
   the client. Uses the database function admin_publish_sit_update. */
(function () {
    'use strict';

    const DB_NAME = 'paws-in-stride-sit-drafts';
    let editor = null;

    const esc = v => (typeof escapeHtml === 'function' ? escapeHtml(v) : String(v ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
    const lower = v => String(v || '').toLowerCase();
    const isSit = v => /pet[\s_-]*sit/.test(lower(`${v?.service_type || ''} ${v?.service_name || ''}`));
    const stamp = value => new Date(value).toLocaleString('en-US', {
        timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    const findVisit = id => (allVisits || []).find(v => Number(v.id) === Number(id));
    const petsOf = visit => (typeof getAdminPetsForVisit === 'function' ? getAdminPetsForVisit(visit) : []) || [];

    function canUpdate(visit) {
        if (!visit || !isSit(visit) || lower(visit.status) === 'cancelled' || !visit.checked_in_at) return false;
        if (!visit.completed_at) return true;
        return Date.now() - Date.parse(visit.completed_at) < 12 * 3600 * 1000;
    }

    /* ---------- drafts on this device (IndexedDB keeps photo blobs) ---------- */
    function store(action, key, value) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'key' });
            request.onerror = () => reject(new Error('The sit update draft could not be saved on this device.'));
            request.onblocked = () => reject(new Error('Close other portal tabs and try again.'));
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('drafts', action === 'get' ? 'readonly' : 'readwrite');
                const os = tx.objectStore('drafts');
                const op = action === 'get' ? os.get(key) : action === 'delete' ? os.delete(key) : os.put(value);
                tx.oncomplete = () => { db.close(); resolve(op.result); };
                tx.onerror = tx.onabort = () => { db.close(); reject(new Error('The draft could not be saved. Check storage on this device.')); };
            };
        });
    }

    function newDraft(state) {
        return {
            key: `${currentUser.id}:sit:${state.visit.id}`,
            request_id: crypto.randomUUID(),
            visit_id: Number(state.visit.id),
            notes: '',
            care: petsOf(state.visit).map(p => ({ pet_id: Number(p.id), fed: false, fresh_water: false, pee: false, poop: false })),
            photos: [],
            locked: false
        };
    }
    function save(state) {
        const snap = structuredClone(state.draft);
        state.chain = (state.chain || Promise.resolve()).catch(() => {}).then(() => store('put', snap.key, snap));
        return state.chain;
    }
    function msg(state, text) {
        const t = state.dialog.querySelector('[data-boarding-message]');
        if (t) t.textContent = text;
    }
    function collect(state) {
        if (state.draft.locked) return;
        state.draft.notes = state.dialog.querySelector('[data-boarding-notes]').value;
        for (const care of state.draft.care) {
            for (const flag of ['fed', 'fresh_water', 'pee', 'poop']) {
                care[flag] = state.dialog.querySelector(`[data-boarding-pet="${care.pet_id}"][data-boarding-care="${flag}"]`)?.checked || false;
            }
        }
    }
    function controls(state) {
        state.dialog.querySelector('[data-boarding-fields]').disabled = state.busy || state.draft.locked;
        state.dialog.querySelector('[data-boarding-close]').disabled = state.busy;
        const send = state.dialog.querySelector('[data-boarding-send]');
        send.disabled = state.busy;
        send.textContent = state.busy ? 'Sending…' : state.draft.locked ? 'Retry Send' : 'Send Sit Update';
    }
    function renderPhotos(state) {
        for (const url of state.urls || []) URL.revokeObjectURL(url);
        state.urls = [];
        state.dialog.querySelector('[data-boarding-photo-previews]').innerHTML = state.draft.photos.map(photo => {
            const url = URL.createObjectURL(photo.blob);
            state.urls.push(url);
            return `<div class="boarding-photo-preview"><img src="${esc(url)}" alt="Selected photo">
                <button type="button" data-sit-remove-photo="${photo.id}" aria-label="Remove photo" ${state.draft.locked ? 'disabled' : ''}>×</button></div>`;
        }).join('');
    }
    function renderForm(state) {
        const pets = petsOf(state.visit);
        state.dialog.querySelector('[data-boarding-compose]').innerHTML = `
            <fieldset data-boarding-fields>
                <label class="boarding-field-label" for="sit-update-notes">Update notes</label>
                <textarea id="sit-update-notes" data-boarding-notes maxlength="5000" rows="4"
                    placeholder="How is their pet doing?">${esc(state.draft.notes)}</textarea>
                <details class="boarding-care-details" open>
                    <summary>Care details (optional)</summary>
                    ${state.draft.care.map(care => `<div class="boarding-care-pet">
                        <strong>${esc(pets.find(p => Number(p.id) === care.pet_id)?.name || 'Pet')}</strong>
                        <div class="boarding-care-options">
                            ${[['fed', 'Fed'], ['fresh_water', 'Fresh water'], ['pee', 'Pee'], ['poop', 'Poop']].map(([f, l]) =>
                                `<label><input type="checkbox" data-boarding-pet="${care.pet_id}" data-boarding-care="${f}" ${care[f] ? 'checked' : ''}> ${l}</label>`).join('')}
                        </div></div>`).join('') || '<p>No pets are attached to this visit.</p>'}
                </details>
                <label class="boarding-field-label" for="sit-update-photos">Photos</label>
                <input id="sit-update-photos" data-boarding-photo-input type="file" accept="image/jpeg,image/png,image/webp" multiple>
                <small>Up to 12 photos, 10 MB each. JPEG, PNG or WebP.</small>
                <div class="boarding-photo-grid" data-boarding-photo-previews></div>
            </fieldset>
            <p class="boarding-editor-message" data-boarding-message role="status" aria-live="polite"></p>
            <button type="submit" class="primary-button" data-boarding-send>Send Sit Update</button>`;
        renderPhotos(state);
        controls(state);
        if (state.draft.locked) msg(state, 'An earlier send needs to be retried. Its content is kept unchanged so retrying cannot create a second copy.');
    }

    async function loadHistory(state) {
        const mount = state.dialog.querySelector('[data-boarding-history]');
        mount.textContent = 'Loading updates…';
        try {
            const { data, error } = await supabaseClient.from('visit_updates')
                .select('id, notes, published_at, visit_update_photos(id, storage_path, sort_order), visit_update_pet_care(pet_id, fed, fresh_water, pee, poop)')
                .eq('visit_id', state.visit.id).not('published_at', 'is', null)
                .order('published_at', { ascending: false });
            if (error) throw error;
            const rows = await Promise.all((data || []).map(async row => ({
                ...row,
                photos: await Promise.all((row.visit_update_photos || []).sort((a, b) => a.sort_order - b.sort_order).map(async photo => {
                    const r = await supabaseClient.storage.from(VISIT_MEDIA_BUCKET).createSignedUrl(photo.storage_path, 3600);
                    return { ...photo, url: r.error ? null : r.data?.signedUrl };
                }))
            })));
            if (editor !== state) return;
            mount.innerHTML = rows.map(row => `<article class="boarding-saved-update">
                <strong>${esc(stamp(row.published_at))}</strong>
                ${row.notes ? `<p class="boarding-update-note">${esc(row.notes)}</p>` : ''}
                ${(row.visit_update_pet_care || []).map(care => {
                    const flags = [['fed', 'Fed'], ['fresh_water', 'Fresh water'], ['pee', 'Pee'], ['poop', 'Poop']].filter(([k]) => care[k]).map(([, l]) => l);
                    return flags.length ? `<p><strong>${esc((allPets || []).find(p => Number(p.id) === Number(care.pet_id))?.name || 'Pet')}:</strong> ${esc(flags.join(' · '))}</p>` : '';
                }).join('')}
                <div class="boarding-photo-grid">${row.photos.map(p => p.url
                    ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(p.url)}" alt="Sit photo" loading="lazy"></a>`
                    : '<span>Photo unavailable</span>').join('')}</div>
            </article>`).join('') || '<p>No updates sent for this sit yet.</p>';
        } catch (error) {
            console.error('Sit update history error:', error);
            if (editor === state) mount.textContent = 'Updates could not be loaded. Close and reopen this window to retry.';
        }
    }

    async function close(state) {
        if (state.busy) return;
        try {
            collect(state);
            await save(state);
            state.dialog.close();
            state.dialog.remove();
            for (const url of state.urls || []) URL.revokeObjectURL(url);
            if (editor === state) editor = null;
        } catch (error) { msg(state, error.message); }
    }

    async function addPhotos(state, files) {
        if (state.busy || state.draft.locked) return;
        collect(state);
        state.busy = true;
        controls(state);
        try {
            if (state.draft.photos.length + files.length > 12) throw new Error('Use up to 12 photos per update.');
            for (const file of files) {
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
                    throw new Error('Choose JPEG, PNG or WebP photos no larger than 10 MB each.');
                }
            }
            for (const file of files) {
                msg(state, `Preparing ${file.name}…`);
                const { displayBlob } = await buildVisitPhotoVersions(file);
                const id = crypto.randomUUID();
                state.draft.photos.push({
                    id, name: file.name, blob: displayBlob,
                    path: `${state.draft.visit_id}/sit-${state.draft.request_id}-${id}.jpg`, uploaded: false
                });
                await save(state);
            }
            msg(state, 'Photos added to your draft.');
        } catch (error) {
            msg(state, error.message || 'A photo could not be prepared. Try another image.');
        } finally {
            state.busy = false;
            state.dialog.querySelector('[data-boarding-photo-input]').value = '';
            renderPhotos(state);
            controls(state);
        }
    }

    async function send(state) {
        if (state.busy) return;
        collect(state);
        state.busy = true;
        controls(state);
        let published = false;
        try {
            if (!navigator.onLine) throw new Error("You're offline. Your draft stays on this device; reconnect and send it again.");
            if (!state.draft.notes.trim() && !state.draft.photos.length &&
                !state.draft.care.some(c => c.fed || c.fresh_water || c.pee || c.poop)) {
                throw new Error('Add a note, photo or care update first.');
            }
            // Freeze content before the first upload so a retry sends the identical update.
            state.draft.locked = true;
            await save(state);
            for (let i = 0; i < state.draft.photos.length; i++) {
                const photo = state.draft.photos[i];
                if (photo.uploaded) continue;
                msg(state, `Uploading photo ${i + 1} of ${state.draft.photos.length}…`);
                const { error } = await supabaseClient.storage.from(VISIT_MEDIA_BUCKET)
                    .upload(photo.path, photo.blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
                if (error && String(error.statusCode || error.status) !== '409' && !/already exists|duplicate/i.test(error.message || '')) throw error;
                photo.uploaded = true;
                await save(state);
            }
            msg(state, 'Saving sit update…');
            const { data, error } = await supabaseClient.rpc('admin_publish_sit_update', {
                p_visit_id: state.draft.visit_id,
                p_request_id: state.draft.request_id,
                p_notes: state.draft.notes.trim(),
                p_pet_care: state.draft.care,
                p_photos: state.draft.photos.map(p => ({ storage_path: p.path, caption: '' }))
            });
            if (error) throw error;
            if (!data?.id || !data.published_at) throw new Error('The save could not be confirmed. Retry Send to check it safely.');
            published = true;
            await store('delete', state.draft.key);
            state.draft = newDraft(state);
            await save(state);
            renderForm(state);
            msg(state, 'Sit update sent ✓ The client was notified. Add another whenever you like.');
            await loadHistory(state);
        } catch (error) {
            console.error('Sit update save error:', error);
            msg(state, published
                ? 'Your update was sent, but the local draft could not be reset. Close and reopen this window before the next update.'
                : `${error.message || 'The update could not be sent.'} Your draft is kept on this device.`);
        } finally {
            state.busy = false;
            controls(state);
        }
    }

    async function open(visitId) {
        if (editor) { editor.dialog.focus(); return; }
        const visit = findVisit(visitId);
        if (!canUpdate(visit)) throw new Error('Check in to the sit first. Updates can be sent during the sit and up to 12 hours after.');

        const dialog = document.createElement('dialog');
        dialog.className = 'boarding-update-dialog pis-sit-dialog';
        dialog.setAttribute('aria-labelledby', 'sit-editor-title');
        const state = { dialog, visit, busy: false, urls: [] };
        state.draft = await store('get', `${currentUser.id}:sit:${visit.id}`) || newDraft(state);

        // A lost response may have published the locked draft already.
        if (state.draft.locked && navigator.onLine) {
            const check = await supabaseClient.from('visit_updates').select('id, published_at')
                .eq('request_id', state.draft.request_id).maybeSingle();
            if (!check.error && check.data?.published_at) {
                state.draft = newDraft(state);
                await save(state);
            }
        }

        dialog.innerHTML = `
            <header class="boarding-editor-header">
                <div><small>PAWS IN STRIDE</small><h2 id="sit-editor-title">Pet sitting update</h2>
                    <p>${esc(petsOf(visit).map(p => p.name).join(' & ') || 'Pet update')} · ${esc(visit.time_window || '')}</p></div>
                <button type="button" data-boarding-close aria-label="Close sit updates">×</button>
            </header>
            <div class="boarding-editor-body">
                <p class="boarding-draft-help">Drafts stay on this device until sent. Send as many updates during the sit as you like. Each one notifies the client.</p>
                <form data-boarding-compose></form>
                <h3>Updates for this sit</h3>
                <div data-boarding-history></div>
            </div>`;
        document.body.appendChild(dialog);
        editor = state;
        renderForm(state);
        dialog.addEventListener('cancel', e => { e.preventDefault(); void close(state); });
        dialog.querySelector('[data-boarding-close]').addEventListener('click', () => void close(state));
        dialog.querySelector('[data-boarding-compose]').addEventListener('submit', e => { e.preventDefault(); void send(state); });
        dialog.addEventListener('input', e => {
            if (!e.target.matches('[data-boarding-notes], [data-boarding-care]')) return;
            collect(state);
            void save(state).catch(err => msg(state, err.message));
        });
        dialog.addEventListener('change', e => {
            if (e.target.matches('[data-boarding-photo-input]')) void addPhotos(state, Array.from(e.target.files || []));
        });
        dialog.addEventListener('click', async e => {
            const remove = e.target.closest('[data-sit-remove-photo]');
            if (!remove || state.busy || state.draft.locked) return;
            collect(state);
            state.draft.photos = state.draft.photos.filter(p => p.id !== remove.dataset.sitRemovePhoto);
            renderPhotos(state);
            try { await save(state); } catch (err) { msg(state, err.message); }
        });
        dialog.showModal();
        if (navigator.onLine) void loadHistory(state);
        else state.dialog.querySelector('[data-boarding-history]').textContent = "You're offline. Earlier updates will show when you reconnect.";
    }

    /* ---------- the button (used by the visit popup and the classic card) ---------- */
    window.buildAdminSitUpdateButton = function (visit) {
        if (!canUpdate(visit)) return null;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'primary-button admin-visit-action-button pis-sit-update-button';
        b.dataset.sitUpdateVisit = String(visit.id);
        b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg> Send Sit Update';
        return b;
    };
    window.openAdminSitUpdateEditor = open;

    document.addEventListener('click', async e => {
        const button = e.target.closest('[data-sit-update-visit]');
        if (!button || button.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        button.disabled = true;
        try { await open(button.dataset.sitUpdateVisit); }
        catch (error) { console.error('Sit update editor error:', error); alert(error.message || 'Sit updates could not be opened.'); }
        finally { if (button.isConnected) button.disabled = false; }
    }, true);

    const style = document.createElement('style');
    style.textContent = `
        .pis-sit-update-button{display:flex !important;align-items:center !important;justify-content:center !important;gap:8px !important;background:linear-gradient(135deg,#d6467f,#b8336a) !important;border:0 !important;color:#fff !important}
        .pis-sit-dialog .boarding-editor-header{background:linear-gradient(135deg,#d6467f,#b8336a) !important}
        .pis-sit-dialog [data-boarding-send]{background:linear-gradient(135deg,#d6467f,#b8336a) !important;border-color:#b8336a !important;box-shadow:0 8px 18px rgba(184,51,106,.22) !important}`;
    document.head.appendChild(style);
})();
