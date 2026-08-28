import { supabase }
from "../../js/supabase.js";

import {
    requireAdmin
}
from "./admin-auth.js";


// ======================================================
// ELEMENTS
// ======================================================

const adminEmail =
    document.getElementById(
        "adminEmail"
    );

const eligibleCount =
    document.getElementById(
        "eligibleCount"
    );

const voteCount =
    document.getElementById(
        "voteCount"
    );

const candidateCount =
    document.getElementById(
        "candidateCount"
    );

const electionStatus =
    document.getElementById(
        "electionStatus"
    );

const currentElectionName =
    document.getElementById(
        "currentElectionName"
    );

const electionStart =
    document.getElementById(
        "electionStart"
    );

const electionEnd =
    document.getElementById(
        "electionEnd"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {

    const auth =
        await requireAdmin();


    if (!auth) {
        return;
    }


    // ----------------------------------------
    // SHOW ADMIN EMAIL
    // ----------------------------------------

    if (
        adminEmail &&
        auth.user
    ) {

        adminEmail.textContent =
            auth.user.email
            ||
            "Administrator";
    }


    // ----------------------------------------
    // LOAD DASHBOARD
    // ----------------------------------------

    await loadElectionStats();


    // ----------------------------------------
    // LOGOUT
    // ----------------------------------------

    setupLogout();
}


initialize();


// ======================================================
// LOAD ELECTION STATISTICS
// ======================================================

async function loadElectionStats() {

    setLoadingState();


    const {
        data,
        error
    } =
        await supabase
            .rpc(
                "get_admin_election_stats"
            );


    if (error) {

        console.error(
            "Dashboard stats error:",
            error
        );


        showNoElection();

        return;
    }


    // ==================================================
    // RPC CAN RETURN ARRAY OR SINGLE OBJECT
    // ==================================================

    let stats = null;


    if (
        Array.isArray(
            data
        )
    ) {

        if (
            data.length > 0
        ) {

            stats =
                data[0];
        }

    } else if (data) {

        stats =
            data;
    }


    // ==================================================
    // NO ACTIVE ELECTION
    // ==================================================

    if (!stats) {

        showNoElection();

        return;
    }


    // ==================================================
    // SUMMARY COUNTS
    // ==================================================

    setText(
        "eligibleCount",
        stats.eligible_voters
        ?? 0
    );


    setText(
        "voteCount",
        stats.votes_submitted
        ?? 0
    );


    setText(
        "candidateCount",
        stats.candidates
        ?? 0
    );


    // ==================================================
    // ELECTION STATUS
    // ==================================================

    const status =
        String(
            stats.election_status
            ||
            "closed"
        )
        .toLowerCase();


    updateStatus(
        status
    );


    // ==================================================
    // ELECTION NAME
    // ==================================================

    setText(
        "currentElectionName",
        stats.election_title
        ||
        "No election configured"
    );


    // ==================================================
    // NO ELECTION ID
    // ==================================================

    if (
        !stats.election_id
    ) {

        setText(
            "electionStart",
            "—"
        );

        setText(
            "electionEnd",
            "—"
        );

        return;
    }


    // ==================================================
    // GET START AND END DATES
    // ==================================================

    const {
        data: election,
        error: electionError
    } =
        await supabase
            .from(
                "elections"
            )
            .select(`
                id,
                start_at,
                end_at
            `)
            .eq(
                "id",
                stats.election_id
            )
            .maybeSingle();


    if (electionError) {

        console.error(
            "Election date error:",
            electionError
        );


        setText(
            "electionStart",
            "—"
        );


        setText(
            "electionEnd",
            "—"
        );


        return;
    }


    // ==================================================
    // DISPLAY START
    // ==================================================

    if (
        election?.start_at
    ) {

        setText(
            "electionStart",
            formatDateTime(
                election.start_at
            )
        );

    } else {

        setText(
            "electionStart",
            "Not set"
        );
    }


    // ==================================================
    // DISPLAY END
    // ==================================================

    if (
        election?.end_at
    ) {

        setText(
            "electionEnd",
            formatDateTime(
                election.end_at
            )
        );

    } else {

        setText(
            "electionEnd",
            "Not set"
        );
    }
}


// ======================================================
// UPDATE STATUS
// ======================================================

function updateStatus(
    status
) {

    if (!electionStatus) {
        return;
    }


    const normalized =
        String(
            status
            ||
            "closed"
        )
        .toLowerCase();


    // Remove old status classes

    electionStatus.classList.remove(
        "open",
        "closed",
        "draft"
    );


    // Add current status class

    if (
        normalized === "open"
    ) {

        electionStatus.classList.add(
            "open"
        );


        electionStatus.textContent =
            "Open";


    } else if (
        normalized === "draft"
    ) {

        electionStatus.classList.add(
            "draft"
        );


        electionStatus.textContent =
            "Draft";


    } else {

        electionStatus.classList.add(
            "closed"
        );


        electionStatus.textContent =
            "Closed";
    }
}


// ======================================================
// LOADING STATE
// ======================================================

function setLoadingState() {

    setText(
        "eligibleCount",
        "—"
    );


    setText(
        "voteCount",
        "—"
    );


    setText(
        "candidateCount",
        "—"
    );


    setText(
        "currentElectionName",
        "Loading..."
    );


    setText(
        "electionStart",
        "—"
    );


    setText(
        "electionEnd",
        "—"
    );
}


// ======================================================
// NO ELECTION
// ======================================================

function showNoElection() {

    setText(
        "eligibleCount",
        "0"
    );


    setText(
        "voteCount",
        "0"
    );


    setText(
        "candidateCount",
        "0"
    );


    updateStatus(
        "closed"
    );


    setText(
        "currentElectionName",
        "No election configured"
    );


    setText(
        "electionStart",
        "—"
    );


    setText(
        "electionEnd",
        "—"
    );
}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDateTime(
    value
) {

    if (!value) {

        return "—";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }


    return date.toLocaleString(
        undefined,
        {

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }
    );
}


// ======================================================
// SET TEXT
// ======================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.textContent =
            value;
    }
}


// ======================================================
// LOGOUT
// ======================================================

function setupLogout() {

    if (
        !logoutButton
    ) {

        return;
    }


    logoutButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Sign out of the PNGSA Admin Portal?"
                );


            if (
                !confirmed
            ) {

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