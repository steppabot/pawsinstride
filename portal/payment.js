// ========================================
// PAWS IN STRIDE - SECURE CHECKOUT
// ========================================


// ========================================
// SUPABASE CONFIG
// ========================================

const SUPABASE_URL =
    "https://xyhndwopvlmnxjkthtkl.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_U3OIYatZuBUe8Y6Vq0DS2w_IMacau2j";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession:
                    true,

                autoRefreshToken:
                    true,

                detectSessionInUrl:
                    true
            }
        }
    );


// ========================================
// PAYPAL SANDBOX CLIENT ID
// ========================================

const PAYPAL_CLIENT_ID =
    "BAAVcKVQ0rmCromROr57TzR6ex0A8nCD6eufi_rwCYCsX2nYFYAcDywOEkAT97zy4A5hzdQ7_hOm7o68e8";


// ========================================
// PAGE STATE
// ========================================

let checkoutId =
    null;


let checkoutData =
    null;


let checkoutVisits =
    [];

let checkoutPets =
    [];

let currentUser =
    null;


let paypalSdkLoaded =
    false;


let pageLoaded =
    false;


let paymentMethodsInitialized =
    false;


let checkoutExpired =
    false;


let expirationTimer =
    null;


// ========================================
// ELEMENTS
// ========================================

const paymentSummaryContent =
    document.getElementById(
        "payment-summary-content"
    );


const paymentMessage =
    document.getElementById(
        "payment-message"
    );


const paypalWrapper =
    document.getElementById(
        "paypal-payment-wrapper"
    );


const paypalButton =
    document.getElementById(
        "paypal-button"
    );


const venmoWrapper =
    document.getElementById(
        "venmo-payment-wrapper"
    );


const venmoButton =
    document.getElementById(
        "venmo-button"
    );


const cardWrapper =
    document.getElementById(
        "card-payment-wrapper"
    );


const cardPayButton =
    document.getElementById(
        "card-pay-button"
    );


const cardNumberContainer =
    document.getElementById(
        "paypal-card-fields-number"
    );


const cardExpiryContainer =
    document.getElementById(
        "paypal-card-fields-expiry"
    );


const cardCvvContainer =
    document.getElementById(
        "paypal-card-fields-cvv"
    );

// ========================================
// GOOGLE PAY ELEMENTS
// ========================================

const googlePayWrapper =
    document.getElementById(
        "google-pay-wrapper"
    );


const googlePayButtonContainer =
    document.getElementById(
        "google-pay-button"
    );

// ========================================
// APPLE PAY ELEMENTS
// ========================================

const applePayWrapper =
    document.getElementById(
        "apple-pay-wrapper"
    );


const applePayButton =
    document.getElementById(
        "apple-pay-button"
    );

// ========================================
// FORMAT MONEY
// ========================================

function formatMoney(
    cents,
    currency = "USD"
) {

    return new Intl.NumberFormat(
        "en-US",
        {
            style:
                "currency",

            currency:
                String(
                    currency ||
                    "USD"
                ).toUpperCase()
        }
    ).format(
        Number(cents || 0) /
        100
    );

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const [
        year,
        month,
        day
    ] =
        dateString
            .split("-")
            .map(Number);


    const date =
        new Date(
            year,
            month - 1,
            day
        );


    return date.toLocaleDateString(
        "en-US",
        {
            weekday:
                "short",

            month:
                "short",

            day:
                "numeric",

            year:
                "numeric"
        }
    );

}


// ========================================
// SET MESSAGE
// ========================================

function setPaymentMessage(
    message,
    type = ""
) {

    paymentMessage.textContent =
        message;


    paymentMessage.style.color =
        type === "error"
            ? "#b42318"
            : type === "success"
                ? "#067647"
                : "";

}


// ========================================
// DISABLE PAYMENT METHODS
// ========================================

function disablePaymentMethods() {

    if (paypalButton) {

        paypalButton.setAttribute(
            "disabled",
            ""
        );

    }


    if (venmoButton) {

        venmoButton.setAttribute(
            "disabled",
            ""
        );

    }


    if (cardPayButton) {

        cardPayButton.disabled =
            true;

    }

}


// ========================================
// HIDE PAYMENT METHODS
// ========================================

function hidePaymentMethods() {

    if (paypalWrapper) {

        paypalWrapper.hidden =
            true;

    }


    if (venmoWrapper) {

        venmoWrapper.hidden =
            true;

    }


    if (cardWrapper) {

        cardWrapper.hidden =
            true;

    }


    if (googlePayWrapper) {

        googlePayWrapper.hidden =
            true;

    }


    if (applePayWrapper) {

        applePayWrapper.hidden =
            true;

    }

}


// ========================================
// SHOW EXPIRED CHECKOUT STATE
// ========================================

function showExpiredCheckoutState() {

    // ========================================
    // HIDE ENTIRE PAYMENT CARD
    // ========================================

    const paymentMethodsSection =
        document.getElementById(
            "payment-methods"
        );


    if (
        paymentMethodsSection
    ) {

        paymentMethodsSection.hidden =
            true;

    }


    // ========================================
    // PREVENT DUPLICATE EXPIRED STATE
    // ========================================

    const existingExpiredState =
        document.getElementById(
            "checkout-expired-state"
        );


    if (
        existingExpiredState
    ) {

        return;

    }


    // ========================================
    // EXPIRED STATE
    // ========================================

    const expiredState =
        document.createElement(
            "div"
        );


    expiredState.id =
        "checkout-expired-state";


    expiredState.className =
        "payment-expired-state";


    // ========================================
    // TITLE
    // ========================================

    const expiredTitle =
        document.createElement(
            "strong"
        );


    expiredTitle.className =
        "payment-expired-title";


    expiredTitle.textContent =
        "Checkout Expired";


    // ========================================
    // MESSAGE
    // ========================================

    const expiredMessage =
        document.createElement(
            "p"
        );


    expiredMessage.className =
        "payment-expired-message";


    expiredMessage.textContent =
        "This checkout has expired. Please return to the portal and select your services again.";


    // ========================================
    // BACK TO PORTAL BUTTON
    // ========================================

    const backToPortalButton =
        document.createElement(
            "a"
        );


    backToPortalButton.href =
        "./dashboard.html";


    backToPortalButton.className =
        "payment-expired-button";


    backToPortalButton.textContent =
        "Back to Portal";


    // ========================================
    // BUILD STATE
    // ========================================

    expiredState.appendChild(
        expiredTitle
    );


    expiredState.appendChild(
        expiredMessage
    );


    expiredState.appendChild(
        backToPortalButton
    );


    paymentSummaryContent.appendChild(
        expiredState
    );

}
// ========================================
// GET CHECKOUT ID
// ========================================

function getCheckoutIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get(
        "checkout"
    );

}

// ========================================
// LOAD SIGNED-IN USER
// ========================================

async function loadCurrentUser() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getUser();


    if (
        error ||
        !data?.user
    ) {

        window.location.href =
            "./login.html";

        return false;

    }


    currentUser =
        data.user;


    return true;

}


// ========================================
// LOAD CHECKOUT
// ========================================

async function loadCheckout() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "booking_checkouts"
            )
            .select(`
                id,
                client_id,
                status,
                payment_provider,
                currency,
                subtotal_cents,
                surcharge_cents,
                total_cents,
                credit_applied_cents,
                amount_due_cents,
                credit_applied_at,
                paypal_order_id,
                paypal_capture_id,
                payment_confirmed_at,
                expires_at,
                created_at
            `)
            .eq(
                "id",
                checkoutId
            )
            .eq(
                "client_id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Checkout load error:",
            error
        );


        throw new Error(
            "We couldn't load your checkout."
        );

    }


    if (!data) {

        throw new Error(
            "This checkout could not be found."
        );

    }


    checkoutData =
        data;

}


// ========================================
// APPLY ACCOUNT CREDIT TO CHECKOUT
// ========================================

async function applyAccountCreditToCheckout() {

    if (!checkoutId) {

        throw new Error(
            "Checkout ID is required to apply account credit."
        );

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .rpc(
                "apply_account_credit_to_checkout",
                {
                    p_checkout_id:
                        checkoutId
                }
            );


    if (error) {

        console.error(
            "Account credit error:",
            error
        );


        throw new Error(
            error.message ||
            "We couldn't apply your account credit."
        );

    }


    const result =
        Array.isArray(data)
            ? data[0]
            : data;


    if (!result) {

        throw new Error(
            "Account credit information was not returned."
        );

    }


    checkoutData.credit_applied_cents =
        Number(
            result.credit_applied_cents ||
            0
        );


    checkoutData.amount_due_cents =
        Number(
            result.amount_due_cents ??
            checkoutData.total_cents ??
            0
        );


    checkoutData.remaining_credit_cents =
        Number(
            result.remaining_credit_cents ||
            0
        );


    return result;

}

// ========================================
// LOAD ACCOUNT CREDIT BALANCE
// ========================================

async function loadAccountCreditBalance() {

    const {
        data,
        error
    } =
        await supabaseClient
            .rpc(
                "get_account_credit_balance"
            );


    if (error) {

        console.error(
            "Account credit balance error:",
            error
        );


        throw new Error(
            error.message ||
            "We couldn't load your account credit."
        );

    }


    checkoutData.available_credit_cents =
        Number(
            data ||
            0
        );

}


// ========================================
// LOAD CHECKOUT VISITS
// ========================================

async function loadCheckoutVisits() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "booking_checkout_visits"
            )
            .select(`
                id,
                visit_date,
                service_name,
                service_type,
                service_option,
                time_window,
                total_price_cents
            `)
            .eq(
                "checkout_id",
                checkoutId
            )
            .order(
                "visit_date",
                {
                    ascending:
                        true
                }
            )
            .order(
                "id",
                {
                    ascending:
                        true
                }
            );


    if (error) {

        console.error(
            "Checkout visit load error:",
            error
        );


        throw new Error(
            "We couldn't load your service details."
        );

    }


    checkoutVisits =
        data ||
        [];

}
// ========================================
// LOAD CHECKOUT PETS
// ========================================

async function loadCheckoutPets() {

    const {
        data:
            checkoutPetRows,
        error:
            checkoutPetError
    } =
        await supabaseClient
            .from(
                "booking_checkout_pets"
            )
            .select(`
                pet_id,
                is_primary
            `)
            .eq(
                "checkout_id",
                checkoutId
            );


    if (
        checkoutPetError
    ) {

        console.error(
            "Checkout pet load error:",
            checkoutPetError
        );


        throw new Error(
            "We couldn't load your pet details."
        );

    }


    const petIds =
        (
            checkoutPetRows ||
            []
        )
            .map(
                row =>
                    row.pet_id
            )
            .filter(
                petId =>
                    petId !==
                    null &&
                    petId !==
                    undefined
            );


    if (
        petIds.length ===
        0
    ) {

        checkoutPets =
            [];

        return;

    }


    const {
        data:
            petRows,
        error:
            petError
    } =
        await supabaseClient
            .from(
                "pets"
            )
            .select(`
                id,
                name
            `)
            .in(
                "id",
                petIds
            )
            .eq(
                "client_id",
                currentUser.id
            );


    if (
        petError
    ) {

        console.error(
            "Pet name load error:",
            petError
        );


        throw new Error(
            "We couldn't load your pet details."
        );

    }


    const petMap =
        new Map(
            (
                petRows ||
                []
            )
                .map(
                    pet => [
                        pet.id,
                        pet
                    ]
                )
        );


    checkoutPets =
        (
            checkoutPetRows ||
            []
        )
            .map(
                row => {

                    const pet =
                        petMap.get(
                            row.pet_id
                        );


                    if (
                        !pet
                    ) {

                        return null;

                    }


                    return {
                        id:
                            pet.id,

                        name:
                            pet.name,

                        is_primary:
                            Boolean(
                                row.is_primary
                            )
                    };

                }
            )
            .filter(
                Boolean
            );

}

// ========================================
// BUILD SUMMARY
// ========================================
function renderCheckoutSummary() {

    paymentSummaryContent.innerHTML =
        "";


    const paymentLayout =
        document.querySelector(
            ".payment-layout"
        );


    if (paymentLayout) {

        paymentLayout.classList.toggle(
            "payment-layout-multi",
            checkoutVisits.length >= 2
        );

    }

    // ========================================
    // PET NAMES
    // ========================================

    const petNames =
        checkoutPets
            .map(
                pet =>
                    pet.name
            )
            .filter(
                Boolean
            );


    // ========================================
    // SERVICE ROWS GROUPED BY DATE
    // ========================================
    
    if (
        checkoutVisits.length >
        0
    ) {
    
        // ========================================
        // GROUP VISITS BY DATE
        // ========================================
    
        const visitsByDate =
            new Map();
    
    
        checkoutVisits.forEach(
            visit => {
    
                const visitDate =
                    visit.visit_date;
    
    
                if (
                    !visitsByDate.has(
                        visitDate
                    )
                ) {
    
                    visitsByDate.set(
                        visitDate,
                        []
                    );
    
                }
    
    
                visitsByDate
                    .get(
                        visitDate
                    )
                    .push(
                        visit
                    );
    
            }
        );
    
    
        // ========================================
        // PET NAME SUMMARY
        // ========================================
    
        const petNameSummary =
            petNames.join(
                " + "
            );
    
    
        // ========================================
        // BUILD DATE GROUPS
        // ========================================
    
        let dateGroupIndex =
            0;
    
    
        visitsByDate.forEach(
            (
                visits,
                visitDate
            ) => {
    
                const dateGroup =
                    document.createElement(
                        "div"
                    );
    
    
                dateGroup.className =
                    "payment-summary-date-group";
    
    
                // ========================================
                // DATE GROUP HEADER
                // ========================================
    
                const dateHeader =
                    document.createElement(
                        "button"
                    );
    
    
                dateHeader.type =
                    "button";
    
    
                dateHeader.className =
                    "payment-summary-date-header";
    
    
                dateHeader.setAttribute(
                    "aria-expanded",
                    dateGroupIndex === 0
                        ? "true"
                        : "false"
                );
    
    
                // ========================================
                // DATE HEADER TEXT
                // ========================================
    
                const dateHeaderText =
                    document.createElement(
                        "div"
                    );
    
    
                dateHeaderText.className =
                    "payment-summary-date-header-text";
    
    
                const dateTitle =
                    document.createElement(
                        "div"
                    );
    
    
                dateTitle.className =
                    "payment-summary-date-title";
    
    
                dateTitle.textContent =
                    formatDate(
                        visitDate
                    );
    
    
                const dateMeta =
                    document.createElement(
                        "div"
                    );
    
    
                dateMeta.className =
                    "payment-summary-date-meta";
    
    
                const serviceCount =
                    visits.length;
    
    
                const serviceLabel =
                    serviceCount === 1
                        ? "service"
                        : "services";
    
    
                dateMeta.textContent =
                    [
                        petNameSummary,
                        `${serviceCount} ${serviceLabel}`
                    ]
                        .filter(
                            Boolean
                        )
                        .join(
                            " • "
                        );
    
    
                dateHeaderText.appendChild(
                    dateTitle
                );
    
    
                dateHeaderText.appendChild(
                    dateMeta
                );
    
    
                // ========================================
                // DATE HEADER ARROW
                // ========================================
    
                const dateArrow =
                    document.createElement(
                        "span"
                    );
    
    
                dateArrow.className =
                    "payment-summary-date-arrow";
    
    
                dateArrow.textContent =
                    dateGroupIndex === 0
                        ? "▴"
                        : "▾";
    
    
                dateHeader.appendChild(
                    dateHeaderText
                );
    
    
                dateHeader.appendChild(
                    dateArrow
                );
    
    
                // ========================================
                // DATE GROUP CONTENT
                // ========================================
    
                const dateContent =
                    document.createElement(
                        "div"
                    );
    
    
                dateContent.className =
                    "payment-summary-date-content";
    
    
                dateContent.hidden =
                    dateGroupIndex !== 0;
    
    
                // ========================================
                // SORT VISITS WITHIN DATE
                // ========================================
                
                function getTimeWindowStartMinutes(
                    timeWindow
                ) {
                
                    const startTime =
                        String(
                            timeWindow ||
                            ""
                        )
                            .split(
                                "-"
                            )[0]
                            .trim();
                
                
                    const match =
                        startTime.match(
                            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
                        );
                
                
                    if (
                        !match
                    ) {
                
                        return 9999;
                
                    }
                
                
                    let hours =
                        Number(
                            match[1]
                        );
                
                
                    const minutes =
                        Number(
                            match[2]
                        );
                
                
                    const period =
                        match[3]
                            .toUpperCase();
                
                
                    if (
                        period ===
                        "AM" &&
                        hours ===
                        12
                    ) {
                
                        hours =
                            0;
                
                    }
                
                
                    if (
                        period ===
                        "PM" &&
                        hours !==
                        12
                    ) {
                
                        hours +=
                            12;
                
                    }
                
                
                    return (
                        hours *
                        60
                    ) +
                    minutes;
                
                }
                
                
                visits.sort(
                    (
                        firstVisit,
                        secondVisit
                    ) => {
                
                        return (
                            getTimeWindowStartMinutes(
                                firstVisit.time_window
                            ) -
                            getTimeWindowStartMinutes(
                                secondVisit.time_window
                            )
                        );
                
                    }
                );
                
                
                // ========================================
                // BUILD SERVICE ROWS
                // ========================================
    
                visits.forEach(
                    visit => {
    
                        const row =
                            document.createElement(
                                "div"
                            );
    
    
                        row.className =
                            "payment-summary-service";
    
    
                        // ========================================
                        // SERVICE NAME
                        // ========================================
    
                        const serviceName =
                            document.createElement(
                                "div"
                            );
    
    
                        serviceName.className =
                            "payment-summary-service-name";
    
    
                        serviceName.textContent =
                            visit.service_name ||
                            visit.service_type ||
                            "Pet Care Service";
    
    
                        // ========================================
                        // PET CHIPS
                        // ========================================
    
                        const petList =
                            document.createElement(
                                "div"
                            );
    
    
                        petList.className =
                            "payment-summary-pets";
    
    
                        if (
                            petNames.length >
                            0
                        ) {
    
                            petNames.forEach(
                                petName => {
    
                                    const petChip =
                                        document.createElement(
                                            "span"
                                        );
    
    
                                    petChip.className =
                                        "payment-summary-pet-chip";
    
    
                                    petChip.textContent =
                                        petName;
    
    
                                    petList.appendChild(
                                        petChip
                                    );
    
                                }
                            );
    
                        }
    
    
                        // ========================================
                        // SERVICE DETAILS
                        // ========================================
    
                        const serviceDetails =
                            document.createElement(
                                "div"
                            );
    
    
                        serviceDetails.className =
                            "payment-summary-service-details";
    
    
                        serviceDetails.textContent =
                            visit.time_window ||
                            "";
    
    
                        // ========================================
                        // SERVICE PRICE
                        // ========================================
    
                        const servicePrice =
                            document.createElement(
                                "div"
                            );
    
    
                        servicePrice.className =
                            "payment-summary-service-price";
    
    
                        servicePrice.textContent =
                            formatMoney(
                                visit.total_price_cents,
                                checkoutData.currency
                            );
    
    
                        // ========================================
                        // ADD SERVICE ROW
                        // ========================================
    
                        row.appendChild(
                            serviceName
                        );
    
    
                        if (
                            petNames.length >
                            0
                        ) {
    
                            row.appendChild(
                                petList
                            );
    
                        }
    
    
                        row.appendChild(
                            serviceDetails
                        );
    
    
                        row.appendChild(
                            servicePrice
                        );
    
    
                        dateContent.appendChild(
                            row
                        );
    
                    }
                );
    
    
                // ========================================
                // TOGGLE DATE GROUP
                // ========================================
    
                dateHeader.addEventListener(
                    "click",
                    () => {
    
                        const willOpen =
                            dateContent.hidden;
    
    
                        dateContent.hidden =
                            !willOpen;
    
    
                        dateHeader.setAttribute(
                            "aria-expanded",
                            willOpen
                                ? "true"
                                : "false"
                        );
    
    
                        dateArrow.textContent =
                            willOpen
                                ? "▴"
                                : "▾";
    
                    }
                );
    
    
                // ========================================
                // ADD DATE GROUP
                // ========================================
    
                dateGroup.appendChild(
                    dateHeader
                );
    
    
                dateGroup.appendChild(
                    dateContent
                );
    
    
                paymentSummaryContent.appendChild(
                    dateGroup
                );
    
    
                dateGroupIndex +=
                    1;
    
            }
        );
    
    }
    
    // ========================================
    // CHECKOUT TOTALS
    // ========================================
    
    const originalTotalCents =
        Number(
            checkoutData.total_cents ||
            0
        );
    
    
    const creditAppliedCents =
        Number(
            checkoutData.credit_applied_cents ||
            0
        );
    
    
    const amountDueCents =
        Number(
            checkoutData.amount_due_cents ??
            originalTotalCents
        );
    
    
    const availableCreditCents =
        Number(
            checkoutData.available_credit_cents ||
            0
        );
    
    
    // ========================================
    // SERVICE TOTAL
    // ========================================
    
    const totalRow =
        document.createElement(
            "div"
        );
    
    
    totalRow.className =
        "payment-summary-total";
    
    
    const totalLabel =
        document.createElement(
            "span"
        );
    
    
    totalLabel.textContent =
        creditAppliedCents > 0
            ? "Service Total"
            : "Total";
    
    
    const totalAmount =
        document.createElement(
            "span"
        );
    
    
    totalAmount.textContent =
        formatMoney(
            originalTotalCents,
            checkoutData.currency
        );
    
    
    totalRow.appendChild(
        totalLabel
    );
    
    
    totalRow.appendChild(
        totalAmount
    );
    
    
    paymentSummaryContent.appendChild(
        totalRow
    );
    
    
    // ========================================
    // AVAILABLE ACCOUNT CREDIT
    // ========================================
    
    if (
        availableCreditCents > 0 &&
        creditAppliedCents === 0
    ) {
    
        const creditAvailableRow =
            document.createElement(
                "div"
            );
    
    
        creditAvailableRow.className =
            "payment-summary-credit-available";
    
    
        const creditAvailableInfo =
            document.createElement(
                "div"
            );
    
    
        const creditAvailableLabel =
            document.createElement(
                "span"
            );
    
    
        creditAvailableLabel.textContent =
            "Account Credit Available";
    
    
        const creditAvailableAmount =
            document.createElement(
                "strong"
            );
    
    
        creditAvailableAmount.textContent =
            formatMoney(
                availableCreditCents,
                checkoutData.currency
            );
    
    
        creditAvailableInfo.appendChild(
            creditAvailableLabel
        );
    
    
        creditAvailableInfo.appendChild(
            creditAvailableAmount
        );
    
    
        const applyCreditButton =
            document.createElement(
                "button"
            );
    
    
        applyCreditButton.type =
            "button";
    
    
        applyCreditButton.className =
            "payment-apply-credit-button";
    
    
        applyCreditButton.textContent =
            "APPLY";
    
    
        applyCreditButton.addEventListener(
            "click",
            async () => {
    
                try {
    
                    applyCreditButton.disabled =
                        true;
    
    
                    applyCreditButton.textContent =
                        "APPLYING...";
    
    
                    setPaymentMessage(
                        "Applying account credit..."
                    );
    
    
                    const result =
                        await applyAccountCreditToCheckout();
    
    
                    checkoutData.available_credit_cents =
                        Number(
                            result.remaining_credit_cents ||
                            0
                        );
    
    
                    renderCheckoutSummary();
    
    
                    const updatedAmountDueCents =
                        Number(
                            checkoutData.amount_due_cents ??
                            checkoutData.total_cents ??
                            0
                        );
    
    
                    if (
                        updatedAmountDueCents === 0
                    ) {
    
                        hidePaymentMethods();
    
    
                        setPaymentMessage(
                            "Your account credit covers the full booking.",
                            "success"
                        );
    
                    }
                    else {
    
                        setPaymentMessage(
                            `Account credit applied. ${formatMoney(
                                updatedAmountDueCents,
                                checkoutData.currency
                            )} remains due.`,
                            "success"
                        );
    
                    }
    
                }
                catch (
                    error
                ) {
    
                    console.error(
                        "Apply account credit error:",
                        error
                    );
    
    
                    applyCreditButton.disabled =
                        false;
    
    
                    applyCreditButton.textContent =
                        "APPLY";
    
    
                    setPaymentMessage(
                        error instanceof Error
                            ? error.message
                            : "We couldn't apply your account credit.",
                        "error"
                    );
    
                }
    
            }
        );
    
    
        creditAvailableRow.appendChild(
            creditAvailableInfo
        );
    
    
        creditAvailableRow.appendChild(
            applyCreditButton
        );
    
    
        paymentSummaryContent.appendChild(
            creditAvailableRow
        );
    
    }
    
    
    // ========================================
    // APPLIED ACCOUNT CREDIT
    // ========================================
    
    if (
        creditAppliedCents > 0
    ) {
    
        const creditRow =
            document.createElement(
                "div"
            );
    
    
        creditRow.className =
            "payment-summary-credit";
    
    
        const creditLabel =
            document.createElement(
                "span"
            );
    
    
        creditLabel.textContent =
            "Account Credit";
    
    
        const creditAmount =
            document.createElement(
                "span"
            );
    
    
        creditAmount.textContent =
            `-${formatMoney(
                creditAppliedCents,
                checkoutData.currency
            )}`;
    
    
        creditRow.appendChild(
            creditLabel
        );
    
    
        creditRow.appendChild(
            creditAmount
        );
    
    
        paymentSummaryContent.appendChild(
            creditRow
        );
    
    
        // ========================================
        // AMOUNT DUE
        // ========================================
    
        const amountDueRow =
            document.createElement(
                "div"
            );
    
    
        amountDueRow.className =
            "payment-summary-total";
    
    
        const amountDueLabel =
            document.createElement(
                "span"
            );
    
    
        amountDueLabel.textContent =
            "Amount Due";
    
    
        const amountDueAmount =
            document.createElement(
                "span"
            );
    
    
        amountDueAmount.textContent =
            formatMoney(
                amountDueCents,
                checkoutData.currency
            );
    
    
        amountDueRow.appendChild(
            amountDueLabel
        );
    
    
        amountDueRow.appendChild(
            amountDueAmount
        );
    
    
        paymentSummaryContent.appendChild(
            amountDueRow
        );
    
    
        // ========================================
        // FULL CREDIT CONFIRMATION
        // ========================================
    
        if (
            amountDueCents === 0
        ) {
    
            const completeCreditButton =
                document.createElement(
                    "button"
                );
    
    
            completeCreditButton.type =
                "button";
    
    
            completeCreditButton.className =
                "payment-complete-credit-button";
    
    
            completeCreditButton.textContent =
                "Complete Booking with Credit";
    
    
            completeCreditButton.addEventListener(
                "click",
                async () => {
    
                    try {
    
                        if (
                            checkoutExpired
                        ) {
    
                            throw new Error(
                                "This checkout has expired."
                            );
    
                        }
    
    
                        completeCreditButton.disabled =
                            true;
    
    
                        completeCreditButton.textContent =
                            "CONFIRMING...";
    
    
                        setPaymentMessage(
                            "Confirming your booking..."
                        );
    
    
                        const result =
                            await completeCheckoutWithAccountCredit();
    
    
                        checkoutData.status =
                            "completed";
    
    
                        handlePaymentSuccess(
                            result
                        );
    
                    }
                    catch (
                        error
                    ) {
    
                        console.error(
                            "Complete credit booking error:",
                            error
                        );
    
    
                        completeCreditButton.disabled =
                            false;
    
    
                        completeCreditButton.textContent =
                            "Complete Booking with Credit";
    
    
                        setPaymentMessage(
                            error instanceof Error
                                ? error.message
                                : "We couldn't complete your booking.",
                            "error"
                        );
    
                    }
    
                }
            );
    
    
            paymentSummaryContent.appendChild(
                completeCreditButton
            );
    
        }

}
    
    // ========================================
    // EXPIRATION
    // ========================================

    const expiration =
        document.createElement(
            "div"
        );


    expiration.id =
        "checkout-expiration";


    expiration.className =
        "payment-summary-expiration";


    paymentSummaryContent.appendChild(
        expiration
    );

}

// ========================================
// RELEASE EXPIRED CHECKOUT CREDIT
// ========================================

async function releaseExpiredCheckoutCredit() {

    const {
        data,
        error
    } =
        await supabaseClient
            .rpc(
                "release_expired_checkout_credit",
                {
                    p_checkout_id:
                        checkoutId
                }
            );


    if (error) {

        console.error(
            "Expired checkout credit release error:",
            error
        );


        throw new Error(
            error.message ||
            "Account credit could not be released."
        );

    }


    const releasedCreditCents =
        Number(
            data ||
            0
        );


    return releasedCreditCents;

}


// ========================================
// EXPIRATION TIMER
// ========================================

function startExpirationTimer() {

    const expirationElement =
        document.getElementById(
            "checkout-expiration"
        );


    if (
        !expirationElement ||
        !checkoutData?.expires_at
    ) {

        return;

    }


    let expirationHandled =
        false;


    async function updateTimer() {

        const expires =
            new Date(
                checkoutData.expires_at
            ).getTime();


        const remaining =
            expires -
            Date.now();


        if (
            remaining <=
            0
        ) {

            if (
                expirationHandled
            ) {

                return;

            }


            expirationHandled =
                true;


            checkoutExpired =
                true;


            if (expirationTimer) {

                clearInterval(
                    expirationTimer
                );


                expirationTimer =
                    null;

            }


            expirationElement.textContent =
                "This checkout has expired.";


            disablePaymentMethods();
            
            
            hidePaymentMethods();
            
            
            setPaymentMessage(
                "This checkout expired. Please return to the portal and select your services again.",
                "error"
            );

            try {

                const releasedCreditCents =
                    await releaseExpiredCheckoutCredit();


                if (
                    releasedCreditCents >
                    0
                ) {

                    checkoutData.credit_applied_cents =
                        0;


                    checkoutData.amount_due_cents =
                        Number(
                            checkoutData.total_cents ||
                            0
                        );


                    checkoutData.credit_applied_at =
                        null;

                }

                checkoutData.status =
                    "expired";
                
                
                renderCheckoutSummary();
                
                
                showExpiredCheckoutState();

            }
            catch (
                error
            ) {

                console.error(
                    "Could not release expired checkout credit:",
                    error
                );

            }


            return;

        }


        const minutes =
            Math.floor(
                remaining /
                60000
            );


        const seconds =
            Math.floor(
                (
                    remaining %
                    60000
                ) /
                1000
            );


        expirationElement.textContent =
            `Checkout reserved for ${minutes}:${String(seconds).padStart(2, "0")}`;

    }


    updateTimer();


    expirationTimer =
        setInterval(
            updateTimer,
            1000
        );

}

// ========================================
// CREATE PAYMENT ORDER
// ========================================

async function createOrder(
    paymentMethod
) {

    if (
        checkoutExpired
    ) {

        throw new Error(
            "This checkout has expired."
        );

    }


    setPaymentMessage(
        "Preparing secure payment..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .functions
            .invoke(
                "paypal-create-order",
                {
                    body: {
                        checkout_id:
                            checkoutId,

                        payment_method:
                            paymentMethod
                    }
                }
            );


    if (
        error ||
        !data?.success ||
        !data?.orderID
    ) {

        console.error(
            "Create order error:",
            error,
            data
        );


        throw new Error(
            data?.error ||
            "Could not start your payment."
        );

    }


    return {
        orderId:
            data.orderID
    };

}


// ========================================
// CAPTURE PAYMENT
// ========================================

async function captureOrder(
    orderId
) {

    setPaymentMessage(
        "Confirming payment..."
    );


    disablePaymentMethods();


    const {
        data,
        error
    } =
        await supabaseClient
            .functions
            .invoke(
                "paypal-capture-order",
                {
                    body: {
                        orderID:
                            orderId,

                        checkout_id:
                            checkoutId
                    }
                }
            );


    if (
        error ||
        !data?.success
    ) {

        console.error(
            "Capture order error:",
            error,
            data
        );


        if (
            data?.paymentCaptured
        ) {

            throw new Error(
                "Your payment was received, but we could not finish confirming the booking. Please contact Paws in Stride."
            );

        }


        throw new Error(
            data?.error ||
            "Your payment could not be completed."
        );

    }


    return data;

}


// ========================================
// COMPLETE WITH ACCOUNT CREDIT
// ========================================

async function completeCheckoutWithAccountCredit() {

    setPaymentMessage(
        "Applying account credit and confirming your booking..."
    );


    disablePaymentMethods();


    const {
        data,
        error
    } =
        await supabaseClient
            .rpc(
                "complete_checkout_with_account_credit",
                {
                    p_checkout_id:
                        checkoutId
                }
            );


    if (error) {

        console.error(
            "Account credit completion error:",
            error
        );


        throw new Error(
            error.message ||
            "We couldn't complete your booking with account credit."
        );

    }


    const result =
        Array.isArray(data)
            ? data[0]
            : data;


    if (!result) {

        throw new Error(
            "Booking confirmation was not returned."
        );

    }


    return result;

}


// ========================================
// PAYMENT SUCCESS
// ========================================

function handlePaymentSuccess(
    data
) {

    if (expirationTimer) {

        clearInterval(
            expirationTimer
        );

    }


    hidePaymentMethods();


    setPaymentMessage(
        "Payment complete! Your booking is confirmed.",
        "success"
    );


    const params =
        new URLSearchParams();


    params.set(
        "checkout",
        checkoutId
    );


    if (
        data?.booking_group_id
    ) {

        params.set(
            "booking_group",
            data.booking_group_id
        );

    }


    setTimeout(
        () => {

            window.location.href =
                `./success.html?${params.toString()}`;

        },
        1200
    );

}


// ========================================
// PAYMENT CANCELLED
// ========================================

function handlePaymentCancellation() {

    setPaymentMessage(
        "Payment was cancelled. Your booking has not been charged."
    );

}


// ========================================
// PAYMENT ERROR
// ========================================

function handlePaymentError(
    error
) {

    console.error(
        "Payment error:",
        error
    );


    // ========================================
    // GET RAW ERROR MESSAGE
    // ========================================

    const rawMessage =
        error instanceof Error
            ? error.message
            : String(
                error?.message ||
                error ||
                ""
            );


    const normalizedMessage =
        rawMessage
            .toLowerCase();


    let friendlyMessage =
        "Your payment couldn't be completed. Please try again or use another payment method.";


    // ========================================
    // CARD DECLINED
    // ========================================

    if (
        normalizedMessage.includes(
            "card_declined"
        ) ||
        normalizedMessage.includes(
            "card declined"
        ) ||
        normalizedMessage.includes(
            "instrument_declined"
        ) ||
        normalizedMessage.includes(
            "payer cannot pay"
        ) ||
        normalizedMessage.includes(
            "payer_cannot_pay"
        )
    ) {

        friendlyMessage =
            "Your card was declined. Please try another card or payment method.";

    }


    // ========================================
    // INSUFFICIENT FUNDS
    // ========================================

    else if (
        normalizedMessage.includes(
            "insufficient"
        ) ||
        normalizedMessage.includes(
            "insufficient_funds"
        )
    ) {

        friendlyMessage =
            "This card doesn't have enough available funds. Please try another card or payment method.";

    }


    // ========================================
    // CARD AUTHENTICATION / 3DS
    // ========================================

    else if (
        normalizedMessage.includes(
            "authentication"
        ) ||
        normalizedMessage.includes(
            "3ds"
        ) ||
        normalizedMessage.includes(
            "3d secure"
        ) ||
        normalizedMessage.includes(
            "liability"
        ) ||
        normalizedMessage.includes(
            "payer action"
        )
    ) {

        friendlyMessage =
            "We couldn't verify your card. Please try again or use another payment method.";

    }


    // ========================================
    // EXPIRED CHECKOUT
    // ========================================

    else if (
        normalizedMessage.includes(
            "expired"
        )
    ) {

        friendlyMessage =
            "This checkout has expired. Please return to your dashboard and book the service again.";

    }


    // ========================================
    // PAYMENT RECEIVED / BOOKING FINALIZING
    // ========================================

    else if (
        normalizedMessage.includes(
            "payment was received"
        ) ||
        normalizedMessage.includes(
            "finish confirming"
        ) ||
        normalizedMessage.includes(
            "still being confirmed"
        )
    ) {

        friendlyMessage =
            "Your payment was received. We're finishing your booking now. Please wait a moment before trying again.";

    }


    // ========================================
    // CANCELLED PAYMENT
    // ========================================

    else if (
        normalizedMessage.includes(
            "cancel"
        )
    ) {

        friendlyMessage =
            "Payment was cancelled. Your booking has not been charged.";

    }


    // ========================================
    // NETWORK / CONNECTION ERROR
    // ========================================

    else if (
        normalizedMessage.includes(
            "network"
        ) ||
        normalizedMessage.includes(
            "fetch"
        ) ||
        normalizedMessage.includes(
            "connection"
        )
    ) {

        friendlyMessage =
            "We couldn't connect to the payment service. Please check your connection and try again.";

    }


    // ========================================
    // SHOW FRIENDLY MESSAGE
    // ========================================

    setPaymentMessage(
        friendlyMessage,
        "error"
    );

}

// ========================================
// WAIT FOR CHECKOUT COMPLETION
// ========================================

async function waitForCheckoutCompletion(
    timeoutMs = 30000,
    intervalMs = 1000
) {

    const startedAt =
        Date.now();


    while (
        Date.now() -
            startedAt <
        timeoutMs
    ) {

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    intervalMs
                )
        );


        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "booking_checkouts"
                )
                .select(
                    "status"
                )
                .eq(
                    "id",
                    checkoutId
                )
                .eq(
                    "client_id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.warn(
                "Checkout recovery check failed:",
                error
            );


            continue;

        }


        if (
            data?.status ===
            "completed"
        ) {

            console.log(
                "Checkout completed on server. Recovering frontend."
            );


            return {
                success:
                    true,

                recovered:
                    true
            };

        }


        if (
            data?.status ===
                "failed" ||
            data?.status ===
                "cancelled" ||
            data?.status ===
                "expired" ||
            data?.status ===
                "refunded"
        ) {

            throw new Error(
                `Payment could not be completed. Checkout status: ${data.status}`
            );

        }

    }


    throw new Error(
        "Your payment is still being confirmed. Please wait a moment and refresh the page."
    );

}

// ========================================
// PAYPAL SESSION
// ========================================

async function setupPayPal(
    sdkInstance
) {

    const session =
        await sdkInstance
            .createPayPalOneTimePaymentSession({
                onApprove:
                    async data => {

                        try {

                            const result =
                                await captureOrder(
                                    data.orderId
                                );


                            handlePaymentSuccess(
                                result
                            );


                            return result;

                        }
                        catch (
                            error
                        ) {

                            handlePaymentError(
                                error
                            );


                            throw error;

                        }

                    },


                onCancel:
                    data => {

                        console.log(
                            "PayPal cancelled:",
                            data
                        );


                        handlePaymentCancellation();

                    },


                onError:
                    error => {

                        handlePaymentError(
                            error
                        );

                    }
            });


    paypalWrapper.hidden =
        false;


    paypalButton.hidden =
        false;


    paypalButton.addEventListener(
        "click",
        async () => {

            try {

                if (
                    checkoutExpired
                ) {

                    throw new Error(
                        "This checkout has expired."
                    );

                }


                // IMPORTANT:
                // Do not await createOrder here.
                // PayPal recommends passing the
                // promise directly into start()
                // so browser activation is preserved.

                const orderPromise =
                    createOrder(
                        "paypal"
                    );


                await session.start(
                    {
                        presentationMode:
                            "auto"
                    },
                    orderPromise
                );

            }
            catch (
                error
            ) {

                handlePaymentError(
                    error
                );

            }

        }
    );

}


// ========================================
// VENMO SESSION
// ========================================

async function setupVenmo(
    sdkInstance
) {

    const session =
        await sdkInstance
            .createVenmoOneTimePaymentSession({
                onApprove:
                    async data => {

                        try {

                            const result =
                                await captureOrder(
                                    data.orderId
                                );


                            handlePaymentSuccess(
                                result
                            );


                            return result;

                        }
                        catch (
                            error
                        ) {

                            handlePaymentError(
                                error
                            );


                            throw error;

                        }

                    },


                onCancel:
                    data => {

                        console.log(
                            "Venmo cancelled:",
                            data
                        );


                        handlePaymentCancellation();

                    },


                onError:
                    error => {

                        handlePaymentError(
                            error
                        );

                    }
            });


    venmoWrapper.hidden =
        false;


    venmoButton.hidden =
        false;


    venmoButton.addEventListener(
        "click",
        async () => {

            try {

                if (
                    checkoutExpired
                ) {

                    throw new Error(
                        "This checkout has expired."
                    );

                }


                const orderPromise =
                    createOrder(
                        "venmo"
                    );


                // Venmo v6 supports auto mode.

                await session.start(
                    {
                        presentationMode:
                            "auto"
                    },
                    orderPromise
                );

            }
            catch (
                error
            ) {

                handlePaymentError(
                    error
                );

            }

        }
    );

}


// ========================================
// GET PAYPAL CLIENT TOKEN
// ========================================

async function getPayPalClientToken() {

    const {
        data,
        error
    } =
        await supabaseClient
            .functions
            .invoke(
                "paypal-client-token",
                {
                    body: {}
                }
            );


    if (
        error ||
        !data?.clientToken
    ) {

        console.error(
            "PayPal client token error:",
            error,
            data
        );


        throw new Error(
            data?.error ||
            "Could not initialize secure card payments."
        );

    }


    return data.clientToken;

}


// ========================================
// CARD FIELDS SESSION
// ========================================

async function setupCardFields(
    sdkInstance
) {

    if (
        !cardWrapper ||
        !cardPayButton ||
        !cardNumberContainer ||
        !cardExpiryContainer ||
        !cardCvvContainer
    ) {

        throw new Error(
            "Card payment fields are missing from the checkout page."
        );

    }


    const session =
        sdkInstance
            .createCardFieldsOneTimePaymentSession();


    const fieldStyle = {
        input: {
            fontSize:
                "16px",

            lineHeight:
                "24px",

            padding:
                "13px 14px",

            color:
                "#111827"
        }
    };


    const numberField =
        session
            .createCardFieldsComponent({
                type:
                    "number",

                placeholder:
                    "Card number",

                style:
                    fieldStyle
            });


    const expiryField =
        session
            .createCardFieldsComponent({
                type:
                    "expiry",

                placeholder:
                    "MM/YY",

                style:
                    fieldStyle
            });


    const cvvField =
        session
            .createCardFieldsComponent({
                type:
                    "cvv",

                placeholder:
                    "CVV",

                style:
                    fieldStyle
            });


    cardNumberContainer.replaceChildren(
        numberField
    );


    cardExpiryContainer.replaceChildren(
        expiryField
    );


    cardCvvContainer.replaceChildren(
        cvvField
    );


    cardWrapper.hidden =
        false;


    cardPayButton.disabled =
        false;


    cardPayButton.addEventListener(
        "click",
        async () => {

            try {

                if (
                    checkoutExpired
                ) {

                    throw new Error(
                        "This checkout has expired."
                    );

                }


                cardPayButton.disabled =
                    true;


                setPaymentMessage(
                    "Preparing secure card payment..."
                );


                const order =
                    await createOrder(
                        "card"
                    );


                const {
                    state,
                    data
                } =
                    await session.submit(
                        order.orderId
                    );


                switch (
                    state
                ) {

                    case "succeeded": {

                        const approvedOrderId =
                            data?.orderId ||
                            order.orderId;


                        const result =
                            await captureOrder(
                                approvedOrderId
                            );


                        handlePaymentSuccess(
                            result
                        );


                        break;

                    }


                    case "canceled": {

                        handlePaymentCancellation();


                        break;

                    }


                    case "failed": {

                        console.error(
                            "Card submission failed:",
                            data
                        );


                        throw new Error(
                            data?.message ||
                            "Your card could not be processed. Please check your card details and try again."
                        );

                    }


                    default: {

                        console.warn(
                            "Unhandled card payment state:",
                            state,
                            data
                        );


                        throw new Error(
                            "Your card payment could not be completed."
                        );

                    }

                }

            }
            catch (
                error
            ) {

                handlePaymentError(
                    error
                );

            }
            finally {

                if (
                    !checkoutExpired &&
                    checkoutData?.status !==
                        "completed"
                ) {

                    cardPayButton.disabled =
                        false;

                }

            }

        }
    );

}


// ========================================
// GOOGLE PAY SESSION
// ========================================

async function setupGooglePay(
    sdkInstance
) {

    if (
        !googlePayWrapper ||
        !googlePayButtonContainer
    ) {

        throw new Error(
            "Google Pay container is missing from the checkout page."
        );

    }


    if (
        !window.google?.payments?.api
    ) {

        console.warn(
            "Google Pay SDK is not available."
        );


        return false;

    }


    // ========================================
    // CREATE PAYPAL GOOGLE PAY SESSION
    // ========================================

    const googlePaySession =
        sdkInstance
            .createGooglePayOneTimePaymentSession();


    // ========================================
    // GET PAYPAL GOOGLE PAY CONFIG
    // ========================================

    const googlePayConfig =
        await googlePaySession
            .getGooglePayConfig();


    // ========================================
    // PAYMENT AUTHORIZATION
    // ========================================

    async function onPaymentAuthorized(
        paymentData
    ) {

        try {

            if (
                checkoutExpired
            ) {

                throw new Error(
                    "This checkout has expired."
                );

            }


            // ========================================
            // CREATE PAYPAL ORDER
            // ========================================

            const order =
                await createOrder(
                    "googlepay"
                );


            if (
                !order?.orderId
            ) {

                throw new Error(
                    "Google Pay order was not created."
                );

            }


            // ========================================
            // CONFIRM GOOGLE PAY WITH PAYPAL
            // ========================================

            const confirmation =
                await googlePaySession
                    .confirmOrder({
                        orderId:
                            order.orderId,

                        paymentMethodData:
                            paymentData
                                .paymentMethodData
                    });


            console.log(
                "Google Pay confirmation:",
                confirmation
            );


            // ========================================
            // HANDLE REQUIRED PAYER ACTION
            // ========================================
            
            if (
                confirmation.status ===
                "PAYER_ACTION_REQUIRED"
            ) {
            
                await googlePaySession
                    .initiatePayerAction({
                        orderId:
                            order.orderId
                    });
            
            
                // ========================================
                // VERIFY 3DS RESULT ON SERVER
                // ========================================
            
                const {
                    data:
                        verificationData,
                    error:
                        verificationError
                } =
                    await supabaseClient
                        .functions
                        .invoke(
                            "paypal-get-order",
                            {
                                body: {
                                    orderID:
                                        order.orderId,
            
                                    checkout_id:
                                        checkoutId
                                }
                            }
                        );
            
            
                if (
                    verificationError ||
                    !verificationData?.success
                ) {
            
                    console.error(
                        "Google Pay 3DS verification error:",
                        verificationError,
                        verificationData
                    );
            
            
                    throw new Error(
                        verificationData?.error ||
                        "Could not verify card authentication."
                    );
            
                }
            
            
                console.log(
                    "Google Pay 3DS verification:",
                    verificationData
                );
            
            
                // ========================================
                // REQUIRE SAFE LIABILITY SHIFT
                // ========================================
            
                if (
                    verificationData
                        .liability_shift !==
                    "POSSIBLE"
                ) {
            
                    throw new Error(
                        "Card authentication could not be verified. Please try another payment method."
                    );
            
                }
            
            }

            // ========================================
            // CAPTURE PAYMENT
            // ========================================

            const capturePromise =
                captureOrder(
                    order.orderId
                );


            const recoveryPromise =
                waitForCheckoutCompletion(
                    30000,
                    1000
                );


            const result =
                await Promise.race([
                    capturePromise,
                    recoveryPromise
                ]);


            // ========================================
            // COMPLETE BOOKING
            // ========================================

            handlePaymentSuccess(
                result
            );


            // ========================================
            // GOOGLE PAY SUCCESS
            // ========================================

            return {
                transactionState:
                    "SUCCESS"
            };

        }
        catch (
            error
        ) {

            console.error(
                "Google Pay payment error:",
                error
            );


            handlePaymentError(
                error
            );


            return {
                transactionState:
                    "ERROR",

                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Google Pay payment failed."
                }
            };

        }

    }


    // ========================================
    // CREATE GOOGLE PAY CLIENT
    // ========================================

    const paymentsClient =
        new google.payments.api.PaymentsClient({
            environment:
                "PRODUCTION",

            paymentDataCallbacks: {
                onPaymentAuthorized:
                    onPaymentAuthorized
            }
        });


    // ========================================
    // CHECK GOOGLE PAY AVAILABILITY
    // ========================================

    const readyToPay =
        await paymentsClient
            .isReadyToPay({
                apiVersion:
                    googlePayConfig.apiVersion,

                apiVersionMinor:
                    googlePayConfig.apiVersionMinor,

                allowedPaymentMethods:
                    googlePayConfig.allowedPaymentMethods
            });


    if (
        !readyToPay?.result
    ) {

        console.log(
            "Google Pay is not available on this browser or device."
        );


        return false;

    }


    // ========================================
    // CLEAR EXISTING BUTTON
    // ========================================

    googlePayButtonContainer.innerHTML =
        "";


    // ========================================
    // CREATE GOOGLE PAY BUTTON
    // ========================================

    const googlePayButton =
        paymentsClient
            .createButton({
                buttonType:
                    "pay",

                buttonColor:
                    "black",

                onClick:
                    async () => {

                        try {

                            if (
                                checkoutExpired
                            ) {

                                throw new Error(
                                    "This checkout has expired."
                                );

                            }


                            // ========================================
                            // BUILD GOOGLE PAY REQUEST
                            // ========================================
                            
                            const paymentDataRequest = {
                                apiVersion:
                                    googlePayConfig.apiVersion,
                            
                                apiVersionMinor:
                                    googlePayConfig.apiVersionMinor,
                            
                                allowedPaymentMethods:
                                    googlePayConfig.allowedPaymentMethods,
                            
                                merchantInfo:
                                    googlePayConfig.merchantInfo,
                            
                                transactionInfo: {
                                    totalPriceStatus:
                                        "FINAL",
                            
                                    totalPrice:
                                        (
                                            Number(
                                                checkoutData.amount_due_cents ??
                                                checkoutData.total_cents
                                            ) /
                                            100
                                        ).toFixed(2),
                            
                                    currencyCode:
                                        String(
                                            checkoutData.currency ||
                                            "USD"
                                        ).toUpperCase(),
                            
                                    countryCode:
                                        googlePayConfig.countryCode ||
                                        "US"
                                },
                            
                                callbackIntents: [
                                    "PAYMENT_AUTHORIZATION"
                                ]
                            };

                            // ========================================
                            // OPEN GOOGLE PAY SHEET
                            // ========================================

                            await paymentsClient
                                .loadPaymentData(
                                    paymentDataRequest
                                );

                        }
                        catch (
                            error
                        ) {

                            if (
                                error?.statusCode ===
                                "CANCELED"
                            ) {

                                handlePaymentCancellation();


                                return;

                            }


                            handlePaymentError(
                                error
                            );

                        }

                    }
            });


    googlePayButtonContainer.appendChild(
        googlePayButton
    );


    googlePayWrapper.hidden =
        false;


    return true;

}


// ========================================
// APPLE PAY SETUP
// ========================================

async function setupApplePay(
    sdkInstance,
    eligibleMethods
) {

    if (
        !applePayWrapper ||
        !applePayButton
    ) {
        return false;
    }


    // ========================================
    // DEVICE SUPPORT
    // ========================================

    if (
        !window.ApplePaySession ||
        !ApplePaySession.canMakePayments()
    ) {

        console.log(
            "Apple Pay is not available on this device."
        );

        return false;
    }


    // ========================================
    // PAYPAL ELIGIBILITY
    // ========================================

    if (
        !eligibleMethods.isEligible(
            "applepay"
        )
    ) {

        console.log(
            "Apple Pay is not eligible for this checkout."
        );

        return false;
    }


    // ========================================
    // CREATE PAYPAL APPLE PAY SESSION
    // ========================================

    const paypalApplePaySession =
        await sdkInstance
            .createApplePayOneTimePaymentSession();


    const {
        merchantCapabilities,
        supportedNetworks
    } =
        await paypalApplePaySession
            .config();


    // ========================================
    // SHOW APPLE PAY BUTTON
    // ========================================

    applePayWrapper.hidden =
        false;


    // ========================================
    // APPLE PAY CLICK
    // ========================================

    applePayButton.addEventListener(
        "click",
        () => {

            try {

                if (
                    checkoutExpired
                ) {

                    throw new Error(
                        "This checkout has expired."
                    );

                }


                // ========================================
                // PAYMENT REQUEST
                // ========================================
                
                const paymentRequest = {
                
                    countryCode:
                        "US",
                
                    currencyCode:
                        String(
                            checkoutData.currency ||
                            "USD"
                        ).toUpperCase(),
                
                    merchantCapabilities:
                        merchantCapabilities,
                
                    supportedNetworks:
                        supportedNetworks,
                
                    requiredBillingContactFields: [
                        "name",
                        "postalAddress"
                    ],
                
                    requiredShippingContactFields: [],
                
                    total: {
                        label:
                            "Paws in Stride",
                
                        amount:
                            (
                                Number(
                                    checkoutData.amount_due_cents ??
                                    checkoutData.total_cents
                                ) /
                                100
                            ).toFixed(2),
                
                        type:
                            "final"
                    }
                
                };


                // ========================================
                // CREATE NATIVE APPLE PAY SESSION
                // ========================================

                const nativeSession =
                    new ApplePaySession(
                        4,
                        paymentRequest
                    );


                // ========================================
                // MERCHANT VALIDATION
                // ========================================

                nativeSession
                    .onvalidatemerchant =
                    event => {

                        paypalApplePaySession
                            .validateMerchant({
                                validationUrl:
                                    event.validationURL
                            })
                            .then(
                                payload => {

                                    nativeSession
                                        .completeMerchantValidation(
                                            payload.merchantSession
                                        );

                                }
                            )
                            .catch(
                                error => {

                                    console.error(
                                        "Apple Pay merchant validation failed:",
                                        error
                                    );

                                    nativeSession.abort();

                                }
                            );

                    };


                // ========================================
                // PAYMENT METHOD SELECTED
                // ========================================

                nativeSession
                    .onpaymentmethodselected =
                    () => {

                        nativeSession
                            .completePaymentMethodSelection({
                                newTotal:
                                    paymentRequest.total
                            });

                    };


                // ========================================
                // PAYMENT AUTHORIZED
                // ========================================

                nativeSession
                    .onpaymentauthorized =
                    async event => {

                        try {

                            const order =
                                await createOrder(
                                    "applepay"
                                );


                            await paypalApplePaySession
                                .confirmOrder({

                                    orderId:
                                        order.orderId,

                                    token:
                                        event.payment.token,

                                    billingContact:
                                        event.payment.billingContact,

                                    shippingContact:
                                        event.payment.shippingContact

                                });


                            const capturePromise =
                                captureOrder(
                                    order.orderId
                                );


                            const recoveryPromise =
                                waitForCheckoutCompletion(
                                    30000,
                                    1000
                                );


                            const result =
                                await Promise.race([
                                    capturePromise,
                                    recoveryPromise
                                ]);


                            nativeSession
                                .completePayment({
                                    status:
                                        ApplePaySession
                                            .STATUS_SUCCESS
                                });


                            handlePaymentSuccess(
                                result
                            );

                        }
                        catch (
                            error
                        ) {

                            console.error(
                                "Apple Pay payment error:",
                                error
                            );


                            nativeSession
                                .completePayment({
                                    status:
                                        ApplePaySession
                                            .STATUS_FAILURE
                                });


                            handlePaymentError(
                                error
                            );

                        }

                    };


                // ========================================
                // CANCEL
                // ========================================

                nativeSession.oncancel =
                    () => {

                        handlePaymentCancellation();

                    };


                // ========================================
                // BEGIN APPLE PAY
                // ========================================

                nativeSession.begin();

            }
            catch (
                error
            ) {

                handlePaymentError(
                    error
                );

            }

        }
    );


    return true;

}

// ========================================
// DETECT INSTALLED PWA
// ========================================

function isRunningAsPwa() {

    const standaloneDisplayMode =
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches;

    const iosStandalone =
        window.navigator.standalone ===
        true;

    return (
        standaloneDisplayMode ||
        iosStandalone
    );

}

// ========================================
// INITIALIZE PAYMENT METHODS
// ========================================

async function initializePaymentMethods() {

    if (
        paymentMethodsInitialized ||
        !paypalSdkLoaded ||
        !pageLoaded ||
        !checkoutData ||
        checkoutExpired
    ) {

        return;

    }


    paymentMethodsInitialized =
        true;


    try {

        setPaymentMessage(
            "Loading available payment methods..."
        );


        // ========================================
        // PAYPAL + VENMO SDK INSTANCE
        // ========================================

        const walletSdkInstance =
            await window.paypal
                .createInstance({
                    clientId:
                        PAYPAL_CLIENT_ID,
        
                    components: [
                        "paypal-payments",
                        "venmo-payments",
                        "googlepay-payments",
                        "applepay-payments"
                    ],
        
                    pageType:
                        "checkout"
                });


        const walletEligibleMethods =
            await walletSdkInstance
                .findEligibleMethods({
                    currencyCode:
                        String(
                            checkoutData.currency ||
                            "USD"
                        ).toUpperCase()
                });


        let methodFound =
            false;


        // ========================================
        // PAYPAL ELIGIBILITY
        // ========================================

        if (
            walletEligibleMethods.isEligible(
                "paypal"
            )
        ) {

            methodFound =
                true;


            await setupPayPal(
                walletSdkInstance
            );

        }

        
        // ========================================
        // VENMO ELIGIBILITY
        // ========================================
        //
        // Venmo is intentionally hidden inside
        // the installed PWA because the Venmo
        // mobile app-switch can return the user
        // to Safari instead of the PWA.
        //
        // Venmo remains available in normal
        // mobile and desktop browsers.
        // ========================================
        
        if (
            !isRunningAsPwa() &&
            walletEligibleMethods.isEligible(
                "venmo"
            )
        ) {
        
            methodFound =
                true;
        
        
            await setupVenmo(
                walletSdkInstance
            );
        
        }

        // ========================================
        // GOOGLE PAY ELIGIBILITY
        // ========================================

        if (
            walletEligibleMethods.isEligible(
                "googlepay"
            )
        ) {

            const googlePayReady =
                await setupGooglePay(
                    walletSdkInstance
                );


            if (
                googlePayReady
            ) {

                methodFound =
                    true;

            }

        }


        // ========================================
        // APPLE PAY ELIGIBILITY
        // ========================================
        
        if (
            walletEligibleMethods.isEligible(
                "applepay"
            )
        ) {
            const applePayReady =
                await setupApplePay(
                    walletSdkInstance,
                    walletEligibleMethods
                );
        
            if (
                applePayReady
            ) {
                methodFound =
                    true;
            }
        }


        // ========================================
        // CARD FIELDS SDK INSTANCE
        // ========================================

        try {

            const clientToken =
                await getPayPalClientToken();


            const cardSdkInstance =
                await window.paypal
                    .createInstance({
                        clientToken:
                            clientToken,

                        components: [
                            "card-fields"
                        ],

                        pageType:
                            "checkout"
                    });


            const cardEligibleMethods =
                await cardSdkInstance
                    .findEligibleMethods({
                        currencyCode:
                            String(
                                checkoutData.currency ||
                                "USD"
                            ).toUpperCase()
                    });


            // ========================================
            // CARD ELIGIBILITY
            // ========================================

            if (
                cardEligibleMethods.isEligible(
                    "advanced_cards"
                )
            ) {

                methodFound =
                    true;


                await setupCardFields(
                    cardSdkInstance
                );

            }

        }
        catch (
            cardError
        ) {

            console.error(
                "Card Fields initialization error:",
                cardError
            );

        }


        if (
            !methodFound
        ) {

            setPaymentMessage(
                "No supported payment methods are available for this browser or device.",
                "error"
            );


            return;

        }


        setPaymentMessage(
            ""
        );

    }
    catch (
        error
    ) {

        paymentMethodsInitialized =
            false;


        console.error(
            "PayPal SDK initialization error:",
            error
        );


        setPaymentMessage(
            "Secure payment options could not be loaded. Please refresh the page and try again.",
            "error"
        );

    }

}


// ========================================
// PAYPAL SDK CALLBACK
// ========================================
//
// payment.html calls this when the PayPal
// Web SDK has finished loading.
// ========================================

window.onPayPalWebSdkLoaded =
    async function () {

        paypalSdkLoaded =
            true;


        await initializePaymentMethods();

    };

// ========================================
// PAGE INITIALIZATION
// ========================================

async function initializeCheckoutPage() {

    try {

        checkoutId =
            getCheckoutIdFromUrl();


        if (!checkoutId) {

            throw new Error(
                "No checkout was provided."
            );

        }


        const authenticated =
            await loadCurrentUser();


        if (!authenticated) {

            return;

        }


        await loadCheckout();


        await loadCheckoutVisits();


        await loadCheckoutPets();


        // ========================================
        // ALREADY COMPLETED
        // ========================================

        if (
            checkoutData.status ===
            "completed"
        ) {

            renderCheckoutSummary();


            hidePaymentMethods();


            setPaymentMessage(
                "This booking has already been paid and confirmed.",
                "success"
            );


            return;

        }

        // ========================================
        // EXPIRED CHECKOUT
        // ========================================
        
        const checkoutExpiresAt =
            checkoutData.expires_at
                ? new Date(
                    checkoutData.expires_at
                ).getTime()
                : null;
        
        
        const checkoutIsExpired =
            checkoutData.status ===
                "expired" ||
            (
                checkoutExpiresAt !==
                    null &&
                checkoutExpiresAt <=
                    Date.now()
            );
        
        
        if (
            checkoutIsExpired
        ) {
        
            checkoutExpired =
                true;
        
        
            disablePaymentMethods();
        
        
            hidePaymentMethods();
        
        
            try {
        
                const releasedCreditCents =
                    await releaseExpiredCheckoutCredit();
        
        
                if (
                    releasedCreditCents >
                    0
                ) {
        
                    checkoutData.credit_applied_cents =
                        0;
        
        
                    checkoutData.amount_due_cents =
                        Number(
                            checkoutData.total_cents ||
                            0
                        );
        
        
                    checkoutData.credit_applied_at =
                        null;
        
                }
        
        
                checkoutData.status =
                    "expired";
        
            }
            catch (
                releaseError
            ) {
        
                console.error(
                    "Expired checkout credit release error:",
                    releaseError
                );
        
            }
        
        
            renderCheckoutSummary();
        
        
            showExpiredCheckoutState();
        
        
            setPaymentMessage(
                "This checkout has expired. Please return to the portal and select your services again.",
                "error"
            );
        
        
            return;
        
        }

        // ========================================
        // VALID CHECKOUT STATUS
        // ========================================

        if (
            checkoutData.status !==
                "pending_payment" &&
            checkoutData.status !==
                "processing"
        ) {

            renderCheckoutSummary();


            hidePaymentMethods();


            setPaymentMessage(
                `This checkout cannot be paid while its status is ${checkoutData.status}.`,
                "error"
            );


            return;

        }


        // ========================================
        // LOAD ACCOUNT CREDIT
        // ========================================

        await loadAccountCreditBalance();


        // ========================================
        // RENDER CHECKOUT
        // ========================================

        renderCheckoutSummary();


        // ========================================
        // CURRENT AMOUNT DUE
        // ========================================
        
        const amountDueCents =
            Number(
                checkoutData.amount_due_cents ??
                checkoutData.total_cents ??
                0
            );
        
        
        // ========================================
        // START EXPIRATION TIMER
        // ========================================
        
        startExpirationTimer();
        
        
        pageLoaded =
            true;
        
        
        // ========================================
        // FULLY COVERED BY ACCOUNT CREDIT
        // ========================================
        
        if (
            amountDueCents === 0 &&
            Number(
                checkoutData.credit_applied_cents ||
                0
            ) > 0
        ) {
        
            hidePaymentMethods();
        
        
            setPaymentMessage(
                "Your account credit covers the full booking.",
                "success"
            );
        
        
            return;
        
        }
        
        
        // ========================================
        // PAYMENT REQUIRED
        // ========================================
        
        await initializePaymentMethods();
        
            }
            catch (
                error
            ) {
        
                console.error(
                    "Checkout page error:",
                    error
                );
        
        
                hidePaymentMethods();
        
        
                paymentSummaryContent.textContent =
                    "Checkout unavailable.";
        
        
                setPaymentMessage(
                    error instanceof Error
                        ? error.message
                        : "We couldn't load this checkout.",
                    "error"
                );
        
            }
        
        }

// ========================================
// START PAGE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeCheckoutPage
);
