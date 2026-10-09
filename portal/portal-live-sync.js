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
    const deferred = new Map();
    const visible = el => !!el && !el.hidden && el.getClientRects().length > 0;
    const userId = () => typeof currentUser !== 'undefined' ? currentUser?.id : null;
    const isAdmin = () => document.body.classList.contains('admin-page');
    function editing(selector = null) {
        if (!selector && typeof activeVisitReportVisitId !== 'undefined' && activeVisitReportVisitId) return true;
        const roots = selector ? [...document.querySelectorAll(selector)] : [document];
        return roots.some(root => [...root.querySelectorAll('input:not([type="hidden"]), textarea, select, [contenteditable="true"]')]
            .some(el => visible(el) && !el.readOnly &&
                !el.matches('[type="search"], [data-live-filter], #client-message-input, #admin-message-input') &&
                !/search|filter/i.test(el.id || '')));
    }
    function deferForms(selector = null, topic = '*') {
        if (!editing(selector)) return false;
        deferred.set(JSON.stringify(['forms', selector, topic]), {kind: 'forms', selector, topic});
        return true;
    }
    function deferVisible(selector, topic = '*') {
        if (![...document.querySelectorAll(selector)].some(visible)) return false;
        deferred.set(JSON.stringify(['visible', selector, topic]), {kind: 'visible', selector, topic});
        return true;
    }
    function releaseDeferred() {
        for (const [key, item] of deferred) {
            const blocked = item.kind === 'forms' ? editing(item.selector) :
                [...document.querySelectorAll(item.selector)].some(visible);
            if (!blocked) {
                deferred.delete(key);
                queue(item.topic);
            }
        }
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
                if (!stillCurrent()) { batch.forEach(t => pending.add(t)); break; }
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
        queue, editing, deferForms, deferVisible,
        status: () => ({owner, running, pending: [...pending], errors, lastFinished,
            channelState: channel?.state || 'not connected', deferredForForm: deferred.size > 0})
    };
    window.addEventListener('online', () => queue('*'));
    window.addEventListener('focus', () => queue('*'));
    window.addEventListener('pageshow', () => queue('*'));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) queue('*'); });
    document.addEventListener('focusout', () => { releaseDeferred(); if (pending.size) queue('resume'); });
    document.addEventListener('click', () => { releaseDeferred(); if (pending.size && !timer && !running) timer = setTimeout(flush, 600); });
    setInterval(() => {
        if (!document.hidden && navigator.onLine && userId()) {
            releaseDeferred();
            if (Date.now() - lastFinished >= 30000) queue('*');
            else if (pending.size) queue('resume');
        }
    }, 3000);
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.onAuthStateChange((event) => {
            // Do not await Supabase calls inside its auth callback.
            if (event === 'SIGNED_OUT') {
                generation++; owner = null; pending.clear(); deferred.clear();
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
    // Separate jobs: a failed/deferred view cannot stop the other views.
    const on = (name, topics, action) => sync.register(name, async c => {
        if (c.has(...topics)) await action(c);
    });

    if (admin) {
        on('admin business data', ['profiles', 'pets', 'households', 'property_access',
            'visits', 'visit_pets', 'visit_reports', 'visit_walks'], async () => {
            await refreshAdminBusinessData();
        });
        on('admin boarding stays', ['boarding_stays', 'visits'], async () => {
            await loadAdminBoardingStays(true);
        });
        on('admin driving and financials', ['admin_route_drive_estimates', 'visits', 'visit_walks'], async c => {
            await refreshAdminDriveEstimates(true);
            if (!c.stillCurrent()) return;
            await call('refreshAdminLiveFinancials');
            if (!c.stillCurrent()) return;
            await call('refreshAdminLiveLifetimeStats');
        });
        on('admin messages', ['messages', 'conversations', 'profiles'], async c => {
            await loadAdminConversations();
            if (c.stillCurrent() && activeAdminConversationId) await loadActiveAdminMessages();
        });
        on('admin boarding history', ['boarding_updates', 'boarding_update_photos', 'boarding_update_pet_care'], async c => {
            if (typeof adminBoardingEditor !== 'undefined' && adminBoardingEditor && !adminBoardingEditor.busy) {
                await c.preserveScroll(adminBoardingEditor.dialog.querySelector('.boarding-editor-body'),
                    () => loadAdminBoardingUpdateHistory(adminBoardingEditor));
            }
        });
        on('admin sitting history', ['visit_updates', 'visit_update_photos', 'visit_update_pet_care'], async () => {
            await call('refreshAdminLiveSitHistory');
        });
        on('admin client credit', ['client_credit_ledger'], async c => {
            const button = document.getElementById('admin-client-credit-add');
            const detail = document.getElementById('admin-client-household-detail');
            const id = button?.dataset.clientId;
            if (!id || !c.visible(detail)) return;
            const {data, error} = await supabaseClient.rpc('get_admin_client_credit_balance', {p_client_id: id});
            if (error) throw error;
            if (c.stillCurrent() && button.dataset.clientId === id) {
                const amount = document.getElementById('admin-client-household-credit');
                if (amount) amount.textContent = Number(data || 0).toLocaleString('en-US', {style:'currency', currency:'USD'});
            }
        });
        on('admin pricing', ['service_prices'], async () => {
            if (!sync.deferForms('#admin-services-pricing-modal', 'service_prices')) await loadAdminServicePricing(true);
        });
        on('admin preferences', ['admin_notification_preferences'], async () => {
            if (!sync.deferForms('#admin-push-notifications-modal', 'admin_notification_preferences')) await loadAdminPushPreferences(true);
        });
    } else if (document.getElementById('dashboard-content')) {
        scheduleClientVisitRealtimeRefresh = () => sync.queue('visits');
        scheduleClientWalkRealtimeRefresh = () => sync.queue('visit_walks');
        catchUpClientPortal = () => sync.queue('*');
        refreshClientDataForNotification = async () => { sync.queue('*'); };

        on('client household display', ['profiles', 'households', 'property_access'], async () => {
            await refreshHousehold(); // Updates display elements, not household form inputs.
        });
        on('client visits', ['visits', 'visit_pets', 'boarding_stays', 'visit_reports'], async () => {
            await refreshUpcomingVisits();
        });
        on('client live walks', ['visit_walks', 'visits'], async () => {
            await refreshClientLiveWalks();
        });
        on('client pets', ['pets', 'visits', 'visit_pets', 'visit_walks', 'visit_photos', 'visit_reports', 'visit_report_pet_care'], async c => {
            await refreshPets(true);
            if (!c.stillCurrent() || sync.deferVisible('.client-report-lightbox-visible', 'visit_photos')) return;
            if (document.getElementById('pet-gallery') && petGalleryPetId != null) {
                petGalleryPage = Math.min(petGalleryPage, Math.max(0,
                    Math.ceil(getPetPhotos(petGalleryPetId).length / PET_GALLERY_PAGE_SIZE) - 1));
                await c.preserveScroll(document.getElementById('pet-gallery-body'), renderPetGalleryPage);
            }
        });
        on('client account credit', ['client_credit_ledger', 'profiles'], async () => { await renderAccountCredit(); });
        on('client notifications', ['client_notifications'], async () => { await loadClientNotifications(); });
        on('client pricing', ['service_prices', 'profiles'], async () => { await loadMyServicePrices(); });
        on('client preferences', ['client_notification_preferences'], async () => {
            if (!sync.deferForms('#client-notifications-modal', 'client_notification_preferences')) await loadClientNotificationPreferences(true);
        });
        on('client messages', ['messages', 'conversations'], async () => {
            if (clientConversation) await loadClientMessages(); // Message list only; keep the draft textarea.
        });
        on('client boarding updates', ['boarding_stays', 'boarding_updates', 'boarding_update_photos', 'boarding_update_pet_care', 'visit_walks'], async c => {
            await loadClientBoardingData(true);
            if (!c.stillCurrent() || sync.deferVisible('.client-report-lightbox-visible', 'boarding_updates')) return;
            const state = clientBoardingViewer;
            if (!state || state.busy || state.walkBusy) return;
            const current = clientBoardingData.stays.find(s => s.id === state.stay.id);
            if (current) state.stay = current;
            const status = state.dialog.querySelector('.client-boarding-dialog-body > p');
            if (status) status.textContent = state.stay.status === 'active' ? 'Boarding with us' :
                state.stay.status === 'completed' ? 'Boarding complete' : 'Boarding scheduled';
            await c.preserveScroll(state.dialog.querySelector('.client-boarding-dialog-body'), async () => {
                await loadClientBoardingFeed(state, true);
                if (c.stillCurrent() && c.has('visit_walks', 'boarding_stays')) await loadClientBoardingWalks(state, true);
            });
        });
        on('client sitting updates', ['visit_updates', 'visit_update_photos', 'visit_update_pet_care', 'visits'], async () => {
            if (!sync.deferVisible('.client-report-lightbox-visible', 'visit_updates')) await call('refreshClientLiveSitFeed');
        });
        on('client report viewer', ['visit_reports', 'visit_report_pet_care', 'visit_photos', 'visit_walks', 'visits'], async c => {
            if (sync.deferVisible('.client-report-lightbox-visible, .client-cancellation-modal', 'visit_reports')) return;
            if (!activeClientVisitReportId) return;
            const id = activeClientVisitReportId;
            const button = document.querySelector(`[data-client-visit-report-open="${Number(id)}"]`);
            if (button) await c.preserveScroll(button.closest('.csd-body'),
                () => toggleClientVisitReport(id, button, {refresh: true}));
        });
        sync.register('client home and cache', async c => {
            await renderMobileHomeDashboard();
            if (c.stillCurrent() && typeof saveClientFastStart === 'function') saveClientFastStart();
        });
    }
})();
