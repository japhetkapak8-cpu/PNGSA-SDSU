import { supabase }
from "../../js/supabase.js";


// ============================================================
// ELEMENTS
// ============================================================

const groupForm =
  document.getElementById("groupForm");

const groupNameInput =
  document.getElementById("groupName");

const groupTypeInput =
  document.getElementById("groupType");

const groupDescriptionInput =
  document.getElementById("groupDescription");

const createGroupButton =
  document.getElementById("createGroupButton");

const formMessage =
  document.getElementById("formMessage");

const adminGroupList =
  document.getElementById("adminGroupList");

const groupAdminSearch =
  document.getElementById("groupAdminSearch");

const adminEmail =
  document.getElementById("adminEmail");

const logoutButton =
  document.getElementById("logoutButton");


const memberManagerModal =
  document.getElementById("memberManagerModal");

const memberManagerClose =
  document.getElementById("memberManagerClose");

const cancelMemberChanges =
  document.getElementById("cancelMemberChanges");

const managerGroupName =
  document.getElementById("managerGroupName");

const adminMemberList =
  document.getElementById("adminMemberList");

const memberSearch =
  document.getElementById("memberSearch");

const saveMemberChanges =
  document.getElementById("saveMemberChanges");

const managerMessage =
  document.getElementById("managerMessage");


// ============================================================
// STATE
// ============================================================

let currentUser = null;

let groups = [];

let profiles = [];

let memberships = [];

let selectedGroup = null;


// ============================================================
// ADMIN CHECK
// ============================================================

async function authenticateAdmin() {

  const {
    data: { session },
    error
  } =
    await supabase.auth.getSession();


  if (
    error ||
    !session
  ) {

    window.location.replace(
      "index.html"
    );

    return false;

  }


  currentUser =
    session.user;


  adminEmail.textContent =
    currentUser.email ||
    "Admin";


  const {
    data: profile,
    error: profileError
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq(
        "id",
        currentUser.id
      )
      .single();


  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {

    window.location.replace(
      "../member-portal/dashboard.html"
    );

    return false;

  }


  return true;

}


// ============================================================
// PROFILE NAME
// ============================================================

function getProfileName(profile) {

  if (profile.full_name) {
    return profile.full_name;
  }


  const full =
    `${
      profile.first_name || ""
    } ${
      profile.last_name || ""
    }`.trim();


  if (full) {
    return full;
  }


  return (
    profile.name ||
    profile.email ||
    "Member"
  );

}


// ============================================================
// TYPE
// ============================================================

function formatType(type) {

  const types = {

    general:
      "General",

    executive:
      "Executive",

    organization:
      "Organization",

    private:
      "Private"

  };


  return types[type] ||
    "Group";

}


function groupIcon(type) {

  const icons = {

    general:
      "fa-users",

    executive:
      "fa-crown",

    organization:
      "fa-building-columns",

    private:
      "fa-user-group"

  };


  return icons[type] ||
    "fa-users";

}


// ============================================================
// MESSAGES
// ============================================================

function showFormMessage(
  message,
  type
) {

  formMessage.textContent =
    message;


  formMessage.className =
    `form-message ${type}`;

}


function showManagerMessage(
  message,
  type
) {

  managerMessage.textContent =
    message;


  managerMessage.className =
    `manager-message ${type}`;

}


// ============================================================
// LOAD EVERYTHING
// ============================================================

async function loadData() {

  await Promise.all([
    loadGroups(),
    loadProfiles(),
    loadMemberships()
  ]);


  renderGroups();

}


// ============================================================
// LOAD GROUPS
// ============================================================

async function loadGroups() {

  const {
    data,
    error
  } =
    await supabase
      .from("chat_groups")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Group error:",
      error
    );

    return;

  }


  groups =
    data || [];

}


// ============================================================
// LOAD PROFILES
// ============================================================

async function loadProfiles() {

  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select("*");


  if (error) {

    console.error(
      "Profile load error:",
      error
    );

    return;

  }


  profiles =
    data || [];


  profiles.sort(
    (a, b) =>
      getProfileName(a)
        .localeCompare(
          getProfileName(b)
        )
  );

}


// ============================================================
// LOAD MEMBERSHIPS
// ============================================================

async function loadMemberships() {

  const {
    data,
    error
  } =
    await supabase
      .from("chat_group_members")
      .select("*");


  if (error) {

    console.error(
      "Membership load error:",
      error
    );

    return;

  }


  memberships =
    data || [];

}


// ============================================================
// MEMBER COUNT
// ============================================================

function getGroupMemberCount(
  groupId
) {

  return memberships.filter(
    row =>
      row.group_id === groupId
  ).length;

}


// ============================================================
// RENDER GROUPS
// ============================================================

function renderGroups() {

  const search =
    groupAdminSearch
      .value
      .trim()
      .toLowerCase();


  const filtered =
    groups.filter(
      group => {

        const text =
          `
            ${group.name}
            ${group.description || ""}
            ${group.group_type}
          `.toLowerCase();


        return text.includes(
          search
        );

      }
    );


  if (!filtered.length) {

    adminGroupList.innerHTML =
      `
        <div class="empty-state">
          No chat groups found.
        </div>
      `;

    return;

  }


  adminGroupList.innerHTML =
    filtered.map(
      group => {

        const count =
          getGroupMemberCount(
            group.id
          );


        return `
          <article class="admin-group-row">

            <div
              class="admin-group-icon ${
                group.group_type
              }"
            >

              <i
                class="fa-solid ${
                  groupIcon(
                    group.group_type
                  )
                }"
              ></i>

            </div>


            <div class="admin-group-info">

              <h3>
                ${escapeHTML(
                  group.name
                )}
              </h3>

              <p>
                ${escapeHTML(
                  group.description ||
                  "No description"
                )}
              </p>

              <div class="group-badges">

                <span>
                  ${formatType(
                    group.group_type
                  )}
                </span>

                <span>
                  ${count}
                  ${
                    count === 1
                      ? "member"
                      : "members"
                  }
                </span>

                ${
                  group.is_archived

                    ? `
                        <span class="archived">
                          Archived
                        </span>
                      `

                    : ""
                }

              </div>

            </div>


            <div class="group-actions">

              <button
                type="button"
                class="group-action-button manage-members-button"
                data-id="${group.id}"
                title="Manage members"
              >

                <i class="fa-solid fa-user-gear"></i>

              </button>


              <button
                type="button"
                class="group-action-button archive-group-button"
                data-id="${group.id}"
                title="${
                  group.is_archived
                    ? "Restore"
                    : "Archive"
                }"
              >

                <i class="fa-solid ${
                  group.is_archived
                    ? "fa-box-open"
                    : "fa-box-archive"
                }"></i>

              </button>


              <button
                type="button"
                class="group-action-button delete delete-group-button"
                data-id="${group.id}"
                title="Delete"
              >

                <i class="fa-solid fa-trash"></i>

              </button>

            </div>

          </article>
        `;

      }
    )
    .join("");


  attachGroupEvents();

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )

    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ============================================================
// CREATE GROUP
// ============================================================

groupForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const name =
      groupNameInput
        .value
        .trim();


    const description =
      groupDescriptionInput
        .value
        .trim();


    const type =
      groupTypeInput.value;


    if (!name) {
      return;
    }


    createGroupButton.disabled =
      true;


    createGroupButton.innerHTML =
      `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Creating...
      `;


    const {
      error
    } =
      await supabase
        .from("chat_groups")
        .insert({

          name:
            name,

          description:
            description ||
            null,

          group_type:
            type,

          created_by:
            currentUser.id

        });


    createGroupButton.disabled =
      false;


    createGroupButton.innerHTML =
      `
        <i class="fa-solid fa-plus"></i>
        Create Group
      `;


    if (error) {

      console.error(
        "Create group error:",
        error
      );


      showFormMessage(
        error.message,
        "error"
      );

      return;

    }


    groupForm.reset();


    showFormMessage(
      "Group created successfully.",
      "success"
    );


    await loadData();

  }
);


// ============================================================
// OPEN MEMBER MANAGER
// ============================================================

function openMemberManager(
  groupId
) {

  selectedGroup =
    groups.find(
      group =>
        group.id === groupId
    );


  if (!selectedGroup) {
    return;
  }


  managerGroupName.textContent =
    `Manage ${selectedGroup.name}`;


  memberSearch.value =
    "";


  managerMessage.className =
    "manager-message";


  renderMemberManager();


  memberManagerModal.classList.add(
    "open"
  );

}


// ============================================================
// EXISTING MEMBERSHIP
// ============================================================

function getMembership(
  userId
) {

  if (!selectedGroup) {
    return null;
  }


  return memberships.find(
    row =>
      row.group_id ===
        selectedGroup.id

      &&

      row.user_id ===
        userId
  );

}


// ============================================================
// RENDER MEMBER MANAGER
// ============================================================

function renderMemberManager() {

  const search =
    memberSearch
      .value
      .trim()
      .toLowerCase();


  const filtered =
    profiles.filter(
      profile => {

        const text =
          `
            ${getProfileName(profile)}
            ${profile.email || ""}
          `.toLowerCase();


        return text.includes(
          search
        );

      }
    );


  adminMemberList.innerHTML =
    "";


  filtered.forEach(
    profile => {


      const existing =
        getMembership(
          profile.id
        );


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "admin-member-row";


      const checkbox =
        document.createElement(
          "input"
        );


      checkbox.type =
        "checkbox";


      checkbox.className =
        "member-check";


      checkbox.dataset.userId =
        profile.id;


      checkbox.checked =
        Boolean(existing);


      if (
        existing?.group_role ===
        "owner"
      ) {

        checkbox.checked =
          true;


        checkbox.disabled =
          true;

      }


      const info =
        document.createElement(
          "div"
        );


      info.className =
        "admin-member-name";


      const strong =
        document.createElement(
          "strong"
        );


      strong.textContent =
        getProfileName(
          profile
        );


      const small =
        document.createElement(
          "span"
        );


      small.textContent =
        profile.email ||
        "PNGSA Member";


      info.appendChild(
        strong
      );


      info.appendChild(
        small
      );


      const select =
        document.createElement(
          "select"
        );


      select.className =
        "member-role-select";


      select.dataset.userId =
        profile.id;


      const role =
        existing?.group_role ||
        "member";


      if (role === "owner") {

        select.innerHTML =
          `
            <option value="owner">
              Owner
            </option>
          `;


        select.disabled =
          true;

      }

      else {

        select.innerHTML =
          `
            <option value="member">
              Member
            </option>

            <option value="moderator">
              Moderator
            </option>

            <option value="admin">
              Group Admin
            </option>
          `;


        select.value =
          role;

      }


      row.appendChild(
        checkbox
      );


      row.appendChild(
        info
      );


      row.appendChild(
        select
      );


      adminMemberList.appendChild(
        row
      );

    }
  );

}


// ============================================================
// SAVE MEMBERS
// ============================================================

async function saveMembers() {

  if (!selectedGroup) {
    return;
  }


  saveMemberChanges.disabled =
    true;


  saveMemberChanges.innerHTML =
    `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Saving...
    `;


  const checkboxes =
    [
      ...document.querySelectorAll(
        ".member-check"
      )
    ];


  const desired = [];


  checkboxes.forEach(
    checkbox => {

      if (!checkbox.checked) {
        return;
      }


      const userId =
        checkbox.dataset.userId;


      const roleSelect =
        document.querySelector(
          `.member-role-select[data-user-id="${userId}"]`
        );


      desired.push({

        user_id:
          userId,

        group_role:
          roleSelect?.value ||
          "member"

      });

    }
  );


  const existing =
    memberships.filter(
      row =>
        row.group_id ===
        selectedGroup.id
    );


  try {


    const upsertRows =
      desired.map(
        row => ({

          group_id:
            selectedGroup.id,

          user_id:
            row.user_id,

          group_role:
            row.group_role

        })
      );


    if (
      upsertRows.length
    ) {

      const {
        error
      } =
        await supabase
          .from("chat_group_members")
          .upsert(
            upsertRows,
            {
              onConflict:
                "group_id,user_id"
            }
          );


      if (error) {
        throw error;
      }

    }


    const desiredIds =
      new Set(
        desired.map(
          row =>
            row.user_id
        )
      );


    const removeRows =
      existing.filter(
        row =>

          row.group_role !==
            "owner"

          &&

          !desiredIds.has(
            row.user_id
          )
      );


    for (
      const row of removeRows
    ) {

      const {
        error
      } =
        await supabase
          .from("chat_group_members")
          .delete()
          .eq(
            "id",
            row.id
          );


      if (error) {
        throw error;
      }

    }


    showManagerMessage(
      "Group membership updated.",
      "success"
    );


    await loadMemberships();

    renderGroups();

    renderMemberManager();

  }

  catch (error) {

    console.error(
      "Save members error:",
      error
    );


    showManagerMessage(
      error.message ||
      "Unable to update members.",
      "error"
    );

  }

  finally {

    saveMemberChanges.disabled =
      false;


    saveMemberChanges.innerHTML =
      `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Members
      `;

  }

}


// ============================================================
// ARCHIVE
// ============================================================

async function toggleArchive(
  groupId
) {

  const group =
    groups.find(
      item =>
        item.id === groupId
    );


  if (!group) {
    return;
  }


  const {
    error
  } =
    await supabase
      .from("chat_groups")
      .update({

        is_archived:
          !group.is_archived,

        updated_at:
          new Date()
            .toISOString()

      })
      .eq(
        "id",
        groupId
      );


  if (error) {

    alert(
      "Unable to update group."
    );

    return;

  }


  await loadData();

}


// ============================================================
// DELETE GROUP
// ============================================================

async function deleteGroup(
  groupId
) {

  const group =
    groups.find(
      item =>
        item.id === groupId
    );


  if (!group) {
    return;
  }


  const confirmed =
    window.confirm(
      `Delete "${group.name}" and all of its messages? This cannot be undone.`
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } =
    await supabase
      .from("chat_groups")
      .delete()
      .eq(
        "id",
        groupId
      );


  if (error) {

    console.error(
      "Delete group error:",
      error
    );


    alert(
      "Unable to delete group."
    );

    return;

  }


  await loadData();

}


// ============================================================
// GROUP BUTTON EVENTS
// ============================================================

function attachGroupEvents() {

  document
    .querySelectorAll(
      ".manage-members-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openMemberManager(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".archive-group-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            toggleArchive(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".delete-group-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteGroup(
              button.dataset.id
            );

          }
        );

      }
    );

}


// ============================================================
// CLOSE MANAGER
// ============================================================

function closeMemberManager() {

  memberManagerModal.classList.remove(
    "open"
  );


  selectedGroup =
    null;

}


memberManagerClose.addEventListener(
  "click",
  closeMemberManager
);


cancelMemberChanges.addEventListener(
  "click",
  closeMemberManager
);


saveMemberChanges.addEventListener(
  "click",
  saveMembers
);


memberSearch.addEventListener(
  "input",
  renderMemberManager
);


groupAdminSearch.addEventListener(
  "input",
  renderGroups
);


// ============================================================
// LOGOUT
// ============================================================

logoutButton.addEventListener(
  "click",
  async () => {

    await supabase.auth.signOut();


    window.location.replace(
      "index.html"
    );

  }
);


// ============================================================
// START
// ============================================================

async function initializeChatAdmin() {

  const authorized =
    await authenticateAdmin();


  if (!authorized) {
    return;
  }


  await loadData();

}


initializeChatAdmin();