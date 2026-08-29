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


// ========================================
// CHECK ADMIN
// ========================================

async function checkAdmin() {

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();


  if (sessionError || !session) {

    window.location.replace(
      "index.html"
    );

    return false;
  }


  const user = session.user;


  const {
    data: profile,
    error: profileError
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();


  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {

    console.error(
      "Admin verification failed:",
      profileError
    );

    window.location.replace(
      "../member-portal/dashboard.html"
    );

    return false;
  }


  return true;
}


// ========================================
// SHOW MESSAGE
// ========================================

function showMessage(
  message,
  type = "error"
) {

  inviteMessage.textContent =
    message;

  inviteMessage.className =
    `invite-message ${type}`;
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
    "Invite function response:",
    data
  );


  if (error) {

    console.error(
      "Edge Function error:",
      error
    );

    throw new Error(
      error.message ||
      "Unable to contact invitation service."
    );
  }


  if (!data?.success) {

    throw new Error(
      data?.error ||
      "Unable to send invitation."
    );
  }


  return data;
}


// ========================================
// FORM SUBMIT
// ========================================

inviteForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const email =
      inviteEmail.value
        .trim()
        .toLowerCase();


    if (!email) {

      showMessage(
        "Please enter an email address."
      );

      return;
    }


    inviteButton.disabled =
      true;

    inviteButton.textContent =
      "Sending Invitation...";


    inviteMessage.className =
      "invite-message";

    inviteMessage.textContent =
      "";


    try {

      await sendInvitation(
        email
      );


      showMessage(
        `Invitation successfully sent to ${email}.`,
        "success"
      );


      inviteForm.reset();


    } catch (error) {

      console.error(
        "Invitation failed:",
        error
      );


      showMessage(
        error.message ||
        "Unable to send the invitation.",
        "error"
      );


    } finally {

      inviteButton.disabled =
        false;

      inviteButton.textContent =
        "Send Invitation";

    }

  }
);


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


initializePage();