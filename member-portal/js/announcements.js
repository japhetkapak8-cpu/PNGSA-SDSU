import { supabase } from "../../js/supabase.js";


// =====================================================
// SETTINGS
// =====================================================

const STORAGE_BUCKET =
    "announcement-files";


// =====================================================
// ELEMENTS
// =====================================================

const announcementsList =
    document.getElementById(
        "announcementsList"
    );

const announcementCount =
    document.getElementById(
        "announcementCount"
    );

const announcementSearch =
    document.getElementById(
        "announcementSearch"
    );

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const announcementNavBadge =
    document.getElementById(
        "announcementNavBadge"
    );

const announcementModal =
    document.getElementById(
        "announcementModal"
    );

const announcementModalClose =
    document.getElementById(
        "announcementModalClose"
    );

const announcementModalMeta =
    document.getElementById(
        "announcementModalMeta"
    );

const announcementModalTitle =
    document.getElementById(
        "announcementModalTitle"
    );

const announcementModalDate =
    document.getElementById(
        "announcementModalDate"
    );

const announcementModalMessage =
    document.getElementById(
        "announcementModalMessage"
    );

const announcementModalFooter =
    document.getElementById(
        "announcementModalFooter"
    );


// =====================================================
// STATE
// =====================================================

let currentUser = null;

let allAnnouncements = [];

let readAnnouncementIds = [];


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeAnnouncements
);


// =====================================================
// INITIALIZE
// =====================================================

async function initializeAnnouncements() {

    const authenticated =
        await authenticateMember();


    if (!authenticated) {

        return;
    }


    await loadReadAnnouncements();

    await loadAnnouncements();

    setupFilters();

    setupLogout();

    setupAnnouncementModal();
}


// =====================================================
// AUTHENTICATE MEMBER
// =====================================================

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


// =====================================================
// LOAD READ ANNOUNCEMENTS
// =====================================================

async function loadReadAnnouncements() {

    if (!currentUser) {

        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "announcement_reads"
            )
            .select(
                "announcement_id"
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        console.error(
            "Unable to load read announcements:",
            error
        );

        readAnnouncementIds =
            [];

        return;
    }


    readAnnouncementIds =
        (
            data ||
            []
        )
            .map(
                item =>
                    item.announcement_id
            );
}


// =====================================================
// LOAD ANNOUNCEMENTS
// =====================================================

async function loadAnnouncements() {

    showLoading();


    const {
        data,
        error
    } =
        await supabase
            .from(
                "announcements"
            )
            .select(`
                id,
                title,
                content,
                category,
                priority,
                is_pinned,
                published,
                published_at,
                created_at,
                author_name,

                announcement_attachments (
                    id,
                    announcement_id,
                    file_name,
                    file_path,
                    file_type,
                    file_size,
                    created_at
                )
            `)
            .eq(
                "published",
                true
            )
            .order(
                "is_pinned",
                {
                    ascending: false
                }
            )
            .order(
                "published_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Announcement loading error:",
            error
        );

        showError();

        return;
    }


    allAnnouncements =
        data ||
        [];


    updateAnnouncementBadge();


    displayAnnouncements(
        allAnnouncements
    );
}


// =====================================================
// DISPLAY ANNOUNCEMENTS
// =====================================================

function displayAnnouncements(
    announcements
) {

    if (
        !announcements
        ||
        announcements.length === 0
    ) {

        if (announcementCount) {

            announcementCount.textContent =
                "0 announcements";
        }


        if (announcementsList) {

            announcementsList.innerHTML = `

                <div class="announcements-empty">

                    <div class="announcements-empty-icon">

                        <i class="fa-regular fa-bell"></i>

                    </div>

                    <h2>
                        No announcements yet
                    </h2>

                    <p>
                        New PNGSA announcements will appear here
                        when they are published.
                    </p>

                </div>

            `;
        }


        return;
    }


    if (announcementCount) {

        announcementCount.textContent =
            `${announcements.length} ${
                announcements.length === 1
                    ?
                    "announcement"
                    :
                    "announcements"
            }`;
    }


    announcementsList.innerHTML =
        announcements
            .map(
                createAnnouncementCard
            )
            .join("");


    setupAnnouncementCardEvents();
}


// =====================================================
// CREATE ANNOUNCEMENT CARD
// =====================================================

function createAnnouncementCard(
    announcement
) {

    const category =
        announcement.category
        ||
        "general";


    const priority =
        announcement.priority
        ||
        "normal";


    const icon =
        getCategoryIcon(
            category
        );


    const date =
        formatDate(
            announcement.published_at
            ||
            announcement.created_at
        );


    const preview =
        createPreview(
            announcement.content
            ||
            ""
        );


    const author =
        announcement.author_name
        ||
        "PNGSA Executive Team";


    const unread =
        isAnnouncementUnread(
            announcement.id
        );


    const attachmentCount =
        (
            announcement
                .announcement_attachments
            ||
            []
        ).length;


    return `

        <article
            class="
                announcement-card

                ${
                    announcement.is_pinned
                        ?
                        "pinned"
                        :
                        ""
                }

                ${
                    unread
                        ?
                        "unread"
                        :
                        ""
                }
            "

            data-id="${escapeHTML(
                announcement.id
            )}"
        >


            <div class="announcement-card-top">


                <div class="announcement-card-left">


                    <div class="announcement-category-icon">

                        <i class="${icon}"></i>

                    </div>


                    <div class="announcement-content">


                        <div class="announcement-meta">


                            <span class="announcement-category">

                                ${escapeHTML(
                                    formatCategory(
                                        category
                                    )
                                )}

                            </span>


                            ${
                                announcement.is_pinned
                                    ?
                                    `

                                        <span class="pin-badge">

                                            <i class="fa-solid fa-thumbtack"></i>

                                            Pinned

                                        </span>

                                    `
                                    :
                                    ""
                            }


                            <span class="announcement-date">

                                <i class="fa-regular fa-clock"></i>

                                ${escapeHTML(
                                    date
                                )}

                            </span>


                            ${
                                unread
                                    ?
                                    `

                                        <span class="unread-label">
                                            New
                                        </span>

                                    `
                                    :
                                    ""
                            }


                            ${
                                attachmentCount > 0
                                    ?
                                    `

                                        <span class="announcement-attachment-badge">

                                            <i class="fa-solid fa-paperclip"></i>

                                            ${attachmentCount}

                                            ${
                                                attachmentCount === 1
                                                    ?
                                                    "attachment"
                                                    :
                                                    "attachments"
                                            }

                                        </span>

                                    `
                                    :
                                    ""
                            }


                        </div>


                        <h2 class="announcement-title">

                            ${escapeHTML(
                                announcement.title
                                ||
                                ""
                            )}

                        </h2>


                        <p class="announcement-preview">

                            ${escapeHTML(
                                preview
                            )}

                        </p>


                    </div>


                </div>


                ${
                    priority !==
                    "normal"
                        ?
                        `

                            <span
                                class="
                                    priority-badge
                                    priority-${escapeHTML(
                                        priority
                                    )}
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        ${
                                            priority === "urgent"
                                                ?
                                                "fa-circle-exclamation"
                                                :
                                                "fa-star"
                                        }
                                    "
                                ></i>

                                ${escapeHTML(
                                    priority
                                )}

                            </span>

                        `
                        :
                        ""
                }


            </div>


            <div class="announcement-footer">


                <div class="announcement-author">

                    <i class="fa-solid fa-user-shield"></i>

                    Published by

                    <strong>

                        ${escapeHTML(
                            author
                        )}

                    </strong>

                </div>


                <button
                    type="button"
                    class="view-announcement-button"

                    data-view-announcement="${escapeHTML(
                        announcement.id
                    )}"
                >

                    View announcement

                    <i class="fa-solid fa-arrow-right"></i>

                </button>


            </div>


        </article>

    `;
}


// =====================================================
// CARD EVENTS
// =====================================================

function setupAnnouncementCardEvents() {


    document
        .querySelectorAll(
            "[data-view-announcement]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        event.stopPropagation();


                        await openAnnouncement(
                            button.dataset
                                .viewAnnouncement
                        );
                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".announcement-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    async event => {

                        if (
                            event.target.closest(
                                "button"
                            )
                            ||
                            event.target.closest(
                                "a"
                            )
                        ) {

                            return;
                        }


                        await openAnnouncement(
                            card.dataset.id
                        );
                    }
                );

            }
        );
}


// =====================================================
// OPEN FULL ANNOUNCEMENT
// =====================================================

async function openAnnouncement(
    id
) {

    const announcement =
        allAnnouncements.find(
            item =>
                item.id ===
                id
        );


    if (!announcement) {

        return;
    }


    if (
        !announcementModal
        ||
        !announcementModalTitle
        ||
        !announcementModalMessage
        ||
        !announcementModalDate
        ||
        !announcementModalMeta
        ||
        !announcementModalFooter
    ) {

        console.error(
            "Announcement modal elements are missing from announcements.html."
        );

        return;
    }


    announcementModalTitle.textContent =
        announcement.title
        ||
        "";


    const attachmentsHTML =
        await createModalAttachmentsHTML(
            announcement
                .announcement_attachments
            ||
            []
        );


    announcementModalMessage.innerHTML = `

        <div class="announcement-modal-message-text">

            ${
                escapeHTML(
                    announcement.content
                    ||
                    ""
                )
                    .replaceAll(
                        "\n",
                        "<br>"
                    )
            }

        </div>


        ${attachmentsHTML}

    `;


    announcementModalDate.innerHTML = `

        <i class="fa-regular fa-calendar"></i>

        ${escapeHTML(
            formatDate(
                announcement.published_at
                ||
                announcement.created_at
            )
        )}

    `;


    announcementModalMeta.innerHTML = `

        <span class="announcement-modal-category">

            ${escapeHTML(
                formatCategory(
                    announcement.category
                )
            )}

        </span>


        ${
            announcement.priority ===
            "urgent"
                ?
                `

                    <span class="announcement-modal-priority">

                        <i class="fa-solid fa-circle-exclamation"></i>

                        Urgent

                    </span>

                `
                :
                ""
        }


        ${
            announcement.priority ===
            "important"
                ?
                `

                    <span
                        class="
                            announcement-modal-priority
                            important
                        "
                    >

                        <i class="fa-solid fa-star"></i>

                        Important

                    </span>

                `
                :
                ""
        }


        ${
            announcement.is_pinned
                ?
                `

                    <span class="pin-badge">

                        <i class="fa-solid fa-thumbtack"></i>

                        Pinned

                    </span>

                `
                :
                ""
        }

    `;


    announcementModalFooter.innerHTML = `

        <div class="announcement-modal-publisher">

            <i class="fa-solid fa-user-shield"></i>

            <span>
                Published by
            </span>

            <strong>

                ${escapeHTML(
                    announcement.author_name
                    ||
                    "PNGSA Executive Team"
                )}

            </strong>

        </div>


        <button
            type="button"
            class="announcement-modal-close-button"
            id="announcementModalCloseBottom"
        >

            <i class="fa-solid fa-xmark"></i>

            Close

        </button>

    `;


    announcementModal
        .classList
        .add(
            "open"
        );


    announcementModal
        .setAttribute(
            "aria-hidden",
            "false"
        );


    document.body.style.overflow =
        "hidden";


    document
        .getElementById(
            "announcementModalCloseBottom"
        )
        ?.addEventListener(
            "click",
            closeAnnouncementModal
        );


    setupModalAttachmentDownloadButtons();


    await markAnnouncementRead(
        id
    );
}


// =====================================================
// CREATE ATTACHMENTS INSIDE MODAL
// =====================================================

async function createModalAttachmentsHTML(
    attachments
) {

    if (
        !attachments
        ||
        attachments.length === 0
    ) {

        return "";
    }


    const items =
        [];


    for (
        const attachment
        of attachments
    ) {

        if (
            !attachment?.file_path
        ) {

            continue;
        }


        const {
            data,
            error
        } =
            await supabase
                .storage
                .from(
                    STORAGE_BUCKET
                )
                .createSignedUrl(
                    attachment.file_path,
                    60 * 60
                );


        if (
            error
            ||
            !data?.signedUrl
        ) {

            console.error(
                "Unable to create attachment URL:",
                attachment.file_name,
                error
            );


            items.push(`

                <div class="modal-attachment-error">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <span>

                        Unable to open

                        ${escapeHTML(
                            attachment.file_name
                            ||
                            "attachment"
                        )}

                    </span>

                </div>

            `);


            continue;
        }


        const url =
            data.signedUrl;


        const fileName =
            attachment.file_name
            ||
            "Attachment";


        const extension =
            getFileExtension(
                fileName
            );


        const isImage =

            attachment.file_type
                ?.startsWith(
                    "image/"
                )

            ||

            [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp"
            ]
                .includes(
                    extension
                );


        if (isImage) {

            items.push(`

                <div class="modal-attachment-item">


                    <a
                        href="${escapeHTML(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="modal-image-link"
                    >

                        <img
                            src="${escapeHTML(url)}"

                            alt="${escapeHTML(
                                fileName
                            )}"

                            class="modal-attachment-image"

                            loading="lazy"
                        >

                    </a>


                    <div class="modal-attachment-footer">


                        <div class="modal-file-information">

                            <strong>

                                ${escapeHTML(
                                    fileName
                                )}

                            </strong>


                            <span>

                                ${formatAttachmentSize(
                                    attachment.file_size
                                )}

                            </span>

                        </div>


                        <div class="modal-file-buttons">


                            <a
                                href="${escapeHTML(url)}"
                                target="_blank"
                                rel="noopener noreferrer"

                                class="modal-open-attachment"
                            >

                                <i class="fa-solid fa-arrow-up-right-from-square"></i>

                                Open

                            </a>


                            <button
                                type="button"
                                class="modal-download-attachment"

                                data-file-path="${escapeHTML(
                                    attachment.file_path
                                )}"

                                data-file-name="${escapeHTML(
                                    fileName
                                )}"
                            >

                                <i class="fa-solid fa-download"></i>

                                Download

                            </button>


                        </div>


                    </div>


                </div>

            `);

        }

        else {

            items.push(`

                <div class="modal-document-item">


                    <a
                        href="${escapeHTML(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="modal-document-open"
                    >


                        <div class="modal-document-icon">

                            <i
                                class="${getAttachmentIcon(
                                    fileName
                                )}"
                            ></i>

                        </div>


                        <div class="modal-document-details">

                            <strong>

                                ${escapeHTML(
                                    fileName
                                )}

                            </strong>


                            <span>

                                ${formatAttachmentSize(
                                    attachment.file_size
                                )}

                            </span>

                        </div>


                        <i class="fa-solid fa-arrow-up-right-from-square"></i>


                    </a>


                    <button
                        type="button"
                        class="modal-download-attachment"

                        data-file-path="${escapeHTML(
                            attachment.file_path
                        )}"

                        data-file-name="${escapeHTML(
                            fileName
                        )}"
                    >

                        <i class="fa-solid fa-download"></i>

                        Download

                    </button>


                </div>

            `);

        }

    }


    if (
        items.length === 0
    ) {

        return "";
    }


    return `

        <div class="member-announcement-attachments">


            <div class="member-attachments-title">

                <i class="fa-solid fa-paperclip"></i>

                Attachments

            </div>


            ${items.join("")}


        </div>

    `;
}


// =====================================================
// DOWNLOAD BUTTON EVENTS
// =====================================================

function setupModalAttachmentDownloadButtons() {

    announcementModal
        ?.querySelectorAll(
            ".modal-download-attachment"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        event.stopPropagation();


                        const filePath =
                            button.dataset
                                .filePath;


                        const fileName =
                            button.dataset
                                .fileName;


                        if (!filePath) {

                            return;
                        }


                        const originalHTML =
                            button.innerHTML;


                        button.disabled =
                            true;


                        button.innerHTML = `

                            <i class="fa-solid fa-spinner fa-spin"></i>

                            Downloading...

                        `;


                        try {

                            await downloadAttachment(
                                filePath,
                                fileName
                            );

                        }

                        finally {

                            button.disabled =
                                false;


                            button.innerHTML =
                                originalHTML;
                        }
                    }
                );

            }
        );
}


// =====================================================
// DOWNLOAD ATTACHMENT
// =====================================================

async function downloadAttachment(
    filePath,
    fileName
) {

    try {

        const {
            data,
            error
        } =
            await supabase
                .storage
                .from(
                    STORAGE_BUCKET
                )
                .download(
                    filePath
                );


        if (error) {

            throw error;
        }


        if (!data) {

            throw new Error(
                "No file data returned."
            );
        }


        const downloadURL =
            URL.createObjectURL(
                data
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            downloadURL;


        link.download =
            fileName
            ||
            "attachment";


        link.style.display =
            "none";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    downloadURL
                );

            },
            1000
        );

    }

    catch (error) {

        console.error(
            "Attachment download failed:",
            error
        );


        alert(
            `Unable to download attachment.\n\n${
                error?.message
                ||
                ""
            }`
        );
    }
}


// =====================================================
// CLOSE MODAL
// =====================================================

function closeAnnouncementModal() {

    if (!announcementModal) {

        return;
    }


    announcementModal
        .classList
        .remove(
            "open"
        );


    announcementModal
        .setAttribute(
            "aria-hidden",
            "true"
        );


    document.body.style.overflow =
        "";
}


// =====================================================
// MODAL EVENTS
// =====================================================

function setupAnnouncementModal() {


    announcementModalClose
        ?.addEventListener(
            "click",
            closeAnnouncementModal
        );


    announcementModal
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    announcementModal
                ) {

                    closeAnnouncementModal();
                }
            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
                &&
                announcementModal
                    ?.classList
                    .contains(
                        "open"
                    )
            ) {

                closeAnnouncementModal();
            }
        }
    );
}


// =====================================================
// IS UNREAD
// =====================================================

function isAnnouncementUnread(
    id
) {

    return !readAnnouncementIds.includes(
        id
    );
}


// =====================================================
// MARK READ
// =====================================================

async function markAnnouncementRead(
    announcementId
) {

    if (
        !currentUser
        ||
        readAnnouncementIds.includes(
            announcementId
        )
    ) {

        return;
    }


    const {
        error
    } =
        await supabase
            .from(
                "announcement_reads"
            )
            .insert({

                announcement_id:
                    announcementId,

                user_id:
                    currentUser.id

            });


    if (
        error
        &&
        error.code !==
        "23505"
    ) {

        console.error(
            "Unable to mark announcement as read:",
            error
        );

        return;
    }


    if (
        !readAnnouncementIds.includes(
            announcementId
        )
    ) {

        readAnnouncementIds.push(
            announcementId
        );
    }


    updateAnnouncementBadge();

    removeUnreadState(
        announcementId
    );
}


// =====================================================
// REMOVE UNREAD
// =====================================================

function removeUnreadState(
    announcementId
) {

    const card =
        Array
            .from(
                document.querySelectorAll(
                    ".announcement-card"
                )
            )
            .find(
                item =>
                    item.dataset.id ===
                    announcementId
            );


    if (!card) {

        return;
    }


    card.classList.remove(
        "unread"
    );


    card
        .querySelector(
            ".unread-label"
        )
        ?.remove();
}


// =====================================================
// UPDATE SIDEBAR BADGE
// =====================================================

function updateAnnouncementBadge() {

    if (!announcementNavBadge) {

        return;
    }


    const unreadCount =
        allAnnouncements
            .filter(
                announcement =>
                    !readAnnouncementIds
                        .includes(
                            announcement.id
                        )
            )
            .length;


    if (
        unreadCount <= 0
    ) {

        announcementNavBadge.textContent =
            "";


        announcementNavBadge
            .classList
            .add(
                "hidden"
            );


        return;
    }


    announcementNavBadge.textContent =
        unreadCount > 99
            ?
            "99+"
            :
            String(
                unreadCount
            );


    announcementNavBadge
        .classList
        .remove(
            "hidden"
        );
}


// =====================================================
// FILTER EVENTS
// =====================================================

function setupFilters() {

    announcementSearch
        ?.addEventListener(
            "input",
            filterAnnouncements
        );


    categoryFilter
        ?.addEventListener(
            "change",
            filterAnnouncements
        );
}


// =====================================================
// FILTER
// =====================================================

function filterAnnouncements() {

    const search =
        announcementSearch
            ?.value
            .trim()
            .toLowerCase()
        ||
        "";


    const category =
        categoryFilter
            ?.value
        ||
        "all";


    const filtered =
        allAnnouncements
            .filter(
                announcement => {

                    const title =
                        (
                            announcement.title
                            ||
                            ""
                        )
                            .toLowerCase();


                    const content =
                        (
                            announcement.content
                            ||
                            ""
                        )
                            .toLowerCase();


                    const matchesSearch =

                        !search

                        ||

                        title.includes(
                            search
                        )

                        ||

                        content.includes(
                            search
                        );


                    const matchesCategory =

                        category ===
                        "all"

                        ||

                        announcement.category ===
                        category;


                    return (
                        matchesSearch
                        &&
                        matchesCategory
                    );
                }
            );


    displayAnnouncements(
        filtered
    );
}


// =====================================================
// CATEGORY ICON
// =====================================================

function getCategoryIcon(
    category
) {

    const icons = {

        general:
            "fa-solid fa-bullhorn",

        important:
            "fa-solid fa-circle-exclamation",

        event:
            "fa-solid fa-calendar-days",

        meeting:
            "fa-solid fa-users",

        opportunity:
            "fa-solid fa-briefcase",

        deadline:
            "fa-solid fa-clock"

    };


    return (
        icons[
            category
        ]
        ||
        icons.general
    );
}


// =====================================================
// FORMAT CATEGORY
// =====================================================

function formatCategory(
    category
) {

    if (!category) {

        return "General";
    }


    return (
        category
            .charAt(
                0
            )
            .toUpperCase()

        +

        category.slice(
            1
        )
    );
}


// =====================================================
// SHORT PREVIEW
// =====================================================

function createPreview(
    content
) {

    if (!content) {

        return "No message provided.";
    }


    const cleanContent =
        String(
            content
        )
            .replace(
                /<[^>]*>/g,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (!cleanContent) {

        return "No message provided.";
    }


    const maximumLength =
        180;


    if (
        cleanContent.length <=
        maximumLength
    ) {

        return cleanContent;
    }


    return (
        cleanContent.substring(
            0,
            maximumLength
        )
        +
        "..."
    );
}


// =====================================================
// DATE
// =====================================================

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "";
    }


    return new Date(
        dateValue
    )
        .toLocaleDateString(
            "en-US",
            {

                month:
                    "short",

                day:
                    "numeric",

                year:
                    "numeric"

            }
        );
}


// =====================================================
// FILE EXTENSION
// =====================================================

function getFileExtension(
    fileName
) {

    return (
        String(
            fileName
            ||
            ""
        )
            .split(".")
            .pop()
        ||
        ""
    )
        .toLowerCase();
}


// =====================================================
// FILE ICON
// =====================================================

function getAttachmentIcon(
    fileName
) {

    const extension =
        getFileExtension(
            fileName
        );


    switch (extension) {

        case "pdf":

            return "fa-solid fa-file-pdf";


        case "doc":
        case "docx":

            return "fa-solid fa-file-word";


        case "xls":
        case "xlsx":

            return "fa-solid fa-file-excel";


        case "ppt":
        case "pptx":

            return "fa-solid fa-file-powerpoint";


        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
        case "webp":

            return "fa-solid fa-file-image";


        default:

            return "fa-solid fa-file";
    }
}


// =====================================================
// FILE SIZE
// =====================================================

function formatAttachmentSize(
    bytes
) {

    const size =
        Number(
            bytes
        )
        ||
        0;


    if (
        size < 1024
    ) {

        return `${size} B`;
    }


    const kb =
        size /
        1024;


    if (
        kb < 1024
    ) {

        return `${
            kb.toFixed(
                1
            )
        } KB`;
    }


    return `${
        (
            kb /
            1024
        )
            .toFixed(
                1
            )
    } MB`;
}


// =====================================================
// LOADING
// =====================================================

function showLoading() {

    if (!announcementsList) {

        return;
    }


    announcementsList.innerHTML = `

        <div class="announcements-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <p>
                Loading announcements...
            </p>

        </div>

    `;
}


// =====================================================
// ERROR
// =====================================================

function showError() {

    if (announcementCount) {

        announcementCount.textContent =
            "Unable to load";
    }


    if (announcementsList) {

        announcementsList.innerHTML = `

            <div class="announcements-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Unable to load announcements
                </h3>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>

        `;
    }
}


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

    logoutButton
        ?.addEventListener(
            "click",
            async () => {

                await supabase.auth
                    .signOut();


                window.location.replace(
                    "../index.html"
                );
            }
        );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return "";
    }


    return String(
        value
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