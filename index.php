<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

define('APP_RUNNING', true);

session_start();

// ---- CONFIG ----
require __DIR__ . '/db.php';
$config = require __DIR__ . '/config.php';

$secret = $config['turnstile_secret'];
$site = $config['turnstile_site'];
// Optional external CSS
$css = $_GET['css'] ?? null;

// ---- DB SETUP ----
$db = new PDO('sqlite:guestbook.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

$error = null;
$success = null;

// Track form load time
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $_SESSION['form_time'] = time();
}

// ---- HANDLE SUBMISSION ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Rate limiting
    $ip = $_SERVER['REMOTE_ADDR'];
    $rateFile = sys_get_temp_dir() . "/rate_" . md5($ip);

    if (file_exists($rateFile) && time() - filemtime($rateFile) < 10) {
        $error = "You're submitting too quickly.";
    } else {
        touch($rateFile);
    }

    // Timing check
    if (!$error) {
        $formTime = $_SESSION['form_time'] ?? 0;
        if ($formTime && time() - $formTime < 3) {
            $error = "Submission too fast.";
        }
    }

    // Honeypot
    if (!$error && !empty($_POST['website'])) {
        $error = "Spam detected.";
    }

    // Turnstile
    if (!$error) {
        $response = $_POST['cf-turnstile-response'] ?? '';

        $verify = @file_get_contents(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            false,
            stream_context_create([
                'http' => [
                    'method'  => 'POST',
                    'header'  => "Content-type: application/x-www-form-urlencoded",
                    'content' => http_build_query([
                        'secret' => $config['turnstile_secret'], 
                        'response' => $response,
                        'remoteip' => $_SERVER['REMOTE_ADDR']
                    ])
                ]
            ])
        );

        if (!$verify) {
            $error = "Verification failed. Try again.";
        } else {
            $result = json_decode($verify, true);
            if (empty($result['success'])) {
                $error = "Turnstile verification failed.";
            }
        }
    }

    // Validate + insert
    if (!$error) {
        $name = trim($_POST['name']);
        $message = trim($_POST['message']);

        if (!$name || !$message) {
            $error = "All fields are required.";
        } elseif (strlen($name) > 100 || strlen($message) > 1000) {
            $error = "Input too long.";
        } else {
            $stmt = $db->prepare("INSERT INTO entries (name, message) VALUES (?, ?)");
            $stmt->execute([$name, $message]);
            $success = "Signed the guestbook!";
        }
    }
}

// Fetch entries
$entries = $db->query("SELECT * FROM entries ORDER BY id DESC LIMIT 50")
              ->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Embed Guestbook</title>

<?php if ($css): ?>
<link rel="stylesheet" href="<?= htmlspecialchars($css) ?>">
<?php endif; ?>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>

<h2>Guestbook</h2>

<?php if ($error): ?>
<p style="color:red;"><?= htmlspecialchars($error) ?></p>
<?php endif; ?>

<?php if ($success): ?>
<p style="color:lime;"><?= htmlspecialchars($success) ?></p>
<?php endif; ?>

<form method="POST">
    <input type="text" name="name" placeholder="Name" required><br>
    <textarea name="message" placeholder="Message" required></textarea><br>

    <!-- honeypot -->
    <input type="text" name="website" style="display:none">

   <div class="cf-turnstile" data-sitekey="<?= htmlspecialchars($config['turnstile_site']) ?>"></div>

    <button type="submit">Sign</button>
</form>

<hr>

<?php foreach ($entries as $entry): ?>
<div class="entry">
    <strong><?= htmlspecialchars($entry['name']) ?></strong><br>
    <small><?= $entry['created_at'] ?></small>
    <p><?= nl2br(htmlspecialchars($entry['message'])) ?></p>
</div>
<?php endforeach; ?>

</body>
</html>