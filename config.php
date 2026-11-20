<?php
// Legacy runtime compatibility only.
// Secrets must be supplied by the hosting environment.
// The Cloudflare Worker does not use this file.

return [
    'admin_password' => getenv('ADMIN_PASSWORD') ?: '',
    'turnstile_secret' => getenv('TURNSTILE_SECRET') ?: '',
    'turnstile_site' => getenv('TURNSTILE_SITE') ?: '',
    'rate_limit_seconds' => (int)(getenv('RATE_LIMIT_SECONDS') ?: 5),
    'max_entries' => (int)(getenv('MAX_ENTRIES') ?: 20)
];
