document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const apiKey = document.getElementById('api-key').value.trim();
    const errorMsg = document.getElementById('error-msg');

    if (!username || !apiKey) {
        errorMsg.textContent = 'Please fill in all fields.';
        errorMsg.classList.remove('hidden');
        return;
    }

    if (!apiKey.startsWith('AIza')) {
        errorMsg.textContent = 'Invalid Gemini API key format.';
        errorMsg.classList.remove('hidden');
        return;
    }

    localStorage.setItem('rp_username', username);
    localStorage.setItem('rp_api_key', apiKey);
    
    window.location.href = 'main.html';
});
