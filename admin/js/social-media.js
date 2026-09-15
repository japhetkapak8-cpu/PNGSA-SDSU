import {
  supabase
}
from "../../js/supabase.js";


/* =========================================================
   CONFIG
========================================================= */

const STORAGE_BUCKET =
  "social-media-submissions";

const SIGNED_URL_SECONDS =
  60 * 60;

const MAX_VIDEO_SIZE =
  200 * 1024 * 1024;


/* =========================================================
   DOM
========================================================= */

const submissionList =
  document.getElementById(
    "socialSubmissionList"
  );

const messageBox =
  document.getElementById(
    "adminSocialMessage"
  );

const searchInput =
  document.getElementById(
    "submissionSearch"
  );

const statusFilter =
  document.getElementById(
    "submissionStatusFilter"
  );

const refreshButton =
  document.getElementById(
    "refreshSubmissionsButton"
  );

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


/* =========================================================
   STATS
========================================================= */

const totalCount =
  document.getElementById(
    "totalSubmissionCount"
  );

const pendingCount =
  document.getElementById(
    "pendingSubmissionCount"
  );

const approvedCount =
  document.getElementById(
    "approvedSubmissionCount"
  );

const publishedCount =
  document.getElementById(
    "publishedSubmissionCount"
  );


/* =========================================================
   APPROVE MODAL
========================================================= */

const approveModal =
  document.getElementById(
    "approveModal"
  );

const approveSubmissionId =
  document.getElementById(
    "approveSubmissionId"
  );

const approveCaption =
  document.getElementById(
    "approveCaption"
  );

const approveHashtags =
  document.getElementById(
    "approveHashtags"
  );

const approveSelectAllPlatforms =
  document.getElementById(
    "approveSelectAllPlatforms"
  );

const confirmApproveButton =
  document.getElementById(
    "confirmApproveButton"
  );


/* =========================================================
   RETURN MODAL
========================================================= */

const returnModal =
  document.getElementById(
    "returnModal"
  );

const returnSubmissionId =
  document.getElementById(
    "returnSubmissionId"
  );

const returnReason =
  document.getElementById(
    "returnReason"
  );

const confirmReturnButton =
  document.getElementById(
    "confirmReturnButton"
  );


/* =========================================================
   REJECT MODAL
========================================================= */

const rejectModal =
  document.getElementById(
    "rejectModal"
  );

const rejectSubmissionId =
  document.getElementById(
    "rejectSubmissionId"
  );

const rejectReason =
  document.getElementById(
    "rejectReason"
  );

const confirmRejectButton =
  document.getElementById(
    "confirmRejectButton"
  );


/* =========================================================
   DIRECT POST
========================================================= */

const directPostModal =
  document.getElementById(
    "directPostModal"
  );

const createDirectPostButton =
  document.getElementById(
    "createDirectPostButton"
  );

const directPostForm =
  document.getElementById(
    "directPostForm"
  );

const directPostTitle =
  document.getElementById(
    "directPostTitle"
  );

const directPostCaption =
  document.getElementById(
    "directPostCaption"
  );

const directPostHashtags =
  document.getElementById(
    "directPostHashtags"
  );

const directPostVideoFile =
  document.getElementById(
    "directPostVideoFile"
  );

const chooseDirectPostVideo =
  document.getElementById(
    "chooseDirectPostVideo"
  );

const directPostVideoFileName =
  document.getElementById(
    "directPostVideoFileName"
  );

const directVideoPreviewContainer =
  document.getElementById(
    "directVideoPreviewContainer"
  );

const directVideoPreview =
  document.getElementById(
    "directVideoPreview"
  );

const directSelectAllPlatforms =
  document.getElementById(
    "directSelectAllPlatforms"
  );

const submitDirectPostButton =
  document.getElementById(
    "submitDirectPostButton"
  );


/* =========================================================
   VIDEO VIEWER
========================================================= */

const videoViewer =
  document.getElementById(
    "videoViewer"
  );

const fullVideoPreview =
  document.getElementById(
    "fullVideoPreview"
  );


/* =========================================================
   STATE
========================================================= */

let currentAdmin =
  null;

let submissions =
  [];

let profileMap =
  new Map();

let signedUrlCache =
  new Map();

let selectedDirectVideo =
  null;

let directPreviewObjectUrl =
  null;


/* =========================================================
   AUTH
========================================================= */

async function requireAdmin() {

  const {
    data: {
      session
    },
    error
  } =
    await supabase.auth
      .getSession();

  if (
    error ||
    !session?.user
  ) {

    window.location.href =
      "login.html";

    return false;
  }

  currentAdmin =
    session.user;

  /*
   * RLS/backend authorization must still enforce
   * actual admin permissions.
   *
   * This front-end check only verifies that the
   * current user is signed in.
   */

  return true;
}


/* =========================================================
   LOAD SUBMISSIONS
========================================================= */

async function loadSubmissions() {

  submissionList.innerHTML = `

    <div class="loading-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <h3>
        Loading submissions
      </h3>

      <p>
        Please wait...
      </p>

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
      .order(
        "submitted_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(
      "Submission load error:",
      error
    );

    submissionList.innerHTML = `

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

  await loadMemberProfiles();

  updateStats();

  await applyFilters();
}


/* =========================================================
   LOAD MEMBER PROFILES
========================================================= */

async function loadMemberProfiles() {

  profileMap =
    new Map();

  const ids =
    [
      ...new Set(
        submissions
          .map(
            item =>
              item.member_id
          )
          .filter(Boolean)
      )
    ];

  if (
    !ids.length
  ) {
    return;
  }

  const {
    data,
    error
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, full_name, username, avatar_url"
      )
      .in(
        "id",
        ids
      );

  if (error) {

    console.warn(
      "Could not load member profiles:",
      error
    );

    return;
  }

  (
    data || []
  )
    .forEach(
      profile => {

        profileMap.set(
          profile.id,
          profile
        );

      }
    );
}


/* =========================================================
   FILTER
========================================================= */

async function applyFilters() {

  const query =
    searchInput
      .value
      .trim()
      .toLowerCase();

  const status =
    statusFilter.value;

  const filtered =
    submissions.filter(
      item => {

        const profile =
          profileMap.get(
            item.member_id
          );

        const searchable =
          [
            item.title,
            item.caption,
            item.hashtags,
            item.member_notes,
            item.admin_feedback,
            profile?.full_name,
            profile?.username
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (
          query &&
          !searchable.includes(
            query
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

  await renderSubmissions(
    filtered
  );
}


/* =========================================================
   RENDER
========================================================= */

async function renderSubmissions(
  items
) {

  if (
    !items.length
  ) {

    submissionList.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-video"></i>

        <h3>
          No submissions found
        </h3>

        <p>
          Member video submissions will appear here.
        </p>

      </div>

    `;

    return;
  }

  const cards =
    await Promise.all(
      items.map(
        item =>
          renderSubmissionCard(
            item
          )
      )
    );

  submissionList.innerHTML =
    cards.join("");

  bindSubmissionActions();
}


/* =========================================================
   CARD
========================================================= */

async function renderSubmissionCard(
  item
) {

  const profile =
    profileMap.get(
      item.member_id
    );

  const memberName =
    profile?.full_name ||
    profile?.username ||
    (
      item.member_id ===
      currentAdmin?.id
        ? "PNGSA Admin"
        : "PNGSA Member"
    );

  const videoUrl =
    await resolveMediaUrl(
      item.video_url
    );

  const thumbnailUrl =
    await resolveMediaUrl(
      item.thumbnail_url
    );

  const platforms =
    Array.isArray(
      item.requested_platforms
    )
      ? item.requested_platforms
      : [];

  const approvedPlatforms =
    Array.isArray(
      item.approved_platforms
    )
      ? item.approved_platforms
      : [];

  const displayPlatforms =
    approvedPlatforms.length
      ? approvedPlatforms
      : platforms;

  const canReview =
    item.status === "pending";

  const canApprove =
    [
      "pending",
      "returned"
    ].includes(
      item.status
    );

  return `

    <article class="social-submission-card">

      <div class="submission-media">

        ${
          thumbnailUrl
            ? `
              <img
                src="${escapeAttribute(
                  thumbnailUrl
                )}"
                alt="${escapeAttribute(
                  item.title ||
                  "Video thumbnail"
                )}"
              >
            `
            :
          videoUrl
            ? `
              <video
                src="${escapeAttribute(
                  videoUrl
                )}"
                preload="metadata"
                muted
              ></video>
            `
            : `
              <div class="submission-media-placeholder">

                <i class="fa-solid fa-video"></i>

              </div>
            `
        }

        ${
          videoUrl
            ? `
              <button
                type="button"
                class="preview-overlay-button"
                data-action="preview"
                data-id="${item.id}"
                title="Preview video"
              >

                <i class="fa-solid fa-play"></i>

              </button>
            `
            : ""
        }

      </div>


      <div class="submission-details">

        <div class="submission-header">

          <div class="submission-heading">

            ${renderStatus(
              item.status
            )}

            <h3>
              ${escapeHtml(
                item.title ||
                "Untitled Submission"
              )}
            </h3>

            <p class="submission-member">

              Submitted by

              <strong>
                ${escapeHtml(
                  memberName
                )}
              </strong>

            </p>

          </div>

        </div>


        ${
          item.caption
            ? `
              <div class="submission-section">

                <span class="submission-section-label">
                  Caption
                </span>

                <p>
                  ${escapeHtml(
                    item.caption
                  )}
                </p>

              </div>
            `
            : ""
        }


        ${
          item.hashtags
            ? `
              <div class="submission-section">

                <span class="submission-section-label">
                  Hashtags
                </span>

                <p class="submission-hashtags">
                  ${escapeHtml(
                    item.hashtags
                  )}
                </p>

              </div>
            `
            : ""
        }


        ${
          item.member_notes
            ? `
              <div class="submission-section">

                <span class="submission-section-label">
                  Member Notes
                </span>

                <p>
                  ${escapeHtml(
                    item.member_notes
                  )}
                </p>

              </div>
            `
            : ""
        }


        ${
          displayPlatforms.length
            ? `
              <div class="platform-tags">

                ${displayPlatforms
                  .map(
                    platform =>
                      renderPlatformTag(
                        platform
                      )
                  )
                  .join("")}

              </div>
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


          ${
            item.reviewed_at
              ? `
                <span>

                  <i class="fa-solid fa-user-check"></i>

                  Reviewed
                  ${formatDate(
                    item.reviewed_at
                  )}

                </span>
              `
              : ""
          }

        </div>


        ${
          item.admin_feedback
            ? `
              <div class="admin-feedback">

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


        <div class="submission-actions">

          ${
            videoUrl
              ? `
                <button
                  type="button"
                  class="card-action"
                  data-action="preview"
                  data-id="${item.id}"
                >

                  <i class="fa-solid fa-play"></i>

                  Preview

                </button>
              `
              : ""
          }


          ${
            canApprove
              ? `
                <button
                  type="button"
                  class="card-action approve"
                  data-action="approve"
                  data-id="${item.id}"
                >

                  <i class="fa-solid fa-check"></i>

                  Approve

                </button>
              `
              : ""
          }


          ${
            canReview
              ? `
                <button
                  type="button"
                  class="card-action return"
                  data-action="return"
                  data-id="${item.id}"
                >

                  <i class="fa-solid fa-rotate-left"></i>

                  Return for Changes

                </button>


                <button
                  type="button"
                  class="card-action reject"
                  data-action="reject"
                  data-id="${item.id}"
                >

                  <i class="fa-solid fa-xmark"></i>

                  Reject

                </button>
              `
              : ""
          }

        </div>

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

  const icons = {

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

  const safeStatus =
    status ||
    "pending";

  return `

    <span class="status-badge ${escapeAttribute(
      safeStatus
    )}">

      <i class="${
        icons[safeStatus] ||
        "fa-solid fa-circle"
      }"></i>

      ${escapeHtml(
        formatStatus(
          safeStatus
        )
      )}

    </span>

  `;
}


/* =========================================================
   PLATFORMS
========================================================= */

function renderPlatformTag(
  platform
) {

  const iconMap = {

    facebook:
      "fa-brands fa-facebook-f",

    instagram:
      "fa-brands fa-instagram",

    tiktok:
      "fa-brands fa-tiktok",

    youtube:
      "fa-brands fa-youtube"

  };

  return `

    <span class="platform-tag">

      <i class="${
        iconMap[platform] ||
        "fa-solid fa-share-nodes"
      }"></i>

      ${escapeHtml(
        capitalize(
          platform
        )
      )}

    </span>

  `;
}


/* =========================================================
   CARD ACTIONS
========================================================= */

function bindSubmissionActions() {

  submissionList
    .querySelectorAll(
      "[data-action]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset.id;

            const item =
              submissions.find(
                submission =>
                  String(
                    submission.id
                  ) ===
                  String(
                    id
                  )
              );

            if (!item) {
              return;
            }

            const action =
              button.dataset.action;

            if (
              action ===
              "preview"
            ) {

              await openVideoViewer(
                item
              );

            }

            if (
              action ===
              "approve"
            ) {

              openApproveModal(
                item
              );

            }

            if (
              action ===
              "return"
            ) {

              openReturnModal(
                item
              );

            }

            if (
              action ===
              "reject"
            ) {

              openRejectModal(
                item
              );

            }

          }
        );

      }
    );
}


/* =========================================================
   APPROVE MODAL
========================================================= */

function openApproveModal(
  item
) {

  approveSubmissionId.value =
    item.id;

  approveCaption.value =
    item.caption || "";

  approveHashtags.value =
    item.hashtags || "";

  const selected =
    Array.isArray(
      item.requested_platforms
    )
      ? item.requested_platforms
      : [];

  document
    .querySelectorAll(
      'input[name="approvePlatform"]'
    )
    .forEach(
      checkbox => {

        checkbox.checked =
          selected.includes(
            checkbox.value
          );

      }
    );

  openModal(
    approveModal
  );
}


/* =========================================================
   APPROVE + QUEUE + AUTO PUBLISH
========================================================= */

confirmApproveButton.addEventListener(
  "click",
  async () => {

    const id =
      approveSubmissionId.value;

    if (!id) {
      return;
    }

    const platforms =
      getSelectedPlatforms(
        "approvePlatform"
      );

    if (
      !platforms.length
    ) {

      showMessage(
        "Select at least one social media platform.",
        "error"
      );

      return;
    }

    setButtonLoading(
      confirmApproveButton,
      true,
      "Approving..."
    );

    try {

      const now =
        new Date()
          .toISOString();

      const {
        error
      } =
        await supabase
          .from(
            "social_media_submissions"
          )
          .update({

            caption:
              cleanValue(
                approveCaption.value
              ),

            hashtags:
              cleanValue(
                approveHashtags.value
              ),

            approved_platforms:
              platforms,

            status:
              "approved",

            reviewed_by:
              currentAdmin.id,

            reviewed_at:
              now,

            admin_feedback:
              null,

            updated_at:
              now

          })
          .eq(
            "id",
            id
          );

      if (error) {
        throw error;
      }


      /*
       * Clear old queue rows that were never published.
       */

      const {
        error: deleteQueueError
      } =
        await supabase
          .from(
            "social_media_posts"
          )
          .delete()
          .eq(
            "submission_id",
            id
          )
          .eq(
            "status",
            "queued"
          );

      if (
        deleteQueueError
      ) {

        console.warn(
          "Could not clear old queue:",
          deleteQueueError
        );

      }


      /*
       * Create new platform queue rows.
       */

      const queueRows =
        platforms.map(
          platform => ({

            submission_id:
              id,

            platform,

            status:
              "queued"

          })
        );


      const {
        data:
          createdQueueRows,
        error:
          queueError
      } =
        await supabase
          .from(
            "social_media_posts"
          )
          .insert(
            queueRows
          )
          .select(
            "id, submission_id, platform, status"
          );

      if (
        queueError
      ) {
        throw queueError;
      }


      closeModal(
        approveModal
      );


      showMessage(
        "Submission approved. Starting supported platform publishing...",
        "success"
      );


      /*
       * YouTube will be invoked immediately.
       * Unsupported platforms remain queued.
       */

      const publishResult =
        await publishSupportedQueueRows(
          createdQueueRows || []
        );


      showMessage(
        buildPublishingMessage(
          publishResult
        ),
        publishResult.failed > 0
          ? "error"
          : "success"
      );


      await loadSubmissions();

    }
    catch (error) {

      console.error(
        error
      );


      showMessage(
        error.message ||
        "Could not approve submission.",
        "error"
      );

    }
    finally {

      setButtonLoading(
        confirmApproveButton,
        false,
        "Approve & Queue"
      );

    }

  }
);


/* =========================================================
   RETURN
========================================================= */

function openReturnModal(
  item
) {

  returnSubmissionId.value =
    item.id;

  returnReason.value =
    "";

  openModal(
    returnModal
  );
}


confirmReturnButton.addEventListener(
  "click",
  async () => {

    const id =
      returnSubmissionId.value;

    const feedback =
      returnReason
        .value
        .trim();

    if (
      !feedback
    ) {

      showMessage(
        "Enter the changes the member needs to make.",
        "error"
      );

      return;
    }

    setButtonLoading(
      confirmReturnButton,
      true,
      "Returning..."
    );

    try {

      const now =
        new Date()
          .toISOString();

      const {
        error
      } =
        await supabase
          .from(
            "social_media_submissions"
          )
          .update({

            status:
              "returned",

            admin_feedback:
              feedback,

            reviewed_by:
              currentAdmin.id,

            reviewed_at:
              now,

            approved_platforms:
              [],

            updated_at:
              now

          })
          .eq(
            "id",
            id
          );

      if (error) {
        throw error;
      }

      closeModal(
        returnModal
      );

      showMessage(
        "Submission returned to the member for corrections.",
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
        "Could not return submission.",
        "error"
      );

    }
    finally {

      setButtonLoading(
        confirmReturnButton,
        false,
        "Return to Member"
      );

    }

  }
);


/* =========================================================
   REJECT
========================================================= */

function openRejectModal(
  item
) {

  rejectSubmissionId.value =
    item.id;

  rejectReason.value =
    "";

  openModal(
    rejectModal
  );
}


confirmRejectButton.addEventListener(
  "click",
  async () => {

    const id =
      rejectSubmissionId.value;

    const reason =
      rejectReason
        .value
        .trim();

    if (
      !reason
    ) {

      showMessage(
        "Enter a rejection reason.",
        "error"
      );

      return;
    }

    setButtonLoading(
      confirmRejectButton,
      true,
      "Rejecting..."
    );

    try {

      const now =
        new Date()
          .toISOString();

      const {
        error
      } =
        await supabase
          .from(
            "social_media_submissions"
          )
          .update({

            status:
              "rejected",

            admin_feedback:
              reason,

            reviewed_by:
              currentAdmin.id,

            reviewed_at:
              now,

            approved_platforms:
              [],

            updated_at:
              now

          })
          .eq(
            "id",
            id
          );

      if (error) {
        throw error;
      }

      closeModal(
        rejectModal
      );

      showMessage(
        "Submission rejected.",
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
        "Could not reject submission.",
        "error"
      );

    }
    finally {

      setButtonLoading(
        confirmRejectButton,
        false,
        "Reject Submission"
      );

    }

  }
);


/* =========================================================
   DIRECT ADMIN POST
========================================================= */

createDirectPostButton.addEventListener(
  "click",
  () => {

    resetDirectPostForm();

    openModal(
      directPostModal
    );

  }
);


/* =========================================================
   DIRECT VIDEO CHOOSE
========================================================= */

chooseDirectPostVideo.addEventListener(
  "click",
  () => {

    directPostVideoFile.click();

  }
);


directPostVideoFile.addEventListener(
  "change",
  () => {

    const file =
      directPostVideoFile
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

      directPostVideoFile.value =
        "";

      return;
    }

    selectedDirectVideo =
      file;

    directPostVideoFileName
      .textContent =
        file.name;

    clearDirectPreviewUrl();

    directPreviewObjectUrl =
      URL.createObjectURL(
        file
      );

    directVideoPreview.src =
      directPreviewObjectUrl;

    directVideoPreviewContainer
      .classList
      .remove(
        "hidden"
      );

    directVideoPreview.load();

  }
);


/* =========================================================
   DIRECT POST SUBMIT
========================================================= */

directPostForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const title =
      directPostTitle
        .value
        .trim();

    if (!title) {

      showMessage(
        "Enter a post title.",
        "error"
      );

      return;
    }

    if (
      !selectedDirectVideo
    ) {

      showMessage(
        "Select a video.",
        "error"
      );

      return;
    }

    const platforms =
      getSelectedPlatforms(
        "directPlatform"
      );

    if (
      !platforms.length
    ) {

      showMessage(
        "Select at least one platform.",
        "error"
      );

      return;
    }

    setButtonLoading(
      submitDirectPostButton,
      true,
      "Uploading..."
    );

    try {

      const videoPath =
        await uploadAdminVideo(
          selectedDirectVideo
        );

      const now =
        new Date()
          .toISOString();


      /*
       * Direct admin-created submission.
       */

      const {
        data:
          submission,
        error:
          insertError
      } =
        await supabase
          .from(
            "social_media_submissions"
          )
          .insert({

            member_id:
              currentAdmin.id,

            title,

            caption:
              cleanValue(
                directPostCaption
                  .value
              ),

            hashtags:
              cleanValue(
                directPostHashtags
                  .value
              ),

            member_notes:
              "Direct admin post",

            video_url:
              videoPath,

            thumbnail_url:
              null,

            requested_platforms:
              [],

            approved_platforms:
              platforms,

            status:
              "approved",

            reviewed_by:
              currentAdmin.id,

            reviewed_at:
              now,

            submitted_at:
              now,

            updated_at:
              now

          })
          .select()
          .single();

      if (
        insertError
      ) {
        throw insertError;
      }


      const queue =
        platforms.map(
          platform => ({

            submission_id:
              submission.id,

            platform,

            status:
              "queued"

          })
        );


      const {
        data:
          createdQueueRows,
        error:
          queueError
      } =
        await supabase
          .from(
            "social_media_posts"
          )
          .insert(
            queue
          )
          .select(
            "id, submission_id, platform, status"
          );

      if (
        queueError
      ) {
        throw queueError;
      }


      closeModal(
        directPostModal
      );

      resetDirectPostForm();


      showMessage(
        "Direct post queued. Starting supported platform publishing...",
        "success"
      );


      const publishResult =
        await publishSupportedQueueRows(
          createdQueueRows || []
        );


      showMessage(
        buildPublishingMessage(
          publishResult
        ),
        publishResult.failed > 0
          ? "error"
          : "success"
      );


      await loadSubmissions();

    }
    catch (error) {

      console.error(
        error
      );

      showMessage(
        error.message ||
        "Could not create direct post.",
        "error"
      );

    }
    finally {

      setButtonLoading(
        submitDirectPostButton,
        false,
        "Queue Post"
      );

    }

  }
);


/* =========================================================
   PUBLISH SUPPORTED QUEUE ROWS
========================================================= */

async function publishSupportedQueueRows(
  queueRows
) {

  const rows =
    Array.isArray(
      queueRows
    )
      ? queueRows
      : [];


  /*
   * YouTube is currently connected.
   *
   * Facebook, Instagram and TikTok remain queued
   * until their API/backend integrations are added.
   */

  const youtubeRows =
    rows.filter(
      row =>
        row.platform ===
        "youtube"
    );


  const unsupportedRows =
    rows.filter(
      row =>
        row.platform !==
        "youtube"
    );


  let succeeded =
    0;

  let failed =
    0;


  for (
    const row of youtubeRows
  ) {

    try {

      const {
        data,
        error
      } =
        await supabase.functions
          .invoke(
            "social-publisher",
            {
              body: {
                post_id:
                  row.id
              }
            }
          );


      if (error) {
        throw error;
      }


      if (
        data?.success ===
        false
      ) {

        throw new Error(
          data?.error ||
          "YouTube publishing failed."
        );

      }


      succeeded += 1;

    }
    catch (error) {

      failed += 1;


      console.error(
        `Publishing failed for queue row ${row.id}:`,
        error
      );

    }

  }


  return {

    attempted:
      youtubeRows.length,

    succeeded,

    failed,

    queuedForLater:
      unsupportedRows.length,

    queuedPlatforms:
      unsupportedRows.map(
        row =>
          row.platform
      )

  };
}


/* =========================================================
   PUBLISHING RESULT MESSAGE
========================================================= */

function buildPublishingMessage(
  result
) {

  const parts =
    [];


  if (
    result.attempted > 0
  ) {

    if (
      result.succeeded > 0
    ) {

      parts.push(
        `${result.succeeded} YouTube post${
          result.succeeded === 1
            ? ""
            : "s"
        } published successfully.`
      );

    }


    if (
      result.failed > 0
    ) {

      parts.push(
        `${result.failed} YouTube post${
          result.failed === 1
            ? ""
            : "s"
        } failed. Check the Supabase Edge Function logs and the failed queue record for details.`
      );

    }

  }


  if (
    result.queuedForLater > 0
  ) {

    const names =
      [
        ...new Set(
          result.queuedPlatforms
            .map(
              platform =>
                capitalize(
                  platform
                )
            )
        )
      ]
        .join(
          ", "
        );


    parts.push(
      `${names} ${
        result.queuedForLater === 1
          ? "is"
          : "are"
      } still queued until ${
        result.queuedForLater === 1
          ? "its"
          : "their"
      } publishing integration is connected.`
    );

  }


  if (
    !parts.length
  ) {

    return "Post approved and queued.";

  }


  return parts.join(
    " "
  );
}


/* =========================================================
   ADMIN VIDEO UPLOAD
========================================================= */

async function uploadAdminVideo(
  file
) {

  const extension =
    getFileExtension(
      file.name
    );

  const path =
    `${currentAdmin.id}/admin/${Date.now()}-${crypto.randomUUID()}.${extension}`;


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
          upsert:
            false,

          contentType:
            file.type
        }
      );


  if (error) {

    throw new Error(
      `Video upload failed: ${error.message}`
    );

  }


  /*
   * Store private storage path,
   * not a public URL.
   */

  return path;
}


/* =========================================================
   PRIVATE STORAGE URL
========================================================= */

async function resolveMediaUrl(
  value
) {

  if (!value) {
    return null;
  }


  const trimmed =
    String(
      value
    )
      .trim();


  /*
   * Legacy submissions may contain full/public URLs.
   */

  if (
    isHttpUrl(
      trimmed
    )
  ) {

    return trimmed;

  }


  /*
   * Otherwise treat as a private Supabase
   * storage object path.
   */

  if (
    signedUrlCache.has(
      trimmed
    )
  ) {

    return signedUrlCache.get(
      trimmed
    );

  }


  const {
    data,
    error
  } =
    await supabase.storage
      .from(
        STORAGE_BUCKET
      )
      .createSignedUrl(
        trimmed,
        SIGNED_URL_SECONDS
      );


  if (error) {

    console.warn(
      "Signed URL error:",
      trimmed,
      error
    );

    return null;

  }


  const signedUrl =
    data?.signedUrl ||
    null;


  if (
    signedUrl
  ) {

    signedUrlCache.set(
      trimmed,
      signedUrl
    );

  }


  return signedUrl;
}


/* =========================================================
   VIDEO VIEWER
========================================================= */

async function openVideoViewer(
  item
) {

  const url =
    await resolveMediaUrl(
      item.video_url
    );


  if (!url) {

    showMessage(
      "Video preview is unavailable.",
      "error"
    );

    return;

  }


  fullVideoPreview.src =
    url;


  fullVideoPreview.load();


  videoViewer.classList.add(
    "open"
  );


  document.body.style.overflow =
    "hidden";
}


function closeVideoViewer() {

  videoViewer.classList.remove(
    "open"
  );


  fullVideoPreview.pause();


  fullVideoPreview
    .removeAttribute(
      "src"
    );


  fullVideoPreview.load();


  document.body.style.overflow =
    "";
}


/* =========================================================
   SELECT ALL
========================================================= */

approveSelectAllPlatforms
  .addEventListener(
    "click",
    () => {

      toggleSelectAll(
        "approvePlatform"
      );

    }
  );


directSelectAllPlatforms
  .addEventListener(
    "click",
    () => {

      toggleSelectAll(
        "directPlatform"
      );

    }
  );


function toggleSelectAll(
  name
) {

  const boxes =
    [
      ...document.querySelectorAll(
        `input[name="${name}"]`
      )
    ];


  const allChecked =
    boxes.every(
      checkbox =>
        checkbox.checked
    );


  boxes.forEach(
    checkbox => {

      checkbox.checked =
        !allChecked;

    }
  );
}


/* =========================================================
   MODALS
========================================================= */

function openModal(
  modal
) {

  if (!modal) {
    return;
  }


  modal.classList.add(
    "open"
  );


  document.body.style.overflow =
    "hidden";
}


function closeModal(
  modal
) {

  if (!modal) {
    return;
  }


  modal.classList.remove(
    "open"
  );


  document.body.style.overflow =
    "";
}


/* =========================================================
   MODAL CLOSE BUTTONS
========================================================= */

document
  .querySelectorAll(
    "[data-close-modal]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset
              .closeModal;


          const modal =
            document.getElementById(
              id
            );


          closeModal(
            modal
          );

        }
      );

    }
  );


document
  .querySelectorAll(
    ".social-modal"
  )
  .forEach(
    modal => {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            modal
          ) {

            closeModal(
              modal
            );

          }

        }
      );

    }
  );


/* =========================================================
   VIDEO VIEWER CLOSE
========================================================= */

document
  .querySelectorAll(
    "[data-close-video-viewer]"
  )
  .forEach(
    element => {

      element.addEventListener(
        "click",
        closeVideoViewer
      );

    }
  );


/* =========================================================
   DIRECT FORM RESET
========================================================= */

function resetDirectPostForm() {

  directPostForm.reset();


  selectedDirectVideo =
    null;


  directPostVideoFile.value =
    "";


  directPostVideoFileName
    .textContent =
      "No video selected";


  clearDirectPreviewUrl();


  directVideoPreview.pause();


  directVideoPreview
    .removeAttribute(
      "src"
    );


  directVideoPreview.load();


  directVideoPreviewContainer
    .classList
    .add(
      "hidden"
    );

}


/* =========================================================
   DIRECT PREVIEW URL
========================================================= */

function clearDirectPreviewUrl() {

  if (
    directPreviewObjectUrl
  ) {

    URL.revokeObjectURL(
      directPreviewObjectUrl
    );


    directPreviewObjectUrl =
      null;

  }

}


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


  approvedCount.textContent =
    submissions.filter(
      item =>
        item.status ===
        "approved"
    ).length;


  publishedCount.textContent =
    submissions.filter(
      item =>
        item.status ===
        "published"
    ).length;

}


/* =========================================================
   VALIDATE VIDEO
========================================================= */

function validateVideo(
  file
) {

  const allowedTypes =
    [
      "video/mp4",
      "video/webm",
      "video/quicktime"
    ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    throw new Error(
      "Please select an MP4, MOV, or WebM video."
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


/* =========================================================
   SELECTED PLATFORMS
========================================================= */

function getSelectedPlatforms(
  name
) {

  return [
    ...document.querySelectorAll(
      `input[name="${name}"]:checked`
    )
  ]
    .map(
      checkbox =>
        checkbox.value
    );

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
  button,
  loading,
  text
) {

  if (!button) {
    return;
  }


  button.disabled =
    loading;


  const icon =
    button.querySelector(
      "i"
    );


  const span =
    button.querySelector(
      "span"
    );


  if (
    loading
  ) {

    if (icon) {

      icon.className =
        "fa-solid fa-spinner fa-spin";

    }

  }
  else {

    if (
      button ===
      confirmApproveButton
    ) {

      if (icon) {
        icon.className =
          "fa-solid fa-check";
      }

    }


    if (
      button ===
      confirmReturnButton
    ) {

      if (icon) {
        icon.className =
          "fa-solid fa-rotate-left";
      }

    }


    if (
      button ===
      confirmRejectButton
    ) {

      if (icon) {
        icon.className =
          "fa-solid fa-xmark";
      }

    }


    if (
      button ===
      submitDirectPostButton
    ) {

      if (icon) {
        icon.className =
          "fa-solid fa-paper-plane";
      }

    }

  }


  if (span) {

    span.textContent =
      text;

  }
  else {

    const textNode =
      [
        ...button.childNodes
      ]
        .find(
          node =>
            node.nodeType ===
            Node.TEXT_NODE &&
            node.textContent.trim()
        );


    if (textNode) {

      textNode.textContent =
        ` ${text} `;

    }

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
    `admin-social-message ${type} show`;


  window.clearTimeout(
    showMessage.timer
  );


  showMessage.timer =
    window.setTimeout(
      () => {

        messageBox
          .classList
          .remove(
            "show"
          );

      },
      5000
    );

}


/* =========================================================
   SEARCH / FILTER
========================================================= */

searchInput.addEventListener(
  "input",
  () => {

    applyFilters();

  }
);


statusFilter.addEventListener(
  "change",
  () => {

    applyFilters();

  }
);


/* =========================================================
   REFRESH
========================================================= */

refreshButton.addEventListener(
  "click",
  async () => {

    refreshButton.disabled =
      true;


    refreshButton
      .querySelector(
        "i"
      )
      ?.classList
      .add(
        "fa-spin"
      );


    signedUrlCache.clear();


    await loadSubmissions();


    refreshButton.disabled =
      false;


    refreshButton
      .querySelector(
        "i"
      )
      ?.classList
      .remove(
        "fa-spin"
      );

  }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

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
      videoViewer
        .classList
        .contains(
          "open"
        )
    ) {

      closeVideoViewer();

      return;

    }


    document
      .querySelectorAll(
        ".social-modal.open"
      )
      .forEach(
        modal => {

          closeModal(
            modal
          );

        }
      );

  }
);


/* =========================================================
   LOGOUT
========================================================= */

logoutButton.addEventListener(
  "click",
  async () => {

    await supabase.auth
      .signOut();


    window.location.href =
      "login.html";

  }
);


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


  return cleaned ||
    null;
}


function getFileExtension(
  filename
) {

  const extension =
    String(
      filename || ""
    )
      .split(".")
      .pop()
      .toLowerCase();


  return extension ||
    "mp4";
}


function isHttpUrl(
  value
) {

  try {

    const url =
      new URL(
        value
      );


    return (
      url.protocol ===
        "https:" ||
      url.protocol ===
        "http:"
    );

  }
  catch {

    return false;

  }

}


function formatDate(
  value
) {

  if (!value) {
    return "Unknown";
  }


  try {

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
  catch {

    return value;

  }

}


function formatStatus(
  status
) {

  if (
    status ===
    "returned"
  ) {

    return "Returned";

  }


  if (
    status ===
    "publishing"
  ) {

    return "Publishing";

  }


  return capitalize(
    status
  );

}


function capitalize(
  value
) {

  const text =
    String(
      value || ""
    );


  if (!text) {
    return "";
  }


  return (
    text.charAt(0)
      .toUpperCase() +
    text.slice(1)
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


/* =========================================================
   START
========================================================= */

const authenticated =
  await requireAdmin();


if (
  authenticated
) {

  await loadSubmissions();

}