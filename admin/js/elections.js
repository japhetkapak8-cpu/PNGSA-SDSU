import { supabase }
from "../../js/supabase.js";

import {
    requireAdmin
}
from "./admin-auth.js";


// =======================================================
// ELEMENTS
// =======================================================

const electionForm =
    document.getElementById(
        "electionForm"
    );


const electionsList =
    document.getElementById(
        "electionsList"
    );


const message =
    document.getElementById(
        "message"
    );


const electionSearch =
    document.getElementById(
        "electionSearch"
    );


const yearFilter =
    document.getElementById(
        "yearFilter"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =======================================================
// STATE
// =======================================================

let adminUser = null;

let allElections = [];


// =======================================================
// INITIALIZE
// =======================================================

async function initialize() {

    const auth =
        await requireAdmin();


    if (!auth) {
        return;
    }


    adminUser =
        auth.user;


    setDefaultElectionYear();


    setupFilterListeners();


    setupLogout();


    await loadElections();
}


initialize();


// =======================================================
// DEFAULT YEAR
// =======================================================

function setDefaultElectionYear() {

    const yearInput =
        document.getElementById(
            "electionYear"
        );


    if (yearInput) {

        yearInput.value =
            new Date()
                .getFullYear();
    }
}


// =======================================================
// CREATE ELECTION
// =======================================================

electionForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        message.textContent =
            "";


        const title =
            document
                .getElementById(
                    "title"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "description"
                )
                .value
                .trim();


        const electionYear =
            Number(
                document
                    .getElementById(
                        "electionYear"
                    )
                    .value
            );


        const electionTerm =
            document
                .getElementById(
                    "electionTerm"
                )
                .value;


        const startAt =
            document
                .getElementById(
                    "startAt"
                )
                .value;


        const endAt =
            document
                .getElementById(
                    "endAt"
                )
                .value;


        // ---------------------------------------
        // VALIDATION
        // ---------------------------------------

        if (!title) {

            message.textContent =
                "Enter an election title.";

            return;
        }


        if (
            !Number.isInteger(
                electionYear
            )
        ) {

            message.textContent =
                "Enter a valid election year.";

            return;
        }


        if (
            electionYear < 2020
            ||
            electionYear > 2100
        ) {

            message.textContent =
                "Election year must be between 2020 and 2100.";

            return;
        }


        if (
            ![
                "Spring",
                "Summer",
                "Fall"
            ].includes(
                electionTerm
            )
        ) {

            message.textContent =
                "Select a valid election term.";

            return;
        }


        if (
            startAt
            &&
            endAt
            &&
            new Date(
                endAt
            )
            <=
            new Date(
                startAt
            )
        ) {

            message.textContent =
                "The end date must be after the start date.";

            return;
        }


        // ---------------------------------------
        // INSERT ELECTION
        // ---------------------------------------

        const {
            error
        } =
            await supabase
                .from(
                    "elections"
                )
                .insert({

                    title:
                        title,

                    description:
                        description
                        || null,

                    election_year:
                        electionYear,

                    election_term:
                        electionTerm,

                    start_at:
                        startAt
                        ?
                        new Date(
                            startAt
                        ).toISOString()
                        :
                        null,

                    end_at:
                        endAt
                        ?
                        new Date(
                            endAt
                        ).toISOString()
                        :
                        null,

                    status:
                        "draft",

                    created_by:
                        adminUser.id
                });


        if (error) {

            console.error(
                "Create election error:",
                error
            );


            message.textContent =
                error.message;


            return;
        }


        message.textContent =
            "Election created successfully.";


        electionForm.reset();


        setDefaultElectionYear();


        const termSelect =
            document.getElementById(
                "electionTerm"
            );


        if (termSelect) {

            termSelect.value =
                "Fall";
        }


        await loadElections();
    }
);


// =======================================================
// LOAD ELECTIONS
// =======================================================

async function loadElections() {

    electionsList.innerHTML =
        `
        <div class="elections-loading">

            <i
                class="
                    fa-solid
                    fa-spinner
                    fa-spin
                "
            ></i>

            Loading elections...

        </div>
        `;


    const {
        data,
        error
    } =
        await supabase
            .from(
                "elections"
            )
            .select(`
                id,
                title,
                description,
                election_year,
                election_term,
                start_at,
                end_at,
                status,
                created_at
            `)
            .order(
                "election_year",
                {
                    ascending: false,
                    nullsFirst: false
                }
            )
            .order(
                "start_at",
                {
                    ascending: false,
                    nullsFirst: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Load election error:",
            error
        );


        updateElectionStats(
            []
        );


        electionsList.innerHTML =
            `
            <div class="elections-empty">

                <i
                    class="
                        fa-solid
                        fa-triangle-exclamation
                    "
                ></i>

                <h3>
                    Unable to load elections
                </h3>

                <p>
                    ${
                        escapeHTML(
                            error.message
                        )
                    }
                </p>

            </div>
            `;


        return;
    }


    // ===================================================
    // SAVE ALL ELECTIONS
    // ===================================================

    allElections =
        data
        || [];


    // ===================================================
    // UPDATE TOP STAT CARDS
    // ===================================================

    updateElectionStats(
        allElections
    );


    // ===================================================
    // YEAR DROPDOWN
    // ===================================================

    populateYearFilter(
        allElections
    );


    // ===================================================
    // DISPLAY ELECTIONS
    // ===================================================

    renderElections();
}


// =======================================================
// UPDATE STATISTICS
// =======================================================

function updateElectionStats(
    elections
) {

    const totalElectionCount =
        document.getElementById(
            "totalElectionCount"
        );


    const openElectionCount =
        document.getElementById(
            "openElectionCount"
        );


    const draftElectionCount =
        document.getElementById(
            "draftElectionCount"
        );


    const closedElectionCount =
        document.getElementById(
            "closedElectionCount"
        );


    const total =
        elections.length;


    const open =
        elections.filter(
            election =>
                String(
                    election.status
                ).toLowerCase()
                ===
                "open"
        ).length;


    const draft =
        elections.filter(
            election =>
                String(
                    election.status
                ).toLowerCase()
                ===
                "draft"
        ).length;


    const closed =
        elections.filter(
            election =>
                String(
                    election.status
                ).toLowerCase()
                ===
                "closed"
        ).length;


    if (totalElectionCount) {

        totalElectionCount.textContent =
            total;
    }


    if (openElectionCount) {

        openElectionCount.textContent =
            open;
    }


    if (draftElectionCount) {

        draftElectionCount.textContent =
            draft;
    }


    if (closedElectionCount) {

        closedElectionCount.textContent =
            closed;
    }
}


// =======================================================
// POPULATE YEAR FILTER
// =======================================================

function populateYearFilter(
    elections
) {

    if (!yearFilter) {
        return;
    }


    const currentValue =
        yearFilter.value;


    const years =
        [
            ...new Set(
                elections
                    .map(
                        election =>
                            getElectionYear(
                                election
                            )
                    )
                    .filter(
                        year =>
                            year
                            !==
                            "Other"
                    )
            )
        ]
        .sort(
            (
                a,
                b
            ) =>
                Number(b)
                -
                Number(a)
        );


    yearFilter.innerHTML =
        `
        <option value="all">
            All Years
        </option>

        ${
            years
                .map(
                    year => `
                        <option
                            value="${
                                escapeHTML(
                                    String(
                                        year
                                    )
                                )
                            }"
                        >
                            ${
                                escapeHTML(
                                    String(
                                        year
                                    )
                                )
                            }
                        </option>
                    `
                )
                .join("")
        }
        `;


    if (
        [
            "all",
            ...years.map(
                year =>
                    String(year)
            )
        ].includes(
            currentValue
        )
    ) {

        yearFilter.value =
            currentValue;
    }
}


// =======================================================
// GET ELECTION YEAR
// =======================================================

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


// =======================================================
// FILTER LISTENERS
// =======================================================

function setupFilterListeners() {

    if (electionSearch) {

        electionSearch
            .addEventListener(
                "input",
                renderElections
            );
    }


    if (yearFilter) {

        yearFilter
            .addEventListener(
                "change",
                renderElections
            );
    }


    if (statusFilter) {

        statusFilter
            .addEventListener(
                "change",
                renderElections
            );
    }
}


// =======================================================
// FILTER ELECTIONS
// =======================================================

function getFilteredElections() {

    let elections =
        [
            ...allElections
        ];


    // ---------------------------------------
    // SEARCH
    // ---------------------------------------

    const searchValue =
        electionSearch
        ?
        electionSearch
            .value
            .trim()
            .toLowerCase()
        :
        "";


    if (searchValue) {

        elections =
            elections.filter(
                election => {

                    const combinedText =
                        `
                            ${election.title || ""}
                            ${election.description || ""}
                            ${election.election_year || ""}
                            ${election.election_term || ""}
                            ${election.status || ""}
                        `
                        .toLowerCase();


                    return combinedText
                        .includes(
                            searchValue
                        );
                }
            );
    }


    // ---------------------------------------
    // YEAR
    // ---------------------------------------

    const selectedYear =
        yearFilter
        ?
        yearFilter.value
        :
        "all";


    if (
        selectedYear
        !==
        "all"
    ) {

        elections =
            elections.filter(
                election =>
                    getElectionYear(
                        election
                    )
                    ===
                    selectedYear
            );
    }


    // ---------------------------------------
    // STATUS
    // ---------------------------------------

    const selectedStatus =
        statusFilter
        ?
        statusFilter.value
        :
        "all";


    if (
        selectedStatus
        !==
        "all"
    ) {

        elections =
            elections.filter(
                election =>
                    String(
                        election.status
                    ).toLowerCase()
                    ===
                    selectedStatus
            );
    }


    return elections;
}


// =======================================================
// RENDER ELECTIONS
// =======================================================

function renderElections() {

    const elections =
        getFilteredElections();


    if (
        !elections
        ||
        elections.length === 0
    ) {

        electionsList.innerHTML =
            `
            <div class="elections-empty">

                <i
                    class="
                        fa-solid
                        fa-box-open
                    "
                ></i>

                <h3>
                    No elections found
                </h3>

                <p>
                    No elections match the selected filters.
                </p>

            </div>
            `;


        return;
    }


    const groupedElections =
        groupElectionsByYear(
            elections
        );


    electionsList.innerHTML =
        Object.keys(
            groupedElections
        )
        .sort(
            (
                yearA,
                yearB
            ) => {

                if (
                    yearA
                    ===
                    "Other"
                ) {

                    return 1;
                }


                if (
                    yearB
                    ===
                    "Other"
                ) {

                    return -1;
                }


                return (
                    Number(
                        yearB
                    )
                    -
                    Number(
                        yearA
                    )
                );
            }
        )
        .map(
            year => {

                const yearElections =
                    groupedElections[
                        year
                    ];


                const electionCards =
                    yearElections
                        .map(
                            election =>
                                createElectionCard(
                                    election
                                )
                        )
                        .join("");


                return `
                    <section
                        class="
                            election-year-group
                        "
                    >

                        <div
                            class="
                                election-year-heading
                            "
                        >

                            <h3>
                                ${
                                    escapeHTML(
                                        year
                                    )
                                }
                            </h3>

                        </div>


                        ${electionCards}

                    </section>
                `;
            }
        )
        .join("");


    attachButtons();
}


// =======================================================
// GROUP ELECTIONS BY YEAR
// =======================================================

function groupElectionsByYear(
    elections
) {

    const groups =
        {};


    for (
        const election
        of elections
    ) {

        const year =
            getElectionYear(
                election
            );


        if (
            !groups[
                year
            ]
        ) {

            groups[
                year
            ] =
                [];
        }


        groups[
            year
        ].push(
            election
        );
    }


    return groups;
}


// =======================================================
// CREATE ELECTION CARD
// =======================================================

function createElectionCard(
    election
) {

    const start =
        election.start_at
        ?
        new Date(
            election.start_at
        ).toLocaleString()
        :
        "Not set";


    const end =
        election.end_at
        ?
        new Date(
            election.end_at
        ).toLocaleString()
        :
        "Not set";


    const year =
        getElectionYear(
            election
        );


    const term =
        election.election_term
        ||
        "Not set";


    const title =
        election.title
        ||
        "Untitled Election";


    const status =
        String(
            election.status
            ||
            "draft"
        ).toLowerCase();


    return `
        <article
            class="
                election
            "
        >

            <div>

                <h3>
                    ${
                        escapeHTML(
                            title
                        )
                    }
                </h3>


                <div
                    class="
                        election-meta
                    "
                >

                    <span
                        class="
                            election-year-badge
                        "
                    >
                        <i
                            class="
                                fa-solid
                                fa-calendar
                            "
                        ></i>

                        ${
                            escapeHTML(
                                year
                            )
                        }
                    </span>


                    <span
                        class="
                            election-term-badge
                        "
                    >

                        ${
                            escapeHTML(
                                term
                            )
                        }

                    </span>


                    <span
                        class="
                            status
                            ${
                                escapeHTML(
                                    status
                                )
                            }
                        "
                    >

                        ${
                            escapeHTML(
                                status
                            )
                        }

                    </span>

                </div>

            </div>


            ${
                election.description
                ?
                `
                <p>
                    ${
                        escapeHTML(
                            election.description
                        )
                    }
                </p>
                `
                :
                ""
            }


            <div
                class="
                    election-meta
                "
            >

                <span>

                    <i
                        class="
                            fa-regular
                            fa-clock
                        "
                    ></i>

                    <strong>
                        Start:
                    </strong>

                    ${
                        escapeHTML(
                            start
                        )
                    }

                </span>


                <span>

                    <i
                        class="
                            fa-solid
                            fa-flag-checkered
                        "
                    ></i>

                    <strong>
                        End:
                    </strong>

                    ${
                        escapeHTML(
                            end
                        )
                    }

                </span>

            </div>


            <div
                class="
                    actions
                "
            >


                <button
                    type="button"
                    class="secondary"
                    data-action="draft"
                    data-id="${election.id}"
                >

                    <i
                        class="
                            fa-solid
                            fa-file-pen
                        "
                    ></i>

                    Set Draft

                </button>


                <button
                    type="button"
                    class="success"
                    data-action="open"
                    data-id="${election.id}"
                >

                    <i
                        class="
                            fa-solid
                            fa-play
                        "
                    ></i>

                    Open Voting

                </button>


                <button
                    type="button"
                    class="secondary"
                    data-action="close"
                    data-id="${election.id}"
                >

                    <i
                        class="
                            fa-solid
                            fa-lock
                        "
                    ></i>

                    Close Voting

                </button>


                <a
                    href="results.html?election=${
                        encodeURIComponent(
                            election.id
                        )
                    }"
                    class="secondary"
                >

                    <i
                        class="
                            fa-solid
                            fa-chart-column
                        "
                    ></i>

                    View Results

                </a>


                <button
                    type="button"
                    class="danger"
                    data-action="delete"
                    data-id="${election.id}"
                >

                    <i
                        class="
                            fa-solid
                            fa-trash
                        "
                    ></i>

                    Delete

                </button>


            </div>

        </article>
    `;
}


// =======================================================
// ATTACH ACTION BUTTONS
// =======================================================

function attachButtons() {

    document
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button
                    .addEventListener(
                        "click",
                        async () => {

                            const id =
                                button
                                    .dataset
                                    .id;


                            const action =
                                button
                                    .dataset
                                    .action;


                            if (
                                !id
                                ||
                                !action
                            ) {

                                return;
                            }


                            if (
                                action
                                ===
                                "delete"
                            ) {

                                await deleteElection(
                                    id
                                );

                                return;
                            }


                            let status =
                                "draft";


                            if (
                                action
                                ===
                                "open"
                            ) {

                                status =
                                    "open";
                            }


                            if (
                                action
                                ===
                                "close"
                            ) {

                                status =
                                    "closed";
                            }


                            await updateStatus(
                                id,
                                status
                            );
                        }
                    );
            }
        );
}


// =======================================================
// UPDATE ELECTION STATUS
// =======================================================

async function updateStatus(
    electionId,
    status
) {

    // ---------------------------------------
    // OPEN ELECTION
    // ---------------------------------------

    if (
        status
        ===
        "open"
    ) {

        const confirmed =
            confirm(
                "Open this election for member voting?"
            );


        if (!confirmed) {

            return;
        }


        // Close any other currently open election.

        const {
            error:
                closeError
        } =
            await supabase
                .from(
                    "elections"
                )
                .update({

                    status:
                        "closed"

                })
                .eq(
                    "status",
                    "open"
                )
                .neq(
                    "id",
                    electionId
                );


        if (closeError) {

            console.error(
                "Close existing election error:",
                closeError
            );


            alert(
                closeError.message
            );


            return;
        }
    }


    // ---------------------------------------
    // UPDATE SELECTED ELECTION
    // ---------------------------------------

    const {
        error
    } =
        await supabase
            .from(
                "elections"
            )
            .update({

                status:
                    status

            })
            .eq(
                "id",
                electionId
            );


    if (error) {

        console.error(
            "Update election error:",
            error
        );


        alert(
            error.message
        );


        return;
    }


    await loadElections();
}


// =======================================================
// DELETE ELECTION
// =======================================================

async function deleteElection(
    electionId
) {

    const confirmed =
        confirm(
            "Delete this election? Candidates, eligibility and votes connected to it may also be deleted."
        );


    if (!confirmed) {

        return;
    }


    const {
        error
    } =
        await supabase
            .from(
                "elections"
            )
            .delete()
            .eq(
                "id",
                electionId
            );


    if (error) {

        console.error(
            "Delete election error:",
            error
        );


        alert(
            error.message
        );


        return;
    }


    await loadElections();
}


// =======================================================
// LOGOUT
// =======================================================

function setupLogout() {

    if (!logoutButton) {
        return;
    }


    logoutButton
        .addEventListener(
            "click",
            async () => {

                const confirmed =
                    confirm(
                        "Sign out of the PNGSA Admin Portal?"
                    );


                if (!confirmed) {
                    return;
                }


                const {
                    error
                } =
                    await supabase
                        .auth
                        .signOut();


                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    alert(
                        error.message
                    );


                    return;
                }


                window.location.replace(
                    "../index.html"
                );
            }
        );
}


// =======================================================
// ESCAPE HTML
// =======================================================

function escapeHTML(
    value
) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value
        ??
        "";


    return element.innerHTML;
}