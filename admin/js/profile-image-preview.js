/* =========================================================
   PNGSA ADMIN
   PROFILE IMAGE PREVIEW
   Supports dynamically rendered member images
========================================================= */

let previewEnabled =
  false;


/* =========================================================
   ENABLE PROFILE IMAGE PREVIEW
========================================================= */

export function enableProfileImagePreview(
  root = document
) {

  /*
   * We use event delegation instead of binding directly
   * to every image. This allows images added later by
   * members.js to work automatically.
   */

  if (previewEnabled) {
    return;
  }


  previewEnabled =
    true;


  root.addEventListener(
    "click",
    handleProfileImageClick
  );

}


/* =========================================================
   CLICK HANDLER
========================================================= */

function handleProfileImageClick(
  event
) {

  const image =
    event.target.closest(
      `
        img[data-profile-preview],
        img[data-full-image],
        img[data-image-url],
        .member-profile-image,
        .member-avatar,
        .member-photo img,
        .profile-image-preview-trigger
      `
    );


  if (!image) {
    return;
  }


  /*
   * Ignore broken/default images if needed.
   */

  const imageUrl =
    image.dataset.fullImage ||
    image.dataset.imageUrl ||
    image.getAttribute(
      "data-src"
    ) ||
    image.currentSrc ||
    image.src;


  if (
    !imageUrl ||
    imageUrl.startsWith(
      "data:image/svg+xml"
    )
  ) {
    return;
  }


  event.preventDefault();

  event.stopPropagation();


  const altText =
    image.alt ||
    image.dataset.memberName ||
    "Member profile photo";


  openProfileImagePreview(
    imageUrl,
    altText
  );

}


/* =========================================================
   OPEN PROFILE IMAGE PREVIEW
========================================================= */

function openProfileImagePreview(
  imageUrl,
  altText = "Member profile photo"
) {

  closeProfileImagePreview();


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "profileImagePreview";


  overlay.className =
    "profile-image-preview-overlay";


  overlay.setAttribute(
    "role",
    "dialog"
  );


  overlay.setAttribute(
    "aria-modal",
    "true"
  );


  overlay.setAttribute(
    "aria-label",
    "Profile image preview"
  );


  overlay.innerHTML = `

    <div
      class="profile-preview-backdrop"
      data-close-profile-preview
    ></div>


    <div class="profile-preview-card">


      <button
        type="button"
        class="profile-preview-close"
        data-close-profile-preview
        aria-label="Close profile image preview"
      >

        <i class="fa-solid fa-xmark"></i>

      </button>


      <img
        src="${escapeAttribute(
          imageUrl
        )}"
        alt="${escapeAttribute(
          altText
        )}"
        class="profile-preview-image"
      >


    </div>

  `;


  applyPreviewStyles(
    overlay
  );


  document.body.appendChild(
    overlay
  );


  document.body.classList.add(
    "profile-image-preview-open"
  );


  /*
   * Close buttons / backdrop.
   */

  overlay
    .querySelectorAll(
      "[data-close-profile-preview]"
    )
    .forEach(
      element => {

        element.addEventListener(
          "click",
          event => {

            event.preventDefault();

            event.stopPropagation();

            closeProfileImagePreview();

          }
        );

      }
    );


  /*
   * Prevent clicking the image/card itself
   * from closing the preview.
   */

  const card =
    overlay.querySelector(
      ".profile-preview-card"
    );


  card?.addEventListener(
    "click",
    event => {

      event.stopPropagation();

    }
  );

}


/* =========================================================
   CLOSE PROFILE IMAGE PREVIEW
========================================================= */

export function closeProfileImagePreview() {

  const existing =
    document.getElementById(
      "profileImagePreview"
    );


  if (existing) {

    existing.remove();

  }


  document.body.classList.remove(
    "profile-image-preview-open"
  );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeProfileImagePreview();

    }

  }
);


/* =========================================================
   INLINE PREVIEW STYLES
========================================================= */

function applyPreviewStyles(
  overlay
) {

  /* OVERLAY */

  overlay.style.position =
    "fixed";

  overlay.style.inset =
    "0";

  overlay.style.zIndex =
    "20000";

  overlay.style.display =
    "flex";

  overlay.style.alignItems =
    "center";

  overlay.style.justifyContent =
    "center";

  overlay.style.padding =
    "24px";


  /* BACKDROP */

  const backdrop =
    overlay.querySelector(
      ".profile-preview-backdrop"
    );


  if (backdrop) {

    backdrop.style.position =
      "absolute";

    backdrop.style.inset =
      "0";

    backdrop.style.background =
      "rgba(0, 0, 0, 0.82)";

    backdrop.style.backdropFilter =
      "blur(6px)";

    backdrop.style.webkitBackdropFilter =
      "blur(6px)";

    backdrop.style.cursor =
      "zoom-out";

  }


  /* CARD */

  const card =
    overlay.querySelector(
      ".profile-preview-card"
    );


  if (card) {

    card.style.position =
      "relative";

    card.style.zIndex =
      "1";

    card.style.width =
      "min(650px, 95vw)";

    card.style.maxHeight =
      "90vh";

    card.style.display =
      "flex";

    card.style.alignItems =
      "center";

    card.style.justifyContent =
      "center";

    card.style.padding =
      "12px";

    card.style.border =
      "1px solid rgba(255,255,255,.15)";

    card.style.borderRadius =
      "16px";

    card.style.background =
      "#ffffff";

    card.style.boxShadow =
      "0 30px 90px rgba(0,0,0,.45)";

  }


  /* IMAGE */

  const image =
    overlay.querySelector(
      ".profile-preview-image"
    );


  if (image) {

    image.style.width =
      "auto";

    image.style.maxWidth =
      "100%";

    image.style.height =
      "auto";

    image.style.maxHeight =
      "82vh";

    image.style.display =
      "block";

    image.style.objectFit =
      "contain";

    image.style.borderRadius =
      "11px";

  }


  /* CLOSE */

  const closeButton =
    overlay.querySelector(
      ".profile-preview-close"
    );


  if (closeButton) {

    closeButton.style.position =
      "absolute";

    closeButton.style.top =
      "10px";

    closeButton.style.right =
      "10px";

    closeButton.style.zIndex =
      "5";

    closeButton.style.width =
      "38px";

    closeButton.style.height =
      "38px";

    closeButton.style.display =
      "flex";

    closeButton.style.alignItems =
      "center";

    closeButton.style.justifyContent =
      "center";

    closeButton.style.padding =
      "0";

    closeButton.style.border =
      "none";

    closeButton.style.borderRadius =
      "9px";

    closeButton.style.background =
      "rgba(0,0,0,.78)";

    closeButton.style.color =
      "#ffffff";

    closeButton.style.fontSize =
      "16px";

    closeButton.style.cursor =
      "pointer";

  }

}


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
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