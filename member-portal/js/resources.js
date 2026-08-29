import { supabase }
from "../../js/supabase.js";


// ========================================
// ELEMENTS
// ========================================

const accordionButtons =
  document.querySelectorAll(
    ".resource-accordion-button"
  );

const resourceSearch =
  document.getElementById(
    "resourceSearch"
  );

const resourceAccordions =
  document.querySelectorAll(
    ".resource-accordion"
  );

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


// ========================================
// CHECK LOGIN
// ========================================

async function checkMemberSession() {

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();


  if (error || !session) {

    window.location.replace(
      "index.html"
    );

    return false;

  }


  return true;

}


// ========================================
// ACCORDION
// ========================================

accordionButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const accordion =
          button.closest(
            ".resource-accordion"
          );

        if (!accordion) {
          return;
        }


        accordion.classList.toggle(
          "open"
        );

      }
    );

  }
);


// ========================================
// RESOURCE SEARCH
// ========================================

if (resourceSearch) {

  resourceSearch.addEventListener(
    "input",
    () => {

      const searchValue =
        resourceSearch.value
          .trim()
          .toLowerCase();


      resourceAccordions.forEach(
        (accordion) => {

          const text =
            accordion.textContent
              .toLowerCase();


          const matches =
            text.includes(
              searchValue
            );


          accordion.style.display =
            matches
              ? ""
              : "none";


          if (
            searchValue &&
            matches
          ) {

            accordion.classList.add(
              "open"
            );

          }

        }
      );

    }
  );

}


// ========================================
// LOGOUT
// ========================================

if (logoutButton) {

  logoutButton.addEventListener(
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

}


// ========================================
// INITIALIZE
// ========================================

async function initializePage() {

  const authorized =
    await checkMemberSession();


  if (!authorized) {
    return;
  }


  console.log(
    "Resources page ready."
  );

}


initializePage();