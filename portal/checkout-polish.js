// ========================================
// CHECKOUT AND BOOKING CONFIRMATION: NEW LOOK (phones and computers)
// ========================================
// The same look as the client app (client-polish.js) for the two pages that come after
// Continue on the booking form: payment.html and success.html. (The Venmo page, which only
// opens in a browser, is not changed.)
// Nothing here changes what the pages do: the same buttons, the same payment fields
// (PayPal's own), the same totals. If this file fails to load, the pages show as before.
//
// 1. HEADER. The orange header with the blended logo and the rounder heading font.
// 2. BOXES. Each card is a white box whose heading is the soft cream band.
// 3. YOUR BOOKING. Each day opens to slim cards (the service's colored edge, the price on
//    the right). "Dog Walking - 30 Minutes" reads "Dog Walking · 30 min", and
//    "Bella + Scout • 2 services" reads "Bella and Scout · 2 Services".
// 4. TOTALS. Plain rows, account credit in green, the amount to pay in its own cream box.
// 5. PAYMENT. Rounded fields and the orange Pay with Card button. Apple Pay, Google Pay,
//    Venmo and PayPal buttons are the providers' own and are left alone.
// 6. A code such as "30_min" no longer shows as its own line on the confirmation page.
// 7. The open day is tinted cream so it stands apart from the closed ones.
//
// Load at the end of the page, AFTER the page's own script.
// ========================================
(() => {
    'use strict';
    if (document.body.classList.contains('pis-ck')) return;
    const logo = document.querySelector('.payment-header-logo, .booking-success-logo');
    const ASSETS = ((logo && logo.getAttribute('src')) || '/portal/assets/x').replace(/[^/]*$/, '');
    const data = svg => `url("data:image/svg+xml,${svg.replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/"/g, "'")}")`;
    const stroke = (body, color, width = 2) => data(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`);
    const RECEIPT = stroke('<path d="M6.500 4h11v16l-2.750-1.800L12 20l-2.750-1.800L6.500 20z"/><path d="M9.500 8.500h5M9.500 12h5"/>', '#F47B20');
    const CARD = stroke('<rect x="3.500" y="6" width="17" height="12" rx="2.400"/><path d="M3.500 10h17M7 14.500h3"/>', '#F47B20');
    const CHEV = stroke('<path d="m6 9.500 6 6 6-6"/>', '#51677F', 2.6);
    const LOCK = stroke('<rect x="5.500" y="10.500" width="13" height="9" rx="2.200"/><path d="M8.500 10.500V8a3.500 3.500 0 0 1 7 0v2.500"/>', '#51677F');
    const CLOCK = stroke('<circle cx="12" cy="12" r="8"/><path d="M12 7.500V12l3 2"/>', '#8A4B0B');

    const style = document.createElement('style');
    style.id = 'pis-checkout-polish';
    style.textContent = `
@font-face { font-family: "Fredoka"; font-weight: 600; font-display: swap; src: url("${ASSETS}fonts/fredoka-600.woff2") format("woff2"); }
body.pis-ck { --cp-display: "Fredoka", ui-rounded, "SF Pro Rounded", system-ui, sans-serif; --cp-text: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --cp-navy: #14304F; --cp-soft: #51677F; --cp-tang: #F47B20; --cp-line: #DCE6EF; --cp-cream: #FFF3E0; --cp-band-line: #F6DFBE; --cp-blue: #1E73BE;
    font-family: var(--cp-text) !important; color: var(--cp-navy); background: #EEF6FB !important; }
@supports (overflow: clip) { body.pis-ck { overflow-x: clip; } }
body.pis-ck .payment-page-container, body.pis-ck .booking-success-shell { margin: 0 auto !important; padding: 0 12px 28px !important; max-width: 1080px; background: none !important; }

/* ----- header ----- */
body.pis-ck .payment-page-header, body.pis-ck .booking-success-header { position: sticky !important; top: 0 !important; z-index: 50 !important; display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 11px !important;
    min-height: 0 !important; height: auto !important; margin: 0 -12px 16px !important; padding: calc(max(8px, env(safe-area-inset-top, 0px)) + 6px) 14px 14px !important; border: 0 !important; border-radius: 0 0 26px 26px !important;
    background: linear-gradient(90deg, #F5AB40 0px, #F5AB40 80px, #F6912A 60%, #F26B21 100%) !important; box-shadow: 0 8px 20px rgba(242,107,33,.22) !important; text-align: left !important; }
body.pis-ck .payment-page-header::before, body.pis-ck .payment-page-header::after, body.pis-ck .booking-success-header::before, body.pis-ck .booking-success-header::after { display: none !important; }
body.pis-ck .payment-header-brand { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 11px !important; flex: 1 1 auto !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; }
body.pis-ck .payment-header-logo, body.pis-ck .booking-success-logo { display: block !important; flex: none !important; width: 58px !important; height: 58px !important; max-width: none !important; margin: -6px -5px !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: none !important;
    -webkit-mask-image: radial-gradient(closest-side, #000 84%, transparent 100%); mask-image: radial-gradient(closest-side, #000 84%, transparent 100%); }
body.pis-ck .payment-header-copy, body.pis-ck .booking-success-header-copy { display: flex !important; flex-direction: column !important; flex: 1 1 auto !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; color: #fff !important; text-align: left !important; }
body.pis-ck .payment-header-copy h1, body.pis-ck .booking-success-header-copy h1 { order: 1; margin: 0 !important; padding: 0 !important; color: #fff !important; font: 600 21px/1.150 var(--cp-display) !important; letter-spacing: .3px !important; white-space: nowrap; overflow: hidden; text-shadow: 0 2px 0 rgba(20,48,79,.8) !important; }
body.pis-ck .payment-header-copy .payment-eyebrow, body.pis-ck .booking-success-header-copy > span { order: 2; display: block !important; margin: 2px 0 0 !important; padding: 0 !important; color: #fff !important; font: 700 13px/1.25 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important;
    white-space: nowrap; text-shadow: 0 1.500px 0 rgba(20,48,79,.75) !important; }
body.pis-ck .payment-header-copy p, body.pis-ck .payment-security-badge { display: none !important; }

/* ----- a white box whose heading is the soft cream band ----- */
body.pis-ck .payment-layout { gap: 14px !important; margin: 0 !important; padding: 0 !important; }
body.pis-ck .payment-card, body.pis-ck .booking-success-card { position: relative; margin: 0 !important; padding: 0 !important; background: #fff !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; box-shadow: 0 5px 14px rgba(20,48,79,.045) !important; overflow: visible !important; }
body.pis-ck .payment-card::before, body.pis-ck .payment-card::after, body.pis-ck .booking-success-card::before, body.pis-ck .booking-success-card::after { display: none !important; }
body.pis-ck .payment-card-heading { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 8px !important; min-height: 46px !important; margin: 0 !important; padding: 0 14px !important;
    background: var(--cp-cream) !important; border: 0 !important; border-bottom: 1px solid var(--cp-band-line) !important; border-radius: 19px 19px 0 0 !important; }
body.pis-ck .payment-card-heading::before { content: ""; flex: none; width: 19px; height: 19px; background: ${RECEIPT} center / contain no-repeat; }
body.pis-ck .payment-methods-card .payment-card-heading::before { background-image: ${CARD}; }
body.pis-ck .payment-card-heading > div { flex: 1 1 auto !important; min-width: 0 !important; margin: 0 !important; }
body.pis-ck .payment-card-eyebrow { display: none !important; }
body.pis-ck .payment-card-heading h2 { margin: 0 !important; padding: 0 !important; color: var(--cp-navy) !important; font: 600 17px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; white-space: nowrap; text-align: left !important; }
body.pis-ck .payment-edit-booking-button { flex: none !important; width: auto !important; min-width: 0 !important; height: 44px !important; min-height: 44px !important; margin: 0 -8px 0 0 !important; padding: 0 8px !important; border: 0 !important; border-radius: 12px !important; background: none !important; box-shadow: none !important;
    color: var(--cp-blue) !important; font: 700 14px/1 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; white-space: nowrap; }
body.pis-ck .payment-summary-content, body.pis-ck .booking-success-details { display: flex !important; flex-direction: column !important; gap: 8px !important; margin: 0 !important; padding: 12px !important; color: var(--cp-navy) !important; font: 600 14px/1.45 var(--cp-text) !important; }
body.pis-ck .booking-success-details { padding: 0 !important; margin: 16px 0 0 !important; }

/* ----- each day of the booking ----- */
body.pis-ck .payment-summary-date-group, body.pis-ck .booking-success-date-group { margin: 0 !important; padding: 0 !important; border: 1.500px solid var(--cp-line) !important; border-radius: 16px !important; background: #fff !important; box-shadow: none !important; overflow: hidden; }
body.pis-ck .payment-summary-date-header, body.pis-ck .booking-success-date-header { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 10px !important; width: 100% !important; min-height: 56px !important; margin: 0 !important; padding: 8px 12px 8px 14px !important;
    border: 0 !important; border-radius: 0 !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; text-align: left !important; cursor: pointer; }
body.pis-ck .payment-summary-date-title, body.pis-ck .booking-success-date-title { margin: 0 !important; color: var(--cp-navy) !important; font: 600 15.500px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-ck .payment-summary-date-meta, body.pis-ck .booking-success-date-meta { margin: 1px 0 0 !important; color: var(--cp-soft) !important; font: 600 13px/1.3 var(--cp-text) !important; }
body.pis-ck .payment-summary-date-arrow, body.pis-ck .booking-success-date-arrow { flex: none !important; display: grid !important; place-items: center !important; width: 32px !important; height: 32px !important; margin: 0 !important; border-radius: 10px !important; background: #F1F5F9 !important; font-size: 0 !important; line-height: 0 !important; color: transparent !important; transition: transform .15s ease; }
body.pis-ck .payment-summary-date-arrow::after, body.pis-ck .booking-success-date-arrow::after { content: ""; width: 18px; height: 18px; background: ${CHEV} center / contain no-repeat; }
body.pis-ck [aria-expanded="true"] > .payment-summary-date-arrow, body.pis-ck [aria-expanded="true"] > .booking-success-date-arrow { transform: rotate(180deg); }
body.pis-ck .payment-summary-date-content, body.pis-ck .booking-success-date-content { display: flex; flex-direction: column; gap: 8px; margin: 0 !important; padding: 10px !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; background: #F8FAFC !important; }
body.pis-ck .payment-summary-date-content[hidden], body.pis-ck .booking-success-date-content[hidden] { display: none !important; }
/* the open day is tinted so it stands apart from the closed ones */
body.pis-ck .payment-summary-date-group:has(> [aria-expanded="true"]), body.pis-ck .booking-success-date-group:has(> [aria-expanded="true"]) { border-color: var(--cp-band-line) !important; }
body.pis-ck .payment-summary-date-header[aria-expanded="true"], body.pis-ck .booking-success-date-header[aria-expanded="true"] { background: var(--cp-cream) !important; }
body.pis-ck .payment-summary-date-header[aria-expanded="true"] > .payment-summary-date-arrow, body.pis-ck .booking-success-date-header[aria-expanded="true"] > .booking-success-date-arrow { background-color: #fff !important; }
body.pis-ck .payment-summary-date-header[aria-expanded="true"] + .payment-summary-date-content, body.pis-ck .booking-success-date-header[aria-expanded="true"] + .booking-success-date-content { border-top-color: var(--cp-band-line) !important; background: #FFFAF2 !important; }
body.pis-ck .payment-summary-service, body.pis-ck .booking-success-service { position: relative; display: grid !important; grid-template-columns: minmax(0, 1fr) auto; column-gap: 10px; row-gap: 3px; align-items: start; margin: 0 !important; padding: 11px 12px 11px 17px !important;
    border: 1px solid #DBE7F3 !important; border-radius: 14px !important; background: #fff !important; box-shadow: inset 5px 0 0 var(--ck-kind, #1F63B8) !important; }
body.pis-ck .payment-summary-service::before, body.pis-ck .payment-summary-service::after, body.pis-ck .booking-success-service::before, body.pis-ck .booking-success-service::after { display: none !important; }
body.pis-ck .payment-summary-service > *, body.pis-ck .booking-success-service > * { grid-column: 1; margin: 0 !important; padding: 0 !important; }
body.pis-ck .payment-summary-service-name, body.pis-ck .booking-success-service-name { color: var(--cp-navy) !important; font: 700 15.500px/1.3 var(--cp-text) !important; }
body.pis-ck .payment-summary-pets, body.pis-ck .booking-success-pets { display: flex !important; flex-wrap: wrap !important; gap: 5px !important; }
body.pis-ck .payment-summary-pet-chip, body.pis-ck .booking-success-pet-chip { padding: 3px 9px !important; border: 0 !important; border-radius: 999px !important; background: #EAF1F7 !important; color: var(--cp-soft) !important; font: 800 11.500px/1.2 var(--cp-text) !important; }
body.pis-ck .payment-summary-service-details, body.pis-ck .booking-success-service-details { color: var(--cp-soft) !important; font: 600 13.500px/1.35 var(--cp-text) !important; }
body.pis-ck .payment-summary-service-price, body.pis-ck .booking-success-service-price { grid-column: 2 !important; grid-row: 1 !important; align-self: start; color: var(--cp-navy) !important; font: 600 16px/1.3 var(--cp-display) !important; font-variant-numeric: tabular-nums; white-space: nowrap; }
body.pis-ck .pis-ck-code { display: none !important; }

/* ----- totals ----- */
body.pis-ck .payment-summary-total, body.pis-ck .payment-summary-credit, body.pis-ck .booking-success-total { display: flex !important; flex-direction: row !important; align-items: baseline !important; justify-content: space-between !important; gap: 10px !important; margin: 0 !important; padding: 5px 4px !important;
    border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 700 15.500px/1.3 var(--cp-text) !important; }
body.pis-ck .payment-summary-total > span:first-child, body.pis-ck .booking-success-total > span:first-child { color: var(--cp-soft) !important; }
body.pis-ck .payment-summary-total > span:last-child, body.pis-ck .payment-summary-credit > span:last-child, body.pis-ck .booking-success-total > span:last-child { font-variant-numeric: tabular-nums; white-space: nowrap; }
body.pis-ck .payment-summary-credit, body.pis-ck .payment-summary-credit > span, body.pis-ck .booking-success-total.pis-ck-credit, body.pis-ck .booking-success-total.pis-ck-credit > span { color: #1F7A45 !important; }
body.pis-ck .payment-summary-date-group + .payment-summary-total, body.pis-ck .booking-success-date-group + .booking-success-total { margin-top: 6px !important; }
/* the amount to pay (the last total) stands in its own cream box */
body.pis-ck .payment-summary-total.pis-ck-due, body.pis-ck .booking-success-total.pis-ck-due { align-items: center !important; margin-top: 4px !important; padding: 12px 14px !important; border: 1px solid var(--cp-band-line) !important; border-radius: 14px !important; background: var(--cp-cream) !important; }
body.pis-ck .pis-ck-due > span:first-child { color: var(--cp-navy) !important; font: 600 16.500px/1.2 var(--cp-display) !important; letter-spacing: .1px; }
body.pis-ck .pis-ck-due > span:last-child { color: var(--cp-navy) !important; font: 600 24px/1 var(--cp-display) !important; letter-spacing: .1px; }
body.pis-ck .payment-summary-expiration { display: flex !important; align-items: center !important; justify-content: center !important; gap: 7px !important; margin: 2px 0 0 !important; padding: 2px 0 0 !important; border: 0 !important; background: none !important; box-shadow: none !important; color: #8A4B0B !important; font: 700 13px/1.3 var(--cp-text) !important; text-align: center !important; }
body.pis-ck .payment-summary-expiration::before { content: ""; flex: none; width: 15px; height: 15px; background: ${CLOCK} center / contain no-repeat; }
body.pis-ck .payment-summary-expiration:empty { display: none !important; }

/* ----- payment ----- */
body.pis-ck .payment-methods-card > *:not(.payment-card-heading) { box-sizing: border-box !important; width: auto !important; max-width: none !important; margin-left: 12px !important; margin-right: 12px !important; }
body.pis-ck .payment-method-help { display: none !important; }          /* the band already says Choose Payment Method */
body.pis-ck .payment-wallet-methods { display: flex !important; flex-direction: column !important; gap: 10px !important; margin-top: 12px !important; margin-bottom: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; box-shadow: none !important; min-height: 0 !important; }
body.pis-ck .payment-wallet-methods:not(:has(.payment-wallet-wrapper:not([hidden]))) { display: none !important; }
body.pis-ck .payment-wallet-wrapper { margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
body.pis-ck .payment-wallet-wrapper[hidden] { display: none !important; }
/* "or pay with card" only when there is a button above it and the card form below it */
body.pis-ck .payment-wallet-methods:not(:has(.payment-wallet-wrapper:not([hidden]))) + .payment-divider, body.pis-ck .payment-divider:has(+ .card-payment-wrapper[hidden]) { display: none !important; }
body.pis-ck .payment-divider { display: flex !important; align-items: center !important; gap: 12px !important; margin-top: 16px !important; margin-bottom: 0 !important; color: var(--cp-soft) !important; }
body.pis-ck .payment-divider::before, body.pis-ck .payment-divider::after { content: "" !important; display: block !important; position: static !important; flex: 1 1 auto; width: auto !important; height: 1px !important; background: var(--cp-line) !important; }
body.pis-ck .payment-divider span { padding: 0 !important; background: none !important; color: var(--cp-soft) !important; font: 700 13px/1 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; white-space: nowrap; }
body.pis-ck .card-payment-wrapper { margin-top: 14px !important; margin-bottom: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-ck .card-payment-wrapper[hidden] { display: none !important; }
body.pis-ck .card-payment-heading { margin: 0 0 10px !important; padding: 0 2px !important; border: 0 !important; }
body.pis-ck .card-payment-heading h3 { margin: 0 !important; color: var(--cp-navy) !important; font: 600 16px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-ck .card-payment-heading p { margin: 2px 0 0 !important; color: var(--cp-soft) !important; font: 600 13px/1.4 var(--cp-text) !important; }
body.pis-ck .payment-card-field { margin: 0 0 10px !important; padding: 0 !important; }
body.pis-ck .payment-card-field-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 10px !important; margin: 0 !important; }
body.pis-ck .payment-field-label { display: block !important; margin: 0 2px 6px !important; color: var(--cp-navy) !important; font: 600 14.500px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; }
body.pis-ck .paypal-card-field-host { box-sizing: border-box !important; min-height: 50px !important; border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important; overflow: hidden; }
body.pis-ck .payment-card-pay-button, body.pis-ck .payment-complete-credit-button, body.pis-ck .booking-success-button { display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; height: 52px !important; min-height: 52px !important; margin: 6px 0 0 !important; padding: 0 18px !important;
    border: 0 !important; border-radius: 15px !important; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; color: #fff !important; font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; text-decoration: none !important; cursor: pointer; }
body.pis-ck .payment-card-pay-button:disabled, body.pis-ck .payment-complete-credit-button:disabled { opacity: .6 !important; box-shadow: none !important; }
body.pis-ck .payment-message { margin-top: 12px !important; margin-bottom: 0 !important; padding: 12px 14px !important; border: 1px solid var(--cp-line) !important; border-radius: 14px !important; background: #F8FAFC !important; box-shadow: none !important; font: 700 14px/1.4 var(--cp-text) !important; text-align: left !important; }
body.pis-ck .payment-message:empty { display: none !important; }
body.pis-ck .payment-message::before, body.pis-ck .payment-message::after { display: none !important; }
body.pis-ck .payment-message[data-pis-tone="error"] { border-color: #F3C9C4 !important; background: #FDECEA !important; color: #A32B1E !important; }
body.pis-ck .payment-message[data-pis-tone="success"] { border-color: #C9E8D1 !important; background: #F0F9F2 !important; color: #1F7A45 !important; }
body.pis-ck .payment-security-note { display: flex !important; align-items: flex-start !important; gap: 8px !important; margin-top: 14px !important; margin-bottom: 14px !important; padding: 0 2px !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-ck .payment-security-note-icon { flex: none; width: 17px; height: 17px; margin: 1px 0 0 !important; font-size: 0 !important; background: ${LOCK} center / contain no-repeat; }
body.pis-ck .payment-security-note p { margin: 0 !important; color: var(--cp-soft) !important; font: 600 12.500px/1.45 var(--cp-text) !important; text-align: left !important; }
body.pis-ck .payment-security-note .pis-line + .pis-line { margin-top: 3px; }

/* ----- the confirmation page ----- */
body.pis-ck .booking-success-card { padding: 22px 14px 16px !important; text-align: center; }
body.pis-ck .booking-success-icon { display: grid !important; place-items: center !important; width: 64px !important; height: 64px !important; margin: 0 auto 10px !important; border: 0 !important; border-radius: 50% !important; background: #2E9E5B !important; box-shadow: 0 0 0 7px #E7F6EE !important; color: #fff !important; font: 700 30px/1 var(--cp-text) !important; }
body.pis-ck .booking-success-eyebrow { display: none !important; }
body.pis-ck .booking-success-copy h2 { margin: 0 !important; color: var(--cp-navy) !important; font: 600 26px/1.150 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-ck .booking-success-copy p { margin: 8px 8px 0 !important; color: var(--cp-soft) !important; font: 600 14.500px/1.45 var(--cp-text) !important; text-wrap: balance; }
body.pis-ck .booking-success-payment-status { display: inline-flex !important; align-items: center !important; gap: 7px !important; margin: 12px auto 0 !important; padding: 7px 12px !important; border: 0 !important; border-radius: 999px !important; background: #E7F6EE !important; color: #1F7A45 !important; font: 800 12.500px/1 var(--cp-text) !important; }
body.pis-ck .booking-success-payment-dot { width: 8px !important; height: 8px !important; border-radius: 50% !important; background: #2E9E5B !important; box-shadow: none !important; }
body.pis-ck .booking-success-details { text-align: left; }
body.pis-ck .booking-success-note { margin: 14px 0 0 !important; padding: 12px 14px !important; border: 1px solid var(--cp-line) !important; border-radius: 14px !important; background: #F8FAFC !important; box-shadow: none !important; text-align: left !important; }
body.pis-ck .booking-success-note strong { display: block !important; margin: 0 0 2px !important; color: var(--cp-navy) !important; font: 600 15.500px/1.25 var(--cp-display) !important; }
body.pis-ck .booking-success-note p { margin: 0 !important; color: var(--cp-soft) !important; font: 600 13.500px/1.45 var(--cp-text) !important; text-wrap: balance; }
body.pis-ck .booking-success-button { margin-top: 14px !important; }
body.pis-ck .booking-success-reference { margin: 12px 0 0 !important; color: #8193A6 !important; font: 600 12px/1.5 var(--cp-text) !important; text-align: center !important; }
body.pis-ck .booking-success-reference span { display: block; }

/* ----- computers ----- */
@media (min-width: 900px) {
    body.pis-ck .payment-page-container, body.pis-ck .booking-success-shell { padding: 0 26px 40px !important; }
    body.pis-ck .payment-page-header, body.pis-ck .booking-success-header { margin: 0 -26px 24px !important; padding: 20px 30px 22px !important; border-radius: 0 0 28px 28px !important; background: linear-gradient(90deg, #F5AB40 0%, #F6912A 55%, #F26B21 100%) !important; }
    body.pis-ck .payment-header-logo, body.pis-ck .booking-success-logo { width: 70px !important; height: 70px !important; }
    body.pis-ck .payment-header-copy h1, body.pis-ck .booking-success-header-copy h1 { font-size: 29px !important; }
    body.pis-ck .payment-header-copy .payment-eyebrow, body.pis-ck .booking-success-header-copy > span { font-size: 15px !important; margin-top: 4px !important; }
    body.pis-ck .payment-layout { gap: 22px !important; align-items: start !important; }
    body.pis-ck .payment-card-heading { min-height: 50px !important; padding: 0 18px !important; }
    body.pis-ck .payment-card-heading h2 { font-size: 18.500px !important; }
    body.pis-ck .payment-summary-content { padding: 16px !important; }
    body.pis-ck .payment-methods-card > *:not(.payment-card-heading) { margin-left: 16px !important; margin-right: 16px !important; }
    body.pis-ck .booking-success-shell { max-width: 720px; }
    body.pis-ck .booking-success-card { padding: 28px 22px 20px !important; }
}
`;
    document.head.appendChild(style);
    document.body.classList.add('pis-ck');
    if (logo) logo.src = `${ASSETS}pis-logo-orange.png`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#F5AB40');

    // ---------- words ----------
    const KIND_COLOR = { walk: '#1F63B8', drop: '#14B5D0', sit: '#B8336A', board: '#C0610C', meet: '#6A45C2' };
    function kindOf(text) {
        const t = String(text || '').toLowerCase();
        if (/meet\s*(&|and)?\s*greet/.test(t)) return 'meet';
        if (/board/.test(t)) return 'board';
        if (/drop/.test(t)) return 'drop';
        if (/pet[\s_-]*sit/.test(t)) return 'sit';
        return 'walk';
    }
    // "Dog Walking - 30 Minutes" reads "Dog Walking · 30 min"; "Pet Sitting - Day Sit - 4 Hours" reads "Pet Sitting · 4 hrs"
    function prettyService(raw) {
        const text = String(raw || '').trim();
        const match = text.match(/^(.*?)\s+-\s+(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|hours?|hrs?)\.?$/i);
        if (!match) return text;
        return `${match[1].split(/\s+-\s+/)[0]} · ${match[2]} ${/^m/i.test(match[3]) ? 'min' : Number(match[2]) === 1 ? 'hr' : 'hrs'}`;
    }
    // "Bella + Scout • 2 services" reads "Bella and Scout · 2 Services"
    function prettyMeta(raw) {
        const [who, rest] = String(raw || '').split(/\s*•\s*/);
        const names = who.split(/\s*\+\s*/).map(name => name.trim()).filter(Boolean);
        const pets = names.length < 2 ? names[0] || '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
        const count = String(rest || '').trim().replace(/\b(service|visit|night)(s?)\b/gi, (m, word, s) => word[0].toUpperCase() + word.slice(1).toLowerCase() + s.toLowerCase());
        return [pets, count].filter(Boolean).join(' · ');
    }
    const once = (el, key) => { if (el.dataset[key]) return false; el.dataset[key] = '1'; return true; };
    function tidy() {
        for (const or of document.querySelectorAll('.payment-divider span')) if (/^or pay with card$/i.test(or.textContent.trim()) && or.textContent.trim() !== 'Or Pay with Card') or.textContent = 'Or Pay with Card';
        const edit = document.getElementById('edit-booking-button');
        if (edit && edit.textContent.trim() !== 'Edit Booking' && /edit booking/i.test(edit.textContent)) edit.textContent = 'Edit Booking';
        for (const h1 of document.querySelectorAll('.booking-success-header-copy h1')) if (/^your service is booked$/i.test(h1.textContent.trim())) h1.textContent = 'Your Service Is Booked';
        for (const h2 of document.querySelectorAll('.booking-success-copy h2')) if (/^you.re all set!?$/i.test(h2.textContent.trim()) && !/All Set/.test(h2.textContent)) h2.textContent = 'You’re All Set!';
        for (const strong of document.querySelectorAll('.booking-success-note strong')) if (/^what happens next\??$/i.test(strong.textContent.trim()) && strong.textContent.trim() !== 'What Happens Next') strong.textContent = 'What Happens Next';
        for (const name of document.querySelectorAll('.payment-summary-service-name, .booking-success-service-name')) {
            if (!once(name, 'ckName')) continue;
            name.closest('.payment-summary-service, .booking-success-service')?.style.setProperty('--ck-kind', KIND_COLOR[kindOf(name.textContent)]);
            name.textContent = prettyService(name.textContent);
        }
        for (const meta of document.querySelectorAll('.payment-summary-date-meta, .booking-success-date-meta')) if (once(meta, 'ckMeta')) meta.textContent = prettyMeta(meta.textContent);
        // the reference and the payment time each get their own line
        const ref = document.getElementById('booking-success-reference');
        if (ref && !ref.querySelector('span') && ref.textContent.includes(' • ')) {
            const parts = ref.textContent.split(' • ').map(part => part.trim()).filter(Boolean);
            ref.textContent = '';
            for (const part of parts) { const line = document.createElement('span'); line.textContent = part; ref.appendChild(line); }
        }
        // a bare code such as "30_min" is not for clients
        for (const line of document.querySelectorAll('.booking-success-service-details, .payment-summary-service-details')) if (/^[a-z0-9]+(_[a-z0-9]+)+$/i.test(line.textContent.trim())) line.classList.add('pis-ck-code');
        // the last total is what is being paid (or was charged): it gets the cream box; account credit reads in green
        for (const box of document.querySelectorAll('.payment-summary-content, .booking-success-details')) {
            const totals = [...box.querySelectorAll(':scope > .payment-summary-total, :scope > .booking-success-total')];
            totals.forEach((row, i) => {
                row.classList.toggle('pis-ck-due', i === totals.length - 1);
                row.classList.toggle('pis-ck-credit', /credit/i.test(row.firstElementChild?.textContent || ''));
            });
        }
    }
    let queued = false;
    const later = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; try { tidy(); } catch (error) { console.warn('Checkout new look:', error?.message || error); } }); };
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
    later();
})();
