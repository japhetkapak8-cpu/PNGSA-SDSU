window.addEventListener("load", function () {

  const splash = document.getElementById("welcomeSplash");
  const skipButton = document.getElementById("skipSplash");

  if (!splash) return;

  /* If splash already showed during this session,
     remove it immediately */
  if (sessionStorage.getItem("pngsaSplashShown") === "yes") {
    splash.remove();
    return;
  }

  /* Mark splash as shown */
  sessionStorage.setItem("pngsaSplashShown", "yes");


  /* Start fading after 1 second */
  const fadeTimer = setTimeout(function () {
    splash.classList.add("fade-out");
  }, 1000);


  /* Completely remove after 4 seconds */
  const removeTimer = setTimeout(function () {
    splash.remove();
  }, 4000);


  /* Skip button */
  if (skipButton) {
    skipButton.addEventListener("click", function () {

      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);

      splash.remove();
    });
  }

});