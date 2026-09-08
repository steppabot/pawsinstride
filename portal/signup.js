// ========================================
// PAWS IN STRIDE SIGNUP FLOW
// ========================================

"use strict";

// ========================================
// SUPABASE
// ========================================

const SUPABASE_URL =
    "https://xyhndwopvlmnxjkthtkl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_U3OIYatZuBUe8Y6Vq0DS2w_IMacau2j";


const signupSupabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ========================================
// SIGNUP STATE
// ========================================

const signupState = {
    currentStep: 1,
    clientType: null,
    owner: {},
    pets: [],
    selectedMeetGreet: null
};


// ========================================
// MEET & GREET AVAILABILITY
// ========================================

const MEET_GREET_START_HOUR = 8;
const MEET_GREET_END_HOUR = 19;
const MEET_GREET_INTERVAL_MINUTES = 30;

let meetGreetCalendarDate =
    new Date();

let meetGreetBookedSlots =
    new Set();


// ========================================
// DOM ELEMENTS
// ========================================

const signupStepCount =
    document.getElementById("signup-step-count");

const signupStepLabel =
    document.getElementById("signup-step-label");

const signupProgressBar =
    document.getElementById("signup-progress-bar");

const signupError =
    document.getElementById("signup-error");


const ownerStep =
    document.getElementById("signup-step-owner");

const petsStep =
    document.getElementById("signup-step-pets");

const meetGreetStep =
    document.getElementById("signup-step-meet-greet");

const successStep =
    document.getElementById("signup-step-success");


const ownerNextButton =
    document.getElementById("signup-owner-next");

const petsBackButton =
    document.getElementById("signup-pets-back");

const petsNextButton =
    document.getElementById("signup-pets-next");

const meetGreetBackButton =
    document.getElementById("signup-meet-greet-back");

const meetGreetCalendar =
    document.getElementById("signup-meet-greet-calendar");

const meetGreetTimes =
    document.getElementById("signup-meet-greet-times");

const meetGreetSelected =
    document.getElementById("signup-meet-greet-selected");

const meetGreetSelectedText =
    document.getElementById("signup-meet-greet-selected-text");

const completeNewClientButton =
    document.getElementById("signup-complete-new-client");


const passwordInput =
    document.getElementById("signup-password");

const passwordToggle =
    document.getElementById("signup-password-toggle");


const petsContainer =
    document.getElementById("signup-pets-container");

const addPetButton =
    document.getElementById("signup-add-pet");

const petTemplate =
    document.getElementById("signup-pet-template");


// ========================================
// INITIALIZE SIGNUP
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeSignup();
});


function initializeSignup() {

    setupSignupEvents();

    updateSignupProgress(
        1,
        "Your Information"
    );

}


// ========================================
// SIGNUP EVENTS
// ========================================

function setupSignupEvents() {

    ownerNextButton?.addEventListener(
        "click",
        handleOwnerContinue
    );


    petsBackButton?.addEventListener(
        "click",
        () => {
            showSignupStep(1);
        }
    );


    petsNextButton?.addEventListener(
        "click",
        handlePetsContinue
    );


    meetGreetBackButton?.addEventListener(
        "click",
        () => {
            showSignupStep(2);
        }
    );


    completeNewClientButton?.addEventListener(
        "click",
        completeNewClientSignup
    );


    addPetButton?.addEventListener(
        "click",
        addAnotherPet
    );


    petsContainer?.addEventListener(
        "click",
        handlePetContainerClick
    );


    passwordToggle?.addEventListener(
        "click",
        toggleSignupPassword
    );


    document
        .querySelectorAll(
            'input[name="client_type"]'
        )
        .forEach(
            radio => {

                radio.addEventListener(
                    "change",
                    () => {

                        signupState.clientType =
                            radio.value;

                        clearSignupError();

                    }
                );

            }
        );


    // ========================================
    // SIGNUP PHONE FORMAT
    // ========================================

    const signupPhone =
        document.getElementById(
            "signup-phone"
        );


    signupPhone
        ?.addEventListener(
            "input",
            () => {

                signupPhone.value =
                    formatUsPhoneNumber(
                        signupPhone.value
                    );

                clearSignupError();

            }
        );


    // ========================================
    // SIGNUP ZIP FORMAT
    // ========================================

    const signupZip =
        document.getElementById(
            "signup-zip"
        );


    signupZip
        ?.addEventListener(
            "input",
            () => {

                signupZip.value =
                    signupZip.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            5
                        );

                clearSignupError();

            }
        );


    document
        .querySelectorAll(
            "#signup-step-owner input, #signup-step-owner select"
        )
        .forEach(
            field => {

                field.addEventListener(
                    "change",
                    clearSignupError
                );

            }
        );


    petsContainer?.addEventListener(
        "input",
        clearSignupError
    );


    petsContainer?.addEventListener(
        "change",
        clearSignupError
    );

}

// ========================================
// PASSWORD SHOW / HIDE
// ========================================

function toggleSignupPassword() {

    if (!passwordInput || !passwordToggle) {
        return;
    }


    const passwordIsHidden =
        passwordInput.type === "password";


    passwordInput.type =
        passwordIsHidden
            ? "text"
            : "password";


    passwordToggle.textContent =
        passwordIsHidden
            ? "Hide"
            : "Show";


    passwordToggle.setAttribute(
        "aria-label",
        passwordIsHidden
            ? "Hide password"
            : "Show password"
    );


    passwordInput.focus();

}


// ========================================
// STEP 1: OWNER CONTINUE
// ========================================

function handleOwnerContinue() {

    clearSignupError();


    if (!validateOwnerStep()) {
        return;
    }


    saveOwnerData();


    showSignupStep(2);

}


// ========================================
// VALIDATE OWNER STEP
// ========================================

function validateOwnerStep() {

    const clientType =
        document.querySelector(
            'input[name="client_type"]:checked'
        );


    const fullName =
        document.getElementById(
            "signup-full-name"
        );


    const email =
        document.getElementById(
            "signup-email"
        );


    const phone =
        document.getElementById(
            "signup-phone"
        );


    const password =
        document.getElementById(
            "signup-password"
        );


    const addressLine1 =
        document.getElementById(
            "signup-address-line-1"
        );


    const city =
        document.getElementById(
            "signup-city"
        );


    const state =
        document.getElementById(
            "signup-state"
        );


    const zip =
        document.getElementById(
            "signup-zip"
        );


    if (!clientType) {

        showSignupError(
            "Please tell us whether you are a new or existing client."
        );


        scrollSignupErrorIntoView();

        return false;

    }


    const requiredFields = [

        {
            field:
                fullName,

            message:
                "Please enter your full name."
        },

        {
            field:
                email,

            message:
                "Please enter your email address."
        },

        {
            field:
                phone,

            message:
                "Please enter your phone number."
        },

        {
            field:
                password,

            message:
                "Please create a password."
        },

        {
            field:
                addressLine1,

            message:
                "Please enter your street address."
        },

        {
            field:
                city,

            message:
                "Please enter your city."
        },

        {
            field:
                state,

            message:
                "Please select your state."
        },

        {
            field:
                zip,

            message:
                "Please enter your ZIP code."
        }

    ];


    for (
        const item of
        requiredFields
    ) {

        if (
            !item.field ||
            !String(
                item.field.value || ""
            ).trim()
        ) {

            showSignupError(
                item.message
            );


            item.field?.focus();

            return false;

        }

    }


    // ========================================
    // FULL NAME
    // ========================================

    if (
        !isValidFullName(
            fullName.value
        )
    ) {

        showSignupError(
            "Please enter your first and last name."
        );


        fullName.focus();

        return false;

    }


    // ========================================
    // EMAIL
    // ========================================

    if (
        !email.checkValidity()
    ) {

        showSignupError(
            "Please enter a valid email address."
        );


        email.focus();

        return false;

    }


    // ========================================
    // PASSWORD
    // ========================================

    if (
        password.value.length <
        8
    ) {

        showSignupError(
            "Your password must be at least 8 characters."
        );


        password.focus();

        return false;

    }


    // ========================================
    // PHONE
    // ========================================

    const phoneDigits =
        phone.value.replace(
            /\D/g,
            ""
        );


    if (
        phoneDigits.length !==
        10
    ) {

        showSignupError(
            "Please enter a valid 10-digit phone number."
        );


        phone.focus();

        return false;

    }


    // ========================================
    // ZIP CODE
    // ========================================

    if (
        !/^\d{5}$/.test(
            zip.value
        )
    ) {

        showSignupError(
            "Please enter a valid 5-digit ZIP code."
        );


        zip.focus();

        return false;

    }


    return true;

}

// ========================================
// SIGNUP FIELD VALIDATION HELPERS
// ========================================

function formatUsPhoneNumber(
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


function isValidFullName(
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


    if (
        parts.length <
        2
    ) {

        return false;

    }


    return parts.every(
        part =>
            part.length >= 2
    );

}

// ========================================
// SAVE OWNER DATA
// ========================================

function saveOwnerData() {

    const clientType =
        document.querySelector(
            'input[name="client_type"]:checked'
        )?.value || null;


    signupState.clientType =
        clientType;


    signupState.owner = {

        clientType,

        fullName:
            document
                .getElementById("signup-full-name")
                ?.value
                .trim() || "",

        email:
            document
                .getElementById("signup-email")
                ?.value
                .trim()
                .toLowerCase() || "",

        phone:
            document
                .getElementById("signup-phone")
                ?.value
                .trim() || "",

        /*
         * Password intentionally remains only in the form field.
         * Do not put passwords into signupState, localStorage,
         * sessionStorage, logs, or public database tables.
         */

        addressLine1:
            document
                .getElementById("signup-address-line-1")
                ?.value
                .trim() || "",

        addressLine2:
            document
                .getElementById("signup-address-line-2")
                ?.value
                .trim() || "",

        city:
            document
                .getElementById("signup-city")
                ?.value
                .trim() || "",

        state:
            document
                .getElementById("signup-state")
                ?.value || "",

        zip:
            document
                .getElementById("signup-zip")
                ?.value
                .trim() || ""

    };

}


// ========================================
// STEP 2: PET CONTINUE
// ========================================

async function handlePetsContinue() {

    clearSignupError();


    const pets =
        collectPetData();


    if (!pets) {
        return;
    }


    signupState.pets =
        pets;


    // ========================================
    // EXISTING CLIENT
    // ========================================

    if (
        signupState.clientType ===
        "existing_client"
    ) {

        await completeExistingClientSignup();

        return;

    }


    // ========================================
    // NEW CLIENT
    // ========================================

    if (
        signupState.clientType ===
        "new_client"
    ) {

        showSignupStep(3);

        await initializeMeetGreetCalendar();

        return;

    }


    // ========================================
    // SAFETY FALLBACK
    // ========================================

    showSignupError(
        "Please go back and select whether you are a new or existing client."
    );

}


// ========================================
// COLLECT + VALIDATE PET DATA
// ========================================

function collectPetData() {

    const petCards =
        Array.from(
            petsContainer.querySelectorAll(
                ".signup-pet-card"
            )
        );


    if (!petCards.length) {

        showSignupError(
            "Please add at least one pet."
        );

        return null;

    }


    const pets = [];


    for (
        let index = 0;
        index < petCards.length;
        index++
    ) {

        const card =
            petCards[index];


        const nameInput =
            card.querySelector(
                '[name="pet_name"]'
            );

        const breedInput =
            card.querySelector(
                '[name="pet_breed"]'
            );

        const birthdayInput =
            card.querySelector(
                '[name="pet_birthday"]'
            );

        const genderInput =
            card.querySelector(
                '[name="pet_gender"]'
            );


        const petName =
            nameInput?.value.trim() || "";

        const breed =
            breedInput?.value.trim() || "";


        if (!petName) {

            showSignupError(
                `Please enter a name for Pet ${index + 1}.`
            );

            nameInput?.focus();

            return null;

        }


        if (!breed) {

            showSignupError(
                `Please enter a breed for ${petName}.`
            );

            breedInput?.focus();

            return null;

        }


        pets.push({

            name: petName,

            breed,

            birthday:
                birthdayInput?.value || null,

            gender:
                genderInput?.value || null

        });

    }


    return pets;

}


// ========================================
// ADD ANOTHER PET
// ========================================

function addAnotherPet() {

    if (
        !petTemplate ||
        !petsContainer
    ) {
        return;
    }


    const templateContent =
        petTemplate.content.cloneNode(true);


    petsContainer.appendChild(
        templateContent
    );


    renumberPetCards();


    const petCards =
        petsContainer.querySelectorAll(
            ".signup-pet-card"
        );


    const newestCard =
        petCards[
            petCards.length - 1
        ];


    newestCard
        ?.querySelector('[name="pet_name"]')
        ?.focus();

}


// ========================================
// REMOVE PET
// ========================================

function handlePetContainerClick(event) {

    const removeButton =
        event.target.closest(
            "[data-remove-pet]"
        );


    if (!removeButton) {
        return;
    }


    const petCard =
        removeButton.closest(
            ".signup-pet-card"
        );


    if (!petCard) {
        return;
    }


    petCard.remove();


    renumberPetCards();

}


// ========================================
// RENUMBER PET CARDS
// ========================================

function renumberPetCards() {

    const petCards =
        petsContainer.querySelectorAll(
            ".signup-pet-card"
        );


    petCards.forEach(
        (card, index) => {

            card.dataset.petIndex =
                String(index);


            const petNumber =
                card.querySelector(
                    ".signup-pet-number"
                );


            if (petNumber) {

                petNumber.textContent =
                    `Pet ${index + 1}`;

            }

        }
    );

}


// ========================================
// SHOW SIGNUP STEP
// ========================================

function showSignupStep(stepNumber) {

    clearSignupError();


    ownerStep.hidden = true;
    petsStep.hidden = true;
    meetGreetStep.hidden = true;
    successStep.hidden = true;


    signupState.currentStep =
        stepNumber;


    if (stepNumber === 1) {

        ownerStep.hidden = false;

        updateSignupProgress(
            1,
            "Your Information"
        );

    }


    if (stepNumber === 2) {

        petsStep.hidden = false;

        updateSignupProgress(
            2,
            "Your Pet"
        );

    }


    if (stepNumber === 3) {

        meetGreetStep.hidden = false;

        updateSignupProgress(
            3,
            "Meet & Greet"
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ========================================
// UPDATE SIGNUP PROGRESS
// ========================================

function updateSignupProgress(
    stepNumber,
    stepLabel
) {

    if (signupStepCount) {

        signupStepCount.textContent =
            `Step ${stepNumber} of 3`;

    }


    if (signupStepLabel) {

        signupStepLabel.textContent =
            stepLabel;

    }


    if (signupProgressBar) {

        const progress =
            (stepNumber / 3) * 100;


        signupProgressBar.style.width =
            `${progress}%`;

    }

}


// ========================================
// EXISTING CLIENT ACCOUNT CREATION
// ========================================

async function completeExistingClientSignup() {

    clearSignupError();


    if (
        !signupState.owner ||
        !signupState.pets.length
    ) {

        showSignupError(
            "Your signup information is incomplete. Please go back and review your information."
        );

        return;

    }


    const password =
        passwordInput?.value || "";


    if (password.length < 8) {

        showSignupStep(1);

        showSignupError(
            "Your password must be at least 8 characters."
        );

        passwordInput?.focus();

        return;

    }


    setSignupButtonLoading(
        petsNextButton,
        true,
        "Creating Account..."
    );


    try {

        // ========================================
        // CREATE SUPABASE AUTH USER
        // ========================================

        const {
            data: authData,
            error: authError
        } =
            await signupSupabase.auth.signUp({

                email:
                    signupState.owner.email,

                password,

                options: {

                    data: {

                        full_name:
                            signupState.owner.fullName,

                        phone:
                            signupState.owner.phone,

                        client_type:
                            signupState.clientType

                    }

                }

            });


        if (authError) {
            throw authError;
        }


        if (!authData?.user) {

            throw new Error(
                "Your account could not be created. Please try again."
            );

        }


        // ========================================
        // REQUIRE ACTIVE SESSION
        // ========================================

        /*
         * For this onboarding flow, Supabase email
         * confirmation should currently be disabled.
         *
         * We need an authenticated session so the
         * household + pets RPC can run immediately.
         */

        if (!authData.session) {

            throw new Error(
                "Your account was created, but email confirmation is currently required. Please contact Paws in Stride so we can finish setting up your portal account."
            );

        }


        // ========================================
        // FINALIZE HOUSEHOLD + PETS
        // ========================================

        const {
            error: onboardingError
        } =
            await signupSupabase.rpc(
                "finalize_client_onboarding",
                {

                    p_street_address:
                        signupState.owner.addressLine1,

                    p_address_line_2:
                        signupState.owner.addressLine2 || "",

                    p_city:
                        signupState.owner.city,

                    p_state:
                        signupState.owner.state,

                    p_zip_code:
                        signupState.owner.zip,

                    p_pets:
                        signupState.pets.map(
                            (pet) => ({

                                name:
                                    pet.name,

                                breed:
                                    pet.breed,

                                birthday:
                                    pet.birthday || null,

                                gender:
                                    pet.gender || null

                            })
                        )

                }
            );


        if (onboardingError) {
            throw onboardingError;
        }


        // ========================================
        // SIGN USER BACK OUT
        // ========================================

        /*
         * Signup creates a logged-in session when
         * email confirmation is disabled.
         *
         * We sign them back out because the success
         * screen intentionally sends them through
         * the normal portal login page.
         */

        const {
            error: signOutError
        } =
            await signupSupabase.auth.signOut();


        if (signOutError) {

            console.warn(
                "Account created, but automatic sign-out failed:",
                signOutError
            );

        }


        // ========================================
        // SHOW REAL SUCCESS SCREEN
        // ========================================

        showExistingClientSuccess();

    }
    catch (error) {

        console.error(
            "Existing client signup failed:",
            error
        );


        showSignupError(
            getSignupErrorMessage(error)
        );


        signupError?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
    finally {

        setSignupButtonLoading(
            petsNextButton,
            false,
            "Continue"
        );

    }

}


// ========================================
// EXISTING CLIENT SUCCESS
// ========================================

function showExistingClientSuccess() {

    clearSignupError();


    ownerStep.hidden =
        true;

    petsStep.hidden =
        true;

    meetGreetStep.hidden =
        true;

    successStep.hidden =
        false;


    // ========================================
    // HIDE PROGRESS
    // ========================================

    const progress =
        document.querySelector(
            ".signup-progress"
        );


    if (progress) {
        progress.hidden = true;
    }


    // ========================================
    // SUCCESS CONTENT
    // ========================================

    const successTitle =
        document.getElementById(
            "signup-success-title"
        );

    const successMessage =
        document.getElementById(
            "signup-success-message"
        );

    const appointment =
        document.getElementById(
            "signup-success-appointment"
        );

    const meetGreetCheck =
        document.getElementById(
            "signup-success-meet-greet-check"
        );


    if (successTitle) {

        successTitle.textContent =
            "You're All Set!";

    }


    if (successMessage) {

        successMessage.textContent =
            "Your Paws in Stride client portal account has been created. You can now log in to your portal.";

    }


    if (appointment) {
        appointment.hidden = true;
    }


    if (meetGreetCheck) {
        meetGreetCheck.hidden = true;
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ========================================
// SIGNUP BUTTON LOADING STATE
// ========================================

function setSignupButtonLoading(
    button,
    isLoading,
    text
) {

    if (!button) {
        return;
    }


    button.disabled =
        isLoading;


    button.textContent =
        text;


    if (isLoading) {

        button.setAttribute(
            "aria-busy",
            "true"
        );

    }
    else {

        button.removeAttribute(
            "aria-busy"
        );

    }

}


// ========================================
// FRIENDLY SIGNUP ERROR MESSAGE
// ========================================

function getSignupErrorMessage(error) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();


    if (
        isMeetGreetSlotConflict(
            error
        )
    ) {

        return "That Meet & Greet time was just booked. Please choose another available time.";

    }


    if (
        message.includes(
            "already registered"
        ) ||
        message.includes(
            "already been registered"
        ) ||
        message.includes(
            "user already"
        )
    ) {

        return "An account already exists with this email address. Please log in instead.";

    }


    if (
        message.includes(
            "password"
        )
    ) {

        return "Please choose a valid password with at least 8 characters.";

    }


    if (
        message.includes(
            "email"
        ) &&
        message.includes(
            "invalid"
        )
    ) {

        return "Please enter a valid email address.";

    }


    if (
        message.includes(
            "rate limit"
        )
    ) {

        return "Too many signup attempts were made. Please wait a moment and try again.";

    }


    if (
        message.includes(
            "onboarding has already been completed"
        )
    ) {

        return "This portal account has already completed signup. Please log in instead.";

    }


    if (
        message.includes(
            "new_client"
        ) ||
        message.includes(
            "new client"
        )
    ) {

        return "This account is not configured for the new-client Meet & Greet signup flow.";

    }


    return (
        error?.message ||
        "We couldn't finish creating your account. Please try again."
    );

}

// ========================================
// INITIALIZE MEET & GREET CALENDAR
// ========================================

async function initializeMeetGreetCalendar() {

    meetGreetCalendarDate =
        new Date();

    meetGreetCalendarDate.setHours(
        12,
        0,
        0,
        0
    );


    await renderMeetGreetCalendar();

}


// ========================================
// RENDER MEET & GREET CALENDAR
// ========================================

async function renderMeetGreetCalendar() {

    if (!meetGreetCalendar) {
        return;
    }


    const year =
        meetGreetCalendarDate.getFullYear();

    const month =
        meetGreetCalendarDate.getMonth();


    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    const monthStart =
        formatDateForDatabase(
            firstDay
        );

    const monthEnd =
        formatDateForDatabase(
            lastDay
        );


    await loadMeetGreetBookedSlots(
        monthStart,
        monthEnd
    );


    const monthName =
        firstDay.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    let html = `

        <div class="signup-meet-greet-calendar-header">

            <button
                type="button"
                class="signup-calendar-nav"
                id="signup-meet-greet-prev"
                aria-label="Previous month"
            >
                ‹
            </button>

            <strong>
                ${monthName}
            </strong>

            <button
                type="button"
                class="signup-calendar-nav"
                id="signup-meet-greet-next"
                aria-label="Next month"
            >
                ›
            </button>

        </div>


        <div class="signup-calendar-weekdays">

            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>

        </div>


        <div class="signup-calendar-grid">
    `;


    const startOffset =
        firstDay.getDay();


    for (
        let i = 0;
        i < startOffset;
        i++
    ) {

        html += `
            <span
                class="signup-calendar-day signup-calendar-day-empty"
            ></span>
        `;

    }


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    for (
        let day = 1;
        day <= lastDay.getDate();
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );

        date.setHours(
            12,
            0,
            0,
            0
        );


        const databaseDate =
            formatDateForDatabase(
                date
            );


        const compareDate =
            new Date(
                year,
                month,
                day
            );

        compareDate.setHours(
            0,
            0,
            0,
            0
        );


        const isPast =
            compareDate < today;


        const isSelected =
            signupState.selectedMeetGreet?.date ===
            databaseDate;


        html += `

            <button
                type="button"
                class="
                    signup-calendar-day
                    ${isSelected ? "selected" : ""}
                "
                data-meet-greet-date="${databaseDate}"
                ${isPast ? "disabled" : ""}
            >
                ${day}
            </button>

        `;

    }


    html += `
        </div>
    `;


    meetGreetCalendar.innerHTML =
        html;


    // ========================================
    // PREVIOUS MONTH
    // ========================================

    document
        .getElementById(
            "signup-meet-greet-prev"
        )
        ?.addEventListener(
            "click",
            async () => {

                meetGreetCalendarDate =
                    new Date(
                        year,
                        month - 1,
                        1
                    );


                await renderMeetGreetCalendar();

            }
        );


    // ========================================
    // NEXT MONTH
    // ========================================

    document
        .getElementById(
            "signup-meet-greet-next"
        )
        ?.addEventListener(
            "click",
            async () => {

                meetGreetCalendarDate =
                    new Date(
                        year,
                        month + 1,
                        1
                    );


                await renderMeetGreetCalendar();

            }
        );


    // ========================================
    // DATE SELECTION
    // ========================================

    meetGreetCalendar
        .querySelectorAll(
            "[data-meet-greet-date]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        const selectedDate =
                            button.dataset.meetGreetDate;


                        signupState.selectedMeetGreet =
                            {
                                date:
                                    selectedDate,

                                time:
                                    null
                            };


                        await renderMeetGreetCalendar();

                        renderMeetGreetTimes(
                            selectedDate
                        );

                        updateMeetGreetSelection();

                    }
                );

            }
        );


    if (
        signupState.selectedMeetGreet?.date
    ) {

        renderMeetGreetTimes(
            signupState.selectedMeetGreet.date
        );

    }

}


// ========================================
// LOAD BOOKED MEET & GREET SLOTS
// ========================================

async function loadMeetGreetBookedSlots(
    startDate,
    endDate
) {

    const {
        data,
        error
    } =
        await signupSupabase.rpc(
            "get_meet_greet_booked_slots",
            {
                p_start_date:
                    startDate,

                p_end_date:
                    endDate
            }
        );


    if (error) {

        console.error(
            "Could not load Meet & Greet availability:",
            error
        );


        meetGreetBookedSlots =
            new Set();

        return;

    }


    meetGreetBookedSlots =
        new Set(
            (data || []).map(
                (slot) => {

                    const time =
                        normalizeDatabaseTime(
                            slot.start_time
                        );


                    return (
                        `${slot.visit_date}|${time}`
                    );

                }
            )
        );

}


// ========================================
// RENDER MEET & GREET TIMES
// ========================================

function renderMeetGreetTimes(
    selectedDate
) {

    if (!meetGreetTimes) {
        return;
    }


    // ========================================
    // SHOW TIME SLOT CONTAINER
    // ========================================

    meetGreetTimes.hidden =
        false;


    let html = `
        <div class="signup-meet-greet-time-heading">
            Available Times
        </div>

        <div class="signup-meet-greet-time-grid">
    `;


    const slots =
        generateMeetGreetTimes();


    for (
        const slot of slots
    ) {

        const slotKey =
            `${selectedDate}|${slot.databaseTime}`;


        const isBooked =
            meetGreetBookedSlots.has(
                slotKey
            );


        const isPast =
            isMeetGreetSlotPast(
                selectedDate,
                slot.databaseTime
            );


        const isUnavailable =
            isBooked ||
            isPast;


        const isSelected =
            signupState.selectedMeetGreet?.date ===
                selectedDate &&
            signupState.selectedMeetGreet?.time ===
                slot.databaseTime;


        html += `

            <button
                type="button"
                class="
                    signup-meet-greet-time
                    ${isSelected ? "selected" : ""}
                "
                data-meet-greet-time="${slot.databaseTime}"
                ${isUnavailable ? "disabled" : ""}
            >
                ${slot.label}
            </button>

        `;

    }


    html += `
        </div>
    `;


    meetGreetTimes.innerHTML =
        html;


    meetGreetTimes
        .querySelectorAll(
            "[data-meet-greet-time]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const selectedTime =
                            button.dataset.meetGreetTime;


                        signupState.selectedMeetGreet =
                            {
                                date:
                                    selectedDate,

                                time:
                                    selectedTime
                            };


                        renderMeetGreetTimes(
                            selectedDate
                        );


                        updateMeetGreetSelection();

                    }
                );

            }
        );

}

// ========================================
// GENERATE MEET & GREET TIMES
// ========================================

function generateMeetGreetTimes() {

    const slots =
        [];


    for (
        let hour = MEET_GREET_START_HOUR;
        hour <= MEET_GREET_END_HOUR;
        hour++
    ) {

        for (
            let minute = 0;
            minute < 60;
            minute +=
                MEET_GREET_INTERVAL_MINUTES
        ) {

            if (
                hour ===
                    MEET_GREET_END_HOUR &&
                minute > 0
            ) {

                break;

            }


            const databaseTime =
                `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;


            const displayDate =
                new Date(
                    2000,
                    0,
                    1,
                    hour,
                    minute
                );


            const label =
                displayDate.toLocaleTimeString(
                    "en-US",
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );


            slots.push({
                databaseTime,
                label
            });

        }

    }


    return slots;

}


// ========================================
// UPDATE MEET & GREET SELECTION
// ========================================

function updateMeetGreetSelection() {

    const selection =
        signupState.selectedMeetGreet;


    if (
        !selection?.date ||
        !selection?.time
    ) {

        if (meetGreetSelected) {
            meetGreetSelected.hidden = true;
        }

        if (completeNewClientButton) {
            completeNewClientButton.disabled = true;
        }

        return;

    }


    const appointmentDate =
        new Date(
            `${selection.date}T${selection.time}`
        );


    const dateLabel =
        appointmentDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );


    const timeLabel =
        appointmentDate.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    if (meetGreetSelectedText) {
        meetGreetSelectedText.textContent =
            `${dateLabel} at ${timeLabel}`;
    }


    if (meetGreetSelected) {
        meetGreetSelected.hidden = false;
    }


    if (completeNewClientButton) {
        completeNewClientButton.disabled = false;
    }

}


// ========================================
// CHECK PAST MEET & GREET SLOT
// ========================================

function isMeetGreetSlotPast(
    date,
    time
) {

    const slotDate =
        new Date(
            `${date}T${time}`
        );


    return (
        slotDate.getTime() <=
        Date.now()
    );

}


// ========================================
// FORMAT DATE FOR DATABASE
// ========================================

function formatDateForDatabase(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


// ========================================
// NORMALIZE DATABASE TIME
// ========================================

function normalizeDatabaseTime(
    time
) {

    if (!time) {
        return "";
    }


    const pieces =
        String(time).split(":");


    const hour =
        String(
            pieces[0] || "00"
        ).padStart(
            2,
            "0"
        );

    const minute =
        String(
            pieces[1] || "00"
        ).padStart(
            2,
            "0"
        );


    return (
        `${hour}:${minute}:00`
    );

}

// ========================================
// NEW CLIENT ACCOUNT + MEET & GREET
// ========================================

async function completeNewClientSignup() {

    clearSignupError();


    // ========================================
    // REQUIRE SELECTED APPOINTMENT
    // ========================================

    const selectedMeetGreet =
        signupState.selectedMeetGreet;


    if (
        !selectedMeetGreet?.date ||
        !selectedMeetGreet?.time
    ) {

        showSignupError(
            "Please select a Meet & Greet date and time."
        );

        scrollSignupErrorIntoView();

        return;

    }


    // ========================================
    // REQUIRE OWNER + PET INFORMATION
    // ========================================

    if (
        !signupState.owner ||
        !signupState.owner.email ||
        !signupState.pets.length
    ) {

        showSignupError(
            "Your signup information is incomplete. Please go back and review your information."
        );

        scrollSignupErrorIntoView();

        return;

    }


    // ========================================
    // REQUIRE NEW CLIENT
    // ========================================

    if (
        signupState.clientType !==
        "new_client"
    ) {

        showSignupError(
            "This Meet & Greet signup flow is only for new clients."
        );

        scrollSignupErrorIntoView();

        return;

    }


    // ========================================
    // PASSWORD
    // ========================================

    const password =
        passwordInput?.value || "";


    if (password.length < 8) {

        showSignupStep(1);

        showSignupError(
            "Your password must be at least 8 characters."
        );

        passwordInput?.focus();

        return;

    }


    // ========================================
    // BUTTON LOADING STATE
    // ========================================

    setSignupButtonLoading(
        completeNewClientButton,
        true,
        "Scheduling..."
    );


    try {

        // ========================================
        // RECHECK SLOT AVAILABILITY
        // ========================================

        const selectedDate =
            selectedMeetGreet.date;

        const selectedTime =
            normalizeDatabaseTime(
                selectedMeetGreet.time
            );


        const {
            data: currentBookedSlots,
            error: availabilityError
        } =
            await signupSupabase.rpc(
                "get_meet_greet_booked_slots",
                {

                    p_start_date:
                        selectedDate,

                    p_end_date:
                        selectedDate

                }
            );


        if (availabilityError) {
            throw availabilityError;
        }


        const slotAlreadyBooked =
            (currentBookedSlots || []).some(
                (slot) => {

                    return (
                        slot.visit_date ===
                            selectedDate &&
                        normalizeDatabaseTime(
                            slot.start_time
                        ) ===
                            selectedTime
                    );

                }
            );


        if (slotAlreadyBooked) {

            signupState.selectedMeetGreet =
                {
                    date:
                        selectedDate,

                    time:
                        null
                };


            await renderMeetGreetCalendar();


            updateMeetGreetSelection();


            showSignupError(
                "That Meet & Greet time was just booked by another client. Please choose another available time."
            );


            scrollSignupErrorIntoView();

            return;

        }


        // ========================================
        // CHECK FOR EXISTING SIGNED-IN SESSION
        // ========================================

        /*
         * If account creation succeeded previously but
         * the appointment failed because a slot was taken,
         * the user may already have an authenticated session.
         *
         * Reusing that session prevents us from trying to
         * create the same Auth account twice.
         */

        const {
            data: sessionData,
            error: sessionError
        } =
            await signupSupabase.auth.getSession();


        if (sessionError) {
            throw sessionError;
        }


        let activeSession =
            sessionData?.session || null;


        // ========================================
        // CREATE AUTH ACCOUNT WHEN NEEDED
        // ========================================

        if (!activeSession) {

            const {
                data: authData,
                error: authError
            } =
                await signupSupabase.auth.signUp({

                    email:
                        signupState.owner.email,

                    password,

                    options: {

                        data: {

                            full_name:
                                signupState.owner.fullName,

                            phone:
                                signupState.owner.phone,

                            client_type:
                                "new_client"

                        }

                    }

                });


            if (authError) {
                throw authError;
            }


            if (!authData?.user) {

                throw new Error(
                    "Your account could not be created. Please try again."
                );

            }


            if (!authData.session) {

                throw new Error(
                    "Your account was created, but an authenticated session was not started. Please contact Paws in Stride so we can finish setting up your portal account."
                );

            }


            activeSession =
                authData.session;

        }


        // ========================================
        // VERIFY SESSION BELONGS TO THIS SIGNUP
        // ========================================

        const signedInEmail =
            String(
                activeSession?.user?.email || ""
            )
                .trim()
                .toLowerCase();


        const signupEmail =
            String(
                signupState.owner.email || ""
            )
                .trim()
                .toLowerCase();


        if (
            signedInEmail &&
            signupEmail &&
            signedInEmail !== signupEmail
        ) {

            throw new Error(
                "Another portal account is currently signed in. Please sign out and restart signup."
            );

        }


        // ========================================
        // FINALIZE NEW CLIENT ONBOARDING
        // ========================================

        /*
         * This RPC creates:
         *
         * - Household
         * - Pet(s)
         * - Meet & Greet visit
         * - visit_pets relationships
         * - onboarding_completed_at
         *
         * The Meet & Greet is inserted into public.visits,
         * so the SAME appointment is used by:
         *
         * - Admin calendar
         * - Client calendar
         * - Signup availability
         */

        const {
            data: visitId,
            error: onboardingError
        } =
            await signupSupabase.rpc(
                "finalize_new_client_onboarding",
                {

                    p_street_address:
                        signupState.owner.addressLine1,

                    p_address_line_2:
                        signupState.owner.addressLine2 || "",

                    p_city:
                        signupState.owner.city,

                    p_state:
                        signupState.owner.state,

                    p_zip_code:
                        signupState.owner.zip,

                    p_pets:
                        signupState.pets.map(
                            (pet) => ({

                                name:
                                    pet.name,

                                breed:
                                    pet.breed,

                                birthday:
                                    pet.birthday || null,

                                gender:
                                    pet.gender || null

                            })
                        ),

                    p_meet_greet_date:
                        selectedDate,

                    p_meet_greet_time:
                        selectedTime

                }
            );


        if (onboardingError) {

            // ========================================
            // SLOT COLLISION / UNIQUE CONFLICT
            // ========================================

            if (
                isMeetGreetSlotConflict(
                    onboardingError
                )
            ) {

                signupState.selectedMeetGreet =
                    {
                        date:
                            selectedDate,

                        time:
                            null
                    };


                await renderMeetGreetCalendar();


                updateMeetGreetSelection();


                showSignupError(
                    "That Meet & Greet time was just booked by another client. Your portal account has been started, so simply choose another available time to finish signup."
                );


                scrollSignupErrorIntoView();

                return;

            }


            throw onboardingError;

        }


        console.log(
            "New client Meet & Greet created:",
            visitId
        );


        // ========================================
        // SIGN USER BACK OUT
        // ========================================

        /*
         * We intentionally send the client through
         * the normal portal login page after signup.
         */

        const {
            error: signOutError
        } =
            await signupSupabase.auth.signOut();


        if (signOutError) {

            console.warn(
                "New client created, but automatic sign-out failed:",
                signOutError
            );

        }


        // ========================================
        // SHOW SUCCESS SCREEN
        // ========================================

        showNewClientSuccess();

    }
    catch (error) {

        console.error(
            "New client signup failed:",
            error
        );


        showSignupError(
            getSignupErrorMessage(error)
        );


        scrollSignupErrorIntoView();

    }
    finally {

        const appointmentSelected =
            Boolean(
                signupState.selectedMeetGreet?.date &&
                signupState.selectedMeetGreet?.time
            );


        setSignupButtonLoading(
            completeNewClientButton,
            false,
            "Schedule Meet & Greet"
        );


        if (completeNewClientButton) {

            completeNewClientButton.disabled =
                !appointmentSelected;

        }

    }

}


// ========================================
// MEET & GREET SLOT CONFLICT
// ========================================

function isMeetGreetSlotConflict(error) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();


    const details =
        String(
            error?.details || ""
        ).toLowerCase();


    const code =
        String(
            error?.code || ""
        ).toLowerCase();


    return (
        code === "23505" ||
        message.includes(
            "visits_unique_active_meet_greet_slot"
        ) ||
        details.includes(
            "visits_unique_active_meet_greet_slot"
        ) ||
        (
            message.includes("duplicate key") &&
            message.includes("meet")
        )
    );

}


// ========================================
// NEW CLIENT SUCCESS
// ========================================

function showNewClientSuccess() {

    clearSignupError();


    const selection =
        signupState.selectedMeetGreet;


    if (
        !selection?.date ||
        !selection?.time
    ) {

        return;

    }


    ownerStep.hidden =
        true;

    petsStep.hidden =
        true;

    meetGreetStep.hidden =
        true;

    successStep.hidden =
        false;


    // ========================================
    // HIDE PROGRESS
    // ========================================

    const progress =
        document.querySelector(
            ".signup-progress"
        );


    if (progress) {
        progress.hidden = true;
    }


    // ========================================
    // FORMAT APPOINTMENT
    // ========================================

    const appointmentDate =
        new Date(
            `${selection.date}T${selection.time}`
        );


    const dateLabel =
        appointmentDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );


    const timeLabel =
        appointmentDate.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    // ========================================
    // SUCCESS CONTENT
    // ========================================

    const successTitle =
        document.getElementById(
            "signup-success-title"
        );

    const successMessage =
        document.getElementById(
            "signup-success-message"
        );

    const appointment =
        document.getElementById(
            "signup-success-appointment"
        );

    const meetGreetCheck =
        document.getElementById(
            "signup-success-meet-greet-check"
        );


    if (successTitle) {

        successTitle.textContent =
            "Your Meet & Greet Is Scheduled!";

    }


    if (successMessage) {

        successMessage.textContent =
            "Your Paws in Stride client portal account has been created and your complimentary Meet & Greet is confirmed.";

    }


    if (appointment) {

        appointment.hidden =
            false;


        appointment.innerHTML = `
            <span>
                Meet & Greet
            </span>

            <strong>
                ${dateLabel} at ${timeLabel}
            </strong>

            <p>
                30 minutes · Complimentary
            </p>
        `;

    }


    if (meetGreetCheck) {

        meetGreetCheck.hidden =
            false;

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

// ========================================
// SHOW SIGNUP ERROR
// ========================================

function showSignupError(message) {

    if (!signupError) {
        return;
    }


    signupError.textContent =
        message;


    signupError.hidden =
        false;

}


// ========================================
// CLEAR SIGNUP ERROR
// ========================================

function clearSignupError() {

    if (!signupError) {
        return;
    }


    signupError.textContent =
        "";


    signupError.hidden =
        true;

}


// ========================================
// SCROLL ERROR INTO VIEW
// ========================================

function scrollSignupErrorIntoView() {

    signupError?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}
