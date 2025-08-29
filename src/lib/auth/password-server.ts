import { createHash } from 'crypto';

/**
 * Server-side password hashing function using Node.js crypto module
 * Used for generating passwords on the server side (e.g., for auto-generated passwords)
 */
export function hashPasswordServer(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Server-side salted password hash function
 * Combines the password with a user-specific value before hashing
 */
export function saltAndHashPasswordServer(
  password: string,
  salt: string
): string {
  const saltedPassword = `${password}:${salt}`;
  return hashPasswordServer(saltedPassword);
}