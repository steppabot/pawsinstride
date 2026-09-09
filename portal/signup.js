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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeSignup();

    }
);

function initializeSignup() {

    setupSignupEvents();

    updateSignupProgress(
        1,
        "Your Information"
    );


    /*
     * Breed loading is intentionally
     * non-blocking.
     *
     * Signup still works normally if the
     * external Dog API is unavailable.
     */

    loadSignupDogBreeds();

}

// ========================================
// GOOGLE ADDRESS AUTOCOMPLETE
// ========================================

let signupAddressAutocomplete = null;

let signupAddressWasSelected =
    false;


/*
 * Google calls this function automatically
 * after the Maps JavaScript API + Places
 * library have finished loading.
 *
 * It must be attached to window because the
 * callback originates from Google's script.
 */

window.initializeSignupAddressAutocomplete =
    function initializeSignupAddressAutocomplete() {

        const addressInput =
            document.getElementById(
                "signup-address-line-1"
            );

        const cityInput =
            document.getElementById(
                "signup-city"
            );

        const stateInput =
            document.getElementById(
                "signup-state"
            );

        const zipInput =
            document.getElementById(
                "signup-zip"
            );


        if (
            !addressInput ||
            !cityInput ||
            !stateInput ||
            !zipInput
        ) {

            console.warn(
                "Signup address fields were not found."
            );

            return;

        }


        if (
            !window.google ||
            !google.maps ||
            !google.maps.places
        ) {

            console.warn(
                "Google Places did not load."
            );

            return;

        }


        // ========================================
        // CREATE AUTOCOMPLETE
        // ========================================

        signupAddressAutocomplete =
            new google.maps.places.Autocomplete(
                addressInput,
                {

                    /*
                     * We only provide service
                     * addresses inside the U.S.
                     */

                    componentRestrictions: {
                        country: "us"
                    },


                    /*
                     * Ask Google only for the data
                     * needed to populate our form.
                     */

                    fields: [
                        "address_components",
                        "formatted_address",
                        "geometry"
                    ],


                    /*
                     * Prefer full street addresses
                     * instead of businesses.
                     */

                    types: [
                        "address"
                    ]

                }
            );


        // ========================================
        // BIAS RESULTS TOWARD NORTH DALLAS
        // ========================================

        /*
         * This does NOT prevent somebody from
         * entering another U.S. address.
         *
         * It simply makes Frisco / Prosper /
         * Celina / Plano / Little Elm area
         * results more relevant first.
         */

        const northDallasBounds =
            new google.maps.LatLngBounds(
                new google.maps.LatLng(
                    32.95,
                    -97.05
                ),
                new google.maps.LatLng(
                    33.45,
                    -96.55
                )
            );


        signupAddressAutocomplete.setBounds(
            northDallasBounds
        );


        signupAddressAutocomplete.setOptions({
            strictBounds: false
        });


        // ========================================
        // ADDRESS SELECTED
        // ========================================

        signupAddressAutocomplete.addListener(
            "place_changed",
            () => {

                const place =
                    signupAddressAutocomplete
                        .getPlace();


                if (
                    !place ||
                    !place.address_components
                ) {

                    signupAddressWasSelected =
                        false;

                    return;

                }


                const address =
                    getSignupGoogleAddressParts(
                        place.address_components
                    );


                // ========================================
                // REQUIRE STREET NUMBER + ROUTE
                // ========================================

                if (
                    !address.streetNumber ||
                    !address.route
                ) {

                    signupAddressWasSelected =
                        false;

                    return;

                }


                // ========================================
                // POPULATE STREET
                // ========================================

                addressInput.value =
                    `${address.streetNumber} ${address.route}`
                        .trim();


                // ========================================
                // POPULATE CITY
                // ========================================

                if (address.city) {

                    cityInput.value =
                        address.city;

                }


                // ========================================
                // POPULATE STATE
                // ========================================

                if (address.state) {

                    stateInput.value =
                        address.state;

                }


                // ========================================
                // POPULATE ZIP
                // ========================================

                if (address.zip) {

                    zipInput.value =
                        address.zip;

                }


                signupAddressWasSelected =
                    true;


                // ========================================
                // CLEAR EXISTING VALIDATION ERRORS
                // ========================================

                [
                    addressInput,
                    cityInput,
                    stateInput,
                    zipInput
                ].forEach(
                    field => {

                        field.classList.remove(
                            "signup-field-error"
                        );

                        field.removeAttribute(
                            "aria-invalid"
                        );

                    }
                );


                clearSignupError();


                // ========================================
                // MOVE TO ADDRESS LINE 2
                // ========================================

                const addressLine2 =
                    document.getElementById(
                        "signup-address-line-2"
                    );


                if (addressLine2) {

                    window.setTimeout(
                        () => {

                            addressLine2.focus({
                                preventScroll: true
                            });

                        },
                        100
                    );

                }

            }
        );


        // ========================================
        // MANUAL STREET EDIT
        // ========================================

        /*
         * If Google filled an address and the
         * client later changes the street manually,
         * it is no longer considered a Google
         * selected address.
         *
         * Manual entry is still allowed.
         */

        addressInput.addEventListener(
            "input",
            () => {

                signupAddressWasSelected =
                    false;

            }
        );

    };


// ========================================
// PARSE GOOGLE ADDRESS COMPONENTS
// ========================================

function getSignupGoogleAddressParts(
    components
) {

    const result = {

        streetNumber: "",
        route: "",
        city: "",
        state: "",
        zip: ""

    };


    components.forEach(
        component => {

            const types =
                component.types || [];


            // ========================================
            // STREET NUMBER
            // ========================================

            if (
                types.includes(
                    "street_number"
                )
            ) {

                result.streetNumber =
                    component.long_name || "";

            }


            // ========================================
            // STREET NAME
            // ========================================

            if (
                types.includes(
                    "route"
                )
            ) {

                result.route =
                    component.long_name || "";

            }


            // ========================================
            // CITY
            // ========================================

            if (
                types.includes(
                    "locality"
                )
            ) {

                result.city =
                    component.long_name || "";

            }


            /*
             * Some valid U.S. addresses do not
             * return locality. Google may instead
             * return a postal town or administrative
             * area for the city-level value.
             */

            if (
                !result.city &&
                types.includes(
                    "postal_town"
                )
            ) {

                result.city =
                    component.long_name || "";

            }


            if (
                !result.city &&
                types.includes(
                    "sublocality_level_1"
                )
            ) {

                result.city =
                    component.long_name || "";

            }


            // ========================================
            // STATE
            // ========================================

            if (
                types.includes(
                    "administrative_area_level_1"
                )
            ) {

                /*
                 * Our State dropdown stores
                 * two-letter abbreviations such
                 * as TX rather than "Texas".
                 */

                result.state =
                    component.short_name || "";

            }


            // ========================================
            // ZIP CODE
            // ========================================

            if (
                types.includes(
                    "postal_code"
                )
            ) {

                result.zip =
                    String(
                        component.long_name || ""
                    )
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            5
                        );

            }

        }
    );


    return result;

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
// DOG BREED AUTOCOMPLETE
// ========================================

const DOG_BREEDS_API_URL =
    "https://dogapi.dog/api/v2/breeds?page[number]=1&page[size]=1000";


let signupDogBreeds =
    [];


// ========================================
// LOAD DOG BREEDS
// ========================================

async function loadSignupDogBreeds() {

    try {

        const response =
            await fetch(
                DOG_BREEDS_API_URL,
                {
                    method: "GET",

                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Dog breed API returned ${response.status}.`
            );

        }


        const payload =
            await response.json();


        if (
            !Array.isArray(
                payload?.data
            )
        ) {

            throw new Error(
                "Dog breed API returned an unexpected response."
            );

        }


        // ========================================
        // EXTRACT BREED NAMES
        // ========================================

        signupDogBreeds =
            payload.data
                .map(
                    breed => {

                        return String(
                            breed
                                ?.attributes
                                ?.name ||
                            ""
                        ).trim();

                    }
                )
                .filter(Boolean);


        // ========================================
        // REMOVE DUPLICATES
        // ========================================

        signupDogBreeds =
            Array.from(
                new Set(
                    signupDogBreeds
                )
            );


        // ========================================
        // SORT ALPHABETICALLY
        // ========================================

        signupDogBreeds.sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    undefined,
                    {
                        sensitivity:
                            "base"
                    }
                )
        );


        console.info(
            `Loaded ${signupDogBreeds.length} dog breeds for signup autocomplete.`
        );

    }
    catch (error) {

        /*
         * Breed autocomplete is optional.
         * Signup must still work if the API
         * cannot be reached.
         */

        console.warn(
            "Dog breed autocomplete could not be loaded:",
            error
        );


        signupDogBreeds =
            [];

    }

}


// ========================================
// BREED INPUT EVENT
// ========================================

petsContainer?.addEventListener(
    "input",
    event => {

        const breedInput =
            event.target.closest(
                '[name="pet_breed"]'
            );


        if (!breedInput) {
            return;
        }


        renderSignupBreedSuggestions(
            breedInput
        );

    }
);


// ========================================
// BREED INPUT FOCUS
// ========================================

petsContainer?.addEventListener(
    "focusin",
    event => {

        const breedInput =
            event.target.closest(
                '[name="pet_breed"]'
            );


        if (!breedInput) {
            return;
        }


        renderSignupBreedSuggestions(
            breedInput
        );

    }
);


// ========================================
// BREED SUGGESTION CLICK
// ========================================

petsContainer?.addEventListener(
    "click",
    event => {

        const suggestion =
            event.target.closest(
                "[data-breed-suggestion]"
            );


        if (!suggestion) {
            return;
        }


        const autocomplete =
            suggestion.closest(
                ".signup-breed-autocomplete"
            );


        const breedInput =
            autocomplete?.querySelector(
                '[name="pet_breed"]'
            );


        const suggestionList =
            autocomplete?.querySelector(
                ".signup-breed-suggestions"
            );


        if (!breedInput) {
            return;
        }


        breedInput.value =
            suggestion.dataset
                .breedSuggestion || "";


        breedInput.classList.remove(
            "signup-field-error"
        );


        breedInput.removeAttribute(
            "aria-invalid"
        );


        if (suggestionList) {

            suggestionList.hidden =
                true;

            suggestionList.innerHTML =
                "";

        }


        clearSignupError();


        breedInput.focus();

    }
);


// ========================================
// CLOSE BREED AUTOCOMPLETE
// ========================================

document.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                ".signup-breed-autocomplete"
            )
        ) {
            return;
        }


        closeAllSignupBreedSuggestions();

    }
);


// ========================================
// ESCAPE KEY CLOSE
// ========================================

petsContainer?.addEventListener(
    "keydown",
    event => {

        const breedInput =
            event.target.closest(
                '[name="pet_breed"]'
            );


        if (!breedInput) {
            return;
        }


        if (
            event.key ===
            "Escape"
        ) {

            closeAllSignupBreedSuggestions();

            breedInput.blur();

        }

    }
);


// ========================================
// RENDER BREED SUGGESTIONS
// ========================================

function renderSignupBreedSuggestions(
    breedInput
) {

    const autocomplete =
        breedInput.closest(
            ".signup-breed-autocomplete"
        );


    const suggestionList =
        autocomplete?.querySelector(
            ".signup-breed-suggestions"
        );


    if (!suggestionList) {
        return;
    }


    const searchValue =
        String(
            breedInput.value || ""
        )
            .trim()
            .toLowerCase();


    /*
     * Don't dump hundreds of breeds into
     * a dropdown when the field is empty.
     *
     * Start suggesting after 2 characters.
     */

    if (
        searchValue.length < 2 ||
        !signupDogBreeds.length
    ) {

        suggestionList.hidden =
            true;

        suggestionList.innerHTML =
            "";

        return;

    }


    // ========================================
    // FIND MATCHING BREEDS
    // ========================================

    const startsWithMatches =
        signupDogBreeds.filter(
            breed => {

                return breed
                    .toLowerCase()
                    .startsWith(
                        searchValue
                    );

            }
        );


    const containsMatches =
        signupDogBreeds.filter(
            breed => {

                const normalizedBreed =
                    breed.toLowerCase();


                return (
                    !normalizedBreed
                        .startsWith(
                            searchValue
                        ) &&
                    normalizedBreed
                        .includes(
                            searchValue
                        )
                );

            }
        );


    const matches =
        [
            ...startsWithMatches,
            ...containsMatches
        ]
            .slice(
                0,
                8
            );


    // ========================================
    // NO MATCHES
    // ========================================

    if (!matches.length) {

        suggestionList.hidden =
            true;

        suggestionList.innerHTML =
            "";

        return;

    }


    // ========================================
    // BUILD SUGGESTIONS
    // ========================================

    suggestionList.innerHTML =
        "";


    const fragment =
        document.createDocumentFragment();


    matches.forEach(
        breedName => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "signup-breed-suggestion";


            button.dataset
                .breedSuggestion =
                    breedName;


            button.textContent =
                breedName;


            fragment.appendChild(
                button
            );

        }
    );


    suggestionList.appendChild(
        fragment
    );


    suggestionList.hidden =
        false;

}


// ========================================
// CLOSE ALL BREED SUGGESTIONS
// ========================================

function closeAllSignupBreedSuggestions() {

    document
        .querySelectorAll(
            ".signup-breed-suggestions"
        )
        .forEach(
            suggestionList => {

                suggestionList.hidden =
                    true;

                suggestionList.innerHTML =
                    "";

            }
        );

}

// ========================================
// PET FIELD ERROR CLEARING
// ========================================

petsContainer?.addEventListener(
    "input",
    event => {

        const field =
            event.target.closest(
                "input, select"
            );


        if (!field) {
            return;
        }


        if (
            field.classList.contains(
                "signup-field-error"
            )
        ) {

            field.classList.remove(
                "signup-field-error"
            );


            field.removeAttribute(
                "aria-invalid"
            );

        }


        clearSignupError();

    }
);


petsContainer?.addEventListener(
    "change",
    event => {

        const field =
            event.target.closest(
                "input, select"
            );


        if (!field) {
            return;
        }


        if (
            field.classList.contains(
                "signup-field-error"
            )
        ) {

            field.classList.remove(
                "signup-field-error"
            );


            field.removeAttribute(
                "aria-invalid"
            );

        }


        clearSignupError();

    }
);

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
// SIGNUP VALIDATION HELPERS
// ========================================

function isValidSignupEmail(
    value
) {

    const email =
        String(
            value || ""
        )
            .trim()
            .toLowerCase();


    /*
     * Deliberately stricter than the browser's
     * built-in type="email" validation.
     *
     * Requires:
     * something@something.something
     */

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        email
    );

}


function clearSignupFieldErrors() {

    document
        .querySelectorAll(
            ".signup-field-error"
        )
        .forEach(
            field => {

                field.classList.remove(
                    "signup-field-error"
                );

                field.removeAttribute(
                    "aria-invalid"
                );

            }
        );

}


function markSignupFieldError(
    field
) {

    if (!field) {
        return;
    }


    clearSignupFieldErrors();


    field.classList.add(
        "signup-field-error"
    );


    field.setAttribute(
        "aria-invalid",
        "true"
    );

}


function showOwnerValidationError(
    message,
    field = null
) {

    showSignupError(
        message
    );


    if (field) {

        markSignupFieldError(
            field
        );

    }


    /*
     * Keep the user at the error message instead
     * of allowing focus() to yank the screen down
     * to the bad field.
     */

    requestAnimationFrame(
        () => {

            signupError?.scrollIntoView({
                behavior:
                    window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches
                        ? "auto"
                        : "smooth",

                block:
                    "center"
            });


            if (field) {

                window.setTimeout(
                    () => {

                        try {

                            field.focus({
                                preventScroll: true
                            });

                        }
                        catch {

                            field.focus();

                        }

                    },
                    350
                );

            }

        }
    );

}


// ========================================
// VALIDATE OWNER STEP
// ========================================

function validateOwnerStep() {

    clearSignupFieldErrors();


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


    // ========================================
    // CLIENT TYPE
    // ========================================

    if (!clientType) {

        showOwnerValidationError(
            "Please tell us whether you are a new or existing client."
        );

        return false;

    }


    // ========================================
    // FULL NAME
    // ========================================

    if (
        !fullName ||
        !String(
            fullName.value || ""
        ).trim()
    ) {

        showOwnerValidationError(
            "Please enter your full name.",
            fullName
        );

        return false;

    }


    if (
        !isValidFullName(
            fullName.value
        )
    ) {

        showOwnerValidationError(
            "Please enter your first and last name.",
            fullName
        );

        return false;

    }


    // ========================================
    // EMAIL
    // ========================================

    if (
        !email ||
        !String(
            email.value || ""
        ).trim()
    ) {

        showOwnerValidationError(
            "Please enter your email address.",
            email
        );

        return false;

    }


    if (
        !isValidSignupEmail(
            email.value
        )
    ) {

        showOwnerValidationError(
            "Please enter a valid email address, such as name@example.com.",
            email
        );

        return false;

    }


    // ========================================
    // PHONE
    // ========================================

    if (
        !phone ||
        !String(
            phone.value || ""
        ).trim()
    ) {

        showOwnerValidationError(
            "Please enter your phone number.",
            phone
        );

        return false;

    }


    const phoneDigits =
        phone.value.replace(
            /\D/g,
            ""
        );


    if (
        phoneDigits.length !==
        10
    ) {

        showOwnerValidationError(
            "Please enter a valid 10-digit phone number.",
            phone
        );

        return false;

    }


    // ========================================
    // PASSWORD
    // ========================================

    if (
        !password ||
        !password.value
    ) {

        showOwnerValidationError(
            "Please create a password.",
            password
        );

        return false;

    }


    if (
        password.value.length <
        8
    ) {

        showOwnerValidationError(
            "Your password must be at least 8 characters.",
            password
        );

        return false;

    }


    // ========================================
    // STREET ADDRESS
    // ========================================

    if (
        !addressLine1 ||
        !String(
            addressLine1.value || ""
        ).trim()
    ) {

        showOwnerValidationError(
            "Please enter your street address.",
            addressLine1
        );

        return false;

    }


    // ========================================
    // CITY
    // ========================================

    if (
        !city ||
        !String(
            city.value || ""
        ).trim()
    ) {

        showOwnerValidationError(
            "Please enter your city.",
            city
        );

        return false;

    }


    // ========================================
    // STATE
    // ========================================

    if (
        !state ||
        !String(
            state.value || ""
        ).trim()
    ) {

        showOwnerValidationError(
            "Please select your state.",
            state
        );

        return false;

    }


    // ========================================
    // ZIP CODE
    // ========================================

    if (
        !zip ||
        !String(
            zip.value || ""
        ).trim()
    ) {

        showOwnerValidationError(
            "Please enter your ZIP code.",
            zip
        );

        return false;

    }


    if (
        !/^\d{5}$/.test(
            zip.value.trim()
        )
    ) {

        showOwnerValidationError(
            "Please enter a valid 5-digit ZIP code.",
            zip
        );

        return false;

    }


    clearSignupFieldErrors();


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

    clearSignupFieldErrors();


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


        // ========================================
        // PET NAME
        // ========================================

        if (!petName) {

            showSignupError(
                `Please enter a name for Pet ${index + 1}.`
            );


            markSignupFieldError(
                nameInput
            );


            nameInput?.scrollIntoView({
                behavior:
                    window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches
                        ? "auto"
                        : "smooth",

                block:
                    "center"
            });


            window.setTimeout(
                () => {

                    try {

                        nameInput?.focus({
                            preventScroll: true
                        });

                    }
                    catch {

                        nameInput?.focus();

                    }

                },
                300
            );


            return null;

        }


        // ========================================
        // BREED
        // ========================================

        if (!breed) {

            showSignupError(
                `Please enter a breed for ${petName}.`
            );


            markSignupFieldError(
                breedInput
            );


            breedInput?.scrollIntoView({
                behavior:
                    window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches
                        ? "auto"
                        : "smooth",

                block:
                    "center"
            });


            window.setTimeout(
                () => {

                    try {

                        breedInput?.focus({
                            preventScroll: true
                        });

                    }
                    catch {

                        breedInput?.focus();

                    }

                },
                300
            );


            return null;

        }


        // ========================================
        // SAVE PET
        // ========================================

        pets.push({

            name:
                petName,

            breed,

            birthday:
                birthdayInput?.value || null,

            gender:
                genderInput?.value || null

        });

    }


    clearSignupFieldErrors();


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

function clearSignupError(
    event
) {

    if (signupError) {

        signupError.textContent =
            "";

        signupError.hidden =
            true;

    }


    /*
     * If the user edits the field that was
     * marked invalid, immediately remove its
     * red error state.
     */

    const field =
        event?.target;


    if (
        field &&
        field.classList
    ) {

        field.classList.remove(
            "signup-field-error"
        );


        field.removeAttribute(
            "aria-invalid"
        );

    }

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
