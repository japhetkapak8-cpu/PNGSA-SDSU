import { supabase }
from "../../js/supabase.js";


let currentUser = null;


// ========================================
// AUTHENTICATE
// ========================================

async function authenticateMember() {

  const {
    data: { session }
  } =
    await supabase.auth.getSession();


  if (!session) {

    window.location.replace(
      "index.html"
    );

    return false;
  }


  currentUser =
    session.user;


  document.getElementById(
    "memberEmail"
  ).textContent =
    currentUser.email;


  return true;
}



// ========================================
// LOAD PROFILE
// ========================================

async function loadProfile() {

  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select(`
        full_name,
        major,
        year_of_study,
        living_area,
        eligible_to_vote
      `)
      .eq(
        "id",
        currentUser.id
      )
      .single();


  if (
    error ||
    !data
  ) {

    console.error(error);

    return;
  }


  const firstName =
    data.full_name
      ? data.full_name.split(" ")[0]
      : "Member";


  document.getElementById(
    "memberFirstName"
  ).textContent =
    firstName;


  document.getElementById(
    "summaryName"
  ).textContent =
    data.full_name || "Not provided";


  document.getElementById(
    "summaryMajor"
  ).textContent =
    data.major || "Not provided";


  document.getElementById(
    "summaryYear"
  ).textContent =
    data.year_of_study ||
    "Not provided";


  document.getElementById(
    "summaryLivingArea"
  ).textContent =
    data.living_area ||
    "Not provided";


  const complete =
    data.full_name &&
    data.major &&
    data.year_of_study &&
    data.living_area;


  document.getElementById(
    "profileStatus"
  ).textContent =
    complete
      ? "Complete"
      : "Incomplete";


  document.getElementById(
    "profileAlert"
  ).hidden =
    Boolean(complete);


  document.getElementById(
    "eligibilityStatus"
  ).textContent =
    data.eligible_to_vote
      ? "Eligible"
      : "Not Eligible";

}



// ========================================
// ACTIVE ELECTION
// ========================================

async function loadElection() {

  const {
    data,
    error
  } =
    await supabase
      .from("elections")
      .select(`
        id,
        name,
        start_time,
        end_time,
        status
      `)
      .eq(
        "status",
        "open"
      )
      .maybeSingle();


  const status =
    document.getElementById(
      "electionStatus"
    );


  const card =
    document.getElementById(
      "electionCard"
    );


  if (
    error ||
    !data
  ) {

    status.textContent =
      "Closed";

    card.innerHTML = `
      <p class="muted-text">
        There is currently no open PNGSA election.
      </p>
    `;

    return;
  }


  status.textContent =
    "Open";


  const endDate =
    data.end_time
      ? new Date(
          data.end_time
        ).toLocaleString()
      : "Not specified";


  card.innerHTML = `

    <h3>
      ${escapeHTML(data.name)}
    </h3>

    <p>
      Voting is currently open.
    </p>

    <p>
      <strong>Voting closes:</strong>
      ${escapeHTML(endDate)}
    </p>

    <a
      href="vote.html"
      class="member-primary-button"
    >
      Vote Now
    </a>

  `;

}



// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

  return String(value)

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



// ========================================
// LOGOUT
// ========================================

document
  .getElementById(
    "logoutButton"
  )
  .addEventListener(
    "click",
    async function() {

      await supabase.auth.signOut();

      window.location.replace(
        "index.html"
      );

    }
  );



// ========================================
// START
// ========================================

async function initialize() {

  const authenticated =
    await authenticateMember();


  if (!authenticated) {
    return;
  }


  await loadProfile();

  await loadElection();

}


initialize();