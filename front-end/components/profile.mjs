import {apiService} from "../index.mjs";

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
  const followingCountEl = profileElement.querySelector("[data-following-count]");
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
  
  // Only hide for own profile, not when following
  followButtonEl.hidden = profileData.is_self;
  
  // Set button text based on follow status
  if (profileData.is_following) {
    followButtonEl.textContent = "Unfollow";
  } else {
    followButtonEl.textContent = "Follow";
  }
  
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

  try {
    // Check if this is a follow or unfollow action
    if (button.textContent === "Unfollow") {
      // Ask for confirmation
      if (!confirm(`Are you sure you want to unfollow ${username}?`)) {
        return;
      }
      
      // Call unfollow API
      await apiService.unfollowUser(username);
      // Update button text
      button.textContent = "Follow";
      
      // Update follower count immediately (optional)
      const profileElement = button.closest('.profile');
      if (profileElement) {
        const followerCountEl = profileElement.querySelector('[data-follower-count]');
        if (followerCountEl) {
          const currentCount = parseInt(followerCountEl.textContent) || 0;
          followerCountEl.textContent = Math.max(0, currentCount - 1);
        }
      }
    } else {
      // Call follow API
      await apiService.followUser(username);
      // Update button text
      button.textContent = "Unfollow";
      
      // Update follower count immediately (optional)
      const profileElement = button.closest('.profile');
      if (profileElement) {
        const followerCountEl = profileElement.querySelector('[data-follower-count]');
        if (followerCountEl) {
          const currentCount = parseInt(followerCountEl.textContent) || 0;
          followerCountEl.textContent = currentCount + 1;
        }
      }
    }
    
    // FIX: Only refresh who-to-follow, don't refresh everything
    // This should NOT clear the blooms
    if (state.isLoggedIn) {
      await apiService.getWhoToFollow();
    }
    
  } catch (error) {
    console.error("Failed to follow/unfollow:", error);
    // Error is already handled by your apiService
  }
}

export {createProfile, handleFollow};