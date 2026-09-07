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

const PROFILE_PHOTO_BUCKET =
    "profile-photos";


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

let currentUser =
    null;


let currentProfile =
    null;


let currentHousehold =
    null;


let allProfiles =
    [];


let allPets =
    [];


let allVisits =
    [];


let allVisitPets =
    [];


let selectedAdminDate =
    null;


const adminNow =
    new Date();


let adminCalendarYear =
    adminNow.getFullYear();


let adminCalendarMonth =
    adminNow.getMonth();


let pendingAdminPhotoFile =
    null;


let adminPhotoPreviewObjectUrl =
    null;


const adminProfilePhotoUrlCache =
    new Map();



// ========================================
// LOAD ADMIN DASHBOARD
// ========================================

async function loadAdminDashboard() {


    const content =
        document.getElementById(
            "admin-content"
        );


    const loading =
        document.getElementById(
            "admin-loading"
        );


    if (
        !content ||
        !loading
    ) {

        return;

    }



    // ========================================
    // SESSION
    // ========================================

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
            "Admin session error:",
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



    // ========================================
    // CURRENT PROFILE
    // ========================================

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
            "Admin profile error:",
            profileError
        );


        loading.textContent =
            "We couldn't load your account profile.";


        return;

    }



    // ========================================
    // ADMIN SECURITY CHECK
    // ========================================

    if (
        profile.role !==
        "admin"
    ) {


        window.location.href =
            "./dashboard.html";


        return;

    }



    currentProfile =
        profile;



    // ========================================
    // ADMIN HOUSEHOLD
    // ========================================

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
            "Admin household error:",
            householdError
        );

    }



    currentHousehold =
        household ||
        null;



    // ========================================
    // LOAD BUSINESS DATA
    // ========================================

    const [

        profilesResult,
        petsResult,
        visitsResult

    ] =
        await Promise.all([


            supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, email, phone, role"
                ),


            supabaseClient
                .from("pets")
                .select(
                    "id, client_id, name, breed, gender"
                ),


            supabaseClient
                .from("visits")
                .select("*")
                .order(
                    "visit_date",
                    {
                        ascending: true
                    }
                )


        ]);



    if (
        profilesResult.error
    ) {


        console.error(
            "Admin profiles error:",
            profilesResult.error
        );

    }



    if (
        petsResult.error
    ) {


        console.error(
            "Admin pets error:",
            petsResult.error
        );

    }



    if (
        visitsResult.error
    ) {


        console.error(
            "Admin visits error:",
            visitsResult.error
        );


        loading.textContent =
            "We couldn't load the service calendar.";


        return;

    }



    allProfiles =
        profilesResult.data ||
        [];


    allPets =
        petsResult.data ||
        [];


    allVisits =
        visitsResult.data ||
        [];



    // ========================================
    // LOAD PETS ATTACHED TO VISITS
    // ========================================

    allVisitPets =
        [];


    const visitIds =
        allVisits.map(
            visit =>
                visit.id
        );



    if (
        visitIds.length >
        0
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



        if (
            visitPetsError
        ) {


            console.error(
                "Admin visit pets error:",
                visitPetsError
            );


        } else {


            allVisitPets =
                visitPets ||
                [];

        }

    }



    // ========================================
    // DEFAULT CALENDAR DATE
    // ========================================

    if (
        allVisits.length >
        0
    ) {


        const today =
            getLocalDateString();


        const firstUpcoming =
            allVisits.find(

                visit =>

                    visit.visit_date >=
                    today

            );



        const startingVisit =
            firstUpcoming ||
            allVisits[
                allVisits.length - 1
            ];



        if (
            startingVisit
        ) {


            const firstDate =
                parseLocalDate(
                    startingVisit.visit_date
                );


            adminCalendarYear =
                firstDate.getFullYear();


            adminCalendarMonth =
                firstDate.getMonth();


            selectedAdminDate =
                startingVisit.visit_date;

        }

    }



    if (
        !selectedAdminDate
    ) {


        selectedAdminDate =
            getLocalDateString();

    }



    // ========================================
    // RENDER
    // ========================================

    await renderAdminProfile();


    renderAdminCalendar();


    renderAdminDayServices();



    loading.style.display =
        "none";


    content.style.display =
        "block";

}



// ========================================
// ADMIN PROFILE
// ========================================

async function renderAdminProfile() {


    if (
        !currentProfile
    ) {

        return;

    }



    const name =
        currentProfile.full_name ||
        "Admin";


    const email =
        currentProfile.email ||
        currentUser?.email ||
        "Email not available";


    const phone =
        currentProfile.phone ||
        "Phone not added";



    document.getElementById(
        "admin-display-name"
    ).textContent =
        name;



    document.getElementById(
        "admin-display-email"
    ).textContent =
        email;



    document.getElementById(
        "admin-display-phone"
    ).textContent =
        phone;



    const initials =
        getInitials(
            name
        );



    const initialsElement =
        document.getElementById(
            "admin-profile-initials"
        );



    const image =
        document.getElementById(
            "admin-profile-image"
        );



    initialsElement.textContent =
        initials;


    initialsElement.style.display =
        "flex";


    image.style.display =
        "none";



    if (
        currentProfile.profile_photo_path
    ) {


        const photoUrl =
            await getAdminProfilePhotoUrl(
                currentProfile.profile_photo_path
            );



        if (
            photoUrl
        ) {


            image.src =
                photoUrl;


            image.style.display =
                "block";


            initialsElement.style.display =
                "none";

        }

    }



    renderAdminAddress();


    renderAdminEmergencyContact();

}



// ========================================
// ADDRESS
// ========================================

function renderAdminAddress() {


    const container =
        document.getElementById(
            "admin-display-address"
        );


    const household =
        currentHousehold ||
        {};


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



    const cityState =
        [

            household.city,
            household.state

        ]
            .filter(Boolean)
            .join(", ");



    const cityStateZip =
        `${cityState}${

            household.zip_code

                ? ` ${household.zip_code}`

                : ""

        }`
            .trim();



    if (
        cityStateZip
    ) {


        lines.push(
            cityStateZip
        );

    }



    if (
        lines.length ===
        0
    ) {


        container.textContent =
            "Not added";


        return;

    }



    container.innerHTML =
        lines
            .map(

                line =>
                    escapeHtml(
                        line
                    )

            )
            .join("<br>");

}



// ========================================
// EMERGENCY CONTACT
// ========================================

function renderAdminEmergencyContact() {


    const container =
        document.getElementById(
            "admin-display-emergency"
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



    const lines =
        [];



    if (
        name
    ) {


        lines.push(
            `<strong>${escapeHtml(name)}</strong>`
        );

    }



    if (
        phone
    ) {


        lines.push(
            escapeHtml(
                phone
            )
        );

    }



    container.innerHTML =
        lines.join("<br>");

}



// ========================================
// PROFILE PHOTO URL
// ========================================

async function getAdminProfilePhotoUrl(
    photoPath
) {


    if (
        !photoPath
    ) {

        return null;

    }



    if (
        adminProfilePhotoUrlCache.has(
            photoPath
        )
    ) {


        return adminProfilePhotoUrlCache.get(
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
            "Admin profile photo URL error:",
            error
        );


        return null;

    }



    adminProfilePhotoUrlCache.set(
        photoPath,
        data.signedUrl
    );



    return data.signedUrl;

}



// ========================================
// OPEN PROFILE FORM
// ========================================

document.getElementById(
    "admin-edit-profile-button"
)?.addEventListener(

    "click",

    openAdminProfileForm

);



document.getElementById(
    "admin-close-profile-form-button"
)?.addEventListener(

    "click",

    closeAdminProfileForm

);



document.getElementById(
    "admin-cancel-profile-button"
)?.addEventListener(

    "click",

    closeAdminProfileForm

);



async function openAdminProfileForm() {


    pendingAdminPhotoFile =
        null;


    clearAdminPhotoPreviewUrl();



    const profile =
        currentProfile ||
        {};


    const household =
        currentHousehold ||
        {};



    document.getElementById(
        "admin-full-name"
    ).value =
        profile.full_name ||
        "";



    document.getElementById(
        "admin-phone"
    ).value =
        profile.phone ||
        "";



    document.getElementById(
        "admin-email"
    ).value =
        profile.email ||
        currentUser?.email ||
        "";



    document.getElementById(
        "admin-street-address"
    ).value =
        household.street_address ||
        "";



    document.getElementById(
        "admin-address-line-2"
    ).value =
        household.address_line_2 ||
        "";



    document.getElementById(
        "admin-city"
    ).value =
        household.city ||
        "";



    document.getElementById(
        "admin-state"
    ).value =
        household.state ||
        "";



    document.getElementById(
        "admin-zip"
    ).value =
        household.zip_code ||
        "";



    document.getElementById(
        "admin-emergency-name"
    ).value =
        household.emergency_contact_name ||
        "";



    document.getElementById(
        "admin-emergency-phone"
    ).value =
        household.emergency_contact_phone ||
        "";



    document.getElementById(
        "admin-profile-message"
    ).textContent =
        "";



    document.getElementById(
        "admin-photo-input"
    ).value =
        "";



    await setAdminPhotoPreview();



    document.getElementById(
        "admin-profile-form-panel"
    ).style.display =
        "block";

}



// ========================================
// CLOSE PROFILE FORM
// ========================================

function closeAdminProfileForm() {


    pendingAdminPhotoFile =
        null;


    clearAdminPhotoPreviewUrl();



    const fileInput =
        document.getElementById(
            "admin-photo-input"
        );



    if (
        fileInput
    ) {


        fileInput.value =
            "";

    }



    document.getElementById(
        "admin-profile-form-panel"
    ).style.display =
        "none";

}



// ========================================
// PHOTO PREVIEW
// ========================================

async function setAdminPhotoPreview() {


    const preview =
        document.getElementById(
            "admin-photo-preview"
        );


    const initials =
        document.getElementById(
            "admin-photo-preview-initials"
        );



    initials.textContent =
        getInitials(
            currentProfile?.full_name ||
            "Admin"
        );


    initials.style.display =
        "flex";


    preview.style.display =
        "none";



    if (
        currentProfile?.profile_photo_path
    ) {


        const url =
            await getAdminProfilePhotoUrl(
                currentProfile.profile_photo_path
            );



        if (
            url
        ) {


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
// PHOTO INPUT
// ========================================

document.getElementById(
    "admin-photo-input"
)?.addEventListener(

    "change",

    event => {


        const file =
            event.target.files[0];


        const message =
            document.getElementById(
                "admin-profile-message"
            );



        message.textContent =
            "";



        if (
            !file
        ) {


            pendingAdminPhotoFile =
                null;


            return;

        }



        if (
            !ALLOWED_PHOTO_TYPES.includes(
                file.type
            )
        ) {


            event.target.value =
                "";


            pendingAdminPhotoFile =
                null;


            message.textContent =
                "Please choose a JPG, PNG, or WebP image.";


            return;

        }



        if (
            file.size >
            MAX_PHOTO_SIZE
        ) {


            event.target.value =
                "";


            pendingAdminPhotoFile =
                null;


            message.textContent =
                "That photo is larger than 5 MB.";


            return;

        }



        pendingAdminPhotoFile =
            file;


        clearAdminPhotoPreviewUrl();



        adminPhotoPreviewObjectUrl =
            URL.createObjectURL(
                file
            );



        const preview =
            document.getElementById(
                "admin-photo-preview"
            );



        preview.src =
            adminPhotoPreviewObjectUrl;


        preview.style.display =
            "block";



        document.getElementById(
            "admin-photo-preview-initials"
        ).style.display =
            "none";

    }

);



// ========================================
// SAVE PROFILE
// ========================================

document.getElementById(
    "admin-profile-form"
)?.addEventListener(

    "submit",

    async event => {


        event.preventDefault();



        const message =
            document.getElementById(
                "admin-profile-message"
            );


        const saveButton =
            document.getElementById(
                "admin-save-profile-button"
            );


        const fullName =
            document.getElementById(
                "admin-full-name"
            )
                .value
                .trim();



        if (
            !fullName
        ) {


            message.textContent =
                "Please enter your full name.";


            return;

        }



        message.textContent =
            "";


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";



        try {


            // ========================================
            // PROFILE
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
                                "admin-phone"
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
            // HOUSEHOLD
            // ========================================

            const householdPayload = {


                client_id:
                    currentUser.id,


                street_address:
                    valueOrNull(
                        "admin-street-address"
                    ),


                address_line_2:
                    valueOrNull(
                        "admin-address-line-2"
                    ),


                city:
                    valueOrNull(
                        "admin-city"
                    ),


                state:
                    valueOrNull(
                        "admin-state"
                    ),


                zip_code:
                    valueOrNull(
                        "admin-zip"
                    ),


                emergency_contact_name:
                    valueOrNull(
                        "admin-emergency-name"
                    ),


                emergency_contact_phone:
                    valueOrNull(
                        "admin-emergency-phone"
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
            // PROFILE PHOTO
            // ========================================

            if (
                pendingAdminPhotoFile
            ) {


                const oldPhotoPath =
                    currentProfile
                        ?.profile_photo_path ||
                    null;



                const newPhotoPath =
                    await uploadAdminPhoto(
                        pendingAdminPhotoFile
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

                        error: cleanupError

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
                        cleanupError
                    ) {


                        console.warn(
                            "Old profile photo cleanup failed:",
                            cleanupError
                        );

                    }

                }

            }



            await refreshAdminProfile();



            closeAdminProfileForm();



        } catch (
            error
        ) {


            console.error(
                "Admin profile save error:",
                error
            );


            message.textContent =
                "We couldn't save your profile.";



        } finally {


            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Profile";

        }

    }

);



// ========================================
// UPLOAD ADMIN PHOTO
// ========================================

async function uploadAdminPhoto(
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

                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type

                }

            );



    if (
        error
    ) {


        throw error;

    }



    return filePath;

}



// ========================================
// REFRESH PROFILE
// ========================================

async function refreshAdminProfile() {


    const [

        profileResult,
        householdResult

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



    currentProfile =
        profileResult.data;


    currentHousehold =
        householdResult.data ||
        null;



    adminProfilePhotoUrlCache.clear();



    await renderAdminProfile();

}



// ========================================
// CALENDAR NAVIGATION
// ========================================

document.getElementById(
    "admin-calendar-prev"
)?.addEventListener(

    "click",

    () => {


        adminCalendarMonth--;



        if (
            adminCalendarMonth <
            0
        ) {


            adminCalendarMonth =
                11;


            adminCalendarYear--;

        }



        selectedAdminDate =
            null;


        renderAdminCalendar();


        renderAdminDayServices();

    }

);



document.getElementById(
    "admin-calendar-next"
)?.addEventListener(

    "click",

    () => {


        adminCalendarMonth++;



        if (
            adminCalendarMonth >
            11
        ) {


            adminCalendarMonth =
                0;


            adminCalendarYear++;

        }



        selectedAdminDate =
            null;


        renderAdminCalendar();


        renderAdminDayServices();

    }

);



// ========================================
// RENDER ADMIN CALENDAR
// ========================================

function renderAdminCalendar() {


    const grid =
        document.getElementById(
            "admin-calendar-grid"
        );


    const label =
        document.getElementById(
            "admin-calendar-month-label"
        );



    if (
        !grid ||
        !label
    ) {


        return;

    }



    label.textContent =
        new Date(

            adminCalendarYear,
            adminCalendarMonth,
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



    const monthPrefix =
        `${adminCalendarYear}-${String(

            adminCalendarMonth +
            1

        ).padStart(

            2,
            "0"

        )}-`;



    const monthVisits =
        allVisits.filter(

            visit =>

                String(
                    visit.visit_date
                )
                    .startsWith(
                        monthPrefix
                    )

        );



    document.getElementById(
        "admin-month-service-count"
    ).textContent =
        monthVisits.length;



    grid.innerHTML =
        "";



    const firstDay =
        new Date(

            adminCalendarYear,
            adminCalendarMonth,
            1

        );



    let blanks =
        firstDay.getDay() -
        1;



    if (
        blanks <
        0
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

            adminCalendarYear,
            adminCalendarMonth + 1,
            0

        )
            .getDate();



    const today =
        getLocalDateString();



    for (
        let day = 1;
        day <= days;
        day++
    ) {


        const date =
            makeDateString(

                adminCalendarYear,
                adminCalendarMonth,
                day

            );



        const serviceCount =
            allVisits.filter(

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
            "upcoming-calendar-day admin-calendar-day";



        if (
            serviceCount >
            0
        ) {


            button.classList.add(
                "upcoming-calendar-booked"
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
            selectedAdminDate
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
                    serviceCount > 0

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


                selectedAdminDate =
                    date;


                renderAdminCalendar();


                renderAdminDayServices();

            }

        );



        grid.appendChild(
            button
        );

    }

}



// ========================================
// RENDER DAY SERVICES
// ========================================

function renderAdminDayServices() {


    const heading =
        document.getElementById(
            "admin-selected-date"
        );


    const count =
        document.getElementById(
            "admin-selected-service-count"
        );


    const container =
        document.getElementById(
            "admin-day-services"
        );



    if (
        !selectedAdminDate
    ) {


        heading.textContent =
            "Select a date";


        count.textContent =
            "0 services";


        container.innerHTML =
            `

                <p class="empty-upcoming-message">
                    Select a date on the calendar to view booked services.
                </p>

            `;


        return;

    }



    heading.textContent =
        formatLongDate(
            selectedAdminDate
        );



    const services =
        allVisits
            .filter(

                visit =>

                    visit.visit_date ===
                    selectedAdminDate

            )
            .sort(
                compareAdminVisits
            );



    count.textContent =
        `${services.length} ${

            services.length === 1

                ? "service"

                : "services"

        }`;



    if (
        services.length ===
        0
    ) {


        container.innerHTML =
            `

                <p class="empty-upcoming-message">
                    No client services booked for this date.
                </p>

            `;


        return;

    }



    container.innerHTML =
        services
            .map(

                visit =>
                    buildAdminServiceCard(
                        visit
                    )

            )
            .join("");

}



// ========================================
// BUILD SERVICE CARD
// ========================================

function buildAdminServiceCard(
    visit
) {


    const client =
        allProfiles.find(

            profile =>

                profile.id ===
                visit.client_id

        );



    const clientName =
        client?.full_name ||
        client?.email ||
        "Unknown Client";



    const pets =
        getAdminPetsForVisit(
            visit
        );



    const petNames =
        pets.length >
        0

            ? pets.map(
                pet =>
                    pet.name
            )

            : [
                "Pet not assigned"
            ];



    const price =
        Number(
            visit.price ||
            0
        );



    return `

        <article class="admin-service-card">


            <div class="admin-service-top">


                <div>


                    <div class="admin-service-time">

                        ${escapeHtml(

                            visit.time_window ||
                            "Time not set"

                        )}

                    </div>


                    <h5>

                        ${escapeHtml(

                            visit.service_name ||
                            visit.service_type ||
                            "Service"

                        )}

                    </h5>


                </div>



                <div class="admin-service-statuses">


                    <span class="service-status">

                        ${escapeHtml(

                            formatStatus(
                                visit.status
                            )

                        )}

                    </span>


                    <span class="service-status admin-payment-status">

                        ${escapeHtml(

                            formatStatus(
                                visit.payment_status
                            )

                        )}

                    </span>


                </div>


            </div>



            <div class="admin-service-main-grid">


                <div class="admin-service-detail">


                    <span>
                        Client
                    </span>


                    <strong>

                        ${escapeHtml(
                            clientName
                        )}

                    </strong>


                    ${
                        client?.phone

                            ? `

                                <small>
                                    ${escapeHtml(
                                        client.phone
                                    )}
                                </small>

                            `

                            : ""
                    }


                </div>



                <div class="admin-service-detail">


                    <span>

                        ${
                            petNames.length === 1

                                ? "Pet"

                                : "Pets"
                        }

                    </span>


                    <div class="service-pet-chips admin-service-pet-chips">


                        ${petNames

                            .map(

                                name => `

                                    <span class="service-pet-chip">
                                        ${escapeHtml(name)}
                                    </span>

                                `

                            )

                            .join("")}


                    </div>


                </div>



                <div class="admin-service-detail">


                    <span>
                        Price
                    </span>


                    <strong>
                        $${price.toFixed(2)}
                    </strong>


                </div>


            </div>


        </article>

    `;

}



// ========================================
// PETS FOR VISIT
// ========================================

function getAdminPetsForVisit(
    visit
) {


    const relations =
        allVisitPets
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
        relations
            .map(

                relation =>

                    allPets.find(

                        pet =>

                            Number(
                                pet.id
                            ) ===

                            Number(
                                relation.pet_id
                            )

                    )

            )
            .filter(Boolean);



    // Legacy fallback

    if (
        pets.length ===
        0 &&
        visit.pet_id
    ) {


        const legacyPet =
            allPets.find(

                pet =>

                    Number(
                        pet.id
                    ) ===

                    Number(
                        visit.pet_id
                    )

            );



        if (
            legacyPet
        ) {


            return [
                legacyPet
            ];

        }

    }



    return pets;

}



// ========================================
// SERVICE SORTING
// ========================================

function compareAdminVisits(
    a,
    b
) {


    const timeA =
        getTimeWindowSortMinutes(
            a.time_window
        );


    const timeB =
        getTimeWindowSortMinutes(
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
// TIME WINDOW SORT
// ========================================

function getTimeWindowSortMinutes(
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
// HELPERS
// ========================================

function valueOrNull(
    id
) {


    const element =
        document.getElementById(
            id
        );



    if (
        !element
    ) {


        return null;

    }



    const value =
        String(
            element.value ??
            ""
        )
            .trim();



    return (
        value ||
        null
    );

}



function getInitials(
    name
) {


    const words =
        String(
            name ||
            ""
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);



    if (
        words.length ===
        0
    ) {


        return "?";

    }



    if (
        words.length ===
        1
    ) {


        return words[0]
            .slice(
                0,
                2
            )
            .toUpperCase();

    }



    return (

        words[0][0] +

        words[
            words.length - 1
        ][0]

    )
        .toUpperCase();

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
        String(
            dateString
        )
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

    ).padStart(

        2,
        "0"

    )}-${String(

        day

    ).padStart(

        2,
        "0"

    )}`;

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



function formatLongDate(
    dateString
) {


    return parseLocalDate(
        dateString
    )
        .toLocaleDateString(

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



function formatStatus(
    status
) {


    if (
        !status
    ) {


        return "Not Set";

    }



    return String(
        status
    )
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
        value ??
        ""
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



function clearAdminPhotoPreviewUrl() {


    if (
        adminPhotoPreviewObjectUrl
    ) {


        URL.revokeObjectURL(
            adminPhotoPreviewObjectUrl
        );


        adminPhotoPreviewObjectUrl =
            null;

    }

}



// ========================================
// LOGOUT
// ========================================

document.getElementById(
    "admin-logout-button"
)?.addEventListener(

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
// START
// ========================================

loadAdminDashboard();
