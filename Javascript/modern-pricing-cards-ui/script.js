/* =========================================
   Modern Pricing Cards — JavaScript
   ========================================= */

(function () {
  'use strict';

  // --- DOM References ---
  const toggle = document.getElementById('billingToggle');
  const labels = document.querySelectorAll('.toggle-label');
  const priceEls = document.querySelectorAll('.price-value');
  const periodEls = document.querySelectorAll('.price-period');
  const ctaButtons = document.querySelectorAll('.cta-button');

  // Billing state
  let isYearly = false;

  // --- Initialize ---
  function init() {
    setActiveLabel();
    toggle.addEventListener('click', handleToggle);
    ctaButtons.forEach(attachRipple);
  }

  // --- Toggle Handler ---
  function handleToggle() {
    isYearly = !isYearly;
    toggle.classList.toggle('active', isYearly);
    setActiveLabel();
    animatePrices();
  }

  // Highlight the active billing label
  function setActiveLabel() {
    labels.forEach(function (label) {
      var period = label.dataset.period;
      var shouldBeActive =
        (period === 'monthly' && !isYearly) ||
        (period === 'yearly' && isYearly);
      label.classList.toggle('active', shouldBeActive);
    });
  }

  // --- Price Animation ---
  function animatePrices() {
    var key = isYearly ? 'yearly' : 'monthly';

    priceEls.forEach(function (el) {
      var targetValue = parseInt(el.dataset[key], 10);

      // Slide out
      el.classList.add('animating');

      // After slide-out completes, update value and slide in
      setTimeout(function () {
        animateCount(el, targetValue);
        el.classList.remove('animating');
      }, 200);
    });

    // Update period text
    periodEls.forEach(function (el) {
      el.textContent = '/ month';
    });
  }

  // Simple counting animation from current to target
  function animateCount(el, target) {
    var current = parseInt(el.textContent, 10) || 0;
    var diff = target - current;

    // If no difference, just set it
    if (diff === 0) {
      el.textContent = target;
      return;
    }

    var steps = 12;
    var stepDuration = 25; // ms
    var increment = diff / steps;
    var step = 0;

    function tick() {
      step++;
      if (step >= steps) {
        el.textContent = target;
        return;
      }
      el.textContent = Math.round(current + increment * step);
      requestAnimationFrame(function () {
        setTimeout(tick, stepDuration);
      });
    }

    tick();
  }

  // --- Button Ripple Effect ---
  function attachRipple(button) {
    button.addEventListener('click', function (e) {
      var ripple = button.querySelector('.btn-ripple');
      if (!ripple) return;

      // Remove previous animation
      ripple.classList.remove('animating');

      // Calculate position relative to button
      var rect = button.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var x = e.clientX - rect.left - size / 2;
      var y = e.clientY - rect.top - size / 2;

      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      // Force reflow before re-adding class
      void ripple.offsetWidth;
      ripple.classList.add('animating');

      // Clean up after animation
      setTimeout(function () {
        ripple.classList.remove('animating');
      }, 600);
    });
  }

  // --- Boot ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
