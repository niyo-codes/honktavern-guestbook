<?php
// Load environment variables from .env file
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database connection variables
$DATABASE_URL = getenv('DATABASE_URL');

try {
    // Add pgsql: prefix for PostgreSQL
    $db = new PDO('pgsql:' . $DATABASE_URL);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
    die();
}

// Create table
$db->exec("CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");
?>
