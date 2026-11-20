import { listEntries, submitEntry } from "./api/guestbook-api.js";
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

setupSigningForm({
  form: document.getElementById("sign-form"),
  status: document.getElementById("form-status"),
  submitButton: document.getElementById("submit-button"),
  characterCount: document.getElementById("character-count"),
  api: submitEntry
});
book.load({ reset: true }).catch(() => {});
