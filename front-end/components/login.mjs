import { apiService } from "../index.mjs";

/**
 * Create a login component
 * @param {string} template - The ID of the template to clone
 * @param {Object} isLoggedIn - if you're logged in we don't need this component
 * @returns {DocumentFragment} - The login fragment
 */
function createLogin(template, isLoggedIn) {
  if (isLoggedIn) return;

  const loginElement = document
    .getElementById(template)
    .content.cloneNode(true);

  return loginElement;
}

// HANDLER
async function handleLogin(event) {
  event.preventDefault();

  const form = event.target;
  const submitButton = form.querySelector("[data-submit]");
  const originalText = submitButton.textContent;

  try {
    form.inert = true;
    submitButton.textContent = "Logging in...";

    const formData = new FormData(form);
    const username = formData.get("username");
    const password = formData.get("password");

    // Perform login
    await apiService.login(username, password);

    // Trigger app re-render after login
    window.dispatchEvent(new Event("state-change"));

  } catch (error) {
    throw error;
  } finally {
    // Always reset UI state
    submitButton.textContent = originalText;
    form.inert = false;
  }
}

export { createLogin, handleLogin };
