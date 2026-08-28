import { supabase }
from "../../js/supabase.js";

import {
    requireAdmin
}
from "./admin-auth.js";


const electionSelect =
    document.getElementById(
        "electionSelect"
    );

const membersList =
    document.getElementById(
        "membersList"
    );

const message =
    document.getElementById(
        "message"
    );


let members = [];

let eligibleIds =
    new Set();


// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {

    const auth =
        await requireAdmin();


    if (!auth) {
        return;
    }


    await loadElections();

    await loadMembers();


    if (electionSelect.value) {

        await loadEligibility();
    }
}


initialize();


// ======================================================
// LOAD ELECTIONS
// ======================================================

async function loadElections() {

    const {
        data,
        error
    } =
        await supabase
            .from("elections")
            .select(`
                id,
                title,
                status
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Election error:",
            error
        );

        message.textContent =
            error.message;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        electionSelect.innerHTML =
            `
            <option value="">
                No elections found
            </option>
            `;

        return;
    }


    electionSelect.innerHTML =
        data.map(
            election => {

                return `
                    <option
                        value="${election.id}"
                    >
                        ${
                            escapeHTML(
                                election.title
                            )
                        }
                        (${election.status})
                    </option>
                `;

            }
        ).join("");
}


// ======================================================
// LOAD MEMBERS
// ======================================================

async function loadMembers() {

    membersList.innerHTML =
        "Loading members...";


    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select("*");


    console.log(
        "Profiles returned:",
        data
    );


    console.log(
        "Profiles error:",
        error
    );


    if (error) {

        console.error(
            "Profile load error:",
            error
        );

        membersList.innerHTML =
            `
            <p>
                Could not load members:
                ${escapeHTML(error.message)}
            </p>
            `;

        return;
    }


    members =
        data || [];


    if (
        members.length === 0
    ) {

        membersList.innerHTML =
            `
            <p>
                No member records were returned
                from the profiles table.
            </p>
            `;

        return;
    }


    renderMembers();
}


// ======================================================
// LOAD ELECTION ELIGIBILITY
// ======================================================

async function loadEligibility() {

    const electionId =
        electionSelect.value;


    if (!electionId) {

        eligibleIds =
            new Set();

        renderMembers();

        return;
    }


    const {
        data,
        error
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


    if (error) {

        console.error(
            "Eligibility error:",
            error
        );

        message.textContent =
            error.message;

        return;
    }


    eligibleIds =
        new Set(
            (data || [])
                .map(
                    row =>
                        row.user_id
                )
        );


    renderMembers();
}


// ======================================================
// RENDER MEMBERS
// ======================================================

function renderMembers() {

    if (
        !members ||
        members.length === 0
    ) {

        membersList.innerHTML =
            `
            <p>
                No profiles found.
            </p>
            `;

        return;
    }


    membersList.innerHTML =
        members.map(
            member => {


                // --------------------------------------
                // NAME
                // Supports several possible field names
                // --------------------------------------

                const firstName =
                    member.first_name
                    ||
                    member.firstname
                    ||
                    "";


                const lastName =
                    member.last_name
                    ||
                    member.lastname
                    ||
                    "";


                let displayName =
                    `${firstName} ${lastName}`
                        .trim();


                if (!displayName) {

                    displayName =
                        member.full_name
                        ||
                        member.name
                        ||
                        member.email
                        ||
                        "PNGSA Member";
                }


                // --------------------------------------
                // EMAIL
                // --------------------------------------

                const email =
                    member.email
                    || "";


                // --------------------------------------
                // ROLE
                // --------------------------------------

                const role =
                    member.role
                    || "member";


                // --------------------------------------
                // CURRENT ELECTION ELIGIBILITY
                // --------------------------------------

                const checked =
                    eligibleIds.has(
                        member.id
                    )
                        ? "checked"
                        : "";


                return `
                    <label
                        class="member-row"
                    >

                        <input
                            type="checkbox"
                            class="voter-checkbox"
                            value="${member.id}"
                            ${checked}
                        >

                        <div>

                            <strong>
                                ${
                                    escapeHTML(
                                        displayName
                                    )
                                }
                            </strong>

                            <br>

                            <span>
                                ${
                                    escapeHTML(
                                        email
                                    )
                                }
                            </span>

                            <br>

                            <small>
                                Role:
                                ${
                                    escapeHTML(
                                        role
                                    )
                                }
                            </small>

                        </div>

                    </label>
                `;

            }
        ).join("");
}


// ======================================================
// CHANGE ELECTION
// ======================================================

electionSelect
    .addEventListener(
        "change",
        async () => {

            message.textContent =
                "";

            await loadEligibility();
        }
    );


// ======================================================
// SELECT ALL
// ======================================================

document
    .getElementById(
        "selectAllBtn"
    )
    .addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".voter-checkbox"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            true;
                    }
                );
        }
    );


// ======================================================
// CLEAR ALL
// ======================================================

document
    .getElementById(
        "clearAllBtn"
    )
    .addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".voter-checkbox"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            false;
                    }
                );
        }
    );


// ======================================================
// SAVE ELIGIBLE VOTERS
// ======================================================

document
    .getElementById(
        "saveBtn"
    )
    .addEventListener(
        "click",
        saveEligibleVoters
    );


async function saveEligibleVoters() {

    const electionId =
        electionSelect.value;


    if (!electionId) {

        alert(
            "Select an election first."
        );

        return;
    }


    const checkboxes =
        document.querySelectorAll(
            ".voter-checkbox:checked"
        );


    const selectedUserIds =
        Array.from(
            checkboxes
        ).map(
            checkbox =>
                checkbox.value
        );


    console.log(
        "Selected voter IDs:",
        selectedUserIds
    );


    message.textContent =
        "Saving eligible voters...";


    // ==================================================
    // DELETE EXISTING ELIGIBILITY FOR THIS ELECTION
    // ==================================================

    const {
        error: deleteError
    } =
        await supabase
            .from(
                "eligible_voters"
            )
            .delete()
            .eq(
                "election_id",
                electionId
            );


    if (deleteError) {

        console.error(
            deleteError
        );

        message.textContent =
            deleteError.message;

        return;
    }


    // ==================================================
    // INSERT SELECTED MEMBERS
    // ==================================================

    if (
        selectedUserIds.length > 0
    ) {

        const records =
            selectedUserIds.map(
                userId => {

                    return {

                        election_id:
                            electionId,

                        user_id:
                            userId
                    };

                }
            );


        console.log(
            "Records being inserted:",
            records
        );


        const {
            error: insertError
        } =
            await supabase
                .from(
                    "eligible_voters"
                )
                .insert(
                    records
                );


        if (insertError) {

            console.error(
                insertError
            );

            message.textContent =
                insertError.message;

            return;
        }
    }


    message.textContent =
        `Saved ${selectedUserIds.length} eligible voter(s).`;


    await loadEligibility();
}


// ======================================================
// ESCAPE HTML
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