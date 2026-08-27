import { supabase }
from "../../js/supabase.js";


let currentUser = null;

let allEvents = [];

let eventToDelete = null;


/* ========================================
   ELEMENTS
======================================== */

const adminEmail =
  document.getElementById("adminEmail");

const upcomingCount =
  document.getElementById("upcomingCount");

const totalRsvpCount =
  document.getElementById("totalRsvpCount");

const featuredCount =
  document.getElementById("featuredCount");

const publishedCount =
  document.getElementById("publishedCount");

const eventsContainer =
  document.getElementById("eventsContainer");

const eventSearch =
  document.getElementById("eventSearch");

const categoryFilter =
  document.getElementById("categoryFilter");

const statusFilter =
  document.getElementById("statusFilter");


/* ========================================
   EVENT MODAL
======================================== */

const eventModal =
  document.getElementById("eventModal");

const eventModalTitle =
  document.getElementById("eventModalTitle");

const eventForm =
  document.getElementById("eventForm");

const eventId =
  document.getElementById("eventId");

const eventTitle =
  document.getElementById("eventTitle");

const eventCategory =
  document.getElementById("eventCategory");

const eventLocation =
  document.getElementById("eventLocation");

const eventStart =
  document.getElementById("eventStart");

const eventEnd =
  document.getElementById("eventEnd");

const eventShortDescription =
  document.getElementById(
    "eventShortDescription"
  );

const eventDescription =
  document.getElementById(
    "eventDescription"
  );

const rsvpEnabled =
  document.getElementById("rsvpEnabled");

const featuredEvent =
  document.getElementById("featuredEvent");

const publishEvent =
  document.getElementById("publishEvent");


/* ========================================
   DELETE MODAL
======================================== */

const deleteModal =
  document.getElementById("deleteModal");

const confirmDeleteButton =
  document.getElementById(
    "confirmDeleteButton"
  );

const cancelDeleteButton =
  document.getElementById(
    "cancelDeleteButton"
  );


/* ========================================
   AUTHENTICATE ADMIN
======================================== */

async function authenticateAdmin() {

  try {

    const {
      data: {
        session
      },
      error
    } =
      await supabase.auth.getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      return false;

    }


    if (!session) {

      window.location.replace(
        "../member-portal/index.html"
      );

      return false;

    }


    currentUser =
      session.user;


    if (adminEmail) {

      adminEmail.textContent =
        currentUser.email ||
        "Admin";

    }


    return true;

  }

  catch (error) {

    console.error(
      "Admin authentication failed:",
      error
    );


    if (adminEmail) {

      adminEmail.textContent =
        "Error";

    }


    return false;

  }

}


/* ========================================
   LOAD EVENTS
======================================== */

async function loadEvents() {

  eventsContainer.innerHTML = `

    <div class="events-loading">

      <i class="fa-solid fa-spinner fa-spin"></i>

      Loading events...

    </div>

  `;


  try {

    const {
      data,
      error
    } =
      await supabase

        .from("events")

        .select("*")

        .order(
          "start_at",
          {
            ascending: true
          }
        );


    if (error) {

      throw error;

    }


    allEvents =
      data || [];


    await loadRsvpCounts();


    updateStatistics();


    filterEvents();

  }

  catch (error) {

    console.error(
      "EVENT LOAD ERROR:",
      error
    );


    eventsContainer.innerHTML = `

      <div class="events-empty">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <h3>
          Events could not be loaded
        </h3>

        <p>
          ${
            escapeHTML(
              error.message ||
              "Unknown database error"
            )
          }
        </p>

      </div>

    `;

  }

}


/* ========================================
   LOAD RSVP COUNTS
======================================== */

async function loadRsvpCounts() {

  const {
    data,
    error
  } =
    await supabase

      .from("event_rsvps")

      .select(
        "event_id, status"
      );


  if (error) {

    console.warn(
      "Could not load RSVP counts:",
      error
    );


    allEvents =
      allEvents.map(
        event => ({
          ...event,
          going_count: 0,
          maybe_count: 0,
          not_going_count: 0
        })
      );


    return;

  }


  allEvents =
    allEvents.map(
      event => {

        const eventRsvps =
          data.filter(
            rsvp =>
              rsvp.event_id ===
              event.id
          );


        return {

          ...event,

          going_count:
            eventRsvps.filter(
              rsvp =>
                rsvp.status ===
                "going"
            ).length,

          maybe_count:
            eventRsvps.filter(
              rsvp =>
                rsvp.status ===
                "maybe"
            ).length,

          not_going_count:
            eventRsvps.filter(
              rsvp =>
                rsvp.status ===
                "not_going"
            ).length

        };

      }
    );

}


/* ========================================
   UPDATE STATISTICS
======================================== */

function updateStatistics() {

  const now =
    new Date();


  const upcoming =
    allEvents.filter(
      event => {

        const end =
          event.end_at
            ? new Date(event.end_at)
            : new Date(event.start_at);


        return (
          end >= now &&
          event.is_published
        );

      }
    );


  const featured =
    allEvents.filter(
      event =>
        event.featured &&
        event.is_published
    );


  const published =
    allEvents.filter(
      event =>
        event.is_published
    );


  const totalGoing =
    allEvents.reduce(
      (
        total,
        event
      ) =>
        total +
        (
          event.going_count ||
          0
        ),
      0
    );


  upcomingCount.textContent =
    upcoming.length;


  totalRsvpCount.textContent =
    totalGoing;


  featuredCount.textContent =
    featured.length;


  publishedCount.textContent =
    published.length;

}


/* ========================================
   FILTER EVENTS
======================================== */

function filterEvents() {

  const searchValue =
    eventSearch.value
      .trim()
      .toLowerCase();


  const categoryValue =
    categoryFilter.value;


  const statusValue =
    statusFilter.value;


  const now =
    new Date();


  const filtered =
    allEvents.filter(
      event => {

        const searchText = `

          ${event.title || ""}

          ${event.description || ""}

          ${event.short_description || ""}

          ${event.location || ""}

          ${event.category || ""}

        `.toLowerCase();


        const matchesSearch =
          !searchValue ||
          searchText.includes(
            searchValue
          );


        const matchesCategory =
          !categoryValue ||
          event.category ===
          categoryValue;


        let matchesStatus =
          true;


        const endDate =
          event.end_at
            ? new Date(event.end_at)
            : new Date(event.start_at);


        if (
          statusValue ===
          "published"
        ) {

          matchesStatus =
            event.is_published ===
            true;

        }


        if (
          statusValue ===
          "draft"
        ) {

          matchesStatus =
            event.is_published ===
            false;

        }


        if (
          statusValue ===
          "past"
        ) {

          matchesStatus =
            endDate < now;

        }


        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus
        );

      }
    );


  renderEvents(
    filtered
  );

}


/* ========================================
   RENDER EVENTS
======================================== */

function renderEvents(
  events
) {

  eventsContainer.innerHTML =
    "";


  if (
    events.length === 0
  ) {

    eventsContainer.innerHTML = `

      <div class="events-empty">

        <i class="fa-regular fa-calendar-xmark"></i>

        <h3>
          No events yet
        </h3>

        <p>
          Click Add Event to create the first PNGSA event.
        </p>

      </div>

    `;


    return;

  }


  events.forEach(
    event => {

      const startDate =
        new Date(
          event.start_at
        );


      const endDate =
        event.end_at
          ? new Date(event.end_at)
          : startDate;


      const isPast =
        endDate <
        new Date();


      let statusText =
        event.is_published
          ? "Published"
          : "Draft";


      let statusClass =
        event.is_published
          ? "published"
          : "draft";


      if (isPast) {

        statusText =
          "Past";


        statusClass =
          "past";

      }


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-event-card";


      card.innerHTML = `

        <div class="admin-event-date">

          <span>

            ${
              startDate.toLocaleString(
                "en-US",
                {
                  month: "short"
                }
              )
            }

          </span>

          <strong>

            ${
              startDate.getDate()
            }

          </strong>

        </div>


        <div class="admin-event-info">


          <div class="admin-event-title-row">

            <h3>

              ${
                escapeHTML(
                  event.title
                )
              }

            </h3>


            ${
              event.category
                ? `

                  <span class="event-category-badge">

                    ${
                      escapeHTML(
                        event.category
                      )
                    }

                  </span>

                `
                : ""
            }


            <span
              class="
                event-status-badge
                ${statusClass}
              "
            >

              ${statusText}

            </span>


            ${
              event.featured
                ? `

                  <span class="featured-badge">

                    <i class="fa-solid fa-star"></i>

                    Featured

                  </span>

                `
                : ""
            }

          </div>


          <div class="admin-event-meta">

            <span>

              <i class="fa-regular fa-clock"></i>

              ${
                formatDateTime(
                  event.start_at
                )
              }

            </span>


            ${
              event.location
                ? `

                  <span>

                    <i class="fa-solid fa-location-dot"></i>

                    ${
                      escapeHTML(
                        event.location
                      )
                    }

                  </span>

                `
                : ""
            }

          </div>


          ${
            event.short_description
              ? `

                <p class="admin-event-description">

                  ${
                    escapeHTML(
                      event.short_description
                    )
                  }

                </p>

              `
              : ""
          }


          ${
            event.rsvp_enabled
              ? `

                <div class="admin-event-rsvp">

                  <span class="rsvp-item">

                    <strong>
                      ${event.going_count || 0}
                    </strong>

                    Going

                  </span>


                  <span class="rsvp-item">

                    <strong>
                      ${event.maybe_count || 0}
                    </strong>

                    Maybe

                  </span>


                  <span class="rsvp-item">

                    <strong>
                      ${event.not_going_count || 0}
                    </strong>

                    Can't Go

                  </span>

                </div>

              `
              : ""
          }

        </div>


        <div class="admin-event-actions">

          <button
            class="icon-button edit"
            type="button"
            title="Edit Event"
          >

            <i class="fa-solid fa-pen"></i>

          </button>


          <button
            class="icon-button delete"
            type="button"
            title="Delete Event"
          >

            <i class="fa-solid fa-trash"></i>

          </button>

        </div>

      `;


      card
        .querySelector(".edit")
        .addEventListener(
          "click",
          () => {

            openEditEvent(
              event
            );

          }
        );


      card
        .querySelector(".delete")
        .addEventListener(
          "click",
          () => {

            openDeleteModal(
              event
            );

          }
        );


      eventsContainer.appendChild(
        card
      );

    }
  );

}


/* ========================================
   OPEN ADD EVENT
======================================== */

function openAddEvent() {

  eventForm.reset();


  eventId.value =
    "";


  eventModalTitle.textContent =
    "Add Event";


  rsvpEnabled.checked =
    true;


  featuredEvent.checked =
    false;


  publishEvent.checked =
    true;


  eventModal.classList.add(
    "show"
  );

}


/* ========================================
   OPEN EDIT EVENT
======================================== */

function openEditEvent(
  event
) {

  eventId.value =
    event.id;


  eventTitle.value =
    event.title ||
    "";


  eventCategory.value =
    event.category ||
    "General Meeting";


  eventLocation.value =
    event.location ||
    "";


  eventStart.value =
    convertToLocalInput(
      event.start_at
    );


  eventEnd.value =
    event.end_at
      ? convertToLocalInput(
          event.end_at
        )
      : "";


  eventShortDescription.value =
    event.short_description ||
    "";


  eventDescription.value =
    event.description ||
    "";


  rsvpEnabled.checked =
    Boolean(
      event.rsvp_enabled
    );


  featuredEvent.checked =
    Boolean(
      event.featured
    );


  publishEvent.checked =
    Boolean(
      event.is_published
    );


  eventModalTitle.textContent =
    "Edit Event";


  eventModal.classList.add(
    "show"
  );

}


/* ========================================
   SAVE EVENT
======================================== */

eventForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const title =
      eventTitle.value.trim();


    if (!title) {

      alert(
        "Please enter an event title."
      );

      return;

    }


    if (!eventStart.value) {

      alert(
        "Please enter the event start date and time."
      );

      return;

    }


    if (
      eventEnd.value &&
      new Date(eventEnd.value) <
      new Date(eventStart.value)
    ) {

      alert(
        "The event end time cannot be before the start time."
      );

      return;

    }


    const payload = {

      title:
        title,

      category:
        eventCategory.value,

      location:
        eventLocation.value.trim(),

      start_at:
        new Date(
          eventStart.value
        ).toISOString(),

      end_at:
        eventEnd.value
          ? new Date(
              eventEnd.value
            ).toISOString()
          : null,

      short_description:
        eventShortDescription
          .value
          .trim(),

      description:
        eventDescription
          .value
          .trim(),

      rsvp_enabled:
        rsvpEnabled.checked,

      featured:
        featuredEvent.checked,

      is_published:
        publishEvent.checked

    };


    try {

      let response;


      if (eventId.value) {

        response =
          await supabase

            .from("events")

            .update(
              payload
            )

            .eq(
              "id",
              eventId.value
            );

      }

      else {

        payload.created_by =
          currentUser.id;


        response =
          await supabase

            .from("events")

            .insert(
              payload
            );

      }


      if (response.error) {

        throw response.error;

      }


      eventModal.classList.remove(
        "show"
      );


      await loadEvents();

    }

    catch (error) {

      console.error(
        "SAVE EVENT ERROR:",
        error
      );


      alert(
        "Event could not be saved: " +
        error.message
      );

    }

  }
);


/* ========================================
   DELETE EVENT
======================================== */

function openDeleteModal(
  event
) {

  eventToDelete =
    event;


  deleteModal.classList.add(
    "show"
  );

}


function closeDeleteModal() {

  eventToDelete =
    null;


  deleteModal.classList.remove(
    "show"
  );

}


async function deleteEvent() {

  if (!eventToDelete) {

    return;

  }


  const {
    error
  } =
    await supabase

      .from("events")

      .delete()

      .eq(
        "id",
        eventToDelete.id
      );


  if (error) {

    console.error(
      "DELETE ERROR:",
      error
    );


    alert(
      error.message
    );


    return;

  }


  closeDeleteModal();


  await loadEvents();

}


/* ========================================
   REALTIME
======================================== */

function subscribeToEvents() {

  supabase

    .channel(
      "pngsa-admin-events"
    )

    .on(

      "postgres_changes",

      {

        event:
          "*",

        schema:
          "public",

        table:
          "events"

      },

      async () => {

        await loadEvents();

      }

    )

    .subscribe();

}


/* ========================================
   HELPERS
======================================== */

function convertToLocalInput(
  value
) {

  const date =
    new Date(
      value
    );


  const offset =
    date.getTimezoneOffset();


  const localDate =
    new Date(
      date.getTime() -
      offset * 60000
    );


  return localDate
    .toISOString()
    .slice(
      0,
      16
    );

}


function formatDateTime(
  value
) {

  if (!value) {

    return "—";

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


function escapeHTML(
  value
) {

  return String(
    value ||
    ""
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


/* ========================================
   BUTTONS
======================================== */

document
  .getElementById(
    "addEventButton"
  )
  .addEventListener(
    "click",
    openAddEvent
  );


document
  .getElementById(
    "closeEventModal"
  )
  .addEventListener(
    "click",
    () => {

      eventModal.classList.remove(
        "show"
      );

    }
  );


document
  .getElementById(
    "cancelEventButton"
  )
  .addEventListener(
    "click",
    () => {

      eventModal.classList.remove(
        "show"
      );

    }
  );


confirmDeleteButton
  .addEventListener(
    "click",
    deleteEvent
  );


cancelDeleteButton
  .addEventListener(
    "click",
    closeDeleteModal
  );


eventSearch.addEventListener(
  "input",
  filterEvents
);


categoryFilter.addEventListener(
  "change",
  filterEvents
);


statusFilter.addEventListener(
  "change",
  filterEvents
);


document
  .getElementById(
    "logoutButton"
  )
  .addEventListener(
    "click",
    async () => {

      await supabase.auth.signOut();


      window.location.replace(
        "../member-portal/index.html"
      );

    }
  );


/* ========================================
   INITIALIZE
======================================== */

async function initializeEventsPage() {

  const authenticated =
    await authenticateAdmin();


  if (!authenticated) {

    return;

  }


  await loadEvents();


  subscribeToEvents();

}


initializeEventsPage();