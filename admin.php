<?php
session_start();
$config = require __DIR__ . '/config.php';

// ---- LOGOUT ----
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: " . $_SERVER['PHP_SELF']);
    exit;
}

// ---- LOGIN ----
if (!($_SESSION['admin'] ?? false)) {

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (hash_equals($config['admin_password'], $_POST['pass'] ?? '')) {
            $_SESSION['admin'] = true;
            header("Location: " . $_SERVER['PHP_SELF']);
            exit;
        } else {
            $error = "Invalid password";
        }
    }
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Guestbook Admin</title>
<style>
body {
    font-family: system-ui, sans-serif;
    background: #111;
    color: #eee;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
form {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 8px;
}
input, button {
    width: 100%;
    padding: 10px;
    margin-top: 10px;
}
.error {
    color: #ff6b6b;
}
</style>
</head>
<body>

<form method="POST">
    <h3>Admin Login</h3>
    <?php if (!empty($error)): ?>
        <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <input type="password" name="pass" placeholder="Password" required>
    <button>Login</button>
</form>

</body>
</html>
<?php
exit;
}
?>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Guestbook Admin</title>

<style>
body {
    font-family: system-ui, sans-serif;
    background: #111;
    color: #eee;
    margin: 0;
    padding: 20px;
}

h2 {
    margin-top: 0;
}

.topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

button {
    padding: 6px 10px;
    cursor: pointer;
}

.entry {
    background: #1a1a1a;
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 6px;
}

small {
    color: #aaa;
    display: block;
    margin-top: 4px;
}

.actions {
    margin-top: 8px;
}

.actions button {
    background: #ff6b6b;
    border: none;
    color: white;
    border-radius: 4px;
}
</style>
</head>

<body>

<div class="topbar">
    <h2>Guestbook Admin</h2>
    <a href="?logout=1"><button>Logout</button></a>
</div>

<div id="entries"></div>

<script>
const API = 'api.php';

// ---- LOAD ENTRIES ----
async function loadEntries() {
    const res = await fetch(`${API}?action=list`);
    const data = await res.json();

    const container = document.getElementById('entries');
    container.innerHTML = '';

    data.forEach(e => {
        const div = document.createElement('div');
        div.className = 'entry';

        div.innerHTML = `
            <strong>${escapeHTML(e.name)}</strong>
            <small>${e.created_at}</small>
            <p>${escapeHTML(e.message)}</p>
            <div class="actions">
                <button onclick="deleteEntry(${e.id})">Delete</button>
            </div>
        `;

        container.appendChild(div);
    });
}

// ---- DELETE ----
async function deleteEntry(id) {
    if (!confirm("Delete this entry?")) return;

    const form = new FormData();
    form.append('id', id);

    const res = await fetch(`${API}?action=delete`, {
        method: 'POST',
        body: form
    });

    const data = await res.json();

    if (data.success) {
        loadEntries();
    } else {
        alert(data.error || 'Delete failed');
    }
}

// ---- ESCAPE ----
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ---- INIT ----
loadEntries();
</script>

</body>
</html>
