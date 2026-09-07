import {
  apiService,
  getLogoutContainer,
  getTimelineContainer,
} from "../index.mjs";
import {state} from "../lib/state.mjs";
import {destroy, renderEach, renderOne} from "../lib/render.mjs";
import {getProfileContainer} from "../index.mjs";
import {createLogout, handleLogout} from "../components/logout.mjs";
import {createBloom, handleRebloom} from "../components/bloom.mjs";

let profileViewLoading = false;

/**
 * Create a profile component
 * @param {string} template - The ID of the template to clone
 * @param {Object} profileData - The profile data to display
 * @returns {DocumentFragment} - The profile UI
 */
function createProfile(template, {profileData, whoToFollow, isLoggedIn}) {
  if (!template || !profileData) return;
  const profileElement = document
    .getElementById(template)
    .content.cloneNode(true);

  const usernameEl = profileElement.querySelector("[data-username]");
  const bloomCountEl = profileElement.querySelector("[data-bloom-count]");
  const followingCountEl = profileElement.querySelector(
    "[data-following-count]"
  );
  const followerCountEl = profileElement.querySelector("[data-follower-count]");
  const followButtonEl = profileElement.querySelector("[data-action='follow']");
  const whoToFollowContainer = profileElement.querySelector(".profile__who-to-follow");
  // Populate with data
  usernameEl.querySelector("h2").textContent = profileData.username || "";
  usernameEl.setAttribute("href", `/profile/${profileData.username}`);
  bloomCountEl.textContent = profileData.total_blooms || 0;
  followerCountEl.textContent = profileData.followers?.length || 0;
  followingCountEl.textContent = profileData.follows?.length || 0;
  followButtonEl.setAttribute("data-username", profileData.username || "");
  followButtonEl.hidden = profileData.is_self || profileData.is_following;
  followButtonEl.addEventListener("click", handleFollow);
  if (!isLoggedIn) {
    followButtonEl.style.display = "none";
  }

  if (whoToFollow.length > 0) {
    const whoToFollowList = whoToFollowContainer.querySelector("[data-who-to-follow]");
    const whoToFollowTemplate = document.querySelector("#who-to-follow-chip");
    for (const userToFollow of whoToFollow) {
      const wtfElement = whoToFollowTemplate.content.cloneNode(true);
      const usernameLink = wtfElement.querySelector("a[data-username]");
      usernameLink.innerText = userToFollow.username;
      usernameLink.setAttribute("href", `/profile/${userToFollow.username}`);
      const followButton = wtfElement.querySelector("button");
      followButton.setAttribute("data-username", userToFollow.username);
      followButton.addEventListener("click", handleFollow);
      if (!isLoggedIn) {
        followButton.style.display = "none";
      }

      whoToFollowList.appendChild(wtfElement);
    }
  } else {
    whoToFollowContainer.innerText = "";
  }

  return profileElement;
}

async function handleFollow(event) {
  const button = event.target;
  const username = button.getAttribute("data-username");
  if (!username) return;

  await apiService.followUser(username);
  await apiService.getWhoToFollow();
}

async function profileView(username) {
  if (profileViewLoading) return;
  profileViewLoading = true;
  destroy();
  try {
    await apiService.getProfile(username);
    const blooms = await apiService.getBlooms(username);
    const profileData = state.profiles.find((profile) => profile.username === username);
    destroy();
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
      {
        profileData,
        whoToFollow: [],
        isLoggedIn: state.isLoggedIn,
      },
      getProfileContainer(),
      "profile-template",
      createProfile
    );
    renderEach(
      blooms.filter(
        (bloom) => bloom.sender === username && !bloom.rebloom_details
      ),
      getTimelineContainer(),
      "bloom-template",
      createBloom
    );
    document
      .querySelectorAll("[data-action='rebloom']")
      .forEach((button) => button.addEventListener("click", handleRebloom));
  } finally {
    profileViewLoading = false;
  }
}

export {createProfile, handleFollow, profileView};
