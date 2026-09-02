import { createClient }
from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


const SUPABASE_URL =
  "YOUR_SUPABASE_URL";

const SUPABASE_ANON_KEY =
  "YOUR_SUPABASE_PUBLISHABLE_KEY";


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


const leadershipGrid =
  document.getElementById(
    "leadershipGrid"
  );


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ========================================
// LOAD LEADERS
// ========================================

async function loadLeadership() {

  const {
    data,
    error
  } =
    await supabase
      .from("leadership")
      .select("*")
      .eq("is_active", true)
      .order(
        "display_order",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Leadership error:",
      error
    );


    leadershipGrid.innerHTML = `
      <div class="leadership-empty">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <h3>
          Unable to load leadership
        </h3>

        <p>
          Please try again later.
        </p>

      </div>
    `;

    return;

  }


  if (!data || data.length === 0) {

    leadershipGrid.innerHTML = `
      <div class="leadership-empty">

        <i class="fa-solid fa-users"></i>

        <h3>
          Leadership information coming soon
        </h3>

      </div>
    `;

    return;

  }


  leadershipGrid.innerHTML =
    data
      .map(
        createLeadershipCard
      )
      .join("");

}


// ========================================
// CREATE CARD
// ========================================

function createLeadershipCard(member) {

  const name =
    escapeHTML(
      member.full_name
    );


  const position =
    escapeHTML(
      member.position
    );


  const major =
    escapeHTML(
      member.major || ""
    );


  const year =
    escapeHTML(
      member.year_level || ""
    );


  const bio =
    escapeHTML(
      member.bio || ""
    );


  const photo =
    member.photo_url ||
    "images/leadership/default-profile.png";


  const details =
    [
      major,
      year
    ]
      .filter(Boolean)
      .join(" • ");


  const emailButton =
    member.email
      ? `
        <a
          href="mailto:${escapeHTML(member.email)}"
          class="executive-contact-link"
        >

          <i class="fa-solid fa-envelope"></i>

          Email

        </a>
      `
      : "";


  const linkedinButton =
    member.linkedin_url
      ? `
        <a
          href="${escapeHTML(member.linkedin_url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="executive-contact-link"
        >

          <i class="fa-brands fa-linkedin"></i>

          LinkedIn

        </a>
      `
      : "";


  return `
    <article class="executive-card">

      <img
        src="${escapeHTML(photo)}"
        alt="${name}"
        class="executive-photo"
        loading="lazy"
      >


      <div class="executive-info">

        <p class="executive-role">
          ${position}
        </p>


        <h3>
          ${name}
        </h3>


        ${
          details
            ? `
              <p class="executive-details">
                ${details}
              </p>
            `
            : ""
        }


        ${
          bio
            ? `
              <p class="executive-bio">
                ${bio}
              </p>
            `
            : ""
        }


        ${
          emailButton ||
          linkedinButton
            ? `
              <div class="executive-contact">

                ${emailButton}

                ${linkedinButton}

              </div>
            `
            : ""
        }

      </div>

    </article>
  `;

}


loadLeadership();