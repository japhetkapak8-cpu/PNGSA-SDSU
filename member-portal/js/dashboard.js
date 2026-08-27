import { supabase }
from "../../js/supabase.js";


let currentUser = null;
let currentProfile = null;


// ========================================
// AUTHENTICATE
// ========================================

async function authenticateMember() {

  const {
    data: { session },
    error
  } =
    await supabase.auth.getSession();


  if (
    error ||
    !session
  ) {

    window.location.replace(
      "index.html"
    );

    return false;
  }


  currentUser =
    session.user;


  const memberEmail =
    document.getElementById(
      "memberEmail"
    );


  if (memberEmail) {

    memberEmail.textContent =
      currentUser.email;

  }


  return true;
}



// ========================================
// LOAD PROFILE
// ========================================

async function loadProfile() {

  console.log(
    "Loading profile for:",
    currentUser.id
  );


  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .single();


  if (error) {

    console.error(
      "PROFILE LOAD ERROR:",
      error
    );


    const profileName =
      document.getElementById(
        "profileFullName"
      );


    if (profileName) {

      profileName.textContent =
        "Unable to load profile";

    }


    return;

  }


  if (!data) {

    console.error(
      "No profile record found."
    );

    return;

  }


  console.log(
    "PROFILE LOADED:",
    data
  );


  currentProfile =
    data;


  populateDashboard(
    data
  );


  calculateProfileCompletion(
    data
  );

}



// ========================================
// POPULATE DASHBOARD
// ========================================

function populateDashboard(profile) {


  // ========================================
  // NAME
  // ========================================

  const fullName =
    profile.full_name ||
    "Member";


  const firstName =
    fullName
      .trim()
      .split(" ")[0];


  setText(
    "welcomeName",
    firstName
  );


  setText(
    "profileFullName",
    fullName
  );



  // ========================================
  // PROFILE SUMMARY
  // ========================================

  setText(
    "profileMajor",
    profile.major
  );


  setText(
    "profileYear",
    profile.year_of_study
  );


  setText(
    "profileGraduation",
    profile.expected_graduation
  );



  // ========================================
  // MEMBER SINCE
  // ========================================

  setText(
    "memberSince",
    formatDate(
      profile.created_at
    )
  );



  // ========================================
  // PROFILE PHOTO
  // ========================================

  const photo =
    document.getElementById(
      "dashboardProfilePhoto"
    );


  const fallback =
    document.getElementById(
      "dashboardAvatarFallback"
    );


  if (
    photo &&
    fallback
  ) {

    if (
      profile.avatar_url &&
      profile.avatar_url.trim() !== ""
    ) {

      photo.src =
        profile.avatar_url;


      photo.hidden =
        false;


      fallback.hidden =
        true;


      photo.onerror =
        function() {

          photo.hidden =
            true;

          fallback.hidden =
            false;

        };

    }

    else {

      photo.hidden =
        true;

      fallback.hidden =
        false;

    }

  }



  // ========================================
  // VOTING ELIGIBILITY
  // ========================================

  const votingStatus =
    document.getElementById(
      "votingStatus"
    );


  const votingDescription =
    document.getElementById(
      "votingDescription"
    );


  if (
    votingStatus &&
    votingDescription
  ) {

    if (
      profile.eligible_to_vote === true
    ) {

      votingStatus.textContent =
        "Eligible";


      votingStatus.className =
        "big-status eligible";


      votingDescription.textContent =
        "You are eligible to vote in PNGSA elections.";

    }

    else {

      votingStatus.textContent =
        "Not Eligible";


      votingStatus.className =
        "big-status";


      votingDescription.textContent =
        "You are not currently eligible to vote.";

    }

  }



  // ========================================
  // ACADEMIC INFORMATION
  // ========================================

  setText(
    "academicUniversity",
    profile.university ||
    "South Dakota State University"
  );


  setText(
    "academicMajor",
    profile.major
  );


  setText(
    "academicMinor",
    profile.minor
  );


  setText(
    "degreeLevel",
    profile.degree_level
  );


  setText(
    "academicYear",
    profile.year_of_study
  );


  setText(
    "academicStatus",
    profile.academic_status
  );



  // ========================================
  // SPONSORSHIP INFORMATION
  // ========================================

  setText(
    "currentlySponsored",
    profile.sponsorship_status
  );


  setText(
    "sponsorOrganization",
    profile.sponsor_name
  );


  setText(
    "sponsorshipProgram",
    profile.sponsorship_program
  );


  setText(
    "sponsorshipStatus",
    profile.sponsorship_current_status ||
    profile.sponsorship_status
  );


  setText(
    "sponsorshipEndYear",
    profile.sponsorship_end_year
  );


  setText(
    "sponsorshipIssues",
    profile.sponsorship_issues
  );



  // ========================================
  // CAREER INFORMATION
  // ========================================

  setText(
    "careerInterests",
    profile.career_interest
  );


  setText(
    "returnToPNG",
    profile.return_to_png
  );


  setText(
    "pngEmployment",
    booleanText(
      profile.interested_png_employment
    )
  );


  setText(
    "internships",
    booleanText(
      profile.interested_internships
    )
  );

}



// ========================================
// PROFILE COMPLETION
// ========================================

function calculateProfileCompletion(profile) {

  /*
    These are the fields that count
    toward the completion percentage.
  */

  const fields = [

    profile.full_name,
    profile.date_of_birth,
    profile.gender,
    profile.personal_email,
    profile.phone_number,

    profile.province,
    profile.district,
    profile.home_town,
    profile.living_area,

    profile.major,
    profile.degree_level,
    profile.year_of_study,
    profile.expected_graduation,
    profile.academic_status,

    profile.sponsorship_status,

    profile.career_interest,
    profile.return_to_png

  ];


  const completed =
    fields.filter(
      value => {

        if (
          value === null ||
          value === undefined
        ) {

          return false;

        }


        return (
          String(value)
            .trim()
            .length > 0
        );

      }
    ).length;


  const percentage =
    Math.round(
      (
        completed /
        fields.length
      ) * 100
    );


  // ========================================
  // NUMBER
  // ========================================

  setText(
    "completionPercent",
    `${percentage}%`
  );



  // ========================================
  // CIRCLE
  // ========================================

  const circle =
    document.getElementById(
      "completionCircle"
    );


  if (circle) {

    circle.style.setProperty(
      "--progress",
      `${percentage * 3.6}deg`
    );

  }



  // ========================================
  // COMPLETION MESSAGE
  // ========================================

  const completionMessage =
    document.getElementById(
      "completionMessage"
    );


  if (!completionMessage) {

    return;

  }


  if (
    percentage === 100
  ) {

    completionMessage.textContent =
      "Your profile is complete.";

  }

  else if (
    percentage >= 80
  ) {

    completionMessage.textContent =
      "Great job! Just a few details left.";

  }

  else if (
    percentage >= 50
  ) {

    completionMessage.textContent =
      "Your profile still needs some information.";

  }

  else {

    completionMessage.textContent =
      "Please complete your member profile.";

  }

}



// ========================================
// LOAD ACTIVE ELECTION
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


  const title =
    document.getElementById(
      "electionTitle"
    );


  const description =
    document.getElementById(
      "electionDescription"
    );


  if (
    !title ||
    !description
  ) {

    return;

  }


  if (
    error ||
    !data
  ) {

    title.textContent =
      "No Open Election";


    description.textContent =
      "There is currently no open PNGSA election.";


    return;

  }


  title.textContent =
    data.name ||
    "PNGSA Election";


  if (
    data.end_time
  ) {

    const endDate =
      new Date(
        data.end_time
      ).toLocaleString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }
      );


    description.textContent =
      `Voting is open until ${endDate}.`;

  }

  else {

    description.textContent =
      "Voting is currently open.";

  }

}



// ========================================
// SET TEXT
// ========================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {

    return;

  }


  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    element.textContent =
      "Not provided";

    return;

  }


  element.textContent =
    String(value);

}



// ========================================
// BOOLEAN TEXT
// ========================================

function booleanText(value) {

  if (
    value === true
  ) {

    return "Yes";

  }


  if (
    value === false
  ) {

    return "No";

  }


  return "Not provided";

}



// ========================================
// FORMAT DATE
// ========================================

function formatDate(value) {

  if (!value) {

    return "Not provided";

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }


  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );

}



// ========================================
// LOGOUT
// ========================================

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async function() {

      await supabase.auth.signOut();


      window.location.replace(
        "index.html"
      );

    }
  );

}

// ========================================
// LOAD FEATURED EVENT
// ========================================

async function loadFeaturedEvent() {

  const container =
    document.getElementById(
      "dashboardFeaturedEvent"
    );


  if (!container) {

    console.warn(
      "dashboardFeaturedEvent not found."
    );

    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabase

        .from("events")

        .select(`
          id,
          title,
          category,
          location,
          start_at,
          end_at,
          short_description,
          description,
          featured,
          is_published
        `)

        .eq(
          "is_published",
          true
        )

        .eq(
          "featured",
          true
        )

        .order(
          "start_at",
          {
            ascending: true
          }
        )

        .limit(1)

        .maybeSingle();


    if (error) {

      throw error;
    }


    if (!data) {

      container.innerHTML = `

        <div class="empty-dashboard-state">

          <i class="fa-regular fa-calendar"></i>

          <strong>
            No featured event
          </strong>

          <p>
            Upcoming PNGSA events will appear here.
          </p>

        </div>

      `;

      return;
    }


    const eventDate =
      new Date(
        data.start_at
      );


    const month =
      eventDate.toLocaleString(
        "en-US",
        {
          month: "short"
        }
      );


    const day =
      eventDate.getDate();


    const dateText =
      eventDate.toLocaleDateString(
        "en-US",
        {
          weekday: "short",
          month: "short",
          day: "numeric"
        }
      );


    const timeText =
      eventDate.toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit"
        }
      );


    container.innerHTML = `

      <div class="dashboard-event">


        <div class="dashboard-event-date">

          <span>
            ${month}
          </span>

          <strong>
            ${day}
          </strong>

        </div>


        <div class="dashboard-event-content">


          <div class="dashboard-event-badges">


            ${
              data.category
                ? `
                  <span class="dashboard-event-category">

                    ${
                      escapeDashboardHTML(
                        data.category
                      )
                    }

                  </span>
                `
                : ""
            }


            <span class="dashboard-featured-badge">

              <i class="fa-solid fa-star"></i>

              Featured

            </span>


          </div>


          <h3>

            ${
              escapeDashboardHTML(
                data.title
              )
            }

          </h3>


          <div class="dashboard-event-meta">


            <span>

              <i class="fa-regular fa-calendar"></i>

              ${dateText}

            </span>


            <span>

              <i class="fa-regular fa-clock"></i>

              ${timeText}

            </span>


            ${
              data.location
                ? `
                  <span>

                    <i class="fa-solid fa-location-dot"></i>

                    ${
                      escapeDashboardHTML(
                        data.location
                      )
                    }

                  </span>
                `
                : ""
            }


          </div>


          ${
            data.short_description
              ? `
                <p>

                  ${
                    escapeDashboardHTML(
                      data.short_description
                    )
                  }

                </p>
              `
              : ""
          }


        </div>


      </div>

    `;

  }

  catch (error) {

    console.error(
      "FEATURED EVENT LOAD ERROR:",
      error
    );


    container.innerHTML = `

      <div class="empty-dashboard-state">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Event could not be loaded
        </strong>

        <p>
          ${
            escapeDashboardHTML(
              error.message ||
              "Unknown error"
            )
          }
        </p>

      </div>

    `;

  }

}


// ========================================
// ESCAPE EVENT HTML
// ========================================

function escapeDashboardHTML(
  value
) {

  return String(
    value || ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}

// ========================================
// START
// ========================================

async function initialize() {

  const authenticated =
    await authenticateMember();


  if (!authenticated) {

    return;

  }


  console.log("1. Member authenticated");


  await loadProfile();

  console.log("2. Profile loaded");


  await loadElection();

  console.log("3. Election loaded");


  await loadFeaturedEvent();

  console.log("4. Featured event loaded");

}


initialize();