<?php
session_start();
 
$config = require __DIR__ . '/config.php';
require __DIR__ . '/db.php';
 
header('Content-Type: application/json');
 
// Helper: Get client IP (handles proxy scenarios)
function getClientIP() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

 
$action = $_GET['action'] ?? '';
 
try {
    if ($action === 'list') {
    $stmt = $db->query('SELECT id, name, message, created_at, timezone FROM entries ORDER BY created_at DESC');
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert timestamps to user's timezone
    foreach ($entries as &$entry) {
        $dt = new DateTime($entry['created_at'], new DateTimeZone('UTC'));
        $dt->setTimezone(new DateTimeZone($entry['timezone']));
        $entry['created_at'] = $dt->format('Y-m-d H:i:s');
    }
    
    echo json_encode($entries);
    exit;

    }
    if ($action === 'delete') {
        $id = $_POST['id'] ?? null;
        if (!$id) {
            throw new Exception('Missing ID');
        }
        
        // delete query 
        $stmt = $db->prepare('DELETE FROM entries WHERE id = ?');
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
        exit;  // 
    } 
 
    if ($action === 'sign') {
        // Enforce POST method
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        } 
        $name = trim($_POST['name'] ?? '');
        $message = trim($_POST['message'] ?? '');
        $timezone = $_POST['timezone'] ?? 'UTC';  // fallback to UTC
     
        if (!$name || !$message) {
            echo json_encode(['error' => 'Missing fields']);
            exit;
        }
 
        $nameLen = strlen($name);
        if ($nameLen < 2 || $nameLen > 100) {
            echo json_encode(['error' => 'Name must be 2-100 characters']);
            exit;
        }
 
        $messageLen = strlen($message);
        if ($messageLen < 10 || $messageLen > 350) {
            echo json_encode(['error' => 'Message must be 10-350 characters']);
            exit;
        }
 
        // Honeypot
        if (!empty($_POST['website'])) {
            echo json_encode(['error' => 'Spam detected']);
            exit;
        }
 
        // Rate limit (check BEFORE any processing)
        $ip = getClientIP();
        $rateFile = sys_get_temp_dir() . "/rate_" . md5($ip);
 
        if (file_exists($rateFile) && time() - filemtime($rateFile) < $config['rate_limit_seconds']) {
            http_response_code(429);
            echo json_encode(['error' => 'Please wait before signing again']);
            exit;
        }
 
        // Turnstile verification (required)
        $response = $_POST['cf-turnstile-response'] ?? '';
 
        if (!$config['turnstile_secret']) {
            http_response_code(500);
            echo json_encode(['error' => 'Server configuration error']);
            exit;
        }
 
        if (empty($response)) {
            echo json_encode(['error' => 'Verification required']);
            exit;
        }
 
        $verify = @file_get_contents("https://challenges.cloudflare.com/turnstile/v0/siteverify", false,
            stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-type: application/x-www-form-urlencoded\r\nTimeout: 5",
                    'content' => http_build_query([
                        'secret' => $config['turnstile_secret'],
                        'response' => $response
                    ]),
                    'timeout' => 5
                ]
            ])
        );
 
        if ($verify === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Verification service unavailable']);
            exit;
        }
 
        $result = json_decode($verify, true);
        if (empty($result['success'])) {
            echo json_encode(['error' => 'Verification failed']);
            exit;
        }
 
        // Set rate limit AFTER all validations pass
        touch($rateFile);
 
        // Insert entry
        $stmt = $db->prepare("INSERT INTO entries (name, message, timezone) VALUES (?, ?, ?)");
        $stmt->execute([$name, $message, $timezone]);
 
        echo json_encode(['success' => true, 'message' => 'Entry signed successfully']);
        exit;
    }
    else
    { 
      // Unknown action
      http_response_code(400);
      echo json_encode(['error' => 'Invalid action']);
      exit;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
    exit;
}

