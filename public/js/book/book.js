export class GuestbookBook {
  constructor({ entries, status, previousButton, nextButton, pageIndicator, api, onAdminAction }) {
    this.entries = entries;
    this.status = status;
    this.previousButton = previousButton;
    this.nextButton = nextButton;
    this.pageIndicator = pageIndicator;
    this.api = api;
    this.onAdminAction = onAdminAction;
    this.pages = [];
    this.cursors = [null];
    this.pageIndex = 0;
    this.loading = false;
    this.resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => this.solveMessageOverflow())
      : null;
  }

  async start() {
    this.pages = [];
    this.cursors = [null];
    this.pageIndex = 0;
    await this.loadPage(0);
  }

  async nextPage() {
    if (this.loading) return;
    const current = this.pages[this.pageIndex];
    if (!current) return;

    if (this.pages[this.pageIndex + 1]) {
      this.pageIndex += 1;
      this.renderCurrent();
      return;
    }

    if (!current.nextCursor) return;
    this.cursors[this.pageIndex + 1] = current.nextCursor;
    await this.loadPage(this.pageIndex + 1);
  }

  previousPage() {
    if (this.pageIndex === 0 || this.loading) return;
    this.pageIndex -= 1;
    this.renderCurrent();
  }

  async loadPage(index) {
    this.loading = true;
    this.status.textContent = "Turning the page…";
    this.status.className = "entries-status";

    try {
      const page = await this.api(this.cursors[index] ?? null);
      this.pages[index] = page;
      this.pageIndex = index;
      this.renderCurrent();
    } catch (error) {
      this.status.textContent = error.message;
      this.status.className = "entries-status status-error";
      throw error;
    } finally {
      this.loading = false;
    }
  }

  renderCurrent() {
    const page = this.pages[this.pageIndex];
    this.entries.replaceChildren();

    if (!page || page.entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = this.pageIndex === 0
        ? "No notes yet. Be the first to leave one."
        : "No more notes.";
      empty.setAttribute("role", "listitem");
      this.entries.appendChild(empty);
    } else {
      page.entries.forEach((entry) => this.entries.appendChild(this.render(entry)));
    }

    this.status.textContent = "";
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver.observe(this.entries);
    }
    this.solveMessageOverflow();
    this.pageIndicator.textContent = String(this.pageIndex + 1);
    this.previousButton.disabled = this.pageIndex === 0;
    this.nextButton.disabled = !page?.nextCursor && !this.pages[this.pageIndex + 1];
  }

  render(entry) {
    const article = document.createElement("article");
    article.className = "entry";
    article.dataset.entryId = String(entry.id);
    article.setAttribute("role", "listitem");
    article.setAttribute("aria-label", `Message from ${entry.name}`);

    const name = document.createElement("h3");
    name.className = "entry-name";
    name.textContent = entry.name;

    const date = document.createElement("time");
    date.className = "entry-date";
    date.dateTime = new Date(entry.created_at).toISOString();
    date.textContent = new Date(entry.created_at).toLocaleString();

    if (entry.world) {
      const world = document.createElement("span");
      world.className = "entry-world";
      world.textContent = "@ " + entry.world;
      name.appendChild(world);
    }

    const message = document.createElement("p");
    message.className = "entry-message";
    message.textContent = this.normalizeMessageText(entry.message);

    article.append(name, date, message);

    if (this.onAdminAction) {
      const controls = document.createElement("div");
      controls.className = "entry-admin";
      controls.setAttribute("aria-label", `Moderation controls for ${entry.name}`);

      const actions = entry.moderation_status === "visible"
        ? [["hide", "–"], ["delete", "×"]]
        : entry.moderation_status === "hidden"
          ? [["restore", "↶"], ["delete", "×"]]
          : [];
      for (const [action, label] of actions) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.title = action === "hide"
          ? "Hide message"
          : action === "restore"
            ? "Restore message"
            : "Delete message";
        button.setAttribute("aria-label",
          action === "hide"
            ? `Hide message from ${entry.name}`
            : action === "restore"
              ? `Restore message from ${entry.name}`
              : `Delete message from ${entry.name}`);
        button.addEventListener("click", async () => {
          button.disabled = true;
          try {
            await this.onAdminAction(entry.id, action);
            await this.start();
          } finally {
            button.disabled = false;
          }
        });
        controls.appendChild(button);
      }

      article.appendChild(controls);
    }

    return article;
  }

  normalizeMessageText(value) {
    return String(value ?? "").replace(/\\n/g, "\n");
  }

  solveMessageOverflow() {
    const messages = this.entries.querySelectorAll(".entry-message");
    messages.forEach((message) => {
      message.classList.remove("entry-message--overflow");
      if (message.scrollWidth > message.clientWidth + 1 || message.scrollHeight > message.clientHeight + 1) {
        message.classList.add("entry-message--overflow");
      }
    });
  }
}
