"use client";

/**
 * Utility functions for client-side password hashing before transmission
 * Uses the Web Crypto API for secure hashing
 */

/**
 * Hashes a password using SHA-256 before sending to the server
 * This ensures passwords are never sent in plain text over the network
 *
 * @param password The user's plain text password
 * @returns A Promise that resolves to the hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  // Convert the password string to an ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Hash the password using SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert the hash to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

/**
 * Salted password hash function for added security
 * Combines the password with a user-specific value (like email) before hashing
 *
 * @param password The user's plain text password
 * @param salt A unique value to combine with the password (e.g., user's email)
 * @returns A Promise that resolves to the salted and hashed password string
 */
export async function saltAndHashPassword(
  password: string,
  salt: string
): Promise<string> {
  // Combine password with salt
  const saltedPassword = `${password}:${salt}`;

  // Hash the salted password
  return hashPassword(saltedPassword);
}