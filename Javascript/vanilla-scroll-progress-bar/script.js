/**
 * Scroll Progress Indicator
 * A production-ready UI component for visualizing scroll position
 */

(function() {
    'use strict';

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        progressBar: document.getElementById('progressBar'),
        progressFill: document.getElementById('progressFill'),
        circularIndicator: document.getElementById('circularIndicator'),
        progressRing: document.getElementById('progressRing'),
        circularPercent: document.getElementById('circularPercent'),
        percentageDisplay: document.getElementById('percentageDisplay'),
        percentValue: document.getElementById('percentValue'),
        scrollTopBtn: document.getElementById('scrollTopBtn'),
        toggleCircular: document.getElementById('toggleCircular'),
        togglePercentage: document.getElementById('togglePercentage'),
        siteHeader: document.getElementById('siteHeader')
    };

    // ============================================
    // Configuration
    // ============================================
    const config = {
        throttleDelay: 16, // ~60fps
        scrollThreshold: 300, // px before showing scroll-to-top
        ringCircumference: 2 * Math.PI * 26 // r=26 from SVG
    };

    // ============================================
    // State
    // ============================================
    const state = {
        isCircularVisible: false,
        isPercentageVisible: false,
        lastScrollTop: 0,
        ticking: false
    };

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Throttle function execution to improve performance
     */
    function throttle(callback, limit) {
        let waiting = false;
        return function(...args) {
            if (!waiting) {
                callback.apply(this, args);
                waiting = true;
                setTimeout(() => {
                    waiting = false;
                }, limit);
            }
        };
    }

    /**
     * Clamp a value between min and max
     */
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Safely get scroll percentage (handles edge cases)
     */
    function getScrollPercentage() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollableHeight = docHeight - winHeight;

        // Prevent division by zero for short pages
        if (scrollableHeight <= 0) {
            return 0;
        }

        const percentage = (scrollTop / scrollableHeight) * 100;
        return clamp(percentage, 0, 100);
    }

    /**
     * Determine progress bar color state based on scroll position
     */
    function getProgressState(percentage) {
        if (percentage < 33) return 'start';
        if (percentage < 66) return 'mid';
        return 'end';
    }

    // ============================================
    // Update Functions
    // ============================================

    /**
     * Update the linear progress bar
     */
    function updateProgressBar(percentage) {
        if (!elements.progressFill) return;

        elements.progressFill.style.width = `${percentage}%`;
        elements.progressFill.setAttribute('data-state', getProgressState(percentage));
        elements.progressBar.setAttribute('aria-valuenow', Math.round(percentage));
    }

    /**
     * Update the circular progress indicator
     */
    function updateCircularIndicator(percentage) {
        if (!elements.progressRing || !elements.circularPercent) return;

        const offset = config.ringCircumference - (percentage / 100) * config.ringCircumference;
        elements.progressRing.style.strokeDashoffset = offset;
        elements.circularPercent.textContent = `${Math.round(percentage)}%`;
    }

    /**
     * Update the percentage display
     */
    function updatePercentageDisplay(percentage) {
        if (!elements.percentValue) return;

        elements.percentValue.textContent = Math.round(percentage);
    }

    /**
     * Update scroll-to-top button visibility
     */
    function updateScrollTopButton(scrollTop) {
        if (!elements.scrollTopBtn) return;

        if (scrollTop > config.scrollThreshold) {
            elements.scrollTopBtn.classList.add('visible');
        } else {
            elements.scrollTopBtn.classList.remove('visible');
        }
    }

    /**
     * Update header shadow on scroll
     */
    function updateHeaderState(scrollTop) {
        if (!elements.siteHeader) return;

        if (scrollTop > 10) {
            elements.siteHeader.classList.add('scrolled');
        } else {
            elements.siteHeader.classList.remove('scrolled');
        }

        state.lastScrollTop = scrollTop;
    }

    /**
     * Main scroll handler - orchestrates all updates
     */
    function handleScroll() {
        if (state.ticking) return;

        requestAnimationFrame(() => {
            const percentage = getScrollPercentage();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;

            // Update all progress indicators
            updateProgressBar(percentage);
            updateCircularIndicator(percentage);
            updatePercentageDisplay(percentage);
            updateScrollTopButton(scrollTop);
            updateHeaderState(scrollTop);

            state.ticking = false;
        });

        state.ticking = true;
    }

    // ============================================
    // Toggle Functions
    // ============================================

    /**
     * Toggle circular indicator visibility
     */
    function toggleCircularIndicator() {
        state.isCircularVisible = !state.isCircularVisible;

        if (state.isCircularVisible) {
            elements.circularIndicator.classList.remove('hidden');
            elements.toggleCircular.classList.add('active');
        } else {
            elements.circularIndicator.classList.add('hidden');
            elements.toggleCircular.classList.remove('active');
        }

        // Store preference
        try {
            localStorage.setItem('scrollProgress_circular', state.isCircularVisible);
        } catch (e) {
            // localStorage not available, silently continue
        }
    }

    /**
     * Toggle percentage display visibility
     */
    function togglePercentageDisplay() {
        state.isPercentageVisible = !state.isPercentageVisible;

        if (state.isPercentageVisible) {
            elements.percentageDisplay.classList.remove('hidden');
            elements.togglePercentage.classList.add('active');
        } else {
            elements.percentageDisplay.classList.add('hidden');
            elements.togglePercentage.classList.remove('active');
        }

        // Store preference
        try {
            localStorage.setItem('scrollProgress_percentage', state.isPercentageVisible);
        } catch (e) {
            // localStorage not available, silently continue
        }
    }

    // ============================================
    // Scroll to Top
    // ============================================

    /**
     * Smooth scroll to top of page
     */
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // ============================================
    // Initialization
    // ============================================

    /**
     * Load saved user preferences
     */
    function loadPreferences() {
        try {
            const savedCircular = localStorage.getItem('scrollProgress_circular');
            const savedPercentage = localStorage.getItem('scrollProgress_percentage');

            if (savedCircular === 'true') {
                toggleCircularIndicator();
            }

            if (savedPercentage === 'true') {
                togglePercentageDisplay();
            }
        } catch (e) {
            // localStorage not available, use defaults
        }
    }

    /**
     * Set up event listeners
     */
    function initEventListeners() {
        // Scroll event with throttling for performance
        window.addEventListener('scroll', throttle(handleScroll, config.throttleDelay), { passive: true });

        // Resize handler (recalculate on viewport change)
        window.addEventListener('resize', throttle(handleScroll, 100), { passive: true });

        // Toggle buttons
        if (elements.toggleCircular) {
            elements.toggleCircular.addEventListener('click', toggleCircularIndicator);
        }

        if (elements.togglePercentage) {
            elements.togglePercentage.addEventListener('click', togglePercentageDisplay);
        }

        // Scroll to top button
        if (elements.scrollTopBtn) {
            elements.scrollTopBtn.addEventListener('click', scrollToTop);
        }

        // Keyboard accessibility for scroll to top
        document.addEventListener('keydown', (e) => {
            // Press 'Home' key to scroll to top
            if (e.key === 'Home' && !e.ctrlKey && !e.metaKey) {
                const activeElement = document.activeElement;
                const isInputFocused = activeElement.tagName === 'INPUT' || 
                                       activeElement.tagName === 'TEXTAREA' ||
                                       activeElement.isContentEditable;
                
                if (!isInputFocused) {
                    e.preventDefault();
                    scrollToTop();
                }
            }
        });
    }

    /**
     * Initialize the component
     */
    function init() {
        // Ensure DOM is ready
        if (!elements.progressFill) {
            console.warn('Scroll Progress: Required elements not found');
            return;
        }

        // Set ring circumference for circular indicator
        if (elements.progressRing) {
            elements.progressRing.style.strokeDasharray = config.ringCircumference;
            elements.progressRing.style.strokeDashoffset = config.ringCircumference;
        }

        // Set up all event listeners
        initEventListeners();

        // Load user preferences
        loadPreferences();

        // Initial calculation
        handleScroll();
    }

    // ============================================
    // Bootstrap
    // ============================================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
