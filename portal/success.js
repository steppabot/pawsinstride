// ========================================
// PAWS IN STRIDE - BOOKING SUCCESS
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
// PAGE STATE
// ========================================

let checkoutId =
    null;


let currentUser =
    null;


let checkoutData =
    null;


let checkoutVisits =
    [];


let checkoutPets =
    [];


// ========================================
// ELEMENTS
// ========================================

const successDetails =
    document.getElementById(
        "booking-success-details"
    );


const successReference =
    document.getElementById(
        "booking-success-reference"
    );


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
        Number(
            cents ||
            0
        ) /
        100
    );

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(
    dateValue
) {

    if (!dateValue) {
        return "";
    }


    const parts =
        String(
            dateValue
        ).split("-");


    if (
        parts.length ===
        3
    ) {

        const year =
            Number(
                parts[0]
            );


        const month =
            Number(
                parts[1]
            );


        const day =
            Number(
                parts[2]
            );


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
                    "long",

                month:
                    "long",

                day:
                    "numeric",

                year:
                    "numeric"
            }
        );

    }


    return String(
        dateValue
    );

}


// ========================================
// FORMAT PAYMENT DATE
// ========================================

function formatPaymentDate(
    dateValue
) {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


    return date.toLocaleString(
        "en-US",
        {
            month:
                "short",

            day:
                "numeric",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


// ========================================
// LOAD CURRENT USER
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

        const returnUrl =
            encodeURIComponent(
                window.location.href
            );


        window.location.href =
            `./login.html?return=${returnUrl}`;


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
            "Success checkout load error:",
            error
        );


        throw new Error(
            "We couldn't load your booking confirmation."
        );

    }


    if (!data) {

        throw new Error(
            "This booking confirmation could not be found."
        );

    }


    checkoutData =
        data;

}


// ========================================
// VERIFY COMPLETED BOOKING
// ========================================

function verifyCheckout() {

    if (
        checkoutData.status !==
        "completed"
    ) {

        throw new Error(
            "This booking has not been fully confirmed yet."
        );

    }


    if (
        !checkoutData.payment_confirmed_at
    ) {

        throw new Error(
            "We could not verify the payment confirmation for this booking."
        );

    }

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
            "Success visit load error:",
            error
        );


        throw new Error(
            "We couldn't load your booked service details."
        );

    }


    checkoutVisits =
        data ||
        [];

}


// ========================================
// LOAD CHECKOUT PET LINKS
// ========================================

async function loadCheckoutPets() {

    const {
        data,
        error
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


    if (error) {

        console.error(
            "Checkout pet link load error:",
            error
        );


        checkoutPets =
            [];


        return;

    }


    const petLinks =
        data ||
        [];


    const petIds =
        petLinks
            .map(
                item =>
                    item.pet_id
            )
            .filter(Boolean);


    if (
        petIds.length ===
        0
    ) {

        checkoutPets =
            [];


        return;

    }


    const {
        data: pets,
        error: petsError
    } =
        await supabaseClient
            .from(
                "pets"
            )
            .select(`
                id,
                name
            `)
            .eq(
                "client_id",
                currentUser.id
            )
            .in(
                "id",
                petIds
            );


    if (petsError) {

        console.error(
            "Checkout pet load error:",
            petsError
        );


        checkoutPets =
            [];


        return;

    }


    const petMap =
        new Map(
            (
                pets ||
                []
            ).map(
                pet => [
                    String(
                        pet.id
                    ),
                    pet
                ]
            )
        );


    checkoutPets =
        petLinks
            .map(
                link => {

                    const pet =
                        petMap.get(
                            String(
                                link.pet_id
                            )
                        );


                    if (!pet) {
                        return null;
                    }


                    return {
                        ...pet,

                        is_primary:
                            Boolean(
                                link.is_primary
                            )
                    };

                }
            )
            .filter(Boolean)
            .sort(
                (
                    first,
                    second
                ) =>
                    Number(
                        second.is_primary
                    ) -
                    Number(
                        first.is_primary
                    )
            );

}


// ========================================
// CREATE PET CHIPS
// ========================================

function buildPetChips() {

    const container =
        document.createElement(
            "div"
        );


    container.className =
        "booking-success-pets";


    checkoutPets.forEach(
        pet => {

            const chip =
                document.createElement(
                    "span"
                );


            chip.className =
                "booking-success-pet-chip";


            chip.textContent =
                pet.name ||
                "Pet";


            container.appendChild(
                chip
            );

        }
    );


    return container;

}


// ========================================
// BUILD SERVICE CARD
// ========================================

function buildServiceCard(
    visit
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "booking-success-service";


    // ========================================
    // SERVICE NAME
    // ========================================

    const serviceName =
        document.createElement(
            "div"
        );


    serviceName.className =
        "booking-success-service-name";


    serviceName.textContent =
        visit.service_name ||
        visit.service_type ||
        "Pet Care Service";


    card.appendChild(
        serviceName
    );


    // ========================================
    // PETS
    // ========================================

    if (
        checkoutPets.length >
        0
    ) {

        card.appendChild(
            buildPetChips()
        );

    }


    // ========================================
    // TIME
    // ========================================
    
    const details =
        document.createElement(
            "div"
        );
    
    
    details.className =
        "booking-success-service-details";
    
    
    details.textContent =
        visit.time_window ||
        "";
    
    
    card.appendChild(
        details
    );
    
    
    // ========================================
    // OPTION
    // ========================================

    if (
        visit.service_option &&
        visit.service_option !==
            visit.service_name
    ) {

        const option =
            document.createElement(
                "div"
            );


        option.className =
            "booking-success-service-details";


        option.textContent =
            visit.service_option;


        card.appendChild(
            option
        );

    }


    // ========================================
    // PRICE
    // ========================================

    const price =
        document.createElement(
            "div"
        );


    price.className =
        "booking-success-service-price";


    price.textContent =
        formatMoney(
            visit.total_price_cents,
            checkoutData.currency
        );


    card.appendChild(
        price
    );


    return card;

}


// ========================================
// RENDER CONFIRMATION
// ========================================

function renderConfirmation() {

    successDetails.innerHTML =
        "";


    // ========================================
    // SERVICES GROUPED BY DATE
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
            checkoutPets
                .map(
                    pet =>
                        pet.name
                )
                .filter(
                    Boolean
                )
                .join(
                    " + "
                );
    
    
        // ========================================
        // TIME WINDOW START MINUTES
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
    
                // ========================================
                // SORT VISITS WITHIN DATE
                // ========================================
    
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
                // DATE GROUP
                // ========================================
    
                const dateGroup =
                    document.createElement(
                        "div"
                    );
    
    
                dateGroup.className =
                    "booking-success-date-group";
    
    
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
                    "booking-success-date-header";
    
    
                dateHeader.setAttribute(
                    "aria-expanded",
                    dateGroupIndex ===
                    0
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
                    "booking-success-date-header-text";
    
    
                const dateTitle =
                    document.createElement(
                        "div"
                    );
    
    
                dateTitle.className =
                    "booking-success-date-title";
    
    
                dateTitle.textContent =
                    formatDate(
                        visitDate
                    );
    
    
                const dateMeta =
                    document.createElement(
                        "div"
                    );
    
    
                dateMeta.className =
                    "booking-success-date-meta";
    
    
                const serviceCount =
                    visits.length;
    
    
                const serviceLabel =
                    serviceCount ===
                    1
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
                    "booking-success-date-arrow";
    
    
                dateArrow.textContent =
                    dateGroupIndex ===
                    0
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
                    "booking-success-date-content";
    
    
                dateContent.hidden =
                    dateGroupIndex !==
                    0;
    
    
                // ========================================
                // BUILD SERVICE ROWS
                // ========================================
    
                visits.forEach(
                    visit => {
    
                        dateContent.appendChild(
                            buildServiceCard(
                                visit
                            )
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
    
    
                successDetails.appendChild(
                    dateGroup
                );
    
    
                dateGroupIndex +=
                    1;
    
            }
        );
    
    }
    
    
    // ========================================
    // FALLBACK
    // ========================================

    if (
        checkoutVisits.length ===
        0
    ) {

        const unavailable =
            document.createElement(
                "div"
            );


        unavailable.className =
            "booking-success-loading";


        unavailable.textContent =
            "Your booking is confirmed. Service details are available in your portal.";


        successDetails.appendChild(
            unavailable
        );

    }

    // ========================================
    // PAYMENT SUMMARY
    // ========================================
    
    const paymentProvider =
        String(
            checkoutData.payment_provider ||
            ""
        ).toLowerCase();
    
    
    const isAccountCreditPayment =
        paymentProvider ===
        "account_credit";
    
    
    if (
        isAccountCreditPayment
    ) {
    
        // ========================================
        // SERVICE TOTAL
        // ========================================
    
        const serviceTotal =
            document.createElement(
                "div"
            );
    
    
        serviceTotal.className =
            "booking-success-total";
    
    
        const serviceTotalLabel =
            document.createElement(
                "span"
            );
    
    
        serviceTotalLabel.textContent =
            "Service Total";
    
    
        const serviceTotalAmount =
            document.createElement(
                "span"
            );
    
    
        serviceTotalAmount.textContent =
            formatMoney(
                checkoutData.total_cents,
                checkoutData.currency
            );
    
    
        serviceTotal.appendChild(
            serviceTotalLabel
        );
    
    
        serviceTotal.appendChild(
            serviceTotalAmount
        );
    
    
        successDetails.appendChild(
            serviceTotal
        );
    
    
        // ========================================
        // ACCOUNT CREDIT
        // ========================================
    
        const creditTotal =
            document.createElement(
                "div"
            );
    
    
        creditTotal.className =
            "booking-success-total";
    
    
        const creditTotalLabel =
            document.createElement(
                "span"
            );
    
    
        creditTotalLabel.textContent =
            "Account Credit";
    
    
        const creditTotalAmount =
            document.createElement(
                "span"
            );
    
    
        creditTotalAmount.textContent =
            `-${formatMoney(
                checkoutData.credit_applied_cents,
                checkoutData.currency
            )}`;
    
    
        creditTotal.appendChild(
            creditTotalLabel
        );
    
    
        creditTotal.appendChild(
            creditTotalAmount
        );
    
    
        successDetails.appendChild(
            creditTotal
        );
    
    
        // ========================================
        // AMOUNT CHARGED
        // ========================================
    
        const amountCharged =
            document.createElement(
                "div"
            );
    
    
        amountCharged.className =
            "booking-success-total";
    
    
        const amountChargedLabel =
            document.createElement(
                "span"
            );
    
    
        amountChargedLabel.textContent =
            "Amount Charged";
    
    
        const amountChargedAmount =
            document.createElement(
                "span"
            );
    
    
        amountChargedAmount.textContent =
            formatMoney(
                checkoutData.amount_due_cents,
                checkoutData.currency
            );
    
    
        amountCharged.appendChild(
            amountChargedLabel
        );
    
    
        amountCharged.appendChild(
            amountChargedAmount
        );
    
    
        successDetails.appendChild(
            amountCharged
        );
    
    
        // ========================================
        // ACCOUNT CREDIT SUCCESS WORDING
        // ========================================
    
        const successMessage =
            document.getElementById(
                "booking-success-message"
            );
    
    
        const successStatusText =
            document.getElementById(
                "booking-success-payment-status-text"
            );
    
    
        if (
            successMessage
        ) {
    
            successMessage.textContent =
                "Your account credit was applied and your pet care service has been confirmed.";
    
        }
    
    
        if (
            successStatusText
        ) {
    
            successStatusText.textContent =
                "Booked with Account Credit";
    
        }
    
    }
    else {
    
        // ========================================
        // TOTAL PAID
        // ========================================
    
        const total =
            document.createElement(
                "div"
            );
    
    
        total.className =
            "booking-success-total";
    
    
        const totalLabel =
            document.createElement(
                "span"
            );
    
    
        totalLabel.textContent =
            "Total Paid";
    
    
        const totalAmount =
            document.createElement(
                "span"
            );
    
    
        totalAmount.textContent =
            formatMoney(
                checkoutData.total_cents,
                checkoutData.currency
            );
    
    
        total.appendChild(
            totalLabel
        );
    
    
        total.appendChild(
            totalAmount
        );
    
    
        successDetails.appendChild(
            total
        );
    
    }


    // ========================================
    // REFERENCE
    // ========================================

    const paymentDate =
        formatPaymentDate(
            checkoutData.payment_confirmed_at
        );


    const referenceParts =
        [
            `Booking reference: ${checkoutData.id}`
        ];


    if (
        paymentDate
    ) {

        referenceParts.push(
            `Payment confirmed ${paymentDate}`
        );

    }


    successReference.textContent =
        referenceParts.join(
            " • "
        );

}


// ========================================
// SHOW PAGE ERROR
// ========================================

function showSuccessPageError(
    message
) {

    if (
        successDetails
    ) {

        successDetails.innerHTML =
            "";


        const errorBox =
            document.createElement(
                "div"
            );


        errorBox.className =
            "booking-success-loading";


        errorBox.textContent =
            message;


        successDetails.appendChild(
            errorBox
        );

    }


    if (
        successReference
    ) {

        successReference.textContent =
            "";

    }

}


// ========================================
// INITIALIZE SUCCESS PAGE
// ========================================

async function initializeSuccessPage() {

    try {

        // ========================================
        // CHECKOUT ID
        // ========================================

        checkoutId =
            getCheckoutIdFromUrl();


        if (!checkoutId) {

            throw new Error(
                "No booking confirmation was provided."
            );

        }


        // ========================================
        // AUTHENTICATION
        // ========================================

        const authenticated =
            await loadCurrentUser();


        if (!authenticated) {
            return;
        }


        // ========================================
        // LOAD AND VERIFY CHECKOUT
        // ========================================

        await loadCheckout();


        verifyCheckout();


        // ========================================
        // LOAD BOOKING DETAILS
        // ========================================

        await Promise.all([
            loadCheckoutVisits(),
            loadCheckoutPets()
        ]);


        // ========================================
        // RENDER
        // ========================================

        renderConfirmation();

    }
    catch (
        error
    ) {

        console.error(
            "Booking success page error:",
            error
        );


        showSuccessPageError(
            error instanceof Error
                ? error.message
                : "We couldn't load your booking confirmation."
        );

    }

}


// ========================================
// START PAGE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeSuccessPage
);
