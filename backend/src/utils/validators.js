function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

function validateName(name) {
  if (typeof name !== 'string') {
    return { valid: false, message: 'Name must be a string' };
  }
  if (name.trim().length === 0) {
    return { valid: false, message: 'Name cannot be empty' };
  }
  if (name.trim().length > 120) {
    return { valid: false, message: 'Name must be less than 120 characters' };
  }
  return { valid: true };
}

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
};