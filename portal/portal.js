const SUPABASE_URL =
    "https://xyhndwopvlmnxjkthtkl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_U3OIYatZuBUe8Y6Vq0DS2w_IMacau2j";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// Store logged-in user and pets
let currentUser = null;
let currentPets = [];


// -------------------------
// LOGIN
// -------------------------

const loginForm =
    document.getElementById("login-form");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const message =
                document.getElementById(
                    "login-message"
                );


            message.textContent =
                "Signing in...";


            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signInWithPassword({
                        email: email,
                        password: password
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


            window.location.href =
                "./dashboard.html";

        }
    );

}


// -------------------------
// DASHBOARD
// -------------------------

async function loadDashboard() {


    const dashboardContent =
        document.getElementById(
            "dashboard-content"
        );


    const loading =
        document.getElementById(
            "loading"
        );


    if (!dashboardContent) return;


    // -------------------------
    // SESSION
    // -------------------------

    const {
        data: { session },
        error: sessionError
    } =
        await supabaseClient.auth
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


    // -------------------------
    // PROFILE
    // -------------------------

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


    // -------------------------
    // PETS
    // -------------------------

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
            );


    if (petsError) {

        console.error(
            "Pets error:",
            petsError
        );

    }


    currentPets =
        pets || [];


    // -------------------------
    // UPCOMING VISITS
    // -------------------------

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
            .gte(
                "visit_date",
                today
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


    // -------------------------
    // DISPLAY NAME
    // -------------------------

    const welcomeName =
        document.getElementById(
            "welcome-name"
        );


    welcomeName.textContent =
        `Welcome, ${profile.full_name}`;


    // -------------------------
    // DISPLAY PETS
    // -------------------------

    const petInfo =
        document.getElementById(
            "pet-info"
        );


    if (
        currentPets &&
        currentPets.length > 0
    ) {

        petInfo.innerHTML =
            currentPets
                .map(
                    pet => `
                        <div class="pet-card">

                            <strong>
                                ${pet.name}
                            </strong>

                            <br>

                            ${pet.breed || ""}

                        </div>
                    `
                )
                .join("");

    } else {

        petInfo.textContent =
            "No pets found.";

    }


    populateBookingPets();


    // -------------------------
    // DISPLAY VISITS
    // -------------------------

    const visitsContainer =
        document.getElementById(
            "upcoming-visits"
        );


    if (
        visits &&
        visits.length > 0
    ) {

        visitsContainer.innerHTML =
            visits.map(
                visit => {

                    const price =
                        visit.price !== null
                            ? `$${Number(
                                visit.price
                            ).toFixed(2)}`
                            : "";


                    const timeWindow =
                        visit.time_window || "";


                    return `
                        <div class="visit-card">

                            <strong>
                                ${visit.service_name}
                            </strong>

                            <br>

                            ${formatDate(
                                visit.visit_date
                            )}

                            ${timeWindow
                                ? `<br>Preferred window: ${timeWindow}`
                                : ""
                            }

                            <br>

                            Status:
                            ${visit.status}

                            <br>

                            ${price}

                            <br>

                            Payment:
                            ${visit.payment_status}

                        </div>
                    `;

                }
            )
            .join("");

    } else {

        visitsContainer.textContent =
            "No upcoming visits.";

    }


    loading.style.display =
        "none";


    dashboardContent.style.display =
        "block";

}


// -------------------------
// BOOKING PET DROPDOWN
// -------------------------

function populateBookingPets() {


    const petSelect =
        document.getElementById(
            "booking-pet"
        );


    if (!petSelect) return;


    petSelect.innerHTML =
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


            petSelect.appendChild(
                option
            );

        }
    );

}


// -------------------------
// OPEN BOOKING FORM
// -------------------------

const requestWalkButton =
    document.getElementById(
        "request-walk-button"
    );


const bookingSection =
    document.getElementById(
        "booking-section"
    );


if (
    requestWalkButton &&
    bookingSection
) {

    requestWalkButton.addEventListener(
        "click",
        () => {

            bookingSection.style.display =
                "block";


            bookingSection.scrollIntoView({
                behavior: "smooth"
            });

        }
    );

}


// -------------------------
// CLOSE BOOKING FORM
// -------------------------

const closeBookingButton =
    document.getElementById(
        "close-booking-button"
    );


if (
    closeBookingButton &&
    bookingSection
) {

    closeBookingButton.addEventListener(
        "click",
        () => {

            bookingSection.style.display =
                "none";

        }
    );

}


// -------------------------
// SERVICE PRICE
// -------------------------

const bookingService =
    document.getElementById(
        "booking-service"
    );


if (bookingService) {

    bookingService.addEventListener(
        "change",
        updateBookingPrice
    );

}


function updateBookingPrice() {


    const serviceSelect =
        document.getElementById(
            "booking-service"
        );


    const priceDisplay =
        document.getElementById(
            "booking-price"
        );


    if (
        !serviceSelect ||
        !priceDisplay
    ) return;


    const selectedOption =
        serviceSelect.options[
            serviceSelect.selectedIndex
        ];


    const price =
        selectedOption.dataset.price;


    if (!price) {

        priceDisplay.textContent =
            "$0.00";

        return;
    }


    priceDisplay.textContent =
        `$${Number(price).toFixed(2)}`;

}


// -------------------------
// MINIMUM BOOKING DATE
// -------------------------

const bookingDate =
    document.getElementById(
        "booking-date"
    );


if (bookingDate) {

    bookingDate.min =
        getLocalDateString();

}


// -------------------------
// SUBMIT BOOKING
// -------------------------

const bookingForm =
    document.getElementById(
        "booking-form"
    );


if (bookingForm) {

    bookingForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "booking-message"
                );


            const submitButton =
                document.getElementById(
                    "booking-submit-button"
                );


            if (!currentUser) {

                message.textContent =
                    "Your login session expired.";

                return;
            }


            const petId =
                document
                    .getElementById(
                        "booking-pet"
                    )
                    .value;


            const serviceSelect =
                document.getElementById(
                    "booking-service"
                );


            const serviceName =
                serviceSelect.value;


            const selectedOption =
                serviceSelect.options[
                    serviceSelect.selectedIndex
                ];


            const price =
                Number(
                    selectedOption.dataset.price
                );


            const visitDate =
                document
                    .getElementById(
                        "booking-date"
                    )
                    .value;


            const timeWindow =
                document
                    .getElementById(
                        "booking-time"
                    )
                    .value;


            if (
                !petId ||
                !serviceName ||
                !visitDate ||
                !timeWindow ||
                !price
            ) {

                message.textContent =
                    "Please complete every field.";

                return;
            }


            submitButton.disabled =
                true;


            submitButton.textContent =
                "Submitting...";


            message.textContent =
                "";


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("visits")
                    .insert({

                        client_id:
                            currentUser.id,

                        pet_id:
                            Number(petId),

                        service_name:
                            serviceName,

                        visit_date:
                            visitDate,

                        time_window:
                            timeWindow,

                        status:
                            "requested",

                        price:
                            price,

                        payment_status:
                            "pending"

                    })
                    .select()
                    .single();


            if (error) {

                console.error(
                    "Booking error:",
                    error
                );


                message.textContent =
                    "We couldn't submit your walk request.";


                submitButton.disabled =
                    false;


                submitButton.textContent =
                    "Request Walk";


                return;
            }


            console.log(
                "Booking created:",
                data
            );


            message.textContent =
                "Walk request submitted!";


            bookingForm.reset();


            updateBookingPrice();


            submitButton.disabled =
                false;


            submitButton.textContent =
                "Request Walk";


            setTimeout(
                async () => {

                    bookingSection.style.display =
                        "none";


                    await loadDashboard();

                },
                800
            );

        }
    );

}


// -------------------------
// DATE HELPER
// -------------------------

function getLocalDateString() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// -------------------------
// DISPLAY DATE
// -------------------------

function formatDate(
    dateString
) {


    if (!dateString) return "";


    const parts =
        dateString.split("-");


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// -------------------------
// START DASHBOARD
// -------------------------

loadDashboard();


// -------------------------
// LOGOUT
// -------------------------

const logoutButton =
    document.getElementById(
        "logout-button"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            await supabaseClient.auth
                .signOut();


            window.location.href =
                "./login.html";

        }
    );

}
