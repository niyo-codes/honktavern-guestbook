export function showEntrySkeleton(container, count = 4) {
  container.innerHTML = "";

  for (let i = 0; i < count; i += 1) {
    const item = document.createElement("div");
    item.className = "entry-skeleton";
    item.innerHTML = `
      <div class="skeleton-line skeleton-line--short"></div>
      <div class="skeleton-line skeleton-line--long"></div>
      <div class="skeleton-line skeleton-line--long"></div>
    `;
    container.appendChild(item);
  }
}
