/* ========================================
   CANCELLED VISITS ON THE SCHEDULE
   ========================================
   Keeps cancelled visits on the Schedule as a record,
   but makes them clearly cancelled:
   - red "Cancelled" pill and red X badge
   - "Visit Cancelled" panel (with the cancellation
     reason/time when available) instead of Check In
   - moved below the active visits for that day
   - day count shows active visits, e.g. "6 services · 1 cancelled"

   Load this AFTER admin.js. Works on the website/PWA
   and inside the Android app.
   ======================================== */
(() => {
 const isCancelled = visit =>
  String(visit?.status || '').trim().toLowerCase() === 'cancelled';

 const esc = value =>
  typeof escapeHtml === 'function'
   ? escapeHtml(value)
   : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

 // ---------- styles ----------
 const style = document.createElement('style');
 style.textContent = `
  .admin-service-card.admin-service-card-cancelled {
   border-color: #f3c4c0;
   background: #fffafa;
  }
  .service-status.service-status-cancelled {
   color: #c62828;
   background: #fdecea;
   border-color: #f3c4c0;
  }
  .admin-visit-progress-icon.admin-visit-progress-cancelled {
   color: #c62828;
   background: #fdecea;
   border-color: #f3c4c0;
  }
  .admin-service-card .admin-visit-progress.admin-visit-progress-cancelled-panel {
   background: #fdecea;
   border-color: #f3c4c0;
  }
  .admin-service-card .admin-visit-progress-cancelled-panel .admin-visit-progress-copy strong {
   color: #c62828;
  }
 `;
 document.head.appendChild(style);

 // ---------- progress state ----------
 if (typeof getVisitProgressInfo === 'function') {
  const originalProgress = getVisitProgressInfo;
  getVisitProgressInfo = function (visit, ...rest) {
   if (isCancelled(visit)) {
    return { state: 'cancelled', checkedInAt: visit.checked_in_at || null, completedAt: null, minutes: null };
   }
   return originalProgress.call(this, visit, ...rest);
  };
 }

 // ---------- red X badge ----------
 if (typeof buildVisitProgressIcon === 'function') {
  const originalIcon = buildVisitProgressIcon;
  buildVisitProgressIcon = function (progress, ...rest) {
   if (progress?.state === 'cancelled') {
    return `
     <div class="admin-visit-progress-icon admin-visit-progress-cancelled" title="Visit cancelled" aria-label="Visit cancelled">
      ✕
     </div>`;
   }
   return originalIcon.call(this, progress, ...rest);
  };
 }

 // ---------- "Visit Cancelled" panel instead of Check In ----------
 if (typeof buildAdminVisitProgressSection === 'function') {
  const originalSection = buildAdminVisitProgressSection;
  buildAdminVisitProgressSection = function (visit, progress, ...rest) {
   if (progress?.state === 'cancelled' || isCancelled(visit)) {
    const reason = String(visit.cancellation_reason || '').trim();
    let when = '';
    if (visit.cancelled_at && typeof formatVisitTimestamp === 'function') {
     try { when = formatVisitTimestamp(visit.cancelled_at) || ''; } catch { when = ''; }
    }
    const details = [reason || 'This visit was cancelled.', when ? `Cancelled ${when}` : '']
     .filter(Boolean)
     .join(' • ');
    return `
     <div class="admin-visit-progress admin-visit-progress-finished admin-visit-progress-cancelled-panel">
      <div class="admin-visit-progress-copy">
       <strong>✕ Visit Cancelled</strong>
       <span>${esc(details)}</span>
      </div>
     </div>`;
   }
   return originalSection.call(this, visit, progress, ...rest);
  };
 }

 // ---------- pill, card style, order and day count ----------
 if (typeof renderAdminDayServices === 'function') {
  const originalRender = renderAdminDayServices;
  renderAdminDayServices = function (...args) {
   const result = originalRender.apply(this, args);
   try {
    const container = document.getElementById('admin-day-services');
    const count = document.getElementById('admin-selected-service-count');
    if (!container) return result;

    const cancelledCards = [];
    container.querySelectorAll(':scope > .admin-service-card[data-schedule-visit-id]').forEach(card => {
     const visit = allVisits.find(item => String(item.id) === card.dataset.scheduleVisitId);
     if (!isCancelled(visit)) return;
     card.classList.add('admin-service-card-cancelled');
     card.classList.remove('admin-service-card-completed', 'admin-service-card-in-progress');
     card.querySelector('.admin-service-statuses .service-status:not(.admin-payment-status)')
      ?.classList.add('service-status-cancelled');
     cancelledCards.push(card);
    });

    // Active visits first, cancelled ones at the bottom of the day.
    cancelledCards.forEach(card => container.appendChild(card));

    if (count && cancelledCards.length) {
     const total = container.querySelectorAll(':scope > .admin-service-card').length;
     const active = Math.max(0, total - cancelledCards.length);
     count.textContent = `${active} ${active === 1 ? 'service' : 'services'} · ${cancelledCards.length} cancelled`;
    }
   } catch (e) {
    console.error('Cancelled visit styling failed', e);
   }
   return result;
  };
 }
})();