// Task storage and state management
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.editingTaskId = null;
        this.deletingTaskId = null;
    }

    loadTasks() {
        const saved = localStorage.getItem('kanbanTasks');
        return saved ? JSON.parse(saved) : [];
    }

    saveTasks() {
        localStorage.setItem('kanbanTasks', JSON.stringify(this.tasks));
    }

    createTask(title, description) {
        const task = {
            id: this.generateId(),
            title: title.trim(),
            description: description.trim(),
            status: 'todo',
            createdAt: new Date().toISOString()
        };
        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    updateTask(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
            this.saveTasks();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
    }

    getTasksByStatus(status) {
        return this.tasks.filter(t => t.status === status);
    }

    generateId() {
        return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// UI Controller
class UIController {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.modal = document.getElementById('taskModal');
        this.deleteModal = document.getElementById('deleteModal');
        this.form = document.getElementById('taskForm');
        this.titleInput = document.getElementById('taskTitle');
        this.descriptionInput = document.getElementById('taskDescription');
        this.modalTitle = document.getElementById('modalTitle');
        this.initializeEventListeners();
        this.initializeDarkMode();
        this.renderAllColumns();
    }

    initializeEventListeners() {
        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openModal());

        // Modal close buttons
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        
        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Delete modal
        document.getElementById('closeDeleteModal').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());
        
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) this.closeDeleteModal();
        });

        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.openModal();
            }
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeDeleteModal();
            }
        });

        // Initialize drag and drop for all columns
        this.initializeDragAndDrop();
    }

    initializeDarkMode() {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'enabled') {
            document.body.classList.add('dark-mode');
        }
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    }

    openModal(taskId = null) {
        this.taskManager.editingTaskId = taskId;
        
        if (taskId) {
            const task = this.taskManager.tasks.find(t => t.id === taskId);
            if (task) {
                this.modalTitle.textContent = 'Edit Task';
                this.titleInput.value = task.title;
                this.descriptionInput.value = task.description;
            }
        } else {
            this.modalTitle.textContent = 'Add New Task';
            this.titleInput.value = '';
            this.descriptionInput.value = '';
        }
        
        this.modal.classList.add('active');
        this.titleInput.focus();
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.form.reset();
        this.taskManager.editingTaskId = null;
    }

    openDeleteModal(taskId) {
        this.taskManager.deletingTaskId = taskId;
        this.deleteModal.classList.add('active');
    }

    closeDeleteModal() {
        this.deleteModal.classList.remove('active');
        this.taskManager.deletingTaskId = null;
    }

    confirmDelete() {
        if (this.taskManager.deletingTaskId) {
            this.taskManager.deleteTask(this.taskManager.deletingTaskId);
            this.renderAllColumns();
            this.closeDeleteModal();
        }
    }

    handleFormSubmit() {
        const title = this.titleInput.value.trim();
        const description = this.descriptionInput.value.trim();

        if (!title) {
            this.titleInput.focus();
            return;
        }

        if (this.taskManager.editingTaskId) {
            this.taskManager.updateTask(this.taskManager.editingTaskId, {
                title,
                description
            });
        } else {
            this.taskManager.createTask(title, description);
        }

        this.renderAllColumns();
        this.closeModal();
    }

    renderAllColumns() {
        this.renderColumn('todo');
        this.renderColumn('inprogress');
        this.renderColumn('completed');
    }

    renderColumn(status) {
        const column = document.querySelector(`[data-column="${status}"]`);
        const tasks = this.taskManager.getTasksByStatus(status);
        
        // Update task count
        const countElement = column.parentElement.querySelector('.task-count');
        countElement.textContent = tasks.length;

        // Clear column
        column.innerHTML = '';

        // Show empty state or tasks
        if (tasks.length === 0) {
            column.innerHTML = '<div class="empty-state">No tasks yet</div>';
        } else {
            tasks.forEach(task => {
                const taskCard = this.createTaskCard(task);
                column.appendChild(taskCard);
            });
        }
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.taskId = task.id;

        const formattedDate = this.formatDate(task.createdAt);

        card.innerHTML = `
            <div class="task-header">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <div class="task-actions">
                    <button class="task-btn edit" title="Edit task">✏️</button>
                    <button class="task-btn delete" title="Delete task">🗑️</button>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                <span>Created: ${formattedDate}</span>
            </div>
        `;

        // Add event listeners
        card.querySelector('.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            this.openModal(task.id);
        });

        card.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            this.openDeleteModal(task.id);
        });

        // Drag events
        card.addEventListener('dragstart', (e) => this.handleDragStart(e));
        card.addEventListener('dragend', (e) => this.handleDragEnd(e));

        return card;
    }

    initializeDragAndDrop() {
        const columns = document.querySelectorAll('.column-content');
        
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => this.handleDragOver(e));
            column.addEventListener('drop', (e) => this.handleDrop(e));
            column.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            column.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
    }

    handleDragStart(e) {
        const card = e.target;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', card.innerHTML);
        e.dataTransfer.setData('taskId', card.dataset.taskId);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    handleDragEnter(e) {
        if (e.target.classList.contains('column-content')) {
            e.target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('column-content')) {
            const rect = e.target.getBoundingClientRect();
            const isOutside = (
                e.clientX <= rect.left ||
                e.clientX >= rect.right ||
                e.clientY <= rect.top ||
                e.clientY >= rect.bottom
            );
            if (isOutside) {
                e.target.classList.remove('drag-over');
            }
        }
    }

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        e.preventDefault();

        const taskId = e.dataTransfer.getData('taskId');
        const targetColumn = e.target.closest('.column-content');
        
        if (targetColumn && taskId) {
            const newStatus = targetColumn.dataset.column;
            this.taskManager.updateTask(taskId, { status: newStatus });
            this.renderAllColumns();
        }

        targetColumn.classList.remove('drag-over');
        return false;
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    const uiController = new UIController(taskManager);
});
