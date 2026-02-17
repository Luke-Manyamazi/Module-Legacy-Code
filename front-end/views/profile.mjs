import { renderEach, renderOne, destroy } from "../lib/render.mjs";
import {
  apiService,
  state,
  getLogoutContainer,
  getLoginContainer,
  getProfileContainer,
  getTimelineContainer,
} from "../index.mjs";
import { createLogin } from "../components/login.mjs";
import { createLogout } from "../components/logout.mjs";
import { createProfile } from "../components/profile.mjs";
import { createBloom } from "../components/bloom.mjs";

function profileView(username) {
  // Clear previous view
  destroy();

  // Check if profile already exists in state
  const existingProfile = state.profiles.find(
    (p) => p.username === username
  );

  // Fetch profile if missing or incomplete
  if (!existingProfile || !existingProfile.recent_blooms) {
    apiService.getProfile(username);
  }

  // Render logout button if logged in
  renderOne(
    state.isLoggedIn,
    getLogoutContainer(),
    "logout-template",
    createLogout
  );

  // Render login form if logged out
  renderOne(
    state.isLoggedIn,
    getLoginContainer(),
    "login-template",
    createLogin
  );

  // Get profile data from state
  const profileData = state.profiles.find(
    (p) => p.username === username
  );

  // Render profile and blooms if data exists
  if (profileData) {
    renderOne(
      {
        profileData,
        whoToFollow: state.isLoggedIn ? state.whoToFollow : [],
        isLoggedIn: state.isLoggedIn,
      },
      getProfileContainer(),
      "profile-template",
      createProfile
    );

    renderEach(
      profileData.recent_blooms || [],
      getTimelineContainer(),
      "bloom-template",
      createBloom
    );
  }
}

export { profileView };
