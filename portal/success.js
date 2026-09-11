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
    // DATE / TIME
    // ========================================

    const details =
        document.createElement(
            "div"
        );


    details.className =
        "booking-success-service-details";


    const detailParts =
        [
            formatDate(
                visit.visit_date
            ),

            visit.time_window
        ]
            .filter(Boolean);


    details.textContent =
        detailParts.join(
            " • "
        );


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
    // SERVICES
    // ========================================

    checkoutVisits.forEach(
        visit => {

            successDetails.appendChild(
                buildServiceCard(
                    visit
                )
            );

        }
    );


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
