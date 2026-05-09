/**
 * Professional Contact Form
 * Production-ready vanilla JavaScript with modular validation
 */

// ========================================
// Constants & Configuration
// ========================================

const VALIDATION_RULES = {
  fullName: {
    required: true,
    minLength: 3,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Please enter a valid name (min 3 characters)'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: true,
    pattern: /^\d{10}$/,
    message: 'Phone must be exactly 10 digits'
  },
  subject: {
    required: true,
    message: 'Please select a subject'
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: 'Message must be between 10-500 characters'
  }
};

// ========================================
// State Management
// ========================================

const formState = {
  values: {},
  errors: {},
  isSubmitting: false,
  isDarkMode: localStorage.getItem('theme') === 'dark'
};

// ========================================
// DOM Element Cache
// ========================================

const elements = {
  form: document.getElementById('contactForm'),
  inputs: {
    fullName: document.getElementById('fullName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    subject: document.getElementById('subject'),
    message: document.getElementById('message')
  },
  errorMessages: {
    fullName: document.getElementById('fullName-error'),
    email: document.getElementById('email-error'),
    phone: document.getElementById('phone-error'),
    subject: document.getElementById('subject-error'),
    message: document.getElementById('message-error')
  },
  counter: document.getElementById('message-counter'),
  submitBtn: document.getElementById('submitBtn'),
  resetBtn: document.getElementById('resetBtn'),
  themeToggle: document.getElementById('themeToggle'),
  successNotification: document.getElementById('successNotification'),
  closeNotification: document.getElementById('closeNotification')
};

// ========================================
// Validation Utilities
// ========================================

const validators = {
  /**
   * Validates full name
   * @param {string} value - Input value
   * @returns {Object} Validation result
   */
  fullName: (value) => {
    const rule = VALIDATION_RULES.fullName;
    const trimmed = value.trim();
    
    if (rule.required && !trimmed) {
      return { isValid: false, message: 'Full name is required' };
    }
    
    if (trimmed.length < rule.minLength) {
      return { isValid: false, message: `Name must be at least ${rule.minLength} characters` };
    }
    
    if (!rule.pattern.test(trimmed)) {
      return { isValid: false, message: 'Name contains invalid characters' };
    }
    
    return { isValid: true };
  },

  /**
   * Validates email address
   * @param {string} value - Input value
   * @returns {Object} Validation result
   */
  email: (value) => {
    const rule = VALIDATION_RULES.email;
    const trimmed = value.trim();
    
    if (rule.required && !trimmed) {
      return { isValid: false, message: 'Email is required' };
    }
    
    if (!rule.pattern.test(trimmed)) {
      return { isValid: false, message: rule.message };
    }
    
    return { isValid: true };
  },

  /**
   * Validates phone number
   * @param {string} value - Input value
   * @returns {Object} Validation result
   */
  phone: (value) => {
    const rule = VALIDATION_RULES.phone;
    const digitsOnly = value.replace(/\D/g, '');
    
    if (rule.required && !value) {
      return { isValid: false, message: 'Phone number is required' };
    }
    
    if (value && !/^\d*$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
      return { isValid: false, message: 'Only numbers allowed' };
    }
    
    if (digitsOnly.length !== 10 && digitsOnly.length > 0) {
      return { isValid: false, message: `Phone must be exactly 10 digits (currently ${digitsOnly.length})` };
    }
    
    return { isValid: true };
  },

  /**
   * Validates subject selection
   * @param {string} value - Input value
   * @returns {Object} Validation result
   */
  subject: (value) => {
    const rule = VALIDATION_RULES.subject;
    
    if (rule.required && !value) {
      return { isValid: false, message: rule.message };
    }
    
    return { isValid: true };
  },

  /**
   * Validates message content
   * @param {string} value - Input value
   * @returns {Object} Validation result
   */
  message: (value) => {
    const rule = VALIDATION_RULES.message;
    const trimmed = value.trim();
    
    if (rule.required && !trimmed) {
      return { isValid: false, message: 'Message is required' };
    }
    
    if (trimmed.length < rule.minLength) {
      return { isValid: false, message: `Message must be at least ${rule.minLength} characters` };
    }
    
    if (trimmed.length > rule.maxLength) {
      return { isValid: false, message: `Message must not exceed ${rule.maxLength} characters` };
    }
    
    return { isValid: true };
  }
};

// ========================================
// UI Update Functions
// ========================================

const ui = {
  /**
   * Updates input visual state and error message
   * @param {string} fieldName - Name of the field
   * @param {Object} result - Validation result
   */
  updateFieldState: (fieldName, result) => {
    const input = elements.inputs[fieldName];
    const errorEl = elements.errorMessages[fieldName];
    
    if (!input || !errorEl) return;
    
    // Clear previous states
    input.classList.remove('is-valid', 'is-invalid');
    errorEl.classList.remove('show');
    
    if (input.value.trim() === '') {
      // Empty field - neutral state
      return;
    }
    
    if (result.isValid) {
      input.classList.add('is-valid');
    } else {
      input.classList.add('is-invalid');
      errorEl.textContent = result.message;
      errorEl.classList.add('show');
    }
  },

  /**
   * Updates character counter for message field
   * @param {number} count - Current character count
   */
  updateCharCounter: (count) => {
    const max = VALIDATION_RULES.message.maxLength;
    elements.counter.textContent = `${count} / ${max}`;
    
    if (count > max * 0.9) {
      elements.counter.classList.add('warning');
    } else {
      elements.counter.classList.remove('warning');
    }
  },

  /**
   * Shows success notification
   */
  showSuccessNotification: () => {
    elements.successNotification.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      ui.hideSuccessNotification();
    }, 5000);
  },

  /**
   * Hides success notification
   */
  hideSuccessNotification: () => {
    elements.successNotification.classList.remove('show');
  },

  /**
   * Toggles loading state on submit button
   * @param {boolean} isLoading - Loading state
   */
  setSubmitLoading: (isLoading) => {
    const btn = elements.submitBtn;
    const isDisabled = isLoading || formState.isSubmitting;
    
    btn.disabled = isDisabled;
    btn.classList.toggle('btn-loading', isLoading);
    
    if (isLoading) {
      btn.querySelector('.btn-text').textContent = 'Sending...';
    } else {
      btn.querySelector('.btn-text').textContent = 'Send Message';
    }
  },

  /**
   * Resets form UI to initial state
   */
  resetForm: () => {
    Object.values(elements.inputs).forEach(input => {
      input.classList.remove('is-valid', 'is-invalid');
      input.value = '';
    });
    
    Object.values(elements.errorMessages).forEach(errorEl => {
      errorEl.classList.remove('show');
      errorEl.textContent = '';
    });
    
    ui.updateCharCounter(0);
    formState.values = {};
    formState.errors = {};
  },

  /**
   * Toggles dark mode
   * @param {boolean} isDark - Dark mode state
   */
  toggleDarkMode: (isDark) => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const icon = elements.themeToggle.querySelector('.theme-icon');
    icon.textContent = isDark ? '☀️' : '🌙';
  }
};

// ========================================
// Event Handlers
// ========================================

const handlers = {
  /**
   * Handles real-time input validation
   * @param {Event} e - Input event
   */
  handleInput: (e) => {
    const fieldName = e.target.name;
    const value = e.target.value;
    
    // Store value
    formState.values[fieldName] = value;
    
    // Validate
    const result = validators[fieldName](value);
    ui.updateFieldState(fieldName, result);
    
    // Update errors state
    if (!result.isValid && value.trim() !== '') {
      formState.errors[fieldName] = result.message;
    } else {
      delete formState.errors[fieldName];
    }
    
    // Update character counter for message
    if (fieldName === 'message') {
      ui.updateCharCounter(value.length);
    }
    
    // Real-time phone formatting
    if (fieldName === 'phone') {
      handlers.formatPhoneInput(e.target);
    }
  },

  /**
   * Formats phone number as user types
   * @param {HTMLInputElement} input - Phone input element
   */
  formatPhoneInput: (input) => {
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    
    if (digits.length >= 6) {
      input.value = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      input.value = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      input.value = digits;
    }
  },

  /**
   * Handles form submission
   * @param {Event} e - Submit event
   */
  handleSubmit: async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const validationResults = {};
    let isFormValid = true;
    
    Object.keys(elements.inputs).forEach(fieldName => {
      const value = elements.inputs[fieldName].value;
      const result = validators[fieldName](value);
      validationResults[fieldName] = result;
      
      if (!result.isValid) {
        isFormValid = false;
        formState.errors[fieldName] = result.message;
      } else {
        delete formState.errors[fieldName];
      }
    });
    
    // Update UI for all fields
    Object.keys(validationResults).forEach(fieldName => {
      ui.updateFieldState(fieldName, validationResults[fieldName]);
    });
    
    if (!isFormValid) {
      // Focus first invalid field
      const firstError = Object.keys(formState.errors)[0];
      if (firstError) {
        elements.inputs[firstError].focus();
      }
      return;
    }
    
    // Submit form
    await handlers.performSubmit();
  },

  /**
   * Simulates form submission
   */
  performSubmit: async () => {
    formState.isSubmitting = true;
    ui.setSubmitLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log form data (in real app, send to server)
      console.log('Form submitted with data:', {
        ...formState.values,
        timestamp: new Date().toISOString()
      });
      
      // Success
      ui.showSuccessNotification();
      ui.resetForm();
      
    } catch (error) {
      console.error('Submission error:', error);
      // In production, show error message to user
    } finally {
      formState.isSubmitting = false;
      ui.setSubmitLoading(false);
    }
  },

  /**
   * Handles form reset
   */
  handleReset: () => {
    ui.resetForm();
  },

  /**
   * Handles theme toggle
   */
  handleThemeToggle: () => {
    formState.isDarkMode = !formState.isDarkMode;
    ui.toggleDarkMode(formState.isDarkMode);
  },

  /**
   * Prevents non-numeric input in phone field (fallback)
   * @param {Event} e - Keydown event
   */
  handlePhoneKeydown: (e) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    
    if (allowedKeys.includes(e.key)) return;
    
    if (!/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  }
};

// ========================================
// Initialization
// ========================================

const app = {
  /**
   * Initializes the application
   */
  init: () => {
    // Set initial theme
    ui.toggleDarkMode(formState.isDarkMode);
    
    // Attach event listeners
    app.attachEventListeners();
    
    // Initialize character counter
    ui.updateCharCounter(0);
    
    console.log('Contact form initialized successfully');
  },

  /**
   * Attaches all event listeners
   */
  attachEventListeners: () => {
    // Input validation listeners
    Object.values(elements.inputs).forEach(input => {
      // Real-time validation on input
      input.addEventListener('input', handlers.handleInput);
      
      // Validate on blur
      input.addEventListener('blur', (e) => {
        if (e.target.value.trim() !== '') {
          handlers.handleInput(e);
        }
      });
      
      // Clear error state when user starts typing
      input.addEventListener('focus', (e) => {
        const fieldName = e.target.name;
        if (formState.errors[fieldName]) {
          e.target.classList.remove('is-invalid');
          elements.errorMessages[fieldName].classList.remove('show');
        }
      });
    });
    
    // Form submission
    elements.form.addEventListener('submit', handlers.handleSubmit);
    
    // Form reset
    elements.resetBtn.addEventListener('click', handlers.handleReset);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', handlers.handleThemeToggle);
    
    // Notification close
    elements.closeNotification.addEventListener('click', ui.hideSuccessNotification);
    
    // Close notification on click outside
    elements.successNotification.addEventListener('click', (e) => {
      if (e.target === elements.successNotification) {
        ui.hideSuccessNotification();
      }
    });
    
    // Phone number keydown restriction (extra safety)
    elements.inputs.phone.addEventListener('keydown', handlers.handlePhoneKeydown);
    
    // Prevent paste of non-numeric in phone field
    elements.inputs.phone.addEventListener('paste', (e) => {
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      if (!/^\d*$/.test(paste.replace(/[\s\-\(\)]/g, ''))) {
        e.preventDefault();
      }
    });
    
    // Close notification on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        ui.hideSuccessNotification();
      }
    });
  }
};

// ========================================
// Application Bootstrap
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', app.init);
} else {
  app.init();
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validators, ui, handlers, formState };
}