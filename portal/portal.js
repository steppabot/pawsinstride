const SUPABASE_URL =
    "https://xyhndwopvlmnxjkthtkl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_U3OIYatZuBUe8Y6Vq0DS2w_IMacau2j";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// -------------------------
// LOGIN
// -------------------------

const loginForm = document.getElementById("login-form");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("login-message");


        message.textContent = "Signing in...";


        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            console.error("Login error:", error);

            message.textContent =
                "Incorrect email or password.";

            return;
        }


        console.log("Logged in user:", data.user);
        console.log("Login session:", data.session);


        if (!data.session) {

            message.textContent =
                "Login succeeded, but no session was created.";

            return;
        }


        window.location.href =
            "./dashboard.html";

    });

}


// -------------------------
// DASHBOARD
// -------------------------

async function loadDashboard() {

    const dashboardContent =
        document.getElementById("dashboard-content");

    const loading =
        document.getElementById("loading");


    // If we are not on dashboard.html,
    // stop here.
    if (!dashboardContent) return;


    // -------------------------
    // GET SAVED LOGIN SESSION
    // -------------------------

    const {
        data: { session },
        error: sessionError
    } = await supabaseClient.auth.getSession();


    console.log("Dashboard session:", session);


    if (sessionError) {

        console.error("Session error:", sessionError);

        loading.textContent =
            "There was a problem loading your login session.";

        return;
    }


    if (!session) {

        console.log("No login session found.");

        window.location.href =
            "./login.html";

        return;
    }


    const user = session.user;

    console.log("Logged-in dashboard user:", user);


    // -------------------------
    // GET CLIENT PROFILE
    // -------------------------

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


    if (profileError) {

        console.error("Profile error:", profileError);

        loading.textContent =
            "We couldn't load your client profile.";

        return;
    }


    // -------------------------
    // GET CLIENT PETS
    // -------------------------

    const {
        data: pets,
        error: petsError
    } = await supabaseClient
        .from("pets")
        .select("*")
        .eq("client_id", user.id);


    if (petsError) {

        console.error("Pets error:", petsError);

    }


    // -------------------------
    // GET UPCOMING VISITS
    // -------------------------

    const today =
        new Date().toISOString().split("T")[0];


    const {
        data: visits,
        error: visitsError
    } = await supabaseClient
        .from("visits")
        .select("*")
        .eq("client_id", user.id)
        .gte("visit_date", today)
        .order("visit_date", { ascending: true })
        .order("start_time", { ascending: true });


    if (visitsError) {

        console.error("Visits error:", visitsError);

    }


    // -------------------------
    // DISPLAY CLIENT NAME
    // -------------------------

    const welcomeName =
        document.getElementById("welcome-name");

    welcomeName.textContent =
        `Welcome, ${profile.full_name}`;


    // -------------------------
    // DISPLAY PETS
    // -------------------------

    const petInfo =
        document.getElementById("pet-info");


    if (pets && pets.length > 0) {

        petInfo.innerHTML = pets.map(pet => `
            <div class="pet-card">
                <strong>${pet.name}</strong><br>
                ${pet.breed || ""}
            </div>
        `).join("");

    } else {

        petInfo.textContent =
            "No pets found.";

    }


    // -------------------------
    // DISPLAY UPCOMING VISITS
    // -------------------------

    const visitsContainer =
        document.getElementById("upcoming-visits");


    if (visits && visits.length > 0) {

        visitsContainer.innerHTML = visits.map(visit => {

            const price =
                visit.price !== null
                    ? `$${Number(visit.price).toFixed(2)}`
                    : "";

            const time =
                visit.start_time
                    ? formatTime(visit.start_time)
                    : "";


            return `
                <div class="visit-card">

                    <strong>
                        ${visit.service_name}
                    </strong>

                    <br>

                    ${visit.visit_date}
                    ${time ? `at ${time}` : ""}

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

        }).join("");

    } else {

        visitsContainer.textContent =
            "No upcoming visits.";

    }


    // -------------------------
    // SHOW DASHBOARD
    // -------------------------

    loading.style.display =
        "none";

    dashboardContent.style.display =
        "block";

}


// -------------------------
// FORMAT TIME
// Converts 12:00:00 to 12:00 PM
// -------------------------

function formatTime(timeString) {

    if (!timeString) return "";

    const parts =
        timeString.split(":");

    let hours =
        parseInt(parts[0], 10);

    const minutes =
        parts[1];

    const ampm =
        hours >= 12 ? "PM" : "AM";


    hours =
        hours % 12;

    hours =
        hours || 12;


    return `${hours}:${minutes} ${ampm}`;

}


// Run dashboard loader
loadDashboard();


// -------------------------
// LOGOUT
// -------------------------

const logoutButton =
    document.getElementById("logout-button");


if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href =
            "./login.html";

    });

}
