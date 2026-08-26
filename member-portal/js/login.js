import { supabase }
from "../../js/supabase.js";


const form =
  document.getElementById(
    "memberLoginForm"
  );

const message =
  document.getElementById(
    "loginMessage"
  );

const loginButton =
  document.getElementById(
    "loginButton"
  );


// ========================================
// CHECK EXISTING LOGIN
// ========================================

async function checkExistingSession() {

  const {
    data: { session }
  } =
    await supabase.auth.getSession();


  if (!session) {
    return;
  }


  await redirectUser(
    session.user
  );

}



// ========================================
// LOGIN
// ========================================

form.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    message.textContent =
      "Signing in...";

    message.className =
      "form-message";


    loginButton.disabled =
      true;


    const email =
      document
        .getElementById("email")
        .value
        .trim();


    const password =
      document
        .getElementById("password")
        .value;


    const {
      data,
      error
    } =
      await supabase.auth
        .signInWithPassword({
          email,
          password
        });


    if (error) {

      message.textContent =
        error.message;

      message.className =
        "form-message error";

      loginButton.disabled =
        false;

      return;
    }


    await redirectUser(
      data.user
    );

  }
);



// ========================================
// REDIRECT BASED ON ROLE
// ========================================

async function redirectUser(user) {

  const {
    data: profile,
    error
  } =
    await supabase
      .from("profiles")
      .select(`
        role,
        full_name,
        major,
        year_of_study,
        living_area
      `)
      .eq(
        "id",
        user.id
      )
      .single();


  if (
    error ||
    !profile
  ) {

    await supabase.auth.signOut();

    message.textContent =
      "Your member profile could not be found.";

    message.className =
      "form-message error";

    loginButton.disabled =
      false;

    return;
  }


  // Admin account

  if (profile.role === "admin") {

    window.location.replace(
      "../admin/dashboard.html"
    );

    return;
  }


  // Member profile incomplete

  const profileComplete =
    profile.full_name &&
    profile.major &&
    profile.year_of_study &&
    profile.living_area;


  if (!profileComplete) {

    window.location.replace(
      "profile.html"
    );

    return;
  }


  window.location.replace(
    "dashboard.html"
  );

}



// ========================================
// PASSWORD SHOW/HIDE
// ========================================

const togglePassword =
  document.getElementById(
    "togglePassword"
  );


togglePassword.addEventListener(
  "click",
  function() {

    const password =
      document.getElementById(
        "password"
      );


    const icon =
      togglePassword.querySelector(
        "i"
      );


    if (
      password.type === "password"
    ) {

      password.type =
        "text";

      icon.className =
        "fa-solid fa-eye-slash";

    }

    else {

      password.type =
        "password";

      icon.className =
        "fa-solid fa-eye";

    }

  }
);


checkExistingSession();