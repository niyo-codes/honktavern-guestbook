<?php
return [
    'admin_password' => getenv('ADMIN_PASSWORD'),
    
    'turnstile_secret' => getenv('TURNSTILE_SECRET') ?: '0x4AAAAAAC-NnvMkLdWI9DdbC3jFlfhQ5d0',
    'turnstile_site' => getenv('TURNSTILE_SITE') ?: '0x4AAAAAAC-Nngrukiqg-dqQ',
    
    'rate_limit_seconds' => (int)(getenv('RATE_LIMIT_SECONDS') ?: 5),
    'max_entries' => (int)(getenv('MAX_ENTRIES') ?: 20)
];
?>
