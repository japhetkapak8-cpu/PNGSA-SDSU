import { supabase }
from "../../js/supabase.js";


/* =========================================================
   CONFIG
========================================================= */

const STORAGE_BUCKET =
  "social-media-submissions";

const MAX_VIDEO_SIZE =
  200 * 1024 * 1024;

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;


/* =========================================================
   DOM
========================================================= */

const list =
  document.getElementById(
    "submissionList"
  );

const form =
  document.getElementById(
    "submissionForm"
  );

const modal =
  document.getElementById(
    "submissionModal"
  );

const deleteModal =
  document.getElementById(
    "deleteSubmissionModal"
  );

const openButton =
  document.getElementById(
    "openSubmissionModal"
  );

const closeButton =
  document.getElementById(
    "closeSubmissionModal"
  );

const cancelButton =
  document.getElementById(
    "cancelSubmission"
  );

const logoutButton =
  document.getElementById(
    "logoutButton"
  );

const messageBox =
  document.getElementById(
    "submissionMessage"
  );

const searchInput =
  document.getElementById(
    "submissionSearch"
  );

const statusFilter =
  document.getElementById(
    "submissionStatusFilter"
  );

const modalTitle =
  document.getElementById(
    "submissionModalTitle"
  );

const saveButton =
  document.getElementById(
    "saveSubmissionButton"
  );


/* =========================================================
   FORM
========================================================= */

const idInput =
  document.getElementById(
    "submissionId"
  );

const titleInput =
  document.getElementById(
    "submissionTitle"
  );

const captionInput =
  document.getElementById(
    "submissionCaption"
  );

const hashtagsInput =
  document.getElementById(
    "submissionHashtags"
  );

const notesInput =
  document.getElementById(
    "submissionNotes"
  );


/* =========================================================
   VIDEO
========================================================= */

const videoFileInput =
  document.getElementById(
    "submissionVideoFile"
  );

const chooseVideoButton =
  document.getElementById(
    "chooseSubmissionVideo"
  );

const videoFileName =
  document.getElementById(
    "submissionVideoFileName"
  );

const videoPreviewContainer =
  document.getElementById(
    "submissionVideoPreviewContainer"
  );

const videoPreview =
  document.getElementById(
    "submissionVideoPreview"
  );


/* =========================================================
   THUMBNAIL
========================================================= */

const thumbnailFileInput =
  document.getElementById(
    "submissionThumbnailFile"
  );

const chooseThumbnailButton =
  document.getElementById(
    "chooseSubmissionThumbnail"
  );

const thumbnailFileName =
  document.getElementById(
    "submissionThumbnailFileName"
  );


/* =========================================================
   DELETE
========================================================= */

const cancelDeleteButton =
  document.getElementById(
    "cancelDeleteSubmission"
  );

const confirmDeleteButton =
  document.getElementById(
    "confirmDeleteSubmission"
  );


/* =========================================================
   STATS
========================================================= */

const totalCount =
  document.getElementById(
    "totalSubmissions"
  );

const pendingCount =
  document.getElementById(
    "pendingSubmissions"
  );

const returnedCount =
  document.getElementById(
    "returnedSubmissions"
  );

const publishedCount =
  document.getElementById(
    "publishedSubmissions"
  );


/* =========================================================
   STATE
========================================================= */

let currentUser =
  null;

let submissions =
  [];

let selectedVideoFile =
  null;

let selectedThumbnailFile =
  null;

let localVideoUrl =
  null;

let deleteSubmissionId =
  null;


/* =========================================================
   AUTH
========================================================= */

async function requireMember() {

  const {
    data: {
      session
    }
  } =
    await supabase.auth
      .getSession();


  if (
    !session?.user
  ) {

    window.location.href =
      "login.html";

    return false;

  }


  currentUser =
    session.user;


  return true;

}


/* =========================================================
   LOAD
========================================================= */

async function loadSubmissions() {

  if (
    !currentUser
  ) {
    return;
  }


  list.innerHTML = `
    <div class="loading-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      Loading submissions...

    </div>
  `;


  const {
    data,
    error
  } =
    await supabase
      .from(
        "social_media_submissions"
      )
      .select("*")
      .eq(
        "member_id",
        currentUser.id
      )
      .order(
        "submitted_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      error
    );


    list.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-circle-exclamation"></i>

        <h3>
          Could not load submissions
        </h3>

        <p>
          ${escapeHtml(
            error.message
          )}
        </p>

      </div>
    `;

    return;
  }


  submissions =
    data || [];


  updateStats();

  applyFilters();

}


/* =========================================================
   FILTER
========================================================= */

function applyFilters() {

  const search =
    searchInput
      .value
      .trim()
      .toLowerCase();


  const status =
    statusFilter.value;


  const filtered =
    submissions.filter(
      item => {

        const searchable =
          [
            item.title,
            item.caption,
            item.hashtags,
            item.member_notes,
            item.admin_feedback
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        if (
          search &&
          !searchable.includes(
            search
          )
        ) {
          return false;
        }


        if (
          status &&
          item.status !== status
        ) {
          return false;
        }


        return true;

      }
    );


  renderSubmissions(
    filtered
  );

}


/* =========================================================
   RENDER
========================================================= */

function renderSubmissions(
  data
) {

  if (!data.length) {

    list.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-video"></i>

        <h3>
          No submissions yet
        </h3>

        <p>
          Submit a video for review by
          the PNGSA media team.
        </p>

      </div>
    `;

    return;
  }


  list.innerHTML =
    data
      .map(
        renderSubmissionCard
      )
      .join("");


  bindCardActions();

}


/* =========================================================
   CARD
========================================================= */

function renderSubmissionCard(
  item
) {

  const canEdit =
    item.status === "returned";


  const canDelete =
    item.status === "pending" ||
    item.status === "returned";


  const platforms =
    Array.isArray(
      item.requested_platforms
    )
      ? item.requested_platforms
      : [];


  return `
    <article class="submission-card">


      <div class="submission-video">

        ${
          item.video_url
            ? `
              <video
                src="${escapeAttribute(
                  item.video_url
                )}"
                controls
                preload="metadata"
              ></video>
            `
            : `
              <div class="submission-video-placeholder">

                <i class="fa-solid fa-video"></i>

              </div>
            `
        }

      </div>


      <div class="submission-content">


        <div class="submission-top">


          <div>

            ${renderStatus(
              item.status
            )}

            <h3>
              ${escapeHtml(
                item.title
              )}
            </h3>

          </div>


        </div>


        ${
          item.caption
            ? `
              <p>
                ${escapeHtml(
                  item.caption
                )}
              </p>
            `
            : ""
        }


        ${
          item.hashtags
            ? `
              <p>
                <strong>
                  ${escapeHtml(
                    item.hashtags
                  )}
                </strong>
              </p>
            `
            : ""
        }


        <div class="submission-meta">

          <span>

            <i class="fa-regular fa-calendar"></i>

            ${formatDate(
              item.submitted_at
            )}

          </span>

        </div>


        ${
          platforms.length
            ? `
              <div class="platform-tags">

                ${platforms
                  .map(
                    platform => `
                      <span class="platform-tag">
                        ${escapeHtml(
                          capitalize(
                            platform
                          )
                        )}
                      </span>
                    `
                  )
                  .join("")}

              </div>
            `
            : ""
        }


        ${
          item.admin_feedback
            ? `
              <div class="feedback-box">

                <strong>
                  Admin Feedback
                </strong>

                ${escapeHtml(
                  item.admin_feedback
                )}

              </div>
            `
            : ""
        }


        ${
          canEdit ||
          canDelete
            ? `
              <div class="submission-actions">

                ${
                  canEdit
                    ? `
                      <button
                        type="button"
                        data-action="edit"
                        data-id="${item.id}"
                      >

                        <i class="fa-solid fa-pen"></i>

                        Edit & Resubmit

                      </button>
                    `
                    : ""
                }


                ${
                  canDelete
                    ? `
                      <button
                        type="button"
                        data-action="delete"
                        data-id="${item.id}"
                        class="delete-action"
                      >

                        <i class="fa-regular fa-trash-can"></i>

                        Delete

                      </button>
                    `
                    : ""
                }

              </div>
            `
            : ""
        }


      </div>


    </article>
  `;

}


/* =========================================================
   STATUS
========================================================= */

function renderStatus(
  status
) {

  const iconMap = {

    pending:
      "fa-regular fa-clock",

    returned:
      "fa-solid fa-rotate-left",

    approved:
      "fa-solid fa-check",

    rejected:
      "fa-solid fa-xmark",

    publishing:
      "fa-solid fa-spinner fa-spin",

    published:
      "fa-solid fa-circle-check",

    failed:
      "fa-solid fa-triangle-exclamation"

  };


  return `
    <span class="status-badge ${escapeAttribute(
      status
    )}">

      <i class="${
        iconMap[status] ||
        "fa-solid fa-circle"
      }"></i>

      ${escapeHtml(
        capitalize(
          status
        )
      )}

    </span>
  `;

}


/* =========================================================
   CARD ACTIONS
========================================================= */

function bindCardActions() {

  list
    .querySelectorAll(
      "[data-action]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const item =
              submissions.find(
                submission =>
                  String(
                    submission.id
                  ) ===
                  String(
                    button.dataset.id
                  )
              );


            if (!item) {
              return;
            }


            if (
              button.dataset.action ===
              "edit"
            ) {

              openEditModal(
                item
              );

            }


            if (
              button.dataset.action ===
              "delete"
            ) {

              openDeleteModal(
                item.id
              );

            }

          }
        );

      }
    );

}


/* =========================================================
   CREATE MODAL
========================================================= */

function openCreateModal() {

  resetForm();


  idInput.value =
    "";


  modalTitle.textContent =
    "Submit Video";


  openModal();

}


/* =========================================================
   EDIT
========================================================= */

function openEditModal(
  item
) {

  resetForm();


  idInput.value =
    item.id;


  titleInput.value =
    item.title || "";


  captionInput.value =
    item.caption || "";


  hashtagsInput.value =
    item.hashtags || "";


  notesInput.value =
    item.member_notes || "";


  const platforms =
    item.requested_platforms || [];


  document
    .querySelectorAll(
      'input[name="requestedPlatform"]'
    )
    .forEach(
      checkbox => {

        checkbox.checked =
          platforms.includes(
            checkbox.value
          );

      }
    );


  if (
    item.video_url
  ) {

    showVideoPreview(
      item.video_url
    );

  }


  modalTitle.textContent =
    "Edit & Resubmit";


  openModal();

}


/* =========================================================
   VIDEO SELECT
========================================================= */

chooseVideoButton.addEventListener(
  "click",
  () => {

    videoFileInput.click();

  }
);


videoFileInput.addEventListener(
  "change",
  () => {

    const file =
      videoFileInput
        .files?.[0];


    if (!file) {
      return;
    }


    try {

      validateVideo(
        file
      );

    }
    catch (error) {

      showMessage(
        error.message,
        "error"
      );

      videoFileInput.value =
        "";

      return;
    }


    selectedVideoFile =
      file;


    videoFileName.textContent =
      file.name;


    revokeVideoUrl();


    localVideoUrl =
      URL.createObjectURL(
        file
      );


    showVideoPreview(
      localVideoUrl
    );

  }
);


/* =========================================================
   THUMBNAIL
========================================================= */

chooseThumbnailButton.addEventListener(
  "click",
  () => {

    thumbnailFileInput.click();

  }
);


thumbnailFileInput.addEventListener(
  "change",
  () => {

    const file =
      thumbnailFileInput
        .files?.[0];


    if (!file) {
      return;
    }


    try {

      validateImage(
        file
      );

    }
    catch (error) {

      showMessage(
        error.message,
        "error"
      );

      thumbnailFileInput.value =
        "";

      return;
    }


    selectedThumbnailFile =
      file;


    thumbnailFileName.textContent =
      file.name;

  }
);


/* =========================================================
   SAVE
========================================================= */

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (
      !titleInput.value.trim()
    ) {

      showMessage(
        "Please enter a title.",
        "error"
      );

      return;
    }


    const editing =
      Boolean(
        idInput.value
      );


    const existing =
      editing
        ? submissions.find(
            item =>
              String(item.id) ===
              String(idInput.value)
          )
        : null;


    if (
      !selectedVideoFile &&
      !existing?.video_url
    ) {

      showMessage(
        "Please select a video.",
        "error"
      );

      return;
    }


    setSaving(
      true
    );


    try {

      let videoUrl =
        existing?.video_url || null;


      let thumbnailUrl =
        existing?.thumbnail_url || null;


      if (
        selectedVideoFile
      ) {

        videoUrl =
          await uploadFile(
            selectedVideoFile,
            "videos"
          );

      }


      if (
        selectedThumbnailFile
      ) {

        thumbnailUrl =
          await uploadFile(
            selectedThumbnailFile,
            "thumbnails"
          );

      }


      const platforms =
        [
          ...document.querySelectorAll(
            'input[name="requestedPlatform"]:checked'
          )
        ]
          .map(
            checkbox =>
              checkbox.value
          );


      const payload = {

        member_id:
          currentUser.id,

        title:
          titleInput.value.trim(),

        caption:
          cleanValue(
            captionInput.value
          ),

        hashtags:
          cleanValue(
            hashtagsInput.value
          ),

        member_notes:
          cleanValue(
            notesInput.value
          ),

        video_url:
          videoUrl,

        thumbnail_url:
          thumbnailUrl,

        requested_platforms:
          platforms,

        status:
          "pending",

        admin_feedback:
          null,

        updated_at:
          new Date()
            .toISOString()

      };


      let result;


      if (
        editing
      ) {

        result =
          await supabase
            .from(
              "social_media_submissions"
            )
            .update(
              payload
            )
            .eq(
              "id",
              idInput.value
            )
            .eq(
              "member_id",
              currentUser.id
            );

      }
      else {

        result =
          await supabase
            .from(
              "social_media_submissions"
            )
            .insert({

              ...payload,

              submitted_at:
                new Date()
                  .toISOString()

            });

      }


      if (
        result.error
      ) {

        throw result.error;

      }


      closeModal();


      showMessage(
        editing
          ? "Submission updated and sent back for review."
          : "Video submitted for review.",
        "success"
      );


      await loadSubmissions();

    }
    catch (error) {

      console.error(
        error
      );


      showMessage(
        error.message ||
        "Could not save submission.",
        "error"
      );

    }
    finally {

      setSaving(
        false
      );

    }

  }
);


/* =========================================================
   STORAGE
========================================================= */

async function uploadFile(
  file,
  folder
) {

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const path =
    `${currentUser.id}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;


  const {
    error
  } =
    await supabase.storage
      .from(
        STORAGE_BUCKET
      )
      .upload(
        path,
        file,
        {
          upsert: false,
          contentType:
            file.type
        }
      );


  if (error) {

    throw new Error(
      `Upload failed: ${error.message}`
    );

  }


  /*
   * TEMPORARY:
   * This expects the bucket to be public.
   *
   * Later, if you keep the bucket private,
   * we will switch the member/admin pages
   * to signed URLs.
   */

  const {
    data
  } =
    supabase.storage
      .from(
        STORAGE_BUCKET
      )
      .getPublicUrl(
        path
      );


  return data.publicUrl;

}


/* =========================================================
   DELETE
========================================================= */

function openDeleteModal(
  id
) {

  deleteSubmissionId =
    id;


  deleteModal.classList.add(
    "open"
  );

}


function closeDeleteModal() {

  deleteSubmissionId =
    null;


  deleteModal.classList.remove(
    "open"
  );

}


confirmDeleteButton.addEventListener(
  "click",
  async () => {

    if (
      !deleteSubmissionId
    ) {
      return;
    }


    const item =
      submissions.find(
        submission =>
          String(
            submission.id
          ) ===
          String(
            deleteSubmissionId
          )
      );


    if (
      !item ||
      ![
        "pending",
        "returned"
      ].includes(
        item.status
      )
    ) {

      showMessage(
        "This submission cannot be deleted.",
        "error"
      );

      closeDeleteModal();

      return;
    }


    const {
      error
    } =
      await supabase
        .from(
          "social_media_submissions"
        )
        .delete()
        .eq(
          "id",
          deleteSubmissionId
        )
        .eq(
          "member_id",
          currentUser.id
        );


    if (error) {

      showMessage(
        error.message,
        "error"
      );

      return;
    }


    closeDeleteModal();


    showMessage(
      "Submission deleted.",
      "success"
    );


    await loadSubmissions();

  }
);


/* =========================================================
   STATS
========================================================= */

function updateStats() {

  totalCount.textContent =
    submissions.length;


  pendingCount.textContent =
    submissions.filter(
      item =>
        item.status ===
        "pending"
    ).length;


  returnedCount.textContent =
    submissions.filter(
      item =>
        item.status ===
        "returned"
    ).length;


  publishedCount.textContent =
    submissions.filter(
      item =>
        item.status ===
        "published"
    ).length;

}


/* =========================================================
   MODAL
========================================================= */

function openModal() {

  modal.classList.add(
    "open"
  );


  document.body.style.overflow =
    "hidden";

}


function closeModal() {

  modal.classList.remove(
    "open"
  );


  document.body.style.overflow =
    "";


  revokeVideoUrl();

}


function resetForm() {

  form.reset();


  selectedVideoFile =
    null;


  selectedThumbnailFile =
    null;


  videoFileInput.value =
    "";


  thumbnailFileInput.value =
    "";


  videoFileName.textContent =
    "No video selected";


  thumbnailFileName.textContent =
    "No thumbnail selected";


  revokeVideoUrl();


  hideVideoPreview();

}


/* =========================================================
   VIDEO PREVIEW
========================================================= */

function showVideoPreview(
  url
) {

  videoPreview.src =
    url;


  videoPreviewContainer
    .classList
    .remove(
      "hidden"
    );


  videoPreview.load();

}


function hideVideoPreview() {

  videoPreview.pause();


  videoPreview
    .removeAttribute(
      "src"
    );


  videoPreviewContainer
    .classList
    .add(
      "hidden"
    );


  videoPreview.load();

}


/* =========================================================
   VALIDATION
========================================================= */

function validateVideo(
  file
) {

  const allowed =
    [
      "video/mp4",
      "video/webm",
      "video/quicktime"
    ];


  if (
    !allowed.includes(
      file.type
    )
  ) {

    throw new Error(
      "Please select an MP4, WebM, or MOV video."
    );

  }


  if (
    file.size >
    MAX_VIDEO_SIZE
  ) {

    throw new Error(
      "Video must be 200 MB or smaller."
    );

  }

}


function validateImage(
  file
) {

  const allowed =
    [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];


  if (
    !allowed.includes(
      file.type
    )
  ) {

    throw new Error(
      "Thumbnail must be JPG, PNG, or WebP."
    );

  }


  if (
    file.size >
    MAX_IMAGE_SIZE
  ) {

    throw new Error(
      "Thumbnail must be 5 MB or smaller."
    );

  }

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
  message,
  type = "success"
) {

  messageBox.textContent =
    message;


  messageBox.className =
    `submission-message ${type} show`;


  clearTimeout(
    showMessage.timer
  );


  showMessage.timer =
    setTimeout(
      () => {

        messageBox
          .classList
          .remove(
            "show"
          );

      },
      4500
    );

}


/* =========================================================
   SAVING
========================================================= */

function setSaving(
  saving
) {

  saveButton.disabled =
    saving;


  saveButton
    .querySelector(
      "span"
    )
    .textContent =
      saving
        ? "Submitting..."
        : "Submit for Review";


  saveButton
    .querySelector(
      "i"
    )
    .className =
      saving
        ? "fa-solid fa-spinner fa-spin"
        : "fa-solid fa-paper-plane";

}


/* =========================================================
   HELPERS
========================================================= */

function cleanValue(
  value
) {

  const cleaned =
    String(
      value || ""
    )
      .trim();


  return cleaned || null;

}


function capitalize(
  value
) {

  if (!value) {
    return "";
  }


  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );

}


function formatDate(
  value
) {

  if (!value) {
    return "";
  }


  return new Date(
    value
  )
    .toLocaleString(
      "en-US",
      {
        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",

        hour:
          "numeric",

        minute:
          "2-digit"
      }
    );

}


function escapeHtml(
  value
) {

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


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


function revokeVideoUrl() {

  if (
    localVideoUrl
  ) {

    URL.revokeObjectURL(
      localVideoUrl
    );


    localVideoUrl =
      null;

  }

}


/* =========================================================
   LISTENERS
========================================================= */

openButton.addEventListener(
  "click",
  openCreateModal
);


closeButton.addEventListener(
  "click",
  closeModal
);


cancelButton.addEventListener(
  "click",
  closeModal
);


cancelDeleteButton.addEventListener(
  "click",
  closeDeleteModal
);


searchInput.addEventListener(
  "input",
  applyFilters
);


statusFilter.addEventListener(
  "change",
  applyFilters
);


modal.addEventListener(
  "click",
  event => {

    if (
      event.target === modal
    ) {

      closeModal();

    }

  }
);


deleteModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      deleteModal
    ) {

      closeDeleteModal();

    }

  }
);


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {
      return;
    }


    if (
      modal.classList.contains(
        "open"
      )
    ) {

      closeModal();

    }


    if (
      deleteModal.classList.contains(
        "open"
      )
    ) {

      closeDeleteModal();

    }

  }
);


logoutButton.addEventListener(
  "click",
  async () => {

    await supabase.auth.signOut();


    window.location.href =
      "login.html";

  }
);


/* =========================================================
   START
========================================================= */

const authenticated =
  await requireMember();


if (
  authenticated
) {

  await loadSubmissions();

}