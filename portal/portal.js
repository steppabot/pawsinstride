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

const MAX_PET_PHOTO_SIZE =
    5 * 1024 * 1024;

const ALLOWED_PET_PHOTO_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


// ========================================
// STATE
// ========================================

let currentUser = null;

let currentPets = [];

let currentVisits = [];

let currentVisitPets = [];

let selectedDates = [];

let selectedUpcomingDate = null;

let editingPet = null;

let pendingPetPhotoFile = null;

let petPhotoPreviewObjectUrl = null;

const petPhotoUrlCache =
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
        surcharge: 0
    },

    {
        value: "10:00 AM - 12:00 PM",
        label: "10:00 AM – 12:00 PM",
        surcharge: 0
    },

    {
        value: "12:00 PM - 2:00 PM",
        label: "12:00 PM – 2:00 PM",
        surcharge: 0
    },

    {
        value: "2:00 PM - 4:00 PM",
        label: "2:00 PM – 4:00 PM",
        surcharge: 0
    },

    {
        value: "4:00 PM - 6:00 PM",
        label: "4:00 PM – 6:00 PM",
        surcharge: 0
    },

    {
        value: "6:00 PM - 8:00 PM",
        label: "6:00 PM – 8:00 PM (+$5)",
        surcharge: 5
    },

    {
        value: "8:00 PM - 10:00 PM",
        label: "8:00 PM – 10:00 PM (+$10)",
        surcharge: 10
    }

];


const SERVICE_CONFIG = {

    "Dog Walking": {

        minimumPerWeek: 3,

        optionLabel: "Duration",

        additionalPetFee: 10,

        options: [

            {
                value: "15 Minutes",
                label: "15 Minutes — $30",
                price: 30
            },

            {
                value: "30 Minutes",
                label: "30 Minutes — $45",
                price: 45
            },

            {
                value: "60 Minutes",
                label: "60 Minutes — $65",
                price: 65
            }

        ]

    },


    "Drop-In Visit": {

        minimumPerWeek: 3,

        optionLabel: "Duration",

        additionalPetFee: 10,

        options: [

            {
                value: "15 Minutes",
                label: "15 Minutes — $30",
                price: 30
            },

            {
                value: "30 Minutes",
                label: "30 Minutes — $45",
                price: 45
            },

            {
                value: "60 Minutes",
                label: "60 Minutes — $65",
                price: 65
            }

        ]

    },


    "Pet Sitting": {

        minimumPerWeek: 0,

        optionLabel: "Package",

        additionalPetFee: 0,

        options: [

            {
                value: "Basic Sit - 4 Hours",
                label: "Basic Sit — 4 Hours — $100",
                price: 100,

                timeBlocks: [
                    "7:00 AM - 11:00 AM",
                    "11:00 AM - 3:00 PM",
                    "3:00 PM - 7:00 PM",
                    "7:00 PM - 11:00 PM"
                ]
            },

            {
                value: "Standard Sit - 8 Hours",
                label: "Standard Sit — 8 Hours — $180",
                price: 180,

                timeBlocks: [
                    "7:00 AM - 3:00 PM",
                    "3:00 PM - 11:00 PM"
                ]
            },

            {
                value: "VIP Sit - 12 Hours",
                label: "VIP Sit — 12 Hours — $240",
                price: 240,

                timeBlocks: [
                    "7:00 AM - 7:00 PM",
                    "11:00 AM - 11:00 PM"
                ]
            }

        ]

    },


    "Dog Boarding": {

        boarding: true,

        pricePerPetPerNight: 100

    }

};


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
        async event => {

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


    currentVisits =
        visits || [];


    // PETS ATTACHED TO UPCOMING VISITS

    currentVisitPets =
        [];


    const visitIds =
        currentVisits
            .map(
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


    // WELCOME

    const welcomeName =
        document.getElementById(
            "welcome-name"
        );


    if (welcomeName) {

        welcomeName.textContent =
            `Welcome, ${profile.full_name}`;

    }


    await renderPets();

    populateBookingPets();

    renderAdditionalPets();


    if (
        currentVisits.length > 0 &&
        !selectedUpcomingDate
    ) {

        const firstDate =
            parseLocalDate(
                currentVisits[0].visit_date
            );


        upcomingCalendarYear =
            firstDate.getFullYear();


        upcomingCalendarMonth =
            firstDate.getMonth();


        selectedUpcomingDate =
            currentVisits[0].visit_date;

    }


    if (
        currentVisits.length === 0
    ) {

        selectedUpcomingDate =
            today;

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

                        const petId =
                            Number(
                                button.dataset.petId
                            );


                        openEditPetForm(
                            petId
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

        console.error(
            "Pet photo signed URL error:",
            error
        );


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


const closePetFormButton =
    document.getElementById(
        "close-pet-form-button"
    );


if (closePetFormButton) {

    closePetFormButton.addEventListener(
        "click",
        closePetForm
    );

}


const cancelPetButton =
    document.getElementById(
        "cancel-pet-button"
    );


if (cancelPetButton) {

    cancelPetButton.addEventListener(
        "click",
        closePetForm
    );

}


function openAddPetForm() {


    editingPet =
        null;


    pendingPetPhotoFile =
        null;


    clearPetPhotoPreviewUrl();


    petForm.reset();


    document.getElementById(
        "pet-id"
    ).value =
        "";


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


    const photoUrl =
        await getPetDisplayUrl(
            pet
        );


    document.getElementById(
        "pet-photo-preview"
    ).src =
        photoUrl;


    petFormPanel.style.display =
        "block";


    petFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ========================================
// CLOSE PET FORM
// ========================================

function closePetForm() {


    editingPet =
        null;


    pendingPetPhotoFile =
        null;


    clearPetPhotoPreviewUrl();


    if (petForm) {

        petForm.reset();

    }


    if (petFormPanel) {

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


            message.textContent =
                "";


            if (!file) {

                pendingPetPhotoFile =
                    null;

                return;

            }


            if (
                !ALLOWED_PET_PHOTO_TYPES.includes(
                    file.type
                )
            ) {

                petPhotoInput.value =
                    "";


                pendingPetPhotoFile =
                    null;


                message.textContent =
                    "Please choose a JPG, PNG, or WebP image.";

                return;

            }


            if (
                file.size >
                MAX_PET_PHOTO_SIZE
            ) {

                petPhotoInput.value =
                    "";


                pendingPetPhotoFile =
                    null;


                message.textContent =
                    "That photo is larger than 5 MB. Please choose a smaller image.";

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


            message.textContent =
                "";


            if (!currentUser) {

                message.textContent =
                    "Your login session expired.";

                return;

            }


            const name =
                document
                    .getElementById(
                        "pet-name"
                    )
                    .value
                    .trim();


            const breed =
                document
                    .getElementById(
                        "pet-breed"
                    )
                    .value
                    .trim();


            const gender =
                document
                    .getElementById(
                        "pet-gender"
                    )
                    .value;


            const birthday =
                document
                    .getElementById(
                        "pet-birthday"
                    )
                    .value;


            const feedingNotes =
                document
                    .getElementById(
                        "pet-feeding-notes"
                    )
                    .value
                    .trim();


            const careNotes =
                document
                    .getElementById(
                        "pet-care-notes"
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
                    breed || null,

                gender:
                    gender || null,

                birthday:
                    birthday || null,

                feeding_notes:
                    feedingNotes || null,

                care_notes:
                    careNotes || null

            };


            saveButton.disabled =
                true;


            saveButton.textContent =
                editingPet
                    ? "Saving..."
                    : "Adding...";


            let savedPet;


            if (editingPet) {

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

                    console.error(
                        "Pet update error:",
                        error
                    );


                    message.textContent =
                        "We couldn't save those changes.";


                    saveButton.disabled =
                        false;


                    saveButton.textContent =
                        "Save Changes";

                    return;

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

                    console.error(
                        "Pet insert error:",
                        error
                    );


                    message.textContent =
                        "We couldn't add your pet.";


                    saveButton.disabled =
                        false;


                    saveButton.textContent =
                        "Add Pet";

                    return;

                }


                savedPet =
                    data;

            }


            if (
                pendingPetPhotoFile
            ) {

                const oldPhotoPath =
                    editingPet
                        ? editingPet.photo_path
                        : null;


                try {

                    const newPhotoPath =
                        await uploadPetPhoto(
                            savedPet.id,
                            pendingPetPhotoFile
                        );


                    const {
                        error: photoPathError
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


                    if (photoPathError) {

                        await supabaseClient
                            .storage
                            .from(
                                PET_PHOTO_BUCKET
                            )
                            .remove([
                                newPhotoPath
                            ]);


                        throw photoPathError;

                    }


                    if (
                        oldPhotoPath &&
                        oldPhotoPath !==
                            newPhotoPath
                    ) {

                        const {
                            error: oldPhotoDeleteError
                        } =
                            await supabaseClient
                                .storage
                                .from(
                                    PET_PHOTO_BUCKET
                                )
                                .remove([
                                    oldPhotoPath
                                ]);


                        if (
                            oldPhotoDeleteError
                        ) {

                            console.warn(
                                "Old pet photo cleanup failed:",
                                oldPhotoDeleteError
                            );

                        }


                        petPhotoUrlCache.delete(
                            oldPhotoPath
                        );

                    }

                } catch (
                    photoError
                ) {

                    console.error(
                        "Pet photo upload error:",
                        photoError
                    );


                    await refreshPets();


                    message.textContent =
                        "Your pet was saved, but the photo couldn't be uploaded. You can edit the pet and try the photo again.";


                    saveButton.disabled =
                        false;


                    saveButton.textContent =
                        editingPet
                            ? "Save Changes"
                            : "Add Pet";

                    return;

                }

            }


            await refreshPets();


            closePetForm();


            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Pet";

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


    let extension;


    switch (
        file.type
    ) {

        case "image/jpeg":
            extension = "jpg";
            break;

        case "image/png":
            extension = "png";
            break;

        case "image/webp":
            extension = "webp";
            break;

        default:
            throw new Error(
                "Unsupported image type."
            );

    }


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
// BOOKING PET DROPDOWN
// ========================================

const bookingPetSelect =
    document.getElementById(
        "booking-pet"
    );


function populateBookingPets() {


    if (!bookingPetSelect) {
        return;
    }


    const existingValue =
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
                String(existingValue)
        )
    ) {

        bookingPetSelect.value =
            existingValue;

    }

}


if (bookingPetSelect) {

    bookingPetSelect.addEventListener(
        "change",
        () => {

            renderAdditionalPets();

            updateBookingTotal();

        }
    );

}


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
                    checkbox =>
                        Number(
                            checkbox.value
                        )
                )
        );


    const additionalPets =
        currentPets.filter(
            pet =>
                Number(pet.id) !==
                primaryPetId
        );


    if (
        additionalPets.length === 0
    ) {

        wrapper.style.display =
            "none";

        return;

    }


    wrapper.style.display =
        "block";


    list.innerHTML =
        additionalPets
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


// ========================================
// MULTI PET HELPERS
// ========================================

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

        return "$100 / night";

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


    if (
        serviceType ===
            "Dog Walking"
    ) {

        help.textContent =
            "Each additional dog is $10 per walk.";

        return;

    }


    if (
        serviceType ===
            "Drop-In Visit"
    ) {

        help.textContent =
            "Each additional pet is $10 per drop-in visit.";

        return;

    }


    if (
        serviceType ===
            "Pet Sitting"
    ) {

        help.textContent =
            "There is no additional pet charge for Pet Sitting.";

        return;

    }


    if (
        serviceType ===
            "Dog Boarding"
    ) {

        help.textContent =
            "Boarding is $100 per pet, per night.";

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


function getSelectedPetIds() {


    const primaryPetId =
        Number(
            bookingPetSelect?.value
        );


    if (!primaryPetId) {

        return [];

    }


    return [
        primaryPetId,
        ...getSelectedAdditionalPetIds()
    ];

}


function getSelectedPetCount() {


    return getSelectedPetIds()
        .length;

}


// ========================================
// BOOKING OPEN / CLOSE
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

            renderAdditionalPets();


            bookingSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

}


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
// SERVICE TYPE
// ========================================

const serviceTypeSelect =
    document.getElementById(
        "service-type"
    );


if (serviceTypeSelect) {

    serviceTypeSelect.addEventListener(
        "change",
        handleServiceTypeChange
    );

}


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


    const optionSelect =
        document.getElementById(
            "service-option"
        );


    const timeSelect =
        document.getElementById(
            "booking-time"
        );


    clearBookingMessage();


    selectedDates =
        [];


    renderSelectedDates();


    optionSelect.innerHTML =
        `
            <option value="">
                Select an option
            </option>
        `;


    timeSelect.innerHTML =
        `
            <option value="">
                Select a time
            </option>
        `;


    optionWrapper.style.display =
        "none";


    timeWrapper.style.display =
        "none";


    multiDate.style.display =
        "none";


    boarding.style.display =
        "none";


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
            "Select at least 3 service dates per week. Tap a date again to remove it.";

    }


    if (
        serviceType ===
        "Pet Sitting"
    ) {

        document.getElementById(
            "booking-date-help"
        ).textContent =
            "Select one or more pet sitting dates. Tap a date again to remove it.";

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


    const optionSelect =
        document.getElementById(
            "service-option"
        );


    const optionLabel =
        document.getElementById(
            "service-option-label"
        );


    optionLabel.textContent =
        config.optionLabel;


    optionSelect.innerHTML =
        `
            <option value="">
                Select ${config.optionLabel.toLowerCase()}
            </option>
        `;


    config.options.forEach(
        option => {

            const element =
                document.createElement(
                    "option"
                );


            element.value =
                option.value;


            element.textContent =
                option.label;


            element.dataset.price =
                option.price;


            optionSelect.appendChild(
                element
            );

        }
    );

}


// ========================================
// SERVICE OPTION CHANGE
// ========================================

const serviceOptionSelect =
    document.getElementById(
        "service-option"
    );


if (serviceOptionSelect) {

    serviceOptionSelect.addEventListener(
        "change",
        () => {

            const serviceType =
                serviceTypeSelect.value;


            if (
                serviceType ===
                "Pet Sitting"
            ) {

                populatePetSittingTimeBlocks();

            }


            updateBookingTotal();

        }
    );

}


// ========================================
// TIME WINDOWS
// ========================================

function populatePreferredTimeWindows() {


    const wrapper =
        document.getElementById(
            "time-window-wrapper"
        );


    const label =
        document.getElementById(
            "time-window-label"
        );


    const select =
        document.getElementById(
            "booking-time"
        );


    wrapper.style.display =
        "block";


    label.textContent =
        "Preferred Time Window";


    select.innerHTML =
        `
            <option value="">
                Select a time window
            </option>
        `;


    TIME_WINDOWS.forEach(
        window => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                window.value;


            option.textContent =
                window.label;


            option.dataset.surcharge =
                window.surcharge;


            select.appendChild(
                option
            );

        }
    );

}


// ========================================
// PET SITTING TIME BLOCKS
// ========================================

function populatePetSittingTimeBlocks() {


    const wrapper =
        document.getElementById(
            "time-window-wrapper"
        );


    const label =
        document.getElementById(
            "time-window-label"
        );


    const select =
        document.getElementById(
            "booking-time"
        );


    const selectedPackage =
        serviceOptionSelect.value;


    select.innerHTML =
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


    const config =
        SERVICE_CONFIG[
            "Pet Sitting"
        ];


    const packageInfo =
        config.options.find(
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


    label.textContent =
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


            select.appendChild(
                option
            );

        }
    );

}


// ========================================
// TIME CHANGE
// ========================================

const bookingTime =
    document.getElementById(
        "booking-time"
    );


if (bookingTime) {

    bookingTime.addEventListener(
        "change",
        updateBookingTotal
    );

}


// ========================================
// BOOKING CALENDAR NAVIGATION
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

}


if (calendarNext) {

    calendarNext.addEventListener(
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


    monthLabel.textContent =
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


    let leadingBlankDays =
        firstDay.getDay() - 1;


    if (
        leadingBlankDays < 0
    ) {

        leadingBlankDays =
            6;

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
        ).getDate();


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
// SELECT BOOKING DATE
// ========================================

function toggleSelectedDate(
    date
) {


    clearBookingMessage();


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
// SELECTED BOOKING DATES
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
                                data-remove-date="${date}"
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


if (boardingDropoff) {

    boardingDropoff.addEventListener(
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

}


if (boardingPickup) {

    boardingPickup.addEventListener(
        "change",
        updateBookingTotal
    );

}


if (boardingPickupWindow) {

    boardingPickupWindow.addEventListener(
        "change",
        updateBookingTotal
    );

}


function resetBoardingDates() {


    if (!boardingDropoff) {
        return;
    }


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


// ========================================
// BOOKING PRICE
// ========================================

function updateBookingTotal() {


    const serviceType =
        serviceTypeSelect
            ? serviceTypeSelect.value
            : "";


    const priceDisplay =
        document.getElementById(
            "booking-price"
        );


    const countDisplay =
        document.getElementById(
            "booking-count"
        );


    const detailDisplay =
        document.getElementById(
            "booking-price-details"
        );


    if (
        !priceDisplay ||
        !countDisplay ||
        !detailDisplay
    ) {
        return;
    }


    const petCount =
        getSelectedPetCount();


    const additionalPetCount =
        Math.max(
            petCount - 1,
            0
        );


    if (!serviceType) {

        countDisplay.textContent =
            "0 services";


        priceDisplay.textContent =
            "$0.00";


        detailDisplay.textContent =
            "";

        return;

    }


    // BOARDING

    if (
        serviceType ===
        "Dog Boarding"
    ) {

        const nights =
            getBoardingNightCount();


        const pickupFee =
            getBoardingPickupFee();


        const boardingPetCount =
            Math.max(
                petCount,
                1
            );


        const nightlyTotal =
            100 *
            boardingPetCount;


        const total =
            (nights * nightlyTotal) +
            pickupFee;


        countDisplay.textContent =
            `${nights} ${
                nights === 1
                    ? "night"
                    : "nights"
            }`;


        priceDisplay.textContent =
            `$${total.toFixed(2)}`;


        if (
            nights > 0 &&
            petCount > 0
        ) {

            let details =
                `${boardingPetCount} ${
                    boardingPetCount === 1
                        ? "pet"
                        : "pets"
                } × $100 × ${nights} ${
                    nights === 1
                        ? "night"
                        : "nights"
                }`;


            if (
                pickupFee > 0
            ) {

                details +=
                    " + $50 extended pickup";

            }


            detailDisplay.textContent =
                details;

        } else {

            detailDisplay.textContent =
                "";

        }


        return;

    }


    // WALK / DROP-IN / PET SITTING

    const selectedOption =
        serviceOptionSelect.options[
            serviceOptionSelect.selectedIndex
        ];


    const basePrice =
        Number(
            selectedOption
                ? selectedOption.dataset.price
                : 0
        ) || 0;


    let eveningSurcharge =
        0;


    if (
        serviceType ===
            "Dog Walking" ||
        serviceType ===
            "Drop-In Visit"
    ) {

        const timeOption =
            bookingTime.options[
                bookingTime.selectedIndex
            ];


        eveningSurcharge =
            Number(
                timeOption
                    ? timeOption.dataset.surcharge
                    : 0
            ) || 0;

    }


    let additionalPetTotal =
        0;


    if (
        serviceType ===
            "Dog Walking" ||
        serviceType ===
            "Drop-In Visit"
    ) {

        additionalPetTotal =
            additionalPetCount * 10;

    }


    if (
        serviceType ===
        "Pet Sitting"
    ) {

        additionalPetTotal =
            0;

    }


    const pricePerService =
        basePrice +
        eveningSurcharge +
        additionalPetTotal;


    const total =
        pricePerService *
        selectedDates.length;


    countDisplay.textContent =
        `${selectedDates.length} ${
            selectedDates.length === 1
                ? "service"
                : "services"
        }`;


    priceDisplay.textContent =
        `$${total.toFixed(2)}`;


    if (
        selectedDates.length > 0 &&
        basePrice > 0
    ) {

        const detailParts =
            [];


        detailParts.push(
            `${selectedDates.length} × $${basePrice}`
        );


        if (
            additionalPetTotal > 0
        ) {

            detailParts.push(
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

            detailParts.push(
                `${additionalPetCount} additional ${
                    additionalPetCount === 1
                        ? "pet included"
                        : "pets included"
                } at no charge`
            );

        }


        if (
            eveningSurcharge > 0
        ) {

            detailParts.push(
                `$${eveningSurcharge} evening fee per visit`
            );

        }


        detailDisplay.textContent =
            detailParts.join(" + ");

    } else {

        detailDisplay.textContent =
            "";

    }

}


// ========================================
// BOARDING PRICE HELPERS
// ========================================

function getBoardingNightCount() {


    if (
        !boardingDropoff ||
        !boardingPickup ||
        !boardingDropoff.value ||
        !boardingPickup.value
    ) {

        return 0;

    }


    const start =
        parseLocalDate(
            boardingDropoff.value
        );


    const end =
        parseLocalDate(
            boardingPickup.value
        );


    const difference =
        end.getTime() -
        start.getTime();


    if (
        difference <= 0
    ) {

        return 0;

    }


    return Math.round(
        difference /
        86400000
    );

}


function getBoardingPickupFee() {


    if (
        !boardingPickupWindow ||
        !boardingPickupWindow.value
    ) {

        return 0;

    }


    const option =
        boardingPickupWindow.options[
            boardingPickupWindow.selectedIndex
        ];


    return Number(
        option.dataset.fee
    ) || 0;

}


// ========================================
// THREE PER WEEK VALIDATION
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


function validateThreePerWeek() {


    if (
        selectedDates.length === 0
    ) {

        return {
            valid: false,
            message:
                "Please select at least 3 service dates."
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


            if (!weeks[weekKey]) {

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
                "Dog Walking and Drop-In Visits require at least 3 selected dates for each week you are booking."
        };

    }


    return {
        valid: true
    };

}


// ========================================
// CREATE VISIT PET ROWS
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
                    Number(primaryPetId),

                is_primary:
                    true,

                additional_pet_fee:
                    0

            });


            additionalPetIds.forEach(
                petId => {

                    let additionalFee =
                        0;


                    if (
                        serviceType ===
                            "Dog Walking" ||
                        serviceType ===
                            "Drop-In Visit"
                    ) {

                        additionalFee =
                            10;

                    }


                    if (
                        serviceType ===
                        "Pet Sitting"
                    ) {

                        additionalFee =
                            0;

                    }


                    if (
                        serviceType ===
                        "Dog Boarding"
                    ) {

                        additionalFee =
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
                            additionalFee

                    });

                }
            );

        }
    );


    if (
        rows.length === 0
    ) {

        return;

    }


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


            const submitButton =
                document.getElementById(
                    "booking-submit-button"
                );


            message.textContent =
                "";


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
                    "Please select your primary pet and service type.";

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
                    submitButton
                );

                return;

            }


            const serviceOption =
                serviceOptionSelect.value;


            const timeWindow =
                bookingTime.value;


            if (!serviceOption) {

                message.textContent =
                    "Please select a service option.";

                return;

            }


            if (!timeWindow) {

                message.textContent =
                    serviceType ===
                        "Pet Sitting"
                        ? "Please select a pet sitting time block."
                        : "Please select a preferred time window.";

                return;

            }


            if (
                serviceType ===
                    "Dog Walking" ||
                serviceType ===
                    "Drop-In Visit"
            ) {

                const validation =
                    validateThreePerWeek();


                if (
                    !validation.valid
                ) {

                    message.textContent =
                        validation.message;

                    return;

                }

            } else if (
                selectedDates.length < 1
            ) {

                message.textContent =
                    "Please select at least one date.";

                return;

            }


            const selectedOption =
                serviceOptionSelect.options[
                    serviceOptionSelect.selectedIndex
                ];


            const basePrice =
                Number(
                    selectedOption.dataset.price
                ) || 0;


            let eveningSurcharge =
                0;


            if (
                serviceType ===
                    "Dog Walking" ||
                serviceType ===
                    "Drop-In Visit"
            ) {

                const timeOption =
                    bookingTime.options[
                        bookingTime.selectedIndex
                    ];


                eveningSurcharge =
                    Number(
                        timeOption.dataset.surcharge
                    ) || 0;

            }


            let additionalPetCharge =
                0;


            if (
                serviceType ===
                    "Dog Walking" ||
                serviceType ===
                    "Drop-In Visit"
            ) {

                additionalPetCharge =
                    additionalPetIds.length *
                    10;

            }


            if (
                serviceType ===
                "Pet Sitting"
            ) {

                additionalPetCharge =
                    0;

            }


            const pricePerVisit =
                basePrice +
                eveningSurcharge +
                additionalPetCharge;


            const bookingGroupId =
                crypto.randomUUID();


            const serviceName =
                `${serviceType} - ${serviceOption}`;


            const visitsToInsert =
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
                            serviceName,

                        visit_date:
                            date,

                        time_window:
                            timeWindow,

                        status:
                            "requested",

                        price:
                            pricePerVisit,

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


            try {

                const {
                    data: insertedVisits,
                    error: visitInsertError
                } =
                    await supabaseClient
                        .from("visits")
                        .insert(
                            visitsToInsert
                        )
                        .select(
                            "id, visit_date"
                        );


                if (visitInsertError) {

                    throw visitInsertError;

                }


                await attachPetsToVisits(
                    insertedVisits || [],
                    primaryPetId,
                    additionalPetIds,
                    serviceType
                );


                const serviceCount =
                    selectedDates.length;


                message.textContent =
                    `${serviceCount} ${
                        serviceCount === 1
                            ? "service"
                            : "services"
                    } added successfully!`;


                resetBookingForm();


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
                    900
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


                submitButton.disabled =
                    false;


                submitButton.textContent =
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
    submitButton
) {


    const dropoff =
        boardingDropoff.value;


    const pickup =
        boardingPickup.value;


    const pickupWindow =
        boardingPickupWindow.value;


    if (
        !dropoff ||
        !pickup ||
        !pickupWindow
    ) {

        message.textContent =
            "Please select your boarding drop-off date, pick-up date, and pick-up time.";

        return;

    }


    const nights =
        getBoardingNightCount();


    if (
        nights < 1
    ) {

        message.textContent =
            "Your pick-up date must be after your drop-off date.";

        return;

    }


    const boardingDates =
        getBoardingNightDates(
            dropoff,
            pickup
        );


    const pickupFee =
        getBoardingPickupFee();


    const bookingGroupId =
        crypto.randomUUID();


    const petCount =
        1 +
        additionalPetIds.length;


    const nightlyPrice =
        petCount *
        100;


    const rows =
        boardingDates.map(
            (date, index) => {

                let rowPrice =
                    nightlyPrice;


                if (
                    index ===
                        boardingDates.length - 1 &&
                    pickupFee > 0
                ) {

                    rowPrice +=
                        pickupFee;

                }


                return {

                    client_id:
                        currentUser.id,

                    pet_id:
                        Number(primaryPetId),

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
                        rowPrice,

                    payment_status:
                        "pending",

                    booking_group_id:
                        bookingGroupId

                };

            }
        );


    submitButton.disabled =
        true;


    submitButton.textContent =
        "Submitting...";


    try {

        const {
            data: insertedVisits,
            error: visitInsertError
        } =
            await supabaseClient
                .from("visits")
                .insert(
                    rows
                )
                .select(
                    "id, visit_date"
                );


        if (visitInsertError) {

            throw visitInsertError;

        }


        await attachPetsToVisits(
            insertedVisits || [],
            primaryPetId,
            additionalPetIds,
            "Dog Boarding"
        );


        message.textContent =
            `${nights} ${
                nights === 1
                    ? "night"
                    : "nights"
            } of boarding added successfully!`;


        resetBookingForm();


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
            900
        );

    } catch (
        error
    ) {

        console.error(
            "Boarding booking error:",
            error
        );


        message.textContent =
            "We couldn't submit your boarding request.";


        submitButton.disabled =
            false;


        submitButton.textContent =
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


    calendarYear =
        new Date()
            .getFullYear();


    calendarMonth =
        new Date()
            .getMonth();


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

    renderAdditionalPets();

    updateBookingTotal();

}


// ========================================
// UPCOMING CALENDAR
// ========================================

const upcomingCalendarPrev =
    document.getElementById(
        "upcoming-calendar-prev"
    );


const upcomingCalendarNext =
    document.getElementById(
        "upcoming-calendar-next"
    );


if (upcomingCalendarPrev) {

    upcomingCalendarPrev.addEventListener(
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

}


if (upcomingCalendarNext) {

    upcomingCalendarNext.addEventListener(
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

}


// ========================================
// RENDER UPCOMING CALENDAR
// ========================================

function renderUpcomingCalendar() {


    const grid =
        document.getElementById(
            "upcoming-calendar-grid"
        );


    const monthLabel =
        document.getElementById(
            "upcoming-calendar-month-label"
        );


    if (
        !grid ||
        !monthLabel
    ) {
        return;
    }


    monthLabel.textContent =
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


    let leadingBlankDays =
        firstDay.getDay() - 1;


    if (
        leadingBlankDays < 0
    ) {

        leadingBlankDays =
            6;

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
            "upcoming-calendar-empty";


        grid.appendChild(
            blank
        );

    }


    const daysInMonth =
        new Date(
            upcomingCalendarYear,
            upcomingCalendarMonth + 1,
            0
        ).getDate();


    const today =
        getLocalDateString();


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateString =
            makeDateString(
                upcomingCalendarYear,
                upcomingCalendarMonth,
                day
            );


        const servicesForDate =
            currentVisits.filter(
                visit =>
                    visit.visit_date ===
                    dateString
            );


        const serviceCount =
            servicesForDate.length;


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "upcoming-calendar-day";


        if (
            serviceCount > 0
        ) {

            button.classList.add(
                "upcoming-calendar-booked"
            );

        }


        if (
            dateString ===
            today
        ) {

            button.classList.add(
                "upcoming-calendar-today"
            );

        }


        if (
            dateString ===
            selectedUpcomingDate
        ) {

            button.classList.add(
                "upcoming-calendar-selected"
            );

        }


        const number =
            document.createElement(
                "span"
            );


        number.className =
            "upcoming-day-number";


        number.textContent =
            day;


        button.appendChild(
            number
        );


        if (
            serviceCount > 0
        ) {

            const badge =
                document.createElement(
                    "span"
                );


            badge.className =
                "upcoming-service-count";


            badge.textContent =
                serviceCount;


            button.appendChild(
                badge
            );

        }


        button.addEventListener(
            "click",
            () => {

                selectedUpcomingDate =
                    dateString;


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
// VISIT PET NAMES
// ========================================

function getPetsForVisit(
    visit
) {


    let relationships =
        currentVisitPets
            .filter(
                item =>
                    Number(item.visit_id) ===
                    Number(visit.id)
            );


    relationships.sort(
        (a, b) => {

            if (
                a.is_primary ===
                b.is_primary
            ) {

                return 0;

            }


            return a.is_primary
                ? -1
                : 1;

        }
    );


    let pets =
        relationships
            .map(
                relationship =>
                    currentPets.find(
                        pet =>
                            Number(pet.id) ===
                            Number(
                                relationship.pet_id
                            )
                    )
            )
            .filter(Boolean);


    // Backwards compatibility
    if (
        pets.length === 0 &&
        visit.pet_id
    ) {

        const legacyPet =
            currentPets.find(
                pet =>
                    Number(pet.id) ===
                    Number(visit.pet_id)
            );


        if (legacyPet) {

            pets =
                [legacyPet];

        }

    }


    return pets;

}


// ========================================
// UPCOMING SERVICE DETAILS
// ========================================

function renderSelectedUpcomingServices() {


    const dateHeading =
        document.getElementById(
            "selected-upcoming-date"
        );


    const container =
        document.getElementById(
            "selected-upcoming-services"
        );


    if (
        !dateHeading ||
        !container
    ) {
        return;
    }


    if (!selectedUpcomingDate) {

        dateHeading.textContent =
            "Select a date";


        container.innerHTML =
            `
                <p class="empty-upcoming-message">
                    Select a date on the calendar to view services.
                </p>
            `;

        return;

    }


    dateHeading.textContent =
        formatLongDate(
            selectedUpcomingDate
        );


    const services =
        currentVisits.filter(
            visit =>
                visit.visit_date ===
                selectedUpcomingDate
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

                    const title =
                        visit.service_name ||
                        visit.service_type ||
                        "Service";


                    const time =
                        visit.time_window ||
                        "";


                    const price =
                        visit.price !== null
                            ? `$${Number(
                                visit.price
                            ).toFixed(2)}`
                            : "";


                    const pets =
                        getPetsForVisit(
                            visit
                        );


                    const petLabel =
                        pets.length === 1
                            ? "PET"
                            : "PETS";


                    const petChips =
                        pets.length > 0
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


                    return `
                        <div class="upcoming-service-card">

                            <div class="upcoming-service-card-header">

                                <strong>
                                    ${escapeHtml(title)}
                                </strong>

                                <span class="service-status">
                                    ${escapeHtml(
                                        formatStatus(
                                            visit.status
                                        )
                                    )}
                                </span>

                            </div>


                            <div class="upcoming-service-pets">

                                <span class="upcoming-service-pets-label">
                                    ${petLabel}
                                </span>

                                <div class="service-pet-chips">
                                    ${petChips}
                                </div>

                            </div>


                            ${
                                time
                                    ? `
                                        <div class="upcoming-service-row">
                                            <span>Time</span>
                                            <strong>
                                                ${escapeHtml(time)}
                                            </strong>
                                        </div>
                                    `
                                    : ""
                            }

                            ${
                                price
                                    ? `
                                        <div class="upcoming-service-row">
                                            <span>Price</span>
                                            <strong>${price}</strong>
                                        </div>
                                    `
                                    : ""
                            }

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

                        </div>
                    `;

                }
            )
            .join("");

}


// ========================================
// BOARDING DATES
// ========================================

function getBoardingNightDates(
    startDate,
    endDate
) {


    const dates =
        [];


    let current =
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
            current.getDate() + 1
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
// DATE HELPERS
// ========================================

function parseLocalDate(
    dateString
) {


    const parts =
        dateString.split("-");


    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

}


function makeDateString(
    year,
    monthIndex,
    day
) {


    return `${year}-${String(
        monthIndex + 1
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
    ).toLocaleDateString(
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
    ).toLocaleDateString(
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
    ).toLocaleDateString(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );

}


// ========================================
// TEXT HELPERS
// ========================================

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
            letter =>
                letter.toUpperCase()
        );

}


function escapeHtml(
    value
) {


    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

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
// PHOTO PREVIEW CLEANUP
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


// ========================================
// BOOKING MESSAGE
// ========================================

function clearBookingMessage() {


    const message =
        document.getElementById(
            "booking-message"
        );


    if (message) {

        message.textContent =
            "";

    }

}


// ========================================
// LOAD
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
