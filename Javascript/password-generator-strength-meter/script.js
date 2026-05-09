// Password Generator Application
// All functionality in vanilla JS

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        passwordOutput: document.getElementById('passwordOutput'),
        charCount: document.getElementById('charCount'),
        strengthFill: document.getElementById('strengthFill'),
        strengthText: document.getElementById('strengthText'),
        entropyBadge: document.getElementById('entropyBadge'),
        lengthSlider: document.getElementById('lengthSlider'),
        lengthValue: document.getElementById('lengthValue'),
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        numbers: document.getElementById('numbers'),
        symbols: document.getElementById('symbols'),
        generateBtn: document.getElementById('generateBtn'),
        copyBtn: document.getElementById('copyBtn'),
        toggleMask: document.getElementById('toggleMask'),
        darkModeToggle: document.getElementById('darkModeToggle'),
        historyList: document.getElementById('historyList'),
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toastMessage')
    };

    // Character sets
    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    // State
    let state = {
        password: '',
        isMasked: true,
        darkMode: false,
        history: []
    };

    // Initialize
    function init() {
        loadFromStorage();
        setupEventListeners();
        updateLengthValue();
        applyDarkMode();
        generatePassword();
    }

    // Load from localStorage
    function loadFromStorage() {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
            state.darkMode = savedDarkMode === 'true';
        } else {
            state.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        const savedHistory = localStorage.getItem('passwordHistory');
        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
            renderHistory();
        }
    }

    // Save to localStorage
    function saveToStorage() {
        localStorage.setItem('darkMode', state.darkMode);
        localStorage.setItem('passwordHistory', JSON.stringify(state.history.slice(0, 10)));
    }

    // Event Listeners
    function setupEventListeners() {
        // Generate button
        elements.generateBtn.addEventListener('click', generatePassword);
        
        // Copy button
        elements.copyBtn.addEventListener('click', copyToClipboard);
        
        // Toggle mask
        elements.toggleMask.addEventListener('click', togglePasswordMask);
        
        // Dark mode toggle
        elements.darkModeToggle.addEventListener('click', toggleDarkMode);
        
        // Length slider
        elements.lengthSlider.addEventListener('input', () => {
            updateLengthValue();
            generatePassword();
        });
        
        // Checkbox changes
        [elements.uppercase, elements.lowercase, elements.numbers, elements.symbols].forEach(checkbox => {
            checkbox.addEventListener('change', generatePassword);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.code === 'Enter') && 
                !e.target.matches('input') && !e.target.matches('button')) {
                e.preventDefault();
                generatePassword();
            }
        });
    }

    // Update length display
    function updateLengthValue() {
        elements.lengthValue.textContent = elements.lengthSlider.value;
    }

    // Generate password
    function generatePassword() {
        const length = parseInt(elements.lengthSlider.value);
        const useUppercase = elements.uppercase.checked;
        const useLowercase = elements.lowercase.checked;
        const useNumbers = elements.numbers.checked;
        const useSymbols = elements.symbols.checked;

        // Validate at least one option is selected
        if (!useUppercase && !useLowercase && !useNumbers && !useSymbols) {
            elements.passwordOutput.value = 'Select at least one character type';
            elements.passwordOutput.style.color = 'var(--danger)';
            return;
        }

        // Build character pool
        let charPool = '';
        if (useUppercase) charPool += charSets.uppercase;
        if (useLowercase) charPool += charSets.lowercase;
        if (useNumbers) charPool += charSets.numbers;
        if (useSymbols) charPool += charSets.symbols;

        // Generate password using cryptographically secure randomness
        let password = '';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        
        for (let i = 0; i < length; i++) {
            password += charPool[array[i] % charPool.length];
        }

        // Ensure at least one character from each selected set
        password = ensureVariety(password, useUppercase, useLowercase, useNumbers, useSymbols);

        state.password = password;
        updatePasswordDisplay();
        calculateStrength();
        addToHistory(password);
    }

    // Ensure password has variety
    function ensureVariety(password, useUppercase, useLowercase, useNumbers, useSymbols) {
        const pwdArray = password.split('');
        
        if (useUppercase && !/[A-Z]/.test(password)) {
            const pos = Math.floor(Math.random() * password.length);
            pwdArray[pos] = charSets.uppercase[Math.floor(Math.random() * charSets.uppercase.length)];
        }
        
        if (useLowercase && !/[a-z]/.test(password)) {
            const pos = Math.floor(Math.random() * password.length);
            pwdArray[pos] = charSets.lowercase[Math.floor(Math.random() * charSets.lowercase.length)];
        }
        
        if (useNumbers && !/[0-9]/.test(password)) {
            const pos = Math.floor(Math.random() * password.length);
            pwdArray[pos] = charSets.numbers[Math.floor(Math.random() * charSets.numbers.length)];
        }
        
        if (useSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
            const pos = Math.floor(Math.random() * password.length);
            pwdArray[pos] = charSets.symbols[Math.floor(Math.random() * charSets.symbols.length)];
        }
        
        return pwdArray.join('');
    }

    // Update password display
    function updatePasswordDisplay() {
        if (state.isMasked) {
            elements.passwordOutput.value = '•'.repeat(state.password.length);
        } else {
            elements.passwordOutput.value = state.password;
        }
        elements.passwordOutput.style.color = 'var(--text-primary)';
        elements.charCount.textContent = `${state.password.length} characters`;
    }

    // Toggle password mask
    function togglePasswordMask() {
        state.isMasked = !state.isMasked;
        elements.toggleMask.classList.toggle('active', !state.isMasked);
        updatePasswordDisplay();
    }

    // Calculate password strength
    function calculateStrength() {
        const password = state.password;
        if (!password) {
            resetStrengthMeter();
            return;
        }

        let score = 0;
        const length = password.length;

        // Length factor (max 30 points)
        score += Math.min(length * 1.5, 30);

        // Character variety (max 40 points)
        if (/[A-Z]/.test(password)) score += 10;
        if (/[a-z]/.test(password)) score += 10;
        if (/[0-9]/.test(password)) score += 10;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 10;

        // Complexity (max 30 points)
        const varietyCount = (
            (/[A-Z]/.test(password) ? 1 : 0) +
            (/[a-z]/.test(password) ? 1 : 0) +
            (/[0-9]/.test(password) ? 1 : 0) +
            (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) ? 1 : 0)
        );
        score += varietyCount * 5;

        // Bonus for longer passwords with good variety
        if (length >= 12 && varietyCount >= 3) score += 5;
        if (length >= 16 && varietyCount >= 4) score += 5;

        // Calculate entropy
        const entropy = calculateEntropy(password);

        // Update UI
        updateStrengthUI(score, entropy);
    }

    // Calculate entropy
    function calculateEntropy(password) {
        let poolSize = 0;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) poolSize += 29;
        
        if (poolSize === 0) poolSize = 26;
        
        return Math.round(password.length * Math.log2(poolSize));
    }

    // Update strength UI
    function updateStrengthUI(score, entropy) {
        elements.strengthFill.className = 'strength-fill';
        elements.strengthText.className = 'strength-text';

        let strengthLevel, strengthClass;

        if (score < 30) {
            strengthLevel = 'Weak';
            strengthClass = 'weak';
        } else if (score < 55) {
            strengthLevel = 'Medium';
            strengthClass = 'medium';
        } else if (score < 80) {
            strengthLevel = 'Strong';
            strengthClass = 'strong';
        } else {
            strengthLevel = 'Very Strong';
            strengthClass = 'very-strong';
        }

        elements.strengthFill.classList.add(strengthClass);
        elements.strengthText.classList.add(strengthClass);
        elements.strengthText.textContent = `${strengthLevel} Password`;
        elements.entropyBadge.textContent = `${entropy} bits entropy`;
    }

    // Reset strength meter
    function resetStrengthMeter() {
        elements.strengthFill.className = 'strength-fill';
        elements.strengthText.className = 'strength-text';
        elements.strengthText.textContent = 'Click generate to create password';
        elements.entropyBadge.textContent = '0 bits entropy';
    }

    // Copy to clipboard
    async function copyToClipboard() {
        if (!state.password) {
            showToast('Generate a password first!', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(state.password);
            showToast('Password copied to clipboard!', 'success');
        } catch (err) {
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = state.password;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Password copied to clipboard!', 'success');
        }
    }

    // Show toast notification
    function showToast(message, type = 'success') {
        elements.toastMessage.textContent = message;
        
        if (type === 'warning') {
            elements.toast.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        } else {
            elements.toast.style.background = 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)';
        }
        
        elements.toast.classList.add('show');
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    // Toggle dark mode
    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        applyDarkMode();
        saveToStorage();
    }

    // Apply dark mode
    function applyDarkMode() {
        if (state.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    // Add to history
    function addToHistory(password) {
        if (!password || password === state.history[0]) return;
        
        state.history.unshift(password);
        state.history = state.history.slice(0, 10); // Keep only last 10
        saveToStorage();
        renderHistory();
    }

    // Render history
    function renderHistory() {
        if (state.history.length === 0) {
            elements.historyList.innerHTML = `
                <div class="empty-history">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p>No passwords generated yet</p>
                </div>
            `;
            return;
        }

        elements.historyList.innerHTML = state.history.map((pwd, index) => `
            <div class="history-item">
                <span class="history-password">${maskPassword(pwd)}</span>
                <button class="history-copy-btn" onclick="copyHistoryItem(${index})" title="Copy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    // Mask password for history display
    function maskPassword(password) {
        if (password.length <= 6) return '•'.repeat(password.length);
        return password.slice(0, 3) + '•'.repeat(password.length - 6) + password.slice(-3);
    }

    // Copy history item
    window.copyHistoryItem = async function(index) {
        const password = state.history[index];
        try {
            await navigator.clipboard.writeText(password);
            showToast('Password copied from history!', 'success');
        } catch (err) {
            showToast('Failed to copy password', 'warning');
        }
    };

    // Start application
    init();
});
