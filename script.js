const UI = {
    el: (id) => document.getElementById(id),
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    scramble: (element, targetText, speed = 30) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
        return new Promise(resolve => {
            let iteration = 0;
            const interval = setInterval(() => {
                element.innerText = targetText
                    .split("")
                    .map((letter, index) => {
                        if(index < iteration) return targetText[index];
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("");
                
                if(iteration >= targetText.length) { 
                    clearInterval(interval);
                    resolve();
                }
                iteration += 1 / 3;
            }, speed);
        });
    }
};

const WifiCore = {
    getHardwareSignature: () => {
        const nav = navigator;
        const screen = window.screen;
        
        let glRenderer = "UNKNOWN_GPU";
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        } catch(e) {}

        const data = [
            nav.hardwareConcurrency,
            nav.deviceMemory || 4,
            nav.platform,
            nav.userAgent,
            screen.width,
            screen.height,
            screen.colorDepth,
            glRenderer,
            new Date().getTimezoneOffset()
        ].join('');
        
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).toUpperCase();
    },

    analyzeConnection: async () => {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const signature = WifiCore.getHardwareSignature();
        
        if (!conn) {
            return {
                ssid: `Link_${signature.substring(0,6)}`,
                password: `KEY-${signature}-X`,
                type: 'WIFI',
                speed: 100,
                latency: 20
            };
        }

        const effectiveType = (conn.effectiveType || 'wifi').toUpperCase();
        const rtt = conn.rtt || 25;
        const downlink = conn.downlink || 50;
        
        let ssidPrefix = "System_Link";
        if(effectiveType.includes('4G')) ssidPrefix = "LTE_Net";
        if(effectiveType.includes('5G')) ssidPrefix = "5G_Core";
        if(effectiveType === 'WIFI') ssidPrefix = "Home_Mesh";
        
        const generatedSSID = `${ssidPrefix}_${signature.substring(0, 4)}`;
        const generatedPass = `WPA3-${signature.substring(0, 4)}-${signature.substring(4, 8)}-${effectiveType}`;

        return {
            ssid: generatedSSID,
            password: generatedPass,
            type: effectiveType,
            speed: downlink,
            latency: rtt
        };
    }
};

async function initBackground() {
    const canvas = UI.el('signal-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if(this.x < 0) this.x = width;
            if(this.x > width) this.x = 0;
            if(this.y < 0) this.y = height;
            if(this.y > height) this.y = 0;
        }
        draw() {
            ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for(let i=0; i<60; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
        ctx.lineWidth = 1;
        for(let i=0; i<particles.length; i++) {
            for(let j=i; j<particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 80) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

async function requestPermission() {
    const modal = UI.el('permission-modal');
    const card = UI.el('perm-card');
    
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    card.style.transform = 'scale(1)';
    
    return new Promise((resolve) => {
        UI.el('perm-allow').onclick = () => {
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            card.style.transform = 'scale(0.9)';
            resolve(true);
        };
        UI.el('perm-deny').onclick = () => {
            resolve(false);
        };
    });
}

async function runNotificationSequence() {
    const card = UI.el('notify-card');
    const msg = UI.el('notify-msg');
    const dot = UI.el('notify-dot');
    const ping = UI.el('notify-ping');
    
    card.style.transform = 'translateY(0)';
    
    dot.className = "relative w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]";
    ping.className = "absolute inset-0 rounded-full animate-ping bg-red-500 opacity-75";
    msg.innerText = "checking for connection..";
    msg.className = "text-red-400 text-[10px] md:text-xs font-bold tracking-widest uppercase";
    card.className = "bg-slate-900/90 backdrop-blur-xl border border-red-500/30 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.2)] transform transition-all duration-500";

    await UI.wait(2000);
    
    dot.className = "relative w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_#eab308]";
    ping.className = "absolute inset-0 rounded-full animate-ping bg-yellow-500 opacity-75";
    msg.innerText = "connecting to internet..";
    msg.className = "text-yellow-400 text-[10px] md:text-xs font-bold tracking-widest uppercase";
    card.style.borderColor = "rgba(234,179,8,0.3)";

    await UI.wait(1500);

    dot.className = "relative w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]";
    ping.className = "absolute inset-0 rounded-full animate-ping bg-green-500 opacity-75";
    msg.innerText = "connected press the connect button!";
    msg.className = "text-green-400 text-[10px] md:text-xs font-bold tracking-widest uppercase";
    card.style.borderColor = "rgba(34,197,94,0.3)";
    card.style.boxShadow = "0 0 30px rgba(34,197,94,0.2)";

    await UI.wait(3000);
    card.style.transform = 'translateY(-250%)';
}

async function startSystem() {
    initBackground();
    
    const decryptEl = UI.el('decrypt-text');
    const bars = document.querySelectorAll('.wifi-bar');
    
    let interval = setInterval(() => {
        const chars = "XYZ0123456789";
        let str = "";
        for(let i=0; i<8; i++) str += chars[Math.floor(Math.random() * chars.length)];
        decryptEl.innerText = str;
    }, 50);

    await UI.wait(2500);
    clearInterval(interval);
    
    document.querySelector('.relative').classList.add('scramble-mode');
    
    await UI.wait(800);
    await UI.scramble(decryptEl, "SYSTEM READY");
    await UI.wait(1000);
    
    UI.el('startup-layer').classList.add('fade-out');
    UI.el('main-ui').style.opacity = '1';
    
    runNotificationSequence();
}

async function handleScan() {
    const btn = UI.el('connect-btn');
    const ring = UI.el('anim-ring');
    const label = UI.el('status-label');
    const svgCircle = ring.parentElement.querySelector('circle:first-child');
    
    const allowed = await requestPermission();
    if(!allowed) return;

    btn.style.pointerEvents = 'none';
    
    (async () => {
        try {
            const data = await WifiCore.analyzeConnection();
            
            ring.style.opacity = '1';
            const circumference = 2 * Math.PI * (svgCircle.r.baseVal.value);
            ring.style.strokeDasharray = `${circumference} ${circumference}`;
            
            await UI.scramble(label, "Checking if your connected to your wifi..");
            await UI.wait(1500);
            
            await UI.scramble(label, `Checking ${data.ssid} right now..`);
            await UI.wait(1800);
            
            await UI.scramble(label, `Successfully found the wifi password to ${data.ssid}.`);
            await UI.wait(1000);
            
            const stage = UI.el('action-stage');
            stage.style.opacity = '0';
            stage.style.transform = 'scale(0.95)';
            
            await UI.wait(1000);
            stage.style.display = 'none';
            
            const dash = UI.el('dashboard');
            dash.classList.remove('hidden');
            dash.classList.add('fade-in-up', 'grid');
            
            await UI.scramble(UI.el('wifi-name-display'), data.ssid);
            await UI.scramble(UI.el('wifi-pass-display'), data.password);
            
            UI.el('net-type').innerText = data.type;
            UI.el('net-speed').innerText = data.speed + " Mbps";
            
        } catch (e) {
            console.error(e);
        }
    })();
}

window.onload = startSystem;
UI.el('connect-btn').addEventListener('click', handleScan);
