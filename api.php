<?php
session_start();

$config = require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'list') {
    $stmt = $db->query("SELECT * FROM entries ORDER BY id DESC LIMIT " . (int)$config['max_entries']);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($action === 'sign') {

    $name = trim($_POST['name'] ?? '');
    $message = trim($_POST['message'] ?? '');

    if (!$name || !$message) {
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    if (strlen($message) < 100 || strlen($message) > 350) {
    echo json_encode(['error' => 'Message too long (max 350 characters)']);
    exit;
}

    // Honeypot
    if (!empty($_POST['website'])) {
        echo json_encode(['error' => 'Spam detected']);
        exit;
    }

    // Rate limit
    $ip = $_SERVER['REMOTE_ADDR'];
    $rateFile = sys_get_temp_dir() . "/rate_" . md5($ip);

    if (file_exists($rateFile) && time() - filemtime($rateFile) < $config['rate_limit_seconds']) {
        echo json_encode(['error' => 'Too fast']);
        exit;
    }

    touch($rateFile);

    // Turnstile (optional fallback-safe)
    $response = $_POST['cf-turnstile-response'] ?? '';

    if ($config['turnstile_secret']) {
        $verify = file_get_contents("https://challenges.cloudflare.com/turnstile/v0/siteverify", false,
            stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-type: application/x-www-form-urlencoded",
                    'content' => http_build_query([
                        'secret' => $config['turnstile_secret'],
                        'response' => $response
                    ])
                ]
            ])
        );

        $result = json_decode($verify, true);
        if (empty($result['success'])) {
            echo json_encode(['error' => 'Verification failed']);
            exit;
        }
    }

    $stmt = $db->prepare("INSERT INTO entries (name, message) VALUES (?, ?)");
    $stmt->execute([$name, $message]);

    echo json_encode(['success' => true]);
    exit;
}
