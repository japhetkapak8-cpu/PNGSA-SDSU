import { supabase }
from "../../js/supabase.js";


// ========================================
// ELEMENTS
// ========================================

const opportunityForm =
  document.getElementById("opportunityForm");

const opportunityId =
  document.getElementById("opportunityId");

const titleInput =
  document.getElementById("title");

const providerInput =
  document.getElementById("provider");

const opportunityTypeInput =
  document.getElementById("opportunityType");

const locationInput =
  document.getElementById("location");

const deadlineInput =
  document.getElementById("deadline");

const descriptionInput =
  document.getElementById("description");

const eligibilityInput =
  document.getElementById("eligibility");

const applicationUrlInput =
  document.getElementById("applicationUrl");

const isRemoteInput =
  document.getElementById("isRemote");

const isPaidInput =
  document.getElementById("isPaid");

const isFeaturedInput =
  document.getElementById("isFeatured");

const publishedInput =
  document.getElementById("published");

const saveButton =
  document.getElementById("saveButton");

const cancelEditButton =
  document.getElementById("cancelEditButton");

const formHeading =
  document.getElementById("formHeading");

const formMessage =
  document.getElementById("formMessage");

const opportunityList =
  document.getElementById("opportunityList");

const opportunitySearch =
  document.getElementById("opportunitySearch");

const totalCount =
  document.getElementById("totalCount");

const publishedCount =
  document.getElementById("publishedCount");

const featuredCount =
  document.getElementById("featuredCount");

const draftCount =
  document.getElementById("draftCount");

const adminEmail =
  document.getElementById("adminEmail");

const logoutButton =
  document.getElementById("logoutButton");

const deleteModal =
  document.getElementById("deleteModal");

const cancelDeleteButton =
  document.getElementById("cancelDeleteButton");

const confirmDeleteButton =
  document.getElementById("confirmDeleteButton");


// ========================================
// DATA
// ========================================

let opportunities = [];

let deleteTargetId = null;


// ========================================
// ADMIN CHECK
// ========================================

async function checkAdmin() {

  const {
    data: { session },
    error: sessionError
  } =
    await supabase.auth.getSession();


  if (
    sessionError ||
    !session
  ) {

    window.location.replace(
      "index.html"
    );

    return false;

  }


  const user =
    session.user;


  if (adminEmail) {

    adminEmail.textContent =
      user.email ||
      "Admin";

  }


  const {
    data: profile,
    error: profileError
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();


  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {

    console.error(
      "Admin verification failed:",
      profileError
    );


    window.location.replace(
      "../member-portal/dashboard.html"
    );

    return false;

  }


  return true;

}


// ========================================
// MESSAGE
// ========================================

function showMessage(
  message,
  type = "error"
) {

  if (!formMessage) {
    return;
  }


  formMessage.textContent =
    message;


  formMessage.className =
    `form-message ${type}`;

}


function clearMessage() {

  if (!formMessage) {
    return;
  }


  formMessage.textContent =
    "";


  formMessage.className =
    "form-message";

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
// VALID URL
// ========================================

function normalizeUrl(value) {

  const url =
    String(value || "")
      .trim();


  if (!url) {
    return null;
  }


  try {

    const parsed =
      new URL(url);


    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {

      return null;

    }


    return parsed.href;

  }

  catch {

    return null;

  }

}


// ========================================
// LOAD OPPORTUNITIES
// ========================================

async function loadOpportunities() {

  opportunityList.innerHTML =
    `
      <div class="loading-state">

        <i class="fa-solid fa-spinner fa-spin"></i>

        Loading opportunities...

      </div>
    `;


  const {
    data,
    error
  } =
    await supabase
      .from("opportunities")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Load opportunities error:",
      error
    );


    opportunityList.innerHTML =
      `
        <div class="empty-state">
          Unable to load opportunities.
        </div>
      `;

    return;

  }


  opportunities =
    data || [];


  updateStats();

  renderOpportunities();

}


// ========================================
// STATS
// ========================================

function updateStats() {

  totalCount.textContent =
    opportunities.length;


  publishedCount.textContent =
    opportunities.filter(
      item =>
        item.published
    ).length;


  featuredCount.textContent =
    opportunities.filter(
      item =>
        item.is_featured
    ).length;


  draftCount.textContent =
    opportunities.filter(
      item =>
        !item.published
    ).length;

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
    type ||
    "Opportunity"
  );

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(value) {

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
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

}


// ========================================
// RENDER OPPORTUNITIES
// ========================================

function renderOpportunities() {

  const search =
    opportunitySearch
      ?.value
      .trim()
      .toLowerCase() ||
    "";


  const filtered =
    opportunities.filter(
      item => {

        const text =
          `
            ${item.title || ""}
            ${item.provider || ""}
            ${item.description || ""}
            ${item.location || ""}
            ${item.opportunity_type || ""}
            ${item.application_url || ""}
          `.toLowerCase();


        return text.includes(
          search
        );

      }
    );


  if (!filtered.length) {

    opportunityList.innerHTML =
      `
        <div class="empty-state">
          No opportunities found.
        </div>
      `;

    return;

  }


  opportunityList.innerHTML =
    filtered
      .map(
        item => {


          const badges = [];


          badges.push(
            `
              <span>
                ${escapeHTML(
                  formatType(
                    item.opportunity_type
                  )
                )}
              </span>
            `
          );


          if (item.published) {

            badges.push(
              `
                <span class="published">
                  Published
                </span>
              `
            );

          }

          else {

            badges.push(
              `
                <span class="draft">
                  Draft
                </span>
              `
            );

          }


          if (item.is_featured) {

            badges.push(
              `
                <span class="featured">
                  Featured
                </span>
              `
            );

          }


          if (item.is_remote) {

            badges.push(
              `
                <span>
                  Remote
                </span>
              `
            );

          }


          if (item.is_paid) {

            badges.push(
              `
                <span>
                  Paid
                </span>
              `
            );

          }


          const linkPreview =
            item.application_url

              ? `
                  <div class="opportunity-link-preview">

                    <i class="fa-solid fa-link"></i>

                    ${escapeHTML(
                      item.application_url
                    )}

                  </div>
                `

              : `
                  <div class="opportunity-link-preview">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    No application link

                  </div>
                `;


          return `
            <article
              class="opportunity-row"
              data-id="${item.id}"
            >


              <div class="opportunity-main">


                <h3>
                  ${escapeHTML(
                    item.title
                  )}
                </h3>


                <span class="opportunity-provider">

                  ${escapeHTML(
                    item.provider ||
                    "No provider"
                  )}

                </span>


                <p class="opportunity-summary">

                  ${escapeHTML(
                    item.description ||
                    "No description provided."
                  )}

                </p>


                ${linkPreview}


                <div class="opportunity-badges">

                  ${badges.join("")}


                  <span>

                    ${escapeHTML(
                      item.location ||
                      "Location not specified"
                    )}

                  </span>


                  <span>

                    ${escapeHTML(
                      formatDate(
                        item.deadline
                      )
                    )}

                  </span>


                </div>


              </div>



              <div class="opportunity-actions">


                ${
                  item.application_url

                    ? `
                        <a
                          href="${escapeHTML(
                            item.application_url
                          )}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="action-button"
                          title="Open application link"
                        >

                          <i class="fa-solid fa-arrow-up-right-from-square"></i>

                        </a>
                      `

                    : ""
                }


                <button
                  type="button"
                  class="action-button edit-button"
                  data-id="${item.id}"
                  title="Edit"
                >

                  <i class="fa-solid fa-pen"></i>

                </button>


                <button
                  type="button"
                  class="action-button publish-button"
                  data-id="${item.id}"
                  title="${
                    item.published
                      ? "Unpublish"
                      : "Publish"
                  }"
                >

                  <i class="fa-solid ${
                    item.published
                      ? "fa-eye-slash"
                      : "fa-eye"
                  }"></i>

                </button>


                <button
                  type="button"
                  class="action-button feature-button"
                  data-id="${item.id}"
                  title="Toggle Featured"
                >

                  <i class="fa-solid fa-star"></i>

                </button>


                <button
                  type="button"
                  class="action-button delete delete-opportunity-button"
                  data-id="${item.id}"
                  title="Delete"
                >

                  <i class="fa-solid fa-trash"></i>

                </button>


              </div>


            </article>
          `;

        }
      )
      .join("");


  attachRowEvents();

}


// ========================================
// ADD / UPDATE
// ========================================

opportunityForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearMessage();


    const {
      data: { session }
    } =
      await supabase.auth.getSession();


    if (!session) {

      showMessage(
        "Your session has expired."
      );

      return;

    }


    const rawUrl =
      applicationUrlInput.value
        .trim();


    let applicationUrl =
      null;


    if (rawUrl) {

      applicationUrl =
        normalizeUrl(
          rawUrl
        );


      if (!applicationUrl) {

        showMessage(
          "Please enter a valid application link beginning with http:// or https://"
        );

        return;

      }

    }


    const payload = {

      title:
        titleInput.value.trim(),

      provider:
        providerInput.value.trim() ||
        null,

      description:
        descriptionInput.value.trim() ||
        null,

      opportunity_type:
        opportunityTypeInput.value,

      location:
        locationInput.value.trim() ||
        null,

      deadline:
        deadlineInput.value ||
        null,

      eligibility:
        eligibilityInput.value.trim() ||
        null,

      application_url:
        applicationUrl,

      is_remote:
        isRemoteInput.checked,

      is_paid:
        isPaidInput.checked,

      is_featured:
        isFeaturedInput.checked,

      published:
        publishedInput.checked,

      updated_at:
        new Date().toISOString()

    };


    if (
      !payload.title ||
      !payload.opportunity_type
    ) {

      showMessage(
        "Title and opportunity type are required."
      );

      return;

    }


    if (
      payload.published &&
      !payload.application_url
    ) {

      const proceed =
        window.confirm(
          "This opportunity has no application link. Publish it anyway?"
        );


      if (!proceed) {
        return;
      }

    }


    saveButton.disabled =
      true;


    saveButton.innerHTML =
      `
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Saving...</span>
      `;


    try {


      if (opportunityId.value) {

        const {
          error
        } =
          await supabase
            .from("opportunities")
            .update(payload)
            .eq(
              "id",
              opportunityId.value
            );


        if (error) {
          throw error;
        }


        showMessage(
          "Opportunity updated successfully.",
          "success"
        );

      }

      else {

        payload.created_by =
          session.user.id;


        const {
          error
        } =
          await supabase
            .from("opportunities")
            .insert(
              payload
            );


        if (error) {
          throw error;
        }


        showMessage(
          "Opportunity added successfully.",
          "success"
        );

      }


      resetForm();

      await loadOpportunities();

    }

    catch (error) {

      console.error(
        "Save opportunity error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to save opportunity."
      );

    }

    finally {

      saveButton.disabled =
        false;


      if (opportunityId.value) {

        saveButton.innerHTML =
          `
            <i class="fa-solid fa-floppy-disk"></i>
            <span>Save Changes</span>
          `;

      }

      else {

        saveButton.innerHTML =
          `
            <i class="fa-solid fa-plus"></i>
            <span>Add Opportunity</span>
          `;

      }

    }

  }
);


// ========================================
// EDIT
// ========================================

function editOpportunity(id) {

  const item =
    opportunities.find(
      opportunity =>
        opportunity.id === id
    );


  if (!item) {
    return;
  }


  clearMessage();


  opportunityId.value =
    item.id;


  titleInput.value =
    item.title || "";


  providerInput.value =
    item.provider || "";


  opportunityTypeInput.value =
    item.opportunity_type || "";


  locationInput.value =
    item.location || "";


  deadlineInput.value =
    item.deadline || "";


  descriptionInput.value =
    item.description || "";


  eligibilityInput.value =
    item.eligibility || "";


  applicationUrlInput.value =
    item.application_url || "";


  isRemoteInput.checked =
    Boolean(
      item.is_remote
    );


  isPaidInput.checked =
    Boolean(
      item.is_paid
    );


  isFeaturedInput.checked =
    Boolean(
      item.is_featured
    );


  publishedInput.checked =
    Boolean(
      item.published
    );


  formHeading.textContent =
    "Edit Opportunity";


  saveButton.innerHTML =
    `
      <i class="fa-solid fa-floppy-disk"></i>
      <span>Save Changes</span>
    `;


  cancelEditButton.hidden =
    false;


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ========================================
// RESET FORM
// ========================================

function resetForm() {

  opportunityForm.reset();


  opportunityId.value =
    "";


  publishedInput.checked =
    true;


  formHeading.textContent =
    "Add Opportunity";


  saveButton.innerHTML =
    `
      <i class="fa-solid fa-plus"></i>
      <span>Add Opportunity</span>
    `;


  cancelEditButton.hidden =
    true;

}


// ========================================
// CANCEL EDIT
// ========================================

cancelEditButton.addEventListener(
  "click",
  () => {

    resetForm();

    clearMessage();

  }
);


// ========================================
// TOGGLE PUBLISHED
// ========================================

async function togglePublished(id) {

  const item =
    opportunities.find(
      opportunity =>
        opportunity.id === id
    );


  if (!item) {
    return;
  }


  const {
    error
  } =
    await supabase
      .from("opportunities")
      .update({

        published:
          !item.published,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "Publish error:",
      error
    );

    alert(
      "Unable to update publishing status."
    );

    return;

  }


  await loadOpportunities();

}


// ========================================
// TOGGLE FEATURED
// ========================================

async function toggleFeatured(id) {

  const item =
    opportunities.find(
      opportunity =>
        opportunity.id === id
    );


  if (!item) {
    return;
  }


  const {
    error
  } =
    await supabase
      .from("opportunities")
      .update({

        is_featured:
          !item.is_featured,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "Featured error:",
      error
    );

    alert(
      "Unable to update featured status."
    );

    return;

  }


  await loadOpportunities();

}


// ========================================
// DELETE MODAL
// ========================================

function openDeleteModal(id) {

  deleteTargetId =
    id;


  deleteModal.classList.add(
    "open"
  );

}


function closeDeleteModal() {

  deleteTargetId =
    null;


  deleteModal.classList.remove(
    "open"
  );

}


cancelDeleteButton.addEventListener(
  "click",
  closeDeleteModal
);


// ========================================
// DELETE
// ========================================

confirmDeleteButton.addEventListener(
  "click",
  async () => {

    if (!deleteTargetId) {
      return;
    }


    confirmDeleteButton.disabled =
      true;


    const {
      error
    } =
      await supabase
        .from("opportunities")
        .delete()
        .eq(
          "id",
          deleteTargetId
        );


    confirmDeleteButton.disabled =
      false;


    if (error) {

      console.error(
        "Delete opportunity error:",
        error
      );


      alert(
        "Unable to delete opportunity."
      );

      return;

    }


    closeDeleteModal();


    await loadOpportunities();

  }
);


// ========================================
// ROW EVENTS
// ========================================

function attachRowEvents() {


  document
    .querySelectorAll(
      ".edit-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            editOpportunity(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".publish-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            togglePublished(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".feature-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            toggleFeatured(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".delete-opportunity-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openDeleteModal(
              button.dataset.id
            );

          }
        );

      }
    );

}


// ========================================
// SEARCH
// ========================================

opportunitySearch.addEventListener(
  "input",
  renderOpportunities
);


// ========================================
// LOGOUT
// ========================================

logoutButton?.addEventListener(
  "click",
  async () => {

    await supabase.auth.signOut();


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
    await checkAdmin();


  if (!authorized) {
    return;
  }


  await loadOpportunities();

}


initializePage();