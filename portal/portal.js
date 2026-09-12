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


    // VISIT PET RELATIONSHIPS

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

    const container =
        document.getElementById(
            "household-display-credit"
        );


    if (!container) {
        return;
    }


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


        container.textContent =
            balance.toLocaleString(
                "en-US",
                {
                    style: "currency",
                    currency: "USD"
                }
            );

    }
    catch (error) {

        console.error(
            "Credit balance error:",
            error
        );


        container.textContent =
            "$0.00";

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
// PROPERTY ACCESS COLLAPSE TOGGLE
// ========================================

const propertyAccessToggle =
    document.getElementById(
        "property-access-toggle"
    );


const propertyAccessContent =
    document.getElementById(
        "property-access-content"
    );


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


            const emergencyPhoneField =
                document.getElementById(
                    "emergency-contact-phone"
                );


            if (message) {

                message.textContent =
                    "";

            }


            clearHouseholdFieldErrors();


            const fullName =
                String(
                    fullNameField?.value ||
                    ""
                )
                    .trim();


            const phone =
                String(
                    phoneField?.value ||
                    ""
                )
                    .trim();


            const streetAddress =
                String(
                    streetAddressField?.value ||
                    ""
                )
                    .trim();


            const city =
                String(
                    cityField?.value ||
                    ""
                )
                    .trim();


            const state =
                String(
                    stateField?.value ||
                    ""
                )
                    .trim();


            const zip =
                String(
                    zipField?.value ||
                    ""
                )
                    .trim();


            const emergencyPhone =
                String(
                    emergencyPhoneField?.value ||
                    ""
                )
                    .trim();


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
                        valueOrNull(
                            "household-street-address"
                        ),

                    address_line_2:
                        valueOrNull(
                            "household-address-line-2"
                        ),

                    city:
                        valueOrNull(
                            "household-city"
                        ),

                    state:
                        valueOrNull(
                            "household-state"
                        ),

                    zip_code:
                        valueOrNull(
                            "household-zip"
                        ),

                    preferred_contact_method:
                        valueOrNull(
                            "household-preferred-contact"
                        ),

                    emergency_contact_name:
                        valueOrNull(
                            "emergency-contact-name"
                        ),

                    emergency_contact_phone:
                        valueOrNull(
                            "emergency-contact-phone"
                        ),

                    home_notes:
                        valueOrNull(
                            "household-home-notes"
                        ),

                    updated_at:
                        new Date()
                            .toISOString()

                };


                const {
                    error: householdSaveError
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
                    householdSaveError
                ) {

                    throw householdSaveError;

                }


                // ========================================
                // SAVE PROPERTY ACCESS
                // ========================================

                const accessPayload = {

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
                        ),

                    updated_at:
                        new Date()
                            .toISOString()

                };


                const {
                    error: accessSaveError
                } =
                    await supabaseClient
                        .from(
                            "property_access"
                        )
                        .upsert(
                            accessPayload,
                            {
                                onConflict:
                                    "client_id"
                            }
                        );


                if (
                    accessSaveError
                ) {

                    throw accessSaveError;

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

removePetButton
    ?.addEventListener(
        "click",
        async () => {

            if (
                !editingPet
            ) {
                return;
            }


            const petName =
                editingPet.name ||
                "this pet";


            const confirmed =
                window.confirm(
                    `Remove ${petName} from your household?\n\n${petName} will be removed from Your Pets and future booking options. Any upcoming services scheduled only for ${petName} will also be cancelled. If ${petName} is part of a multi-pet booking, the other pets will remain scheduled. Past service history will be kept.`
                );


            if (
                !confirmed
            ) {
                return;
            }


            const message =
                document.getElementById(
                    "pet-form-message"
                );


            removePetButton.disabled =
                true;


            removePetButton.textContent =
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


                removePetButton.disabled =
                    false;


                removePetButton.textContent =
                    "Remove Pet";

            }

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


            const name =
                document
                    .getElementById(
                        "pet-name"
                    )
                    .value
                    .trim();


            if (!name) {

                message.textContent =
                    "Please enter your pet's name.";

                return;

            }


            const payload = {

                name,

                breed:
                    valueOrNull(
                        "pet-breed"
                    ),

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

                if (
                    currentServicePrices
                        .length === 0
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


            const element =
                document.createElement(
                    "option"
                );


            element.value =
                option.value;


            if (pricing) {

                const price =
                    Number(
                        pricing.base_price
                    );


                element.textContent =
                    `${option.value} — $${formatServicePrice(price)}`;


                element.dataset.price =
                    String(price);

            } else {

                element.textContent =
                    option.value;


                element.dataset.price =
                    "0";

            }


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


    wrapper.style.display =
        "block";


    document.getElementById(
        "time-window-label"
    ).textContent =
        "Preferred Time Window";


    bookingTime.innerHTML =
        `
            <option value="">
                Select a time window
            </option>
        `;


    selectedDateCapacityConflicts.clear();


    lastSelectedTimeWindow =
        "";


    clearTimeWindowConflictError();


    clearTimeWindowCapacityHelp();


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


            bookingTime.appendChild(
                option
            );

        }
    );


    renderSelectedDates();


    await refreshPreferredTimeWindowAvailability();

}


// ========================================
// UPDATE SELECTED VISITS WHEN TIME CHANGES
// ========================================
//
// Changing the dropdown does NOT modify any
// visits that are already selected.
//
// It only changes the active time window used
// when the customer clicks another calendar
// date.
//
// The calendar must redraw so selected dates
// are highlighted for the currently active
// time window.
// ========================================

bookingTime
    ?.addEventListener(
        "change",
        () => {

            // ========================================
            // CLIENT SELECTED A TIME WINDOW
            // ========================================

            if (
                bookingTime.value
            ) {

                lastSelectedTimeWindow =
                    bookingTime.value;


                clearTimeWindowConflictError();


                renderSelectedDates();

                renderBookingCalendar();

                updateBookingTotal();


                return;

            }


            // ========================================
            // CLIENT CLEARED TIME WINDOW
            // ========================================

            lastSelectedTimeWindow =
                "";


            clearTimeWindowConflictError();


            renderSelectedDates();

            renderBookingCalendar();

            updateBookingTotal();

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
        firstDay.getDay() - 1;


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
        // SELECTED DATE FOR ACTIVE TIME WINDOW
        // ========================================
        
        const activeTimeWindow =
            bookingTime?.value ||
            lastSelectedTimeWindow ||
            "";
        
        
        const isSelectedForActiveWindow =
            Boolean(
                activeTimeWindow
            ) &&
            selectedVisits.some(
                visit =>
                    visit.date ===
                        date
                    &&
                    visit.timeWindow ===
                        activeTimeWindow
            );
        
        
        if (
            isSelectedForActiveWindow
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

    const selectedTimeWindow =
        bookingTime?.value ||
        lastSelectedTimeWindow ||
        "";


    // ========================================
    // REQUIRE A TIME WINDOW FIRST
    // ========================================

    if (
        !selectedTimeWindow
    ) {

        if (
            bookingTime
        ) {

            bookingTime.focus();

        }


        return;

    }


    // ========================================
    // FIND EXACT DATE + TIME MATCH
    // ========================================

    const existingVisitIndex =
        selectedVisits.findIndex(
            visit =>
                visit.date ===
                    date
                &&
                visit.timeWindow ===
                    selectedTimeWindow
        );


    // ========================================
    // REMOVE EXACT VISIT
    // ========================================

    if (
        existingVisitIndex !==
        -1
    ) {

        const removedVisit =
            selectedVisits[
                existingVisitIndex
            ];


        selectedVisits.splice(
            existingVisitIndex,
            1
        );


        selectedDateCapacityConflicts.delete(
            getSelectedVisitCapacityKey(
                removedVisit.date,
                removedVisit.timeWindow
            )
        );

    } else {

        // ========================================
        // ADD NEW DATE + TIME VISIT
        // ========================================

        selectedVisits.push({
            date:
                date,

            timeWindow:
                selectedTimeWindow
        });

    }


    // ========================================
    // SORT SELECTED VISITS
    // ========================================

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


    // ========================================
    // KEEP LEGACY DATE ARRAY SYNCHRONIZED
    // ========================================

    selectedDates =
        [
            ...new Set(
                selectedVisits.map(
                    visit =>
                        visit.date
                )
            )
        ].sort();


    renderSelectedDates();

    renderBookingCalendar();

}


// ========================================
// SELECTED VISITS
// ========================================

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
    // VISIT COUNT
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
        selectedVisits.length === 0
    ) {

        list.innerHTML =
            `
                <p class="empty-dates-message">
                    No visits selected yet.
                </p>
            `;

    } else {

        // ========================================
        // RENDER EACH DATE + TIME VISIT
        // ========================================

        list.innerHTML =
            selectedVisits
                .map(
                    (
                        visit,
                        index
                    ) => {

                        const hasConflict =
                            hasSelectedVisitCapacityConflict(
                                visit.date,
                                visit.timeWindow
                            );

                        return `
                            <div
                                class="
                                    selected-date-item
                                    ${
                                        hasConflict
                                            ? "selected-date-item-conflict"
                                            : ""
                                    }
                                "
                            >

                                <div class="selected-visit-summary">

                                    <strong class="selected-visit-date">
                                        ${formatDate(
                                            visit.date
                                        )}
                                    </strong>

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
                                            ${visit.timeWindow}
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
                                    data-visit-index="${index}"
                                >
                                    Remove
                                </button>

                            </div>
                        `;

                    }
                )
                .join("");


    // ========================================
    // REMOVE SELECTED VISIT
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
    
    
                        // ========================================
                        // CLEAR EXACT VISIT CAPACITY CONFLICT
                        // ========================================
    
                        selectedDateCapacityConflicts.delete(
                            getSelectedVisitCapacityKey(
                                removedVisit.date,
                                removedVisit.timeWindow
                            )
                        );
    
    
                        // ========================================
                        // REBUILD LEGACY DATE ARRAY
                        // ========================================

                            selectedDates =
                                [
                                    ...new Set(
                                        selectedVisits.map(
                                            visit =>
                                                visit.date
                                        )
                                    )
                                ].sort();


                            renderSelectedDates();

                            renderBookingCalendar();

                        }
                    );

                }
            );

    }


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


                const visitTotal =
                    basePrice +
                    additionalPetFee +
                    surcharge +
                    visitHolidayFee;


                return {

                    ...visit,

                    surcharge,

                    holidayName,

                    holidayFee:
                        visitHolidayFee,

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

    const today =
        getLocalDateString();


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


    const ids =
        currentVisits.map(
            visit =>
                visit.id
        );


    if (
        ids.length > 0
    ) {

        const {
            data: relationData,
            error: relationError
        } =
            await supabaseClient
                .from("visit_pets")
                .select(
                    "visit_id, pet_id, is_primary, additional_pet_fee"
                )
                .in(
                    "visit_id",
                    ids
                );


        if (!relationError) {

            currentVisitPets =
                relationData || [];

        }

    }


    renderUpcomingCalendar();

    renderSelectedUpcomingServices();

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
                    month: "long",
                    year: "numeric"
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
        firstDay.getDay() - 1;


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


        const serviceCount =
            currentVisits.filter(
                visit =>
                    visit.visit_date ===
                        date &&
                    String(
                        visit.status || ""
                    )
                        .trim()
                        .toLowerCase() !==
                        "cancelled"
            ).length;


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
            date === today
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
                            <span class="upcoming-service-count">
                                ${serviceCount}
                            </span>
                        `
                        : ""
                }
            `;


        button.addEventListener(
            "click",
            () => {

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
                    )
                        .trim()
                        .toLowerCase() !==
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
// CLIENT VISIT REPORT ACTIONS
// ========================================

document
    .getElementById(
        "selected-upcoming-services"
    )
    ?.addEventListener(
        "click",
        async event => {


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
// TOGGLE CLIENT VISIT REPORT
// ========================================

async function toggleClientVisitReport(
    visitId,
    button
) {


    const mount =
        document.getElementById(
            `client-visit-report-${visitId}`
        );


    if (
        !mount
    ) {

        return;

    }


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


        const [
            reportResult,
            mediaResult
        ] =
            await Promise.all([


                supabaseClient
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
                    .maybeSingle(),


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
                    )


            ]);


        if (
            reportResult.error
        ) {

            throw reportResult.error;

        }


        if (
            mediaResult.error
        ) {

            throw mediaResult.error;

        }


        const report =
            reportResult.data ||
            null;


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


        renderClientVisitReport(
            mount,
            report,
            mediaWithUrls
        );


    } catch (
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


    const oldMount =
        document.getElementById(
            `client-visit-report-${activeClientVisitReportId}`
        );


    if (
        oldMount
    ) {

        oldMount.innerHTML =
            "";

    }


    const oldButton =
        document.querySelector(
            `[data-client-visit-report-open="${activeClientVisitReportId}"]`
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
    media
) {


    const visitPhotos =
        media.filter(
            item =>
                item.photo_type ===
                "visit"
        );


    const routePhotos =
        media.filter(
            item =>
                item.photo_type ===
                "route"
        );


    const careItems =
        [];


    if (
        report.fed
    ) {

        careItems.push(
            "Fed"
        );

    }


    if (
        report.fresh_water
    ) {

        careItems.push(
            "Fresh Water"
        );

    }


    if (
        report.pee
    ) {

        careItems.push(
            "Pee"
        );

    }


    if (
        report.poop
    ) {

        careItems.push(
            "Poop"
        );

    }


    const careHtml =
        careItems.length

            ? careItems
                .map(
                    item => `

                        <span class="client-visit-report-care-item">

                            <span class="client-visit-report-care-check">
                                ✓
                            </span>

                            ${escapeHtml(
                                item
                            )}

                        </span>

                    `
                )
                .join("")

            : `

                <span class="client-visit-report-muted">
                    No care updates were marked.
                </span>

            `;


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
                .join("")

            : `

                <p class="client-visit-report-muted">
                    No visit photos were added.
                </p>

            `;


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


    const routeHtml =
        routePhotos.length

            ? routePhotos
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
                                    alt="Walk summary"
                                    class="client-visit-report-photo"
                                >

                            </button>

                        `;

                    }
                )
                .join("")

            : `

                <p class="client-visit-report-muted">
                    No walk summary was added.
                </p>

            `;


    mount.innerHTML =
        `

            <div class="client-visit-report">


                <div class="client-visit-report-header">

                    <div>

                        <span class="client-visit-report-eyebrow">
                            VISIT REPORT
                        </span>

                        <h5>
                            Your Pet's Visit
                        </h5>

                        <p>
                            Here's everything from this completed visit.
                        </p>

                    </div>

                </div>


                <div class="client-visit-report-section">

                    <span class="client-visit-report-label">
                        Care Updates
                    </span>


                    <div class="client-visit-report-care-grid">

                        ${careHtml}

                    </div>

                </div>


                <div class="client-visit-report-section">

                    <span class="client-visit-report-label">
                        Notes
                    </span>

                    ${notesHtml}

                </div>


                <div class="client-visit-report-section">

                    <span class="client-visit-report-label">
                        Photos
                    </span>


                    <div class="client-visit-report-photo-grid">

                        ${photosHtml}

                    </div>

                </div>


                <div class="client-visit-report-section">

                    <span class="client-visit-report-label">
                        Walk Summary
                    </span>


                    <div class="client-visit-report-photo-grid">

                        ${routeHtml}

                    </div>

                </div>


            </div>

        `;

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
// LOAD
// ========================================

(async function initializeClientPortal() {

    await loadDashboard();


    if (
        currentUser &&
        currentProfile &&
        String(
            currentProfile.role || ""
        )
            .trim()
            .toLowerCase() !==
            "admin"
    ) {

        await initializeClientMessaging();

    }

})();


// ========================================
// LOGOUT
// ========================================

document
    .getElementById(
        "logout-button"
    )
    ?.addEventListener(
        "click",
        async () => {

            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "./login.html";

        }
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
// SYNC MESSAGE UNREAD BADGE TO MENU
// ========================================

function syncClientNavigationMessageBadge() {

    const messageBadge =
        document.getElementById(
            "client-message-unread-badge"
        );

    const navigationBadge =
        document.getElementById(
            "client-navigation-message-badge"
        );


    if (
        !messageBadge ||
        !navigationBadge
    ) {
        return;
    }


    const unreadCount =
        messageBadge.textContent
            ?.trim() ||
        "0";


    const messageBadgeVisible =
        messageBadge.style.display !==
        "none";


    navigationBadge.textContent =
        unreadCount;


    navigationBadge.style.display =
        messageBadgeVisible
            ? "flex"
            : "none";

}

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


    pushNotificationStatus.style.display =
        message
            ? "block"
            : "none";

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
//
// The browser does NOT directly insert or
// update push_subscriptions.
//
// Instead, the authenticated user claims
// this physical browser/PWA subscription
// through the secure Supabase RPC.
//
// This is important because the same phone
// may previously have been registered while
// another Paws in Stride account was signed
// in.
//
// Example:
//
// Test Client
//     ↓
// Same iPhone PWA
//     ↓
// Log out
//     ↓
// Admin logs in
//     ↓
// Same push endpoint is reassigned to Admin
//
// The server derives the authenticated user
// from auth.uid(). The browser does not get
// to choose another user's ID.
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


    // ========================================
    // CLAIM THIS DEVICE FOR CURRENT USER
    // ========================================

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


    // ========================================
    // CREATE NEW SUBSCRIPTION
    // ========================================

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


    // ========================================
    // SAVE DEVICE TO SUPABASE
    // ========================================

    await savePushSubscription(
        subscription
    );


    return subscription;

}


// ========================================
// UPDATE PUSH NOTIFICATION UI
// ========================================
//
// Push notifications are intended for the
// installed Paws in Stride mobile PWA.
//
// Normal desktop browsers should NEVER
// show the notification setup card.
//
// Normal mobile Safari / Chrome should also
// keep the card hidden unless Paws in Stride
// is actually running as an installed PWA.
//
// If notification permission is already
// granted inside the installed PWA, we still
// silently restore / claim the physical push
// subscription for the currently signed-in
// account.
// ========================================

function isMobileDeviceForPush() {

    // ========================================
    // MODERN MOBILE HINT
    // ========================================

    if (
        navigator.userAgentData
            ?.mobile ===
        true
    ) {

        return true;

    }


    // ========================================
    // MOBILE USER AGENT FALLBACK
    // ========================================

    if (
        /Android|iPhone|iPad|iPod|Mobile/i
            .test(
                navigator.userAgent
            )
    ) {

        return true;

    }


    // ========================================
    // IPADOS DESKTOP-STYLE USER AGENT
    // ========================================

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

    const displayModeStandalone =
        window
            .matchMedia(
                "(display-mode: standalone)"
            )
            .matches;


    const iosStandalone =
        window.navigator
            .standalone ===
        true;


    return (
        displayModeStandalone ||
        iosStandalone
    );

}


function shouldUseMobilePushNotifications() {

    return (
        isMobileDeviceForPush() &&
        isInstalledPawsInStridePWA()
    );

}


async function updatePushNotificationUI() {

    if (
        !pushNotificationCard ||
        !enablePushNotificationsButton
    ) {

        return;

    }


    // ========================================
    // NOT INSTALLED MOBILE PWA
    // ========================================
    //
    // Desktop browsers and ordinary mobile
    // browser tabs should never display this
    // card.
    // ========================================

    if (
        !shouldUseMobilePushNotifications()
    ) {

        pushNotificationCard.style.display =
            "none";


        return;

    }


    // ========================================
    // PUSH NOT SUPPORTED
    // ========================================

    if (
        !browserSupportsPushNotifications()
    ) {

        pushNotificationCard.style.display =
            "none";


        return;

    }


    // ========================================
    // PERMISSION ALREADY GRANTED
    // ========================================
    //
    // Do not show a setup prompt.
    //
    // Silently make sure this physical PWA
    // subscription belongs to whichever user
    // is currently signed in.
    // ========================================

    if (
        Notification.permission ===
        "granted"
    ) {

        try {

            await ensurePushSubscription();


            pushNotificationCard.style.display =
                "none";

        }
        catch (error) {

            console.error(
                "Existing push subscription setup error:",
                error
            );


            pushNotificationCard.style.display =
                "flex";


            enablePushNotificationsButton.textContent =
                "Finish Notification Setup";


            enablePushNotificationsButton.disabled =
                false;


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

        pushNotificationCard.style.display =
            "flex";


        enablePushNotificationsButton.textContent =
            "Notifications Blocked";


        enablePushNotificationsButton.disabled =
            true;


        setPushNotificationStatus(
            "Notifications are currently blocked for Paws in Stride on this device."
        );


        return;

    }


    // ========================================
    // PERMISSION NOT YET REQUESTED
    // ========================================

    pushNotificationCard.style.display =
        "flex";


    enablePushNotificationsButton.textContent =
        "Enable Notifications";


    enablePushNotificationsButton.disabled =
        false;


    setPushNotificationStatus(
        ""
    );

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


    // ========================================
    // INSTALLED MOBILE PWA ONLY
    // ========================================

    if (
        !shouldUseMobilePushNotifications()
    ) {

        if (
            pushNotificationCard
        ) {

            pushNotificationCard.style.display =
                "none";

        }


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


        // ========================================
        // ASK FOR PERMISSION
        // ========================================

        if (
            permission ===
            "default"
        ) {

            permission =
                await Notification
                    .requestPermission();

        }


        // ========================================
        // PERMISSION NOT GRANTED
        // ========================================

        if (
            permission !==
            "granted"
        ) {

            await updatePushNotificationUI();


            return;

        }


        // ========================================
        // CREATE + SAVE SUBSCRIPTION
        // ========================================

        const subscription =
            await ensurePushSubscription();


        console.log(
            "Push subscription ready:",
            subscription.endpoint
        );


        // ========================================
        // HIDE SETUP PROMPT
        // ========================================

        pushNotificationCard.style.display =
            "none";

    }
    catch (error) {

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
// PUSH NOTIFICATION BUTTON
// ========================================

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
                            "/portal/"
                    }
                );


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
