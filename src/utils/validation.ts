export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Enter a valid email address';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) return 'Name can only contain letters';
  return null;
};

export const validateAmount = (amount: string, max?: number): string | null => {
  const num = parseFloat(amount);
  if (!amount) return 'Amount is required';
  if (isNaN(num) || num <= 0) return 'Enter a valid positive amount';
  if (max !== undefined && num > max) return `Maximum allowed is $${max}`;
  return null;
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};