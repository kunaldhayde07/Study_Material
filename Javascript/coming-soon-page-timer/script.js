/**
 * NovaPulse Coming Soon Page
 * Main JavaScript Module
 */

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    
    const CONFIG = {
        // Launch date: 30 days from now
        launchDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updateInterval: 1000,
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };

    // ============================================
    // DOM Elements
    // ============================================

    const elements = {
        // Countdown
        countdown: document.getElementById('countdown'),
        days: document.getElementById('days'),
        hours: document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds'),
        
        // Live message
        liveMessage: document.getElementById('liveMessage'),
        
        // Subscribe form
        subscribeSection: document.getElementById('subscribeSection'),
        subscribeForm: document.getElementById('subscribeForm'),
        emailInput: document.getElementById('emailInput'),
        emailError: document.getElementById('emailError'),
        subscribeBtn: document.getElementById('subscribeBtn'),
        successMessage: document.getElementById('successMessage')
    };

    // ============================================
    // State
    // ============================================

    let countdownInterval = null;
    let previousValues = {
        days: null,
        hours: null,
        minutes: null,
        seconds: null
    };

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Pad a number with leading zero if single digit
     */
    function padNumber(num) {
        return num.toString().padStart(2, '0');
    }

    /**
     * Calculate time remaining until launch date
     */
    function getTimeRemaining() {
        const now = new Date();
        const diff = CONFIG.launchDate - now;

        if (diff <= 0) {
            return {
                total: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0
            };
        }

        return {
            total: diff,
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60)
        };
    }

    /**
     * Add tick animation to element
     */
    function addTickAnimation(element) {
        element.classList.remove('tick');
        // Force reflow to restart animation
        void element.offsetWidth;
        element.classList.add('tick');
    }

    /**
     * Validate email format
     */
    function isValidEmail(email) {
        return CONFIG.emailRegex.test(email.trim());
    }

    // ============================================
    // Countdown Timer
    // ============================================

    /**
     * Update the countdown display
     */
    function updateCountdown() {
        const time = getTimeRemaining();

        // Check if countdown has ended
        if (time.total <= 0) {
            handleCountdownEnd();
            return;
        }

        // Update display values
        const newValues = {
            days: padNumber(time.days),
            hours: padNumber(time.hours),
            minutes: padNumber(time.minutes),
            seconds: padNumber(time.seconds)
        };

        // Update DOM with animations only when values change
        if (newValues.days !== previousValues.days) {
            elements.days.textContent = newValues.days;
            addTickAnimation(elements.days);
        }

        if (newValues.hours !== previousValues.hours) {
            elements.hours.textContent = newValues.hours;
            addTickAnimation(elements.hours);
        }

        if (newValues.minutes !== previousValues.minutes) {
            elements.minutes.textContent = newValues.minutes;
            addTickAnimation(elements.minutes);
        }

        if (newValues.seconds !== previousValues.seconds) {
            elements.seconds.textContent = newValues.seconds;
            addTickAnimation(elements.seconds);
        }

        previousValues = newValues;
    }

    /**
     * Handle countdown completion
     */
    function handleCountdownEnd() {
        // Stop the interval
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        // Hide countdown, show live message
        elements.countdown.classList.add('hidden');
        elements.liveMessage.classList.remove('hidden');
        elements.subscribeSection.classList.add('hidden');
    }

    /**
     * Initialize countdown timer
     */
    function initCountdown() {
        // Set initial values immediately
        updateCountdown();
        
        // Start interval for updates
        countdownInterval = setInterval(updateCountdown, CONFIG.updateInterval);
    }

    // ============================================
    // Form Handling
    // ============================================

    /**
     * Show email error state
     */
    function showEmailError() {
        elements.emailInput.classList.add('error');
        elements.emailInput.classList.remove('success');
        elements.emailError.classList.add('visible');
    }

    /**
     * Hide email error state
     */
    function hideEmailError() {
        elements.emailInput.classList.remove('error');
        elements.emailError.classList.remove('visible');
    }

    /**
     * Show success state
     */
    function showSuccessState() {
        elements.emailInput.classList.add('success');
        hideEmailError();
    }

    /**
     * Handle form submission
     */
    function handleFormSubmit(event) {
        event.preventDefault();

        const email = elements.emailInput.value.trim();

        // Validate email
        if (!email || !isValidEmail(email)) {
            showEmailError();
            elements.emailInput.focus();
            return;
        }

        // Disable button during "submission"
        elements.subscribeBtn.disabled = true;
        elements.subscribeBtn.querySelector('.btn-text').textContent = 'Subscribing...';

        // Simulate API call with timeout
        setTimeout(() => {
            // Show success message
            elements.subscribeForm.classList.add('hidden');
            elements.successMessage.classList.remove('hidden');
            showSuccessState();

            // Reset form after delay
            setTimeout(() => {
                resetForm();
            }, 5000);
        }, 800);
    }

    /**
     * Reset form to initial state
     */
    function resetForm() {
        elements.subscribeForm.classList.remove('hidden');
        elements.successMessage.classList.add('hidden');
        elements.emailInput.value = '';
        elements.emailInput.classList.remove('success', 'error');
        elements.subscribeBtn.disabled = false;
        elements.subscribeBtn.querySelector('.btn-text').textContent = 'Notify Me';
        hideEmailError();
    }

    /**
     * Handle email input changes
     */
    function handleEmailInput() {
        const email = elements.emailInput.value.trim();
        
        // Clear error when user starts typing
        if (elements.emailInput.classList.contains('error')) {
            hideEmailError();
        }

        // Show validation state if there's content
        if (email && isValidEmail(email)) {
            showSuccessState();
        } else {
            elements.emailInput.classList.remove('success');
        }
    }

    /**
     * Initialize form event listeners
     */
    function initForm() {
        elements.subscribeForm.addEventListener('submit', handleFormSubmit);
        elements.emailInput.addEventListener('input', handleEmailInput);
        
        // Clear error on focus
        elements.emailInput.addEventListener('focus', () => {
            if (elements.emailInput.classList.contains('error')) {
                hideEmailError();
            }
        });
    }

    // ============================================
    // Initialize Application
    // ============================================

    function init() {
        initCountdown();
        initForm();

        // Log launch date for debugging
        console.log(`NovaPulse launching: ${CONFIG.launchDate.toLocaleDateString()}`);
    }

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
