import { supabase }
from "../../js/supabase.js";


// ============================================================
// ELEMENTS
// ============================================================

const groupList =
  document.getElementById("groupList");

const groupSearch =
  document.getElementById("groupSearch");

const groupCount =
  document.getElementById("groupCount");

const sidebarMessageCount =
  document.getElementById("sidebarMessageCount");

const noChatSelected =
  document.getElementById("noChatSelected");

const activeChat =
  document.getElementById("activeChat");

const conversationName =
  document.getElementById("conversationName");

const conversationMemberCount =
  document.getElementById("conversationMemberCount");

const conversationType =
  document.getElementById("conversationType");

const conversationIcon =
  document.getElementById("conversationIcon");

const messageArea =
  document.getElementById("messageArea");

const messageInput =
  document.getElementById("messageInput");

const sendMessageButton =
  document.getElementById("sendMessageButton");

const logoutButton =
  document.getElementById("logoutButton");

const groupInfoButton =
  document.getElementById("groupInfoButton");

const groupModal =
  document.getElementById("groupModal");

const groupModalBackdrop =
  document.getElementById("groupModalBackdrop");

const groupModalClose =
  document.getElementById("groupModalClose");

const groupModalName =
  document.getElementById("groupModalName");

const groupModalDescription =
  document.getElementById("groupModalDescription");

const groupModalType =
  document.getElementById("groupModalType");

const groupModalMemberCount =
  document.getElementById("groupModalMemberCount");

const groupMemberList =
  document.getElementById("groupMemberList");


// ============================================================
// STATE
// ============================================================

let currentUser = null;

let groups = [];

let currentGroup = null;

let currentMessages = [];

let profileCache = {};

let unreadCounts = {};

let messageChannel = null;


// ============================================================
// PROFILE NAME
// ============================================================

function getProfileName(profile) {

  if (!profile) {
    return "PNGSA Member";
  }


  if (
    typeof profile.full_name === "string" &&
    profile.full_name.trim()
  ) {

    return profile.full_name.trim();

  }


  if (
    typeof profile.email === "string" &&
    profile.email.trim()
  ) {

    return profile.email
      .split("@")[0];

  }


  return "PNGSA Member";

}


// ============================================================
// PROFILE INITIALS
// ============================================================

function getInitials(profile) {

  const name =
    getProfileName(profile);


  if (
    !name ||
    name === "PNGSA Member"
  ) {

    return "PN";

  }


  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (!parts.length) {

    return "PN";

  }


  if (parts.length === 1) {

    return parts[0]
      .slice(0, 2)
      .toUpperCase();

  }


  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();

}


// ============================================================
// AUTHENTICATE MEMBER
// ============================================================

async function authenticateMember() {

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


  return true;

}


// ============================================================
// GROUP TYPE
// ============================================================

function formatGroupType(type) {

  const map = {

    general:
      "General",

    executive:
      "Executive",

    private:
      "Private",

    organization:
      "Organization"

  };


  return (
    map[type] ||
    "Group"
  );

}


// ============================================================
// GROUP ICON
// ============================================================

function getGroupIcon(type) {

  const icons = {

    general:
      "fa-users",

    executive:
      "fa-crown",

    private:
      "fa-user-group",

    organization:
      "fa-building-columns"

  };


  return (
    icons[type] ||
    "fa-users"
  );

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
      .from("chat_group_members")
      .select(`
        group_id,
        group_role,
        joined_at,

        chat_groups (
          id,
          name,
          description,
          group_type,
          is_archived,
          created_at
        )
      `)
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(
      "Group load error:",
      error
    );


    if (groupList) {

      groupList.innerHTML =
        `
          <div class="no-groups">
            Unable to load chats.
          </div>
        `;

    }


    return;

  }


  groups =
    (data || [])

      .filter(
        row =>
          row.chat_groups &&
          !row.chat_groups.is_archived
      )

      .map(
        row => ({
          ...row.chat_groups,

          group_role:
            row.group_role
        })
      );


  const order = {

    general: 1,

    executive: 2,

    organization: 3,

    private: 4

  };


  groups.sort(
    (a, b) =>

      (order[a.group_type] || 10) -

      (order[b.group_type] || 10)
  );


  if (groupCount) {

    groupCount.textContent =
      `${groups.length} ${
        groups.length === 1
          ? "group"
          : "groups"
      }`;

  }


  await loadUnreadCounts();


  renderGroups();

}


// ============================================================
// LOAD UNREAD COUNTS
// ============================================================

async function loadUnreadCounts() {

  unreadCounts = {};


  const {
    data: reads,
    error: readsError
  } =
    await supabase
      .from("chat_group_reads")
      .select(`
        group_id,
        last_read_at
      `)
      .eq(
        "user_id",
        currentUser.id
      );


  if (readsError) {

    console.error(
      "Read status error:",
      readsError
    );

  }


  const readMap = {};


  (reads || []).forEach(
    row => {

      readMap[row.group_id] =
        row.last_read_at;

    }
  );


  await Promise.all(

    groups.map(
      async group => {


        let query =
          supabase
            .from("chat_messages")
            .select(
              "id",
              {
                count: "exact",
                head: true
              }
            )
            .eq(
              "group_id",
              group.id
            )
            .neq(
              "sender_id",
              currentUser.id
            );


        const lastRead =
          readMap[group.id];


        if (lastRead) {

          query =
            query.gt(
              "created_at",
              lastRead
            );

        }


        const {
          count,
          error
        } =
          await query;


        if (error) {

          console.error(
            "Unread count error:",
            error
          );

        }


        unreadCounts[group.id] =
          error
            ? 0
            : (count || 0);

      }
    )

  );


  updateTotalUnread();

}


// ============================================================
// TOTAL UNREAD
// ============================================================

function updateTotalUnread() {

  if (!sidebarMessageCount) {
    return;
  }


  const total =
    Object.values(
      unreadCounts
    )
      .reduce(
        (sum, value) =>
          sum + value,
        0
      );


  sidebarMessageCount.textContent =
    total > 99
      ? "99+"
      : String(total);


  sidebarMessageCount.hidden =
    total === 0;

}


// ============================================================
// RENDER GROUPS
// ============================================================

function renderGroups() {

  if (!groupList) {
    return;
  }


  const search =
    groupSearch
      ?.value
      ?.trim()
      ?.toLowerCase() ||
    "";


  const filtered =
    groups.filter(
      group => {

        const text =
          `
            ${group.name || ""}
            ${group.description || ""}
            ${group.group_type || ""}
          `
            .toLowerCase();


        return text.includes(
          search
        );

      }
    );


  if (!filtered.length) {

    groupList.innerHTML =
      `
        <div class="no-groups">
          No chats found.
        </div>
      `;


    return;

  }


  groupList.innerHTML =
    "";


  filtered.forEach(
    group => {


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "group-item";


      if (
        currentGroup &&
        currentGroup.id === group.id
      ) {

        button.classList.add(
          "active"
        );

      }


      button.addEventListener(
        "click",
        () => {

          openGroup(
            group.id
          );

        }
      );


      const avatar =
        document.createElement(
          "div"
        );


      avatar.className =
        `group-avatar ${
          group.group_type
        }`;


      const icon =
        document.createElement(
          "i"
        );


      icon.className =
        `fa-solid ${
          getGroupIcon(
            group.group_type
          )
        }`;


      avatar.appendChild(
        icon
      );


      const content =
        document.createElement(
          "div"
        );


      content.className =
        "group-item-content";


      const nameRow =
        document.createElement(
          "div"
        );


      nameRow.className =
        "group-name-row";


      const name =
        document.createElement(
          "span"
        );


      name.className =
        "group-name";


      name.textContent =
        group.name;


      nameRow.appendChild(
        name
      );


      const unread =
        unreadCounts[group.id] ||
        0;


      if (unread > 0) {

        const badge =
          document.createElement(
            "span"
          );


        badge.className =
          "group-unread";


        badge.textContent =
          unread > 99
            ? "99+"
            : String(unread);


        nameRow.appendChild(
          badge
        );

      }


      const description =
        document.createElement(
          "div"
        );


      description.className =
        "group-description";


      description.textContent =
        group.description ||
        formatGroupType(
          group.group_type
        );


      content.appendChild(
        nameRow
      );


      content.appendChild(
        description
      );


      button.appendChild(
        avatar
      );


      button.appendChild(
        content
      );


      groupList.appendChild(
        button
      );

    }
  );

}


// ============================================================
// OPEN GROUP
// ============================================================

async function openGroup(groupId) {

  const group =
    groups.find(
      item =>
        item.id === groupId
    );


  if (!group) {
    return;
  }


  currentGroup =
    group;


  if (noChatSelected) {

    noChatSelected.hidden =
      true;

  }


  if (activeChat) {

    activeChat.hidden =
      false;

  }


  if (conversationName) {

    conversationName.textContent =
      group.name;

  }


  if (conversationType) {

    conversationType.textContent =
      formatGroupType(
        group.group_type
      );

  }


  if (conversationIcon) {

    conversationIcon.className =
      `fa-solid ${
        getGroupIcon(
          group.group_type
        )
      }`;

  }


  renderGroups();


  await loadGroupMemberCount();


  await loadMessages();


  await markGroupRead();


  subscribeToGroup();

}


// ============================================================
// GROUP MEMBER COUNT
// ============================================================

async function loadGroupMemberCount() {

  if (
    !currentGroup ||
    !conversationMemberCount
  ) {

    return;

  }


  const {
    count,
    error
  } =
    await supabase
      .from("chat_group_members")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "group_id",
        currentGroup.id
      );


  if (error) {

    console.error(
      "Member count error:",
      error
    );

  }


  const total =
    count || 0;


  conversationMemberCount.textContent =
    `${total} ${
      total === 1
        ? "member"
        : "members"
    }`;

}


// ============================================================
// LOAD CHAT MEMBER PROFILES
//
// This uses the secure RPC:
// public.get_chat_member_profiles(uuid[])
//
// It returns only:
// id
// full_name
// email
// avatar_url
// ============================================================

async function loadProfiles(userIds) {

  const ids =
    [
      ...new Set(
        userIds.filter(Boolean)
      )
    ];


  const missing =
    ids.filter(
      id =>
        !profileCache[id]
    );


  if (!missing.length) {
    return;
  }


  const {
    data,
    error
  } =
    await supabase.rpc(
      "get_chat_member_profiles",
      {
        user_ids:
          missing
      }
    );


  if (error) {

    console.error(
      "Chat profile load error:",
      error
    );


    return;

  }


  console.log(
    "Chat profiles returned:",
    data
  );


  (data || []).forEach(
    profile => {

      profileCache[
        profile.id
      ] = profile;

    }
  );


  missing.forEach(
    id => {

      if (!profileCache[id]) {

        console.warn(
          "No chat profile returned for user:",
          id
        );

      }

    }
  );

}


// ============================================================
// LOAD MESSAGES
// ============================================================

async function loadMessages() {

  if (
    !currentGroup ||
    !messageArea
  ) {

    return;

  }


  messageArea.innerHTML =
    `
      <div class="messages-loading">

        <i class="fa-solid fa-spinner fa-spin"></i>

        Loading messages...

      </div>
    `;


  const {
    data,
    error
  } =
    await supabase
      .from("chat_messages")
      .select("*")
      .eq(
        "group_id",
        currentGroup.id
      )
      .is(
        "deleted_at",
        null
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      )
      .limit(300);


  if (error) {

    console.error(
      "Message load error:",
      error
    );


    messageArea.innerHTML =
      `
        <div class="no-messages">
          Unable to load messages.
        </div>
      `;


    return;

  }


  currentMessages =
    data || [];


  await loadProfiles(
    currentMessages.map(
      message =>
        message.sender_id
    )
  );


  renderMessages();

}


// ============================================================
// RENDER MESSAGES
// ============================================================

function renderMessages() {

  if (!messageArea) {
    return;
  }


  messageArea.innerHTML =
    "";


  if (!currentMessages.length) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "no-messages";


    empty.innerHTML =
      `
        <i class="fa-regular fa-comments"></i>

        <br><br>

        No messages yet.

        <br>

        Start the conversation.
      `;


    messageArea.appendChild(
      empty
    );


    return;

  }


  currentMessages.forEach(
    message => {

      appendMessageElement(
        message
      );

    }
  );


  scrollToBottom();

}


// ============================================================
// APPEND MESSAGE
// ============================================================

function appendMessageElement(
  message
) {

  if (!messageArea) {
    return;
  }


  if (
    document.getElementById(
      `message-${message.id}`
    )
  ) {

    return;

  }


  const own =
    message.sender_id ===
    currentUser.id;


  const profile =
    profileCache[
      message.sender_id
    ];


  const row =
    document.createElement(
      "div"
    );


  row.className =
    `message-row ${
      own
        ? "own"
        : ""
    }`;


  row.id =
    `message-${message.id}`;


  // ----------------------------------------------------------
  // AVATAR
  // ----------------------------------------------------------

  const avatar =
    document.createElement(
      "div"
    );


  avatar.className =
    "message-profile-avatar";


  avatar.textContent =
    getInitials(
      profile
    );


  // ----------------------------------------------------------
  // MESSAGE WRAPPER
  // ----------------------------------------------------------

  const wrap =
    document.createElement(
      "div"
    );


  wrap.className =
    "message-content-wrap";


  // ----------------------------------------------------------
  // SENDER
  // ----------------------------------------------------------

  const sender =
    document.createElement(
      "div"
    );


  sender.className =
    "message-sender";


  sender.textContent =
    own
      ? "You"
      : getProfileName(
          profile
        );


  // ----------------------------------------------------------
  // BUBBLE
  // ----------------------------------------------------------

  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "message-bubble";


  bubble.textContent =
    message.message;


  // ----------------------------------------------------------
  // TIME
  // ----------------------------------------------------------

  const time =
    document.createElement(
      "div"
    );


  time.className =
    "message-time";


  time.textContent =
    formatMessageTime(
      message.created_at
    );


  wrap.appendChild(
    sender
  );


  wrap.appendChild(
    bubble
  );


  wrap.appendChild(
    time
  );


  if (!own) {

    row.appendChild(
      avatar
    );

  }


  row.appendChild(
    wrap
  );


  messageArea.appendChild(
    row
  );

}


// ============================================================
// FORMAT MESSAGE TIME
// ============================================================

function formatMessageTime(value) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  const today =
    new Date();


  const sameDay =
    date.toDateString() ===
    today.toDateString();


  if (sameDay) {

    return date.toLocaleTimeString(
      [],
      {
        hour:
          "numeric",

        minute:
          "2-digit"
      }
    );

  }


  return date.toLocaleString(
    [],
    {
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


// ============================================================
// SCROLL TO BOTTOM
// ============================================================

function scrollToBottom() {

  if (!messageArea) {
    return;
  }


  requestAnimationFrame(
    () => {

      messageArea.scrollTop =
        messageArea.scrollHeight;

    }
  );

}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

  if (
    !currentGroup ||
    !messageInput ||
    !sendMessageButton
  ) {

    return;

  }


  const message =
    messageInput
      .value
      .trim();


  if (!message) {
    return;
  }


  if (
    message.length >
    5000
  ) {

    alert(
      "Message is too long."
    );


    return;

  }


  sendMessageButton.disabled =
    true;


  const {
    error
  } =
    await supabase
      .from("chat_messages")
      .insert({

        group_id:
          currentGroup.id,

        sender_id:
          currentUser.id,

        message:
          message

      });


  sendMessageButton.disabled =
    false;


  if (error) {

    console.error(
      "Send message error:",
      error
    );


    alert(
      "Unable to send message."
    );


    return;

  }


  messageInput.value =
    "";


  resizeMessageBox();

}


// ============================================================
// REALTIME
// ============================================================

function subscribeToGroup() {

  if (messageChannel) {

    supabase.removeChannel(
      messageChannel
    );


    messageChannel =
      null;

  }


  if (!currentGroup) {
    return;
  }


  messageChannel =
    supabase
      .channel(
        `chat-${currentGroup.id}`
      )
      .on(
        "postgres_changes",
        {

          event:
            "INSERT",

          schema:
            "public",

          table:
            "chat_messages",

          filter:
            `group_id=eq.${currentGroup.id}`

        },

        async payload => {


          const message =
            payload.new;


          await loadProfiles(
            [
              message.sender_id
            ]
          );


          const alreadyExists =
            currentMessages.some(
              item =>
                item.id ===
                message.id
            );


          if (!alreadyExists) {

            currentMessages.push(
              message
            );

          }


          appendMessageElement(
            message
          );


          scrollToBottom();


          if (
            message.sender_id !==
            currentUser.id
          ) {

            await markGroupRead();

          }

        }
      )
      .subscribe(
        status => {

          console.log(
            "Realtime chat status:",
            status
          );

        }
      );

}


// ============================================================
// MARK GROUP READ
// ============================================================

async function markGroupRead() {

  if (!currentGroup) {
    return;
  }


  const now =
    new Date()
      .toISOString();


  const {
    error
  } =
    await supabase
      .from("chat_group_reads")
      .upsert(
        {

          group_id:
            currentGroup.id,

          user_id:
            currentUser.id,

          last_read_at:
            now

        },
        {

          onConflict:
            "group_id,user_id"

        }
      );


  if (error) {

    console.error(
      "Read update error:",
      error
    );


    return;

  }


  unreadCounts[
    currentGroup.id
  ] = 0;


  updateTotalUnread();


  renderGroups();

}


// ============================================================
// OPEN GROUP INFORMATION
// ============================================================

async function openGroupInformation() {

  if (
    !currentGroup ||
    !groupModal
  ) {

    return;

  }


  if (groupModalName) {

    groupModalName.textContent =
      currentGroup.name;

  }


  if (groupModalDescription) {

    groupModalDescription.textContent =
      currentGroup.description ||
      "No group description.";

  }


  if (groupModalType) {

    groupModalType.textContent =
      formatGroupType(
        currentGroup.group_type
      );

  }


  if (groupMemberList) {

    groupMemberList.innerHTML =
      `
        <div class="group-loading">

          <i class="fa-solid fa-spinner fa-spin"></i>

          Loading members...

        </div>
      `;

  }


  const {
    data,
    error
  } =
    await supabase
      .from("chat_group_members")
      .select(`
        id,
        group_id,
        user_id,
        group_role,
        joined_at
      `)
      .eq(
        "group_id",
        currentGroup.id
      )
      .order(
        "joined_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Group member load error:",
      error
    );


    if (groupMemberList) {

      groupMemberList.innerHTML =
        `
          <div class="group-loading">
            Unable to load group members.
          </div>
        `;

    }


    return;

  }


  const memberships =
    data || [];


  await loadProfiles(
    memberships.map(
      membership =>
        membership.user_id
    )
  );


  if (groupModalMemberCount) {

    groupModalMemberCount.textContent =
      memberships.length;

  }


  if (groupMemberList) {

    groupMemberList.innerHTML =
      "";

  }


  memberships.forEach(
    membership => {


      const profile =
        profileCache[
          membership.user_id
        ];


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "group-member-item";


      // --------------------------------------------------------
      // AVATAR
      // --------------------------------------------------------

      const avatar =
        document.createElement(
          "div"
        );


      avatar.className =
        "group-member-avatar";


      avatar.textContent =
        getInitials(
          profile
        );


      // --------------------------------------------------------
      // INFO
      // --------------------------------------------------------

      const info =
        document.createElement(
          "div"
        );


      info.className =
        "group-member-info";


      const name =
        document.createElement(
          "strong"
        );


      const profileName =
        getProfileName(
          profile
        );


      name.textContent =
        membership.user_id ===
        currentUser.id

          ? `${profileName} (You)`

          : profileName;


      const subtitle =
        document.createElement(
          "span"
        );


      subtitle.textContent =
        profile?.email ||
        "PNGSA Member";


      // --------------------------------------------------------
      // ROLE
      // --------------------------------------------------------

      const role =
        document.createElement(
          "span"
        );


      role.className =
        "member-role-badge";


      role.textContent =
        membership.group_role;


      info.appendChild(
        name
      );


      info.appendChild(
        subtitle
      );


      row.appendChild(
        avatar
      );


      row.appendChild(
        info
      );


      row.appendChild(
        role
      );


      if (groupMemberList) {

        groupMemberList.appendChild(
          row
        );

      }

    }
  );


  groupModal.classList.add(
    "open"
  );


  groupModal.setAttribute(
    "aria-hidden",
    "false"
  );

}


// ============================================================
// CLOSE GROUP INFORMATION
// ============================================================

function closeGroupInformation() {

  if (!groupModal) {
    return;
  }


  groupModal.classList.remove(
    "open"
  );


  groupModal.setAttribute(
    "aria-hidden",
    "true"
  );

}


// ============================================================
// RESIZE MESSAGE BOX
// ============================================================

function resizeMessageBox() {

  if (!messageInput) {
    return;
  }


  messageInput.style.height =
    "auto";


  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      110
    ) + "px";

}


// ============================================================
// EVENTS
// ============================================================

groupSearch?.addEventListener(
  "input",
  renderGroups
);


sendMessageButton?.addEventListener(
  "click",
  sendMessage
);


messageInput?.addEventListener(
  "input",
  resizeMessageBox
);


messageInput?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();


      sendMessage();

    }

  }
);


groupInfoButton?.addEventListener(
  "click",
  openGroupInformation
);


groupModalClose?.addEventListener(
  "click",
  closeGroupInformation
);


groupModalBackdrop?.addEventListener(
  "click",
  closeGroupInformation
);


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeGroupInformation();

    }

  }
);


// ============================================================
// LOGOUT
// ============================================================

logoutButton?.addEventListener(
  "click",
  async () => {


    if (messageChannel) {

      await supabase.removeChannel(
        messageChannel
      );


      messageChannel =
        null;

    }


    await supabase.auth.signOut();


    window.location.replace(
      "index.html"
    );

  }
);


// ============================================================
// CLEAN UP REALTIME
// ============================================================

window.addEventListener(
  "beforeunload",
  () => {

    if (messageChannel) {

      supabase.removeChannel(
        messageChannel
      );

    }

  }
);


// ============================================================
// INITIALIZE
// ============================================================

async function initializeMessages() {

  const authenticated =
    await authenticateMember();


  if (!authenticated) {
    return;
  }


  await loadGroups();


  if (groups.length) {

    await openGroup(
      groups[0].id
    );

  }

}


// ============================================================
// START
// ============================================================

initializeMessages();