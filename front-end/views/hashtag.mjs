import {renderOne, renderEach, destroy} from "../lib/render.mjs";
import {
  state,
  apiService,
  getLogoutContainer,
  getLoginContainer,
  getTimelineContainer,
  getHeadingContainer,
} from "../index.mjs";
import {createLogin, handleLogin} from "../components/login.mjs";
import {createLogout, handleLogout} from "../components/logout.mjs";
import {createBloom} from "../components/bloom.mjs";
import {createHeading} from "../components/heading.mjs";

// Hashtag view: show all blooms containing this tag
function hashtagView(hashtag) {
  destroy();

  const blooms = [];

  // Only fetch if this hashtag isn't already loaded
  if (state.currentHashtag !== `#${hashtag}`) {
    apiService.getBloomsByHashtag(hashtag);
  } else {
    blooms.push(...(state.hashtagBlooms || []));
  }

  renderOne(
    state.isLoggedIn,
    getLogoutContainer(),
    "logout-template",
    createLogout
  );
  document
    .querySelector("[data-action='logout']")
    ?.addEventListener("click", handleLogout);

  renderOne(
    state.isLoggedIn,
    getLoginContainer(),
    "login-template",
    createLogin
  );
  document
    .querySelector("[data-form='login']")
    ?.addEventListener("submit", handleLogin);

  renderOne(
    state.currentHashtag,
    getHeadingContainer(),
    "heading-template",
    createHeading
  );

  renderEach(
    blooms,
    getTimelineContainer(),
    "bloom-template",
    createBloom
  );
}

export {hashtagView };