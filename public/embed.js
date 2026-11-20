const WIDGET_ORIGIN = "https://honktavern-guestbook.muddles-net.workers.dev";

async function loadGuestbook(target) {
  if (target.dataset.honkGuestbookLoaded === "true") return;

  target.id = "honk-tavern-guestbook";
  target.classList.add("honk-tavern-guestbook");
  target.dataset.honkGuestbookLoaded = "loading";

  const [markupResponse] = await Promise.all([
    fetch(new URL("/embed.html", WIDGET_ORIGIN), { credentials: "omit" }),
    loadStylesheet(new URL("/css/embed.css", WIDGET_ORIGIN).href)
  ]);

  if (!markupResponse.ok) {
    throw new Error("The Honk Tavern Message Book could not be loaded.");
  }

  target.insertAdjacentHTML("beforeend", await markupResponse.text());

  await import(new URL("/js/app.js", WIDGET_ORIGIN).href);
  target.dataset.honkGuestbookLoaded = "true";
}

function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[data-honk-guestbook-style="${href}"]`);
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.honkGuestbookStyle = href;
    link.onload = resolve;
    link.onerror = () => reject(new Error("The Honk Tavern Message Book styles could not be loaded."));
    document.head.appendChild(link);
  });
}

function start() {
  const targets = [...document.querySelectorAll("[data-honk-tavern-guestbook]")];

  if (targets.length === 0) {
    const script = document.currentScript;
    const target = document.createElement("div");
    if (script?.parentNode) script.parentNode.insertBefore(target, script);
    else document.body.appendChild(target);
    targets.push(target);
  }

  targets.reduce(
    (chain, target) => chain.then(() => loadGuestbook(target)),
    Promise.resolve()
  ).catch((error) => {
    console.error("[Honk Tavern Guestbook]", error);
  });
}

start();
