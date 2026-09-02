import { supabase }
from "./supabase.js";


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
// SAFE URL
// ========================================

function safeUrl(value = "") {

  if (!value) {
    return "";
  }

  try {

    const url =
      new URL(value);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return "";
    }

    return url.href;

  } catch {

    return "";

  }

}


// ========================================
// LOAD LEADERSHIP
// ========================================

async function loadLeadership() {

  if (!leadershipGrid) {

    console.error(
      "leadershipGrid element not found."
    );

    return;

  }


  const {
    data,
    error
  } =
    await supabase
      .from("leadership")
      .select(`
        id,
        full_name,
        position,
        major,
        year_level,
        bio,
        email,
        linkedin_url,
        photo_url,
        display_order,
        is_active,
        created_at
      `)
      .eq(
        "is_active",
        true
      )
      .order(
        "display_order",
        {
          ascending: true
        }
      )
      .order(
        "created_at",
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


  if (
    !data ||
    data.length === 0
  ) {

    leadershipGrid.innerHTML = `
      <div class="leadership-empty">

        <i class="fa-solid fa-users"></i>

        <h3>
          Leadership information coming soon
        </h3>

        <p>
          PNGSA leadership information is currently being updated.
        </p>

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
      member.full_name || ""
    );

  const position =
    escapeHTML(
      member.position || ""
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


  const details =
    [
      major,
      year
    ]
      .filter(Boolean)
      .join(" • ");


  const photo =
    safeUrl(
      member.photo_url
    );


  const photoHTML =
    photo
      ? `
        <img
          src="${photo}"
          alt="${name}"
          class="executive-photo"
          loading="lazy"
        >
      `
      : `
        <div class="executive-photo-placeholder">

          <i class="fa-solid fa-user"></i>

        </div>
      `;


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


  const linkedin =
    safeUrl(
      member.linkedin_url
    );


  const linkedinButton =
    linkedin
      ? `
        <a
          href="${linkedin}"
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


      ${photoHTML}


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


// ========================================
// START
// ========================================

loadLeadership();