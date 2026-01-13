export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(username: string | null | undefined): ValidationResult {
  const errors: string[] = [];

  if (!username) {
    errors.push("Username is required");
  } else {
    if (username.length < 3) {
      errors.push("Username must be at least 3 characters");
    }

    if (username.length > 30) {
      errors.push("Username cannot exceed 30 characters");
    }

    if (!USERNAME_REGEX.test(username)) {
      errors.push("Username can only contain letters, numbers, hyphens, and underscores");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEmail(email: string | null | undefined): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push("Email is required");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Invalid email format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validatePassword(password: string | null | undefined): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
}

export function validateCreateUserData(data: Partial<CreateUserData>): ValidationResult {
  const errors: string[] = [];

  const usernameResult = validateUsername(data.username);
  const emailResult = validateEmail(data.email);
  const passwordResult = validatePassword(data.password);

  errors.push(...usernameResult.errors);
  errors.push(...emailResult.errors);
  errors.push(...passwordResult.errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}
