import {apiService} from "../index.mjs";

/**
 * Create a bloom component
 * @param {string} template - The ID of the template to clone
 * @param {Object} bloom - The bloom data
 * @returns {DocumentFragment} - The bloom fragment of UI, for items in the Timeline
 * btw a bloom object is composed thus
 * {"id": Number,
 * "sender": username,
 * "content": "string from textarea",
 * "sent_timestamp": "datetime as ISO 8601 formatted string",
 * "original_bloom_id": Number or null,
 * "original_sender": username or null - set when this bloom is a rebloom,
 * "original_sent_timestamp": "datetime as ISO 8601 formatted string" or null,
 * "rebloom_count": Number,
 * "rebloomed_by_current_user": boolean}

 */
const createBloom = (template, bloom) => {
  if (!bloom) return;
  const bloomFrag = document.getElementById(template).content.cloneNode(true);
  const bloomParser = new DOMParser();

  const bloomArticle = bloomFrag.querySelector("[data-bloom]");
  const bloomUsername = bloomFrag.querySelector("[data-username]");
  const bloomTime = bloomFrag.querySelector("[data-time]");
  const bloomTimeLink = bloomFrag.querySelector("a:has(> [data-time])");
  const bloomContent = bloomFrag.querySelector("[data-content]");
  const rebloomBanner = bloomFrag.querySelector("[data-rebloom-banner]");
  const rebloomer = bloomFrag.querySelector("[data-rebloomer]");
  const rebloomTime = bloomFrag.querySelector("[data-rebloom-time]");
  const rebloomButton = bloomFrag.querySelector("[data-action='rebloom']");
  const rebloomLabel = bloomFrag.querySelector("[data-rebloom-label]");
  const rebloomCount = bloomFrag.querySelector("[data-rebloom-count]");

  const isRebloom = Boolean(bloom.original_sender);
  const bylineUsername = isRebloom ? bloom.original_sender : bloom.sender;

  bloomArticle.setAttribute("data-bloom-id", bloom.id);
  bloomArticle.classList.toggle("bloom--rebloom", isRebloom);
  bloomUsername.setAttribute("href", `/profile/${bylineUsername}`);
  bloomUsername.textContent = bylineUsername;
  bloomTime.textContent = _formatTimestamp(
    bloom.original_sent_timestamp ?? bloom.sent_timestamp
  );
  bloomTimeLink.setAttribute("href", `/bloom/${bloom.id}`);
  bloomContent.replaceChildren(
    ...bloomParser.parseFromString(_formatHashtags(bloom.content), "text/html")
      .body.childNodes
  );

  rebloomBanner.hidden = !isRebloom;
  if (isRebloom) {
    rebloomer.setAttribute("href", `/profile/${bloom.sender}`);
    rebloomer.textContent = bloom.sender;
    rebloomTime.textContent = _formatTimestamp(bloom.sent_timestamp);
  }

  rebloomButton.setAttribute("data-bloom-id", bloom.id);
  rebloomButton.disabled = Boolean(bloom.rebloomed_by_current_user);
  rebloomLabel.textContent = bloom.rebloomed_by_current_user
    ? "Reblооmed"
    : "Rebloom";
  rebloomCount.hidden = !bloom.rebloom_count;
  rebloomCount.textContent = bloom.rebloom_count || "";

  return bloomFrag;
};

/**
 * Handle a rebloom button click
 * @param {Event} event - The click event from a bloom's rebloom button
 */
async function handleRebloom(event) {
  const button = event.currentTarget;
  const bloomId = button.getAttribute("data-bloom-id");
  if (!bloomId) return;

  button.disabled = true;
  const data = await apiService.rebloomBloom(bloomId);
  if (!data.success) {
    // A successful rebloom triggers a re-render (via getBlooms/getProfile)
    // which replaces this button entirely, so only re-enable on failure.
    button.disabled = false;
  }
}

function _formatHashtags(text) {
  if (!text) return text;
  return text.replace(
    /\B#[^#]+/g,
    (match) => `<a href="/hashtag/${match.slice(1)}">${match}</a>`
  );
}

function _formatTimestamp(timestamp) {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    // Less than a minute
    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    }

    // Less than an hour
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }

    // Less than a day
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h`;
    }

    // Less than a week
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays}d`;
    }

    // Format as month and day for older dates
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Failed to format timestamp:", error);
    return "";
  }
}

export {createBloom, handleRebloom};
