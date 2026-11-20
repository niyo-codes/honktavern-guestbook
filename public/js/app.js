import { getConfig, listEntries, submitEntry } from "./api/guestbook-api.js";
import { showEntrySkeleton } from "./components/loading.js";
import { GuestbookBook } from "./book/book.js";
import { setupSigningForm } from "./signing/form.js";

const entries = document.getElementById("entries");
const status = document.getElementById("entries-status");
const loadMoreButton = document.getElementById("load-more");
const refreshButton = document.getElementById("refresh-button");

const book = new GuestbookBook({
  entries,
  status,
  loadMoreButton,
  api: listEntries
});

showEntrySkeleton(entries);

loadMoreButton.addEventListener("click", () => {
  book.load().catch(() => {});
});

refreshButton.addEventListener("click", () => {
  book.load({ reset: true }).catch(() => {});
});

const configPromise = getConfig().catch(() => ({ turnstileSiteKey: "" }));

setupSigningForm({
  form: document.getElementById("sign-form"),
  status: document.getElementById("form-status"),
  submitButton: document.getElementById("submit-button"),
  characterCount: document.getElementById("character-count"),
  api: submitEntry,
  getSiteKey: async () => (await configPromise).turnstileSiteKey
});

book.load({ reset: true }).catch(() => {});

const mobileTabs = document.querySelectorAll(".mobile-tab");
const pages = document.querySelectorAll(".book-page");

function selectMobilePage(targetId) {
  pages.forEach((page) => page.classList.toggle("is-active", page.id === targetId));
  mobileTabs.forEach((tab) => {
    const active = tab.dataset.pageTarget === targetId;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

mobileTabs.forEach((tab) => {
  tab.addEventListener("click", () => selectMobilePage(tab.dataset.pageTarget));
});

const adminDialog = document.getElementById("admin-dialog");
const adminTrigger = document.getElementById("admin-trigger");
const adminLogin = document.getElementById("admin-login");
const adminStatus = document.getElementById("admin-status");

adminTrigger.addEventListener("click", () => {
  if (typeof adminDialog.showModal === "function") {
    adminDialog.showModal();
  }
});

adminLogin.addEventListener("click", () => {
  adminStatus.textContent = "Administration is not enabled on this public build.";
  adminStatus.className = "form-status";
});
