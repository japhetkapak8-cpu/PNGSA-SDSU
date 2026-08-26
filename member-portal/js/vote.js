import { supabase }
from "../../js/supabase.js";


let currentUser = null;

let activeElection = null;

let candidates = [];


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


  return true;
}



// ========================================
// CHECK ELIGIBILITY
// ========================================

async function checkEligibility() {

  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select(`
        eligible_to_vote,
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


  if (
    error ||
    !data
  ) {

    showMessage(
      "Unable to verify your voting eligibility."
    );

    return false;
  }


  const profileComplete =
    data.full_name &&
    data.major &&
    data.year_of_study &&
    data.living_area;


  if (!profileComplete) {

    showMessage(`
      Please complete your member profile before voting.
      <br><br>
      <a
        href="profile.html"
        class="small-button"
      >
        Complete Profile
      </a>
    `);

    return false;
  }


  if (!data.eligible_to_vote) {

    showMessage(
      "Your account is not currently eligible to vote."
    );

    return false;
  }


  return true;
}



// ========================================
// GET ACTIVE ELECTION
// ========================================

async function loadElection() {

  const {
    data,
    error
  } =
    await supabase
      .from("elections")
      .select("*")
      .eq(
        "status",
        "open"
      )
      .maybeSingle();


  if (
    error ||
    !data
  ) {

    showMessage(
      "There is currently no open election."
    );

    return false;
  }


  activeElection =
    data;


  return true;
}



// ========================================
// CHECK EXISTING BALLOT
// ========================================

async function checkAlreadyVoted() {

  const {
    data,
    error
  } =
    await supabase
      .from("ballots")
      .select("id")
      .eq(
        "election_id",
        activeElection.id
      )
      .eq(
        "voter_id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(error);

    return false;
  }


  if (data) {

    showMessage(`
      <strong>Your ballot has already been submitted.</strong>
      <br><br>
      Thank you for participating in the PNGSA election.
    `);

    return true;
  }


  return false;
}



// ========================================
// LOAD CANDIDATES
// ========================================

async function loadCandidates() {

  const {
    data,
    error
  } =
    await supabase
      .from("candidates")
      .select(`
        id,
        name,
        position,
        bio
      `)
      .eq(
        "election_id",
        activeElection.id
      )
      .order(
        "position",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    showMessage(
      "Unable to load election candidates."
    );

    return;
  }


  candidates =
    data || [];


  displayBallot();

}



// ========================================
// DISPLAY BALLOT
// ========================================

function displayBallot() {

  const container =
    document.getElementById(
      "ballotPositions"
    );


  if (
    candidates.length === 0
  ) {

    showMessage(
      "No candidates have been added to this election."
    );

    return;
  }


  const positions =
    [
      ...new Set(
        candidates.map(
          candidate =>
            candidate.position
        )
      )
    ];


  container.innerHTML =
    positions
      .map(
        position => {


          const positionCandidates =
            candidates.filter(
              candidate =>
                candidate.position ===
                position
            );


          return `

            <section
              class="ballot-position"
            >

              <h2>
                ${escapeHTML(position)}
              </h2>


              <div
                class="candidate-grid"
              >

                ${
                  positionCandidates
                    .map(
                      candidate => `

                        <div
                          class="candidate-option"
                        >

                          <input
                            type="radio"
                            name="${escapeHTML(position)}"
                            id="candidate-${candidate.id}"
                            value="${candidate.id}"
                            required
                          >

                          <label
                            for="candidate-${candidate.id}"
                          >

                            <h3>
                              ${escapeHTML(candidate.name)}
                            </h3>

                            <p>
                              ${
                                escapeHTML(
                                  candidate.bio ||
                                  "PNGSA executive candidate"
                                )
                              }
                            </p>

                          </label>

                        </div>

                      `
                    )
                    .join("")
                }

              </div>

            </section>

          `;

        }
      )
      .join("");


  document.getElementById(
    "voteMessagePanel"
  ).hidden =
    true;


  document.getElementById(
    "ballotForm"
  ).hidden =
    false;

}



// ========================================
// SUBMIT BALLOT
// ========================================

document
  .getElementById(
    "ballotForm"
  )
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const confirmVote =
        window.confirm(
          "Submit your ballot? You will not be able to change it after submission."
        );


      if (!confirmVote) {
        return;
      }


      const button =
        document.getElementById(
          "submitBallotButton"
        );


      const message =
        document.getElementById(
          "ballotMessage"
        );


      button.disabled =
        true;


      message.textContent =
        "Submitting ballot...";


      const selectedVotes = [];


      const positions =
        [
          ...new Set(
            candidates.map(
              candidate =>
                candidate.position
            )
          )
        ];


      for (
        const position
        of positions
      ) {

        const selected =
          document.querySelector(
            `input[name="${CSS.escape(position)}"]:checked`
          );


        if (!selected) {

          message.textContent =
            `Please select a candidate for ${position}.`;

          message.className =
            "form-message error";

          button.disabled =
            false;

          return;
        }


        selectedVotes.push({

          position,

          candidateId:
            Number(selected.value)

        });

      }


      // Create ballot

      const {
        data: ballot,
        error: ballotError
      } =
        await supabase
          .from("ballots")
          .insert({

            election_id:
              activeElection.id,

            voter_id:
              currentUser.id

          })
          .select("id")
          .single();


      if (ballotError) {

        console.error(
          ballotError
        );


        if (
          ballotError.code ===
          "23505"
        ) {

          showMessage(
            "Your ballot has already been submitted."
          );

          return;
        }


        message.textContent =
          "Unable to submit your ballot.";

        message.className =
          "form-message error";

        button.disabled =
          false;

        return;
      }


      const voteRows =
        selectedVotes.map(
          vote => ({

            ballot_id:
              ballot.id,

            candidate_id:
              vote.candidateId,

            position:
              vote.position

          })
        );


      const {
        error: voteError
      } =
        await supabase
          .from("votes")
          .insert(
            voteRows
          );


      if (voteError) {

        console.error(
          voteError
        );

        message.textContent =
          "Your ballot was created, but the selections could not be recorded. Please contact a PNGSA administrator.";

        message.className =
          "form-message error";

        return;
      }


      document.getElementById(
        "ballotForm"
      ).hidden =
        true;


      showMessage(`
        <strong>Your ballot was submitted successfully.</strong>
        <br><br>
        Thank you for participating in the PNGSA election.
      `);

    }
  );



// ========================================
// MESSAGE
// ========================================

function showMessage(content) {

  const panel =
    document.getElementById(
      "voteMessagePanel"
    );


  panel.hidden =
    false;


  panel.innerHTML =
    `<p>${content}</p>`;

}



// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

  return String(value)

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

  if (
    !await authenticateMember()
  ) {
    return;
  }


  if (
    !await checkEligibility()
  ) {
    return;
  }


  if (
    !await loadElection()
  ) {
    return;
  }


  if (
    await checkAlreadyVoted()
  ) {
    return;
  }


  await loadCandidates();

}


initialize();