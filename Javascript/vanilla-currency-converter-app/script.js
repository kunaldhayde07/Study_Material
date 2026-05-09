/**
 * Currency Converter Application
 * Real-time exchange rate conversion tool
 * 
 * @author Frontend Engineer
 * @version 1.0.0
 */

'use strict';

// ============================================
// Configuration
// ============================================
const CONFIG = {
    apiBaseUrl: 'https://open.er-api.com/v6/latest',
    defaultBaseCurrency: 'USD',
    defaultTargetCurrency: 'INR',
    defaultAmount: 1000,
    debounceDelay: 300,
    animationDelay: 200
};

// ============================================
// Currency Data
// ============================================
const CURRENCY_DATA = {
    USD: { flag: '🇺🇸', symbol: '$', name: 'US Dollar' },
    EUR: { flag: '🇪🇺', symbol: '€', name: 'Euro' },
    GBP: { flag: '🇬🇧', symbol: '£', name: 'British Pound' },
    JPY: { flag: '🇯🇵', symbol: '¥', name: 'Japanese Yen' },
    INR: { flag: '🇮🇳', symbol: '₹', name: 'Indian Rupee' },
    AUD: { flag: '🇦🇺', symbol: 'A$', name: 'Australian Dollar' },
    CAD: { flag: '🇨🇦', symbol: 'C$', name: 'Canadian Dollar' },
    CHF: { flag: '🇨🇭', symbol: 'Fr', name: 'Swiss Franc' },
    CNY: { flag: '🇨🇳', symbol: '¥', name: 'Chinese Yuan' },
    MXN: { flag: '🇲🇽', symbol: '$', name: 'Mexican Peso' },
    BRL: { flag: '🇧🇷', symbol: 'R$', name: 'Brazilian Real' },
    KRW: { flag: '🇰🇷', symbol: '₩', name: 'South Korean Won' },
    SGD: { flag: '🇸🇬', symbol: 'S$', name: 'Singapore Dollar' },
    HKD: { flag: '🇭🇰', symbol: 'HK$', name: 'Hong Kong Dollar' },
    NOK: { flag: '🇳🇴', symbol: 'kr', name: 'Norwegian Krone' },
    NZD: { flag: '🇳🇿', symbol: 'NZ$', name: 'New Zealand Dollar' },
    SEK: { flag: '🇸🇪', symbol: 'kr', name: 'Swedish Krona' },
    RUB: { flag: '🇷🇺', symbol: '₽', name: 'Russian Ruble' },
    ZAR: { flag: '🇿🇦', symbol: 'R', name: 'South African Rand' },
    AED: { flag: '🇦🇪', symbol: 'د.إ', name: 'UAE Dirham' }
};

// ============================================
// DOM Elements
// ============================================
const elements = {
    amountInput: document.getElementById('amount'),
    fromCurrency: document.getElementById('from-currency'),
    toCurrency: document.getElementById('to-currency'),
    fromFlag: document.getElementById('from-flag'),
    toFlag: document.getElementById('to-flag'),
    baseSymbol: document.getElementById('base-symbol'),
    swapBtn: document.getElementById('swap-btn'),
    convertBtn: document.getElementById('convert-btn'),
    resultValue: document.getElementById('result-value'),
    resultCurrency: document.getElementById('result-currency'),
    resultDisplay: document.getElementById('result-display'),
    rateValue: document.getElementById('rate-value'),
    lastUpdated: document.getElementById('last-updated'),
    loadingSpinner: document.getElementById('loading-spinner'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    errorClose: document.getElementById('error-close')
};

// ============================================
// Application State
// ============================================
const state = {
    exchangeRates: {},
    currentRate: 0,
    isLoading: false,
    lastFetchTime: null,
    debounceTimer: null
};

// ============================================
// API Service
// ============================================

/**
 * Fetches exchange rates for the given base currency
 * @param {string} baseCurrency - The base currency code
 * @returns {Promise<Object>} Exchange rates data
 */
async function fetchExchangeRates(baseCurrency) {
    const url = `${CONFIG.apiBaseUrl}/${baseCurrency}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result === 'success') {
            return data;
        } else {
            throw new Error('API returned unsuccessful result');
        }
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        throw error;
    }
}

/**
 * Gets the exchange rate between two currencies
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} The exchange rate
 */
async function getExchangeRate(fromCurrency, toCurrency) {
    try {
        showLoading(true);
        hideError();
        
        const data = await fetchExchangeRates(fromCurrency);
        
        state.exchangeRates = data.rates;
        state.lastFetchTime = new Date(data.time_last_update_utc);
        
        const rate = data.rates[toCurrency];
        
        if (rate === undefined) {
            throw new Error(`Exchange rate not found for ${toCurrency}`);
        }
        
        state.currentRate = rate;
        return rate;
        
    } catch (error) {
        showError(getErrorMessage(error));
        throw error;
    } finally {
        showLoading(false);
    }
}

/**
 * Converts an amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
        state.currentRate = 1;
        return amount;
    }
    
    const rate = await getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
}

// ============================================
// UI Functions
// ============================================

/**
 * Displays the conversion result with animation
 * @param {number} value - The converted value
 * @param {string} currency - The target currency code
 */
function displayResult(value, currency) {
    const formattedValue = formatCurrencyValue(value, currency);
    
    elements.resultValue.classList.add('updating');
    
    setTimeout(() => {
        elements.resultValue.textContent = formattedValue;
        elements.resultCurrency.textContent = currency;
        elements.resultValue.classList.remove('updating');
    }, CONFIG.animationDelay);
}

/**
 * Formats a currency value for display
 * @param {number} value - The value to format
 * @param {string} currency - The currency code
 * @returns {string} Formatted value
 */
function formatCurrencyValue(value, currency) {
    // Handle very small numbers
    if (value < 0.01 && value > 0) {
        return value.toExponential(2);
    }
    
    // Handle very large numbers
    if (value >= 1000000) {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Standard formatting
    const formatted = value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatted;
}

/**
 * Updates the exchange rate display
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {number} rate - The exchange rate
 */
function updateRateDisplay(fromCurrency, toCurrency, rate) {
    const formattedRate = rate.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6
    });
    
    elements.rateValue.textContent = `1 ${fromCurrency} = ${formattedRate} ${toCurrency}`;
    
    if (state.lastFetchTime) {
        const timeString = state.lastFetchTime.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        elements.lastUpdated.textContent = `Last updated: ${timeString}`;
    }
}

/**
 * Updates the currency symbol display
 * @param {string} currencyCode - The currency code
 */
function updateCurrencySymbol(currencyCode) {
    const currency = CURRENCY_DATA[currencyCode];
    if (currency) {
        elements.baseSymbol.textContent = currency.symbol;
    }
}

/**
 * Updates the flag display for a currency
 * @param {string} elementId - The flag element ID
 * @param {string} currencyCode - The currency code
 */
function updateFlag(elementId, currencyCode) {
    const flagElement = document.getElementById(elementId);
    const currency = CURRENCY_DATA[currencyCode];
    
    if (flagElement && currency) {
        flagElement.textContent = currency.flag;
    }
}

/**
 * Shows or hides the loading spinner
 * @param {boolean} show - Whether to show the spinner
 */
function showLoading(show) {
    state.isLoading = show;
    elements.loadingSpinner.classList.toggle('hidden', !show);
    elements.resultDisplay.style.opacity = show ? '0.3' : '1';
    elements.convertBtn.disabled = show;
}

/**
 * Displays an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorContainer.classList.remove('hidden');
}

/**
 * Hides the error message
 */
function hideError() {
    elements.errorContainer.classList.add('hidden');
}

// ============================================
// Utility Functions
// ============================================

/**
 * Gets a user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
function getErrorMessage(error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    if (error.message.includes('HTTP error')) {
        return 'Server error. Please try again later.';
    }
    
    return 'Something went wrong. Please try again.';
}

/**
 * Validates the input amount
 * @param {string} value - The input value
 * @returns {boolean} Whether the input is valid
 */
function isValidAmount(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && isFinite(num);
}

/**
 * Debounces a function call
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    return function executedFunction(...args) {
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handles the conversion process
 */
async function handleConversion() {
    const amount = parseFloat(elements.amountInput.value);
    const fromCurrency = elements.fromCurrency.value;
    const toCurrency = elements.toCurrency.value;
    
    if (!isValidAmount(elements.amountInput.value)) {
        showError('Please enter a valid amount');
        return;
    }
    
    try {
        const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);
        displayResult(convertedAmount, toCurrency);
        updateRateDisplay(fromCurrency, toCurrency, state.currentRate);
    } catch (error) {
        // Error is already handled in getExchangeRate
    }
}

/**
 * Handles currency swap
 */
function handleSwap() {
    const fromValue = elements.fromCurrency.value;
    const toValue = elements.toCurrency.value;
    
    // Swap values
    elements.fromCurrency.value = toValue;
    elements.toCurrency.value = fromValue;
    
    // Update flags and symbol
    updateFlag('from-flag', toValue);
    updateFlag('to-flag', fromValue);
    updateCurrencySymbol(toValue);
    
    // Reconvert
    handleConversion();
}

/**
 * Handles currency selection change
 * @param {string} type - 'from' or 'to'
 */
function handleCurrencyChange(type) {
    if (type === 'from') {
        updateFlag('from-flag', elements.fromCurrency.value);
        updateCurrencySymbol(elements.fromCurrency.value);
    } else {
        updateFlag('to-flag', elements.toCurrency.value);
    }
    
    handleConversion();
}

/**
 * Handles amount input change with debounce
 */
const handleAmountChange = debounce(() => {
    if (isValidAmount(elements.amountInput.value)) {
        handleConversion();
    }
}, CONFIG.debounceDelay);

/**
 * Copies the exchange rate to clipboard
 */
async function handleRateClick() {
    const rateText = elements.rateValue.textContent;
    
    try {
        await navigator.clipboard.writeText(rateText);
        
        // Visual feedback
        const originalText = elements.rateValue.textContent;
        elements.rateValue.textContent = 'Copied!';
        elements.rateValue.style.color = '#10b981';
        
        setTimeout(() => {
            elements.rateValue.textContent = originalText;
            elements.rateValue.style.color = '';
        }, 1000);
    } catch (err) {
        // Clipboard API not available, fail silently
    }
}

// ============================================
// Initialization
// ============================================

/**
 * Sets up all event listeners
 */
function setupEventListeners() {
    // Convert button
    elements.convertBtn.addEventListener('click', handleConversion);
    
    // Swap button
    elements.swapBtn.addEventListener('click', handleSwap);
    
    // Amount input
    elements.amountInput.addEventListener('input', handleAmountChange);
    elements.amountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleConversion();
        }
    });
    
    // Currency selects
    elements.fromCurrency.addEventListener('change', () => handleCurrencyChange('from'));
    elements.toCurrency.addEventListener('change', () => handleCurrencyChange('to'));
    
    // Error close button
    elements.errorClose.addEventListener('click', hideError);
    
    // Rate tooltip click to copy
    elements.rateValue.parentElement.addEventListener('click', handleRateClick);
    
    // Keyboard accessibility for swap button
    elements.swapBtn.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleSwap();
        }
    });
}

/**
 * Initializes the application
 */
function init() {
    // Set up event listeners
    setupEventListeners();
    
    // Set initial currency symbol
    updateCurrencySymbol(elements.fromCurrency.value);
    
    // Perform initial conversion
    handleConversion();
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
