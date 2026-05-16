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

    var togglePwApi = document.getElementById('toggle-pw-api');
    if (togglePwApi) {
        togglePwApi.addEventListener('click', function () {
            var input = document.getElementById('api-key');
            input.type = input.type === 'password' ? 'text' : 'password';
        });
    }

    var togglePwPass = document.getElementById('toggle-pw-pass');
    if (togglePwPass) {
        togglePwPass.addEventListener('click', function () {
            var input = document.getElementById('password');
            input.type = input.type === 'password' ? 'text' : 'password';
        });
    }

    var isLogin = false;
    var toggleAuthBtn = document.getElementById('toggle-auth');
    if (toggleAuthBtn) {
        toggleAuthBtn.addEventListener('click', function () {
            isLogin = !isLogin;
            document.getElementById('auth-title').textContent = isLogin ? 'Login to Realm' : 'Roleplay Realm';
            document.getElementById('auth-subtitle').textContent = isLogin ? 'Welcome back to your account.' : 'Enter your details to begin.';
            document.getElementById('api-key-container').style.display = isLogin ? 'none' : 'block';
            document.getElementById('api-hint').style.display = isLogin ? 'none' : 'block';
            document.getElementById('auth-submit').textContent = isLogin ? 'Login' : 'Create Account';
            toggleAuthBtn.innerHTML = isLogin ? 'Don\'t have an account? <span class="text-blue-400 font-semibold">Create one</span>' : 'Already have an account? <span class="text-blue-400 font-semibold">Login</span>';
            document.getElementById('error-msg').classList.add('hidden');
        });
    }

    var form = document.getElementById('auth-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var username = document.getElementById('username').value.trim();
            var apiKey = document.getElementById('api-key').value.trim();
            var password = document.getElementById('password').value.trim();
            var errorMsg = document.getElementById('error-msg');
            
            var users = JSON.parse(localStorage.getItem('rp_users')) || {};

            if (isLogin) {
                if (!username || !password) {
                    errorMsg.textContent = 'Please fill in all fields.';
                    errorMsg.classList.remove('hidden');
                    return;
                }
                if (!users[username]) {
                    errorMsg.textContent = 'Account not found. Please create one.';
                    errorMsg.classList.remove('hidden');
                    return;
                }
                if (users[username].password !== password) {
                    errorMsg.textContent = 'Incorrect password.';
                    errorMsg.classList.remove('hidden');
                    return;
                }
                localStorage.setItem('rp_active_user', username);
                window.location.href = 'main.html';
            } else {
                if (!username || !apiKey || !password) {
                    errorMsg.textContent = 'Please fill in all fields.';
                    errorMsg.classList.remove('hidden');
                    return;
                }
                if (!apiKey.startsWith('AIza')) {
                    errorMsg.textContent = 'Invalid Gemini API key format.';
                    errorMsg.classList.remove('hidden');
                    return;
                }
                if (users[username]) {
                    errorMsg.textContent = 'Username already exists. Please login.';
                    errorMsg.classList.remove('hidden');
                    return;
                }
                users[username] = {
                    password: password,
                    api_key: apiKey,
                    avatar: ''
                };
                localStorage.setItem('rp_users', JSON.stringify(users));
                localStorage.setItem('rp_active_user', username);
                window.location.href = 'main.html';
            }
        });
    }
})();
