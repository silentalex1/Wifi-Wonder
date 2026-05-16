(function () {
    var canvas = document.getElementById('bg-canvas');
    if (canvas) {
        var ctx = canvas.getContext('2d');
        var W = (canvas.width = window.innerWidth);
        var H = (canvas.height = window.innerHeight);
        var particles = [];
        for (var i = 0; i < 70; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 1.2 + 0.4,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                alpha: Math.random() * 0.4 + 0.15
            });
        }
        function draw() {
            ctx.clearRect(0, 0, W, H);
            particles.forEach(function (p) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = W;
                if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H;
                if (p.y > H) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(99,102,241,' + p.alpha + ')';
                ctx.fill();
            });
            requestAnimationFrame(draw);
        }
        draw();
        window.addEventListener('resize', function () {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        });
    }

    var togglePw = document.getElementById('toggle-pw');
    if (togglePw) {
        togglePw.addEventListener('click', function () {
            var input = document.getElementById('api-key');
            input.type = input.type === 'password' ? 'text' : 'password';
        });
    }

    var form = document.getElementById('auth-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var username = document.getElementById('username').value.trim();
            var apiKey = document.getElementById('api-key').value.trim();
            var errorMsg = document.getElementById('error-msg');
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
            errorMsg.classList.add('hidden');
            localStorage.setItem('rp_username', username);
            localStorage.setItem('rp_api_key', apiKey);
            window.location.href = 'main.html';
        });
    }
})();
