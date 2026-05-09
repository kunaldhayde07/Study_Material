/**
 * Registration Form Validator — script.js
 * Author: Senior Frontend Engineer
 *
 * Handles all real-time validation, strength meter,
 * password toggles, form submission, and success state.
 */

'use strict';

/* ============================================================
   DOM References
   ============================================================ */
const form              = document.getElementById('regForm');
const successPanel      = document.getElementById('successPanel');
const successSummary    = document.getElementById('successSummary');
const submitBtn         = document.getElementById('submitBtn');
const clearBtn          = document.getElementById('clearBtn');
const resetBtn          = document.getElementById('resetBtn');
const strengthMeter     = document.getElementById('strengthMeter');
const strengthLabel     = document.getElementById('strengthLabel');
const strengthBars      = [
  document.getElementById('sBar1'),
  document.getElementById('sBar2'),
  document.getElementById('sBar3'),
  document.getElementById('sBar4'),
];
const passwordRules = {
  length:  document.getElementById('rule-length'),
  upper:   document.getElementById('rule-upper'),
  lower:   document.getElementById('rule-lower'),
  number:  document.getElementById('rule-number'),
  special: document.getElementById('rule-special'),
};

/* ============================================================
   Validation Rules
   ============================================================ */

/**
 * Returns an error message string if invalid, or null if valid.
 * Each function is a pure, single-purpose validator.
 */
const validators = {

  fullName(value) {
    const trimmed = value.trim();
    if (!trimmed)          return 'Full name is required.';
    if (trimmed.length < 3) return 'Name must be at least 3 characters.';
    return null;
  },

  email(value) {
    const trimmed = value.trim();
    if (!trimmed) return 'Email address is required.';
    // Standard email regex — handles the vast majority of real-world addresses
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(trimmed)) return 'Please enter a valid email address.';
    return null;
  },

  username(value) {
    const trimmed = value.trim();
    if (!trimmed)           return 'Username is required.';
    if (/\s/.test(trimmed)) return 'Username cannot contain spaces.';
    if (trimmed.length < 4) return 'Username must be at least 4 characters.';
    return null;
  },

  password(value) {
    if (!value)              return 'Password is required.';
    if (value.length < 8)    return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter.';
    if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter.';
    if (!/[0-9]/.test(value)) return 'Password must include a number.';
    if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include a special character.';
    return null;
  },

  confirmPassword(value) {
    const passwordValue = document.getElementById('password').value;
    if (!value)                      return 'Please confirm your password.';
    if (value !== passwordValue)     return 'Passwords do not match.';
    return null;
  },

  phone(value) {
    const trimmed = value.trim();
    if (!trimmed)               return 'Phone number is required.';
    if (!/^\d{10}$/.test(trimmed)) return 'Phone number must be exactly 10 digits.';
    return null;
  },

  dob(value) {
    if (!value) return 'Date of birth is required.';
    const today   = new Date();
    const birth   = new Date(value);
    // Calculate exact age
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    if (age < 13) return 'You must be at least 13 years old to register.';
    if (age > 120) return 'Please enter a valid date of birth.';
    return null;
  },

  agreeTerms(checked) {
    if (!checked) return 'You must accept the terms to continue.';
    return null;
  },
};

/* ============================================================
   Password Strength Logic
   ============================================================ */

/**
 * Scores a password from 0–4 based on rule passes.
 * Returns { score, level, rules }
 */
function evaluatePasswordStrength(value) {
  const rules = {
    length:  value.length >= 8,
    upper:   /[A-Z]/.test(value),
    lower:   /[a-z]/.test(value),
    number:  /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };

  const score = Object.values(rules).filter(Boolean).length;

  let level = 'weak';
  if (score >= 4) level = 'medium';
  if (score === 5) level = 'strong';

  return { score, level, rules };
}

/**
 * Updates the visual strength meter and rule pills.
 */
function updateStrengthMeter(value) {
  if (!value) {
    strengthMeter.classList.remove('visible');
    strengthBars.forEach(bar => bar.className = 'strength-bar');
    strengthLabel.textContent = '–';
    strengthLabel.className = 'strength-label';
    Object.values(passwordRules).forEach(el => el.classList.remove('passed'));
    return;
  }

  const { score, level, rules } = evaluatePasswordStrength(value);
  strengthMeter.classList.add('visible');

  // Activate bars based on score (4 bars total; remap 0–5 → 0–4)
  const activeBars = score === 5 ? 4 : score === 4 ? 3 : score >= 3 ? 2 : score >= 2 ? 1 : 0;
  strengthBars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (i < activeBars) bar.classList.add(level);
  });

  const labels = { weak: 'Weak', medium: 'Medium', strong: 'Strong' };
  strengthLabel.textContent = labels[level];
  strengthLabel.className = `strength-label ${level}`;

  // Update rule pills
  Object.entries(rules).forEach(([key, passed]) => {
    const el = passwordRules[key];
    if (el) el.classList.toggle('passed', passed);
  });
}

/* ============================================================
   UI Helpers
   ============================================================ */

/**
 * Shows a validation error for a given field.
 */
function showError(fieldId, message) {
  const input    = document.getElementById(fieldId);
  const errorEl  = document.getElementById(`${fieldId}-error`);
  const statusEl = input?.parentElement?.querySelector('.field-status-icon');

  if (!input || !errorEl) return;

  input.classList.remove('is-valid');
  input.classList.add('is-invalid');

  errorEl.textContent = message;
  errorEl.classList.add('visible');

  if (statusEl) {
    statusEl.className = 'field-status-icon show-invalid';
  }
}

/**
 * Marks a field as successfully validated.
 */
function showSuccess(fieldId) {
  const input    = document.getElementById(fieldId);
  const errorEl  = document.getElementById(`${fieldId}-error`);
  const statusEl = input?.parentElement?.querySelector('.field-status-icon');

  if (!input || !errorEl) return;

  input.classList.remove('is-invalid');
  input.classList.add('is-valid');

  errorEl.textContent = '';
  errorEl.classList.remove('visible');

  if (statusEl) {
    statusEl.className = 'field-status-icon show-valid';
  }
}

/**
 * Clears all visual state from a field (neutral, no icon).
 */
function clearFieldState(fieldId) {
  const input    = document.getElementById(fieldId);
  const errorEl  = document.getElementById(`${fieldId}-error`);
  const statusEl = input?.parentElement?.querySelector('.field-status-icon');

  if (!input) return;

  input.classList.remove('is-valid', 'is-invalid');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
  if (statusEl) {
    statusEl.className = 'field-status-icon';
  }
}

/**
 * Runs a validator and applies the correct UI state.
 * Returns true if the field is valid.
 */
function validateField(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return false;

  const value  = fieldId === 'agreeTerms' ? input.checked : input.value;
  const validatorFn = validators[fieldId];
  if (!validatorFn) return true;

  const error = validatorFn(value);

  if (error) {
    showError(fieldId, error);
    return false;
  } else {
    showSuccess(fieldId);
    return true;
  }
}

/**
 * Adds a quick "shake" animation to an element.
 */
function shakeElement(el) {
  el.classList.remove('shake');
  // Force reflow so the animation re-triggers on repeat errors
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

/* ============================================================
   Password Toggle
   ============================================================ */

/**
 * Sets up show/hide password for a given input + toggle button pair.
 */
function setupPasswordToggle(inputId, toggleId) {
  const input  = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;

  const eyeShow = toggle.querySelector('.eye-show');
  const eyeHide = toggle.querySelector('.eye-hide');

  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    eyeShow.style.display = isPassword ? 'none' : 'block';
    eyeHide.style.display = isPassword ? 'block' : 'none';
    toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    input.focus();
  });
}

/* ============================================================
   Phone — Enforce numeric-only input
   ============================================================ */

function setupPhoneFilter() {
  const phoneInput = document.getElementById('phone');
  if (!phoneInput) return;

  phoneInput.addEventListener('input', () => {
    // Strip any non-digit characters as the user types
    const digits = phoneInput.value.replace(/\D/g, '');
    if (phoneInput.value !== digits) {
      phoneInput.value = digits;
    }
  });
}

/* ============================================================
   Real-Time Event Binding
   ============================================================ */

/**
 * Attach 'input' / 'change' listeners for live feedback.
 * Validation fires on input after the user has touched the field.
 */
function bindFieldListeners() {
  const textFields = ['fullName', 'email', 'username', 'phone', 'dob'];
  textFields.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    // Mark as touched on first blur, then validate on every input
    let touched = false;

    input.addEventListener('blur', () => {
      touched = true;
      validateField(id);
    });

    input.addEventListener('input', () => {
      if (touched) validateField(id);
    });
  });

  // Password — validate live after first interaction
  const passwordInput = document.getElementById('password');
  let passwordTouched = false;

  passwordInput.addEventListener('focus', () => { passwordTouched = true; });

  passwordInput.addEventListener('input', () => {
    updateStrengthMeter(passwordInput.value);
    if (passwordTouched) validateField('password');

    // Re-validate confirmPassword if it has content
    const confirmInput = document.getElementById('confirmPassword');
    if (confirmInput.value) validateField('confirmPassword');
  });

  passwordInput.addEventListener('blur', () => {
    validateField('password');
  });

  // Confirm password
  const confirmInput = document.getElementById('confirmPassword');
  let confirmTouched = false;

  confirmInput.addEventListener('blur', () => {
    confirmTouched = true;
    validateField('confirmPassword');
  });

  confirmInput.addEventListener('input', () => {
    if (confirmTouched) validateField('confirmPassword');
  });

  // Checkbox
  const checkbox = document.getElementById('agreeTerms');
  checkbox.addEventListener('change', () => validateField('agreeTerms'));
}

/* ============================================================
   Form Submission
   ============================================================ */

/**
 * Validate all fields at once and return whether the form is valid.
 * Also focuses the first invalid field.
 */
function validateAll() {
  const fields = ['fullName', 'email', 'username', 'phone', 'dob', 'password', 'confirmPassword', 'agreeTerms'];
  let firstInvalidId = null;

  const results = fields.map(id => {
    const valid = validateField(id);
    if (!valid && !firstInvalidId) firstInvalidId = id;
    return valid;
  });

  const allValid = results.every(Boolean);

  if (firstInvalidId) {
    const el = document.getElementById(firstInvalidId);
    el?.focus();
    const group = document.getElementById(`group-${firstInvalidId}`) || el?.closest('.field-group');
    if (group) shakeElement(group);
  }

  return allValid;
}

/**
 * Simulate an async API call (loading state → success).
 */
function simulateSubmit(data) {
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    showSuccessPanel(data);
  }, 1600);
}

/**
 * Build and display the success summary panel.
 */
function showSuccessPanel(data) {
  form.hidden = true;
  successPanel.hidden = false;

  // Clear previous summary rows
  successSummary.innerHTML = '';

  const displayRows = [
    { label: 'Full Name',   value: data.fullName },
    { label: 'Email',       value: data.email },
    { label: 'Username',    value: `@${data.username}` },
    { label: 'Phone',       value: data.phone },
    { label: 'Date of Birth', value: formatDate(data.dob) },
  ];

  displayRows.forEach(({ label, value }) => {
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `<span class="summary-key">${label}</span><span class="summary-val">${escapeHtml(value)}</span>`;
    successSummary.appendChild(row);
  });
}

/* ============================================================
   Utility Helpers
   ============================================================ */

/**
 * Formats an ISO date string (YYYY-MM-DD) to a readable format.
 */
function formatDate(isoString) {
  if (!isoString) return '—';
  const [year, month, day] = isoString.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Basic HTML escaping to prevent XSS in the summary panel.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Resets the form to its initial state completely.
 */
function resetForm() {
  form.reset();

  ['fullName', 'email', 'username', 'phone', 'dob', 'password', 'confirmPassword'].forEach(id => {
    clearFieldState(id);
  });

  // Reset checkbox error
  const termsError = document.getElementById('agreeTerms-error');
  if (termsError) { termsError.textContent = ''; termsError.classList.remove('visible'); }

  // Reset password visuals
  updateStrengthMeter('');
  const passwordInput = document.getElementById('password');
  const confirmInput  = document.getElementById('confirmPassword');
  passwordInput.type  = 'password';
  confirmInput.type   = 'password';

  // Reset eye icons
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.querySelector('.eye-show').style.display = 'block';
    btn.querySelector('.eye-hide').style.display = 'none';
    btn.setAttribute('aria-label', 'Show password');
  });

  // Hide success panel, show form
  successPanel.hidden = true;
  form.hidden = false;

  // Return focus to first field
  document.getElementById('fullName')?.focus();
}

/* ============================================================
   Event Listeners — Submit / Clear / Reset
   ============================================================ */

form.addEventListener('submit', event => {
  event.preventDefault();

  const isValid = validateAll();
  if (!isValid) return;

  const formData = new FormData(form);
  const data = {
    fullName:  formData.get('fullName')?.trim(),
    email:     formData.get('email')?.trim(),
    username:  formData.get('username')?.trim(),
    phone:     formData.get('phone')?.trim(),
    dob:       formData.get('dob'),
    password:  formData.get('password'),
  };

  simulateSubmit(data);
});

clearBtn.addEventListener('click', () => {
  resetForm();
});

resetBtn.addEventListener('click', () => {
  resetForm();
});

/* ============================================================
   Initialise
   ============================================================ */

function init() {
  setupPasswordToggle('password', 'togglePassword');
  setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');
  setupPhoneFilter();
  bindFieldListeners();

  // Set the max date for dob to today to block future dates via the picker
  const dobInput = document.getElementById('dob');
  if (dobInput) {
    const today = new Date().toISOString().split('T')[0];
    dobInput.setAttribute('max', today);
  }
}

// Kick everything off once the DOM is ready
document.addEventListener('DOMContentLoaded', init);
