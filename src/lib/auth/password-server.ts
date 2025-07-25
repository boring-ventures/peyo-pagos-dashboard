import { createHash } from "crypto";

/**
 * Server-side utility functions for password hashing
 * Uses Node.js crypto module for secure hashing
 */

/**
 * Hashes a password using SHA-256 on the server-side
 * This ensures passwords are never stored in plain text
 *
 * @param password The password string to hash
 * @returns The hashed password string
 */
export function hashPasswordServer(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/**
 * Salted password hash function for added security (server-side)
 * Combines the password with a user-specific value (like email) before hashing
 *
 * @param password The password string to hash
 * @param salt A unique value to combine with the password (e.g., user's email)
 * @returns The salted and hashed password string
 */
export function saltAndHashPasswordServer(
  password: string,
  salt: string
): string {
  // Combine password with salt
  const saltedPassword = `${password}:${salt}`;

  // Hash the salted password
  return hashPasswordServer(saltedPassword);
}
