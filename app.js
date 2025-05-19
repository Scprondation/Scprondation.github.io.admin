// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние приложения
const state = {
    currentChat: null,
    isAdmin: false,
    members: [],
    admins: [],
    chatSettings: {
        title: '',
        description: ''
    }
};

// DOM элементы
const elements = {
    mainMenu: document.getElementById('mainMenu'),
    addBotMenu: document.getElementById('addBotMenu'),
    chatManagement: document.getElementById('chatManagement'),
    chatTitle: document.getElementById('chatTitle'),
    membersTab: document.getElementById('membersTab'),
    adminsTab: document.getElementById('adminsTab'),
    settingsTab: document.getElementById('settingsTab'),
    membersList: document.getElementById('membersList'),
    adminsList: document.getElementById('adminsList'),
    usernameInput: document.getElementById('usernameInput'),
    addUserBtn: document.getElementById('addUserBtn'),
    adminInput: document.getElementById('adminInput'),
    addAdminBtn: document.getElementById('addAdminBtn'),
    chatNameInput: document.getElementById('chatNameInput'),
    chatDescInput: document.getElementById('chatDescInput'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    statusMessage: document.getElementById('statusMessage')
};

// Инициализация приложения
function initApp() {
    // Проверяем, открыто ли приложение из чата
    if (tg.initDataUnsafe.chat) {
        state.currentChat = {
            id: tg.initDataUnsafe.chat.id,
            title: tg.initDataUnsafe.chat.title,
            type: tg.initDataUnsafe.chat.type
        };
        
        // Загружаем данные чата
        loadChatData();
        showSection('chatManagement');
    } else {
        showSection('mainMenu');
    }
    
    // Назначаем обработчики событий
    setupEventListeners();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Главное меню
    document.getElementById('addBotBtn').addEventListener('click', () => showSection('addBotMenu'));
    document.getElementById('manageChatBtn').addEventListener('click', () => {
        if (state.currentChat) {
            showSection('chatManagement');
        } else {
            showStatus('Вы не находитесь в чате', 'error');
        }
    });
    
    // Меню добавления бота
    document.getElementById('addToGroupBtn').addEventListener('click', () => addBotToChat('group'));
    document.getElementById('addToChannelBtn').addEventListener('click', () => addBotToChat('channel'));
    
    // Управление участниками
    elements.addUserBtn.addEventListener('click', addMember);
    elements.usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMember();
    });
    
    // Управление администраторами
    elements.addAdminBtn.addEventListener('click', addAdmin);
    elements.adminInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addAdmin();
    });
    
    // Настройки чата
    elements.saveSettingsBtn.addEventListener('click', saveChatSettings);
    
    // Табы
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

// Загрузка данных чата
function loadChatData() {
    // В реальном приложении здесь должен быть запрос к API
    // Для демонстрации используем mock-данные
    state.members = [
        { id: 1, username: 'user1', is_admin: false },
        { id: 2, username: 'user2', is_admin: true },
        { id: 3, username: 'user3', is_admin: false }
    ];
    
    state.admins = state.members.filter(member => member.is_admin);
    state.chatSettings.title = state.currentChat.title;
    state.chatSettings.description = "Описание чата";
    
    renderChatData();
}

// Отрисовка данных чата
function renderChatData() {
    elements.chatTitle.textContent = state.currentChat.title;
    
    // Участники
    elements.membersList.innerHTML = '';
    state.members.forEach(member => {
        const memberEl = document.createElement('div');
        memberEl.className = 'list-item';
        memberEl.innerHTML = `
            <span>@${member.username} ${member.is_admin ? '(admin)' : ''}</span>
            <div class="actions">
                ${!member.is_admin ? `<button class="btn danger" onclick="kickMember(${member.id})">Исключить</button>` : ''}
                ${!member.is_admin ? `<button class="btn secondary" onclick="promoteToAdmin(${member.id})">Сделать админом</button>` : ''}
            </div>
        `;
        elements.membersList.appendChild(memberEl);
    });
    
    // Администраторы
    elements.adminsList.innerHTML = '';
    state.admins.forEach(admin => {
        const adminEl = document.createElement('div');
        adminEl.className = 'list-item';
        adminEl.innerHTML = `
            <span>@${admin.username}</span>
            <div class="actions">
                <button class="btn danger" onclick="demoteAdmin(${admin.id})">Разжаловать</button>
            </div>
        `;
        elements.adminsList.appendChild(adminEl);
    });
    
    // Настройки
    elements.chatNameInput.value = state.chatSettings.title;
    elements.chatDescInput.value = state.chatSettings.description;
}

// Добавление бота в чат
function addBotToChat(chatType) {
    if (tg.platform !== 'unknown') {
        tg.openTelegramLink(`https://t.me/${tg.initDataUnsafe.user?.username || 'your_bot'}?startgroup=true`);
        showStatus(`Бот добавлен в ${chatType === 'group' ? 'группу' : 'канал'}`, 'success');
    } else {
        showStatus('Откройте приложение в Telegram', 'error');
    }
}

// Управление участниками
function addMember() {
    const username = elements.usernameInput.value.trim();
    if (!username) {
        showStatus('Введите username', 'error');
        return;
    }
    
    // В реальном приложении - запрос к API
    state.members.push({
        id: Math.floor(Math.random() * 1000),
        username: username.replace('@', ''),
        is_admin: false
    });
    
    elements.usernameInput.value = '';
    renderChatData();
    showStatus(`Пользователь @${username} добавлен`, 'success');
}

function kickMember(userId) {
    // В реальном приложении - запрос к API
    state.members = state.members.filter(m => m.id !== userId);
    state.admins = state.admins.filter(a => a.id !== userId);
    renderChatData();
    showStatus('Пользователь исключен', 'success');
}

function promoteToAdmin(userId) {
    // В реальном приложении - запрос к API
    const member = state.members.find(m => m.id === userId);
    if (member) {
        member.is_admin = true;
        state.admins.push(member);
        renderChatData();
        showStatus('Пользователь назначен администратором', 'success');
    }
}

function addAdmin() {
    const username = elements.adminInput.value.trim();
    if (!username) {
        showStatus('Введите username', 'error');
        return;
    }
    
    // В реальном приложении - запрос к API
    const member = state.members.find(m => m.username === username.replace('@', ''));
    if (member) {
        member.is_admin = true;
        state.admins.push(member);
    } else {
        const newAdmin = {
            id: Math.floor(Math.random() * 1000),
            username: username.replace('@', ''),
            is_admin: true
        };
        state.members.push(newAdmin);
        state.admins.push(newAdmin);
    }
    
    elements.adminInput.value = '';
    renderChatData();
    showStatus(`Администратор @${username} добавлен`, 'success');
}

function demoteAdmin(userId) {
    // В реальном приложении - запрос к API
    const member = state.members.find(m => m.id === userId);
    if (member) {
        member.is_admin = false;
        state.admins = state.admins.filter(a => a.id !== userId);
        renderChatData();
        showStatus('Администратор разжалован', 'success');
    }
}

// Настройки чата
function saveChatSettings() {
    const newTitle = elements.chatNameInput.value.trim();
    const newDesc = elements.chatDescInput.value.trim();
    
    if (!newTitle) {
        showStatus('Введите название чата', 'error');
        return;
    }
    
    // В реальном приложении - запрос к API
    state.chatSettings.title = newTitle;
    state.chatSettings.description = newDesc;
    state.currentChat.title = newTitle;
    
    elements.chatTitle.textContent = newTitle;
    showStatus('Настройки сохранены', 'success');
}

// Переключение между вкладками
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}Tab`);
    });
}

// Показать определенную секцию
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('hidden', section.id !== sectionId);
    });
}

// Показать статусное сообщение
function showStatus(message, type) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status ${type}`;
    elements.statusMessage.classList.remove('hidden');
    
    setTimeout(() => {
        elements.statusMessage.classList.add('hidden');
    }, 3000);
}

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', initApp);
