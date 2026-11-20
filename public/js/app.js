import {
  getConfig,
  getGuestbookState,
  likeGuestbook,
  submitEntry,
  adminLogin,
  adminLogout,
  updateGreeting,
  moderateEntry,
  getModerationStatus,
  listEntries
} from "./api/guestbook-api.js";
import { GuestbookBook } from "./book/book.js";
import { setupSigningForm } from "./signing/form.js";

const $ = (id) => document.getElementById(id);

const entries = $("entries");
const status = $("entries-status");
const likeButton = $("like-button");
const likeHeart = $("like-heart");
const likeCount = $("like-count");

let moderationView = false;

const book = new GuestbookBook({
  entries,
  status,
  previousButton: $("previous-page"),
  nextButton: $("next-page"),
  pageIndicator: $("page-indicator"),
  api: (cursor) => listEntries(cursor, moderationView),
  onAdminAction: null
});

let adminAuthenticated = false;

function enableAdminView() {
  adminAuthenticated = true;
  book.onAdminAction = async (entryId, action) => {
    await moderateEntry(entryId, action);
  };
  book.renderCurrent();
}

async function restoreAdminSession() {
  try {
    const result = await getModerationStatus();
    if (result.authenticated) enableAdminView();
  } catch {
    // A missing/expired admin session must never prevent the public book from loading.
  }
}

async function refreshState() {
  const state = await getGuestbookState();
  likeCount.textContent = String(state.totalLikes);
  likeButton.classList.toggle("is-liked", state.likedToday === true);
  likeButton.setAttribute("aria-pressed", state.likedToday ? "true" : "false");
  $("greeting-text").textContent = state.greeting || "";
  $("greeting-date").textContent = state.greetingUpdatedAt
    ? new Date(state.greetingUpdatedAt).toLocaleDateString()
    : "";
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
}

$("add-message").addEventListener("click", () => openDialog($("message-dialog")));

likeButton.addEventListener("click", async () => {
  likeButton.disabled = true;
  try {
    const result = await likeGuestbook();
    likeCount.textContent = String(result.totalLikes);

    if (result.liked) {
      likeButton.classList.add("is-liked");
      likeButton.setAttribute("aria-pressed", "true");
    }

    $("like-status").textContent = result.message;
  } catch (error) {
    $("like-status").textContent = error.message;
  } finally {
    likeButton.disabled = false;
  }
});

$("previous-page").addEventListener("click", () => book.previousPage());
$("next-page").addEventListener("click", () => book.nextPage());

$("admin-pencil").addEventListener("click", () => {
  if (adminAuthenticated) openDialog($("greeting-dialog"));
  else openDialog($("admin-dialog"));
});

$("admin-settings").addEventListener("click", () => {
  if (adminAuthenticated) openDialog($("admin-tools-dialog"));
  else openDialog($("admin-dialog"));
});

$("admin-login").addEventListener("click", async () => {
  const statusEl = $("admin-status");
  statusEl.textContent = "";
  try {
    await adminLogin($("admin-password").value);
    enableAdminView();
    $("admin-dialog").close();
    openDialog($("admin-tools-dialog"));
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.className = "form-status status-error";
  }
});

$("edit-greeting").addEventListener("click", () => {
  $("admin-tools-dialog").close();
  $("greeting-input").value = $("greeting-text").textContent;
  openDialog($("greeting-dialog"));
});

$("greeting-form").addEventListener("submit", async (event) => {
  if (event.submitter?.value !== "save") return;
  event.preventDefault();
  const statusEl = $("greeting-status");
  try {
    const result = await updateGreeting($("greeting-input").value);
    $("greeting-text").textContent = result.greeting;
    $("greeting-date").textContent = new Date(result.greetingUpdatedAt).toLocaleDateString();
    $("greeting-dialog").close();
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.className = "form-status status-error";
  }
});

$("toggle-moderation-view").addEventListener("click", async () => {
  moderationView = !moderationView;
  $("toggle-moderation-view").textContent = moderationView
    ? "Show public messages"
    : "Show hidden & deleted messages";
  await book.start();
});

$("admin-logout").addEventListener("click", async () => {
  await adminLogout();
  adminAuthenticated = false;
  book.onAdminAction = null;
  book.renderCurrent();
  $("admin-tools-dialog").close();
});

if (new URLSearchParams(window.location.search).has("debug")) {
  document.body.classList.add("debug-layout");
}

const configPromise = getConfig().catch(() => ({ turnstileSiteKey: "" }));

setupSigningForm({
  form: $("message-form"),
  status: $("form-status"),
  submitButton: $("submit-button"),
  characterCount: $("character-count"),
  api: async (payload) => {
    const result = await submitEntry(payload);
    await book.start();
    await refreshState();
    $("message-dialog").close();
    return result;
  },
  getSiteKey: async () => (await configPromise).turnstileSiteKey
});

Promise.all([refreshState(), book.start(), restoreAdminSession()]).catch((error) => {
  status.textContent = error.message;
  status.className = "entries-status status-error";
});
