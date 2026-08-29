import { supabase }
from "../../js/supabase.js";


// ========================================
// ELEMENTS
// ========================================

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
  } =
    await supabase.auth.getSession();


  if (
    error ||
    !session
  ) {

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
// CHECKLIST MEMORY
// ========================================

const checklistItems =
  document.querySelectorAll(
    ".checklist-item input"
  );


checklistItems.forEach(
  (checkbox, index) => {

    const savedValue =
      localStorage.getItem(
        `pngsa-banking-phone-${index}`
      );


    checkbox.checked =
      savedValue === "true";


    checkbox.addEventListener(
      "change",
      () => {

        localStorage.setItem(
          `pngsa-banking-phone-${index}`,
          checkbox.checked
        );

      }
    );

  }
);


// ========================================
// START PAGE
// ========================================

async function initializePage() {

  const authorized =
    await checkMemberSession();


  if (!authorized) {
    return;
  }


  console.log(
    "Banking & Phone Setup guide ready."
  );

}


initializePage();