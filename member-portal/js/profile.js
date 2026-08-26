import { supabase }
from "../../js/supabase.js";


let currentUser = null;


const form =
  document.getElementById(
    "profileForm"
  );


// ========================================
// AUTHENTICATE
// ========================================

async function authenticateMember() {

  const {
    data: { session }
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


  document.getElementById(
    "memberEmail"
  ).textContent =
    currentUser.email;


  document.getElementById(
    "email"
  ).value =
    currentUser.email;


  return true;
}



// ========================================
// LOAD PROFILE
// ========================================

async function loadProfile() {

  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select(`
        full_name,
        major,
        year_of_study,
        living_area
      `)
      .eq(
        "id",
        currentUser.id
      )
      .single();


  if (error) {

    console.error(error);

    return;
  }


  document.getElementById(
    "fullName"
  ).value =
    data.full_name || "";


  document.getElementById(
    "major"
  ).value =
    data.major || "";


  document.getElementById(
    "yearOfStudy"
  ).value =
    data.year_of_study || "";


  document.getElementById(
    "livingArea"
  ).value =
    data.living_area || "";

}



// ========================================
// SAVE PROFILE
// ========================================

form.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    const message =
      document.getElementById(
        "profileMessage"
      );


    message.textContent =
      "Saving...";

    message.className =
      "form-message";


    const fullName =
      document
        .getElementById("fullName")
        .value
        .trim();


    const major =
      document
        .getElementById("major")
        .value
        .trim();


    const year =
      document
        .getElementById("yearOfStudy")
        .value;


    const livingArea =
      document
        .getElementById("livingArea")
        .value
        .trim();


    const {
      error
    } =
      await supabase
        .from("profiles")
        .update({

          full_name:
            fullName,

          major:
            major,

          year_of_study:
            year,

          living_area:
            livingArea

        })
        .eq(
          "id",
          currentUser.id
        );


    if (error) {

      console.error(error);

      message.textContent =
        "Unable to save your profile.";

      message.className =
        "form-message error";

      return;
    }


    message.textContent =
      "Profile saved successfully.";

    message.className =
      "form-message success";


    setTimeout(
      () => {

        window.location.href =
          "dashboard.html";

      },
      1000
    );

  }
);



// ========================================
// LOGOUT
// ========================================

document
  .getElementById(
    "logoutButton"
  )
  .addEventListener(
    "click",
    async function() {

      await supabase.auth.signOut();

      window.location.replace(
        "index.html"
      );

    }
  );



// ========================================
// START
// ========================================

async function initialize() {

  const authenticated =
    await authenticateMember();


  if (!authenticated) {
    return;
  }


  await loadProfile();

}


initialize();