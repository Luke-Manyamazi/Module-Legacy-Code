import { state } from "./lib/state.mjs";
import { handleRouteChange } from "./lib/router.mjs";
import { apiService } from "./lib/api.mjs";
import { handleErrorDialog } from "./components/error.mjs";

// ✅ NEW: import auth handlers
import { handleLogin } from "./components/login.mjs";
import { handleLogout } from "./components/logout.mjs";

// get all the dynamic areas of the initial DOM
const getLogoutContainer = () => document.getElementById("logout-container");
const getLoginContainer = () => document.getElementById("login-container");
const getSignupContainer = () => document.getElementById("signup-container");
const getBloomFormContainer = () =>
  document.getElementById("bloom-form-container");
const getProfileContainer = () => document.getElementById("profile-container");
const getTimelineContainer = () =>
  document.getElementById("timeline-container");
const getErrorDialog = () => document.getElementById("error-container");
const getHeadingContainer = () => document.getElementById("heading-container");

/**
 * Init the application
 * - Check for token and restore session if exists
 * - Handle the current route based on URL
 * - Set up state change listeners
 * - Set up global auth event delegation
 */
async function init() {
  const path = window.location.pathname;
  const isProfilePage = path.startsWith("/profile/");
  const profileUsername = isProfilePage ? path.split("/")[2] : null;

  // Attempt to restore session if token exists
  if (state.token || localStorage.getItem("token")) {
    if (localStorage.getItem("token") && !state.token) {
      state.updateState({ token: localStorage.getItem("token") });
    }
    await apiService.getProfile();

    if (isProfilePage && profileUsername) {
      await apiService.getProfile(profileUsername);
    }
  }

  // Handle login form submissions anywhere in the app
  document.addEventListener("submit", (event) => {
    if (event.target.matches("[data-form='login']")) {
      handleLogin(event);
    }
  });

  // Handle logout clicks anywhere in the app
  document.addEventListener("click", (event) => {
    if (event.target.matches("[data-action='logout']")) {
      handleLogout(event);
    }
  });

  handleRouteChange();

  document.addEventListener("state-change", () => {
    handleRouteChange();
  });
}

// TODO Check any unhandled errors bubble up to this central handler
window.onload = () => {
  init().catch((error) => {
    handleErrorDialog(error);
  });
};

// TODO rm this backstop
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  handleErrorDialog(event.reason);
});

export {
  getLogoutContainer,
  getLoginContainer,
  getSignupContainer,
  getBloomFormContainer,
  getProfileContainer,
  getHeadingContainer,
  getTimelineContainer,
  getErrorDialog,
  state,
  apiService,
};
