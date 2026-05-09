/**
 * Expense Tracker Application
 * A personal finance manager with local storage persistence
 */

// ===================================
// Storage Module
// ===================================
const Storage = {
    KEY: 'expense_tracker_transactions',

    load() {
        try {
            const data = localStorage.getItem(this.KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('Failed to load transactions from storage:', error);
            return [];
        }
    },

    save(transactions) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(transactions));
            return true;
        } catch (error) {
            console.warn('Failed to save transactions to storage:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.removeItem(this.KEY);
            return true;
        } catch (error) {
            console.warn('Failed to clear storage:', error);
            return false;
        }
    }
};

// ===================================
// Transaction Manager
// ===================================
const TransactionManager = {
    transactions: [],

    init() {
        this.transactions = Storage.load();
    },

    add(description, amount, type) {
        const transaction = {
            id: this.generateId(),
            description: description.trim(),
            amount: parseFloat(amount),
            type,
            date: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        Storage.save(this.transactions);

        return transaction;
    },

    delete(id) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.transactions.splice(index, 1);
            Storage.save(this.transactions);
            return true;
        }
        return false;
    },

    getAll() {
        return [...this.transactions];
    },

    getFiltered(filter, searchTerm = '') {
        let filtered = this.transactions;

        // Apply type filter
        if (filter !== 'all') {
            filtered = filtered.filter(t => t.type === filter);
        }

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(term)
            );
        }

        return filtered;
    },

    calculateTotals() {
        const totals = {
            income: 0,
            expenses: 0,
            balance: 0
        };

        this.transactions.forEach(t => {
            if (t.type === 'income') {
                totals.income += t.amount;
            } else {
                totals.expenses += t.amount;
            }
        });

        totals.balance = totals.income - totals.expenses;

        return totals;
    },

    generateId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    exportAsJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            transactions: this.transactions,
            summary: this.calculateTotals()
        };
        return JSON.stringify(data, null, 2);
    }
};

// ===================================
// UI Controller
// ===================================
const UI = {
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.elements = {
            // Form elements
            form: document.getElementById('transactionForm'),
            descriptionInput: document.getElementById('description'),
            amountInput: document.getElementById('amount'),
            descriptionError: document.getElementById('descriptionError'),
            amountError: document.getElementById('amountError'),

            // Balance elements
            totalBalance: document.getElementById('totalBalance'),
            totalIncome: document.getElementById('totalIncome'),
            totalExpenses: document.getElementById('totalExpenses'),

            // List and controls
            transactionList: document.getElementById('transactionList'),
            emptyState: document.getElementById('emptyState'),
            searchInput: document.getElementById('searchInput'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            exportBtn: document.getElementById('exportBtn'),

            // Toast
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage')
        };
    },

    bindEvents() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Clear errors on input
        this.elements.descriptionInput.addEventListener('input', () => {
            this.clearError('description');
        });

        this.elements.amountInput.addEventListener('input', () => {
            this.clearError('amount');
        });

        // Search
        this.elements.searchInput.addEventListener('input', 
            this.debounce(() => this.renderTransactions(), 300)
        );

        // Filter buttons
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleFilterClick(btn));
        });

        // Export button
        this.elements.exportBtn.addEventListener('click', () => this.handleExport());

        // Delete transaction (event delegation)
        this.elements.transactionList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                this.handleDelete(id);
            }
        });
    },

    handleFormSubmit() {
        const description = this.elements.descriptionInput.value;
        const amount = this.elements.amountInput.value;
        const type = document.querySelector('input[name="type"]:checked').value;

        // Validate
        const isValid = this.validateForm(description, amount);
        if (!isValid) return;

        // Add transaction
        TransactionManager.add(description, amount, type);

        // Update UI
        this.updateBalances();
        this.renderTransactions();
        this.resetForm();
        this.showToast('Transaction added successfully!');
    },

    validateForm(description, amount) {
        let isValid = true;

        // Validate description
        if (!description.trim()) {
            this.showError('description', 'Please enter a description');
            isValid = false;
        } else if (description.trim().length < 2) {
            this.showError('description', 'Description must be at least 2 characters');
            isValid = false;
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (!amount || amount === '') {
            this.showError('amount', 'Please enter an amount');
            isValid = false;
        } else if (isNaN(amountNum) || amountNum <= 0) {
            this.showError('amount', 'Please enter a valid positive amount');
            isValid = false;
        } else if (amountNum > 999999999) {
            this.showError('amount', 'Amount is too large');
            isValid = false;
        }

        return isValid;
    },

    showError(field, message) {
        const input = this.elements[`${field}Input`];
        const errorEl = this.elements[`${field}Error`];

        input.classList.add('error');
        errorEl.textContent = message;
    },

    clearError(field) {
        const input = this.elements[`${field}Input`];
        const errorEl = this.elements[`${field}Error`];

        input.classList.remove('error');
        errorEl.textContent = '';
    },

    resetForm() {
        this.elements.form.reset();
        document.getElementById('typeExpense').checked = true;
        this.clearError('description');
        this.clearError('amount');
    },

    handleFilterClick(btn) {
        this.elements.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderTransactions();
    },

    handleDelete(id) {
        TransactionManager.delete(id);
        this.updateBalances();
        this.renderTransactions();
        this.showToast('Transaction deleted');
    },

    handleExport() {
        const transactions = TransactionManager.getAll();
        if (transactions.length === 0) {
            this.showToast('No transactions to export');
            return;
        }

        const json = TransactionManager.exportAsJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `expense_tracker_${this.formatDateForFile(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Transactions exported successfully!');
    },

    updateBalances() {
        const totals = TransactionManager.calculateTotals();

        this.animateValue(this.elements.totalBalance, totals.balance);
        this.animateValue(this.elements.totalIncome, totals.income);
        this.animateValue(this.elements.totalExpenses, totals.expenses);
    },

    animateValue(element, value) {
        element.classList.add('updating');
        element.textContent = this.formatCurrency(value);

        setTimeout(() => {
            element.classList.remove('updating');
        }, 300);
    },

    renderTransactions() {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        const searchTerm = this.elements.searchInput.value;
        const transactions = TransactionManager.getFiltered(activeFilter, searchTerm);

        // Clear list
        this.elements.transactionList.innerHTML = '';

        // Show empty state if no transactions
        if (transactions.length === 0) {
            this.elements.emptyState.classList.add('visible');
            this.elements.transactionList.style.display = 'none';
            return;
        }

        this.elements.emptyState.classList.remove('visible');
        this.elements.transactionList.style.display = 'flex';

        // Render transactions
        const fragment = document.createDocumentFragment();

        transactions.forEach(transaction => {
            const item = this.createTransactionElement(transaction);
            fragment.appendChild(item);
        });

        this.elements.transactionList.appendChild(fragment);
    },

    createTransactionElement(transaction) {
        const div = document.createElement('div');
        div.className = `transaction-item ${transaction.type}`;
        div.dataset.id = transaction.id;

        const sign = transaction.type === 'income' ? '+' : '-';
        const formattedAmount = this.formatCurrency(transaction.amount);

        div.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-title">${this.escapeHtml(transaction.description)}</div>
                <div class="transaction-date">${this.formatDate(transaction.date)}</div>
            </div>
            <span class="transaction-amount ${transaction.type}">${sign}${formattedAmount}</span>
            <button class="delete-btn" data-id="${transaction.id}" title="Delete transaction">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        `;

        return div;
    },

    showToast(message) {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.classList.add('visible');

        setTimeout(() => {
            this.elements.toast.classList.remove('visible');
        }, 3000);
    },

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Math.abs(amount));
    },

    formatDate(isoString) {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    },

    formatDateForFile(date) {
        return date.toISOString().split('T')[0];
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }
};

// ===================================
// Application Initialization
// ===================================
const App = {
    init() {
        // Initialize modules
        TransactionManager.init();
        UI.init();

        // Initial render
        UI.updateBalances();
        UI.renderTransactions();
    }
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
