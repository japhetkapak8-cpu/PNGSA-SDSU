import { supabase }
from "../../js/supabase.js";

async function protectAdminPage() {

  const {
    data: { session }

  } =
    await supabase.auth
      .getSession();


  if (!session) {

    window.location.href =
      "index.html";

    return;

  }


  const user =
    session.user;


  const {
    data: profile,
    error

  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();


  if (
    error ||
    profile?.role !== "admin"
  ) {

    await supabase.auth.signOut();

    window.location.href =
      "index.html";

    return;

  }


  document.getElementById(
    "adminEmail"
  ).textContent =
    user.email;


  loadDashboard();

}


async function loadDashboard() {

  /*
     Eligible voters
  */

  const {
    count: eligibleCount
  } =
    await supabase
      .from("profiles")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "eligible_to_vote",
        true
      );


  document.getElementById(
    "eligibleCount"
  ).textContent =
    eligibleCount ?? 0;


  /*
     Candidates
  */

  const {
    count: candidateCount
  } =
    await supabase
      .from("candidates")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      );


  document.getElementById(
    "candidateCount"
  ).textContent =
    candidateCount ?? 0;


  /*
     Ballots submitted
  */

  const {
    count: voteCount
  } =
    await supabase
      .from("ballots")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      );


  document.getElementById(
    "voteCount"
  ).textContent =
    voteCount ?? 0;

}


document
  .getElementById(
    "logoutButton"
  )
  .addEventListener(
    "click",
    async () => {

      await supabase.auth
        .signOut();

      window.location.href =
        "index.html";

    }
  );


protectAdminPage();