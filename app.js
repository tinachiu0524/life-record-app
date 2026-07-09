const STORAGE_KEY = 'life-record-webapp-v1';
const APP_VERSION = '2026-07-09-ios-shortcut-reminders';
const SHORTCUT_NAME = '生活记录添加提醒';

const fixedDailyTodos = [
    { time: '08:30', text: '上班打卡' },
    { time: '18:00', text: '下班打卡' }
];

const state = loadState();

const typeNameMap = {
    meal: '饮食',
    transport: '出行',
    shopping: '购物',
    food: '饮食',
    exercise: '运动'
};

function loadState() {
    const fallback = {
        records: [],
        todos: [],
        scheduledTodos: [],
        fixedDone: {},
        notified: {}
    };

    try {
        return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch {
        return fallback;
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayString() {
    return new Date().toISOString().slice(0, 10);
}

function makeId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setDefaultDates() {
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) input.value = todayString();
    });
}

function switchPage(pageId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.page === pageId));
    document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === pageId));
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
}

function fileToDataUrl(file) {
    return new Promise(resolve => {
        if (!file) {
            resolve('');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
}

function imagePreviewHtml(record) {
    if (!record.image) return '';
    return `<div class="image-preview"><img src="${record.image}" alt="记录图片"></div>`;
}

function formatRecord(record) {
    switch (record.type) {
        case 'meal':
            return `${record.date}｜${record.mealType}：${record.foods}${record.note ? `｜备注：${record.note}` : ''}`;
        case 'transport': {
            const route = record.from || record.to ? `｜路线：${record.from || '-'} → ${record.to || '-'}` : '';
            return `${record.date}｜${record.tool}｜${record.minutes} 分钟${route}${record.note ? `｜备注：${record.note}` : ''}`;
        }
        case 'shopping':
            return `${record.date}｜${record.item}：${Number(record.amount).toFixed(2)} 元｜${record.payment}${record.note ? `｜备注：${record.note}` : ''}`;
        case 'food': {
            const amount = Number(record.amount || 0);
            const expense = amount > 0 ? `｜花费：${amount.toFixed(2)} 元｜${record.payment || '未记录支付方式'}` : '';
            return `${record.date}｜${record.mealType || '饮食'}：${record.item || record.foods || ''}${expense}${record.note ? `｜备注：${record.note}` : ''}`;
        }
        case 'exercise':
            return `${record.date}｜${record.exerciseType}｜${record.minutes} 分钟｜强度：${record.intensity}${record.note ? `｜备注：${record.note}` : ''}`;
        default:
            return '';
    }
}

function renderAll() {
    renderRecordCount();
    renderRecords();
    renderSummary();
    renderTodos();
    renderScheduledTodos();
    renderFixedTodos();
}

function renderRecordCount() {
    document.getElementById('recordCount').textContent = `${state.records.length} 条记录`;
}

function renderRecords(dateFilter = null) {
    const list = document.getElementById('recordList');
    const records = [...state.records]
        .filter(record => !dateFilter || record.date === dateFilter)
        .sort((a, b) => b.date.localeCompare(a.date));

    if (records.length === 0) {
        list.innerHTML = '<div class="record-item">暂无记录</div>';
        return;
    }

    list.innerHTML = records.map(record => `
        <article class="record-item ${record.type}">
            <span class="record-type">${typeNameMap[record.type] || '记录'}</span>
            <div>${formatRecord(record)}</div>
            ${imagePreviewHtml(record)}
        </article>
    `).join('');
}

function renderSummary() {
    const shoppingTotal = state.records
        .filter(record => record.type === 'shopping')
        .reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const foodTotal = state.records
        .filter(record => record.type === 'food')
        .reduce((sum, record) => sum + Number(record.amount || 0), 0);

    document.getElementById('shoppingTotal').textContent = `${shoppingTotal.toFixed(2)} 元`;
    document.getElementById('foodTotal').textContent = `${foodTotal.toFixed(2)} 元`;
    document.getElementById('allTotal').textContent = `${(shoppingTotal + foodTotal).toFixed(2)} 元`;
}

function renderTodos() {
    const list = document.getElementById('todoList');
    const doneCount = state.todos.filter(todo => todo.done).length;
    document.getElementById('todoSummary').textContent = `共 ${state.todos.length} 项，已完成 ${doneCount} 项`;

    if (state.todos.length === 0) {
        list.innerHTML = '<div class="record-item">暂无待办事项</div>';
        return;
    }

    list.innerHTML = state.todos.map(todo => `
        <div class="todo-row ${todo.done ? 'done' : ''}" data-id="${todo.id}">
            <input type="checkbox" ${todo.done ? 'checked' : ''} aria-label="完成待办">
            <span>${todo.text}</span>
            <button class="secondary delete-todo" type="button">删除</button>
        </div>
    `).join('');
}

function renderScheduledTodos() {
    const list = document.getElementById('scheduledTodoList');
    if (!state.scheduledTodos.length) {
        list.innerHTML = '<div class="record-item">暂无指定时间提醒</div>';
        return;
    }

    const sorted = [...state.scheduledTodos].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    list.innerHTML = sorted.map(todo => `
        <div class="todo-row ${todo.done ? 'done' : ''}" data-scheduled-id="${todo.id}">
            <input type="checkbox" ${todo.done ? 'checked' : ''} aria-label="完成提醒待办">
            <span>${todo.date} ${todo.time}｜${todo.text}</span>
            <button class="secondary sync-shortcut" type="button">同步到 iPhone 提醒</button>
            <button class="secondary delete-scheduled" type="button">删除</button>
        </div>
    `).join('');
}

function openReminderShortcut(todo) {
    const payload = `${todo.text}\n${todo.date}\n${todo.time}`;
    const shortcutUrl = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=text&text=${encodeURIComponent(payload)}`;
    showToast('正在打开快捷指令');
    window.location.href = shortcutUrl;
}

function fixedKey(item, date = todayString()) {
    return `${date}|${item.time}|${item.text}`;
}

function renderFixedTodos() {
    const list = document.getElementById('fixedTodoList');
    list.innerHTML = fixedDailyTodos.map(item => {
        const key = fixedKey(item);
        const done = Boolean(state.fixedDone[key]);
        return `
            <div class="todo-row ${done ? 'done' : ''}" data-fixed-key="${key}">
                <input type="checkbox" ${done ? 'checked' : ''} aria-label="完成固定待办">
                <span>${item.time} ${item.text}</span>
            </div>
        `;
    }).join('');
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchPage(tab.dataset.page));
    });
}

function setupForms() {
    document.querySelectorAll('[data-form]').forEach(form => {
        form.addEventListener('submit', async event => {
            event.preventDefault();
            const formData = new FormData(form);
            const type = form.dataset.form;
            const record = { id: makeId(), type, date: formData.get('date') || todayString(), note: formData.get('note') || '' };

            if (type === 'meal') {
                Object.assign(record, {
                    mealType: formData.get('mealType'),
                    foods: formData.get('foods')
                });
            } else if (type === 'transport') {
                Object.assign(record, {
                    tool: formData.get('tool'),
                    from: formData.get('from') || '',
                    to: formData.get('to') || '',
                    minutes: Number(formData.get('minutes') || 0)
                });
            } else if (type === 'shopping') {
                Object.assign(record, {
                    item: formData.get('item'),
                    amount: Number(formData.get('amount') || 0),
                    payment: formData.get('payment'),
                    image: await fileToDataUrl(formData.get('image'))
                });
                if (record.amount <= 0) {
                    showToast('金额需要大于 0');
                    return;
                }
            } else if (type === 'food') {
                Object.assign(record, {
                    mealType: formData.get('mealType'),
                    item: formData.get('item'),
                    amount: Number(formData.get('amount') || 0),
                    payment: formData.get('payment'),
                    image: await fileToDataUrl(formData.get('image'))
                });
            } else if (type === 'exercise') {
                Object.assign(record, {
                    exerciseType: formData.get('exerciseType'),
                    minutes: Number(formData.get('minutes') || 0),
                    intensity: formData.get('intensity')
                });
            }

            state.records.push(record);
            saveState();
            const keepDate = form.querySelector('input[type="date"]').value;
            form.reset();
            setDefaultDates();
            form.querySelector('input[type="date"]').value = keepDate || todayString();
            renderAll();
            showToast('记录已保存');
        });
    });
}

function setupTodos() {
    document.getElementById('scheduledTodoDate').value = todayString();

    document.getElementById('todoForm').addEventListener('submit', event => {
        event.preventDefault();
        const input = document.getElementById('todoText');
        const text = input.value.trim();
        if (!text) return;
        state.todos.push({ id: makeId(), text, done: false });
        input.value = '';
        saveState();
        renderTodos();
    });

    document.getElementById('scheduledTodoForm').addEventListener('submit', event => {
        event.preventDefault();
        const textInput = document.getElementById('scheduledTodoText');
        const dateInput = document.getElementById('scheduledTodoDate');
        const timeInput = document.getElementById('scheduledTodoTime');
        const text = textInput.value.trim();
        if (!text || !dateInput.value || !timeInput.value) return;

        state.scheduledTodos.push({
            id: makeId(),
            text,
            date: dateInput.value,
            time: timeInput.value,
            done: false,
            notified: false
        });
        textInput.value = '';
        saveState();
        renderScheduledTodos();
        showToast('提醒待办已添加');
    });

    document.getElementById('todoList').addEventListener('click', event => {
        const row = event.target.closest('.todo-row');
        if (!row) return;
        const todo = state.todos.find(item => item.id === row.dataset.id);
        if (!todo) return;

        if (event.target.matches('input[type="checkbox"]')) {
            todo.done = event.target.checked;
        } else if (event.target.matches('.delete-todo')) {
            state.todos = state.todos.filter(item => item.id !== todo.id);
        }
        saveState();
        renderTodos();
    });

    document.getElementById('scheduledTodoList').addEventListener('click', event => {
        const row = event.target.closest('.todo-row');
        if (!row) return;
        const todo = state.scheduledTodos.find(item => item.id === row.dataset.scheduledId);
        if (!todo) return;

        if (event.target.matches('input[type="checkbox"]')) {
            todo.done = event.target.checked;
        } else if (event.target.matches('.sync-shortcut')) {
            openReminderShortcut(todo);
            return;
        } else if (event.target.matches('.delete-scheduled')) {
            state.scheduledTodos = state.scheduledTodos.filter(item => item.id !== todo.id);
        }
        saveState();
        renderScheduledTodos();
    });

    document.getElementById('clearDone').addEventListener('click', () => {
        state.todos = state.todos.filter(todo => !todo.done);
        saveState();
        renderTodos();
    });

    document.getElementById('fixedTodoList').addEventListener('change', event => {
        const row = event.target.closest('.todo-row');
        if (!row) return;
        state.fixedDone[row.dataset.fixedKey] = event.target.checked;
        saveState();
        renderFixedTodos();
    });
}

function setupRecords() {
    document.getElementById('filterRecords').addEventListener('click', () => {
        const value = document.getElementById('recordDateFilter').value;
        renderRecords(value || null);
    });

    document.getElementById('showAllRecords').addEventListener('click', () => renderRecords());
}

async function enableNotifications() {
    if (!('Notification' in window)) {
        showToast('当前浏览器不支持系统通知');
        return;
    }

    const permission = await Notification.requestPermission();
    showToast(permission === 'granted' ? '提醒已开启' : '未开启提醒权限');
}

function notify(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('每日固定待办', { body: message });
    } else {
        alert(message);
    }
}

function checkFixedReminders() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const current = `${hh}:${mm}`;
    const date = todayString();

    fixedDailyTodos.forEach(item => {
        const key = fixedKey(item, date);
        const notifyKey = `${date}|${item.time}|notified`;
        if (item.time === current && !state.fixedDone[key] && !state.notified[notifyKey]) {
            state.notified[notifyKey] = true;
            saveState();
            notify(item.text);
        }
    });
}

function checkScheduledReminders() {
    const now = new Date();
    const date = todayString();
    const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let changed = false;

    state.scheduledTodos.forEach(todo => {
        if (todo.date === date && todo.time === current && !todo.done && !todo.notified) {
            todo.notified = true;
            changed = true;
            notify(todo.text);
        }
    });

    if (changed) {
        saveState();
        renderScheduledTodos();
    }
}

function checkAllReminders() {
    checkFixedReminders();
    checkScheduledReminders();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
}

function init() {
    setDefaultDates();
    setupTabs();
    setupForms();
    setupTodos();
    setupRecords();
    document.getElementById('enableNotify').addEventListener('click', enableNotifications);
    renderAll();
    checkAllReminders();
    setInterval(checkAllReminders, 60 * 1000);
    registerServiceWorker();
}

init();
