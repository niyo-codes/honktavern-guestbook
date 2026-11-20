export function showRetryState(container, message, onRetry) {
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "retry-card";

  const text = document.createElement("p");
  text.textContent = message;

  const button = document.createElement("button");
  button.className = "button-secondary";
  button.type = "button";
  button.textContent = "Try again";
  button.addEventListener("click", onRetry);

  card.append(text, button);
  container.appendChild(card);
}
