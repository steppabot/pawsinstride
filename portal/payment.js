// ========================================
// SUPABASE
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
                    true,

                storage:
                    window.localStorage

            }
        }
    );


// ========================================
// PAGE ELEMENTS
// ========================================

const summaryContainer =
    document.getElementById(
        "payment-summary-content"
    );


const paymentContainer =
    document.getElementById(
        "paypal-button-container"
    );


const paymentMessage =
    document.getElementById(
        "payment-message"
    );


// ========================================
// CHECKOUT STATE
// ========================================

let currentUser =
    null;


let currentCheckout =
    null;


let checkoutVisits =
    [];


let checkoutPets =
    [];


// ========================================
// MONEY FORMATTER
// ========================================

function formatMoney(
    cents,
    currency = "usd"
) {

    return new Intl.NumberFormat(
        "en-US",
        {
            style:
                "currency",

            currency:
                String(
                    currency ||
                    "usd"
                )
                    .toUpperCase()
        }
    ).format(
        Number(cents || 0) /
        100
    );

}


// ========================================
// DATE FORMATTER
// ========================================

function formatServiceDate(
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
// EXPIRATION CHECK
// ========================================

function checkoutIsExpired(
    expiresAt
) {

    if (!expiresAt) {

        return true;

    }


    return (
        new Date(expiresAt).getTime() <=
        Date.now()
    );

}


// ========================================
// SHOW ERROR
// ========================================

function showCheckoutError(
    message
) {

    summaryContainer.innerHTML =
        `
            <div>
                <strong>
                    We couldn't load this checkout.
                </strong>

                <p>
                    ${message}
                </p>

                <p>
                    <a href="./dashboard.html">
                        Return to your portal
                    </a>
                </p>
            </div>
        `;


    paymentContainer.innerHTML =
        "";


    paymentMessage.textContent =
        "";

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
// GET CHECKOUT ID FROM URL
// ========================================

function getCheckoutId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return (
        params.get(
            "checkout"
        ) || ""
    ).trim();

}


// ========================================
// LOAD CHECKOUT
// ========================================

async function loadCheckout(
    checkoutId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "booking_checkouts"
            )
            .select(
                `
                    id,
                    client_id,
                    status,
                    payment_provider,
                    currency,
                    subtotal_cents,
                    surcharge_cents,
                    total_cents,
                    pricing_tier,
                    paypal_order_id,
                    payment_confirmed_at,
                    expires_at,
                    created_at
                `
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

        console.error(
            "Checkout load error:",
            error
        );


        throw new Error(
            "Your checkout information could not be loaded."
        );

    }


    if (!data) {

        throw new Error(
            "This checkout could not be found."
        );

    }


    currentCheckout =
        data;

}


// ========================================
// LOAD CHECKOUT VISITS
// ========================================

async function loadCheckoutVisits(
    checkoutId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "booking_checkout_visits"
            )
            .select(
                `
                    id,
                    checkout_id,
                    visit_date,
                    service_name,
                    service_type,
                    service_option,
                    time_window,
                    base_price_cents,
                    additional_pet_fee_cents,
                    evening_fee_cents,
                    holiday_fee_cents,
                    late_pickup_fee_cents,
                    total_price_cents
                `
            )
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
            );


    if (error) {

        console.error(
            "Checkout visits error:",
            error
        );


        throw new Error(
            "Your service details could not be loaded."
        );

    }


    checkoutVisits =
        data || [];

}


// ========================================
// LOAD CHECKOUT PETS
// ========================================

async function loadCheckoutPets(
    checkoutId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "booking_checkout_pets"
            )
            .select(
                `
                    id,
                    checkout_id,
                    pet_id,
                    is_primary
                `
            )
            .eq(
                "checkout_id",
                checkoutId
            )
            .order(
                "is_primary",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.error(
            "Checkout pets error:",
            error
        );


        throw new Error(
            "Your pet information could not be loaded."
        );

    }


    checkoutPets =
        data || [];

}


// ========================================
// LOAD PET NAMES
// ========================================

async function loadPetNames() {

    if (
        checkoutPets.length ===
        0
    ) {

        return;

    }


    const petIds =
        checkoutPets.map(
            pet =>
                pet.pet_id
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "pets"
            )
            .select(
                "id, name"
            )
            .in(
                "id",
                petIds
            );


    if (error) {

        console.error(
            "Pet name load error:",
            error
        );


        return;

    }


    const namesById =
        new Map(
            (data || []).map(
                pet => [
                    Number(pet.id),
                    pet.name
                ]
            )
        );


    checkoutPets =
        checkoutPets.map(
            pet => ({
                ...pet,

                name:
                    namesById.get(
                        Number(
                            pet.pet_id
                        )
                    ) ||
                    "Pet"
            })
        );

}


// ========================================
// RENDER ORDER SUMMARY
// ========================================

function renderCheckoutSummary() {

    const currency =
        currentCheckout.currency ||
        "usd";


    const petNames =
        checkoutPets
            .map(
                pet =>
                    pet.name ||
                    "Pet"
            )
            .join(", ");


    const visitMarkup =
        checkoutVisits
            .map(
                visit => {

                    const option =
                        visit.service_option
                            ? ` - ${visit.service_option}`
                            : "";


                    const timeWindow =
                        visit.time_window
                            ? `
                                <div
                                    style="
                                        margin-top: 4px;
                                        color: #666;
                                        font-size: 0.92rem;
                                    "
                                >
                                    ${visit.time_window}
                                </div>
                              `
                            : "";


                    return `
                        <div
                            style="
                                display: flex;
                                justify-content: space-between;
                                gap: 20px;
                                padding: 14px 0;
                                border-bottom: 1px solid #ececec;
                            "
                        >

                            <div>

                                <strong>
                                    ${visit.service_type}${option}
                                </strong>

                                <div
                                    style="
                                        margin-top: 4px;
                                    "
                                >
                                    ${formatServiceDate(
                                        visit.visit_date
                                    )}
                                </div>

                                ${timeWindow}

                            </div>


                            <strong>
                                ${formatMoney(
                                    visit.total_price_cents,
                                    currency
                                )}
                            </strong>

                        </div>
                    `;

                }
            )
            .join("");


    summaryContainer.innerHTML =
        `

            <div
                style="
                    margin-bottom: 18px;
                "
            >

                <strong>
                    Pet${checkoutPets.length === 1 ? "" : "s"}:
                </strong>

                ${petNames || "Selected pet"}

            </div>


            <div>
                ${visitMarkup}
            </div>


            <div
                style="
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    padding-top: 20px;
                    font-size: 1.2rem;
                "
            >

                <strong>
                    Total
                </strong>


                <strong>
                    ${formatMoney(
                        currentCheckout.total_cents,
                        currency
                    )}
                </strong>

            </div>

        `;

}


// ========================================
// CREATE PAYMENT METHOD UI
// ========================================

function renderPaymentMethods() {

    paymentContainer.innerHTML =
        `

            <div
                style="
                    display: grid;
                    gap: 12px;
                    margin-top: 18px;
                "
            >

                <button
                    type="button"
                    id="paypal-payment-button"
                    style="
                        width: 100%;
                        min-height: 54px;
                        border: 0;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 1rem;
                        font-weight: 700;
                        padding: 14px 18px;
                    "
                >
                    Pay with PayPal
                </button>

            </div>


            <div
                style="
                    margin-top: 18px;
                    font-size: 0.9rem;
                    color: #666;
                    text-align: center;
                "
            >
                Additional payment methods including cards,
                Venmo, Apple Pay and Google Pay will appear
                when supported and enabled.
            </div>

        `;


    const paypalButton =
        document.getElementById(
            "paypal-payment-button"
        );


    paypalButton?.addEventListener(
        "click",
        startPayPalCheckout
    );

}


// ========================================
// START PAYPAL CHECKOUT
// ========================================

async function startPayPalCheckout() {

    const button =
        document.getElementById(
            "paypal-payment-button"
        );


    if (
        !currentCheckout ||
        !button
    ) {

        return;

    }


    if (
        checkoutIsExpired(
            currentCheckout.expires_at
        )
    ) {

        paymentMessage.textContent =
            "This checkout has expired. Please return to your portal and select your services again.";


        button.disabled =
            true;


        return;

    }


    button.disabled =
        true;


    button.textContent =
        "Opening PayPal...";


    paymentMessage.textContent =
        "Preparing your secure payment...";


    try {

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
                                currentCheckout.id

                        }
                    }
                );


        if (
            error ||
            !data?.success ||
            !data?.approvalLink
        ) {

            console.error(
                "PayPal create order error:",
                error,
                data
            );


            throw new Error(
                data?.error ||
                "PayPal checkout could not be started."
            );

        }


        window.location.href =
            data.approvalLink;

    }
    catch (
        error
    ) {

        console.error(
            "Payment error:",
            error
        );


        paymentMessage.textContent =
            error?.message ||
            "We couldn't start your payment. Please try again.";


        button.disabled =
            false;


        button.textContent =
            "Pay with PayPal";

    }

}


// ========================================
// CHECKOUT STATUS
// ========================================

function validateCheckoutStatus() {

    if (
        currentCheckout.status ===
        "completed"
    ) {

        summaryContainer.innerHTML =
            `
                <div>
                    <strong>
                        This booking has already been paid and confirmed.
                    </strong>

                    <p>
                        <a href="./dashboard.html">
                            Return to your portal
                        </a>
                    </p>
                </div>
            `;


        paymentContainer.innerHTML =
            "";


        return false;

    }


    if (
        currentCheckout.status ===
        "paid"
    ) {

        summaryContainer.innerHTML =
            `
                <div>
                    <strong>
                        Your payment has already been received.
                    </strong>

                    <p>
                        We're finishing your booking confirmation.
                    </p>
                </div>
            `;


        paymentContainer.innerHTML =
            "";


        return false;

    }


    if (
        ![
            "pending_payment",
            "processing"
        ].includes(
            currentCheckout.status
        )
    ) {

        showCheckoutError(
            "This checkout is no longer available."
        );


        return false;

    }


    if (
        checkoutIsExpired(
            currentCheckout.expires_at
        )
    ) {

        showCheckoutError(
            "This checkout has expired. Please return to your portal and select your services again."
        );


        return false;

    }


    return true;

}


// ========================================
// INITIALIZE PAYMENT PAGE
// ========================================

async function initializePaymentPage() {

    try {

        paymentMessage.textContent =
            "";


        // ========================================
        // REQUIRE SIGNED-IN USER
        // ========================================

        const userLoaded =
            await loadCurrentUser();


        if (!userLoaded) {

            return;

        }


        // ========================================
        // REQUIRE CHECKOUT ID
        // ========================================

        const checkoutId =
            getCheckoutId();


        if (!checkoutId) {

            showCheckoutError(
                "No checkout ID was provided."
            );


            return;

        }


        // ========================================
        // LOAD CHECKOUT DATA
        // ========================================

        await loadCheckout(
            checkoutId
        );


        // ========================================
        // VALIDATE CHECKOUT
        // ========================================

        if (
            !validateCheckoutStatus()
        ) {

            return;

        }


        // ========================================
        // LOAD SERVICE + PET DETAILS
        // ========================================

        await Promise.all([

            loadCheckoutVisits(
                checkoutId
            ),

            loadCheckoutPets(
                checkoutId
            )

        ]);


        await loadPetNames();


        // ========================================
        // REQUIRE BOOKING DETAILS
        // ========================================

        if (
            checkoutVisits.length ===
            0
        ) {

            throw new Error(
                "No services were found for this checkout."
            );

        }


        // ========================================
        // RENDER CHECKOUT
        // ========================================

        renderCheckoutSummary();


        renderPaymentMethods();

    }
    catch (
        error
    ) {

        console.error(
            "Payment page initialization error:",
            error
        );


        showCheckoutError(
            error?.message ||
            "Something went wrong while loading your checkout."
        );

    }

}


// ========================================
// START PAYMENT PAGE
// ========================================

initializePaymentPage();
