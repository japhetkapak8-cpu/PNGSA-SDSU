import { supabase } from "../../js/supabase.js";


// ========================================
// GLOBAL DATA
// ========================================

let allMembers = [];


// ========================================
// DOM ELEMENTS
// ========================================

const tableBody =
  document.getElementById("membersTableBody");

const memberSearch =
  document.getElementById("memberSearch");

const logoutButton =
  document.getElementById("logoutButton");

const exportCsvButton =
  document.getElementById("exportCsvButton");

const exportPdfButton =
  document.getElementById("exportPdfButton");

const memberModal =
  document.getElementById("memberModal");

const memberModalOverlay =
  document.getElementById("memberModalOverlay");

const closeMemberModal =
  document.getElementById("closeMemberModal");

const memberDetailsContent =
  document.getElementById("memberDetailsContent");


// ========================================
// CHECK ADMIN
// ========================================

async function checkAdmin() {

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();


  if (sessionError || !session) {

    window.location.replace("index.html");

    return false;
  }


  const {
    data: profile,
    error
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();


  if (
    error ||
    !profile ||
    profile.role !== "admin"
  ) {

    console.error(
      "Admin authorization failed:",
      error
    );

    await supabase.auth.signOut();

    window.location.replace("index.html");

    return false;
  }


  const adminEmail =
    document.getElementById("adminEmail");


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

  try {

    /*
      Using select("*") here intentionally.

      This lets the admin page receive all profile
      columns that currently exist in Supabase.

      Later you can change this to an explicit
      column list if desired.
    */

    const {
      data,
      error
    } = await supabase
      .from("profiles")
      .select("*")
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

    displayMembers(allMembers);

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

            <i class="fa-solid fa-triangle-exclamation"></i>

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
    document.getElementById("totalMembers");

  const eligibleMembers =
    document.getElementById("eligibleMembers");

  const adminCount =
    document.getElementById("adminCount");


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

  if (!tableBody) {

    console.error(
      "membersTableBody was not found."
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


  members.forEach(member => {

    const name =
      escapeHTML(
        member.full_name ||
        "Not provided"
      );


    const email =
      escapeHTML(
        member.email ||
        "Not provided"
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


    const role =
      member.role === "admin"
        ? "Admin"
        : "Member";


    const roleClass =
      member.role === "admin"
        ? "admin"
        : "member";


    const voting =
      member.eligible_to_vote === true
        ? "Eligible"
        : "Not Eligible";


    const votingClass =
      member.eligible_to_vote === true
        ? "eligible"
        : "not-eligible";


    // ========================================
    // PROFILE PICTURE
    // ========================================

    let photoHTML = `

      <div class="member-avatar-placeholder">

        <i class="fa-solid fa-user"></i>

      </div>

    `;


    if (member.profile_picture_url) {

      photoHTML = `

        <img
          src="${escapeHTML(member.profile_picture_url)}"
          alt="${name}"
          class="member-table-photo"
          loading="lazy"
        >

      `;

    }


    rows += `

      <tr>

        <td>

          ${photoHTML}

        </td>


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

          <button
            type="button"
            class="view-member-button"
            data-member-id="${escapeHTML(member.id)}"
          >

            <i class="fa-solid fa-eye"></i>

            View

          </button>

        </td>

      </tr>

    `;

  });


  tableBody.innerHTML =
    rows;


  attachViewButtons();

}


// ========================================
// VIEW MEMBER BUTTONS
// ========================================

function attachViewButtons() {

  const buttons =
    document.querySelectorAll(
      ".view-member-button"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      function() {

        const memberId =
          this.dataset.memberId;


        const member =
          allMembers.find(
            item =>
              String(item.id) ===
              String(memberId)
          );


        if (!member) {

          console.error(
            "Member could not be found."
          );

          return;
        }


        showMemberDetails(member);

      }
    );

  });

}


// ========================================
// SHOW FULL MEMBER DETAILS
// ========================================

function showMemberDetails(member) {

  if (
    !memberModal ||
    !memberDetailsContent
  ) {

    return;
  }


  const name =
    escapeHTML(
      member.full_name ||
      "Not provided"
    );


  // ========================================
  // PROFILE PHOTO
  // ========================================

  let profilePhoto = `

    <div class="member-detail-avatar-placeholder">

      <i class="fa-solid fa-user"></i>

    </div>

  `;


  if (member.avatar_url) {

    profilePhoto = `

      <img
        src="${escapeHTML(member.avatar_url)}"
        alt="${name}"
        class="member-detail-photo"
      >

    `;

  }


  // ========================================
  // JOINED DATE
  // ========================================

  const joined =
    formatDate(member.created_at);


  memberDetailsContent.innerHTML = `

    <div class="member-detail-profile">

      ${profilePhoto}

      <div>

        <h2>
          ${name}
        </h2>

        <p>
          ${escapeHTML(
            member.email ||
            "Email not provided"
          )}
        </p>

        <span
          class="member-role ${
            member.role === "admin"
              ? "admin"
              : "member"
          }"
        >
          ${
            member.role === "admin"
              ? "Administrator"
              : "Member"
          }
        </span>

      </div>

    </div>



    <!-- ====================================
         PERSONAL INFORMATION
    ===================================== -->

    <div class="member-detail-section">

      <h3>

        <i class="fa-solid fa-user"></i>

        Personal Information

      </h3>


      <div class="member-details-grid">

        ${detailItem(
          "Full Name",
          member.full_name
        )}

        ${detailItem(
          "Date of Birth",
          formatDate(member.date_of_birth)
        )}

        ${detailItem(
          "Gender",
          member.gender
        )}

        ${detailItem(
          "SDSU Email",
          member.email
        )}

        ${detailItem(
          "Personal Email",
          member.personal_email
        )}

        ${detailItem(
          "Phone Number",
          member.phone_number
        )}

        ${detailItem(
          "PNG Province",
          member.png_province
        )}

        ${detailItem(
          "District",
          member.district
        )}

        ${detailItem(
          "Home Town / Village",
          member.home_town
        )}

        ${detailItem(
          "Living Area",
          member.living_area
        )}

      </div>

    </div>



    <!-- ====================================
         ACADEMIC INFORMATION
    ===================================== -->

    <div class="member-detail-section">

      <h3>

        <i class="fa-solid fa-graduation-cap"></i>

        Academic Information

      </h3>


      <div class="member-details-grid">

        ${detailItem(
          "University",
          member.university
        )}

        ${detailItem(
          "Student ID",
          member.student_id
        )}

        ${detailItem(
          "Major / Program",
          member.major
        )}

        ${detailItem(
          "Minor(s)",
          member.minors
        )}

        ${detailItem(
          "Degree Level",
          member.degree_level
        )}

        ${detailItem(
          "Year of Study",
          member.year_of_study
        )}

        ${detailItem(
          "Expected Graduation",
          member.expected_graduation
        )}

        ${detailItem(
          "Academic Status",
          member.academic_status
        )}

      </div>

    </div>



    <!-- ====================================
         SPONSORSHIP
    ===================================== -->

    <div class="member-detail-section">

      <h3>

        <i class="fa-solid fa-briefcase"></i>

        Sponsorship Information

      </h3>


      <div class="member-details-grid">

        ${detailItem(
          "Currently Sponsored",
          yesNo(member.currently_sponsored)
        )}

        ${detailItem(
          "Sponsorship Type",
          member.sponsorship_type
        )}

        ${detailItem(
          "Sponsor / Organization",
          member.sponsor_name
        )}

        ${detailItem(
          "Scholarship / Program",
          member.sponsorship_program
        )}

        ${detailItem(
          "Sponsorship Start Year",
          member.sponsorship_start_year
        )}

        ${detailItem(
          "Expected End Year",
          member.sponsorship_end_year
        )}

        ${detailItem(
          "Sponsorship Status",
          member.sponsorship_status
        )}

        ${detailItem(
          "Sponsorship Issues",
          member.sponsorship_issues
        )}

      </div>

    </div>



    <!-- ====================================
         CAREER INFORMATION
    ===================================== -->

    <div class="member-detail-section">

      <h3>

        <i class="fa-solid fa-arrow-trend-up"></i>

        Career & Future Plans

      </h3>


      <div class="member-details-grid">

        ${detailItem(
          "Career Interests",
          member.career_interests
        )}

        ${detailItem(
          "Plans to Return to PNG",
          yesNo(member.return_to_png)
        )}

        ${detailItem(
          "Interested in PNG Employment",
          yesNo(member.interested_png_employment)
        )}

        ${detailItem(
          "Interested in Internships",
          yesNo(member.interested_internships)
        )}

        ${detailItem(
          "Career Goals / Notes",
          member.career_notes
        )}

      </div>

    </div>



    <!-- ====================================
         ADMINISTRATION
    ===================================== -->

    <div class="member-detail-section">

      <h3>

        <i class="fa-solid fa-shield-halved"></i>

        PNGSA Administration

      </h3>


      <div class="member-details-grid">

        ${detailItem(
          "Role",
          member.role
        )}

        ${detailItem(
          "Eligible to Vote",
          yesNo(member.eligible_to_vote)
        )}

        ${detailItem(
          "Information Sharing Consent",
          yesNo(member.info_sharing_consent)
        )}

        ${detailItem(
          "Profile Completed",
          yesNo(member.profile_completed)
        )}

        ${detailItem(
          "Member Since",
          joined
        )}

        ${detailItem(
          "Profile Last Updated",
          formatDate(member.profile_updated_at)
        )}

      </div>

    </div>

  `;


  memberModal.hidden =
    false;


  document.body.classList.add(
    "modal-open"
  );

}


// ========================================
// DETAIL ITEM
// ========================================

function detailItem(label, value) {

  const safeValue =
    value !== null &&
    value !== undefined &&
    value !== ""
      ? escapeHTML(value)
      : "Not provided";


  return `

    <div class="member-detail-item">

      <span>
        ${escapeHTML(label)}
      </span>

      <strong>
        ${safeValue}
      </strong>

    </div>

  `;

}


// ========================================
// YES / NO FORMATTER
// ========================================

function yesNo(value) {

  if (value === true) {

    return "Yes";

  }


  if (value === false) {

    return "No";

  }


  return "Not provided";

}


// ========================================
// DATE FORMATTER
// ========================================

function formatDate(value) {

  if (!value) {

    return "Not provided";

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }


  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );

}


// ========================================
// CLOSE MEMBER MODAL
// ========================================

function closeModal() {

  if (!memberModal) {

    return;

  }


  memberModal.hidden =
    true;


  document.body.classList.remove(
    "modal-open"
  );

}


if (closeMemberModal) {

  closeMemberModal.addEventListener(
    "click",
    closeModal
  );

}


if (memberModalOverlay) {

  memberModalOverlay.addEventListener(
    "click",
    closeModal
  );

}


document.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Escape" &&
      memberModal &&
      !memberModal.hidden
    ) {

      closeModal();

    }

  }
);


// ========================================
// SEARCH MEMBERS
// ========================================

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
                member.personal_email,
                member.major,
                member.year_of_study,
                member.living_area,
                member.role,
                member.png_province,
                member.district,
                member.sponsor_name,
                member.sponsorship_program,
                member.career_interests
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
// EXPORT CSV
// ========================================

if (exportCsvButton) {

  exportCsvButton.addEventListener(
    "click",
    exportCSV
  );

}


function exportCSV() {

  if (allMembers.length === 0) {

    alert(
      "There are no members to export."
    );

    return;
  }


  const columns = [

    ["Full Name", "full_name"],
    ["SDSU Email", "email"],
    ["Personal Email", "personal_email"],
    ["Phone Number", "phone_number"],

    ["Date of Birth", "date_of_birth"],
    ["Gender", "gender"],

    ["PNG Province", "png_province"],
    ["District", "district"],
    ["Home Town / Village", "home_town"],
    ["Living Area", "living_area"],

    ["University", "university"],
    ["Student ID", "student_id"],
    ["Major", "major"],
    ["Minor(s)", "minors"],
    ["Degree Level", "degree_level"],
    ["Year of Study", "year_of_study"],
    ["Expected Graduation", "expected_graduation"],
    ["Academic Status", "academic_status"],

    ["Currently Sponsored", "currently_sponsored"],
    ["Sponsorship Type", "sponsorship_type"],
    ["Sponsor", "sponsor_name"],
    ["Sponsorship Program", "sponsorship_program"],
    ["Sponsorship Start Year", "sponsorship_start_year"],
    ["Sponsorship End Year", "sponsorship_end_year"],
    ["Sponsorship Status", "sponsorship_status"],
    ["Sponsorship Issues", "sponsorship_issues"],

    ["Career Interests", "career_interests"],
    ["Return to PNG", "return_to_png"],
    ["PNG Employment Interest", "interested_png_employment"],
    ["Internship Interest", "interested_internships"],
    ["Career Notes", "career_notes"],

    ["Role", "role"],
    ["Eligible to Vote", "eligible_to_vote"],
    ["Information Sharing Consent", "info_sharing_consent"],
    ["Profile Completed", "profile_completed"],
    ["Created", "created_at"],
    ["Last Updated", "profile_updated_at"]

  ];


  const header =
    columns.map(
      column =>
        csvEscape(column[0])
    );


  const rows =
    allMembers.map(member => {

      return columns.map(column => {

        let value =
          member[column[1]];


        if (
          typeof value === "boolean"
        ) {

          value =
            value
              ? "Yes"
              : "No";

        }


        return csvEscape(
          value ?? ""
        );

      });

    });


  const csv =
    [
      header,
      ...rows
    ]
      .map(
        row =>
          row.join(",")
      )
      .join("\n");


  /*
    BOM helps Excel correctly recognize
    the CSV as UTF-8.
  */

  const blob =
    new Blob(
      [
        "\uFEFF",
        csv
      ],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href =
    url;


  link.download =
    `PNGSA_Members_${getTodayString()}.csv`;


  document.body.appendChild(link);

  link.click();

  link.remove();


  URL.revokeObjectURL(url);

}


// ========================================
// CSV ESCAPE
// ========================================

function csvEscape(value) {

  const text =
    String(value ?? "");


  return `"${text.replaceAll(
    '"',
    '""'
  )}"`;

}


// ========================================
// EXPORT PDF
// ========================================

if (exportPdfButton) {

  exportPdfButton.addEventListener(
    "click",
    exportPDF
  );

}


function exportPDF() {

  if (allMembers.length === 0) {

    alert(
      "There are no members to export."
    );

    return;
  }


  /*
    This opens a print-friendly document.

    The browser's print window lets the
    administrator choose "Save as PDF".

    This avoids needing another PDF library.
  */

  const printWindow =
    window.open(
      "",
      "_blank"
    );


  if (!printWindow) {

    alert(
      "Please allow pop-ups to export the PDF."
    );

    return;
  }


  let memberRows = "";


  allMembers.forEach(member => {

    memberRows += `

      <tr>

        <td>
          ${escapeHTML(
            member.full_name ||
            "Not provided"
          )}
        </td>

        <td>
          ${escapeHTML(
            member.email ||
            ""
          )}
        </td>

        <td>
          ${escapeHTML(
            member.major ||
            ""
          )}
        </td>

        <td>
          ${escapeHTML(
            member.year_of_study ||
            ""
          )}
        </td>

        <td>
          ${escapeHTML(
            member.sponsor_name ||
            ""
          )}
        </td>

        <td>
          ${
            member.eligible_to_vote
              ? "Yes"
              : "No"
          }
        </td>

      </tr>

    `;

  });


  printWindow.document.write(`

    <!DOCTYPE html>

    <html lang="en">

    <head>

      <meta charset="UTF-8">

      <title>
        PNGSA Member Directory
      </title>


      <style>

        body {
          font-family:
            Arial,
            sans-serif;

          margin: 35px;

          color: #071b3a;
        }


        .header {
          margin-bottom: 30px;
        }


        h1 {
          margin-bottom: 5px;
        }


        .subtitle {
          color: #555;
        }


        .generated {
          margin-top: 5px;

          color: #777;

          font-size: 13px;
        }


        table {
          width: 100%;

          border-collapse: collapse;

          margin-top: 25px;

          font-size: 11px;
        }


        th,
        td {
          border: 1px solid #d8dee8;

          padding: 8px;

          text-align: left;

          vertical-align: top;
        }


        th {
          background: #eef3f8;
        }


        .summary {
          margin-top: 15px;

          display: flex;

          gap: 30px;
        }


        @media print {

          body {
            margin: 15mm;
          }

        }

      </style>

    </head>


    <body>

      <div class="header">

        <h1>
          PNGSA Member Directory
        </h1>

        <div class="subtitle">
          Papua New Guinea Student Association
          — South Dakota State University
        </div>

        <div class="generated">

          Generated:
          ${escapeHTML(
            new Date().toLocaleString()
          )}

        </div>

      </div>


      <div class="summary">

        <strong>
          Total Members:
          ${allMembers.length}
        </strong>

        <strong>

          Eligible Voters:
          ${
            allMembers.filter(
              member =>
                member.eligible_to_vote
            ).length
          }

        </strong>

      </div>


      <table>

        <thead>

          <tr>

            <th>Name</th>

            <th>Email</th>

            <th>Major</th>

            <th>Year</th>

            <th>Sponsor</th>

            <th>Voting Eligible</th>

          </tr>

        </thead>


        <tbody>

          ${memberRows}

        </tbody>

      </table>


      <script>

        window.onload = function() {

          window.print();

        };

      <\/script>

    </body>

    </html>

  `);


  printWindow.document.close();

}


// ========================================
// DATE FOR FILE NAME
// ========================================

function getTodayString() {

  const date =
    new Date();


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )
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