const form = document.getElementById('signup-form');
const emailInput = document.getElementById('email');
const nameInput = document.getElementById('name');
const emailField = emailInput.closest('.field');
const emailError = document.getElementById('email-error');
const formStatus = document.getElementById('form-status');
const submitButton = document.getElementById('submit-button');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFieldState(field, state) {
  field.classList.remove('is-valid', 'is-invalid');

  if (state) {
    field.classList.add(state);
  }
}

function showFormStatus(message, type) {
  formStatus.textContent = message;
  formStatus.classList.remove('is-success', 'is-error', 'is-visible');

  if (type === 'success' || type === 'error') {
    formStatus.classList.add(`is-${type}`, 'is-visible');
    return;
  }

  if (message) {
    formStatus.classList.add('is-visible');
  }
}

function validateEmail(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Email is required.';
  }

  if (!emailPattern.test(trimmedValue)) {
    return 'Enter a valid email address.';
  }

  return '';
}

function updateEmailValidation() {
  const errorMessage = validateEmail(emailInput.value);

  if (errorMessage) {
    emailError.textContent = errorMessage;
    setFieldState(emailField, 'is-invalid');
    return false;
  }

  emailError.textContent = '';
  setFieldState(emailField, emailInput.value.trim() ? 'is-valid' : '');
  return true;
}

function clearValidationFeedback() {
  emailError.textContent = '';
  emailField.classList.remove('is-invalid', 'is-valid');
}

function clearStatusMessage() {
  showFormStatus('', '');
}

function resetFormState() {
  form.reset();
  clearValidationFeedback();
  nameInput.blur();
  emailInput.blur();
}

emailInput.addEventListener('input', updateEmailValidation);
emailInput.addEventListener('input', clearStatusMessage);
nameInput.addEventListener('input', clearStatusMessage);

emailInput.addEventListener('blur', () => {
  if (emailInput.value.trim()) {
    updateEmailValidation();
  }
});

submitButton.addEventListener('pointerdown', () => {
  submitButton.classList.add('is-pressed');
});

['pointerup', 'pointercancel', 'mouseleave'].forEach((eventName) => {
  submitButton.addEventListener(eventName, () => {
    submitButton.classList.remove('is-pressed');
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const isEmailValid = updateEmailValidation();

  if (!isEmailValid) {
    showFormStatus('Please fix the highlighted email field.', 'error');
    emailInput.focus();
    return;
  }

  const subscriberName = nameInput.value.trim();
  const message = subscriberName
    ? `Thanks, ${subscriberName}. You are subscribed.`
    : 'Thanks. You are subscribed.';

  showFormStatus(message, 'success');
  resetFormState();
});