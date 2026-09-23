// ========================================
// SUPABASE
// ========================================
//
// Use persistent browser storage so the
// authenticated session survives:
//
// - normal page navigation
// - closing Safari
// - closing the installed PWA
// - reopening Paws in Stride later
//
// We never store the user's password.
// Supabase stores and refreshes the auth
// session tokens.
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
// CONSTANTS
// ========================================

const DEFAULT_PET_AVATAR =
    "./assets/default-pet-avatar.webp";

const PET_PHOTO_BUCKET =
    "pet-photos";

const PROFILE_PHOTO_BUCKET =
    "profile-photos";

const VISIT_MEDIA_BUCKET =
    "visit-media";

const MAX_PHOTO_SIZE =
    5 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


// ========================================
// USER INPUT FORMATTING
// ========================================

function normalizeInputSpacing(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        );

}


// ========================================
// CAPITALIZE NAME WORD
// ========================================

function capitalizeNameWord(
    word
) {

    const lowerWord =
        String(
            word || ""
        ).toLowerCase();


    if (!lowerWord) {

        return "";

    }


    return lowerWord
        .split("-")
        .map(
            hyphenPart =>
                hyphenPart
                    .split("'")
                    .map(
                        apostrophePart => {

                            if (
                                !apostrophePart
                            ) {

                                return "";

                            }


                            let formatted =
                                apostrophePart
                                    .charAt(0)
                                    .toUpperCase() +
                                apostrophePart
                                    .slice(1);


                            // ========================================
                            // COMMON MC NAME FORMATTING
                            // ========================================

                            if (
                                /^Mc[a-z]/.test(
                                    formatted
                                )
                            ) {

                                formatted =
                                    formatted.slice(
                                        0,
                                        2
                                    ) +
                                    formatted
                                        .charAt(2)
                                        .toUpperCase() +
                                    formatted.slice(
                                        3
                                    );

                            }


                            return formatted;

                        }
                    )
                    .join("'")
        )
        .join("-");

}


// ========================================
// FORMAT PERSON / PET NAME
// ========================================

function formatProperName(
    value
) {

    const cleaned =
        normalizeInputSpacing(
            value
        );


    if (!cleaned) {

        return "";

    }


    return cleaned
        .split(" ")
        .map(
            capitalizeNameWord
        )
        .join(" ");

}


// ========================================
// FORMAT CITY
// ========================================

function formatCityName(
    value
) {

    return formatProperName(
        value
    );

}


// ========================================
// FORMAT STATE
// ========================================

function formatStateAbbreviation(
    value
) {

    return normalizeInputSpacing(
        value
    ).toUpperCase();

}


// ========================================
// FORMAT STREET ADDRESS
// ========================================

function formatStreetAddress(
    value
) {

    const cleaned =
        normalizeInputSpacing(
            value
        );


    if (!cleaned) {

        return "";

    }


    const uppercaseTokens =
        new Set([
            "N",
            "S",
            "E",
            "W",
            "NE",
            "NW",
            "SE",
            "SW",
            "FM",
            "RR",
            "US"
        ]);


    return cleaned
        .split(" ")
        .map(
            word => {

                const upperWord =
                    word.toUpperCase();


                if (
                    uppercaseTokens.has(
                        upperWord
                    )
                ) {

                    return upperWord;

                }


                return capitalizeNameWord(
                    word
                );

            }
        )
        .join(" ");

}


// ========================================
// FORMAT ADDRESS LINE 2
// ========================================

function formatAddressLine2(
    value
) {

    return formatStreetAddress(
        value
    );

}

// ========================================
// STATE
// ========================================

let currentUser = null;

let currentProfile = null;

let currentHousehold = null;

let currentPropertyAccess = null;

let currentPets = [];

let currentVisits = [];

let currentVisitPets = [];

let activeClientVisitReportId =
    null;


// ========================================
// BOOKING SELECTION STATE
// ========================================
//
// selectedVisits is the NEW source of truth.
//
// Each entry will look like:
//
// {
//     date: "2026-09-15",
//     timeWindow: "7:00 AM - 10:00 AM"
// }
//
// selectedDates is temporarily retained because
// some existing pricing, capacity, and weekly
// validation code still expects an array of dates.
// We will keep it synchronized while migrating.
// ========================================

let selectedVisits = [];

let selectedDates = [];


let selectedUpcomingDate = null;

let editingPet = null;

let pendingPetPhotoFile = null;

let pendingClientPhotoFile = null;

let petPhotoPreviewObjectUrl = null;

let clientPhotoPreviewObjectUrl = null;

const petPhotoUrlCache =
    new Map();

const profilePhotoUrlCache =
    new Map();


const now =
    new Date();


let calendarYear =
    now.getFullYear();

let calendarMonth =
    now.getMonth();


let upcomingCalendarYear =
    now.getFullYear();

let upcomingCalendarMonth =
    now.getMonth();


// ========================================
// SERVICE CONFIG
// ========================================


// ========================================
// SERVICE CONFIG
// ========================================

const TIME_WINDOWS = [

    {
        value: "7:00 AM - 10:00 AM",
        label: "7:00 AM – 10:00 AM",
        surchargeType: null
    },

    {
        value: "10:00 AM - 12:00 PM",
        label: "10:00 AM – 12:00 PM",
        surchargeType: null
    },

    {
        value: "12:00 PM - 2:00 PM",
        label: "12:00 PM – 2:00 PM",
        surchargeType: null
    },

    {
        value: "2:00 PM - 4:00 PM",
        label: "2:00 PM – 4:00 PM",
        surchargeType: null
    },

    {
        value: "4:00 PM - 6:00 PM",
        label: "4:00 PM – 6:00 PM",
        surchargeType: null
    },

    {
        value: "6:00 PM - 8:00 PM",
        label: "6:00 PM – 8:00 PM",
        surchargeType: "after_6_fee"
    },

    {
        value: "8:00 PM - 10:00 PM",
        label: "8:00 PM – 10:00 PM",
        surchargeType: "after_8_fee"
    }

];


const SERVICE_CONFIG = {

    "Dog Walking": {

        minimumPerWeek: 3,

        optionLabel: "Duration",

        databaseServiceType:
            "dog_walking",

        options: [

            {
                value: "15 Minutes",
                databaseOption:
                    "15_min"
            },

            {
                value: "30 Minutes",
                databaseOption:
                    "30_min"
            },

            {
                value: "60 Minutes",
                databaseOption:
                    "60_min"
            }

        ]

    },


    "Drop-In Visit": {

        minimumPerWeek: 3,

        optionLabel: "Duration",

        databaseServiceType:
            "drop_in",

        options: [

            {
                value: "15 Minutes",
                databaseOption:
                    "15_min"
            },

            {
                value: "30 Minutes",
                databaseOption:
                    "30_min"
            },

            {
                value: "60 Minutes",
                databaseOption:
                    "60_min"
            }

        ]

    },


    "Pet Sitting": {

        minimumPerWeek: 0,

        optionLabel: "Package",

        databaseServiceType:
            "pet_sitting",

        options: [

            {
                value:
                    "Basic Sit - 4 Hours",

                databaseOption:
                    "basic_4_hour",

                timeBlocks: [
                    "7:00 AM - 11:00 AM",
                    "11:00 AM - 3:00 PM",
                    "3:00 PM - 7:00 PM",
                    "7:00 PM - 11:00 PM"
                ]
            },

            {
                value:
                    "Standard Sit - 8 Hours",

                databaseOption:
                    "standard_8_hour",

                timeBlocks: [
                    "7:00 AM - 3:00 PM",
                    "3:00 PM - 11:00 PM"
                ]
            },

            {
                value:
                    "VIP Sit - 12 Hours",

                databaseOption:
                    "vip_12_hour",

                timeBlocks: [
                    "7:00 AM - 7:00 PM",
                    "11:00 AM - 11:00 PM"
                ]
            }

        ]

    },


    "Dog Boarding": {

        boarding: true,

        databaseServiceType:
            "dog_boarding",

        databaseOption:
            "vip_overnight"

    }

};


// ========================================
// CLIENT SERVICE PRICING
// ========================================

let currentServicePrices =
    [];


async function loadMyServicePrices() {

    const {
        data,
        error
    } =
        await supabaseClient
            .rpc(
                "get_my_service_prices"
            );


    if (error) {

        console.error(
            "Service pricing error:",
            error
        );

        throw error;

    }


    currentServicePrices =
        data || [];


    console.log(
        "Loaded client service pricing:",
        currentServicePrices.length
    );


    return currentServicePrices;

}


function getServicePrice(
    serviceType,
    serviceOption = null
) {

    const config =
        SERVICE_CONFIG[
            serviceType
        ];


    if (!config) {
        return null;
    }


    const databaseServiceType =
        config.databaseServiceType;


    let databaseOption =
        null;


    if (
        serviceType ===
        "Dog Boarding"
    ) {

        databaseOption =
            config.databaseOption;

    } else {

        const option =
            config.options.find(
                item =>
                    item.value ===
                    serviceOption
            );


        databaseOption =
            option?.databaseOption ||
            null;

    }


    if (
        !databaseServiceType ||
        !databaseOption
    ) {
        return null;
    }


    return (
        currentServicePrices.find(
            price =>
                price.service_type ===
                    databaseServiceType &&
                price.service_option ===
                    databaseOption
        ) ||
        null
    );

}


function formatServicePrice(
    value
) {

    return Number(
        value || 0
    ).toFixed(2);

}


// ========================================
// PERMANENT HOLIDAY DISPLAY ENGINE
// ========================================
//
// IMPORTANT:
// This mirrors the permanent Supabase holiday
// engine so the client can SEE holiday pricing
// before submitting.
//
// Supabase create_service_booking() remains
// authoritative for the actual stored price.
// ========================================

function getNthWeekdayOfMonth(
    year,
    monthIndex,
    weekday,
    occurrence
) {

    const firstDay =
        new Date(
            year,
            monthIndex,
            1
        );


    const firstWeekday =
        firstDay.getDay();


    const offset =
        (
            weekday -
            firstWeekday +
            7
        ) % 7;


    return (
        1 +
        offset +
        (
            (occurrence - 1) *
            7
        )
    );

}


function getLastWeekdayOfMonth(
    year,
    monthIndex,
    weekday
) {

    const lastDay =
        new Date(
            year,
            monthIndex + 1,
            0
        );


    const offset =
        (
            lastDay.getDay() -
            weekday +
            7
        ) % 7;


    return (
        lastDay.getDate() -
        offset
    );

}


function getServiceHolidayName(
    dateString
) {

    if (!dateString) {
        return null;
    }


    const [
        yearString,
        monthString,
        dayString
    ] =
        dateString.split("-");


    const year =
        Number(
            yearString
        );


    const month =
        Number(
            monthString
        );


    const day =
        Number(
            dayString
        );


    if (
        !year ||
        !month ||
        !day
    ) {
        return null;
    }


    // ========================================
    // FIXED-DATE HOLIDAYS
    // ========================================

    if (
        month === 1 &&
        day === 1
    ) {
        return "New Year's Day";
    }


    if (
        month === 6 &&
        day === 19
    ) {
        return "Juneteenth";
    }


    if (
        month === 7 &&
        day === 4
    ) {
        return "Independence Day";
    }


    if (
        month === 11 &&
        day === 11
    ) {
        return "Veterans Day";
    }


    if (
        month === 12 &&
        day === 24
    ) {
        return "Christmas Eve";
    }


    if (
        month === 12 &&
        day === 25
    ) {
        return "Christmas Day";
    }


    if (
        month === 12 &&
        day === 31
    ) {
        return "New Year's Eve";
    }


    // ========================================
    // MLK DAY
    // THIRD MONDAY IN JANUARY
    // ========================================

    if (
        month === 1 &&
        day ===
            getNthWeekdayOfMonth(
                year,
                0,
                1,
                3
            )
    ) {
        return "Martin Luther King Jr. Day";
    }


    // ========================================
    // PRESIDENTS DAY
    // THIRD MONDAY IN FEBRUARY
    // ========================================

    if (
        month === 2 &&
        day ===
            getNthWeekdayOfMonth(
                year,
                1,
                1,
                3
            )
    ) {
        return "Presidents Day";
    }


    // ========================================
    // MEMORIAL DAY
    // LAST MONDAY IN MAY
    // ========================================

    if (
        month === 5 &&
        day ===
            getLastWeekdayOfMonth(
                year,
                4,
                1
            )
    ) {
        return "Memorial Day";
    }


    // ========================================
    // LABOR DAY
    // FIRST MONDAY IN SEPTEMBER
    // ========================================

    if (
        month === 9 &&
        day ===
            getNthWeekdayOfMonth(
                year,
                8,
                1,
                1
            )
    ) {
        return "Labor Day";
    }


    // ========================================
    // COLUMBUS DAY
    // SECOND MONDAY IN OCTOBER
    // ========================================

    if (
        month === 10 &&
        day ===
            getNthWeekdayOfMonth(
                year,
                9,
                1,
                2
            )
    ) {
        return "Columbus Day";
    }


    // ========================================
    // THANKSGIVING
    // FOURTH THURSDAY IN NOVEMBER
    // ========================================

    if (
        month === 11 &&
        day ===
            getNthWeekdayOfMonth(
                year,
                10,
                4,
                4
            )
    ) {
        return "Thanksgiving Day";
    }


    return null;

}


function isServiceHoliday(
    dateString
) {

    return Boolean(
        getServiceHolidayName(
            dateString
        )
    );

}

// ========================================
// LOGIN
// ========================================

const loginForm =
    document.getElementById(
        "login-form"
    );


const loginEmailInput =
    document.getElementById(
        "email"
    );


const loginPasswordInput =
    document.getElementById(
        "password"
    );


const loginPasswordToggle =
    document.getElementById(
        "login-password-toggle"
    );


// ========================================
// LOGIN PASSWORD SHOW / HIDE
// ========================================

loginPasswordToggle
    ?.addEventListener(
        "click",
        () => {

            if (
                !loginPasswordInput
            ) {
                return;
            }


            const passwordIsHidden =
                loginPasswordInput.type ===
                "password";


            loginPasswordInput.type =
                passwordIsHidden
                    ? "text"
                    : "password";


            loginPasswordToggle.textContent =
                passwordIsHidden
                    ? "Hide"
                    : "Show";


            loginPasswordToggle.setAttribute(
                "aria-label",
                passwordIsHidden
                    ? "Hide password"
                    : "Show password"
            );


            loginPasswordInput.focus({
                preventScroll: true
            });

        }
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "login-message"
                );


            const email =
                loginEmailInput
                    ?.value
                    .trim()
                    .toLowerCase() || "";


            const password =
                loginPasswordInput
                    ?.value || "";


            // ========================================
            // LOGIN EMAIL VALIDATION
            // ========================================

            if (
                !email ||
                !loginEmailInput.checkValidity()
            ) {

                message.textContent =
                    "Please enter a valid email address.";


                loginEmailInput.focus();

                return;

            }


            // ========================================
            // LOGIN PASSWORD VALIDATION
            // ========================================

            if (!password) {

                message.textContent =
                    "Please enter your password.";


                loginPasswordInput.focus();

                return;

            }


            message.textContent =
                "Signing in...";


            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({
                        email,
                        password
                    });


            if (error) {

                console.error(
                    "Login error:",
                    error
                );


                message.textContent =
                    "Incorrect email or password.";

                return;

            }


            if (!data.session) {

                message.textContent =
                    "Login succeeded, but no session was created.";

                return;

            }


            // ========================================
            // LOAD SIGNED-IN USER'S PROFILE
            // ========================================

            const {
                data: loginProfile,
                error: loginProfileError
            } =
                await supabaseClient
                    .from("profiles")
                    .select(
                        "id, email, role"
                    )
                    .eq(
                        "id",
                        data.session.user.id
                    )
                    .single();


            if (loginProfileError) {

                console.error(
                    "Login role lookup error:",
                    loginProfileError
                );


                message.textContent =
                    "We signed you in, but couldn't load your account role.";

                return;

            }


            const role =
                String(
                    loginProfile?.role || ""
                )
                    .trim()
                    .toLowerCase();


            // ========================================
            // ADMIN ROUTING
            // ========================================
            
            if (
                role ===
                "admin"
            ) {
            
                // ========================================
                // REMEMBER ADMIN DEVICE
                // ========================================
                //
                // Allows the installed PWA to recognize
                // this device as an admin device even
                // when it later launches without internet.
                // ========================================
            
                window.localStorage.setItem(
                    "paws-in-stride-admin-device",
                    "true"
                );
            
            
                window.location.replace(
                    "./admin.html"
                );
            
            
                return;
            
            }

            // ========================================
            // CLIENT ROUTING
            // ========================================

            window.location.replace(
                "./dashboard.html"
            );

        }
    );

}

// ========================================
// FORGOT PASSWORD
// ========================================

const forgotPasswordForm =
    document.getElementById(
        "forgot-password-form"
    );


if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const emailField =
                document.getElementById(
                    "forgot-password-email"
                );


            const message =
                document.getElementById(
                    "forgot-password-message"
                );


            const submitButton =
                document.getElementById(
                    "forgot-password-submit"
                );


            const email =
                String(
                    emailField?.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            message.textContent =
                "";


            // ========================================
            // EMAIL VALIDATION
            // ========================================

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


            if (
                !emailPattern.test(
                    email
                )
            ) {

                emailField.focus();

                emailField.style.borderColor =
                    "#dc3545";

                emailField.style.boxShadow =
                    "0 0 0 3px rgba(220, 53, 69, 0.14)";

                return;

            }


            emailField.style.borderColor =
                "";

            emailField.style.boxShadow =
                "";


            submitButton.disabled =
                true;


            submitButton.textContent =
                "Sending...";


            try {

                // ========================================
                // SEND SUPABASE RESET EMAIL
                // ========================================

                const resetRedirectUrl =
                    `${window.location.origin}/portal/reset-password.html`;


                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .resetPasswordForEmail(
                            email,
                            {
                                redirectTo:
                                    resetRedirectUrl
                            }
                        );


                if (error) {

                    throw error;

                }


                // ========================================
                // SUCCESS
                // ========================================

                message.textContent =
                    "If an account exists for that email, we've sent a password reset link. Check your inbox and spam folder.";


                emailField.value =
                    "";


                submitButton.textContent =
                    "Reset Link Sent";

            }
            catch (error) {

                console.error(
                    "Password reset request error:",
                    error
                );


                message.textContent =
                    "We couldn't send the reset link right now. Please try again.";


                submitButton.disabled =
                    false;


                submitButton.textContent =
                    "Send Reset Link";

            }

        }
    );


    // ========================================
    // CLEAR EMAIL ERROR WHILE TYPING
    // ========================================

    const forgotPasswordEmailField =
        document.getElementById(
            "forgot-password-email"
        );


    forgotPasswordEmailField?.addEventListener(
        "input",
        () => {

            forgotPasswordEmailField
                .style
                .borderColor =
                    "";


            forgotPasswordEmailField
                .style
                .boxShadow =
                    "";

        }
    );

}

// ========================================
// RESET PASSWORD
// ========================================

const resetPasswordForm =
    document.getElementById(
        "reset-password-form"
    );


if (resetPasswordForm) {

    const resetPasswordMessage =
        document.getElementById(
            "reset-password-message"
        );


    const resetPasswordLoginLink =
        document.getElementById(
            "reset-password-login-link"
        );


    const resetNewPasswordField =
        document.getElementById(
            "reset-new-password"
        );


    const resetConfirmPasswordField =
        document.getElementById(
            "reset-confirm-password"
        );


    const resetPasswordSubmit =
        document.getElementById(
            "reset-password-submit"
        );


    let passwordRecoveryReady =
        false;


    // ========================================
    // RESET FIELD ERROR
    // ========================================

    function clearResetPasswordFieldError(
        field
    ) {

        if (!field) {
            return;
        }


        field.style.borderColor =
            "";


        field.style.boxShadow =
            "";

    }


    // ========================================
    // SHOW FIELD ERROR
    // ========================================

    function showResetPasswordFieldError(
        field
    ) {

        if (!field) {
            return;
        }


        field.style.borderColor =
            "#dc3545";


        field.style.boxShadow =
            "0 0 0 3px rgba(220, 53, 69, 0.14)";


        field.focus();

    }


    // ========================================
    // ENABLE RESET FORM
    // ========================================

    function enablePasswordRecoveryForm() {

        passwordRecoveryReady =
            true;


        resetPasswordForm.style.display =
            "";


        resetPasswordMessage.textContent =
            "";


        resetPasswordLoginLink.style.display =
            "none";

    }


    // ========================================
    // INVALID OR EXPIRED LINK
    // ========================================

    function showInvalidRecoveryLink() {

        passwordRecoveryReady =
            false;


        resetPasswordForm.style.display =
            "none";


        resetPasswordMessage.textContent =
            "This password reset link is invalid or has expired. Please request a new reset link.";


        resetPasswordLoginLink.style.display =
            "";

    }


    // ========================================
    // WATCH SUPABASE AUTH RECOVERY
    // ========================================

    const {
        data: resetAuthListener
    } =
        supabaseClient
            .auth
            .onAuthStateChange(
                (
                    event,
                    session
                ) => {

                    if (
                        event ===
                            "PASSWORD_RECOVERY" &&
                        session
                    ) {

                        enablePasswordRecoveryForm();

                    }

                }
            );


    // ========================================
    // CHECK RECOVERY SESSION
    // ========================================

    async function initializePasswordRecovery() {

        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .getSession();


            if (error) {

                console.error(
                    "Password recovery session error:",
                    error
                );


                showInvalidRecoveryLink();

                return;

            }


            if (
                data?.session
            ) {

                enablePasswordRecoveryForm();

                return;

            }


            /*
             * Give Supabase a moment to process the
             * recovery information from the URL.
             */

            window.setTimeout(
                () => {

                    if (
                        !passwordRecoveryReady
                    ) {

                        showInvalidRecoveryLink();

                    }

                },
                1500
            );

        }
        catch (error) {

            console.error(
                "Password recovery initialization error:",
                error
            );


            showInvalidRecoveryLink();

        }

    }


    initializePasswordRecovery();


    // ========================================
    // PASSWORD FIELD LISTENERS
    // ========================================

    resetNewPasswordField
        ?.addEventListener(
            "input",
            () => {

                clearResetPasswordFieldError(
                    resetNewPasswordField
                );

            }
        );


    resetConfirmPasswordField
        ?.addEventListener(
            "input",
            () => {

                clearResetPasswordFieldError(
                    resetConfirmPasswordField
                );

            }
        );


    // ========================================
    // NEW PASSWORD SHOW / HIDE
    // ========================================

    const resetNewPasswordToggle =
        document.getElementById(
            "reset-new-password-toggle"
        );


    resetNewPasswordToggle
        ?.addEventListener(
            "click",
            () => {

                const showing =
                    resetNewPasswordField
                        .type ===
                    "text";


                resetNewPasswordField.type =
                    showing
                        ? "password"
                        : "text";


                resetNewPasswordToggle
                    .textContent =
                        showing
                            ? "Show"
                            : "Hide";


                resetNewPasswordToggle
                    .setAttribute(
                        "aria-label",
                        showing
                            ? "Show new password"
                            : "Hide new password"
                    );

            }
        );


    // ========================================
    // CONFIRM PASSWORD SHOW / HIDE
    // ========================================

    const resetConfirmPasswordToggle =
        document.getElementById(
            "reset-confirm-password-toggle"
        );


    resetConfirmPasswordToggle
        ?.addEventListener(
            "click",
            () => {

                const showing =
                    resetConfirmPasswordField
                        .type ===
                    "text";


                resetConfirmPasswordField.type =
                    showing
                        ? "password"
                        : "text";


                resetConfirmPasswordToggle
                    .textContent =
                        showing
                            ? "Show"
                            : "Hide";


                resetConfirmPasswordToggle
                    .setAttribute(
                        "aria-label",
                        showing
                            ? "Show confirmed password"
                            : "Hide confirmed password"
                    );

            }
        );


    // ========================================
    // SAVE NEW PASSWORD
    // ========================================

    resetPasswordForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            resetPasswordMessage.textContent =
                "";


            clearResetPasswordFieldError(
                resetNewPasswordField
            );


            clearResetPasswordFieldError(
                resetConfirmPasswordField
            );


            if (
                !passwordRecoveryReady
            ) {

                showInvalidRecoveryLink();

                return;

            }


            const newPassword =
                String(
                    resetNewPasswordField
                        ?.value ||
                    ""
                );


            const confirmPassword =
                String(
                    resetConfirmPasswordField
                        ?.value ||
                    ""
                );


            // ========================================
            // PASSWORD LENGTH
            // ========================================

            if (
                newPassword.length <
                8
            ) {

                showResetPasswordFieldError(
                    resetNewPasswordField
                );


                resetPasswordMessage.textContent =
                    "Your password must be at least 8 characters.";

                return;

            }


            // ========================================
            // PASSWORD MATCH
            // ========================================

            if (
                newPassword !==
                confirmPassword
            ) {

                showResetPasswordFieldError(
                    resetConfirmPasswordField
                );


                resetPasswordMessage.textContent =
                    "The passwords do not match.";

                return;

            }


            // ========================================
            // UPDATE BUTTON
            // ========================================

            resetPasswordSubmit.disabled =
                true;


            resetPasswordSubmit.textContent =
                "Updating...";


            try {

                // ========================================
                // UPDATE PASSWORD IN SUPABASE
                // ========================================

                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .updateUser({

                            password:
                                newPassword

                        });


                if (error) {

                    throw error;

                }


                // ========================================
                // SUCCESS
                // ========================================
                
                const resetPasswordContent =
                    document.getElementById(
                        "reset-password-content"
                    );
                
                
                const resetPasswordSuccess =
                    document.getElementById(
                        "reset-password-success"
                    );
                
                
                resetPasswordContent.style.display =
                    "none";
                
                
                resetPasswordSuccess.hidden =
                    false;


                // ========================================
                // SIGN OUT RECOVERY SESSION
                // ========================================

                const {
                    error: signOutError
                } =
                    await supabaseClient
                        .auth
                        .signOut();


                if (signOutError) {

                    console.warn(
                        "Recovery session sign-out error:",
                        signOutError
                    );

                }

            }
            catch (error) {

                console.error(
                    "Password update error:",
                    error
                );


                resetPasswordMessage.textContent =
                    "We couldn't update your password. Your reset link may have expired. Please request a new one.";


                resetPasswordSubmit.disabled =
                    false;


                resetPasswordSubmit.textContent =
                    "Update Password";

            }

        }
    );


    // ========================================
    // CLEAN UP AUTH LISTENER
    // ========================================

    window.addEventListener(
        "beforeunload",
        () => {

            resetAuthListener
                ?.subscription
                ?.unsubscribe();

        }
    );

}

// ========================================
// DASHBOARD
// ========================================

async function loadDashboard() {

    // ========================================
    // OFFLINE ADMIN DEVICE ROUTING
    // ========================================

    const isOfflineAdminDevice =
        
        navigator.onLine === false &&
        window.localStorage.getItem(
            "paws-in-stride-admin-device"
        ) ===
            "true";


    if (
        isOfflineAdminDevice
    ) {

        console.log(
            "Offline admin device detected. Opening cached admin portal."
        );


        window.location.replace(
            "./admin.html"
        );


        return;

    }
    
    const dashboardContent =
        document.getElementById(
            "dashboard-content"
        );


    const loading =
        document.getElementById(
            "loading"
        );


    if (!dashboardContent) {
        return;
    }


    const {
        data: {
            session
        },
        error: sessionError
    } =
        await supabaseClient
            .auth
            .getSession();


    if (sessionError) {

        console.error(
            "Session error:",
            sessionError
        );


        loading.textContent =
            "There was a problem loading your login session.";

        return;

    }


    if (!session) {

        window.location.href =
            "./login.html";

        return;

    }


    currentUser =
        session.user;


    // PROFILE

    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .single();


    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );


        loading.textContent =
            "We couldn't load your client profile.";

        return;

    }


    currentProfile =
        profile;


    // ========================================
    // ADMIN REDIRECT
    // ========================================

    const currentRole =
        String(
            currentProfile?.role || ""
        )
            .trim()
            .toLowerCase();


    if (
        currentRole ===
        "admin"
    ) {

        window.location.replace(
            "./admin.html"
        );

        return;

    }


    // HOUSEHOLD

    const {
        data: household,
        error: householdError
    } =
        await supabaseClient
            .from("households")
            .select("*")
            .eq(
                "client_id",
                currentUser.id
            )
            .maybeSingle();


    if (householdError) {

        console.error(
            "Household error:",
            householdError
        );

    }


    currentHousehold =
        household || null;


    // PROPERTY ACCESS

    const {
        data: propertyAccess,
        error: propertyAccessError
    } =
        await supabaseClient
            .from("property_access")
            .select("*")
            .eq(
                "client_id",
                currentUser.id
            )
            .maybeSingle();


    if (propertyAccessError) {

        console.error(
            "Property access error:",
            propertyAccessError
        );

    }


    currentPropertyAccess =
        propertyAccess || null;


    // PETS
    
    const {
        data: pets,
        error: petsError
    } =
        await supabaseClient
            .from("pets")
            .select("*")
            .eq(
                "client_id",
                currentUser.id
            )
            .eq(
                "active",
                true
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );
    
    
    if (petsError) {
    
        console.error(
            "Pets error:",
            petsError
        );
    
    }
    
    
    currentPets =
        pets || [];
    
    
    // UPCOMING VISITS

    const today =
        getLocalDateString();


    const {
        data: visits,
        error: visitsError
    } =
        await supabaseClient
            .from("visits")
            .select("*")
            .eq(
                "client_id",
                currentUser.id
            )
            .order(
                "visit_date",
                {
                    ascending: true
                }
            );


    if (visitsError) {

        console.error(
            "Visits error:",
            visitsError
        );

    }


    currentVisits =
        visits || [];


    // ========================================
    // VISIT PET RELATIONSHIPS
    // ========================================

    currentVisitPets =
        [];


    const visitIds =
        currentVisits.map(
            visit => visit.id
        );


    if (
        visitIds.length > 0
    ) {

        const {
            data: visitPets,
            error: visitPetsError
        } =
            await supabaseClient
                .from("visit_pets")
                .select(
                    "visit_id, pet_id, is_primary, additional_pet_fee"
                )
                .in(
                    "visit_id",
                    visitIds
                );


        if (visitPetsError) {

            console.error(
                "Visit pets error:",
                visitPetsError
            );

        } else {

            currentVisitPets =
                visitPets || [];

        }

    }

    await loadPetStats();

    const welcomeName =
        document.getElementById(
            "welcome-name"
        );


    if (welcomeName) {

        welcomeName.textContent =
            `Welcome, ${currentProfile.full_name || "Client"}`;

    }


    await renderHousehold();

    await renderPets();

    populateBookingPets();

    renderAdditionalPets();


    if (
        !selectedUpcomingDate
    ) {

        const visitsToday =
            currentVisits.filter(
                visit =>
                    visit.visit_date ===
                    today
            );


        const firstFutureVisit =
            currentVisits.find(
                visit =>
                    visit.visit_date >
                    today
            );


        let startingDate =
            today;


        if (
            visitsToday.length > 0
        ) {

            startingDate =
                today;

        } else if (
            firstFutureVisit
        ) {

            startingDate =
                firstFutureVisit.visit_date;

        }


        const startDate =
            parseLocalDate(
                startingDate
            );


        upcomingCalendarYear =
            startDate.getFullYear();


        upcomingCalendarMonth =
            startDate.getMonth();


        selectedUpcomingDate =
            startingDate;

    }


    renderUpcomingCalendar();

    renderSelectedUpcomingServices();

    renderBookingCalendar();


    loading.style.display =
        "none";


    dashboardContent.style.display =
        "block";


// ========================================
// INITIAL CLIENT NOTIFICATIONS
// ========================================

await loadClientNotifications();

subscribeToClientNotifications();

// ========================================
// INITIAL LATEST UPDATE / MOBILE APP HOME
// ========================================

renderMobileHomeDashboard();


if (
    window.matchMedia(
        "(max-width: 700px)"
    ).matches
) {

    setMobileAppScreen(
        "home"
    );


    setActiveMobileAppTab(
        "home"
    );

}

}

// ========================================
// HOUSEHOLD DISPLAY
// ========================================

async function renderHousehold() {

    if (!currentProfile) {
        return;
    }


    const name =
        currentProfile.full_name ||
        "Client";


    const email =
        currentProfile.email ||
        currentUser?.email ||
        "Email not available";


    const phone =
        currentProfile.phone ||
        "Phone not added";


    document.getElementById(
        "household-display-name"
    ).textContent =
        name;


    document.getElementById(
        "household-display-email"
    ).textContent =
        email;


    document.getElementById(
        "household-display-phone"
    ).textContent =
        phone;


    const initials =
        getInitials(
            name
        );


    const initialsElement =
        document.getElementById(
            "client-profile-initials"
        );


    const profileImage =
        document.getElementById(
            "client-profile-image"
        );


    initialsElement.textContent =
        initials;


    profileImage.style.display =
        "none";


    initialsElement.style.display =
        "flex";


    if (
        currentProfile.profile_photo_path
    ) {

        const photoUrl =
            await getProfilePhotoUrl(
                currentProfile.profile_photo_path
            );


        if (photoUrl) {

            profileImage.src =
                photoUrl;


            profileImage.style.display =
                "block";


            initialsElement.style.display =
                "none";

        }

    }


    renderHouseholdAddress();

    renderHouseholdContact();

    renderEmergencyContact();

    await renderAccountCredit();

    renderPropertyAccess();

    renderHomeNotes();

}


// ========================================
// ACCOUNT CREDIT DISPLAY
// ========================================

async function renderAccountCredit() {

    const card =
        document.getElementById(
            "household-credit-card"
        );


    const container =
        document.getElementById(
            "household-display-credit"
        );


    if (
        !card ||
        !container
    ) {
        return;
    }


    // ========================================
    // HIDE UNTIL POSITIVE CREDIT IS CONFIRMED
    // ========================================

    card.style.display =
        "none";


    container.textContent =
        "$0.00";


    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_my_credit_balance"
            );


        if (error) {
            throw error;
        }


        const balance =
            Number(
                data || 0
            );


        // ========================================
        // SHOW ONLY POSITIVE CREDIT BALANCES
        // ========================================

        if (
            balance > 0
        ) {

            container.textContent =
                balance.toLocaleString(
                    "en-US",
                    {
                        style: "currency",
                        currency: "USD"
                    }
                );


            card.style.display =
                "";

        }

    }
    catch (error) {

        console.error(
            "Credit balance error:",
            error
        );


        card.style.display =
            "none";

    }

}

// ========================================
// HOUSEHOLD ADDRESS DISPLAY
// ========================================

function renderHouseholdAddress() {

    const container =
        document.getElementById(
            "household-display-address"
        );


    const household =
        currentHousehold || {};


    const lines =
        [];


    if (
        household.street_address
    ) {

        lines.push(
            household.street_address
        );

    }


    if (
        household.address_line_2
    ) {

        lines.push(
            household.address_line_2
        );

    }


    const cityStateZip =
        [
            household.city,
            household.state
        ]
            .filter(Boolean)
            .join(", ") +
        (
            household.zip_code
                ? ` ${household.zip_code}`
                : ""
        );


    if (
        cityStateZip.trim()
    ) {

        lines.push(
            cityStateZip.trim()
        );

    }


    if (
        lines.length === 0
    ) {

        container.textContent =
            "Not added";

        return;

    }


    container.innerHTML =
        lines
            .map(
                line =>
                    escapeHtml(line)
            )
            .join("<br>");

}


// ========================================
// CONTACT DISPLAY
// ========================================

function renderHouseholdContact() {

    document.getElementById(
        "household-display-contact-method"
    ).textContent =
        currentHousehold
            ?.preferred_contact_method ||
        "Not added";

}


// ========================================
// EMERGENCY DISPLAY
// ========================================

function renderEmergencyContact() {

    const container =
        document.getElementById(
            "household-display-emergency"
        );


    const name =
        currentHousehold
            ?.emergency_contact_name;


    const phone =
        currentHousehold
            ?.emergency_contact_phone;


    if (
        !name &&
        !phone
    ) {

        container.textContent =
            "Not added";

        return;

    }


    const parts =
        [];


    if (name) {

        parts.push(
            `<strong>${escapeHtml(name)}</strong>`
        );

    }


    if (phone) {

        parts.push(
            escapeHtml(phone)
        );

    }


    container.innerHTML =
        parts.join("<br>");

}


// ========================================
// ACCESS DISPLAY
// ========================================

function renderPropertyAccess() {

    const access =
        currentPropertyAccess || {};


    setMultilineDisplay(
        "display-gate-code",
        access.gate_code,
        "Not added"
    );


    setMultilineDisplay(
        "display-door-code",
        access.door_code,
        "Not added"
    );


    setMultilineDisplay(
        "display-key-instructions",
        access.key_instructions,
        "Not added"
    );


    setMultilineDisplay(
        "display-alarm-instructions",
        access.alarm_instructions,
        "Not added"
    );


    setMultilineDisplay(
        "display-parking-instructions",
        access.parking_instructions,
        "Not added"
    );


    setMultilineDisplay(
        "display-other-access-notes",
        access.other_access_notes,
        "Not added"
    );

}


// ========================================
// HOME NOTES DISPLAY
// ========================================

function renderHomeNotes() {

    setMultilineDisplay(
        "household-display-home-notes",
        currentHousehold?.home_notes,
        "No home notes added."
    );

}


// ========================================
// PROFILE PHOTO URL
// ========================================

async function getProfilePhotoUrl(
    photoPath
) {

    if (!photoPath) {

        return null;

    }


    if (
        profilePhotoUrlCache.has(
            photoPath
        )
    ) {

        return profilePhotoUrlCache.get(
            photoPath
        );

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .storage
            .from(
                PROFILE_PHOTO_BUCKET
            )
            .createSignedUrl(
                photoPath,
                3600
            );


    if (
        error ||
        !data?.signedUrl
    ) {

        console.error(
            "Profile photo signed URL error:",
            error
        );


        return null;

    }


    profilePhotoUrlCache.set(
        photoPath,
        data.signedUrl
    );


    return data.signedUrl;

}

// ========================================
// PROFILE DETAIL COLLAPSE TOGGLES
// ========================================

const propertyAccessToggle =
    document.getElementById(
        "property-access-toggle"
    );


const propertyAccessContent =
    document.getElementById(
        "property-access-content"
    );


const accountSecurityToggle =
    document.getElementById(
        "account-security-toggle"
    );


const accountSecurityContent =
    document.getElementById(
        "account-security-content"
    );


const clientNotificationsToggle =
    document.getElementById(
        "client-notifications-toggle"
    );


const clientNotificationsModal =
    document.getElementById(
        "client-notifications-modal"
    );


const clientNotificationsClose =
    document.getElementById(
        "client-notifications-close"
    );


// ========================================
// PROPERTY ACCESS TOGGLE
// ========================================

if (
    propertyAccessToggle &&
    propertyAccessContent
) {

    propertyAccessToggle.addEventListener(
        "click",
        () => {

            const isExpanded =
                propertyAccessToggle
                    .getAttribute(
                        "aria-expanded"
                    ) ===
                    "true";


            propertyAccessToggle.setAttribute(
                "aria-expanded",
                String(
                    !isExpanded
                )
            );


            propertyAccessContent.hidden =
                isExpanded;

        }
    );

}


// ========================================
// ACCOUNT SECURITY TOGGLE
// ========================================

if (
    accountSecurityToggle &&
    accountSecurityContent
) {

    accountSecurityToggle.addEventListener(
        "click",
        () => {

            const isExpanded =
                accountSecurityToggle
                    .getAttribute(
                        "aria-expanded"
                    ) ===
                    "true";


            accountSecurityToggle.setAttribute(
                "aria-expanded",
                String(
                    !isExpanded
                )
            );


            accountSecurityContent.hidden =
                isExpanded;

        }
    );

}


// ========================================
// OPEN CLIENT NOTIFICATION SETTINGS
// ========================================

function openClientNotificationSettings() {

    if (
        !clientNotificationsModal
    ) {

        return;

    }


    clientNotificationsModal.hidden =
        false;


    document.body.classList.add(
        "client-notifications-modal-open"
    );


    window.requestAnimationFrame(
        () => {

            clientNotificationsClose
                ?.focus({
                    preventScroll:
                        true
                });

        }
    );

}


// ========================================
// CLOSE CLIENT NOTIFICATION SETTINGS
// ========================================

function closeClientNotificationSettings() {

    if (
        !clientNotificationsModal
    ) {

        return;

    }


    clientNotificationsModal.hidden =
        true;


    document.body.classList.remove(
        "client-notifications-modal-open"
    );

}


// ========================================
// NOTIFICATION SETTINGS LAUNCHER
// ========================================

clientNotificationsToggle
    ?.addEventListener(
        "click",
        openClientNotificationSettings
    );


// ========================================
// NOTIFICATION SETTINGS CLOSE BUTTON
// ========================================

clientNotificationsClose
    ?.addEventListener(
        "click",
        closeClientNotificationSettings
    );


// ========================================
// NOTIFICATION SETTINGS BACKDROP
// ========================================

clientNotificationsModal
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "[data-client-notifications-close]"
                )
            ) {

                closeClientNotificationSettings();

            }

        }
    );


// ========================================
// NOTIFICATION SETTINGS ESCAPE KEY
// ========================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
                "Escape" ||
            !clientNotificationsModal ||
            clientNotificationsModal.hidden
        ) {

            return;

        }


        closeClientNotificationSettings();

    }
);

// ========================================
// HOUSEHOLD EDIT FORM
// ========================================

const editHouseholdButton =
    document.getElementById(
        "edit-household-button"
    );


const householdFormPanel =
    document.getElementById(
        "household-form-panel"
    );


const householdForm =
    document.getElementById(
        "household-form"
    );


if (editHouseholdButton) {

    editHouseholdButton.addEventListener(
        "click",
        openHouseholdForm
    );

}


const closeHouseholdFormButton =
    document.getElementById(
        "close-household-form-button"
    );


if (closeHouseholdFormButton) {

    closeHouseholdFormButton.addEventListener(
        "click",
        closeHouseholdForm
    );

}


const cancelHouseholdButton =
    document.getElementById(
        "cancel-household-button"
    );


if (cancelHouseholdButton) {

    cancelHouseholdButton.addEventListener(
        "click",
        closeHouseholdForm
    );

}


// ========================================
// OPEN HOUSEHOLD FORM
// ========================================

async function openHouseholdForm() {

    pendingClientPhotoFile =
        null;


    clearClientPhotoPreviewUrl();


    const profile =
        currentProfile || {};


    const household =
        currentHousehold || {};


    const access =
        currentPropertyAccess || {};


    document.getElementById(
        "household-full-name"
    ).value =
        profile.full_name || "";


    document.getElementById(
        "household-phone"
    ).value =
        profile.phone || "";


    document.getElementById(
        "household-email"
    ).value =
        profile.email ||
        currentUser?.email ||
        "";


    document.getElementById(
        "household-street-address"
    ).value =
        household.street_address || "";


    document.getElementById(
        "household-address-line-2"
    ).value =
        household.address_line_2 || "";


    document.getElementById(
        "household-city"
    ).value =
        household.city || "";


    document.getElementById(
        "household-state"
    ).value =
        household.state || "";


    document.getElementById(
        "household-zip"
    ).value =
        household.zip_code || "";


    document.getElementById(
        "household-preferred-contact"
    ).value =
        household.preferred_contact_method || "";


    document.getElementById(
        "emergency-contact-name"
    ).value =
        household.emergency_contact_name || "";


    document.getElementById(
        "emergency-contact-phone"
    ).value =
        household.emergency_contact_phone || "";


    document.getElementById(
        "household-home-notes"
    ).value =
        household.home_notes || "";


    document.getElementById(
        "access-gate-code"
    ).value =
        access.gate_code || "";


    document.getElementById(
        "access-door-code"
    ).value =
        access.door_code || "";


    document.getElementById(
        "access-key-instructions"
    ).value =
        access.key_instructions || "";


    document.getElementById(
        "access-alarm-instructions"
    ).value =
        access.alarm_instructions || "";


    document.getElementById(
        "access-parking-instructions"
    ).value =
        access.parking_instructions || "";


    document.getElementById(
        "access-other-notes"
    ).value =
        access.other_access_notes || "";


    document.getElementById(
        "household-form-message"
    ).textContent =
        "";


    await setClientFormPhotoPreview();


    householdFormPanel.style.display =
        "block";


    householdFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ========================================
// CLOSE HOUSEHOLD FORM
// ========================================

function closeHouseholdForm() {

    pendingClientPhotoFile =
        null;


    clearClientPhotoPreviewUrl();


    document.getElementById(
        "client-photo-input"
    ).value =
        "";


    householdFormPanel.style.display =
        "none";

}


// ========================================
// CLIENT FORM PHOTO PREVIEW
// ========================================

async function setClientFormPhotoPreview() {

    const preview =
        document.getElementById(
            "client-photo-preview"
        );


    const initials =
        document.getElementById(
            "client-photo-preview-initials"
        );


    initials.textContent =
        getInitials(
            currentProfile?.full_name ||
            "Client"
        );


    preview.style.display =
        "none";


    initials.style.display =
        "flex";


    if (
        currentProfile
            ?.profile_photo_path
    ) {

        const url =
            await getProfilePhotoUrl(
                currentProfile.profile_photo_path
            );


        if (url) {

            preview.src =
                url;


            preview.style.display =
                "block";


            initials.style.display =
                "none";

        }

    }

}


// ========================================
// CLIENT PHOTO INPUT
// ========================================

const clientPhotoInput =
    document.getElementById(
        "client-photo-input"
    );


if (clientPhotoInput) {

    clientPhotoInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            const message =
                document.getElementById(
                    "household-form-message"
                );


            message.textContent =
                "";


            if (!file) {

                pendingClientPhotoFile =
                    null;

                return;

            }


            if (
                !ALLOWED_PHOTO_TYPES.includes(
                    file.type
                )
            ) {

                clientPhotoInput.value =
                    "";


                pendingClientPhotoFile =
                    null;


                message.textContent =
                    "Please choose a JPG, PNG, or WebP image.";

                return;

            }


            if (
                file.size >
                MAX_PHOTO_SIZE
            ) {

                clientPhotoInput.value =
                    "";


                pendingClientPhotoFile =
                    null;


                message.textContent =
                    "That photo is larger than 5 MB.";

                return;

            }


            pendingClientPhotoFile =
                file;


            clearClientPhotoPreviewUrl();


            clientPhotoPreviewObjectUrl =
                URL.createObjectURL(
                    file
                );


            const preview =
                document.getElementById(
                    "client-photo-preview"
                );


            preview.src =
                clientPhotoPreviewObjectUrl;


            preview.style.display =
                "block";


            document.getElementById(
                "client-photo-preview-initials"
            ).style.display =
                "none";

        }
    );

}

// ========================================
// CLIENT PROFILE INPUT HELPERS
// ========================================

function formatClientPhoneNumber(
    value
) {

    const digits =
        String(
            value || ""
        )
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                10
            );


    if (
        digits.length <=
        3
    ) {

        return digits;

    }


    if (
        digits.length <=
        6
    ) {

        return (
            `${digits.slice(0, 3)}-` +
            `${digits.slice(3)}`
        );

    }


    return (
        `${digits.slice(0, 3)}-` +
        `${digits.slice(3, 6)}-` +
        `${digits.slice(6, 10)}`
    );

}


function isValidClientFullName(
    value
) {

    const parts =
        String(
            value || ""
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(Boolean);


    return (
        parts.length >= 2 &&
        parts.every(
            part =>
                part.length >= 2
        )
    );

}


// ========================================
// CLIENT PROFILE LIVE FORMATTING
// ========================================

const householdPhoneInput =
    document.getElementById(
        "household-phone"
    );


const emergencyPhoneInput =
    document.getElementById(
        "emergency-contact-phone"
    );


const householdZipInput =
    document.getElementById(
        "household-zip"
    );


householdPhoneInput
    ?.addEventListener(
        "input",
        () => {

            householdPhoneInput.value =
                formatClientPhoneNumber(
                    householdPhoneInput.value
                );

        }
    );


emergencyPhoneInput
    ?.addEventListener(
        "input",
        () => {

            emergencyPhoneInput.value =
                formatClientPhoneNumber(
                    emergencyPhoneInput.value
                );

        }
    );


householdZipInput
    ?.addEventListener(
        "input",
        () => {

            householdZipInput.value =
                householdZipInput.value
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        5
                    );

        }
    );

// ========================================
// HOUSEHOLD FIELD VALIDATION
// ========================================

function formatHouseholdPhoneNumber(
    value
) {

    const digits =
        String(
            value || ""
        )
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                10
            );


    if (
        digits.length <=
        3
    ) {

        return digits;

    }


    if (
        digits.length <=
        6
    ) {

        return (
            `${digits.slice(0, 3)}-` +
            `${digits.slice(3)}`
        );

    }


    return (
        `${digits.slice(0, 3)}-` +
        `${digits.slice(3, 6)}-` +
        `${digits.slice(6, 10)}`
    );

}


function isValidHouseholdFullName(
    value
) {

    const parts =
        String(
            value || ""
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(Boolean);


    return (
        parts.length >=
        2
    );

}


function clearHouseholdFieldErrors() {

    document
        .querySelectorAll(
            ".household-field-error"
        )
        .forEach(
            field => {

                field.classList.remove(
                    "household-field-error"
                );

                field.removeAttribute(
                    "aria-invalid"
                );

            }
        );

}


function clearHouseholdFieldError(
    event
) {

    const field =
        event?.target;


    if (!field) {
        return;
    }


    field.classList.remove(
        "household-field-error"
    );


    field.removeAttribute(
        "aria-invalid"
    );

}


function focusHouseholdFieldError(
    field
) {

    if (!field) {
        return false;
    }


    field.classList.add(
        "household-field-error"
    );


    field.setAttribute(
        "aria-invalid",
        "true"
    );


    field.focus({
        preventScroll: true
    });


    field.scrollIntoView({
        behavior:
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
                ? "auto"
                : "smooth",

        block:
            "center"
    });


    return false;

}


// ========================================
// HOUSEHOLD PHONE LIVE FORMATTING
// ========================================

const validationHouseholdPhoneInput =
    document.getElementById(
        "household-phone"
    );


if (
    validationHouseholdPhoneInput
) {

    validationHouseholdPhoneInput.addEventListener(
        "input",
        event => {

            event.target.value =
                formatHouseholdPhoneNumber(
                    event.target.value
                );


            clearHouseholdFieldError(
                event
            );

        }
    );

}


// ========================================
// EMERGENCY PHONE LIVE FORMATTING
// ========================================

const validationEmergencyContactPhoneInput =
    document.getElementById(
        "emergency-contact-phone"
    );


if (
    validationEmergencyContactPhoneInput
) {

    validationEmergencyContactPhoneInput.addEventListener(
        "input",
        event => {

            event.target.value =
                formatHouseholdPhoneNumber(
                    event.target.value
                );


            clearHouseholdFieldError(
                event
            );

        }
    );

}


// ========================================
// HOUSEHOLD ZIP LIVE FORMATTING
// ========================================

const validationHouseholdZipInput =
    document.getElementById(
        "household-zip"
    );


if (
    validationHouseholdZipInput
) {

    validationHouseholdZipInput.addEventListener(
        "input",
        event => {

            event.target.value =
                String(
                    event.target.value ||
                    ""
                )
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        5
                    );


            clearHouseholdFieldError(
                event
            );

        }
    );

}


// ========================================
// CLEAR REQUIRED FIELD ERROR STATES
// ========================================

[
    "household-full-name",
    "household-street-address",
    "household-city",
    "household-state"
]
    .forEach(
        id => {

            const field =
                document.getElementById(
                    id
                );


            field?.addEventListener(
                "input",
                clearHouseholdFieldError
            );


            field?.addEventListener(
                "change",
                clearHouseholdFieldError
            );

        }
    );


// ========================================
// SAVE HOUSEHOLD
// ========================================

if (householdForm) {

    householdForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "household-form-message"
                );


            const saveButton =
                document.getElementById(
                    "save-household-button"
                );


            clearHouseholdFieldErrors();


            // ========================================
            // GET FORM FIELDS
            // ========================================

            const fullNameField =
                document.getElementById(
                    "household-full-name"
                );


            const phoneField =
                document.getElementById(
                    "household-phone"
                );


            const streetAddressField =
                document.getElementById(
                    "household-street-address"
                );


            const addressLine2Field =
                document.getElementById(
                    "household-address-line-2"
                );


            const cityField =
                document.getElementById(
                    "household-city"
                );


            const stateField =
                document.getElementById(
                    "household-state"
                );


            const zipField =
                document.getElementById(
                    "household-zip"
                );


            const emergencyContactNameField =
                document.getElementById(
                    "emergency-contact-name"
                );


            const emergencyPhoneField =
                document.getElementById(
                    "emergency-contact-phone"
                );


            // ========================================
            // NORMALIZE FORM VALUES
            // ========================================

            const fullName =
                formatProperName(
                    fullNameField?.value
                );


            const phone =
                String(
                    phoneField?.value ||
                    ""
                )
                    .trim();


            const streetAddress =
                formatStreetAddress(
                    streetAddressField?.value
                );


            const addressLine2 =
                formatAddressLine2(
                    addressLine2Field?.value
                );


            const city =
                formatCityName(
                    cityField?.value
                );


            const state =
                formatStateAbbreviation(
                    stateField?.value
                );


            const zip =
                String(
                    zipField?.value ||
                    ""
                )
                    .trim();


            const emergencyContactName =
                formatProperName(
                    emergencyContactNameField
                        ?.value
                );


            const emergencyPhone =
                String(
                    emergencyPhoneField?.value ||
                    ""
                )
                    .trim();


            // ========================================
            // PUT NORMALIZED VALUES BACK IN FORM
            // ========================================

            if (fullNameField) {

                fullNameField.value =
                    fullName;

            }


            if (streetAddressField) {

                streetAddressField.value =
                    streetAddress;

            }


            if (addressLine2Field) {

                addressLine2Field.value =
                    addressLine2;

            }


            if (cityField) {

                cityField.value =
                    city;

            }


            if (stateField) {

                stateField.value =
                    state;

            }


            if (
                emergencyContactNameField
            ) {

                emergencyContactNameField
                    .value =
                    emergencyContactName;

            }


            // ========================================
            // FULL NAME VALIDATION
            // ========================================

            if (
                !isValidHouseholdFullName(
                    fullName
                )
            ) {

                focusHouseholdFieldError(
                    fullNameField
                );

                return;

            }


            // ========================================
            // PHONE VALIDATION
            // ========================================

            const phoneDigits =
                phone.replace(
                    /\D/g,
                    ""
                );


            if (
                phoneDigits.length !==
                10
            ) {

                focusHouseholdFieldError(
                    phoneField
                );

                return;

            }


            // ========================================
            // STREET ADDRESS VALIDATION
            // ========================================

            if (
                !streetAddress
            ) {

                focusHouseholdFieldError(
                    streetAddressField
                );

                return;

            }


            // ========================================
            // CITY VALIDATION
            // ========================================

            if (
                !city
            ) {

                focusHouseholdFieldError(
                    cityField
                );

                return;

            }


            // ========================================
            // STATE VALIDATION
            // ========================================

            if (
                !state
            ) {

                focusHouseholdFieldError(
                    stateField
                );

                return;

            }


            // ========================================
            // ZIP VALIDATION
            // ========================================

            if (
                !/^\d{5}$/.test(
                    zip
                )
            ) {

                focusHouseholdFieldError(
                    zipField
                );

                return;

            }


            // ========================================
            // EMERGENCY PHONE VALIDATION
            // ========================================

            if (
                emergencyPhone &&
                emergencyPhone.replace(
                    /\D/g,
                    ""
                ).length !==
                10
            ) {

                focusHouseholdFieldError(
                    emergencyPhoneField
                );

                return;

            }


            saveButton.disabled =
                true;


            saveButton.textContent =
                "Saving...";


            try {

                // ========================================
                // UPDATE CLIENT PROFILE
                // ========================================

                const {
                    error: profileUpdateError
                } =
                    await supabaseClient
                        .from("profiles")
                        .update({

                            full_name:
                                fullName,

                            phone:
                                valueOrNull(
                                    "household-phone"
                                )

                        })
                        .eq(
                            "id",
                            currentUser.id
                        );


                if (
                    profileUpdateError
                ) {

                    throw profileUpdateError;

                }


                // ========================================
                // SAVE HOUSEHOLD
                // ========================================

                const householdPayload = {

                    client_id:
                        currentUser.id,

                    street_address:
                        streetAddress ||
                        null,

                    address_line_2:
                        addressLine2 ||
                        null,

                    city:
                        city ||
                        null,

                    state:
                        state ||
                        null,

                    zip_code:
                        valueOrNull(
                            "household-zip"
                        ),

                    preferred_contact_method:
                        valueOrNull(
                            "household-preferred-contact"
                        ),

                    emergency_contact_name:
                        emergencyContactName ||
                        null,

                    emergency_contact_phone:
                        valueOrNull(
                            "emergency-contact-phone"
                        ),

                    home_notes:
                        valueOrNull(
                            "household-home-notes"
                        )

                };


                const {
                    error: householdError
                } =
                    await supabaseClient
                        .from("households")
                        .upsert(
                            householdPayload,
                            {
                                onConflict:
                                    "client_id"
                            }
                        );


                if (
                    householdError
                ) {

                    throw householdError;

                }


                // ========================================
                // SAVE PROPERTY ACCESS
                // ========================================

                const propertyAccessPayload = {

                    client_id:
                        currentUser.id,

                    gate_code:
                        valueOrNull(
                            "access-gate-code"
                        ),

                    door_code:
                        valueOrNull(
                            "access-door-code"
                        ),

                    key_instructions:
                        valueOrNull(
                            "access-key-instructions"
                        ),

                    alarm_instructions:
                        valueOrNull(
                            "access-alarm-instructions"
                        ),

                    parking_instructions:
                        valueOrNull(
                            "access-parking-instructions"
                        ),

                    other_access_notes:
                        valueOrNull(
                            "access-other-notes"
                        )

                };


                const {
                    error: propertyAccessError
                } =
                    await supabaseClient
                        .from("property_access")
                        .upsert(
                            propertyAccessPayload,
                            {
                                onConflict:
                                    "client_id"
                            }
                        );


                if (
                    propertyAccessError
                ) {

                    throw propertyAccessError;

                }


                // ========================================
                // SAVE PROFILE PHOTO
                // ========================================

                if (
                    pendingClientPhotoFile
                ) {

                    const oldPhotoPath =
                        currentProfile
                            ?.profile_photo_path ||
                        null;


                    const newPhotoPath =
                        await uploadClientPhoto(
                            pendingClientPhotoFile
                        );


                    const {
                        error: photoUpdateError
                    } =
                        await supabaseClient
                            .from("profiles")
                            .update({

                                profile_photo_path:
                                    newPhotoPath

                            })
                            .eq(
                                "id",
                                currentUser.id
                            );


                    if (
                        photoUpdateError
                    ) {

                        await supabaseClient
                            .storage
                            .from(
                                PROFILE_PHOTO_BUCKET
                            )
                            .remove([
                                newPhotoPath
                            ]);


                        throw photoUpdateError;

                    }


                    if (
                        oldPhotoPath &&
                        oldPhotoPath !==
                            newPhotoPath
                    ) {

                        const {
                            error:
                                oldDeleteError
                        } =
                            await supabaseClient
                                .storage
                                .from(
                                    PROFILE_PHOTO_BUCKET
                                )
                                .remove([
                                    oldPhotoPath
                                ]);


                        if (
                            oldDeleteError
                        ) {

                            console.warn(
                                "Old profile photo cleanup failed:",
                                oldDeleteError
                            );

                        }

                    }

                }


                // ========================================
                // REFRESH + CLOSE
                // ========================================

                await refreshHousehold();


                closeHouseholdForm();


                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "Save Profile";

            }
            catch (error) {

                console.error(
                    "Household save error:",
                    error
                );


                if (message) {

                    message.textContent =
                        "We couldn't save your household information.";

                }


                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "Save Profile";

            }

        }
    );

}


// ========================================
// CHANGE ACCOUNT PASSWORD
// ========================================

const changePasswordForm =
    document.getElementById(
        "change-password-form"
    );


if (
    changePasswordForm
) {

    changePasswordForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const newPasswordField =
                document.getElementById(
                    "new-password"
                );


            const confirmPasswordField =
                document.getElementById(
                    "confirm-new-password"
                );


            const changePasswordButton =
                document.getElementById(
                    "change-password-button"
                );


            const message =
                document.getElementById(
                    "change-password-message"
                );


            if (
                !newPasswordField ||
                !confirmPasswordField ||
                !changePasswordButton
            ) {

                return;

            }


            const newPassword =
                String(
                    newPasswordField.value ||
                    ""
                );


            const confirmPassword =
                String(
                    confirmPasswordField.value ||
                    ""
                );


            // ========================================
            // RESET VALIDATION STATE
            // ========================================

            newPasswordField.classList.remove(
                "change-password-field-error"
            );


            confirmPasswordField.classList.remove(
                "change-password-field-error"
            );


            if (
                message
            ) {

                message.textContent =
                    "";

                message.classList.remove(
                    "is-success",
                    "is-error"
                );

            }


            // ========================================
            // PASSWORD LENGTH VALIDATION
            // ========================================

            if (
                newPassword.length <
                8
            ) {

                newPasswordField.classList.add(
                    "change-password-field-error"
                );


                if (
                    message
                ) {

                    message.textContent =
                        "Your new password must be at least 8 characters.";

                    message.classList.add(
                        "is-error"
                    );

                }


                newPasswordField.focus();


                return;

            }


            // ========================================
            // CONFIRM PASSWORD VALIDATION
            // ========================================

            if (
                newPassword !==
                confirmPassword
            ) {

                confirmPasswordField.classList.add(
                    "change-password-field-error"
                );


                if (
                    message
                ) {

                    message.textContent =
                        "Your passwords do not match.";

                    message.classList.add(
                        "is-error"
                    );

                }


                confirmPasswordField.focus();


                return;

            }


            // ========================================
            // UPDATE BUTTON STATE
            // ========================================

            changePasswordButton.disabled =
                true;


            changePasswordButton.textContent =
                "Updating...";


            try {


                // ========================================
                // UPDATE SUPABASE AUTH PASSWORD
                // ========================================

                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .updateUser({

                            password:
                                newPassword

                        });


                if (
                    error
                ) {

                    throw error;

                }


                // ========================================
                // CLEAR PASSWORD FIELDS
                // ========================================

                newPasswordField.value =
                    "";


                confirmPasswordField.value =
                    "";


                newPasswordField.classList.remove(
                    "change-password-field-error"
                );


                confirmPasswordField.classList.remove(
                    "change-password-field-error"
                );


                // ========================================
                // SUCCESS MESSAGE
                // ========================================

                if (
                    message
                ) {

                    message.textContent =
                        "Password updated successfully.";

                    message.classList.remove(
                        "is-error"
                    );


                    message.classList.add(
                        "is-success"
                    );

                }

            }
            catch (
                error
            ) {

                console.error(
                    "Password update error:",
                    error
                );


                if (
                    message
                ) {

                    let errorMessage =
                        "We couldn't update your password. Please try again.";


                    const errorText =
                        String(
                            error?.message ||
                            ""
                        )
                            .toLowerCase();


                    if (
                        errorText.includes(
                            "same password"
                        ) ||
                        errorText.includes(
                            "different from the old password"
                        )
                    ) {

                        errorMessage =
                            "Your new password must be different from your current password.";

                    }


                    if (
                        errorText.includes(
                            "password should be at least"
                        ) ||
                        errorText.includes(
                            "password must be at least"
                        )
                    ) {

                        errorMessage =
                            "Your new password does not meet the password requirements.";

                    }


                    message.textContent =
                        errorMessage;


                    message.classList.remove(
                        "is-success"
                    );


                    message.classList.add(
                        "is-error"
                    );

                }

            }
            finally {

                changePasswordButton.disabled =
                    false;


                changePasswordButton.textContent =
                    "Update Password";

            }

        }
    );


    // ========================================
    // CLEAR PASSWORD ERRORS WHILE TYPING
    // ========================================

    [
        "new-password",
        "confirm-new-password"
    ]
        .forEach(
            id => {

                const field =
                    document.getElementById(
                        id
                    );


                field?.addEventListener(
                    "input",
                    () => {

                        field.classList.remove(
                            "change-password-field-error"
                        );


                        const message =
                            document.getElementById(
                                "change-password-message"
                            );


                        if (
                            message
                        ) {

                            message.textContent =
                                "";


                            message.classList.remove(
                                "is-success",
                                "is-error"
                            );

                        }

                    }
                );

            }
        );

}


// ========================================
// UPLOAD CLIENT PHOTO
// ========================================

async function uploadClientPhoto(
    file
) {

    const extension =
        getFileExtensionForMime(
            file.type
        );


    const filePath =
        `${currentUser.id}/${crypto.randomUUID()}.${extension}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(
                PROFILE_PHOTO_BUCKET
            )
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type
                }
            );


    if (error) {

        throw error;

    }


    return filePath;

}


// ========================================
// REFRESH HOUSEHOLD
// ========================================

async function refreshHousehold() {

    const [
        profileResult,
        householdResult,
        accessResult
    ] =
        await Promise.all([

            supabaseClient
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    currentUser.id
                )
                .single(),

            supabaseClient
                .from("households")
                .select("*")
                .eq(
                    "client_id",
                    currentUser.id
                )
                .maybeSingle(),

            supabaseClient
                .from("property_access")
                .select("*")
                .eq(
                    "client_id",
                    currentUser.id
                )
                .maybeSingle()

        ]);


    if (
        profileResult.error
    ) {

        throw profileResult.error;

    }


    if (
        householdResult.error
    ) {

        throw householdResult.error;

    }


    if (
        accessResult.error
    ) {

        throw accessResult.error;

    }


    currentProfile =
        profileResult.data;


    currentHousehold =
        householdResult.data || null;


    currentPropertyAccess =
        accessResult.data || null;


    profilePhotoUrlCache.clear();


    const welcomeName =
        document.getElementById(
            "welcome-name"
        );


    if (welcomeName) {

        welcomeName.textContent =
            `Welcome, ${currentProfile.full_name || "Client"}`;

    }


    await renderHousehold();

}


// ========================================
// PET DISPLAY
// ========================================

async function renderPets() {

    const container =
        document.getElementById(
            "pet-info"
        );


    if (!container) {
        return;
    }


    if (
        currentPets.length === 0
    ) {

        container.innerHTML =
            `
                <div class="no-pets-state">

                    <img
                        src="${DEFAULT_PET_AVATAR}"
                        alt=""
                        class="no-pets-avatar"
                    >

                    <strong>
                        No pets added yet
                    </strong>

                    <p>
                        Add your first pet to start building their care profile.
                    </p>

                </div>
            `;

        return;

    }


    const renderedPets =
        await Promise.all(

            currentPets.map(
                async pet => {

                    const photoUrl =
                        await getPetDisplayUrl(
                            pet
                        );


                    const breed =
                        pet.breed ||
                        "Breed not added";


                    const gender =
                        pet.gender ||
                        "Gender not added";


                    const birthday =
                        pet.birthday
                            ? formatPetBirthday(
                                pet.birthday
                            )
                            : "Not added";


                    const feedingNotes =
                        pet.feeding_notes ||
                        "No feeding notes added.";


                    const careNotes =
                        pet.care_notes ||
                        "No care notes added.";


                    return `
                        <article class="pet-profile-card">

                            <div class="pet-profile-top">

                                <img
                                    src="${escapeHtml(photoUrl)}"
                                    alt="${escapeHtml(pet.name)}"
                                    class="pet-profile-photo"
                                    data-pet-image
                                >


                                <div class="pet-profile-summary">

                                    <h4>
                                        ${escapeHtml(pet.name)}
                                    </h4>

                                    <p class="pet-profile-subtitle">
                                        ${escapeHtml(breed)}
                                        <span>•</span>
                                        ${escapeHtml(gender)}
                                    </p>

                                    <p class="pet-profile-birthday">
                                        <strong>Birthday:</strong>
                                        ${escapeHtml(birthday)}
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    class="edit-pet-button"
                                    data-pet-id="${pet.id}"
                                >
                                    Edit Pet
                                </button>

                            </div>

                            ${buildPetStatsHtml(pet)}

                            <div class="pet-profile-details">

                                <div class="pet-detail-block">

                                    <span class="pet-detail-label">
                                        Feeding Notes
                                    </span>

                                    <p>
                                        ${formatMultilineText(feedingNotes)}
                                    </p>

                                </div>


                                <div class="pet-detail-block">

                                    <span class="pet-detail-label">
                                        Care Notes
                                    </span>

                                    <p>
                                        ${formatMultilineText(careNotes)}
                                    </p>

                                </div>

                            </div>

                        </article>
                    `;

                }
            )

        );


    container.innerHTML =
        renderedPets.join("");


    container
        .querySelectorAll(
            "[data-pet-image]"
        )
        .forEach(
            image => {

                image.addEventListener(
                    "error",
                    () => {

                        image.src =
                            DEFAULT_PET_AVATAR;

                    },
                    {
                        once: true
                    }
                );

            }
        );


    container
        .querySelectorAll(
            ".edit-pet-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openEditPetForm(
                            Number(
                                button.dataset.petId
                            )
                        );

                    }
                );

            }
        );

}


// ========================================
// PRIVATE PET PHOTO URL
// ========================================

async function getPetDisplayUrl(
    pet
) {

    if (!pet.photo_path) {

        return DEFAULT_PET_AVATAR;

    }


    if (
        petPhotoUrlCache.has(
            pet.photo_path
        )
    ) {

        return petPhotoUrlCache.get(
            pet.photo_path
        );

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .storage
            .from(
                PET_PHOTO_BUCKET
            )
            .createSignedUrl(
                pet.photo_path,
                3600
            );


    if (
        error ||
        !data?.signedUrl
    ) {

        return DEFAULT_PET_AVATAR;

    }


    petPhotoUrlCache.set(
        pet.photo_path,
        data.signedUrl
    );


    return data.signedUrl;

}

// ========================================
// ADD / EDIT PET FORM
// ========================================

const addPetButton =
    document.getElementById(
        "add-pet-button"
    );


const petFormPanel =
    document.getElementById(
        "pet-form-panel"
    );


const petForm =
    document.getElementById(
        "pet-form"
    );


const removePetButton =
    document.getElementById(
        "remove-pet-button"
    );


if (addPetButton) {

    addPetButton.addEventListener(
        "click",
        openAddPetForm
    );

}


document
    .getElementById(
        "close-pet-form-button"
    )
    ?.addEventListener(
        "click",
        closePetForm
    );


document
    .getElementById(
        "cancel-pet-button"
    )
    ?.addEventListener(
        "click",
        closePetForm
    );


function openAddPetForm() {

    editingPet =
        null;


    pendingPetPhotoFile =
        null;


    clearPetPhotoPreviewUrl();


    petForm.reset();


    document.getElementById(
        "pet-form-title"
    ).textContent =
        "Add Pet";


    document.getElementById(
        "save-pet-button"
    ).textContent =
        "Add Pet";


    if (
        removePetButton
    ) {

        removePetButton.style.display =
            "none";

    }


    document.getElementById(
        "pet-photo-preview"
    ).src =
        DEFAULT_PET_AVATAR;


    document.getElementById(
        "pet-form-message"
    ).textContent =
        "";


    petFormPanel.style.display =
        "block";


    petFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ========================================
// EDIT PET
// ========================================

async function openEditPetForm(
    petId
) {

    const pet =
        currentPets.find(
            item =>
                Number(item.id) ===
                Number(petId)
        );


    if (!pet) {
        return;
    }


    editingPet =
        pet;


    pendingPetPhotoFile =
        null;


    clearPetPhotoPreviewUrl();


    document.getElementById(
        "pet-form-title"
    ).textContent =
        `Edit ${pet.name}`;


    document.getElementById(
        "save-pet-button"
    ).textContent =
        "Save Changes";


    if (
        removePetButton
    ) {

        removePetButton.style.display =
            "";

    }


    document.getElementById(
        "pet-id"
    ).value =
        pet.id;


    document.getElementById(
        "pet-name"
    ).value =
        pet.name || "";


    document.getElementById(
        "pet-breed"
    ).value =
        pet.breed || "";


    document.getElementById(
        "pet-gender"
    ).value =
        pet.gender || "";


    document.getElementById(
        "pet-birthday"
    ).value =
        pet.birthday || "";


    document.getElementById(
        "pet-feeding-notes"
    ).value =
        pet.feeding_notes || "";


    document.getElementById(
        "pet-care-notes"
    ).value =
        pet.care_notes || "";


    document.getElementById(
        "pet-photo-input"
    ).value =
        "";


    document.getElementById(
        "pet-form-message"
    ).textContent =
        "";


    document.getElementById(
        "pet-photo-preview"
    ).src =
        await getPetDisplayUrl(
            pet
        );


    petFormPanel.style.display =
        "block";


    petFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}

// ========================================
// CLOSE PET
// ========================================

function closePetForm() {

    editingPet =
        null;


    pendingPetPhotoFile =
        null;


    clearPetPhotoPreviewUrl();


    petForm?.reset();


    if (
        removePetButton
    ) {

        removePetButton.style.display =
            "none";

        removePetButton.disabled =
            false;

        removePetButton.textContent =
            "Remove Pet";

    }


    if (
        petFormPanel
    ) {

        petFormPanel.style.display =
            "none";

    }

}


// ========================================
// REMOVE PET
// ========================================

function closeRemovePetModal() {

    document
        .getElementById(
            "remove-pet-modal"
        )
        ?.remove();


    document.body.classList.remove(
        "client-modal-open"
    );

}


function openRemovePetModal() {

    if (
        !editingPet
    ) {
        return;
    }


    closeRemovePetModal();


    const petName =
        editingPet.name ||
        "this pet";


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "remove-pet-modal";


    overlay.className =
        "remove-pet-modal";


    overlay.innerHTML =
        `
            <div
                class="remove-pet-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="remove-pet-title"
            >

                <div class="remove-pet-header">

                    <div>

                        <span class="remove-pet-eyebrow">
                            Remove Pet
                        </span>

                        <h3 id="remove-pet-title">
                            Remove ${escapeHtml(
                                petName
                            )}?
                        </h3>

                    </div>


                    <button
                        type="button"
                        class="remove-pet-close"
                        data-remove-pet-close
                        aria-label="Close remove pet window"
                    >
                        ×
                    </button>

                </div>


                <div class="remove-pet-summary">

                    <strong>
                        ${escapeHtml(
                            petName
                        )}
                    </strong>

                    <span>
                        This pet will be removed from your household
                        and future booking options.
                    </span>

                </div>


                <div class="remove-pet-warning">

                    <strong>
                        What happens next
                    </strong>

                    <p>
                        Any upcoming services scheduled only for
                        ${escapeHtml(
                            petName
                        )} will also be cancelled.
                    </p>

                    <p>
                        If ${escapeHtml(
                            petName
                        )} is part of a multi-pet booking,
                        the other pets will remain scheduled.
                    </p>

                    <p>
                        Past service history will be kept.
                    </p>

                </div>


                <p class="remove-pet-note">
                    This removes the pet from your active household.
                </p>


                <div class="remove-pet-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        data-remove-pet-close
                    >
                        Keep Pet
                    </button>


                    <button
                        type="button"
                        class="remove-pet-confirm"
                        data-remove-pet-confirm
                    >
                        Remove Pet
                    </button>

                </div>

            </div>
        `;


    document.body.appendChild(
        overlay
    );


    overlay.addEventListener(
        "click",
        async event => {

            if (
                event.target ===
                overlay
            ) {

                closeRemovePetModal();

                return;

            }


            if (
                event.target.closest(
                    "[data-remove-pet-close]"
                )
            ) {

                closeRemovePetModal();

                return;

            }


            const confirmButton =
                event.target.closest(
                    "[data-remove-pet-confirm]"
                );


            if (
                !confirmButton
            ) {
                return;
            }


            const message =
                document.getElementById(
                    "pet-form-message"
                );


            confirmButton.disabled =
                true;


            confirmButton.textContent =
                "Removing...";


            if (
                message
            ) {

                message.textContent =
                    "";

            }


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .rpc(
                            "remove_pet_from_household",
                            {
                                p_pet_id:
                                    editingPet.id
                            }
                        );


                if (
                    error
                ) {

                    throw error;

                }


                const result =
                    Array.isArray(data)
                        ? data[0]
                        : data;


                console.log(
                    "Pet removal result:",
                    result
                );


                closeRemovePetModal();


                closePetForm();


                await refreshPets();


                // ========================================
                // REFRESH UPCOMING SERVICES
                // ========================================

                await loadDashboard();

            }
            catch (error) {

                console.error(
                    "Remove pet error:",
                    error
                );


                if (
                    message
                ) {

                    message.textContent =
                        "We couldn't remove this pet. Please try again.";

                }


                confirmButton.disabled =
                    false;


                confirmButton.textContent =
                    "Remove Pet";

            }

        }
    );


    document.body.classList.add(
        "client-modal-open"
    );


    overlay
        .querySelector(
            "[data-remove-pet-confirm]"
        )
        ?.focus();

}


removePetButton
    ?.addEventListener(
        "click",
        () => {

            openRemovePetModal();

        }
    );

// ========================================
// PET PHOTO INPUT
// ========================================

const petPhotoInput =
    document.getElementById(
        "pet-photo-input"
    );


if (petPhotoInput) {

    petPhotoInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            const message =
                document.getElementById(
                    "pet-form-message"
                );


            if (!file) {

                pendingPetPhotoFile =
                    null;

                return;

            }


            if (
                !ALLOWED_PHOTO_TYPES.includes(
                    file.type
                )
            ) {

                petPhotoInput.value =
                    "";


                message.textContent =
                    "Please choose a JPG, PNG, or WebP image.";

                return;

            }


            if (
                file.size >
                MAX_PHOTO_SIZE
            ) {

                petPhotoInput.value =
                    "";


                message.textContent =
                    "That photo is larger than 5 MB.";

                return;

            }


            pendingPetPhotoFile =
                file;


            clearPetPhotoPreviewUrl();


            petPhotoPreviewObjectUrl =
                URL.createObjectURL(
                    file
                );


            document.getElementById(
                "pet-photo-preview"
            ).src =
                petPhotoPreviewObjectUrl;

        }
    );

}

// ========================================
// SAVE PET
// ========================================

if (petForm) {

    petForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "pet-form-message"
                );


            const saveButton =
                document.getElementById(
                    "save-pet-button"
                );


            const nameField =
                document.getElementById(
                    "pet-name"
                );


            const breedField =
                document.getElementById(
                    "pet-breed"
                );


            // ========================================
            // NORMALIZE PET VALUES
            // ========================================

            const name =
                formatProperName(
                    nameField?.value
                );


            const breed =
                breedField?.value
                    ? formatProperName(
                        breedField.value
                    )
                    : null;


            // ========================================
            // PUT CLEAN VALUES BACK IN FORM
            // ========================================

            if (nameField) {

                nameField.value =
                    name;

            }


            if (breedField) {

                breedField.value =
                    breed || "";

            }


            if (!name) {

                message.textContent =
                    "Please enter your pet's name.";

                return;

            }


            const payload = {

                name,

                breed,

                gender:
                    valueOrNull(
                        "pet-gender"
                    ),

                birthday:
                    valueOrNull(
                        "pet-birthday"
                    ),

                feeding_notes:
                    valueOrNull(
                        "pet-feeding-notes"
                    ),

                care_notes:
                    valueOrNull(
                        "pet-care-notes"
                    )

            };


            saveButton.disabled =
                true;


            saveButton.textContent =
                "Saving...";


            try {

                let savedPet;


                if (
                    editingPet
                ) {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .from("pets")
                            .update(
                                payload
                            )
                            .eq(
                                "id",
                                editingPet.id
                            )
                            .eq(
                                "client_id",
                                currentUser.id
                            )
                            .select()
                            .single();


                    if (error) {
                        throw error;
                    }


                    savedPet =
                        data;

                } else {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .from("pets")
                            .insert({

                                ...payload,

                                client_id:
                                    currentUser.id

                            })
                            .select()
                            .single();


                    if (error) {
                        throw error;
                    }


                    savedPet =
                        data;

                }


                if (
                    pendingPetPhotoFile
                ) {

                    const oldPhotoPath =
                        editingPet
                            ?.photo_path ||
                        null;


                    const newPhotoPath =
                        await uploadPetPhoto(
                            savedPet.id,
                            pendingPetPhotoFile
                        );


                    const {
                        error
                    } =
                        await supabaseClient
                            .from("pets")
                            .update({

                                photo_path:
                                    newPhotoPath

                            })
                            .eq(
                                "id",
                                savedPet.id
                            )
                            .eq(
                                "client_id",
                                currentUser.id
                            );


                    if (error) {

                        throw error;

                    }


                    if (
                        oldPhotoPath &&
                        oldPhotoPath !==
                            newPhotoPath
                    ) {

                        await supabaseClient
                            .storage
                            .from(
                                PET_PHOTO_BUCKET
                            )
                            .remove([
                                oldPhotoPath
                            ]);

                    }

                }


                await refreshPets();


                closePetForm();

            } catch (
                error
            ) {

                console.error(
                    "Pet save error:",
                    error
                );


                message.textContent =
                    "We couldn't save your pet.";

            } finally {

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    editingPet
                        ? "Save Changes"
                        : "Save Pet";

            }

        }
    );

}


// ========================================
// UPLOAD PET PHOTO
// ========================================

async function uploadPetPhoto(
    petId,
    file
) {

    const extension =
        getFileExtensionForMime(
            file.type
        );


    const filePath =
        `${currentUser.id}/${petId}/${crypto.randomUUID()}.${extension}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(
                PET_PHOTO_BUCKET
            )
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type
                }
            );


    if (error) {

        throw error;

    }


    return filePath;

}


// ========================================
// REFRESH PETS
// ========================================

async function refreshPets() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pets")
            .select("*")
            .eq(
                "client_id",
                currentUser.id
            )
            .eq(
                "active",
                true
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Refresh pets error:",
            error
        );

        return;

    }


    currentPets =
        data || [];


    petPhotoUrlCache.clear();

    await loadPetStats();

    await renderPets();

    populateBookingPets();

    renderAdditionalPets();

}

// ========================================
// BOOKING PETS
// ========================================

const bookingPetSelect =
    document.getElementById(
        "booking-pet"
    );


function populateBookingPets() {

    if (!bookingPetSelect) {
        return;
    }


    const previous =
        bookingPetSelect.value;


    bookingPetSelect.innerHTML =
        `
            <option value="">
                Select your pet
            </option>
        `;


    currentPets.forEach(
        pet => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                pet.id;


            option.textContent =
                pet.name;


            bookingPetSelect.appendChild(
                option
            );

        }
    );


    if (
        currentPets.some(
            pet =>
                String(pet.id) ===
                String(previous)
        )
    ) {

        bookingPetSelect.value =
            previous;

    }

}


bookingPetSelect
    ?.addEventListener(
        "change",
        () => {

            renderAdditionalPets();

            updateBookingTotal();

        }
    );


// ========================================
// SERVICE TYPE
// ========================================

const serviceTypeSelect =
    document.getElementById(
        "service-type"
    );


const serviceOptionSelect =
    document.getElementById(
        "service-option"
    );


const bookingTime =
    document.getElementById(
        "booking-time"
    );


serviceTypeSelect
    ?.addEventListener(
        "change",
        () => {

            handleServiceTypeChange();


            if (
                !serviceTypeSelect.value
            ) {
                return;
            }


            // ========================================
            // DOG BOARDING
            // ========================================

            if (
                serviceTypeSelect.value ===
                "Dog Boarding"
            ) {

                const boardingSection =
                    document.getElementById(
                        "boarding-booking"
                    );


                window.setTimeout(
                    () => {

                        scrollBookingFieldIntoView(
                            boardingSection
                        );

                    },
                    120
                );


                return;

            }


            // ========================================
            // NORMAL SERVICES
            // ========================================

            window.setTimeout(
                () => {

                    scrollBookingFieldIntoView(
                        serviceOptionSelect
                    );

                },
                120
            );

        }
    );


// ========================================
// ADDITIONAL PETS
// ========================================

function renderAdditionalPets() {

    const wrapper =
        document.getElementById(
            "additional-pets-wrapper"
        );


    const list =
        document.getElementById(
            "additional-pets-list"
        );


    const help =
        document.getElementById(
            "additional-pets-help"
        );


    if (
        !wrapper ||
        !list ||
        !help
    ) {
        return;
    }


    const primaryPetId =
        Number(
            bookingPetSelect?.value
        );


    if (
        !primaryPetId ||
        currentPets.length < 2
    ) {

        wrapper.style.display =
            "none";


        list.innerHTML =
            "";


        help.textContent =
            "";


        return;

    }


    const previouslySelected =
        new Set(
            Array.from(
                document.querySelectorAll(
                    ".additional-pet-checkbox:checked"
                )
            )
                .map(
                    item =>
                        Number(item.value)
                )
        );


    const availablePets =
        currentPets.filter(
            pet =>
                Number(pet.id) !==
                primaryPetId
        );


    list.innerHTML =
        availablePets
            .map(
                pet => {

                    const checked =
                        previouslySelected.has(
                            Number(pet.id)
                        )
                            ? "checked"
                            : "";


                    return `
                        <label class="additional-pet-option">

                            <span class="additional-pet-main">

                                <input
                                    type="checkbox"
                                    class="additional-pet-checkbox"
                                    value="${pet.id}"
                                    ${checked}
                                >

                                <span>
                                    ${escapeHtml(pet.name)}
                                </span>

                            </span>

                            <span class="additional-pet-fee">
                                ${getAdditionalPetLabel()}
                            </span>

                        </label>
                    `;

                }
            )
            .join("");


    wrapper.style.display =
        "block";


    list
        .querySelectorAll(
            ".additional-pet-checkbox"
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    updateBookingTotal
                );

            }
        );


    updateAdditionalPetsHelp();

}


function getAdditionalPetLabel() {

    const serviceType =
        serviceTypeSelect?.value;


    // ========================================
    // WALKING / DROP-IN
    // ========================================

    if (
        serviceType ===
            "Dog Walking" ||
        serviceType ===
            "Drop-In Visit"
    ) {

        const pricing =
            getServicePrice(
                serviceType,
                serviceOptionSelect?.value
            );


        const fee =
            Number(
                pricing?.additional_pet_fee
            ) || 0;


        return fee > 0
            ? `+$${formatServicePrice(
                fee
            )} / visit`
            : "Included";

    }


    // ========================================
    // PET SITTING
    // ========================================

    if (
        serviceType ===
        "Pet Sitting"
    ) {

        return "Included";

    }


    // ========================================
    // DOG BOARDING
    // ========================================

    if (
        serviceType ===
        "Dog Boarding"
    ) {

        const pricing =
            getServicePrice(
                "Dog Boarding"
            );


        const nightlyPrice =
            Number(
                pricing?.base_price
            ) || 0;


        return nightlyPrice > 0
            ? `+$${formatServicePrice(
                nightlyPrice
            )} / night`
            : "Additional pet";

    }


    return "Optional";

}


function updateAdditionalPetsHelp() {

    const help =
        document.getElementById(
            "additional-pets-help"
        );


    if (!help) {
        return;
    }


    const serviceType =
        serviceTypeSelect?.value;


    // ========================================
    // DOG WALKING
    // ========================================

    if (
        serviceType ===
        "Dog Walking"
    ) {

        const pricing =
            getServicePrice(
                "Dog Walking",
                serviceOptionSelect?.value
            );


        const fee =
            Number(
                pricing?.additional_pet_fee
            ) || 0;


        help.textContent =
            fee > 0
                ? `Each additional dog is $${formatServicePrice(
                    fee
                )} per walk.`
                : "Additional dogs are included at no additional charge.";


        return;

    }


    // ========================================
    // DROP-IN
    // ========================================

    if (
        serviceType ===
        "Drop-In Visit"
    ) {

        const pricing =
            getServicePrice(
                "Drop-In Visit",
                serviceOptionSelect?.value
            );


        const fee =
            Number(
                pricing?.additional_pet_fee
            ) || 0;


        help.textContent =
            fee > 0
                ? `Each additional pet is $${formatServicePrice(
                    fee
                )} per drop-in visit.`
                : "Additional pets are included at no additional charge.";


        return;

    }


    // ========================================
    // PET SITTING
    // ========================================

    if (
        serviceType ===
        "Pet Sitting"
    ) {

        help.textContent =
            "Additional pets are included at no additional charge.";


        return;

    }


    // ========================================
    // DOG BOARDING
    // ========================================

    if (
        serviceType ===
        "Dog Boarding"
    ) {

        const pricing =
            getServicePrice(
                "Dog Boarding"
            );


        const nightlyPrice =
            Number(
                pricing?.base_price
            ) || 0;


        help.textContent =
            nightlyPrice > 0
                ? `Boarding is $${formatServicePrice(
                    nightlyPrice
                )} per pet, per night.`
                : "Boarding pricing is currently unavailable.";


        return;

    }


    help.textContent =
        "Select any other pets included in this service.";

}


function getSelectedAdditionalPetIds() {

    return Array.from(
        document.querySelectorAll(
            ".additional-pet-checkbox:checked"
        )
    )
        .map(
            checkbox =>
                Number(
                    checkbox.value
                )
        );

}


function getSelectedPetCount() {

    if (
        !Number(
            bookingPetSelect?.value
        )
    ) {

        return 0;

    }


    return 1 +
        getSelectedAdditionalPetIds()
            .length;

}

// ========================================
// BOOKING OPEN / CLOSE
// ========================================

const bookingSection =
    document.getElementById(
        "booking-section"
    );


document
    .getElementById(
        "request-walk-button"
    )
    ?.addEventListener(
        "click",
        async () => {


            const message =
                document.getElementById(
                    "booking-message"
                );


            try {


                // ========================================
                // FORCE MOBILE REQUEST SERVICE
                // INTO SERVICES SCREEN
                // ========================================

                if (
                    mobileAppNavigationQuery.matches
                ) {


                    closeClientMessaging();


                    setMobileAppScreen(
                        "services"
                    );


                    setActiveMobileAppTab(
                        "services"
                    );

                }


                // ========================================
                // LOAD CURRENT PRICING
                // ========================================

                if (
                    currentServicePrices
                        .length ===
                    0
                ) {


                    if (message) {

                        message.textContent =
                            "Loading current service pricing...";

                    }


                    await loadMyServicePrices();

                }


                if (message) {

                    message.textContent =
                        "";

                }


                // ========================================
                // OPEN REQUEST SERVICE
                // ========================================

                bookingSection.style.display =
                    "block";


                renderBookingCalendar();

                renderAdditionalPets();

                updateBookingTotal();


                /*
                 * Wait until the booking section has
                 * actually been painted before positioning
                 * the first field.
                 */

                window.requestAnimationFrame(
                    () => {


                        window.requestAnimationFrame(
                            () => {


                                scrollBookingFieldIntoView(
                                    bookingPetSelect
                                );


                            }
                        );


                    }
                );


            }
            catch (error) {


                console.error(
                    "Unable to open booking pricing:",
                    error
                );


                if (message) {

                    message.textContent =
                        "We couldn't load current service pricing. Please try again.";

                }


            }


        }
    );


document
    .getElementById(
        "close-booking-button"
    )
    ?.addEventListener(
        "click",
        () => {


            bookingSection.style.display =
                "none";


        }
    );

// ========================================
// REPEAT LAST WEEK'S BOOKING
// ========================================

const repeatLastWeekBookingButton =
    document.getElementById(
        "repeat-last-week-booking-button"
    );


const repeatLastWeekBookingMessage =
    document.getElementById(
        "repeat-last-week-booking-message"
    );


let repeatLastWeekPattern =
    null;


// ========================================
// GET PET NAME
// ========================================

function getRepeatBookingPetName(
    petId
) {

    return (
        currentPets.find(
            pet =>
                Number(
                    pet.id
                ) ===
                Number(
                    petId
                )
        )?.name ||
        "Pet"
    );

}


// ========================================
// GET CURRENT BOOKING PET IDS
// ========================================

function getRepeatBookingPetIds() {

    const primaryPetId =
        Number(
            bookingPetSelect?.value
        );


    if (
        !primaryPetId
    ) {

        return [];

    }


    return [
        primaryPetId,
        ...getSelectedAdditionalPetIds()
    ];

}


// ========================================
// GET VISIT PET IDS
// ========================================

function getRepeatVisitPetIds(
    visit
) {

    return getPetsForVisit(
        visit
    )
        .map(
            pet =>
                Number(
                    pet.id
                )
        );

}


// ========================================
// VISIT CONTAINS SELECTED PETS
// ========================================

function repeatVisitContainsPets(
    visit,
    selectedPetIds
) {

    const visitPetIds =
        new Set(
            getRepeatVisitPetIds(
                visit
            )
        );


    return selectedPetIds.every(
        petId =>
            visitPetIds.has(
                Number(
                    petId
                )
            )
    );

}


// ========================================
// NORMALIZE REPEAT SERVICE TYPE
// ========================================

function getRepeatVisitServiceType(
    visit
) {

    const storedServiceType =
        String(
            visit?.service_type ||
            ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /_/g,
                " "
            );


    const serviceName =
        String(
            visit?.service_name ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        storedServiceType ===
            "dog walking" ||
        serviceName.includes(
            "dog walking"
        )
    ) {

        return "Dog Walking";

    }


    if (
        storedServiceType ===
            "drop in" ||
        storedServiceType ===
            "drop in visit" ||
        serviceName.includes(
            "drop-in"
        ) ||
        serviceName.includes(
            "drop in"
        )
    ) {

        return "Drop-In Visit";

    }


    return "";

}


// ========================================
// GET REPEAT SERVICE OPTION
// ========================================

function getRepeatVisitServiceOption(
    visit
) {

    const serviceName =
        String(
            visit?.service_name ||
            ""
        );


    const durationMatch =
        serviceName.match(
            /\b(15|30|60)\s*minutes?\b/i
        );


    if (
        !durationMatch
    ) {

        return "";

    }


    return `${durationMatch[1]} Minutes`;

}


// ========================================
// GET PREVIOUS WEEK RANGE
// ========================================

function getRepeatPreviousWeekRange() {

    const today =
        getLocalDateString();


    const currentWeekStart =
        getWeekKey(
            today
        );


    const previousWeekStart =
        addDaysToDateString(
            currentWeekStart,
            -7
        );


    const previousWeekEnd =
        addDaysToDateString(
            previousWeekStart,
            6
        );


    return {
        today,
        currentWeekStart,
        previousWeekStart,
        previousWeekEnd
    };

}


// ========================================
// FIND REPEATABLE LAST-WEEK PATTERN
// ========================================

function findRepeatLastWeekPattern() {

    const selectedPetIds =
        getRepeatBookingPetIds();


    if (
        selectedPetIds.length ===
        0
    ) {

        return {
            status:
                "no_pet"
        };

    }


    const {
        previousWeekStart,
        previousWeekEnd
    } =
        getRepeatPreviousWeekRange();


    // ========================================
    // LAST WEEK'S VISITS FOR ALL
    // CURRENTLY SELECTED PETS
    // ========================================

    const matchingVisits =
        currentVisits
            .filter(
                visit => {


                    const status =
                        String(
                            visit.status ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    if (
                        status ===
                        "cancelled"
                    ) {

                        return false;

                    }


                    if (
                        visit.visit_date <
                            previousWeekStart ||
                        visit.visit_date >
                            previousWeekEnd
                    ) {

                        return false;

                    }


                    if (
                        !visit.time_window
                    ) {

                        return false;

                    }


                    if (
                        !TIME_WINDOWS.some(
                            window =>
                                window.value ===
                                visit.time_window
                        )
                    ) {

                        return false;

                    }


                    return repeatVisitContainsPets(
                        visit,
                        selectedPetIds
                    );

                }
            )
            .map(
                visit => ({

                    visit,

                    serviceType:
                        getRepeatVisitServiceType(
                            visit
                        ),

                    serviceOption:
                        getRepeatVisitServiceOption(
                            visit
                        )

                })
            )
            .filter(
                item =>
                    item.serviceType &&
                    item.serviceOption
            )
            .sort(
                (
                    first,
                    second
                ) => {


                    const dateComparison =
                        first.visit
                            .visit_date
                            .localeCompare(
                                second.visit
                                    .visit_date
                            );


                    if (
                        dateComparison !==
                        0
                    ) {

                        return dateComparison;

                    }


                    return compareClientVisits(
                        first.visit,
                        second.visit
                    );

                }
            );


    if (
        matchingVisits.length ===
        0
    ) {

        return {
            status:
                "none"
        };

    }


    // ========================================
    // REQUIRE ONE CONSISTENT SERVICE
    // + DURATION FOR THIS QUICK REPEAT
    // ========================================

    const bookingPatterns =
        new Map();


    matchingVisits.forEach(
        item => {


            const key =
                `${item.serviceType}|${item.serviceOption}`;


            if (
                !bookingPatterns.has(
                    key
                )
            ) {

                bookingPatterns.set(
                    key,
                    []
                );

            }


            bookingPatterns
                .get(
                    key
                )
                .push(
                    item.visit
                );

        }
    );


    if (
        bookingPatterns.size >
        1
    ) {

        return {
            status:
                "multiple_patterns"
        };

    }


    const [
        patternKey,
        visits
    ] =
        Array.from(
            bookingPatterns.entries()
        )[0];


    const [
        serviceType,
        serviceOption
    ] =
        patternKey.split(
            "|"
        );


    return {

        status:
            "ready",

        serviceType,

        serviceOption,

        visits,

        selectedPetIds,

        previousWeekStart

    };

}


// ========================================
// UPDATE REPEAT BUTTON STATE
// ========================================

function updateRepeatLastWeekBookingState() {

    if (
        !repeatLastWeekBookingButton
    ) {

        return;

    }


    const repeatWrapper =
        repeatLastWeekBookingButton.closest(
            ".repeat-last-week-booking"
        );


    const primaryPetId =
        Number(
            bookingPetSelect?.value
        );


    // ========================================
    // NO PRIMARY PET
    // ========================================

    if (
        !primaryPetId
    ) {

        repeatLastWeekPattern =
            null;


        repeatLastWeekBookingButton.disabled =
            true;


        if (
            repeatWrapper
        ) {

            repeatWrapper.style.display =
                "none";

        }


        if (
            repeatLastWeekBookingMessage
        ) {

            repeatLastWeekBookingMessage
                .textContent =
                    "";

            repeatLastWeekBookingMessage
                .style
                .display =
                    "none";

        }


        return;

    }


    // ========================================
    // PRIMARY PET SELECTED
    // ========================================

    if (
        repeatWrapper
    ) {

        repeatWrapper.style.display =
            "block";

    }


    // ========================================
    // CURRENT VISITS ALREADY SELECTED
    // ========================================
    //
    // If the client checks an additional pet
    // after dates are already loaded, the pet
    // is simply included on the current booking.
    //
    // Existing dates / times stay untouched.
    // ========================================

    if (
        selectedVisits.length >
        0
    ) {

        repeatLastWeekPattern =
            null;


        repeatLastWeekBookingButton.disabled =
            true;


        const additionalPetIds =
            getSelectedAdditionalPetIds();


        if (
            repeatLastWeekBookingMessage
        ) {

            if (
                additionalPetIds.length >
                0
            ) {

                const petNames =
                    additionalPetIds
                        .map(
                            petId =>
                                getRepeatBookingPetName(
                                    petId
                                )
                        )
                        .join(
                            ", "
                        );


                repeatLastWeekBookingMessage
                    .textContent =
                        `${petNames} will be included on all ${selectedVisits.length} selected ${
                            selectedVisits.length ===
                            1
                                ? "visit"
                                : "visits"
                        }.`;

                repeatLastWeekBookingMessage
                    .style
                    .display =
                        "block";

            } else {

                repeatLastWeekBookingMessage
                    .textContent =
                        "";

                repeatLastWeekBookingMessage
                    .style
                    .display =
                        "none";

            }

        }


        return;

    }


    // ========================================
    // CHECK LAST WEEK
    // ========================================

    repeatLastWeekPattern =
        findRepeatLastWeekPattern();


    // ========================================
    // VALID REPEAT PATTERN
    // ========================================

    if (
        repeatLastWeekPattern.status ===
        "ready"
    ) {

        repeatLastWeekBookingButton.disabled =
            false;


        if (
            repeatLastWeekBookingMessage
        ) {

            const petNames =
                repeatLastWeekPattern
                    .selectedPetIds
                    .map(
                        petId =>
                            getRepeatBookingPetName(
                                petId
                            )
                    )
                    .join(
                        " + "
                    );


            repeatLastWeekBookingMessage
                .textContent =
                    `${petNames} ${
                        repeatLastWeekPattern
                            .selectedPetIds
                            .length ===
                        1
                            ? "has"
                            : "have"
                    } ${repeatLastWeekPattern.visits.length} ${
                        repeatLastWeekPattern
                            .visits
                            .length ===
                        1
                            ? "visit"
                            : "visits"
                    } from last week ready to repeat.`;

            repeatLastWeekBookingMessage
                .style
                .display =
                    "block";

        }


        return;

    }


    // ========================================
    // NO VALID REPEAT PATTERN
    // ========================================

    repeatLastWeekBookingButton.disabled =
        true;


    if (
        repeatLastWeekBookingMessage
    ) {

        const selectedPetNames =
            getRepeatBookingPetIds()
                .map(
                    petId =>
                        getRepeatBookingPetName(
                            petId
                        )
                )
                .join(
                    " + "
                );


        if (
            repeatLastWeekPattern.status ===
            "multiple_patterns"
        ) {

            repeatLastWeekBookingMessage
                .textContent =
                    "Last week used more than one service or duration. Please build this booking manually.";

        } else {

            repeatLastWeekBookingMessage
                .textContent =
                    `No shared repeatable bookings were found last week for ${selectedPetNames}.`;

        }


        repeatLastWeekBookingMessage
            .style
            .display =
                "block";

    }

}


// ========================================
// PRIMARY PET CHANGE
// ========================================

bookingPetSelect
    ?.addEventListener(
        "change",
        () => {

            window.setTimeout(
                updateRepeatLastWeekBookingState,
                0
            );

        }
    );


// ========================================
// ADDITIONAL PET CHANGE
// ========================================

document
    .getElementById(
        "additional-pets-list"
    )
    ?.addEventListener(
        "change",
        event => {


            if (
                !event.target.closest(
                    ".additional-pet-checkbox"
                )
            ) {

                return;

            }


            updateBookingTotal();


            // ========================================
            // REFRESH SELECTED VISIT PETS
            // ========================================

            renderSelectedDates();


            updateRepeatLastWeekBookingState();

        }
    );

// ========================================
// INITIAL BUTTON STATE
// ========================================

if (
    repeatLastWeekBookingButton
) {

    repeatLastWeekBookingButton.disabled =
        true;


    updateRepeatLastWeekBookingState();

}


// ========================================
// REPEAT LAST WEEK CLICK
// ========================================

repeatLastWeekBookingButton
    ?.addEventListener(
        "click",
        async () => {


            // ========================================
            // IF VISITS ALREADY EXIST
            // DON'T OVERWRITE THEM
            // ========================================

            if (
                selectedVisits.length >
                0
            ) {

                if (
                    repeatLastWeekBookingMessage
                ) {

                    repeatLastWeekBookingMessage
                        .textContent =
                            "Your selected visits are already loaded. Additional pets will be included on those visits.";

                    repeatLastWeekBookingMessage
                        .style
                        .display =
                            "block";

                }


                return;

            }


            const pattern =
                findRepeatLastWeekPattern();


            if (
                pattern.status !==
                "ready"
            ) {

                updateRepeatLastWeekBookingState();

                return;

            }


            repeatLastWeekBookingButton.disabled =
                true;


            if (
                repeatLastWeekBookingMessage
            ) {

                repeatLastWeekBookingMessage
                    .textContent =
                        "Loading last week's schedule...";

                repeatLastWeekBookingMessage
                    .style
                    .display =
                        "block";

            }


            try {


                // ========================================
                // AUTO-FILL SERVICE TYPE
                // ========================================

                serviceTypeSelect.value =
                    pattern.serviceType;


                handleServiceTypeChange();


                // ========================================
                // AUTO-FILL DURATION
                // ========================================

                serviceOptionSelect.value =
                    pattern.serviceOption;


                // ========================================
                // BUILD REPEATED VISITS
                // ========================================

                const {
                    today,
                    currentWeekStart
                } =
                    getRepeatPreviousWeekRange();


                const buildRepeatedVisits =
                    weekStart =>
                        pattern.visits.map(
                            visit => {


                                const sourceDate =
                                    parseLocalDate(
                                        visit.visit_date
                                    );


                                const sourceWeekStart =
                                    parseLocalDate(
                                        pattern.previousWeekStart
                                    );


                                const dayOffset =
                                    Math.round(
                                        (
                                            sourceDate -
                                            sourceWeekStart
                                        ) /
                                        86400000
                                    );


                                return {

                                    date:
                                        addDaysToDateString(
                                            weekStart,
                                            dayOffset
                                        ),

                                    timeWindow:
                                        visit.time_window

                                };

                            }
                        );


                let targetWeekStart =
                    currentWeekStart;


                let repeatedVisits =
                    buildRepeatedVisits(
                        targetWeekStart
                    );


                // ========================================
                // IF PART OF THIS WEEK ALREADY PASSED,
                // MOVE THE WHOLE PATTERN TO NEXT WEEK
                // ========================================

                if (
                    repeatedVisits.some(
                        visit =>
                            visit.date <
                            today
                    )
                ) {

                    targetWeekStart =
                        addDaysToDateString(
                            currentWeekStart,
                            7
                        );


                    repeatedVisits =
                        buildRepeatedVisits(
                            targetWeekStart
                        );

                }


                // ========================================
                // REMOVE DUPLICATE VISITS
                // ========================================

                const uniqueRepeatedVisits =
                    [];


                const repeatedVisitKeys =
                    new Set();


                repeatedVisits.forEach(
                    visit => {


                        const key =
                            `${visit.date}|${visit.timeWindow}`;


                        if (
                            repeatedVisitKeys.has(
                                key
                            )
                        ) {

                            return;

                        }


                        repeatedVisitKeys.add(
                            key
                        );


                        uniqueRepeatedVisits.push(
                            visit
                        );

                    }
                );


                // ========================================
                // SKIP ALREADY-BOOKED MATCHES
                // ========================================

                const selectedPetIds =
                    getRepeatBookingPetIds();


                const alreadyBookedKeys =
                    new Set(
                        currentVisits
                            .filter(
                                visit => {


                                    const status =
                                        String(
                                            visit.status ||
                                            ""
                                        )
                                            .trim()
                                            .toLowerCase();


                                    if (
                                        status ===
                                        "cancelled"
                                    ) {

                                        return false;

                                    }


                                    if (
                                        getRepeatVisitServiceType(
                                            visit
                                        ) !==
                                        pattern.serviceType
                                    ) {

                                        return false;

                                    }


                                    if (
                                        !visit.time_window
                                    ) {

                                        return false;

                                    }


                                    return repeatVisitContainsPets(
                                        visit,
                                        selectedPetIds
                                    );

                                }
                            )
                            .map(
                                visit =>
                                    `${visit.visit_date}|${visit.time_window}`
                            )
                    );


                const visitsToRepeat =
                    uniqueRepeatedVisits.filter(
                        visit =>
                            !alreadyBookedKeys.has(
                                `${visit.date}|${visit.timeWindow}`
                            )
                    );


                const skippedVisitCount =
                    uniqueRepeatedVisits.length -
                    visitsToRepeat.length;


                if (
                    visitsToRepeat.length ===
                    0
                ) {

                    if (
                        repeatLastWeekBookingMessage
                    ) {

                        repeatLastWeekBookingMessage
                            .textContent =
                                "Those visits are already booked.";

                    }


                    return;

                }


                // ========================================
                // LOAD ALL USED TIME WINDOWS
                // ========================================

                const repeatedTimeWindows =
                    [
                        ...new Set(
                            visitsToRepeat.map(
                                visit =>
                                    visit.timeWindow
                            )
                        )
                    ];


                await populatePreferredTimeWindows();


                document
                    .querySelectorAll(
                        ".booking-time-row-additional"
                    )
                    .forEach(
                        row => {

                            row.remove();

                        }
                    );


                populateBookingTimeSelect(
                    bookingTime,
                    repeatedTimeWindows[0] ||
                        ""
                );


                bookingTime.dataset.previousValue =
                    bookingTime.value ||
                    "";


                repeatedTimeWindows
                    .slice(1)
                    .forEach(
                        timeWindow => {

                            createAdditionalBookingTimeRow(
                                timeWindow
                            );

                        }
                    );


                lastSelectedTimeWindow =
                    bookingTime.value ||
                    repeatedTimeWindows[0] ||
                    "";


                // ========================================
                // LOAD EXACT DATE + TIME VISITS
                // ========================================

                selectedVisits =
                    visitsToRepeat.map(
                        visit => ({

                            date:
                                visit.date,

                            timeWindow:
                                visit.timeWindow

                        })
                    );


                sortSelectedBookingVisits();

                rebuildSelectedDatesFromVisits();


                // ========================================
                // MOVE CALENDAR TO REPEATED WEEK
                // ========================================

                const firstRepeatedDate =
                    parseLocalDate(
                        selectedVisits[0]
                            .date
                    );


                calendarYear =
                    firstRepeatedDate
                        .getFullYear();


                calendarMonth =
                    firstRepeatedDate
                        .getMonth();


                // ========================================
                // REFRESH UI
                // ========================================

                renderAdditionalPets();

                syncBookingTimeWindowControls();

                renderSelectedDates();

                renderBookingCalendar();

                updateBookingTotal();


                // ========================================
                // RUN EXISTING CAPACITY CHECK
                // ========================================

                await refreshPreferredTimeWindowAvailability();


                const unavailableCount =
                    selectedVisits.filter(
                        visit =>
                            hasSelectedVisitCapacityConflict(
                                visit.date,
                                visit.timeWindow
                            )
                    ).length;


                // ========================================
                // RESULT MESSAGE
                // ========================================

                if (
                    repeatLastWeekBookingMessage
                ) {


                    if (
                        unavailableCount >
                        0
                    ) {

                        repeatLastWeekBookingMessage
                            .textContent =
                                `${selectedVisits.length} ${
                                    selectedVisits.length ===
                                    1
                                        ? "visit"
                                        : "visits"
                                } repeated. ${unavailableCount} ${
                                    unavailableCount ===
                                    1
                                        ? "time is"
                                        : "times are"
                                } unavailable and marked below.`;

                    } else if (
                        skippedVisitCount >
                        0
                    ) {

                        repeatLastWeekBookingMessage
                            .textContent =
                                `${selectedVisits.length} ${
                                    selectedVisits.length ===
                                    1
                                        ? "visit"
                                        : "visits"
                                } repeated. ${skippedVisitCount} already-booked ${
                                    skippedVisitCount ===
                                    1
                                        ? "visit was"
                                        : "visits were"
                                } skipped.`;

                    } else {

                        repeatLastWeekBookingMessage
                            .textContent =
                                `${selectedVisits.length} ${
                                    selectedVisits.length ===
                                    1
                                        ? "visit"
                                        : "visits"
                                } repeated from last week.`;

                    }


                    repeatLastWeekBookingMessage
                        .style
                        .display =
                            "block";

                }


            }
            catch (
                error
            ) {

                console.error(
                    "Repeat last week booking error:",
                    error
                );


                if (
                    repeatLastWeekBookingMessage
                ) {

                    repeatLastWeekBookingMessage
                        .textContent =
                            "We couldn't repeat last week's booking. Please try again.";

                    repeatLastWeekBookingMessage
                        .style
                        .display =
                            "block";

                }

            }
            finally {

                updateRepeatLastWeekBookingState();

            }


        }
    );

// ========================================
// GUIDE USER TO NEXT BOOKING FIELD
// ========================================

function scrollBookingFieldIntoView(
    element
) {

    if (!element) {
        return;
    }


    /*
     * Desktop doesn't need the guided scrolling.
     * This is primarily for the smaller mobile
     * viewport where the form becomes long.
     */

    if (
        !window.matchMedia(
            "(max-width: 700px)"
        ).matches
    ) {

        return;

    }


    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    element.scrollIntoView({
        behavior:
            prefersReducedMotion
                ? "auto"
                : "smooth",

        block:
            "center",

        inline:
            "nearest"
    });


    /*
     * Focus after scrolling without asking the
     * browser to scroll a second time.
     *
     * We intentionally DO NOT automatically open
     * the native select menu.
     */

    window.setTimeout(
        () => {

            try {

                element.focus({
                    preventScroll: true
                });

            } catch (error) {

                element.focus();

            }

        },
        prefersReducedMotion
            ? 0
            : 260
    );

}

// ========================================
// SERVICE CHANGE
// ========================================

function handleServiceTypeChange() {

    const serviceType =
        serviceTypeSelect.value;


    const optionWrapper =
        document.getElementById(
            "service-option-wrapper"
        );


    const timeWrapper =
        document.getElementById(
            "time-window-wrapper"
        );


    const multiDate =
        document.getElementById(
            "multi-date-booking"
        );


    const boarding =
        document.getElementById(
            "boarding-booking"
        );


    // ========================================
    // RESET SELECTED VISITS
    // ========================================
    
    selectedVisits =
        [];
    
    
    selectedDates =
        [];
    
    
    selectedDateCapacityConflicts.clear();
    
    
    lastSelectedTimeWindow =
        "";
    
    
    clearTimeWindowConflictError();
    
    clearTimeWindowCapacityHelp();
    
    
    // ========================================
    // RESET MULTI-TIME ROWS
    // ========================================
    
    document
        .querySelectorAll(
            ".booking-time-row-additional"
        )
        .forEach(
            row => {
    
                row.remove();
    
            }
        );
    
    
    const addBookingTimeButton =
        document.getElementById(
            "add-booking-time-button"
        );
    
    
    const bookingTimeHelp =
        document.getElementById(
            "booking-time-help"
        );
    
    
    if (addBookingTimeButton) {
    
        addBookingTimeButton.style.display =
            "none";
    
        addBookingTimeButton.disabled =
            true;
    
    }
    
    
    if (bookingTimeHelp) {
    
        bookingTimeHelp.style.display =
            "none";
    
    }
    
    
    // ========================================
    // RESET BOOKING UI
    // ========================================
    
    renderSelectedDates();
    
    renderBookingCalendar();
    
    
    optionWrapper.style.display =
        "none";
    
    
    timeWrapper.style.display =
        "none";
    
    
    multiDate.style.display =
        "none";
    
    
    boarding.style.display =
        "none";
    
    
    serviceOptionSelect.innerHTML =
        `
            <option value="">
                Select an option
            </option>
        `;
    
    
    bookingTime.innerHTML =
        `
            <option value="">
                Select a time
            </option>
        `;
    
    
    bookingTime.dataset.previousValue =
        "";
    
    
    renderAdditionalPets();
    
    
    if (!serviceType) {
    
        updateBookingTotal();
    
        return;
    
    }
    // ========================================
    // DOG BOARDING
    // ========================================

    if (
        serviceType ===
        "Dog Boarding"
    ) {

        const pricing =
            getServicePrice(
                "Dog Boarding"
            );


        const nightlyPrice =
            Number(
                pricing?.base_price
            ) || 0;


        const boardingPolicyPrice =
            document.getElementById(
                "boarding-policy-price"
            );


        if (boardingPolicyPrice) {

            boardingPolicyPrice.textContent =
                nightlyPrice > 0
                    ? `VIP Overnight Boarding — $${formatServicePrice(
                        nightlyPrice
                    )} per pet / night`
                    : "VIP Overnight Boarding";

        }


        boarding.style.display =
            "block";


        resetBoardingDates();


        renderAdditionalPets();

        updateBookingTotal();


        return;

    }


    // ========================================
    // STANDARD SERVICES
    // ========================================

    optionWrapper.style.display =
        "block";


    multiDate.style.display =
        "block";


    populateServiceOptions(
        serviceType
    );


    // ========================================
    // WALKING / DROP-IN
    // ========================================

    if (
        serviceType ===
            "Dog Walking" ||
        serviceType ===
            "Drop-In Visit"
    ) {

        timeWrapper.style.display =
            "block";


        populatePreferredTimeWindows();


        document.getElementById(
            "booking-date-help"
        ).textContent =
            "Select at least 3 service dates per week.";

    }


    // ========================================
    // PET SITTING
    // ========================================

    if (
        serviceType ===
        "Pet Sitting"
    ) {

        document.getElementById(
            "booking-date-help"
        ).textContent =
            "Select one or more pet sitting dates.";

    }


    renderAdditionalPets();

    renderBookingCalendar();

    updateBookingTotal();

}

// ========================================
// SERVICE OPTIONS
// ========================================

function populateServiceOptions(
    serviceType
) {


    const config =
        SERVICE_CONFIG[
            serviceType
        ];


    document.getElementById(
        "service-option-label"
    ).textContent =
        config.optionLabel;


    serviceOptionSelect.innerHTML =
        `
            <option value="">
                Select ${config.optionLabel.toLowerCase()}
            </option>
        `;


    config.options.forEach(
        option => {


            const pricing =
                getServicePrice(
                    serviceType,
                    option.value
                );


            // ========================================
            // HIDE INACTIVE / UNAVAILABLE OPTION
            // ========================================

            if (
                !pricing
            ) {

                return;

            }


            const element =
                document.createElement(
                    "option"
                );


            const price =
                Number(
                    pricing.base_price
                );


            element.value =
                option.value;


            element.textContent =
                `${option.value} — $${formatServicePrice(price)}`;


            element.dataset.price =
                String(
                    price
                );


            serviceOptionSelect.appendChild(
                element
            );

        }
    );

}


serviceOptionSelect
    ?.addEventListener(
        "change",
        () => {


            if (
                serviceTypeSelect.value ===
                "Pet Sitting"
            ) {

                populatePetSittingTimeBlocks();

            }


            if (
                serviceTypeSelect.value ===
                    "Dog Walking" ||
                serviceTypeSelect.value ===
                    "Drop-In Visit"
            ) {

                populatePreferredTimeWindows();

            }


            renderAdditionalPets();

            updateBookingTotal();


            if (
                !serviceOptionSelect.value
            ) {

                return;

            }


            window.setTimeout(
                () => {

                    scrollBookingFieldIntoView(
                        bookingTime
                    );

                },
                120
            );

        }
    );

// ========================================
// TIMES
// ========================================
//
// Dog Walking + Drop-In time windows are
// capacity-aware.
//
// The browser checks Supabase so clients can
// SEE whether their selected duration fits.
//
// IMPORTANT:
// create_service_booking() remains the final
// server-side authority and independently
// enforces capacity.
// ========================================

let preferredTimeAvailabilityRequestId =
    0;


// ========================================
// SELECTED VISIT CAPACITY STATE
// ========================================
//
// Capacity conflicts are now tracked by the
// exact DATE + TIME WINDOW pair.
//
// Example key:
//
// 2026-09-15|7:00 AM - 10:00 AM
//
// This allows:
//
// Monday 7:00 AM - 10:00 AM = available
//
// while:
//
// Monday 6:00 PM - 8:00 PM = full
//
// without incorrectly marking the entire
// date unavailable.
// ========================================

let selectedDateCapacityConflicts =
    new Set();


let lastSelectedTimeWindow =
    "";


// ========================================
// BUILD VISIT CAPACITY KEY
// ========================================

function getSelectedVisitCapacityKey(
    date,
    timeWindow
) {

    return `${date}|${timeWindow}`;

}


// ========================================
// CHECK VISIT CAPACITY CONFLICT
// ========================================

function hasSelectedVisitCapacityConflict(
    date,
    timeWindow
) {

    return selectedDateCapacityConflicts.has(
        getSelectedVisitCapacityKey(
            date,
            timeWindow
        )
    );

}


// ========================================
// REQUESTED SERVICE MINUTES
// ========================================

function getRequestedServiceMinutes() {

    const serviceOption =
        serviceOptionSelect?.value;


    switch (serviceOption) {

        case "15 Minutes":

            return 15;


        case "30 Minutes":

            return 30;


        case "60 Minutes":

            return 60;


        default:

            return null;

    }

}


// ========================================
// FORMAT SHORT CAPACITY DATE
// ========================================

function formatCapacityDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const date =
        parseLocalDate(
            dateString
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );

}


// ========================================
// BUILD NORMAL TIME-WINDOW LABEL
// ========================================

function getPreferredTimeWindowLabel(
    window,
    pricing
) {

    let surcharge =
        0;


    if (
        window.surchargeType &&
        pricing
    ) {

        surcharge =
            Number(
                pricing[
                    window.surchargeType
                ]
            ) || 0;

    }


    return {

        surcharge,

        label:
            surcharge > 0
                ? `${window.label} (+$${formatServicePrice(surcharge)})`
                : window.label

    };

}


// ========================================
// TIME WINDOW CAPACITY HELP
// ========================================

function getTimeWindowCapacityHelp() {

    const wrapper =
        document.getElementById(
            "time-window-wrapper"
        );


    if (!wrapper) {
        return null;
    }


    let help =
        document.getElementById(
            "time-window-capacity-help"
        );


    if (!help) {

        help =
            document.createElement(
                "p"
            );


        help.id =
            "time-window-capacity-help";


        help.className =
            "booking-help";


        help.style.display =
            "none";


        wrapper.appendChild(
            help
        );

    }


    return help;

}


// ========================================
// CLEAR CAPACITY HELP
// ========================================

function clearTimeWindowCapacityHelp() {

    const help =
        getTimeWindowCapacityHelp();


    if (!help) {
        return;
    }


    help.textContent =
        "";


    help.style.display =
        "none";

}


// ========================================
// SHOW PARTIAL AVAILABILITY HELP
// ========================================

function showTimeWindowCapacityHelp() {

    const help =
        getTimeWindowCapacityHelp();


    if (!help) {
        return;
    }


    help.textContent =
        "Some time windows are unavailable on specific selected dates. Remove the unavailable date or choose another available time window.";


    help.style.display =
        "block";

}


// ========================================
// TIME WINDOW CONFLICT ERROR
// ========================================
//
// Uses the SAME booking-field-error class
// already used by Request Service validation.
// No new CSS is required.
// ========================================

function showTimeWindowConflictError() {

    if (!bookingTime) {
        return;
    }


    bookingTime.classList.add(
        "booking-field-error"
    );


    bookingTime.setAttribute(
        "aria-invalid",
        "true"
    );

}


function clearTimeWindowConflictError() {

    if (!bookingTime) {
        return;
    }


    bookingTime.classList.remove(
        "booking-field-error"
    );


    bookingTime.removeAttribute(
        "aria-invalid"
    );

}


// ========================================
// REFRESH TIME-WINDOW CAPACITY
// ========================================

async function refreshPreferredTimeWindowAvailability() {

    const serviceType =
        serviceTypeSelect?.value;


    // ========================================
    // CAPACITY ONLY APPLIES TO WALKING
    // AND DROP-IN SERVICES
    // ========================================

    if (
        serviceType !==
            "Dog Walking" &&
        serviceType !==
            "Drop-In Visit"
    ) {

        selectedDateCapacityConflicts.clear();

        clearTimeWindowConflictError();

        clearTimeWindowCapacityHelp();

        renderSelectedDates();

        return;

    }


    const requestedMinutes =
        getRequestedServiceMinutes();


    if (
        !requestedMinutes
    ) {

        selectedDateCapacityConflicts.clear();

        clearTimeWindowConflictError();

        clearTimeWindowCapacityHelp();

        renderSelectedDates();

        return;

    }


    const currentRequestId =
        ++preferredTimeAvailabilityRequestId;


    // ========================================
    // REMEMBER CURRENT DROPDOWN WINDOW
    // ========================================

    if (
        bookingTime?.value
    ) {

        lastSelectedTimeWindow =
            bookingTime.value;

    }


    // ========================================
    // NO SELECTED VISITS YET
    // ========================================

    if (
        selectedVisits.length === 0
    ) {

        selectedDateCapacityConflicts.clear();

        clearTimeWindowConflictError();

        clearTimeWindowCapacityHelp();

        renderSelectedDates();

        return;

    }


    // ========================================
    // CHECK EACH SAVED DATE + TIME VISIT
    // ========================================

    let availabilityChecks;


    try {

        availabilityChecks =
            await Promise.all(
                selectedVisits.map(
                    async visit => {

                        const {
                            data,
                            error
                        } =
                            await supabaseClient
                                .rpc(
                                    "get_service_window_availability",
                                    {

                                        p_visit_date:
                                            visit.date,

                                        p_time_window:
                                            visit.timeWindow,

                                        p_requested_minutes:
                                            requestedMinutes

                                    }
                                );


                        if (
                            error
                        ) {

                            console.error(
                                "Service window availability error:",
                                {
                                    date:
                                        visit.date,

                                    timeWindow:
                                        visit.timeWindow,

                                    error
                                }
                            );


                            throw error;

                        }


                        const availability =
                            Array.isArray(
                                data
                            )
                                ? data[0]
                                : data;


                        return {

                            date:
                                visit.date,

                            timeWindow:
                                visit.timeWindow,

                            available:
                                Boolean(
                                    availability
                                        ?.available
                                ),

                            capacityMinutes:
                                Number(
                                    availability
                                        ?.capacity_minutes ||
                                    0
                                ),

                            bookedMinutes:
                                Number(
                                    availability
                                        ?.booked_minutes ||
                                    0
                                ),

                            remainingMinutes:
                                Number(
                                    availability
                                        ?.remaining_minutes ||
                                    0
                                )

                        };

                    }
                )
            );

    }
    catch (
        error
    ) {

        console.error(
            "Preferred time availability refresh failed:",
            error
        );


        clearTimeWindowCapacityHelp();

        return;

    }


    // ========================================
    // IGNORE STALE AVAILABILITY RESPONSE
    // ========================================

    if (
        currentRequestId !==
        preferredTimeAvailabilityRequestId
    ) {

        return;

    }


    // ========================================
    // REBUILD EXACT VISIT CONFLICTS
    // ========================================

    selectedDateCapacityConflicts.clear();


    availabilityChecks.forEach(
        check => {

            if (
                !check.available
            ) {

                selectedDateCapacityConflicts.add(
                    getSelectedVisitCapacityKey(
                        check.date,
                        check.timeWindow
                    )
                );

            }

        }
    );


    // ========================================
    // SHOW CAPACITY MESSAGE IF NEEDED
    // ========================================

    if (
        selectedDateCapacityConflicts.size >
        0
    ) {

        showTimeWindowCapacityHelp();

    } else {

        clearTimeWindowCapacityHelp();

    }


    // ========================================
    // CURRENT DROPDOWN REMAINS AVAILABLE
    // FOR ADDING OTHER DATES
    // ========================================
    //
    // A saved Monday evening visit being full
    // must not disable that same evening window
    // for Tuesday, Wednesday, etc.
    //
    // Capacity is now evaluated per visit.
    // ========================================

    clearTimeWindowConflictError();


    renderSelectedDates();

}

// ========================================
// POPULATE PREFERRED TIME WINDOWS
// ========================================

async function populatePreferredTimeWindows() {


    const wrapper =
        document.getElementById(
            "time-window-wrapper"
        );


    const container =
        document.getElementById(
            "booking-time-windows"
        );


    if (
        !wrapper ||
        !container ||
        !bookingTime
    ) {

        return;

    }


    wrapper.style.display =
        "block";


    document.getElementById(
        "time-window-label"
    ).textContent =
        "Preferred Time Window";


    // ========================================
    // PRESERVE CURRENT TIME SELECTIONS
    // ========================================
    //
    // This is useful when the client changes
    // the service duration after already
    // choosing one or more visit times.
    //
    // If the primary time is blank, this is
    // treated as a fresh service selection.
    // ========================================

    const preservedTimeWindows =
        bookingTime.value
            ? getSelectedBookingTimeWindows()
            : [];


    // ========================================
    // RESET EXTRA TIME ROWS
    // ========================================

    container
        .querySelectorAll(
            ".booking-time-row-additional"
        )
        .forEach(
            row => {

                row.remove();

            }
        );


    // ========================================
    // POPULATE PRIMARY TIME SELECT
    // ========================================

    populateBookingTimeSelect(
        bookingTime,
        preservedTimeWindows[0] || ""
    );


    bookingTime.dataset.previousValue =
        bookingTime.value || "";


    // ========================================
    // RESTORE ADDITIONAL TIME SELECTS
    // ========================================

    preservedTimeWindows
        .slice(1)
        .forEach(
            timeWindow => {

                createAdditionalBookingTimeRow(
                    timeWindow
                );

            }
        );


    selectedDateCapacityConflicts.clear();


    lastSelectedTimeWindow =
        bookingTime.value || "";


    clearTimeWindowConflictError();

    clearTimeWindowCapacityHelp();


    syncBookingTimeWindowControls();


    renderSelectedDates();


    await refreshPreferredTimeWindowAvailability();

}


// ========================================
// POPULATE ONE BOOKING TIME SELECT
// ========================================

function populateBookingTimeSelect(
    select,
    selectedValue = ""
) {


    if (!select) {

        return;

    }


    select.innerHTML =
        `
            <option value="">
                Select a time window
            </option>
        `;


    const serviceType =
        serviceTypeSelect.value;


    const serviceOption =
        serviceOptionSelect.value;


    const pricing =
        getServicePrice(
            serviceType,
            serviceOption
        );


    TIME_WINDOWS.forEach(
        window => {


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                window.value;


            const display =
                getPreferredTimeWindowLabel(
                    window,
                    pricing
                );


            option.textContent =
                display.label;


            option.dataset.surcharge =
                String(
                    display.surcharge
                );


            select.appendChild(
                option
            );

        }
    );


    if (
        selectedValue &&
        TIME_WINDOWS.some(
            window =>
                window.value ===
                selectedValue
        )
    ) {

        select.value =
            selectedValue;

    }

}


// ========================================
// GET ALL BOOKING TIME SELECTS
// ========================================

function getBookingTimeWindowSelects() {


    const container =
        document.getElementById(
            "booking-time-windows"
        );


    if (!container) {

        return [];

    }


    return Array.from(
        container.querySelectorAll(
            ".booking-time-select"
        )
    );

}


// ========================================
// GET SELECTED BOOKING TIME WINDOWS
// ========================================

function getSelectedBookingTimeWindows() {


    return [
        ...new Set(
            getBookingTimeWindowSelects()
                .map(
                    select =>
                        select.value
                )
                .filter(Boolean)
        )
    ];

}


// ========================================
// CREATE ADDITIONAL TIME ROW
// ========================================

function createAdditionalBookingTimeRow(
    selectedValue = ""
) {


    const container =
        document.getElementById(
            "booking-time-windows"
        );


    if (!container) {

        return null;

    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "booking-time-row booking-time-row-additional";


    row.setAttribute(
        "data-booking-time-row",
        ""
    );


    const select =
        document.createElement(
            "select"
        );


    select.className =
        "booking-time-select booking-time-select-additional";


    populateBookingTimeSelect(
        select,
        selectedValue
    );


    select.dataset.previousValue =
        select.value || "";


    const removeButton =
        document.createElement(
            "button"
        );


    removeButton.type =
        "button";


    removeButton.className =
        "remove-booking-time-button";


    removeButton.setAttribute(
        "aria-label",
        "Remove visit time"
    );


    removeButton.textContent =
        "×";


    row.appendChild(
        select
    );


    row.appendChild(
        removeButton
    );


    container.appendChild(
        row
    );


    syncBookingTimeWindowControls();


    return select;

}


// ========================================
// REBUILD SELECTED DATE ARRAY
// ========================================

function rebuildSelectedDatesFromVisits() {


    selectedDates =
        [
            ...new Set(
                selectedVisits.map(
                    visit =>
                        visit.date
                )
            )
        ].sort();

}


// ========================================
// SORT SELECTED VISITS
// ========================================

function sortSelectedBookingVisits() {


    selectedVisits.sort(
        (
            firstVisit,
            secondVisit
        ) => {


            if (
                firstVisit.date !==
                secondVisit.date
            ) {

                return firstVisit.date.localeCompare(
                    secondVisit.date
                );

            }


            return firstVisit.timeWindow.localeCompare(
                secondVisit.timeWindow
            );

        }
    );

}


// ========================================
// SYNC MULTI-TIME CONTROLS
// ========================================

function syncBookingTimeWindowControls() {


    const addButton =
        document.getElementById(
            "add-booking-time-button"
        );


    const help =
        document.getElementById(
            "booking-time-help"
        );


    const serviceType =
        serviceTypeSelect?.value;


    const supportsMultipleTimes =
        serviceType ===
            "Dog Walking" ||
        serviceType ===
            "Drop-In Visit";


    if (!supportsMultipleTimes) {


        if (addButton) {

            addButton.style.display =
                "none";

        }


        if (help) {

            help.style.display =
                "none";

        }


        return;

    }


    const selects =
        getBookingTimeWindowSelects();


    const selectedTimeWindows =
        getSelectedBookingTimeWindows();


    // ========================================
    // DISABLE DUPLICATE TIME WINDOWS
    // ========================================

    selects.forEach(
        select => {


            const ownValue =
                select.value;


            Array.from(
                select.options
            )
                .forEach(
                    option => {


                        if (!option.value) {

                            option.disabled =
                                false;

                            return;

                        }


                        option.disabled =
                            option.value !==
                                ownValue &&
                            selectedTimeWindows.includes(
                                option.value
                            );

                    }
                );

        }
    );


    // ========================================
    // ADD ANOTHER VISIT BUTTON
    // ========================================

    if (addButton) {


        addButton.style.display =
            "inline-flex";


        addButton.disabled =
            !bookingTime?.value ||
            selects.length >=
                TIME_WINDOWS.length;

    }


    // ========================================
    // MULTI-TIME HELPER TEXT
    // ========================================

    if (help) {


        help.style.display =
            selectedTimeWindows.length >
                1
                ? "block"
                : "none";

    }

}


// ========================================
// HANDLE TIME WINDOW CHANGE
// ========================================

async function handleBookingTimeWindowChange(
    select
) {


    if (!select) {

        return;

    }


    const previousValue =
        select.dataset.previousValue ||
        "";


    const nextValue =
        select.value ||
        "";


    // ========================================
    // PRIMARY TIME WAS CLEARED
    // ========================================

    if (
        select ===
            bookingTime &&
        !nextValue
    ) {


        selectedVisits =
            [];


        selectedDates =
            [];


        selectedDateCapacityConflicts.clear();


        lastSelectedTimeWindow =
            "";


        document
            .querySelectorAll(
                ".booking-time-row-additional"
            )
            .forEach(
                row => {

                    row.remove();

                }
            );


        select.dataset.previousValue =
            "";


        clearTimeWindowConflictError();

        clearTimeWindowCapacityHelp();


        syncBookingTimeWindowControls();

        renderSelectedDates();

        renderBookingCalendar();

        updateBookingTotal();


        return;

    }


    // ========================================
    // KEEP CURRENT DATES
    // ========================================
    //
    // If the client changes one of their visit
    // times AFTER selecting dates, the dates
    // remain selected and the new visit time is
    // applied to those same dates.
    // ========================================

    const datesToKeep =
        selectedDates.slice();


    // ========================================
    // REMOVE OLD TIME FROM SAVED VISITS
    // ========================================

    if (
        previousValue &&
        previousValue !==
            nextValue
    ) {


        selectedVisits =
            selectedVisits.filter(
                visit =>
                    visit.timeWindow !==
                    previousValue
            );

    }


    // ========================================
    // APPLY NEW TIME TO EXISTING DATES
    // ========================================

    if (nextValue) {


        datesToKeep.forEach(
            date => {


                const alreadyExists =
                    selectedVisits.some(
                        visit =>
                            visit.date ===
                                date &&
                            visit.timeWindow ===
                                nextValue
                    );


                if (!alreadyExists) {


                    selectedVisits.push({
                        date:
                            date,

                        timeWindow:
                            nextValue
                    });

                }

            }
        );

    }


    select.dataset.previousValue =
        nextValue;


    sortSelectedBookingVisits();

    rebuildSelectedDatesFromVisits();


    selectedDateCapacityConflicts.clear();


    lastSelectedTimeWindow =
        bookingTime?.value ||
        nextValue ||
        "";


    clearTimeWindowConflictError();

    clearTimeWindowCapacityHelp();


    syncBookingTimeWindowControls();

    renderSelectedDates();

    renderBookingCalendar();

    updateBookingTotal();


    await refreshPreferredTimeWindowAvailability();

}


// ========================================
// TIME WINDOW SELECT CHANGE
// ========================================

document
    .getElementById(
        "booking-time-windows"
    )
    ?.addEventListener(
        "change",
        event => {


            const select =
                event.target.closest(
                    ".booking-time-select"
                );


            if (!select) {

                return;

            }


            handleBookingTimeWindowChange(
                select
            );

        }
    );


// ========================================
// ADD ANOTHER VISIT TIME
// ========================================

document
    .getElementById(
        "add-booking-time-button"
    )
    ?.addEventListener(
        "click",
        () => {


            if (
                !bookingTime?.value
            ) {


                bookingTime?.focus();


                return;

            }


            const select =
                createAdditionalBookingTimeRow();


            syncBookingTimeWindowControls();


            select?.focus();

        }
    );


// ========================================
// REMOVE ADDITIONAL VISIT TIME
// ========================================

document
    .getElementById(
        "booking-time-windows"
    )
    ?.addEventListener(
        "click",
        event => {


            const removeButton =
                event.target.closest(
                    ".remove-booking-time-button"
                );


            if (!removeButton) {

                return;

            }


            const row =
                removeButton.closest(
                    ".booking-time-row-additional"
                );


            const select =
                row?.querySelector(
                    ".booking-time-select"
                );


            const removedTimeWindow =
                select?.value ||
                "";


            if (removedTimeWindow) {


                selectedVisits =
                    selectedVisits.filter(
                        visit =>
                            visit.timeWindow !==
                            removedTimeWindow
                    );


                selectedDateCapacityConflicts.clear();


                rebuildSelectedDatesFromVisits();

            }


            row?.remove();


            sortSelectedBookingVisits();


            syncBookingTimeWindowControls();

            renderSelectedDates();

            renderBookingCalendar();

            updateBookingTotal();


            refreshPreferredTimeWindowAvailability();

        }
    );

// ========================================
// REFRESH CAPACITY WHEN DATES CHANGE
// ========================================

document.addEventListener(
    "click",
    event => {

        const dateButton =
            event.target.closest(
                ".calendar-day"
            );


        const removeButton =
            event.target.closest(
                ".remove-date-button"
            );


        if (
            !dateButton &&
            !removeButton
        ) {
            return;
        }


        window.setTimeout(
            () => {

                if (
                    serviceTypeSelect?.value ===
                        "Dog Walking" ||
                    serviceTypeSelect?.value ===
                        "Drop-In Visit"
                ) {

                    refreshPreferredTimeWindowAvailability();

                }

            },
            0
        );

    }
);


// ========================================
// PET SITTING TIME BLOCKS
// ========================================

function populatePetSittingTimeBlocks() {

    const wrapper =
        document.getElementById(
            "time-window-wrapper"
        );


    const selectedPackage =
        serviceOptionSelect.value;


    bookingTime.innerHTML =
        `
            <option value="">
                Select a time block
            </option>
        `;


    selectedDateCapacityConflicts.clear();


    lastSelectedTimeWindow =
        "";


    clearTimeWindowConflictError();


    clearTimeWindowCapacityHelp();


    if (!selectedPackage) {

        wrapper.style.display =
            "none";


        renderSelectedDates();


        return;

    }


    const packageInfo =
        SERVICE_CONFIG[
            "Pet Sitting"
        ].options.find(
            option =>
                option.value ===
                selectedPackage
        );


    if (!packageInfo) {

        wrapper.style.display =
            "none";


        renderSelectedDates();


        return;

    }


    wrapper.style.display =
        "block";


    document.getElementById(
        "time-window-label"
    ).textContent =
        "Time Block";


    packageInfo.timeBlocks.forEach(
        block => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                block;


            option.textContent =
                block;


            bookingTime.appendChild(
                option
            );

        }
    );


    renderSelectedDates();

}


// ========================================
// BOOKING CALENDAR
// ========================================

document
    .getElementById(
        "calendar-prev"
    )
    ?.addEventListener(
        "click",
        () => {

            calendarMonth--;


            if (
                calendarMonth < 0
            ) {

                calendarMonth =
                    11;

                calendarYear--;

            }


            renderBookingCalendar();

        }
    );


document
    .getElementById(
        "calendar-next"
    )
    ?.addEventListener(
        "click",
        () => {

            calendarMonth++;


            if (
                calendarMonth > 11
            ) {

                calendarMonth =
                    0;

                calendarYear++;

            }


            renderBookingCalendar();

        }
    );


function renderBookingCalendar() {

    const grid =
        document.getElementById(
            "booking-calendar-grid"
        );


    const label =
        document.getElementById(
            "calendar-month-label"
        );


    if (
        !grid ||
        !label
    ) {
        return;
    }


    label.textContent =
        new Date(
            calendarYear,
            calendarMonth,
            1
        )
            .toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    year: "numeric"
                }
            );


    grid.innerHTML =
        "";


    const firstDay =
        new Date(
            calendarYear,
            calendarMonth,
            1
        );


    let blanks =
        firstDay.getDay();


    if (
        blanks < 0
    ) {

        blanks =
            6;

    }


    for (
        let i = 0;
        i < blanks;
        i++
    ) {

        const blank =
            document.createElement(
                "div"
            );


        blank.className =
            "calendar-empty-day";


        grid.appendChild(
            blank
        );

    }


    const days =
        new Date(
            calendarYear,
            calendarMonth + 1,
            0
        ).getDate();


    const today =
        getLocalDateString();


    for (
        let day = 1;
        day <= days;
        day++
    ) {

        const date =
            makeDateString(
                calendarYear,
                calendarMonth,
                day
            );


        const holidayName =
            getServiceHolidayName(
                date
            );


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "calendar-day";


        // ========================================
        // DAY NUMBER
        // ========================================

        const dayNumber =
            document.createElement(
                "span"
            );


        dayNumber.className =
            "calendar-day-number";


        dayNumber.textContent =
            day;


        button.appendChild(
            dayNumber
        );


        // ========================================
        // HOLIDAY INDICATOR
        // ========================================
        
        if (
            holidayName
        ) {
        
            button.classList.add(
                "calendar-day-holiday"
            );
        
        
            const holidayStar =
                document.createElement(
                    "span"
                );
        
        
            holidayStar.className =
                "calendar-holiday-star";
        
        
            holidayStar.textContent =
                "✦";
        
        
            holidayStar.setAttribute(
                "aria-hidden",
                "true"
            );
        
        
            button.appendChild(
                holidayStar
            );
        
        
            button.title =
                `${holidayName} — holiday pricing applies`;
        
        
            button.setAttribute(
                "aria-label",
                `${day}, ${holidayName}. Holiday pricing applies.`
            );
        
        } else {
        
            button.setAttribute(
                "aria-label",
                String(day)
            );
        
        }
        
        
        // ========================================
        // PAST DATE
        // ========================================
        
        if (
            date < today
        ) {
        
            button.disabled =
                true;
        
        
            button.classList.add(
                "calendar-day-past"
            );
        
        }
        
        
        // ========================================
        // TODAY
        // ========================================
        
        if (
            date === today
        ) {
        
            button.classList.add(
                "calendar-day-today"
            );
        
        }
        
        
        // ========================================
        // SELECTED DATE
        // ========================================
        
        const hasSelectedVisit =
            selectedVisits.some(
                visit =>
                    visit.date ===
                    date
            );
        
        
        if (
            hasSelectedVisit
        ) {
        
            button.classList.add(
                "calendar-day-selected"
            );
        
        }
        
        
        // ========================================
        // CALENDAR DAY CLICK
        // ========================================
        
        button.addEventListener(
            "click",
            () => {
        
                toggleSelectedDate(
                    date
                );
        
            }
        );
        
        
        grid.appendChild(
            button
        );
        
        }

        
        }
        
  
// ========================================
// TOGGLE SELECTED DATE
// ========================================

function toggleSelectedDate(
    date
) {


    const selectedTimeWindows =
        getSelectedBookingTimeWindows();


    // ========================================
    // REQUIRE AT LEAST ONE TIME WINDOW
    // ========================================

    if (
        selectedTimeWindows.length ===
        0
    ) {


        bookingTime?.focus();


        return;

    }


    // ========================================
    // CHECK WHETHER THIS DATE ALREADY HAS
    // EVERY CURRENTLY SELECTED VISIT TIME
    // ========================================
    //
    // Example:
    //
    // Selected times:
    // 10 AM - 12 PM
    // 4 PM - 6 PM
    //
    // If Monday already has BOTH visits,
    // tapping Monday removes both.
    //
    // If Monday has neither, or only one,
    // tapping Monday fills in every missing
    // visit time.
    // ========================================

    const dateHasEveryTimeWindow =
        selectedTimeWindows.every(
            timeWindow =>
                selectedVisits.some(
                    visit =>
                        visit.date ===
                            date &&
                        visit.timeWindow ===
                            timeWindow
                )
        );


    // ========================================
    // REMOVE ENTIRE DATE
    // ========================================

    if (
        dateHasEveryTimeWindow
    ) {


        selectedTimeWindows.forEach(
            timeWindow => {


                selectedDateCapacityConflicts.delete(
                    getSelectedVisitCapacityKey(
                        date,
                        timeWindow
                    )
                );

            }
        );


        selectedVisits =
            selectedVisits.filter(
                visit =>
                    !(
                        visit.date ===
                            date &&
                        selectedTimeWindows.includes(
                            visit.timeWindow
                        )
                    )
            );

    } else {


        // ========================================
        // ADD ALL MISSING VISITS FOR THIS DATE
        // ========================================

        selectedTimeWindows.forEach(
            timeWindow => {


                const alreadyExists =
                    selectedVisits.some(
                        visit =>
                            visit.date ===
                                date &&
                            visit.timeWindow ===
                                timeWindow
                    );


                if (
                    alreadyExists
                ) {

                    return;

                }


                selectedVisits.push({
                    date:
                        date,

                    timeWindow:
                        timeWindow
                });

            }
        );

    }


    // ========================================
    // SORT VISITS
    // ========================================

    sortSelectedBookingVisits();


    // ========================================
    // REBUILD UNIQUE SERVICE DATES
    // ========================================

    rebuildSelectedDatesFromVisits();


    // ========================================
    // REDRAW BOOKING UI
    // ========================================

    renderSelectedDates();

    renderBookingCalendar();

}


// ========================================
// SELECTED VISITS
// ========================================

let bookingExpandedDateGroups =
    new Set();


function renderSelectedDates() {


    const list =
        document.getElementById(
            "selected-dates-list"
        );


    const count =
        document.getElementById(
            "selected-date-count"
        );


    if (
        !list ||
        !count
    ) {

        return;

    }


    // ========================================
    // TOTAL VISIT COUNT
    // ========================================

    count.textContent =
        `${selectedVisits.length} ${
            selectedVisits.length === 1
                ? "visit"
                : "visits"
        }`;


    // ========================================
    // EMPTY STATE
    // ========================================

    if (
        selectedVisits.length ===
        0
    ) {


        bookingExpandedDateGroups.clear();


        list.innerHTML =
            `
                <p class="empty-dates-message">
                    No visits selected yet.
                </p>
            `;


        updateBookingTotal();


        return;

    }


    // ========================================
    // GROUP VISITS BY DATE
    // ========================================

    const visitsByDate =
        new Map();


    selectedVisits.forEach(
        (
            visit,
            index
        ) => {


            if (
                !visitsByDate.has(
                    visit.date
                )
            ) {

                visitsByDate.set(
                    visit.date,
                    []
                );

            }


            visitsByDate
                .get(
                    visit.date
                )
                .push({
                    visit,
                    index
                });

        }
    );


    // ========================================
    // REMOVE OLD EXPANDED DATE REFERENCES
    // ========================================

    const activeDates =
        new Set(
            visitsByDate.keys()
        );


    Array.from(
        bookingExpandedDateGroups
    )
        .forEach(
            date => {


                if (
                    !activeDates.has(
                        date
                    )
                ) {

                    bookingExpandedDateGroups.delete(
                        date
                    );

                }

            }
        );


    // ========================================
    // OPEN FIRST DATE BY DEFAULT
    // ========================================

    if (
        bookingExpandedDateGroups.size ===
        0
    ) {


        const firstDate =
            visitsByDate
                .keys()
                .next()
                .value;


        if (firstDate) {

            bookingExpandedDateGroups.add(
                firstDate
            );

        }

    }


    // ========================================
    // RENDER DATE GROUPS
    // ========================================
    
    const selectedPetIds =
        [
            Number(
                bookingPetSelect?.value
            ),
            ...getSelectedAdditionalPetIds()
        ]
            .filter(
                petId =>
                    Number.isFinite(
                        petId
                    ) &&
                    petId >
                    0
            );
    
    
    const selectedPetNames =
        selectedPetIds
            .map(
                petId =>
                    currentPets.find(
                        pet =>
                            Number(
                                pet.id
                            ) ===
                            petId
                    )?.name
            )
            .filter(
                Boolean
            );
    
    
    const selectedPetChipsHtml =
        selectedPetNames.length
            ? selectedPetNames
                .map(
                    petName => `
                        <span class="selected-visit-pet-chip">
                            ${escapeHtml(
                                petName
                            )}
                        </span>
                    `
                )
                .join("")
            : `
                <span class="selected-visit-pet-chip selected-visit-pet-chip-missing">
                    Selected Pet
                </span>
            `;
    
    
    const selectedServiceType =
        serviceTypeSelect?.value ||
        "Service";
    
    
    const selectedServiceOption =
        serviceOptionSelect?.value ||
        "";
    
    
    list.innerHTML =
        Array.from(
            visitsByDate.entries()
        )
            .map(
                (
                    [
                        date,
                        visits
                    ]
                ) => {
    
    
                    const isExpanded =
                        bookingExpandedDateGroups.has(
                            date
                        );
    
    
                    const hasGroupConflict =
                        visits.some(
                            item =>
                                hasSelectedVisitCapacityConflict(
                                    item.visit.date,
                                    item.visit.timeWindow
                                )
                        );
    
    
                    return `
                        <section
                            class="
                                selected-date-group
                                ${
                                    hasGroupConflict
                                        ? "selected-date-group-conflict"
                                        : ""
                                }
                            "
                        >
    
    
                            <button
                                type="button"
                                class="selected-date-group-header"
                                aria-expanded="${
                                    isExpanded
                                        ? "true"
                                        : "false"
                                }"
                            >
    
                                <span class="selected-date-group-header-copy">
    
                                    <strong class="selected-date-group-title">
                                        ${formatDate(
                                            date
                                        )}
                                    </strong>
    
                                    <span class="selected-date-group-meta">
                                        ${visits.length} ${
                                            visits.length ===
                                            1
                                                ? "visit"
                                                : "visits"
                                        }
                                    </span>
    
                                </span>
    
    
                                <span
                                    class="
                                        selected-date-group-arrow
                                        ${
                                            isExpanded
                                                ? "selected-date-group-arrow-open"
                                                : ""
                                        }
                                    "
                                    aria-hidden="true"
                                >
                                    ▼
                                </span>
    
                            </button>
    
    
                            <div
                                class="selected-date-group-content"
                                ${
                                    isExpanded
                                        ? ""
                                        : "hidden"
                                }
                            >
    
                                ${
                                    visits
                                        .map(
                                            item => {
    
    
                                                const visit =
                                                    item.visit;
    
    
                                                const hasConflict =
                                                    hasSelectedVisitCapacityConflict(
                                                        visit.date,
                                                        visit.timeWindow
                                                    );
    
    
                                                return `
                                                    <div
                                                        class="
                                                            selected-date-item
                                                            selected-date-group-visit
                                                            ${
                                                                hasConflict
                                                                    ? "selected-date-item-conflict"
                                                                    : ""
                                                            }
                                                        "
                                                    >
    
    
                                                        <div class="selected-visit-summary">
    
    
                                                            <div class="selected-visit-pet-chips">
                                                                ${selectedPetChipsHtml}
                                                            </div>
    
    
                                                            <div class="selected-visit-service-line">
    
                                                                <strong class="selected-visit-service-name">
                                                                    ${escapeHtml(
                                                                        selectedServiceType
                                                                    )}
                                                                </strong>
    
                                                                ${
                                                                    selectedServiceOption
                                                                        ? `
                                                                            <span class="selected-visit-service-separator">
                                                                                ·
                                                                            </span>
    
                                                                            <span class="selected-visit-service-option">
                                                                                ${escapeHtml(
                                                                                    selectedServiceOption
                                                                                )}
                                                                            </span>
                                                                        `
                                                                        : ""
                                                                }
    
                                                            </div>
    
    
                                                            <div class="selected-visit-time-row">
    
                                                                <span
                                                                    class="
                                                                        selected-visit-time
                                                                        ${
                                                                            hasConflict
                                                                                ? "selected-visit-time-conflict"
                                                                                : ""
                                                                        }
                                                                    "
                                                                >
                                                                    ${escapeHtml(
                                                                        visit.timeWindow
                                                                    )}
                                                                </span>
    
    
                                                                ${
                                                                    hasConflict
                                                                        ? `
                                                                            <span class="selected-visit-unavailable">
                                                                                Unavailable
                                                                            </span>
                                                                        `
                                                                        : ""
                                                                }
    
                                                            </div>
    
    
                                                        </div>
    
    
                                                        <button
                                                            type="button"
                                                            class="remove-date-button"
                                                            data-visit-index="${item.index}"
                                                        >
                                                            Remove
                                                        </button>
    
    
                                                    </div>
                                                `;
    
                                            }
                                        )
                                        .join("")
                                }
    
                            </div>
    
                        </section>
                    `;
    
                }
            )
            .join("");

    // ========================================
    // DATE GROUP TOGGLE
    // ========================================

    list
        .querySelectorAll(
            ".selected-date-group-header"
        )
        .forEach(
            button => {


                button.addEventListener(
                    "click",
                    () => {


                        const group =
                            button.closest(
                                ".selected-date-group"
                            );


                        const content =
                            group?.querySelector(
                                ".selected-date-group-content"
                            );


                        const arrow =
                            group?.querySelector(
                                ".selected-date-group-arrow"
                            );


                        const title =
                            group?.querySelector(
                                ".selected-date-group-title"
                            );


                        if (
                            !group ||
                            !content ||
                            !title
                        ) {

                            return;

                        }


                        const dateText =
                            title.textContent;


                        const date =
                            Array.from(
                                visitsByDate.keys()
                            )
                                .find(
                                    dateKey =>
                                        formatDate(
                                            dateKey
                                        ) ===
                                        dateText
                                            .trim()
                                );


                        if (!date) {

                            return;

                        }


                        const isExpanded =
                            button.getAttribute(
                                "aria-expanded"
                            ) ===
                            "true";


                        if (isExpanded) {


                            bookingExpandedDateGroups.delete(
                                date
                            );


                            button.setAttribute(
                                "aria-expanded",
                                "false"
                            );


                            content.hidden =
                                true;


                            arrow?.classList.remove(
                                "selected-date-group-arrow-open"
                            );


                        } else {


                            bookingExpandedDateGroups.add(
                                date
                            );


                            button.setAttribute(
                                "aria-expanded",
                                "true"
                            );


                            content.hidden =
                                false;


                            arrow?.classList.add(
                                "selected-date-group-arrow-open"
                            );

                        }

                    }
                );

            }
        );


    // ========================================
    // REMOVE INDIVIDUAL VISIT
    // ========================================

    list
        .querySelectorAll(
            ".remove-date-button"
        )
        .forEach(
            button => {


                button.addEventListener(
                    "click",
                    () => {


                        const visitIndex =
                            Number(
                                button.dataset.visitIndex
                            );


                        const removedVisit =
                            selectedVisits[
                                visitIndex
                            ];


                        if (
                            !removedVisit
                        ) {

                            return;

                        }


                        selectedVisits.splice(
                            visitIndex,
                            1
                        );


                        selectedDateCapacityConflicts.delete(
                            getSelectedVisitCapacityKey(
                                removedVisit.date,
                                removedVisit.timeWindow
                            )
                        );


                        rebuildSelectedDatesFromVisits();


                        const dateStillExists =
                            selectedVisits.some(
                                visit =>
                                    visit.date ===
                                    removedVisit.date
                            );


                        if (
                            !dateStillExists
                        ) {

                            bookingExpandedDateGroups.delete(
                                removedVisit.date
                            );

                        }


                        renderSelectedDates();

                        renderBookingCalendar();

                    }
                );

            }
        );


    updateBookingTotal();

}

// ========================================
// BOARDING
// ========================================

const boardingDropoff =
    document.getElementById(
        "boarding-dropoff"
    );


const boardingPickup =
    document.getElementById(
        "boarding-pickup"
    );


const boardingPickupWindow =
    document.getElementById(
        "boarding-pickup-window"
    );


boardingDropoff
    ?.addEventListener(
        "change",
        () => {

            if (
                boardingDropoff.value
            ) {

                boardingPickup.min =
                    addDaysToDateString(
                        boardingDropoff.value,
                        1
                    );

            }


            updateBookingTotal();

        }
    );


boardingPickup
    ?.addEventListener(
        "change",
        updateBookingTotal
    );


boardingPickupWindow
    ?.addEventListener(
        "change",
        updateBookingTotal
    );


function resetBoardingDates() {

    const today =
        getLocalDateString();


    boardingDropoff.min =
        today;


    boardingPickup.min =
        addDaysToDateString(
            today,
            1
        );


    boardingDropoff.value =
        "";


    boardingPickup.value =
        "";


    boardingPickupWindow.value =
        "";

}


function getBoardingNightCount() {

    if (
        !boardingDropoff?.value ||
        !boardingPickup?.value
    ) {

        return 0;

    }


    const difference =
        parseLocalDate(
            boardingPickup.value
        ) -
        parseLocalDate(
            boardingDropoff.value
        );


    return Math.max(
        0,
        Math.round(
            difference /
            86400000
        )
    );

}


function getBoardingPickupFee() {

    if (
        !boardingPickupWindow?.value
    ) {

        return 0;

    }


    return Number(
        boardingPickupWindow.options[
            boardingPickupWindow.selectedIndex
        ].dataset.fee
    ) || 0;

}

// ========================================
// BOOKING PRICE
// ========================================

function updateBookingTotal() {

    const serviceType =
        serviceTypeSelect?.value;


    const priceDisplay =
        document.getElementById(
            "booking-price"
        );


    const countDisplay =
        document.getElementById(
            "booking-count"
        );


    const details =
        document.getElementById(
            "booking-price-details"
        );


    if (!serviceType) {

        countDisplay.textContent =
            "0 services";


        priceDisplay.textContent =
            "$0.00";


        details.textContent =
            "";


        return;

    }


    const petCount =
        getSelectedPetCount();


    const additionalPetCount =
        Math.max(
            petCount - 1,
            0
        );


    // ========================================
    // DOG BOARDING
    // ========================================

    if (
        serviceType ===
        "Dog Boarding"
    ) {

        const pricing =
            getServicePrice(
                "Dog Boarding"
            );


        const nightlyBasePrice =
            Number(
                pricing?.base_price
            ) || 0;


        const holidayFee =
            Number(
                pricing?.holiday_fee
            ) || 0;


        const nights =
            getBoardingNightCount();


        const nightlyTotal =
            nightlyBasePrice *
            Math.max(
                petCount,
                1
            );


        const pickupFee =
            getBoardingPickupFee();


        const boardingNightDates =
            (
                boardingDropoff?.value &&
                boardingPickup?.value
            )
                ? getBoardingNightDates(
                    boardingDropoff.value,
                    boardingPickup.value
                )
                : [];


        const holidayNights =
            boardingNightDates
                .map(
                    date => ({
                        date,
                        holidayName:
                            getServiceHolidayName(
                                date
                            )
                    })
                )
                .filter(
                    item =>
                        Boolean(
                            item.holidayName
                        )
                );


        const holidayTotal =
            holidayNights.length *
            holidayFee;


        const total =
            (
                nights *
                nightlyTotal
            ) +
            holidayTotal +
            pickupFee;


        countDisplay.textContent =
            `${nights} ${
                nights === 1
                    ? "night"
                    : "nights"
            }`;


        priceDisplay.textContent =
            `$${total.toFixed(2)}`;


        const pieces =
            [];


        if (
            nights > 0 &&
            petCount > 0 &&
            nightlyBasePrice > 0
        ) {

            pieces.push(
                `${petCount} ${
                    petCount === 1
                        ? "pet"
                        : "pets"
                } × $${formatServicePrice(
                    nightlyBasePrice
                )} × ${nights} ${
                    nights === 1
                        ? "night"
                        : "nights"
                }`
            );

        }


        if (
            holidayNights.length === 1 &&
            holidayFee > 0
        ) {

            pieces.push(
                `${holidayNights[0].holidayName} +$${formatServicePrice(
                    holidayFee
                )}`
            );

        } else if (
            holidayNights.length > 1 &&
            holidayFee > 0
        ) {

            pieces.push(
                `${holidayNights.length} holiday nights × $${formatServicePrice(
                    holidayFee
                )}`
            );

        }


        if (
            pickupFee > 0
        ) {

            pieces.push(
                "$50.00 extended pickup"
            );

        }


        details.textContent =
            pieces.join(" + ");


        return;

    }


    // ========================================
    // NON-BOARDING SERVICES
    // ========================================

    const selectedOption =
        serviceOptionSelect.options[
            serviceOptionSelect.selectedIndex
        ];


    const basePrice =
        Number(
            selectedOption
                ?.dataset.price
        ) || 0;


    const pricing =
        getServicePrice(
            serviceType,
            serviceOptionSelect.value
        );


    const holidayFee =
        Number(
            pricing?.holiday_fee
        ) || 0;


    const perAdditionalPetFee =
        Number(
            pricing?.additional_pet_fee
        ) || 0;


    let additionalPetFee =
        0;


    if (
        serviceType ===
            "Dog Walking" ||
        serviceType ===
            "Drop-In Visit"
    ) {

        additionalPetFee =
            additionalPetCount *
            perAdditionalPetFee;

    }


// ========================================
// CALCULATE WEEKLY SERVICE DAYS
// ========================================
//
// 5+ UNIQUE service days inside the same
// Monday-Sunday week receives 12% off.
//
// Multiple visits on the same date still
// count as ONE service day.
//
// Only Dog Walking + Drop-In qualify.
// ========================================

const weeklyServiceDays =
    new Map();


selectedVisits.forEach(
    visit => {

        const weekKey =
            getWeekKey(
                visit.date
            );


        if (
            !weeklyServiceDays.has(
                weekKey
            )
        ) {

            weeklyServiceDays.set(
                weekKey,
                new Set()
            );

        }


        weeklyServiceDays
            .get(
                weekKey
            )
            .add(
                visit.date
            );

    }
);


    // ========================================
    // CALCULATE EACH SELECTED VISIT
    // ========================================
    
    const pricedVisits =
        selectedVisits.map(
            visit => {
    
                let surcharge =
                    0;
    
    
                if (
                    serviceType ===
                        "Dog Walking" ||
                    serviceType ===
                        "Drop-In Visit"
                ) {
    
                    const timeWindowConfig =
                        TIME_WINDOWS.find(
                            window =>
                                window.value ===
                                visit.timeWindow
                        );
    
    
                    if (
                        timeWindowConfig
                    ) {
    
                        const timeWindowDisplay =
                            getPreferredTimeWindowLabel(
                                timeWindowConfig,
                                pricing
                            );
    
    
                        surcharge =
                            Number(
                                timeWindowDisplay
                                    ?.surcharge
                            ) || 0;
    
                    }
    
                }
    
    
                const holidayName =
                    getServiceHolidayName(
                        visit.date
                    );
    
    
                const visitHolidayFee =
                    holidayName
                        ? holidayFee
                        : 0;
    
    
                // ========================================
                // 5+ DAY WEEKLY DISCOUNT
                // ========================================
    
                const weekKey =
                    getWeekKey(
                        visit.date
                    );
    
    
                const weekServiceDayCount =
                    weeklyServiceDays
                        .get(
                            weekKey
                        )
                        ?.size || 0;
    
    
                const qualifiesForWeeklyDiscount =
                    (
                        serviceType ===
                            "Dog Walking" ||
                        serviceType ===
                            "Drop-In Visit"
                    ) &&
                    weekServiceDayCount >=
                        5;
    
    
                const discountableBase =
                    basePrice +
                    additionalPetFee;
    
    
                const weeklyDiscount =
                    qualifiesForWeeklyDiscount
                        ? Math.round(
                            (
                                discountableBase *
                                0.12
                            ) *
                            100
                        ) / 100
                        : 0;
    
    
                const visitTotal =
                    discountableBase -
                    weeklyDiscount +
                    surcharge +
                    visitHolidayFee;
    
    
                return {
    
                    ...visit,
    
                    surcharge,
    
                    holidayName,
    
                    holidayFee:
                        visitHolidayFee,
    
                    weeklyDiscount,
    
                    qualifiesForWeeklyDiscount,
    
                    total:
                        visitTotal
    
                };
    
            }
        );
    
    
    // ========================================
    // TOTAL PRICE
    // ========================================

    const total =
        pricedVisits.reduce(
            (
                sum,
                visit
            ) =>
                sum +
                visit.total,
            0
        );


    countDisplay.textContent =
        `${selectedVisits.length} ${
            selectedVisits.length === 1
                ? "service"
                : "services"
        }`;


    priceDisplay.textContent =
        `$${total.toFixed(2)}`;


    const pieces =
        [];


    // ========================================
    // BASE SERVICE PRICE
    // ========================================

    if (
        selectedVisits.length &&
        basePrice
    ) {

        pieces.push(
            `${selectedVisits.length} × $${formatServicePrice(
                basePrice
            )}`
        );

    }


    // ========================================
    // ADDITIONAL PET PRICE
    // ========================================

    if (
        selectedVisits.length &&
        additionalPetFee > 0
    ) {

        pieces.push(
            `${additionalPetCount} additional ${
                additionalPetCount === 1
                    ? "pet"
                    : "pets"
            } × $${formatServicePrice(
                perAdditionalPetFee
            )} per visit`
        );

    }


    // ========================================
    // PET SITTING INCLUDED PETS
    // ========================================

    if (
        selectedVisits.length &&
        serviceType ===
            "Pet Sitting" &&
        additionalPetCount > 0
    ) {

        pieces.push(
            `${additionalPetCount} additional ${
                additionalPetCount === 1
                    ? "pet"
                    : "pets"
            } included`
        );

    }


    // ========================================
    // WEEKLY DISCOUNT
    // ========================================
    
    const weeklyDiscountTotal =
        pricedVisits.reduce(
            (
                sum,
                visit
            ) =>
                sum +
                Number(
                    visit.weeklyDiscount ||
                    0
                ),
            0
        );
    
    
    const discountedVisitCount =
        pricedVisits.filter(
            visit =>
                visit.weeklyDiscount >
                0
        ).length;
    
    
    if (
        weeklyDiscountTotal >
        0
    ) {
    
        pieces.push(
            `12% weekly discount -$${formatServicePrice(
                weeklyDiscountTotal
            )}`
        );
    
    }
    
    // ========================================
    // EVENING SURCHARGES
    // ========================================

    const eveningSurchargeTotal =
        pricedVisits.reduce(
            (
                sum,
                visit
            ) =>
                sum +
                visit.surcharge,
            0
        );


    const eveningSurchargeVisitCount =
        pricedVisits.filter(
            visit =>
                visit.surcharge > 0
        ).length;


    if (
        eveningSurchargeTotal > 0
    ) {

        if (
            eveningSurchargeVisitCount === 1
        ) {

            pieces.push(
                `Evening fee +$${formatServicePrice(
                    eveningSurchargeTotal
                )}`
            );

        } else {

            pieces.push(
                `${eveningSurchargeVisitCount} evening fees +$${formatServicePrice(
                    eveningSurchargeTotal
                )}`
            );

        }

    }


    // ========================================
    // HOLIDAY PRICE BREAKDOWN
    // ========================================

    const holidayVisits =
        pricedVisits.filter(
            visit =>
                visit.holidayName &&
                visit.holidayFee > 0
        );


    const holidayTotal =
        holidayVisits.reduce(
            (
                sum,
                visit
            ) =>
                sum +
                visit.holidayFee,
            0
        );


    if (
        holidayVisits.length === 1
    ) {

        pieces.push(
            `${holidayVisits[0].holidayName} +$${formatServicePrice(
                holidayTotal
            )}`
        );

    } else if (
        holidayVisits.length > 1
    ) {

        pieces.push(
            `${holidayVisits.length} holiday services +$${formatServicePrice(
                holidayTotal
            )}`
        );

    }


    details.textContent =
        pieces.join(" + ");

}

// ========================================
// WEEK VALIDATION
// ========================================

function getWeekKey(
    dateString
) {

    const date =
        parseLocalDate(
            dateString
        );


    const day =
        date.getDay();


    const difference =
        day === 0
            ? -6
            : 1 - day;


    date.setDate(
        date.getDate() +
        difference
    );


    return makeDateString(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


async function validateThreePerWeek(
    serviceType
) {

    if (
        selectedDates.length === 0
    ) {

        return {
            valid: false,
            message:
                "Please select at least one service date."
        };

    }


    // ========================================
    // BUILD THE WEEKS BEING BOOKED
    // ========================================

    const selectedWeeks =
        {};


    selectedDates.forEach(
        date => {

            const weekStart =
                getWeekKey(
                    date
                );


            if (
                !selectedWeeks[
                    weekStart
                ]
            ) {

                selectedWeeks[
                    weekStart
                ] =
                    new Set();

            }


            selectedWeeks[
                weekStart
            ].add(
                date
            );

        }
    );


    const weekStarts =
        Object.keys(
            selectedWeeks
        );


    if (
        weekStarts.length === 0
    ) {

        return {
            valid: false,
            message:
                "Please select at least one service date."
        };

    }


    // ========================================
    // FIND DATE RANGE WE NEED TO CHECK
    // ========================================

    const earliestWeekStart =
        weekStarts
            .slice()
            .sort()[0];


    const latestWeekStart =
        weekStarts
            .slice()
            .sort()[
                weekStarts.length - 1
            ];


    const latestWeekEnd =
        addDaysToDateString(
            latestWeekStart,
            6
        );


    // ========================================
    // LOAD ALREADY BOOKED SERVICES
    // OF THE SAME TYPE
    // ========================================

    const {
        data: existingVisits,
        error
    } =
        await supabaseClient
            .from("visits")
            .select(
                "id, visit_date, service_type, status"
            )
            .eq(
                "client_id",
                currentUser.id
            )
            .eq(
                "service_type",
                serviceType
            )
            .gte(
                "visit_date",
                earliestWeekStart
            )
            .lte(
                "visit_date",
                latestWeekEnd
            );


    if (error) {

        console.error(
            "Weekly booking validation error:",
            error
        );


        return {
            valid: false,
            message:
                "We couldn't verify your existing bookings. Please try again."
        };

    }


    // ========================================
    // COUNT EXISTING + NEW DATES BY WEEK
    // ========================================

    for (
        const weekStart of
            weekStarts
    ) {

        const weekEnd =
            addDaysToDateString(
                weekStart,
                6
            );


        const existingDates =
            new Set(

                (
                    existingVisits ||
                    []
                )
                    .filter(
                        visit => {

                            const status =
                                String(
                                    visit.status ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase();


                            // Cancelled services should not
                            // count toward the weekly minimum.

                            if (
                                status ===
                                "cancelled"
                            ) {

                                return false;

                            }


                            return (
                                visit.visit_date >=
                                    weekStart &&
                                visit.visit_date <=
                                    weekEnd
                            );

                        }
                    )
                    .map(
                        visit =>
                            visit.visit_date
                    )

            );


        const newDates =
            selectedWeeks[
                weekStart
            ];


        // ========================================
        // COMBINE UNIQUE EXISTING + NEW DATES
        // ========================================

        const combinedDates =
            new Set([
                ...existingDates,
                ...newDates
            ]);


        if (
            combinedDates.size <
            3
        ) {

            const existingCount =
                existingDates.size;


            const newCount =
                Array.from(
                    newDates
                )
                    .filter(
                        date =>
                            !existingDates.has(
                                date
                            )
                    )
                    .length;


            const total =
                combinedDates.size;


            const remaining =
                3 -
                total;


            return {
                valid: false,
                message:
                    `You currently have ${existingCount} ${
                        serviceType ===
                        "Dog Walking"
                            ? existingCount === 1
                                ? "walk"
                                : "walks"
                            : existingCount === 1
                                ? "drop-in visit"
                                : "drop-in visits"
                    } booked for the week of ${formatDate(
                        weekStart
                    )}. With ${
                        newCount
                    } ${
                        newCount === 1
                            ? "new visit"
                            : "new visits"
                    }, you still need ${
                        remaining
                    } more to meet the 3-per-week minimum.`
            };

        }

    }


    return {
        valid: true
    };

}

// ========================================
// BOOKING SUBMIT
// ========================================

const bookingForm =
    document.getElementById(
        "booking-form"
    );


// ========================================
// BOOKING FIELD ERROR HELPERS
// ========================================

function clearBookingFieldErrors() {

    document
        .querySelectorAll(
            ".booking-field-error"
        )
        .forEach(
            field => {

                field.classList.remove(
                    "booking-field-error"
                );


                field.removeAttribute(
                    "aria-invalid"
                );

            }
        );

}


function clearBookingFieldError(
    field
) {

    if (!field) {
        return;
    }


    field.classList.remove(
        "booking-field-error"
    );


    field.removeAttribute(
        "aria-invalid"
    );

}


function focusBookingFieldError(
    field
) {

    if (!field) {
        return;
    }


    field.classList.add(
        "booking-field-error"
    );


    field.setAttribute(
        "aria-invalid",
        "true"
    );


    field.focus({
        preventScroll: true
    });


    field.scrollIntoView({
        behavior:
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
                ? "auto"
                : "smooth",

        block:
            "center"
    });

}


// ========================================
// CLEAR BOOKING ERROR WHILE EDITING
// ========================================

[
    bookingPetSelect,
    serviceTypeSelect,
    serviceOptionSelect,
    bookingTime
]
    .filter(Boolean)
    .forEach(
        field => {

            field.addEventListener(
                "change",
                () => {

                    clearBookingFieldError(
                        field
                    );

                }
            );

        }
    );


if (bookingForm) {

    bookingForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "booking-message"
                );


            const button =
                document.getElementById(
                    "booking-submit-button"
                );


            message.textContent =
                "";


            clearBookingFieldErrors();


            const primaryPetId =
                Number(
                    bookingPetSelect.value
                );


            const additionalPetIds =
                getSelectedAdditionalPetIds();


            const serviceType =
                serviceTypeSelect.value;


            // ========================================
            // PRIMARY PET VALIDATION
            // ========================================

            if (!primaryPetId) {

                message.textContent =
                    "Please select a pet.";


                focusBookingFieldError(
                    bookingPetSelect
                );


                return;

            }


            // ========================================
            // SERVICE TYPE VALIDATION
            // ========================================

            if (!serviceType) {

                message.textContent =
                    "Please select a service.";


                focusBookingFieldError(
                    serviceTypeSelect
                );


                return;

            }


            // ========================================
            // DOG BOARDING
            // ========================================

            if (
                serviceType ===
                "Dog Boarding"
            ) {

                await submitBoardingBooking(
                    primaryPetId,
                    additionalPetIds,
                    message,
                    button
                );


                return;

            }


            // ========================================
            // STANDARD SERVICE DETAILS
            // ========================================

            const serviceOption =
                serviceOptionSelect.value;


            const timeWindow =
                bookingTime.value;


            // ========================================
            // SERVICE OPTION VALIDATION
            // ========================================

            if (!serviceOption) {

                const config =
                    SERVICE_CONFIG[
                        serviceType
                    ];


                const fieldName =
                    config?.optionLabel ||
                    "service option";


                message.textContent =
                    `Please select a ${fieldName.toLowerCase()}.`;


                focusBookingFieldError(
                    serviceOptionSelect
                );


                return;

            }


            // ========================================
            // TIME WINDOW VALIDATION
            // ========================================

            if (!timeWindow) {

                message.textContent =
                    serviceType ===
                        "Pet Sitting"
                        ? "Please select a time block."
                        : "Please select a preferred time window.";


                focusBookingFieldError(
                    bookingTime
                );


                return;

            }


            // ========================================
            // DATE VALIDATION
            // ========================================
            //
            // Dog Walking and Drop-In Visit keep the
            // existing 3 SERVICE DATES per week rule.
            //
            // Multiple visits on the same date still
            // count as only ONE service date toward
            // that weekly minimum.
            // ========================================
            
            if (
                serviceType ===
                    "Dog Walking" ||
                serviceType ===
                    "Drop-In Visit"
            ) {
            
                const validation =
                    await validateThreePerWeek(
                        serviceType
                    );
            
            
                if (
                    !validation.valid
                ) {
            
                    message.textContent =
                        validation.message;
            
            
                    const calendar =
                        document.getElementById(
                            "multi-date-booking"
                        );
            
            
                    calendar?.scrollIntoView({
                        behavior:
                            window.matchMedia(
                                "(prefers-reduced-motion: reduce)"
                            ).matches
                                ? "auto"
                                : "smooth",
            
                        block:
                            "center"
                    });
            
            
                    return;
            
                }
            
            } else if (
                selectedVisits.length <
                1
            ) {
            
                message.textContent =
                    "Please select at least one visit.";
            
            
                const calendar =
                    document.getElementById(
                        "multi-date-booking"
                    );
            
            
                calendar?.scrollIntoView({
                    behavior:
                        window.matchMedia(
                            "(prefers-reduced-motion: reduce)"
                        ).matches
                            ? "auto"
                            : "smooth",
            
                    block:
                        "center"
                });
            
            
                return;
            
            }
            
            
            // ========================================
            // REFRESH CAPACITY BEFORE CHECKOUT
            // ========================================
            //
            // Capacity is checked against each exact
            // DATE + TIME WINDOW pair.
            //
            // Example:
            //
            // Monday 7:00 AM - 10:00 AM
            //
            // is independent from:
            //
            // Monday 6:00 PM - 8:00 PM
            //
            // The database will still perform the final
            // authoritative capacity validation.
            // ========================================
            
            if (
                serviceType ===
                    "Dog Walking" ||
                serviceType ===
                    "Drop-In Visit"
            ) {
            
                await refreshPreferredTimeWindowAvailability();
            
            
                const conflictingVisit =
                    selectedVisits.find(
                        visit =>
                            hasSelectedVisitCapacityConflict(
                                visit.date,
                                visit.timeWindow
                            )
                    );
            
            
                if (
                    conflictingVisit
                ) {
            
                    message.textContent =
                        "One or more selected visits are no longer available. Please remove the unavailable visit or choose another time window.";
            
            
                    renderSelectedDates();
            
            
                    const selectedVisitsSection =
                        document.getElementById(
                            "selected-dates"
                        ) ||
                        document.getElementById(
                            "multi-date-booking"
                        );
            
            
                    selectedVisitsSection
                        ?.scrollIntoView({
                            behavior:
                                window.matchMedia(
                                    "(prefers-reduced-motion: reduce)"
                                ).matches
                                    ? "auto"
                                    : "smooth",
            
                            block:
                                "center"
                        });
            
            
                    return;
            
                }
            
            }

            // ========================================
            // SUBMIT THROUGH SECURE DATABASE RPC
            // ========================================
            //
            // IMPORTANT:
            //
            // We intentionally DO NOT send:
            //
            // - price
            // - pricing tier
            // - base price
            // - additional pet fee
            // - evening surcharge
            // - booking group ID
            //
            // Supabase determines all of those.
            //
            // Each selected visit now sends its own
            // date + time window.
            // ========================================
            
            button.disabled =
                true;
            
            
            button.textContent =
                "Preparing Checkout...";
            
            
            try {
            
                // ========================================
                // BUILD PER-VISIT CHECKOUT PAYLOAD
                // ========================================
            
                const checkoutVisits =
                    selectedVisits.map(
                        visit => ({
                            date:
                                visit.date,
            
                            time_window:
                                visit.timeWindow
                        })
                    );
            
            
                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .rpc(
                            "create_booking_checkout",
                            {
            
                                p_service_type:
                                    serviceType,
            
                                p_service_option:
                                    serviceOption,
            
                                p_visits:
                                    checkoutVisits,
            
                                p_primary_pet_id:
                                    primaryPetId,
            
                                p_additional_pet_ids:
                                    additionalPetIds
            
                            }
                        );
            
            
                if (error) {
            
                    throw error;
            
                }
            
            
                console.log(
                    "Secure booking created:",
                    data
                );
            
            
                // ========================================
                // CHECKOUT CREATED
                // ========================================
                
                const checkout =
                    Array.isArray(data)
                        ? data[0]
                        : data;
                
                
                if (
                    !checkout?.checkout_id
                ) {
                
                    throw new Error(
                        "Checkout was created but no checkout ID was returned."
                    );
                
                }
                
                
                // ========================================
                // SAVE BOOKING DRAFT
                // ========================================
                //
                // Preserve the client's booking selections
                // before leaving the portal for checkout.
                //
                // This lets us safely restore:
                //
                // - primary pet
                // - additional pets
                // - service type
                // - duration / package
                // - every selected visit time
                // - every selected date
                // - exact date + time visit pairs
                //
                // when the client chooses Edit Booking or
                // returns with the browser back gesture.
                // ========================================

                const bookingDraft = {

                    version:
                        1,

                    checkoutId:
                        String(
                            checkout.checkout_id
                        ),

                    primaryPetId:
                        primaryPetId,

                    additionalPetIds:
                        [
                            ...additionalPetIds
                        ],

                    serviceType:
                        serviceType,

                    serviceOption:
                        serviceOption,

                    timeWindows:
                        getSelectedBookingTimeWindows(),

                    selectedVisits:
                        selectedVisits.map(
                            visit => ({

                                date:
                                    visit.date,

                                timeWindow:
                                    visit.timeWindow

                            })
                        ),

                    selectedDates:
                        [
                            ...selectedDates
                        ],

                    calendarYear:
                        calendarYear,

                    calendarMonth:
                        calendarMonth,

                    savedAt:
                        Date.now()

                };


                try {

                    window.sessionStorage.setItem(
                        "paws-in-stride-booking-draft",
                        JSON.stringify(
                            bookingDraft
                        )
                    );

                }
                catch (
                    draftError
                ) {

                    console.warn(
                        "Booking draft could not be saved:",
                        draftError
                    );

                }


                // ========================================
                // GO TO PAYMENT PAGE
                // ========================================

                message.textContent =
                    "Opening secure checkout...";


                window.location.href =
                    `./payment.html?checkout=${encodeURIComponent(checkout.checkout_id)}`;

            }
            catch (
                error
            ) {

                console.error(
                    "Secure booking error:",
                    error
                );




                // ========================================
                // SERVER VALIDATION MESSAGE
                // ========================================

                const serverMessage =
                    String(
                        error?.message ||
                        ""
                    );


                if (
                    serverMessage.includes(
                        "require at least 3 service dates per week"
                    )
                ) {

                    message.textContent =
                        "Dog Walking and Drop-In bookings require at least 3 service dates per week.";

                }
                else if (
                    serverMessage.includes(
                        "time window just filled up"
                    )
                ) {

                    message.textContent =
                        serverMessage;

                }
                else if (
                    serverMessage.includes(
                        "Pricing is unavailable"
                    )
                ) {

                    message.textContent =
                        "Pricing is currently unavailable for this service. Please try again.";

                }
                else if (
                    serverMessage.includes(
                        "does not belong to this account"
                    )
                ) {

                    message.textContent =
                        "One of the selected pets could not be verified for your account.";

                }
                else {

                    message.textContent =
                        "We couldn't submit your service request. Please try again.";

                }

            }
            finally {

                button.disabled =
                    false;


                button.textContent =
                    "Continue";

            }

        }
    );

}

// ========================================
// BOARDING SUBMIT
// ========================================

async function submitBoardingBooking(
    primaryPetId,
    additionalPetIds,
    message,
    button
) {

    const dropoff =
        boardingDropoff.value;


    const pickup =
        boardingPickup.value;


    const pickupWindow =
        boardingPickupWindow.value;


    const nights =
        getBoardingNightCount();


    // ========================================
    // BOARDING VALIDATION
    // ========================================

    if (
        !dropoff ||
        !pickup ||
        !pickupWindow ||
        nights < 1
    ) {

        message.textContent =
            "Please complete your boarding dates and pickup time.";


        return;

    }


    // ========================================
    // SUBMIT THROUGH SECURE DATABASE RPC
    // ========================================
    //
    // The browser does NOT calculate or send
    // the boarding price.
    //
    // Supabase determines:
    //
    // - pricing tier
    // - nightly base price
    // - number of pets
    // - number of nights
    // - extended pickup fee
    // - holiday fees
    // - final checkout total
    //
    // No real visits are created yet.
    // ========================================

    button.disabled =
        true;


    button.textContent =
        "Preparing Checkout...";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "create_booking_checkout",
                    {

                        p_service_type:
                            "Dog Boarding",

                        p_service_option:
                            null,

                        p_dates:
                            null,

                        p_time_window:
                            null,

                        p_primary_pet_id:
                            primaryPetId,

                        p_additional_pet_ids:
                            additionalPetIds,

                        p_boarding_dropoff:
                            dropoff,

                        p_boarding_pickup:
                            pickup,

                        p_boarding_pickup_window:
                            pickupWindow

                    }
                );


        if (error) {

            throw error;

        }


        console.log(
            "Secure boarding checkout created:",
            data
        );


        // ========================================
        // CHECKOUT CREATED
        // ========================================

        const checkout =
            Array.isArray(data)
                ? data[0]
                : data;


        if (
            !checkout?.checkout_id
        ) {

            throw new Error(
                "Checkout was created but no checkout ID was returned."
            );

        }


        // ========================================
        // GO TO PAYMENT PAGE
        // ========================================

        message.textContent =
            "Opening secure checkout...";


        window.location.href =
            `./payment.html?checkout=${encodeURIComponent(checkout.checkout_id)}`;

    }
    catch (
        error
    ) {

        console.error(
            "Secure boarding error:",
            error
        );


        // ========================================
        // SERVER VALIDATION MESSAGE
        // ========================================

        const serverMessage =
            String(
                error?.message ||
                ""
            );


        if (
            serverMessage.includes(
                "Pricing is unavailable"
            )
        ) {

            message.textContent =
                "Boarding pricing is currently unavailable. Please try again.";

        }
        else if (
            serverMessage.includes(
                "pickup must be after"
            )
        ) {

            message.textContent =
                "Your pickup date must be after your drop-off date.";

        }
        else if (
            serverMessage.includes(
                "Invalid boarding pickup"
            )
        ) {

            message.textContent =
                "Please select a valid boarding pickup time.";

        }
        else if (
            serverMessage.includes(
                "does not belong to this account"
            )
        ) {

            message.textContent =
                "One of the selected pets could not be verified for your account.";

        }
        else {

            message.textContent =
                "We couldn't submit your boarding request. Please try again.";

        }

    }
    finally {

        button.disabled =
            false;


        button.textContent =
            "Continue";

    }

}

// ========================================
// RESET BOOKING
// ========================================

function resetBookingForm() {

    // ========================================
    // CLEAR BOOKING SELECTION STATE
    // ========================================

    selectedVisits =
        [];


    selectedDates =
        [];


    selectedDateCapacityConflicts.clear();


    lastSelectedTimeWindow =
        "";


    clearTimeWindowConflictError();

    clearTimeWindowCapacityHelp();


    // ========================================
    // RESET FORM CONTROLS
    // ========================================

    bookingForm.reset();


    document.getElementById(
        "service-option-wrapper"
    ).style.display =
        "none";


    document.getElementById(
        "time-window-wrapper"
    ).style.display =
        "none";


    document.getElementById(
        "multi-date-booking"
    ).style.display =
        "none";


    document.getElementById(
        "boarding-booking"
    ).style.display =
        "none";


    document.getElementById(
        "additional-pets-wrapper"
    ).style.display =
        "none";


    // ========================================
    // REFRESH BOOKING UI
    // ========================================

    renderSelectedDates();

    renderBookingCalendar();

    updateBookingTotal();

}
// ========================================
// REFRESH UPCOMING
// ========================================

async function refreshUpcomingVisits() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("visits")
            .select("*")
            .eq(
                "client_id",
                currentUser.id
            )
            .order(
                "visit_date",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            error
        );

        return;

    }


    currentVisits =
        data || [];


    currentVisitPets =
        [];


    const visitIds =
        currentVisits.map(
            visit => visit.id
        );


    if (
        visitIds.length > 0
    ) {

        const {
            data: visitPets,
            error: visitPetsError
        } =
            await supabaseClient
                .from("visit_pets")
                .select(
                    "visit_id, pet_id, is_primary, additional_pet_fee"
                )
                .in(
                    "visit_id",
                    visitIds
                );


        if (visitPetsError) {

            console.error(
                "Visit pets refresh error:",
                visitPetsError
            );

        } else {

            currentVisitPets =
                visitPets || [];

        }

    }


    renderUpcomingCalendar();

    renderSelectedUpcomingServices();

    renderMobileHomeDashboard();

}


// ========================================
// UPCOMING CALENDAR
// ========================================

document
    .getElementById(
        "upcoming-calendar-prev"
    )
    ?.addEventListener(
        "click",
        () => {

            upcomingCalendarMonth--;


            if (
                upcomingCalendarMonth < 0
            ) {

                upcomingCalendarMonth =
                    11;

                upcomingCalendarYear--;

            }


            closeOpenClientVisitReport();


            selectedUpcomingDate =
                null;


            renderUpcomingCalendar();

            renderSelectedUpcomingServices();

        }
    );


document
    .getElementById(
        "upcoming-calendar-next"
    )
    ?.addEventListener(
        "click",
        () => {

            upcomingCalendarMonth++;


            if (
                upcomingCalendarMonth > 11
            ) {

                upcomingCalendarMonth =
                    0;

                upcomingCalendarYear++;

            }


            closeOpenClientVisitReport();


            selectedUpcomingDate =
                null;


            renderUpcomingCalendar();

            renderSelectedUpcomingServices();

        }
    );


function renderUpcomingCalendar() {

    const grid =
        document.getElementById(
            "upcoming-calendar-grid"
        );


    const label =
        document.getElementById(
            "upcoming-calendar-month-label"
        );


    if (
        !grid ||
        !label
    ) {

        return;

    }


    label.textContent =
        new Date(
            upcomingCalendarYear,
            upcomingCalendarMonth,
            1
        )
            .toLocaleDateString(
                "en-US",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            );


    grid.innerHTML =
        "";


    const firstDay =
        new Date(
            upcomingCalendarYear,
            upcomingCalendarMonth,
            1
        );


    let blanks =
        firstDay.getDay();


    if (
        blanks < 0
    ) {

        blanks =
            6;

    }


    for (
        let i = 0;
        i < blanks;
        i++
    ) {

        const blank =
            document.createElement(
                "div"
            );


        blank.className =
            "upcoming-calendar-empty";


        grid.appendChild(
            blank
        );

    }


    const days =
        new Date(
            upcomingCalendarYear,
            upcomingCalendarMonth + 1,
            0
        ).getDate();


    const today =
        getLocalDateString();


    for (
        let day = 1;
        day <= days;
        day++
    ) {

        const date =
            makeDateString(
                upcomingCalendarYear,
                upcomingCalendarMonth,
                day
            );


        // ========================================
        // VISITS FOR THIS DATE
        // ========================================

        const visitsForDate =
            currentVisits.filter(
                visit => {

                    const status =
                        String(
                            visit.status ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        visit.visit_date ===
                            date &&
                        status !==
                            "cancelled"
                    );

                }
            );


        const serviceCount =
            visitsForDate.length;


        // ========================================
        // COMPLETED DATE
        // ========================================

        const completedDate =
            date <= today &&
            serviceCount > 0 &&
            visitsForDate.every(
                visit => {

                    const status =
                        String(
                            visit.status ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        status ===
                            "completed" ||
                        Boolean(
                            visit.completed_at
                        )
                    );

                }
            );


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "upcoming-calendar-day";


        if (
            serviceCount
        ) {

            button.classList.add(
                "upcoming-calendar-booked"
            );

        }


        if (
            completedDate
        ) {

            button.classList.add(
                "upcoming-calendar-completed"
            );

        }


        if (
            date ===
            today
        ) {

            button.classList.add(
                "upcoming-calendar-today"
            );

        }


        if (
            date ===
            selectedUpcomingDate
        ) {

            button.classList.add(
                "upcoming-calendar-selected"
            );

        }


        button.innerHTML =
            `
                <span class="upcoming-day-number">
                    ${day}
                </span>

                ${
                    serviceCount
                        ? `
                            <span
                                class="
                                    upcoming-service-count
                                    ${
                                        completedDate
                                            ? "upcoming-service-count-completed"
                                            : ""
                                    }
                                "
                            >
                                ${serviceCount}
                            </span>
                        `
                        : ""
                }
            `;


        button.addEventListener(
            "click",
            () => {

                closeOpenClientVisitReport();


                selectedUpcomingDate =
                    date;


                renderUpcomingCalendar();

                renderSelectedUpcomingServices();

            }
        );


        grid.appendChild(
            button
        );

    }

}

// ========================================
// UPCOMING DETAILS
// ========================================

function getPetsForVisit(
    visit
) {

    const relationships =
        currentVisitPets
            .filter(
                relation =>
                    Number(
                        relation.visit_id
                    ) ===
                    Number(
                        visit.id
                    )
            )
            .sort(
                (a, b) =>
                    Number(
                        b.is_primary
                    ) -
                    Number(
                        a.is_primary
                    )
            );


    const pets =
        relationships
            .map(
                relation =>
                    currentPets.find(
                        pet =>
                            Number(pet.id) ===
                            Number(
                                relation.pet_id
                            )
                    )
            )
            .filter(Boolean);


    if (
        pets.length === 0 &&
        visit.pet_id
    ) {

        const fallback =
            currentPets.find(
                pet =>
                    Number(pet.id) ===
                    Number(
                        visit.pet_id
                    )
            );


        return fallback
            ? [fallback]
            : [];

    }


    return pets;

}


function renderSelectedUpcomingServices() {

    const heading =
        document.getElementById(
            "selected-upcoming-date"
        );


    const container =
        document.getElementById(
            "selected-upcoming-services"
        );


    if (!selectedUpcomingDate) {

        heading.textContent =
            "Select a date";


        container.innerHTML =
            `
                <p class="empty-upcoming-message">
                    Select a date on the calendar to view services.
                </p>
            `;

        return;

    }


    heading.textContent =
        formatLongDate(
            selectedUpcomingDate
        );


    const services =
        currentVisits
            .filter(
                visit =>
                    visit.visit_date ===
                        selectedUpcomingDate &&
                    String(
                        visit.status || ""
                    ).toLowerCase() !==
                        "cancelled"
            )
            .sort(
                compareClientVisits
            );


    if (
        services.length === 0
    ) {

        container.innerHTML =
            `
                <p class="empty-upcoming-message">
                    No services scheduled for this date.
                </p>
            `;

        return;

    }


    container.innerHTML =
        services
            .map(
                visit => {

                    const pets =
                        getPetsForVisit(
                            visit
                        );


                    const chips =
                        pets.length
                            ? pets
                                .map(
                                    pet => `
                                        <span class="service-pet-chip">
                                            ${escapeHtml(pet.name)}
                                        </span>
                                    `
                                )
                                .join("")
                            : `
                                <span class="service-pet-chip service-pet-chip-missing">
                                    Pet not assigned
                                </span>
                            `;


                    const progress =
                        getClientVisitProgressInfo(
                            visit
                        );


                    const cardStateClass =
                        progress.state ===
                        "completed"
                            ? "upcoming-service-card-completed"
                            : progress.state ===
                                "checked_in"
                                ? "upcoming-service-card-in-progress"
                                : "";


                    const canCancel =
                        progress.state !==
                            "completed" &&
                        progress.state !==
                            "checked_in";


                    return `
                        <div class="upcoming-service-card ${cardStateClass}">

                            ${buildClientVisitProgressIcon(
                                progress
                            )}

                            <div class="upcoming-service-card-header">

                                <strong>
                                    ${escapeHtml(
                                        visit.service_name ||
                                        visit.service_type ||
                                        "Service"
                                    )}
                                </strong>

                                <span class="service-status">
                                    ${escapeHtml(
                                        getClientVisitStatusLabel(
                                            visit,
                                            progress
                                        )
                                    )}
                                </span>

                            </div>


                            <div class="upcoming-service-pets">

                                <span class="upcoming-service-pets-label">
                                    ${
                                        pets.length === 1
                                            ? "PET"
                                            : "PETS"
                                    }
                                </span>

                                <div class="service-pet-chips">
                                    ${chips}
                                </div>

                            </div>


                            ${
                                visit.time_window
                                    ? `
                                        <div class="upcoming-service-row">

                                            <span>
                                                Time
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    visit.time_window
                                                )}
                                            </strong>

                                        </div>
                                    `
                                    : ""
                            }


                            <div class="upcoming-service-row">

                                <span>
                                    Price
                                </span>

                                <strong>
                                    $${Number(
                                        visit.price || 0
                                    ).toFixed(2)}
                                </strong>

                            </div>


                            <div class="upcoming-service-row">

                                <span>
                                    Payment
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        formatStatus(
                                            visit.payment_status
                                        )
                                    )}
                                </strong>

                            </div>


                            ${buildClientVisitProgressSection(
                                visit,
                                progress
                            )}


                            ${
                                canCancel
                                    ? `
                                        <div class="upcoming-service-actions">

                                            <button
                                                type="button"
                                                class="client-cancel-service-button"
                                                data-client-cancel-visit="${Number(
                                                    visit.id
                                                )}"
                                            >
                                                Cancel Service
                                            </button>

                                        </div>
                                    `
                                    : ""
                            }

                        </div>
                    `;

                }
            )
            .join("");

}


// ========================================
// CLIENT SERVICE SORTING
// ========================================

function compareClientVisits(
    a,
    b
) {

    const timeA =
        getClientTimeWindowSortMinutes(
            a.time_window
        );


    const timeB =
        getClientTimeWindowSortMinutes(
            b.time_window
        );


    if (
        timeA !==
        timeB
    ) {

        return (
            timeA -
            timeB
        );

    }


    return (
        Number(a.id) -
        Number(b.id)
    );

}


// ========================================
// CLIENT TIME WINDOW SORT
// ========================================

function getClientTimeWindowSortMinutes(
    timeWindow
) {

    if (
        !timeWindow
    ) {

        return 99999;

    }


    const firstPart =
        String(
            timeWindow
        )
            .split("-")[0]
            .trim();


    const match =
        firstPart.match(
            /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i
        );


    if (
        !match
    ) {

        return 99999;

    }


    let hour =
        Number(
            match[1]
        );


    const minute =
        Number(
            match[2] ||
            0
        );


    const period =
        match[3]
            .toUpperCase();


    if (
        hour ===
        12
    ) {

        hour =
            0;

    }


    if (
        period ===
        "PM"
    ) {

        hour +=
            12;

    }


    return (
        hour *
        60 +
        minute
    );

}

// ========================================
// CLIENT VISIT PROGRESS
// ========================================

function getClientVisitProgressInfo(
    visit
) {

    const status =
        String(
            visit.status ||
            ""
        )
            .trim()
            .toLowerCase();


    const hasCheckedIn =
        Boolean(
            visit.checked_in_at
        );


    const hasCompleted =
        Boolean(
            visit.completed_at
        ) ||
        status ===
        "completed";


    if (
        hasCompleted
    ) {

        return {

            state:
                "completed",

            checkedInAt:
                visit.checked_in_at,

            completedAt:
                visit.completed_at,

            minutes:
                getClientVisitDurationMinutes(
                    visit
                )

        };

    }


    if (
        hasCheckedIn ||
        status ===
        "checked_in"
    ) {

        return {

            state:
                "checked_in",

            checkedInAt:
                visit.checked_in_at,

            completedAt:
                null,

            minutes:
                null

        };

    }


    return {

        state:
            "scheduled",

        checkedInAt:
            null,

        completedAt:
            null,

        minutes:
            null

    };

}


// ========================================
// CLIENT-FACING STATUS LABEL
// ========================================

function getClientVisitStatusLabel(
    visit,
    progress
) {

    // ========================================
    // COMPLETED VISIT
    // ========================================

    if (
        progress.state ===
        "completed"
    ) {

        return "Complete";

    }


    // ========================================
    // VISIT CURRENTLY IN PROGRESS
    // ========================================

    if (
        progress.state ===
        "checked_in"
    ) {

        return "In Progress";

    }


    // ========================================
    // PAID VISIT = BOOKED
    // ========================================

    if (
        String(
            visit.payment_status ||
            ""
        )
            .trim()
            .toLowerCase() ===
        "paid"
    ) {

        return "Booked";

    }


    // ========================================
    // FALLBACK STATUS
    // ========================================

    return formatStatus(
        visit.status
    );

}

// ========================================
// CLIENT VISIT STATUS ICON
// ========================================

function buildClientVisitProgressIcon(
    progress
) {

    if (
        progress.state ===
        "completed"
    ) {

        return `
            <div
                class="client-visit-progress-icon client-visit-progress-complete"
                title="Visit complete"
                aria-label="Visit complete"
            >
                ✓
            </div>
        `;

    }


    if (
        progress.state ===
        "checked_in"
    ) {

        return `
            <div
                class="client-visit-progress-icon client-visit-progress-active"
                title="Visit in progress"
                aria-label="Visit in progress"
            >
                ◷
            </div>
        `;

    }


    return "";

}

// ========================================
// CLIENT VISIT PROGRESS MESSAGE
// ========================================

function buildClientVisitProgressSection(
    visit,
    progress
) {


    if (
        progress.state ===
        "completed"
    ) {


        const checkedIn =
            formatClientVisitTimestamp(
                progress.checkedInAt
            );


        const completed =
            formatClientVisitTimestamp(
                progress.completedAt
            );


        const durationText =
            progress.minutes !==
            null

                ? `${progress.minutes} ${
                    progress.minutes ===
                    1

                        ? "minute"

                        : "minutes"
                }`

                : "";


        return `

            <div class="client-visit-progress client-visit-progress-finished">


                <div class="client-visit-progress-heading">

                    <span class="client-visit-inline-check">
                        ✓
                    </span>

                    <strong>
                        Visit Complete
                    </strong>

                </div>


                ${
                    checkedIn &&
                    completed

                        ? `

                            <p>

                                ${escapeHtml(
                                    checkedIn
                                )}
                                –
                                ${escapeHtml(
                                    completed
                                )}

                                ${
                                    durationText

                                        ? ` • ${escapeHtml(
                                            durationText
                                        )}`

                                        : ""
                                }

                            </p>

                        `

                        : durationText

                            ? `

                                <p>

                                    Total Visit Time:
                                    ${escapeHtml(
                                        durationText
                                    )}

                                </p>

                            `

                            : ""
                }


                <div class="client-visit-report-actions">

                    <button
                        type="button"
                        class="client-view-visit-report-button"
                        data-client-visit-report-open="${visit.id}"
                    >
                        View Visit Report
                    </button>

                </div>


            </div>


            <div
                id="client-visit-report-${visit.id}"
                class="client-visit-report-mount"
            ></div>

        `;

    }


    if (
        progress.state ===
        "checked_in"
    ) {
    
    
        const checkedIn =
            formatClientVisitTimestamp(
                progress.checkedInAt
            );
    
    
        const liveWalk =
            currentClientLiveWalks.get(
                Number(
                    visit.id
                )
            ) ||
            null;
    
    
        // ========================================
        // LIVE WALK IN PROGRESS
        // ========================================
    
        if (
            liveWalk
        ) {
    
            const startedAt =
                new Date(
                    liveWalk.started_at
                );
    
    
            const elapsedMilliseconds =
                Date.now() -
                startedAt.getTime();
    
    
            const elapsedMinutes =
                Number.isFinite(
                    elapsedMilliseconds
                ) &&
                elapsedMilliseconds >
                    0
    
                    ? Math.floor(
                        elapsedMilliseconds /
                        60000
                    )
    
                    : 0;
    
    
            const distanceMeters =
                Number(
                    liveWalk.distance_meters ||
                    0
                );
    
    
            const distanceMiles =
                (
                    distanceMeters /
                    1609.344
                ).toFixed(
                    2
                );
    
    
            return `
    
                <div class="client-visit-progress client-visit-progress-live">
    
    
                    <div class="client-visit-progress-heading">
    
                        <span class="client-visit-live-dot"></span>
    
                        <strong>
                            Walk In Progress
                        </strong>
    
                    </div>
    
    
                    <p
                        class="client-live-walk-summary"
                        data-live-walk-started-at="${escapeHtml(
                            liveWalk.started_at ||
                            ""
                        )}"
                        data-live-walk-distance-meters="${distanceMeters}"
                    >
    
                        ${elapsedMinutes}
                        ${
                            elapsedMinutes ===
                            1
    
                                ? "minute"
    
                                : "minutes"
                        }
                        ·
                        ${distanceMiles} mi
    
                    </p>
    
    
                </div>
    
            `;
    
        }
    
    
        // ========================================
        // VISIT CHECKED IN / NO WALK YET
        // ========================================
    
        return `
    
            <div class="client-visit-progress client-visit-progress-live">
    
    
                <div class="client-visit-progress-heading">
    
                    <span class="client-visit-live-dot"></span>
    
                    <strong>
                        Visit In Progress
                    </strong>
    
                </div>
    
    
                <p>
    
                    Your pet care provider checked in${
    
                        checkedIn
    
                            ? ` at ${escapeHtml(
                                checkedIn
                            )}`
    
                            : ""
    
                    }.
    
                </p>
    
    
            </div>
    
        `;
    
    }


    return "";

}

// ========================================
// CLIENT SERVICE ACTIONS
// ========================================

document
    .getElementById(
        "selected-upcoming-services"
    )
    ?.addEventListener(
        "click",
        async event => {


            // ========================================
            // CANCEL SERVICE
            // ========================================

            const cancelButton =
                event.target.closest(
                    "[data-client-cancel-visit]"
                );


            if (
                cancelButton
            ) {

                const visitId =
                    Number(
                        cancelButton.dataset
                            .clientCancelVisit
                    );


                if (
                    !visitId
                ) {
                    return;
                }


                const visit =
                    currentVisits.find(
                        item =>
                            Number(
                                item.id
                            ) ===
                            visitId
                    );


                if (
                    !visit
                ) {
                    return;
                }


                openClientCancellationModal(
                    visit
                );


                return;

            }


            // ========================================
            // REPORT IMAGE
            // ========================================

            const reportImageButton =
                event.target.closest(
                    "[data-client-report-image]"
                );


            if (
                reportImageButton
            ) {


                const imageUrl =
                    reportImageButton.dataset
                        .clientReportImage;


                if (
                    imageUrl
                ) {

                    openClientReportLightbox(
                        imageUrl
                    );

                }


                return;

            }


            // ========================================
            // VISIT REPORT
            // ========================================

            const button =
                event.target.closest(
                    "[data-client-visit-report-open]"
                );


            if (
                !button
            ) {
                return;
            }


            const visitId =
                Number(
                    button.dataset
                        .clientVisitReportOpen
                );


            if (
                !visitId
            ) {
                return;
            }


            await toggleClientVisitReport(
                visitId,
                button
            );

        }
    );

// ========================================
// CLIENT CANCELLATION MODAL
// ========================================

async function openClientCancellationModal(
    visit
) {

    closeClientCancellationModal();


    let cancellationPreview =
        null;


    // ========================================
    // LOAD SERVER-SIDE CREDIT PREVIEW
    // ========================================

    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "preview_my_visit_cancellation",
                {
                    p_visit_id:
                        Number(
                            visit.id
                        )
                }
            );


        if (
            error
        ) {
            throw error;
        }


        cancellationPreview =
            Array.isArray(
                data
            )
                ? data[0]
                : data;

    }
    catch (error) {

        console.error(
            "Cancellation preview error:",
            error
        );

    }


    const price =
        Number(
            cancellationPreview
                ?.original_price ??
            visit.price ??
            0
        );


    const estimatedCredit =
        cancellationPreview
            ? Number(
                cancellationPreview
                    .credit_amount ||
                0
            )
            : null;


    const creditPercent =
        cancellationPreview
            ? Number(
                cancellationPreview
                    .credit_percent ||
                0
            )
            : null;


    const formattedPrice =
        price.toLocaleString(
            "en-US",
            {
                style:
                    "currency",

                currency:
                    "USD"
            }
        );


    const formattedCredit =
        estimatedCredit !==
            null
            ? estimatedCredit
                .toLocaleString(
                    "en-US",
                    {
                        style:
                            "currency",

                        currency:
                            "USD"
                    }
                )
            : null;


    let creditExplanation =
        "Your exact credit will be calculated when you confirm the cancellation.";


    if (
        creditPercent ===
        100
    ) {

        creditExplanation =
            "100% account credit — this cancellation is at least 24 hours before the scheduled service.";

    }
    else if (
        creditPercent ===
        50
    ) {

        creditExplanation =
            "50% account credit — this cancellation is less than 24 hours before the scheduled service.";

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "client-cancellation-modal";


    overlay.className =
        "client-cancellation-modal";


    overlay.innerHTML =
        `
            <div
                class="client-cancellation-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="client-cancellation-title"
            >

                <div class="client-cancellation-header">

                    <div>

                        <span class="client-cancellation-eyebrow">
                            Cancellation
                        </span>

                        <h3 id="client-cancellation-title">
                            Cancel this service?
                        </h3>

                    </div>


                    <button
                        type="button"
                        class="client-cancellation-close"
                        data-client-cancellation-close
                        aria-label="Close cancellation window"
                    >
                        ×
                    </button>

                </div>


                <div class="client-cancellation-service">

                    <strong>
                        ${escapeHtml(
                            visit.service_name ||
                            visit.service_type ||
                            "Service"
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            formatLongDate(
                                visit.visit_date
                            )
                        )}
                    </span>

                    ${
                        visit.time_window
                            ? `
                                <span>
                                    ${escapeHtml(
                                        visit.time_window
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>


                <div class="client-cancellation-policy">

                    <strong>
                        Cancellation Policy
                    </strong>

                    <p>
                        Cancel at least 24 hours before your scheduled
                        service to receive 100% of the service price
                        back as Paws in Stride account credit.
                    </p>

                    <p>
                        Cancellations made less than 24 hours before
                        the scheduled service receive 50% account
                        credit.
                    </p>

                </div>


                <div class="client-cancellation-price">

                    <span>
                        Service Price
                    </span>

                    <strong>
                        ${formattedPrice}
                    </strong>

                </div>


                ${
                    formattedCredit
                        ? `
                            <div class="client-cancellation-price">

                                <span>
                                    Estimated Account Credit
                                </span>

                                <strong>
                                    ${formattedCredit}
                                </strong>

                            </div>
                        `
                        : ""
                }


                <p
                    id="client-cancellation-message"
                    class="client-cancellation-note"
                >
                    ${escapeHtml(
                        creditExplanation
                    )}
                </p>


                <div class="client-cancellation-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        data-client-cancellation-close
                    >
                        Keep Service
                    </button>


                    <button
                        type="button"
                        class="client-cancellation-confirm"
                        data-client-cancellation-confirm="${Number(
                            visit.id
                        )}"
                    >
                        Confirm Cancellation
                    </button>

                </div>

            </div>
        `;


    document.body.appendChild(
        overlay
    );


    overlay.addEventListener(
        "click",
        async event => {


            // ========================================
            // CLICK OUTSIDE MODAL
            // ========================================

            if (
                event.target ===
                overlay
            ) {

                closeClientCancellationModal();

                return;

            }


            // ========================================
            // CLOSE / KEEP SERVICE
            // ========================================

            if (
                event.target.closest(
                    "[data-client-cancellation-close]"
                )
            ) {

                closeClientCancellationModal();

                return;

            }


            // ========================================
            // CONFIRM CANCELLATION
            // ========================================

            const confirmButton =
                event.target.closest(
                    "[data-client-cancellation-confirm]"
                );


            if (
                !confirmButton
            ) {
                return;
            }


            const visitId =
                Number(
                    confirmButton.dataset
                        .clientCancellationConfirm
                );


            if (
                !visitId
            ) {
                return;
            }


            const message =
                overlay.querySelector(
                    "#client-cancellation-message"
                );


            confirmButton.disabled =
                true;


            confirmButton.textContent =
                "Cancelling...";


            if (
                message
            ) {

                message.textContent =
                    "Processing your cancellation...";

            }


            try {

                // ========================================
                // SERVER-SIDE CANCELLATION
                // ========================================

                const {
                    data,
                    error
                } =
                    await supabaseClient.rpc(
                        "cancel_my_visit",
                        {
                            p_visit_id:
                                visitId
                        }
                    );


                if (
                    error
                ) {
                    throw error;
                }


                const result =
                    Array.isArray(
                        data
                    )
                        ? data[0]
                        : data;


                if (
                    !result
                ) {

                    throw new Error(
                        "Cancellation result was not returned."
                    );

                }


                const creditAmount =
                    Number(
                        result.credit_amount ||
                        0
                    );


                const creditPercent =
                    Number(
                        result.credit_percent ||
                        0
                    );


                const newCreditBalance =
                    Number(
                        result.new_credit_balance ||
                        0
                    );


                console.log(
                    "Service cancelled:",
                    {
                        visitId,
                        creditAmount,
                        creditPercent,
                        newCreditBalance
                    }
                );


                // ========================================
                // UPDATE LOCAL VISIT STATE
                // ========================================

                currentVisits =
                    currentVisits.map(
                        item => {

                            if (
                                Number(
                                    item.id
                                ) !==
                                visitId
                            ) {
                                return item;
                            }


                            return {
                                ...item,

                                status:
                                    "cancelled",

                                refund_status:
                                    "not_required",

                                cancellation_reason:
                                    creditPercent ===
                                        100
                                        ? "Client cancelled 24 or more hours before scheduled service"
                                        : "Client cancelled less than 24 hours before scheduled service"
                            };

                        }
                    );


                // ========================================
                // CLOSE MODAL
                // ========================================

                closeClientCancellationModal();


                // ========================================
                // REFRESH UPCOMING SERVICES
                // ========================================

                renderUpcomingCalendar();


                renderSelectedUpcomingServices();


                // ========================================
                // REFRESH ACCOUNT CREDIT
                // ========================================

                await renderAccountCredit();

            }
            catch (error) {

                console.error(
                    "Service cancellation error:",
                    error
                );


                if (
                    message
                ) {

                    message.textContent =
                        error?.message ||
                        "We couldn't cancel this service. Please try again.";

                }


                confirmButton.disabled =
                    false;


                confirmButton.textContent =
                    "Confirm Cancellation";

            }

        }
    );


    document.body.classList.add(
        "client-modal-open"
    );

}

// ========================================
// CLOSE CLIENT CANCELLATION MODAL
// ========================================

function closeClientCancellationModal() {

    document
        .getElementById(
            "client-cancellation-modal"
        )
        ?.remove();


    document.body.classList.remove(
        "client-modal-open"
    );

}


// ========================================
// CLIENT VISIT REPORT LIGHTBOX
// ========================================

function closeClientCancellationModal() {

    document
        .getElementById(
            "client-cancellation-modal"
        )
        ?.remove();


    document.body.classList.remove(
        "client-modal-open"
    );

}


// ========================================
// CLIENT VISIT REPORT LIGHTBOX
// ========================================
function openClientReportLightbox(
    imageUrl
) {


    if (
        !imageUrl
    ) {

        return;

    }


    closeClientReportLightbox();


    const lightbox =
        document.createElement(
            "div"
        );


    lightbox.className =
        "client-report-lightbox";


    lightbox.setAttribute(
        "role",
        "dialog"
    );


    lightbox.setAttribute(
        "aria-modal",
        "true"
    );


    lightbox.setAttribute(
        "aria-label",
        "Photo viewer"
    );


    lightbox.innerHTML =
        `

            <div class="client-report-lightbox-frame">


                <button
                    type="button"
                    class="client-report-lightbox-close"
                    aria-label="Close photo"
                    data-client-report-lightbox-close
                >
                    ×
                </button>


                <img
                    src="${escapeHtml(
                        imageUrl
                    )}"
                    alt="Visit photo preview"
                    class="client-report-lightbox-image"
                >


            </div>

        `;


    document.body.appendChild(
        lightbox
    );


    document.body.classList.add(
        "client-report-lightbox-open"
    );


    requestAnimationFrame(
        () => {

            lightbox.classList.add(
                "client-report-lightbox-visible"
            );

        }
    );


    const closeButton =
        lightbox.querySelector(
            "[data-client-report-lightbox-close]"
        );


    closeButton
        ?.addEventListener(
            "click",
            closeClientReportLightbox
        );


    lightbox.addEventListener(
        "click",
        event => {


            if (
                event.target ===
                lightbox
            ) {

                closeClientReportLightbox();

            }

        }
    );


    closeButton
        ?.focus();

}


// ========================================
// CLOSE CLIENT VISIT REPORT LIGHTBOX
// ========================================

function closeClientReportLightbox() {


    const lightbox =
        document.querySelector(
            ".client-report-lightbox"
        );


    if (
        !lightbox
    ) {

        document.body.classList.remove(
            "client-report-lightbox-open"
        );

        return;

    }


    lightbox.classList.remove(
        "client-report-lightbox-visible"
    );


    document.body.classList.remove(
        "client-report-lightbox-open"
    );


    window.setTimeout(
        () => {


            if (
                lightbox.isConnected
            ) {

                lightbox.remove();

            }


        },
        180
    );

}


// ========================================
// CLIENT VISIT REPORT LIGHTBOX KEYBOARD
// ========================================

document.addEventListener(
    "keydown",
    event => {


        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        const lightbox =
            document.querySelector(
                ".client-report-lightbox"
            );


        if (
            lightbox
        ) {

            closeClientReportLightbox();

        }

    }
);

// ========================================
// GET CLIENT VISIT REPORT MOUNT
// ========================================

function getClientVisitReportMount(
    visitId
) {


    const mobileMount =
        document.getElementById(
            `client-visit-report-${visitId}`
        );


    // ========================================
    // MOBILE / PWA
    // KEEP EXISTING SERVICE CARD REPORT
    // ========================================

    if (
        window.matchMedia(
            "(max-width: 700px)"
        ).matches
    ) {

        return mobileMount;

    }


    // ========================================
    // DESKTOP
    // USE FULL-WIDTH REPORT BELOW DASHBOARD GRID
    // ========================================

    const dashboardGrid =
        document.querySelector(
            ".client-dashboard-grid"
        );


    if (
        !dashboardGrid
    ) {

        return mobileMount;

    }


    let desktopMount =
        document.getElementById(
            "client-desktop-visit-report"
        );


    if (
        !desktopMount
    ) {

        desktopMount =
            document.createElement(
                "div"
            );


        desktopMount.id =
            "client-desktop-visit-report";


        desktopMount.className =
            "client-desktop-visit-report-mount";


        dashboardGrid.insertAdjacentElement(
            "afterend",
            desktopMount
        );

    }


    desktopMount.dataset.visitId =
        String(
            visitId
        );


    return desktopMount;

}

// ========================================
// TOGGLE CLIENT VISIT REPORT
// ========================================

async function toggleClientVisitReport(
    visitId,
    button
) {


    const mount =
        getClientVisitReportMount(
            visitId
        );


    if (
        !mount
    ) {

        return;

    }


    // ========================================
    // CLOSE CURRENT REPORT
    // ========================================

    if (
        activeClientVisitReportId ===
        visitId &&
        mount.innerHTML.trim()
    ) {


        mount.innerHTML =
            "";


        activeClientVisitReportId =
            null;


        button.textContent =
            "View Visit Report";


        return;

    }


    // ========================================
    // CLOSE ANY OTHER OPEN REPORT
    // ========================================

    closeOpenClientVisitReport();


    activeClientVisitReportId =
        visitId;


    button.textContent =
        "Hide Visit Report";


    mount.innerHTML =
        `

            <div class="client-visit-report-loading">

                Loading visit report...

            </div>

        `;


    try {


        // ========================================
        // LOAD VISIT REPORT
        // ========================================
        
        const {
            data: report,
            error: reportError
        } =
            await supabaseClient
                .from(
                    "visit_reports"
                )
                .select(
                    "id, visit_id, notes, fed, fresh_water, pee, poop, created_at, updated_at"
                )
                .eq(
                    "visit_id",
                    visitId
                )
                .maybeSingle();
        
        
        if (
            reportError
        ) {
        
            throw reportError;
        
        }
        
        
        // ========================================
        // REPORT NOT YET ADDED
        // ========================================
        
        if (
            !report
        ) {
        
        
            mount.innerHTML =
                `
        
                    <div class="client-visit-report-empty">
        
                        <strong>
                            Visit Report
                        </strong>
        
                        <p>
                            A visit report has not been added yet.
                        </p>
        
                    </div>
        
                `;
        
        
            return;
        
        }
        
        
        // ========================================
        // LOAD PET CARE + PHOTOS + WALK
        // ========================================
        
        const [
            petCareResult,
            mediaResult,
            walkResult
        ] =
            await Promise.all([
        
        
                supabaseClient
                    .from(
                        "visit_report_pet_care"
                    )
                    .select(
                        "visit_report_id, pet_id, fed, fresh_water, pee, poop, created_at, updated_at"
                    )
                    .eq(
                        "visit_report_id",
                        report.id
                    ),
        
        
                supabaseClient
                    .from(
                        "visit_photos"
                    )
                    .select(
                        "id, visit_id, storage_path, photo_type, caption, sort_order, created_at"
                    )
                    .eq(
                        "visit_id",
                        visitId
                    )
                    .order(
                        "sort_order",
                        {
                            ascending:
                                true
                        }
                    )
                    .order(
                        "created_at",
                        {
                            ascending:
                                true
                        }
                    ),
        
        
                supabaseClient
                    .from(
                        "visit_walks"
                    )
                    .select(
                        "id, visit_id, status, started_at, ended_at, duration_seconds, distance_meters"
                    )
                    .eq(
                        "visit_id",
                        visitId
                    )
                    .eq(
                        "status",
                        "completed"
                    )
                    .maybeSingle()
        
        
            ]);
        
        
        // ========================================
        // CHECK PET CARE ERROR
        // ========================================
        
        if (
            petCareResult.error
        ) {
        
            throw petCareResult.error;
        
        }
        
        
        // ========================================
        // CHECK MEDIA ERROR
        // ========================================
        
        if (
            mediaResult.error
        ) {
        
            throw mediaResult.error;
        
        }
        
        
        // ========================================
        // CHECK WALK ERROR
        // ========================================
        
        if (
            walkResult.error
        ) {
        
            throw walkResult.error;
        
        }
        
        
        const petCareRows =
            petCareResult.data ||
            [];
        
        
        const completedWalk =
            walkResult.data ||
            null;
        
        
        // ========================================
        // LOAD WALK POINTS
        // ========================================

        let walkPoints =
            [];


        if (
            completedWalk
        ) {


            const {
                data:
                    walkPointData,
                error:
                    walkPointError
            } =
                await supabaseClient
                    .from(
                        "visit_walk_points"
                    )
                    .select(
                        "sequence_number, latitude, longitude, recorded_at"
                    )
                    .eq(
                        "walk_id",
                        completedWalk.id
                    )
                    .order(
                        "sequence_number",
                        {
                            ascending:
                                true
                        }
                    );


            if (
                walkPointError
            ) {

                throw walkPointError;

            }


            walkPoints =
                walkPointData ||
                [];

        }


        // ========================================
        // CREATE SIGNED PHOTO URLS
        // ========================================

        const media =
            mediaResult.data ||
            [];


        const mediaWithUrls =
            await Promise.all(

                media.map(
                    async item => {


                        const {
                            data,
                            error
                        } =
                            await supabaseClient
                                .storage
                                .from(
                                    VISIT_MEDIA_BUCKET
                                )
                                .createSignedUrl(
                                    item.storage_path,
                                    3600
                                );


                        return {

                            ...item,

                            signed_url:
                                error

                                    ? null

                                    : data
                                        ?.signedUrl ||
                                      null

                        };

                    }
                )

            );


        // ========================================
        // RENDER VISIT REPORT
        // ========================================
        
        renderClientVisitReport(
            mount,
            report,
            petCareRows,
            mediaWithUrls,
            completedWalk,
            walkPoints
        );
        
        
        // ========================================
        // RENDER WALK ROUTE
        // ========================================

        if (
            completedWalk &&
            walkPoints.length >=
            2
        ) {

            renderClientGoogleWalkRoute(
                visitId,
                walkPoints
            );

        }


        // ========================================
        // DESKTOP REPORT POSITION
        // ========================================

        if (
            !window.matchMedia(
                "(max-width: 700px)"
            ).matches
        ) {


            mount.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "start"
            });

        }


    }
    catch (
        error
    ) {


        console.error(
            "Client visit report error:",
            error
        );


        mount.innerHTML =
            `

                <div class="client-visit-report-error">

                    We couldn't load this visit report.

                </div>

            `;

    }

}

// ========================================
// CLOSE OPEN CLIENT VISIT REPORT
// ========================================

function closeOpenClientVisitReport() {


    if (
        !activeClientVisitReportId
    ) {

        return;

    }


    const visitId =
        activeClientVisitReportId;


    // ========================================
    // CLEAR MOBILE / SERVICE CARD REPORT
    // ========================================

    const mobileMount =
        document.getElementById(
            `client-visit-report-${visitId}`
        );


    if (
        mobileMount
    ) {

        mobileMount.innerHTML =
            "";

    }


    // ========================================
    // CLEAR DESKTOP FULL-WIDTH REPORT
    // ========================================

    const desktopMount =
        document.getElementById(
            "client-desktop-visit-report"
        );


    if (
        desktopMount
    ) {

        desktopMount.innerHTML =
            "";


        delete desktopMount.dataset
            .visitId;

    }


    // ========================================
    // RESET REPORT BUTTON
    // ========================================

    const oldButton =
        document.querySelector(
            `[data-client-visit-report-open="${visitId}"]`
        );


    if (
        oldButton
    ) {

        oldButton.textContent =
            "View Visit Report";

    }


    activeClientVisitReportId =
        null;

}

// ========================================
// RENDER CLIENT VISIT REPORT
// ========================================

function renderClientVisitReport(
    mount,
    report,
    petCareRows,
    media,
    completedWalk,
    walkPoints
) {


    const visitPhotos =
        media.filter(
            item =>
                item.photo_type ===
                "visit"
        );


    // ========================================
    // VISIT
    // ========================================

    const reportVisit =
        currentVisits.find(
            visit =>
                Number(
                    visit.id
                ) ===
                Number(
                    report.visit_id
                )
        ) ||
        null;


    const visitPets =
        reportVisit

            ? getPetsForVisit(
                reportVisit
            )

            : [];


    // ========================================
    // WALK SERVICE CHECK
    // ========================================

    const serviceType =
        String(
            reportVisit?.service_type ||
            ""
        )
            .trim()
            .toLowerCase();


    const serviceName =
        String(
            reportVisit?.service_name ||
            ""
        )
            .trim()
            .toLowerCase();


    const walkingService =
        (
            serviceType ===
                "dog_walking" ||

            serviceType ===
                "dog walking" ||

            (
                !serviceType &&
                (
                    serviceName.startsWith(
                        "dog walking"
                    ) ||

                    serviceName ===
                        "dog walk"
                )
            )
        );


    // ========================================
    // CARE UPDATE CHIP
    // ========================================

    function buildCareChip(
        label
    ) {


        return `
            <span class="client-visit-report-care-item">

                <span class="client-visit-report-care-check">
                    ✓
                </span>

                ${escapeHtml(
                    label
                )}

            </span>
        `;

    }


    // ========================================
    // BUILD CARE ITEMS
    // ========================================

    function buildPetCareItems(
        care
    ) {


        const items =
            [];


        if (
            care?.fed
        ) {

            items.push(
                "Fed"
            );

        }


        if (
            care?.fresh_water
        ) {

            items.push(
                "Fresh Water"
            );

        }


        if (
            care?.pee
        ) {

            items.push(
                "Pee"
            );

        }


        if (
            care?.poop
        ) {

            items.push(
                "Poop"
            );

        }


        return items;

    }


    // ========================================
    // PER-PET CARE UPDATES
    // ========================================

    let careHtml =
        "";


    if (
        Array.isArray(
            petCareRows
        ) &&
        petCareRows.length >
        0
    ) {


        careHtml =
            petCareRows
                .map(
                    care => {


                        const pet =
                            visitPets.find(
                                item =>
                                    Number(
                                        item.id
                                    ) ===
                                    Number(
                                        care.pet_id
                                    )
                            ) ||
                            currentPets.find(
                                item =>
                                    Number(
                                        item.id
                                    ) ===
                                    Number(
                                        care.pet_id
                                    )
                            ) ||
                            null;


                        const petName =
                            pet?.name ||
                            "Pet";


                        const careItems =
                            buildPetCareItems(
                                care
                            );


                        const careItemsHtml =
                            careItems.length

                                ? careItems
                                    .map(
                                        buildCareChip
                                    )
                                    .join(
                                        ""
                                    )

                                : `
                                    <span class="client-visit-report-muted">
                                        No care updates were marked.
                                    </span>
                                `;


                        return `
                            <div class="client-visit-report-pet-care-card">

                                <div class="client-visit-report-pet-care-header">

                                    <strong>
                                        ${escapeHtml(
                                            petName
                                        )}
                                    </strong>

                                    <span>
                                        Care Updates
                                    </span>

                                </div>


                                <div class="client-visit-report-care-grid">

                                    ${careItemsHtml}

                                </div>

                            </div>
                        `;

                    }
                )
                .join(
                    ""
                );

    } else {


        // ========================================
        // LEGACY REPORT FALLBACK
        // ========================================

        const legacyCareItems =
            buildPetCareItems(
                report
            );


        const legacyPetName =
            visitPets.length ===
            1

                ? visitPets[0].name

                : "Visit";


        const legacyCareItemsHtml =
            legacyCareItems.length

                ? legacyCareItems
                    .map(
                        buildCareChip
                    )
                    .join(
                        ""
                    )

                : `
                    <span class="client-visit-report-muted">
                        No care updates were marked.
                    </span>
                `;


        careHtml =
            `
                <div class="client-visit-report-pet-care-card">

                    <div class="client-visit-report-pet-care-header">

                        <strong>
                            ${escapeHtml(
                                legacyPetName
                            )}
                        </strong>

                        <span>
                            Care Updates
                        </span>

                    </div>


                    <div class="client-visit-report-care-grid">

                        ${legacyCareItemsHtml}

                    </div>

                </div>
            `;

    }


    // ========================================
    // VISIT PHOTOS
    // ========================================

    const photosHtml =
        visitPhotos.length

            ? visitPhotos
                .map(
                    photo => {


                        if (
                            !photo.signed_url
                        ) {

                            return "";

                        }


                        return `

                            <button
                                type="button"
                                class="client-visit-report-photo-button"
                                data-client-report-image="${escapeHtml(
                                    photo.signed_url
                                )}"
                            >

                                <img
                                    src="${escapeHtml(
                                        photo.signed_url
                                    )}"
                                    alt="Visit photo"
                                    class="client-visit-report-photo"
                                >

                            </button>

                        `;

                    }
                )
                .join(
                    ""
                )

            : `

                <p class="client-visit-report-muted">
                    No visit photos were added.
                </p>

            `;


    // ========================================
    // NOTES
    // ========================================

    const notesHtml =
        report.notes

            ? `

                <p class="client-visit-report-notes">
                    ${formatMultilineText(
                        report.notes
                    )}
                </p>

            `

            : `

                <p class="client-visit-report-muted">
                    No additional notes were added.
                </p>

            `;


    // ========================================
    // WALK SUMMARY
    // ========================================

    let walkSummaryHtml =
        "";


    if (
        walkingService
    ) {


        walkSummaryHtml =
            `

                <div class="client-walk-summary-empty">

                    No walk was recorded for this visit.

                </div>

            `;


        if (
            completedWalk
        ) {


            const duration =
                formatClientWalkDuration(
                    completedWalk.duration_seconds
                );


            const distanceMiles =
                (
                    Number(
                        completedWalk.distance_meters ||
                        0
                    ) /
                    1609.344
                ).toFixed(
                    2
                );


            const startedAt =
                formatClientVisitTimestamp(
                    completedWalk.started_at
                );


            const finishedAt =
                formatClientVisitTimestamp(
                    completedWalk.ended_at
                );


            const hasRoute =
                Array.isArray(
                    walkPoints
                ) &&
                walkPoints.length >=
                2;


            walkSummaryHtml =
                `

                    <div class="client-walk-summary-card">


                        <div class="client-walk-summary-heading">

                            <div>

                                <strong>
                                    Walk Summary
                                </strong>

                                <span>
                                    Automatically recorded by Paws in Stride.
                                </span>

                            </div>

                        </div>


                        <div class="client-walk-summary-stats">


                            <div class="client-walk-summary-stat">

                                <span class="client-walk-summary-stat-label">
                                    Walk Time
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        duration
                                    )}
                                </strong>

                            </div>


                            <div class="client-walk-summary-stat">

                                <span class="client-walk-summary-stat-label">
                                    Distance
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        distanceMiles
                                    )} mi
                                </strong>

                            </div>


                            <div class="client-walk-summary-stat">

                                <span class="client-walk-summary-stat-label">
                                    Started
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        startedAt ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <div class="client-walk-summary-stat">

                                <span class="client-walk-summary-stat-label">
                                    Finished
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        finishedAt ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                        </div>


                        ${
                            hasRoute

                                ? `

                                    <div
                                        id="client-walk-route-map-${report.visit_id}"
                                        class="client-walk-route-map"
                                        aria-label="Recorded dog walk route"
                                    ></div>

                                `

                                : `

                                    <div class="client-walk-route-empty">

                                        Route map unavailable for this walk.

                                    </div>

                                `
                        }


                        <div class="client-walk-summary-branding">

                            🐾 Recorded by Paws in Stride

                        </div>


                    </div>

                `;

        }

    }


    // ========================================
    // REPORT PET TITLE
    // ========================================

    const visitPetNames =
        visitPets
            .map(
                pet =>
                    String(
                        pet.name ||
                        ""
                    ).trim()
            )
            .filter(
                Boolean
            );


    let visitPetTitle =
        "Your Pet's Visit";


    if (
        visitPetNames.length ===
        1
    ) {


        visitPetTitle =
            `${visitPetNames[0]}'s Visit`;

    }


    if (
        visitPetNames.length >
        1
    ) {


        const finalPetName =
            visitPetNames[
                visitPetNames.length -
                1
            ];


        const leadingPetNames =
            visitPetNames.slice(
                0,
                -1
            );


        const combinedPetNames =
            leadingPetNames.length ===
            1

                ? `${leadingPetNames[0]} & ${finalPetName}`

                : `${leadingPetNames.join(
                    ", "
                )} & ${finalPetName}`;


        visitPetTitle =
            `${combinedPetNames}'s Visit`;

    }


    // ========================================
    // PHOTOS SECTION
    // ========================================

    const photosSectionHtml =
        `

            <div
                class="client-visit-report-section client-visit-report-photos-section"
            >

                <span class="client-visit-report-label">
                    Photos
                </span>


                <div class="client-visit-report-photo-grid">

                    ${photosHtml}

                </div>

            </div>

        `;


    // ========================================
    // RENDER REPORT
    // ========================================

    mount.innerHTML =
        `

            <div
                class="client-visit-report ${
                    walkingService
                        ? "client-visit-report-walk"
                        : "client-visit-report-nonwalk"
                }"
            >


                <div class="client-visit-report-header">

                    <div>

                        <span class="client-visit-report-eyebrow">
                            VISIT REPORT
                        </span>

                        <h5>
                            ${escapeHtml(
                                visitPetTitle
                            )}
                        </h5>

                        <p>
                            Here's everything from this completed visit.
                        </p>

                    </div>

                </div>


                <div class="client-visit-report-content">


                    <div class="client-visit-report-main">


                        <div class="client-visit-report-section">

                            <span class="client-visit-report-label">
                                Care Updates
                            </span>


                            <div class="client-visit-report-pet-care-list">

                                ${careHtml}

                            </div>

                        </div>


                        <div class="client-visit-report-section">

                            <span class="client-visit-report-label">
                                Notes
                            </span>

                            ${notesHtml}

                        </div>


                        ${
                            walkingService
                                ? photosSectionHtml
                                : ""
                        }


                    </div>


                    <div class="client-visit-report-side">


                        ${
                            walkingService

                                ? `

                                    <div class="client-visit-report-section">

                                        ${walkSummaryHtml}

                                    </div>

                                `

                                : photosSectionHtml
                        }


                    </div>


                </div>


            </div>

        `;

}

// ========================================
// CLIENT WALK DURATION
// ========================================

function formatClientWalkDuration(
    durationSeconds
) {


    const totalSeconds =
        Math.max(
            0,
            Math.round(
                Number(
                    durationSeconds ||
                    0
                )
            )
        );


    const hours =
        Math.floor(
            totalSeconds /
            3600
        );


    const minutes =
        Math.floor(
            (
                totalSeconds %
                3600
            ) /
            60
        );


    const seconds =
        totalSeconds %
        60;


    return [
        hours,
        minutes,
        seconds
    ]
        .map(
            value =>
                String(
                    value
                ).padStart(
                    2,
                    "0"
                )
        )
        .join(
            ":"
        );

}


// ========================================
// RENDER CLIENT WALK ROUTE MAP
// ========================================

function renderClientGoogleWalkRoute(
    visitId,
    walkPoints
) {


    const mapElement =
        document.getElementById(
            `client-walk-route-map-${visitId}`
        );


    if (
        !mapElement
    ) {

        return;

    }


    if (
        !Array.isArray(
            walkPoints
        ) ||
        walkPoints.length <
        2
    ) {


        mapElement.innerHTML =
            `

                <div class="client-walk-route-empty">
                    Route map unavailable.
                </div>

            `;


        return;

    }


    if (
        !window.google?.maps
    ) {


        mapElement.innerHTML =
            `

                <div class="client-walk-route-empty">
                    Route map couldn't be loaded.
                </div>

            `;


        return;

    }


    const path =
        walkPoints
            .map(
                point => ({
                    lat:
                        Number(
                            point.latitude
                        ),

                    lng:
                        Number(
                            point.longitude
                        )
                })
            )
            .filter(
                point =>
                    Number.isFinite(
                        point.lat
                    ) &&
                    Number.isFinite(
                        point.lng
                    )
            );


    if (
        path.length <
        2
    ) {


        mapElement.innerHTML =
            `

                <div class="client-walk-route-empty">
                    Route map unavailable.
                </div>

            `;


        return;

    }


    const map =
        new google.maps.Map(
            mapElement,
            {

                center:
                    path[0],

                zoom:
                    16,

                mapTypeControl:
                    false,

                streetViewControl:
                    false,

                fullscreenControl:
                    true

            }
        );


    const routeLine =
        new google.maps.Polyline({

            path,

            geodesic:
                true,

            strokeColor:
                "#2890df",

            strokeOpacity:
                1,

            strokeWeight:
                5

        });


    routeLine.setMap(
        map
    );


    // ========================================
    // START MARKER
    // ========================================

    new google.maps.Marker({

        position:
            path[0],

        map,

        icon: {

            path:
                google.maps.SymbolPath.CIRCLE,

            scale:
                14,

            fillColor:
                "#22a447",

            fillOpacity:
                1,

            strokeColor:
                "#ffffff",

            strokeWeight:
                2

        },

        label: {

            text:
                "S",

            color:
                "#ffffff",

            fontWeight:
                "700"

        },

        title:
            "Walk started"

    });


    // ========================================
    // FINISH MARKER
    // ========================================

    new google.maps.Marker({

        position:
            path[
                path.length -
                1
            ],

        map,

        icon: {

            path:
                google.maps.SymbolPath.CIRCLE,

            scale:
                14,

            fillColor:
                "#dc3545",

            fillOpacity:
                1,

            strokeColor:
                "#ffffff",

            strokeWeight:
                2

        },

        label: {

            text:
                "F",

            color:
                "#ffffff",

            fontWeight:
                "700"

        },

        title:
            "Walk finished"

    });


    // ========================================
    // FIT ENTIRE ROUTE
    // ========================================

    const bounds =
        new google.maps.LatLngBounds();


    path.forEach(
        point => {

            bounds.extend(
                point
            );

        }
    );


    map.fitBounds(
        bounds
    );

}

// ========================================
// CLIENT VISIT DURATION
// ========================================

function getClientVisitDurationMinutes(
    visit
) {

    if (
        !visit.checked_in_at ||
        !visit.completed_at
    ) {

        return null;

    }


    const start =
        new Date(
            visit.checked_in_at
        );


    const end =
        new Date(
            visit.completed_at
        );


    const difference =
        end.getTime() -
        start.getTime();


    if (
        !Number.isFinite(
            difference
        ) ||
        difference <
        0
    ) {

        return null;

    }


    return Math.max(
        0,
        Math.round(
            difference /
            60000
        )
    );

}

// ========================================
// CLIENT VISIT TIME
// ========================================

function formatClientVisitTimestamp(
    timestamp
) {

    if (!timestamp) {

        return "";

    }


    const date =
        new Date(
            timestamp
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleTimeString(
        "en-US",
        {
            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}

// ========================================
// BOARDING DATE HELPERS
// ========================================

function getBoardingNightDates(
    startDate,
    endDate
) {

    const dates =
        [];


    const current =
        parseLocalDate(
            startDate
        );


    const end =
        parseLocalDate(
            endDate
        );


    while (
        current < end
    ) {

        dates.push(
            makeDateString(
                current.getFullYear(),
                current.getMonth(),
                current.getDate()
            )
        );


        current.setDate(
            current.getDate() +
            1
        );

    }


    return dates;

}


function addDaysToDateString(
    dateString,
    days
) {

    const date =
        parseLocalDate(
            dateString
        );


    date.setDate(
        date.getDate() +
        days
    );


    return makeDateString(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


// ========================================
// HELPERS
// ========================================

function valueOrNull(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return null;
    }


    const value =
        element.value.trim();


    return value ||
        null;

}


function setMultilineDisplay(
    id,
    value,
    fallback
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.innerHTML =
        value
            ? formatMultilineText(
                value
            )
            : escapeHtml(
                fallback
            );

}


function getInitials(
    name
) {

    const words =
        String(
            name || ""
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        words.length === 0
    ) {

        return "?";

    }


    if (
        words.length === 1
    ) {

        return words[0]
            .slice(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[
            words.length - 1
        ][0]
    ).toUpperCase();

}


function getFileExtensionForMime(
    mime
) {

    switch (
        mime
    ) {

        case "image/jpeg":
            return "jpg";

        case "image/png":
            return "png";

        case "image/webp":
            return "webp";

        default:
            throw new Error(
                "Unsupported file type."
            );

    }

}


function parseLocalDate(
    dateString
) {

    const [
        year,
        month,
        day
    ] =
        dateString
            .split("-")
            .map(Number);


    return new Date(
        year,
        month - 1,
        day
    );

}


function makeDateString(
    year,
    month,
    day
) {

    return `${year}-${String(
        month + 1
    ).padStart(2, "0")}-${String(
        day
    ).padStart(2, "0")}`;

}


function getLocalDateString() {

    const date =
        new Date();


    return makeDateString(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


function formatDate(
    dateString
) {

    return parseLocalDate(
        dateString
    )
        .toLocaleDateString(
            "en-US",
            {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

}


function formatLongDate(
    dateString
) {

    return parseLocalDate(
        dateString
    )
        .toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );

}


function formatPetBirthday(
    dateString
) {

    return parseLocalDate(
        dateString
    )
        .toLocaleDateString(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );

}


function formatStatus(
    status
) {

    if (!status) {
        return "";
    }


    return status
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function formatMultilineText(
    value
) {

    return escapeHtml(
        value
    ).replaceAll(
        "\n",
        "<br>"
    );

}


// ========================================
// PREVIEW CLEANUP
// ========================================

function clearPetPhotoPreviewUrl() {

    if (
        petPhotoPreviewObjectUrl
    ) {

        URL.revokeObjectURL(
            petPhotoPreviewObjectUrl
        );


        petPhotoPreviewObjectUrl =
            null;

    }

}


function clearClientPhotoPreviewUrl() {

    if (
        clientPhotoPreviewObjectUrl
    ) {

        URL.revokeObjectURL(
            clientPhotoPreviewObjectUrl
        );


        clientPhotoPreviewObjectUrl =
            null;

    }

}

// ========================================
// MOBILE PORTAL INTRO
// ========================================

function startMobilePortalIntro() {

    const intro =
        document.getElementById("mobile-portal-intro");

    const video =
        document.getElementById("mobile-portal-intro-video");

    const inactiveIntro = {
        dashboardFinished() {}
    };

    if (!intro || !video) {
        return inactiveIntro;
    }

    const isMobile =
        window.matchMedia("(max-width: 700px)").matches;

    const isInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    if ((!isMobile && !isInstalled) || reducedMotion) {
        intro.remove();
        return inactiveIntro;
    }

    let dismissed = false;
    let dashboardFinished = false;
    let videoFinished = false;
    let safetyTimer;

    function dismissIntro() {

        if (dismissed) {
            return;
        }

        dismissed = true;

        window.clearTimeout(safetyTimer);

        document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        window.removeEventListener(
            "pagehide",
            dismissIntro
        );

        document.body.classList.remove(
            "portal-intro-open"
        );

        intro.classList.add("is-leaving");

        window.setTimeout(() => {

            video.pause();
            intro.remove();

        }, 400);

    }

    function finishWhenReady() {

        if (dashboardFinished && videoFinished) {
            dismissIntro();
        }

    }

    function handleVisibilityChange() {

        if (document.hidden) {
            dismissIntro();
        }

    }

    video.addEventListener(
        "ended",
        () => {

            videoFinished = true;
            finishWhenReady();

        },
        { once: true }
    );

    video.addEventListener(
        "error",
        dismissIntro,
        { once: true }
    );

    video.querySelector("source")
        ?.addEventListener(
            "error",
            dismissIntro,
            { once: true }
        );

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    window.addEventListener(
        "pagehide",
        dismissIntro,
        { once: true }
    );

    safetyTimer =
        window.setTimeout(dismissIntro, 15000);

    video.muted = true;
    video.defaultMuted = true;

    intro.classList.add("is-active");

    document.body.classList.add(
        "portal-intro-open"
    );

    try {

        const playback =
            video.play();

        if (playback && typeof playback.catch === "function") {
            playback.catch(dismissIntro);
        }

    } catch (error) {

        dismissIntro();

    }

    return {

        dashboardFinished(success) {

            dashboardFinished = true;

            if (!success) {
                dismissIntro();
                return;
            }

            finishWhenReady();

        }

    };

}


// ========================================
// RESTORE SAVED BOOKING DRAFT
// ========================================

async function restoreSavedBookingDraft(
    {
        allowBackNavigation = false
    } = {}
) {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const editBookingRequested =
        params.get(
            "editBooking"
        ) ===
        "1";


    // ========================================
    // ONLY RESTORE WHEN RETURNING
    // FROM CHECKOUT
    // ========================================

    if (
        !editBookingRequested &&
        !allowBackNavigation
    ) {

        return false;

    }


    // ========================================
    // LOAD SAVED DRAFT
    // ========================================

    let rawDraft =
        null;


    try {

        rawDraft =
            window.sessionStorage
                .getItem(
                    "paws-in-stride-booking-draft"
                );

    }
    catch (
        error
    ) {

        console.warn(
            "Booking draft storage unavailable:",
            error
        );


        return false;

    }


    if (!rawDraft) {

        return false;

    }


    let draft =
        null;


    try {

        draft =
            JSON.parse(
                rawDraft
            );

    }
    catch (
        error
    ) {

        console.warn(
            "Saved booking draft is invalid:",
            error
        );


        return false;

    }


    if (
        !draft ||
        typeof draft !==
            "object" ||
        !draft.serviceType
    ) {

        return false;

    }


    try {

        // ========================================
        // MAKE SURE PRICING IS AVAILABLE
        // ========================================

        if (
            currentServicePrices
                .length ===
            0
        ) {

            await loadMyServicePrices();

        }


        // ========================================
        // OPEN SERVICES SCREEN
        // ========================================

        if (
            mobileAppNavigationQuery.matches
        ) {

            closeClientMessaging();


            setMobileAppScreen(
                "services"
            );


            setActiveMobileAppTab(
                "services"
            );

        }


        bookingSection.style.display =
            "block";


        // ========================================
        // RESTORE PRIMARY PET
        // ========================================

        if (
            bookingPetSelect
        ) {

            bookingPetSelect.value =
                draft.primaryPetId
                    ? String(
                        draft.primaryPetId
                    )
                    : "";

        }


        renderAdditionalPets();


        // ========================================
        // RESTORE ADDITIONAL PETS
        // ========================================

        const additionalPetIds =
            new Set(
                Array.isArray(
                    draft.additionalPetIds
                )
                    ? draft.additionalPetIds
                        .map(
                            petId =>
                                Number(
                                    petId
                                )
                        )
                    : []
            );


        document
            .querySelectorAll(
                ".additional-pet-checkbox"
            )
            .forEach(
                checkbox => {

                    checkbox.checked =
                        additionalPetIds.has(
                            Number(
                                checkbox.value
                            )
                        );

                }
            );


        updateAdditionalPetsHelp();


        // ========================================
        // RESTORE SERVICE TYPE
        // ========================================

        serviceTypeSelect.value =
            draft.serviceType ||
            "";


        handleServiceTypeChange();


        // ========================================
        // RESTORE SERVICE OPTION
        // ========================================

        serviceOptionSelect.value =
            draft.serviceOption ||
            "";


        const timeWindows =
            Array.isArray(
                draft.timeWindows
            )
                ? draft.timeWindows
                    .filter(
                        Boolean
                    )
                : [];


        // ========================================
        // WALKING / DROP-IN TIMES
        // ========================================

        if (
            draft.serviceType ===
                "Dog Walking" ||
            draft.serviceType ===
                "Drop-In Visit"
        ) {

            await populatePreferredTimeWindows();


            document
                .querySelectorAll(
                    ".booking-time-row-additional"
                )
                .forEach(
                    row => {

                        row.remove();

                    }
                );


            populateBookingTimeSelect(
                bookingTime,
                timeWindows[0] ||
                    ""
            );


            bookingTime.dataset.previousValue =
                bookingTime.value ||
                "";


            timeWindows
                .slice(1)
                .forEach(
                    timeWindow => {

                        createAdditionalBookingTimeRow(
                            timeWindow
                        );

                    }
                );


            syncBookingTimeWindowControls();

        }


        // ========================================
        // PET SITTING TIME
        // ========================================

        if (
            draft.serviceType ===
            "Pet Sitting"
        ) {

            populatePetSittingTimeBlocks();


            bookingTime.value =
                timeWindows[0] ||
                "";


            bookingTime.dataset.previousValue =
                bookingTime.value ||
                "";

        }


        // ========================================
        // RESTORE EXACT VISITS
        // ========================================

        selectedVisits =
            Array.isArray(
                draft.selectedVisits
            )
                ? draft.selectedVisits
                    .filter(
                        visit =>
                            visit &&
                            visit.date &&
                            visit.timeWindow
                    )
                    .map(
                        visit => ({

                            date:
                                visit.date,

                            timeWindow:
                                visit.timeWindow

                        })
                    )
                : [];


        // ========================================
        // RESTORE SELECTED DATES
        // ========================================

        selectedDates =
            Array.isArray(
                draft.selectedDates
            )
                ? [
                    ...new Set(
                        draft.selectedDates
                            .filter(
                                Boolean
                            )
                    )
                ].sort()
                : [];


        if (
            selectedDates.length ===
                0 &&
            selectedVisits.length >
                0
        ) {

            rebuildSelectedDatesFromVisits();

        }


        sortSelectedBookingVisits();


        // ========================================
        // RESTORE CALENDAR MONTH
        // ========================================

        if (
            Number.isInteger(
                draft.calendarYear
            )
        ) {

            calendarYear =
                draft.calendarYear;

        }


        if (
            Number.isInteger(
                draft.calendarMonth
            )
        ) {

            calendarMonth =
                draft.calendarMonth;

        }


        // ========================================
        // REBUILD ADDITIONAL PET DISPLAY
        // ========================================

        renderAdditionalPets();


        // ========================================
        // REFRESH BOOKING UI
        // ========================================

        renderSelectedDates();

        renderBookingCalendar();

        updateBookingTotal();


        if (
            draft.serviceType ===
                "Dog Walking" ||
            draft.serviceType ===
                "Drop-In Visit"
        ) {

            await refreshPreferredTimeWindowAvailability();

        }


        // ========================================
        // CLEAR BOOKING MESSAGE
        // ========================================

        const message =
            document.getElementById(
                "booking-message"
            );


        if (message) {

            message.textContent =
                "";

        }


        // ========================================
        // DRAFT SUCCESSFULLY RESTORED
        // ========================================

        window.sessionStorage
            .removeItem(
                "paws-in-stride-booking-draft"
            );


        // ========================================
        // CLEAN EDIT FLAG FROM URL
        // ========================================

        if (
            editBookingRequested
        ) {

            const cleanUrl =
                new URL(
                    window.location.href
                );


            cleanUrl.searchParams.delete(
                "editBooking"
            );


            window.history.replaceState(
                {},
                "",
                cleanUrl.pathname +
                    cleanUrl.search +
                    cleanUrl.hash
            );

        }


        // ========================================
        // POSITION RESTORED FORM
        // ========================================

        window.requestAnimationFrame(
            () => {

                window.requestAnimationFrame(
                    () => {

                        bookingSection
                            ?.scrollIntoView({
                                behavior:
                                    "auto",

                                block:
                                    "start"
                            });

                    }
                );

            }
        );


        return true;

    }
    catch (
        error
    ) {

        console.error(
            "Booking draft restoration failed:",
            error
        );


        return false;

    }

}


// ========================================
// SAFARI / IOS BACK SWIPE RESTORE
// ========================================

window.addEventListener(
    "pageshow",
    event => {

        if (
            !event.persisted
        ) {

            return;

        }


        window.setTimeout(
            () => {

                restoreSavedBookingDraft({
                    allowBackNavigation:
                        true
                });

            },
            0
        );

    }
);


// ========================================
// LOAD
// ========================================

(async function initializeClientPortal() {

    const portalIntro =
        startMobilePortalIntro();


    let dashboardReady =
        false;


    try {

        await loadDashboard();


        const dashboardContent =
            document.getElementById(
                "dashboard-content"
            );


        dashboardReady =
            dashboardContent
                ?.style
                .display ===
            "block";


        // ========================================
        // RESTORE CHECKOUT EDIT DRAFT
        // ========================================

        if (
            dashboardReady
        ) {

            await restoreSavedBookingDraft();

        }

    }
    catch (
        error
    ) {

        console.error(
            "Client dashboard initialization failed:",
            error
        );


        const loading =
            document.getElementById(
                "loading"
            );


        if (loading) {

            loading.textContent =
                "We couldn't load your portal. Please refresh to try again.";

        }

    }
    finally {

        portalIntro.dashboardFinished(
            dashboardReady
        );

    }


    if (
        dashboardReady &&
        currentUser &&
        currentProfile &&
        String(
            currentProfile.role ||
            ""
        )
            .trim()
            .toLowerCase() !==
            "admin"
    ) {
    
        // ========================================
        // LOAD CURRENT LIVE WALK STATE
        // ========================================
    
        await refreshClientLiveWalks();
    
        // ========================================
        // CLIENT REALTIME VISITS + WALKS
        // ========================================
        
        subscribeToClientVisitRealtime();
        
        subscribeToClientWalkRealtime();
        
        
        // ========================================
        // START LIVE WALK TIMER
        // ========================================
        
        startClientLiveWalkTimer();
        
        
        // ========================================
        // RENDER LIVE WALK STATE
        // ========================================
        
        renderSelectedUpcomingServices();
        
        await renderMobileHomeDashboard();
    
    
        try {
    
            await initializeClientMessaging();
    
        }
        catch (
            error
        ) {
    
            console.error(
                "Client messaging initialization failed:",
                error
            );
    
        }
    
    }

})();

// ========================================
// LOGOUT
// ========================================

async function logoutClient() {

    try {

        // ========================================
        // SIGN OUT
        // ========================================

        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            throw error;

        }


        // ========================================
        // CLEAR LOCAL CLIENT STATE
        // ========================================

        currentUser =
            null;

        currentProfile =
            null;

        currentHousehold =
            null;

        currentPropertyAccess =
            null;

        currentPets =
            [];

        currentVisits =
            [];

        currentVisitPets =
            [];


        // ========================================
        // RETURN TO LOGIN
        // ========================================

        window.location.replace(
            "./login.html"
        );

    }
    catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


// ========================================
// ORIGINAL / HIDDEN LOGOUT BUTTON
// ========================================

document
    .getElementById(
        "logout-button"
    )
    ?.addEventListener(
        "click",
        logoutClient
    );


// ========================================
// HEADER LOGOUT BUTTON
// ========================================

document
    .querySelector(
        ".client-header-logout-button"
    )
    ?.addEventListener(
        "click",
        logoutClient
    );

// ========================================
// CLIENT MESSAGING
// ========================================

let clientConversation =
    null;

let clientMessages =
    [];

let clientMessageChannel =
    null;

let clientMessagingInitialized =
    false;


// ========================================
// INITIALIZE CLIENT MESSAGING
// ========================================

async function initializeClientMessaging() {

    if (
        clientMessagingInitialized ||
        !currentUser
    ) {
        return;
    }


    clientMessagingInitialized =
        true;


    setupClientMessageEvents();


    try {

        await getOrCreateClientConversation();

        await loadClientMessages();

        subscribeToClientMessages();

    } catch (error) {

        console.error(
            "Client messaging initialization error:",
            error
        );


        showClientMessageError(
            "Messages are temporarily unavailable."
        );

    }

}


// ========================================
// GET OR CREATE CONVERSATION
// ========================================

async function getOrCreateClientConversation() {

    const {
        data: existingConversation,
        error: conversationError
    } =
        await supabaseClient
            .from("conversations")
            .select("*")
            .eq(
                "client_id",
                currentUser.id
            )
            .maybeSingle();


    if (conversationError) {

        throw conversationError;

    }


    if (existingConversation) {

        clientConversation =
            existingConversation;

        return;

    }


    const {
        data: newConversation,
        error: createError
    } =
        await supabaseClient
            .from("conversations")
            .insert({
                client_id:
                    currentUser.id
            })
            .select()
            .single();


    if (createError) {

        /*
         * A second browser/tab could theoretically
         * create the conversation at the same time.
         * Because client_id is unique, simply fetch
         * the conversation again if that happens.
         */

        const {
            data: retryConversation,
            error: retryError
        } =
            await supabaseClient
                .from("conversations")
                .select("*")
                .eq(
                    "client_id",
                    currentUser.id
                )
                .maybeSingle();


        if (
            retryError ||
            !retryConversation
        ) {

            throw createError;

        }


        clientConversation =
            retryConversation;

        return;

    }


    clientConversation =
        newConversation;

}


// ========================================
// LOAD CLIENT MESSAGES
// ========================================

async function loadClientMessages() {

    if (!clientConversation) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("messages")
            .select(
                `
                id,
                conversation_id,
                sender_id,
                body,
                read_at,
                created_at
                `
            )
            .eq(
                "conversation_id",
                clientConversation.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        throw error;

    }


    clientMessages =
        data || [];


    renderClientMessages();

    updateClientMessageUnreadBadge();

}


// ========================================
// CLIENT MESSAGE EVENTS
// ========================================

function setupClientMessageEvents() {

    const launcher =
        document.getElementById(
            "client-message-launcher"
        );

    const closeButton =
        document.getElementById(
            "client-message-close"
        );

    const backdrop =
        document.getElementById(
            "client-message-backdrop"
        );

    const form =
        document.getElementById(
            "client-message-form"
        );

    const input =
        document.getElementById(
            "client-message-input"
        );


    launcher
        ?.addEventListener(
            "click",
            openClientMessaging
        );


    closeButton
        ?.addEventListener(
            "click",
            closeClientMessaging
        );


    backdrop
        ?.addEventListener(
            "click",
            closeClientMessaging
        );


    form
        ?.addEventListener(
            "submit",
            sendClientMessage
        );


    input
        ?.addEventListener(
            "input",
            autoResizeClientMessageInput
        );


    input
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                        "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    form?.requestSubmit();

                }

            }
        );


    document
        .addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeClientMessaging();

                }

            }
        );

}


// ========================================
// OPEN CLIENT MESSAGING
// ========================================

async function openClientMessaging() {

    const drawer =
        document.getElementById(
            "client-message-drawer"
        );

    const launcher =
        document.getElementById(
            "client-message-launcher"
        );

    const backdrop =
        document.getElementById(
            "client-message-backdrop"
        );

    const input =
        document.getElementById(
            "client-message-input"
        );


    drawer
        ?.classList
        .add(
            "is-open"
        );


    backdrop
        ?.classList
        .add(
            "is-open"
        );


    launcher
        ?.setAttribute(
            "aria-expanded",
            "true"
        );


    drawer
        ?.setAttribute(
            "aria-hidden",
            "false"
        );


    document.body.classList.add(
        "client-messaging-open"
    );


    scrollClientMessagesToBottom();


    await markClientMessagesRead();


    window.setTimeout(
        () => {

            input?.focus();

        },
        180
    );

}


// ========================================
// CLOSE CLIENT MESSAGING
// ========================================

function closeClientMessaging() {

    const drawer =
        document.getElementById(
            "client-message-drawer"
        );

    const launcher =
        document.getElementById(
            "client-message-launcher"
        );

    const backdrop =
        document.getElementById(
            "client-message-backdrop"
        );


    drawer
        ?.classList
        .remove(
            "is-open"
        );


    backdrop
        ?.classList
        .remove(
            "is-open"
        );


    launcher
        ?.setAttribute(
            "aria-expanded",
            "false"
        );


    drawer
        ?.setAttribute(
            "aria-hidden",
            "true"
        );


    document.body.classList.remove(
        "client-messaging-open"
    );

}


// ========================================
// SEND CLIENT MESSAGE
// ========================================

async function sendClientMessage(
    event
) {

    event.preventDefault();


    if (
        !currentUser ||
        !clientConversation
    ) {
        return;
    }


    const input =
        document.getElementById(
            "client-message-input"
        );

    const sendButton =
        document.getElementById(
            "client-message-send"
        );


    const body =
        input?.value
            ?.trim();


    if (!body) {
        return;
    }


    if (
        body.length >
        5000
    ) {

        showClientMessageError(
            "Messages cannot be longer than 5,000 characters."
        );

        return;

    }


    clearClientMessageError();


    if (sendButton) {
        sendButton.disabled =
            true;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("messages")
                .insert({
                    conversation_id:
                        clientConversation.id,

                    sender_id:
                        currentUser.id,

                    body
                })
                .select(
                    `
                    id,
                    conversation_id,
                    sender_id,
                    body,
                    read_at,
                    created_at
                    `
                )
                .single();


        if (error) {

            throw error;

        }


        addClientMessageIfMissing(
            data
        );


        if (input) {

            input.value =
                "";

            input.style.height =
                "";

            input.focus();

        }


        renderClientMessages();

        scrollClientMessagesToBottom();

    } catch (error) {

        console.error(
            "Send client message error:",
            error
        );


        showClientMessageError(
            "We couldn't send your message. Please try again."
        );

    } finally {

        if (sendButton) {

            sendButton.disabled =
                false;

        }

    }

}


// ========================================
// RENDER CLIENT MESSAGES
// ========================================

function renderClientMessages() {

    const list =
        document.getElementById(
            "client-message-list"
        );


    if (!list) {
        return;
    }


    list.innerHTML =
        "";


    if (
        clientMessages.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "client-message-empty";


        empty.textContent =
            "No messages yet. Send us a message anytime you have a question or something we should know.";


        list.appendChild(
            empty
        );


        return;

    }


    clientMessages
        .forEach(
            message => {

                const isClient =
                    message.sender_id ===
                    currentUser.id;


                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    `client-message-row ${
                        isClient
                            ? "is-client"
                            : "is-business"
                    }`;


                row.dataset.messageId =
                    message.id;


                const sender =
                    document.createElement(
                        "div"
                    );


                sender.className =
                    "client-message-sender";


                sender.textContent =
                    isClient
                        ? "You"
                        : "Paws in Stride";


                const bubble =
                    document.createElement(
                        "div"
                    );


                bubble.className =
                    "client-message-bubble";


                /*
                 * textContent intentionally used instead of
                 * innerHTML so user messages cannot inject HTML.
                 */

                bubble.textContent =
                    message.body;


                const time =
                    document.createElement(
                        "div"
                    );


                time.className =
                    "client-message-time";


                time.textContent =
                    formatClientMessageTime(
                        message.created_at
                    );


                row.append(
                    sender,
                    bubble,
                    time
                );


                list.appendChild(
                    row
                );

            }
        );


    scrollClientMessagesToBottom();

}


// ========================================
// FORMAT MESSAGE TIME
// ========================================

function formatClientMessageTime(
    timestamp
) {

    if (!timestamp) {
        return "";
    }


    const date =
        new Date(
            timestamp
        );


    const now =
        new Date();


    const sameDay =
        date.getFullYear() ===
            now.getFullYear() &&
        date.getMonth() ===
            now.getMonth() &&
        date.getDate() ===
            now.getDate();


    if (sameDay) {

        return date
            .toLocaleTimeString(
                [],
                {
                    hour:
                        "numeric",

                    minute:
                        "2-digit"
                }
            );

    }


    return date
        .toLocaleString(
            [],
            {
                month:
                    "short",

                day:
                    "numeric",

                hour:
                    "numeric",

                minute:
                    "2-digit"
            }
        );

}


// ========================================
// ADD MESSAGE IF MISSING
// ========================================

function addClientMessageIfMissing(
    message
) {

    if (!message) {
        return;
    }


    const alreadyExists =
        clientMessages.some(
            existingMessage =>
                Number(
                    existingMessage.id
                ) ===
                Number(
                    message.id
                )
        );


    if (alreadyExists) {
        return;
    }


    clientMessages.push(
        message
    );


    clientMessages.sort(
        (
            messageA,
            messageB
        ) =>
            new Date(
                messageA.created_at
            ) -
            new Date(
                messageB.created_at
            )
    );

}


// ========================================
// REALTIME CLIENT MESSAGES
// ========================================

function subscribeToClientMessages() {

    if (
        !clientConversation ||
        clientMessageChannel
    ) {
        return;
    }


    clientMessageChannel =
        supabaseClient
            .channel(
                `client-messages-${clientConversation.id}`
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "messages",

                    filter:
                        `conversation_id=eq.${clientConversation.id}`
                },
                payload => {

                    const newMessage =
                        payload.new;


                    addClientMessageIfMissing(
                        newMessage
                    );


                    renderClientMessages();


                    const drawer =
                        document.getElementById(
                            "client-message-drawer"
                        );


                    const drawerIsOpen =
                        drawer
                            ?.classList
                            .contains(
                                "is-open"
                            );


                    if (
                        newMessage.sender_id !==
                        currentUser.id
                    ) {

                        if (drawerIsOpen) {

                            markClientMessagesRead();

                        } else {

                            updateClientMessageUnreadBadge();

                        }

                    }

                }
            )
            .subscribe();

}


// ========================================
// MARK CLIENT MESSAGES READ
// ========================================

async function markClientMessagesRead() {

    if (
        !currentUser ||
        !clientConversation
    ) {
        return;
    }


    const unreadMessages =
        clientMessages.filter(
            message =>
                message.sender_id !==
                    currentUser.id &&
                !message.read_at
        );


    if (
        unreadMessages.length ===
        0
    ) {

        updateClientMessageUnreadBadge();

        return;

    }


    const now =
        new Date()
            .toISOString();


    const {
        error
    } =
        await supabaseClient
            .from("messages")
            .update({
                read_at:
                    now
            })
            .eq(
                "conversation_id",
                clientConversation.id
            )
            .neq(
                "sender_id",
                currentUser.id
            )
            .is(
                "read_at",
                null
            );


    if (error) {

        console.error(
            "Mark client messages read error:",
            error
        );

        return;

    }


    clientMessages =
        clientMessages.map(
            message => {

                if (
                    message.sender_id !==
                        currentUser.id &&
                    !message.read_at
                ) {

                    return {
                        ...message,
                        read_at:
                            now
                    };

                }


                return message;

            }
        );


    updateClientMessageUnreadBadge();

}


// ========================================
// UPDATE UNREAD BADGE
// ========================================

function updateClientMessageUnreadBadge() {

    const badge =
        document.getElementById(
            "client-message-unread-badge"
        );


    if (
        !badge ||
        !currentUser
    ) {
        return;
    }


    const unreadCount =
        clientMessages.filter(
            message =>
                message.sender_id !==
                    currentUser.id &&
                !message.read_at
        )
        .length;


    if (
        unreadCount <=
        0
    ) {

        badge.style.display =
            "none";

        badge.textContent =
            "0";

        return;

    }


    badge.textContent =
        unreadCount > 99
            ? "99+"
            : String(
                unreadCount
            );


    badge.style.display =
        "block";

}


// ========================================
// MESSAGE INPUT AUTO RESIZE
// ========================================

function autoResizeClientMessageInput(
    event
) {

    const input =
        event.target;


    input.style.height =
        "auto";


    input.style.height =
        `${Math.min(
            input.scrollHeight,
            120
        )}px`;

}


// ========================================
// SCROLL MESSAGES TO BOTTOM
// ========================================

function scrollClientMessagesToBottom() {

    const list =
        document.getElementById(
            "client-message-list"
        );


    if (!list) {
        return;
    }


    window.requestAnimationFrame(
        () => {

            list.scrollTop =
                list.scrollHeight;

        }
    );

}


// ========================================
// CLIENT MESSAGE ERROR
// ========================================

function showClientMessageError(
    message
) {

    const errorElement =
        document.getElementById(
            "client-message-error"
        );


    if (!errorElement) {
        return;
    }


    errorElement.textContent =
        message;


    errorElement.style.display =
        "block";

}


// ========================================
// CLEAR CLIENT MESSAGE ERROR
// ========================================

function clearClientMessageError() {

    const errorElement =
        document.getElementById(
            "client-message-error"
        );


    if (!errorElement) {
        return;
    }


    errorElement.textContent =
        "";


    errorElement.style.display =
        "none";

}

// ========================================
// CLIENT APP NAVIGATION
// ========================================

function openClientNavigation() {

    const drawer =
        document.getElementById(
            "client-navigation-drawer"
        );

    const backdrop =
        document.getElementById(
            "client-navigation-backdrop"
        );

    const menuButton =
        document.getElementById(
            "client-menu-button"
        );


    drawer
        ?.classList
        .add(
            "is-open"
        );


    backdrop
        ?.classList
        .add(
            "is-open"
        );


    drawer
        ?.setAttribute(
            "aria-hidden",
            "false"
        );


    menuButton
        ?.setAttribute(
            "aria-expanded",
            "true"
        );


    document.body
        .classList
        .add(
            "client-navigation-open"
        );

}


// ========================================
// CLOSE CLIENT APP NAVIGATION
// ========================================

function closeClientNavigation() {

    const drawer =
        document.getElementById(
            "client-navigation-drawer"
        );

    const backdrop =
        document.getElementById(
            "client-navigation-backdrop"
        );

    const menuButton =
        document.getElementById(
            "client-menu-button"
        );


    drawer
        ?.classList
        .remove(
            "is-open"
        );


    backdrop
        ?.classList
        .remove(
            "is-open"
        );


    drawer
        ?.setAttribute(
            "aria-hidden",
            "true"
        );


    menuButton
        ?.setAttribute(
            "aria-expanded",
            "false"
        );


    document.body
        .classList
        .remove(
            "client-navigation-open"
        );

}


// ========================================
// SCROLL TO CLIENT DASHBOARD SECTION
// ========================================

function scrollToClientDashboardSection(
    sectionId
) {

    const section =
        document.getElementById(
            sectionId
        );


    if (!section) {
        return;
    }


    closeClientNavigation();


    window.setTimeout(
        () => {

            section.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        },
        120
    );

}


// ========================================
// CLIENT NAVIGATION ACTIONS
// ========================================

document
    .getElementById(
        "client-menu-button"
    )
    ?.addEventListener(
        "click",
        openClientNavigation
    );


document
    .getElementById(
        "client-navigation-close"
    )
    ?.addEventListener(
        "click",
        closeClientNavigation
    );


document
    .getElementById(
        "client-navigation-backdrop"
    )
    ?.addEventListener(
        "click",
        closeClientNavigation
    );


document
    .getElementById(
        "client-navigation-drawer"
    )
    ?.addEventListener(
        "click",
        event => {


            const sectionButton =
                event.target.closest(
                    "[data-client-navigation-target]"
                );


            if (sectionButton) {

                const sectionId =
                    sectionButton.dataset
                        .clientNavigationTarget;


                scrollToClientDashboardSection(
                    sectionId
                );


                return;

            }


            const actionButton =
                event.target.closest(
                    "[data-client-navigation-action]"
                );


            if (!actionButton) {
                return;
            }


            const action =
                actionButton.dataset
                    .clientNavigationAction;


            if (
                action ===
                "home"
            ) {

                closeClientNavigation();


                window.setTimeout(
                    () => {

                        window.scrollTo({

                            top:
                                0,

                            behavior:
                                "smooth"

                        });

                    },
                    120
                );


                return;

            }


            if (
                action ===
                "messages"
            ) {

                closeClientNavigation();


                window.setTimeout(
                    () => {

                        document
                            .getElementById(
                                "client-message-launcher"
                            )
                            ?.click();

                    },
                    180
                );


                return;

            }


            if (
                action ===
                "request"
            ) {

                closeClientNavigation();


                window.setTimeout(
                    () => {

                        document
                            .getElementById(
                                "request-walk-button"
                            )
                            ?.click();

                    },
                    180
                );


                return;

            }


            if (
                action ===
                "logout"
            ) {

                closeClientNavigation();


                document
                    .getElementById(
                        "logout-button"
                    )
                    ?.click();

            }

        }
    );


// ========================================
// CLOSE NAVIGATION WITH ESCAPE
// ========================================

document
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeClientNavigation();

            }

        }
    );


// ========================================
// SYNC MESSAGE UNREAD BADGE TO NAVIGATION
// ========================================

function syncClientNavigationMessageBadge() {

    const messageBadge =
        document.getElementById(
            "client-message-unread-badge"
        );


    const desktopNavigationBadge =
        document.getElementById(
            "client-navigation-message-badge"
        );


    const mobileNavigationBadge =
        document.getElementById(
            "client-bottom-message-badge"
        );


    if (!messageBadge) {
        return;
    }


    const unreadCount =
        messageBadge.textContent
            ?.trim() ||
        "0";


    const messageBadgeVisible =
        messageBadge.style.display !==
        "none";


    if (desktopNavigationBadge) {

        desktopNavigationBadge.textContent =
            unreadCount;


        desktopNavigationBadge.style.display =
            messageBadgeVisible
                ? "flex"
                : "none";

    }


    if (mobileNavigationBadge) {

        mobileNavigationBadge.textContent =
            unreadCount;


        mobileNavigationBadge.style.display =
            messageBadgeVisible
                ? "flex"
                : "none";

    }

}


// ========================================
// MOBILE APP NAVIGATION
// ========================================

const mobileAppNavigation =
    document.getElementById(
        "client-bottom-navigation"
    );


const mobileAppNavigationQuery =
    window.matchMedia(
        "(max-width: 700px)"
    );


// ========================================
// SET ACTIVE MOBILE TAB
// ========================================

function setActiveMobileAppTab(
    activeTab
) {

    const buttons =
        document.querySelectorAll(
            "[data-client-app-tab]"
        );


    buttons.forEach(
        button => {

            const tab =
                button.dataset
                    .clientAppTab;


            const isActive =
                tab ===
                activeTab;


            button.classList.toggle(
                "client-bottom-nav-item-active",
                isActive
            );


            if (isActive) {

                button.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {

                button.removeAttribute(
                    "aria-current"
                );

            }

        }
    );

}


// ========================================
// SCROLL TO MOBILE APP SECTION
// ========================================

function scrollToMobileAppSection(
    sectionId
) {

    const section =
        document.getElementById(
            sectionId
        );


    if (!section) {
        return;
    }


    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}

// ========================================
// MOBILE HOME DASHBOARD
// ========================================

async function renderMobileHomeDashboard() {

    const greeting =
        document.getElementById(
            "mobile-home-greeting"
        );

    const nextVisitDate =
        document.getElementById(
            "mobile-home-next-visit-date"
        );

    const nextVisitPets =
        document.getElementById(
            "mobile-home-next-visit-pets"
        );

    const nextVisitService =
        document.getElementById(
            "mobile-home-next-visit-service"
        );

    const nextVisitStatus =
        document.getElementById(
            "mobile-home-next-visit-status"
        );

    const nextVisitButton =
        document.getElementById(
            "mobile-home-next-visit-button"
        );

    const upcomingList =
        document.getElementById(
            "mobile-home-upcoming-list"
        );


// ========================================
// LATEST UPDATE ELEMENTS
// ========================================


// ========================================
// MOBILE LATEST UPDATE
// ========================================

const latestUpdateEmpty =
    document.getElementById(
        "mobile-home-latest-update-empty"
    );

const latestUpdateContent =
    document.getElementById(
        "mobile-home-latest-update-content"
    );

const latestUpdateTitle =
    document.getElementById(
        "mobile-home-latest-update-title"
    );

const latestUpdateMeta =
    document.getElementById(
        "mobile-home-latest-update-meta"
    );

const latestUpdatePhoto =
    document.getElementById(
        "mobile-home-latest-update-photo"
    );

const latestUpdateNote =
    document.getElementById(
        "mobile-home-latest-update-note"
    );

const latestUpdateButton =
    document.getElementById(
        "mobile-home-latest-update-button"
    );


// ========================================
// DESKTOP LATEST UPDATE
// ========================================

const desktopLatestUpdateEmpty =
    document.getElementById(
        "desktop-latest-update-empty"
    );

const desktopLatestUpdateContent =
    document.getElementById(
        "desktop-latest-update-content"
    );

const desktopLatestUpdateTitle =
    document.getElementById(
        "desktop-latest-update-title"
    );

const desktopLatestUpdateMeta =
    document.getElementById(
        "desktop-latest-update-meta"
    );

const desktopLatestUpdatePhoto =
    document.getElementById(
        "desktop-latest-update-photo"
    );

const desktopLatestUpdateNote =
    document.getElementById(
        "desktop-latest-update-note"
    );

const desktopLatestUpdateButton =
    document.getElementById(
        "desktop-latest-update-button"
    );


if (
    !greeting ||
    !nextVisitDate ||
    !nextVisitPets ||
    !nextVisitService ||
    !nextVisitStatus ||
    !nextVisitButton ||
    !upcomingList
) {
    return;
}

    // ========================================
    // DYNAMIC GREETING
    // ========================================

    const currentHour =
        new Date().getHours();


    let greetingText =
        "Good morning";


    if (
        currentHour >= 12 &&
        currentHour < 18
    ) {

        greetingText =
            "Good afternoon";

    } else if (
        currentHour >= 18
    ) {

        greetingText =
            "Good evening";

    }


    const fullName =
        String(
            currentProfile?.full_name ||
            "Client"
        )
            .trim();


    const firstName =
        fullName
            .split(/\s+/)
            .filter(Boolean)[0] ||
        "there";


    greeting.textContent =
        `${greetingText}, ${firstName} 👋`;


    // ========================================
    // UPCOMING VISITS
    // ========================================

    const today =
        getLocalDateString();


    const upcomingVisits =
        currentVisits
            .filter(
                visit => {

                    const status =
                        String(
                            visit.status || ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        visit.visit_date >=
                            today &&
                        status !==
                            "cancelled" &&
                        status !==
                            "completed"
                    );

                }
            )
            .sort(
                (a, b) => {

                    if (
                        a.visit_date !==
                        b.visit_date
                    ) {

                        return String(
                            a.visit_date
                        ).localeCompare(
                            String(
                                b.visit_date
                            )
                        );

                    }


                    return compareClientVisits(
                        a,
                        b
                    );

                }
            );


    // ========================================
    // NEXT VISIT
    // ========================================

    const nextVisit =
        upcomingVisits[0] ||
        null;


    if (!nextVisit) {

        nextVisitDate.textContent =
            "No upcoming visit";

        nextVisitPets.textContent =
            "You're all caught up";

        nextVisitService.textContent =
            "Your next scheduled service will appear here.";

        nextVisitStatus.style.display =
            "none";

        nextVisitButton.style.display =
            "none";

    } else {

        const visitDate =
            parseLocalDate(
                nextVisit.visit_date
            );


        const dateText =
            visitDate
                .toLocaleDateString(
                    "en-US",
                    {
                        weekday:
                            "long",

                        month:
                            "short",

                        day:
                            "numeric"
                    }
                );


        const pets =
            getPetsForVisit(
                nextVisit
            );


        const petNames =
            pets.length

                ? pets
                    .map(
                        pet =>
                            pet.name ||
                            "Pet"
                    )
                    .join(", ")

                : "Your Pet";


        const serviceName =
            nextVisit.service_name ||
            nextVisit.service_type ||
            "Service";


        const timeWindow =
            nextVisit.time_window ||
            "";


        const progress =
            getClientVisitProgressInfo(
                nextVisit
            );


        const statusLabel =
            getClientVisitStatusLabel(
                nextVisit,
                progress
            );


        nextVisitDate.textContent =
            timeWindow

                ? `${dateText} · ${timeWindow}`

                : dateText;


        nextVisitPets.textContent =
            petNames;


        nextVisitService.textContent =
            serviceName;


        nextVisitStatus.textContent =
            statusLabel;


        nextVisitStatus.style.display =
            "inline-flex";


        nextVisitButton.style.display =
            "flex";


        nextVisitButton.onclick =
            () => {

                selectedUpcomingDate =
                    nextVisit.visit_date;


                const selectedDate =
                    parseLocalDate(
                        nextVisit.visit_date
                    );


                upcomingCalendarYear =
                    selectedDate
                        .getFullYear();


                upcomingCalendarMonth =
                    selectedDate
                        .getMonth();


                renderUpcomingCalendar();

                renderSelectedUpcomingServices();


                handleMobileAppTab(
                    "services"
                );

            };

    }


    // ========================================
    // UPCOMING SNAPSHOT
    // ========================================

    upcomingList.innerHTML =
        "";


    const snapshotVisits =
        upcomingVisits.slice(
            0,
            3
        );


    if (
        snapshotVisits.length ===
        0
    ) {

        upcomingList.innerHTML =
            `
                <div class="mobile-home-empty-state">
                    <span>
                        Upcoming services will appear here.
                    </span>
                </div>
            `;

    } else {

        snapshotVisits.forEach(
            visit => {

                const date =
                    parseLocalDate(
                        visit.visit_date
                    );


                const month =
                    date
                        .toLocaleDateString(
                            "en-US",
                            {
                                month:
                                    "short"
                            }
                        );


                const day =
                    date.getDate();


                const pets =
                    getPetsForVisit(
                        visit
                    );


                const petNames =
                    pets.length

                        ? pets
                            .map(
                                pet =>
                                    pet.name ||
                                    "Pet"
                            )
                            .join(", ")

                        : "Your Pet";


                const serviceName =
                    visit.service_name ||
                    visit.service_type ||
                    "Service";


                const timeWindow =
                    visit.time_window ||
                    "";


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "mobile-home-upcoming-item";


                button.innerHTML =
                    `
                        <span class="mobile-home-upcoming-date">

                            <span class="mobile-home-upcoming-month">
                                ${escapeHtml(
                                    month
                                )}
                            </span>

                            <span class="mobile-home-upcoming-day">
                                ${day}
                            </span>

                        </span>


                        <span class="mobile-home-upcoming-info">

                            <strong>
                                ${escapeHtml(
                                    `${petNames} · ${serviceName}`
                                )}
                            </strong>

                            <span>
                                ${
                                    timeWindow

                                        ? escapeHtml(
                                            timeWindow
                                        )

                                        : "Scheduled visit"
                                }
                            </span>

                        </span>


                        <span
                            class="mobile-home-upcoming-chevron"
                            aria-hidden="true"
                        >
                            ›
                        </span>
                    `;


                button.addEventListener(
                    "click",
                    () => {

                        selectedUpcomingDate =
                            visit.visit_date;


                        upcomingCalendarYear =
                            date.getFullYear();


                        upcomingCalendarMonth =
                            date.getMonth();


                        renderUpcomingCalendar();

                        renderSelectedUpcomingServices();


                        handleMobileAppTab(
                            "services"
                        );

                    }
                );


                upcomingList.appendChild(
                    button
                );

            }
        );

    }


    // ========================================
    // LATEST COMPLETED VISIT
    // ========================================
    
    const latestUpdateTargets = [
        {
            empty: latestUpdateEmpty,
            content: latestUpdateContent,
            title: latestUpdateTitle,
            meta: latestUpdateMeta,
            photo: latestUpdatePhoto,
            note: latestUpdateNote,
            button: latestUpdateButton
        },
        {
            empty: desktopLatestUpdateEmpty,
            content: desktopLatestUpdateContent,
            title: desktopLatestUpdateTitle,
            meta: desktopLatestUpdateMeta,
            photo: desktopLatestUpdatePhoto,
            note: desktopLatestUpdateNote,
            button: desktopLatestUpdateButton
        }
    ].filter(
        target =>
            target.empty &&
            target.content &&
            target.title &&
            target.meta &&
            target.photo &&
            target.note &&
            target.button
    );
    
    
    if (
        latestUpdateTargets.length ===
        0
    ) {
        return;
    }
    
    
    latestUpdateTargets.forEach(
        target => {
    
            target.empty.style.display =
                "block";
    
            target.content.style.display =
                "none";
    
            target.photo.style.display =
                "none";
    
            target.photo.innerHTML =
                "";
    
            target.note.textContent =
                "";
    
            target.button.onclick =
                null;
    
        }
    );

    // ========================================
    // ONLY COMPLETED VISITS THROUGH TODAY
    // ========================================

    const completedVisits =
        currentVisits
            .filter(
                visit => {

                    const status =
                        String(
                            visit.status || ""
                        )
                            .trim()
                            .toLowerCase();


                    const isCompleted =
                        status ===
                            "completed" ||
                        Boolean(
                            visit.completed_at
                        );


                    const isTodayOrEarlier =
                        String(
                            visit.visit_date ||
                            ""
                        ) <=
                        today;


                    return (
                        isCompleted &&
                        isTodayOrEarlier
                    );

                }
            )
            .sort(
                (a, b) => {

                    // ========================================
                    // NEWEST SERVICE DATE FIRST
                    // ========================================

                    if (
                        a.visit_date !==
                        b.visit_date
                    ) {

                        return String(
                            b.visit_date
                        ).localeCompare(
                            String(
                                a.visit_date
                            )
                        );

                    }


                    // ========================================
                    // SAME DATE = MOST RECENT COMPLETION FIRST
                    // ========================================

                    const aCompleted =
                        a.completed_at
                            ? new Date(
                                a.completed_at
                            ).getTime()
                            : 0;


                    const bCompleted =
                        b.completed_at
                            ? new Date(
                                b.completed_at
                            ).getTime()
                            : 0;


                    return (
                        bCompleted -
                        aCompleted
                    );

                }
            );


    if (
        completedVisits.length ===
        0
    ) {

        latestUpdateEmpty.innerHTML =
            `
                <span>
                    Your latest completed visit update will appear here.
                </span>
            `;

        return;
    }


    try {


        // ========================================
        // FIND MOST RECENT VISIT WITH REPORT
        // ========================================

        const completedVisitIds =
            completedVisits.map(
                visit =>
                    visit.id
            );


        const {
            data:
                reportRows,
            error:
                reportRowsError
        } =
            await supabaseClient
                .from(
                    "visit_reports"
                )
                .select(
                    "id, visit_id, notes, fed, fresh_water, pee, poop, created_at, updated_at"
                )
                .in(
                    "visit_id",
                    completedVisitIds
                );


        if (
            reportRowsError
        ) {

            throw reportRowsError;

        }


        const reportsByVisitId =
            new Map(
                (
                    reportRows ||
                    []
                ).map(
                    report => [
                        Number(
                            report.visit_id
                        ),
                        report
                    ]
                )
            );


        const latestVisit =
            completedVisits.find(
                visit =>
                    reportsByVisitId.has(
                        Number(
                            visit.id
                        )
                    )
            ) ||
            null;


        if (
            !latestVisit
        ) {

            latestUpdateEmpty.innerHTML =
                `
                    <span>
                        Your latest completed visit update will appear here.
                    </span>
                `;

            return;

        }


        const latestReport =
            reportsByVisitId.get(
                Number(
                    latestVisit.id
                )
            );


        // ========================================
        // LOAD LATEST WALK + FIRST PHOTO
        // ========================================

        const [
            walkResult,
            photoResult
        ] =
            await Promise.all([

                supabaseClient
                    .from(
                        "visit_walks"
                    )
                    .select(
                        "id, visit_id, status, started_at, ended_at, duration_seconds, distance_meters"
                    )
                    .eq(
                        "visit_id",
                        latestVisit.id
                    )
                    .eq(
                        "status",
                        "completed"
                    )
                    .maybeSingle(),


                supabaseClient
                    .from(
                        "visit_photos"
                    )
                    .select(
                        "id, storage_path, photo_type, sort_order, created_at"
                    )
                    .eq(
                        "visit_id",
                        latestVisit.id
                    )
                    .eq(
                        "photo_type",
                        "visit"
                    )
                    .order(
                        "sort_order",
                        {
                            ascending:
                                true
                        }
                    )
                    .order(
                        "created_at",
                        {
                            ascending:
                                true
                        }
                    )
                    .limit(
                        1
                    )
                    .maybeSingle()

            ]);


        if (
            walkResult.error
        ) {

            throw walkResult.error;

        }


        if (
            photoResult.error
        ) {

            throw photoResult.error;

        }


        const completedWalk =
            walkResult.data ||
            null;


        const firstPhoto =
            photoResult.data ||
            null;


        // ========================================
        // PET + SERVICE INFORMATION
        // ========================================

        const pets =
            getPetsForVisit(
                latestVisit
            );


        const petNames =
            pets.length

                ? pets
                    .map(
                        pet =>
                            pet.name ||
                            "Pet"
                    )
                    .join(", ")

                : "Your Pet";


        const serviceName =
            latestVisit.service_name ||
            latestVisit.service_type ||
            "Visit";


        // ========================================
        // UPDATE DATE / TIME
        // ========================================

        const visitDate =
            parseLocalDate(
                latestVisit.visit_date
            );


        const dateText =
            visitDate
                .toLocaleDateString(
                    "en-US",
                    {
                        weekday:
                            "long",

                        month:
                            "short",

                        day:
                            "numeric"
                    }
                );


        const completedTime =
            latestVisit.completed_at

                ? new Date(
                    latestVisit.completed_at
                )
                    .toLocaleTimeString(
                        "en-US",
                        {
                            hour:
                                "numeric",

                            minute:
                                "2-digit"
                        }
                    )

                : "";


        // ========================================
        // WALK SUMMARY
        // ========================================

        let walkSummary =
            "";


        if (
            completedWalk
        ) {

            const walkDuration =
                formatClientWalkDuration(
                    completedWalk
                        .duration_seconds
                );


            const distanceMiles =
                (
                    Number(
                        completedWalk
                            .distance_meters ||
                        0
                    ) /
                    1609.344
                ).toFixed(
                    2
                );


            walkSummary =
                `🐾 Walk recorded · ${distanceMiles} mi · ${walkDuration}`;

        }


        // ========================================
        // RENDER LATEST UPDATE
        // ========================================
        
        const latestUpdateTitleText =
            `${petNames} · ${serviceName}`;
        
        
        const latestUpdateMetaText =
            completedTime
        
                ? `${dateText} · Completed ${completedTime}`
        
                : `${dateText} · Visit Complete`;
        
        
        const noteParts =
            [];
        
        
        if (
            latestReport?.notes
        ) {
        
            noteParts.push(
                latestReport.notes
            );
        
        }
        
        
        if (
            walkSummary
        ) {
        
            noteParts.push(
                walkSummary
            );
        
        }
        
        
        const latestUpdateNoteText =
            noteParts.length
        
                ? noteParts.join(
                    "\n\n"
                )
        
                : "Your visit report is ready to view.";
        
        
        latestUpdateTargets.forEach(
            target => {
        
                target.title.textContent =
                    latestUpdateTitleText;
        
                target.meta.textContent =
                    latestUpdateMetaText;
        
                target.note.textContent =
                    latestUpdateNoteText;
        
                target.note.style.whiteSpace =
                    "pre-line";
        
            }
        );

        // ========================================
        // LATEST VISIT PHOTO
        // ========================================
        
        if (
            firstPhoto?.storage_path
        ) {
        
            const {
                data:
                    signedPhotoData,
                error:
                    signedPhotoError
            } =
                await supabaseClient
                    .storage
                    .from(
                        VISIT_MEDIA_BUCKET
                    )
                    .createSignedUrl(
                        firstPhoto
                            .storage_path,
                        3600
                    );
        
        
            if (
                !signedPhotoError &&
                signedPhotoData
                    ?.signedUrl
            ) {
        
                const latestUpdatePhotoHtml =
                    `
                        <img
                            src="${escapeHtml(
                                signedPhotoData
                                    .signedUrl
                            )}"
                            alt="${escapeHtml(
                                `${petNames} visit update`
                            )}"
                        >
                    `;
        
        
                latestUpdateTargets.forEach(
                    target => {
        
                        target.photo.innerHTML =
                            latestUpdatePhotoHtml;
        
                        target.photo.style.display =
                            "block";
        
                    }
                );
        
            }
        
        }
        
        
        // ========================================
        // SHOW LATEST UPDATE
        // ========================================
        
        latestUpdateTargets.forEach(
            target => {
        
                target.empty.style.display =
                    "none";
        
                target.content.style.display =
                    "block";
        
            }
        );


        // ========================================
        // OPEN EXACT VISIT REPORT
        // ========================================
        
        const openLatestUpdateReport =
            async () => {
        
                selectedUpcomingDate =
                    latestVisit.visit_date;
        
        
                const selectedDate =
                    parseLocalDate(
                        latestVisit.visit_date
                    );
        
        
                upcomingCalendarYear =
                    selectedDate
                        .getFullYear();
        
        
                upcomingCalendarMonth =
                    selectedDate
                        .getMonth();
        
        
                renderUpcomingCalendar();
        
                renderSelectedUpcomingServices();
        
        
                const isMobileLayout =
                    window.matchMedia(
                        "(max-width: 700px)"
                    ).matches;
        
        
                // ========================================
                // OPEN CORRECT SERVICES VIEW
                // ========================================
        
                closeClientMessaging();
        
        
                if (
                    isMobileLayout
                ) {
        
                    setMobileAppScreen(
                        "services"
                    );
        
        
                    setActiveMobileAppTab(
                        "services"
                    );
        
                } else {
        
                    document
                        .getElementById(
                            "services-section"
                        )
                        ?.scrollIntoView({
                            behavior:
                                "smooth",
        
                            block:
                                "start"
                        });
        
                }
        
        
                // ========================================
                // FIND EXACT VISIT REPORT BUTTON
                // ========================================
        
                window.setTimeout(
                    async () => {
        
                        const reportButton =
                            document.querySelector(
                                `[data-client-visit-report-open="${latestVisit.id}"]`
                            );
        
        
                        if (
                            !reportButton
                        ) {
        
                            return;
        
                        }
        
        
                        // ========================================
                        // OPEN EXACT REPORT
                        // ========================================
        
                        await toggleClientVisitReport(
                            latestVisit.id,
                            reportButton
                        );
        
        
                        // ========================================
                        // SCROLL DIRECTLY TO EXACT REPORT
                        // ========================================
        
                        window.setTimeout(
                            () => {
        
                                const reportMount =
                                    getClientVisitReportMount(
                                        latestVisit.id
                                    );
        
        
                                if (
                                    !reportMount
                                ) {
        
                                    return;
        
                                }
        
        
                                reportMount.scrollIntoView({
                                    behavior:
                                        "smooth",
        
                                    block:
                                        "start"
                                });
        
                            },
                            100
                        );
        
                    },
                    150
                );
        
            };
        
        
        latestUpdateTargets.forEach(
            target => {
        
                target.button.onclick =
                    openLatestUpdateReport;
        
            }
        );
        
        }
        catch (
            error
        ) {
        
            console.error(
                "Latest update error:",
                error
            );
        
        
            latestUpdateTargets.forEach(
                target => {
        
                    target.empty.style.display =
                        "block";
        
                    target.content.style.display =
                        "none";
        
                    target.empty.innerHTML =
                        `
                            <span>
                                Your latest completed visit update is temporarily unavailable.
                            </span>
                        `;
        
                }
            );
        
        }
        
        }

// ========================================
// MOBILE HOME QUICK ACTIONS
// ========================================

document
    .getElementById(
        "mobile-home-book-service-button"
    )
    ?.addEventListener(
        "click",
        async () => {

            await handleMobileAppTab(
                "services"
            );


            window.setTimeout(
                () => {

                    document
                        .getElementById(
                            "request-walk-button"
                        )
                        ?.click();

                },
                100
            );

        }
    );


document
    .getElementById(
        "mobile-home-message-button"
    )
    ?.addEventListener(
        "click",
        () => {

            handleMobileAppTab(
                "messages"
            );

        }
    );


document
    .getElementById(
        "mobile-home-view-services-button"
    )
    ?.addEventListener(
        "click",
        () => {

            handleMobileAppTab(
                "services"
            );

        }
    );


// ========================================
// SET MOBILE APP SCREEN
// ========================================

function setMobileAppScreen(
    screen
) {

    // ========================================
    // REMOVE EXISTING MOBILE SCREEN STATE
    // ========================================

    document.body.classList.remove(
        "mobile-app-screen-home",
        "mobile-app-screen-services",
        "mobile-app-screen-pets",
        "mobile-app-screen-profile"
    );


    // ========================================
    // APPLY REQUESTED MOBILE SCREEN
    // ========================================

    document.body.classList.add(
        `mobile-app-screen-${screen}`
    );


    // ========================================
    // REFRESH HOME WHEN OPENED
    // ========================================

    if (
        screen ===
        "home"
    ) {

        renderMobileHomeDashboard();

    }

}

// ========================================
// RESET MOBILE SCREEN SCROLL
// ========================================

function resetMobileAppScroll() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ========================================
// HANDLE MOBILE APP TAB
// ========================================

async function handleMobileAppTab(
    tab
) {

    // ========================================
    // MOBILE ONLY
    // ========================================

    if (
        !mobileAppNavigationQuery.matches
    ) {

        return;

    }


    // ========================================
    // CLOSE REQUEST SERVICE
    // WHEN LEAVING SERVICES
    // ========================================

    if (
        tab !==
        "services"
    ) {

        bookingSection.style.display =
            "none";

    }


    // ========================================
    // HOME
    // ========================================

    if (
        tab ===
        "home"
    ) {

        closeClientMessaging();


        setMobileAppScreen(
            "home"
        );


        setActiveMobileAppTab(
            "home"
        );


        resetMobileAppScroll();


        return;

    }


    // ========================================
    // SERVICES
    // ========================================

    if (
        tab ===
        "services"
    ) {

        closeClientMessaging();


        setMobileAppScreen(
            "services"
        );


        setActiveMobileAppTab(
            "services"
        );


        resetMobileAppScroll();


        return;

    }


    // ========================================
    // PETS
    // ========================================

    if (
        tab ===
        "pets"
    ) {

        closeClientMessaging();


        setMobileAppScreen(
            "pets"
        );


        setActiveMobileAppTab(
            "pets"
        );


        resetMobileAppScroll();


        return;

    }


    // ========================================
    // MESSAGES
    // ========================================

    if (
        tab ===
        "messages"
    ) {

        setActiveMobileAppTab(
            "messages"
        );


        await openClientMessaging();


        return;

    }


    // ========================================
    // PROFILE
    // ========================================

    if (
        tab ===
        "profile"
    ) {

        closeClientMessaging();


        setMobileAppScreen(
            "profile"
        );


        setActiveMobileAppTab(
            "profile"
        );


        resetMobileAppScroll();

    }

}


// ========================================
// MOBILE APP NAVIGATION EVENTS
// ========================================

mobileAppNavigation
    ?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-client-app-tab]"
                );


            if (!button) {
                return;
            }


            const tab =
                button.dataset
                    .clientAppTab;


            handleMobileAppTab(
                tab
            );

        }
    );


// ========================================
// RESET MOBILE TAB WHEN MESSAGE DRAWER CLOSES
// ========================================

document
    .getElementById(
        "client-message-close"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                mobileAppNavigationQuery.matches
            ) {

                setActiveMobileAppTab(
                    "home"
                );

            }

        }
    );

// ========================================
// CLIENT NOTIFICATION CENTER
// ========================================

const clientNotificationCenterButton =
    document.getElementById(
        "client-notification-center-button"
    );


const clientNotificationPanel =
    document.getElementById(
        "client-notification-panel"
    );


const clientNotificationList =
    document.getElementById(
        "client-notification-list"
    );


const clientNotificationUnreadBadge =
    document.getElementById(
        "client-notification-unread-badge"
    );


const clientNotificationMarkAllRead =
    document.getElementById(
        "client-notification-mark-all-read"
    );


const clientNotificationClearAll =
    document.getElementById(
        "client-notification-clear-all"
    );


let currentClientNotifications =
    [];


// ========================================
// NOTIFICATION ICON
// ========================================

function getClientNotificationIcon(
    notificationType
) {


    const type =
        String(
            notificationType ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        type ===
        "visit_started"
    ) {

        return "🐾";

    }


    if (
        type ===
        "visit_completed"
    ) {

        return "✅";

    }


    if (
        type ===
        "visit_report"
    ) {

        return "📋";

    }


    if (
        type ===
        "booking_confirmed" ||
        type ===
        "booking_updated"
    ) {

        return "📅";

    }


    if (
        type ===
        "cancellation_update"
    ) {

        return "💳";

    }


    if (
        type ===
        "client_message"
    ) {

        return "💬";

    }


    return "🔔";

}


// ========================================
// FORMAT NOTIFICATION TIME
// ========================================

function formatClientNotificationTime(
    timestamp
) {


    if (
        !timestamp
    ) {

        return "";

    }


    const date =
        new Date(
            timestamp
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const now =
        new Date();


    const differenceMs =
        Math.max(
            0,
            now.getTime() -
            date.getTime()
        );


    const differenceMinutes =
        Math.floor(
            differenceMs /
            60000
        );


    if (
        differenceMinutes <
        1
    ) {

        return "Just now";

    }


    if (
        differenceMinutes <
        60
    ) {

        return `${differenceMinutes} min ago`;

    }


    const differenceHours =
        Math.floor(
            differenceMinutes /
            60
        );


    if (
        differenceHours <
        24
    ) {

        return `${differenceHours} ${
            differenceHours ===
            1
                ? "hour"
                : "hours"
        } ago`;

    }


    const differenceDays =
        Math.floor(
            differenceHours /
            24
        );


    if (
        differenceDays ===
        1
    ) {

        return "Yesterday";

    }


    if (
        differenceDays <
        7
    ) {

        return `${differenceDays} days ago`;

    }


    return date
        .toLocaleDateString(
            "en-US",
            {
                month:
                    "short",

                day:
                    "numeric"
            }
        );

}


// ========================================
// UPDATE NOTIFICATION BADGE
// ========================================

function updateClientNotificationBadge() {


    if (
        !clientNotificationUnreadBadge
    ) {

        return;

    }


    const unreadCount =
        currentClientNotifications
            .filter(
                notification =>
                    !notification.read_at
            )
            .length;


    if (
        unreadCount <=
        0
    ) {

        clientNotificationUnreadBadge.hidden =
            true;

        clientNotificationUnreadBadge.textContent =
            "0";


        return;

    }


    clientNotificationUnreadBadge.textContent =
        unreadCount >
        99
            ? "99+"
            : String(
                unreadCount
            );


    clientNotificationUnreadBadge.hidden =
        false;

}


// ========================================
// RENDER NOTIFICATION CENTER
// ========================================

function renderClientNotifications() {


    if (
        !clientNotificationList
    ) {

        return;

    }


    updateClientNotificationBadge();


    if (
        currentClientNotifications.length ===
        0
    ) {

        clientNotificationList.innerHTML = `

            <div class="client-notification-empty">

                <span
                    class="client-notification-empty-icon"
                    aria-hidden="true"
                >
                    🔔
                </span>

                <strong>
                    You're all caught up
                </strong>

                <p>
                    New pet care updates will appear here.
                </p>

            </div>

        `;


        return;

    }


    clientNotificationList.innerHTML =
        currentClientNotifications
            .map(
                notification => {


                    const unread =
                        !notification.read_at;


                    const icon =
                        getClientNotificationIcon(
                            notification.notification_type
                        );


                    return `

                        <div
                            class="client-notification-item ${
                                unread
                                    ? "is-unread"
                                    : ""
                            }"
                            data-client-notification-id="${notification.id}"
                            data-client-notification-url="${escapeHtml(
                                notification.action_url ||
                                ""
                            )}"
                            role="button"
                            tabindex="0"
                        >

                            <span
                                class="client-notification-item-icon"
                                aria-hidden="true"
                            >
                                ${icon}
                            </span>


                            <div class="client-notification-item-copy">

                                <div class="client-notification-item-title">

                                    ${
                                        unread
                                            ? `
                                                <span
                                                    class="client-notification-unread-dot"
                                                    aria-hidden="true"
                                                ></span>
                                            `
                                            : ""
                                    }

                                    <span>
                                        ${escapeHtml(
                                            notification.title ||
                                            "Notification"
                                        )}
                                    </span>

                                </div>


                                <p class="client-notification-item-message">
                                    ${escapeHtml(
                                        notification.message ||
                                        ""
                                    )}
                                </p>


                                <span class="client-notification-item-time">
                                    ${escapeHtml(
                                        formatClientNotificationTime(
                                            notification.created_at
                                        )
                                    )}
                                </span>

                            </div>


                            <button
                                type="button"
                                class="client-notification-dismiss"
                                data-client-notification-dismiss="${notification.id}"
                                aria-label="Clear notification"
                                title="Clear notification"
                            >
                                ×
                            </button>

                        </div>

                    `;

                }
            )
            .join("");

}


// ========================================
// LOAD CLIENT NOTIFICATIONS
// ========================================

async function loadClientNotifications() {


    if (
        !currentUser?.id
    ) {

        return;

    }


    try {


        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "client_notifications"
                )
                .select(
                    `
                        id,
                        notification_type,
                        title,
                        message,
                        action_url,
                        entity_type,
                        entity_id,
                        read_at,
                        created_at
                    `
                )
                .eq(
                    "client_id",
                    currentUser.id
                )
                .is(
                    "dismissed_at",
                    null
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    50
                );


        if (
            error
        ) {

            throw error;

        }


        currentClientNotifications =
            data ||
            [];


        renderClientNotifications();


    } catch (
        error
    ) {


        console.error(
            "Client notification load error:",
            error
        );

    }

}


// ========================================
// OPEN NOTIFICATION CENTER
// ========================================

async function openClientNotificationCenter() {


    if (
        !clientNotificationPanel ||
        !clientNotificationCenterButton
    ) {

        return;

    }


    await loadClientNotifications();


    clientNotificationPanel.hidden =
        false;


    clientNotificationCenterButton.setAttribute(
        "aria-expanded",
        "true"
    );

}


// ========================================
// CLOSE NOTIFICATION CENTER
// ========================================

function closeClientNotificationCenter() {


    if (
        !clientNotificationPanel ||
        !clientNotificationCenterButton
    ) {

        return;

    }


    clientNotificationPanel.hidden =
        true;


    clientNotificationCenterButton.setAttribute(
        "aria-expanded",
        "false"
    );

}


// ========================================
// TOGGLE NOTIFICATION CENTER
// ========================================

async function toggleClientNotificationCenter() {


    if (
        !clientNotificationPanel
    ) {

        return;

    }


    if (
        clientNotificationPanel.hidden
    ) {

        await openClientNotificationCenter();

        return;

    }


    closeClientNotificationCenter();

}

// ========================================
// MARK ONE NOTIFICATION READ
// ========================================

async function markClientNotificationRead(
    notificationId
) {


    if (
        !currentUser?.id ||
        !notificationId
    ) {

        return false;

    }


    const {
        error
    } =
        await supabaseClient
            .from(
                "client_notifications"
            )
            .update({
                read_at:
                    new Date()
                        .toISOString()
            })
            .eq(
                "id",
                notificationId
            )
            .eq(
                "client_id",
                currentUser.id
            )
            .is(
                "read_at",
                null
            );


    if (
        error
    ) {

        console.error(
            "Notification read update error:",
            error
        );


        return false;

    }


    const notification =
        currentClientNotifications
            .find(
                item =>
                    Number(
                        item.id
                    ) ===
                    Number(
                        notificationId
                    )
            );


    if (
        notification &&
        !notification.read_at
    ) {

        notification.read_at =
            new Date()
                .toISOString();

    }


    renderClientNotifications();


    return true;

}

// ========================================
// MARK ALL NOTIFICATIONS READ
// ========================================

async function markAllClientNotificationsRead() {


    if (
        !currentUser?.id
    ) {

        return;

    }


    const readAt =
        new Date()
            .toISOString();


    const {
        error
    } =
        await supabaseClient
            .from(
                "client_notifications"
            )
            .update({
                read_at:
                    readAt
            })
            .eq(
                "client_id",
                currentUser.id
            )
            .is(
                "dismissed_at",
                null
            )
            .is(
                "read_at",
                null
            );


    if (
        error
    ) {

        console.error(
            "Mark all notifications read error:",
            error
        );


        return;

    }


    currentClientNotifications =
        currentClientNotifications
            .map(
                notification => ({

                    ...notification,

                    read_at:
                        notification.read_at ||
                        readAt

                })
            );


    renderClientNotifications();

}

// ========================================
// DISMISS ONE NOTIFICATION
// ========================================

async function dismissClientNotification(
    notificationId
) {


    if (
        !currentUser?.id ||
        !notificationId
    ) {

        return;

    }


    const dismissedAt =
        new Date()
            .toISOString();


    const {
        error
    } =
        await supabaseClient
            .from(
                "client_notifications"
            )
            .update({
                dismissed_at:
                    dismissedAt,

                read_at:
                    dismissedAt
            })
            .eq(
                "id",
                notificationId
            )
            .eq(
                "client_id",
                currentUser.id
            );


    if (
        error
    ) {

        console.error(
            "Notification dismiss error:",
            error
        );


        return;

    }


    currentClientNotifications =
        currentClientNotifications
            .filter(
                notification =>
                    Number(
                        notification.id
                    ) !==
                    Number(
                        notificationId
                    )
            );


    renderClientNotifications();

}

// ========================================
// CLEAR ALL NOTIFICATIONS
// ========================================

async function clearAllClientNotifications() {


    if (
        !currentUser?.id ||
        currentClientNotifications.length ===
        0
    ) {

        return;

    }


    const dismissedAt =
        new Date()
            .toISOString();


    const {
        error
    } =
        await supabaseClient
            .from(
                "client_notifications"
            )
            .update({
                dismissed_at:
                    dismissedAt,

                read_at:
                    dismissedAt
            })
            .eq(
                "client_id",
                currentUser.id
            )
            .is(
                "dismissed_at",
                null
            );


    if (
        error
    ) {

        console.error(
            "Clear notifications error:",
            error
        );


        return;

    }


    currentClientNotifications =
        [];


    renderClientNotifications();

}

// ========================================
// CLIENT LIVE WALK TIMER
// ========================================

let clientLiveWalkTimerInterval =
    null;


// ========================================
// UPDATE LIVE WALK TIMERS
// ========================================

function updateClientLiveWalkTimers() {

    document
        .querySelectorAll(
            ".client-live-walk-summary"
        )
        .forEach(
            element => {

                const startedAt =
                    element.dataset
                        .liveWalkStartedAt;


                const distanceMeters =
                    Number(
                        element.dataset
                            .liveWalkDistanceMeters ||
                        0
                    );


                if (
                    !startedAt
                ) {

                    return;

                }


                const startDate =
                    new Date(
                        startedAt
                    );


                const elapsedMilliseconds =
                    Date.now() -
                    startDate.getTime();


                if (
                    !Number.isFinite(
                        elapsedMilliseconds
                    ) ||
                    elapsedMilliseconds <
                        0
                ) {

                    return;

                }


                const elapsedMinutes =
                    Math.floor(
                        elapsedMilliseconds /
                        60000
                    );


                const distanceMiles =
                    (
                        distanceMeters /
                        1609.344
                    ).toFixed(
                        2
                    );


                element.textContent =
                    `${elapsedMinutes} ${
                        elapsedMinutes === 1
                            ? "minute"
                            : "minutes"
                    } · ${distanceMiles} mi`;

            }
        );

}


// ========================================
// START LIVE WALK TIMER
// ========================================

function startClientLiveWalkTimer() {

    if (
        clientLiveWalkTimerInterval
    ) {

        return;

    }


    updateClientLiveWalkTimers();


    clientLiveWalkTimerInterval =
        window.setInterval(
            updateClientLiveWalkTimers,
            1000
        );

}


// ========================================
// CLIENT LIVE WALK DATA
// ========================================

let currentClientLiveWalks =
    new Map();


// ========================================
// REFRESH CLIENT LIVE WALKS
// ========================================

async function refreshClientLiveWalks() {

    if (
        !currentUser?.id
    ) {

        return;

    }


    const visitIds =
        currentVisits
            .filter(
                visit => {

                    const status =
                        String(
                            visit.status ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        status !==
                            "cancelled" &&
                        status !==
                            "completed"
                    );

                }
            )
            .map(
                visit =>
                    Number(
                        visit.id
                    )
            )
            .filter(
                Number.isFinite
            );


    if (
        visitIds.length ===
        0
    ) {

        currentClientLiveWalks =
            new Map();


        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "visit_walks"
            )
            .select(
                "id, visit_id, status, started_at, ended_at, duration_seconds, distance_meters, updated_at"
            )
            .in(
                "visit_id",
                visitIds
            )
            .eq(
                "status",
                "in_progress"
            );


    if (
        error
    ) {

        console.error(
            "Client live walk refresh error:",
            error
        );


        return;

    }


    currentClientLiveWalks =
        new Map(
            (
                data ||
                []
            ).map(
                walk => [
                    Number(
                        walk.visit_id
                    ),
                    walk
                ]
            )
        );

}

// ========================================
// CLIENT WALK REALTIME
// ========================================

let clientWalkRealtimeChannel =
    null;


let clientWalkRealtimeRefreshTimer =
    null;


// ========================================
// SCHEDULE CLIENT WALK REFRESH
// ========================================

function scheduleClientWalkRealtimeRefresh() {

    if (
        clientWalkRealtimeRefreshTimer
    ) {

        window.clearTimeout(
            clientWalkRealtimeRefreshTimer
        );

    }


    clientWalkRealtimeRefreshTimer =
        window.setTimeout(
            async () => {

                clientWalkRealtimeRefreshTimer =
                    null;


                await refreshClientLiveWalks();


                renderSelectedUpcomingServices();

                renderMobileHomeDashboard();


                console.log(
                    "Client walk data refreshed from Realtime."
                );

            },
            300
        );

}


// ========================================
// SUBSCRIBE TO CLIENT WALK REALTIME
// ========================================

function subscribeToClientWalkRealtime() {

    if (
        !currentUser?.id ||
        clientWalkRealtimeChannel
    ) {

        return;

    }


    clientWalkRealtimeChannel =
        supabaseClient
            .channel(
                `client-walks-${currentUser.id}`
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "visit_walks"
                },
                () => {

                    scheduleClientWalkRealtimeRefresh();

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "Client walk Realtime:",
                        status
                    );

                }
            );

}

// ========================================
// CLIENT VISIT REALTIME
// ========================================

// ========================================
// CLIENT VISIT REALTIME
// ========================================

let clientVisitRealtimeChannel =
    null;


let clientVisitRealtimeRefreshTimer =
    null;


// ========================================
// SCHEDULE CLIENT VISIT REFRESH
// ========================================

function scheduleClientVisitRealtimeRefresh() {

    if (
        clientVisitRealtimeRefreshTimer
    ) {

        window.clearTimeout(
            clientVisitRealtimeRefreshTimer
        );

    }


    clientVisitRealtimeRefreshTimer =
        window.setTimeout(
            async () => {

                clientVisitRealtimeRefreshTimer =
                    null;


                await refreshUpcomingVisits();


                console.log(
                    "Client visits refreshed from Realtime."
                );

            },
            300
        );

}


// ========================================
// SUBSCRIBE TO CLIENT VISITS
// ========================================

function subscribeToClientVisitRealtime() {

    if (
        !currentUser?.id ||
        clientVisitRealtimeChannel
    ) {

        return;

    }


    clientVisitRealtimeChannel =
        supabaseClient
            .channel(
                `client-visits-${currentUser.id}`
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "visits",

                    filter:
                        `client_id=eq.${currentUser.id}`
                },
                () => {

                    scheduleClientVisitRealtimeRefresh();

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "Client visit Realtime:",
                        status
                    );

                }
            );

}

// ========================================
// REALTIME CLIENT NOTIFICATIONS
// ========================================

let clientNotificationRealtimeChannel =
    null;


// ========================================
// REFRESH DATA FOR NEW NOTIFICATION
// ========================================

async function refreshClientDataForNotification(
    notification
) {

    if (
        !notification
    ) {

        return;

    }


    const notificationType =
        String(
            notification.notification_type ||
            ""
        );


    // ========================================
    // VISIT / BOOKING / REPORT UPDATES
    // ========================================

    if (
        notificationType ===
            "visit_started" ||
        notificationType ===
            "visit_completed" ||
        notificationType ===
            "client_visit_completed" ||
        notificationType ===
            "visit_report" ||
        notificationType ===
            "client_visit_report" ||
        notificationType ===
            "booking_confirmed" ||
        notificationType ===
            "client_booking_confirmed" ||
        notificationType ===
            "booking_updated" ||
        notificationType ===
            "client_booking_updated"
    ) {

        await refreshUpcomingVisits();

    }


    // ========================================
    // CANCELLATION / ACCOUNT CREDIT
    // ========================================

    if (
        notificationType ===
            "cancellation_update" ||
        notificationType ===
            "client_cancellation_update"
    ) {

        await refreshUpcomingVisits();

        await renderAccountCredit();

    }

}


// ========================================
// ADD REALTIME NOTIFICATION
// ========================================

async function addRealtimeClientNotification(
    notification
) {

    if (
        !notification ||
        !currentUser?.id
    ) {

        return;

    }


    if (
        notification.client_id !==
        currentUser.id
    ) {

        return;

    }


    if (
        notification.dismissed_at
    ) {

        return;

    }


    const alreadyExists =
        currentClientNotifications
            .some(
                existingNotification =>
                    Number(
                        existingNotification.id
                    ) ===
                    Number(
                        notification.id
                    )
            );


    if (
        alreadyExists
    ) {

        return;

    }


    currentClientNotifications.unshift(
        notification
    );


    currentClientNotifications =
        currentClientNotifications.slice(
            0,
            50
        );


    renderClientNotifications();


    await refreshClientDataForNotification(
        notification
    );

}


// ========================================
// SUBSCRIBE TO REALTIME NOTIFICATIONS
// ========================================

function subscribeToClientNotifications() {

    if (
        !currentUser?.id ||
        clientNotificationRealtimeChannel
    ) {

        return;

    }


    clientNotificationRealtimeChannel =
        supabaseClient
            .channel(
                `client-notifications-${currentUser.id}`
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "client_notifications",

                    filter:
                        `client_id=eq.${currentUser.id}`
                },
                async payload => {

                    await addRealtimeClientNotification(
                        payload.new
                    );

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "Client notification realtime:",
                        status
                    );

                }
            );

}

// ========================================
// NOTIFICATION CENTER EVENTS
// ========================================

clientNotificationCenterButton
    ?.addEventListener(
        "click",
        async event => {


            event.stopPropagation();


            await toggleClientNotificationCenter();

        }
    );


clientNotificationPanel
    ?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );


clientNotificationMarkAllRead
    ?.addEventListener(
        "click",
        async () => {

            await markAllClientNotificationsRead();

        }
    );


clientNotificationClearAll
    ?.addEventListener(
        "click",
        async () => {

            await clearAllClientNotifications();

        }
    );


// ========================================
// HANDLE NOTIFICATION ACTION
// ========================================

async function handleClientNotificationAction(
    notificationId
) {


    const notification =
        currentClientNotifications
            .find(
                item =>
                    Number(
                        item.id
                    ) ===
                    Number(
                        notificationId
                    )
            );


    if (
        !notification
    ) {

        return;

    }


    const notificationType =
        String(
            notification.notification_type ||
            ""
        )
            .trim()
            .toLowerCase();


    const entityType =
        String(
            notification.entity_type ||
            ""
        )
            .trim()
            .toLowerCase();


    const entityId =
        Number(
            notification.entity_id
        );


    closeClientNotificationCenter();

    // ========================================
    // CANCELLATION / ACCOUNT CREDIT
    // ========================================
    
    if (
        notificationType ===
            "cancellation_update" ||
        notificationType ===
            "client_cancellation_update"
    ) {
    
    
        // ========================================
        // REFRESH ACCOUNT CREDIT
        // ========================================
    
        await renderAccountCredit();
    
    
        // ========================================
        // MOBILE — OPEN PROFILE
        // ========================================
    
        if (
            window.matchMedia(
                "(max-width: 700px)"
            ).matches
        ) {
    
            await handleMobileAppTab(
                "profile"
            );
    
        }
    
    
        // ========================================
        // SCROLL TO ACCOUNT CREDIT
        // ========================================
    
        window.setTimeout(
            () => {
    
    
                const creditCard =
                    document.getElementById(
                        "household-credit-card"
                    );
    
    
                const profileSection =
                    document.getElementById(
                        "household-section"
                    );
    
    
                (
                    creditCard &&
                    creditCard.style.display !==
                        "none"
                        ? creditCard
                        : profileSection
                )
                    ?.scrollIntoView({
                        behavior:
                            "smooth",
    
                        block:
                            "center"
                    });
    
    
            },
            140
        );
    
    
        return;
    
    }
    
    
    // ========================================
    // VISIT / BOOKING NOTIFICATIONS
    // ========================================
    
    if (
        entityType ===
            "visit" &&
        entityId
    ) {
    
    
        const visit =
            currentVisits.find(
                item =>
                    Number(
                        item.id
                    ) ===
                    entityId
            );
    
    
        if (
            visit
        ) {
    
    
            selectedUpcomingDate =
                visit.visit_date;
    
    
            const visitDate =
                parseLocalDate(
                    visit.visit_date
                );
    
    
            upcomingCalendarYear =
                visitDate.getFullYear();
    
    
            upcomingCalendarMonth =
                visitDate.getMonth();
    
    
            renderUpcomingCalendar();
    
            renderSelectedUpcomingServices();
    
    
            // ========================================
            // MOBILE — OPEN REAL SERVICES SCREEN
            // ========================================
    
            if (
                window.matchMedia(
                    "(max-width: 700px)"
                ).matches
            ) {
    
                await handleMobileAppTab(
                    "services"
                );
    
            }
    
    
            // ========================================
            // VISIT REPORT READY
            // ========================================
    
            if (
                notificationType ===
                    "visit_report" ||
                notificationType ===
                    "client_visit_report"
            ) {
    
    
                window.setTimeout(
                    async () => {
    
    
                        const reportButton =
                            document.querySelector(
                                `[data-client-visit-report-open="${entityId}"]`
                            );
    
    
                        if (
                            reportButton
                        ) {
    
    
                            await toggleClientVisitReport(
                                entityId,
                                reportButton
                            );
    
    
                            window.setTimeout(
                                () => {
    
    
                                    const reportMount =
                                        document.getElementById(
                                            `client-visit-report-${entityId}`
                                        );
    
    
                                    (
                                        reportMount ||
                                        reportButton
                                    )
                                        ?.scrollIntoView({
                                            behavior:
                                                "smooth",
    
                                            block:
                                                "center"
                                        });
    
    
                                },
                                150
                            );
    
    
                            return;
    
                        }
    
    
                        document
                            .getElementById(
                                "services-section"
                            )
                            ?.scrollIntoView({
                                behavior:
                                    "smooth",
    
                                block:
                                    "start"
                            });
    
    
                    },
                    220
                );
    
    
                return;
    
            }
    
    
            // ========================================
            // BOOKING CONFIRMED / UPDATED
            // ========================================
    
            if (
                notificationType ===
                    "booking_confirmed" ||
                notificationType ===
                    "client_booking_confirmed" ||
                notificationType ===
                    "booking_updated" ||
                notificationType ===
                    "client_booking_updated"
            ) {
    
    
                window.setTimeout(
                    () => {
    
    
                        const visitElement =
                            document.querySelector(
                                `[data-client-visit-id="${entityId}"]`
                            );
    
    
                        (
                            visitElement ||
                            document.getElementById(
                                "selected-upcoming-services"
                            )
                        )
                            ?.scrollIntoView({
                                behavior:
                                    "smooth",
    
                                block:
                                    "center"
                            });
    
    
                    },
                    140
                );
    
    
                return;
    
            }
    
    
            // ========================================
            // STANDARD VISIT NOTIFICATION
            // ========================================
    
            window.setTimeout(
                () => {
    
    
                    const visitElement =
                        document.querySelector(
                            `[data-client-visit-id="${entityId}"]`
                        );
    
    
                    (
                        visitElement ||
                        document.getElementById(
                            "selected-upcoming-services"
                        )
                    )
                        ?.scrollIntoView({
                            behavior:
                                "smooth",
    
                            block:
                                "center"
                        });
    
    
                },
                120
            );
    
    
            return;
    
        }
    
    }
    
    
    // ========================================
    // BOOKING FALLBACK
    // ========================================
    //
    // If a booking notification doesn't contain
    // a visit entity for some reason, still take
    // the client to Services instead of doing
    // nothing.
    // ========================================
    
    if (
        notificationType ===
            "booking_confirmed" ||
        notificationType ===
            "client_booking_confirmed" ||
        notificationType ===
            "booking_updated" ||
        notificationType ===
            "client_booking_updated"
    ) {
    
    
        if (
            window.matchMedia(
                "(max-width: 700px)"
            ).matches
        ) {
    
            await handleMobileAppTab(
                "services"
            );
    
        }
    
    
        window.setTimeout(
            () => {
    
    
                document
                    .getElementById(
                        "services-section"
                    )
                    ?.scrollIntoView({
                        behavior:
                            "smooth",
    
                        block:
                            "start"
                    });
    
    
            },
            120
        );
    
    
        return;
    
    }
    
    
    // ========================================
    // MESSAGE NOTIFICATIONS
    // ========================================

    if (
        notificationType ===
        "client_message"
    ) {


        if (
            window.matchMedia(
                "(max-width: 700px)"
            ).matches
        ) {

            setActiveMobileAppTab(
                "messages"
            );

        }


        window.setTimeout(
            () => {

                document
                    .getElementById(
                        "client-message-launcher"
                    )
                    ?.click();

            },
            120
        );


        return;

    }


    // ========================================
    // BOOKING / CANCELLATION NOTIFICATIONS
    // ========================================

    if (
        notificationType ===
            "booking_confirmed" ||
        notificationType ===
            "booking_updated" ||
        notificationType ===
            "cancellation_update"
    ) {


        if (
            window.matchMedia(
                "(max-width: 700px)"
            ).matches
        ) {

            setActiveMobileAppTab(
                "services"
            );

        }


        window.setTimeout(
            () => {

                document
                    .getElementById(
                        "services-section"
                    )
                    ?.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start"
                    });

            },
            80
        );


        return;

    }


    // ========================================
    // DEFAULT
    // ========================================

    window.scrollTo({
        top:
            0,

        behavior:
            "smooth"
    });

}


// ========================================
// NOTIFICATION LIST CLICK
// ========================================

clientNotificationList
    ?.addEventListener(
        "click",
        async event => {


            const dismissButton =
                event.target.closest(
                    "[data-client-notification-dismiss]"
                );


            if (
                dismissButton
            ) {


                const notificationId =
                    Number(
                        dismissButton.dataset
                            .clientNotificationDismiss
                    );


                await dismissClientNotification(
                    notificationId
                );


                return;

            }


            const notificationItem =
                event.target.closest(
                    "[data-client-notification-id]"
                );


            if (
                !notificationItem
            ) {

                return;

            }


            const notificationId =
                Number(
                    notificationItem.dataset
                        .clientNotificationId
                );


            await markClientNotificationRead(
                notificationId
            );


            await handleClientNotificationAction(
                notificationId
            );

        }
    );


// ========================================
// CLOSE NOTIFICATIONS OUTSIDE PANEL
// ========================================

document
    .addEventListener(
        "click",
        event => {


            if (
                clientNotificationPanel?.hidden
            ) {

                return;

            }


            if (
                event.target.closest(
                    ".client-notification-center"
                )
            ) {

                return;

            }


            closeClientNotificationCenter();

        }
    );


// ========================================
// CLOSE NOTIFICATIONS WITH ESCAPE
// ========================================

document
    .addEventListener(
        "keydown",
        event => {


            if (
                event.key ===
                "Escape"
            ) {

                closeClientNotificationCenter();

            }

        }
    );

// ========================================
// PUSH NOTIFICATIONS
// ========================================

const VAPID_PUBLIC_KEY =
    "BJMZyLb__6L55n-7l1SB3H97mQDGkUXiudH4X9EQMjqO2Do7jIGtS9Gu-gxkIZ5sMxrfLsCo5EaWpGb6kRi5_DA";


const pushNotificationCard =
    document.getElementById(
        "push-notification-card"
    );


const enablePushNotificationsButton =
    document.getElementById(
        "enable-push-notifications"
    );


const pushNotificationStatus =
    document.getElementById(
        "push-notification-status"
    );


// ========================================
// UPDATE PUSH STATUS
// ========================================

function setPushNotificationStatus(
    message
) {

    if (
        !pushNotificationStatus
    ) {

        return;

    }


    pushNotificationStatus.textContent =
        message || "";

}


// ========================================
// DETECT PUSH SUPPORT
// ========================================

function browserSupportsPushNotifications() {

    return (
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );

}


// ========================================
// CONVERT BASE64URL TO UINT8ARRAY
// ========================================

function urlBase64ToUint8Array(
    base64String
) {

    const padding =
        "=".repeat(
            (
                4 -
                (
                    base64String.length %
                    4
                )
            ) %
            4
        );


    const base64 =
        (
            base64String +
            padding
        )
            .replace(
                /-/g,
                "+"
            )
            .replace(
                /_/g,
                "/"
            );


    const rawData =
        window.atob(
            base64
        );


    return Uint8Array.from(
        [...rawData]
            .map(
                character =>
                    character.charCodeAt(0)
            )
    );

}


// ========================================
// SAVE PUSH SUBSCRIPTION
// ========================================

async function savePushSubscription(
    subscription
) {

    if (
        !currentUser?.id
    ) {

        throw new Error(
            "No authenticated user is available."
        );

    }


    const subscriptionJson =
        subscription.toJSON();


    const p256dh =
        subscriptionJson
            ?.keys
            ?.p256dh;


    const auth =
        subscriptionJson
            ?.keys
            ?.auth;


    if (
        !subscription.endpoint ||
        !p256dh ||
        !auth
    ) {

        throw new Error(
            "Push subscription information is incomplete."
        );

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .rpc(
                "claim_push_subscription",
                {
                    p_endpoint:
                        subscription.endpoint,

                    p_p256dh:
                        p256dh,

                    p_auth:
                        auth,

                    p_user_agent:
                        navigator.userAgent
                }
            );


    if (
        error
    ) {

        console.error(
            "Push subscription claim error:",
            error
        );


        throw error;

    }


    console.log(
        "Push subscription claimed for current user:",
        {
            userId:
                currentUser.id,

            result:
                data
        }
    );

}


// ========================================
// CREATE OR RESTORE PUSH SUBSCRIPTION
// ========================================

async function ensurePushSubscription() {

    const registration =
        await navigator
            .serviceWorker
            .ready;


    let subscription =
        await registration
            .pushManager
            .getSubscription();


    if (
        !subscription
    ) {

        const applicationServerKey =
            urlBase64ToUint8Array(
                VAPID_PUBLIC_KEY
            );


        subscription =
            await registration
                .pushManager
                .subscribe(
                    {
                        userVisibleOnly:
                            true,

                        applicationServerKey
                    }
                );

    }


    await savePushSubscription(
        subscription
    );


    return subscription;

}


// ========================================
// MOBILE PUSH AVAILABILITY
// ========================================

function isMobileDeviceForPush() {

    if (
        navigator.userAgentData
            ?.mobile ===
        true
    ) {

        return true;

    }


    if (
        /Android|iPhone|iPad|iPod|Mobile/i
            .test(
                navigator.userAgent
            )
    ) {

        return true;

    }


    if (
        navigator.platform ===
            "MacIntel" &&
        navigator.maxTouchPoints >
            1
    ) {

        return true;

    }


    return false;

}


function isInstalledPawsInStridePWA() {

    return (
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches ||
        window.navigator.standalone ===
            true
    );

}

function shouldUseMobilePushNotifications() {

    return (
        isMobileDeviceForPush() &&
        isInstalledPawsInStridePWA()
    );

}


// ========================================
// PUSH SETTINGS CARD VISIBILITY
// ========================================

function updateClientPushSettingsCardVisibility() {

    const pushSettingsCard =
        document.getElementById(
            "client-push-settings-card"
        );


    if (
        !pushSettingsCard
    ) {

        return;

    }


    const isMobileDevice =
        isMobileDeviceForPush();


    const isInstalledPWA =
        isInstalledPawsInStridePWA();


    const shouldShowPushSettings =
        !isMobileDevice ||
        isInstalledPWA;


    pushSettingsCard.hidden =
        !shouldShowPushSettings;

}

// ========================================
// UPDATE PUSH NOTIFICATION UI
// ========================================

async function updatePushNotificationUI() {

    if (
        !enablePushNotificationsButton ||
        !pushNotificationStatus
    ) {

        return;

    }


    // ========================================
    // PUSH NOT SUPPORTED
    // ========================================

    if (
        !browserSupportsPushNotifications()
    ) {

        enablePushNotificationsButton.disabled =
            true;

        enablePushNotificationsButton.textContent =
            "Not Supported";

        setPushNotificationStatus(
            "Push notifications are not supported on this device or browser."
        );


        return;

    }


    // ========================================
    // PERMISSION GRANTED
    // ========================================

    if (
        Notification.permission ===
        "granted"
    ) {

        try {

            await ensurePushSubscription();


            enablePushNotificationsButton.disabled =
                true;

            enablePushNotificationsButton.textContent =
                "Notifications Enabled";


            setPushNotificationStatus(
                "Push notifications are enabled on this device."
            );

        }
        catch (
            error
        ) {

            console.error(
                "Existing push subscription setup error:",
                error
            );


            enablePushNotificationsButton.disabled =
                false;

            enablePushNotificationsButton.textContent =
                "Finish Notification Setup";


            setPushNotificationStatus(
                "Notifications are allowed, but this device still needs to finish registration."
            );

        }


        return;

    }


    // ========================================
    // PERMISSION BLOCKED
    // ========================================

    if (
        Notification.permission ===
        "denied"
    ) {

        enablePushNotificationsButton.disabled =
            true;

        enablePushNotificationsButton.textContent =
            "Notifications Blocked";


        setPushNotificationStatus(
            "Notifications are currently blocked for Paws in Stride on this device."
        );


        return;

    }


    // ========================================
    // PERMISSION NOT YET REQUESTED
    // ========================================

    enablePushNotificationsButton.disabled =
        false;

    enablePushNotificationsButton.textContent =
        "Enable Notifications";


    if (
        shouldUseMobilePushNotifications()
    ) {

        setPushNotificationStatus(
            "Enable alerts for visit updates, messages, reports, and booking activity."
        );

    } else {

        setPushNotificationStatus(
            "Enable browser notifications on this device."
        );

    }

}

// ========================================
// REQUEST NOTIFICATION PERMISSION
// ========================================

async function enablePushNotifications() {

    if (
        !enablePushNotificationsButton
    ) {

        return;

    }


    if (
        !browserSupportsPushNotifications()
    ) {

        return;

    }


    enablePushNotificationsButton.disabled =
        true;

    enablePushNotificationsButton.textContent =
        "Enabling...";


    try {

        let permission =
            Notification.permission;


        if (
            permission ===
            "default"
        ) {

            permission =
                await Notification
                    .requestPermission();

        }


        if (
            permission !==
            "granted"
        ) {

            await updatePushNotificationUI();


            return;

        }


        const subscription =
            await ensurePushSubscription();


        console.log(
            "Push subscription ready:",
            subscription.endpoint
        );


        await updatePushNotificationUI();

    }
    catch (
        error
    ) {

        console.error(
            "Push notification setup error:",
            error
        );


        enablePushNotificationsButton.disabled =
            false;

        enablePushNotificationsButton.textContent =
            "Enable Notifications";


        setPushNotificationStatus(
            "We couldn't finish setting up notifications on this device."
        );

    }

}

// ========================================
// CLIENT NOTIFICATION PREFERENCES
// ========================================

const clientPushPreferenceInputs =
    Array.from(
        document.querySelectorAll(
            "[data-client-push-preference]"
        )
    );


const DEFAULT_CLIENT_NOTIFICATION_PREFERENCES = {

    visit_started:
        true,

    visit_completed:
        true,

    visit_reports:
        true,

    messages:
        true,

    booking_updates:
        true,

    cancellations:
        true

};


const CLIENT_NOTIFICATION_PREFERENCE_KEYS =
    new Set(
        Object.keys(
            DEFAULT_CLIENT_NOTIFICATION_PREFERENCES
        )
    );


// ========================================
// DISABLE / ENABLE PREFERENCE INPUTS
// ========================================

function setClientNotificationPreferenceInputsDisabled(
    disabled
) {

    clientPushPreferenceInputs.forEach(
        input => {

            input.disabled =
                Boolean(
                    disabled
                );

        }
    );

}


// ========================================
// RENDER CLIENT NOTIFICATION PREFERENCES
// ========================================

function renderClientNotificationPreferences(
    preferences
) {

    clientPushPreferenceInputs.forEach(
        input => {

            const preferenceKey =
                input.dataset
                    .clientPushPreference;


            if (
                !CLIENT_NOTIFICATION_PREFERENCE_KEYS.has(
                    preferenceKey
                )
            ) {

                return;

            }


            input.checked =
                preferences[
                    preferenceKey
                ] !==
                false;

        }
    );

}


// ========================================
// LOAD CLIENT NOTIFICATION PREFERENCES
// ========================================

async function loadClientNotificationPreferences() {

    if (
        !currentUser?.id
    ) {

        return;

    }


    setClientNotificationPreferenceInputsDisabled(
        true
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "client_notification_preferences"
                )
                .select(
                    [
                        "user_id",
                        "visit_started",
                        "visit_completed",
                        "visit_reports",
                        "messages",
                        "booking_updates",
                        "cancellations"
                    ].join(",")
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle();


        if (
            error
        ) {

            throw error;

        }


        // ========================================
        // CREATE DEFAULT ROW WHEN MISSING
        // ========================================

        if (
            !data
        ) {

            const defaultRow = {

                user_id:
                    currentUser.id,

                ...DEFAULT_CLIENT_NOTIFICATION_PREFERENCES

            };


            const {
                data:
                    createdPreferences,

                error:
                    createError
            } =
                await supabaseClient
                    .from(
                        "client_notification_preferences"
                    )
                    .insert(
                        defaultRow
                    )
                    .select(
                        [
                            "user_id",
                            "visit_started",
                            "visit_completed",
                            "visit_reports",
                            "messages",
                            "booking_updates",
                            "cancellations"
                        ].join(",")
                    )
                    .single();


            if (
                createError
            ) {

                throw createError;

            }


            renderClientNotificationPreferences(
                createdPreferences
            );


            return;

        }


        renderClientNotificationPreferences(
            data
        );

    }
    catch (
        error
    ) {

        console.error(
            "Client notification preferences load error:",
            error
        );

    }
    finally {

        setClientNotificationPreferenceInputsDisabled(
            false
        );

    }

}


// ========================================
// SAVE CLIENT NOTIFICATION PREFERENCE
// ========================================

async function saveClientNotificationPreference(
    input
) {

    if (
        !currentUser?.id ||
        !input
    ) {

        return;

    }


    const preferenceKey =
        input.dataset
            .clientPushPreference;


    if (
        !CLIENT_NOTIFICATION_PREFERENCE_KEYS.has(
            preferenceKey
        )
    ) {

        return;

    }


    const newValue =
        Boolean(
            input.checked
        );


    const previousValue =
        !newValue;


    input.disabled =
        true;


    try {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "client_notification_preferences"
                )
                .update(
                    {
                        [preferenceKey]:
                            newValue,

                        updated_at:
                            new Date()
                                .toISOString()
                    }
                )
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (
            error
        ) {

            throw error;

        }


        console.log(
            "Client notification preference saved:",
            {
                preference:
                    preferenceKey,

                enabled:
                    newValue
            }
        );

    }
    catch (
        error
    ) {

        console.error(
            "Client notification preference save error:",
            error
        );


        input.checked =
            previousValue;

    }
    finally {

        input.disabled =
            false;

    }

}

// ========================================
// PREFERENCE CHANGE LISTENERS
// ========================================

clientPushPreferenceInputs.forEach(
    input => {

        input.addEventListener(
            "change",
            () => {

                saveClientNotificationPreference(
                    input
                );

            }
        );

    }
);

// ========================================
// LOAD PREFERENCES WHEN SETTINGS OPEN
// ========================================

clientNotificationsToggle
    ?.addEventListener(
        "click",
        () => {

            loadClientNotificationPreferences();

        }
    );

// ========================================
// PUSH NOTIFICATION BUTTON
// ========================================

updateClientPushSettingsCardVisibility();


if (
    enablePushNotificationsButton
) {

    enablePushNotificationsButton
        .addEventListener(
            "click",
            enablePushNotifications
        );


    updatePushNotificationUI();

}

// ========================================
// MOBILE PWA NOTIFICATION SETTINGS
// ========================================
//
// Push notification settings are now opened
// manually from the Profile screen.
//
// Do not automatically open the notification
// settings modal when the PWA launches.
// ========================================


// ========================================
// PWA SERVICE WORKER
// ========================================

async function registerPawsInStrideServiceWorker() {

    if (
        !(
            "serviceWorker" in navigator
        )
    ) {

        console.log(
            "Service workers are not supported in this browser."
        );


        return;

    }


    try {

        const registration =
            await navigator
                .serviceWorker
                .register(
                    "/portal/service-worker.js",
                    {
                        scope:
                            "/portal/",

                        updateViaCache:
                            "none"
                    }
                );


        await registration
            .update();


        console.log(
            "Paws in Stride service worker registered:",
            registration.scope
        );

    }
    catch (error) {

        console.error(
            "Paws in Stride service worker registration failed:",
            error
        );

    }

}

window.addEventListener(
    "load",
    () => {

        registerPawsInStrideServiceWorker();

    }
);

// ========================================
// WATCH MESSAGE BADGE
// ========================================

const clientMessageBadgeObserver =
    new MutationObserver(
        syncClientNavigationMessageBadge
    );


const clientMessageBadge =
    document.getElementById(
        "client-message-unread-badge"
    );


if (clientMessageBadge) {

    clientMessageBadgeObserver.observe(
        clientMessageBadge,
        {

            childList:
                true,

            attributes:
                true,

            characterData:
                true,

            subtree:
                true

        }
    );

    syncClientNavigationMessageBadge();

}

// ========================================
// PET WALK STATS
// ========================================
//
// Paste this entire block at the BOTTOM of
// portal.js.
//
// It reads from data the portal already loads
// (currentPets, currentVisits, currentVisitPets)
// plus two extra queries:
//
// - visit_walks   (completed GPS walks)
// - visit_photos  (visit photo counts)
//
// Nothing new needs to be entered per pet.
// ========================================


// ========================================
// DISTANCE MILESTONES
// ========================================
//
// Measure your own local loops in Google Maps
// and add them here. The biggest milestone the
// pet has passed at least once is used, as long
// as the count stays reasonable.
// ========================================

const PET_STAT_MILESTONES = [

    {
        single: "a football field",
        plural: "football fields",
        miles: 0.057
    },

    {
        single: "a lap around a running track",
        plural: "laps around a running track",
        miles: 0.25
    },

    {
        single: "a lap around Toyota Stadium",
        plural: "laps around Toyota Stadium",
        miles: 0.5
    },

    {
        single: "a lap around Frisco Commons",
        plural: "laps around Frisco Commons Park",
        miles: 1.1
    },

    {
        single: "the trip to downtown Dallas",
        plural: "trips to downtown Dallas",
        miles: 27
    },

    {
        single: "a lap around the city of Frisco",
        plural: "laps around the city of Frisco",
        miles: 34
    }

];


const METERS_PER_MILE =
    1609.344;


// ========================================
// PET STATS STATE
// ========================================

let currentPetStats =
    new Map();


// ========================================
// WALKING SERVICE CHECK
// ========================================

function isWalkingServiceVisit(
    visit
) {

    const serviceType =
        String(
            visit?.service_type ||
            ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /_/g,
                " "
            );


    const serviceName =
        String(
            visit?.service_name ||
            ""
        )
            .trim()
            .toLowerCase();


    return (
        serviceType ===
            "dog walking" ||
        serviceName.startsWith(
            "dog walking"
        )
    );

}


// ========================================
// COMPLETED VISIT CHECK
// ========================================

function isCompletedVisit(
    visit
) {

    const status =
        String(
            visit?.status ||
            ""
        )
            .trim()
            .toLowerCase();


    return (
        status ===
            "completed" ||
        Boolean(
            visit?.completed_at
        )
    );

}


// ========================================
// LOAD PET STATS
// ========================================

async function loadPetStats() {

    currentPetStats =
        new Map();


    if (
        !currentUser?.id ||
        currentPets.length === 0
    ) {

        return;

    }


    // ========================================
    // COMPLETED VISITS ONLY
    // ========================================

    const completedVisits =
        currentVisits.filter(
            isCompletedVisit
        );


    if (
        completedVisits.length === 0
    ) {

        return;

    }


    const completedVisitIds =
        completedVisits.map(
            visit =>
                Number(
                    visit.id
                )
        );


    // ========================================
    // LOAD WALKS + PHOTOS
    // ========================================

    let walkRows =
        [];


    let photoRows =
        [];


    try {

        const [
            walkResult,
            photoResult
        ] =
            await Promise.all([

                supabaseClient
                    .from(
                        "visit_walks"
                    )
                    .select(
                        "id, visit_id, status, duration_seconds, distance_meters, ended_at"
                    )
                    .in(
                        "visit_id",
                        completedVisitIds
                    )
                    .eq(
                        "status",
                        "completed"
                    ),

                supabaseClient
                    .from(
                        "visit_photos"
                    )
                    .select(
                        "id, visit_id, photo_type"
                    )
                    .in(
                        "visit_id",
                        completedVisitIds
                    )
                    .eq(
                        "photo_type",
                        "visit"
                    )

            ]);


        if (
            walkResult.error
        ) {

            throw walkResult.error;

        }


        if (
            photoResult.error
        ) {

            throw photoResult.error;

        }


        walkRows =
            walkResult.data ||
            [];


        photoRows =
            photoResult.data ||
            [];

    }
    catch (
        error
    ) {

        console.error(
            "Pet stats load error:",
            error
        );


        return;

    }


    // ========================================
    // INDEX VISITS
    // ========================================

    const visitsById =
        new Map(
            completedVisits.map(
                visit => [
                    Number(
                        visit.id
                    ),
                    visit
                ]
            )
        );


    const walksByVisitId =
        new Map(
            walkRows.map(
                walk => [
                    Number(
                        walk.visit_id
                    ),
                    walk
                ]
            )
        );


    const photoCountByVisitId =
        new Map();


    photoRows.forEach(
        photo => {

            const visitId =
                Number(
                    photo.visit_id
                );


            photoCountByVisitId.set(
                visitId,
                (
                    photoCountByVisitId.get(
                        visitId
                    ) || 0
                ) + 1
            );

        }
    );


    // ========================================
    // CURRENT MONTH
    // ========================================

    const now =
        new Date();


    const monthPrefix =
        `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`;


    // ========================================
    // BUILD STATS PER PET
    // ========================================

    currentPets.forEach(
        pet => {

            const petId =
                Number(
                    pet.id
                );


            const petVisitIds =
                currentVisitPets
                    .filter(
                        relation =>
                            Number(
                                relation.pet_id
                            ) === petId
                    )
                    .map(
                        relation =>
                            Number(
                                relation.visit_id
                            )
                    );


            // ========================================
            // LEGACY SINGLE-PET VISITS
            // ========================================

            completedVisits.forEach(
                visit => {

                    if (
                        Number(
                            visit.pet_id
                        ) === petId &&
                        !petVisitIds.includes(
                            Number(
                                visit.id
                            )
                        )
                    ) {

                        petVisitIds.push(
                            Number(
                                visit.id
                            )
                        );

                    }

                }
            );


            let walkCount =
                0;

            let walksThisMonth =
                0;

            let totalMeters =
                0;

            let totalSeconds =
                0;

            let photoCount =
                0;

            let longestWalk =
                null;


            petVisitIds.forEach(
                visitId => {

                    const visit =
                        visitsById.get(
                            visitId
                        );


                    if (
                        !visit
                    ) {

                        return;

                    }


                    photoCount +=
                        photoCountByVisitId.get(
                            visitId
                        ) || 0;


                    const walk =
                        walksByVisitId.get(
                            visitId
                        );


                    if (
                        !walk ||
                        !isWalkingServiceVisit(
                            visit
                        )
                    ) {

                        return;

                    }


                    walkCount += 1;


                    const meters =
                        Number(
                            walk.distance_meters ||
                            0
                        );


                    const seconds =
                        Number(
                            walk.duration_seconds ||
                            0
                        );


                    totalMeters +=
                        meters;


                    totalSeconds +=
                        seconds;


                    if (
                        String(
                            visit.visit_date ||
                            ""
                        ).startsWith(
                            monthPrefix
                        )
                    ) {

                        walksThisMonth += 1;

                    }


                    if (
                        !longestWalk ||
                        meters >
                            longestWalk.meters
                    ) {

                        longestWalk = {

                            meters,

                            visitDate:
                                visit.visit_date

                        };

                    }

                }
            );


            currentPetStats.set(
                petId,
                {

                    walkCount,

                    walksThisMonth,

                    miles:
                        totalMeters /
                        METERS_PER_MILE,

                    hours:
                        totalSeconds /
                        3600,

                    photoCount,

                    longestWalk,

                    hasVisits:
                        petVisitIds.some(
                            visitId =>
                                visitsById.has(
                                    visitId
                                )
                        )

                }
            );

        }
    );


    console.log(
        "Pet stats loaded:",
        currentPetStats.size
    );

}


// ========================================
// GET PET STATS
// ========================================

function getPetStats(
    petId
) {

    return (
        currentPetStats.get(
            Number(
                petId
            )
        ) ||
        null
    );

}


// ========================================
// MILESTONE LINE
// ========================================

function getPetMilestoneText(
    totalMiles
) {

    const miles =
        Number(
            totalMiles ||
            0
        );


    const reached =
        PET_STAT_MILESTONES.filter(
            milestone =>
                miles /
                    milestone.miles >=
                1
        );


    if (
        reached.length === 0
    ) {

        return "";

    }


    const milestone =
        reached
            .slice()
            .reverse()
            .find(
                item =>
                    miles /
                        item.miles <=
                    25
            ) ||
        reached[0];


    const count =
        Math.floor(
            miles /
            milestone.miles
        );


    if (
        count === 1
    ) {

        return `That's ${milestone.single} — done!`;

    }


    return `That's ${count} ${milestone.plural}.`;

}


// ========================================
// STAT FORMATTERS
// ========================================

function formatPetStatMiles(
    miles
) {

    const value =
        Number(
            miles ||
            0
        );


    return value >= 100
        ? String(
            Math.round(
                value
            )
        )
        : value.toFixed(
            1
        );

}


function formatPetStatHours(
    hours
) {

    const value =
        Number(
            hours ||
            0
        );


    if (
        value < 1
    ) {

        return `${Math.max(
            1,
            Math.round(
                value * 60
            )
        )}m`;

    }


    return `${Math.round(
        value
    )}h`;

}


function formatPetStatDate(
    dateString
) {

    if (
        !dateString
    ) {

        return "";

    }


    return parseLocalDate(
        dateString
    ).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );

}


// ========================================
// BUILD PET STATS HTML
// ========================================
//
// Returns an empty string when the pet has no
// recorded walks, so drop-in, pet sitting, and
// boarding pets simply don't show this block.
// ========================================

function buildPetStatsHtml(
    pet
) {

    const stats =
        getPetStats(
            pet?.id
        );


    if (
        !stats ||
        stats.walkCount === 0
    ) {

        return "";

    }


    const milestoneText =
        getPetMilestoneText(
            stats.miles
        );


    const longestWalkText =
        stats.longestWalk

            ? `${formatPetStatMiles(
                stats.longestWalk.meters /
                METERS_PER_MILE
            )} mi &nbsp;·&nbsp; ${escapeHtml(
                formatPetStatDate(
                    stats.longestWalk.visitDate
                )
            )}`

            : "—";


    return `

        <div class="pet-stats-block">


            <div class="pet-stats-heading">

                <span class="pet-stats-label">
                    Walk Stats
                </span>

                <span class="pet-stats-scope">
                    All time
                </span>

            </div>


            <div class="pet-stats-tiles">

                <div class="pet-stats-tile">

                    <strong>
                        ${stats.walkCount}
                    </strong>

                    <span>
                        Walks
                    </span>

                </div>


                <div class="pet-stats-tile">

                    <strong>
                        ${formatPetStatMiles(
                            stats.miles
                        )}
                    </strong>

                    <span>
                        Miles
                    </span>

                </div>


                <div class="pet-stats-tile">

                    <strong>
                        ${formatPetStatHours(
                            stats.hours
                        )}
                    </strong>

                    <span>
                        Together
                    </span>

                </div>

            </div>


            ${
                milestoneText

                    ? `
                        <div class="pet-stats-milestone">

                            <span
                                class="pet-stats-milestone-icon"
                                aria-hidden="true"
                            >
                                🐾
                            </span>

                            <span>
                                ${escapeHtml(
                                    milestoneText
                                )}
                            </span>

                        </div>
                    `

                    : ""
            }


            <div class="pet-stats-records">

                <div class="pet-stats-record">

                    <span>
                        Walks this month
                    </span>

                    <strong>
                        ${stats.walksThisMonth}
                    </strong>

                </div>


                <div class="pet-stats-record">

                    <span>
                        Longest walk
                    </span>

                    <strong>
                        ${longestWalkText}
                    </strong>

                </div>


                <div class="pet-stats-record">

                    <span>
                        Photos received
                    </span>

                    <strong>
                        ${stats.photoCount}
                    </strong>

                </div>

            </div>


        </div>

    `;

}

// ========================================
// DESKTOP SECTION NAVIGATION
// ========================================
//
// Paste this block at the BOTTOM of portal.js,
// below the pet stats block.
//
// Desktop (1024px and up) shows one section at
// a time from the sidebar, the same way the
// mobile tabs already work.
//
// Mobile behaviour is untouched: every function
// here exits immediately below 1024px.
// ========================================


const desktopLayoutQuery =
    window.matchMedia(
        "(min-width: 1024px)"
    );


const DESKTOP_SCREENS = [
    "home",
    "services",
    "pets",
    "profile"
];


let activeDesktopScreen =
    "home";


// ========================================
// SET DESKTOP SCREEN
// ========================================

function setDesktopScreen(
    screen
) {

    if (
        !DESKTOP_SCREENS.includes(
            screen
        )
    ) {

        return;

    }


    activeDesktopScreen =
        screen;


    DESKTOP_SCREENS.forEach(
        name => {

            document.body.classList.toggle(
                `desktop-screen-${name}`,
                name === screen
            );

        }
    );


    // ========================================
    // SIDEBAR ACTIVE STATE
    // ========================================

    document
        .querySelectorAll(
            "[data-client-desktop-tab]"
        )
        .forEach(
            button => {

                const isActive =
                    button.dataset
                        .clientDesktopTab ===
                    screen;


                button.classList.toggle(
                    "is-active",
                    isActive
                );


                if (
                    isActive
                ) {

                    button.setAttribute(
                        "aria-current",
                        "page"
                    );

                } else {

                    button.removeAttribute(
                        "aria-current"
                    );

                }

            }
        );


    // ========================================
    // CLOSE REQUEST SERVICE WHEN LEAVING
    // ========================================

    if (
        screen !== "services" &&
        bookingSection
    ) {

        bookingSection.style.display =
            "none";

    }


    // ========================================
    // REFRESH HOME CONTENT
    // ========================================

    if (
        screen === "home"
    ) {

        renderMobileHomeDashboard();

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ========================================
// SIDEBAR CLICKS
// ========================================

document
    .getElementById(
        "client-desktop-sidebar"
    )
    ?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-client-desktop-tab]"
                );


            if (
                !button
            ) {

                return;

            }


            closeClientMessaging();


            setDesktopScreen(
                button.dataset
                    .clientDesktopTab
            );

        }
    );


// ========================================
// SIDEBAR CLIENT DETAILS
// ========================================

function updateDesktopSidebarClient() {

    const nameElement =
        document.getElementById(
            "client-desktop-sidebar-name"
        );


    const creditElement =
        document.getElementById(
            "client-desktop-sidebar-credit"
        );


    if (
        nameElement
    ) {

        nameElement.textContent =
            currentProfile?.full_name ||
            "Client";

    }


    if (
        creditElement
    ) {

        const creditText =
            document.getElementById(
                "household-display-credit"
            )?.textContent ||
            "";


        const creditCardVisible =
            document.getElementById(
                "household-credit-card"
            )?.style.display !==
            "none";


        creditElement.textContent =
            creditCardVisible &&
            creditText

                ? `Account credit ${creditText}`

                : "";

    }

}


// ========================================
// ROUTE EXISTING TAB CALLS TO DESKTOP
// ========================================
//
// handleMobileAppTab() is already called from
// the notification center, the Home quick
// actions, and the latest update card.
//
// On desktop those calls previously did
// nothing. This wrapper sends them to the
// matching desktop screen instead, so every
// existing link keeps working.
// ========================================

const originalHandleMobileAppTab =
    handleMobileAppTab;


handleMobileAppTab =
    async function (
        tab
    ) {

        if (
            !desktopLayoutQuery.matches
        ) {

            return originalHandleMobileAppTab(
                tab
            );

        }


        if (
            tab === "messages"
        ) {

            await openClientMessaging();


            return;

        }


        setDesktopScreen(
            tab
        );

    };


// ========================================
// REQUEST SERVICE OPENS THE SERVICES SCREEN
// ========================================

document
    .getElementById(
        "request-walk-button"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                !desktopLayoutQuery.matches
            ) {

                return;

            }


            setDesktopScreen(
                "services"
            );

        }
    );


// ========================================
// KEEP SCREENS TIDY ACROSS BREAKPOINTS
// ========================================

function syncDesktopLayoutState() {

    if (
        desktopLayoutQuery.matches
    ) {

        setDesktopScreen(
            activeDesktopScreen
        );


        updateDesktopSidebarClient();


        return;

    }


    // ========================================
    // LEAVING DESKTOP — DROP THE CLASSES
    // ========================================

    DESKTOP_SCREENS.forEach(
        name => {

            document.body.classList.remove(
                `desktop-screen-${name}`
            );

        }
    );

}


desktopLayoutQuery.addEventListener(
    "change",
    syncDesktopLayoutState
);


// ========================================
// START ON HOME
// ========================================

window.setTimeout(
    syncDesktopLayoutState,
    0
);
