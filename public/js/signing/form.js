import {
  ensureTurnstile,
  getTurnstileToken,
  resetTurnstile
} from "./turnstile.js";

export function setupSigningForm({
  form,
  status,
  submitButton,
  characterCount,
  api,
  getSiteKey
}) {
  const name = form.elements.namedItem("name");
  const message = form.elements.namedItem("message");
  const website = form.elements.namedItem("website");
  const turnstileSlot = document.getElementById("turnstile-slot");
  let verificationReady = false;

  message.addEventListener("input", () => {
    characterCount.textContent = `${message.value.length} / 350`;
  });

  async function loadVerification() {
    if (verificationReady) return;

    const siteKey = await getSiteKey();
    if (!siteKey) throw new Error("Turnstile is not configured yet.");

    await ensureTurnstile(siteKey, turnstileSlot);
    verificationReady = true;
  }

  ["focus", "pointerdown"].forEach((eventName) => {
    form.addEventListener(
      eventName,
      () => {
        loadVerification().catch((error) => {
          status.textContent = error.message;
          status.className = "form-status status-error";
        });
      },
      { once: true }
    );
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    status.className = "form-status";
    submitButton.disabled = true;

    try {
      await loadVerification();
      const result = await api({
        name: name.value,
        message: message.value,
        website: website.value,
        turnstileToken: getTurnstileToken()
      });

      form.reset();
      characterCount.textContent = "0 / 350";
      resetTurnstile();
      status.textContent = "Your note is in the book!";
      status.className = "form-status status-success";
      return result;
    } catch (error) {
      status.textContent = error.message;
      status.className = "form-status status-error";
      throw error;
    } finally {
      submitButton.disabled = false;
    }
  });
}