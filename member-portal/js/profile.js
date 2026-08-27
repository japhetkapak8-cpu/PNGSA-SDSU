import { supabase }
from "../../js/supabase.js";


let currentUser = null;
let currentAvatarUrl = null;


const form =
  document.getElementById(
    "profileForm"
  );

const message =
  document.getElementById(
    "profileMessage"
  );


// ========================================
// AUTHENTICATE MEMBER
// ========================================

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


  const memberEmail =
    document.getElementById(
      "memberEmail"
    );

  if (memberEmail) {

    memberEmail.textContent =
      currentUser.email;

  }


  const emailInput =
    document.getElementById(
      "email"
    );

  if (emailInput) {

    emailInput.value =
      currentUser.email;

  }


  return true;
}



// ========================================
// HELPER - SET VALUE
// ========================================

function setValue(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );

  if (!element) {
    return;
  }

  element.value =
    value ?? "";

}



// ========================================
// HELPER - GET VALUE
// ========================================

function getValue(id) {

  const element =
    document.getElementById(
      id
    );

  if (!element) {
    return "";
  }

  return element.value.trim();

}



// ========================================
// LOAD PROFILE
// ========================================

async function loadProfile() {

  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select(`
        avatar_url,
        full_name,
        email,
        date_of_birth,
        gender,
        personal_email,
        phone_number,
        province,
        district,
        home_town,
        living_area,
        university,
        major,
        minor,
        degree_level,
        year_of_study,
        expected_graduation,
        academic_status,
        sponsorship_status,
        sponsorship_type,
        sponsor_name,
        sponsorship_program,
        sponsorship_start_year,
        sponsorship_end_year,
        sponsorship_current_status,
        sponsorship_issues,
        career_interest,
        return_to_png,
        interested_png_employment,
        interested_internships,
        career_notes,
        info_sharing_consent,
        profile_completed
      `)
      .eq(
        "id",
        currentUser.id
      )
      .single();


  if (error) {

    console.error(
      "Unable to load profile:",
      error
    );

    message.textContent =
      "Unable to load your profile.";

    message.className =
      "form-message error";

    return;
  }


  // ========================================
  // PROFILE PHOTO
  // ========================================

  currentAvatarUrl =
    data.avatar_url || null;


  const preview =
    document.getElementById(
      "profilePhotoPreview"
    );


  if (
    preview &&
    currentAvatarUrl
  ) {

    preview.src =
      currentAvatarUrl;

  }


  // ========================================
  // PERSONAL INFORMATION
  // ========================================

  setValue(
    "fullName",
    data.full_name
  );

  setValue(
    "email",
    currentUser.email
  );

  setValue(
    "dateOfBirth",
    data.date_of_birth
  );

  setValue(
    "gender",
    data.gender
  );

  setValue(
    "personalEmail",
    data.personal_email
  );

  setValue(
    "phoneNumber",
    data.phone_number
  );

  setValue(
    "province",
    data.province
  );

  setValue(
    "district",
    data.district
  );

  setValue(
    "homeTown",
    data.home_town
  );

  setValue(
    "livingArea",
    data.living_area
  );


  // ========================================
  // ACADEMIC INFORMATION
  // ========================================

  setValue(
    "university",
    data.university ||
    "South Dakota State University"
  );

  setValue(
    "major",
    data.major
  );

  setValue(
    "minor",
    data.minor
  );

  setValue(
    "degreeLevel",
    data.degree_level
  );

  setValue(
    "yearOfStudy",
    data.year_of_study
  );

  setValue(
    "expectedGraduation",
    data.expected_graduation
  );

  setValue(
    "academicStatus",
    data.academic_status
  );


  // ========================================
  // SPONSORSHIP INFORMATION
  // ========================================

  setValue(
    "sponsorshipStatus",
    data.sponsorship_status
  );

  setValue(
    "sponsorshipType",
    data.sponsorship_type
  );

  setValue(
    "sponsorName",
    data.sponsor_name
  );

  setValue(
    "sponsorshipProgram",
    data.sponsorship_program
  );

  setValue(
    "sponsorshipStartYear",
    data.sponsorship_start_year
  );

  setValue(
    "sponsorshipEndYear",
    data.sponsorship_end_year
  );

  setValue(
    "sponsorshipCurrentStatus",
    data.sponsorship_current_status
  );

  setValue(
    "sponsorshipIssues",
    data.sponsorship_issues
  );


  // ========================================
  // CAREER INFORMATION
  // ========================================

  setValue(
    "careerInterest",
    data.career_interest
  );

  setValue(
    "returnToPNG",
    data.return_to_png
  );

  setValue(
    "careerNotes",
    data.career_notes
  );


  const pngEmployment =
    document.getElementById(
      "pngEmployment"
    );


  if (pngEmployment) {

    if (
      data.interested_png_employment === true
    ) {

      pngEmployment.value =
        "Yes";

    }

    else if (
      data.interested_png_employment === false
    ) {

      pngEmployment.value =
        "No";

    }

  }


  const internshipInterest =
    document.getElementById(
      "internshipInterest"
    );


  if (internshipInterest) {

    if (
      data.interested_internships === true
    ) {

      internshipInterest.value =
        "Yes";

    }

    else if (
      data.interested_internships === false
    ) {

      internshipInterest.value =
        "No";

    }

  }


  // ========================================
  // CONSENT
  // ========================================

  const consent =
    document.getElementById(
      "infoSharingConsent"
    );


  if (consent) {

    consent.checked =
      data.info_sharing_consent === true;

  }

}



// ========================================
// PROFILE PHOTO PREVIEW
// ========================================

const photoInput =
  document.getElementById(
    "profilePhoto"
  );


if (photoInput) {

  photoInput.addEventListener(
    "change",
    function() {

      const file =
        this.files?.[0];


      if (!file) {
        return;
      }


      if (
        file.size >
        5 * 1024 * 1024
      ) {

        message.textContent =
          "Profile picture must be 5 MB or smaller.";

        message.className =
          "form-message error";

        this.value =
          "";

        return;
      }


      const allowedTypes =
        [
          "image/jpeg",
          "image/png",
          "image/webp"
        ];


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        message.textContent =
          "Please select a JPG, PNG, or WEBP image.";

        message.className =
          "form-message error";

        this.value =
          "";

        return;
      }


      const preview =
        document.getElementById(
          "profilePhotoPreview"
        );


      if (preview) {

        preview.src =
          URL.createObjectURL(
            file
          );

      }

    }
  );

}



// ========================================
// UPLOAD PROFILE PHOTO
// ========================================

async function uploadProfilePhoto() {

  const input =
    document.getElementById(
      "profilePhoto"
    );


  if (
    !input ||
    !input.files ||
    input.files.length === 0
  ) {

    return currentAvatarUrl;

  }


  const file =
    input.files[0];


  if (
    file.size >
    5 * 1024 * 1024
  ) {

    throw new Error(
      "Profile picture must be 5 MB or smaller."
    );

  }


  const allowedTypes =
    [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    throw new Error(
      "Please upload a JPG, PNG, or WEBP image."
    );

  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const filePath =
    `${currentUser.id}/profile.${extension}`;


  const {
    error: uploadError
  } =
    await supabase.storage
      .from("profile-pictures")
      .upload(
        filePath,
        file,
        {
          upsert: true,
          contentType:
            file.type
        }
      );


  if (uploadError) {

    console.error(
      "Photo upload error:",
      uploadError
    );

    throw uploadError;

  }


  const {
    data
  } =
    supabase.storage
      .from("profile-pictures")
      .getPublicUrl(
        filePath
      );


  currentAvatarUrl =
    data.publicUrl;


  return currentAvatarUrl;

}



// ========================================
// SAVE PROFILE
// ========================================

if (form) {

  form.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      if (!currentUser) {

        return;

      }


      message.textContent =
        "Saving your profile...";

      message.className =
        "form-message";


      // ========================================
      // REQUIRED VALUES
      // ========================================

      const fullName =
        getValue(
          "fullName"
        );

      const province =
        getValue(
          "province"
        );

      const district =
        getValue(
          "district"
        );

      const livingArea =
        getValue(
          "livingArea"
        );

      const major =
        getValue(
          "major"
        );

      const degreeLevel =
        getValue(
          "degreeLevel"
        );

      const yearOfStudy =
        getValue(
          "yearOfStudy"
        );

      const expectedGraduation =
        getValue(
          "expectedGraduation"
        );

      const academicStatus =
        getValue(
          "academicStatus"
        );

      const sponsorshipStatus =
        getValue(
          "sponsorshipStatus"
        );


      // ========================================
      // VALIDATE
      // ========================================

      if (
        !fullName ||
        !province ||
        !district ||
        !livingArea ||
        !major ||
        !degreeLevel ||
        !yearOfStudy ||
        !expectedGraduation ||
        !academicStatus ||
        !sponsorshipStatus
      ) {

        message.textContent =
          "Please complete all required fields.";

        message.className =
          "form-message error";

        return;

      }


      // ========================================
      // UPLOAD PHOTO
      // ========================================

      let avatarUrl =
        currentAvatarUrl;


      try {

        avatarUrl =
          await uploadProfilePhoto();

      }

      catch (error) {

        console.error(
          error
        );


        message.textContent =
          error.message ||
          "Unable to upload profile picture.";

        message.className =
          "form-message error";

        return;

      }


      // ========================================
      // SAVE PROFILE TO SUPABASE
      // ========================================

      const {
        error
      } =
        await supabase
          .from("profiles")
          .update({

            // PROFILE PHOTO

            avatar_url:
              avatarUrl,


            // PERSONAL INFORMATION

            full_name:
              fullName,

            email:
              currentUser.email,

            date_of_birth:
              getValue(
                "dateOfBirth"
              ) || null,

            gender:
              getValue(
                "gender"
              ) || null,

            personal_email:
              getValue(
                "personalEmail"
              ) || null,

            phone_number:
              getValue(
                "phoneNumber"
              ) || null,

            province:
              province,

            district:
              district,

            home_town:
              getValue(
                "homeTown"
              ) || null,

            living_area:
              livingArea,


            // ACADEMIC INFORMATION

            university:
              "South Dakota State University",

            major:
              major,

            minor:
              getValue(
                "minor"
              ) || null,

            degree_level:
              degreeLevel,

            year_of_study:
              yearOfStudy,

            expected_graduation:
              expectedGraduation,

            academic_status:
              academicStatus,


            // SPONSORSHIP INFORMATION

            sponsorship_status:
              sponsorshipStatus,

            sponsorship_type:
              getValue(
                "sponsorshipType"
              ) || null,

            sponsor_name:
              getValue(
                "sponsorName"
              ) || null,

            sponsorship_program:
              getValue(
                "sponsorshipProgram"
              ) || null,

            sponsorship_start_year:
              getValue(
                "sponsorshipStartYear"
              ) || null,

            sponsorship_end_year:
              getValue(
                "sponsorshipEndYear"
              ) || null,

            sponsorship_current_status:
              getValue(
                "sponsorshipCurrentStatus"
              ) || null,

            sponsorship_issues:
              getValue(
                "sponsorshipIssues"
              ) || null,


            // CAREER INFORMATION

            career_interest:
              getValue(
                "careerInterest"
              ) || null,

            return_to_png:
              getValue(
                "returnToPNG"
              ) || null,

            interested_png_employment:
              getValue(
                "pngEmployment"
              ) === "Yes",

            interested_internships:
              getValue(
                "internshipInterest"
              ) === "Yes",

            career_notes:
              getValue(
                "careerNotes"
              ) || null,


            // CONSENT

            info_sharing_consent:
              document.getElementById(
                "infoSharingConsent"
              )?.checked === true,


            // PROFILE STATUS

            profile_completed:
              true,

            profile_updated_at:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            currentUser.id
          );


      if (error) {

        console.error(
          "Unable to save profile:",
          error
        );


        message.textContent =
          "Unable to save your profile.";

        message.className =
          "form-message error";

        return;

      }


      // ========================================
      // SUCCESS
      // ========================================

      message.textContent =
        "Profile saved successfully.";

      message.className =
        "form-message success";


      setTimeout(
        () => {

          window.location.replace(
            "dashboard.html"
          );

        },
        1000
      );

    }
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
// START
// ========================================

async function initialize() {

  const authenticated =
    await authenticateMember();


  if (!authenticated) {

    return;

  }


  await loadProfile();

}


initialize();