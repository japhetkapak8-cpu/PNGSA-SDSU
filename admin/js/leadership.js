import { supabase }
from "../../js/supabase.js";


// ========================================
// GLOBAL STATE
// ========================================

let currentAdmin = null;

let leadershipMembers = [];

let selectedPhotoFile = null;

let editingPhotoUrl = null;

let deleteLeaderId = null;

let deletePhotoUrl = null;


// ========================================
// ELEMENTS
// ========================================

const adminEmail =
  document.getElementById("adminEmail");

const logoutButton =
  document.getElementById("logoutButton");


const totalLeaders =
  document.getElementById("totalLeaders");

const publishedLeaders =
  document.getElementById("publishedLeaders");

const hiddenLeaders =
  document.getElementById("hiddenLeaders");


const leadershipList =
  document.getElementById("leadershipList");

const leadershipSearch =
  document.getElementById("leadershipSearch");

const leadershipFilter =
  document.getElementById("leadershipFilter");


const addLeaderButton =
  document.getElementById("addLeaderButton");


const leaderModal =
  document.getElementById("leaderModal");

const leaderModalTitle =
  document.getElementById("leaderModalTitle");

const closeLeaderModal =
  document.getElementById("closeLeaderModal");

const cancelLeaderButton =
  document.getElementById("cancelLeaderButton");


const leaderForm =
  document.getElementById("leaderForm");

const leaderId =
  document.getElementById("leaderId");

const leaderName =
  document.getElementById("leaderName");

const leaderPosition =
  document.getElementById("leaderPosition");

const leaderMajor =
  document.getElementById("leaderMajor");

const leaderYear =
  document.getElementById("leaderYear");

const leaderBio =
  document.getElementById("leaderBio");

const leaderEmail =
  document.getElementById("leaderEmail");

const leaderLinkedIn =
  document.getElementById("leaderLinkedIn");

const leaderDisplayOrder =
  document.getElementById("leaderDisplayOrder");

const leaderActive =
  document.getElementById("leaderActive");


const leaderPhoto =
  document.getElementById("leaderPhoto");

const leaderPhotoPreview =
  document.getElementById("leaderPhotoPreview");

const leaderPhotoPlaceholder =
  document.getElementById("leaderPhotoPlaceholder");


const bioCharacterCount =
  document.getElementById("bioCharacterCount");

const leaderFormStatus =
  document.getElementById("leaderFormStatus");

const saveLeaderButton =
  document.getElementById("saveLeaderButton");


// DELETE MODAL

const deleteLeaderModal =
  document.getElementById("deleteLeaderModal");

const deleteLeaderName =
  document.getElementById("deleteLeaderName");

const cancelDeleteLeader =
  document.getElementById("cancelDeleteLeader");

const confirmDeleteLeader =
  document.getElementById("confirmDeleteLeader");


// ========================================
// ADMIN AUTHENTICATION
// ========================================

async function protectAdminPage() {

  const {
    data: {
      session
    },
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


  currentAdmin =
    session.user;


  if (adminEmail) {

    adminEmail.textContent =
      currentAdmin.email || "Admin";

  }


  const {
    data: profile,
    error: profileError
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq(
        "id",
        currentAdmin.id
      )
      .single();


  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {

    console.error(
      "Admin authorization failed:",
      profileError
    );


    await supabase.auth.signOut();


    window.location.replace(
      "index.html"
    );


    return false;

  }


  return true;

}


// ========================================
// LOGOUT
// ========================================

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      await supabase.auth.signOut();

      window.location.replace(
        "index.html"
      );

    }
  );

}


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
// LOAD LEADERSHIP
// ========================================

async function loadLeadership() {

  leadershipList.innerHTML = `
    <div class="leadership-loading">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <p>
        Loading leadership...
      </p>

    </div>
  `;


  const {
    data,
    error
  } =
    await supabase
      .from("leadership")
      .select("*")
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
      "Unable to load leadership:",
      error
    );


    leadershipList.innerHTML = `
      <div class="leadership-empty">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <h3>
          Unable to load leadership
        </h3>

        <p>
          ${escapeHTML(error.message)}
        </p>

      </div>
    `;

    return;

  }


  leadershipMembers =
    data || [];


  updateStatistics();

  renderLeadership();

}


// ========================================
// STATISTICS
// ========================================

function updateStatistics() {

  const total =
    leadershipMembers.length;


  const published =
    leadershipMembers.filter(
      member =>
        member.is_active === true
    ).length;


  const hidden =
    total - published;


  totalLeaders.textContent =
    total;

  publishedLeaders.textContent =
    published;

  hiddenLeaders.textContent =
    hidden;

}


// ========================================
// FILTER / SEARCH
// ========================================

function getFilteredLeadership() {

  const search =
    leadershipSearch.value
      .trim()
      .toLowerCase();


  const filter =
    leadershipFilter.value;


  return leadershipMembers.filter(
    member => {

      const searchText = `
        ${member.full_name || ""}
        ${member.position || ""}
        ${member.major || ""}
        ${member.year_level || ""}
        ${member.email || ""}
      `.toLowerCase();


      const matchesSearch =
        !search ||
        searchText.includes(search);


      let matchesStatus =
        true;


      if (filter === "active") {

        matchesStatus =
          member.is_active === true;

      }


      if (filter === "hidden") {

        matchesStatus =
          member.is_active === false;

      }


      return (
        matchesSearch &&
        matchesStatus
      );

    }
  );

}


// ========================================
// RENDER LEADERS
// ========================================

function renderLeadership() {

  const members =
    getFilteredLeadership();


  if (!members.length) {

    leadershipList.innerHTML = `
      <div class="leadership-empty">

        <i class="fa-solid fa-people-group"></i>

        <h3>
          No leaders found
        </h3>

        <p>
          Add a PNGSA leader or adjust your search.
        </p>

      </div>
    `;

    return;

  }


  leadershipList.innerHTML =
    members
      .map(
        createLeaderCard
      )
      .join("");


  attachLeaderActions();

}


// ========================================
// CREATE LEADER CARD
// ========================================

function createLeaderCard(member) {

  const details =
    [
      member.major,
      member.year_level
    ]
      .filter(Boolean)
      .map(escapeHTML)
      .join(" • ");


  const photoHTML =
    member.photo_url
      ? `
        <img
          src="${escapeHTML(member.photo_url)}"
          alt="${escapeHTML(member.full_name)}"
          class="leader-admin-photo"
          loading="lazy"
        >
      `
      : `
        <div class="leader-admin-photo-fallback">

          <i class="fa-solid fa-user"></i>

        </div>
      `;


  const statusClass =
    member.is_active
      ? "active"
      : "hidden";


  const statusText =
    member.is_active
      ? "Published"
      : "Hidden";


  const visibilityIcon =
    member.is_active
      ? "fa-eye-slash"
      : "fa-eye";


  const visibilityTitle =
    member.is_active
      ? "Hide from website"
      : "Publish on website";


  return `
    <article
      class="leader-admin-card"
      data-id="${member.id}"
    >

      ${photoHTML}


      <div class="leader-admin-info">

        <p class="leader-admin-position">
          ${escapeHTML(member.position)}
        </p>


        <h3>
          ${escapeHTML(member.full_name)}
        </h3>


        ${
          details
            ? `
              <p class="leader-admin-details">
                ${details}
              </p>
            `
            : ""
        }


        <div class="leader-admin-status">

          <span
            class="leader-status-badge ${statusClass}"
          >
            ${statusText}
          </span>

          <span class="leader-order-label">
            Order:
            ${member.display_order ?? 0}
          </span>

        </div>

      </div>


      <div class="leader-admin-actions">


        <button
          type="button"
          class="leader-icon-button move-up-button"
          data-id="${member.id}"
          title="Move up"
        >

          <i class="fa-solid fa-arrow-up"></i>

        </button>


        <button
          type="button"
          class="leader-icon-button move-down-button"
          data-id="${member.id}"
          title="Move down"
        >

          <i class="fa-solid fa-arrow-down"></i>

        </button>


        <button
          type="button"
          class="leader-icon-button visibility-button"
          data-id="${member.id}"
          title="${visibilityTitle}"
        >

          <i class="fa-solid ${visibilityIcon}"></i>

        </button>


        <button
          type="button"
          class="leader-icon-button edit-button"
          data-id="${member.id}"
          title="Edit leader"
        >

          <i class="fa-solid fa-pen"></i>

        </button>


        <button
          type="button"
          class="leader-icon-button danger delete-button"
          data-id="${member.id}"
          title="Delete leader"
        >

          <i class="fa-solid fa-trash"></i>

        </button>


      </div>

    </article>
  `;

}


// ========================================
// ATTACH CARD ACTIONS
// ========================================

function attachLeaderActions() {

  document
    .querySelectorAll(
      ".edit-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            editLeader(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".delete-button"
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


  document
    .querySelectorAll(
      ".visibility-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            toggleLeaderVisibility(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".move-up-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            moveLeader(
              button.dataset.id,
              -1
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".move-down-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            moveLeader(
              button.dataset.id,
              1
            );

          }
        );

      }
    );

}


// ========================================
// OPEN ADD MODAL
// ========================================

function openAddLeaderModal() {

  resetLeaderForm();


  leaderModalTitle.textContent =
    "Add Leader";


  leaderDisplayOrder.value =
    getNextDisplayOrder();


  leaderActive.checked =
    true;


  leaderModal.classList.remove(
    "hidden"
  );


  document.body.style.overflow =
    "hidden";


  setTimeout(
    () => {

      leaderName.focus();

    },
    100
  );

}


// ========================================
// NEXT DISPLAY ORDER
// ========================================

function getNextDisplayOrder() {

  if (!leadershipMembers.length) {

    return 1;

  }


  const highest =
    Math.max(
      ...leadershipMembers.map(
        member =>
          Number(
            member.display_order || 0
          )
      )
    );


  return highest + 1;

}


// ========================================
// EDIT LEADER
// ========================================

function editLeader(id) {

  const member =
    leadershipMembers.find(
      item =>
        item.id === id
    );


  if (!member) {

    return;

  }


  resetLeaderForm();


  leaderModalTitle.textContent =
    "Edit Leader";


  leaderId.value =
    member.id;


  leaderName.value =
    member.full_name || "";


  leaderPosition.value =
    member.position || "";


  leaderMajor.value =
    member.major || "";


  leaderYear.value =
    member.year_level || "";


  leaderBio.value =
    member.bio || "";


  leaderEmail.value =
    member.email || "";


  leaderLinkedIn.value =
    member.linkedin_url || "";


  leaderDisplayOrder.value =
    member.display_order ?? 0;


  leaderActive.checked =
    member.is_active === true;


  editingPhotoUrl =
    member.photo_url || null;


  if (member.photo_url) {

    showPhotoPreview(
      member.photo_url
    );

  }


  updateBioCharacterCount();


  leaderModal.classList.remove(
    "hidden"
  );


  document.body.style.overflow =
    "hidden";

}


// ========================================
// CLOSE MODAL
// ========================================

function closeModal() {

  leaderModal.classList.add(
    "hidden"
  );


  document.body.style.overflow =
    "";


  resetLeaderForm();

}


// ========================================
// RESET FORM
// ========================================

function resetLeaderForm() {

  leaderForm.reset();


  leaderId.value =
    "";


  leaderDisplayOrder.value =
    "0";


  leaderActive.checked =
    true;


  selectedPhotoFile =
    null;


  editingPhotoUrl =
    null;


  leaderPhoto.value =
    "";


  leaderPhotoPreview.src =
    "";


  leaderPhotoPreview.hidden =
    true;


  leaderPhotoPlaceholder.style.display =
    "flex";


  leaderFormStatus.textContent =
    "";


  leaderFormStatus.className =
    "form-status";


  bioCharacterCount.textContent =
    "0 / 600";

}


// ========================================
// PHOTO SELECTION
// ========================================

leaderPhoto.addEventListener(
  "change",
  () => {

    const file =
      leaderPhoto.files?.[0];


    if (!file) {

      selectedPhotoFile =
        null;

      return;

    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      showFormStatus(
        "Please choose a JPG, PNG, or WEBP image.",
        "error"
      );


      leaderPhoto.value =
        "";

      return;

    }


    const maxSize =
      5 * 1024 * 1024;


    if (file.size > maxSize) {

      showFormStatus(
        "Leadership photos must be smaller than 5 MB.",
        "error"
      );


      leaderPhoto.value =
        "";

      return;

    }


    selectedPhotoFile =
      file;


    const reader =
      new FileReader();


    reader.onload =
      event => {

        showPhotoPreview(
          event.target.result
        );

      };


    reader.readAsDataURL(
      file
    );

  }
);


// ========================================
// SHOW PHOTO PREVIEW
// ========================================

function showPhotoPreview(src) {

  leaderPhotoPreview.src =
    src;


  leaderPhotoPreview.hidden =
    false;


  leaderPhotoPlaceholder.style.display =
    "none";

}


// ========================================
// BIO CHARACTER COUNT
// ========================================

leaderBio.setAttribute(
  "maxlength",
  "600"
);


leaderBio.addEventListener(
  "input",
  updateBioCharacterCount
);


function updateBioCharacterCount() {

  bioCharacterCount.textContent =
    `${leaderBio.value.length} / 600`;

}


// ========================================
// SAVE LEADER
// ========================================

leaderForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const name =
      leaderName.value.trim();


    const position =
      leaderPosition.value.trim();


    if (
      !name ||
      !position
    ) {

      showFormStatus(
        "Full name and position are required.",
        "error"
      );

      return;

    }


    setSaveLoading(
      true
    );


    showFormStatus(
      "Saving leader...",
      ""
    );


    try {

      let photoUrl =
        editingPhotoUrl;


      if (selectedPhotoFile) {

        photoUrl =
          await uploadLeadershipPhoto(
            selectedPhotoFile
          );

      }


      const record = {

        full_name:
          name,

        position:
          position,

        major:
          leaderMajor.value.trim() || null,

        year_level:
          leaderYear.value || null,

        bio:
          leaderBio.value.trim() || null,

        email:
          leaderEmail.value.trim() || null,

        linkedin_url:
          leaderLinkedIn.value.trim() || null,

        photo_url:
          photoUrl || null,

        display_order:
          Number(
            leaderDisplayOrder.value || 0
          ),

        is_active:
          leaderActive.checked,

        updated_at:
          new Date().toISOString()

      };


      const existingId =
        leaderId.value;


      let error;


      if (existingId) {

        const result =
          await supabase
            .from("leadership")
            .update(record)
            .eq(
              "id",
              existingId
            );


        error =
          result.error;

      } else {

        const result =
          await supabase
            .from("leadership")
            .insert(record);


        error =
          result.error;

      }


      if (error) {

        throw error;

      }


      showFormStatus(
        existingId
          ? "Leader updated successfully."
          : "Leader added successfully.",
        "success"
      );


      await loadLeadership();


      setTimeout(
        () => {

          closeModal();

        },
        500
      );

    } catch (error) {

      console.error(
        "Save leadership error:",
        error
      );


      showFormStatus(
        error.message ||
        "Unable to save this leader.",
        "error"
      );

    } finally {

      setSaveLoading(
        false
      );

    }

  }
);


// ========================================
// UPLOAD LEADERSHIP PHOTO
// ========================================

async function uploadLeadershipPhoto(
  file
) {

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const fileName =
    `${crypto.randomUUID()}.${extension}`;


  const filePath =
    `leaders/${fileName}`;


  const {
    error: uploadError
  } =
    await supabase.storage
      .from("leadership-photos")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false
        }
      );


  if (uploadError) {

    throw uploadError;

  }


  const {
    data
  } =
    supabase.storage
      .from("leadership-photos")
      .getPublicUrl(
        filePath
      );


  return (
    data.publicUrl
  );

}


// ========================================
// SAVE BUTTON LOADING
// ========================================

function setSaveLoading(
  loading
) {

  saveLeaderButton.disabled =
    loading;


  saveLeaderButton.innerHTML =
    loading
      ? `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Saving...
      `
      : `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Leader
      `;

}


// ========================================
// FORM STATUS
// ========================================

function showFormStatus(
  message,
  type
) {

  leaderFormStatus.textContent =
    message;


  leaderFormStatus.className =
    "form-status";


  if (type) {

    leaderFormStatus.classList.add(
      type
    );

  }

}


// ========================================
// TOGGLE VISIBILITY
// ========================================

async function toggleLeaderVisibility(
  id
) {

  const member =
    leadershipMembers.find(
      item =>
        item.id === id
    );


  if (!member) {

    return;

  }


  const {
    error
  } =
    await supabase
      .from("leadership")
      .update({
        is_active:
          !member.is_active,

        updated_at:
          new Date().toISOString()
      })
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(
      "Visibility update failed:",
      error
    );


    alert(
      "Unable to change website visibility."
    );

    return;

  }


  await loadLeadership();

}


// ========================================
// MOVE LEADER
// ========================================

async function moveLeader(
  id,
  direction
) {

  const ordered =
    [...leadershipMembers]
      .sort(
        (a, b) =>
          Number(
            a.display_order || 0
          ) -
          Number(
            b.display_order || 0
          )
      );


  const currentIndex =
    ordered.findIndex(
      member =>
        member.id === id
    );


  if (currentIndex === -1) {

    return;

  }


  const targetIndex =
    currentIndex + direction;


  if (
    targetIndex < 0 ||
    targetIndex >= ordered.length
  ) {

    return;

  }


  const current =
    ordered[currentIndex];


  const target =
    ordered[targetIndex];


  let currentOrder =
    Number(
      current.display_order || 0
    );


  let targetOrder =
    Number(
      target.display_order || 0
    );


  if (currentOrder === targetOrder) {

    // Normalize when duplicate orders exist.

    for (
      let index = 0;
      index < ordered.length;
      index++
    ) {

      const {
        error
      } =
        await supabase
          .from("leadership")
          .update({
            display_order:
              index + 1
          })
          .eq(
            "id",
            ordered[index].id
          );


      if (error) {

        console.error(
          error
        );

        return;

      }

    }


    await loadLeadership();


    return moveLeader(
      id,
      direction
    );

  }


  const {
    error: currentError
  } =
    await supabase
      .from("leadership")
      .update({
        display_order:
          targetOrder
      })
      .eq(
        "id",
        current.id
      );


  if (currentError) {

    console.error(
      currentError
    );

    return;

  }


  const {
    error: targetError
  } =
    await supabase
      .from("leadership")
      .update({
        display_order:
          currentOrder
      })
      .eq(
        "id",
        target.id
      );


  if (targetError) {

    console.error(
      targetError
    );

    return;

  }


  await loadLeadership();

}


// ========================================
// DELETE MODAL
// ========================================

function openDeleteModal(
  id
) {

  const member =
    leadershipMembers.find(
      item =>
        item.id === id
    );


  if (!member) {

    return;

  }


  deleteLeaderId =
    member.id;


  deletePhotoUrl =
    member.photo_url || null;


  deleteLeaderName.textContent =
    member.full_name;


  deleteLeaderModal.classList.remove(
    "hidden"
  );


  document.body.style.overflow =
    "hidden";

}


// ========================================
// CLOSE DELETE MODAL
// ========================================

function closeDeleteModal() {

  deleteLeaderModal.classList.add(
    "hidden"
  );


  document.body.style.overflow =
    "";


  deleteLeaderId =
    null;


  deletePhotoUrl =
    null;

}


// ========================================
// CONFIRM DELETE
// ========================================

confirmDeleteLeader.addEventListener(
  "click",
  async () => {

    if (!deleteLeaderId) {

      return;

    }


    confirmDeleteLeader.disabled =
      true;


    confirmDeleteLeader.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Deleting...
    `;


    const {
      error
    } =
      await supabase
        .from("leadership")
        .delete()
        .eq(
          "id",
          deleteLeaderId
        );


    if (error) {

      console.error(
        "Delete leader error:",
        error
      );


      alert(
        "Unable to delete leader."
      );


      resetDeleteButton();

      return;

    }


    // Attempt to remove associated photo.
    // Failure does not prevent deletion.

    if (deletePhotoUrl) {

      await deleteStoredPhoto(
        deletePhotoUrl
      );

    }


    closeDeleteModal();


    resetDeleteButton();


    await loadLeadership();

  }
);


// ========================================
// DELETE PHOTO FROM STORAGE
// ========================================

async function deleteStoredPhoto(
  publicUrl
) {

  try {

    const marker =
      "/leadership-photos/";


    const index =
      publicUrl.indexOf(marker);


    if (index === -1) {

      return;

    }


    const path =
      decodeURIComponent(
        publicUrl.substring(
          index + marker.length
        )
      );


    const {
      error
    } =
      await supabase.storage
        .from("leadership-photos")
        .remove([
          path
        ]);


    if (error) {

      console.warn(
        "Photo cleanup failed:",
        error
      );

    }

  } catch (error) {

    console.warn(
      "Photo cleanup error:",
      error
    );

  }

}


// ========================================
// RESET DELETE BUTTON
// ========================================

function resetDeleteButton() {

  confirmDeleteLeader.disabled =
    false;


  confirmDeleteLeader.innerHTML = `
    <i class="fa-solid fa-trash"></i>
    Delete
  `;

}


// ========================================
// SEARCH
// ========================================

leadershipSearch.addEventListener(
  "input",
  renderLeadership
);


leadershipFilter.addEventListener(
  "change",
  renderLeadership
);


// ========================================
// MODAL EVENTS
// ========================================

addLeaderButton.addEventListener(
  "click",
  openAddLeaderModal
);


closeLeaderModal.addEventListener(
  "click",
  closeModal
);


cancelLeaderButton.addEventListener(
  "click",
  closeModal
);


cancelDeleteLeader.addEventListener(
  "click",
  closeDeleteModal
);


// Click outside modal

leaderModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      leaderModal
    ) {

      closeModal();

    }

  }
);


deleteLeaderModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      deleteLeaderModal
    ) {

      closeDeleteModal();

    }

  }
);


// ESC

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Escape"
    ) {

      return;

    }


    if (
      !leaderModal.classList.contains(
        "hidden"
      )
    ) {

      closeModal();

    }


    if (
      !deleteLeaderModal.classList.contains(
        "hidden"
      )
    ) {

      closeDeleteModal();

    }

  }
);


// ========================================
// INITIALIZE
// ========================================

async function initializeLeadershipPage() {

  const authorized =
    await protectAdminPage();


  if (!authorized) {

    return;

  }


  await loadLeadership();

}


initializeLeadershipPage();