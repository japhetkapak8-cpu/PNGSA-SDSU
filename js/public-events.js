import { supabase }
from "./supabase.js";


/* =========================================================
   DOM
========================================================= */

const eventGrid =
  document.getElementById(
    "eventGrid"
  );


/* =========================================================
   START
========================================================= */

loadPublicEvents();


/* =========================================================
   LOAD PUBLIC EVENTS
========================================================= */

async function loadPublicEvents() {

  if (!eventGrid) {
    return;
  }


  eventGrid.innerHTML = `
    <div class="events-loading">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <p>
        Loading upcoming events...
      </p>

    </div>
  `;


  const today =
    getToday();


  const {
    data,
    error
  } =
    await supabase
      .from("public_events")
      .select(`
        id,
        title,
        event_type,
        short_description,
        description,
        event_date,
        start_time,
        end_time,
        location,
        map_url,
        image_url,
        video_url,
        media_type,
        ticket_url,
        registration_url,
        featured,
        published
      `)
      .eq(
        "published",
        true
      )
      .gte(
        "event_date",
        today
      )
      .order(
        "featured",
        {
          ascending: false
        }
      )
      .order(
        "event_date",
        {
          ascending: true
        }
      )
      .order(
        "start_time",
        {
          ascending: true,
          nullsFirst: false
        }
      );


  if (error) {

    console.error(
      "Unable to load public events:",
      error
    );


    eventGrid.innerHTML = `
      <div class="events-error">

        <i class="fa-solid fa-circle-exclamation"></i>

        <h3>
          Unable to load events
        </h3>

        <p>
          Please try again later.
        </p>

      </div>
    `;

    return;
  }


  const events =
    data || [];


  if (!events.length) {

    eventGrid.innerHTML = `
      <div class="events-empty">

        <i class="fa-regular fa-calendar"></i>

        <h3>
          No upcoming events
        </h3>

        <p>
          Check back soon for new PNGSA events.
        </p>

      </div>
    `;

    return;
  }


  eventGrid.innerHTML =
    events
      .map(
        event =>
          renderEventCard(
            event
          )
      )
      .join("");


  bindEventActions(
    events
  );

}


/* =========================================================
   EVENT CARD
========================================================= */

function renderEventCard(
  event
) {

  const date =
    getEventDateParts(
      event.event_date
    );


  const time =
    formatEventTime(
      event.start_time,
      event.end_time
    );


  const media =
    renderEventMedia(
      event
    );


  const description =
    event.short_description ||
    event.description ||
    "";


  return `
    <article
      class="
        event-card
        ${event.featured
          ? "featured"
          : ""}
      "
      data-event-id="${event.id}"
    >


      ${media}


      <div class="event-card-content">


        <div class="event-date">

          <span>
            ${escapeHtml(
              date.month
            )}
          </span>

          <strong>
            ${escapeHtml(
              date.day
            )}
          </strong>

        </div>


        <div class="event-main-content">


          <div class="event-card-meta">


            ${
              event.event_type
                ? `
                  <p class="event-type">

                    ${escapeHtml(
                      event.event_type
                    )}

                  </p>
                `
                : ""
            }


            ${
              event.featured
                ? `
                  <span class="featured-event-badge">

                    <i class="fa-solid fa-star"></i>

                    Featured

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


          ${
            description
              ? `
                <p class="event-description">

                  ${escapeHtml(
                    description
                  )}

                </p>
              `
              : ""
          }


          <div class="event-information">


            <span>

              <i class="fa-regular fa-calendar"></i>

              ${escapeHtml(
                formatFullDate(
                  event.event_date
                )
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


          <div class="event-actions">


            <button
              type="button"
              class="event-action-btn calendar"
              data-action="calendar"
              data-id="${event.id}"
            >

              <i class="fa-regular fa-calendar-plus"></i>

              Add to Calendar

            </button>


            <button
              type="button"
              class="event-action-btn secondary"
              data-action="share"
              data-id="${event.id}"
            >

              <i class="fa-solid fa-share-nodes"></i>

              Share

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
                    class="event-action-btn ticket"
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
                    class="event-action-btn ticket"
                    target="_blank"
                    rel="noopener noreferrer"
                  >

                    <i class="fa-solid fa-clipboard-check"></i>

                    Register

                  </a>
                `
                : ""
            }


            ${
              isSafeHttpUrl(
                event.map_url
              )
                ? `
                  <a
                    href="${escapeAttribute(
                      event.map_url
                    )}"
                    class="event-action-btn secondary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >

                    <i class="fa-solid fa-map-location-dot"></i>

                    Map

                  </a>
                `
                : ""
            }


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


  /*
   * If a video exists, display it.
   */

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


      if (embedUrl) {

        return `
          <div class="event-image-wrap">

            <iframe
              class="event-video"
              src="${escapeAttribute(
                embedUrl
              )}"
              title="${escapeAttribute(
                event.title
              )}"
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

          </div>
        `;

      }

    }


    return `
      <div class="event-image-wrap">

        <video
          class="event-video"
          src="${escapeAttribute(
            videoUrl
          )}"
          controls
          preload="metadata"
        ></video>

      </div>
    `;

  }


  /*
   * Otherwise display the poster/image.
   */

  if (
    imageUrl &&
    isSafeHttpUrl(
      imageUrl
    )
  ) {

    return `
      <div class="event-image-wrap">

        <img
          src="${escapeAttribute(
            imageUrl
          )}"
          alt="${escapeAttribute(
            event.title
          )}"
          class="event-image"
          loading="lazy"
        >

      </div>
    `;

  }


  return "";

}


/* =========================================================
   BUTTON ACTIONS
========================================================= */

function bindEventActions(
  events
) {

  eventGrid
    .querySelectorAll(
      "[data-action]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const event =
              events.find(
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


            const action =
              button.dataset.action;


            if (
              action === "calendar"
            ) {

              downloadCalendarFile(
                event
              );

            }


            if (
              action === "share"
            ) {

              await shareEvent(
                event
              );

            }

          }
        );

      }
    );

}


/* =========================================================
   SHARE EVENT
========================================================= */

async function shareEvent(
  event
) {

  const shareUrl =
    `${window.location.origin}${window.location.pathname}?event=${encodeURIComponent(event.id)}`;


  const text =
    [
      event.title,

      formatFullDate(
        event.event_date
      ),

      event.start_time
        ? formatTime(
            event.start_time
          )
        : "",

      event.location || ""
    ]
      .filter(Boolean)
      .join(" • ");


  try {

    if (
      navigator.share
    ) {

      await navigator.share({

        title:
          event.title,

        text,

        url:
          shareUrl

      });


      return;

    }


    await navigator.clipboard.writeText(
      shareUrl
    );


    showToast(
      "Event link copied."
    );

  }
  catch (error) {

    if (
      error?.name === "AbortError"
    ) {
      return;
    }


    console.error(
      "Unable to share event:",
      error
    );


    showToast(
      "Could not share event."
    );

  }

}


/* =========================================================
   DOWNLOAD ICS
========================================================= */

function downloadCalendarFile(
  event
) {

  const ics =
    createICS(
      event
    );


  const blob =
    new Blob(
      [ics],
      {
        type:
          "text/calendar;charset=utf-8"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const anchor =
    document.createElement(
      "a"
    );


  anchor.href =
    url;


  anchor.download =
    `${slugify(
      event.title
    )}.ics`;


  document.body.appendChild(
    anchor
  );


  anchor.click();


  anchor.remove();


  URL.revokeObjectURL(
    url
  );

}


/* =========================================================
   CREATE ICS
========================================================= */

function createICS(
  event
) {

  const uid =
    `${event.id}@pngsasdsu.org`;


  const start =
    createICSStart(
      event
    );


  const end =
    createICSEnd(
      event
    );


  const now =
    formatICSDateTimeUTC(
      new Date()
    );


  const lines =
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PNGSA SDSU//Public Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",

      `UID:${escapeICSText(uid)}`,

      `DTSTAMP:${now}`,

      start,

      end,

      `SUMMARY:${escapeICSText(
        event.title
      )}`,

      `DESCRIPTION:${escapeICSText(
        event.description ||
        event.short_description ||
        ""
      )}`,

      `LOCATION:${escapeICSText(
        event.location ||
        ""
      )}`,

      `URL:${escapeICSText(
        window.location.href
      )}`,

      "END:VEVENT",
      "END:VCALENDAR"
    ];


  return lines.join(
    "\r\n"
  );

}


/* =========================================================
   ICS START
========================================================= */

function createICSStart(
  event
) {

  const date =
    String(
      event.event_date
    )
      .replaceAll(
        "-",
        ""
      );


  if (
    !event.start_time
  ) {

    return (
      `DTSTART;VALUE=DATE:${date}`
    );

  }


  const time =
    String(
      event.start_time
    )
      .slice(
        0,
        5
      )
      .replace(
        ":",
        ""
      );


  return (
    `DTSTART;TZID=America/Chicago:${date}T${time}00`
  );

}


/* =========================================================
   ICS END
========================================================= */

function createICSEnd(
  event
) {

  if (
    !event.start_time
  ) {

    const endDate =
      addDays(
        event.event_date,
        1
      )
        .replaceAll(
          "-",
          ""
        );


    return (
      `DTEND;VALUE=DATE:${endDate}`
    );

  }


  const date =
    String(
      event.event_date
    )
      .replaceAll(
        "-",
        ""
      );


  let endTime =
    event.end_time;


  if (!endTime) {

    endTime =
      addHoursToTime(
        event.start_time,
        2
      );

  }


  const time =
    String(
      endTime
    )
      .slice(
        0,
        5
      )
      .replace(
        ":",
        ""
      );


  return (
    `DTEND;TZID=America/Chicago:${date}T${time}00`
  );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function getToday() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    )
      .padStart(
        2,
        "0"
      );


  const day =
    String(
      now.getDate()
    )
      .padStart(
        2,
        "0"
      );


  return (
    `${year}-${month}-${day}`
  );

}


function getEventDateParts(
  value
) {

  const date =
    new Date(
      `${value}T12:00:00`
    );


  return {

    month:
      date
        .toLocaleDateString(
          "en-US",
          {
            month:
              "short"
          }
        )
        .toUpperCase(),

    day:
      String(
        date.getDate()
      )
        .padStart(
          2,
          "0"
        )

  };

}


function formatFullDate(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(
      `${value}T12:00:00`
    );


  return date
    .toLocaleDateString(
      "en-US",
      {
        weekday:
          "long",

        month:
          "long",

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
    value
      .slice(
        0,
        5
      )
      .split(
        ":"
      );


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


function addDays(
  dateString,
  days
) {

  const date =
    new Date(
      `${dateString}T12:00:00`
    );


  date.setDate(
    date.getDate() +
    days
  );


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


function addHoursToTime(
  value,
  hoursToAdd
) {

  const [
    hour,
    minute
  ] =
    value
      .slice(
        0,
        5
      )
      .split(
        ":"
      )
      .map(
        Number
      );


  const date =
    new Date(
      2000,
      0,
      1,
      hour,
      minute
    );


  date.setHours(
    date.getHours() +
    hoursToAdd
  );


  const finalHour =
    String(
      date.getHours()
    )
      .padStart(
        2,
        "0"
      );


  const finalMinute =
    String(
      date.getMinutes()
    )
      .padStart(
        2,
        "0"
      );


  return (
    `${finalHour}:${finalMinute}`
  );

}


/* =========================================================
   UTC ICS DATE
========================================================= */

function formatICSDateTimeUTC(
  date
) {

  const pad =
    value =>
      String(
        value
      )
        .padStart(
          2,
          "0"
        );


  return (
    `${date.getUTCFullYear()}`
    + `${pad(
      date.getUTCMonth() + 1
    )}`
    + `${pad(
      date.getUTCDate()
    )}`
    + "T"
    + `${pad(
      date.getUTCHours()
    )}`
    + `${pad(
      date.getUTCMinutes()
    )}`
    + `${pad(
      date.getUTCSeconds()
    )}`
    + "Z"
  );

}


/* =========================================================
   URL HELPERS
========================================================= */

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


    const host =
      url.hostname
        .toLowerCase();


    return (
      host === "youtu.be" ||
      host.endsWith(
        ".youtu.be"
      ) ||
      host === "youtube.com" ||
      host.endsWith(
        ".youtube.com"
      )
    );

  }
  catch {

    return false;

  }

}


/* =========================================================
   YOUTUBE EMBED
========================================================= */

function getYouTubeEmbedUrl(
  value
) {

  try {

    const url =
      new URL(
        value
      );


    const host =
      url.hostname
        .toLowerCase();


    let id =
      null;


    if (
      host === "youtu.be" ||
      host.endsWith(
        ".youtu.be"
      )
    ) {

      id =
        url.pathname
          .replace(
            /^\/+/,
            ""
          )
          .split(
            "/"
          )[0];

    }
    else {

      if (
        url.pathname ===
        "/watch"
      ) {

        id =
          url.searchParams
            .get(
              "v"
            );

      }
      else if (
        url.pathname
          .startsWith(
            "/shorts/"
          )
      ) {

        id =
          url.pathname
            .split(
              "/"
            )[2];

      }
      else if (
        url.pathname
          .startsWith(
            "/embed/"
          )
      ) {

        id =
          url.pathname
            .split(
              "/"
            )[2];

      }

    }


    if (!id) {
      return null;
    }


    return (
      `https://www.youtube.com/embed/${encodeURIComponent(id)}`
    );

  }
  catch {

    return null;

  }

}


/* =========================================================
   GENERAL HELPERS
========================================================= */

function cleanValue(
  value
) {

  const cleaned =
    String(
      value ||
      ""
    )
      .trim();


  return (
    cleaned ||
    null
  );

}


function slugify(
  value
) {

  return String(
    value ||
    "pngsa-event"
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


function escapeICSText(
  value
) {

  return String(
    value ||
    ""
  )
    .replaceAll(
      "\\",
      "\\\\"
    )
    .replaceAll(
      ";",
      "\\;"
    )
    .replaceAll(
      ",",
      "\\,"
    )
    .replace(
      /\r?\n/g,
      "\\n"
    );

}


function escapeHtml(
  value
) {

  return String(
    value ??
    ""
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
   TOAST
========================================================= */

function showToast(
  message
) {

  const existing =
    document.querySelector(
      ".event-toast"
    );


  if (existing) {

    existing.remove();

  }


  const toast =
    document.createElement(
      "div"
    );


  toast.className =
    "event-toast";


  toast.textContent =
    message;


  document.body.appendChild(
    toast
  );


  requestAnimationFrame(
    () => {

      toast.classList.add(
        "show"
      );

    }
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );


      setTimeout(
        () => {

          toast.remove();

        },
        250
      );

    },
    2500
  );

}