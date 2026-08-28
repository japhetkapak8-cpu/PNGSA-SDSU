import { supabase }
from "../../js/supabase.js";


const content =
    document.getElementById(
        "content"
    );


let currentUser = null;

let currentElection = null;

let positions = [];


// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {

    const authenticated =
        await authenticateMember();


    if (!authenticated) {
        return;
    }


    await loadElection();
}


initialize();


// ======================================================
// AUTHENTICATION
// ======================================================

async function authenticateMember() {

    const {
        data: {
            session
        }
    } =
        await supabase.auth
            .getSession();


    if (!session) {

        window.location.replace(
            "index.html"
        );

        return false;
    }


    currentUser =
        session.user;


    return true;
}


// ======================================================
// LOAD OPEN ELECTION
// ======================================================

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
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(error);

        showError(
            error.message
        );

        return;
    }


    if (!data) {

        content.innerHTML =
            `
            <section class="card">

                <h2>
                    No Election Currently Open
                </h2>

                <p>
                    There is currently no PNGSA election
                    available for voting.
                </p>

            </section>
            `;

        return;
    }


    currentElection =
        data;


    const now =
        new Date();


    if (
        currentElection.start_at &&
        now <
        new Date(
            currentElection.start_at
        )
    ) {

        content.innerHTML =
            `
            <section class="card">

                <h2>
                    Voting Has Not Started
                </h2>

                <p>
                    Voting begins:
                    ${
                        new Date(
                            currentElection.start_at
                        ).toLocaleString()
                    }
                </p>

            </section>
            `;

        return;
    }


    if (
        currentElection.end_at &&
        now >
        new Date(
            currentElection.end_at
        )
    ) {

        content.innerHTML =
            `
            <section class="card">

                <h2>
                    Voting Has Ended
                </h2>

                <p>
                    This election is no longer accepting votes.
                </p>

            </section>
            `;

        return;
    }


    await checkEligibility();
}


// ======================================================
// CHECK ELIGIBILITY
// ======================================================

async function checkEligibility() {

    const {
        data,
        error
    } =
        await supabase
            .from(
                "eligible_voters"
            )
            .select("id")
            .eq(
                "election_id",
                currentElection.id
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(error);

        showError(
            error.message
        );

        return;
    }


    if (!data) {

        content.innerHTML =
            `
            <section class="card">

                <h2>
                    Not Eligible to Vote
                </h2>

                <p>
                    Your account is not listed as an eligible
                    voter for this election.
                </p>

            </section>
            `;

        return;
    }


    await checkAlreadyVoted();
}


// ======================================================
// CHECK WHETHER MEMBER ALREADY VOTED
// ======================================================

async function checkAlreadyVoted() {

    const {
        data,
        error
    } =
        await supabase
            .from(
                "election_votes"
            )
            .select(
                "id",
                {
                    count:
                        "exact"
                }
            )
            .eq(
                "election_id",
                currentElection.id
            )
            .eq(
                "voter_id",
                currentUser.id
            );


    if (error) {

        console.error(error);

        showError(
            error.message
        );

        return;
    }


    if (
        data &&
        data.length > 0
    ) {

        showAlreadyVoted();

        return;
    }


    await loadBallot();
}


// ======================================================
// LOAD POSITIONS + CANDIDATES
// ======================================================

async function loadBallot() {

    const {
        data,
        error
    } =
        await supabase
            .from(
                "election_positions"
            )
            .select(`
                id,
                name,
                display_order,
                candidates (
                    id,
                    name,
                    bio,
                    photo_url,
                    approved
                )
            `)
            .eq(
                "election_id",
                currentElection.id
            )
            .order(
                "display_order",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        showError(
            error.message
        );

        return;
    }


    positions =
        (data || [])
        .map(
            position => ({

                ...position,

                candidates:
                    (
                        position.candidates
                        || []
                    )
                    .filter(
                        candidate =>
                            candidate.approved
                            !== false
                    )
            })
        );


    renderBallot();
}


// ======================================================
// RENDER BALLOT
// ======================================================

function renderBallot() {

    if (
        positions.length === 0
    ) {

        content.innerHTML =
            `
            <section class="card">

                <h2>
                    Ballot Not Ready
                </h2>

                <p>
                    No election positions have been configured.
                </p>

            </section>
            `;

        return;
    }


    let deadline = "";


    if (
        currentElection.end_at
    ) {

        deadline =
            `
            <div class="notice">

                Voting closes:

                <strong>
                    ${
                        new Date(
                            currentElection.end_at
                        ).toLocaleString()
                    }
                </strong>

            </div>
            `;
    }


    const positionHTML =
        positions.map(
            position => {

                const candidates =
                    position.candidates
                    || [];


                const candidateHTML =
                    candidates.length
                    ?
                    candidates.map(
                        candidate => `
                            <label class="candidate">

                                <input
                                    type="radio"
                                    name="position-${position.id}"
                                    value="${candidate.id}"
                                    data-position-id="${position.id}"
                                >

                                <span class="candidate-name">
                                    ${
                                        escapeHTML(
                                            candidate.name
                                        )
                                    }
                                </span>

                                ${
                                    candidate.bio
                                    ?
                                    `
                                    <div class="candidate-bio">
                                        ${
                                            escapeHTML(
                                                candidate.bio
                                            )
                                        }
                                    </div>
                                    `
                                    :
                                    ""
                                }

                            </label>
                        `
                    ).join("")
                    :
                    `
                    <p>
                        No candidates have been added
                        for this position.
                    </p>
                    `;


                return `
                    <div class="position">

                        <h2>
                            ${
                                escapeHTML(
                                    position.name
                                )
                            }
                        </h2>

                        ${candidateHTML}

                    </div>
                `;
            }
        ).join("");


    content.innerHTML =
        `
        <section class="card">

            <h1>
                ${
                    escapeHTML(
                        currentElection.title
                    )
                }
            </h1>

            <p>
                ${
                    escapeHTML(
                        currentElection.description
                        || ""
                    )
                }
            </p>

            ${deadline}

            <div class="notice">

                Select one candidate for each position.
                Once you submit your ballot,
                it cannot be changed.

            </div>


            <form id="ballotForm">

                ${positionHTML}

                <br>

                <button
                    type="submit"
                    id="submitVoteBtn"
                >
                    Submit Ballot
                </button>

            </form>

        </section>
        `;


    document
        .getElementById(
            "ballotForm"
        )
        .addEventListener(
            "submit",
            submitBallot
        );
}


// ======================================================
// SUBMIT BALLOT
// ======================================================

async function submitBallot(
    event
) {

    event.preventDefault();


    const votes = [];


    for (
        const position
        of positions
    ) {

        const candidates =
            position.candidates
            || [];


        if (
            candidates.length === 0
        ) {

            continue;
        }


        const selected =
            document.querySelector(
                `
                input[
                    name="position-${position.id}"
                ]:checked
                `
            );


        if (!selected) {

            alert(
                `Please select a candidate for ${position.name}.`
            );

            return;
        }


        votes.push({

            election_id:
                currentElection.id,

            position_id:
                position.id,

            candidate_id:
                selected.value,

            voter_id:
                currentUser.id
        });
    }


    if (
        votes.length === 0
    ) {

        alert(
            "There are no candidates available to vote for."
        );

        return;
    }


    const confirmed =
        confirm(
            "Submit your ballot? Your vote cannot be changed after submission."
        );


    if (!confirmed) {
        return;
    }


    const button =
        document.getElementById(
            "submitVoteBtn"
        );


    button.disabled =
        true;

    button.textContent =
        "Submitting...";


    // Check again before insert

    const {
        data: existingVotes,
        error: existingError
    } =
        await supabase
            .from(
                "election_votes"
            )
            .select("id")
            .eq(
                "election_id",
                currentElection.id
            )
            .eq(
                "voter_id",
                currentUser.id
            );


    if (existingError) {

        button.disabled =
            false;

        button.textContent =
            "Submit Ballot";

        alert(
            existingError.message
        );

        return;
    }


    if (
        existingVotes &&
        existingVotes.length > 0
    ) {

        showAlreadyVoted();

        return;
    }


    const {
        error
    } =
        await supabase
            .from(
                "election_votes"
            )
            .insert(
                votes
            );


    if (error) {

        console.error(error);


        button.disabled =
            false;

        button.textContent =
            "Submit Ballot";


        if (
            error.code === "23505"
        ) {

            showAlreadyVoted();

            return;
        }


        alert(
            error.message
        );

        return;
    }


    showSuccess();
}


// ======================================================
// SUCCESS
// ======================================================

function showSuccess() {

    content.innerHTML =
        `
        <section class="card success">

            <div class="success-icon">
                ✓
            </div>

            <h2>
                Vote Submitted
            </h2>

            <p>
                Your ballot has been successfully recorded.
            </p>

            <p>
                Thank you for participating in the
                PNGSA election.
            </p>

            <br>

            <a href="dashboard.html">
                Return to Dashboard
            </a>

        </section>
        `;
}


// ======================================================
// ALREADY VOTED
// ======================================================

function showAlreadyVoted() {

    content.innerHTML =
        `
        <section class="card success">

            <div class="success-icon">
                ✓
            </div>

            <h2>
                Ballot Already Submitted
            </h2>

            <p>
                You have already voted in
                ${
                    escapeHTML(
                        currentElection.title
                    )
                }.
            </p>

            <p>
                Your ballot cannot be submitted again.
            </p>

            <br>

            <a href="dashboard.html">
                Return to Dashboard
            </a>

        </section>
        `;
}


// ======================================================
// ERROR
// ======================================================

function showError(
    errorMessage
) {

    content.innerHTML =
        `
        <section class="card">

            <h2>
                Unable to Load Voting
            </h2>

            <p>
                ${
                    escapeHTML(
                        errorMessage
                    )
                }
            </p>

        </section>
        `;
}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;
}