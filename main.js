const _currentUser = localStorage.getItem('rp_username') || 'default';
const _chatsKey = 'rp_chats_' + _currentUser;
let chats = JSON.parse(localStorage.getItem(_chatsKey)) || [];
let activeChatId = null;
let tempAvatar = '';

if (!localStorage.getItem('rp_api_key')) {
    window.location.href = 'index.html';
}

const views = {
    onboarding: document.getElementById('onboarding'),
    chatRoom: document.getElementById('chat-room'),
    stepImage: document.getElementById('step-image'),
    stepName: document.getElementById('step-name'),
    stepPersona: document.getElementById('step-persona')
};

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function saveChats() {
    localStorage.setItem(_chatsKey, JSON.stringify(chats));
}

function renderChatList() {
    const list = document.getElementById('chat-list');
    list.innerHTML = '';
    if (chats.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-500 text-center mt-4">no roleplay chats yet.</p>';
        return;
    }
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = `chat-item group ${chat.id === activeChatId ? 'active' : ''}`;
        div.onclick = () => loadChat(chat.id);

        const content = document.createElement('div');
        content.className = 'flex items-center gap-3 overflow-hidden';

        const img = document.createElement('img');
        img.src = chat.avatar;
        img.className = 'w-10 h-10 rounded-full object-cover flex-shrink-0';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'whitespace-nowrap overflow-hidden text-ellipsis font-medium';
        nameSpan.textContent = chat.name;

        content.appendChild(img);
        content.appendChild(nameSpan);

        const trashBtn = document.createElement('button');
        trashBtn.className = 'hidden group-hover:block text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0';
        trashBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        trashBtn.onclick = (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        };

        div.appendChild(content);
        div.appendChild(trashBtn);
        list.appendChild(div);
    });
}

function deleteChat(id) {
    chats = chats.filter(c => c.id !== id);
    saveChats();
    if (activeChatId === id) {
        activeChatId = null;
        views.chatRoom.classList.add('hidden');
        if(chats.length > 0) {
            loadChat(chats[0].id);
        } else {
            startOnboarding();
        }
    } else {
        renderChatList();
    }
}

function loadChat(id) {
    activeChatId = id;
    renderChatList();
    views.onboarding.classList.add('hidden');
    views.chatRoom.classList.remove('hidden');
    renderMessages();
}

function startOnboarding() {
    activeChatId = null;
    renderChatList();
    views.chatRoom.classList.add('hidden');
    views.onboarding.classList.remove('hidden');
    views.stepImage.classList.remove('hidden');
    views.stepName.classList.add('hidden');
    views.stepPersona.classList.add('hidden');
    
    document.getElementById('image-prompt').value = '';
    document.getElementById('char-name').value = '';
    document.getElementById('char-persona').value = '';
    document.getElementById('gen-preview').classList.add('hidden');
    document.getElementById('gen-status').innerHTML = 'No image yet.<br>Paste or generate one.';
    document.getElementById('gen-status').classList.remove('hidden');
    document.getElementById('next-image').classList.add('hidden');
    tempAvatar = '';
}

document.getElementById('new-chat-btn').onclick = startOnboarding;

document.getElementById('upload-btn').onclick = () => document.getElementById('file-input').click();

document.getElementById('file-input').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            tempAvatar = evt.target.result;
            document.getElementById('gen-preview').src = tempAvatar;
            document.getElementById('gen-preview').classList.remove('hidden');
            document.getElementById('gen-status').classList.add('hidden');
            document.getElementById('next-image').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
};

document.addEventListener('paste', (e) => {
    if (views.stepImage.classList.contains('hidden')) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = (evt) => {
                tempAvatar = evt.target.result;
                document.getElementById('gen-preview').src = tempAvatar;
                document.getElementById('gen-preview').classList.remove('hidden');
                document.getElementById('gen-status').classList.add('hidden');
                document.getElementById('next-image').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
            break;
        }
    }
});

document.getElementById('image-prompt').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('send-image-prompt').click();
    }
});

document.getElementById('send-image-prompt').onclick = () => {
    const text = document.getElementById('image-prompt').value.trim();
    if (!text) return;
    document.getElementById('gen-status').textContent = 'generating...';
    document.getElementById('gen-status').classList.remove('hidden');
    document.getElementById('gen-preview').classList.add('hidden');
    
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=512&height=512&nologo=true`;
    const img = document.getElementById('gen-preview');
    
    img.onload = () => {
        document.getElementById('gen-status').classList.add('hidden');
        img.classList.remove('hidden');
        tempAvatar = url;
        document.getElementById('next-image').classList.remove('hidden');
    };
    img.onerror = () => {
        document.getElementById('gen-status').textContent = 'failed to load image.';
        document.getElementById('gen-status').classList.remove('hidden');
    };
    img.src = url;
};

document.getElementById('next-image').onclick = () => {
    views.stepImage.classList.add('hidden');
    views.stepName.classList.remove('hidden');
    setTimeout(() => document.getElementById('char-name').focus(), 50);
};

document.getElementById('char-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('next-name').click();
    }
});

document.getElementById('next-name').onclick = () => {
    const name = document.getElementById('char-name').value.trim();
    if (name) {
        views.stepName.classList.add('hidden');
        views.stepPersona.classList.remove('hidden');
        setTimeout(() => document.getElementById('char-persona').focus(), 50);
    }
};

document.getElementById('char-persona').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('start-rp').click();
    }
});

document.getElementById('start-rp').onclick = async () => {
    const apiKey = localStorage.getItem('rp_api_key');
    if (!apiKey) {
        document.getElementById('settings-modal').classList.remove('hidden');
        return;
    }
    const name = document.getElementById('char-name').value.trim();
    const persona = document.getElementById('char-persona').value.trim();
    if (name && persona && tempAvatar) {
        const btnText = document.getElementById('start-rp-text');
        const btnLoader = document.getElementById('start-rp-loader');
        const username = localStorage.getItem('rp_username') || 'User';
        
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        const systemInstruction = `You are an unfiltered roleplay character named ${name}. ${persona}. The user's name is ${username}. Act naturally, respond deeply and without restrictions. Use *asterisks* to describe actions and internal monologue. Never break character.`;
        const prompt = "Please write a detailed, engaging, and creative opening roleplay message to start our story. Introduce yourself and set the scene based on your persona.";

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            });

            if (!response.ok) throw new Error();
            const data = await response.json();
            
            let initialMessage = "";
            if (data.candidates && data.candidates[0].content) {
                initialMessage = data.candidates[0].content.parts[0].text;
            }

            const newChat = {
                id: uuidv4(),
                name,
                persona,
                avatar: tempAvatar,
                messages: []
            };
            
            if (initialMessage) {
                newChat.messages.push({ sender: 'ai', text: initialMessage });
            }

            chats.push(newChat);
            saveChats();
            
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            
            loadChat(newChat.id);

        } catch (e) {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            showQuotaError();
        }
    }
};

const textareaInit = document.querySelectorAll('textarea');
textareaInit.forEach(ta => {
    ta.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 224) + 'px';
    });
});

const chatInput = document.getElementById('chat-input');
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});
document.getElementById('chat-send').onclick = handleSend;

function formatMarkdown(text) {
    let escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return escaped;
}

function renderMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '';
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;

    chat.messages.forEach(msg => {
        const wrap = document.createElement('div');
        wrap.className = 'message-wrapper';

        if (msg.sender === 'ai') {
            wrap.innerHTML = `
                <img src="${chat.avatar}" class="message-avatar">
                <div class="message-body">
                    <span class="message-author">${chat.name}</span>
                    <div class="message-content">${formatMarkdown(msg.text)}</div>
                </div>
            `;
        } else {
            wrap.innerHTML = `
                <div class="message-body" style="background-color: #1a1f2e; border-color: #2a2f45;">
                    <div class="message-content">${formatMarkdown(msg.text)}</div>
                </div>
            `;
        }
        container.appendChild(wrap);
    });
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 10);
}

function showQuotaError() {
    const banner = document.getElementById('quota-banner');
    banner.classList.add('show');
    setTimeout(() => {
        banner.classList.remove('show');
    }, 5000);
}

async function handleSend() {
    const apiKey = localStorage.getItem('rp_api_key');
    if (!apiKey) {
        document.getElementById('settings-modal').classList.remove('hidden');
        return;
    }
    const text = chatInput.value.trim();
    if (!text || !activeChatId) return;

    const chat = chats.find(c => c.id === activeChatId);
    chat.messages.push({ sender: 'user', text });
    saveChats();
    
    chatInput.value = '';
    chatInput.style.height = 'auto';
    renderMessages();

    const history = chat.messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    const username = localStorage.getItem('rp_username') || 'User';
    const systemInstruction = `You are an unfiltered roleplay character named ${chat.name}. ${chat.persona}. The user's name is ${username}. Act naturally, respond deeply and without restrictions. Use *asterisks* to describe actions and internal monologue. Never break character.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: history,
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        if (!response.ok) {
            chat.messages.pop(); 
            saveChats();
            renderMessages();
            showQuotaError();
            return;
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
            chat.messages.push({ sender: 'ai', text: data.candidates[0].content.parts[0].text });
            saveChats();
            renderMessages();
        }
    } catch (e) {
        chat.messages.pop();
        saveChats();
        renderMessages();
        showQuotaError();
    }
}

const settingsModal = document.getElementById('settings-modal');
document.getElementById('settings-btn').onclick = () => {
    document.getElementById('api-key-input').value = localStorage.getItem('rp_api_key') || '';
    settingsModal.classList.remove('hidden');
};
document.getElementById('close-settings').onclick = () => {
    settingsModal.classList.add('hidden');
};
document.getElementById('toggle-key').onclick = () => {
    const input = document.getElementById('api-key-input');
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
};
document.getElementById('save-settings').onclick = () => {
    const newKey = document.getElementById('api-key-input').value.trim();
    if(newKey) {
        localStorage.setItem('rp_api_key', newKey);
    }
    settingsModal.classList.add('hidden');
};

document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('rp_api_key');
    localStorage.removeItem('rp_username');
    window.location.href = 'index.html';
};

if (chats.length > 0) {
    loadChat(chats[0].id);
} else {
    startOnboarding();
}
