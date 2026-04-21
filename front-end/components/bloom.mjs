/**
 * Create a bloom component
 * @param {string} template - The ID of the template to clone
 * @param {Object} bloom - The bloom data
 * @returns {DocumentFragment}
 */
import { apiService } from "../index.mjs";

const createBloom = (template, bloom) => {
  if (!bloom) return;

  const bloomFrag = document.getElementById(template).content.cloneNode(true);
  const bloomParser = new DOMParser();

  const bloomArticle = bloomFrag.querySelector("[data-bloom]");
  const bloomUsername = bloomFrag.querySelector("[data-username]");
  const bloomTime = bloomFrag.querySelector("[data-time]");
  const bloomTimeLink = bloomFrag.querySelector("a:has(> [data-time])");
  const bloomContent = bloomFrag.querySelector("[data-content]");
  const rebloomButton = bloomFrag.querySelector("[data-action='rebloom']");
  const rebloomCount = bloomFrag.querySelector("[data-rebloom-count]");
  const rebloomLabel = bloomFrag.querySelector("[data-rebloom-label]");

  bloomArticle.setAttribute("data-bloom-id", bloom.id);
  bloomUsername.setAttribute("href", `/profile/${bloom.sender}`);
  bloomUsername.textContent = bloom.sender;
  bloomTime.textContent = _formatTimestamp(bloom.sent_timestamp);
  bloomTimeLink.setAttribute("href", `/bloom/${bloom.id}`);

  bloomContent.replaceChildren(
    ...bloomParser.parseFromString(_formatHashtags(bloom.content), "text/html")
      .body.childNodes,
  );

  // Handle rebloom click
  rebloomButton?.addEventListener("click", async () => {
    try {
      const result = await apiService.rebloom(bloom.id);

      if (result.success) {
        rebloomButton.textContent = "🔁 Re-bloomed";
        rebloomButton.disabled = true;

        if (rebloomCount) {
          const currentCount = bloom.rebloom_count || 0;
          rebloomCount.textContent = `🔁 ${currentCount + 1}`;
        }
        if (bloom.rebloomed_by) {
          rebloomLabel.textContent = `${bloom.rebloomed_by} re-bloomed`;
        }
      }
    } catch (error) {
      console.error("Failed to rebloom:", error);
      alert("Failed to rebloom");
    }
  });

  return bloomFrag;
};

function _formatHashtags(text) {
  if (!text) return text;

  return text.replace(
    /#[A-Za-z0-9_]+/g,
    (match) => `<a href="/hashtag/${match.slice(1)}">${match}</a>`
  );
}

function _formatTimestamp(timestamp) {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Failed to format timestamp:", error);
    return "";
  }
}

export { createBloom };
