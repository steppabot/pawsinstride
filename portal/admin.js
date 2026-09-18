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

const VISIT_MEDIA_BUCKET =
    "visit-media";


const MAX_VISIT_MEDIA_SIZE =
    10 * 1024 * 1024;

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


let allHouseholds =
    [];


let allVisitReports =
    [];


let allVisitWalks =
    [];

// ========================================
// WALK GPS TRACKING STATE
// ========================================

let activeWalkGpsTracker =
    null;


let activeWalkUiTimer =
    null;


const WALK_GPS_MAX_ACCURACY_METERS =
    50;


const WALK_GPS_MIN_SEGMENT_METERS =
    3;


const WALK_GPS_MAX_SPEED_MPS =
    5.5;

let activeVisitReportVisitId =
    null;


let pendingVisitReportPhotos =
    [];


let pendingVisitRouteFiles =
    [];


let activeVisitReportMedia =
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
    
    let profile =
        null;
    
    
    // ========================================
    // OFFLINE ADMIN PROFILE
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
            "Offline admin device detected. Skipping remote profile lookup."
        );
    
    
        profile = {
            id:
                currentUser.id,
            role:
                "admin",
            full_name:
                "Admin",
            email:
                currentUser.email ||
                null,
            phone:
                null,
            profile_photo_path:
                null
        };
    
    }
    
    
    // ========================================
    // ONLINE ADMIN PROFILE
    // ========================================
    
    else {
    
        const {
    
            data: profileData,
    
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
    
    
        if (
            profileError
        ) {
    
            console.error(
                "Admin profile error:",
                profileError
            );
    
    
            loading.textContent =
                "We couldn't load your account profile.";
    
    
            return;
    
        }
    
    
        profile =
            profileData;
    
    
        // ========================================
        // ADMIN SECURITY CHECK
        // ========================================
    
        if (
            String(
                profile.role ||
                ""
            )
                .trim()
                .toLowerCase() !==
            "admin"
        ) {
    
            window.localStorage.removeItem(
                "paws-in-stride-admin-device"
            );
    
    
            window.location.href =
                "./dashboard.html";
    
    
            return;
    
        }
    
    
        // ========================================
        // REMEMBER VERIFIED ADMIN DEVICE
        // ========================================
    
        window.localStorage.setItem(
            "paws-in-stride-admin-device",
            "true"
        );
    
    
        await ensureAdminPushSubscription();
    
    }
    
    
    // ========================================
    // SET CURRENT PROFILE
    // ========================================
    
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
    
    const ADMIN_OFFLINE_DATA_KEY =
        "paws-in-stride-admin-offline-data";
    
    
    function loadAdminOfflineData() {
    
        try {
    
    
            const savedData =
                localStorage.getItem(
                    ADMIN_OFFLINE_DATA_KEY
                );
    
    
            if (
                !savedData
            ) {
    
                return null;
    
            }
    
    
            return JSON.parse(
                savedData
            );
    
    
        } catch (
            error
        ) {
    
    
            console.error(
                "Unable to load offline admin data:",
                error
            );
    
    
            return null;
    
        }
    
    }
    
    
    function saveAdminOfflineData() {
    
        try {
    
    
            localStorage.setItem(
    
                ADMIN_OFFLINE_DATA_KEY,
    
                JSON.stringify({
    
                    profiles:
                        allProfiles,
    
                    pets:
                        allPets,
    
                    visits:
                        allVisits,
    
                    households:
                        allHouseholds,
    
                    visitReports:
                        allVisitReports,
    
                    saved_at:
                        new Date()
                            .toISOString()
    
                })
    
            );
    
    
        } catch (
            error
        ) {
    
    
            console.error(
                "Unable to save offline admin data:",
                error
            );
    
        }
    
    }
    
    
    let businessDataLoadedFromServer =
        false;
    
    
    const [
    
        profilesResult,
        petsResult,
        visitsResult,
        householdsResult,
        visitReportsResult
    
    ] =
        await Promise.all([
    
    
            supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, email, phone, role, profile_photo_path, pricing_tier"
                ),
    
    
            supabaseClient
                .from("pets")
                .select(
                    "id, client_id, name, breed, gender, photo_path"
                ),
    
    
            supabaseClient
                .from("visits")
                .select("*")
                .order(
                    "visit_date",
                    {
                        ascending:
                            true
                    }
                ),
    
    
            supabaseClient
                .from("households")
                .select(
                    "client_id, street_address, address_line_2, city, state, zip_code"
                ),
    
    
            supabaseClient
                .from("visit_reports")
                .select(
                    "id, visit_id, created_by, notes, fed, fresh_water, pee, poop, created_at, updated_at"
                )
    
    
        ]);
    
    // ========================================
    // SERVER VISITS AVAILABLE
    // ========================================
    
    if (
        !visitsResult.error
    ) {
    
    
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
            householdsResult.error
        ) {
    
    
            console.error(
                "Admin households error:",
                householdsResult.error
            );
    
        }
    
    
        if (
            visitReportsResult.error
        ) {
    
    
            console.error(
                "Admin visit reports error:",
                visitReportsResult.error
            );
    
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
    
    
        allHouseholds =
            householdsResult.data ||
            [];
    
    
        allVisitReports =
            visitReportsResult.data ||
            [];
    
    
        businessDataLoadedFromServer =
            true;
    
    
        // ========================================
        // SAVE CURRENT SERVER DATA FOR OFFLINE USE
        // ========================================
    
        saveAdminOfflineData();
    
    
    } else {
    
    
        console.warn(
            "Admin business data could not be loaded from the server. Trying offline copy.",
            visitsResult.error
        );
    
    
        // ========================================
        // SERVER UNAVAILABLE
        // RESTORE LAST SAVED DEVICE COPY
        // ========================================
    
        const offlineData =
            loadAdminOfflineData();
    
    
        if (
            !offlineData ||
            !Array.isArray(
                offlineData.visits
            )
        ) {
    
    
            loading.textContent =
                "We couldn't load the service calendar.";
    
    
            return;
    
        }
    
    
        allProfiles =
            Array.isArray(
                offlineData.profiles
            )
                ? offlineData.profiles
                : [];
    
    
        allPets =
            Array.isArray(
                offlineData.pets
            )
                ? offlineData.pets
                : [];
    
    
        allVisits =
            offlineData.visits;
    
    
        allHouseholds =
            Array.isArray(
                offlineData.households
            )
                ? offlineData.households
                : [];
    
    
        allVisitReports =
            Array.isArray(
                offlineData.visitReports
            )
                ? offlineData.visitReports
                : [];
    
    
        console.log(
            "Admin dashboard restored from offline device data:",
            offlineData.saved_at ||
            "unknown save time"
        );
    
    }

    // ========================================
    // RESTORE PENDING LOCAL VISIT STATES
    // ========================================
    //
    // The cached business-data snapshot may still
    // contain an older server state such as
    // "scheduled". Re-apply any unsynced actions
    // saved on this device before rendering.
    // ========================================
    
    for (
        const visit of
        allVisits
    ) {
    
        // ========================================
        // PENDING CHECK IN
        // ========================================
    
        const pendingCheckIn =
            loadPendingVisitCheckIn(
                visit.id
            );
    
    
        if (
            pendingCheckIn
        ) {
    
            visit.status =
                "checked_in";
    
    
            visit.checked_in_at =
                pendingCheckIn
                    .checked_in_at;
    
    
            visit.completed_at =
                null;
    
        }
    
    
        // ========================================
        // PENDING VISIT FINISH
        // ========================================
    
        const pendingVisitFinish =
            loadPendingVisitFinish(
                visit.id
            );
    
    
        if (
            pendingVisitFinish
        ) {
    
            visit.status =
                "completed";
    
    
            visit.completed_at =
                pendingVisitFinish
                    .completed_at;
    
        }
    
    }

    // ========================================
    // LOAD WALK TRACKING SESSIONS
    // ========================================
    
    const {
    
        data: visitWalks,
    
        error: visitWalksError
    
    } =
        await supabaseClient
            .from(
                "visit_walks"
            )
            .select("*")
            .order(
                "started_at",
                {
                    ascending:
                        true
                }
            );
    
    
    // ========================================
    // START WITH SERVER WALKS WHEN AVAILABLE
    // ========================================
    
    if (
        visitWalksError
    ) {
    
    
        console.error(
            "Admin visit walks error:",
            visitWalksError
        );
    
    
        allVisitWalks =
            [];
    
    
    } else {
    
    
        allVisitWalks =
            visitWalks ||
            [];
    
    }
    
    
    // ========================================
    // RESTORE LOCAL WALKS FROM THIS DEVICE
    // ========================================
    
    for (
        const visit of
        allVisits
    ) {
    
    
        const localWalk =
            loadLocalVisitWalk(
                visit.id
            );
    
    
        if (
            !localWalk
        ) {
    
            continue;
    
        }
    
    
        const serverWalk =
            allVisitWalks.find(
    
                item =>
    
                    Number(
                        item.visit_id
                    ) ===
                    Number(
                        visit.id
                    )
    
            );
    
    
        // ========================================
        // SERVER ALREADY HAS COMPLETED WALK
        // LOCAL COPY IS STALE
        // ========================================
    
        if (
            serverWalk?.status ===
            "completed"
        ) {
    
    
            clearLocalVisitWalk(
                visit.id
            );
    
    
            continue;
    
        }
    
    
        // ========================================
        // PENDING LOCAL FINISH MUST WIN
        // UNTIL IT HAS BEEN SYNCED
        // ========================================
    
        const pendingLocalFinish =
            loadPendingWalkFinish(
                localWalk.id
            );
    
    
        if (
            pendingLocalFinish
        ) {
    
    
            replaceAdminVisitWalk(
                localWalk
            );
    
    
            continue;
    
        }
    
    
        // ========================================
        // RESTORE ACTIVE LOCAL WALK
        // ========================================
    
        if (
            localWalk.status ===
            "in_progress"
        ) {
    
    
            replaceAdminVisitWalk(
                localWalk
            );
    
        }
    
    }
    
    
    // ========================================
    // AUTO-SYNC SAVED CHECK-INS,
    // WALKS, AND VISITS ON PAGE LOAD
    // ========================================
    
    if (
        navigator.onLine
    ) {
    
    
        await syncAllPendingVisitCheckIns(
            false
        );
    
    
        await syncAllPendingWalkFinishes();
    
    
        await syncAllPendingVisitFinishes();
    
    }
    
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
            visit => {

                const status =
                    String(
                        visit.status ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                return (
                    String(
                        visit.visit_date
                    )
                        .startsWith(
                            monthPrefix
                        ) &&
                    status !==
                        "cancelled"
                );

            }
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


        // ========================================
        // VISITS FOR THIS DATE
        // ========================================

        const visitsForDate =
            allVisits.filter(
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
// VISIT CHECK-IN ACTIONS
// ========================================

const adminDayServicesContainer =
    document.getElementById(
        "admin-day-services"
    );


adminDayServicesContainer
    ?.addEventListener(
        "click",
        async event => {


            const actionButton =
                event.target.closest(
                    "[data-visit-action]"
                );


            if (
                !actionButton
            ) {

                return;

            }


            const visitId =
                Number(
                    actionButton.dataset
                        .visitId
                );


            const action =
                actionButton.dataset
                    .visitAction;


            if (
                !visitId ||
                !action
            ) {

                return;

            }


            actionButton.disabled =
                true;


            const originalText =
                actionButton.textContent;


            try {


                if (
                    action ===
                    "check-in"
                ) {


                    actionButton.textContent =
                        "Checking In...";


                    await checkInVisit(
                        visitId
                    );


                } else if (
                    action ===
                    "start-walk"
                ) {


                    actionButton.textContent =
                        "Starting Walk...";


                    await startVisitWalk(
                        visitId
                    );


                } else if (
                    action ===
                    "resume-walk-gps"
                ) {


                    actionButton.textContent =
                        "Starting GPS...";


                    const walk =
                        getVisitWalk(
                            visitId
                        );


                    if (
                        !walk
                    ) {

                        throw new Error(
                            "Walk session not found."
                        );

                    }


                    await startWalkGpsTracking(
                        walk
                    );


                    renderAdminDayServices();


                    startWalkUiTimer();


                } else if (
                    action ===
                    "sync-walk"
                ) {


                    actionButton.textContent =
                        "Syncing...";


                    await retryPendingWalkSync(
                        visitId
                    );


                } else if (
                    action ===
                    "finish-walk"
                ) {


                    actionButton.textContent =
                        "Saving Walk...";


                    await finishVisitWalk(
                        visitId
                    );


                } else if (
                    action ===
                    "finish"
                ) {


                    actionButton.textContent =
                        "Saving Visit...";


                    await finishVisit(
                        visitId
                    );


                } else if (
                    action ===
                    "sync-visit"
                ) {


                    actionButton.textContent =
                        "Syncing...";


                    await retryPendingVisitSync(
                        visitId
                    );


                } else if (
                    action ===
                    "reopen"
                ) {


                    actionButton.textContent =
                        "Reopening...";


                    await reopenVisit(
                        visitId
                    );

                }


            } catch (
                error
            ) {


                console.error(
                    "Visit status update error:",
                    error
                );


                alert(
                    error?.message ||
                    "We couldn't update this visit. Please try again."
                );


                actionButton.disabled =
                    false;


                actionButton.textContent =
                    originalText;

            }

        }
    );

// ========================================
// VISIT REPORT ACTIONS
// ========================================

adminDayServicesContainer
    ?.addEventListener(
        "click",
        async event => {


            const deleteMediaButton =
                event.target.closest(
                    "[data-delete-visit-report-media]"
                );


            if (
                deleteMediaButton
            ) {


                const mediaId =
                    Number(
                        deleteMediaButton.dataset
                            .deleteVisitReportMedia
                    );


                if (
                    !mediaId
                ) {

                    return;

                }


                await deleteAdminVisitReportMedia(
                    mediaId,
                    deleteMediaButton
                );


                return;

            }


            const openButton =
                event.target.closest(
                    "[data-visit-report-open]"
                );


            if (
                openButton
            ) {


                const visitId =
                    Number(
                        openButton.dataset
                            .visitReportOpen
                    );


                if (
                    !visitId
                ) {

                    return;

                }


                await openAdminVisitReport(
                    visitId
                );


                return;

            }


            const closeButton =
                event.target.closest(
                    "[data-visit-report-close]"
                );


            if (
                closeButton
            ) {


                closeAdminVisitReport();


                return;

            }

        }
    );


adminDayServicesContainer
    ?.addEventListener(
        "change",
        event => {


            const photosInput =
                event.target.closest(
                    "[data-visit-report-photos]"
                );


            if (
                photosInput
            ) {


                handleVisitReportPhotos(
                    photosInput
                );


                return;

            }

        }
    );


adminDayServicesContainer
    ?.addEventListener(
        "submit",
        async event => {


            const form =
                event.target.closest(
                    "[data-visit-report-form]"
                );


            if (
                !form
            ) {

                return;

            }


            event.preventDefault();


            await saveAdminVisitReport(
                form
            );

        }
    );

// ========================================
// CHECK IN VISIT
// ========================================

function getPendingVisitCheckInStorageKey(
    visitId
) {

    return `paws-in-stride-visit-check-in-${visitId}`;

}


function loadPendingVisitCheckIn(
    visitId
) {


    try {


        const stored =
            localStorage.getItem(
                getPendingVisitCheckInStorageKey(
                    visitId
                )
            );


        if (
            !stored
        ) {

            return null;

        }


        return JSON.parse(
            stored
        );


    } catch (
        error
    ) {


        console.warn(
            "Could not load pending visit check-in:",
            error
        );


        return null;

    }

}


function savePendingVisitCheckIn(
    visitId,
    checkInData
) {


    try {


        localStorage.setItem(
            getPendingVisitCheckInStorageKey(
                visitId
            ),
            JSON.stringify(
                checkInData
            )
        );


    } catch (
        error
    ) {


        console.warn(
            "Could not save pending visit check-in:",
            error
        );

    }

}


function clearPendingVisitCheckIn(
    visitId
) {


    try {


        localStorage.removeItem(
            getPendingVisitCheckInStorageKey(
                visitId
            )
        );


    } catch (
        error
    ) {


        console.warn(
            "Could not clear pending visit check-in:",
            error
        );

    }

}


async function syncPendingVisitCheckIn(
    visitId,
    shouldRender = true
) {


    const pendingCheckIn =
        loadPendingVisitCheckIn(
            visitId
        );


    if (
        !pendingCheckIn
    ) {

        return false;

    }


    try {


        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "visits"
                )
                .update({

                    status:
                        "checked_in",

                    checked_in_at:
                        pendingCheckIn
                            .checked_in_at,

                    completed_at:
                        null

                })
                .eq(
                    "id",
                    visitId
                )
                .select("*")
                .single();


        if (
            error
        ) {

            throw error;

        }


        replaceAdminVisit(
            data
        );


        clearPendingVisitCheckIn(
            visitId
        );


        if (
            shouldRender
        ) {


            renderAdminCalendar();


            renderAdminDayServices();

        }


        return true;


    } catch (
        error
    ) {


        if (
            isWalkNetworkError(
                error
            )
        ) {


            console.log(
                "Visit check-in saved locally and is waiting to sync."
            );


            if (
                shouldRender
            ) {

                renderAdminDayServices();

            }


            return false;

        }


        throw error;

    }

}


async function syncAllPendingVisitCheckIns(
    shouldRender = true
) {


    if (
        !navigator.onLine
    ) {

        return;

    }


    let changed =
        false;


    for (
        const visit
        of
        allVisits
    ) {


        const pendingCheckIn =
            loadPendingVisitCheckIn(
                visit.id
            );


        if (
            !pendingCheckIn
        ) {

            continue;

        }


        const synced =
            await syncPendingVisitCheckIn(
                visit.id,
                false
            );


        if (
            synced
        ) {

            changed =
                true;

        }

    }


    if (
        changed &&
        shouldRender
    ) {


        renderAdminCalendar();


        renderAdminDayServices();

    }

}


async function retryPendingVisitCheckInSync(
    visitId
) {


    const pendingCheckIn =
        loadPendingVisitCheckIn(
            visitId
        );


    if (
        !pendingCheckIn
    ) {


        renderAdminDayServices();


        return;

    }


    await syncPendingVisitCheckIn(
        visitId
    );

}


async function checkInVisit(
    visitId
) {


    const visit =
        allVisits.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    visitId
                )
        );


    if (
        !visit
    ) {

        throw new Error(
            "Visit not found."
        );

    }


    const existingPendingCheckIn =
        loadPendingVisitCheckIn(
            visitId
        );


    if (
        existingPendingCheckIn
    ) {


        await retryPendingVisitCheckInSync(
            visitId
        );


        return;

    }


    const checkedInAt =
        new Date()
            .toISOString();


    const pendingCheckIn = {

        checked_in_at:
            checkedInAt,

        saved_at:
            new Date()
                .toISOString()

    };


    savePendingVisitCheckIn(
        visitId,
        pendingCheckIn
    );


    replaceAdminVisit({

        ...visit,

        status:
            "checked_in",

        checked_in_at:
            checkedInAt,

        completed_at:
            null

    });


    renderAdminCalendar();


    renderAdminDayServices();


    await syncPendingVisitCheckIn(
        visitId
    );

}

// ========================================
// WALK GPS DISTANCE
// ========================================

function getGpsDistanceMeters(
    firstPoint,
    secondPoint
) {


    const earthRadius =
        6371000;


    const toRadians =
        degrees =>
            degrees *
            (
                Math.PI /
                180
            );


    const latitude1 =
        toRadians(
            firstPoint.latitude
        );


    const latitude2 =
        toRadians(
            secondPoint.latitude
        );


    const deltaLatitude =
        toRadians(
            secondPoint.latitude -
            firstPoint.latitude
        );


    const deltaLongitude =
        toRadians(
            secondPoint.longitude -
            firstPoint.longitude
        );


    const a =
        Math.sin(
            deltaLatitude /
            2
        ) ** 2 +
        Math.cos(
            latitude1
        ) *
        Math.cos(
            latitude2
        ) *
        Math.sin(
            deltaLongitude /
            2
        ) ** 2;


    return (
        earthRadius *
        2 *
        Math.atan2(
            Math.sqrt(
                a
            ),
            Math.sqrt(
                1 -
                a
            )
        )
    );

}


// ========================================
// WALK GPS QUEUE STORAGE KEY
// ========================================

function getWalkGpsQueueStorageKey(
    walkId
) {


    return (
        `paws-in-stride-walk-gps-${walkId}`
    );

}


// ========================================
// LOAD WALK GPS QUEUE
// ========================================

function loadPendingWalkGpsQueue(
    walkId
) {


    try {


        const value =
            localStorage.getItem(
                getWalkGpsQueueStorageKey(
                    walkId
                )
            );


        if (
            !value
        ) {

            return [];

        }


        const parsed =
            JSON.parse(
                value
            );


        return Array.isArray(
            parsed
        )

            ? parsed

            : [];


    } catch (
        error
    ) {


        console.warn(
            "Unable to load pending GPS queue:",
            error
        );


        return [];

    }

}


// ========================================
// SAVE WALK GPS QUEUE
// ========================================

function savePendingWalkGpsQueue(
    walkId,
    queue
) {


    try {


        const key =
            getWalkGpsQueueStorageKey(
                walkId
            );


        if (
            queue.length ===
            0
        ) {


            localStorage.removeItem(
                key
            );


            return;

        }


        localStorage.setItem(

            key,

            JSON.stringify(
                queue
            )

        );


    } catch (
        error
    ) {


        console.warn(
            "Unable to save pending GPS queue:",
            error
        );

    }

}


// ========================================
// UPDATE WALK IN LOCAL STATE
// ========================================

function replaceAdminVisitWalk(
    updatedWalk
) {


    const existingIndex =
        allVisitWalks.findIndex(

            walk =>

                Number(
                    walk.id
                ) ===
                Number(
                    updatedWalk.id
                )

        );


    if (
        existingIndex ===
        -1
    ) {


        allVisitWalks.push(
            updatedWalk
        );


    } else {


        allVisitWalks[
            existingIndex
        ] =
            updatedWalk;

    }

}


// ========================================
// UPDATE LOCAL WALK TOTALS
// ========================================

function updateLocalWalkTotals(
    walkId,
    distanceMeters,
    pointCount
) {


    const walk =
        allVisitWalks.find(

            item =>

                Number(
                    item.id
                ) ===
                Number(
                    walkId
                )

        );


    if (
        !walk
    ) {

        return;

    }


    walk.distance_meters =
        distanceMeters;


    walk.point_count =
        pointCount;


    // ========================================
    // PERSIST LOCAL WALK PROGRESS
    // ========================================
    //
    // Local-only walks must keep their latest
    // distance and GPS point totals on disk so
    // a PWA kill/reload can restore the walk
    // exactly where it left off.
    // ========================================

    if (
        walk.local_only ===
        true
    ) {

        saveLocalVisitWalk(
            walk
        );

    }

}

// ========================================
// IS WALK GPS ACTIVE
// ========================================

function isWalkGpsTracking(
    walkId
) {


    return Boolean(

        activeWalkGpsTracker &&

        Number(
            activeWalkGpsTracker.walkId
        ) ===
        Number(
            walkId
        ) &&

        activeWalkGpsTracker.watchId !==
        null

    );

}


// ========================================
// UPDATE WALK LIVE UI
// ========================================

function updateWalkLiveUi() {


    const tracker =
        activeWalkGpsTracker;


    if (
        !tracker
    ) {

        return;

    }


    const durationElement =
        document.getElementById(
            `admin-walk-duration-${tracker.visitId}`
        );


    const distanceElement =
        document.getElementById(
            `admin-walk-distance-${tracker.visitId}`
        );


    const pointsElement =
        document.getElementById(
            `admin-walk-points-${tracker.visitId}`
        );


    const elapsedSeconds =
        Math.max(

            0,

            Math.floor(

                (
                    Date.now() -
                    tracker.startedAt
                ) /
                1000

            )

        );


    if (
        durationElement
    ) {


        durationElement.textContent =
            formatWalkDuration(
                elapsedSeconds
            );

    }


    if (
        distanceElement
    ) {


        distanceElement.textContent =
            `${
                (
                    tracker.distanceMeters /
                    1609.344
                ).toFixed(
                    2
                )
            } mi`;

    }


    if (
        pointsElement
    ) {


        pointsElement.textContent =
            `${tracker.pointCount} GPS ${
                tracker.pointCount ===
                1

                    ? "point"

                    : "points"
            }`;

    }

}


// ========================================
// WALK UI TIMER
// ========================================

function startWalkUiTimer() {


    if (
        activeWalkUiTimer
    ) {


        clearInterval(
            activeWalkUiTimer
        );

    }


    updateWalkLiveUi();


    activeWalkUiTimer =
        setInterval(

            updateWalkLiveUi,

            1000

        );

}


// ========================================
// STOP WALK UI TIMER
// ========================================

function stopWalkUiTimer() {


    if (
        !activeWalkUiTimer
    ) {

        return;

    }


    clearInterval(
        activeWalkUiTimer
    );


    activeWalkUiTimer =
        null;

}


// ========================================
// PERSIST WALK GPS POINT
// ========================================

async function persistWalkGpsPoint(
    tracker,
    queuedPoint
) {


    const {

        distance_meters_total,
        point_count_total,
        ...pointPayload

    } =
        queuedPoint;


    const {

        error: pointError

    } =
        await supabaseClient
            .from(
                "visit_walk_points"
            )
            .insert(
                pointPayload
            );


    if (
        pointError &&
        pointError.code !==
        "23505"
    ) {

        throw pointError;

    }


    const {

        data: updatedWalk,

        error: walkUpdateError

    } =
        await supabaseClient
            .from(
                "visit_walks"
            )
            .update({

                distance_meters:
                    distance_meters_total,

                point_count:
                    point_count_total,

                updated_at:
                    new Date()
                        .toISOString()

            })
            .eq(
                "id",
                tracker.walkId
            )
            .select("*")
            .single();


    if (
        walkUpdateError
    ) {

        throw walkUpdateError;

    }


    replaceAdminVisitWalk(
        updatedWalk
    );

}


// ========================================
// FLUSH WALK GPS QUEUE
// ========================================

async function flushWalkGpsQueue(
    tracker
) {


    if (
        tracker.flushPromise
    ) {

        return tracker.flushPromise;

    }


    tracker.flushPromise =
        (

            async () => {


                while (
                    tracker.pendingQueue.length >
                    0
                ) {


                    const queuedPoint =
                        tracker.pendingQueue[0];


                    try {


                        await persistWalkGpsPoint(
                            tracker,
                            queuedPoint
                        );


                        tracker.pendingQueue.shift();


                        savePendingWalkGpsQueue(
                            tracker.walkId,
                            tracker.pendingQueue
                        );


                        tracker.lastSyncError =
                            null;


                    } catch (
                        error
                    ) {


                        tracker.lastSyncError =
                            error;


                        console.warn(
                            "GPS point waiting to sync:",
                            error
                        );


                        break;

                    }

                }

            }

        )();


    try {


        await tracker.flushPromise;


    } finally {


        tracker.flushPromise =
            null;

    }

}


// ========================================
// HANDLE GPS POSITION
// ========================================

function handleWalkGpsPosition(
    position,
    tracker
) {


    if (
        activeWalkGpsTracker !==
        tracker
    ) {

        return;

    }


    const accuracy =
        Number(
            position.coords
                .accuracy
        );


    if (
        !Number.isFinite(
            accuracy
        ) ||
        accuracy >
        WALK_GPS_MAX_ACCURACY_METERS
    ) {


        console.log(
            "GPS point ignored for low accuracy:",
            accuracy
        );


        return;

    }


    const point = {

        latitude:
            Number(
                position.coords
                    .latitude
            ),

        longitude:
            Number(
                position.coords
                    .longitude
            ),

        accuracy:
            accuracy,

        altitude:
            Number.isFinite(
                position.coords
                    .altitude
            )

                ? Number(
                    position.coords
                        .altitude
                )

                : null,

        speed:
            Number.isFinite(
                position.coords
                    .speed
            )

                ? Number(
                    position.coords
                        .speed
                )

                : null,

        heading:
            Number.isFinite(
                position.coords
                    .heading
            )

                ? Number(
                    position.coords
                        .heading
                )

                : null,

        timestamp:
            Number(
                position.timestamp ||
                Date.now()
            )

    };


    let segmentMeters =
        0;


    if (
        tracker.lastAcceptedPoint
    ) {


        segmentMeters =
            getGpsDistanceMeters(
                tracker.lastAcceptedPoint,
                point
            );


        const elapsedSeconds =
            Math.max(

                0.001,

                (
                    point.timestamp -
                    tracker.lastAcceptedPoint
                        .timestamp
                ) /
                1000

            );


        const calculatedSpeed =
            segmentMeters /
            elapsedSeconds;


        const dynamicMinimumDistance =
            Math.max(

                WALK_GPS_MIN_SEGMENT_METERS,

                Math.min(

                    8,

                    Math.max(
                        accuracy,
                        tracker.lastAcceptedPoint
                            .accuracy ||
                        0
                    ) *
                    0.35

                )

            );


        if (
            segmentMeters <
            dynamicMinimumDistance
        ) {

            return;

        }


        if (
            calculatedSpeed >
            WALK_GPS_MAX_SPEED_MPS
        ) {


            console.log(
                "GPS point ignored for unrealistic walking speed:",
                calculatedSpeed
            );


            return;

        }

    }


    const nextDistance =
        tracker.distanceMeters +
        segmentMeters;


    const nextPointCount =
        tracker.pointCount +
        1;


    const sequenceNumber =
        tracker.nextSequence;


    tracker.nextSequence++;


    tracker.distanceMeters =
        nextDistance;


    tracker.pointCount =
        nextPointCount;


    tracker.lastAcceptedPoint =
        point;


    const queuedPoint = {

        walk_id:
            tracker.walkId,

        sequence_number:
            sequenceNumber,

        recorded_at:
            new Date(
                point.timestamp
            )
                .toISOString(),

        latitude:
            point.latitude,

        longitude:
            point.longitude,

        accuracy_meters:
            point.accuracy,

        altitude_meters:
            point.altitude,

        speed_mps:
            point.speed,

        heading_degrees:
            point.heading,

        distance_meters_total:
            Number(
                nextDistance.toFixed(
                    2
                )
            ),

        point_count_total:
            nextPointCount

    };


    tracker.pendingQueue.push(
        queuedPoint
    );


    savePendingWalkGpsQueue(
        tracker.walkId,
        tracker.pendingQueue
    );


    updateLocalWalkTotals(
        tracker.walkId,
        nextDistance,
        nextPointCount
    );


    updateWalkLiveUi();


    // ========================================
    // ONLY UPLOAD SERVER-BACKED WALKS
    // ========================================

    if (
        !tracker.localOnly
    ) {

        flushWalkGpsQueue(
            tracker
        );

    }

}


// ========================================
// WALK GPS ERROR
// ========================================

function handleWalkGpsError(
    error,
    tracker
) {


    console.warn(
        "Walk GPS error:",
        error
    );


    if (
        error?.code ===
        1 &&
        !tracker.permissionErrorShown
    ) {


        tracker.permissionErrorShown =
            true;


        alert(
            "Location permission is required to track this walk. Please allow precise location access for Paws in Stride."
        );

    }

}


// ========================================
// START WALK GPS TRACKING
// ========================================

async function startWalkGpsTracking(
    walk
) {


    if (
        !navigator.geolocation
    ) {

        throw new Error(
            "This device does not support GPS location tracking."
        );

    }


    if (
        activeWalkGpsTracker &&
        Number(
            activeWalkGpsTracker.walkId
        ) !==
        Number(
            walk.id
        )
    ) {

        throw new Error(
            "Another walk is already being tracked on this device."
        );

    }


    if (
        isWalkGpsTracking(
            walk.id
        )
    ) {

        return;

    }


    // ========================================
    // LOCAL / OFFLINE WALK
    // ========================================

    const isLocalWalk =
        walk.local_only ===
        true;


    let latestSavedPoint =
        null;


    // ========================================
    // LOAD LAST SAVED SERVER POINT
    // ONLY FOR SERVER-BACKED WALKS
    // ========================================

    if (
        !isLocalWalk
    ) {


        const {
            data: latestPoints,
            error: latestPointError
        } =
            await supabaseClient
                .from(
                    "visit_walk_points"
                )
                .select(
                    "sequence_number, recorded_at, latitude, longitude, accuracy_meters"
                )
                .eq(
                    "walk_id",
                    walk.id
                )
                .order(
                    "sequence_number",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    1
                );


        if (
            latestPointError
        ) {

            throw latestPointError;

        }


        latestSavedPoint =
            latestPoints?.[0] ||
            null;

    }


    const pendingQueue =
        loadPendingWalkGpsQueue(
            walk.id
        );


    const latestPendingPoint =
        pendingQueue.length >
        0

            ? pendingQueue[
                pendingQueue.length -
                1
            ]

            : null;


    const lastAcceptedPoint =
        latestPendingPoint

            ? {

                latitude:
                    Number(
                        latestPendingPoint
                            .latitude
                    ),

                longitude:
                    Number(
                        latestPendingPoint
                            .longitude
                    ),

                accuracy:
                    Number(
                        latestPendingPoint
                            .accuracy_meters ||
                        0
                    ),

                timestamp:
                    new Date(
                        latestPendingPoint
                            .recorded_at
                    )
                        .getTime()

            }

            : latestSavedPoint

                ? {

                    latitude:
                        Number(
                            latestSavedPoint
                                .latitude
                        ),

                    longitude:
                        Number(
                            latestSavedPoint
                                .longitude
                        ),

                    accuracy:
                        Number(
                            latestSavedPoint
                                .accuracy_meters ||
                            0
                        ),

                    timestamp:
                        new Date(
                            latestSavedPoint
                                .recorded_at
                        )
                            .getTime()

                }

                : null;


    const highestSequence =
        Math.max(

            Number(
                latestSavedPoint
                    ?.sequence_number ??
                -1
            ),

            Number(
                latestPendingPoint
                    ?.sequence_number ??
                -1
            )

        );


    const pendingDistance =
        latestPendingPoint
            ?.distance_meters_total;


    const pendingPointCount =
        latestPendingPoint
            ?.point_count_total;


    const tracker = {

        walkId:
            Number(
                walk.id
            ),

        visitId:
            Number(
                walk.visit_id
            ),

        startedAt:
            new Date(
                walk.started_at
            )
                .getTime(),

        watchId:
            null,

        nextSequence:
            highestSequence +
            1,

        distanceMeters:
            Number(
                pendingDistance ??
                walk.distance_meters ??
                0
            ),

        pointCount:
            Number(
                pendingPointCount ??
                walk.point_count ??
                0
            ),

        lastAcceptedPoint:
            lastAcceptedPoint,

        pendingQueue:
            pendingQueue,

        flushPromise:
            null,

        lastSyncError:
            null,

        permissionErrorShown:
            false,

        localOnly:
            isLocalWalk

    };


    activeWalkGpsTracker =
        tracker;


    tracker.watchId =
        navigator.geolocation
            .watchPosition(

                position => {

                    handleWalkGpsPosition(
                        position,
                        tracker
                    );

                },

                error => {

                    handleWalkGpsError(
                        error,
                        tracker
                    );

                },

                {

                    enableHighAccuracy:
                        true,

                    maximumAge:
                        0,

                    timeout:
                        15000

                }

            );


    updateWalkLiveUi();


    if (
        !isLocalWalk
    ) {

        flushWalkGpsQueue(
            tracker
        );

    }

}

// ========================================
// STOP WALK GPS TRACKING
// ========================================

function stopWalkGpsTracking(
    walkId
) {


    const tracker =
        activeWalkGpsTracker;


    if (
        !tracker ||
        Number(
            tracker.walkId
        ) !==
        Number(
            walkId
        )
    ) {

        return null;

    }


    if (
        tracker.watchId !==
        null
    ) {


        navigator.geolocation
            .clearWatch(
                tracker.watchId
            );

    }


    tracker.watchId =
        null;


    stopWalkUiTimer();


    activeWalkGpsTracker =
        null;


    return tracker;

}


// ========================================
// PENDING WALK FINISH STORAGE KEY
// ========================================

function getPendingWalkFinishStorageKey(
    walkId
) {


    return (
        `paws-in-stride-walk-finish-${walkId}`
    );

}


// ========================================
// LOAD PENDING WALK FINISH
// ========================================

function loadPendingWalkFinish(
    walkId
) {


    try {


        const value =
            localStorage.getItem(
                getPendingWalkFinishStorageKey(
                    walkId
                )
            );


        if (
            !value
        ) {

            return null;

        }


        return JSON.parse(
            value
        );


    } catch (
        error
    ) {


        console.warn(
            "Unable to load pending walk finish:",
            error
        );


        return null;

    }

}


// ========================================
// SAVE PENDING WALK FINISH
// ========================================

function savePendingWalkFinish(
    walkId,
    finishData
) {


    try {


        localStorage.setItem(

            getPendingWalkFinishStorageKey(
                walkId
            ),

            JSON.stringify(
                finishData
            )

        );


    } catch (
        error
    ) {


        console.error(
            "Unable to save pending walk finish:",
            error
        );


        throw new Error(
            "We couldn't safely save this walk on the device."
        );

    }

}


// ========================================
// CLEAR PENDING WALK FINISH
// ========================================

function clearPendingWalkFinish(
    walkId
) {


    try {


        localStorage.removeItem(
            getPendingWalkFinishStorageKey(
                walkId
            )
        );


    } catch (
        error
    ) {


        console.warn(
            "Unable to clear pending walk finish:",
            error
        );

    }

}


// ========================================
// NETWORK-LIKE WALK ERROR
// ========================================

function isWalkNetworkError(
    error
) {


    const message =
        String(
            error?.message ||
            error ||
            ""
        )
            .toLowerCase();


    return (

        error instanceof TypeError ||

        message.includes(
            "failed to fetch"
        ) ||

        message.includes(
            "load failed"
        ) ||

        message.includes(
            "network"
        )

    );

}


// ========================================
// CONVERT LOCAL WALK TO SERVER WALK
// ========================================

async function convertLocalWalkToServerWalk(
    localWalk
) {


    if (
        !localWalk ||
        localWalk.local_only !==
        true
    ) {

        return localWalk;

    }


    const localWalkId =
        localWalk.id;


    // ========================================
    // CREATE REAL SERVER WALK
    // ========================================

    let serverWalk =
        null;


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "visit_walks"
            )
            .insert({

                visit_id:
                    localWalk.visit_id,

                tracking_session_id:
                    localWalk.tracking_session_id,

                status:
                    "in_progress",

                started_at:
                    localWalk.started_at,

                distance_meters:
                    Number(
                        localWalk.distance_meters ||
                        0
                    ),

                point_count:
                    Number(
                        localWalk.point_count ||
                        0
                    )

            })
            .select("*")
            .single();


    if (
        error
    ) {


        // ========================================
        // WALK MAY ALREADY EXIST FROM AN
        // EARLIER SYNC ATTEMPT
        // ========================================

        if (
            error.code ===
            "23505"
        ) {


            const {
                data: existingWalk,
                error: existingWalkError
            } =
                await supabaseClient
                    .from(
                        "visit_walks"
                    )
                    .select("*")
                    .eq(
                        "visit_id",
                        localWalk.visit_id
                    )
                    .single();


            if (
                existingWalkError
            ) {

                throw existingWalkError;

            }


            serverWalk =
                existingWalk;


        } else {


            throw error;

        }


    } else {


        serverWalk =
            data;

    }


    if (
        !serverWalk
    ) {

        throw new Error(
            "The offline walk could not be created on the server."
        );

    }


    // ========================================
    // MOVE LOCAL GPS QUEUE TO SERVER WALK ID
    // ========================================

    const localQueue =
        loadPendingWalkGpsQueue(
            localWalkId
        );


    const serverQueue =
        localQueue.map(
            point => ({

                ...point,

                walk_id:
                    serverWalk.id

            })
        );


    savePendingWalkGpsQueue(
        serverWalk.id,
        serverQueue
    );


    savePendingWalkGpsQueue(
        localWalkId,
        []
    );


    // ========================================
    // MOVE PENDING FINISH TO SERVER WALK ID
    // ========================================

    const pendingFinish =
        loadPendingWalkFinish(
            localWalkId
        );


    if (
        pendingFinish
    ) {


        savePendingWalkFinish(
            serverWalk.id,
            pendingFinish
        );


        clearPendingWalkFinish(
            localWalkId
        );

    }


    // ========================================
    // REPLACE TEMPORARY WALK IN LOCAL STATE
    // ========================================

    const localWalkIndex =
        allVisitWalks.findIndex(

            walk =>

                Number(
                    walk.id
                ) ===
                Number(
                    localWalkId
                )

        );


    if (
        localWalkIndex !==
        -1
    ) {


        allVisitWalks[
            localWalkIndex
        ] =
            serverWalk;


    } else {


        replaceAdminVisitWalk(
            serverWalk
        );

    }


    // ========================================
    // SERVER NOW OWNS THIS WALK
    // REMOVE THE TEMPORARY DEVICE COPY
    // ========================================

    clearLocalVisitWalk(
        localWalk.visit_id
    );


    console.log(
        "Offline walk converted to server walk:",
        localWalkId,
        "→",
        serverWalk.id
    );


    return serverWalk;

}


// ========================================
// SYNC PENDING WALK FINISH
// ========================================

async function syncPendingWalkFinish(
    walkId,
    shouldRender = true
) {


    let walk =
        allVisitWalks.find(

            item =>

                Number(
                    item.id
                ) ===
                Number(
                    walkId
                )

        );


    if (
        !walk
    ) {

        return false;

    }


    let pendingFinish =
        loadPendingWalkFinish(
            walk.id
        );


    if (
        !pendingFinish
    ) {

        return true;

    }


    try {


        // ========================================
        // CONVERT OFFLINE WALK TO REAL SERVER WALK
        // ========================================

        if (
            walk.local_only ===
            true
        ) {


            walk =
                await convertLocalWalkToServerWalk(
                    walk
                );


            walkId =
                walk.id;


            pendingFinish =
                loadPendingWalkFinish(
                    walk.id
                );


            if (
                !pendingFinish
            ) {

                throw new Error(
                    "The saved walk finish could not be recovered after syncing."
                );

            }

        }


        // ========================================
        // LOAD WAITING GPS POINTS
        // ========================================

        const pendingQueue =
            loadPendingWalkGpsQueue(
                walk.id
            );


        const tracker = {

            walkId:
                Number(
                    walk.id
                ),

            visitId:
                Number(
                    walk.visit_id
                ),

            pendingQueue:
                pendingQueue,

            flushPromise:
                null,

            distanceMeters:
                Number(
                    pendingFinish
                        .distance_meters ||
                    walk.distance_meters ||
                    0
                ),

            pointCount:
                Number(
                    pendingFinish
                        .point_count ||
                    walk.point_count ||
                    0
                ),

            lastSyncError:
                null,

            localOnly:
                false

        };


        // ========================================
        // FIRST SYNC ANY WAITING GPS POINTS
        // ========================================

        await flushWalkGpsQueue(
            tracker
        );


        if (
            tracker.pendingQueue.length >
            0
        ) {


            console.warn(
                "Walk finish is waiting for GPS points to sync."
            );


            if (
                shouldRender
            ) {

                renderAdminDayServices();

            }


            return false;

        }


        // ========================================
        // THEN FINALIZE THE WALK
        // ========================================

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "visit_walks"
                )
                .update({

                    status:
                        "completed",

                    ended_at:
                        pendingFinish
                            .ended_at,

                    duration_seconds:
                        pendingFinish
                            .duration_seconds,

                    distance_meters:
                        pendingFinish
                            .distance_meters,

                    point_count:
                        pendingFinish
                            .point_count,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    walk.id
                )
                .eq(
                    "status",
                    "in_progress"
                )
                .select("*")
                .maybeSingle();


        if (
            error
        ) {

            throw error;

        }


        // ========================================
        // HANDLE RETRY AFTER SERVER
        // ALREADY FINISHED
        // ========================================

        let completedWalk =
            data;


        if (
            !completedWalk
        ) {


            const {
                data: existingWalk,
                error: existingWalkError
            } =
                await supabaseClient
                    .from(
                        "visit_walks"
                    )
                    .select("*")
                    .eq(
                        "id",
                        walk.id
                    )
                    .single();


            if (
                existingWalkError
            ) {

                throw existingWalkError;

            }


            if (
                existingWalk.status !==
                "completed"
            ) {

                throw new Error(
                    "The walk could not be finalized."
                );

            }


            completedWalk =
                existingWalk;

        }


        replaceAdminVisitWalk(
            completedWalk
        );


        clearPendingWalkFinish(
            walk.id
        );


        savePendingWalkGpsQueue(
            walk.id,
            []
        );


        if (
            shouldRender
        ) {

            renderAdminDayServices();

        }


        console.log(
            "Pending walk synced successfully:",
            walk.id
        );


        return true;


    } catch (
        error
    ) {


        if (
            isWalkNetworkError(
                error
            )
        ) {


            console.warn(
                "Walk saved locally and waiting for connection:",
                error
            );


            if (
                shouldRender
            ) {

                renderAdminDayServices();

            }


            return false;

        }


        throw error;

    }

}


// ========================================
// SYNC ALL PENDING WALK FINISHES
// ========================================

async function syncAllPendingWalkFinishes() {


    if (
        !navigator.onLine
    ) {

        return;

    }


    let changed =
        false;


    for (
        const walk of
        allVisitWalks
    ) {


        const pendingFinish =
            loadPendingWalkFinish(
                walk.id
            );


        if (
            !pendingFinish
        ) {

            continue;

        }


        try {


            const synced =
                await syncPendingWalkFinish(
                    walk.id,
                    false
                );


            if (
                synced
            ) {

                changed =
                    true;

            }


        } catch (
            error
        ) {


            console.error(
                "Unable to auto-sync pending walk:",
                error
            );

        }

    }


    if (
        changed
    ) {

        renderAdminDayServices();

    }

}


// ========================================
// RETRY PENDING WALK SYNC
// ========================================

async function retryPendingWalkSync(
    visitId
) {


    const walk =
        getVisitWalk(
            visitId
        );


    if (
        !walk
    ) {

        throw new Error(
            "Walk session not found."
        );

    }


    const pendingFinish =
        loadPendingWalkFinish(
            walk.id
        );


    if (
        !pendingFinish
    ) {


        renderAdminDayServices();


        return;

    }


    await syncPendingWalkFinish(
        walk.id
    );

}


// ========================================
// AUTO-SYNC WHEN CONNECTION RETURNS
// ========================================

window.addEventListener(
    "online",
    async () => {


        console.log(
            "Connection restored. Checking pending check-ins, walks, and visits."
        );


        // ========================================
        // SYNC PENDING VISIT CHECK-INS
        // ========================================

        await syncAllPendingVisitCheckIns();


        // ========================================
        // SYNC PENDING WALK FINISHES
        // ========================================

        await syncAllPendingWalkFinishes();


        // ========================================
        // SYNC PENDING VISIT FINISHES
        // ========================================

        await syncAllPendingVisitFinishes();

    }
);

// ========================================
// START VISIT WALK
// ========================================

function getLocalVisitWalkStorageKey(
    visitId
) {

    return `paws-in-stride-local-walk-${visitId}`;

}


function loadLocalVisitWalk(
    visitId
) {

    try {


        const savedWalk =
            localStorage.getItem(
                getLocalVisitWalkStorageKey(
                    visitId
                )
            );


        if (
            !savedWalk
        ) {

            return null;

        }


        const parsedWalk =
            JSON.parse(
                savedWalk
            );


        if (
            !parsedWalk ||
            parsedWalk.local_only !==
            true
        ) {

            return null;

        }


        return parsedWalk;


    } catch (
        error
    ) {


        console.error(
            "Unable to load local walk:",
            error
        );


        return null;

    }

}


function saveLocalVisitWalk(
    walk
) {

    if (
        !walk ||
        walk.local_only !==
        true
    ) {

        return;

    }


    try {


        localStorage.setItem(

            getLocalVisitWalkStorageKey(
                walk.visit_id
            ),

            JSON.stringify(
                walk
            )

        );


    } catch (
        error
    ) {


        console.error(
            "Unable to save local walk:",
            error
        );

    }

}


function clearLocalVisitWalk(
    visitId
) {

    try {


        localStorage.removeItem(
            getLocalVisitWalkStorageKey(
                visitId
            )
        );


    } catch (
        error
    ) {


        console.error(
            "Unable to clear local walk:",
            error
        );

    }

}


function createWalkTrackingSessionId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
        "function"
    ) {

        return window.crypto.randomUUID();

    }


    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
        .replace(

            /[xy]/g,

            character => {


                const randomValue =
                    Math.floor(
                        Math.random() *
                        16
                    );


                const value =
                    character ===
                    "x"

                        ? randomValue

                        : (
                            randomValue &
                            0x3 |
                            0x8
                        );


                return value.toString(
                    16
                );

            }

        );

}


function createLocalVisitWalk(
    visitId
) {


    const startedAt =
        new Date()
            .toISOString();


    const temporaryWalkId =
        -Math.abs(
            Date.now()
        );


    const trackingSessionId =
        createWalkTrackingSessionId();


    const walk = {

        id:
            temporaryWalkId,

        visit_id:
            Number(
                visitId
            ),

        tracking_session_id:
            trackingSessionId,

        status:
            "in_progress",

        started_at:
            startedAt,

        ended_at:
            null,

        duration_seconds:
            0,

        distance_meters:
            0,

        point_count:
            0,

        encoded_polyline:
            null,

        local_only:
            true

    };


    // ========================================
    // SAVE LOCAL WALK IMMEDIATELY
    // ========================================

    saveLocalVisitWalk(
        walk
    );


    return walk;

}


async function startVisitWalk(
    visitId
) {


    const visit =
        allVisits.find(

            item =>

                Number(
                    item.id
                ) ===
                Number(
                    visitId
                )

        );


    if (
        !visit
    ) {

        throw new Error(
            "Visit not found."
        );

    }


    if (
        !isWalkingService(
            visit
        )
    ) {

        throw new Error(
            "Walk tracking is only available for walking services."
        );

    }


    let walk =
        getVisitWalk(
            visitId
        );


    // ========================================
    // EXISTING COMPLETED WALK
    // ========================================

    if (
        walk?.status ===
        "completed"
    ) {

        throw new Error(
            "This walk has already been completed."
        );

    }


    // ========================================
    // EXISTING LOCAL WALK
    // ========================================

    if (
        walk?.local_only ===
        true
    ) {


        saveLocalVisitWalk(
            walk
        );


        await startWalkGpsTracking(
            walk
        );


        renderAdminDayServices();


        startWalkUiTimer();


        return;

    }


    // ========================================
    // OFFLINE START
    // ========================================

    if (
        !navigator.onLine
    ) {


        if (
            !walk
        ) {


            walk =
                createLocalVisitWalk(
                    visitId
                );


            replaceAdminVisitWalk(
                walk
            );

        }


        if (
            walk.local_only ===
            true
        ) {

            saveLocalVisitWalk(
                walk
            );

        }


        await startWalkGpsTracking(
            walk
        );


        renderAdminDayServices();


        startWalkUiTimer();


        return;

    }


    // ========================================
    // ONLINE EXISTING WALK LOOKUP
    // ========================================

    try {


        if (
            !walk
        ) {


            const {
                data: existingWalk,
                error: existingWalkError
            } =
                await supabaseClient
                    .from(
                        "visit_walks"
                    )
                    .select("*")
                    .eq(
                        "visit_id",
                        visitId
                    )
                    .maybeSingle();


            if (
                existingWalkError
            ) {

                throw existingWalkError;

            }


            if (
                existingWalk
            ) {


                replaceAdminVisitWalk(
                    existingWalk
                );


                walk =
                    existingWalk;

            }

        }


        // ========================================
        // CREATE SERVER WALK
        // ========================================

        if (
            !walk
        ) {


            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        "visit_walks"
                    )
                    .insert({

                        visit_id:
                            visitId

                    })
                    .select("*")
                    .single();


            if (
                error
            ) {


                if (
                    error.code ===
                    "23505"
                ) {


                    const {
                        data: recoveredWalk,
                        error: recoveryError
                    } =
                        await supabaseClient
                            .from(
                                "visit_walks"
                            )
                            .select("*")
                            .eq(
                                "visit_id",
                                visitId
                            )
                            .single();


                    if (
                        recoveryError
                    ) {

                        throw recoveryError;

                    }


                    walk =
                        recoveredWalk;


                } else {


                    throw error;

                }


            } else {


                walk =
                    data;

            }


            replaceAdminVisitWalk(
                walk
            );

        }


    } catch (
        error
    ) {


        // ========================================
        // NETWORK DROPPED DURING START
        // ========================================

        if (
            isWalkNetworkError(
                error
            )
        ) {


            walk =
                getVisitWalk(
                    visitId
                );


            if (
                !walk
            ) {


                walk =
                    createLocalVisitWalk(
                        visitId
                    );


                replaceAdminVisitWalk(
                    walk
                );

            }


            if (
                walk.local_only ===
                true
            ) {

                saveLocalVisitWalk(
                    walk
                );

            }


        } else {


            throw error;

        }

    }


    // ========================================
    // START GPS
    // ========================================

    await startWalkGpsTracking(
        walk
    );


    renderAdminDayServices();


    startWalkUiTimer();

}

// ========================================
// FINISH VISIT WALK
// ========================================

async function finishVisitWalk(
    visitId
) {


    const walk =
        getVisitWalk(
            visitId
        );


    if (
        !walk
    ) {

        throw new Error(
            "Active walk not found."
        );

    }


    // ========================================
    // ALREADY SAVED LOCALLY
    // JUST TRY TO SYNC AGAIN
    // ========================================

    const existingPendingFinish =
        loadPendingWalkFinish(
            walk.id
        );


    if (
        existingPendingFinish
    ) {


        await syncPendingWalkFinish(
            walk.id
        );


        return;

    }


    if (
        walk.status !==
        "in_progress"
    ) {

        throw new Error(
            "This walk is not currently active."
        );

    }


    // ========================================
    // STOP GPS IMMEDIATELY
    // ========================================

    let tracker =
        null;


    if (
        activeWalkGpsTracker &&
        Number(
            activeWalkGpsTracker.walkId
        ) ===
        Number(
            walk.id
        )
    ) {


        tracker =
            stopWalkGpsTracking(
                walk.id
            );

    }


    // ========================================
    // RESTORE ANY WAITING POINTS
    // ========================================

    if (
        !tracker
    ) {


        const pendingQueue =
            loadPendingWalkGpsQueue(
                walk.id
            );


        tracker = {

            walkId:
                Number(
                    walk.id
                ),

            visitId:
                Number(
                    walk.visit_id
                ),

            pendingQueue:
                pendingQueue,

            flushPromise:
                null,

            distanceMeters:
                Number(
                    pendingQueue.at(
                        -1
                    )
                        ?.distance_meters_total ??
                    walk.distance_meters ??
                    0
                ),

            pointCount:
                Number(
                    pendingQueue.at(
                        -1
                    )
                        ?.point_count_total ??
                    walk.point_count ??
                    0
                ),

            lastSyncError:
                null

        };

    }


    // ========================================
    // BUILD FINAL WALK TOTALS
    // ========================================

    const endedAt =
        new Date();


    const startedAt =
        new Date(
            walk.started_at
        );


    const durationSeconds =
        Math.max(

            0,

            Math.round(

                (
                    endedAt.getTime() -
                    startedAt.getTime()
                ) /
                1000

            )

        );


    const pendingFinish = {

        ended_at:
            endedAt
                .toISOString(),

        duration_seconds:
            durationSeconds,

        distance_meters:
            Number(
                tracker.distanceMeters ||
                0
            )
                .toFixed(
                    2
                ),

        point_count:
            Number(
                tracker.pointCount ||
                0
            ),

        saved_at:
            new Date()
                .toISOString()

    };


    // ========================================
    // SAVE FINAL WALK ON PHONE FIRST
    // ========================================

    savePendingWalkFinish(
        walk.id,
        pendingFinish
    );


    // ========================================
    // UPDATE LOCAL DISPLAY IMMEDIATELY
    // ========================================

    updateLocalWalkTotals(

        walk.id,

        Number(
            pendingFinish
                .distance_meters
        ),

        Number(
            pendingFinish
                .point_count
        )

    );


    renderAdminDayServices();


    // ========================================
    // ATTEMPT SERVER SYNC
    // FAILURE IS OKAY -- LOCAL COPY REMAINS
    // ========================================

    await syncPendingWalkFinish(
        walk.id
    );

}

// ========================================
// VISIT FINISH STORAGE KEY
// ========================================

function getPendingVisitFinishStorageKey(
    visitId
) {


    return (
        `paws-in-stride-visit-finish-${visitId}`
    );

}


// ========================================
// LOAD PENDING VISIT FINISH
// ========================================

function loadPendingVisitFinish(
    visitId
) {


    try {


        const value =
            localStorage.getItem(
                getPendingVisitFinishStorageKey(
                    visitId
                )
            );


        if (
            !value
        ) {

            return null;

        }


        return JSON.parse(
            value
        );


    } catch (
        error
    ) {


        console.warn(
            "Unable to load pending visit finish:",
            error
        );


        return null;

    }

}


// ========================================
// SAVE PENDING VISIT FINISH
// ========================================

function savePendingVisitFinish(
    visitId,
    finishData
) {


    try {


        localStorage.setItem(

            getPendingVisitFinishStorageKey(
                visitId
            ),

            JSON.stringify(
                finishData
            )

        );


    } catch (
        error
    ) {


        console.warn(
            "Unable to save pending visit finish:",
            error
        );

    }

}


// ========================================
// CLEAR PENDING VISIT FINISH
// ========================================

function clearPendingVisitFinish(
    visitId
) {


    try {


        localStorage.removeItem(
            getPendingVisitFinishStorageKey(
                visitId
            )
        );


    } catch (
        error
    ) {


        console.warn(
            "Unable to clear pending visit finish:",
            error
        );

    }

}


// ========================================
// SYNC PENDING VISIT FINISH
// ========================================

async function syncPendingVisitFinish(
    visitId,
    shouldRender = true
) {


    const visit =
        allVisits.find(

            item =>

                Number(
                    item.id
                ) ===
                Number(
                    visitId
                )

        );


    if (
        !visit
    ) {

        return false;

    }


    const pendingFinish =
        loadPendingVisitFinish(
            visit.id
        );


    if (
        !pendingFinish
    ) {

        return true;

    }


    try {


        const {

            data,
            error

        } =
            await supabaseClient
                .from(
                    "visits"
                )
                .update({

                    status:
                        "completed",

                    checked_in_at:
                        pendingFinish
                            .checked_in_at,

                    completed_at:
                        pendingFinish
                            .completed_at

                })
                .eq(
                    "id",
                    visit.id
                )
                .select("*")
                .single();


        if (
            error
        ) {

            throw error;

        }


        replaceAdminVisit(
            data
        );


        clearPendingVisitFinish(
            visit.id
        );


        if (
            shouldRender
        ) {


            renderAdminCalendar();


            renderAdminDayServices();

        }


        console.log(
            "Pending visit synced successfully:",
            visit.id
        );


        return true;


    } catch (
        error
    ) {


        if (
            isWalkNetworkError(
                error
            )
        ) {


            console.warn(
                "Visit saved locally and waiting for connection:",
                error
            );


            if (
                shouldRender
            ) {

                renderAdminDayServices();

            }


            return false;

        }


        throw error;

    }

}


// ========================================
// SYNC ALL PENDING VISIT FINISHES
// ========================================

async function syncAllPendingVisitFinishes(
    shouldRender = true
) {


    if (
        !navigator.onLine
    ) {

        return;

    }


    let changed =
        false;


    for (
        const visit of
        allVisits
    ) {


        const pendingFinish =
            loadPendingVisitFinish(
                visit.id
            );


        if (
            !pendingFinish
        ) {

            continue;

        }


        try {


            const synced =
                await syncPendingVisitFinish(
                    visit.id,
                    false
                );


            if (
                synced
            ) {

                changed =
                    true;

            }


        } catch (
            error
        ) {


            console.error(
                "Unable to auto-sync pending visit:",
                error
            );

        }

    }


    if (
        changed &&
        shouldRender
    ) {


        renderAdminCalendar();


        renderAdminDayServices();

    }

}


// ========================================
// RETRY PENDING VISIT SYNC
// ========================================

async function retryPendingVisitSync(
    visitId
) {


    const pendingFinish =
        loadPendingVisitFinish(
            visitId
        );


    if (
        !pendingFinish
    ) {


        renderAdminDayServices();


        return;

    }


    await syncPendingVisitFinish(
        visitId
    );

}


// ========================================
// FINISH VISIT
// ========================================

async function finishVisit(
    visitId
) {


    const visit =
        allVisits.find(

            item =>

                Number(
                    item.id
                ) ===
                Number(
                    visitId
                )

        );


    if (
        !visit
    ) {

        throw new Error(
            "Visit not found."
        );

    }


    // ========================================
    // ALREADY SAVED LOCALLY
    // JUST TRY TO SYNC AGAIN
    // ========================================

    const existingPendingFinish =
        loadPendingVisitFinish(
            visit.id
        );


    if (
        existingPendingFinish
    ) {


        await syncPendingVisitFinish(
            visit.id
        );


        return;

    }


    // ========================================
    // BUILD FINAL VISIT TIMES
    // ========================================

    const completedAt =
        new Date()
            .toISOString();


    const checkedInAt =
        visit.checked_in_at ||
        completedAt;


    const pendingFinish = {

        checked_in_at:
            checkedInAt,

        completed_at:
            completedAt,

        saved_at:
            new Date()
                .toISOString()

    };


    // ========================================
    // SAVE VISIT ON PHONE FIRST
    // ========================================

    savePendingVisitFinish(
        visit.id,
        pendingFinish
    );


    // ========================================
    // UPDATE UI IMMEDIATELY
    // ========================================

    renderAdminDayServices();


    // ========================================
    // ATTEMPT SERVER SYNC
    // FAILURE IS OKAY -- LOCAL COPY REMAINS
    // ========================================

    await syncPendingVisitFinish(
        visit.id
    );

}

// ========================================
// REOPEN VISIT
// ========================================

async function reopenVisit(
    visitId
) {


    const visit =
        allVisits.find(

            item =>

                Number(
                    item.id
                ) ===
                Number(
                    visitId
                )

        );



    if (!visit) {


        throw new Error(
            "Visit not found."
        );

    }



    const nextStatus =
        visit.checked_in_at

            ? "checked_in"

            : "scheduled";



    const {

        data,
        error

    } =
        await supabaseClient
            .from("visits")
            .update({

                status:
                    nextStatus,

                completed_at:
                    null

            })
            .eq(
                "id",
                visitId
            )
            .select("*")
            .single();



    if (error) {

        throw error;

    }



    replaceAdminVisit(
        data
    );


    renderAdminCalendar();


    renderAdminDayServices();

}

// ========================================
// REPLACE VISIT IN LOCAL STATE
// ========================================

function replaceAdminVisit(
    updatedVisit
) {


    allVisits =
        allVisits.map(

            visit =>

                Number(
                    visit.id
                ) ===
                Number(
                    updatedVisit.id
                )

                    ? updatedVisit

                    : visit

        );


    // ========================================
    // REFRESH HOME LIVE SECTIONS
    // ========================================

    if (
        activeAdminScreen ===
        "home"
    ) {

        renderAdminTodaySummary();

        renderAdminNeedsAttention();

        renderAdminBestVisitRoute();

        renderAdminFinancialSnapshot();

    }

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



    const household =
        allHouseholds.find(

            item =>

                item.client_id ===
                visit.client_id

        );



    const addressParts =
        [];



    if (
        household?.street_address
    ) {


        addressParts.push(
            household.street_address
        );

    }



    if (
        household?.address_line_2
    ) {


        addressParts.push(
            household.address_line_2
        );

    }



    const cityState =
        [

            household?.city,
            household?.state

        ]
            .filter(Boolean)
            .join(", ");



    const cityStateZip =
        `${cityState}${

            household?.zip_code

                ? ` ${household.zip_code}`

                : ""

        }`
            .trim();



    if (
        cityStateZip
    ) {


        addressParts.push(
            cityStateZip
        );

    }



    const clientAddress =
        addressParts.join(
            ", "
        );



    const googleMapsUrl =
        clientAddress

            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                clientAddress
            )}`

            : "";



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



    const progress =
        getVisitProgressInfo(
            visit
        );



    const cardStateClass =
        progress.state ===
        "completed"

            ? "admin-service-card-completed"

            : progress.state ===
                "checked_in"

                ? "admin-service-card-in-progress"

                : "";



    return `

        <article class="admin-service-card ${cardStateClass}">


            ${buildVisitProgressIcon(
                progress
            )}


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


                    ${
                        clientAddress

                            ? `

                                <a
                                    href="${escapeHtml(
                                        googleMapsUrl
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="admin-client-address"
                                >
                                    ${escapeHtml(
                                        clientAddress
                                    )}
                                </a>

                            `

                            : `

                                <small>
                                    Address not added
                                </small>

                            `
                    }


                </div>


                <div class="admin-service-detail">


                    <span>

                        ${
                            petNames.length ===
                            1

                                ? "Pet"

                                : "Pets"
                        }

                    </span>


                    <div class="service-pet-chips admin-service-pet-chips">


                        ${petNames

                            .map(

                                name => `

                                    <span class="service-pet-chip">
                                        ${escapeHtml(
                                            name
                                        )}
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


            ${buildAdminVisitProgressSection(
                visit,
                progress
            )}


        </article>

    `;

}



// ========================================
// VISIT PROGRESS INFO
// ========================================

function getVisitProgressInfo(
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
                getVisitDurationMinutes(
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
// VISIT PROGRESS ICON
// ========================================

function buildVisitProgressIcon(
    progress
) {


    if (
        progress.state ===
        "completed"
    ) {


        return `

            <div
                class="admin-visit-progress-icon admin-visit-progress-complete"
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
                class="admin-visit-progress-icon admin-visit-progress-active"
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
// WALK SERVICE CHECK
// ========================================

function isWalkingService(
    visit
) {


    const serviceName =
        String(

            visit?.service_name ||
            visit?.service_type ||
            ""

        )
            .trim()
            .toLowerCase();


    return (

        serviceName.includes(
            "walk"
        ) ||

        serviceName.includes(
            "walking"
        )

    );

}


// ========================================
// GET VISIT WALK
// ========================================

function getVisitWalk(
    visitId
) {


    return (

        allVisitWalks.find(

            walk =>

                Number(
                    walk.visit_id
                ) ===
                Number(
                    visitId
                )

        ) ||
        null

    );

}


// ========================================
// FORMAT WALK DURATION
// ========================================

function formatWalkDuration(
    seconds
) {


    const safeSeconds =
        Math.max(

            0,

            Number(
                seconds ||
                0
            )

        );


    const hours =
        Math.floor(
            safeSeconds /
            3600
        );


    const minutes =
        Math.floor(
            (
                safeSeconds %
                3600
            ) /
            60
        );


    const remainingSeconds =
        Math.floor(
            safeSeconds %
            60
        );


    return [

        hours,
        minutes,
        remainingSeconds

    ]
        .map(

            value =>
                String(
                    value
                )
                    .padStart(
                        2,
                        "0"
                    )

        )
        .join(":");

}


// ========================================
// ADMIN VISIT PROGRESS SECTION
// ========================================

function buildAdminVisitProgressSection(
    visit,
    progress
) {


    const walkingService =
        isWalkingService(
            visit
        );


    const walk =
        walkingService

            ? getVisitWalk(
                visit.id
            )

            : null;


    // ========================================
    // COMPLETED VISIT
    // ========================================
    
    if (
        progress.state ===
        "completed"
    ) {
    
    
        const checkedIn =
            formatVisitTimestamp(
                progress.checkedInAt
            );
    
    
        const completed =
            formatVisitTimestamp(
                progress.completedAt
            );
    
    
        const durationText =
            progress.minutes !==
            null
    
                ? `${progress.minutes} total ${
                    progress.minutes ===
                    1
    
                        ? "minute"
    
                        : "minutes"
                }`
    
                : "Duration unavailable";
    
    
        const existingReport =
            allVisitReports.find(
    
                report =>
    
                    Number(
                        report.visit_id
                    ) ===
                    Number(
                        visit.id
                    )
    
            );
    
    
        // ========================================
        // COMPLETED WALK STATS
        // ========================================
    
        let completedWalkStats =
            "";
    
    
        if (
            walkingService &&
            walk?.status ===
            "completed"
        ) {
    
    
            const walkDuration =
                formatWalkDuration(
                    Number(
                        walk.duration_seconds ||
                        0
                    )
                );
    
    
            const walkMiles =
                (
                    Number(
                        walk.distance_meters ||
                        0
                    ) /
                    1609.344
                ).toFixed(
                    2
                );
    
    
            const walkPointCount =
                Number(
                    walk.point_count ||
                    0
                );
    
    
            completedWalkStats = `
    
                <div class="admin-visit-progress-copy">
    
    
                    <strong>
                        🐾 Walk Complete
                    </strong>
    
    
                    <span>
                        ${escapeHtml(
                            walkDuration
                        )}
    
                        •
    
                        ${walkMiles} mi
    
                        •
    
                        ${walkPointCount}
                        GPS ${
                            walkPointCount ===
                            1
    
                                ? "point"
    
                                : "points"
                        }
                    </span>
    
    
                </div>
    
            `;
    
        }
    
    
        return `
    
            <div class="admin-visit-progress admin-visit-progress-finished">
    
    
                <div class="admin-visit-progress-copy">
    
    
                    <strong>
                        ✓ Visit Complete
                    </strong>
    
    
                    <span>
    
                        ${escapeHtml(
    
                            checkedIn &&
                            completed
    
                                ? `${checkedIn} – ${completed} • ${durationText}`
    
                                : durationText
    
                        )}
    
                    </span>
    
    
                </div>
    
    
                ${completedWalkStats}
    
    
                <div class="admin-completed-visit-actions">
    
    
                    <button
                        type="button"
                        class="primary-button admin-visit-report-button"
                        data-visit-report-open="${visit.id}"
                    >
                        ${
                            existingReport
    
                                ? "Edit Visit Report"
    
                                : "Add Visit Report"
                        }
                    </button>
    
    
                    <button
                        type="button"
                        class="secondary-button admin-reopen-visit-button"
                        data-visit-action="reopen"
                        data-visit-id="${visit.id}"
                    >
                        Reopen Visit
                    </button>
    
    
                </div>
    
    
            </div>
    
    
            <div
                id="admin-visit-report-${visit.id}"
                class="admin-visit-report-mount"
            ></div>
    
        `;
    
    }


    // ========================================
    // CHECKED IN
    // ========================================
    
    if (
        progress.state ===
        "checked_in"
    ) {
    
    
        const checkedIn =
            formatVisitTimestamp(
                progress.checkedInAt
            );
    
    
        // ========================================
        // VISIT SAVED LOCALLY / WAITING TO SYNC
        // ========================================
    
        const pendingVisitFinish =
            loadPendingVisitFinish(
                visit.id
            );
    
    
        if (
            pendingVisitFinish
        ) {
    
    
            const pendingCompleted =
                formatVisitTimestamp(
                    pendingVisitFinish
                        .completed_at
                );
    
    
            const pendingCheckedIn =
                formatVisitTimestamp(
                    pendingVisitFinish
                        .checked_in_at
                );
    
    
            const pendingDurationMinutes =
                Math.max(
    
                    0,
    
                    Math.round(
    
                        (
                            new Date(
                                pendingVisitFinish
                                    .completed_at
                            ).getTime() -
    
                            new Date(
                                pendingVisitFinish
                                    .checked_in_at
                            ).getTime()
                        ) /
    
                        60000
    
                    )
    
                );
    
    
            return `
    
                <div class="admin-visit-progress admin-visit-progress-live">
    
    
                    <div class="admin-visit-progress-copy">
    
    
                        <strong>
                            ✓ Visit Saved
                        </strong>
    
    
                        <span>
                            ${escapeHtml(
    
                                pendingCheckedIn &&
                                pendingCompleted
    
                                    ? `${pendingCheckedIn} – ${pendingCompleted} • ${pendingDurationMinutes} total ${
                                        pendingDurationMinutes ===
                                        1
    
                                            ? "minute"
    
                                            : "minutes"
                                    }`
    
                                    : "Visit completion saved"
    
                            )}
                        </span>
    
    
                        <span>
                            Saved on this phone • Waiting to sync
                        </span>
    
    
                    </div>
    
    
                    <div class="admin-completed-visit-actions">
    
    
                        <button
                            type="button"
                            class="primary-button admin-visit-action-button"
                            data-visit-action="sync-visit"
                            data-visit-id="${visit.id}"
                        >
                            Retry Sync
                        </button>
    
    
                    </div>
    
    
                </div>
    
            `;
    
        }


        // ========================================
        // WALK CURRENTLY RUNNING
        // ========================================

        if (
            walkingService &&
            walk?.status ===
            "in_progress"
        ) {


            // ========================================
            // WALK SAVED LOCALLY / WAITING TO SYNC
            // ========================================
            
            const pendingFinish =
                loadPendingWalkFinish(
                    walk.id
                );
            
            
            if (
                pendingFinish
            ) {
            
            
                const pendingMiles =
                    Number(
                        pendingFinish
                            .distance_meters ||
                        0
                    ) /
                    1609.344;
            
            
                const pendingPointCount =
                    Number(
                        pendingFinish
                            .point_count ||
                        0
                    );
            
            
                return `
            
                    <div class="admin-visit-progress admin-visit-progress-live">
            
            
                        <div class="admin-visit-progress-copy">
            
            
                            <strong>
                                ✓ Walk Saved
                            </strong>
            
            
                            <span>
                                ${escapeHtml(
                                    formatWalkDuration(
                                        Number(
                                            pendingFinish
                                                .duration_seconds ||
                                            0
                                        )
                                    )
                                )}
            
                                •
            
                                ${pendingMiles.toFixed(
                                    2
                                )} mi
                            </span>
            
            
                            <span>
                                ${pendingPointCount}
                                GPS ${
                                    pendingPointCount ===
                                    1
            
                                        ? "point"
            
                                        : "points"
                                }
                            </span>
            
            
                            <span>
                                Saved on this phone • Waiting to sync
                            </span>
            
            
                        </div>
            
            
                        <div class="admin-completed-visit-actions">
            
            
                            <button
                                type="button"
                                class="primary-button admin-visit-action-button"
                                data-visit-action="finish"
                                data-visit-id="${visit.id}"
                            >
                                Finish Visit
                            </button>
            
            
                            <button
                                type="button"
                                class="secondary-button admin-visit-action-button"
                                data-visit-action="sync-walk"
                                data-visit-id="${visit.id}"
                            >
                                Retry Sync
                            </button>
            
            
                        </div>
            
            
                    </div>
            
                `;
            
            }


            // ========================================
            // ACTIVE WALK
            // ========================================

            const startedAt =
                formatVisitTimestamp(
                    walk.started_at
                );


            const elapsedSeconds =
                Math.max(

                    0,

                    Math.floor(

                        (
                            Date.now() -
                            new Date(
                                walk.started_at
                            ).getTime()
                        ) /
                        1000

                    )

                );


            const gpsActive =
                isWalkGpsTracking(
                    walk.id
                );


            return `

                <div class="admin-visit-progress admin-visit-progress-live">


                    <div class="admin-visit-progress-copy">


                        <strong>
                            🐾 Walk In Progress
                        </strong>


                        <span>
                            ${
                                startedAt

                                    ? `Started at ${escapeHtml(
                                        startedAt
                                    )}`

                                    : "Walk tracking active"
                            }
                        </span>


                        <span>

                            <span
                                id="admin-walk-duration-${visit.id}"
                            >
                                ${escapeHtml(
                                    formatWalkDuration(
                                        elapsedSeconds
                                    )
                                )}
                            </span>

                            •

                            <span
                                id="admin-walk-distance-${visit.id}"
                            >
                                ${(
                                    Number(
                                        walk.distance_meters ||
                                        0
                                    ) /
                                    1609.344
                                ).toFixed(2)}
                                mi
                            </span>

                        </span>


                        <span
                            id="admin-walk-points-${visit.id}"
                        >
                            ${Number(
                                walk.point_count ||
                                0
                            )}
                            GPS ${
                                Number(
                                    walk.point_count ||
                                    0
                                ) ===
                                1

                                    ? "point"

                                    : "points"
                            }
                        </span>


                        ${
                            gpsActive

                                ? `
                                    <span>
                                        GPS tracking active
                                    </span>
                                `

                                : `
                                    <span>
                                        GPS tracking paused on this device
                                    </span>
                                `
                        }


                    </div>


                    <div class="admin-completed-visit-actions">


                        ${
                            !gpsActive

                                ? `
                                    <button
                                        type="button"
                                        class="primary-button admin-visit-action-button"
                                        data-visit-action="resume-walk-gps"
                                        data-visit-id="${visit.id}"
                                    >
                                        Resume GPS
                                    </button>
                                `

                                : ""
                        }


                        <button
                            type="button"
                            class="${
                                gpsActive
                                    ? "primary-button"
                                    : "secondary-button"
                            } admin-visit-action-button"
                            data-visit-action="finish-walk"
                            data-visit-id="${visit.id}"
                        >
                            Finish Walk
                        </button>


                    </div>


                </div>
            `;

        }


        // ========================================
        // WALK FINISHED / VISIT STILL OPEN
        // ========================================

        if (
            walkingService &&
            walk?.status ===
            "completed"
        ) {


            const miles =
                (
                    Number(
                        walk.distance_meters ||
                        0
                    ) /
                    1609.344
                )
                    .toFixed(
                        2
                    );


            return `

                <div class="admin-visit-progress admin-visit-progress-live">


                    <div class="admin-visit-progress-copy">


                        <strong>
                            ✓ Walk Complete
                        </strong>


                        <span>
                            ${escapeHtml(
                                formatWalkDuration(
                                    walk.duration_seconds
                                )
                            )}
                            •
                            ${miles}
                            mi
                        </span>


                        <span>
                            Visit is still in progress.
                        </span>


                    </div>


                    <button
                        type="button"
                        class="primary-button admin-visit-action-button admin-finish-visit-button"
                        data-visit-action="finish"
                        data-visit-id="${visit.id}"
                    >
                        Finish Visit
                    </button>


                </div>

            `;

        }


        // ========================================
        // CHECKED-IN WALK NOT STARTED
        // ========================================

        if (
            walkingService
        ) {


            return `

                <div class="admin-visit-progress admin-visit-progress-live">


                    <div class="admin-visit-progress-copy">


                        <strong>
                            Visit In Progress
                        </strong>


                        <span>

                            Checked in${

                                checkedIn

                                    ? ` at ${escapeHtml(
                                        checkedIn
                                    )}`

                                    : ""

                            }

                        </span>


                    </div>


                    <div class="admin-completed-visit-actions">


                        <button
                            type="button"
                            class="primary-button admin-visit-action-button"
                            data-visit-action="start-walk"
                            data-visit-id="${visit.id}"
                        >
                            Start Walk
                        </button>


                        <button
                            type="button"
                            class="secondary-button admin-visit-action-button admin-finish-visit-button"
                            data-visit-action="finish"
                            data-visit-id="${visit.id}"
                        >
                            Finish Visit
                        </button>


                    </div>


                </div>

            `;

        }


        // ========================================
        // NORMAL NON-WALK SERVICE
        // ========================================

        return `

            <div class="admin-visit-progress admin-visit-progress-live">


                <div class="admin-visit-progress-copy">


                    <strong>
                        Visit In Progress
                    </strong>


                    <span>

                        Checked in${

                            checkedIn

                                ? ` at ${escapeHtml(
                                    checkedIn
                                )}`

                                : ""

                        }

                    </span>


                </div>


                <button
                    type="button"
                    class="primary-button admin-visit-action-button admin-finish-visit-button"
                    data-visit-action="finish"
                    data-visit-id="${visit.id}"
                >
                    Finish Visit
                </button>


            </div>

        `;

    }


    // ========================================
    // NOT STARTED
    // ========================================

    return `

        <div class="admin-visit-progress admin-visit-progress-ready">


            <div class="admin-visit-progress-copy">


                <strong>
                    Visit Not Started
                </strong>


                <span>
                    Check in when you begin servicing this pet.
                </span>


            </div>


            <button
                type="button"
                class="primary-button admin-visit-action-button admin-check-in-button"
                data-visit-action="check-in"
                data-visit-id="${visit.id}"
            >
                Check In
            </button>


        </div>

    `;

}

// ========================================
// OPEN VISIT REPORT
// ========================================

async function openAdminVisitReport(
    visitId
) {


    const visit =
        allVisits.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    visitId
                )
        );


    if (
        !visit
    ) {

        return;

    }


    const mount =
        document.getElementById(
            `admin-visit-report-${visitId}`
        );


    if (
        !mount
    ) {

        return;

    }


    if (
        activeVisitReportVisitId ===
        visitId &&
        mount.innerHTML.trim()
    ) {


        closeAdminVisitReport();

        return;

    }


    closeAdminVisitReport();


    activeVisitReportVisitId =
        visitId;


    pendingVisitReportPhotos =
        [];


    activeVisitReportMedia =
        [];


    mount.innerHTML =
        `
            <div class="admin-visit-report-loading">
                Loading visit report...
            </div>
        `;


    const existingReport =
        allVisitReports.find(
            report =>
                Number(
                    report.visit_id
                ) ===
                Number(
                    visitId
                )
        ) ||
        null;


    // ========================================
    // LOAD EXISTING PET CARE
    // ========================================

    let existingPetCare =
        [];


    if (
        existingReport?.id
    ) {


        const {
            data: petCare,
            error: petCareError
        } =
            await supabaseClient
                .from(
                    "visit_report_pet_care"
                )
                .select(
                    "visit_report_id, pet_id, fed, fresh_water, pee, poop, created_at, updated_at"
                )
                .eq(
                    "visit_report_id",
                    existingReport.id
                );


        if (
            petCareError
        ) {


            console.error(
                "Visit report pet care error:",
                petCareError
            );


            mount.innerHTML =
                `
                    <div class="admin-visit-report-error">
                        We couldn't load this visit report.
                    </div>
                `;


            return;

        }


        existingPetCare =
            petCare ||
            [];

    }


    // ========================================
    // LOAD EXISTING VISIT MEDIA
    // ========================================

    const {
        data: media,
        error: mediaError
    } =
        await supabaseClient
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
            );


    if (
        mediaError
    ) {


        console.error(
            "Visit report media error:",
            mediaError
        );


        mount.innerHTML =
            `
                <div class="admin-visit-report-error">
                    We couldn't load this visit report.
                </div>
            `;


        return;

    }


    activeVisitReportMedia =
        media ||
        [];


    const mediaWithUrls =
        await Promise.all(

            activeVisitReportMedia.map(
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
                                : data?.signedUrl ||
                                  null

                    };

                }
            )

        );


    activeVisitReportMedia =
        mediaWithUrls;


    // ========================================
    // RENDER VISIT REPORT FORM
    // ========================================

    renderAdminVisitReportForm(
        visit,
        existingReport,
        existingPetCare
    );


    // ========================================
    // LOAD AUTOMATIC WALK ROUTE
    // ========================================

    await loadAdminWalkRouteMap(
        visit.id
    );

}

// ========================================
// CLOSE VISIT REPORT
// ========================================

function closeAdminVisitReport() {


    if (
        activeVisitReportVisitId
    ) {


        const mount =
            document.getElementById(
                `admin-visit-report-${activeVisitReportVisitId}`
            );


        if (
            mount
        ) {

            mount.innerHTML =
                "";

        }

    }


    activeVisitReportVisitId =
        null;


    pendingVisitReportPhotos =
        [];


    activeVisitReportMedia =
        [];

}


// ========================================
// LOAD WALK ROUTE MAP
// ========================================

async function loadAdminWalkRouteMap(
    visitId
) {


    const walk =
        getVisitWalk(
            visitId
        );


    if (
        !walk ||
        walk.status !==
        "completed"
    ) {

        return;

    }


    const mapElement =
        document.getElementById(
            `admin-walk-route-map-${visitId}`
        );


    if (
        !mapElement
    ) {

        return;

    }


    try {


        // ========================================
        // LOAD RECORDED GPS POINTS
        // ========================================

        const {
            data: walkPoints,
            error: walkPointsError
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
                    walk.id
                )
                .order(
                    "sequence_number",
                    {
                        ascending:
                            true
                    }
                );


        if (
            walkPointsError
        ) {

            throw walkPointsError;

        }


        if (
            !walkPoints ||
            walkPoints.length <
            2
        ) {

            mapElement.innerHTML =
                `

                    <div class="admin-walk-route-map-empty">

                        <strong>
                            Walk Route
                        </strong>

                        <span>
                            Not enough GPS data was recorded to draw this route.
                        </span>

                    </div>

                `;


            return;

        }


        // ========================================
        // GOOGLE MAPS AVAILABLE
        // ========================================

        if (
            window.google &&
            google.maps
        ) {

            renderAdminGoogleWalkRoute(
                mapElement,
                walkPoints
            );


            return;

        }


        // ========================================
        // GOOGLE MAPS NOT LOADED
        // ========================================

        mapElement.innerHTML =
            `

                <div class="admin-walk-route-map-empty">

                    <strong>
                        Walk Route
                    </strong>

                    <span>
                        Google Maps is not loaded yet.
                    </span>

                </div>

            `;


    } catch (
        error
    ) {


        console.error(
            "Walk route map error:",
            error
        );


        mapElement.innerHTML =
            `

                <div class="admin-walk-route-map-empty">

                    <strong>
                        Walk Route
                    </strong>

                    <span>
                        We couldn't load the recorded route.
                    </span>

                </div>

            `;

    }

}


// ========================================
// RENDER GOOGLE WALK ROUTE
// ========================================

function renderAdminGoogleWalkRoute(
    mapElement,
    walkPoints
) {


    const path =
        walkPoints.map(
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
        );


    const firstPoint =
        path[0];


    const lastPoint =
        path[
            path.length -
            1
        ];


    // ========================================
    // CREATE MAP
    // ========================================

    const map =
        new google.maps.Map(
            mapElement,
            {

                center:
                    firstPoint,

                zoom:
                    17,

                mapTypeControl:
                    false,

                streetViewControl:
                    false,

                fullscreenControl:
                    true,

                gestureHandling:
                    "cooperative"

            }
        );


    // ========================================
    // DRAW EXACT RECORDED GPS ROUTE
    // ========================================

    const routeLine =
        new google.maps.Polyline({

            path:
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
            firstPoint,

        map:
            map,

        title:
            "Walk Started",

        label: {
            text:
                "S",
            color:
                "#ffffff",
            fontWeight:
                "700"
        },

        icon: {

            path:
                google.maps.SymbolPath.CIRCLE,

            scale:
                10,

            fillColor:
                "#22a06b",

            fillOpacity:
                1,

            strokeColor:
                "#ffffff",

            strokeWeight:
                2

        }

    });


    // ========================================
    // FINISH MARKER
    // ========================================

    new google.maps.Marker({

        position:
            lastPoint,

        map:
            map,

        title:
            "Walk Finished",

        label: {
            text:
                "F",
            color:
                "#ffffff",
            fontWeight:
                "700"
        },

        icon: {

            path:
                google.maps.SymbolPath.CIRCLE,

            scale:
                10,

            fillColor:
                "#d94a4a",

            fillOpacity:
                1,

            strokeColor:
                "#ffffff",

            strokeWeight:
                2

        }

    });


    // ========================================
    // FIT MAP TO ENTIRE RECORDED ROUTE
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
        bounds,
        40
    );

}


// ========================================
// RENDER VISIT REPORT FORM
// ========================================

function renderAdminVisitReportForm(
    visit,
    report,
    existingPetCare = []
) {
    const mount =
        document.getElementById(
            `admin-visit-report-${visit.id}`
        );

    if (!mount) return;

    const pets =
        getAdminPetsForVisit(
            visit
        );

    const petNameList =
        pets
            .map(
                pet =>
                    String(
                        pet.name ||
                        ""
                    ).trim()
            )
            .filter(Boolean);

    let petNames =
        "Pet";

    if (
        petNameList.length ===
        1
    ) {

        petNames =
            petNameList[0];

    }

    if (
        petNameList.length ===
        2
    ) {

        petNames =
            `${petNameList[0]} & ${petNameList[1]}`;

    }

    if (
        petNameList.length >
        2
    ) {

        petNames =
            `${petNameList
                .slice(0, -1)
                .join(", ")} & ${
                    petNameList[
                        petNameList.length - 1
                    ]
                }`;

    }

    const existingVisitPhotos =
        activeVisitReportMedia.filter(
            item =>
                item.photo_type ===
                "visit"
        );

    // ========================================
    // PER-PET CARE CARDS
    // ========================================

    const petCareHtml =
        pets.length

            ? pets
                .map(
                    pet => {


                        const savedCare =
                            existingPetCare.find(
                                item =>
                                    Number(
                                        item.pet_id
                                    ) ===
                                    Number(
                                        pet.id
                                    )
                            ) ||
                            null;


                        // ========================================
                        // LEGACY SINGLE-PET FALLBACK
                        // ========================================

                        const care =
                            savedCare ||
                            (
                                pets.length ===
                                1

                                    ? report ||
                                      {}

                                    : {}
                            );


                        return `
                            <div
                                class="admin-visit-pet-care-card"
                                data-pet-care-card
                                data-pet-id="${pet.id}"
                            >

                                <div class="admin-visit-pet-care-header">

                                    <strong>
                                        ${escapeHtml(
                                            pet.name ||
                                            "Pet"
                                        )}
                                    </strong>

                                    <span>
                                        Care Updates
                                    </span>

                                </div>


                                <div class="admin-visit-care-grid">


                                    <label class="admin-visit-care-option">

                                        <input
                                            type="checkbox"
                                            data-pet-care-field="fed"
                                            ${
                                                care.fed
                                                    ? "checked"
                                                    : ""
                                            }
                                        >

                                        <span>
                                            Fed
                                        </span>

                                    </label>


                                    <label class="admin-visit-care-option">

                                        <input
                                            type="checkbox"
                                            data-pet-care-field="fresh_water"
                                            ${
                                                care.fresh_water
                                                    ? "checked"
                                                    : ""
                                            }
                                        >

                                        <span>
                                            Fresh Water
                                        </span>

                                    </label>


                                    <label class="admin-visit-care-option">

                                        <input
                                            type="checkbox"
                                            data-pet-care-field="pee"
                                            ${
                                                care.pee
                                                    ? "checked"
                                                    : ""
                                            }
                                        >

                                        <span>
                                            Pee
                                        </span>

                                    </label>


                                    <label class="admin-visit-care-option">

                                        <input
                                            type="checkbox"
                                            data-pet-care-field="poop"
                                            ${
                                                care.poop
                                                    ? "checked"
                                                    : ""
                                            }
                                        >

                                        <span>
                                            Poop
                                        </span>

                                    </label>


                                </div>

                            </div>
                        `;

                    }
                )
                .join("")

            : `
                <div class="admin-visit-report-help">
                    No pets are attached to this visit.
                </div>
            `;


    // ========================================
    // REPLACE LEGACY SHARED CARE GRID
    // AFTER FORM HTML IS MOUNTED
    // ========================================

    queueMicrotask(
        () => {


            const legacyCareGrid =
                mount.querySelector(
                    ".admin-visit-care-grid"
                );


            if (
                !legacyCareGrid
            ) {

                return;

            }


            legacyCareGrid.outerHTML =
                `
                    <div class="admin-visit-pet-care-list">
                        ${petCareHtml}
                    </div>
                `;

        }
    );

    // ========================================
    // AUTOMATIC WALK SUMMARY
    // ========================================

    const completedWalk =
        getVisitWalk(
            visit.id
        );


    const hasCompletedWalk =
        completedWalk?.status ===
        "completed";


    const walkDuration =
        hasCompletedWalk

            ? formatWalkDuration(
                Number(
                    completedWalk
                        .duration_seconds ||
                    0
                )
            )

            : null;


    const walkMiles =
        hasCompletedWalk

            ? (
                Number(
                    completedWalk
                        .distance_meters ||
                    0
                ) /
                1609.344
            ).toFixed(
                2
            )

            : null;


    const walkStartedAt =
        hasCompletedWalk &&
        completedWalk.started_at

            ? new Date(
                completedWalk.started_at
            ).toLocaleTimeString(
                "en-US",
                {
                    hour:
                        "numeric",
                    minute:
                        "2-digit"
                }
            )

            : null;


    const walkEndedAt =
        hasCompletedWalk &&
        completedWalk.ended_at

            ? new Date(
                completedWalk.ended_at
            ).toLocaleTimeString(
                "en-US",
                {
                    hour:
                        "numeric",
                    minute:
                        "2-digit"
                }
            )

            : null;


    mount.innerHTML =
        `

            <form
                class="admin-visit-report-form"
                data-visit-report-form
                data-visit-id="${visit.id}"
            >


                <div class="admin-visit-report-header">


                    <div>

                        <span class="admin-visit-report-eyebrow">
                            VISIT REPORT
                        </span>


                        <h5>
                            ${escapeHtml(
                                petNames
                            )}
                        </h5>


                        <p>
                            Add care updates, photos, notes, and your recorded walk summary.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="admin-visit-report-close"
                        data-visit-report-close
                        aria-label="Close visit report"
                    >
                        ×
                    </button>


                </div>


                <div class="admin-visit-report-section">


                    <span class="admin-visit-report-label">
                        Care Completed
                    </span>


                    <div class="admin-visit-care-grid">


                        <label class="admin-visit-care-option">

                            <input
                                type="checkbox"
                                name="fed"
                                ${
                                    report?.fed
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span>
                                Fed
                            </span>

                        </label>


                        <label class="admin-visit-care-option">

                            <input
                                type="checkbox"
                                name="fresh_water"
                                ${
                                    report?.fresh_water
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span>
                                Fresh Water
                            </span>

                        </label>


                        <label class="admin-visit-care-option">

                            <input
                                type="checkbox"
                                name="pee"
                                ${
                                    report?.pee
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span>
                                Pee
                            </span>

                        </label>


                        <label class="admin-visit-care-option">

                            <input
                                type="checkbox"
                                name="poop"
                                ${
                                    report?.poop
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span>
                                Poop
                            </span>

                        </label>


                    </div>


                </div>


                <div class="admin-visit-report-section">


                    <label
                        class="admin-visit-report-label"
                        for="visit-report-notes-${visit.id}"
                    >
                        Visit Notes
                    </label>


                    <textarea
                        id="visit-report-notes-${visit.id}"
                        name="notes"
                        class="admin-visit-report-notes"
                        placeholder="How did the visit go? Add anything the client should know..."
                    >${escapeHtml(
                        report?.notes ||
                        ""
                    )}</textarea>


                </div>


                <div class="admin-visit-report-section">


                    <span class="admin-visit-report-label">
                        Photos
                    </span>


                    <p class="admin-visit-report-help">
                        Add photos from today's visit.
                    </p>


                    ${
                        existingVisitPhotos.length

                            ? `

                                <div class="admin-visit-existing-media">

                                    ${existingVisitPhotos
                                        .map(
                                            item => `

                                                <div
                                                    class="admin-visit-media-preview admin-visit-saved-media"
                                                    data-saved-visit-media="${item.id}"
                                                >

                                                    ${
                                                        item.signed_url

                                                            ? `

                                                                <img
                                                                    src="${escapeHtml(
                                                                        item.signed_url
                                                                    )}"
                                                                    alt="Visit photo"
                                                                >

                                                            `

                                                            : `

                                                                <div class="admin-visit-media-missing">
                                                                    Photo
                                                                </div>

                                                            `
                                                    }


                                                    <button
                                                        type="button"
                                                        class="admin-visit-media-delete"
                                                        data-delete-visit-report-media="${item.id}"
                                                        aria-label="Delete visit photo"
                                                        title="Delete photo"
                                                    >
                                                        ×
                                                    </button>


                                                </div>

                                            `
                                        )
                                        .join("")}

                                </div>

                            `

                            : ""
                    }


                    <label class="admin-visit-media-upload-button">

                        + Add Photos

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            hidden
                            data-visit-report-photos
                        >

                    </label>


                    <div
                        class="admin-visit-pending-media"
                        data-pending-visit-photos
                    ></div>


                </div>


                <div class="admin-visit-report-section admin-walk-summary-section">


                    <div class="admin-walk-summary-heading">

                        <div>

                            <span class="admin-visit-report-label">
                                Walk Summary
                            </span>

                            <p class="admin-visit-report-help">
                                Automatically recorded by Paws in Stride.
                            </p>

                        </div>

                    </div>


                    ${
                        hasCompletedWalk

                            ? `

                                <div class="admin-walk-summary-card">


                                    <div class="admin-walk-summary-stats">


                                        <div class="admin-walk-summary-stat">

                                            <span class="admin-walk-summary-stat-label">
                                                Walk Time
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    walkDuration
                                                )}
                                            </strong>

                                        </div>


                                        <div class="admin-walk-summary-stat">

                                            <span class="admin-walk-summary-stat-label">
                                                Distance
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    walkMiles
                                                )} mi
                                            </strong>

                                        </div>


                                        <div class="admin-walk-summary-stat">

                                            <span class="admin-walk-summary-stat-label">
                                                Started
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    walkStartedAt ||
                                                    "—"
                                                )}
                                            </strong>

                                        </div>


                                        <div class="admin-walk-summary-stat">

                                            <span class="admin-walk-summary-stat-label">
                                                Finished
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    walkEndedAt ||
                                                    "—"
                                                )}
                                            </strong>

                                        </div>


                                    </div>


                                    <div
                                        class="admin-walk-route-map"
                                        id="admin-walk-route-map-${visit.id}"
                                        data-walk-route-map
                                        data-walk-id="${completedWalk.id}"
                                    >

                                        <div class="admin-walk-route-map-loading">

                                            <strong>
                                                🐾 Walk Route
                                            </strong>

                                            <span>
                                                Route map loading...
                                            </span>

                                        </div>

                                    </div>


                                    <div class="admin-walk-summary-branding">

                                        <span>
                                            🐾
                                        </span>

                                        <span>
                                            Recorded by Paws in Stride
                                        </span>

                                    </div>


                                </div>

                            `

                            : `

                                <div class="admin-walk-summary-empty">

                                    <strong>
                                        No recorded walk
                                    </strong>

                                    <span>
                                        A completed GPS-tracked walk will automatically appear here.
                                    </span>

                                </div>

                            `
                    }


                </div>


                <div class="admin-visit-report-footer">


                    <div
                        class="admin-visit-report-message"
                        data-visit-report-message
                    ></div>


                    <button
                        type="submit"
                        class="primary-button admin-save-visit-report-button"
                    >
                        ${
                            report
                                ? "Save Changes"
                                : "Save Visit Report"
                        }
                    </button>


                </div>


            </form>

        `;


    renderPendingVisitPhotos();

}


// ========================================
// DELETE SAVED VISIT REPORT MEDIA
// ========================================

async function deleteAdminVisitReportMedia(
    mediaId,
    button
) {


    const mediaItem =
        activeVisitReportMedia.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    mediaId
                )
        );


    if (
        !mediaItem
    ) {

        alert(
            "We couldn't find that photo."
        );

        return;

    }


    const mediaLabel =
        mediaItem.photo_type ===
        "route"

            ? "walk summary photo"

            : "visit photo";


    const confirmed =
        window.confirm(
            `Delete this ${mediaLabel}? This cannot be undone.`
        );


    if (
        !confirmed
    ) {

        return;

    }


    const originalButtonText =
        button?.textContent ||
        "×";


    if (
        button
    ) {

        button.disabled =
            true;


        button.textContent =
            "…";

    }


    try {


        // ========================================
        // DELETE DATABASE RECORD FIRST
        // ========================================

        const {
            error: databaseDeleteError
        } =
            await supabaseClient
                .from(
                    "visit_photos"
                )
                .delete()
                .eq(
                    "id",
                    mediaItem.id
                );


        if (
            databaseDeleteError
        ) {

            throw databaseDeleteError;

        }


        // ========================================
        // REMOVE FROM CURRENT ADMIN STATE
        // ========================================

        activeVisitReportMedia =
            activeVisitReportMedia.filter(
                item =>
                    Number(
                        item.id
                    ) !==
                    Number(
                        mediaItem.id
                    )
            );


        // ========================================
        // REMOVE PREVIEW IMMEDIATELY
        // ========================================

        const preview =
            button?.closest(
                "[data-saved-visit-media]"
            );


        if (
            preview
        ) {

            preview.remove();

        }


        // ========================================
        // DELETE STORAGE FILE
        // ========================================

        if (
            mediaItem.storage_path
        ) {


            const {
                error: storageDeleteError
            } =
                await supabaseClient
                    .storage
                    .from(
                        VISIT_MEDIA_BUCKET
                    )
                    .remove([
                        mediaItem.storage_path
                    ]);


            if (
                storageDeleteError
            ) {


                console.warn(
                    "Visit media storage cleanup failed:",
                    storageDeleteError
                );

            }

        }


    } catch (
        error
    ) {


        console.error(
            "Delete visit report media error:",
            error
        );


        alert(
            "We couldn't delete that photo. Please try again."
        );


        if (
            button
        ) {

            button.disabled =
                false;


            button.textContent =
                originalButtonText;

        }

    }

}

// ========================================
// HANDLE VISIT PHOTOS
// ========================================

function handleVisitReportPhotos(
    input
) {


    const files =
        Array.from(
            input.files ||
            []
        );


    if (
        files.length ===
        0
    ) {

        return;

    }


    const validFiles =
        [];


    for (
        const file of files
    ) {


        if (
            !ALLOWED_PHOTO_TYPES.includes(
                file.type
            )
        ) {


            alert(
                "Visit photos must be JPG, PNG, or WebP images."
            );


            continue;

        }


        if (
            file.size >
            MAX_VISIT_MEDIA_SIZE
        ) {


            alert(
                "Each visit photo must be 10 MB or smaller."
            );


            continue;

        }


        validFiles.push(
            file
        );

    }


    pendingVisitReportPhotos.push(
        ...validFiles
    );


    input.value =
        "";


    renderPendingVisitPhotos();

}


// ========================================
// RENDER PENDING VISIT PHOTOS
// ========================================

function renderPendingVisitPhotos() {


    const container =
        document.querySelector(
            "[data-pending-visit-photos]"
        );


    if (
        !container
    ) {

        return;

    }


    if (
        pendingVisitReportPhotos.length ===
        0
    ) {


        container.innerHTML =
            "";


        return;

    }


    container.innerHTML =
        pendingVisitReportPhotos
            .map(
                (
                    file,
                    index
                ) => `

                    <div class="admin-pending-media-item">

                        <span>
                            ${escapeHtml(
                                file.name
                            )}
                        </span>

                        <button
                            type="button"
                            class="admin-pending-media-remove"
                            data-remove-pending-visit-photo="${index}"
                            aria-label="Remove pending visit photo"
                            title="Remove photo"
                        >
                            ×
                        </button>

                    </div>

                `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-remove-pending-visit-photo]"
        )
        .forEach(
            button => {


                button.addEventListener(
                    "click",
                    () => {


                        const index =
                            Number(
                                button.dataset
                                    .removePendingVisitPhoto
                            );


                        if (
                            Number.isNaN(
                                index
                            )
                        ) {

                            return;

                        }


                        pendingVisitReportPhotos.splice(
                            index,
                            1
                        );


                        renderPendingVisitPhotos();

                    }
                );

            }
        );

}


// ========================================
// AUTOMATIC WALK SUMMARY
// ========================================
//
// Walk statistics and route data now come
// directly from visit_walks and
// visit_walk_points.
//
// Manual Walk Summary photo uploads are
// no longer used.
// ========================================



// ========================================
// SAVE VISIT REPORT
// ========================================

async function saveAdminVisitReport(
    form
) {


    const visitId =
        Number(
            form.dataset.visitId
        );


    if (
        !visitId
    ) {

        return;

    }


    const saveButton =
        form.querySelector(
            ".admin-save-visit-report-button"
        );


    const message =
        form.querySelector(
            "[data-visit-report-message]"
        );


    saveButton.disabled =
        true;


    saveButton.textContent =
        "Saving...";


    message.textContent =
        "";


    try {


        // ========================================
        // COLLECT PER-PET CARE
        // ========================================

        const petCare =
            Array.from(
                form.querySelectorAll(
                    "[data-pet-care-card]"
                )
            )
                .map(
                    card => {


                        const petId =
                            Number(
                                card.dataset.petId
                            );


                        if (
                            !Number.isFinite(
                                petId
                            ) ||
                            petId <=
                            0
                        ) {

                            return null;

                        }


                        return {

                            pet_id:
                                petId,

                            fed:
                                Boolean(
                                    card.querySelector(
                                        '[data-pet-care-field="fed"]'
                                    )?.checked
                                ),

                            fresh_water:
                                Boolean(
                                    card.querySelector(
                                        '[data-pet-care-field="fresh_water"]'
                                    )?.checked
                                ),

                            pee:
                                Boolean(
                                    card.querySelector(
                                        '[data-pet-care-field="pee"]'
                                    )?.checked
                                ),

                            poop:
                                Boolean(
                                    card.querySelector(
                                        '[data-pet-care-field="poop"]'
                                    )?.checked
                                )

                        };

                    }
                )
                .filter(
                    Boolean
                );


        // ========================================
        // LEGACY AGGREGATE CARE
        // TEMPORARY CLIENT COMPATIBILITY
        // ========================================

        const aggregateFed =
            petCare.some(
                item =>
                    item.fed
            );


        const aggregateFreshWater =
            petCare.some(
                item =>
                    item.fresh_water
            );


        const aggregatePee =
            petCare.some(
                item =>
                    item.pee
            );


        const aggregatePoop =
            petCare.some(
                item =>
                    item.poop
            );


        // ========================================
        // SAVE OVERALL VISIT REPORT
        // ========================================

        const payload = {

            visit_id:
                visitId,

            created_by:
                currentUser.id,

            notes:
                String(
                    form.elements.notes?.value ||
                    ""
                )
                    .trim() ||
                null,

            fed:
                aggregateFed,

            fresh_water:
                aggregateFreshWater,

            pee:
                aggregatePee,

            poop:
                aggregatePoop,

            updated_at:
                new Date()
                    .toISOString()

        };


        const {
            data: savedReport,
            error: reportError
        } =
            await supabaseClient
                .from(
                    "visit_reports"
                )
                .upsert(
                    payload,
                    {
                        onConflict:
                            "visit_id"
                    }
                )
                .select("*")
                .single();


        if (
            reportError
        ) {

            throw reportError;

        }


        // ========================================
        // SAVE PER-PET CARE
        // ========================================

        if (
            petCare.length >
            0
        ) {


            const petCareRows =
                petCare.map(
                    item => ({

                        visit_report_id:
                            savedReport.id,

                        pet_id:
                            item.pet_id,

                        fed:
                            item.fed,

                        fresh_water:
                            item.fresh_water,

                        pee:
                            item.pee,

                        poop:
                            item.poop

                    })
                );


            const {
                error: petCareError
            } =
                await supabaseClient
                    .from(
                        "visit_report_pet_care"
                    )
                    .upsert(
                        petCareRows,
                        {
                            onConflict:
                                "visit_report_id,pet_id"
                        }
                    );


            if (
                petCareError
            ) {

                throw petCareError;

            }

        }


        // ========================================
        // UPLOAD NORMAL VISIT PHOTOS
        // ========================================

        for (
            let index = 0;
            index <
            pendingVisitReportPhotos.length;
            index++
        ) {


            const file =
                pendingVisitReportPhotos[
                    index
                ];


            await uploadVisitReportMedia(
                visitId,
                file,
                "visit",
                index
            );

        }


        // ========================================
        // UPDATE LOCAL VISIT REPORT STATE
        // ========================================

        const existingIndex =
            allVisitReports.findIndex(
                report =>
                    Number(
                        report.visit_id
                    ) ===
                    Number(
                        visitId
                    )
            );


        if (
            existingIndex >=
            0
        ) {


            allVisitReports[
                existingIndex
            ] =
                savedReport;

        } else {


            allVisitReports.push(
                savedReport
            );

        }


        pendingVisitReportPhotos =
            [];


        message.textContent =
            "Visit report saved ✓";


        saveButton.textContent =
            "Saved ✓";


        setTimeout(
            () => {


                closeAdminVisitReport();


                renderAdminDayServices();

            },
            700
        );


    } catch (
        error
    ) {


        console.error(
            "Visit report save error:",
            error
        );


        message.textContent =
            "We couldn't save this visit report.";


        saveButton.disabled =
            false;


        saveButton.textContent =
            "Save Visit Report";

    }

}


// ========================================
// UPLOAD NORMAL VISIT PHOTO
// ========================================

async function uploadVisitReportMedia(
    visitId,
    file,
    photoType,
    sortOrder
) {


    const extension =
        getFileExtensionForMime(
            file.type
        );


    const storagePath =
        `${visitId}/${photoType}-${crypto.randomUUID()}.${extension}`;


    const {
        error: uploadError
    } =
        await supabaseClient
            .storage
            .from(
                VISIT_MEDIA_BUCKET
            )
            .upload(
                storagePath,
                file,
                {
                    contentType:
                        file.type,

                    cacheControl:
                        "3600",

                    upsert:
                        false
                }
            );


    if (
        uploadError
    ) {

        throw uploadError;

    }


    const {
        error: databaseError
    } =
        await supabaseClient
            .from("visit_photos")
            .insert({

                visit_id:
                    visitId,

                storage_path:
                    storagePath,

                photo_type:
                    photoType,

                sort_order:
                    sortOrder

            });


    if (
        databaseError
    ) {


        await supabaseClient
            .storage
            .from(
                VISIT_MEDIA_BUCKET
            )
            .remove([
                storagePath
            ]);


        throw databaseError;

    }

}

// ========================================
// VISIT DURATION
// ========================================

function getVisitDurationMinutes(
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
// FORMAT VISIT TIME
// ========================================

function formatVisitTimestamp(
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
        Number(
            a.id
        ) -
        Number(
            b.id
        )
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
// ADMIN PUSH NOTIFICATIONS
// ========================================

const ADMIN_VAPID_PUBLIC_KEY =
    "BJMZyLb__6L55n-7l1SB3H97mQDGkUXiudH4X9EQMjqO2Do7jIGtS9Gu-gxkIZ5sMxrfLsCo5EaWpGb6kRi5_DA";


// ========================================
// CONVERT BASE64URL TO UINT8ARRAY
// ========================================

function adminUrlBase64ToUint8Array(
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
// SAVE ADMIN PUSH SUBSCRIPTION
// ========================================

async function saveAdminPushSubscription(
    subscription
) {

    if (
        !currentUser?.id
    ) {

        console.error(
            "No authenticated admin user is available for push registration."
        );

        return;

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

        console.error(
            "Admin push subscription information is incomplete."
        );

        return;

    }


    // ========================================
    // CLAIM THIS DEVICE FOR CURRENT USER
    // ========================================
    //
    // The database derives user_id from
    // auth.uid(). This also safely transfers
    // an existing PWA endpoint when another
    // account signs into this installation.
    // ========================================

    const {
        data:
            subscriptionId,

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
            "Admin push subscription claim error:",
            error
        );


        return;

    }


    console.log(
        "Admin push subscription claimed:",
        subscriptionId
    );

}

// ========================================
// ENSURE ADMIN PUSH SUBSCRIPTION
// ========================================

async function ensureAdminPushSubscription() {

    if (
        !(
            "serviceWorker" in navigator
        ) ||
        !(
            "PushManager" in window
        ) ||
        !(
            "Notification" in window
        )
    ) {

        return;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        return;

    }


    try {

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

            subscription =
                await registration
                    .pushManager
                    .subscribe(
                        {
                            userVisibleOnly:
                                true,

                            applicationServerKey:
                                adminUrlBase64ToUint8Array(
                                    ADMIN_VAPID_PUBLIC_KEY
                                )
                        }
                    );

        }


        await saveAdminPushSubscription(
            subscription
        );

    }
    catch (error) {

        console.error(
            "Admin push setup error:",
            error
        );

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
// ADMIN MESSAGING
// ========================================

let adminConversations =
    [];

let adminConversationMessages =
    [];

let activeAdminConversationId =
    null;

let adminMessageChannel =
    null;

let adminMessagingInitialized =
    false;


// ========================================
// INITIALIZE ADMIN MESSAGING
// ========================================

async function initializeAdminMessaging() {

    if (
        adminMessagingInitialized ||
        !currentUser
    ) {
        return;
    }


    adminMessagingInitialized =
        true;


    setupAdminMessageEvents();


    try {

        await loadAdminConversations();

        subscribeToAdminMessages();

    } catch (error) {

        console.error(
            "Admin messaging initialization error:",
            error
        );


        showAdminMessageError(
            "Messages are temporarily unavailable."
        );

    }

}


// ========================================
// LOAD ADMIN CONVERSATIONS
// ========================================

async function loadAdminConversations() {

    const {
        data: conversations,
        error: conversationError
    } =
        await supabaseClient
            .from("conversations")
            .select("*")
            .order(
                "last_message_at",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );


    if (conversationError) {

        throw conversationError;

    }


    const conversationData =
        conversations ||
        [];


    if (
        conversationData.length ===
        0
    ) {

        adminConversations =
            [];

        renderAdminConversationList();

        updateAdminMessageUnreadBadge();

        return;

    }


    const clientIds =
        [
            ...new Set(
                conversationData
                    .map(
                        conversation =>
                            conversation.client_id
                    )
                    .filter(Boolean)
            )
        ];


    const conversationIds =
        conversationData.map(
            conversation =>
                conversation.id
        );


    const [
        profilesResult,
        messagesResult
    ] =
        await Promise.all([

            supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, email, phone"
                )
                .in(
                    "id",
                    clientIds
                ),

            supabaseClient
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
                .in(
                    "conversation_id",
                    conversationIds
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )

        ]);


    if (profilesResult.error) {

        throw profilesResult.error;

    }


    if (messagesResult.error) {

        throw messagesResult.error;

    }


    const profiles =
        profilesResult.data ||
        [];


    const messages =
        messagesResult.data ||
        [];


    adminConversations =
        conversationData
            .map(
                conversation => {

                    const client =
                        profiles.find(
                            profile =>
                                profile.id ===
                                conversation.client_id
                        ) ||
                        null;


                    const conversationMessages =
                        messages.filter(
                            message =>
                                Number(
                                    message.conversation_id
                                ) ===
                                Number(
                                    conversation.id
                                )
                        );


                    const latestMessage =
                        conversationMessages[0] ||
                        null;


                    const unreadCount =
                        conversationMessages.filter(
                            message =>
                                message.sender_id !==
                                    currentUser.id &&
                                !message.read_at
                        )
                        .length;


                    return {

                        ...conversation,

                        client,

                        latestMessage,

                        unreadCount

                    };

                }
            )
            .sort(
                compareAdminConversations
            );


    renderAdminConversationList();

    updateAdminMessageUnreadBadge();

}


// ========================================
// COMPARE ADMIN CONVERSATIONS
// ========================================

function compareAdminConversations(
    conversationA,
    conversationB
) {

    const timeA =
        conversationA.last_message_at ||
        conversationA.latestMessage
            ?.created_at ||
        conversationA.created_at ||
        "";


    const timeB =
        conversationB.last_message_at ||
        conversationB.latestMessage
            ?.created_at ||
        conversationB.created_at ||
        "";


    return (
        new Date(timeB) -
        new Date(timeA)
    );

}


// ========================================
// ADMIN MESSAGE EVENTS
// ========================================

function setupAdminMessageEvents() {

    const launcher =
        document.getElementById(
            "admin-message-launcher"
        );

    const closeButton =
        document.getElementById(
            "admin-message-close"
        );

    const backdrop =
        document.getElementById(
            "admin-message-backdrop"
        );

    const conversationList =
        document.getElementById(
            "admin-conversation-list"
        );

    const form =
        document.getElementById(
            "admin-message-form"
        );

    const input =
        document.getElementById(
            "admin-message-input"
        );

    const mobileBack =
        document.getElementById(
            "admin-message-mobile-back"
        );


    launcher
        ?.addEventListener(
            "click",
            openAdminMessaging
        );


    closeButton
        ?.addEventListener(
            "click",
            closeAdminMessaging
        );


    backdrop
        ?.addEventListener(
            "click",
            closeAdminMessaging
        );


    conversationList
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-admin-conversation]"
                    );


                if (!button) {
                    return;
                }


                const conversationId =
                    Number(
                        button.dataset
                            .adminConversation
                    );


                if (!conversationId) {
                    return;
                }


                openAdminConversation(
                    conversationId
                );

            }
        );


    form
        ?.addEventListener(
            "submit",
            sendAdminMessage
        );


    input
        ?.addEventListener(
            "input",
            autoResizeAdminMessageInput
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


    mobileBack
        ?.addEventListener(
            "click",
            showAdminMessageInbox
        );


    document
        .addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeAdminMessaging();

                }

            }
        );

}


// ========================================
// OPEN ADMIN MESSAGING
// ========================================

function openAdminMessaging() {

    const drawer =
        document.getElementById(
            "admin-message-drawer"
        );

    const launcher =
        document.getElementById(
            "admin-message-launcher"
        );

    const backdrop =
        document.getElementById(
            "admin-message-backdrop"
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
        "admin-messaging-open"
    );


    if (
        activeAdminConversationId
    ) {

        scrollAdminMessagesToBottom();

    }

}


// ========================================
// CLOSE ADMIN MESSAGING
// ========================================

function closeAdminMessaging() {

    const drawer =
        document.getElementById(
            "admin-message-drawer"
        );

    const launcher =
        document.getElementById(
            "admin-message-launcher"
        );

    const backdrop =
        document.getElementById(
            "admin-message-backdrop"
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
        "admin-messaging-open"
    );

}


// ========================================
// RENDER ADMIN CONVERSATION LIST
// ========================================

function renderAdminConversationList() {

    const list =
        document.getElementById(
            "admin-conversation-list"
        );

    const count =
        document.getElementById(
            "admin-message-inbox-count"
        );


    if (
        !list ||
        !count
    ) {
        return;
    }


    count.textContent =
        `${adminConversations.length} ${

            adminConversations.length ===
            1

                ? "conversation"

                : "conversations"

        }`;


    list.innerHTML =
        "";


    if (
        adminConversations.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "admin-message-empty";


        empty.textContent =
            "No client conversations yet.";


        list.appendChild(
            empty
        );


        return;

    }


    adminConversations
        .forEach(
            conversation => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "admin-conversation-item";


                if (
                    Number(
                        activeAdminConversationId
                    ) ===
                    Number(
                        conversation.id
                    )
                ) {

                    button.classList.add(
                        "is-active"
                    );

                }


                if (
                    conversation.unreadCount >
                    0
                ) {

                    button.classList.add(
                        "has-unread"
                    );

                }


                button.dataset
                    .adminConversation =
                    conversation.id;


                const top =
                    document.createElement(
                        "div"
                    );


                top.className =
                    "admin-conversation-item-top";


                const name =
                    document.createElement(
                        "strong"
                    );


                name.textContent =
                    conversation.client
                        ?.full_name ||
                    conversation.client
                        ?.email ||
                    "Client";


                top.appendChild(
                    name
                );


                if (
                    conversation.unreadCount >
                    0
                ) {

                    const badge =
                        document.createElement(
                            "span"
                        );


                    badge.className =
                        "admin-conversation-unread";


                    badge.textContent =
                        conversation.unreadCount >
                        99

                            ? "99+"

                            : String(
                                conversation.unreadCount
                            );


                    top.appendChild(
                        badge
                    );

                }


                const preview =
                    document.createElement(
                        "span"
                    );


                preview.className =
                    "admin-conversation-preview";


                preview.textContent =
                    conversation.latestMessage
                        ?.body ||
                    "No messages yet";


                const time =
                    document.createElement(
                        "span"
                    );


                time.className =
                    "admin-conversation-time";


                time.textContent =
                    formatAdminMessageTime(
                        conversation.latestMessage
                            ?.created_at ||
                        conversation.last_message_at ||
                        conversation.created_at
                    );


                button.append(
                    top,
                    preview,
                    time
                );


                list.appendChild(
                    button
                );

            }
        );

}


// ========================================
// OPEN ADMIN CONVERSATION
// ========================================

async function openAdminConversation(
    conversationId
) {

    const conversation =
        adminConversations.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    conversationId
                )
        );


    if (!conversation) {
        return;
    }


    activeAdminConversationId =
        Number(
            conversationId
        );


    renderAdminConversationList();


    const name =
        document.getElementById(
            "admin-message-client-name"
        );

    const detail =
        document.getElementById(
            "admin-message-client-detail"
        );

    const form =
        document.getElementById(
            "admin-message-form"
        );

    const list =
        document.getElementById(
            "admin-message-list"
        );


    if (name) {

        name.textContent =
            conversation.client
                ?.full_name ||
            conversation.client
                ?.email ||
            "Client";

    }


    if (detail) {

        detail.textContent =
            conversation.client
                ?.phone ||
            conversation.client
                ?.email ||
            "Paws in Stride client";

    }


    if (form) {

        form.style.display =
            "flex";

    }


    if (list) {

        list.innerHTML =
            `

                <div class="admin-message-loading">
                    Loading messages...
                </div>

            `;

    }


    document
        .getElementById(
            "admin-message-drawer"
        )
        ?.classList
        .add(
            "conversation-open"
        );


    try {

        await loadActiveAdminMessages();

        await markAdminMessagesRead();

    } catch (error) {

        console.error(
            "Open admin conversation error:",
            error
        );


        showAdminMessageError(
            "We couldn't load this conversation."
        );

    }

}


// ========================================
// LOAD ACTIVE ADMIN MESSAGES
// ========================================

async function loadActiveAdminMessages() {

    if (
        !activeAdminConversationId
    ) {
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
                activeAdminConversationId
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


    adminConversationMessages =
        data ||
        [];


    renderActiveAdminMessages();

}


// ========================================
// RENDER ACTIVE ADMIN MESSAGES
// ========================================

function renderActiveAdminMessages() {

    const list =
        document.getElementById(
            "admin-message-list"
        );


    if (!list) {
        return;
    }


    list.innerHTML =
        "";


    if (
        adminConversationMessages.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "admin-message-empty";


        empty.textContent =
            "No messages in this conversation yet.";


        list.appendChild(
            empty
        );


        return;

    }


    const conversation =
        adminConversations.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    activeAdminConversationId
                )
        );


    const clientId =
        conversation
            ?.client_id;


    adminConversationMessages
        .forEach(
            message => {

                const sentByAdmin =
                    message.sender_id ===
                    currentUser.id;


                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    `admin-message-row ${
                        sentByAdmin
                            ? "is-admin"
                            : "is-client"
                    }`;


                const sender =
                    document.createElement(
                        "div"
                    );


                sender.className =
                    "admin-message-sender";


                sender.textContent =
                    sentByAdmin
                        ? "You"
                        : (
                            conversation
                                ?.client
                                ?.full_name ||
                            "Client"
                        );


                const bubble =
                    document.createElement(
                        "div"
                    );


                bubble.className =
                    "admin-message-bubble";


                bubble.textContent =
                    message.body;


                const time =
                    document.createElement(
                        "div"
                    );


                time.className =
                    "admin-message-time";


                time.textContent =
                    formatAdminMessageTime(
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


    scrollAdminMessagesToBottom();

}


// ========================================
// SEND ADMIN MESSAGE
// ========================================

async function sendAdminMessage(
    event
) {

    event.preventDefault();


    if (
        !currentUser ||
        !activeAdminConversationId
    ) {
        return;
    }


    const input =
        document.getElementById(
            "admin-message-input"
        );

    const sendButton =
        document.getElementById(
            "admin-message-send"
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

        showAdminMessageError(
            "Messages cannot be longer than 5,000 characters."
        );

        return;

    }


    clearAdminMessageError();


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
                        activeAdminConversationId,

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


        addAdminMessageIfMissing(
            data
        );


        if (input) {

            input.value =
                "";

            input.style.height =
                "";

            input.focus();

        }


        renderActiveAdminMessages();


        await loadAdminConversations();

    } catch (error) {

        console.error(
            "Send admin message error:",
            error
        );


        showAdminMessageError(
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
// REALTIME ADMIN MESSAGES
// ========================================

function subscribeToAdminMessages() {

    if (
        adminMessageChannel
    ) {
        return;
    }


    adminMessageChannel =
        supabaseClient
            .channel(
                "admin-client-messages"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "messages"
                },
                async payload => {

                    const newMessage =
                        payload.new;


                    if (
                        Number(
                            newMessage
                                .conversation_id
                        ) ===
                        Number(
                            activeAdminConversationId
                        )
                    ) {

                        addAdminMessageIfMissing(
                            newMessage
                        );


                        renderActiveAdminMessages();


                        const drawer =
                            document.getElementById(
                                "admin-message-drawer"
                            );


                        if (
                            drawer
                                ?.classList
                                .contains(
                                    "is-open"
                                ) &&
                            newMessage.sender_id !==
                                currentUser.id
                        ) {

                            await markAdminMessagesRead();

                        }

                    }


                    await loadAdminConversations();

                }
            )
            .subscribe();

}


// ========================================
// ADD ADMIN MESSAGE IF MISSING
// ========================================

function addAdminMessageIfMissing(
    message
) {

    if (!message) {
        return;
    }


    const exists =
        adminConversationMessages.some(
            existingMessage =>
                Number(
                    existingMessage.id
                ) ===
                Number(
                    message.id
                )
        );


    if (exists) {
        return;
    }


    adminConversationMessages.push(
        message
    );


    adminConversationMessages.sort(
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
// MARK ADMIN MESSAGES READ
// ========================================

async function markAdminMessagesRead() {

    if (
        !activeAdminConversationId ||
        !currentUser
    ) {
        return;
    }


    const unreadMessages =
        adminConversationMessages.filter(
            message =>
                message.sender_id !==
                    currentUser.id &&
                !message.read_at
        );


    if (
        unreadMessages.length ===
        0
    ) {

        updateAdminMessageUnreadBadge();

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
                activeAdminConversationId
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
            "Mark admin messages read error:",
            error
        );

        return;

    }


    adminConversationMessages =
        adminConversationMessages.map(
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


    const conversation =
        adminConversations.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    activeAdminConversationId
                )
        );


    if (conversation) {

        conversation.unreadCount =
            0;

    }


    renderAdminConversationList();

    updateAdminMessageUnreadBadge();

}


// ========================================
// ADMIN UNREAD BADGE
// ========================================

function updateAdminMessageUnreadBadge() {

    const badge =
        document.getElementById(
            "admin-message-unread-badge"
        );


    if (!badge) {
        return;
    }


    const unreadCount =
        adminConversations.reduce(
            (
                total,
                conversation
            ) =>
                total +
                (
                    conversation
                        .unreadCount ||
                    0
                ),
            0
        );


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
// SHOW ADMIN MESSAGE INBOX
// ========================================

function showAdminMessageInbox() {

    document
        .getElementById(
            "admin-message-drawer"
        )
        ?.classList
        .remove(
            "conversation-open"
        );

}


// ========================================
// FORMAT ADMIN MESSAGE TIME
// ========================================

function formatAdminMessageTime(
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
// AUTO RESIZE ADMIN MESSAGE INPUT
// ========================================

function autoResizeAdminMessageInput(
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
// SCROLL ADMIN MESSAGES
// ========================================

function scrollAdminMessagesToBottom() {

    const list =
        document.getElementById(
            "admin-message-list"
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
// ADMIN MESSAGE ERROR
// ========================================

function showAdminMessageError(
    message
) {

    const errorElement =
        document.getElementById(
            "admin-message-error"
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
// CLEAR ADMIN MESSAGE ERROR
// ========================================

function clearAdminMessageError() {

    const errorElement =
        document.getElementById(
            "admin-message-error"
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
// TODAY SUMMARY FORMAT
// ========================================

function formatAdminSummaryDuration(
    totalSeconds
) {

    const safeSeconds =
        Math.max(
            0,
            Math.floor(
                Number(
                    totalSeconds ||
                    0
                )
            )
        );


    const hours =
        Math.floor(
            safeSeconds /
            3600
        );


    const minutes =
        Math.floor(
            (
                safeSeconds %
                3600
            ) /
            60
        );


    if (
        hours >
        0
    ) {

        return `${hours}h ${minutes}m`;

    }


    return `${minutes}m`;

}


// ========================================
// RENDER TODAY SUMMARY
// ========================================

function renderAdminTodaySummary() {


    const totalVisitsElement =
        document.getElementById(
            "admin-summary-total-visits"
        );


    if (
        !totalVisitsElement
    ) {

        return;

    }


    // ========================================
    // TODAY
    // ========================================

    const today =
        getLocalDateString();


    const now =
        Date.now();


    const dateElement =
        document.getElementById(
            "admin-today-date"
        );


    if (
        dateElement
    ) {

        dateElement.textContent =
            new Date(
                `${today}T12:00:00`
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


    // ========================================
    // TODAY'S VISITS
    // ========================================

    const todayVisits =
        allVisits.filter(
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
                        today &&
                    status !==
                        "cancelled"
                );

            }
        );


    totalVisitsElement.textContent =
        todayVisits.length;


    // ========================================
    // SERVICE BREAKDOWN
    // ========================================

    let walkCount =
        0;


    let dropInCount =
        0;


    let otherCount =
        0;


    todayVisits.forEach(
        visit => {

            const serviceName =
                String(
                    visit.service_name ||
                    visit.service_type ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                serviceName.includes(
                    "walk"
                )
            ) {

                walkCount +=
                    1;


                return;

            }


            if (
                serviceName.includes(
                    "drop"
                ) ||
                serviceName.includes(
                    "check-in"
                ) ||
                serviceName.includes(
                    "check in"
                )
            ) {

                dropInCount +=
                    1;


                return;

            }


            otherCount +=
                1;

        }
    );


    const serviceParts =
        [];


    if (
        walkCount >
        0
    ) {

        serviceParts.push(
            `${walkCount} ${
                walkCount ===
                1

                    ? "walk"

                    : "walks"
            }`
        );

    }


    if (
        dropInCount >
        0
    ) {

        serviceParts.push(
            `${dropInCount} ${
                dropInCount ===
                1

                    ? "drop-in"

                    : "drop-ins"
            }`
        );

    }


    if (
        otherCount >
        0
    ) {

        serviceParts.push(
            `${otherCount} other ${
                otherCount ===
                1

                    ? "service"

                    : "services"
            }`
        );

    }


    const serviceBreakdownElement =
        document.getElementById(
            "admin-summary-service-breakdown"
        );


    if (
        serviceBreakdownElement
    ) {

        serviceBreakdownElement.textContent =
            serviceParts.length >
            0

                ? serviceParts.join(
                    " • "
                )

                : "No services scheduled";

    }


    // ========================================
    // VISIT PROGRESS
    // ========================================

    let completedVisits =
        0;


    let inProgressVisits =
        0;


    let remainingVisits =
        0;


    let totalVisitSeconds =
        0;


    todayVisits.forEach(
        visit => {

            const progress =
                getVisitProgressInfo(
                    visit
                );


            if (
                progress.state ===
                "completed"
            ) {

                completedVisits +=
                    1;

            } else if (
                progress.state ===
                "checked_in"
            ) {

                inProgressVisits +=
                    1;

            } else {

                remainingVisits +=
                    1;

            }


            // ========================================
            // VISIT TIME
            // ========================================

            if (
                !progress.checkedInAt
            ) {

                return;

            }


            const startedAt =
                new Date(
                    progress.checkedInAt
                )
                    .getTime();


            if (
                !Number.isFinite(
                    startedAt
                )
            ) {

                return;

            }


            let endedAt =
                null;


            if (
                progress.state ===
                "completed" &&
                progress.completedAt
            ) {

                endedAt =
                    new Date(
                        progress.completedAt
                    )
                        .getTime();

            } else if (
                progress.state ===
                "checked_in"
            ) {

                endedAt =
                    now;

            }


            if (
                !Number.isFinite(
                    endedAt
                ) ||
                endedAt <
                    startedAt
            ) {

                return;

            }


            totalVisitSeconds +=
                Math.floor(
                    (
                        endedAt -
                        startedAt
                    ) /
                    1000
                );

        }
    );


    const completedElement =
        document.getElementById(
            "admin-summary-completed-visits"
        );


    const inProgressElement =
        document.getElementById(
            "admin-summary-in-progress-visits"
        );


    const remainingElement =
        document.getElementById(
            "admin-summary-remaining-visits"
        );


    const visitTimeElement =
        document.getElementById(
            "admin-summary-visit-time"
        );


    if (
        completedElement
    ) {

        completedElement.textContent =
            `${completedVisits} / ${todayVisits.length}`;

    }


    if (
        inProgressElement
    ) {

        inProgressElement.textContent =
            inProgressVisits;

    }


    if (
        remainingElement
    ) {

        remainingElement.textContent =
            remainingVisits;

    }


    if (
        visitTimeElement
    ) {

        visitTimeElement.textContent =
            formatAdminSummaryDuration(
                totalVisitSeconds
            );

    }


    // ========================================
    // TODAY'S WALK DATA
    // ========================================

    const todayVisitIds =
        new Set(
            todayVisits.map(
                visit =>
                    Number(
                        visit.id
                    )
            )
        );


    const walksByVisit =
        new Map();


    allVisitWalks.forEach(
        walk => {

            const visitId =
                Number(
                    walk.visit_id
                );


            if (
                !todayVisitIds.has(
                    visitId
                )
            ) {

                return;

            }


            const existingWalk =
                walksByVisit.get(
                    visitId
                );


            if (
                !existingWalk
            ) {

                walksByVisit.set(
                    visitId,
                    walk
                );


                return;

            }


            const existingStatus =
                String(
                    existingWalk.status ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const nextStatus =
                String(
                    walk.status ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                existingStatus !==
                    "completed" &&
                nextStatus ===
                    "completed"
            ) {

                walksByVisit.set(
                    visitId,
                    walk
                );

            }

        }
    );


    let totalWalkSeconds =
        0;


    let totalWalkDistanceMeters =
        0;


    walksByVisit.forEach(
        walk => {

            const walkStatus =
                String(
                    walk.status ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            let distanceMeters =
                Number(
                    walk.distance_meters ||
                    0
                );


            let durationSeconds =
                Number(
                    walk.duration_seconds ||
                    0
                );


            const isActiveTracker =
                activeWalkGpsTracker &&
                Number(
                    activeWalkGpsTracker.walkId
                ) ===
                Number(
                    walk.id
                );


            if (
                isActiveTracker
            ) {

                distanceMeters =
                    Math.max(
                        distanceMeters,
                        Number(
                            activeWalkGpsTracker
                                .distanceMeters ||
                            0
                        )
                    );


                durationSeconds =
                    Math.max(
                        durationSeconds,
                        Math.floor(
                            (
                                now -
                                activeWalkGpsTracker
                                    .startedAt
                            ) /
                            1000
                        )
                    );

            } else if (
                walkStatus ===
                    "in_progress" &&
                walk.started_at
            ) {

                const walkStartedAt =
                    new Date(
                        walk.started_at
                    )
                        .getTime();


                if (
                    Number.isFinite(
                        walkStartedAt
                    ) &&
                    now >=
                        walkStartedAt
                ) {

                    durationSeconds =
                        Math.max(
                            durationSeconds,
                            Math.floor(
                                (
                                    now -
                                    walkStartedAt
                                ) /
                                1000
                            )
                        );

                }

            }


            totalWalkDistanceMeters +=
                Math.max(
                    0,
                    distanceMeters
                );


            totalWalkSeconds +=
                Math.max(
                    0,
                    durationSeconds
                );

        }
    );


    const walkDistanceElement =
        document.getElementById(
            "admin-summary-walk-distance"
        );


    const walkTimeElement =
        document.getElementById(
            "admin-summary-walk-time"
        );


    if (
        walkDistanceElement
    ) {

        walkDistanceElement.textContent =
            `${
                (
                    totalWalkDistanceMeters /
                    1609.344
                )
                    .toFixed(
                        2
                    )
            } mi`;

    }


    if (
        walkTimeElement
    ) {

        walkTimeElement.textContent =
            formatAdminSummaryDuration(
                totalWalkSeconds
            );

    }

}


// ========================================
// RENDER NEEDS ATTENTION
// ========================================

function renderAdminNeedsAttention() {


    const section =
        document.getElementById(
            "admin-needs-attention"
        );


    const list =
        document.getElementById(
            "admin-needs-attention-list"
        );


    const countElement =
        document.getElementById(
            "admin-needs-attention-count"
        );


    if (
        !section ||
        !list ||
        !countElement
    ) {

        return;

    }


    const today =
        getLocalDateString();


    // ========================================
    // COMPLETED VISITS MISSING REPORTS
    // ========================================

    const missingReportVisits =
        allVisits
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
                        visit.visit_date !==
                            today ||
                        status ===
                            "cancelled"
                    ) {

                        return false;

                    }


                    const progress =
                        getVisitProgressInfo(
                            visit
                        );


                    if (
                        progress.state !==
                        "completed"
                    ) {

                        return false;

                    }


                    const hasReport =
                        allVisitReports.some(
                            report =>
                                Number(
                                    report.visit_id
                                ) ===
                                Number(
                                    visit.id
                                )
                        );


                    return !hasReport;

                }
            )
            .sort(
                compareAdminVisits
            );


    // ========================================
    // NOTHING NEEDS ATTENTION
    // ========================================

    if (
        missingReportVisits.length ===
        0
    ) {

        section.hidden =
            true;


        countElement.textContent =
            "0";


        list.innerHTML =
            "";


        return;

    }


    // ========================================
    // SHOW ACTION CENTER
    // ========================================

    section.hidden =
        false;


    countElement.textContent =
        missingReportVisits.length;


    list.innerHTML =
        missingReportVisits
            .map(
                visit => {


                    const client =
                        allProfiles.find(
                            profile =>
                                profile.id ===
                                visit.client_id
                        );


                    const clientName =
                        client?.full_name ||
                        client?.email ||
                        "Client";


                    const serviceName =
                        visit.service_name ||
                        visit.service_type ||
                        "Service";


                    const timeWindow =
                        visit.time_window ||
                        "Time not set";


                    return `

                        <article class="admin-attention-item">


                            <div class="admin-attention-item-main">


                                <span class="admin-attention-item-icon">

                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path d="M6 3h9l3 3v15H6z"></path>
                                        <path d="M9 11h6"></path>
                                        <path d="M9 15h6"></path>
                                        <path d="M9 7h3"></path>
                                    </svg>

                                </span>


                                <div class="admin-attention-item-copy">

                                    <strong>
                                        Visit report needed
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            clientName
                                        )}
                                        •
                                        ${escapeHtml(
                                            serviceName
                                        )}
                                        •
                                        ${escapeHtml(
                                            timeWindow
                                        )}
                                    </span>

                                </div>


                            </div>


                            <button
                                type="button"
                                class="admin-attention-action"
                                data-admin-attention-action="visit-report"
                                data-visit-id="${visit.id}"
                                data-visit-date="${escapeHtml(
                                    visit.visit_date
                                )}"
                            >
                                Add Report
                            </button>


                        </article>

                    `;

                }
            )
            .join("");

}

// ========================================
// NEEDS ATTENTION ACTIONS
// ========================================

const adminNeedsAttentionList =
    document.getElementById(
        "admin-needs-attention-list"
    );


adminNeedsAttentionList
    ?.addEventListener(
        "click",
        async event => {


            const button =
                event.target.closest(
                    "[data-admin-attention-action]"
                );


            if (
                !button
            ) {

                return;

            }


            const action =
                button.dataset
                    .adminAttentionAction;


            const visitId =
                Number(
                    button.dataset
                        .visitId
                );


            const visitDate =
                button.dataset
                    .visitDate;


            if (
                action !==
                    "visit-report" ||
                !visitId ||
                !visitDate
            ) {

                return;

            }


            // ========================================
            // MOVE CALENDAR TO VISIT DATE
            // ========================================

            const visitDateObject =
                parseLocalDate(
                    visitDate
                );


            selectedAdminDate =
                visitDate;


            adminCalendarYear =
                visitDateObject
                    .getFullYear();


            adminCalendarMonth =
                visitDateObject
                    .getMonth();


            // ========================================
            // OPEN SCHEDULE SCREEN
            // ========================================

            showAdminAppScreen(
                "schedule"
            );


            // ========================================
            // OPEN VISIT REPORT
            // ========================================

            await openAdminVisitReport(
                visitId
            );


            // ========================================
            // SCROLL REPORT INTO VIEW
            // ========================================

            const reportMount =
                document.getElementById(
                    `admin-visit-report-${visitId}`
                );


            reportMount
                ?.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "center"
                });


        }
    );


// ========================================
// FINANCIAL SNAPSHOT
// ========================================

function getAdminFinancialVisitMinutes(
    visit
) {


    const actualMinutes =
        getVisitDurationMinutes(
            visit
        );


    if (
        Number.isFinite(
            actualMinutes
        ) &&
        actualMinutes >
        0
    ) {

        return actualMinutes;

    }


    const serviceText =
        [
            visit.service_name,
            visit.service_type,
            visit.service_option,
            visit.service_duration
        ]
            .filter(
                Boolean
            )
            .join(
                " "
            )
            .toLowerCase();


    if (
        serviceText.includes(
            "60"
        )
    ) {

        return 60;

    }


    if (
        serviceText.includes(
            "30"
        )
    ) {

        return 30;

    }


    return 15;

}


function getAdminWeekDateRange() {


    const today =
        parseLocalDate(
            getLocalDateString()
        );


    const day =
        today.getDay();


    const daysSinceMonday =
        day ===
        0

            ? 6

            : day - 1;


    const monday =
        new Date(
            today
        );


    monday.setDate(
        monday.getDate() -
        daysSinceMonday
    );


    const sunday =
        new Date(
            monday
        );


    sunday.setDate(
        sunday.getDate() +
        6
    );


    return {

        start:
            makeDateString(
                monday.getFullYear(),
                monday.getMonth(),
                monday.getDate()
            ),

        end:
            makeDateString(
                sunday.getFullYear(),
                sunday.getMonth(),
                sunday.getDate()
            )

    };

}


function getAdminFinancialVisits(
    startDate,
    endDate
) {


    return allVisits
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
                    visit.visit_date >=
                        startDate &&
                    visit.visit_date <=
                        endDate &&
                    status !==
                        "cancelled"
                );

            }
        );

}


function getAdminFinancialRevenue(
    visits
) {


    return visits.reduce(
        (
            total,
            visit
        ) => {

            return (
                total +
                Number(
                    visit.price ||
                    0
                )
            );

        },
        0
    );

}


function formatAdminFinancialCurrency(
    amount
) {


    return Number(
        amount ||
        0
    )
        .toLocaleString(
            "en-US",
            {
                style:
                    "currency",

                currency:
                    "USD",

                minimumFractionDigits:
                    0,

                maximumFractionDigits:
                    0
            }
        );

}


function formatAdminFinancialTime(
    totalMinutes
) {


    const minutes =
        Math.max(
            0,
            Math.round(
                Number(
                    totalMinutes ||
                    0
                )
            )
        );


    const hours =
        Math.floor(
            minutes /
            60
        );


    const remainingMinutes =
        minutes %
        60;


    if (
        hours ===
        0
    ) {

        return `${remainingMinutes}m`;

    }


    return `${hours}h ${remainingMinutes}m`;

}


function renderAdminFinancialSnapshot() {


    const todayRevenueElement =
        document.getElementById(
            "admin-financial-today-revenue"
        );


    const weekRevenueElement =
        document.getElementById(
            "admin-financial-week-revenue"
        );


    const hourlyRateElement =
        document.getElementById(
            "admin-financial-hourly-rate"
        );


    const hourlyDetailElement =
        document.getElementById(
            "admin-financial-hourly-detail"
        );


    if (
        !todayRevenueElement ||
        !weekRevenueElement ||
        !hourlyRateElement ||
        !hourlyDetailElement
    ) {

        return;

    }


    const today =
        getLocalDateString();


    const todayVisits =
        getAdminFinancialVisits(
            today,
            today
        );


    const weekRange =
        getAdminWeekDateRange();


    const weekVisits =
        getAdminFinancialVisits(
            weekRange.start,
            weekRange.end
        );


    const todayRevenue =
        getAdminFinancialRevenue(
            todayVisits
        );


    const weekRevenue =
        getAdminFinancialRevenue(
            weekVisits
        );


    const visitMinutes =
        todayVisits.reduce(
            (
                total,
                visit
            ) => {

                return (
                    total +
                    getAdminFinancialVisitMinutes(
                        visit
                    )
                );

            },
            0
        );


    const driveSeconds =
        Number(
            adminBestRoutePlan
                ?.metrics
                ?.travel_seconds ||
            0
        );


    const driveMinutes =
        driveSeconds /
        60;


    const workingMinutes =
        visitMinutes +
        driveMinutes;


    const hourlyRate =
        workingMinutes >
        0

            ? (
                todayRevenue /
                (
                    workingMinutes /
                    60
                )
            )

            : 0;


    todayRevenueElement.textContent =
        formatAdminFinancialCurrency(
            todayRevenue
        );


    weekRevenueElement.textContent =
        formatAdminFinancialCurrency(
            weekRevenue
        );


    hourlyRateElement.textContent =
        `${formatAdminFinancialCurrency(
            hourlyRate
        )}/hr`;


    hourlyDetailElement.textContent =
        driveMinutes >
        0

            ? `${formatAdminFinancialTime(
                visitMinutes
            )} visits • ${formatAdminFinancialTime(
                driveMinutes
            )} estimated driving`

            : `${formatAdminFinancialTime(
                visitMinutes
            )} visits • Optimize route for drive time`;

}


// ========================================
// BEST VISIT ROUTE STATE
// ========================================

let adminBestRoutePlan =
    null;


let adminBestRouteLoading =
    false;


let adminBestRouteMap =
    null;


let adminBestRouteMarkers =
    new Map();


let adminBestRouteInfoWindows =
    new Map();

// ========================================
// ROUTE START ADDRESS
// ========================================

function getAdminRouteStartAddress() {


    const household =
        currentHousehold ||
        {};


    const addressParts =
        [];


    if (
        household.street_address
    ) {

        addressParts.push(
            household.street_address
        );

    }


    if (
        household.address_line_2
    ) {

        addressParts.push(
            household.address_line_2
        );

    }


    const cityState =
        [
            household.city,
            household.state
        ]
            .filter(
                Boolean
            )
            .join(
                ", "
            );


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

        addressParts.push(
            cityStateZip
        );

    }


    return addressParts
        .join(
            ", "
        )
        .trim();

}

// ========================================
// ROUTE SERVICE DURATION
// ========================================

function getAdminRouteDurationMinutes(
    visit
) {


    const serviceText =
        [
            visit.service_name,
            visit.service_type,
            visit.service_option,
            visit.service_duration
        ]
            .filter(
                Boolean
            )
            .join(
                " "
            )
            .toLowerCase();


    if (
        serviceText.includes(
            "60"
        )
    ) {

        return 70;

    }


    if (
        serviceText.includes(
            "30"
        )
    ) {

        return 40;

    }


    return 25;

}


// ========================================
// ROUTE CLIENT NAME
// ========================================

function getAdminRouteClientName(
    visit
) {


    const client =
        allProfiles.find(
            profile =>
                profile.id ===
                visit.client_id
        );


    return (
        client?.full_name ||
        client?.email ||
        "Client"
    );

}


// ========================================
// ROUTE ADDRESS
// ========================================

function getAdminRouteVisitAddress(
    visit
) {


    const household =
        allHouseholds.find(
            item =>
                item.client_id ===
                visit.client_id
        );


    if (
        !household
    ) {

        return "";

    }


    const addressParts =
        [];


    if (
        household.street_address
    ) {

        addressParts.push(
            household.street_address
        );

    }


    if (
        household.address_line_2
    ) {

        addressParts.push(
            household.address_line_2
        );

    }


    const cityState =
        [
            household.city,
            household.state
        ]
            .filter(
                Boolean
            )
            .join(
                ", "
            );


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

        addressParts.push(
            cityStateZip
        );

    }


    return addressParts.join(
        ", "
    );

}


// ========================================
// ROUTE PREFERRED WINDOW
// ========================================

function getAdminRoutePreferredWindow(
    visit
) {


    if (
        visit.preferred_time_window
    ) {

        return visit.preferred_time_window;

    }


    const clientName =
        getAdminRouteClientName(
            visit
        )
            .trim()
            .toLowerCase();


    if (
        clientName ===
            "apollo" &&
        visit.time_window ===
            "7:00 AM - 10:00 AM"
    ) {

        return "9:00 AM - 9:30 AM";

    }


    return null;

}


// ========================================
// GET REMAINING ROUTE VISITS
// ========================================

function getAdminRemainingRouteVisits() {


    const today =
        getLocalDateString();


    return allVisits
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
                    visit.visit_date !==
                        today ||
                    status ===
                        "cancelled"
                ) {

                    return false;

                }


                const progress =
                    getVisitProgressInfo(
                        visit
                    );


                return (
                    progress.state ===
                        "scheduled" ||
                    progress.state ===
                        "checked_in"
                );

            }
        )
        .sort(
            compareAdminVisits
        );

}


// ========================================
// FORMAT ROUTE DRIVE TIME
// ========================================

function formatAdminRouteDriveTime(
    seconds
) {


    const totalMinutes =
        Math.round(
            Number(
                seconds ||
                0
            ) /
            60
        );


    const hours =
        Math.floor(
            totalMinutes /
            60
        );


    const minutes =
        totalMinutes %
        60;


    if (
        hours ===
        0
    ) {

        return `${minutes} min`;

    }


    if (
        minutes ===
        0
    ) {

        return `${hours} hr`;

    }


    return `${hours} hr ${minutes} min`;

}


// ========================================
// FORMAT ROUTE TIME
// ========================================

function formatAdminRouteScheduledTime(
    isoTime
) {


    if (
        !isoTime
    ) {

        return "";

    }


    const date =
        new Date(
            isoTime
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
                "2-digit",

            timeZone:
                "America/Chicago"
        }
    );

}


// ========================================
// CALCULATE BEST VISIT ROUTE
// ========================================

async function calculateAdminBestVisitRoute() {


    if (
        adminBestRouteLoading
    ) {

        return;

    }


    // ========================================
    // ROUTE START ADDRESS
    // ========================================

    const startAddress =
        getAdminRouteStartAddress();


    if (
        !startAddress
    ) {

        window.alert(
            "Add your address to your admin profile before calculating a route."
        );


        return;

    }


    const remainingVisits =
        getAdminRemainingRouteVisits();


    if (
        remainingVisits.length ===
        0
    ) {

        adminBestRoutePlan =
            null;


        renderAdminBestVisitRoute();

        renderAdminFinancialSnapshot();


        return;

    }


    const missingAddresses =
        [];


    const routeVisits =
        remainingVisits
            .map(
                visit => {


                    const clientName =
                        getAdminRouteClientName(
                            visit
                        );


                    const address =
                        getAdminRouteVisitAddress(
                            visit
                        );


                    if (
                        !address
                    ) {

                        missingAddresses.push(
                            clientName
                        );


                        return null;

                    }


                    return {

                        id:
                            visit.id,

                        label:
                            clientName,

                        address,

                        visit_date:
                            visit.visit_date,

                        time_window:
                            visit.time_window,

                        preferred_time_window:
                            getAdminRoutePreferredWindow(
                                visit
                            ),

                        duration_minutes:
                            getAdminRouteDurationMinutes(
                                visit
                            )

                    };

                }
            )
            .filter(
                Boolean
            );


    if (
        missingAddresses.length >
        0
    ) {

        window.alert(
            `Missing an address for: ${
                missingAddresses.join(
                    ", "
                )
            }`
        );


        return;

    }


    adminBestRouteLoading =
        true;


    renderAdminBestVisitRoute();


    try {


        const {
            data,
            error
        } =
            await supabaseClient
                .functions
                .invoke(
                    "route-optimizer",
                    {
                        body: {

                            start_address:
                                startAddress,

                            visits:
                                routeVisits

                        }
                    }
                );


        if (
            error
        ) {

            throw error;

        }


        if (
            !data?.success
        ) {

            throw new Error(
                data?.error ||
                "Route optimization failed."
            );

        }


        adminBestRoutePlan =
            data;


    } catch (
        error
    ) {


        console.error(
            "Admin route optimization error:",
            error
        );


        window.alert(
            error?.message ||
            "Unable to calculate the route."
        );


    } finally {


        adminBestRouteLoading =
            false;


        renderAdminBestVisitRoute();

        renderAdminFinancialSnapshot();

    }

}

// ========================================
// DECODE GOOGLE ROUTE POLYLINE
// ========================================

function decodeAdminRoutePolyline(
    encoded
) {


    if (
        !encoded
    ) {

        return [];

    }


    const path =
        [];


    let index =
        0;


    let latitude =
        0;


    let longitude =
        0;


    while (
        index <
        encoded.length
    ) {


        let result =
            0;


        let shift =
            0;


        let byte;


        do {

            byte =
                encoded.charCodeAt(
                    index++
                ) -
                63;


            result |=
                (
                    byte &
                    0x1f
                ) <<
                shift;


            shift +=
                5;


        } while (
            byte >=
            0x20
        );


        const latitudeChange =
            (
                result &
                1
            )
                ? ~(
                    result >>
                    1
                )
                : (
                    result >>
                    1
                );


        latitude +=
            latitudeChange;


        result =
            0;


        shift =
            0;


        do {

            byte =
                encoded.charCodeAt(
                    index++
                ) -
                63;


            result |=
                (
                    byte &
                    0x1f
                ) <<
                shift;


            shift +=
                5;


        } while (
            byte >=
            0x20
        );


        const longitudeChange =
            (
                result &
                1
            )
                ? ~(
                    result >>
                    1
                )
                : (
                    result >>
                    1
                );


        longitude +=
            longitudeChange;


        path.push({
            lat:
                latitude /
                1e5,

            lng:
                longitude /
                1e5
        });

    }


    return path;

}


// ========================================
// ROUTE MAP PLACEHOLDER
// ========================================

function renderAdminRouteMapPlaceholder(
    title,
    message
) {


    const mapElement =
        document.getElementById(
            "admin-route-map"
        );


    if (
        !mapElement
    ) {

        return;

    }


    mapElement.innerHTML =
        `

            <div class="admin-route-map-placeholder">

                <span class="admin-route-map-icon">

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"></path>
                        <path d="M9 3v15"></path>
                        <path d="M15 6v15"></path>
                    </svg>

                </span>

                <strong>
                    ${escapeHtml(
                        title
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        message
                    )}
                </span>

            </div>

        `;

}


// ========================================
// RENDER OPTIMIZED ROUTE MAP
// ========================================

function renderAdminOptimizedRouteMap() {


    const mapElement =
        document.getElementById(
            "admin-route-map"
        );


    if (
        !mapElement
    ) {

        return;

    }


    // ========================================
    // RESET MAP STATE
    // ========================================

    adminBestRouteMap =
        null;


    adminBestRouteMarkers.clear();


    adminBestRouteInfoWindows.clear();


    if (
        !adminBestRoutePlan?.success ||
        !Array.isArray(
            adminBestRoutePlan.stops
        ) ||
        adminBestRoutePlan.stops.length ===
            0
    ) {

        renderAdminRouteMapPlaceholder(
            "Route Map",
            "Your optimized stops will be mapped here."
        );


        return;

    }


    if (
        !window.google ||
        !google.maps
    ) {

        renderAdminRouteMapPlaceholder(
            "Route Map",
            "Google Maps is still loading."
        );


        setTimeout(
            () => {

                if (
                    adminBestRoutePlan?.success
                ) {

                    renderAdminOptimizedRouteMap();

                }

            },
            750
        );


        return;

    }


    const startLatitude =
        Number(
            adminBestRoutePlan
                .start
                ?.latitude
        );


    const startLongitude =
        Number(
            adminBestRoutePlan
                .start
                ?.longitude
        );


    if (
        !Number.isFinite(
            startLatitude
        ) ||
        !Number.isFinite(
            startLongitude
        )
    ) {

        renderAdminRouteMapPlaceholder(
            "Route Map",
            "The route start location could not be mapped."
        );


        return;

    }


    const startPosition = {
        lat:
            startLatitude,

        lng:
            startLongitude
    };


    // ========================================
    // CREATE MAP
    // ========================================

    mapElement.innerHTML =
        "";


    adminBestRouteMap =
        new google.maps.Map(
            mapElement,
            {
                center:
                    startPosition,

                zoom:
                    11,

                mapTypeControl:
                    false,

                streetViewControl:
                    false,

                fullscreenControl:
                    true,

                gestureHandling:
                    "cooperative"
            }
        );


    const bounds =
        new google.maps.LatLngBounds();


    bounds.extend(
        startPosition
    );


    // ========================================
    // DRAW OPTIMIZED ROAD ROUTE
    // ========================================

    const routePath =
        decodeAdminRoutePolyline(
            adminBestRoutePlan
                .route_polyline
        );


    if (
        routePath.length >
        1
    ) {


        const routeLine =
            new google.maps.Polyline({
                path:
                    routePath,

                geodesic:
                    true,

                strokeColor:
                    "#2890df",

                strokeOpacity:
                    0.95,

                strokeWeight:
                    5
            });


        routeLine.setMap(
            adminBestRouteMap
        );


        routePath.forEach(
            point => {

                bounds.extend(
                    point
                );

            }
        );

    }


    // ========================================
    // START MARKER
    // ========================================

    new google.maps.Marker({
        position:
            startPosition,

        map:
            adminBestRouteMap,

        title:
            "Route Start",

        label: {
            text:
                "S",

            color:
                "#ffffff",

            fontWeight:
                "800"
        },

        icon: {
            path:
                google.maps.SymbolPath.CIRCLE,

            scale:
                12,

            fillColor:
                "#183447",

            fillOpacity:
                1,

            strokeColor:
                "#ffffff",

            strokeWeight:
                3
        }
    });


    // ========================================
    // NUMBERED VISIT MARKERS
    // ========================================

    adminBestRoutePlan
        .stops
        .forEach(
            stop => {


                const latitude =
                    Number(
                        stop.latitude
                    );


                const longitude =
                    Number(
                        stop.longitude
                    );


                if (
                    !Number.isFinite(
                        latitude
                    ) ||
                    !Number.isFinite(
                        longitude
                    )
                ) {

                    return;

                }


                const position = {
                    lat:
                        latitude,

                    lng:
                        longitude
                };


                bounds.extend(
                    position
                );


                const scheduledTime =
                    formatAdminRouteScheduledTime(
                        stop.scheduled_start
                    );


                const marker =
                    new google.maps.Marker({
                        position,

                        map:
                            adminBestRouteMap,

                        title:
                            `${
                                stop.order
                            }. ${
                                stop.label
                            }${
                                scheduledTime
                                    ? ` • ${scheduledTime}`
                                    : ""
                            }`,

                        label: {
                            text:
                                String(
                                    stop.order
                                ),

                            color:
                                "#ffffff",

                            fontWeight:
                                "800"
                        },

                        icon: {
                            path:
                                google.maps.SymbolPath.CIRCLE,

                            scale:
                                13,

                            fillColor:
                                "#ef872c",

                            fillOpacity:
                                1,

                            strokeColor:
                                "#ffffff",

                            strokeWeight:
                                3
                        }
                    });


                const infoWindow =
                    new google.maps.InfoWindow({
                        content:
                            `

                                <div style="min-width:180px;padding:2px 0;">

                                    <strong style="display:block;margin-bottom:4px;">
                                        ${
                                            escapeHtml(
                                                stop.order
                                            )
                                        }. ${
                                            escapeHtml(
                                                stop.label
                                            )
                                        }
                                    </strong>

                                    ${
                                        scheduledTime
                                            ? `
                                                <div style="margin-bottom:3px;">
                                                    ${escapeHtml(
                                                        scheduledTime
                                                    )}
                                                </div>
                                            `
                                            : ""
                                    }

                                    <div style="font-size:12px;line-height:1.4;">
                                        ${escapeHtml(
                                            stop.formatted_address ||
                                            stop.address ||
                                            ""
                                        )}
                                    </div>

                                </div>

                            `
                    });


                // ========================================
                // SAVE MARKER REFERENCES
                // ========================================

                adminBestRouteMarkers.set(
                    Number(
                        stop.id
                    ),
                    marker
                );


                adminBestRouteInfoWindows.set(
                    Number(
                        stop.id
                    ),
                    infoWindow
                );


                // ========================================
                // MAP MARKER CLICK
                // ========================================

                marker.addListener(
                    "click",
                    () => {


                        adminBestRouteInfoWindows
                            .forEach(
                                windowItem => {

                                    windowItem.close();

                                }
                            );


                        infoWindow.open({
                            map:
                                adminBestRouteMap,

                            anchor:
                                marker
                        });

                    }
                );

            }
        );


    // ========================================
    // FIT ENTIRE ROUTE
    // ========================================

    adminBestRouteMap.fitBounds(
        bounds,
        45
    );

}


// ========================================
// RENDER BEST VISIT ROUTE
// ========================================

function renderAdminBestVisitRoute() {


    const stopCountElement =
        document.getElementById(
            "admin-route-stop-count"
        );


    const driveTimeElement =
        document.getElementById(
            "admin-route-drive-time"
        );


    const distanceElement =
        document.getElementById(
            "admin-route-distance"
        );


    const statusElement =
        document.getElementById(
            "admin-route-status"
        );


    const subtitleElement =
        document.getElementById(
            "admin-route-subtitle"
        );


    const stopList =
        document.getElementById(
            "admin-route-stop-list"
        );


    const recalculateButton =
        document.getElementById(
            "admin-route-recalculate-button"
        );


    const startButton =
        document.getElementById(
            "admin-route-start-button"
        );


    if (
        !stopCountElement ||
        !driveTimeElement ||
        !distanceElement ||
        !statusElement ||
        !subtitleElement ||
        !stopList ||
        !recalculateButton ||
        !startButton
    ) {

        return;

    }


    const remainingVisits =
        getAdminRemainingRouteVisits();


    // ========================================
    // ROUTE SUMMARY
    // ========================================

    stopCountElement.textContent =
        remainingVisits.length;


    recalculateButton.disabled =
        adminBestRouteLoading ||
        remainingVisits.length ===
            0;


    startButton.disabled =
        adminBestRouteLoading ||
        remainingVisits.length ===
            0;


    // ========================================
    // NO REMAINING VISITS
    // ========================================

    if (
        remainingVisits.length ===
        0
    ) {


        adminBestRoutePlan =
            null;


        driveTimeElement.textContent =
            "—";


        distanceElement.textContent =
            "—";


        statusElement.textContent =
            "Complete";


        subtitleElement.textContent =
            "No remaining visits for today.";


        stopList.innerHTML =
            `

                <div class="admin-route-empty">

                    <strong>
                        Today's route is complete.
                    </strong>

                    <span>
                        There are no remaining scheduled visits for today.
                    </span>

                </div>

            `;


        renderAdminRouteMapPlaceholder(
            "Route Complete",
            "There are no remaining stops to map."
        );


        return;

    }


    // ========================================
    // OPTIMIZER LOADING
    // ========================================

    if (
        adminBestRouteLoading
    ) {


        statusElement.textContent =
            "Optimizing";


        subtitleElement.textContent =
            "Calculating the most efficient route...";


        driveTimeElement.textContent =
            "—";


        distanceElement.textContent =
            "—";


        renderAdminRouteMapPlaceholder(
            "Optimizing Route",
            "Calculating today's best driving route..."
        );


        return;

    }


    // ========================================
    // OPTIMIZED ROUTE
    // ========================================

    if (
        adminBestRoutePlan?.success &&
        Array.isArray(
            adminBestRoutePlan.stops
        ) &&
        adminBestRoutePlan.stops.length >
            0
    ) {


        const optimizedStops =
            adminBestRoutePlan.stops;


        stopCountElement.textContent =
            optimizedStops.length;


        driveTimeElement.textContent =
            formatAdminRouteDriveTime(
                adminBestRoutePlan
                    .metrics
                    ?.travel_seconds
            );


        const miles =
            Number(
                adminBestRoutePlan
                    .metrics
                    ?.distance_miles ||
                0
            );


        distanceElement.textContent =
            `${miles.toFixed(
                1
            )} mi`;


        statusElement.textContent =
            "Optimized";


        subtitleElement.textContent =
            `${optimizedStops.length} optimized ${
                optimizedStops.length ===
                1
                    ? "stop"
                    : "stops"
            }`;


        stopList.innerHTML =
            optimizedStops
                .map(
                    stop => {


                        const visit =
                            allVisits.find(
                                item =>
                                    Number(
                                        item.id
                                    ) ===
                                    Number(
                                        stop.id
                                    )
                            );


                        const serviceName =
                            visit?.service_name ||
                            visit?.service_type ||
                            "Service";


                        const scheduledTime =
                            formatAdminRouteScheduledTime(
                                stop.scheduled_start
                            );


                        return `

                            <article
                                class="admin-route-stop"
                                data-route-visit-id="${stop.id}"
                            >

                                <span class="admin-route-stop-number">
                                    ${stop.order}
                                </span>

                                <div class="admin-route-stop-copy">

                                    <strong>
                                        ${escapeHtml(
                                            stop.label
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            serviceName
                                        )}
                                        •
                                        ${escapeHtml(
                                            stop.address
                                        )}
                                    </span>

                                </div>

                                <span class="admin-route-stop-time">
                                    ${
                                        scheduledTime
                                            ? escapeHtml(
                                                scheduledTime
                                            )
                                            : escapeHtml(
                                                stop.time_window ||
                                                ""
                                            )
                                    }
                                </span>

                            </article>

                        `;

                    }
                )
                .join("");


        renderAdminOptimizedRouteMap();


        return;

    }


    // ========================================
    // SCHEDULE ORDER BEFORE OPTIMIZATION
    // ========================================

    driveTimeElement.textContent =
        "—";


    distanceElement.textContent =
        "—";


    statusElement.textContent =
        "Ready";


    subtitleElement.textContent =
        `${remainingVisits.length} remaining ${
            remainingVisits.length ===
            1
                ? "stop"
                : "stops"
        } • Recalculate to optimize`;


    stopList.innerHTML =
        remainingVisits
            .map(
                (
                    visit,
                    index
                ) => {


                    const clientName =
                        getAdminRouteClientName(
                            visit
                        );


                    const serviceName =
                        visit.service_name ||
                        visit.service_type ||
                        "Service";


                    const timeWindow =
                        visit.time_window ||
                        "Time not set";


                    const address =
                        getAdminRouteVisitAddress(
                            visit
                        ) ||
                        "Address not added";


                    const progress =
                        getVisitProgressInfo(
                            visit
                        );


                    const progressLabel =
                        progress.state ===
                        "checked_in"
                            ? "In Progress"
                            : serviceName;


                    return `

                        <article
                            class="admin-route-stop"
                            data-route-visit-id="${visit.id}"
                        >

                            <span class="admin-route-stop-number">
                                ${index + 1}
                            </span>

                            <div class="admin-route-stop-copy">

                                <strong>
                                    ${escapeHtml(
                                        clientName
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        progressLabel
                                    )}
                                    •
                                    ${escapeHtml(
                                        address
                                    )}
                                </span>

                            </div>

                            <span class="admin-route-stop-time">
                                ${escapeHtml(
                                    timeWindow
                                )}
                            </span>

                        </article>

                    `;

                }
            )
            .join("");


    renderAdminRouteMapPlaceholder(
        "Route Map",
        "Recalculate to map today's optimized route."
    );

}

// ========================================
// ROUTE STOP MAP FOCUS
// ========================================

const adminRouteStopList =
    document.getElementById(
        "admin-route-stop-list"
    );


adminRouteStopList
    ?.addEventListener(
        "click",
        event => {


            const stopCard =
                event.target.closest(
                    "[data-route-visit-id]"
                );


            if (
                !stopCard ||
                !adminBestRouteMap
            ) {

                return;

            }


            const visitId =
                Number(
                    stopCard.dataset
                        .routeVisitId
                );


            const marker =
                adminBestRouteMarkers.get(
                    visitId
                );


            const infoWindow =
                adminBestRouteInfoWindows.get(
                    visitId
                );


            if (
                !marker ||
                !infoWindow
            ) {

                return;

            }


            // ========================================
            // CLOSE OTHER INFO WINDOWS
            // ========================================

            adminBestRouteInfoWindows
                .forEach(
                    windowItem => {

                        windowItem.close();

                    }
                );


            // ========================================
            // FOCUS SELECTED STOP
            // ========================================

            const position =
                marker.getPosition();


            if (
                position
            ) {

                adminBestRouteMap.panTo(
                    position
                );


                adminBestRouteMap.setZoom(
                    14
                );

            }


            // ========================================
            // OPEN SELECTED STOP INFO
            // ========================================

            infoWindow.open({
                map:
                    adminBestRouteMap,

                anchor:
                    marker
            });

        }
    );


// ========================================
// RECALCULATE BEST VISIT ROUTE
// ========================================

const adminRouteRecalculateButton =
    document.getElementById(
        "admin-route-recalculate-button"
    );


adminRouteRecalculateButton
    ?.addEventListener(
        "click",
        async () => {

            await calculateAdminBestVisitRoute();

        }
    );

// ========================================
// START ROUTE ACTION
// ========================================

const adminRouteStartButton =
    document.getElementById(
        "admin-route-start-button"
    );


adminRouteStartButton
    ?.addEventListener(
        "click",
        async () => {


            // ========================================
            // ROUTE START ADDRESS
            // ========================================

            const startAddress =
                getAdminRouteStartAddress();


            if (
                !startAddress
            ) {

                window.alert(
                    "Add your address to your admin profile before starting a route."
                );


                return;

            }


            // ========================================
            // REQUIRE OPTIMIZED ROUTE
            // ========================================

            if (
                !adminBestRoutePlan?.success ||
                !Array.isArray(
                    adminBestRoutePlan.stops
                ) ||
                adminBestRoutePlan.stops.length ===
                    0
            ) {


                await calculateAdminBestVisitRoute();


                if (
                    !adminBestRoutePlan?.success ||
                    !Array.isArray(
                        adminBestRoutePlan.stops
                    ) ||
                    adminBestRoutePlan.stops.length ===
                        0
                ) {

                    return;

                }

            }


            // ========================================
            // BUILD OPTIMIZED ROUTE ADDRESSES
            // ========================================

            const routeAddresses =
                adminBestRoutePlan
                    .stops
                    .map(
                        stop =>
                            stop.formatted_address ||
                            stop.address ||
                            ""
                    )
                    .filter(
                        Boolean
                    );


            if (
                routeAddresses.length ===
                0
            ) {

                return;

            }


            const destination =
                routeAddresses[
                    routeAddresses.length -
                    1
                ];


            const waypoints =
                routeAddresses.slice(
                    0,
                    -1
                );


            // ========================================
            // GOOGLE MAPS ROUTE
            // ========================================

            const routeUrl =
                new URL(
                    "https://www.google.com/maps/dir/"
                );


            routeUrl.searchParams.set(
                "api",
                "1"
            );


            routeUrl.searchParams.set(
                "origin",
                startAddress
            );


            routeUrl.searchParams.set(
                "destination",
                destination
            );


            routeUrl.searchParams.set(
                "travelmode",
                "driving"
            );


            routeUrl.searchParams.set(
                "dir_action",
                "navigate"
            );


            if (
                waypoints.length >
                0
            ) {

                routeUrl.searchParams.set(
                    "waypoints",
                    waypoints.join(
                        "|"
                    )
                );

            }


            // ========================================
            // OPEN GOOGLE MAPS
            // ========================================

            window.open(
                routeUrl.toString(),
                "_blank",
                "noopener,noreferrer"
            );

        }
    );

// ========================================
// CLIENT DIRECTORY
// ========================================

function getAdminClientDirectoryProfiles() {


    return allProfiles
        .filter(
            profile => {


                const role =
                    String(
                        profile.role ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                return role !==
                    "admin";

            }
        )
        .sort(
            (
                first,
                second
            ) => {


                const firstName =
                    String(
                        first.full_name ||
                        first.email ||
                        ""
                    );


                const secondName =
                    String(
                        second.full_name ||
                        second.email ||
                        ""
                    );


                return firstName.localeCompare(
                    secondName
                );

            }
        );

}


function getAdminClientHousehold(
    clientId
) {


    return allHouseholds.find(
        household =>
            household.client_id ===
            clientId
    ) ||
    null;

}


function getAdminClientPets(
    clientId
) {


    return allPets
        .filter(
            pet =>
                pet.client_id ===
                clientId
        )
        .sort(
            (
                first,
                second
            ) =>
                String(
                    first.name ||
                    ""
                )
                    .localeCompare(
                        String(
                            second.name ||
                            ""
                        )
                    )
        );

}


function getAdminClientAddress(
    clientId
) {


    const household =
        getAdminClientHousehold(
            clientId
        );


    if (
        !household
    ) {

        return "";

    }


    const parts =
        [];


    if (
        household.street_address
    ) {

        parts.push(
            household.street_address
        );

    }


    if (
        household.address_line_2
    ) {

        parts.push(
            household.address_line_2
        );

    }


    const cityState =
        [
            household.city,
            household.state
        ]
            .filter(
                Boolean
            )
            .join(
                ", "
            );


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

        parts.push(
            cityStateZip
        );

    }


    return parts
        .join(
            ", "
        );

}


function getAdminClientInitials(
    profile
) {


    const name =
        String(
            profile.full_name ||
            profile.email ||
            "Client"
        )
            .trim();


    const words =
        name
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


    if (
        words.length ===
        0
    ) {

        return "C";

    }


    return words
        .slice(
            0,
            2
        )
        .map(
            word =>
                word.charAt(
                    0
                )
                    .toUpperCase()
        )
        .join(
            ""
        );

}


function getAdminClientVisitStats(
    clientId
) {


    const today =
        getLocalDateString();


    const visits =
        allVisits
            .filter(
                visit =>
                    visit.client_id ===
                    clientId &&
                    String(
                        visit.status ||
                        ""
                    )
                        .trim()
                        .toLowerCase() !==
                        "cancelled"
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    String(
                        first.visit_date ||
                        ""
                    )
                        .localeCompare(
                            String(
                                second.visit_date ||
                                ""
                            )
                        )
            );


    const nextVisit =
        visits.find(
            visit =>
                visit.visit_date >=
                today
        ) ||
        null;


    return {

        total:
            visits.length,

        nextVisit:
            nextVisit

    };

}


function getAdminClientSearchText(
    profile
) {


    const pets =
        getAdminClientPets(
            profile.id
        );


    const address =
        getAdminClientAddress(
            profile.id
        );


    return [
        profile.full_name,
        profile.email,
        profile.phone,
        address,
        ...pets.map(
            pet => pet.name
        ),
        ...pets.map(
            pet => pet.breed
        )
    ]
        .filter(
            Boolean
        )
        .join(
            " "
        )
        .toLowerCase();

}


function formatAdminClientVisitDate(
    visit
) {


    if (
        !visit?.visit_date
    ) {

        return "No upcoming visit";

    }


    const date =
        parseLocalDate(
            visit.visit_date
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month:
                "short",

            day:
                "numeric",

            year:
                date.getFullYear() !==
                new Date().getFullYear()

                    ? "numeric"

                    : undefined
        }
    );

}


// ========================================
// BUILD CLIENT DIRECTORY CARD
// ========================================

async function buildAdminClientDirectoryCard(
    profile
) {


    const pets =
        getAdminClientPets(
            profile.id
        );


    const address =
        getAdminClientAddress(
            profile.id
        );


    const stats =
        getAdminClientVisitStats(
            profile.id
        );


    const petNames =
        pets.length >
        0

            ? pets.map(
                pet =>
                    pet.name ||
                    "Pet"
            )

            : [];


    let profilePhotoUrl =
        null;


    if (
        profile.profile_photo_path
    ) {

        profilePhotoUrl =
            await getAdminProfilePhotoUrl(
                profile.profile_photo_path
            );

    }


    const avatarMarkup =
        profilePhotoUrl

            ? `

                <img
                    src="${escapeHtml(
                        profilePhotoUrl
                    )}"
                    alt="${escapeHtml(
                        profile.full_name ||
                        "Client"
                    )}"
                    class="admin-client-avatar-image"
                    data-admin-client-photo
                >

            `

            : `

                <span class="admin-client-avatar">
                    ${escapeHtml(
                        getAdminClientInitials(
                            profile
                        )
                    )}
                </span>

            `;


    return `

        <article
            class="admin-client-card"
            data-client-id="${escapeHtml(
                String(
                    profile.id
                )
            )}"
        >


            <div class="admin-client-card-top">


                ${avatarMarkup}


                <div class="admin-client-card-identity">

                    <strong>
                        ${escapeHtml(
                            profile.full_name ||
                            profile.email ||
                            "Client"
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            petNames.length >
                            0

                                ? petNames.join(
                                    ", "
                                )

                                : "No pets added"
                        )}
                    </span>

                </div>


            </div>


            <div class="admin-client-card-details">


                <div class="admin-client-card-detail">

                    <span>
                        Contact
                    </span>

                    <strong>
                        ${escapeHtml(
                            profile.phone ||
                            profile.email ||
                            "Not added"
                        )}
                    </strong>

                </div>


                <div class="admin-client-card-detail">

                    <span>
                        Address
                    </span>

                    <strong>
                        ${escapeHtml(
                            address ||
                            "Not added"
                        )}
                    </strong>

                </div>


            </div>


            <div class="admin-client-card-footer">


                <span>
                    ${stats.total}
                    ${
                        stats.total ===
                        1

                            ? "visit"

                            : "visits"
                    }
                </span>


                <span>
                    Next:
                    ${escapeHtml(
                        formatAdminClientVisitDate(
                            stats.nextVisit
                        )
                    )}
                </span>


            </div>


            <button
                type="button"
                class="admin-client-view-button"
                data-client-view="${escapeHtml(
                    String(
                        profile.id
                    )
                )}"
            >
                View Household
            </button>


        </article>

    `;

}


// ========================================
// RENDER CLIENT DIRECTORY
// ========================================

async function renderAdminClientDirectory() {


    const list =
        document.getElementById(
            "admin-client-directory-list"
        );


    const countElement =
        document.getElementById(
            "admin-client-directory-count"
        );


    const searchInput =
        document.getElementById(
            "admin-client-search-input"
        );


    const clearButton =
        document.getElementById(
            "admin-client-search-clear"
        );


    if (
        !list ||
        !countElement ||
        !searchInput ||
        !clearButton
    ) {

        return;

    }


    const clients =
        getAdminClientDirectoryProfiles();


    const query =
        String(
            searchInput.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const filteredClients =
        query

            ? clients.filter(
                profile =>
                    getAdminClientSearchText(
                        profile
                    )
                        .includes(
                            query
                        )
            )

            : clients;


    countElement.textContent =
        `${clients.length} ${
            clients.length ===
            1

                ? "client"

                : "clients"
        }`;


    clearButton.hidden =
        query.length ===
        0;


    if (
        filteredClients.length ===
        0
    ) {


        list.innerHTML =
            `

                <div class="admin-client-directory-empty">

                    <strong>
                        ${
                            query
                                ? "No clients found"
                                : "No clients yet"
                        }
                    </strong>

                    <span>
                        ${
                            query
                                ? "Try a different name, pet, phone number, email, or address."
                                : "Client households will appear here once they have been added."
                        }
                    </span>

                </div>

            `;


        return;

    }


    const renderedClients =
        await Promise.all(
            filteredClients.map(
                buildAdminClientDirectoryCard
            )
        );


    list.innerHTML =
        renderedClients.join(
            ""
        );


    list
        .querySelectorAll(
            "[data-admin-client-photo]"
        )
        .forEach(
            image => {


                image.addEventListener(
                    "error",
                    () => {


                        const profileId =
                            image
                                .closest(
                                    "[data-client-id]"
                                )
                                ?.dataset
                                .clientId;


                        const profile =
                            allProfiles.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        profileId
                                    )
                            );


                        const fallback =
                            document.createElement(
                                "span"
                            );


                        fallback.className =
                            "admin-client-avatar";


                        fallback.textContent =
                            getAdminClientInitials(
                                profile ||
                                {}
                            );


                        image.replaceWith(
                            fallback
                        );

                    },
                    {
                        once:
                            true
                    }
                );

            }
        );

}


function setupAdminClientDirectory() {


    const searchInput =
        document.getElementById(
            "admin-client-search-input"
        );


    const clearButton =
        document.getElementById(
            "admin-client-search-clear"
        );


    if (
        searchInput &&
        !searchInput.dataset.clientDirectoryBound
    ) {


        searchInput.dataset.clientDirectoryBound =
            "true";


        searchInput.addEventListener(
            "input",
            renderAdminClientDirectory
        );

    }


    if (
        clearButton &&
        !clearButton.dataset.clientDirectoryBound
    ) {


        clearButton.dataset.clientDirectoryBound =
            "true";


        clearButton.addEventListener(
            "click",
            () => {


                searchInput.value =
                    "";


                renderAdminClientDirectory();


                searchInput.focus();

            }
        );

    }


    renderAdminClientDirectory();

}


// ========================================
// CLIENT HOUSEHOLD DETAIL
// ========================================

function getAdminClientVisits(
    clientId
) {


    return allVisits
        .filter(
            visit =>
                visit.client_id ===
                clientId &&
                String(
                    visit.status ||
                    ""
                )
                    .trim()
                    .toLowerCase() !==
                "cancelled"
        )
        .sort(
            (
                first,
                second
            ) => {


                const firstDate =
                    String(
                        first.visit_date ||
                        ""
                    );


                const secondDate =
                    String(
                        second.visit_date ||
                        ""
                    );


                return secondDate.localeCompare(
                    firstDate
                );

            }
        );

}


// ========================================
// BUILD HOUSEHOLD PET CARD
// ========================================

const adminPetPhotoUrlCache =
    new Map();


async function getAdminPetDisplayUrl(
    pet
) {


    const defaultAvatar =
        "./assets/default-pet-avatar.webp";


    if (
        !pet?.photo_path
    ) {

        return defaultAvatar;

    }


    if (
        adminPetPhotoUrlCache.has(
            pet.photo_path
        )
    ) {

        return adminPetPhotoUrlCache.get(
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
                "pet-photos"
            )
            .createSignedUrl(
                pet.photo_path,
                3600
            );


    if (
        error ||
        !data?.signedUrl
    ) {

        return defaultAvatar;

    }


    adminPetPhotoUrlCache.set(
        pet.photo_path,
        data.signedUrl
    );


    return data.signedUrl;

}


async function buildAdminClientPetCard(
    pet
) {


    const petName =
        pet.name ||
        "Pet";


    const petDetails =
        [
            pet.breed,
            pet.gender
        ]
            .filter(
                Boolean
            )
            .join(
                " • "
            );


    const photoUrl =
        await getAdminPetDisplayUrl(
            pet
        );


    return `

        <article class="admin-client-pet-card">


            <img
                src="${escapeHtml(
                    photoUrl
                )}"
                alt="${escapeHtml(
                    petName
                )}"
                class="admin-client-pet-photo"
                data-admin-pet-photo
            >


            <div class="admin-client-pet-copy">

                <strong>
                    ${escapeHtml(
                        petName
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        petDetails ||
                        "Pet profile"
                    )}
                </span>

            </div>


        </article>

    `;

}


// ========================================
// BUILD HOUSEHOLD VISIT ITEM
// ========================================

function buildAdminClientVisitItem(
    visit
) {


    const serviceName =
        visit.service_name ||
        visit.service_type ||
        "Service";


    const status =
        String(
            visit.status ||
            "scheduled"
        )
            .trim()
            .toLowerCase();


    const statusLabel =
        status ===
        "completed"

            ? "Completed"

            : status ===
                "checked_in"

                ? "In Progress"

                : "Scheduled";


    const statusClass =
        status ===
        "completed"

            ? "admin-client-activity-completed"

            : status ===
                "checked_in"

                ? "admin-client-activity-live"

                : "";


    const price =
        Number(
            visit.price ||
            0
        );


    return `

        <article class="admin-client-activity-item ${statusClass}">


            <div class="admin-client-activity-main">


                <div>

                    <strong>
                        ${escapeHtml(
                            serviceName
                        )}
                    </strong>

                    <span>

                        ${escapeHtml(
                            formatAdminClientVisitDate(
                                visit
                            )
                        )}

                        ${
                            visit.time_window

                                ? ` • ${escapeHtml(
                                    visit.time_window
                                )}`

                                : ""
                        }

                    </span>

                </div>


                <span class="admin-client-activity-status">
                    ${escapeHtml(
                        statusLabel
                    )}
                </span>


            </div>


            <div class="admin-client-activity-meta">

                <span>
                    ${escapeHtml(
                        visit.notes ||
                        "Client service"
                    )}
                </span>

                <strong>
                    $${Math.round(
                        price
                    )}
                </strong>

            </div>


        </article>

    `;

}

// ========================================
// OPEN CLIENT HOUSEHOLD
// ========================================

async function openAdminClientHousehold(
    clientId
) {


    const profile =
        allProfiles.find(
            item =>
                item.id ===
                clientId
        );


    if (
        !profile
    ) {

        return;

    }


    const pets =
        getAdminClientPets(
            clientId
        );


    const visits =
        getAdminClientVisits(
            clientId
        );


    const address =
        getAdminClientAddress(
            clientId
        );


    const directoryHeading =
        document.querySelector(
            ".admin-client-directory-heading"
        );


    const search =
        document.querySelector(
            ".admin-client-search"
        );


    const list =
        document.getElementById(
            "admin-client-directory-list"
        );


    const detail =
        document.getElementById(
            "admin-client-household-detail"
        );


    if (
        !detail
    ) {

        return;

    }


    if (
        directoryHeading
    ) {

        directoryHeading.hidden =
            true;

    }


    if (
        search
    ) {

        search.hidden =
            true;

    }


    if (
        list
    ) {

        list.hidden =
            true;

    }


    detail.hidden =
        false;


    document.getElementById(
        "admin-client-household-avatar"
    ).textContent =
        getAdminClientInitials(
            profile
        );


    document.getElementById(
        "admin-client-household-name"
    ).textContent =
        profile.full_name ||
        profile.email ||
        "Client";


    document.getElementById(
        "admin-client-household-pets-summary"
    ).textContent =
        pets.length >
        0

            ? `${pets.length} ${
                pets.length ===
                1

                    ? "pet"

                    : "pets"
            } in this household`

            : "No pets added";


    document.getElementById(
        "admin-client-household-phone"
    ).textContent =
        profile.phone ||
        "Not added";


    document.getElementById(
        "admin-client-household-email"
    ).textContent =
        profile.email ||
        "Not added";


    document.getElementById(
        "admin-client-household-address"
    ).textContent =
        address ||
        "Not added";


    document.getElementById(
        "admin-client-household-visits"
    ).textContent =
        `${visits.length} ${
            visits.length ===
            1

                ? "visit"

                : "visits"
        }`;


    // ========================================
    // PRICING TIER
    // ========================================

    const pricingTier =
        profile.pricing_tier ===
        "grandfathered"

            ? "grandfathered"

            : "standard";


    const pricingTierDisplay =
        document.getElementById(
            "admin-client-household-pricing-tier"
        );


    const pricingTierSelect =
        document.getElementById(
            "admin-client-pricing-tier-select"
        );


    const pricingTierEditor =
        document.getElementById(
            "admin-client-pricing-tier-editor"
        );


    if (
        pricingTierDisplay
    ) {

        pricingTierDisplay.textContent =
            pricingTier ===
            "grandfathered"

                ? "Legacy"

                : "Standard";

    }


    if (
        pricingTierSelect
    ) {

        pricingTierSelect.value =
            pricingTier;

        pricingTierSelect.dataset.clientId =
            String(
                clientId
            );

    }


    if (
        pricingTierEditor
    ) {

        pricingTierEditor.hidden =
            true;

    }


    const petsContainer =
        document.getElementById(
            "admin-client-household-pets"
        );


    if (
        petsContainer
    ) {


        if (
            pets.length >
            0
        ) {


            const renderedPets =
                await Promise.all(
                    pets.map(
                        buildAdminClientPetCard
                    )
                );


            petsContainer.innerHTML =
                renderedPets.join(
                    ""
                );


            petsContainer
                .querySelectorAll(
                    "[data-admin-pet-photo]"
                )
                .forEach(
                    image => {


                        image.addEventListener(
                            "error",
                            () => {


                                image.src =
                                    "./assets/default-pet-avatar.webp";

                            },
                            {
                                once:
                                    true
                            }
                        );

                    }
                );


        } else {


            petsContainer.innerHTML =
                `

                    <div class="admin-client-household-empty">

                        <strong>
                            No pets added
                        </strong>

                        <span>
                            This household does not have any pet profiles yet.
                        </span>

                    </div>

                `;

        }

    }


    const activityContainer =
        document.getElementById(
            "admin-client-household-activity"
        );


    if (
        activityContainer
    ) {


        if (
            visits.length >
            0
        ) {


            const recentVisits =
                visits.slice(
                    0,
                    4
                );


            activityContainer.innerHTML =
                `

                    ${recentVisits
                        .map(
                            buildAdminClientVisitItem
                        )
                        .join(
                            ""
                        )}

                    ${
                        visits.length >
                        4

                            ? `

                                <button
                                    type="button"
                                    class="admin-client-view-history-button"
                                    data-client-history="${escapeHtml(
                                        String(
                                            clientId
                                        )
                                    )}"
                                >
                                    View all ${visits.length} visits
                                </button>

                            `

                            : ""
                    }

                `;


        } else {


            activityContainer.innerHTML =
                `

                    <div class="admin-client-household-empty">

                        <strong>
                            No service history
                        </strong>

                        <span>
                            Visits for this household will appear here.
                        </span>

                    </div>

                `;

        }

    }


    window.scrollTo({
        top:
            0,

        left:
            0,

        behavior:
            "auto"
    });

}

// ========================================
// CLOSE CLIENT HOUSEHOLD
// ========================================

function closeAdminClientHousehold() {


    const directoryHeading =
        document.querySelector(
            ".admin-client-directory-heading"
        );


    const search =
        document.querySelector(
            ".admin-client-search"
        );


    const list =
        document.getElementById(
            "admin-client-directory-list"
        );


    const detail =
        document.getElementById(
            "admin-client-household-detail"
        );


    if (
        directoryHeading
    ) {

        directoryHeading.hidden =
            false;

    }


    if (
        search
    ) {

        search.hidden =
            false;

    }


    if (
        list
    ) {

        list.hidden =
            false;

    }


    if (
        detail
    ) {

        detail.hidden =
            true;

    }


    window.scrollTo({
        top:
            0,

        left:
            0,

        behavior:
            "auto"
    });

}


// ========================================
// CLIENT SERVICE HISTORY
// ========================================

function renderAdminClientVisitHistory(
    clientId,
    showAll = false
) {


    const activityContainer =
        document.getElementById(
            "admin-client-household-activity"
        );


    if (
        !activityContainer
    ) {

        return;

    }


    const visits =
        getAdminClientVisits(
            clientId
        );


    if (
        visits.length ===
        0
    ) {


        activityContainer.innerHTML =
            `

                <div class="admin-client-household-empty">

                    <strong>
                        No service history
                    </strong>

                    <span>
                        Visits for this household will appear here.
                    </span>

                </div>

            `;


        return;

    }


    const visibleVisits =
        showAll

            ? visits

            : visits.slice(
                0,
                4
            );


    activityContainer.innerHTML =
        `

            ${visibleVisits
                .map(
                    buildAdminClientVisitItem
                )
                .join(
                    ""
                )}

            ${
                visits.length >
                4

                    ? `

                        <button
                            type="button"
                            class="admin-client-view-history-button"
                            ${
                                showAll

                                    ? `data-client-history-collapse="${escapeHtml(
                                        String(
                                            clientId
                                        )
                                    )}"`

                                    : `data-client-history="${escapeHtml(
                                        String(
                                            clientId
                                        )
                                    )}"`
                            }
                        >
                            ${
                                showAll

                                    ? "Show recent visits"

                                    : `View all ${visits.length} visits`
                            }
                        </button>

                    `

                    : ""
            }

        `;

}

// ========================================
// CLIENT PRICING TIER LABEL
// ========================================

function getAdminClientPricingTierLabel(
    pricingTier
) {

    return (
        pricingTier ===
        "grandfathered"

            ? "Legacy"

            : "Standard"
    );

}


// ========================================
// SAVE CLIENT PRICING TIER
// ========================================

async function saveAdminClientPricingTier(
    clientId,
    pricingTier
) {


    const {
        error
    } =
        await supabaseClient
            .rpc(
                "update_admin_client_pricing_tier",
                {
                    p_client_id:
                        clientId,

                    p_pricing_tier:
                        pricingTier
                }
            );


    if (
        error
    ) {

        throw error;

    }


    const profile =
        allProfiles.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    clientId
                )
        );


    if (
        profile
    ) {

        profile.pricing_tier =
            pricingTier;

    }

}


// ========================================
// CLIENT HOUSEHOLD ACTIONS
// ========================================

document.addEventListener(
    "click",
    async event => {


        // ========================================
        // VIEW HOUSEHOLD
        // ========================================

        const viewButton =
            event.target.closest(
                "[data-client-view]"
            );


        if (
            viewButton
        ) {


            openAdminClientHousehold(
                viewButton.dataset.clientView
            );


            return;

        }


        // ========================================
        // VIEW FULL SERVICE HISTORY
        // ========================================

        const historyButton =
            event.target.closest(
                "[data-client-history]"
            );


        if (
            historyButton
        ) {


            renderAdminClientVisitHistory(
                historyButton.dataset.clientHistory,
                true
            );


            return;

        }


        // ========================================
        // COLLAPSE SERVICE HISTORY
        // ========================================

        const collapseHistoryButton =
            event.target.closest(
                "[data-client-history-collapse]"
            );


        if (
            collapseHistoryButton
        ) {


            renderAdminClientVisitHistory(
                collapseHistoryButton.dataset.clientHistoryCollapse,
                false
            );


            document
                .querySelector(
                    ".admin-client-household-section:last-of-type"
                )
                ?.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "start"
                });


            return;

        }


        // ========================================
        // EDIT PRICING TIER
        // ========================================

        const pricingTierEditButton =
            event.target.closest(
                "#admin-client-pricing-tier-edit"
            );


        if (
            pricingTierEditButton
        ) {


            const card =
                pricingTierEditButton.closest(
                    ".admin-client-pricing-tier-card"
                );


            const display =
                card?.querySelector(
                    ".admin-client-pricing-tier-display"
                );


            const editor =
                card?.querySelector(
                    ".admin-client-pricing-tier-editor"
                );


            if (
                display
            ) {

                display.hidden =
                    true;

            }


            if (
                editor
            ) {

                editor.hidden =
                    false;

            }


            return;

        }


        // ========================================
        // CANCEL PRICING TIER EDIT
        // ========================================

        const pricingTierCancelButton =
            event.target.closest(
                "#admin-client-pricing-tier-cancel"
            );


        if (
            pricingTierCancelButton
        ) {


            const select =
                document.getElementById(
                    "admin-client-pricing-tier-select"
                );


            const clientId =
                select?.dataset
                    .clientId;


            const profile =
                allProfiles.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(
                            clientId
                        )
                );


            if (
                select
            ) {

                select.value =
                    profile?.pricing_tier ===
                    "grandfathered"

                        ? "grandfathered"

                        : "standard";

            }


            const card =
                pricingTierCancelButton.closest(
                    ".admin-client-pricing-tier-card"
                );


            const display =
                card?.querySelector(
                    ".admin-client-pricing-tier-display"
                );


            const editor =
                card?.querySelector(
                    ".admin-client-pricing-tier-editor"
                );


            if (
                editor
            ) {

                editor.hidden =
                    true;

            }


            if (
                display
            ) {

                display.hidden =
                    false;

            }


            return;

        }


        // ========================================
        // SAVE PRICING TIER
        // ========================================

        const pricingTierSaveButton =
            event.target.closest(
                "#admin-client-pricing-tier-save"
            );


        if (
            pricingTierSaveButton
        ) {


            const select =
                document.getElementById(
                    "admin-client-pricing-tier-select"
                );


            const clientId =
                select?.dataset
                    .clientId;


            const pricingTier =
                select?.value;


            if (
                !clientId ||
                !pricingTier
            ) {

                return;

            }


            const cancelButton =
                document.getElementById(
                    "admin-client-pricing-tier-cancel"
                );


            const originalSaveText =
                pricingTierSaveButton
                    .textContent;


            pricingTierSaveButton.disabled =
                true;


            if (
                cancelButton
            ) {

                cancelButton.disabled =
                    true;

            }


            pricingTierSaveButton.textContent =
                "Saving...";


            try {


                await saveAdminClientPricingTier(
                    clientId,
                    pricingTier
                );


                const displayValue =
                    document.getElementById(
                        "admin-client-household-pricing-tier"
                    );


                if (
                    displayValue
                ) {

                    displayValue.textContent =
                        getAdminClientPricingTierLabel(
                            pricingTier
                        );

                }


                const card =
                    pricingTierSaveButton.closest(
                        ".admin-client-pricing-tier-card"
                    );


                const display =
                    card?.querySelector(
                        ".admin-client-pricing-tier-display"
                    );


                const editor =
                    card?.querySelector(
                        ".admin-client-pricing-tier-editor"
                    );


                if (
                    editor
                ) {

                    editor.hidden =
                        true;

                }


                if (
                    display
                ) {

                    display.hidden =
                        false;

                }


                console.log(
                    "Updated client pricing tier:",
                    clientId,
                    pricingTier
                );


            } catch (
                error
            ) {


                console.error(
                    "Unable to update client pricing tier:",
                    error
                );


            } finally {


                pricingTierSaveButton.disabled =
                    false;


                pricingTierSaveButton.textContent =
                    originalSaveText;


                if (
                    cancelButton
                ) {

                    cancelButton.disabled =
                        false;

                }

            }


            return;

        }


        // ========================================
        // BACK TO CLIENT DIRECTORY
        // ========================================

        const backButton =
            event.target.closest(
                "#admin-client-household-back"
            );


        if (
            backButton
        ) {

            closeAdminClientHousehold();

        }

    }
);

// ========================================
// ADMIN APP NAVIGATION STATE
// ========================================

let activeAdminScreen =
    "home";


let adminHomeSummaryTimer =
    null;


const ADMIN_SCREEN_TITLES = {

    home:
        "Home",

    schedule:
        "Schedule",

    clients:
        "Clients",

    messages:
        "Messages",

    more:
        "More"

};


// ========================================
// START HOME SUMMARY TIMER
// ========================================

function startAdminHomeSummaryTimer() {


    if (
        adminHomeSummaryTimer
    ) {

        clearInterval(
            adminHomeSummaryTimer
        );

    }


    renderAdminTodaySummary();


    adminHomeSummaryTimer =
        setInterval(
            () => {

                if (
                    activeAdminScreen ===
                    "home"
                ) {

                    renderAdminTodaySummary();

                }

            },
            1000
        );

}


// ========================================
// STOP HOME SUMMARY TIMER
// ========================================

function stopAdminHomeSummaryTimer() {


    if (
        !adminHomeSummaryTimer
    ) {

        return;

    }


    clearInterval(
        adminHomeSummaryTimer
    );


    adminHomeSummaryTimer =
        null;

}

// ========================================
// SETUP ADMIN APP NAVIGATION
// ========================================
function setupAdminAppNavigation() {

    const navButtons =
        document.querySelectorAll(
            "[data-admin-screen]"
        );


    navButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const screenName =
                        String(
                            button.dataset.adminScreen ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    if (!screenName) {
                        return;
                    }


                    // ========================================
                    // MESSAGES USE EXISTING DRAWER
                    // ========================================

                    if (
                        screenName ===
                        "messages"
                    ) {

                        setAdminNavigationState(
                            "messages"
                        );


                        openAdminMessaging();


                        return;

                    }


                    showAdminAppScreen(
                        screenName
                    );

                }
            );

        }
    );


    // ========================================
    // RESTORE NAV AFTER MESSAGE DRAWER CLOSE
    // ========================================

    const messageCloseButton =
        document.getElementById(
            "admin-message-close"
        );


    const messageBackdrop =
        document.getElementById(
            "admin-message-backdrop"
        );


    messageCloseButton
        ?.addEventListener(
            "click",
            restoreAdminNavigationState
        );


    messageBackdrop
        ?.addEventListener(
            "click",
            restoreAdminNavigationState
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                restoreAdminNavigationState();

            }

        }
    );


    // ========================================
    // FLOATING MESSAGE BUTTON
    // ========================================

    const messageLauncher =
        document.getElementById(
            "admin-message-launcher"
        );


    messageLauncher
        ?.addEventListener(
            "click",
            () => {

                setAdminNavigationState(
                    "messages"
                );

            }
        );


    // ========================================
    // INITIAL SCREEN
    // ========================================

    showAdminAppScreen(
        activeAdminScreen
    );

}


// ========================================
// SHOW ADMIN APP SCREEN
// ========================================

function showAdminAppScreen(
    screenName
) {

    const validScreens =
        [
            "home",
            "schedule",
            "clients",
            "more"
        ];


    if (
        !validScreens.includes(
            screenName
        )
    ) {

        return;

    }


    // ========================================
    // CLOSE MESSAGE DRAWER
    // ========================================

    closeAdminMessaging();


    // ========================================
    // UPDATE ACTIVE SCREEN
    // ========================================

    activeAdminScreen =
        screenName;


    const panels =
        document.querySelectorAll(
            "[data-admin-screen-panel]"
        );


    panels.forEach(
        panel => {

            const isActive =
                panel.dataset.adminScreenPanel ===
                screenName;


            panel.hidden =
                !isActive;


            panel.classList.toggle(
                "admin-app-screen-active",
                isActive
            );

        }
    );


    // ========================================
    // UPDATE NAVIGATION
    // ========================================

    setAdminNavigationState(
        screenName
    );
    
    // ========================================
    // REFRESH HOME
    // ========================================
    
    if (
        screenName ===
        "home"
    ) {
    
        startAdminHomeSummaryTimer();
    
        renderAdminNeedsAttention();
    
        renderAdminBestVisitRoute();
    
        renderAdminFinancialSnapshot();
    
    } else {
    
        stopAdminHomeSummaryTimer();
    
    }
    
    // ========================================
    // REFRESH SCHEDULE
    // ========================================
    
    if (
        screenName ===
        "schedule"
    ) {
    
        renderAdminCalendar();
    
        renderAdminDayServices();
    
    }
    
    
    // ========================================
    // REFRESH CLIENTS
    // ========================================
    
    if (
        screenName ===
        "clients"
    ) {
    
        closeAdminClientHousehold();
    
        setupAdminClientDirectory();
    
    }
    
    
    // ========================================
    // RETURN TO TOP
    // ========================================

    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto"
    });

}


// ========================================
// SET ADMIN NAVIGATION STATE
// ========================================

function setAdminNavigationState(
    screenName
) {

    const navButtons =
        document.querySelectorAll(
            "[data-admin-screen]"
        );


    navButtons.forEach(
        button => {

            const isActive =
                button.dataset.adminScreen ===
                screenName;


            button.classList.toggle(
                "admin-app-nav-item-active",
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


    const title =
        document.getElementById(
            "admin-screen-title"
        );


    if (title) {

        title.textContent =
            ADMIN_SCREEN_TITLES[
                screenName
            ] ||
            "Home";

    }

}


// ========================================
// RESTORE ADMIN NAVIGATION STATE
// ========================================

function restoreAdminNavigationState() {

    setAdminNavigationState(
        activeAdminScreen
    );

}


// ========================================
// SERVICES & PRICING MODAL
// ========================================

const adminServicesPricingModal =
    document.getElementById(
        "admin-services-pricing-modal"
    );


const adminOpenServicesPricingButton =
    document.getElementById(
        "admin-open-services-pricing"
    );


const adminServicesPricingCloseButton =
    document.getElementById(
        "admin-services-pricing-close"
    );


// ========================================
// SERVICE MENU HELPERS
// ========================================

function closeAllAdminServiceMenus(
    exceptKey =
        null
) {


    const menuButtons =
        document.querySelectorAll(
            "[data-service-menu]"
        );


    const menuDropdowns =
        document.querySelectorAll(
            "[data-service-dropdown]"
        );


    menuButtons.forEach(
        button => {


            const serviceKey =
                button.dataset
                    .serviceMenu;


            if (
                serviceKey ===
                exceptKey
            ) {

                return;

            }


            button.setAttribute(
                "aria-expanded",
                "false"
            );

        }
    );


    menuDropdowns.forEach(
        dropdown => {


            const serviceKey =
                dropdown.dataset
                    .serviceDropdown;


            if (
                serviceKey ===
                exceptKey
            ) {

                return;

            }


            dropdown.hidden =
                true;

        }
    );

}


// ========================================
// OPEN / CLOSE SERVICE MENU
// ========================================

function toggleAdminServiceMenu(
    serviceKey
) {


    const menuButton =
        document.querySelector(
            `[data-service-menu="${serviceKey}"]`
        );


    const menuDropdown =
        document.querySelector(
            `[data-service-dropdown="${serviceKey}"]`
        );


    if (
        !menuButton ||
        !menuDropdown
    ) {

        return;

    }


    const isOpen =
        menuButton.getAttribute(
            "aria-expanded"
        ) ===
        "true";


    closeAllAdminServiceMenus();


    if (
        isOpen
    ) {

        return;

    }


    menuButton.setAttribute(
        "aria-expanded",
        "true"
    );


    menuDropdown.hidden =
        false;

}


// ========================================
// APPLY SERVICE STATE
// ========================================

function applyAdminServiceState(
    serviceKey,
    isActive
) {


    const menuButton =
        document.querySelector(
            `[data-service-menu="${serviceKey}"]`
        );


    const serviceCard =
        menuButton?.closest(
            ".admin-service-pricing-card"
        );


    if (
        !serviceCard
    ) {

        return;

    }


    const status =
        serviceCard.querySelector(
            ".admin-service-status"
        );


    const inputs =
        serviceCard.querySelectorAll(
            "input"
        );


    const actionButton =
        serviceCard.querySelector(
            "[data-service-action='deactivate'], [data-service-action='activate']"
        );


    serviceCard.classList.toggle(
        "admin-service-is-inactive",
        !isActive
    );


    if (
        status
    ) {

        status.textContent =
            isActive
                ? "Active"
                : "Inactive";

    }


    inputs.forEach(
        input => {

            input.disabled =
                !isActive;

        }
    );


    if (
        actionButton
    ) {

        actionButton.dataset
            .serviceAction =
            isActive
                ? "deactivate"
                : "activate";


        actionButton.textContent =
            isActive
                ? "Deactivate Service"
                : "Activate Service";

    }


    // ========================================
    // BOARDING SURCHARGES
    // ========================================

    if (
        serviceKey ===
        "boarding"
    ) {


        const boardingFees =
            serviceCard
                .nextElementSibling;


        if (
            boardingFees?.classList
                .contains(
                    "admin-boarding-fees"
                )
        ) {


            boardingFees.classList.toggle(
                "admin-service-is-inactive",
                !isActive
            );


            boardingFees
                .querySelectorAll(
                    "input"
                )
                .forEach(
                    input => {

                        input.disabled =
                            !isActive;

                    }
                );

        }

    }

}


// ========================================
// SET SERVICE PRICE INPUTS
// ========================================

function setAdminServicePrices(
    serviceKey,
    standardPrice,
    grandfatheredPrice
) {


    const menuButton =
        document.querySelector(
            `[data-service-menu="${serviceKey}"]`
        );


    const serviceCard =
        menuButton?.closest(
            ".admin-service-pricing-card"
        );


    if (
        !serviceCard
    ) {

        return;

    }


    const inputs =
        serviceCard.querySelectorAll(
            ".admin-service-pricing-rates input"
        );


    if (
        inputs[0]
    ) {

        inputs[0].value =
            Number(
                standardPrice ||
                0
            );

    }


    if (
        inputs[1]
    ) {

        inputs[1].value =
            Number(
                grandfatheredPrice ||
                0
            );

    }

}


// ========================================
// LOAD ADMIN SERVICE PRICING
// ========================================

async function loadAdminServicePricing() {


    const {
        data,
        error
    } =
        await supabaseClient
            .rpc(
                "get_admin_service_prices"
            );


    if (
        error
    ) {


        console.error(
            "Admin service pricing load error:",
            error
        );


        throw error;

    }


    const prices =
        data ||
        [];


    // ========================================
    // FIND PRICE ROW
    // ========================================

    function findPrice(
        serviceType,
        serviceOption,
        pricingTier
    ) {


        return prices.find(
            row =>

                row.service_type ===
                    serviceType &&

                row.service_option ===
                    serviceOption &&

                row.pricing_tier ===
                    pricingTier
        ) ||
        null;

    }


    // ========================================
    // 15 MINUTE WALK / DROP-IN
    // ========================================

    const fifteenStandard =
        findPrice(
            "dog_walking",
            "15_min",
            "standard"
        );


    const fifteenGrandfathered =
        findPrice(
            "dog_walking",
            "15_min",
            "grandfathered"
        );


    setAdminServicePrices(
        "15-minute",
        fifteenStandard?.base_price,
        fifteenGrandfathered?.base_price
    );


    applyAdminServiceState(
        "15-minute",
        Boolean(
            fifteenStandard?.active &&
            fifteenGrandfathered?.active
        )
    );


    // ========================================
    // 30 MINUTE WALK / DROP-IN
    // ========================================

    const thirtyStandard =
        findPrice(
            "dog_walking",
            "30_min",
            "standard"
        );


    const thirtyGrandfathered =
        findPrice(
            "dog_walking",
            "30_min",
            "grandfathered"
        );


    setAdminServicePrices(
        "30-minute",
        thirtyStandard?.base_price,
        thirtyGrandfathered?.base_price
    );


    applyAdminServiceState(
        "30-minute",
        Boolean(
            thirtyStandard?.active &&
            thirtyGrandfathered?.active
        )
    );


    // ========================================
    // 60 MINUTE WALK / DROP-IN
    // ========================================

    const sixtyStandard =
        findPrice(
            "dog_walking",
            "60_min",
            "standard"
        );


    const sixtyGrandfathered =
        findPrice(
            "dog_walking",
            "60_min",
            "grandfathered"
        );


    setAdminServicePrices(
        "60-minute",
        sixtyStandard?.base_price,
        sixtyGrandfathered?.base_price
    );


    applyAdminServiceState(
        "60-minute",
        Boolean(
            sixtyStandard?.active &&
            sixtyGrandfathered?.active
        )
    );


    // ========================================
    // 4 HOUR PET SITTING
    // ========================================

    const petSitting4Standard =
        findPrice(
            "pet_sitting",
            "basic_4_hour",
            "standard"
        );


    const petSitting4Grandfathered =
        findPrice(
            "pet_sitting",
            "basic_4_hour",
            "grandfathered"
        );


    setAdminServicePrices(
        "pet-sitting-4-hour",
        petSitting4Standard?.base_price,
        petSitting4Grandfathered?.base_price
    );


    applyAdminServiceState(
        "pet-sitting-4-hour",
        Boolean(
            petSitting4Standard?.active &&
            petSitting4Grandfathered?.active
        )
    );


    // ========================================
    // 8 HOUR PET SITTING
    // ========================================

    const petSitting8Standard =
        findPrice(
            "pet_sitting",
            "standard_8_hour",
            "standard"
        );


    const petSitting8Grandfathered =
        findPrice(
            "pet_sitting",
            "standard_8_hour",
            "grandfathered"
        );


    setAdminServicePrices(
        "pet-sitting-8-hour",
        petSitting8Standard?.base_price,
        petSitting8Grandfathered?.base_price
    );


    applyAdminServiceState(
        "pet-sitting-8-hour",
        Boolean(
            petSitting8Standard?.active &&
            petSitting8Grandfathered?.active
        )
    );


    // ========================================
    // 12 HOUR PET SITTING
    // ========================================

    const petSitting12Standard =
        findPrice(
            "pet_sitting",
            "vip_12_hour",
            "standard"
        );


    const petSitting12Grandfathered =
        findPrice(
            "pet_sitting",
            "vip_12_hour",
            "grandfathered"
        );


    setAdminServicePrices(
        "pet-sitting-12-hour",
        petSitting12Standard?.base_price,
        petSitting12Grandfathered?.base_price
    );


    applyAdminServiceState(
        "pet-sitting-12-hour",
        Boolean(
            petSitting12Standard?.active &&
            petSitting12Grandfathered?.active
        )
    );


    // ========================================
    // BOARDING
    // ========================================

    const boardingStandard =
        findPrice(
            "dog_boarding",
            "vip_overnight",
            "standard"
        );


    const boardingGrandfathered =
        findPrice(
            "dog_boarding",
            "vip_overnight",
            "grandfathered"
        );


    setAdminServicePrices(
        "boarding",
        boardingStandard?.base_price,
        boardingGrandfathered?.base_price
    );


    applyAdminServiceState(
        "boarding",
        Boolean(
            boardingStandard?.active &&
            boardingGrandfathered?.active
        )
    );


    // ========================================
    // BOARDING SURCHARGES
    // ========================================

    const holidayInput =
        document.querySelector(
            'input[aria-label="Holiday boarding surcharge"]'
        );


    const largeDogInput =
        document.querySelector(
            'input[aria-label="Large dog boarding surcharge"]'
        );


    if (
        holidayInput
    ) {

        holidayInput.value =
            Number(
                boardingStandard
                    ?.holiday_fee ||
                0
            );

    }


    if (
        largeDogInput
    ) {

        largeDogInput.value =
            Number(
                boardingStandard
                    ?.large_dog_fee ||
                0
            );

    }


    // ========================================
    // LOCK LOADED PRICES
    // ========================================

    lockAllAdminServiceInputs();


    console.log(
        "Loaded admin service pricing:",
        prices.length
    );

}

// ========================================
// OPEN SERVICES & PRICING
// ========================================

async function openAdminServicesPricingModal() {


    if (
        !adminServicesPricingModal
    ) {

        return;

    }


    adminServicesPricingModal.hidden =
        false;


    document.body.classList.add(
        "admin-services-pricing-open"
    );


    try {


        await loadAdminServicePricing();


    } catch (
        error
    ) {


        console.error(
            "Unable to load Services & Pricing:",
            error
        );

    }


    adminServicesPricingCloseButton
        ?.focus();

}

// ========================================
// CLOSE SERVICES & PRICING
// ========================================

function closeAdminServicesPricingModal() {


    if (
        !adminServicesPricingModal
    ) {

        return;

    }


    closeAllAdminServiceMenus();


    adminServicesPricingModal.hidden =
        true;


    document.body.classList.remove(
        "admin-services-pricing-open"
    );


    adminOpenServicesPricingButton
        ?.focus();

}


// ========================================
// OPEN BUTTON
// ========================================

adminOpenServicesPricingButton
    ?.addEventListener(

        "click",

        openAdminServicesPricingModal

    );


// ========================================
// CLOSE BUTTON
// ========================================

adminServicesPricingCloseButton
    ?.addEventListener(

        "click",

        closeAdminServicesPricingModal

    );


// ========================================
// SERVICE EDIT STATE
// ========================================

const adminServiceEditSnapshots =
    new Map();


// ========================================
// GET SERVICE CARD
// ========================================

function getAdminServiceCard(
    serviceKey
) {


    const menuButton =
        document.querySelector(
            `[data-service-menu="${serviceKey}"]`
        );


    return (
        menuButton?.closest(
            ".admin-service-pricing-card"
        ) ||
        null
    );

}


// ========================================
// GET SERVICE EDIT INPUTS
// ========================================

function getAdminServiceEditInputs(
    serviceKey
) {


    const serviceCard =
        getAdminServiceCard(
            serviceKey
        );


    if (
        !serviceCard
    ) {

        return [];

    }


    const inputs =
        [
            ...serviceCard.querySelectorAll(
                ".admin-service-pricing-rates input"
            )
        ];


    // ========================================
    // BOARDING SURCHARGES
    // ========================================

    if (
        serviceKey ===
        "boarding"
    ) {


        const boardingFees =
            serviceCard
                .nextElementSibling;


        if (
            boardingFees?.classList
                .contains(
                    "admin-boarding-fees"
                )
        ) {


            inputs.push(
                ...boardingFees.querySelectorAll(
                    "input"
                )
            );

        }

    }


    return inputs;

}


// ========================================
// LOCK SERVICE PRICE INPUTS
// ========================================

function lockAdminServiceInputs(
    serviceKey
) {


    const serviceCard =
        getAdminServiceCard(
            serviceKey
        );


    if (
        !serviceCard
    ) {

        return;

    }


    const isActive =
        !serviceCard.classList.contains(
            "admin-service-is-inactive"
        );


    getAdminServiceEditInputs(
        serviceKey
    )
        .forEach(
            input => {


                input.readOnly =
                    true;


                input.disabled =
                    !isActive;

            }
        );

}


// ========================================
// LOCK ALL SERVICE PRICE INPUTS
// ========================================

function lockAllAdminServiceInputs() {


    [
        "15-minute",
        "30-minute",
        "60-minute",

        "pet-sitting-4-hour",
        "pet-sitting-8-hour",
        "pet-sitting-12-hour",

        "boarding"
    ]
        .forEach(
            serviceKey => {

                lockAdminServiceInputs(
                    serviceKey
                );

            }
        );

}


// ========================================
// ENSURE EDIT ACTION BUTTONS
// ========================================

function ensureAdminServiceEditActions(
    serviceKey
) {


    const serviceCard =
        getAdminServiceCard(
            serviceKey
        );


    if (
        !serviceCard
    ) {

        return null;

    }


    let actions =
        serviceCard.querySelector(
            ".admin-service-edit-actions"
        );


    if (
        actions
    ) {

        return actions;

    }


    actions =
        document.createElement(
            "div"
        );


    actions.className =
        "admin-service-edit-actions";


    actions.innerHTML =
        `

            <button
                type="button"
                class="admin-service-edit-cancel"
                data-service-edit-cancel="${serviceKey}"
            >
                Cancel
            </button>

            <button
                type="button"
                class="admin-service-edit-save"
                data-service-edit-save="${serviceKey}"
            >
                Save
            </button>

        `;


    serviceCard.appendChild(
        actions
    );


    return actions;

}


// ========================================
// BEGIN SERVICE EDIT
// ========================================

function beginAdminServiceEdit(
    serviceKey
) {


    const serviceCard =
        getAdminServiceCard(
            serviceKey
        );


    if (
        !serviceCard
    ) {

        return;

    }


    // ========================================
    // CLOSE ANY OTHER EDIT
    // ========================================

    document
        .querySelectorAll(
            ".admin-service-pricing-card.admin-service-is-editing"
        )
        .forEach(
            card => {


                if (
                    card ===
                    serviceCard
                ) {

                    return;

                }


                const otherMenuButton =
                    card.querySelector(
                        "[data-service-menu]"
                    );


                const otherServiceKey =
                    otherMenuButton?.dataset
                        .serviceMenu;


                if (
                    otherServiceKey
                ) {

                    cancelAdminServiceEdit(
                        otherServiceKey
                    );

                }

            }
        );


    const inputs =
        getAdminServiceEditInputs(
            serviceKey
        );


    // ========================================
    // SAVE ORIGINAL VALUES
    // ========================================

    adminServiceEditSnapshots.set(
        serviceKey,
        inputs.map(
            input =>
                input.value
        )
    );


    ensureAdminServiceEditActions(
        serviceKey
    );


    serviceCard.classList.add(
        "admin-service-is-editing"
    );


    // ========================================
    // BOARDING EDIT STATE
    // ========================================

    if (
        serviceKey ===
        "boarding"
    ) {


        const boardingFees =
            serviceCard
                .nextElementSibling;


        boardingFees?.classList.add(
            "admin-service-is-editing"
        );

    }


    inputs.forEach(
        input => {


            input.disabled =
                false;


            input.readOnly =
                false;

        }
    );


    closeAllAdminServiceMenus();


}

// ========================================
// FINISH SERVICE EDIT
// ========================================

function finishAdminServiceEdit(
    serviceKey
) {


    const serviceCard =
        getAdminServiceCard(
            serviceKey
        );


    if (
        !serviceCard
    ) {

        return;

    }


    serviceCard.classList.remove(
        "admin-service-is-editing"
    );


    // ========================================
    // BOARDING EDIT STATE
    // ========================================

    if (
        serviceKey ===
        "boarding"
    ) {


        const boardingFees =
            serviceCard
                .nextElementSibling;


        boardingFees?.classList.remove(
            "admin-service-is-editing"
        );

    }


    adminServiceEditSnapshots.delete(
        serviceKey
    );


    lockAdminServiceInputs(
        serviceKey
    );

}


// ========================================
// CANCEL SERVICE EDIT
// ========================================

function cancelAdminServiceEdit(
    serviceKey
) {


    const snapshot =
        adminServiceEditSnapshots.get(
            serviceKey
        );


    const inputs =
        getAdminServiceEditInputs(
            serviceKey
        );


    if (
        Array.isArray(
            snapshot
        )
    ) {


        inputs.forEach(
            (
                input,
                index
            ) => {


                if (
                    snapshot[index] !==
                    undefined
                ) {

                    input.value =
                        snapshot[index];

                }

            }
        );

    }


    finishAdminServiceEdit(
        serviceKey
    );

}


// ========================================
// SAVE ADMIN SERVICE PRICING
// ========================================

async function saveAdminServicePricing(
    serviceKey
) {


    const serviceCard =
        getAdminServiceCard(
            serviceKey
        );


    if (
        !serviceCard
    ) {

        return false;

    }


    const priceInputs =
        serviceCard.querySelectorAll(
            ".admin-service-pricing-rates input"
        );


    const standardPrice =
        Number(
            priceInputs[0]?.value ||
            0
        );


    const grandfatheredPrice =
        Number(
            priceInputs[1]?.value ||
            0
        );


    const isActive =
        !serviceCard.classList.contains(
            "admin-service-is-inactive"
        );


    let holidayFee =
        null;


    let largeDogFee =
        null;


    // ========================================
    // BOARDING SURCHARGES
    // ========================================

    if (
        serviceKey ===
        "boarding"
    ) {


        const holidayInput =
            document.querySelector(
                'input[aria-label="Holiday boarding surcharge"]'
            );


        const largeDogInput =
            document.querySelector(
                'input[aria-label="Large dog boarding surcharge"]'
            );


        holidayFee =
            Number(
                holidayInput?.value ||
                0
            );


        largeDogFee =
            Number(
                largeDogInput?.value ||
                0
            );

    }


    const {
        error
    } =
        await supabaseClient
            .rpc(
                "update_admin_service_pricing",
                {
                    p_service_key:
                        serviceKey,

                    p_standard_price:
                        standardPrice,

                    p_grandfathered_price:
                        grandfatheredPrice,

                    p_active:
                        isActive,

                    p_holiday_fee:
                        holidayFee,

                    p_large_dog_fee:
                        largeDogFee
                }
            );


    if (
        error
    ) {


        console.error(
            "Admin service pricing save error:",
            error
        );


        return false;

    }


    console.log(
        "Saved service pricing:",
        serviceKey
    );


    return true;

}


// ========================================
// SERVICE MENU CLICK HANDLER
// ========================================

adminServicesPricingModal
    ?.addEventListener(

        "click",

        async event => {


            // ========================================
            // SAVE EDIT
            // ========================================
            
            const saveEditButton =
                event.target.closest(
                    "[data-service-edit-save]"
                );
            
            
            if (
                saveEditButton
            ) {
            
            
                const serviceKey =
                    saveEditButton.dataset
                        .serviceEditSave;
            
            
                const serviceCard =
                    getAdminServiceCard(
                        serviceKey
                    );
            
            
                const cancelButton =
                    serviceCard?.querySelector(
                        "[data-service-edit-cancel]"
                    );
            
            
                const originalSaveText =
                    saveEditButton.textContent;
            
            
                saveEditButton.disabled =
                    true;
            
            
                if (
                    cancelButton
                ) {
            
                    cancelButton.disabled =
                        true;
            
                }
            
            
                saveEditButton.textContent =
                    "Saving...";
            
            
                try {
            
            
                    const saved =
                        await saveAdminServicePricing(
                            serviceKey
                        );
            
            
                    if (
                        !saved
                    ) {
            
                        return;
            
                    }
            
            
                    // ========================================
                    // EXIT EDIT MODE IMMEDIATELY
                    // ========================================
            
                    finishAdminServiceEdit(
                        serviceKey
                    );
            
            
                    // ========================================
                    // RELOAD SAVED DATABASE VALUES
                    // ========================================
            
                    await loadAdminServicePricing();
            
            
                } catch (
                    error
                ) {
            
            
                    console.error(
                        "Unable to finish service price save:",
                        error
                    );
            
            
                } finally {
            
            
                    saveEditButton.disabled =
                        false;
            
            
                    if (
                        cancelButton
                    ) {
            
                        cancelButton.disabled =
                            false;
            
                    }
            
            
                    saveEditButton.textContent =
                        originalSaveText ||
                        "Save";
            
                }
            
            
                return;
            
            }

            // ========================================
            // CANCEL EDIT
            // ========================================

            const cancelEditButton =
                event.target.closest(
                    "[data-service-edit-cancel]"
                );


            if (
                cancelEditButton
            ) {


                cancelAdminServiceEdit(
                    cancelEditButton.dataset
                        .serviceEditCancel
                );


                return;

            }


            // ========================================
            // THREE-DOT MENU BUTTON
            // ========================================

            const menuButton =
                event.target.closest(
                    "[data-service-menu]"
                );


            if (
                menuButton
            ) {


                event.stopPropagation();


                toggleAdminServiceMenu(
                    menuButton.dataset
                        .serviceMenu
                );


                return;

            }


            // ========================================
            // MENU ACTION
            // ========================================

            const menuAction =
                event.target.closest(
                    "[data-service-action]"
                );


            if (
                !menuAction
            ) {


                const clickedInsideDropdown =
                    event.target.closest(
                        ".admin-service-menu-dropdown"
                    );


                if (
                    clickedInsideDropdown
                ) {

                    return;

                }


                closeAllAdminServiceMenus();


                return;

            }


            event.stopPropagation();


            const action =
                menuAction.dataset
                    .serviceAction;


            const serviceKey =
                menuAction.dataset
                    .serviceKey;


            // ========================================
            // EDIT SERVICE
            // ========================================

            if (
                action ===
                "edit"
            ) {


                beginAdminServiceEdit(
                    serviceKey
                );


                return;

            }


            // ========================================
            // DEACTIVATE SERVICE
            // ========================================

            if (
                action ===
                "deactivate"
            ) {


                applyAdminServiceState(
                    serviceKey,
                    false
                );


                closeAllAdminServiceMenus();


                const saved =
                    await saveAdminServicePricing(
                        serviceKey
                    );


                if (
                    !saved
                ) {

                    await loadAdminServicePricing();

                }


                lockAdminServiceInputs(
                    serviceKey
                );


                return;

            }


            // ========================================
            // ACTIVATE SERVICE
            // ========================================

            if (
                action ===
                "activate"
            ) {


                applyAdminServiceState(
                    serviceKey,
                    true
                );


                closeAllAdminServiceMenus();


                const saved =
                    await saveAdminServicePricing(
                        serviceKey
                    );


                if (
                    !saved
                ) {

                    await loadAdminServicePricing();

                }


                lockAdminServiceInputs(
                    serviceKey
                );


                return;

            }

        }

    );


// ========================================
// SERVICES PRICING BACKDROP CLOSE
// ========================================

adminServicesPricingModal
    ?.addEventListener(

        "click",

        event => {


            const closeTarget =
                event.target.closest(
                    "[data-close-services-pricing]"
                );


            if (
                !closeTarget
            ) {

                return;

            }


            closeAdminServicesPricingModal();

        }

    );

// ========================================
// CLOSE MENUS OUTSIDE MODAL
// ========================================

document.addEventListener(

    "click",

    event => {


        if (
            event.target.closest(
                ".admin-service-menu-wrap"
            )
        ) {

            return;

        }


        closeAllAdminServiceMenus();

    }

);


// ========================================
// ESCAPE KEY
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


        const openServiceMenu =
            document.querySelector(
                '[data-service-menu][aria-expanded="true"]'
            );


        if (
            openServiceMenu
        ) {


            closeAllAdminServiceMenus();


            openServiceMenu.focus();


            return;

        }


        if (
            !adminServicesPricingModal ||
            adminServicesPricingModal.hidden
        ) {

            return;

        }


        closeAdminServicesPricingModal();

    }

);

// ========================================
// ADMIN PORTAL INTRO
// ========================================

function startAdminPortalIntro() {

    const intro =
        document.getElementById(
            "admin-portal-intro"
        );

    const video =
        document.getElementById(
            "admin-portal-intro-video"
        );

    const inactiveIntro = {
        dashboardFinished() {}
    };


    if (
        !intro ||
        !video
    ) {

        return inactiveIntro;

    }


    const isMobile =
        window.matchMedia(
            "(max-width: 700px)"
        ).matches;

    const isInstalled =
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches ||
        window.navigator.standalone === true;

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    if (
        (!isMobile && !isInstalled) ||
        reducedMotion
    ) {

        intro.remove();

        return inactiveIntro;

    }


    let dismissed =
        false;

    let dashboardFinished =
        false;

    let videoFinished =
        false;

    let safetyTimer;


    function dismissIntro() {

        if (
            dismissed
        ) {

            return;

        }


        dismissed =
            true;


        window.clearTimeout(
            safetyTimer
        );


        document.body.classList.remove(
            "admin-portal-intro-open"
        );


        intro.classList.add(
            "is-leaving"
        );


        window.setTimeout(
            () => {

                video.pause();

                intro.remove();

            },
            400
        );

    }


    function finishWhenReady() {

        if (
            dashboardFinished &&
            videoFinished
        ) {

            dismissIntro();

        }

    }


    video.addEventListener(
        "ended",
        () => {

            videoFinished =
                true;

            finishWhenReady();

        },
        {
            once: true
        }
    );


    video.addEventListener(
        "error",
        dismissIntro,
        {
            once: true
        }
    );


    video
        .querySelector(
            "source"
        )
        ?.addEventListener(
            "error",
            dismissIntro,
            {
                once: true
            }
        );


    safetyTimer =
        window.setTimeout(
            dismissIntro,
            15000
        );


    video.muted =
        true;

    video.defaultMuted =
        true;


    intro.classList.add(
        "is-active"
    );


    document.body.classList.add(
        "admin-portal-intro-open"
    );


    try {

        const playback =
            video.play();


        if (
            playback &&
            typeof playback.catch ===
                "function"
        ) {

            playback.catch(
                dismissIntro
            );

        }

    } catch (error) {

        dismissIntro();

    }


    return {

        dashboardFinished(
            success
        ) {

            dashboardFinished =
                true;


            if (
                !success
            ) {

                dismissIntro();

                return;

            }


            finishWhenReady();

        }

    };

}


// ========================================
// START
// ========================================

(async function initializeAdminPortal() {

    const adminIntro =
        startAdminPortalIntro();

    let dashboardReady =
        false;


    try {

        await loadAdminDashboard();


        const adminContent =
            document.getElementById(
                "admin-content"
            );


        dashboardReady =
            adminContent?.style.display ===
            "block";


        if (
            currentUser &&
            currentProfile
        ) {

            await initializeAdminMessaging();

        }


        // ========================================
        // ADMIN APP NAVIGATION
        // ========================================

        setupAdminAppNavigation();

    } catch (error) {

        console.error(
            "Admin portal initialization failed:",
            error
        );

    } finally {

        adminIntro.dashboardFinished(
            dashboardReady
        );

    }


})();
