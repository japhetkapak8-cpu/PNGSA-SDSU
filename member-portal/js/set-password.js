import { supabase }
from "../../js/supabase.js";


// =====================================================
// ELEMENTS
// =====================================================

const form =
    document.getElementById(
        "setPasswordForm"
    );


const statusBox =
    document.getElementById(
        "activationStatus"
    );


const message =
    document.getElementById(
        "passwordMessage"
    );


const activateButton =
    document.getElementById(
        "activateButton"
    );


const newPasswordInput =
    document.getElementById(
        "newPassword"
    );


const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );


// =====================================================
// STATE
// =====================================================

let invitationVerified =
    false;


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeActivation
);


// =====================================================
// INITIALIZE
// =====================================================

async function initializeActivation() {

    form.hidden =
        true;


    clearMessage();


    await verifyInvitation();

}


// =====================================================
// VERIFY INVITATION
// =====================================================

async function verifyInvitation() {

    try {

        // =================================================
        // CHECK FOR ERROR RETURNED BY SUPABASE
        // =================================================

        const hashParams =
            new URLSearchParams(
                window.location.hash.substring(1)
            );


        const searchParams =
            new URLSearchParams(
                window.location.search
            );


        const returnedErrorCode =
            hashParams.get(
                "error_code"
            )
            ||
            searchParams.get(
                "error_code"
            );


        const returnedErrorDescription =
            hashParams.get(
                "error_description"
            )
            ||
            searchParams.get(
                "error_description"
            );


        if (returnedErrorCode) {

            console.error(
                "Supabase invitation error:",
                returnedErrorCode,
                returnedErrorDescription
            );


            showInvitationError(
                returnedErrorDescription
                ||
                "This invitation link is invalid or has expired."
            );


            return false;
        }


        // =================================================
        // PKCE CALLBACK
        // =================================================

        const code =
            searchParams.get(
                "code"
            );


        if (code) {

            const {
                data,
                error
            } =
                await supabase.auth
                    .exchangeCodeForSession(
                        code
                    );


            if (error) {

                console.error(
                    "Unable to exchange invitation code:",
                    error
                );


                showInvitationError(
                    error.message
                    ||
                    "This invitation link is invalid or has expired."
                );


                return false;
            }


            if (
                !data?.session
                ||
                !data?.user
            ) {

                showInvitationError(
                    "The invitation could not be verified."
                );


                return false;
            }


            // Remove the one-time auth code from the URL
            // after successful exchange.

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );

        }


        // =================================================
        // GET SESSION
        // =================================================

        const {
            data: {
                session
            },
            error
        } =
            await supabase.auth
                .getSession();


        if (error) {

            console.error(
                "Session verification error:",
                error
            );


            showInvitationError(
                error.message
                ||
                "Unable to verify this invitation."
            );


            return false;
        }


        if (!session) {

            showInvitationError(
                "This invitation link may have expired, already been used, or was not completed correctly. Please request a new invitation."
            );


            return false;
        }


        // =================================================
        // VALID INVITATION SESSION
        // =================================================

        invitationVerified =
            true;


        statusBox.innerHTML = `

            <div class="status-success">

                <i class="fa-solid fa-circle-check"></i>

                <div>

                    <strong>
                        Invitation verified
                    </strong>

                    <p>
                        Create your password to finish activating your account.
                    </p>

                </div>

            </div>

        `;


        form.hidden =
            false;


        newPasswordInput
            ?.focus();


        return true;

    }

    catch (error) {

        console.error(
            "Unexpected invitation verification error:",
            error
        );


        showInvitationError(
            "Unable to verify the invitation. Please request a new invitation."
        );


        return false;
    }

}


// =====================================================
// SET PASSWORD
// =====================================================

form.addEventListener(
    "submit",
    async function(
        event
    ) {

        event.preventDefault();


        clearMessage();


        if (!invitationVerified) {

            showError(
                "Your invitation has not been verified."
            );


            return;
        }


        const password =
            newPasswordInput.value;


        const confirmation =
            confirmPasswordInput.value;


        // =================================================
        // VALIDATION
        // =================================================

        if (
            password.length <
            8
        ) {

            showError(
                "Password must be at least 8 characters long."
            );


            return;
        }


        if (
            password !==
            confirmation
        ) {

            showError(
                "The passwords do not match."
            );


            return;
        }


        activateButton.disabled =
            true;


        activateButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Activating Account...

        `;


        try {

            // =================================================
            // CONFIRM SESSION STILL EXISTS
            // =================================================

            const {
                data: {
                    session
                },
                error: sessionError
            } =
                await supabase.auth
                    .getSession();


            if (
                sessionError
                ||
                !session
            ) {

                throw new Error(
                    "Your activation session has expired. Please request a new invitation."
                );
            }


            // =================================================
            // SET PASSWORD
            // =================================================

            const {
                data,
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


            if (!data?.user) {

                throw new Error(
                    "Unable to complete account activation."
                );
            }


            // =================================================
            // SUCCESS
            // =================================================

            message.textContent =
                "Account activated successfully.";


            message.className =
                "form-message success";


            statusBox.innerHTML = `

                <div class="status-success">

                    <i class="fa-solid fa-circle-check"></i>

                    <div>

                        <strong>
                            Account activated
                        </strong>

                        <p>
                            Your password has been created successfully.
                        </p>

                    </div>

                </div>

            `;


            activateButton.innerHTML = `

                <i class="fa-solid fa-circle-check"></i>

                Account Activated

            `;


            // =================================================
            // REDIRECT
            // =================================================

            setTimeout(
                () => {

                    window.location.replace(
                        "profile.html"
                    );

                },
                1000
            );

        }

        catch (error) {

            console.error(
                "Unable to set password:",
                error
            );


            showError(
                error?.message
                ||
                "Unable to activate your account."
            );


            resetButton();
        }

    }
);


// =====================================================
// INVITATION ERROR
// =====================================================

function showInvitationError(
    text
) {

    invitationVerified =
        false;


    form.hidden =
        true;


    statusBox.innerHTML = `

        <div class="status-error">

            <i class="fa-solid fa-circle-exclamation"></i>

            <div>

                <strong>
                    Invitation link unavailable
                </strong>

                <p>
                    ${escapeHTML(
                        text
                    )}
                </p>

            </div>

        </div>

    `;

}


// =====================================================
// FORM ERROR
// =====================================================

function showError(
    text
) {

    message.textContent =
        text;


    message.className =
        "form-message error";

}


// =====================================================
// CLEAR MESSAGE
// =====================================================

function clearMessage() {

    message.textContent =
        "";


    message.className =
        "form-message";

}


// =====================================================
// RESET BUTTON
// =====================================================

function resetButton() {

    activateButton.disabled =
        false;


    activateButton.innerHTML = `

        <i class="fa-solid fa-shield-halved"></i>

        Activate Account

    `;

}


// =====================================================
// PASSWORD VISIBILITY
// =====================================================

function setupPasswordToggle(
    buttonId,
    inputId
) {

    const button =
        document.getElementById(
            buttonId
        );


    const input =
        document.getElementById(
            inputId
        );


    if (
        !button
        ||
        !input
    ) {

        return;
    }


    button.addEventListener(
        "click",
        function() {

            const icon =
                button.querySelector(
                    "i"
                );


            const currentlyHidden =
                input.type ===
                "password";


            input.type =
                currentlyHidden
                    ?
                    "text"
                    :
                    "password";


            if (icon) {

                icon.className =
                    currentlyHidden
                        ?
                        "fa-solid fa-eye-slash"
                        :
                        "fa-solid fa-eye";
            }

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


// =====================================================
// PASSWORD TOGGLES
// =====================================================

setupPasswordToggle(
    "toggleNewPassword",
    "newPassword"
);


setupPasswordToggle(
    "toggleConfirmPassword",
    "confirmPassword"
);