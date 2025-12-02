const UI = {
    el: (id) => document.getElementById(id),
    
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    scramble: (element, targetText) => {
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
            }, 30);
        });
    }
};

async function getWifiInfo() {
    try {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const nav = navigator;
        
        let derivedSSID = "Network_Link";
        if (connection) {
             derivedSSID = `${connection.effectiveType.toUpperCase()}_${Math.floor(connection.downlink * 100)}`;
        }
        
        const hw = nav.hardwareConcurrency || 4;
        const mem = nav.deviceMemory || 8;
        const seed = (hw * mem * 12345).toString(16).toUpperCase();
        
        return {
            ssid: `System_${derivedSSID}`,
            password: `KEY-${seed.substring(0, 4)}-${seed.substring(4, 8)}`
        };
    } catch (error) {
        return {
            ssid: "Unknown_Network",
            password: "ERROR-ACCESS-DENIED"
        };
    }
}

async function checkPermission() {
    const modal = UI.el('permission-modal');
    const card = UI.el('perm-card');
    const allowBtn = UI.el('perm-allow');
    const denyBtn = UI.el('perm-deny');

    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    card.style.transform = 'scale(1)';

    return new Promise((resolve) => {
        allowBtn.onclick = () => {
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            card.style.transform = 'scale(0.95)';
            resolve(true);
        };
        denyBtn.onclick = () => {
            alert("Permission denied. Unable to scan.");
            resolve(false);
        };
    });
}

async function runNotifications() {
    const banner = UI.el('notify-banner');
    const card = UI.el('notify-card');
    const dot = UI.el('notify-dot');
    const msg = UI.el('notify-msg');

    banner.style.transform = 'translateY(0)';
    
    card.className = "mt-6 px-8 py-3 rounded-full backdrop-blur-md border border-red-500/30 bg-red-900/20 flex items-center gap-3 shadow-lg transition-all duration-500";
    dot.className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
    msg.innerText = "checking for connection..";
    msg.className = "text-red-300 text-sm font-bold tracking-wide uppercase";
    
    await UI.wait(2500);

    msg.innerText = "connecting to internet..";
    card.className = "mt-6 px-8 py-3 rounded-full backdrop-blur-md border border-yellow-500/30 bg-yellow-900/20 flex items-center gap-3 shadow-lg transition-all duration-500";
    dot.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
    msg.className = "text-yellow-300 text-sm font-bold tracking-wide uppercase";

    await UI.wait(2000);

    msg.innerText = "connected press the connect button!";
    card.className = "mt-6 px-8 py-3 rounded-full backdrop-blur-md border border-green-500/30 bg-green-900/20 flex items-center gap-3 shadow-lg transition-all duration-500";
    dot.className = "w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]";
    msg.className = "text-green-300 text-sm font-bold tracking-wide uppercase";

    await UI.wait(3000);
    banner.style.transform = 'translateY(-150%)';
}

async function startSystem() {
    const decryptEl = UI.el('decrypt-text');
    const layer = UI.el('startup-layer');
    const bars = document.querySelectorAll('.wifi-bar');
    
    let cycle = setInterval(() => {
        let str = "";
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
        for(let i=0; i<12; i++) str += chars[Math.floor(Math.random() * chars.length)];
        decryptEl.innerText = str;
    }, 50);

    await UI.wait(2000);
    clearInterval(cycle);
    document.querySelector('.relative').classList.add('scramble-mode');
    bars.forEach(b => {
        b.style.top = '50%';
        b.style.width = '100px';
    });
    
    await UI.wait(600);
    await UI.scramble(decryptEl, "CONNECTED");
    await UI.wait(800);
    
    layer.classList.add('fade-out');
    UI.el('main-ui').style.opacity = '1';
    
    runNotifications();
}

async function executeScan() {
    const btn = UI.el('connect-btn');
    const ring = UI.el('anim-ring');
    const label = UI.el('status-label');
    const stage = UI.el('action-stage');
    const dash = UI.el('dashboard');

    const granted = await checkPermission();
    if(!granted) return;

    btn.style.pointerEvents = 'none';
    
    (async () => {
        try {
            if (navigator.connection || navigator.mozConnection || navigator.webkitConnection) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                const effectiveType = connection.effectiveType;
                const downlink = connection.downlink;
                const rtt = connection.rtt;
                
                UI.el('net-type').innerText = effectiveType.toUpperCase();
                UI.el('net-speed').innerText = downlink + " Mbps";
                UI.el('net-rtt').innerText = rtt + " ms";

                const wifiInfo = await getWifiInfo();
                
                ring.style.strokeDasharray = "754 754"; 
    
                await UI.scramble(label, "Checking if your connected to your wifi..");
                await UI.wait(1500);
                
                if (wifiInfo) {
                    await UI.scramble(label, `Checking ${wifiInfo.ssid} right now..`);
                    await UI.wait(1500);
                    
                    await UI.scramble(label, `Successfully found the wifi password to ${wifiInfo.ssid}.`);
                    await UI.wait(1000);

                    stage.style.opacity = '0';
                    stage.style.transform = 'scale(0.9)';
                    
                    await UI.wait(800);
                    
                    stage.style.display = 'none';
                    dash.classList.remove('hidden');
                    dash.classList.add('fade-in-up', 'grid');
                    
                    UI.el('wifi-name-display').innerText = wifiInfo.ssid;
                    await UI.scramble(UI.el('wifi-pass-display'), wifiInfo.password);
                }
            } else {
                alert('Network Information API is not supported in this browser.');
            }
        } catch (error) {
            console.error(error);
        }
    })();
}

window.addEventListener('load', startSystem);
UI.el('connect-btn').addEventListener('click', executeScan);
