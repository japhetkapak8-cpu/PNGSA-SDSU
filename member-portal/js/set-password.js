import { supabase }
from "../../js/supabase.js";


const form =
  document.getElementById(
    "setPasswordForm"
  );


const statusBox =
  document.getElementById(
    "activationStatus"
  );


const message =
  document.getElementById(
    "passwordMessage"
  );


const activateButton =
  document.getElementById(
    "activateButton"
  );


// ========================================
// VERIFY INVITATION SESSION
// ========================================

async function verifyInvitation() {

  /*
    Supabase normally converts the invite link
    into an authenticated recovery/invite session.
  */

  const {
    data: { session },
    error
  } =
    await supabase.auth.getSession();


  if (
    error ||
    !session
  ) {

    statusBox.innerHTML = `

      <div class="status-error">

        <i class="fa-solid fa-circle-exclamation"></i>

        <div>

          <strong>
            Invitation link unavailable
          </strong>

          <p>
            This invitation link may have expired or already been used.
            Please request a new invitation.
          </p>

        </div>

      </div>

    `;

    return false;
  }


  statusBox.innerHTML = `

    <div class="status-success">

      <i class="fa-solid fa-circle-check"></i>

      <div>

        <strong>
          Invitation verified
        </strong>

        <p>
          Create your password to finish activating your account.
        </p>

      </div>

    </div>

  `;


  form.hidden =
    false;


  return true;
}


// ========================================
// SET PASSWORD
// ========================================

form.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    message.textContent =
      "";


    const password =
      document
        .getElementById(
          "newPassword"
        )
        .value;


    const confirmation =
      document
        .getElementById(
          "confirmPassword"
        )
        .value;


    if (
      password.length < 8
    ) {

      showError(
        "Password must be at least 8 characters long."
      );

      return;
    }


    if (
      password !== confirmation
    ) {

      showError(
        "The passwords do not match."
      );

      return;
    }


    activateButton.disabled =
      true;


    activateButton.innerHTML = `

      <i class="fa-solid fa-spinner fa-spin"></i>

      Activating Account...

    `;


    const {
      data,
      error
    } =
      await supabase.auth.updateUser({

        password:
          password

      });


    if (error) {

      console.error(
        "Unable to set password:",
        error
      );


      showError(
        error.message ||
        "Unable to activate your account."
      );


      resetButton();

      return;
    }


    if (
      !data.user
    ) {

      showError(
        "Unable to complete account activation."
      );

      resetButton();

      return;
    }


    message.textContent =
      "Account activated successfully.";

    message.className =
      "form-message success";


    /*
      After setting the password, send the member
      to their profile.

      Your profile page can then collect any
      missing student details.
    */

    setTimeout(
      () => {

        window.location.replace(
          "profile.html"
        );

      },
      900
    );

  }
);


// ========================================
// ERROR MESSAGE
// ========================================

function showError(text) {

  message.textContent =
    text;


  message.className =
    "form-message error";

}


// ========================================
// RESET BUTTON
// ========================================

function resetButton() {

  activateButton.disabled =
    false;


  activateButton.innerHTML = `

    <i class="fa-solid fa-shield-halved"></i>

    Activate Account

  `;

}


// ========================================
// PASSWORD VISIBILITY
// ========================================

function setupPasswordToggle(
  buttonId,
  inputId
) {

  const button =
    document.getElementById(
      buttonId
    );


  const input =
    document.getElementById(
      inputId
    );


  if (
    !button ||
    !input
  ) {

    return;

  }


  button.addEventListener(
    "click",
    function() {

      const icon =
        button.querySelector(
          "i"
        );


      if (
        input.type === "password"
      ) {

        input.type =
          "text";


        icon.className =
          "fa-solid fa-eye-slash";

      }

      else {

        input.type =
          "password";


        icon.className =
          "fa-solid fa-eye";

      }

    }
  );

}


setupPasswordToggle(
  "toggleNewPassword",
  "newPassword"
);


setupPasswordToggle(
  "toggleConfirmPassword",
  "confirmPassword"
);


// ========================================
// START
// ========================================

verifyInvitation();