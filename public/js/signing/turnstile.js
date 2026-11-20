let widgetId = null;

export async function ensureTurnstile(siteKey, container) {
  if (!siteKey) throw new Error("Turnstile site key is not configured.");

  await new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load verification."));
    document.head.appendChild(script);
  });

  if (widgetId !== null) {
    window.turnstile.reset(widgetId);
    return;
  }

  widgetId = window.turnstile.render(container, {
    sitekey: siteKey,
    theme: "light"
  });
}

export function getTurnstileToken() {
  if (widgetId === null || !window.turnstile) return "";
  return window.turnstile.getResponse(widgetId);
}

export function resetTurnstile() {
  if (widgetId !== null && window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}