import {bloomView} from "../views/bloom.mjs";
import {profileView} from "../views/profile.mjs";
import {signupView} from "../views/signup.mjs";
import {loginView} from "../views/login.mjs";
import {homeView} from "../views/home.mjs";
import {hashtagView} from "../views/hashtag.mjs";

/**
 * Handle route changes based on the current URL
 */
function handleRouteChange() {
  // We're going to use hash for routing
  const hash = window.location.hash.substring(1) || "/";

  // Bloom path for a single bloom
  if (hash.startsWith("/bloom/")) {
    window.__purpleForestRoute = "bloom";
    const bloomId = hash.split("/")[2];
    bloomView(bloomId);
    return;
  }

  // Profile path with username
  if (hash.startsWith("/profile/")) {
    window.__purpleForestRoute = "profile";
    const username = hash.split("/")[2];
    profileView(username);
    return;
  }

  // Hashtag path
  if (hash.startsWith("/hashtag/")) {
    window.__purpleForestRoute = "hashtag";
    const hashtag = hash.split("/")[2];
    hashtagView(hashtag);
    return;
  }

  // Static routes
  if (hash === "/signup") {
    window.__purpleForestRoute = "signup";
    signupView();
    return;
  }

  if (hash === "/login") {
    window.__purpleForestRoute = "login";
    loginView();
    return;
  }

  // Default route
  window.__purpleForestRoute = "home";
  homeView();
}

/**
 * Navigate to a specific route in the application
 * @param {string} path - The path to navigate to
 */
function navigateTo(path) {
  window.location.hash = path;
}

window.addEventListener("hashchange", handleRouteChange);

// Intercept clicks on internal links
document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href");
  // Only handle internal links (starting with / and not # anchors)
  if (href && href.startsWith("/") && !href.startsWith("#")) {
    event.preventDefault();
    navigateTo(href);
  }
});

export {handleRouteChange, navigateTo};
