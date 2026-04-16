<?php
session_start();
$config = require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

if (!isset($_SESSION['admin'])) {
    if ($_POST['pass'] ?? '' === $config['admin_password']) {
        $_SESSION['admin'] = true;
    } else {
        echo '<form method="POST"><input type="password" name="pass"><button>Login</button></form>';
        exit;
    }
}

if (isset($_GET['delete'])) {
    $stmt = $db->prepare("DELETE FROM entries WHERE id = ?");
    $stmt->execute([$_GET['delete']]);
}

$entries = $db->query("SELECT * FROM entries ORDER BY id DESC")->fetchAll();
?>

<h2>Guestbook Admin</h2>

<?php foreach ($entries as $e): ?>
<div>
    <strong><?= htmlspecialchars($e['name']) ?></strong>
    <p><?= htmlspecialchars($e['message']) ?></p>
    <a href="?delete=<?= $e['id'] ?>">Delete</a>
</div>
<?php endforeach; ?>