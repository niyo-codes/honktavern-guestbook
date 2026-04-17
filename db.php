<?php


$DATABASE_URL = getenv('DATABASE_URL'); // Render provides this automatically

if (!$DATABASE_URL) {
    die('DATABASE_URL environment variable not set');
}

try {
    $url = parse_url($DATABASE_URL);

    if (!$url || !isset($url['host'], $url['user'], $url['pass'], $url['path'])) {
        throw new Exception("Invalid DATABASE_URL format");
    }

    $host = $url['host'];
    $port = $url['port'] ?? 5432;
    $dbname = ltrim($url['path'], '/');
    $user = $url['user'];
    $pass = $url['pass'];

    if (!$dbname) {
        throw new Exception("No database name provided in DATABASE_URL");
    }

    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require;application_name=guestbook";

    $db = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
        PDO::ATTR_PERSISTENT => false
    ]);

    // Initialize schema (idempotent)
    initializeSchema($db);

} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    die('Database connection error');
} catch (Exception $e) {
    error_log("Configuration error: " . $e->getMessage());
    die('Configuration error');
}

/**
 * Initialize database schema if needed
 * Safe to call multiple times (uses IF NOT EXISTS)
 */
function initializeSchema($db) {
    try {
        $db->exec("
            CREATE TABLE IF NOT EXISTS entries (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            )
        ");

        // Create index for performance on queries
        $db->exec("
            CREATE INDEX IF NOT EXISTS idx_entries_created_at 
            ON entries(created_at, DESC)
            
        ");

    } catch (PDOException $e) {
        error_log("Schema initialization failed: " . $e->getMessage());
        throw $e;
    }
}
