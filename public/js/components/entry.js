export function renderEntry(entry) {
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
