import {
  getConfig,
  getGuestbookState,
  likeGuestbook,
  submitEntry,
  adminLogin,
  adminLogout,
  updateGreeting,
  moderateEntry
} from "./api/guestbook-api.js";
import { GuestbookBook } from "./book/book.js";
import { setupSigningForm } from "./signing/form.js";

const $ = (id) => document.getElementById(id);

const entries = $("entries");
const status = $("entries-status");
const book = new GuestbookBook({
  entries,
  status,
  previousButton: $("previous-page"),
  nextButton: $("next-page"),
  pageIndicator: $("page-indicator"),
  api: (cursor) => import("./api/guestbook-api.js").then(({ listEntries }) => listEntries(cursor)),
  onAdminAction: null
});

let adminAuthenticated = false;

async function refreshState() {
  const state = await getGuestbookState();
  $("like-count").textContent = String(state.totalLikes);
  $("greeting-text").textContent = state.greeting || "";
  $("greeting-date").textContent = state.greetingUpdatedAt
    ? new Date(state.greetingUpdatedAt).toLocaleDateString()
    : "";
}

async function openDialog(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
}

async function requireAdminUi(afterLogin) {
  if (adminAuthenticated) {
    afterLogin();
    return;
  }
  $("admin-status").textContent = "";
  $("admin-password").value = "";
  await openDialog($("admin-dialog"));
  $("admin-after-login").value = afterLogin.name || "";
}

$("add-message").addEventListener("click", () => openDialog($("message-dialog")));
$("like-button").addEventListener("click", async () => {
  const button = $("like-button");
  button.disabled = true;
  try {
    const result = await likeGuestbook();
    $("like-count").textContent = String(result.totalLikes);
    $("like-status").textContent = result.message;
  } catch (error) {
    $("like-status").textContent = error.message;
  } finally {
    button.disabled = false;
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

$("mobile-admin").addEventListener("click", () => $("admin-settings").click());

$("admin-login").addEventListener("click", async () => {
  const statusEl = $("admin-status");
  statusEl.textContent = "";
  try {
    await adminLogin($("admin-password").value);
    adminAuthenticated = true;
    $("admin-dialog").close();
    book.onAdminAction = async (entryId, action) => {
      await moderateEntry(entryId, action);
    };
    book.renderCurrent();
    await openDialog($("admin-tools-dialog"));
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.className = "form-status status-error";
  }
});

$("edit-greeting").addEventListener("click", async () => {
  $("admin-tools-dialog").close();
  $("greeting-input").value = $("greeting-text").textContent;
  await openDialog($("greeting-dialog"));
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

$("admin-logout").addEventListener("click", async () => {
  await adminLogout();
  adminAuthenticated = false;
  book.onAdminAction = null;
  book.renderCurrent();
  $("admin-tools-dialog").close();
});

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

$("like-button").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") event.preventDefault();
});

Promise.all([refreshState(), book.start()]).catch((error) => {
  status.textContent = error.message;
  status.className = "entries-status status-error";
});
