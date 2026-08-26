import { supabase }
from "../../js/supabase.js";


let allMembers = [];


// ========================================
// CHECK ADMIN
// ========================================

async function checkAdmin() {

  const {
    data: { session },
    error: sessionError
  } =
    await supabase.auth.getSession();


  if (
    sessionError ||
    !session
  ) {

    window.location.replace(
      "index.html"
    );

    return false;
  }


  const {
    data: profile,
    error
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq(
        "id",
        session.user.id
      )
      .single();


  if (
    error ||
    !profile ||
    profile.role !== "admin"
  ) {

    console.error(
      "Admin check failed:",
      error
    );


    await supabase.auth.signOut();


    window.location.replace(
      "index.html"
    );


    return false;
  }


  const adminEmail =
    document.getElementById(
      "adminEmail"
    );


  if (adminEmail) {

    adminEmail.textContent =
      session.user.email;

  }


  return true;
}



// ========================================
// LOAD MEMBERS
// ========================================

async function loadMembers() {

  const tableBody =
    document.getElementById(
      "membersTableBody"
    );


  try {

    const {
      data,
      error
    } =
      await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          major,
          year_of_study,
          living_area,
          role,
          eligible_to_vote,
          created_at
        `)
        .order(
          "full_name",
          {
            ascending: true,
            nullsFirst: false
          }
        );


    if (error) {

      throw error;

    }


    allMembers =
      data || [];


    console.log(
      "Members loaded:",
      allMembers
    );


    updateStatistics();


    displayMembers(
      allMembers
    );

  }

  catch (error) {

    console.error(
      "Unable to load members:",
      error
    );


    if (tableBody) {

      tableBody.innerHTML = `

        <tr>

          <td
            colspan="8"
            class="loading-members"
          >
            Unable to load member information.
          </td>

        </tr>

      `;

    }

  }

}



// ========================================
// UPDATE STATISTICS
// ========================================

function updateStatistics() {

  const totalMembers =
    document.getElementById(
      "totalMembers"
    );


  const eligibleMembers =
    document.getElementById(
      "eligibleMembers"
    );


  const adminCount =
    document.getElementById(
      "adminCount"
    );


  if (totalMembers) {

    totalMembers.textContent =
      allMembers.length;

  }


  const eligible =
    allMembers.filter(
      member =>
        member.eligible_to_vote === true
    ).length;


  if (eligibleMembers) {

    eligibleMembers.textContent =
      eligible;

  }


  const admins =
    allMembers.filter(
      member =>
        member.role === "admin"
    ).length;


  if (adminCount) {

    adminCount.textContent =
      admins;

  }

}



// ========================================
// DISPLAY MEMBERS
// ========================================

function displayMembers(members) {

  const tableBody =
    document.getElementById(
      "membersTableBody"
    );


  if (!tableBody) {

    console.error(
      "membersTableBody not found"
    );

    return;
  }


  if (
    !members ||
    members.length === 0
  ) {

    tableBody.innerHTML = `

      <tr>

        <td
          colspan="8"
          class="loading-members"
        >
          No members found.
        </td>

      </tr>

    `;

    return;
  }


  let rows = "";


  members.forEach(
    member => {

      const name =
        escapeHTML(
          member.full_name ||
          "Not provided"
        );


      const email =
        escapeHTML(
          member.email ||
          "—"
        );


      const major =
        escapeHTML(
          member.major ||
          "Not provided"
        );


      const year =
        escapeHTML(
          member.year_of_study ||
          "Not provided"
        );


      const livingArea =
        escapeHTML(
          member.living_area ||
          "Not provided"
        );


      const role =
        member.role === "admin"
          ? "Admin"
          : "Member";


      const roleClass =
        member.role === "admin"
          ? "admin"
          : "member";


      const voting =
        member.eligible_to_vote
          ? "Eligible"
          : "Not Eligible";


      const votingClass =
        member.eligible_to_vote
          ? "eligible"
          : "not-eligible";


      const joined =
        member.created_at
          ? new Date(
              member.created_at
            ).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "short",
                day: "numeric"
              }
            )
          : "—";


      rows += `

        <tr>

          <td>
            <strong>
              ${name}
            </strong>
          </td>

          <td>
            ${email}
          </td>

          <td>
            ${major}
          </td>

          <td>
            ${year}
          </td>

          <td>
            ${livingArea}
          </td>

          <td>

            <span
              class="member-role ${roleClass}"
            >
              ${role}
            </span>

          </td>

          <td>

            <span
              class="voter-status ${votingClass}"
            >
              ${voting}
            </span>

          </td>

          <td>
            ${joined}
          </td>

        </tr>

      `;

    }
  );


  tableBody.innerHTML =
    rows;

}



// ========================================
// SEARCH MEMBERS
// ========================================

const memberSearch =
  document.getElementById(
    "memberSearch"
  );


if (memberSearch) {

  memberSearch.addEventListener(
    "input",
    function() {

      const search =
        this.value
          .toLowerCase()
          .trim();


      const filteredMembers =
        allMembers.filter(
          member => {

            const searchable =
              [
                member.full_name,
                member.email,
                member.major,
                member.year_of_study,
                member.living_area,
                member.role
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchable.includes(
              search
            );

          }
        );


      displayMembers(
        filteredMembers
      );

    }
  );

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

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async function() {

      await supabase.auth.signOut();


      window.location.replace(
        "index.html"
      );

    }
  );

}



// ========================================
// START PAGE
// ========================================

async function initialize() {

  const authorized =
    await checkAdmin();


  if (!authorized) {

    return;

  }


  await loadMembers();

}


initialize();