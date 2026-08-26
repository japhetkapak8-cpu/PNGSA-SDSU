import { supabase }
from "./supabase.js";

const form =
  document.getElementById(
    "adminLoginForm"
  );

const message =
  document.getElementById(
    "loginMessage"
  );


form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const email =
      document.getElementById(
        "email"
      ).value.trim();

    const password =
      document.getElementById(
        "password"
      ).value;


    message.textContent =
      "Signing in...";


    const {
      data,
      error
    } =
      await supabase.auth
        .signInWithPassword({

          email: email,

          password: password

        });


    if (error) {

      message.textContent =
        error.message;

      message.style.color =
        "red";

      return;
    }


    const user =
      data.user;


    /*
       Check that this user
       actually has admin status
    */

    const {
      data: profile,
      error: profileError

    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();


    if (
      profileError ||
      profile?.role !== "admin"
    ) {

      await supabase.auth.signOut();

      message.textContent =
        "You are not authorized to access the admin portal.";

      message.style.color =
        "red";

      return;
    }


    window.location.href =
      "dashboard.html";

  }
);