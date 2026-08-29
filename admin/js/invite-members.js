import { supabase }
from "../../js/supabase.js";


// ========================================
// ELEMENTS
// ========================================

const inviteForm =
  document.getElementById("inviteMemberForm");

const inviteEmail =
  document.getElementById("inviteEmail");

const inviteButton =
  document.getElementById("inviteButton");

const inviteMessage =
  document.getElementById("inviteMessage");

const adminEmail =
  document.getElementById("adminEmail");

const logoutButton =
  document.getElementById("logoutButton");


// ========================================
// CHECK ADMIN
// ========================================

async function checkAdmin() {

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();


  if (sessionError) {

    console.error(
      "Session error:",
      sessionError
    );

    window.location.replace(
      "index.html"
    );

    return false;
  }


  if (!session) {

    window.location.replace(
      "index.html"
    );

    return false;
  }


  const user =
    session.user;


  // ========================================
  // SHOW ADMIN EMAIL
  // ========================================

  if (adminEmail) {

    adminEmail.textContent =
      user.email || "Admin";

  }


  // ========================================
  // GET PROFILE ROLE
  // ========================================

  const {
    data: profile,
    error: profileError
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();


  if (profileError) {

    console.error(
      "Profile error:",
      profileError
    );

    window.location.replace(
      "../member-portal/dashboard.html"
    );

    return false;
  }


  if (
    !profile ||
    profile.role !== "admin"
  ) {

    console.warn(
      "User is not an admin."
    );

    window.location.replace(
      "../member-portal/dashboard.html"
    );

    return false;
  }


  console.log(
    "Admin authenticated:",
    user.email
  );


  return true;
}


// ========================================
// SHOW MESSAGE
// ========================================

function showMessage(
  message,
  type = "error"
) {

  if (!inviteMessage) {
    return;
  }


  inviteMessage.textContent =
    message;


  inviteMessage.className =
    `invite-message ${type}`;
}


// ========================================
// CLEAR MESSAGE
// ========================================

function clearMessage() {

  if (!inviteMessage) {
    return;
  }


  inviteMessage.textContent =
    "";


  inviteMessage.className =
    "invite-message";
}


// ========================================
// SEND INVITATION
// ========================================

async function sendInvitation(email) {

  const {
    data,
    error
  } = await supabase.functions.invoke(
    "invite-member",
    {
      body: {
        email: email
      }
    }
  );


  console.log(
    "Invite function data:",
    data
  );


  console.log(
    "Invite function error:",
    error
  );


  // ========================================
  // EDGE FUNCTION HTTP ERROR
  // ========================================

  if (error) {

    let errorMessage =
      "Unable to send invitation.";


    try {

      if (error.context) {

        const response =
          await error.context.json();


        console.error(
          "Edge Function response:",
          response
        );


        if (response?.error) {

          errorMessage =
            response.error;

        }

        else if (response?.message) {

          errorMessage =
            response.message;

        }

      }

    }

    catch (contextError) {

      console.error(
        "Could not read Edge Function error response:",
        contextError
      );


      if (error.message) {

        errorMessage =
          error.message;

      }

    }


    throw new Error(
      errorMessage
    );

  }


  // ========================================
  // FUNCTION RETURNED FAILURE
  // ========================================

  if (!data?.success) {

    throw new Error(
      data?.error ||
      data?.message ||
      "Unable to send invitation."
    );

  }


  return data;
}


// ========================================
// FORM SUBMIT
// ========================================

if (inviteForm) {

  inviteForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      clearMessage();


      const email =
        inviteEmail.value
          .trim()
          .toLowerCase();


      if (!email) {

        showMessage(
          "Please enter an email address.",
          "error"
        );

        return;
      }


      // Basic email check
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (!emailPattern.test(email)) {

        showMessage(
          "Please enter a valid email address.",
          "error"
        );

        return;
      }


      inviteButton.disabled =
        true;


      inviteButton.innerHTML =
        `
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>Sending Invitation...</span>
        `;


      try {

        await sendInvitation(
          email
        );


        showMessage(
          `Invitation successfully sent to ${email}.`,
          "success"
        );


        inviteForm.reset();

      }

      catch (error) {

        console.error(
          "Invitation failed:",
          error
        );


        showMessage(
          error.message ||
          "Unable to send the invitation.",
          "error"
        );

      }

      finally {

        inviteButton.disabled =
          false;


        inviteButton.innerHTML =
          `
            <i class="fa-solid fa-paper-plane"></i>
            <span>Send Invitation</span>
          `;

      }

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

      logoutButton.disabled =
        true;


      try {

        const {
          error
        } = await supabase.auth.signOut();


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

      catch (error) {

        console.error(
          "Unexpected logout error:",
          error
        );

      }

      finally {

        logoutButton.disabled =
          false;

      }

    }
  );

}


// ========================================
// START PAGE
// ========================================

async function initializePage() {

  const authorized =
    await checkAdmin();


  if (!authorized) {

    return;

  }


  console.log(
    "Invite Member page ready."
  );

}


// ========================================
// INITIALIZE
// ========================================

initializePage();