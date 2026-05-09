/**
 * Contact Form Validation & Interaction Handler
 * Production-ready form validation with real-time feedback
 */

(function() {
    'use strict';

    // ============================================
    // Configuration & Constants
    // ============================================
    const CONFIG = {
        validationDelay: 300,
        successDisplayDuration: 5000,
        phoneMinLength: 10,
        nameMinLength: 3,
        messageMinLength: 10
    };

    // Validation patterns
    const PATTERNS = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\d+$/,
        name: /^[a-zA-Z\s'-]+$/
    };

    // Error messages
    const ERROR_MESSAGES = {
        fullName: {
            required: 'Please enter your full name',
            minLength: `Name must be at least ${CONFIG.nameMinLength} characters`,
            invalid: 'Please enter a valid name (letters only)'
        },
        email: {
            required: 'Please enter your email address',
            invalid: 'Please enter a valid email address'
        },
        phone: {
            required: 'Please enter your phone number',
            invalid: 'Please enter a valid phone number (digits only)',
            minLength: `Phone number must be at least ${CONFIG.phoneMinLength} digits`
        },
        subject: {
            required: 'Please enter a subject'
        },
        message: {
            required: 'Please enter your message',
            minLength: `Message must be at least ${CONFIG.messageMinLength} characters`
        }
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        form: null,
        inputs: {},
        errors: {},
        submitBtn: null,
        successMessage: null,
        newMessageBtn: null
    };

    // State management
    const state = {
        validationResults: {},
        isSubmitting: false,
        isFormValid: false
    };

    // ============================================
    // Initialization
    // ============================================
    function init() {
        cacheElements();
        attachEventListeners();
        initializeInputStates();
    }

    /**
     * Cache all DOM elements for better performance
     */
    function cacheElements() {
        elements.form = document.getElementById('contactForm');
        elements.submitBtn = document.getElementById('submitBtn');
        elements.successMessage = document.getElementById('successMessage');
        elements.newMessageBtn = document.getElementById('newMessageBtn');

        // Cache form fields
        const fieldIds = ['fullName', 'email', 'phone', 'subject', 'message'];
        fieldIds.forEach(id => {
            elements.inputs[id] = document.getElementById(id);
            elements.errors[id] = document.getElementById(`${id}Error`);
        });
    }

    /**
     * Attach all event listeners
     */
    function attachEventListeners() {
        // Form submission
        elements.form.addEventListener('submit', handleFormSubmit);

        // Real-time validation on input
        Object.keys(elements.inputs).forEach(field => {
            const input = elements.inputs[field];
            input.addEventListener('input', () => handleInput(field));
            input.addEventListener('blur', () => handleBlur(field));
        });

        // New message button
        elements.newMessageBtn.addEventListener('click', resetForm);
    }

    /**
     * Initialize input states
     */
    function initializeInputStates() {
        Object.keys(elements.inputs).forEach(field => {
            state.validationResults[field] = {
                isValid: false,
                isTouched: false
            };
        });
    }

    // ============================================
    // Validation Logic
    // ============================================

    /**
     * Validate a specific field
     * @param {string} field - Field name to validate
     * @param {string} value - Field value
     * @returns {object} Validation result
     */
    function validateField(field, value) {
        const trimmedValue = value.trim();

        switch (field) {
            case 'fullName':
                return validateFullName(trimmedValue);
            case 'email':
                return validateEmail(trimmedValue);
            case 'phone':
                return validatePhone(trimmedValue);
            case 'subject':
                return validateSubject(trimmedValue);
            case 'message':
                return validateMessage(trimmedValue);
            default:
                return { isValid: false, error: 'Unknown field' };
        }
    }

    /**
     * Validate full name field
     */
    function validateFullName(value) {
        if (!value) {
            return { isValid: false, error: ERROR_MESSAGES.fullName.required };
        }
        if (value.length < CONFIG.nameMinLength) {
            return { isValid: false, error: ERROR_MESSAGES.fullName.minLength };
        }
        if (!PATTERNS.name.test(value)) {
            return { isValid: false, error: ERROR_MESSAGES.fullName.invalid };
        }
        return { isValid: true, error: '' };
    }

    /**
     * Validate email field
     */
    function validateEmail(value) {
        if (!value) {
            return { isValid: false, error: ERROR_MESSAGES.email.required };
        }
        if (!PATTERNS.email.test(value)) {
            return { isValid: false, error: ERROR_MESSAGES.email.invalid };
        }
        return { isValid: true, error: '' };
    }

    /**
     * Validate phone field
     */
    function validatePhone(value) {
        if (!value) {
            return { isValid: false, error: ERROR_MESSAGES.phone.required };
        }
        // Remove common formatting characters for validation
        const digitsOnly = value.replace(/[\s\-()]/g, '');
        if (!PATTERNS.phone.test(digitsOnly)) {
            return { isValid: false, error: ERROR_MESSAGES.phone.invalid };
        }
        if (digitsOnly.length < CONFIG.phoneMinLength) {
            return { isValid: false, error: ERROR_MESSAGES.phone.minLength };
        }
        return { isValid: true, error: '' };
    }

    /**
     * Validate subject field
     */
    function validateSubject(value) {
        if (!value) {
            return { isValid: false, error: ERROR_MESSAGES.subject.required };
        }
        return { isValid: true, error: '' };
    }

    /**
     * Validate message field
     */
    function validateMessage(value) {
        if (!value) {
            return { isValid: false, error: ERROR_MESSAGES.message.required };
        }
        if (value.length < CONFIG.messageMinLength) {
            return { isValid: false, error: ERROR_MESSAGES.message.minLength };
        }
        return { isValid: true, error: '' };
    }

    // ============================================
    // UI Update Functions
    // ============================================

    /**
     * Update field UI based on validation result
     * @param {string} field - Field name
     * @param {object} result - Validation result
     */
    function updateFieldUI(field, result) {
        const input = elements.inputs[field];
        const errorEl = elements.errors[field];

        // Remove previous states
        input.classList.remove('valid', 'invalid');

        if (state.validationResults[field].isTouched) {
            if (result.isValid) {
                input.classList.add('valid');
                errorEl.classList.remove('visible');
            } else {
                input.classList.add('invalid');
                errorEl.textContent = result.error;
                errorEl.classList.add('visible');
            }
        }
    }

    /**
     * Clear field error state
     * @param {string} field - Field name
     */
    function clearFieldError(field) {
        const input = elements.inputs[field];
        const errorEl = elements.errors[field];
        
        input.classList.remove('invalid');
        errorEl.classList.remove('visible');
    }

    /**
     * Check if entire form is valid
     * @returns {boolean} Form validity
     */
    function isFormValid() {
        return Object.values(state.validationResults).every(
            result => result.isValid && result.isTouched
        );
    }

    // ============================================
    // Event Handlers
    // ============================================

    /**
     * Handle input event (real-time validation)
     * @param {string} field - Field name
     */
    function handleInput(field) {
        const input = elements.inputs[field];
        const value = input.value;

        // Mark as touched on first input
        if (!state.validationResults[field].isTouched) {
            state.validationResults[field].isTouched = true;
        }

        // Validate current value
        const result = validateField(field, value);
        state.validationResults[field].isValid = result.isValid;

        // Update UI
        updateFieldUI(field, result);

        // Check overall form validity
        state.isFormValid = isFormValid();
    }

    /**
     * Handle blur event
     * @param {string} field - Field name
     */
    function handleBlur(field) {
        const input = elements.inputs[field];
        const value = input.value;

        // Mark as touched
        state.validationResults[field].isTouched = true;

        // Validate
        const result = validateField(field, value);
        state.validationResults[field].isValid = result.isValid;

        // Update UI
        updateFieldUI(field, result);

        // Check overall form validity
        state.isFormValid = isFormValid();
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        // Prevent multiple submissions
        if (state.isSubmitting) return;

        // Validate all fields
        validateAllFields();

        // Check if form is valid
        if (!state.isFormValid) {
            showValidationErrors();
            return;
        }

        // Simulate form submission
        simulateSubmission();
    }

    /**
     * Validate all fields at once
     */
    function validateAllFields() {
        Object.keys(elements.inputs).forEach(field => {
            const input = elements.inputs[field];
            const value = input.value;

            state.validationResults[field].isTouched = true;
            const result = validateField(field, value);
            state.validationResults[field].isValid = result.isValid;

            updateFieldUI(field, result);
        });

        state.isFormValid = isFormValid();
    }

    /**
     * Show validation errors for invalid fields
     */
    function showValidationErrors() {
        // Focus first invalid field
        const firstInvalid = Object.keys(elements.inputs).find(
            field => !state.validationResults[field].isValid
        );

        if (firstInvalid) {
            elements.inputs[firstInvalid].focus();
        }
    }

    /**
     * Simulate form submission with loading state
     */
    function simulateSubmission() {
        state.isSubmitting = true;

        // Show loading state
        elements.submitBtn.classList.add('loading');
        elements.submitBtn.disabled = true;

        // Simulate API call delay
        setTimeout(() => {
            // Show success state
            elements.submitBtn.classList.remove('loading');
            elements.submitBtn.classList.add('success');

            // Hide form and show success message
            setTimeout(() => {
                elements.form.style.display = 'none';
                elements.successMessage.classList.add('visible');
                state.isSubmitting = false;
            }, 800);
        }, 1500);
    }

    /**
     * Reset form to initial state
     */
    function resetForm() {
        // Hide success message
        elements.successMessage.classList.remove('visible');

        // Reset form
        elements.form.reset();
        elements.form.style.display = 'flex';

        // Reset button state
        elements.submitBtn.classList.remove('success');
        elements.submitBtn.disabled = false;

        // Clear all field states
        Object.keys(elements.inputs).forEach(field => {
            const input = elements.inputs[field];
            input.classList.remove('valid', 'invalid');
            elements.errors[field].classList.remove('visible');
            
            state.validationResults[field] = {
                isValid: false,
                isTouched: false
            };
        });

        state.isFormValid = false;
        state.isSubmitting = false;
    }

    // ============================================
    // Initialize on DOM Ready
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
