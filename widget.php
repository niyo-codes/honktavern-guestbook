<?php $config = require __DIR__ . '/config.php'; ?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>
body {
    margin: 0;
    font-family: 'Trebuchet MS', cursive;
    background: transparent;
    color: #f5c76b;
}

h2 {
    text-align: center;
    color: #ffb347;
}

input, textarea, button {
    width: 100%;
    margin: 5px 0;
    padding: 8px;
    border: none;
    border-radius: 6px;
}

button {
    background: #ffb347;
    cursor: pointer;
}

.entry {
    border-top: 1px solid rgba(255,255,255,0.2);
    padding: 8px 0;
}

small {
    color: #aaa;
}
</style>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>

<body>

<h2>📖 Tavern Guestbook</h2>

<form id="form">
    <input name="name" placeholder="Adventurer Name" required>
    <textarea name="message" placeholder="Leave your mark..." required></textarea>

    <input type="text" name="website" style="display:none">

    <div class="cf-turnstile" data-sitekey="<?= $config['turnstile_site'] ?>"></div>

    <button>Sign the Book</button>
</form>

<div id="entries"></div>

<script>
async function loadEntries() {
    const res = await fetch('api.php?action=list');
    const data = await res.json();

    const container = document.getElementById('entries');
    container.innerHTML = '';

    data.forEach(e => {
        container.innerHTML += `
            <div class="entry">
                <strong>${e.name}</strong><br>
                <small>${e.created_at}</small>
                <p>${e.message}</p>
            </div>
        `;
    });

    resize();
}

document.getElementById('form').onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const res = await fetch('api.php?action=sign', {
        method: 'POST',
        body: formData
    });

    const result = await res.json();

    if (result.error) {
        alert(result.error);
    } else {
        e.target.reset();
        loadEntries();
    }
};

function resize() {
    window.parent.postMessage({ guestbookHeight: document.body.scrollHeight }, "*");
}

window.onload = loadEntries;
window.onresize = resize;
</script>

</body>
</html>