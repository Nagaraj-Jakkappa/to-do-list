const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const clearBtn = document.getElementById('clearBtn');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const recurringSelect = document.getElementById('recurringSelect');
const filterPriority = document.getElementById('filterPriority');
const filterStatus = document.getElementById('filterStatus');
const searchInput = document.getElementById('searchInput');
const progressBar = document.getElementById('progressBar');
const darkModeToggle = document.getElementById('darkModeToggle');
const exportBtn = document.getElementById('exportBtn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
tasks.forEach(t => createTaskElement(t.text, t.completed, t.priority, t.dueDate, t.recurring));

function saveTasks() {
    const tasksToSave = [];
    document.querySelectorAll('#taskList li').forEach(li => {
        tasksToSave.push({
            text: li.querySelector('.taskText').textContent,
            completed: li.classList.contains('completed'),
            priority: li.querySelector('.priority').textContent,
            dueDate: li.querySelector('.dueDate').textContent,
            recurring: li.querySelector('.recurring').textContent
        });
    });
    localStorage.setItem('tasks', JSON.stringify(tasksToSave));
    updateProgressBar();
}

function updateProgressBar() {
    const all = document.querySelectorAll('#taskList li').length;
    const done = document.querySelectorAll('#taskList li.completed').length;
    const percent = all === 0 ? 0 : Math.round(done / all * 100);
    progressBar.style.width = percent + '%';
    if (percent <= 30) progressBar.style.background = 'linear-gradient(90deg, #ff4d4f, #faad14)';
    else if (percent <= 70) progressBar.style.background = 'linear-gradient(90deg, #faad14, #52c41a)';
    else progressBar.style.background = 'linear-gradient(90deg, #52c41a, #1890ff)';
}

function createTaskElement(text, completed = false, priority = 'Medium', dueDate = '', recurring = 'None') {
    const li = document.createElement('li'); li.draggable = true;

    const contentDiv = document.createElement('div'); contentDiv.className = 'taskContent';
    const span = document.createElement('span'); span.textContent = text; span.className = 'taskText'; contentDiv.appendChild(span);
    const prioritySpan = document.createElement('span'); prioritySpan.textContent = priority; prioritySpan.className = `priority ${priority}`; contentDiv.appendChild(prioritySpan);
    const dueSpan = document.createElement('span'); dueSpan.textContent = dueDate; dueSpan.className = 'dueDate'; contentDiv.appendChild(dueSpan);
    const recurringSpan = document.createElement('span'); recurringSpan.textContent = recurring; recurringSpan.className = 'recurring'; contentDiv.appendChild(recurringSpan);
    li.appendChild(contentDiv);

    if (completed) li.classList.add('completed');
    if (dueDate && new Date(dueDate) < new Date() && !completed) { li.classList.add('overdue'); animateOverdue(li); }

    span.addEventListener('click', () => {
        li.classList.toggle('completed');
        if (li.classList.contains('completed')) li.classList.remove('overdue');
        else if (dueDate && new Date(dueDate) < new Date()) animateOverdue(li);
        handleRecurringTask(li, text, priority, dueDate, recurring);
        saveTasks(); applyFilters();
    });

    const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.className = 'deleteBtn';
    deleteBtn.addEventListener('click', () => { li.remove(); saveTasks(); });
    li.appendChild(deleteBtn);

    li.addEventListener('dragstart', () => li.classList.add('dragging'));
    li.addEventListener('dragend', () => { li.classList.remove('dragging'); saveTasks(); });

    animateGradient(li);
    taskList.appendChild(li);
    updateProgressBar(); applyFilters();
}

function animateGradient(li) { let angle = 135; setInterval(() => { angle += 1; li.style.background = `linear-gradient(${angle}deg,#ffffff,#f1f5f9)`; }, 100); }
function animateOverdue(li) { li.animate([{ transform: 'scale(1)', backgroundColor: '#ffe5e5' }, { transform: 'scale(1.02)', backgroundColor: '#ffcccc' }, { transform: 'scale(1)', backgroundColor: '#ffe5e5' }], { duration: 1500, iterations: Infinity }); }

function handleRecurringTask(li, text, priority, dueDate, recurring) {
    if (!li.classList.contains('completed')) return;
    if (recurring === 'Daily') { const d = new Date(dueDate); d.setDate(d.getDate() + 1); createTaskElement(text, false, priority, d.toISOString().split('T')[0], recurring); }
    else if (recurring === 'Weekly') { const d = new Date(dueDate); d.setDate(d.getDate() + 7); createTaskElement(text, false, priority, d.toISOString().split('T')[0], recurring); }
    else if (recurring === 'Monthly') { const d = new Date(dueDate); d.setMonth(d.getMonth() + 1); createTaskElement(text, false, priority, d.toISOString().split('T')[0], recurring); }
}

addBtn.addEventListener('click', () => {
    const t = taskInput.value.trim(); if (t !== '') { createTaskElement(t, false, prioritySelect.value, dueDateInput.value, recurringSelect.value); taskInput.value = ''; dueDateInput.value = ''; recurringSelect.value = 'None'; saveTasks(); }
});
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addBtn.click(); });

clearBtn.addEventListener('click', () => { taskList.innerHTML = ''; localStorage.removeItem('tasks'); updateProgressBar(); });

taskList.addEventListener('dragover', e => {
    e.preventDefault(); const dragging = document.querySelector('.dragging'); const after = getDragAfterElement(taskList, e.clientY);
    if (!after) taskList.appendChild(dragging); else taskList.insertBefore(dragging, after);
});
function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll('li:not(.dragging)')];
    return els.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child }; else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function applyFilters() {
    const p = filterPriority.value, s = filterStatus.value, search = searchInput.value.toLowerCase();
    document.querySelectorAll('#taskList li').forEach(li => {
        const tText = li.querySelector('.taskText').textContent.toLowerCase();
        const taskPriority = li.querySelector('.priority').textContent;
        const completed = li.classList.contains('completed');
        let show = true;
        if (p !== 'All' && taskPriority !== p) show = false;
        if (s === 'Completed' && !completed) show = false;
        if (s === 'Pending' && completed) show = false;
        if (search && !tText.includes(search)) show = false;
        li.style.display = show ? 'flex' : 'none';
    });
}

filterPriority.addEventListener('change', applyFilters);
filterStatus.addEventListener('change', applyFilters);
searchInput.addEventListener('input', applyFilters);

/* ===== Dark Mode Toggle ===== */
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

/* ===== Export CSV ===== */
exportBtn.addEventListener('click', () => {
    let csv = "data:text/csv;charset=utf-8,Task,Priority,Due Date,Recurring,Completed\n";
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(t => csv += `${t.text},${t.priority},${t.dueDate},${t.recurring},${t.completed}\n`);
    const encoded = encodeURI(csv);
    const link = document.createElement('a'); link.setAttribute('href', encoded); link.setAttribute('download', 'tasks.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link);
});
