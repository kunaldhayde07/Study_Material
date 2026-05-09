(() => {
  const STORAGE_KEY = 'functional-todo-app-v1';
  const THEME_KEY = 'functional-todo-theme-v1';

  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  const taskCount = document.getElementById('taskCount');
  const clearCompletedButton = document.getElementById('clearCompleted');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const emptyState = document.getElementById('emptyState');
  const emptyStateTitle = document.getElementById('emptyStateTitle');
  const emptyStateMessage = document.getElementById('emptyStateMessage');
  const themeToggle = document.getElementById('themeToggle');

  let tasks = loadTasks();
  let activeFilter = 'all';
  let editingTaskId = null;

  initializeTheme();
  render();

  taskForm.addEventListener('submit', handleAddTask);
  clearCompletedButton.addEventListener('click', clearCompletedTasks);
  themeToggle.addEventListener('click', toggleTheme);
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => setFilter(button.dataset.filter));
  });

  taskList.addEventListener('click', handleTaskListClick);
  taskList.addEventListener('change', handleTaskListChange);
  taskList.addEventListener('keydown', handleTaskListKeydown);

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((task) => task && typeof task.id === 'string' && typeof task.title === 'string')
        .map((task) => ({
          id: task.id,
          title: task.title.trim(),
          completed: Boolean(task.completed),
          createdAt: Number(task.createdAt) || Date.now(),
        }))
        .filter((task) => task.title.length > 0);
    } catch {
      return [];
    }
  }

  function persistTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Storage can fail in private browsing or if quota is exceeded.
    }
  }

  function initializeTheme() {
    const savedTheme = safeStorageGet(THEME_KEY);
    const preferredDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (preferredDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore theme persistence issues.
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  function handleAddTask(event) {
    event.preventDefault();
    const title = taskInput.value.trim();
    if (!title) {
      taskInput.value = '';
      taskInput.focus();
      return;
    }

    const newTask = {
      id: cryptoId(),
      title,
      completed: false,
      createdAt: Date.now(),
    };

    tasks = [newTask, ...tasks];
    taskInput.value = '';
    persistTasks();
    render();
    animateTaskIn(newTask.id);
    taskInput.focus();
  }

  function cryptoId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function setFilter(filter) {
    activeFilter = filter;
    filterButtons.forEach((button) => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    render();
  }

  function getFilteredTasks() {
    if (activeFilter === 'active') {
      return tasks.filter((task) => !task.completed);
    }
    if (activeFilter === 'completed') {
      return tasks.filter((task) => task.completed);
    }
    return tasks;
  }

  function render() {
    const visibleTasks = getFilteredTasks();
    taskList.innerHTML = '';

    visibleTasks.forEach((task) => {
      taskList.appendChild(buildTaskItem(task));
    });

    updateMeta();
    updateEmptyState(visibleTasks.length);
  }

  function updateMeta() {
    const remaining = tasks.filter((task) => !task.completed).length;
    const completedCount = tasks.length - remaining;
    taskCount.textContent = `${remaining} task${remaining === 1 ? '' : 's'} left`;
    clearCompletedButton.disabled = completedCount === 0;
  }

  function updateEmptyState(visibleCount) {
    const hasAnyTasks = tasks.length > 0;
    if (!hasAnyTasks) {
      emptyState.hidden = false;
      taskList.hidden = true;
      emptyStateTitle.textContent = 'No tasks yet';
      emptyStateMessage.textContent = 'Add your first task above to start building your day.';
      return;
    }

    if (visibleCount === 0) {
      taskList.hidden = true;
      emptyState.hidden = false;
      if (activeFilter === 'active') {
        emptyStateTitle.textContent = 'All tasks are completed';
        emptyStateMessage.textContent = 'Switch filters or add a new task to keep going.';
      } else {
        emptyStateTitle.textContent = 'Nothing matches this filter';
        emptyStateMessage.textContent = 'Try a different view to see your tasks.';
      }
      return;
    }

    taskList.hidden = false;
    emptyState.hidden = true;
  }

  function buildTaskItem(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' is-complete' : ''}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark ${task.title} as completed`);

    const content = document.createElement('div');
    content.className = 'task-content';

    if (editingTaskId === task.id) {
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'edit-input';
      editInput.value = task.title;
      editInput.maxLength = 160;
      editInput.setAttribute('aria-label', 'Edit task title');
      editInput.dataset.role = 'edit-input';
      content.appendChild(editInput);
    } else {
      const title = document.createElement('p');
      title.className = 'task-title';
      title.textContent = task.title;
      content.appendChild(title);
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    if (editingTaskId === task.id) {
      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.className = 'task-action task-save';
      saveButton.dataset.action = 'save';
      saveButton.textContent = 'Save';

      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'task-action task-cancel';
      cancelButton.dataset.action = 'cancel';
      cancelButton.textContent = 'Cancel';

      actions.append(saveButton, cancelButton);
    } else {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'task-action';
      editButton.dataset.action = 'edit';
      editButton.textContent = 'Edit';

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'task-action task-action--danger';
      deleteButton.dataset.action = 'delete';
      deleteButton.textContent = 'Delete';

      actions.append(editButton, deleteButton);
    }

    li.append(checkbox, content, actions);
    return li;
  }

  function handleTaskListChange(event) {
    const input = event.target;
    if (!input.classList.contains('task-checkbox')) return;

    const taskId = input.closest('.task-item')?.dataset.id;
    if (!taskId) return;

    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    task.completed = input.checked;
    persistTasks();
    render();
  }

  function handleTaskListClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const taskItem = button.closest('.task-item');
    if (!taskItem) return;

    const taskId = taskItem.dataset.id;
    const action = button.dataset.action;

    if (action === 'delete') {
      deleteTask(taskId);
      return;
    }

    if (action === 'edit') {
      startEditing(taskId);
      return;
    }

    if (action === 'cancel') {
      cancelEditing();
      return;
    }

    if (action === 'save') {
      saveEdit(taskId);
    }
  }

  function handleTaskListKeydown(event) {
    const editInput = event.target.closest('[data-role="edit-input"]');
    if (!editInput) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      const taskId = editInput.closest('.task-item')?.dataset.id;
      if (taskId) saveEdit(taskId);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  }

  function deleteTask(taskId) {
    const item = taskList.querySelector(`[data-id="${taskId}"]`);
    if (item) {
      item.classList.add('is-leaving');
      window.setTimeout(() => {
        tasks = tasks.filter((task) => task.id !== taskId);
        if (editingTaskId === taskId) {
          editingTaskId = null;
        }
        persistTasks();
        render();
      }, 180);
      return;
    }

    tasks = tasks.filter((task) => task.id !== taskId);
    if (editingTaskId === taskId) {
      editingTaskId = null;
    }
    persistTasks();
    render();
  }

  function startEditing(taskId) {
    editingTaskId = taskId;
    render();
    const editInput = taskList.querySelector('[data-role="edit-input"]');
    if (editInput) {
      editInput.focus();
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
    }
  }

  function cancelEditing() {
    editingTaskId = null;
    render();
  }

  function saveEdit(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const editInput = taskList.querySelector(`[data-id="${taskId}"] [data-role="edit-input"]`);
    if (!editInput) {
      editingTaskId = null;
      render();
      return;
    }

    const updatedTitle = editInput.value.trim();
    if (!updatedTitle) {
      editInput.focus();
      return;
    }

    task.title = updatedTitle;
    editingTaskId = null;
    persistTasks();
    render();
    animateTaskUpdate(taskId);
  }

  function clearCompletedTasks() {
    const hasCompleted = tasks.some((task) => task.completed);
    if (!hasCompleted) return;

    tasks = tasks.filter((task) => !task.completed);
    if (editingTaskId && !tasks.some((task) => task.id === editingTaskId)) {
      editingTaskId = null;
    }
    persistTasks();
    render();
  }

  function animateTaskIn(taskId) {
    const item = taskList.querySelector(`[data-id="${taskId}"]`);
    if (!item) return;
    item.classList.add('is-entering');
    requestAnimationFrame(() => {
      item.classList.remove('is-entering');
    });
  }

  function animateTaskUpdate(taskId) {
    const item = taskList.querySelector(`[data-id="${taskId}"]`);
    if (!item) return;
    item.classList.add('is-updating');
    window.setTimeout(() => item.classList.remove('is-updating'), 240);
  }
})();