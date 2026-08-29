import { supabase } from "../../js/supabase.js";


// =====================================================
// ELEMENTS
// =====================================================

const profileSettingsForm =
    document.getElementById(
        "profileSettingsForm"
    );

const passwordForm =
    document.getElementById(
        "passwordForm"
    );


const firstName =
    document.getElementById(
        "firstName"
    );

const lastName =
    document.getElementById(
        "lastName"
    );

const memberEmail =
    document.getElementById(
        "memberEmail"
    );

const phone =
    document.getElementById(
        "phone"
    );

const major =
    document.getElementById(
        "major"
    );

const academicYear =
    document.getElementById(
        "academicYear"
    );

const graduationYear =
    document.getElementById(
        "graduationYear"
    );

const linkedin =
    document.getElementById(
        "linkedin"
    );

const bio =
    document.getElementById(
        "bio"
    );

const bioCharacterCount =
    document.getElementById(
        "bioCharacterCount"
    );


const profileMessage =
    document.getElementById(
        "profileMessage"
    );

const passwordMessage =
    document.getElementById(
        "passwordMessage"
    );


const saveProfileButton =
    document.getElementById(
        "saveProfileButton"
    );

const updatePasswordButton =
    document.getElementById(
        "updatePasswordButton"
    );


const newPassword =
    document.getElementById(
        "newPassword"
    );

const confirmPassword =
    document.getElementById(
        "confirmPassword"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const settingsProfilePhoto =
    document.getElementById(
        "settingsProfilePhoto"
    );

const settingsAvatarFallback =
    document.getElementById(
        "settingsAvatarFallback"
    );


const accountEmail =
    document.getElementById(
        "accountEmail"
    );

const accountStudentId =
    document.getElementById(
        "accountStudentId"
    );

const accountMembershipStatus =
    document.getElementById(
        "accountMembershipStatus"
    );

const accountMemberSince =
    document.getElementById(
        "accountMemberSince"
    );


// =====================================================
// STATE
// =====================================================

let currentUser = null;

let currentProfile = null;


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);


// =====================================================
// INITIALIZE
// =====================================================

async function initializeSettings() {

    const authenticated =
        await authenticateMember();


    if (!authenticated) {

        return;
    }


    setupEvents();


    await loadProfile();
}


// =====================================================
// AUTHENTICATE
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


    if (memberEmail) {

        memberEmail.value =
            currentUser.email
            ||
            "";
    }


    if (accountEmail) {

        accountEmail.textContent =
            currentUser.email
            ||
            "Not provided";
    }


    return true;
}


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile() {

    if (!currentUser) {

        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "profiles"
            )
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to load profile:",
            error
        );


        showMessage(
            profileMessage,
            "Unable to load your profile.",
            "error"
        );


        return;
    }


    currentProfile =
        data ||
        {};


    populateProfile();
}


// =====================================================
// POPULATE
// =====================================================

function populateProfile() {

    if (!currentProfile) {

        return;
    }


    firstName.value =
        currentProfile.first_name
        ||
        "";


    lastName.value =
        currentProfile.last_name
        ||
        "";


    phone.value =
        currentProfile.phone
        ||
        "";


    major.value =
        currentProfile.major
        ||
        "";


    academicYear.value =
        currentProfile.year
        ||
        currentProfile.academic_year
        ||
        "";


    graduationYear.value =
        currentProfile.graduation
        ||
        currentProfile.graduation_year
        ||
        "";


    linkedin.value =
        currentProfile.linkedin
        ||
        currentProfile.linkedin_url
        ||
        "";


    bio.value =
        currentProfile.bio
        ||
        currentProfile.about
        ||
        "";


    updateBioCounter();


    // =================================================
    // PROFILE PHOTO
    // =================================================

    const photoURL =
        currentProfile.profile_photo_url
        ||
        currentProfile.photo_url
        ||
        currentProfile.avatar_url
        ||
        "";


    if (
        photoURL
        &&
        settingsProfilePhoto
    ) {

        settingsProfilePhoto.src =
            photoURL;


        settingsProfilePhoto.hidden =
            false;


        settingsAvatarFallback.hidden =
            true;

    }

    else {

        settingsProfilePhoto.hidden =
            true;


        settingsAvatarFallback.hidden =
            false;
    }


    // =================================================
    // ACCOUNT INFORMATION
    // =================================================

    if (accountStudentId) {

        accountStudentId.textContent =
            currentProfile.student_id
            ||
            currentProfile.sdsu_id
            ||
            "Not provided";
    }


    if (accountMembershipStatus) {

        accountMembershipStatus.textContent =
            formatMembershipStatus(
                currentProfile.status
                ||
                currentProfile.membership_status
                ||
                "active"
            );
    }


    if (accountMemberSince) {

        accountMemberSince.textContent =
            formatDate(
                currentProfile.created_at
            );
    }

}


// =====================================================
// EVENTS
// =====================================================

function setupEvents() {

    profileSettingsForm
        ?.addEventListener(
            "submit",
            saveProfile
        );


    passwordForm
        ?.addEventListener(
            "submit",
            updatePassword
        );


    bio
        ?.addEventListener(
            "input",
            updateBioCounter
        );


    logoutButton
        ?.addEventListener(
            "click",
            logout
        );


    document
        .querySelectorAll(
            ".password-toggle"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        togglePassword(
                            button
                        );
                    }
                );

            }
        );

}


// =====================================================
// SAVE PROFILE
// =====================================================

async function saveProfile(
    event
) {

    event.preventDefault();


    if (!currentUser) {

        return;
    }


    clearMessage(
        profileMessage
    );


    saveProfileButton.disabled =
        true;


    saveProfileButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Saving...

    `;


    try {

        const payload = {

            first_name:
                firstName.value.trim(),

            last_name:
                lastName.value.trim(),

            phone:
                phone.value.trim()
                ||
                null,

            major:
                major.value.trim()
                ||
                null,

            year:
                academicYear.value
                ||
                null,

            graduation:
                graduationYear.value.trim()
                ||
                null,

            linkedin:
                linkedin.value.trim()
                ||
                null,

            bio:
                bio.value.trim()
                ||
                null,

            updated_at:
                new Date().toISOString()

        };


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "profiles"
                )
                .update(
                    payload
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .select()
                .single();


        if (error) {

            throw error;
        }


        currentProfile =
            data;


        showMessage(
            profileMessage,
            "Your profile has been updated successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Profile update failed:",
            error
        );


        showMessage(
            profileMessage,
            error?.message
            ||
            "Unable to update your profile.",
            "error"
        );

    }

    finally {

        saveProfileButton.disabled =
            false;


        saveProfileButton.innerHTML = `

            <i class="fa-solid fa-floppy-disk"></i>

            Save Profile

        `;
    }

}


// =====================================================
// UPDATE PASSWORD
// =====================================================

async function updatePassword(
    event
) {

    event.preventDefault();


    clearMessage(
        passwordMessage
    );


    const password =
        newPassword.value;


    const confirmation =
        confirmPassword.value;


    if (
        password.length < 8
    ) {

        showMessage(
            passwordMessage,
            "Your password must be at least 8 characters.",
            "error"
        );

        return;
    }


    if (
        password !==
        confirmation
    ) {

        showMessage(
            passwordMessage,
            "The passwords do not match.",
            "error"
        );

        return;
    }


    updatePasswordButton.disabled =
        true;


    updatePasswordButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Updating...

    `;


    try {

        const {
            error
        } =
            await supabase.auth
                .updateUser({

                    password:
                        password

                });


        if (error) {

            throw error;
        }


        newPassword.value =
            "";


        confirmPassword.value =
            "";


        showMessage(
            passwordMessage,
            "Your password has been updated successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Password update failed:",
            error
        );


        showMessage(
            passwordMessage,
            error?.message
            ||
            "Unable to update your password.",
            "error"
        );

    }

    finally {

        updatePasswordButton.disabled =
            false;


        updatePasswordButton.innerHTML = `

            <i class="fa-solid fa-key"></i>

            Update Password

        `;
    }

}


// =====================================================
// PASSWORD SHOW / HIDE
// =====================================================

function togglePassword(
    button
) {

    const targetId =
        button.dataset
            .passwordTarget;


    const input =
        document.getElementById(
            targetId
        );


    if (!input) {

        return;
    }


    const hidden =
        input.type ===
        "password";


    input.type =
        hidden
            ?
            "text"
            :
            "password";


    button.innerHTML =
        hidden
            ?
            `<i class="fa-solid fa-eye-slash"></i>`
            :
            `<i class="fa-solid fa-eye"></i>`;

}


// =====================================================
// BIO CHARACTER COUNT
// =====================================================

function updateBioCounter() {

    if (
        !bio
        ||
        !bioCharacterCount
    ) {

        return;
    }


    bioCharacterCount.textContent =
        String(
            bio.value.length
        );

}


// =====================================================
// MEMBERSHIP STATUS
// =====================================================

function formatMembershipStatus(
    value
) {

    if (!value) {

        return "Active Member";
    }


    const status =
        String(
            value
        )
            .replaceAll(
                "_",
                " "
            )
            .trim();


    return status
        .split(" ")
        .map(
            word =>
                word.charAt(0)
                    .toUpperCase()
                +
                word.slice(1)
        )
        .join(" ");

}


// =====================================================
// DATE
// =====================================================

function formatDate(
    value
) {

    if (!value) {

        return "Not available";
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

        return "Not available";
    }


    return date.toLocaleDateString(
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
// MESSAGE
// =====================================================

function showMessage(
    element,
    message,
    type
) {

    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        `settings-message ${type}`;

}


function clearMessage(
    element
) {

    if (!element) {

        return;
    }


    element.textContent =
        "";


    element.className =
        "settings-message";

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    await supabase.auth
        .signOut();


    window.location.replace(
        "../index.html"
    );

}