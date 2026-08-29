import { supabase }
from "../../js/supabase.js";


// ========================================
// ELEMENTS
// ========================================

const opportunitySearch =
  document.getElementById(
    "opportunitySearch"
  );


const filterButtons =
  document.querySelectorAll(
    ".filter-button"
  );


const featuredSection =
  document.getElementById(
    "featuredSection"
  );


const featuredOpportunities =
  document.getElementById(
    "featuredOpportunities"
  );


const allOpportunities =
  document.getElementById(
    "allOpportunities"
  );


const resultCount =
  document.getElementById(
    "resultCount"
  );


const emptyState =
  document.getElementById(
    "emptyState"
  );


const opportunityModal =
  document.getElementById(
    "opportunityModal"
  );


const modalBackdrop =
  document.getElementById(
    "opportunityModalBackdrop"
  );


const modalClose =
  document.getElementById(
    "modalClose"
  );


const modalCloseButton =
  document.getElementById(
    "modalCloseButton"
  );


const modalTitle =
  document.getElementById(
    "modalTitle"
  );


const modalOrganization =
  document.getElementById(
    "modalOrganization"
  );


const modalType =
  document.getElementById(
    "modalType"
  );


const modalLocation =
  document.getElementById(
    "modalLocation"
  );


const modalDeadline =
  document.getElementById(
    "modalDeadline"
  );


const modalDescription =
  document.getElementById(
    "modalDescription"
  );


const modalEligibility =
  document.getElementById(
    "modalEligibility"
  );


const modalApplyButton =
  document.getElementById(
    "modalApplyButton"
  );


const modalRemoteBadge =
  document.getElementById(
    "modalRemoteBadge"
  );


const modalPaidBadge =
  document.getElementById(
    "modalPaidBadge"
  );


const logoutButton =
  document.getElementById(
    "logoutButton"
  );


// ========================================
// DATA
// ========================================

let opportunities = [];

let currentFilter =
  "all";


// ========================================
// CHECK LOGIN
// ========================================

async function checkMemberSession() {

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


  return true;

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

  return String(
    value ?? ""
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


// ========================================
// FORMAT TYPE
// ========================================

function formatType(type) {

  const types = {

    internship:
      "Internship",

    job:
      "Job",

    scholarship:
      "Scholarship",

    research:
      "Research",

    fellowship:
      "Fellowship",

    stem:
      "STEM Program",

    volunteer:
      "Volunteer"

  };


  return (
    types[type] ||
    "Opportunity"
  );

}


// ========================================
// TYPE ICON
// ========================================

function getTypeIcon(type) {

  const icons = {

    internship:
      "fa-user-tie",

    job:
      "fa-briefcase",

    scholarship:
      "fa-graduation-cap",

    research:
      "fa-microscope",

    fellowship:
      "fa-award",

    stem:
      "fa-flask",

    volunteer:
      "fa-hand-holding-heart"

  };


  return (
    icons[type] ||
    "fa-briefcase"
  );

}


// ========================================
// FORMAT DATE
// ========================================

function formatDeadline(value) {

  if (!value) {
    return "No deadline";
  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  return date.toLocaleDateString(
    undefined,
    {
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );

}


// ========================================
// LOAD
// ========================================

async function loadOpportunities() {

  allOpportunities.innerHTML =
    `
      <div class="loading-opportunities">

        <i class="fa-solid fa-spinner fa-spin"></i>

        Loading opportunities...

      </div>
    `;


  featuredOpportunities.innerHTML =
    "";


  const {
    data,
    error
  } =
    await supabase
      .from("opportunities")
      .select(`
        id,
        title,
        provider,
        description,
        opportunity_type,
        location,
        is_remote,
        is_paid,
        eligibility,
        application_url,
        deadline,
        is_featured,
        published,
        created_at
      `)
      .eq(
        "published",
        true
      )
      .order(
        "is_featured",
        {
          ascending: false
        }
      )
      .order(
        "deadline",
        {
          ascending: true,
          nullsFirst: false
        }
      );


  if (error) {

    console.error(
      "Unable to load opportunities:",
      error
    );


    allOpportunities.innerHTML =
      `
        <div class="loading-opportunities">
          Unable to load opportunities.
        </div>
      `;

    return;

  }


  opportunities =
    data || [];


  renderOpportunities();

}


// ========================================
// CREATE CARD
// ========================================

function createOpportunityCard(
  opportunity,
  featured = false
) {

  const tags = [];


  if (opportunity.is_remote) {

    tags.push(
      `<span>Remote</span>`
    );

  }


  if (opportunity.is_paid) {

    tags.push(
      `<span>Paid</span>`
    );

  }


  const hasApplicationLink =
    Boolean(
      opportunity.application_url
    );


  return `
    <article
      class="opportunity-card ${
        featured
          ? "featured"
          : ""
      }"
    >


      <div class="card-top">


        <div class="opportunity-icon">

          <i
            class="fa-solid ${
              getTypeIcon(
                opportunity.opportunity_type
              )
            }"
          ></i>

        </div>


        ${
          featured

            ? `
                <span class="featured-badge">

                  <i class="fa-solid fa-star"></i>

                  Featured

                </span>
              `

            : `
                <span class="category-badge">

                  ${escapeHTML(
                    formatType(
                      opportunity.opportunity_type
                    )
                  )}

                </span>
              `
        }


      </div>



      ${
        tags.length

          ? `
              <div class="opportunity-tags">
                ${tags.join("")}
              </div>
            `

          : ""
      }



      <h3>

        ${escapeHTML(
          opportunity.title
        )}

      </h3>



      <p class="organization">

        ${escapeHTML(
          opportunity.provider ||
          "Opportunity Provider"
        )}

      </p>



      <p class="opportunity-description">

        ${escapeHTML(
          opportunity.description ||
          "No description provided."
        )}

      </p>



      <div class="opportunity-meta">


        <div>

          <i class="fa-solid fa-location-dot"></i>

          ${escapeHTML(
            opportunity.location ||
            (
              opportunity.is_remote
                ? "Remote"
                : "Location not specified"
            )
          )}

        </div>


        <div>

          <i class="fa-solid fa-calendar"></i>

          ${
            escapeHTML(
              formatDeadline(
                opportunity.deadline
              )
            )
          }

        </div>


      </div>



      <div class="card-actions ${
        hasApplicationLink
          ? ""
          : "single"
      }">


        <button
          type="button"
          class="view-opportunity-button"
          data-id="${opportunity.id}"
        >

          View Details

          <i class="fa-solid fa-arrow-right"></i>

        </button>


        ${
          hasApplicationLink

            ? `
                <a
                  href="${escapeHTML(
                    opportunity.application_url
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="direct-apply-button"
                >

                  Apply

                  <i class="fa-solid fa-arrow-up-right-from-square"></i>

                </a>
              `

            : ""
        }


      </div>


    </article>
  `;

}


// ========================================
// FILTER
// ========================================

function getFilteredOpportunities() {

  const search =
    opportunitySearch
      ?.value
      .trim()
      .toLowerCase() ||
    "";


  return opportunities.filter(
    opportunity => {


      const categoryMatches =
        currentFilter === "all" ||
        opportunity.opportunity_type ===
          currentFilter;


      const searchText =
        `
          ${opportunity.title || ""}
          ${opportunity.provider || ""}
          ${opportunity.description || ""}
          ${opportunity.location || ""}
          ${opportunity.eligibility || ""}
          ${opportunity.opportunity_type || ""}
        `
          .toLowerCase();


      const searchMatches =
        !search ||
        searchText.includes(
          search
        );


      return (
        categoryMatches &&
        searchMatches
      );

    }
  );

}


// ========================================
// RENDER
// ========================================

function renderOpportunities() {

  const filtered =
    getFilteredOpportunities();


  const featured =
    filtered.filter(
      opportunity =>
        opportunity.is_featured
    );


  if (featured.length) {

    featuredSection.style.display =
      "";


    featuredOpportunities.innerHTML =
      featured
        .map(
          opportunity =>
            createOpportunityCard(
              opportunity,
              true
            )
        )
        .join("");

  }

  else {

    featuredSection.style.display =
      "none";

  }


  if (!filtered.length) {

    allOpportunities.innerHTML =
      "";


    emptyState.hidden =
      false;


    resultCount.textContent =
      "0 opportunities";


    attachOpportunityEvents();

    return;

  }


  emptyState.hidden =
    true;


  allOpportunities.innerHTML =
    filtered
      .map(
        opportunity =>
          createOpportunityCard(
            opportunity,
            false
          )
      )
      .join("");


  resultCount.textContent =
    `${filtered.length} ${
      filtered.length === 1
        ? "opportunity"
        : "opportunities"
    }`;


  attachOpportunityEvents();

}


// ========================================
// VIEW DETAILS
// ========================================

function openOpportunityModal(id) {

  const opportunity =
    opportunities.find(
      item =>
        item.id === id
    );


  if (
    !opportunity ||
    !opportunityModal
  ) {

    return;

  }


  modalTitle.textContent =
    opportunity.title ||
    "Opportunity";


  modalOrganization.textContent =
    opportunity.provider ||
    "";


  modalType.textContent =
    formatType(
      opportunity.opportunity_type
    );


  modalLocation.textContent =
    opportunity.location ||
    (
      opportunity.is_remote
        ? "Remote"
        : "Location not specified"
    );


  modalDeadline.textContent =
    formatDeadline(
      opportunity.deadline
    );


  modalDescription.textContent =
    opportunity.description ||
    "No description available.";


  modalEligibility.textContent =
    opportunity.eligibility ||
    "Eligibility information was not provided.";


  modalRemoteBadge.hidden =
    !opportunity.is_remote;


  modalPaidBadge.hidden =
    !opportunity.is_paid;


  if (
    opportunity.application_url
  ) {

    modalApplyButton.href =
      opportunity.application_url;


    modalApplyButton.style.display =
      "inline-flex";

  }

  else {

    modalApplyButton.removeAttribute(
      "href"
    );


    modalApplyButton.style.display =
      "none";

  }


  opportunityModal.classList.add(
    "open"
  );


  opportunityModal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";

}


// ========================================
// CARD EVENTS
// ========================================

function attachOpportunityEvents() {

  document
    .querySelectorAll(
      ".view-opportunity-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openOpportunityModal(
              button.dataset.id
            );

          }
        );

      }
    );

}


// ========================================
// CLOSE MODAL
// ========================================

function closeOpportunityModal() {

  if (!opportunityModal) {
    return;
  }


  opportunityModal.classList.remove(
    "open"
  );


  opportunityModal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
    "";

}


modalClose?.addEventListener(
  "click",
  closeOpportunityModal
);


modalCloseButton?.addEventListener(
  "click",
  closeOpportunityModal
);


modalBackdrop?.addEventListener(
  "click",
  closeOpportunityModal
);


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      opportunityModal
        ?.classList
        .contains("open")
    ) {

      closeOpportunityModal();

    }

  }
);


// ========================================
// SEARCH
// ========================================

opportunitySearch?.addEventListener(
  "input",
  renderOpportunities
);


// ========================================
// FILTER BUTTONS
// ========================================

filterButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {


        currentFilter =
          button.dataset.filter ||
          "all";


        filterButtons.forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );


        button.classList.add(
          "active"
        );


        renderOpportunities();

      }
    );

  }
);


// ========================================
// LOGOUT
// ========================================

logoutButton?.addEventListener(
  "click",
  async () => {

    const {
      error
    } =
      await supabase.auth.signOut();


    if (error) {

      console.error(
        "Logout error:",
        error
      );

      return;

    }


    window.location.replace(
      "index.html"
    );

  }
);


// ========================================
// INITIALIZE
// ========================================

async function initializePage() {

  const authorized =
    await checkMemberSession();


  if (!authorized) {
    return;
  }


  await loadOpportunities();

}


initializePage();