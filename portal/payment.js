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
    "ARdjYFfzimXClI11bBwuU4KZZokujgcd3JHtX1kk-QwAHgU-BMPlHs__K98JFCkDulu9P8VO_KYWXIht";


// ========================================
// PAGE STATE
// ========================================

let checkoutId =
    null;


let checkoutData =
    null;


let checkoutVisits =
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
// BUILD SUMMARY
// ========================================

function renderCheckoutSummary() {

    paymentSummaryContent.innerHTML =
        "";


    // ========================================
    // SERVICE ROWS
    // ========================================

    if (
        checkoutVisits.length >
        0
    ) {

        checkoutVisits.forEach(
            visit => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.style.padding =
                    "14px 0";


                row.style.borderBottom =
                    "1px solid #e5e7eb";


                const serviceName =
                    document.createElement(
                        "div"
                    );


                serviceName.style.fontWeight =
                    "600";


                serviceName.textContent =
                    visit.service_name ||
                    visit.service_type ||
                    "Pet Care Service";


                const serviceDetails =
                    document.createElement(
                        "div"
                    );


                serviceDetails.style.marginTop =
                    "4px";


                serviceDetails.style.fontSize =
                    "14px";


                serviceDetails.style.opacity =
                    "0.75";


                const details = [
                    formatDate(
                        visit.visit_date
                    ),

                    visit.time_window
                ]
                    .filter(Boolean)
                    .join(" • ");


                serviceDetails.textContent =
                    details;


                const servicePrice =
                    document.createElement(
                        "div"
                    );


                servicePrice.style.marginTop =
                    "6px";


                servicePrice.style.fontWeight =
                    "600";


                servicePrice.textContent =
                    formatMoney(
                        visit.total_price_cents,
                        checkoutData.currency
                    );


                row.appendChild(
                    serviceName
                );


                row.appendChild(
                    serviceDetails
                );


                row.appendChild(
                    servicePrice
                );


                paymentSummaryContent.appendChild(
                    row
                );

            }
        );

    }


    // ========================================
    // TOTAL
    // ========================================

    const totalRow =
        document.createElement(
            "div"
        );


    totalRow.style.display =
        "flex";


    totalRow.style.justifyContent =
        "space-between";


    totalRow.style.alignItems =
        "center";


    totalRow.style.paddingTop =
        "20px";


    totalRow.style.fontSize =
        "20px";


    totalRow.style.fontWeight =
        "700";


    const totalLabel =
        document.createElement(
            "span"
        );


    totalLabel.textContent =
        "Total";


    const totalAmount =
        document.createElement(
            "span"
        );


    totalAmount.textContent =
        formatMoney(
            checkoutData.total_cents,
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
    // EXPIRATION
    // ========================================

    const expiration =
        document.createElement(
            "div"
        );


    expiration.id =
        "checkout-expiration";


    expiration.style.marginTop =
        "12px";


    expiration.style.fontSize =
        "14px";


    expiration.style.opacity =
        "0.7";


    paymentSummaryContent.appendChild(
        expiration
    );

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


    function updateTimer() {

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

            checkoutExpired =
                true;


            expirationElement.textContent =
                "This checkout has expired.";


            disablePaymentMethods();


            hidePaymentMethods();


            setPaymentMessage(
                "This checkout expired. Please return to the portal and select your services again.",
                "error"
            );


            if (expirationTimer) {

                clearInterval(
                    expirationTimer
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
        "payment",
        "success"
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
                `./dashboard.html?${params.toString()}`;

        },
        1500
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


    const message =
        error instanceof Error
            ? error.message
            : "Payment could not be completed.";


    setPaymentMessage(
        message,
        "error"
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
                        "venmo-payments"
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

        if (
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


        renderCheckoutSummary();


        // ========================================
        // ALREADY COMPLETED
        // ========================================

        if (
            checkoutData.status ===
            "completed"
        ) {

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

        if (
            checkoutData.status ===
            "expired"
        ) {

            checkoutExpired =
                true;


            hidePaymentMethods();


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

            hidePaymentMethods();


            setPaymentMessage(
                `This checkout cannot be paid while its status is ${checkoutData.status}.`,
                "error"
            );


            return;

        }


        startExpirationTimer();


        pageLoaded =
            true;


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
