import { CursorPager } from "./pagination.js";
import { requestPageTurn } from "./page-turn.js";

export class GuestbookBook {
  constructor({ entries, status, loadMoreButton, api }) {
    this.entries = entries;
    this.status = status;
    this.loadMoreButton = loadMoreButton;
    this.page = document.querySelector(".book-page--read");
    this.pager = new CursorPager(api);
  }

  async load({ reset = false } = {}) {
    if (reset) {
      this.pager.reset();
      this.entries.innerHTML = "";
    }

    this.status.textContent = "Loading the guestbook…";
    this.status.className = "entries-status";

    try {
      const rows = await this.pager.next();

      if (reset && rows?.length === 0) {
        this.entries.innerHTML =
          '<div class="empty-state">No notes yet. Be the first to leave one.</div>';
      } else if (rows) {
        rows.forEach((entry) => this.entries.appendChild(this.render(entry)));
      }

      this.status.textContent = "";
      this.loadMoreButton.hidden = !this.pager.hasMore;
      requestPageTurn(this.page);
    } catch (error) {
      this.status.textContent = error.message;
      this.status.className = "entries-status status-error";
      this.loadMoreButton.hidden = true;
      throw error;
    }
  }

  render(entry) {
    const article = document.createElement("article");
    article.className = "entry";

    const name = document.createElement("h3");
    name.className = "entry-name";
    name.textContent = entry.name;

    const date = document.createElement("time");
    date.className = "entry-date";
    date.dateTime = new Date(entry.created_at).toISOString();
    date.textContent = new Date(entry.created_at).toLocaleString();

    const message = document.createElement("p");
    message.className = "entry-message";
    message.textContent = entry.message;

    article.append(name, date, message);
    return article;
  }
}