// Конфигурация бота (ЗАМЕНИТЕ ЭТИ ДАННЫЕ)
const BOT_USERNAME = 'Groupadminscprondation_bot'; // Без @
const BOT_TOKEN = '8134808630:AAE-GobNl919miKTcwb2wJX-jESJR-s1xxo'; // Полученный от @BotFather
const BOT_VERSION = '1.0.0';

// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.MainButton.hide();

// Состояние приложения
const state = {
    currentChat: null,
    isAdmin: false,
    members: [],
    admins: [],
    chatSettings: {
        title: '',
        description: '',
        rules: ''
    },
    moderationSettings: {
        autoDeleteSpam: true,
        autoWarn: true,
        warnLimit: 3,
        bannedWords: []
    },
    appSettings: {
        language: 'ru',
        theme: 'system',
        notifications: true
    },
    pagination: {
        membersPage: 1,
        membersPerPage: 10
    }
};

// DOM элементы
const elements = {
    // Основные секции
    mainMenu: document.getElementById('mainMenu'),
    addBotMenu: document.getElementById('addBotMenu'),
    chatManagement: document.getElementById('chatManagement'),
    botSettings: document.getElementById('botSettings'),
    
    // Кнопки главного меню
    addBotBtn: document.getElementById('addBotBtn'),
    manageChatBtn: document.getElementById('manageChatBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    
    // Добавление бота
    addToGroupBtn: document.getElementById('addToGroupBtn'),
    addToChannelBtn: document.getElementById('addToChannelBtn'),
    
    // Управление участниками
    membersTab: document.getElementById('membersTab'),
    searchMember: document.getElementById('searchMember'),
    searchMemberBtn: document.getElementById('searchMemberBtn'),
    usernameInput: document.getElementById('usernameInput'),
    addUserBtn: document.getElementById('addUserBtn'),
    membersList: document.getElementById('membersList'),
    prevMembersPage: document.getElementById('prevMembersPage'),
    nextMembersPage: document.getElementById('nextMembersPage'),
    membersPageInfo: document.getElementById('membersPageInfo'),
    
    // Управление администраторами
    adminsTab: document.getElementById('adminsTab'),
    adminInput: document.getElementById('adminInput'),
    adminPermissions: document.getElementById('adminPermissions'),
    addAdminBtn: document.getElementById('addAdminBtn'),
    adminsList: document.getElementById('adminsList'),
    
    // Настройки чата
    settingsTab: document.getElementById('settingsTab'),
    chatTitle: document.getElementById('chatTitle'),
    chatNameInput: document.getElementById('chatNameInput'),
    chatDescInput: document.getElementById('chatDescInput'),
    chatRules: document.getElementById('chatRules'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    // Настройки модерации
    moderationTab: document.getElementById('moderationTab'),
    autoDeleteSpam: document.getElementById('autoDeleteSpam'),
    autoWarn: document.getElementById('autoWarn'),
    warnLimit: document.getElementById('warnLimit'),
    bannedWords: document.getElementById('bannedWords'),
    saveModerationBtn: document.getElementById('saveModerationBtn'),
    
    // Настройки бота
    language: document.getElementById('language'),
    theme: document.getElementById('theme'),
    notifications: document.getElementById('notifications'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    leaveAllChatsBtn: document.getElementById('leaveAllChatsBtn'),
    botVersion: document.getElementById('botVersion'),
    botStatus: document.getElementById('botStatus'),
    
    // Статус и модальное окно
    statusMessage: document.getElementById('statusMessage'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    modalText: document.getElementById('modalText'),
    modalConfirm: document.getElementById('modalConfirm'),
    modalCancel: document.getElementById('modalCancel'),
    closeBtn: document.querySelector('.close-btn')
};

// Инициализация приложения
async function initApp() {
    // Загружаем настройки из localStorage
    loadSettings();
    
    // Проверяем, открыто ли приложение из чата
    if (tg.initDataUnsafe.chat) {
        state.currentChat = {
            id: tg.initDataUnsafe.chat.id,
            title: tg.initDataUnsafe.chat.title,
            type: tg.initDataUnsafe.chat.type
        };
        
        // Проверяем права администратора
        await checkAdminRights();
        
        if (state.isAdmin) {
            // Загружаем данные чата
            await loadChatData();
            showSection('chatManagement');
        } else {
            showStatus('Только администраторы могут управлять чатом', 'error');
            showSection('mainMenu');
        }
    } else {
        showSection('mainMenu');
    }
    
    // Назначаем обработчики событий
    setupEventListeners();
    
    // Обновляем интерфейс
    updateUI();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Главное меню
    elements.addBotBtn.addEventListener('click', () => showSection('addBotMenu'));
    elements.manageChatBtn.addEventListener('click', () => {
        if (state.currentChat) {
            showSection('chatManagement');
        } else {
            showStatus('Вы не находитесь в чате', 'error');
        }
    });
    elements.settingsBtn.addEventListener('click', () => showSection('botSettings'));
    
    // Добавление бота
    elements.addToGroupBtn.addEventListener('click', () => addBotToChat('group'));
    elements.addToChannelBtn.addEventListener('click', () => addBotToChat('channel'));
    
    // Управление участниками
    elements.addUserBtn.addEventListener('click', addMember);
    elements.usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMember();
    });
    elements.searchMemberBtn.addEventListener('click', searchMembers);
    elements.searchMember.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMembers();
    });
    elements.prevMembersPage.addEventListener('click', () => {
        if (state.pagination.membersPage > 1) {
            state.pagination.membersPage--;
            renderMembersList();
        }
    });
    elements.nextMembersPage.addEventListener('click', () => {
        state.pagination.membersPage++;
        renderMembersList();
    });
    
    // Управление администраторами
    elements.addAdminBtn.addEventListener('click', addAdmin);
    elements.adminInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addAdmin();
    });
    
    // Настройки чата
    elements.saveSettingsBtn.addEventListener('click', saveChatSettings);
    
    // Настройки модерации
    elements.saveModerationBtn.addEventListener('click', saveModerationSettings);
    
    // Настройки бота
    elements.language.addEventListener('change', updateAppSettings);
    elements.theme.addEventListener('change', updateAppSettings);
    elements.notifications.addEventListener('change', updateAppSettings);
    elements.resetSettingsBtn.addEventListener('click', () => showModal(
        'Сброс настроек',
        'Вы уверены, что хотите сбросить все настройки бота?',
        resetSettings
    ));
    elements.leaveAllChatsBtn.addEventListener('click', () => showModal(
        'Покинуть все чаты',
        'Вы уверены, что хотите, чтобы бот покинул все чаты? Это действие нельзя отменить.',
        leaveAllChats
    ));
    
    // Табы
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Модальное окно
    elements.closeBtn.addEventListener('click', hideModal);
    elements.modalCancel.addEventListener('click', hideModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) hideModal();
    });
}

// ==================== Функции работы с Telegram API ====================

// Проверка прав администратора
async function checkAdminRights() {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatAdministrators?chat_id=${state.currentChat.id}`);
        const data = await response.json();
        
        if (data.ok) {
            const user = tg.initDataUnsafe.user;
            state.isAdmin = data.result.some(admin => 
                admin.user.id === user.id || 
                (admin.status === 'creator' && admin.user.id === user.id)
            );
            
            // Сохраняем список администраторов
            state.admins = data.result.map(admin => ({
                id: admin.user.id,
                username: admin.user.username,
                is_admin: true,
                status: admin.status
            }));
        }
    } catch (error) {
        console.error('Ошибка проверки прав:', error);
        showStatus('Ошибка проверки прав администратора', 'error');
    }
}

// Загрузка данных чата
async function loadChatData() {
    try {
        // 1. Получаем информацию о чате
        const chatInfo = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${state.currentChat.id}`);
        const chatData = await chatInfo.json();
        
        if (chatData.ok) {
            state.chatSettings.title = chatData.result.title;
            state.chatSettings.description = chatData.result.description || '';
        }
        
        // 2. Получаем количество участников
        const membersCount = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMembersCount?chat_id=${state.currentChat.id}`);
        const countData = await membersCount.json();
        
        // 3. Загружаем участников (упрощенная реализация)
        // В реальном приложении нужно реализовать пагинацию и поиск
        state.members = [];
        
        // Mock-данные для демонстрации
        for (let i = 1; i <= 10; i++) {
            state.members.push({
                id: i,
                username: `user${i}`,
                is_admin: i <= 2 // Первые 2 пользователя - администраторы
            });
        }
        
        // 4. Загружаем настройки модерации (в реальном приложении - с сервера)
        state.moderationSettings = {
            autoDeleteSpam: true,
            autoWarn: true,
            warnLimit: 3,
            bannedWords: ['спам', 'реклама', 'оскорбления']
        };
        
        renderChatData();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showStatus('Ошибка загрузки данных чата', 'error');
    }
}

// Добавление бота в чат
function addBotToChat(chatType) {
    if (tg.platform !== 'unknown') {
        // Формируем URL с правами администратора
        const permissions = [
            'change_info',
            'post_messages',
            'edit_messages',
            'delete_messages',
            'ban_users',
            'invite_users',
            'pin_messages',
            'add_admins'
        ].join('+');
        
        tg.openTelegramLink(`https://t.me/${BOT_USERNAME}?startgroup=true&admin=${permissions}`);
        showStatus(`Добавьте бота @${BOT_USERNAME} как администратора`, 'success');
    } else {
        showStatus('Откройте приложение в Telegram', 'error');
        window.open(`https://t.me/${BOT_USERNAME}?startgroup=true`, '_blank');
    }
}

// Добавление участника
async function addMember() {
    const username = elements.usernameInput.value.trim().replace('@', '');
    if (!username) {
        showStatus('Введите username или ID пользователя', 'error');
        return;
    }
    
    try {
        // 1. Получаем user_id по username
        let userId;
        if (/^\d+$/.test(username)) {
            userId = parseInt(username);
        } else {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?username=${username}`);
            const data = await response.json();
            
            if (data.ok && data.result.photos.length > 0) {
                userId = data.result.photos[0].user_id;
            } else {
                showStatus('Пользователь не найден', 'error');
                return;
            }
        }
        
        // 2. Добавляем пользователя в чат
        const addResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/addChatMember?chat_id=${state.currentChat.id}&user_id=${userId}`);
        const addData = await addResponse.json();
        
        if (addData.ok) {
            // Добавляем в локальный список
            state.members.push({
                id: userId,
                username: username,
                is_admin: false
            });
            
            elements.usernameInput.value = '';
            renderMembersList();
            showStatus(`Пользователь @${username} добавлен в чат`, 'success');
        } else {
            showStatus(`Ошибка: ${addData.description}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка добавления:', error);
        showStatus('Ошибка добавления участника', 'error');
    }
}

// Исключение участника
async function kickMember(userId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/banChatMember?chat_id=${state.currentChat.id}&user_id=${userId}`);
        const data = await response.json();
        
        if (data.ok) {
            // Удаляем из локального списка
            state.members = state.members.filter(m => m.id !== userId);
            state.admins = state.admins.filter(a => a.id !== userId);
            
            renderChatData();
            showStatus('Пользователь исключен из чата', 'success');
        } else {
            showStatus(`Ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка исключения:', error);
        showStatus('Ошибка исключения участника', 'error');
    }
}

// Назначение администратора
async function addAdmin() {
    const username = elements.adminInput.value.trim().replace('@', '');
    if (!username) {
        showStatus('Введите username или ID пользователя', 'error');
        return;
    }
    
    try {
        // 1. Получаем user_id по username
        let userId;
        if (/^\d+$/.test(username)) {
            userId = parseInt(username);
        } else {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?username=${username}`);
            const data = await response.json();
            
            if (data.ok && data.result.photos.length > 0) {
                userId = data.result.photos[0].user_id;
            } else {
                showStatus('Пользователь не найден', 'error');
                return;
            }
        }
        
        // 2. Определяем права в зависимости от выбора
        const permissions = {
            can_change_info: elements.adminPermissions.value === 'full' || elements.adminPermissions.value === 'custom',
            can_post_messages: true,
            can_edit_messages: true,
            can_delete_messages: true,
            can_invite_users: true,
            can_restrict_members: true,
            can_pin_messages: true,
            can_promote_members: elements.adminPermissions.value === 'full'
        };
        
        // 3. Назначаем администратора
        const promoteResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/promoteChatMember?chat_id=${state.currentChat.id}&user_id=${userId}&${new URLSearchParams(permissions)}`);
        const promoteData = await promoteResponse.json();
        
        if (promoteData.ok) {
            // Обновляем локальные данные
            const member = state.members.find(m => m.id === userId);
            if (member) {
                member.is_admin = true;
            } else {
                state.members.push({
                    id: userId,
                    username: username,
                    is_admin: true
                });
            }
            
            state.admins = state.members.filter(m => m.is_admin);
            
            elements.adminInput.value = '';
            renderChatData();
            showStatus(`Пользователь @${username} назначен администратором`, 'success');
        } else {
            showStatus(`Ошибка: ${promoteData.description}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка назначения:', error);
        showStatus('Ошибка назначения администратора', 'error');
    }
}

// Разжалование администратора
async function demoteAdmin(userId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/promoteChatMember?chat_id=${state.currentChat.id}&user_id=${userId}&can_change_info=false&can_post_messages=false&can_edit_messages=false&can_delete_messages=false&can_invite_users=false&can_restrict_members=false&can_pin_messages=false&can_promote_members=false`);
        const data = await response.json();
        
        if (data.ok) {
            // Обновляем локальные данные
            const member = state.members.find(m => m.id === userId);
            if (member) {
                member.is_admin = false;
            }
            
            state.admins = state.admins.filter(a => a.id !== userId);
            
            renderChatData();
            showStatus('Администратор разжалован', 'success');
        } else {
            showStatus(`Ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка разжалования:', error);
        showStatus('Ошибка разжалования администратора', 'error');
    }
}

// Сохранение настроек чата
async function saveChatSettings() {
    const newTitle = elements.chatNameInput.value.trim();
    const newDesc = elements.chatDescInput.value.trim();
    const newRules = elements.chatRules.value.trim();
    
    if (!newTitle) {
        showStatus('Введите название чата', 'error');
        return;
    }
    
    try {
        // 1. Обновляем название чата
        if (newTitle !== state.chatSettings.title) {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatTitle?chat_id=${state.currentChat.id}&title=${encodeURIComponent(newTitle)}`);
            const data = await response.json();
            
            if (!data.ok) {
                showStatus(`Ошибка: ${data.description}`, 'error');
                return;
            }
        }
        
        // 2. Обновляем описание чата
        if (newDesc !== state.chatSettings.description) {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatDescription?chat_id=${state.currentChat.id}&description=${encodeURIComponent(newDesc)}`);
            const data = await response.json();
            
            // Описание может быть пустым, это нормально
            if (!data.ok && data.description !== 'Bad Request: chat description is not modified') {
                showStatus(`Ошибка: ${data.description}`, 'error');
                return;
            }
        }
        
        // 3. Сохраняем правила (в реальном приложении нужно сохранять на сервере)
        state.chatSettings = {
            title: newTitle,
            description: newDesc,
            rules: newRules
        };
        
        showStatus('Настройки чата сохранены', 'success');
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showStatus('Ошибка сохранения настроек чата', 'error');
    }
}

// Поиск участников
async function searchMembers() {
    const query = elements.searchMember.value.trim();
    if (!query) {
        renderMembersList();
        return;
    }
    
    try {
        // В реальном приложении нужно реализовать поиск через API
        // Здесь просто фильтруем локальный список
        const filtered = state.members.filter(member => 
            member.username.includes(query) || 
            member.id.toString().includes(query)
        );
        
        // Временно заменяем список участников
        const originalMembers = state.members;
        state.members = filtered;
        renderMembersList();
        state.members = originalMembers;
    } catch (error) {
        console.error('Ошибка поиска:', error);
        showStatus('Ошибка поиска участников', 'error');
    }
}

// ==================== Вспомогательные функции ====================

// Отображение данных чата
function renderChatData() {
    // Обновляем заголовок
    elements.chatTitle.textContent = state.currentChat.title;
    
    // Настройки чата
    elements.chatNameInput.value = state.chatSettings.title;
    elements.chatDescInput.value = state.chatSettings.description || '';
    elements.chatRules.value = state.chatSettings.rules || '';
    
    // Настройки модерации
    elements.autoDeleteSpam.checked = state.moderationSettings.autoDeleteSpam;
    elements.autoWarn.checked = state.moderationSettings.autoWarn;
    elements.warnLimit.value = state.moderationSettings.warnLimit;
    elements.bannedWords.value = state.moderationSettings.bannedWords.join(', ');
    
    // Списки участников и администраторов
    renderMembersList();
    renderAdminsList();
    
    // Пагинация
    updatePagination();
}

// Отрисовка списка участников
function renderMembersList() {
    elements.membersList.innerHTML = '';
    
    const start = (state.pagination.membersPage - 1) * state.pagination.membersPerPage;
    const end = start + state.pagination.membersPerPage;
    const paginatedMembers = state.members.slice(start, end);
    
    if (paginatedMembers.length === 0) {
        elements.membersList.innerHTML = '<div class="list-item">Участники не найдены</div>';
        return;
    }
    
    paginatedMembers.forEach(member => {
        const memberEl = document.createElement('div');
        memberEl.className = 'list-item';
        
        memberEl.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${member.username.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="user-name">${member.username}</div>
                    <div class="user-username">ID: ${member.id}</div>
                </div>
            </div>
            <div class="actions">
                ${!member.is_admin ? `
                    <button class="btn warning" onclick="promoteToAdmin(${member.id})">Сделать админом</button>
                    <button class="btn danger" onclick="showModal('Исключение', 'Вы уверены, что хотите исключить этого пользователя?', () => kickMember(${member.id}))">Исключить</button>
                ` : ''}
            </div>
        `;
        
        elements.membersList.appendChild(memberEl);
    });
    
    updatePagination();
}

// Отрисовка списка администраторов
function renderAdminsList() {
    elements.adminsList.innerHTML = '';
    
    if (state.admins.length === 0) {
        elements.adminsList.innerHTML = '<div class="list-item">Администраторы не найдены</div>';
        return;
    }
    
    state.admins.forEach(admin => {
        const adminEl = document.createElement('div');
        adminEl.className = 'list-item';
        
        adminEl.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${admin.username.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="user-name">${admin.username}</div>
                    <div class="user-username">${admin.status === 'creator' ? 'Создатель' : 'Администратор'}</div>
                </div>
            </div>
            <div class="actions">
                ${admin.status !== 'creator' ? `
                    <button class="btn danger" onclick="showModal('Разжалование', 'Вы уверены, что хотите разжаловать этого администратора?', () => demoteAdmin(${admin.id}))">Разжаловать</button>
                ` : ''}
            </div>
        `;
        
        elements.adminsList.appendChild(adminEl);
    });
}

// Обновление пагинации
function updatePagination() {
    const totalPages = Math.ceil(state.members.length / state.pagination.membersPerPage);
    elements.membersPageInfo.textContent = `Страница ${state.pagination.membersPage} из ${totalPages}`;
    
    elements.prevMembersPage.disabled = state.pagination.membersPage <= 1;
    elements.nextMembersPage.disabled = state.pagination.membersPage >= totalPages;
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
        section.classList.toggle('active', section.id === sectionId);
    });
    
    // Прокрутка вверх
    window.scrollTo(0, 0);
}

// Показать статусное сообщение
function showStatus(message, type = 'success') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status ${type}`;
    elements.statusMessage.style.display = 'block';
    
    setTimeout(() => {
        elements.statusMessage.style.display = 'none';
    }, 5000);
}

// Модальное окно
let currentModalCallback = null;

function showModal(title, text, callback) {
    elements.modalTitle.textContent = title;
    elements.modalText.textContent = text;
    currentModalCallback = callback;
    elements.modal.classList.add('active');
}

function hideModal() {
    elements.modal.classList.remove('active');
    currentModalCallback = null;
}

// Сохранение настроек
function saveSettings() {
    localStorage.setItem('moderatorSettings', JSON.stringify(state.appSettings));
}

function loadSettings() {
    const saved = localStorage.getItem('moderatorSettings');
    if (saved) {
        state.appSettings = JSON.parse(saved);
        updateUI();
    }
}

function updateAppSettings() {
    state.appSettings = {
        language: elements.language.value,
        theme: elements.theme.value,
        notifications: elements.notifications.checked
    };
    
    saveSettings();
    updateUI();
}

function resetSettings() {
    localStorage.removeItem('moderatorSettings');
    state.appSettings = {
        language: 'ru',
        theme: 'system',
        notifications: true
    };
    
    updateUI();
    hideModal();
    showStatus('Настройки сброшены', 'success');
}

async function leaveAllChats() {
    // В реальном приложении нужно отправить запросы на выход из всех чатов
    showStatus('Функция в разработке', 'warning');
    hideModal();
}

// Обновление интерфейса
function updateUI() {
    // Применяем настройки
    elements.language.value = state.appSettings.language;
    elements.theme.value = state.appSettings.theme;
    elements.notifications.checked = state.appSettings.notifications;
    
    // Версия бота
    elements.botVersion.textContent = BOT_VERSION;
    
    // Применяем тему
    document.documentElement.style.setProperty('--background-color', state.appSettings.theme === 'dark' ? '#121212' : '#f5f5f5');
    document.documentElement.style.setProperty('--card-color', state.appSettings.theme === 'dark' ? '#1e1e1e' : '#ffffff');
    document.documentElement.style.setProperty('--text-color', state.appSettings.theme === 'dark' ? '#f5f5f5' : '#212529');
    document.documentElement.style.setProperty('--border-color', state.appSettings.theme === 'dark' ? '#333' : '#dee2e6');
}

// Глобальные функции для вызова из HTML
window.promoteToAdmin = function(userId) {
    showModal(
        'Назначение администратора',
        'Вы уверены, что хотите назначить этого пользователя администратором?',
        () => {
            const member = state.members.find(m => m.id === userId);
            if (member) {
                member.is_admin = true;
                state.admins.push(member);
                renderChatData();
                showStatus('Пользователь назначен администратором', 'success');
            }
            hideModal();
        }
    );
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', initApp);

// Обработчики модального окна
elements.modalConfirm.addEventListener('click', () => {
    if (currentModalCallback) {
        currentModalCallback();
    }
    hideModal();
});
