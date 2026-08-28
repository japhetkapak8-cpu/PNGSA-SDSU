import { supabase }
from "../../js/supabase.js";

import {
    requireAdmin
}
from "./admin-auth.js";


// ======================================================
// ELEMENTS
// ======================================================

const positionElection =
    document.getElementById(
        "positionElection"
    );

const candidateElection =
    document.getElementById(
        "candidateElection"
    );

const candidatePosition =
    document.getElementById(
        "candidatePosition"
    );

const candidateList =
    document.getElementById(
        "candidateList"
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


    await loadElections();
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
                status,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Election load error:",
            error
        );

        alert(
            error.message
        );

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        positionElection.innerHTML =
            `
            <option value="">
                No election created
            </option>
            `;


        candidateElection.innerHTML =
            `
            <option value="">
                No election created
            </option>
            `;


        candidatePosition.innerHTML =
            `
            <option value="">
                No positions available
            </option>
            `;


        candidateList.innerHTML =
            `
            <div class="candidate-empty">
                Create an election first.
            </div>
            `;


        return;
    }


    const options =
        data.map(
            election => `
                <option
                    value="${election.id}"
                >
                    ${
                        escapeHTML(
                            election.title
                        )
                    }
                    (${escapeHTML(election.status)})
                </option>
            `
        )
        .join("");


    positionElection.innerHTML =
        options;


    candidateElection.innerHTML =
        options;


    // Keep both election dropdowns
    // on the same election initially.

    positionElection.value =
        candidateElection.value;


    await loadPositions();

    await loadCandidates();
}


// ======================================================
// POSITION ELECTION CHANGE
// ======================================================

positionElection.addEventListener(
    "change",
    async () => {

        /*
            When the admin changes the election
            in the Add Position section,
            also switch the candidate section
            to that same election.
        */

        candidateElection.value =
            positionElection.value;


        await loadPositions();

        await loadCandidates();
    }
);


// ======================================================
// CANDIDATE ELECTION CHANGE
// ======================================================

candidateElection.addEventListener(
    "change",
    async () => {

        positionElection.value =
            candidateElection.value;


        await loadPositions();

        await loadCandidates();
    }
);


// ======================================================
// ADD POSITION
// ======================================================

document
    .getElementById(
        "addPositionBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const electionId =
                positionElection.value;


            const positionNameInput =
                document.getElementById(
                    "positionName"
                );


            const positionOrderInput =
                document.getElementById(
                    "positionOrder"
                );


            const name =
                positionNameInput
                    .value
                    .trim();


            const order =
                Number(
                    positionOrderInput.value
                );


            if (!electionId) {

                alert(
                    "Select an election first."
                );

                return;
            }


            if (!name) {

                alert(
                    "Enter a position name."
                );

                return;
            }


            const {
                error
            } =
                await supabase
                    .from(
                        "election_positions"
                    )
                    .insert({

                        election_id:
                            electionId,

                        name:
                            name,

                        display_order:
                            Number.isFinite(order)
                                ? order
                                : 0
                    });


            if (error) {

                console.error(
                    "Position insert error:",
                    error
                );


                if (
                    error.code === "23505"
                ) {

                    alert(
                        "That position already exists for this election."
                    );

                } else {

                    alert(
                        error.message
                    );

                }


                return;
            }


            positionNameInput.value =
                "";


            positionOrderInput.value =
                "0";


            // Make sure candidate section
            // is using the same election.

            candidateElection.value =
                electionId;


            await loadPositions();

            await loadCandidates();


            alert(
                "Position added successfully."
            );
        }
    );


// ======================================================
// LOAD POSITIONS
// ======================================================

async function loadPositions() {

    const electionId =
        candidateElection.value;


    if (!electionId) {

        candidatePosition.innerHTML =
            `
            <option value="">
                No election selected
            </option>
            `;

        return;
    }


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
            )
            .order(
                "name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Position load error:",
            error
        );

        alert(
            error.message
        );

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        candidatePosition.innerHTML =
            `
            <option value="">
                Add a position first
            </option>
            `;

        return;
    }


    candidatePosition.innerHTML =
        data.map(
            position => `
                <option
                    value="${position.id}"
                >
                    ${
                        escapeHTML(
                            position.name
                        )
                    }
                </option>
            `
        )
        .join("");
}


// ======================================================
// ADD CANDIDATE
// ======================================================

document
    .getElementById(
        "addCandidateBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const electionId =
                candidateElection.value;


            const positionId =
                candidatePosition.value;


            const candidateNameInput =
                document.getElementById(
                    "candidateName"
                );


            const candidateBioInput =
                document.getElementById(
                    "candidateBio"
                );


            const candidatePhotoInput =
                document.getElementById(
                    "candidatePhoto"
                );


            const name =
                candidateNameInput
                    .value
                    .trim();


            const bio =
                candidateBioInput
                    .value
                    .trim();


            const photo =
                candidatePhotoInput
                    .value
                    .trim();


            if (!electionId) {

                alert(
                    "Select an election."
                );

                return;
            }


            if (!positionId) {

                alert(
                    "Add or select a position."
                );

                return;
            }


            if (!name) {

                alert(
                    "Enter the candidate name."
                );

                return;
            }


            const {
                error
            } =
                await supabase
                    .from(
                        "candidates"
                    )
                    .insert({

                        election_id:
                            electionId,

                        position_id:
                            positionId,

                        name:
                            name,

                        bio:
                            bio || null,

                        photo_url:
                            photo || null,

                        approved:
                            true
                    });


            if (error) {

                console.error(
                    "Candidate insert error:",
                    error
                );

                alert(
                    error.message
                );

                return;
            }


            candidateNameInput.value =
                "";


            candidateBioInput.value =
                "";


            candidatePhotoInput.value =
                "";


            await loadCandidates();


            alert(
                "Candidate added successfully."
            );
        }
    );


// ======================================================
// LOAD CANDIDATES
// GROUPED BY POSITION
// ======================================================

async function loadCandidates() {

    const electionId =
        candidateElection.value;


    if (!electionId) {

        candidateList.innerHTML =
            `
            <div class="candidate-empty">
                No election selected.
            </div>
            `;

        return;
    }


    candidateList.innerHTML =
        `
        <div class="candidate-empty">
            Loading candidates...
        </div>
        `;


    const {
        data,
        error
    } =
        await supabase
            .from(
                "candidates"
            )
            .select(`
                id,
                name,
                bio,
                photo_url,
                position_id,
                approved,
                created_at,
                election_positions (
                    id,
                    name,
                    display_order
                )
            `)
            .eq(
                "election_id",
                electionId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Candidate load error:",
            error
        );


        candidateList.innerHTML =
            `
            <div class="candidate-empty">
                ${
                    escapeHTML(
                        error.message
                    )
                }
            </div>
            `;


        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        candidateList.innerHTML =
            `
            <div class="candidate-empty">
                No candidates added for this election.
            </div>
            `;

        return;
    }


    // ==================================================
    // GROUP BY POSITION
    // ==================================================

    const groups =
        new Map();


    for (
        const candidate
        of data
    ) {

        const position =
            candidate
                .election_positions;


        const positionId =
            position?.id
            ||
            candidate.position_id
            ||
            "other";


        const positionName =
            position?.name
            ||
            "Other";


        const displayOrder =
            position?.display_order
            ??
            999;


        if (
            !groups.has(
                positionId
            )
        ) {

            groups.set(
                positionId,
                {
                    id:
                        positionId,

                    name:
                        positionName,

                    displayOrder:
                        displayOrder,

                    candidates:
                        []
                }
            );
        }


        groups
            .get(
                positionId
            )
            .candidates
            .push(
                candidate
            );
    }


    // ==================================================
    // SORT POSITION GROUPS
    // ==================================================

    const sortedGroups =
        Array.from(
            groups.values()
        )
        .sort(
            (
                a,
                b
            ) => {

                if (
                    a.displayOrder
                    !==
                    b.displayOrder
                ) {

                    return (
                        a.displayOrder
                        -
                        b.displayOrder
                    );
                }


                return (
                    a.name
                        .localeCompare(
                            b.name
                        )
                );
            }
        );


    // ==================================================
    // RENDER GROUPS
    // ==================================================

    candidateList.innerHTML =
        sortedGroups
            .map(
                group => {

                    const candidateCards =
                        group.candidates
                            .map(
                                candidate => {

                                    const photoHTML =
                                        createCandidatePhoto(
                                            candidate
                                        );


                                    const bio =
                                        candidate.bio
                                        ||
                                        "No biography";


                                    return `
                                        <article
                                            class="
                                                candidate-card
                                            "
                                        >

                                            ${photoHTML}


                                            <div
                                                class="
                                                    candidate-info
                                                "
                                            >

                                                <h3>
                                                    ${
                                                        escapeHTML(
                                                            candidate.name
                                                        )
                                                    }
                                                </h3>


                                                <span
                                                    class="
                                                        candidate-position-badge
                                                    "
                                                >
                                                    ${
                                                        escapeHTML(
                                                            group.name
                                                        )
                                                    }
                                                </span>


                                                <p
                                                    class="
                                                        candidate-bio
                                                    "
                                                >
                                                    ${
                                                        escapeHTML(
                                                            bio
                                                        )
                                                    }
                                                </p>

                                            </div>


                                            <div
                                                class="
                                                    candidate-actions
                                                "
                                            >

                                                <button
                                                    type="button"

                                                    class="
                                                        danger
                                                    "

                                                    data-delete-candidate="
                                                        ${candidate.id}
                                                    "
                                                >
                                                    Delete Candidate
                                                </button>

                                            </div>

                                        </article>
                                    `;

                                }
                            )
                            .join("");


                    return `
                        <section
                            class="
                                position-group
                            "
                        >

                            <div
                                class="
                                    position-header
                                "
                            >

                                <div>

                                    <h2
                                        class="
                                            position-title
                                        "
                                    >
                                        ${
                                            escapeHTML(
                                                group.name
                                            )
                                        }
                                    </h2>


                                    <p
                                        class="
                                            position-count
                                        "
                                    >
                                        ${
                                            group
                                                .candidates
                                                .length
                                        }

                                        ${
                                            group
                                                .candidates
                                                .length
                                            ===
                                            1

                                            ?

                                            "candidate"

                                            :

                                            "candidates"
                                        }
                                    </p>

                                </div>

                            </div>


                            <div
                                class="
                                    candidate-grid
                                "
                            >

                                ${candidateCards}

                            </div>

                        </section>
                    `;

                }
            )
            .join("");


    attachCandidateDeleteButtons();
}


// ======================================================
// CREATE CANDIDATE PHOTO
// ======================================================

function createCandidatePhoto(
    candidate
) {

    if (
        candidate.photo_url
    ) {

        return `
            <div
                class="
                    candidate-photo-wrap
                "
            >

                <img
                    src="${
                        escapeHTML(
                            candidate.photo_url
                        )
                    }"

                    alt="${
                        escapeHTML(
                            candidate.name
                        )
                    }"

                    class="
                        candidate-photo
                    "

                    loading="lazy"

                    onerror="
                        this.parentElement
                            .classList
                            .add(
                                'candidate-photo-placeholder'
                            );

                        this.parentElement
                            .innerHTML =
                            '<span>${
                                escapeHTML(
                                    getInitial(
                                        candidate.name
                                    )
                                )
                            }</span>';
                    "
                >

            </div>
        `;
    }


    return `
        <div
            class="
                candidate-photo-wrap
                candidate-photo-placeholder
            "
        >

            <span>
                ${
                    escapeHTML(
                        getInitial(
                            candidate.name
                        )
                    )
                }
            </span>

        </div>
    `;
}


// ======================================================
// GET INITIAL
// ======================================================

function getInitial(
    name
) {

    if (
        !name ||
        typeof name !== "string"
    ) {

        return "?";
    }


    return (
        name
            .trim()
            .charAt(0)
            .toUpperCase()
        ||
        "?"
    );
}


// ======================================================
// ATTACH DELETE BUTTONS
// ======================================================

function attachCandidateDeleteButtons() {

    document
        .querySelectorAll(
            "[data-delete-candidate]"
        )
        .forEach(
            button => {

                button
                    .addEventListener(
                        "click",
                        async () => {

                            const candidateId =
                                button
                                    .dataset
                                    .deleteCandidate;


                            await deleteCandidate(
                                candidateId
                            );
                        }
                    );

            }
        );
}


// ======================================================
// DELETE CANDIDATE
// ======================================================

async function deleteCandidate(
    candidateId
) {

    if (!candidateId) {
        return;
    }


    const confirmed =
        confirm(
            "Delete this candidate?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabase
            .from(
                "candidates"
            )
            .delete()
            .eq(
                "id",
                candidateId
            );


    if (error) {

        console.error(
            "Candidate delete error:",
            error
        );

        alert(
            error.message
        );

        return;
    }


    await loadCandidates();
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