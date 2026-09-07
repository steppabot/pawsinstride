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

            console.error(error);

            message.textContent =
                "Incorrect email or password.";

            return;
        }


        console.log("Logged in:", data.user);

        window.location.href =
            "dashboard.html";

    });

}

// -------------------------
// DASHBOARD
// -------------------------

async function loadDashboard() {

  const dashboardContent =
    document.getElementById("dashboard-content");

  if (!dashboardContent) return;


  // Get logged-in user
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();


  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }


  // Get client profile
  const { data: profile, error: profileError } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();


  if (profileError) {
    console.error("Profile error:", profileError);
    return;
  }


  // Get pets
  const { data: pets, error: petsError } =
    await supabaseClient
      .from("pets")
      .select("*")
      .eq("client_id", user.id);


  if (petsError) {
    console.error("Pets error:", petsError);
  }


  // Get upcoming visits
  const { data: visits, error: visitsError } =
    await supabaseClient
      .from("visits")
      .select("*")
      .eq("client_id", user.id)
      .gte("visit_date", new Date().toISOString().split("T")[0])
      .order("visit_date", { ascending: true });


  if (visitsError) {
    console.error("Visits error:", visitsError);
  }


  // Display client name
  document.getElementById("welcome-name").textContent =
    `Welcome, ${profile.full_name}`;


  // Display pet
  const petInfo =
    document.getElementById("pet-info");

  if (pets && pets.length > 0) {

    petInfo.innerHTML = pets.map(pet => `
      <div>
        <strong>${pet.name}</strong><br>
        ${pet.breed || ""}
      </div>
    `).join("");

  } else {

    petInfo.textContent =
      "No pets found.";

  }

=
  // Display visits
  const visitsContainer =
    document.getElementById("upcoming-visits");

  if (visits && visits.length > 0) {

    visitsContainer.innerHTML = visits.map(visit => `
      <div class="visit-card">

        <strong>${visit.service_name}</strong><br>

        ${visit.visit_date}
        ${visit.start_time ? `at ${visit.start_time}` : ""}

        <br>

        Status: ${visit.status}

        <br>

        $${Number(visit.price).toFixed(2)}

        <br>

        Payment: ${visit.payment_status}

      </div>
    `).join("");

  } else {

    visitsContainer.textContent =
      "No upcoming visits.";

  }


  document.getElementById("loading").style.display =
    "none";

  dashboardContent.style.display =
    "block";

}


loadDashboard();


// Logout
const logoutButton =
  document.getElementById("logout-button");

if (logoutButton) {

  logoutButton.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    window.location.href =
      "login.html";

  });

}
