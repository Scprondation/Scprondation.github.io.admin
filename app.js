// Основной модуль приложения
const App = (function() {
    // Состояние приложения
    const state = {
        isAdmin: false,
        groupSettings: {},
        users: [],
        currentChat: null,
        botUser: null,
        initialized: false
    };

    // DOM элементы
    let elements = {};

    // Инициализация приложения
    function init() {
        setupDOMReferences();
        setupEventListeners();
        
        // Инициализация Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            // Получаем данные от бота
            const initData = Telegram.WebApp.initData || {};
            const initDataUnsafe = Telegram.WebApp.initDataUnsafe || {};
            
            // Сохраняем информацию о чате и пользователе
            state.currentChat = initDataUnsafe.chat || null;
            state.botUser = initDataUnsafe.user || null;
            
            // Проверяем права администратора
            checkAdminStatus(initDataUnsafe.user?.id);
            
            // Загружаем данные группы
            loadGroupData();
        } else {
            console.error('Telegram WebApp not detected! Running in standalone mode.');
            // Режим разработки - моки данных
            mockData();
        }
        
        state.initialized = true;
    }

    // Установка ссылок на DOM элементы
    function setupDOMReferences() {
        elements = {
            adminSettingsSection: document.getElementById('adminSettings'),
            saveSettingsBtn: document.getElementById('saveSettings'),
            userListElement: document.getElementById('userList'),
            totalUsersElement: document.getElementById('totalUsers'),
            bannedUsersElement: document.getElementById('bannedUsers'),
            activeWarningsElement: document.getElementById('activeWarnings'),
            censorAds: document.getElementById('censorAds'),
            censorSwearing: document.getElementById('censorSwearing'),
            censorThreats: document.getElementById('censorThreats'),
            maxWarnings: document.getElementById('maxWarnings')
        };
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        if (elements.saveSettingsBtn) {
            elements.saveSettingsBtn.addEventListener('click', saveSettings);
        }
        
        // Обработчик для кнопки "Назад" в Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            Telegram.WebApp.onEvent('backButtonClicked', handleBackButton);
        }
    }

    // Проверка прав администратора
    async function checkAdminStatus(userId) {
        if (!userId || !state.currentChat) {
            state.isAdmin = false;
            updateUI();
            return;
        }
        
        try {
            // В реальном приложении здесь будет запрос к боту
            const response = await mockApiRequest('getChatAdministrators', {
                chat_id: state.currentChat.id
            });
            
            state.isAdmin = response.some(admin => 
                admin.user.id === userId && 
                (admin.status === 'creator' || admin.status === 'administrator')
            );
        } catch (error) {
            console.error('Error checking admin status:', error);
            state.isAdmin = false;
        }
        
        updateUI();
    }

    // Загрузка данных группы
    async function loadGroupData() {
        if (!state.currentChat) return;
        
        try {
            // Загружаем настройки группы
            const settings = await mockApiRequest('getGroupSettings', {
                chat_id: state.currentChat.id
            });
            
            state.groupSettings = settings || {
                censorAds: true,
                censorSwearing: true,
                censorThreats: true,
                maxWarnings: 3,
                warnAction: 'mute',
                muteDurationBase: 30
            };
            
            // Загружаем список пользователей
            const users = await mockApiRequest('getChatMembers', {
                chat_id: state.currentChat.id
            });
            
            state.users = users || [];
            
            // Обновляем UI
            updateUI();
        } catch (error) {
            console.error('Error loading group data:', error);
        }
    }

    // Сохранение настроек
    async function saveSettings() {
        if (!state.isAdmin || !state.currentChat) return;
        
        const newSettings = {
            censorAds: elements.censorAds.value === 'true',
            censorSwearing: elements.censorSwearing.value === 'true',
            censorThreats: elements.censorThreats.value === 'true',
            maxWarnings: parseInt(elements.maxWarnings.value) || 3,
            warnAction: 'mute',
            muteDurationBase: 30
        };
        
        try {
            // В реальном приложении здесь будет запрос к боту
            await mockApiRequest('setGroupSettings', {
                chat_id: state.currentChat.id,
                settings: newSettings
            });
            
            state.groupSettings = newSettings;
            showAlert('Настройки успешно сохранены!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showAlert('Ошибка при сохранении настроек', 'error');
        }
    }

    // Предупреждение пользователя
    async function warnUser(userId) {
        const user = state.users.find(u => u.user.id === userId);
        if (!user || !state.currentChat) return;
        
        try {
            // В реальном приложении здесь будет запрос к боту
            const result = await mockApiRequest('warnUser', {
                chat_id: state.currentChat.id,
                user_id: userId,
                reason: 'Manual warning from admin'
            });
            
            if (result.success) {
                // Обновляем локальное состояние
                const userIndex = state.users.findIndex(u => u.user.id === userId);
                if (userIndex !== -1) {
                    state.users[userIndex].warnings = result.newWarnings;
                    state.users[userIndex].isBanned = result.isBanned;
                    
                    if (result.isBanned) {
                        showAlert(`Пользователь ${user.user.first_name} заблокирован за превышение лимита предупреждений!`, 'warning');
                    } else {
                        const muteDuration = result.newWarnings * state.groupSettings.muteDurationBase;
                        showAlert(`Пользователь ${user.user.first_name} получил предупреждение (${result.newWarnings}/${state.groupSettings.maxWarnings}). Мут на ${muteDuration} секунд.`, 'info');
                    }
                    
                    updateUI();
                }
            }
        } catch (error) {
            console.error('Error warning user:', error);
            showAlert('Ошибка при выдаче предупреждения', 'error');
        }
    }

    // Мут пользователя
    async function muteUser(userId, duration = null) {
        const user = state.users.find(u => u.user.id === userId);
        if (!user || !state.currentChat) return;
        
        const muteDuration = duration || (user.warnings || 1) * state.groupSettings.muteDurationBase;
        
        try {
            // В реальном приложении здесь будет запрос к боту
            await mockApiRequest('restrictUser', {
                chat_id: state.currentChat.id,
                user_id: userId,
                until_date: Math.floor(Date.now() / 1000) + muteDuration,
                permissions: {
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_polls: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false,
                    can_change_info: false,
                    can_invite_users: false,
                    can_pin_messages: false
                }
            });
            
            showAlert(`Пользователь ${user.user.first_name} получил мут на ${muteDuration} секунд.`, 'info');
        } catch (error) {
            console.error('Error muting user:', error);
            showAlert('Ошибка при выдаче мута', 'error');
        }
    }

    // Бан/разбан пользователя
    async function toggleBanUser(userId) {
        const user = state.users.find(u => u.user.id === userId);
        if (!user || !state.currentChat) return;
        
        const isBanAction = !user.isBanned;
        
        try {
            // В реальном приложении здесь будет запрос к боту
            if (isBanAction) {
                await mockApiRequest('banUser', {
                    chat_id: state.currentChat.id,
                    user_id: userId,
                    revoke_messages: true
                });
            } else {
                await mockApiRequest('unbanUser', {
                    chat_id: state.currentChat.id,
                    user_id: userId
                });
            }
            
            // Обновляем локальное состояние
            const userIndex = state.users.findIndex(u => u.user.id === userId);
            if (userIndex !== -1) {
                state.users[userIndex].isBanned = isBanAction;
                state.users[userIndex].warnings = isBanAction ? state.groupSettings.maxWarnings : 0;
                
                showAlert(`Пользователь ${user.user.first_name} ${isBanAction ? 'заблокирован' : 'разблокирован'}!`, isBanAction ? 'warning' : 'success');
                updateUI();
            }
        } catch (error) {
            console.error('Error toggling ban:', error);
            showAlert(`Ошибка при ${isBanAction ? 'блокировке' : 'разблокировке'} пользователя`, 'error');
        }
    }

    // Обновление UI
    function updateUI() {
        if (!state.initialized) return;
        
        // Обновляем видимость админских элементов
        elements.adminSettingsSection.classList.toggle('hidden', !state.isAdmin);
        
        // Обновляем настройки
        if (state.groupSettings) {
            elements.censorAds.value = state.groupSettings.censorAds;
            elements.censorSwearing.value = state.groupSettings.censorSwearing;
            elements.censorThreats.value = state.groupSettings.censorThreats;
            elements.maxWarnings.value = state.groupSettings.maxWarnings;
        }
        
        // Обновляем список пользователей
        renderUserList();
        
        // Обновляем статистику
        updateStats();
    }

    // Рендер списка пользователей
    function renderUserList() {
        elements.userListElement.innerHTML = '';
        
        state.users.forEach(userData => {
            const user = userData.user;
            const warnings = userData.warnings || 0;
            const isBanned = userData.isBanned || false;
            
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            
            const userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            const username = user.username ? `@${user.username}` : '';
            
            userInfo.innerHTML = `
                <strong>${userName}</strong> ${username}
                <br>
                <span class="${warnings > 0 ? 'warning' : ''}">
                    Предупреждения: ${warnings}/${state.groupSettings.maxWarnings}
                </span>
                ${isBanned ? '<span class="danger"> (Заблокирован)</span>' : ''}
            `;
            
            const userActions = document.createElement('div');
            userActions.className = 'user-actions';
            
            if (!isBanned) {
                const warnBtn = document.createElement('button');
                warnBtn.textContent = 'Предупредить';
                warnBtn.className = 'warning';
                warnBtn.addEventListener('click', () => warnUser(user.id));
                userActions.appendChild(warnBtn);
                
                if (state.isAdmin) {
                    const muteBtn = document.createElement('button');
                    muteBtn.textContent = 'Мут';
                    muteBtn.addEventListener('click', () => muteUser(user.id));
                    userActions.appendChild(muteBtn);
                }
            }
            
            if (state.isAdmin) {
                const banBtn = document.createElement('button');
                banBtn.textContent = isBanned ? 'Разблокировать' : 'Бан';
                banBtn.className = 'danger';
                banBtn.addEventListener('click', () => toggleBanUser(user.id));
                userActions.appendChild(banBtn);
            }
            
            userElement.appendChild(userInfo);
            userElement.appendChild(userActions);
            elements.userListElement.appendChild(userElement);
        });
    }

    // Обновление статистики
    function updateStats() {
        elements.totalUsersElement.textContent = state.users.length;
        elements.bannedUsersElement.textContent = state.users.filter(u => u.isBanned).length;
        elements.activeWarningsElement.textContent = state.users.reduce((sum, u) => sum + (u.warnings || 0), 0);
    }

    // Показать уведомление
    function showAlert(message, type = 'info') {
        // В реальном приложении можно использовать Telegram.WebApp.showAlert
        if (window.Telegram && window.Telegram.WebApp) {
            Telegram.WebApp.showAlert(message);
        } else {
            alert(message);
        }
        
        // Добавляем визуальный эффект
        const alertElement = document.createElement('div');
        alertElement.className = `alert ${type}`;
        alertElement.textContent = message;
        document.body.appendChild(alertElement);
        
        setTimeout(() => {
            alertElement.remove();
        }, 3000);
    }

    // Обработчик кнопки "Назад"
    function handleBackButton() {
        if (window.Telegram && window.Telegram.WebApp) {
            Telegram.WebApp.close();
        }
    }

    // Мок API для разработки
    async function mockApiRequest(method, params = {}) {
        console.log(`Mock API call: ${method}`, params);
        
        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 300));
        
        switch (method) {
            case 'getChatAdministrators':
                return [
                    {
                        user: {
                            id: 123456789,
                            first_name: "Admin",
                            last_name: "User",
                            username: "admin_user",
                            is_bot: false
                        },
                        status: "administrator",
                        can_restrict_members: true,
                        can_promote_members: false
                    },
                    {
                        user: state.botUser,
                        status: "administrator",
                        can_restrict_members: true,
                        can_promote_members: false
                    }
                ];
            
            case 'getGroupSettings':
                return {
                    censorAds: true,
                    censorSwearing: true,
                    censorThreats: true,
                    maxWarnings: 3,
                    warnAction: 'mute',
                    muteDurationBase: 30
                };
            
            case 'getChatMembers':
                return [
                    {
                        user: {
                            id: 111111111,
                            first_name: "Иван",
                            last_name: "Иванов",
                            username: "ivanov",
                            is_bot: false
                        },
                        warnings: 2,
                        isBanned: false
                    },
                    {
                        user: {
                            id: 222222222,
                            first_name: "Петр",
                            last_name: "Петров",
                            username: "petrov",
                            is_bot: false
                        },
                        warnings: 0,
                        isBanned: false
                    },
                    {
                        user: {
                            id: 333333333,
                            first_name: "Сергей",
                            last_name: "Сидоров",
                            username: "sidorov",
                            is_bot: false
                        },
                        warnings: 5,
                        isBanned: true
                    },
                    {
                        user: state.botUser,
                        warnings: 0,
                        isBanned: false
                    }
                ];
            
            case 'setGroupSettings':
                return { success: true };
            
            case 'warnUser':
                const user = state.users.find(u => u.user.id === params.user_id);
                const newWarnings = (user?.warnings || 0) + 1;
                const isBanned = newWarnings >= state.groupSettings.maxWarnings;
                
                return {
                    success: true,
                    newWarnings,
                    isBanned
                };
            
            case 'restrictUser':
                return { success: true };
            
            case 'banUser':
                return { success: true };
            
            case 'unbanUser':
                return { success: true };
            
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }

    // Мок данных для разработки
    function mockData() {
        state.currentChat = {
            id: -1001234567890,
            type: 'supergroup',
            title: 'Тестовая группа'
        };
        
        state.botUser = {
            id: 987654321,
            first_name: "GroupHelperBot",
            username: "GHClone5Bot",
            is_bot: true
        };
        
        state.isAdmin = true;
        
        loadGroupData();
    }

    // Публичный API
    return {
        init,
        warnUser,
        muteUser,
        toggleBanUser
    };
})();

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', App.init);
