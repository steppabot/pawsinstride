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
        SUPABASE_PUBLISHABLE_KEY
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

    renderPropertyAccess();

    renderHomeNotes();

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
        petFormPanel
    ) {

        petFormPanel.style.display =
            "none";

    }

}


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


    if (
        serviceType ===
            "Dog Walking" ||
        serviceType ===
            "Drop-In Visit"
    ) {

        return "+$10 / visit";

    }


    if (
        serviceType ===
        "Pet Sitting"
    ) {

        return "Included";

    }


    if (
        serviceType ===
        "Dog Boarding"
    ) {

        return "+$100 / night";

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


    switch (
        serviceTypeSelect?.value
    ) {

        case "Dog Walking":

            help.textContent =
                "Each additional dog is $10 per walk.";

            break;


        case "Drop-In Visit":

            help.textContent =
                "Each additional pet is $10 per drop-in visit.";

            break;


        case "Pet Sitting":

            help.textContent =
                "Additional pets are included at no additional charge.";

            break;


        case "Dog Boarding":

            help.textContent =
                "Boarding is $100 per pet, per night.";

            break;


        default:

            help.textContent =
                "Select any other pets included in this service.";

    }

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


    selectedDates =
        [];


    renderSelectedDates();


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


    if (
        serviceType ===
        "Dog Boarding"
    ) {

        boarding.style.display =
            "block";


        resetBoardingDates();

        renderAdditionalPets();

        updateBookingTotal();

        return;

    }


    optionWrapper.style.display =
        "block";


    multiDate.style.display =
        "block";


    populateServiceOptions(
        serviceType
    );


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

function populatePreferredTimeWindows() {

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


            option.textContent =
                surcharge > 0
                    ? `${window.label} (+$${formatServicePrice(surcharge)})`
                    : window.label;


            option.dataset.surcharge =
                String(surcharge);


            bookingTime.appendChild(
                option
            );

        }
    );

}


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


    if (!selectedPackage) {

        wrapper.style.display =
            "none";

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


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "calendar-day";


        button.textContent =
            day;


        if (
            date < today
        ) {

            button.disabled =
                true;


            button.classList.add(
                "calendar-day-past"
            );

        }


        if (
            date === today
        ) {

            button.classList.add(
                "calendar-day-today"
            );

        }


        if (
            selectedDates.includes(
                date
            )
        ) {

            button.classList.add(
                "calendar-day-selected"
            );

        }


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


function toggleSelectedDate(
    date
) {

    if (
        selectedDates.includes(
            date
        )
    ) {

        selectedDates =
            selectedDates.filter(
                item =>
                    item !== date
            );

    } else {

        selectedDates.push(
            date
        );

    }


    selectedDates.sort();


    renderSelectedDates();

    renderBookingCalendar();

}


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


    count.textContent =
        `${selectedDates.length} ${
            selectedDates.length === 1
                ? "visit"
                : "visits"
        }`;


    if (
        selectedDates.length === 0
    ) {

        list.innerHTML =
            `
                <p class="empty-dates-message">
                    No dates selected yet.
                </p>
            `;

    } else {

        list.innerHTML =
            selectedDates
                .map(
                    date => `
                        <div class="selected-date-item">

                            <span>
                                ${formatDate(date)}
                            </span>

                            <button
                                type="button"
                                class="remove-date-button"
                                data-date="${date}"
                            >
                                Remove
                            </button>

                        </div>
                    `
                )
                .join("");


        list
            .querySelectorAll(
                ".remove-date-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            selectedDates =
                                selectedDates.filter(
                                    item =>
                                        item !==
                                        button.dataset.date
                                );


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


    if (
        serviceType ===
        "Dog Boarding"
    ) {

        const nights =
            getBoardingNightCount();


        const nightlyTotal =
            100 *
            Math.max(
                petCount,
                1
            );


        const pickupFee =
            getBoardingPickupFee();


        const total =
            nights *
            nightlyTotal +
            pickupFee;


        countDisplay.textContent =
            `${nights} ${
                nights === 1
                    ? "night"
                    : "nights"
            }`;


        priceDisplay.textContent =
            `$${total.toFixed(2)}`;


        details.textContent =
            nights > 0 &&
            petCount > 0
                ? `${petCount} ${
                    petCount === 1
                        ? "pet"
                        : "pets"
                } × $100 × ${nights} ${
                    nights === 1
                        ? "night"
                        : "nights"
                }${pickupFee ? " + $50 extended pickup" : ""}`
                : "";


        return;

    }


    const selectedOption =
        serviceOptionSelect.options[
            serviceOptionSelect.selectedIndex
        ];


    const basePrice =
        Number(
            selectedOption
                ?.dataset.price
        ) || 0;


    let surcharge =
        0;


    if (
        serviceType ===
            "Dog Walking" ||
        serviceType ===
            "Drop-In Visit"
    ) {

        surcharge =
            Number(
                bookingTime.options[
                    bookingTime.selectedIndex
                ]?.dataset.surcharge
            ) || 0;

    }


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
            10;

    }


    const perVisit =
        basePrice +
        surcharge +
        additionalPetFee;


    const total =
        perVisit *
        selectedDates.length;


    countDisplay.textContent =
        `${selectedDates.length} ${
            selectedDates.length === 1
                ? "service"
                : "services"
        }`;


    priceDisplay.textContent =
        `$${total.toFixed(2)}`;


    const pieces =
        [];


    if (
        selectedDates.length &&
        basePrice
    ) {

        pieces.push(
            `${selectedDates.length} × $${basePrice}`
        );


        if (
            additionalPetFee > 0
        ) {

            pieces.push(
                `${additionalPetCount} additional ${
                    additionalPetCount === 1
                        ? "pet"
                        : "pets"
                } × $10 per visit`
            );

        }


        if (
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


        if (
            surcharge > 0
        ) {

            pieces.push(
                `$${surcharge} evening fee per visit`
            );

        }

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
// ATTACH PETS
// ========================================

async function attachPetsToVisits(
    insertedVisits,
    primaryPetId,
    additionalPetIds,
    serviceType
) {

    const rows =
        [];


    insertedVisits.forEach(
        visit => {

            rows.push({

                visit_id:
                    visit.id,

                pet_id:
                    Number(
                        primaryPetId
                    ),

                is_primary:
                    true,

                additional_pet_fee:
                    0

            });


            additionalPetIds.forEach(
                petId => {

                    let fee =
                        0;


                    if (
                        serviceType ===
                            "Dog Walking" ||
                        serviceType ===
                            "Drop-In Visit"
                    ) {

                        fee =
                            10;

                    }


                    if (
                        serviceType ===
                        "Dog Boarding"
                    ) {

                        fee =
                            100;

                    }


                    rows.push({

                        visit_id:
                            visit.id,

                        pet_id:
                            Number(petId),

                        is_primary:
                            false,

                        additional_pet_fee:
                            fee

                    });

                }
            );

        }
    );


    const {
        error
    } =
        await supabaseClient
            .from("visit_pets")
            .insert(
                rows
            );


    if (error) {

        throw error;

    }

}


// ========================================
// BOOKING SUBMIT
// ========================================

const bookingForm =
    document.getElementById(
        "booking-form"
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


            const primaryPetId =
                Number(
                    bookingPetSelect.value
                );


            const additionalPetIds =
                getSelectedAdditionalPetIds();


            const serviceType =
                serviceTypeSelect.value;


            if (
                !primaryPetId ||
                !serviceType
            ) {

                message.textContent =
                    "Please select your pet and service type.";

                return;

            }


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


            const serviceOption =
                serviceOptionSelect.value;


            const timeWindow =
                bookingTime.value;


            if (
                !serviceOption ||
                !timeWindow
            ) {

                message.textContent =
                    "Please complete the service details.";

                return;

            }


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

                    return;

                }

            } else if (
                selectedDates.length <
                1
            ) {

                message.textContent =
                    "Please select at least one date.";

                return;

            }


            const option =
                serviceOptionSelect.options[
                    serviceOptionSelect.selectedIndex
                ];


            const basePrice =
                Number(
                    option.dataset.price
                ) || 0;


            let surcharge =
                0;


            if (
                serviceType ===
                    "Dog Walking" ||
                serviceType ===
                    "Drop-In Visit"
            ) {

                surcharge =
                    Number(
                        bookingTime.options[
                            bookingTime.selectedIndex
                        ].dataset.surcharge
                    ) || 0;

            }


            const additionalCharge =
                (
                    serviceType ===
                        "Dog Walking" ||
                    serviceType ===
                        "Drop-In Visit"
                )
                    ? additionalPetIds.length *
                        10
                    : 0;


            const price =
                basePrice +
                surcharge +
                additionalCharge;


            const groupId =
                crypto.randomUUID();


            const rows =
                selectedDates.map(
                    date => ({

                        client_id:
                            currentUser.id,

                        pet_id:
                            primaryPetId,

                        service_type:
                            serviceType,

                        service_option:
                            serviceOption,

                        service_name:
                            `${serviceType} - ${serviceOption}`,

                        visit_date:
                            date,

                        time_window:
                            timeWindow,

                        status:
                            "requested",

                        price,

                        payment_status:
                            "pending",

                        booking_group_id:
                            groupId

                    })
                );


            button.disabled =
                true;


            button.textContent =
                "Submitting...";


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("visits")
                        .insert(
                            rows
                        )
                        .select(
                            "id, visit_date"
                        );


                if (error) {
                    throw error;
                }


                await attachPetsToVisits(
                    data,
                    primaryPetId,
                    additionalPetIds,
                    serviceType
                );


                message.textContent =
                    "Service request submitted successfully!";


                resetBookingForm();


                await refreshUpcomingVisits();


                setTimeout(
                    () => {

                        bookingSection.style.display =
                            "none";

                    },
                    600
                );

            } catch (
                error
            ) {

                console.error(
                    "Booking error:",
                    error
                );


                message.textContent =
                    "We couldn't submit your service request.";

            } finally {

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


    const petCount =
        1 +
        additionalPetIds.length;


    const nightlyPrice =
        100 *
        petCount;


    const pickupFee =
        getBoardingPickupFee();


    const boardingDates =
        getBoardingNightDates(
            dropoff,
            pickup
        );


    const groupId =
        crypto.randomUUID();


    const rows =
        boardingDates.map(
            (date, index) => ({

                client_id:
                    currentUser.id,

                pet_id:
                    primaryPetId,

                service_type:
                    "Dog Boarding",

                service_option:
                    "VIP Overnight Boarding",

                service_name:
                    "Dog Boarding - VIP Overnight Boarding",

                visit_date:
                    date,

                time_window:
                    pickupWindow,

                status:
                    "requested",

                price:
                    nightlyPrice +
                    (
                        index ===
                            boardingDates.length - 1
                            ? pickupFee
                            : 0
                    ),

                payment_status:
                    "pending",

                booking_group_id:
                    groupId

            })
        );


    button.disabled =
        true;


    button.textContent =
        "Submitting...";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("visits")
                .insert(
                    rows
                )
                .select(
                    "id, visit_date"
                );


        if (error) {
            throw error;
        }


        await attachPetsToVisits(
            data,
            primaryPetId,
            additionalPetIds,
            "Dog Boarding"
        );


        message.textContent =
            "Boarding request submitted successfully!";


        resetBookingForm();


        await refreshUpcomingVisits();


        setTimeout(
            () => {

                bookingSection.style.display =
                    "none";

            },
            600
        );

    } catch (
        error
    ) {

        console.error(
            "Boarding error:",
            error
        );


        message.textContent =
            "We couldn't submit your boarding request.";

    } finally {

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

    selectedDates =
        [];


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
                    date
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
                    selectedUpcomingDate
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

    if (
        progress.state ===
        "completed"
    ) {

        return "Complete";

    }


    if (
        progress.state ===
        "checked_in"
    ) {

        return "In Progress";

    }


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
