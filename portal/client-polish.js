// ========================================
// CLIENT APP: NEW LOOK (phones and computers)
// ========================================
// Nothing here changes what the app does or saves: the same buttons and lists are still
// there, restyled or moved. If this file fails to load, the app shows the screens it had before.
//
// PART 1: THE HEADER AND THE MENUS
// 1. HEADER. Orange, with the logo blended into it (phones), the screen's name in the
//    rounder heading font and a useful line under it (the date on Home, the pets' names on
//    Pets). The bell and "+ Book" (it used to say "+ Request Service") are the same buttons.
//    The header now stays at the top while the page scrolls. It was always meant to; the
//    page's own sideways-scroll rule was what stopped it.
// 2. LOG OUT moves from the header to the bottom of Profile. Same confirmation as before.
// 3. BOTTOM MENU (phones). The tab you're on gets a soft orange pill behind its icon.
// 4. LEFT MENU (computers). The orange logo centered at the top, the same soft orange
//    highlight on the page you're on, and the orange header across the top of the page.
//    Messages is in the menu now, with its unread count (it is a page of its own: Part 6;
//    the floating button is gone on computers). At the bottom: who is signed in, with
//    their initials and any account credit in green.
// 5. The birthday bunting and the Christmas lights hang from the bottom edge of the header
//    (they used to sit inside the tall white one).
//
// PART 2: HOME
// 1. PETS ROW at the top: each pet's face and name (tap one to open it on Pets), then
//    Add Pet. On a pet's birthday its face gets a small cake.
// 2. PHOTO CARD: the same card as before (portal-home-star.js), with the heading font.
// 3. "<MONTH> WITH US": this month's finished walks, miles and photos. It is worked out
//    from the same records as the Pets screen, and uses the same distance comparisons
//    (the list in portal.js). It stays hidden until the month's first finished visit.
//       walks only                  Walks, Miles, Photos
//       drop-ins or sits only       Visits, Hours, Photos
//       walks and other visits      Visits, Miles, Photos
//       boarding only               Nights, Walks, Photos
//    A tile with nothing to count is left out.
// 4. COMING UP: the app's own list of the next three visits (it used to say Upcoming),
//    in a box with the soft cream heading band. Each row: the day, the service, the time,
//    the pets, and how long. Tapping a row still opens that day.
// 5. LATEST UPDATE: same card, same band. It hides while it has nothing to show.
// 6. QUICK ACTIONS is gone: Book is in the header and Messages is in the menu.
// 7. The review strip and the birthday and Christmas cards get the new look. The two
//    cards show on Home only (the bunting and the lights stay on every screen).
//
// PART 3: SERVICES
// 1. The calendar is the same calendar. The "Upcoming Services" heading above it is gone
//    (the header says Services / Select a Date).
// 2. THE SELECTED DAY is one box. Its heading is the soft cream band: the date and how many
//    visits ("4 Visits").
// 3. Inside it, each visit is its own slim card (the app's own rows, redrawn), tinted by
//    where it stands, with the service's colored edge. The top line of a finished visit
//    reads "Complete · 8:36 AM", a running one "In Progress · 12:05 PM", a booked one its
//    time window. View opens the same visit screen as before.
// 4. Morning / Afternoon / Evening dividers when the day has more than one visit (before
//    noon, before 5 PM, after), the same split the team's schedule uses.
//
// PART 4: BOOKING A SERVICE
// 1. THREE STEPS with Next and Back instead of one long form: Pet and Service, then Times
//    and Dates (just "Dates" for boarding), then Review. It is the app's own form: the same
//    fields hold the answers and Continue is the same button. Each step shows its share.
//    If the steps fail to start, the form shows whole, as one page.
// 2. TAP INSTEAD OF A LIST: the pet's face, a colored tile for the service, a tile with
//    the price for the length. Each one sets the app's own picker underneath.
// 3. Next says what is still missing ("Choose a Service", "Pick at Least One Date"). Back is a
//    full-width button under Next, the same as Back under Continue on Review.
// 4. Repeat Last Week's Booking fills everything in and goes straight to Review. Its
//    message is centered under the button.
// 5. REVIEW: the days picked, the total, Continue. The open day is tinted cream so it
//    stands apart from the closed ones. On a computer the days are on the left and the
//    total and Continue on the right.
// 6. One booking is still one service (the app starts the dates over if the service is
//    changed, and a note says so). Several visit times a day are added on step 2.
// The checkout and confirmation pages get the same look from checkout-polish.js.
//
// PART 5: PETS
// 1. A ROW OF FACES at the top, one for each pet, then Add Pet. The page shows one pet at
//    a time: the face that is chosen (it is remembered). Tapping a pet on Home opens it.
// 2. THE PET: the photo across the top with the name on it and Edit. Under it Breed, Age
//    and Gender, each on its own line, and the birthday with how many days away it is.
//    With no photo: "No Photo of Bella Yet" and Add Photo.
// 3. "BELLA'S WALKS WITH US": the same numbers as before (Walks, Miles, Together, the
//    distance line, Walks This Month, Longest Walk, Other Visits). A pet with visits but
//    no walks gets "Bella's Visits With Us" (Visits, Together, Photos, Visits This Month,
//    Longest Visit, Last Visit).
// 4. ROWS: Photos (opens the same gallery), Feeding Notes, Care Notes.
// 5. THE PET FORM IS A SHEET that slides up (a pop-up on a computer). It is the app's own
//    form and its own Save, shown in parts: Edit (photo, name, breed, gender, birthday,
//    Remove Pet), Add a Pet, Feeding Notes, Care Notes.
// 6. The photo gallery and the Remove Pet confirmation open from this page, so they get
//    the same look (same parts, same buttons).
// 7. THE PHOTO PICKER. Add Photo on the page, or Change Photo in Edit, opens "Bella's
//    Photo": pick one of the photos from her visits, or Take a Photo, or Photo Library.
//    Whichever it is goes through the app's own photo step (drag and zoom inside a
//    circle) and the app's own Save. A pet with no visit photos gets just the camera
//    and library buttons.
// These are the app's own cards, redrawn: Edit, the gallery and saving are the same code.
//
// PART 6: MESSAGES
// 1. A SCREEN OF ITS OWN. On a phone the Messages tab shows the conversation under the
//    header (which says Messages) with the tabs still at the bottom. On a computer it is
//    a page in the left menu. It is the app's own panel, placed there: sending, the unread
//    count and marking as read are the same code. Esc does not put it away any more.
// 2. THE CONVERSATION. Your messages are orange on the right. Ours are white on the left
//    with the logo and who wrote ("Riley · Paws in Stride"). A label marks each new day
//    (Today, Yesterday, "Wednesday, Nov 18") and each message shows just its time.
// 3. THE BOX at the bottom says "Message Paws in Stride". Send keeps the keyboard up.
// 4. THE KEYBOARD (phones). Opening the tab no longer brings the keyboard up by itself;
//    tapping the box does. While it is up the tabs step aside.
// 5. A tablet held upright keeps the app's floating panel, with the new lettering.
//
// PART 7: PROFILE
// 1. THE PAGE. Your card (photo or initials, name, email, phone, Edit Profile), Account
//    Credit when there is some, then three boxes of rows: Your Home (Home Address, Property
//    Access, Preferred Contact, Emergency Contact, Home Notes), App (Push Notifications,
//    and App Icon in the iPhone app) and Account (Account Security, Privacy Policy, Delete
//    Account), then Log Out. On a computer it is two columns. Each fact is on its own
//    line. Property Access says what is saved ("Gate Code Saved"), never the code itself.
// 2. EVERY ROW OPENS A SHEET (a pop-up on a computer). The six about you and your home are
//    the app's own Edit form, one part at a time, with its own Save: Edit Profile (photo,
//    name, phone; the email is shown locked), Home Address, Property Access, Preferred
//    Contact (three choices that set the app's list), Emergency Contact, Home Notes. The
//    app still checks the whole form, so if a box on another sheet is missing something,
//    that sheet comes up with the app's note under the box.
// 3. ACCOUNT SECURITY is the app's own Face ID switch and password form, in a sheet.
// 4. PUSH NOTIFICATIONS, APP ICON and DELETE ACCOUNT open the app's own pop-ups, with the
//    new look: switches for the six kinds of notification and a Done button; the two icon
//    choices; the same Type DELETE confirmation.
// The app's old heading, cards and Notifications box are still in the page, hidden: the rows
// press their buttons and read their words. If any of this fails to start, they show again.
//
// PART 8: THE VISIT SCREEN (one visit, opened with View or from Home)
// 1. ONE HEADER, in the color of the service (blue walk, teal drop-in, pink pet sitting,
//    orange boarding, purple meet and greet; the colors are the app's own): the service
//    ("Dog Walking · 15 min"), the day and where it stands ("Friday, Nov 20 · Complete"),
//    and a white X. The app's own heading is still there for screen readers.
// 2. UNDER IT, BOXES IN ONE COLUMN: what is happening or how it went (the app's live card),
//    the Visit Report, the day's updates for a sit or a stay, then the booking (Pets, Time,
//    Price, Payment) and Cancel Service last.
// 3. THE VISIT REPORT is a box with a soft band in the service's color, not a second
//    header: what they wrote, the photos, then the checks for each pet. Parts with nothing
//    in them are left out.
// 4. SIT UPDATES and a stay's TODAY'S UPDATES are the same kind of box: each update says
//    when ("8:40 AM"), what they wrote, the photos, then the checks. A stay's walks are in
//    the same box. A pet sit is told through its updates, so a sit with no report written
//    shows no "has not been added yet" box (a report written earlier still shows).
// 5. Nothing here changes what the app loads or when. If it fails to start, the app's own
//    visit screen shows.
//
// PART 9: THE CALENDAR ON SERVICES
// The app's own month, restyled: the month in the display lettering with soft arrow
// buttons, weekdays as "Sun Mon", bigger numbers, and no box round a day with nothing on
// it, so the days with visits stand out. Those keep their meaning: filled blue with how
// many, green when that day's visits are all done. The picked day is navy and today is
// ringed in orange. What a tap does is the app's own.
//
// PART 10: THE BELL'S NOTIFICATIONS
// The app's own drop-down, in the new shapes: a cream heading with how many are new and an X,
// each notification with a drawn icon (orange while it is new) and its whole message, and
// Mark All Read beside Clear All at the bottom. The X taps the bell, which is how the app
// closes the list. Opening, marking, clearing and what a tap on a notification does are the app's own.
//
// PART 11: THE POP-UP BOX
// Cancel This Service, Log Out, the Face ID question and the yes / no questions are one box
// in the app, so they get one look: a sheet that slides up on a phone (a box in the middle
// on a computer), the heading in the display lettering, the action on top with the way out
// under it, both the full width and always in reach. When cancelling, the service sits in
// its own color and the sums are one box with the credit on a band; their labels are
// shortened so each fits on one line (You Paid, Refundable Amount, Credit to Your Account).
// The sign-in pages get the same box from auth-polish.css.
//
// PART 12: THE PHOTO VIEWER
// One viewer for every photo a client can open (a visit report's, a sit or boarding
// update's, the Pets gallery's): a dark screen with what and when at the top, an X, and
// under the photo arrows with "1 of 3". Swiping and the arrow keys move too. A tap on the
// dark beside the photo, the X, Escape and Android's back button close it. The owner's
// side keeps its own viewer.
//
// Load AFTER portal.js, portal-home-star.js, pet-birthday.js and holiday-gift.js.
// ========================================
(() => {
    'use strict';

    const header = document.querySelector('.client-dashboard-header');
    const brand = header?.querySelector('.client-dashboard-brand');
    if (!header || !brand || document.body.classList.contains('pis-cp')) return;

    const oldLogo = header.querySelector('.client-dashboard-logo');
    const ASSETS = ((oldLogo && oldLogo.getAttribute('src')) || '/portal/assets/x').replace(/[^/]*$/, '');
    const LOGO = `${ASSETS}pis-logo-orange.png`;
    const SCREENS = ['home', 'services', 'pets', 'profile'];

    const svg = (body, size = 22, width = 2) =>
        `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    const ICON = {
        bell: svg('<path d="M6.500 16.500V11a5.500 5.500 0 0 1 11 0v5.500l1.500 2h-14z"/><path d="M10 19.500a2.100 2.100 0 0 0 4 0"/>'),
        plus: svg('<path d="M12 5.500v13M5.500 12h13"/>', 20, 2.600),
        out: svg('<path d="M10 4.500H6.500a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10"/><path d="M14.500 8.500 18 12l-3.500 3.500M18 12H9.500"/>', 20, 2.100)
    };

    // ---------- styles ----------
    const style = document.createElement('style');
    style.id = 'pis-client-polish';
    style.textContent = `
@font-face { font-family: "Fredoka"; font-weight: 600; font-display: swap; src: url("${ASSETS}fonts/fredoka-600.woff2") format("woff2"); }
body.pis-cp { --cp-display: "Fredoka", ui-rounded, "SF Pro Rounded", system-ui, sans-serif; --cp-navy: #14304F; --cp-soft: #51677F; --cp-tang: #F47B20; --cp-line: #DCE6EF; }

/* the header can stick now: the page hid sideways overflow in a way that made the body its own
   scroll box, and a sticky header inside a box that never scrolls never sticks. Clipping does the
   same job without making that box. Rules that lock the page under a pop-up still win (they set both directions). */
@supports (overflow: clip) { body.pis-cp { overflow-x: clip; } }

/* ----- header: shared ----- */
body.pis-cp .client-dashboard-header { position: sticky !important; top: 0 !important; display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important;
    flex-wrap: nowrap !important; gap: 11px !important; min-height: 0 !important; height: auto !important; overflow: visible !important;
    border: 0 !important; box-shadow: 0 8px 20px rgba(242,107,33,.22) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
body.pis-cp .client-dashboard-header::before, body.pis-cp .client-dashboard-header::after { display: none !important; }
body.pis-cp .client-dashboard-brand { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 11px !important; flex: 1 1 auto !important; min-width: 0 !important; width: auto !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp .client-dashboard-logo, body.pis-cp .client-dashboard-welcome, body.pis-cp .client-header-logout-button { display: none !important; }
.pis-cp-logo { display: block; flex: none; width: 58px; height: 58px; margin: -6px -5px; -webkit-mask-image: radial-gradient(closest-side, #000 84%, transparent 100%); mask-image: radial-gradient(closest-side, #000 84%, transparent 100%); }
.pis-cp-title { flex: 1 1 auto; min-width: 0; color: #fff; text-align: left; }
.pis-cp-title strong { display: block; font: 600 21px/1.150 var(--cp-display); letter-spacing: .3px; white-space: nowrap; overflow: hidden; text-shadow: 0 2px 0 rgba(20,48,79,.8); }
.pis-cp-title span { display: block; margin-top: 2px; font-size: 13px; font-weight: 700; line-height: 1.25; white-space: nowrap; overflow: hidden; text-shadow: 0 1.500px 0 rgba(20,48,79,.75); }
body.pis-cp .client-dashboard-header-actions { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 9px !important; flex: none !important; width: auto !important; margin: 0 !important; }
body.pis-cp .client-notification-center { order: 1; }      /* its position is left alone: on phones the notifications list hangs off the whole header, not the bell */
body.pis-cp #request-walk-button { order: 2; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 5px !important; width: auto !important; min-width: 0 !important; height: 44px !important; min-height: 44px !important;
    padding: 0 15px 0 11px !important; margin: 0 !important; border: 0 !important; border-radius: 14px !important; background: var(--cp-navy) !important; color: #fff !important;
    font: 600 15px/1 var(--cp-display) !important; letter-spacing: .2px; white-space: nowrap; box-shadow: 0 3px 8px rgba(20,48,79,.25) !important; text-shadow: none !important; }
body.pis-cp #request-walk-button svg { color: #FDB833; flex: none; }
body.pis-cp .client-notification-center-button { display: grid !important; place-items: center !important; width: 44px !important; height: 44px !important; min-width: 44px !important; padding: 0 !important; margin: 0 !important;
    border: 0 !important; border-radius: 14px !important; background: rgba(255,255,255,.92) !important; color: var(--cp-navy) !important; box-shadow: 0 2px 6px rgba(20,48,79,.12) !important; }
body.pis-cp .client-notification-bell { display: grid !important; place-items: center; font-size: 0 !important; line-height: 0 !important; transform: none !important; filter: none !important; }
body.pis-cp .client-notification-unread-badge { top: -4px !important; right: -4px !important; min-width: 17px !important; height: 17px !important; padding: 0 4px !important; border: 0 !important; border-radius: 9px !important;
    background: #E5352B !important; color: #fff !important; font: 700 10.500px/17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; box-shadow: 0 0 0 2px #fff !important; }
body.pis-cp .client-notification-unread-badge:not([hidden]) { display: block !important; text-align: center; }

/* ----- Log Out, at the bottom of Profile ----- */
.pis-cp-logout { display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; height: 50px; margin: 14px 0 0; padding: 0; border: 1.500px solid var(--cp-line); border-radius: 15px; background: #fff; color: var(--cp-navy);
    font: 600 16.500px/1 var(--cp-display); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pis-cp-logout:active { transform: scale(.985); }

/* ----- birthday bunting and Christmas lights: hang from the header's bottom edge ----- */
body.pis-cp .client-dashboard-header > .pis-bunting, body.pis-cp .client-dashboard-header > .pis-lights { position: absolute !important; left: 0 !important; right: 0 !important; top: calc(100% - 9px) !important; bottom: auto !important;
    width: auto !important; height: 50px !important; margin: 0 !important; overflow: hidden !important; z-index: 1 !important; pointer-events: none; }
body.pis-cp .client-dashboard-header > .pis-bunting svg { height: 58px !important; } body.pis-cp .client-dashboard-header > .pis-lights svg { height: 44px !important; }
body.pis-cp .client-dashboard-header.pis-has-bunting ~ #pis-bday-card, body.pis-cp .client-dashboard-header.pis-has-lights ~ #pis-xmas-card { margin-top: 44px !important; }
body.pis-cp .client-dashboard-header.pis-has-bunting ~ #dashboard-content, body.pis-cp .client-dashboard-header.pis-has-lights ~ #dashboard-content { padding-top: 34px; }
body.pis-cp .client-dashboard-header.pis-has-bunting ~ #pis-bday-card ~ #dashboard-content, body.pis-cp .client-dashboard-header.pis-has-lights ~ #pis-xmas-card ~ #dashboard-content { padding-top: 0; }

/* ----- phones and tablets ----- */
@media (max-width: 1023px) {
    body.pis-cp .client-dashboard-header { padding: calc(max(8px, env(safe-area-inset-top, 0px)) + 6px) 14px 14px !important; border-radius: 0 0 26px 26px !important;
        background: linear-gradient(90deg, #F5AB40 0px, #F5AB40 80px, #F6912A 60%, #F26B21 100%) !important; }
    body.pis-cp .client-dashboard-header.pis-has-bunting, body.pis-cp .client-dashboard-header.pis-has-lights { padding-top: calc(max(8px, env(safe-area-inset-top, 0px)) + 6px) !important; }
    /* bottom menu: a soft orange pill behind the icon of the tab you're on */
    body.pis-cp .client-bottom-navigation { border-top: 1px solid var(--cp-line) !important; box-shadow: 0 -4px 14px rgba(20,48,79,.05) !important; }
    body.pis-cp .client-bottom-navigation::before { display: none !important; }
    body.pis-cp .client-bottom-nav-item { color: var(--cp-soft) !important; }
    body.pis-cp .client-bottom-nav-icon { width: 54px !important; height: 30px !important; border-radius: 15px; transform: none !important; transition: background-color .15s ease; }
    body.pis-cp .client-bottom-nav-item-active { color: var(--cp-navy) !important; }
    body.pis-cp .client-bottom-nav-item-active .client-bottom-nav-icon { background: #FFE9CC; color: var(--cp-tang); }
    body.pis-cp .client-bottom-message-badge { right: 6px !important; top: -4px !important; }
}

/* ----- computers ----- */
@media (min-width: 1024px) {
    /* edge to edge across the page, from the left menu to the right side */
    body.pis-cp .client-dashboard-header { width: auto !important; max-width: none !important; margin: 0 -26px 24px !important; padding: 22px 30px 24px !important; border-radius: 0 0 28px 28px !important; z-index: 900 !important;
        background: linear-gradient(90deg, #F5AB40 0%, #F6912A 55%, #F26B21 100%) !important; }
    body.pis-cp .pis-cp-logo { display: none; }            /* the logo lives in the left menu here */
    body.pis-cp .pis-cp-title strong { font-size: 31px; line-height: 1.1; } body.pis-cp .pis-cp-title span { font-size: 15.500px; margin-top: 4px; }
    body.pis-cp #request-walk-button { height: 48px !important; min-height: 48px !important; border-radius: 15px !important; padding: 0 20px 0 15px !important; font-size: 16.500px !important; }
    body.pis-cp .client-notification-center-button { width: 48px !important; height: 48px !important; min-width: 48px !important; border-radius: 15px !important; }
    body.pis-cp .client-dashboard-header-actions { gap: 12px !important; }
    body.pis-cp .client-desktop-sidebar-logo { width: 112px !important; height: 112px !important; margin: 4px auto 22px !important; border-radius: 28px; box-shadow: 0 10px 22px rgba(242,107,33,.3); }
    body.pis-cp.client-portal-page .client-desktop-nav-item { min-height: 50px; border-radius: 14px; gap: 12px; padding: 0 14px; font: 600 16.500px/1 var(--cp-display); color: var(--cp-soft); }
    body.pis-cp.client-portal-page .client-desktop-nav-item:hover { background: #FFF6EA; color: var(--cp-navy); }
    body.pis-cp.client-portal-page .client-desktop-nav-item.is-active { background: #FFE9CC; color: var(--cp-navy); font-weight: 600; box-shadow: none; }
    body.pis-cp.client-portal-page .client-desktop-nav-item.is-active .client-desktop-nav-icon { color: var(--cp-tang); }
    body.pis-cp .client-desktop-nav-icon, body.pis-cp .client-desktop-nav-icon svg { width: 22px; height: 22px; }
    .pis-cp-logout { max-width: 420px; }
    /* Messages lives in the left menu, so the floating button steps aside */
    body.pis-cp-menu-messages .client-message-launcher { display: none !important; }
    .pis-cp-nav-badge { margin-left: auto; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px; background: #E5352B; color: #fff; font: 700 12px/22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-style: normal; text-align: center; }
    .pis-cp-nav-badge[hidden] { display: none; }
    body.pis-cp .client-desktop-sidebar-footer.pis-cp-foot { display: grid; grid-template-columns: 40px minmax(0, 1fr); column-gap: 10px; align-items: center; padding: 16px 2px 6px; border-top: 1px solid var(--cp-line); }
    .pis-cp-me { grid-row: 1 / span 2; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%); color: #fff; font: 600 16px/1 var(--cp-display); letter-spacing: .3px; }
    body.pis-cp .pis-cp-foot strong { align-self: end; margin: 0; color: var(--cp-navy); font: 700 15px/1.25 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; overflow-wrap: anywhere; }
    body.pis-cp .pis-cp-foot span { align-self: start; margin: 1px 0 0; color: #1F7A45; font: 700 12.500px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; white-space: nowrap; overflow: hidden; }
    body.pis-cp .pis-cp-foot span:empty { display: none; }
    body.pis-cp .pis-cp-foot strong:has(+ span:empty) { grid-row: 1 / span 2; align-self: center; }
}
@media (prefers-reduced-motion: reduce) { body.pis-cp .client-bottom-nav-icon { transition: none; } }

/* =====================================================================
   PART 2: HOME
   ===================================================================== */
body.pis-cp { --cp-text: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; --cp-cream: #FFF3E0; --cp-band-line: #F6DFBE; --cp-blue: #1E73BE; --cp-grass: #2E9E5B; }
body.pis-cp .pis-cp-title span { font-family: var(--cp-text); }
/* the header says hello now; Book and Messages have their own buttons */
body.pis-cp .mobile-home-greeting, body.pis-cp #mobile-home-dashboard .pis-cp-gone { display: none !important; }

/* a white box, and a box whose heading is a soft cream band */
body.pis-cp #mobile-home-dashboard .pis-cp-card { position: relative; margin: 0 !important; padding: 0 !important; background: #fff !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important;
    box-shadow: 0 5px 14px rgba(20,48,79,.045) !important; color: var(--cp-navy); font-family: var(--cp-text); overflow: hidden; min-width: 0; }
body.pis-cp #mobile-home-dashboard .pis-cp-card::before, body.pis-cp #mobile-home-dashboard .pis-cp-card::after { display: none !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-band { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 8px !important; min-height: 0 !important;
    margin: 0 !important; padding: 11px 14px !important; background: var(--cp-cream) !important; border: 0 !important; border-bottom: 1px solid var(--cp-band-line) !important; border-radius: 0 !important; box-shadow: none !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-band::before, body.pis-cp #mobile-home-dashboard .pis-cp-band::after { display: none !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-band > svg { flex: none; color: var(--cp-tang); }
body.pis-cp #mobile-home-dashboard .pis-cp-band h3 { flex: 1 1 auto; min-width: 0; margin: 0 !important; padding: 0 !important; color: var(--cp-navy) !important; font: 600 17px/1.2 var(--cp-display) !important; letter-spacing: .1px !important;
    text-transform: none !important; white-space: nowrap; text-align: left; }
body.pis-cp #mobile-home-dashboard .pis-cp-band .mobile-home-section-link { flex: none; width: auto !important; min-width: 0 !important; min-height: 44px !important; height: auto !important; margin: -12px -8px -12px 0 !important; padding: 0 8px !important;
    border: 0 !important; background: none !important; box-shadow: none !important; color: var(--cp-blue) !important; font: 700 14px/1 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; cursor: pointer; }

/* ----- pets row ----- */
.pis-cp-pack { display: flex; gap: 14px; margin: 0; padding: 3px 3px 2px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.pis-cp-pack::-webkit-scrollbar { display: none; }
.pis-cp-pack:empty { display: none; }
.pis-cp-pack .pis-cp-pet { flex: none; display: flex; flex-direction: column; align-items: center; gap: 5px; width: auto !important; min-width: 64px !important; height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 700 12.500px/1.25 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important;
    position: relative; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pis-cp-face { position: relative; box-sizing: border-box; display: grid; place-items: center; width: 60px; height: 60px; border-radius: 50%; border: 3px solid #fff; background: var(--cp-cream); color: var(--cp-tang);
    box-shadow: 0 0 0 2px #FDB833, 0 4px 10px rgba(20,48,79,.12); overflow: hidden; }
.pis-cp-face img { position: absolute; inset: 0; display: block; width: 100% !important; height: 100% !important; max-width: none !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; object-fit: cover; }
.pis-cp-pack .pis-cp-pet-add { color: var(--cp-soft) !important; }
.pis-cp-pet-add .pis-cp-face { border: 2px dashed #B9C8D8; background: #fff; color: var(--cp-soft); box-shadow: none; }
.pis-cp-pet:active .pis-cp-face { transform: scale(.96); }
.pis-cp-pet:focus-visible { outline: none; } .pis-cp-pet:focus-visible .pis-cp-face { outline: 3px solid #8FD0FF; outline-offset: 2px; }
/* a pet opened from Home lands just under the header, not behind it */
body.pis-cp #pet-info .pet-profile-card { scroll-margin-top: calc(max(8px, env(safe-area-inset-top, 0px)) + 80px); }
.pis-cp-pet.is-bday::after { content: "🎂"; position: absolute; left: calc(50% + 11px); top: 38px; font-size: 19px; line-height: 1; }

/* ----- the photo card: same card, the new heading font ----- */
body.pis-cp #pis-star { margin: 0 !important; }
body.pis-cp #pis-star .pis-star-chip { padding: 8px 12px 8px 10px; font: 800 12.500px/1 var(--cp-text); letter-spacing: 0; text-transform: none; }
body.pis-cp #pis-star .pis-star-bottom h2 { font-family: var(--cp-display); font-weight: 600; letter-spacing: .1px; }
body.pis-cp #pis-star .pis-star-sub, body.pis-cp #pis-star .pis-star-stat, body.pis-cp #pis-star .pis-star-note, body.pis-cp #pis-star .pis-star-person { font-family: var(--cp-text); }
body.pis-cp #pis-star .pis-star-btn { border-radius: 15px; font: 600 16px/1 var(--cp-display); }
body.pis-cp #pis-star .pis-star-btn > span[aria-hidden], body.pis-cp #mobile-home-dashboard .mobile-home-card-link > span[aria-hidden] { display: none; }

/* ----- "<Month> With Us" ----- */
body.pis-cp #mobile-home-dashboard .pis-cp-month { padding: 14px 6px 12px !important; }
.pis-cp-month[hidden] { display: none !important; }
.pis-cp-month h3 { margin: 0; padding: 0 10px 10px; color: var(--cp-navy); font: 600 18px/1.2 var(--cp-display); letter-spacing: .1px; text-align: left; }
.pis-cp-tiles { display: grid; grid-template-columns: repeat(var(--cp-n, 3), minmax(0, 1fr)); }
.pis-cp-tiles > div { padding: 2px 4px; text-align: center; }
.pis-cp-tiles > div + div { border-left: 1px solid var(--cp-line); }
.pis-cp-tiles i { display: grid; place-items: center; width: 34px; height: 34px; margin: 0 auto 6px; border-radius: 12px; background: var(--cp-cream); color: var(--cp-tang); font-style: normal; }
.pis-cp-tiles > div:nth-child(2) i { background: #E6F1FB; color: var(--cp-blue); }
.pis-cp-tiles > div:nth-child(3) i { background: #E7F6EE; color: var(--cp-grass); }
.pis-cp-tiles b { display: block; font: 600 24px/1.1 var(--cp-display); font-variant-numeric: tabular-nums; }
.pis-cp-tiles span { display: block; margin-top: 1px; color: var(--cp-soft); font-size: 12.500px; font-weight: 600; }
.pis-cp-fun { display: flex; align-items: center; gap: 8px; margin: 12px 8px 0; padding: 9px 12px; border-radius: 13px; background: var(--cp-cream); color: #8A4B0B; font-size: 13.500px; font-weight: 700; line-height: 1.3; text-align: left; }
.pis-cp-fun svg { flex: none; color: var(--cp-tang); }
.pis-cp-fun span { flex: 1 1 auto; min-width: 0; white-space: nowrap; overflow: hidden; }

/* ----- Coming Up ----- */
body.pis-cp #mobile-home-dashboard .pis-cp-coming .mobile-home-upcoming-list { display: block !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; overflow: visible !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-coming .mobile-home-upcoming-list::before, body.pis-cp #mobile-home-dashboard .pis-cp-coming .mobile-home-upcoming-list::after { display: none !important; }
body.pis-cp #mobile-home-dashboard .mobile-home-upcoming-item { position: relative; display: flex !important; flex-direction: row !important; align-items: center !important; gap: 12px !important; width: 100% !important; min-height: 0 !important; margin: 0 !important;
    padding: 13px 12px 13px 15px !important; border: 0 !important; border-radius: 0 !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font-family: var(--cp-text) !important; text-align: left !important; cursor: pointer; }
body.pis-cp #mobile-home-dashboard .mobile-home-upcoming-item + .mobile-home-upcoming-item { border-top: 1px solid var(--cp-line) !important; }
body.pis-cp #mobile-home-dashboard .mobile-home-upcoming-item::before { content: "" !important; display: block !important; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; height: auto; border-radius: 0; background: var(--cp-c, #1F63B8); }
body.pis-cp #mobile-home-dashboard .mobile-home-upcoming-item::after { display: none !important; }
body.pis-cp #mobile-home-dashboard .mobile-home-upcoming-item:active { background: #F7FAFC !important; }
.pis-cp-day { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 50px; height: 54px; border-radius: 14px; background: var(--cp-cream); }
.pis-cp-day small { color: var(--cp-tang); font-size: 10.500px; font-weight: 800; letter-spacing: .4px; line-height: 1; }
.pis-cp-day b { margin-top: 3px; color: var(--cp-navy); font: 600 21px/1 var(--cp-display); }
.pis-cp-what { flex: 1 1 auto; min-width: 0; display: block; }
.pis-cp-what b { display: block; color: var(--cp-navy); font-size: 15.500px; font-weight: 700; line-height: 1.25; }
.pis-cp-what span { display: block; color: var(--cp-soft); font-size: 13.500px; font-weight: 600; line-height: 1.4; }
.pis-cp-what span.pis-cp-who { color: var(--cp-navy); white-space: nowrap; overflow: hidden; }
.pis-cp-len { flex: none; display: inline-flex; align-items: center; height: 23px; padding: 0 9px; border-radius: 12px; background: #F1F5F9; color: var(--cp-soft); font-size: 12px; font-weight: 800; white-space: nowrap; }
.mobile-home-upcoming-item > svg { flex: none; color: #A9B8C7; }
body.pis-cp #mobile-home-dashboard .pis-cp-coming .mobile-home-empty-state, body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-empty-state { display: block; margin: 0 !important; padding: 18px 16px !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important;
    color: var(--cp-soft) !important; font: 600 14px/1.45 var(--cp-text) !important; text-align: left !important; }

/* ----- Latest Update ----- */
body.pis-cp #mobile-home-dashboard .pis-cp-latest.pis-cp-empty { display: none !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-latest-update { margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; overflow: visible !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-latest-update::before, body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-latest-update::after { display: none !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-latest-update-content { padding: 14px !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-latest-update-heading h3 { margin: 0 !important; color: var(--cp-navy) !important; font: 700 15.500px/1.25 var(--cp-text) !important; letter-spacing: 0 !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-latest-update-heading p { margin: 2px 0 0 !important; color: var(--cp-soft) !important; font: 600 13.500px/1.4 var(--cp-text) !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-latest-update-photo { margin: 12px 0 0 !important; border: 0 !important; border-radius: 14px !important; overflow: hidden; }
body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-latest-update-note { margin: 12px 0 0 !important; color: var(--cp-navy) !important; font: 500 14px/1.45 var(--cp-text) !important; }
body.pis-cp #mobile-home-dashboard .pis-cp-latest .mobile-home-card-link { display: flex !important; align-items: center !important; justify-content: center !important; width: 100% !important; min-height: 46px !important; margin: 14px 0 0 !important; padding: 0 14px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 15.500px/1 var(--cp-display) !important; text-decoration: none !important; }

/* ----- review strip ----- */
body.pis-cp #mobile-home-dashboard #client-review-credit-card { margin: 0 !important; padding: 0 !important; background: #fff !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; box-shadow: 0 5px 14px rgba(20,48,79,.045) !important; font-family: var(--cp-text); }
body.pis-cp #mobile-home-dashboard #client-review-credit-card::before { display: none !important; }
body.pis-cp #mobile-home-dashboard .review-strip-row { gap: 12px; padding: 12px 12px 12px 14px; }
body.pis-cp #mobile-home-dashboard .review-strip-icon { width: 40px; height: 40px; border: 0; border-radius: 13px; background: var(--cp-cream); font-size: 20px; }
body.pis-cp #mobile-home-dashboard .review-strip-icon-done { background: #E7F6EE; color: #1F7A45; }
body.pis-cp #mobile-home-dashboard .review-strip-copy strong { color: var(--cp-navy); font: 600 16px/1.2 var(--cp-display); letter-spacing: .1px; }
body.pis-cp #mobile-home-dashboard .review-strip-copy span { margin-top: 1px; color: var(--cp-soft); font: 600 13px/1.4 var(--cp-text); }
body.pis-cp #mobile-home-dashboard .review-strip-button { min-height: 44px !important; height: 44px; padding: 0 16px !important; border-radius: 12px !important; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important;
    box-shadow: 0 5px 12px rgba(242,107,33,.28) !important; color: #fff !important; font: 600 15px/1 var(--cp-display) !important; letter-spacing: .1px; }
body.pis-cp #mobile-home-dashboard .review-strip-footer { padding: 0 14px 12px; }
body.pis-cp #mobile-home-dashboard .review-strip-link { min-height: 44px !important; margin: -12px 0 !important; color: var(--cp-blue) !important; font: 700 14px/1 var(--cp-text) !important; }
body.pis-cp #mobile-home-dashboard #client-review-credit-card .review-credit-message { padding: 0 14px 12px; font: 600 13px/1.4 var(--cp-text); }

/* ----- birthday and Christmas cards: Home only, the new look ----- */
body.pis-cp:not(.pis-cp-home) #pis-bday-card, body.pis-cp:not(.pis-cp-home) #pis-xmas-card { display: none !important; }
body.pis-cp:not(.pis-cp-home) .client-dashboard-header.pis-has-bunting ~ #pis-bday-card ~ #dashboard-content, body.pis-cp:not(.pis-cp-home) .client-dashboard-header.pis-has-lights ~ #pis-xmas-card ~ #dashboard-content { padding-top: 34px; }
body.pis-cp #pis-bday-card, body.pis-cp #pis-xmas-card { border-radius: 20px; font-family: var(--cp-text); color: var(--cp-navy); box-shadow: 0 5px 14px rgba(20,48,79,.06); }
body.pis-cp #pis-bday-card { background: linear-gradient(140deg, #FFF3DC 0%, #FFE9EC 52%, #E7F1FD 100%) !important; border-color: #F8D9B4 !important; }
body.pis-cp #pis-xmas-card { background: linear-gradient(160deg, #FFF1F1 0%, #FFFFFF 48%, #EDF8F1 100%) !important; border-color: #F3C9CC !important; }
body.pis-cp #pis-bday-card .pis-bday-close, body.pis-cp #pis-xmas-card .pis-xmas-close { width: 44px; height: 44px; border: 0; border-radius: 14px; background: rgba(255,255,255,.92); color: var(--cp-navy); box-shadow: 0 3px 9px rgba(20,48,79,.12); }
body.pis-cp #pis-bday-card .pis-bday-close svg, body.pis-cp #pis-xmas-card .pis-xmas-close svg { width: 17px; height: 17px; }
body.pis-cp #pis-bday-card .pis-bday-eyebrow { display: none; }
body.pis-cp #pis-bday-card .pis-bday-photos img { width: 88px; height: 88px; border: 4px solid #fff; box-shadow: 0 0 0 3px #FDB833, 0 8px 18px rgba(20,48,79,.18); }
body.pis-cp #pis-bday-card .pis-bday-photos img + img { margin-left: -24px; }
body.pis-cp #pis-bday-card .pis-bday-cake { right: -8px; bottom: -6px; font-size: 30px; }
body.pis-cp #pis-bday-card h3 { color: var(--cp-navy); font: 600 26px/1.150 var(--cp-display); letter-spacing: .1px; }
body.pis-cp #pis-bday-card .pis-bday-copy > p { margin-top: 1px; color: #B4530F; font: 600 17px/1.3 var(--cp-display); }
body.pis-cp #pis-bday-card .pis-bday-present { color: #8A4B0B; }
body.pis-cp #pis-bday-card .pis-bday-present-label, body.pis-cp #pis-xmas-card .pis-xpresent-label { font: 600 16px/1.2 var(--cp-display); letter-spacing: .1px; }
body.pis-cp #pis-bday-card .pis-bday-gift strong, body.pis-cp #pis-xmas-card .pis-xticket strong { font: 600 16px/1.25 var(--cp-display); }
body.pis-cp #pis-bday-card .pis-bday-book, body.pis-cp #pis-xmas-card .pis-xmas-book { min-height: 50px; padding: 0 18px; border-radius: 15px; color: #fff; font: 600 16.500px/1 var(--cp-display); letter-spacing: .1px; }
body.pis-cp #pis-bday-card .pis-bday-book { background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%); box-shadow: 0 6px 14px rgba(242,107,33,.3); }
body.pis-cp #pis-xmas-card { padding-top: 24px; }
/* the snow falls down the two sides, clear of the words */
body.pis-cp #pis-xmas-card .pis-snow { -webkit-mask-image: linear-gradient(90deg, #000 0, #000 9%, transparent 13%, transparent 87%, #000 91%, #000 100%); mask-image: linear-gradient(90deg, #000 0, #000 9%, transparent 13%, transparent 87%, #000 91%, #000 100%); }
body.pis-cp #pis-xmas-card h3 { color: #B3202F; font: 600 29px/1.150 var(--cp-display); letter-spacing: .1px; }
body.pis-cp #pis-xmas-card .pis-xmas-eyebrow { margin-top: -5px; color: var(--cp-navy); font: 600 17px/1.3 var(--cp-display); letter-spacing: .1px; text-transform: none; }
body.pis-cp #pis-xmas-card > p { color: var(--cp-soft); font: 600 14.500px/1.45 var(--cp-text); }
body.pis-cp #pis-xmas-card > p.pis-xmas-retry { color: #B3202F; }
body.pis-cp #pis-xmas-card .pis-xpresent { color: #B3202F; }
body.pis-cp #pis-xmas-card .pis-xmas-book { background: #C41D33; box-shadow: 0 6px 14px rgba(196,29,51,.28); }

/* ----- Home on phones ----- */
@media (max-width: 700px) {
    body.pis-cp.mobile-app-screen-home #mobile-home-dashboard { display: flex !important; flex-direction: column; gap: 14px; padding: 0 0 8px !important; }
    body.pis-cp #mobile-home-dashboard > * { margin-top: 0 !important; margin-bottom: 0 !important; }
    body.pis-cp #pis-star .pis-star-bottom h2 { font-size: 27px; line-height: 1.12; }
    body.pis-cp #pis-bday-card, body.pis-cp #pis-xmas-card { margin-bottom: 14px !important; }
    body.pis-cp #pis-bday-card .pis-bday-book { margin-top: 14px; }
}

/* ----- Home on computers: the wide photo card, then Coming Up beside the month ----- */
@media (min-width: 1024px) {
    body.pis-cp.desktop-screen-home #mobile-home-dashboard#mobile-home-dashboard { grid-template-columns: minmax(0, 1.180fr) minmax(0, 1fr) !important; grid-auto-flow: row dense !important; align-items: start !important; gap: 22px !important;
        border-radius: 0 !important; box-shadow: none !important; }
    body.pis-cp #mobile-home-dashboard#mobile-home-dashboard > .pis-cp-pack, body.pis-cp #mobile-home-dashboard#mobile-home-dashboard > #client-review-credit-card,
    body.pis-cp #mobile-home-dashboard#mobile-home-dashboard > #pis-star, body.pis-cp #mobile-home-dashboard#mobile-home-dashboard > #mobile-home-next-visit-card { grid-column: 1 / -1 !important; grid-row: auto !important; }
    body.pis-cp #mobile-home-dashboard#mobile-home-dashboard > .pis-cp-coming:has(#mobile-home-upcoming-list) { grid-column: 1 !important; grid-row: auto !important; }
    body.pis-cp #mobile-home-dashboard#mobile-home-dashboard > .pis-cp-latest:has(#mobile-home-latest-update) { grid-column: 1 !important; grid-row: auto !important; }
    body.pis-cp #mobile-home-dashboard#mobile-home-dashboard > .pis-cp-month { grid-column: 2 !important; grid-row: auto / span 2 !important; }
    /* nothing counted yet this month: Coming Up and Latest Update share the row, or Coming Up takes it all */
    body.pis-cp #mobile-home-dashboard#mobile-home-dashboard.pis-cp-no-month > .pis-cp-latest:has(#mobile-home-latest-update) { grid-column: 2 !important; }
    body.pis-cp #mobile-home-dashboard#mobile-home-dashboard.pis-cp-no-month.pis-star-covers-update > .pis-cp-coming:has(#mobile-home-upcoming-list),
    body.pis-cp #mobile-home-dashboard#mobile-home-dashboard.pis-cp-no-month.pis-cp-no-latest > .pis-cp-coming:has(#mobile-home-upcoming-list) { grid-column: 1 / -1 !important; }
    .pis-cp-pack { gap: 18px; padding: 2px 2px 0; }
    body.pis-cp #pet-info .pet-profile-card { scroll-margin-top: 126px; }
    .pis-cp-pack .pis-cp-pet { min-width: 72px !important; font-size: 13.500px !important; gap: 7px; }
    .pis-cp-face { width: 66px; height: 66px; } .pis-cp-pet.is-bday::after { top: 43px; left: calc(50% + 13px); font-size: 21px; }
    body.pis-cp #pis-star .pis-star-bottom h2 { font-size: 34px; line-height: 1.12; }
    body.pis-cp #pis-star .pis-star-btn { padding: 0 26px; min-height: 50px; }
    body.pis-cp #mobile-home-dashboard .pis-cp-band { padding: 13px 18px !important; }
    body.pis-cp #mobile-home-dashboard .pis-cp-band h3 { font-size: 18.500px !important; }
    body.pis-cp #mobile-home-dashboard .mobile-home-upcoming-item { padding: 15px 16px 15px 20px !important; gap: 14px !important; }
    body.pis-cp #mobile-home-dashboard .mobile-home-upcoming-item:hover { background: #F7FAFC !important; }
    body.pis-cp #mobile-home-dashboard .pis-cp-month { padding: 18px 10px 16px !important; }
    .pis-cp-month h3 { padding: 0 12px 12px; font-size: 20px; }
    .pis-cp-tiles i { width: 38px; height: 38px; } .pis-cp-tiles b { font-size: 28px; } .pis-cp-tiles span { font-size: 13.500px; }
    .pis-cp-fun { margin: 14px 10px 0; padding: 11px 14px; font-size: 14.500px; }
    body.pis-cp #mobile-home-dashboard .review-strip-row { padding: 14px 16px 14px 18px; }
    body.pis-cp #pis-bday-card, body.pis-cp #pis-xmas-card { margin: 0 0 22px !important; }
    body.pis-cp .client-dashboard-header.pis-has-bunting ~ #pis-bday-card { margin-top: 44px !important; }
    /* the wide birthday card: the face, the words with the button under them, the present on the right */
    body.pis-cp #pis-bday-card { gap: 24px; padding: 24px 84px 24px 28px; }
    body.pis-cp #pis-bday-card .pis-bday-copy { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 32px; row-gap: 4px; align-items: center; justify-items: start; }
    body.pis-cp #pis-bday-card .pis-bday-copy > * { grid-column: 1; }
    body.pis-cp #pis-bday-card .pis-bday-present { grid-column: 2; grid-row: 1 / span 5; align-self: center; margin: 0; padding: 0; }
    body.pis-cp #pis-bday-card .pis-bday-book { width: auto !important; margin-top: 12px; padding: 0 26px; }
    body.pis-cp #pis-bday-card .pis-bday-gift { width: auto; max-width: 440px; margin-top: 10px; }
    body.pis-cp .client-dashboard-header.pis-has-lights ~ #pis-xmas-card { margin-top: 36px !important; }
}
@media (prefers-reduced-motion: reduce) { .pis-cp-pet:active .pis-cp-face { transform: none; } }

/* =====================================================================
   PART 3: SERVICES
   ===================================================================== */
body.pis-cp-services .upcoming-services-header { display: none !important; }      /* the header already says Services / Select a Date */
/* the selected day is one box: the cream band is its heading, the visits sit inside it */
body.pis-cp-services #selected-upcoming-day { padding: 0 !important; background: #fff !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; box-shadow: 0 5px 14px rgba(20,48,79,.045) !important; font-family: var(--cp-text); }
body.pis-cp-services #selected-upcoming-day::before, body.pis-cp-services #selected-upcoming-day::after { display: none !important; }
body.pis-cp-services #selected-upcoming-day > .selected-upcoming-header { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 8px !important; min-height: 0 !important; margin: 0 !important; padding: 11px 14px !important;
    background: var(--cp-cream) !important; border: 0 !important; border-bottom: 1px solid var(--cp-band-line) !important; border-radius: 19px 19px 0 0 !important; box-shadow: none !important; }
body.pis-cp-services #selected-upcoming-day > .selected-upcoming-header > svg { flex: none; color: var(--cp-tang); }
body.pis-cp-services #selected-upcoming-date { display: none !important; }       /* the app still writes the date here; the line beside it shows it, sized to fit */
.pis-cp-daytitle { flex: 1 1 auto; min-width: 0; color: var(--cp-navy); font: 600 17px/1.2 var(--cp-display); letter-spacing: .1px; white-space: nowrap; overflow: hidden; text-align: left; }
.pis-cp-daycount { flex: none; color: #8A6A3A; font: 600 13px/1 var(--cp-text); white-space: nowrap; }
.pis-cp-daycount:empty { display: none; }
body.pis-cp-services #selected-upcoming-services { display: flex !important; flex-direction: column !important; gap: 10px !important; margin: 0 !important; padding: 12px 10px 14px !important; background: none !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
body.pis-cp-services #selected-upcoming-services > .empty-upcoming-message { margin: 0 !important; padding: 6px 6px 4px !important; border: 0 !important; background: none !important; color: var(--cp-soft) !important; font: 600 14px/1.45 var(--cp-text) !important; text-align: left !important; }
/* Morning / Afternoon / Evening */
.pis-cp-part { display: flex; align-items: center; gap: 8px; margin: 8px 2px 0; color: #46617D; font: 800 12px/1.2 var(--cp-text); letter-spacing: .1em; text-transform: uppercase; }
.pis-cp-part:first-child { margin-top: 0; }
.pis-cp-part em { padding: 2px 8px; border-radius: 999px; background: #E3EFFB; color: #1F63B8; font: 800 11px/1.2 var(--cp-text); font-style: normal; letter-spacing: 0; }
/* one slim card per visit, tinted by where it stands */
body.pis-cp-services #selected-upcoming-services > button.csd-summary[data-cp="1"] { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 12px !important; width: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 12px 12px 12px 19px !important;
    border: 1px solid #DBE7F3 !important; border-radius: 16px !important; background: #fff !important; box-shadow: inset 5px 0 0 var(--pk), 0 4px 12px rgba(22,50,79,.05) !important; font-family: var(--cp-text) !important; text-align: left !important; }
body.pis-cp-services #selected-upcoming-services > button.csd-summary[data-cp="1"].csd-complete { background: #F0F9F2 !important; border-color: #C9E8D1 !important; }
body.pis-cp-services #selected-upcoming-services > button.csd-summary[data-cp="1"].csd-live { background: #FFF7EA !important; border-color: #F0CF96 !important; }
body.pis-cp-services button.csd-summary[data-cp="1"] > .csd-copy { display: none !important; }
body.pis-cp-services button.csd-summary[data-cp="1"] > .pis-kind-icon { position: relative; flex: none; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 14px; background: var(--pkb); color: var(--pk); overflow: visible; }
body.pis-cp-services button.csd-summary[data-cp="1"] > .pis-kind-icon svg { width: 22px; height: 22px; }
body.pis-cp-services button.csd-summary[data-cp="1"].csd-complete > .pis-kind-icon::after, body.pis-cp-services button.csd-summary[data-cp="1"].csd-live > .pis-kind-icon::after { content: ""; position: absolute; right: -5px; bottom: -5px; width: 16px; height: 16px; border: 2px solid #fff; border-radius: 50%;
    background: #2E8B4E url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5.200 12.500 4.300 4.300 9-9.600'/%3E%3C/svg%3E") center / 11px 11px no-repeat; }
body.pis-cp-services button.csd-summary[data-cp="1"].csd-live > .pis-kind-icon::after { background-color: #DC8A0C; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='7.500'/%3E%3Cpath d='M12 8v4.200l2.800 1.800'/%3E%3C/svg%3E"); }
.pis-cp-visit { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.pis-cp-v1 { color: #46617D; font-size: 13px; font-weight: 600; line-height: 1.35; white-space: nowrap; overflow: hidden; }
.pis-cp-v2 { color: #16324F; font-size: 16px; font-weight: 700; line-height: 1.3; white-space: nowrap; overflow: hidden; }
.pis-cp-v3 { color: #46617D; font-size: 14px; font-weight: 400; line-height: 1.35; white-space: nowrap; overflow: hidden; }
.csd-live .pis-cp-v1, .csd-live .pis-cp-v3 { color: #6B4A14; }
.csd-complete .pis-cp-v1.is-state { color: #1F7A3A; font-weight: 700; }
.pis-cp-tag { align-self: flex-start; margin-top: 3px; padding: 3px 9px; border-radius: 999px; background: var(--pkb); color: var(--pk); font-size: 11px; font-weight: 700; line-height: 1.2; white-space: nowrap; }
body.pis-cp-services button.csd-summary[data-cp="1"] > .csd-arrow { flex: none; display: grid !important; place-items: center; height: 44px !important; min-width: 0; padding: 0 16px !important; border: 0 !important; border-radius: 12px !important; background: var(--pkg) !important; color: #fff !important;
    font: 700 13.500px/1 var(--cp-text) !important; box-shadow: 0 4px 10px rgba(22,50,79,.14); }
@media (max-width: 700px) {
    body.pis-cp-services.mobile-app-screen-services #services-section { padding-top: 0 !important; }
    body.pis-cp-services .upcoming-calendar { margin-top: 0 !important; }
}
@media (min-width: 1024px) {
    /* no box around the two boxes: the calendar and the day stand on the page by themselves */
    body.pis-cp-services.desktop-screen-services #services-section { padding: 0 !important; background: none !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; gap: 22px !important; }
    body.pis-cp-services.desktop-screen-services #services-section::before { display: none !important; }
    body.pis-cp-services.desktop-screen-services .upcoming-calendar { position: relative; overflow: hidden; border-radius: 20px !important; }
    body.pis-cp-services.desktop-screen-services .upcoming-calendar::before { content: "" !important; display: block !important; position: absolute; left: 0; right: 0; top: 0; height: 5px; background: linear-gradient(90deg, #F5AB40 0%, #EF602C 100%); }
    body.pis-cp-services #selected-upcoming-day > .selected-upcoming-header { padding: 13px 18px !important; }
    .pis-cp-daytitle { font-size: 18.500px; }
    body.pis-cp-services #selected-upcoming-services { padding: 14px 14px 16px !important; }
    body.pis-cp-services #selected-upcoming-services > button.csd-summary[data-cp="1"] { padding: 14px 14px 14px 22px !important; gap: 14px !important; }
    body.pis-cp-services button.csd-summary[data-cp="1"] > .csd-arrow { padding: 0 20px !important; font-size: 14.500px !important; }
    .pis-cp-part { margin: 10px 4px 0; }
}

/* =====================================================================
   PART 4: BOOKING (the Request Service form)
   ===================================================================== */
/* while the form is open it is the page: the calendar and the day list wait underneath */
body.pis-cp-booking #services-section { display: none !important; }
body.pis-cp-booking #request-walk-button { display: none !important; }
body.pis-cp #booking-section { margin: 0 0 18px !important; padding: 0 !important; background: #fff !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; box-shadow: 0 5px 14px rgba(20,48,79,.045) !important; color: var(--cp-navy); font-family: var(--cp-text); }
body.pis-cp #booking-section::before, body.pis-cp #booking-section::after, body.pis-cp #booking-form::before, body.pis-cp #booking-form::after { display: none !important; }
body.pis-cp #booking-section > .section-header { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; min-height: 0 !important; margin: 0 !important; padding: 6px 6px 6px 14px !important; background: var(--cp-cream) !important;
    border: 0 !important; border-bottom: 1px solid var(--cp-band-line) !important; border-radius: 19px 19px 0 0 !important; }
body.pis-cp #booking-section > .section-header > svg { flex: none; color: var(--cp-tang); }
body.pis-cp #booking-section > .section-header h3 { flex: 1 1 auto; min-width: 0; margin: 0 !important; padding: 0 !important; color: var(--cp-navy) !important; font: 600 17px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; white-space: nowrap; text-align: left; }
body.pis-cp #close-booking-button { flex: none; display: grid !important; place-items: center !important; width: 44px !important; height: 44px !important; min-width: 44px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 14px !important;
    background: none !important; box-shadow: none !important; color: var(--cp-navy) !important; font-size: 0 !important; line-height: 0 !important; }
body.pis-cp #close-booking-button:active { background: rgba(20,48,79,.06) !important; }
body.pis-cp #booking-form { display: block !important; margin: 0 !important; padding: 16px 14px 16px !important; background: none !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
/* each step's label */
body.pis-cp #booking-form label:not(.additional-pet-option) { display: block !important; margin: 18px 2px 7px !important; padding: 0 !important; color: var(--cp-navy) !important; font: 600 16px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; }
body.pis-cp #booking-form > label:first-of-type, body.pis-cp #booking-section[data-cp-step] #time-window-wrapper > label:first-of-type { margin-top: 0 !important; }
body.pis-cp #booking-form .booking-help, body.pis-cp #booking-form #booking-date-help { margin: 7px 2px 0 !important; padding: 0 !important; color: var(--cp-soft) !important; font: 600 13px/1.4 var(--cp-text) !important; text-align: left !important; text-wrap: balance; }
body.pis-cp #booking-form #booking-date-help { margin: -3px 2px 9px !important; }
/* the pickers */
body.pis-cp #booking-form select, body.pis-cp #booking-form input[type="date"], body.pis-cp #booking-form input[type="text"] { box-sizing: border-box !important; display: block !important; width: 100% !important; height: 50px !important; min-height: 50px !important; margin: 0 !important; padding: 0 40px 0 14px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background-color: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 16px/1.2 var(--cp-text) !important; }
body.pis-cp #booking-form select { -webkit-appearance: none !important; appearance: none !important;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2351677F' stroke-width='2.400' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9.500 6 6 6-6'/%3E%3C/svg%3E") !important; background-repeat: no-repeat !important; background-position: right 12px center !important; background-size: 20px 20px !important; }
body.pis-cp #booking-form input[type="date"], body.pis-cp #booking-form input[type="text"] { padding-right: 14px !important; }
body.pis-cp #booking-form select:focus, body.pis-cp #booking-form input:focus { outline: none !important; border-color: #F8A534 !important; box-shadow: 0 0 0 3px rgba(248,165,52,.22) !important; }
body.pis-cp #booking-form select:disabled, body.pis-cp #booking-form input:disabled { background-color: #F4F7FA !important; color: #8193A6 !important; }
/* additional pets */
body.pis-cp #booking-form .additional-pets-list { display: flex !important; flex-direction: column !important; gap: 8px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
body.pis-cp #booking-form .additional-pet-option { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 10px !important; min-height: 50px !important; margin: 0 !important; padding: 0 12px 0 14px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 16px/1.2 var(--cp-text) !important; cursor: pointer; }
body.pis-cp #booking-form .additional-pet-option:has(input:checked) { border-color: #F8A534 !important; background: #FFF8EC !important; }
body.pis-cp #booking-form .additional-pet-main { display: flex !important; align-items: center !important; gap: 11px !important; min-width: 0; }
body.pis-cp #booking-form .additional-pet-checkbox { flex: none; width: 22px !important; height: 22px !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; accent-color: #F47B20; }
body.pis-cp #booking-form .additional-pet-fee { flex: none; padding: 5px 10px !important; border: 0 !important; border-radius: 999px !important; background: #EAF1F7 !important; color: var(--cp-soft) !important; font: 800 12px/1 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: capitalize !important; white-space: nowrap; }
/* quiet buttons: Repeat Last Week's Booking, Add Another Visit Time, remove a time */
body.pis-cp #booking-form .repeat-last-week-booking { margin: 14px 0 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
body.pis-cp #booking-form .repeat-last-week-booking-button, body.pis-cp #booking-form .add-booking-time-button { display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; width: 100% !important; height: 48px !important; min-height: 48px !important; margin: 0 !important; padding: 0 14px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 15.500px/1 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; }
body.pis-cp #booking-form .add-booking-time-button { margin-top: 10px !important; border-style: dashed !important; border-color: #B9C8D8 !important; color: var(--cp-blue) !important; }
body.pis-cp #booking-form .repeat-last-week-booking-button:disabled, body.pis-cp #booking-form .add-booking-time-button:disabled { opacity: .55 !important; }
body.pis-cp #booking-form .repeat-last-week-booking-icon { color: var(--cp-tang) !important; font-size: 18px !important; line-height: 1 !important; }
body.pis-cp #booking-form .booking-time-windows { display: flex !important; flex-direction: column !important; gap: 10px !important; margin: 0 !important; }
body.pis-cp #booking-form .booking-time-row { display: flex !important; align-items: center !important; gap: 8px !important; margin: 0 !important; }
body.pis-cp #booking-form .booking-time-row > select { flex: 1 1 auto !important; min-width: 0 !important; }
body.pis-cp #booking-form .booking-time-row > button { flex: none !important; display: grid !important; place-items: center !important; width: 50px !important; height: 50px !important; min-width: 50px !important; margin: 0 !important; padding: 0 !important; border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important;
    background: #fff !important; box-shadow: none !important; color: #C0392B !important; font-size: 20px !important; line-height: 1 !important; }
/* the dates calendar keeps its own look; its frame matches the other boxes */
body.pis-cp #booking-form .booking-calendar { margin: 0 !important; border: 1.500px solid var(--cp-line) !important; border-radius: 16px !important; box-shadow: none !important; }
/* Selected Dates */
body.pis-cp #booking-form #selected-dates-container { margin: 16px 0 0 !important; padding: 0 !important; border: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp #booking-form .selected-dates-header { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 10px !important; margin: 0 2px 9px !important; padding: 0 !important; border: 0 !important; background: none !important; }
body.pis-cp #booking-form .selected-dates-header strong { color: var(--cp-navy) !important; font: 600 16px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp #booking-form #selected-date-count { padding: 5px 10px !important; border: 0 !important; border-radius: 999px !important; background: var(--cp-cream) !important; color: #8A4B0B !important; font: 800 12px/1 var(--cp-text) !important; text-transform: capitalize !important; white-space: nowrap; }
body.pis-cp #booking-form #selected-dates-list { display: flex !important; flex-direction: column !important; gap: 8px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
body.pis-cp #booking-form .empty-dates-message { margin: 0 !important; padding: 14px !important; border: 1.500px dashed #C9D6E2 !important; border-radius: 14px !important; background: none !important; color: var(--cp-soft) !important; font: 600 14px/1.4 var(--cp-text) !important; text-align: center !important; }
body.pis-cp #booking-form .selected-date-group { margin: 0 !important; padding: 0 !important; border: 1.500px solid var(--cp-line) !important; border-radius: 16px !important; background: #fff !important; box-shadow: none !important; overflow: hidden; }
body.pis-cp #booking-form .selected-date-group-header { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 10px !important; width: 100% !important; min-height: 56px !important; margin: 0 !important; padding: 8px 12px 8px 14px !important; border: 0 !important; border-radius: 0 !important;
    background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; text-align: left !important; }
body.pis-cp #booking-form .selected-date-group-header-copy { display: block !important; min-width: 0; }
body.pis-cp #booking-form .selected-date-group-title { display: block !important; color: var(--cp-navy) !important; font: 600 15.500px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp #booking-form .selected-date-group-meta { display: block !important; margin-top: 1px !important; color: var(--cp-soft) !important; font: 600 13px/1.3 var(--cp-text) !important; text-transform: capitalize !important; }
body.pis-cp #booking-form .selected-date-group-arrow { flex: none; display: grid !important; place-items: center !important; width: 32px !important; height: 32px !important; border-radius: 10px !important; background: #F1F5F9 !important; color: var(--cp-soft) !important; font-size: 0 !important; line-height: 0 !important; transition: transform .15s ease; }
body.pis-cp #booking-form .selected-date-group-arrow::after { content: ""; width: 18px; height: 18px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2351677F' stroke-width='2.600' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9.500 6 6 6-6'/%3E%3C/svg%3E") center / contain no-repeat; }
body.pis-cp #booking-form .selected-date-group-arrow-open { transform: rotate(180deg) !important; }
body.pis-cp #booking-form .selected-date-group-content { display: flex; flex-direction: column; gap: 8px; margin: 0 !important; padding: 10px !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; background: #F8FAFC !important; }
body.pis-cp #booking-form .selected-date-group-content[hidden] { display: none !important; }
body.pis-cp #booking-form .selected-date-item { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 10px !important; margin: 0 !important; padding: 10px 10px 10px 16px !important; border: 1px solid #DBE7F3 !important; border-radius: 14px !important; background: #fff !important;
    box-shadow: inset 5px 0 0 #1F63B8 !important; }
body.pis-cp #booking-form .selected-date-item::before, body.pis-cp #booking-form .selected-date-item::after { display: none !important; }
body.pis-cp #booking-form .selected-visit-summary { flex: 1 1 auto !important; min-width: 0 !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important; gap: 3px !important; text-align: left !important; }
body.pis-cp #booking-form .selected-visit-pet-chips { display: flex !important; flex-wrap: wrap !important; justify-content: flex-start !important; gap: 5px !important; margin: 0 !important; }
body.pis-cp #booking-form .selected-visit-pet-chip { padding: 3px 9px !important; border: 0 !important; border-radius: 999px !important; background: #EAF1F7 !important; color: var(--cp-soft) !important; font: 800 11.500px/1.2 var(--cp-text) !important; }
body.pis-cp #booking-form .selected-visit-service-line { display: block !important; margin: 0 !important; color: var(--cp-navy) !important; font: 700 15.500px/1.3 var(--cp-text) !important; }
body.pis-cp #booking-form .selected-visit-service-name, body.pis-cp #booking-form .selected-visit-service-option, body.pis-cp #booking-form .selected-visit-service-separator { color: inherit !important; font: inherit !important; }
body.pis-cp #booking-form .selected-visit-time-row { margin: 0 !important; }
body.pis-cp #booking-form .selected-visit-time { color: var(--cp-soft) !important; font: 600 13.500px/1.35 var(--cp-text) !important; }
body.pis-cp #booking-form .remove-date-button { flex: none !important; width: auto !important; height: 44px !important; min-height: 44px !important; margin: 0 !important; padding: 0 13px !important; border: 1.500px solid #F3C9C4 !important; border-radius: 12px !important; background: #fff !important; box-shadow: none !important;
    color: #C0392B !important; font: 700 13.500px/1 var(--cp-text) !important; text-transform: none !important; }
/* boarding */
body.pis-cp #booking-form .boarding-policy { margin: 14px 0 0 !important; padding: 13px 14px !important; border: 1px solid var(--cp-band-line) !important; border-radius: 14px !important; background: var(--cp-cream) !important; box-shadow: none !important; }
body.pis-cp #booking-form .boarding-policy strong { display: block !important; margin: 0 0 4px !important; color: var(--cp-navy) !important; font: 600 16px/1.25 var(--cp-display) !important; }
body.pis-cp #booking-form .boarding-policy strong .pis-cp-rate { display: block; margin-top: 2px; color: #8A4B0B; font: 700 14px/1.3 var(--cp-text); }
body.pis-cp #booking-form .boarding-policy p { margin: 0 !important; color: #8A4B0B !important; font: 600 13.500px/1.45 var(--cp-text) !important; text-wrap: balance; }
/* the total and Continue */
body.pis-cp #booking-form .booking-total { display: flex !important; align-items: baseline !important; justify-content: space-between !important; gap: 10px !important; margin: 20px 0 0 !important; padding: 16px 2px 0 !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; background: none !important; }
body.pis-cp #booking-form #booking-count { color: var(--cp-soft) !important; font: 700 15.500px/1.2 var(--cp-text) !important; text-transform: capitalize !important; }
body.pis-cp #booking-form #booking-price { color: var(--cp-navy) !important; font: 600 28px/1 var(--cp-display) !important; letter-spacing: .1px !important; font-variant-numeric: tabular-nums; }
body.pis-cp #booking-form .booking-price-details { margin: 5px 2px 0 !important; padding: 0 !important; border: 0 !important; background: none !important; color: var(--cp-soft) !important; font: 600 13px/1.45 var(--cp-text) !important; text-align: right !important; text-wrap: balance; }
body.pis-cp #booking-form .booking-price-details:empty { display: none !important; }
body.pis-cp #booking-submit-button { display: flex !important; align-items: center !important; justify-content: center !important; width: 100% !important; height: 52px !important; min-height: 52px !important; margin: 16px 0 0 !important; padding: 0 18px !important; border: 0 !important; border-radius: 15px !important;
    background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; color: #fff !important; font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; }
body.pis-cp #booking-submit-button:disabled { opacity: .6 !important; box-shadow: none !important; }
body.pis-cp #booking-message { margin: 10px 2px 0 !important; color: #C0392B !important; font: 600 14px/1.4 var(--cp-text) !important; text-align: left !important; }
body.pis-cp #booking-message:empty { display: none !important; }
/* ----- booking in three steps: Pet and Service, Times and Dates, Review ----- */
body.pis-cp #booking-section .pis-cp-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin: 0; padding: 12px 14px 0; }
body.pis-cp #booking-section .pis-cp-steps button { display: flex !important; flex-direction: column !important; align-items: stretch !important; justify-content: flex-start !important; gap: 6px !important; width: auto !important; min-width: 0 !important; height: auto !important; min-height: 44px !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; color: #8193A6 !important; font: 700 12px/1.2 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; text-align: left !important; white-space: nowrap; cursor: pointer; }
body.pis-cp #booking-section .pis-cp-steps button::before { content: ""; display: block; height: 6px; border-radius: 3px; background: #E3EAF2; }
body.pis-cp #booking-section .pis-cp-steps button.is-done { color: #1F7A45 !important; }
body.pis-cp #booking-section .pis-cp-steps button.is-done::before { background: #2E9E5B; }
body.pis-cp #booking-section .pis-cp-steps button.is-now { color: var(--cp-navy) !important; }
body.pis-cp #booking-section .pis-cp-steps button.is-now::before { background: linear-gradient(90deg, #F8A534 0%, #F26B21 100%); }
body.pis-cp #booking-section[data-cp-step="1"] [data-cp-in]:not([data-cp-in~="1"]), body.pis-cp #booking-section[data-cp-step="2"] [data-cp-in]:not([data-cp-in~="2"]), body.pis-cp #booking-section[data-cp-step="3"] [data-cp-in]:not([data-cp-in~="3"]) { display: none !important; }
body.pis-cp #booking-section[data-cp-step="3"] #multi-date-booking > label, body.pis-cp #booking-section[data-cp-step="3"] #multi-date-booking > #booking-date-help, body.pis-cp #booking-section[data-cp-step="3"] #multi-date-booking > .booking-calendar { display: none !important; }
body.pis-cp #booking-section[data-cp-step] #booking-form > [data-cp-first] { margin-top: 0 !important; }
body.pis-cp #booking-section[data-cp-step="3"] #selected-dates-container { margin-top: 0 !important; }
.pis-cp-stepnav { display: flex; flex-direction: column; align-items: stretch; gap: 10px; margin: 18px 0 0; padding: 14px 0 0; border-top: 1px solid var(--cp-line); }
body.pis-cp #booking-section[data-cp-step="3"] .pis-cp-stepnav { border-top: 0; margin-top: 10px; padding-top: 0; }
body.pis-cp #booking-section .pis-cp-back, body.pis-cp #booking-section .pis-cp-next { display: flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important; width: auto !important; min-width: 0 !important; height: 52px !important; min-height: 52px !important; margin: 0 !important; padding: 0 18px !important; border-radius: 15px !important;
    font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
body.pis-cp #booking-section .pis-cp-back { flex: none !important; height: 48px !important; min-height: 48px !important; font-size: 15.500px !important; border: 1.500px solid var(--cp-line) !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; }
body.pis-cp #booking-section .pis-cp-next { flex: none !important; border: 0 !important; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; color: #fff !important; }
body.pis-cp #booking-section .pis-cp-back[hidden], body.pis-cp #booking-section .pis-cp-next[hidden] { display: none !important; }
.pis-cp-sofar { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin: 16px 2px 0; color: var(--cp-soft); font: 700 14.500px/1.2 var(--cp-text); }
.pis-cp-sofar b { color: var(--cp-navy); font: 600 20px/1 var(--cp-display); font-variant-numeric: tabular-nums; }
.pis-cp-sofar:empty, .pis-cp-stepnote:empty { display: none; }
.pis-cp-sofar + .pis-cp-stepnav, .pis-cp-sofar + .pis-cp-stepnote:empty + .pis-cp-stepnav { margin-top: 12px; }
.pis-cp-stepnote { margin: 16px 2px 0; padding: 10px 12px; border-radius: 12px; background: #FDECEA; color: #B03024; font: 700 14px/1.35 var(--cp-text); text-align: center; }
.pis-cp-stepnote + .pis-cp-stepnav { margin-top: 12px; }
/* boarding has no list of days, so Review shows the stay: one fact per line */
.pis-cp-stay { margin: 0; border: 1.500px solid var(--cp-band-line); border-radius: 16px; background: #FFFAF2; overflow: hidden; }
.pis-cp-stay:empty { display: none; }
.pis-cp-stay h4 { display: flex; align-items: center; gap: 8px; margin: 0; padding: 12px 14px; background: var(--cp-cream); color: var(--cp-navy); font: 600 16.500px/1.2 var(--cp-display); }
.pis-cp-stay h4 svg { color: #C0610C; }
.pis-cp-stay div { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; padding: 11px 14px; border-top: 1px solid var(--cp-band-line); }
.pis-cp-stay span { flex: none; color: var(--cp-soft); font: 700 13.500px/1.3 var(--cp-text); }
.pis-cp-stay b { min-width: 0; color: var(--cp-navy); font: 700 14.500px/1.3 var(--cp-text); text-align: right; overflow-wrap: anywhere; }
/* a booked visit's lines stay whole: smaller first, then Remove moves underneath, and only then may a line wrap */
body.pis-cp #booking-section[data-cp-step] .selected-visit-service-line, body.pis-cp #booking-section[data-cp-step] .selected-visit-time { display: block !important; max-width: 100%; overflow: hidden; white-space: nowrap !important; }
body.pis-cp #booking-section[data-cp-step] .selected-visit-time-row { max-width: 100%; }
body.pis-cp #booking-section[data-cp-step] .selected-date-item.is-stack { flex-wrap: wrap !important; }
body.pis-cp #booking-section[data-cp-step] .selected-date-item.is-stack .selected-visit-summary { flex: 1 1 100% !important; }
body.pis-cp #booking-section[data-cp-step] .selected-date-item.is-stack .remove-date-button { height: 38px !important; min-height: 38px !important; margin-left: auto !important; }
body.pis-cp #booking-section[data-cp-step] .selected-date-item.is-wrap .selected-visit-service-line, body.pis-cp #booking-section[data-cp-step] .selected-date-item.is-wrap .selected-visit-time { white-space: normal !important; }
.pis-cp-keepnote { margin: 12px 2px 0; padding: 9px 12px; border-radius: 13px; background: var(--cp-cream); color: #8A4B0B; font: 700 13px/1.4 var(--cp-text); text-align: center; text-wrap: balance; }
.pis-cp-keepnote[hidden] { display: none; }
/* the app's own pickers stay in the page (they hold the answers) but out of sight when a friendlier chooser stands in */
body.pis-cp #booking-form select.pis-cp-held { position: absolute !important; width: 1px !important; height: 1px !important; min-height: 0 !important; padding: 0 !important; border: 0 !important; opacity: 0 !important; pointer-events: none !important; }
/* choose a pet by its face */
.pis-cp-bkpets { display: flex; gap: 14px; margin: 0; padding: 3px 3px 2px; overflow-x: auto; scrollbar-width: none; }
.pis-cp-bkpets::-webkit-scrollbar { display: none; }
body.pis-cp #booking-form .pis-cp-bkpets button { flex: none !important; display: flex !important; flex-direction: column !important; align-items: center !important; gap: 5px !important; width: auto !important; min-width: 68px !important; height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important;
    background: none !important; box-shadow: none !important; color: var(--cp-soft) !important; font: 700 13px/1.25 var(--cp-text) !important; text-transform: none !important; white-space: nowrap; cursor: pointer; position: relative; -webkit-tap-highlight-color: transparent; }
.pis-cp-bkpets .pis-cp-face { width: 64px; height: 64px; box-shadow: 0 0 0 2px #D5E0EA; opacity: .9; }
.pis-cp-bkpets button.is-on { color: var(--cp-navy) !important; }
.pis-cp-bkpets button.is-on .pis-cp-face { opacity: 1; box-shadow: 0 0 0 3px #F47B20, 0 6px 14px rgba(242,107,33,.28); }
.pis-cp-bkpets button.is-on::after { content: ""; position: absolute; left: calc(50% + 14px); top: 44px; width: 18px; height: 18px; border: 2px solid #fff; border-radius: 50%;
    background: #F47B20 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.400' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5.200 12.500 4.300 4.300 9-9.600'/%3E%3C/svg%3E") center / 12px 12px no-repeat; }
/* choose a service by its tile */
.pis-cp-bktiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
body.pis-cp #booking-form .pis-cp-bktiles button { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 8px !important; width: auto !important; min-width: 0 !important; height: auto !important; min-height: 62px !important; margin: 0 !important; padding: 9px 8px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 16px !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 700 14.500px/1.2 var(--cp-text) !important; text-transform: none !important; text-align: left !important; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pis-cp-bktiles i { flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 12px; background: color-mix(in srgb, var(--bk, #1F63B8) 14%, #fff); color: var(--bk, #1F63B8); font-style: normal; }
.pis-cp-bktiles span { flex: 1 1 auto; min-width: 0; display: block; }
.pis-cp-bktiles b { display: block; overflow: hidden; font: inherit; white-space: nowrap; }
.pis-cp-bktiles button.is-wrap b { white-space: normal; }
body.pis-cp #booking-section .pis-cp-steps button span { display: block; overflow: hidden; }
@media (max-width: 345px) { .pis-cp-bktiles { grid-template-columns: minmax(0, 1fr); } }
.pis-cp-bktiles small { display: block; margin-top: 1px; color: var(--cp-soft); font-size: 12px; font-weight: 600; }
body.pis-cp #booking-form .pis-cp-bktiles button.is-on { border-color: var(--bk, #1F63B8) !important; background: color-mix(in srgb, var(--bk, #1F63B8) 8%, #fff) !important; box-shadow: 0 0 0 1.500px var(--bk, #1F63B8) !important; }
/* choose a length by its chip */
.pis-cp-bkchips { display: flex; flex-wrap: wrap; gap: 9px; }
body.pis-cp #booking-form .pis-cp-bkchips button { flex: 1 1 auto !important; white-space: nowrap !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; gap: 2px !important; width: auto !important; min-width: 70px !important; height: auto !important; min-height: 58px !important; margin: 0 !important; padding: 8px 10px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 16px/1.15 var(--cp-display) !important; text-transform: none !important; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pis-cp-bkchips small { color: var(--cp-soft); font: 700 13px/1.2 var(--cp-text); }
body.pis-cp #booking-form .pis-cp-bkchips button.is-on { border-color: #F47B20 !important; background: #FFF3E0 !important; box-shadow: 0 0 0 1.500px #F47B20 !important; }
.pis-cp-bkchips button.is-on small { color: #8A4B0B; }
/* the line under Repeat Last Week's Booking sits centered under its button */
body.pis-cp #booking-form .repeat-last-week-booking-message { text-align: center !important; }
/* the day that is open stands apart from the closed ones */
body.pis-cp #booking-form .selected-date-group:has(> .selected-date-group-header[aria-expanded="true"]) { border-color: var(--cp-band-line) !important; }
body.pis-cp #booking-form .selected-date-group-header[aria-expanded="true"] { background: var(--cp-cream) !important; }
body.pis-cp #booking-form .selected-date-group-header[aria-expanded="true"] .selected-date-group-arrow { background: #fff !important; }
body.pis-cp #booking-form .selected-date-group-header[aria-expanded="true"] + .selected-date-group-content { border-top-color: var(--cp-band-line) !important; background: #FFFAF2 !important; }
@media (min-width: 1200px) {
    body.pis-cp #booking-section[data-cp-step="2"] #selected-dates-container { display: block !important; }
}
@media (max-width: 1199px) {
    body.pis-cp #booking-section[data-cp-step="2"] #selected-dates-container { display: none !important; }
}
@media (min-width: 1024px) {
    body.pis-cp #booking-section .pis-cp-steps { padding: 14px 20px 0; max-width: 620px; }
    .pis-cp-bktiles { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .pis-cp-bkchips { max-width: 520px; }
    .pis-cp-stepnav { padding-left: calc(100% - 340px); }
    body.pis-cp #booking-section[data-cp-step="3"] .pis-cp-stepnav { padding-left: 0; }
    .pis-cp-sofar { justify-content: flex-end; gap: 16px; }
}
@media (max-width: 700px) {
    body.pis-cp.mobile-app-screen-services #booking-section { margin-top: 0 !important; }
}
@media (min-width: 1024px) {
    body.pis-cp #booking-section > .section-header { padding: 8px 10px 8px 18px !important; }
    body.pis-cp #booking-section > .section-header h3 { font-size: 18.500px !important; }
    body.pis-cp #booking-form { padding: 20px 20px 20px !important; }
    body.pis-cp #booking-submit-button { max-width: 420px; margin-left: auto !important; }
    body.pis-cp.desktop-screen-services #multi-date-booking { row-gap: 0 !important; }
    body.pis-cp.desktop-screen-services #multi-date-booking > #booking-date-help { margin: -3px 2px 10px !important; }
    body.pis-cp #booking-form #selected-dates-container { margin-top: 0 !important; }
    body.pis-cp #booking-form .repeat-last-week-booking-button, body.pis-cp #booking-form .add-booking-time-button { max-width: 420px; }
    body.pis-cp #booking-form .repeat-last-week-booking { max-width: 420px; }
    /* beside the calendar the list is a narrow column: Remove becomes a small corner button so the service line keeps its full width */
    body.pis-cp.desktop-screen-services #booking-section:not([data-cp-step="3"]) .selected-date-item { position: relative !important; padding-right: 48px !important; }
    body.pis-cp.desktop-screen-services #booking-section:not([data-cp-step="3"]) .remove-date-button { position: absolute !important; top: 8px !important; right: 8px !important; width: 34px !important; height: 34px !important; min-height: 34px !important; padding: 0 !important; border-radius: 10px !important;
        font-size: 0 !important; color: #C0392B !important; }
    body.pis-cp.desktop-screen-services #booking-section:not([data-cp-step="3"]) .remove-date-button::before { content: ""; display: block; width: 14px; height: 14px; margin: auto; background: currentColor;
        -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M6 6l12 12M18 6 6 18'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M6 6l12 12M18 6 6 18'/%3E%3C/svg%3E") center / contain no-repeat; }
    /* review on a computer: the days on the left, the total and Continue on the right */
    body.pis-cp #booking-section[data-cp-step="3"] #booking-form { display: grid !important; grid-template-columns: minmax(0, 1fr) 340px; grid-template-rows: repeat(7, auto) 1fr; column-gap: 28px; align-items: start; }
    body.pis-cp #booking-section[data-cp-step="3"] #booking-form > * { grid-column: 2; }
    body.pis-cp #booking-section[data-cp-step="3"] #booking-form > #multi-date-booking { grid-column: 1; grid-row: 1 / -1; grid-template-columns: minmax(0, 1fr) !important; }
    body.pis-cp #booking-section[data-cp-step="3"] #booking-form > #multi-date-booking > #selected-dates-container { grid-column: 1 !important; grid-row: auto !important; }
    body.pis-cp #booking-section[data-cp-step="3"] #booking-form > .pis-cp-stay { grid-column: 1; grid-row: 1 / -1; }
    body.pis-cp #booking-section[data-cp-step="3"] #booking-form > .booking-total { margin-top: 0 !important; padding: 16px 16px 4px !important; border: 1.500px solid var(--cp-band-line) !important; border-bottom: 0 !important; border-radius: 16px 16px 0 0 !important; background: var(--cp-cream) !important; }
    body.pis-cp #booking-section[data-cp-step="3"] #booking-form > #booking-price-details { margin: 0 !important; padding: 0 16px 14px !important; border: 1.500px solid var(--cp-band-line) !important; border-top: 0 !important; border-radius: 0 0 16px 16px !important; background: var(--cp-cream) !important; text-align: right !important; }
    body.pis-cp #booking-section[data-cp-step="3"] #booking-form > #booking-submit-button { max-width: none; margin-top: 14px !important; }
    body.pis-cp #booking-section[data-cp-step="3"] .pis-cp-stepnav { margin-top: 10px; }
}
/* =====================================================================
   PART 5: PETS
   ===================================================================== */
/* The heading row gives way (the header says Your Pets; Add Pet is in the row of faces) and the section is no longer a box. */
body.pis-cp-pets #pets-section { margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; overflow: visible !important; }
body.pis-cp-pets #pets-section::before, body.pis-cp-pets #pets-section::after { display: none !important; }
body.pis-cp-pets #pets-section > .pets-section-header { display: none !important; }
body.pis-cp-pets #pet-info { display: block !important; margin: 0 !important; padding: 0 !important; }
/* one pet at a time: the face that is chosen. (A card the app has just drawn again stays in the page until it is redrawn a moment
   later, so the page never goes short and loses its place.) */
body.pis-cp-pets #pet-info[data-cp-pet] > .pet-profile-card[data-cp="1"]:not(.is-cp-on) { display: none !important; }
body.pis-cp-pets #pet-info > .pet-profile-card[data-cp="1"] { display: block; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; overflow: visible !important; }
body.pis-cp-pets #pet-info > .pet-profile-card[data-cp="1"]::before, body.pis-cp-pets #pet-info > .pet-profile-card[data-cp="1"]::after { display: none !important; }
/* the card's own pieces stay in the page (their buttons still do the work) but the new page is what shows */
body.pis-cp-pets #pet-info > .pet-profile-card[data-cp="1"] > :not(.pis-cp-petpage) { display: none !important; }

/* ----- the row of faces ----- */
.pis-cp-petpick { gap: 16px; margin: 0 0 14px; padding: 5px 4px 2px; }
.pis-cp-petpick[hidden] { display: none !important; }
.pis-cp-petpick .pis-cp-pet { min-width: 76px !important; color: var(--cp-soft) !important; font-size: 13.500px !important; }
.pis-cp-petpick .pis-cp-face { width: 72px; height: 72px; box-shadow: 0 0 0 2px #D5DFE9, 0 4px 10px rgba(20,48,79,.1); }
.pis-cp-petpick .pis-cp-pet.is-on { color: var(--cp-navy) !important; }
.pis-cp-petpick .pis-cp-pet.is-on .pis-cp-face { box-shadow: 0 0 0 3px var(--cp-tang), 0 6px 14px rgba(244,123,32,.3); }
.pis-cp-petpick .pis-cp-pet-add .pis-cp-face { box-shadow: none; }
.pis-cp-petpick .pis-cp-pet.is-bday::after { left: calc(50% + 15px); top: 49px; }

/* ----- the page for one pet ----- */
.pis-cp-petpage { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; color: var(--cp-navy); font-family: var(--cp-text); text-align: left; }
.pis-cp-petside { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; min-width: 0; }
.pis-cp-cover, .pis-cp-petstats, .pis-cp-petrows { box-sizing: border-box; min-width: 0; margin: 0; border: 1px solid var(--cp-line); border-radius: 20px; background: #fff; box-shadow: 0 5px 14px rgba(20,48,79,.06); overflow: hidden; }
.pis-cp-cover, .pis-cp-petrows { padding: 0; }
.pis-cp-petpage h2, .pis-cp-petpage h3 { margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; text-transform: none !important; letter-spacing: .1px !important; }
.pis-cp-petpage h2::before, .pis-cp-petpage h2::after, .pis-cp-petpage h3::before, .pis-cp-petpage h3::after { display: none !important; }

/* cover: the photo, the name on it, Edit */
.pis-cp-coverphoto { position: relative; aspect-ratio: 100 / 76; background: #E4EBF2; overflow: hidden; }
.pis-cp-coverphoto img { position: absolute; inset: 0; display: block; width: 100% !important; height: 100% !important; max-width: none !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; object-fit: cover; object-position: 50% 32%; }
.pis-cp-coverphoto::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 46%; background: linear-gradient(to top, rgba(10,24,38,.66), rgba(10,24,38,0)); pointer-events: none; }
.pis-cp-coverphoto h2 { position: absolute; left: 20px; right: 20px; bottom: 15px; z-index: 1; color: #fff !important; font: 600 38px/1.05 var(--cp-display) !important; text-shadow: 0 2px 8px rgba(0,0,0,.35); white-space: nowrap; overflow: hidden; }
body.pis-cp #pet-info .pis-cp-edit { position: absolute; top: 14px; right: 14px; z-index: 1; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 7px !important; width: auto !important; min-width: 0 !important; height: 44px !important; min-height: 44px !important; margin: 0 !important; padding: 0 16px 0 13px !important;
    border: 0 !important; border-radius: 14px !important; background: rgba(255,255,255,.95) !important; box-shadow: 0 4px 12px rgba(10,24,38,.2) !important; color: var(--cp-navy) !important; font: 600 16px/1 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; }
body.pis-cp #pet-info .pis-cp-edit.is-soft { position: static; flex: none; background: #EEF3F8 !important; box-shadow: none !important; }
/* no photo yet */
.pis-cp-coverempty { position: relative; display: grid; justify-items: center; gap: 12px; padding: 34px 18px 30px; background: linear-gradient(180deg, #FFF3E0 0%, #FFE8CF 100%); overflow: hidden; }
.pis-cp-coverempty::before, .pis-cp-coverempty::after { content: ""; position: absolute; width: 190px; height: 190px; opacity: .5; pointer-events: none;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FBD3A6'%3E%3Cellipse cx='6.200' cy='10.600' rx='1.900' ry='2.500' transform='rotate(-18 6.200 10.600)'/%3E%3Cellipse cx='10' cy='6.600' rx='1.900' ry='2.600' transform='rotate(-6 10 6.600)'/%3E%3Cellipse cx='14.400' cy='6.600' rx='1.900' ry='2.600' transform='rotate(6 14.400 6.600)'/%3E%3Cellipse cx='18' cy='10.600' rx='1.900' ry='2.500' transform='rotate(18 18 10.600)'/%3E%3Cpath d='M12.100 11.300c2.600 0 5 2.700 5 5 0 1.900-1.500 2.700-3 2.700-.800 0-1.300-.300-2-.300s-1.200.300-2 .300c-1.500 0-3-.800-3-2.700 0-2.300 2.400-5 5-5z'/%3E%3C/svg%3E") center / contain no-repeat; }
.pis-cp-coverempty::before { left: -58px; top: -64px; transform: rotate(-24deg); }
.pis-cp-coverempty::after { right: -46px; bottom: -70px; transform: rotate(18deg); }
.pis-cp-camtile { position: relative; z-index: 1; display: grid; place-items: center; width: 58px; height: 58px; border-radius: 18px; background: #fff; color: var(--cp-tang); box-shadow: 0 6px 14px rgba(180,83,15,.14); }
.pis-cp-coverempty strong { position: relative; z-index: 1; max-width: 100%; color: var(--cp-navy); font: 600 21px/1.2 var(--cp-display); letter-spacing: .1px; text-align: center; white-space: nowrap; overflow: hidden; }
body.pis-cp #pet-info .pis-cp-addphoto { position: relative; z-index: 1; display: inline-flex !important; align-items: center !important; justify-content: center !important; width: auto !important; min-width: 0 !important; height: 46px !important; min-height: 46px !important; margin: 0 !important; padding: 0 22px !important; border: 0 !important; border-radius: 14px !important;
    background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; color: #fff !important; font: 600 16.500px/1 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
.pis-cp-namerow { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 16px 0 18px; }
.pis-cp-namerow h2 { flex: 1 1 auto; min-width: 0; color: var(--cp-navy) !important; font: 600 32px/1.1 var(--cp-display) !important; white-space: nowrap; overflow: hidden; }
/* the facts: each on its own line */
.pis-cp-facts { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px 16px; padding: 16px 18px 2px; }
.pis-cp-fact { min-width: 0; }
.pis-cp-fact.is-wide { grid-column: 1 / -1; }
.pis-cp-fact span { display: block; color: var(--cp-soft); font: 600 13px/1.2 var(--cp-text); }
.pis-cp-fact b { display: block; margin-top: 2px; color: var(--cp-navy); font: 700 17px/1.25 var(--cp-text); white-space: nowrap; overflow: hidden; }
.pis-cp-fact b.is-none, .pis-cp-bdayband b.is-none { color: #7A8DA3; font-weight: 600; }
.pis-cp-fact.is-wrap b { white-space: normal; }
/* birthday */
.pis-cp-bdayband { display: flex; align-items: center; gap: 12px; margin: 14px; padding: 10px 14px 10px 11px; border-radius: 16px; background: var(--cp-cream); }
.pis-cp-bdayband > i { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 13px; background: #fff; font-size: 24px; font-style: normal; line-height: 1; }
.pis-cp-bdayband > div { min-width: 0; }
.pis-cp-bdayband > div:first-of-type { flex: 1 1 auto; }
.pis-cp-bdayband span { display: block; color: #8A4B0B; font: 700 13px/1.2 var(--cp-text); white-space: nowrap; }
.pis-cp-bdayband b { display: block; margin-top: 1px; color: var(--cp-navy); font: 600 18px/1.2 var(--cp-display); letter-spacing: .1px; white-space: nowrap; }
.pis-cp-away { flex: none; text-align: right; }
.pis-cp-away b { margin: 0; color: #E8590C; font-size: 27px; line-height: 1; font-variant-numeric: tabular-nums; }
.pis-cp-away span { margin-top: 3px; font-size: 12.500px; }
.pis-cp-away.is-today b { font-size: 21px; }
body.pis-cp #pet-info .pis-cp-bdayadd { flex: none; display: inline-flex !important; align-items: center !important; width: auto !important; min-width: 0 !important; height: 40px !important; min-height: 40px !important; margin: 0 !important; padding: 0 15px !important; border: 0 !important; border-radius: 12px !important; background: #fff !important; box-shadow: none !important;
    color: #B4530F !important; font: 600 15px/1 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; cursor: pointer; }

/* ----- walks (or visits) with us ----- */
.pis-cp-petstats { padding: 16px 8px 12px; }
.pis-cp-statshead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding: 0 10px 12px; }
.pis-cp-statshead h3 { flex: 1 1 auto; min-width: 0; color: var(--cp-navy) !important; font: 600 19px/1.2 var(--cp-display) !important; white-space: nowrap; overflow: hidden; }
.pis-cp-statshead span { flex: none; color: var(--cp-soft); font: 600 13.500px/1.2 var(--cp-text); white-space: nowrap; }
.pis-cp-petstats .pis-cp-tiles b { color: var(--cp-navy); }
.pis-cp-records { margin: 12px 8px 0; border: 1px solid var(--cp-line); border-radius: 14px; overflow: hidden; }
.pis-cp-records > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 46px; padding: 8px 14px; }
.pis-cp-records > div + div { border-top: 1px solid var(--cp-line); }
.pis-cp-records span { color: var(--cp-soft); font: 600 14.500px/1.3 var(--cp-text); white-space: nowrap; }
.pis-cp-records b { color: var(--cp-navy); font: 700 15.500px/1.25 var(--cp-text); text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.pis-cp-records b small { display: block; margin-top: 1px; color: var(--cp-soft); font: 600 13px/1.2 var(--cp-text); }

/* ----- Photos, Feeding Notes, Care Notes ----- */
body.pis-cp #pet-info .pis-cp-prow { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 14px !important; width: 100% !important; max-width: none !important; height: auto !important; min-height: 68px !important; margin: 0 !important; padding: 12px 12px 12px 16px !important;
    border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 500 15px/1.3 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; text-align: left !important; white-space: normal !important; cursor: pointer; -webkit-tap-highlight-color: transparent; }
body.pis-cp #pet-info .pis-cp-prow + .pis-cp-prow { border-top: 1px solid var(--cp-line) !important; }
body.pis-cp #pet-info .pis-cp-prow:active { background: #F6F9FC !important; }
.pis-cp-prow > i { flex: none; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: var(--cp-cream); color: var(--cp-tang); font-style: normal; }
.pis-cp-prow > i.is-feed { background: #E6F1FB; color: var(--cp-blue); }
.pis-cp-prow > i.is-care { background: #E7F6EE; color: var(--cp-grass); }
.pis-cp-rowtext { flex: 1 1 auto; min-width: 0; display: block; }
.pis-cp-rowtext b { display: block; color: var(--cp-navy); font: 600 17px/1.2 var(--cp-display); letter-spacing: .1px; }
.pis-cp-rowtext small { display: block; margin-top: 2px; color: var(--cp-soft); font: 600 14px/1.4 var(--cp-text); white-space: pre-line; overflow-wrap: anywhere; }
.pis-cp-rowtext small.is-none { color: #7A8DA3; }
.pis-cp-thumbs { flex: none; display: flex; align-items: center; padding-left: 8px; }
.pis-cp-thumbs img { display: block; width: 36px !important; height: 36px !important; max-width: none !important; margin: 0 0 0 -8px !important; border: 2px solid #fff !important; border-radius: 10px !important; object-fit: cover; background: #E4EBF2; }
.pis-cp-prow > svg { flex: none; color: #9AAABB; }

/* ----- no pets yet ----- */
body.pis-cp-pets #pet-info .no-pets-state { display: grid !important; justify-items: center !important; gap: 8px !important; margin: 0 !important; padding: 30px 20px 26px !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; background: #fff !important; box-shadow: 0 5px 14px rgba(20,48,79,.06) !important; text-align: center !important; }
body.pis-cp-pets #pet-info .no-pets-state .no-pets-avatar { display: none !important; }
body.pis-cp-pets #pet-info .no-pets-state::before { content: ""; display: block; width: 58px; height: 58px; border-radius: 18px; background: var(--cp-cream) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F47B20'%3E%3Cellipse cx='6.200' cy='10.600' rx='1.900' ry='2.500' transform='rotate(-18 6.200 10.600)'/%3E%3Cellipse cx='10' cy='6.600' rx='1.900' ry='2.600' transform='rotate(-6 10 6.600)'/%3E%3Cellipse cx='14.400' cy='6.600' rx='1.900' ry='2.600' transform='rotate(6 14.400 6.600)'/%3E%3Cellipse cx='18' cy='10.600' rx='1.900' ry='2.500' transform='rotate(18 18 10.600)'/%3E%3Cpath d='M12.100 11.300c2.600 0 5 2.700 5 5 0 1.900-1.500 2.700-3 2.700-.800 0-1.300-.300-2-.300s-1.200.300-2 .300c-1.500 0-3-.800-3-2.700 0-2.300 2.400-5 5-5z'/%3E%3C/svg%3E") center / 30px no-repeat; }
body.pis-cp-pets #pet-info .no-pets-state strong { color: var(--cp-navy) !important; font: 600 21px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp-pets #pet-info .no-pets-state p { max-width: 300px; margin: 0 !important; color: var(--cp-soft) !important; font: 500 14.500px/1.45 var(--cp-text) !important; }

/* ----- the pet form as a sheet (phones) or a pop-up (computers): Edit, Add, Feeding Notes, Care Notes ----- */
.pis-cp-shade { position: fixed; inset: 0; z-index: 5000; background: rgba(13,30,48,.48); touch-action: none; -webkit-tap-highlight-color: transparent; }
.pis-cp-shade[hidden] { display: none !important; }
@media (max-width: 1023px) { body.pis-cp-sheet-open { overflow: hidden !important; } }
/* put in place (still closed) just before the app opens it */
body.pis-cp #pet-form-panel[data-cp-ready] { position: fixed !important; left: 0 !important; right: 0 !important; bottom: 0 !important; top: auto !important; margin: 0 !important; }
@keyframes pis-cp-sheet-up { from { transform: translateY(26px); opacity: .4; } to { transform: none; opacity: 1; } }
body.pis-cp #pet-form-panel[data-cp-sheet] { position: fixed !important; left: 0 !important; right: 0 !important; top: auto !important; bottom: var(--cp-kb, 0px) !important; z-index: 5001 !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; width: auto !important; max-width: none !important;
    max-height: calc(100vh - 34px - env(safe-area-inset-top, 0px)); max-height: calc(100dvh - 34px - env(safe-area-inset-top, 0px) - var(--cp-kb, 0px)); margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 26px 26px 0 0 !important; background: #fff !important; box-shadow: 0 -10px 30px rgba(13,30,48,.24) !important;
    color: var(--cp-navy); font-family: var(--cp-text); overflow: hidden !important; animation: pis-cp-sheet-up .22s ease-out; }
body.pis-cp #pet-form-panel[data-cp-sheet]::before { content: "" !important; display: block !important; position: absolute; top: 8px; left: 50%; width: 40px; height: 5px; margin-left: -20px; border-radius: 3px; background: #D5DFE9; }
body.pis-cp #pet-form-panel[data-cp-sheet]::after { display: none !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-header { flex: none; display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 12px !important; margin: 0 !important; padding: 24px 16px 8px !important; border: 0 !important; background: none !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form-title { position: absolute !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip-path: inset(50%) !important; white-space: nowrap !important; }
.pis-cp-sheettitle { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 12px; }
.pis-cp-sheettitle > i { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 14px; background: var(--cp-cream); color: var(--cp-tang); font-style: normal; }
.pis-cp-sheettitle > i.is-feed { background: #E6F1FB; color: var(--cp-blue); }
.pis-cp-sheettitle > i.is-care { background: #E7F6EE; color: var(--cp-grass); }
.pis-cp-sheettitle > div { min-width: 0; }
.pis-cp-sheettitle strong { display: block; color: var(--cp-navy); font: 600 24px/1.15 var(--cp-display); letter-spacing: .1px; white-space: nowrap; overflow: hidden; }
.pis-cp-sheettitle span { display: block; margin-top: 1px; color: var(--cp-soft); font: 600 15px/1.25 var(--cp-text); white-space: nowrap; overflow: hidden; }
.pis-cp-sheettitle span:empty { display: none; }
body.pis-cp #pet-form-panel[data-cp-sheet] #close-pet-form-button { flex: none !important; position: static !important; display: grid !important; place-items: center !important; width: 44px !important; min-width: 44px !important; height: 44px !important; min-height: 44px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 14px !important; background: #EEF3F8 !important; box-shadow: none !important; color: var(--cp-navy) !important; font-size: 0 !important; line-height: 0 !important; cursor: pointer; }
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form { flex: 1 1 auto; min-height: 0; display: flex !important; flex-direction: column !important; gap: 0 !important; margin: 0 !important; padding: 6px 16px 0 !important; border: 0 !important; background: none !important; box-shadow: none !important; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form > * { flex: none; }
/* what each sheet shows */
body.pis-cp #pet-form-panel[data-cp-sheet="feeding"] #pet-form > :is(.pet-photo-editor, .pet-form-grid, [data-cp-part="care"], [data-cp-part="photo"]),
body.pis-cp #pet-form-panel[data-cp-sheet="care"] #pet-form > :is(.pet-photo-editor, .pet-form-grid, [data-cp-part="feeding"], [data-cp-part="photo"]),
body.pis-cp #pet-form-panel:is([data-cp-sheet="edit"], [data-cp-sheet="add"]) #pet-form > [data-cp-part],
body.pis-cp #pet-form-panel:is([data-cp-sheet="feeding"], [data-cp-sheet="care"], [data-cp-sheet="add"]) #remove-pet-button { display: none !important; }
/* the photo */
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-photo-editor { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 14px !important; margin: 4px 0 6px !important; padding: 0 !important; border: 0 !important; background: none !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-photo-preview { flex: none; display: block !important; box-sizing: border-box !important; width: 76px !important; height: 76px !important; margin: 0 !important; border: 3px solid #fff !important; border-radius: 50% !important; box-shadow: 0 0 0 3px #F8B84A !important; object-fit: cover !important; background: var(--cp-cream) !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-photo-controls { flex: 1 1 auto; min-width: 0; display: block !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-photo-upload-button { display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; max-width: 240px; height: 46px !important; min-height: 46px !important; margin: 0 !important; padding: 0 16px !important; border: 1.500px solid #F6C89A !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important;
    color: #C2500B !important; font: 600 16px/1 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-photo-help { margin: 6px 2px 0 !important; color: var(--cp-soft) !important; font: 500 14px/1.3 var(--cp-text) !important; text-align: left !important; }
/* the boxes */
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-grid { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; gap: 0 12px !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-grid > .pet-form-field:nth-child(1), body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-grid > .pet-form-field:nth-child(2) { grid-column: 1 / -1; }
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-field { min-width: 0; display: block !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-field > label { display: block !important; margin: 12px 2px 6px !important; padding: 0 !important; color: var(--cp-soft) !important; font: 700 14px/1.25 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] :is(input[type="text"], input[type="date"], select, textarea) { display: block !important; box-sizing: border-box !important; width: 100% !important; max-width: none !important; min-width: 0 !important; height: 52px !important; min-height: 52px !important; margin: 0 !important; padding: 0 14px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background-color: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 17px/1.3 var(--cp-text) !important; letter-spacing: 0 !important; -webkit-appearance: none; appearance: none; }
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form textarea { height: auto !important; min-height: 104px !important; padding: 12px 14px !important; line-height: 1.45 !important; resize: none; }
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form > [data-cp-part] > label { white-space: nowrap; overflow: hidden; }
body.pis-cp #pet-form-panel[data-cp-sheet] select { padding-right: 38px !important;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2351677F' stroke-width='2.400' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important; background-repeat: no-repeat !important; background-position: right 12px center !important; background-size: 18px !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] :is(input, select, textarea)::placeholder { color: #9AAABB !important; font-weight: 500 !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] :is(input[type="text"], input[type="date"], select, textarea):focus { outline: none !important; border-color: var(--cp-tang) !important; box-shadow: 0 0 0 4px rgba(244,123,32,.16) !important; }
/* Remove Pet: a row */
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-actions { display: contents !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] #remove-pet-button { order: 4; display: grid; grid-template-columns: 40px minmax(0, 1fr); align-items: center !important; column-gap: 12px; row-gap: 1px; box-sizing: border-box !important; width: 100% !important; max-width: none !important; height: auto !important; min-height: 64px !important; margin: 16px 0 0 !important; padding: 10px 14px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 16px !important; background: #fff !important; box-shadow: none !important; color: #C0392B !important; font: 600 17px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; text-align: left !important; cursor: pointer; }
body.pis-cp #pet-form-panel[data-cp-sheet] #remove-pet-button::before { content: ""; grid-row: 1 / span 2; width: 40px; height: 40px; border-radius: 13px;
    background: #FDECEA url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C0392B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 7.500h14M9.500 7.500V5.300h5v2.200M7 7.500l.800 11a1.500 1.500 0 0 0 1.500 1.400h5.400a1.500 1.500 0 0 0 1.500-1.400l.800-11M10.300 11v5.500M13.700 11v5.500'/%3E%3C/svg%3E") center / 22px no-repeat; }
body.pis-cp #pet-form-panel[data-cp-sheet] #remove-pet-button::after { display: none !important; }
.pis-cp-removesub { grid-column: 2; display: block; min-width: 0; overflow: hidden; color: var(--cp-soft); font: 600 14px/1.3 var(--cp-text); letter-spacing: 0; white-space: nowrap; }
.pis-cp-removesub:empty { display: none; }
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form-message { order: 5; margin: 12px 2px 0 !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form-message:empty { display: none !important; }
/* Cancel and Save stay at the bottom of the sheet */
body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-actions-right { order: 6; position: sticky; bottom: 0; z-index: 2; box-sizing: border-box !important; align-self: stretch !important; width: auto !important; max-width: none !important; display: grid !important; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr) !important; gap: 10px !important; margin: 16px -16px 0 !important; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; background: #fff !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] :is(#cancel-pet-button, #save-pet-button) { display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; max-width: none !important; height: 52px !important; min-height: 52px !important; margin: 0 !important; padding: 0 12px !important; border-radius: 15px !important;
    font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
body.pis-cp #pet-form-panel[data-cp-sheet] #cancel-pet-button { border: 1.500px solid var(--cp-line) !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] #save-pet-button { border: 0 !important; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; color: #fff !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] #save-pet-button:disabled { opacity: .6 !important; box-shadow: none !important; }
@media (prefers-reduced-motion: reduce) { body.pis-cp #pet-form-panel[data-cp-sheet] { animation: none; } }

@media (min-width: 1024px) {
    .pis-cp-petpick { gap: 20px; margin-bottom: 20px; }
    .pis-cp-petpick .pis-cp-face { width: 76px; height: 76px; }
    .pis-cp-petpick .pis-cp-pet { font-size: 14.500px !important; }
    .pis-cp-petpick .pis-cp-pet.is-bday::after { top: 52px; }
    .pis-cp-petpage { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; align-items: start; }
    .pis-cp-petpage.is-solo { grid-template-columns: minmax(0, 620px); }
    .pis-cp-petside { gap: 22px; }
    .pis-cp-coverphoto h2 { left: 24px; right: 24px; bottom: 18px; font-size: 44px !important; }
    .pis-cp-facts { padding: 18px 22px 2px; }
    .pis-cp-bdayband { margin: 16px 18px 18px; }
    .pis-cp-petstats { padding: 20px 12px 16px; }
    .pis-cp-statshead { padding: 0 12px 14px; }
    .pis-cp-statshead h3 { font-size: 21px !important; }
    .pis-cp-petstats .pis-cp-tiles i { width: 40px; height: 40px; } .pis-cp-petstats .pis-cp-tiles b { font-size: 30px; } .pis-cp-petstats .pis-cp-tiles span { font-size: 14px; }
    .pis-cp-petstats .pis-cp-fun { margin: 14px 10px 0; padding: 11px 14px; font-size: 14.500px; }
    .pis-cp-records { margin: 14px 10px 0; }
    body.pis-cp #pet-info .pis-cp-prow { min-height: 74px !important; padding: 14px 16px 14px 18px !important; }
    body.pis-cp #pet-info .pis-cp-prow:hover { background: #F8FAFC !important; }
    body.pis-cp-pets #pet-info .no-pets-state { max-width: 560px; }
    /* a pop-up in the middle of the screen */
    body.pis-cp #pet-form-panel[data-cp-sheet] { left: 50% !important; right: auto !important; top: 50% !important; bottom: auto !important; width: min(520px, calc(100vw - 48px)) !important; max-height: calc(100vh - 80px); border-radius: 24px !important; transform: translate(-50%, -50%); box-shadow: 0 24px 60px rgba(13,30,48,.32) !important; animation: none; }
    body.pis-cp #pet-form-panel[data-cp-sheet]::before { display: none !important; }
    body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-header { padding: 20px 20px 8px !important; }
    body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form { padding: 6px 20px 0 !important; }
    body.pis-cp #pet-form-panel[data-cp-sheet] .pet-form-actions-right { margin: 18px -20px 0 !important; padding: 14px 20px !important; }
}
/* ----- the two things that open from this page: the photo gallery and the Remove Pet confirmation (same parts, the new look) ----- */
body.pis-cp-pets .pet-gallery-dialog, body.pis-cp-pets .remove-pet-dialog { color: var(--cp-navy) !important; font-family: var(--cp-text) !important; }
body.pis-cp-pets .pet-gallery-dialog { background: #EEF4F9 !important; }
body.pis-cp-pets .pet-gallery-header { align-items: center !important; padding: calc(14px + env(safe-area-inset-top, 0px)) 14px 12px 18px !important; border: 0 !important; border-bottom: 1px solid var(--cp-band-line) !important; background: var(--cp-cream) !important; }
body.pis-cp-pets .pet-gallery-eyebrow, body.pis-cp-pets .remove-pet-eyebrow { display: block !important; margin: 0 !important; font: 700 13px/1.2 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; }
body.pis-cp-pets .pet-gallery-eyebrow { color: #8A4B0B !important; }
body.pis-cp-pets .pet-gallery-header h3, body.pis-cp-pets #remove-pet-title { margin: 1px 0 0 !important; color: var(--cp-navy) !important; font: 600 24px/1.15 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp-pets .pet-gallery-header p { margin: 1px 0 0 !important; color: var(--cp-soft) !important; font: 600 14.500px/1.3 var(--cp-text) !important; text-transform: capitalize; }
body.pis-cp-pets .pet-gallery-close, body.pis-cp-pets .remove-pet-close { flex: none !important; display: block !important; width: 44px !important; min-width: 44px !important; height: 44px !important; min-height: 44px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 14px !important;
    background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314304F' stroke-width='2.400' stroke-linecap='round'%3E%3Cpath d='M6.500 6.500l11 11M17.500 6.500l-11 11'/%3E%3C/svg%3E") center / 20px no-repeat !important; box-shadow: none !important; font-size: 0 !important; line-height: 0 !important; color: transparent !important; cursor: pointer; }
body.pis-cp-pets .remove-pet-close { background-color: #EEF3F8 !important; }
body.pis-cp-pets .pet-gallery-body { padding: 14px !important; background: none !important; }
body.pis-cp-pets .pet-gallery-group { margin: 0 0 12px !important; padding: 14px !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; background: #fff !important; box-shadow: 0 5px 14px rgba(20,48,79,.06) !important; }
body.pis-cp-pets .pet-gallery-group-date { margin: 0 2px 10px !important; padding: 0 !important; border: 0 !important; color: var(--cp-navy) !important; font: 600 17px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; }
body.pis-cp-pets .pet-gallery-photo { padding: 0 !important; border: 0 !important; border-radius: 14px !important; background: #E4EBF2 !important; box-shadow: none !important; overflow: hidden !important; }
body.pis-cp-pets .pet-gallery-photo img { border-radius: 0 !important; }
body.pis-cp-pets .pet-gallery-footer { gap: 14px !important; padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px)) !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; background: #fff !important; }
body.pis-cp-pets .pet-gallery-page-button { width: 46px !important; min-width: 46px !important; height: 46px !important; min-height: 46px !important; margin: 0 !important; padding: 0 !important; border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314304F' stroke-width='2.400' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m9.500 6 6 6-6 6'/%3E%3C/svg%3E") center / 20px no-repeat !important; box-shadow: none !important; font-size: 0 !important; color: transparent !important; cursor: pointer; }
body.pis-cp-pets .pet-gallery-page-button:first-child { transform: scaleX(-1); }
body.pis-cp-pets .pet-gallery-page-button:disabled { opacity: .4 !important; }
body.pis-cp-pets .pet-gallery-page-status { color: var(--cp-soft) !important; font: 700 14.500px/1.2 var(--cp-text) !important; }
body.pis-cp-pets .remove-pet-dialog { padding: 20px 16px 16px !important; border: 0 !important; border-radius: 24px !important; background: #fff !important; box-shadow: 0 24px 60px rgba(13,30,48,.32) !important; }
body.pis-cp-pets .remove-pet-header { align-items: center !important; margin: 0 0 14px !important; padding: 0 !important; border: 0 !important; }
body.pis-cp-pets .remove-pet-eyebrow { color: #C0392B !important; }
body.pis-cp-pets .remove-pet-summary { margin: 0 0 10px !important; padding: 13px 14px !important; border: 1px solid var(--cp-line) !important; border-radius: 16px !important; background: #F6F9FC !important; }
body.pis-cp-pets .remove-pet-summary strong { display: block !important; color: var(--cp-navy) !important; font: 600 18px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp-pets .remove-pet-summary span { display: block !important; margin-top: 3px !important; color: var(--cp-soft) !important; font: 500 14.500px/1.45 var(--cp-text) !important; }
body.pis-cp-pets .remove-pet-warning { margin: 0 0 10px !important; padding: 13px 14px !important; border: 1px solid #F3C9C4 !important; border-radius: 16px !important; background: #FFF5F3 !important; }
body.pis-cp-pets .remove-pet-warning strong { display: block !important; margin: 0 0 6px !important; color: #9A2A1F !important; font: 600 17px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: capitalize; }
body.pis-cp-pets .remove-pet-warning p { margin: 0 0 6px !important; color: #6E3A33 !important; font: 500 14.500px/1.45 var(--cp-text) !important; }
body.pis-cp-pets .remove-pet-warning p:last-child { margin-bottom: 0 !important; }
body.pis-cp-pets .remove-pet-note { margin: 0 2px 14px !important; color: var(--cp-soft) !important; font: 500 14px/1.4 var(--cp-text) !important; }
body.pis-cp-pets .remove-pet-actions { display: grid !important; grid-template-columns: minmax(0, 1fr) !important; gap: 10px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; }
body.pis-cp-pets .remove-pet-actions > button { order: 2; display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; max-width: none !important; height: 48px !important; min-height: 48px !important; margin: 0 !important; padding: 0 14px !important; border: 1.500px solid var(--cp-line) !important; border-radius: 15px !important;
    background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 16.500px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
body.pis-cp-pets .remove-pet-actions > .remove-pet-confirm { order: 1; height: 52px !important; min-height: 52px !important; border: 0 !important; background: #D93025 !important; box-shadow: 0 6px 14px rgba(217,48,37,.26) !important; color: #fff !important; font-size: 17px !important; }
body.pis-cp-pets .remove-pet-actions > .remove-pet-confirm:disabled { opacity: .6 !important; box-shadow: none !important; }
@media (min-width: 1024px) {
    body.pis-cp-pets .pet-gallery-dialog { border-radius: 24px !important; overflow: hidden !important; }
    body.pis-cp-pets .pet-gallery-header { padding: 16px 16px 14px 22px !important; }
    body.pis-cp-pets .pet-gallery-body { padding: 18px !important; }
    body.pis-cp-pets .remove-pet-dialog { padding: 24px 22px 20px !important; }
}
/* ----- a box the app marks as needing attention keeps its red line and glow in the restyled forms (form-errors.js) ----- */
body.pis-cp #booking-section #booking-form :is(input, select, textarea).pis-field-invalid,
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form :is(input, select, textarea).pis-field-invalid { border-color: #d94f4f !important; background-color: #fffafa !important; box-shadow: 0 0 0 3px rgba(217, 79, 79, .14) !important; }
body.pis-cp #booking-section #booking-form :is(input, select, textarea).pis-field-invalid:focus,
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form :is(input, select, textarea).pis-field-invalid:focus { border-color: #d94f4f !important; box-shadow: 0 0 0 3px rgba(217, 79, 79, .22) !important; }
body.pis-cp #pet-form-panel[data-cp-sheet] #pet-form .pet-photo-controls.pis-field-invalid .pet-photo-upload-button { border-color: #d94f4f !important; box-shadow: 0 0 0 1.500px #d94f4f, 0 0 0 5px rgba(217, 79, 79, .16) !important; }
/* ----- the pet photo picker: one from the visits, the camera, or the library (a fifth part of the same sheet) ----- */
body.pis-cp #pet-form-panel:not([data-cp-sheet="photo"]) :is(.pis-cp-picker, .pis-cp-pickacts) { display: none !important; }
body.pis-cp #pet-form-panel[data-cp-sheet="photo"] #pet-form > :is(.pet-photo-editor, .pet-form-grid, [data-cp-part="feeding"], [data-cp-part="care"]),
body.pis-cp #pet-form-panel[data-cp-sheet="photo"] :is(#remove-pet-button, #save-pet-button, #pet-form-message) { display: none !important; }
.pis-cp-picker[hidden], body.pis-cp #pet-form-panel .pis-cp-seeall[hidden], body.pis-cp #pet-form-panel .pis-cp-usephoto[hidden] { display: none !important; }
.pis-cp-pickhead { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 34px; margin: 2px 2px 8px; }
.pis-cp-pickhead strong { min-width: 0; color: var(--cp-navy); font: 600 18px/1.2 var(--cp-display); letter-spacing: .1px; white-space: nowrap; }
body.pis-cp #pet-form-panel .pis-cp-seeall { flex: none; display: inline-flex !important; align-items: center !important; width: auto !important; min-width: 0 !important; height: 34px !important; min-height: 34px !important; margin: 0 !important; padding: 0 2px !important; border: 0 !important; border-radius: 8px !important; background: none !important; box-shadow: none !important;
    color: var(--cp-blue) !important; font: 700 15px/1 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
.pis-cp-pickgrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 3px; }
body.pis-cp #pet-form-panel .pis-cp-picktile { position: relative; display: block !important; aspect-ratio: 1 / 1; width: auto !important; min-width: 0 !important; height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 14px !important; background: #E4EBF2 !important; box-shadow: none !important; overflow: hidden; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pis-cp-picktile img { position: absolute; inset: 0; display: block; width: 100% !important; height: 100% !important; max-width: none !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; object-fit: cover; }
.pis-cp-picktile img:not([src]) { visibility: hidden; }
body.pis-cp #pet-form-panel .pis-cp-picktile.is-on { outline: 3px solid var(--cp-tang) !important; outline-offset: 2px; }
.pis-cp-pickcheck { position: absolute; top: 7px; right: 7px; display: none; place-items: center; width: 26px; height: 26px; border: 2px solid #fff; border-radius: 50%; background: var(--cp-tang); color: #fff; box-shadow: 0 2px 6px rgba(10,24,38,.25); }
.pis-cp-picktile.is-on .pis-cp-pickcheck { display: grid; }
.pis-cp-picktile.is-more::after { content: attr(data-cp-more); position: absolute; inset: 0; display: grid; place-items: center; background: rgba(13,30,48,.56); color: #fff; font: 600 23px/1 var(--cp-display); letter-spacing: .2px; }
.pis-cp-pickacts { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; min-width: 0; }
.pis-cp-pickown { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
.pis-cp-pickown.is-one { grid-template-columns: minmax(0, 1fr); }
body.pis-cp #pet-form-panel .pis-cp-pickown button { display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; height: 50px !important; min-height: 50px !important; margin: 0 !important; padding: 0 8px !important; border: 1.500px solid var(--cp-line) !important; border-radius: 15px !important;
    background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 16px/1 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
body.pis-cp #pet-form-panel .pis-cp-pickown button svg { flex: none; }
body.pis-cp #pet-form-panel .pis-cp-usephoto { display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; height: 52px !important; min-height: 52px !important; margin: 0 !important; padding: 0 12px !important; border: 0 !important; border-radius: 15px !important;
    background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; color: #fff !important; font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
body.pis-cp #pet-form-panel :is(.pis-cp-usephoto, .pis-cp-pickown button):disabled { opacity: .5 !important; box-shadow: none !important; cursor: default; }
.pis-cp-pickmsg { margin: 0; padding: 9px 12px; border-radius: 12px; background: #FDECEA; color: #B03024; font: 700 14px/1.35 var(--cp-text); text-align: center; }
.pis-cp-pickmsg:empty { display: none; }
.pis-cp-picker.is-busy { pointer-events: none; opacity: .6; }
/* in the picker the bottom of the sheet is one column, and Cancel is a quiet button under the rest */
body.pis-cp #pet-form-panel[data-cp-sheet="photo"] .pet-form-actions-right { grid-template-columns: minmax(0, 1fr) !important; gap: 8px !important; }
body.pis-cp #pet-form-panel[data-cp-sheet="photo"] #cancel-pet-button { height: 42px !important; min-height: 42px !important; border: 0 !important; background: none !important; color: var(--cp-soft) !important; font-size: 16px !important; }
body.pis-cp #pet-form-panel[data-cp-sheet="photo"] #pet-form { padding-bottom: 2px !important; }
/* ----- the app's "drag and zoom" photo step (photo-cover.js): the same step, with the new fonts and button shape ----- */
body.pis-cp .pis-cover-dialog { font-family: var(--cp-text); }
body.pis-cp .pis-cover-head h2 { font: 600 23px/1.2 var(--cp-display); letter-spacing: .1px; }
body.pis-cp .pis-cover-head p, body.pis-cp .pis-cover-help { font-size: 14px; }
body.pis-cp .pis-cover-actions button { height: 52px; border-radius: 15px; font: 600 17px/1 var(--cp-display); letter-spacing: .2px; }
body.pis-cp .pis-cover-actions .pis-cover-reset { font: 700 15px/1 var(--cp-text); letter-spacing: 0; text-decoration: none; color: #cfdbe6; }
body.pis-cp .pis-cover-actions .pis-cover-save { background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%); }

/* =====================================================================
   PART 6: MESSAGES
   ===================================================================== */
/* ----- the conversation: the app's own rows, on every screen size ----- */
body.pis-cp-msgs .client-message-list { gap: 0 !important; padding: 4px 14px 16px !important; background: #EEF4F9 !important; scrollbar-width: thin; scrollbar-color: #C9D6E2 transparent; }
body.pis-cp-msgs .pis-cp-msgday { flex: none; align-self: center; margin: 16px 0 0; padding: 5px 13px; border-radius: 13px; background: #E0E9F1; color: var(--cp-soft); font: 700 13px/1.3 var(--cp-text); white-space: nowrap; }
body.pis-cp-msgs .client-message-row { position: relative; flex: none; margin: 14px 0 0 !important; }
body.pis-cp-msgs .client-message-row.is-client { max-width: 84% !important; }
/* "You" is still read out by a screen reader; the side and the color already say whose it is */
body.pis-cp-msgs .client-message-row.is-client .client-message-sender { position: absolute !important; width: 1px; height: 1px; margin: -1px !important; padding: 0 !important; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
body.pis-cp-msgs .client-message-bubble { font: 500 16.500px/1.42 var(--cp-text) !important; letter-spacing: 0 !important; }
body.pis-cp-msgs .client-message-row.is-client .client-message-bubble { padding: 11px 16px 12px !important; border: 0 !important; border-radius: 22px 22px 8px 22px !important; background: linear-gradient(135deg, #F68B1F 0%, #EE5A24 100%) !important; color: #fff !important;
    font-weight: 600 !important; box-shadow: 0 4px 10px rgba(238,90,36,.2); }
body.pis-cp-msgs .client-message-row.is-business { display: grid !important; grid-template-columns: 30px minmax(0, auto); grid-template-rows: auto auto auto; column-gap: 9px; justify-content: start; align-items: start !important; max-width: 90% !important; }
body.pis-cp-msgs .client-message-row.is-business::before { content: ""; grid-column: 1; grid-row: 2; align-self: end; width: 30px; height: 30px; border-radius: 9px; background: #F6912A url("${LOGO}") center / cover no-repeat; box-shadow: 0 2px 5px rgba(242,107,33,.28); }
body.pis-cp-msgs .client-message-row.is-business > * { grid-column: 2; justify-self: start; }
body.pis-cp-msgs .client-message-row.is-business .client-message-sender { grid-row: 1; margin: 0 0 5px !important; padding: 0 2px !important; color: var(--cp-soft) !important; font: 700 13px/1.3 var(--cp-text) !important; letter-spacing: 0 !important; overflow-wrap: anywhere; }
body.pis-cp-msgs .client-message-row.is-business.is-cp-next .client-message-sender { display: none !important; }
body.pis-cp-msgs .client-message-row.is-business .client-message-bubble { grid-row: 2; padding: 11px 16px 12px !important; border: 1.500px solid var(--cp-line) !important; border-radius: 20px !important; background: #fff !important; color: var(--cp-navy) !important; }
body.pis-cp-msgs .client-message-row.is-business .client-message-time { grid-row: 3; }
body.pis-cp-msgs .client-message-time { margin: 5px 0 0 !important; padding: 0 4px !important; color: var(--cp-soft) !important; font: 600 12px/1.3 var(--cp-text) !important; white-space: nowrap; }
body.pis-cp-msgs .client-message-loading { margin: auto !important; color: var(--cp-soft) !important; font: 600 14.500px/1.4 var(--cp-text) !important; }
body.pis-cp-msgs .client-message-empty { display: flex; flex-direction: column; align-items: center; max-width: 310px; margin: auto !important; padding: 20px 8px !important; color: var(--cp-soft) !important; font: 500 15px/1.5 var(--cp-text) !important; text-align: center; }
body.pis-cp-msgs .client-message-empty strong { margin: 13px 0 5px; color: var(--cp-navy); font: 600 21px/1.2 var(--cp-display); letter-spacing: .2px; }
.pis-cp-msgnone { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 20px; background: #FFE9CC; color: var(--cp-tang); font-style: normal; }

/* ----- writing a message: the box, Send, and what the app says if one did not go through (above the box) ----- */
body.pis-cp-msgs .client-message-drawer > .client-message-list { order: 1; }
body.pis-cp-msgs .client-message-drawer > #client-message-error { order: 2; padding: 9px 16px !important; background: #FDECEA !important; color: #B42318 !important; font: 600 13.500px/1.35 var(--cp-text) !important; text-align: center; }
body.pis-cp-msgs .client-message-drawer > .client-message-form { order: 3; align-items: flex-end !important; gap: 10px !important; padding: 10px 12px !important; border-top: 1px solid var(--cp-line) !important; background: #fff !important; }
/* the line around the box is drawn inside it, so the app's own sizing of a longer message stays exact */
body.pis-cp-msgs .client-message-form textarea { box-sizing: border-box !important; min-height: 50px !important; max-height: 124px !important; padding: 12px 15px !important; border: 0 !important; border-radius: 16px !important; background: #F2F6FA !important;
    color: var(--cp-navy) !important; font: 500 16.500px/1.4 var(--cp-text) !important; box-shadow: inset 0 0 0 1.500px var(--cp-line) !important; -webkit-appearance: none; appearance: none; }
body.pis-cp-msgs .client-message-form textarea::placeholder { color: #6F8296; opacity: 1; }
body.pis-cp-msgs .client-message-form textarea:focus { background: #fff !important; box-shadow: inset 0 0 0 1.500px #F6912A, 0 0 0 3px rgba(246,145,42,.16) !important; outline: none !important; }
body.pis-cp-msgs .client-message-send { flex: 0 0 50px !important; width: 50px !important; height: 50px !important; border: 0 !important; border-radius: 16px !important; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; color: #fff !important;
    box-shadow: 0 4px 10px rgba(242,107,33,.28) !important; transform: none !important; -webkit-tap-highlight-color: transparent; }
body.pis-cp-msgs .client-message-send:active { transform: scale(.96) !important; }
body.pis-cp-msgs .client-message-send:disabled { opacity: .55 !important; }
body.pis-cp-msgs .client-message-send svg { width: 21px !important; height: 21px !important; stroke-width: 2 !important; }

/* ----- in between (a tablet held upright): still the app's panel, with the new lettering ----- */
body.pis-cp-msgs .client-message-header { border-bottom: 1px solid var(--cp-line) !important; background: #fff !important; }
body.pis-cp-msgs .client-message-header h3 { color: var(--cp-navy) !important; font: 600 21px/1.2 var(--cp-display) !important; }
body.pis-cp-msgs .client-message-header p { margin-top: 2px !important; color: var(--cp-soft) !important; font: 700 13px/1.3 var(--cp-text) !important; }
body.pis-cp-msgs .client-message-close { border-radius: 12px !important; background: #EEF3F8 !important; color: var(--cp-navy) !important; }

/* ----- phones and computers: Messages is a screen of its own. The panel fills the page under the header
   (the header is on top of it and says Messages), so it needs no heading, no X and no dimmed page behind it. ----- */
@media (max-width: 700px), (min-width: 1024px) {
    body.pis-cp-msgs .client-message-drawer { top: 0 !important; right: 0 !important; width: auto !important; height: auto !important; max-width: none !important; max-height: none !important; z-index: 899 !important; box-sizing: border-box !important;
        padding-top: var(--cp-msg-top, 74px) !important; border: 0 !important; border-radius: 0 !important; background: #EEF4F9 !important; box-shadow: none !important; transform: none !important; transition: none !important; }
    body.pis-cp-msgs .client-message-header, body.pis-cp-msgs .client-message-backdrop { display: none !important; }
}
@media (max-width: 700px) {
    /* the tabs stay: the panel runs down behind them, and what is in it stops where they start */
    body.pis-cp-msgs .client-message-drawer { left: 0 !important; bottom: 0 !important; padding-bottom: var(--cp-msg-bottom, 75px) !important; }
    /* while the keyboard is up the tabs step aside, and the box sits on the keyboard */
    body.pis-cp-msgs.pis-cp-keys.client-messaging-open .client-message-drawer { padding-bottom: var(--cp-msg-kb, 0px) !important; }
    body.pis-cp-msgs.pis-cp-keys.client-messaging-open .client-bottom-navigation { display: none !important; }
}
@media (min-width: 1024px) {
    body.pis-cp-msgs .client-message-drawer { left: var(--cp-msg-left, 232px) !important; bottom: 0 !important; }
    body.pis-cp-msgs.client-messaging-open { overflow: hidden !important; }          /* the page under it stays put */
    body.pis-cp-msgs.pis-cp-keys.client-messaging-open .client-message-drawer { padding-bottom: var(--cp-msg-kb, 0px) !important; }      /* a tablet on its side: the box rides above its keyboard */
    body.pis-cp-msgs .client-message-list { padding: 8px 34px 22px !important; }
    body.pis-cp-msgs .client-message-list > :first-child { margin-top: auto !important; }       /* a short conversation sits just above the box */
    body.pis-cp-msgs .client-message-row.is-client, body.pis-cp-msgs .client-message-row.is-business { max-width: min(72%, 760px) !important; }
    body.pis-cp-msgs .client-message-bubble { font-size: 17px !important; }
    body.pis-cp-msgs .client-message-drawer > .client-message-form { gap: 12px !important; padding: 16px 34px 20px !important; }
    body.pis-cp-msgs .client-message-form textarea { min-height: 54px !important; padding: 14px 18px !important; }
    body.pis-cp-msgs .client-message-send { flex-basis: 54px !important; width: 54px !important; height: 54px !important; }
    /* the left menu: Messages is the page you're on */
    body.pis-cp-msgs.client-messaging-open.client-portal-page .client-desktop-nav-item.is-active:not(.pis-cp-nav-messages) { background: none; color: var(--cp-soft); }
    body.pis-cp-msgs.client-messaging-open.client-portal-page .client-desktop-nav-item.is-active:not(.pis-cp-nav-messages):hover { background: #FFF6EA; color: var(--cp-navy); }
    body.pis-cp-msgs.client-messaging-open.client-portal-page .client-desktop-nav-item.is-active:not(.pis-cp-nav-messages) .client-desktop-nav-icon { color: inherit; }
    body.pis-cp-msgs.client-messaging-open.client-portal-page .pis-cp-nav-messages { background: #FFE9CC; color: var(--cp-navy); }
    body.pis-cp-msgs.client-messaging-open.client-portal-page .pis-cp-nav-messages .client-desktop-nav-icon { color: var(--cp-tang); }
}

/* =====================================================================
   PART 7: PROFILE
   ===================================================================== */
/* The app's heading, its cards and its Notifications box give way to the page below. They are still there:
   every row presses one of their buttons, and the words on the rows are read from them. */
body.pis-cp-prof #household-section > .household-section-header, body.pis-cp-prof #household-profile, body.pis-cp-prof #client-push-settings-card { display: none !important; }
body.pis-cp-prof #household-section { margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; overflow: visible !important; }
body.pis-cp-prof #household-section::before, body.pis-cp-prof #household-section::after { display: none !important; }

/* ----- the page ----- */
.pis-cp-pf { display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 0; color: var(--cp-navy); font-family: var(--cp-text); text-align: left; }
.pis-cp-pf-col { display: contents; }
.pis-cp-pf-me, .pis-cp-pf-credit, .pis-cp-pf-group { box-sizing: border-box; min-width: 0; margin: 0; border: 1px solid var(--cp-line); border-radius: 20px; background: #fff; box-shadow: 0 5px 14px rgba(20,48,79,.06); overflow: hidden; }
.pis-cp-pf-me { order: 1; padding: 0 16px 16px; text-align: center; }
.pis-cp-pf-me > u { display: block; height: 62px; margin: 0 -16px; background: linear-gradient(90deg, #F5AB40 0%, #F6912A 55%, #F26B21 100%); text-decoration: none; }
.pis-cp-pf-face { display: grid; place-items: center; box-sizing: border-box; width: 86px; height: 86px; margin: -43px auto 0; border: 4px solid #fff; border-radius: 50%; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%); color: #fff;
    font: 600 30px/1 var(--cp-display); letter-spacing: .5px; box-shadow: 0 6px 14px rgba(242,107,33,.3); overflow: hidden; position: relative; }
.pis-cp-pf-face img { display: block; width: 100%; height: 100%; object-fit: cover; }
body.pis-cp-prof .pis-cp-pf-me h2 { margin: 10px 0 0 !important; padding: 0 !important; color: var(--cp-navy) !important; font: 600 25px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; white-space: nowrap; overflow: hidden; }
body.pis-cp-prof .pis-cp-pf-me p { margin: 3px 0 0 !important; padding: 0 !important; color: var(--cp-soft) !important; font: 500 16px/1.35 var(--cp-text) !important; white-space: nowrap; overflow: hidden; }
body.pis-cp-prof .pis-cp-pf-me :is(h2, p).is-wrap { white-space: normal; overflow-wrap: anywhere; }
body.pis-cp-prof .pis-cp-pf-edit { display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; max-width: none !important; height: 52px !important; min-height: 52px !important;
    margin: 14px 0 0 !important; padding: 0 12px !important; border: 0 !important; border-radius: 16px !important; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; color: #fff !important;
    font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; cursor: pointer; -webkit-tap-highlight-color: transparent; }
body.pis-cp-prof .pis-cp-pf-edit:active { transform: scale(.985); }
.pis-cp-pf-credit { order: 2; display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-color: #CDE9D8; background: #F1FAF5; }
.pis-cp-pf-credit > i { flex: none; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: #DDF2E6; color: var(--cp-grass); font-style: normal; }
.pis-cp-pf-credit > span { flex: 1 1 auto; min-width: 0; }
.pis-cp-pf-credit b { display: block; color: var(--cp-navy); font: 700 16.500px/1.3 var(--cp-text); white-space: nowrap; overflow: hidden; }
.pis-cp-pf-credit small { display: block; color: var(--cp-soft); font: 600 14.500px/1.35 var(--cp-text); white-space: nowrap; overflow: hidden; }
.pis-cp-pf-credit > strong { flex: none; color: #1F7A45; font: 600 26px/1 var(--cp-display); letter-spacing: .2px; }
.pis-cp-pf-group.is-home { order: 3; } .pis-cp-pf-group.is-app { order: 4; } .pis-cp-pf-group.is-account { order: 5; }
.pis-cp-pf-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--cp-band-line); background: var(--cp-cream); }
.pis-cp-pf-head > svg { flex: none; color: var(--cp-tang); }
body.pis-cp-prof .pis-cp-pf-head h3 { margin: 0 !important; padding: 0 !important; color: var(--cp-navy) !important; font: 600 17px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp-prof .pis-cp-pf-row { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 14px !important; box-sizing: border-box !important; width: 100% !important; max-width: none !important;
    height: auto !important; min-height: 68px !important; margin: 0 !important; padding: 12px 12px 12px 16px !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; border-radius: 0 !important; background: #fff !important; box-shadow: none !important;
    color: var(--cp-navy) !important; font: inherit !important; letter-spacing: 0 !important; text-align: left !important; text-decoration: none !important; text-transform: none !important; cursor: pointer; -webkit-tap-highlight-color: transparent; }
body.pis-cp-prof .pis-cp-pf-head + .pis-cp-pf-row { border-top: 0 !important; }
body.pis-cp-prof .pis-cp-pf-row:active { background: #F6F9FC !important; }
.pis-cp-pf-row > i { flex: none; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: var(--cp-cream); color: var(--cp-tang); font-style: normal; overflow: hidden; }
.pis-cp-pf-row > i.is-blue { background: #E6F1FB; color: var(--cp-blue); }
.pis-cp-pf-row > i.is-gray { background: #EEF2F7; color: var(--cp-soft); }
.pis-cp-pf-row > i.is-red { background: #FDECEA; color: #C0392B; }
.pis-cp-pf-row > i.is-pic { background: none; border-radius: 11px; }
.pis-cp-pf-row > i.is-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
.pis-cp-pf-words { flex: 1 1 auto; min-width: 0; display: block; }
.pis-cp-pf-words b { display: block; color: var(--cp-navy); font: 700 16.500px/1.3 var(--cp-text); white-space: nowrap; overflow: hidden; }
.pis-cp-pf-words small { display: block; color: var(--cp-soft); font: 500 15px/1.4 var(--cp-text); white-space: nowrap; overflow: hidden; }
.pis-cp-pf-words small.is-wrap { white-space: pre-line; overflow-wrap: anywhere; }
.pis-cp-pf-row.is-danger .pis-cp-pf-words b { color: #C0392B; }
.pis-cp-pf-words b.is-wrap, .pis-cp-pf-credit :is(b, small).is-wrap { white-space: normal; overflow-wrap: anywhere; }
.pis-cp-pf-row > svg { flex: none; color: #9AAABB; }
.pis-cp-pf-chip { flex: none; padding: 4px 10px; border-radius: 10px; background: #E7F6EE; color: #1F7A45; font: 700 13px/1.25 var(--cp-text); font-style: normal; }
.pis-cp-pf-chip.is-off { background: #EEF2F7; color: var(--cp-soft); }
body.pis-cp-prof .pis-cp-pf .pis-cp-logout { order: 6; margin: 0 !important; }
@media (max-width: 1023px) { body.pis-cp-prof .pis-cp-pf .is-desk { display: none !important; } }
@media (min-width: 1024px) {
    .pis-cp-pf { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; align-items: start; }
    .pis-cp-pf-col { display: flex; flex-direction: column; gap: 22px; min-width: 0; }
    body.pis-cp-prof .pis-cp-pf .is-phone { display: none !important; }
    .pis-cp-pf-me { padding: 0 22px 22px; } .pis-cp-pf-me > u { height: 76px; margin: 0 -22px; }
    .pis-cp-pf-face { width: 100px; height: 100px; margin-top: -50px; font-size: 34px; }
    body.pis-cp-prof .pis-cp-pf-me h2 { font-size: 28px !important; } body.pis-cp-prof .pis-cp-pf-me p { font-size: 17px !important; }
    body.pis-cp-prof .pis-cp-pf-edit { height: 56px !important; margin-top: 18px !important; font-size: 18px !important; }
    .pis-cp-pf-credit { padding: 18px 22px; } .pis-cp-pf-credit > strong { font-size: 30px; }
    .pis-cp-pf-head { padding: 14px 20px; } body.pis-cp-prof .pis-cp-pf-head h3 { font-size: 18.500px !important; }
    body.pis-cp-prof .pis-cp-pf-row { min-height: 76px !important; padding: 14px 16px 14px 20px !important; }
    body.pis-cp-prof .pis-cp-pf-row:hover { background: #F8FAFC !important; }
    .pis-cp-pf-words b { font-size: 17.500px; } .pis-cp-pf-words small { font-size: 15.500px; }
    body.pis-cp-prof .pis-cp-pf .pis-cp-logout { max-width: none !important; height: 56px; }
}

/* ----- a sheet (phones) or a pop-up (computers): the edit form in parts, Account Security ----- */
body.pis-cp .pis-cp-sheet { position: fixed !important; left: 0 !important; right: 0 !important; top: auto !important; bottom: var(--cp-kb, 0px) !important; z-index: 5001 !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important;
    width: auto !important; max-width: none !important; max-height: calc(100vh - 34px - env(safe-area-inset-top, 0px)); max-height: calc(100dvh - 34px - env(safe-area-inset-top, 0px) - var(--cp-kb, 0px)); margin: 0 !important; padding: 0 !important; border: 0 !important;
    border-radius: 26px 26px 0 0 !important; background: #fff !important; box-shadow: 0 -10px 30px rgba(13,30,48,.24) !important; color: var(--cp-navy); font-family: var(--cp-text); text-align: left; overflow: hidden !important; animation: pis-cp-sheet-up .22s ease-out; }
body.pis-cp .pis-cp-sheet[hidden] { display: none !important; }
body.pis-cp .pis-cp-sheet::before { content: "" !important; display: block !important; position: absolute; top: 8px; left: 50%; width: 40px; height: 5px; margin-left: -20px; border-radius: 3px; background: #D5DFE9; }
body.pis-cp .pis-cp-sheet::after { display: none !important; }
body.pis-cp #household-form-panel[data-cp-ready] { position: fixed !important; left: 0 !important; right: 0 !important; bottom: 0 !important; top: auto !important; margin: 0 !important; }
body.pis-cp .pis-cp-sheet :is(.pis-cp-sheethead, .household-form-header) { flex: none; display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 12px !important; margin: 0 !important;
    padding: 24px 16px 8px !important; border: 0 !important; background: none !important; }
body.pis-cp .pis-cp-sheet .household-form-header > div:not(.pis-cp-sheettitle) { position: absolute !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip-path: inset(50%) !important; white-space: nowrap !important; }
.pis-cp-sheettitle > i.is-blue { background: #E6F1FB; color: var(--cp-blue); }
.pis-cp-sheettitle > i.is-gray { background: #EEF2F7; color: var(--cp-soft); }
body.pis-cp .pis-cp-sheet :is(.pis-cp-sheetx, #close-household-form-button) { flex: none !important; position: static !important; display: grid !important; place-items: center !important; width: 44px !important; min-width: 44px !important; height: 44px !important;
    min-height: 44px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 14px !important; background: #EEF3F8 !important; box-shadow: none !important; color: var(--cp-navy) !important; font-size: 0 !important; line-height: 0 !important; cursor: pointer; }
body.pis-cp .pis-cp-sheet :is(.pis-cp-sheetbody, #household-form) { flex: 1 1 auto; min-height: 0; display: flex !important; flex-direction: column !important; gap: 0 !important; margin: 0 !important; padding: 6px 16px 0 !important; border: 0 !important; background: none !important;
    box-shadow: none !important; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
body.pis-cp .pis-cp-sheet :is(.pis-cp-sheetbody, #household-form) > * { flex: none; }
body.pis-cp #pis-cp-security.pis-cp-sheet .pis-cp-sheetbody { padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important; }
/* the boxes */
body.pis-cp .pis-cp-sheet label { display: block !important; margin: 12px 2px 6px !important; padding: 0 !important; color: var(--cp-soft) !important; font: 700 14px/1.25 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; }
body.pis-cp .pis-cp-sheet :is(input[type="text"], input[type="tel"], input[type="email"], input[type="password"], select, textarea) { display: block !important; box-sizing: border-box !important; width: 100% !important; max-width: none !important; min-width: 0 !important;
    height: 52px !important; min-height: 52px !important; margin: 0 !important; padding: 0 14px !important; border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background-color: #fff !important; box-shadow: none !important;
    color: var(--cp-navy) !important; font: 600 17px/1.3 var(--cp-text) !important; letter-spacing: 0 !important; -webkit-appearance: none; appearance: none; opacity: 1 !important; }
body.pis-cp .pis-cp-sheet textarea[id] { height: auto !important; min-height: 78px !important; padding: 12px 14px !important; line-height: 1.45 !important; resize: none; }
body.pis-cp .pis-cp-sheet #household-home-notes { min-height: 112px !important; }
body.pis-cp .pis-cp-sheet [data-cp-part="access"] textarea[id] { height: 76px !important; min-height: 76px !important; }      /* two lines showing; a longer one scrolls */
body.pis-cp .pis-cp-sheet select { padding-right: 38px !important;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2351677F' stroke-width='2.400' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important; background-repeat: no-repeat !important; background-position: right 12px center !important; background-size: 18px !important; }
body.pis-cp .pis-cp-sheet :is(input, select, textarea)::placeholder { color: #9AAABB !important; font-weight: 500 !important; opacity: 1; }
body.pis-cp .pis-cp-sheet :is(input[type="text"], input[type="tel"], input[type="password"], select, textarea):focus { outline: none !important; border-color: var(--cp-tang) !important; box-shadow: 0 0 0 4px rgba(244,123,32,.16) !important; }
body.pis-cp .pis-cp-sheet :is(input, select, textarea).pis-field-invalid { border-color: #d94f4f !important; background-color: #fffafa !important; box-shadow: 0 0 0 3px rgba(217, 79, 79, .14) !important; }
body.pis-cp .pis-cp-sheet :is(input, select, textarea).pis-field-invalid:focus { border-color: #d94f4f !important; box-shadow: 0 0 0 3px rgba(217, 79, 79, .22) !important; }
/* the sign-in email: shown, locked */
body.pis-cp .pis-cp-sheet #household-email { padding-right: 42px !important; background-color: #F2F6FA !important; color: var(--cp-soft) !important; -webkit-text-fill-color: var(--cp-soft);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2351677F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='5.500' y='10.500' width='13' height='9' rx='2.200'/%3E%3Cpath d='M8.500 10.500V8a3.500 3.500 0 0 1 7 0v2.500'/%3E%3C/svg%3E") !important; background-repeat: no-repeat !important; background-position: right 13px center !important; background-size: 19px !important; }
body.pis-cp .pis-cp-sheet .field-help { display: block !important; margin: 6px 2px 0 !important; color: var(--cp-soft) !important; font: 500 13.500px/1.35 var(--cp-text) !important; }
/* the edit form: one part at a time */
body.pis-cp #household-form-panel.pis-cp-sheet .household-form-section { display: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp #household-form-panel.pis-cp-sheet :is(.household-form-section > h5, .access-form-heading, .client-photo-editor) { display: none !important; }
body.pis-cp #household-form-panel.pis-cp-sheet .household-form-grid { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; gap: 0 12px !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp #household-form-panel.pis-cp-sheet .household-form-field { grid-column: 1 / -1; display: none !important; min-width: 0; margin: 0 !important; padding: 0 !important; }
body.pis-cp #household-form-panel.pis-cp-sheet .household-form-field[data-cp-half] { grid-column: auto; }
body.pis-cp #household-form-panel[data-cp-sheet="address"] .household-form-grid { grid-template-columns: minmax(0, 1.500fr) minmax(0, 1fr) !important; }
body.pis-cp #household-form-panel[data-cp-sheet="profile"] .household-form-section[data-cp-has~="profile"], body.pis-cp #household-form-panel[data-cp-sheet="address"] .household-form-section[data-cp-has~="address"],
body.pis-cp #household-form-panel[data-cp-sheet="contact"] .household-form-section[data-cp-has~="contact"], body.pis-cp #household-form-panel[data-cp-sheet="emergency"] .household-form-section[data-cp-has~="emergency"],
body.pis-cp #household-form-panel[data-cp-sheet="access"] .household-form-section[data-cp-has~="access"], body.pis-cp #household-form-panel[data-cp-sheet="notes"] .household-form-section[data-cp-has~="notes"],
body.pis-cp #household-form-panel[data-cp-sheet="profile"] .household-form-field[data-cp-part="profile"], body.pis-cp #household-form-panel[data-cp-sheet="address"] .household-form-field[data-cp-part="address"],
body.pis-cp #household-form-panel[data-cp-sheet="contact"] .household-form-field[data-cp-part="contact"], body.pis-cp #household-form-panel[data-cp-sheet="emergency"] .household-form-field[data-cp-part="emergency"],
body.pis-cp #household-form-panel[data-cp-sheet="access"] .household-form-field[data-cp-part="access"], body.pis-cp #household-form-panel[data-cp-sheet="notes"] .household-form-field[data-cp-part="notes"] { display: block !important; }
/* your photo */
body.pis-cp #household-form-panel.pis-cp-sheet[data-cp-sheet="profile"] .client-photo-editor { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 14px !important; margin: 4px 0 2px !important; padding: 0 !important;
    border: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp .pis-cp-sheet #client-photo-preview-wrapper { flex: none !important; display: grid !important; place-items: center !important; box-sizing: border-box !important; width: 72px !important; height: 72px !important; margin: 0 !important; border: 0 !important; border-radius: 50% !important;
    background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 4px 10px rgba(242,107,33,.26) !important; overflow: hidden !important; }
body.pis-cp .pis-cp-sheet #client-photo-preview { width: 100% !important; height: 100% !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; object-fit: cover !important; }
body.pis-cp .pis-cp-sheet #client-photo-preview-initials { align-items: center !important; justify-content: center !important; width: 100% !important; height: 100% !important; background: none !important; color: #fff !important; font: 600 26px/1 var(--cp-display) !important; letter-spacing: .5px !important; }
body.pis-cp .pis-cp-sheet .client-photo-controls { flex: 1 1 auto; min-width: 0; display: block !important; margin: 0 !important; padding: 0 !important; text-align: left !important; }
body.pis-cp .pis-cp-sheet .client-photo-upload-button { display: inline-flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: auto !important; min-width: 148px; height: 46px !important; margin: 0 !important; padding: 0 18px !important;
    border: 1.500px solid #F8C58E !important; border-radius: 14px !important; background: #FFF7EC !important; box-shadow: none !important; color: #C2500B !important; font: 600 16px/1 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
body.pis-cp .pis-cp-sheet .client-photo-help { margin: 6px 2px 0 !important; color: var(--cp-soft) !important; font: 500 14px/1.3 var(--cp-text) !important; text-align: left !important; }
body.pis-cp .pis-cp-sheet .client-photo-controls.pis-field-invalid .client-photo-upload-button { border-color: #d94f4f !important; box-shadow: 0 0 0 1.500px #d94f4f, 0 0 0 5px rgba(217, 79, 79, .16) !important; }
/* Preferred Contact: three choices standing in for the app's list */
body.pis-cp #household-form-panel[data-cp-sheet="contact"] label[for="household-preferred-contact"] { position: absolute !important; width: 1px !important; height: 1px !important; margin: -1px !important; overflow: hidden !important; clip-path: inset(50%) !important; white-space: nowrap !important; }
body.pis-cp #household-form-panel.pis-cp-sheet select.pis-cp-held { position: absolute !important; width: 1px !important; height: 1px !important; min-height: 0 !important; padding: 0 !important; border: 0 !important; opacity: 0 !important; pointer-events: none !important; }
.pis-cp-pf-opts { display: grid; gap: 10px; margin: 6px 0 2px; }
body.pis-cp .pis-cp-sheet .pis-cp-pf-opt { display: flex !important; align-items: center !important; justify-content: flex-start !important; gap: 12px !important; box-sizing: border-box !important; width: 100% !important; min-height: 64px !important; margin: 0 !important; padding: 10px 14px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 16px !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 700 16.500px/1.2 var(--cp-text) !important; letter-spacing: 0 !important; text-align: left !important; text-transform: none !important;
    cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pis-cp-pf-opt > i { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 13px; background: #E6F1FB; color: var(--cp-blue); font-style: normal; }
.pis-cp-pf-opt > span { flex: 1 1 auto; min-width: 0; }
.pis-cp-pf-opt::after { content: ""; flex: none; box-sizing: border-box; width: 24px; height: 24px; border: 2px solid #C3D0DC; border-radius: 50%; background: #fff center / 16px no-repeat; }
body.pis-cp .pis-cp-sheet .pis-cp-pf-opt[aria-checked="true"] { border-color: var(--cp-tang) !important; background: #FFF7EC !important; box-shadow: 0 0 0 3px rgba(244,123,32,.14) !important; }
.pis-cp-pf-opt[aria-checked="true"]::after { border-color: var(--cp-tang); background-color: var(--cp-tang);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.200' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 12.500 4 4 8-9'/%3E%3C/svg%3E"); }
/* what the app says, then Cancel and Save at the bottom */
body.pis-cp #household-form-panel.pis-cp-sheet #household-form-message { order: 5; margin: 12px 2px 0 !important; color: #B42318 !important; font: 600 14px/1.4 var(--cp-text) !important; text-align: left !important; }
body.pis-cp #household-form-panel.pis-cp-sheet #household-form-message:empty { display: none !important; }
body.pis-cp #household-form-panel.pis-cp-sheet .household-form-actions { order: 6; position: sticky; bottom: 0; z-index: 2; box-sizing: border-box !important; align-self: stretch !important; width: auto !important; max-width: none !important; display: grid !important;
    grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr) !important; gap: 10px !important; margin: 16px -16px 0 !important; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; background: #fff !important; }
body.pis-cp .pis-cp-sheet :is(#cancel-household-button, #save-household-button, #change-password-button) { display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important;
    max-width: none !important; height: 52px !important; min-height: 52px !important; margin: 0 !important; padding: 0 12px !important; border-radius: 15px !important; font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
body.pis-cp .pis-cp-sheet #cancel-household-button { border: 1.500px solid var(--cp-line) !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; }
body.pis-cp .pis-cp-sheet :is(#save-household-button, #change-password-button) { border: 0 !important; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; color: #fff !important; }
body.pis-cp .pis-cp-sheet :is(#save-household-button, #change-password-button):disabled { opacity: .6 !important; box-shadow: none !important; }

/* ----- Account Security: the app's Face ID row and its password form, in a sheet ----- */
body.pis-cp .pis-cp-sheet #account-security-content { display: block !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
body.pis-cp .pis-cp-sheet .pis-faceid-setting { display: flex !important; align-items: center !important; gap: 12px !important; margin: 4px 0 6px !important; padding: 12px 12px 12px 14px !important; border: 1.500px solid var(--cp-line) !important; border-radius: 16px !important; background: #fff !important; box-shadow: none !important; }
body.pis-cp .pis-cp-sheet .pis-faceid-setting-icon { flex: none !important; display: grid !important; place-items: center !important; width: 40px !important; height: 40px !important; border-radius: 13px !important; background: #EEF2F7 !important; color: var(--cp-soft) !important; }
body.pis-cp .pis-cp-sheet .pis-faceid-setting-text { flex: 1 1 auto !important; min-width: 0 !important; display: block !important; }
body.pis-cp .pis-cp-sheet .pis-faceid-setting-text strong { display: block !important; color: var(--cp-navy) !important; font: 700 16px/1.3 var(--cp-text) !important; text-transform: capitalize; }
body.pis-cp .pis-cp-sheet .pis-faceid-setting-text small { display: block !important; color: var(--cp-soft) !important; font: 500 14.500px/1.35 var(--cp-text) !important; }
body.pis-cp .pis-cp-sheet .pis-faceid-setting-button { flex: none !important; width: auto !important; min-width: 0 !important; height: 44px !important; min-height: 44px !important; margin: 0 !important; padding: 0 14px !important; border: 1.500px solid var(--cp-line) !important; border-radius: 13px !important;
    background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 15px/1 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; white-space: nowrap; }
body.pis-cp .pis-cp-sheet #change-password-form { display: block !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp .pis-cp-sheet .account-security-form-heading { margin: 12px 2px 0 !important; padding: 0 !important; }
body.pis-cp .pis-cp-sheet .account-security-form-heading h4 { margin: 0 !important; color: var(--cp-navy) !important; font: 600 18px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp .pis-cp-sheet .account-security-form-heading p { display: none !important; }
body.pis-cp .pis-cp-sheet .change-password-grid { display: block !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp .pis-cp-sheet .change-password-field { margin: 0 !important; padding: 0 !important; }
body.pis-cp .pis-cp-sheet .pis-password-wrap { position: relative !important; display: block !important; margin: 0 !important; }
body.pis-cp .pis-cp-sheet .pis-password-wrap input { padding-right: 76px !important; }
body.pis-cp .pis-cp-sheet .pis-password-toggle { position: absolute !important; top: 4px !important; right: 4px !important; bottom: auto !important; left: auto !important; width: auto !important; min-width: 60px !important; height: 44px !important; min-height: 44px !important; margin: 0 !important; padding: 0 10px !important;
    border: 0 !important; border-radius: 11px !important; background: none !important; box-shadow: none !important; color: var(--cp-blue) !important; font: 700 15px/1 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; transform: none !important; cursor: pointer; }
body.pis-cp .pis-cp-sheet .change-password-requirements { margin: 8px 2px 0 !important; padding: 0 !important; border: 0 !important; background: none !important; color: var(--cp-soft) !important; font: 500 14px/1.35 var(--cp-text) !important; }
body.pis-cp .pis-cp-sheet .change-password-requirements span { color: inherit !important; font: inherit !important; }
body.pis-cp .pis-cp-sheet .change-password-actions { display: block !important; margin: 16px 0 0 !important; padding: 0 !important; }
body.pis-cp .pis-cp-sheet #change-password-message { margin: 10px 2px 0 !important; font: 600 14px/1.4 var(--cp-text) !important; text-align: left !important; }
body.pis-cp .pis-cp-sheet #change-password-message:empty { display: none !important; }

@media (min-width: 1024px) {
    /* a pop-up in the middle of the screen */
    body.pis-cp .pis-cp-sheet { left: 50% !important; right: auto !important; top: 50% !important; bottom: auto !important; width: min(520px, calc(100vw - 48px)) !important; max-height: calc(100vh - 80px); border-radius: 24px !important; transform: translate(-50%, -50%);
        box-shadow: 0 24px 60px rgba(13,30,48,.32) !important; animation: none; }
    body.pis-cp .pis-cp-sheet::before { display: none !important; }
    body.pis-cp .pis-cp-sheet :is(.pis-cp-sheethead, .household-form-header) { padding: 20px 20px 8px !important; }
    body.pis-cp .pis-cp-sheet :is(.pis-cp-sheetbody, #household-form) { padding: 6px 20px 0 !important; }
    body.pis-cp #pis-cp-security.pis-cp-sheet .pis-cp-sheetbody { padding-bottom: 20px !important; }
    body.pis-cp #household-form-panel.pis-cp-sheet .household-form-actions { margin: 18px -20px 0 !important; padding: 14px 20px !important; }
}
@media (prefers-reduced-motion: reduce) { body.pis-cp .pis-cp-sheet { animation: none; } }

/* ----- Push Notifications: the app's own settings pop-up, as a sheet ----- */
body.pis-cp-prof .client-notifications-modal { align-items: flex-end !important; justify-content: center !important; padding: 0 !important; }
body.pis-cp-prof .client-notifications-modal-backdrop { background: rgba(13,30,48,.48) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
body.pis-cp-prof .client-notifications-dialog { position: relative !important; box-sizing: border-box !important; display: block !important; width: 100% !important; max-width: none !important; height: auto !important;
    max-height: calc(100vh - 34px - env(safe-area-inset-top, 0px)) !important; max-height: calc(100dvh - 34px - env(safe-area-inset-top, 0px)) !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 26px 26px 0 0 !important;
    background: #fff !important; box-shadow: 0 -10px 30px rgba(13,30,48,.24) !important; color: var(--cp-navy) !important; font-family: var(--cp-text) !important; overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; animation: pis-cp-sheet-up .22s ease-out; }
body.pis-cp-prof .client-notifications-dialog::before { content: "" !important; display: block !important; position: absolute; top: 8px; left: 50%; width: 40px; height: 5px; margin-left: -20px; border-radius: 3px; background: #D5DFE9; }
body.pis-cp-prof .client-notifications-header { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 12px !important; margin: 0 !important; padding: 24px 16px 8px !important; border: 0 !important; background: none !important; }
body.pis-cp-prof .client-notifications-header > div { flex: 1 1 auto; min-width: 0; }
body.pis-cp-prof .client-notifications-eyebrow { display: none !important; }
body.pis-cp-prof .client-notifications-header h2 { margin: 0 !important; color: var(--cp-navy) !important; font: 600 24px/1.15 var(--cp-display) !important; letter-spacing: .1px !important; white-space: nowrap; overflow: hidden; }
body.pis-cp-prof .client-notifications-header p { margin: 1px 0 0 !important; color: var(--cp-soft) !important; font: 600 15px/1.25 var(--cp-text) !important; white-space: nowrap; overflow: hidden; }
.pis-cp-pf-tile { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 14px; background: #E6F1FB; color: var(--cp-blue); font-style: normal; }
body.pis-cp-prof :is(.client-notifications-close, .pis-delete-modal-x, #pis-appicon-modal .client-cancellation-close) { flex: none !important; position: static !important; display: grid !important; place-items: center !important; width: 44px !important; min-width: 44px !important;
    height: 44px !important; min-height: 44px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 14px !important; background: #EEF3F8 !important; box-shadow: none !important; color: var(--cp-navy) !important; font-size: 0 !important; line-height: 0 !important; transform: none !important; cursor: pointer; }
body.pis-cp-prof .client-notifications-device-section { display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; align-items: center !important; gap: 10px 12px !important; margin: 6px 16px 0 !important; padding: 12px 14px !important; border: 1.500px solid var(--cp-line) !important;
    border-radius: 16px !important; background: #fff !important; box-shadow: none !important; }
body.pis-cp-prof .client-notifications-device-section.is-on { border-color: #CDE9D8 !important; background: #F1FAF5 !important; }
body.pis-cp-prof .client-notifications-device-section > .pis-cp-pf-tile { width: 42px; height: 42px; border-radius: 13px; background: #EEF2F7; color: var(--cp-soft); }
body.pis-cp-prof .client-notifications-device-section.is-on > .pis-cp-pf-tile { background: #DDF2E6; color: var(--cp-grass); }
body.pis-cp-prof .client-notifications-device-copy { flex: 1 1 0; min-width: 0; }
body.pis-cp-prof .client-notifications-device-copy .client-notifications-section-label { display: none !important; }
body.pis-cp-prof .client-notifications-device-copy strong { display: block !important; margin: 0 !important; color: var(--cp-navy) !important; font: 700 16.500px/1.3 var(--cp-text) !important; }
body.pis-cp-prof .client-notifications-device-copy p { display: block !important; margin: 1px 0 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; color: var(--cp-soft) !important; font: 500 14.500px/1.4 var(--cp-text) !important; }
body.pis-cp-prof .client-notifications-device-copy p::before, body.pis-cp-prof .client-notifications-device-copy p::after { display: none !important; }
body.pis-cp-prof .client-notifications-device-section > .pis-cp-pf-chip { display: none; }
body.pis-cp-prof .client-notifications-device-section.is-on > .pis-cp-pf-chip { display: block; }
body.pis-cp-prof .client-notifications-device-section.is-on > .client-notification-enable-button { display: none !important; }
body.pis-cp-prof .client-notification-enable-button { flex: 1 1 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; height: 48px !important; min-height: 48px !important; margin: 0 !important; padding: 0 12px !important;
    border: 0 !important; border-radius: 14px !important; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 5px 12px rgba(242,107,33,.26) !important; color: #fff !important; font: 600 16.500px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; }
body.pis-cp-prof .client-notification-enable-button:disabled { background: #EEF2F7 !important; box-shadow: none !important; color: var(--cp-soft) !important; opacity: 1 !important; }
body.pis-cp-prof .client-notifications-preferences-section { margin: 0 !important; padding: 16px 16px 4px !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp-prof .client-notifications-section-heading { margin: 0 0 2px !important; padding: 0 !important; }
body.pis-cp-prof .client-notifications-section-heading .client-notifications-section-label { display: block !important; color: var(--cp-navy) !important; font: 600 18px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; }
body.pis-cp-prof .client-notifications-section-heading p { display: none !important; }
body.pis-cp-prof .client-notification-preference-row { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 14px !important; min-height: 64px !important; margin: 0 !important; padding: 10px 0 !important; border: 0 !important;
    border-top: 1px solid var(--cp-line) !important; border-radius: 0 !important; background: none !important; cursor: pointer; }
body.pis-cp-prof .client-notifications-section-heading + .client-notification-preference-row { border-top: 0 !important; }
body.pis-cp-prof .client-notification-preference-row > span { flex: 1 1 auto; min-width: 0; }
body.pis-cp-prof .client-notification-preference-row strong { display: block !important; margin: 0 !important; color: var(--cp-navy) !important; font: 700 16.500px/1.3 var(--cp-text) !important; }
body.pis-cp-prof .client-notification-preference-row small { display: block !important; margin: 0 !important; color: var(--cp-soft) !important; font: 500 14.500px/1.4 var(--cp-text) !important; }
/* each choice is a switch (it is still the app's own checkbox) */
body.pis-cp-prof .client-notification-preference-row input[type="checkbox"] { flex: none !important; position: relative !important; -webkit-appearance: none !important; appearance: none !important; box-sizing: border-box !important; width: 52px !important; height: 32px !important; min-width: 52px !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-radius: 16px !important; background: #CBD6E1 !important; box-shadow: none !important; cursor: pointer; transition: background-color .15s ease; accent-color: auto; }
body.pis-cp-prof .client-notification-preference-row input[type="checkbox"]::before { display: none !important; }
body.pis-cp-prof .client-notification-preference-row input[type="checkbox"]::after { content: "" !important; position: absolute !important; top: 3px !important; left: 3px !important; width: 26px !important; height: 26px !important; border: 0 !important; border-radius: 50% !important; background: #fff !important;
    box-shadow: 0 1px 3px rgba(13,30,48,.3) !important; transform: none !important; transition: transform .15s ease; opacity: 1 !important; }
body.pis-cp-prof .client-notification-preference-row input[type="checkbox"]:checked { background: #2E9E5B !important; }
body.pis-cp-prof .client-notification-preference-row input[type="checkbox"]:checked::after { transform: translateX(20px) !important; }
body.pis-cp-prof .client-notification-preference-row input[type="checkbox"]:focus-visible { outline: 3px solid rgba(244,123,32,.45) !important; outline-offset: 2px; }
body.pis-cp-prof .client-notification-preference-row input[type="checkbox"]:disabled { opacity: .5 !important; }
.pis-cp-pf-done { position: sticky; bottom: 0; z-index: 2; margin: 10px 0 0; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--cp-line); background: #fff; }
body.pis-cp-prof .pis-cp-pf-done button { display: flex !important; align-items: center !important; justify-content: center !important; width: 100% !important; height: 52px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 15px !important;
    background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; color: #fff !important; font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; cursor: pointer; }

/* ----- Delete Account: the app's own confirmation ----- */
body.pis-cp-prof .pis-delete-modal-backdrop { background: rgba(13,30,48,.52) !important; }
body.pis-cp-prof .pis-delete-modal-card { padding: 20px 18px 18px !important; border: 0 !important; border-radius: 24px !important; background: #fff !important; box-shadow: 0 24px 60px rgba(13,30,48,.32) !important; color: var(--cp-navy) !important; font-family: var(--cp-text) !important; }
body.pis-cp-prof #delete-account-modal .pis-delete-modal-x { position: absolute !important; top: 14px !important; right: 14px !important; }
body.pis-cp-prof :is(.client-notifications-close, .pis-delete-modal-x, .pis-delete-modal-cancel):focus:not(:focus-visible) { outline: none !important; box-shadow: none !important; }
body.pis-cp-prof .pis-delete-modal-card h3 { margin: 12px 0 2px !important; color: var(--cp-navy) !important; font: 600 24px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; text-align: center !important; }
body.pis-cp-prof .pis-delete-modal-lead { margin: 0 0 12px !important; color: #C0392B !important; font: 700 15px/1.35 var(--cp-text) !important; text-align: center !important; }
body.pis-cp-prof .pis-delete-modal-list { margin: 0 0 14px !important; padding: 0 0 0 20px !important; color: #3F5368 !important; font: 500 14.500px/1.45 var(--cp-text) !important; }
body.pis-cp-prof .pis-delete-modal-list li { margin: 0 0 6px !important; }
body.pis-cp-prof .pis-delete-modal-blocked { margin: 0 0 14px !important; border-radius: 16px !important; font: 600 14.500px/1.45 var(--cp-text) !important; }
body.pis-cp-prof .pis-delete-modal-label { display: block !important; margin: 0 2px 6px !important; color: var(--cp-soft) !important; font: 700 14px/1.25 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; }
body.pis-cp-prof .pis-delete-modal-input { display: block !important; box-sizing: border-box !important; width: 100% !important; height: 52px !important; margin: 0 !important; padding: 0 14px !important; border: 1.500px solid var(--cp-line) !important; border-radius: 14px !important; background: #fff !important;
    box-shadow: none !important; color: var(--cp-navy) !important; font: 600 17px/1.3 var(--cp-text) !important; letter-spacing: 1px !important; }
body.pis-cp-prof .pis-delete-modal-input:focus { outline: none !important; border-color: #D93025 !important; box-shadow: 0 0 0 4px rgba(217,48,37,.14) !important; }
body.pis-cp-prof .pis-delete-modal-message { font: 600 14px/1.4 var(--cp-text) !important; }
body.pis-cp-prof .pis-delete-modal-actions { display: grid !important; grid-template-columns: minmax(0, 1fr) !important; gap: 10px !important; margin: 16px 0 0 !important; padding: 0 !important; }
body.pis-cp-prof .pis-delete-modal-actions > button { order: 2; display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; max-width: none !important; height: 48px !important; min-height: 48px !important; margin: 0 !important;
    padding: 0 12px !important; border: 1.500px solid var(--cp-line) !important; border-radius: 15px !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 16.500px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; white-space: nowrap; cursor: pointer; }
body.pis-cp-prof .pis-delete-modal-actions > .pis-delete-modal-final { order: 1; height: 52px !important; min-height: 52px !important; border: 0 !important; background: #D93025 !important; box-shadow: 0 6px 14px rgba(217,48,37,.26) !important; color: #fff !important; }
body.pis-cp-prof .pis-delete-modal-actions > .pis-delete-modal-final:disabled { opacity: .45 !important; box-shadow: none !important; }

/* ----- App Icon (the iPhone app): the app's own chooser, as a sheet ----- */
body.pis-cp-prof #pis-appicon-modal { align-items: flex-end !important; padding: 0 !important; background: rgba(13,30,48,.48) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-dialog { position: relative !important; box-sizing: border-box !important; width: 100% !important; max-width: none !important; max-height: calc(100dvh - 34px - env(safe-area-inset-top, 0px)) !important; margin: 0 !important;
    padding: 0 16px calc(12px + env(safe-area-inset-bottom, 0px)) !important; border: 0 !important; border-radius: 26px 26px 0 0 !important; background: #fff !important; box-shadow: 0 -10px 30px rgba(13,30,48,.24) !important; color: var(--cp-navy) !important; font-family: var(--cp-text) !important;
    overflow-y: auto !important; animation: pis-cp-sheet-up .22s ease-out; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-dialog::before { content: "" !important; display: block !important; position: absolute; top: 8px; left: 50%; width: 40px; height: 5px; margin-left: -20px; border-radius: 3px; background: #D5DFE9; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-header { display: flex !important; align-items: center !important; justify-content: flex-start !important; gap: 12px !important; margin: 0 !important; padding: 24px 0 10px !important; border: 0 !important; background: none !important; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-eyebrow { display: none !important; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-header > div { flex: 1 1 auto; min-width: 0; }
.pis-cp-pf-tile.is-pic { background: none; border-radius: 12px; overflow: hidden; } .pis-cp-pf-tile.is-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-header h3 { margin: 0 !important; color: var(--cp-navy) !important; font: 600 24px/1.15 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp-prof #pis-appicon-modal .pis-appicon-options { display: grid !important; gap: 10px !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp-prof #pis-appicon-modal .pis-appicon-option { display: flex !important; align-items: center !important; gap: 12px !important; box-sizing: border-box !important; width: 100% !important; min-height: 76px !important; margin: 0 !important; padding: 12px 14px !important; border: 1.500px solid var(--cp-line) !important;
    border-radius: 16px !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; text-align: left !important; }
body.pis-cp-prof #pis-appicon-modal .pis-appicon-option.is-selected { border-color: var(--cp-tang) !important; background: #FFF7EC !important; box-shadow: 0 0 0 3px rgba(244,123,32,.14) !important; }
body.pis-cp-prof #pis-appicon-modal .pis-appicon-option-text { flex: 1 1 auto !important; min-width: 0 !important; }
body.pis-cp-prof #pis-appicon-modal .pis-appicon-option-text strong { display: block !important; color: var(--cp-navy) !important; font: 700 16.500px/1.3 var(--cp-text) !important; }
body.pis-cp-prof #pis-appicon-modal .pis-appicon-option-text small { display: block !important; color: var(--cp-soft) !important; font: 500 14.500px/1.4 var(--cp-text) !important; }
body.pis-cp-prof #pis-appicon-modal .pis-appicon-check { flex: none !important; box-sizing: border-box !important; width: 24px !important; height: 24px !important; border: 2px solid #C3D0DC !important; border-radius: 50% !important; background: #fff center / 16px no-repeat !important; }
body.pis-cp-prof #pis-appicon-modal .pis-appicon-check::before, body.pis-cp-prof #pis-appicon-modal .pis-appicon-check::after { display: none !important; }
body.pis-cp-prof #pis-appicon-modal .pis-appicon-option.is-selected .pis-appicon-check { border-color: var(--cp-tang) !important; background-color: var(--cp-tang) !important;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.200' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 12.500 4 4 8-9'/%3E%3C/svg%3E") !important; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-note { margin: 12px 2px 0 !important; padding: 0 !important; border: 0 !important; background: none !important; color: var(--cp-soft) !important; font: 500 14px/1.4 var(--cp-text) !important; text-align: left !important; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-actions { display: grid !important; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr) !important; gap: 10px !important; margin: 16px -16px 0 !important; padding: 12px 16px 0 !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-actions > button { display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; height: 52px !important; min-height: 52px !important; margin: 0 !important; padding: 0 12px !important;
    border: 1.500px solid var(--cp-line) !important; border-radius: 15px !important; background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; white-space: nowrap; }
body.pis-cp-prof #pis-appicon-modal .client-cancellation-actions > .pis-appicon-save { border: 0 !important; background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; color: #fff !important; }

@media (min-width: 1024px) {
    body.pis-cp-prof .client-notifications-modal, body.pis-cp-prof #pis-appicon-modal { align-items: center !important; padding: 24px !important; }
    body.pis-cp-prof .client-notifications-dialog, body.pis-cp-prof #pis-appicon-modal .client-cancellation-dialog { width: min(520px, calc(100vw - 48px)) !important; max-height: calc(100vh - 80px) !important; border-radius: 24px !important; box-shadow: 0 24px 60px rgba(13,30,48,.32) !important; animation: none; }
    body.pis-cp-prof .client-notifications-dialog::before, body.pis-cp-prof #pis-appicon-modal .client-cancellation-dialog::before { display: none !important; }
    body.pis-cp-prof .client-notifications-header { padding: 20px 20px 8px !important; }
    body.pis-cp-prof .client-notifications-device-section { margin: 6px 20px 0 !important; }
    body.pis-cp-prof .client-notifications-preferences-section { padding: 16px 20px 4px !important; }
    .pis-cp-pf-done { padding: 14px 20px; }
    body.pis-cp-prof #pis-appicon-modal .client-cancellation-dialog { padding: 0 20px 14px !important; }
    body.pis-cp-prof #pis-appicon-modal .client-cancellation-header { padding-top: 20px !important; }
    body.pis-cp-prof #pis-appicon-modal .client-cancellation-actions { margin: 16px -20px 0 !important; padding: 14px 20px 0 !important; }
    body.pis-cp-prof .pis-delete-modal-card { padding: 24px 22px 20px !important; }
}
@media (prefers-reduced-motion: reduce) { body.pis-cp-prof .client-notifications-dialog, body.pis-cp-prof #pis-appicon-modal .client-cancellation-dialog { animation: none; }
    body.pis-cp-prof .client-notification-preference-row input[type="checkbox"], body.pis-cp-prof .client-notification-preference-row input[type="checkbox"]::after { transition: none; } }

/* =====================================================================
   PART 8: THE VISIT SCREEN
   ===================================================================== */
/* The colors here are the service's own (--pk, --pkb, --pkg: walk blue, drop-in teal, sit pink, boarding orange). */
body.pis-cp-visit.client-portal-page .csd-overlay { color: var(--cp-navy); font-family: var(--cp-text) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-sheet { background: #EEF4F9 !important; }
/* ----- one header: the service color, in the shape of the app's header ----- */
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header { position: relative; z-index: 2; display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 12px !important; min-height: 0 !important; margin: 0 !important;
    padding: calc(max(8px, env(safe-area-inset-top, 0px)) + 8px) 14px 16px !important; border: 0 !important; border-radius: 0 0 26px 26px !important; background: var(--pkg) !important; box-shadow: 0 8px 20px rgba(20,48,79,.2) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header::before, body.pis-cp-visit.client-portal-page .csd-overlay .csd-header::after { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header > .pis-kind-icon { flex: none !important; display: grid !important; place-items: center !important; width: 46px !important; height: 46px !important; margin: 0 !important; border: 1.500px solid rgba(255,255,255,.38) !important; border-radius: 15px !important;
    background: rgba(255,255,255,.2) !important; box-shadow: none !important; color: #fff !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header > .pis-kind-icon svg { width: 24px !important; height: 24px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header-copy { flex: 1 1 auto !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header-copy > :is(.csd-eyebrow, h2, p) { position: absolute !important; width: 1px !important; height: 1px !important; margin: -1px !important; padding: 0 !important; overflow: hidden !important; clip-path: inset(50%) !important; white-space: nowrap !important; }
.pis-cp-vhead strong { display: block; color: #fff; font: 600 21px/1.15 var(--cp-display); letter-spacing: .3px; white-space: nowrap; overflow: hidden; text-shadow: 0 2px 0 rgba(13,30,48,.3); }
.pis-cp-vhead span { display: block; margin-top: 3px; color: #fff; font: 700 13.500px/1.25 var(--cp-text); white-space: nowrap; overflow: hidden; text-shadow: 0 1.500px 0 rgba(13,30,48,.28); }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header button.csd-close { flex: none !important; position: static !important; display: grid !important; place-items: center !important; width: 44px !important; min-width: 44px !important; height: 44px !important; min-height: 44px !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-radius: 14px !important; background: rgba(255,255,255,.92) !important; box-shadow: 0 2px 6px rgba(13,30,48,.14) !important; color: var(--cp-navy) !important; transform: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header button.csd-close svg { width: 20px !important; height: 20px !important; stroke: currentColor !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header button.csd-close:focus-visible { outline: 3px solid #fff !important; outline-offset: 2px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-header button.csd-close:focus:not(:focus-visible) { outline: 0 !important; outline-offset: 0 !important; box-shadow: 0 2px 6px rgba(13,30,48,.14) !important; }
/* ----- the page under it: boxes, one level ----- */
body.pis-cp-visit.client-portal-page .csd-overlay .csd-body { padding: 16px 14px calc(22px + env(safe-area-inset-bottom, 0px)) !important; background: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-body > .upcoming-service-card { display: flex !important; flex-direction: column !important; gap: 14px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-body > .upcoming-service-card::before, body.pis-cp-visit.client-portal-page .csd-overlay .csd-body > .upcoming-service-card::after { display: none !important; }
/* what is happening, or how it went: the app's own card (tinted in the service color while it is happening, green when done) */
body.pis-cp-visit.client-portal-page .csd-overlay .pis-live { order: 1; margin: 0 !important; padding: 14px 14px 13px !important; border-radius: 20px !important; box-shadow: 0 5px 14px rgba(20,48,79,.06) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .pis-live > h6 { display: flex !important; align-items: center !important; gap: 8px !important; margin: 0 0 11px !important; padding: 0 !important; font: 600 17.500px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .pis-live-tiles { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; gap: 10px !important; margin: 0 0 10px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .pis-live-tiles > span { display: block !important; min-width: 0; margin: 0 !important; padding: 10px 8px 11px !important; border: 1px solid rgba(20,48,79,.08) !important; border-radius: 16px !important; background: #fff !important; box-shadow: none !important;
    color: var(--cp-soft) !important; font: 700 13.500px/1.2 var(--cp-text) !important; letter-spacing: 0 !important; text-align: center !important; text-transform: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .pis-live-tiles > span > strong { display: block !important; margin: 3px 0 0 !important; color: var(--cp-navy) !important; font: 600 28px/1.1 var(--cp-display) !important; letter-spacing: .3px !important; font-variant-numeric: tabular-nums; white-space: nowrap; }
body.pis-cp-visit.client-portal-page .csd-overlay .pis-live-tiles > span > strong.is-word { font-size: 23px !important; line-height: 1.34 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .pis-map-box { margin: 0 0 9px !important; border: 1px solid rgba(20,48,79,.1) !important; border-radius: 16px !important; overflow: hidden !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .pis-live-meta[data-cp-lines] > span { display: block; }
body.pis-cp-visit.client-portal-page .csd-overlay .pis-live-meta { margin: 0 2px !important; color: #3F5368 !important; font: 600 14.500px/1.4 var(--cp-text) !important; }
/* the report: a box like any other, with a band in the service's soft color (no second header) */
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-mount { order: 2; margin: 0 !important; padding: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-mount:empty { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report, .client-sit-inline, .client-boarding-inline) { margin: 0 !important; padding: 0 !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; background: #fff !important; box-shadow: 0 5px 14px rgba(20,48,79,.06) !important; overflow: hidden !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-header, .client-inline-heading) { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 9px !important; min-height: 0 !important; margin: 0 !important; padding: 12px 16px !important; border: 0 !important;
    border-bottom: 1px solid rgba(20,48,79,.08) !important; border-radius: 0 !important; background: var(--pkb) !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 17px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-header::before, body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-header::after { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-header .pis-kind-icon { flex: none !important; display: grid !important; place-items: center !important; width: 22px !important; height: 22px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; color: var(--pk) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-header .pis-kind-icon svg { width: 20px !important; height: 20px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-header > div > * { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-header > div::before { content: "Visit Report"; color: var(--cp-navy); font: 600 17px/1.2 var(--cp-display); letter-spacing: .1px; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-content { display: flex !important; flex-direction: column !important; gap: 0 !important; margin: 0 !important; padding: 0 16px 18px !important; border: 0 !important; background: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-main, .client-visit-report-side) { display: contents !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-section { order: 4; position: relative; margin: 0 !important; padding: 16px 0 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-section[data-cp-sec="notes"] { order: 1; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-section[data-cp-sec="photos"] { order: 2; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-section[data-cp-sec="care"] { order: 3; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-section[data-cp-sec] > .client-visit-report-label { position: absolute !important; width: 1px !important; height: 1px !important; margin: -1px !important; padding: 0 !important; overflow: hidden !important; clip-path: inset(50%) !important; white-space: nowrap !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-label { display: block !important; margin: 0 0 8px !important; padding: 0 !important; border: 0 !important; color: var(--cp-soft) !important; font: 700 14px/1.25 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-section[data-cp-empty] { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-content[data-cp-bare] > * > .client-visit-report-section[data-cp-sec="notes"], body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-content[data-cp-bare] > .client-visit-report-section[data-cp-sec="notes"] { display: block !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-muted { margin: 0 !important; color: var(--cp-soft) !important; font: 500 15px/1.45 var(--cp-text) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-notes, .client-boarding-note) { margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 500 16.500px/1.5 var(--cp-text) !important; display: block !important; min-height: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-photo-grid, .client-boarding-photo-grid) { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; gap: 10px !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-photo-button, .client-boarding-photo-grid > a) { display: block !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 14px !important; background: #E4EBF2 !important; box-shadow: none !important; overflow: hidden !important; aspect-ratio: 1 / 1; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-photo-grid, .client-boarding-photo-grid) > :only-child { grid-column: 1 / -1; aspect-ratio: 4 / 3; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-photo, .client-boarding-photo-grid img) { display: block !important; width: 100% !important; height: 100% !important; border: 0 !important; border-radius: 0 !important; object-fit: cover !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-pet-care-list, .client-visit-report-pet-care-card, .client-boarding-care-pet) { margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-pet-care-card + .client-visit-report-pet-care-card { margin-top: 12px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-pet-care-header { display: block !important; margin: 0 0 7px !important; padding: 0 !important; border: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-pet-care-header, .client-boarding-care-pet) > strong { display: block !important; margin: 0 0 7px !important; color: var(--cp-navy) !important; font: 700 15.500px/1.25 var(--cp-text) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-pet-care-header > span { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-care-grid { display: flex !important; flex-wrap: wrap !important; gap: 6px 12px !important; margin: 0 !important; padding: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-care-item { flex: none !important; display: inline-flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 5px !important; width: auto !important; min-height: 26px !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 14.500px/1 var(--cp-text) !important; white-space: nowrap; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-care-check { flex: none !important; display: grid !important; place-items: center !important; order: -1; width: 19px !important; height: 19px !important; margin: 0 !important; border-radius: 50% !important; background: #2E9E5B !important; color: #fff !important; font: 700 12px/1 var(--cp-text) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-mount[data-cp-none] { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-loading, .client-visit-report-error) { margin: 0 !important; padding: 15px 16px !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; background: #fff !important; box-shadow: 0 5px 14px rgba(20,48,79,.06) !important; color: var(--cp-soft) !important; font: 500 15.500px/1.45 var(--cp-text) !important; text-align: left !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-empty { display: block !important; margin: 0 !important; padding: 0 !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; background: #fff !important; box-shadow: 0 5px 14px rgba(20,48,79,.06) !important; overflow: hidden !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-empty > strong { display: flex !important; align-items: center !important; gap: 9px !important; margin: 0 !important; padding: 12px 16px !important; border-bottom: 1px solid rgba(20,48,79,.08) !important; background: var(--pkb) !important; color: var(--cp-navy) !important; font: 600 17px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-empty > p { margin: 0 !important; padding: 14px 16px 16px !important; color: var(--cp-soft) !important; font: 500 15.500px/1.45 var(--cp-text) !important; }
/* the booking itself */
body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card { order: 5; display: block !important; gap: 0 !important; margin: 0 !important; padding: 2px 16px !important; border: 1px solid var(--cp-line) !important; border-radius: 20px !important; background: #fff !important; box-shadow: 0 5px 14px rgba(20,48,79,.06) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card > * { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 12px !important; min-height: 54px !important; height: auto !important; margin: 0 !important; padding: 8px 0 !important; border: 0 !important;
    border-top: 1px solid var(--cp-line) !important; background: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card > :first-child { border-top: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card :is(.upcoming-service-pets-label, .upcoming-service-row > span) { flex: none !important; margin: 0 !important; color: var(--cp-soft) !important; font: 700 14.500px/1.25 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: capitalize !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card > :is(.service-pet-chips, p)[data-cp-label]::before { content: attr(data-cp-label); flex: none; margin-right: auto; color: var(--cp-soft); font: 700 14.500px/1.25 var(--cp-text); }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card > p[data-cp-label] { color: var(--cp-navy) !important; font: 700 16px/1.3 var(--cp-text) !important; text-align: right !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card > p:not([data-cp-label]) { display: block !important; min-height: 0 !important; padding: 13px 0 14px !important; color: var(--cp-soft) !important; font: 500 15px/1.45 var(--cp-text) !important; text-align: left !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-visit-report-pet-care-header > strong[data-cp-plain] { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card .upcoming-service-row > strong { min-width: 0; margin: 0 !important; color: var(--cp-navy) !important; font: 700 16px/1.3 var(--cp-text) !important; text-align: right !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card .upcoming-service-row[data-cp-row="payment"] > strong.is-paid { padding: 4px 11px; border-radius: 10px; background: #E7F6EE; color: #1F7A45 !important; font-size: 14px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .service-pet-chips { display: flex !important; flex-wrap: wrap !important; justify-content: flex-end !important; gap: 6px !important; margin: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .service-pet-chip { margin: 0 !important; padding: 5px 11px !important; border: 0 !important; border-radius: 11px !important; background: var(--pkb) !important; color: var(--cp-navy) !important; font: 700 14.500px/1.25 var(--cp-text) !important; }
/* sit updates as they come in: same box, same band */
body.pis-cp-visit.client-portal-page .csd-overlay .pis-cp-vicon { flex: none; display: grid; place-items: center; width: 22px; height: 22px; color: var(--pk); }
body.pis-cp-visit.client-portal-page .csd-overlay .pis-cp-vicon svg { display: block; width: 20px !important; height: 20px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-sit-inline, .client-boarding-inline) { order: 3; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-sit-inline > [data-sit-feed], .client-boarding-inline > [data-client-boarding-feed]) { margin: 0 !important; padding: 0 16px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-update { display: flex !important; flex-direction: column !important; margin: 0 !important; padding: 15px 0 16px !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-update:first-child { border-top: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-update > :is(h3, small) { display: block !important; margin: 0 0 5px !important; padding: 0 !important; border: 0 !important; color: var(--pk) !important; font: 600 16px/1.25 var(--cp-display) !important; letter-spacing: .2px !important; opacity: 1 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-update > h3[data-cp-same] { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-update > h3:not([data-cp-same]) + small { color: var(--cp-soft) !important; font: 600 13.500px/1.25 var(--cp-text) !important; letter-spacing: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-update > .client-boarding-care-pet { order: 2; margin-top: 12px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-update > .client-boarding-photo-grid { order: 1; margin-top: 12px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-update > .client-boarding-photo-grid[data-cp-empty] { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-sit-inline > [data-sit-feed-message], .client-boarding-inline > [data-client-boarding-feed-message]) { margin: 0 !important; padding: 0 16px 14px !important; border: 0 !important; background: none !important; color: var(--cp-soft) !important; font: 500 13.500px/1.4 var(--cp-text) !important; }
/* the day's walks during a stay: a part of the same box */
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk-section { margin: 0 !important; padding: 14px 16px 16px !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk-section > h3 { margin: 0 0 4px !important; padding: 0 !important; border: 0 !important; color: var(--cp-navy) !important; font: 600 16.500px/1.25 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk { display: grid !important; grid-template-columns: minmax(0, 1fr) auto !important; align-items: center !important; gap: 1px 12px !important; margin: 0 !important; padding: 10px 0 !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk:first-child { border-top: 0 !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk > strong { grid-column: 1; grid-row: 1; margin: 0 !important; color: var(--cp-navy) !important; font: 700 16px/1.3 var(--cp-text) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk > p { grid-column: 1; grid-row: 2; margin: 0 !important; color: var(--cp-soft) !important; font: 600 14px/1.3 var(--cp-text) !important; font-variant-numeric: tabular-nums; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk > button { grid-column: 2; grid-row: 1 / span 2; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk > .boarding-walk-map { grid-column: 1 / -1; grid-row: 3; margin: 10px 0 2px !important; border: 1px solid rgba(20,48,79,.1) !important; border-radius: 16px !important; overflow: hidden !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk-section > p { margin: 4px 0 0 !important; padding: 0 !important; color: var(--cp-soft) !important; font: 500 14.500px/1.4 var(--cp-text) !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk-section > p:empty { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-boarding-inline, .client-sit-inline) .secondary-button { display: inline-flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: auto !important; min-width: 0 !important; height: 40px !important; min-height: 40px !important; margin: 0 !important; padding: 0 14px !important;
    border: 0 !important; border-radius: 12px !important; background: var(--pkb) !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 15px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; white-space: nowrap; }
body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-boarding-inline, .client-sit-inline) .secondary-button[hidden] { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-inline > .secondary-button { margin: 0 16px 14px !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk-section > .secondary-button { margin: 10px 8px 0 0 !important; }
/* Cancel Service */
body.pis-cp-visit.client-portal-page .csd-overlay .csd-body > .upcoming-service-card > .upcoming-service-actions { order: 6; display: block !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay .csd-body > .upcoming-service-card > :is(.upcoming-service-card-header, .client-visit-progress-icon) { display: none !important; }
body.pis-cp-visit.client-portal-page .csd-overlay [data-client-cancel-visit] { order: 6; display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; height: 52px !important; min-height: 52px !important; margin: 0 !important; padding: 0 12px !important;
    border: 1.500px solid #F3C9C4 !important; border-radius: 16px !important; background: #fff !important; box-shadow: none !important; color: #C0392B !important; font: 600 17px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-transform: none !important; }
@media (max-width: 359px) {
    body.pis-cp-visit.client-portal-page .csd-overlay .pis-live-tiles > span > strong { font-size: 23px !important; }
    body.pis-cp-visit.client-portal-page .csd-overlay .pis-live-tiles > span > strong.is-word { font-size: 19px !important; line-height: 1.5 !important; }
    body.pis-cp-visit.client-portal-page .csd-overlay .csd-detail-card .upcoming-service-row > strong { font-size: 15px !important; }
    body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk { grid-template-columns: minmax(0, 1fr) !important; }
    body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk > button { grid-column: 1; grid-row: 3; justify-self: start; margin-top: 8px !important; }
    body.pis-cp-visit.client-portal-page .csd-overlay .client-boarding-walk > .boarding-walk-map { grid-row: 4; }
}
@media (min-width: 1024px) {
    body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-photo-grid, .client-boarding-photo-grid) { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    body.pis-cp-visit.client-portal-page .csd-overlay :is(.client-visit-report-photo-grid, .client-boarding-photo-grid) > :only-child { grid-column: span 2; }
    body.pis-cp-visit.client-portal-page .csd-overlay .csd-header { padding: 18px 20px !important; border-radius: 0 !important; }
    body.pis-cp-visit.client-portal-page .csd-overlay .csd-body { padding: 18px 20px 22px !important; }
}

/* =====================================================================
   PART 9: THE CALENDAR ON SERVICES
   ===================================================================== */
body.pis-cp-cal .upcoming-calendar .upcoming-calendar-header { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 10px !important; margin: 0 0 12px !important; padding: 0 !important; border: 0 !important; background: none !important; }
body.pis-cp-cal #upcoming-calendar-month-label { flex: 1 1 auto; min-width: 0; margin: 0 !important; color: var(--cp-navy) !important; font: 600 20.500px/1.2 var(--cp-display) !important; letter-spacing: .2px !important; text-align: center !important; }
body.pis-cp-cal .upcoming-calendar .calendar-nav-button { flex: none !important; display: grid !important; place-items: center !important; width: 42px !important; min-width: 42px !important; height: 42px !important; min-height: 42px !important; margin: 0 !important; padding: 0 0 3px !important;
    border: 0 !important; border-radius: 14px !important; background: #EEF4F9 !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 26px/1 var(--cp-text) !important; transform: none !important; }
body.pis-cp-cal .upcoming-calendar .upcoming-calendar-weekdays { margin: 0 0 4px !important; padding: 0 !important; gap: 4px !important; }
body.pis-cp-cal .upcoming-calendar .upcoming-calendar-weekdays > span { color: var(--cp-soft) !important; font: 700 13px/1.4 var(--cp-text) !important; letter-spacing: 0 !important; text-transform: none !important; text-align: center !important; }
body.pis-cp-cal #upcoming-calendar-grid { gap: 4px !important; }
/* a day: its number. Days with visits are filled blue with how many (as clients know it), finished days green, the picked day navy */
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day { position: relative !important; display: block !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; height: 50px !important; min-height: 50px !important; aspect-ratio: auto !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-radius: 14px !important; background: none !important; box-shadow: none !important; color: var(--cp-soft) !important; text-align: center !important; transform: none !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day .upcoming-day-number { display: block !important; margin: 0 !important; color: inherit !important; font: 600 17px/1.2 var(--cp-text) !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day .upcoming-service-count { position: absolute !important; top: -4px !important; right: -3px !important; display: grid !important; place-items: center !important; box-sizing: border-box !important; min-width: 20px !important; width: auto !important; height: 20px !important; margin: 0 !important; padding: 0 5px !important;
    border: 2px solid #fff !important; border-radius: 10px !important; background: #1E73BE !important; box-shadow: none !important; color: #fff !important; font: 700 11.500px/1 var(--cp-text) !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-booked { background: #D6E8FB !important; color: #1A5FAE !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-booked .upcoming-day-number { font-weight: 700 !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-completed { background: #DDF2E5 !important; color: #1F7A45 !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-completed .upcoming-service-count { background: #2E9E5B !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-today { box-shadow: inset 0 0 0 2.500px var(--cp-tang) !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-today:not(.upcoming-calendar-booked) { color: var(--cp-navy) !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-today .upcoming-day-number { font-weight: 700 !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-selected { background: var(--cp-navy) !important; box-shadow: 0 4px 10px rgba(20,48,79,.22) !important; color: #fff !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-selected .upcoming-day-number { font-weight: 700 !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day.upcoming-calendar-selected .upcoming-service-count { background: var(--cp-tang) !important; color: #fff !important; }
body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day:focus-visible { outline: 3px solid var(--cp-blue) !important; outline-offset: 2px !important; }
@media (max-width: 359px) {
    body.pis-cp-cal #upcoming-calendar-grid { gap: 4px 3px !important; }
    body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day .upcoming-day-number { font-size: 16px !important; }
    body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day .upcoming-service-count { top: -5px !important; right: -4px !important; min-width: 18px !important; height: 18px !important; padding: 0 4px !important; font-size: 10.500px !important; }
    body.pis-cp-cal #upcoming-calendar-month-label { font-size: 19px !important; }
}
@media (hover: hover) {
    body.pis-cp-cal #upcoming-calendar-grid .upcoming-calendar-day:not(.upcoming-calendar-selected):hover { background: #E3ECF4 !important; }
    body.pis-cp-cal .upcoming-calendar .calendar-nav-button:hover { background: #E3ECF4 !important; }
}
/* =====================================================================
   PART 10: THE BELL'S NOTIFICATIONS
   ===================================================================== */
body.pis-cp-bell .client-notification-panel { display: flex !important; flex-direction: column !important; box-sizing: border-box !important; max-height: min(70vh, 600px) !important; max-height: min(70dvh, 600px) !important; border: 0 !important; border-radius: 22px !important; background: #fff !important; box-shadow: 0 18px 44px rgba(13,30,48,.28) !important; color: var(--cp-navy) !important; font-family: var(--cp-text) !important; overflow: hidden !important; }
body.pis-cp-bell .client-notification-panel[hidden] { display: none !important; }
body.pis-cp-bell .client-notification-panel-header { flex: none !important; display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 12px !important; margin: 0 !important; padding: 12px 12px 12px 18px !important; border: 0 !important; border-bottom: 1px solid var(--cp-band-line) !important; border-radius: 0 !important; background: var(--cp-cream) !important; }
body.pis-cp-bell .client-notification-panel-header > div { flex: 1 1 auto !important; min-width: 0 !important; }
body.pis-cp-bell .client-notification-panel-eyebrow { display: none !important; }
body.pis-cp-bell .client-notification-panel-header h3 { margin: 0 !important; color: var(--cp-navy) !important; font: 600 23px/1.15 var(--cp-display) !important; letter-spacing: .1px !important; }
body.pis-cp-bell .pis-cp-nt-new { display: block; margin-top: 1px; color: #8A5A12; font: 600 14.5px/1.25 var(--cp-text); }
body.pis-cp-bell .pis-cp-nt-new:empty { display: none; }
body.pis-cp-bell .pis-cp-nt-close { flex: none; display: block; width: 44px; height: 44px; margin: 0; padding: 0; border: 0; border-radius: 14px; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314304F' stroke-width='2.4' stroke-linecap='round'%3E%3Cpath d='M6.5 6.5l11 11M17.5 6.5l-11 11'/%3E%3C/svg%3E") center / 20px no-repeat; box-shadow: none; font-size: 0; line-height: 0; color: transparent; cursor: pointer; }
body.pis-cp-bell .client-notification-list { flex: 1 1 auto !important; min-height: 0 !important; max-height: none !important; margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; background: #fff !important; }
body.pis-cp-bell .client-notification-item { position: relative !important; display: flex !important; align-items: flex-start !important; gap: 12px !important; box-sizing: border-box !important; width: 100% !important; margin: 0 !important; padding: 13px 10px 13px 14px !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; border-radius: 0 !important; background: #fff !important; box-shadow: none !important; text-align: left !important; transform: none !important; cursor: pointer; }
body.pis-cp-bell .client-notification-item:first-child { border-top: 0 !important; }
body.pis-cp-bell .client-notification-item::before, body.pis-cp-bell .client-notification-item::after { content: none !important; display: none !important; }
body.pis-cp-bell .client-notification-item.is-unread { background: #FFF9EE !important; }
body.pis-cp-bell .client-notification-item:focus-visible { outline: 3px solid var(--cp-blue) !important; outline-offset: -3px !important; }
body.pis-cp-bell .client-notification-item-icon { flex: none !important; display: grid !important; place-items: center !important; width: 42px !important; height: 42px !important; margin: 0 !important; border: 0 !important; border-radius: 14px !important; background: #EEF3F8 !important; box-shadow: none !important; color: var(--cp-soft) !important; font-size: 20px !important; line-height: 1 !important; }
body.pis-cp-bell .client-notification-item.is-unread .client-notification-item-icon { background: #FFE6C4 !important; color: #D9650B !important; }
body.pis-cp-bell .client-notification-item-icon > svg, body.pis-cp-bell .client-notification-empty-icon > svg { display: block; }
body.pis-cp-bell .client-notification-item-copy { flex: 1 1 auto !important; min-width: 0 !important; display: block !important; }
body.pis-cp-bell .client-notification-item-title { display: flex !important; align-items: center !important; gap: 7px !important; margin: 0 !important; color: var(--cp-navy) !important; font: 700 15.5px/1.3 var(--cp-text) !important; }
body.pis-cp-bell .client-notification-item-title > span:last-child { min-width: 0 !important; overflow-wrap: anywhere; }
body.pis-cp-bell .client-notification-unread-dot { flex: none !important; display: block !important; width: 8px !important; height: 8px !important; margin: 0 !important; border: 0 !important; border-radius: 50% !important; background: var(--cp-tang) !important; box-shadow: none !important; }
body.pis-cp-bell .client-notification-item-message { display: block !important; margin: 2px 0 0 !important; color: #3F5368 !important; font: 500 14.5px/1.4 var(--cp-text) !important; white-space: normal !important; overflow: visible !important; text-overflow: clip !important; -webkit-line-clamp: unset !important; overflow-wrap: anywhere; }
body.pis-cp-bell .client-notification-item-message:empty { display: none !important; }
body.pis-cp-bell .client-notification-item-time { display: block !important; margin: 4px 0 0 !important; color: var(--cp-soft) !important; font: 600 12.5px/1.2 var(--cp-text) !important; }
body.pis-cp-bell .client-notification-panel .client-notification-item .client-notification-dismiss { flex: 0 0 36px !important; position: static !important; display: block !important; width: 36px !important; min-width: 36px !important; max-width: 36px !important; height: 36px !important; min-height: 36px !important; margin: -4px 0 0 !important; padding: 0 !important; border: 0 !important; border-radius: 11px !important;
    background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2351677F' stroke-width='2.4' stroke-linecap='round'%3E%3Cpath d='M7 7l10 10M17 7L7 17'/%3E%3C/svg%3E") center / 17px no-repeat !important; box-shadow: none !important; color: transparent !important; font-size: 0 !important; line-height: 0 !important; opacity: 1 !important; transform: none !important; cursor: pointer; }
@media (hover: hover) { body.pis-cp-bell .client-notification-panel .client-notification-item .client-notification-dismiss:hover { background-color: #EEF3F8 !important; } }
body.pis-cp-bell .client-notification-panel-footer { flex: none !important; display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; gap: 10px !important; margin: 0 !important; padding: 12px !important; border: 0 !important; border-top: 1px solid var(--cp-line) !important; border-radius: 0 !important; background: #fff !important; }
body.pis-cp-bell .client-notification-panel.pis-cp-nt-none .client-notification-panel-footer { display: none !important; }
body.pis-cp-bell .client-notification-panel .client-notification-panel-footer > button { display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; height: 46px !important; min-height: 46px !important; margin: 0 !important; padding: 0 10px !important; border: 1.5px solid var(--cp-line) !important; border-radius: 14px !important;
    background: #fff !important; box-shadow: none !important; color: var(--cp-navy) !important; font: 600 15.5px/1 var(--cp-display) !important; letter-spacing: .2px !important; text-decoration: none !important; text-transform: capitalize !important; white-space: nowrap !important; opacity: 1 !important; transform: none !important; cursor: pointer; }
body.pis-cp-bell .client-notification-panel .client-notification-panel-footer > button:disabled { color: #9AA9B8 !important; cursor: default; }
body.pis-cp-bell .client-notification-panel :is(.client-notification-panel-footer > button, .pis-cp-nt-close, .client-notification-dismiss):active:not(:disabled) { filter: brightness(.94); }
body.pis-cp-bell .client-notification-panel :is(.client-notification-panel-footer > button, .pis-cp-nt-close, .client-notification-dismiss):focus-visible { outline: 3px solid var(--cp-blue) !important; outline-offset: 2px !important; }
body.pis-cp-bell .client-notification-empty { display: flex !important; flex-direction: column !important; align-items: center !important; margin: 0 !important; padding: 30px 20px 32px !important; border: 0 !important; background: none !important; text-align: center !important; }
body.pis-cp-bell .client-notification-empty-icon { display: grid !important; place-items: center !important; width: 58px !important; height: 58px !important; margin: 0 0 12px !important; border: 0 !important; border-radius: 20px !important; background: var(--cp-cream) !important; box-shadow: none !important; color: var(--cp-tang) !important; font-size: 26px !important; line-height: 1 !important; }
body.pis-cp-bell .client-notification-empty strong { display: block !important; margin: 0 !important; color: var(--cp-navy) !important; font: 600 21px/1.2 var(--cp-display) !important; letter-spacing: .1px !important; text-transform: capitalize !important; }
body.pis-cp-bell .client-notification-empty p { margin: 4px 0 0 !important; color: var(--cp-soft) !important; font: 500 14.5px/1.4 var(--cp-text) !important; }
@media (max-width: 700px) {
    body.pis-cp-bell.client-portal-page .client-notification-panel { left: 10px !important; right: 10px !important; width: auto !important; border-radius: 22px !important; }
}
@media (max-width: 359px) {
    body.pis-cp-bell .client-notification-panel-header h3 { font-size: 21px !important; }
    body.pis-cp-bell .client-notification-item { gap: 10px !important; padding-left: 12px !important; }
    body.pis-cp-bell .client-notification-panel .client-notification-panel-footer > button { font-size: 14.5px !important; }
}
/* =====================================================================
   PART 11: THE POP-UP BOX (Cancel This Service, Log Out, the Face ID question, the yes / no questions)
   ===================================================================== */
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) { --pop-display: var(--cp-display); --pop-text: var(--cp-text); }
/* The pop-up box: Cancel This Service, Log Out, the Face ID question and the yes / no questions. One box, so one look.
   A sheet that slides up on a phone, a box in the middle of the window on a computer. (The App Icon chooser has its own rules.) */
@keyframes pis-pop-up { from { transform: translateY(26px); opacity: .4; } to { transform: none; opacity: 1; } }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) { --pop-navy: #14304F; --pop-soft: #51677F; --pop-ink: #3F5368; --pop-line: #DCE6EF; --pop-tint: #EEF3F8; --pop-cream: #FFF3E0; --pop-cream-line: #F6DFBE; --pop-red: #D93025;
    align-items: flex-end !important; justify-content: center !important; padding: 0 !important; background: rgba(13,30,48,.48) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) > .client-cancellation-dialog { position: relative !important; display: flex !important; flex-direction: column !important; box-sizing: border-box !important; width: 100% !important; max-width: none !important; max-height: calc(100vh - 34px - env(safe-area-inset-top, 0px)) !important; max-height: calc(100dvh - 34px - env(safe-area-inset-top, 0px)) !important;
    margin: 0 !important; padding: 0 16px !important; border: 0 !important; border-radius: 26px 26px 0 0 !important; background: #fff !important; box-shadow: 0 -10px 30px rgba(13,30,48,.24) !important; color: var(--pop-navy) !important; font-family: var(--pop-text) !important; text-align: left !important; overflow-x: hidden !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch; animation: pis-pop-up .22s ease-out; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) > .client-cancellation-dialog::before { content: "" !important; display: block !important; position: absolute !important; top: 8px !important; left: 50% !important; width: 40px !important; height: 5px !important; margin: 0 0 0 -20px !important; border-radius: 3px !important; background: #D5DFE9 !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) > .client-cancellation-dialog::after { content: none !important; display: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) > .client-cancellation-dialog > * { flex: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-header { order: 0; display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 12px !important; margin: 0 !important; padding: 24px 0 12px !important; border: 0 !important; background: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-header > div { flex: 1 1 auto !important; min-width: 0 !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-eyebrow { display: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-header h3 { margin: 0 !important; color: var(--pop-navy) !important; font: 600 24px/1.15 var(--pop-display) !important; letter-spacing: .1px !important; text-transform: capitalize !important; text-wrap: balance; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-close { flex: none !important; position: static !important; display: block !important; width: 44px !important; min-width: 44px !important; height: 44px !important; min-height: 44px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 14px !important;
    background: var(--pop-tint) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314304F' stroke-width='2.4' stroke-linecap='round'%3E%3Cpath d='M6.5 6.5l11 11M17.5 6.5l-11 11'/%3E%3C/svg%3E") center / 20px no-repeat !important; box-shadow: none !important; color: transparent !important; font-size: 0 !important; line-height: 0 !important; transform: none !important; cursor: pointer; }
/* what it is about: the service being cancelled (in that service's color), or who is signed in */
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-service { order: 1; display: block !important; margin: 0 0 12px !important; padding: 14px 16px !important; border: 0 !important; border-radius: 18px !important; background: var(--pkb, var(--pop-tint)) !important; box-shadow: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-service strong { display: block !important; margin: 0 !important; color: var(--pop-navy) !important; font: 600 19px/1.25 var(--pop-display) !important; letter-spacing: .1px !important; overflow-wrap: anywhere; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-service span { display: block !important; margin: 2px 0 0 !important; color: var(--pop-ink) !important; font: 600 15px/1.4 var(--pop-text) !important; overflow-wrap: anywhere; }
/* the sums: one box, the credit on a band at the bottom of it */
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price { order: 2; display: flex !important; align-items: baseline !important; justify-content: space-between !important; gap: 12px !important; margin: 0 !important; padding: 11px 16px !important; border: 1.5px solid var(--pop-line) !important; border-top-width: 0 !important; border-radius: 0 !important; background: #fff !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) :not(.client-cancellation-price) + .client-cancellation-price { border-top-width: 1.5px !important; border-radius: 18px 18px 0 0 !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price > span { min-width: 0 !important; color: var(--pop-soft) !important; font: 600 15px/1.3 var(--pop-text) !important; letter-spacing: 0 !important; text-transform: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price > strong { flex: none !important; color: var(--pop-navy) !important; font: 700 15.5px/1.3 var(--pop-text) !important; white-space: nowrap !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price.pis-pop-total { align-items: center !important; padding: 13px 16px !important; border-color: var(--pop-cream-line) !important; border-top-width: 1.5px !important; border-radius: 0 0 18px 18px !important; background: var(--pop-cream) !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price.pis-pop-total > span { color: var(--pop-navy) !important; font: 600 18px/1.25 var(--pop-display) !important; letter-spacing: .1px !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price.pis-pop-total > strong { font: 600 22px/1.1 var(--pop-display) !important; letter-spacing: .2px !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-note { order: 3; margin: 2px 2px 0 !important; padding: 0 !important; border: 0 !important; background: none !important; color: var(--pop-ink) !important; font: 500 15px/1.45 var(--pop-text) !important; text-align: left !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price + .client-cancellation-note { margin-top: 12px !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-note[data-pis-tone="error"], body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-note[data-pis-tone="success"] { margin: 2px 0 0 !important; padding: 12px 14px !important; border-radius: 14px !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-note:empty { display: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-policy { order: 4; margin: 14px 0 0 !important; padding: 13px 16px !important; border: 0 !important; border-radius: 16px !important; background: var(--pop-tint) !important; box-shadow: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-policy strong { display: block !important; margin: 0 0 4px !important; color: var(--pop-navy) !important; font: 700 14.5px/1.3 var(--pop-text) !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-policy p { margin: 0 0 6px !important; color: var(--pop-soft) !important; font: 500 13.5px/1.45 var(--pop-text) !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-policy p:last-child { margin-bottom: 0 !important; }
/* the Face ID question asks for the password */
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .pis-faceid-password { order: 5; display: block !important; margin: 14px 0 0 !important; color: var(--pop-soft) !important; font: 700 14px/1.25 var(--pop-text) !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .pis-faceid-password > span:first-child { display: block !important; margin: 0 2px 6px !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .pis-faceid-password .pis-password-wrap { position: relative !important; display: block !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .pis-faceid-password input { display: block !important; box-sizing: border-box !important; width: 100% !important; height: 54px !important; min-height: 54px !important; margin: 0 !important; padding: 0 74px 0 16px !important; border: 1.5px solid var(--pop-line) !important; border-radius: 15px !important; background: #fff !important; box-shadow: none !important; color: var(--pop-navy) !important; font: 500 17px/1.2 var(--pop-text) !important; outline: 0 !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .pis-faceid-password input:focus { border-color: #F47B20 !important; box-shadow: 0 0 0 4px rgba(244,123,32,.16) !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .pis-faceid-password .pis-password-toggle { position: absolute !important; top: 7px !important; right: 7px !important; width: auto !important; height: 40px !important; min-height: 40px !important; margin: 0 !important; padding: 0 12px !important; border: 0 !important; border-radius: 11px !important; background: var(--pop-tint) !important; box-shadow: none !important; color: var(--pop-navy) !important; font: 600 14.5px/1 var(--pop-display) !important; letter-spacing: .2px !important; transform: none !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .pis-faceid-password small { display: block !important; min-height: 0 !important; margin: 6px 2px 0 !important; color: #C0392B !important; font: 600 14px/1.35 var(--pop-text) !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .pis-faceid-password small:empty { display: none !important; }
/* the answer: the action on top, the way out under it, both the full width, always in reach */
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions { order: 9; position: sticky !important; bottom: 0 !important; z-index: 1 !important; display: flex !important; flex-direction: column-reverse !important; align-items: stretch !important; gap: 10px !important; margin: 16px -16px 0 !important; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) !important; border: 0 !important; border-top: 1px solid var(--pop-line) !important; border-radius: 0 !important; background: #fff !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions > button { display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: 100% !important; max-width: none !important; min-width: 0 !important; height: 50px !important; min-height: 50px !important; margin: 0 !important; padding: 0 12px !important; border: 1.5px solid var(--pop-line) !important; border-radius: 15px !important;
    background: #fff !important; box-shadow: none !important; color: var(--pop-navy) !important; font: 600 17px/1 var(--pop-display) !important; letter-spacing: .2px !important; text-transform: none !important; white-space: nowrap !important; transform: none !important; opacity: 1 !important; cursor: pointer; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions > .client-cancellation-confirm { height: 54px !important; min-height: 54px !important; border: 0 !important; background: var(--pop-red) !important; box-shadow: 0 6px 14px rgba(217,48,37,.26) !important; color: #fff !important; font-size: 18px !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions > .client-cancellation-confirm.pis-faceid-yes { background: linear-gradient(135deg, #F8A534 0%, #F26B21 100%) !important; box-shadow: 0 6px 14px rgba(242,107,33,.3) !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions > .client-cancellation-confirm:disabled { opacity: .45 !important; box-shadow: none !important; cursor: default; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions > button:active:not(:disabled) { filter: brightness(.94) !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) :is(.client-cancellation-actions > button, .client-cancellation-close):focus:not(:focus-visible) { outline: 0 !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions > button:not(.client-cancellation-confirm):focus:not(:focus-visible) { box-shadow: none !important; border-color: var(--pop-line) !important; }
body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) :is(.client-cancellation-actions > button, .client-cancellation-close):focus-visible { outline: 3px solid #1E73BE !important; outline-offset: 2px !important; }
@media (min-width: 1024px) {
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) { align-items: center !important; padding: 24px !important; }
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) > .client-cancellation-dialog { width: min(480px, calc(100vw - 48px)) !important; max-height: calc(100vh - 80px) !important; padding: 0 20px !important; border-radius: 24px !important; box-shadow: 0 24px 60px rgba(13,30,48,.32) !important; }
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) > .client-cancellation-dialog::before { display: none !important; }
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-header { padding-top: 20px !important; }
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions { flex-direction: row !important; margin: 16px -20px 0 !important; padding: 14px 20px 16px !important; border-radius: 0 0 24px 24px !important; }
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions > button { flex: 1 1 0% !important; height: 52px !important; min-height: 52px !important; }
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-actions > .client-cancellation-confirm { flex: 1.3 1 0% !important; height: 52px !important; min-height: 52px !important; }
}
@media (max-width: 359px) {
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-header h3 { font-size: 22px !important; }
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price > span { font-size: 14px !important; }
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price.pis-pop-total > span { font-size: 16.5px !important; }
    body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) .client-cancellation-price.pis-pop-total > strong { font-size: 20px !important; }
}
@media (prefers-reduced-motion: reduce) { body.pis-cp .client-cancellation-modal:not(.pis-appicon-modal) > .client-cancellation-dialog { animation: none !important; } }
/* =====================================================================
   PART 12: THE PHOTO VIEWER
   ===================================================================== */
dialog.pis-cp-pv { position: fixed; inset: 0; z-index: 2147483000; box-sizing: border-box; width: 100vw; height: 100vh; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; border-radius: 0; background: #0A1624; color: #fff; font-family: var(--cp-text); overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; }
dialog.pis-cp-pv:not([open]) { display: none; }
dialog.pis-cp-pv::backdrop { background: #0A1624; }
dialog.pis-cp-pv .pis-cp-pv-stage { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 68px); right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + 92px); left: 0; display: flex; align-items: center; justify-content: center; box-sizing: border-box; padding: 0 12px; }
dialog.pis-cp-pv.is-single .pis-cp-pv-stage { bottom: calc(env(safe-area-inset-bottom, 0px) + 24px); }
dialog.pis-cp-pv .pis-cp-pv-img { display: block; width: auto; height: auto; max-width: min(1100px, 100%); max-height: 100%; object-fit: contain; border-radius: 18px; background: #101E2E; box-shadow: 0 16px 40px rgba(0,0,0,.45); opacity: 0; transition: opacity .16s ease, transform .2s ease; -webkit-user-drag: none; -webkit-touch-callout: none; }
dialog.pis-cp-pv .pis-cp-pv-img.is-ready { opacity: 1; }
dialog.pis-cp-pv .pis-cp-pv-img.is-held { transition: none; }
dialog.pis-cp-pv .pis-cp-pv-note { position: absolute; top: 50%; right: 28px; left: 28px; margin: 0; transform: translateY(-50%); color: rgba(255,255,255,.9); font: 600 15.5px/1.5 var(--cp-text); text-align: center; }
dialog.pis-cp-pv .pis-cp-pv-note[hidden] { display: none; }
dialog.pis-cp-pv .pis-cp-pv-cap { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 12px); right: 72px; left: 16px; display: flex; flex-direction: column; justify-content: center; min-height: 44px; }
dialog.pis-cp-pv .pis-cp-pv-cap strong { display: block; color: #fff; font: 600 19px/1.2 var(--cp-display); letter-spacing: .2px; white-space: nowrap; overflow: hidden; }
dialog.pis-cp-pv .pis-cp-pv-cap span { display: block; margin-top: 1px; color: rgba(255,255,255,.78); font: 600 14px/1.25 var(--cp-text); white-space: nowrap; overflow: hidden; }
dialog.pis-cp-pv .pis-cp-pv-cap :empty { display: none; }
dialog.pis-cp-pv button { -webkit-appearance: none; appearance: none; margin: 0; padding: 0; border: 0; font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
dialog.pis-cp-pv .pis-cp-pv-close { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 12px); right: 14px; z-index: 2; width: 44px; height: 44px; border-radius: 14px; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314304F' stroke-width='2.4' stroke-linecap='round'%3E%3Cpath d='M6.5 6.5l11 11M17.5 6.5l-11 11'/%3E%3C/svg%3E") center / 20px no-repeat; box-shadow: 0 4px 12px rgba(0,0,0,.3); font-size: 0; color: transparent; }
dialog.pis-cp-pv .pis-cp-pv-bar { position: absolute; right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + 20px); left: 0; display: flex; align-items: center; justify-content: center; gap: 18px; }
dialog.pis-cp-pv.is-single .pis-cp-pv-bar { display: none; }
dialog.pis-cp-pv .pis-cp-pv-count { min-width: 84px; color: #fff; font: 600 18px/1 var(--cp-display); letter-spacing: .3px; text-align: center; white-space: nowrap; }
dialog.pis-cp-pv .pis-cp-pv-nav { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 17px; background: rgba(255,255,255,.16); color: #fff; }
dialog.pis-cp-pv .pis-cp-pv-nav:disabled { opacity: .32; cursor: default; }
dialog.pis-cp-pv .pis-cp-pv-nav > svg { display: block; }
dialog.pis-cp-pv button:active:not(:disabled) { filter: brightness(.9); }
dialog.pis-cp-pv button:focus { outline: 0; }
dialog.pis-cp-pv button:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
@media (hover: hover) { dialog.pis-cp-pv .pis-cp-pv-nav:not(:disabled):hover { background: rgba(255,255,255,.26); } }
@media (min-width: 1024px) {
    dialog.pis-cp-pv .pis-cp-pv-stage { padding: 0 96px; }
    dialog.pis-cp-pv .pis-cp-pv-cap { top: 20px; left: 28px; }
    dialog.pis-cp-pv .pis-cp-pv-close { top: 20px; right: 24px; }
}
@media (prefers-reduced-motion: reduce) { dialog.pis-cp-pv .pis-cp-pv-img { transition: none; } }
/* the app's own single-photo viewer, should anything still open it: the same dark screen and white X */
body.pis-cp-pv-on .client-report-lightbox { background: #0A1624 !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
body.pis-cp-pv-on .client-report-lightbox-image { border-radius: 18px !important; }
body.pis-cp-pv-on .client-report-lightbox-close { width: 44px !important; height: 44px !important; border: 0 !important; border-radius: 14px !important; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314304F' stroke-width='2.4' stroke-linecap='round'%3E%3Cpath d='M6.5 6.5l11 11M17.5 6.5l-11 11'/%3E%3C/svg%3E") center / 20px no-repeat !important; box-shadow: 0 4px 12px rgba(0,0,0,.3) !important; color: transparent !important; font-size: 0 !important; }
`;
    document.head.appendChild(style);
    document.body.classList.add('pis-cp');

    // ---------- header pieces ----------
    const logo = document.createElement('img');
    logo.className = 'pis-cp-logo';
    logo.src = LOGO;
    logo.alt = 'Paws in Stride';
    const title = document.createElement('div');
    title.className = 'pis-cp-title';
    title.innerHTML = '<strong></strong><span></span>';
    brand.append(logo, title);
    const strong = title.firstElementChild;
    const sub = title.lastElementChild;

    // the browser's own bar (and an installed web app's status bar) takes the header's color
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#F5AB40');

    const sideLogo = document.querySelector('.client-desktop-sidebar-logo');
    if (sideLogo) sideLogo.src = LOGO;

    const book = document.getElementById('request-walk-button');
    if (book) {
        book.innerHTML = `${ICON.plus}<span>Book</span>`;
        book.setAttribute('aria-label', 'Book a Service');
    }
    const bell = header.querySelector('.client-notification-bell');
    if (bell) bell.innerHTML = ICON.bell;

    // ---------- Log Out, moved to Profile ----------
    function addLogout() {
        const section = document.getElementById('household-section');
        if (!section || section.querySelector('.pis-cp-logout')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pis-cp-logout';
        button.innerHTML = `${ICON.out}<span>Log Out</span>`;
        button.addEventListener('click', () => header.querySelector('.client-header-logout-button')?.click());
        section.appendChild(button);
    }

    // ---------- the garland hangs from the header ----------
    function hangGarland() {
        const strip = document.querySelector('.pis-bunting, .pis-lights');
        if (!strip) return;
        if (strip.parentElement !== header) header.appendChild(strip);       // computers put it above the header
        header.classList.add(strip.classList.contains('pis-bunting') ? 'pis-has-bunting' : 'pis-has-lights');
    }

    // ---------- the words in the header ----------
    const onComputer = () => window.matchMedia('(min-width: 1024px)').matches;
    function screenNow() {
        const prefix = onComputer() ? 'desktop-screen-' : 'mobile-app-screen-';
        return SCREENS.find(name => document.body.classList.contains(prefix + name)) || 'home';
    }
    function firstName() {
        let name = '';
        try { name = String((typeof currentProfile !== 'undefined' && currentProfile?.full_name) || ''); } catch (error) { name = ''; }
        if (!name) name = String(document.getElementById('welcome-name')?.textContent || '').replace(/^\s*welcome,?\s*/i, '');
        return name.trim().split(/\s+/)[0] || '';
    }
    function petNames() {
        let pets = [];
        try { pets = typeof currentPets !== 'undefined' && Array.isArray(currentPets) ? currentPets : []; } catch (error) { pets = []; }
        return pets.map(pet => String(pet?.name || '').trim()).filter(Boolean);
    }
    const listNames = names => (names.length < 2 ? names[0] || '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
    const today = () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());

    // Never cut a line off with dots: try the friendliest wording first, then shorter ones, until one fits.
    function fit(el, choices, sizes) {
        for (const text of choices) {
            for (const size of sizes) {
                el.style.fontSize = size ? `${size}px` : '';
                el.textContent = text;
                if (el.scrollWidth <= el.clientWidth + 1) return;
            }
        }
    }
    // Messages is a screen on phones and computers (in between it is still the app's panel)
    const talkPage = window.matchMedia('(max-width: 700px), (min-width: 1024px)');
    const talking = () => document.body.classList.contains('pis-cp-msgs') && document.body.classList.contains('client-messaging-open') && talkPage.matches;
    let shown = '';
    function words() {
        const screen = screenNow();
        const first = firstName();
        const pets = petNames();
        const talk = talking();
        const key = [screen, first, pets.join('|'), today(), onComputer(), header.clientWidth, document.body.classList.contains('pis-cp-booking'), talk].join('~');
        if (key === shown) return;
        shown = key;
        const big = onComputer() ? [0] : [0, 19, 17, 16];
        const small = onComputer() ? [0] : [0, 12];
        if (talk) {
            fit(strong, ['Messages'], big);
            fit(sub, ['Paws in Stride'], small);
        } else if (screen === 'home') {
            fit(strong, first ? [`Hi, ${first} 👋`, `Hi, ${first}`, first, 'Welcome'] : ['Welcome'], big);
            fit(sub, [today(), new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())], small);
        } else if (screen === 'services' && document.body.classList.contains('pis-cp-booking')) {
            fit(strong, ['Book a Service', 'Book'], big);
            fit(sub, ['Pet, Service and Dates', 'Pick Your Dates'], small);
        } else if (screen === 'services') {
            fit(strong, ['Services'], big);
            fit(sub, ['Select a Date'], small);
        } else if (screen === 'pets') {
            fit(strong, [pets.length === 1 ? 'Your Pet' : 'Your Pets'], big);
            fit(sub, pets.length ? [listNames(pets), `${pets.length} Pets`] : ['Add Your First Pet'], small);
        } else {
            fit(strong, ['Profile'], big);
            fit(sub, ['Account and Home'], small);
        }
    }

    // =====================================================================
    // PART 2: HOME
    // =====================================================================
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const lower = value => String(value || '').trim().toLowerCase();
    const PAW = '<ellipse cx="6.2" cy="10.6" rx="1.9" ry="2.5" transform="rotate(-18 6.2 10.6)"/><ellipse cx="10" cy="6.6" rx="1.9" ry="2.6" transform="rotate(-6 10 6.6)"/><ellipse cx="14.4" cy="6.6" rx="1.9" ry="2.6" transform="rotate(6 14.4 6.6)"/><ellipse cx="18.1" cy="10.6" rx="1.9" ry="2.500" transform="rotate(18 18.1 10.6)"/><path d="M12.2 11.6c-2.6 0-5 2.500-5 5 0 1.800 1.300 2.800 2.700 2.800 1 0 1.500-.5 2.300-.5s1.300.5 2.300.5c1.400 0 2.700-1 2.700-2.800 0-2.500-2.400-5-5-5z"/>';
    const solid = (body, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${body}</svg>`;
    Object.assign(ICON, {
        paw: solid(PAW), pawBig: solid(PAW, 28), pawSmall: solid(PAW, 17),
        add: svg('<path d="M12 5.500v13M5.500 12h13"/>', 22, 2.600),
        route: svg('<circle cx="6.500" cy="18" r="2.200"/><circle cx="17.500" cy="6" r="2.200"/><path d="M8.700 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.300"/>'),
        camera: svg('<path d="M4.500 8.500h3l1.400-2.200h6.200l1.400 2.200h3a1 1 0 0 1 1 1v8.500a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V9.500a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.300" r="3.200"/>'),
        clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 7.500V12l3 2"/>'),
        heart: svg('<path d="M12 20s-7.500-4.600-7.500-10A4.300 4.300 0 0 1 12 7.600 4.300 4.300 0 0 1 19.500 10c0 5.400-7.500 10-7.500 10z"/>'),
        moon: svg('<path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500z"/>'),
        chev: svg('<path d="m9.500 6 6 6-6 6"/>', 18, 2.400),
        chat: svg('<path d="M5.500 5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6.400L7.500 20.500V17h-2a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>')
    });
    const small = (icon, size) => icon.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
    const KIND_COLOR = { walk: '#1F63B8', drop: '#14B5D0', sit: '#B8336A', board: '#C0610C', meet: '#6A45C2' };

    // what the app already has in memory (all of it is loaded by portal.js)
    const app = {
        uid() { try { return (typeof currentUser !== 'undefined' && currentUser?.id) || ''; } catch (error) { return ''; } },
        pets() { try { return typeof currentPets !== 'undefined' && Array.isArray(currentPets) ? currentPets : []; } catch (error) { return []; } },
        visits() { try { return typeof currentVisits !== 'undefined' && Array.isArray(currentVisits) ? currentVisits : []; } catch (error) { return []; } },
        today() { try { if (typeof getLocalDateString === 'function') return getLocalDateString(); } catch (error) { /* below */ }
            const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
        date(text) { const [y, m, d] = String(text || '').slice(0, 10).split('-').map(Number); return new Date(y || 1970, (m || 1) - 1, d || 1); },
        petsOf(visit) { try { return typeof getPetsForVisit === 'function' ? getPetsForVisit(visit) || [] : []; } catch (error) { return []; } },
        kind(visit) { try { return typeof window.pisKind === 'function' ? window.pisKind(visit) : ''; } catch (error) { return ''; } },
        boarding(visit) { try { if (typeof isClientBoardingService === 'function') return isClientBoardingService(visit); } catch (error) { /* below */ } return /board/i.test(`${visit?.service_type || ''} ${visit?.service_name || ''}`); },
        stay(visit) { try { return typeof getClientBoardingStay === 'function' ? getClientBoardingStay(visit) : null; } catch (error) { return null; } },
        walking(visit) { try { if (typeof isWalkingServiceVisit === 'function') return isWalkingServiceVisit(visit); } catch (error) { /* below */ } return /walk/i.test(`${visit?.service_type || ''} ${visit?.service_name || ''}`); },
        done(visit) { return lower(visit?.status) === 'completed' || Boolean(visit?.completed_at); },
        meet(visit) { return /meet\s*(&|and)\s*greet/i.test(`${visit?.service_type || ''} ${visit?.service_name || ''}`.replace(/_/g, ' ')); },
        go(tab) { try { return Promise.resolve(typeof handleMobileAppTab === 'function' ? handleMobileAppTab(tab) : null); } catch (error) { return Promise.resolve(); } }
    };
    const saved = {
        get(name) { try { return JSON.parse(localStorage.getItem(name) || 'null'); } catch (error) { return null; } },
        set(name, value) { try { localStorage.setItem(name, JSON.stringify(value)); } catch (error) { /* private mode: nothing kept */ } }
    };

    const dash = document.getElementById('mobile-home-dashboard');
    const upcomingList = document.getElementById('mobile-home-upcoming-list');
    const comingBox = upcomingList?.closest('.mobile-home-section') || null;
    const latestBox = document.getElementById('mobile-home-latest-update')?.closest('.mobile-home-section') || null;
    let pack = null;
    let monthBox = null;

    // a loose heading above a list becomes the soft cream band across the top of its box
    function band(box, icon, title, linkText) {
        const head = box.querySelector('.mobile-home-section-heading');
        const h3 = head?.querySelector('h3');
        if (!head || !h3) return;
        box.classList.add('pis-cp-card');
        head.classList.add('pis-cp-band');
        head.insertAdjacentHTML('afterbegin', small(icon, 19));
        h3.textContent = title;
        const link = head.querySelector('.mobile-home-section-link');
        if (link && linkText) link.textContent = linkText;
    }

    function setUpHome() {
        if (!dash || !upcomingList || !comingBox) return false;
        document.getElementById('mobile-home-book-service-button')?.closest('.mobile-home-section')?.classList.add('pis-cp-gone');

        pack = document.createElement('div');
        pack.className = 'pis-cp-pack';
        pack.setAttribute('role', 'group');
        pack.setAttribute('aria-label', 'Your Pets');
        dash.insertAdjacentElement('afterbegin', pack);
        pack.addEventListener('click', event => {
            const button = event.target.closest('.pis-cp-pet');
            if (!button) return;
            if (button.hasAttribute('data-cp-add-pet')) {
                void app.go('pets').then(() => setTimeout(() => { readySheet('add'); document.getElementById('add-pet-button')?.click(); }, 80));
                return;
            }
            const id = button.getAttribute('data-cp-pet');
            if (petPick) { choosePet(id); void app.go('pets').then(() => window.scrollTo(0, 0)); return; }
            void app.go('pets').then(() => setTimeout(() => {
                const edit = [...document.querySelectorAll('#pet-info .edit-pet-button')].find(el => el.getAttribute('data-pet-id') === id);
                edit?.closest('.pet-profile-card')?.scrollIntoView({ block: 'start' });
            }, 80));
        });
        // a photo link that has run out: the paw stands in
        pack.addEventListener('error', event => {
            if (event.target instanceof HTMLImageElement) event.target.closest('.pis-cp-face').innerHTML = ICON.pawBig;
        }, true);

        monthBox = document.createElement('section');
        monthBox.className = 'pis-cp-card pis-cp-month';
        monthBox.hidden = true;
        comingBox.insertAdjacentElement('beforebegin', monthBox);
        dash.classList.add('pis-cp-no-month');

        comingBox.classList.add('pis-cp-coming');
        band(comingBox, ICON.clock, 'Coming Up', 'See All');
        if (latestBox) {
            latestBox.classList.add('pis-cp-latest');
            band(latestBox, ICON.camera, 'Latest Update', '');
        }

        new MutationObserver(drawHome).observe(upcomingList, { childList: true });
        if (latestBox) new MutationObserver(tidyLatest).observe(latestBox, { attributes: true, attributeFilter: ['style'], childList: true, characterData: true, subtree: true });
        return true;
    }

    // ---------- pets row ----------
    let cakesSeen = [];          // the names on today's birthday card, kept after the card is closed
    function birthdayPets() {
        if (!document.body.classList.contains('pis-birthday-day')) return [];
        const onCard = [...document.querySelectorAll('#pis-bday-card .pis-bday-photos img')].map(img => lower(img.alt)).filter(Boolean);
        if (onCard.length) cakesSeen = onCard;
        if (cakesSeen.length) return cakesSeen;
        // the card was closed earlier today: go by the birthdays on file
        let monthDay = '';
        try { monthDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date()).slice(5); } catch (error) { monthDay = app.today().slice(5); }
        return app.pets().filter(pet => String(pet?.birthday || '').slice(5, 10) === monthDay).map(pet => lower(pet.name));
    }
    let packKey = null;
    async function drawPack() {
        if (!pack) return;
        const pets = app.pets();
        const cakes = birthdayPets();
        const key = [app.uid(), ...pets.map(pet => `${pet.id}:${pet.name}:${pet.photo_path || ''}`), '~', ...cakes].join('|');
        if (key === packKey) return;
        packKey = key;
        // nothing until the pets have loaded once (so "Add Pet" never shows alone for a moment at start-up)
        const loaded = pets.length > 0 || Boolean(String(document.getElementById('pet-info')?.textContent || '').trim());
        if (!app.uid() || !loaded) { pack.innerHTML = ''; packKey = null; return; }
        const urls = await Promise.all(pets.map(async pet => {
            if (!pet.photo_path || typeof getPetDisplayUrl !== 'function') return '';
            try {
                const url = await getPetDisplayUrl(pet);
                return url && !/default-pet-avatar/.test(url) ? url : '';
            } catch (error) { return ''; }
        }));
        if (key !== packKey) return;          // the pets changed while the photos were loading
        pack.innerHTML = pets.map((pet, i) => `<button type="button" class="pis-cp-pet${cakes.includes(lower(pet.name)) ? ' is-bday' : ''}" data-cp-pet="${esc(pet.id)}" aria-label="${esc(`Open ${pet.name || 'Pet'}`)}">` +
            `<span class="pis-cp-face">${urls[i] ? `<img src="${esc(urls[i])}" alt="">` : ICON.pawBig}</span><span>${esc(pet.name || 'Pet')}</span></button>`).join('') +
            `<button type="button" class="pis-cp-pet pis-cp-pet-add" data-cp-add-pet><span class="pis-cp-face">${ICON.add}</span><span>Add Pet</span></button>`;
    }

    // ---------- "<Month> With Us" ----------
    const SAVED_MONTH = 'pis-cp-month';
    const count = (n, word) => (n === 1 ? word : `${word}s`);
    function monthTiles(s) {
        const visits = s.walks + s.others;
        if (!visits && !s.nights) return [];
        const tiles = [];
        const miles = s.miles >= 0.05 ? [ICON.route, s.miles < 100 ? s.miles.toFixed(1) : String(Math.round(s.miles)), s.miles.toFixed(1) === '1.0' ? 'Mile' : 'Miles'] : null;
        const minutes = Math.round(s.seconds / 60);
        const hours = minutes >= 60 ? [ICON.clock, (minutes / 60).toFixed(1).replace(/\.0$/, ''), minutes === 60 ? 'Hour' : 'Hours'] : minutes > 0 ? [ICON.clock, String(minutes), count(minutes, 'Minute')] : null;
        if (s.nights && !visits) {
            tiles.push([ICON.moon, String(s.nights), count(s.nights, 'Night')]);
            if (s.boardWalks) tiles.push([ICON.paw, String(s.boardWalks), count(s.boardWalks, 'Walk')]);
        } else if (!s.others && !s.nights) {
            tiles.push([ICON.paw, String(s.walks), count(s.walks, 'Walk')]);
            if (miles) tiles.push(miles);
        } else {
            const all = visits + s.nights;
            tiles.push([ICON.heart, String(all), count(all, 'Visit')]);
            if (miles) tiles.push(miles); else if (hours) tiles.push(hours);
        }
        if (s.photos) tiles.push([ICON.camera, String(s.photos), count(s.photos, 'Photo')]);
        return tiles;
    }
    function monthHtml(s) {
        const tiles = monthTiles(s);
        if (!tiles.length) return '';
        let fun = '';
        try { if (s.miles > 0 && typeof getPetMilestoneText === 'function') fun = String(getPetMilestoneText(s.miles) || '').replace(/\.$/, ''); } catch (error) { fun = ''; }
        const name = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(app.date(`${s.month}-01`));
        return `<h3>${esc(name)} With Us</h3><div class="pis-cp-tiles" style="--cp-n: ${tiles.length}">` +
            tiles.map(([icon, value, label]) => `<div><i>${icon}</i><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join('') + '</div>' +
            (fun ? `<p class="pis-cp-fun">${ICON.pawSmall}<span>${esc(fun)}</span></p>` : '');
    }
    function showMonth(html) {
        if (!monthBox) return;
        if (monthBox.dataset.cpHtml !== html) { monthBox.dataset.cpHtml = html; monthBox.innerHTML = html; }
        monthBox.hidden = !html;
        dash.classList.toggle('pis-cp-no-month', !html);
        fitFun();
    }
    // the comparison line stays on one line: smaller type on a narrow phone, and only the very narrowest lets it wrap
    function fitFun() {
        const line = monthBox?.querySelector('.pis-cp-fun span');
        const width = line ? line.clientWidth : 0;
        if (!width || line.dataset.cpWidth === String(width)) return;
        line.style.whiteSpace = '';
        fit(line, [line.textContent], [0, 13, 12.5, 12]);
        if (line.scrollWidth > line.clientWidth + 1) { line.style.fontSize = ''; line.style.whiteSpace = 'normal'; }
        line.dataset.cpWidth = String(line.clientWidth);
    }
    let monthKey = '';
    let monthAt = 0;
    async function drawMonth() {
        if (!monthBox) return;
        const uid = app.uid();
        if (!uid) { monthKey = ''; showMonth(''); return; }
        const today = app.today();
        const month = today.slice(0, 7);
        const visits = app.visits().filter(visit => String(visit.visit_date || '').startsWith(month) && lower(visit.status) !== 'cancelled');
        const care = visits.filter(visit => app.done(visit) && !app.boarding(visit) && !app.meet(visit));
        const nights = visits.filter(visit => app.boarding(visit) && String(visit.visit_date) <= today && lower(app.stay(visit)?.status) !== 'cancelled' && (app.done(visit) || app.stay(visit)?.started_at));
        const stayIds = [...new Set(nights.map(visit => app.stay(visit)?.id).filter(Boolean))];
        const key = [uid, month, care.map(visit => visit.id).join(','), nights.map(visit => visit.id).join(','), stayIds.join(',')].join('|');
        if (key === monthKey && Date.now() - monthAt < 60000) return;
        if (key !== monthKey) {
            // straight away: the card this phone or computer showed last time this month, so Home doesn't jump when the numbers arrive
            const last = saved.get(SAVED_MONTH);
            showMonth((care.length || nights.length) && last && last.uid === uid && last.month === month ? String(last.html || '') : '');
        }
        monthKey = key;
        monthAt = Date.now();
        if (!care.length && !nights.length) return;
        try {
            const ids = care.map(visit => Number(visit.id));
            const none = Promise.resolve({ data: [], error: null });
            const [walks, photos, stayWalks, stayUpdates] = await Promise.all([
                ids.length ? supabaseClient.from('visit_walks').select('id, visit_id, duration_seconds, distance_meters').in('visit_id', ids).eq('status', 'completed') : none,
                ids.length ? supabaseClient.from('visit_photos').select('id, visit_id').in('visit_id', ids).eq('photo_type', 'visit') : none,
                stayIds.length ? supabaseClient.from('visit_walks').select('id, boarding_stay_id, boarding_date, distance_meters').in('boarding_stay_id', stayIds).eq('status', 'completed') : none,
                stayIds.length ? supabaseClient.from('boarding_updates').select('id, stay_id, update_date, published_at, boarding_update_photos(storage_path)').in('stay_id', stayIds).not('published_at', 'is', null) : none
            ]);
            for (const result of [walks, photos]) if (result.error) throw result.error;
            // boarding extras are a bonus: if they can't be read, the nights still count
            if (stayWalks.error) console.warn('Home month card, boarding walks:', stayWalks.error.message || stayWalks.error);
            if (stayUpdates.error) console.warn('Home month card, boarding photos:', stayUpdates.error.message || stayUpdates.error);
            if (key !== monthKey || uid !== app.uid()) return;
            // counted the way the Pets screen counts: a walk is a finished Dog Walking visit with a recorded walk
            const walkOf = new Map((walks.data || []).map(row => [Number(row.visit_id), row]));
            const walked = care.filter(visit => app.walking(visit) && walkOf.has(Number(visit.id)));
            const others = care.filter(visit => !app.walking(visit));
            const nightWalks = (stayWalks.error ? [] : stayWalks.data || []).filter(row => String(row.boarding_date || '').startsWith(month));
            const meters = walked.reduce((sum, visit) => sum + Number(walkOf.get(Number(visit.id)).distance_meters || 0), 0) + nightWalks.reduce((sum, row) => sum + Number(row.distance_meters || 0), 0);
            const seconds = others.reduce((sum, visit) => {
                const span = (new Date(visit.completed_at).getTime() - new Date(visit.checked_in_at).getTime()) / 1000;
                return sum + (Number.isFinite(span) && span > 0 ? span : 0);
            }, 0);
            const counted = new Set([...walked, ...others].map(visit => Number(visit.id)));
            const html = monthHtml({
                month, walks: walked.length, others: others.length, nights: nights.length, boardWalks: nightWalks.length, miles: meters / 1609.344, seconds,
                photos: (photos.data || []).filter(row => counted.has(Number(row.visit_id))).length +
                    (stayUpdates.error ? [] : stayUpdates.data || []).filter(row => String(row.update_date || '').startsWith(month)).reduce((sum, row) => sum + (row.boarding_update_photos || []).length, 0)
            });
            showMonth(html);
            saved.set(SAVED_MONTH, { uid, month, key, html });
        } catch (error) {
            console.warn('Home month card:', error?.message || error);
            monthAt = 0;                       // try again on the next refresh
        }
    }

    // ---------- Coming Up: the app's own rows, redrawn ----------
    function comingVisits() {
        const today = app.today();
        return app.visits().filter(visit => visit.visit_date >= today && !['cancelled', 'completed'].includes(lower(visit.status)) && !(app.boarding(visit) && app.stay(visit)?.started_at))
            .sort((a, b) => String(a.visit_date).localeCompare(String(b.visit_date)) || (typeof compareClientVisits === 'function' ? compareClientVisits(a, b) : 0)).slice(0, 3);
    }
    function serviceParts(visit) {
        const raw = String(visit.service_name || visit.service_type || 'Service').trim().replace(/_/g, ' ');
        const match = raw.match(/^(.*?)\s+-\s+(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|hours?|hrs?)\.?$/i);
        const title = (match ? match[1] : raw).split(/\s+-\s+/)[0].replace(/\b[a-z]/g, c => c.toUpperCase());
        if (!match) return { title, length: '' };
        return { title, length: /^m/i.test(match[3]) ? `${match[2]} Min` : `${match[2]} ${Number(match[2]) === 1 ? 'Hr' : 'Hrs'}` };
    }
    function timeText(visit) {
        const raw = String(visit.time_window || '').trim();
        if (!raw) return 'Scheduled Visit';
        const match = raw.match(/^(\d{1,2}:\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}:\d{2})\s*(AM|PM)$/i);
        if (!match) return raw;
        return match[2].toUpperCase() === match[4].toUpperCase() ? `${match[1]} – ${match[3]} ${match[4].toUpperCase()}` : `${match[1]} ${match[2].toUpperCase()} – ${match[3]} ${match[4].toUpperCase()}`;
    }
    function dayTag(date) {
        const days = Math.round((date - app.date(app.today())) / 86400000);
        if (days === 0) return 'TODAY';
        return (days > 0 && days < 7 ? date.toLocaleDateString('en-US', { weekday: 'short' }) : date.toLocaleDateString('en-US', { month: 'short' })).toUpperCase();
    }
    function drawComing() {
        const rows = [...upcomingList.querySelectorAll(':scope > .mobile-home-upcoming-item')];
        const visits = comingVisits();
        rows.forEach((row, i) => {
            if (row.dataset.cp) return;
            const visit = rows.length === visits.length ? visits[i] : null;
            const before = row.textContent || '';
            row.dataset.cp = visit ? '1' : '0';
            // only redraw a row we are sure about: it must be the same visit the app drew
            if (!visit || !before.includes(String(visit.time_window || 'Scheduled visit')) || !before.includes(String(visit.service_name || visit.service_type || 'Service'))) { row.dataset.cp = '0'; return; }
            const date = app.date(visit.visit_date);
            const { title, length } = serviceParts(visit);
            const pets = app.petsOf(visit).map(pet => String(pet?.name || '').trim()).filter(Boolean);
            const names = listNames(pets) || 'Your Pet';
            const time = timeText(visit);
            row.style.setProperty('--cp-c', KIND_COLOR[app.kind(visit)] || KIND_COLOR.walk);
            row.setAttribute('aria-label', `${title}, ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${time}, ${names}`);
            row.innerHTML = `<span class="pis-cp-day"><small>${esc(dayTag(date))}</small><b>${date.getDate()}</b></span>` +
                `<span class="pis-cp-what"><b>${esc(title)}</b><span>${esc(time)}</span><span class="pis-cp-who" data-cp-full="${esc(names)}" data-cp-short="${pets.length > 1 ? `${pets.length} Pets` : ''}">${esc(names)}</span></span>` +
                (length ? `<span class="pis-cp-len">${esc(length)}</span>` : '') + ICON.chev;
        });
    }

    // a long list of pets never wraps or gets dots: if "Bella, Scout and Sir Barksalot" can't fit on the line, it says "3 Pets"
    function fitRows() {
        for (const who of upcomingList.querySelectorAll('.pis-cp-who[data-cp-short]')) {
            const width = who.clientWidth;
            if (!width || !who.dataset.cpShort || who.dataset.cpWidth === String(width)) continue;
            who.dataset.cpWidth = String(width);
            fit(who, [who.dataset.cpFull, who.dataset.cpShort], [0]);
        }
    }

    // ---------- Latest Update: hidden while it has nothing to show ----------
    function tidyLatest() {
        if (!latestBox) return;
        const empty = document.getElementById('mobile-home-latest-update-empty');
        const content = document.getElementById('mobile-home-latest-update-content');
        const nothing = Boolean(empty && content && content.style.display === 'none' && /will appear here/i.test(empty.textContent || ''));
        if (latestBox.classList.contains('pis-cp-empty') !== nothing) latestBox.classList.toggle('pis-cp-empty', nothing);
        dash.classList.toggle('pis-cp-no-latest', nothing);
    }

    let homeReady = false;
    function drawHome() {
        if (!homeReady) return;
        try { drawComing(); fitRows(); fitFun(); } catch (error) { console.warn('Home rows:', error?.message || error); }
        tidyLatest();
        void drawPack().catch(error => console.warn('Home pets row:', error?.message || error));
        void drawMonth();
    }
    try { homeReady = setUpHome(); } catch (error) { console.warn('Home new look:', error?.message || error); homeReady = false; }

    // =====================================================================
    // PART 3: SERVICES
    // =====================================================================
    ICON.cal = svg('<rect x="4" y="5.500" width="16" height="14.500" rx="2.600"/><path d="M4 10.200h16M8.500 3.500v4M15.500 3.500v4"/>');
    const dayBox = document.getElementById('selected-upcoming-day');
    const dayList = document.getElementById('selected-upcoming-services');
    const dayHead = dayBox?.querySelector(':scope > .selected-upcoming-header') || null;
    const dayDate = document.getElementById('selected-upcoming-date');
    let dayTitle = null;
    let dayCount = null;

    function setUpServices() {
        if (!dayBox || !dayList || !dayHead || !dayDate) return false;
        document.body.classList.add('pis-cp-services');
        dayHead.insertAdjacentHTML('afterbegin', small(ICON.cal, 19));
        dayTitle = document.createElement('span');
        dayTitle.className = 'pis-cp-daytitle';
        dayCount = document.createElement('span');
        dayCount.className = 'pis-cp-daycount';
        dayHead.append(dayTitle, dayCount);
        new MutationObserver(drawDay).observe(dayList, { childList: true });
        new MutationObserver(drawDay).observe(dayDate, { childList: true, characterData: true, subtree: true });
        return true;
    }

    const clockTime = value => {
        const date = new Date(value);
        return value && Number.isFinite(date.getTime()) ? date.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' }) : '';
    };
    // "Drop-In Visit - 30 min" reads "Drop-In Visit · 30 min"; "Pet Sitting - Day Sit - 4 Hours" reads "Pet Sitting · 4 hrs"
    function prettyService(raw) {
        const text = String(raw || '').trim();
        const match = text.match(/^(.*?)\s+-\s+(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|hours?|hrs?)\.?$/i);
        if (!match) return { full: text, short: '' };
        const name = match[1].split(/\s+-\s+/)[0];
        return { full: `${name} · ${match[2]} ${/^m/i.test(match[3]) ? 'min' : Number(match[2]) === 1 ? 'hr' : 'hrs'}`, short: name };
    }
    // which part of the day, by when the visit's window starts (the same split the team's schedule uses)
    function dayPart(time, visit) {
        const match = String(time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return visit && app.boarding(visit) ? 'All Day' : 'Anytime';
        const hour = Number(match[1]) % 12 + (/PM/i.test(match[3]) ? 12 : 0);
        return hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    }
    function drawDay() {
        if (!dayTitle) return;
        // the heading: the app's own date, Title Case, with the visit count beside it
        const cards = [...dayList.querySelectorAll(':scope > .csd-summary')];
        const text = String(dayDate.textContent || '').trim();
        const shown = /^select a date$/i.test(text) ? 'Select a Date' : text;
        if (dayTitle.dataset.cpFull !== shown) { dayTitle.dataset.cpFull = shown; dayTitle.dataset.cpWidth = ''; dayTitle.textContent = shown; }
        const total = cards.length ? `${cards.length} ${count(cards.length, 'Visit')}` : '';
        if (dayCount.textContent !== total) { dayCount.textContent = total; dayTitle.dataset.cpWidth = ''; }

        for (const card of cards) {
            if (card.dataset.cp) continue;
            const copy = card.querySelector(':scope > .csd-copy');
            const arrow = card.querySelector(':scope > .csd-arrow');
            if (!copy || !arrow) { card.dataset.cp = '0'; continue; }
            const id = String(card.nextElementSibling?.dataset?.csdKey || '').split(':')[0];
            const visit = (id && app.visits().find(item => String(item.id) === id)) || null;
            const lines = [...copy.querySelectorAll('small')].map(el => el.textContent.trim());
            const service = prettyService(copy.querySelector('strong')?.textContent);
            const status = String(copy.querySelector('.csd-status')?.textContent || '').trim();
            const done = card.classList.contains('csd-complete');
            const live = card.classList.contains('csd-live');
            // a finished or running visit leads with where it stands and when; a booked one leads with its time window
            const when = done ? clockTime(visit?.completed_at) : live ? clockTime(visit?.checked_in_at) : '';
            const first = done ? `Complete${when ? ` · ${when}` : ''}` : live ? `In Progress${when ? ` · ${when}` : ''}` : lines[0] || '';
            // what the top line falls back to on a very narrow phone: the word alone, or "3:00 – 5:00 PM"
            const firstShort = done ? 'Complete' : live ? 'In Progress' : timeText({ time_window: lines[0] });
            const pets = lines[1] || '';
            const names = pets.split(/,\s*/).filter(Boolean);
            const other = status && !done && !live && !/^booked$/i.test(status) ? status : '';
            card.dataset.cp = '1';
            card.dataset.cpPart = dayPart(lines[0], visit);
            const row = document.createElement('span');
            row.className = 'pis-cp-visit';
            row.innerHTML = `<span class="pis-cp-v1${done || live ? ' is-state' : ''}" data-cp-full="${esc(first)}" data-cp-short="${esc(firstShort !== first ? firstShort : '')}">${esc(first)}</span>` +
                `<span class="pis-cp-v2" data-cp-full="${esc(service.full)}" data-cp-short="${esc(service.short)}">${esc(service.full)}</span>` +
                `<span class="pis-cp-v3" data-cp-full="${esc(pets)}" data-cp-short="${names.length > 1 ? `${names.length} Pets` : ''}">${esc(pets)}</span>` +
                (other ? `<span class="pis-cp-tag">${esc(other)}</span>` : '');
            arrow.before(row);
        }

        // Morning / Afternoon / Evening, only when the day has more than one visit
        const ready = cards.filter(card => card.dataset.cp === '1');
        const runs = [];
        if (ready.length > 1 && ready.length === cards.length) {
            ready.forEach((card, i) => {
                const label = card.dataset.cpPart;
                if (i && runs[runs.length - 1].label === label) runs[runs.length - 1].n += 1;
                else runs.push({ label, card, n: 1 });
            });
        }
        const have = [...dayList.querySelectorAll(':scope > .pis-cp-part')];
        const right = have.length === runs.length && have.every((el, i) => el.dataset.cpLabel === `${runs[i].label}:${runs[i].n}` && el.nextElementSibling === runs[i].card);
        if (!right) {
            have.forEach(el => el.remove());
            for (const run of runs) {
                const el = document.createElement('div');
                el.className = 'pis-cp-part';
                el.dataset.cpLabel = `${run.label}:${run.n}`;
                el.innerHTML = `<span>${esc(run.label)}</span><em>${run.n}</em>`;
                run.card.before(el);
            }
        }
        fitDay();
    }
    // nothing on a visit card wraps or gets dots: a long service drops its length, a long list of pets says "3 Pets",
    // and a long date steps down to "Wed, Sep 23, 2026"
    function fitDay() {
        if (!dayTitle) return;
        for (const el of dayList.querySelectorAll('.pis-cp-v1[data-cp-full], .pis-cp-v2[data-cp-full], .pis-cp-v3[data-cp-full]')) {
            const width = el.clientWidth;
            if (!width || el.dataset.cpWidth === String(width)) continue;
            el.dataset.cpWidth = String(width);
            el.style.whiteSpace = '';
            fit(el, [el.dataset.cpFull, el.dataset.cpShort].filter(Boolean), el.classList.contains('pis-cp-v2') ? [0, 15, 14.5] : el.classList.contains('pis-cp-v1') ? [0, 12.5, 12] : [0, 13]);
            // last resort on the very narrowest screens: two lines rather than a cut-off one
            if (el.scrollWidth > el.clientWidth + 1) { el.style.fontSize = ''; el.textContent = el.dataset.cpFull; el.style.whiteSpace = 'normal'; }
        }
        const width = dayTitle.clientWidth;
        if (!width || dayTitle.dataset.cpWidth === String(width)) return;
        const full = dayTitle.dataset.cpFull || '';
        const choices = [full];
        const parsed = full.match(/^[A-Za-z]+, ([A-Za-z]+) (\d{1,2}), (\d{4})$/);
        const date = parsed ? new Date(`${parsed[1]} ${parsed[2]}, ${parsed[3]} 12:00:00`) : null;
        if (date && Number.isFinite(date.getTime())) {
            choices.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }), date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
        }
        fit(dayTitle, choices, [0, 16, 15]);
        dayTitle.dataset.cpWidth = String(dayTitle.clientWidth);
    }
    let servicesReady = false;
    try { servicesReady = setUpServices(); } catch (error) { console.warn('Services new look:', error?.message || error); servicesReady = false; }
    function drawServices() {
        if (!servicesReady) return;
        try { drawDay(); } catch (error) { console.warn('Services day:', error?.message || error); }
    }

    // =====================================================================
    // PART 4: BOOKING (the Request Service form)
    // =====================================================================
    ICON.calPlus = svg('<rect x="4" y="5.500" width="16" height="14.500" rx="2.600"/><path d="M4 10.200h16M8.500 3.500v4M15.500 3.500v4M12 12.800v4.400M9.800 15h4.400"/>');
    ICON.x = svg('<path d="M6.500 6.500l11 11M17.500 6.500l-11 11"/>', 20, 2.400);
    ICON.house = svg('<path d="M4 11.200 12 4.300l8 6.900"/><path d="M6.200 9.800V19a1 1 0 0 0 1 1h9.600a1 1 0 0 0 1-1V9.800"/><path d="M10 20v-5.200h4V20"/>');
    const bookingBox = document.getElementById('booking-section');
    function setUpBooking() {
        const head = bookingBox?.querySelector(':scope > .section-header');
        const h3 = head?.querySelector('h3');
        const close = document.getElementById('close-booking-button');
        if (!bookingBox || !head || !h3 || !close) return false;
        head.insertAdjacentHTML('afterbegin', small(ICON.calPlus, 19));
        h3.textContent = 'Book a Service';
        close.innerHTML = ICON.x;
        close.setAttribute('aria-label', 'Close Booking');
        const sync = () => {
            const open = bookingBox.style.display !== 'none' && getComputedStyle(bookingBox).display !== 'none';
            if (document.body.classList.contains('pis-cp-booking') === open) return;
            document.body.classList.toggle('pis-cp-booking', open);
            if (open) { try { onBookingOpen(); } catch (error) { console.warn('Booking steps:', error?.message || error); } }
            requestAnimationFrame(() => refresh());          // the header's words follow (Book a Service / Services)
        };
        // the "choose one" line at the top of each picker reads in Title Case (the app refills these lists as choices change)
        const TITLES = { 'select your pet': 'Select Your Pet', 'select a service': 'Select a Service', 'select duration': 'Select Duration', 'select a time window': 'Select a Time Window', 'select pickup time': 'Select Pickup Time' };
        let titling = false;
        const retitle = () => {
            titling = false;
            for (const option of bookingBox.querySelectorAll('select option[value=""]')) {
                const better = TITLES[lower(option.textContent)];
                if (better && option.textContent !== better) option.textContent = better;
            }
        };
        new MutationObserver(() => { if (!titling) { titling = true; requestAnimationFrame(retitle); } }).observe(bookingBox, { childList: true, subtree: true });
        retitle();
        new MutationObserver(sync).observe(bookingBox, { attributes: true, attributeFilter: ['style', 'class'] });
        new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        sync();
        return true;
    }
    // ---------- booking in three steps, with friendlier choosers standing in for three of the app's pickers ----------
    // The app's own form is untouched underneath: the same fields hold the answers, and Continue is the app's own button.
    // Each step just shows its share of them. If any of this fails, the form shows whole, as one page.
    let onBookingOpen = () => {};
    function setUpBookingSteps() {
        const form = document.getElementById('booking-form');
        const pet = document.getElementById('booking-pet');
        const type = document.getElementById('service-type');
        const option = document.getElementById('service-option');
        const countEl = document.getElementById('booking-count');
        const priceEl = document.getElementById('booking-price');
        const submit = document.getElementById('booking-submit-button');
        const boarding = document.getElementById('boarding-booking');
        const timeWrap = document.getElementById('time-window-wrapper');
        const optionWrap = document.getElementById('service-option-wrapper');
        if (!bookingBox || !form || !pet || !type || !option || !countEl || !priceEl || !submit) return;
        const appShows = el => Boolean(el) && el.style.display !== 'none' && !el.hidden;       // what the app itself has switched on (not what a step is hiding)
        const make = (tagName, className, html) => { const el = document.createElement(tagName); el.className = className; if (html) el.innerHTML = html; return el; };
        const put = (el, steps) => { if (el) el.dataset.cpIn = steps; return el; };

        put(form.querySelector('label[for="booking-pet"]'), '1'); put(pet, '1');
        put(document.getElementById('additional-pets-wrapper'), '1'); put(form.querySelector('.repeat-last-week-booking'), '1');
        put(form.querySelector('label[for="service-type"]'), '1'); put(type, '1'); put(optionWrap, '1');
        put(timeWrap, '2'); put(document.getElementById('multi-date-booking'), '2 3'); put(boarding, '2');
        put(form.querySelector('.booking-total'), '3'); put(document.getElementById('booking-price-details'), '3'); put(submit, '3');

        const steps = make('div', 'pis-cp-steps', ['Pet and Service', 'Times and Dates', 'Review'].map((name, i) => `<button type="button" data-cp-go="${i + 1}"><span>${name}</span></button>`).join(''));
        form.before(steps);
        const faces = put(make('div', 'pis-cp-bkpets'), '1');
        pet.before(faces);
        const tiles = put(make('div', 'pis-cp-bktiles'), '1');
        type.before(tiles);
        const keep = put(make('p', 'pis-cp-keepnote'), '1');
        keep.textContent = 'Changing the service starts your dates over.';
        keep.hidden = true;
        type.after(keep);
        const chips = make('div', 'pis-cp-bkchips');
        option.before(chips);
        const stay = put(make('div', 'pis-cp-stay'), '3');
        form.querySelector('.booking-total')?.before(stay);
        const sofar = put(make('div', 'pis-cp-sofar'), '2');
        const nav = make('div', 'pis-cp-stepnav', '<button type="button" class="pis-cp-next">Next</button><button type="button" class="pis-cp-back">Back</button>');
        const note = make('p', 'pis-cp-stepnote');
        note.setAttribute('role', 'alert');
        form.append(sofar, note, nav);
        const back = nav.querySelector('.pis-cp-back');
        const next = nav.querySelector('.pis-cp-next');

        const visits = () => parseInt(countEl.textContent, 10) || 0;
        const realOptions = select => [...select.options].filter(item => item.value);
        function problem(at) {
            if (at === 1) {
                if (!pet.value) return 'Choose a Pet';
                if (!type.value) return 'Choose a Service';
                if (appShows(optionWrap) && realOptions(option).length && !option.value) return `Choose a ${String(document.getElementById('service-option-label')?.textContent || 'Duration').trim()}`;
                return '';
            }
            if (at === 2 && !visits()) {
                if (appShows(boarding)) return 'Choose Your Drop-Off and Pick-Up Dates';
                if (appShows(timeWrap) && !document.getElementById('booking-time')?.value) return 'Choose a Time Window';
                return 'Pick at Least One Date';
            }
            return '';
        }
        let step = 0;
        let seen = 0;
        let fitted = '';
        // the step names and the service names always show whole: a shorter wording or a slightly smaller size before anything is cut off
        function fitWords() {
            if (!steps.clientWidth) return;
            const stay = appShows(boarding);
            const key = [steps.clientWidth, tiles.clientWidth, stay, tiles.dataset.cpKey].join('~');
            if (key === fitted) return;
            fitted = key;
            const names = [['Pet and Service', 'Pet & Service', 'Service'], stay ? ['Dates'] : ['Times and Dates', 'Times & Dates', 'Dates'], ['Review']];
            [...steps.children].forEach((button, i) => fit(button.firstElementChild, names[i], [0, 11.5, 11]));
            for (const name of tiles.querySelectorAll('b[data-cp-name]')) {
                const tile = name.closest('button');
                tile.classList.remove('is-wrap');
                fit(name, [name.dataset.cpName], [0, 14, 13.5, 13]);
                if (name.scrollWidth > name.clientWidth + 1) { name.style.fontSize = ''; tile.classList.add('is-wrap'); }
            }
        }
        const shrink = (el, sizes) => { for (const size of sizes) { el.style.fontSize = size ? `${size}px` : ''; if (el.scrollWidth <= el.clientWidth + 1) return true; } el.style.fontSize = ''; return false; };
        function fitVisits() {
            for (const item of form.querySelectorAll('.selected-date-item')) {
                if (!item.clientWidth || item.dataset.cpFit === String(item.clientWidth)) continue;
                const lines = [[item.querySelector('.selected-visit-service-line'), [0, 15, 14.5, 14]], [item.querySelector('.selected-visit-time'), [0, 13]]].filter(([el]) => el);
                const whole = () => lines.map(([el, sizes]) => shrink(el, sizes)).every(Boolean);
                item.classList.remove('is-stack', 'is-wrap');
                if (!whole()) { item.classList.add('is-stack'); if (!whole()) item.classList.add('is-wrap'); }
                item.dataset.cpFit = String(item.clientWidth);
            }
        }
        function drawStay() {
            let html = '';
            if (appShows(boarding)) {
                const day = id => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(document.getElementById(id)?.value || ''); return m ? new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(+m[1], +m[2] - 1, +m[3])) : ''; };
                const time = document.getElementById('boarding-pickup-window');
                const names = [pet.value ? pet.selectedOptions[0]?.textContent : '', ...[...form.querySelectorAll('.additional-pet-checkbox:checked')].map(box => box.nextElementSibling?.textContent)].map(name => String(name || '').trim()).filter(Boolean);
                const pets = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] || '';
                const rows = [['Drop-Off', day('boarding-dropoff')], ['Pick-Up', day('boarding-pickup')], ['Pick-Up Time', time?.value ? time.selectedOptions[0].textContent.replace(/\s+/g, ' ').trim() : ''], [names.length > 1 ? 'Pets' : 'Pet', pets]].filter(([, value]) => value);
                if (rows.length) html = `<h4>${small(ICON.moon, 18)}Dog Boarding</h4>${rows.map(([name, value]) => `<div><span>${name}</span><b>${esc(value)}</b></div>`).join('')}`;
            }
            if (stay.dataset.cpHtml !== html) { stay.dataset.cpHtml = html; stay.innerHTML = html; }
        }
        // "VIP Overnight Boarding — $75.00 per pet / night": the name on one line, the rate on the next
        function splitRate() {
            const head = document.getElementById('boarding-policy-price');
            if (!head || head.querySelector('.pis-cp-rate')) return;
            const parts = /^(.+?)\s+[—–-]\s+(\$.+)$/.exec(head.textContent.replace(/\s+/g, ' ').trim());
            if (parts) head.innerHTML = `${esc(parts[1])}<span class="pis-cp-rate">${esc(parts[2])}</span>`;
        }
        // The app's own message about one field (form-errors.js) belongs to that field's step: it shows there, and if it
        // appears while another step is showing, that step opens so the message is seen.
        const told = new WeakSet();
        function followNote() {
            for (const flag of form.querySelectorAll('.pis-field-note')) {
                if (flag.parentElement === form && !flag.dataset.cpIn) {
                    const near = [flag.previousElementSibling, flag.nextElementSibling].find(el => el?.dataset?.cpIn);
                    if (near) flag.dataset.cpIn = near.dataset.cpIn;
                }
                if (told.has(flag) || !flag.textContent.trim()) continue;
                told.add(flag);
                const at = String(flag.closest('[data-cp-in]')?.dataset.cpIn || '').split(' ').filter(Boolean).map(Number);
                if (step && at.length && !at.includes(step)) { setStep(at[0], false); flag.scrollIntoView({ block: 'center' }); return true; }
            }
            return false;
        }
        function paint() {
            if (followNote()) return;
            fitVisits();
            drawStay();
            splitRate();
            const count = visits();
            const words = String(countEl.textContent || '').trim().replace(/\b[a-z]/g, c => c.toUpperCase());
            const html = count ? `<span>${esc(words)}</span><b>${esc(priceEl.textContent.trim())}</b>` : '';
            if (sofar.dataset.cpHtml !== html) { sofar.dataset.cpHtml = html; sofar.innerHTML = html; }
            fitWords();
            keep.hidden = !(step === 1 && count > 0);
            if (note.textContent && !problem(step)) note.textContent = '';        // the thing that was missing has been chosen
            // Repeat Last Week's Booking (or a saved booking coming back) fills in the visits: go straight to the review
            if (step === 1 && seen === 0 && count > 0) { seen = count; setStep(3, true); return; }
            if (step === 3 && count === 0 && seen > 0) { seen = 0; setStep(2, true); return; }        // the last visit was removed on Review
            seen = count;
        }
        function setStep(to, jump) {
            step = Math.min(3, Math.max(1, to));
            bookingBox.dataset.cpStep = String(step);
            [...steps.children].forEach((button, i) => {
                button.classList.toggle('is-now', i + 1 === step);
                button.classList.toggle('is-done', i + 1 < step);
                if (i + 1 === step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
            });
            back.hidden = step === 1;
            next.hidden = step === 3;
            note.textContent = '';
            paint();
            if (jump) toTop();
        }
        function toTop() {
            const fixed = ['sticky', 'fixed'].includes(getComputedStyle(header).position) ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
            const by = bookingBox.getBoundingClientRect().top - fixed - 12;
            if (window.scrollY + by <= 0) window.scrollTo(0, 0); else window.scrollBy(0, by);
        }
        function go(to) {
            for (let at = step; at < to; at += 1) {
                const wrong = problem(at);
                if (wrong) { if (at !== step) setStep(at, true); note.textContent = wrong; return; }
            }
            setStep(to, true);
        }
        submit.addEventListener('click', event => {
            const wrong = [...form.elements].find(el => el.willValidate && !el.validity.valid);
            const at = Number(String(wrong?.closest('[data-cp-in]')?.dataset.cpIn || '').split(' ')[0]);
            if (!at || at === step) return;
            event.preventDefault();
            setStep(at, true);
            note.textContent = problem(at) || 'Please Finish This Step';
        }, true);
        next.addEventListener('click', () => go(step + 1));
        back.addEventListener('click', () => setStep(step - 1, true));
        steps.addEventListener('click', event => { const button = event.target.closest('[data-cp-go]'); if (button) go(Number(button.dataset.cpGo)); });

        // ----- the choosers: each sets the app's own picker, exactly as picking from the list would -----
        const choose = (select, value) => { if (select.value === value) return; select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); };
        const wire = (box, select) => box.addEventListener('click', event => { const button = event.target.closest('[data-cp-value]'); if (button) { choose(select, button.dataset.cpValue); note.textContent = ''; mark(); } });
        const mark = () => {
            for (const [box, select] of [[faces, pet], [tiles, type], [chips, option]]) for (const button of box.children) {
                const on = button.dataset.cpValue === select.value;
                button.classList.toggle('is-on', on);
                if (button.getAttribute('aria-pressed') !== String(on)) button.setAttribute('aria-pressed', String(on));
            }
        };
        const fresh = (box, select) => { const key = realOptions(select).map(item => `${item.value}=${item.textContent.trim()}`).join('|'); if (box.dataset.cpKey === key) return null; box.dataset.cpKey = key; return realOptions(select); };
        const hold = (box, select, on) => { select.classList.toggle('pis-cp-held', on); if (on) select.tabIndex = -1; else { select.removeAttribute('tabindex'); box.innerHTML = ''; } };
        async function drawFaces() {
            const options = fresh(faces, pet);
            if (!options) return;
            if (!options.length) { hold(faces, pet, false); return; }
            const key = faces.dataset.cpKey;
            const urls = await Promise.all(options.map(async item => {
                const mine = app.pets().find(one => String(one.id) === item.value);
                if (!mine?.photo_path || typeof getPetDisplayUrl !== 'function') return '';
                try { const url = await getPetDisplayUrl(mine); return url && !/default-pet-avatar/.test(url) ? url : ''; } catch (error) { return ''; }
            }));
            if (faces.dataset.cpKey !== key) return;
            faces.innerHTML = options.map((item, i) => `<button type="button" data-cp-value="${esc(item.value)}"><span class="pis-cp-face">${urls[i] ? `<img src="${esc(urls[i])}" alt="">` : ICON.pawBig}</span><span>${esc(item.textContent.trim())}</span></button>`).join('');
            hold(faces, pet, true);
            mark();
        }
        const SERVICE = [[/meet\s*(&|and)?\s*greet/i, 'meet', ICON.heart], [/board/i, 'board', ICON.moon], [/drop/i, 'drop', ICON.house], [/pet[\s_-]*sit/i, 'sit', ICON.heart], [/./, 'walk', ICON.paw]];
        function drawTiles() {
            const options = fresh(tiles, type);
            if (!options) return;
            if (!options.length) { hold(tiles, type, false); return; }
            tiles.innerHTML = options.map(item => {
                const [name, more] = item.textContent.trim().split(/\s+\/\s+/);
                const [, kind, icon] = SERVICE.find(([test]) => test.test(`${item.value} ${name}`));
                return `<button type="button" data-cp-value="${esc(item.value)}" style="--bk: ${KIND_COLOR[kind]}"><i>${icon}</i><span><b data-cp-name="${esc(name)}">${esc(name)}</b>${more ? `<small>${esc(more)}</small>` : ''}</span></button>`;
            }).join('');
            hold(tiles, type, true);
            mark();
        }
        function drawChips() {
            const options = fresh(chips, option);
            if (!options) return;
            if (!options.length) { hold(chips, option, false); return; }
            chips.innerHTML = options.map(item => {
                const [name, price] = item.textContent.trim().split(/\s+[—–-]\s+(?=\$)/);
                return `<button type="button" data-cp-value="${esc(item.value)}">${esc(name)}${price ? `<small>${esc(price)}</small>` : ''}</button>`;
            }).join('');
            hold(chips, option, true);
            mark();
        }
        wire(faces, pet); wire(tiles, type); wire(chips, option);
        faces.addEventListener('error', event => { if (event.target instanceof HTMLImageElement) event.target.closest('.pis-cp-face').innerHTML = ICON.pawBig; }, true);
        let drawing = false;
        const draw = () => { drawing = false; void drawFaces().catch(() => {}); drawTiles(); drawChips(); mark(); paint(); };
        const soon = () => { if (!drawing) { drawing = true; requestAnimationFrame(draw); } };
        new MutationObserver(soon).observe(form, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style', 'hidden'] });
        form.addEventListener('change', soon);
        window.addEventListener('resize', soon);
        setInterval(() => { if (document.body.classList.contains('pis-cp-booking')) soon(); }, 700);       // the app also fills these in by itself (Repeat Last Week, a saved booking)
        onBookingOpen = () => { seen = visits(); setStep(seen > 0 ? 3 : 1, false); soon(); };
        setStep(1, false);
        soon();
    }
    try { setUpBooking(); } catch (error) { console.warn('Booking new look:', error?.message || error); }
    try { setUpBookingSteps(); } catch (error) { console.warn('Booking steps:', error?.message || error); delete bookingBox?.dataset.cpStep; }

    // ---------- Part 5: Pets ----------
    // The app's own pet cards stay in the page and keep doing the work (Edit Pet, the photo gallery, the form that saves).
    // Each card gets the new page drawn into it, and the row of faces shows one pet at a time.
    ICON.pencil = svg('<path d="M4.500 19.500l1-4.200L16.300 4.500a1.800 1.800 0 0 1 2.600 0l.600.600a1.800 1.800 0 0 1 0 2.600L8.700 18.500z"/><path d="M14.300 6.500l3.200 3.200"/>', 18, 2.200);
    ICON.image = svg('<rect x="4" y="5" width="16" height="14" rx="2.600"/><circle cx="9.200" cy="10" r="1.600"/><path d="m5.200 17.200 4.600-4.600 3.400 3.400 2.400-2.400 3.400 3.400"/>');
    ICON.check = svg('<path d="m6.500 12.600 3.600 3.600 7.400-8"/>', 15, 3.200);
    ICON.bowl = svg('<path d="M4 11.500h16l-1.200 6.200a2.200 2.200 0 0 1-2.200 1.800H7.400a2.200 2.200 0 0 1-2.200-1.800z"/><path d="M8.200 11.500a3.800 3.800 0 0 1 7.600 0"/>');
    const petInfo = document.getElementById('pet-info');
    const petsBox = document.getElementById('pets-section');
    const petPanel = document.getElementById('pet-form-panel');
    const SAVED_PET = 'pis-cp-pet';
    const NONE = 'Not Added Yet';
    let petPick = null;
    let chosenPet = '';
    let nextSheet = '';              // which sheet the next opening of the pet form is: edit, add, feeding or care
    let readySheet = kind => { nextSheet = kind; };
    // the app's own helpers (portal.js): used when they are there, and each has a plain fallback
    const call = (name, ...args) => { try { const fn = window[name]; return typeof fn === 'function' ? fn(...args) : undefined; } catch (error) { return undefined; } };
    // the full wording of something that gets fitted, kept so a wider screen can have it back
    const whole = el => el.dataset.cpFull ?? (el.dataset.cpFull = el.textContent);
    const petIdOf = card => String(card.querySelector('.edit-pet-button')?.dataset.petId || '');
    const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`;

    function petAge(birthday, today) {
        if (!/^\d{4}-\d{2}-\d{2}/.test(String(birthday || ''))) return '';
        const [by, bm, bd] = birthday.slice(0, 10).split('-').map(Number);
        const [ty, tm, td] = today.split('-').map(Number);
        let months = (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0);
        if (months < 0) return '';
        if (months >= 12) return `${plural(Math.floor(months / 12), 'Year')} Old`;
        return months >= 1 ? `${plural(months, 'Month')} Old` : 'Under 1 Month Old';
    }
    // the next birthday: "March 14" and how many days away
    function petBirthday(birthday, today) {
        if (!/^\d{4}-\d{2}-\d{2}/.test(String(birthday || ''))) return null;
        const [, bm, bd] = birthday.slice(0, 10).split('-').map(Number);
        const [ty, tm, td] = today.split('-').map(Number);
        const on = year => { const day = bm === 2 && bd === 29 && new Date(year, 1, 29).getMonth() !== 1 ? 28 : bd; return new Date(year, bm - 1, day); };
        const now = new Date(ty, tm - 1, td);
        let next = on(ty);
        if (next < now) next = on(ty + 1);
        return { label: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date(2024, bm - 1, bd)), days: Math.round((next - now) / 86400000) };
    }

    function coverHtml(pet, photo) {
        const name = pet.name || 'Pet';
        const today = app.today();
        const age = petAge(pet.birthday, today);
        const bday = petBirthday(pet.birthday, today);
        const fact = (label, value, wide) => `<div class="pis-cp-fact${wide ? ' is-wide' : ''}"><span>${label}</span><b${value ? '' : ' class="is-none"'}>${esc(value || NONE)}</b></div>`;
        const edit = soft => `<button type="button" class="pis-cp-edit${soft ? ' is-soft' : ''}" data-cp-act="edit" aria-label="${esc(`Edit ${name}`)}">${ICON.pencil}Edit</button>`;
        const top = photo
            ? `<div class="pis-cp-coverphoto"><img src="${esc(photo)}" alt="${esc(name)}"><h2>${esc(name)}</h2>${edit(false)}</div>`
            : `<div class="pis-cp-coverempty"><span class="pis-cp-camtile">${small(ICON.camera, 26)}</span><strong>${esc(`No Photo of ${name} Yet`)}</strong><button type="button" class="pis-cp-addphoto" data-cp-act="photo">Add Photo</button></div>` +
              `<div class="pis-cp-namerow"><h2>${esc(name)}</h2>${edit(true)}</div>`;
        const away = !bday ? `<button type="button" class="pis-cp-bdayadd" data-cp-act="edit">Add</button>`
            : bday.days === 0 ? `<div class="pis-cp-away is-today"><b>Today!</b><span>Happy Birthday</span></div>`
            : `<div class="pis-cp-away"><b>${bday.days}</b><span>${bday.days === 1 ? 'Day Away' : 'Days Away'}</span></div>`;
        return `<div class="pis-cp-cover${photo ? '' : ' is-nophoto'}">${top}` +
            `<div class="pis-cp-facts">${fact('Breed', pet.breed, true)}${fact('Age', age, false)}${fact('Gender', pet.gender, false)}</div>` +
            `<div class="pis-cp-bdayband"><i aria-hidden="true">🎂</i><div><span>Birthday</span><b${bday ? '' : ' class="is-none"'}>${esc(bday ? bday.label : NONE)}</b></div>${away}</div></div>`;
    }
    function statsHtml(pet, stats) {
        if (!stats) return '';
        const name = pet.name || 'Pet';
        const miles = value => String(call('formatPetStatMiles', value) ?? (Math.round(value * 10) / 10));
        const hours = value => String(call('formatPetStatHours', value) ?? `${Math.round(value)}h`);
        const date = value => String(call('formatPetStatDate', value) || '');
        const tile = (icon, value, label) => `<div><i>${icon}</i><b>${esc(value)}</b><span>${label}</span></div>`;
        const row = (label, value, under) => `<div><span>${label}</span><b>${esc(value)}${under ? `<small>${esc(under)}</small>` : ''}</b></div>`;
        const head = what => `<div class="pis-cp-statshead"><h3 data-cp-short="${what} With Us">${esc(`${name}'s ${what} With Us`)}</h3><span>All Time</span></div>`;
        const others = Number(stats.careVisitCount || 0);
        if (Number(stats.walkCount) > 0) {
            let fun = '';
            try { fun = String(call('getPetMilestoneText', stats.miles) || '').replace(/\.$/, ''); } catch (error) { fun = ''; }
            const long = stats.longestWalk;
            return `<div class="pis-cp-petstats">${head('Walks')}<div class="pis-cp-tiles" style="--cp-n: 3">` +
                tile(ICON.paw, String(stats.walkCount), stats.walkCount === 1 ? 'Walk' : 'Walks') + tile(ICON.route, miles(stats.miles), miles(stats.miles) === '1.0' ? 'Mile' : 'Miles') + tile(ICON.clock, hours(stats.hours), 'Together') + '</div>' +
                (fun ? `<p class="pis-cp-fun">${ICON.pawSmall}<span>${esc(fun)}</span></p>` : '') +
                `<div class="pis-cp-records">${row('Walks This Month', String(stats.walksThisMonth ?? 0))}` +
                (long ? row('Longest Walk', `${miles(long.meters / 1609.344)} mi`, date(long.visitDate)) : '') +
                (others > 0 ? row('Other Visits', plural(others, 'Visit')) : '') + '</div></div>';
        }
        if (others > 0) {
            const longest = Number(stats.longestCareMinutes || 0);
            return `<div class="pis-cp-petstats">${head('Visits')}<div class="pis-cp-tiles" style="--cp-n: 3">` +
                tile(ICON.heart, String(others), others === 1 ? 'Visit' : 'Visits') + tile(ICON.clock, hours(stats.careHours), 'Together') + tile(ICON.camera, String(stats.photoCount ?? 0), stats.photoCount === 1 ? 'Photo' : 'Photos') + '</div>' +
                `<div class="pis-cp-records">${row('Visits This Month', String(stats.careVisitsThisMonth ?? 0))}` +
                (longest > 0 ? row('Longest Visit', `${longest} min`) : '') +
                (stats.lastCareVisitDate ? row('Last Visit', date(stats.lastCareVisitDate)) : '') + '</div></div>';
        }
        return '';
    }
    function rowsHtml(pet, photos) {
        const note = text => { const clean = String(text || '').replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean).join('\n'); return `<small${clean ? '' : ' class="is-none"'}>${esc(clean || NONE)}</small>`; };
        const row = (act, tile, icon, title, under, extra = '') => `<button type="button" class="pis-cp-prow" data-cp-act="${act}"><i class="${tile}">${icon}</i><span class="pis-cp-rowtext"><b>${title}</b>${under}</span>${extra}${ICON.chev}</button>`;
        const thumbs = photos.filter(photo => photo?.thumbUrl).slice(0, 3).map(photo => `<img src="${esc(photo.thumbUrl)}" alt="" loading="lazy">`).join('');
        return '<div class="pis-cp-petrows">' +
            (photos.length ? row('photos', '', ICON.camera, 'Photos', `<small>${photos.length} From Visits</small>`, thumbs ? `<span class="pis-cp-thumbs">${thumbs}</span>` : '') : '') +
            row('feeding', 'is-feed', ICON.bowl, 'Feeding Notes', note(pet.feeding_notes)) +
            row('care', 'is-care', ICON.heart, 'Care Notes', note(pet.care_notes)) + '</div>';
    }
    function drawPetCard(card, pet) {
        const shown = card.querySelector('.pet-profile-photo');
        const src = shown ? shown.getAttribute('src') || '' : '';
        const photo = pet.photo_path && src && !/default-pet-avatar/.test(src) && !card.dataset.cpNoPhoto ? src : '';
        const stats = call('getPetStats', pet.id) || null;
        const photos = call('getPetPhotos', pet.id) || [];
        const key = JSON.stringify([pet.id, pet.name, pet.breed, pet.gender, pet.birthday, pet.feeding_notes, pet.care_notes, photo, stats, photos.length, photos.slice(0, 3).map(item => item?.thumbUrl || ''), app.today()]);
        if (card.dataset.cpKey === key && card.querySelector(':scope > .pis-cp-petpage')) return;
        const side = statsHtml(pet, stats) + rowsHtml(pet, photos);
        const html = `<div class="pis-cp-petpage">${coverHtml(pet, photo)}<div class="pis-cp-petside">${side}</div></div>`;
        card.querySelector(':scope > .pis-cp-petpage')?.remove();
        card.insertAdjacentHTML('afterbegin', html);
        card.dataset.cpKey = key;
        card.dataset.cp = '1';
    }
    // nothing is ever cut off: a shorter wording or a smaller size first, and only then a second line
    function fitPets() {
        const page = petInfo.querySelector('.pet-profile-card.is-cp-on > .pis-cp-petpage');
        if (!page || !page.clientWidth || page.dataset.cpFit === String(page.clientWidth)) return;
        const big = onComputer();
        for (const name of page.querySelectorAll('.pis-cp-coverphoto h2')) fit(name, [whole(name)], big ? [0, 38, 32, 27, 23] : [0, 33, 29, 25, 22, 19]);
        for (const name of page.querySelectorAll('.pis-cp-namerow h2')) fit(name, [whole(name)], [0, 28, 25, 22, 19]);
        for (const line of page.querySelectorAll('.pis-cp-coverempty strong')) fit(line, [whole(line), 'No Photo Yet'], [0, 19, 17.5]);
        for (const value of page.querySelectorAll('.pis-cp-fact b')) {
            const box = value.parentElement;
            box.classList.remove('is-wrap');
            fit(value, [whole(value)], [0, 16, 15, 14]);
            if (value.scrollWidth > value.clientWidth + 1) { value.style.fontSize = ''; box.classList.add('is-wrap'); }
        }
        for (const head of page.querySelectorAll('.pis-cp-statshead h3')) fit(head, [whole(head), head.dataset.cpShort], big ? [0, 19, 17.5] : [0, 17.5, 16.5]);
        for (const line of page.querySelectorAll('.pis-cp-fun span')) {
            line.style.whiteSpace = '';
            fit(line, [whole(line)], [0, 13, 12.5, 12]);
            if (line.scrollWidth > line.clientWidth + 1) { line.style.fontSize = ''; line.style.whiteSpace = 'normal'; }
        }
        page.dataset.cpFit = String(page.clientWidth);
    }
    let pickKey = null;
    function drawPetPick(pets, cards, ids) {
        const cakes = birthdayPets();
        const faces = ids.map((id, i) => { const src = cards[i].querySelector('.pet-profile-photo')?.getAttribute('src') || ''; const pet = pets.find(item => String(item.id) === id); return pet?.photo_path && src && !/default-pet-avatar/.test(src) && !cards[i].dataset.cpNoPhoto ? src : ''; });
        const key = JSON.stringify([ids, ids.map(id => pets.find(item => String(item.id) === id)?.name), faces, cakes, chosenPet]);
        if (key === pickKey) return;
        pickKey = key;
        petPick.innerHTML = ids.map((id, i) => {
            const name = pets.find(item => String(item.id) === id)?.name || 'Pet';
            const on = id === chosenPet;
            return `<button type="button" role="tab" aria-selected="${on}" class="pis-cp-pet${on ? ' is-on' : ''}${cakes.includes(lower(name)) ? ' is-bday' : ''}" data-cp-pet="${esc(id)}">` +
                `<span class="pis-cp-face">${faces[i] ? `<img src="${esc(faces[i])}" alt="">` : ICON.pawBig}</span><span>${esc(name)}</span></button>`;
        }).join('') + `<button type="button" class="pis-cp-pet pis-cp-pet-add" data-cp-add-pet><span class="pis-cp-face">${ICON.add}</span><span>Add Pet</span></button>`;
    }
    function drawPets() {
        if (!petPick) return;
        try {
            const pets = app.pets();
            const cards = [...petInfo.querySelectorAll(':scope > .pet-profile-card')].filter(card => petIdOf(card) && pets.some(pet => String(pet.id) === petIdOf(card)));
            const ids = cards.map(petIdOf);
            if (!cards.length) {
                delete petInfo.dataset.cpPet;
                const title = petInfo.querySelector('.no-pets-state strong');
                if (title && title.textContent.trim() !== 'No Pets Added Yet') title.textContent = 'No Pets Added Yet';
                drawPetPick(pets, [], []);
                petPick.hidden = !app.uid() || !String(petInfo.textContent || '').trim();        // nothing until the pets have loaded once
                return;
            }
            petPick.hidden = false;
            if (!ids.includes(chosenPet)) { const kept = String(saved.get(SAVED_PET) ?? ''); chosenPet = ids.includes(kept) ? kept : ids[0]; }
            cards.forEach((card, i) => { drawPetCard(card, pets.find(pet => String(pet.id) === ids[i])); card.classList.toggle('is-cp-on', ids[i] === chosenPet); });
            if (petInfo.dataset.cpPet !== chosenPet) petInfo.dataset.cpPet = chosenPet;
            drawPetPick(pets, cards, ids);
            fitPets();
        } catch (error) {
            console.warn('Pets new look:', error?.message || error);
            delete petInfo.dataset.cpPet;                 // every card shows again, as before
        }
    }
    function choosePet(id) {
        chosenPet = String(id);
        saved.set(SAVED_PET, chosenPet);
        pickKey = null;
        drawPets();
    }
    function openPetSheet(kind, card) {
        const edit = card?.querySelector('.edit-pet-button');
        if (!edit) return;
        readySheet(kind);
        edit.click();
    }
    function setUpPets() {
        if (!petInfo || !petsBox) return false;
        petPick = document.createElement('div');
        petPick.className = 'pis-cp-pack pis-cp-petpick';
        petPick.setAttribute('role', 'tablist');
        petPick.setAttribute('aria-label', 'Your Pets');
        petPick.hidden = true;
        petsBox.insertAdjacentElement('afterbegin', petPick);
        petPick.addEventListener('click', event => {
            const button = event.target.closest('.pis-cp-pet');
            if (!button) return;
            if (button.hasAttribute('data-cp-add-pet')) { readySheet('add'); document.getElementById('add-pet-button')?.click(); return; }
            choosePet(button.getAttribute('data-cp-pet'));
        });
        petInfo.addEventListener('click', event => {
            const button = event.target.closest('[data-cp-act]');
            const card = button?.closest('.pet-profile-card');
            if (!button || !card) return;
            const act = button.dataset.cpAct;
            if (act === 'photos') card.querySelector('[data-pet-gallery-open]')?.click();
            else openPetSheet(['feeding', 'care', 'photo'].includes(act) ? act : 'edit', card);
        });
        // a photo link that has run out: the face shows the paw, and the page shows "No Photo Yet"
        petPick.addEventListener('error', event => { if (event.target instanceof HTMLImageElement) event.target.closest('.pis-cp-face').innerHTML = ICON.pawBig; }, true);
        petInfo.addEventListener('error', event => {
            const image = event.target;
            if (!(image instanceof HTMLImageElement)) return;
            if (image.closest('.pis-cp-thumbs')) { image.remove(); return; }
            const card = image.closest('.pis-cp-coverphoto')?.closest('.pet-profile-card');
            if (card) { card.dataset.cpNoPhoto = '1'; card.dataset.cpKey = ''; pickKey = null; refresh(); }
        }, true);
        document.body.classList.add('pis-cp-pets');
        return true;
    }
    try { setUpPets(); } catch (error) { console.warn('Pets new look:', error?.message || error); document.body.classList.remove('pis-cp-pets'); petPick = null; }

    // ---------- the pet form as a sheet: Edit, Add, Feeding Notes, Care Notes ----------
    // It is the app's own form and its own Save: each sheet shows the part of it that the row or button was about.
    function setUpPetSheet() {
        const form = document.getElementById('pet-form');
        const head = petPanel?.querySelector('.pet-form-header');
        const close = document.getElementById('close-pet-form-button');
        const feeding = document.getElementById('pet-feeding-notes');
        const care = document.getElementById('pet-care-notes');
        if (!petPick || !petPanel || !form || !head || !close || !feeding || !care) return false;
        const field = { feeding: feeding.closest('.pet-form-field'), care: care.closest('.pet-form-field') };
        if (!field.feeding || !field.care || field.feeding.parentElement !== form || field.care.parentElement !== form) return false;
        field.feeding.dataset.cpPart = 'feeding';
        field.care.dataset.cpPart = 'care';
        const label = { feeding: field.feeding.querySelector('label'), care: field.care.querySelector('label'), photo: petPanel.querySelector('label[for="pet-photo-input"]'), help: petPanel.querySelector('.pet-photo-help') };
        const was = { feeding: label.feeding?.textContent, care: label.care?.textContent, photo: label.photo?.textContent, help: label.help?.textContent, close: close.innerHTML };
        const first = document.querySelector('#pet-gender option[value=""]');
        if (first && /^select gender$/i.test(first.textContent.trim())) first.textContent = 'Select Gender';
        const nameBox = document.getElementById('pet-name');
        if (nameBox && /^pet.s name$/i.test(nameBox.placeholder || '')) nameBox.placeholder = 'Pet’s Name';
        const title = document.createElement('div');
        title.className = 'pis-cp-sheettitle';
        title.innerHTML = '<i></i><div><strong></strong><span></span></div>';
        head.insertAdjacentElement('afterbegin', title);
        const shade = document.createElement('div');
        shade.className = 'pis-cp-shade';
        shade.hidden = true;
        document.body.appendChild(shade);
        shade.addEventListener('click', () => close.click());
        const home = { parent: petPanel.parentNode, next: petPanel.nextSibling };
        const remove = document.getElementById('remove-pet-button');
        let open = false;
        let kind = '';
        // ----- the photo picker: a fifth part of the same sheet -----
        // Whatever is picked (a visit photo, the camera, the library) goes through the app's own photo box: the same
        // checks, the same "drag and zoom inside a circle" step, and the same Save.
        const input = document.getElementById('pet-photo-input');
        const preview = document.getElementById('pet-photo-preview');
        const save = document.getElementById('save-pet-button');
        const cancel = document.getElementById('cancel-pet-button');
        const footer = petPanel.querySelector('.pet-form-actions-right');
        const touch = (() => { try { return window.matchMedia('(pointer: coarse)').matches; } catch (error) { return false; } })();
        const picker = document.createElement('div');
        picker.className = 'pis-cp-picker';
        picker.dataset.cpPart = 'photo';
        picker.innerHTML = '<div class="pis-cp-pickhead"><strong>From Your Visits</strong><button type="button" class="pis-cp-seeall"></button></div><div class="pis-cp-pickgrid"></div>';
        form.insertAdjacentElement('afterbegin', picker);
        const acts = document.createElement('div');
        acts.className = 'pis-cp-pickacts';
        acts.innerHTML = '<p class="pis-cp-pickmsg" role="alert"></p>' + (touch
            ? `<div class="pis-cp-pickown"><button type="button" data-cp-own="camera">${small(ICON.camera, 20)}Take a Photo</button><button type="button" data-cp-own="library">${small(ICON.image, 20)}Photo Library</button></div>`
            : `<div class="pis-cp-pickown is-one"><button type="button" data-cp-own="library">${small(ICON.image, 20)}Choose a Photo</button></div>`) +
            '<button type="button" class="pis-cp-usephoto" disabled>Use This Photo</button>';
        if (footer) footer.insertAdjacentElement('afterbegin', acts);
        const grid = picker.querySelector('.pis-cp-pickgrid');
        const seeAll = picker.querySelector('.pis-cp-seeall');
        const useButton = acts.querySelector('.pis-cp-usephoto');
        const pickMsg = acts.querySelector('.pis-cp-pickmsg');
        const canPick = Boolean(input && preview && save && cancel && footer);
        let back = '';               // the sheet the picker was opened from (Edit), to go back to
        let photos = [];
        let picked = null;
        let expanded = false;
        let busy = false;
        let lastBlob = '';
        const petOnSheet = () => app.pets().find(item => String(item.id) === String(document.getElementById('pet-id')?.value || '')) || null;
        const visitPhotos = pet => (pet ? call('getPetPhotos', pet.id) || [] : []).filter(photo => photo?.storagePath);
        const shownAt = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
            for (const entry of entries) if (entry.isIntersecting) { shownAt.unobserve(entry.target); void thumb(entry.target); }
        }, { root: form, rootMargin: '240px' }) : null;
        async function thumb(tile) {
            const photo = photos[Number(tile.dataset.cpI)];
            if (!photo) return;
            try { if (!photo.thumbUrl) photo.thumbUrl = (await call('getVisitPhotoThumbUrl', photo.storagePath)) || (await call('getVisitPhotoFullUrl', photo.storagePath)) || ''; } catch (error) { /* stays grey */ }
            const img = tile.querySelector('img');
            if (img && photo.thumbUrl && tile.isConnected && photos[Number(tile.dataset.cpI)] === photo) img.src = photo.thumbUrl;
        }
        function setBusy(text) {
            busy = Boolean(text);
            useButton.textContent = text || 'Use This Photo';
            useButton.disabled = busy || !picked;
            for (const button of acts.querySelectorAll('[data-cp-own]')) button.disabled = busy;
            picker.classList.toggle('is-busy', busy);
        }
        function drawPicker() {
            photos = visitPhotos(petOnSheet());
            if (picked) picked = photos.find(photo => photo === picked) || photos.find(photo => photo.id != null && photo.id === picked.id) || null;        // the app may have loaded the list again
            picker.hidden = photos.length === 0;
            useButton.hidden = photos.length === 0;
            const cut = !expanded && photos.length > 6;
            const list = cut ? photos.slice(0, 6) : photos;
            seeAll.hidden = !cut;
            seeAll.textContent = `See All ${photos.length}`;
            grid.innerHTML = list.map((photo, i) => {
                const more = cut && i === 5;
                const day = String(call('formatPetStatDate', photo.visitDate) || '');
                return `<button type="button" class="pis-cp-picktile${more ? ' is-more' : ''}${photo === picked ? ' is-on' : ''}" data-cp-i="${i}"${more ? ` data-cp-more="+${photos.length - 5}" aria-label="${esc(`See all ${photos.length} photos`)}"` : ` aria-pressed="${photo === picked}" aria-label="${esc(day ? `Photo from ${day}` : 'Visit photo')}"`}>` +
                    `<img alt="" loading="lazy"${photo.thumbUrl ? ` src="${esc(photo.thumbUrl)}"` : ''}><span class="pis-cp-pickcheck">${ICON.check}</span></button>`;
            }).join('');
            for (const tile of grid.children) { if (photos[Number(tile.dataset.cpI)]?.thumbUrl) continue; if (shownAt) shownAt.observe(tile); else void thumb(tile); }
            setBusy(busy ? useButton.textContent : '');
        }
        // hand a photo to the app's own photo box, exactly as if it had been chosen there
        function give(file) {
            Object.defineProperty(input, 'files', { configurable: true, get: () => [file] });
            try { input.dispatchEvent(new Event('change', { bubbles: true })); } finally { delete input.files; }
        }
        async function usePicked() {
            if (!picked || busy) return;
            const photo = picked;
            pickMsg.textContent = '';
            setBusy('Getting Photo…');
            try {
                let blob = null;
                try {
                    const url = await call('getVisitPhotoFullUrl', photo.storagePath);          // the same link the gallery opens
                    if (!url) throw new Error('no link for the photo');
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`photo ${response.status}`);
                    blob = await response.blob();
                } catch (first) {
                    // a second way to the same file: the storage download the app is already signed in for
                    const got = typeof supabaseClient !== 'undefined' && typeof VISIT_MEDIA_BUCKET !== 'undefined' && typeof supabaseClient.storage?.from(VISIT_MEDIA_BUCKET)?.download === 'function'
                        ? await supabaseClient.storage.from(VISIT_MEDIA_BUCKET).download(photo.storagePath) : null;
                    if (!got || got.error || !got.data) throw first;
                    blob = got.data;
                }
                if (!blob || !blob.size) throw new Error('empty photo');
                const ending = (String(photo.storagePath).split('?')[0].split('.').pop() || '').toLowerCase();
                const type = /^image\/(jpeg|png|webp)$/.test(blob.type) ? blob.type : ending === 'png' ? 'image/png' : ending === 'webp' ? 'image/webp' : 'image/jpeg';
                if (open && kind === 'photo') give(new File([blob], `visit-photo.${type === 'image/jpeg' ? 'jpg' : type.slice(6)}`, { type }));
            } catch (error) {
                console.warn('Pet photo from a visit:', error?.message || error);
                pickMsg.textContent = 'We couldn’t open that photo. Try another one.';
            } finally {
                if (useButton.textContent === 'Getting Photo…') setBusy('');
            }
        }
        // a new photo has come back from the app's crop step
        function afterPicked() {
            pickMsg.textContent = '';
            if (back) { const to = back; back = ''; setKind(to); return; }
            setBusy('Saving Photo…');                 // opened from the page: this is the whole job, so save it (the app's own Save)
            if (typeof form.requestSubmit === 'function') form.requestSubmit(save); else save.click();
        }
        function setKind(next) {
            kind = next;
            petPanel.dataset.cpSheet = next;
            if (next === 'photo') { expanded = false; drawPicker(); }
            paint();
            form.scrollTop = 0;
        }
        function resetPicker() {
            back = ''; picked = null; expanded = false; lastBlob = ''; photos = [];
            grid.innerHTML = '';
            pickMsg.textContent = '';
            input?.removeAttribute('capture');
            if (cancel && cancel.textContent.trim() === 'Back') cancel.textContent = 'Cancel';
            setBusy('');
        }
        function paint() {
            const id = document.getElementById('pet-id')?.value || '';
            const pet = app.pets().find(item => String(item.id) === String(id));
            const name = String(document.getElementById('pet-name')?.value || pet?.name || '').trim() || 'Your Pet';
            const fromVisits = canPick && visitPhotos(pet).length > 0;
            const words = kind === 'feeding' ? ['is-feed', ICON.bowl, 'Feeding Notes', `For ${name}`] : kind === 'care' ? ['is-care', ICON.heart, 'Care Notes', `For ${name}`]
                : kind === 'photo' ? ['', small(ICON.camera, 22), `${pet?.name || name}’s Photo`, fromVisits ? 'Pick one from your visits, or add your own.' : touch ? 'Take a new one or choose one you have.' : 'Choose one from this computer.']
                : kind === 'add' ? ['', ICON.paw, 'Add a Pet', ''] : ['', ICON.paw, `Edit ${pet?.name || name}`, ''];
            const [tile, icon, strong, sub] = words;
            const html = `<i class="${tile}">${icon}</i><div><strong>${esc(strong)}</strong><span>${esc(sub)}</span></div>`;
            if (title.dataset.cpHtml !== html) { title.dataset.cpHtml = html; title.innerHTML = html; }
            const set = (el, text) => { if (el && text != null && el.textContent !== text) el.textContent = text; };
            if (label.feeding) { label.feeding.style.fontSize = ''; if (kind === 'feeding') fit(label.feeding, [`What and When ${name} Eats`, 'What and When They Eat'], [0, 13.5, 13]); else set(label.feeding, was.feeding); }
            if (label.care) { label.care.style.fontSize = ''; if (kind === 'care') fit(label.care, ['Medications, Routines and Anything We Should Know', 'Medications, Routines and Other Notes', 'Medications and Routines'], [0, 13.5, 13]); else set(label.care, was.care); }
            const preview = document.getElementById('pet-photo-preview');
            const src = preview?.getAttribute('src') || '';
            const has = /^(blob|data):/.test(src) || Boolean(pet?.photo_path && src && !/default-pet-avatar/.test(src));         // a photo just picked, or the one on file
            set(label.photo, has ? 'Change Photo' : 'Add Photo');
            set(label.help, fromVisits && kind === 'edit' ? 'From your visits, camera or library.' : 'From your camera or library.');
            if (cancel) set(cancel, kind === 'photo' && back ? 'Back' : 'Cancel');
            if (remove && pet) {
                // "Take Bella Off Your Account" under Remove Pet (the app puts the button's own words back whenever it closes the form)
                let under = remove.querySelector('.pis-cp-removesub');
                if (!under) { under = document.createElement('span'); under.className = 'pis-cp-removesub'; remove.appendChild(under); }
                fit(under, [`Take ${pet.name} Off Your Account`, 'Take Them Off Your Account'], [0, 13.5, 13]);
            }
            petPanel.setAttribute('aria-label', strong);
            fit(title.querySelector('strong'), [strong], [0, 22, 20, 18]);
            if (kind === 'photo' && sub) fit(title.querySelector('span'), fromVisits ? [sub, 'From your visits, or add your own.', 'Pick one or add your own.'] : [sub, 'Take one or choose one you have.', 'Take or choose a photo.'], [0, 14, 13.5]);
        }
        function sync() {
            const showing = petPanel.style.display !== 'none';
            if (showing === open) { if (open) paint(); return; }
            open = showing;
            if (open) {
                kind = nextSheet || (document.getElementById('pet-id')?.value ? 'edit' : 'add');
                nextSheet = '';
                if (petPanel.parentNode !== document.body) document.body.appendChild(petPanel);       // above the header and the bottom menu
                if (kind === 'photo' && !canPick) kind = 'edit';
                petPanel.dataset.cpSheet = kind;
                if (kind === 'photo') { back = ''; lastBlob = preview.getAttribute('src') || ''; drawPicker(); }
                petPanel.setAttribute('role', 'dialog');
                petPanel.setAttribute('aria-modal', 'true');
                close.innerHTML = ICON.x;
                shade.hidden = false;
                document.body.classList.add('pis-cp-sheet-open');
                paint();
                form.scrollTop = 0;
                const box = kind === 'feeding' ? feeding : kind === 'care' ? care : null;
                if (box) { try { box.focus({ preventScroll: true }); box.setSelectionRange(box.value.length, box.value.length); } catch (error) { /* not focusable right now */ } }
            } else {
                delete petPanel.dataset.cpSheet;
                delete petPanel.dataset.cpReady;
                petPanel.removeAttribute('role');
                petPanel.removeAttribute('aria-modal');
                petPanel.removeAttribute('aria-label');
                close.innerHTML = was.close;
                if (label.feeding) { label.feeding.textContent = was.feeding; label.feeding.style.fontSize = ''; }
                if (label.care) { label.care.textContent = was.care; label.care.style.fontSize = ''; }
                if (label.photo) label.photo.textContent = was.photo;
                if (label.help) label.help.textContent = was.help;
                try { home.parent.insertBefore(petPanel, home.next && home.next.parentNode === home.parent ? home.next : null); } catch (error) { /* stays where it is */ }
                shade.hidden = true;
                document.body.classList.remove('pis-cp-sheet-open');
                kind = '';
                nextSheet = '';
                resetPicker();
            }
        }
        readySheet = next => {
            nextSheet = next;
            if (open) return;
            petPanel.dataset.cpReady = '1';
            if (petPanel.parentNode !== document.body) document.body.appendChild(petPanel);
        };
        new MutationObserver(sync).observe(petPanel, { attributes: true, attributeFilter: ['style'] });
        // a phone browser's keyboard covers the bottom of the page without making the page shorter: the sheet rides above it
        const view = window.visualViewport;
        if (view) {
            const lift = () => {
                const under = Math.max(0, Math.round(window.innerHeight - view.height - view.offsetTop));
                const value = under > 60 ? `${under}px` : '';
                if (document.documentElement.style.getPropertyValue('--cp-kb') !== value) { if (value) document.documentElement.style.setProperty('--cp-kb', value); else document.documentElement.style.removeProperty('--cp-kb'); }
            };
            view.addEventListener('resize', lift);
            view.addEventListener('scroll', lift);
        }
        if (canPick) {
            // Change Photo in Edit opens the picker when this pet has photos from visits (otherwise it opens the camera-or-library chooser, as before)
            label.photo?.addEventListener('click', event => {
                if (!open || kind !== 'edit' || visitPhotos(petOnSheet()).length === 0) return;
                event.preventDefault();
                back = 'edit';
                lastBlob = preview.getAttribute('src') || '';
                setKind('photo');
            });
            // opened from Edit, the picker's Back (and the x, the dimmed page, Escape) goes back to Edit with nothing lost
            petPanel.addEventListener('click', event => {
                if (!open || kind !== 'photo' || !back || !event.target.closest('#cancel-pet-button, #close-pet-form-button')) return;
                event.preventDefault();
                event.stopPropagation();
                const to = back;
                back = '';
                pickMsg.textContent = '';
                setKind(to);
            }, true);
            grid.addEventListener('click', event => {
                const tile = event.target.closest('.pis-cp-picktile');
                if (!tile || busy) return;
                if (tile.classList.contains('is-more')) { expanded = true; drawPicker(); return; }
                picked = photos[Number(tile.dataset.cpI)] || null;
                pickMsg.textContent = '';
                for (const other of grid.children) { const on = other === tile; other.classList.toggle('is-on', on); if (other.hasAttribute('aria-pressed')) other.setAttribute('aria-pressed', String(on)); }
                setBusy('');
            });
            seeAll.addEventListener('click', () => { expanded = true; drawPicker(); });
            useButton.addEventListener('click', () => void usePicked());
            acts.addEventListener('click', event => {
                const own = event.target.closest('[data-cp-own]');
                if (!own || busy) return;
                pickMsg.textContent = '';
                if (own.dataset.cpOwn === 'camera') input.setAttribute('capture', 'environment'); else input.removeAttribute('capture');
                input.value = '';
                input.click();
            });
            // what the app says about a photo it will not take ("Please choose a JPG, PNG, or WebP image.") shows above the buttons
            // (its own note would land on the hidden photo box and outline the whole sheet, so the words are moved here and its marks cleared)
            const heard = () => {
                if (!open || kind !== 'photo') return;
                const note = petPanel.querySelector('.pis-field-note');
                const text = (note?.textContent || document.getElementById('pet-form-message')?.textContent || '').trim();
                if (!text) return;
                if (pickMsg.textContent !== text) pickMsg.textContent = text;
                if (note) {
                    try { window.PisFormErrors?.clear?.(input); } catch (error) { /* cleared by hand below */ }
                    if (note.isConnected) note.remove();
                    for (const marked of petPanel.querySelectorAll('.pis-field-invalid')) marked.classList.remove('pis-field-invalid');
                    form.classList.remove('pis-field-invalid');
                }
            };
            new MutationObserver(heard).observe(petPanel, { childList: true, subtree: true, characterData: true });
            // the app's Save finished without closing the sheet (it could not save): the buttons come back
            new MutationObserver(() => { if (open && kind === 'photo' && !save.disabled && useButton.textContent === 'Saving Photo…') setBusy(''); }).observe(save, { attributes: true, attributeFilter: ['disabled'] });
        }
        preview?.addEventListener('load', () => {
            if (!open) return;
            const src = preview.getAttribute('src') || '';
            const fresh = /^blob:/.test(src) && src !== lastBlob;
            if (fresh) lastBlob = src;
            if (fresh && kind === 'photo' && canPick) afterPicked(); else paint();
        });
        document.addEventListener('keydown', event => { if (open && event.key === 'Escape' && !document.querySelector('dialog[open], .remove-pet-modal, .pet-gallery')) close.click(); });
        sync();
        return true;
    }
    try { setUpPetSheet(); } catch (error) { console.warn('Pet sheets:', error?.message || error); nextSheet = ''; }

    // =====================================================================
    // PART 6: MESSAGES
    // =====================================================================
    // The app's own conversation panel, shown as a screen: under the header and above the tabs on a phone,
    // beside the left menu on a computer. Opening it, sending, the unread count and marking as read are the app's.
    let placeTalk = () => {};
    let drawTalk = () => {};
    function setUpMessages() {
        const drawer = document.getElementById('client-message-drawer');
        const list = document.getElementById('client-message-list');
        const form = document.getElementById('client-message-form');
        const input = document.getElementById('client-message-input');
        const send = document.getElementById('client-message-send');
        if (!drawer || !list || !form || !input || !send) return;

        input.placeholder = 'Message Paws in Stride';
        input.setAttribute('aria-label', 'Message Paws in Stride');

        // ----- where the panel sits: under the header, above the tabs, beside the left menu -----
        const tabs = document.getElementById('client-bottom-navigation');
        const side = document.getElementById('client-desktop-sidebar');
        const put = (name, value) => { if (drawer.style.getPropertyValue(name) !== value) drawer.style.setProperty(name, value); };
        placeTalk = () => {
            const top = Math.round(header.getBoundingClientRect().height);
            if (top > 0) put('--cp-msg-top', `${top + (header.matches('.pis-has-bunting, .pis-has-lights') ? 30 : 0)}px`);       // room for the garland
            const low = tabs ? Math.round(tabs.getBoundingClientRect().height) : 0;
            if (low > 0) put('--cp-msg-bottom', `${low}px`);
            const left = side ? Math.round(side.getBoundingClientRect().right) : 0;
            if (left > 0) put('--cp-msg-left', `${left}px`);
        };
        if (window.ResizeObserver) {
            const sized = new ResizeObserver(() => placeTalk());
            for (const el of [header, tabs, side]) if (el) sized.observe(el);
        }

        // ----- the conversation: a day label where the day changes, and just the time under each message -----
        const mine = () => { try { return typeof clientMessages !== 'undefined' && Array.isArray(clientMessages) ? clientMessages : []; } catch (error) { return []; } };
        const dayOf = date => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        const midnight = date => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        function dayLabel(date) {
            const now = new Date();
            const ago = Math.round((midnight(now) - midnight(date)) / 86400000);
            if (ago === 0) return 'Today';
            if (ago === 1) return 'Yesterday';
            if (date.getFullYear() === now.getFullYear()) return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(date);
            return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
        }
        const watch = new MutationObserver(() => drawTalk());
        drawTalk = () => {
            const today = dayOf(new Date());
            const rows = [...list.querySelectorAll('.client-message-row')];
            const none = list.querySelector('.client-message-empty');
            if (rows.every(row => row.dataset.cpDay === today) && (!none || none.dataset.cpDone)) return;       // nothing new, and still the same day
            const fresh = rows.every(row => !row.dataset.cpDay);                                               // the app has just drawn the list (it scrolls to the end itself)
            const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
            watch.disconnect();
            try {
                if (none && !none.dataset.cpDone) {
                    none.dataset.cpDone = '1';
                    none.innerHTML = `<i class="pis-cp-msgnone" aria-hidden="true">${small(ICON.chat, 28)}</i><strong>No Messages Yet</strong><span>Send us a message anytime you have a question or something we should know.</span>`;
                }
                list.querySelectorAll('.pis-cp-msgday').forEach(el => el.remove());
                const byId = new Map(mine().map(message => [String(message.id), message]));
                let day = '';
                let before = null;
                for (const row of rows) {
                    row.dataset.cpDay = today;
                    const message = byId.get(String(row.dataset.messageId));
                    const at = message?.created_at ? new Date(message.created_at) : null;
                    if (!at || Number.isNaN(at.getTime())) { before = null; row.classList.remove('is-cp-next'); continue; }      // left as the app drew it
                    if (dayOf(at) !== day) {
                        day = dayOf(at);
                        before = null;
                        const label = document.createElement('div');
                        label.className = 'pis-cp-msgday';
                        label.textContent = dayLabel(at);
                        row.before(label);
                    }
                    const time = row.querySelector('.client-message-time');
                    const clock = at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                    if (time && time.textContent !== clock) time.textContent = clock;
                    // the same person again within five minutes: no need to say who a second time
                    const who = `${message.sender_id}|${message.sender_name || ''}`;
                    row.classList.toggle('is-cp-next', Boolean(before && before.who === who && at - before.at >= 0 && at - before.at < 300000));
                    before = { who, at };
                }
                if (!fresh && atEnd) list.scrollTop = list.scrollHeight;
            } catch (error) {
                console.warn('Messages new look:', error?.message || error);
            } finally {
                watch.observe(list, { childList: true });
            }
        };
        watch.observe(list, { childList: true });

        // ----- phones: the keyboard -----
        // Opening the tab shows the conversation; the keyboard waits until the box is tapped.
        const touch = window.matchMedia('(pointer: coarse)');
        let wasOpen = drawer.classList.contains('is-open');
        new MutationObserver(() => {
            const open = drawer.classList.contains('is-open');
            if (open && !wasOpen && touch.matches) {
                input.focus = () => {};                                            // the app puts the cursor in the box a moment after opening
                window.setTimeout(() => { delete input.focus; }, 450);
            }
            wasOpen = open;
            document.querySelector('.pis-cp-nav-messages')?.setAttribute('aria-current', open && talkPage.matches ? 'page' : 'false');
        }).observe(drawer, { attributes: true, attributeFilter: ['class'] });
        // While the keyboard is up (the box has the cursor and the screen got a good deal shorter) the tabs step aside.
        const view = window.visualViewport;
        if (view) {
            let full = 0;
            let wide = 0;
            const keys = () => {
                const width = Math.round(view.width);
                if (width !== wide) { wide = width; full = 0; }                    // turned on its side: start measuring again
                if (!(view.scale > 1.01)) full = Math.max(full, view.height);
                const up = document.activeElement === input && full - view.height > 150;
                document.body.classList.toggle('pis-cp-keys', up);
                // a keyboard that covers the page without making it shorter (iPhone): the box rides just above it
                put('--cp-msg-kb', `${up ? Math.max(0, Math.round(window.innerHeight - view.height - view.offsetTop)) : 0}px`);
            };
            view.addEventListener('resize', keys);
            view.addEventListener('scroll', keys);
            input.addEventListener('focus', keys);
            input.addEventListener('blur', keys);
            keys();
        }
        // Send keeps the cursor in the box (so the keyboard stays up and nothing jumps under the finger)
        send.addEventListener('mousedown', event => { if (document.activeElement === input) event.preventDefault(); });

        // ----- it is a screen now, so Esc does not put it away (the app closes its panel on Esc: it comes straight back) -----
        let held = false;
        document.addEventListener('keydown', event => { held = event.key === 'Escape' && talking(); }, true);
        window.addEventListener('keydown', event => {
            if (!held) return;
            held = false;
            if (event.key === 'Escape' && talkPage.matches && !drawer.classList.contains('is-open')) call('openClientMessaging');
        });
        // Book leaves Messages for the booking form
        document.getElementById('request-walk-button')?.addEventListener('click', () => { if (talking()) call('closeClientMessaging'); }, true);

        document.body.classList.add('pis-cp-msgs');
        placeTalk();
        drawTalk();
    }
    try { setUpMessages(); } catch (error) { console.warn('Messages new look:', error?.message || error); document.body.classList.remove('pis-cp-msgs', 'pis-cp-keys'); placeTalk = () => {}; drawTalk = () => {}; }

    // =====================================================================
    // PART 7: PROFILE
    // =====================================================================
    // The page is drawn from what the app has loaded. Every row opens something of the app's own: its edit form
    // (one part at a time, as a sheet), its password form, its notification settings, its Delete Account pop-up.
    let drawProfile = () => {};
    function setUpProfile() {
        const section = document.getElementById('household-section');
        const cards = document.getElementById('household-profile');
        const panel = document.getElementById('household-form-panel');
        const form = document.getElementById('household-form');
        const head = panel?.querySelector('.household-form-header');
        const close = document.getElementById('close-household-form-button');
        const editButton = document.getElementById('edit-household-button');
        const save = document.getElementById('save-household-button');
        const cancel = document.getElementById('cancel-household-button');
        const contact = document.getElementById('household-preferred-contact');
        if (!section || !cards || !panel || !form || !head || !close || !editButton || !save || !cancel || !contact) return;
        // which sheet each box of the app's form belongs to
        const PART = { 'household-full-name': 'profile', 'household-phone': 'profile', 'household-email': 'profile',
            'household-street-address': 'address', 'household-address-line-2': 'address', 'household-city': 'address', 'household-state': 'address', 'household-zip': 'address',
            'household-preferred-contact': 'contact', 'emergency-contact-name': 'emergency', 'emergency-contact-phone': 'emergency',
            'access-gate-code': 'access', 'access-door-code': 'access', 'access-key-instructions': 'access', 'access-alarm-instructions': 'access', 'access-parking-instructions': 'access', 'access-other-notes': 'access',
            'household-home-notes': 'notes' };
        const HALF = ['household-state', 'household-zip', 'access-gate-code', 'access-door-code'];
        const boxes = Object.keys(PART).map(id => document.getElementById(id));
        if (boxes.some(box => !box || !box.closest('.household-form-field') || !box.closest('.household-form-section'))) return;      // not the form this was written for: Profile stays as it was

        Object.assign(ICON, {
            person: svg('<circle cx="12" cy="8.200" r="3.600"/><path d="M5 19.500c.8-3.400 3.600-5.300 7-5.300s6.200 1.900 7 5.300"/>'),
            pin: svg('<path d="M12 20.500s-6.500-5.600-6.500-10.600a6.500 6.500 0 0 1 13 0c0 5-6.500 10.600-6.500 10.600z"/><circle cx="12" cy="9.900" r="2.300"/>'),
            key: svg('<circle cx="8" cy="15.500" r="3.200"/><path d="M10.400 13.200 19 4.600M15.300 8.300l2.300 2.300M17.600 6l1.800 1.800"/>'),
            phone: svg('<path d="M6.200 4.500h2.600l1.400 3.900-1.900 1.400a11.500 11.500 0 0 0 5.900 5.900l1.400-1.900 3.900 1.400v2.600a1.700 1.700 0 0 1-1.800 1.700A14.700 14.700 0 0 1 4.500 6.300a1.700 1.700 0 0 1 1.700-1.800z"/>'),
            note: svg('<path d="M7 4.500h7l4 4V19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.500a1 1 0 0 1 1-1z"/><path d="M14 4.500v4h4M9 13h6M9 16.200h4"/>'),
            lock: svg('<rect x="5.500" y="10.500" width="13" height="9" rx="2.200"/><path d="M8.500 10.500V8a3.500 3.500 0 0 1 7 0v2.500"/>'),
            shield: svg('<path d="M12 3.800 5.500 6.300v5.300c0 4 2.700 7 6.500 8.600 3.800-1.600 6.500-4.600 6.500-8.600V6.300z"/><path d="m9.300 12 1.900 1.900 3.600-3.800"/>'),
            trash: svg('<path d="M5 7.500h14M9.500 7.500V5.300h5v2.200M7 7.500l.8 11a1 1 0 0 0 1 1h6.400a1 1 0 0 0 1-1l.8-11M10.300 11v5M13.700 11v5"/>'),
            wallet: svg('<rect x="4" y="6.500" width="16" height="12" rx="2.400"/><path d="M4 10h16M15.500 14.300h1.500"/>'),
            mail: svg('<path d="M20 4 10.500 13.500M20 4l-6 16-3.500-6.500L4 10z"/>')
        });

        // ---------- the page ----------
        const page = document.createElement('div');
        page.className = 'pis-cp-pf';
        // what the app has loaded (portal.js keeps these)
        const mine = { me: () => { try { return (typeof currentProfile !== 'undefined' && currentProfile) || {}; } catch (error) { return {}; } },
            home: () => { try { return (typeof currentHousehold !== 'undefined' && currentHousehold) || {}; } catch (error) { return {}; } },
            access: () => { try { return (typeof currentPropertyAccess !== 'undefined' && currentPropertyAccess) || {}; } catch (error) { return {}; } } };
        const NONE_YET = 'Not Added Yet';
        const clean = value => String(value ?? '').trim();
        const phoneWords = value => {
            const digits = clean(value).replace(/\D/g, '');
            const ten = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits;
            return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : clean(value);
        };
        const pushCard = document.getElementById('client-push-settings-card');
        const pushButton = document.getElementById('enable-push-notifications');
        const legal = cards.querySelector('.pis-legal-links a[href]');
        const faceWord = () => { const m = clean(document.querySelector('.pis-faceid-setting strong')?.textContent).match(/with\s+(.+)$/i); return m ? m[1] : ''; };
        function facts() {
            const me = mine.me();
            const home = mine.home();
            const access = mine.access();
            const image = document.getElementById('client-profile-image');
            const creditCard = document.getElementById('household-credit-card');
            const iconCard = document.getElementById('pis-appicon-card');
            const iconNote = clean(iconCard?.querySelector('small')?.textContent);
            const season = iconNote.match(/^Seasonal:\s*(\w+) icon right now/i);
            const saved = [['gate_code', 'Gate Code'], ['door_code', 'Door Code'], ['key_instructions', 'Key Instructions'], ['alarm_instructions', 'Alarm Instructions'], ['parking_instructions', 'Parking Instructions'], ['other_access_notes', 'Other Notes']]
                .filter(([field]) => clean(access[field])).map(([, words]) => `${words} Saved`);
            const name = clean(me.full_name) || clean(document.getElementById('household-display-name')?.textContent) || 'Client';
            return {
                name,
                email: clean(me.email) || clean(document.getElementById('household-display-email')?.textContent).replace(/^—$/, ''),
                phone: phoneWords(me.phone),
                photo: image && image.style.display !== 'none' ? image.getAttribute('src') || '' : '',
                credit: creditCard && creditCard.style.display !== 'none' ? clean(document.getElementById('household-display-credit')?.textContent) : '',
                address: [clean(home.street_address), clean(home.address_line_2), [[clean(home.city), clean(home.state)].filter(Boolean).join(', '), clean(home.zip_code)].filter(Boolean).join(' ')].filter(Boolean),
                access: saved.length > 3 ? [...saved.slice(0, 2), `And ${saved.length - 2} More Saved`] : saved,
                contact: clean(home.preferred_contact_method),
                emergency: [clean(home.emergency_contact_name), phoneWords(home.emergency_contact_phone)].filter(Boolean),
                notes: clean(home.home_notes).replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean).join('\n'),
                push: pushCard && pushButton && !pushCard.hidden ? (/enabled/i.test(pushButton.textContent) ? 'On' : 'Off') : '',
                icon: iconCard ? { thumb: iconCard.querySelector('img')?.getAttribute('src') || '', lines: /^Classic/i.test(iconNote) ? ['Classic', 'The Everyday Icon All Year'] : season ? ['Seasonal', `${season[1]} Icon Right Now`] : ['Seasonal', 'Changes for the Holidays'] } : null,
                face: faceWord(),
                security: Boolean(document.getElementById('account-security-content')),
                privacy: legal ? legal.getAttribute('href') : '',
                remove: Boolean(document.getElementById('delete-account-open'))
            };
        }
        const initials = name => { const parts = name.split(/\s+/).filter(Boolean); return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'; };
        const lines = list => (list.length ? list : [NONE_YET]).map(line => `<small>${esc(line)}</small>`).join('');
        const row = (go, tile, icon, title, under, extra = '', cls = '') =>
            `<button type="button" class="pis-cp-pf-row ${cls}" data-cp-go="${go}"><i class="${tile}">${icon}</i><span class="pis-cp-pf-words"><b>${title}</b>${under}</span>${extra}${ICON.chev}</button>`;
        // Never cut a line off: a smaller size first, and only then onto a second line
        const snug = (el, sizes) => {
            el.style.fontSize = '';
            el.classList.remove('is-wrap');
            if (el.scrollWidth <= el.clientWidth + 1) return;
            for (const size of sizes) { el.style.fontSize = `${size}px`; if (el.scrollWidth <= el.clientWidth + 1) return; }
            el.style.fontSize = '';
            el.classList.add('is-wrap');
        };
        function fitProfile() {
            if (!page.clientWidth) return;                      // Profile is not the screen showing: fitted when it is
            const key = `${page.dataset.cpKey}|${page.clientWidth}`;
            if (page.dataset.cpFit === key) return;
            page.dataset.cpFit = key;
            for (const el of page.querySelectorAll('.pis-cp-pf-me h2')) snug(el, [23, 21, 19]);
            for (const el of page.querySelectorAll('.pis-cp-pf-me p, .pis-cp-pf-words b, .pis-cp-pf-credit b')) snug(el, [15, 14]);
            for (const el of page.querySelectorAll('.pis-cp-pf-words small:not(.is-note), .pis-cp-pf-credit small')) snug(el, [14, 13.5]);
        }
        drawProfile = () => {
            paintPush();
            const f = facts();
            const key = JSON.stringify(f);
            if (page.dataset.cpKey !== key) {
                page.dataset.cpKey = key;
                const out = section.querySelector('.pis-cp-logout');
                out?.remove();
                const privacy = cls => (f.privacy ? `<a class="pis-cp-pf-row ${cls}" href="${esc(f.privacy)}" target="_blank" rel="noopener"><i class="is-gray">${ICON.shield}</i><span class="pis-cp-pf-words"><b>Privacy Policy</b></span>${ICON.chev}</a>` : '');
                const appRows = (f.push ? row('push', 'is-blue', ICON.bell, 'Push Notifications', lines(['Visit Updates and Messages']), `<em class="pis-cp-pf-chip${f.push === 'On' ? '' : ' is-off'}">${f.push}</em>`) : '') +
                    (f.icon ? row('icon', 'is-pic', f.icon.thumb ? `<img src="${esc(f.icon.thumb)}" alt="">` : ICON.image, 'App Icon', lines(f.icon.lines)) : '');
                page.innerHTML =
                    `<div class="pis-cp-pf-col is-left">
                        <div class="pis-cp-pf-me"><u></u><div class="pis-cp-pf-face">${f.photo ? `<img src="${esc(f.photo)}" alt="">` : esc(initials(f.name))}</div><h2>${esc(f.name)}</h2>${f.email ? `<p>${esc(f.email)}</p>` : ''}<p>${esc(f.phone || 'Phone Not Added Yet')}</p>
                            <button type="button" class="pis-cp-pf-edit" data-cp-go="profile">Edit Profile</button></div>
                        ${f.credit ? `<div class="pis-cp-pf-credit"><i>${ICON.wallet}</i><span><b>Account Credit</b><small>Use It at Checkout</small></span><strong>${esc(f.credit)}</strong></div>` : ''}
                        ${appRows || f.privacy ? `<div class="pis-cp-pf-group is-app${appRows ? '' : ' is-desk'}"><div class="pis-cp-pf-head">${small(ICON.bell, 20)}<h3>App</h3></div>${appRows}${privacy('is-desk')}</div>` : ''}
                    </div>
                    <div class="pis-cp-pf-col is-right">
                        <div class="pis-cp-pf-group is-home"><div class="pis-cp-pf-head">${small(ICON.house, 20)}<h3>Your Home</h3></div>
                            ${row('address', '', ICON.pin, 'Home Address', lines(f.address))}
                            ${row('access', '', ICON.key, 'Property Access', lines(f.access))}
                            ${row('contact', 'is-blue', ICON.chat, 'Preferred Contact', lines(f.contact ? [f.contact] : []))}
                            ${row('emergency', 'is-blue', ICON.phone, 'Emergency Contact', lines(f.emergency))}
                            ${row('notes', 'is-gray', ICON.note, 'Home Notes', f.notes ? `<small class="is-note is-wrap">${esc(f.notes)}</small>` : lines([]))}
                        </div>
                        ${f.security || f.privacy || f.remove ? `<div class="pis-cp-pf-group is-account"><div class="pis-cp-pf-head">${small(ICON.person, 20)}<h3>Account</h3></div>
                            ${f.security ? row('security', 'is-gray', ICON.lock, 'Account Security', lines([f.face ? `Password and ${f.face}` : 'Change Your Password'])) : ''}
                            ${privacy('is-phone')}
                            ${f.remove ? row('delete', 'is-red', ICON.trash, 'Delete Account', lines(['Permanently Delete Your Account']), '', 'is-danger') : ''}
                        </div>` : ''}
                    </div>`;
                if (out) page.querySelector('.pis-cp-pf-col.is-left').appendChild(out);
            }
            fitProfile();
        };

        // ---------- the app's edit form, one part at a time ----------
        for (const box of boxes) {
            const part = PART[box.id];
            const field = box.closest('.household-form-field');
            const group = box.closest('.household-form-section');
            field.dataset.cpPart = part;
            if (HALF.includes(box.id)) field.dataset.cpHalf = '1';
            group.dataset.cpHas = [...new Set([...(group.dataset.cpHas || '').split(' ').filter(Boolean), part])].join(' ');
        }
        const relabel = (id, text) => { const label = form.querySelector(`label[for="${id}"]`); if (label) label.textContent = text; };
        relabel('household-address-line-2', 'Apartment or Unit');
        relabel('access-door-code', 'Door or Entry Code');
        for (const id of ['household-address-line-2', 'access-door-code', 'access-parking-instructions', 'access-other-notes', 'emergency-contact-name', 'emergency-contact-phone']) {
            const box = document.getElementById(id);
            if (box && !box.placeholder) box.placeholder = 'Optional';
        }
        const emailHelp = document.getElementById('household-email')?.parentElement?.querySelector('.field-help');
        if (emailHelp) emailHelp.textContent = 'Your sign-in email can’t be changed here.';
        const photoHelp = panel.querySelector('.client-photo-help');
        if (photoHelp) photoHelp.textContent = 'JPG, PNG or WebP.';
        const noState = document.querySelector('#household-state option[value=""]');
        if (noState) noState.textContent = 'Select State';
        const photoLabel = panel.querySelector('label[for="client-photo-input"]');
        const photoPreview = document.getElementById('client-photo-preview');
        const paintPhoto = () => { if (photoLabel) { const text = photoPreview && photoPreview.style.display !== 'none' && photoPreview.getAttribute('src') ? 'Change Photo' : 'Choose Photo'; if (photoLabel.textContent !== text) photoLabel.textContent = text; } };
        if (photoPreview) new MutationObserver(paintPhoto).observe(photoPreview, { attributes: true, attributeFilter: ['style', 'src'] });
        // Preferred Contact: three choices set the app's own list
        const OPTION_ICON = { 'Text Message': ICON.chat, 'Phone Call': ICON.phone, Email: ICON.mail };
        const opts = document.createElement('div');
        opts.className = 'pis-cp-pf-opts';
        opts.setAttribute('role', 'radiogroup');
        opts.setAttribute('aria-label', 'Preferred Contact');
        opts.innerHTML = [...contact.options].filter(option => option.value).map(option =>
            `<button type="button" class="pis-cp-pf-opt" role="radio" data-cp-value="${esc(option.value)}"><i>${small(OPTION_ICON[option.value] || ICON.chat, 20)}</i><span>${esc(option.textContent.trim())}</span></button>`).join('');
        contact.insertAdjacentElement('afterend', opts);
        contact.classList.add('pis-cp-held');
        contact.tabIndex = -1;
        const paintOpts = () => { for (const button of opts.children) button.setAttribute('aria-checked', String(button.dataset.cpValue === contact.value)); };
        opts.addEventListener('click', event => {
            const button = event.target.closest('.pis-cp-pf-opt');
            if (!button) return;
            contact.value = button.dataset.cpValue;
            contact.dispatchEvent(new Event('change', { bubbles: true }));
            paintOpts();
        });

        const title = document.createElement('div');
        title.className = 'pis-cp-sheettitle';
        head.insertAdjacentElement('afterbegin', title);
        const shade = document.createElement('div');
        shade.className = 'pis-cp-shade';
        shade.hidden = true;
        document.body.appendChild(shade);
        let shut = null;                                        // what the dimmed page and Esc press
        shade.addEventListener('click', () => shut?.());
        const onTop = () => { const cover = document.getElementById('pis-cover-dialog'); return Boolean((cover && cover.getClientRects().length) || document.querySelector('dialog[open], #pis-faceid-modal')); };
        document.addEventListener('keydown', event => { if (shut && event.key === 'Escape' && !onTop()) shut(); });
        const dim = (on, closer) => { shut = on ? closer : null; shade.hidden = !on; document.body.classList.toggle('pis-cp-sheet-open', on); };
        const touch = (() => { try { return window.matchMedia('(pointer: coarse)').matches; } catch (error) { return false; } })();

        const SHEET = {
            profile: ['', 'person', 'Edit Profile', ''],
            address: ['', 'pin', 'Home Address', ''],
            access: ['', 'key', 'Property Access', 'How we get into your home safely.', 'How we get in safely.'],
            contact: ['is-blue', 'chat', 'Preferred Contact', 'The best way for us to reach you.', 'The best way to reach you.', 'How to reach you.'],
            emergency: ['is-blue', 'phone', 'Emergency Contact', ''],
            notes: ['is-gray', 'note', 'Home Notes', '']
        };
        const spot = { parent: panel.parentNode, next: panel.nextSibling };
        const closeWas = close.innerHTML;
        let open = false;
        let kind = '';
        let nextKind = '';
        function setKind(next) {
            kind = SHEET[next] ? next : 'profile';
            panel.dataset.cpSheet = kind;
            const [tile, icon, strong, ...subs] = SHEET[kind];
            title.innerHTML = `<i class="${tile}">${ICON[icon]}</i><div><strong>${strong}</strong><span>${subs[0]}</span></div>`;
            panel.setAttribute('aria-label', strong);
            fit(title.querySelector('strong'), [strong], [0, 22, 20, 18]);
            if (subs[0]) fit(title.querySelector('span'), subs, [0, 14, 13.5, 13]);
            paintOpts();
            paintPhoto();
            form.scrollTop = 0;
        }
        const relabelSave = () => { const text = save.textContent.trim(); if (text === 'Save Profile') save.textContent = 'Save Changes'; else if (text === 'Saving...') save.textContent = 'Saving…'; };
        new MutationObserver(relabelSave).observe(save, { childList: true, characterData: true, subtree: true });
        function sync() {
            const showing = panel.style.display !== 'none';
            if (showing === open) { if (open) { paintOpts(); paintPhoto(); } return; }
            open = showing;
            if (open) {
                if (panel.parentNode !== document.body) document.body.appendChild(panel);          // above the header and the bottom menu
                panel.classList.add('pis-cp-sheet');
                delete panel.dataset.cpReady;
                panel.setAttribute('role', 'dialog');
                panel.setAttribute('aria-modal', 'true');
                close.innerHTML = ICON.x;
                dim(true, () => close.click());
                setKind(nextKind || 'profile');
                nextKind = '';
                relabelSave();
                const box = kind === 'notes' ? document.getElementById('household-home-notes') : touch ? null : form.querySelector(`[data-cp-part="${kind}"] :is(input:not([disabled]), textarea)`);
                if (box) { try { box.focus({ preventScroll: true }); box.setSelectionRange(box.value.length, box.value.length); } catch (error) { /* not a box that takes a cursor position */ } }
            } else {
                panel.classList.remove('pis-cp-sheet');
                delete panel.dataset.cpSheet;
                delete panel.dataset.cpReady;
                panel.removeAttribute('role');
                panel.removeAttribute('aria-modal');
                panel.removeAttribute('aria-label');
                close.innerHTML = closeWas;
                try { spot.parent.insertBefore(panel, spot.next && spot.next.parentNode === spot.parent ? spot.next : null); } catch (error) { /* stays where it is */ }
                dim(false);
                kind = '';
                nextKind = '';
            }
        }
        new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['style'] });
        // What the app says about one box belongs under that box. When the box is on another sheet the app can only pin its note
        // to the form as a whole (form-errors.js): that sheet is shown, and the note is put under the box, where it would have gone.
        new MutationObserver(() => {
            if (!open) return;
            const bad = form.querySelector('.household-field-error, :is(input, select, textarea).pis-field-invalid');
            const part = bad ? (bad.closest('[data-cp-part]')?.dataset.cpPart || '') : '';
            if (!part || part === kind) return;
            const errors = window.PisFormErrors;
            const pinned = form.dataset.pisNote ? document.getElementById(form.dataset.pisNote) : null;
            const text = (pinned?.textContent || '').trim();
            setKind(part);
            if (errors?.show && errors?.clear) {
                errors.clear(form);
                bad.classList.add('household-field-error');
                errors.show(bad, text || undefined);
            }
        }).observe(form, { attributes: true, attributeFilter: ['class'], subtree: true });
        const openPart = next => {
            if (open) { setKind(next); return; }
            nextKind = next;
            panel.dataset.cpReady = '1';                         // in place (still closed) before the app opens it, so the page does not scroll to it
            if (panel.parentNode !== document.body) document.body.appendChild(panel);
            editButton.click();
        };

        // ---------- Account Security: the app's Face ID row and password form, in a sheet of their own ----------
        const secure = document.getElementById('account-security-content');
        let openSecurity = () => {};
        if (secure) {
            const sheet = document.createElement('div');
            sheet.className = 'pis-cp-sheet';
            sheet.id = 'pis-cp-security';
            sheet.hidden = true;
            sheet.setAttribute('role', 'dialog');
            sheet.setAttribute('aria-modal', 'true');
            sheet.setAttribute('aria-label', 'Account Security');
            sheet.innerHTML = `<div class="pis-cp-sheethead"><div class="pis-cp-sheettitle"><i class="is-gray">${ICON.lock}</i><div><strong>Account Security</strong><span></span></div></div><button type="button" class="pis-cp-sheetx" aria-label="Close">${ICON.x}</button></div><div class="pis-cp-sheetbody"></div>`;
            document.body.appendChild(sheet);
            const body = sheet.querySelector('.pis-cp-sheetbody');
            const was = { parent: secure.parentNode, next: secure.nextSibling };
            const closeSecurity = () => {
                if (sheet.hidden) return;
                sheet.hidden = true;
                secure.hidden = document.getElementById('account-security-toggle')?.getAttribute('aria-expanded') !== 'true';
                try { was.parent.insertBefore(secure, was.next && was.next.parentNode === was.parent ? was.next : null); } catch (error) { /* stays where it is */ }
                for (const id of ['new-password', 'confirm-new-password']) { const box = document.getElementById(id); if (box) box.value = ''; }      // nothing typed is left behind
                dim(false);
            };
            openSecurity = () => {
                if (!sheet.hidden) return;
                body.appendChild(secure);
                secure.hidden = false;
                sheet.hidden = false;
                fit(sheet.querySelector('.pis-cp-sheettitle strong'), ['Account Security'], [0, 22, 20, 18]);
                body.scrollTop = 0;
                dim(true, closeSecurity);
            };
            sheet.querySelector('.pis-cp-sheetx').addEventListener('click', closeSecurity);
        }

        // ---------- the app's own pop-ups that the rows open: new words, an X, a Done button ----------
        const notify = document.getElementById('client-notifications-modal');
        const notifyBox = notify?.querySelector('.client-notifications-dialog');
        const device = notify?.querySelector('.client-notifications-device-section');
        let paintPush = () => {};
        if (notify && notifyBox) {
            const say = (el, text) => { if (el) el.textContent = text; };
            const top = notify.querySelector('.client-notifications-header');
            say(top?.querySelector('h2'), 'Push Notifications');
            say(top?.querySelector('p'), 'Choose the updates you want.');
            if (top && !top.querySelector('.pis-cp-pf-tile')) top.insertAdjacentHTML('afterbegin', `<i class="pis-cp-pf-tile" aria-hidden="true">${ICON.bell}</i>`);
            const x = document.getElementById('client-notifications-close');
            if (x) x.innerHTML = ICON.x;
            const WORDS = { visit_started: ['Visit Started', 'When Your Visit Begins'], visit_completed: ['Visit Completed', 'When Your Visit Is Finished'], visit_reports: ['Visit Reports', 'When a New Report Is Ready'],
                messages: ['New Messages', 'When We Send You a Message'], booking_updates: ['Booking Updates', 'Important Changes to a Booking'], cancellations: ['Cancellations and Refunds', 'Cancellations, Credits and Refunds'] };
            for (const box of notify.querySelectorAll('[data-client-push-preference]')) {
                const words = WORDS[box.dataset.clientPushPreference];
                const line = box.closest('.client-notification-preference-row');
                if (words && line) { say(line.querySelector('strong'), words[0]); say(line.querySelector('small'), words[1]); }
            }
            if (device && pushButton) {
                device.insertAdjacentHTML('afterbegin', `<i class="pis-cp-pf-tile" aria-hidden="true">${ICON.bell}</i>`);
                device.insertAdjacentHTML('beforeend', '<em class="pis-cp-pf-chip">On</em>');
                paintPush = () => device.classList.toggle('is-on', /enabled/i.test(pushButton.textContent));
            }
            const snugHard = (el, choices, sizes) => {
                if (!el) return;
                for (const text of choices) for (const size of sizes) {
                    if (size) el.style.setProperty('font-size', `${size}px`, 'important'); else el.style.removeProperty('font-size');
                    el.textContent = text;
                    if (el.scrollWidth <= el.clientWidth + 1) return;
                }
            };
            const fitNotify = () => {
                if (notify.hidden) return;
                snugHard(top?.querySelector('h2'), ['Push Notifications'], [0, 22, 20, 18]);
                snugHard(top?.querySelector('p'), ['Choose the updates you want.', 'Choose your updates.'], [0, 14, 13]);
            };
            new MutationObserver(fitNotify).observe(notify, { attributes: true, attributeFilter: ['hidden'] });
            window.addEventListener('resize', fitNotify);
            const done = document.createElement('div');
            done.className = 'pis-cp-pf-done';
            done.innerHTML = '<button type="button">Done</button>';
            done.firstElementChild.addEventListener('click', () => x?.click());
            notifyBox.appendChild(done);
        }
        const erase = document.getElementById('delete-account-modal');
        if (erase) {
            const heading = document.getElementById('delete-account-title');
            if (heading && /^delete your account\?$/i.test(heading.textContent.trim())) heading.textContent = 'Delete Your Account?';
            const x = erase.querySelector('.pis-delete-modal-x');
            if (x) x.innerHTML = ICON.x;
        }
        // the iPhone app builds its App Icon chooser each time it opens
        const dressIconChooser = () => {
            const chooser = document.getElementById('pis-appicon-modal');
            if (!chooser) return;
            const say = (selector, text) => { const el = chooser.querySelector(selector); if (el) el.textContent = text; };
            const x = chooser.querySelector('.client-cancellation-close');
            if (x) x.innerHTML = ICON.x;
            const thumb = document.querySelector('#pis-appicon-card img')?.getAttribute('src');
            const heading = chooser.querySelector('.client-cancellation-header > div');
            if (thumb && heading && !chooser.querySelector('.pis-cp-pf-tile')) heading.insertAdjacentHTML('beforebegin', `<i class="pis-cp-pf-tile is-pic" aria-hidden="true"><img src="${esc(thumb)}" alt=""></i>`);
            say('[data-appicon="seasonal"] small', 'Halloween, Thanksgiving and Christmas Icons');
            say('[data-appicon="classic"] small', 'The Everyday Icon All Year');
            say('[data-appicon-save]', 'Save Changes');
        };

        page.addEventListener('click', event => {
            const go = event.target.closest('[data-cp-go]')?.dataset.cpGo;
            if (!go) return;
            if (SHEET[go]) openPart(go);
            else if (go === 'security') openSecurity();
            else if (go === 'push') document.getElementById('client-notifications-toggle')?.click();
            else if (go === 'icon') { document.getElementById('pis-appicon-card')?.click(); dressIconChooser(); }
            else if (go === 'delete') document.getElementById('delete-account-open')?.click();
        });
        // the app redraws its own cards after a save, when the credit arrives, when notifications change: the page follows
        const again = new MutationObserver(() => refresh());
        again.observe(cards, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['style', 'src', 'hidden'] });
        if (pushCard) again.observe(pushCard, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
        if (pushButton) again.observe(pushButton, { childList: true, characterData: true, subtree: true });

        section.insertAdjacentElement('afterbegin', page);
        document.body.classList.add('pis-cp-prof');
    }
    try { setUpProfile(); } catch (error) { console.warn('Profile new look:', error?.message || error); document.body.classList.remove('pis-cp-prof'); document.querySelector('.pis-cp-pf')?.remove(); drawProfile = () => {}; }

    // =====================================================================
    // PART 8: THE VISIT SCREEN
    // =====================================================================
    // The app's own visit screen (one visit, opened from View or from the Home card). Same parts, same colors for each service.
    function setUpVisit() {
        const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        function dress(overlay) {
            const copy = overlay.querySelector('.csd-header-copy');
            if (!copy) return;
            let mine = copy.querySelector('.pis-cp-vhead');
            if (!mine) {
                mine = document.createElement('div');
                mine.className = 'pis-cp-vhead';
                mine.setAttribute('aria-hidden', 'true');             // the app's own heading and line are still read out
                mine.innerHTML = '<strong></strong><span></span>';
                copy.appendChild(mine);
            }
            const title = String(copy.querySelector('h2')?.textContent || '').trim().replace(/\s+-\s+/g, ' · ');
            const [when, ...rest] = String(copy.querySelector(':scope > p')?.textContent || '').trim().split(/\s+·\s+/);
            const state = rest.join(' · ').replace(/(^|\s)([a-z])/g, (all, gap, letter) => gap + letter.toUpperCase());      // "Boarding with us" -> "Boarding With Us"
            const m = when.match(/^(\w+),\s+(\w+)\s+(\d{1,2}),\s+(\d{4})$/);              // "Friday, November 20, 2026"
            const sameYear = m && Number(m[4]) === new Date().getFullYear();
            const year = sameYear || !m ? '' : `, ${m[4]}`;
            // the day, shorter when the line would not fit: "Friday, Nov 20", "Fri, Nov 20", "Nov 20"
            const dates = m && MONTHS.includes(m[2]) ? [`${m[1]}, ${m[2].slice(0, 3)} ${m[3]}${year}`, `${m[1].slice(0, 3)}, ${m[2].slice(0, 3)} ${m[3]}${year}`, `${m[2].slice(0, 3)} ${m[3]}${year}`] : [when];
            const key = `${title}|${when}|${state}|${copy.clientWidth}`;
            if (!copy.clientWidth) again = true;                           // still sliding in: measured on the next frame
            if (mine.dataset.cpKey !== key && copy.clientWidth) {
                mine.dataset.cpKey = key;
                fit(mine.firstElementChild, [title], [0, 19, 17.5, 16]);
                fit(mine.lastElementChild, dates.map(date => [date, state].filter(Boolean).join(' · ')), [0, 13, 12.5, 12]);
            }
            // the report's parts in reading order: what they wrote, the photos, then the checks
            for (const part of overlay.querySelectorAll('.client-visit-report-section')) {
                const kind = part.querySelector('.client-visit-report-notes') ? 'notes' : part.querySelector('.client-visit-report-photo-grid') ? 'photos' : part.querySelector('.client-visit-report-pet-care-list') ? 'care' : '';
                if (kind && part.dataset.cpSec !== kind) part.dataset.cpSec = kind;
            }
            const content = overlay.querySelector('.client-visit-report-content');
            if (content) {
                const parts = [...content.querySelectorAll('.client-visit-report-section[data-cp-sec]')];
                // a part with nothing in it ("No visit photos were added.") is left out; a report with nothing at all says so once
                for (const part of parts) part.toggleAttribute('data-cp-empty', !!part.querySelector('.client-visit-report-muted') && !part.querySelector('.client-visit-report-notes, .client-visit-report-photo-button, .client-visit-report-care-item'));
                content.toggleAttribute('data-cp-bare', parts.length > 0 && parts.every(part => part.hasAttribute('data-cp-empty')));
            }
            // "Started at 12:12 PM · The route draws as they walk": side by side when they fit, else one under the other
            for (const line of overlay.querySelectorAll('.pis-live-meta')) {
                const width = line.clientWidth;
                if (!width) { again = true; continue; }
                const text = line.dataset.cpLines ? [...line.children].map(part => part.textContent).join(' · ') : line.textContent.trim();
                if (!text.includes(' · ') || (line.dataset.cpW === String(width) && line.dataset.cpText === text)) continue;
                line.removeAttribute('data-cp-lines');
                line.textContent = text;
                line.style.whiteSpace = 'nowrap';
                const wide = line.scrollWidth > line.clientWidth + 1;
                line.style.whiteSpace = '';
                if (wide) {
                    line.textContent = '';
                    for (const part of text.split(' · ')) line.appendChild(document.createElement('span')).textContent = part;
                    line.dataset.cpLines = '1';
                }
                line.dataset.cpW = String(width);
                line.dataset.cpText = text;
            }
            // a sit is told through its updates: with no report written there is nothing to announce ("...has not been added yet")
            for (const mount of overlay.querySelectorAll('.client-visit-report-mount')) mount.toggleAttribute('data-cp-none', overlay.classList.contains('pis-kind-sit') && !!mount.querySelector(':scope > .client-visit-report-empty'));
            for (const head of overlay.querySelectorAll('.client-inline-heading, .client-visit-report-empty > strong')) {
                const icon = head.querySelector('.pis-cp-vicon') ? null : overlay.querySelector('.csd-header > .pis-kind-icon svg');
                if (!icon) continue;
                const holder = document.createElement('span');
                holder.className = 'pis-cp-vicon';
                holder.setAttribute('aria-hidden', 'true');
                holder.appendChild(icon.cloneNode(true));
                head.prepend(holder);
            }
            for (const grid of overlay.querySelectorAll('.client-boarding-photo-grid')) grid.toggleAttribute('data-cp-empty', !grid.children.length);
            // a night of a stay: its updates and walks are that day's, so each is told by the hour ("7:40 AM")
            for (const part of overlay.querySelectorAll('.client-boarding-inline[data-boarding-day]')) {
                const when = new Date(`${part.dataset.boardingDay}T12:00:00Z`);
                const day = Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });      // "Nov 20"
                const hour = full => { const found = full.match(/^(?:Shared\s+)?(.+),\s+(\d{1,2}:\d{2}\s*[AP]M)$/i); return !found ? full : found[1] === day ? found[2] : `${found[1]}, ${found[2]}`; };
                for (const stamp of part.querySelectorAll('.client-boarding-update > small, .client-boarding-walk > strong')) {
                    const full = stamp.dataset.cpFull || stamp.textContent.trim();
                    const want = day ? hour(full) : full;
                    if (stamp.textContent !== want) { stamp.dataset.cpFull = full; stamp.textContent = want; }
                }
                for (const date of part.querySelectorAll('.client-boarding-update > h3')) date.toggleAttribute('data-cp-same', !!day && !!date.nextElementSibling?.matches('small'));
            }
            // the booking box of a stay has its pets and its dates loose: each gets a name, like the other lines
            for (const chips of overlay.querySelectorAll('.csd-detail-card > .service-pet-chips')) {
                const label = chips.children.length === 1 ? 'Pet' : 'Pets';
                if (chips.dataset.cpLabel !== label) chips.dataset.cpLabel = label;
            }
            for (const line of overlay.querySelectorAll('.csd-detail-card > p')) {
                const text = line.dataset.cpFull || line.textContent.trim();
                const found = text.match(/^(\w{3} \d{1,2}), (\d{4}) → (\w{3} \d{1,2}), (\d{4})$/);              // "Nov 19, 2026 → Nov 22, 2026"
                if (!found) { line.removeAttribute('data-cp-label'); continue; }
                const thisYear = String(new Date().getFullYear());
                const want = found[2] === thisYear && found[4] === thisYear ? `${found[1]} – ${found[3]}` : `${found[1]}, ${found[2]} – ${found[3]}, ${found[4]}`;
                if (line.textContent !== want) { line.dataset.cpFull = text; line.textContent = want; }
                if (line.dataset.cpLabel !== 'Stay') line.dataset.cpLabel = 'Stay';
            }
            // updates that are all from one day are told by the hour ("8:40 AM"); over several days each keeps its date
            const stamps = [...overlay.querySelectorAll('.client-sit-inline .client-boarding-update > h3')];
            const whole = stamp => stamp.dataset.cpFull || stamp.textContent.trim();
            const read = stamps.map(stamp => whole(stamp).match(/^(.+),\s+(\d{1,2}:\d{2}\s*[AP]M)$/i));
            const oneDay = read.length > 0 && read.every(found => found && found[1] === read[0][1]);
            stamps.forEach((stamp, i) => {
                const full = whole(stamp);
                const want = oneDay ? read[i][2] : full;
                if (stamp.textContent !== want) { stamp.dataset.cpFull = full; stamp.textContent = want; }
            });
            for (const label of overlay.querySelectorAll('.csd-detail-card .upcoming-service-pets-label')) {
                const text = /^pets$/i.test(label.textContent.trim()) ? 'Pets' : /^pet$/i.test(label.textContent.trim()) ? 'Pet' : '';
                if (text && label.textContent !== text) label.textContent = text;
            }
            // care that is for the whole visit, not one pet, needs no name over it
            for (const name of overlay.querySelectorAll('.client-visit-report-pet-care-header > strong')) name.toggleAttribute('data-cp-plain', /^visit$/i.test(name.textContent.trim()));
            for (const line of overlay.querySelectorAll('.csd-detail-card .upcoming-service-row')) {
                if (!/^payment$/i.test(String(line.querySelector('span')?.textContent || '').trim())) continue;
                if (line.dataset.cpRow !== 'payment') line.dataset.cpRow = 'payment';
                const value = line.querySelector('strong');
                if (value) value.classList.toggle('is-paid', /^paid$/i.test(value.textContent.trim()));
            }
        }
        const watching = new WeakSet();
        let waiting = false;
        let again = false;
        let tries = 0;
        const all = () => {
            waiting = false;
            again = false;
            const overlay = document.body.classList.contains('csd-open') ? document.querySelector('.csd-overlay:not([hidden])') : null;
            if (!overlay) { tries = 0; return; }
            if (!watching.has(overlay)) {
                watching.add(overlay);
                inside.observe(overlay, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
            }
            try { dress(overlay); } catch (error) { console.warn('Visit screen new look:', error?.message || error); }
            if (again && tries++ < 40) soon(); else tries = 0;
        };
        const soon = () => { if (!waiting) { waiting = true; requestAnimationFrame(all); } };
        const inside = new MutationObserver(soon);
        new MutationObserver(soon).observe(document.body, { attributes: true, attributeFilter: ['class'] });      // the app marks the page while a visit is open
        window.addEventListener('resize', soon);
        document.body.classList.add('pis-cp-visit');
        soon();
    }
    try { setUpVisit(); } catch (error) { console.warn('Visit screen new look:', error?.message || error); document.body.classList.remove('pis-cp-visit'); }

    // =====================================================================
    // PART 9: THE CALENDAR ON SERVICES
    // =====================================================================
    // The app's own month, in the new lettering and shapes. What each day shows is the app's own.
    function setUpCalendar() {
        const grid = document.getElementById('upcoming-calendar-grid');
        if (!grid) return;
        document.body.classList.add('pis-cp-cal');
    }
    try { setUpCalendar(); } catch (error) { console.warn('Calendar new look:', error?.message || error); document.body.classList.remove('pis-cp-cal'); }

    // =====================================================================
    // PART 10: THE BELL'S NOTIFICATIONS
    // =====================================================================
    // The app's own drop-down, list and buttons. Added: an X (it taps the bell, which is how the app closes the list)
    // and a line saying how many are new. Mark All Read moves down beside Clear All; it is the same button.
    function setUpBell() {
        const panel = document.getElementById('client-notification-panel');
        const list = document.getElementById('client-notification-list');
        const bell = document.getElementById('client-notification-center-button');
        const head = panel?.querySelector('.client-notification-panel-header');
        const foot = panel?.querySelector('.client-notification-panel-footer');
        const title = head?.querySelector('h3');
        if (!panel || !list || !bell || !head || !foot || !title || panel.querySelector('.pis-cp-nt-close')) return;
        // the app marks each kind with a small picture character; each gets a drawn icon in its place
        const DRAWN = {
            '🐾': svg('<circle cx="7" cy="9.500" r="1.700"/><circle cx="12" cy="6.800" r="1.700"/><circle cx="17" cy="9.500" r="1.700"/><path d="M8 16.600c0-2.300 1.800-4.300 4-4.300s4 2 4 4.300c0 1.300-1 2.100-2.200 2.100-.7 0-1.200-.3-1.800-.3s-1.100.3-1.800.3c-1.200 0-2.200-.8-2.200-2.100Z"/>', 22, 2.100),
            '✅': svg('<circle cx="12" cy="12" r="8.500"/><path d="m8.300 12.300 2.600 2.600 4.800-5.400"/>', 22, 2.100),
            '📋': svg('<rect x="5.500" y="4.500" width="13" height="16" rx="2.500"/><path d="M9.500 4.500h5V7h-5zM9 11.500h6M9 15.500h4"/>', 22, 2.100),
            '📅': svg('<rect x="4.500" y="5.500" width="15" height="14" rx="2.500"/><path d="M4.500 10h15M8.500 3.500v4M15.500 3.500v4"/>', 22, 2.100),
            '💳': svg('<rect x="3.500" y="6" width="17" height="12.500" rx="2.500"/><path d="M3.500 10.500h17M7 15h3.500"/>', 22, 2.100),
            '💬': svg('<path d="M5 6.500A2.500 2.500 0 0 1 7.500 4h9A2.500 2.500 0 0 1 19 6.500v6a2.500 2.500 0 0 1-2.500 2.500H11l-4.500 3.800V15A2.500 2.500 0 0 1 5 12.500Z"/>', 22, 2.100),
            '🔔': svg('<path d="M6.500 16.500c1-1.200 1.500-2.600 1.500-4.500v-1a4 4 0 0 1 8 0v1c0 1.900.5 3.300 1.500 4.500Z"/><path d="M10.300 19.200a2 2 0 0 0 3.400 0"/>', 22, 2.100)
        };
        const mark = document.getElementById('client-notification-mark-all-read');
        if (mark) foot.insertBefore(mark, foot.firstChild);
        const fresh = document.createElement('span');
        fresh.className = 'pis-cp-nt-new';
        title.insertAdjacentElement('afterend', fresh);
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'pis-cp-nt-close';
        x.setAttribute('aria-label', 'Close notifications');
        x.addEventListener('click', event => { event.stopPropagation(); if (!panel.hidden) bell.click(); });
        head.appendChild(x);
        const dress = () => {
            for (const icon of list.querySelectorAll('.client-notification-item-icon, .client-notification-empty-icon')) {
                if (icon.firstElementChild) continue;
                const drawn = DRAWN[icon.textContent.trim()];
                if (drawn) icon.innerHTML = drawn;
            }
            const unread = list.querySelectorAll('.client-notification-item.is-unread').length;
            const words = unread ? `${unread} New` : '';
            if (fresh.textContent !== words) fresh.textContent = words;
            panel.classList.toggle('pis-cp-nt-none', !list.querySelector('.client-notification-item'));
        };
        new MutationObserver(dress).observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        dress();
        document.body.classList.add('pis-cp-bell');
    }
    try { setUpBell(); } catch (error) { console.warn('Notifications new look:', error?.message || error); document.body.classList.remove('pis-cp-bell'); }

    // =====================================================================
    // PART 11: THE POP-UP BOX (Cancel This Service, Log Out, the yes / no questions)
    // =====================================================================
    // The look is all in the styles. Here: the service being cancelled takes its color from the open visit screen and is
    // written the way that screen writes it, the last of the sums is marked as the total, and the sums get shorter labels.
    function setUpBoxes() {
        const SUMS = {
            'original paid service price': 'You Paid', 'weekly discount adjustment': 'Weekly Discount Adjustment', 'restored original-rate value': 'Restored Original Rate',
            'remaining earlier discount adjustment': 'Earlier Discount Adjustment', 'refundable amount before timing policy': 'Refundable Amount',
            'late cancellation deduction (50%)': 'Late Cancellation (50%)', 'account credit you will receive': 'Credit to Your Account'
        };
        const put = (el, words) => { if (el && el.textContent !== words) el.textContent = words; };
        const dress = modal => {
            if (!modal.isConnected || modal.classList.contains('pis-appicon-modal')) return;
            const rows = [...modal.querySelectorAll('.client-cancellation-price')];
            rows.forEach((row, i) => row.classList.toggle('pis-pop-total', i === rows.length - 1));
            for (const row of rows) {
                const label = row.querySelector(':scope > span');
                const words = label && SUMS[label.textContent.replace(/\s+/g, ' ').trim().toLowerCase()];
                if (words) put(label, words);
            }
            if (modal.id !== 'client-cancellation-modal') return;
            const open = document.querySelector('.csd-overlay:not([hidden])');
            const tint = open ? getComputedStyle(open).getPropertyValue('--pkb').trim() : '';
            if (tint) modal.style.setProperty('--pkb', tint); else modal.style.removeProperty('--pkb');
            const name = modal.querySelector('.client-cancellation-service strong');
            if (name) put(name, name.textContent.replace(/\s+-\s+/g, ' · ').replace(/\s+/g, ' ').trim());
            for (const line of modal.querySelectorAll('.client-cancellation-service span')) put(line, line.textContent.replace(/\s+-\s+/g, ' – ').replace(/\s+/g, ' ').trim());
        };
        const watch = modal => {
            if (modal.dataset.cpBox) return;
            modal.dataset.cpBox = '1';
            new MutationObserver(() => dress(modal)).observe(modal, { childList: true, subtree: true });       // the app redraws the box when the sums arrive
            dress(modal);
        };
        new MutationObserver(records => {
            for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1 && node.classList.contains('client-cancellation-modal')) watch(node);
        }).observe(document.body, { childList: true });
        document.querySelectorAll('.client-cancellation-modal').forEach(watch);
    }
    try { setUpBoxes(); } catch (error) { console.warn('Pop-up box new look:', error?.message || error); }

    // =====================================================================
    // PART 12: THE PHOTO VIEWER
    // =====================================================================
    // One viewer for every photo a client can open. A tap on a photo is caught before the app's own viewers see it;
    // if this part cannot start, those viewers open as before.
    function setUpViewer() {
        if (typeof HTMLDialogElement !== 'function' || typeof HTMLDialogElement.prototype.showModal !== 'function') return;
        const ARROW = { back: svg('<path d="M14.500 5.500 8 12l6.500 6.500"/>', 24, 2.400), on: svg('<path d="M9.500 5.500 16 12l-6.500 6.500"/>', 24, 2.400) };
        const words = el => String(el?.textContent || '').replace(/\s+/g, ' ').trim();
        const first = text => String(text || '').split(' · ')[0].trim();
        let view = null;

        // what and when, from the open visit screen's heading: "Dog Walking", "Friday, Nov 20"
        const visitWords = el => {
            const head = el.closest('.csd-overlay')?.querySelector('.pis-cp-vhead');
            return head ? [first(words(head.querySelector('strong'))), first(words(head.querySelector('span')))] : ['', ''];
        };
        // the photo that was tapped and the others shown with it
        function gather(target) {
            const report = target.closest('[data-client-report-image]');
            if (report) {
                const group = [...(report.closest('.client-visit-report-photo-grid') || report.parentElement).querySelectorAll('[data-client-report-image]')];
                const [title, sub] = visitWords(report);
                return { from: report, index: group.indexOf(report), items: group.map(button => ({ url: button.dataset.clientReportImage, small: button.querySelector('img')?.currentSrc || '', alt: button.querySelector('img')?.alt || 'Visit photo', title, sub })) };
            }
            const tile = target.closest('[data-pet-gallery-photo]');
            if (tile) {
                if (typeof window.getVisitPhotoFullUrl !== 'function') return null;
                const group = [...(tile.closest('.pet-gallery-body') || tile.parentElement).querySelectorAll('[data-pet-gallery-photo]')];
                const title = words(tile.closest('.pet-gallery')?.querySelector('.pet-gallery-header h3'));
                return { from: tile, index: group.indexOf(tile), items: group.map(button => ({ path: button.dataset.petGalleryPhoto, small: button.querySelector('img')?.currentSrc || '', alt: title ? `Photo of ${title}` : 'Photo', title, sub: words(button.closest('.pet-gallery-group')?.querySelector('.pet-gallery-group-date')) })) };
            }
            const link = target.closest('.client-boarding-photo-grid a[href]');
            if (link) {
                const group = [...link.closest('.client-boarding-photo-grid').querySelectorAll('a[href]')];
                let [title, sub] = visitWords(link);
                const stamp = words(link.closest('.client-boarding-update')?.querySelector('h3'));
                if (stamp) sub = (!sub || /,/.test(stamp)) ? stamp : `${sub} · ${stamp}`;
                return { from: link, index: group.indexOf(link), items: group.map(a => ({ url: a.href, small: a.querySelector('img')?.currentSrc || '', alt: a.querySelector('img')?.alt || 'Photo', title, sub })) };
            }
            return null;
        }

        function close() {
            const v = view;
            if (!v) return;
            view = null;
            try { if (v.dialog.open) v.dialog.close(); } catch { /* already closed */ }
            v.dialog.remove();
            if (v.from?.isConnected) { try { v.from.focus({ preventScroll: true }); } catch { /* ignore */ } }
        }

        async function show(v, index) {
            const item = v.items[index];
            const turn = ++v.turn;
            const here = () => view === v && v.turn === turn;
            v.index = index;
            v.title.textContent = item.title || '';
            v.sub.textContent = item.sub || '';
            v.count.textContent = `${index + 1} of ${v.items.length}`;
            v.back.disabled = index === 0;
            v.on.disabled = index === v.items.length - 1;
            v.note.hidden = true;
            v.img.alt = item.alt || 'Photo';
            v.img.classList.remove('is-held');
            v.img.style.transform = '';
            if (item.small) { v.img.src = item.small; v.img.classList.add('is-ready'); }          // the small picture at once, the full one as soon as it is in
            else { v.img.classList.remove('is-ready'); v.img.removeAttribute('src'); }
            let url = item.url;
            if (!url && item.path) {
                try { url = await window.getVisitPhotoFullUrl(item.path); } catch { url = ''; }
                if (url) item.url = url;
                if (!here()) return;
            }
            if (!url) { if (!item.small) v.note.hidden = false; return; }
            const full = new Image();
            full.onload = () => { if (here()) { v.img.src = url; v.img.classList.add('is-ready'); } };
            full.onerror = () => { if (here() && !item.small) v.note.hidden = false; };
            full.src = url;
            // the ones on either side, so the next is there at once
            for (const by of [1, -1]) {
                const near = v.items[index + by];
                if (near?.url) new Image().src = near.url;
                else if (near?.path) Promise.resolve(window.getVisitPhotoFullUrl(near.path)).then(found => { if (found) { near.url = found; new Image().src = found; } }).catch(() => {});
            }
        }
        const move = (v, by) => {
            const next = v.index + by;
            if (next < 0 || next >= v.items.length) return false;
            show(v, next);
            return true;
        };

        function open(found) {
            close();
            const many = found.items.length > 1;
            const dialog = document.createElement('dialog');
            dialog.className = 'pis-cp-pv client-report-lightbox-visible' + (many ? '' : ' is-single');      // the second name: the app holds its refreshes while a photo is open
            dialog.setAttribute('aria-label', 'Photo viewer');
            dialog.innerHTML = `<div class="pis-cp-pv-cap"><strong></strong><span></span></div>
                <button type="button" class="pis-cp-pv-close" aria-label="Close photo"></button>
                <div class="pis-cp-pv-stage"><img class="pis-cp-pv-img" alt="" draggable="false"><p class="pis-cp-pv-note" hidden>This photo couldn’t load. Check your connection and try again.</p></div>
                <div class="pis-cp-pv-bar"><button type="button" class="pis-cp-pv-nav" data-by="-1" aria-label="Previous photo">${ARROW.back}</button><span class="pis-cp-pv-count" aria-live="polite"></span><button type="button" class="pis-cp-pv-nav" data-by="1" aria-label="Next photo">${ARROW.on}</button></div>`;
            const [back, on] = dialog.querySelectorAll('.pis-cp-pv-nav');
            const v = view = { dialog, items: found.items, from: found.from, index: 0, turn: 0, swiped: 0, back, on, img: dialog.querySelector('.pis-cp-pv-img'), note: dialog.querySelector('.pis-cp-pv-note'),
                title: dialog.querySelector('.pis-cp-pv-cap strong'), sub: dialog.querySelector('.pis-cp-pv-cap span'), count: dialog.querySelector('.pis-cp-pv-count') };

            dialog.addEventListener('click', event => {
                event.stopPropagation();                                                // nothing under the viewer hears a tap in it
                if (Date.now() - v.swiped < 400) return;                                // the tap a swipe ends with
                const target = event.target instanceof Element ? event.target : dialog;
                if (target.closest('.pis-cp-pv-close')) { close(); return; }
                const nav = target.closest('.pis-cp-pv-nav');
                if (nav) { move(v, Number(nav.dataset.by)); return; }
                if (target.closest('.pis-cp-pv-stage') && !target.closest('.pis-cp-pv-img')) close();     // a tap on the dark beside the photo closes it, as the old viewers did
            });
            dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
            dialog.addEventListener('keydown', event => {
                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
                else if (event.key === 'ArrowRight') { event.preventDefault(); move(v, 1); }
                else if (event.key === 'ArrowLeft') { event.preventDefault(); move(v, -1); }
            });
            // a finger: the photo follows it sideways, and past a short way it changes
            let x0 = null, y0 = 0, dx = 0, held = false;
            dialog.addEventListener('touchstart', event => {
                if (event.touches.length !== 1) { x0 = null; return; }
                x0 = event.touches[0].clientX; y0 = event.touches[0].clientY; dx = 0; held = false;
            }, { passive: true });
            dialog.addEventListener('touchmove', event => {
                if (x0 === null || !many) return;
                const mx = event.touches[0].clientX - x0, my = event.touches[0].clientY - y0;
                if (!held) {
                    if (Math.abs(mx) < 10 || Math.abs(mx) < Math.abs(my) * 1.3) return;
                    held = true;
                    v.img.classList.add('is-held');
                }
                const atEnd = (mx > 0 && v.index === 0) || (mx < 0 && v.index === v.items.length - 1);
                dx = mx;
                v.img.style.transform = `translate3d(${Math.round(atEnd ? mx * .25 : mx)}px,0,0)`;
            }, { passive: true });
            const lift = () => {
                if (x0 === null) return;
                x0 = null;
                if (!held) return;
                held = false;
                v.swiped = Date.now();
                v.img.classList.remove('is-held');
                if (Math.abs(dx) > 45 && move(v, dx < 0 ? 1 : -1)) return;             // show() puts the photo back in the middle
                v.img.style.transform = '';
            };
            dialog.addEventListener('touchend', lift);
            dialog.addEventListener('touchcancel', lift);

            document.body.appendChild(dialog);
            dialog.showModal();
            show(v, Math.min(found.items.length - 1, Math.max(0, found.index)));
            dialog.querySelector('.pis-cp-pv-close').focus({ preventScroll: true });
        }

        // before the app's own viewers (they listen lower down)
        window.addEventListener('click', event => {
            if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const target = event.target instanceof Element ? event.target : null;
            if (!target || target.closest('dialog.pis-cp-pv')) return;
            let found = null;
            try { found = gather(target); } catch (error) { console.warn('Photo viewer:', error?.message || error); }
            if (!found || !found.items.length) return;
            event.preventDefault();
            event.stopPropagation();
            try { open(found); } catch (error) { console.warn('Photo viewer:', error?.message || error); close(); }
        }, true);
        document.body.classList.add('pis-cp-pv-on');
    }
    try { setUpViewer(); } catch (error) { console.warn('Photo viewer new look:', error?.message || error); document.body.classList.remove('pis-cp-pv-on'); }

    // ---------- left menu (computers): Messages, and who is signed in ----------
    function setUpSidebar() {
        const nav = document.querySelector('.client-desktop-sidebar-nav');
        const launcher = document.getElementById('client-message-launcher');
        const profileItem = nav?.querySelector('[data-client-desktop-tab="profile"]');
        if (nav && launcher && profileItem && !nav.querySelector('.pis-cp-nav-messages')) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'client-desktop-nav-item pis-cp-nav-messages';
            item.innerHTML = `<span class="client-desktop-nav-icon" aria-hidden="true">${ICON.chat}</span><span>Messages</span><em class="pis-cp-nav-badge" hidden></em>`;
            item.addEventListener('click', () => launcher.click());      // the app's own way of opening Messages
            profileItem.insertAdjacentElement('beforebegin', item);
            document.body.classList.add('pis-cp-menu-messages');
            const source = document.getElementById('client-message-unread-badge');
            const badge = item.querySelector('.pis-cp-nav-badge');
            const mirror = () => {
                const unread = parseInt(source?.textContent || '0', 10) || 0;
                const on = Boolean(source) && source.style.display !== 'none' && unread > 0;
                badge.hidden = !on;
                badge.textContent = on ? String(unread) : '';
                item.setAttribute('aria-label', on ? `Messages, ${unread} Unread` : 'Messages');
            };
            if (source) new MutationObserver(mirror).observe(source, { attributes: true, attributeFilter: ['style'], childList: true, characterData: true, subtree: true });
            mirror();
        }
        const footer = document.querySelector('.client-desktop-sidebar-footer');
        if (footer && !footer.querySelector('.pis-cp-me')) {
            footer.classList.add('pis-cp-foot');
            footer.insertAdjacentHTML('afterbegin', '<b class="pis-cp-me" aria-hidden="true"></b>');
            for (const id of ['client-desktop-sidebar-name', 'client-desktop-sidebar-credit']) {
                const el = document.getElementById(id);
                if (el) new MutationObserver(tidySidebar).observe(el, { childList: true, characterData: true, subtree: true });
            }
        }
        tidySidebar();
    }
    function tidySidebar() {
        const me = document.querySelector('.pis-cp-me');
        const name = String(document.getElementById('client-desktop-sidebar-name')?.textContent || '').trim();
        if (me) {
            const parts = name.split(/\s+/).filter(Boolean);
            const initials = ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
            if (me.textContent !== initials) me.textContent = initials;
        }
        // "Account credit $45.00" reads "$45.00 Account Credit" on one line ("$45.00 Credit" if the menu is too narrow for that)
        const credit = document.getElementById('client-desktop-sidebar-credit');
        if (!credit) return;
        const text = String(credit.textContent || '').trim();
        const fresh = text.match(/^Account credit\s+(\$[\d,.]+)$/i);
        if (fresh) credit.dataset.cpAmount = fresh[1];
        else if (!text) delete credit.dataset.cpAmount;
        const amount = credit.dataset.cpAmount;
        const key = `${amount || ''}|${credit.clientWidth}`;
        if (!amount || (!fresh && key === credit.dataset.cpFit)) return;
        credit.dataset.cpFit = key;
        fit(credit, [`${amount} Account Credit`, `${amount} Credit`], [0]);
    }
    try { setUpSidebar(); } catch (error) { console.warn('Left menu new look:', error?.message || error); }


    let queued = false;
    function refresh() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            drawPets();              // first: nothing may measure the page while freshly drawn pet cards are waiting
            addLogout();
            hangGarland();
            words();
            document.body.classList.toggle('pis-cp-home', screenNow() === 'home');
            tidySidebar();
            placeTalk();
            drawTalk();
            drawProfile();
            drawHome();
            drawServices();
        });
    }
    new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    for (const id of ['welcome-name', 'pet-info']) {
        const el = document.getElementById(id);
        if (!el) continue;
        // The pets list is dressed in the same breath as the app redraws it, not a frame later: a
        // refresh never leaves a moment without the photo, the "Walks With Us" numbers and the rows.
        const watch = new MutationObserver(() => {
            if (id === 'pet-info') { drawPets(); watch.takeRecords(); }      // its own changes don't call it back
            refresh();
        });
        watch.observe(el, { childList: true, characterData: true, subtree: true });
    }
    new MutationObserver(refresh).observe(header.parentElement || document.body, { childList: true });     // the garland arriving
    window.addEventListener('resize', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });             // a new day while the app was away
    document.fonts?.ready?.then(() => { shown = ''; refresh(); });
    refresh();
})();
