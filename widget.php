<?php 
        $config = require __DIR__ . '/config.php'; 
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: 'Trebuchet MS', cursive;
    background: transparent;
    color: #f5c76b;
}

h2 {
    text-align: center;
    color: #ffb347;
    margin: 15px 0 10px 0;
    font-size: 1.5em;
}

.guestbook-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-height: 100vh;
}

#entries {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 8px;
    scroll-behavior: smooth;
}

#entries::-webkit-scrollbar {
    width: 8px;
}

#entries::-webkit-scrollbar-track {
    background: transparent;
}

#entries::-webkit-scrollbar-thumb {
    background: #ffb347;
    border-radius: 4px;
}

#entries::-webkit-scrollbar-thumb:hover {
    background: #ffc966;
}

#entries {
    scrollbar-color: #ffb347 transparent;
    scrollbar-width: thin;
}

.entry {
    border-top: 1px solid rgba(255,255,255,0.2);
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    background: rgba(20, 15, 10, 0.6);
    backdrop-filter: blur(4px);
    animation: fadeIn 0.3s ease-in;
}

.entry:first-child {
    border-top: none;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.entry strong {
    color: #ffb347;
    font-size: 1.05em;
}

small {
    color: rgba(255, 200, 120, 0.75);
    font-size: 0.85em;
    display: block;
    margin-top: 2px;
}

#form {
    padding: 12px 8px;
    border-top: 1px solid rgba(255,255,255,0.2);
    background: rgba(0,0,0,0.1);
}

input, textarea, button {
    width: 100%;
    margin: 5px 0;
    padding: 10px;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 6px;
    background: rgba(255,255,255,0.1);
    color: #f5c76b;
    font-family: inherit;
    font-size: 1em;
}

input::placeholder, textarea::placeholder {
    color: rgba(255,200,100,0.6);
}

textarea {
    resize: vertical;
    min-height: 60px;
    max-height: 100px;
}

button {
    background: #ffb347;
    color: #2d2d2d;
    cursor: pointer;
    font-weight: bold;
    border: none;
    transition: background 0.2s;
}

button:hover {
    background: #ffc966;
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
}

.loading {
    text-align: center;
    color: #ffb347;
    padding: 10px;
    font-size: 0.9em;
}

.error {
    background: rgba(255,100,100,0.2);
    color: #ff6b6b;
    padding: 8px;
    border-radius: 4px;
    margin-bottom: 8px;
    display: none;
}

.error.show {
    display: block;
}
</style>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>

<body>

<div class="guestbook-container">
    <h2>📖 Guestbook</h2>
    
    <div id="entries"></div>
    
    <form id="form">
        <div class="error" id="errorMsg"></div>
        
        <input name="name" placeholder="May Springflower @ World" required minlength="2" maxlength="100">
        <textarea name="message" placeholder="A gil for your thoughts? Perhaps?" required minlength="10" maxlength="350"></textarea>
        <div id="charCount" style="font-size:0.8em;color:#aaa;text-align:right;">0 / 350</div>
        <script>
            const textarea = document.querySelector('textarea[name="message"]');
            const counter = document.getElementById('charCount');
            textarea.addEventListener('input', () => {
            counter.textContent = `${textarea.value.length} / 350`;});
        </script>
        <div class="cf-turnstile" data-sitekey="<?= $config['turnstile_site'] ?>"></div>

        <button type="submit" id="submitBtn">Sign the Book</button>
    </form>
</div>

<script>

document.addEventListener('DOMContentLoaded', () => {
    const API = 'api.php';
    const ENTRIES_PER_PAGE = 5;
    let allEntries = [];
    let displayedEntries = 0;
    let isLoading = false;
    let resizeTimeout;
    let newestEntryId = null;

    async function initializeCsrfToken() {
        try {
            const res = await fetch(`${API}?action=list`);
            if (!res.ok) return;
            
            const data = await res.json();
            if (!Array.isArray(data)) return;

            // Try to get CSRF from meta tag or document cookie
            const metaTag = document.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                document.getElementById('csrfToken').value = metaTag.content;
            }
        } catch (err) {
            console.warn('CSRF initialization skipped, will use session-based token');
        }
    }

    async function checkForNewEntries() {
        try {
            const res = await fetch(`${API}?action=list`);
            if (!res.ok) return;
            
            const data = await res.json();
            if (!Array.isArray(data) || !data.length) return;

            const latestId = data[0].id;

            if (latestId !== newestEntryId) {
                const newEntries = data.filter(e => e.id > (newestEntryId || 0));

                if (newEntries.length > 0) {
                    prependEntries(newEntries);
                    newestEntryId = latestId;
                }
            }

        } catch (err) {
            console.error('Realtime check failed:', err);
        }
    }

    async function loadAllEntries() {
        try {
            if (allEntries.length > 0) {
                newestEntryId = allEntries[0].id;
            }    
            const res = await fetch(`${API}?action=list`);
            if (!res.ok) throw new Error('Failed to load entries');
            
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error('Invalid response format');
            
            allEntries = data;
            displayedEntries = 0;
            
            const container = document.getElementById('entries');
            container.innerHTML = '';
            
            if (allEntries.length > 0) {
                newestEntryId = allEntries[0].id;
            }

            loadMoreEntries();
            setupIntersectionObserver();
        } catch (error) {
            console.error('Error loading entries:', error);
        }
    }

    function prependEntries(entries) {
        const container = document.getElementById('entries');

        const isAtTop = container.scrollTop < 50;

        entries.reverse().forEach(e => {
            const entryEl = document.createElement('div');
            entryEl.className = 'entry';

            const name = document.createElement('strong');
            name.textContent = e.name;

            const date = document.createElement('small');
            date.textContent = e.created_at;

            const msg = document.createElement('p');
            msg.textContent = e.message;

            entryEl.appendChild(name);
            entryEl.appendChild(document.createElement('br'));
            entryEl.appendChild(date);
            entryEl.appendChild(msg);

            container.prepend(entryEl);
        });

        if (isAtTop) {
            container.scrollTop = 0;
        }

        resize();
    }

    function loadMoreEntries() {
        if (isLoading || displayedEntries >= allEntries.length) return;
        
        isLoading = true;
        const container = document.getElementById('entries');
        const startIdx = displayedEntries;
        const endIdx = Math.min(displayedEntries + ENTRIES_PER_PAGE, allEntries.length);
        
        for (let i = startIdx; i < endIdx; i++) {
            const e = allEntries[i];
            const entryEl = document.createElement('div');
            entryEl.className = 'entry';
            
            const name = document.createElement('strong');
            name.textContent = e.name;
            
            const date = document.createElement('small');
            date.textContent = e.created_at;
            
            const msg = document.createElement('p');
            msg.textContent = e.message;
            
            entryEl.appendChild(name);
            entryEl.appendChild(document.createElement('br'));
            entryEl.appendChild(date);
            entryEl.appendChild(msg);
            
            container.appendChild(entryEl);
        }
        
        displayedEntries = endIdx;
        isLoading = false;
        requestAnimationFrame(resize);
    }
    
    function setupIntersectionObserver() {
        const oldSentinel = document.getElementById('sentinel');
        if (oldSentinel) oldSentinel.remove();
        
        const container = document.getElementById('entries');
        const sentinel = document.createElement('div');
        sentinel.id = 'sentinel';
        container.appendChild(sentinel);
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && displayedEntries < allEntries.length) {
                    loadMoreEntries();
                }
            });
        }, { root: container, rootMargin: '100px' });
        
        observer.observe(sentinel);
    }
    
    document.getElementById('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('submitBtn');
        const errorDiv = document.getElementById('errorMsg');
        
        btn.disabled = true;
        errorDiv.classList.remove('show');
        
        try {
            const formData = new FormData(e.target);
            
            const res = await fetch(`${API}?action=sign`, {
                method: 'POST',
                body: formData
            });
            
            const result = await res.json();
            
            if (result.error) {
                errorDiv.textContent = result.error;
                errorDiv.classList.add('show');
            } else if (result.success) {
                e.target.reset();
                document.getElementById('charCount').textContent = '0 / 350';
                
                if (window.turnstile && typeof window.turnstile.reset === 'function') {
                    window.turnstile.reset();
                }
                
                await loadAllEntries();
            } else {
                errorDiv.textContent = 'Unexpected response. Please try again.';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = 'Failed to submit. Please try again.';
            errorDiv.classList.add('show');
            console.error('Submit error:', error);
        } finally {
            btn.disabled = false;
        }
    });

    function resize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            try {
                if (window.parent !== window) {
                    window.parent.postMessage({ 
                        guestbookHeight: document.body.scrollHeight 
                    }, window.location.origin);
                }
            } catch (e) {
                console.warn('postMessage failed:', e);
            }
        }, 250);
    }

    initializeCsrfToken();
    loadAllEntries();
    window.addEventListener('resize', resize);
    setInterval(checkForNewEntries, 5000);
});
</script>

</body>
</html>
