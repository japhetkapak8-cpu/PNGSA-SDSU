const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

/* ========================================
   MOBILE MENU
======================================== */

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}


/* ========================================
   CURRENT YEAR
======================================== */

const currentYear = document.getElementById("currentYear");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}


/* ========================================
   AUTOMATIC ACTIVE NAVIGATION
======================================== */

document.addEventListener("DOMContentLoaded", function () {

  // Get current page filename
  let currentPage = window.location.pathname.split("/").pop();

  // If URL has no filename, treat it as index.html
  if (currentPage === "") {
    currentPage = "index.html";
  }

  // Get all navigation links
  const navigationLinks = document.querySelectorAll(".nav-links a");

  navigationLinks.forEach(function (link) {

    const linkPage = link.getAttribute("href");

    // Highlight current page
    if (linkPage === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }

    // Close mobile menu after clicking a link
    link.addEventListener("click", function () {
      if (navLinks) {
        navLinks.classList.remove("active");
      }
    });

  });

});