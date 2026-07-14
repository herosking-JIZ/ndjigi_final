function validatePasswordStrength(password) {
  const violations = [];

  if (password.length < 12) violations.push('Minimum 12 caracteres');
  if (!/[A-Z]/.test(password)) violations.push('Au moins une majuscule');
  if (!/[a-z]/.test(password)) violations.push('Au moins une minuscule');
  if (!/\d/.test(password)) violations.push('Au moins un chiffre');
  if (!/[^A-Za-z0-9]/.test(password)) violations.push('Au moins un caractere special');

  return { isValid: violations.length === 0, violations };
}

module.exports = {
  validatePasswordStrength
};
