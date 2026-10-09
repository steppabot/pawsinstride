/* PAWS IN STRIDE — LIVE DATA COORDINATOR
   Load after the portal/admin scripts and their feature modules.
   Events are invalidation hints only. All data is re-read through existing RLS.
   This module never starts/stops GPS, recalculates routes, or submits forms. */
(() => {
    if (window.PawsLiveSync) return;
    const tables = [
        'profiles', 'pets', 'households', 'property_access', 'visits', 'visit_pets',
        'visit_reports', 'visit_photos', 'visit_report_pet_care', 'visit_walks',
        'boarding_stays', 'boarding_updates', 'boarding_update_photos', 'boarding_update_pet_care',
        'visit_updates', 'visit_update_photos', 'visit_update_pet_care', 'client_credit_ledger',
        'client_notifications', 'conversations', 'messages', 'admin_route_drive_estimates',
        'service_prices', 'admin_notification_preferences', 'client_notification_preferences'
    ];
    let channel = null, owner = null, timer = null, running = false, stopped = false;
    let pending = new Set(), generation = 0, errors = 0, lastFinished = 0;
    const views = new Map();
    const visible = el => !!el && !el.hidden && el.getClientRects().length > 0;
    const userId = () => typeof currentUser !== 'undefined' ? currentUser?.id : null;
    const isAdmin = () => document.body.classList.contains('admin-page');
    function editing() {
        if (document.querySelector('.client-report-lightbox-visible, .client-cancellation-modal')) return true;
        if (typeof activeVisitReportVisitId !== 'undefined' && activeVisitReportVisitId) return true;
        // Read-only views remain live. Forms are deferred until closed/saved.
        return [...document.querySelectorAll('input:not([type="hidden"]), textarea, select, [contenteditable="true"]')]
            .some(el => visible(el) && !el.disabled && !el.readOnly &&
                !el.matches('[type="search"], [data-live-filter]') &&
                !(el.id === 'admin-client-household-pricing-tier' && document.activeElement !== el) &&
                !/search|filter/i.test(el.id || ''));
    }
    function queue(topic = '*') {
        pending.add(topic);
        if (!timer && !running && !stopped) timer = setTimeout(flush, Math.max(500, 3000 - (Date.now() - lastFinished)));
    }
    async function dropChannel() {
        const old = channel;
        channel = null;
        if (old) await supabaseClient.removeChannel(old);
    }
    async function flush() {
        timer = null;
        if (running || stopped || document.hidden || !navigator.onLine || !userId()) return;
        const content = document.getElementById?.(isAdmin() ? 'admin-content' : 'dashboard-content');
        if (content && !visible(content)) return;
        if (editing()) return; // Pending topics retained; foreground tick retries.
        running = true;
        const batch = new Set(pending); pending.clear();
        const id = userId(), epoch = generation;
        const stillCurrent = () => !stopped && generation === epoch && userId() === id;
        try {
            const {data, error} = await supabaseClient.auth.getSession();
            if (error) throw error;
            if (data?.session?.user?.id !== id || !stillCurrent()) return;
            if (owner !== id) {
                await dropChannel(); owner = id;
                channel = supabaseClient.channel(`portal-live-v1-${isAdmin() ? 'admin' : 'client'}-${id}`);
                for (const table of tables) channel.on('postgres_changes', {
                    event: '*', schema: 'public', table
                }, () => queue(table));
                channel.subscribe(status => {
                    if (status === 'SUBSCRIBED') queue('*');
                    if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
                        console.warn('Live connection:', status, '— foreground backup remains active.');
                    }
                });
                batch.add('*');
            }
            const context = {
                topics: batch,
                has: (...names) => batch.has('*') || names.some(n => batch.has(n)),
                stillCurrent,
                visible,
                preserveScroll: async (element, action) => {
                    const top = element?.scrollTop, left = element?.scrollLeft;
                    await action();
                    if (element?.isConnected && stillCurrent()) { element.scrollTop = top; element.scrollLeft = left; }
                }
            };
            for (const [name, view] of views) {
                if (!stillCurrent() || editing()) { batch.forEach(t => pending.add(t)); break; }
                try { await view(context); }
                catch (error) { batch.forEach(t => pending.add(t)); console.error(`Live refresh (${name}):`, error); errors++; }
            }
            lastFinished = Date.now();
        } catch (error) {
            batch.forEach(t => pending.add(t)); errors++;
            console.error('Live refresh:', error);
        } finally {
            running = false;
            // Retry failures on the bounded timer, never a hot retry loop.
        }
    }
    window.PawsLiveSync = {
        register(name, fn) { views.set(name, fn); queue('*'); },
        queue, editing,
        status: () => ({owner, running, pending: [...pending], errors, lastFinished,
            channelState: channel?.state || 'not connected', deferredForForm: editing()})
    };
    window.addEventListener('online', () => queue('*'));
    window.addEventListener('focus', () => queue('*'));
    window.addEventListener('pageshow', () => queue('*'));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) queue('*'); });
    document.addEventListener('focusout', () => { if (pending.size) queue('resume'); });
    document.addEventListener('click', () => { if (pending.size && !timer && !running) timer = setTimeout(flush, 600); });
    setInterval(() => {
        if (!document.hidden && navigator.onLine && userId()) {
            if (Date.now() - lastFinished >= 30000) queue('*');
            else if (pending.size && !editing()) queue('resume');
        }
    }, 3000);
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.onAuthStateChange((event) => {
            // Do not await Supabase calls inside its auth callback.
            if (event === 'SIGNED_OUT') {
                generation++; owner = null; pending.clear();
                setTimeout(() => { void dropChannel(); }, 0);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') queue('*');
        });
    }
    queue('*');
})();

// ========================================
// CLIENT AND ADMIN REFRESH ADAPTERS
// ========================================
(() => {
    const sync = window.PawsLiveSync;
    if (!sync) return;
    const admin = document.body.classList.contains('admin-page');
    const call = async (name, ...args) => {
        if (typeof window[name] === 'function') return await window[name](...args);
    };
    if (admin) {
        sync.register('admin data', async c => {
            await refreshAdminBusinessData();
            if (!c.stillCurrent()) return;
            if (c.has('boarding_stays', 'visits')) await loadAdminBoardingStays(true);
            if (c.has('admin_route_drive_estimates', 'visits', 'visit_walks')) {
                await refreshAdminDriveEstimates(true);
                await call('refreshAdminLiveFinancials');
                await call('refreshAdminLiveLifetimeStats');
            }
            if (c.has('messages', 'conversations', 'profiles')) {
                await loadAdminConversations();
                if (activeAdminConversationId) await loadActiveAdminMessages();
            }
            if (c.has('boarding_updates', 'boarding_update_photos', 'boarding_update_pet_care')) {
                if (typeof adminBoardingEditor !== 'undefined' && adminBoardingEditor && !adminBoardingEditor.busy) {
                    await c.preserveScroll(adminBoardingEditor.dialog.querySelector('.boarding-editor-body'),
                        () => loadAdminBoardingUpdateHistory(adminBoardingEditor));
                }
            }
            if (c.has('visit_updates', 'visit_update_photos', 'visit_update_pet_care')) await call('refreshAdminLiveSitHistory');
            if (c.has('client_credit_ledger')) {
                const button = document.getElementById('admin-client-credit-add');
                const detail = document.getElementById('admin-client-household-detail');
                const id = button?.dataset.clientId;
                if (id && c.visible(detail)) {
                    const {data, error} = await supabaseClient.rpc('get_admin_client_credit_balance', {p_client_id: id});
                    if (error) throw error;
                    if (c.stillCurrent() && button.dataset.clientId === id) {
                        const amount = document.getElementById('admin-client-household-credit');
                        if (amount) amount.textContent = Number(data || 0).toLocaleString('en-US', {style:'currency',currency:'USD'});
                    }
                }
            }
            if (c.has('service_prices')) await loadAdminServicePricing();
            if (c.has('admin_notification_preferences')) await loadAdminPushPreferences();
        });
    } else if (document.getElementById('dashboard-content')) {
        // Existing channels keep their normal setup. Their callbacks enter one
        // serialized queue instead of rebuilding the same screen concurrently.
        scheduleClientVisitRealtimeRefresh = () => sync.queue('visits');
        scheduleClientWalkRealtimeRefresh = () => sync.queue('visit_walks');
        catchUpClientPortal = () => sync.queue('*');
        refreshClientDataForNotification = async () => { sync.queue('*'); };
        sync.register('client data', async c => {
            if (c.has('profiles', 'households', 'property_access')) await refreshHousehold();
            if (!c.stillCurrent()) return;
            if (c.has('visits', 'visit_pets', 'boarding_stays', 'visit_reports')) await refreshUpcomingVisits();
            if (!c.stillCurrent()) return;
            if (c.has('visit_walks', 'visits')) await refreshClientLiveWalks();
            if (c.has('pets', 'visits', 'visit_pets', 'visit_walks', 'visit_photos', 'visit_reports', 'visit_report_pet_care')) {
                await refreshPets();
                if (document.getElementById('pet-gallery') && petGalleryPetId != null) {
                    petGalleryPage = Math.min(petGalleryPage, Math.max(0,
                        Math.ceil(getPetPhotos(petGalleryPetId).length / PET_GALLERY_PAGE_SIZE) - 1));
                    await c.preserveScroll(document.getElementById('pet-gallery-body'), renderPetGalleryPage);
                }
            }
            if (!c.stillCurrent()) return;
            if (c.has('client_credit_ledger', 'profiles')) await renderAccountCredit();
            if (c.has('client_notifications')) await loadClientNotifications();
            if (c.has('service_prices', 'profiles')) await loadMyServicePrices();
            if (c.has('client_notification_preferences')) await loadClientNotificationPreferences();
            if (c.has('messages', 'conversations') && clientConversation) await loadClientMessages();
            if (c.has('boarding_stays', 'boarding_updates', 'boarding_update_photos', 'boarding_update_pet_care', 'visit_walks')) {
                await loadClientBoardingData(true);
                const state = clientBoardingViewer;
                if (state && !state.busy && !state.walkBusy) {
                    const current = clientBoardingData.stays.find(s => s.id === state.stay.id);
                    if (current) state.stay = current;
                    const status = state.dialog.querySelector('.client-boarding-dialog-body > p');
                    if (status) status.textContent = state.stay.status === 'active' ? 'Boarding with us' :
                        state.stay.status === 'completed' ? 'Boarding complete' : 'Boarding scheduled';
                    await c.preserveScroll(state.dialog.querySelector('.client-boarding-dialog-body'), async () => {
                        await loadClientBoardingFeed(state, true);
                        if (c.has('visit_walks', 'boarding_stays')) await loadClientBoardingWalks(state, true);
                    });
                }
            }
            if (c.has('visit_updates', 'visit_update_photos', 'visit_update_pet_care', 'visits')) await call('refreshClientLiveSitFeed');
            if (c.has('visit_reports', 'visit_report_pet_care', 'visit_photos', 'visit_walks', 'visits') && activeClientVisitReportId) {
                const id = activeClientVisitReportId;
                const button = document.querySelector(`[data-client-visit-report-open="${Number(id)}"]`);
                if (button) await c.preserveScroll(button.closest('.csd-body'),
                    () => toggleClientVisitReport(id, button, {refresh: true}));
            }
            if (c.stillCurrent()) {
                await renderMobileHomeDashboard();
                if (typeof saveClientFastStart === 'function') saveClientFastStart();
            }
        });
    }
})();
