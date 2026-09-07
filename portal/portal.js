const SUPABASE_URL =
    "https://xyhndwopvlmnxjkthtkl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_U3OIYatZuBUe8Y6Vq0DS2w_IMacau2j";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


let currentUser = null;

let currentPets = [];

let selectedDates = [];


// Current month displayed
// in the booking calendar.

const now =
    new Date();

let calendarYear =
    now.getFullYear();

let calendarMonth =
    now.getMonth();


// ========================================
// LOGIN
// ========================================

const loginForm =
    document.getElementById(
        "login-form"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document
                    .getElementById(
                        "email"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "password"
                    )
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


            window.location.href =
                "./dashboard.html";

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


    // NAME

    const welcomeName =
        document.getElementById(
            "welcome-name"
        );


    welcomeName.textContent =
        `Welcome, ${profile.full_name}`;


    // PET DISPLAY

    const petInfo =
        document.getElementById(
            "pet-info"
        );


    if (
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


    // UPCOMING WALKS DISPLAY

    const visitsContainer =
        document.getElementById(
            "upcoming-visits"
        );


    if (
        visits &&
        visits.length > 0
    ) {

        visitsContainer.innerHTML =
            visits
                .map(
                    visit => {

                        const price =
                            visit.price !== null
                                ? `$${Number(
                                    visit.price
                                ).toFixed(2)}`
                                : "";


                        const timeWindow =
                            visit.time_window ||
                            "";


                        return `
                            <div class="visit-card">

                                <strong>
                                    ${visit.service_name}
                                </strong>

                                <br>

                                ${formatDate(
                                    visit.visit_date
                                )}

                                ${
                                    timeWindow
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


    renderBookingCalendar();

}


// ========================================
// PET DROPDOWN
// ========================================

function populateBookingPets() {


    const petSelect =
        document.getElementById(
            "booking-pet"
        );


    if (!petSelect) {
        return;
    }


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


// ========================================
// OPEN BOOKING
// ========================================

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


            renderBookingCalendar();


            bookingSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

}


// ========================================
// CLOSE BOOKING
// ========================================

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


// ========================================
// CALENDAR NAVIGATION
// ========================================

const calendarPrev =
    document.getElementById(
        "calendar-prev"
    );


const calendarNext =
    document.getElementById(
        "calendar-next"
    );


if (calendarPrev) {

    calendarPrev.addEventListener(
        "click",
        () => {

            calendarMonth--;


            if (calendarMonth < 0) {

                calendarMonth = 11;

                calendarYear--;

            }


            renderBookingCalendar();

        }
    );

}


if (calendarNext) {

    calendarNext.addEventListener(
        "click",
        () => {

            calendarMonth++;


            if (calendarMonth > 11) {

                calendarMonth = 0;

                calendarYear++;

            }


            renderBookingCalendar();

        }
    );

}


// ========================================
// RENDER BOOKING CALENDAR
// ========================================

function renderBookingCalendar() {


    const grid =
        document.getElementById(
            "booking-calendar-grid"
        );


    const monthLabel =
        document.getElementById(
            "calendar-month-label"
        );


    if (
        !grid ||
        !monthLabel
    ) {

        return;

    }


    const monthDate =
        new Date(
            calendarYear,
            calendarMonth,
            1
        );


    monthLabel.textContent =
        monthDate.toLocaleDateString(
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


    // JS Sunday = 0.
    // Calendar Monday = first column.

    let leadingBlankDays =
        firstDay.getDay() - 1;


    if (
        leadingBlankDays < 0
    ) {

        leadingBlankDays = 6;

    }


    for (
        let i = 0;
        i < leadingBlankDays;
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


    const daysInMonth =
        new Date(
            calendarYear,
            calendarMonth + 1,
            0
        )
        .getDate();


    const todayString =
        getLocalDateString();


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateString =
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


        button.dataset.date =
            dateString;


        if (
            dateString <
            todayString
        ) {

            button.disabled =
                true;


            button.classList.add(
                "calendar-day-past"
            );

        }


        if (
            dateString ===
            todayString
        ) {

            button.classList.add(
                "calendar-day-today"
            );

        }


        if (
            selectedDates.includes(
                dateString
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
                    dateString
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


    const message =
        document.getElementById(
            "booking-message"
        );


    if (message) {

        message.textContent =
            "";

    }


    if (
        selectedDates.includes(
            date
        )
    ) {

        selectedDates =
            selectedDates.filter(
                selectedDate =>
                    selectedDate !== date
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


// ========================================
// REMOVE DATE FROM LIST
// ========================================

function removeSelectedDate(
    date
) {


    selectedDates =
        selectedDates.filter(
            selectedDate =>
                selectedDate !== date
        );


    renderSelectedDates();


    renderBookingCalendar();

}


// ========================================
// SELECTED DATE LIST
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


    count.textContent =
        `${selectedDates.length} ${
            selectedDates.length === 1
                ? "walk"
                : "walks"
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
                                data-remove-date="${date}"
                            >
                                Remove
                            </button>

                        </div>
                    `
                )
                .join("");


        const removeButtons =
            list.querySelectorAll(
                ".remove-date-button"
            );


        removeButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeSelectedDate(
                            button.dataset.removeDate
                        );

                    }
                );

            }
        );

    }


    updateBookingTotal();

}


// ========================================
// SERVICE PRICE
// ========================================

const bookingService =
    document.getElementById(
        "booking-service"
    );


if (bookingService) {

    bookingService.addEventListener(
        "change",
        updateBookingTotal
    );

}


// ========================================
// BOOKING TOTAL
// ========================================

function updateBookingTotal() {


    const serviceSelect =
        document.getElementById(
            "booking-service"
        );


    const priceDisplay =
        document.getElementById(
            "booking-price"
        );


    const countDisplay =
        document.getElementById(
            "booking-count"
        );


    if (
        !serviceSelect ||
        !priceDisplay ||
        !countDisplay
    ) {

        return;

    }


    const selectedOption =
        serviceSelect.options[
            serviceSelect.selectedIndex
        ];


    const price =
        Number(
            selectedOption.dataset.price
        ) || 0;


    const numberOfWalks =
        selectedDates.length;


    const total =
        price *
        numberOfWalks;


    countDisplay.textContent =
        `${numberOfWalks} ${
            numberOfWalks === 1
                ? "walk"
                : "walks"
        }`;


    priceDisplay.textContent =
        `$${total.toFixed(2)}`;

}


// ========================================
// WEEK HELPER
// ========================================

function getWeekKey(
    dateString
) {


    const parts =
        dateString.split("-");


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    const day =
        date.getDay();


    const differenceToMonday =
        day === 0
            ? -6
            : 1 - day;


    const monday =
        new Date(date);


    monday.setDate(
        date.getDate() +
        differenceToMonday
    );


    return makeDateString(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate()
    );

}


// ========================================
// VALIDATE 3 PER WEEK
// ========================================

function validateThreePerWeek() {


    if (
        selectedDates.length === 0
    ) {

        return {
            valid: false,
            message:
                "Please select at least 3 walk dates."
        };

    }


    const weeks =
        {};


    selectedDates.forEach(
        date => {

            const weekKey =
                getWeekKey(
                    date
                );


            if (
                !weeks[weekKey]
            ) {

                weeks[weekKey] =
                    [];

            }


            weeks[weekKey].push(
                date
            );

        }
    );


    const invalidWeeks =
        Object.values(
            weeks
        )
        .filter(
            dates =>
                dates.length < 3
        );


    if (
        invalidWeeks.length > 0
    ) {

        return {
            valid: false,
            message:
                "Please select at least 3 walk dates for each week you are booking."
        };

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


            message.textContent =
                "";


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


            const timeWindow =
                document
                    .getElementById(
                        "booking-time"
                    )
                    .value;


            if (
                !petId ||
                !serviceName ||
                !price ||
                !timeWindow
            ) {

                message.textContent =
                    "Please complete every field.";

                return;
            }


            const dateValidation =
                validateThreePerWeek();


            if (
                !dateValidation.valid
            ) {

                message.textContent =
                    dateValidation.message;

                return;
            }


            const bookingGroupId =
                crypto.randomUUID();


            const visitsToInsert =
                selectedDates.map(
                    date => ({
                        client_id:
                            currentUser.id,

                        pet_id:
                            Number(
                                petId
                            ),

                        service_name:
                            serviceName,

                        visit_date:
                            date,

                        time_window:
                            timeWindow,

                        status:
                            "requested",

                        price:
                            price,

                        payment_status:
                            "pending",

                        booking_group_id:
                            bookingGroupId
                    })
                );


            submitButton.disabled =
                true;


            submitButton.textContent =
                "Submitting...";


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("visits")
                    .insert(
                        visitsToInsert
                    )
                    .select();


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
                    "Continue";


                return;
            }


            console.log(
                "Bookings created:",
                data
            );


            const walkCount =
                selectedDates.length;


            message.textContent =
                `${walkCount} walks added successfully!`;


            selectedDates =
                [];


            bookingForm.reset();


            calendarYear =
                new Date()
                    .getFullYear();


            calendarMonth =
                new Date()
                    .getMonth();


            renderSelectedDates();


            renderBookingCalendar();


            submitButton.disabled =
                false;


            submitButton.textContent =
                "Continue";


            setTimeout(
                async () => {

                    bookingSection.style.display =
                        "none";


                    await loadDashboard();

                },
                1000
            );

        }
    );

}


// ========================================
// DATE HELPERS
// ========================================

function makeDateString(
    year,
    monthIndex,
    day
) {


    const month =
        String(
            monthIndex + 1
        )
        .padStart(
            2,
            "0"
        );


    const dayString =
        String(day)
            .padStart(
                2,
                "0"
            );


    return `${year}-${month}-${dayString}`;

}


function getLocalDateString() {


    const currentDate =
        new Date();


    return makeDateString(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
    );

}


function formatDate(
    dateString
) {


    if (!dateString) {
        return "";
    }


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
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// ========================================
// START DASHBOARD
// ========================================

loadDashboard();


// ========================================
// LOGOUT
// ========================================

const logoutButton =
    document.getElementById(
        "logout-button"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "./login.html";

        }
    );

}
