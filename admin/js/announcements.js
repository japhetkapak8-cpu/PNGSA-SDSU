import { supabase } from "../../js/supabase.js";
import { requireAdmin } from "./admin-auth.js";


// =====================================================
// SETTINGS
// =====================================================

const STORAGE_BUCKET = "announcement-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024;


// =====================================================
// ELEMENTS
// =====================================================

const form =
    document.getElementById("announcementForm");

const announcementId =
    document.getElementById("announcementId");

const announcementTitle =
    document.getElementById("announcementTitle");

const announcementCategory =
    document.getElementById("announcementCategory");

const announcementPriority =
    document.getElementById("announcementPriority");

const announcementContent =
    document.getElementById("announcementContent");

const authorName =
    document.getElementById("authorName");

const pinAnnouncement =
    document.getElementById("pinAnnouncement");

const saveDraftButton =
    document.getElementById("saveDraftButton");

const publishButton =
    document.getElementById("publishButton");

const cancelEditButton =
    document.getElementById("cancelEditButton");

const formMessage =
    document.getElementById("formMessage");

const formTitle =
    document.getElementById("formTitle");

const announcementsList =
    document.getElementById("announcementsList");

const totalCount =
    document.getElementById("totalCount");

const publishedCount =
    document.getElementById("publishedCount");

const draftCount =
    document.getElementById("draftCount");

const pinnedCount =
    document.getElementById("pinnedCount");

const announcementSearch =
    document.getElementById("announcementSearch");

const statusFilter =
    document.getElementById("statusFilter");

const categoryFilter =
    document.getElementById("categoryFilter");

const characterCount =
    document.getElementById("characterCount");

const logoutButton =
    document.getElementById("logoutButton");

const announcementFiles =
    document.getElementById("announcementFiles");

const selectedFilesContainer =
    document.getElementById("selectedFiles");

const existingAttachmentsContainer =
    document.getElementById("existingAttachments");


// =====================================================
// STATE
// =====================================================

let allAnnouncements = [];

let selectedFiles = [];

let existingAttachments = [];


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);


async function initializePage() {

    const admin =
        await requireAdmin();

    if (!admin) {
        return;
    }

    setupEvents();

    await loadAnnouncements();
}


// =====================================================
// EVENTS
// =====================================================

function setupEvents() {

    form?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveAnnouncement(true);
        }
    );


    saveDraftButton?.addEventListener(
        "click",
        async () => {

            await saveAnnouncement(false);
        }
    );


    cancelEditButton?.addEventListener(
        "click",
        () => {

            resetForm();
        }
    );


    announcementContent?.addEventListener(
        "input",
        () => {

            if (characterCount) {

                characterCount.textContent =
                    announcementContent.value.length;
            }
        }
    );


    announcementFiles?.addEventListener(
        "change",
        handleFileSelection
    );


    announcementSearch?.addEventListener(
        "input",
        filterAnnouncements
    );


    statusFilter?.addEventListener(
        "change",
        filterAnnouncements
    );


    categoryFilter?.addEventListener(
        "change",
        filterAnnouncements
    );


    logoutButton?.addEventListener(
        "click",
        logout
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
            .from("announcements")
            .select(`
                id,
                title,
                content,
                category,
                priority,
                is_pinned,
                published,
                published_at,
                author_name,
                created_at,
                created_by,
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
            .order(
                "is_pinned",
                {
                    ascending: false
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
            "Unable to load announcements:",
            error
        );


        announcementsList.innerHTML = `

            <div class="admin-announcements-empty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <strong>
                    Unable to load announcements.
                </strong>

            </div>

        `;

        return;
    }


    allAnnouncements =
        data || [];


    updateStatistics();


    await displayAnnouncements(
        allAnnouncements
    );
}


// =====================================================
// SAVE ANNOUNCEMENT
// =====================================================

async function saveAnnouncement(
    publish
) {

    clearMessage();


    const title =
        announcementTitle
            .value
            .trim();


    const content =
        announcementContent
            .value
            .trim();


    if (
        !title ||
        !content
    ) {

        showMessage(
            "Please enter a title and announcement message.",
            "error"
        );

        return;
    }


    setButtonsDisabled(true);


    try {

        const {
            data: {
                user
            }
        } =
            await supabase
                .auth
                .getUser();


        if (!user) {

            throw new Error(
                "Your admin session has expired."
            );
        }


        const editingId =
            announcementId
                .value
                .trim();


        const currentAnnouncement =
            editingId
                ?
                allAnnouncements.find(
                    item =>
                        item.id === editingId
                )
                :
                null;


        const payload = {

            title,

            content,

            category:
                announcementCategory.value,

            priority:
                announcementPriority.value,

            is_pinned:
                pinAnnouncement.checked,

            published:
                publish,

            author_name:
                authorName.value.trim()
                ||
                "PNGSA Executive Team",

            created_by:
                currentAnnouncement?.created_by
                ||
                user.id,

            published_at:
                publish
                    ?
                    (
                        currentAnnouncement?.published
                        &&
                        currentAnnouncement?.published_at
                            ?
                            currentAnnouncement.published_at
                            :
                            new Date().toISOString()
                    )
                    :
                    null
        };


        let savedAnnouncement;


        // =============================================
        // UPDATE
        // =============================================

        if (editingId) {

            const {
                data,
                error
            } =
                await supabase
                    .from("announcements")
                    .update(payload)
                    .eq(
                        "id",
                        editingId
                    )
                    .select("id")
                    .single();


            if (error) {
                throw error;
            }


            savedAnnouncement =
                data;
        }


        // =============================================
        // CREATE
        // =============================================

        else {

            const {
                data,
                error
            } =
                await supabase
                    .from("announcements")
                    .insert(payload)
                    .select("id")
                    .single();


            if (error) {
                throw error;
            }


            savedAnnouncement =
                data;
        }


        // =============================================
        // UPLOAD NEW FILES
        // =============================================

        if (
            selectedFiles.length > 0
        ) {

            showMessage(
                `Uploading ${selectedFiles.length} file(s)...`,
                "success"
            );


            await uploadSelectedFiles(
                savedAnnouncement.id
            );
        }


        showMessage(
            publish
                ?
                "Announcement published successfully."
                :
                "Announcement saved as draft.",
            "success"
        );


        resetForm(false);


        await loadAnnouncements();
    }

    catch (error) {

        console.error(
            "Unable to save announcement:",
            error
        );


        showMessage(
            error?.message
            ||
            "Unable to save announcement.",
            "error"
        );
    }

    finally {

        setButtonsDisabled(false);
    }
}


// =====================================================
// FILE SELECTION
// =====================================================

function handleFileSelection(
    event
) {

    const files =
        Array.from(
            event.target.files || []
        );


    for (const file of files) {

        if (
            file.size >
            MAX_FILE_SIZE
        ) {

            alert(
                `${file.name} is larger than 10 MB.`
            );

            continue;
        }


        if (
            !isAllowedFile(file)
        ) {

            alert(
                `${file.name} is not a supported file type.`
            );

            continue;
        }


        const duplicate =
            selectedFiles.some(
                selected =>
                    selected.name === file.name
                    &&
                    selected.size === file.size
            );


        if (!duplicate) {

            selectedFiles.push(file);
        }
    }


    renderSelectedFiles();


    if (announcementFiles) {

        announcementFiles.value = "";
    }
}


// =====================================================
// VALIDATE FILE TYPE
// =====================================================

function isAllowedFile(
    file
) {

    const allowedExtensions = [

        "pdf",

        "doc",
        "docx",

        "xls",
        "xlsx",

        "ppt",
        "pptx",

        "jpg",
        "jpeg",
        "png"

    ];


    return allowedExtensions.includes(
        getExtension(file.name)
    );
}


// =====================================================
// RENDER SELECTED FILES
// =====================================================

function renderSelectedFiles() {

    if (!selectedFilesContainer) {
        return;
    }


    if (
        selectedFiles.length === 0
    ) {

        selectedFilesContainer.innerHTML =
            "";

        return;
    }


    selectedFilesContainer.innerHTML = `

        <div class="attachment-section-title">
            New attachments
        </div>


        ${
            selectedFiles
                .map(
                    (
                        file,
                        index
                    ) => `

                        <div class="selected-file">

                            <div class="selected-file-info">

                                <div class="selected-file-icon">

                                    <i class="${getFileIcon(
                                        file.name
                                    )}"></i>

                                </div>


                                <div>

                                    <span class="selected-file-name">

                                        ${escapeHTML(
                                            file.name
                                        )}

                                    </span>


                                    <span class="selected-file-size">

                                        ${formatFileSize(
                                            file.size
                                        )}

                                    </span>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="remove-selected-file"
                                data-file-index="${index}"
                                title="Remove file"
                            >

                                <i class="fa-solid fa-xmark"></i>

                            </button>

                        </div>

                    `
                )
                .join("")
        }

    `;


    selectedFilesContainer
        .querySelectorAll(
            ".remove-selected-file"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.fileIndex
                            );


                        selectedFiles.splice(
                            index,
                            1
                        );


                        renderSelectedFiles();
                    }
                );
            }
        );
}


// =====================================================
// UPLOAD SELECTED FILES
// =====================================================

async function uploadSelectedFiles(
    savedAnnouncementId
) {

    for (const file of selectedFiles) {

        const safeName =
            sanitizeFileName(
                file.name
            );


        const uniqueName =
            `${
                Date.now()
            }-${
                crypto.randomUUID()
            }-${
                safeName
            }`;


        const filePath =
            `${
                savedAnnouncementId
            }/${
                uniqueName
            }`;


        // =============================================
        // STORAGE UPLOAD
        // =============================================

        const {
            error: uploadError
        } =
            await supabase
                .storage
                .from(
                    STORAGE_BUCKET
                )
                .upload(
                    filePath,
                    file,
                    {

                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type
                            ||
                            undefined
                    }
                );


        if (uploadError) {

            throw new Error(
                `Could not upload ${file.name}: ${uploadError.message}`
            );
        }


        // =============================================
        // SAVE ATTACHMENT DATABASE RECORD
        // =============================================

        const {
            error: attachmentError
        } =
            await supabase
                .from(
                    "announcement_attachments"
                )
                .insert({

                    announcement_id:
                        savedAnnouncementId,

                    file_name:
                        file.name,

                    file_path:
                        filePath,

                    file_type:
                        file.type || null,

                    file_size:
                        file.size
                });


        if (attachmentError) {

            await supabase
                .storage
                .from(
                    STORAGE_BUCKET
                )
                .remove([
                    filePath
                ]);


            throw new Error(
                `Could not save ${file.name}: ${attachmentError.message}`
            );
        }
    }
}


// =====================================================
// DISPLAY ANNOUNCEMENTS
// =====================================================

async function displayAnnouncements(
    announcements
) {

    if (
        !announcements
        ||
        announcements.length === 0
    ) {

        announcementsList.innerHTML = `

            <div class="admin-announcements-empty">

                <i class="fa-regular fa-bell"></i>

                <strong>
                    No announcements found.
                </strong>

                <span>
                    Create your first PNGSA announcement above.
                </span>

            </div>

        `;

        return;
    }


    announcementsList.innerHTML = `

        <div class="announcements-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            Loading announcements...

        </div>

    `;


    const cards = [];


    for (
        const announcement
        of announcements
    ) {

        const attachmentsHTML =
            await createAnnouncementAttachmentsHTML(
                announcement
                    .announcement_attachments
                ||
                []
            );


        cards.push(
            createAnnouncementCard(
                announcement,
                attachmentsHTML
            )
        );
    }


    announcementsList.innerHTML =
        cards.join("");


    setupCardButtons();
}


// =====================================================
// CREATE ATTACHMENTS HTML
// =====================================================

async function createAnnouncementAttachmentsHTML(
    attachments
) {

    if (
        !attachments
        ||
        attachments.length === 0
    ) {

        return "";
    }


    const attachmentCards = [];


    for (
        const attachment
        of attachments
    ) {

        if (
            !attachment.file_path
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

                    // 1 hour
                    60 * 60
                );


        if (
            error
            ||
            !data?.signedUrl
        ) {

            console.error(
                "Could not create signed URL:",
                attachment.file_name,
                error
            );


            attachmentCards.push(`

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        padding:10px 12px;
                        margin-top:10px;
                        border:1px solid #fecaca;
                        border-radius:8px;
                        background:#fff7f7;
                        color:#991b1b;
                    "
                >

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


        const extension =
            getExtension(
                attachment.file_name
                ||
                ""
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
                "png"
            ].includes(
                extension
            );


        // =============================================
        // IMAGE
        // =============================================

        if (isImage) {

            attachmentCards.push(`

                <div
                    class="announcement-image-attachment"
                    style="
                        width:100%;
                        max-width:700px;
                        margin-top:12px;
                    "
                >

                    <a
                        href="${escapeHTML(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                            display:block;
                            text-decoration:none;
                        "
                    >

                        <img
                            src="${escapeHTML(url)}"
                            alt="${escapeHTML(
                                attachment.file_name
                                ||
                                "Announcement image"
                            )}"
                            loading="lazy"
                            style="
                                display:block;
                                width:100%;
                                max-height:500px;
                                object-fit:contain;
                                border:1px solid #dbe4ee;
                                border-radius:10px;
                                background:#f8fafc;
                            "
                        >

                    </a>


                    <div
                        style="
                            display:flex;
                            align-items:center;
                            flex-wrap:wrap;
                            gap:7px;
                            margin-top:7px;
                            color:#64748b;
                            font-size:13px;
                        "
                    >

                        <i class="fa-solid fa-paperclip"></i>


                        <span>

                            ${escapeHTML(
                                attachment.file_name
                                ||
                                "Image"
                            )}

                        </span>


                        <span>

                            ${formatFileSize(
                                attachment.file_size
                            )}

                        </span>

                    </div>

                </div>

            `);
        }


        // =============================================
        // DOCUMENT
        // =============================================

        else {

            attachmentCards.push(`

                <a
                    href="${escapeHTML(url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="announcement-file-attachment"
                    style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        width:fit-content;
                        max-width:100%;
                        margin-top:10px;
                        padding:12px 15px;
                        border:1px solid #dbe4ee;
                        border-radius:9px;
                        background:#f8fafc;
                        color:#0b3563;
                        font-size:14px;
                        font-weight:600;
                        text-decoration:none;
                    "
                >

                    <i class="${getFileIcon(
                        attachment.file_name
                        ||
                        ""
                    )}"></i>


                    <span
                        style="
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        "
                    >

                        ${escapeHTML(
                            attachment.file_name
                            ||
                            "Attachment"
                        )}

                    </span>


                    <span
                        style="
                            color:#64748b;
                            font-size:12px;
                            font-weight:500;
                            white-space:nowrap;
                        "
                    >

                        ${formatFileSize(
                            attachment.file_size
                        )}

                    </span>


                    <i class="fa-solid fa-arrow-up-right-from-square"></i>

                </a>

            `);
        }
    }


    if (
        attachmentCards.length === 0
    ) {

        return "";
    }


    return `

        <div
            class="admin-announcement-attachments"
            style="
                margin-top:18px;
                margin-bottom:18px;
            "
        >

            <div
                style="
                    margin-bottom:8px;
                    color:#475569;
                    font-size:12px;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.03em;
                "
            >

                <i class="fa-solid fa-paperclip"></i>

                Attachments

            </div>


            ${attachmentCards.join("")}

        </div>

    `;
}


// =====================================================
// CREATE ANNOUNCEMENT CARD
// =====================================================

function createAnnouncementCard(
    announcement,
    attachmentsHTML = ""
) {

    const content =
        announcement.content
        ||
        "";


    const preview =
        content.length > 300
            ?
            content.substring(
                0,
                300
            )
            +
            "..."
            :
            content;


    return `

        <article
            class="
                admin-announcement-card

                ${
                    announcement.is_pinned
                        ?
                        "pinned"
                        :
                        ""
                }
            "
        >


            <div class="admin-announcement-meta">


                <span
                    class="
                        announcement-badge

                        ${
                            announcement.published
                                ?
                                "badge-published"
                                :
                                "badge-draft"
                        }
                    "
                >

                    ${
                        announcement.published
                            ?
                            "Published"
                            :
                            "Draft"
                    }

                </span>


                <span
                    class="
                        announcement-badge
                        badge-category
                    "
                >

                    ${escapeHTML(
                        announcement.category
                        ||
                        "general"
                    )}

                </span>


                ${
                    announcement.priority
                    &&
                    announcement.priority !==
                    "normal"
                        ?
                        `

                            <span
                                class="
                                    announcement-badge

                                    ${
                                        announcement.priority ===
                                        "urgent"
                                            ?
                                            "badge-urgent"
                                            :
                                            "badge-important"
                                    }
                                "
                            >

                                ${escapeHTML(
                                    announcement.priority
                                )}

                            </span>

                        `
                        :
                        ""
                }


                ${
                    announcement.is_pinned
                        ?
                        `

                            <span
                                class="
                                    announcement-badge
                                    badge-pinned
                                "
                            >

                                <i class="fa-solid fa-thumbtack"></i>

                                Pinned

                            </span>

                        `
                        :
                        ""
                }


            </div>


            <h3 class="admin-announcement-title">

                ${escapeHTML(
                    announcement.title
                )}

            </h3>


            <p class="admin-announcement-content">

                ${escapeHTML(
                    preview
                )}

            </p>


            ${attachmentsHTML}


            <div class="admin-announcement-footer">


                <div class="admin-announcement-details">


                    <span>

                        <i class="fa-regular fa-calendar"></i>

                        ${formatDate(
                            announcement.created_at
                        )}

                    </span>


                    <span>

                        <i class="fa-solid fa-user-shield"></i>

                        ${escapeHTML(
                            announcement.author_name
                            ||
                            "PNGSA Executive Team"
                        )}

                    </span>


                </div>


                <div class="admin-announcement-actions">


                    <button
                        type="button"
                        class="card-action-button edit"
                        data-action="edit"
                        data-id="${announcement.id}"
                    >

                        <i class="fa-solid fa-pen"></i>

                        Edit

                    </button>


                    <button
                        type="button"
                        class="
                            card-action-button

                            ${
                                announcement.published
                                    ?
                                    "unpublish"
                                    :
                                    "publish"
                            }
                        "
                        data-action="publish"
                        data-id="${announcement.id}"
                    >

                        <i
                            class="
                                fa-solid

                                ${
                                    announcement.published
                                        ?
                                        "fa-eye-slash"
                                        :
                                        "fa-paper-plane"
                                }
                            "
                        ></i>


                        ${
                            announcement.published
                                ?
                                "Unpublish"
                                :
                                "Publish"
                        }

                    </button>


                    <button
                        type="button"
                        class="card-action-button pin"
                        data-action="pin"
                        data-id="${announcement.id}"
                    >

                        <i class="fa-solid fa-thumbtack"></i>


                        ${
                            announcement.is_pinned
                                ?
                                "Unpin"
                                :
                                "Pin"
                        }

                    </button>


                    <button
                        type="button"
                        class="card-action-button delete"
                        data-action="delete"
                        data-id="${announcement.id}"
                    >

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>


                </div>


            </div>


        </article>

    `;
}


// =====================================================
// CARD BUTTON EVENTS
// =====================================================

function setupCardButtons() {

    announcementsList
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.id;


                        const action =
                            button.dataset.action;


                        if (
                            action === "edit"
                        ) {

                            await editAnnouncement(id);
                        }


                        if (
                            action === "publish"
                        ) {

                            await togglePublish(id);
                        }


                        if (
                            action === "pin"
                        ) {

                            await togglePin(id);
                        }


                        if (
                            action === "delete"
                        ) {

                            await deleteAnnouncement(id);
                        }
                    }
                );
            }
        );
}


// =====================================================
// EDIT ANNOUNCEMENT
// =====================================================

async function editAnnouncement(
    id
) {

    const announcement =
        allAnnouncements.find(
            item =>
                item.id === id
        );


    if (!announcement) {
        return;
    }


    announcementId.value =
        announcement.id;


    announcementTitle.value =
        announcement.title
        ||
        "";


    announcementContent.value =
        announcement.content
        ||
        "";


    announcementCategory.value =
        announcement.category
        ||
        "general";


    announcementPriority.value =
        announcement.priority
        ||
        "normal";


    authorName.value =
        announcement.author_name
        ||
        "PNGSA Executive Team";


    pinAnnouncement.checked =
        Boolean(
            announcement.is_pinned
        );


    if (characterCount) {

        characterCount.textContent =
            announcementContent.value.length;
    }


    formTitle.textContent =
        "Edit Announcement";


    cancelEditButton
        ?.classList
        .remove("hidden");


    publishButton.innerHTML = `

        <i class="fa-solid fa-floppy-disk"></i>

        ${
            announcement.published
                ?
                "Update Published Announcement"
                :
                "Publish Announcement"
        }

    `;


    selectedFiles = [];


    renderSelectedFiles();


    await loadExistingAttachments(
        id
    );


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"
    });
}


// =====================================================
// LOAD EXISTING ATTACHMENTS
// =====================================================

async function loadExistingAttachments(
    announcementIdValue
) {

    if (
        !existingAttachmentsContainer
    ) {

        return;
    }


    existingAttachmentsContainer.innerHTML = `

        <div class="attachment-section-title">

            Loading attachments...

        </div>

    `;


    const {
        data,
        error
    } =
        await supabase
            .from(
                "announcement_attachments"
            )
            .select(`
                id,
                announcement_id,
                file_name,
                file_path,
                file_type,
                file_size,
                created_at
            `)
            .eq(
                "announcement_id",
                announcementIdValue
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Unable to load attachments:",
            error
        );


        existingAttachments = [];


        existingAttachmentsContainer.innerHTML = `

            <div class="form-message error">

                Unable to load existing attachments.

            </div>

        `;

        return;
    }


    existingAttachments =
        data || [];


    renderExistingAttachments();
}


// =====================================================
// RENDER EXISTING ATTACHMENTS
// =====================================================

function renderExistingAttachments() {

    if (
        !existingAttachmentsContainer
    ) {

        return;
    }


    if (
        existingAttachments.length === 0
    ) {

        existingAttachmentsContainer.innerHTML =
            "";

        return;
    }


    existingAttachmentsContainer.innerHTML = `

        <div class="attachment-section-title">

            Existing attachments

        </div>


        ${
            existingAttachments
                .map(
                    attachment => `

                        <div class="existing-attachment">


                            <div class="existing-attachment-info">


                                <div class="existing-attachment-icon">

                                    <i class="${getFileIcon(
                                        attachment.file_name
                                    )}"></i>

                                </div>


                                <div>

                                    <span class="existing-attachment-name">

                                        ${escapeHTML(
                                            attachment.file_name
                                        )}

                                    </span>


                                    <span class="existing-attachment-size">

                                        ${formatFileSize(
                                            attachment.file_size
                                        )}

                                    </span>

                                </div>


                            </div>


                            <div class="attachment-actions">


                                <button
                                    type="button"
                                    class="
                                        attachment-action-button
                                        open
                                    "
                                    data-attachment-action="open"
                                    data-attachment-id="${attachment.id}"
                                >

                                    <i class="fa-solid fa-arrow-up-right-from-square"></i>

                                    Open

                                </button>


                                <button
                                    type="button"
                                    class="
                                        attachment-action-button
                                        delete
                                    "
                                    data-attachment-action="delete"
                                    data-attachment-id="${attachment.id}"
                                >

                                    <i class="fa-solid fa-trash"></i>

                                </button>


                            </div>


                        </div>

                    `
                )
                .join("")
        }

    `;


    existingAttachmentsContainer
        .querySelectorAll(
            "[data-attachment-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset
                                .attachmentId;


                        const action =
                            button.dataset
                                .attachmentAction;


                        if (
                            action === "open"
                        ) {

                            await openAttachment(id);
                        }


                        if (
                            action === "delete"
                        ) {

                            await deleteAttachment(id);
                        }
                    }
                );
            }
        );
}


// =====================================================
// OPEN ATTACHMENT
// =====================================================

async function openAttachment(
    attachmentId
) {

    const attachment =
        existingAttachments.find(
            item =>
                item.id === attachmentId
        );


    if (!attachment) {
        return;
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

                // one hour
                60 * 60
            );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    window.open(
        data.signedUrl,
        "_blank"
    );
}


// =====================================================
// DELETE ATTACHMENT
// =====================================================

async function deleteAttachment(
    attachmentId
) {

    const attachment =
        existingAttachments.find(
            item =>
                item.id === attachmentId
        );


    if (!attachment) {
        return;
    }


    const confirmed =
        window.confirm(
            `Remove "${attachment.file_name}"?`
        );


    if (!confirmed) {
        return;
    }


    // =============================================
    // DELETE STORAGE FILE
    // =============================================

    const {
        error: storageError
    } =
        await supabase
            .storage
            .from(
                STORAGE_BUCKET
            )
            .remove([
                attachment.file_path
            ]);


    if (storageError) {

        alert(
            storageError.message
        );

        return;
    }


    // =============================================
    // DELETE DATABASE RECORD
    // =============================================

    const {
        error: databaseError
    } =
        await supabase
            .from(
                "announcement_attachments"
            )
            .delete()
            .eq(
                "id",
                attachment.id
            );


    if (databaseError) {

        alert(
            databaseError.message
        );

        return;
    }


    existingAttachments =
        existingAttachments.filter(
            item =>
                item.id !== attachmentId
        );


    renderExistingAttachments();


    await loadAnnouncements();
}


// =====================================================
// TOGGLE PUBLISH
// =====================================================

async function togglePublish(
    id
) {

    const announcement =
        allAnnouncements.find(
            item =>
                item.id === id
        );


    if (!announcement) {
        return;
    }


    const newStatus =
        !announcement.published;


    const {
        error
    } =
        await supabase
            .from(
                "announcements"
            )
            .update({

                published:
                    newStatus,

                published_at:
                    newStatus
                        ?
                        new Date().toISOString()
                        :
                        null
            })
            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    await loadAnnouncements();
}


// =====================================================
// TOGGLE PIN
// =====================================================

async function togglePin(
    id
) {

    const announcement =
        allAnnouncements.find(
            item =>
                item.id === id
        );


    if (!announcement) {
        return;
    }


    const {
        error
    } =
        await supabase
            .from(
                "announcements"
            )
            .update({

                is_pinned:
                    !announcement.is_pinned
            })
            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    await loadAnnouncements();
}


// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================

async function deleteAnnouncement(
    id
) {

    const announcement =
        allAnnouncements.find(
            item =>
                item.id === id
        );


    if (!announcement) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${announcement.title}"?\n\nThis will also remove its attached files.`
        );


    if (!confirmed) {
        return;
    }


    // =============================================
    // FIND ATTACHMENTS
    // =============================================

    const {
        data: attachments,
        error: loadError
    } =
        await supabase
            .from(
                "announcement_attachments"
            )
            .select(
                "file_path"
            )
            .eq(
                "announcement_id",
                id
            );


    if (loadError) {

        alert(
            loadError.message
        );

        return;
    }


    const paths =
        (
            attachments || []
        )
            .map(
                item =>
                    item.file_path
            )
            .filter(Boolean);


    // =============================================
    // DELETE STORAGE FILES
    // =============================================

    if (
        paths.length > 0
    ) {

        const {
            error: storageError
        } =
            await supabase
                .storage
                .from(
                    STORAGE_BUCKET
                )
                .remove(paths);


        if (storageError) {

            alert(
                `Unable to remove attachment files: ${storageError.message}`
            );

            return;
        }
    }


    // =============================================
    // DELETE ATTACHMENT ROWS
    // =============================================

    const {
        error: attachmentDeleteError
    } =
        await supabase
            .from(
                "announcement_attachments"
            )
            .delete()
            .eq(
                "announcement_id",
                id
            );


    if (attachmentDeleteError) {

        alert(
            attachmentDeleteError.message
        );

        return;
    }


    // =============================================
    // DELETE ANNOUNCEMENT
    // =============================================

    const {
        error
    } =
        await supabase
            .from(
                "announcements"
            )
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    if (
        announcementId.value === id
    ) {

        resetForm();
    }


    await loadAnnouncements();
}


// =====================================================
// FILTER ANNOUNCEMENTS
// =====================================================

function filterAnnouncements() {

    const search =
        (
            announcementSearch?.value
            ||
            ""
        )
            .trim()
            .toLowerCase();


    const status =
        statusFilter?.value
        ||
        "all";


    const category =
        categoryFilter?.value
        ||
        "all";


    const filtered =
        allAnnouncements.filter(
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


                const textMatches =
                    !search
                    ||
                    title.includes(search)
                    ||
                    content.includes(search);


                let statusMatches =
                    true;


                if (
                    status ===
                    "published"
                ) {

                    statusMatches =
                        Boolean(
                            announcement.published
                        );
                }


                if (
                    status ===
                    "draft"
                ) {

                    statusMatches =
                        !announcement.published;
                }


                if (
                    status ===
                    "pinned"
                ) {

                    statusMatches =
                        Boolean(
                            announcement.is_pinned
                        );
                }


                const categoryMatches =
                    category ===
                    "all"
                    ||
                    announcement.category ===
                    category;


                return (
                    textMatches
                    &&
                    statusMatches
                    &&
                    categoryMatches
                );
            }
        );


    void displayAnnouncements(
        filtered
    );
}


// =====================================================
// STATISTICS
// =====================================================

function updateStatistics() {

    if (totalCount) {

        totalCount.textContent =
            allAnnouncements.length;
    }


    if (publishedCount) {

        publishedCount.textContent =
            allAnnouncements.filter(
                item =>
                    item.published
            ).length;
    }


    if (draftCount) {

        draftCount.textContent =
            allAnnouncements.filter(
                item =>
                    !item.published
            ).length;
    }


    if (pinnedCount) {

        pinnedCount.textContent =
            allAnnouncements.filter(
                item =>
                    item.is_pinned
            ).length;
    }
}


// =====================================================
// RESET FORM
// =====================================================

function resetForm(
    clearMessageToo = true
) {

    form?.reset();


    announcementId.value = "";


    announcementCategory.value =
        "general";


    announcementPriority.value =
        "normal";


    authorName.value =
        "PNGSA Executive Team";


    if (characterCount) {

        characterCount.textContent =
            "0";
    }


    if (formTitle) {

        formTitle.textContent =
            "Create Announcement";
    }


    if (publishButton) {

        publishButton.innerHTML = `

            <i class="fa-solid fa-paper-plane"></i>

            Publish Announcement

        `;
    }


    cancelEditButton
        ?.classList
        .add(
            "hidden"
        );


    selectedFiles = [];

    existingAttachments = [];


    if (
        selectedFilesContainer
    ) {

        selectedFilesContainer.innerHTML =
            "";
    }


    if (
        existingAttachmentsContainer
    ) {

        existingAttachmentsContainer.innerHTML =
            "";
    }


    if (
        announcementFiles
    ) {

        announcementFiles.value =
            "";
    }


    if (
        clearMessageToo
    ) {

        clearMessage();
    }
}


// =====================================================
// BUTTON STATE
// =====================================================

function setButtonsDisabled(
    disabled
) {

    if (saveDraftButton) {

        saveDraftButton.disabled =
            disabled;
    }


    if (publishButton) {

        publishButton.disabled =
            disabled;
    }


    if (cancelEditButton) {

        cancelEditButton.disabled =
            disabled;
    }
}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    type
) {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        message;


    formMessage.className =
        `form-message ${type}`;
}


function clearMessage() {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        "";


    formMessage.className =
        "form-message";
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

            Loading announcements...

        </div>

    `;
}


// =====================================================
// FILE EXTENSION
// =====================================================

function getExtension(
    fileName
) {

    return (
        fileName
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

function getFileIcon(
    fileName
) {

    const extension =
        getExtension(
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

            return "fa-solid fa-file-image";


        default:

            return "fa-solid fa-file";
    }
}


// =====================================================
// CLEAN FILE NAME
// =====================================================

function sanitizeFileName(
    value
) {

    return value
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        )
        .replace(
            /_+/g,
            "_"
        );
}


// =====================================================
// FILE SIZE
// =====================================================

function formatFileSize(
    bytes
) {

    const size =
        Number(bytes)
        ||
        0;


    if (
        size < 1024
    ) {

        return `${size} B`;
    }


    const kb =
        size / 1024;


    if (
        kb < 1024
    ) {

        return `${kb.toFixed(1)} KB`;
    }


    return `${
        (
            kb / 1024
        ).toFixed(1)
    } MB`;
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
                    "numeric",

                hour:
                    "numeric",

                minute:
                    "2-digit"
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


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    await supabase
        .auth
        .signOut();


    window.location.replace(
        "../index.html"
    );
}