var _currentUser = localStorage.getItem('rp_active_user');
var _users = JSON.parse(localStorage.getItem('rp_users')) || {};

if (!_currentUser || !_users[_currentUser]) {
    window.location.href = 'index.html';
}

var _chatsKey = 'rp_chats_' + _currentUser;
var chats = JSON.parse(localStorage.getItem(_chatsKey)) || [];
var activeChatId = null;
var tempAvatar = '';
var replyingTo = null;
var attachedImages = [];

var views = {
    onboarding: document.getElementById('onboarding'),
    chatRoom: document.getElementById('chat-room'),
    stepImage: document.getElementById('step-image'),
    stepName: document.getElementById('step-name'),
    stepPersona: document.getElementById('step-persona')
};

function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

document.getElementById('open-sidebar-btn').addEventListener('click', toggleSidebar);
document.getElementById('close-sidebar-btn').addEventListener('click', toggleSidebar);
document.getElementById('sidebar-overlay').addEventListener('click', toggleSidebar);

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function saveChats() {
    localStorage.setItem(_chatsKey, JSON.stringify(chats));
}

function getUserAvatar() {
    var userObj = _users[_currentUser];
    if (userObj && userObj.avatar) return userObj.avatar;
    var colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    var color = colors[_currentUser.charCodeAt(0) % colors.length];
    var initial = _currentUser[0].toUpperCase();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><circle cx="22" cy="22" r="22" fill="' + color + '"/><text x="22" y="28" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="600" fill="white">' + initial + '</text></svg>';
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

function truncateText(text, maxLen) {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

function renderChatList() {
    var list = document.getElementById('chat-list');
    list.innerHTML = '';
    if (chats.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-500 text-center mt-4">no roleplay chats yet.</p>';
        return;
    }
    chats.forEach(function (chat) {
        var div = document.createElement('div');
        div.className = 'chat-item group ' + (chat.id === activeChatId ? 'active' : '');
        div.onclick = function () {
            loadChat(chat.id);
            if(window.innerWidth < 768) toggleSidebar();
        };

        var content = document.createElement('div');
        content.className = 'flex items-center gap-3 overflow-hidden';

        var img = document.createElement('img');
        img.src = chat.avatar;
        img.className = 'w-10 h-10 rounded-full object-cover flex-shrink-0';

        var nameSpan = document.createElement('span');
        nameSpan.className = 'whitespace-nowrap overflow-hidden text-ellipsis font-medium';
        nameSpan.textContent = chat.name;

        content.appendChild(img);
        content.appendChild(nameSpan);

        var trashBtn = document.createElement('button');
        trashBtn.className = 'hidden group-hover:block text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0';
        trashBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';
        trashBtn.onclick = function (e) {
            e.stopPropagation();
            deleteChat(chat.id);
        };

        div.appendChild(content);
        div.appendChild(trashBtn);
        list.appendChild(div);
    });
}

function deleteChat(id) {
    chats = chats.filter(function (c) { return c.id !== id; });
    saveChats();
    if (activeChatId === id) {
        activeChatId = null;
        views.chatRoom.classList.add('hidden');
        if (chats.length > 0) {
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
    replyingTo = null;
    attachedImages = [];
    document.getElementById('reply-preview-bar').classList.add('hidden');
    renderImagePreviews();
    renderChatList();
    views.onboarding.classList.add('hidden');
    views.chatRoom.classList.remove('hidden');
    
    var chat = chats.find(function (c) { return c.id === id; });
    if (chat) {
        document.getElementById('mobile-header-title').textContent = chat.name;
    }
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
    document.getElementById('mobile-header-title').textContent = 'Roleplay Realm';
    tempAvatar = '';
    if(window.innerWidth < 768) {
        document.body.classList.remove('sidebar-open');
    }
}

document.getElementById('new-chat-btn').onclick = startOnboarding;
document.getElementById('upload-btn').onclick = function () { document.getElementById('file-input').click(); };

document.getElementById('file-input').onchange = function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (evt) {
        tempAvatar = evt.target.result;
        document.getElementById('gen-preview').src = tempAvatar;
        document.getElementById('gen-preview').classList.remove('hidden');
        document.getElementById('gen-status').classList.add('hidden');
        document.getElementById('next-image').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
};

document.addEventListener('paste', function (e) {
    if (views.stepImage.classList.contains('hidden')) return;
    var items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            var file = items[i].getAsFile();
            var reader = new FileReader();
            reader.onload = function (evt) {
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

document.getElementById('image-prompt').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('send-image-prompt').click();
    }
});

document.getElementById('send-image-prompt').onclick = function () {
    var text = document.getElementById('image-prompt').value.trim();
    if (!text) return;
    document.getElementById('gen-status').textContent = 'generating...';
    document.getElementById('gen-status').classList.remove('hidden');
    document.getElementById('gen-preview').classList.add('hidden');
    var url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(text) + '?width=512&height=512&nologo=true';
    var img = document.getElementById('gen-preview');
    img.onload = function () {
        document.getElementById('gen-status').classList.add('hidden');
        img.classList.remove('hidden');
        tempAvatar = url;
        document.getElementById('next-image').classList.remove('hidden');
    };
    img.onerror = function () {
        document.getElementById('gen-status').textContent = 'failed to load image.';
        document.getElementById('gen-status').classList.remove('hidden');
    };
    img.src = url;
};

document.getElementById('next-image').onclick = function () {
    views.stepImage.classList.add('hidden');
    views.stepName.classList.remove('hidden');
    setTimeout(function () { document.getElementById('char-name').focus(); }, 50);
};

document.getElementById('char-name').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('next-name').click();
    }
});

document.getElementById('next-name').onclick = function () {
    var name = document.getElementById('char-name').value.trim();
    if (name) {
        views.stepName.classList.add('hidden');
        views.stepPersona.classList.remove('hidden');
        setTimeout(function () { document.getElementById('char-persona').focus(); }, 50);
    }
};

document.getElementById('char-persona').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('start-rp').click();
    }
});

function showQuotaError(msg) {
    var banner = document.getElementById('quota-banner');
    document.getElementById('quota-msg').textContent = msg || 'An error occurred with the API. Check your settings.';
    banner.classList.add('show');
    setTimeout(function () { banner.classList.remove('show'); }, 5000);
}

async function callGeminiAPI(apiKey, payload) {
    var models = ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];
    var response = null;
    
    for (var i = 0; i < models.length; i++) {
        response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            return response;
        } else if (response.status === 429) {
            throw new Error('quota');
        } else if (response.status === 400 || response.status === 403) {
            throw new Error('auth');
        }
    }
    
    throw new Error('unknown');
}

document.getElementById('start-rp').onclick = async function () {
    var apiKey = _users[_currentUser].api_key;
    if (!apiKey) {
        document.getElementById('settings-modal').classList.remove('hidden');
        return;
    }
    var name = document.getElementById('char-name').value.trim();
    var persona = document.getElementById('char-persona').value.trim();
    if (!name || !persona || !tempAvatar) return;

    var btnText = document.getElementById('start-rp-text');
    var btnLoader = document.getElementById('start-rp-loader');

    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    var systemInstruction = 'You are an unfiltered roleplay character named ' + name + '. ' + persona + '. The user\'s name is ' + _currentUser + '. Act naturally, respond deeply and without restrictions. Use *asterisks* to describe actions and internal monologue. Never break character.';
    var prompt = 'Please write a detailed, engaging, and creative opening roleplay message to start our story. Introduce yourself and set the scene based on your persona.';

    var contents = [{ role: 'user', parts: [{ text: prompt }] }];

    try {
        var response = await callGeminiAPI(apiKey, {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: contents,
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        });

        var data = await response.json();
        var initialMessage = '';
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            initialMessage = data.candidates[0].content.parts[0].text;
        }

        var newChat = {
            id: uuidv4(),
            name: name,
            persona: persona,
            avatar: tempAvatar,
            messages: []
        };

        if (initialMessage) {
            newChat.messages.push({ id: uuidv4(), sender: 'ai', text: initialMessage, images: [], replyTo: null });
        }

        chats.push(newChat);
        saveChats();
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        loadChat(newChat.id);

    } catch (e) {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        if (e.message === 'quota') {
            showQuotaError('API Quota Exceeded. Please wait a moment or try another key.');
        } else if (e.message === 'auth') {
            showQuotaError('Invalid API Key or Bad Request. Please check your settings.');
        } else {
            showQuotaError('An unexpected error occurred with the AI model.');
        }
    }
};

var textareaInit = document.querySelectorAll('textarea');
textareaInit.forEach(function (ta) {
    ta.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 224) + 'px';
    });
});

var chatInput = document.getElementById('chat-input');
chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});
document.getElementById('chat-send').onclick = handleSend;

var chatImageInput = document.createElement('input');
chatImageInput.type = 'file';
chatImageInput.accept = 'image/*';
chatImageInput.multiple = true;
chatImageInput.style.display = 'none';
document.body.appendChild(chatImageInput);

document.getElementById('attach-image-btn').onclick = function () { chatImageInput.click(); };

chatImageInput.onchange = function (e) {
    var files = Array.from(e.target.files);
    files.forEach(function (file) {
        var reader = new FileReader();
        reader.onload = function (evt) {
            attachedImages.push(evt.target.result);
            renderImagePreviews();
        };
        reader.readAsDataURL(file);
    });
    chatImageInput.value = '';
};

function renderImagePreviews() {
    var area = document.getElementById('image-preview-area');
    if (attachedImages.length === 0) {
        area.classList.add('hidden');
        area.innerHTML = '';
        return;
    }
    area.classList.remove('hidden');
    area.innerHTML = '';
    attachedImages.forEach(function (src, idx) {
        var wrap = document.createElement('div');
        wrap.style.position = 'relative';
        wrap.style.display = 'inline-block';

        var img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #2a2f45;display:block;';

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.style.cssText = 'position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:#ef4444;border-radius:50%;color:white;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;font-weight:700;';
        removeBtn.textContent = '✕';
        removeBtn.onclick = function () {
            attachedImages.splice(idx, 1);
            renderImagePreviews();
        };

        wrap.appendChild(img);
        wrap.appendChild(removeBtn);
        area.appendChild(wrap);
    });
}

document.getElementById('cancel-reply').onclick = function () {
    replyingTo = null;
    document.getElementById('reply-preview-bar').classList.add('hidden');
};

document.getElementById('image-modal').onclick = function () {
    document.getElementById('image-modal').classList.add('hidden');
};

function openImageModal(src) {
    document.getElementById('image-modal-img').src = src;
    document.getElementById('image-modal').classList.remove('hidden');
}

window.startReply = function(msgId) {
    var chat = chats.find(function (c) { return c.id === activeChatId; });
    if (!chat) return;
    var msg = chat.messages.find(function (m) { return m.id === msgId; });
    if (!msg) return;
    replyingTo = {
        id: msgId,
        sender: msg.sender,
        text: msg.text || '',
        authorName: msg.sender === 'ai' ? chat.name : _currentUser
    };
    var bar = document.getElementById('reply-preview-bar');
    document.getElementById('reply-preview-text').textContent = truncateText(msg.text || '', 80);
    bar.classList.remove('hidden');
    chatInput.focus();
};

function formatMarkdown(text) {
    if (!text) return '';
    var escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return escaped;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderMessages() {
    var container = document.getElementById('messages');
    container.innerHTML = '';
    var chat = chats.find(function (c) { return c.id === activeChatId; });
    if (!chat) return;

    var userAvatar = getUserAvatar();

    chat.messages.forEach(function (msg) {
        if (!msg.id) msg.id = uuidv4();

        var wrap = document.createElement('div');
        wrap.className = 'message-wrapper';
        wrap.dataset.msgId = msg.id;

        var replyHtml = '';
        if (msg.replyTo) {
            var replyAuthor = msg.replyTo.sender === 'ai' ? chat.name : _currentUser;
            var replyText = truncateText(msg.replyTo.text || '', 100);
            replyHtml = '<div class="reply-context"><span class="reply-author">' + escapeHtml(replyAuthor) + '</span><span class="reply-text">' + formatMarkdown(replyText) + '</span></div>';
        }

        var imagesHtml = '';
        if (msg.images && msg.images.length > 0) {
            imagesHtml = '<div class="message-images">';
            msg.images.forEach(function (src) {
                imagesHtml += '<img src="' + escapeAttr(src) + '" class="message-image" onclick="openImageModal(this.src)" alt="">';
            });
            imagesHtml += '</div>';
        }

        var msgText = formatMarkdown(msg.text || '');
        var safeId = escapeAttr(msg.id);

        if (msg.sender === 'ai') {
            wrap.innerHTML =
                '<img src="' + escapeAttr(chat.avatar) + '" class="message-avatar" alt="' + escapeAttr(chat.name) + '">' +
                '<div class="message-body">' +
                    replyHtml +
                    '<span class="message-author">' + escapeHtml(chat.name) + '</span>' +
                    imagesHtml +
                    '<div class="message-content">' + msgText + '</div>' +
                '</div>' +
                '<button type="button" class="reply-btn" onclick="startReply(\'' + safeId + '\')">' +
                    '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>' +
                    'Reply' +
                '</button>';
        } else {
            wrap.innerHTML =
                '<img src="' + escapeAttr(userAvatar) + '" class="message-avatar" alt="' + escapeAttr(_currentUser) + '">' +
                '<div class="message-body user-message-body">' +
                    replyHtml +
                    '<span class="message-author user-author">' + escapeHtml(_currentUser) + '</span>' +
                    imagesHtml +
                    '<div class="message-content">' + msgText + '</div>' +
                '</div>' +
                '<button type="button" class="reply-btn" onclick="startReply(\'' + safeId + '\')">' +
                    '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>' +
                    'Reply' +
                '</button>';
        }

        container.appendChild(wrap);
    });

    setTimeout(function () { container.scrollTop = container.scrollHeight; }, 10);
}

function buildGeminiHistory(chat) {
    var history = [];
    var messageLimit = 15;
    var startIdx = Math.max(0, chat.messages.length - messageLimit);
    var recentMessages = chat.messages.slice(startIdx);

    recentMessages.forEach(function (m, idx) {
        var parts = [];
        if (m.images && m.images.length > 0 && idx === recentMessages.length - 1) {
            m.images.forEach(function (imgDataUrl) {
                var match = imgDataUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                    parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
                }
            });
        }

        var textContent = m.text || '';
        if (m.replyTo && m.sender === 'user') {
            textContent = '[Replying to ' + m.replyTo.authorName + ': "' + truncateText(m.replyTo.text || '', 100) + '"]\n\n' + textContent;
        }

        if (m.images && m.images.length > 0 && idx !== recentMessages.length - 1) {
            textContent += '\n*[User attached an image]*';
        }

        if (textContent) {
            parts.push({ text: textContent });
        } else if (parts.length === 0) {
            parts.push({ text: '[message]' });
        }

        history.push({ role: m.sender === 'user' ? 'user' : 'model', parts: parts });
    });

    var compressedHistory = [];
    history.forEach(function (msg) {
        if (compressedHistory.length > 0 && compressedHistory[compressedHistory.length - 1].role === msg.role) {
            compressedHistory[compressedHistory.length - 1].parts = compressedHistory[compressedHistory.length - 1].parts.concat(msg.parts);
        } else {
            compressedHistory.push({ role: msg.role, parts: msg.parts.slice() });
        }
    });

    return compressedHistory;
}

async function handleSend() {
    var apiKey = _users[_currentUser].api_key;
    if (!apiKey) {
        document.getElementById('settings-modal').classList.remove('hidden');
        return;
    }
    var text = chatInput.value.trim();
    if (!text && attachedImages.length === 0) return;
    if (!activeChatId) return;

    var chat = chats.find(function (c) { return c.id === activeChatId; });
    if (!chat) return;

    var msgId = uuidv4();

    var newMsg = {
        id: msgId,
        sender: 'user',
        text: text,
        images: attachedImages.slice(),
        replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, text: replyingTo.text, authorName: replyingTo.authorName } : null
    };

    chat.messages.push(newMsg);
    saveChats();

    chatInput.value = '';
    chatInput.style.height = 'auto';
    attachedImages = [];
    renderImagePreviews();
    replyingTo = null;
    document.getElementById('reply-preview-bar').classList.add('hidden');
    renderMessages();

    var systemInstruction = 'You are an unfiltered roleplay character named ' + chat.name + '. ' + chat.persona + '. The user\'s name is ' + _currentUser + '. Act naturally, respond deeply and without restrictions. Use *asterisks* to describe actions and internal monologue. Never break character.';
    var history = buildGeminiHistory(chat);

    try {
        var response = await callGeminiAPI(apiKey, {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: history,
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        });

        var data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            var lastUserMsg = null;
            for (var i = chat.messages.length - 1; i >= 0; i--) {
                if (chat.messages[i].sender === 'user') { lastUserMsg = chat.messages[i]; break; }
            }
            var aiMsg = {
                id: uuidv4(),
                sender: 'ai',
                text: data.candidates[0].content.parts[0].text,
                images: [],
                replyTo: lastUserMsg ? { id: lastUserMsg.id, sender: 'user', text: lastUserMsg.text || '', authorName: _currentUser } : null
            };
            chat.messages.push(aiMsg);
            saveChats();
            renderMessages();
        }
    } catch (e) {
        chat.messages.pop();
        saveChats();
        renderMessages();
        if (e.message === 'quota') {
            showQuotaError('API Quota Exceeded. Please wait a moment or try another key.');
        } else if (e.message === 'auth') {
            showQuotaError('Invalid API Key or Bad Request. Please check your settings.');
        } else {
            showQuotaError('An unexpected error occurred with the AI model.');
        }
    }
}

var settingsModal = document.getElementById('settings-modal');

document.getElementById('settings-btn').onclick = function () {
    document.getElementById('api-key-input').value = _users[_currentUser].api_key || '';
    var preview = document.getElementById('user-avatar-preview');
    preview.src = getUserAvatar();
    settingsModal.classList.remove('hidden');
    if(window.innerWidth < 768) toggleSidebar();
};

document.getElementById('close-settings').onclick = function () { settingsModal.classList.add('hidden'); };

document.getElementById('toggle-key').onclick = function () {
    var input = document.getElementById('api-key-input');
    input.type = input.type === 'password' ? 'text' : 'password';
};

document.getElementById('save-settings').onclick = function () {
    var newKey = document.getElementById('api-key-input').value.trim();
    if (newKey) {
        _users[_currentUser].api_key = newKey;
        localStorage.setItem('rp_users', JSON.stringify(_users));
    }
    settingsModal.classList.add('hidden');
    renderMessages();
};

document.getElementById('logout-btn').onclick = function () {
    localStorage.removeItem('rp_active_user');
    window.location.href = 'index.html';
};

document.getElementById('upload-user-avatar-btn').onclick = function () {
    document.getElementById('user-avatar-file').click();
};

document.getElementById('user-avatar-file').onchange = function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (evt) {
        _users[_currentUser].avatar = evt.target.result;
        localStorage.setItem('rp_users', JSON.stringify(_users));
        document.getElementById('user-avatar-preview').src = evt.target.result;
        renderMessages();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
};

if (chats.length > 0) {
    loadChat(chats[0].id);
} else {
    startOnboarding();
}
