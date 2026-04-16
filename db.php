<?php
// Load environment variables from .env file
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database connection variables
$DATABASE_URL = getenv('DATABASE_URL');

try {
    $db = new PDO($DATABASE_URL);
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}

// Create table
$db->exec("CREATE TABLE IF NOT EXISTS guests (\n    id SERIAL PRIMARY KEY,\n    name VARCHAR(100),\n    email VARCHAR(100) UNIQUE,\n    message TEXT,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n)");
?>
