import { supabase }
from "../../js/supabase.js";

import { requireAdmin }
from "./admin-auth.js";


await requireAdmin();


/* =========================================================
   STORAGE CONFIG
========================================================= */

const IMAGE_BUCKET =
  "public-event-images";

const VIDEO_BUCKET =
  "public-event-videos";

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const MAX_VIDEO_SIZE =
  50 * 1024 * 1024;


/* =========================================================
   DOM
========================================================= */

const container =
  document.getElementById(
    "publicEventsContainer"
  );

const modal =
  document.getElementById(
    "publicEventModal"
  );

const deleteModal =
  document.getElementById(
    "deletePublicEventModal"
  );

const form =
  document.getElementById(
    "publicEventForm"
  );

const addButton =
  document.getElementById(
    "addPublicEventButton"
  );

const closeButton =
  document.getElementById(
    "closePublicEventModal"
  );

const cancelButton =
  document.getElementById(
    "cancelPublicEventButton"
  );

const searchInput =
  document.getElementById(
    "publicEventSearch"
  );

const statusFilter =
  document.getElementById(
    "publicStatusFilter"
  );

const messageBox =
  document.getElementById(
    "publicEventMessage"
  );

const modalTitle =
  document.getElementById(
    "publicEventModalTitle"
  );

const saveButton =
  document.getElementById(
    "savePublicEventButton"
  );

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


/* =========================================================
   FORM
========================================================= */

const idInput =
  document.getElementById(
    "publicEventId"
  );

const titleInput =
  document.getElementById(
    "publicEventTitle"
  );

const typeInput =
  document.getElementById(
    "publicEventType"
  );

const shortDescriptionInput =
  document.getElementById(
    "publicEventShortDescription"
  );

const descriptionInput =
  document.getElementById(
    "publicEventDescription"
  );

const dateInput =
  document.getElementById(
    "publicEventDate"
  );

const startTimeInput =
  document.getElementById(
    "publicEventStartTime"
  );

const endTimeInput =
  document.getElementById(
    "publicEventEndTime"
  );

const locationInput =
  document.getElementById(
    "publicEventLocation"
  );

const mapUrlInput =
  document.getElementById(
    "publicEventMapUrl"
  );

const imageUrlInput =
  document.getElementById(
    "publicEventImageUrl"
  );

const videoUrlInput =
  document.getElementById(
    "publicEventVideoUrl"
  );

const ticketUrlInput =
  document.getElementById(
    "publicEventTicketUrl"
  );

const registrationUrlInput =
  document.getElementById(
    "publicEventRegistrationUrl"
  );

const featuredInput =
  document.getElementById(
    "publicEventFeatured"
  );

const publishedInput =
  document.getElementById(
    "publicEventPublished"
  );


/* =========================================================
   IMAGE UPLOAD
========================================================= */

const imageFileInput =
  document.getElementById(
    "publicEventImageFile"
  );

const chooseImageButton =
  document.getElementById(
    "choosePublicEventImage"
  );

const imageFileName =
  document.getElementById(
    "publicEventImageFileName"
  );

const imagePreviewContainer =
  document.getElementById(
    "publicEventImagePreview"
  );

const imagePreviewImage =
  document.getElementById(
    "publicEventImagePreviewImage"
  );


/* =========================================================
   VIDEO UPLOAD
========================================================= */

const videoFileInput =
  document.getElementById(
    "publicEventVideoFile"
  );

const chooseVideoButton =
  document.getElementById(
    "choosePublicEventVideo"
  );

const videoFileName =
  document.getElementById(
    "publicEventVideoFileName"
  );

const videoPreviewContainer =
  document.getElementById(
    "publicEventVideoPreviewContainer"
  );

const videoPreview =
  document.getElementById(
    "publicEventVideoPreview"
  );


/* =========================================================
   STATS
========================================================= */

const totalCount =
  document.getElementById(
    "publicTotalCount"
  );

const publishedCount =
  document.getElementById(
    "publicPublishedCount"
  );

const upcomingCount =
  document.getElementById(
    "publicUpcomingCount"
  );

const featuredCount =
  document.getElementById(
    "publicFeaturedCount"
  );


/* =========================================================
   DELETE
========================================================= */

const cancelDeleteButton =
  document.getElementById(
    "cancelPublicDeleteButton"
  );

const confirmDeleteButton =
  document.getElementById(
    "confirmPublicDeleteButton"
  );


/* =========================================================
   STATE
========================================================= */

let publicEvents =
  [];

let deleteEventId =
  null;

let selectedImageFile =
  null;

let selectedVideoFile =
  null;

let imageObjectUrl =
  null;

let videoObjectUrl =
  null;


/* =========================================================
   LOAD EVENTS
========================================================= */

async function loadPublicEvents() {

  container.innerHTML = `
    <div class="public-events-loading">

      <i class="fa-solid fa-spinner fa-spin"></i>

      Loading public events...

    </div>
  `;


  const {
    data,
    error
  } =
    await supabase
      .from("public_events")
      .select("*")
      .order(
        "event_date",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Public events load error:",
      error
    );


    container.innerHTML = `
      <div class="public-empty-state">

        <i class="fa-solid fa-circle-exclamation"></i>

        <h3>
          Unable to load public events
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


  publicEvents =
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


  const filter =
    statusFilter.value;


  const today =
    getToday();


  const filtered =
    publicEvents.filter(
      event => {

        const searchable =
          [
            event.title,
            event.event_type,
            event.short_description,
            event.description,
            event.location
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
          filter === "published" &&
          !event.published
        ) {
          return false;
        }


        if (
          filter === "draft" &&
          event.published
        ) {
          return false;
        }


        if (
          filter === "featured" &&
          !event.featured
        ) {
          return false;
        }


        if (
          filter === "upcoming" &&
          event.event_date < today
        ) {
          return false;
        }


        if (
          filter === "past" &&
          event.event_date >= today
        ) {
          return false;
        }


        return true;

      }
    );


  renderEvents(
    filtered
  );

}


/* =========================================================
   RENDER
========================================================= */

function renderEvents(
  events
) {

  if (!events.length) {

    container.innerHTML = `
      <div class="public-empty-state">

        <i class="fa-regular fa-calendar"></i>

        <h3>
          No public events found
        </h3>

        <p>
          Create a public event or change
          your current filters.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    events
      .map(
        event =>
          renderEventCard(
            event
          )
      )
      .join("");


  bindCardActions();

}


/* =========================================================
   EVENT CARD
========================================================= */

function renderEventCard(
  event
) {

  const media =
    renderEventMedia(
      event
    );


  const time =
    formatEventTime(
      event.start_time,
      event.end_time
    );


  return `
    <article class="public-event-item">


      <div class="public-event-poster">

        ${media}

      </div>


      <div class="public-event-content">


        <div class="public-event-top">


          <div>


            <div class="public-event-badges">


              ${
                event.published
                  ? `
                    <span class="public-badge published">
                      Published
                    </span>
                  `
                  : `
                    <span class="public-badge draft">
                      Draft
                    </span>
                  `
              }


              ${
                event.featured
                  ? `
                    <span class="public-badge featured">

                      <i class="fa-solid fa-star"></i>

                      Featured

                    </span>
                  `
                  : ""
              }


              ${
                event.event_type
                  ? `
                    <span class="public-badge type">

                      ${escapeHtml(
                        event.event_type
                      )}

                    </span>
                  `
                  : ""
              }


              ${
                event.video_url
                  ? `
                    <span class="public-badge type">

                      <i class="fa-solid fa-video"></i>

                      Video

                    </span>
                  `
                  : ""
              }


            </div>


            <h3>
              ${escapeHtml(
                event.title
              )}
            </h3>


          </div>


          <div class="public-card-actions">


            <button
              type="button"
              data-action="edit"
              data-id="${event.id}"
              title="Edit"
            >

              <i class="fa-solid fa-pen"></i>

            </button>


            <button
              type="button"
              data-action="duplicate"
              data-id="${event.id}"
              title="Duplicate"
            >

              <i class="fa-regular fa-copy"></i>

            </button>


            <button
              type="button"
              data-action="delete"
              data-id="${event.id}"
              class="delete"
              title="Delete"
            >

              <i class="fa-regular fa-trash-can"></i>

            </button>


          </div>


        </div>


        ${
          event.short_description
            ? `
              <p class="public-event-description">

                ${escapeHtml(
                  event.short_description
                )}

              </p>
            `
            : ""
        }


        <div class="public-event-details">


          <span>

            <i class="fa-regular fa-calendar"></i>

            ${formatDate(
              event.event_date
            )}

          </span>


          ${
            time
              ? `
                <span>

                  <i class="fa-regular fa-clock"></i>

                  ${escapeHtml(
                    time
                  )}

                </span>
              `
              : ""
          }


          ${
            event.location
              ? `
                <span>

                  <i class="fa-solid fa-location-dot"></i>

                  ${escapeHtml(
                    event.location
                  )}

                </span>
              `
              : ""
          }


        </div>


        <div class="public-event-footer">


          <div class="public-quick-actions">


            <button
              type="button"
              data-action="publish"
              data-id="${event.id}"
            >

              <i class="${
                event.published
                  ? "fa-solid fa-eye-slash"
                  : "fa-solid fa-globe"
              }"></i>

              ${
                event.published
                  ? "Unpublish"
                  : "Publish"
              }

            </button>


            <button
              type="button"
              data-action="feature"
              data-id="${event.id}"
            >

              <i class="${
                event.featured
                  ? "fa-solid fa-star"
                  : "fa-regular fa-star"
              }"></i>

              ${
                event.featured
                  ? "Unfeature"
                  : "Feature"
              }

            </button>


            ${
              isSafeHttpUrl(
                event.ticket_url
              )
                ? `
                  <a
                    href="${escapeAttribute(
                      event.ticket_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >

                    <i class="fa-solid fa-ticket"></i>

                    Tickets

                  </a>
                `
                : ""
            }


            ${
              isSafeHttpUrl(
                event.registration_url
              )
                ? `
                  <a
                    href="${escapeAttribute(
                      event.registration_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >

                    <i class="fa-solid fa-clipboard-check"></i>

                    Register

                  </a>
                `
                : ""
            }


            <a
              href="../events.html"
              target="_blank"
              rel="noopener noreferrer"
            >

              <i class="fa-solid fa-arrow-up-right-from-square"></i>

              Preview

            </a>


          </div>


        </div>


      </div>


    </article>
  `;

}


/* =========================================================
   EVENT MEDIA
========================================================= */

function renderEventMedia(
  event
) {

  const videoUrl =
    cleanValue(
      event.video_url
    );


  const imageUrl =
    cleanValue(
      event.image_url
    );


  /* VIDEO FIRST */

  if (
    videoUrl &&
    isSafeHttpUrl(
      videoUrl
    )
  ) {

    if (
      isYouTubeUrl(
        videoUrl
      )
    ) {

      const embedUrl =
        getYouTubeEmbedUrl(
          videoUrl
        );


      if (
        embedUrl
      ) {

        return `
          <iframe
            class="public-event-media-video"
            src="${escapeAttribute(
              embedUrl
            )}"
            title="${escapeAttribute(
              event.title
            )} video"
            loading="lazy"
            allow="
              accelerometer;
              autoplay;
              clipboard-write;
              encrypted-media;
              gyroscope;
              picture-in-picture;
              web-share
            "
            allowfullscreen
          ></iframe>
        `;

      }

    }


    return `
      <video
        class="public-event-media-video"
        src="${escapeAttribute(
          videoUrl
        )}"
        controls
        preload="metadata"
      >
        Your browser does not support video playback.
      </video>
    `;

  }


  /* IMAGE SECOND */

  if (
    imageUrl &&
    isSafeHttpUrl(
      imageUrl
    )
  ) {

    return `
      <img
        src="${escapeAttribute(
          imageUrl
        )}"
        alt="${escapeAttribute(
          event.title
        )}"
        class="public-event-media-image"
        loading="lazy"
      >
    `;

  }


  /* NO MEDIA */

  return `
    <div class="public-event-placeholder">

      <i class="fa-solid fa-calendar-days"></i>

    </div>
  `;

}


/* =========================================================
   CARD ACTIONS
========================================================= */

function bindCardActions() {

  container
    .querySelectorAll(
      "[data-action]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const event =
              publicEvents.find(
                item =>
                  String(
                    item.id
                  ) ===
                  String(
                    button.dataset.id
                  )
              );


            if (!event) {
              return;
            }


            switch (
              button.dataset.action
            ) {

              case "edit":

                openEditModal(
                  event
                );

                break;


              case "duplicate":

                await duplicateEvent(
                  event
                );

                break;


              case "publish":

                await togglePublished(
                  event
                );

                break;


              case "feature":

                await toggleFeatured(
                  event
                );

                break;


              case "delete":

                openDeleteModal(
                  event.id
                );

                break;

            }

          }
        );

      }
    );

}


/* =========================================================
   CREATE
========================================================= */

function openCreateModal() {

  resetMediaState();

  form.reset();


  idInput.value =
    "";


  modalTitle.textContent =
    "Add Public Event";


  featuredInput.checked =
    false;


  publishedInput.checked =
    false;


  hideImagePreview();

  hideVideoPreview();


  openModal();

}


/* =========================================================
   EDIT
========================================================= */

function openEditModal(
  event
) {

  resetMediaState();

  form.reset();


  idInput.value =
    event.id;


  titleInput.value =
    event.title || "";


  typeInput.value =
    event.event_type || "";


  shortDescriptionInput.value =
    event.short_description || "";


  descriptionInput.value =
    event.description || "";


  dateInput.value =
    event.event_date || "";


  startTimeInput.value =
    trimTime(
      event.start_time
    );


  endTimeInput.value =
    trimTime(
      event.end_time
    );


  locationInput.value =
    event.location || "";


  mapUrlInput.value =
    event.map_url || "";


  imageUrlInput.value =
    event.image_url || "";


  videoUrlInput.value =
    event.video_url || "";


  ticketUrlInput.value =
    event.ticket_url || "";


  registrationUrlInput.value =
    event.registration_url || "";


  featuredInput.checked =
    event.featured === true;


  publishedInput.checked =
    event.published === true;


  modalTitle.textContent =
    "Edit Public Event";


  if (
    event.image_url
  ) {

    showImagePreview(
      event.image_url
    );

  }


  if (
    event.video_url &&
    !isYouTubeUrl(
      event.video_url
    )
  ) {

    showVideoPreview(
      event.video_url
    );

  }


  openModal();

}


/* =========================================================
   CHOOSE IMAGE BUTTON
========================================================= */

if (
  chooseImageButton &&
  imageFileInput
) {

  chooseImageButton.addEventListener(
    "click",
    () => {

      imageFileInput.click();

    }
  );

}


/* =========================================================
   IMAGE SELECTED
========================================================= */

if (
  imageFileInput
) {

  imageFileInput.addEventListener(
    "change",
    () => {

      const file =
        imageFileInput
          .files?.[0];


      if (!file) {
        return;
      }


      try {

        validateImageFile(
          file
        );

      }
      catch (error) {

        imageFileInput.value =
          "";

        selectedImageFile =
          null;


        showMessage(
          error.message,
          "error"
        );

        return;

      }


      selectedImageFile =
        file;


      if (
        imageFileName
      ) {

        imageFileName.textContent =
          file.name;

      }


      revokeImageObjectUrl();


      imageObjectUrl =
        URL.createObjectURL(
          file
        );


      showImagePreview(
        imageObjectUrl
      );

    }
  );

}


/* =========================================================
   CHOOSE VIDEO BUTTON
========================================================= */

if (
  chooseVideoButton &&
  videoFileInput
) {

  chooseVideoButton.addEventListener(
    "click",
    () => {

      videoFileInput.click();

    }
  );

}


/* =========================================================
   VIDEO SELECTED
========================================================= */

if (
  videoFileInput
) {

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

        validateVideoFile(
          file
        );

      }
      catch (error) {

        videoFileInput.value =
          "";

        selectedVideoFile =
          null;


        showMessage(
          error.message,
          "error"
        );

        return;

      }


      selectedVideoFile =
        file;


      if (
        videoFileName
      ) {

        videoFileName.textContent =
          file.name;

      }


      revokeVideoObjectUrl();


      videoObjectUrl =
        URL.createObjectURL(
          file
        );


      showVideoPreview(
        videoObjectUrl
      );

    }
  );

}


/* =========================================================
   IMAGE URL PREVIEW
========================================================= */

if (
  imageUrlInput
) {

  imageUrlInput.addEventListener(
    "input",
    () => {

      const url =
        imageUrlInput
          .value
          .trim();


      if (!url) {

        if (
          !selectedImageFile
        ) {

          hideImagePreview();

        }

        return;

      }


      if (
        isSafeHttpUrl(
          url
        )
      ) {

        showImagePreview(
          url
        );

      }

    }
  );

}


/* =========================================================
   VIDEO URL PREVIEW
========================================================= */

if (
  videoUrlInput
) {

  videoUrlInput.addEventListener(
    "input",
    () => {

      const url =
        videoUrlInput
          .value
          .trim();


      if (!url) {

        if (
          !selectedVideoFile
        ) {

          hideVideoPreview();

        }

        return;

      }


      if (
        isYouTubeUrl(
          url
        )
      ) {

        hideVideoPreview();

        return;

      }


      if (
        isSafeHttpUrl(
          url
        )
      ) {

        showVideoPreview(
          url
        );

      }

    }
  );

}


/* =========================================================
   SAVE EVENT
========================================================= */

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (
      !titleInput.value.trim() ||
      !dateInput.value
    ) {

      showMessage(
        "Event title and date are required.",
        "error"
      );

      return;

    }


    if (
      startTimeInput.value &&
      endTimeInput.value &&
      endTimeInput.value <
        startTimeInput.value
    ) {

      showMessage(
        "End time cannot be earlier than start time.",
        "error"
      );

      return;

    }


    setSaving(
      true
    );


    try {

      let finalImageUrl =
        cleanValue(
          imageUrlInput.value
        );


      let finalVideoUrl =
        cleanValue(
          videoUrlInput.value
        );


      if (
        selectedImageFile
      ) {

        finalImageUrl =
          await uploadPublicEventImage(
            selectedImageFile
          );

      }


      if (
        selectedVideoFile
      ) {

        finalVideoUrl =
          await uploadPublicEventVideo(
            selectedVideoFile
          );

      }


      let mediaType =
        null;


      if (
        finalImageUrl &&
        finalVideoUrl
      ) {

        mediaType =
          "image_video";

      }
      else if (
        finalVideoUrl
      ) {

        mediaType =
          "video";

      }
      else if (
        finalImageUrl
      ) {

        mediaType =
          "image";

      }


      const payload = {

        title:
          titleInput
            .value
            .trim(),

        event_type:
          cleanValue(
            typeInput.value
          ),

        short_description:
          cleanValue(
            shortDescriptionInput.value
          ),

        description:
          cleanValue(
            descriptionInput.value
          ),

        event_date:
          dateInput.value,

        start_time:
          cleanValue(
            startTimeInput.value
          ),

        end_time:
          cleanValue(
            endTimeInput.value
          ),

        location:
          cleanValue(
            locationInput.value
          ),

        map_url:
          cleanValue(
            mapUrlInput.value
          ),

        image_url:
          finalImageUrl,

        video_url:
          finalVideoUrl,

        media_type:
          mediaType,

        ticket_url:
          cleanValue(
            ticketUrlInput.value
          ),

        registration_url:
          cleanValue(
            registrationUrlInput.value
          ),

        featured:
          featuredInput.checked,

        published:
          publishedInput.checked,

        updated_at:
          new Date()
            .toISOString()

      };


      const editing =
        Boolean(
          idInput.value
        );


      let response;


      if (
        editing
      ) {

        response =
          await supabase
            .from(
              "public_events"
            )
            .update(
              payload
            )
            .eq(
              "id",
              idInput.value
            );

      }
      else {

        response =
          await supabase
            .from(
              "public_events"
            )
            .insert({

              ...payload,

              created_at:
                new Date()
                  .toISOString()

            });

      }


      if (
        response.error
      ) {

        throw response.error;

      }


      closeModal();


      showMessage(
        editing
          ? "Public event updated."
          : "Public event created.",
        "success"
      );


      await loadPublicEvents();

    }
    catch (error) {

      console.error(
        "Public event save error:",
        error
      );


      showMessage(
        error.message ||
        "Could not save the public event.",
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
   UPLOAD IMAGE
========================================================= */

async function uploadPublicEventImage(
  file
) {

  validateImageFile(
    file
  );


  const extension =
    getFileExtension(
      file.name
    );


  const path =
    `events/${Date.now()}-${crypto.randomUUID()}.${extension}`;


  const {
    error
  } =
    await supabase.storage
      .from(
        IMAGE_BUCKET
      )
      .upload(
        path,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type
        }
      );


  if (
    error
  ) {

    throw new Error(
      `Image upload failed: ${error.message}`
    );

  }


  const {
    data
  } =
    supabase.storage
      .from(
        IMAGE_BUCKET
      )
      .getPublicUrl(
        path
      );


  if (
    !data?.publicUrl
  ) {

    throw new Error(
      "Could not create the image URL."
    );

  }


  return data.publicUrl;

}


/* =========================================================
   UPLOAD VIDEO
========================================================= */

async function uploadPublicEventVideo(
  file
) {

  validateVideoFile(
    file
  );


  const extension =
    getFileExtension(
      file.name
    );


  const path =
    `events/${Date.now()}-${crypto.randomUUID()}.${extension}`;


  const {
    error
  } =
    await supabase.storage
      .from(
        VIDEO_BUCKET
      )
      .upload(
        path,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type
        }
      );


  if (
    error
  ) {

    throw new Error(
      `Video upload failed: ${error.message}`
    );

  }


  const {
    data
  } =
    supabase.storage
      .from(
        VIDEO_BUCKET
      )
      .getPublicUrl(
        path
      );


  if (
    !data?.publicUrl
  ) {

    throw new Error(
      "Could not create the video URL."
    );

  }


  return data.publicUrl;

}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function showImagePreview(
  url
) {

  if (
    !imagePreviewContainer ||
    !imagePreviewImage
  ) {
    return;
  }


  imagePreviewImage.src =
    url;


  imagePreviewContainer
    .classList
    .remove(
      "hidden"
    );

}


function hideImagePreview() {

  if (
    !imagePreviewContainer ||
    !imagePreviewImage
  ) {
    return;
  }


  imagePreviewContainer
    .classList
    .add(
      "hidden"
    );


  imagePreviewImage
    .removeAttribute(
      "src"
    );

}


/* =========================================================
   VIDEO PREVIEW
========================================================= */

function showVideoPreview(
  url
) {

  if (
    !videoPreviewContainer ||
    !videoPreview
  ) {
    return;
  }


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

  if (
    !videoPreviewContainer ||
    !videoPreview
  ) {
    return;
  }


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
   PREVIEW ERRORS
========================================================= */

if (
  imagePreviewImage
) {

  imagePreviewImage.addEventListener(
    "error",
    () => {

      if (
        !selectedImageFile
      ) {

        hideImagePreview();

      }

    }
  );

}


if (
  videoPreview
) {

  videoPreview.addEventListener(
    "error",
    () => {

      if (
        !selectedVideoFile
      ) {

        hideVideoPreview();

      }

    }
  );

}


/* =========================================================
   VALIDATE IMAGE
========================================================= */

function validateImageFile(
  file
) {

  const allowedTypes =
    [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    throw new Error(
      "Please choose a JPG, PNG, or WebP image."
    );

  }


  if (
    file.size >
    MAX_IMAGE_SIZE
  ) {

    throw new Error(
      "Image must be 5 MB or smaller."
    );

  }

}


/* =========================================================
   VALIDATE VIDEO
========================================================= */

function validateVideoFile(
  file
) {

  const allowedTypes =
    [
      "video/mp4",
      "video/webm"
    ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    throw new Error(
      "Please choose an MP4 or WebM video."
    );

  }


  if (
    file.size >
    MAX_VIDEO_SIZE
  ) {

    throw new Error(
      "Video must be 50 MB or smaller."
    );

  }

}


/* =========================================================
   RESET MEDIA
========================================================= */

function resetMediaState() {

  selectedImageFile =
    null;


  selectedVideoFile =
    null;


  if (
    imageFileInput
  ) {

    imageFileInput.value =
      "";

  }


  if (
    videoFileInput
  ) {

    videoFileInput.value =
      "";

  }


  if (
    imageFileName
  ) {

    imageFileName.textContent =
      "No image selected";

  }


  if (
    videoFileName
  ) {

    videoFileName.textContent =
      "No video selected";

  }


  revokeImageObjectUrl();

  revokeVideoObjectUrl();

}


/* =========================================================
   PUBLISH
========================================================= */

async function togglePublished(
  event
) {

  const {
    error
  } =
    await supabase
      .from(
        "public_events"
      )
      .update({

        published:
          !event.published,

        updated_at:
          new Date()
            .toISOString()

      })
      .eq(
        "id",
        event.id
      );


  if (
    error
  ) {

    showMessage(
      error.message,
      "error"
    );

    return;
  }


  showMessage(
    event.published
      ? "Event unpublished."
      : "Event published to website.",
    "success"
  );


  await loadPublicEvents();

}


/* =========================================================
   FEATURE
========================================================= */

async function toggleFeatured(
  event
) {

  const {
    error
  } =
    await supabase
      .from(
        "public_events"
      )
      .update({

        featured:
          !event.featured,

        updated_at:
          new Date()
            .toISOString()

      })
      .eq(
        "id",
        event.id
      );


  if (
    error
  ) {

    showMessage(
      error.message,
      "error"
    );

    return;
  }


  showMessage(
    "Featured status updated.",
    "success"
  );


  await loadPublicEvents();

}


/* =========================================================
   DUPLICATE
========================================================= */

async function duplicateEvent(
  event
) {

  const {
    id,
    created_at,
    updated_at,
    ...copy
  } =
    event;


  const {
    error
  } =
    await supabase
      .from(
        "public_events"
      )
      .insert({

        ...copy,

        title:
          `${event.title} Copy`,

        published:
          false,

        featured:
          false,

        created_at:
          new Date()
            .toISOString(),

        updated_at:
          new Date()
            .toISOString()

      });


  if (
    error
  ) {

    showMessage(
      error.message,
      "error"
    );

    return;
  }


  showMessage(
    "Event duplicated as draft.",
    "success"
  );


  await loadPublicEvents();

}


/* =========================================================
   DELETE
========================================================= */

function openDeleteModal(
  id
) {

  deleteEventId =
    id;


  deleteModal
    .classList
    .add(
      "open"
    );

}


function closeDeleteModal() {

  deleteEventId =
    null;


  deleteModal
    .classList
    .remove(
      "open"
    );

}


confirmDeleteButton.addEventListener(
  "click",
  async () => {

    if (
      !deleteEventId
    ) {
      return;
    }


    const {
      error
    } =
      await supabase
        .from(
          "public_events"
        )
        .delete()
        .eq(
          "id",
          deleteEventId
        );


    if (
      error
    ) {

      showMessage(
        error.message,
        "error"
      );

      return;
    }


    closeDeleteModal();


    showMessage(
      "Public event deleted.",
      "success"
    );


    await loadPublicEvents();

  }
);


/* =========================================================
   STATS
========================================================= */

function updateStats() {

  const today =
    getToday();


  totalCount.textContent =
    publicEvents.length;


  publishedCount.textContent =
    publicEvents.filter(
      event =>
        event.published
    ).length;


  upcomingCount.textContent =
    publicEvents.filter(
      event =>
        event.event_date >= today
    ).length;


  featuredCount.textContent =
    publicEvents.filter(
      event =>
        event.featured
    ).length;

}


/* =========================================================
   MODAL
========================================================= */

function openModal() {

  modal
    .classList
    .add(
      "open"
    );


  document.body.style.overflow =
    "hidden";

}


function closeModal() {

  modal
    .classList
    .remove(
      "open"
    );


  document.body.style.overflow =
    "";


  revokeImageObjectUrl();

  revokeVideoObjectUrl();

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
    `public-event-message ${type} show`;


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
      4000
    );

}


/* =========================================================
   BUTTON STATE
========================================================= */

function setSaving(
  saving
) {

  saveButton.disabled =
    saving;


  const text =
    saveButton.querySelector(
      "span"
    );


  const icon =
    saveButton.querySelector(
      "i"
    );


  if (
    text
  ) {

    text.textContent =
      saving
        ? "Saving..."
        : "Save Event";

  }


  if (
    icon
  ) {

    icon.className =
      saving
        ? "fa-solid fa-spinner fa-spin"
        : "fa-solid fa-floppy-disk";

  }

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


function trimTime(
  value
) {

  return value
    ? value.slice(
        0,
        5
      )
    : "";

}


function getToday() {

  const date =
    new Date();


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    )
      .padStart(
        2,
        "0"
      );


  const day =
    String(
      date.getDate()
    )
      .padStart(
        2,
        "0"
      );


  return (
    `${year}-${month}-${day}`
  );

}


function formatDate(
  value
) {

  if (!value) {
    return "";
  }


  return new Date(
    `${value}T12:00:00`
  )
    .toLocaleDateString(
      "en-US",
      {
        month:
          "short",

        day:
          "numeric",

        year:
          "numeric"
      }
    );

}


function formatEventTime(
  start,
  end
) {

  if (!start) {
    return "";
  }


  const first =
    formatTime(
      start
    );


  if (!end) {
    return first;
  }


  return (
    `${first} – ${formatTime(end)}`
  );

}


function formatTime(
  value
) {

  if (!value) {
    return "";
  }


  const [
    hours,
    minutes
  ] =
    value.split(":");


  let hour =
    Number(
      hours
    );


  const period =
    hour >= 12
      ? "PM"
      : "AM";


  hour =
    hour % 12 ||
    12;


  return (
    `${hour}:${minutes} ${period}`
  );

}


function getFileExtension(
  filename
) {

  const extension =
    String(
      filename
    )
      .split(".")
      .pop()
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );


  return extension ||
    "file";

}


function isSafeHttpUrl(
  value
) {

  if (!value) {
    return false;
  }


  try {

    const url =
      new URL(
        value
      );


    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );

  }
  catch {

    return false;

  }

}


function isYouTubeUrl(
  value
) {

  if (!value) {
    return false;
  }


  try {

    const url =
      new URL(
        value
      );


    const hostname =
      url.hostname
        .toLowerCase();


    return (
      hostname === "youtu.be" ||
      hostname.endsWith(
        ".youtu.be"
      ) ||
      hostname === "youtube.com" ||
      hostname.endsWith(
        ".youtube.com"
      )
    );

  }
  catch {

    return false;

  }

}


/* =========================================================
   YOUTUBE EMBED URL
========================================================= */

function getYouTubeEmbedUrl(
  value
) {

  if (!value) {
    return null;
  }


  try {

    const url =
      new URL(
        value
      );


    let videoId =
      null;


    const hostname =
      url.hostname
        .toLowerCase();


    if (
      hostname === "youtu.be" ||
      hostname.endsWith(
        ".youtu.be"
      )
    ) {

      videoId =
        url.pathname
          .replace(/^\/+/, "")
          .split("/")[0];

    }
    else if (
      hostname === "youtube.com" ||
      hostname.endsWith(
        ".youtube.com"
      )
    ) {

      if (
        url.pathname === "/watch"
      ) {

        videoId =
          url.searchParams.get(
            "v"
          );

      }
      else if (
        url.pathname.startsWith(
          "/shorts/"
        )
      ) {

        videoId =
          url.pathname
            .split("/")[2];

      }
      else if (
        url.pathname.startsWith(
          "/embed/"
        )
      ) {

        videoId =
          url.pathname
            .split("/")[2];

      }

    }


    if (
      !videoId
    ) {
      return null;
    }


    return (
      `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
    );

  }
  catch {

    return null;

  }

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
   OBJECT URL CLEANUP
========================================================= */

function revokeImageObjectUrl() {

  if (
    imageObjectUrl
  ) {

    URL.revokeObjectURL(
      imageObjectUrl
    );


    imageObjectUrl =
      null;

  }

}


function revokeVideoObjectUrl() {

  if (
    videoObjectUrl
  ) {

    URL.revokeObjectURL(
      videoObjectUrl
    );


    videoObjectUrl =
      null;

  }

}


/* =========================================================
   EVENTS
========================================================= */

addButton.addEventListener(
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


/* =========================================================
   MODAL BACKDROP
========================================================= */

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


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Escape"
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


/* =========================================================
   LOGOUT
========================================================= */

logoutButton.addEventListener(
  "click",
  async () => {

    await supabase.auth.signOut();


    window.location.href =
      "index.html";

  }
);


/* =========================================================
   START
========================================================= */

loadPublicEvents();