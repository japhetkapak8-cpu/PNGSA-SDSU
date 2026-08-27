import { supabase }
from "../../js/supabase.js";


let currentUser = null;

let currentProfile = null;

let allEvents = [];

let userRsvps = {};

let displayedMonth =
  new Date();


/* ========================================
   ELEMENTS
======================================== */

const memberName =
  document.getElementById(
    "memberName"
  );


const featuredEventSection =
  document.getElementById(
    "featuredEventSection"
  );


const featuredEventCard =
  document.getElementById(
    "featuredEventCard"
  );


const weekStrip =
  document.getElementById(
    "weekStrip"
  );


const calendarTitle =
  document.getElementById(
    "calendarTitle"
  );


const calendarGrid =
  document.getElementById(
    "calendarGrid"
  );


const upcomingEvents =
  document.getElementById(
    "upcomingEvents"
  );


const pastEvents =
  document.getElementById(
    "pastEvents"
  );


const eventSearch =
  document.getElementById(
    "eventSearch"
  );


const categoryFilter =
  document.getElementById(
    "categoryFilter"
  );


const eventDetailsModal =
  document.getElementById(
    "eventDetailsModal"
  );


const eventDetailsContent =
  document.getElementById(
    "eventDetailsContent"
  );


/* ========================================
   AUTHENTICATION
======================================== */

async function authenticateMember() {

  const {
    data: {
      session
    }
  } =
    await supabase.auth.getSession();


  if (!session) {

    window.location.replace(
      "index.html"
    );

    return false;

  }


  currentUser =
    session.user;


  const {
    data: profile,
    error
  } =
    await supabase

      .from(
        "profiles"
      )

      .select(
        "*"
      )

      .eq(
        "user_id",
        currentUser.id
      )

      .single();


  if (error) {

    console.error(
      "Profile error:",
      error
    );

  }


  currentProfile =
    profile;


  if (
    currentProfile?.first_name
  ) {

    memberName.textContent =
      currentProfile.first_name;

  }

  else {

    memberName.textContent =
      currentUser.email;

  }


  return true;

}


/* ========================================
   LOAD PUBLISHED EVENTS
======================================== */

async function loadEvents() {

  const {
    data,
    error
  } =
    await supabase

      .from(
        "events"
      )

      .select(
        "*"
      )

      .eq(
        "is_published",
        true
      )

      .order(
        "start_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Could not load events:",
      error
    );


    upcomingEvents.innerHTML = `

      <div class="events-empty">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <p>
          Events could not be loaded.
        </p>

      </div>

    `;


    return;

  }


  allEvents =
    data || [];


  await loadUserRsvps();


  renderEverything();

}


/* ========================================
   LOAD THIS MEMBER'S RSVP
======================================== */

async function loadUserRsvps() {

  const {
    data,
    error
  } =
    await supabase

      .from(
        "event_rsvps"
      )

      .select(
        "event_id, status"
      )

      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(
      "RSVP error:",
      error
    );


    return;

  }


  userRsvps = {};


  data.forEach(
    rsvp => {

      userRsvps[
        rsvp.event_id
      ] =
        rsvp.status;

    }
  );

}


/* ========================================
   RENDER EVERYTHING
======================================== */

function renderEverything() {

  renderFeaturedEvent();

  renderWeekStrip();

  renderCalendar();

  filterUpcomingEvents();

  renderPastEvents();

}


/* ========================================
   FEATURED EVENT
======================================== */

function renderFeaturedEvent() {

  const now =
    new Date();


  const featured =
    allEvents.find(
      event => {

        const eventEnd =
          event.end_at
            ? new Date(
                event.end_at
              )
            : new Date(
                event.start_at
              );


        return (
          event.featured &&
          eventEnd >= now
        );

      }
    );


  if (!featured) {

    featuredEventSection.style.display =
      "none";


    return;

  }


  featuredEventSection.style.display =
    "block";


  featuredEventCard.innerHTML = `

    <div class="featured-event-content">


      <div class="featured-label">

        <i class="fa-solid fa-star"></i>

        Featured Event

      </div>


      <h2>

        ${
          escapeHTML(
            featured.title
          )
        }

      </h2>


      <div class="featured-meta">


        <span>

          <i class="fa-solid fa-calendar"></i>

          ${
            formatDateTime(
              featured.start_at
            )
          }

        </span>


        ${
          featured.location
            ? `

              <span>

                <i class="fa-solid fa-location-dot"></i>

                ${
                  escapeHTML(
                    featured.location
                  )
                }

              </span>

            `
            : ""
        }


      </div>


      <p class="featured-description">

        ${
          escapeHTML(
            featured.short_description ||
            featured.description ||
            ""
          )
        }

      </p>


      <div class="featured-actions">


        <button
          id="featuredViewButton"
          class="featured-button"
          type="button"
        >

          View Event

        </button>


        <button
          id="featuredCalendarButton"
          class="featured-secondary-button"
          type="button"
        >

          <i class="fa-solid fa-calendar-plus"></i>

          Add to Calendar

        </button>


      </div>


    </div>

  `;


  document
    .getElementById(
      "featuredViewButton"
    )
    .addEventListener(
      "click",
      () => {

        openEventDetails(
          featured
        );

      }
    );


  document
    .getElementById(
      "featuredCalendarButton"
    )
    .addEventListener(
      "click",
      () => {

        downloadICS(
          featured
        );

      }
    );

}


/* ========================================
   THIS WEEK
======================================== */

function renderWeekStrip() {

  weekStrip.innerHTML =
    "";


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const day =
      new Date(
        today
      );


    day.setDate(
      today.getDate() +
      i
    );


    const dayEvents =
      allEvents.filter(
        event =>
          sameDate(
            new Date(
              event.start_at
            ),
            day
          )
      );


    const box =
      document.createElement(
        "div"
      );


    box.className =
      "week-day";


    if (
      i === 0
    ) {

      box.classList.add(
        "today"
      );

    }


    box.innerHTML = `

      <div class="week-day-name">

        ${
          day.toLocaleDateString(
            "en-US",
            {
              weekday:
                "short"
            }
          )
        }

      </div>


      <div class="week-day-number">

        ${
          day.getDate()
        }

      </div>

    `;


    if (
      dayEvents.length === 0
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.className =
        "week-no-event";


      empty.textContent =
        "No events";


      box.appendChild(
        empty
      );

    }

    else {

      dayEvents
        .slice(
          0,
          2
        )
        .forEach(
          event => {

            const eventElement =
              document.createElement(
                "div"
              );


            eventElement.className =
              "week-event";


            eventElement.textContent =
              event.title;


            eventElement.addEventListener(
              "click",
              () => {

                openEventDetails(
                  event
                );

              }
            );


            box.appendChild(
              eventElement
            );

          }
        );

    }


    weekStrip.appendChild(
      box
    );

  }

}


/* ========================================
   CALENDAR
======================================== */

function renderCalendar() {

  calendarGrid.innerHTML =
    "";


  const year =
    displayedMonth.getFullYear();


  const month =
    displayedMonth.getMonth();


  calendarTitle.textContent =
    displayedMonth.toLocaleString(
      "en-US",
      {
        month:
          "long",

        year:
          "numeric"
      }
    );


  const firstDay =
    new Date(
      year,
      month,
      1
    );


  const calendarStart =
    new Date(
      year,
      month,
      1 -
      firstDay.getDay()
    );


  for (
    let i = 0;
    i < 42;
    i++
  ) {

    const calendarDate =
      new Date(
        calendarStart
      );


    calendarDate.setDate(
      calendarStart.getDate() +
      i
    );


    const dayElement =
      document.createElement(
        "div"
      );


    dayElement.className =
      "calendar-day";


    if (
      calendarDate.getMonth() !==
      month
    ) {

      dayElement.classList.add(
        "other-month"
      );

    }


    if (
      sameDate(
        calendarDate,
        new Date()
      )
    ) {

      dayElement.classList.add(
        "today"
      );

    }


    const number =
      document.createElement(
        "div"
      );


    number.className =
      "calendar-date-number";


    number.textContent =
      calendarDate.getDate();


    dayElement.appendChild(
      number
    );


    const dayEvents =
      allEvents.filter(
        event =>
          sameDate(
            new Date(
              event.start_at
            ),
            calendarDate
          )
      );


    dayEvents
      .slice(
        0,
        3
      )
      .forEach(
        event => {

          const eventButton =
            document.createElement(
              "button"
            );


          eventButton.className =
            "calendar-event";


          eventButton.type =
            "button";


          eventButton.textContent =
            event.title;


          eventButton.addEventListener(
            "click",
            () => {

              openEventDetails(
                event
              );

            }
          );


          dayElement.appendChild(
            eventButton
          );

        }
      );


    if (
      dayEvents.length > 3
    ) {

      const more =
        document.createElement(
          "div"
        );


      more.className =
        "calendar-more";


      more.textContent =
        `+${
          dayEvents.length - 3
        } more`;


      dayElement.appendChild(
        more
      );

    }


    calendarGrid.appendChild(
      dayElement
    );

  }

}


/* ========================================
   FILTER UPCOMING EVENTS
======================================== */

function filterUpcomingEvents() {

  const search =
    eventSearch.value
      .trim()
      .toLowerCase();


  const category =
    categoryFilter.value;


  const now =
    new Date();


  const filtered =
    allEvents.filter(
      event => {

        const end =
          event.end_at
            ? new Date(
                event.end_at
              )
            : new Date(
                event.start_at
              );


        if (
          end < now
        ) {

          return false;

        }


        const searchContent = `

          ${event.title || ""}

          ${event.location || ""}

          ${event.category || ""}

          ${event.description || ""}

          ${event.short_description || ""}

        `.toLowerCase();


        const matchesSearch =
          !search ||
          searchContent.includes(
            search
          );


        const matchesCategory =
          !category ||
          event.category ===
          category;


        return (
          matchesSearch &&
          matchesCategory
        );

      }
    );


  renderUpcomingEvents(
    filtered
  );

}


/* ========================================
   UPCOMING EVENT CARDS
======================================== */

function renderUpcomingEvents(
  events
) {

  upcomingEvents.innerHTML =
    "";


  if (
    events.length === 0
  ) {

    upcomingEvents.innerHTML = `

      <div class="events-empty">

        <i class="fa-regular fa-calendar-xmark"></i>

        <p>
          No upcoming events found.
        </p>

      </div>

    `;


    return;

  }


  events.forEach(
    event => {

      const start =
        new Date(
          event.start_at
        );


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "member-event-card";


      card.innerHTML = `

        <div class="member-event-date">


          <span>

            ${
              start.toLocaleString(
                "en-US",
                {
                  month:
                    "short"
                }
              )
            }

          </span>


          <strong>

            ${
              start.getDate()
            }

          </strong>


        </div>


        <div class="member-event-body">


          <div class="member-event-top">


            ${
              event.category
                ? `

                  <span class="category-badge">

                    ${
                      escapeHTML(
                        event.category
                      )
                    }

                  </span>

                `
                : ""
            }


            ${
              event.featured
                ? `

                  <span class="featured-small-badge">

                    <i class="fa-solid fa-star"></i>

                    Featured

                  </span>

                `
                : ""
            }


          </div>


          <h3>

            ${
              escapeHTML(
                event.title
              )
            }

          </h3>


          <div class="member-event-meta">


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

                <p class="member-event-description">

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

                <div class="rsvp-area">

                  <div
                    class="rsvp-summary"
                    data-rsvp-summary="${event.id}"
                  >

                    Loading attendance...

                  </div>


                  <div class="rsvp-buttons">


                    <button
                      type="button"
                      class="
                        rsvp-button
                        ${
                          userRsvps[
                            event.id
                          ] ===
                          "going"
                            ? "selected"
                            : ""
                        }
                      "
                      data-event="${event.id}"
                      data-status="going"
                    >

                      <i class="fa-solid fa-check"></i>

                      Going

                    </button>


                    <button
                      type="button"
                      class="
                        rsvp-button
                        ${
                          userRsvps[
                            event.id
                          ] ===
                          "maybe"
                            ? "selected"
                            : ""
                        }
                      "
                      data-event="${event.id}"
                      data-status="maybe"
                    >

                      <i class="fa-solid fa-question"></i>

                      Maybe

                    </button>


                    <button
                      type="button"
                      class="
                        rsvp-button
                        ${
                          userRsvps[
                            event.id
                          ] ===
                          "not_going"
                            ? "selected"
                            : ""
                        }
                      "
                      data-event="${event.id}"
                      data-status="not_going"
                    >

                      <i class="fa-solid fa-xmark"></i>

                      Can't Go

                    </button>


                  </div>

                </div>

              `
              : ""
          }


          <div class="member-event-actions">


            <button
              type="button"
              class="event-primary-button view-event"
            >

              View Details

            </button>


            <button
              type="button"
              class="event-secondary-button add-calendar"
            >

              <i class="fa-solid fa-calendar-plus"></i>

              Add to Calendar

            </button>


          </div>


        </div>

      `;


      card
        .querySelector(
          ".view-event"
        )
        .addEventListener(
          "click",
          () => {

            openEventDetails(
              event
            );

          }
        );


      card
        .querySelector(
          ".add-calendar"
        )
        .addEventListener(
          "click",
          () => {

            downloadICS(
              event
            );

          }
        );


      card
        .querySelectorAll(
          ".rsvp-button"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              async () => {

                await saveRsvp(
                  button.dataset.event,
                  button.dataset.status
                );

              }
            );

          }
        );


      upcomingEvents.appendChild(
        card
      );


      if (
        event.rsvp_enabled
      ) {

        loadAttendanceSummary(
          event.id
        );

      }

    }
  );

}


/* ========================================
   SAVE RSVP
======================================== */

async function saveRsvp(
  eventId,
  status
) {

  const {
    error
  } =
    await supabase

      .from(
        "event_rsvps"
      )

      .upsert(
        {

          event_id:
            eventId,

          user_id:
            currentUser.id,

          status:
            status

        },

        {

          onConflict:
            "event_id,user_id"

        }
      );


  if (error) {

    console.error(
      "RSVP save error:",
      error
    );


    alert(
      "Your RSVP could not be saved."
    );


    return;

  }


  userRsvps[
    eventId
  ] =
    status;


  filterUpcomingEvents();

}


/* ========================================
   ATTENDANCE SUMMARY
======================================== */

async function loadAttendanceSummary(
  eventId
) {

  const {
    data,
    error
  } =
    await supabase

      .from(
        "event_rsvps"
      )

      .select(
        "status"
      )

      .eq(
        "event_id",
        eventId
      );


  if (error) {

    return;

  }


  const going =
    data.filter(
      item =>
        item.status ===
        "going"
    ).length;


  const maybe =
    data.filter(
      item =>
        item.status ===
        "maybe"
    ).length;


  document
    .querySelectorAll(
      `[data-rsvp-summary="${eventId}"]`
    )
    .forEach(
      element => {

        element.textContent =
          `${going} going • ${maybe} maybe`;

      }
    );

}


/* ========================================
   PAST EVENTS
======================================== */

function renderPastEvents() {

  const now =
    new Date();


  const past =
    allEvents

      .filter(
        event => {

          const end =
            event.end_at
              ? new Date(
                  event.end_at
                )
              : new Date(
                  event.start_at
                );


          return end < now;

        }
      )

      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b.start_at
          ) -
          new Date(
            a.start_at
          )
      )

      .slice(
        0,
        6
      );


  pastEvents.innerHTML =
    "";


  if (
    past.length === 0
  ) {

    pastEvents.innerHTML = `

      <div class="events-empty">

        <p>
          No past events yet.
        </p>

      </div>

    `;


    return;

  }


  past.forEach(
    event => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "past-event-card";


      card.innerHTML = `

        <h3>

          ${
            escapeHTML(
              event.title
            )
          }

        </h3>


        <p>

          <i class="fa-regular fa-calendar"></i>

          ${
            formatSimpleDate(
              event.start_at
            )
          }

        </p>


        ${
          event.location
            ? `

              <p>

                <i class="fa-solid fa-location-dot"></i>

                ${
                  escapeHTML(
                    event.location
                  )
                }

              </p>

            `
            : ""
        }

      `;


      card.addEventListener(
        "click",
        () => {

          openEventDetails(
            event
          );

        }
      );


      pastEvents.appendChild(
        card
      );

    }
  );

}


/* ========================================
   EVENT DETAILS
======================================== */

function openEventDetails(
  event
) {

  eventDetailsContent.innerHTML = `


    ${
      event.category
        ? `

          <div class="event-modal-category">

            ${
              escapeHTML(
                event.category
              )
            }

          </div>

        `
        : ""
    }


    <h2>

      ${
        escapeHTML(
          event.title
        )
      }

    </h2>


    <div class="event-modal-meta">


      <div>

        <i class="fa-regular fa-calendar"></i>

        ${
          formatDateTime(
            event.start_at
          )
        }

        ${
          event.end_at
            ? ` – ${
                formatTime(
                  event.end_at
                )
              }`
            : ""
        }

      </div>


      ${
        event.location
          ? `

            <div>

              <i class="fa-solid fa-location-dot"></i>

              ${
                escapeHTML(
                  event.location
                )
              }

            </div>

          `
          : ""
      }


    </div>


    <div class="event-modal-description">

      ${
        escapeHTML(
          event.description ||
          event.short_description ||
          "No additional event details."
        )
      }

    </div>


    <div class="member-event-actions">


      <button
        id="modalCalendarButton"
        class="event-primary-button"
        type="button"
      >

        <i class="fa-solid fa-calendar-plus"></i>

        Add to Calendar

      </button>


    </div>

  `;


  document
    .getElementById(
      "modalCalendarButton"
    )
    .addEventListener(
      "click",
      () => {

        downloadICS(
          event
        );

      }
    );


  eventDetailsModal
    .classList
    .add(
      "show"
    );

}


/* ========================================
   DOWNLOAD ICS
======================================== */

function downloadICS(
  event
) {

  const startDate =
    new Date(
      event.start_at
    );


  let endDate;


  if (
    event.end_at
  ) {

    endDate =
      new Date(
        event.end_at
      );

  }

  else {

    endDate =
      new Date(
        startDate.getTime() +
        60 *
        60 *
        1000
      );

  }


  const icsContent = [

    "BEGIN:VCALENDAR",

    "VERSION:2.0",

    "PRODID:-//PNGSA SDSU//Member Events//EN",

    "CALSCALE:GREGORIAN",

    "METHOD:PUBLISH",

    "BEGIN:VEVENT",

    `UID:${event.id}@pngsasdsu.org`,

    `DTSTAMP:${formatICSDate(
      new Date()
    )}`,

    `DTSTART:${formatICSDate(
      startDate
    )}`,

    `DTEND:${formatICSDate(
      endDate
    )}`,

    `SUMMARY:${escapeICS(
      event.title
    )}`,

    `DESCRIPTION:${escapeICS(
      event.description ||
      event.short_description ||
      ""
    )}`,

    `LOCATION:${escapeICS(
      event.location ||
      ""
    )}`,

    "END:VEVENT",

    "END:VCALENDAR"

  ].join(
    "\r\n"
  );


  const blob =
    new Blob(
      [
        icsContent
      ],

      {
        type:
          "text/calendar;charset=utf-8"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    `${safeFilename(
      event.title
    )}.ics`;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );

}


/* ========================================
   REALTIME EVENT UPDATES
======================================== */

function subscribeToEventUpdates() {

  supabase

    .channel(
      "pngsa-member-events"
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

      async payload => {

        console.log(
          "PNGSA event updated:",
          payload
        );


        await loadEvents();

      }

    )

    .subscribe();

}


/* ========================================
   REALTIME RSVP UPDATES
======================================== */

function subscribeToRsvpUpdates() {

  supabase

    .channel(
      "pngsa-event-rsvps"
    )

    .on(

      "postgres_changes",

      {

        event:
          "*",

        schema:
          "public",

        table:
          "event_rsvps"

      },

      async payload => {

        const eventId =
          payload.new?.event_id ||
          payload.old?.event_id;


        if (
          eventId
        ) {

          await loadAttendanceSummary(
            eventId
          );

        }

      }

    )

    .subscribe();

}


/* ========================================
   CALENDAR BUTTONS
======================================== */

document
  .getElementById(
    "previousMonth"
  )
  .addEventListener(
    "click",
    () => {

      displayedMonth =
        new Date(
          displayedMonth.getFullYear(),
          displayedMonth.getMonth() - 1,
          1
        );


      renderCalendar();

    }
  );


document
  .getElementById(
    "nextMonth"
  )
  .addEventListener(
    "click",
    () => {

      displayedMonth =
        new Date(
          displayedMonth.getFullYear(),
          displayedMonth.getMonth() + 1,
          1
        );


      renderCalendar();

    }
  );


document
  .getElementById(
    "todayButton"
  )
  .addEventListener(
    "click",
    () => {

      displayedMonth =
        new Date();


      renderCalendar();

    }
  );


/* ========================================
   FILTERS
======================================== */

eventSearch.addEventListener(
  "input",
  filterUpcomingEvents
);


categoryFilter.addEventListener(
  "change",
  filterUpcomingEvents
);


/* ========================================
   MODAL
======================================== */

document
  .getElementById(
    "closeEventDetails"
  )
  .addEventListener(
    "click",
    () => {

      eventDetailsModal
        .classList
        .remove(
          "show"
        );

    }
  );


eventDetailsModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      eventDetailsModal
    ) {

      eventDetailsModal
        .classList
        .remove(
          "show"
        );

    }

  }
);


/* ========================================
   LOGOUT
======================================== */

document
  .getElementById(
    "logoutButton"
  )
  .addEventListener(
    "click",
    async () => {

      await supabase.auth.signOut();


      window.location.replace(
        "index.html"
      );

    }
  );


/* ========================================
   DATE HELPERS
======================================== */

function sameDate(
  date1,
  date2
) {

  return (

    date1.getFullYear() ===
    date2.getFullYear() &&

    date1.getMonth() ===
    date2.getMonth() &&

    date1.getDate() ===
    date2.getDate()

  );

}


function formatDateTime(
  value
) {

  return new Date(
    value
  )
    .toLocaleString(
      "en-US",
      {

        weekday:
          "short",

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


function formatSimpleDate(
  value
) {

  return new Date(
    value
  )
    .toLocaleDateString(
      "en-US",
      {

        month:
          "long",

        day:
          "numeric",

        year:
          "numeric"

      }
    );

}


function formatTime(
  value
) {

  return new Date(
    value
  )
    .toLocaleTimeString(
      "en-US",
      {

        hour:
          "numeric",

        minute:
          "2-digit"

      }
    );

}


/* ========================================
   ICS HELPERS
======================================== */

function formatICSDate(
  date
) {

  return date
    .toISOString()
    .replace(
      /[-:]/g,
      ""
    )
    .replace(
      /\.\d{3}/,
      ""
    );

}


function escapeICS(
  value
) {

  return String(
    value ||
    ""
  )

    .replace(
      /\\/g,
      "\\\\"
    )

    .replace(
      /\n/g,
      "\\n"
    )

    .replace(
      /,/g,
      "\\,"
    )

    .replace(
      /;/g,
      "\\;"
    );

}


function safeFilename(
  value
) {

  return String(
    value ||
    "PNGSA-Event"
  )

    .replace(
      /[^a-zA-Z0-9-_]+/g,
      "-"
    )

    .replace(
      /^-|-$/g,
      ""
    );

}


/* ========================================
   ESCAPE HTML
======================================== */

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
   INITIALIZE
======================================== */

async function initializeEventsPage() {

  const authenticated =
    await authenticateMember();


  if (
    !authenticated
  ) {

    return;

  }


  await loadEvents();


  subscribeToEventUpdates();


  subscribeToRsvpUpdates();

}


initializeEventsPage();