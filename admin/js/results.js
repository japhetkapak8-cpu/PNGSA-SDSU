import { supabase }
from "../../js/supabase.js";


// ======================================================
// ELEMENTS
// ======================================================

const yearSelect =
    document.getElementById(
        "yearSelect"
    );


const electionSelect =
    document.getElementById(
        "electionSelect"
    );


const electionInfo =
    document.getElementById(
        "electionInfo"
    );


const eligibleCount =
    document.getElementById(
        "eligibleCount"
    );


const ballotCount =
    document.getElementById(
        "ballotCount"
    );


const participationCount =
    document.getElementById(
        "participationCount"
    );


const results =
    document.getElementById(
        "results"
    );



let allElections =
    [];



// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {


    console.log(
        "Results page starting..."
    );


    const allowed =
        await authenticateAdmin();


    if (!allowed) {

        return;
    }


    await loadElections();
}


initialize();



// ======================================================
// AUTHENTICATE ADMIN
// ======================================================

async function authenticateAdmin() {


    const {
        data: {
            session
        },

        error:
            sessionError

    } =
        await supabase.auth
            .getSession();



    if (sessionError) {


        console.error(
            "Session error:",
            sessionError
        );


        showError(
            sessionError.message
        );


        return false;
    }



    if (!session) {


        window.location.replace(
            "../index.html"
        );


        return false;
    }



    const user =
        session.user;



    console.log(
        "Logged in:",
        user.email
    );



    const {
        data:
            profile,

        error:
            profileError

    } =
        await supabase
            .from("profiles")
            .select("*")
            .eq(
                "id",
                user.id
            )
            .maybeSingle();



    if (profileError) {


        console.error(
            profileError
        );


        showError(
            profileError.message
        );


        return false;
    }



    if (
        !profile
        ||
        profile.role
        !==
        "admin"
    ) {


        alert(
            "Admin access required."
        );


        window.location.replace(
            "../member-portal/dashboard.html"
        );


        return false;
    }



    return true;
}



// ======================================================
// LOAD ALL ELECTIONS
// ======================================================

async function loadElections() {


    console.log(
        "Loading elections..."
    );



    const {
        data,
        error

    } =
        await supabase
            .from("elections")
            .select(`
                id,
                title,
                description,
                status,
                start_at,
                end_at,
                created_at,
                election_year,
                election_term
            `)
            .order(
                "election_year",
                {
                    ascending: false,

                    nullsFirst:
                        false
                }
            )
            .order(
                "start_at",
                {
                    ascending: false,

                    nullsFirst:
                        false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );



    console.log(
        "Elections:",
        data
    );



    if (error) {


        console.error(
            error
        );


        electionSelect.innerHTML =
            `
            <option value="">

                Error loading elections

            </option>
            `;


        showError(
            error.message
        );


        return;
    }



    allElections =
        data || [];



    if (
        allElections.length
        ===
        0
    ) {


        electionSelect.innerHTML =
            `
            <option value="">

                No elections found

            </option>
            `;


        yearSelect.innerHTML =
            `
            <option value="all">

                All Years

            </option>
            `;


        resetStats();


        return;
    }



    populateYearFilter();



    // ==================================================
    // CHECK URL FOR SPECIFIC ELECTION
    // Example:
    // results.html?election=UUID
    // ==================================================

    const url =
        new URL(
            window.location.href
        );


    const requestedElection =
        url.searchParams.get(
            "election"
        );



    if (requestedElection) {


        const election =
            allElections.find(
                item =>
                    item.id
                    ===
                    requestedElection
            );



        if (election) {


            const year =
                getElectionYear(
                    election
                );


            yearSelect.value =
                year;


            renderElectionOptions(
                year,
                requestedElection
            );


            return;
        }
    }



    renderElectionOptions(
        "all"
    );
}



// ======================================================
// GET YEAR
// ======================================================

function getElectionYear(
    election
) {


    if (
        election.election_year
    ) {


        return String(
            election.election_year
        );
    }



    if (
        election.start_at
    ) {


        return String(
            new Date(
                election.start_at
            )
            .getFullYear()
        );
    }



    return "Other";
}



// ======================================================
// POPULATE YEAR FILTER
// ======================================================

function populateYearFilter() {


    const years =
        [
            ...new Set(

                allElections.map(
                    election =>
                        getElectionYear(
                            election
                        )
                )

            )
        ];



    years.sort(
        (
            a,
            b
        ) => {


            if (
                a === "Other"
            ) {

                return 1;
            }


            if (
                b === "Other"
            ) {

                return -1;
            }


            return (
                Number(b)
                -
                Number(a)
            );
        }
    );



    yearSelect.innerHTML =
        `
        <option value="all">

            All Years

        </option>
        `
        +
        years.map(
            year => `
                <option
                    value="${escapeHTML(year)}"
                >

                    ${escapeHTML(year)}

                </option>
            `
        ).join("");
}



// ======================================================
// RENDER ELECTION OPTIONS
// ======================================================

function renderElectionOptions(
    selectedYear =
        "all",

    requestedElection =
        null
) {


    let filtered =
        allElections;



    if (
        selectedYear
        !==
        "all"
    ) {


        filtered =
            allElections.filter(
                election =>
                    getElectionYear(
                        election
                    )
                    ===
                    selectedYear
            );
    }



    if (
        filtered.length
        ===
        0
    ) {


        electionSelect.innerHTML =
            `
            <option value="">

                No elections found for this year

            </option>
            `;


        resetStats();


        hideElectionInfo();


        return;
    }



    // ==================================================
    // GROUP BY YEAR
    // ==================================================

    const groups =
        {};



    for (
        const election
        of filtered
    ) {


        const year =
            getElectionYear(
                election
            );



        if (!groups[year]) {


            groups[year] =
                [];
        }



        groups[year]
            .push(
                election
            );
    }



    const years =
        Object.keys(
            groups
        )
        .sort(
            (
                a,
                b
            ) => {


                if (
                    a === "Other"
                ) {

                    return 1;
                }


                if (
                    b === "Other"
                ) {

                    return -1;
                }


                return (
                    Number(b)
                    -
                    Number(a)
                );
            }
        );



    electionSelect.innerHTML =
        years.map(
            year => {


                const options =
                    groups[year]
                        .map(
                            election =>
                                createElectionOption(
                                    election
                                )
                        )
                        .join("");



                return `
                    <optgroup
                        label="${escapeHTML(year)}"
                    >

                        ${options}

                    </optgroup>
                `;
            }
        )
        .join("");



    // ==================================================
    // SELECT SPECIFIC ELECTION IF REQUESTED
    // ==================================================

    if (
        requestedElection
        &&
        filtered.some(
            election =>
                election.id
                ===
                requestedElection
        )
    ) {


        electionSelect.value =
            requestedElection;
    }



    loadResults();
}



// ======================================================
// CREATE DROPDOWN OPTION
// ======================================================

function createElectionOption(
    election
) {


    const term =
        election.election_term
        || "";



    const date =
        election.start_at
        ?
        new Date(
            election.start_at
        )
        .toLocaleDateString()
        :
        "No date";



    const labelParts =
        [];



    if (term) {

        labelParts.push(
            term
        );
    }



    labelParts.push(
        election.title
    );


    labelParts.push(
        date
    );



    const label =
        labelParts.join(
            " — "
        );



    return `
        <option
            value="${election.id}"
        >

            ${
                escapeHTML(
                    label
                )
            }

            (${election.status})

        </option>
    `;
}



// ======================================================
// YEAR CHANGED
// ======================================================

yearSelect.addEventListener(
    "change",
    () => {


        renderElectionOptions(
            yearSelect.value
        );
    }
);



// ======================================================
// ELECTION CHANGED
// ======================================================

electionSelect.addEventListener(
    "change",
    async () => {


        await loadResults();
    }
);



// ======================================================
// LOAD RESULTS
// ======================================================

async function loadResults() {


    const electionId =
        electionSelect.value;



    if (!electionId) {


        resetStats();


        hideElectionInfo();


        return;
    }



    const selectedElection =
        allElections.find(
            election =>
                election.id
                ===
                electionId
        );



    if (selectedElection) {


        showElectionInfo(
            selectedElection
        );
    }



    results.innerHTML =
        `
        <div class="empty-message">

            Loading results...

        </div>
        `;



    // ==================================================
    // ELIGIBLE VOTERS
    // ==================================================

    const {
        data:
            eligible,

        error:
            eligibleError

    } =
        await supabase
            .from(
                "eligible_voters"
            )
            .select(
                "user_id"
            )
            .eq(
                "election_id",
                electionId
            );



    if (eligibleError) {


        console.error(
            eligibleError
        );


        showError(
            eligibleError.message
        );


        return;
    }



    // ==================================================
    // POSITIONS
    // ==================================================

    const {
        data:
            positions,

        error:
            positionError

    } =
        await supabase
            .from(
                "election_positions"
            )
            .select(`
                id,
                name,
                display_order
            `)
            .eq(
                "election_id",
                electionId
            )
            .order(
                "display_order",
                {
                    ascending: true
                }
            );



    if (positionError) {


        console.error(
            positionError
        );


        showError(
            positionError.message
        );


        return;
    }



    // ==================================================
    // CANDIDATES
    // ==================================================

    const {
        data:
            candidates,

        error:
            candidateError

    } =
        await supabase
            .from(
                "candidates"
            )
            .select(`
                id,
                election_id,
                position_id,
                name
            `)
            .eq(
                "election_id",
                electionId
            );



    if (candidateError) {


        console.error(
            candidateError
        );


        showError(
            candidateError.message
        );


        return;
    }



    // ==================================================
    // VOTES
    // ==================================================

    const {
        data:
            votes,

        error:
            voteError

    } =
        await supabase
            .from(
                "election_votes"
            )
            .select(`
                id,
                election_id,
                position_id,
                candidate_id,
                voter_id
            `)
            .eq(
                "election_id",
                electionId
            );



    if (voteError) {


        console.error(
            voteError
        );


        showError(
            voteError.message
        );


        return;
    }



    // ==================================================
    // SUMMARY
    // ==================================================

    const numberEligible =
        eligible?.length
        || 0;



    const uniqueVoters =
        new Set(
            (votes || [])
                .map(
                    vote =>
                        vote.voter_id
                )
        );



    const numberBallots =
        uniqueVoters.size;



    const percentage =
        numberEligible > 0
        ?
        (
            numberBallots
            /
            numberEligible
            *
            100
        ).toFixed(1)
        :
        "0.0";



    eligibleCount.textContent =
        numberEligible;


    ballotCount.textContent =
        numberBallots;


    participationCount.textContent =
        `${percentage}%`;



    renderCandidateResults(

        positions || [],

        candidates || [],

        votes || []

    );
}



// ======================================================
// SHOW SELECTED ELECTION INFORMATION
// ======================================================

function showElectionInfo(
    election
) {


    const year =
        getElectionYear(
            election
        );



    const term =
        election.election_term
        || "Not specified";



    const start =
        election.start_at
        ?
        new Date(
            election.start_at
        )
        .toLocaleString()
        :
        "Not set";



    const end =
        election.end_at
        ?
        new Date(
            election.end_at
        )
        .toLocaleString()
        :
        "Not set";



    const statusClass =
        election.status
        ===
        "open"

        ?

        "status-open"

        :

        election.status
        ===
        "closed"

        ?

        "status-closed"

        :

        "status-draft";



    electionInfo.style.display =
        "block";



    electionInfo.innerHTML =
        `
        <div
            class="election-info-title"
        >

            ${
                escapeHTML(
                    election.title
                )
            }

            <span
                class="
                    status-badge
                    ${statusClass}
                "
            >

                ${
                    escapeHTML(
                        election.status
                            .toUpperCase()
                    )
                }

            </span>

        </div>


        <div
            class="election-info-details"
        >

            <span>

                <strong>
                    Year:
                </strong>

                ${escapeHTML(year)}

            </span>


            <span>

                <strong>
                    Term:
                </strong>

                ${escapeHTML(term)}

            </span>


            <span>

                <strong>
                    Start:
                </strong>

                ${escapeHTML(start)}

            </span>


            <span>

                <strong>
                    End:
                </strong>

                ${escapeHTML(end)}

            </span>

        </div>
        `;
}



// ======================================================
// HIDE ELECTION INFORMATION
// ======================================================

function hideElectionInfo() {


    electionInfo.style.display =
        "none";


    electionInfo.innerHTML =
        "";
}



// ======================================================
// RENDER CANDIDATE RESULTS
// ======================================================

function renderCandidateResults(
    positions,
    candidates,
    votes
) {


    if (
        positions.length
        ===
        0
    ) {


        results.innerHTML =
            `
            <div class="empty-message">

                No election positions
                have been configured.

            </div>
            `;


        return;
    }



    let html =
        "";



    for (
        const position
        of positions
    ) {


        const candidateList =
            candidates.filter(
                candidate =>
                    candidate.position_id
                    ===
                    position.id
            );



        const positionVotes =
            votes.filter(
                vote =>
                    vote.position_id
                    ===
                    position.id
            );



        const totalVotes =
            positionVotes.length;



        html +=
            `
            <div
                class="position-section"
            >

                <h2>

                    ${
                        escapeHTML(
                            position.name
                        )
                    }

                </h2>


                <p>

                    <strong>

                        ${totalVotes}

                    </strong>

                    vote(s) submitted
                    for this position.

                </p>
            `;



        if (
            candidateList.length
            ===
            0
        ) {


            html +=
                `
                <p>

                    No candidates found.

                </p>
                `;

        }

        else {


            const calculated =
                candidateList.map(
                    candidate => {


                        const count =
                            positionVotes
                                .filter(
                                    vote =>
                                        vote.candidate_id
                                        ===
                                        candidate.id
                                )
                                .length;



                        const percent =
                            totalVotes > 0

                            ?

                            (
                                count
                                /
                                totalVotes
                                *
                                100
                            ).toFixed(1)

                            :

                            "0.0";



                        return {

                            ...candidate,

                            count,

                            percent
                        };

                    }
                );



            calculated.sort(
                (
                    a,
                    b
                ) =>
                    b.count
                    -
                    a.count
            );



            const highest =
                calculated.length
                > 0

                ?

                calculated[0].count

                :

                0;



            for (
                const candidate
                of calculated
            ) {


                const leading =
                    candidate.count > 0
                    &&
                    candidate.count
                    ===
                    highest;



                html +=
                    `
                    <div
                        class="candidate-result"
                    >


                        <div
                            class="candidate-top"
                        >


                            <div>


                                <span
                                    class="candidate-name"
                                >

                                    ${
                                        escapeHTML(
                                            candidate.name
                                        )
                                    }

                                </span>


                                ${
                                    leading
                                    ?

                                    `
                                    <span
                                        class="leading"
                                    >

                                        LEADING

                                    </span>
                                    `

                                    :

                                    ""
                                }


                            </div>



                            <div
                                class="vote-number"
                            >

                                ${candidate.count}

                                vote(s)

                                —

                                ${candidate.percent}%

                            </div>


                        </div>



                        <div
                            class="bar-background"
                        >


                            <div
                                class="bar"

                                style="
                                    width:
                                    ${candidate.percent}%;
                                "
                            >
                            </div>


                        </div>


                    </div>
                    `;
            }
        }



        html +=
            `
            </div>
            `;
    }



    results.innerHTML =
        html;
}



// ======================================================
// RESET
// ======================================================

function resetStats() {


    eligibleCount.textContent =
        "0";


    ballotCount.textContent =
        "0";


    participationCount.textContent =
        "0%";


    results.innerHTML =
        `
        <div class="empty-message">

            Select an election.

        </div>
        `;
}



// ======================================================
// ERROR
// ======================================================

function showError(
    message
) {


    console.error(
        message
    );



    results.innerHTML =
        `
        <div class="empty-message">


            <strong>

                Unable to load results

            </strong>


            <br><br>


            ${
                escapeHTML(
                    message
                )
            }


        </div>
        `;
}



// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
    value
) {


    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value ?? "";


    return element.innerHTML;
}