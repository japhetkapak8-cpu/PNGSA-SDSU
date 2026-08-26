/* ========================================
   PNGSA SPLASH SCREEN
======================================== */

window.addEventListener("load", function () {

  const splash =
    document.getElementById("welcomeSplash");

  const skipButton =
    document.getElementById("skipSplash");


  if (!splash) {
    return;
  }


  /* ========================================
     AFTER 1 SECOND
     START FADING
  ======================================== */

  const fadeTimer = setTimeout(function () {

    splash.classList.add("fade-out");

  }, 1000);



  /* ========================================
     AT 4 SECONDS
     REMOVE COMPLETELY
  ======================================== */

  const removeTimer = setTimeout(function () {

    splash.remove();

  }, 4000);



  /* ========================================
     SKIP BUTTON
  ======================================== */

  if (skipButton) {

    skipButton.addEventListener("click", function () {

      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);

      splash.remove();

    });

  }

});