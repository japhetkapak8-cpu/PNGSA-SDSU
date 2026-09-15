import { supabase } from "./supabaseClient.js";

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      window.location.href = "login.html";
    } catch (error) {
      console.error("Sign out failed:", error);

      alert("Unable to sign out. Please try again.");
    }
  });
}