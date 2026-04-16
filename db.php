<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$DATABASE_URL = getenv('DATABASE_URL');

try {
    $url = parse_url($DATABASE_URL);

    if (!$url) {
        throw new Exception("Invalid DATABASE_URL");
    }

    $host = $url['host'];
    $port = $url['port'] ?? 5432;
    $dbname = ltrim($url['path'], '/');
    $user = $url['user'];
    $pass = $url['pass'];

    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";

    $db = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
    die();
}

// Create table
$db->exec("
CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
");
